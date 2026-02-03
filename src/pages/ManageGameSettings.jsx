import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Save, X } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { toast } from "sonner";

export default function ManageGameSettings() {
  const [user, setUser] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => setUser(null));
  }, []);

  const { data: gameSettings = [], isLoading } = useQuery({
    queryKey: ['gameSettings'],
    queryFn: () => base44.entities.GameSettings.list(),
  });

  const { data: customOptions = [] } = useQuery({
    queryKey: ['customVenueOptions'],
    queryFn: () => base44.entities.CustomVenueOption.list(),
  });

  const { data: venues = [] } = useQuery({
    queryKey: ['venues'],
    queryFn: () => base44.entities.Venue.list(),
  });

  // Get all unique categories from venues and custom options
  const allCategories = React.useMemo(() => {
    const venueCategories = new Set();
    venues.forEach(v => {
      const cats = v.categories || (v.category ? [v.category] : []);
      cats.forEach(cat => venueCategories.add(cat));
    });
    customOptions.filter(opt => opt.type === 'category').forEach(opt => {
      venueCategories.add(opt.value);
    });
    return Array.from(venueCategories).sort();
  }, [venues, customOptions]);

  const getCategoryLabel = (value) => {
    const custom = customOptions.find(opt => opt.type === 'category' && opt.value === value);
    if (custom) return custom.name;
    
    const labels = {
      restaurant: "Restaurant",
      bar: "Bar",
      brewery: "Brewery",
      coffee_shop: "Coffee Shop",
      winery: "Winery",
      music_hall: "Music Hall",
      activity: "Activity",
      recreation: "Recreation",
      souvenir_shopping: "Shopping",
      shopping: "Shopping",
      grocery: "Grocery",
      food_trucks: "Food Trucks"
    };
    return labels[value] || value;
  };

  const quickDrawSetting = gameSettings.find(s => s.game_name === 'quick_draw');
  const wetYerWhistleSetting = gameSettings.find(s => s.game_name === 'wet_yer_whistle');

  const [quickDrawCategories, setQuickDrawCategories] = useState([]);
  const [wetYerWhistleCategories, setWetYerWhistleCategories] = useState([]);

  useEffect(() => {
    setQuickDrawCategories(quickDrawSetting?.categories || ['restaurant']);
  }, [quickDrawSetting]);

  useEffect(() => {
    setWetYerWhistleCategories(wetYerWhistleSetting?.categories || ['bar', 'brewery', 'coffee_shop', 'winery']);
  }, [wetYerWhistleSetting]);

  const saveSettingsMutation = useMutation({
    mutationFn: async () => {
      if (quickDrawSetting) {
        await base44.entities.GameSettings.update(quickDrawSetting.id, {
          categories: quickDrawCategories
        });
      } else {
        await base44.entities.GameSettings.create({
          game_name: 'quick_draw',
          categories: quickDrawCategories
        });
      }

      if (wetYerWhistleSetting) {
        await base44.entities.GameSettings.update(wetYerWhistleSetting.id, {
          categories: wetYerWhistleCategories
        });
      } else {
        await base44.entities.GameSettings.create({
          game_name: 'wet_yer_whistle',
          categories: wetYerWhistleCategories
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gameSettings'] });
      toast.success('Game settings updated successfully');
    },
  });

  const toggleCategory = (game, category) => {
    if (game === 'quick_draw') {
      setQuickDrawCategories(prev => 
        prev.includes(category) 
          ? prev.filter(c => c !== category)
          : [...prev, category]
      );
    } else {
      setWetYerWhistleCategories(prev => 
        prev.includes(category) 
          ? prev.filter(c => c !== category)
          : [...prev, category]
      );
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <p className="text-stone-600">Please sign in to access this page.</p>
      </div>
    );
  }

  if (user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <p className="text-stone-600">Admin access required.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-6">
          <Link to={createPageUrl('Home')}>
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </Link>
        </div>

        <h1 className="text-3xl font-bold text-amber-900 mb-8" style={{ fontFamily: 'Rye, serif' }}>
          Game Settings
        </h1>

        <div className="space-y-6">
          {/* Quick Draw */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Draw Categories</CardTitle>
              <p className="text-sm text-stone-600">Select which venue categories to include in Quick Draw</p>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {allCategories.map(cat => (
                  <Badge
                    key={cat}
                    onClick={() => toggleCategory('quick_draw', cat)}
                    className={`cursor-pointer ${
                      quickDrawCategories.includes(cat)
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'bg-stone-200 text-stone-700 hover:bg-stone-300'
                    }`}
                  >
                    {quickDrawCategories.includes(cat) && '✓ '}
                    {getCategoryLabel(cat)}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Wet Yer Whistle */}
          <Card>
            <CardHeader>
              <CardTitle>Wet Yer Whistle Categories</CardTitle>
              <p className="text-sm text-stone-600">Select which venue categories to include in Wet Yer Whistle</p>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {allCategories.map(cat => (
                  <Badge
                    key={cat}
                    onClick={() => toggleCategory('wet_yer_whistle', cat)}
                    className={`cursor-pointer ${
                      wetYerWhistleCategories.includes(cat)
                        ? 'bg-rose-600 text-white hover:bg-rose-700'
                        : 'bg-stone-200 text-stone-700 hover:bg-stone-300'
                    }`}
                  >
                    {wetYerWhistleCategories.includes(cat) && '✓ '}
                    {getCategoryLabel(cat)}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button
              onClick={() => saveSettingsMutation.mutate()}
              disabled={saveSettingsMutation.isPending}
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              <Save className="w-4 h-4 mr-2" />
              Save Settings
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}