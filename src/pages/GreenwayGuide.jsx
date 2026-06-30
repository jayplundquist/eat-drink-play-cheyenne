import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Button } from '@/components/ui/button';
import { Navigation, X, Crosshair } from 'lucide-react';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const CHEYENNE_CENTER = [41.1450, -104.8100];

// ─── Trail Segments ─── Coordinates snapped to real creek beds / road corridors
const TRAIL_SEGMENTS = [
  {
    id: 'dry-creek',
    name: 'Dry Creek Greenway',
    color: '#166534',
    description: 'North/Northeast Corridor',
    // Follows Dry Creek bed: W Hills → parallel Yellowstone Rd → under Central/Warren →
    // alongside Mylar Park → under Dell Range Blvd → parallel Taft Rd → Cahill → Dry Creek Park
    path: [
      [41.1772, -104.8510], // Western Hills Park terminal
      [41.1760, -104.8450],
      [41.1748, -104.8390],
      [41.1735, -104.8340],
      [41.1722, -104.8315], // Creek bends south near Yellowstone Rd
      [41.1712, -104.8315], // Lions Park / Central Ave crossing
      [41.1706, -104.8290],
      [41.1700, -104.8260],
      [41.1695, -104.8225], // Approaching Warren Ave underpass
      [41.1690, -104.8185],
      [41.1685, -104.8112], // Mylar Park – creek runs alongside
      [41.1680, -104.8070],
      [41.1672, -104.8020],
      [41.1663, -104.7975], // Under Dell Range Blvd
      [41.1655, -104.7950],
      [41.1648, -104.7940],
      [41.1640, -104.7920], // Kiwanis Park
      [41.1628, -104.7880],
      [41.1615, -104.7845],
      [41.1600, -104.7810], // Parallel Taft Rd corridor begins
      [41.1590, -104.7790],
      [41.1578, -104.7735], // Cahill Playground
      [41.1562, -104.7695],
      [41.1545, -104.7640],
      [41.1528, -104.7580],
      [41.1510, -104.7530],
      [41.1490, -104.7510],
      [41.1470, -104.7495],
      [41.1448, -104.7485], // Dry Creek Park – east terminal (US 30)
    ],
  },
  {
    id: 'crow-creek',
    name: 'Crow Creek Greenway',
    color: '#7c3aed',
    description: 'Downtown / West Side',
    // Parallel to W Lincolnway → beside Ames/Snyder → under Southwest Dr →
    // UP railroad corridor → Morrie Ave → Holliday Park
    path: [
      [41.1325, -104.8322], // MLK Jr. Park – Lincolnway corridor start
      [41.1328, -104.8290],
      [41.1330, -104.8255], // Alongside Ames Ave
      [41.1331, -104.8218],
      [41.1332, -104.8185], // Snyder Ave crossing
      [41.1332, -104.8150],
      [41.1332, -104.8120], // Under Southwest Drive
      [41.1332, -104.8090],
      [41.1332, -104.8062], // Holliday Park / Lake Minnehaha
      [41.1333, -104.8035],
      [41.1335, -104.8005], // UP railroad corridor begins
      [41.1336, -104.7975],
      [41.1338, -104.7945],
      [41.1340, -104.7910], // Parallel to railroad tracks
      [41.1342, -104.7875],
      [41.1344, -104.7845], // Morrie Ave terminus
    ],
  },
  {
    id: 'allison-draw',
    name: 'Allison Draw Greenway',
    color: '#0d9488',
    description: 'South Side Corridor',
    // Parallel to College Drive (WY-212) / S Greeley Hwy → into LCCC campus loop
    path: [
      [41.1325, -104.8322], // MLK Jr. Park – west anchor
      [41.1300, -104.8310],
      [41.1280, -104.8295],
      [41.1258, -104.8278], // Tracking College Dr south corridor
      [41.1235, -104.8262],
      [41.1210, -104.8245],
      [41.1185, -104.8228],
      [41.1155, -104.8215],
      [41.1120, -104.8210],
      [41.1085, -104.8210], // S Greeley Hwy corridor
      [41.1055, -104.8210],
      [41.1030, -104.8210], // Clear Creek Park
      [41.1022, -104.8180],
      [41.1018, -104.8140],
      [41.1016, -104.8100],
      [41.1015, -104.8050],
      [41.1015, -104.8000],
      [41.1015, -104.7950],
      [41.1015, -104.7900],
      [41.1015, -104.7850], // LCCC – campus pathway entry
      [41.1018, -104.7820],
      [41.1022, -104.7790], // Campus loop
      [41.1018, -104.7760],
      [41.1012, -104.7740],
    ],
  },
  {
    id: 'sun-valley-east',
    name: 'Sun Valley & East Cheyenne',
    color: '#b45309',
    description: 'Eastern Railroad Corridors',
    // N-S parallel to eastern industrial railroad → E Park Ave → Pershing Blvd link
    path: [
      [41.1012, -104.7740], // LCCC east end / south anchor
      [41.1030, -104.7720],
      [41.1060, -104.7700],
      [41.1090, -104.7680],
      [41.1110, -104.7665],
      [41.1140, -104.7652],
      [41.1182, -104.7640], // Sun Valley Park
      [41.1210, -104.7630],
      [41.1240, -104.7625], // Parallel railroad corridor – running north
      [41.1270, -104.7620],
      [41.1300, -104.7618], // East Park Ave / Pershing Blvd link
      [41.1330, -104.7618],
      [41.1360, -104.7620],
      [41.1390, -104.7625],
      [41.1420, -104.7640],
      [41.1448, -104.7485], // Dry Creek Park – joins Dry Creek trail
      [41.1475, -104.7520],
      [41.1510, -104.7600], // Dutcher Field area
      [41.1540, -104.7650],
      [41.1578, -104.7735], // Cahill Playground
      [41.1608, -104.7820],
      [41.1640, -104.7920], // Kiwanis Park – northeastern terminus
    ],
  },
];

