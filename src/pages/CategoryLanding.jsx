import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { MapPin, ArrowLeft, TreePine } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import VenueCard from '@/components/VenueCard';
import { useSEO } from '@/hooks/useSEO';

/**
 * High-intent category landing pages for SEO.
 * Renders real venue data + keyword-rich crawlable content.
 * The `pageKey` prop selects the configuration from LANDINGS below.
 */
const LANDINGS = {
  breakfast: {
    slug: 'breakfast',
    h1: 'Breakfast in Cheyenne, WY',
    title: 'Best Breakfast in Cheyenne, WY — Diners, Cafes & Homestyle Spots',
    description: 'Find the best breakfast spots in Cheyenne, Wyoming — from classic diners serving chicken-fried steak and pancakes to cozy coffee cafes. Hours, menus, photos, and directions.',
    intro: "Start your morning right in Cheyenne. From hearty homestyle diners flipping pancakes and chicken-fried steak to cozy coffee shops with fresh pastries, the Capital City has a breakfast spot for every craving. Browse local favorites with real hours, photos, and directions.",
    match: v => v.categories?.includes('restaurant') && (
      /breakfast|pancake|diner|cafe|coffee/i.test(v.name) ||
      (v.features || []).some(f => /breakfast|brunch|pancake/i.test(f)) ||
      /breakfast|pancake|omelet|waffle/i.test(v.description || '')
    ),
    keywords: ['Pancakes', 'Chicken-Fried Steak', 'Coffee', 'Brunch', 'Diners', 'Homestyle'],
    jsonLdType: 'ItemList',
  },
  bars: {
    slug: 'bars',
    h1: 'Bars in Cheyenne, WY',
    title: 'Bars in Cheyenne, WY — Cocktail Lounges, Dive Bars & Nightlife',
    description: 'Discover the best bars in Cheyenne, Wyoming — downtown cocktail lounges, classic dive bars, sports bars, and Western saloons. Hours, drink menus, photos, and directions.',
    intro: "Cheyenne's nightlife blends Old West saloons with modern cocktail bars and lively sports pubs. Whether you want a hand-crafted cocktail downtown, a cold beer at a local brewery taproom, or a dive bar with Frontier Days regulars, find your spot with real hours and directions.",
    match: v => v.categories?.includes('bar'),
    keywords: ['Cocktails', 'Dive Bars', 'Sports Bars', 'Saloons', 'Taprooms', 'Whiskey'],
    jsonLdType: 'ItemList',
  },
  breweries: {
    slug: 'breweries',
    h1: 'Breweries in Cheyenne, WY',
    title: 'Cheyenne Breweries — Craft Beer, Taprooms & Local Pints',
    description: 'Explore Cheyenne, Wyoming craft breweries and taprooms. Find local craft beer, flights, food pairings, hours, photos, and directions to every brewery in town.',
    intro: "Cheyenne's craft beer scene is growing fast. Visit local breweries for fresh pints, seasonal flights, and taproom grub — many with family-friendly patios and live music nights. Each listing includes hours, photos, and directions so you can plan your brewery crawl.",
    match: v => v.categories?.includes('brewery'),
    keywords: ['Craft Beer', 'Flights', 'Taprooms', 'IPAs', 'Stouts', 'Patios'],
    jsonLdType: 'ItemList',
  },
  'things-to-do-tonight': {
    slug: 'things-to-do-tonight',
    h1: 'Things to Do Tonight in Cheyenne, WY',
    title: 'Things to Do Tonight in Cheyenne — Live Music, Bars & Events',
    description: 'Looking for things to do tonight in Cheyenne, Wyoming? Find live music, trivia nights, watch parties, bars, breweries, and evening activities with hours and directions.',
    intro: "Not sure what to do tonight in Cheyenne? The Capital City comes alive after dark with live music halls, trivia nights at local bars, sports watch parties, brewery taprooms, and Western-themed entertainment. Browse open spots with real hours and plan your evening.",
    match: v => v.categories?.includes('music_hall') || v.categories?.includes('bar') || v.categories?.includes('brewery'),
    keywords: ['Live Music', 'Trivia Night', 'Watch Parties', 'Breweries', 'Date Night', 'Frontier Days'],
    jsonLdType: 'ItemList',
  },
  'greenway-walks': {
    slug: 'greenway-walks',
    h1: 'Greenway Walks Near Food in Cheyenne, WY',
    title: 'Greenway Walks Near Food in Cheyenne — Trails & Nearby Restaurants',
    description: 'Plan a Greenway walk near food in Cheyenne, Wyoming. Find paved trailheads with parking and nearby restaurants, coffee, and bars for a meal before or after your walk.',
    intro: "Combine a stroll on the 47-mile Greater Cheyenne Greenway with a meal nearby. Several trailheads — especially Lions Park and Holliday Park — sit within walking distance of downtown Cheyenne restaurants, coffee shops, and bars. Use our interactive Greenway map to find parking, then grab a bite before or after your walk.",
    match: () => false, // curated: no venue list
    keywords: ['Lions Park', 'Holliday Park', 'Dry Creek', 'Downtown Dining', 'Coffee', 'Trailhead Parking'],
    jsonLdType: 'Article',
    isGuide: true,
  },
};

