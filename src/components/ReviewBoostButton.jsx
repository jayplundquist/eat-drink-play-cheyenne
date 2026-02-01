import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Zap } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function ReviewBoostButton({ ratingId, userEmail, currentUserEmail, isAlreadyBoosted, onBoostSuccess }) {
  const [open, setOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const queryClient = useQueryClient();

  const boostReviewMutation = useMutation({
    mutationFn: async () => {
      setIsProcessing(true);
      try {
        // Calculate boost expiry (7 days from now)
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + 7);
        
        // Update the rating with boost info
        await base44.entities.Rating.update(ratingId, {
          boosted_until: expiryDate.toISOString(),
          boost_payment_id: `boost_${Date.now()}`
        });

        toast.success('Review boosted for 7 days! 🚀');
        setOpen(false);
        queryClient.invalidateQueries({ queryKey: ['followedUserRatings'] });
        onBoostSuccess?.();
      } finally {
        setIsProcessing(false);
      }
    },
  });

  const handleBoost = async () => {
    boostReviewMutation.mutate();
  };

  // Don't show boost button if not the review author or already boosted
  if (userEmail !== currentUserEmail || isAlreadyBoosted) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="border-amber-300 text-amber-700 hover:bg-amber-50"
        >
          <Zap className="w-4 h-4 mr-1" />
          Boost for $1
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Boost Your Review</DialogTitle>
          <DialogDescription>
            Your review will be featured in everyone's activity feed for 7 days
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="bg-amber-50 p-4 rounded-lg">
            <p className="text-sm text-amber-900">
              <strong>$1.00</strong> for 7 days of featured placement
            </p>
          </div>
          <Button
            onClick={handleBoost}
            disabled={isProcessing || boostReviewMutation.isPending}
            className="w-full bg-amber-600 hover:bg-amber-700 text-white"
          >
            {isProcessing || boostReviewMutation.isPending ? 'Processing...' : 'Confirm Boost'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}