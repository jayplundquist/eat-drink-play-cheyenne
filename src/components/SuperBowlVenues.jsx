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
      {/* Super Bowl venues carousel on top */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-6">
          <h2 className="text-3xl font-bold text-blue-900" style={{ fontFamily: 'Rye, serif' }}>Super Bowl Watch Parties</h2>
          <span className="text-blue-700 text-sm ml-2">Catch the big game here 🏈</span>
        </div>

        <div className="relative bg-gradient-to-b from-green-600 to-green-700 rounded-lg p-8 mb-8">
          {/* Yard markers */}
          <div className="absolute inset-0 overflow-hidden rounded-lg">
            {[...Array(11)].map((_, i) => (
              <div
                key={i}
                className="absolute top-0 bottom-0 border-l border-white/30"
                style={{ left: `${(i + 1) * 9.09}%` }}
              />
            ))}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent" />
          </div>

          <div className="relative flex items-center justify-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentIndex(prev => (prev - 1 + superBowlVenues.length) % superBowlVenues.length)}
            className="border-blue-300 text-blue-600 hover:bg-blue-50"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>

          <div className="relative w-80 h-80 flex-shrink-0">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentIndex}
                initial={{ opacity: 0, x: 100 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -100 }}
                transition={{ duration: 0.3 }}
                className="absolute inset-0"
              >
                <VenueCard
                  venue={currentVenue}
                  isFavorite={isFavorite(currentVenue.id)}
                  onToggleFavorite={() => onToggleFavorite(currentVenue.id)}
                />
              </motion.div>
            </AnimatePresence>
          </div>

          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentIndex(prev => (prev + 1) % superBowlVenues.length)}
            className="border-blue-300 text-blue-600 hover:bg-blue-50"
          >
            <ChevronRight className="w-5 h-5" />
          </Button>

          {/* Football emoji */}
          <span className="absolute top-4 right-4 text-4xl animate-bounce">🏈</span>
        </div>
        </div>
      </div>
    </section>
  );
}