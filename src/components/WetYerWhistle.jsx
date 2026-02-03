import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import BootRating from "./BootRating";

export default function WetYerWhistle({ venues, user, onSignInRequired, wetYerWhistleCategories = ['bar', 'brewery', 'coffee_shop', 'winery'] }) {
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const navigate = useNavigate();

  const handleWetYerWhistle = () => {
    if (!user) {
      onSignInRequired();
      return;
    }

    // Filter for drink categories
    const drinkVenues = venues.filter(v => {
      const categories = v.categories || (v.category ? [v.category] : []);
      return categories.some(cat => wetYerWhistleCategories.includes(cat));
    });

    if (drinkVenues.length === 0) {
      return;
    }

    setSpinning(true);
    setResult(null);
    setShowResult(false);

    // Simulate spinning animation
    setTimeout(() => {
      const randomVenue = drinkVenues[Math.floor(Math.random() * drinkVenues.length)];
      setResult(randomVenue);
      setSpinning(false);
      setShowResult(true);
    }, 2500);
  };

  const drinkVenueCount = venues.filter(v => {
    const categories = v.categories || (v.category ? [v.category] : []);
    return categories.some(cat => wetYerWhistleCategories.includes(cat));
  }).length;

  return (
    <section className="max-w-6xl mx-auto px-4 sm:px-6 py-4">
      <Card className="bg-gradient-to-br from-rose-50 to-pink-50 border-rose-200 hover:shadow-lg transition-shadow">
        <CardContent className="space-y-3 pt-6">
          <p className="text-sm text-stone-600">
            Thirsty? Let us pick the perfect spot to wet yer whistle!
          </p>
          <Button 
            onClick={handleWetYerWhistle}
            disabled={spinning || drinkVenueCount === 0}
            className="w-full bg-rose-600 hover:bg-rose-700 text-white"
          >
            {spinning ? "Pouring..." : "Wet Yer Whistle"}
          </Button>
          {drinkVenueCount === 0 && (
            <p className="text-xs text-rose-600">No drink spots available!</p>
          )}
        </CardContent>
      </Card>

      {/* Tipping Shot Glass Animation */}
      <AnimatePresence>
        {spinning && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-gradient-to-br from-amber-950 via-rose-950 to-stone-950 flex items-center justify-center z-50"
          >
            <div className="relative">
              {/* Shot Glass SVG */}
              <svg width="300" height="300" viewBox="0 0 300 300" className="drop-shadow-2xl">
                {/* Glass (with tipping animation) */}
                <motion.g
                  animate={{ 
                    rotate: [0, 0, 60, 60],
                    x: [0, 0, 40, 40],
                    y: [0, 0, -20, -20]
                  }}
                  transition={{ 
                    duration: 2.5,
                    times: [0, 0.4, 0.7, 1],
                    ease: "easeInOut"
                  }}
                  style={{ transformOrigin: "150px 200px" }}
                >
                  {/* Thick rim at top */}
                  <ellipse
                    cx="150"
                    cy="155"
                    rx="45"
                    ry="7"
                    fill="#1e293b"
                    stroke="#0f172a"
                    strokeWidth="2"
                  />
                  
                  {/* Glass outer body */}
                  <path
                    d="M 105 155 L 125 235 L 175 235 L 195 155 Z"
                    fill="none"
                    stroke="#1e293b"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  
                  {/* Rounded bottom base */}
                  <path
                    d="M 125 235 Q 150 245 175 235"
                    fill="none"
                    stroke="#1e293b"
                    strokeWidth="4"
                    strokeLinecap="round"
                  />
                  
                  {/* Bottom ellipse */}
                  <ellipse
                    cx="150"
                    cy="235"
                    rx="25"
                    ry="5"
                    fill="#cbd5e1"
                    stroke="#1e293b"
                    strokeWidth="2"
                  />
                  
                  {/* Glass inner transparency effect */}
                  <path
                    d="M 109 160 L 127 232 L 173 232 L 191 160"
                    fill="url(#glassGradient)"
                    opacity="0.15"
                  />
                  
                  {/* Liquid inside (dark amber/whiskey) - animates out */}
                  <motion.path
                    d="M 115 195 L 130 230 L 170 230 L 185 195 Z"
                    fill="#1e293b"
                    opacity="1"
                    animate={{
                      opacity: [1, 1, 0, 0],
                      scaleY: [1, 1, 0.2, 0]
                    }}
                    transition={{
                      duration: 2.5,
                      times: [0, 0.4, 0.8, 1],
                      ease: "easeOut"
                    }}
                    style={{ transformOrigin: "150px 230px" }}
                  />
                  
                  {/* Liquid highlight */}
                  <motion.ellipse
                    cx="135"
                    cy="200"
                    rx="12"
                    ry="18"
                    fill="url(#liquidShine)"
                    opacity="0.4"
                    animate={{
                      opacity: [0.4, 0.4, 0, 0]
                    }}
                    transition={{
                      duration: 2.5,
                      times: [0, 0.4, 0.8, 1]
                    }}
                  />
                </motion.g>

                {/* Liquid splash/pour effect */}
                <motion.g
                  animate={{
                    opacity: [0, 0, 1, 0.5, 0],
                    scale: [0, 0, 1, 1.5, 2],
                    x: [0, 0, 60, 80, 100],
                    y: [0, 0, 20, 40, 60]
                  }}
                  transition={{
                    duration: 2.5,
                    times: [0, 0.5, 0.7, 0.85, 1],
                    ease: "easeOut"
                  }}
                  style={{ transformOrigin: "190px 160px" }}
                >
                  {/* Liquid droplets */}
                  {[0, 1, 2, 3, 4].map((i) => (
                    <motion.circle
                      key={i}
                      cx={190 + i * 15}
                      cy={160 + i * 8}
                      r={8 - i}
                      fill="#d97706"
                      opacity="0.7"
                      animate={{
                        y: [0, (i + 1) * 30],
                        opacity: [0.7, 0]
                      }}
                      transition={{
                        duration: 1,
                        delay: 1.2 + i * 0.1,
                        ease: "easeIn"
                      }}
                    />
                  ))}
                </motion.g>

                {/* SVG Gradients */}
                <defs>
                  <linearGradient id="glassGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#e2e8f0" stopOpacity="0.3" />
                    <stop offset="50%" stopColor="#f8fafc" stopOpacity="0.5" />
                    <stop offset="100%" stopColor="#e2e8f0" stopOpacity="0.3" />
                  </linearGradient>
                  <linearGradient id="liquidShine" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="#d97706" stopOpacity="0.2" />
                  </linearGradient>
                </defs>
              </svg>
              
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-8 text-amber-300 text-3xl font-bold text-center"
                style={{ fontFamily: 'Rye, serif' }}
              >
                Wet Yer Whistle...
              </motion.p>
              
              {/* Sparkle effects */}
              {[...Array(8)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute text-rose-400 text-xl"
                  style={{
                    left: `${150 + Math.cos((i * 45 * Math.PI) / 180) * 100}px`,
                    top: `${50 + Math.sin((i * 45 * Math.PI) / 180) * 100}px`,
                  }}
                  animate={{
                    scale: [0, 1, 0],
                    opacity: [0, 1, 0],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    delay: i * 0.15,
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
                  <div className="text-4xl">🍺</div>
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
                    className="flex-1 bg-rose-600 hover:bg-rose-700 text-white"
                  >
                    View Details
                  </Button>
                  <Button
                    onClick={() => {
                      setShowResult(false);
                      handleWetYerWhistle();
                    }}
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