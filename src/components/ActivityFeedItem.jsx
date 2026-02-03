import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import BootRating from "./BootRating";
import UserBadge from "./UserBadge";
import ReviewReactionButtons from "./ReviewReactionButtons";
import ReviewBoostButton from "./ReviewBoostButton";
import ReviewComments from "./ReviewComments";

export default function ActivityFeedItem({
  item,
  i,
  venue,
  currentUser,
  followedUserRatings,
  deleteBootShareMutation,
  deleteReviewMutation,
  deletePhotoMutation,
}) {
  if (!item) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: i * 0.05 }}
    >
      {item.type === 'boot_share' && (
        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-2">
                <Button asChild variant="link" className="text-amber-700 p-0 h-auto">
                  <Link to={`${createPageUrl('UserProfile')}?email=${item.user_email}`}>
                    <span className="font-semibold">{item.user_email?.split('@')[0]}</span>
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
      )}

      {item.type === 'review' && venue && (
        <Card className={`hover:shadow-lg transition-shadow ${item.isBoosted ? 'border-amber-300 border-2' : item.isPopular ? 'border-red-300 border-2' : ''}`}>
          <CardContent className="p-6">
            {item.isBoosted && (
              <div className="mb-4 inline-flex items-center gap-1 px-3 py-1 bg-amber-100 text-amber-800 text-xs font-semibold rounded-full">
                <span>⭐</span> Featured
              </div>
            )}
            {item.isPopular && !item.isBoosted && (
              <div className="mb-4 inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-800 text-xs font-semibold rounded-full">
                <span>🔥</span> Trending
              </div>
            )}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-2">
                <Button asChild variant="link" className="text-amber-700 p-0 h-auto">
                  <Link to={`${createPageUrl('UserProfile')}?email=${item.user_email}`}>
                    <span className="font-semibold">{item.user_email?.split('@')[0]}</span>
                  </Link>
                </Button>
                <UserBadge reviewCount={followedUserRatings.filter(r => r.user_email === item.user_email).length} size="sm" />
                <span className="text-stone-500">reviewed</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm text-stone-500">
                  {new Date(item.timestamp).toLocaleDateString()}
                </span>
                {(item.isOwn || currentUser?.role === 'admin') && (
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
                to={createPageUrl('VenueDetails') + `?id=${venue.id}`}
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
                  to={createPageUrl('VenueDetails') + `?id=${venue.id}`}
                  className="hover:text-amber-600 transition-colors block"
                >
                  <h3 className="font-semibold text-stone-800">
                    {venue.name}
                  </h3>
                </Link>

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
                <ReviewReactionButtons ratingId={item.data.id} userEmail={currentUser?.email} />
                <ReviewBoostButton
                  ratingId={item.data.id}
                  userEmail={item.user_email}
                  currentUserEmail={currentUser?.email}
                  isAlreadyBoosted={item.isBoosted}
                />
                <ReviewComments reviewId={item.data.id} currentUser={currentUser} />
                 {item.data.image_urls && item.data.image_urls.length > 0 && (
                   <div className="grid grid-cols-2 gap-2 mt-3">
                     {item.data.image_urls.map((url, idx) => (
                       <div key={idx} className="relative group">
                         <img src={url} alt={`Review photo ${idx}`} className="w-full h-24 object-cover rounded-md" />
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
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {item.type === 'favorite' && venue && (
        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-2">
                <Button asChild variant="link" className="text-amber-700 p-0 h-auto">
                  <Link to={`${createPageUrl('UserProfile')}?email=${item.user_email}`}>
                    <span className="font-semibold">{item.user_email?.split('@')[0]}</span>
                  </Link>
                </Button>
                <span className="text-stone-500">favorited</span>
              </div>
              <span className="text-sm text-stone-500">
                {new Date(item.timestamp).toLocaleDateString()}
              </span>
            </div>

            <div className="flex gap-4">
              <Link
                to={createPageUrl('VenueDetails') + `?id=${venue.id}`}
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
                  to={createPageUrl('VenueDetails') + `?id=${venue.id}`}
                  className="hover:text-amber-600 transition-colors block"
                >
                  <h3 className="font-semibold text-stone-800">
                    {venue.name}
                  </h3>
                </Link>
                <p className="text-sm text-rose-600 flex items-center gap-1 mt-1">
                  <Heart className="w-4 h-4" />
                  Added to favorites
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </motion.div>
  );
}