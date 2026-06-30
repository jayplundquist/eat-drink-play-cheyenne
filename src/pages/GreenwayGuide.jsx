import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Button } from '@/components/ui/button';
import { Navigation, X, Crosshair } from 'lucide-react';

// Fix leaflet default icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const CHEYENNE_CENTER = [41.1399, -104.8202];

// ─── Trail Segments ───────────────────────────────────────────────────────────
const TRAIL_SEGMENTS = [
  {
    id: 'dry-creek',
    name: 'Dry Creek Greenway',
    color: '#166534',
    description: 'North/Northeast Corridor',
    path: [
      [41.1772, -104.8510], // Western Hills
      [41.1745, -104.8430],
      [41.1712, -104.8315], // Lions Park
      [41.1700, -104.8215],
      [41.1685, -104.8112], // Mylar Park
      [41.1665, -104.8010],
      [41.1640, -104.7920], // Kiwanis Park
      [41.1610, -104.7830],
      [41.1578, -104.7735], // Cahill Playground
      [41.1520, -104.7620],
      [41.1448, -104.7485], // Dry Creek Park
    ],
  },
  {
    id: 'allison-draw',
    name: 'Allison Draw Greenway',
    color: '#0d9488',
    description: 'South Side Corridor',
    path: [
      [41.1325, -104.8322], // MLK Jr Park
      [41.1250, -104.8290],
      [41.1180, -104.8260],
      [41.1030, -104.8210], // Clear Creek Park
      [41.1020, -104.8030],
      [41.1015, -104.7850], // LCCC
      [41.1020, -104.7740],
      [41.1182, -104.7640], // Sun Valley Park
    ],
  },
  {
    id: 'crow-creek',
    name: 'Crow Creek Greenway',
    color: '#7c3aed',
    description: 'Downtown/West Side',
    path: [
      [41.1325, -104.8322], // MLK Jr Park
      [41.1330, -104.8200],
      [41.1332, -104.8062], // Holliday Park
      [41.1338, -104.7940],
      [41.1345, -104.7820], // toward Morrie Ave
    ],
  },
  {
    id: 'sun-valley-east',
    name: 'Sun Valley & East Cheyenne',
    color: '#b45309',
    description: 'Eastern Railroad Corridors',
    path: [
      [41.1182, -104.7640], // Sun Valley Park
      [41.1280, -104.7580],
      [41.1380, -104.7520],
      [41.1448, -104.7485], // Dry Creek Park
      [41.1510, -104.7600],
      [41.1578, -104.7735], // Cahill Playground
      [41.1640, -104.7920], // Kiwanis Park
    ],
  },
];

