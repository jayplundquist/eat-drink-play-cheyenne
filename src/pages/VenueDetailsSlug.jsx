import React, { useEffect } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Skeleton } from '@/components/ui/skeleton';
import VenueDetails from './VenueDetails';

export default function VenueDetailsSlug() {
  const { category, slug } = useParams();

  const { data: venue, isLoading } = useQuery({
    queryKey: ['venueBySlug', category, slug],
    queryFn: async () => {
      // manual_slug takes priority, then auto slug
      const byManual = await base44.entities.Venue.filter({ manual_slug: slug });
      if (byManual && byManual.length > 0) return byManual[0];
      const bySlug = await base44.entities.Venue.filter({ slug });
      return bySlug && bySlug.length > 0 ? bySlug[0] : null;
    },
    enabled: !!slug,
  });

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [slug]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-stone-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
          <Skeleton className="h-8 w-32 mb-6" />
          <Skeleton className="aspect-[16/9] rounded-xl mb-6" />
          <Skeleton className="h-8 w-2/3 mb-4" />
          <Skeleton className="h-4 w-1/3 mb-8" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  if (!venue) {
    return <Navigate to="/" replace />;
  }

  // If the URL category doesn't match the venue's canonical category, redirect
  // to the correct URL so there is a single canonical address per venue.
  const canonicalCategory = venue.primary_category || (venue.categories && venue.categories[0]);
  if (canonicalCategory && category !== canonicalCategory) {
    const canonicalSlug = venue.manual_slug || venue.slug;
    return <Navigate to={`/${canonicalCategory}/${canonicalSlug}`} replace />;
  }

  return <VenueDetails venueId={venue.id} />;
}