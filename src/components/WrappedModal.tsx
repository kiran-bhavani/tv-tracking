"use client";

import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { X, Share2, Sparkles, Tv, Film, Clock, Award, Check } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { getImageUrl } from '@/lib/utils';

interface WrappedModalProps {
  userName: string;
  onClose: () => void;
}

export default function WrappedModal({ userName, onClose }: WrappedModalProps) {
  const watchlist = useStore((state) => state.watchlist);
  const watchedEpisodes = useStore((state) => state.watchedEpisodes);
  const movieReviews = useStore((state) => state.movieReviews);
  const [copied, setCopied] = useState(false);

  // Compute Stats
  let totalTvMins = 0;
  let totalEpisodesCount = 0;

  const showStats = Object.entries(watchedEpisodes).map(([showIdStr, epList]) => {
    const showId = Number(showIdStr);
    const validEps = (Array.isArray(epList) ? epList : []).filter(e => typeof e === 'object' && e !== null);
    totalEpisodesCount += validEps.length;

    const show = watchlist[showId];
    const runtime = show?.runtime || 45;
    totalTvMins += validEps.length * runtime;

    return {
      show,
      watchedCount: validEps.length
    };
  }).filter(item => item.show && item.watchedCount > 0);

  // Sort by most watched
  showStats.sort((a, b) => b.watchedCount - a.watchedCount);
  const topShows = showStats.slice(0, 4);

  // Movies watched
  const watchedMovieIds = Object.keys(watchlist).filter(id => {
    const show = watchlist[Number(id)];
    if (show?.type !== 'movie') return false;
    const epData = watchedEpisodes[Number(id)];
    return Array.isArray(epData) && epData.length > 0;
  });

  let totalMovieMins = 0;
  watchedMovieIds.forEach(id => {
    const show = watchlist[Number(id)];
    totalMovieMins += show?.runtime || 120;
  });

  const grandTotalMins = totalTvMins + totalMovieMins;
  const days = Math.floor(grandTotalMins / (24 * 60));
  const hours = Math.floor((grandTotalMins % (24 * 60)) / 60);

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `${userName}'s TV Time Wrapped`,
        text: `I spent ${days > 0 ? `${days}d ${hours}h` : `${hours}h`} watching TV & Movies on TV Time!`,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="w-full max-w-sm flex flex-col items-center gap-4 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute -top-12 right-0 text-white/80 hover:text-white transition-colors p-2"
        >
          <X className="w-6 h-6" />
        </button>

        {/* 9:16 Aspect Ratio Wrapped Graphic Card */}
        <div className="w-full aspect-[9/16] rounded-3xl overflow-hidden relative border border-accent/40 shadow-2xl flex flex-col justify-between p-6 select-none bg-gradient-to-br from-purple-950 via-background to-black">
          
          {/* Header */}
          <div className="flex items-center justify-between z-10">
            <div className="flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
              <Sparkles className="w-4 h-4 text-accent" />
              <span className="text-xs font-black text-white tracking-wider">TV TIME WRAPPED</span>
            </div>
            <span className="text-[10px] font-bold text-accent bg-accent/20 border border-accent/30 px-2.5 py-1 rounded-full uppercase">
              2026 Edition
            </span>
          </div>

          {/* Core Stats Overview */}
          <div className="z-10 flex flex-col items-center text-center gap-2 my-auto">
            <span className="text-xs font-bold text-accent uppercase tracking-widest">
              {userName}&apos;s Total Binge Time
            </span>
            <h2 className="text-4xl font-black text-white leading-none drop-shadow-xl">
              {days > 0 ? `${days} Days, ${hours} Hours` : `${hours} Hours`}
            </h2>

            <div className="flex gap-4 mt-2 bg-black/50 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10 text-xs font-bold">
              <span className="text-white flex items-center gap-1">
                <Tv className="w-3.5 h-3.5 text-accent" /> {totalEpisodesCount} Episodes
              </span>
              <span className="text-white/40">•</span>
              <span className="text-white flex items-center gap-1">
                <Film className="w-3.5 h-3.5 text-accent" /> {watchedMovieIds.length} Movies
              </span>
            </div>
          </div>

          {/* Top 4 Shows Poster Grid */}
          {topShows.length > 0 && (
            <div className="z-10 flex flex-col gap-2">
              <span className="text-[10px] font-black text-white/70 uppercase tracking-widest text-center">
                Top Binge Shows
              </span>
              <div className="grid grid-cols-4 gap-2">
                {topShows.map(({ show, watchedCount }) => (
                  <div key={show.id} className="flex flex-col items-center gap-1">
                    <div className="w-full aspect-[2/3] relative rounded-xl overflow-hidden border border-white/20 shadow-md bg-muted">
                      <Image
                        src={getImageUrl(show.poster_path, 'w185')}
                        alt={show.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <span className="text-[9px] font-bold text-white truncate max-w-full">
                      {show.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Bottom Branding */}
          <div className="z-10 flex items-center justify-center bg-black/60 backdrop-blur-md border border-white/10 rounded-2xl py-2.5 px-4 text-center mt-3">
            <span className="text-[11px] font-bold text-white/80">
              Track your stats on tv-tracking.vercel.app
            </span>
          </div>
        </div>

        {/* Share Button */}
        <button
          onClick={handleShare}
          className="w-full bg-accent text-accent-foreground font-bold text-sm py-3 rounded-2xl shadow-xl hover:bg-accent/90 transition-all flex items-center justify-center gap-2"
        >
          <Share2 className="w-4 h-4" />
          {copied ? 'Link Copied!' : 'Share Wrapped Story'}
        </button>
      </motion.div>
    </motion.div>
  );
}
