import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Upload, Trash2, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';

// One-time $4.99 upgrade: a claimed chuck wagon can upload a logo that renders as
// its map pin. The logo goes live immediately; an admin is alerted after the fact.
export default function BrandedPinCard({ wagon }) {
  const queryClient = useQueryClient();
  const [purchasing, setPurchasing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [removing, setRemoving] = useState(false);

  const upgraded = !!wagon.has_branded_pin;

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['myChuckWagons'] });
    queryClient.invalidateQueries({ queryKey: ['chuckWagons'] });
  };

  const handlePurchase = async () => {
    if (window.self !== window.top) {
      toast.error('Checkout only works on the published site. Open the app in its own tab.');
      return;
    }
    setPurchasing(true);
    try {
      const response = await base44.functions.invoke('createCheckoutSession', {
        type: 'branded_pin',
        venueId: wagon.id,
      });
      const url = response?.data?.url || response?.url;
      if (!url) throw new Error('No checkout URL returned');
      window.location.href = url;
    } catch (error) {
      console.error(error);
      toast.error("Couldn't start checkout. Try again.");
      setPurchasing(false);
    }
  };

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Logo must be under 5 MB');
      return;
    }
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadPublicFile({ file });
      await base44.entities.Venue.update(wagon.id, { pin_logo_url: file_url });
      // Alert admins after the fact so they can review and pull anything off-brand.
      await base44.functions
        .invoke('sendAdminAlert', {
          type: 'branded_pin_logo',
          venue_id: wagon.id,
          wagon_name: wagon.name,
          user_email: wagon.claimed_by,
        })
        .catch((e) => console.error('Admin alert failed:', e));
      toast.success('Logo is live on the map');
      refresh();
    } catch (error) {
      console.error(error);
      toast.error('Upload failed. Try again.');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleRemove = async () => {
    setRemoving(true);
    try {
      await base44.entities.Venue.update(wagon.id, { pin_logo_url: '' });
      toast.success('Logo removed — pin reverts to your letter marker');
      refresh();
    } catch (error) {
      toast.error("Couldn't remove the logo.");
    } finally {
      setRemoving(false);
    }
  };

  return (
    <Card
      className={`p-6 mt-6 ${
        upgraded ? 'bg-white border-amber-200' : 'bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200'
      }`}
    >
      <div className="flex items-center gap-2 mb-2">
        <ImageIcon className="w-5 h-5 text-amber-700" />
        <h3 className="font-semibold text-amber-900">Put your logo on the map</h3>
        {upgraded && <Badge className="bg-amber-100 text-amber-800 ml-auto">Unlocked</Badge>}
      </div>

      {!upgraded ? (
        <>
          <p className="text-sm text-amber-800 mb-4">
            Your pin shows a plain letter marker right now. Upgrade once for $4.99 and your logo
            becomes your pin — so people spot you at a glance wherever you park.
          </p>
          <Button
            className="bg-amber-600 hover:bg-amber-700 text-white w-full"
            disabled={purchasing}
            onClick={handlePurchase}
          >
            {purchasing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Sending you to checkout
              </>
            ) : (
              'Get the logo pin — $4.99'
            )}
          </Button>
        </>
      ) : (
        <>
          <p className="text-sm text-stone-600 mb-4">
            Upload a square logo (PNG or JPG, under 5 MB). It shows as your pin on the Chuck
            Wagons map right away. An admin is notified so they can pull anything off-brand.
          </p>

          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-stone-100 border-2 border-amber-300 overflow-hidden flex items-center justify-center shrink-0">
              {wagon.pin_logo_url ? (
                <img src={wagon.pin_logo_url} alt="Logo pin" className="w-full h-full object-cover" />
              ) : (
                <ImageIcon className="w-6 h-6 text-stone-400" />
              )}
            </div>
            <div className="flex-1 min-w-0 flex flex-wrap items-center gap-2">
              <label
                className={`inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium h-9 px-3 cursor-pointer border transition-colors ${
                  uploading
                    ? 'opacity-50 pointer-events-none border-stone-300 text-stone-500'
                    : 'border-amber-300 text-amber-800 hover:bg-amber-50'
                }`}
              >
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleUpload}
                  disabled={uploading}
                />
                {uploading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Upload className="w-4 h-4" />
                )}
                {wagon.pin_logo_url ? 'Replace logo' : 'Upload logo'}
              </label>
              {wagon.pin_logo_url && (
                <button
                  type="button"
                  onClick={handleRemove}
                  disabled={removing}
                  className="inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-md text-sm font-medium h-9 px-3 border border-red-300 text-red-600 hover:bg-red-50 disabled:opacity-50"
                >
                  {removing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  Remove
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </Card>
  );
}