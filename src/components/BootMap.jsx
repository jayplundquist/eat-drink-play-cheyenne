import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { Card } from "@/components/ui/card";
import { Loader2, MapPin } from "lucide-react";
import { motion } from 'framer-motion';

// Fix leaflet default marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const bootSVG = encodeURIComponent(`<svg width="32" height="40" viewBox="0 0 32 40" xmlns="http://www.w3.org/2000/svg"><path d="M16 0C8 0 2 8 2 14c0 10 14 26 14 26s14-16 14-26c0-6-6-14-14-14Z" fill="#e6413e" stroke="#c32c55" stroke-width="1.5" stroke-linejoin="round"/><circle cx="16" cy="14" r="4" fill="white"/></svg>`);

const bootIcon = new L.Icon({
  iconUrl: `data:image/svg+xml;charset=utf-8,${bootSVG}`,
  iconSize: [32, 40],
  popupAnchor: [0, -20],
});

const bouncingBootSVG = encodeURIComponent(`<svg width="32" height="40" viewBox="0 0 32 40" xmlns="http://www.w3.org/2000/svg"><path d="M16 0C8 0 2 8 2 14c0 10 14 26 14 26s14-16 14-26c0-6-6-14-14-14Z" fill="#dc2626" stroke="#a71b1b" stroke-width="1.5" stroke-linejoin="round"/><circle cx="16" cy="14" r="4" fill="white"/></svg>`);

const bouncingBootIcon = new L.Icon({
  iconUrl: `data:image/svg+xml;charset=utf-8,${bouncingBootSVG}`,
  iconSize: [32, 40],
  popupAnchor: [0, -20],
});

export default function BootMap({ boots = [] }) {
  const [userLocation, setUserLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [nearestBoot, setNearestBoot] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Get user's geolocation
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setUserLocation(location);
          
          // Find nearest boot (only from boots that have coordinates)
          const bootsWithCoords = boots.filter(boot => boot.lat && boot.lng);
          if (bootsWithCoords.length > 0) {
            let nearest = null;
            let minDistance = Infinity;

            bootsWithCoords.forEach(boot => {
              // Haversine formula for accurate distance calculation
              const R = 3959; // Earth radius in miles
              const dLat = (boot.lat - location.lat) * Math.PI / 180;
              const dLng = (boot.lng - location.lng) * Math.PI / 180;
              const a = 
                Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(location.lat * Math.PI / 180) * Math.cos(boot.lat * Math.PI / 180) *
                Math.sin(dLng / 2) * Math.sin(dLng / 2);
              const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
              const distance = R * c;

              if (distance < minDistance) {
                minDistance = distance;
                nearest = { boot, distance };
              }
            });

            setNearestBoot(nearest);
          }
          setLoading(false);
        },
        (err) => {
          console.error('Geolocation error:', err);
          setError('Unable to access your location. Please enable location services.');
          setLoading(false);
        }
      );
    } else {
      setError('Geolocation is not supported by your browser');
      setLoading(false);
    }
  }, [boots]);

  if (loading) {
    return (
      <Card className="p-8 flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-amber-600 mx-auto mb-2" />
          <p className="text-stone-600">Finding your location...</p>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-8 text-center h-96 flex items-center justify-center bg-stone-50">
        <div>
          <MapPin className="w-8 h-8 text-stone-400 mx-auto mb-2" />
          <p className="text-stone-600">{error}</p>
        </div>
      </Card>
    );
  }

  if (!userLocation) {
    return (
      <Card className="p-8 text-center h-96 flex items-center justify-center bg-stone-50">
        <p className="text-stone-600">Unable to determine your location</p>
      </Card>
    );
  }

  // Map needs to center on user or nearest boot
  const center = userLocation;

  return (
    <div className="space-y-4">
      {nearestBoot && (
        <Card className="bg-gradient-to-r from-amber-50 to-orange-50 border-amber-300 p-4">
          <div className="flex items-start gap-3">
            <span className="text-2xl">👢</span>
            <div>
              <h4 className="font-semibold text-amber-900">{nearestBoot.boot.name}</h4>
              <p className="text-sm text-amber-700 mt-1">{nearestBoot.boot.address}</p>
              <p className="text-xs text-amber-600 mt-2">
                Nearest boot to your location
              </p>
            </div>
          </div>
        </Card>
      )}

      <Card className="overflow-hidden h-96">
        <MapContainer
          center={[center.lat, center.lng]}
          zoom={14}
          scrollWheelZoom={false}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* User location marker */}
          <Marker position={[userLocation.lat, userLocation.lng]}>
            <Popup>
              <div className="text-sm font-semibold">Your Location</div>
            </Popup>
          </Marker>

          {/* Boot markers */}
          {boots.filter(boot => boot.lat && boot.lng).map((boot) => (
            <Marker 
              key={boot.name} 
              position={[boot.lat, boot.lng]} 
              icon={nearestBoot?.boot.name === boot.name ? bouncingBootIcon : bootIcon}
            >
              <Popup>
                <div className="text-sm">
                  <div className="font-semibold">{boot.name}</div>
                  <div className="text-xs text-stone-600 mt-1">{boot.address}</div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </Card>
    </div>
  );
}