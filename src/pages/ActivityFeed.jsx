import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Heart, Star, Users, ArrowLeft, Activity, X, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { toast } from "sonner";
import BootRating from "../components/BootRating";
import UserBadge from "../components/UserBadge";
import ReviewReactionButtons from "../components/ReviewReactionButtons";
import ReviewBoostButton from "../components/ReviewBoostButton";

export default function ActivityFeed() {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchEmail, setSearchEmail] = useState('');
  const [allUsers, setAllUsers] = useState([]);
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me()
      .then(setCurrentUser)
      .catch(() => base44.auth.redirectToLogin());
    
    base44.entities.User.list()
      .then(users => setAllUsers(users))
      .catch(() => {});
    
    setLoading(false);
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
        // Update venue totals
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

  const { data: userFollows = [] } = useQuery({
    queryKey: ['userFollows', currentUser?.email],
    queryFn: () => currentUser ? base44.entities.Follow.filter({ user_email: currentUser.email }) : [],
    enabled: !!currentUser,
  });

  const followingEmails = userFollows.map(f => f.following_email);

  const { data: followedUserRatings = [] } = useQuery({
    queryKey: ['followedUserRatings', followingEmails],
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
    queryKey: ['followedUserFavorites', followingEmails],
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
    queryKey: ['followedBootShares', followingEmails],
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

  const activityItems = [
    ...followedUserRatings.map(rating => ({
      type: 'review',
      data: rating,
      timestamp: rating.updated_date,
      user_email: rating.user_email,
      isBoosted: rating.boosted_until && new Date(rating.boosted_until) > new Date(),
      isOwn: rating.user_email === currentUser?.email
    })),
    ...followedUserFavorites.map(fav => ({
      type: 'favorite',
      data: fav,
      timestamp: fav.updated_date,
      user_email: fav.user_email,
      isBoosted: false,
      isOwn: false
    })),
    ...followedBootShares.map(share => ({
      type: 'boot_share',
      data: share,
      timestamp: share.shared_date,
      user_email: share.user_email,
      isBoosted: false,
      isOwn: false
    })),
    ...currentUserRatings.map(rating => ({
      type: 'review',
      data: rating,
      timestamp: rating.updated_date,
      user_email: rating.user_email,
      isBoosted: rating.boosted_until && new Date(rating.boosted_until) > new Date(),
      isOwn: true
    })),
    ...currentUserBootShares.map(share => ({
      type: 'boot_share',
      data: share,
      timestamp: share.shared_date,
      user_email: share.user_email,
      isBoosted: false,
      isOwn: true
    }))
  ].sort((a, b) => {
    // Boosted items first, then by timestamp
    if (a.isBoosted && !b.isBoosted) return -1;
    if (!a.isBoosted && b.isBoosted) return 1;
    return new Date(b.timestamp) - new Date(a.timestamp);
  });

  const filteredActivityItems = searchEmail
    ? activityItems.filter(item => item.user_email.split('@')[0].toLowerCase().includes(searchEmail.toLowerCase()))
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
              if (item.type === 'boot_share') {
                return (
                  <motion.div
                    key={`boot-${item.data.id}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <Card className="hover:shadow-lg transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-2">
                              <Button asChild variant="link" className="text-amber-700 p-0 h-auto">
                                <Link to={`${createPageUrl('UserProfile')}?email=${item.user_email}`}>
                                  <span className="font-semibold">{item.user_email.split('@')[0]}</span>
                                </Link>
                              </Button>
                              <span className="text-stone-500">found</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-sm text-stone-500">
                                {new Date(item.timestamp).toLocaleDateString()}
                              </span>
                              {item.isOwn && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    if (confirm('Delete this boot share?')) {
                                      deleteBootShareMutation.mutate(item.data.id);
                                    }
                                  }}
                                  className="h-7 px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                          </div>
                        
                        <div className="mb-4">
                          <h3 className="font-semibold text-stone-800 flex items-center gap-2">
                            👢 {item.data.boot_name}
                          </h3>
                          <p className="text-sm text-stone-600 mt-1">Boot hunt achievement unlocked!</p>
                        </div>

                        {item.data.photo_url && (
                          <img 
                            src={item.data.photo_url} 
                            alt={item.data.boot_name}
                            className="w-full h-64 object-cover rounded-lg"
                          />
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              }

              const venue = venues.find(v => v.id === item.data.venue_id);
              if (!venue) return null;

              return (
                <motion.div
                  key={`${item.type}-${item.data.id}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Card className={`hover:shadow-lg transition-shadow ${item.isBoosted ? 'border-amber-300 border-2' : ''}`}>
                    <CardContent className="p-6">
                      {item.isBoosted && (
                        <div className="mb-4 inline-flex items-center gap-1 px-3 py-1 bg-amber-100 text-amber-800 text-xs font-semibold rounded-full">
                          <span>⭐</span> Featured
                        </div>
                      )}
                      <div className="flex items-start justify-between mb-4">
                       <div className="flex items-center gap-2">
                         <Button asChild variant="link" className="text-amber-700 p-0 h-auto">
                           <Link to={`${createPageUrl('UserProfile')}?email=${item.user_email}`}>
                             <span className="font-semibold">{item.user_email.split('@')[0]}</span>
                           </Link>
                         </Button>
                         {item.type === 'review' && (
                           <UserBadge reviewCount={followedUserRatings.filter(r => r.user_email === item.user_email).length} size="sm" />
                         )}
                         <span className="text-stone-500">
                           {item.type === 'review' ? 'reviewed' : 'favorited'}
                         </span>
                       </div>
                       <div className="flex items-center gap-3">
                         <span className="text-sm text-stone-500">
                           {new Date(item.timestamp).toLocaleDateString()}
                         </span>
                         {item.isOwn && item.type === 'review' && (
                           <Button
                             variant="ghost"
                             size="sm"
                             onClick={() => {
                               if (confirm('Delete this review?')) {
                                 deleteReviewMutation.mutate(item.data.id);
                               }
                             }}
                             className="h-7 px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                           >
                             <Trash2 className="w-4 h-4" />
                           </Button>
                         )}
                       </div>
                      </div>

                      <div className="flex gap-4">
                        <Link 
                          to={createPageUrl('VenueDetails') + `?venueId=${venue.id}`}
                          className="flex-shrink-0"
                        >
                          <img
                            src={venue.image_url || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400'}
                            alt={venue.name}
                            className="w-20 h-20 object-cover rounded-lg"
                          />
                        </Link>

                        <div className="flex-1 min-w-0">
                          <Link 
                            to={createPageUrl('VenueDetails') + `?venueId=${venue.id}`}
                            className="hover:text-amber-600 transition-colors block"
                          >
                            <h3 className="font-semibold text-stone-800">
                              {venue.name}
                            </h3>
                          </Link>
                          
                          {item.type === 'review' && (
                            <>
                              <div className="flex items-center gap-2 my-2">
                                <BootRating rating={item.data.boots} size="sm" />
                                <span className="text-sm text-stone-600">
                                  {item.data.boots} boots
                                </span>
                              </div>
                              {item.data.comment && (
                                <p className="text-stone-600 text-sm italic">
                                  "{item.data.comment}"
                                </p>
                              )}
                              <div className="flex items-center justify-between">
                                <ReviewReactionButtons ratingId={item.data.id} userEmail={currentUser?.email} />
                                {item.type === 'review' && (
                                  <ReviewBoostButton 
                                    ratingId={item.data.id} 
                                    userEmail={item.user_email}
                                    currentUserEmail={currentUser?.email}
                                    isAlreadyBoosted={item.isBoosted}
                                  />
                                )}
                              </div>
                              {item.data.image_urls && item.data.image_urls.length > 0 && (
                                <div className="grid grid-cols-2 gap-2 mt-3">
                                  {item.data.image_urls.map((url, i) => (
                                    <div key={i} className="relative group">
                                      <img src={url} alt={`Review photo ${i}`} className="w-full h-24 object-cover rounded-md" />
                                      {currentUser && currentUser.role === 'admin' && (
                                        <button
                                          type="button"
                                          onClick={() => {
                                            if (confirm('Delete this photo?')) {
                                              deletePhotoMutation.mutate(item.data.id, url);
                                            }
                                          }}
                                          className="absolute top-1 right-1 bg-red-600 hover:bg-red-700 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                          ×
                                        </button>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </>
                          )}

                          {item.type === 'favorite' && (
                            <p className="text-sm text-rose-600 flex items-center gap-1 mt-1">
                              <Heart className="w-4 h-4" />
                              Added to favorites
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}