import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Polyline, GeoJSON, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Button } from '@/components/ui/button';
import { Navigation, X, Crosshair, Loader2 } from 'lucide-react';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const CHEYENNE_CENTER = [41.1450, -104.8100];

// ─── Overpass query: fetch real OSM footway/path/cycleway in Cheyenne bbox ───
// Using bbox: south,west,north,east
const OVERPASS_QUERY = `[out:json][timeout:30];
(
  way["highway"~"footway|path|cycleway"]["name"~"Greenway|Dry Creek|Allison|Crow Creek|Sun Valley",i](41.08,-104.89,41.20,-104.72);
  way["highway"~"footway|path|cycleway"]["leisure"="recreation_ground"](41.08,-104.89,41.20,-104.72);
  way["highway"~"footway|path"]["surface"="concrete"](41.08,-104.89,41.20,-104.72);
  way["route"="hiking"](41.08,-104.89,41.20,-104.72);
  relation["route"~"bicycle|foot"]["name"~"Greenway|Dry Creek|Allison|Crow|Sun Valley",i](41.08,-104.89,41.20,-104.72);
);
out geom qt;`;

// ─── Segment colour map: match OSM name to trail colour ──────────────────────
const SEGMENT_STYLES = [
  { pattern: /dry.?creek/i,    color: '#166534', name: 'Dry Creek Greenway' },
  { pattern: /allison.?draw/i, color: '#0d9488', name: 'Allison Draw Greenway' },
  { pattern: /crow.?creek/i,   color: '#7c3aed', name: 'Crow Creek Greenway' },
  { pattern: /sun.?valley/i,   color: '#b45309', name: 'Sun Valley & East Cheyenne' },
];

function styleForName(name = '') {
  for (const s of SEGMENT_STYLES) {
    if (s.pattern.test(name)) return { color: s.color, weight: 5, opacity: 0.88 };
  }
  // Generic greenway or concrete path: green
  return { color: '#15803d', weight: 4, opacity: 0.75 };
}

