import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Heart, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";
import VenueCard from "../components/VenueCard";

export default function Favorites() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const { data: favorites = [], isLoading: favoritesLoading } = useQuery({
    queryKey: ['favorites', user?.email],
    queryFn: () => base44.entities.Favorite.filter({ user_email: user.email }),
    enabled: !!user,
  });

  const { data: venues = [], isLoading: venuesLoading } = useQuery({
    queryKey: ['venues'],
    queryFn: () => base44.entities.Venue.list('-created_date', 100),
    enabled: !!user,
  });

  const toggleFavoriteMutation = useMutation({
    mutationFn: async (venueId) => {
      const existing = favorites.find(f => f.venue_id === venueId);
      if (existing) {
        await base44.entities.Favorite.delete(existing.id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
    },
  });

  const favoriteVenues = venues.filter(v => 
    favorites.some(f => f.venue_id === v.id)
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-stone-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16 text-center">
          <div className="w-20 h-20 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Heart className="w-10 h-10 text-rose-500" />
          </div>
          <h1 className="text-2xl font-bold text-stone-800 mb-4">Sign in to see your favorites</h1>
          <p className="text-stone-600 mb-8">
            Keep track of your favorite places in Cheyenne
          </p>
          <Button 
            onClick={() => base44.auth.redirectToLogin()}
            className="bg-amber-600 hover:bg-amber-700 text-white"
          >
            Sign In
          </Button>
        </div>
      </div>
    );
  }

  const isLoading = favoritesLoading || venuesLoading;

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <div className="bg-gradient-to-br from-stone-900 via-stone-800 to-amber-900 text-white py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <Link to={createPageUrl('Home')}>
            <Button variant="ghost" size="sm" className="text-white/80 hover:text-white hover:bg-white/10 mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </Link>
          
          <div className="flex items-center gap-3 mb-4">
            <Heart className="w-8 h-8 text-rose-400 fill-rose-400" />
            <h1 className="text-3xl sm:text-4xl font-bold">My Favorites</h1>
          </div>
          
          <p className="text-stone-300">
            Your saved places in Cheyenne
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="aspect-[4/3] rounded-lg" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        ) : favoriteVenues.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Heart className="w-8 h-8 text-stone-400" />
            </div>
            <h3 className="text-lg font-medium text-stone-700 mb-2">No favorites yet</h3>
            <p className="text-stone-500 mb-6">
              Start exploring and save your favorite places
            </p>
            <Link to={createPageUrl('Home')}>
              <Button className="bg-amber-600 hover:bg-amber-700 text-white">
                Explore Venues
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {favoriteVenues.map((venue, i) => (
              <motion.div
                key={venue.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <VenueCard 
                  venue={venue}
                  isFavorite={true}
                  onToggleFavorite={() => toggleFavoriteMutation.mutate(venue.id)}
                />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}