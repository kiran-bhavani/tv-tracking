"use client";

import { useState, useEffect, useRef } from 'react';
import { Search as SearchIcon, X, User, Film, Tv } from 'lucide-react';
import { searchMulti } from '@/lib/tmdb';
import { useDebounce } from '@/hooks/useDebounce';
import Image from 'next/image';
import Link from 'next/link';
import { getImageUrl } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

export default function SearchAutoCompleteModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const debouncedQuery = useDebounce(query, 350);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setQuery('');
      setResults([]);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setResults([]);
      return;
    }

    async function fetchResults() {
      setIsSearching(true);
      try {
        const data = await searchMulti(debouncedQuery);
        setResults((data.results || []).slice(0, 6));
      } catch (err) {
        console.error("Auto-complete search failed", err);
      } finally {
        setIsSearching(false);
      }
    }

    fetchResults();
  }, [debouncedQuery]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md p-4 pt-safe flex flex-col items-center"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -20, opacity: 0 }}
          className="w-full max-w-lg bg-card border border-border rounded-3xl p-4 shadow-2xl flex flex-col gap-4 relative"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Input Bar */}
          <div className="relative">
            <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              ref={inputRef}
              type="text"
              placeholder="Search shows, movies, actors, directors..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-muted border border-border rounded-full py-3 pl-11 pr-10 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent transition font-medium text-sm"
            />
            {query ? (
              <button onClick={() => setQuery('')} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            ) : (
              <button onClick={onClose} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Results Auto-Complete List */}
          <div className="flex flex-col gap-2 max-h-[60vh] overflow-y-auto hide-scrollbar">
            {isSearching ? (
              <div className="py-8 text-center text-xs text-muted-foreground animate-pulse font-medium">
                Searching titles...
              </div>
            ) : results.length > 0 ? (
              results.map((item) => {
                const isPerson = item.media_type === 'person';
                const isMovie = item.media_type === 'movie';
                const title = item.title || item.name;
                const path = isPerson ? `/person/${item.id}` : isMovie ? `/movie/${item.id}` : `/show/${item.id}`;
                const poster = getImageUrl(item.poster_path || item.profile_path, 'w185');

                return (
                  <Link
                    key={item.id}
                    href={path}
                    onClick={onClose}
                    className="flex items-center gap-3 p-2 rounded-2xl hover:bg-muted/60 transition-colors border border-transparent hover:border-border/60"
                  >
                    <div className="w-10 h-14 relative rounded-xl overflow-hidden bg-muted flex-shrink-0 border border-border">
                      {item.poster_path || item.profile_path ? (
                        <Image src={poster} alt={title} fill className="object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                          {isPerson ? <User className="w-5 h-5" /> : isMovie ? <Film className="w-5 h-5" /> : <Tv className="w-5 h-5" />}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col min-w-0 flex-1">
                      <span className="font-bold text-foreground text-sm truncate">{title}</span>
                      <span className="text-[10px] font-black uppercase text-accent tracking-wider mt-0.5">
                        {isPerson ? (item.known_for_department || 'Artist') : isMovie ? 'Movie' : 'TV Show'}
                      </span>
                    </div>
                  </Link>
                );
              })
            ) : query ? (
              <div className="py-8 text-center text-xs text-muted-foreground font-medium">
                No titles matching &quot;{query}&quot;
              </div>
            ) : (
              <div className="py-6 text-center text-xs text-muted-foreground font-medium">
                Type a title or actor name to see instant previews.
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
