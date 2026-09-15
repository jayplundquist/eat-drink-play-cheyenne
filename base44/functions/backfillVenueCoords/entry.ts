import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// Nominatim's usage policy is a hard limit of 1 request/second for an app like
// this one. That's why the function works in small batches instead of trying to
// geocode the whole venue table in one invocation: an admin calls it repeatedly
// until `remaining` comes back 0.

const NOMINATIM_DELAY_MS = 1100;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function geocode(address: string) {
  const params = new URLSearchParams();
  params.set('street', address);
  params.set('city', 'Cheyenne');
  params.set('state', 'WY');
  params.set('country', 'US');
  params.set('format', 'json');
  params.set('limit', '1');

  const resp = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`, {
    headers: {
      'User-Agent': 'EatDrinkPlayCheyenne/1.0 (venue-coord-backfill)',
      Accept: 'application/json',
    },
  });

  if (!resp.ok) {
    return { ok: false, reason: `geocoder returned ${resp.status}` };
  }

  const data = await resp.json();
  if (!data || data.length === 0) {
    return { ok: false, reason: 'no match' };
  }

  return {
    ok: true,
    lat: parseFloat(data[0].lat),
    lng: parseFloat(data[0].lon),
    display_name: data[0].display_name,
  };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const payload = await req.json().catch(() => ({}));
    const batchSize = Math.min(Number(payload?.batchSize) || 20, 40);
    const dryRun = payload?.dryRun === true;

    const venues = await base44.asServiceRole.entities.Venue.list('name', 500);

    // Only venues that still need coordinates and have something to geocode from.
    const needsCoords = venues.filter(
      (v: any) =>
        typeof v.lat !== 'number' &&
        typeof v.lng !== 'number' &&
        v.address &&
        !v.permanently_closed
    );

    const batch = needsCoords.slice(0, batchSize);
    const updates: Array<{ id: string; lat: number; lng: number }> = [];
    const skipped: Array<{ name: string; address: string; reason: string }> = [];

    for (const venue of batch) {
      const result = await geocode(venue.address);

      if (result.ok) {
        updates.push({ id: venue.id, lat: result.lat!, lng: result.lng! });
      } else {
        // Never fall back to a guessed centroid. A venue with no pin is honest;
        // a venue pinned to the wrong block sends people to the wrong door.
        skipped.push({ name: venue.name, address: venue.address, reason: result.reason! });
      }

      await sleep(NOMINATIM_DELAY_MS);
    }

    if (updates.length > 0 && !dryRun) {
      await base44.asServiceRole.entities.Venue.bulkUpdate(updates);
    }

    return Response.json({
      message: dryRun
        ? `Dry run: ${updates.length} would be updated, ${skipped.length} need manual pins.`
        : `Updated ${updates.length} venues. ${skipped.length} need manual pins.`,
      updated: updates.length,
      skipped,
      remaining: Math.max(needsCoords.length - batch.length, 0),
      totalMissingCoords: needsCoords.length,
    });
  } catch (error) {
    console.error('backfillVenueCoords error', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
