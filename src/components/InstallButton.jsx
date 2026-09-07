import React, { useState } from 'react';
import { Smartphone, Share2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePwaInstall } from '@/hooks/usePwaInstall';
import { cn } from '@/lib/utils';

/**
 * Compact "Add to Home Screen" button for the nav bar.
 * Triggers the native PWA install prompt when available, or shows
 * brief iOS instructions as a fallback. Hides once installed.
 */
export default function InstallButton({ isHome }) {
  const { canInstall, isInstalled, promptInstall } = usePwaInstall();
  const [showTip, setShowTip] = useState(false);

  if (isInstalled) return null;

  const handleClick = async (e) => {
    e.stopPropagation();
    if (canInstall) {
      await promptInstall();
    } else {
      setShowTip((s) => !s);
    }
  };

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        onClick={handleClick}
        className={cn(
          'border-2 transition-colors',
          isHome
            ? 'text-white/90 hover:text-white hover:bg-white/10 border-transparent'
            : 'text-amber-800 hover:text-amber-50 hover:bg-amber-800 border-amber-700'
        )}
        aria-label="Add to Home Screen"
        title="Add to Home Screen"
      >
        <Smartphone className="w-5 h-5" />
      </Button>

      {showTip && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowTip(false)}
          />
          <div className="absolute right-0 top-full mt-2 z-50 w-64 bg-white rounded-lg shadow-lg border-2 border-amber-600 p-4 animate-in fade-in zoom-in-95">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-amber-700" />
                <h4 className="font-semibold text-sm text-stone-900">
                  Add to Home Screen
                </h4>
              </div>
              <button
                onClick={() => setShowTip(false)}
                className="text-stone-400 hover:text-stone-600"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <ol className="text-xs text-stone-600 space-y-1.5 list-decimal list-inside">
              <li>
                Tap the <Share2 className="inline w-3 h-3 mx-0.5 align-text-bottom" /> Share
                button in your browser toolbar.
              </li>
              <li>
                Select &ldquo;Add to Home Screen&rdquo; or &ldquo;Add to Dock&rdquo;.
              </li>
              <li>Tap &ldquo;Add&rdquo; to install Eat, Drink, Play Cheyenne.</li>
            </ol>
          </div>
        </>
      )}
    </div>
  );
}