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

// ─── Overpass query ───────────────────────────────────────────────────────────
const OVERPASS_QUERY = `[out:json][timeout:25];(way["highway"~"footway|path|cycleway"](41.08,-104.89,41.22,-104.72););out geom qt;`;

// ─── Segment colour map: match OSM name to trail colour ──────────────────────
const SEGMENT_STYLES = [
  { pattern: /dry.?creek/i,    color: '#166534', name: 'Dry Creek Greenway' },
  { pattern: /allison.?draw/i, color: '#0d9488', name: 'Allison Draw Greenway' },
  { pattern: /crow.?creek/i,   color: '#7c3aed', name: 'Crow Creek Greenway' },
  { pattern: /sun.?valley/i,   color: '#d97706', name: 'Sun Valley Greenway' },
  { pattern: /storey/i,        color: '#1d4ed8', name: 'Storey Boulevard Greenway' },
];

function styleForName(name = '') {
  for (const s of SEGMENT_STYLES) {
    if (s.pattern.test(name)) return { color: s.color, weight: 5, opacity: 0.88 };
  }
  // Generic greenway or concrete path: green
  return { color: '#15803d', weight: 4, opacity: 0.75 };
}

// ─── Actual OSM-sourced trail coordinates ─────────────────────────────────────
// Fetched directly from OpenStreetMap Overpass API (maps.mail.ru mirror)
// highway=cycleway/footway/path tagged "Greenway", "Allison Draw - Greenway", "Sun Valley Greenway"
const FALLBACK_SEGMENTS = [
  {
    // Main Greenway backbone: Lions Park area east through Cahill to east side
    id: 'greenway-main', name: 'Dry Creek Greenway', color: '#166534',
    path: [
      [41.17514,-104.83943],[41.17516,-104.83952],[41.17523,-104.83953],[41.17527,-104.83947],
      [41.17525,-104.83938],[41.1752,-104.83937],[41.17516,-104.83941],[41.17516,-104.8395],
      [41.17525,-104.83941],[41.17466,-104.8381],[41.17472,-104.83811],[41.17474,-104.83817],
      [41.1747,-104.83824],[41.17481,-104.83818],[41.17474,-104.838],[41.17457,-104.838],
      [41.17434,-104.83823],[41.17373,-104.83831],[41.17345,-104.83806],[41.17336,-104.83781],
      [41.17346,-104.83731],[41.17334,-104.83675],[41.17302,-104.83619],[41.17243,-104.83464],
      [41.17233,-104.83398],[41.1721,-104.83347],[41.17199,-104.83285],[41.17174,-104.83261],
      [41.17174,-104.83224],[41.1715,-104.83176],[41.17125,-104.83097],[41.1711,-104.83078],
      [41.17091,-104.83067],[41.17085,-104.83055],[41.17078,-104.82962],[41.17017,-104.82837],
      [41.17,-104.82787],[41.16954,-104.82704],[41.16947,-104.82666],[41.16939,-104.82584],
      [41.16933,-104.82554],[41.16881,-104.82468],[41.16849,-104.82421],[41.16828,-104.82406],
      [41.16801,-104.8237],[41.16792,-104.82355],[41.16789,-104.82355],[41.16775,-104.82365],
      [41.16771,-104.82365],[41.16767,-104.82359],[41.16767,-104.82268],[41.16766,-104.82143],
      [41.16772,-104.82118],[41.16785,-104.82083],[41.16788,-104.82032],[41.16785,-104.81996],
      [41.16758,-104.81951],[41.16743,-104.81915],[41.16711,-104.81842],[41.1667,-104.81729],
      [41.16651,-104.81688],[41.16639,-104.81673],[41.16591,-104.81644],[41.16579,-104.81613],
      [41.16574,-104.81594],[41.16568,-104.81586],[41.16561,-104.81581],[41.16549,-104.8158],
      [41.16531,-104.81585],[41.16482,-104.81598],[41.16465,-104.81589],[41.16452,-104.81555],
      [41.16443,-104.81528],[41.1641,-104.81525],[41.16393,-104.81494],[41.16385,-104.81479],
      [41.16362,-104.81448],[41.16342,-104.81449],[41.16305,-104.81457],[41.16281,-104.81428],
      [41.16205,-104.81305],[41.16185,-104.81272],[41.16161,-104.81188],[41.16133,-104.81169],
      [41.16115,-104.81144],[41.16082,-104.81045],[41.16069,-104.80988],[41.16071,-104.80966],
      [41.1609,-104.80942],[41.16104,-104.80942],[41.16109,-104.80951],[41.16105,-104.80963],
      [41.16098,-104.80967],[41.15989,-104.80857],[41.15964,-104.80829],[41.15885,-104.80754],
      [41.15874,-104.80736],[41.15866,-104.80711],[41.15865,-104.80691],[41.15856,-104.80558],
      [41.15849,-104.80461],[41.15846,-104.80439],[41.1584,-104.80348],[41.15836,-104.80287],
      [41.15833,-104.80236],[41.15828,-104.8016],[41.15806,-104.79839],[41.15773,-104.79813],
      [41.15768,-104.79784],[41.15764,-104.7973],[41.15762,-104.79661],[41.15757,-104.79629],
      [41.15749,-104.79616],[41.15736,-104.79612],[41.15713,-104.79616],[41.15694,-104.79618],
      [41.15679,-104.79614],[41.15668,-104.79605],[41.15661,-104.79588],[41.15646,-104.79483],
      [41.15635,-104.79437],[41.1563,-104.79418],[41.15624,-104.79343],[41.15625,-104.79316],
      [41.15625,-104.79277],[41.15613,-104.79119],[41.15607,-104.79045],[41.15609,-104.79033],
      [41.15615,-104.79025],[41.15624,-104.79023],[41.15641,-104.79021],[41.15649,-104.79015],
      [41.15652,-104.79006],[41.15642,-104.78969],[41.15639,-104.78945],[41.15637,-104.78594],
      [41.15636,-104.78559],[41.15632,-104.78554],[41.15624,-104.78553],[41.15613,-104.78555],
      [41.15534,-104.78555],[41.15516,-104.78557],[41.15495,-104.78553],[41.15404,-104.78553],
      [41.15203,-104.78554],[41.15185,-104.78557],[41.15176,-104.78564],[41.15173,-104.78579],
      [41.15176,-104.78613],[41.15186,-104.78678],[41.15197,-104.78709],[41.15206,-104.7874],
      [41.15208,-104.78777],[41.15207,-104.78813],[41.15208,-104.78848],[41.15206,-104.78875],
      [41.15204,-104.7891],[41.15204,-104.78947],[41.15206,-104.78961],[41.15219,-104.78982],
      [41.15233,-104.79004],[41.15233,-104.79007],[41.15232,-104.7901],[41.1523,-104.79012],
    ],
  },
  {
    // Greenway east section: connects through Sun Valley area toward US-30
    id: 'greenway-east', name: 'Dry Creek Greenway (East)', color: '#15803d',
    path: [
      [41.15916,-104.76966],[41.15923,-104.76911],[41.15932,-104.76909],[41.15946,-104.76903],
      [41.15969,-104.76878],[41.15986,-104.76871],[41.15982,-104.76860],[41.15968,-104.76856],
      [41.15952,-104.76862],[41.15942,-104.76851],[41.15846,-104.76732],[41.15821,-104.76684],
      [41.15802,-104.76565],[41.15745,-104.76356],[41.15706,-104.76188],[41.15703,-104.76088],
      [41.15725,-104.76056],[41.15731,-104.75989],[41.15738,-104.75905],[41.15709,-104.75823],
      [41.15674,-104.75787],[41.15639,-104.75724],[41.15602,-104.75660],[41.15522,-104.75620],
      [41.15437,-104.75566],[41.15373,-104.75473],[41.15352,-104.75407],[41.15336,-104.75168],
      [41.15319,-104.75090],[41.15299,-104.75068],[41.15253,-104.75024],[41.15195,-104.74987],
      [41.1513,-104.74963],[41.14991,-104.74950],[41.14557,-104.74933],
    ],
  },
  {
    // Allison Draw Greenway: OSM-sourced actual path
    id: 'allison-draw', name: 'Allison Draw Greenway', color: '#0d9488',
    path: [
      [41.10239,-104.80748],[41.10213,-104.80749],[41.10171,-104.80763],[41.10164,-104.80780],
      [41.10068,-104.80840],[41.10064,-104.80850],[41.10054,-104.80853],[41.09988,-104.80850],
      [41.09887,-104.80861],[41.09882,-104.80871],[41.09878,-104.80944],[41.09861,-104.80959],
      [41.09829,-104.80965],[41.09814,-104.80986],[41.09810,-104.81018],[41.09806,-104.81046],
      [41.09804,-104.81079],[41.09781,-104.81114],[41.09755,-104.81130],[41.09733,-104.81183],
      [41.09708,-104.81184],[41.09704,-104.81324],[41.09692,-104.81360],[41.09702,-104.81369],
      [41.09722,-104.81369],[41.09759,-104.81370],[41.09804,-104.81371],[41.09821,-104.81368],
      [41.09836,-104.81371],[41.10009,-104.81370],[41.10041,-104.81375],[41.10077,-104.81365],
      [41.10149,-104.81366],[41.10222,-104.81362],[41.10239,-104.81365],
    ],
  },
  {
    // Sun Valley Greenway: OSM-sourced actual path (east Cheyenne)
    id: 'sun-valley', name: 'Sun Valley Greenway', color: '#d97706',
    path: [
      [41.14553,-104.74957],[41.14535,-104.74956],[41.14499,-104.74954],[41.14397,-104.74956],
      [41.14362,-104.74968],[41.14327,-104.74972],[41.14318,-104.74982],[41.14296,-104.74990],
      [41.14285,-104.74995],[41.14274,-104.75008],[41.14258,-104.75015],[41.14239,-104.75031],
      [41.14232,-104.75046],[41.14207,-104.75061],[41.14187,-104.75080],[41.14186,-104.75143],
      [41.14182,-104.75172],[41.14175,-104.75166],[41.14166,-104.75162],[41.14162,-104.75176],
      [41.14158,-104.75184],[41.14126,-104.75185],[41.14118,-104.75190],[41.14116,-104.75402],
      [41.14124,-104.75435],[41.14163,-104.75479],[41.14184,-104.75506],[41.14190,-104.75540],
      [41.14198,-104.75606],[41.14213,-104.75645],[41.14244,-104.75700],[41.14264,-104.75735],
      [41.14278,-104.75742],[41.14280,-104.75749],[41.14277,-104.75755],[41.14253,-104.75776],
      [41.14230,-104.75802],[41.14202,-104.75854],[41.14190,-104.75874],[41.14182,-104.75871],
      [41.14147,-104.75824],[41.14136,-104.75818],[41.14126,-104.75825],[41.14108,-104.75856],
      [41.14081,-104.75907],[41.14078,-104.75925],[41.14077,-104.75999],[41.14082,-104.76037],
      [41.14080,-104.76053],[41.14069,-104.76066],[41.14034,-104.76079],[41.14012,-104.76099],
      [41.13986,-104.76110],[41.13929,-104.76146],[41.13889,-104.76148],[41.13871,-104.76151],
      [41.13859,-104.76170],[41.13822,-104.76191],[41.13768,-104.76218],[41.13674,-104.76256],
      [41.13600,-104.76286],
    ],
  },
  {
    // Second major greenway chain (south-central area)
    id: 'greenway-south', name: 'Cheyenne Greenway (South Loop)', color: '#166534',
    path: [
      [41.10844,-104.80062],[41.10845,-104.79995],[41.10849,-104.80085],[41.10830,-104.80110],
      [41.10802,-104.80188],[41.10773,-104.80231],[41.10673,-104.80298],[41.10541,-104.80329],
      [41.10457,-104.80352],[41.10426,-104.80376],[41.10420,-104.80687],[41.10399,-104.80710],
      [41.10259,-104.80740],[41.10202,-104.80742],[41.10082,-104.80731],[41.10066,-104.80792],
      [41.10068,-104.80844],[41.10054,-104.80853],[41.09891,-104.80860],[41.09881,-104.80880],
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

  // Fetch live OSM trail geometries (supplements curated paths)
  useEffect(()=>{
    const enc = encodeURIComponent(OVERPASS_QUERY);
    fetch(`https://maps.mail.ru/osm/tools/overpass/api/interpreter?data=${enc}`, {
      headers: { 'Accept': 'application/json' },
    })
      .then(r=>{ if(!r.ok) throw new Error(r.status); return r.json(); })
      .then(json=>{ setOsmLines(parseOverpassToLines(json)); })
      .catch(()=>{ setOsmError(true); setOsmLines([]); });
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

      {/* Source badge */}
      {!loading && (
        <div className="absolute top-[68px] left-1/2 -translate-x-1/2 z-[1001] bg-white/80 backdrop-blur border border-green-300 text-green-800 text-xs rounded-full px-3 py-1 shadow pointer-events-none">
          ✓ Greater Cheyenne Greenway · 47 miles
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

        {/* Curated trail paths — always shown */}
        {FALLBACK_SEGMENTS.map(seg=>(
          <Polyline
            key={seg.id}
            positions={seg.path}
            pathOptions={{color:seg.color,weight:6,opacity:0.9}}
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