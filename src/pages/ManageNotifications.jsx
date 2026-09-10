import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Bell, Check, X, Send, Eye, Edit3 } from 'lucide-react';
import { toast } from 'sonner';

export default function ManageNotifications() {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => setUser(null));
  }, []);

  const { data: campaigns, isLoading } = useQuery({
    queryKey: ['notificationCampaigns'],
    queryFn: async () => {
      const res = await base44.entities.NotificationCampaign.list('-created_date', 50);
      return res;
    },
    enabled: user?.role === 'admin',
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      return base44.entities.NotificationCampaign.update(id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['notificationCampaigns']);
      toast.success('Campaign updated');
    },
    onError: (err) => toast.error('Update failed: ' + err.message),
  });

  const sendMutation = useMutation({
    mutationFn: async (campaignId) => {
      return base44.functions.invoke('sendApprovedCampaign', { campaign_id: campaignId });
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries(['notificationCampaigns']);
      toast.success(`Campaign sent to ${res.data?.sent || 0} users`);
    },
    onError: (err) => toast.error('Send failed: ' + err.message),
  });

  if (!user) return <div className="flex justify-center p-20"><Skeleton className="w-8 h-8 rounded-full" /></div>;
  if (user.role !== 'admin') {
    return (
      <div className="max-w-md mx-auto mt-20 text-center p-8">
        <Bell className="w-12 h-12 mx-auto text-stone-400 mb-4" />
        <p className="text-stone-600">Admin access required to manage notification campaigns.</p>
      </div>
    );
  }

  const startEdit = (c) => {
    setEditingId(c.id);
    setEditForm({
      email_subject: c.email_subject,
      email_html: c.email_html,
      notification_title: c.notification_title,
      notification_message: c.notification_message,
      admin_notes: c.admin_notes || '',
    });
    setShowPreview(false);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({});
    setShowPreview(false);
  };

  const saveAndApprove = (campaign) => {
    updateMutation.mutate(
      { id: campaign.id, data: { ...editForm, status: 'approved' } },
      {
        onSuccess: () => {
          sendMutation.mutate(campaign.id);
          setEditingId(null);
        },
      }
    );
  };

  const rejectCampaign = (campaign) => {
    updateMutation.mutate({ id: campaign.id, data: { status: 'rejected' } });
  };

  const pending = campaigns?.filter((c) => c.status === 'pending_approval') || [];
  const other = campaigns?.filter((c) => c.status !== 'pending_approval') || [];

  const statusColor = (s) => ({
    pending_approval: 'bg-amber-100 text-amber-800 border-amber-300',
    approved: 'bg-blue-100 text-blue-800 border-blue-300',
    sent: 'bg-green-100 text-green-800 border-green-300',
    rejected: 'bg-stone-200 text-stone-600 border-stone-300',
  }[s] || 'bg-stone-100 text-stone-600');

  const renderCampaignCard = (c) => {
    const isEditing = editingId === c.id;
    return (
      <Card key={c.id} className="mb-4 border-2 border-amber-200">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle className="text-lg text-amber-900" style={{ fontFamily: 'Rye, serif' }}>
                {c.name}
              </CardTitle>
              <p className="text-sm text-stone-500 mt-1">
                {new Date(c.scheduled_for).toLocaleString()}
              </p>
            </div>
            <Badge className={statusColor(c.status)}>{c.status.replace('_', ' ')}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          {isEditing ? (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-stone-700">Email Subject</label>
                <Input
                  value={editForm.email_subject || ''}
                  onChange={(e) => setEditForm({ ...editForm, email_subject: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-stone-700">Notification Title</label>
                <Input
                  value={editForm.notification_title || ''}
                  onChange={(e) => setEditForm({ ...editForm, notification_title: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-stone-700">Notification Message</label>
                <Textarea
                  value={editForm.notification_message || ''}
                  onChange={(e) => setEditForm({ ...editForm, notification_message: e.target.value })}
                  className="mt-1"
                  rows={2}
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-sm font-semibold text-stone-700">Email HTML</label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowPreview(!showPreview)}
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    {showPreview ? 'Edit HTML' : 'Preview'}
                  </Button>
                </div>
                {showPreview ? (
                  <div
                    className="border rounded-md p-2 bg-white h-64 overflow-auto"
                    dangerouslySetInnerHTML={{ __html: editForm.email_html || '' }}
                  />
                ) : (
                  <Textarea
                    value={editForm.email_html || ''}
                    onChange={(e) => setEditForm({ ...editForm, email_html: e.target.value })}
                    className="mt-1 font-mono text-xs"
                    rows={8}
                  />
                )}
              </div>
              <div>
                <label className="text-sm font-semibold text-stone-700">Admin Notes</label>
                <Textarea
                  value={editForm.admin_notes || ''}
                  onChange={(e) => setEditForm({ ...editForm, admin_notes: e.target.value })}
                  className="mt-1"
                  rows={2}
                  placeholder="Optional notes for your records..."
                />
              </div>
              <div className="flex gap-2 pt-2">
                <Button
                  onClick={() => saveAndApprove(c)}
                  disabled={updateMutation.isPending || sendMutation.isPending}
                  className="bg-green-700 hover:bg-green-800 text-white"
                >
                  <Send className="w-4 h-4 mr-1" />
                  {sendMutation.isPending ? 'Sending...' : 'Save & Send'}
                </Button>
                <Button
                  onClick={() => updateMutation.mutate({ id: c.id, data: editForm })}
                  disabled={updateMutation.isPending}
                  variant="outline"
                >
                  Save Draft
                </Button>
                <Button variant="ghost" onClick={cancelEdit}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <div>
                <span className="text-xs font-semibold text-stone-500 uppercase">Subject:</span>
                <p className="text-sm text-stone-800">{c.email_subject}</p>
              </div>
              <div>
                <span className="text-xs font-semibold text-stone-500 uppercase">Notification:</span>
                <p className="text-sm text-stone-800">{c.notification_title}</p>
                <p className="text-sm text-stone-600">{c.notification_message}</p>
              </div>
              {c.status === 'sent' && c.sent_date && (
                <p className="text-xs text-green-700">
                  ✓ Sent to {c.recipient_count || 0} users on {new Date(c.sent_date).toLocaleString()}
                </p>
              )}
              {c.admin_notes && (
                <p className="text-xs text-stone-500 italic">Notes: {c.admin_notes}</p>
              )}
              {c.status === 'pending_approval' && (
                <div className="flex gap-2 pt-2">
                  <Button size="sm" onClick={() => startEdit(c)} className="bg-amber-800 hover:bg-amber-900 text-white">
                    <Edit3 className="w-4 h-4 mr-1" />
                    Review & Edit
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => rejectCampaign(c)}>
                    <X className="w-4 h-4 mr-1" />
                    Reject
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl text-amber-900 mb-1" style={{ fontFamily: 'Rye, serif' }}>
          Notification Campaigns
        </h1>
        <p className="text-stone-600 text-sm">
          Review, edit, and approve weekly campaigns before they go out to users.
        </p>
      </div>

      {isLoading ? (
        [1, 2, 3].map((i) => <Skeleton key={i} className="w-full h-40 mb-4" />)
      ) : (
        <>
          {pending.length > 0 && (
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-amber-800 mb-3 flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Pending Approval ({pending.length})
              </h2>
              {pending.map(renderCampaignCard)}
            </div>
          )}
          {other.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-stone-600 mb-3">History</h2>
              {other.map(renderCampaignCard)}
            </div>
          )}
          {campaigns?.length === 0 && (
            <div className="text-center py-16 text-stone-500">
              <Bell className="w-12 h-12 mx-auto mb-4 text-stone-300" />
              <p>No campaigns yet. They'll appear here automatically on Friday and Monday mornings.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}