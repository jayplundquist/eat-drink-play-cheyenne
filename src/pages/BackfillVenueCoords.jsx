import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ArrowLeft, MapPin, Loader2, AlertTriangle, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function BackfillVenueCoords() {
  const [user, setUser] = useState(null);
  const [running, setRunning] = useState(false);
  const [autoRun, setAutoRun] = useState(false);
  const [result, setResult] = useState(null);
  const [skipped, setSkipped] = useState([]);
  const [totalUpdated, setTotalUpdated] = useState(0);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => setUser(null));
  }, []);

  async function runBatch({ dryRun = false } = {}) {
    setRunning(true);
    try {
      const res = await base44.functions.invoke('backfillVenueCoords', {
        batchSize: 20,
        dryRun,
      });
      const data = res.data;
      setResult(data);

      if (!dryRun) {
        setTotalUpdated((n) => n + (data.updated || 0));
      }

      // Accumulate skips across batches, de-duplicated by name.
      if (data.skipped?.length) {
        setSkipped((prev) => {
          const seen = new Set(prev.map((s) => s.name));
          return [...prev, ...data.skipped.filter((s) => !seen.has(s.name))];
        });
      }

      return data;
    } catch (e) {
      toast.error('Backfill failed. Check the function logs.');
      setAutoRun(false);
      return null;
    } finally {
      setRunning(false);
    }
  }

  // Each batch takes ~20 seconds because Nominatim is capped at one request
  // per second. Auto-run chains batches so you don't have to sit and click.
  useEffect(() => {
    if (!autoRun || running) return;
    if (result && result.remaining === 0) {
      setAutoRun(false);
      toast.success('Backfill complete');
      return;
    }
    const t = setTimeout(() => {
      runBatch({ dryRun: false });
    }, 500);
    return () => clearTimeout(t);
  }, [autoRun, running, result]);

  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-stone-800 mb-2">Access Denied</h2>
          <p className="text-stone-600 mb-4">Only admins can run the coordinate backfill</p>
          <Link to={createPageUrl('Home')}>
            <Button variant="outline">Back to Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  const remaining = result?.remaining;
  const done = result && remaining === 0;

  return (
    <div className="min-h-screen bg-stone-50 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <Link to={createPageUrl('ManageVenues')}>
          <Button variant="outline" size="sm" className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </Link>

        <h1 className="text-3xl font-bold text-stone-900">Venue Coordinates</h1>
        <p className="text-stone-600 mt-2 mb-6 max-w-2xl">
          Geocodes venues that have an address but no map pin. Runs 20 at a time — the geocoder
          allows one lookup per second, so each batch takes about 20 seconds.
        </p>

        <Card className="p-6 bg-white border-stone-200 mb-6">
          <div className="flex flex-wrap gap-3">
            <Button
              variant="outline"
              disabled={running || autoRun}
              onClick={() => runBatch({ dryRun: true })}
            >
              {running && !autoRun ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Checking
                </>
              ) : (
                'Dry run (no changes)'
              )}
            </Button>

            <Button
              className="bg-amber-600 hover:bg-amber-700 text-white"
              disabled={running || autoRun || done}
              onClick={() => runBatch({ dryRun: false })}
            >
              {running && !autoRun ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Running
                </>
              ) : (
                <>
                  <MapPin className="w-4 h-4 mr-2" />
                  Run one batch
                </>
              )}
            </Button>

            {!autoRun ? (
              <Button
                variant="outline"
                className="border-amber-300 text-amber-700"
                disabled={running || done}
                onClick={() => setAutoRun(true)}
              >
                Run all remaining
              </Button>
            ) : (
              <Button variant="outline" onClick={() => setAutoRun(false)}>
                Stop
              </Button>
            )}
          </div>

          {autoRun && (
            <p className="text-sm text-amber-700 mt-4 flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Running batches. Leave this tab open — closing it stops the run.
            </p>
          )}

          {result && (
            <div className="mt-6 pt-6 border-t border-stone-200 space-y-2">
              <p className="text-stone-800">{result.message}</p>
              <div className="flex flex-wrap gap-2">
                <Badge className="bg-green-100 text-green-800">
                  Updated this session: {totalUpdated}
                </Badge>
                <Badge className="bg-stone-100 text-stone-700">
                  Still missing pins: {result.totalMissingCoords ?? '—'}
                </Badge>
                {typeof remaining === 'number' && (
                  <Badge className="bg-stone-100 text-stone-700">
                    Remaining after this batch: {remaining}
                  </Badge>
                )}
              </div>
              {done && (
                <p className="text-green-700 flex items-center gap-2 pt-2">
                  <CheckCircle className="w-4 h-4" />
                  Nothing left to geocode.
                </p>
              )}
            </div>
          )}
        </Card>

        {skipped.length > 0 && (
          <Card className="p-6 bg-white border-amber-200">
            <h2 className="font-semibold text-stone-900 mb-1 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              Needs a manual pin ({skipped.length})
            </h2>
            <p className="text-sm text-stone-600 mb-4">
              The geocoder couldn't match these addresses. They have no coordinates and won't
              appear on any map until someone sets them by hand — which is better than guessing
              and sending people to the wrong block.
            </p>
            <div className="space-y-2">
              {skipped.map((s, i) => (
                <div
                  key={`${s.name}-${i}`}
                  className="flex flex-wrap items-baseline justify-between gap-2 border border-stone-200 rounded-lg p-3"
                >
                  <div>
                    <p className="font-medium text-stone-800">{s.name}</p>
                    <p className="text-sm text-stone-500">{s.address}</p>
                  </div>
                  <span className="text-xs text-stone-400">{s.reason}</span>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
