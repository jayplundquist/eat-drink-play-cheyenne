import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Plus, Trash2, Edit2, Check, X, Upload, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { toast } from "sonner";

export default function ManageBadges() {
  const [user, setUser] = useState(null);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [uploadingId, setUploadingId] = useState(null);
  const [newBadge, setNewBadge] = useState({ name: '', type: 'review', description: '', min_count: 1, icon_url: '' });
  const [editBadge, setEditBadge] = useState({ name: '', type: 'review', description: '', min_count: 1, icon_url: '' });
  const queryClient = useQueryClient();

  React.useEffect(() => {
    base44.auth.me().then(u => {
      if (u?.role !== 'admin') {
        window.location.href = createPageUrl('Home');
      }
      setUser(u);
    }).catch(() => base44.auth.redirectToLogin());
  }, []);

  const { data: badges = [], isLoading } = useQuery({
    queryKey: ['badges'],
    queryFn: () => base44.entities.Badge.list('-created_date'),
  });

  const createMutation = useMutation({
    mutationFn: async (badgeData) => {
      await base44.entities.Badge.create(badgeData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['badges'] });
      setNewBadge({ name: '', type: 'review', description: '', min_count: 1, icon_url: '' });
      setIsAdding(false);
      toast.success('Badge created!');
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      await base44.entities.Badge.update(id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['badges'] });
      setEditingId(null);
      setEditBadge({ name: '', type: 'review', description: '', min_count: 1, icon_url: '' });
      toast.success('Badge updated!');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      await base44.entities.Badge.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['badges'] });
      toast.success('Badge deleted!');
    },
  });

  const handleImageUpload = async (e, isEdit = false) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const badgeId = isEdit ? editingId : 'new';
    setUploadingId(badgeId);

    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      if (isEdit) {
        setEditBadge({ ...editBadge, icon_url: file_url });
      } else {
        setNewBadge({ ...newBadge, icon_url: file_url });
      }
      toast.success('Icon uploaded!');
    } catch (error) {
      toast.error('Failed to upload icon');
    } finally {
      setUploadingId(null);
    }
  };

  const handleAddBadge = () => {
    if (!newBadge.name.trim() || !newBadge.description.trim() || !newBadge.icon_url) {
      toast.error('Please fill in all fields and upload an icon');
      return;
    }
    createMutation.mutate(newBadge);
  };

  const handleUpdateBadge = (id) => {
    if (!editBadge.name.trim() || !editBadge.description.trim() || !editBadge.icon_url) {
      toast.error('Please fill in all fields and upload an icon');
      return;
    }
    updateMutation.mutate({ id, data: editBadge });
  };

  const startEdit = (badge) => {
    setEditingId(badge.id);
    setEditBadge(badge);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-stone-50 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <Button asChild variant="ghost" className="mb-6 text-amber-700">
          <Link to={createPageUrl('Home')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Link>
        </Button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-stone-800 mb-2" style={{ fontFamily: 'Rye, serif' }}>
            Manage Badges
          </h1>
          <p className="text-stone-600">Edit badges and their icons for reviews and challenges</p>
        </div>

        {/* Add New Badge Form */}
        {!isAdding ? (
          <Button 
            onClick={() => setIsAdding(true)}
            className="mb-6 bg-amber-600 hover:bg-amber-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add New Badge
          </Button>
        ) : (
          <Card className="mb-6 border-amber-300 bg-amber-50">
            <CardContent className="p-6">
              <h3 className="font-semibold text-amber-900 mb-4">Add New Badge</h3>
              <div className="space-y-3">
                <Input
                  placeholder="Badge name"
                  value={newBadge.name}
                  onChange={(e) => setNewBadge({ ...newBadge, name: e.target.value })}
                  className="border-amber-200"
                />
                <Input
                  placeholder="Description"
                  value={newBadge.description}
                  onChange={(e) => setNewBadge({ ...newBadge, description: e.target.value })}
                  className="border-amber-200"
                />
                <div className="flex gap-3">
                  <select
                    value={newBadge.type}
                    onChange={(e) => setNewBadge({ ...newBadge, type: e.target.value })}
                    className="flex-1 px-3 py-2 border border-amber-200 rounded-md"
                  >
                    <option value="review">Review Badge</option>
                    <option value="boot">Boot Challenge</option>
                  </select>
                  <Input
                    type="number"
                    placeholder="Min count"
                    value={newBadge.min_count}
                    onChange={(e) => setNewBadge({ ...newBadge, min_count: parseInt(e.target.value) || 1 })}
                    className="border-amber-200"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-amber-900 mb-2">Badge Icon</label>
                  <div className="flex gap-3">
                    {newBadge.icon_url && (
                      <img src={newBadge.icon_url} alt="Badge" className="w-16 h-16 object-cover rounded-lg" />
                    )}
                    <label className="flex-1 flex items-center justify-center border-2 border-dashed border-amber-300 rounded-lg p-4 cursor-pointer hover:bg-amber-100 transition-colors">
                      {uploadingId === 'new' ? (
                        <Loader2 className="w-5 h-5 animate-spin text-amber-700" />
                      ) : (
                        <>
                          <Upload className="w-5 h-5 mr-2 text-amber-700" />
                          <span className="text-sm text-amber-700">Upload Icon</span>
                        </>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageUpload(e, false)}
                        disabled={uploadingId === 'new'}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
                <div className="flex gap-2 pt-2">
                  <Button
                    onClick={handleAddBadge}
                    disabled={createMutation.isPending}
                    className="flex-1 bg-amber-600 hover:bg-amber-700"
                  >
                    <Check className="w-4 h-4 mr-2" />
                    Create Badge
                  </Button>
                  <Button
                    onClick={() => setIsAdding(false)}
                    variant="outline"
                    className="flex-1"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Badges List */}
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
        ) : badges.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-stone-600">No badges created yet. Create one to get started!</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {badges.map((badge, i) => (
              <motion.div
                key={badge.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card>
                  <CardContent className="p-4">
                    {editingId === badge.id ? (
                      <div className="space-y-3">
                        <Input
                          value={editBadge.name}
                          onChange={(e) => setEditBadge({ ...editBadge, name: e.target.value })}
                          placeholder="Badge name"
                        />
                        <Input
                          value={editBadge.description}
                          onChange={(e) => setEditBadge({ ...editBadge, description: e.target.value })}
                          placeholder="Description"
                        />
                        <div className="flex gap-3">
                          <select
                            value={editBadge.type}
                            onChange={(e) => setEditBadge({ ...editBadge, type: e.target.value })}
                            className="flex-1 px-3 py-2 border border-stone-300 rounded-md"
                          >
                            <option value="review">Review Badge</option>
                            <option value="boot">Boot Challenge</option>
                          </select>
                          <Input
                            type="number"
                            value={editBadge.min_count}
                            onChange={(e) => setEditBadge({ ...editBadge, min_count: parseInt(e.target.value) || 1 })}
                            className="w-24"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-stone-700 mb-2">Badge Icon</label>
                          <div className="flex gap-3">
                            {editBadge.icon_url && (
                              <img src={editBadge.icon_url} alt="Badge" className="w-16 h-16 object-cover rounded-lg" />
                            )}
                            <label className="flex-1 flex items-center justify-center border-2 border-dashed border-stone-300 rounded-lg p-4 cursor-pointer hover:bg-stone-50 transition-colors">
                              {uploadingId === badge.id ? (
                                <Loader2 className="w-5 h-5 animate-spin text-stone-600" />
                              ) : (
                                <>
                                  <Upload className="w-5 h-5 mr-2 text-stone-600" />
                                  <span className="text-sm text-stone-600">Change Icon</span>
                                </>
                              )}
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => handleImageUpload(e, true)}
                                disabled={uploadingId === badge.id}
                                className="hidden"
                              />
                            </label>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            onClick={() => handleUpdateBadge(badge.id)}
                            disabled={updateMutation.isPending}
                            size="sm"
                            className="flex-1 bg-amber-600 hover:bg-amber-700"
                          >
                            <Check className="w-4 h-4 mr-1" />
                            Save
                          </Button>
                          <Button
                            onClick={() => setEditingId(null)}
                            size="sm"
                            variant="outline"
                            className="flex-1"
                          >
                            <X className="w-4 h-4 mr-1" />
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4 flex-1">
                          {badge.icon_url && (
                            <img src={badge.icon_url} alt={badge.name} className="w-16 h-16 object-cover rounded-lg flex-shrink-0" />
                          )}
                          <div>
                            <h3 className="font-semibold text-stone-800">{badge.name}</h3>
                            <p className="text-sm text-stone-600 mt-1">{badge.description}</p>
                            <div className="flex gap-3 mt-2 text-xs text-stone-500">
                              <span className="px-2 py-1 bg-stone-100 rounded">{badge.type}</span>
                              <span className="px-2 py-1 bg-stone-100 rounded">{badge.min_count}+ required</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            onClick={() => startEdit(badge)}
                            size="icon"
                            variant="outline"
                            className="text-amber-700"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            onClick={() => {
                              if (confirm('Delete this badge?')) {
                                deleteMutation.mutate(badge.id);
                              }
                            }}
                            size="icon"
                            variant="outline"
                            className="text-red-600"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}

        <div className="mt-8 p-4 bg-amber-50 rounded-lg border border-amber-200">
          <p className="text-sm text-amber-900">
            <strong>Total badges:</strong> {badges.length} • Changes automatically update the app for all users
          </p>
        </div>
      </div>
    </div>
  );
}