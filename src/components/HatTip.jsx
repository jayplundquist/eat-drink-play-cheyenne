import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import VenueCard from "./VenueCard";

export default function HatTip({ venues, favorites, user, onToggleFavorite }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Count favorites per venue
  const favoriteCounts = {};
  favorites.forEach((fav) => {
    favoriteCounts[fav.venue_id] = (favoriteCounts[fav.venue_id] || 0) + 1;
  });

  // Categories to showcase
  const categories = [
  { value: 'restaurant', label: 'Restaurant' },
  { value: 'bar', label: 'Bar' },
  { value: 'brewery', label: 'Brewery' },
  { value: 'music_hall', label: 'Music Hall' },
  { value: 'activity', label: 'Activity' },
  { value: 'recreation', label: 'Recreation' }];


  // Get top venue per category using favorites and boot ratings
  const trendingVenues = categories.
  map((cat) => {
    const categoryVenues = venues.filter((v) => {
      const venueCategories = v.categories || (v.category ? [v.category] : []);
      return venueCategories.includes(cat.value);
    });
    if (categoryVenues.length === 0) return null;

    // Score venues by favorite count and boot ratings
    const scored = categoryVenues.map((venue) => {
      const favCount = favoriteCounts[venue.id] || 0;
      const bootRating = venue.rating_count > 0 ? venue.rating_sum / venue.rating_count : 0;
      const score = favCount * 2 + bootRating;
      return { venue, score };
    });

    const sorted = scored.sort((a, b) => b.score - a.score);
    return sorted[0]?.venue;
  }).
  filter((v) => v !== null);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % trendingVenues.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [trendingVenues.length]);

  if (trendingVenues.length === 0) return null;

  const isFavorite = (venueId) => {
    if (!user) return false;
    return favorites.some((f) => f.venue_id === venueId && f.user_email === user.email);
  };

  return (
    <section className="mx-auto px-4 py-10 max-w-6xl sm:px-6">
      <div className="mb-6 flex items-center gap-3">
        <motion.div
          animate={{
            rotateZ: [0, 180, 360],
            y: [0, -10, 0]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            repeatDelay: 3,
            ease: "easeInOut"
          }}>

          <img
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/697e9c14c196b53cce1321b1/a19d27001_cowboy-hat.jpg"
            alt="cowboy hat"
            width="48"
            height="48"
            className="object-contain" />

        </motion.div>
        <h2 className="text-3xl font-bold text-amber-900" style={{ fontFamily: 'Rye, serif' }}>Hat Tip</h2>
        <span className="text-amber-700 text-sm ml-2">Most loved & highest rated by category</span>
      </div>
      
      <div className="flex items-center justify-center gap-4">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setCurrentIndex((prev) => (prev - 1 + trendingVenues.length) % trendingVenues.length)}
          className="border-amber-700 text-amber-700 hover:bg-amber-50">

          <ChevronLeft className="w-5 h-5" />
        </Button>

        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
          className="w-full max-w-sm">

          <VenueCard
            venue={{ ...trendingVenues[currentIndex], food_types: [] }}
            isFavorite={isFavorite(trendingVenues[currentIndex].id)}
            onToggleFavorite={() => onToggleFavorite(trendingVenues[currentIndex].id)}
            hideImage={true}
            hideDescription={true}
            hideAddress={true} />

        </motion.div>

        <Button
          variant="outline"
          size="icon"
          onClick={() => setCurrentIndex((prev) => (prev + 1) % trendingVenues.length)}
          className="border-amber-700 text-amber-700 hover:bg-amber-50">

          <ChevronRight className="w-5 h-5" />
        </Button>
      </div>
    </section>);

}