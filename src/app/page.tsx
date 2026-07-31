"use client";

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { X, Tv, ArrowUpDown, CheckCircle2, LayoutGrid, List, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '@/store/useStore';
import ForYouRecommendations from '@/components/ForYouRecommendations';
import UpcomingTab from '@/components/UpcomingTab';
import UpNextDeck from '@/components/UpNextDeck';

const getImageUrl = (path: string | null, size: string = 'w500') => 
  path ? `https://image.tmdb.org/t/p/${size}${path}` : '/placeholder.png';

export default function WatchlistPage() {
  const [mounted, setMounted] = useState(() => typeof window !== 'undefined');
  const activeTab = useStore((state) => state.showsActiveTab || 'watchlist');
  const setActiveTab = useStore((state) => state.setShowsActiveTab);
  const sortMode = useStore((state) => state.showsSortMode || 'default');
  const setSortMode = useStore((state) => state.setShowsSortMode);
  const viewMode = useStore((state) => state.viewMode || 'card');
  const setViewMode = useStore((state) => state.setViewMode);
  const watchlistMap = useStore((state) => state.watchlist);
  const watchedEpisodes = useStore((state) => state.watchedEpisodes);
  const removeFromWatchlist = useStore((state) => state.removeFromWatchlist);
  const toggleEpisodeWatched = useStore((state) => state.toggleEpisodeWatched);

  useEffect(() => {
    setMounted(true);
  }, []);

  const allTvShows = Object.values(watchlistMap || {}).filter(show => show?.type === 'tv');

  const getWatched = (id: number) =>
    (Array.isArray((watchedEpisodes || {})[id]) ? (watchedEpisodes || {})[id] : [])
      .filter((e: any) => typeof e === 'object' && e !== null) as any[];

  const sortShows = (shows: typeof allTvShows) => {
    if (sortMode === 'alpha') return [...shows].sort((a, b) => a.name.localeCompare(b.name));
    if (sortMode === 'progress') return [...shows].sort((a, b) => {
      const aPct = a.number_of_episodes ? getWatched(a.id).length / a.number_of_episodes : 0;
      const bPct = b.number_of_episodes ? getWatched(b.id).length / b.number_of_episodes : 0;
      return bPct - aPct; // most progressed first
    });
    return shows;
  };

  const rawActive = allTvShows.filter(show => {
    const w = getWatched(show.id);
    return !(show.number_of_episodes && show.number_of_episodes > 0 && w.length >= show.number_of_episodes);
  });
  const rawFinished = allTvShows.filter(show => {
    const w = getWatched(show.id);
    return (show.number_of_episodes && show.number_of_episodes > 0 && w.length >= show.number_of_episodes);
  });
  const activeShows = sortShows(rawActive);
  const finishedShows = sortShows(rawFinished);

  const sortLabels = { default: 'Added', alpha: 'A–Z', progress: 'Progress' };
  const cycleSort = () => {
    const modes = ['default', 'alpha', 'progress'] as const;
    const currentIndex = modes.indexOf(sortMode as any);
    const nextMode = modes[(currentIndex + 1) % modes.length];
    setSortMode(nextMode);
  };

  return (
    <div className="min-h-screen bg-background pb-32">
      {/* Top Header */}
      <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl pt-safe shadow-sm border-b border-white/5">
        <div className="px-5 py-3.5 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black tracking-tight text-white">Shows</h1>
            {mounted && (
              <span className="text-[10px] font-black uppercase tracking-wider bg-accent/15 text-accent px-2 py-0.5 rounded-full border border-accent/30">
                {activeShows.length} Active
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* View Mode Toggle (Card vs Grid) */}
            <div className="bg-white/5 p-1 rounded-full border border-white/10 flex gap-1">
              <button
                onClick={() => setViewMode('card')}
                className={`p-1.5 rounded-full transition-all ${viewMode === 'card' ? 'bg-accent text-accent-foreground shadow-md' : 'text-zinc-400 hover:text-white'}`}
                title="Detailed Cards View"
              >
                <List className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-full transition-all ${viewMode === 'grid' ? 'bg-accent text-accent-foreground shadow-md' : 'text-zinc-400 hover:text-white'}`}
                title="Compact Poster Grid View"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Sort Toggle */}
            <button
              onClick={cycleSort}
              className="flex items-center gap-1.5 bg-white/5 hover:bg-white/10 text-zinc-300 text-xs font-bold px-3 py-1.5 rounded-full transition-colors border border-white/10"
              title="Change sort order"
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
              {sortLabels[sortMode]}
            </button>
          </div>
        </div>
        
        {/* iOS Segmented Pill Control for Watchlist vs Upcoming */}
        <div className="px-4 pb-3 flex justify-center">
          <div className="bg-white/5 p-1 rounded-full border border-white/10 flex gap-1 w-full max-w-xs relative">
            <button
              onClick={() => setActiveTab('watchlist')}
              className={`flex-1 py-1.5 rounded-full text-xs font-black tracking-wide transition-colors relative z-10 text-center ${
                activeTab === 'watchlist' ? 'text-accent-foreground' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Watchlist
              {activeTab === 'watchlist' && (
                <motion.div
                  layoutId="shows-tab-pill"
                  className="absolute inset-0 bg-accent rounded-full shadow-md -z-10"
                  transition={{ type: "spring", stiffness: 400, damping: 28 }}
                />
              )}
            </button>
            <button
              onClick={() => setActiveTab('upcoming')}
              className={`flex-1 py-1.5 rounded-full text-xs font-black tracking-wide transition-colors relative z-10 text-center ${
                activeTab === 'upcoming' ? 'text-accent-foreground' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Upcoming
              {activeTab === 'upcoming' && (
                <motion.div
                  layoutId="shows-tab-pill"
                  className="absolute inset-0 bg-accent rounded-full shadow-md -z-10"
                  transition={{ type: "spring", stiffness: 400, damping: 28 }}
                />
              )}
            </button>
          </div>
        </div>
      </div>
      
      <div className="px-4 py-4 flex flex-col gap-4">
        {!mounted ? (
          <div className="text-center text-muted-foreground py-10">Loading...</div>
        ) : (
          <>
            {activeTab === 'upcoming' ? (
              <UpcomingTab showIds={allTvShows.map(s => s.id)} />
            ) : viewMode === 'grid' ? (
              /* Compact Poster Grid View */
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                {activeShows.map(show => {
                  const epData = (watchedEpisodes || {})[show.id];
                  const showWatched = (Array.isArray(epData) ? epData : []).filter(e => typeof e === 'object' && e !== null) as any[];
                  const totalWatched = showWatched.length;
                  const totalEpisodes = show.number_of_episodes || 0;
                  const progressPercent = totalEpisodes > 0 ? Math.min(100, Math.round((totalWatched / totalEpisodes) * 100)) : 0;

                  const sorted = [...showWatched].sort((a, b) => {
                    const s = (a.season ?? 1) - (b.season ?? 1);
                    return s !== 0 ? s : (a.episode ?? 0) - (b.episode ?? 0);
                  });
                  const last = sorted[sorted.length - 1];
                  const nextSeason = last?.season ?? 1;
                  const nextEp = (last?.episode ?? 0) + 1;
                  const nextId = nextSeason * 10000 + nextEp;

                  return (
                    <div key={show.id} className="group relative flex flex-col rounded-xl overflow-hidden bg-card border border-white/5 shadow-md">
                      <Link href={`/show/${show.id}`} className="aspect-[2/3] relative w-full bg-zinc-900 overflow-hidden">
                        <Image src={getImageUrl(show.poster_path)} alt={show.name} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                        
                        {/* Quick Mark Watched Overlay Button */}
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            toggleEpisodeWatched(show.id, { id: nextId, season: nextSeason, episode: nextEp });
                          }}
                          title={`Mark S${String(nextSeason).padStart(2,'0')}E${String(nextEp).padStart(2,'0')} watched`}
                          className="absolute top-2 right-2 w-8 h-8 rounded-full bg-emerald-500 text-black flex items-center justify-center shadow-lg shadow-emerald-500/30 opacity-95 hover:scale-110 active:scale-95 transition-all"
                        >
                          <Plus className="w-4.5 h-4.5 stroke-[3]" />
                        </button>

                        <div className="absolute bottom-2 left-2 right-2">
                          <span className="text-[10px] font-black text-accent uppercase tracking-wider block truncate">
                            S{String(nextSeason).padStart(2,'0')}E{String(nextEp).padStart(2,'0')}
                          </span>
                        </div>
                      </Link>

                      <div className="p-2 flex flex-col justify-between flex-1">
                        <Link href={`/show/${show.id}`} className="font-bold text-foreground text-xs leading-tight line-clamp-1 group-hover:text-accent transition-colors">
                          {show.name}
                        </Link>
                        {totalEpisodes > 0 && (
                          <div className="w-full bg-white/10 h-1 rounded-full overflow-hidden mt-1.5">
                            <div className="bg-accent h-full transition-all" style={{ width: `${progressPercent}%` }} />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* Detailed Cards View */
              <AnimatePresence>
                {activeShows.map(show => {
                const epData = (watchedEpisodes || {})[show.id];
                const showWatched = (Array.isArray(epData) ? epData : []).filter(e => typeof e === 'object' && e !== null) as any[];
                const totalWatched = showWatched.length;
                const totalEpisodes = show.number_of_episodes || 0;
                const progressPercent = totalEpisodes > 0 ? Math.min(100, Math.round((totalWatched / totalEpisodes) * 100)) : 0;
                
                let nextEpisodeStr = '';
                if (totalWatched > 0) {
                  // Sort by season then episode to derive the correct next episode
                  const sorted = [...showWatched].sort((a, b) => {
                    const sSeason = (a.season ?? 1) - (b.season ?? 1);
                    return sSeason !== 0 ? sSeason : (a.episode ?? 0) - (b.episode ?? 0);
                  });
                  const last = sorted[sorted.length - 1];
                  const nextSeason = last.season ?? 1;
                  const nextEp = (last.episode ?? 0) + 1;
                  nextEpisodeStr = `Up Next: S${String(nextSeason).padStart(2, '0')}E${String(nextEp).padStart(2, '0')}`;
                } else if (show.type === 'tv') {
                  nextEpisodeStr = 'Up Next: S01E01';
                }
                
                return (
                  <motion.div
                    key={show.id}
                    layout
                    initial={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9, x: -100 }}
                    transition={{ duration: 0.3 }}
                    className="bg-card/40 backdrop-blur-md rounded-2xl overflow-hidden flex shadow-xl border border-white/5 group"
                  >
                    {/* Poster */}
                    <Link href={`/${show.type === 'movie' ? 'movie' : 'show'}/${show.id}`} className="w-28 relative flex-shrink-0 bg-zinc-900">
                      <Image src={getImageUrl(show.poster_path)} alt={show.name} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                    </Link>
                    
                    {/* Content */}
                    <div className="flex-1 flex flex-col">
                      <div className="p-4 flex gap-3 h-full">
                        <Link href={`/${show.type === 'movie' ? 'movie' : 'show'}/${show.id}`} className="flex-1 min-w-0 flex flex-col justify-center">
                          <h3 className="font-bold text-white text-base leading-tight truncate">{show.name}</h3>
                          <p className="text-[11px] tracking-wide uppercase text-accent font-semibold mt-1.5">
                            {show.type === 'movie' ? 'Movie' : (nextEpisodeStr || 'Up Next')}
                          </p>
                          <p className="text-xs text-white/50 font-medium truncate mt-0.5">
                            {show.type === 'movie' ? 'Ready to watch' : `${totalWatched} Episodes Watched`}
                          </p>
                        </Link>

                        <div className="flex flex-col gap-2 flex-shrink-0 self-center">
                          {/* Quick mark next episode watched */}
                          {show.type === 'tv' && (() => {
                            const sorted = [...showWatched].sort((a, b) => {
                              const s = (a.season ?? 1) - (b.season ?? 1);
                              return s !== 0 ? s : (a.episode ?? 0) - (b.episode ?? 0);
                            });
                            const last = sorted[sorted.length - 1];
                            const nextSeason = last?.season ?? 1;
                            const nextEp = (last?.episode ?? 0) + 1;
                            const nextId = nextSeason * 10000 + nextEp; // synthetic id
                            return (
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  toggleEpisodeWatched(show.id, { id: nextId, season: nextSeason, episode: nextEp });
                                }}
                                title={`Mark S${String(nextSeason).padStart(2,'0')}E${String(nextEp).padStart(2,'0')} watched`}
                                className="w-10 h-10 bg-accent/15 rounded-full flex justify-center items-center border border-accent/30 text-accent hover:bg-accent hover:text-accent-foreground transition-all"
                              >
                                <CheckCircle2 className="w-5 h-5" />
                              </button>
                            );
                          })()}
                          {/* Remove */}
                          <button 
                            onClick={(e) => { e.preventDefault(); removeFromWatchlist(show.id); }}
                            className="w-10 h-10 bg-white/5 rounded-full flex justify-center items-center border border-white/10 text-white/50 hover:bg-red-500/80 hover:text-white hover:border-red-500 transition-all duration-300"
                            title="Remove from watchlist"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      {show.type === 'tv' && (
                        <div className="w-full bg-white/5 h-1 mt-auto">
                          <div 
                            className="bg-accent h-full shadow-[0_0_10px_rgba(251,191,36,0.5)] transition-all duration-500" 
                            style={{ width: `${progressPercent}%` }}
                          />
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
              </AnimatePresence>
            )}

            {activeTab === 'watchlist' && activeShows.length === 0 && (
              <div className="text-center text-muted-foreground py-12 flex flex-col items-center gap-4">
                <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-2">
                  <Tv className="w-10 h-10 text-gray-600" />
                </div>
                <h3 className="text-xl font-bold text-foreground">
                  You&apos;re all caught up!
                </h3>
                <p className="text-sm">
                  Add some shows to your watchlist.
                </p>
                <Link href="/discover" className="mt-4 px-8 py-3 bg-accent text-accent-foreground rounded-full font-bold">
                  Discover Shows
                </Link>
              </div>
            )}

            {activeTab === 'watchlist' && finishedShows.length > 0 && (
              <div className="mt-8">
                <div className="flex items-center gap-4 mb-6">
                  <div className="h-px bg-white/10 flex-1" />
                  <h2 className="text-sm font-bold text-white/50 uppercase tracking-widest">Finished Shows</h2>
                  <div className="h-px bg-white/10 flex-1" />
                </div>
                <div className="flex flex-col gap-4">
                  {finishedShows.map(show => {
                    const epData = (watchedEpisodes || {})[show.id];
                    const showWatched = (Array.isArray(epData) ? epData : []).filter(e => typeof e === 'object' && e !== null) as any[];
                    const totalWatched = showWatched.length;
                    
                    return (
                      <motion.div
                        key={show.id}
                        layout
                        initial={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9, x: -100 }}
                        transition={{ duration: 0.3 }}
                        className="bg-card/20 backdrop-blur-md rounded-2xl overflow-hidden flex border border-white/5 group opacity-80 hover:opacity-100 transition-opacity"
                      >
                        <Link href={`/show/${show.id}`} className="w-20 relative flex-shrink-0 bg-zinc-900 grayscale group-hover:grayscale-0 transition-all duration-500">
                          <Image src={getImageUrl(show.poster_path)} alt={show.name} fill className="object-cover" />
                        </Link>
                        
                        <div className="flex-1 flex flex-col justify-center p-4">
                          <div className="flex justify-between items-center">
                            <Link href={`/show/${show.id}`} className="flex-1 min-w-0">
                              <h3 className="font-bold text-white text-base leading-tight truncate">{show.name}</h3>
                              <p className="text-xs text-white/50 font-medium truncate mt-1">
                                {totalWatched} Episodes • Completed
                              </p>
                            </Link>
                            <button 
                              onClick={(e) => { e.preventDefault(); removeFromWatchlist(show.id); }}
                              className="w-8 h-8 bg-white/5 rounded-full flex justify-center items-center flex-shrink-0 border border-white/10 text-white/50 hover:bg-red-500/80 hover:text-white hover:border-red-500 transition-all duration-300 ml-4"
                              title="Remove from watchlist"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Fast-Watch Up Next Deck */}
            <UpNextDeck />

            {/* Recommended For You Engine */}
            <ForYouRecommendations type="tv" />
          </>
        )}
      </div>
    </div>
  );
}
