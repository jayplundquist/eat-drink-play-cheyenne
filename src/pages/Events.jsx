import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Calendar, Search, ArrowLeft, Plus } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";
import { toast } from "sonner";
import EventCard from "../components/EventCard";
import EventForm from "../components/EventForm";

const eventCategories = [
  { value: "all", label: "All Events" },
  { value: "music", label: "Live Music" },
  { value: "festival", label: "Festivals" },
  { value: "sports", label: "Sports" },
  { value: "community", label: "Community" },
  { value: "arts", label: "Arts & Culture" },
  { value: "food_drink", label: "Food & Drink" },
];

export default function Events() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showPast, setShowPast] = useState(false);
  const [user, setUser] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => setUser(null));
  }, []);

  const { data: events = [], isLoading } = useQuery({
    queryKey: ['events'],
    queryFn: () => base44.entities.Event.list('date', 100),
  });

  const createEventMutation = useMutation({
    mutationFn: (eventData) => base44.entities.Event.create(eventData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      setDialogOpen(false);
      toast.success('Event created successfully');
    },
  });

  const suggestEventMutation = useMutation({
    mutationFn: (eventData) => base44.entities.EventSuggestion.create({
      ...eventData,
      suggested_by: user?.email
    }),
    onSuccess: () => {
      setDialogOpen(false);
      toast.success('Event suggestion submitted! We\'ll review it soon.');
    },
  });

  const now = new Date();
  
  const filteredEvents = events.filter(event => {
    const eventDate = new Date(event.date);
    const isPast = eventDate < now;
    
    if (!showPast && isPast) return false;
    if (showPast && !isPast) return false;
    
    const matchesSearch = !searchQuery || 
      event.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.venue_name?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = selectedCategory === 'all' || event.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

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
          
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Calendar className="w-8 h-8 text-amber-400" />
              <h1 className="text-3xl sm:text-4xl font-bold">Events in Cheyenne</h1>
            </div>
            
            {user && (
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-amber-600 hover:bg-amber-700 text-white">
                    <Plus className="w-4 h-4 mr-2" />
                    {user.role === 'admin' ? 'Add Event' : 'Suggest Event'}
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>
                      {user.role === 'admin' ? 'Add New Event' : 'Suggest an Event'}
                    </DialogTitle>
                  </DialogHeader>
                  <EventForm
                    onSave={(data) => {
                      if (user.role === 'admin') {
                        createEventMutation.mutate(data);
                      } else {
                        suggestEventMutation.mutate(data);
                      }
                    }}
                    onCancel={() => setDialogOpen(false)}
                    isSaving={createEventMutation.isPending || suggestEventMutation.isPending}
                  />
                </DialogContent>
              </Dialog>
            )}
          </div>
          
          <p className="text-stone-300 max-w-2xl">
            Discover upcoming events, festivals, live music, and more happening in the Magic City
          </p>
          
          {/* Search */}
          <div className="mt-6 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
              <Input
                type="text"
                placeholder="Search events..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-stone-400 focus:bg-white/20"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <Tabs value={showPast ? "past" : "upcoming"} onValueChange={(v) => setShowPast(v === "past")}>
            <TabsList className="bg-stone-100">
              <TabsTrigger value="upcoming" className="data-[state=active]:bg-white">
                Upcoming
              </TabsTrigger>
              <TabsTrigger value="past" className="data-[state=active]:bg-white">
                Past Events
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex flex-wrap gap-2">
            {eventCategories.map(cat => (
              <Button
                key={cat.value}
                variant={selectedCategory === cat.value ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(cat.value)}
                className={
                  selectedCategory === cat.value 
                    ? "bg-amber-600 hover:bg-amber-700 text-white" 
                    : "border-stone-300 text-stone-600 hover:border-amber-400 hover:text-amber-700"
                }
              >
                {cat.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Events Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="aspect-[16/9] rounded-lg" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-8 h-8 text-stone-400" />
            </div>
            <h3 className="text-lg font-medium text-stone-700 mb-2">
              {showPast ? 'No past events found' : 'No upcoming events found'}
            </h3>
            <p className="text-stone-500">
              {showPast ? 'Try adjusting your search or filters' : 'Check back soon for new events!'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map((event, i) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <EventCard event={event} />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}