// ─── Trailheads ───────────────────────────────────────────────────────────────
const TRAILHEADS = [
  {
    id: 'lions-park',
    name: 'Lions Park',
    label: 'Central Hub',
    lat: 41.1712,
    lng: -104.8315,
    description: 'Central junction for Dry Creek segments with lakeside amenities.',
    features: ['Botanic Gardens', "Sloan's Lake beach", 'Paddle boats', 'Dry Creek junction'],
  },
  {
    id: 'holliday-park',
    name: 'Holliday Park',
    label: 'Downtown Anchor',
    lat: 41.1332,
    lng: -104.8062,
    description: 'Downtown access point near historic landmarks and Lake Minnehaha.',
    features: ['Big Boy Steam Engine #4004', 'Lake Minnehaha', 'Downtown trail connectors'],
  },
  {
    id: 'cahill',
    name: 'Cahill Playground',
    label: 'East Side Hub',
    lat: 41.1578,
    lng: -104.7735,
    description: 'Eastern hub with Dell Range corridor access and sports facilities.',
    features: ['Dell Range corridor', 'Sports fields', 'Taft Road connector links'],
  },
  {
    id: 'mylar-park',
    name: 'Mylar Park',
    label: 'North-Central Link',
    lat: 41.1685,
    lng: -104.8112,
    description: 'Paved loops and neighborhood spurs connecting to the Dry Creek trail.',
    features: ['Paved loops', 'Willow trees', 'Playground', 'Dry Creek spurs'],
  },
  {
    id: 'western-hills',
    name: 'Western Hills Park',
    label: 'Northwest Terminal',
    lat: 41.1772,
    lng: -104.8510,
    description: 'Westernmost starting terminal of the uninterrupted Dry Creek trail near I-25.',
    features: ['Dry Creek trail terminus', 'Near I-25 access', '8-mile trail start'],
  },
  {
    id: 'dry-creek-park',
    name: 'Dry Creek Park',
    label: 'East Terminal',
    lat: 41.1448,
    lng: -104.7485,
    description: 'Southeastern terminus of the continuous 8-mile Dry Creek trail near US 30.',
    features: ['Dry Creek trail terminus', 'Near US 30', '8-mile trail end'],
  },
  {
    id: 'lccc',
    name: 'LCCC',
    label: 'Southeast Hub',
    lat: 41.1015,
    lng: -104.7850,
    description: 'Connects the Allison Draw Greenway directly into college campus pathways.',
    features: ['Allison Draw connection', 'Campus pathways', 'Southeast terminus'],
  },
  {
    id: 'mlk-park',
    name: 'Martin Luther King Jr. Park',
    label: 'West Side Access',
    lat: 41.1325,
    lng: -104.8322,
    description: 'Community hub and connection point for the Crow Creek trail segment.',
    features: ['Community spaces', 'Playground', 'Crow Creek connection'],
  },
  {
    id: 'clear-creek',
    name: 'Clear Creek Park',
    label: 'South-Central Access',
    lat: 41.1030,
    lng: -104.8210,
    description: 'South-side outdoor recreation with fitness equipment and Allison Draw access.',
    features: ['Fitness equipment', 'Allison Draw pathway', 'Outdoor recreation'],
  },
  {
    id: 'dutcher-field',
    name: 'Dutcher Field / Airport Pkwy',
    label: 'Midtown Link',
    lat: 41.1510,
    lng: -104.8145,
    description: 'Sports complex with airfield views and direct midtown pathway connectors.',
    features: ['Sports complex parking', 'Airfield views', 'Midtown connectors'],
  },
  {
    id: 'sun-valley',
    name: 'Sun Valley Park',
    label: 'Southeast Neighborhood',
    lat: 41.1182,
    lng: -104.7640,
    description: 'Quiet neighborhood paths running parallel to the eastern railroad corridor.',
    features: ['Quiet neighborhood paths', 'Railroad corridor views', 'Open space'],
  },
  {
    id: 'kiwanis',
    name: 'Kiwanis Park',
    label: 'Northeast Access',
    lat: 41.1640,
    lng: -104.7920,
    description: 'Green space nestled between the Dry Creek and Dell Range connector lines.',
    features: ['Dry Creek connector', 'Dell Range access', 'Quiet green space'],
  },
];

