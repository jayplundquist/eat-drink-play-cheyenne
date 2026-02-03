import React, { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Search } from "lucide-react";
import ActivityFeedItem from '../components/ActivityFeedItem';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { toast } from 'sonner';

export default function ActivityFeed() {
  const [currentUser, setCurrentUser] = useState(null);
  const [searchEmail, setSearchEmail] = useState('');
  const [showResults, setShowResults] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me()
      .then(setCurrentUser)
      .catch(() => {
        base44.auth.redirectToLogin();
      });
  }, []);

  // Fetch all data upfront
  const { data: allVenues = [] } = useQuery({
    queryKey: ['allVenues'],
    queryFn: () => base44.entities.Venue.list(),
  });

  const { data: allUsers = [] } = useQuery({
    queryKey: ['allUsers'],
    queryFn: () => base44.entities.User.list(),
  });

  const { data: follows = [] } = useQuery({
    queryKey: ['follows'],
    queryFn: () => base44.entities.Follow.filter({ user_email: currentUser?.email }),
    enabled: !!currentUser?.email,
  });

  const { data: allRatings = [] } = useQuery({
    queryKey: ['allRatings'],
    queryFn: () => base44.entities.Rating.list(),
  });

  const { data: allFavorites = [] } = useQuery({
    queryKey: ['allFavorites'],
    queryFn: () => base44.entities.Favorite.list(),
  });

  const { data: allBootShares = [] } = useQuery({
    queryKey: ['allBootShares'],
    queryFn: () => base44.entities.BootShare.list(),
  });

  const { data: allReviewReactions = [] } = useQuery({
    queryKey: ['allReviewReactions'],
    queryFn: () => base44.entities.ReviewReaction.list(),
  });

  // Mutations
  const deleteBootShareMutation = useMutation({
    mutationFn: (id) => base44.entities.BootShare.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allBootShares'] });
      toast.success('Boot share deleted');
    },
  });

  const deleteReviewMutation = useMutation({
    mutationFn: async (id) => {
      const rating = allRatings.find(r => r.id === id);
      if (!rating) return;

      await base44.entities.Rating.delete(id);

      const venue = allVenues.find(v => v.id === rating.venue_id);
      if (venue) {
        const newCount = Math.max(0, (venue.rating_count || 0) - 1);
        const newSum = Math.max(0, (venue.rating_sum || 0) - (rating.boots || 0));
        await base44.entities.Venue.update(venue.id, {
          rating_count: newCount,
          rating_sum: newSum,
          total_ratings: Math.max(0, (venue.total_ratings || 0) - (rating.boots || 0))
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allRatings'] });
      queryClient.invalidateQueries({ queryKey: ['allVenues'] });
      toast.success('Review deleted');
    },
  });

  const deletePhotoMutation = useMutation({
    mutationFn: async ({ reviewId, photoUrl }) => {
      const rating = allRatings.find(r => r.id === reviewId);
      if (!rating) return;

      const updatedUrls = (rating.image_urls || []).filter(url => url !== photoUrl);
      await base44.entities.Rating.update(reviewId, { image_urls: updatedUrls });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allRatings'] });
      toast.success('Photo deleted');
    },
  });

  // Build activity items
  const activityItems = useMemo(() => {
    if (!currentUser?.email) return [];

    const followedEmails = follows.map(f => f.following_email);
    const items = [];

    // Add reviews from followed users
    allRatings.forEach(rating => {
      if (followedEmails.includes(rating.user_email)) {
        const venue = allVenues.find(v => v.id === rating.venue_id);
        if (venue) {
          const boostExpired = rating.boosted_until ? new Date(rating.boosted_until) < new Date() : true;
          const isBoosted = rating.boosted_until && !boostExpired;
          const reactionCount = allReviewReactions.filter(r => r.rating_id === rating.id).length;

          items.push({
            type: 'review',
            id: rating.id,
            timestamp: rating.created_date,
            data: rating,
            user_email: rating.user_email,
            isOwn: rating.user_email === currentUser.email,
            isBoosted,
            isPopular: reactionCount >= 3 && !isBoosted,
            sortScore: isBoosted ? 2 : (reactionCount >= 3 ? 1 : 0),
          });
        }
      }
    });

    // Add favorites from followed users
    allFavorites.forEach(fav => {
      if (followedEmails.includes(fav.user_email)) {
        const venue = allVenues.find(v => v.id === fav.venue_id);
        if (venue) {
          items.push({
            type: 'favorite',
            id: fav.id,
            timestamp: fav.created_date,
            data: fav,
            user_email: fav.user_email,
            sortScore: 0,
          });
        }
      }
    });

    // Add boot shares from followed users
    allBootShares.forEach(share => {
      if (followedEmails.includes(share.user_email)) {
        items.push({
          type: 'boot_share',
          id: share.id,
          timestamp: share.shared_date,
          data: share,
          user_email: share.user_email,
          isOwn: share.user_email === currentUser.email,
          sortScore: 1,
        });
      }
    });

    // Sort by boosted/popular first, then by date
    return items.sort((a, b) => {
      if (a.sortScore !== b.sortScore) return b.sortScore - a.sortScore;
      return new Date(b.timestamp) - new Date(a.timestamp);
    });
  }, [currentUser, follows, allRatings, allFavorites, allBootShares, allVenues, allReviewReactions]);

  // Search results
  const searchResults = useMemo(() => {
    if (!searchEmail.trim()) return [];
    return allUsers.filter(u =>
      u.email.toLowerCase().includes(searchEmail.toLowerCase()) &&
      u.email !== currentUser?.email
    ).slice(0, 5);
  }, [searchEmail, allUsers, currentUser]);

  const followedUserRatings = useMemo(() => {
    if (!follows) return [];
    const followedEmails = follows.map(f => f.following_email);
    return allRatings.filter(r => followedEmails.includes(r.user_email));
  }, [follows, allRatings]);

  if (!currentUser) {
    return (
      <div className="max-w-4xl mx-auto p-6 space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="space-y-4">
            <Skeleton className="h-32 w-full rounded-lg" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-amber-900 mb-6" style={{ fontFamily: 'Rye, serif' }}>
          The Hitching Post
        </h1>

        <div className="relative mb-6">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-stone-400 w-4 h-4" />
              <Input
                type="text"
                placeholder="Search users to follow..."
                value={searchEmail}
                onChange={(e) => {
                  setSearchEmail(e.target.value);
                  setShowResults(true);
                }}
                onBlur={() => setTimeout(() => setShowResults(false), 200)}
                className="pl-10"
              />
            </div>
          </div>

          {showResults && searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-stone-200 rounded-lg shadow-lg z-10">
              {searchResults.map(user => (
                <Link
                  key={user.id}
                  to={`${createPageUrl('UserProfile')}?email=${user.email}`}
                  onClick={() => {
                    setSearchEmail('');
                    setShowResults(false);
                  }}
                  className="block p-3 hover:bg-stone-100 border-b border-stone-200 last:border-0"
                >
                  <div className="font-semibold text-stone-800">{user.full_name}</div>
                  <div className="text-sm text-stone-500">{user.email}</div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {follows && follows.length === 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 text-center">
            <p className="text-stone-600 mb-4">
              Follow other users to see their activity here!
            </p>
            <Button asChild className="bg-amber-700 hover:bg-amber-800">
              <Link to={createPageUrl('Home')}>Explore Users</Link>
            </Button>
          </div>
        )}
      </div>

      {activityItems.length === 0 && follows && follows.length > 0 ? (
        <div className="text-center py-12 text-stone-600">
          <p>No activity yet. Follow more users to see their activity!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {activityItems.map((item, i) => {
            const venue = item.type === 'review' || item.type === 'favorite'
              ? allVenues.find(v => v.id === item.data.venue_id)
              : null;

            return (
              <ActivityFeedItem
                key={item.id}
                item={item}
                i={i}
                venue={venue}
                currentUser={currentUser}
                followedUserRatings={followedUserRatings}
                deleteBootShareMutation={deleteBootShareMutation}
                deleteReviewMutation={deleteReviewMutation}
                deletePhotoMutation={deletePhotoMutation}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}