// Shared helpers, constants, and date/privacy logic for the Garage Sale Map.

export const GARAGE_SALE_CATEGORIES = [
  { value: 'furniture', label: 'Furniture' },
  { value: 'tools', label: 'Tools' },
  { value: 'kids', label: 'Kids' },
  { value: 'baby', label: 'Baby' },
  { value: 'clothing', label: 'Clothing' },
  { value: 'shoes', label: 'Shoes' },
  { value: 'electronics', label: 'Electronics' },
  { value: 'video_games', label: 'Video Games' },
  { value: 'sports', label: 'Sports' },
  { value: 'outdoor', label: 'Outdoor' },
  { value: 'camping', label: 'Camping' },
  { value: 'automotive', label: 'Automotive' },
  { value: 'antiques', label: 'Antiques' },
  { value: 'collectibles', label: 'Collectibles' },
  { value: 'books', label: 'Books' },
  { value: 'home_decor', label: 'Home Decor' },
  { value: 'kitchen', label: 'Kitchen' },
  { value: 'appliances', label: 'Appliances' },
  { value: 'crafts', label: 'Crafts' },
  { value: 'holiday', label: 'Holiday' },
  { value: 'free_stuff', label: 'Free Stuff' },
  { value: 'everything_must_go', label: 'Everything Must Go' },
];

export const SPECIAL_NOTES = [
  { value: 'early_birds_welcome', label: 'Early Birds Welcome' },
  { value: 'no_early_birds', label: 'No Early Birds' },
  { value: 'cash_only', label: 'Cash Only' },
  { value: 'venmo_accepted', label: 'Venmo Accepted' },
  { value: 'everything_must_go', label: 'Everything Must Go' },
  { value: 'prices_reduced_sunday', label: 'Prices Reduced Sunday' },
  { value: 'free_items_available', label: 'Free Items Available' },
  { value: 'multi_family_sale', label: 'Multi-Family Sale' },
  { value: 'estate_sale', label: 'Estate Sale' },
  { value: 'moving_sale', label: 'Moving Sale' },
  { value: 'neighborhood_sale', label: 'Neighborhood Sale' },
];

export const EVENT_TYPES = [
  { value: 'garage', label: 'Garage Sale' },
  { value: 'estate', label: 'Estate Sale' },
  { value: 'moving', label: 'Moving Sale' },
  { value: 'neighborhood', label: 'Neighborhood Sale' },
  { value: 'community', label: 'Community Sale' },
  { value: 'church', label: 'Church Sale' },
  { value: 'school', label: 'School Sale' },
  { value: 'multi_family', label: 'Multi-Family Sale' },
];

export const REPORT_REASONS = [
  { value: 'fake', label: 'Fake garage sale' },
  { value: 'incorrect_address', label: 'Incorrect address' },
  { value: 'inappropriate', label: 'Inappropriate content' },
  { value: 'duplicate', label: 'Duplicate listing' },
  { value: 'not_happening', label: 'Sale no longer happening' },
  { value: 'other', label: 'Other' },
];

