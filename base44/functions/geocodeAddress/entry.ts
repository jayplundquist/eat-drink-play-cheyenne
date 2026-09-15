import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// This function previously hashed the address string into coordinates scattered
// around a Cheyenne centroid. It looked like it worked — every address got a
// plausible-looking pin — but the pins were invented. It now geocodes for real
// against Nominatim, matching geocodeGarageSale.
//
// Callers must handle a null result rather than assume coordinates come back.
// A missing pin is correct when we don't know where something is.

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await req.json();
    const { address, city, state, zip } = payload || {};

    if (!address) {
      return Response.json({ coordinates: null, error: 'Address required' }, { status: 400 });
    }

    const params = new URLSearchParams();
    params.set('street', address);
    params.set('city', city || 'Cheyenne');
    params.set('state', state || 'WY');
    if (zip) params.set('postalcode', zip);
    params.set('country', 'US');
    params.set('format', 'json');
    params.set('limit', '1');

    const resp = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`, {
      headers: {
        'User-Agent': 'EatDrinkPlayCheyenne/1.0 (venue-geocoder)',
        Accept: 'application/json',
      },
    });

    if (!resp.ok) {
      console.error('geocodeAddress: nominatim status', resp.status);
      return Response.json({ coordinates: null, error: 'Geocoder unavailable' });
    }

    const data = await resp.json();
    if (!data || data.length === 0) {
      return Response.json({ coordinates: null, error: 'No match found' });
    }

    return Response.json({
      coordinates: [parseFloat(data[0].lat), parseFloat(data[0].lon)],
      display_name: data[0].display_name,
    });
  } catch (error) {
    console.error('Geocoding error:', error);
    return Response.json({ coordinates: null, error: error.message }, { status: 500 });
  }
});
