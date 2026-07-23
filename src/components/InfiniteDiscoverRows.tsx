"use client";

import { useState, useEffect, useCallback } from 'react';
import { useInView } from 'react-intersection-observer';
import { getDiscoverByGenre } from '@/lib/tmdb';
import ShowCard from '@/components/ShowCard';
import { Loader2 } from 'lucide-react';
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
  const { ref, inView } = useInView({
    threshold: 0,
    rootMargin: '400px', // Load well in advance
  });

  useEffect(() => {
    // Reset state if type changes
    setRows([]);
    setGenreIndex(0);
  }, [type]);

  const loadNextRow = useCallback(async () => {
    setLoading(true);
    const genre = genres[genreIndex];
    try {
      const cacheKey = `discover_${type}_${genre.id}_1`;
      const cached = cacheManager.get<any>(cacheKey);
      
      let data;
      if (cached) {
        data = cached;
      } else {
        data = await getDiscoverByGenre(type, genre.id, 1);
        cacheManager.set(cacheKey, data);
      }
      
      setRows(prev => [...prev, { genre, results: data.results || [] }]);
      setGenreIndex(prev => prev + 1);
    } catch (err) {
      console.error('Failed to load row', err);
    } finally {
      setLoading(false);
    }
  }, [genreIndex, genres, type]);

  useEffect(() => {
    if (inView && genreIndex < genres.length && !loading) {
      loadNextRow();
    }
  }, [inView, genreIndex, loading, genres, type, loadNextRow]);

  return (
    <div className="flex flex-col gap-10 pb-8 mt-8">
      {rows.map((row) => (
        row.results.length > 0 && (
          <section key={row.genre.id} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="px-6 mb-4 flex justify-between items-end">
              <h2 className="text-xl font-bold text-white tracking-tight">
                {row.genre.name} {type === 'movie' ? 'Movies' : 'Shows'}
              </h2>
            </div>
            <div className="flex overflow-x-auto gap-4 px-6 pb-4 snap-x snap-mandatory hide-scrollbar">
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
        <div className="py-12 flex justify-center items-center text-white/40 text-sm font-medium">
          You&apos;ve reached the end of the line!
        </div>
      )}
    </div>
  );
}
