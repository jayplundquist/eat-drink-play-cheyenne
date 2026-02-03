import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import BootRating from "./BootRating";

export default function SpinTheSpur({ favorites, venues, user, onSignInRequired }) {
  const [spinning, setSpinning] = useState(false);
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

    setSpinning(true);
    setResult(null);
    setShowResult(false);

    setTimeout(() => {
      const randomVenue = favoriteVenues[Math.floor(Math.random() * favoriteVenues.length)];
      setResult(randomVenue);
      setSpinning(false);
      setShowResult(true);
    }, 2000);
  };

  const favoriteCount = venues.filter(v => favorites.some(f => f.venue_id === v.id)).length;

  return (
    <div className="w-full h-full flex flex-col items-center justify-center">
      <div className="text-center space-y-3">
        <p className="text-sm text-stone-600">
          Pick from your favorites!
        </p>
        <Button 
          onClick={handleSpinTheSpur}
          disabled={spinning || favoriteCount === 0}
          className="w-full bg-amber-600 hover:bg-amber-700 text-white"
        >
          {spinning ? "Spinning..." : "Spin the Spur"}
        </Button>
        {favoriteCount === 0 && (
          <p className="text-xs text-amber-600">Add favorites first!</p>
        )}
      </div>

      {/* Spinning Spur Animation */}
      <AnimatePresence>
        {spinning && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
          >
            <div className="relative">
              <svg width="300" height="200" viewBox="0 0 300 200" className="drop-shadow-2xl">
                <ellipse cx="80" cy="100" rx="60" ry="35" fill="#78350f" stroke="#92400e" strokeWidth="4"/>
                <ellipse cx="80" cy="100" rx="50" ry="28" fill="#a0522d"/>
                <path d="M 50 95 Q 65 90 80 95 Q 95 90 110 95" stroke="#d97706" strokeWidth="2" fill="none"/>
                <path d="M 50 105 Q 65 110 80 105 Q 95 110 110 105" stroke="#d97706" strokeWidth="2" fill="none"/>
                <path d="M 140 100 L 200 100" stroke="#78350f" strokeWidth="12" strokeLinecap="round"/>
                <path d="M 140 100 L 200 100" stroke="#a0522d" strokeWidth="8" strokeLinecap="round"/>
                
                <motion.g
                  animate={{ rotate: 360 }}
                  transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                  style={{ transformOrigin: "220px 100px" }}
                >
                  <circle cx="220" cy="100" r="18" fill="#fbbf24" stroke="#92400e" strokeWidth="3"/>
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
                    onClick={handleSpinTheSpur}
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