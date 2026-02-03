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
         // Check if running in iframe (preview mode)
         if (window.self !== window.top) {
           toast.error('Checkout only works from a published app. Please visit your live site.');
           setIsProcessing(false);
           return;
         }

         // Create Stripe checkout session using backend function
         const response = await base44.functions.invoke('createCheckoutSession', {
           type: 'review_boost',
           reviewId: ratingId
         });

         const sessionUrl = response.data.url;

         // Redirect to Stripe checkout
         if (sessionUrl) {
           window.location.href = sessionUrl;
         } else {
           throw new Error('No checkout URL returned');
         }
       } catch (error) {
         console.error('Boost error:', error);
         toast.error('Failed to start checkout. Please try again.');
       } finally {
         setIsProcessing(false);
       }
     },
   });

   const handleBoost = async () => {
     boostReviewMutation.mutate();
   };

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