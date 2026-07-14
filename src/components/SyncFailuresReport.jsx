import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, RefreshCw, RotateCw, CheckCircle } from "lucide-react";
import { toast } from "sonner";

export default function SyncFailuresReport({ venues, onRetryComplete }) {
  const [retrying, setRetrying] = useState(false);
  const [retryIds, setRetryIds] = useState(new Set());
  const [retryProgress, setRetryProgress] = useState(null);
  const [dismissing, setDismissing] = useState(false);

  const failedVenues = venues.filter(v => v.sync_error);

  const dismissError = async (venue) => {
    setDismissing(true);
    try {
      await base44.entities.Venue.update(venue.id, { sync_error: "" });
      toast.success(`Cleared error for ${venue.name}`);
      onRetryComplete?.();
    } catch (err) {
      toast.error('Failed to clear error');
    } finally {
      setDismissing(false);
    }
  };

  const retryVenue = async (venue) => {
    setRetryIds(prev => new Set(prev).add(venue.id));
    try {
      const res = await base44.functions.invoke('syncVenueMonthly', { venue_ids: [venue.id] });
      const result = res.data?.results?.[0];
      if (result?.success) {
        toast.success(`Re-synced ${venue.name}`);
      } else {
        toast.error(`Still failing: ${result?.error || 'Unknown error'}`);
      }
      onRetryComplete?.();
    } catch (err) {
      toast.error('Retry failed: ' + (err.message || 'Unknown error'));
    } finally {
      setRetryIds(prev => { const next = new Set(prev); next.delete(venue.id); return next; });
    }
  };

  const retryAll = async () => {
    if (retrying) return;
    setRetrying(true);
    const ids = failedVenues.map(v => v.id);
    let successCount = 0;
    let failCount = 0;
    const CHUNK = 5;

    for (let i = 0; i < ids.length; i += CHUNK) {
      setRetryProgress({ done: i, total: ids.length });
      const chunkIds = ids.slice(i, i + CHUNK);
      try {
        const res = await base44.functions.invoke('syncVenueMonthly', { venue_ids: chunkIds });
        const results = res.data?.results || [];
        successCount += results.filter(r => r.success).length;
        failCount += results.filter(r => !r.success).length;
      } catch (err) {
        failCount += chunkIds.length;
      }
    }

    setRetrying(false);
    setRetryProgress(null);
    toast.success(`Retry complete: ${successCount} fixed, ${failCount} still failing`);
    onRetryComplete?.();
  };

  if (failedVenues.length === 0) {
    return (
      <div className="flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 rounded-lg p-3 border border-emerald-200">
        <CheckCircle className="w-4 h-4" />
        All venues synced successfully — no failures to report.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-rose-500" />
          <span className="font-medium text-stone-800">
            {failedVenues.length} venue{failedVenues.length !== 1 ? 's' : ''} failed to sync
          </span>
        </div>
        <Button
          onClick={retryAll}
          disabled={retrying}
          size="sm"
          className="bg-amber-600 hover:bg-amber-700 text-white"
        >
          <RotateCw className={`w-4 h-4 mr-2 ${retrying ? 'animate-spin' : ''}`} />
          {retrying ? (retryProgress ? `Retrying ${retryProgress.done}/${retryProgress.total}...` : 'Retrying...') : 'Retry All Failed'}
        </Button>
      </div>

      <div className="space-y-2 max-h-64 overflow-y-auto">
        {failedVenues.map(venue => (
          <div key={venue.id} className="flex items-start gap-3 p-3 bg-rose-50 border border-rose-200 rounded-lg">
            <div className="flex-1 min-w-0">
              <div className="font-medium text-stone-800 text-sm truncate">{venue.name}</div>
              <div className="text-xs text-rose-600 mt-1 break-words">{venue.sync_error}</div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => retryVenue(venue)}
                disabled={retryIds.has(venue.id) || retrying}
                className="h-7 px-2 text-xs border-amber-300 text-amber-700 hover:bg-amber-50"
              >
                <RefreshCw className={`w-3 h-3 mr-1 ${retryIds.has(venue.id) ? 'animate-spin' : ''}`} />
                Retry
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => dismissError(venue)}
                disabled={dismissing}
                className="h-7 px-2 text-xs text-stone-400 hover:text-stone-600"
              >
                Dismiss
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}