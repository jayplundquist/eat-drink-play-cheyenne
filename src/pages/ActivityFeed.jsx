import React, { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, ArrowLeft, Activity, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { toast } from "sonner";
import ActivityFeedItem from "../components/ActivityFeedItem";

export default function ActivityFeed() {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchEmail, setSearchEmail] = useState('');
  const [allUsers, setAllUsers] = useState([]);
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me()
      .then(user => {
        setCurrentUser(user);
        base44.entities.User.list()
          .then(users => setAllUsers(users))
          .catch(() => {});
        setLoading(false);
      })
      .catch(() => {
        base44.auth.redirectToLogin();
        return;
      });
  }, []);

  const deletePhotoMutation = useMutation({
    mutationFn: async (ratingId, photoUrl) => {
      const rating = await base44.entities.Rating.filter({ id: ratingId });
      if (rating.length > 0) {
        const updatedImages = (rating[0].image_urls || []).filter(url => url !== photoUrl);
        await base44.entities.Rating.update(ratingId, {
          image_urls: updatedImages,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['followedUserRatings'] });
      queryClient.invalidateQueries({ queryKey: ['currentUserRatings'] });
      toast.success('Photo removed');
    },
  });

  const deleteReviewMutation = useMutation({
    mutationFn: async (ratingId) => {
      const rating = await base44.entities.Rating.filter({ id: ratingId });
      if (rating.length > 0) {
        const venueId = rating[0].venue_id;
        await base44.entities.Rating.delete(ratingId);
        const venue = await base44.entities.Venue.filter({ id: venueId });
        if (venue.length > 0) {
          await base44.entities.Venue.update(venueId, {
            rating_sum: Math.max(0, (venue[0].rating_sum || 0) - rating[0].boots),
            rating_count: Math.max(0, (venue[0].rating_count || 0) - 1),
          });
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserRatings'] });
      queryClient.invalidateQueries({ queryKey: ['venues'] });
      toast.success('Review deleted');
    },
  });

  const deleteBootShareMutation = useMutation({
    mutationFn: async (bootShareId) => {
      await base44.entities.BootShare.delete(bootShareId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserBootShares'] });
      toast.success('Boot share deleted');
    },
  });

  const { data: venues = [] } = useQuery({
    queryKey: ['venues'],
    queryFn: () => base44.entities.Venue.list(),
  });

  const [venueCache, setVenueCache] = useState({});

  const { data: userFollows = [] } = useQuery({
    queryKey: ['userFollows', currentUser?.email],
    queryFn: () => currentUser ? base44.entities.Follow.filter({ user_email: currentUser.email }) : [],
    enabled: !!currentUser,
  });

  const followingEmails = useMemo(() => userFollows.map(f => f.following_email), [userFollows]);

  const { data: followedUserRatings = [] } = useQuery({
    queryKey: ['followedUserRatings', followingEmails.join(',')],
    queryFn: async () => {
      if (followingEmails.length === 0) return [];
      const allRatings = [];
      for (const email of followingEmails) {
        const ratings = await base44.entities.Rating.filter({ user_email: email });
        allRatings.push(...ratings);
      }
      return allRatings.sort((a, b) => new Date(b.updated_date) - new Date(a.updated_date));
    },
    enabled: followingEmails.length > 0,
  });

  const { data: followedUserFavorites = [] } = useQuery({
    queryKey: ['followedUserFavorites', followingEmails.join(',')],
    queryFn: async () => {
      if (followingEmails.length === 0) return [];
      const allFavorites = [];
      for (const email of followingEmails) {
        const favorites = await base44.entities.Favorite.filter({ user_email: email });
        allFavorites.push(...favorites);
      }
      return allFavorites.sort((a, b) => new Date(b.updated_date) - new Date(a.updated_date));
    },
    enabled: followingEmails.length > 0,
  });

  const { data: followedBootShares = [] } = useQuery({
    queryKey: ['followedBootShares', followingEmails.join(',')],
    queryFn: async () => {
      if (followingEmails.length === 0) return [];
      const allShares = [];
      for (const email of followingEmails) {
        const shares = await base44.entities.BootShare.filter({ user_email: email });
        allShares.push(...shares);
      }
      return allShares.sort((a, b) => new Date(b.shared_date) - new Date(a.shared_date));
    },
    enabled: followingEmails.length > 0,
  });

  const { data: currentUserRatings = [] } = useQuery({
    queryKey: ['currentUserRatings', currentUser?.email],
    queryFn: () => currentUser ? base44.entities.Rating.filter({ user_email: currentUser.email }, '-created_date') : [],
    enabled: !!currentUser,
  });

  const { data: currentUserBootShares = [] } = useQuery({
    queryKey: ['currentUserBootShares', currentUser?.email],
    queryFn: () => currentUser ? base44.entities.BootShare.filter({ user_email: currentUser.email }, '-shared_date') : [],
    enabled: !!currentUser,
  });

  const { data: allReactions = [] } = useQuery({
    queryKey: ['allReactions'],
    queryFn: () => base44.entities.ReviewReaction.list(),
  });

  const { data: allRatings = [] } = useQuery({
    queryKey: ['allRatings'],
    queryFn: () => base44.entities.Rating.list('-created_date', 100),
  });

  const popularReviews = useMemo(() => {
    const reactionCounts = allReactions.reduce((acc, reaction) => {
      acc[reaction.rating_id] = (acc[reaction.rating_id] || 0) + 1;
      return acc;
    }, {});

    return allRatings
      .filter(rating => reactionCounts[rating.id] >= 3)
      .filter(rating => !followedUserRatings.find(r => r.id === rating.id))
      .map(rating => ({
        type: 'review',
        data: rating,
        timestamp: rating.updated_date,
        user_email: rating.user_email,
        isBoosted: rating.boosted_until && new Date(rating.boosted_until) > new Date(),
        isOwn: rating.user_email === currentUser?.email,
        reactionCount: reactionCounts[rating.id]
      }))
      .sort((a, b) => b.reactionCount - a.reactionCount)
      .slice(0, 5);
  }, [allRatings, allReactions, followedUserRatings, currentUser?.email]);

  const activityItems = useMemo(() => {
    const seenIds = new Set();
    return [
      ...followedUserRatings
        .filter(rating => rating.user_email !== currentUser?.email)
        .map(rating => ({
          type: 'review',
          data: rating,
          timestamp: rating.updated_date,
          user_email: rating.user_email,
          isBoosted: rating.boosted_until && new Date(rating.boosted_until) > new Date(),
          isOwn: rating.user_email === currentUser?.email,
          isPopular: false
        })),
      ...followedUserFavorites.map(fav => ({
        type: 'favorite',
        data: fav,
        timestamp: fav.updated_date,
        user_email: fav.user_email,
        isBoosted: false,
        isOwn: false,
        isPopular: false
      })),
      ...followedBootShares.map(share => ({
        type: 'boot_share',
        data: share,
        timestamp: share.shared_date,
        user_email: share.user_email,
        isBoosted: false,
        isOwn: false,
        isPopular: false
      })),
      ...currentUserRatings.map(rating => ({
        type: 'review',
        data: rating,
        timestamp: rating.updated_date,
        user_email: rating.user_email,
        isBoosted: rating.boosted_until && new Date(rating.boosted_until) > new Date(),
        isOwn: true,
        isPopular: false
      })),
      ...currentUserBootShares.map(share => ({
        type: 'boot_share',
        data: share,
        timestamp: share.shared_date,
        user_email: share.user_email,
        isBoosted: false,
        isOwn: true,
        isPopular: false
      })),
      ...popularReviews.map(item => ({
        ...item,
        isPopular: true
      }))
    ]
      .filter(item => {
        const itemId = `${item.type}-${item.data.id}`;
        if (seenIds.has(itemId)) return false;
        seenIds.add(itemId);
        return true;
      })
      .sort((a, b) => {
        if (a.isBoosted && !b.isBoosted) return -1;
        if (!a.isBoosted && b.isBoosted) return 1;
        if (a.isPopular && !b.isPopular) return -1;
        if (!a.isPopular && b.isPopular) return 1;
        return new Date(b.timestamp) - new Date(a.timestamp);
      });
  }, [followedUserRatings, followedUserFavorites, followedBootShares, currentUserRatings, currentUserBootShares, popularReviews, currentUser?.email]);

  const filteredActivityItems = searchEmail
    ? activityItems.filter(item => item.user_email?.split('@')[0].toLowerCase().includes(searchEmail.toLowerCase()))
    : activityItems;

  const searchResults = searchEmail
    ? allUsers.filter(user => user.email?.split('@')[0].toLowerCase().includes(searchEmail.toLowerCase()) && user.email !== currentUser?.email)
    : [];

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 py-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <Button asChild variant="ghost" className="mb-6 text-amber-700">
          <Link to={createPageUrl('Home')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Home
          </Link>
        </Button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-8">
            <Activity className="w-8 h-8 text-amber-700" />
            <h1 className="text-3xl font-bold text-stone-800" style={{ fontFamily: 'Rye, serif' }}>The Hitching Post</h1>
          </div>
          
          <div className="relative">
            <Input
              type="text"
              placeholder="Search for users..."
              value={searchEmail}
              onChange={(e) => setSearchEmail(e.target.value)}
              className="pr-10"
            />
            {searchEmail && (
              <button
                onClick={() => setSearchEmail('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-stone-400 hover:text-stone-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            {searchEmail && searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-stone-200 rounded-lg shadow-lg z-10">
                {searchResults.map(user => (
                  <Link
                    key={user.email}
                    to={`${createPageUrl('UserProfile')}?email=${user.email}`}
                    onClick={() => setSearchEmail('')}
                    className="block px-4 py-3 hover:bg-stone-50 border-b last:border-b-0"
                  >
                    <p className="font-semibold text-stone-800">{user.email?.split('@')[0]}</p>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </motion.div>

        {userFollows.length === 0 ? (
          <Card className="p-12 text-center">
            <Users className="w-16 h-16 text-stone-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-stone-700 mb-2">No one to follow yet</h3>
            <p className="text-stone-500 mb-6">
              Start following users by viewing their profiles from venue reviews!
            </p>
            <Button asChild className="bg-amber-600 hover:bg-amber-700">
              <Link to={createPageUrl('Home')}>Explore Venues</Link>
            </Button>
          </Card>
        ) : activityItems.length === 0 ? (
          <Card className="p-12 text-center">
            <Activity className="w-16 h-16 text-stone-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-stone-700 mb-2">No activity yet</h3>
            <p className="text-stone-500">
              Your followed users haven't written any reviews or favorited venues yet.
            </p>
          </Card>
        ) : filteredActivityItems.length === 0 ? (
          <Card className="p-12 text-center">
            <Users className="w-16 h-16 text-stone-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-stone-700 mb-2">No results found</h3>
            <p className="text-stone-500">
              No activity from users with username "{searchEmail}"
            </p>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredActivityItems.map((item, i) => {
              const venue = item.type === 'boot_share' ? null : venues.find(v => v.id === item.data.venue_id) || venueCache[item.data.venue_id];
              if (item.type !== 'boot_share' && !venue) return null;
              return (
                <ActivityFeedItem
                  key={`${item.type}-${item.data.id}`}
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
    </div>
  );
}