import React, { useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';

const THRESHOLD = 64;
const MAX_PULL = 96;

/**
 * Native-style pull-to-refresh for a page's content.
 *
 * It listens for touch gestures on the window while the page is scrolled to the
 * top, so it needs no wrapping element: it can never shift a page's layout, its
 * fixed action bars or the sticky header. The indicator is pinned just below
 * the header and well above the bottom tab bar.
 */
export default function PullToRefresh({ onRefresh }) {
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef(null);
  const pullRef = useRef(0);
  const refreshingRef = useRef(false);
  const onRefreshRef = useRef(onRefresh);

  onRefreshRef.current = onRefresh;

  useEffect(() => {
    const reset = () => {
      startY.current = null;
      pullRef.current = 0;
      setPull(0);
    };

    const handleStart = (event) => {
      if (refreshingRef.current) return;
      if (window.scrollY > 0) return;
      startY.current = event.touches[0].clientY;
    };

    const handleMove = (event) => {
      if (startY.current == null || refreshingRef.current) return;
      if (window.scrollY > 0) {
        reset();
        return;
      }
      const delta = event.touches[0].clientY - startY.current;
      if (delta <= 0) {
        reset();
        return;
      }
      const next = Math.min(delta * 0.5, MAX_PULL);
      pullRef.current = next;
      setPull(next);
    };

    const handleEnd = async () => {
      if (startY.current == null) return;
      startY.current = null;

      if (pullRef.current < THRESHOLD) {
        reset();
        return;
      }

      refreshingRef.current = true;
      setRefreshing(true);
      setPull(THRESHOLD);
      try {
        await onRefreshRef.current?.();
      } finally {
        refreshingRef.current = false;
        setRefreshing(false);
        reset();
      }
    };

    window.addEventListener('touchstart', handleStart, { passive: true });
    window.addEventListener('touchmove', handleMove, { passive: true });
    window.addEventListener('touchend', handleEnd);
    window.addEventListener('touchcancel', handleEnd);

    return () => {
      window.removeEventListener('touchstart', handleStart);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleEnd);
      window.removeEventListener('touchcancel', handleEnd);
    };
  }, []);

  const visible = pull > 4 || refreshing;

  return (
    <div
      aria-hidden="true"
      className="md:hidden pointer-events-none fixed left-0 right-0 z-40 flex justify-center"
      style={{
        top: 'calc(env(safe-area-inset-top, 0px) + 4.25rem)',
        transform: `translateY(${Math.max(pull - 44, -44)}px)`,
        opacity: visible ? 1 : 0,
        transition: startY.current == null ? 'transform 220ms ease, opacity 220ms ease' : 'none',
      }}
    >
      <div className="bg-card border-2 border-border rounded-full shadow-lg h-11 w-11 flex items-center justify-center">
        <Loader2
          className={refreshing ? 'w-5 h-5 text-primary animate-spin' : 'w-5 h-5 text-primary'}
          style={refreshing ? undefined : { transform: `rotate(${pull * 3}deg)` }}
        />
      </div>
    </div>
  );
}