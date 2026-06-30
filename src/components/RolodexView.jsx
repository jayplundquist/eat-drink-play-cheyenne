import React, { useState, useEffect, useRef, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ChevronUp, ChevronDown } from 'lucide-react';
import VenueCard from './VenueCard';

export default function RolodexView({ venues, isFavorite, onToggleFavorite, initialIndex = 0 }) {
  const [activeIndex, setActiveIndex] = useState(() => Math.min(Math.max(initialIndex, 0), venues.length - 1));
  const [direction, setDirection] = useState(0); // 1 = next, -1 = prev
  const containerRef = useRef(null);
  const touchStartY = useRef(null);
  const lastWheelTime = useRef(0);
  const isInside = useRef(false);

  useEffect(() => {
    if (initialIndex >= 0 && initialIndex < venues.length) {
      setActiveIndex(initialIndex);
    }
  }, [initialIndex]);

  const go = useCallback((dir) => {
    setActiveIndex(prev => {
      const next = prev + dir;
      if (next < 0 || next >= venues.length) return prev;
      setDirection(dir);
      return next;
    });
  }, [venues.length]);

  // Block page scroll only while mouse is over the rolodex
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onEnter = () => { isInside.current = true; };
    const onLeave = () => { isInside.current = false; };

    const handleWheel = (e) => {
      if (!isInside.current) return;
      e.preventDefault();
      const now = Date.now();
      if (now - lastWheelTime.current < 350) return;
      lastWheelTime.current = now;
      go(e.deltaY > 0 ? 1 : -1);
    };

    el.addEventListener('mouseenter', onEnter);
    el.addEventListener('mouseleave', onLeave);
    // Attach to window so we can preventDefault on the native scroll
    window.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      el.removeEventListener('mouseenter', onEnter);
      el.removeEventListener('mouseleave', onLeave);
      window.removeEventListener('wheel', handleWheel);
    };
  }, [go]);

  // Keyboard
  useEffect(() => {
    const handleKey = (e) => {
      if (!isInside.current) return;
      if (e.key === 'ArrowDown') { e.preventDefault(); go(1); }
      if (e.key === 'ArrowUp') { e.preventDefault(); go(-1); }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [go]);

  // Touch swipe
  const handleTouchStart = (e) => { touchStartY.current = e.touches[0].clientY; };
  const handleTouchMove = (e) => { e.preventDefault(); }; // block page scroll during swipe
  const handleTouchEnd = (e) => {
    if (touchStartY.current === null) return;
    const delta = touchStartY.current - e.changedTouches[0].clientY;
    if (Math.abs(delta) > 40) go(delta > 0 ? 1 : -1);
    touchStartY.current = null;
  };

  if (venues.length === 0) return null;

  const venue = venues[activeIndex];

  return (
    <div
      ref={containerRef}
      className="flex flex-col items-center w-full select-none"
      onMouseEnter={() => { isInside.current = true; }}
      onMouseLeave={() => { isInside.current = false; }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
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

      {/* Card area — fixed size, cards animate in/out */}
      <div className="relative w-full max-w-lg mx-auto overflow-hidden" style={{ minHeight: 480 }}>
        {/* Rolodex tab */}
        <div
          className="absolute -top-5 left-4 z-20 bg-amber-800 text-amber-100 text-xs font-bold px-3 py-0.5 rounded-t-md border-2 border-amber-900 border-b-0 truncate max-w-[220px]"
          style={{ fontFamily: 'Rye, serif', letterSpacing: '0.05em' }}
        >
          {venue.name}
        </div>

        <AnimatePresence mode="wait" initial={false} custom={direction}>
          <motion.div
            key={venue.id}
            custom={direction}
            variants={{
              enter: (d) => ({ y: d > 0 ? 60 : -60, opacity: 0, scale: 0.97 }),
              center: { y: 0, opacity: 1, scale: 1 },
              exit: (d) => ({ y: d > 0 ? -60 : 60, opacity: 0, scale: 0.97 }),
            }}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.22, ease: 'easeInOut' }}
            className="border-4 border-amber-900 shadow-2xl shadow-amber-900/30 bg-amber-50 overflow-hidden"
          >
            <Link
              to={createPageUrl(`VenueDetails?id=${venue.id}`) + `&rolodex=${activeIndex}`}
              style={{ display: 'block' }}
            >
              <VenueCard
                venue={venue}
                isFavorite={isFavorite(venue.id)}
                onToggleFavorite={onToggleFavorite}
              />
            </Link>
          </motion.div>
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