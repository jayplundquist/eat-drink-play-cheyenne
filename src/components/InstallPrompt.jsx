import React, { useState, useEffect } from 'react';
import { X, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function InstallPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  useEffect(() => {
    // Check if app is already installed
    const isInstalled = () => {
      return window.matchMedia('(display-mode: standalone)').matches ||
             window.navigator.standalone === true;
    };

    // Check if user has dismissed the prompt
    const isDismissed = localStorage.getItem('install-prompt-dismissed') === 'true';

    // If app is installed, clear the dismissed flag
    if (isInstalled()) {
      localStorage.removeItem('install-prompt-dismissed');
      return;
    }

    // If not dismissed and not installed, show the prompt
    if (!isDismissed) {
      setShowPrompt(true);
    }

    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    // Listen for app install completion
    const handleAppInstalled = () => {
      setShowPrompt(false);
      localStorage.removeItem('install-prompt-dismissed');
      toast.success('App installed! You can now access it from your home screen');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
        setShowPrompt(false);
      }
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('install-prompt-dismissed', 'true');
  };

  if (!showPrompt) return null;

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