import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Skeleton } from "@/components/ui/skeleton";
import BootCheckList from "@/components/BootCheckList";

export default function BootFinder() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.auth.me()
      .then((userData) => {
        setUser(userData);
        setLoading(false);
      })
      .catch(() => {
        base44.auth.redirectToLogin();
      });
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-6">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="mb-6">
          <h1 className="text-3xl sm:text-4xl font-bold text-amber-900 mb-2" style={{ fontFamily: 'Rye, serif' }}>
            Big Boot Finder
          </h1>
          <p className="text-stone-600">
            Track down all 29 iconic Cheyenne Big Boots. Drop a photo at each one to add it to your collection.
          </p>
        </div>

        <BootCheckList user={user} />
      </div>
    </div>
  );
}