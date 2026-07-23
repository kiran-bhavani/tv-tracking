"use client";

import { useState, useEffect } from 'react';
import { Search as SearchIcon, X } from 'lucide-react';
import { searchMulti } from '@/lib/tmdb';
import ShowCard from '@/components/ShowCard';
import { useDebounce } from '@/hooks/useDebounce';

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
        // Filter out people, only keep tv and movies
        setResults((data.results || []).filter((item: any) => item.media_type === 'tv' || item.media_type === 'movie'));
      } catch (error) {
        console.error("Search failed", error);
      } finally {
        setIsSearching(false);
      }
    };

    fetchResults();
  }, [debouncedQuery]);

  return (
    <div className="min-h-screen bg-background pt-safe">
      <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-md px-4 py-4 border-b border-border">
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search shows, movies, users..."
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
            {results.map((show: any) => (
              <ShowCard key={show.id} show={show} />
            ))}
          </div>
        ) : query ? (
          <div className="text-center text-muted-foreground py-10">
            No results found for &quot;{query}&quot;
          </div>
        ) : (
          <div className="text-center text-muted-foreground py-10">
            Find your next favorite show.
          </div>
        )}
      </div>
    </div>
  );
}
