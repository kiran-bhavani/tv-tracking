"use client";

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { X, Check, Dices, ArrowUpDown, Film, LayoutGrid, List } from 'lucide-react';
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
  const [sortMode, setSortMode] = useState<SortMode>('default');
  const [viewMode, setViewMode] = useState<'card' | 'grid'>('card');

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
    setSortMode(prev => modes[(modes.indexOf(prev) + 1) % modes.length]);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Top Header */}
      <div className="sticky top-0 z-40 bg-background/90 backdrop-blur-md pt-safe shadow-sm">
        <div className="px-4 py-2 flex justify-between items-center">
          <h1 className="text-xl font-bold text-foreground">Movies</h1>
          <div className="flex items-center gap-2">
            {/* View Mode Toggle */}
            <div className="bg-muted p-1 rounded-full border border-border flex gap-1">
              <button
                onClick={() => setViewMode('card')}
                className={`p-1.5 rounded-full transition-colors ${viewMode === 'card' ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                title="Detailed Cards View"
              >
                <List className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-full transition-colors ${viewMode === 'grid' ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                title="Compact Poster Grid View"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
            </div>

            <button
              onClick={cycleSort}
              className="flex items-center gap-1.5 bg-muted hover:bg-muted/70 text-foreground text-xs font-bold px-3 py-1.5 rounded-full transition-colors border border-border"
              title="Change sort order"
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
              {sortLabels[sortMode]}
            </button>
            <button 
              onClick={() => setShowRoulette(true)}
              className="flex items-center gap-1.5 bg-accent/15 hover:bg-accent/25 text-accent border border-accent/30 text-xs font-bold px-3 py-1.5 rounded-full transition-colors"
            >
              <Dices className="w-4 h-4" />
              <span>Roulette</span>
            </button>
          </div>
        </div>
        
        <div className="px-4 flex gap-6 border-b border-border">
          <button className="pb-2 text-xs font-bold uppercase relative text-foreground">
            Watchlist
            <motion.div layoutId="movie-tab-indicator" className="absolute bottom-0 left-0 right-0 h-1 bg-accent rounded-t-full" />
          </button>
        </div>
      </div>
      
      <div className="px-4 py-4 flex flex-col gap-4">
        {!mounted ? (
          <div className="text-center text-muted-foreground py-10">Loading...</div>
        ) : (
          <>
            {viewMode === 'grid' ? (
              /* Poster Grid View */
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                {activeMovies.map(show => (
                  <div key={show.id} className="group relative flex flex-col rounded-xl overflow-hidden bg-card border border-border shadow-md">
                    <Link href={`/movie/${show.id}`} className="aspect-[2/3] relative w-full bg-zinc-900 overflow-hidden">
                      <Image src={getImageUrl(show.poster_path)} alt={show.name} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                      
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          markMovieWatched(show.id);
                        }}
                        title="Mark as watched"
                        className="absolute top-2 right-2 w-8 h-8 rounded-full bg-accent text-accent-foreground flex items-center justify-center shadow-lg opacity-90 hover:scale-110 transition-transform"
                      >
                        <Check className="w-4 h-4 stroke-[3]" />
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
                {activeMovies.map(show => (
                <motion.div
                  key={show.id}
                  layout
                  initial={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9, x: -100 }}
                  transition={{ duration: 0.3 }}
                  className="bg-card rounded-xl overflow-hidden flex shadow-lg"
                >
                  <Link href={`/movie/${show.id}`} className="w-24 relative flex-shrink-0 bg-gray-800">
                    <Image src={getImageUrl(show.poster_path)} alt={show.name} fill className="object-cover" />
                  </Link>
                  
                  <div className="flex-1 flex flex-col">
                    <div className="p-3 flex gap-2 items-center">
                      <Link href={`/movie/${show.id}`} className="flex-1 min-w-0">
                        <h3 className="font-bold text-foreground text-base truncate">{show.name}</h3>
                        <p className="text-xs text-muted-foreground mt-1">Movie</p>
                        <p className="text-sm text-gray-200 font-medium truncate mt-0.5">Ready to watch</p>
                      </Link>

                      <div className="flex flex-col gap-2 flex-shrink-0">
                        {/* Mark Watched */}
                        <button 
                          onClick={() => markMovieWatched(show.id)}
                          title="Mark as watched"
                          className="w-10 h-10 bg-accent/15 rounded-full flex justify-center items-center border border-accent/30 text-accent hover:bg-accent hover:text-accent-foreground transition-colors"
                        >
                          <Check className="w-5 h-5" />
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
          )}

            {activeMovies.length === 0 && finishedMovies.length === 0 && (
              <div className="text-center text-muted-foreground py-16 flex flex-col items-center gap-4">
                <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-2">
                  <Film className="w-10 h-10 text-gray-600" />
                </div>
                <h3 className="text-xl font-bold text-foreground">No movies yet!</h3>
                <p className="text-sm">Add some movies to your watchlist.</p>
                <Link href="/discover?type=movie" className="mt-4 px-8 py-3 bg-accent text-accent-foreground rounded-full font-bold">
                  Discover Movies
                </Link>
              </div>
            )}

            {finishedMovies.length > 0 && (
              <div className="mt-8">
                <div className="flex items-center gap-4 mb-6">
                  <div className="h-px bg-border flex-1" />
                  <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Watched</h2>
                  <div className="h-px bg-border flex-1" />
                </div>
                <div className="flex flex-col gap-4">
                  {finishedMovies.map(show => (
                    <motion.div
                      key={show.id}
                      layout
                      className="bg-card/50 rounded-xl overflow-hidden flex border border-border group opacity-70 hover:opacity-100 transition-opacity"
                    >
                      <Link href={`/movie/${show.id}`} className="w-16 relative flex-shrink-0 bg-gray-900 grayscale group-hover:grayscale-0 transition-all duration-500">
                        <Image src={getImageUrl(show.poster_path)} alt={show.name} fill className="object-cover" />
                      </Link>
                      
                      <div className="flex-1 flex flex-col justify-center p-3">
                        <div className="flex justify-between items-center gap-2">
                          <Link href={`/movie/${show.id}`} className="flex-1 min-w-0">
                            <h3 className="font-bold text-foreground text-sm leading-tight truncate">{show.name}</h3>
                            <p className="text-[10px] text-accent font-semibold flex items-center gap-1 mt-1">
                              <Check className="w-3 h-3" /> Watched
                            </p>
                          </Link>
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            {/* Unmark watched */}
                            <button 
                              onClick={() => markMovieWatched(show.id)}
                              title="Mark as unwatched"
                              className="w-8 h-8 bg-accent/15 rounded-full flex justify-center items-center border border-accent/30 text-accent hover:bg-muted hover:text-muted-foreground hover:border-border transition-all"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            {/* Remove */}
                            <button 
                              onClick={() => removeFromWatchlist(show.id)}
                              title="Remove from watchlist"
                              className="w-8 h-8 bg-white/5 rounded-full flex justify-center items-center border border-white/10 text-white/50 hover:bg-red-500/80 hover:text-white hover:border-red-500 transition-all ml-1"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

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
