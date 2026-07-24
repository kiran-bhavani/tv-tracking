"use client";

import { useStore, WatchlistShow } from '@/store/useStore';
import { logActivity } from '@/lib/activity';
import Image from 'next/image';
import Link from 'next/link';
import { getImageUrl } from '@/lib/utils';
import { Check, Play, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function UpNextDeck() {
  const watchlist = useStore((state) => state.watchlist);
  const watchedEpisodes = useStore((state) => state.watchedEpisodes);
  const toggleEpisodeWatched = useStore((state) => state.toggleEpisodeWatched);

  // Filter TV shows in watchlist
  const activeTvShows = Object.values(watchlist || {}).filter(show => show && show.type !== 'movie');

  // Compute next unwatched episode for each TV show
  const upNextList = activeTvShows.map((show) => {
    const epData = (watchedEpisodes || {})[show.id] || [];
    const watchedEps = (Array.isArray(epData) ? epData : []).filter(e => typeof e === 'object' && e !== null);
    const watchedCount = watchedEps.length;

    // Simple heuristic: Next episode = watchedCount + 1
    // Season 1, Episode (watchedCount + 1)
    const nextEpNum = watchedCount + 1;
    const totalEps = show.number_of_episodes || 12;

    if (nextEpNum > totalEps) return null; // Finished show

    return {
      show,
      season: 1, // Default season 1 estimate or next
      episode: nextEpNum,
      totalEps
    };
  }).filter(Boolean) as { show: WatchlistShow; season: number; episode: number; totalEps: number }[];

  if (upNextList.length === 0) return null;

  const handleMarkWatched = (item: typeof upNextList[0]) => {
    const epId = item.show.id * 1000 + item.episode;
    logActivity(item.show.id, item.show.name, item.season, item.episode, `Episode ${item.episode}`);
    toggleEpisodeWatched(item.show.id, {
      id: epId,
      season: item.season,
      episode: item.episode
    });
  };

  return (
    <div className="px-4 mt-4 mb-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-foreground text-base flex items-center gap-1.5">
          <Zap className="w-4 h-4 text-accent fill-accent" /> Up Next Deck
        </h3>
        <span className="text-xs font-bold text-muted-foreground">{upNextList.length} shows</span>
      </div>

      <div className="flex overflow-x-auto gap-4 pb-2 snap-x snap-mandatory hide-scrollbar">
        <AnimatePresence>
          {upNextList.map(({ show, season, episode, totalEps }) => {
            const poster = getImageUrl(show.poster_path, 'w500');

            return (
              <motion.div
                key={show.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="flex-shrink-0 w-64 bg-card border border-border/80 rounded-2xl p-3 shadow-md flex gap-3 snap-start relative group"
              >
                <Link href={`/show/${show.id}`} className="w-16 h-24 relative rounded-xl overflow-hidden bg-muted flex-shrink-0 border border-border">
                  <Image src={poster} alt={show.name} fill className="object-cover" />
                </Link>

                <div className="flex-1 flex flex-col justify-between min-w-0">
                  <div>
                    <Link href={`/show/${show.id}`} className="font-bold text-foreground text-sm truncate block hover:text-accent transition-colors">
                      {show.name}
                    </Link>
                    <span className="text-xs font-black text-accent mt-0.5 block">
                      S{season} E{episode}
                    </span>
                    <span className="text-[10px] text-muted-foreground block mt-0.5">
                      {episode} of {totalEps} episodes
                    </span>
                  </div>

                  <button
                    onClick={() => handleMarkWatched({ show, season, episode, totalEps })}
                    className="w-full bg-accent/15 hover:bg-accent text-accent hover:text-accent-foreground border border-accent/30 font-bold text-xs py-1.5 rounded-xl transition-all flex items-center justify-center gap-1 mt-2"
                  >
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                    <span>Watched</span>
                  </button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
