import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Sparkles, Upload, FileText, Image as ImageIcon, AlertTriangle, CheckCircle, Save, Rocket, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { useSEO } from '@/hooks/useSEO';
import GarageSaleFormFields from '@/components/garagesales/GarageSaleFormFields';
import { GARAGE_SALE_CATEGORIES, SPECIAL_NOTES, slugify, getExpiresAt, normalizeAddress, isUpcoming } from '@/lib/garageSaleHelpers';

const DEFAULT_FORM = {
  title: '', description: '', address: '', city: 'Cheyenne', state: 'WY', zip: '',
  lat: 41.14, lng: -104.79, sale_dates: [], start_time: '08:00', end_time: '14:00',
  categories: [], photos: [], contact_info: '', special_notes: [], custom_notes: '',
  address_visibility: 'immediate', event_type: 'garage',
};

const EXTRACTION_SCHEMA = {
  type: 'object',
  properties: {
    title: { type: 'string' },
    description: { type: 'string' },
    address: { type: 'string' },
    city: { type: 'string' },
    state: { type: 'string' },
    zip: { type: 'string' },
    sale_dates: { type: 'array', items: { type: 'string' } },
    start_time: { type: 'string' },
    end_time: { type: 'string' },
    categories: { type: 'array', items: { type: 'string' } },
    special_notes: { type: 'array', items: { type: 'string' } },
    event_type: { type: 'string' },
    custom_notes: { type: 'string' },
    contact_info: { type: 'string' },
    confidence: { type: 'number' },
    missing_fields: { type: 'array', items: { type: 'string' } },
  },
  required: ['title', 'confidence', 'missing_fields'],
};

function buildPrompt() {
  const cats = GARAGE_SALE_CATEGORIES.map((c) => `${c.value} (${c.label})`).join(', ');
  const notes = SPECIAL_NOTES.map((n) => `${n.value} (${n.label})`).join(', ');
  return `You are helping an admin import a garage sale listing from a social media post (Facebook, Craigslist, Nextdoor, etc.). Extract structured data from the post.

Extract these fields:
- title: Short catchy title (e.g. "Huge Moving Sale")
- description: Brief description of what's being sold
- address: Street address only (number + street name, no city/state/zip)
- city: City (default "Cheyenne" if not stated)
- state: State abbreviation (default "WY" if not stated)
- zip: ZIP code (empty string if not found)
- sale_dates: Array of dates in YYYY-MM-DD format. Convert any date format to YYYY-MM-DD. Use 2026 as the year if not specified. Handle ranges like "Aug 24-26" as separate entries.
- start_time: HH:MM 24h format (default "08:00")
- end_time: HH:MM 24h format (default "14:00")
- categories: Array of values from: ${cats}
- special_notes: Array of values from: ${notes}
- event_type: One of: garage, estate, moving, neighborhood, community, church, school, multi_family
- custom_notes: Any other notes not captured above
- contact_info: Phone or email if mentioned (empty string if not)
- confidence: 0.0 to 1.0 score for overall extraction quality
- missing_fields: Array of missing/ambiguous field names from: title, address, city, state, zip, sale_dates, start_time, end_time

Rules:
- Only extract what's actually in the post. Do NOT make up information.
- If a field is missing, leave it empty and add it to missing_fields.
- Infer year 2026 for dates without a year.`;
}

