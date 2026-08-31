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

  const topTierId = bootBadges.length ? bootBadges[bootBadges.length - 1].id : null;

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
    return rows;
  }, [visits, users, bootBadges]);

  // Group everyone into the list for their CURRENT badge tier — climb the badge
  // ladder and you move up to the next list as you find more boots.
  const tierGroups = React.useMemo(() => {
    const tiersHighestFirst = [...bootBadges].sort((a, b) => b.min_count - a.min_count);
    return tiersHighestFirst.map(badge => {
      const members = leaderboard
        .filter(r => r.badge?.id === badge.id)
        .sort((a, b) => b.count - a.count);
      return { badge, isTopTier: badge.id === topTierId, members };
    });
  }, [bootBadges, leaderboard, topTierId]);

  const totalBoots = boots.length;
  const medal = (rank) => (rank === 0 ? '🥇' : rank === 1 ? '🥈' : rank === 2 ? '🥉' : null);
  const hasAnyFinders = leaderboard.length > 0;

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

        {visitsLoading ? (
          <Card className="p-6 text-center bg-white border-stone-200">
            <p className="text-stone-500">Loading...</p>
          </Card>
        ) : !hasAnyFinders ? (
          <Card className="p-6 text-center bg-white border-stone-200">
            <p className="text-stone-500">No boots found yet — be the first!</p>
          </Card>
        ) : (
          tierGroups.map(({ badge, isTopTier, members }) => {
            if (members.length === 0) return null;
            return (
              <div key={badge.id} className="mb-8">
                <div className="flex items-center gap-2 mb-3">
                  {isTopTier ? (
                    <Crown className="w-5 h-5 text-amber-600" />
                  ) : badge.icon_url ? (
                    <img src={badge.icon_url} alt="" className="w-5 h-5" />
                  ) : (
                    <span className="text-lg">🎖️</span>
                  )}
                  <h2 className="text-lg font-bold text-stone-800">{badge.name}</h2>
                  <span className="text-xs text-stone-400">
                    ({badge.min_count}+ boots found)
                  </span>
                </div>
                <div className="space-y-2">
                  {members.map((row, i) => (
                    <Card
                      key={row.email}
                      className={
                        isTopTier
                          ? "p-4 bg-gradient-to-r from-amber-100 to-yellow-50 border-amber-300 flex items-center gap-3"
                          : "p-4 bg-white border-stone-200 flex items-center gap-3"
                      }
                    >
                      <div className={`text-lg font-bold w-6 text-center shrink-0 ${isTopTier ? 'text-amber-700' : 'text-stone-400'}`}>
                        {medal(i) || i + 1}
                      </div>
                      {row.profilePicture ? (
                        <img src={row.profilePicture} alt="" className="w-9 h-9 rounded-full object-cover shrink-0" />
                      ) : (
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center font-semibold shrink-0 ${isTopTier ? 'bg-amber-200 text-amber-800' : 'bg-stone-200 text-stone-600'}`}>
                          {row.displayName[0]?.toUpperCase()}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-stone-800 truncate">{row.displayName}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className={`text-xl font-bold ${isTopTier ? 'text-amber-800' : 'text-stone-700'}`}>{row.count}</p>
                        {isTopTier && <p className="text-[10px] text-stone-400">of {totalBoots}</p>}
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
