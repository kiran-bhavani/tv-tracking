"use client";

import { useState } from "react";
import Image from "next/image";
import { ChevronDown, ChevronUp, Check, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getSeasonDetails } from "@/lib/tmdb";
import { getImageUrl } from "@/lib/utils";
import EpisodeRow from "./EpisodeRow";
import EpisodeDetailsModal from "./EpisodeDetailsModal";
import MediaGallery from "./MediaGallery";
import { useStore, WatchedEpisode } from "@/store/useStore";
import { cacheManager } from "@/lib/cache";

interface SeasonAccordionProps {
  showId: number;
  seasons: any[];
}

export default function SeasonAccordion({ showId, seasons }: SeasonAccordionProps) {
  const [expandedSeason, setExpandedSeason] = useState<number | null>(null);
  const [seasonDataCache, setSeasonDataCache] = useState<Record<number, any>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [selectedEpisodeIndex, setSelectedEpisodeIndex] = useState<number | null>(null);
  
  const markSeasonAsWatched = useStore((state) => state.markSeasonAsWatched);
  const watchedEpisodes = useStore((state) => state.watchedEpisodes);

  // Filter out season 0 (Specials) if preferred, or keep it. TV Time usually shows it at the bottom.
  const validSeasons = seasons.filter(s => s.season_number > 0).sort((a, b) => b.season_number - a.season_number); // Show newest first? TV Time usually shows oldest first.
  const sortedSeasons = validSeasons.sort((a, b) => a.season_number - b.season_number);

  const toggleSeason = async (seasonNumber: number) => {
    if (expandedSeason === seasonNumber) {
      setExpandedSeason(null);
      return;
    }

    setExpandedSeason(seasonNumber);
    
    // Fetch if not in cache
    if (!seasonDataCache[seasonNumber]) {
      const cacheKey = `season_${showId}_${seasonNumber}`;
      const cached = cacheManager.get<any>(cacheKey);
      
      if (cached) {
        setSeasonDataCache(prev => ({ ...prev, [seasonNumber]: cached }));
      } else {
        setIsLoading(true);
        try {
          const data = await getSeasonDetails(showId, seasonNumber);
          setSeasonDataCache(prev => ({ ...prev, [seasonNumber]: data }));
          cacheManager.set(cacheKey, data);
        } catch (error) {
          console.error("Failed to fetch season details", error);
        } finally {
          setIsLoading(false);
        }
      }
    }
  };

  const handleMarkSeasonWatched = (e: React.MouseEvent, seasonNumber: number) => {
    e.stopPropagation(); // Prevent accordion toggle
    
    // We need the episode IDs to mark them as watched.
    // If we haven't fetched the season yet, we must fetch it first.
    const runMarkWatched = async () => {
      let episodes = seasonDataCache[seasonNumber]?.episodes;
      if (!episodes) {
        const cacheKey = `season_${showId}_${seasonNumber}`;
        const cached = cacheManager.get<any>(cacheKey);
        
        let data;
        if (cached) {
          data = cached;
        } else {
          data = await getSeasonDetails(showId, seasonNumber);
          cacheManager.set(cacheKey, data);
        }
        
        setSeasonDataCache(prev => ({ ...prev, [seasonNumber]: data }));
        episodes = data.episodes;
      }
      
      if (episodes) {
        const watchedPayload: WatchedEpisode[] = episodes.map((ep: any) => ({
          id: ep.id,
          season: seasonNumber,
          episode: ep.episode_number
        }));
        markSeasonAsWatched(showId, watchedPayload);
      }
    };
    
    runMarkWatched();
  };

  return (
    <div className="flex flex-col gap-3">
      {sortedSeasons.map((season: any) => {
        const isExpanded = expandedSeason === season.season_number;
        const posterUrl = getImageUrl(season.poster_path, 'w500');
        const seasonDetails = seasonDataCache[season.season_number];
        
        const showWatchedList = watchedEpisodes?.[showId] || [];
        const seasonWatchedCount = showWatchedList.filter((ep: any) => ep.season === season.season_number).length;
        const isFullyWatched = season.episode_count > 0 && seasonWatchedCount >= season.episode_count;

        return (
          <div key={season.id} className="bg-muted rounded-xl overflow-hidden shadow-lg border border-border">
            {/* Header (Clickable) */}
            <div 
              className="flex items-center pr-4 cursor-pointer hover:bg-muted/80 transition-colors"
              onClick={() => toggleSeason(season.season_number)}
            >
              <div className="w-16 h-24 relative bg-muted-foreground/20 flex-shrink-0">
                {season.poster_path && (
                  <Image src={posterUrl} alt={season.name} fill className="object-cover" />
                )}
              </div>
              <div className="flex-1 pl-4 py-3">
                <h4 className="font-bold text-foreground text-base">{season.name}</h4>
                <p className="text-xs font-medium text-accent mt-0.5">{season.episode_count} Episodes</p>
                {season.air_date && (
                  <p className="text-[10px] text-muted-foreground mt-1">{new Date(season.air_date).getFullYear()}</p>
                )}
              </div>
              
              {/* Check All Button */}
              <button 
                onClick={(e) => handleMarkSeasonWatched(e, season.season_number)}
                className={`w-10 h-10 rounded-full flex items-center justify-center border transition-colors mr-2 ${
                  isFullyWatched 
                    ? 'bg-accent border-accent text-accent-foreground' 
                    : 'bg-background border-border text-muted-foreground hover:text-accent-foreground hover:bg-accent/50'
                }`}
                aria-label="Mark season as watched"
              >
                <Check className="w-5 h-5" />
              </button>

              {/* Chevron */}
              <div className="text-muted-foreground">
                {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </div>
            </div>

            {/* Accordion Content */}
            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden bg-background"
                >
                  <div className="flex flex-col border-t border-border">
                    {isLoading && !seasonDetails ? (
                      <div className="flex justify-center py-6">
                        <Loader2 className="w-6 h-6 animate-spin text-accent" />
                      </div>
                    ) : seasonDetails ? (
                      <>
                        {seasonDetails.overview && (
                          <div className="px-4 pt-5 text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                            {seasonDetails.overview}
                          </div>
                        )}
                        {(seasonDetails.videos?.results?.length > 0 || seasonDetails.images?.posters?.length > 0) && (
                          <div className="-mt-2 mb-2">
                            <MediaGallery 
                              title="Season Trailers & Posters" 
                              videos={seasonDetails.videos?.results} 
                              images={seasonDetails.images?.posters?.slice(0, 8)} 
                            />
                          </div>
                        )}
                        <div className="p-4 flex flex-col gap-3">
                          {seasonDetails.episodes?.length > 0 ? (
                            seasonDetails.episodes.map((episode: any, index: number) => (
                              <EpisodeRow 
                                key={episode.id} 
                                episode={episode} 
                                showId={showId}
                                allEpisodes={seasonDetails.episodes}
                                onClick={() => setSelectedEpisodeIndex(index)}
                              />
                            ))
                          ) : (
                            <p className="text-center text-sm text-muted-foreground py-4">No episodes available.</p>
                          )}
                        </div>
                      </>
                    ) : (
                      <p className="text-center text-sm text-muted-foreground py-4">Failed to load season data.</p>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
      
      {/* Swipeable Full Screen Modal */}
      {selectedEpisodeIndex !== null && expandedSeason !== null && seasonDataCache[expandedSeason]?.episodes && (
        <EpisodeDetailsModal 
          showId={showId}
          allEpisodes={seasonDataCache[expandedSeason].episodes}
          initialEpisodeIndex={selectedEpisodeIndex}
          onClose={() => setSelectedEpisodeIndex(null)}
        />
      )}
    </div>
  );
}
