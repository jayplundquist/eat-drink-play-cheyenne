import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Camera, Loader2, X } from "lucide-react";
import { toast } from "sonner";

const BOOTS_LIST = [
  { name: "Gamblers Boot", address: "4610 Carey Ave (Old West Museum)" },
  { name: "Springtime in Cheyenne", address: "6106 Yellowstone Rd" },
  { name: "Licensed to Boot", address: "2301 Central Ave" },
  { name: "Atmospheric Research", address: "8120 Veta Dr" },
  { name: "Memories of the Old West", address: "Cheyenne Depot Plaza (by the tracks)" },
  { name: "Journey of the Soul", address: "710 S. Lions Park Dr (Cheyenne Botanic Gardens)" },
  { name: "All Things Wyoming", address: "502 Bonanza Trail" },
  { name: "Wyoming Bank & Trust 100th Anniversary", address: "5827 Yellowstone Rd" },
  { name: "Wyoming Financial Properties", address: "6101 Yellowstone Rd (in lobby)" },
  { name: "First American Title", address: "Downtown Cheyenne" },
  { name: "We're With You", address: "1715 Stillwater Ave" },
  { name: "LCCC Eagle Eye on the Future", address: "1400 E College Dr (campus, south side)" },
  { name: "People Places and Things", address: "311 Cleveland Place (lobby)" },
  { name: "Outlaws of Wyoming", address: "Morrie Ave/Lincolnway" },
  { name: "8-Second Steps to the Big Time", address: "1912 Capitol Ave" },
  { name: "Book Boot", address: "2200 Pioneer Avenue" },
  { name: "Cheyenne Vision Clinic", address: "1854 Dell Range Blvd" },
  { name: "Hub International", address: "Downtown Cheyenne" },
  { name: "Our Legacy, Improving Life with Energy", address: "Cheyenne" },
  { name: "Religion's a Kick", address: "2101 O'Neil Ave (Chamber of Commerce)" },
  { name: "Where the Deer and the Antelope Play", address: "Cheyenne Depot Plaza" },
  { name: "Don't Feed the Animals", address: "Cheyenne Depot Plaza" },
  { name: "Governors of Wyoming", address: "Cheyenne Depot Plaza" },
  { name: "Milestones: Chamber 100th Anniversary", address: "Cheyenne Depot Plaza" },
  { name: "Wyoming Women 1st to Vote", address: "Capitol Ave (between 17th & 18th)" },
  { name: "Honoring Healthcare Heroes", address: "214 E. 23rd St" },
  { name: "Exeter's Pony Express", address: "Cheyenne Depot Plaza" },
  { name: "South High Class of 2022", address: "1213 W. Allison Rd (South High)" },
  { name: "Lewis Auto Repair", address: "285 North American Rd" },
];

export default function BootCheckList({ user }) {
  const [uploadingBoot, setUploadingBoot] = useState(null);
  const queryClient = useQueryClient();

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
    } catch (error) {
      toast.error('Failed to upload photo');
    } finally {
      setUploadingBoot(null);
    }
  };

  const isVisited = (bootName) => visits.some(v => v.boot_name === bootName);
  const getVisit = (bootName) => visits.find(v => v.boot_name === bootName);

  const visitedCount = visits.length;
  const totalCount = BOOTS_LIST.length;

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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {BOOTS_LIST.map((boot, i) => {
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
                      <p className="text-sm text-stone-600 mt-1">{boot.address}</p>

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