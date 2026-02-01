import React from 'react';
import { Badge } from "@/components/ui/badge";

const BADGE_LEVELS = [
  { name: 'Tenderfoot', minReviews: 1, color: 'bg-blue-100 text-blue-800', icon: '🤠' },
  { name: 'Wrangler', minReviews: 10, color: 'bg-amber-100 text-amber-800', icon: '🐴' },
  { name: 'The Marshall', minReviews: 25, color: 'bg-red-100 text-red-800', icon: '⭐' },
  { name: 'Legend of the Plains', minReviews: 50, color: 'bg-purple-100 text-purple-800', icon: '👑' },
];

export const getBadgeInfo = (reviewCount, avgRating) => {
  // No badge until first review
  if (!reviewCount) return null;
  
  // "The Duster" badge - for users who average 1-2 star ratings
  if (reviewCount >= 5 && avgRating >= 1 && avgRating <= 2) {
    return { name: 'The Duster', color: 'bg-orange-100 text-orange-800', icon: '🌪️' };
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
  
  if (size === 'sm') {
    return (
      <span className="text-xs font-semibold flex items-center gap-1">
        <span>{badge.icon}</span>
        <span>{badge.name}</span>
      </span>
    );
  }

  return (
    <Badge className={`${badge.color} font-semibold`}>
      <span className="mr-1">{badge.icon}</span>
      {badge.name}
    </Badge>
  );
}