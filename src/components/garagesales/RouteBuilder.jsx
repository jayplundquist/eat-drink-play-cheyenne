import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Navigation,
  Crosshair,
  Route as RouteIcon,
  RefreshCw,
  Trash2,
  ArrowUp,
  ArrowDown,
  MapPin,
  Clock,
  AlertTriangle,
  ExternalLink,
  Save,
  Loader2,
} from 'lucide-react';
import { optimizeRoute, formatArrival } from '@/lib/garageSaleRoute';
import { buildGoogleMapsRouteUrl, formatDateShort, formatTime } from '@/lib/garageSaleHelpers';

export default function RouteBuilder({
  open,
  onClose,
  stops, // array of sales
  onRemoveStop,
  startLabel,
  setStartLabel,
  startCoords, // {lat,lng} | null
  setStartCoords,
  returnToStart,
  setReturnToStart,
  onOptimized,
  onSaveRoute,
  isSavingRoute,
}) {
  const [optimized, setOptimized] = useState(null);
  const [optimizing, setOptimizing] = useState(false);
  const [addressInput, setAddressInput] = useState('');
  const [geocoding, setGeocoding] = useState(false);

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Location not available on this device.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setStartCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setStartLabel('Current Location');
      },
      () => alert('Could not get your location. Enter an address instead.'),
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const geocodeAddress = async () => {
    if (!addressInput.trim()) return;
    setGeocoding(true);
    try {
      const params = new URLSearchParams({
        format: 'json', limit: '1', country: 'US', addressdetails: '1',
      });
      params.set('street', addressInput);
      params.set('city', 'Cheyenne');
      params.set('state', 'WY');
      const url = `https://nominatim.openstreetmap.org/search?${params.toString()}`;
      const res = await fetch(url, { headers: { Accept: 'application/json' } });
      const data = await res.json();
      if (data && data[0]) {
        setStartCoords({ lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) });
        setStartLabel(addressInput);
      } else {
        alert('Address not found. Try a more specific address.');
      }
    } catch {
      alert('Could not look up that address. Try again.');
    } finally {
      setGeocoding(false);
    }
  };

  const handleOptimize = () => {
    if (!startCoords) {
      alert('Choose a starting point first.');
      return;
    }
    if (stops.length === 0) {
      alert('Add at least one garage sale to your route.');
      return;
    }
    setOptimizing(true);
    setTimeout(() => {
      const result = optimizeRoute({
        start: startCoords,
        stops: stops.map((s) => ({
          id: s.id,
          lat: s.lat,
          lng: s.lng,
          title: s.title,
          closeTime: s.end_time,
        })),
        returnToStart,
      });
      setOptimized(result);
      if (onOptimized) onOptimized(result.order);
      setOptimizing(false);
    }, 50);
  };

  const move = (idx, dir) => {
    if (!optimized) return;
    const order = [...optimized.order];
    const target = idx + dir;
    if (target < 0 || target >= order.length) return;
    [order[idx], order[target]] = [order[target], order[idx]];
    order.forEach((s, i) => (s.order = i + 1));
    setOptimized({ ...optimized, order });
    if (onOptimized) onOptimized(order);
  };

  const removeStop = (id) => {
    onRemoveStop(id);
    if (optimized) {
      const newOrder = optimized.order.filter((s) => s.id !== id);
      setOptimized({ ...optimized, order: newOrder });
      if (onOptimized) onOptimized(newOrder);
    }
  };

  const startRoute = () => {
    if (!optimized) return;
    const pts = [
      ...(startCoords ? [startCoords] : []),
      ...optimized.order.map((s) => ({ lat: s.lat, lng: s.lng })),
    ];
    window.open(buildGoogleMapsRouteUrl(pts), '_blank');
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-amber-800">
            <RouteIcon className="w-5 h-5" /> Build My Garage Sale Route
          </DialogTitle>
        </DialogHeader>

        {/* Starting point */}
        <div className="space-y-2">
          <Label>Starting Point</Label>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={useCurrentLocation} className="border-amber-300 text-amber-700">
              <Crosshair className="w-4 h-4 mr-1" /> My Location
            </Button>
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="Enter starting address"
              value={addressInput}
              onChange={(e) => setAddressInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), geocodeAddress())}
            />
            <Button type="button" variant="outline" onClick={geocodeAddress} disabled={geocoding} className="border-stone-300">
              {geocoding ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Set'}
            </Button>
          </div>
          {startCoords && (
            <p className="text-sm text-green-700 flex items-center gap-1">
              <MapPin className="w-3 h-3" /> Start: {startLabel}
            </p>
          )}
          <label className="flex items-center gap-2 text-sm text-stone-600">
            <input type="checkbox" checked={returnToStart} onChange={(e) => setReturnToStart(e.target.checked)} />
            Return to starting point (round trip)
          </label>
        </div>

        {/* Stops */}
        <div className="space-y-2">
          <Label>Stops ({stops.length})</Label>
          {stops.length === 0 ? (
            <p className="text-sm text-stone-500">No sales added yet. Tap “+” on a sale to add it to your route.</p>
          ) : (
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {stops.map((s) => (
                <div key={s.id} className="flex items-center gap-2 bg-stone-50 rounded-md px-2 py-1.5 text-sm">
                  <MapPin className="w-3 h-3 text-amber-700 shrink-0" />
                  <span className="flex-1 truncate">{s.title}</span>
                  <button onClick={() => removeStop(s.id)} className="text-rose-500 hover:text-rose-700">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <Button onClick={handleOptimize} disabled={optimizing} className="w-full bg-amber-600 hover:bg-amber-700 text-white">
          {optimizing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RouteIcon className="w-4 h-4 mr-2" />}
          Optimize My Route
        </Button>

        {/* Optimized result */}
        {optimized && (
          <div className="space-y-3 border-t-2 border-amber-200 pt-3">
            <div className="flex items-center justify-between text-sm">
              <span className="font-semibold text-stone-700">Your Garage Sale Route</span>
              <Button size="sm" variant="ghost" onClick={handleOptimize}>
                <RefreshCw className="w-3 h-3 mr-1" /> Re-Optimize
              </Button>
            </div>
            <div className="flex gap-3 text-sm text-stone-600">
              <span className="flex items-center gap-1"><Navigation className="w-3 h-3" /> {optimized.totalDistanceMi} mi</span>
              <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> ~{optimized.totalTimeMin} min</span>
            </div>

            {optimized.warnings.length > 0 && (
              <div className="bg-amber-50 border border-amber-300 rounded-md p-2 space-y-1">
                {optimized.warnings.map((w, i) => (
                  <p key={i} className="text-xs text-amber-800 flex items-start gap-1">
                    <AlertTriangle className="w-3 h-3 mt-0.5 shrink-0" /> {w}
                  </p>
                ))}
              </div>
            )}

            <div className="space-y-1.5">
              {optimized.order.map((s, idx) => (
                <div key={s.id} className="flex items-center gap-2 bg-white border border-stone-200 rounded-md px-2 py-1.5">
                  <span className="w-6 h-6 rounded-full bg-amber-700 text-white text-xs font-bold flex items-center justify-center shrink-0">
                    {s.order}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-stone-800 truncate">{s.title}</div>
                    <div className="text-xs text-stone-500">
                      Arrive ~{formatArrival(s.arrival)} · closes {formatTime(s.closeTime)}
                    </div>
                  </div>
                  <button onClick={() => move(idx, -1)} disabled={idx === 0} className="text-stone-400 hover:text-stone-700 disabled:opacity-30">
                    <ArrowUp className="w-4 h-4" />
                  </button>
                  <button onClick={() => move(idx, 1)} disabled={idx === optimized.order.length - 1} className="text-stone-400 hover:text-stone-700 disabled:opacity-30">
                    <ArrowDown className="w-4 h-4" />
                  </button>
                  <button onClick={() => removeStop(s.id)} className="text-rose-500 hover:text-rose-700">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex gap-2 pt-1">
              <Button onClick={startRoute} className="flex-1 bg-green-700 hover:bg-green-800 text-white">
                <Navigation className="w-4 h-4 mr-2" /> Start Route
                <ExternalLink className="w-3 h-3 ml-1" />
              </Button>
              {onSaveRoute && (
                <Button onClick={onSaveRoute} disabled={isSavingRoute} variant="outline" className="border-amber-300 text-amber-700">
                  {isSavingRoute ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                </Button>
              )}
            </div>
            <p className="text-xs text-stone-400 text-center">Opens the route in Google Maps for turn-by-turn directions.</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}