import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { MapPin, Sparkles, Lightbulb } from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

import HeroSection from "../components/HeroSection";
import VenueCard from "../components/VenueCard";
import CategoryFilter from "../components/CategoryFilter";
import SpinTheSpur from "../components/SpinTheSpur";
import HatTip from "../components/HatTip";
import { CowboyBoot } from "../components/BootRating";

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [minBootRating, setMinBootRating] = useState(0);
  const [user, setUser] = useState(null);
  const [suggestionOpen, setSuggestionOpen] = useState(false);
  const [suggestion, setSuggestion] = useState('');

  const tabCategories = {
    all: [],
    eat: ['restaurant'],
    drink: ['bar', 'brewery', 'coffee_shop'],
    play: ['activity', 'recreation', 'music_hall', 'souvenir_shopping']
  };

  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => setUser(null));
  }, []);

  const { data: venues = [], isLoading: venuesLoading } = useQuery({
    queryKey: ['venues'],
    queryFn: () => base44.entities.Venue.list('-created_date', 50),
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

  const submitSuggestionMutation = useMutation({
    mutationFn: async () => {
      await base44.integrations.Core.SendEmail({
        to: 'admin@example.com',
        subject: 'New Suggestion from Cheyenne Guide',
        body: `User: ${user?.email || 'Anonymous'}\n\nSuggestion:\n${suggestion}`
      });
    },
    onSuccess: () => {
      toast.success('Thank you for your suggestion!');
      setSuggestionOpen(false);
      setSuggestion('');
    },
  });

  const filteredVenues = venues.filter(venue => {
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = !searchQuery || 
      venue.name?.toLowerCase().includes(searchLower) ||
      venue.description?.toLowerCase().includes(searchLower) ||
      venue.address?.toLowerCase().includes(searchLower) ||
      (venue.categories || []).some(cat => cat.toLowerCase().includes(searchLower)) ||
      (venue.food_types || []).some(type => type.toLowerCase().includes(searchLower)) ||
      (venue.features || []).some(feat => feat.toLowerCase().includes(searchLower));

    const venueCategories = venue.categories || (venue.category ? [venue.category] : []);
    const tabCats = tabCategories[activeTab];
    const matchesTab = tabCats.length === 0 || venueCategories.some(cat => tabCats.includes(cat));

    const venueAvgRating = venue.rating_count > 0 ? Math.round(venue.rating_sum / venue.rating_count) : 0;
    const matchesRating = minBootRating === 0 || venueAvgRating >= minBootRating;

    return matchesSearch && matchesTab && matchesRating;
  }).sort((a, b) => (a.name || '').localeCompare((b.name || '')));



  const featuredVenues = venues
    .filter(v => v.rating_count > 0)
    .sort((a, b) => (b.rating_sum / b.rating_count) - (a.rating_sum / a.rating_count))
    .slice(0, 4);

  return (
    <div className="min-h-screen bg-amber-50">
      <HeroSection 
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {/* Spin the Spur & Quick Draw */}
      {!searchQuery && activeTab === 'all' && (
        <SpinTheSpur 
          favorites={userFavorites}
          venues={venues}
          userRatings={userRatings}
          user={user}
          onSignInRequired={() => base44.auth.redirectToLogin()}
        />
      )}

      {/* Hat Tip Section */}
      {!searchQuery && activeTab === 'all' && (
        <HatTip 
          venues={venues}
          favorites={favorites}
          user={user}
          onToggleFavorite={(venueId) => user ? toggleFavoriteMutation.mutate(venueId) : base44.auth.redirectToLogin()}
        />
      )}

      {/* Just Blew In Section */}
      {venues.length > 0 && !searchQuery && activeTab === 'all' && (
        <section className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
          <div className="flex items-center gap-2 mb-6">
            <Sparkles className="w-5 h-5 text-amber-800" />
            <h2 className="text-2xl font-bold text-amber-900" style={{ fontFamily: 'Rye, serif' }}>Just Blew In</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <VenueCard 
                venue={venues[0]}
                isFavorite={isFavorite(venues[0].id)}
                onToggleFavorite={() => user ? toggleFavoriteMutation.mutate(venues[0].id) : base44.auth.redirectToLogin()}
                hideAddress
              />
            </motion.div>
          </div>
        </section>
      )}

      {/* Featured Section */}
      {featuredVenues.length > 0 && !searchQuery && activeTab === 'all' && (
        <section className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
          <div className="flex items-center gap-2 mb-6">
            <Sparkles className="w-5 h-5 text-amber-800" />
            <h2 className="text-2xl font-bold text-amber-900" style={{ fontFamily: 'Rye, serif' }}>Top Rated</h2>
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
                  hideAddress
                />
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* Main Content */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-6 flex gap-2 flex-wrap items-center">
          <Button
            variant={activeTab === 'all' ? 'default' : 'outline'}
            onClick={() => setActiveTab('all')}
            className={activeTab === 'all' ? 'bg-amber-600 hover:bg-amber-700' : 'border-amber-300 text-amber-700 hover:bg-amber-50'}
          >
            All Venues
          </Button>
          <Button
            variant={activeTab === 'eat' ? 'default' : 'outline'}
            onClick={() => setActiveTab('eat')}
            className={activeTab === 'eat' ? 'bg-amber-600 hover:bg-amber-700' : 'border-amber-300 text-amber-700 hover:bg-amber-50'}
          >
            🍽️ Eat
          </Button>
          <Button
            variant={activeTab === 'drink' ? 'default' : 'outline'}
            onClick={() => setActiveTab('drink')}
            className={activeTab === 'drink' ? 'bg-amber-600 hover:bg-amber-700' : 'border-amber-300 text-amber-700 hover:bg-amber-50'}
          >
            🍷 Drink
          </Button>
          <Button
            variant={activeTab === 'play' ? 'default' : 'outline'}
            onClick={() => setActiveTab('play')}
            className={activeTab === 'play' ? 'bg-amber-600 hover:bg-amber-700' : 'border-amber-300 text-amber-700 hover:bg-amber-50'}
          >
            🎭 Play
          </Button>

          <div className="flex gap-3 ml-auto items-center">
            <span className="text-sm text-stone-600 font-medium">Min Rating:</span>
            <div className="flex gap-2">
              <Button
                variant={minBootRating === 0 ? 'default' : 'outline'}
                onClick={() => setMinBootRating(0)}
                className={minBootRating === 0 ? 'bg-amber-600 hover:bg-amber-700 px-3' : 'border-amber-300 text-amber-700 hover:bg-amber-50 px-3'}
                size="sm"
              >
                All
              </Button>
              {[1, 2, 3, 4, 5].map(rating => (
                <Button
                  key={rating}
                  variant={minBootRating === rating ? 'default' : 'outline'}
                  onClick={() => setMinBootRating(rating)}
                  className={minBootRating === rating ? 'bg-amber-600 hover:bg-amber-700 px-2 flex items-center gap-1' : 'border-amber-300 text-amber-700 hover:bg-amber-50 px-2 flex items-center gap-1'}
                  size="sm"
                >
                  <CowboyBoot filled size="sm" />
                  <span className="text-xs">x{rating}</span>
                </Button>
              ))}
            </div>
          </div>
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
      </section>

      {/* Suggestions Button */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-12 text-center">
        <Dialog open={suggestionOpen} onOpenChange={setSuggestionOpen}>
          <DialogTrigger asChild>
            <Button 
              variant="outline" 
              className="border-2 border-amber-800 text-amber-800 hover:bg-amber-50"
            >
              <Lightbulb className="w-5 h-5 mr-2" />
              Have a Suggestion?
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Share Your Suggestion</DialogTitle>
              <DialogDescription>
                Help us improve Cheyenne Guide by sharing your ideas!
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <Textarea
                value={suggestion}
                onChange={(e) => setSuggestion(e.target.value)}
                placeholder="Tell us what you'd like to see..."
                className="resize-none"
                rows={5}
              />
              <Button 
                onClick={() => submitSuggestionMutation.mutate()}
                disabled={!suggestion.trim() || submitSuggestionMutation.isPending}
                className="w-full bg-amber-600 hover:bg-amber-700 text-white"
              >
                Submit Suggestion
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </section>
    </div>
  );
}