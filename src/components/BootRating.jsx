import React from 'react';
import { cn } from "@/lib/utils";

// You can customize the boot icon by changing this URL to your uploaded boot image
const BOOT_ICON_URL = "https://images.unsplash.com/photo-1608256246200-53e635b5b65f?w=100&q=80"; // Cowboy boot image

const CowboyBoot = ({ filled, className, size }) => {
  const sizeMap = { sm: 16, md: 20, lg: 24 };
  const pixelSize = sizeMap[size] || 20;
  
  return (
    <img 
      src={BOOT_ICON_URL}
      alt="boot"
      className={cn("transition-all duration-200 object-contain", className)}
      style={{ 
        width: `${pixelSize}px`, 
        height: `${pixelSize}px`,
        filter: filled ? 'none' : 'grayscale(100%) brightness(1.8)',
        opacity: filled ? 1 : 0.3
      }}
    />
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