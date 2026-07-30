"use client";

import { useEffect, useState } from 'react';
import TopNav from '@/components/TopNav';
import { useStore } from '@/store/useStore';
import { Calendar as CalendarIcon, Tv, Clock, Check } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { getImageUrl } from '@/lib/utils';
import { logActivity } from '@/lib/activity';

export default function ReleaseCalendarPage() {
  const watchlist = useStore((state) => state.watchlist);
  const watchedEpisodes = useStore((state) => state.watchedEpisodes);
  const toggleEpisodeWatched = useStore((state) => state.toggleEpisodeWatched);

  const activeTvShows = Object.values(watchlist || {}).filter(show => show && show.type !== 'movie');

  // Compute upcoming schedule using real data from TMDB (next_episode_to_air)
  const scheduleItems = activeTvShows.map((show) => {
    const epData = (watchedEpisodes || {})[show.id] || [];
    const watchedEps = (Array.isArray(epData) ? epData : []).filter(e => typeof e === 'object' && e !== null) as any[];

    const totalEps = show.number_of_episodes || 0;
    if (totalEps > 0 && watchedEps.length >= totalEps) return null; // Finished

    // Derive next season/episode from watched history
    let nextSeason = 1;
    let nextEpisode = 1;
    if (watchedEps.length > 0) {
      const sorted = [...watchedEps].sort((a, b) => {
        if ((a.season ?? 1) !== (b.season ?? 1)) return (a.season ?? 1) - (b.season ?? 1);
        return (a.episode ?? 0) - (b.episode ?? 0);
      });
      const last = sorted[sorted.length - 1];
      nextSeason = last.season ?? 1;
      nextEpisode = (last.episode ?? 0) + 1;
    }

    // Try to use real air date from TMDB's next_episode_to_air field
    // (stored on the show object when available from the API)
    let airDate: Date | null = null;
    let daysOffset = -1;

    const nextEpData = (show as any).next_episode_to_air;
    if (nextEpData?.air_date) {
      airDate = new Date(nextEpData.air_date);
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      daysOffset = Math.round((airDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      nextSeason = nextEpData.season_number ?? nextSeason;
      nextEpisode = nextEpData.episode_number ?? nextEpisode;
    } else {
      // No real air date — mark as TBD (don't show fake dates)
      return null;
    }

    // Only show episodes airing within the next 30 days or already aired today
    if (daysOffset < 0 || daysOffset > 30) return null;

    return {
      show,
      season: nextSeason,
      episode: nextEpisode,
      airDate,
      daysOffset
    };
  }).filter(Boolean) as { show: any; season: number; episode: number; airDate: Date; daysOffset: number }[];

  // Sort by airDate ascending
  scheduleItems.sort((a, b) => a.airDate.getTime() - b.airDate.getTime());

  // Group into time buckets
  const todayItems = scheduleItems.filter(i => i.daysOffset === 0);
  const thisWeekItems = scheduleItems.filter(i => i.daysOffset > 0 && i.daysOffset <= 7);
  const nextWeekItems = scheduleItems.filter(i => i.daysOffset > 7 && i.daysOffset <= 14);
  const laterItems = scheduleItems.filter(i => i.daysOffset > 14);

  const handleMarkWatched = (item: typeof scheduleItems[0]) => {
    const epId = item.show.id * 1000 + item.episode;
    logActivity(item.show.id, item.show.name, item.season, item.episode, `Episode ${item.episode}`);
    toggleEpisodeWatched(item.show.id, {
      id: epId,
      season: item.season,
      episode: item.episode
    });
  };

  const renderSection = (title: string, items: typeof scheduleItems) => {
    if (items.length === 0) return null;

    return (
      <div className="flex flex-col gap-3">
        <h3 className="text-xs font-black uppercase tracking-wider text-accent flex items-center gap-1.5 px-4">
          <CalendarIcon className="w-3.5 h-3.5" /> {title} ({items.length})
        </h3>

        <div className="flex flex-col gap-3 px-4">
          {items.map(({ show, season, episode, airDate }) => {
            const poster = getImageUrl(show.poster_path, 'w500');

            return (
              <div
                key={show.id}
                className="bg-card border border-border/80 rounded-2xl p-4 shadow-md flex items-center justify-between gap-4 group hover:border-accent/50 transition-colors"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <Link href={`/show/${show.id}`} className="w-14 h-20 relative rounded-xl overflow-hidden bg-muted flex-shrink-0 border border-border">
                    <Image src={poster} alt={show.name} fill className="object-cover" />
                  </Link>

                  <div className="flex flex-col min-w-0">
                    <Link href={`/show/${show.id}`} className="font-bold text-foreground text-base truncate group-hover:text-accent transition-colors">
                      {show.name}
                    </Link>
                    <span className="text-xs font-black text-accent mt-0.5">
                      S{season} E{episode}
                    </span>
                    <span className="text-[11px] text-muted-foreground mt-1">
                      Airing {airDate.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => handleMarkWatched({ show, season, episode, airDate, daysOffset: 0 })}
                  className="bg-accent/15 hover:bg-accent text-accent hover:text-accent-foreground border border-accent/30 font-bold text-xs px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 flex-shrink-0"
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>Watched</span>
                </button>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <TopNav title="Release Calendar" />

      <div className="pt-6 flex flex-col gap-8">
        {scheduleItems.length === 0 ? (
          <div className="text-center text-muted-foreground py-16 px-6">
          <div className="text-center text-muted-foreground py-16 px-6">
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4 mx-auto">
              <CalendarIcon className="w-8 h-8 text-muted-foreground/50" />
            </div>
            <h3 className="font-bold text-foreground mb-1">No upcoming episodes</h3>
            <p className="text-sm leading-relaxed">
              Shows with confirmed air dates from TMDB will appear here. Add shows to your watchlist and check back!
            </p>
          </div>
          </div>
        ) : (
          <>
            {renderSection("Airing Today", todayItems)}
            {renderSection("This Week", thisWeekItems)}
            {renderSection("Next Week", nextWeekItems)}
            {renderSection("Later This Month", laterItems)}
          </>
        )}
      </div>
    </div>
  );
}
