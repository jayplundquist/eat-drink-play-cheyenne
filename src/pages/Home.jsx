import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowRight, Calendar, MapPin, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

import HeroSection from "../components/HeroSection";
import VenueCard from "../components/VenueCard";
import EventCard from "../components/EventCard";
import CategoryFilter from "../components/CategoryFilter";
import SpinTheSpur from "../components/SpinTheSpur";
import HatTip from "../components/HatTip";

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [user, setUser] = useState(null);

  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => setUser(null));
  }, []);

  const { data: venues = [], isLoading: venuesLoading } = useQuery({
    queryKey: ['venues'],
    queryFn: () => base44.entities.Venue.list('-created_date', 50),
  });

  const { data: events = [], isLoading: eventsLoading } = useQuery({
    queryKey: ['events'],
    queryFn: () => base44.entities.Event.list('date', 20),
  });

  const { data: favorites = [] } = useQuery({
    queryKey: ['favorites'],
    queryFn: () => base44.entities.Favorite.list(),
  });

  const { data: userFavorites = [] } = useQuery({
    queryKey: ['userFavorites', user?.email],
    queryFn: () => user ? base44.entities.Favorite.filter({ user_email: user.email }) : [],
    enabled: !!user,
  });

  const { data: userRatings = [] } = useQuery({
    queryKey: ['userRatings', user?.email],
    queryFn: () => user ? base44.entities.Rating.filter({ user_email: user.email }) : [],
    enabled: !!user,
  });

  const toggleFavoriteMutation = useMutation({
    mutationFn: async (venueId) => {
      const existing = userFavorites.find(f => f.venue_id === venueId);
      if (existing) {
        await base44.entities.Favorite.delete(existing.id);
      } else {
        await base44.entities.Favorite.create({ venue_id: venueId, user_email: user.email });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
      queryClient.invalidateQueries({ queryKey: ['userFavorites'] });
    },
  });

  const isFavorite = (venueId) => userFavorites.some(f => f.venue_id === venueId);

  const filteredVenues = venues.filter(venue => {
    const matchesSearch = !searchQuery || 
      venue.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      venue.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || venue.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const upcomingEvents = events
    .filter(e => new Date(e.date) >= new Date())
    .slice(0, 6);

  const featuredVenues = venues
    .filter(v => v.rating_count > 0)
    .sort((a, b) => (b.rating_sum / b.rating_count) - (a.rating_sum / a.rating_count))
    .slice(0, 4);

  return (
    <div className="min-h-screen bg-stone-50">
      <HeroSection 
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {/* Spin the Spur & Quick Draw */}
      {!searchQuery && selectedCategory === 'all' && (
        <SpinTheSpur 
          favorites={userFavorites}
          venues={venues}
          userRatings={userRatings}
          user={user}
          onSignInRequired={() => base44.auth.redirectToLogin()}
        />
      )}

      {/* Hat Tip Section */}
      {!searchQuery && selectedCategory === 'all' && (
        <HatTip 
          venues={venues}
          favorites={favorites}
          user={user}
          onToggleFavorite={(venueId) => user ? toggleFavoriteMutation.mutate(venueId) : base44.auth.redirectToLogin()}
        />
      )}

      {/* Featured Section */}
      {featuredVenues.length > 0 && !searchQuery && selectedCategory === 'all' && (
        <section className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
          <div className="flex items-center gap-2 mb-6">
            <Sparkles className="w-5 h-5 text-amber-600" />
            <h2 className="text-2xl font-bold text-stone-800">Top Rated</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredVenues.map((venue, i) => (
              <motion.div
                key={venue.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <VenueCard 
                  venue={venue}
                  isFavorite={isFavorite(venue.id)}
                  onToggleFavorite={() => user ? toggleFavoriteMutation.mutate(venue.id) : base44.auth.redirectToLogin()}
                />
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* Main Content */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <Tabs defaultValue="venues" className="w-full">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <TabsList className="bg-stone-100 p-1 rounded-full">
              <TabsTrigger 
                value="venues" 
                className="rounded-full px-6 data-[state=active]:bg-white data-[state=active]:text-amber-700 data-[state=active]:shadow-sm"
              >
                <MapPin className="w-4 h-4 mr-2" />
                Venues
              </TabsTrigger>
              <TabsTrigger 
                value="events"
                className="rounded-full px-6 data-[state=active]:bg-white data-[state=active]:text-amber-700 data-[state=active]:shadow-sm"
              >
                <Calendar className="w-4 h-4 mr-2" />
                Events
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="venues" className="mt-0">
            <div className="mb-6">
              <CategoryFilter 
                selected={selectedCategory}
                onSelect={setSelectedCategory}
              />
            </div>

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
            ) : filteredVenues.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MapPin className="w-8 h-8 text-stone-400" />
                </div>
                <h3 className="text-lg font-medium text-stone-700 mb-2">No venues found</h3>
                <p className="text-stone-500">Try adjusting your search or filters</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredVenues.map((venue, i) => (
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
            )}
          </TabsContent>

          <TabsContent value="events" className="mt-0">
            {eventsLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="space-y-3">
                    <Skeleton className="aspect-[16/9] rounded-lg" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                ))}
              </div>
            ) : upcomingEvents.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Calendar className="w-8 h-8 text-stone-400" />
                </div>
                <h3 className="text-lg font-medium text-stone-700 mb-2">No upcoming events</h3>
                <p className="text-stone-500">Check back soon for new events</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {upcomingEvents.map((event, i) => (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <EventCard event={event} />
                  </motion.div>
                ))}
              </div>
            )}

            <div className="text-center mt-8">
              <Button 
                variant="outline" 
                className="border-amber-300 text-amber-700 hover:bg-amber-50"
                asChild
              >
                <Link to={createPageUrl('Events')}>
                  View All Events
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </section>
    </div>
  );
}