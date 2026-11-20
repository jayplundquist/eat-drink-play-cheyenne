import React from 'react';

/**
 * The app's standard loading state — also used as the Suspense fallback while
 * a route's own code chunk downloads.
 */
export default function PageLoader() {
  return (
    <div className="fixed inset-0 flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
    </div>
  );
}