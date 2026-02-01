import React from 'react';
import { cn } from "@/lib/utils";

const CowboyBoot = ({ filled, className, size }) => {
  const sizeMap = { sm: 16, md: 20, lg: 24 };
  const pixelSize = sizeMap[size] || 20;
  
  return (
    <svg 
      width={pixelSize} 
      height={pixelSize} 
      viewBox="0 0 24 24" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={cn("transition-all duration-200", className)}
    >
      {/* Cowboy boot with pointed toe and angled heel */}
      <path 
        d="M9 2 L9 11 L8 12 L8 15.5 L7 17 L7 18 L9.5 18 L10 16.5 L12 15.5 L18 15.5 C19 15.5 20.5 15 21 14 C21.5 13 21.5 12 21 11.5 L20 11 L15.5 11 L15.5 2 Z" 
        fill={filled ? "#8b4513" : "white"}
        stroke={filled ? "#654321" : "#9ca3af"}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      
      {/* Angled heel */}
      <path 
        d="M7 17 L7 20 C7 20.5 7.5 21 8 21 L10 21 C10.5 21 10.5 20.5 10.5 20 L10 18 Z"
        fill={filled ? "#654321" : "#e5e7eb"}
        stroke={filled ? "#654321" : "#9ca3af"}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      
      {/* Decorative stitching line */}
      <path 
        d="M11 4 L11 10"
        stroke={filled ? "#d2691e" : "#d1d5db"}
        strokeWidth="1"
        strokeDasharray="1.5,1.5"
      />
    </svg>
  );
};

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
              size={size}
              className=""
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