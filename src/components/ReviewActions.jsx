import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Trash2, MessageCircle, ThumbsUp, ThumbsDown, Zap } from "lucide-react";
import { toast } from "sonner";
import moment from 'moment';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function ReviewActions({ ratingId, reviewUserId, currentUserEmail, isAlreadyBoosted }) {
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [boostOpen, setBoostOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const queryClient = useQueryClient();

  // Fetch all data upfront - all hooks called unconditionally
  const { data: comments = [] } = useQuery({
    queryKey: ['reviewComments', ratingId],
    queryFn: () => base44.entities.ReviewComment.filter({ review_id: ratingId }, '-created_date'),
  });

  const { data: allUsers = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list(),
  });

  const { data: allReviews = [] } = useQuery({
    queryKey: ['allReviews'],
    queryFn: () => base44.entities.Rating.list(),
  });

  const { data: allCommentReactions = [] } = useQuery({
    queryKey: ['allCommentReactions'],
    queryFn: () => base44.entities.CommentReaction.list(),
  });

  const { data: allReviewReactions = [] } = useQuery({
    queryKey: ['allReviewReactions'],
    queryFn: () => base44.entities.ReviewReaction.list(),
  });

  // Mutations
  const createCommentMutation = useMutation({
    mutationFn: (data) => base44.entities.ReviewComment.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviewComments', ratingId] });
      setCommentText('');
      toast.success('Comment added!');
    },
  });

  const deleteCommentMutation = useMutation({
    mutationFn: (id) => base44.entities.ReviewComment.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviewComments', ratingId] });
      toast.success('Comment deleted');
    },
  });

  const toggleCommentReactionMutation = useMutation({
    mutationFn: async ({ commentId, reactionType }) => {
      const filtered = allCommentReactions.filter(r => r.comment_id === commentId);
      const existing = filtered.find(r => r.user_email === currentUserEmail && r.reaction_type === reactionType);
      
      if (existing) {
        await base44.entities.CommentReaction.delete(existing.id);
      } else {
        const userReaction = filtered.find(r => r.user_email === currentUserEmail);
        if (userReaction) {
          await base44.entities.CommentReaction.delete(userReaction.id);
        }
        await base44.entities.CommentReaction.create({
          comment_id: commentId,
          user_email: currentUserEmail,
          reaction_type: reactionType
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allCommentReactions'] });
    },
  });

  const toggleReviewReactionMutation = useMutation({
    mutationFn: async ({ reactionType }) => {
      const filtered = allReviewReactions.filter(r => r.rating_id === ratingId);
      const existing = filtered.find(r => r.user_email === currentUserEmail && r.reaction_type === reactionType);
      
      if (existing) {
        await base44.entities.ReviewReaction.delete(existing.id);
      } else {
        const userReaction = filtered.find(r => r.user_email === currentUserEmail);
        if (userReaction) {
          await base44.entities.ReviewReaction.delete(userReaction.id);
        }
        await base44.entities.ReviewReaction.create({
          rating_id: ratingId,
          user_email: currentUserEmail,
          reaction_type: reactionType
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allReviewReactions'] });
    },
  });

  const boostReviewMutation = useMutation({
    mutationFn: async () => {
      if (window.self !== window.top) {
        throw new Error('Checkout only works from a published app.');
      }

      const response = await base44.functions.invoke('createCheckoutSession', {
        type: 'review_boost',
        reviewId: ratingId
      });

      if (response.data.url) {
        window.location.href = response.data.url;
      } else {
        throw new Error('No checkout URL returned');
      }
    },
    onSuccess: () => {
      setIsProcessing(false);
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to start checkout.');
      setIsProcessing(false);
    },
  });

  const handleCommentSubmit = (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    createCommentMutation.mutate({
      review_id: ratingId,
      user_email: currentUserEmail,
      comment_text: commentText.trim(),
    });
  };

  const getUserName = (email) => {
    const user = allUsers.find(u => u.email === email);
    return user?.full_name || email?.split('@')[0] || 'User';
  };

  const reviewReactions = allReviewReactions.filter(r => r.rating_id === ratingId);
  const thumbsUpCount = reviewReactions.filter(r => r.reaction_type === 'thumbs_up').length;
  const thumbsDownCount = reviewReactions.filter(r => r.reaction_type === 'thumbs_down').length;
  const userReviewReaction = reviewReactions.find(r => r.user_email === currentUserEmail);

  return (
    <div className="mt-3 space-y-3 border-t border-stone-200 pt-3">
      {/* Review Reactions */}
      <div className="flex gap-2">
        <Button
          variant={userReviewReaction?.reaction_type === 'thumbs_up' ? 'default' : 'outline'}
          size="sm"
          onClick={() => toggleReviewReactionMutation.mutate({ reactionType: 'thumbs_up' })}
          className={`h-7 px-2 ${userReviewReaction?.reaction_type === 'thumbs_up' ? 'bg-amber-600 hover:bg-amber-700' : 'border-stone-300'}`}
        >
          <ThumbsUp className="w-3 h-3 mr-1" />
          <span className="text-xs">{thumbsUpCount || 0}</span>
        </Button>
        <Button
          variant={userReviewReaction?.reaction_type === 'thumbs_down' ? 'default' : 'outline'}
          size="sm"
          onClick={() => toggleReviewReactionMutation.mutate({ reactionType: 'thumbs_down' })}
          className={`h-7 px-2 ${userReviewReaction?.reaction_type === 'thumbs_down' ? 'bg-amber-600 hover:bg-amber-700' : 'border-stone-300'}`}
        >
          <ThumbsDown className="w-3 h-3 mr-1" />
          <span className="text-xs">{thumbsDownCount || 0}</span>
        </Button>

        {reviewUserId === currentUserEmail && !isAlreadyBoosted && (
          <Dialog open={boostOpen} onOpenChange={setBoostOpen}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-7 px-2 border-amber-300 text-amber-700 hover:bg-amber-50"
              >
                <Zap className="w-3 h-3 mr-1" />
                Boost for $1
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Boost Your Review</DialogTitle>
                <DialogDescription>
                  Your review will be featured for 7 days
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="bg-amber-50 p-4 rounded-lg">
                  <p className="text-sm text-amber-900">
                    <strong>$1.00</strong> for 7 days of featured placement
                  </p>
                </div>
                <Button
                  onClick={() => boostReviewMutation.mutate()}
                  disabled={isProcessing || boostReviewMutation.isPending}
                  className="w-full bg-amber-600 hover:bg-amber-700 text-white"
                >
                  {isProcessing || boostReviewMutation.isPending ? 'Processing...' : 'Confirm Boost'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}

        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowComments(!showComments)}
          className="h-7 px-2 text-stone-600 hover:text-stone-800"
        >
          <MessageCircle className="w-3 h-3 mr-1" />
          {comments.length > 0 ? comments.length : 'Comment'}
        </Button>
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="space-y-3 mt-3 pt-3 border-t border-stone-200">
          {comments.map((comment) => {
            const commentReactions = allCommentReactions.filter(r => r.comment_id === comment.id);
            const commentThumbsUp = commentReactions.filter(r => r.reaction_type === 'thumbs_up').length;
            const commentThumbsDown = commentReactions.filter(r => r.reaction_type === 'thumbs_down').length;
            const userCommentReaction = commentReactions.find(r => r.user_email === currentUserEmail);

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
                    <div className="flex gap-2">
                      <Button
                        variant={userCommentReaction?.reaction_type === 'thumbs_up' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => toggleCommentReactionMutation.mutate({ commentId: comment.id, reactionType: 'thumbs_up' })}
                        className={`h-6 px-2 ${userCommentReaction?.reaction_type === 'thumbs_up' ? 'bg-amber-600 hover:bg-amber-700' : 'border-stone-300'}`}
                      >
                        <ThumbsUp className="w-3 h-3 mr-1" />
                        <span className="text-xs">{commentThumbsUp || 0}</span>
                      </Button>
                      <Button
                        variant={userCommentReaction?.reaction_type === 'thumbs_down' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => toggleCommentReactionMutation.mutate({ commentId: comment.id, reactionType: 'thumbs_down' })}
                        className={`h-6 px-2 ${userCommentReaction?.reaction_type === 'thumbs_down' ? 'bg-amber-600 hover:bg-amber-700' : 'border-stone-300'}`}
                      >
                        <ThumbsDown className="w-3 h-3 mr-1" />
                        <span className="text-xs">{commentThumbsDown || 0}</span>
                      </Button>
                    </div>
                  </div>
                  {currentUserEmail === comment.user_email && (
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

          {/* Add Comment Form */}
          <form onSubmit={handleCommentSubmit} className="space-y-2">
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
        </div>
      )}
    </div>
  );
}