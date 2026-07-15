import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Button } from '@/components/ui/button';
import { Navigation, X, Crosshair, Loader2, BookOpen } from 'lucide-react';
import { useSEO } from '@/hooks/useSEO';
import GreenwayGuidePanel from '@/components/GreenwayGuidePanel';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const CHEYENNE_CENTER = [41.1400, -104.7900];

const TRAIL_COLORS = {
  'Dry Creek Greenway':    '#166534',
  'Allison Draw Greenway': '#0d9488',
  'Sun Valley Greenway':   '#d97706',
  'Crow Creek Greenway':   '#7c3aed',
  'Cheyenne Greenway':     '#15803d',
};

const TRAIL_LEGEND = [
  { name: 'Dry Creek Greenway',     color: '#166534' },
  { name: 'Cheyenne Greenway',      color: '#15803d' },
  { name: 'Allison Draw Greenway',  color: '#0d9488' },
  { name: 'Sun Valley Greenway',    color: '#d97706' },
  { name: 'Crow Creek Greenway',    color: '#7c3aed' },
];

// ─── Trailheads ───────────────────────────────────────────────────────────────
const TRAILHEADS = [
  { id:'lions-park',    name:'Lions Park',                  label:'Central Hub',            lat:41.1712, lng:-104.8315, description:'Central junction for Dry Creek segments with lakeside amenities.',            features:["Botanic Gardens","Sloan's Lake beach","Paddle boats","Dry Creek junction"] },
  { id:'holliday-park', name:'Holliday Park',               label:'Downtown Anchor',        lat:41.1332, lng:-104.8062, description:'Downtown access point near historic landmarks and Lake Minnehaha.',           features:["Big Boy Steam Engine #4004","Lake Minnehaha","Downtown trail connectors"] },
  { id:'cahill',        name:'Cahill Playground',           label:'East Side Hub',          lat:41.1578, lng:-104.7735, description:'Eastern hub with Dell Range corridor access and sports facilities.',          features:["Dell Range corridor","Sports fields","Taft Road connector links"] },
  { id:'mylar-park',    name:'Mylar Park',                  label:'North-Central Link',     lat:41.1685, lng:-104.8112, description:'Paved loops and neighborhood spurs connecting to the Dry Creek trail.',        features:["Paved loops","Willow trees","Playground","Dry Creek spurs"] },
  { id:'western-hills', name:'Western Hills Park',          label:'Northwest Terminal',     lat:41.1772, lng:-104.8510, description:'Westernmost starting terminal of the Dry Creek trail near I-25.',             features:["Dry Creek trail terminus","Near I-25 access","8-mile trail start"] },
  { id:'dry-creek-park',name:'Dry Creek Park',              label:'East Terminal',          lat:41.1448, lng:-104.7485, description:'Southeastern terminus of the 8-mile Dry Creek trail near US 30.',             features:["Dry Creek trail terminus","Near US 30","8-mile trail end"] },
  { id:'lccc',          name:'LCCC',                        label:'Southeast Hub',          lat:41.1015, lng:-104.7850, description:'Connects the Allison Draw Greenway into college campus pathways.',             features:["Allison Draw connection","Campus pathways","Southeast terminus"] },
  { id:'mlk-park',      name:'Martin Luther King Jr. Park', label:'West Side Access',       lat:41.1325, lng:-104.8322, description:'Community hub and connection point for the Crow Creek trail segment.',        features:["Community spaces","Playground","Crow Creek connection"] },
  { id:'sun-valley',    name:'Sun Valley Park',             label:'Southeast Neighborhood', lat:41.1182, lng:-104.7640, description:'Quiet neighborhood paths running parallel to the eastern railroad corridor.',   features:["Quiet paths","Railroad corridor views","Open space"] },
  { id:'kiwanis',       name:'Kiwanis Park',                label:'Northeast Access',       lat:41.1640, lng:-104.7920, description:'Green space nestled between the Dry Creek and Dell Range connector lines.',    features:["Dry Creek connector","Dell Range access","Quiet green space"] },
];