// Normalize an address + city for duplicate comparison: lowercase, strip
// punctuation, collapse whitespace. "123 Main St." and "123 main st" match.
export function normalizeAddress(address, city) {
  return [address, city].filter(Boolean).join(', ')
    .toLowerCase()
    .replace(/[#.]/g, ' ')
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function slugify(text) {
  return (text || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export function fmtDate(d) {
  return d.toISOString().slice(0, 10);
}

export function getFinalDate(sale) {
  if (!sale?.sale_dates?.length) return null;
  return sale.sale_dates.slice().sort()[sale.sale_dates.length - 1];
}

export function getFirstDate(sale) {
  if (!sale?.sale_dates?.length) return null;
  return sale.sale_dates.slice().sort()[0];
}

export function getExpiresAt(sale) {
  const finalDate = getFinalDate(sale);
  if (!finalDate || !sale.end_time) return null;
  return new Date(`${finalDate}T${sale.end_time}:00`).toISOString();
}

export function isExpired(sale) {
  if (sale?.demo) return false;
  if (sale?.status === 'expired' || sale?.status === 'removed') return true;
  const exp = sale?.expires_at || getExpiresAt(sale);
  if (!exp) return false;
  return new Date(exp).getTime() < Date.now();
}

export function isLiveNow(sale) {
  const now = new Date();
  const today = fmtDate(now);
  if (!sale?.sale_dates?.includes(today)) return false;
  const start = new Date(`${today}T${sale.start_time}:00`);
  const end = new Date(`${today}T${sale.end_time}:00`);
  return now >= start && now <= end;
}

// Address privacy: "morning_of" reveals the exact address at 6 AM on the first sale date.
export function shouldRevealExactAddress(sale) {
  if (!sale?.address_visibility || sale.address_visibility === 'immediate') return true;
  const firstDate = getFirstDate(sale);
  if (!firstDate) return true;
  const reveal = new Date(`${firstDate}T06:00:00`);
  return new Date() >= reveal;
}

// Coordinates returned by the geocoder when an address can't be placed.
// Sales sitting on this exact point are "un-geocoded": their address text
// still shows in list views, but they are excluded from the map so they
// don't pile up at the city center as a misleading cluster.
export const CHEYENNE_FALLBACK_COORD = { lat: 41.14, lng: -104.79 };

export function isUngeocoded(sale) {
  return sale?.lat === CHEYENNE_FALLBACK_COORD.lat && sale?.lng === CHEYENNE_FALLBACK_COORD.lng;
}

export function getDisplayCoords(sale) {
  if (shouldRevealExactAddress(sale)) {
    return { lat: sale.lat, lng: sale.lng, approximate: false };
  }
  // Approximate to ~0.01 deg (about 1 km) so shoppers see the neighborhood, not the house.
  const lat = Math.round(sale.lat * 100) / 100;
  const lng = Math.round(sale.lng * 100) / 100;
  return { lat, lng, approximate: true };
}

export function formatTime(t) {
  if (!t) return '';
  const [h, m] = t.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hr = h % 12 || 12;
  return `${hr}:${String(m).padStart(2, '0')} ${ampm}`;
}

export function formatDateLong(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

export function formatDateWithYear(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
}

export function formatDateShort(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function localDateStr(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// Human-friendly multi-day schedule. Sales use a single start/end time across
// all dates, so multi-day ranges show "daily".
export function formatSaleSchedule(sale) {
  const dates = (sale.sale_dates || []).slice().sort();
  const time = sale.start_time && sale.end_time ? `${formatTime(sale.start_time)}–${formatTime(sale.end_time)}` : '';
  if (dates.length === 0) return time;
  if (dates.length === 1) return `${formatDateShort(dates[0])}${time ? ' · ' + time : ''}`;
  const parsed = dates.map((d) => new Date(d + 'T00:00:00'));
  let consecutive = true;
  for (let i = 1; i < parsed.length; i++) {
    if ((parsed[i] - parsed[i - 1]) / 86400000 !== 1) { consecutive = false; break; }
  }
  const suffix = time ? ` · ${time} daily` : ' daily';
  if (consecutive) {
    const first = parsed[0];
    const last = parsed[parsed.length - 1];
    const sameMonth = first.getMonth() === last.getMonth() && first.getFullYear() === last.getFullYear();
    return sameMonth
      ? `${formatDateShort(dates[0])}–${last.getDate()}${suffix}`
      : `${formatDateShort(dates[0])} – ${formatDateShort(dates[dates.length - 1])}${suffix}`;
  }
  return `${dates.map(formatDateShort).join(' · ')}${suffix}`;
}

export function saleActiveOnDate(sale, dateStr) {
  return !!sale?.sale_dates?.includes(dateStr);
}

export function getDateFilterRange(filter) {
  const today = new Date();
  if (filter === 'today') return [fmtDate(today)];
  if (filter === 'tomorrow') {
    const t = new Date(today);
    t.setDate(t.getDate() + 1);
    return [fmtDate(t)];
  }
  if (filter === 'weekend') {
    const day = today.getDay();
    const sat = new Date(today);
    sat.setDate(sat.getDate() + ((6 - day + 7) % 7));
    const sun = new Date(sat);
    sun.setDate(sun.getDate() + 1);
    return [fmtDate(sat), fmtDate(sun)];
  }
  return null;
}

export function isUpcoming(sale) {
  if (sale?.demo) return true;
  if (isExpired(sale)) return false;
  const today = todayStr();
  return !!sale?.sale_dates?.some((d) => d >= today);
}

export function matchesDateFilter(sale, filter, specificDate) {
  if (filter === 'specific' && specificDate) return saleActiveOnDate(sale, specificDate);
  const range = getDateFilterRange(filter);
  if (!range) return isUpcoming(sale);
  return range.some((d) => saleActiveOnDate(sale, d));
}

export function getSaleUrl(sale) {
  return `/GarageSales/${sale.slug || sale.id}`;
}

export function getCategoryLabel(value) {
  return GARAGE_SALE_CATEGORIES.find((c) => c.value === value)?.label || value;
}

export function getNoteLabel(value) {
  return SPECIAL_NOTES.find((n) => n.value === value)?.label || value;
}

export function getEventTypeLabel(value) {
  return EVENT_TYPES.find((e) => e.value === value)?.label || value;
}

export function getReportReasonLabel(value) {
  return REPORT_REASONS.find((r) => r.value === value)?.label || value;
}

// Google Maps directions URL for a sequence of stops (first = origin).
export function buildGoogleMapsRouteUrl(stops) {
  if (!stops || stops.length === 0) return '';
  const dest = stops[stops.length - 1];
  const origin = stops.length > 1 ? stops[0] : null;
  const waypoints = stops.length > 2 ? stops.slice(1, -1) : [];
  const base = 'https://www.google.com/maps/dir/?api=1';
  const params = new URLSearchParams();
  if (origin) params.set('origin', `${origin.lat},${origin.lng}`);
  params.set('destination', `${dest.lat},${dest.lng}`);
  if (waypoints.length) {
    params.set('waypoints', waypoints.map((s) => `${s.lat},${s.lng}`).join('|'));
  }
  params.set('travelmode', 'driving');
  return `${base}&${params.toString()}`;
}

export function buildAppleMapsRouteUrl(stops) {
  if (!stops || stops.length === 0) return '';
  const dest = stops[stops.length - 1];
  const base = 'https://maps.apple.com/?';
  const params = new URLSearchParams();
  params.set('daddr', `${dest.lat},${dest.lng}`);
  return `${base}${params.toString()}`;
}