"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useStore } from '@/store/useStore';
import { getLocalWatchProviders } from '@/lib/tmdb';

export default function RegionalWatchProviders({ isMovie }: { isMovie: boolean }) {
  const { countryCode } = useStore();
  const [providers, setProviders] = useState<{ provider_name: string; provider_id: number; logo_path: string }[]>([]);

  useEffect(() => {
    async function load() {
      try {
        const data = await getLocalWatchProviders(isMovie ? 'movie' : 'tv', countryCode);
        if (data.results) {
          // Flatten and extract top 8 unique flatrate/buy/rent providers
          const countryData = data.results[countryCode] || data.results['US'];
          if (countryData) {
            const allProviders = [
              ...(countryData.flatrate || []),
              ...(countryData.buy || []),
              ...(countryData.rent || [])
            ];
            const unique = Array.from(new Map(allProviders.map(p => [p.provider_id, p])).values()).slice(0, 8);
            setProviders(unique as any);
          }
        }
      } catch (err) {
        console.error("Failed to fetch regional providers", err);
      }
    }
    load();
  }, [isMovie, countryCode]);

  // Fallback to static if none found
  const defaultProviders = [
    { provider_name: 'Netflix', provider_id: 8, logo_path: '' },
    { provider_name: 'HBO Max', provider_id: 384, logo_path: '' },
    { provider_name: 'Disney+', provider_id: 337, logo_path: '' },
    { provider_name: 'Apple TV+', provider_id: 350, logo_path: '' },
    { provider_name: 'Prime Video', provider_id: 9, logo_path: '' }
  ];

  const displayList = providers.length > 0 ? providers : defaultProviders;

  return (
    <div className="px-4 mb-4">
      <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Watch Providers ({countryCode})</p>
      <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
        {displayList.map(p => (
          <Link
            key={p.provider_id}
            href={`/search?provider=${p.provider_id}&type=${isMovie ? 'movie' : 'tv'}`}
            className="px-3.5 py-1.5 bg-card hover:bg-accent/15 border border-border hover:border-accent/30 text-xs font-bold text-foreground rounded-full flex-shrink-0 transition-colors"
          >
            {p.provider_name}
          </Link>
        ))}
      </div>
    </div>
  );
}
