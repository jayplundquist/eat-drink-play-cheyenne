import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { User, Heart, Star, Users, ArrowLeft, AlertCircle, Send } from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import VenueCard from "../components/VenueCard";
import BootRating from "../components/BootRating";
import UserBadge from "../components/UserBadge";

export default function UserProfile() {
  const [profileUser, setProfileUser] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [reportReason, setReportReason] = useState('');

  const queryClient = useQueryClient();

  const urlParams = new URLSearchParams(window.location.search);
  const userEmail = urlParams.get('email');

  const { data: profileUserData = null } = useQuery({
    queryKey: ['profileUser', userEmail],
    queryFn: () => userEmail ? base44.entities.User.filter({ email: userEmail }).then(users => users[0] || null) : null,
    enabled: !!userEmail,
  });

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const current = await base44.auth.me();
        setCurrentUser(current);
      } catch {
        setCurrentUser(null);
      }
      setLoading(false);
    };
    fetchUsers();
  }, []);

  const { data: venues = [] } = useQuery({
    queryKey: ['venues'],
    queryFn: () => base44.entities.Venue.list(),
  });

  const { data: profileUserFavorites = [] } = useQuery({
    queryKey: ['userFavorites', userEmail],
    queryFn: () => userEmail ? base44.entities.Favorite.filter({ user_email: userEmail }) : [],
    enabled: !!userEmail,
  });

  const { data: profileUserRatings = [] } = useQuery({
    queryKey: ['userRatings', userEmail],
    queryFn: () => userEmail ? base44.entities.Rating.filter({ user_email: userEmail }) : [],
    enabled: !!userEmail,
  });

  const { data: userFollows = [] } = useQuery({
    queryKey: ['userFollows', currentUser?.email, userEmail],
    queryFn: () => currentUser && userEmail ? base44.entities.Follow.filter({ user_email: currentUser.email, following_email: userEmail }) : [],
    enabled: !!currentUser && !!userEmail,
  });

  const toggleFollowMutation = useMutation({
    mutationFn: async () => {
      const existing = userFollows[0];
      if (existing) {
        await base44.entities.Follow.delete(existing.id);
      } else {
        await base44.entities.Follow.create({
          user_email: currentUser.email,
          following_email: userEmail
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userFollows'] });
      toast.success(userFollows.length > 0 ? 'Unfollowed' : 'Following!');
    },
  });

  const submitReportMutation = useMutation({
    mutationFn: async () => {
      await base44.entities.ProfileReport.create({
        reported_email: userEmail,
        reporter_email: currentUser?.email || 'anonymous',
        reason: reportReason,
      });
    },
    onSuccess: () => {
      toast.success('Profile reported successfully');
      setReportDialogOpen(false);
      setReportReason('');
    },
  });

  const isFollowing = userFollows.length > 0;
  const isSelfProfile = currentUser?.email === userEmail;

  const favoriteVenues = venues.filter(v => 
    profileUserFavorites.some(f => f.venue_id === v.id)
  );

  const ratedVenues = venues.filter(v => 
    profileUserRatings.some(r => r.venue_id === v.id)
  ).map(venue => ({
    ...venue,
    userRating: profileUserRatings.find(r => r.venue_id === venue.id)
  }));

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <Skeleton className="h-48 w-full mb-6" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <Button asChild variant="ghost" className="mb-6 text-amber-700">
          <Link to={createPageUrl('Home')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Link>
        </Button>

        {/* Profile Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="mb-8 border-stone-200">
            <CardHeader className="bg-gradient-to-r from-amber-50 to-stone-50 border-b border-stone-200">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-full flex items-center justify-center bg-amber-100 flex-shrink-0">
                    {profileUserData?.profile_picture ? (
                      <img
                        src={profileUserData.profile_picture}
                        alt={userEmail}
                        className="w-20 h-20 rounded-full object-cover"
                      />
                    ) : (
                      <User className="w-10 h-10 text-amber-700" />
                    )}
                  </div>
                  <div>
                    <CardTitle className="text-3xl text-stone-800">
                      {userEmail}
                    </CardTitle>
                    <div className="flex items-center gap-2 mt-2">
                      <UserBadge reviewCount={profileUserRatings.length} />
                    </div>
                  </div>
                </div>
                {currentUser && !isSelfProfile && (
                   <div className="flex gap-2">
                     <Button
                       onClick={() => toggleFollowMutation.mutate()}
                       disabled={toggleFollowMutation.isPending}
                       className={isFollowing ? "bg-stone-600 hover:bg-stone-700" : "bg-amber-600 hover:bg-amber-700"}
                     >
                       <Users className="w-4 h-4 mr-2" />
                       {isFollowing ? 'Following' : 'Follow'}
                     </Button>
                     <Dialog open={reportDialogOpen} onOpenChange={setReportDialogOpen}>
                       <DialogTrigger asChild>
                         <Button variant="outline" size="icon" className="border-amber-300 text-amber-700 hover:bg-amber-50">
                           <AlertCircle className="w-4 h-4" />
                         </Button>
                       </DialogTrigger>
                       <DialogContent>
                         <DialogHeader>
                           <DialogTitle>Report Profile</DialogTitle>
                           <DialogDescription>
                             Let us know why you're reporting this profile.
                           </DialogDescription>
                         </DialogHeader>
                         <div className="space-y-4">
                           <Textarea
                             value={reportReason}
                             onChange={(e) => setReportReason(e.target.value)}
                             placeholder="Describe the issue..."
                             className="resize-none"
                             rows={5}
                           />
                           <Button
                             onClick={() => submitReportMutation.mutate()}
                             disabled={!reportReason.trim() || submitReportMutation.isPending}
                             className="w-full bg-amber-600 hover:bg-amber-700 text-white"
                           >
                             <Send className="w-4 h-4 mr-2" />
                             Submit Report
                           </Button>
                         </div>
                       </DialogContent>
                     </Dialog>
                   </div>
                 )}
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="text-center p-4 bg-stone-50 rounded-lg">
                  <Heart className="w-6 h-6 text-rose-500 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-stone-800">{profileUserFavorites.length}</div>
                  <div className="text-sm text-stone-600">Favorites</div>
                </div>
                <div className="text-center p-4 bg-stone-50 rounded-lg">
                  <Star className="w-6 h-6 text-amber-500 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-stone-800">{profileUserRatings.length}</div>
                  <div className="text-sm text-stone-600">Reviews</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Favorites Section */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-stone-800 mb-6 flex items-center gap-2">
            <Heart className="w-6 h-6 text-rose-500" />
            Favorite Venues
          </h2>
          {favoriteVenues.length === 0 ? (
            <Card className="p-12 text-center">
              <p className="text-stone-500">This user hasn't favorited any venues yet.</p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {favoriteVenues.map((venue, i) => (
                <motion.div
                  key={venue.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <VenueCard 
                    venue={venue}
                    isFavorite={true}
                  />
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Reviews Section */}
        <div>
          <h2 className="text-2xl font-bold text-stone-800 mb-6 flex items-center gap-2">
            <Star className="w-6 h-6 text-amber-500" />
            Reviews
          </h2>
          {ratedVenues.length === 0 ? (
            <Card className="p-12 text-center">
              <p className="text-stone-500">This user hasn't written any reviews yet.</p>
            </Card>
          ) : (
            <div className="space-y-4">
              {ratedVenues.map((venue, i) => (
                <motion.div
                  key={venue.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Card className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex gap-4">
                        <Link 
                          to={createPageUrl('VenueDetails') + `?venueId=${venue.id}`}
                          className="flex-shrink-0"
                        >
                          <img
                            src={venue.image_url || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400'}
                            alt={venue.name}
                            className="w-24 h-24 object-cover rounded-lg"
                          />
                        </Link>
                        <div className="flex-1">
                          <Link 
                            to={createPageUrl('VenueDetails') + `?venueId=${venue.id}`}
                            className="hover:text-amber-600 transition-colors"
                          >
                            <h3 className="text-lg font-semibold text-stone-800 mb-1">
                              {venue.name}
                            </h3>
                          </Link>
                          <div className="flex items-center gap-2 mb-2">
                            <BootRating rating={venue.userRating.boots} size="sm" />
                            <span className="text-sm text-stone-600">
                              {venue.userRating.boots} boots
                            </span>
                          </div>
                          {venue.userRating.comment && (
                            <p className="text-stone-600 text-sm line-clamp-2">
                              "{venue.userRating.comment}"
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}