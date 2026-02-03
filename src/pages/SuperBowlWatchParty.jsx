import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";
import VenueCard from "../components/VenueCard";

export default function SuperBowlWatchParty() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => setUser(null));
  }, []);

  const { data: venues = [], isLoading: venuesLoading } = useQuery({
    queryKey: ['venues'],
    queryFn: () => base44.entities.Venue.list('-created_date', 10000),
  });

  const { data: favorites = [] } = useQuery({
    queryKey: ['favorites', user?.email],
    queryFn: () => user ? base44.entities.Favorite.filter({ user_email: user.email }) : Promise.resolve([]),
  });

  const superBowlVenues = venues.filter(v => v.broadcasts_superbowl && !v.permanently_closed);

  const isFavorite = (venueId) => favorites.some(f => f.venue_id === venueId);

  const queryClient = React.useQueryClient?.();
  
  const toggleFavoriteMutation = React.useMutation({
    mutationFn: async (venueId) => {
      const existing = favorites.find(f => f.venue_id === venueId);
      if (existing) {
        await base44.entities.Favorite.delete(existing.id);
      } else {
        await base44.entities.Favorite.create({ venue_id: venueId, user_email: user.email });
      }
    },
    onSuccess: () => {
      queryClient?.invalidateQueries({ queryKey: ['favorites'] });
    },
  });

  return (
    <div className="min-h-screen bg-amber-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-green-700 text-white py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <Link to={createPageUrl('Home')}>
            <Button variant="ghost" size="sm" className="text-white/80 hover:text-white hover:bg-white/10 mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <span className="text-4xl">🏈</span>
            <h1 className="text-4xl font-bold" style={{ fontFamily: 'Arial Black, sans-serif', letterSpacing: '2px' }}>
              SUPER BOWL WATCH PARTIES
            </h1>
          </div>
          <p className="text-green-100 text-lg">
            Find the perfect spot in Cheyenne to catch the big game
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {venuesLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="aspect-[4/3] rounded-lg" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        ) : superBowlVenues.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🏈</div>
            <h2 className="text-2xl font-bold text-stone-800 mb-2">No Super Bowl Watch Parties Yet</h2>
            <p className="text-stone-600">Check back soon for venues broadcasting the big game!</p>
          </div>
        ) : (
          <div>
            <p className="text-stone-600 mb-6 text-lg">
              {superBowlVenues.length} {superBowlVenues.length === 1 ? 'venue is' : 'venues are'} broadcasting the Super Bowl
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {superBowlVenues.map((venue, i) => (
                <motion.div
                  key={venue.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <VenueCard
                    venue={venue}
                    isFavorite={isFavorite(venue.id)}
                    onToggleFavorite={() => user ? toggleFavoriteMutation.mutate(venue.id) : base44.auth.redirectToLogin()}
                  />
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}