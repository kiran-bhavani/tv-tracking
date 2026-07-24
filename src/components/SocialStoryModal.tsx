"use client";

import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { X, Share2, Download, Tv, Star, Sparkles, Check } from 'lucide-react';
import { getImageUrl } from '@/lib/utils';

interface SocialStoryModalProps {
  title: string;
  posterPath: string | null;
  backdropPath: string | null;
  type: 'show' | 'movie';
  rating?: number;
  year?: string;
  tagline?: string;
  onClose: () => void;
}

export default function SocialStoryModal({
  title,
  posterPath,
  backdropPath,
  type,
  rating,
  year,
  tagline,
  onClose
}: SocialStoryModalProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);
  const [copied, setCopied] = useState(false);

  const posterUrl = getImageUrl(posterPath, 'w500');
  const backdropUrl = getImageUrl(backdropPath, 'original');

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Check out ${title} on TV Time`,
          text: `I'm tracking ${title} on TV Time! ${tagline ? `"${tagline}"` : ''}`,
          url: window.location.href,
        });
      } catch (err) {
        console.log("Share cancelled or failed", err);
      }
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

        {/* 1080x1920 9:16 Aspect Ratio Preview Card */}
        <div
          ref={cardRef}
          className="w-full aspect-[9/16] rounded-3xl overflow-hidden relative border border-white/20 shadow-2xl flex flex-col justify-between p-6 select-none bg-background"
        >
          {/* Backdrop Image with Dark Blur Overlay */}
          {backdropPath && (
            <Image
              src={backdropUrl}
              alt={title}
              fill
              className="object-cover opacity-40 scale-105"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-background/30" />

          {/* Top Brand Header */}
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
              <div className="w-6 h-6 bg-accent rounded-lg flex items-center justify-center">
                <Tv className="w-3.5 h-3.5 text-accent-foreground" />
              </div>
              <span className="text-xs font-black text-white tracking-wide">TV TIME</span>
            </div>
            <span className="text-[10px] font-bold text-accent bg-accent/20 border border-accent/30 px-2.5 py-1 rounded-full uppercase tracking-widest">
              {type === 'movie' ? 'Movie' : 'TV Series'}
            </span>
          </div>

          {/* Poster & Main Content */}
          <div className="relative z-10 flex flex-col items-center text-center gap-4 my-auto">
            <div className="w-36 h-52 relative rounded-2xl overflow-hidden border-2 border-white/20 shadow-2xl bg-muted group">
              <Image src={posterUrl} alt={title} fill className="object-cover" />
            </div>

            <div className="flex flex-col items-center gap-1.5 px-2">
              <h2 className="text-2xl font-black text-white leading-tight drop-shadow-lg">
                {title}
              </h2>

              <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
                {rating && (
                  <span className="flex items-center gap-1 text-accent bg-black/50 px-2 py-0.5 rounded border border-white/10">
                    <Star className="w-3.5 h-3.5 fill-current" /> {rating.toFixed(1)}
                  </span>
                )}
                {year && <span>• {year}</span>}
              </div>

              {tagline && (
                <p className="text-xs italic text-accent/90 max-w-[260px] line-clamp-2 mt-1 font-medium">
                  &ldquo;{tagline}&rdquo;
                </p>
              )}
            </div>
          </div>

          {/* Bottom Callout */}
          <div className="relative z-10 flex items-center justify-center bg-black/60 backdrop-blur-md border border-white/10 rounded-2xl py-3 px-4 text-center">
            <span className="text-xs font-bold text-white/90 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-accent" /> Track yours on tv-tracking.vercel.app
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="w-full flex gap-3">
          <button
            onClick={handleNativeShare}
            className="flex-1 bg-accent text-accent-foreground font-bold text-sm py-3 rounded-2xl shadow-xl hover:bg-accent/90 transition-all flex items-center justify-center gap-2"
          >
            <Share2 className="w-4 h-4" />
            {copied ? 'Link Copied!' : 'Share Story'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
