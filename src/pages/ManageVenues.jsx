import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Search, ArrowLeft, Pencil, Trash2, ExternalLink, ArrowUpDown } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";
import { toast } from "sonner";
import CategoryFilter from "../components/CategoryFilter";
import GoogleSyncButton from "../components/GoogleSyncButton";
import SyncHistoryReport from "../components/SyncHistoryReport";

const categoryLabels = {
  restaurant: "Restaurant",
  bar: "Bar",
  brewery: "Brewery",
  music_hall: "Music Hall",
  activity: "Activity",
  recreation: "Recreation"
};

// Fallback for old venues with single category
const getCategories = (venue) => {
  if (venue.categories && venue.categories.length > 0) return venue.categories;
  if (venue.category) return [venue.category];
  return [];
};

export default function ManageVenues() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [deleteVenue, setDeleteVenue] = useState(null);
  const [sortOrder, setSortOrder] = useState('asc');

  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const { data: venues = [], isLoading: venuesLoading } = useQuery({
    queryKey: ['venues'],
    queryFn: () => base44.entities.Venue.list('-created_date', 10000),
    enabled: !!user,
  });

  const deleteVenueMutation = useMutation({
    mutationFn: async (id) => {
      // Delete associated ratings and favorites
      const ratings = await base44.entities.Rating.filter({ venue_id: id });
      const favorites = await base44.entities.Favorite.filter({ venue_id: id });
      
      await Promise.all([
        ...ratings.map(r => base44.entities.Rating.delete(r.id)),
        ...favorites.map(f => base44.entities.Favorite.delete(f.id)),
      ]);
      
      await base44.entities.Venue.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['venues'] });
      toast.success('Venue deleted successfully');
      setDeleteVenue(null);
    },
  });

  const uncheckSuperBowlMutation = useMutation({
    mutationFn: async () => {
      const superBowlVenues = venues.filter(v => v.broadcasts_superbowl);
      await Promise.all(
        superBowlVenues.map(v => base44.entities.Venue.update(v.id, { broadcasts_superbowl: false }))
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['venues'] });
      toast.success('All Super Bowl venues unchecked');
    },
  });

  const filteredVenues = venues.filter(venue => {
    const matchesSearch = !searchQuery || 
      venue.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      venue.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const venueCategories = getCategories(venue);
    const matchesCategory = selectedCategory === 'all' || venueCategories.includes(selectedCategory);
    return matchesSearch && matchesCategory;
  }).sort((a, b) => {
    const nameA = a.name || '';
    const nameB = b.name || '';
    return sortOrder === 'asc' 
      ? nameA.localeCompare(nameB)
      : nameB.localeCompare(nameA);
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-stone-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16 text-center">
          <h1 className="text-2xl font-bold text-stone-800 mb-4">Admin Access Required</h1>
          <p className="text-stone-600 mb-8">
            {!user ? 'You need to sign in as an admin to manage venues' : 'Only administrators can manage venues'}
          </p>
          {!user ? (
            <Button 
              onClick={() => base44.auth.redirectToLogin()}
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              Sign In
            </Button>
          ) : (
            <Link to={createPageUrl('Home')}>
              <Button className="bg-amber-600 hover:bg-amber-700 text-white">
                Back to Home
              </Button>
            </Link>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <div className="bg-gradient-to-br from-stone-900 via-stone-800 to-amber-900 text-white py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <Link to={createPageUrl('Home')}>
            <Button variant="ghost" size="sm" className="text-white/80 hover:text-white hover:bg-white/10 mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </Link>
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold mb-2">Manage Venues</h1>
              <p className="text-stone-300">
                Add, edit, and organize venues in Cheyenne
              </p>
            </div>
            
            <div className="flex gap-2">
              <Button 
                variant="outline"
                onClick={() => uncheckSuperBowlMutation.mutate()}
                disabled={uncheckSuperBowlMutation.isPending || venues.filter(v => v.broadcasts_superbowl).length === 0}
                className="border-white text-white hover:bg-white/10"
              >
                Uncheck All Super Bowl
              </Button>
              <Link to={createPageUrl('AddVenue')}>
                <Button className="bg-amber-600 hover:bg-amber-700 text-white">
                  <Plus className="w-5 h-5 mr-2" />
                  Add New Venue
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Google Sync */}
        <Card className="bg-white border-stone-200 p-4 mb-6">
          <GoogleSyncButton
            venues={venues}
            onSyncComplete={() => queryClient.invalidateQueries({ queryKey: ['venues'] })}
          />
          <div className="mt-4 pt-4 border-t border-stone-100">
            <SyncHistoryReport venues={venues} />
          </div>
        </Card>

        {/* Search & Filters */}
        <div className="space-y-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative max-w-md flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
              <Input
                type="text"
                placeholder="Search venues..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button
              variant="outline"
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="border-stone-300 text-stone-700 hover:bg-stone-100"
            >
              <ArrowUpDown className="w-4 h-4 mr-2" />
              {sortOrder === 'asc' ? 'A-Z' : 'Z-A'}
            </Button>
          </div>
          
          <CategoryFilter 
            selected={selectedCategory}
            onSelect={setSelectedCategory}
          />
        </div>

        {/* Venues Table */}
        <Card className="bg-white border-stone-200">
          {venuesLoading ? (
            <div className="p-6 space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-16 w-16 rounded" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-1/3 mb-2" />
                    <Skeleton className="h-3 w-1/4" />
                  </div>
                  <Skeleton className="h-8 w-20" />
                </div>
              ))}
            </div>
          ) : filteredVenues.length === 0 ? (
            <div className="p-16 text-center">
              <h3 className="text-lg font-medium text-stone-700 mb-2">No venues found</h3>
              <p className="text-stone-500 mb-6">
                {searchQuery || selectedCategory !== 'all' 
                  ? 'Try adjusting your search or filters' 
                  : 'Get started by adding your first venue'}
              </p>
              <Link to={createPageUrl('AddVenue')}>
                <Button className="bg-amber-600 hover:bg-amber-700 text-white">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Venue
                </Button>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-stone-50">
                    <TableHead>Venue</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="hidden md:table-cell">Address</TableHead>
                    <TableHead className="hidden lg:table-cell">Ratings</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredVenues.map((venue, i) => {
                    const avgRating = venue.rating_count > 0 
                      ? (venue.rating_sum / venue.rating_count).toFixed(1) 
                      : '0.0';
                    
                    return (
                      <TableRow key={venue.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <img
                              src={venue.image_url || "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=200&q=80"}
                              alt={venue.name}
                              className="w-12 h-12 rounded object-cover"
                              onError={(e) => e.target.src = "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=200&q=80"}
                            />
                            <div>
                              <div className="font-medium text-stone-800">{venue.name}</div>
                              <div className="text-sm text-stone-500">{venue.price_range}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {getCategories(venue).map(cat => (
                              <Badge key={cat} variant="secondary" className="bg-stone-100 text-stone-700">
                                {categoryLabels[cat]}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-stone-600 max-w-xs truncate">
                          {venue.address || '—'}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-amber-600">⭐ {avgRating}</span>
                            <span className="text-sm text-stone-500">({venue.rating_count || 0})</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Link to={createPageUrl(`VenueDetails?id=${venue.id}`)}>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                className="h-8 w-8 text-stone-400 hover:text-amber-600"
                              >
                                <ExternalLink className="w-4 h-4" />
                              </Button>
                            </Link>
                            <Link to={createPageUrl(`EditVenue?id=${venue.id}`)}>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                className="h-8 w-8 text-stone-400 hover:text-blue-600"
                              >
                                <Pencil className="w-4 h-4" />
                              </Button>
                            </Link>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => setDeleteVenue(venue)}
                              className="h-8 w-8 text-stone-400 hover:text-rose-600"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </Card>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteVenue} onOpenChange={() => setDeleteVenue(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Venue</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteVenue?.name}"? This will also remove all ratings and favorites for this venue. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteVenueMutation.mutate(deleteVenue.id)}
              className="bg-rose-600 hover:bg-rose-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}