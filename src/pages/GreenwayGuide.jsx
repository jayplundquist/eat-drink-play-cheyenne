import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Polyline, Polygon, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Button } from '@/components/ui/button';
import { Navigation, X, Crosshair, BookOpen } from 'lucide-react';
import { useSEO } from '@/hooks/useSEO';
import GreenwayGuidePanel from '@/components/GreenwayGuidePanel';
import GreenwayLayerControl, { LAYERS, DEFAULT_VISIBLE } from '@/components/GreenwayLayerControl';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const CHEYENNE_CENTER = [41.1400, -104.7900];
const BBOX = '41.08,-104.89,41.22,-104.72';

// ─── Trailheads (Activities layer) ────────────────────────────────────────────
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

// ─── Overpass fetch + classification into layer buckets ────────────────────────
const OVERPASS_QUERY = `[out:json][timeout:25];(
  way["highway"~"cycleway|path"]["surface"~"concrete",i](${BBOX});
  way["name"~"Greenway",i](${BBOX});
  way["highway"~"cycleway|path"]["surface"~"asphalt|paving_stones|paved",i](${BBOX});
  way["highway"~"track|path"]["surface"~"dirt|ground|unpaved|gravel|sand|earth",i](${BBOX});
  way["cycleway"](${BBOX});
  way["leisure"="park"](${BBOX});
  way["natural"="water"](${BBOX});
  way["waterway"~"stream|creek|river|canal"](${BBOX});
);out geom qt;`;

function classifyWay(el) {
  const tags = el.tags || {};
  const name = tags.name || '';
  const isGreenwayName = /greenway/i.test(name);

  if (tags.leisure === 'park') return 'parks';
  if (tags.natural === 'water') return 'lakes';
  if (tags.waterway) return 'creeks';

  const hw = tags.highway || '';
  const surf = (tags.surface || '').toLowerCase();

  if ((hw === 'track' || hw === 'path') && /dirt|ground|unpaved|gravel|sand|earth/.test(surf)) return 'dirt';
  if (tags.cycleway && /residential|tertiary|secondary|primary|unclassified|service/.test(hw)) return 'bikeroute';
  if (hw === 'cycleway' || hw === 'path') {
    if (/concrete/.test(surf) || isGreenwayName) return 'greenway';
    if (/asphalt|paving_stones|paved/.test(surf)) return 'shared';
    return 'greenway'; // paved trail with no surface tag — assume concrete greenway
  }
  if (isGreenwayName) return 'greenway';
  return null;
}

