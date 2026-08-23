import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';
import { Star, Trash2, Pencil, Flag, Check } from 'lucide-react';
import { toast } from 'sonner';
import { useSEO } from '@/hooks/useSEO';
import {
  formatDateShort, formatTime, isExpired, getReportReasonLabel,
} from '@/lib/garageSaleHelpers';

export default function ManageGarageSales() {
  useSEO({ title: 'Manage Garage Sales — Admin', noindex: true });
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState('active');

  const { data: allSales = [] } = useQuery({
    queryKey: ['gs_admin_sales'],
    queryFn: async () => (await base44.entities.GarageSale.filter({}, '-created_date', 500)) || [],
    enabled: !!user && user.role === 'admin',
  });
  const { data: reports = [] } = useQuery({
    queryKey: ['gs_admin_reports'],
    queryFn: async () => (await base44.entities.GarageSaleReport.filter({ status: 'pending' }, '-created_date', 100)) || [],
    enabled: !!user && user.role === 'admin',
  });

  const active = allSales.filter((s) => !isExpired(s) && s.status === 'active');
  const expired = allSales.filter((s) => isExpired(s) || s.status === 'expired' || s.status === 'removed');

  const toggleFeatured = async (sale) => {
    await base44.entities.GarageSale.update(sale.id, { featured: !sale.featured });
    queryClient.invalidateQueries(['gs_admin_sales']);
    toast.success(!sale.featured ? 'Marked featured' : 'Unfeatured');
  };
  const removeSale = async (sale) => {
    if (!confirm(`Remove "${sale.title}" from public view?`)) return;
    await base44.entities.GarageSale.update(sale.id, { status: 'removed' });
    queryClient.invalidateQueries(['gs_admin_sales']);
    toast.success('Listing removed');
  };
  const resolveReport = async (id) => {
    await base44.entities.GarageSaleReport.update(id, { status: 'resolved' });
    queryClient.invalidateQueries(['gs_admin_reports']);
    toast.success('Report resolved');
  };

  if (!user || user.role !== 'admin') {
    return <div className="max-w-md mx-auto px-4 py-16 text-center text-stone-600">Admin access required.</div>;
  }

  const tabs = [
    { key: 'active', label: 'Active', count: active.length },
    { key: 'expired', label: 'Expired / Removed', count: expired.length },
    { key: 'reports', label: 'Reports', count: reports.length },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 pb-20">
      <h1 className="text-2xl font-bold text-stone-800 mb-4">Manage Garage Sales</h1>

      <div className="flex gap-2 mb-5 border-b border-stone-200">
        {tabs.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)} className={`px-3 py-2 text-sm font-medium border-b-2 -mb-px ${tab === t.key ? 'border-amber-600 text-amber-800' : 'border-transparent text-stone-500'}`}>
            {t.label} <span className="text-xs bg-stone-100 rounded-full px-1.5">{t.count}</span>
          </button>
        ))}
      </div>

      {(tab === 'active' || tab === 'expired') && (
        <div className="space-y-2">
          {(tab === 'active' ? active : expired).length === 0 ? (
            <p className="text-stone-500 text-sm">No listings here.</p>
          ) : (
            (tab === 'active' ? active : expired).map((s) => (
              <div key={s.id} className="bg-white border border-stone-200 rounded-lg p-3 flex items-center gap-3">
                {s.photos?.[0] ? <img src={s.photos[0]} alt="" className="w-12 h-12 object-cover rounded-md" /> : <div className="w-12 h-12 bg-amber-100 rounded-md" />}
                <div className="flex-1 min-w-0">
                  <Link to={`/GarageSales/${s.slug || s.id}`} className="font-semibold text-stone-800 hover:text-amber-700 truncate block">{s.title}</Link>
                  <div className="text-xs text-stone-500">
                    {s.address}, {s.city} · {(s.sale_dates || []).map(formatDateShort).join(' · ')} · {formatTime(s.start_time)}–{formatTime(s.end_time)}
                  </div>
                  <div className="text-xs text-stone-400">by {s.created_by_email || 'unknown'}</div>
                </div>
                <Button variant="outline" size="sm" onClick={() => toggleFeatured(s)} className={s.featured ? 'border-amber-400 text-amber-700 bg-amber-50' : 'border-stone-300'}>
                  <Star className={`w-4 h-4 ${s.featured ? 'fill-current' : ''}`} />
                </Button>
                <Link to={`/AddGarageSale?id=${s.id}`}><Button variant="outline" size="sm" className="border-stone-300"><Pencil className="w-4 h-4" /></Button></Link>
                {tab === 'active' && (
                  <Button variant="outline" size="sm" onClick={() => removeSale(s)} className="border-rose-300 text-rose-600"><Trash2 className="w-4 h-4" /></Button>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {tab === 'reports' && (
        <div className="space-y-2">
          {reports.length === 0 ? (
            <p className="text-stone-500 text-sm">No pending reports.</p>
          ) : (
            reports.map((r) => (
              <div key={r.id} className="bg-white border border-stone-200 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Flag className="w-4 h-4 text-rose-500" />
                    <span className="font-semibold text-stone-800">{r.garage_sale_title}</span>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => resolveReport(r.id)} className="border-green-300 text-green-700"><Check className="w-4 h-4 mr-1" /> Resolve</Button>
                </div>
                <div className="text-xs text-stone-500 mt-1">
                  Reason: {getReportReasonLabel(r.reason)} · by {r.reporter_email || 'anonymous'}
                </div>
                {r.details && <p className="text-sm text-stone-600 mt-1">{r.details}</p>}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}