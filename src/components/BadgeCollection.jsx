import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

function BadgeItem({ badge, isEarned }) {
  const [open, setOpen] = useState(false);
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
    >
      <TooltipProvider>
        <Tooltip open={open} onOpenChange={setOpen}>
          <TooltipTrigger asChild>
            <button 
              onClick={() => setOpen(!open)}
              className={`cursor-pointer transition-all ${isEarned ? '' : 'opacity-30'} focus:outline-none`}
            >
              {badge.icon_url ? (
                <img src={badge.icon_url} alt={badge.name} className="w-24 h-24 object-cover rounded-lg" />
              ) : (
                <div className="w-24 h-24 flex items-center justify-center text-6xl">🎖️</div>
              )}
            </button>
          </TooltipTrigger>
          <TooltipContent>
            <p className="font-semibold">{badge.name}</p>
            <p className="text-xs">{badge.description}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </motion.div>
  );
}

export default function BadgeCollection({ reviewCount = 0, avgRating = 0, bootVisitCount = 0, userRatings = [] }) {
  const { data: allBadges = [] } = useQuery({
    queryKey: ['badges'],
    queryFn: () => base44.entities.Badge.list(),
  });

  const reviewBadges = allBadges.filter(b => b.type === 'review' && b.name !== 'The Strong Silent Type' && b.name !== 'The Duster').sort((a, b) => a.min_count - b.min_count);
  const bootBadges = allBadges.filter(b => b.type === 'boot').sort((a, b) => a.min_count - b.min_count);
  
  const strongSilentTypeBadge = allBadges.find(b => b.name === 'The Strong Silent Type');
  const strongSilentTypeEarned = strongSilentTypeBadge && reviewCount >= 10 && userRatings.every(r => !r.comment);
  
  const dusterBadge = allBadges.find(b => b.name === 'The Duster');
  const lowRatingCount = userRatings.filter(r => r.boots >= 1 && r.boots <= 2).length;
  const dusterEarned = dusterBadge && lowRatingCount >= 25;

  return (
    <Card className="mb-6 border-stone-200">
      <CardHeader>
        <CardTitle>Badge Collection</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Review Badges */}
          <div>
            <h3 className="text-sm font-semibold text-stone-700 mb-3">Review Badges</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              {reviewBadges.map((badge) => (
                <BadgeItem 
                  key={badge.id}
                  badge={badge}
                  isEarned={reviewCount >= badge.min_count}
                />
              ))}

              {strongSilentTypeBadge && (
                <BadgeItem 
                  badge={strongSilentTypeBadge}
                  isEarned={strongSilentTypeEarned}
                />
              )}

              {dusterBadge && (
                <BadgeItem 
                  badge={dusterBadge}
                  isEarned={dusterEarned}
                />
              )}
            </div>
          </div>

          {/* Boot Challenge Badges */}
          <div>
            <h3 className="text-sm font-semibold text-stone-700 mb-3">Big Boots Challenge</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              {bootBadges.map((badge) => (
                <BadgeItem 
                  key={badge.name}
                  badge={badge}
                  isEarned={bootVisitCount >= badge.min_count}
                />
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}