// ─── Parse raw Overpass ways into renderable polylines ────────────────────────
function parseWaysToSegments(elements) {
  const segments = [];
  for (const el of elements) {
    if (el.type !== 'way' || !el.geometry || el.geometry.length < 2) continue;
    const name = el.tags?.name || '';
    let trailName = 'Cheyenne Greenway';
    if (/allison/i.test(name))          trailName = 'Allison Draw Greenway';
    else if (/crow/i.test(name))        trailName = 'Crow Creek Greenway';
    else if (/sun[\s\-_]*valley/i.test(name)) trailName = 'Sun Valley Greenway';
    else if (/dry[\s\-_]*creek/i.test(name))  trailName = 'Dry Creek Greenway';
    segments.push({
      id: el.id,
      name: trailName,
      color: TRAIL_COLORS[trailName] || '#15803d',
      path: el.geometry.map(n => [n.lat, n.lon]),
    });
  }
  return segments;
}

// ─── Proximity helpers ────────────────────────────────────────────────────────
function haversineMeters([lat1,lon1],[lat2,lon2]) {
  const R=6371000,dLat=(lat2-lat1)*Math.PI/180,dLon=(lon2-lon1)*Math.PI/180;
  const a=Math.sin(dLat/2)**2+Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)**2;
  return R*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a));
}
function pointToSegDist(p,a,b) {
  const dx=b[0]-a[0],dy=b[1]-a[1],lenSq=dx*dx+dy*dy;
  if(lenSq===0) return haversineMeters(p,a);
  const t=Math.max(0,Math.min(1,((p[0]-a[0])*dx+(p[1]-a[1])*dy)/lenSq));
  return haversineMeters(p,[a[0]+t*dx,a[1]+t*dy]);
}
function nearestTrailSegment(userPos, segments) {
  const THRESHOLD = 30;
  let minDist=Infinity, nearest=null;
  for (const seg of segments) {
    for (let i=0;i<seg.path.length-1;i++) {
      const d=pointToSegDist(userPos,seg.path[i],seg.path[i+1]);
      if(d<minDist){minDist=d;nearest={name:seg.name};}
    }
  }
  return minDist<=THRESHOLD ? nearest : null;
}

// ─── Icons ────────────────────────────────────────────────────────────────────
const trailheadIcon = L.divIcon({
  className:'',
  html:`<div style="background:#92400e;border:3px solid #fff;border-radius:50% 50% 50% 0;width:26px;height:26px;transform:rotate(-45deg);box-shadow:0 2px 8px rgba(0,0,0,0.4)"><div style="transform:rotate(45deg);color:white;font-size:10px;text-align:center;line-height:22px">🥾</div></div>`,
  iconSize:[26,26],iconAnchor:[13,26],
});
const gpsIcon = L.divIcon({
  className:'',
  html:`<div style="position:relative;width:24px;height:24px;display:flex;align-items:center;justify-content:center"><div style="position:absolute;width:24px;height:24px;border-radius:50%;background:rgba(59,130,246,0.3);animation:gps-pulse 1.8s ease-out infinite"></div><div style="position:absolute;width:14px;height:14px;border-radius:50%;background:#3b82f6;border:3px solid #fff;box-shadow:0 0 8px rgba(59,130,246,0.8);z-index:1"></div></div><style>@keyframes gps-pulse{0%{transform:scale(1);opacity:.8}100%{transform:scale(2.5);opacity:0}}</style>`,
  iconSize:[24,24],iconAnchor:[12,12],
});

