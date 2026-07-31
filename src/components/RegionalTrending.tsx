"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useStore } from '@/store/useStore';
import { getTrendingByRegion } from '@/lib/tmdb';
import ShowCard from '@/components/ShowCard';

export default function RegionalTrending({ isMovie }: { isMovie: boolean }) {
  const { countryCode } = useStore();
  const [trending, setTrending] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Convert country code to display name (simple mapping for now)
  const getCountryName = (code: string) => {
    try {
      const displayNames = new Intl.DisplayNames(['en'], { type: 'region' });
      return displayNames.of(code) || code;
    } catch {
      return code;
    }
  };

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      try {
        const data = await getTrendingByRegion(isMovie ? 'movie' : 'tv', countryCode);
        if (data.results) {
          setTrending(data.results.slice(0, 10));
        }
      } catch (err) {
        console.error("Failed to fetch regional trending", err);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [isMovie, countryCode]);

  if (isLoading || trending.length === 0) {
    return null; // Fallback to not showing the shelf if empty/loading for now
  }

  return (
    <section>
      <div className="px-4 mb-3 flex justify-between items-end">
        <h2 className="text-xl font-bold text-foreground">
          Trending in {getCountryName(countryCode)}
        </h2>
      </div>
      <div className="flex overflow-x-auto gap-4 px-4 snap-x snap-mandatory hide-scrollbar">
        {trending.map((item: any) => (
          <ShowCard key={item.id} show={{...item, media_type: isMovie ? 'movie' : 'tv'}} featured />
        ))}
      </div>
    </section>
  );
}
