import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { MapPin, Loader2 } from "lucide-react";
import { toast } from "sonner";
import BootRating from '../components/BootRating';

// Golden Railroad Spike SVG
const goldenSpikeSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 60" width="32" height="48">
  <!-- Spike -->
  <path d="M 20 5 L 18 50 Q 18 55 20 58 Q 22 55 22 50 L 20 5 Z" fill="#FFD700" stroke="#DAA520" stroke-width="1"/>
  <!-- Highlight -->
  <path d="M 19 10 L 18 45" stroke="#FFF8DC" stroke-width="1" opacity="0.6"/>
  <!-- Head -->
  <ellipse cx="20" cy="8" rx="3" ry="2" fill="#DAA520"/>
</svg>
`;

const spikeIcon = L.divIcon({
  html: goldenSpikeSvg,
  className: 'golden-spike-icon',
  iconSize: [32, 48],
  iconAnchor: [16, 48],
  popupAnchor: [0, -48],
});

// Simple geocoding mock - in production, use a real geocoding service
const CHEYENNE_CENTER = [41.1400, -104.8202];

const geocodeAddress = async (address) => {
  // For now, return a slightly randomized location near Cheyenne
  // In production, use a geocoding API or add coordinates to venues/boots
  if (!address) return CHEYENNE_CENTER;
  
  try {
    const response = await base44.functions.invoke('geocodeAddress', { address });
    return response.data.coordinates || CHEYENNE_CENTER;
  } catch {
    // Return a random point near Cheyenne if geocoding fails
    return [
      CHEYENNE_CENTER[0] + (Math.random() - 0.5) * 0.1,
      CHEYENNE_CENTER[1] + (Math.random() - 0.5) * 0.1,
    ];
  }
};

export default function VisitedMap() {
  const [user, setUser] = useState(null);
  const [mapLoading, setMapLoading] = useState(true);
  const [markers, setMarkers] = useState([]);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => setUser(null));
  }, []);

  const { data: venues = [] } = useQuery({
    queryKey: ['venues'],
    queryFn: () => base44.entities.Venue.list(),
  });

  const { data: userFavorites = [] } = useQuery({
    queryKey: ['userFavorites', user?.email],
    queryFn: () => user ? base44.entities.Favorite.filter({ user_email: user.email }) : [],
    enabled: !!user,
  });

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

      // Add venue markers for favorites
      const visitedVenues = venues.filter(v => userFavorites.some(f => f.venue_id === v.id));
      
      for (const venue of visitedVenues) {
        if (venue.address) {
          const rating = userRatings.find(r => r.venue_id === venue.id);
          try {
            const coords = await geocodeAddress(venue.address);
            newMarkers.push({
              id: `venue-${venue.id}`,
              type: 'venue',
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

      // Add boot markers
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
              icon: bootIcon,
            });
          } catch (e) {
            console.error('Failed to geocode boot:', boot.name);
          }
        }
      }

      setMarkers(newMarkers);
      setMapLoading(false);
    };

    if (user && venues.length >= 0 && boots.length >= 0) {
      loadMarkers();
    }
  }, [user, venues, userFavorites, userRatings, bootVisits, boots]);

  if (!user) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <Card className="p-8 text-center">
          <p className="text-stone-600 mb-4">Please sign in to view your map</p>
        </Card>
      </div>
    );
  }

  const visitedVenues = venues.filter(v => userFavorites.some(f => f.venue_id === v.id));

  return (
    <div className="min-h-screen bg-stone-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-stone-800 mb-2">Your Visited Locations</h1>
          <p className="text-stone-600">Explore all the venues and boots you've visited</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Map */}
          <div className="lg:col-span-2">
            <Card className="overflow-hidden" style={{ height: '600px' }}>
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
                        <div className="p-2">
                          <h3 className="font-semibold text-stone-800">{marker.name}</h3>
                          {marker.address && (
                            <p className="text-xs text-stone-600 mt-1">{marker.address}</p>
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
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <Card className="p-4 bg-gradient-to-br from-red-50 to-red-100">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 bg-red-500 rounded-full" />
                <h3 className="font-semibold text-red-900">Venues ({visitedVenues.length})</h3>
              </div>
              <p className="text-xs text-red-700">Places you've visited and rated</p>
            </Card>

            <Card className="p-4 bg-gradient-to-br from-yellow-50 to-yellow-100">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 bg-yellow-500 rounded-full" />
                <h3 className="font-semibold text-yellow-900">Big Boots ({bootVisits.length})</h3>
              </div>
              <p className="text-xs text-yellow-700">Iconic painted boots you've collected</p>
            </Card>

            {markers.length === 0 && !mapLoading && (
              <Card className="p-4 text-center">
                <MapPin className="w-8 h-8 text-stone-300 mx-auto mb-2" />
                <p className="text-stone-600 text-sm">
                  No visited locations yet. Start exploring!
                </p>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}