export default function CategoryLanding({ pageKey }) {
  const params = useParams();
  const key = pageKey || params.category;
  const config = LANDINGS[key] || LANDINGS['bars'];

  useSEO({
    title: config.title,
    description: config.description,
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': config.jsonLdType,
      name: config.h1,
      description: config.description,
    },
  });

  const [user, setUser] = useState(null);
  useEffect(() => { base44.auth.me().then(setUser).catch(() => setUser(null)); }, []);

  const { data: venues = [], isLoading } = useQuery({
    queryKey: ['categoryLanding', key],
    queryFn: async () => {
      const all = await base44.entities.Venue.list('-rating_count', 200);
      return all.filter(config.match);
    },
    staleTime: 15 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  const [favorites, setFavorites] = useState([]);
  useEffect(() => {
    if (!user) return;
    base44.entities.Favorite.filter({ user_email: user.email }).then(setFavorites).catch(() => {});
  }, [user]);
  const isFavorite = (id) => favorites.some(f => f.venue_id === id);
  const toggleFav = (id) => user
    ? base44.entities.Favorite.filter({ user_email: user.email, venue_id: id }).then(async (ex) => {
        if (ex[0]) { await base44.entities.Favorite.delete(ex[0].id); }
        else { await base44.entities.Favorite.create({ user_email: user.email, venue_id: id }); }
        setFavorites(await base44.entities.Favorite.filter({ user_email: user.email }));
      })
    : base44.auth.redirectToLogin();

  return (
    <div className="min-h-screen bg-amber-50">
      {/* Hero */}
      <div className="bg-gradient-to-b from-amber-900 to-amber-800 text-amber-50 py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <Link to="/" className="inline-flex items-center text-amber-200 hover:text-white text-sm mb-4">
            <ArrowLeft className="w-4 h-4 mr-1" /> Back to Eat, Drink, Play Cheyenne
          </Link>
          <h1 className="text-3xl sm:text-4xl font-bold mb-3" style={{ fontFamily: 'Rye, serif' }}>
            {config.h1}
          </h1>
          <p className="text-amber-100 leading-relaxed max-w-2xl">{config.intro}</p>
        </div>
      </div>

      {/* Keyword chips */}
      <div className="max-w-4xl mx-auto px-4 py-6 flex flex-wrap gap-2">
        {config.keywords.map(k => (
          <span key={k} className="bg-white border border-amber-300 text-amber-800 text-sm rounded-full px-3 py-1 font-medium">
            {k}
          </span>
        ))}
      </div>

      {/* Greenway guide CTA */}
      {config.isGuide && (
        <div className="max-w-4xl mx-auto px-4 pb-8">
          <Link to="/GreenwayGuide">
            <div className="bg-green-50 border-2 border-green-300 rounded-2xl p-6 flex items-center gap-4 hover:shadow-md transition-shadow">
              <TreePine className="w-10 h-10 text-green-700 flex-shrink-0" />
              <div>
                <h2 className="text-xl font-bold text-green-900 mb-1" style={{ fontFamily: 'Rye, serif' }}>
                  Open the Interactive Greenway Map
                </h2>
                <p className="text-stone-700 text-sm">
                  GPS-enabled map with trailhead parking, live location tracking, and walking directions to all 10 trailheads.
                </p>
              </div>
            </div>
          </Link>
        </div>
      )}

      {/* Venue grid */}
      {!config.isGuide && (
        <div className="max-w-6xl mx-auto px-4 pb-16">
          <h2 className="text-2xl font-bold text-amber-900 mb-6" style={{ fontFamily: 'Rye, serif' }}>
            <MapPin className="inline w-6 h-6 mr-2 mb-1" />
            Local {config.h1.replace(' in Cheyenne, WY', '')}
          </h2>
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-64 rounded-xl" />)}
            </div>
          ) : venues.length === 0 ? (
            <p className="text-stone-600">No listings yet — check back soon or add a spot you know.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {venues.map((venue, i) => (
                <motion.div key={venue.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                  <VenueCard
                    venue={venue}
                    isFavorite={isFavorite(venue.id)}
                    onToggleFavorite={() => toggleFav(venue.id)}
                    hideAddress
                  />
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Crawlable SEO footer */}
      <div className="max-w-4xl mx-auto px-4 pb-16 text-stone-700 leading-relaxed">
        <p>
          Eat, Drink, Play Cheyenne is a community-built guide to {config.h1.toLowerCase()}. Every listing includes
          real hours, addresses, phone numbers, websites, price ranges, photos, and reviews from locals who've
          been there. Save your favorites, leave a boot rating, and help fellow Cheyenne residents and visitors
          discover the best of the Capital City.
        </p>
      </div>
    </div>
  );
}