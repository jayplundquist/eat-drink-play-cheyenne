import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

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
                {reviewBadges.map((badge) => {
                  const isEarned = reviewCount >= badge.min_count;
                  return (
                    <motion.div
                      key={badge.id}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                    >
                      <div 
                        className={`text-center p-2 transition-all ${
                          isEarned ? '' : 'opacity-40 grayscale'
                        }`}
                      >
                        {badge.icon_url && (
                          <img 
                            src={badge.icon_url} 
                            alt={badge.name} 
                            className="w-full h-auto rounded-lg shadow-md"
                          />
                        )}
                        <div className={`text-xs font-semibold mt-2 ${
                          isEarned ? 'text-amber-900' : 'text-stone-600'
                        }`}>
                          {badge.name}
                        </div>
                        <div className={`text-xs mt-1 ${
                          isEarned ? 'text-amber-700' : 'text-stone-500'
                        }`}>
                          {badge.description}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}

                {/* The Strong Silent Type Badge */}
                {strongSilentTypeBadge && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  <div 
                    className={`text-center p-2 transition-all ${
                      strongSilentTypeEarned ? '' : 'opacity-40 grayscale'
                    }`}
                  >
                    {strongSilentTypeBadge.icon_url && (
                      <img 
                        src={strongSilentTypeBadge.icon_url} 
                        alt={strongSilentTypeBadge.name} 
                        className="w-full h-auto rounded-lg shadow-md"
                      />
                    )}
                    <div className={`text-xs font-semibold mt-2 ${
                      strongSilentTypeEarned ? 'text-slate-900' : 'text-stone-600'
                    }`}>
                      {strongSilentTypeBadge.name}
                    </div>
                    <div className={`text-xs mt-1 ${
                      strongSilentTypeEarned ? 'text-slate-700' : 'text-stone-500'
                    }`}>
                      {strongSilentTypeBadge.description}
                    </div>
                  </div>
                </motion.div>
                )}

                {/* The Duster Badge */}
                {dusterBadge && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  <div 
                    className={`text-center p-2 transition-all ${
                      dusterEarned ? '' : 'opacity-40 grayscale'
                    }`}
                  >
                    {dusterBadge.icon_url && (
                      <img 
                        src={dusterBadge.icon_url} 
                        alt={dusterBadge.name} 
                        className="w-full h-auto rounded-lg shadow-md"
                      />
                    )}
                    <div className={`text-xs font-semibold mt-2 ${
                      dusterEarned ? 'text-amber-900' : 'text-stone-600'
                    }`}>
                      {dusterBadge.name}
                    </div>
                    <div className={`text-xs mt-1 ${
                      dusterEarned ? 'text-amber-800' : 'text-stone-500'
                    }`}>
                      {dusterBadge.description}
                    </div>
                  </div>
                </motion.div>
                )}
              </div>
              </div>

           {/* Boot Challenge Badges */}
          <div>
            <h3 className="text-sm font-semibold text-stone-700 mb-3">Big Boots Challenge</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              {bootBadges.map((badge) => {
                const isEarned = bootVisitCount >= badge.min_count;
                return (
                  <motion.div
                    key={badge.name}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                  >
                    <div 
                      className={`text-center p-2 transition-all ${
                        isEarned ? '' : 'opacity-40 grayscale'
                      }`}
                    >
                      {badge.icon_url && (
                        <img 
                          src={badge.icon_url} 
                          alt={badge.name} 
                          className="w-full h-auto rounded-lg shadow-md"
                        />
                      )}
                      <div className={`text-xs font-semibold mt-2 ${
                        isEarned ? 'text-amber-900' : 'text-stone-600'
                      }`}>
                        {badge.name}
                      </div>
                      <div className={`text-xs mt-1 ${
                        isEarned ? 'text-amber-700' : 'text-stone-500'
                      }`}>
                        {badge.description}
                      </div>
                    </div>
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