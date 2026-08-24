import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, AlertTriangle, Tag, Calendar, MapPin, Rocket, Save, Trash2, ArrowLeft, Edit } from 'lucide-react';
import { toast } from 'sonner';
import { useSEO } from '@/hooks/useSEO';
import GarageSaleFormFields from '@/components/garagesales/GarageSaleFormFields';
import { slugify, getExpiresAt, formatSaleSchedule } from '@/lib/garageSaleHelpers';

export default function GarageSaleDrafts() {
  useSEO({ title: 'Garage Sale Drafts — Admin | Eat, Drink, Play Cheyenne', noindex: true });
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);

  const { data: drafts = [], isLoading } = useQuery({
    queryKey: ['gs_drafts'],
    queryFn: async () => {
      const res = await base44.entities.GarageSale.filter({ status: 'draft' }, '-created_date', 200);
      return res || [];
    },
  });

  const { data: editingDraft } = useQuery({
    queryKey: ['gs_draft', editingId],
    queryFn: async () => editingId ? (await base44.entities.GarageSale.get(editingId)) : null,
    enabled: !!editingId,
  });

  useEffect(() => {
    if (editingDraft) {
      setForm({
        title: editingDraft.title || '', description: editingDraft.description || '',
        address: editingDraft.address || '', city: editingDraft.city || 'Cheyenne', state: editingDraft.state || 'WY',
        zip: editingDraft.zip || '', lat: editingDraft.lat, lng: editingDraft.lng,
        sale_dates: editingDraft.sale_dates || [], start_time: editingDraft.start_time || '08:00',
        end_time: editingDraft.end_time || '14:00', categories: editingDraft.categories || [],
        photos: editingDraft.photos || [], contact_info: editingDraft.contact_info || '',
        special_notes: editingDraft.special_notes || [], custom_notes: editingDraft.custom_notes || '',
        address_visibility: editingDraft.address_visibility || 'immediate', event_type: editingDraft.event_type || 'garage',
      });
    }
  }, [editingDraft]);

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  if (!user) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <p className="text-stone-700 mb-3">Sign in to manage drafts.</p>
        <Button onClick={() => base44.auth.redirectToLogin(window.location.href)} className="bg-amber-600 hover:bg-amber-700 text-white">Sign In</Button>
      </div>
    );
  }
  if (user.role !== 'admin') {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <AlertTriangle className="w-10 h-10 text-amber-600 mx-auto mb-3" />
        <p className="text-stone-700">Admin access required.</p>
      </div>
    );
  }

  const saveDraft = async (publish) => {
    if (!form.title || !form.address || !form.city || !form.state || !form.zip) { toast.error('Please fill in all required fields'); return; }
    if ((form.sale_dates || []).length === 0) { toast.error('Add at least one sale date'); return; }
    setSaving(true);
    try {
      let lat = form.lat, lng = form.lng;
      if (publish) {
        try {
          const res = await base44.functions.invoke('geocodeGarageSale', {
            street: form.address, city: form.city, state: form.state, zip: form.zip,
          });
          const data = res?.data || res;
          if (data && data.lat) { lat = data.lat; lng = data.lng; }
        } catch { /* non-fatal */ }
      }
      const slug = slugify(form.title) + '-cheyenne';
      const expires_at = getExpiresAt({ sale_dates: form.sale_dates, end_time: form.end_time });
      const payload = { ...form, lat, lng, slug, expires_at, status: publish ? 'active' : 'draft' };
      await base44.entities.GarageSale.update(editingId, payload);
      queryClient.invalidateQueries(['gs_drafts']);
      toast.success(publish ? 'Published live!' : 'Draft updated');
      setEditingId(null);
      setForm(null);
    } catch (err) {
      toast.error('Could not save');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const deleteDraft = async (id) => {
    if (!confirm('Delete this draft?')) return;
    try {
      await base44.entities.GarageSale.delete(id);
      queryClient.invalidateQueries(['gs_drafts']);
      if (editingId === id) { setEditingId(null); setForm(null); }
      toast.success('Draft deleted');
    } catch {
      toast.error('Could not delete');
    }
  };

  if (editingId && form) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6 pb-20">
        <Button onClick={() => { setEditingId(null); setForm(null); }} variant="ghost" className="mb-3 text-stone-500">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Drafts
        </Button>
        <h1 className="text-2xl font-bold text-stone-800 mb-4">Edit Draft</h1>
        <div className="space-y-5">
          <GarageSaleFormFields form={form} set={set} />
          <div className="flex flex-col gap-2">
            <Button disabled={saving} onClick={() => saveDraft(true)} className="w-full bg-green-600 hover:bg-green-700 text-white">
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Rocket className="w-4 h-4 mr-2" />}
              Publish Live
            </Button>
            <Button disabled={saving} onClick={() => saveDraft(false)} variant="outline" className="w-full border-stone-300">
              <Save className="w-4 h-4 mr-2" /> Save Changes (keep as draft)
            </Button>
            <Button disabled={saving} onClick={() => deleteDraft(editingId)} variant="ghost" className="w-full text-rose-600 hover:text-rose-700">
              <Trash2 className="w-4 h-4 mr-2" /> Delete Draft
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-20">
      <h1 className="text-2xl font-bold text-stone-800 mb-1">Garage Sale Drafts</h1>
      <p className="text-sm text-stone-500 mb-5">Review and publish drafts created from the importer.</p>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-amber-600" /></div>
      ) : drafts.length === 0 ? (
        <Card className="bg-white border-stone-200">
          <CardContent className="py-12 text-center">
            <Tag className="w-10 h-10 text-stone-300 mx-auto mb-3" />
            <p className="text-stone-500">No drafts yet. Use the importer to create one.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {drafts.map((d) => (
            <Card key={d.id} className="bg-white border-stone-200 hover:border-amber-300 transition-colors">
              <CardContent className="py-3 flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-stone-800 truncate">{d.title || 'Untitled'}</h3>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-stone-500 mt-1">
                    {d.address && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{d.address}</span>}
                    {d.sale_dates?.length > 0 && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{formatSaleSchedule(d)}</span>}
                  </div>
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button size="sm" onClick={() => setEditingId(d.id)} className="bg-amber-600 hover:bg-amber-700 text-white">
                    <Edit className="w-3.5 h-3.5" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => deleteDraft(d.id)} className="text-rose-600 hover:text-rose-700">
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}