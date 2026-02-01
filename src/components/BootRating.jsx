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
      {/* Boot shaft */}
      <path d="M8 3 L8 12 L9 13 L15 13 L16 12 L16 3 Z" fill={filled ? "#8b4513" : "#d4d4d4"} />
      
      {/* Boot foot */}
      <path d="M7 12 L7 16 C7 17 7.5 18 9 18 L18 18 C19 18 20 17.5 20 16 L20 14 C20 13 19 12 18 12 Z" fill={filled ? "#a0522d" : "#e5e5e5"} />
      
      {/* Boot heel */}
      <rect x="7" y="17" width="3" height="4" rx="0.5" fill={filled ? "#654321" : "#b8b8b8"} />
      
      {/* Boot toe detail */}
      <ellipse cx="18" cy="15" rx="1.5" ry="1" fill={filled ? "#654321" : "#b8b8b8"} opacity="0.6" />
      
      {/* Stitching detail */}
      <line x1="10" y1="5" x2="10" y2="11" stroke={filled ? "#d2691e" : "#a8a8a8"} strokeWidth="0.5" strokeDasharray="1,1" />
      <line x1="14" y1="5" x2="14" y2="11" stroke={filled ? "#d2691e" : "#a8a8a8"} strokeWidth="0.5" strokeDasharray="1,1" />
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