"use client";

import Image from 'next/image';
import { Calendar, Clock, Tv } from 'lucide-react';
import { getImageUrl } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface NextEpisodeCardProps {
  nextEpisode: any;
}

export default function NextEpisodeCard({ nextEpisode }: NextEpisodeCardProps) {
  if (!nextEpisode || !nextEpisode.air_date) return null;

  const airDate = new Date(nextEpisode.air_date);
  const isFuture = airDate.getTime() > Date.now();
  const timeDistance = isFuture 
    ? formatDistanceToNow(airDate, { addSuffix: true }) 
    : 'Airing today';

  const stillUrl = getImageUrl(nextEpisode.still_path, 'w500');

  return (
    <div className="px-4 mt-6">
      <div className="bg-gradient-to-r from-accent/20 via-accent/10 to-transparent border border-accent/30 rounded-2xl p-4 shadow-lg flex flex-col sm:flex-row items-start sm:items-center gap-4 relative overflow-hidden">
        
        {/* Episode Still / Icon */}
        <div className="w-full sm:w-28 h-20 relative rounded-xl overflow-hidden bg-muted flex-shrink-0 border border-accent/20">
          {nextEpisode.still_path ? (
            <Image src={stillUrl} alt={nextEpisode.name} fill className="object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-accent/10 text-accent">
              <Tv className="w-8 h-8" />
            </div>
          )}
          <div className="absolute top-1.5 left-1.5 bg-black/80 backdrop-blur-sm text-[10px] font-black text-white px-2 py-0.5 rounded">
            S{nextEpisode.season_number} E{nextEpisode.episode_number}
          </div>
        </div>

        {/* Info & Countdown */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-black text-accent uppercase tracking-widest bg-accent/20 px-2 py-0.5 rounded flex items-center gap-1">
              <Calendar className="w-3 h-3" /> Next Episode
            </span>
            <span className="text-xs font-bold text-foreground">
              {timeDistance}
            </span>
          </div>

          <h4 className="font-black text-foreground text-base truncate">
            {nextEpisode.name}
          </h4>

          {nextEpisode.overview ? (
            <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
              {nextEpisode.overview}
            </p>
          ) : (
            <p className="text-xs text-muted-foreground mt-0.5">
              Air Date: {airDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
