import React, { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, MapPin, Ticket } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

const categoryLabels = {
  music: "Live Music",
  festival: "Festival",
  sports: "Sports",
  community: "Community",
  arts: "Arts & Culture",
  food_drink: "Food & Drink"
};

const categoryColors = {
  music: "bg-violet-100 text-violet-800 border-violet-200",
  festival: "bg-amber-100 text-amber-800 border-amber-200",
  sports: "bg-emerald-100 text-emerald-800 border-emerald-200",
  community: "bg-sky-100 text-sky-800 border-sky-200",
  arts: "bg-rose-100 text-rose-800 border-rose-200",
  food_drink: "bg-orange-100 text-orange-800 border-orange-200"
};

export default function EventCard({ event }) {
  const [imageError, setImageError] = useState(false);
  const eventDate = new Date(event.date);
  const isPast = eventDate < new Date();

  const defaultImage = "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&q=80";

  return (
    <Card className={cn(
      "group overflow-hidden bg-white border-stone-200 transition-all duration-300 hover:shadow-lg",
      isPast && "opacity-60"
    )}>
      <div className="relative aspect-[16/9] overflow-hidden">
        <img
          src={imageError ? defaultImage : (event.image_url || defaultImage)}
          alt={event.title}
          onError={() => setImageError(true)}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        
        <Badge className={cn("absolute top-3 left-3 border", categoryColors[event.category])}>
          {categoryLabels[event.category] || event.category}
        </Badge>
        
        <div className="absolute top-3 right-3 bg-white rounded-lg p-2 text-center min-w-[52px] shadow-md">
          <div className="text-xs font-medium text-amber-700 uppercase">
            {format(eventDate, 'MMM')}
          </div>
          <div className="text-xl font-bold text-stone-800">
            {format(eventDate, 'd')}
          </div>
        </div>
        
        <div className="absolute bottom-3 left-3 right-3">
          <h3 className="text-white font-semibold text-lg leading-tight drop-shadow-md">
            {event.title}
          </h3>
        </div>
      </div>
      
      <div className="p-4 space-y-3">
        <div className="flex flex-wrap gap-3 text-sm text-stone-600">
          {event.time && (
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-amber-600" />
              <span>{event.time}</span>
            </div>
          )}
          {(event.venue_name || event.location) && (
            <div className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-amber-600" />
              <span className="truncate">{event.venue_name || event.location}</span>
            </div>
          )}
        </div>
        
        {event.description && (
          <p className="text-stone-600 text-sm line-clamp-2">
            {event.description}
          </p>
        )}
        
        <div className="flex items-center justify-between pt-2">
          {event.price && (
            <span className="text-amber-700 font-semibold">{event.price}</span>
          )}
          {event.ticket_url && (
            <Button 
              size="sm" 
              className="bg-amber-600 hover:bg-amber-700 text-white ml-auto"
              asChild
            >
              <a href={event.ticket_url} target="_blank" rel="noopener noreferrer">
                <Ticket className="w-4 h-4 mr-1.5" />
                Get Tickets
              </a>
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}