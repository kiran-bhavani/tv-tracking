"use client";

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { getCollectionDetails } from '@/lib/tmdb';
import { getImageUrl } from '@/lib/utils';
import { useStore } from '@/store/useStore';
import { Check, Film, Loader2 } from 'lucide-react';

interface MovieCollectionCardProps {
  collectionId: number;
  currentMovieId: number;
}

export default function MovieCollectionCard({ collectionId, currentMovieId }: MovieCollectionCardProps) {
  const [collection, setCollection] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const watchlist = useStore((state) => state.watchlist);
  const watchedEpisodes = useStore((state) => state.watchedEpisodes);

  useEffect(() => {
    let isMounted = true;
    getCollectionDetails(collectionId)
      .then((data) => {
        if (isMounted && data) {
          // Sort parts by release_date
          if (data.parts) {
            data.parts.sort((a: any, b: any) => {
              if (!a.release_date) return 1;
              if (!b.release_date) return -1;
              return new Date(a.release_date).getTime() - new Date(b.release_date).getTime();
            });
          }
          setCollection(data);
        }
      })
      .catch((err) => console.error("Failed to load collection", err))
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [collectionId]);

  if (loading) {
    return (
      <div className="px-4 mt-8">
        <div className="bg-muted/40 border border-border/50 rounded-2xl p-6 flex justify-center items-center">
          <Loader2 className="w-6 h-6 animate-spin text-accent" />
        </div>
      </div>
    );
  }

  if (!collection || !collection.parts || collection.parts.length === 0) return null;

  const parts = collection.parts;
  const totalCount = parts.length;

  // Calculate watched count
  const watchedCount = parts.filter((part: any) => {
    const watched = watchedEpisodes[part.id] || [];
    return watched.length > 0;
  }).length;

  const percent = Math.round((watchedCount / totalCount) * 100);
  const backdropUrl = getImageUrl(collection.backdrop_path, 'w780');

  return (
    <div className="px-4 mt-8">
      <div className="relative rounded-2xl overflow-hidden border border-border bg-card shadow-xl">
        {/* Banner Backdrop */}
        {collection.backdrop_path && (
          <div className="relative h-32 w-full">
            <Image
              src={backdropUrl}
              alt={collection.name}
              fill
              className="object-cover opacity-30"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-card via-card/70 to-transparent" />
          </div>
        )}

        <div className={`p-5 ${collection.backdrop_path ? '-mt-16 relative z-10' : ''}`}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Film className="w-5 h-5 text-accent" />
              <h3 className="font-bold text-foreground text-lg">{collection.name}</h3>
            </div>
            <span className="text-xs font-black text-accent bg-accent/10 px-2.5 py-1 rounded-full border border-accent/20">
              {watchedCount} / {totalCount} Watched
            </span>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-2 bg-muted rounded-full overflow-hidden mb-4 border border-border/50">
            <div 
              className="h-full bg-accent transition-all duration-500 rounded-full" 
              style={{ width: `${percent}%` }}
            />
          </div>

          {/* Saga Movies List */}
          <div className="flex overflow-x-auto gap-3 pb-2 snap-x hide-scrollbar">
            {parts.map((movie: any) => {
              const isCurrent = movie.id === currentMovieId;
              const isWatched = (watchedEpisodes[movie.id] || []).length > 0;
              const poster = getImageUrl(movie.poster_path, 'w185');

              return (
                <Link
                  key={movie.id}
                  href={`/movie/${movie.id}`}
                  className={`flex-shrink-0 w-24 snap-start group relative transition-transform hover:scale-105 ${
                    isCurrent ? 'ring-2 ring-accent rounded-xl' : ''
                  }`}
                >
                  <div className="w-24 h-36 relative rounded-xl overflow-hidden bg-muted border border-border shadow-md">
                    {movie.poster_path ? (
                      <Image src={poster} alt={movie.title} fill className="object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground p-2 text-center">
                        {movie.title}
                      </div>
                    )}

                    {/* Watched Badge */}
                    {isWatched && (
                      <div className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-accent text-accent-foreground flex items-center justify-center shadow-lg border border-accent-foreground/20">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                    )}
                  </div>

                  <p className="text-[11px] font-bold text-foreground text-center truncate mt-1.5 group-hover:text-accent transition-colors">
                    {movie.title}
                  </p>
                  <p className="text-[10px] text-muted-foreground text-center">
                    {movie.release_date ? movie.release_date.split('-')[0] : ''}
                  </p>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
