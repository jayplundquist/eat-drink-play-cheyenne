import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import VenueForm from "../components/VenueForm";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { useSEO } from "@/hooks/useSEO";

export default function AddVenue() {
  useSEO({
    title: 'Add a Venue to Eat, Drink, Play Cheyenne',
    description: 'Submit a Cheyenne restaurant, bar, event space, activity, or local business to Eat, Drink, Play Cheyenne and help locals discover new spots.',
    noindex: true,
  });

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isIdle, setIsIdle] = useState(false);
  const [tumbleweedKey, setTumbleweedKey] = useState(0);

  useEffect(() => {
    base44.auth.me()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    let idleTimer;
    let tumbleweedTimer;

    const resetIdleTimer = () => {
      clearTimeout(idleTimer);
      clearInterval(tumbleweedTimer);
      setIsIdle(false);

      idleTimer = setTimeout(() => {
        setIsIdle(true);
        tumbleweedTimer = setInterval(() => {
          setTumbleweedKey(k => k + 1);
        }, 10000);
      }, 30000);
    };

    window.addEventListener('click', resetIdleTimer);
    window.addEventListener('keydown', resetIdleTimer);
    resetIdleTimer();

    return () => {
      clearTimeout(idleTimer);
      clearInterval(tumbleweedTimer);
      window.removeEventListener('click', resetIdleTimer);
      window.removeEventListener('keydown', resetIdleTimer);
    };
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

  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-stone-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16 text-center">
          <h1 className="text-2xl font-bold text-stone-800 mb-4">Admin Access Required</h1>
          <p className="text-stone-600 mb-8">
            {!user ? 'You need to sign in as an admin to add venues' : 'Only administrators can add venues'}
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

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Idle Tumbleweed Animation */}
      {isIdle && (
        <motion.div
          key={tumbleweedKey}
          initial={{ x: '-100px', y: '50%', opacity: 1 }}
          animate={{ x: 'calc(100vw + 100px)', y: '50%', rotate: 360 }}
          transition={{ duration: 8, ease: 'linear' }}
          className="fixed pointer-events-none z-50"
        >
          <div className="text-6xl">🌵</div>
        </motion.div>
      )}

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