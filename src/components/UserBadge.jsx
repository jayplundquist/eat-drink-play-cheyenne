import React from 'react';
import { Badge } from "@/components/ui/badge";

const BADGE_LEVELS = [
  { name: 'Tenderfoot', minReviews: 1, color: 'bg-blue-100 text-blue-800', icon: '🤠' },
  { name: 'Wrangler', minReviews: 10, color: 'bg-amber-100 text-amber-800', icon: '🐴' },
  { name: 'The Marshall', minReviews: 25, color: 'bg-red-100 text-red-800', icon: '⭐' },
  { name: 'Legend of the Plains', minReviews: 50, color: 'bg-purple-100 text-purple-800', icon: '👑' },
];

export const getBadgeInfo = (reviewCount) => {
  if (!reviewCount) return BADGE_LEVELS[0];
  
  let currentBadge = BADGE_LEVELS[0];
  for (const badge of BADGE_LEVELS) {
    if (reviewCount >= badge.minReviews) {
      currentBadge = badge;
    }
  }
  return currentBadge;
};

export default function UserBadge({ reviewCount, size = 'default' }) {
  const badge = getBadgeInfo(reviewCount);
  
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