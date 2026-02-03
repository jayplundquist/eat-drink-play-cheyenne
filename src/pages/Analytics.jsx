import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, MapPin, Star, MessageSquare } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";

export default function Analytics() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.auth.me()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const { data: venues = [], isLoading: venuesLoading } = useQuery({
    queryKey: ['allVenues'],
    queryFn: () => base44.entities.Venue.list(),
  });

  const { data: ratings = [], isLoading: ratingsLoading } = useQuery({
    queryKey: ['allRatings'],
    queryFn: () => base44.entities.Rating.list(),
  });

  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ['allUsers'],
    queryFn: () => base44.entities.User.list(),
  });

  const { data: favorites = [], isLoading: favoritesLoading } = useQuery({
    queryKey: ['allFavorites'],
    queryFn: () => base44.entities.Favorite.list(),
  });



  const reviewsWithComments = ratings.filter(r => r.comment && r.comment.trim());

  const stats = [
    {
      title: 'Total Users',
      value: users.length,
      icon: Users,
      color: 'from-blue-500 to-blue-600',
      loading: usersLoading,
    },
    {
      title: 'Total Venues',
      value: venues.length,
      icon: MapPin,
      color: 'from-amber-500 to-amber-600',
      loading: venuesLoading,
    },
    {
      title: 'Total Ratings',
      value: ratings.length,
      icon: Star,
      color: 'from-purple-500 to-purple-600',
      loading: ratingsLoading,
    },
    {
      title: 'Total Reviews',
      value: reviewsWithComments.length,
      icon: MessageSquare,
      color: 'from-green-500 to-green-600',
      loading: ratingsLoading,
    },
    {
      title: 'Total Favorites',
      value: favorites.length,
      icon: MessageSquare,
      color: 'from-rose-500 to-rose-600',
      loading: favoritesLoading,
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="text-center">
          <Skeleton className="h-8 w-48 mx-auto" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-stone-900 mb-2">Analytics Dashboard</h1>
          <p className="text-stone-600">Overview of platform statistics and metrics</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.title} className="p-6 bg-white border-stone-200 hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-lg bg-gradient-to-br ${stat.color}`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                </div>
                <h3 className="text-sm font-medium text-stone-600 mb-1">{stat.title}</h3>
                {stat.loading ? (
                  <Skeleton className="h-8 w-24" />
                ) : (
                  <p className="text-3xl font-bold text-stone-900">{stat.value.toLocaleString()}</p>
                )}
              </Card>
            );
          })}
        </div>

        {/* Additional insights */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6 bg-white border-stone-200">
            <h3 className="text-lg font-semibold text-stone-800 mb-4">Quick Stats</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-stone-600">Average Rating</span>
                <span className="font-semibold text-stone-900">
                  {ratingsLoading ? (
                    <Skeleton className="h-5 w-12" />
                  ) : ratings.length > 0 ? (
                    (ratings.reduce((sum, r) => sum + r.boots, 0) / ratings.length).toFixed(1)
                  ) : (
                    '0'
                  )}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-stone-600">Reviews with Comments</span>
                <span className="font-semibold text-stone-900">
                  {ratingsLoading ? (
                    <Skeleton className="h-5 w-12" />
                  ) : (
                    `${reviewsWithComments.length} (${ratings.length > 0 ? Math.round((reviewsWithComments.length / ratings.length) * 100) : 0}%)`
                  )}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-stone-600">Avg Favorites per User</span>
                <span className="font-semibold text-stone-900">
                  {favoritesLoading || usersLoading ? (
                    <Skeleton className="h-5 w-12" />
                  ) : users.length > 0 ? (
                    (favorites.length / users.length).toFixed(1)
                  ) : (
                    '0'
                  )}
                </span>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-white border-stone-200">
            <h3 className="text-lg font-semibold text-stone-800 mb-4">Top Rated Venues</h3>
            <div className="space-y-2">
              {venuesLoading ? (
                <Skeleton className="h-20 w-full" />
              ) : (
                venues
                  .filter(v => v.rating_count > 0)
                  .sort((a, b) => (b.rating_sum / b.rating_count) - (a.rating_sum / a.rating_count))
                  .slice(0, 5)
                  .map(venue => (
                    <div key={venue.id} className="flex justify-between items-center py-2 border-b border-stone-100 last:border-0">
                      <span className="text-stone-700 truncate">{venue.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-amber-600 font-semibold">
                          {(venue.rating_sum / venue.rating_count).toFixed(1)}
                        </span>
                        <span className="text-xs text-stone-500">({venue.rating_count})</span>
                      </div>
                    </div>
                  ))
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}