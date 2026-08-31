import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Crown } from "lucide-react";
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useSEO } from '@/hooks/useSEO';
import RecentBootPhotos from '@/components/RecentBootPhotos';

export default function BootHighScores() {
  useSEO({
    title: 'Boot High Scores | Eat, Drink, Play Cheyenne',
    description: "See who's found the most Big Boots around Cheyenne, Wyoming.",
  });

  const { data: boots = [] } = useQuery({
    queryKey: ['boots'],
    queryFn: () => base44.entities.Boot.list(),
  });

  const { data: visits = [], isLoading: visitsLoading } = useQuery({
    queryKey: ['allBootVisits'],
    queryFn: () => base44.entities.BootVisit.list(),
  });

  const { data: users = [] } = useQuery({
    queryKey: ['allUsersForHighScores'],
    queryFn: () => base44.entities.User.list(),
  });

  const { data: allBadges = [] } = useQuery({
    queryKey: ['badges'],
    queryFn: () => base44.entities.Badge.list(),
  });

  const bootBadges = React.useMemo(
    () => allBadges.filter(b => b.type === 'boot').sort((a, b) => a.min_count - b.min_count),
    [allBadges]
  );

  // The highest badge tier (e.g. Trail Boss at 25+) — once a user clears this,
  // there's no further badge to show, so they graduate to the Legends list instead.
  const legendThreshold = bootBadges.length
    ? bootBadges[bootBadges.length - 1].min_count
    : 25;

  const leaderboard = React.useMemo(() => {
    const byUser = new Map();
    for (const v of visits) {
      if (!v.user_email || !v.boot_name) continue;
      if (!byUser.has(v.user_email)) byUser.set(v.user_email, new Set());
      byUser.get(v.user_email).add(v.boot_name); // Set = de-duped, so re-visits don't inflate the count
    }
    const userMap = new Map(users.map(u => [u.email, u]));
    const rows = Array.from(byUser.entries()).map(([email, bootSet]) => {
      const count = bootSet.size;
      const u = userMap.get(email);
      const earnedBadges = bootBadges.filter(b => count >= b.min_count);
      const highestBadge = earnedBadges.length ? earnedBadges[earnedBadges.length - 1] : null;
      return {
        email,
        count,
        displayName: u?.display_name || u?.full_name || email.split('@')[0],
        profilePicture: u?.profile_picture || null,
        badge: highestBadge,
      };
    });
    rows.sort((a, b) => b.count - a.count);
    return rows;
  }, [visits, users, bootBadges]);

  const mainList = leaderboard.filter(r => r.count < legendThreshold);
  const legendsList = leaderboard.filter(r => r.count >= legendThreshold);
  const totalBoots = boots.length;

  const medal = (rank) => (rank === 0 ? '🥇' : rank === 1 ? '🥈' : rank === 2 ? '🥉' : null);

  return (
    <div className="min-h-screen bg-stone-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <Link to={createPageUrl('Home')} className="inline-block mb-6">
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </Link>

        <div className="text-center mb-8">
          <div className="text-4xl mb-2">👢🏆</div>
          <h1 className="text-3xl font-bold text-stone-800" style={{ fontFamily: 'Rye, serif' }}>
            Boot High Scores
          </h1>
          <p className="text-stone-500 text-sm mt-1">
            {totalBoots} Big Boots hidden around Cheyenne — who's found the most?
          </p>
        </div>

        <RecentBootPhotos />

        {/* Boot Legends — cleared the top badge tier, so we show their exact count instead */}
        {legendsList.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-3">
              <Crown className="w-5 h-5 text-amber-600" />
              <h2 className="text-lg font-bold text-stone-800">Boot Legends</h2>
              <span className="text-xs text-stone-400">({legendThreshold}+ boots found)</span>
            </div>
            <div className="space-y-2">
              {legendsList.map((row, i) => (
                <Card
                  key={row.email}
                  className="p-4 bg-gradient-to-r from-amber-100 to-yellow-50 border-amber-300 flex items-center gap-3"
                >
                  <div className="text-lg font-bold text-amber-700 w-6 text-center shrink-0">
                    {medal(i) || i + 1}
                  </div>
                  {row.profilePicture ? (
                    <img src={row.profilePicture} alt="" className="w-9 h-9 rounded-full object-cover shrink-0" />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-amber-200 flex items-center justify-center text-amber-800 font-semibold shrink-0">
                      {row.displayName[0]?.toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-stone-800 truncate">{row.displayName}</p>
                    <p className="text-xs text-amber-700">{row.badge?.name || 'Trail Boss'}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xl font-bold text-amber-800">{row.count}</p>
                    <p className="text-[10px] text-stone-400">of {totalBoots}</p>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Main leaderboard — ranked by boots found, badge shown next to each name */}
        <div className="space-y-2">
          {visitsLoading ? (
            <Card className="p-6 text-center bg-white border-stone-200">
              <p className="text-stone-500">Loading...</p>
            </Card>
          ) : mainList.length === 0 ? (
            <Card className="p-6 text-center bg-white border-stone-200">
              <p className="text-stone-500">No boots found yet — be the first!</p>
            </Card>
          ) : (
            mainList.map((row, i) => (
              <Card key={row.email} className="p-4 bg-white border-stone-200 flex items-center gap-3">
                <div className="text-sm font-bold text-stone-400 w-6 text-center shrink-0">{i + 1}</div>
                {row.profilePicture ? (
                  <img src={row.profilePicture} alt="" className="w-9 h-9 rounded-full object-cover shrink-0" />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-stone-200 flex items-center justify-center text-stone-600 font-semibold shrink-0">
                    {row.displayName[0]?.toUpperCase()}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-stone-800 truncate">{row.displayName}</p>
                  {row.badge ? (
                    <div className="flex items-center gap-1 text-xs text-amber-700">
                      {row.badge.icon_url ? (
                        <img src={row.badge.icon_url} alt="" className="w-3.5 h-3.5" />
                      ) : (
                        <span>🎖️</span>
                      )}
                      <span>{row.badge.name}</span>
                    </div>
                  ) : (
                    <p className="text-xs text-stone-400">No badge yet</p>
                  )}
                </div>
                <div className="text-lg font-bold text-stone-700 shrink-0">{row.count}</div>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
