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
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {/* Boot sole */}
    <path d="M5 20h11c1 0 1.5-0.5 1.5-1v-1H5v2z" />
    {/* Boot shaft and heel */}
    <path d="M17.5 18v-4.5c0-1-0.5-1.5-1-2l-2-1.5V4.5c0-0.8-0.7-1.5-1.5-1.5s-1.5 0.7-1.5 1.5V10l-2.5 2c-0.5 0.4-1 1-1 2v4" />
    {/* Boot decoration lines */}
    <path d="M11 6v3" strokeWidth="1" />
    <path d="M7 14h3" strokeWidth="1" />
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