// ─── Fallback curated paths (shown while OSM loads or if fetch fails) ─────────
const FALLBACK_SEGMENTS = [
  {
    id: 'dry-creek', name: 'Dry Creek Greenway', color: '#166534',
    path: [
      [41.1772,-104.8510],[41.1760,-104.8450],[41.1748,-104.8390],[41.1735,-104.8340],
      [41.1722,-104.8315],[41.1712,-104.8315],[41.1706,-104.8290],[41.1700,-104.8260],
      [41.1695,-104.8225],[41.1690,-104.8185],[41.1685,-104.8112],[41.1680,-104.8070],
      [41.1672,-104.8020],[41.1663,-104.7975],[41.1655,-104.7950],[41.1648,-104.7940],
      [41.1640,-104.7920],[41.1628,-104.7880],[41.1615,-104.7845],[41.1600,-104.7810],
      [41.1590,-104.7790],[41.1578,-104.7735],[41.1562,-104.7695],[41.1545,-104.7640],
      [41.1528,-104.7580],[41.1510,-104.7530],[41.1490,-104.7510],[41.1470,-104.7495],
      [41.1448,-104.7485],
    ],
  },
  {
    id: 'crow-creek', name: 'Crow Creek Greenway', color: '#7c3aed',
    path: [
      [41.1325,-104.8322],[41.1328,-104.8290],[41.1330,-104.8255],[41.1331,-104.8218],
      [41.1332,-104.8185],[41.1332,-104.8150],[41.1332,-104.8120],[41.1332,-104.8090],
      [41.1332,-104.8062],[41.1333,-104.8035],[41.1335,-104.8005],[41.1336,-104.7975],
      [41.1338,-104.7945],[41.1340,-104.7910],[41.1342,-104.7875],[41.1344,-104.7845],
    ],
  },
  {
    id: 'allison-draw', name: 'Allison Draw Greenway', color: '#0d9488',
    path: [
      [41.1325,-104.8322],[41.1300,-104.8310],[41.1280,-104.8295],[41.1258,-104.8278],
      [41.1235,-104.8262],[41.1210,-104.8245],[41.1185,-104.8228],[41.1155,-104.8215],
      [41.1120,-104.8210],[41.1085,-104.8210],[41.1055,-104.8210],[41.1030,-104.8210],
      [41.1022,-104.8180],[41.1018,-104.8140],[41.1016,-104.8100],[41.1015,-104.8050],
      [41.1015,-104.8000],[41.1015,-104.7950],[41.1015,-104.7900],[41.1015,-104.7850],
      [41.1018,-104.7820],[41.1022,-104.7790],[41.1018,-104.7760],[41.1012,-104.7740],
    ],
  },
  {
    id: 'sun-valley-east', name: 'Sun Valley & East Cheyenne', color: '#b45309',
    path: [
      [41.1012,-104.7740],[41.1030,-104.7720],[41.1060,-104.7700],[41.1090,-104.7680],
      [41.1110,-104.7665],[41.1140,-104.7652],[41.1182,-104.7640],[41.1210,-104.7630],
      [41.1240,-104.7625],[41.1270,-104.7620],[41.1300,-104.7618],[41.1330,-104.7618],
      [41.1360,-104.7620],[41.1390,-104.7625],[41.1420,-104.7640],[41.1448,-104.7485],
      [41.1475,-104.7520],[41.1510,-104.7600],[41.1540,-104.7650],[41.1578,-104.7735],
      [41.1608,-104.7820],[41.1640,-104.7920],
    ],
  },
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
  { id:'clear-creek',   name:'Clear Creek Park',            label:'South-Central Access',   lat:41.1030, lng:-104.8210, description:'South-side outdoor recreation with fitness equipment and Allison Draw access.',features:["Fitness equipment","Allison Draw pathway","Outdoor recreation"] },
  { id:'dutcher-field', name:'Dutcher Field / Airport Pkwy',label:'Midtown Link',           lat:41.1510, lng:-104.8145, description:'Sports complex with airfield views and direct midtown pathway connectors.',    features:["Sports complex parking","Airfield views","Midtown connectors"] },
  { id:'sun-valley',    name:'Sun Valley Park',             label:'Southeast Neighborhood', lat:41.1182, lng:-104.7640, description:'Quiet neighborhood paths running parallel to the eastern railroad corridor.',   features:["Quiet paths","Railroad corridor views","Open space"] },
  { id:'kiwanis',       name:'Kiwanis Park',                label:'Northeast Access',       lat:41.1640, lng:-104.7920, description:'Green space nestled between the Dry Creek and Dell Range connector lines.',    features:["Dry Creek connector","Dell Range access","Quiet green space"] },
];

