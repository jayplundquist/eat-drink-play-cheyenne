import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Allow scheduled runs (no user) or admin manual triggers
    let isScheduled = false;
    try {
      const user = await base44.auth.me();
      if (user && user.role !== 'admin') {
        return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
      }
    } catch {
      // No user token — this is a scheduled run
      isScheduled = true;
    }

    // Allow manual triggers to specify a different batch size
    let body = {};
    try { body = await req.json(); } catch {}
    const BATCH_SIZE = body.batch_size || 10;
    const venueIds = Array.isArray(body.venue_ids) && body.venue_ids.length > 0 ? body.venue_ids : null;
    console.log(`Starting venue sync (batch of ${BATCH_SIZE}, ${venueIds ? 'targeted' : 'scheduled'}). Scheduled: ${isScheduled}`);

    let batch;

    if (venueIds) {
      // Retry specific failed venues by ID
      const all = await base44.asServiceRole.entities.Venue.list('name', 500);
      batch = all.filter(v => venueIds.includes(v.id));
    } else {
      // Fetch all venues — sort alphabetically, then by last_synced_date (oldest/null first)
      const venues = await base44.asServiceRole.entities.Venue.list('name', 500);
      const sorted = venues
        .slice()
        .sort((a, b) => {
          // Failed venues get retried first so the system self-heals
          const aFailed = a.sync_error ? 1 : 0;
          const bFailed = b.sync_error ? 1 : 0;
          if (aFailed !== bFailed) return bFailed - aFailed;
          const aDate = a.last_synced_date ? new Date(a.last_synced_date).getTime() : 0;
          const bDate = b.last_synced_date ? new Date(b.last_synced_date).getTime() : 0;
          if (aDate !== bDate) return aDate - bDate;
          return (a.name || '').localeCompare(b.name || '');
        });
      batch = sorted.slice(0, BATCH_SIZE);
    }
    console.log(`Selected ${batch.length} venues to sync:`, batch.map(v => v.name).join(', '));

    // Process venues concurrently in small chunks to keep each call fast
    const CONCURRENCY = 3;
    const results = [];

    const syncOne = async (venue) => {
      const locationHint = venue.address ? `${venue.address}, Cheyenne, WY` : 'Cheyenne, Wyoming';
      // Give the LLM the info already on file so it can verify/enrich instead of
      // searching blind — this is what makes venues with generic names findable.
      const onFile = [
        venue.website && `Existing website on file: ${venue.website}`,
        venue.phone && `Existing phone on file: ${venue.phone}`,
        venue.description && `Current description: ${venue.description}`,
      ].filter(Boolean).join('\n');
      const MAX_ATTEMPTS = 3;
      let llmRes = null;
      let lastErr = null;

      // Retry the web-search lookup to recover from transient failures (timeouts, rate limits)
      for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
        try {
          llmRes = await base44.asServiceRole.integrations.Core.InvokeLLM({
            prompt: `You are a local guide researcher for Cheyenne, Wyoming. Look up "${venue.name}" located at ${locationHint}.${onFile ? `\n\nWe already have this on file:\n${onFile}\n\nVerify this against the web and correct or enrich it if it is outdated, incomplete, or wrong.` : `\n\nSearch the web for this venue.`}\n\nReturn the official website URL, a phone number, and a compelling 2-3 sentence description based on what you find. Return only verified information. If you truly cannot find something, return an empty string for that field.`,
            add_context_from_internet: true,
            model: 'gemini_3_flash',
            response_json_schema: {
              type: 'object',
              properties: {
                description: { type: 'string' },
                website: { type: 'string' },
                phone: { type: 'string' }
              }
            }
          });
          lastErr = null;
          break;
        } catch (err) {
          lastErr = err;
          console.warn(`Attempt ${attempt} failed for ${venue.name}: ${err.message}`);
          if (attempt < MAX_ATTEMPTS) await new Promise(r => setTimeout(r, 1000 * attempt));
        }
      }

      try {
        if (lastErr) throw lastErr;

        const update = { last_synced_date: new Date().toISOString(), sync_error: "", last_sync_changes: [] };
        const changes = [];

        const newDesc = llmRes.description?.trim() || '';
        if (newDesc && newDesc !== (venue.description || '').trim()) {
          update.description = newDesc;
          changes.push('description');
        }
        const newWeb = llmRes.website?.trim() || '';
        if (newWeb && newWeb !== (venue.website || '').trim()) {
          update.website = newWeb;
          changes.push('website');
        }
        const newPhone = llmRes.phone?.trim() || '';
        if (newPhone && newPhone !== (venue.phone || '').trim()) {
          update.phone = newPhone;
          changes.push('phone');
        }
        update.last_sync_changes = changes;

        // Record a reason when the web search found nothing usable so admins
        // can see why a venue never updates (it isn't an error — just no data).
        if (changes.length === 0 && !newDesc && !newWeb && !newPhone) {
          update.sync_error = "No web results found for this venue";
        }

        await base44.asServiceRole.entities.Venue.update(venue.id, update);
        console.log(`Synced: ${venue.name} (${changes.length} changes)`);
        return { name: venue.name, success: true, updated: changes };
      } catch (err) {
        console.error(`Sync failed for ${venue.name}:`, err.message);
        // Mark as synced and record the error so it doesn't block the queue
        try {
          await base44.asServiceRole.entities.Venue.update(venue.id, {
            last_synced_date: new Date().toISOString(),
            sync_error: err.message || 'Unknown error'
          });
        } catch {}
        return { name: venue.name, success: false, error: err.message };
      }
    };

    for (let i = 0; i < batch.length; i += CONCURRENCY) {
      const chunk = batch.slice(i, i + CONCURRENCY);
      const chunkResults = await Promise.all(chunk.map(syncOne));
      results.push(...chunkResults);
    }

    return Response.json({
      message: `Synced ${results.filter(r => r.success).length} of ${batch.length} venues`,
      results
    });
  } catch (error) {
    console.error('Venue sync error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});