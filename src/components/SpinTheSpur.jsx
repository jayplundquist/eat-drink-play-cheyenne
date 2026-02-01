import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, Zap, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function SpinTheSpur({ favorites, venues, userRatings, user, onSignInRequired }) {
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