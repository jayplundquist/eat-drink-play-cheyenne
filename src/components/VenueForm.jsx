import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { X, Plus, Save, Upload, Loader2, Check, ChevronsUpDown } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import { base44 } from '@/api/base44Client';
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const categories = [
  { value: "restaurant", label: "Restaurant" },
  { value: "bar", label: "Bar" },
  { value: "brewery", label: "Brewery" },
  { value: "music_hall", label: "Music Hall" },
  { value: "activity", label: "Activity" },
  { value: "recreation", label: "Recreation" },
];

const priceRanges = ["$", "$$", "$$$", "$$$$"];

const foodTypes = [
  { value: "asian", label: "Asian" },
  { value: "international", label: "International" },
  { value: "mexican", label: "Mexican" },
  { value: "american", label: "American" },
  { value: "steaks", label: "Steaks" },
  { value: "bbq", label: "BBQ" },
  { value: "dessert", label: "Dessert" },
  { value: "fine_dining", label: "Fine Dining" },
  { value: "pizza", label: "Pizza" },
];

export default function VenueForm({ venue, onSave, onCancel, isSaving }) {
  const [formData, setFormData] = useState(venue || {
    name: '',
    categories: [],
    description: '',
    address: '',
    phone: '',
    website: '',
    image_url: '',
    price_range: '$$',
    hours: '',
    features: [],
    food_types: [],
  });

  const [newFeature, setNewFeature] = useState('');
  const [uploading, setUploading] = useState(false);
  const [foodTypeOpen, setFoodTypeOpen] = useState(false);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addFeature = () => {
    if (newFeature.trim()) {
      setFormData(prev => ({
        ...prev,
        features: [...(prev.features || []), newFeature.trim()]
      }));
      setNewFeature('');
    }
  };

  const removeFeature = (index) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index)
    }));
  };

  const toggleFoodType = (foodType) => {
    setFormData(prev => {
      const current = prev.food_types || [];
      const updated = current.includes(foodType)
        ? current.filter(t => t !== foodType)
        : [...current, foodType];
      return { ...prev, food_types: updated };
    });
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      handleChange('image_url', file_url);
      toast.success('Image uploaded successfully');
    } catch (error) {
      toast.error('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit}>
      <Card className="bg-white border-stone-200">
        <CardHeader>
          <CardTitle className="text-2xl text-stone-800">
            {venue ? 'Edit Venue' : 'Add New Venue'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Venue Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="e.g. The Albany"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Categories *</Label>
              <div className="flex flex-wrap gap-2">
                {categories.map(cat => {
                  const isSelected = (formData.categories || []).includes(cat.value);
                  return (
                    <Button
                      key={cat.value}
                      type="button"
                      variant={isSelected ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        const current = formData.categories || [];
                        if (isSelected) {
                          handleChange('categories', current.filter(c => c !== cat.value));
                        } else {
                          handleChange('categories', [...current, cat.value]);
                        }
                      }}
                      className={isSelected ? "bg-amber-600 hover:bg-amber-700" : ""}
                    >
                      {cat.label}
                    </Button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Tell visitors about this place..."
              rows={4}
            />
          </div>

          {/* Contact & Location */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => handleChange('address', e.target.value)}
                placeholder="Street address, Cheyenne, WY"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                placeholder="(307) 555-1234"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="website">Website</Label>
            <Input
              id="website"
              type="text"
              value={formData.website || ''}
              onChange={(e) => handleChange('website', e.target.value)}
              placeholder="https://example.com"
            />
          </div>

          {/* Image & Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="image_url">Venue Image</Label>
              <div className="flex gap-2">
                <Input
                  id="image_url"
                  type="text"
                  value={formData.image_url || ''}
                  onChange={(e) => handleChange('image_url', e.target.value)}
                  placeholder="Or paste image URL"
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  disabled={uploading}
                  className="relative border-amber-300 text-amber-700 hover:bg-amber-50"
                  onClick={() => document.getElementById('image-upload').click()}
                >
                  {uploading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Upload className="w-4 h-4" />
                  )}
                </Button>
                <input
                  id="image-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </div>
              {formData.image_url && (
                <img 
                  src={formData.image_url} 
                  alt="Preview" 
                  className="w-full h-32 object-cover rounded-md border-2 border-stone-200"
                />
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="price_range">Price Range</Label>
              <Select
                value={formData.price_range}
                onValueChange={(value) => handleChange('price_range', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {priceRanges.map(range => (
                    <SelectItem key={range} value={range}>
                      {range}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="hours">Hours</Label>
            <Input
              id="hours"
              value={formData.hours}
              onChange={(e) => handleChange('hours', e.target.value)}
              placeholder="e.g. Mon-Sat 11am-10pm, Sun Closed"
            />
          </div>

          {/* Food Types - Only for restaurants */}
          {(formData.categories || []).includes('restaurant') && (
            <div className="space-y-2">
              <Label>Food Types</Label>
              <Popover open={foodTypeOpen} onOpenChange={setFoodTypeOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={foodTypeOpen}
                    className="w-full justify-between"
                  >
                    {(formData.food_types || []).length > 0
                      ? `${(formData.food_types || []).length} selected`
                      : "Select food types..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0">
                  <Command>
                    <CommandInput placeholder="Search food types..." />
                    <CommandEmpty>No food type found.</CommandEmpty>
                    <CommandGroup>
                      {foodTypes.map((foodType) => (
                        <CommandItem
                          key={foodType.value}
                          onSelect={() => toggleFoodType(foodType.value)}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              (formData.food_types || []).includes(foodType.value)
                                ? "opacity-100"
                                : "opacity-0"
                            )}
                          />
                          {foodType.label}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>
              {(formData.food_types || []).length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {(formData.food_types || []).map((type) => {
                    const foodType = foodTypes.find(ft => ft.value === type);
                    return (
                      <Badge key={type} variant="secondary" className="bg-amber-100 text-amber-800">
                        {foodType?.label}
                        <button
                          type="button"
                          onClick={() => toggleFoodType(type)}
                          className="ml-2 hover:text-amber-900"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Features */}
          <div className="space-y-3">
            <Label>Features</Label>
            <div className="flex gap-2">
              <Input
                value={newFeature}
                onChange={(e) => setNewFeature(e.target.value)}
                placeholder="Add a feature (e.g. Outdoor Seating)"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addFeature())}
              />
              <Button 
                type="button" 
                onClick={addFeature}
                variant="outline"
                className="border-amber-300 text-amber-700 hover:bg-amber-50"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            
            {formData.features && formData.features.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.features.map((feature, index) => (
                  <Badge 
                    key={index} 
                    variant="secondary"
                    className="bg-stone-100 text-stone-700 pr-1 pl-3 py-1"
                  >
                    {feature}
                    <button
                      type="button"
                      onClick={() => removeFeature(index)}
                      className="ml-2 hover:text-rose-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!formData.name || !(formData.categories || []).length || isSaving}
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              <Save className="w-4 h-4 mr-2" />
              {venue ? 'Update Venue' : 'Create Venue'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}