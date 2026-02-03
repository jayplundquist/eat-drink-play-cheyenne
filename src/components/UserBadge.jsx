import React, { useMemo, useState } from 'react';
import { Badge } from "@/components/ui/badge";
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export default function UserBadge({ reviewCount = 0, avgRating = 0, bootVisitCount = 0, userRatings = [], size = 'default' }) {
  const { data: allBadges = [] } = useQuery({
    queryKey: ['badges'],
    queryFn: () => base44.entities.Badge.list(),
  });

  const earnedBadges = useMemo(() => {
    const earned = [];

    // Regular review badges - show highest earned
    const reviewBadges = allBadges.filter(b => b.type === 'review' && b.name !== 'The Strong Silent Type' && b.name !== 'The Duster').sort((a, b) => b.min_count - a.min_count);
    const highestReviewBadge = reviewBadges.find(b => reviewCount >= b.min_count);
    if (highestReviewBadge) {
      earned.push(highestReviewBadge);
    }

    // Boot badges - show highest earned
    const bootBadges = allBadges.filter(b => b.type === 'boot').sort((a, b) => b.min_count - a.min_count);
    const highestBootBadge = bootBadges.find(b => bootVisitCount >= b.min_count);
    if (highestBootBadge) {
      earned.push(highestBootBadge);
    }

    // Special category badges
    const strongSilentTypeBadge = allBadges.find(b => b.name === 'The Strong Silent Type');
    if (strongSilentTypeBadge && reviewCount >= 10 && userRatings.every(r => !r.comment)) {
      earned.push(strongSilentTypeBadge);
    }

    const dusterBadge = allBadges.find(b => b.name === 'The Duster');
    if (dusterBadge && userRatings.filter(r => r.boots >= 1 && r.boots <= 2).length >= 25) {
      earned.push(dusterBadge);
    }

    return earned;
  }, [allBadges, reviewCount, bootVisitCount, userRatings]);

  if (earnedBadges.length === 0) return null;

  return (
    <div className={`flex gap-2 flex-wrap items-center ${size === 'sm' ? '' : ''}`}>
      {earnedBadges.map((badge) => (
        <TooltipProvider key={badge.id || badge.name}>
          <Tooltip>
            <TooltipTrigger asChild>
              {size === 'sm' ? (
                <span className="text-xs font-semibold flex items-center gap-1 cursor-help">
                  {badge.icon_url ? (
                    <img src={badge.icon_url} alt={badge.name} className="w-4 h-4" />
                  ) : (
                    <span>🎖️</span>
                  )}
                  <span>{badge.name}</span>
                </span>
              ) : (
                <Badge className="font-semibold cursor-help bg-amber-100 text-amber-800 hover:bg-amber-200">
                  {badge.icon_url ? (
                    <img src={badge.icon_url} alt={badge.name} className="w-4 h-4 mr-1" />
                  ) : (
                    <span className="mr-1">🎖️</span>
                  )}
                  {badge.name}
                </Badge>
              )}
            </TooltipTrigger>
            <TooltipContent>
              <p>{badge.description}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ))}
    </div>
  );
}