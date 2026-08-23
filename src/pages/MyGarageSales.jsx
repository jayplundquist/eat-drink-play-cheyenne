import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';
import { Heart, Tag, Route as RouteIcon, Trash2, Pencil, Plus, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import { useSEO } from '@/hooks/useSEO';
import GarageSaleCard from '@/components/garagesales/GarageSaleCard';
import { formatDateShort, formatTime, buildGoogleMapsRouteUrl, isExpired } from '@/lib/garageSaleHelpers';

export default function MyGarageSales() {
  useSEO({ title: 'My Garage Sales — Cheyenne, WY', noindex: true });
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState('saved');

  const { data: favorites = [] } = useQuery({
    queryKey: ['gs_favorites'],
    queryFn: async () => (await base44.entities.GarageSaleFavorite.filter({}, '-created_date', 200)) || [],
    enabled: !!user,
  });
  const { data: myListings = [] } = useQuery({
    queryKey: ['gs_my_listings'],
    queryFn: async () => (await base44.entities.GarageSale.filter({}, '-created_date', 200)) || [],
    enabled: !!user,
  });
  const { data: myRoutes = [] } = useQuery({
    queryKey: ['gs_my_routes'],
    queryFn: async () => (await base44.entities.GarageSaleRoute.filter({}, '-created_date', 50)) || [],
    enabled: !!user,
  });

  // Resolve saved sales into full sale objects
  const savedSaleIds = favorites.map((f) => f.garage_sale_id);
  const { data: savedSales = [] } = useQuery({
    queryKey: ['gs_saved_sales', savedSaleIds.join(',')],
    queryFn: async () => {
      if (savedSaleIds.length === 0) return [];
      const all = await base44.entities.GarageSale.filter({ status: 'active' }, '-created_date', 500);
      return (all || []).filter((s) => savedSaleIds.includes(s.id));
    },
    enabled: savedSaleIds.length > 0,
  });

  const removeFav = async (id) => {
    const fav = favorites.find((f) => f.garage_sale_id === id);
    if (fav) { await base44.entities.GarageSaleFavorite.delete(fav.id); queryClient.invalidateQueries(['gs_favorites']); toast.success('Removed'); }
  };
  const deleteListing = async (id) => {
    if (!confirm('Delete this listing?')) return;
    await base44.entities.GarageSale.delete(id);
    queryClient.invalidateQueries(['gs_my_listings']);
    toast.success('Listing deleted');
  };
  const deleteRoute = async (id) => {
    if (!confirm('Delete this saved route?')) return;
    await base44.entities.GarageSaleRoute.delete(id);
    queryClient.invalidateQueries(['gs_my_routes']);
    toast.success('Route deleted');
  };

  if (!user) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <p className="text-stone-700 mb-3">Sign in to view your saved garage sales and routes.</p>
        <Button onClick={() => base44.auth.redirectToLogin(window.location.href)} className="bg-amber-600 hover:bg-amber-700 text-white">Sign In</Button>
      </div>
    );
  }

  const tabs = [
    { key: 'saved', label: 'Saved', icon: Heart, count: savedSales.length },
    { key: 'listings', label: 'My Listings', icon: Tag, count: myListings.length },
    { key: 'routes', label: 'My Routes', icon: RouteIcon, count: myRoutes.length },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 pb-20">
      <h1 className="text-2xl font-bold text-stone-800 mb-4">My Garage Sales</h1>

      <div className="flex gap-2 mb-5 border-b border-stone-200">
        {tabs.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)} className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium border-b-2 -mb-px ${tab === t.key ? 'border-amber-600 text-amber-800' : 'border-transparent text-stone-500'}`}>
            <t.icon className="w-4 h-4" /> {t.label}
            <span className="text-xs bg-stone-100 rounded-full px-1.5">{t.count}</span>
          </button>
        ))}
      </div>

      {tab === 'saved' && (
        savedSales.length === 0 ? (
          <Empty text="No saved sales yet. Tap the heart on any garage sale to save it here." />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {savedSales.map((s) => (
              <GarageSaleCard key={s.id} sale={s} saved onToggleSave={(sale) => removeFav(sale.id)} />
            ))}
          </div>
        )
      )}

      {tab === 'listings' && (
        <>
          <Link to="/AddGarageSale"><Button className="mb-4 bg-amber-600 hover:bg-amber-700 text-white"><Plus className="w-4 h-4 mr-1" /> Post a Garage Sale</Button></Link>
          {myListings.length === 0 ? (
            <Empty text="You haven't posted any garage sales yet." />
          ) : (
            <div className="space-y-2">
              {myListings.map((s) => (
                <div key={s.id} className="bg-white border border-stone-200 rounded-lg p-3 flex items-center gap-3">
                  {s.photos?.[0] ? <img src={s.photos[0]} alt="" className="w-14 h-14 object-cover rounded-md" /> : <div className="w-14 h-14 bg-amber-100 rounded-md flex items-center justify-center"><Tag className="w-5 h-5 text-amber-700" /></div>}
                  <div className="flex-1 min-w-0">
                    <Link to={`/GarageSales/${s.slug || s.id}`} className="font-semibold text-stone-800 hover:text-amber-700 truncate block">{s.title}</Link>
                    <div className="text-xs text-stone-500">
                      {(s.sale_dates || []).map(formatDateShort).join(' · ')} · {formatTime(s.start_time)}–{formatTime(s.end_time)}
                      {isExpired(s) && <span className="ml-2 text-rose-500">Expired</span>}
                    </div>
                  </div>
                  <Link to={`/AddGarageSale?id=${s.id}`}><Button variant="outline" size="sm" className="border-stone-300"><Pencil className="w-4 h-4" /></Button></Link>
                  <Button variant="outline" size="sm" onClick={() => deleteListing(s.id)} className="border-rose-300 text-rose-600"><Trash2 className="w-4 h-4" /></Button>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {tab === 'routes' && (
        myRoutes.length === 0 ? (
          <Empty text="No saved routes yet. Build a route from the Garage Sale Map and tap Save." />
        ) : (
          <div className="space-y-3">
            {myRoutes.map((r) => (
              <div key={r.id} className="bg-white border border-stone-200 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-stone-800">{r.name}</h3>
                  <Button variant="outline" size="sm" onClick={() => deleteRoute(r.id)} className="border-rose-300 text-rose-600"><Trash2 className="w-4 h-4" /></Button>
                </div>
                <div className="text-xs text-stone-500 mt-1 flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> {r.start_label || 'Start'} → {r.stops?.length || 0} stops {r.return_to_start ? '· round trip' : ''}
                </div>
                <ol className="mt-2 space-y-1 text-sm text-stone-700">
                  {r.stops?.map((s, i) => (
                    <li key={i} className="flex gap-2"><span className="text-amber-700 font-bold">{i + 1}.</span> {s.title}</li>
                  ))}
                </ol>
                {r.stops?.length > 0 && r.start_lat != null && (
                  <Button size="sm" className="mt-3 bg-green-700 hover:bg-green-800 text-white" onClick={() => window.open(buildGoogleMapsRouteUrl([{ lat: r.start_lat, lng: r.start_lng }, ...r.stops.map((s) => ({ lat: s.lat, lng: s.lng }))]), '_blank')}>
                    Start Route
                  </Button>
                )}
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
}

function Empty({ text }) {
  return <div className="bg-white rounded-xl border-2 border-dashed border-stone-300 p-8 text-center text-stone-500">{text}</div>;
}