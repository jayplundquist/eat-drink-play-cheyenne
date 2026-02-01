import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { X, Plus, Save, Upload, Loader2, Check, ChevronsUpDown, Zap, Lock, Unlock, MapPin } from "lucide-react";
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
import { useQuery, useQueryClient } from '@tanstack/react-query';

const categories = [
  { value: "restaurant", label: "Restaurant" },
  { value: "bar", label: "Bar" },
  { value: "brewery", label: "Brewery" },
  { value: "music_hall", label: "Music Hall" },
  { value: "activity", label: "Activity" },
  { value: "recreation", label: "Recreation" },
];

const priceRanges = ["Free", "$", "$$", "$$$", "$$$$"];

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

export default function VenueForm({ venue, onSave, onCancel, isSaving, user, onInitiateBoostCheckout }) {
   const [formData, setFormData] = useState(venue ? {
       ...venue,
       menu_pictures: venue.menu_pictures || [],
       locked_fields: venue.locked_fields || [],
     } : {
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
       menu_pictures: [],
       quick_draw_boost: false,
       locked_fields: [],
     });

   const [newFeature, setNewFeature] = useState('');
    const [uploading, setUploading] = useState(false);
    const [menuUploading, setMenuUploading] = useState(false);
    const [foodTypeOpen, setFoodTypeOpen] = useState(false);
    const [newFoodType, setNewFoodType] = useState('');
    const [newCategory, setNewCategory] = useState('');

   const queryClient = useQueryClient();

   const { data: customOptions = [] } = useQuery({
     queryKey: ['customVenueOptions'],
     queryFn: () => base44.entities.CustomVenueOption.list(),
   });

   const customFoodTypes = customOptions.filter(opt => opt.type === 'food_type');
   const customCategories = customOptions.filter(opt => opt.type === 'category');

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleFieldLock = (fieldName) => {
    setFormData(prev => ({
      ...prev,
      locked_fields: prev.locked_fields.includes(fieldName)
        ? prev.locked_fields.filter(f => f !== fieldName)
        : [...prev.locked_fields, fieldName]
    }));
  };

  const isFieldLocked = (fieldName) => {
    return formData.locked_fields?.includes(fieldName);
  };

  const isFieldEditable = (fieldName) => {
    if (user?.role === 'admin') return true;
    return !isFieldLocked(fieldName);
  };

  const renderFieldLockButton = (fieldName) => {
    if (user?.role !== 'admin') return null;
    return (
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => toggleFieldLock(fieldName)}
        className="p-1 h-auto"
        title={isFieldLocked(fieldName) ? 'Unlock field' : 'Lock field'}
      >
        {isFieldLocked(fieldName) ? (
          <Lock className="w-4 h-4 text-amber-600" />
        ) : (
          <Unlock className="w-4 h-4 text-stone-400" />
        )}
      </Button>
    );
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

  const addCustomFoodType = async () => {
    if (newFoodType.trim()) {
      const value = newFoodType.toLowerCase().replace(/\s+/g, '_');
      const label = newFoodType.trim();
      try {
        await base44.entities.CustomVenueOption.create({ name: label, type: 'food_type', value });
        queryClient.invalidateQueries({ queryKey: ['customVenueOptions'] });
        toggleFoodType(value);
        setNewFoodType('');
        toast.success(`Added "${label}" to food types`);
      } catch (error) {
        toast.error('Failed to save custom food type');
      }
    }
  };

  const addCustomCategory = async () => {
    if (newCategory.trim()) {
      const value = newCategory.toLowerCase().replace(/\s+/g, '_');
      const label = newCategory.trim();
      try {
        await base44.entities.CustomVenueOption.create({ name: label, type: 'category', value });
        queryClient.invalidateQueries({ queryKey: ['customVenueOptions'] });
        const current = formData.categories || [];
        handleChange('categories', [...current, value]);
        setNewCategory('');
        toast.success(`Added "${label}" to categories`);
      } catch (error) {
        toast.error('Failed to save custom category');
      }
    }
  };

  const allFoodTypes = [...foodTypes, ...customFoodTypes];
  const allCategories = [...categories, ...customCategories];

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

  const handleMenuUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    setMenuUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      const current = formData.menu_pictures || [];
      handleChange('menu_pictures', [...current, file_url]);
      toast.success('Menu picture added');
    } catch (error) {
      toast.error('Failed to upload menu picture');
    } finally {
      setMenuUploading(false);
    }
  };

  const removeMenuPicture = (index) => {
    setFormData(prev => ({
      ...prev,
      menu_pictures: (prev.menu_pictures || []).filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Ensure website has proper format
    let dataToSave = { ...formData };
    if (dataToSave.website && !dataToSave.website.startsWith('http')) {
      dataToSave.website = `https://${dataToSave.website}`;
    }

    onSave(dataToSave);
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
              <div className="flex items-center justify-between">
                <Label htmlFor="name">Venue Name *</Label>
                {renderFieldLockButton('name')}
              </div>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="e.g. The Albany"
                required
                disabled={!isFieldEditable('name')}
              />
            </div>

            <div className="space-y-2">
              <Label>Categories *</Label>
              <div className="flex flex-wrap gap-2 mb-2">
                {allCategories.map(cat => {
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
              <div className="flex gap-2">
                <Input
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  placeholder="Add custom category"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomCategory())}
                />
                <Button 
                  type="button" 
                  onClick={addCustomCategory}
                  variant="outline"
                  className="border-amber-300 text-amber-700 hover:bg-amber-50"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          <div className="space-y-2">
             <div className="flex items-center justify-between">
               <div className="flex items-center justify-between flex-1">
                 <Label htmlFor="description">Description</Label>
                 {renderFieldLockButton('description')}
               </div>
               <span className="text-sm text-stone-500">{(formData.description || '').length}/250</span>
             </div>
             <Textarea
               id="description"
               value={formData.description}
               onChange={(e) => {
                 const value = e.target.value;
                 if (value.length <= 250) {
                   handleChange('description', value);
                 }
               }}
               placeholder="Tell visitors about this place..."
               rows={4}
               maxLength={250}
               disabled={!isFieldEditable('description')}
             />
           </div>

          {/* Contact & Location */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="address">Address</Label>
                {renderFieldLockButton('address')}
              </div>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => handleChange('address', e.target.value)}
                placeholder="Street address, Cheyenne, WY"
                disabled={!isFieldEditable('address')}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="phone">Phone Number</Label>
                {renderFieldLockButton('phone')}
              </div>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                placeholder="(307) 555-1234"
                disabled={!isFieldEditable('phone')}
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="website">Website</Label>
              {renderFieldLockButton('website')}
            </div>
            <Input
                  id="website"
                  value={formData.website || ''}
                  onChange={(e) => handleChange('website', e.target.value)}
                  placeholder="https://example.com"
                  disabled={!isFieldEditable('website')}
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
            <div className="flex items-center justify-between">
              <Label htmlFor="hours">Hours</Label>
              {renderFieldLockButton('hours')}
            </div>
            <Input
              id="hours"
              value={formData.hours}
              onChange={(e) => handleChange('hours', e.target.value)}
              placeholder="e.g. Mon-Sat 11am-10pm, Sun Closed"
              disabled={!isFieldEditable('hours')}
            />
          </div>

          {/* Food Types */}
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
                    <CommandEmpty>
                      <div className="p-2">
                        <div className="text-sm text-stone-500 mb-2">No food type found</div>
                        <div className="flex gap-2">
                          <Input
                            value={newFoodType}
                            onChange={(e) => setNewFoodType(e.target.value)}
                            placeholder="Add new food type"
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                addCustomFoodType();
                              }
                            }}
                          />
                          <Button 
                            type="button" 
                            onClick={addCustomFoodType}
                            size="sm"
                            className="bg-amber-600 hover:bg-amber-700"
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CommandEmpty>
                    <CommandGroup>
                      {allFoodTypes.map((foodType) => (
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
                    const foodType = allFoodTypes.find(ft => ft.value === type);
                    return (
                      <Badge key={type} variant="secondary" className="bg-amber-100 text-amber-800">
                        {foodType?.label || type}
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

          {/* Menu Pictures - Premium Feature */}
          {(user?.is_premium || user?.role === 'admin') && (
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200 rounded-lg p-4 space-y-3">
              <Label className="text-purple-900 font-semibold">Menu Pictures (Premium)</Label>
              <p className="text-sm text-purple-700">
                Upload photos of your menu to showcase your offerings
              </p>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  disabled={menuUploading}
                  className="relative border-purple-300 text-purple-700 hover:bg-purple-50"
                  onClick={() => document.getElementById('menu-upload').click()}
                >
                  {menuUploading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Upload className="w-4 h-4 mr-2" />
                  )}
                  Add Menu Picture
                </Button>
                <input
                  id="menu-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleMenuUpload}
                  className="hidden"
                />
              </div>
              {(formData.menu_pictures || []).length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {(formData.menu_pictures || []).map((picture, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={picture}
                        alt={`Menu ${index + 1}`}
                        className="w-full h-24 object-cover rounded-md border border-purple-200"
                      />
                      <button
                        type="button"
                        onClick={() => removeMenuPicture(index)}
                        className="absolute top-1 right-1 bg-red-600 hover:bg-red-700 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Big Boot Flag - Admin/Premium Feature */}
              {venue && (user?.is_premium || user?.role === 'admin') && (
                <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-200 rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">👢</span>
                      <Label className="text-amber-900 font-semibold">Big Boot Location</Label>
                    </div>
                  </div>
                  <p className="text-sm text-amber-700">
                    Is this one of Cheyenne's iconic painted boots?
                  </p>
                  <Button
                    type="button"
                    onClick={() => handleChange('has_big_boot', !formData.has_big_boot)}
                    variant={formData.has_big_boot ? "default" : "outline"}
                    className={formData.has_big_boot ? "w-full bg-amber-600 hover:bg-amber-700 text-white" : "w-full border-amber-300 text-amber-700 hover:bg-amber-50"}
                  >
                    <span className="mr-2">👢</span>
                    {formData.has_big_boot ? 'This is a Big Boot location' : 'Mark as Big Boot location'}
                  </Button>
                </div>
              )}

              {/* Quick Draw Boost - Premium Feature */}
              {venue && (user?.is_premium || user?.role === 'admin') && (
                <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border-2 border-blue-200 rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Zap className="w-5 h-5 text-blue-600" />
                      <Label className="text-blue-900 font-semibold">Quick Draw Boost</Label>
                    </div>
                    <span className="text-lg font-bold text-blue-600">$5/week</span>
                  </div>
              <p className="text-sm text-blue-700">
                Boost this venue to appear 3x more often in Quick Draw selections for 7 days
              </p>
              {formData.boost_expires_date && new Date(formData.boost_expires_date) > new Date() && (
                <p className="text-sm text-green-600 font-medium">
                  ✓ Boost active until {new Date(formData.boost_expires_date).toLocaleDateString()}
                </p>
              )}
              <Button
                type="button"
                onClick={() => {
                  if (user?.role === 'admin') {
                    // Apply boost for free for admins
                    const boostExpireDate = new Date();
                    boostExpireDate.setDate(boostExpireDate.getDate() + 7);
                    handleChange('boost_expires_date', boostExpireDate.toISOString());
                    handleChange('quick_draw_boost', true);
                    toast.success('Boost applied for 7 days');
                  } else {
                    onInitiateBoostCheckout?.(venue.id);
                  }
                }}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Zap className="w-4 h-4 mr-2" />
                {user?.role === 'admin' 
                  ? 'Apply Boost (Free)' 
                  : (formData.boost_expires_date && new Date(formData.boost_expires_date) > new Date() ? 'Renew Boost' : 'Purchase Boost')}
              </Button>
            </div>
          )}

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