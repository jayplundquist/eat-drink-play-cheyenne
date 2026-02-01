import React from 'react';
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { 
  Utensils, 
  Wine, 
  Beer, 
  Music, 
  Compass, 
  TreePine,
  LayoutGrid
} from "lucide-react";

const categories = [
  { value: "all", label: "All", icon: LayoutGrid },
  { value: "restaurant", label: "Restaurants", icon: Utensils },
  { value: "bar", label: "Bars", icon: Wine },
  { value: "brewery", label: "Breweries", icon: Beer },
  { value: "music_hall", label: "Music Halls", icon: Music },
  { value: "activity", label: "Activities", icon: Compass },
  { value: "recreation", label: "Recreation", icon: TreePine },
];

export default function CategoryFilter({ selected, onSelect }) {
  return (
    <div className="flex flex-wrap gap-2">
      {categories.map(({ value, label, icon: Icon }) => (
        <Button
          key={value}
          variant={selected === value ? "default" : "outline"}
          size="sm"
          onClick={() => onSelect(value)}
          className={cn(
            "rounded-full transition-all duration-200",
            selected === value 
              ? "bg-amber-600 hover:bg-amber-700 text-white border-amber-600" 
              : "border-stone-300 text-stone-600 hover:border-amber-400 hover:text-amber-700 hover:bg-amber-50"
          )}
        >
          <Icon className="w-4 h-4 mr-1.5" />
          {label}
        </Button>
      ))}
    </div>
  );
}