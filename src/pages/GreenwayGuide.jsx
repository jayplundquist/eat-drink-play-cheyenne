import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Button } from '@/components/ui/button';
import { MapPin, Navigation, X, Crosshair } from 'lucide-react';

// Fix leaflet default icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const CHEYENNE_CENTER = [41.1399, -104.8202];

const TRAILHEADS = [
  {
    id: 'lions-park',
    name: 'Lions Park Trailhead',
    lat: 41.1712,
    lng: -104.8315,
    description: 'Central hub. Near the Botanic Gardens and Sloan\'s Lake. Access to Dry Creek segments.',
    features: ['Botanic Gardens nearby', 'Sloan\'s Lake access', 'Dry Creek segment', 'Parking available'],
  },
  {
    id: 'cahill',
    name: 'Cahill Playground Trailhead',
    lat: 41.1578,
    lng: -104.7735,
    description: 'Eastern anchor point. Easy access to Taft Road connectors and sports fields.',
    features: ['Taft Road connectors', 'Sports fields', 'Playground', 'Easy terrain'],
  },
  {
    id: 'holliday',
    name: 'Holliday Park Trailhead',
    lat: 41.1332,
    lng: -104.8062,
    description: 'Downtown access point. Near the Big Boots and Lake Minnehaha.',
    features: ['Downtown access', 'Big Boots nearby', 'Lake Minnehaha', 'Scenic views'],
  },
];

// Trail polyline connecting the three trailheads in a loop
const TRAIL_PATH = [
  [41.1712, -104.8315], // Lions Park
  [41.1680, -104.8200],
  [41.1640, -104.8100],
  [41.1600, -104.8000],
  [41.1578, -104.7900],
  [41.1578, -104.7735], // Cahill
  [41.1520, -104.7850],
  [41.1450, -104.7980],
  [41.1400, -104.8050],
  [41.1332, -104.8062], // Holliday Park
  [41.1360, -104.8150],
  [41.1420, -104.8220],
  [41.1500, -104.8280],
  [41.1580, -104.8310],
  [41.1712, -104.8315], // Back to Lions Park
];

