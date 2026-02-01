import React from 'react';
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const BADGE_LEVELS = [
  { name: 'Tenderfoot', minReviews: 1, color: 'bg-blue-100 text-blue-800', icon: '🤠', description: 'Posted your first review' },
  { name: 'Wrangler', minReviews: 10, color: 'bg-amber-100 text-amber-800', icon: '🐴', description: '10+ reviews' },
  { name: 'The Marshall', minReviews: 25, color: 'bg-red-100 text-red-800', icon: '⭐', description: '25+ reviews' },
  { name: 'Legend of the Plains', minReviews: 50, color: 'bg-purple-100 text-purple-800', icon: '👑', description: '50+ reviews' },
];

const DUSTER_BADGE = {
  name: 'The Duster',
  color: 'bg-orange-100 text-orange-800',
  icon: '🌪️',
  description: 'Averages 1-2 star ratings'
};

export const getBadgeInfo = (reviewCount, avgRating) => {
  // No badge until first review
  if (!reviewCount) return null;
  
  // "The Duster" badge - for users who average 1-2 star ratings
  if (reviewCount >= 5 && avgRating >= 1 && avgRating <= 2) {
    return DUSTER_BADGE;
  }
  
  let currentBadge = null;
  for (const badge of BADGE_LEVELS) {
    if (reviewCount >= badge.minReviews) {
      currentBadge = badge;
    }
  }
  return currentBadge;
};

export default function UserBadge({ reviewCount, avgRating, size = 'default' }) {
  const badge = getBadgeInfo(reviewCount, avgRating);
  
  if (!badge) return null;
  
  const badgeContent = (
    <>
      <span className="mr-1">{badge.icon}</span>
      {badge.name}
    </>
  );

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {size === 'sm' ? (
            <span className="text-xs font-semibold flex items-center gap-1 cursor-help">
              <span>{badge.icon}</span>
              <span>{badge.name}</span>
            </span>
          ) : (
            <Badge className={`${badge.color} font-semibold cursor-help`}>
              {badgeContent}
            </Badge>
          )}
        </TooltipTrigger>
        <TooltipContent>
          <p>{badge.description}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}