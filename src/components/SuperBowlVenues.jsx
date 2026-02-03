import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Trophy, ChevronRight } from "lucide-react";
import VenueCard from "./VenueCard";

export default function SuperBowlVenues({ venues, favorites, user, onToggleFavorite }) {
  const superBowlVenues = venues.filter(v => v.broadcasts_superbowl && !v.permanently_closed);

  if (superBowlVenues.length === 0) return null;

  const isFavorite = (venueId) => {
    if (!user) return false;
    return favorites.some(f => f.venue_id === venueId && f.user_email === user.email);
  };

  return (
    <section className="max-w-6xl mx-auto px-4 sm:px-6 py-8 mb-8">
      <div className="relative overflow-hidden rounded-lg">
        {/* Football field background */}
        <style>{`
          .football-field {
            background: linear-gradient(to right, #1a4d2e 0%, #2d5f3f 50%, #1a4d2e 100%);
            position: relative;
          }
          .field-line {
            position: absolute;
            background: repeating-linear-gradient(
              90deg,
              transparent,
              transparent 9.09%,
              #f5f5f5 9.09%,
              #f5f5f5 10%
            );
            width: 100%;
            height: 100%;
            opacity: 0.3;
          }
          .yard-numbers {
            position: absolute;
            font-size: 5rem;
            font-weight: bold;
            color: rgba(245, 245, 245, 0.1);
            font-family: 'Arial Black', sans-serif;
            letter-spacing: 2px;
          }
        `}</style>
        
        <div className="football-field p-8 md:p-12 relative">
          <div className="field-line"></div>
          
          <div className="absolute top-4 right-8 yard-numbers">50</div>
          <div className="absolute bottom-4 left-8 yard-numbers transform rotate-180">50</div>

          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-6">
              <span className="text-4xl">🏈</span>
              <h2 className="text-3xl md:text-4xl font-bold text-white" style={{ fontFamily: 'Arial Black, sans-serif', letterSpacing: '2px' }}>
                SUPER BOWL WATCH PARTIES
              </h2>
              <span className="text-4xl">⌉</span>
            </div>

            <p className="text-white/90 text-lg mb-6 max-w-2xl">
              Cheyenne's best spots to catch the big game. Come celebrate with fellow fans!
            </p>

            {superBowlVenues.length <= 3 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {superBowlVenues.map((venue) => (
                  <VenueCard
                    key={venue.id}
                    venue={venue}
                    isFavorite={isFavorite(venue.id)}
                    onToggleFavorite={() => user ? onToggleFavorite(venue.id) : window.location.href = createPageUrl('Home')}
                  />
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1">
                  <p className="text-white text-lg font-semibold mb-2">
                    {superBowlVenues.length} venues broadcasting the Super Bowl
                  </p>
                  <p className="text-white/80 mb-4">
                    Find the perfect spot to watch the game with great food, drinks, and company!
                  </p>
                  <Button 
                    asChild
                    className="bg-white text-green-700 hover:bg-amber-50 font-bold text-lg px-6 py-3"
                  >
                    <Link to={createPageUrl('Home')}>
                      View All Venues
                      <ChevronRight className="w-5 h-5 ml-2" />
                    </Link>
                  </Button>
                </div>
                <div className="hidden md:grid grid-cols-3 gap-3 flex-1">
                  {superBowlVenues.slice(0, 3).map((venue) => (
                    <Link
                      key={venue.id}
                      to={createPageUrl(`VenueDetails?id=${venue.id}`)}
                      className="relative aspect-square rounded-lg overflow-hidden hover:opacity-90 transition-opacity"
                    >
                      <img
                        src={venue.image_url || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=300'}
                        alt={venue.name}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/30 flex items-end p-3">
                        <p className="text-white font-bold text-sm line-clamp-2">{venue.name}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}