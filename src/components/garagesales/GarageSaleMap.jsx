import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Button } from '@/components/ui/button';
import { Star, MapPin, Navigation } from 'lucide-react';
import {
  getDisplayCoords,
  formatDateShort,
  formatTime,
  getCategoryLabel,
  shouldRevealExactAddress,
  formatSaleSchedule,
} from '@/lib/garageSaleHelpers';

const CHEYENNE_CENTER = [41.14, -104.79];

function saleIcon({ featured, saved, routeNumber, inRoute, live }) {
  let bg = '#b45309'; // amber-700 normal
  if (routeNumber != null) bg = '#7c2d12'; // deep brown for numbered route stops
  else if (inRoute) bg = '#7c2d12'; // deep brown for selected (pre-optimization)
  else if (saved) bg = '#15803d'; // green-700
  else if (featured) bg = '#d97706'; // gold

  if (routeNumber != null) {
    return L.divIcon({
      className: 'gs-route-pin',
      html: `<div style="
        background:${bg};color:#fff;width:30px;height:30px;border-radius:50% 50% 50% 0;
        transform:rotate(-45deg);display:flex;align-items:center;justify-content:center;
        border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.4);font-weight:700;font-size:14px;">
        <span style="transform:rotate(45deg)">${routeNumber}</span></div>`,
      iconSize: [30, 30],
      iconAnchor: [15, 30],
    });
  }
  const ring = live ? 'box-shadow:0 0 0 4px rgba(34,197,94,0.5);' : '';
  const star = featured ? '<span style="position:absolute;top:-6px;right:-6px;font-size:11px;">⭐</span>' : '';
  return L.divIcon({
    className: 'gs-pin',
    html: `<div style="position:relative;background:${bg};width:20px;height:20px;border-radius:50% 50% 50% 0;
      transform:rotate(-45deg);border:2px solid #fff;box-shadow:0 2px 4px rgba(0,0,0,0.4);${ring}">${star}</div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 20],
  });
}

function clusterIcon(count) {
  return L.divIcon({
    className: 'gs-cluster',
    html: `<div style="
      background:#92400e;color:#fff;width:34px;height:34px;border-radius:50%;
      display:flex;align-items:center;justify-content:center;border:3px solid #fcd34d;
      box-shadow:0 2px 6px rgba(0,0,0,0.4);font-weight:700;font-size:13px;">${count}</div>`,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
  });
}

function getClusterPrecision(zoom) {
  if (zoom >= 14) return null;
  if (zoom >= 12) return 3;
  if (zoom >= 10) return 2;
  return 1;
}

function ZoomTracker({ onZoom }) {
  const map = useMapEvents({
    zoomend: () => onZoom(map.getZoom()),
  });
  useEffect(() => {
    onZoom(map.getZoom());
  }, [map, onZoom]);
  return null;
}

function FlyTo({ target }) {
  const map = useMap();
  useEffect(() => {
    if (target) map.flyTo([target.lat, target.lng], Math.max(map.getZoom(), 15), { duration: 0.6 });
  }, [target]);
  return null;
}

export default function GarageSaleMap({
  sales,
  selectedSale,
  onSelectSale,
  savedIds = [],
  routeNumberById = {},
  routeStopIds = [],
  routePoints = null,
  focusTarget = null,
}) {
  const [zoom, setZoom] = useState(11);
  const navigate = useNavigate();

  const points = useMemo(() => {
    return sales
      .filter((s) => s.lat != null && s.lng != null)
      .map((s) => {
        const c = getDisplayCoords(s);
        return { sale: s, ...c };
      });
  }, [sales]);

  const clusters = useMemo(() => {
    const precision = getClusterPrecision(zoom);
    if (!precision) return { individual: points, groups: [] };
    const map = new Map();
    for (const p of points) {
      const key = `${p.lat.toFixed(precision)},${p.lng.toFixed(precision)}`;
      if (!map.has(key)) map.set(key, { lat: 0, lng: 0, items: [] });
      const g = map.get(key);
      g.lat += p.lat;
      g.lng += p.lng;
      g.items.push(p);
    }
    const groups = [];
    const individual = [];
    for (const g of map.values()) {
      if (g.items.length > 1) {
        groups.push({ lat: g.lat / g.items.length, lng: g.lng / g.items.length, count: g.items.length });
      } else {
        individual.push(g.items[0]);
      }
    }
    return { individual, groups };
  }, [points, zoom]);

  return (
    <MapContainer center={CHEYENNE_CENTER} zoom={11} scrollWheelZoom className="w-full h-full z-0" style={{ background: '#e8e0d4' }}>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; OpenStreetMap contributors'
      />
      <ZoomTracker onZoom={setZoom} />
      <FlyTo target={focusTarget} />

      {clusters.groups.map((g, i) => (
        <Marker
          key={`c-${i}`}
          position={[g.lat, g.lng]}
          icon={clusterIcon(g.count)}
        />
      ))}

      {clusters.individual.map((p) => {
        const sale = p.sale;
        const routeNumber = routeNumberById[sale.id];
        const saved = savedIds.includes(sale.id);
        const inRoute = routeStopIds.includes(sale.id);
        return (
          <Marker
            key={sale.id}
            position={[p.lat, p.lng]}
            icon={saleIcon({ featured: sale.featured, saved, routeNumber, inRoute, live: sale._live })}
            eventHandlers={{ click: () => onSelectSale(sale) }}
          >
            <Popup>
              <div className="min-w-[200px]">
                <div className="font-bold text-stone-800 text-sm">{sale.title}</div>
                <div className="text-xs text-stone-600 mt-0.5">
                  {p.approximate ? 'Approximate location' : sale.address}
                </div>
                <div className="text-xs text-stone-500 mt-0.5">
                  {formatSaleSchedule(sale)}
                </div>
                {sale.categories?.length > 0 && (
                  <div className="text-xs text-amber-700 mt-0.5">
                    {sale.categories.slice(0, 4).map(getCategoryLabel).join(' · ')}
                  </div>
                )}
                <Button
                  size="sm"
                  className="mt-2 w-full bg-amber-600 hover:bg-amber-700 text-white"
                  onClick={() => navigate(`/GarageSales/${sale.slug || sale.id}`)}
                >
                  View Sale
                </Button>
              </div>
            </Popup>
          </Marker>
        );
      })}

      {routePoints && routePoints.length >= 2 && (
        <Polyline
          positions={routePoints}
          pathOptions={{ color: '#7c2d12', weight: 4, opacity: 0.7, dashArray: '6 8' }}
        />
      )}
    </MapContainer>
  );
}