export default function ImportGarageSale() {
  useSEO({ title: 'Submit a Garage Sale | Eat, Drink, Play Cheyenne', noindex: true });
  const { user } = useAuth();
  const navigate = useNavigate();
  const isAdmin = user?.role === 'admin';

  const [mode, setMode] = useState('text');
  const [postText, setPostText] = useState('');
  const [imageUrl, setImageUrl] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [extraction, setExtraction] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(DEFAULT_FORM);

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  if (!user) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <Sparkles className="w-10 h-10 text-amber-600 mx-auto mb-3" />
        <h1 className="text-xl font-bold text-stone-800 mb-2">Spot a sale that's not on the map?</h1>
        <p className="text-stone-600 mb-6">Paste the post or upload a screenshot and we'll take care of adding it.</p>
        <Button onClick={() => base44.auth.redirectToLogin(window.location.href)} className="bg-amber-600 hover:bg-amber-700 text-white">Sign In to Submit</Button>
      </div>
    );
  }

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('Please select an image'); return; }
    setUploadingImage(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setImageUrl(file_url);
      toast.success('Image uploaded');
    } catch {
      toast.error('Upload failed');
    } finally {
      setUploadingImage(false);
    }
  };

  const extract = async () => {
    if (mode === 'text' && !postText.trim()) { toast.error('Paste some post text first'); return; }
    if (mode === 'image' && !imageUrl) { toast.error('Upload an image first'); return; }
    setExtracting(true);
    try {
      const prompt = buildPrompt() + (mode === 'text'
        ? '\n\n--- POST TEXT ---\n' + postText
        : '\n\nAnalyze the garage sale post from the provided image and extract all fields.');
      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: EXTRACTION_SCHEMA,
        ...(imageUrl && mode === 'image' ? { file_urls: [imageUrl] } : {}),
      });

      const validCats = GARAGE_SALE_CATEGORIES.map((c) => c.value);
      const validNotes = SPECIAL_NOTES.map((n) => n.value);
      setForm({
        ...DEFAULT_FORM,
        title: result.title || '',
        description: result.description || '',
        address: result.address || '',
        city: result.city || 'Cheyenne',
        state: result.state || 'WY',
        zip: result.zip || '',
        sale_dates: result.sale_dates || [],
        start_time: result.start_time || '08:00',
        end_time: result.end_time || '14:00',
        categories: (result.categories || []).filter((c) => validCats.includes(c)),
        special_notes: (result.special_notes || []).filter((n) => validNotes.includes(n)),
        event_type: result.event_type || 'garage',
        custom_notes: result.custom_notes || '',
        contact_info: result.contact_info || '',
        photos: imageUrl && mode === 'image' ? [imageUrl] : [],
      });
      const extractedZip = result.zip || '';
      const extractedAddress = result.address || '';
      setExtraction({ confidence: result.confidence || 0, missing_fields: result.missing_fields || [] });
      setShowForm(true);
      toast.success('Extracted! Review the fields below.');

      // If the post didn't include a ZIP, look it up from the street address via the geocoder
      if (!extractedZip && extractedAddress) {
        try {
          const res = await base44.functions.invoke('geocodeGarageSale', {
            street: extractedAddress, city: result.city || 'Cheyenne', state: result.state || 'WY', zip: '',
          });
          const data = res?.data || res;
          if (data?.postcode) {
            setForm((p) => ({ ...p, zip: data.postcode }));
            setExtraction((p) => p ? { ...p, missing_fields: (p.missing_fields || []).filter((f) => f !== 'zip') } : p);
            toast.success(`ZIP ${data.postcode} looked up from address`);
          }
        } catch { /* non-fatal — admin can fill manually */ }
      }
    } catch (err) {
      console.error(err);
      toast.error('Could not extract — try again or fill manually');
    } finally {
      setExtracting(false);
    }
  };

  const startManual = () => {
    setForm(DEFAULT_FORM);
    setExtraction(null);
    setShowForm(true);
  };

  const reset = () => {
    setPostText('');
    setImageUrl(null);
    setExtraction(null);
    setShowForm(false);
    setForm(DEFAULT_FORM);
  };

  const canPublishDirectly = extraction && extraction.confidence >= 0.75 &&
    !['title', 'address', 'city', 'state', 'zip', 'sale_dates', 'start_time', 'end_time'].some((f) => extraction.missing_fields.includes(f));

  const saveSale = async (status) => {
    if (!form.title || !form.address || !form.city || !form.state || !form.zip) { toast.error('Please fill in all required fields'); return; }
    if ((form.sale_dates || []).length === 0) { toast.error('Add at least one sale date'); return; }
    if (!form.start_time || !form.end_time) { toast.error('Set start and end times'); return; }
    setSaving(true);
    try {
      let lat = form.lat, lng = form.lng;
      try {
        const res = await base44.functions.invoke('geocodeGarageSale', {
          street: form.address, city: form.city, state: form.state, zip: form.zip,
        });
        const data = res?.data || res;
        if (data && data.lat) { lat = data.lat; lng = data.lng; }
      } catch { /* non-fatal — keep default pin */ }

      const slug = slugify(form.title) + '-cheyenne';
      const expires_at = getExpiresAt({ sale_dates: form.sale_dates, end_time: form.end_time });

      // Block duplicate addresses — only an upcoming/live sale at the same
      // street + city counts; an expired past sale shouldn't block a new one.
      const norm = normalizeAddress(form.address, form.city);
      const existingSales = await base44.entities.GarageSale.list('-created_date', 500);
      const dup = existingSales.find(
        (s) => s.status !== 'removed' && isUpcoming(s) && normalizeAddress(s.address, s.city) === norm
      );
      if (dup) {
        toast.error('An upcoming garage sale at this address already exists.', { description: 'Open the existing listing instead of creating a duplicate.' });
        navigate(`/GarageSales/${dup.id}`);
        return;
      }

      const payload = { ...form, lat, lng, slug, expires_at, status, created_by_email: user?.email };
      const saved = await base44.entities.GarageSale.create(payload);

      if (status === 'active') {
        toast.success('Published live!');
        navigate(`/GarageSales/${saved.slug || saved.id}`);
      } else {
        toast.success(isAdmin ? 'Saved as draft — review it in Garage Sale Drafts' : 'Thanks! Our team will review your submission before it goes live.');
        reset();
      }
    } catch (err) {
      toast.error('Could not save');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-20">
      <div className="flex items-center gap-3 mb-4">
        <Sparkles className="w-6 h-6 text-amber-600" />
        <div>
          <h1 className="text-2xl font-bold text-stone-800">{isAdmin ? 'Import Garage Sale' : 'Submit a Garage Sale'}</h1>
          <p className="text-sm text-stone-500">
            {isAdmin
              ? 'Paste a Facebook post or upload a screenshot — AI fills the form.'
              : "Know of a garage sale that's not on the map? Paste the post or upload a screenshot and we'll take care of adding it."}
          </p>
        </div>
      </div>

      {!showForm ? (
        <>
          <Card className="bg-white border-stone-200 mb-4">
            <CardContent className="pt-4 space-y-4">
              <div className="flex gap-2">
                <button onClick={() => setMode('text')} className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border-2 text-sm font-medium ${mode === 'text' ? 'border-amber-500 bg-amber-50 text-amber-800' : 'border-stone-200'}`}>
                  <FileText className="w-4 h-4" /> Paste Text
                </button>
                <button onClick={() => setMode('image')} className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border-2 text-sm font-medium ${mode === 'image' ? 'border-amber-500 bg-amber-50 text-amber-800' : 'border-stone-200'}`}>
                  <ImageIcon className="w-4 h-4" /> Upload Screenshot
                </button>
              </div>

              {mode === 'text' ? (
                <div className="space-y-1.5">
                  <Label>Post Text</Label>
                  <Textarea value={postText} onChange={(e) => setPostText(e.target.value)} rows={8} placeholder="Paste the full text of the Facebook post, Craigslist ad, or any source here..." />
                </div>
              ) : (
                <div className="space-y-2">
                  <Label>Screenshot / Photo</Label>
                  {imageUrl ? (
                    <div className="relative">
                      <img src={imageUrl} alt="Upload preview" className="w-full rounded-lg border-2 border-amber-200 max-h-80 object-contain" />
                      <button onClick={() => setImageUrl(null)} className="absolute top-2 right-2 bg-rose-600 text-white rounded-full w-6 h-6 flex items-center justify-center">×</button>
                    </div>
                  ) : (
                    <button type="button" disabled={uploadingImage} onClick={() => document.getElementById('gs-import-upload').click()} className="w-full border-2 border-dashed border-amber-300 rounded-lg h-24 flex flex-col items-center justify-center gap-1 text-amber-700 hover:bg-amber-50 transition-colors">
                      {uploadingImage ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
                      <span className="text-sm">{uploadingImage ? 'Uploading...' : 'Click to upload screenshot'}</span>
                    </button>
                  )}
                  <input id="gs-import-upload" type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex gap-2">
            <Button onClick={extract} disabled={extracting || (mode === 'text' ? !postText.trim() : !imageUrl)} className="flex-1 bg-amber-600 hover:bg-amber-700 text-white">
              {extracting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
              {extracting ? 'Extracting...' : 'Extract with AI'}
            </Button>
            <Button onClick={startManual} variant="outline" className="border-stone-300">
              Fill Manually
            </Button>
          </div>
        </>
      ) : (
        <>
          {extraction && (
            <div className={`mb-4 p-3 rounded-lg border-2 ${canPublishDirectly ? 'border-green-300 bg-green-50' : 'border-amber-300 bg-amber-50'}`}>
              <div className="flex items-center gap-2 mb-1">
                {canPublishDirectly ? <CheckCircle className="w-5 h-5 text-green-600" /> : <AlertTriangle className="w-5 h-5 text-amber-600" />}
                <span className="font-semibold text-sm">
                  {canPublishDirectly ? 'High confidence — ready to publish' : `Low confidence (${Math.round((extraction.confidence || 0) * 100)}%) — review carefully`}
                </span>
              </div>
              {extraction.missing_fields?.length > 0 && (
                <p className="text-xs text-amber-700">Missing or ambiguous: {extraction.missing_fields.join(', ')}</p>
              )}
            </div>
          )}

          <div className="space-y-5">
            <GarageSaleFormFields form={form} set={set} />

            <div className="flex flex-col gap-2">
              {isAdmin ? (
                <>
                  <Button disabled={saving} onClick={() => saveSale('active')} className={`w-full ${canPublishDirectly ? 'bg-green-600 hover:bg-green-700' : 'bg-amber-600 hover:bg-amber-700'} text-white`}>
                    {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Rocket className="w-4 h-4 mr-2" />}
                    Publish Live
                  </Button>
                  <Button disabled={saving} onClick={() => saveSale('draft')} variant="outline" className="w-full border-stone-300">
                    <Save className="w-4 h-4 mr-2" /> Save as Draft
                  </Button>
                </>
              ) : (
                <>
                  <Button disabled={saving} onClick={() => saveSale('draft')} className="w-full bg-amber-600 hover:bg-amber-700 text-white">
                    {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
                    Submit for Review
                  </Button>
                  <p className="text-xs text-stone-500 text-center">
                    Our team reviews submissions before they appear on the map.
                  </p>
                </>
              )}
              <Button onClick={reset} variant="ghost" className="w-full text-stone-500">
                <ArrowLeft className="w-4 h-4 mr-2" /> Start Over
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}