"use client";

import { useState, useEffect, useCallback } from 'react';
import { useInView } from 'react-intersection-observer';
import { getDiscoverByGenre } from '@/lib/tmdb';
import ShowCard from '@/components/ShowCard';
import { Loader2, Star, TrendingUp } from 'lucide-react';
import { cacheManager } from '@/lib/cache';

interface Genre {
  id: number;
  name: string;
}

interface InfiniteDiscoverRowsProps {
  type: 'tv' | 'movie';
  genres: Genre[];
}

interface RowData {
  genre: Genre;
  results: any[];
}

export default function InfiniteDiscoverRows({ type, genres }: InfiniteDiscoverRowsProps) {
  const [rows, setRows] = useState<RowData[]>([]);
  const [genreIndex, setGenreIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [minRating, setMinRating] = useState<number>(0);
  const [sortBy, setSortBy] = useState<string>('popularity.desc');

  const { ref, inView } = useInView({
    threshold: 0,
    rootMargin: '400px', // Load well in advance
  });

  useEffect(() => {
    // Reset state if type or filters change
    setRows([]);
    setGenreIndex(0);
  }, [type, minRating, sortBy]);

  const loadNextRow = useCallback(async () => {
    if (genreIndex >= genres.length || loading) return;
    setLoading(true);
    const genre = genres[genreIndex];
    try {
      const cacheKey = `discover_${type}_${genre.id}_1_${minRating}_${sortBy}`;
      const cached = cacheManager.get<any>(cacheKey);
      
      let data;
      if (cached) {
        data = cached;
      } else {
        data = await getDiscoverByGenre(type, genre.id, 1, minRating, sortBy);
        cacheManager.set(cacheKey, data);
      }
      
      setRows(prev => [...prev, { genre, results: data.results || [] }]);
      setGenreIndex(prev => prev + 1);
    } catch (err) {
      console.error('Failed to load row', err);
    } finally {
      setLoading(false);
    }
  }, [genreIndex, genres, type, minRating, sortBy, loading]);

  useEffect(() => {
    if (inView && genreIndex < genres.length && !loading) {
      loadNextRow();
    }
  }, [inView, genreIndex, loading, genres, type, loadNextRow]);

  return (
    <div className="flex flex-col gap-6">
      {/* Advanced Filter Chips Bar */}
      <div className="px-4 flex flex-wrap gap-3 items-center justify-between bg-card/40 py-3 border-y border-border/50">
        <div className="flex items-center gap-1.5 overflow-x-auto hide-scrollbar">
          <span className="text-[10px] font-black uppercase text-muted-foreground tracking-wider mr-1">Rating:</span>
          {[
            { val: 0, label: 'All' },
            { val: 7.5, label: '⭐ > 7.5' },
            { val: 8.0, label: '⭐ > 8.0' },
          ].map((r) => (
            <button
              key={r.val}
              onClick={() => setMinRating(r.val)}
              className={`text-xs font-bold px-3 py-1 rounded-full border transition-colors ${
                minRating === r.val
                  ? 'bg-accent text-accent-foreground border-accent'
                  : 'bg-muted/50 border-border text-muted-foreground hover:text-foreground'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto hide-scrollbar">
          <span className="text-[10px] font-black uppercase text-muted-foreground tracking-wider mr-1">Sort:</span>
          {[
            { val: 'popularity.desc', label: 'Popular' },
            { val: 'vote_average.desc', label: 'Top Rated' },
          ].map((s) => (
            <button
              key={s.val}
              onClick={() => setSortBy(s.val)}
              className={`text-xs font-bold px-3 py-1 rounded-full border transition-colors ${
                sortBy === s.val
                  ? 'bg-accent text-accent-foreground border-accent'
                  : 'bg-muted/50 border-border text-muted-foreground hover:text-foreground'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Rows */}
      <div className="flex flex-col gap-8 pb-8">
        {rows.map((row) => (
          row.results.length > 0 && (
            <section key={row.genre.id} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="px-4 mb-3 flex justify-between items-end">
                <h2 className="text-xl font-bold text-foreground tracking-tight">
                  {row.genre.name} {type === 'movie' ? 'Movies' : 'Shows'}
                </h2>
              </div>
              <div className="flex overflow-x-auto gap-4 px-4 pb-4 snap-x snap-mandatory hide-scrollbar">
                {row.results.map((item: any) => (
                  <ShowCard key={item.id} show={{...item, media_type: type}} />
                ))}
              </div>
            </section>
          )
        ))}

        {genreIndex < genres.length && (
          <div ref={ref} className="py-12 flex justify-center items-center">
            {loading && <Loader2 className="w-8 h-8 animate-spin text-accent" />}
          </div>
        )}

        {genreIndex >= genres.length && rows.length > 0 && (
          <div className="py-12 flex justify-center items-center text-muted-foreground text-sm font-medium">
            You&apos;ve reached the end of the line!
          </div>
        )}
      </div>
    </div>
  );
}
