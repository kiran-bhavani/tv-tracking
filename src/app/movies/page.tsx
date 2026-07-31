"use client";

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { X, Check, Dices, ArrowUpDown, Film, LayoutGrid, List, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '@/store/useStore';
import ForYouRecommendations from '@/components/ForYouRecommendations';
import MovieRouletteModal from '@/components/MovieRouletteModal';

const getImageUrl = (path: string | null, size: string = 'w500') => 
  path ? `https://image.tmdb.org/t/p/${size}${path}` : '/placeholder.png';

type SortMode = 'default' | 'alpha' | 'unwatched_first';

export default function MoviesWatchlistPage() {
  const [mounted, setMounted] = useState(() => typeof window !== 'undefined');
  const [showRoulette, setShowRoulette] = useState(false);
  const activeTab = useStore((state) => state.moviesActiveTab || 'watchlist');
  const setActiveTab = useStore((state) => state.setMoviesActiveTab);
  const sortMode = useStore((state) => state.moviesSortMode || 'default');
  const setMoviesSortMode = useStore((state) => state.setMoviesSortMode);
  const viewMode = useStore((state) => state.viewMode || 'card');
  const setViewMode = useStore((state) => state.setViewMode);

  const watchlistMap = useStore((state) => state.watchlist);
  const watchedEpisodes = useStore((state) => state.watchedEpisodes);
  const removeFromWatchlist = useStore((state) => state.removeFromWatchlist);
  const markMovieWatched = useStore((state) => state.markMovieWatched);

  useEffect(() => { setMounted(true); }, []);

  const allMovies = Object.values(watchlistMap || {}).filter(show => show?.type === 'movie');

  const isMovieWatched = (id: number) => {
    const epData = (watchedEpisodes || {})[id];
    return (Array.isArray(epData) ? epData : []).filter(e => typeof e === 'object' && e !== null).length > 0;
  };

  const sortFn = (a: typeof allMovies[0], b: typeof allMovies[0]): number => {
    if (sortMode === 'alpha') return a.name.localeCompare(b.name);
    if (sortMode === 'unwatched_first') {
      const aW = isMovieWatched(a.id) ? 1 : 0;
      const bW = isMovieWatched(b.id) ? 1 : 0;
      return aW - bW || a.name.localeCompare(b.name);
    }
    return 0;
  };

  const sortedMovies = [...allMovies].sort(sortFn);
  const activeMovies = sortedMovies.filter(m => !isMovieWatched(m.id));
  const finishedMovies = sortedMovies.filter(m => isMovieWatched(m.id));

  const sortLabels: Record<SortMode, string> = {
    default: 'Added',
    alpha: 'A–Z',
    unwatched_first: 'Unwatched',
  };

  const cycleSort = () => {
    const modes: SortMode[] = ['default', 'alpha', 'unwatched_first'];
    const currentIndex = modes.indexOf(sortMode as SortMode);
    const nextMode = modes[(currentIndex + 1) % modes.length];
    setMoviesSortMode(nextMode);
  };

  return (
    <div className="min-h-screen bg-background pb-32">
      {/* Top Header */}
      <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl pt-safe shadow-sm border-b border-white/5">
        <div className="px-5 py-3.5 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black tracking-tight text-white">Movies</h1>
            {mounted && (
              <span className="text-[10px] font-black uppercase tracking-wider bg-accent/15 text-accent px-2 py-0.5 rounded-full border border-accent/30">
                {activeMovies.length} Active
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
        
        {/* iOS Segmented Pill Control for Watchlist vs Watched */}
        <div className="px-4 pb-3 flex justify-center items-center gap-2.5">
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
                  layoutId="movies-tab-pill"
                  className="absolute inset-0 bg-accent rounded-full shadow-md -z-10"
                  transition={{ type: "spring", stiffness: 400, damping: 28 }}
                />
              )}
            </button>
            <button
              onClick={() => setActiveTab('watched')}
              className={`flex-1 py-1.5 rounded-full text-xs font-black tracking-wide transition-colors relative z-10 text-center ${
                activeTab === 'watched' ? 'text-accent-foreground' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Watched ({finishedMovies.length})
              {activeTab === 'watched' && (
                <motion.div
                  layoutId="movies-tab-pill"
                  className="absolute inset-0 bg-accent rounded-full shadow-md -z-10"
                  transition={{ type: "spring", stiffness: 400, damping: 28 }}
                />
              )}
            </button>
          </div>

          {/* Premium Roulette Action Button */}
          <button
            onClick={() => setShowRoulette(true)}
            className="w-9 h-9 rounded-full bg-accent/20 border border-accent/40 text-accent flex items-center justify-center transition-all active:scale-95 shadow-sm shadow-accent/10 hover:bg-accent hover:text-black flex-shrink-0"
            title="Spin Movie Roulette"
            aria-label="Spin Movie Roulette"
          >
            <Dices className="w-4.5 h-4.5" />
          </button>
        </div>
      </div>
      
      <div className="px-4 py-4 flex flex-col gap-4">
        {!mounted ? (
          <div className="text-center text-muted-foreground py-10">Loading...</div>
        ) : (
          <>
            {(() => {
              const currentList = activeTab === 'watchlist' ? activeMovies : finishedMovies;
              if (currentList.length === 0) {
                return (
                  <div className="ios-glass rounded-3xl p-8 my-6 text-center flex flex-col items-center gap-3 border border-white/10 shadow-2xl">
                    <div className="w-16 h-16 rounded-full bg-accent/15 border border-accent/30 flex items-center justify-center text-accent mb-1 shadow-lg shadow-accent/10">
                      <Film className="w-8 h-8" />
                    </div>
                    <h3 className="text-xl font-black text-white">
                      {activeTab === 'watchlist' ? 'No Active Movies!' : 'No Watched Movies Yet!'}
                    </h3>
                    <p className="text-sm text-zinc-400 max-w-xs leading-relaxed">
                      {activeTab === 'watchlist'
                        ? 'Start building your movie watchlist to keep track of films you want to watch.'
                        : 'Mark movies as watched to save them in your completed history.'}
                    </p>
                    <Link href="/discover?type=movie" className="mt-3 px-6 py-3 bg-accent text-accent-foreground rounded-full font-black text-sm transition-all shadow-lg shadow-accent/20 hover:bg-accent/90 active:scale-95">
                      + Discover Movies
                    </Link>
                  </div>
                );
              }

              return viewMode === 'grid' ? (
                /* Poster Grid View */
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                  {currentList.map(show => (
                    <div key={show.id} className="group relative flex flex-col rounded-xl overflow-hidden bg-card border border-border shadow-md">
                      <Link href={`/movie/${show.id}`} className="aspect-[2/3] relative w-full bg-muted overflow-hidden">
                        <Image src={getImageUrl(show.poster_path)} alt={show.name} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                        
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            markMovieWatched(show.id);
                          }}
                          title={isMovieWatched(show.id) ? "Mark as unwatched" : "Mark movie as watched"}
                          className={`absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center shadow-lg transition-all ${
                            isMovieWatched(show.id)
                              ? 'bg-accent/20 border border-accent/40 text-accent hover:bg-accent hover:text-black'
                              : 'bg-emerald-500 text-black shadow-emerald-500/30 opacity-95 hover:scale-110 active:scale-95'
                          }`}
                        >
                          {isMovieWatched(show.id) ? <Check className="w-4 h-4" /> : <Plus className="w-4.5 h-4.5 stroke-[3]" />}
                        </button>
                      </Link>

                      <div className="p-2 flex flex-col justify-between flex-1">
                        <Link href={`/movie/${show.id}`} className="font-bold text-foreground text-xs leading-tight line-clamp-1 group-hover:text-accent transition-colors">
                          {show.name}
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                /* Detailed Cards View */
                <AnimatePresence>
                  {currentList.map(show => (
                    <motion.div
                      key={show.id}
                      layout
                      initial={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9, x: -100 }}
                      transition={{ duration: 0.3 }}
                      className="bg-card/40 backdrop-blur-md rounded-2xl overflow-hidden flex shadow-xl border border-white/5 group"
                    >
                      <Link href={`/movie/${show.id}`} className="w-28 relative flex-shrink-0 bg-muted">
                        <Image src={getImageUrl(show.poster_path)} alt={show.name} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                      </Link>
                      
                      <div className="flex-1 flex flex-col min-w-0">
                        <div className="p-4 flex gap-3 h-full">
                          <Link href={`/movie/${show.id}`} className="flex-1 min-w-0 flex flex-col justify-center">
                            <h3 className="font-bold text-white text-base leading-tight truncate group-hover:text-accent transition-colors">{show.name}</h3>
                            <p className="text-[11px] tracking-wide uppercase text-accent font-semibold mt-1.5">Movie</p>
                            <p className="text-xs text-white/50 font-medium truncate mt-0.5">
                              {isMovieWatched(show.id) ? '✓ Completed' : 'Ready to watch'}
                            </p>
                          </Link>

                          <div className="flex flex-col gap-2 flex-shrink-0 self-center">
                            {/* Mark Watched Toggle */}
                            <button 
                              onClick={() => markMovieWatched(show.id)}
                              title={isMovieWatched(show.id) ? "Mark as unwatched" : "Mark movie as watched"}
                              className={`w-10 h-10 rounded-full flex justify-center items-center border transition-all active:scale-95 shadow-sm ${
                                isMovieWatched(show.id)
                                  ? 'bg-accent/15 border-accent/30 text-accent hover:bg-white/10 hover:text-white'
                                  : 'bg-muted border-border text-foreground hover:bg-emerald-500/20 hover:border-emerald-500/50 hover:text-emerald-400'
                              }`}
                            >
                              {isMovieWatched(show.id) ? <Check className="w-5 h-5 stroke-[2.5]" /> : <Plus className="w-5 h-5 stroke-[2.5]" />}
                            </button>
                            {/* Remove from watchlist */}
                            <button 
                              onClick={() => removeFromWatchlist(show.id)}
                              title="Remove from watchlist"
                              className="w-10 h-10 bg-white/5 rounded-full flex justify-center items-center border border-white/10 text-white/50 hover:bg-red-500/80 hover:text-white hover:border-red-500 transition-all"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              );
            })()}
            <ForYouRecommendations type="movie" />
          </>
        )}
      </div>
      <AnimatePresence>
        {showRoulette && (
          <MovieRouletteModal onClose={() => setShowRoulette(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}
