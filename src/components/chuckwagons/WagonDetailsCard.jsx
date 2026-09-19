import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Camera, Loader2, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

export default function WagonDetailsCard({ wagon }) {
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState(false);
  const [website, setWebsite] = useState(wagon.website || '');

  const updateMutation = useMutation({
    mutationFn: async (fields) => base44.entities.Venue.update(wagon.id, fields),
    onSuccess: () => {
      toast.success('Listing updated');
      queryClient.invalidateQueries({ queryKey: ['myChuckWagons'] });
      queryClient.invalidateQueries({ queryKey: ['chuckWagons'] });
      queryClient.invalidateQueries({ queryKey: ['venues'] });
    },
    onError: () => toast.error("Couldn't save that. Try again."),
  });

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadPublicFile({ file });
      await base44.entities.Venue.update(wagon.id, { image_url: file_url });
      toast.success('Cover photo updated');
      queryClient.invalidateQueries({ queryKey: ['myChuckWagons'] });
      queryClient.invalidateQueries({ queryKey: ['chuckWagons'] });
      queryClient.invalidateQueries({ queryKey: ['venues'] });
    } catch (err) {
      toast.error('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const saveWebsite = () => {
    let url = website.trim();
    if (url && !/^https?:\/\//i.test(url)) {
      url = `https://${url}`;
      setWebsite(url);
    }
    if (url === (wagon.website || '')) return;
    updateMutation.mutate({ website: url });
  };

  return (
    <Card className="p-6 bg-white mb-6">
      <h2 className="font-semibold text-lg text-stone-900 mb-1">Listing details</h2>
      <p className="text-sm text-stone-500 mb-5">
        This is what people see on your venue page. Add a cover photo so your listing stands out.
      </p>

      {/* Cover image */}
      <div className="mb-6">
        <Label className="text-sm mb-2 block">Cover photo</Label>
        <div className="relative w-full h-44 rounded-lg overflow-hidden border border-stone-200 bg-stone-100">
          {wagon.image_url ? (
            <img
              src={wagon.image_url}
              alt={wagon.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-stone-400 text-sm">
              No cover photo yet
            </div>
          )}
          <label className="absolute bottom-2 right-2 bg-amber-600 hover:bg-amber-700 text-white rounded-full p-2 cursor-pointer transition-colors shadow-sm">
            {uploading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Camera className="w-4 h-4" />
            )}
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              disabled={uploading}
              className="hidden"
            />
          </label>
        </div>
        <p className="text-xs text-stone-500 mt-2">
          Tap the camera to upload. Landscape photos work best.
        </p>
      </div>

      {/* Website */}
      <div>
        <Label htmlFor="website" className="text-sm">Website</Label>
        <div className="flex gap-2 mt-1">
          <Input
            id="website"
            placeholder="https://yourmenu.com"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            onBlur={saveWebsite}
          />
          {wagon.website && (
            <Button asChild variant="outline" size="icon" title="Open in new tab">
              <a href={wagon.website} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-4 h-4" />
              </a>
            </Button>
          )}
        </div>
        <p className="text-xs text-stone-500 mt-2">
          Link to your menu, ordering site, or social page.
        </p>
      </div>
    </Card>
  );
}