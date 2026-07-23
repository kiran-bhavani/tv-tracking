"use client";

import { useState } from 'react';
import Image from 'next/image';
import { Play } from 'lucide-react';
import { getImageUrl } from '@/lib/utils';
import { AnimatePresence } from 'framer-motion';
import VideoPlayerModal from './VideoPlayerModal';

interface MediaGalleryProps {
  videos?: any[];
  images?: any[];
  title?: string;
}

export default function MediaGallery({ videos = [], images = [], title = "Photos & Videos" }: MediaGalleryProps) {
  const [activeVideo, setActiveVideo] = useState<string | null>(null);

  // Filter for YouTube videos
  const youtubeVideos = videos.filter(v => v.site === 'YouTube');
  
  // Combine videos and images into a single gallery array
  const hasMedia = youtubeVideos.length > 0 || images.length > 0;

  if (!hasMedia) return null;

  return (
    <div className="mt-8 mb-8">
      <h3 className="text-lg font-bold text-foreground mb-4 px-4">{title}</h3>
      
      <div className="flex overflow-x-auto gap-4 px-4 pb-4 hide-scrollbar snap-x">
        {/* Render Videos First */}
        {youtubeVideos.map((video) => (
          <div 
            key={video.id} 
            className="relative flex-shrink-0 w-64 aspect-video rounded-xl overflow-hidden cursor-pointer group snap-start bg-muted ring-1 ring-border shadow-sm"
            onClick={() => setActiveVideo(video.key)}
          >
            <Image
              src={`https://img.youtube.com/vi/${video.key}/mqdefault.jpg`}
              alt={video.name}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105 opacity-80 group-hover:opacity-100"
            />
            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-12 h-12 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center text-white border border-white/20 group-hover:bg-accent group-hover:text-accent-foreground group-hover:border-accent group-hover:scale-110 transition-all shadow-xl">
                <Play className="w-5 h-5 ml-1 fill-current" />
              </div>
            </div>
            {/* Type badge (Trailer, Featurette, etc) */}
            <div className="absolute top-2 left-2 bg-black/70 backdrop-blur-md px-2 py-1 rounded text-[10px] font-bold text-white uppercase tracking-wider">
              {video.type}
            </div>
          </div>
        ))}

        {/* Render Images Next */}
        {images.map((img, i) => (
          <div 
            key={img.file_path || i} 
            className="relative flex-shrink-0 w-64 aspect-video rounded-xl overflow-hidden snap-start bg-muted ring-1 ring-border shadow-sm"
          >
            <Image
              src={getImageUrl(img.file_path, 'w500')}
              alt="Promotional media"
              fill
              className="object-cover hover:scale-105 transition-transform duration-500"
            />
          </div>
        ))}
      </div>

      <AnimatePresence>
        {activeVideo && (
          <VideoPlayerModal 
            videoKey={activeVideo} 
            onClose={() => setActiveVideo(null)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}
