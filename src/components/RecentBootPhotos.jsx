import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Camera } from 'lucide-react';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from '@/components/ui/carousel';

/**
 * Auto-advancing slideshow of recently shared Big Boot photos.
 * Pulls from BootShare (photos users explicitly opted to share publicly),
 * not BootVisit (private checklist data) — so this only ever shows what
 * people chose to make public.
 */
export default function RecentBootPhotos({ limit = 15 }) {
  const [api, setApi] = React.useState(null);

  const { data: shares = [], isLoading } = useQuery({
    queryKey: ['recentBootPhotosSlideshow'],
    queryFn: () => base44.entities.BootShare.list('-shared_date', limit),
  });

  const { data: users = [] } = useQuery({
    queryKey: ['allUsersForBootPhotos'],
    queryFn: () => base44.entities.User.list(),
  });

  const userMap = React.useMemo(() => new Map(users.map(u => [u.email, u])), [users]);

  // Auto-advance every 4s; loops back to the start at the end.
  React.useEffect(() => {
    if (!api) return;
    const id = setInterval(() => {
      if (api.canScrollNext()) {
        api.scrollNext();
      } else {
        api.scrollTo(0);
      }
    }, 4000);
    return () => clearInterval(id);
  }, [api]);

  if (isLoading || shares.length === 0) return null;

  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-3">
        <Camera className="w-5 h-5 text-amber-700" />
        <h2 className="text-lg font-bold text-stone-800">Recently Found Boots</h2>
      </div>
      <Carousel setApi={setApi} opts={{ loop: true }} className="w-full">
        <CarouselContent>
          {shares.map((share) => {
            const sharer = userMap.get(share.user_email);
            const name = sharer?.display_name || sharer?.full_name || share.user_email?.split('@')[0] || 'Someone';
            return (
              <CarouselItem key={share.id} className="basis-full sm:basis-1/2 md:basis-1/3">
                <Card className="overflow-hidden bg-white border-stone-200">
                  <div className="aspect-square w-full bg-stone-100">
                    <img src={share.photo_url} alt={share.boot_name} className="w-full h-full object-cover" />
                  </div>
                  <div className="p-3">
                    <p className="font-semibold text-stone-800 text-sm truncate">{share.boot_name}</p>
                    <p className="text-xs text-stone-500">found by {name}</p>
                  </div>
                </Card>
              </CarouselItem>
            );
          })}
        </CarouselContent>
        <CarouselPrevious className="hidden sm:flex" />
        <CarouselNext className="hidden sm:flex" />
      </Carousel>
    </div>
  );
}
