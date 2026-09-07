import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';

// Module-level singleton so every hook instance shares the same deferred
// install prompt (the browser only fires `beforeinstallprompt` once).
let _deferredPrompt = null;
let _listeners = new Set();
let _isInstalled = false;
let _initialized = false;
let _standaloneTracked = false;

function notify() {
  _listeners.forEach((fn) => fn());
}

function track(eventName, properties) {
  try {
    base44.analytics.track({ eventName, properties });
  } catch {
    /* analytics not available — ignore */
  }
}

function init() {
  if (_initialized || typeof window === 'undefined') return;
  _initialized = true;

  const standalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true;
  _isInstalled = standalone;

  if (standalone && !_standaloneTracked) {
    _standaloneTracked = true;
    track('pwa_launched_standalone');
  }

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    _deferredPrompt = e;
    notify();
  });

  window.addEventListener('appinstalled', () => {
    _isInstalled = true;
    _deferredPrompt = null;
    track('pwa_installed');
    notify();
  });
}

export function usePwaInstall() {
  const [, force] = useState(0);
  const rerender = () => force((v) => v + 1);

  useEffect(() => {
    init();
    _listeners.add(rerender);
    return () => {
      _listeners.delete(rerender);
    };
  }, []);

  const canInstall = !!_deferredPrompt && !_isInstalled;
  const isInstalled = _isInstalled;

  const promptInstall = async () => {
    if (!_deferredPrompt) return null;
    track('pwa_install_prompt_shown');
    _deferredPrompt.prompt();
    const { outcome } = await _deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      track('pwa_install_accepted');
    } else {
      track('pwa_install_dismissed');
    }
    _deferredPrompt = null;
    notify();
    return outcome;
  };

  return { canInstall, isInstalled, promptInstall };
}