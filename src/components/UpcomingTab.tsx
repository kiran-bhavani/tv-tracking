"use client";

import { useEffect, useState, useRef } from 'react';
import { getUpcomingEpisodes } from '@/lib/tmdb';
import Image from 'next/image';
import Link from 'next/link';
import { Calendar as CalendarIcon, Clock, ChevronRight, Tv } from 'lucide-react';
import { getImageUrl } from '@/lib/utils';
import { cacheManager } from '@/lib/cache';
import { format, formatDistanceToNow, parseISO } from 'date-fns';

interface UpcomingTabProps {
  showIds: number[];
}

export default function UpcomingTab({ showIds }: UpcomingTabProps) {
  const [upcoming, setUpcoming] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  // Stable ref so the effect only re-runs when the actual IDs change, not on every render
  const idsKey = showIds.slice().sort().join(',');
  const prevIdsKey = useRef('');

  useEffect(() => {
    if (idsKey === prevIdsKey.current) return;
    prevIdsKey.current = idsKey;

    let mounted = true;

    async function fetchUpcoming() {
      if (showIds.length === 0) {
        setLoading(false);
        return;
      }

      // Check cache first — upcoming episodes are valid for 30 minutes
      const cacheKey = `upcoming_${idsKey}`;
      const cached = cacheManager.get<any[]>(cacheKey);
      if (cached) {
        if (mounted) { setUpcoming(cached); setLoading(false); }
        return;
      }

      try {
        // Limit to 15 shows max to avoid hammering the API
        const limitedIds = showIds.slice(0, 15);
        const results = await getUpcomingEpisodes(limitedIds);

        results.sort((a, b) =>
          new Date(a.next_episode_to_air.air_date).getTime() -
          new Date(b.next_episode_to_air.air_date).getTime()
        );

        // Cache for 30 minutes
        cacheManager.set(cacheKey, results);

        if (mounted) { setUpcoming(results); setLoading(false); }
      } catch (error) {
        console.error("Failed to fetch upcoming episodes", error);
        if (mounted) setLoading(false);
      }
    }

    fetchUpcoming();
    return () => { mounted = false; };
  }, [idsKey]);

  if (loading) {
    return (
      <div className="flex flex-col gap-3">
        {[1,2,3].map(i => (
          <div key={i} className="bg-card/40 rounded-xl overflow-hidden flex border border-border/30 animate-pulse">
            <div className="w-24 h-24 bg-muted flex-shrink-0" />
            <div className="flex-1 p-4 space-y-2">
              <div className="h-4 bg-muted rounded w-2/3" />
              <div className="h-3 bg-muted rounded w-1/2" />
              <div className="h-3 bg-muted rounded w-1/3 mt-4" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (upcoming.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-16 flex flex-col items-center gap-4">
        <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-2">
          <CalendarIcon className="w-8 h-8 text-muted-foreground opacity-50" />
        </div>
        <h3 className="text-lg font-bold text-foreground">No Upcoming Episodes</h3>
        <p className="text-sm px-8 text-muted-foreground">
          None of your tracked shows have upcoming episodes scheduled.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {upcoming.map((item) => {
        const episode = item.next_episode_to_air;
        const airDate = parseISO(episode.air_date);
        const isAiringToday = new Date().toDateString() === airDate.toDateString();

        return (
          <Link
            key={item.showId}
            href={`/show/${item.showId}`}
            className="bg-card/40 backdrop-blur-sm rounded-xl overflow-hidden flex shadow-lg border border-white/5 group hover:border-accent/30 transition-colors"
          >
            <div className="w-24 relative flex-shrink-0 bg-muted">
              {item.poster_path ? (
                <Image src={getImageUrl(item.poster_path)} alt={item.showName} fill className="object-cover" sizes="96px" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Tv className="w-6 h-6 text-muted-foreground opacity-30" />
                </div>
              )}
            </div>

            <div className="flex-1 p-4 flex flex-col justify-center relative overflow-hidden">
              <h3 className="font-bold text-foreground text-base truncate pr-6">{item.showName}</h3>
              <p className="text-sm font-semibold text-accent mt-1">
                S{String(episode.season_number).padStart(2, '0')} E{String(episode.episode_number).padStart(2, '0')}
                <span className="text-muted-foreground font-normal ml-1 truncate">— {episode.name}</span>
              </p>

              <div className="flex items-center gap-2 mt-2 text-xs font-bold">
                {isAiringToday ? (
                  <span className="px-2 py-1 bg-accent/20 text-accent rounded-md flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Airing Today!
                  </span>
                ) : (
                  <span className="text-muted-foreground flex items-center gap-1">
                    <CalendarIcon className="w-3 h-3" />
                    {format(airDate, 'MMM d, yyyy')}
                    <span className="opacity-50 ml-1">({formatDistanceToNow(airDate, { addSuffix: true })})</span>
                  </span>
                )}
              </div>

              <ChevronRight className="w-4 h-4 text-muted-foreground absolute right-3 top-1/2 -translate-y-1/2 group-hover:text-accent group-hover:translate-x-0.5 transition-all" />
            </div>
          </Link>
        );
      })}
    </div>
  );
}
