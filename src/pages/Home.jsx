import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { utils, writeFile } from 'xlsx';
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
import { MapPin, Sparkles, Lightbulb, MessageCircle, Filter, ChevronDown, ChevronUp, Download, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

import HeroSection from "../components/HeroSection";
import VenueCard from "../components/VenueCard";
import CategoryFilter from "../components/CategoryFilter";
import SpinTheSpur from "../components/SpinTheSpur";
import QuickDraw from "../components/QuickDraw";
import WetYerWhistle from "../components/WetYerWhistle";
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
  const [reviewIndex, setReviewIndex] = useState(0);

  const { data: customOptions = [] } = useQuery({
    queryKey: ['customVenueOptions'],
    queryFn: () => base44.entities.CustomVenueOption.list(),
  });

  const builtInTabCategories = {
    all: [],
    eat: ['restaurant'],
    drink: ['bar', 'brewery', 'coffee_shop', 'winery'],
    play: ['activity', 'recreation', 'music_hall'],
    shop: ['souvenir_shopping', 'shopping', 'grocery'],
    chuck_wagons: ['food_trucks']
  };

  // Add custom categories to their respective tabs
  const tabCategories = { ...builtInTabCategories };
  customOptions.filter(opt => opt.type === 'category' && opt.tabs && opt.tabs.length > 0).forEach(opt => {
    opt.tabs.forEach(tab => {
      if (!tabCategories[tab]) {
        tabCategories[tab] = [];
      }
      if (!tabCategories[tab].includes(opt.value)) {
        tabCategories[tab].push(opt.value);
      }
    });
  });

  const queryClient = useQueryClient();

    useEffect(() => {
      base44.auth.me().then(setUser).catch(() => setUser(null));
    }, []);

  const { data: venues = [], isLoading: venuesLoading } = useQuery({
    queryKey: ['venues'],
    queryFn: () => base44.entities.Venue.list('-created_date', 10000),
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

  useEffect(() => {
    if (recentReviews.length > 0) {
      const interval = setInterval(() => {
        setReviewIndex(prev => (prev + 1) % recentReviews.length);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [recentReviews.length]);

  const { data: boots = [] } = useQuery({
    queryKey: ['boots'],
    queryFn: () => base44.entities.Boot.list(),
  });

  const { data: gameSettings = [] } = useQuery({
    queryKey: ['gameSettings'],
    queryFn: () => base44.entities.GameSettings.list(),
  });

  const quickDrawSetting = gameSettings.find(s => s.game_name === 'quick_draw');
  const wetYerWhistleSetting = gameSettings.find(s => s.game_name === 'wet_yer_whistle');
  const quickDrawCategories = quickDrawSetting?.categories || ['restaurant'];
  const wetYerWhistleCategories = wetYerWhistleSetting?.categories || ['bar', 'brewery', 'coffee_shop', 'winery'];

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

  const exportVenuesToExcel = () => {
    const data = venues.map(venue => ({
      'Venue Name': venue.name,
      'Categories': (venue.categories || []).join(', '),
      'Food Types': (venue.food_types || []).join(', ')
    }));

    const ws = utils.json_to_sheet(data);
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, 'Venues');
    writeFile(wb, 'cheyenne-venues.xlsx');
  };

  const submitSuggestionMutation = useMutation({
    mutationFn: async () => {
      await base44.entities.Suggestion.create({
        user_email: user?.email || 'anonymous',
        suggestion_text: suggestion
      });
    },
    onSuccess: () => {
      toast.success('Thank you for your suggestion!');
      setSuggestionOpen(false);
      setSuggestion('');
    },
    onError: (error) => {
      toast.error('Failed to submit suggestion. Please try again.');
      console.error('Suggestion submission error:', error);
    },
  });

  const filteredBoots = boots.filter(boot => {
    const searchLower = searchQuery.toLowerCase();
    return !searchQuery ||
      boot.name?.toLowerCase().includes(searchLower) ||
      boot.address?.toLowerCase().includes(searchLower);
  }).sort((a, b) => (a.name || '').localeCompare((b.name || '')));

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

      {/* Games in Grid Under Hero */}
      {!searchQuery && activeTab === 'all' && (
        <div className="max-w-2xl mx-auto px-4 sm:px-6 -mt-8 relative z-10 pb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="bg-white rounded-lg p-4 md:aspect-square flex items-center justify-center shadow-md hover:shadow-lg transition-shadow border border-amber-200">
              <SpinTheSpur 
                favorites={userFavorites}
                venues={venues}
                userRatings={userRatings}
                user={user}
                onSignInRequired={() => base44.auth.redirectToLogin()}
                quickDrawCategories={quickDrawCategories}
              />
            </div>

            <div className="bg-white rounded-lg p-4 md:aspect-square flex items-center justify-center shadow-md hover:shadow-lg transition-shadow border border-amber-200">
              <QuickDraw 
                venues={venues}
                userRatings={userRatings}
                user={user}
                onSignInRequired={() => base44.auth.redirectToLogin()}
                quickDrawCategories={quickDrawCategories}
              />
            </div>

            <div className="bg-white rounded-lg p-4 md:aspect-square flex items-center justify-center shadow-md hover:shadow-lg transition-shadow border border-amber-200">
              <WetYerWhistle 
                venues={venues}
                user={user}
                onSignInRequired={() => base44.auth.redirectToLogin()}
                wetYerWhistleCategories={wetYerWhistleCategories}
              />
            </div>
          </div>
        </div>
      )}

       {/* Hat Tip Section - Trending Venues */}
       {!searchQuery && activeTab === 'all' && (
         <section className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
           <HatTip 
             venues={venues}
             favorites={favorites}
             user={user}
             onToggleFavorite={(venueId) => user ? toggleFavoriteMutation.mutate(venueId) : base44.auth.redirectToLogin()}
           />
         </section>
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

      {/* Just Blew In Section - Recent Reviews */}
       {recentReviews.length > 0 && !searchQuery && activeTab === 'all' && (
         <section className="max-w-6xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center gap-2 mb-6">
            <Sparkles className="w-5 h-5 text-amber-800" />
            <h2 className="text-2xl font-bold text-amber-900" style={{ fontFamily: 'Rye, serif' }}>Just Blew In</h2>
          </div>
          <div className="flex items-center justify-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setReviewIndex(prev => (prev - 1 + recentReviews.length) % recentReviews.length)}
              className="border-amber-700 text-amber-700 hover:bg-amber-50"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>

            <motion.div
              key={reviewIndex}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="w-full max-w-sm"
            >
              {(() => {
                const review = recentReviews[reviewIndex];
                const venue = venues.find(v => v.id === review.venue_id);
                return (
                  <Link to={createPageUrl(`VenueDetails?id=${review.venue_id}`)}>
                    <div className="bg-white rounded-lg border border-amber-200 p-6 hover:shadow-md transition-shadow cursor-pointer">
                      <h3 className="font-semibold text-amber-900 text-lg mb-3">{venue?.name || 'Venue'}</h3>
                      <div className="flex gap-1 mb-3">
                        {[...Array(5)].map((_, idx) => (
                          <div key={idx} className="w-6 h-6">
                            <CowboyBoot filled={idx < review.boots} size="sm" />
                          </div>
                        ))}
                      </div>
                      {review.comment && (
                        <p className="text-stone-600 text-sm line-clamp-3">{review.comment}</p>
                      )}
                      <p className="text-sm text-stone-400 mt-4">
                        by {review.user_email?.split('@')[0]}
                      </p>
                    </div>
                  </Link>
                );
              })()}
            </motion.div>

            <Button
              variant="outline"
              size="icon"
              onClick={() => setReviewIndex(prev => (prev + 1) % recentReviews.length)}
              className="border-amber-700 text-amber-700 hover:bg-amber-50"
            >
              <ChevronRight className="w-5 h-5" />
            </Button>
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
                    Cheyenne is home to {boots.length} iconic painted boots scattered throughout the city. Visit them all and collect proof with photos!
                  </p>
                  <div className="flex gap-6 items-start mb-6">
                    <ul className="text-amber-100 flex flex-wrap gap-x-4 gap-y-2 text-sm flex-1">
                      <li>✓ {boots.length} boots to discover</li>
                      <li>✓ Upload photos as proof</li>
                      <li>✓ Track your progress</li>
                      <li>✓ Complete the challenge</li>
                    </ul>

                    {/* Earn Badges Badge */}
                    <div className="transform rotate-12 flex-shrink-0">
                      <div className="relative">
                        <div className="bg-gradient-to-br from-yellow-400 via-amber-500 to-orange-600 text-amber-900 px-4 py-3 rounded-lg shadow-2xl border-4 border-yellow-300 animate-pulse">
                          <div className="text-center">
                            <div className="text-2xl mb-1">🏆</div>
                            <div className="font-bold text-sm" style={{ fontFamily: 'Rye, serif', textShadow: '1px 1px 2px rgba(0,0,0,0.2)' }}>
                              EARN
                            </div>
                            <div className="font-bold text-base" style={{ fontFamily: 'Rye, serif', textShadow: '1px 1px 2px rgba(0,0,0,0.2)' }}>
                              BADGES
                            </div>
                          </div>
                        </div>
                        <div className="absolute -inset-1 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-lg blur opacity-50 animate-pulse"></div>
                      </div>
                    </div>
                  </div>
                </div>
                <Link to={createPageUrl('Profile?defaultValue=bigboots')} className="flex-shrink-0">
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
          <Button
            variant={activeTab === 'shop' ? 'default' : 'outline'}
            onClick={() => { setActiveTab('shop'); setCurrentPage(1); }}
            className={activeTab === 'shop' ? 'bg-amber-600 hover:bg-amber-700' : 'border-amber-300 text-amber-700 hover:bg-amber-50'}
          >
            🛍️ Shop
          </Button>
          <Button
            variant={activeTab === 'chuck_wagons' ? 'default' : 'outline'}
            onClick={() => { setActiveTab('chuck_wagons'); setCurrentPage(1); }}
            className={activeTab === 'chuck_wagons' ? 'bg-amber-600 hover:bg-amber-700' : 'border-amber-300 text-amber-700 hover:bg-amber-50'}
          >
            🚚 Chuck Wagons
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
        ) : filteredVenues.length === 0 && filteredBoots.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <MapPin className="w-8 h-8 text-stone-400" />
            </div>
            <h3 className="text-lg font-medium text-stone-700 mb-2">No results found</h3>
            <p className="text-stone-500">Try adjusting your search or filters</p>
          </div>
        ) : (
          <>
          {/* Boots Results */}
          {filteredBoots.length > 0 && searchQuery && (
            <div className="mb-8">
              <h3 className="text-xl font-bold text-amber-900 mb-4" style={{ fontFamily: 'Rye, serif' }}>Big Boots</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredBoots.map((boot, i) => (
                  <motion.div
                    key={boot.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <div className="bg-gradient-to-br from-amber-100 to-orange-100 rounded-lg border-4 border-amber-900 p-6 hover:shadow-lg transition-shadow h-full flex flex-col">
                      <div className="text-4xl mb-3">👢</div>
                      <h4 className="text-lg font-bold text-amber-900 mb-2">{boot.name}</h4>
                      <button
                        onClick={() => {
                          const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(boot.address)}`;
                          window.open(url, '_blank', 'noopener,noreferrer');
                        }}
                        className="text-sm text-amber-800 flex items-start gap-2 flex-1 hover:text-amber-900 transition-colors"
                      >
                        <MapPin className="w-4 h-4 shrink-0 mt-0.5" />
                        <span className="text-left">{boot.address}</span>
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Venues Results */}
          {filteredVenues.length > 0 && (
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
          </>
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

                {/* Export & Suggestions */}
                <section className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex gap-3 justify-center">
                <Button 
                onClick={exportVenuesToExcel}
                variant="outline" 
                className="border-2 border-amber-800 text-amber-800 hover:bg-amber-50"
                >
                <Download className="w-5 h-5 mr-2" />
                Export Venues to Excel
                </Button>
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