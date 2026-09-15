import React, { useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

const CHEYENNE = [41.14, -104.8202];

// A wagon that forgot to tap "we're done" should drop off the map on its own.
// Never trust is_live alone.
const STALE_HOURS = 6;

function isStale(updatedAt) {
  if (!updatedAt) return true;
  return Date.now() - new Date(updatedAt).getTime() > STALE_HOURS * 60 * 60 * 1000;
}

function letterPin(name, color) {
  const initial = (name || '?').trim().charAt(0).toUpperCase();
  return L.divIcon({
    className: '',
    html: `<div style="
      width:34px;height:34px;border-radius:50% 50% 50% 4px;
      transform:rotate(-45deg);
      background:${color};border:2px solid #fff;
      box-shadow:0 2px 6px rgba(41,37,36,.45);
      display:flex;align-items:center;justify-content:center;">
        <span style="transform:rotate(45deg);color:#fff;font:600 14px/1 system-ui,sans-serif;">${initial}</span>
      </div>`,
    iconSize: [34, 34],
    iconAnchor: [17, 34],
    popupAnchor: [0, -32],
  });
}

function logoPin(logoUrl, color) {
  return L.divIcon({
    className: '',
    html: `<div style="
      width:42px;height:42px;border-radius:50%;
      background:#fff;border:3px solid ${color};
      box-shadow:0 2px 8px rgba(41,37,36,.45);
      overflow:hidden;display:flex;align-items:center;justify-content:center;">
        <img src="${logoUrl}" alt="" style="width:100%;height:100%;object-fit:cover;" />
      </div>`,
    iconSize: [42, 42],
    iconAnchor: [21, 42],
    popupAnchor: [0, -40],
  });
}

function pinFor(wagon, color) {
  if (wagon.has_branded_pin && wagon.pin_logo_url) {
    return logoPin(wagon.pin_logo_url, color);
  }
  return letterPin(wagon.name || wagon.venue_name, color);
}

function timeAgo(iso) {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 5) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const h = Math.round(mins / 60);
  return h === 1 ? 'an hour ago' : `${h} hours ago`;
}

function formatStopWhen(stop) {
  const first = stop.stop_dates?.[0];
  if (!first) return '';
  const d = new Date(`${first}T12:00:00`);
  const day = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  return `${day}, ${stop.start_time}–${stop.end_time}`;
}

function FitBounds({ points }) {
  const map = useMap();
  useEffect(() => {
    if (!points.length) return;
    if (points.length === 1) {
      map.setView(points[0], 14);
    } else {
      map.fitBounds(L.latLngBounds(points), { padding: [48, 48] });
    }
  }, [points, map]);
  return null;
}

