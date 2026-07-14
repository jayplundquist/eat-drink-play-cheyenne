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
      const MAX_ATTEMPTS = 3;
      let llmRes = null;
      let lastErr = null;

      // Retry the web-search lookup to recover from transient failures (timeouts, rate limits)
      for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
        try {
          llmRes = await base44.asServiceRole.integrations.Core.InvokeLLM({
            prompt: `You are a local guide researcher. Search the web for "${venue.name}" located at ${locationHint}. Find the official website, phone number, and write a compelling 2-3 sentence description of this venue based on what you find. Return only verified information. If you cannot find something, return an empty string for that field.`,
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

        const update = { last_synced_date: new Date().toISOString(), sync_error: "" };

        if (llmRes.description && llmRes.description.trim()) update.description = llmRes.description.trim();
        if (llmRes.website && llmRes.website.trim()) update.website = llmRes.website.trim();
        if (llmRes.phone && llmRes.phone.trim()) update.phone = llmRes.phone.trim();

        await base44.asServiceRole.entities.Venue.update(venue.id, update);
        console.log(`Synced: ${venue.name}`);
        return { name: venue.name, success: true, updated: Object.keys(update).filter(k => k !== 'last_synced_date' && k !== 'sync_error') };
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