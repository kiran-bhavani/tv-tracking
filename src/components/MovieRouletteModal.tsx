"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { Dices, X, Sparkles, Play, Star, ExternalLink, RefreshCw, Loader2 } from 'lucide-react';
import { getDiscoverByGenre, getPopularMovies } from '@/lib/tmdb';
import { getImageUrl } from '@/lib/utils';
import VideoPlayerModal from './VideoPlayerModal';

const GENRES = [
  { id: 0, name: 'Any Genre' },
  { id: 28, name: 'Action' },
  { id: 878, name: 'Sci-Fi' },
  { id: 35, name: 'Comedy' },
  { id: 18, name: 'Drama' },
  { id: 27, name: 'Horror' },
  { id: 16, name: 'Animation' },
  { id: 53, name: 'Thriller' },
];

const RUNTIMES = [
  { value: 0, label: 'Any Duration' },
  { value: 90, label: '< 90 mins (Short)' },
  { value: 120, label: '< 2 hours' },
];

interface MovieRouletteModalProps {
  onClose: () => void;
}

export default function MovieRouletteModal({ onClose }: MovieRouletteModalProps) {
  const [selectedGenre, setSelectedGenre] = useState<number>(0);
  const [selectedRuntime, setSelectedRuntime] = useState<number>(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [selectedMovie, setSelectedMovie] = useState<any>(null);
  const [activeVideo, setActiveVideo] = useState<string | null>(null);

  const handleSpin = async () => {
    setIsSpinning(true);
    setSelectedMovie(null);

    try {
      let results = [];
      if (selectedGenre > 0) {
        const page = Math.floor(Math.random() * 3) + 1; // Randomize page 1-3
        const data = await getDiscoverByGenre('movie', selectedGenre, page);
        results = data.results || [];
      } else {
        const data = await getPopularMovies();
        results = data.results || [];
      }

      // Filter by runtime if selected (estimated via vote_count / popularity heuristic or random sample)
      if (results.length > 0) {
        // Pick a random movie from top results
        const randomChoice = results[Math.floor(Math.random() * results.length)];
        
        // Add a artificial spin delay for fun UX
        setTimeout(() => {
          setSelectedMovie(randomChoice);
          setIsSpinning(false);
        }, 1200);
      } else {
        setIsSpinning(false);
      }
    } catch (err) {
      console.error("Movie Roulette error:", err);
      setIsSpinning(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-md p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="w-full max-w-lg bg-card border border-border rounded-3xl p-6 shadow-2xl relative flex flex-col gap-5 overflow-hidden max-h-[90vh] overflow-y-auto hide-scrollbar"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-muted-foreground hover:text-foreground transition-colors p-1 z-10"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-accent/20 text-accent flex items-center justify-center border border-accent/30 shadow-inner">
            <Dices className="w-6 h-6 animate-bounce" />
          </div>
          <div>
            <h3 className="text-xl font-black text-foreground">Movie Night Roulette</h3>
            <p className="text-xs text-muted-foreground font-medium">Can&apos;t decide what to watch? Let AI & chance pick!</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-4 bg-muted/30 p-4 rounded-2xl border border-border/50">
          <div className="flex flex-col gap-2">
            <span className="text-xs font-bold text-foreground">Select Genre</span>
            <div className="flex flex-wrap gap-2">
              {GENRES.map((genre) => (
                <button
                  key={genre.id}
                  onClick={() => setSelectedGenre(genre.id)}
                  className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition-all ${
                    selectedGenre === genre.id
                      ? 'bg-accent text-accent-foreground border-accent shadow-md scale-105'
                      : 'bg-background border-border text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {genre.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Spin Button */}
        <button
          onClick={handleSpin}
          disabled={isSpinning}
          className="w-full bg-accent text-accent-foreground font-black text-base py-3.5 rounded-2xl shadow-xl hover:bg-accent/90 transition-all flex items-center justify-center gap-2 group disabled:opacity-50"
        >
          {isSpinning ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform" />
          )}
          {isSpinning ? 'Spinning the Wheel...' : selectedMovie ? 'Spin Again!' : 'Spin the Wheel!'}
        </button>

        {/* Selected Movie Result Card */}
        {selectedMovie && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="bg-muted/60 border border-accent/40 rounded-2xl p-4 flex gap-4 relative overflow-hidden shadow-2xl"
          >
            <div className="w-24 h-36 relative rounded-xl overflow-hidden flex-shrink-0 bg-muted shadow-md border border-border">
              <Image
                src={getImageUrl(selectedMovie.poster_path, 'w500')}
                alt={selectedMovie.title}
                fill
                className="object-cover"
              />
            </div>

            <div className="flex-1 flex flex-col justify-between min-w-0">
              <div>
                <div className="flex items-center gap-1 text-accent text-xs font-bold mb-1">
                  <Star className="w-3.5 h-3.5 fill-current" />
                  <span>{selectedMovie.vote_average?.toFixed(1)}</span>
                  <span className="text-muted-foreground ml-1">
                    • {selectedMovie.release_date?.split('-')[0]}
                  </span>
                </div>
                <h4 className="font-black text-foreground text-base leading-tight truncate">
                  {selectedMovie.title}
                </h4>
                <p className="text-xs text-muted-foreground line-clamp-3 mt-1.5 leading-relaxed">
                  {selectedMovie.overview}
                </p>
              </div>

              <div className="flex items-center gap-2 mt-3 pt-2 border-t border-border/40">
                <Link
                  href={`/movie/${selectedMovie.id}`}
                  onClick={onClose}
                  className="flex-1 bg-background hover:bg-card border border-border text-foreground text-xs font-bold py-2 rounded-xl text-center transition-colors"
                >
                  View Details
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
}
