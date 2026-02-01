import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, Zap, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

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
      !ratedVenueIds.includes(v.id) && v.category === 'restaurant'
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
      const randomVenue = untriedVenues[Math.floor(Math.random() * untriedVenues.length)];
      setResult(randomVenue);
      setSpinning(false);
      setShowResult(true);
    }, 2000);
  };

  const favoriteCount = venues.filter(v => favorites.some(f => f.venue_id === v.id)).length;
  const ratedVenueIds = userRatings.map(r => r.venue_id);
  const untriedCount = venues.filter(v => !ratedVenueIds.includes(v.id) && v.category === 'restaurant').length;

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
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
          >
            <motion.div className="relative">
              {/* Spinning rowel (the wheel part) */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="relative"
              >
                <svg width="200" height="200" viewBox="0 0 200 200" fill="none">
                  {/* Center circle */}
                  <circle cx="100" cy="100" r="20" fill="#fbbf24" stroke="#92400e" strokeWidth="3"/>
                  
                  {/* Rowel spikes - 12 points like a real spur */}
                  {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((angle, i) => {
                    const rad = (angle * Math.PI) / 180;
                    const x1 = 100 + Math.cos(rad) * 20;
                    const y1 = 100 + Math.sin(rad) * 20;
                    const x2 = 100 + Math.cos(rad) * 70;
                    const y2 = 100 + Math.sin(rad) * 70;
                    const x3 = 100 + Math.cos(rad) * 75;
                    const y3 = 100 + Math.sin(rad) * 75;
                    
                    return (
                      <g key={i}>
                        <line 
                          x1={x1} y1={y1} 
                          x2={x2} y2={y2} 
                          stroke="#d97706" 
                          strokeWidth="3" 
                          strokeLinecap="round"
                        />
                        <circle cx={x3} cy={y3} r="4" fill="#fbbf24" stroke="#92400e" strokeWidth="2"/>
                      </g>
                    );
                  })}
                  
                  {/* Decorative inner ring */}
                  <circle cx="100" cy="100" r="12" fill="none" stroke="#92400e" strokeWidth="2" strokeDasharray="2 2"/>
                </svg>
              </motion.div>
              
              {/* Static spur strap/heel band */}
              <div className="absolute top-1/2 -translate-y-1/2 -left-32">
                <svg width="100" height="80" viewBox="0 0 100 80" fill="none">
                  <ellipse cx="50" cy="40" rx="45" ry="25" fill="#92400e" opacity="0.9"/>
                  <ellipse cx="50" cy="40" rx="38" ry="20" fill="#78350f"/>
                  {/* Decorative engraving lines */}
                  <path d="M 30 35 Q 40 30 50 35" stroke="#d97706" strokeWidth="1.5" fill="none"/>
                  <path d="M 50 35 Q 60 30 70 35" stroke="#d97706" strokeWidth="1.5" fill="none"/>
                  <circle cx="50" cy="40" r="3" fill="#fbbf24"/>
                </svg>
              </div>
            </motion.div>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute bottom-1/3 text-white text-2xl font-bold"
              style={{ fontFamily: 'Rye, serif' }}
            >
              Spinning the Spur...
            </motion.p>
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
            className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 overflow-hidden"
          >
            {/* Bullet shots */}
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ 
                  x: '50vw', 
                  y: '50vh',
                  scale: 0,
                  rotate: Math.random() * 360
                }}
                animate={{ 
                  x: `${20 + Math.random() * 60}vw`,
                  y: `${20 + Math.random() * 60}vh`,
                  scale: [0, 1.5, 1],
                  rotate: Math.random() * 360
                }}
                transition={{
                  duration: 0.6,
                  delay: i * 0.15,
                  repeat: Infinity,
                  repeatDelay: 0.4
                }}
                className="absolute"
              >
                <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                  {/* Bullet */}
                  <ellipse cx="20" cy="20" rx="4" ry="8" fill="#fbbf24" stroke="#f59e0b" strokeWidth="1"/>
                  {/* Flash */}
                  <motion.g
                    animate={{ opacity: [1, 0.3, 1] }}
                    transition={{ duration: 0.2, repeat: Infinity }}
                  >
                    <path d="M 20 12 L 22 17 L 18 17 Z" fill="#fef3c7"/>
                    <path d="M 20 28 L 22 23 L 18 23 Z" fill="#fef3c7"/>
                    <path d="M 12 20 L 17 22 L 17 18 Z" fill="#fef3c7"/>
                    <path d="M 28 20 L 23 22 L 23 18 Z" fill="#fef3c7"/>
                  </motion.g>
                </svg>
              </motion.div>
            ))}
            
            {/* Center text */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 0.5, repeat: Infinity }}
              className="text-center z-10"
            >
              <p className="text-white text-3xl font-bold mb-2">💥 BANG! 💥</p>
              <p className="text-yellow-300 text-xl font-semibold">Drawing...</p>
            </motion.div>
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
                <div className="space-y-2">
                  <div className="text-4xl">🎯</div>
                  <h3 className="text-2xl font-bold text-stone-800">
                    {result.name}
                  </h3>
                  {result.address && (
                    <p className="text-stone-600 text-sm">{result.address}</p>
                  )}
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