// ─── Trailheads ───────────────────────────────────────────────────────────────
const TRAILHEADS = [
  { id: 'lions-park',    name: 'Lions Park',                       label: 'Central Hub',            lat: 41.1712, lng: -104.8315, description: 'Central junction for Dry Creek segments with lakeside amenities.',            features: ["Botanic Gardens", "Sloan's Lake beach", "Paddle boats", "Dry Creek junction"] },
  { id: 'holliday-park', name: 'Holliday Park',                    label: 'Downtown Anchor',        lat: 41.1332, lng: -104.8062, description: 'Downtown access point near historic landmarks and Lake Minnehaha.',           features: ["Big Boy Steam Engine #4004", "Lake Minnehaha", "Downtown trail connectors"] },
  { id: 'cahill',        name: 'Cahill Playground',                label: 'East Side Hub',          lat: 41.1578, lng: -104.7735, description: 'Eastern hub with Dell Range corridor access and sports facilities.',          features: ["Dell Range corridor", "Sports fields", "Taft Road connector links"] },
  { id: 'mylar-park',   name: 'Mylar Park',                       label: 'North-Central Link',     lat: 41.1685, lng: -104.8112, description: 'Paved loops and neighborhood spurs connecting to the Dry Creek trail.',        features: ["Paved loops", "Willow trees", "Playground", "Dry Creek spurs"] },
  { id: 'western-hills', name: 'Western Hills Park',               label: 'Northwest Terminal',     lat: 41.1772, lng: -104.8510, description: 'Westernmost starting terminal of the Dry Creek trail near I-25.',             features: ["Dry Creek trail terminus", "Near I-25 access", "8-mile trail start"] },
  { id: 'dry-creek-park',name: 'Dry Creek Park',                   label: 'East Terminal',          lat: 41.1448, lng: -104.7485, description: 'Southeastern terminus of the 8-mile Dry Creek trail near US 30.',             features: ["Dry Creek trail terminus", "Near US 30", "8-mile trail end"] },
  { id: 'lccc',          name: 'LCCC',                             label: 'Southeast Hub',          lat: 41.1015, lng: -104.7850, description: 'Connects the Allison Draw Greenway into college campus pathways.',             features: ["Allison Draw connection", "Campus pathways", "Southeast terminus"] },
  { id: 'mlk-park',      name: 'Martin Luther King Jr. Park',      label: 'West Side Access',       lat: 41.1325, lng: -104.8322, description: 'Community hub and connection point for the Crow Creek trail segment.',        features: ["Community spaces", "Playground", "Crow Creek connection"] },
  { id: 'clear-creek',   name: 'Clear Creek Park',                 label: 'South-Central Access',   lat: 41.1030, lng: -104.8210, description: 'South-side outdoor recreation with fitness equipment and Allison Draw access.',features: ["Fitness equipment", "Allison Draw pathway", "Outdoor recreation"] },
  { id: 'dutcher-field', name: 'Dutcher Field / Airport Pkwy',     label: 'Midtown Link',           lat: 41.1510, lng: -104.8145, description: 'Sports complex with airfield views and direct midtown pathway connectors.',    features: ["Sports complex parking", "Airfield views", "Midtown connectors"] },
  { id: 'sun-valley',    name: 'Sun Valley Park',                  label: 'Southeast Neighborhood', lat: 41.1182, lng: -104.7640, description: 'Quiet neighborhood paths running parallel to the eastern railroad corridor.',   features: ["Quiet paths", "Railroad corridor views", "Open space"] },
  { id: 'kiwanis',       name: 'Kiwanis Park',                     label: 'Northeast Access',       lat: 41.1640, lng: -104.7920, description: 'Green space nestled between the Dry Creek and Dell Range connector lines.',    features: ["Dry Creek connector", "Dell Range access", "Quiet green space"] },
];

