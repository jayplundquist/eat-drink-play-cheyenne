import React, { useEffect, useMemo, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Truck, Clock, MapPin } from 'lucide-react';
import ChuckWagonMap from '@/components/chuckwagons/ChuckWagonMap';

const STALE_HOURS = 6;

function isStale(updatedAt) {
  if (!updatedAt) return true;
  return Date.now() - new Date(updatedAt).getTime() > STALE_HOURS * 60 * 60 * 1000;
}

function formatDates(dates = []) {
  return dates
    .map((d) =>
      new Date(`${d}T12:00:00`).toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      })
    )
    .join(', ');
}

export default function ChuckWagons() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    document.title = 'Chuck Wagons — Eat, Drink, Play Cheyenne';
    base44.auth.me().then(setUser).catch(() => setUser(null));
  }, []);

  const { data: wagons = [], isLoading } = useQuery({
    queryKey: ['chuckWagons'],
    queryFn: () => base44.entities.Venue.filter({ categories: 'food_trucks' }),
    refetchInterval: 90000,
  });

  const { data: stops = [] } = useQuery({
    queryKey: ['chuckWagonStops'],
    queryFn: () => base44.entities.ChuckWagonStop.list('-created_date'),
    refetchInterval: 300000,
  });

  const liveWagons = useMemo(
    () => wagons.filter((w) => w.is_live && !isStale(w.live_updated_at) && !w.permanently_closed),
    [wagons]
  );

  const upcomingStops = useMemo(() => {
    const now = new Date();
    const horizon = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    return stops
      .filter((s) => s.status === 'active' && s.is_public !== false)
      .filter((s) =>
        (s.stop_dates || []).some((d) => {
          const day = new Date(`${d}T23:59:59`);
          return day >= now && day <= horizon;
        })
      )
      .sort((a, b) => (a.stop_dates?.[0] || '').localeCompare(b.stop_dates?.[0] || ''));
  }, [stops]);

  const allWagons = useMemo(
    () => wagons.filter((w) => !w.permanently_closed).sort((a, b) => a.name.localeCompare(b.name)),
    [wagons]
  );

  const ownsWagon =
    user?.email && wagons.some((w) => w.claimed_by === user.email);

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-b-4 border-amber-900">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
          <div className="flex items-center gap-3 mb-3">
            <Truck className="w-8 h-8 text-amber-700" />
            <h1
              className="text-4xl font-bold text-amber-900"
              style={{ fontFamily: 'Rye, serif' }}
            >
              Chuck Wagons
            </h1>
          </div>
          <p className="text-stone-700 max-w-2xl">
            Cheyenne's food trucks move around. This is where they are right now, and where
            they'll be this week.
          </p>
          {ownsWagon && (
            <Link to={createPageUrl('MyChuckWagon')}>
              <Button className="mt-4 bg-amber-600 hover:bg-amber-700 text-white">
                <MapPin className="w-4 h-4 mr-2" />
                Update my location
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Map */}
      <div className="max-w-6xl mx-auto py-6">
        <Card className="overflow-hidden border-stone-200">
          <ChuckWagonMap />
        </Card>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-16 space-y-10">
        {/* Serving now */}
        <section>
          <h2 className="text-2xl font-bold text-stone-900 mb-4">Serving now</h2>
          {isLoading ? (
            <Skeleton className="h-24" />
          ) : liveWagons.length === 0 ? (
            <Card className="p-6 bg-white border-stone-200">
              <p className="text-stone-600">
                Nobody's checked in yet today. Scroll down for this week's stops.
              </p>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {liveWagons.map((w) => (
                <Card key={w.id} className="p-5 bg-white border-stone-200">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <Link
                        to={createPageUrl(`VenueDetails?id=${w.id}`)}
                        className="font-semibold text-lg text-stone-900 hover:text-amber-700"
                      >
                        {w.name}
                      </Link>
                      {w.live_location_label && (
                        <p className="text-stone-700 mt-1">{w.live_location_label}</p>
                      )}
                      {w.live_note && (
                        <p className="text-sm text-stone-500 mt-1">{w.live_note}</p>
                      )}
                    </div>
                    <Badge className="bg-green-100 text-green-800 shrink-0">Open</Badge>
                  </div>
                  {typeof w.live_lat === 'number' && (
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${w.live_lat},${w.live_lng}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-block mt-3 text-sm text-amber-700 underline"
                    >
                      Get directions
                    </a>
                  )}
                </Card>
              ))}
            </div>
          )}
        </section>

        {/* This week */}
        <section>
          <h2 className="text-2xl font-bold text-stone-900 mb-4 flex items-center gap-2">
            <Clock className="w-6 h-6 text-amber-700" />
            This week
          </h2>
          {upcomingStops.length === 0 ? (
            <Card className="p-6 bg-white border-stone-200">
              <p className="text-stone-600">Nothing on the books for the next seven days yet.</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {upcomingStops.map((s) => (
                <Card key={s.id} className="p-5 bg-white border-stone-200">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <Link
                      to={createPageUrl(`VenueDetails?id=${s.venue_id}`)}
                      className="font-semibold text-stone-900 hover:text-amber-700"
                    >
                      {s.venue_name}
                    </Link>
                    <span className="text-sm text-stone-500">
                      {formatDates(s.stop_dates)} · {s.start_time}–{s.end_time}
                    </span>
                  </div>
                  <p className="text-stone-700 mt-1">{s.location_label}</p>
                  {s.address && <p className="text-sm text-stone-500">{s.address}</p>}
                  {s.notes && <p className="text-sm text-stone-600 mt-2">{s.notes}</p>}
                </Card>
              ))}
            </div>
          )}
        </section>

        {/* All wagons */}
        <section>
          <h2 className="text-2xl font-bold text-stone-900 mb-4">All chuck wagons</h2>
          {isLoading ? (
            <Skeleton className="h-24" />
          ) : allWagons.length === 0 ? (
            <Card className="p-6 bg-white border-stone-200">
              <p className="text-stone-600">No chuck wagons listed yet.</p>
            </Card>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {allWagons.map((w) => (
                <Link key={w.id} to={createPageUrl(`VenueDetails?id=${w.id}`)}>
                  <Card className="p-4 bg-white border-stone-200 hover:border-amber-300 transition-colors h-full">
                    <p className="font-medium text-stone-900">{w.name}</p>
                    {w.cuisine_type && (
                      <p className="text-sm text-stone-500">{w.cuisine_type}</p>
                    )}
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Vendor call to action */}
        <Card className="p-6 bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200">
          <h3 className="font-semibold text-amber-900 text-lg mb-1">Run a chuck wagon?</h3>
          <p className="text-amber-800 text-sm">
            Claiming your wagon is free. Find your listing, send a claim request, and you can put
            yourself on this map every time you open.
          </p>
        </Card>
      </div>
    </div>
  );
}
