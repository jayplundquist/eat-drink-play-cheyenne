import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

const CHEYENNE_FALLBACK = { lat: 41.14, lng: -104.79, display_name: 'Cheyenne, WY (approximate — verify pin)' };

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Sign in to post a garage sale' }, { status: 401 });

    const payload = await req.json();
    const { street, city, state, zip } = payload || {};
    if (!street && !city) {
      return Response.json({ error: 'Address required' }, { status: 400 });
    }

    const params = new URLSearchParams();
    if (street) params.set('street', street);
    if (city) params.set('city', city);
    if (state) params.set('state', state);
    if (zip) params.set('postalcode', zip);
    params.set('country', 'US');
    params.set('format', 'json');
    params.set('limit', '1');
    params.set('addressdetails', '1');

    const url = `https://nominatim.openstreetmap.org/search?${params.toString()}`;
    const resp = await fetch(url, {
      headers: {
        'User-Agent': 'EatDrinkPlayCheyenne/1.0 (garage-sale-geocoder)',
        Accept: 'application/json',
      },
    });

    if (!resp.ok) {
      console.error('geocodeGarageSale: nominatim status', resp.status);
      return Response.json({ ...CHEYENNE_FALLBACK, error: 'Geocoder unavailable, using approximate location' }, { status: 200 });
    }

    const data = await resp.json();
    if (!data || data.length === 0) {
      return Response.json({ ...CHEYENNE_FALLBACK, error: 'No exact match found — verify the pin' }, { status: 200 });
    }

    const hit = data[0];
    return Response.json({
      lat: parseFloat(hit.lat),
      lng: parseFloat(hit.lon),
      display_name: hit.display_name,
      postcode: hit.address?.postcode || '',
    });
  } catch (error) {
    console.error('geocodeGarageSale error', error);
    return Response.json({ ...CHEYENNE_FALLBACK, error: error.message }, { status: 500 });
  }
}