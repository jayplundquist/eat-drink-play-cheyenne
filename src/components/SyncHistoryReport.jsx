import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search, Clock, FileText, RefreshCw } from "lucide-react";

const fieldLabels = {
  description: "Description",
  website: "Website",
  phone: "Phone",
};

function formatDate(iso) {
  if (!iso) return null;
  try {
    return new Date(iso).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

export default function SyncHistoryReport({ venues = [] }) {
  const [search, setSearch] = useState('');

  const rows = useMemo(() => {
    return venues
      .filter(v => !search || v.name?.toLowerCase().includes(search.toLowerCase()))
      .slice()
      .sort((a, b) => {
        const ad = a.last_synced_date ? new Date(a.last_synced_date).getTime() : 0;
        const bd = b.last_synced_date ? new Date(b.last_synced_date).getTime() : 0;
        return bd - ad;
      });
  }, [venues, search]);

  const neverSynced = venues.filter(v => !v.last_synced_date).length;
  const syncedCount = venues.length - neverSynced;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-amber-600" />
          <span className="font-medium text-stone-800">Sync History</span>
          <Badge variant="secondary" className="bg-amber-100 text-amber-800">
            {syncedCount} synced · {neverSynced} never
          </Badge>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
          <Input
            placeholder="Search venues..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-8 text-sm"
          />
        </div>
      </div>

      <div className="border border-stone-200 rounded-lg max-h-96 overflow-y-auto">
        <Table>
          <TableHeader className="sticky top-0 bg-stone-50">
            <TableRow>
              <TableHead>Venue</TableHead>
              <TableHead className="whitespace-nowrap">Last Synced</TableHead>
              <TableHead>Altered Fields</TableHead>
              <TableHead>Reason</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-stone-400 py-6">
                  No venues match your search.
                </TableCell>
              </TableRow>
            ) : (
              rows.map(venue => {
                const synced = formatDate(venue.last_synced_date);
                const changes = venue.last_sync_changes || [];
                return (
                  <TableRow key={venue.id}>
                    <TableCell className="font-medium whitespace-nowrap">
                      <Link
                        to={createPageUrl('VenueDetails') + `?id=${venue.id}`}
                        className="text-amber-800 hover:text-amber-600 hover:underline"
                      >
                        {venue.name}
                      </Link>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {synced ? (
                        <span className="text-stone-600 text-sm flex items-center gap-1">
                          <RefreshCw className="w-3 h-3 text-stone-400" />
                          {synced}
                        </span>
                      ) : (
                        <span className="text-stone-400 text-sm italic">Never synced</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {changes.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {changes.map(f => (
                            <Badge
                              key={f}
                              variant="secondary"
                              className="bg-blue-100 text-blue-700 text-xs"
                            >
                              <FileText className="w-3 h-3 mr-1" />
                              {fieldLabels[f] || f}
                            </Badge>
                          ))}
                        </div>
                      ) : venue.last_synced_date ? (
                        <span className="text-stone-400 text-sm italic">No changes</span>
                      ) : (
                        <span className="text-stone-300 text-sm">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">
                      {venue.sync_error ? (
                        <span className="text-rose-600">{venue.sync_error}</span>
                      ) : venue.last_synced_date ? (
                        <span className="text-emerald-600">Synced</span>
                      ) : (
                        <span className="text-stone-400">Not yet synced</span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}