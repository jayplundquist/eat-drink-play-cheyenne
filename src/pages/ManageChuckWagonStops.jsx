import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { CheckCircle, XCircle, ArrowLeft, Clock } from 'lucide-react';
import { toast } from 'sonner';

export default function ManageChuckWagonStops() {
  const [user, setUser] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => setUser(null));
  }, []);

  const { data: stops = [], isLoading } = useQuery({
    queryKey: ['allChuckWagonStops'],
    queryFn: () => base44.entities.ChuckWagonStop.list('-created_date'),
    enabled: !!user && user.role === 'admin',
  });

  const publishMutation = useMutation({
    mutationFn: async (id) => base44.entities.ChuckWagonStop.update(id, { status: 'active' }),
    onSuccess: () => {
      toast.success('Stop published');
      queryClient.invalidateQueries({ queryKey: ['allChuckWagonStops'] });
      queryClient.invalidateQueries({ queryKey: ['chuckWagonStops'] });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async (id) => base44.entities.ChuckWagonStop.update(id, { status: 'removed' }),
    onSuccess: () => {
      toast.success('Stop rejected');
      queryClient.invalidateQueries({ queryKey: ['allChuckWagonStops'] });
    },
  });

  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-stone-800 mb-2">Access Denied</h2>
          <p className="text-stone-600 mb-4">Only admins can review chuck wagon stops</p>
          <Link to={createPageUrl('Home')}>
            <Button variant="outline">Back to Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  const pending = stops.filter((s) => s.status === 'draft');
  const resolved = stops.filter((s) => s.status !== 'draft');

  return (
    <div className="min-h-screen bg-stone-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <Link to={createPageUrl('ManageVenues')}>
          <Button variant="outline" size="sm" className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </Link>

        <h1 className="text-3xl font-bold text-stone-900">Chuck Wagon Stops</h1>
        <p className="text-stone-600 mt-2 mb-8">
          Review submitted stops before they appear on the public map.
        </p>

        <h2 className="text-lg font-semibold text-stone-800 mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5 text-amber-600" />
          Awaiting review ({pending.length})
        </h2>

        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-28" />
            ))}
          </div>
        ) : pending.length === 0 ? (
          <Card className="p-6 text-center bg-white border-stone-200 mb-8">
            <p className="text-stone-500">Nothing waiting on you</p>
          </Card>
        ) : (
          <div className="space-y-4 mb-8">
            {pending.map((s) => (
              <Card key={s.id} className="p-6 bg-white border-stone-200">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-stone-900 text-lg">{s.venue_name}</h3>
                    <p className="text-sm text-stone-700">{s.location_label}</p>
                    {s.address && <p className="text-sm text-stone-500">{s.address}</p>}
                    <p className="text-sm text-stone-600 mt-1">
                      {(s.stop_dates || []).join(', ')} · {s.start_time}–{s.end_time}
                    </p>
                    {s.notes && <p className="text-sm text-stone-500 mt-1">{s.notes}</p>}
                    <p className="text-xs text-stone-400 mt-2">{s.created_by_email}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => publishMutation.mutate(s.id)}
                      disabled={publishMutation.isPending}
                      className="bg-green-600 hover:bg-green-700 text-white"
                      size="sm"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Publish
                    </Button>
                    <Button
                      onClick={() => rejectMutation.mutate(s.id)}
                      disabled={rejectMutation.isPending}
                      variant="outline"
                      className="border-red-300 text-red-600 hover:bg-red-50"
                      size="sm"
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Reject
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {resolved.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-stone-800 mb-4">Reviewed</h2>
            <div className="space-y-3">
              {resolved.map((s) => (
                <Card key={s.id} className="p-4 bg-stone-50 border-stone-200">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1">
                      <p className="font-medium text-stone-800">{s.venue_name}</p>
                      <p className="text-sm text-stone-600">
                        {s.location_label} · {(s.stop_dates || []).join(', ')}
                      </p>
                    </div>
                    <Badge
                      className={
                        s.status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : s.status === 'cancelled'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-red-100 text-red-800'
                      }
                    >
                      {s.status}
                    </Badge>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
