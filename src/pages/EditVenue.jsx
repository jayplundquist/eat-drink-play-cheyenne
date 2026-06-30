import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import VenueForm from "../components/VenueForm";
import { toast } from "sonner";

export default function EditVenue() {
  const urlParams = new URLSearchParams(window.location.search);
  const venueId = urlParams.get('id');
  
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  useEffect(() => {
    base44.auth.me()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const { data: venue, isLoading: venueLoading } = useQuery({
    queryKey: ['venue', venueId],
    queryFn: async () => {
      const venues = await base44.entities.Venue.filter({ id: venueId });
      return venues[0];
    },
    enabled: !!venueId && !!user,
  });

  const updateVenueMutation = useMutation({
    mutationFn: (venueData) => {
      // Remove only rating fields, keep everything else
      const updateData = { ...venueData };
      delete updateData.rating_sum;
      delete updateData.rating_count;
      delete updateData.id;
      delete updateData.created_date;
      delete updateData.updated_date;
      delete updateData.created_by;
      return base44.entities.Venue.update(venueId, updateData);
    },
    onSuccess: () => {
      toast.success('Venue updated successfully!');
      window.location.href = createPageUrl(`VenueDetails?id=${venueId}`);
    },
  });

  const deleteVenueMutation = useMutation({
    mutationFn: async () => {
      await base44.entities.Venue.delete(venueId);
    },
    onSuccess: () => {
      toast.success('Venue deleted successfully');
      window.location.href = createPageUrl('ManageVenues');
    },
  });

  const initiateBoostCheckout = async (venuId) => {
    setCheckoutLoading(true);
    try {
      const response = await base44.functions.invoke('createCheckoutSession', {
        venueId: venueId,
        boostType: 'venue'
      });

      const session = response.data;

      if (window.Stripe) {
        const stripe = await window.Stripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);
        await stripe.redirectToCheckout({ sessionId: session.id });
      }
    } catch (error) {
      toast.error('Failed to initiate checkout');
      console.error(error);
    } finally {
      setCheckoutLoading(false);
    }
  };

  if (loading || venueLoading) {
    return (
      <div className="min-h-screen bg-stone-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
          <Skeleton className="h-8 w-48 mb-6" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-stone-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16 text-center">
          <h1 className="text-2xl font-bold text-stone-800 mb-4">Admin Access Required</h1>
          <p className="text-stone-600 mb-8">
            {!user ? 'You need to sign in as an admin to edit venues' : 'Only administrators can edit venues'}
          </p>
          {!user ? (
            <Button 
              onClick={() => base44.auth.redirectToLogin()}
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              Sign In
            </Button>
          ) : (
            <Link to={createPageUrl('Home')}>
              <Button className="bg-amber-600 hover:bg-amber-700 text-white">
                Back to Home
              </Button>
            </Link>
          )}
        </div>
      </div>
    );
  }

  if (!venue) {
    return (
      <div className="min-h-screen bg-stone-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16 text-center">
          <h1 className="text-2xl font-bold text-stone-800 mb-4">Venue not found</h1>
          <Link to={createPageUrl('ManageVenues')}>
            <Button variant="outline">Back to Manage</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <div className="bg-gradient-to-br from-stone-900 via-stone-800 to-amber-900 text-white py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <Link to={createPageUrl(`VenueDetails?id=${venueId}`)}>
            <Button variant="ghost" size="sm" className="text-white/80 hover:text-white hover:bg-white/10 mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Venue
            </Button>
          </Link>
          
          <h1 className="text-3xl font-bold">Edit Venue</h1>
          <p className="text-stone-300 mt-2">
            Update information for {venue.name}
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
         <VenueForm
           venue={venue}
           onSave={(data) => updateVenueMutation.mutate(data)}
           onCancel={() => window.location.href = createPageUrl(`VenueDetails?id=${venueId}`)}
           isSaving={updateVenueMutation.isPending}
           user={user}
           onInitiateBoostCheckout={initiateBoostCheckout}
           onDelete={() => deleteVenueMutation.mutate()}
         />
       </div>
       {checkoutLoading && (
         <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
           <div className="bg-white rounded-lg p-8 flex flex-col items-center gap-4">
             <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
             <p className="text-stone-700 font-medium">Redirecting to checkout...</p>
           </div>
         </div>
       )}
    </div>
  );
}