import React, { useState, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { RefreshCw, CheckCircle, AlertCircle, XCircle } from "lucide-react";
import { toast } from "sonner";

export default function GoogleSyncButton({ venues = [], onSyncComplete }) {
  const [syncing, setSyncing] = useState(false);
  const [progress, setProgress] = useState(null);
  const stopRef = useRef(false);

  const BATCH_SIZE = 10;
  const totalVenues = venues.length;

  const handleSyncAll = async () => {
    if (syncing || totalVenues === 0) return;
    setSyncing(true);
    stopRef.current = false;

    // Chunk explicit venue IDs so every venue is processed exactly once
    const chunks = [];
    for (let i = 0; i < venues.length; i += BATCH_SIZE) {
      chunks.push(venues.slice(i, i + BATCH_SIZE).map(v => v.id));
    }

    let totalSynced = 0;
    let totalFailed = 0;

    for (let i = 0; i < chunks.length; i++) {
      if (stopRef.current) break;
      setProgress({ batch: i + 1, total: chunks.length, synced: totalSynced, failed: totalFailed });
      let success = false;
      for (let attempt = 0; attempt < 3 && !success && !stopRef.current; attempt++) {
        try {
          const res = await base44.functions.invoke('syncVenueMonthly', { venue_ids: chunks[i] });
          const results = res.data?.results || [];
          const successes = results.filter(r => r.success).length;
          const failures = results.filter(r => !r.success).length;
          totalSynced += successes;
          totalFailed += failures;
          success = true;

          if (successes === 0 && failures > 0) {
            toast.error('Sync stopped — integration credits may be exhausted.');
            stopRef.current = true;
          }
        } catch (err) {
          if (attempt < 2) {
            toast.warning(`Batch ${i + 1} failed, retrying... (${attempt + 1}/2)`);
            await new Promise(r => setTimeout(r, 2000));
          } else {
            totalFailed += chunks[i].length;
          }
        }
      }
    }

    setSyncing(false);
    setProgress(null);
    if (!stopRef.current && totalFailed > 0 && totalSynced === 0) {
      toast.error('No venues synced. Check your integration credits.');
    } else if (!stopRef.current) {
      toast.success(`Sync complete! ${totalSynced} venues updated from Google.`);
    } else {
      toast.info(`Sync stopped. ${totalSynced} venues updated so far.`);
    }
    onSyncComplete?.();
  };

  const handleStop = () => {
    stopRef.current = true;
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2 flex-wrap">
        <Button
          onClick={handleSyncAll}
          disabled={syncing || !totalVenues}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
          {syncing ? 'Syncing...' : 'Sync All from Google'}
        </Button>
        {syncing && (
          <Button
            variant="outline"
            onClick={handleStop}
            className="border-rose-300 text-rose-600 hover:bg-rose-50"
          >
            <XCircle className="w-4 h-4 mr-2" />
            Stop
          </Button>
        )}
      </div>
      {progress && (
        <div className="text-sm text-stone-600 flex items-center gap-4 flex-wrap">
          <span className="font-medium">Batch {progress.batch} of {progress.total}</span>
          <span className="text-emerald-600 flex items-center gap-1">
            <CheckCircle className="w-3.5 h-3.5" />{progress.synced} synced
          </span>
          {progress.failed > 0 && (
            <span className="text-rose-600 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" />{progress.failed} failed
            </span>
          )}
        </div>
      )}
      <p className="text-xs text-stone-400">
        Pulls fresh description, website &amp; phone for every venue in batches of 10. Runs until all venues are updated or credits run out.
      </p>
    </div>
  );
}