// ─── Proximity detection ──────────────────────────────────────────────────────
// Returns distance in meters between two [lat, lng] points (Haversine)
function haversineMeters([lat1, lon1], [lat2, lon2]) {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Minimum distance from point to a polyline segment
function pointToSegmentMeters(p, a, b) {
  const dx = b[0] - a[0], dy = b[1] - a[1];
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return haversineMeters(p, a);
  let t = ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));
  return haversineMeters(p, [a[0] + t * dx, a[1] + t * dy]);
}

function nearestSegmentToPoint(userPos) {
  const THRESHOLD = 9.14; // 30 feet in meters
  let nearest = null;
  let minDist = Infinity;
  for (const seg of TRAIL_SEGMENTS) {
    for (let i = 0; i < seg.path.length - 1; i++) {
      const d = pointToSegmentMeters(userPos, seg.path[i], seg.path[i + 1]);
      if (d < minDist) { minDist = d; nearest = seg; }
    }
  }
  return minDist <= THRESHOLD ? nearest : null;
}

// ─── Icons ────────────────────────────────────────────────────────────────────
const trailheadIcon = L.divIcon({
  className: '',
  html: `<div style="background:#92400e;border:3px solid #fff;border-radius:50% 50% 50% 0;width:26px;height:26px;transform:rotate(-45deg);box-shadow:0 2px 8px rgba(0,0,0,0.4)"><div style="transform:rotate(45deg);color:white;font-size:10px;text-align:center;line-height:22px">🥾</div></div>`,
  iconSize: [26, 26],
  iconAnchor: [13, 26],
});

