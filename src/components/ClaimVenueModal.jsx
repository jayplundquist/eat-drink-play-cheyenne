import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { Loader2, Check } from "lucide-react";
import { toast } from "sonner";

const STRIPE_PUBLISHABLE_KEY = process.env.REACT_APP_STRIPE_PUBLIC_KEY;

export default function ClaimVenueModal({ open, onOpenChange, venueName, venueId, user }) {
  const [step, setStep] = useState('pricing'); // 'pricing' or 'processing'
  
  const submitClaimMutation = useMutation({
    mutationFn: async () => {
      // Submit a claim request
      await base44.entities.ClaimRequest.create({
        venue_id: venueId,
        venue_name: venueName,
        user_email: user.email,
        status: 'pending',
      });
    },
    onSuccess: () => {
      toast.success('Claim request submitted! Admin will review it soon.');
      setStep('pricing');
      onOpenChange(false);
    },
    onError: () => {
      toast.error('Failed to submit claim request. Please try again.');
    },
  });

  const handleCheckout = async () => {
    setStep('processing');
    
    try {
      // Create Stripe checkout session using backend function
      const response = await base44.functions.invoke('createCheckoutSession', {
        userEmail: user.email,
        venueId: venueId,
        venueName: venueName,
      });

      const session = response.data;

      // Redirect to Stripe checkout
      if (window.Stripe) {
        const stripe = await window.Stripe(STRIPE_PUBLISHABLE_KEY);
        await stripe.redirectToCheckout({ sessionId: session.id });
      }
    } catch (error) {
      toast.error('Failed to start checkout. Please try again.');
      setStep('pricing');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Claim Your Venue</DialogTitle>
          <DialogDescription>
            Upgrade to Premium to claim and manage {venueName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {step === 'pricing' && (
            <>
              <Card className="p-6 bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
                <h3 className="font-bold text-lg text-amber-900 mb-4">Premium Plan</h3>
                <div className="space-y-3 mb-6">
                  <div className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-green-600 mt-0.5" />
                    <span className="text-sm text-stone-700">Claim your venue and manage it</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-green-600 mt-0.5" />
                    <span className="text-sm text-stone-700">Update venue details and photos</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-green-600 mt-0.5" />
                    <span className="text-sm text-stone-700">Direct access to your venue page</span>
                  </div>
                </div>

                <div className="mb-6">
                   <p className="text-xs text-stone-600 mb-2">Monthly subscription</p>
                   <div className="flex items-baseline gap-1">
                     <span className="text-3xl font-bold text-amber-900">$2</span>
                     <span className="text-sm text-stone-600">/month</span>
                   </div>
                 </div>

                <Button
                  onClick={handleCheckout}
                  className="w-full bg-amber-600 hover:bg-amber-700 text-white"
                  disabled={submitClaimMutation.isPending}
                >
                  Get Premium Access
                </Button>
              </Card>

              <p className="text-xs text-stone-500 text-center">
                Secure payment powered by Stripe
              </p>
            </>
          )}

          {step === 'processing' && (
            <div className="flex flex-col items-center justify-center py-8">
              <Loader2 className="w-8 h-8 text-amber-600 animate-spin mb-4" />
              <p className="text-stone-600">Processing your payment...</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}