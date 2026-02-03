import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import VenueCard from "./VenueCard";

export default function QuickDraw({ venues, user, onSignInRequired, quickDrawCategories }) {
  const [spinning, setSpinning] = useState(false);
  const [selectedVenue, setSelectedVenue] = useState(null);
  const [sparkles, setSparkles] = useState([]);

  const handleQuickDraw = () => {
    if (!user) {
      onSignInRequired();
      return;
    }

    const eligibleVenues = venues.filter(v => 
      v.categories?.some(cat => quickDrawCategories.includes(cat)) &&
      v.categories?.[0] !== 'closed'
    );

    if (eligibleVenues.length === 0) {
      alert('No venues available for Quick Draw');
      return;
    }

    setSpinning(true);
    setSparkles(Array(10).fill(0).map((_, i) => ({ id: i, x: Math.random() * 100, y: Math.random() * 100 })));

    setTimeout(() => {
      const randomVenue = eligibleVenues[Math.floor(Math.random() * eligibleVenues.length)];
      setSelectedVenue(randomVenue);
      setSpinning(false);
      setSparkles([]);
    }, 2000);
  };

  if (!venues || venues.length === 0) {
    return (
      <div className="text-center w-full">
        <p className="text-sm text-stone-500">Loading Quick Draw...</p>
      </div>
    );
  }

  const untried = venues.filter(v => 
    v.categories?.some(cat => quickDrawCategories.includes(cat))
  );

  return (
    <div className="w-full flex flex-col items-center justify-center h-full">
      <AnimatePresence>
        {spinning && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <div className="relative">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 0.8, repeat: Infinity }}
                className="w-16 h-16 rounded-full border-4 border-amber-200 border-t-amber-600"
              />
              {sparkles.map(sparkle => (
                <motion.div
                  key={sparkle.id}
                  animate={{ x: sparkle.x * 2 - 50, y: sparkle.y * 2 - 50, opacity: 0 }}
                  transition={{ duration: 1.5 }}
                  className="absolute w-2 h-2 bg-amber-400 rounded-full"
                  style={{ left: '50%', top: '50%' }}
                >
                  ✨
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!selectedVenue ? (
        <div className="text-center w-full">
          <Sparkles className="w-8 h-8 text-amber-600 mx-auto mb-2" />
          <h3 className="font-bold text-stone-800 mb-1 text-sm">Quick Draw</h3>
          <p className="text-xs text-stone-500 mb-3">Try a new restaurant</p>
          <Button
            onClick={handleQuickDraw}
            disabled={spinning || untried.length === 0}
            size="sm"
            className="bg-amber-600 hover:bg-amber-700 text-white w-full"
          >
            {spinning ? 'Spinning...' : `Draw (${untried.length})`}
          </Button>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center w-full space-y-3"
        >
          <div className="text-3xl mb-2">🎯</div>
          <h3 className="font-bold text-stone-800">{selectedVenue.name}</h3>
          <div className="flex gap-2 justify-center">
            <Link to={createPageUrl(`VenueDetails?id=${selectedVenue.id}`)}>
              <Button size="sm" className="bg-amber-600 hover:bg-amber-700 text-white">
                See Details
              </Button>
            </Link>
            <Button
              onClick={handleQuickDraw}
              size="sm"
              variant="outline"
              className="border-amber-300 text-amber-700 hover:bg-amber-50"
            >
              Try Again
            </Button>
          </div>
        </motion.div>
      )}
    </div>
  );
}