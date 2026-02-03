import React from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { ThumbsUp, ThumbsDown } from "lucide-react";
import { toast } from "sonner";

export default function ReviewReactionButtons({ ratingId, userEmail }) {
  const queryClient = useQueryClient();

  const { data: reactions = [] } = useQuery({
    queryKey: ['reviewReactions', ratingId],
    queryFn: () => base44.entities.ReviewReaction.filter({ rating_id: ratingId }),
  });

  const toggleReactionMutation = useMutation({
    mutationFn: async (reactionType) => {
      const existing = reactions.find(r => r.user_email === userEmail && r.reaction_type === reactionType);
      if (existing) {
        await base44.entities.ReviewReaction.delete(existing.id);
      } else {
        // Remove any existing reaction from this user first
        const userReaction = reactions.find(r => r.user_email === userEmail);
        if (userReaction) {
          await base44.entities.ReviewReaction.delete(userReaction.id);
        }
        await base44.entities.ReviewReaction.create({
          rating_id: ratingId,
          user_email: userEmail,
          reaction_type: reactionType
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviewReactions', ratingId] });
    },
  });

  const reactionConfigs = [
    { type: 'thumbs_up', icon: ThumbsUp, label: 'Thumbs Up' },
    { type: 'thumbs_down', icon: ThumbsDown, label: 'Thumbs Down' }
  ];

  const userReaction = reactions.find(r => r.user_email === userEmail);
  
  const reactionCounts = {};
  reactionConfigs.forEach(config => {
    reactionCounts[config.type] = reactions.filter(r => r.reaction_type === config.type).length;
  });

  return (
    <div className="flex flex-wrap gap-2 mt-3">
      {reactionConfigs.map(({ type, icon: Icon, label }) => (
        <Button
          key={type}
          variant={userReaction?.reaction_type === type ? 'default' : 'outline'}
          size="sm"
          onClick={() => toggleReactionMutation.mutate(type)}
          disabled={toggleReactionMutation.isPending}
          className={userReaction?.reaction_type === type ? 'bg-amber-600 hover:bg-amber-700 border-amber-700' : 'border-stone-300'}
        >
          <Icon className="w-4 h-4 mr-2" />
          <span className="text-xs font-semibold">{reactionCounts[type] || 0}</span>
        </Button>
      ))}
    </div>
  );
}