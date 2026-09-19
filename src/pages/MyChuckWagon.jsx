import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { MapPin, Radio, Plus, Trash2, ArrowLeft, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import StopLocationPicker from '@/components/chuckwagons/StopLocationPicker';

const emptyStop = {
  location_label: '',
  address: '',
  lat: null,
  lng: null,
  stop_dates: [''],
  start_time: '11:00',
  end_time: '14:00',
  notes: '',
};

export default function MyChuckWagon() {
  const [user, setUser] = useState(null);
  const [locating, setLocating] = useState(false);
  const [draft, setDraft] = useState(emptyStop);
  const [showForm, setShowForm] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => setUser(null));
  }, []);

  const { data: wagons = [], isLoading } = useQuery({
    queryKey: ['myChuckWagons', user?.email],
    queryFn: () => base44.entities.Venue.filter({ claimed_by: user.email }),
    enabled: !!user?.email,
  });

  const myWagons = wagons.filter((v) => (v.categories || []).includes('food_trucks'));
  const wagon = myWagons[0];

  const { data: stops = [] } = useQuery({
    queryKey: ['myStops', wagon?.id],
    queryFn: () => base44.entities.ChuckWagonStop.filter({ venue_id: wagon.id }),
    enabled: !!wagon?.id,
  });

  const goLiveMutation = useMutation({
    mutationFn: async ({ lat, lng }) => {
      await base44.entities.Venue.update(wagon.id, {
        is_live: true,
        live_lat: lat,
        live_lng: lng,
        live_updated_at: new Date().toISOString(),
      });
    },
    onSuccess: () => {
      toast.success("You're on the map");
      queryClient.invalidateQueries({ queryKey: ['myChuckWagons'] });
      queryClient.invalidateQueries({ queryKey: ['chuckWagons'] });
    },
    onError: () => toast.error("Couldn't update your location. Try again."),
  });

  const goOfflineMutation = useMutation({
    mutationFn: async () => {
      await base44.entities.Venue.update(wagon.id, {
        is_live: false,
        live_updated_at: new Date().toISOString(),
      });
    },
    onSuccess: () => {
      toast.success("You're off the map");
      queryClient.invalidateQueries({ queryKey: ['myChuckWagons'] });
      queryClient.invalidateQueries({ queryKey: ['chuckWagons'] });
    },
  });

  const updateDetailsMutation = useMutation({
    mutationFn: async (fields) => base44.entities.Venue.update(wagon.id, fields),
    onSuccess: () => {
      toast.success('Updated');
      queryClient.invalidateQueries({ queryKey: ['myChuckWagons'] });
    },
  });

  const addStopMutation = useMutation({
    mutationFn: async (stop) => {
      const dates = stop.stop_dates.filter(Boolean);
      const last = dates[dates.length - 1];
      await base44.entities.ChuckWagonStop.create({
        venue_id: wagon.id,
        venue_name: wagon.name,
        location_label: stop.location_label,
        address: stop.address,
        lat: stop.lat,
        lng: stop.lng,
        stop_dates: dates,
        start_time: stop.start_time,
        end_time: stop.end_time,
        notes: stop.notes,
        is_public: true,
        status: 'draft',
        created_by_email: user.email,
        expires_at: last ? new Date(`${last}T${stop.end_time}:00`).toISOString() : null,
      });
    },
    onSuccess: () => {
      toast.success('Stop submitted — it goes live once reviewed');
      setDraft(emptyStop);
      setShowForm(false);
      queryClient.invalidateQueries({ queryKey: ['myStops'] });
    },
    onError: () => toast.error("Couldn't save that stop. Check the fields and try again."),
  });

  const deleteStopMutation = useMutation({
    mutationFn: async (id) => base44.entities.ChuckWagonStop.delete(id),
    onSuccess: () => {
      toast.success('Stop removed');
      queryClient.invalidateQueries({ queryKey: ['myStops'] });
    },
  });

  function captureLocation(onCoords) {
    if (!navigator.geolocation) {
      toast.error('Your browser cannot share location. Type the address instead.');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        onCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      () => {
        setLocating(false);
        toast.error('Location is blocked. Allow it in your browser, or type the address.');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  if (isLoading || !user) {
    return (
      <div className="min-h-screen bg-stone-50 py-8">
        <div className="max-w-3xl mx-auto px-4 space-y-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  if (!wagon) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center px-4">
        <Card className="p-8 max-w-md text-center bg-white">
          <h2 className="text-xl font-semibold text-stone-900 mb-2">No chuck wagon yet</h2>
          <p className="text-stone-600 mb-4">
            Find your wagon on the site and send a claim request. Claiming is free for chuck
            wagons, and once it's approved you can manage it here.
          </p>
          <Link to={createPageUrl('Home')}>
            <Button variant="outline">Browse venues</Button>
          </Link>
        </Card>
      </div>
    );
  }

  const stale =
    wagon.live_updated_at &&
    Date.now() - new Date(wagon.live_updated_at).getTime() > 6 * 60 * 60 * 1000;
  const showingLive = wagon.is_live && !stale;

  return (
    <div className="min-h-screen bg-stone-50 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <Link to={createPageUrl('Home')}>
          <Button variant="outline" size="sm" className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </Link>

        <h1 className="text-3xl font-bold text-stone-900">{wagon.name}</h1>
        <p className="text-stone-600 mt-1 mb-6">Manage where you are and where you'll be.</p>

        {/* Live status */}
        <Card className="p-6 bg-white mb-6">
          <div className="flex items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-2">
              <Radio className={`w-5 h-5 ${showingLive ? 'text-green-600' : 'text-stone-400'}`} />
              <span className="font-semibold text-stone-900">
                {showingLive ? 'On the map now' : 'Not showing on the map'}
              </span>
            </div>
            {showingLive && (
              <Badge className="bg-green-100 text-green-800">Live</Badge>
            )}
          </div>

          {stale && wagon.is_live && (
            <p className="text-sm text-amber-700 mb-4">
              Your last check-in was over six hours ago, so the map has dropped your pin. Tap
              below to come back on.
            </p>
          )}

          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              className="bg-amber-600 hover:bg-amber-700 text-white flex-1"
              disabled={locating || goLiveMutation.isPending}
              onClick={() => captureLocation((coords) => goLiveMutation.mutate(coords))}
            >
              {locating || goLiveMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Finding you
                </>
              ) : (
                <>
                  <MapPin className="w-4 h-4 mr-2" />
                  {showingLive ? "Update where I'm parked" : "I'm serving here"}
                </>
              )}
            </Button>

            {showingLive && (
              <Button
                variant="outline"
                onClick={() => goOfflineMutation.mutate()}
                disabled={goOfflineMutation.isPending}
              >
                I'm done for today
              </Button>
            )}
          </div>

          <div className="mt-5 space-y-3">
            <div>
              <Label htmlFor="label" className="text-sm">Where are you parked?</Label>
              <Input
                id="label"
                placeholder="Depot Plaza"
                defaultValue={wagon.live_location_label || ''}
                onBlur={(e) =>
                  updateDetailsMutation.mutate({ live_location_label: e.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="note" className="text-sm">Note for today (optional)</Label>
              <Input
                id="note"
                placeholder="Cash only — card reader is down"
                defaultValue={wagon.live_note || ''}
                onBlur={(e) => updateDetailsMutation.mutate({ live_note: e.target.value })}
              />
            </div>
          </div>
        </Card>

        {/* Upcoming stops */}
        <Card className="p-6 bg-white">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-lg text-stone-900">Upcoming stops</h2>
            <Button size="sm" variant="outline" onClick={() => setShowForm((v) => !v)}>
              <Plus className="w-4 h-4 mr-2" />
              Add a stop
            </Button>
          </div>

          {showForm && (
            <div className="border border-stone-200 rounded-lg p-4 mb-5 space-y-3">
              <div>
                <Label className="text-sm">Location name</Label>
                <Input
                  placeholder="Accomplice Brewing"
                  value={draft.location_label}
                  onChange={(e) => setDraft({ ...draft, location_label: e.target.value })}
                />
              </div>
              <StopLocationPicker
                value={{ address: draft.address, lat: draft.lat, lng: draft.lng }}
                onChange={(v) =>
                  setDraft((d) => ({ ...d, address: v.address, lat: v.lat, lng: v.lng }))
                }
                locating={locating}
                onUseGps={() => captureLocation((coords) => setDraft((d) => ({ ...d, ...coords })))}
              />

              <div>
                <Label className="text-sm">Date</Label>
                <Input
                  type="date"
                  value={draft.stop_dates[0] || ''}
                  onChange={(e) => setDraft({ ...draft, stop_dates: [e.target.value] })}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-sm">Start</Label>
                  <Input
                    type="time"
                    value={draft.start_time}
                    onChange={(e) => setDraft({ ...draft, start_time: e.target.value })}
                  />
                </div>
                <div>
                  <Label className="text-sm">End</Label>
                  <Input
                    type="time"
                    value={draft.end_time}
                    onChange={(e) => setDraft({ ...draft, end_time: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <Label className="text-sm">Notes (optional)</Label>
                <Textarea
                  rows={2}
                  placeholder="Full menu, plus the seasonal special"
                  value={draft.notes}
                  onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
                />
              </div>

              <Button
                className="bg-amber-600 hover:bg-amber-700 text-white w-full"
                disabled={
                  addStopMutation.isPending ||
                  !draft.location_label ||
                  !draft.stop_dates[0] ||
                  !draft.lat
                }
                onClick={() => addStopMutation.mutate(draft)}
              >
                {addStopMutation.isPending ? 'Saving' : 'Submit stop'}
              </Button>
              <p className="text-xs text-stone-500">
                Drop a pin by address, map tap, or GPS, then drag to fine-tune. New stops are
                reviewed before they appear on the public map.
              </p>
            </div>
          )}

          {stops.length === 0 ? (
            <p className="text-stone-500 text-sm">
              Nothing scheduled yet. Add a stop so people can plan around you.
            </p>
          ) : (
            <div className="space-y-3">
              {stops.map((s) => (
                <div
                  key={s.id}
                  className="flex items-start justify-between gap-4 border border-stone-200 rounded-lg p-4"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-stone-900">{s.location_label}</span>
                      {s.status === 'draft' && (
                        <Badge className="bg-stone-100 text-stone-700">Awaiting review</Badge>
                      )}
                      {s.status === 'cancelled' && (
                        <Badge className="bg-red-100 text-red-800">Cancelled</Badge>
                      )}
                    </div>
                    <div className="text-sm text-stone-600">
                      {(s.stop_dates || []).join(', ')} · {s.start_time}–{s.end_time}
                    </div>
                    {s.notes && <div className="text-sm text-stone-500 mt-1">{s.notes}</div>}
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-red-300 text-red-600 hover:bg-red-50"
                    onClick={() => deleteStopMutation.mutate(s.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Branded pin upsell */}
        {!wagon.has_branded_pin && (
          <Card className="p-6 bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200 mt-6">
            <h3 className="font-semibold text-amber-900 mb-1">Put your logo on the map</h3>
            <p className="text-sm text-amber-800">
              Your pin shows a plain marker right now. Upgrade to show your logo instead, so
              people spot you at a glance.
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}