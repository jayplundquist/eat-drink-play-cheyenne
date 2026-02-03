import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import VenueCard from "./VenueCard";

export default function SuperBowlVenues({ venues, favorites, user, onToggleFavorite }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Filter venues that broadcast Super Bowl and aren't permanently closed
  const superBowlVenues = venues.filter(v => v.broadcasts_superbowl && !v.permanently_closed);

  useEffect(() => {
    if (superBowlVenues.length > 0) {
      const interval = setInterval(() => {
        setCurrentIndex(prev => (prev + 1) % superBowlVenues.length);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [superBowlVenues.length]);

  if (superBowlVenues.length === 0) return null;

  const currentVenue = superBowlVenues[currentIndex];

  const isFavorite = (venueId) => {
    if (!user) return false;
    return favorites.some(f => f.venue_id === venueId && f.user_email === user.email);
  };

  return (
    <section className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
      <div className="relative bg-gradient-to-b from-green-700 to-green-800 rounded-xl p-8 md:p-12 overflow-hidden">
        {/* Yard markers background */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className="absolute top-0 bottom-0 border-l border-green-600/40"
              style={{ left: `${i * 8.33}%` }}
            />
          ))}
        </div>

        {/* Content */}
        <div className="relative z-10">
          <div className="grid md:grid-cols-2 gap-8 items-start">
            {/* Left side - Title and description */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <span className="text-5xl">🏈</span>
                <h2 className="text-4xl md:text-5xl font-bold text-white" style={{ fontFamily: 'Rye, serif' }}>
                  SUPER BOWL<br />WATCH<br />PARTIES
                </h2>
              </div>
              <p className="text-white text-lg md:text-xl font-serif leading-relaxed">
                Cheyenne's best spots to catch the big game. Come celebrate with fellow fans!
              </p>
            </div>

            {/* Right side - Venue card carousel */}
            <div className="flex flex-col items-center">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentIndex}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className="w-full"
                >
                  <VenueCard
                    venue={currentVenue}
                    isFavorite={isFavorite(currentVenue.id)}
                    onToggleFavorite={() => onToggleFavorite(currentVenue.id)}
                  />
                </motion.div>
              </AnimatePresence>

              {/* Navigation buttons */}
              {superBowlVenues.length > 1 && (
                <div className="flex gap-3 mt-6">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentIndex(prev => (prev - 1 + superBowlVenues.length) % superBowlVenues.length)}
                    className="border-white text-white hover:bg-white/10"
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Previous
                  </Button>
                  <span className="text-white text-sm font-medium flex items-center px-3">
                    {currentIndex + 1} / {superBowlVenues.length}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentIndex(prev => (prev + 1) % superBowlVenues.length)}
                    className="border-white text-white hover:bg-white/10"
                  >
                    Next
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}