import React from 'react';
import { cn } from "@/lib/utils";

// Custom cowboy boot icon component
const CowboyBoot = ({ filled, className }) => (
  <svg 
    viewBox="0 0 24 24" 
    className={cn("w-5 h-5 transition-all duration-200", className)}
    fill={filled ? "currentColor" : "none"}
    stroke="currentColor"
    strokeWidth="1.5"
  >
    <path d="M6 20h12v-2H6v2zM18 18v-6c0-1-0.5-2-1.5-2.5L14 8V4c0-1-1-2-2-2s-2 1-2 2v4L7.5 9.5C6.5 10 6 11 6 12v6h12z" />
    <path d="M8 14h2M14 14h2" strokeLinecap="round" />
  </svg>
);

export default function BootRating({ rating = 0, size = "md", showCount = false, count = 0, interactive = false, onRate }) {
  const [hovered, setHovered] = React.useState(0);
  
  const sizes = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6"
  };

  const boots = [1, 2, 3, 4, 5];
  const displayRating = hovered || rating;

  return (
    <div className="flex items-center gap-1">
      <div className="flex items-center gap-0.5">
        {boots.map((boot) => (
          <button
            key={boot}
            type="button"
            disabled={!interactive}
            onClick={() => interactive && onRate?.(boot)}
            onMouseEnter={() => interactive && setHovered(boot)}
            onMouseLeave={() => interactive && setHovered(0)}
            className={cn(
              "transition-all duration-200",
              interactive && "cursor-pointer hover:scale-110",
              !interactive && "cursor-default"
            )}
          >
            <CowboyBoot 
              filled={boot <= displayRating}
              className={cn(
                sizes[size],
                boot <= displayRating ? "text-amber-600" : "text-stone-300"
              )}
            />
          </button>
        ))}
      </div>
      {showCount && count > 0 && (
        <span className="text-sm text-stone-500 ml-1">({count})</span>
      )}
    </div>
  );
}