const gpsIcon = L.divIcon({
  className: '',
  html: `<div style="position:relative;width:24px;height:24px;display:flex;align-items:center;justify-content:center">
    <div style="position:absolute;width:24px;height:24px;border-radius:50%;background:rgba(59,130,246,0.3);animation:gps-pulse 1.8s ease-out infinite"></div>
    <div style="position:absolute;width:14px;height:14px;border-radius:50%;background:#3b82f6;border:3px solid #fff;box-shadow:0 0 8px rgba(59,130,246,0.8);z-index:1"></div>
  </div>
  <style>@keyframes gps-pulse{0%{transform:scale(1);opacity:.8}100%{transform:scale(2.5);opacity:0}}</style>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

function RecenterControl({ target }) {
  const map = useMap();
  useEffect(() => { if (target) map.flyTo(target, 15, { duration: 1.2 }); }, [target, map]);
  return null;
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function GreenwayGuide() {
  const [userLocation, setUserLocation]       = useState(null);
  const [recenterTarget, setRecenterTarget]   = useState(null);
  const [selectedTrailhead, setSelectedTrailhead] = useState(null);
  const [locationError, setLocationError]     = useState(false);
  const [activeSegment, setActiveSegment]     = useState(null); // proximity banner
  const watchIdRef = useRef(null);

  useEffect(() => {
    if (!navigator.geolocation) { setLocationError(true); return; }
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const loc = [pos.coords.latitude, pos.coords.longitude];
        setUserLocation(loc);
        setLocationError(false);
        setActiveSegment(nearestSegmentToPoint(loc));
      },
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

      {/* Title */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] bg-white/90 backdrop-blur rounded-xl px-5 py-2 shadow-lg border-2 border-amber-200 pointer-events-none">
        <h1 className="text-lg font-bold text-amber-900 text-center whitespace-nowrap" style={{ fontFamily: 'Rye, serif' }}>
          🌿 Greater Cheyenne Greenway
        </h1>
      </div>

      {/* Proximity banner */}
      {activeSegment && (
        <div className="absolute top-[68px] left-1/2 -translate-x-1/2 z-[1001] bg-green-700 text-white text-sm font-semibold px-4 py-2 rounded-full shadow-lg flex items-center gap-2 whitespace-nowrap">
          <span className="animate-pulse">📍</span>
          You are currently on the {activeSegment.name}!
        </div>
      )}

      {/* Legend */}
      <div className="absolute top-16 left-3 z-[1000] bg-white/90 backdrop-blur rounded-lg shadow-md border border-amber-200 px-3 py-2 space-y-1">
        {TRAIL_SEGMENTS.map(seg => (
          <div key={seg.id} className="flex items-center gap-2 text-xs text-stone-700">
            <div className="w-5 h-1.5 rounded-full flex-shrink-0" style={{ background: seg.color }} />
            <span className="leading-tight">{seg.name}</span>
          </div>
        ))}
      </div>

      {/* GPS error */}
      {locationError && (
        <div className="absolute top-16 right-3 z-[1000] bg-amber-100 border border-amber-400 text-amber-800 text-xs rounded-lg px-3 py-2 shadow max-w-[180px]">
          Enable GPS for live location tracking
        </div>
      )}

      {/* Recenter */}
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

        {/* Trail polylines – multi-vertex paths following real corridors */}
        {TRAIL_SEGMENTS.map(seg => (
          <Polyline
            key={seg.id}
            positions={seg.path}
            pathOptions={{ color: seg.color, weight: 5, opacity: 0.88 }}
          />
        ))}

        {/* Trailhead pins */}
        {TRAILHEADS.map(t => (
          <Marker
            key={t.id}
            position={[t.lat, t.lng]}
            icon={trailheadIcon}
            eventHandlers={{ click: () => setSelectedTrailhead(t) }}
          />
        ))}

        {/* Live GPS dot */}
        {userLocation && <Marker position={userLocation} icon={gpsIcon} />}

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
                <span key={f} className="bg-green-50 border border-green-200 text-green-800 text-xs rounded-full px-3 py-1">{f}</span>
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