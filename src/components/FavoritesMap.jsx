import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Card } from "@/components/ui/card";
import { MapPin, Loader2 } from "lucide-react";
import { createPageUrl } from '@/utils';
import BootRating from './BootRating';

// Black Railroad Spike Icon
const spikeIcon = L.icon({
  iconUrl: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/697e9c14c196b53cce1321b1/6d4b21389_spike.png',
  iconSize: [32, 48],
  iconAnchor: [16, 45],
  popupAnchor: [0, -45],
  className: 'spike-icon',
});

const CHEYENNE_CENTER = [41.1400, -104.8202];

const geocodeAddress = async (address) => {
  if (!address) return CHEYENNE_CENTER;
  try {
    const response = await base44.functions.invoke('geocodeAddress', { address });
    return response.data.coordinates || CHEYENNE_CENTER;
  } catch {
    return [
      CHEYENNE_CENTER[0] + (Math.random() - 0.5) * 0.1,
      CHEYENNE_CENTER[1] + (Math.random() - 0.5) * 0.1,
    ];
  }
};

export default function FavoritesMap({ user, favoriteVenues }) {
  const [mapLoading, setMapLoading] = useState(true);
  const [markers, setMarkers] = useState([]);

  const { data: userRatings = [] } = useQuery({
    queryKey: ['userRatings', user?.email],
    queryFn: () => user ? base44.entities.Rating.filter({ user_email: user.email }) : [],
    enabled: !!user,
  });

  const { data: bootVisits = [] } = useQuery({
    queryKey: ['bootVisits', user?.email],
    queryFn: () => user ? base44.entities.BootVisit.filter({ user_email: user.email }) : [],
    enabled: !!user,
  });

  const { data: boots = [] } = useQuery({
    queryKey: ['boots'],
    queryFn: () => base44.entities.Boot.list(),
  });

  useEffect(() => {
    const loadMarkers = async () => {
      setMapLoading(true);
      const newMarkers = [];

      for (const venue of favoriteVenues) {
        if (venue.address) {
          const rating = userRatings.find(r => r.venue_id === venue.id);
          try {
            const coords = await geocodeAddress(venue.address);
            newMarkers.push({
              id: `venue-${venue.id}`,
              type: 'venue',
              venueId: venue.id,
              coords,
              name: venue.name,
              address: venue.address,
              rating: rating?.boots || 0,
              icon: spikeIcon,
            });
          } catch (e) {
            console.error('Failed to geocode venue:', venue.name);
          }
        }
      }

      for (const visit of bootVisits) {
        const boot = boots.find(b => b.name === visit.boot_name);
        if (boot && boot.address) {
          try {
            const coords = await geocodeAddress(boot.address);
            newMarkers.push({
              id: `boot-${visit.id}`,
              type: 'boot',
              coords,
              name: boot.name,
              address: boot.address,
              photo: visit.photo_url,
              icon: spikeIcon,
            });
          } catch (e) {
            console.error('Failed to geocode boot:', boot.name);
          }
        }
      }

      setMarkers(newMarkers);
      setMapLoading(false);
    };

    if (user) {
      loadMarkers();
    }
  }, [user, favoriteVenues, userRatings, bootVisits, boots]);

  return (
    <div className="space-y-4">
      <Card className="overflow-hidden" style={{ height: '60vh' }}>
        {mapLoading ? (
          <div className="w-full h-full flex items-center justify-center bg-stone-100">
            <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
          </div>
        ) : (
          <MapContainer
            center={CHEYENNE_CENTER}
            zoom={12}
            style={{ width: '100%', height: '100%' }}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; OpenStreetMap contributors'
            />
            {markers.map(marker => (
              <Marker
                key={marker.id}
                position={marker.coords}
                icon={marker.icon}
              >
                <Popup>
                  <div className="p-2 space-y-2">
                    {marker.type === 'venue' && marker.venueId ? (
                      <a href={createPageUrl(`VenueDetails?id=${marker.venueId}`)} className="font-semibold text-blue-600 hover:underline block">
                        {marker.name}
                      </a>
                    ) : (
                      <h3 className="font-semibold text-stone-800">{marker.name}</h3>
                    )}
                    {marker.address && (
                      <button
                        onClick={() => {
                          const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(marker.address)}`;
                          window.open(url, '_blank', 'noopener,noreferrer');
                        }}
                        className="text-xs text-blue-600 hover:underline block text-left"
                      >
                        {marker.address}
                      </button>
                    )}
                    {marker.type === 'venue' && marker.rating > 0 && (
                      <div className="mt-2">
                        <div className="flex items-center gap-1">
                          <BootRating rating={marker.rating} size="sm" />
                          <span className="text-xs text-stone-600">{marker.rating} boots</span>
                        </div>
                      </div>
                    )}
                    {marker.type === 'boot' && marker.photo && (
                      <img src={marker.photo} alt={marker.name} className="w-full h-24 object-cover rounded mt-2" />
                    )}
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        )}
      </Card>

      <div className="grid grid-cols-2 gap-3">
        <Card className="p-4 bg-gradient-to-br from-amber-50 to-amber-100">
          <div className="flex items-center gap-2 mb-1">
            <div className="text-lg">🔗</div>
            <h3 className="font-semibold text-amber-900 text-sm">Venues ({favoriteVenues.length})</h3>
          </div>
          <p className="text-xs text-amber-700">Places you've saved</p>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-amber-50 to-amber-100">
          <div className="flex items-center gap-2 mb-1">
            <div className="text-lg">👢</div>
            <h3 className="font-semibold text-amber-900 text-sm">Big Boots ({bootVisits.length})</h3>
          </div>
          <p className="text-xs text-amber-700">Boots you've collected</p>
        </Card>
      </div>

      {markers.length === 0 && !mapLoading && (
        <Card className="p-4 text-center">
          <MapPin className="w-8 h-8 text-stone-300 mx-auto mb-2" />
          <p className="text-stone-600 text-sm">
            No mapped locations yet. Save venues or find boots to fill your map.
          </p>
        </Card>
      )}
    </div>
  );
}