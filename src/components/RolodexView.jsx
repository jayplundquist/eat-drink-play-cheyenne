import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ChevronUp, ChevronDown } from 'lucide-react';
import VenueCard from './VenueCard';

export default function RolodexView({ venues, isFavorite, onToggleFavorite, initialIndex = 0 }) {
  const [activeIndex, setActiveIndex] = useState(Math.min(initialIndex, Math.max(0, venues.length - 1)));
  const wrapperRef = useRef(null);
  const touchStartY = useRef(null);
  const lastWheelTime = useRef(0);

  useEffect(() => {
    setActiveIndex(prev => Math.min(prev, Math.max(0, venues.length - 1)));
  }, [venues.length]);

  useEffect(() => {
    if (initialIndex >= 0 && initialIndex < venues.length) {
      setActiveIndex(initialIndex);
    }
  }, [initialIndex]);

  const go = useCallback((dir) => {
    setActiveIndex(prev => {
      const next = prev + dir;
      if (next < 0 || next >= venues.length) return prev;
      return next;
    });
  }, [venues.length]);

  // Attach wheel to the outer wrapper so preventDefault blocks page scroll
  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const handleWheel = (e) => {
      e.preventDefault();
      e.stopPropagation();
      const now = Date.now();
      if (now - lastWheelTime.current < 350) return;
      lastWheelTime.current = now;
      go(e.deltaY > 0 ? 1 : -1);
    };
    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [go]);

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'ArrowDown') { e.preventDefault(); go(1); }
      if (e.key === 'ArrowUp') { e.preventDefault(); go(-1); }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [go]);

  const handleTouchStart = (e) => { touchStartY.current = e.touches[0].clientY; };
  const handleTouchEnd = (e) => {
    if (touchStartY.current === null) return;
    const delta = touchStartY.current - e.changedTouches[0].clientY;
    if (Math.abs(delta) > 40) go(delta > 0 ? 1 : -1);
    touchStartY.current = null;
  };

  if (venues.length === 0) return null;

  // Only show 1 card above and 1 below — heavily obscured
  const VISIBLE = 1;
  const visibleCards = [];
  for (let offset = -VISIBLE; offset <= VISIBLE; offset++) {
    const idx = activeIndex + offset;
    if (idx < 0 || idx >= venues.length) continue;
    visibleCards.push({ venue: venues[idx], offset, idx });
  }

  const CARD_HEIGHT = 440;
  const PEEK_OFFSET = 80; // px each background card peeks by

  return (
    <div
      ref={wrapperRef}
      className="flex flex-col items-center w-full select-none"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Counter */}
      <div className="text-amber-800 text-sm font-medium mb-3 font-mono">
        {activeIndex + 1} / {venues.length}
      </div>

      {/* Up button */}
      <button
        onClick={() => go(-1)}
        disabled={activeIndex === 0}
        className="mb-2 p-2 rounded-full border-2 border-amber-700 text-amber-700 hover:bg-amber-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        <ChevronUp className="w-5 h-5" />
      </button>

      {/* Rolodex stack — clipped so background cards don't overflow */}
      <div
        className="relative w-full max-w-lg mx-auto overflow-hidden"
        style={{ height: CARD_HEIGHT + PEEK_OFFSET }}
      >
        <AnimatePresence initial={false}>
          {visibleCards.map(({ venue, offset, idx }) => {
            const isActive = offset === 0;
            const isBelow = offset > 0;
            const isAbove = offset < 0;

            // Active card sits at top; below card peeks from bottom; above barely visible at top
            const yPx = isActive ? 0 : isBelow ? CARD_HEIGHT - PEEK_OFFSET : -(CARD_HEIGHT - PEEK_OFFSET);
            const scale = isActive ? 1 : 0.93;
            const opacity = isActive ? 1 : 0.25;
            const blur = isActive ? 0 : 8;
            const zIndex = isActive ? 10 : 1;

            return (
              <motion.div
                key={venue.id}
                initial={false}
                animate={{ y: yPx, scale, opacity, zIndex }}
                transition={{ type: 'spring', stiffness: 320, damping: 32 }}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  zIndex,
                  pointerEvents: isActive ? 'auto' : 'none',
                  filter: `blur(${blur}px)`,
                  height: CARD_HEIGHT,
                  overflow: 'hidden',
                }}
              >
                {/* Rolodex tab */}
                {isActive && (
                  <div
                    className="absolute -top-5 left-4 z-20 bg-amber-800 text-amber-100 text-xs font-bold px-3 py-0.5 rounded-t-md border-2 border-amber-900 border-b-0 truncate max-w-[200px]"
                    style={{ fontFamily: 'Rye, serif', letterSpacing: '0.05em' }}
                  >
                    {venue.name}
                  </div>
                )}

                <div className={`overflow-hidden border-4 ${isActive ? 'border-amber-900 shadow-2xl shadow-amber-900/40' : 'border-amber-700/40'} bg-amber-50 h-full`}>
                  {isActive ? (
                    <Link
                      to={createPageUrl(`VenueDetails?id=${venue.id}`) + `&rolodex=${idx}`}
                      style={{ display: 'block' }}
                    >
                      <VenueCard
                        venue={venue}
                        isFavorite={isFavorite(venue.id)}
                        onToggleFavorite={onToggleFavorite}
                      />
                    </Link>
                  ) : (
                    <VenueCard
                      venue={venue}
                      isFavorite={isFavorite(venue.id)}
                      onToggleFavorite={onToggleFavorite}
                      showFavorite={false}
                    />
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Down button */}
      <button
        onClick={() => go(1)}
        disabled={activeIndex === venues.length - 1}
        className="mt-3 p-2 rounded-full border-2 border-amber-700 text-amber-700 hover:bg-amber-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        <ChevronDown className="w-5 h-5" />
      </button>

      <p className="mt-2 text-xs text-amber-600/70 italic">Scroll, swipe, or use ↑↓ arrows · Click card to open</p>
    </div>
  );
}