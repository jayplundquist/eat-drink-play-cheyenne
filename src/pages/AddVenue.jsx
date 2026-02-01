import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import VenueForm from "../components/VenueForm";
import { toast } from "sonner";

export default function AddVenue() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.auth.me()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const createVenueMutation = useMutation({
    mutationFn: (venueData) => base44.entities.Venue.create({
      ...venueData,
      rating_sum: 0,
      rating_count: 0,
    }),
    onSuccess: () => {
      toast.success('Venue created successfully!');
      window.location.href = createPageUrl('ManageVenues');
    },
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-stone-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16 text-center">
          <h1 className="text-2xl font-bold text-stone-800 mb-4">Sign in required</h1>
          <p className="text-stone-600 mb-8">
            You need to sign in to add venues
          </p>
          <Button 
            onClick={() => base44.auth.redirectToLogin()}
            className="bg-amber-600 hover:bg-amber-700 text-white"
          >
            Sign In
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <div className="bg-gradient-to-br from-stone-900 via-stone-800 to-amber-900 text-white py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <Link to={createPageUrl('ManageVenues')}>
            <Button variant="ghost" size="sm" className="text-white/80 hover:text-white hover:bg-white/10 mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Manage
            </Button>
          </Link>
          
          <h1 className="text-3xl font-bold">Add New Venue</h1>
          <p className="text-stone-300 mt-2">
            Add a new restaurant, bar, brewery, or activity to the Cheyenne Guide
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <VenueForm
          onSave={(data) => createVenueMutation.mutate(data)}
          onCancel={() => window.location.href = createPageUrl('ManageVenues')}
          isSaving={createVenueMutation.isPending}
        />
      </div>
    </div>
  );
}