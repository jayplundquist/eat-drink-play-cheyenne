import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ChevronUp, ChevronDown } from 'lucide-react';
import VenueCard from './VenueCard';

export default function RolodexView({ venues, isFavorite, onToggleFavorite, initialIndex = 0 }) {
  const [activeIndex, setActiveIndex] = useState(Math.min(initialIndex, Math.max(0, venues.length - 1)));
  const containerRef = useRef(null);
  const touchStartY = useRef(null);
  const lastWheelTime = useRef(0);

  // Clamp active index when venues change
  useEffect(() => {
    setActiveIndex(prev => Math.min(prev, Math.max(0, venues.length - 1)));
  }, [venues.length]);

  // Reset to initialIndex when it changes (e.g. user returns from a venue)
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

  // Mouse wheel handler with throttle
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const handleWheel = (e) => {
      e.preventDefault();
      const now = Date.now();
      if (now - lastWheelTime.current < 300) return;
      lastWheelTime.current = now;
      go(e.deltaY > 0 ? 1 : -1);
    };
    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [go]);

  // Keyboard handler
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'ArrowDown') { e.preventDefault(); go(1); }
      if (e.key === 'ArrowUp') { e.preventDefault(); go(-1); }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [go]);

  // Touch / swipe handler — attached via ref to allow preventDefault
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onTouchStart = (e) => { touchStartY.current = e.touches[0].clientY; };
    const onTouchMove = (e) => { e.preventDefault(); };
    const onTouchEnd = (e) => {
      if (touchStartY.current === null) return;
      const delta = touchStartY.current - e.changedTouches[0].clientY;
      if (Math.abs(delta) > 40) go(delta > 0 ? 1 : -1);
      touchStartY.current = null;
    };
    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchmove', onTouchMove, { passive: false });
    el.addEventListener('touchend', onTouchEnd, { passive: true });
    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', onTouchEnd);
    };
  }, [go]);

  if (venues.length === 0) return null;

  // Render a window of cards: 2 above, active, 2 below
  const VISIBLE = 2;
  const visibleCards = [];
  for (let offset = -VISIBLE; offset <= VISIBLE; offset++) {
    const idx = activeIndex + offset;
    if (idx < 0 || idx >= venues.length) continue;
    visibleCards.push({ venue: venues[idx], offset, idx });
  }

  return (
    <div className="flex flex-col items-center w-full select-none">
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

      {/* Rolodex stack */}
      <div
        ref={containerRef}
        className="relative w-full max-w-lg mx-auto"
        style={{ height: 420 }}
        tabIndex={0}
        onFocus={() => {}}
      >
        {/* Spine / rod */}
        <div className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-1 bg-amber-900/20 rounded-full z-0 pointer-events-none" />

        <AnimatePresence initial={false}>
          {visibleCards.map(({ venue, offset, idx }) => {
            const isActive = offset === 0;
            const absOffset = Math.abs(offset);
            const yPercent = offset * 55;
            const scale = isActive ? 1 : 1 - absOffset * 0.07;
            const opacity = isActive ? 1 : 1 - absOffset * 0.3;
            const zIndex = VISIBLE + 1 - absOffset;
            const rotateX = offset * -6;

            return (
              <motion.div
                key={venue.id}
                initial={{ opacity: 0, y: offset > 0 ? 60 : -60 }}
                animate={{
                  y: `${yPercent}%`,
                  scale,
                  opacity,
                  rotateX,
                  zIndex,
                }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  transformOrigin: 'center top',
                  perspective: 800,
                  zIndex,
                  pointerEvents: isActive ? 'auto' : 'none',
                }}
                onClick={() => { if (!isActive) go(offset > 0 ? 1 : -1); }}
              >
                {/* Rolodex tab */}
                <div
                  className="absolute -top-5 left-4 z-10 bg-amber-800 text-amber-100 text-xs font-bold px-3 py-0.5 rounded-t-md border-2 border-amber-900 border-b-0 truncate max-w-[160px]"
                  style={{ fontFamily: 'Rye, serif', letterSpacing: '0.05em' }}
                >
                  {venue.name}
                </div>

                {/* Card wrapper — active card links to venue */}
                <div className={`rounded-none overflow-hidden border-4 ${isActive ? 'border-amber-900 shadow-2xl shadow-amber-900/40' : 'border-amber-700/60 shadow-md'} transition-shadow bg-amber-50`}>
                  {isActive ? (
                    <Link
                      to={createPageUrl(`VenueDetails?id=${venue.id}`) + `&rolodex=${idx}`}
                      style={{ display: 'block' }}
                    >
                      <VenueCard
                        venue={venue}
                        isFavorite={isFavorite(venue.id)}
                        onToggleFavorite={onToggleFavorite}
                        hideAddress={false}
                      />
                    </Link>
                  ) : (
                    <VenueCard
                      venue={venue}
                      isFavorite={isFavorite(venue.id)}
                      onToggleFavorite={onToggleFavorite}
                      hideAddress={false}
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
        className="mt-4 p-2 rounded-full border-2 border-amber-700 text-amber-700 hover:bg-amber-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        <ChevronDown className="w-5 h-5" />
      </button>

      {/* Hint */}
      <p className="mt-2 text-xs text-amber-600/70 italic">Scroll, swipe, or use ↑↓ arrows · Click card to view details</p>
    </div>
  );
}