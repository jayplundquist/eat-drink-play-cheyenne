import React, { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Heart, MapPin, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { cn } from "@/lib/utils";
import BootRating from "./BootRating";

const categoryLabels = {
  restaurant: "Restaurant",
  bar: "Bar",
  brewery: "Brewery",
  music_hall: "Music Hall",
  activity: "Activity",
  recreation: "Recreation"
};

const foodTypeLabels = {
  asian: "Asian",
  international: "International",
  mexican: "Mexican",
  american: "American",
  steaks: "Steaks",
  bbq: "BBQ",
  dessert: "Dessert",
  fine_dining: "Fine Dining",
  pizza: "Pizza"
};

const categoryColors = {
  restaurant: "bg-amber-100 text-amber-800 border-amber-200",
  bar: "bg-rose-100 text-rose-800 border-rose-200",
  brewery: "bg-orange-100 text-orange-800 border-orange-200",
  music_hall: "bg-violet-100 text-violet-800 border-violet-200",
  activity: "bg-emerald-100 text-emerald-800 border-emerald-200",
  recreation: "bg-sky-100 text-sky-800 border-sky-200"
};

// Fallback for old venues with single category
const getCategories = (venue) => {
  if (venue.categories && venue.categories.length > 0) return venue.categories;
  if (venue.category) return [venue.category];
  return [];
};

export default function VenueCard({ venue, isFavorite, onToggleFavorite, showFavorite = true, hideImage = false, hideDescription = false, hideAddress = false }) {
  const [imageError, setImageError] = useState(false);
  const avgRating = venue.rating_count > 0 ? venue.rating_sum / venue.rating_count : 0;
  const categories = getCategories(venue);

  return (
    <Card className="group overflow-hidden bg-amber-50 border-4 border-amber-900 hover:border-amber-700 transition-all duration-300 hover:shadow-xl hover:shadow-amber-900/30 rounded-none">
      {!hideImage && venue.image_url ? (
        <Link to={createPageUrl(`VenueDetails?id=${venue.id}`)}>
          <div className="relative aspect-[4/3] overflow-hidden">
            <img
              src={venue.image_url}
              alt={venue.name}
              onError={() => setImageError(true)}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-amber-950/80 via-transparent to-transparent" />
            <div className="absolute inset-0 border-4 border-amber-900/50" />
            
            {categories.length > 0 && (
              <Badge className={cn("absolute top-3 left-3 border", categoryColors[categories[0]])}>
                {categoryLabels[categories[0]]}
              </Badge>
            )}
            
            {venue.price_range && (
              <span className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm text-stone-700 px-2 py-1 rounded-md text-sm font-medium">
                {venue.price_range}
              </span>
            )}
            
            <div className="absolute bottom-3 left-3 right-3">
              <h3 className="text-amber-100 font-bold text-lg leading-tight mb-1" style={{ fontFamily: 'Rye, serif', textShadow: '2px 2px 4px rgba(0,0,0,0.8)' }}>
                {venue.name}
              </h3>
              {venue.address && (
                <div className="flex items-center gap-1 text-amber-200 text-sm">
                  <MapPin className="w-3.5 h-3.5" />
                  <span className="truncate" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}>{venue.address}</span>
                </div>
              )}
            </div>
          </div>
        </Link>
      ) : (
        <Link to={createPageUrl(`VenueDetails?id=${venue.id}`)}>
          <div className="p-4 bg-gradient-to-b from-amber-100 to-orange-100 border-b-4 border-amber-900">
            <div className="flex items-start justify-between gap-2 mb-2">
              <h3 className="text-amber-900 font-bold text-lg leading-tight" style={{ fontFamily: 'Rye, serif' }}>
                {venue.name}
              </h3>
              {categories.length > 0 && (
                <Badge className={cn("border shrink-0", categoryColors[categories[0]])}>
                  {categoryLabels[categories[0]]}
                </Badge>
              )}
            </div>
            {venue.address && (
              <div className="flex items-center gap-1 text-amber-800 text-sm">
                <MapPin className="w-3.5 h-3.5" />
                <span className="truncate">{venue.address}</span>
              </div>
            )}
          </div>
        </Link>
      )}
      
      <div className="p-4 bg-gradient-to-b from-amber-50 to-orange-50 border-t-4 border-amber-900">
        <div className="flex items-center justify-between mb-2">
          <BootRating 
            rating={Math.round(avgRating)} 
            showCount 
            count={venue.rating_count || 0} 
          />
          
          {showFavorite && (
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.preventDefault();
                onToggleFavorite?.(venue.id);
              }}
              className="h-9 w-9 rounded-full hover:bg-rose-50"
            >
              <Heart 
                className={cn(
                  "w-5 h-5 transition-all",
                  isFavorite ? "fill-rose-500 text-rose-500" : "text-stone-400"
                )} 
              />
            </Button>
          )}
        </div>
        
        {venue.food_types && venue.food_types.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {venue.food_types.map((type, idx) => (
              <Badge key={idx} variant="outline" className="border-amber-600 text-amber-800 text-xs">
                {foodTypeLabels[type]}
              </Badge>
            ))}
          </div>
        )}
        
        {!hideDescription && venue.description && (
          <p className="text-stone-600 text-sm mt-3 line-clamp-2">
            {venue.description}
          </p>
        )}
      </div>
    </Card>
  );
}