"use client";

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Check, MoreVertical, Dices } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '@/store/useStore';
import ForYouRecommendations from '@/components/ForYouRecommendations';
import MovieRouletteModal from '@/components/MovieRouletteModal';

const getImageUrl = (path: string | null, size: string = 'w500') => 
  path ? `https://image.tmdb.org/t/p/${size}${path}` : '/placeholder.png';

export default function MoviesWatchlistPage() {
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<'watchlist'>('watchlist');
  const [showRoulette, setShowRoulette] = useState(false);
  const watchlistMap = useStore((state) => state.watchlist);
  const watchedEpisodes = useStore((state) => state.watchedEpisodes);
  const removeFromWatchlist = useStore((state) => state.removeFromWatchlist);

  useEffect(() => {
    setMounted(true);
  }, []);

  const allMovies = Object.values(watchlistMap || {}).filter(show => show?.type === 'movie');

  const activeMovies = allMovies.filter(show => {
    const epData = (watchedEpisodes || {})[show.id];
    const showWatched = (Array.isArray(epData) ? epData : []).filter(e => typeof e === 'object' && e !== null) as any[];
    return showWatched.length === 0;
  });

  const finishedMovies = allMovies.filter(show => {
    const epData = (watchedEpisodes || {})[show.id];
    const showWatched = (Array.isArray(epData) ? epData : []).filter(e => typeof e === 'object' && e !== null) as any[];
    return showWatched.length > 0;
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Top Header */}
      <div className="sticky top-0 z-40 bg-background/90 backdrop-blur-md pt-safe shadow-sm">
        <div className="px-4 py-2 flex justify-between items-center">
          <h1 className="text-xl font-bold text-foreground">Movies</h1>
          <button 
            onClick={() => setShowRoulette(true)}
            className="flex items-center gap-1.5 bg-accent/15 hover:bg-accent/25 text-accent border border-accent/30 text-xs font-bold px-3 py-1.5 rounded-full transition-colors"
          >
            <Dices className="w-4 h-4" />
            <span>Roulette</span>
          </button>
        </div>
        
        {/* Tabs */}
        <div className="px-4 flex gap-6 border-b border-border">
          <button
            className="pb-2 text-xs font-bold uppercase relative text-foreground"
          >
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
            <AnimatePresence>
              {activeMovies.map(show => {
                const epData = (watchedEpisodes || {})[show.id];
                const showWatched = (Array.isArray(epData) ? epData : []).filter(e => typeof e === 'object' && e !== null) as any[];
                const totalWatched = showWatched.length;
                const totalEpisodes = show.number_of_episodes || 0;
                const progressPercent = totalEpisodes > 0 ? Math.min(100, Math.round((totalWatched / totalEpisodes) * 100)) : 0;
                
                return (
                  <motion.div
                    key={show.id}
                    layout
                    initial={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9, x: -100 }}
                    transition={{ duration: 0.3 }}
                    className="bg-card rounded-xl overflow-hidden flex shadow-lg"
                  >
                    {/* Poster */}
                    <Link href={`/movie/${show.id}`} className="w-24 relative flex-shrink-0 bg-gray-800">
                      <Image src={getImageUrl(show.poster_path)} alt={show.name} fill className="object-cover" />
                    </Link>
                    
                    {/* Content */}
                    <div className="flex-1 flex flex-col">
                      <div className="p-3 flex gap-2">
                        <Link href={`/movie/${show.id}`} className="flex-1 min-w-0">
                          <h3 className="font-bold text-foreground text-base truncate">{show.name}</h3>
                          <p className="text-xs text-muted-foreground mt-1">
                            Movie
                          </p>
                          <p className="text-sm text-gray-200 font-medium truncate mt-0.5">
                            {totalWatched > 0 ? 'Watched' : 'Ready to watch'}
                          </p>
                        </Link>

                        <button 
                          onClick={() => removeFromWatchlist(show.id)}
                          className="w-12 h-12 bg-muted rounded-full flex justify-center items-center flex-shrink-0 border border-border text-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                        >
                          <Check className="w-6 h-6" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {activeMovies.length === 0 && (
              <div className="text-center text-muted-foreground py-16 flex flex-col items-center gap-4">
                <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-2">
                  <Check className="w-10 h-10 text-gray-600" />
                </div>
                <h3 className="text-xl font-bold text-foreground">
                  No movies here!
                </h3>
                <p className="text-sm">
                  Add some movies to your watchlist.
                </p>
                <Link href="/discover?type=movie" className="mt-4 px-8 py-3 bg-accent text-accent-foreground rounded-full font-bold">
                  Discover Movies
                </Link>
              </div>
            )}

            {finishedMovies.length > 0 && (
              <div className="mt-8">
                <div className="flex items-center gap-4 mb-6">
                  <div className="h-px bg-border flex-1" />
                  <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Finished Movies</h2>
                  <div className="h-px bg-border flex-1" />
                </div>
                <div className="flex flex-col gap-4">
                  {finishedMovies.map(show => (
                    <motion.div
                      key={show.id}
                      layout
                      initial={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9, x: -100 }}
                      transition={{ duration: 0.3 }}
                      className="bg-card/50 rounded-xl overflow-hidden flex border border-border group opacity-70 hover:opacity-100 transition-opacity"
                    >
                      <Link href={`/movie/${show.id}`} className="w-16 relative flex-shrink-0 bg-gray-900 grayscale group-hover:grayscale-0 transition-all duration-500">
                        <Image src={getImageUrl(show.poster_path)} alt={show.name} fill className="object-cover" />
                      </Link>
                      
                      <div className="flex-1 flex flex-col justify-center p-3">
                        <div className="flex justify-between items-center">
                          <Link href={`/movie/${show.id}`} className="flex-1 min-w-0">
                            <h3 className="font-bold text-foreground text-sm leading-tight truncate">{show.name}</h3>
                            <p className="text-[10px] text-muted-foreground font-medium truncate mt-1">
                              Watched
                            </p>
                          </Link>
                          <button 
                            onClick={() => removeFromWatchlist(show.id)}
                            className="w-8 h-8 bg-muted rounded-full flex justify-center items-center flex-shrink-0 border border-border text-muted-foreground hover:bg-accent hover:text-accent-foreground hover:border-accent transition-all duration-300 ml-3"
                          >
                            <Check className="w-4 h-4" />
                          </button>
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
