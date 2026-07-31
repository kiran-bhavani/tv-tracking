"use client";

import { useEffect, useState } from 'react';
import TopNav from '@/components/TopNav';
import { useStore } from '@/store/useStore';
import { Calendar as CalendarIcon, Clock, Plus, Check } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { getImageUrl, getSyntheticEpisodeId } from '@/lib/utils';
import { logActivity } from '@/lib/activity';
import { fetchWatchlistScheduleAction } from '@/app/actions/tmdb';

import { cacheManager } from '@/lib/cache';

const CALENDAR_CACHE_KEY = 'calendar_schedule_v1';

export default function ReleaseCalendarPage() {
  const watchlist = useStore((state) => state.watchlist);
  const watchedEpisodes = useStore((state) => state.watchedEpisodes);
  const toggleEpisodeWatched = useStore((state) => state.toggleEpisodeWatched);
  const language = useStore((state) => state.language);

  const [scheduleItems, setScheduleItems] = useState<any[]>(() => {
    const cached = cacheManager.get<any[]>(CALENDAR_CACHE_KEY) || [];
    return cached.map(item => ({
      ...item,
      airDate: new Date(item.airDate)
    }));
  });
  const [loading, setLoading] = useState<boolean>(() => scheduleItems.length === 0);

  const activeTvShows = Object.values(watchlist || {}).filter(show => show && show.type !== 'movie');

  useEffect(() => {
    let isMounted = true;

    async function loadSchedule() {
      if (activeTvShows.length === 0) {
        setLoading(false);
        return;
      }

      try {
        const rawSchedule = await fetchWatchlistScheduleAction(
          activeTvShows.map(s => ({ id: s.id, name: s.name, type: s.type, poster_path: s.poster_path || undefined }))
        );

        const now = new Date();
        now.setHours(0, 0, 0, 0);

        const parsed = (rawSchedule || []).filter(Boolean).map((item: any) => {
          const epData = (watchedEpisodes || {})[item.showId] || [];
          const watchedEps = (Array.isArray(epData) ? epData : []).filter(e => typeof e === 'object' && e !== null) as any[];
          const isWatched = watchedEps.some(e => e.season === item.season && e.episode === item.episode);

          if (isWatched) return null;

          const airDate = new Date(item.airDate);
          const daysOffset = Math.round((airDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

          // Include today and future airings up to 60 days
          if (daysOffset < 0 || daysOffset > 60) return null;

          return {
            ...item,
            airDate,
            daysOffset
          };
        }).filter(Boolean);

        parsed.sort((a: any, b: any) => a.airDate.getTime() - b.airDate.getTime());

        cacheManager.set(CALENDAR_CACHE_KEY, parsed);

        if (isMounted) {
          setScheduleItems(parsed);
          setLoading(false);
        }
      } catch (err) {
        console.error("Failed to load release calendar schedule:", err);
        if (isMounted) setLoading(false);
      }
    }

    loadSchedule();
    return () => { isMounted = false; };
  }, [activeTvShows.length, JSON.stringify(activeTvShows.map(s => s.id))]);

  // Group into time buckets
  const todayItems = scheduleItems.filter(i => i.daysOffset === 0);
  const thisWeekItems = scheduleItems.filter(i => i.daysOffset > 0 && i.daysOffset <= 7);
  const nextWeekItems = scheduleItems.filter(i => i.daysOffset > 7 && i.daysOffset <= 14);
  const laterItems = scheduleItems.filter(i => i.daysOffset > 14);

  const handleMarkWatched = (item: typeof scheduleItems[0]) => {
    const epId = getSyntheticEpisodeId(item.showId, item.season, item.episode);
    logActivity(item.showId, item.showName, item.season, item.episode, item.episodeName || `Episode ${item.episode}`);
    toggleEpisodeWatched(item.showId, {
      id: epId,
      season: item.season,
      episode: item.episode
    });
    setScheduleItems(prev => prev.filter(i => !(i.showId === item.showId && i.season === item.season && i.episode === item.episode)));
  };

  const renderSection = (title: string, items: typeof scheduleItems) => {
    if (items.length === 0) return null;

    return (
      <div className="flex flex-col gap-3">
        <h3 className="text-xs font-black uppercase tracking-wider text-accent flex items-center gap-1.5 px-4">
          <CalendarIcon className="w-3.5 h-3.5" /> {title} ({items.length})
        </h3>

        <div className="flex flex-col gap-3 px-4">
          {items.map((item) => {
            const poster = getImageUrl(item.poster_path, 'w500');

            return (
              <div
                key={`${item.showId}_S${item.season}E${item.episode}`}
                className="bg-card border border-border/80 rounded-2xl p-4 shadow-md flex items-center justify-between gap-4 group hover:border-accent/50 transition-colors"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <Link href={`/show/${item.showId}`} className="w-14 h-20 relative rounded-xl overflow-hidden bg-muted flex-shrink-0 border border-border">
                    <Image src={poster} alt={item.showName} fill className="object-cover" />
                  </Link>

                  <div className="flex flex-col min-w-0">
                    <Link href={`/show/${item.showId}`} className="font-bold text-foreground text-base truncate group-hover:text-accent transition-colors">
                      {item.showName}
                    </Link>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs font-black text-accent">
                        S{item.season} E{item.episode}
                      </span>
                    </div>
                    <span className="text-[11px] text-muted-foreground mt-1 truncate">
                      {item.episodeName || 'Upcoming Episode'} • {item.airDate.toLocaleDateString(language || 'en-US', { timeZone: 'UTC', weekday: 'short', month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => handleMarkWatched(item)}
                  className="bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 flex-shrink-0 shadow-md shadow-emerald-500/20 active:scale-95"
                  title="Mark this episode as watched"
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>+ Mark Watched</span>
                </button>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background pb-32">
      <TopNav title="Release Calendar" />

      <div className="pt-6 flex flex-col gap-8">
        {loading ? (
          <div className="text-center text-muted-foreground py-16 px-6">
            <div className="w-10 h-10 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-sm font-bold">Loading release schedule...</p>
          </div>
        ) : scheduleItems.length === 0 ? (
          <div className="text-center text-muted-foreground py-16 px-6">
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4 mx-auto">
              <CalendarIcon className="w-8 h-8 text-muted-foreground/50" />
            </div>
            <h3 className="font-bold text-foreground mb-1">No upcoming episodes</h3>
            <p className="text-sm leading-relaxed max-w-sm mx-auto">
              No confirmed upcoming episodes for your watchlist shows. Add more shows to your watchlist to track release dates!
            </p>
          </div>
        ) : (
          <>
            {renderSection("Airing Today", todayItems)}
            {renderSection("This Week", thisWeekItems)}
            {renderSection("Next Week", nextWeekItems)}
            {renderSection("Later This Month & Next", laterItems)}
          </>
        )}
      </div>
    </div>
  );
}