// Custom trailhead pin icon
const makeTrailheadIcon = () => L.divIcon({
  className: '',
  html: `<div style="
    background: #92400e;
    border: 3px solid #fff;
    border-radius: 50% 50% 50% 0;
    width: 26px;
    height: 26px;
    transform: rotate(-45deg);
    box-shadow: 0 2px 8px rgba(0,0,0,0.4);
  ">
    <div style="transform: rotate(45deg); color: white; font-size: 11px; text-align:center; line-height:22px;">🥾</div>
  </div>`,
  iconSize: [26, 26],
  iconAnchor: [13, 26],
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

function RecenterControl({ target }) {
  const map = useMap();
  useEffect(() => {
    if (target) map.flyTo(target, 15, { duration: 1.2 });
  }, [target, map]);
  return null;
}

export default function GreenwayGuide() {
  const [userLocation, setUserLocation] = useState(null);
  const [recenterTarget, setRecenterTarget] = useState(null);
  const [selectedTrailhead, setSelectedTrailhead] = useState(null);
  const [locationError, setLocationError] = useState(false);
  const watchIdRef = useRef(null);
  const trailheadIcon = useRef(makeTrailheadIcon());

  useEffect(() => {
    if (!navigator.geolocation) { setLocationError(true); return; }
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => { setUserLocation([pos.coords.latitude, pos.coords.longitude]); setLocationError(false); },
      () => setLocationError(true),
      { enableHighAccuracy: true, maximumAge: 5000 }
    );
    return () => { if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current); };
  }, []);

  const handleRecenter = useCallback(() => {
    if (userLocation) setRecenterTarget([...userLocation]);
  }, [userLocation]);

  const handleNavigate = (trailhead) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${trailhead.lat},${trailhead.lng}&travelmode=walking`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="relative w-full" style={{ height: 'calc(100vh - 64px)' }}>
      {/* Title overlay */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] bg-white/90 backdrop-blur rounded-xl px-5 py-2 shadow-lg border-2 border-amber-200 pointer-events-none">
        <h1 className="text-lg font-bold text-amber-900 text-center whitespace-nowrap" style={{ fontFamily: 'Rye, serif' }}>
          🌿 Greater Cheyenne Greenway
        </h1>
      </div>

      {/* Trail legend */}
      <div className="absolute top-16 left-3 z-[1000] bg-white/90 backdrop-blur rounded-lg shadow-md border border-amber-200 px-3 py-2 space-y-1">
        {TRAIL_SEGMENTS.map(seg => (
          <div key={seg.id} className="flex items-center gap-2 text-xs text-stone-700">
            <div className="w-5 h-1.5 rounded-full flex-shrink-0" style={{ background: seg.color }} />
            <span>{seg.name}</span>
          </div>
        ))}
      </div>

      {/* GPS error */}
      {locationError && (
        <div className="absolute top-16 right-3 z-[1000] bg-amber-100 border border-amber-400 text-amber-800 text-xs rounded-lg px-3 py-2 shadow max-w-[180px]">
          Enable GPS for live location tracking
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
      <MapContainer center={CHEYENNE_CENTER} zoom={13} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Trail segment polylines */}
        {TRAIL_SEGMENTS.map(seg => (
          <Polyline
            key={seg.id}
            positions={seg.path}
            pathOptions={{ color: seg.color, weight: 5, opacity: 0.85 }}
          />
        ))}

        {/* Trailhead pins */}
        {TRAILHEADS.map(t => (
          <Marker
            key={t.id}
            position={[t.lat, t.lng]}
            icon={trailheadIcon.current}
            eventHandlers={{ click: () => setSelectedTrailhead(t) }}
          />
        ))}

        {/* Live GPS dot */}
        {userLocation && <Marker position={userLocation} icon={gpsIcon} />}

        {/* Recenter fly-to */}
        {recenterTarget && <RecenterControl target={recenterTarget} />}
      </MapContainer>

      {/* Bottom detail sheet */}
      {selectedTrailhead && (
        <div className="absolute bottom-0 left-0 right-0 z-[1001] bg-white rounded-t-2xl shadow-2xl border-t-4 border-amber-800 p-5 max-h-[55vh] overflow-y-auto">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-xl flex-shrink-0">🥾</div>
              <div>
                <h2 className="text-lg font-bold text-amber-900 leading-tight" style={{ fontFamily: 'Rye, serif' }}>
                  {selectedTrailhead.name}
                </h2>
                <span className="text-xs bg-green-100 text-green-800 rounded-full px-2 py-0.5 font-medium">
                  {selectedTrailhead.label}
                </span>
              </div>
            </div>
            <button onClick={() => setSelectedTrailhead(null)} className="text-stone-400 hover:text-stone-600 flex-shrink-0 mt-1">
              <X className="w-5 h-5" />
            </button>
          </div>

          <p className="text-xs text-stone-500 font-mono mb-3">
            {selectedTrailhead.lat.toFixed(4)}, {selectedTrailhead.lng.toFixed(4)}
          </p>

          <p className="text-stone-700 text-sm mb-4 leading-relaxed">{selectedTrailhead.description}</p>

          <div className="mb-5">
            <p className="text-xs font-semibold text-amber-800 uppercase tracking-wide mb-2">Key Features</p>
            <div className="flex flex-wrap gap-2">
              {selectedTrailhead.features.map(f => (
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
            Get Walking Directions
          </Button>
        </div>
      )}
    </div>
  );
}