// ─── Proximity helpers ────────────────────────────────────────────────────────
function haversineMeters([lat1,lon1],[lat2,lon2]) {
  const R = 6371000, dLat=(lat2-lat1)*Math.PI/180, dLon=(lon2-lon1)*Math.PI/180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)**2;
  return R*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a));
}
function pointToSegDist(p,a,b) {
  const dx=b[0]-a[0],dy=b[1]-a[1],lenSq=dx*dx+dy*dy;
  if(lenSq===0) return haversineMeters(p,a);
  const t=Math.max(0,Math.min(1,((p[0]-a[0])*dx+(p[1]-a[1])*dy)/lenSq));
  return haversineMeters(p,[a[0]+t*dx,a[1]+t*dy]);
}
function nearestTrailSegment(userPos, osmLines) {
  const THRESHOLD = 9.14; // 30 feet
  let minDist = Infinity, nearest = null;

  // Check OSM lines (each has {name, coords: [[lat,lng]...]})
  for (const line of osmLines) {
    for (let i=0;i<line.coords.length-1;i++) {
      const d=pointToSegDist(userPos,line.coords[i],line.coords[i+1]);
      if(d<minDist){minDist=d;nearest={name:line.name};}
    }
  }
  // Also check fallback paths if OSM not loaded
  if(osmLines.length===0) {
    for (const seg of FALLBACK_SEGMENTS) {
      for(let i=0;i<seg.path.length-1;i++){
        const d=pointToSegDist(userPos,seg.path[i],seg.path[i+1]);
        if(d<minDist){minDist=d;nearest={name:seg.name};}
      }
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

// Convert OSM Overpass response into line arrays with name + lat/lng coords
function parseOverpassToLines(json) {
  const lines = [];
  for (const el of (json.elements||[])) {
    if(el.type==='way' && el.geometry) {
      const coords = el.geometry.map(n=>[n.lat,n.lon]);
      const name = el.tags?.name || el.tags?.['ref'] || '';
      lines.push({name, coords, tags: el.tags||{}});
    }
  }
  return lines;
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function GreenwayGuide() {
  const [userLocation, setUserLocation]   = useState(null);
  const [recenterTarget, setRecenterTarget] = useState(null);
  const [selectedTrailhead, setSelectedTrailhead] = useState(null);
  const [locationError, setLocationError] = useState(false);
  const [activeSegment, setActiveSegment] = useState(null);
  const [osmLines, setOsmLines]           = useState(null); // null=loading, []=failed/empty
  const [osmError, setOsmError]           = useState(false);
  const watchIdRef = useRef(null);
  const osmLinesRef = useRef([]);

  // Keep ref in sync so the watchPosition callback always sees latest OSM data
  useEffect(()=>{ osmLinesRef.current = osmLines||[]; },[osmLines]);

  // Fetch OSM trail geometries from Overpass (browser-side)
  useEffect(()=>{
    const encoded = encodeURIComponent(OVERPASS_QUERY);
    fetch(`https://overpass-api.de/api/interpreter?data=${encoded}`)
      .then(r=>{ if(!r.ok) throw new Error('overpass '+r.status); return r.json(); })
      .then(json=>{
        const lines = parseOverpassToLines(json);
        setOsmLines(lines);
      })
      .catch(()=>{
        setOsmError(true);
        setOsmLines([]); // fall back to curated paths
      });
  },[]);

  // GPS watch
  useEffect(()=>{
    if(!navigator.geolocation){setLocationError(true);return;}
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos)=>{
        const loc=[pos.coords.latitude,pos.coords.longitude];
        setUserLocation(loc);
        setLocationError(false);
        setActiveSegment(nearestTrailSegment(loc, osmLinesRef.current));
      },
      ()=>setLocationError(true),
      {enableHighAccuracy:true,maximumAge:5000}
    );
    return ()=>{ if(watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current); };
  },[]);

  const handleRecenter = useCallback(()=>{
    if(userLocation) setRecenterTarget([...userLocation]);
  },[userLocation]);

  const handleNavigate = (t)=>{
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${t.lat},${t.lng}&travelmode=walking`,'_blank','noopener,noreferrer');
  };

  // OSM GeoJSON style function
  const osmStyle = useCallback((feature)=>{
    const name = feature?.properties?.name||'';
    return styleForName(name);
  },[]);

  const useOSM = osmLines && osmLines.length > 0;
  const loading = osmLines === null;

  return (
    <div className="relative w-full" style={{height:'calc(100vh - 64px)'}}>

      {/* Title */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] bg-white/90 backdrop-blur rounded-xl px-5 py-2 shadow-lg border-2 border-amber-200 pointer-events-none">
        <h1 className="text-lg font-bold text-amber-900 text-center whitespace-nowrap" style={{fontFamily:'Rye, serif'}}>
          🌿 Greater Cheyenne Greenway
        </h1>
      </div>

      {/* OSM loading indicator */}
      {loading && (
        <div className="absolute top-[68px] left-1/2 -translate-x-1/2 z-[1001] bg-white/90 backdrop-blur border border-amber-300 text-amber-800 text-xs rounded-full px-3 py-1.5 shadow flex items-center gap-2">
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          Loading real trail geometry…
        </div>
      )}

      {/* OSM source badge */}
      {!loading && (
        <div className="absolute top-[68px] left-1/2 -translate-x-1/2 z-[1001] bg-white/80 backdrop-blur border border-green-300 text-green-800 text-xs rounded-full px-3 py-1 shadow pointer-events-none">
          {useOSM
            ? `✓ OpenStreetMap trail data · ${osmLines.length} paths`
            : '⚠ Using curated coordinates (OSM unavailable)'}
        </div>
      )}

      {/* Proximity banner */}
      {activeSegment && (
        <div className="absolute top-24 left-1/2 -translate-x-1/2 z-[1001] bg-green-700 text-white text-sm font-semibold px-4 py-2 rounded-full shadow-lg flex items-center gap-2 whitespace-nowrap">
          <span className="animate-pulse">📍</span>
          You are on the {activeSegment.name}!
        </div>
      )}

      {/* Legend */}
      <div className="absolute top-16 left-3 z-[1000] bg-white/90 backdrop-blur rounded-lg shadow-md border border-amber-200 px-3 py-2 space-y-1">
        {FALLBACK_SEGMENTS.map(seg=>(
          <div key={seg.id} className="flex items-center gap-2 text-xs text-stone-700">
            <div className="w-5 h-1.5 rounded-full flex-shrink-0" style={{background:seg.color}}/>
            <span className="leading-tight">{seg.name}</span>
          </div>
        ))}
        {useOSM && (
          <div className="flex items-center gap-2 text-xs text-stone-500 mt-1 border-t border-stone-200 pt-1">
            <div className="w-5 h-1.5 rounded-full flex-shrink-0 bg-green-600"/>
            <span>Other OSM trails</span>
          </div>
        )}
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
          <Crosshair className="w-5 h-5"/>
          <span className="text-sm pr-1">Recenter</span>
        </button>
      )}

      {/* Map */}
      <MapContainer center={CHEYENNE_CENTER} zoom={13} style={{height:'100%',width:'100%'}}>
        {/* OpenStreetMap tile layer – shows road/trail labels natively */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />

        {/* Real OSM trail lines rendered as styled GeoJSON */}
        {useOSM && osmLines.map((line, i) => (
          <Polyline
            key={i}
            positions={line.coords}
            pathOptions={styleForName(line.name)}
          />
        ))}

        {/* Fallback curated paths (shown when OSM unavailable or loading) */}
        {!useOSM && FALLBACK_SEGMENTS.map(seg=>(
          <Polyline
            key={seg.id}
            positions={seg.path}
            pathOptions={{color:seg.color,weight:5,opacity:0.88}}
          />
        ))}

        {/* Trailhead pins */}
        {TRAILHEADS.map(t=>(
          <Marker
            key={t.id}
            position={[t.lat,t.lng]}
            icon={trailheadIcon}
            eventHandlers={{click:()=>setSelectedTrailhead(t)}}
          />
        ))}

        {/* Live GPS dot */}
        {userLocation && <Marker position={userLocation} icon={gpsIcon}/>}
        {recenterTarget && <RecenterControl target={recenterTarget}/>}
      </MapContainer>

      {/* Bottom detail sheet */}
      {selectedTrailhead && (
        <div className="absolute bottom-0 left-0 right-0 z-[1001] bg-white rounded-t-2xl shadow-2xl border-t-4 border-amber-800 p-5 max-h-[55vh] overflow-y-auto">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-xl flex-shrink-0">🥾</div>
              <div>
                <h2 className="text-lg font-bold text-amber-900 leading-tight" style={{fontFamily:'Rye, serif'}}>
                  {selectedTrailhead.name}
                </h2>
                <span className="text-xs bg-green-100 text-green-800 rounded-full px-2 py-0.5 font-medium">
                  {selectedTrailhead.label}
                </span>
              </div>
            </div>
            <button onClick={()=>setSelectedTrailhead(null)} className="text-stone-400 hover:text-stone-600 flex-shrink-0 mt-1">
              <X className="w-5 h-5"/>
            </button>
          </div>
          <p className="text-xs text-stone-500 font-mono mb-3">
            {selectedTrailhead.lat.toFixed(4)}, {selectedTrailhead.lng.toFixed(4)}
          </p>
          <p className="text-stone-700 text-sm mb-4 leading-relaxed">{selectedTrailhead.description}</p>
          <div className="mb-5">
            <p className="text-xs font-semibold text-amber-800 uppercase tracking-wide mb-2">Key Features</p>
            <div className="flex flex-wrap gap-2">
              {selectedTrailhead.features.map(f=>(
                <span key={f} className="bg-green-50 border border-green-200 text-green-800 text-xs rounded-full px-3 py-1">{f}</span>
              ))}
            </div>
          </div>
          <Button
            onClick={()=>handleNavigate(selectedTrailhead)}
            className="w-full bg-amber-800 hover:bg-amber-900 text-white font-semibold py-5"
          >
            <Navigation className="w-4 h-4 mr-2"/>
            Get Walking Directions
          </Button>
        </div>
      )}
    </div>
  );
}