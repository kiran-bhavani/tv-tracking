import Image from 'next/image';
import Link from 'next/link';
import { getImageUrl } from '@/lib/utils';
import { Play } from 'lucide-react';

interface ShowCardProps {
  show: {
    id: number;
    name?: string;
    title?: string;
    media_type?: 'tv' | 'movie';
    poster_path: string | null;
    vote_average: number;
    first_air_date?: string;
    release_date?: string;
    overview?: string;
  };
  featured?: boolean; // kept for backwards compatibility but we won't use it for sizing anymore
}

export default function ShowCard({ show, featured = false }: ShowCardProps) {
  const imageUrl = getImageUrl(show.poster_path || '', 'w500');
  const displayName = show.name || show.title;
  const isMovie = show.media_type === 'movie' || !!show.title;
  const linkPath = isMovie ? `/movie/${show.id}` : `/show/${show.id}`;
  
  const releaseDate = show.first_air_date || show.release_date;
  const year = releaseDate ? new Date(releaseDate).getFullYear() : null;

  return (
    <Link href={linkPath} className="block flex-shrink-0 relative rounded-xl overflow-hidden w-40 h-64 sm:w-44 sm:h-72 snap-center shadow-lg group border border-border/30">
      <Image
        src={imageUrl}
        alt={displayName || 'Unknown'}
        fill
        className="object-cover transition-transform duration-500 group-hover:scale-105"
        sizes="(max-width: 640px) 160px, 176px"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent opacity-90 flex flex-col justify-end p-3 transition-opacity group-hover:opacity-100">
        <h3 className="font-bold text-white text-sm leading-tight drop-shadow-md line-clamp-2 mb-1">{displayName}</h3>
        
        <div className="flex flex-wrap items-center gap-2 mb-2">
          {year && (
            <span className="text-[10px] font-bold text-white/70 bg-white/10 px-1.5 py-0.5 rounded">{year}</span>
          )}
          <span className="uppercase bg-white/20 backdrop-blur-md border border-white/10 rounded text-white font-bold shadow-lg text-[9px] px-1.5 py-0.5">
            {isMovie ? 'Movie' : 'TV'}
          </span>
          <span className="text-accent font-black drop-shadow-md text-[11px] ml-auto">★ {show.vote_average?.toFixed(1) || 'N/A'}</span>
        </div>
        
        {show.overview && (
          <p className="text-[10px] text-white/60 line-clamp-2 leading-snug">
            {show.overview}
          </p>
        )}
      </div>
    </Link>
  );
}
