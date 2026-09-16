import React from 'react';

// Full-width colored status strip rendered across the top of a chuck wagon card.
// status: 'live' | 'scheduled_today' | 'location_unknown' | 'offline'
// subtitle: optional right-aligned text (e.g. "Updated 18m ago")
const STATUS_STYLES = {
  live: 'bg-green-600',
  scheduled_today: 'bg-blue-600',
  location_unknown: 'bg-amber-600',
  offline: 'bg-gray-500',
};

const STATUS_LABELS = {
  live: 'LIVE',
  scheduled_today: 'SCHEDULED TODAY',
  location_unknown: 'LOCATION UNKNOWN',
  offline: 'OFFLINE',
};

export default function ChuckWagonStatusBanner({ status, subtitle, label }) {
  const style = STATUS_STYLES[status] || STATUS_STYLES.offline;
  const text = label || STATUS_LABELS[status] || STATUS_LABELS.offline;
  return (
    <div className={`${style} text-white px-4 py-2 flex items-center justify-between gap-3 -mx-5 -mt-5 mb-4 rounded-t-xl`}>
      <span className="font-bold text-sm tracking-wide uppercase whitespace-nowrap">{text}</span>
      {subtitle && (
        <span className="text-xs font-medium opacity-90 text-right">{subtitle}</span>
      )}
    </div>
  );
}

// Helpers exported for reuse in the page
export const STALE_HOURS = 6;

export function isStale(updatedAt) {
  if (!updatedAt) return true;
  return Date.now() - new Date(updatedAt).getTime() > STALE_HOURS * 60 * 60 * 1000;
}

export function relativeTime(iso) {
  if (!iso) return null;
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'Updated just now';
  if (mins < 60) return `Updated ${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `Updated ${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `Updated ${days}d ago`;
}

// Determine a wagon's current status, given its optional stop for today.
export function wagonStatus(wagon, todayStop) {
  if (wagon.is_live && !isStale(wagon.live_updated_at)) return 'live';
  if (wagon.is_live && isStale(wagon.live_updated_at)) return 'location_unknown';
  if (todayStop) return 'scheduled_today';
  return 'offline';
}

export function todayStopFor(wagonId, stops) {
  const today = new Date().toISOString().slice(0, 10);
  return (stops || []).find(
    (s) =>
      s.venue_id === wagonId &&
      s.status === 'active' &&
      s.is_public !== false &&
      (s.stop_dates || []).includes(today)
  );
}