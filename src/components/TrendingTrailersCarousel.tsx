"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Play, Film, Sparkles } from 'lucide-react';
import { getImageUrl } from '@/lib/utils';
import VideoPlayerModal from './VideoPlayerModal';
import { cacheManager } from '@/lib/cache';

const FEATURED_TRAILERS = [
  {
    id: 157336,
    title: 'Interstellar',
    media_type: 'movie',
    type: 'Official Trailer',
    videoKey: 'zSWdZVtXT7E',
    backdrop_path: '/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg',
    poster_path: '/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg'
  },
  {
    id: 27205,
    title: 'Inception',
    media_type: 'movie',
    type: 'Teaser Trailer',
    videoKey: 'YoHD9XEInc0',
    backdrop_path: '/8ZTVqvKDQ8emSGUEMjsS4yHAi4B.jpg',
    poster_path: '/oYuLEW9W2vBBGLn2vRAtHDLIftC.jpg'
  },
  {
    id: 1396,
    title: 'Breaking Bad',
    media_type: 'tv',
    type: 'Featurette & Bloopers',
    videoKey: 'HhesaQXLuRY',
    backdrop_path: '/tsry6tIyCoFawYrE2fWmyz5zyvM.jpg',
    poster_path: '/ztkUQFLlC19CCMYHW9o1zWhJRNq.jpg'
  },
  {
    id: 66732,
    title: 'Stranger Things',
    media_type: 'tv',
    type: 'Season 4 Trailer',
    videoKey: 'b9EkMc79ZSU',
    backdrop_path: '/56v2KjBlU4XaOv9rVYEQypROD7P.jpg',
    poster_path: '/49WJfeN0moxb9IPfGn88qMG4d2m.jpg'
  },
  {
    id: 155,
    title: 'The Dark Knight',
    media_type: 'movie',
    type: 'Official Trailer',
    videoKey: 'EXeTwQWrcwY',
    backdrop_path: '/nMK2819zaDFmMyyGLpE9XxqFiR.jpg',
    poster_path: '/qJ2tW6WMUDux911r6m7haRef0WH.jpg'
  }
];

export default function TrendingTrailersCarousel() {
  const [selectedVideo, setSelectedVideo] = useState<{ key: string; title: string } | null>(null);

  return (
    <div className="flex flex-col gap-3 my-4">
      <div className="px-4 flex items-center justify-between">
        <h3 className="font-bold text-foreground text-base flex items-center gap-1.5">
          <Film className="w-4 h-4 text-accent" /> Trending Trailers & Clips
        </h3>
        <span className="text-[10px] font-black text-accent uppercase tracking-wider bg-accent/15 px-2 py-0.5 rounded-full border border-accent/20">
          HD Videos
        </span>
      </div>

      <div className="flex overflow-x-auto gap-4 px-4 pb-2 snap-x snap-mandatory hide-scrollbar">
        {FEATURED_TRAILERS.map((item) => (
          <div
            key={item.id}
            onClick={() => setSelectedVideo({ key: item.videoKey, title: item.title })}
            className="flex-shrink-0 w-64 h-36 relative rounded-2xl overflow-hidden bg-muted border border-border/80 shadow-lg cursor-pointer group snap-start"
          >
            <Image
              src={getImageUrl(item.backdrop_path, 'w500')}
              alt={item.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />

            {/* Play Button Overlay */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-12 h-12 rounded-full bg-accent/90 text-accent-foreground flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
                <Play className="w-6 h-6 fill-current ml-0.5" />
              </div>
            </div>

            {/* Video Details */}
            <div className="absolute bottom-3 left-3 right-3 flex flex-col">
              <span className="text-[10px] font-black text-accent uppercase tracking-wider">
                {item.type}
              </span>
              <span className="font-bold text-white text-sm truncate">
                {item.title}
              </span>
            </div>
          </div>
        ))}
      </div>

      {selectedVideo && (
        <VideoPlayerModal
          videoKey={selectedVideo.key}
          onClose={() => setSelectedVideo(null)}
        />
      )}
    </div>
  );
}
