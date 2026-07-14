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
    console.log(`Starting monthly venue sync (batch of ${BATCH_SIZE}). Scheduled: ${isScheduled}`);

    // Fetch all venues — sort alphabetically, then by last_synced_date (oldest/null first)
    const venues = await base44.asServiceRole.entities.Venue.list('name', 500);

    const sorted = venues
      .slice()
      .sort((a, b) => {
        const aDate = a.last_synced_date ? new Date(a.last_synced_date).getTime() : 0;
        const bDate = b.last_synced_date ? new Date(b.last_synced_date).getTime() : 0;
        if (aDate !== bDate) return aDate - bDate;
        return (a.name || '').localeCompare(b.name || '');
      });

    const batch = sorted.slice(0, BATCH_SIZE);
    console.log(`Selected ${batch.length} venues to sync:`, batch.map(v => v.name).join(', '));

    // Process venues concurrently in small chunks to keep each call fast
    const CONCURRENCY = 5;
    const results = [];

    const syncOne = async (venue) => {
      try {
        const locationHint = venue.address ? `${venue.address}, Cheyenne, WY` : 'Cheyenne, Wyoming';

        const llmRes = await base44.asServiceRole.integrations.Core.InvokeLLM({
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

        const update = { last_synced_date: new Date().toISOString() };

        if (llmRes.description && llmRes.description.trim()) update.description = llmRes.description.trim();
        if (llmRes.website && llmRes.website.trim()) update.website = llmRes.website.trim();
        if (llmRes.phone && llmRes.phone.trim()) update.phone = llmRes.phone.trim();

        await base44.asServiceRole.entities.Venue.update(venue.id, update);
        console.log(`Synced: ${venue.name}`);
        return { name: venue.name, success: true, updated: Object.keys(update).filter(k => k !== 'last_synced_date') };
      } catch (err) {
        console.error(`Sync failed for ${venue.name}:`, err.message);
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