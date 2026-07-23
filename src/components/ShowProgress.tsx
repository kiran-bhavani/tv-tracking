"use client";

import { useStore } from '@/store/useStore';
import { useEffect, useState } from 'react';

export default function ShowProgress({ showId, totalEpisodes }: { showId: number, totalEpisodes: number }) {
  const [mounted, setMounted] = useState(false);
  const watchlist = useStore(state => state.watchlist);
  const watchedEpisodes = useStore(state => state.watchedEpisodes);

  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  const isInWatchlist = !!watchlist[showId];
  if (!isInWatchlist) return null;

  const totalWatched = (watchedEpisodes[showId] || []).length;
  const progressPercent = totalEpisodes > 0 ? Math.min(100, Math.round((totalWatched / totalEpisodes) * 100)) : 0;

  return (
    <div className="mt-4 px-4">
      <div className="flex justify-between items-end mb-1 text-sm font-bold">
        <span className="text-foreground">Progress</span>
        <span className="text-accent">{totalWatched} <span className="text-muted-foreground font-normal">/ {totalEpisodes}</span></span>
      </div>
      <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
        <div 
          className="bg-accent h-full transition-all duration-500"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
    </div>
  );
}
