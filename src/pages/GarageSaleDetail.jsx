import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import {
  MapPin, Clock, Calendar, Share2, Navigation, Heart, Plus, Flag, Trash2, Pencil, Info, ArrowLeft,
} from 'lucide-react';
import { toast } from 'sonner';
import { useSEO } from '@/hooks/useSEO';
import {
  formatDateWithYear, formatTime, getCategoryLabel, getNoteLabel, getEventTypeLabel,
  shouldRevealExactAddress, isLiveNow, REPORT_REASONS, getReportReasonLabel,
  buildGoogleMapsRouteUrl, getDisplayCoords,
} from '@/lib/garageSaleHelpers';

const pinIcon = L.divIcon({
  className: 'gs-detail-pin',
  html: '<div style="background:#b45309;width:22px;height:22px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:2px solid #fff;box-shadow:0 2px 4px rgba(0,0,0,0.4)"></div>',
  iconSize: [22, 22], iconAnchor: [11, 22],
});

function FlyTo({ target }) {
  const map = useMap();
  useEffect(() => { if (target) map.flyTo(target, 14, { duration: 0.5 }); }, [target]);
  return null;
}

export default function GarageSaleDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState('fake');
  const [reportDetails, setReportDetails] = useState('');
  const [routeStops, setRouteStops] = useState(() => {
    try { return JSON.parse(localStorage.getItem('gs_route_stops') || '[]'); } catch { return []; }
  });

  const { data: sale, isLoading } = useQuery({
    queryKey: ['garageSaleBySlug', slug],
    queryFn: async () => {
      const bySlug = await base44.entities.GarageSale.filter({ slug });
      if (bySlug && bySlug.length > 0) return bySlug[0];
      const byId = await base44.entities.GarageSale.filter({ id: slug });
      return byId && byId.length > 0 ? byId[0] : null;
    },
    enabled: !!slug,
  });

  useSEO({
    title: sale ? `${sale.title} — Garage Sale in Cheyenne, WY | Eat, Drink, Play Cheyenne` : 'Garage Sale — Cheyenne, WY',
    description: sale?.description || 'Garage sale details, hours, location, and directions in Cheyenne, Wyoming.',
    jsonLd: sale ? {
      '@context': 'https://schema.org',
      '@type': 'Event',
      name: sale.title,
      startDate: sale.sale_dates?.[0],
      location: {
        '@type': 'Place',
        name: sale.title,
        address: { '@type': 'PostalAddress', streetAddress: sale.address, addressLocality: sale.city, addressRegion: sale.state, postalCode: sale.zip },
      },
      description: sale.description,
    } : null,
  });

  useEffect(() => { window.scrollTo(0, 0); }, [slug]);

  const { data: favorites = [] } = useQuery({
    queryKey: ['gs_favorites'],
    queryFn: async () => user ? (await base44.entities.GarageSaleFavorite.filter({}, '-created_date', 200)) || [] : [],
    enabled: !!user,
  });

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <Skeleton className="h-8 w-2/3 mb-4" />
        <Skeleton className="aspect-video rounded-xl mb-4" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  if (!sale) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <p className="text-stone-600">This garage sale could not be found or has ended.</p>
        <Link to="/GarageSales"><Button className="mt-4 bg-amber-600 hover:bg-amber-700 text-white">Back to Garage Sale Map</Button></Link>
      </div>
    );
  }

  const reveal = shouldRevealExactAddress(sale);
  const live = isLiveNow(sale);
  const display = getDisplayCoords(sale);
  const saved = favorites.some((f) => f.garage_sale_id === sale.id);
  const inRoute = routeStops.some((s) => s.id === sale.id);
  const isOwner = user && sale.created_by_id === user.id;

  const share = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try { await navigator.share({ title: sale.title, text: `Check out this garage sale: ${sale.title}`, url }); } catch {}
    } else {
      navigator.clipboard.writeText(url);
      toast.success('Link copied!');
    }
  };

  const toggleSave = async () => {
    if (!user) { base44.auth.redirectToLogin(window.location.href); return; }
    const existing = favorites.find((f) => f.garage_sale_id === sale.id);
    if (existing) { await base44.entities.GarageSaleFavorite.delete(existing.id); toast.success('Removed from saved'); }
    else { await base44.entities.GarageSaleFavorite.create({ garage_sale_id: sale.id, garage_sale_title: sale.title }); toast.success('Saved!'); }
    queryClient.invalidateQueries(['gs_favorites']);
  };

  const addToRoute = () => {
    setRouteStops((prev) => {
      const next = prev.find((s) => s.id === sale.id) ? prev : [...prev, { id: sale.id, title: sale.title, lat: display.lat, lng: display.lng, end_time: sale.end_time, address: sale.address }];
      localStorage.setItem('gs_route_stops', JSON.stringify(next));
      return next;
    });
    toast.success('Added to route');
  };

  const directions = () => {
    window.open(buildGoogleMapsRouteUrl([{ lat: display.lat, lng: display.lng }]), '_blank');
  };

  const submitReport = async () => {
    if (!user) { base44.auth.redirectToLogin(window.location.href); return; }
    try {
      await base44.entities.GarageSaleReport.create({
        garage_sale_id: sale.id, garage_sale_title: sale.title,
        reporter_email: user.email, reason: reportReason, details: reportDetails,
      });
      toast.success('Report sent. Thank you!');
      setReportOpen(false); setReportDetails('');
    } catch { toast.error('Could not submit report'); }
  };

  const handleDelete = async () => {
    if (!confirm('Delete this garage sale listing? This cannot be undone.')) return;
    await base44.entities.GarageSale.delete(sale.id);
    toast.success('Listing deleted');
    navigate('/GarageSales');
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 pb-20">
      <Link to="/GarageSales" className="inline-flex items-center gap-1 text-sm font-medium text-amber-700 hover:text-amber-900 hover:underline mb-4">
        <ArrowLeft className="w-4 h-4" />
        Back to Garage Sale Map
      </Link>
      {sale.demo && (
        <div className="bg-amber-100 border-2 border-amber-400 rounded-xl p-3 mb-4 flex items-start gap-2">
          <Info className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-amber-900 text-sm">Demo Listing — For Demonstration Only</p>
            <p className="text-amber-800 text-xs mt-0.5">This is a sample sale created to show how the garage sale map works. It is not a real event.</p>
          </div>
        </div>
      )}

      {/* Photos */}
      {sale.photos?.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
          {sale.photos.map((p, i) => (
            <img key={i} src={p} alt={`${sale.title} ${i + 1}`} className="w-full h-32 sm:h-40 object-cover rounded-lg" />
          ))}
        </div>
      )}

      <div className="flex items-start justify-between gap-2 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-stone-800">{sale.title}</h1>
          <span className="inline-block text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full mt-1">
            {getEventTypeLabel(sale.event_type)}
          </span>
          {live && <span className="ml-2 inline-block text-xs bg-green-600 text-white px-2 py-0.5 rounded-full">● Live Now</span>}
        </div>
        <div className="flex gap-2">
          {isOwner && (
            <>
              <Link to={`/AddGarageSale?id=${sale.id}`}><Button variant="outline" size="sm" className="border-stone-300"><Pencil className="w-4 h-4" /></Button></Link>
              <Button variant="outline" size="sm" onClick={handleDelete} className="border-rose-300 text-rose-600"><Trash2 className="w-4 h-4" /></Button>
            </>
          )}
        </div>
      </div>

      {/* Date & time */}
      <div className="bg-white rounded-xl border border-stone-200 p-3 mt-4 space-y-1.5 text-sm">
        <div className="flex items-center gap-2 text-stone-700">
          <Calendar className="w-4 h-4 text-amber-700" />
          {(sale.sale_dates || []).map(formatDateWithYear).join('  •  ')}
        </div>
        <div className="flex items-center gap-2 text-stone-700">
          <Clock className="w-4 h-4 text-amber-700" />
          {formatTime(sale.start_time)} – {formatTime(sale.end_time)}
        </div>
        <div className="flex items-center gap-2 text-stone-700">
          <MapPin className="w-4 h-4 text-amber-700" />
          {reveal ? `${sale.address}, ${sale.city}, ${sale.state} ${sale.zip}` : `Approximate location · ${sale.city || 'Cheyenne'} (exact address revealed the morning of the sale)`}
        </div>
      </div>

      {/* Map */}
      <div className="h-56 rounded-xl overflow-hidden border-2 border-amber-200 mt-4">
        <MapContainer center={[display.lat, display.lng]} zoom={reveal ? 14 : 12} scrollWheelZoom className="w-full h-full" style={{ background: '#e8e0d4' }}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap contributors" />
          <Marker position={[display.lat, display.lng]} icon={pinIcon}>
            <Popup>{display.approximate ? 'Approximate location' : sale.title}</Popup>
          </Marker>
          <FlyTo target={[display.lat, display.lng]} />
        </MapContainer>
      </div>

      {/* Description */}
      {sale.description && (
        <div className="bg-white rounded-xl border border-stone-200 p-4 mt-4">
          <p className="text-stone-700 whitespace-pre-wrap">{sale.description}</p>
        </div>
      )}

      {/* Categories */}
      {sale.categories?.length > 0 && (
        <div className="mt-4">
          <h3 className="font-semibold text-stone-800 text-sm mb-2">Categories</h3>
          <div className="flex flex-wrap gap-2">
            {sale.categories.map((c) => (
              <span key={c} className="text-sm bg-amber-50 text-amber-800 px-3 py-1 rounded-full border border-amber-200">{getCategoryLabel(c)}</span>
            ))}
          </div>
        </div>
      )}

      {/* Special notes */}
      {sale.special_notes?.length > 0 && (
        <div className="mt-3">
          <h3 className="font-semibold text-stone-800 text-sm mb-2">Good to Know</h3>
          <div className="flex flex-wrap gap-2">
            {sale.special_notes.map((n) => (
              <span key={n} className="text-sm bg-stone-100 text-stone-700 px-3 py-1 rounded-full">{getNoteLabel(n)}</span>
            ))}
          </div>
        </div>
      )}

      {sale.custom_notes && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mt-3 text-sm text-stone-700">
          {sale.custom_notes}
        </div>
      )}

      {sale.contact_info && (
        <p className="text-sm text-stone-600 mt-3">Contact: {sale.contact_info}</p>
      )}

      {/* Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-5">
        <Button onClick={toggleSave} variant={saved ? 'default' : 'outline'} className={saved ? 'bg-green-600 hover:bg-green-700 text-white' : 'border-stone-300'}>
          <Heart className={`w-4 h-4 mr-1 ${saved ? 'fill-current' : ''}`} /> {saved ? 'Saved' : 'Save'}
        </Button>
        <Button onClick={addToRoute} variant={inRoute ? 'default' : 'outline'} className={inRoute ? 'bg-amber-700 text-white' : 'border-stone-300'}>
          <Plus className="w-4 h-4 mr-1" /> {inRoute ? 'In Route' : 'Add to Route'}
        </Button>
        <Button onClick={directions} variant="outline" className="border-stone-300">
          <Navigation className="w-4 h-4 mr-1" /> Directions
        </Button>
        <Button onClick={share} variant="outline" className="border-stone-300">
          <Share2 className="w-4 h-4 mr-1" /> Share
        </Button>
      </div>

      <div className="flex justify-between items-center mt-6 pt-4 border-t border-stone-200">
        <Link to="/GarageSales" className="text-sm text-amber-700 hover:underline">← Back to Garage Sale Map</Link>
        <button onClick={() => setReportOpen(true)} className="text-xs text-stone-400 hover:text-rose-500 flex items-center gap-1">
          <Flag className="w-3 h-3" /> Report Listing
        </button>
      </div>

      {/* Report dialog */}
      <Dialog open={reportOpen} onOpenChange={setReportOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-amber-800">Report this listing</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <select
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              className="w-full border border-stone-300 rounded-md p-2 text-sm"
            >
              {REPORT_REASONS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
            <Textarea placeholder="Add any details (optional)" value={reportDetails} onChange={(e) => setReportDetails(e.target.value)} rows={3} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReportOpen(false)}>Cancel</Button>
            <Button onClick={submitReport} className="bg-amber-600 hover:bg-amber-700 text-white">Submit Report</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}