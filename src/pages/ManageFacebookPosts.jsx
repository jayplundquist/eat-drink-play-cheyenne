import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Facebook } from 'lucide-react';
import { toast } from 'sonner';
import FacebookPostCard from '@/components/facebook/FacebookPostCard';
import CustomPromptComposer from '@/components/facebook/CustomPromptComposer';
import ManualPostComposer from '@/components/facebook/ManualPostComposer';

export default function ManageFacebookPosts() {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => setUser(null));
  }, []);

  const { data: posts, isLoading } = useQuery({
    queryKey: ['facebookPosts'],
    queryFn: async () => base44.entities.FacebookPost.list('-created_date', 50),
    enabled: user?.role === 'admin',
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }) => base44.entities.FacebookPost.update(id, data),
    onSuccess: () => queryClient.invalidateQueries(['facebookPosts']),
    onError: (err) => toast.error('Update failed: ' + err.message),
  });

  const publishMutation = useMutation({
    mutationFn: async (postId) =>
      base44.functions.invoke('publishFacebookPost', { post_id: postId }),
    onSuccess: (res) => {
      queryClient.invalidateQueries(['facebookPosts']);
      toast.success(res.data?.page ? `Posted to ${res.data.page}!` : 'Posted to Facebook!');
    },
    onError: (err) => toast.error('Publish failed: ' + err.message),
  });

  const rejectMutation = useMutation({
    mutationFn: async (postId) =>
      base44.entities.FacebookPost.update(postId, { status: 'rejected' }),
    onSuccess: () => {
      queryClient.invalidateQueries(['facebookPosts']);
      toast.success('Post rejected');
    },
  });

  if (!user)
    return (
      <div className="flex justify-center p-20">
        <Skeleton className="w-8 h-8 rounded-full" />
      </div>
    );
  if (user.role !== 'admin') {
    return (
      <div className="max-w-md mx-auto mt-20 text-center p-8">
        <Facebook className="w-12 h-12 mx-auto text-stone-400 mb-4" />
        <p className="text-stone-600">Admin access required to manage Facebook posts.</p>
      </div>
    );
  }

  const pending = (posts || []).filter(
    (p) => p.status === 'pending' || p.status === 'failed'
  );
  const history = (posts || []).filter(
    (p) => p.status === 'published' || p.status === 'rejected'
  );

  const handleUpdate = (id, data, callback) => {
    updateMutation.mutate({ id, data }, { onSuccess: callback });
  };

  const statusBadge = (s) => {
    const map = {
      pending: 'bg-amber-100 text-amber-800 border-amber-300',
      approved: 'bg-blue-100 text-blue-800 border-blue-300',
      published: 'bg-green-100 text-green-800 border-green-300',
      rejected: 'bg-stone-200 text-stone-600 border-stone-300',
      failed: 'bg-red-100 text-red-800 border-red-300',
    };
    return map[s] || 'bg-stone-100 text-stone-600';
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl text-amber-900 mb-1" style={{ fontFamily: 'Rye, serif' }}>
          Facebook Posts
        </h1>
        <p className="text-stone-600 text-sm">
          Auto-composed posts from your campaigns appear here for review. Write your own and
          publish instantly.
        </p>
      </div>

      <ManualPostComposer
        onPublished={() => queryClient.invalidateQueries(['facebookPosts'])}
      />
      <CustomPromptComposer
        onComposed={() => queryClient.invalidateQueries(['facebookPosts'])}
      />

      {isLoading ? (
        [1, 2].map((i) => <Skeleton key={i} className="w-full h-40 mb-4" />)
      ) : (
        <>
          {pending.length > 0 && (
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-amber-800 mb-3 flex items-center gap-2">
                <Facebook className="w-5 h-5" />
                Pending Review ({pending.length})
              </h2>
              {pending.map((p) => (
                <FacebookPostCard
                  key={p.id}
                  post={p}
                  onPublish={publishMutation.mutate}
                  onReject={rejectMutation.mutate}
                  onUpdate={handleUpdate}
                  publishing={publishMutation.isPending}
                />
              ))}
            </div>
          )}
          {history.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-stone-600 mb-3">History</h2>
              {history.map((p) => (
                <div
                  key={p.id}
                  className="mb-3 p-4 border border-stone-200 rounded-lg bg-white"
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex-1 min-w-0">
                      <span className="text-xs font-semibold text-stone-500 uppercase">
                        {p.source_type.replace(/_/g, ' ')}
                      </span>
                      <p className="text-sm text-stone-800 mt-1 whitespace-pre-wrap break-words">
                        {p.post_text}
                      </p>
                    </div>
                    <Badge className={statusBadge(p.status)}>{p.status}</Badge>
                  </div>
                  {p.image_url && (
                    <img
                      src={p.image_url}
                      alt=""
                      className="w-24 h-24 object-cover rounded border border-stone-200"
                    />
                  )}
                  {p.published_date && (
                    <p className="text-xs text-green-700 mt-2">
                      ✓ Published {new Date(p.published_date).toLocaleString()}
                    </p>
                  )}
                  {p.error_message && (
                    <p className="text-xs text-red-600 mt-2">⚠ {p.error_message}</p>
                  )}
                </div>
              ))}
            </div>
          )}
          {posts?.length === 0 && (
            <div className="text-center py-12 text-stone-500">
              <Facebook className="w-12 h-12 mx-auto mb-4 text-stone-300" />
              <p>
                No Facebook posts yet. Auto-composed campaign posts will appear here, or write
                one above.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}