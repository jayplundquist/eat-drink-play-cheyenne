import React, { useState, useEffect } from 'react';
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

export default function BadgeCollection({ reviewCount = 0, avgRating = 0, bootVisitCount = 0, userEmail = null }) {
  const [commentCount, setCommentCount] = useState(0);

  const { data: allBadges = [] } = useQuery({
    queryKey: ['badges'],
    queryFn: () => base44.entities.Badge.list(),
  });

  const { data: userComments = [] } = useQuery({
    queryKey: ['userComments', userEmail],
    queryFn: () => userEmail ? base44.entities.ReviewComment.filter({ user_email: userEmail }) : [],
    enabled: !!userEmail,
  });

  useEffect(() => {
    setCommentCount(userComments.length);
  }, [userComments]);

  const reviewBadges = allBadges.filter(b => b.type === 'review').sort((a, b) => a.min_count - b.min_count);
  const bootBadges = allBadges.filter(b => b.type === 'boot').sort((a, b) => a.min_count - b.min_count);
  
  const strongSilentTypeEarned = reviewCount >= 10 && commentCount === 0;

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
                              {badge.icon_url ? (
                                <img src={badge.icon_url} alt={badge.name} className="w-10 h-10 mx-auto" />
                              ) : (
                                '🎖️'
                              )}
                            </div>
                            <div className={`text-xs font-semibold ${
                              isEarned ? 'text-amber-900' : 'text-stone-600'
                            }`}>
                              {badge.name}
                            </div>
                            <div className={`text-xs mt-1 ${
                              isEarned ? 'text-amber-700' : 'text-stone-500'
                            }`}>
                              {badge.min_count}+ reviews
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

            {/* The Strong Silent Type Badge */}
            <motion.div
             initial={{ opacity: 0, scale: 0.8 }}
             animate={{ opacity: 1, scale: 1 }}
            >
             <TooltipProvider>
               <Tooltip>
                 <TooltipTrigger asChild>
                   <div 
                     className={`text-center p-4 rounded-lg border-2 transition-all cursor-help ${
                       strongSilentTypeEarned
                         ? 'bg-slate-50 border-slate-400'
                         : 'bg-stone-100 border-stone-300'
                     }`}
                   >
                     <div className={`text-4xl mb-2 ${strongSilentTypeEarned ? '' : 'opacity-30'}`}>
                       🤐
                     </div>
                     <div className={`text-xs font-semibold ${
                       strongSilentTypeEarned ? 'text-slate-900' : 'text-stone-600'
                     }`}>
                       The Strong Silent Type
                     </div>
                     <div className={`text-xs mt-1 ${
                       strongSilentTypeEarned ? 'text-slate-700' : 'text-stone-500'
                     }`}>
                       10+ reviews
                     </div>
                   </div>
                 </TooltipTrigger>
                 <TooltipContent>
                   <p>Written 10+ reviews but never commented on others</p>
                 </TooltipContent>
               </Tooltip>
             </TooltipProvider>
            </motion.div>

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
                              {badge.icon_url ? (
                                <img src={badge.icon_url} alt={badge.name} className="w-10 h-10 mx-auto" />
                              ) : (
                                '🎖️'
                              )}
                            </div>
                            <div className={`text-xs font-semibold ${
                              isEarned ? 'text-amber-900' : 'text-stone-600'
                            }`}>
                              {badge.name}
                            </div>
                            <div className={`text-xs mt-1 ${
                              isEarned ? 'text-amber-700' : 'text-stone-500'
                            }`}>
                              {badge.min_count}+ boots
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