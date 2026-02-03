import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ChevronRight, ChevronLeft } from "lucide-react";
import { motion } from "framer-motion";
import VenueCard from "./VenueCard";

export default function SuperBowlVenues({ venues, favorites, user, onToggleFavorite }) {
  const superBowlVenues = venues.filter(v => v.broadcasts_superbowl && !v.permanently_closed);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (superBowlVenues.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % superBowlVenues.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [superBowlVenues]);

  if (superBowlVenues.length === 0) return null;

  const isFavorite = (venueId) => {
    if (!user) return false;
    return favorites.some(f => f.venue_id === venueId && f.user_email === user.email);
  };

  const currentVenue = superBowlVenues[currentIndex];

  return (
    <section className="max-w-6xl mx-auto px-4 sm:px-6 py-8 mb-8">
      <div className="relative overflow-hidden rounded-lg">
        {/* Football field background */}
        <style>{`
          .football-field {
            background: linear-gradient(to right, #1a4d2e 0%, #2d5f3f 50%, #1a4d2e 100%);
            position: relative;
            cursor: pointer;
            transition: opacity 0.3s ease;
          }
          .football-field:hover {
            opacity: 0.9;
          }
          .field-line {
            position: absolute;
            background: repeating-linear-gradient(
              90deg,
              transparent,
              transparent 9.09%,
              #f5f5f5 9.09%,
              #f5f5f5 10%
            );
            width: 100%;
            height: 100%;
            opacity: 0.3;
          }
          .yard-numbers {
            position: absolute;
            font-size: 5rem;
            font-weight: bold;
            color: rgba(245, 245, 245, 0.1);
            font-family: 'Arial Black', sans-serif;
            letter-spacing: 2px;
          }
        `}</style>
        
        <Link to={createPageUrl('SuperBowlWatchParty')} className="block">
          <div className="football-field p-8 md:p-12 relative">
            <div className="field-line"></div>
            
            <div className="absolute top-4 right-8 yard-numbers">50</div>
            <div className="absolute bottom-4 left-8 yard-numbers transform rotate-180">50</div>

            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-6">
                <span className="text-4xl">🏈</span>
                <h2 className="text-3xl md:text-4xl font-bold text-white" style={{ fontFamily: 'Arial Black, sans-serif', letterSpacing: '2px' }}>
                  SUPER BOWL WATCH PARTIES
                </h2>
                <span className="text-4xl">⌉</span>
              </div>

              <p className="text-white/90 text-lg mb-6 max-w-2xl">
                Cheyenne's best spots to catch the big game. Come celebrate with fellow fans!
              </p>

              <div className="flex items-center justify-between gap-4">
                <div className="flex-1">
                  <p className="text-white text-lg font-semibold mb-2">
                    {superBowlVenues.length} venues broadcasting the Super Bowl
                  </p>
                  <p className="text-white/80">
                    Click to view all venues
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Link>

        {/* Auto-scrolling venue carousel */}
        <div className="football-field p-6 border-t-4 border-green-900">
          <div className="field-line"></div>
          <div className="relative z-10 flex items-center justify-center gap-6">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentIndex(prev => (prev - 1 + superBowlVenues.length) % superBowlVenues.length)}
              className="border-green-300 text-green-600 hover:bg-green-50 flex-shrink-0"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>

            <div className="w-full max-w-sm">
              {currentVenue && (
                <motion.div
                  key={currentIndex}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <VenueCard
                    venue={currentVenue}
                    isFavorite={isFavorite(currentVenue.id)}
                    onToggleFavorite={() => user ? onToggleFavorite(currentVenue.id) : window.location.href = createPageUrl('Home')}
                  />
                </motion.div>
              )}
            </div>

            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentIndex(prev => (prev + 1) % superBowlVenues.length)}
              className="border-green-300 text-green-600 hover:bg-green-50 flex-shrink-0"
            >
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}