import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { CheckCircle, XCircle, ArrowLeft, Clock } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

export default function ManageClaimRequests() {
  const [user, setUser] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => setUser(null));
  }, []);

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ['claimRequests'],
    queryFn: () => base44.entities.ClaimRequest.list('-created_date'),
    enabled: !!user && user.role === 'admin',
  });

  const approveMutation = useMutation({
    mutationFn: async (request) => {
      // Update request status
      await base44.entities.ClaimRequest.update(request.id, { status: 'approved' });
      
      // Update venue with claimed_by
      await base44.entities.Venue.update(request.venue_id, {
        claimed_by: request.user_email,
      });

      // Update user to premium
      const users = await base44.entities.User.filter({ email: request.user_email });
      if (users[0]) {
        await base44.entities.User.update(users[0].id, { is_premium: true });
      }
    },
    onSuccess: () => {
      toast.success('Claim approved!');
      queryClient.invalidateQueries({ queryKey: ['claimRequests'] });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async (requestId) => {
      await base44.entities.ClaimRequest.update(requestId, { status: 'rejected' });
    },
    onSuccess: () => {
      toast.success('Claim rejected');
      queryClient.invalidateQueries({ queryKey: ['claimRequests'] });
    },
  });

  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-stone-800 mb-2">Access Denied</h2>
          <p className="text-stone-600 mb-4">Only admins can manage claim requests</p>
          <Link to={createPageUrl('Home')}>
            <Button variant="outline">Back to Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  const pendingRequests = requests.filter(r => r.status === 'pending');
  const resolvedRequests = requests.filter(r => r.status !== 'pending');

  return (
    <div className="min-h-screen bg-stone-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="mb-8">
          <Link to={createPageUrl('ManageVenues')}>
            <Button variant="outline" size="sm" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-stone-900">Manage Venue Claims</h1>
          <p className="text-stone-600 mt-2">Review and approve or reject venue ownership requests</p>
        </div>

        {/* Pending Requests */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-stone-800 mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-600" />
            Pending Requests ({pendingRequests.length})
          </h2>

          {isLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-32" />
              ))}
            </div>
          ) : pendingRequests.length === 0 ? (
            <Card className="p-6 text-center bg-white border-stone-200">
              <p className="text-stone-500">No pending requests</p>
            </Card>
          ) : (
            <div className="space-y-4">
              {pendingRequests.map((request, i) => (
                <motion.div
                  key={request.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Card className="p-6 bg-white border-stone-200">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="font-semibold text-stone-900 text-lg mb-1">
                          {request.venue_name}
                        </h3>
                        <p className="text-sm text-stone-600 mb-2">
                          Requested by: <span className="font-medium">{request.user_email}</span>
                        </p>
                        <p className="text-xs text-stone-500">
                          {format(new Date(request.created_date), 'MMM d, yyyy')}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => approveMutation.mutate(request)}
                          disabled={approveMutation.isPending}
                          className="bg-green-600 hover:bg-green-700 text-white"
                          size="sm"
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Approve
                        </Button>
                        <Button
                          onClick={() => rejectMutation.mutate(request.id)}
                          disabled={rejectMutation.isPending}
                          variant="outline"
                          className="border-red-300 text-red-600 hover:bg-red-50"
                          size="sm"
                        >
                          <XCircle className="w-4 h-4 mr-2" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Resolved Requests */}
        {resolvedRequests.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-stone-800 mb-4">Resolved Requests</h2>
            <div className="space-y-3">
              {resolvedRequests.map((request) => (
                <Card key={request.id} className="p-4 bg-stone-50 border-stone-200">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-stone-800">{request.venue_name}</p>
                      <p className="text-sm text-stone-600">{request.user_email}</p>
                    </div>
                    <Badge className={request.status === 'approved' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                      {request.status}
                    </Badge>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}