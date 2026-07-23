"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { Check, X, Star, Calendar } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { getImageUrl } from '@/lib/utils';
import { useStore } from '@/store/useStore';
import { logActivity } from '@/lib/activity';
import EpisodeComments from './EpisodeComments';
import { fetchOmdbEpisodeDetails, OmdbEpisodeData } from '@/lib/omdb';
import { fetchTraktEpisodeAction } from '@/app/actions/trakt';
import { fetchTvmazeEpisodeAction } from '@/app/actions/tvmaze';
import { fetchTmdbEpisodeAction } from '@/app/actions/tmdb';
import OverviewText from './OverviewText';
import MediaGallery from './MediaGallery';

interface EpisodeDetailsModalProps {
  showId: number;
  allEpisodes: any[];
  initialEpisodeIndex: number;
  onClose: () => void;
}

const swipeConfidenceThreshold = 10000;
const swipePower = (offset: number, velocity: number) => {
  return Math.abs(offset) * velocity;
};

export default function EpisodeDetailsModal({ showId, allEpisodes, initialEpisodeIndex, onClose }: EpisodeDetailsModalProps) {
  const [currentIndex, setCurrentIndex] = useState(initialEpisodeIndex);
  const [direction, setDirection] = useState(0);
  const [omdbData, setOmdbData] = useState<OmdbEpisodeData | null>(null);
  const [episodeDetails, setEpisodeDetails] = useState<any>(null);

  const episode = allEpisodes[currentIndex];
  const seasonNumber = episode?.season_number || 1;

  const watchedEpisodes = useStore((state) => state.watchedEpisodes);
  const watchlist = useStore((state) => state.watchlist);
  const toggleEpisodeWatched = useStore((state) => state.toggleEpisodeWatched);

  const showName = watchlist[showId]?.name || 'Unknown Show';
  const showEpisodes = (watchedEpisodes[showId] || []).filter(e => typeof e === 'object' && e !== null) as any[];
  const isWatched = showEpisodes.some(e => e.id === episode?.id);

  // Lazy load Trakt/OMDb data if TMDB overview is missing
  useEffect(() => {
    let isMounted = true;
    setOmdbData(null); // Reset when switching episodes

    if (episode && (!episode.overview || episode.overview.length < 10) && showName !== 'Unknown Show') {
      const fetchFallbacks = async () => {
        // Try Trakt first
        const trakt = await fetchTraktEpisodeAction(showId, seasonNumber, episode.episode_number);
        if (isMounted && trakt && trakt.overview) {
          setOmdbData({ overview: trakt.overview, imdbRating: null });
          return;
        }
        
        // If Trakt fails, try TVmaze
        const tvmaze = await fetchTvmazeEpisodeAction(showName, seasonNumber, episode.episode_number);
        if (isMounted && tvmaze && tvmaze.overview) {
          setOmdbData({ overview: tvmaze.overview, imdbRating: null });
          return;
        }

        // If TVmaze fails, try OMDb
        const omdb = await fetchOmdbEpisodeDetails(showName, seasonNumber, episode.episode_number);
        if (isMounted && omdb) {
          setOmdbData(omdb);
        }
      };
      
      fetchFallbacks();
    }

    return () => {
      isMounted = false;
    };
  }, [episode?.id, showId, showName, seasonNumber, episode?.episode_number, episode?.overview]);

  // Lazy load TMDB rich media (Videos & Images)
  useEffect(() => {
    let isMounted = true;
    setEpisodeDetails(null);
    if (episode) {
      fetchTmdbEpisodeAction(showId, seasonNumber, episode.episode_number).then(data => {
        if (isMounted && data) {
          setEpisodeDetails(data);
        }
      });
    }
    return () => { isMounted = false; };
  }, [showId, seasonNumber, episode?.episode_number]);

  const handleToggle = () => {
    if (!episode) return;
    
    if (!isWatched) {
      logActivity(showId, showName, seasonNumber, episode.episode_number, episode.name);
    }
    
    toggleEpisodeWatched(showId, {
      id: episode.id,
      season: seasonNumber,
      episode: episode.episode_number
    });
  };

  const paginate = (newDirection: number) => {
    const newIndex = currentIndex + newDirection;
    if (newIndex >= 0 && newIndex < allEpisodes.length) {
      setDirection(newDirection);
      setCurrentIndex(newIndex);
    }
  };

  // Prevent background scrolling when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  if (!episode) return null;

  const stillUrl = getImageUrl(episode.still_path, 'w500');

  const variants = {
    enter: (direction: number) => {
      return {
        x: direction > 0 ? 1000 : -1000,
        opacity: 0
      };
    },
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1
    },
    exit: (direction: number) => {
      return {
        zIndex: 0,
        x: direction < 0 ? 1000 : -1000,
        opacity: 0
      };
    }
  };

  return (
    <motion.div 
      initial={{ y: "100%" }}
      animate={{ y: 0 }}
      exit={{ y: "100%" }}
      transition={{ type: "spring", damping: 25, stiffness: 200 }}
      className="fixed inset-0 z-[60] bg-background flex flex-col overflow-hidden"
    >
      {/* Close Button (Fixed outside the swipeable area to prevent it sliding) */}
      <div className="absolute top-safe right-4 mt-4 z-[70]">
        <button 
          onClick={onClose}
          className="w-10 h-10 bg-black/50 hover:bg-black/70 transition-colors rounded-full flex items-center justify-center text-white backdrop-blur-md border border-white/20 shadow-lg"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      <AnimatePresence initial={false} custom={direction}>
        <motion.div
          key={currentIndex}
          custom={direction}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{
            x: { type: "spring", stiffness: 300, damping: 30 },
            opacity: { duration: 0.2 }
          }}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={1}
          onDragEnd={(e, { offset, velocity }) => {
            const swipe = swipePower(offset.x, velocity.x);

            if (swipe < -swipeConfidenceThreshold) {
              paginate(1);
            } else if (swipe > swipeConfidenceThreshold) {
              paginate(-1);
            }
          }}
          className="absolute inset-0 flex flex-col overflow-y-auto hide-scrollbar"
        >
          {/* Header Image (Cinematic) */}
          <div className="h-80 sm:h-96 relative bg-muted w-full flex-shrink-0">
            {episode.still_path ? (
              <Image src={stillUrl} alt={episode.name} fill className="object-cover" priority />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground bg-muted border-b border-border">No Image Available</div>
            )}
            
            {/* Dark Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />

            {/* Title Overlay */}
            <div className="absolute bottom-0 left-0 w-full p-6 pb-4">
              <div className="flex justify-between items-center mb-2">
                <p className="text-accent font-black text-sm uppercase tracking-wider drop-shadow-md">Episode {episode.episode_number}</p>
                
                {/* Mark Watched Toggle */}
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggle();
                  }}
                  className={`w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-md transition-all shadow-lg ${
                    isWatched 
                      ? 'bg-accent text-accent-foreground shadow-[0_0_15px_rgba(251,191,36,0.3)]' 
                      : 'bg-black/50 hover:bg-black/70 text-white border border-white/20'
                  }`}
                  title={isWatched ? "Marked as Watched" : "Mark as Watched"}
                >
                  <Check className={`w-5 h-5 ${isWatched ? 'stroke-[3px]' : ''}`} />
                </button>
              </div>
              
              <h2 className="text-3xl sm:text-4xl font-black text-foreground leading-tight drop-shadow-md">{episode.name}</h2>
              
              <div className="flex flex-wrap gap-3 mt-4 text-xs font-bold text-muted-foreground">
                <span className="flex items-center gap-1 bg-black/40 backdrop-blur-md px-2.5 py-1.5 rounded text-white border border-white/10 shadow-lg">
                  <Star className="w-4 h-4 text-accent fill-accent" />
                  {episode.vote_average?.toFixed(1) || 'N/A'} {omdbData?.imdbRating && `• IMDb ${omdbData.imdbRating}`}
                </span>
                <span className="flex items-center gap-1 bg-black/40 backdrop-blur-md px-2.5 py-1.5 rounded text-white border border-white/10 shadow-lg">
                  <Calendar className="w-4 h-4" />
                  {episode.air_date ? new Date(episode.air_date).toLocaleDateString() : 'TBA'}
                </span>
                {episode.runtime > 0 && (
                  <span className="flex items-center gap-1 bg-black/40 backdrop-blur-md px-2.5 py-1.5 rounded text-white border border-white/10 shadow-lg">
                    {episode.runtime} min
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Content (Scrollable) */}
          <div className="px-6 pt-6 pb-12 relative z-10 flex-1">
            {/* Crew (Director / Writer) */}
            {episode.crew && episode.crew.length > 0 && (
              <div className="flex flex-wrap gap-x-8 gap-y-4 mb-8">
                {episode.crew.find((c: any) => c.job === 'Director') && (
                  <div>
                    <p className="text-[11px] text-muted-foreground uppercase font-bold tracking-wider mb-0.5">Director</p>
                    <Link href={`/person/${episode.crew.find((c: any) => c.job === 'Director').id}`} className="text-base font-bold text-foreground hover:text-accent transition-colors">
                      {episode.crew.find((c: any) => c.job === 'Director').name}
                    </Link>
                  </div>
                )}
                {episode.crew.find((c: any) => c.job === 'Writer' || c.department === 'Writing') && (
                  <div>
                    <p className="text-[11px] text-muted-foreground uppercase font-bold tracking-wider mb-0.5">Writer</p>
                    <Link href={`/person/${episode.crew.find((c: any) => c.job === 'Writer' || c.department === 'Writing').id}`} className="text-base font-bold text-foreground hover:text-accent transition-colors">
                      {episode.crew.find((c: any) => c.job === 'Writer' || c.department === 'Writing').name}
                    </Link>
                  </div>
                )}
              </div>
            )}

            <div className="-mx-4 -mt-8">
              <OverviewText 
                initialText={omdbData?.overview || episode.overview || ""} 
                language="en" 
                type="episode" 
                title={showName} 
                season={seasonNumber} 
                episode={episode.episode_number} 
              />
            </div>

            {(episodeDetails?.videos?.results?.length > 0 || episodeDetails?.images?.stills?.length > 0) && (
              <div className="-mx-4 mt-2 mb-6">
                <MediaGallery 
                  title="Episode Previews & Photos" 
                  videos={episodeDetails.videos?.results} 
                  images={episodeDetails.images?.stills?.slice(0, 8)} 
                />
              </div>
            )}

            {episode.guest_stars && episode.guest_stars.length > 0 && (
              <div className="mt-10">
                <h3 className="font-bold text-foreground mb-4 text-xl">Guest Stars</h3>
                <div className="flex overflow-x-auto gap-5 pb-4 snap-x hide-scrollbar -mx-6 px-6">
                  {episode.guest_stars.map((star: any) => (
                    <Link href={`/person/${star.id}`} key={star.id} className="flex-shrink-0 w-24 snap-start group">
                      <div className="w-24 h-24 rounded-full bg-muted border border-border overflow-hidden relative mb-3 group-hover:border-accent transition-colors shadow-md">
                        {star.profile_path ? (
                          <Image src={getImageUrl(star.profile_path, 'w185')} alt={star.name} fill className="object-cover" />
                        ) : (
                           <div className="w-full h-full flex items-center justify-center text-muted-foreground text-[10px]">No Photo</div>
                        )}
                      </div>
                      <p className="text-sm font-bold text-foreground text-center leading-tight group-hover:text-accent transition-colors line-clamp-2">{star.name}</p>
                      <p className="text-[11px] text-muted-foreground text-center truncate leading-tight mt-1">{star.character}</p>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Comments Section */}
            <div className="mt-10 pt-8 border-t border-border/50">
              <EpisodeComments 
                showId={showId} 
                seasonNumber={seasonNumber} 
                episodeNumber={episode.episode_number} 
              />
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}
