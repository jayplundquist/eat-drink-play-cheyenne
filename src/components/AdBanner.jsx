import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { X } from 'lucide-react';
import { Button } from "@/components/ui/button";

export default function AdBanner() {
  const [dismissedAds, setDismissedAds] = React.useState(new Set());

  const { data: ads = [] } = useQuery({
    queryKey: ['activeAds'],
    queryFn: async () => {
      const allAds = await base44.entities.Ad.list();
      const now = new Date();
      
      return allAds.filter(ad => {
        if (!ad.is_active) return false;
        if (ad.start_date && new Date(ad.start_date) > now) return false;
        if (ad.end_date && new Date(ad.end_date) < now) return false;
        return true;
      });
    },
  });

  if (ads.length === 0 || ads.every(ad => dismissedAds.has(ad.id))) {
    return null;
  }

  const currentAd = ads.find(ad => !dismissedAds.has(ad.id));

  if (!currentAd) return null;

  const handleDismiss = () => {
    setDismissedAds(prev => new Set([...prev, currentAd.id]));
  };

  const handleClick = () => {
    if (currentAd.link_url) {
      window.open(currentAd.link_url, '_blank');
    }
  };

  return (
    <div className="bg-gradient-to-r from-amber-100 to-orange-100 border-t-2 border-amber-300 py-4 px-4">
      <div className="max-w-6xl mx-auto">
        <div 
          className="flex items-center gap-4 p-4 bg-white rounded-lg border-2 border-amber-200 cursor-pointer hover:shadow-md transition-shadow"
          onClick={handleClick}
        >
          {currentAd.image_url && (
            <img 
              src={currentAd.image_url} 
              alt={currentAd.title}
              className="w-20 h-20 object-cover rounded"
            />
          )}
          
          <div className="flex-1 min-w-0">
            <h4 className="font-bold text-amber-900">{currentAd.title}</h4>
            {currentAd.description && (
              <p className="text-sm text-stone-600 mt-1">{currentAd.description}</p>
            )}
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              handleDismiss();
            }}
            className="flex-shrink-0 hover:bg-amber-100"
          >
            <X className="w-4 h-4 text-stone-400" />
          </Button>
        </div>
      </div>
    </div>
  );
}