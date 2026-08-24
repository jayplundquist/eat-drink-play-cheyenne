import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';
import { Plus, Map as MapIcon, List, Route as RouteIcon, Heart, ArrowRight, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { useSEO } from '@/hooks/useSEO';
import GarageSaleMap from '@/components/garagesales/GarageSaleMap';
import GarageSaleCard from '@/components/garagesales/GarageSaleCard';
import GarageSaleFilters from '@/components/garagesales/GarageSaleFilters';
import RouteBuilder from '@/components/garagesales/RouteBuilder';
import {
  matchesDateFilter,
  isExpired,
  getDisplayCoords,
} from '@/lib/garageSaleHelpers';

const toStop = (sale) => {
  const c = getDisplayCoords(sale);
  return { id: sale.id, title: sale.title, lat: c.lat, lng: c.lng, end_time: sale.end_time, address: sale.address };
};

export default function GarageSales() {
  useSEO({
    title: 'Garage Sales Cheyenne, WY — Map & Route Planner | Eat, Drink, Play Cheyenne',
    description:
      'Find garage sales, yard sales, and estate sales around Cheyenne, Wyoming on an interactive map. Filter by date and category, save your favorites, and build an optimized driving route.',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: 'Cheyenne Garage Sale Map',
      applicationCategory: 'MapApplication',
      operatingSystem: 'Web',
      description: 'Interactive garage sale map and route planner for Cheyenne, Wyoming.',
    },
  });

  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [dateFilter, setDateFilter] = useState('all');
  const [specificDate, setSpecificDate] = useState('');
  const [selectedCats, setSelectedCats] = useState([]);
  const [view, setView] = useState('map');
  const [selectedSale, setSelectedSale] = useState(null);
  const [focusTarget, setFocusTarget] = useState(null);
  const [routeOpen, setRouteOpen] = useState(false);
  const [routeStops, setRouteStops] = useState(() => {
    try { return JSON.parse(localStorage.getItem('gs_route_stops') || '[]'); } catch { return []; }
  });
  const [startCoords, setStartCoords] = useState(null);
  const [startLabel, setStartLabel] = useState('');
  const [returnToStart, setReturnToStart] = useState(false);
  const [optimizedOrder, setOptimizedOrder] = useState(null);

  useEffect(() => {
    localStorage.setItem('gs_route_stops', JSON.stringify(routeStops));
  }, [routeStops]);

  const { data: sales = [], isLoading } = useQuery({
    queryKey: ['garageSales'],
    queryFn: async () => {
      const res = await base44.entities.GarageSale.filter({ status: 'active' }, '-created_date', 500);
      return res || [];
    },
    staleTime: 60000,
    refetchOnWindowFocus: false,
  });

  const { data: favorites = [] } = useQuery({
    queryKey: ['gs_favorites'],
    queryFn: async () => {
      if (!user) return [];
      const res = await base44.entities.GarageSaleFavorite.filter({}, '-created_date', 200);
      return res || [];
    },
    enabled: !!user,
    staleTime: 30000,
  });

  const savedIds = useMemo(() => favorites.map((f) => f.garage_sale_id), [favorites]);

  const filtered = useMemo(() => {
    return sales
      .filter((s) => !isExpired(s))
      .filter((s) => matchesDateFilter(s, dateFilter, specificDate))
      .filter((s) => selectedCats.length === 0 || (s.categories || []).some((c) => selectedCats.includes(c)))
      .sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
  }, [sales, dateFilter, specificDate, selectedCats]);

  const toggleCat = (cat) => {
    setSelectedCats((prev) => (prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]));
  };

  const clearAll = () => {
    setDateFilter('all');
    setSpecificDate('');
    setSelectedCats([]);
  };

  const toggleSave = useCallback(async (sale) => {
    if (!user) {
      base44.auth.redirectToLogin(window.location.href);
      return;
    }
    const existing = favorites.find((f) => f.garage_sale_id === sale.id);
    try {
      if (existing) {
        await base44.entities.GarageSaleFavorite.delete(existing.id);
        toast.success('Removed from saved');
      } else {
        await base44.entities.GarageSaleFavorite.create({ garage_sale_id: sale.id, garage_sale_title: sale.title });
        toast.success('Saved!');
      }
      queryClient.invalidateQueries(['gs_favorites']);
    } catch {
      toast.error('Could not save right now');
    }
  }, [user, favorites, queryClient]);

  const addToRoute = (sale) => {
    setRouteStops((prev) => (prev.find((s) => s.id === sale.id) ? prev : [...prev, toStop(sale)]));
    toast.success('Added to route');
  };
  const removeFromRoute = (id) => setRouteStops((prev) => prev.filter((s) => s.id !== id));

  const openRouteBuilder = () => {
    if (routeStops.length === 0) {
      toast.info('Add the garage sales you want to visit and we\'ll arrange them into the most efficient order.');
      return;
    }
    setRouteOpen(true);
  };

  const routeNumberById = useMemo(() => {
    if (!optimizedOrder) return {};
    const map = {};
    optimizedOrder.forEach((s, i) => { map[s.id] = i + 1; });
    return map;
  }, [optimizedOrder]);

  const routePoints = useMemo(() => {
    if (!optimizedOrder) return null;
    const pts = [];
    if (startCoords) pts.push([startCoords.lat, startCoords.lng]);
    optimizedOrder.forEach((s) => pts.push([s.lat, s.lng]));
    if (returnToStart && startCoords) pts.push([startCoords.lat, startCoords.lng]);
    return pts.length >= 2 ? pts : null;
  }, [optimizedOrder, startCoords, returnToStart]);

  const handleAddSale = () => {
    if (!user) base44.auth.redirectToLogin(window.location.href);
    else window.location.href = '/AddGarageSale';
  };

  return (
    <div className="min-h-screen bg-amber-50 pb-24">
      {/* Header */}
      <div className="bg-gradient-to-b from-amber-900 to-amber-800 text-amber-50 px-4 pt-6 pb-4">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-2xl sm:text-3xl font-bold" style={{ fontFamily: 'Rye, serif' }}>
            🤠 Cheyenne Garage Sale Map
          </h1>
          <p className="text-sm text-amber-200 mt-1">
            Find yard sales, estate sales & moving sales around town — then build a smart route to hit them all.
          </p>
          <button
            onClick={openRouteBuilder}
            className="mt-3 inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-amber-950 font-semibold rounded-lg px-4 py-2 text-sm shadow"
          >
            <RouteIcon className="w-4 h-4" /> Build My Garage Sale Route
          </button>
        </div>
      </div>

      <GarageSaleFilters
        dateFilter={dateFilter}
        setDateFilter={setDateFilter}
        specificDate={specificDate}
        setSpecificDate={setSpecificDate}
        selectedCats={selectedCats}
        toggleCat={toggleCat}
        onClearAll={clearAll}
      />

      {/* Action bar */}
      <div className="max-w-6xl mx-auto px-3 py-3 flex items-center justify-between gap-2">
        <div className="text-sm text-stone-600">
          <span className="font-semibold text-stone-800">{filtered.length}</span> sale{filtered.length !== 1 ? 's' : ''}
        </div>
        <div className="flex gap-2">
          <Link to="/ImportGarageSale">
            <Button variant="outline" className="border-amber-300 text-amber-800 hover:bg-amber-50">
              <Sparkles className="w-4 h-4 mr-1" /> Submit a Tip
            </Button>
          </Link>
          <Button onClick={handleAddSale} className="bg-amber-600 hover:bg-amber-700 text-white">
            <Plus className="w-4 h-4 mr-1" /> Add My Sale
          </Button>
        </div>
      </div>

      {/* Community submission pitch */}
      <div className="max-w-6xl mx-auto px-3 pb-2">
        <Link to="/ImportGarageSale" className="block">
          <div className="rounded-xl border-2 border-dashed border-amber-300 bg-amber-50/70 px-4 py-3 flex items-center gap-3 hover:bg-amber-50 transition-colors">
            <Sparkles className="w-5 h-5 text-amber-600 shrink-0" />
            <div className="text-sm">
              <span className="font-semibold text-amber-900">Know of a garage sale that's not on the map?</span>
              <span className="text-amber-700"> Paste the post or upload a screenshot and we'll take care of adding it.</span>
            </div>
            <ArrowRight className="w-4 h-4 text-amber-600 ml-auto shrink-0" />
          </div>
        </Link>
      </div>

      {/* View toggle (mobile) */}
      <div className="max-w-6xl mx-auto px-3 sm:hidden">
        <div className="flex bg-stone-200 rounded-lg p-1 mb-3">
          <button
            onClick={() => setView('map')}
            className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-md text-sm ${view === 'map' ? 'bg-white text-amber-800 font-semibold shadow' : 'text-stone-600'}`}
          >
            <MapIcon className="w-4 h-4" /> Map
          </button>
          <button
            onClick={() => setView('list')}
            className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-md text-sm ${view === 'list' ? 'bg-white text-amber-800 font-semibold shadow' : 'text-stone-600'}`}
          >
            <List className="w-4 h-4" /> List
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-6xl mx-auto px-3">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Map */}
          <div className={`${view === 'list' ? 'hidden lg:block' : 'block'}`}>
            <div className="h-[60vh] lg:h-[75vh] rounded-xl overflow-hidden border-2 border-amber-200 shadow-sm relative">
              {isLoading ? (
                <div className="w-full h-full flex items-center justify-center bg-stone-100 text-stone-500">Loading map…</div>
              ) : (
                <GarageSaleMap
                  sales={filtered}
                  selectedSale={selectedSale}
                  onSelectSale={(s) => { setSelectedSale(s); setFocusTarget(getDisplayCoords(s)); }}
                  savedIds={savedIds}
                  routeNumberById={routeNumberById}
                  routeStopIds={routeStops.map((s) => s.id)}
                  routePoints={routePoints}
                  focusTarget={focusTarget}
                />
              )}
            </div>
          </div>

          {/* List */}
          <div className={`${view === 'map' ? 'hidden lg:block' : 'block'}`}>
            {filtered.length === 0 ? (
              <div className="bg-white rounded-xl border-2 border-dashed border-stone-300 p-8 text-center text-stone-500">
                <p className="font-medium">No garage sales match your filters yet.</p>
                <p className="text-sm mt-1">Try a different date or category — or add your own sale!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[75vh] overflow-y-auto pr-1">
                {filtered.map((sale) => (
                  <GarageSaleCard
                    key={sale.id}
                    sale={sale}
                    saved={savedIds.includes(sale.id)}
                    inRoute={routeStops.some((s) => s.id === sale.id)}
                    onToggleSave={toggleSave}
                    onAddToRoute={addToRoute}
                    onRemoveFromRoute={(sale) => removeFromRoute(sale.id)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Persistent My Route bar */}
      {routeStops.length > 0 && (
        <div className="fixed bottom-0 inset-x-0 z-40 px-3 pb-3 pt-6 bg-gradient-to-t from-amber-50/95 to-transparent pointer-events-none">
          <div className="max-w-6xl mx-auto pointer-events-auto bg-amber-800 text-white rounded-xl shadow-lg flex items-center gap-3 px-4 py-2.5">
            <RouteIcon className="w-5 h-5 text-amber-200 shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sm leading-tight">My Route</div>
              <div className="text-xs text-amber-200 leading-tight">{routeStops.length} stop{routeStops.length !== 1 ? 's' : ''} selected</div>
            </div>
            <button
              onClick={openRouteBuilder}
              className="bg-amber-500 hover:bg-amber-400 text-amber-950 font-semibold rounded-lg px-3 py-2 text-sm flex items-center gap-1 whitespace-nowrap"
            >
              {optimizedOrder ? 'View Route' : 'Optimize My Route'} <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <RouteBuilder
        open={routeOpen}
        onClose={() => setRouteOpen(false)}
        stops={routeStops}
        onRemoveStop={removeFromRoute}
        startLabel={startLabel}
        setStartLabel={setStartLabel}
        startCoords={startCoords}
        setStartCoords={setStartCoords}
        returnToStart={returnToStart}
        setReturnToStart={setReturnToStart}
        onOptimized={setOptimizedOrder}
        onSaveRoute={user ? async () => {
          if (!optimizedOrder) { toast.error('Optimize your route first'); return; }
          try {
            await base44.entities.GarageSaleRoute.create({
              name: `Route · ${new Date().toLocaleDateString()}`,
              stops: optimizedOrder.map((s) => ({ garage_sale_id: s.id, title: s.title, address: s.address, lat: s.lat, lng: s.lng, close_time: s.closeTime })),
              start_label: startLabel || 'Start',
              start_lat: startCoords?.lat,
              start_lng: startCoords?.lng,
              return_to_start: returnToStart,
            });
            toast.success('Route saved! Find it under My Garage Sales.');
          } catch { toast.error('Could not save route'); }
        } : null}
        isSavingRoute={false}
      />
    </div>
  );
}