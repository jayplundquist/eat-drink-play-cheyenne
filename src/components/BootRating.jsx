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
      {/* Boot outline */}
      <path 
        d="M8 2 L8 12 L7 13 L7 17 C7 18.5 7.5 19.5 9 19.5 L18 19.5 C19.5 19.5 21 18.5 21 16.5 L21 14 C21 12.5 20 12 18 12 L16 12 L16 2 Z" 
        fill={filled ? "#8b4513" : "white"}
        stroke={filled ? "#654321" : "#9ca3af"}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      
      {/* Boot heel */}
      <rect 
        x="7" 
        y="18" 
        width="3.5" 
        height="3" 
        rx="0.5" 
        fill={filled ? "#654321" : "#e5e7eb"}
        stroke={filled ? "#654321" : "#9ca3af"}
        strokeWidth="1.5"
      />
      
      {/* Spur star */}
      <circle 
        cx="8.5" 
        cy="19.5" 
        r="1.2" 
        fill="none"
        stroke={filled ? "#d4af37" : "#d1d5db"}
        strokeWidth="1.5"
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