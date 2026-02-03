import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Trash2, Plus, ArrowLeft, Pencil, Check, X, MapPin } from "lucide-react";
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { toast } from "sonner";

export default function ManageBoots() {
  const [user, setUser] = useState(null);
  const [newBootName, setNewBootName] = useState('');
  const [newBootAddress, setNewBootAddress] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState('');
  const [editingAddress, setEditingAddress] = useState('');

  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => setUser(null));
  }, []);

  const { data: boots = [], isLoading } = useQuery({
    queryKey: ['boots'],
    queryFn: () => base44.entities.Boot.list(),
  });

  const addBootMutation = useMutation({
    mutationFn: async () => {
      if (!newBootName.trim() || !newBootAddress.trim()) {
        throw new Error('Boot name and address are required');
      }
      await base44.entities.Boot.create({
        name: newBootName.trim(),
        address: newBootAddress.trim()
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boots'] });
      setNewBootName('');
      setNewBootAddress('');
      toast.success('Boot added successfully');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to add boot');
    }
  });

  const updateBootMutation = useMutation({
    mutationFn: async ({ id, name, address }) => {
      await base44.entities.Boot.update(id, { name, address });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boots'] });
      setEditingId(null);
      setEditingName('');
      setEditingAddress('');
      toast.success('Boot updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update boot');
    }
  });

  const deleteBootMutation = useMutation({
    mutationFn: async (bootId) => {
      await base44.entities.Boot.delete(bootId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boots'] });
      toast.success('Boot deleted successfully');
    },
    onError: (error) => {
      toast.error('Failed to delete boot');
    }
  });

  const importBootsMutation = useMutation({
    mutationFn: async () => {
      const cheyenneBoots = [
        { name: "Big Blue Boot", address: "1600 Carey Ave, Cheyenne, WY 82001" },
        { name: "Cowboy Boot", address: "200 W Lincolnway, Cheyenne, WY 82001" },
        { name: "Red White & Blue Boot", address: "1902 Thomes Ave, Cheyenne, WY 82001" },
        { name: "Golden Boot", address: "1621 Capitol Ave, Cheyenne, WY 82001" },
        { name: "Native American Boot", address: "309 W Lincolnway, Cheyenne, WY 82001" },
        { name: "Western Heritage Boot", address: "1617 Capitol Ave, Cheyenne, WY 82001" },
        { name: "Frontier Days Boot", address: "4610 Carey Ave, Cheyenne, WY 82001" },
        { name: "Rodeo Boot", address: "121 W 15th St, Cheyenne, WY 82001" },
        { name: "Painted Pony Boot", address: "1512 Capitol Ave, Cheyenne, WY 82001" },
        { name: "Wyoming Boot", address: "2232 Dell Range Blvd, Cheyenne, WY 82009" },
        { name: "Sunset Boot", address: "1401 Dell Range Blvd, Cheyenne, WY 82009" },
        { name: "Mountain Boot", address: "3650 E Lincolnway, Cheyenne, WY 82001" },
        { name: "Prairie Boot", address: "1800 Dell Range Blvd, Cheyenne, WY 82009" },
        { name: "Wildlife Boot", address: "2250 Etchepare Dr, Cheyenne, WY 82007" },
        { name: "Patriotic Boot", address: "415 W Pershing Blvd, Cheyenne, WY 82001" },
        { name: "Ranch Boot", address: "1635 Stillwater Ave, Cheyenne, WY 82009" },
        { name: "Thunder Boot", address: "1904 Thomes Ave, Cheyenne, WY 82001" },
        { name: "Spirit Boot", address: "1920 Thomes Ave, Cheyenne, WY 82001" },
        { name: "Starlight Boot", address: "204 W Fox Farm Rd, Cheyenne, WY 82007" },
        { name: "Desert Boot", address: "3620 E Lincolnway, Cheyenne, WY 82001" },
        { name: "Canyon Boot", address: "1632 Capitol Ave, Cheyenne, WY 82001" },
        { name: "Eagle Boot", address: "300 W Lincolnway, Cheyenne, WY 82001" },
        { name: "Buffalo Boot", address: "1805 Carey Ave, Cheyenne, WY 82001" },
        { name: "Thunderbird Boot", address: "2020 House Ave, Cheyenne, WY 82001" },
        { name: "Longhorn Boot", address: "1516 Capitol Ave, Cheyenne, WY 82001" },
        { name: "Mustang Boot", address: "1520 Capitol Ave, Cheyenne, WY 82001" },
        { name: "Pioneer Boot", address: "314 W Lincolnway, Cheyenne, WY 82001" },
        { name: "Cheyenne Boot", address: "1617 Capitol Ave, Cheyenne, WY 82001" },
        { name: "Freedom Boot", address: "5025 E Lincolnway, Cheyenne, WY 82001" }
      ];

      const existingNames = boots.map(b => b.name);
      const newBoots = cheyenneBoots.filter(boot => !existingNames.includes(boot.name));
      
      if (newBoots.length === 0) {
        throw new Error('All boots are already imported');
      }

      await base44.entities.Boot.bulkCreate(newBoots);
      return newBoots.length;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ['boots'] });
      toast.success(`Imported ${count} boots successfully`);
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to import boots');
    }
  });

  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <Card className="p-8 text-center">
          <h2 className="text-xl font-semibold text-stone-800 mb-2">Access Denied</h2>
          <p className="text-stone-600 mb-4">Only admins can manage boots</p>
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

        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-stone-800">Manage Big Boots</h1>
          <Button
            onClick={() => importBootsMutation.mutate()}
            disabled={importBootsMutation.isPending}
            variant="outline"
            className="border-amber-600 text-amber-600 hover:bg-amber-50"
          >
            <Plus className="w-4 h-4 mr-2" />
            Import All Boots
          </Button>
        </div>

        {/* Add New Boot */}
        <Card className="p-6 bg-white border-stone-200 mb-6">
          <h2 className="text-xl font-semibold text-stone-800 mb-4">Add New Boot</h2>
          <div className="space-y-3">
            <Input
              value={newBootName}
              onChange={(e) => setNewBootName(e.target.value)}
              placeholder="Boot name (e.g. Big Blue Boot)"
              onKeyPress={(e) => e.key === 'Enter' && addBootMutation.mutate()}
            />
            <Textarea
              value={newBootAddress}
              onChange={(e) => setNewBootAddress(e.target.value)}
              placeholder="Address (e.g. 1600 Carey Ave, Cheyenne, WY 82001)"
              rows={2}
            />
            <Button
              onClick={() => addBootMutation.mutate()}
              disabled={addBootMutation.isPending || !newBootName.trim() || !newBootAddress.trim()}
              className="bg-amber-600 hover:bg-amber-700 text-white w-full"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Boot
            </Button>
          </div>
        </Card>

        {/* Boots List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-stone-800">
              All Boots ({boots.length})
            </h2>
          </div>
          
          {isLoading ? (
            <Card className="p-6 text-center bg-stone-50 border-stone-200">
              <p className="text-stone-500">Loading...</p>
            </Card>
          ) : boots.length === 0 ? (
            <Card className="p-6 text-center bg-stone-50 border-stone-200">
              <p className="text-stone-500">No boots yet. Click "Import All Boots" to get started!</p>
            </Card>
          ) : (
            boots.map(boot => (
              <Card key={boot.id} className="p-4 bg-white border-stone-200">
                {editingId === boot.id ? (
                  <div className="space-y-3">
                    <Input
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      autoFocus
                      placeholder="Boot name"
                    />
                    <Textarea
                      value={editingAddress}
                      onChange={(e) => setEditingAddress(e.target.value)}
                      placeholder="Address"
                      rows={2}
                    />
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => updateBootMutation.mutate({ 
                          id: boot.id, 
                          name: editingName, 
                          address: editingAddress 
                        })}
                        disabled={!editingName.trim() || !editingAddress.trim() || updateBootMutation.isPending}
                        className="text-green-600 hover:text-green-700 hover:bg-green-50"
                      >
                        <Check className="w-4 h-4 mr-2" />
                        Save
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingId(null);
                          setEditingName('');
                          setEditingAddress('');
                        }}
                        className="text-stone-600 hover:text-stone-700 hover:bg-stone-50"
                      >
                        <X className="w-4 h-4 mr-2" />
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-2xl">👢</span>
                        <h3 className="font-semibold text-stone-800">{boot.name}</h3>
                      </div>
                      <button
                        onClick={() => {
                          const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(boot.address)}`;
                          window.open(url, '_blank', 'noopener,noreferrer');
                        }}
                        className="flex items-start gap-2 text-sm text-stone-600 hover:text-amber-700 transition-colors"
                      >
                        <MapPin className="w-4 h-4 shrink-0 mt-0.5" />
                        <span>{boot.address}</span>
                      </button>
                    </div>
                    <div className="flex gap-1 ml-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingId(boot.id);
                          setEditingName(boot.name);
                          setEditingAddress(boot.address);
                        }}
                        className="text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          if (confirm(`Delete "${boot.name}"?`)) {
                            deleteBootMutation.mutate(boot.id);
                          }
                        }}
                        disabled={deleteBootMutation.isPending}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}