export default function ChuckWagonMap() {
  const [view, setView] = useState('live'); // 'live' | 'upcoming'

  const { data: wagons = [], isLoading: loadingWagons } = useQuery({
    queryKey: ['chuckWagons'],
    queryFn: () => base44.entities.Venue.filter({ categories: 'food_trucks' }),
    refetchInterval: 90000,
  });

  const { data: stops = [], isLoading: loadingStops } = useQuery({
    queryKey: ['chuckWagonStops'],
    queryFn: () => base44.entities.ChuckWagonStop.list('-created_date'),
    refetchInterval: 300000,
  });

  const liveWagons = useMemo(
    () =>
      wagons.filter(
        (w) =>
          w.is_live &&
          !isStale(w.live_updated_at) &&
          !w.permanently_closed &&
          typeof w.live_lat === 'number' &&
          typeof w.live_lng === 'number'
      ),
    [wagons]
  );

  const upcomingStops = useMemo(() => {
    const now = new Date();
    const horizon = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    return stops.filter((s) => {
      if (s.status !== 'active' || s.is_public === false) return false;
      return (s.stop_dates || []).some((d) => {
        const day = new Date(`${d}T23:59:59`);
        return day >= now && day <= horizon;
      });
    });
  }, [stops]);

  const wagonById = useMemo(() => {
    const m = {};
    wagons.forEach((w) => { m[w.id] = w; });
    return m;
  }, [wagons]);

  const isLoading = loadingWagons || loadingStops;
  const rows = view === 'live' ? liveWagons : upcomingStops;

  const points = useMemo(
    () =>
      view === 'live'
        ? liveWagons.map((w) => [w.live_lat, w.live_lng])
        : upcomingStops.filter((s) => s.lat && s.lng).map((s) => [s.lat, s.lng]),
    [view, liveWagons, upcomingStops]
  );

  return (
    <section className="bg-white">
      <div className="flex flex-wrap items-baseline justify-between gap-4 px-4 sm:px-6 pt-6 pb-3">
        <div>
          <h2 className="text-2xl font-bold text-stone-900">Chuck Wagons</h2>
          <p className="text-sm text-stone-600 mt-1">
            Where Cheyenne's food trucks are parked right now.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant={view === 'live' ? 'default' : 'outline'}
            className={view === 'live' ? 'bg-amber-600 hover:bg-amber-700 text-white' : ''}
            onClick={() => setView('live')}
          >
            Serving now{liveWagons.length ? ` (${liveWagons.length})` : ''}
          </Button>
          <Button
            size="sm"
            variant={view === 'upcoming' ? 'default' : 'outline'}
            className={view === 'upcoming' ? 'bg-amber-600 hover:bg-amber-700 text-white' : ''}
            onClick={() => setView('upcoming')}
          >
            This week
          </Button>
        </div>
      </div>

      {isLoading && <Skeleton className="h-[420px] mx-4 sm:mx-6 mb-6" />}

      {!isLoading && rows.length === 0 && (
        <p className="px-4 sm:px-6 pb-4 text-stone-600 max-w-prose">
          {view === 'live'
            ? "No wagons are serving at the moment. Check this week's stops to see who's coming out."
            : 'Nothing on the books for the next seven days yet.'}
        </p>
      )}

      {!isLoading && (
        <div className="h-[420px] sm:h-[520px] w-full">
          <MapContainer
            center={CHEYENNE}
            zoom={12}
            scrollWheelZoom={false}
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <FitBounds points={points} />

            {view === 'live' &&
              liveWagons.map((w) => (
                <Marker
                  key={w.id}
                  position={[w.live_lat, w.live_lng]}
                  icon={pinFor(w, '#b45309')}
                >
                  <Popup>
                    <div className="min-w-[180px] text-sm">
                      <strong className="block text-base text-stone-900">{w.name}</strong>
                      {w.live_location_label && (
                        <div className="mt-1 text-stone-700">{w.live_location_label}</div>
                      )}
                      <div className="text-stone-500">Checked in {timeAgo(w.live_updated_at)}</div>
                      {w.live_note && <div className="mt-1 text-stone-700">{w.live_note}</div>}
                      <div className="mt-2 flex flex-col gap-1">
                        <Link
                          to={createPageUrl(`VenueDetails?id=${w.id}`)}
                          className="text-amber-700 underline"
                        >
                          See menu and details
                        </Link>
                        <a
                          href={`https://www.google.com/maps/dir/?api=1&destination=${w.live_lat},${w.live_lng}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-amber-700 underline"
                        >
                          Get directions
                        </a>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              ))}

            {view === 'upcoming' &&
              upcomingStops
                .filter((s) => s.lat && s.lng)
                .map((s) => {
                  const wagon = wagonById[s.venue_id] || {};
                  return (
                    <Marker
                      key={s.id}
                      position={[s.lat, s.lng]}
                      icon={pinFor({ ...wagon, venue_name: s.venue_name }, '#57534e')}
                    >
                      <Popup>
                        <div className="min-w-[180px] text-sm">
                          <strong className="block text-base text-stone-900">{s.venue_name}</strong>
                          <div className="mt-1 text-stone-700">{s.location_label}</div>
                          <div className="text-stone-500">{formatStopWhen(s)}</div>
                          {s.notes && <div className="mt-1 text-stone-700">{s.notes}</div>}
                          <div className="mt-2 flex flex-col gap-1">
                            <Link
                              to={createPageUrl(`VenueDetails?id=${s.venue_id}`)}
                              className="text-amber-700 underline"
                            >
                              See menu and details
                            </Link>
                            <a
                              href={`https://www.google.com/maps/dir/?api=1&destination=${s.lat},${s.lng}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-amber-700 underline"
                            >
                              Get directions
                            </a>
                          </div>
                        </div>
                      </Popup>
                    </Marker>
                  );
                })}
          </MapContainer>
        </div>
      )}
    </section>
  );
}
