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
import { MapPin, Sparkles, Lightbulb, MessageCircle, Filter, ChevronDown, ChevronUp } from "lucide-react";
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
  const [selectedPrice, setSelectedPrice] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [user, setUser] = useState(null);
  const [suggestionOpen, setSuggestionOpen] = useState(false);
  const [suggestion, setSuggestion] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

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

  const { data: recentReviews = [] } = useQuery({
    queryKey: ['recentReviews'],
    queryFn: () => base44.entities.Rating.list('-created_date', 5),
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

  const allFilteredVenues = venues.filter(venue => {
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

    const matchesPrice = !selectedPrice || venue.price_range === selectedPrice;

    return matchesSearch && matchesTab && matchesRating && matchesPrice;
  }).sort((a, b) => (a.name || '').localeCompare((b.name || '')));

  const itemsPerPage = 20;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const filteredVenues = allFilteredVenues.slice(startIndex, startIndex + itemsPerPage);
  const totalPages = Math.ceil(allFilteredVenues.length / itemsPerPage);





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

       {/* The Hitching Post */}
       {!searchQuery && activeTab === 'all' && (
         <section className="max-w-6xl mx-auto px-4 sm:px-6 py-4">
           <Link to={createPageUrl('ActivityFeed')}>
             <Button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white text-lg py-6 font-semibold">
               <MessageCircle className="w-5 h-5 mr-2" />
               The Hitching Post - Activity Feed
             </Button>
           </Link>
         </section>
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

      {/* Just Blew In Section - Recent Reviews */}
       {recentReviews.length > 0 && !searchQuery && activeTab === 'all' && (
         <section className="max-w-6xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center gap-2 mb-6">
            <Sparkles className="w-5 h-5 text-amber-800" />
            <h2 className="text-2xl font-bold text-amber-900" style={{ fontFamily: 'Rye, serif' }}>Just Blew In</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {recentReviews.map((review, i) => {
              const venue = venues.find(v => v.id === review.venue_id);
              return (
                <motion.div
                  key={review.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Link to={createPageUrl(`VenueDetails?id=${review.venue_id}`)}>
                    <div className="bg-white rounded-lg border border-amber-200 p-4 h-full hover:shadow-md transition-shadow cursor-pointer">
                      <h3 className="font-semibold text-amber-900 truncate text-sm mb-3">{venue?.name || 'Venue'}</h3>
                      <div className="flex gap-1 mb-3">
                        {[...Array(5)].map((_, idx) => (
                          <div key={idx} className="w-5 h-5">
                            <CowboyBoot filled={idx < review.boots} size="sm" />
                          </div>
                        ))}
                      </div>
                      {review.comment && (
                        <p className="text-stone-600 text-xs line-clamp-2">{review.comment}</p>
                      )}
                      <p className="text-xs text-stone-400 mt-3">
                        by {review.user_email?.split('@')[0]}
                      </p>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </section>
      )}



      {/* Big Boots Challenge Section */}
      {!searchQuery && activeTab === 'all' && (
        <section className="max-w-6xl mx-auto px-4 sm:px-6 py-4">
          <div className="bg-gradient-to-r from-amber-600 to-amber-700 rounded-lg p-8 text-white overflow-hidden relative">
            <div className="absolute top-0 right-0 text-9xl opacity-10">👢</div>
            <div className="relative z-10">
              <div className="flex items-start justify-between gap-6 flex-col md:flex-row">
                <div className="flex-1">
                  <h2 className="text-3xl font-bold mb-3" style={{ fontFamily: 'Rye, serif' }}>
                    Hunt for the Big Boots
                  </h2>
                  <p className="text-amber-50 mb-4 text-lg">
                    Cheyenne is home to 29 iconic painted boots scattered throughout the city. Visit them all and collect proof with photos!
                  </p>
                  <ul className="text-amber-100 space-y-2 mb-6 text-sm">
                    <li>✓ 29 boots to discover</li>
                    <li>✓ Upload photos as proof</li>
                    <li>✓ Track your progress</li>
                    <li>✓ Complete the challenge</li>
                  </ul>
                </div>
                <Link to={createPageUrl('Profile')} className="flex-shrink-0">
                  <Button className="bg-white text-amber-700 hover:bg-amber-50 font-semibold text-lg px-8 py-6">
                    Start the Hunt
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Main Content */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-6 flex gap-2 flex-wrap items-center">
          <Button
            variant={activeTab === 'all' ? 'default' : 'outline'}
            onClick={() => { setActiveTab('all'); setCurrentPage(1); }}
            className={activeTab === 'all' ? 'bg-amber-600 hover:bg-amber-700' : 'border-amber-300 text-amber-700 hover:bg-amber-50'}
          >
            All Venues
          </Button>
          <Button
            variant={activeTab === 'eat' ? 'default' : 'outline'}
            onClick={() => { setActiveTab('eat'); setCurrentPage(1); }}
            className={activeTab === 'eat' ? 'bg-amber-600 hover:bg-amber-700' : 'border-amber-300 text-amber-700 hover:bg-amber-50'}
          >
            🍽️ Eat
          </Button>
          <Button
            variant={activeTab === 'drink' ? 'default' : 'outline'}
            onClick={() => { setActiveTab('drink'); setCurrentPage(1); }}
            className={activeTab === 'drink' ? 'bg-amber-600 hover:bg-amber-700' : 'border-amber-300 text-amber-700 hover:bg-amber-50'}
          >
            🍷 Drink
          </Button>
          <Button
            variant={activeTab === 'play' ? 'default' : 'outline'}
            onClick={() => { setActiveTab('play'); setCurrentPage(1); }}
            className={activeTab === 'play' ? 'bg-amber-600 hover:bg-amber-700' : 'border-amber-300 text-amber-700 hover:bg-amber-50'}
          >
            🎭 Play
          </Button>

          <div className="ml-auto">
            <Button
              variant={showFilters ? 'default' : 'outline'}
              onClick={() => setShowFilters(!showFilters)}
              className={showFilters ? 'bg-amber-600 hover:bg-amber-700' : 'border-amber-300 text-amber-700 hover:bg-amber-50'}
            >
              <Filter className="w-4 h-4 mr-2" />
              Filters
              {showFilters ? <ChevronUp className="w-4 h-4 ml-1" /> : <ChevronDown className="w-4 h-4 ml-1" />}
            </Button>
          </div>
        </div>

        {/* Expandable Filters */}
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-6 p-4 bg-amber-50 border-2 border-amber-200 rounded-lg space-y-4"
          >
            <div className="space-y-3">
              <div>
                <span className="text-sm font-medium text-stone-600 block mb-2">Minimum Rating</span>
                <div className="flex gap-2 flex-wrap">
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

              <div>
                <span className="text-sm font-medium text-stone-600 block mb-2">Price Range</span>
                <div className="flex gap-2 flex-wrap">
                  <Button
                    variant={selectedPrice === '' ? 'default' : 'outline'}
                    onClick={() => setSelectedPrice('')}
                    className={selectedPrice === '' ? 'bg-amber-600 hover:bg-amber-700 px-3' : 'border-amber-300 text-amber-700 hover:bg-amber-50 px-3'}
                    size="sm"
                  >
                    All
                  </Button>
                  {['Free', '$', '$$', '$$$', '$$$$'].map(price => (
                    <Button
                      key={price}
                      variant={selectedPrice === price ? 'default' : 'outline'}
                      onClick={() => setSelectedPrice(price)}
                      className={selectedPrice === price ? 'bg-amber-600 hover:bg-amber-700 px-3' : 'border-amber-300 text-amber-700 hover:bg-amber-50 px-3'}
                      size="sm"
                    >
                      {price}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}

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
                    hideAddress
                  />
                </motion.div>
                ))}
                </div>
                )}

                {/* Pagination */}
                {allFilteredVenues.length > itemsPerPage && (
                <div className="mt-8 flex items-center justify-center gap-4">
                <Button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                variant="outline"
                className="border-amber-300 text-amber-700 hover:bg-amber-50"
                >
                Previous
                </Button>
                <span className="text-sm text-stone-600 font-medium">
                Page {currentPage} of {totalPages}
                </span>
                <Button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                variant="outline"
                className="border-amber-300 text-amber-700 hover:bg-amber-50"
                >
                Next
                </Button>
                </div>
                )}
                </section>

                {/* Suggestions Button */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-4 text-center">
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