function parseOverpass(elements) {
  const buckets = { greenway: [], shared: [], bikeroute: [], dirt: [], parks: [], creeks: [], lakes: [] };
  for (const el of elements) {
    if (el.type !== 'way' || !el.geometry || el.geometry.length < 2) continue;
    const layerId = classifyWay(el);
    if (!layerId || !buckets[layerId]) continue;
    buckets[layerId].push({
      id: el.id,
      name: el.tags?.name || '',
      path: el.geometry.map(n => [n.lat, n.lon]),
    });
  }
  return buckets;
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
function nearestTrailSegment(userPos, trailItems) {
  const THRESHOLD = 30;
  let minDist=Infinity, nearest=null;
  for (const it of trailItems) {
    for (let i=0;i<it.path.length-1;i++) {
      const d=pointToSegDist(userPos,it.path[i],it.path[i+1]);
      if(d<minDist){minDist=d;nearest=it;}
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
    description: 'Interactive GPS-enabled map of the Greater Cheyenne Greenway with toggleable layers for greenway trails, shared-use paths, bike routes, city parks, creeks, and lakes. Plan your walking or biking route across 47 miles of paved trails.',
  });

  const [userLocation, setUserLocation]     = useState(null);
  const [recenterTarget, setRecenterTarget] = useState(null);
  const [selectedTrailhead, setSelectedTrailhead] = useState(null);
  const [locationError, setLocationError]   = useState(false);
  const [activeSegment, setActiveSegment]   = useState(null);
  const [data, setData]                       = useState({});
  const [loading, setLoading]                 = useState(true);
  const [guideOpen, setGuideOpen]             = useState(false);
  const [visibleLayers, setVisibleLayers]     = useState(new Set(DEFAULT_VISIBLE));
  const watchIdRef = useRef(null);
  const dataRef = useRef({});

  useEffect(() => { dataRef.current = data; }, [data]);

  const toggleLayer = useCallback((id) => {
    setVisibleLayers(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  // Fetch all greenway-related ways from Overpass, classify into layers
  useEffect(() => {
    const url = `https://maps.mail.ru/osm/tools/overpass/api/interpreter?data=${encodeURIComponent(OVERPASS_QUERY)}`;
    fetch(url, { headers: { Accept: 'application/json' } })
      .then(r => { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(json => {
        const parsed = parseOverpass(json.elements || []);
        setData(parsed);
        dataRef.current = parsed;
      })
      .catch(() => {})
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
        const d = dataRef.current;
        const trailItems = [...(d.greenway||[]), ...(d.shared||[]), ...(d.dirt||[])];
        setActiveSegment(nearestTrailSegment(loc, trailItems));
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

  const counts = {
    ...Object.fromEntries(Object.keys(data).map(k => [k, data[k].length])),
    activities: TRAILHEADS.length,
  };

  const renderLineLayer = (layerId) => {
    const layer = LAYERS.find(l => l.id === layerId);
    if (!layer || !visibleLayers.has(layerId)) return null;
    const items = data[layerId] || [];
    const cased = [];
    for (const it of items) {
      // White casing under the colored line makes trails pop against the map
      cased.push(
        <Polyline
          key={`${layerId}-case-${it.id}`}
          positions={it.path}
          pathOptions={{ color: '#ffffff', weight: layer.weight + 4, opacity: 0.85, lineCap: 'round' }}
        />,
        <Polyline
          key={`${layerId}-${it.id}`}
          positions={it.path}
          pathOptions={{
            color: layer.color,
            weight: layer.weight,
            opacity: 1,
            lineCap: 'round',
            dashArray: layer.dashed ? '8 7' : undefined,
          }}
        />
      );
    }
    return cased;
  };

  const renderPolygonLayer = (layerId) => {
    const layer = LAYERS.find(l => l.id === layerId);
    if (!layer || !visibleLayers.has(layerId)) return null;
    return (data[layerId] || []).map(it => (
      <Polygon
        key={`${layerId}-${it.id}`}
        positions={it.path}
        pathOptions={{
          color: layer.id === 'parks' ? '#15803d' : '#0284c7',
          weight: 2,
          fillColor: layer.color,
          fillOpacity: layer.id === 'lakes' ? 0.7 : 0.5,
          opacity: 0.95,
        }}
      />
    ));
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
          You are on the {activeSegment.name || 'Cheyenne Greenway'}!
        </div>
      )}

      {/* Layer control */}
      <GreenwayLayerControl
        visible={visibleLayers}
        onToggle={toggleLayer}
        counts={counts}
      />

      {/* GPS error */}
      {locationError && (
        <div className="absolute top-16 left-3 z-[1000] bg-amber-100 border border-amber-400 text-amber-800 text-xs rounded-lg px-3 py-2 shadow max-w-[180px]">
          Enable GPS for live location tracking
        </div>
      )}

      {/* Loading indicator */}
      {loading && (
        <div className="absolute top-16 left-3 z-[1000] bg-white/90 border border-amber-300 text-amber-800 text-xs rounded-lg px-3 py-2 shadow flex items-center gap-2">
          <span className="w-3 h-3 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
          Loading trail data…
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

        {/* Polygon layers (parks, lakes) render beneath trails */}
        {renderPolygonLayer('parks')}
        {renderPolygonLayer('lakes')}

        {/* Line layers */}
        {renderLineLayer('creeks')}
        {renderLineLayer('bikeroute')}
        {renderLineLayer('dirt')}
        {renderLineLayer('shared')}
        {renderLineLayer('greenway')}

        {/* Trailhead pins (Activities layer) */}
        {visibleLayers.has('activities') && TRAILHEADS.map(t => (
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