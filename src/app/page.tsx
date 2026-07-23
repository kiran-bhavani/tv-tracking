"use client";

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Check, MoreVertical } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '@/store/useStore';
import ForYouRecommendations from '@/components/ForYouRecommendations';
import UpcomingTab from '@/components/UpcomingTab';

const getImageUrl = (path: string | null, size: string = 'w500') => 
  path ? `https://image.tmdb.org/t/p/${size}${path}` : '/placeholder.png';

export default function WatchlistPage() {
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<'watchlist' | 'upcoming'>('watchlist');
  const watchlistMap = useStore((state) => state.watchlist);
  const watchedEpisodes = useStore((state) => state.watchedEpisodes);
  const removeFromWatchlist = useStore((state) => state.removeFromWatchlist);

  useEffect(() => {
    setMounted(true);
  }, []);

  const allTvShows = Object.values(watchlistMap || {}).filter(show => show?.type === 'tv');

  const activeShows = allTvShows.filter(show => {
    const epData = (watchedEpisodes || {})[show.id];
    const showWatched = (Array.isArray(epData) ? epData : []).filter(e => typeof e === 'object' && e !== null) as any[];
    return !(show.number_of_episodes && show.number_of_episodes > 0 && showWatched.length >= show.number_of_episodes);
  });

  const finishedShows = allTvShows.filter(show => {
    const epData = (watchedEpisodes || {})[show.id];
    const showWatched = (Array.isArray(epData) ? epData : []).filter(e => typeof e === 'object' && e !== null) as any[];
    return (show.number_of_episodes && show.number_of_episodes > 0 && showWatched.length >= show.number_of_episodes);
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Top Header */}
      <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl pt-safe shadow-sm border-b border-white/5">
        <div className="px-6 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-black tracking-tight text-white">TV Time</h1>
          <button className="text-white/70 hover:text-white transition-colors">
            <MoreVertical className="w-6 h-6" />
          </button>
        </div>
        
        {/* Tabs */}
        <div className="px-6 flex gap-8">
          {(['watchlist', 'upcoming'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 text-[11px] tracking-wider font-bold uppercase relative transition-colors ${activeTab === tab ? 'text-white' : 'text-white/40 hover:text-white/70'}`}
            >
              {tab}
              {activeTab === tab && (
                <motion.div layoutId="tab-indicator" className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent rounded-t-full shadow-[0_0_8px_rgba(251,191,36,0.6)]" />
              )}
            </button>
          ))}
        </div>
      </div>
      
      <div className="px-4 py-4 flex flex-col gap-4">
        {!mounted ? (
          <div className="text-center text-muted-foreground py-10">Loading...</div>
        ) : (
          <>
            {activeTab === 'upcoming' ? (
              <UpcomingTab showIds={allTvShows.map(s => s.id)} />
            ) : (
              <AnimatePresence>
                {activeShows.map(show => {
                const epData = (watchedEpisodes || {})[show.id];
                const showWatched = (Array.isArray(epData) ? epData : []).filter(e => typeof e === 'object' && e !== null) as any[];
                const totalWatched = showWatched.length;
                const totalEpisodes = show.number_of_episodes || 0;
                const progressPercent = totalEpisodes > 0 ? Math.min(100, Math.round((totalWatched / totalEpisodes) * 100)) : 0;
                
                let nextEpisodeStr = '';
                if (totalWatched > 0) {
                  // Sort by season then episode
                  const sorted = [...showWatched].sort((a, b) => {
                    if (a.season !== b.season) return a.season - b.season;
                    return a.episode - b.episode;
                  });
                  const last = sorted[sorted.length - 1];
                  nextEpisodeStr = `Up Next: S${String(last.season).padStart(2, '0')}E${String(last.episode + 1).padStart(2, '0')}`;
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

                        <button 
                          onClick={(e) => { e.preventDefault(); removeFromWatchlist(show.id); }}
                          className="w-10 h-10 bg-white/5 rounded-full flex justify-center items-center flex-shrink-0 border border-white/10 text-white/50 hover:bg-accent hover:text-accent-foreground hover:border-accent transition-all duration-300 self-center"
                        >
                          <Check className="w-5 h-5" />
                        </button>
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
                  <Check className="w-10 h-10 text-gray-600" />
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
                              className="w-8 h-8 bg-white/5 rounded-full flex justify-center items-center flex-shrink-0 border border-white/10 text-white/50 hover:bg-accent hover:text-accent-foreground hover:border-accent transition-all duration-300 ml-4"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            )}

            <ForYouRecommendations type="tv" />
          </>
        )}
      </div>
    </div>
  );
}
