import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MapPin, Loader2, Search } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

// Cheyenne center — used when no pin is set yet so the map still opens somewhere useful.
const CHEYENNE_CENTER = [41.14, -104.82];

// Western-themed amber pin.
function buildPinIcon() {
  return L.divIcon({
    className: 'chuck-stop-pin',
    html: `<div style="
      width: 28px; height: 28px; border-radius: 50% 50% 50% 0;
      background: #b45309; transform: rotate(-45deg);
      border: 2px solid #78350f;
      box-shadow: 0 2px 6px rgba(0,0,0,0.35);
    "></div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 28],
  });
}

// Lets the parent recenter the map when a new pin drops from geocode/GPS.
function RecenterOn({ lat, lng }) {
  const map = useMap();
  React.useEffect(() => {
    if (lat != null && lng != null) {
      map.setView([lat, lng], Math.max(map.getZoom(), 15));
    }
  }, [lat, lng]);
  return null;
}

// Captures clicks on the map to drop a pin.
function ClickHandler({ onPick }) {
  useMapEvents({
    click(e) {
      onPick({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
}

/**
 * StopLocationPicker — lets a vendor pin a future stop three ways:
 *   1. type an address → auto-geocode → pin drops → drag to fine-tune
 *   2. tap the map to drop a pin directly
 *   3. "Use my current spot" GPS button (still works, pin shows on the map)
 *
 * Controlled via `value` ({ address, lat, lng }) and `onChange`.
 */
export default function StopLocationPicker({ value, onChange, locating, onUseGps }) {
  const [geocoding, setGeocoding] = useState(false);
  const hasPin = value.lat != null && value.lng != null;
  const center = hasPin ? [value.lat, value.lng] : CHEYENNE_CENTER;

  async function handleGeocode() {
    const addr = (value.address || '').trim();
    if (!addr) {
      toast.error('Type a street address first, or tap the map.');
      return;
    }
    setGeocoding(true);
    try {
      const res = await base44.functions.invoke('geocodeAddress', {
        address: addr,
        city: 'Cheyenne',
        state: 'WY',
      });
      if (!res || !res.coordinates) {
        toast.error("Couldn't find that address. Drag the pin on the map instead.");
        return;
      }
      const [lat, lng] = res.coordinates;
      onChange({ ...value, lat, lng });
    } catch {
      toast.error('Geocoder is busy. Try the map tap instead.');
    } finally {
      setGeocoding(false);
    }
  }

  return (
    <div className="space-y-3">
      {/* Address row */}
      <div>
        <Label className="text-sm">Address (optional)</Label>
        <div className="flex gap-2">
          <Input
            placeholder="1621 Capitol Ave"
            value={value.address || ''}
            onChange={(e) => onChange({ ...value, address: e.target.value })}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleGeocode();
              }
            }}
          />
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="border-amber-400 text-amber-800 hover:bg-amber-50"
            disabled={geocoding}
            onClick={handleGeocode}
          >
            {geocoding ? (
              <Loader2 className="w-4 h-4 mr-1 animate-spin" />
            ) : (
              <Search className="w-4 h-4 mr-1" />
            )}
            Find
          </Button>
        </div>
      </div>

      {/* Mini map */}
      <div className="rounded-lg overflow-hidden border-2 border-amber-700" style={{ height: 220 }}>
        <MapContainer
          center={center}
          zoom={hasPin ? 15 : 12}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={false}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; OpenStreetMap'
          />
          <RecenterOn lat={value.lat} lng={value.lng} />
          <ClickHandler onPick={(coords) => onChange({ ...value, ...coords })} />
          {hasPin && (
            <Marker
              position={[value.lat, value.lng]}
              icon={buildPinIcon()}
              draggable
              eventHandlers={{
                dragend: (e) => {
                  const ll = e.target.getLatLng();
                  onChange({ ...value, lat: ll.lat, lng: ll.lng });
                },
              }}
            />
          )}
        </MapContainer>
      </div>

      {/* GPS + readout */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={locating}
          onClick={onUseGps}
        >
          {locating ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <MapPin className="w-4 h-4 mr-2" />
          )}
          Use my current spot
        </Button>
        {hasPin ? (
          <span className="text-xs text-stone-500">
            Pin set ({value.lat.toFixed(4)}, {value.lng.toFixed(4)}) — drag to fine-tune
          </span>
        ) : (
          <span className="text-xs text-stone-500">
            Type an address & tap Find, or tap the map to drop a pin
          </span>
        )}
      </div>
    </div>
  );
}