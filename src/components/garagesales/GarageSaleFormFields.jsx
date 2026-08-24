import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { X, Plus, Upload, Loader2, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import { base44 } from '@/api/base44Client';
import { GARAGE_SALE_CATEGORIES, SPECIAL_NOTES, EVENT_TYPES } from '@/lib/garageSaleHelpers';

const pinIcon = L.divIcon({
  className: 'gs-form-pin',
  html: '<div style="background:#b45309;width:24px;height:24px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:3px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.5)"></div>',
  iconSize: [24, 24],
  iconAnchor: [12, 24],
});

export default function GarageSaleFormFields({ form, set }) {
  const [geocoding, setGeocoding] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [newDate, setNewDate] = useState('');

  const geocode = async () => {
    if (!form.address) { toast.error('Enter a street address first'); return; }
    setGeocoding(true);
    try {
      const res = await base44.functions.invoke('geocodeGarageSale', {
        street: form.address, city: form.city, state: form.state, zip: form.zip,
      });
      const data = res?.data || res;
      if (data && data.lat) {
        set('lat', data.lat);
        set('lng', data.lng);
        toast.success(data.display_name ? 'Location found — verify the pin' : 'Location set');
        if (data.error) toast.message(data.error);
      }
    } catch {
      toast.error('Could not geocode address');
    } finally {
      setGeocoding(false);
    }
  };

  const uploadPhoto = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('Please select an image'); return; }
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      set('photos', [...(form.photos || []), file_url]);
      toast.success('Photo added');
    } catch {
      toast.error('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const addDate = () => {
    if (newDate && !(form.sale_dates || []).includes(newDate)) {
      set('sale_dates', [...(form.sale_dates || []), newDate].sort());
      setNewDate('');
    }
  };

  const toggle = (key, value) => {
    const arr = form[key] || [];
    set(key, arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value]);
  };

  return (
    <>
      <Card className="bg-white border-stone-200">
        <CardContent className="space-y-4 pt-4">
          <div className="space-y-1.5">
            <Label>Sale Title *</Label>
            <Input value={form.title || ''} onChange={(e) => set('title', e.target.value)} placeholder="e.g. Huge Moving Sale" />
          </div>
          <div className="space-y-1.5">
            <Label>Description</Label>
            <Textarea value={form.description || ''} onChange={(e) => set('description', e.target.value)} rows={3} maxLength={500} placeholder="What are you selling?" />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white border-stone-200">
        <CardContent className="space-y-4 pt-4">
          <div className="space-y-1.5">
            <Label>Street Address *</Label>
            <Input value={form.address || ''} onChange={(e) => set('address', e.target.value)} placeholder="1234 Example St" />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="space-y-1.5">
              <Label>City *</Label>
              <Input value={form.city || ''} onChange={(e) => set('city', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>State *</Label>
              <Input value={form.state || ''} onChange={(e) => set('state', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>ZIP *</Label>
              <Input value={form.zip || ''} onChange={(e) => set('zip', e.target.value)} />
            </div>
          </div>
          <Button type="button" onClick={geocode} disabled={geocoding} variant="outline" className="border-amber-300 text-amber-700">
            {geocoding ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <MapPin className="w-4 h-4 mr-1" />}
            Geocode & Preview Pin
          </Button>
          <div className="space-y-1.5">
            <Label>Pin Location (drag to correct)</Label>
            <div className="h-56 rounded-lg overflow-hidden border-2 border-amber-200">
              <MapContainer center={[form.lat || 41.14, form.lng || -104.79]} zoom={15} className="w-full h-full" style={{ background: '#e8e0d4' }}>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap contributors" />
                <Marker
                  position={[form.lat || 41.14, form.lng || -104.79]}
                  icon={pinIcon}
                  draggable
                  eventHandlers={{ dragend: (e) => {
                    const ll = e.target.getLatLng();
                    set('lat', ll.lat);
                    set('lng', ll.lng);
                  }}}
                />
              </MapContainer>
            </div>
            <p className="text-xs text-stone-500">Lat {(form.lat || 0).toFixed(5)}, Lng {(form.lng || 0).toFixed(5)}</p>
          </div>
          <div className="space-y-1.5">
            <Label>Address Visibility</Label>
            <div className="grid grid-cols-2 gap-2">
              <button type="button" onClick={() => set('address_visibility', 'immediate')} className={`p-2 rounded-lg border-2 text-sm ${form.address_visibility === 'immediate' ? 'border-amber-500 bg-amber-50 text-amber-800' : 'border-stone-200'}`}>
                Show exact address now
              </button>
              <button type="button" onClick={() => set('address_visibility', 'morning_of')} className={`p-2 rounded-lg border-2 text-sm ${form.address_visibility === 'morning_of' ? 'border-amber-500 bg-amber-50 text-amber-800' : 'border-stone-200'}`}>
                Reveal morning of sale
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white border-stone-200">
        <CardContent className="space-y-4 pt-4">
          <div className="space-y-1.5">
            <Label>Sale Dates *</Label>
            <div className="flex gap-2">
              <Input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} />
              <Button type="button" onClick={addDate} variant="outline" className="border-amber-300 text-amber-700"><Plus className="w-4 h-4" /></Button>
            </div>
            {(form.sale_dates || []).length > 0 && (
              <div className="flex flex-wrap gap-2 mt-1">
                {(form.sale_dates || []).map((d) => (
                  <span key={d} className="text-sm bg-amber-100 text-amber-800 px-2 py-1 rounded-full flex items-center gap-1">
                    {d}
                    <button type="button" onClick={() => set('sale_dates', (form.sale_dates || []).filter((x) => x !== d))}><X className="w-3 h-3" /></button>
                  </span>
                ))}
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5">
              <Label>Start Time *</Label>
              <Input type="time" value={form.start_time || ''} onChange={(e) => set('start_time', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>End Time *</Label>
              <Input type="time" value={form.end_time || ''} onChange={(e) => set('end_time', e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Event Type</Label>
            <select value={form.event_type || 'garage'} onChange={(e) => set('event_type', e.target.value)} className="w-full border border-stone-300 rounded-md p-2 text-sm">
              {EVENT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white border-stone-200">
        <CardContent className="space-y-4 pt-4">
          <div className="space-y-1.5">
            <Label>Categories</Label>
            <div className="flex flex-wrap gap-1.5">
              {GARAGE_SALE_CATEGORIES.map((c) => (
                <button key={c.value} type="button" onClick={() => toggle('categories', c.value)} className={`text-xs px-2.5 py-1 rounded-full border-2 ${(form.categories || []).includes(c.value) ? 'bg-amber-600 text-white border-amber-700' : 'bg-white border-stone-300'}`}>
                  {c.label}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Special Notes</Label>
            <div className="flex flex-wrap gap-1.5">
              {SPECIAL_NOTES.map((n) => (
                <button key={n.value} type="button" onClick={() => toggle('special_notes', n.value)} className={`text-xs px-2.5 py-1 rounded-full border-2 ${(form.special_notes || []).includes(n.value) ? 'bg-stone-700 text-white border-stone-800' : 'bg-white border-stone-300'}`}>
                  {n.label}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Additional Notes</Label>
            <Textarea value={form.custom_notes || ''} onChange={(e) => set('custom_notes', e.target.value)} rows={2} placeholder="Anything else shoppers should know" />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white border-stone-200">
        <CardContent className="space-y-3 pt-4">
          <Label>Photos</Label>
          <Button type="button" variant="outline" disabled={uploading} onClick={() => document.getElementById('gs-form-photo-upload').click()} className="border-amber-300 text-amber-700">
            {uploading ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Upload className="w-4 h-4 mr-1" />} Add Photo
          </Button>
          <input id="gs-form-photo-upload" type="file" accept="image/*" onChange={uploadPhoto} className="hidden" />
          {(form.photos || []).length > 0 && (
            <div className="grid grid-cols-3 gap-2">
              {(form.photos || []).map((p, i) => (
                <div key={i} className="relative">
                  <img src={p} alt={`Photo ${i + 1}`} className="w-full h-20 object-cover rounded-md border border-stone-200" />
                  <button type="button" onClick={() => set('photos', (form.photos || []).filter((_, j) => j !== i))} className="absolute top-1 right-1 bg-rose-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">×</button>
                </div>
              ))}
            </div>
          )}
          <div className="space-y-1.5">
            <Label>Contact Info (optional)</Label>
            <Input value={form.contact_info || ''} onChange={(e) => set('contact_info', e.target.value)} placeholder="Phone or email" />
          </div>
        </CardContent>
      </Card>
    </>
  );
}