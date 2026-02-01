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
            rotateZ: [0, 180, 360],
            y: [0, -10, 0],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            repeatDelay: 3,
            ease: "easeInOut"
          }}
        >
          <svg width="48" height="48" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Wide brim */}
            <ellipse cx="50" cy="65" rx="45" ry="8" fill="#78350f"/>
            <ellipse cx="50" cy="63" rx="45" ry="8" fill="#92400e"/>
            
            {/* Crown base */}
            <path d="M25 60 Q25 45 30 40 L70 40 Q75 45 75 60 Z" fill="#b45309"/>
            
            {/* Crown top */}
            <path d="M30 40 Q32 25 35 20 Q40 15 50 15 Q60 15 65 20 Q68 25 70 40 Z" fill="#d97706"/>
            
            {/* Crown indent */}
            <path d="M35 28 Q40 23 50 23 Q60 23 65 28 L65 38 Q60 33 50 33 Q40 33 35 38 Z" fill="#92400e"/>
            
            {/* Hatband */}
            <rect x="28" y="56" width="44" height="6" rx="1" fill="#422006"/>
            <rect x="28" y="56" width="44" height="3" rx="1" fill="#78350f"/>
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
              hideImage={true}
            />
          </motion.div>
        ))}
      </div>
    </section>
  );
}