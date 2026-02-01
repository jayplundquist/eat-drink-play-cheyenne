import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { User, Heart, Star, Settings, Edit2, Save, X, Camera, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import VenueCard from "../components/VenueCard";
import BootRating from "../components/BootRating";
import BadgeCollection from "../components/BadgeCollection";

export default function Profile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({ full_name: '' });
  const [uploadingImage, setUploadingImage] = useState(false);

  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me()
      .then(userData => {
        setUser(userData);
        setFormData({ full_name: userData.full_name || '' });
        setLoading(false);
      })
      .catch(() => {
        base44.auth.redirectToLogin();
      });
  }, []);

  const { data: venues = [] } = useQuery({
    queryKey: ['venues'],
    queryFn: () => base44.entities.Venue.list(),
  });

  const { data: userFavorites = [] } = useQuery({
    queryKey: ['userFavorites', user?.email],
    queryFn: () => user ? base44.entities.Favorite.filter({ user_email: user.email }) : [],
    enabled: !!user,
  });

  const { data: userRatings = [] } = useQuery({
    queryKey: ['userRatings', user?.email],
    queryFn: () => user ? base44.entities.Rating.filter({ user_email: user.email }) : [],
    enabled: !!user,
  });

  const updateProfileMutation = useMutation({
    mutationFn: (data) => base44.auth.updateMe(data),
    onSuccess: (updatedUser) => {
      setUser(updatedUser);
      setEditMode(false);
      toast.success('Profile updated successfully!');
    },
    onError: () => {
      toast.error('Failed to update profile');
    },
  });

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    setUploadingImage(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      await base44.auth.updateMe({ profile_picture: file_url });
      setUser({ ...user, profile_picture: file_url });
      toast.success('Profile picture updated!');
    } catch (error) {
      toast.error('Failed to upload image');
    } finally {
      setUploadingImage(false);
    }
  };

  const toggleFavoriteMutation = useMutation({
    mutationFn: async (venueId) => {
      const existing = userFavorites.find(f => f.venue_id === venueId);
      if (existing) {
        await base44.entities.Favorite.delete(existing.id);
      } else {
        await base44.entities.Favorite.create({ venue_id: venueId, user_email: user.email });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userFavorites'] });
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
    },
  });

  const handleSaveProfile = () => {
    updateProfileMutation.mutate(formData);
  };

  const favoriteVenues = venues.filter(v => 
    userFavorites.some(f => f.venue_id === v.id)
  );

  const ratedVenues = venues.filter(v => 
    userRatings.some(r => r.venue_id === v.id)
  ).map(venue => ({
    ...venue,
    userRating: userRatings.find(r => r.venue_id === venue.id)
  }));

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-6">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Profile Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="mb-8 border-stone-200">
            <CardHeader className="bg-gradient-to-r from-amber-50 to-stone-50 border-b border-stone-200">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    {user.profile_picture ? (
                      <img
                        src={user.profile_picture}
                        alt={user.full_name}
                        className="w-20 h-20 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center">
                        <User className="w-10 h-10 text-amber-700" />
                      </div>
                    )}
                    {editMode && (
                      <label className="absolute bottom-0 right-0 bg-amber-600 hover:bg-amber-700 text-white rounded-full p-2 cursor-pointer transition-colors">
                        {uploadingImage ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Camera className="w-4 h-4" />
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          disabled={uploadingImage}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                  <div>
                    {editMode ? (
                      <div className="space-y-2">
                        <Label htmlFor="full_name">Full Name</Label>
                        <Input
                          id="full_name"
                          value={formData.full_name}
                          onChange={(e) => setFormData({ full_name: e.target.value })}
                          className="max-w-xs"
                        />
                      </div>
                    ) : (
                      <>
                        <CardTitle className="text-3xl text-stone-800">
                          {user.full_name || 'Anonymous User'}
                        </CardTitle>
                        <CardDescription className="text-base">
                          {user.email}
                        </CardDescription>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  {editMode ? (
                    <>
                      <Button
                        onClick={handleSaveProfile}
                        size="sm"
                        className="bg-amber-600 hover:bg-amber-700"
                        disabled={updateProfileMutation.isPending}
                      >
                        <Save className="w-4 h-4 mr-2" />
                        Save
                      </Button>
                      <Button
                        onClick={() => {
                          setEditMode(false);
                          setFormData({ full_name: user.full_name || '' });
                        }}
                        size="sm"
                        variant="outline"
                      >
                        <X className="w-4 h-4 mr-2" />
                        Cancel
                      </Button>
                    </>
                  ) : (
                    <Button
                      onClick={() => setEditMode(true)}
                      size="sm"
                      variant="outline"
                      className="border-amber-300 text-amber-700 hover:bg-amber-50"
                    >
                      <Edit2 className="w-4 h-4 mr-2" />
                      Edit Profile
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="text-center p-4 bg-stone-50 rounded-lg">
                  <Heart className="w-6 h-6 text-rose-500 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-stone-800">{userFavorites.length}</div>
                  <div className="text-sm text-stone-600">Favorites</div>
                </div>
                <div className="text-center p-4 bg-stone-50 rounded-lg">
                  <Star className="w-6 h-6 text-amber-500 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-stone-800">{userRatings.length}</div>
                  <div className="text-sm text-stone-600">Reviews</div>
                </div>
                <div className="text-center p-4 bg-stone-50 rounded-lg">
                  <User className="w-6 h-6 text-blue-500 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-stone-800">{user.role || 'user'}</div>
                  <div className="text-sm text-stone-600">Account Type</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Badge Collection */}
        <BadgeCollection 
          reviewCount={userRatings.length}
          avgRating={userRatings.length > 0 ? userRatings.reduce((sum, r) => sum + (r.boots || 0), 0) / userRatings.length : 0}
        />

        {/* Tabs Section */}
        <Tabs defaultValue="favorites" className="w-full">
          <TabsList className="bg-stone-100 p-1 rounded-full mb-6">
            <TabsTrigger 
              value="favorites" 
              className="rounded-full px-6 data-[state=active]:bg-white data-[state=active]:text-amber-700"
            >
              <Heart className="w-4 h-4 mr-2" />
              My Favorites ({userFavorites.length})
            </TabsTrigger>
            <TabsTrigger 
              value="reviews"
              className="rounded-full px-6 data-[state=active]:bg-white data-[state=active]:text-amber-700"
            >
              <Star className="w-4 h-4 mr-2" />
              My Reviews ({userRatings.length})
            </TabsTrigger>
            <TabsTrigger 
              value="settings"
              className="rounded-full px-6 data-[state=active]:bg-white data-[state=active]:text-amber-700"
            >
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </TabsTrigger>
          </TabsList>

          {/* Favorites Tab */}
          <TabsContent value="favorites" className="mt-0">
            {favoriteVenues.length === 0 ? (
              <Card className="p-12 text-center">
                <Heart className="w-16 h-16 text-stone-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-stone-700 mb-2">No favorites yet</h3>
                <p className="text-stone-500 mb-4">Start exploring and save your favorite venues!</p>
                <Button asChild className="bg-amber-600 hover:bg-amber-700">
                  <Link to={createPageUrl('Home')}>Explore Venues</Link>
                </Button>
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
                      onToggleFavorite={() => toggleFavoriteMutation.mutate(venue.id)}
                    />
                  </motion.div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Reviews Tab */}
          <TabsContent value="reviews" className="mt-0">
            {ratedVenues.length === 0 ? (
              <Card className="p-12 text-center">
                <Star className="w-16 h-16 text-stone-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-stone-700 mb-2">No reviews yet</h3>
                <p className="text-stone-500 mb-4">Share your experiences and help others discover great places!</p>
                <Button asChild className="bg-amber-600 hover:bg-amber-700">
                  <Link to={createPageUrl('Home')}>Explore Venues</Link>
                </Button>
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
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="mt-0">
            <Card>
              <CardHeader>
                <CardTitle>Preferences</CardTitle>
                <CardDescription>Customize your Cheyenne Guide experience</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-stone-50 rounded-lg">
                  <h4 className="font-medium text-stone-800 mb-2">Account Information</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-stone-600">Email:</span>
                      <span className="font-medium text-stone-800">{user.email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-stone-600">Account Type:</span>
                      <span className="font-medium text-stone-800">{user.role || 'user'}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}