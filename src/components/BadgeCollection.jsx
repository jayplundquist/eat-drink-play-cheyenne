import React from 'react';
import { motion } from 'framer-motion';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

const BADGE_LEVELS = [
  { name: 'Tenderfoot', minReviews: 1, icon: '🤠', description: 'Posted your first review' },
  { name: 'Wrangler', minReviews: 10, icon: '🐴', description: '10+ reviews' },
  { name: 'The Marshall', minReviews: 25, icon: '⭐', description: '25+ reviews' },
  { name: 'Legend of the Plains', minReviews: 50, icon: '👑', description: '50+ reviews' },
];

const BOOT_BADGES = [
  { name: 'Greenhorn', minBoots: 1, icon: '👢', description: 'Found your first boot' },
  { name: 'Ranch Hand', minBoots: 5, icon: '🤠', description: 'Found 5+ boots' },
  { name: 'Prospector', minBoots: 15, icon: '⛏️', description: 'Found 15+ boots' },
  { name: 'Trail Boss', minBoots: 25, icon: '👑', description: 'Found all 25 boots' },
];

const DUSTER_BADGE = {
  name: 'The Duster',
  icon: '🌪️',
  description: 'Averages 1-2 star ratings',
  minReviews: 5,
  special: true
};

export default function BadgeCollection({ reviewCount = 0, avgRating = 0, bootVisitCount = 0 }) {
  const earned = BADGE_LEVELS.filter(b => reviewCount >= b.minReviews);
  const bootEarned = BOOT_BADGES.filter(b => bootVisitCount >= b.minBoots);
  const dusterEarned = reviewCount >= 5 && avgRating >= 1 && avgRating <= 2;

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
              {BADGE_LEVELS.map((badge) => {
            const isEarned = reviewCount >= badge.minReviews;
            return (
              <motion.div
                key={badge.name}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div 
                        className={`text-center p-4 rounded-lg border-2 transition-all cursor-help ${
                          isEarned
                            ? 'bg-amber-50 border-amber-300'
                            : 'bg-stone-100 border-stone-300'
                        }`}
                      >
                        <div className={`text-4xl mb-2 ${isEarned ? '' : 'opacity-30'}`}>
                          {badge.icon}
                        </div>
                        <div className={`text-xs font-semibold ${
                          isEarned ? 'text-amber-900' : 'text-stone-600'
                        }`}>
                          {badge.name}
                        </div>
                        <div className={`text-xs mt-1 ${
                          isEarned ? 'text-amber-700' : 'text-stone-500'
                        }`}>
                          {badge.minReviews}+ reviews
                        </div>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{badge.description}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </motion.div>
            );
          })}

          {/* The Duster badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div 
                    className={`text-center p-4 rounded-lg border-2 transition-all cursor-help ${
                      dusterEarned
                        ? 'bg-orange-50 border-orange-300'
                        : 'bg-stone-100 border-stone-300'
                    }`}
                  >
                    <div className={`text-4xl mb-2 ${dusterEarned ? '' : 'opacity-30'}`}>
                      {DUSTER_BADGE.icon}
                    </div>
                    <div className={`text-xs font-semibold ${
                      dusterEarned ? 'text-orange-900' : 'text-stone-600'
                    }`}>
                      {DUSTER_BADGE.name}
                    </div>
                    <div className={`text-xs mt-1 ${
                      dusterEarned ? 'text-orange-700' : 'text-stone-500'
                    }`}>
                      Low ratings
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{DUSTER_BADGE.description}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </motion.div>
            </div>
          </div>

          {/* Boot Challenge Badges */}
          <div>
            <h3 className="text-sm font-semibold text-stone-700 mb-3">Big Boots Challenge</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              {BOOT_BADGES.map((badge) => {
                const isEarned = bootVisitCount >= badge.minBoots;
                return (
                  <motion.div
                    key={badge.name}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                  >
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div 
                            className={`text-center p-4 rounded-lg border-2 transition-all cursor-help ${
                              isEarned
                                ? 'bg-amber-50 border-amber-300'
                                : 'bg-stone-100 border-stone-300'
                            }`}
                          >
                            <div className={`text-4xl mb-2 ${isEarned ? '' : 'opacity-30'}`}>
                              {badge.icon}
                            </div>
                            <div className={`text-xs font-semibold ${
                              isEarned ? 'text-amber-900' : 'text-stone-600'
                            }`}>
                              {badge.name}
                            </div>
                            <div className={`text-xs mt-1 ${
                              isEarned ? 'text-amber-700' : 'text-stone-500'
                            }`}>
                              {badge.minBoots}+ boots
                            </div>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{badge.description}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}