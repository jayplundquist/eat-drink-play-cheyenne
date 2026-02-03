import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Camera, Loader2, X, MapPin } from "lucide-react";
import { toast } from "sonner";
import BootMap from "./BootMap";

export default function BootCheckList({ user }) {
  const [uploadingBoot, setUploadingBoot] = useState(null);
  const [bootsWithCoords, setBootsWithCoords] = useState([]);
  const [geocodingLoading, setGeocodingLoading] = useState(true);
  const queryClient = useQueryClient();

  const { data: boots = [] } = useQuery({
    queryKey: ['boots'],
    queryFn: () => base44.entities.Boot.list('-created_date'),
  });

  const { data: visits = [] } = useQuery({
    queryKey: ['bootVisits', user?.email],
    queryFn: () => user ? base44.entities.BootVisit.filter({ user_email: user.email }) : [],
    enabled: !!user,
  });

  const visitMutation = useMutation({
    mutationFn: async ({ bootName, address, photoUrl = null }) => {
      await base44.entities.BootVisit.create({
        user_email: user.email,
        boot_name: bootName,
        address: address,
        photo_url: photoUrl,
        visited_date: new Date().toISOString()
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bootVisits'] });
      toast.success('Boot added to your collection! 🤠');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (visitId) => {
      await base44.entities.BootVisit.delete(visitId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bootVisits'] });
      toast.success('Removed from your collection');
    },
  });

  const handlePhotoUpload = async (e, boot) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingBoot(boot.name);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      await visitMutation.mutateAsync({ 
        bootName: boot.name, 
        address: boot.address,
        photoUrl: file_url 
      });
      
      // Ask if they want to share to activity feed
      setTimeout(() => {
        if (confirm('Share this boot visit to your followers?')) {
          shareToActivityFeed(boot.name, file_url);
        }
      }, 500);
    } catch (error) {
      toast.error('Failed to upload photo');
    } finally {
      setUploadingBoot(null);
    }
  };

  const shareToActivityFeed = async (bootName, photoUrl) => {
    try {
      await base44.entities.BootShare.create({
        user_email: user.email,
        boot_name: bootName,
        photo_url: photoUrl,
        shared_date: new Date().toISOString()
      });
      toast.success('Shared to activity feed! 📸');
    } catch (error) {
      // BootShare entity might not exist yet, silently fail
    }
  };

  const isVisited = (bootName) => visits.some(v => v.boot_name === bootName);
  const getVisit = (bootName) => visits.find(v => v.boot_name === bootName);

  // Geocode boots to get coordinates for map
  useEffect(() => {
    const geocodeBoots = async () => {
      setGeocodingLoading(true);
      if (boots.length === 0) {
        setBootsWithCoords([]);
        setGeocodingLoading(false);
        return;
      }

      const results = [];
      for (const boot of boots) {
        try {
          const encoded = encodeURIComponent(boot.address);
          const response = await fetch(
            `https://nominatim.openstreetmap.org/search?q=${encoded}&format=json&limit=1`,
            { signal: AbortSignal.timeout(5000) }
          );
          const data = await response.json();
          if (data.length > 0) {
            results.push({
              ...boot,
              lat: parseFloat(data[0].lat),
              lng: parseFloat(data[0].lon),
            });
          } else {
            console.warn('No geocoding result for', boot.address);
          }
        } catch (err) {
          console.error('Geocoding error for', boot.name, err);
        }
      }
      setBootsWithCoords(results);
      setGeocodingLoading(false);
    };

    geocodeBoots();
  }, [boots]);

  const visitedCount = visits.length;
  const totalCount = boots.length;

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-amber-50 to-stone-50 rounded-lg p-6">
        <h3 className="text-2xl font-bold text-amber-900 mb-2">Big Boots Challenge</h3>
        <div className="flex items-center gap-2">
          <div className="text-3xl font-bold text-amber-700">{visitedCount}</div>
          <div className="text-stone-700">of {totalCount} boots visited</div>
        </div>
        <div className="w-full bg-stone-300 rounded-full h-2 mt-3">
          <div 
            className="bg-amber-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${(visitedCount / totalCount) * 100}%` }}
          />
        </div>
      </div>

      {/* Boot Map */}
      {bootsWithCoords.length > 0 && (
        <div>
          <h3 className="text-xl font-bold text-stone-800 mb-3">Find the Nearest Boot</h3>
          <BootMap boots={bootsWithCoords} />
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {boots.map((boot, i) => {
          const visited = isVisited(boot.name);
          const visit = getVisit(boot.name);

          return (
            <motion.div
              key={boot.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.02 }}
            >
              <Card className={`transition-all ${visited ? 'bg-amber-50 border-amber-300' : 'bg-white'}`}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      checked={visited}
                      disabled
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <h4 className={`font-semibold ${visited ? 'text-amber-900' : 'text-stone-800'}`}>
                        {boot.name}
                      </h4>
                      <button
                        onClick={() => {
                          const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(boot.address)}`;
                          window.open(url, '_blank', 'noopener,noreferrer');
                        }}
                        className="text-sm text-amber-700 hover:text-amber-900 mt-1 flex items-center gap-1 transition-colors"
                      >
                        <MapPin className="w-3 h-3" />
                        <span>{boot.address}</span>
                      </button>

                      {visited && visit?.photo_url && (
                        <div className="mt-3 relative">
                          <img 
                            src={visit.photo_url} 
                            alt={boot.name}
                            className="w-full h-32 object-cover rounded-lg"
                          />
                        </div>
                      )}

                      <div className="flex gap-2 mt-3">
                        {!visited && (
                          <label className="flex-1">
                            <Button
                              asChild
                              size="sm"
                              variant="outline"
                              className="w-full border-amber-300 text-amber-700 hover:bg-amber-50 cursor-pointer"
                              disabled={uploadingBoot === boot.name}
                            >
                              <span>
                                {uploadingBoot === boot.name ? (
                                  <>
                                    <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                                    Uploading...
                                  </>
                                ) : (
                                  <>
                                    <Camera className="w-3 h-3 mr-1" />
                                    Add Photo
                                  </>
                                )}
                              </span>
                            </Button>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => handlePhotoUpload(e, boot)}
                              disabled={uploadingBoot === boot.name}
                              className="hidden"
                            />
                          </label>
                        )}
                        {visited && (
                          <Button
                            onClick={() => deleteMutation.mutate(visit.id)}
                            size="sm"
                            variant="outline"
                            className="flex-1 border-red-300 text-red-700 hover:bg-red-50"
                          >
                            <X className="w-3 h-3 mr-1" />
                            Remove
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}