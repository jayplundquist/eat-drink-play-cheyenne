import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, Flag, Trash2, CheckCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { toast } from "sonner";
import { motion } from "framer-motion";

export default function ManageReports() {
  const [user, setUser] = useState(null);
  const [reportStatus, setReportStatus] = useState('pending');

  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(user => {
      if (!user || user.role !== 'admin') {
        window.location.href = createPageUrl('Home');
      }
      setUser(user);
    });
  }, []);

  const { data: problemReports = [], isLoading: problemLoading } = useQuery({
    queryKey: ['problemReports', reportStatus],
    queryFn: () => base44.entities.ProblemReport.filter({ status: reportStatus }),
    enabled: !!user,
  });

  const { data: reviewReports = [], isLoading: reviewLoading } = useQuery({
    queryKey: ['reviewReports', reportStatus],
    queryFn: () => base44.entities.ReviewReport.filter({ status: reportStatus }),
    enabled: !!user,
  });

  const { data: photoReports = [], isLoading: photoLoading } = useQuery({
    queryKey: ['photoReports', reportStatus],
    queryFn: () => base44.entities.PhotoReport.filter({ status: reportStatus }),
    enabled: !!user,
  });

  const { data: profileReports = [], isLoading: profileLoading } = useQuery({
    queryKey: ['profileReports', reportStatus],
    queryFn: () => base44.entities.ProfileReport.filter({ status: reportStatus }),
    enabled: !!user,
  });

  const updateReportMutation = useMutation({
    mutationFn: async ({ entityName, reportId, newStatus }) => {
      const entity = base44.entities[entityName];
      await entity.update(reportId, { status: newStatus });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['problemReports'] });
      queryClient.invalidateQueries({ queryKey: ['reviewReports'] });
      queryClient.invalidateQueries({ queryKey: ['photoReports'] });
      queryClient.invalidateQueries({ queryKey: ['profileReports'] });
      toast.success('Report updated');
    },
  });

  const deleteReportMutation = useMutation({
    mutationFn: async ({ entityName, reportId }) => {
      const entity = base44.entities[entityName];
      await entity.delete(reportId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['problemReports'] });
      queryClient.invalidateQueries({ queryKey: ['reviewReports'] });
      queryClient.invalidateQueries({ queryKey: ['photoReports'] });
      queryClient.invalidateQueries({ queryKey: ['profileReports'] });
      toast.success('Report deleted');
    },
  });

  const ReportCard = ({ report, type, entityName }) => {
    const statusColor = {
      pending: 'bg-yellow-100 text-yellow-800',
      reviewed: 'bg-blue-100 text-blue-800',
      resolved: 'bg-green-100 text-green-800',
      removed: 'bg-red-100 text-red-800'
    };

    const renderReportContent = () => {
      switch (type) {
        case 'problem':
          return (
            <div className="space-y-2">
              <p className="text-sm"><span className="font-semibold">Venue:</span> {report.venue_name}</p>
              <p className="text-sm"><span className="font-semibold">Issue:</span> {report.issue}</p>
              <p className="text-xs text-stone-500">Reported by: {report.reporter_email}</p>
            </div>
          );
        case 'review':
          return (
            <div className="space-y-2">
              <p className="text-sm"><span className="font-semibold">Review ID:</span> {report.review_id}</p>
              <p className="text-sm"><span className="font-semibold">Reason:</span> {report.reason}</p>
              <p className="text-xs text-stone-500">Reported by: {report.reporter_email}</p>
            </div>
          );
        case 'photo':
          return (
            <div className="space-y-2">
              {report.photo_url && (
                <img src={report.photo_url} alt="Reported photo" className="w-full h-32 object-cover rounded-md" />
              )}
              <p className="text-sm"><span className="font-semibold">Reason:</span> {report.reason}</p>
              <p className="text-xs text-stone-500">Reported by: {report.reporter_email}</p>
            </div>
          );
        case 'profile':
          return (
            <div className="space-y-2">
              <p className="text-sm"><span className="font-semibold">User:</span> {report.reported_email}</p>
              <p className="text-sm"><span className="font-semibold">Reason:</span> {report.reason}</p>
              <p className="text-xs text-stone-500">Reported by: {report.reporter_email}</p>
            </div>
          );
        default:
          return null;
      }
    };

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="p-4 border-stone-200">
          <div className="flex items-start justify-between mb-4">
            <Badge className={statusColor[report.status] || 'bg-stone-100 text-stone-800'}>
              {report.status}
            </Badge>
            <p className="text-xs text-stone-500">{new Date(report.created_date).toLocaleDateString()}</p>
          </div>

          {renderReportContent()}

          <div className="flex gap-2 mt-4">
            {report.status === 'pending' && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => updateReportMutation.mutate({ entityName, reportId: report.id, newStatus: 'reviewed' })}
                  className="border-blue-300 text-blue-700 hover:bg-blue-50"
                >
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Mark Reviewed
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => updateReportMutation.mutate({ entityName, reportId: report.id, newStatus: 'resolved' })}
                  className="border-green-300 text-green-700 hover:bg-green-50"
                >
                  Mark Resolved
                </Button>
              </>
            )}
            {report.status !== 'resolved' && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  if (confirm('Delete this report?')) {
                    deleteReportMutation.mutate({ entityName, reportId: report.id });
                  }
                }}
                className="border-red-300 text-red-700 hover:bg-red-50 ml-auto"
              >
                <Trash2 className="w-3 h-3 mr-1" />
                Delete
              </Button>
            )}
          </div>
        </Card>
      </motion.div>
    );
  };

  if (!user || user.role !== 'admin') {
    return null;
  }

  const isLoading = problemLoading || reviewLoading || photoLoading || profileLoading;

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center gap-3 mb-8">
          <Flag className="w-6 h-6 text-amber-600" />
          <h1 className="text-3xl font-bold text-amber-900">User Reports</h1>
        </div>

        {/* Status Tabs */}
        <Tabs defaultValue="pending" onValueChange={setReportStatus} className="mb-8">
          <TabsList className="border-amber-300 bg-white">
            <TabsTrigger value="pending" className="data-[state=active]:bg-amber-100">
              Pending ({problemReports.length + reviewReports.length + photoReports.length + profileReports.length})
            </TabsTrigger>
            <TabsTrigger value="reviewed" className="data-[state=active]:bg-amber-100">
              Reviewed
            </TabsTrigger>
            <TabsTrigger value="resolved" className="data-[state=active]:bg-amber-100">
              Resolved
            </TabsTrigger>
          </TabsList>

          <TabsContent value={reportStatus} className="space-y-6">
            {/* Problem Reports */}
            {(problemLoading ? [1, 2] : problemReports).length > 0 && (
              <div>
                <h2 className="text-xl font-semibold text-stone-800 mb-4 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-orange-600" />
                  Venue Issues ({problemReports.length})
                </h2>
                <div className="space-y-3">
                  {problemLoading ? (
                    [...Array(2)].map((_, i) => (
                      <Skeleton key={i} className="h-32" />
                    ))
                  ) : (
                    problemReports.map(report => (
                      <ReportCard key={report.id} report={report} type="problem" entityName="ProblemReport" />
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Review Reports */}
            {(reviewLoading ? [1, 2] : reviewReports).length > 0 && (
              <div>
                <h2 className="text-xl font-semibold text-stone-800 mb-4 flex items-center gap-2">
                  <Flag className="w-5 h-5 text-red-600" />
                  Review Reports ({reviewReports.length})
                </h2>
                <div className="space-y-3">
                  {reviewLoading ? (
                    [...Array(2)].map((_, i) => (
                      <Skeleton key={i} className="h-32" />
                    ))
                  ) : (
                    reviewReports.map(report => (
                      <ReportCard key={report.id} report={report} type="review" entityName="ReviewReport" />
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Photo Reports */}
            {(photoLoading ? [1, 2] : photoReports).length > 0 && (
              <div>
                <h2 className="text-xl font-semibold text-stone-800 mb-4 flex items-center gap-2">
                  <Flag className="w-5 h-5 text-yellow-600" />
                  Photo Reports ({photoReports.length})
                </h2>
                <div className="space-y-3">
                  {photoLoading ? (
                    [...Array(2)].map((_, i) => (
                      <Skeleton key={i} className="h-40" />
                    ))
                  ) : (
                    photoReports.map(report => (
                      <ReportCard key={report.id} report={report} type="photo" entityName="PhotoReport" />
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Profile Reports */}
            {(profileLoading ? [1, 2] : profileReports).length > 0 && (
              <div>
                <h2 className="text-xl font-semibold text-stone-800 mb-4 flex items-center gap-2">
                  <Flag className="w-5 h-5 text-purple-600" />
                  Profile Reports ({profileReports.length})
                </h2>
                <div className="space-y-3">
                  {profileLoading ? (
                    [...Array(2)].map((_, i) => (
                      <Skeleton key={i} className="h-32" />
                    ))
                  ) : (
                    profileReports.map(report => (
                      <ReportCard key={report.id} report={report} type="profile" entityName="ProfileReport" />
                    ))
                  )}
                </div>
              </div>
            )}

            {!isLoading && problemReports.length === 0 && reviewReports.length === 0 && photoReports.length === 0 && profileReports.length === 0 && (
              <div className="text-center py-12 bg-white rounded-lg border border-stone-200">
                <p className="text-stone-500">No reports in this category</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}