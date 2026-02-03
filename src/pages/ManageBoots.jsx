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

  useEffect(() => {
    if (user?.role === 'admin' && boots.length === 0) {
      importBootsMutation.mutate();
    }
  }, [user?.role]);

  useEffect(() => {
    if (boots.length > 0) {
      const addressMap = new Map();
      const hasDuplicates = boots.some(boot => {
        if (addressMap.has(boot.address)) return true;
        addressMap.set(boot.address, true);
        return false;
      });
      
      if (hasDuplicates) {
        removeDuplicatesMutation.mutate();
      }
    }
  }, [boots.length]);

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
        { name: "Gamblers Boot", address: "4610 Carey Ave (Old West Museum)" },
        { name: "LCCC Eagle Eye on the Future", address: "1400 E College Dr (campus, south side)" },
        { name: "Where the Deer and the Antelope Play", address: "Cheyenne Depot Plaza" },
        { name: "Springtime in Cheyenne", address: "6106 Yellowstone Rd" },
        { name: "People Places and Things", address: "311 Cleveland Place (lobby)" },
        { name: "Don't Feed the Animals", address: "Cheyenne Depot Plaza" },
        { name: "Licensed to Boot", address: "2301 Central Ave" },
        { name: "Outlaws of Wyoming", address: "Morrie Ave/Lincolnway (Holliday Park)" },
        { name: "Governors of Wyoming", address: "Cheyenne Depot Plaza" },
        { name: "Atmospheric Research", address: "8120 Veta Dr" },
        { name: "Memories of the Old West", address: "Cheyenne Depot Plaza (by the tracks)" },
        { name: "Blue Skies Over Cheyenne", address: "4020 Airport Pkwy (in terminal)" },
        { name: "8-Second Steps to the Big Time", address: "1912 Capitol Ave" },
        { name: "Downtown Cheyenne", address: "Cheyenne Depot Plaza" },
        { name: "Milestones: Chamber 100th Anniversary", address: "Cheyenne Depot Plaza" },
        { name: "Journey of the Soul", address: "710 S. Lions Park Dr (Cheyenne Botanic Gardens)" },
        { name: "Book Boot", address: "2200 Pioneer Avenue" },
        { name: "Cheyenne Vision Clinic", address: "1854 Dell Range Blvd." },
        { name: "All Things Wyoming", address: "502 Bonanza Trail" },
        { name: "Hub International", address: "1620 E Pershing Blvd (in lobby)" },
        { name: "Wyoming Bank & Trust 100th Anniversary", address: "5827 Yellowstone Rd" },
        { name: "Walmart Boot", address: "426 Logistics Dr" },
        { name: "Wyoming Financial Properties", address: "6101 Yellowstone Rd (in lobby)" },
        { name: "Our Legacy, Improving Life with Energy", address: "1301 W 24th St" },
        { name: "Saga of Tom Horn", address: "1902 Carey Ave (east side)" },
        { name: "Wyoming Women 1st to Vote", address: "Capitol Ave (between 17th & 18th)" },
        { name: "Honoring Healthcare Heroes", address: "214 E. 23rd St" },
        { name: "Exeter's Pony Express", address: "Cheyenne Depot Plaza" },
        { name: "First American Title", address: "245 Storey Boulevard" },
        { name: "Religion's a Kick", address: "2200 O'Neil Ave" },
        { name: "South High Class of 2022", address: "1213 W. Allison Rd. (South High)" },
        { name: "We're With You", address: "1715 Stillwater Ave" },
        { name: "Happy Birthday Cheyenne!", address: "2101 O'Neil Ave" },
        { name: "Lewis Auto Repair", address: "285 North American Rd" }
      ];

      const existingAddresses = boots.map(b => b.address);
      const newBoots = cheyenneBoots.filter(boot => !existingAddresses.includes(boot.address));
      
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

  const removeDuplicatesMutation = useMutation({
    mutationFn: async () => {
      const addressMap = new Map();
      const duplicateIds = [];

      boots.forEach(boot => {
        if (!boot.address) return;
        
        if (addressMap.has(boot.address)) {
          duplicateIds.push(boot.id);
        } else {
          addressMap.set(boot.address, boot.id);
        }
      });

      if (duplicateIds.length === 0) {
        throw new Error('No duplicates found');
      }

      for (const id of duplicateIds) {
        await base44.entities.Boot.delete(id);
      }

      return duplicateIds.length;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ['boots'] });
      toast.success(`Removed ${count} duplicate boot${count > 1 ? 's' : ''}`);
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to remove duplicates');
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
          <div className="flex gap-2">
            <Button
              onClick={() => {
                if (confirm('Remove all duplicate boots based on address? This will keep only one boot per address.')) {
                  removeDuplicatesMutation.mutate();
                }
              }}
              disabled={removeDuplicatesMutation.isPending}
              variant="outline"
              className="border-red-600 text-red-600 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Remove Duplicates
            </Button>
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