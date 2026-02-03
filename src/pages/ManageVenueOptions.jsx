import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Trash2, Plus, ArrowLeft, Pencil, Check, X } from "lucide-react";
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { toast } from "sonner";

export default function ManageVenueOptions() {
  const [user, setUser] = useState(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newFoodTypeName, setNewFoodTypeName] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState('');

  const queryClient = useQueryClient();

  React.useEffect(() => {
    base44.auth.me().then(setUser).catch(() => setUser(null));
  }, []);

  const { data: customOptions = [], isLoading } = useQuery({
    queryKey: ['customVenueOptions'],
    queryFn: () => base44.entities.CustomVenueOption.list(),
  });

  const categories = customOptions.filter(opt => opt.type === 'category');
  const foodTypes = customOptions.filter(opt => opt.type === 'food_type');

  const addCategoryMutation = useMutation({
    mutationFn: async () => {
      if (!newCategoryName.trim()) {
        throw new Error('Category name cannot be empty');
      }
      const value = newCategoryName.toLowerCase().replace(/\s+/g, '_');
      await base44.entities.CustomVenueOption.create({
        name: newCategoryName.trim(),
        type: 'category',
        value
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customVenueOptions'] });
      setNewCategoryName('');
      toast.success('Category added successfully');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to add category');
    }
  });

  const addFoodTypeMutation = useMutation({
    mutationFn: async () => {
      if (!newFoodTypeName.trim()) {
        throw new Error('Food type name cannot be empty');
      }
      const value = newFoodTypeName.toLowerCase().replace(/\s+/g, '_');
      await base44.entities.CustomVenueOption.create({
        name: newFoodTypeName.trim(),
        type: 'food_type',
        value
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customVenueOptions'] });
      setNewFoodTypeName('');
      toast.success('Food type added successfully');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to add food type');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (optionId) => {
      await base44.entities.CustomVenueOption.delete(optionId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customVenueOptions'] });
      toast.success('Option deleted successfully');
    },
    onError: (error) => {
      toast.error('Failed to delete option');
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, name }) => {
      const value = name.toLowerCase().replace(/\s+/g, '_');
      await base44.entities.CustomVenueOption.update(id, { name, value });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customVenueOptions'] });
      setEditingId(null);
      setEditingName('');
      toast.success('Option updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update option');
    }
  });

  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <Card className="p-8 text-center">
          <h2 className="text-xl font-semibold text-stone-800 mb-2">Access Denied</h2>
          <p className="text-stone-600 mb-4">Only admins can manage venue options</p>
          <Link to={createPageUrl('Home')}>
            <Button>Back to Home</Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <Link to={createPageUrl('Home')} className="inline-block mb-6">
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </Link>

        <h1 className="text-3xl font-bold text-stone-800 mb-8">Manage Venue Options</h1>

        <Tabs defaultValue="categories" className="space-y-6">
          <TabsList>
            <TabsTrigger value="categories">Categories ({categories.length})</TabsTrigger>
            <TabsTrigger value="food-types">Food Types ({foodTypes.length})</TabsTrigger>
          </TabsList>

          {/* Categories Tab */}
          <TabsContent value="categories" className="space-y-6">
            <Card className="p-6 bg-white border-stone-200">
              <h2 className="text-xl font-semibold text-stone-800 mb-4">Add New Category</h2>
              <div className="flex gap-2 mb-6">
                <Input
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="e.g. Coffee Shop, Food Truck"
                  onKeyPress={(e) => e.key === 'Enter' && addCategoryMutation.mutate()}
                />
                <Button
                  onClick={() => addCategoryMutation.mutate()}
                  disabled={addCategoryMutation.isPending || !newCategoryName.trim()}
                  className="bg-amber-600 hover:bg-amber-700 text-white whitespace-nowrap"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Category
                </Button>
              </div>
            </Card>

            <div className="space-y-3">
              {categories.length === 0 ? (
                <Card className="p-6 text-center bg-stone-50 border-stone-200">
                  <p className="text-stone-500">No custom categories yet</p>
                </Card>
              ) : (
                categories.map(cat => (
                  <Card key={cat.id} className="p-4 bg-white border-stone-200 flex items-center justify-between">
                    {editingId === cat.id ? (
                      <>
                        <Input
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          className="flex-1 mr-2"
                          autoFocus
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              updateMutation.mutate({ id: cat.id, name: editingName });
                            }
                          }}
                        />
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => updateMutation.mutate({ id: cat.id, name: editingName })}
                            disabled={!editingName.trim() || updateMutation.isPending}
                            className="text-green-600 hover:text-green-700 hover:bg-green-50"
                          >
                            <Check className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingId(null);
                              setEditingName('');
                            }}
                            className="text-stone-600 hover:text-stone-700 hover:bg-stone-50"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </>
                    ) : (
                      <>
                        <div>
                          <p className="font-medium text-stone-800">{cat.name}</p>
                          <p className="text-sm text-stone-500 font-mono">{cat.value}</p>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingId(cat.id);
                              setEditingName(cat.name);
                            }}
                            className="text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              if (confirm(`Delete "${cat.name}"?`)) {
                                deleteMutation.mutate(cat.id);
                              }
                            }}
                            disabled={deleteMutation.isPending}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </>
                    )}
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          {/* Food Types Tab */}
          <TabsContent value="food-types" className="space-y-6">
            <Card className="p-6 bg-white border-stone-200">
              <h2 className="text-xl font-semibold text-stone-800 mb-4">Add New Food Type</h2>
              <div className="flex gap-2 mb-6">
                <Input
                  value={newFoodTypeName}
                  onChange={(e) => setNewFoodTypeName(e.target.value)}
                  placeholder="e.g. Korean, Vegan, Seafood"
                  onKeyPress={(e) => e.key === 'Enter' && addFoodTypeMutation.mutate()}
                />
                <Button
                  onClick={() => addFoodTypeMutation.mutate()}
                  disabled={addFoodTypeMutation.isPending || !newFoodTypeName.trim()}
                  className="bg-amber-600 hover:bg-amber-700 text-white whitespace-nowrap"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Food Type
                </Button>
              </div>
            </Card>

            <div className="space-y-3">
              {foodTypes.length === 0 ? (
                <Card className="p-6 text-center bg-stone-50 border-stone-200">
                  <p className="text-stone-500">No custom food types yet</p>
                </Card>
              ) : (
                foodTypes.map(food => (
                  <Card key={food.id} className="p-4 bg-white border-stone-200 flex items-center justify-between">
                    {editingId === food.id ? (
                      <>
                        <Input
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          className="flex-1 mr-2"
                          autoFocus
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              updateMutation.mutate({ id: food.id, name: editingName });
                            }
                          }}
                        />
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => updateMutation.mutate({ id: food.id, name: editingName })}
                            disabled={!editingName.trim() || updateMutation.isPending}
                            className="text-green-600 hover:text-green-700 hover:bg-green-50"
                          >
                            <Check className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingId(null);
                              setEditingName('');
                            }}
                            className="text-stone-600 hover:text-stone-700 hover:bg-stone-50"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </>
                    ) : (
                      <>
                        <div>
                          <p className="font-medium text-stone-800">{food.name}</p>
                          <p className="text-sm text-stone-500 font-mono">{food.value}</p>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingId(food.id);
                              setEditingName(food.name);
                            }}
                            className="text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              if (confirm(`Delete "${food.name}"?`)) {
                                deleteMutation.mutate(food.id);
                              }
                            }}
                            disabled={deleteMutation.isPending}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </>
                    )}
                  </Card>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}