function RecenterControl({ target }) {
  const map = useMap();
  useEffect(()=>{if(target)map.flyTo(target,15,{duration:1.2});},[target,map]);
  return null;
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function GreenwayGuide() {
  useSEO({
    title: 'Cheyenne Greenway Interactive Map | GPS Trail Guide',
    description: 'Interactive GPS-enabled map of the Greater Cheyenne Greenway. Find trailheads, parking, nearby restaurants, and plan your walking or biking route across 47 miles of paved trails.',
  });

  const [userLocation, setUserLocation]     = useState(null);
  const [recenterTarget, setRecenterTarget] = useState(null);
  const [selectedTrailhead, setSelectedTrailhead] = useState(null);
  const [locationError, setLocationError]   = useState(false);
  const [activeSegment, setActiveSegment]   = useState(null);
  const [segments, setSegments]             = useState([]);
  const [loading, setLoading]               = useState(true);
  const [guideOpen, setGuideOpen]           = useState(false);
  const watchIdRef = useRef(null);
  const segmentsRef = useRef([]);

  useEffect(() => { segmentsRef.current = segments; }, [segments]);

  // Fetch all named greenway ways from Overpass with full geometry
  useEffect(() => {
    const QUERY = `[out:json][timeout:30];(way["name"~"Greenway",i](41.08,-104.89,41.22,-104.72););out geom qt;`;
    const url = `https://maps.mail.ru/osm/tools/overpass/api/interpreter?data=${encodeURIComponent(QUERY)}`;
    fetch(url, { headers: { Accept: 'application/json' } })
      .then(r => { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(json => {
        const parsed = parseWaysToSegments(json.elements || []);
        setSegments(parsed);
        segmentsRef.current = parsed;
      })
      .catch(() => {}) // silently keep empty; no fallback needed — OSM is the source of truth
      .finally(() => setLoading(false));
  }, []);

  // GPS watch
  useEffect(() => {
    if (!navigator.geolocation) { setLocationError(true); return; }
    watchIdRef.current = navigator.geolocation.watchPosition(
      pos => {
        const loc = [pos.coords.latitude, pos.coords.longitude];
        setUserLocation(loc);
        setLocationError(false);
        setActiveSegment(nearestTrailSegment(loc, segmentsRef.current));
      },
      () => setLocationError(true),
      { enableHighAccuracy: true, maximumAge: 5000 }
    );
    return () => { if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current); };
  }, []);

  const handleRecenter = useCallback(() => {
    if (userLocation) setRecenterTarget([...userLocation]);
  }, [userLocation]);

  const handleNavigate = t => {
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${t.lat},${t.lng}&travelmode=walking`, '_blank', 'noopener,noreferrer');
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
        <div className="absolute top-24 left-1/2 -translate-x-1/2 z-[1001] bg-green-700 text-white text-sm font-semibold px-4 py-2 rounded-full shadow-lg flex items-center gap-2 whitespace-nowrap">
          <span className="animate-pulse">📍</span>
          You are on the {activeSegment.name}!
        </div>
      )}

      {/* Legend */}
      <div className="absolute top-16 left-3 z-[1000] bg-white/90 backdrop-blur rounded-lg shadow-md border border-amber-200 px-3 py-2 space-y-1">
        {TRAIL_LEGEND.map(t => (
          <div key={t.name} className="flex items-center gap-2 text-xs text-stone-700">
            <div className="w-5 h-1.5 rounded-full flex-shrink-0" style={{ background: t.color }} />
            <span className="leading-tight">{t.name}</span>
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

      {/* Trail Guide toggle */}
      <button
        onClick={() => setGuideOpen(true)}
        className="absolute bottom-6 left-4 z-[1000] bg-amber-800 hover:bg-amber-900 text-white rounded-full shadow-xl px-4 py-3 flex items-center gap-2 font-semibold transition-colors"
      >
        <BookOpen className="w-5 h-5" />
        <span className="text-sm">Trail Guide</span>
      </button>

      {/* Crawlable guide content — always in DOM for SEO */}
      <GreenwayGuidePanel open={guideOpen} onClose={() => setGuideOpen(false)} />

      {/* Map */}
      <MapContainer center={CHEYENNE_CENTER} zoom={12} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />

        {/* Real OSM trail ways — each individual way segment rendered with its actual geometry */}
        {segments.map(seg => (
          <Polyline
            key={seg.id}
            positions={seg.path}
            pathOptions={{ color: seg.color, weight: 5, opacity: 0.9 }}
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