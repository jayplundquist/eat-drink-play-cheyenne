import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, MapPin, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import BootRating from './BootRating';

const categoryLabels = {
  restaurant: "Restaurant",
  bar: "Bar",
  brewery: "Brewery",
  music_hall: "Music Hall",
  activity: "Activity",
  recreation: "Recreation",
  souvenir_shopping: "Souvenir Shopping"
};

const foodTypeLabels = {
  asian: "Asian",
  international: "International",
  mexican: "Mexican",
  american: "American",
  steaks: "Steaks",
  bbq: "BBQ",
  dessert: "Dessert",
  fine_dining: "Fine Dining",
  pizza: "Pizza"
};

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
  const avgRating = currentVenue?.rating_count > 0 ? Math.round(currentVenue.rating_sum / currentVenue.rating_count) : 0;
  const getCategories = (venue) => venue.categories && venue.categories.length > 0 ? venue.categories : (venue.category ? [venue.category] : []);

  const isFavorite = (venueId) => {
    if (!user) return false;
    return favorites.some(f => f.venue_id === venueId && f.user_email === user.email);
  };

  return (
    <section className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
      <div className="relative bg-gradient-to-b from-green-700 via-green-600 to-green-700 rounded-xl overflow-hidden min-h-[600px]">
        {/* Yard markers background */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className="absolute top-0 bottom-0 border-l border-white/20"
              style={{ left: `${(i * 100) / 12}%` }}
            />
          ))}
        </div>

        {/* Content */}
        <div className="relative px-8 py-12 flex flex-col items-center justify-between h-full min-h-[600px]">
          {/* Header Section */}
          <div className="text-center mb-8 z-10">
            <div className="flex items-center justify-center gap-4 mb-6">
              <span className="text-6xl">🏈</span>
              <h2 className="text-5xl font-bold text-white" style={{ fontFamily: 'Rye, serif' }}>
                SUPER BOWL<br />WATCH<br />PARTIES
              </h2>
            </div>
            <p className="text-white/95 text-lg font-serif max-w-2xl leading-relaxed">
              Cheyenne's best spots to catch the big game. Come celebrate with fellow fans!
            </p>
          </div>

          {/* Venue Card */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="bg-yellow-100 border-8 border-amber-900 rounded-lg p-6 w-full max-w-md z-10 flex-1 max-h-fit"
            >
              {/* Venue Header */}
              <div className="flex items-start justify-between gap-4 mb-4 pb-4 border-b-4 border-amber-900">
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-amber-900" style={{ fontFamily: 'Rye, serif' }}>
                    {currentVenue.name}
                  </h3>
                  {getCategories(currentVenue).length > 0 && (
                    <Badge className="bg-yellow-200 text-amber-800 border border-amber-800 mt-2">
                      {categoryLabels[getCategories(currentVenue)[0]]}
                    </Badge>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onToggleFavorite(currentVenue.id)}
                  className="flex-shrink-0 hover:bg-yellow-200"
                >
                  <Heart
                    className="w-6 h-6"
                    fill={isFavorite(currentVenue.id) ? "currentColor" : "none"}
                    color={isFavorite(currentVenue.id) ? "#dc2626" : "#9ca3af"}
                  />
                </Button>
              </div>

              {/* Address */}
              {currentVenue.address && (
                <div className="flex items-center gap-2 text-amber-900 mb-4 text-sm font-serif">
                  <MapPin className="w-4 h-4 flex-shrink-0" />
                  <span>{currentVenue.address}</span>
                </div>
              )}

              {/* Rating and Food Types */}
              <div className="flex items-center gap-3 mb-4">
                <BootRating rating={avgRating} size="sm" />
                {currentVenue.food_types && currentVenue.food_types.length > 0 && (
                  <Badge className="bg-yellow-200 text-amber-800 border border-amber-800">
                    {foodTypeLabels[currentVenue.food_types[0]]}
                  </Badge>
                )}
              </div>

              {/* Description */}
              {currentVenue.description && (
                <p className="text-amber-900 text-sm line-clamp-3 font-serif">
                  {currentVenue.description}
                </p>
              )}

              {/* Link to details */}
              <Link to={createPageUrl(`VenueDetails?id=${currentVenue.id}`)} className="mt-4 block">
                <Button className="w-full bg-amber-800 hover:bg-amber-900 text-white">
                  View Details
                </Button>
              </Link>
            </motion.div>
          </AnimatePresence>

          {/* Navigation Buttons */}
          {superBowlVenues.length > 1 && (
            <div className="flex items-center gap-4 mt-8 z-10">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentIndex(prev => (prev - 1 + superBowlVenues.length) % superBowlVenues.length)}
                className="bg-white/90 hover:bg-white border-amber-900 text-amber-900"
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <span className="text-white font-semibold text-sm">
                {currentIndex + 1} of {superBowlVenues.length}
              </span>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentIndex(prev => (prev + 1) % superBowlVenues.length)}
                className="bg-white/90 hover:bg-white border-amber-900 text-amber-900"
              >
                <ChevronRight className="w-5 h-5" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}