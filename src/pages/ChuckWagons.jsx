import React, { useEffect, useMemo, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Truck, Clock, MapPin, ChevronRight } from 'lucide-react';
import ChuckWagonMap from '@/components/chuckwagons/ChuckWagonMap';
import ChuckWagonStatusBanner, {
  isStale,
  relativeTime,
  wagonStatus,
  todayStopFor,
} from '@/components/chuckwagons/ChuckWagonStatusBanner';
import { useSEO } from '@/hooks/useSEO';

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

function cuisineLabel(wagon) {
  const types = wagon.food_types || [];
  if (!types.length) return null;
  return types
    .map((t) => t.replace(/_/g, ' '))
    .join(', ');
}

export default function ChuckWagons() {
  const [user, setUser] = useState(null);

  useEffect(() => {
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

  // Today's stop per wagon, for status + crawlable SEO section
  const todayStopByWagon = useMemo(() => {
    const map = {};
    allWagons.forEach((w) => {
      const stop = todayStopFor(w.id, stops);
      if (stop) map[w.id] = stop;
    });
    return map;
  }, [allWagons, stops]);

  // Live stats for the header counter
  const stats = useMemo(() => {
    const servingNow = liveWagons.length;
    const outToday = allWagons.filter(
      (w) => todayStopByWagon[w.id] || (w.is_live && !isStale(w.live_updated_at))
    ).length;
    return { total: allWagons.length, outToday, servingNow };
  }, [allWagons, liveWagons, todayStopByWagon]);

  // SEO: food-truck-specific metadata + JSON-LD ItemList of FoodTruck entries
  const seoTitle = 'Cheyenne Food Trucks & Chuck Wagons — Live Food Truck Tracker';
  const seoDescription =
    'Track Cheyenne food trucks in real time. See which food trucks are open today, where they\'re serving right now, and this week\'s food truck schedule across Cheyenne, Wyoming.';

  const jsonLd = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const items = allWagons.map((w, i) => {
      const stop = todayStopByWagon[w.id];
      const entry = {
        '@type': 'FoodTruck',
        position: i + 1,
        name: w.name,
      };
      const cuisine = cuisineLabel(w);
      if (cuisine) entry.servesCuisine = cuisine;
      if (stop) {
        if (stop.location_label) entry.location = stop.location_label;
        if (stop.address) entry.address = stop.address;
        if (typeof stop.lat === 'number' && typeof stop.lng === 'number') {
          entry.geo = {
            '@type': 'GeoCoordinates',
            latitude: stop.lat,
            longitude: stop.lng,
          };
        }
      } else if (typeof w.lat === 'number' && typeof w.lng === 'number') {
        entry.geo = {
          '@type': 'GeoCoordinates',
          latitude: w.lat,
          longitude: w.lng,
        };
      }
      return entry;
    });
    return {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: 'Cheyenne Food Trucks & Chuck Wagons',
      itemListElement: items,
    };
  }, [allWagons, todayStopByWagon]);

  useSEO({
    title: seoTitle,
    description: seoDescription,
    jsonLd,
  });

  const scrollToAllWagons = () => {
    document.getElementById('all-wagons')?.scrollIntoView({ behavior: 'smooth' });
  };

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

      {/* Vendor recruitment bar — slim, under header */}
      <div className="bg-gradient-to-r from-amber-100 to-orange-100 border-b border-amber-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-3">
          <Truck className="w-5 h-5 text-amber-700 shrink-0" />
          <p className="text-sm text-amber-900 flex-1 min-w-0">
            <span className="font-semibold">Own a food truck? Claim your Chuck Wagon.</span>{' '}
            <span className="hidden sm:inline text-amber-800">It's free — put yourself on this map every time you open.</span>
          </p>
          <Button
            size="sm"
            onClick={scrollToAllWagons}
            className="bg-amber-700 hover:bg-amber-800 text-white shrink-0"
          >
            Find your listing
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </div>

      {/* Live counter */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-6">
        <div className="bg-white border-2 border-amber-200 rounded-xl p-4 sm:p-5 flex flex-wrap items-center justify-center sm:justify-start gap-4 sm:gap-6">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🚚</span>
            <div>
              <div className="text-2xl font-bold text-amber-900 leading-none" style={{ fontFamily: 'Rye, serif' }}>
                {isLoading ? '—' : stats.total}
              </div>
              <div className="text-xs text-stone-600 mt-1">Chuck Wagons</div>
            </div>
          </div>
          <div className="hidden sm:block w-px h-10 bg-amber-200" />
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-green-500 shrink-0" />
            <div>
              <div className="text-lg font-bold text-stone-900 leading-none">
                {isLoading ? '—' : `${stats.outToday} out today`}
              </div>
              <div className="text-xs text-stone-600 mt-1">
                {isLoading ? '' : `${stats.servingNow} serving now`}
              </div>
            </div>
          </div>
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
                  <ChuckWagonStatusBanner
                    status="live"
                    subtitle={relativeTime(w.live_updated_at)}
                  />
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
              {upcomingStops.map((s) => {
                const today = new Date().toISOString().slice(0, 10);
                const isToday = (s.stop_dates || []).includes(today);
                return (
                  <Card key={s.id} className="p-5 bg-white border-stone-200">
                    {isToday ? (
                      <ChuckWagonStatusBanner
                        status="scheduled_today"
                        subtitle={`${s.start_time}–${s.end_time}`}
                      />
                    ) : (
                      <ChuckWagonStatusBanner
                        status="scheduled_today"
                        label="SCHEDULED"
                        subtitle={formatDates(s.stop_dates)}
                      />
                    )}
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <Link
                        to={createPageUrl(`VenueDetails?id=${s.venue_id}`)}
                        className="font-semibold text-stone-900 hover:text-amber-700"
                      >
                        {s.venue_name}
                      </Link>
                      {!isToday && (
                        <span className="text-sm text-stone-500">
                          {s.start_time}–{s.end_time}
                        </span>
                      )}
                    </div>
                    <p className="text-stone-700 mt-1">{s.location_label}</p>
                    {s.address && <p className="text-sm text-stone-500">{s.address}</p>}
                    {s.notes && <p className="text-sm text-stone-600 mt-2">{s.notes}</p>}
                  </Card>
                );
              })}
            </div>
          )}
        </section>

        {/* All wagons */}
        <section id="all-wagons">
          <h2 className="text-2xl font-bold text-stone-900 mb-4">All chuck wagons</h2>
          {isLoading ? (
            <Skeleton className="h-24" />
          ) : allWagons.length === 0 ? (
            <Card className="p-6 bg-white border-stone-200">
              <p className="text-stone-600">No chuck wagons listed yet.</p>
            </Card>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {allWagons.map((w) => {
                const todayStop = todayStopByWagon[w.id];
                const status = wagonStatus(w, todayStop);
                const subtitle =
                  status === 'live'
                    ? relativeTime(w.live_updated_at)
                    : status === 'location_unknown'
                    ? relativeTime(w.live_updated_at) || 'Check back soon'
                    : status === 'scheduled_today' && todayStop
                    ? `${todayStop.start_time}–${todayStop.end_time}`
                    : null;
                return (
                  <Link key={w.id} to={createPageUrl(`VenueDetails?id=${w.id}`)}>
                    <Card className="p-5 bg-white border-stone-200 hover:border-amber-300 transition-colors h-full flex flex-col">
                      <ChuckWagonStatusBanner status={status} subtitle={subtitle} />
                      <p className="font-medium text-stone-900">{w.name}</p>
                      {cuisineLabel(w) && (
                        <p className="text-sm text-stone-500">{cuisineLabel(w)}</p>
                      )}
                      {todayStop && (
                        <p className="text-sm text-stone-600 mt-1">
                          Today at {todayStop.location_label}
                        </p>
                      )}
                    </Card>
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        {/* Crawlable SEO text section — participating trucks for search engines */}
        <section className="bg-white border border-stone-200 rounded-lg p-6">
          <h2 className="text-2xl font-bold text-stone-900 mb-3" style={{ fontFamily: 'Rye, serif' }}>
            Cheyenne Food Trucks & Chuck Wagons
          </h2>
          <p className="text-stone-700 mb-4">
            Cheyenne's food trucks and chuck wagons roll across the city all week long — from
            downtown Depot Plaza to the Frontier Park events and neighborhood stops in between.
            Use this tracker to find food trucks open today, see who's serving right now, and
            plan around the weekly Cheyenne food truck schedule. Below are the participating
            trucks and where you can find them today.
          </p>
          {allWagons.length > 0 ? (
            <ul className="space-y-2 text-stone-700">
              {allWagons.map((w) => {
                const stop = todayStopByWagon[w.id];
                const cuisine = cuisineLabel(w);
                const live = w.is_live && !isStale(w.live_updated_at);
                return (
                  <li key={w.id} className="text-sm sm:text-base">
                    <span className="font-semibold">{w.name}</span>
                    {cuisine && <span> — {cuisine}</span>}
                    {live && w.live_location_label && (
                      <span> · serving now at {w.live_location_label}</span>
                    )}
                    {stop && (
                      <span> · scheduled today at {stop.location_label}{stop.start_time ? ` (${stop.start_time}–${stop.end_time})` : ''}</span>
                    )}
                    {!live && !stop && <span> · check back for today's location</span>}
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-stone-600 text-sm">
              Chuck wagon listings are being added. If you run a food truck in Cheyenne, claim
              your wagon above to get on the map.
            </p>
          )}
        </section>

        {/* Vendor call to action — bottom */}
        <Card className="p-6 bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-amber-700 text-amber-50 flex items-center justify-center shrink-0">
              <Truck className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-amber-900 text-lg mb-1">
                Own a food truck? Claim your Chuck Wagon
              </h3>
              <p className="text-amber-800 text-sm">
                Claiming your wagon is free. Find your listing, send a claim request, and you can
                put yourself on this map every time you open — so Cheyenne always knows where to
                find you.
              </p>
            </div>
            <Button
              onClick={scrollToAllWagons}
              className="bg-amber-700 hover:bg-amber-800 text-white shrink-0"
            >
              Find your listing
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}