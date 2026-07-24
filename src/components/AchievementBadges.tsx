"use client";

import { useStore } from '@/store/useStore';
import { Award, Film, Tv, Edit3, Crown, Clock, Sparkles } from 'lucide-react';
import { formatBingeTime } from '@/lib/utils';

export default function AchievementBadges() {
  const watchlist = useStore((state) => state.watchlist);
  const watchedEpisodes = useStore((state) => state.watchedEpisodes);
  const movieReviews = useStore((state) => state.movieReviews);
  const customLists = useStore((state) => state.customLists);

  // 1. Compute total episodes & TV watch time
  let totalWatchedEpisodesCount = 0;
  let totalTvMins = 0;

  Object.entries(watchedEpisodes).forEach(([showIdStr, epList]) => {
    const showId = Number(showIdStr);
    const validEps = (Array.isArray(epList) ? epList : []).filter(e => typeof e === 'object' && e !== null);
    totalWatchedEpisodesCount += validEps.length;

    const show = watchlist[showId];
    const runtime = show?.runtime || 45;
    totalTvMins += validEps.length * runtime;
  });

  // 2. Compute total movies watched
  const watchedMovieIds = Object.keys(watchlist).filter(id => {
    const show = watchlist[Number(id)];
    if (show?.type !== 'movie') return false;
    const epData = watchedEpisodes[Number(id)];
    return Array.isArray(epData) && epData.length > 0;
  });

  let totalMovieMins = 0;
  watchedMovieIds.forEach(id => {
    const show = watchlist[Number(id)];
    totalMovieMins += show?.runtime || 120;
  });

  const grandTotalMins = totalTvMins + totalMovieMins;
  const days = Math.floor(grandTotalMins / (24 * 60));
  const hours = Math.floor((grandTotalMins % (24 * 60)) / 60);

  // Badges logic
  const BADGES = [
    {
      id: 'binge_master',
      title: 'Binge Master',
      description: 'Watched 100+ TV episodes',
      icon: Tv,
      unlocked: totalWatchedEpisodesCount >= 100,
      progress: `${totalWatchedEpisodesCount} / 100`,
      color: 'text-amber-400 bg-amber-400/10 border-amber-400/30'
    },
    {
      id: 'cinephile',
      title: 'Cinephile',
      description: 'Watched 10+ movies',
      icon: Film,
      unlocked: watchedMovieIds.length >= 10,
      progress: `${watchedMovieIds.length} / 10`,
      color: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30'
    },
    {
      id: 'critic',
      title: 'Critic',
      description: 'Logged a movie review',
      icon: Edit3,
      unlocked: Object.keys(movieReviews).length >= 1,
      progress: `${Object.keys(movieReviews).length} / 1`,
      color: 'text-sky-400 bg-sky-400/10 border-sky-400/30'
    },
    {
      id: 'curator',
      title: 'Curator',
      description: 'Created a custom list',
      icon: Crown,
      unlocked: customLists.length >= 1,
      progress: `${customLists.length} / 1`,
      color: 'text-purple-400 bg-purple-400/10 border-purple-400/30'
    }
  ];

  return (
    <div className="flex flex-col gap-6">
      
      {/* Total Binge Stats Banner */}
      <div className="bg-gradient-to-r from-accent/20 via-accent/10 to-transparent border border-accent/30 rounded-2xl p-5 shadow-lg flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-accent text-accent-foreground flex items-center justify-center font-black shadow-md">
            <Clock className="w-6 h-6" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-accent uppercase tracking-widest">Total Binge Time</span>
            <span className="text-xl font-black text-foreground">
              {days > 0 ? `${days}d ${hours}h` : `${hours} hours`}
            </span>
          </div>
        </div>

        <div className="flex flex-col items-end">
          <span className="text-xs font-bold text-foreground">{totalWatchedEpisodesCount} Episodes</span>
          <span className="text-xs font-medium text-muted-foreground">{watchedMovieIds.length} Movies</span>
        </div>
      </div>

      {/* Badges Grid */}
      <div className="flex flex-col gap-3">
        <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-accent" /> Achievement Badges
        </h4>

        <div className="grid grid-cols-2 gap-3">
          {BADGES.map((badge) => {
            const Icon = badge.icon;
            return (
              <div
                key={badge.id}
                className={`p-3.5 rounded-2xl border flex items-center gap-3 transition-all ${
                  badge.unlocked
                    ? 'bg-card border-border/80 shadow-sm'
                    : 'bg-muted/20 border-border/40 opacity-50 grayscale'
                }`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center border flex-shrink-0 ${badge.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-bold text-foreground truncate">{badge.title}</span>
                  <span className="text-[10px] text-muted-foreground truncate">{badge.description}</span>
                  <span className="text-[9px] font-black text-accent mt-0.5">{badge.progress}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
