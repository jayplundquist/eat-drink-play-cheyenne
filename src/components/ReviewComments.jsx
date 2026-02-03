import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Trash2, MessageCircle, ThumbsUp, ThumbsDown } from "lucide-react";
import { toast } from "sonner";
import moment from 'moment';

export default function ReviewComments({ reviewId, currentUser }) {
   const [showComments, setShowComments] = useState(false);
   const [commentText, setCommentText] = useState('');
   const queryClient = useQueryClient();

   const { data: comments = [], isLoading } = useQuery({
     queryKey: ['reviewComments', reviewId],
     queryFn: () => base44.entities.ReviewComment.filter({ review_id: reviewId }, '-created_date'),
     enabled: !!reviewId,
   });

   const { data: allUsers = [] } = useQuery({
     queryKey: ['users'],
     queryFn: () => base44.entities.User.list(),
     enabled: !!reviewId,
   });

   const { data: allCommentReactions = [] } = useQuery({
     queryKey: ['allCommentReactions', reviewId, comments.map(c => c.id).join(',')],
     queryFn: async () => {
       if (comments.length === 0) return [];
       const allReactions = await base44.entities.CommentReaction.list();
       const commentIds = comments.map(c => c.id);
       return allReactions.filter(r => commentIds.includes(r.comment_id));
     },
     enabled: !!reviewId,
   });

   const createCommentMutation = useMutation({
    mutationFn: (data) => base44.entities.ReviewComment.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviewComments', reviewId] });
      setCommentText('');
      toast.success('Comment added!');
    },
  });

  const deleteCommentMutation = useMutation({
    mutationFn: (id) => base44.entities.ReviewComment.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviewComments', reviewId] });
      toast.success('Comment deleted');
    },
  });

  const toggleCommentReactionMutation = useMutation({
    mutationFn: async ({ commentId, reactionType }) => {
      const allReactions = await base44.entities.CommentReaction.filter({ comment_id: commentId });
      const existing = allReactions.find(r => r.user_email === currentUser.email && r.reaction_type === reactionType);
      
      if (existing) {
        await base44.entities.CommentReaction.delete(existing.id);
      } else {
        const userReaction = allReactions.find(r => r.user_email === currentUser.email);
        if (userReaction) {
          await base44.entities.CommentReaction.delete(userReaction.id);
        }
        await base44.entities.CommentReaction.create({
          comment_id: commentId,
          user_email: currentUser.email,
          reaction_type: reactionType
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviewComments', reviewId] });
      queryClient.invalidateQueries({ queryKey: ['allCommentReactions', reviewId] });
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    if (!currentUser) {
      base44.auth.redirectToLogin();
      return;
    }
    createCommentMutation.mutate({
      review_id: reviewId,
      user_email: currentUser.email,
      comment_text: commentText.trim(),
    });
  };

  const getUserName = (email) => {
    const user = allUsers.find(u => u.email === email);
    return user?.full_name || email?.split('@')[0] || 'User';
  };

  return (
    <div className="mt-3 border-t border-stone-200 pt-3">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setShowComments(!showComments)}
        className="text-stone-600 hover:text-stone-800"
      >
        <MessageCircle className="w-4 h-4 mr-2" />
        {comments.length > 0 ? `${comments.length} ${comments.length === 1 ? 'Comment' : 'Comments'}` : 'Comment'}
      </Button>

      {showComments && (
        <div className="mt-3 space-y-3">
          {/* Comment List */}
          {isLoading ? (
            <p className="text-xs text-stone-500">Loading comments...</p>
          ) : (
            <div className="space-y-2">
              {comments.map((comment) => {
                const commentReactions = allCommentReactions.filter(r => r.comment_id === comment.id);
                const thumbsUpCount = commentReactions.filter(r => r.reaction_type === 'thumbs_up').length;
                const thumbsDownCount = commentReactions.filter(r => r.reaction_type === 'thumbs_down').length;
                const userReaction = commentReactions.find(r => r.user_email === currentUser?.email);

                return (
                  <div key={comment.id} className="bg-stone-50 rounded-lg p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-semibold text-stone-800">
                            {getUserName(comment.user_email)}
                          </span>
                          <span className="text-xs text-stone-500">
                            {moment(comment.created_date).fromNow()}
                          </span>
                        </div>
                        <p className="text-sm text-stone-700 mb-2">{comment.comment_text}</p>
                        {currentUser && (
                          <div className="flex gap-2">
                            <Button
                              variant={userReaction?.reaction_type === 'thumbs_up' ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => toggleCommentReactionMutation.mutate({ commentId: comment.id, reactionType: 'thumbs_up' })}
                              className={`h-6 px-2 ${userReaction?.reaction_type === 'thumbs_up' ? 'bg-amber-600 hover:bg-amber-700' : 'border-stone-300'}`}
                            >
                              <ThumbsUp className="w-3 h-3 mr-1" />
                              <span className="text-xs">{thumbsUpCount || 0}</span>
                            </Button>
                            <Button
                              variant={userReaction?.reaction_type === 'thumbs_down' ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => toggleCommentReactionMutation.mutate({ commentId: comment.id, reactionType: 'thumbs_down' })}
                              className={`h-6 px-2 ${userReaction?.reaction_type === 'thumbs_down' ? 'bg-amber-600 hover:bg-amber-700' : 'border-stone-300'}`}
                            >
                              <ThumbsDown className="w-3 h-3 mr-1" />
                              <span className="text-xs">{thumbsDownCount || 0}</span>
                            </Button>
                          </div>
                        )}
                      </div>
                      {currentUser?.email === comment.user_email && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteCommentMutation.mutate(comment.id)}
                          className="h-6 w-6 text-rose-500 hover:text-rose-700"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Add Comment Form */}
          {currentUser && (
            <form onSubmit={handleSubmit} className="space-y-2">
              <Textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Add a comment..."
                className="text-sm"
                rows={2}
              />
              <div className="flex justify-end">
                <Button
                  type="submit"
                  size="sm"
                  disabled={!commentText.trim() || createCommentMutation.isPending}
                  className="bg-amber-700 hover:bg-amber-800"
                >
                  {createCommentMutation.isPending ? 'Posting...' : 'Post Comment'}
                </Button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
}