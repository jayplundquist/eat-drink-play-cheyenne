import { useEffect } from 'react';

const DARK_QUERY = '(prefers-color-scheme: dark)';

/**
 * Follows the device's system appearance and toggles the `dark` class on <html>.
 * Inside an Android WebView this tracks the OS theme (and Android's
 * force-dark / WebView darkening settings) without any extra native bridge.
 */
export default function ThemeProvider({ children }) {
  useEffect(() => {
    const media = window.matchMedia?.(DARK_QUERY);
    if (!media) return;

    const apply = () => {
      const isDark = media.matches;
      document.documentElement.classList.toggle('dark', isDark);
      document.documentElement.style.colorScheme = isDark ? 'dark' : 'light';
    };

    apply();

    if (media.addEventListener) {
      media.addEventListener('change', apply);
      return () => media.removeEventListener('change', apply);
    }
    media.addListener?.(apply);
    return () => media.removeListener?.(apply);
  }, []);

  return children;
}