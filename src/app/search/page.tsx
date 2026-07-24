"use client";

import { useState, useEffect } from 'react';
import { Search as SearchIcon, X, User } from 'lucide-react';
import { searchMulti } from '@/lib/tmdb';
import ShowCard from '@/components/ShowCard';
import { useDebounce } from '@/hooks/useDebounce';
import Link from 'next/link';
import Image from 'next/image';
import { getImageUrl } from '@/lib/utils';

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const debouncedQuery = useDebounce(query, 500);

  useEffect(() => {
    if (debouncedQuery.trim() === '') {
      setResults([]);
      return;
    }

    const fetchResults = async () => {
      setIsSearching(true);
      try {
        const data = await searchMulti(debouncedQuery);
        // Include tv, movie, and person
        setResults((data.results || []).filter((item: any) => item.media_type === 'tv' || item.media_type === 'movie' || item.media_type === 'person'));
      } catch (error) {
        console.error("Search failed", error);
      } finally {
        setIsSearching(false);
      }
    };

    fetchResults();
  }, [debouncedQuery]);

  return (
    <div className="min-h-screen bg-background pt-safe pb-24">
      <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-md px-4 py-4 border-b border-border">
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search shows, movies, actors, directors..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-muted border border-border rounded-full py-3 pl-10 pr-10 text-foreground placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-accent transition"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      <div className="px-4 py-6">
        {isSearching ? (
          <div className="flex justify-center py-10">
            <div className="w-8 h-8 border-2 bg-accent border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : results.length > 0 ? (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(128px,1fr))] gap-4 justify-items-center">
            {results.map((item: any) => {
              if (item.media_type === 'person') {
                return (
                  <Link
                    key={`person_${item.id}`}
                    href={`/person/${item.id}`}
                    className="flex flex-col items-center group w-full"
                  >
                    <div className="w-28 h-40 rounded-xl overflow-hidden bg-muted border border-border group-hover:border-accent transition-colors relative mb-2 shadow-md">
                      {item.profile_path ? (
                        <Image src={getImageUrl(item.profile_path, 'w500')} alt={item.name} fill className="object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                          <User className="w-10 h-10" />
                        </div>
                      )}
                    </div>
                    <span className="text-xs font-bold text-foreground text-center truncate w-full group-hover:text-accent transition-colors">
                      {item.name}
                    </span>
                    <span className="text-[10px] text-muted-foreground text-center truncate w-full">
                      {item.known_for_department || 'Artist'}
                    </span>
                  </Link>
                );
              }

              return <ShowCard key={item.id} show={item} />;
            })}
          </div>
        ) : query ? (
          <div className="text-center text-muted-foreground py-10">
            No results found for &quot;{query}&quot;
          </div>
        ) : (
          <div className="text-center text-muted-foreground py-10">
            Find your next favorite show, movie, or actor.
          </div>
        )}
      </div>
    </div>
  );
}

