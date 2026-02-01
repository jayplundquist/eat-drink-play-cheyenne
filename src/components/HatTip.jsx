import React from 'react';
import { motion } from 'framer-motion';
import { Award } from "lucide-react";
import VenueCard from "./VenueCard";

export default function HatTip({ venues, favorites, user, onToggleFavorite }) {
  // Count favorites per venue
  const favoriteCounts = {};
  favorites.forEach(fav => {
    favoriteCounts[fav.venue_id] = (favoriteCounts[fav.venue_id] || 0) + 1;
  });

  // Categories to showcase
  const categories = [
    { value: 'restaurant', label: 'Restaurant' },
    { value: 'bar', label: 'Bar' },
    { value: 'brewery', label: 'Brewery' },
    { value: 'music_hall', label: 'Music Hall' },
    { value: 'activity', label: 'Activity' },
    { value: 'recreation', label: 'Recreation' }
  ];

  // Get top favorited venue per category
  const trendingVenues = categories
    .map(cat => {
      const categoryVenues = venues.filter(v => v.category === cat.value);
      if (categoryVenues.length === 0) return null;
      
      // Sort by favorite count, then by rating
      const sorted = categoryVenues.sort((a, b) => {
        const aFavs = favoriteCounts[a.id] || 0;
        const bFavs = favoriteCounts[b.id] || 0;
        if (aFavs !== bFavs) return bFavs - aFavs;
        
        const aRating = a.rating_count > 0 ? a.rating_sum / a.rating_count : 0;
        const bRating = b.rating_count > 0 ? b.rating_sum / b.rating_count : 0;
        return bRating - aRating;
      });
      
      return sorted[0];
    })
    .filter(v => v !== null);

  if (trendingVenues.length === 0) return null;

  const isFavorite = (venueId) => {
    if (!user) return false;
    return favorites.some(f => f.venue_id === venueId && f.user_email === user.email);
  };

  return (
    <section className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
      <div className="flex items-center gap-3 mb-6">
        <motion.div
          animate={{
            rotateY: [0, 180, 360],
            y: [0, -10, 0],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            repeatDelay: 3,
            ease: "easeInOut"
          }}
          style={{ perspective: 1000 }}
        >
          <svg width="40" height="40" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
            <ellipse cx="32" cy="48" rx="28" ry="6" fill="#78350f" />
            <path d="M32 20C20 20 12 24 10 30C10 36 10 40 10 40C10 44 18 48 32 48C46 48 54 44 54 40C54 40 54 36 54 30C52 24 44 20 32 20Z" fill="#92400e"/>
            <ellipse cx="32" cy="30" rx="22" ry="8" fill="#b45309"/>
            <path d="M32 14C28 14 24 16 22 18C22 18 20 20 20 22C20 24 20 26 22 28C24 30 28 32 32 32C36 32 40 30 42 28C44 26 44 24 44 22C44 20 42 18 42 18C40 16 36 14 32 14Z" fill="#d97706"/>
            <ellipse cx="32" cy="22" rx="10" ry="4" fill="#fbbf24"/>
          </svg>
        </motion.div>
        <h2 className="text-3xl font-bold text-amber-900" style={{ fontFamily: 'Rye, serif' }}>Hat Tip</h2>
        <span className="text-amber-700 text-sm ml-2">Trending favorites by category</span>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {trendingVenues.map((venue, i) => (
          <motion.div
            key={venue.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <VenueCard 
              venue={venue}
              isFavorite={isFavorite(venue.id)}
              onToggleFavorite={() => onToggleFavorite(venue.id)}
            />
          </motion.div>
        ))}
      </div>
    </section>
  );
}