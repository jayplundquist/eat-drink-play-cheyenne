import React, { useState, useEffect } from 'react';
import { X, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { usePwaInstall } from '@/hooks/usePwaInstall';

export default function InstallPrompt() {
  const { canInstall, isInstalled, promptInstall } = usePwaInstall();
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // Clear dismissed flag if the app is already installed
    if (isInstalled) {
      localStorage.removeItem('install-prompt-dismissed');
      setShowPrompt(false);
      return;
    }

    const isDismissed = localStorage.getItem('install-prompt-dismissed') === 'true';
    if (!isDismissed) {
      setShowPrompt(true);
    }
  }, [isInstalled]);

  const handleInstall = async () => {
    const outcome = await promptInstall();
    if (outcome === 'accepted') {
      setShowPrompt(false);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('install-prompt-dismissed', 'true');
  };

  // Don't show the popup if already installed or if the native prompt
  // isn't available (iOS users get the nav button + instructions instead).
  if (!showPrompt || isInstalled || !canInstall) return null;

  return (
    <div className="fixed bottom-4 right-4 z-40 max-w-sm">
      <div className="bg-white rounded-lg shadow-lg border-2 border-amber-600 p-6 animate-in slide-in-from-bottom">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3 flex-1">
            <Download className="w-6 h-6 text-amber-600 flex-shrink-0" />
            <div>
              <h3 className="font-bold text-stone-900">Add to Home Screen</h3>
              <p className="text-sm text-stone-600">Quick access to Eat, Drink, Play Cheyenne</p>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 text-stone-400 hover:text-stone-600 transition-colors"
            aria-label="Dismiss"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <Button
          onClick={handleInstall}
          className="w-full bg-amber-600 hover:bg-amber-700 text-white font-semibold"
        >
          Install
        </Button>
      </div>
    </div>
  );
}