// Custom trailhead pin icon
const trailheadIcon = L.divIcon({
  className: '',
  html: `<div style="
    background: #92400e;
    border: 3px solid #fff;
    border-radius: 50% 50% 50% 0;
    width: 28px;
    height: 28px;
    transform: rotate(-45deg);
    box-shadow: 0 2px 8px rgba(0,0,0,0.4);
    display: flex;
    align-items: center;
    justify-content: center;
  ">
    <div style="transform: rotate(45deg); color: white; font-size: 12px; margin-left: 1px; margin-top: 1px;">🥾</div>
  </div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 28],
  popupAnchor: [0, -30],
});

// Pulsing GPS icon
const gpsIcon = L.divIcon({
  className: '',
  html: `<div style="position:relative;width:24px;height:24px;display:flex;align-items:center;justify-content:center;">
    <div style="position:absolute;width:24px;height:24px;border-radius:50%;background:rgba(59,130,246,0.3);animation:gps-pulse 1.8s ease-out infinite;"></div>
    <div style="position:absolute;width:14px;height:14px;border-radius:50%;background:#3b82f6;border:3px solid #fff;box-shadow:0 0 8px rgba(59,130,246,0.8);z-index:1;"></div>
  </div>
  <style>@keyframes gps-pulse{0%{transform:scale(1);opacity:0.8}100%{transform:scale(2.5);opacity:0}}</style>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

// Component to recenter the map
function RecenterControl({ target }) {
  const map = useMap();
  useEffect(() => {
    if (target) {
      map.flyTo(target, 15, { duration: 1.2 });
    }
  }, [target, map]);
  return null;
}

export default function GreenwayGuide() {
  const [userLocation, setUserLocation] = useState(null);
  const [recenterTarget, setRecenterTarget] = useState(null);
  const [selectedTrailhead, setSelectedTrailhead] = useState(null);
  const [locationError, setLocationError] = useState(false);
  const watchIdRef = useRef(null);

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationError(true);
      return;
    }
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        setUserLocation([pos.coords.latitude, pos.coords.longitude]);
        setLocationError(false);
      },
      () => setLocationError(true),
      { enableHighAccuracy: true, maximumAge: 5000 }
    );
    return () => {
      if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current);
    };
  }, []);

  const handleRecenter = useCallback(() => {
    if (userLocation) {
      setRecenterTarget([...userLocation]);
    }
  }, [userLocation]);

  const handleNavigate = (trailhead) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${trailhead.lat},${trailhead.lng}&travelmode=driving`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="relative w-full" style={{ height: 'calc(100vh - 64px)' }}>
      {/* Page title overlay */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] bg-white/90 backdrop-blur rounded-xl px-5 py-2 shadow-lg border-2 border-amber-200 pointer-events-none">
        <h1 className="text-lg font-bold text-amber-900 text-center" style={{ fontFamily: 'Rye, serif' }}>
          🌿 Greater Cheyenne Greenway
        </h1>
      </div>

      {/* GPS location error */}
      {locationError && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-[1000] bg-amber-100 border border-amber-400 text-amber-800 text-xs rounded-lg px-4 py-2 shadow">
          GPS unavailable — enable location for live tracking
        </div>
      )}

      {/* Recenter button */}
      {userLocation && (
        <button
          onClick={handleRecenter}
          className="absolute bottom-6 right-4 z-[1000] bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-xl p-3 flex items-center gap-2 font-semibold transition-colors"
        >
          <Crosshair className="w-5 h-5" />
          <span className="text-sm pr-1">Recenter</span>
        </button>
      )}

      {/* Map */}
      <MapContainer
        center={CHEYENNE_CENTER}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
        zoomControl={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Greenway trail line */}
        <Polyline
          positions={TRAIL_PATH}
          pathOptions={{ color: '#166534', weight: 5, opacity: 0.85, dashArray: null }}
        />

        {/* Trailhead pins */}
        {TRAILHEADS.map((t) => (
          <Marker
            key={t.id}
            position={[t.lat, t.lng]}
            icon={trailheadIcon}
            eventHandlers={{ click: () => setSelectedTrailhead(t) }}
          />
        ))}

        {/* Live user GPS dot */}
        {userLocation && (
          <Marker position={userLocation} icon={gpsIcon} />
        )}

        {/* Recenter fly-to */}
        {recenterTarget && (
          <RecenterControl target={recenterTarget} />
        )}
      </MapContainer>

      {/* Bottom detail sheet */}
      {selectedTrailhead && (
        <div className="absolute bottom-0 left-0 right-0 z-[1001] bg-white rounded-t-2xl shadow-2xl border-t-4 border-amber-800 p-5 max-h-[55vh] overflow-y-auto animate-in slide-in-from-bottom">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-xl">🥾</div>
              <div>
                <h2 className="text-lg font-bold text-amber-900" style={{ fontFamily: 'Rye, serif' }}>
                  {selectedTrailhead.name}
                </h2>
                <p className="text-xs text-stone-500 font-mono">
                  {selectedTrailhead.lat.toFixed(4)}, {selectedTrailhead.lng.toFixed(4)}
                </p>
              </div>
            </div>
            <button onClick={() => setSelectedTrailhead(null)} className="text-stone-400 hover:text-stone-600">
              <X className="w-5 h-5" />
            </button>
          </div>

          <p className="text-stone-700 text-sm mb-4 leading-relaxed">{selectedTrailhead.description}</p>

          <div className="mb-5">
            <p className="text-xs font-semibold text-amber-800 uppercase tracking-wide mb-2">Key Features</p>
            <div className="flex flex-wrap gap-2">
              {selectedTrailhead.features.map((f) => (
                <span key={f} className="bg-green-50 border border-green-200 text-green-800 text-xs rounded-full px-3 py-1">
                  {f}
                </span>
              ))}
            </div>
          </div>

          <Button
            onClick={() => handleNavigate(selectedTrailhead)}
            className="w-full bg-amber-800 hover:bg-amber-900 text-white font-semibold py-5"
          >
            <Navigation className="w-4 h-4 mr-2" />
            Navigate to Trailhead
          </Button>
        </div>
      )}
    </div>
  );
}