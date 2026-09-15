import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// Nightly cleanup. Two jobs:
//
//   1. Mark ChuckWagonStop rows as 'expired' once their last date has passed,
//      so the public map query stays small and old stops stop competing for
//      attention with real ones.
//
//   2. Clear stale live pins. A vendor who forgets to tap "I'm done" would
//      otherwise stay flagged is_live forever. The public map already filters
//      on a 6-hour staleness window, so this is belt-and-braces — but it keeps
//      the stored data honest for anything that queries is_live directly.
//
// Expired stops are NOT deleted. The vendor's own dashboard history is worth
// keeping, and a deleted row can't be un-deleted if this runs on bad data.

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const now = new Date();
    const nowIso = now.toISOString();

    // --- 1. Expire past stops ---
    const stops = await base44.asServiceRole.entities.ChuckWagonStop.list('-created_date', 500);

    const toExpire = stops
      .filter((s: any) => s.status === 'active' || s.status === 'draft')
      .filter((s: any) => {
        if (s.expires_at) return new Date(s.expires_at) < now;
        // Fall back to the last scheduled date if expires_at was never written.
        const dates = (s.stop_dates || []).slice().sort();
        const last = dates[dates.length - 1];
        if (!last) return false;
        return new Date(`${last}T23:59:59`) < now;
      })
      .map((s: any) => ({ id: s.id, status: 'expired' }));

    if (toExpire.length > 0) {
      await base44.asServiceRole.entities.ChuckWagonStop.bulkUpdate(toExpire);
    }

    // --- 2. Clear stale live pins ---
    const staleCutoff = new Date(now.getTime() - 6 * 60 * 60 * 1000);
    const venues = await base44.asServiceRole.entities.Venue.list('name', 500);

    const toUnlive = venues
      .filter((v: any) => v.is_live)
      .filter((v: any) => !v.live_updated_at || new Date(v.live_updated_at) < staleCutoff)
      .map((v: any) => ({ id: v.id, is_live: false, live_updated_at: nowIso }));

    if (toUnlive.length > 0) {
      await base44.asServiceRole.entities.Venue.bulkUpdate(toUnlive);
    }

    return Response.json({
      message: `Expired ${toExpire.length} stops. Cleared ${toUnlive.length} stale live pins.`,
      expiredStops: toExpire.length,
      clearedLivePins: toUnlive.length,
      ranAt: nowIso,
    });
  } catch (error) {
    console.error('expireChuckWagonStops error', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
