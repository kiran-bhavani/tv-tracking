"use client";

import { useStore } from '@/store/useStore';
import { logActivity } from '@/lib/activity';
import { CheckCheck, Check } from 'lucide-react';
import { useState } from 'react';

interface MarkSeasonWatchedButtonProps {
  showId: number;
  showName: string;
  seasonNumber: number;
  totalEpisodes: number;
}

export default function MarkSeasonWatchedButton({ showId, showName, seasonNumber, totalEpisodes }: MarkSeasonWatchedButtonProps) {
  const watchedEpisodes = useStore((state) => state.watchedEpisodes);
  const toggleEpisodeWatched = useStore((state) => state.toggleEpisodeWatched);
  const [loading, setLoading] = useState(false);

  const epData = (watchedEpisodes || {})[showId] || [];
  const watchedList = (Array.isArray(epData) ? epData : []).filter(e => typeof e === 'object' && e !== null);
  const watchedIds = new Set(watchedList.map((e: any) => e.id));

  // Check if all episodes in this season are watched
  const seasonEpIds = Array.from({ length: totalEpisodes }, (_, i) => showId * 1000 + (i + 1));
  const isSeasonComplete = seasonEpIds.every(id => watchedIds.has(id));

  const handleToggleSeason = () => {
    setLoading(true);
    const targetState = !isSeasonComplete;

    seasonEpIds.forEach((id, idx) => {
      const epNum = idx + 1;
      const isWatched = watchedIds.has(id);

      if (targetState !== isWatched) {
        if (targetState) {
          logActivity(showId, showName, seasonNumber, epNum, `Season ${seasonNumber} Episode ${epNum}`);
        }
        toggleEpisodeWatched(showId, {
          id,
          season: seasonNumber,
          episode: epNum
        });
      }
    });

    setTimeout(() => setLoading(false), 300);
  };

  return (
    <button
      onClick={handleToggleSeason}
      disabled={loading}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs transition-all border shadow-sm ${
        isSeasonComplete
          ? 'bg-accent text-accent-foreground border-accent'
          : 'bg-accent/15 text-accent border-accent/30 hover:bg-accent/25'
      }`}
    >
      {isSeasonComplete ? (
        <>
          <CheckCheck className="w-4 h-4 stroke-[2.5]" />
          <span>Season {seasonNumber} Watched</span>
        </>
      ) : (
        <>
          <Check className="w-4 h-4 stroke-[2.5]" />
          <span>Mark Season {seasonNumber} Watched</span>
        </>
      )}
    </button>
  );
}
