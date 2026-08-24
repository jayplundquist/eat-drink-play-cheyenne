import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

const SOURCE_URL = 'https://wyotraders.com/garage_sales';
const CHEYENNE_FALLBACK = { lat: 41.14, lng: -104.79 };
const MONTHS = {
  january: 1, february: 2, march: 3, april: 4, may: 5, june: 6,
  july: 7, august: 8, september: 9, october: 10, november: 11, december: 12,
};

function slugify(text) {
  return (text || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

// Parse a date header like "Friday-Saturday, August 21-22" or "Saturday, August 22"
function parseDates(headerText) {
  const m = headerText.match(
    /(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d+)(?:\s*-\s*(\d+))?/i
  );
  if (!m) return [];
  const month = MONTHS[m[1].toLowerCase()];
  const startDay = parseInt(m[2], 10);
  const endDay = m[3] ? parseInt(m[3], 10) : startDay;
  let year = new Date().getFullYear();
  const first = new Date(Date.UTC(year, month - 1, startDay));
  if (first < new Date(Date.now() - 14 * 86400000)) year++;
  const dates = [];
  for (let d = startDay; d <= endDay; d++) {
    dates.push(new Date(Date.UTC(year, month - 1, d)).toISOString().slice(0, 10));
  }
  return dates;
}

// Parse a time cell like "8-4", "8:30-?", "8-4/8-4/8/2", "9-3/9-3/9-2"
function parseTimes(timeStr) {
  const tokens = [];
  const re = /(\d{1,2})(?::(\d{2}))?/g;
  let m;
  while ((m = re.exec(timeStr)) !== null) {
    tokens.push({ h: parseInt(m[1], 10), min: m[2] ? parseInt(m[2], 10) : 0 });
  }
  if (tokens.length === 0) return { start_time: '08:00', end_time: '14:00' };
  const starts = [];
  const ends = [];
  for (let i = 0; i < tokens.length; i += 2) {
    starts.push(tokens[i]);
    if (tokens[i + 1]) ends.push(tokens[i + 1]);
  }
  const startObj = starts.reduce((a, b) =>
    a.h < b.h || (a.h === b.h && a.min <= b.min) ? a : b
  );
  const endObj = ends.length > 0
    ? ends.reduce((a, b) => (a.h > b.h || (a.h === b.h && a.min >= b.min) ? a : b))
    : { h: 14, min: 0 };
  const toHHMM = (obj, isEnd, startH) => {
    let h = obj.h;
    if (isEnd && h < startH) h += 12; // PM end
    return `${String(h).padStart(2, '0')}:${String(obj.min).padStart(2, '0')}`;
  };
  return {
    start_time: toHHMM(startObj, false, startObj.h),
    end_time: toHHMM(endObj, true, startObj.h),
  };
}

// Parse an anchor address like "5725 Continental Pl.", "4710 Conrad Rd., Burns, WY", "720 W. 26th St., in alley"
function parseAddress(anchorText) {
  const parts = anchorText.split(',').map((s) => s.trim()).filter(Boolean);
  const street = parts[0] || '';
  let city = 'Cheyenne';
  let state = 'WY';
  let zip = '';
  let note = '';
  for (let i = 1; i < parts.length; i++) {
    const p = parts[i];
    if (/^\d{5}$/.test(p)) zip = p;
    else if (/^[A-Za-z]{2}$/.test(p) && p.length === 2) state = p.toUpperCase();
    else if (p.toLowerCase() === 'in alley') note = 'Located in the alley';
    else city = p;
  }
  return { street, city, state, zip, note };
}

async function geocode(street, city, state, zip) {
  try {
    const params = new URLSearchParams();
    if (street) params.set('street', street);
    if (city) params.set('city', city);
    if (state) params.set('state', state);
    if (zip) params.set('postalcode', zip);
    params.set('country', 'US');
    params.set('format', 'json');
    params.set('limit', '1');
    params.set('addressdetails', '1');
    const resp = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`, {
      headers: {
        'User-Agent': 'EatDrinkPlayCheyenne/1.0 (wyotraders-scraper)',
        Accept: 'application/json',
      },
    });
    if (!resp.ok) return CHEYENNE_FALLBACK;
    const data = await resp.json();
    if (!data || data.length === 0) return CHEYENNE_FALLBACK;
    return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
  } catch {
    return CHEYENNE_FALLBACK;
  }
}

function decodeEntities(s) {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .trim();
}

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);

    // Allow admin users (manual) or no-user (scheduled automation) — block non-admins.
    let user = null;
    try { user = await base44.auth.me(); } catch { user = null; }
    if (user && user.role !== 'admin') {
      return Response.json({ error: 'Admin only' }, { status: 403 });
    }

    const payload = await req.json().catch(() => ({}));
    const status = payload?.status === 'draft' ? 'draft' : 'active';

    // 1. Fetch the page
    const resp = await fetch(SOURCE_URL, {
      headers: { 'User-Agent': 'EatDrinkPlayCheyenne/1.0 (wyotraders-scraper)' },
    });
    if (!resp.ok) return Response.json({ error: `Fetch failed: ${resp.status}` }, { status: 502 });
    const html = await resp.text();

    // 2. Parse listings: each date header + its tbody
    const sections = [...html.matchAll(/<th colspan="3">(.*?)<\/th>.*?<tbody>(.*?)<\/tbody>/gs)];
    const today = todayStr();
    const listings = [];
    for (const sec of sections) {
      const dates = parseDates(decodeEntities(sec[1]));
      if (dates.length === 0) continue;
      if (dates.every((d) => d < today)) continue; // skip fully-past sections
      const rows = [...sec[2].matchAll(/<a [^>]*>(.*?)<\/a><\/td>\s*<td>(.*?)<\/td>\s*<td>(.*?)<\/td>/gs)];
      for (const row of rows) {
        const anchorText = decodeEntities(row[1]);
        const quadrant = decodeEntities(row[2]);
        const timeStr = decodeEntities(row[3]);
        if (!anchorText) continue;
        const { street, city, state, zip, note } = parseAddress(anchorText);
        if (!street) continue;
        const { start_time, end_time } = parseTimes(timeStr);
        listings.push({
          title: `Garage Sale at ${street}`,
          description: `Listed on wyotraders.com${note ? '. ' + note : ''}`,
          address: street,
          city, state, zip,
          sale_dates: dates,
          start_time, end_time,
          custom_notes: quadrant ? `Cheyenne area: ${quadrant}` : '',
          firstDate: dates.slice().sort()[0],
        });
      }
    }

    if (listings.length === 0) {
      return Response.json({ ok: true, created: 0, skipped: 0, message: 'No current listings found on the page.' });
    }

    // 3. Dedup against existing sales (by street + first date)
    const existing = await base44.asServiceRole.entities.GarageSale.list('-created_date', 500);
    const seen = new Set();
    for (const s of existing) {
      const firstDate = (s.sale_dates || []).slice().sort()[0];
      seen.add(`${(s.address || '').toLowerCase().trim()}|${firstDate || ''}`);
    }

    const toCreate = listings.filter((l) =>
      !seen.has(`${l.address.toLowerCase().trim()}|${l.firstDate}`)
    );

    // 4. Geocode + create (sequential to respect Nominatim rate limit)
    let created = 0;
    let skipped = 0;
    for (const l of toCreate) {
      const coords = await geocode(l.address, l.city, l.state, l.zip);
      const expires_at = new Date(`${l.sale_dates.slice().sort()[l.sale_dates.length - 1]}T${l.end_time}:00-06:00`).toISOString();
      const slug = slugify(l.title) + '-cheyenne';
      const record = {
        title: l.title,
        slug,
        description: l.description,
        address: l.address,
        city: l.city,
        state: l.state,
        zip: l.zip,
        lat: coords.lat,
        lng: coords.lng,
        sale_dates: l.sale_dates,
        start_time: l.start_time,
        end_time: l.end_time,
        custom_notes: l.custom_notes,
        address_visibility: 'immediate',
        event_type: 'garage',
        status,
        created_by_email: 'wyotraders.com',
        expires_at,
      };
      try {
        await base44.asServiceRole.entities.GarageSale.create(record);
        created++;
      } catch (err) {
        console.error('create failed for', l.address, err);
        skipped++;
      }
      await new Promise((r) => setTimeout(r, 1100)); // Nominatim 1 req/sec
    }

    return Response.json({
      ok: true,
      found: listings.length,
      created,
      skipped,
      dedup_skipped: listings.length - toCreate.length,
      status,
    });
  } catch (error) {
    console.error('scrapeWyoTraders error', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}