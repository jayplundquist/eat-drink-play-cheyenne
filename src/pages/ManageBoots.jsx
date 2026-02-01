import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Plus, Trash2, Edit2, Check, X } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { toast } from "sonner";

export default function ManageBoots() {
  const [user, setUser] = useState(null);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [newBoot, setNewBoot] = useState({ name: '', address: '' });
  const [editBoot, setEditBoot] = useState({ name: '', address: '' });
  const queryClient = useQueryClient();

  React.useEffect(() => {
    base44.auth.me().then(u => {
      if (u?.role !== 'admin') {
        window.location.href = createPageUrl('Home');
      }
      setUser(u);
    }).catch(() => base44.auth.redirectToLogin());
  }, []);

  const { data: boots = [], isLoading } = useQuery({
    queryKey: ['boots'],
    queryFn: () => base44.entities.Boot.list('-created_date'),
  });

  const createMutation = useMutation({
    mutationFn: async (bootData) => {
      await base44.entities.Boot.create(bootData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boots'] });
      setNewBoot({ name: '', address: '' });
      setIsAdding(false);
      toast.success('Boot added!');
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      await base44.entities.Boot.update(id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boots'] });
      setEditingId(null);
      setEditBoot({ name: '', address: '' });
      toast.success('Boot updated!');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      await base44.entities.Boot.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boots'] });
      toast.success('Boot deleted!');
    },
  });

  const handleAddBoot = () => {
    if (!newBoot.name.trim() || !newBoot.address.trim()) {
      toast.error('Please fill in all fields');
      return;
    }
    createMutation.mutate(newBoot);
  };

  const handleUpdateBoot = (id) => {
    if (!editBoot.name.trim() || !editBoot.address.trim()) {
      toast.error('Please fill in all fields');
      return;
    }
    updateMutation.mutate({ id, data: editBoot });
  };

  const startEdit = (boot) => {
    setEditingId(boot.id);
    setEditBoot({ name: boot.name, address: boot.address });
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
            Manage Big Boots
          </h1>
          <p className="text-stone-600">Add, edit, or delete boots from the hunt challenge</p>
        </div>

        {/* Add New Boot Form */}
        {!isAdding ? (
          <Button 
            onClick={() => setIsAdding(true)}
            className="mb-6 bg-amber-600 hover:bg-amber-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add New Boot
          </Button>
        ) : (
          <Card className="mb-6 border-amber-300 bg-amber-50">
            <CardContent className="p-6">
              <h3 className="font-semibold text-amber-900 mb-4">Add New Boot</h3>
              <div className="space-y-3">
                <Input
                  placeholder="Boot name"
                  value={newBoot.name}
                  onChange={(e) => setNewBoot({ ...newBoot, name: e.target.value })}
                  className="border-amber-200"
                />
                <Input
                  placeholder="Boot address"
                  value={newBoot.address}
                  onChange={(e) => setNewBoot({ ...newBoot, address: e.target.value })}
                  className="border-amber-200"
                />
                <div className="flex gap-2 pt-2">
                  <Button
                    onClick={handleAddBoot}
                    disabled={createMutation.isPending}
                    className="flex-1 bg-amber-600 hover:bg-amber-700"
                  >
                    <Check className="w-4 h-4 mr-2" />
                    Add Boot
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

        {/* Boots List */}
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
        ) : boots.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-stone-600">No boots added yet. Create one to get started!</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {boots.map((boot, i) => (
              <motion.div
                key={boot.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card>
                  <CardContent className="p-4">
                    {editingId === boot.id ? (
                      <div className="space-y-3">
                        <Input
                          value={editBoot.name}
                          onChange={(e) => setEditBoot({ ...editBoot, name: e.target.value })}
                          placeholder="Boot name"
                        />
                        <Input
                          value={editBoot.address}
                          onChange={(e) => setEditBoot({ ...editBoot, address: e.target.value })}
                          placeholder="Boot address"
                        />
                        <div className="flex gap-2">
                          <Button
                            onClick={() => handleUpdateBoot(boot.id)}
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
                        <div className="flex-1">
                          <h3 className="font-semibold text-stone-800">👢 {boot.name}</h3>
                          <p className="text-sm text-stone-600 mt-1">{boot.address}</p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            onClick={() => startEdit(boot)}
                            size="icon"
                            variant="outline"
                            className="text-amber-700"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            onClick={() => {
                              if (confirm('Delete this boot?')) {
                                deleteMutation.mutate(boot.id);
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
            <strong>Total boots:</strong> {boots.length} • Changes automatically update the app for all users
          </p>
        </div>
      </div>
    </div>
  );
}