import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, Zap, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import BootRating from "./BootRating";

export default function SpinTheSpur({ favorites, venues, userRatings, user, onSignInRequired }) {
  const [spinning, setSpinning] = useState(false);
  const [spinType, setSpinType] = useState(null); // 'spur' or 'quickdraw'
  const [result, setResult] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const navigate = useNavigate();

  const handleSpinTheSpur = () => {
    if (!user) {
      onSignInRequired();
      return;
    }

    const favoriteVenues = venues.filter(v => 
      favorites.some(f => f.venue_id === v.id)
    );

    if (favoriteVenues.length === 0) {
      return;
    }

    setSpinType('spur');
    setSpinning(true);
    setResult(null);
    setShowResult(false);

    // Simulate spinning animation
    setTimeout(() => {
      const randomVenue = favoriteVenues[Math.floor(Math.random() * favoriteVenues.length)];
      setResult(randomVenue);
      setSpinning(false);
      setShowResult(true);
    }, 2000);
  };

  const handleQuickDraw = () => {
    if (!user) {
      onSignInRequired();
      return;
    }

    const ratedVenueIds = userRatings.map(r => r.venue_id);
    const untriedVenues = venues.filter(v => 
      !ratedVenueIds.includes(v.id) && (v.categories?.includes('restaurant') || v.category === 'restaurant')
    );

    if (untriedVenues.length === 0) {
      return;
    }

    setSpinType('quickdraw');
    setSpinning(true);
    setResult(null);
    setShowResult(false);

    // Simulate spinning animation
    setTimeout(() => {
      // Weight boosted venues 3x higher (if boost is still active)
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

  const favoriteCount = venues.filter(v => favorites.some(f => f.venue_id === v.id)).length;
  const ratedVenueIds = userRatings.map(r => r.venue_id);
  const untriedCount = venues.filter(v => !ratedVenueIds.includes(v.id) && (v.categories?.includes('restaurant') || v.category === 'restaurant')).length;

  return (
    <section className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Spin the Spur */}
        <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200 hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-800">
              <motion.div
                animate={{ rotate: spinning ? 360 : 0 }}
                transition={{ duration: 0.5, repeat: spinning ? Infinity : 0, ease: "linear" }}
              >
                <Sparkles className="w-5 h-5" />
              </motion.div>
              Spin the Spur
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-stone-600">
              Can't decide where to eat? Let fate choose from your favorites!
            </p>
            <Button 
              onClick={handleSpinTheSpur}
              disabled={spinning || favoriteCount === 0}
              className="w-full bg-amber-600 hover:bg-amber-700 text-white"
            >
              {spinning ? "Spinning..." : "Spin the Spur"}
            </Button>
            {favoriteCount === 0 && (
              <p className="text-xs text-amber-600">Add some favorites first!</p>
            )}
          </CardContent>
        </Card>

        {/* Quick Draw */}
        <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200 hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-800">
              <motion.div
                animate={{ rotate: spinning ? 360 : 0 }}
                transition={{ duration: 0.5, repeat: spinning ? Infinity : 0, ease: "linear" }}
              >
                <Zap className="w-5 h-5" />
              </motion.div>
              Quick Draw
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-stone-600">
              Feeling adventurous? Try a new restaurant you haven't rated yet!
            </p>
            <Button 
              onClick={handleQuickDraw}
              disabled={spinning || untriedCount === 0}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              {spinning ? "Drawing..." : "Quick Draw"}
            </Button>
            {untriedCount === 0 && (
              <p className="text-xs text-blue-600">You've tried all restaurants!</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Spinning Spur Animation */}
      <AnimatePresence>
        {spinning && spinType === 'spur' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
          >
            <div className="relative">
              <svg width="300" height="200" viewBox="0 0 300 200" className="drop-shadow-2xl">
                {/* Spur heel band (static) */}
                <ellipse cx="80" cy="100" rx="60" ry="35" fill="#78350f" stroke="#92400e" strokeWidth="4"/>
                <ellipse cx="80" cy="100" rx="50" ry="28" fill="#a0522d"/>
                
                {/* Decorative engravings on band */}
                <path d="M 50 95 Q 65 90 80 95 Q 95 90 110 95" stroke="#d97706" strokeWidth="2" fill="none"/>
                <path d="M 50 105 Q 65 110 80 105 Q 95 110 110 105" stroke="#d97706" strokeWidth="2" fill="none"/>
                
                {/* Spur shank (static arm) */}
                <path d="M 140 100 L 200 100" stroke="#78350f" strokeWidth="12" strokeLinecap="round"/>
                <path d="M 140 100 L 200 100" stroke="#a0522d" strokeWidth="8" strokeLinecap="round"/>
                
                {/* Rotating rowel */}
                <motion.g
                  animate={{ rotate: 360 }}
                  transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                  style={{ transformOrigin: "220px 100px" }}
                >
                  {/* Center hub */}
                  <circle cx="220" cy="100" r="18" fill="#fbbf24" stroke="#92400e" strokeWidth="3"/>
                  
                  {/* Rowel points */}
                  {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((angle) => {
                    const rad = (angle * Math.PI) / 180;
                    const x1 = 220 + Math.cos(rad) * 18;
                    const y1 = 100 + Math.sin(rad) * 18;
                    const x2 = 220 + Math.cos(rad) * 55;
                    const y2 = 100 + Math.sin(rad) * 55;
                    
                    return (
                      <g key={angle}>
                        <line 
                          x1={x1} y1={y1} 
                          x2={x2} y2={y2} 
                          stroke="#d97706" 
                          strokeWidth="4" 
                          strokeLinecap="round"
                        />
                        <circle cx={x2} cy={y2} r="5" fill="#fef3c7" stroke="#92400e" strokeWidth="2"/>
                      </g>
                    );
                  })}
                  
                  {/* Inner decorative circle */}
                  <circle cx="220" cy="100" r="10" fill="none" stroke="#92400e" strokeWidth="2"/>
                </motion.g>
              </svg>
              
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-8 text-amber-300 text-3xl font-bold text-center"
                style={{ fontFamily: 'Rye, serif' }}
              >
                Spinning the Spur...
              </motion.p>
              
              {/* Sparkle effects */}
              {[...Array(6)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute text-amber-400 text-2xl"
                  style={{
                    left: `${150 + Math.cos((i * 60 * Math.PI) / 180) * 120}px`,
                    top: `${-20 + Math.sin((i * 60 * Math.PI) / 180) * 80}px`,
                  }}
                  animate={{
                    scale: [0, 1, 0],
                    opacity: [0, 1, 0],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    delay: i * 0.2,
                  }}
                >
                  ✨
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quick Draw Bullet Animation */}
      <AnimatePresence>
        {spinning && spinType === 'quickdraw' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-gradient-to-br from-stone-900 via-amber-950 to-stone-900 flex items-center justify-center z-50"
          >
            <div className="relative">
              {/* Wooden board target */}
              <div className="relative w-96 h-96 bg-gradient-to-br from-amber-900 to-amber-950 rounded-lg border-8 border-amber-950 shadow-2xl">
                {/* Wood grain texture */}
                <div className="absolute inset-0 opacity-20">
                  {[...Array(10)].map((_, i) => (
                    <div key={i} className="h-10 border-b border-amber-800" style={{ marginTop: `${i * 38}px` }} />
                  ))}
                </div>
                
                {/* 3 Bullet holes with fast animations */}
                {[0, 1, 2].map((i) => {
                  const positions = [
                    { x: 150, y: 140 },
                    { x: 220, y: 190 },
                    { x: 120, y: 210 }
                  ];
                  
                  return (
                    <div key={i}>
                      {/* Muzzle flash */}
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
                      
                      {/* Bullet hole */}
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
                        {/* Main hole */}
                        <div className="w-10 h-10 bg-black rounded-full border-4 border-stone-900 shadow-2xl relative">
                          {/* Radial cracks */}
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
                        
                        {/* Wood splinters */}
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
                     <p className="text-stone-600 text-sm">{result.description}</p>
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
                    onClick={() => setShowResult(false)}
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
    </section>
  );
}