import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import BootRating from "./BootRating";

export default function QuickDraw({ venues, userRatings, user, onSignInRequired, quickDrawCategories = ['restaurant'] }) {
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const navigate = useNavigate();

  const handleQuickDraw = () => {
    if (!user) {
      onSignInRequired();
      return;
    }

    const ratedVenueIds = userRatings.map(r => r.venue_id);
    const untriedVenues = venues.filter(v => {
      if (ratedVenueIds.includes(v.id)) return false;
      const venueCategories = v.categories || (v.category ? [v.category] : []);
      return venueCategories.some(cat => quickDrawCategories.includes(cat));
    });

    if (untriedVenues.length === 0) {
      return;
    }

    setSpinning(true);
    setResult(null);
    setShowResult(false);

    setTimeout(() => {
      const now = new Date();
      const weights = untriedVenues.map(v => {
        const isBoosted = v.quick_draw_boost && v.boost_expires_date && new Date(v.boost_expires_date) > now;
        return isBoosted ? 3 : 1;
      });
      const totalWeight = weights.reduce((a, b) => a + b, 0);

      let random = Math.random() * totalWeight;
      let selectedVenue = untriedVenues[0];

      for (let i = 0; i < untriedVenues.length; i++) {
        random -= weights[i];
        if (random <= 0) {
          selectedVenue = untriedVenues[i];
          break;
        }
      }

      setResult(selectedVenue);
      setSpinning(false);
      setShowResult(true);
    }, 2000);
  };

  const ratedVenueIds = userRatings.map(r => r.venue_id);
  const untriedCount = venues.filter(v => {
    if (ratedVenueIds.includes(v.id)) return false;
    const venueCategories = v.categories || (v.category ? [v.category] : []);
    return venueCategories.some(cat => quickDrawCategories.includes(cat));
  }).length;

  return (
    <div className="w-full h-full flex flex-col items-center justify-center">
      <div className="text-center space-y-3">
        <p className="text-sm text-stone-600">
          Discover a new favorite
        </p>
        <Button 
          onClick={handleQuickDraw}
          disabled={spinning || untriedCount === 0}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white"
        >
          {spinning ? "Drawing..." : "Quick Draw"}
        </Button>
        {untriedCount === 0 && (
          <p className="text-xs text-blue-600">You've tried them all!</p>
        )}
      </div>

      {/* Quick Draw Bullet Animation */}
      <AnimatePresence>
        {spinning && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-gradient-to-br from-stone-900 via-amber-950 to-stone-900 flex items-center justify-center z-50"
          >
            <div className="relative">
              <div className="relative w-96 h-96 bg-gradient-to-br from-amber-900 to-amber-950 rounded-lg border-8 border-amber-950 shadow-2xl">
                <div className="absolute inset-0 opacity-20">
                  {[...Array(10)].map((_, i) => (
                    <div key={i} className="h-10 border-b border-amber-800" style={{ marginTop: `${i * 38}px` }} />
                  ))}
                </div>
                
                {[0, 1, 2].map((i) => {
                  const positions = [
                    { x: 150, y: 140 },
                    { x: 220, y: 190 },
                    { x: 120, y: 210 }
                  ];
                  
                  return (
                    <div key={i}>
                      <motion.div
                        className="absolute"
                        style={{
                          left: `${positions[i].x}px`,
                          top: `${positions[i].y}px`,
                          transform: 'translate(-50%, -50%)',
                        }}
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ 
                          scale: [0, 4, 0],
                          opacity: [0, 1, 0],
                        }}
                        transition={{
                          duration: 0.2,
                          delay: i * 0.3,
                          repeat: Infinity,
                          repeatDelay: 2.1,
                        }}
                      >
                        <div className="w-20 h-20 bg-yellow-400 rounded-full blur-xl" />
                      </motion.div>
                      
                      <motion.div
                        className="absolute"
                        style={{
                          left: `${positions[i].x}px`,
                          top: `${positions[i].y}px`,
                          transform: 'translate(-50%, -50%)',
                        }}
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ 
                          scale: [0, 1.3, 1],
                          opacity: [0, 1, 1],
                        }}
                        transition={{
                          duration: 0.15,
                          delay: i * 0.3 + 0.1,
                          repeat: Infinity,
                          repeatDelay: 2.1,
                        }}
                      >
                        <div className="w-10 h-10 bg-black rounded-full border-4 border-stone-900 shadow-2xl relative">
                          <div className="absolute inset-0">
                            {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
                              <div
                                key={angle}
                                className="absolute w-0.5 h-5 bg-stone-900 origin-bottom"
                                style={{
                                  left: '50%',
                                  bottom: '50%',
                                  transform: `rotate(${angle}deg) translateX(-50%)`,
                                }}
                              />
                            ))}
                          </div>
                        </div>
                        
                        {[0, 60, 120, 180, 240, 300].map((angle) => {
                          const rad = (angle * Math.PI) / 180;
                          return (
                            <motion.div
                              key={angle}
                              className="absolute w-1.5 h-4 bg-amber-800 rounded-sm"
                              style={{
                                left: `${Math.cos(rad) * 25}px`,
                                top: `${Math.sin(rad) * 25}px`,
                                rotate: `${angle + 90}deg`,
                              }}
                              initial={{ scale: 0, opacity: 0 }}
                              animate={{ 
                                scale: [0, 1, 0.8],
                                opacity: [0, 1, 0.6],
                              }}
                              transition={{
                                duration: 0.2,
                                delay: i * 0.3 + 0.15,
                                repeat: Infinity,
                                repeatDelay: 2.1,
                              }}
                            />
                          );
                        })}
                      </motion.div>
                    </div>
                  );
                })}
              </div>
              
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-8 text-amber-300 text-3xl font-bold text-center"
                style={{ fontFamily: 'Rye, serif' }}
              >
                Quick Draw!
              </motion.p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Result Modal */}
      <AnimatePresence>
        {showResult && result && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowResult(false)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative">
                {result.image_url && (
                  <img 
                    src={result.image_url} 
                    alt={result.name}
                    className="w-full h-48 object-cover"
                  />
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 bg-white/90 hover:bg-white"
                  onClick={() => setShowResult(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="p-6 text-center space-y-4">
                <div className="space-y-3">
                  <div className="text-4xl">🎯</div>
                  <h3 className="text-2xl font-bold text-stone-800">
                    {result.name}
                  </h3>
                  {result.description && (
                    <p className="text-stone-600 text-sm">
                      {result.description.length > 250 ? result.description.substring(0, 250) + '...' : result.description}
                    </p>
                  )}
                  <div className="flex justify-center">
                    <BootRating rating={Math.round(result.rating_count > 0 ? result.rating_sum / result.rating_count : 0)} showCount count={result.rating_count || 0} />
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <Button
                    onClick={() => {
                      setShowResult(false);
                      navigate(createPageUrl(`VenueDetails?id=${result.id}`));
                    }}
                    className="flex-1 bg-amber-600 hover:bg-amber-700 text-white"
                  >
                    View Details
                  </Button>
                  <Button
                    onClick={handleQuickDraw}
                    variant="outline"
                    className="flex-1"
                  >
                    Try Again
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}