import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  Heart, MapPin, Phone, Globe, Clock, 
  ArrowLeft, DollarSign, Send, User, Pencil, AlertCircle, Flag, Trash2, Crown, Users, Image, Loader2
} from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import BootRating from "../components/BootRating";
import ClaimVenueModal from "../components/ClaimVenueModal";
import UserBadge from "../components/UserBadge";
import { toast } from "sonner";

const categoryLabels = {
  restaurant: "Restaurant",
  bar: "Bar",
  brewery: "Brewery",
  music_hall: "Music Hall",
  activity: "Activity",
  recreation: "Recreation",
  souvenir_shopping: "Souvenir Shopping"
};

// Fallback for old venues with single category
const getCategories = (venue) => {
  if (venue.categories && venue.categories.length > 0) return venue.categories;
  if (venue.category) return [venue.category];
  return [];
};

const foodTypeLabels = {
  asian: "Asian",
  international: "International",
  mexican: "Mexican",
  american: "American",
  steaks: "Steaks",
  bbq: "BBQ",
  dessert: "Dessert",
  fine_dining: "Fine Dining",
  pizza: "Pizza"
};

export default function VenueDetails() {
  const urlParams = new URLSearchParams(window.location.search);
  const venueId = urlParams.get('id');
  
  const [user, setUser] = useState(null);
  const [newRating, setNewRating] = useState(0);
  const [newComment, setNewComment] = useState('');
  const [reviewImages, setReviewImages] = useState([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [reportIssue, setReportIssue] = useState('');
  const [reportReviewDialogOpen, setReportReviewDialogOpen] = useState(false);
  const [reportReviewReason, setReportReviewReason] = useState('');
  const [selectedReviewId, setSelectedReviewId] = useState(null);
  const [reportPhotoDialogOpen, setReportPhotoDialogOpen] = useState(false);
  const [reportPhotoReason, setReportPhotoReason] = useState('');
  const [selectedPhotoUrl, setSelectedPhotoUrl] = useState(null);
  const [claimModalOpen, setClaimModalOpen] = useState(false);

  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => setUser(null));
  }, []);

  const { data: venue, isLoading: venueLoading } = useQuery({
    queryKey: ['venue', venueId],
    queryFn: async () => {
      const venues = await base44.entities.Venue.filter({ id: venueId });
      return venues[0];
    },
    enabled: !!venueId,
  });

  const { data: ratings = [], isLoading: ratingsLoading } = useQuery({
    queryKey: ['ratings', venueId],
    queryFn: () => base44.entities.Rating.filter({ venue_id: venueId }, '-created_date'),
    enabled: !!venueId,
  });

  const { data: favorites = [] } = useQuery({
    queryKey: ['favorites', user?.email],
    queryFn: () => user ? base44.entities.Favorite.filter({ user_email: user.email }) : [],
    enabled: !!user,
  });

  const { data: userRating } = useQuery({
    queryKey: ['userRating', venueId, user?.email],
    queryFn: async () => {
      if (!user) return null;
      const r = await base44.entities.Rating.filter({ venue_id: venueId, user_email: user.email });
      return r[0] || null;
    },
    enabled: !!user && !!venueId,
  });

  const { data: allUserReviews = [] } = useQuery({
    queryKey: ['allUserReviews', user?.email],
    queryFn: () => user ? base44.entities.Rating.filter({ user_email: user.email }) : [],
    enabled: !!user,
  });

  const isFavorite = favorites.some(f => f.venue_id === venueId);

  const toggleFavoriteMutation = useMutation({
    mutationFn: async () => {
      const existing = favorites.find(f => f.venue_id === venueId);
      if (existing) {
        await base44.entities.Favorite.delete(existing.id);
      } else {
        await base44.entities.Favorite.create({ venue_id: venueId, user_email: user.email });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
    },
  });

  const swearWords = ['fuck', 'shit', 'damn', 'ass', 'bitch', 'bastard', 'hell', 'crap'];
  
  const containsSwearWords = (text) => {
    const lowerText = text.toLowerCase();
    return swearWords.some(word => lowerText.includes(word));
  };

  const submitRatingMutation = useMutation({
    mutationFn: async () => {
      if (newComment && containsSwearWords(newComment)) {
        throw new Error('Please keep your review family-friendly');
      }

      const ratingData = {
        venue_id: venueId,
        user_email: user.email,
        boots: newRating,
        comment: newComment,
        image_urls: reviewImages,
      };

      if (userRating) {
        // Update existing rating
        await base44.entities.Rating.update(userRating.id, ratingData);
        // Adjust venue totals
        const newSum = venue.rating_sum - userRating.boots + newRating;
        await base44.entities.Venue.update(venueId, { rating_sum: newSum });
      } else {
        // Create new rating
        await base44.entities.Rating.create(ratingData);
        // Update venue totals
        await base44.entities.Venue.update(venueId, {
          rating_sum: (venue.rating_sum || 0) + newRating,
          rating_count: (venue.rating_count || 0) + 1,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ratings', venueId] });
      queryClient.invalidateQueries({ queryKey: ['venue', venueId] });
      queryClient.invalidateQueries({ queryKey: ['userRating', venueId] });
      setNewRating(0);
      setNewComment('');
      setReviewImages([]);
      toast.success('Review submitted successfully');
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const submitReportMutation = useMutation({
    mutationFn: async () => {
      await base44.entities.ProblemReport.create({
        venue_id: venueId,
        venue_name: venue.name,
        issue: reportIssue,
        reporter_email: user?.email || 'anonymous',
      });
    },
    onSuccess: () => {
      toast.success('Report submitted successfully');
      setReportDialogOpen(false);
      setReportIssue('');
    },
  });

  const submitReviewReportMutation = useMutation({
    mutationFn: async () => {
      await base44.entities.ReviewReport.create({
        review_id: selectedReviewId,
        venue_id: venueId,
        reporter_email: user?.email || 'anonymous',
        reason: reportReviewReason,
      });
    },
    onSuccess: () => {
      toast.success('Review reported successfully');
      setReportReviewDialogOpen(false);
      setReportReviewReason('');
      setSelectedReviewId(null);
    },
  });

  const deleteReviewMutation = useMutation({
    mutationFn: async (reviewId) => {
      const review = ratings.find(r => r.id === reviewId);
      await base44.entities.Rating.delete(reviewId);
      // Update venue totals
      await base44.entities.Venue.update(venueId, {
        rating_sum: Math.max(0, (venue.rating_sum || 0) - review.boots),
        rating_count: Math.max(0, (venue.rating_count || 0) - 1),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ratings', venueId] });
      queryClient.invalidateQueries({ queryKey: ['venue', venueId] });
      toast.success('Review deleted');
    },
  });

  const submitPhotoReportMutation = useMutation({
    mutationFn: async () => {
      await base44.entities.PhotoReport.create({
        rating_id: selectedReviewId,
        venue_id: venueId,
        photo_url: selectedPhotoUrl,
        reporter_email: user?.email || 'anonymous',
        reason: reportPhotoReason,
      });
    },
    onSuccess: () => {
      toast.success('Photo reported successfully');
      setReportPhotoDialogOpen(false);
      setReportPhotoReason('');
      setSelectedPhotoUrl(null);
    },
  });

  const deletePhotoFromReviewMutation = useMutation({
    mutationFn: async (reviewId, photoUrl) => {
      const review = ratings.find(r => r.id === reviewId);
      const updatedImages = (review.image_urls || []).filter(url => url !== photoUrl);
      await base44.entities.Rating.update(reviewId, {
        image_urls: updatedImages,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ratings', venueId] });
      toast.success('Photo removed');
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
      setReviewImages([...reviewImages, file_url]);
      toast.success('Image added');
    } catch (error) {
      toast.error('Failed to upload image');
    } finally {
      setUploadingImage(false);
    }
  };

  const removeImage = (index) => {
    setReviewImages(reviewImages.filter((_, i) => i !== index));
  };

  useEffect(() => {
    if (userRating) {
      setNewRating(userRating.boots);
      setNewComment(userRating.comment || '');
      setReviewImages(userRating.image_urls || []);
    } else {
      setReviewImages([]);
    }
  }, [userRating]);

  const avgRating = venue?.rating_count > 0 ? venue.rating_sum / venue.rating_count : 0;

  if (venueLoading) {
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
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-stone-800 mb-2">Venue not found</h2>
          <Link to={createPageUrl('Home')}>
            <Button variant="outline">Back to Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header Image */}
      {venue.image_url && (
        <div className="relative h-64 sm:h-80 lg:h-96 overflow-hidden">
          <img
            src={venue.image_url}
            alt={venue.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
        
        <div className="absolute top-4 left-4 right-4 flex justify-between">
          <Link to={createPageUrl('Home')}>
            <Button variant="secondary" size="sm" className="bg-white/90 backdrop-blur-sm hover:bg-white">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>

          {user && (user.role === 'admin' || (user.is_premium && venue.claimed_by === user.email)) && (
            <Link to={createPageUrl(`EditVenue?id=${venueId}`)}>
              <Button variant="secondary" size="sm" className="bg-white/90 backdrop-blur-sm hover:bg-white">
                <Pencil className="w-4 h-4 mr-2" />
                Edit
              </Button>
            </Link>
          )}
        </div>
        
          <div className="absolute bottom-6 left-6 right-6">
            <div className="flex flex-wrap gap-2 mb-3">
              {getCategories(venue).map(cat => (
                <Badge key={cat} className="bg-amber-600 text-white">
                  {categoryLabels[cat]}
                </Badge>
              ))}
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2 drop-shadow-lg">
              {venue.name}
            </h1>
            <div className="flex items-center gap-4">
              <BootRating rating={Math.round(avgRating)} showCount count={venue.rating_count || 0} />
              {venue.price_range && (
                <span className="text-white/90 font-medium">{venue.price_range}</span>
              )}
            </div>
          </div>
        </div>
      )}
      
      {!venue.image_url && (
        <div className="bg-gradient-to-br from-amber-900 via-amber-800 to-orange-900 text-white py-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            <Link to={createPageUrl('Home')}>
              <Button variant="ghost" size="sm" className="text-white/80 hover:text-white hover:bg-white/10 mb-4">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </Link>
            {user && (user.role === 'admin' || (user.is_premium && venue.claimed_by === user.email)) && (
              <Link to={createPageUrl(`EditVenue?id=${venueId}`)}>
                <Button variant="secondary" size="sm" className="bg-white/90 backdrop-blur-sm hover:bg-white ml-2 mb-4">
                  <Pencil className="w-4 h-4 mr-2" />
                  Edit
                </Button>
              </Link>
            )}
            <div className="flex flex-wrap gap-2 mb-3">
              {getCategories(venue).map(cat => (
                <Badge key={cat} className="bg-amber-600 text-white">
                  {categoryLabels[cat]}
                </Badge>
              ))}
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold mb-2">
              {venue.name}
            </h1>
            <div className="flex items-center gap-4">
              <BootRating rating={Math.round(avgRating)} showCount count={venue.rating_count || 0} />
              {venue.price_range && (
                <span className="text-white/90 font-medium">{venue.price_range}</span>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Description */}
            {venue.description && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <h2 className="text-lg font-semibold text-stone-800 mb-3">About</h2>
                <p className="text-stone-600 leading-relaxed">{venue.description}</p>
              </motion.div>
            )}

            {/* Food Types */}
            {venue.food_types && venue.food_types.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
              >
                <h2 className="text-lg font-semibold text-stone-800 mb-3">Food Types</h2>
                <div className="flex flex-wrap gap-2">
                  {venue.food_types.map((type, i) => (
                    <Badge key={i} variant="secondary" className="bg-amber-100 text-amber-800">
                      {foodTypeLabels[type]}
                    </Badge>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Features */}
            {venue.features && venue.features.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <h2 className="text-lg font-semibold text-stone-800 mb-3">Features</h2>
                <div className="flex flex-wrap gap-2">
                  {venue.features.map((feature, i) => (
                    <Badge key={i} variant="secondary" className="bg-stone-100 text-stone-700">
                      {feature}
                    </Badge>
                  ))}
                </div>
              </motion.div>
            )}

            <Separator />

            {/* Rate This Venue */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h2 className="text-lg font-semibold text-stone-800 mb-4">
                {userRating ? 'Update Your Rating' : 'Rate This Venue'}
              </h2>
              
              {user ? (
                <Card className="p-6 bg-white border-stone-200">
                  <div className="mb-4">
                     <label className="block text-sm font-medium text-stone-700 mb-2">
                       Give 'Em the Boot
                     </label>
                    <BootRating 
                      rating={newRating} 
                      size="lg" 
                      interactive 
                      onRate={setNewRating}
                    />
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-stone-700 mb-2">
                      Your Review (optional)
                    </label>
                    <Textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Share your experience..."
                      className="resize-none"
                      rows={3}
                    />
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-stone-700 mb-2">
                      Add Photos (optional)
                    </label>
                    <Button
                      type="button"
                      variant="outline"
                      disabled={uploadingImage}
                      className="border-amber-300 text-amber-700 hover:bg-amber-50 mb-3"
                      onClick={() => document.getElementById('review-image-upload').click()}
                    >
                      {uploadingImage ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      ) : (
                        <Image className="w-4 h-4 mr-2" />
                      )}
                      Upload Image
                    </Button>
                    <input
                      id="review-image-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                    {reviewImages.length > 0 && (
                      <div className="grid grid-cols-3 gap-2">
                        {reviewImages.map((image, index) => (
                          <div key={index} className="relative group">
                            <img
                              src={image}
                              alt={`Review ${index + 1}`}
                              className="w-full h-20 object-cover rounded-md border border-stone-200"
                            />
                            <button
                              type="button"
                              onClick={() => removeImage(index)}
                              className="absolute top-1 right-1 bg-red-600 hover:bg-red-700 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <Button 
                    onClick={() => submitRatingMutation.mutate()}
                    disabled={!newRating || submitRatingMutation.isPending}
                    className="bg-amber-600 hover:bg-amber-700 text-white"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    {userRating ? 'Update Review' : 'Submit Review'}
                  </Button>
                </Card>
              ) : (
                <Card className="p-6 bg-stone-50 border-stone-200 text-center">
                  <p className="text-stone-600 mb-4">Sign in to rate this venue</p>
                  <Button 
                    onClick={() => base44.auth.redirectToLogin()}
                    className="bg-amber-600 hover:bg-amber-700 text-white"
                  >
                    Sign In
                  </Button>
                </Card>
              )}
            </motion.div>

            {/* Reviews */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <h2 className="text-lg font-semibold text-stone-800 mb-4">
                Reviews ({ratings.length})
              </h2>
              
              {ratingsLoading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <Card key={i} className="p-4">
                      <div className="flex gap-4">
                        <Skeleton className="w-10 h-10 rounded-full" />
                        <div className="flex-1">
                          <Skeleton className="h-4 w-1/4 mb-2" />
                          <Skeleton className="h-4 w-full" />
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : ratings.length === 0 ? (
                <Card className="p-8 text-center bg-stone-50 border-stone-200">
                  <p className="text-stone-500">No reviews yet. Be the first to review!</p>
                </Card>
              ) : (
                <div className="space-y-4">
                    {ratings.map((rating) => {
                      const userReviewCount = ratings.filter(r => r.user_email === rating.user_email).length;
                      return (
                      <Card key={rating.id} className="p-4 bg-white border-stone-200">
                        <div className="flex gap-4">
                          <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                            <User className="w-5 h-5 text-amber-700" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Button asChild variant="link" className="text-stone-800 font-medium p-0 h-auto">
                                <Link to={`${createPageUrl('UserProfile')}?email=${rating.user_email}`}>
                                  {rating.user_email?.split('@')[0]}
                                </Link>
                              </Button>
                              <UserBadge reviewCount={userReviewCount} size="sm" />
                            </div>
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                              <span className="text-sm text-stone-500">
                                {format(new Date(rating.created_date), 'MMM d, yyyy')}
                              </span>
                              {user && user.email !== rating.user_email && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedReviewId(rating.id);
                                    setReportReviewDialogOpen(true);
                                  }}
                                  className="h-7 px-2 text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                                >
                                  <Flag className="w-4 h-4" />
                                </Button>
                              )}
                              {user && user.role === 'admin' && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    if (confirm('Delete this review?')) {
                                      deleteReviewMutation.mutate(rating.id);
                                    }
                                  }}
                                  className="h-7 px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                          </div>
                          <BootRating rating={rating.boots} size="sm" />
                          {rating.comment && (
                            <p className="text-stone-600 mt-2">{rating.comment}</p>
                          )}
                          {rating.image_urls && rating.image_urls.length > 0 && (
                            <div className="grid grid-cols-2 gap-2 mt-3">
                              {rating.image_urls.map((url, i) => (
                                <div key={i} className="relative group">
                                  <img src={url} alt={`Review photo ${i}`} className="w-full h-20 object-cover rounded-md" />
                                  {user && user.email !== rating.user_email && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setSelectedReviewId(rating.id);
                                        setSelectedPhotoUrl(url);
                                        setReportPhotoDialogOpen(true);
                                      }}
                                      className="absolute top-1 right-1 bg-red-600 hover:bg-red-700 text-white rounded px-1.5 py-0.5 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                      Report
                                    </button>
                                  )}
                                  {user && user.role === 'admin' && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (confirm('Delete this photo?')) {
                                          deletePhotoFromReviewMutation.mutate(rating.id, url);
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
                          </div>
                          </div>
                          </Card>
                          );
                          })}
                          </div>
                          )}
                          </motion.div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Actions */}
            <Card className="p-4 bg-white border-stone-200 space-y-2">
              <Button
                onClick={() => user ? toggleFavoriteMutation.mutate() : base44.auth.redirectToLogin()}
                variant={isFavorite ? "default" : "outline"}
                className={cn(
                  "w-full",
                  isFavorite && "bg-rose-500 hover:bg-rose-600 text-white"
                )}
              >
                <Heart className={cn("w-5 h-5 mr-2", isFavorite && "fill-current")} />
                {isFavorite ? 'Saved to Favorites' : 'Add to Favorites'}
              </Button>
              
              <Dialog open={reportDialogOpen} onOpenChange={setReportDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="w-full border-amber-300 text-amber-700 hover:bg-amber-50">
                    <AlertCircle className="w-5 h-5 mr-2" />
                    Report a Problem
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Report a Problem</DialogTitle>
                    <DialogDescription>
                      Let us know if there's an issue with this venue's information.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <Textarea
                      value={reportIssue}
                      onChange={(e) => setReportIssue(e.target.value)}
                      placeholder="Describe the issue..."
                      className="resize-none"
                      rows={5}
                    />
                    <Button 
                      onClick={() => submitReportMutation.mutate()}
                      disabled={!reportIssue.trim() || submitReportMutation.isPending}
                      className="w-full bg-amber-600 hover:bg-amber-700 text-white"
                    >
                      <Send className="w-4 h-4 mr-2" />
                      Submit Report
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </Card>

            {/* Contact Info */}
            <Card className="p-4 bg-white border-stone-200">
              <h3 className="font-semibold text-stone-800 mb-4">Information</h3>
              <div className="space-y-4">
                {venue.address && (
                  <div className="space-y-2">
                    <div className="flex items-start gap-3">
                      <MapPin className="w-5 h-5 text-amber-600 mt-0.5" />
                      <span className="text-stone-600">{venue.address}</span>
                    </div>
                    <Button
                      asChild
                      className="w-full bg-amber-600 hover:bg-amber-700 text-white"
                      size="sm"
                    >
                      <a 
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(venue.address)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <MapPin className="w-4 h-4 mr-2" />
                        Hit the Trail
                      </a>
                    </Button>
                  </div>
                )}
                {venue.phone && (
                   <div className="flex items-center gap-3">
                     <Phone className="w-5 h-5 text-amber-600" />
                     <a 
                       href={`tel:${venue.phone}`}
                       className="text-amber-700 hover:text-amber-800 hover:underline"
                     >
                       {venue.phone}
                     </a>
                   </div>
                 )}
                {venue.website && (
                  <div className="flex items-center gap-3">
                    <Globe className="w-5 h-5 text-amber-600" />
                    <a 
                      href={venue.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-amber-700 hover:underline truncate"
                    >
                      Visit Website
                    </a>
                  </div>
                )}
                {venue.hours && (
                  <div className="flex items-start gap-3">
                    <Clock className="w-5 h-5 text-amber-600 mt-0.5" />
                    <span className="text-stone-600">{venue.hours}</span>
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Report Review Dialog */}
          <Dialog open={reportReviewDialogOpen} onOpenChange={setReportReviewDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Report Review</DialogTitle>
                <DialogDescription>
                  Let us know why this review should be removed.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <Textarea
                  value={reportReviewReason}
                  onChange={(e) => setReportReviewReason(e.target.value)}
                  placeholder="Why are you reporting this review?"
                  className="resize-none"
                  rows={5}
                />
                <Button 
                  onClick={() => submitReviewReportMutation.mutate()}
                  disabled={!reportReviewReason.trim() || submitReviewReportMutation.isPending}
                  className="w-full bg-amber-600 hover:bg-amber-700 text-white"
                >
                  <Send className="w-4 h-4 mr-2" />
                  Submit Report
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Report Photo Dialog */}
          <Dialog open={reportPhotoDialogOpen} onOpenChange={setReportPhotoDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Report Photo</DialogTitle>
                <DialogDescription>
                  Let us know why this photo should be removed.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                {selectedPhotoUrl && (
                  <img src={selectedPhotoUrl} alt="Reported photo" className="w-full h-32 object-cover rounded-md" />
                )}
                <Textarea
                  value={reportPhotoReason}
                  onChange={(e) => setReportPhotoReason(e.target.value)}
                  placeholder="Why are you reporting this photo?"
                  className="resize-none"
                  rows={5}
                />
                <Button 
                  onClick={() => submitPhotoReportMutation.mutate()}
                  disabled={!reportPhotoReason.trim() || submitPhotoReportMutation.isPending}
                  className="w-full bg-amber-600 hover:bg-amber-700 text-white"
                >
                  <Send className="w-4 h-4 mr-2" />
                  Submit Report
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          </div>
          </div>

          {/* Claim Venue Section at Bottom */}
          {user && !venue.claimed_by && (
          <section className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
            <Card className="p-6 bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h3 className="font-semibold text-lg text-blue-900 mb-1">Claim This Venue</h3>
                  <p className="text-sm text-blue-700">Own this business? Request to manage this venue listing.</p>
                </div>
                <Button 
                   className="bg-blue-600 hover:bg-blue-700 text-white whitespace-nowrap"
                   onClick={() => setClaimModalOpen(true)}
                 >
                   <Crown className="w-4 h-4 mr-2" />
                   Stake Your Claim
                 </Button>
              </div>
            </Card>
          </section>
          )}

          {/* Claim Venue Modal */}
          {user && (
          <ClaimVenueModal 
            open={claimModalOpen}
            onOpenChange={setClaimModalOpen}
            venueName={venue.name}
            venueId={venueId}
            user={user}
          />
          )}
          </div>
          );
          }