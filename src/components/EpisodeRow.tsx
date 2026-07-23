"use client";

import { Check } from 'lucide-react';
import { useStore, WatchedEpisode } from '@/store/useStore';
import { useEffect, useState } from 'react';
import { motion, useAnimation, PanInfo } from 'framer-motion';
import { getImageUrl } from '@/lib/utils';
import { logActivity } from '@/lib/activity';

interface EpisodeRowProps {
  showId: number;
  episode: any;
  allEpisodes: any[];
  onClick: () => void;
}

export default function EpisodeRow({ showId, episode, allEpisodes, onClick }: EpisodeRowProps) {
  const [mounted, setMounted] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  
  const seasonNumber = episode.season_number;
  
  const watchedEpisodes = useStore((state) => state.watchedEpisodes);
  const watchlist = useStore((state) => state.watchlist);
  const toggleEpisodeWatched = useStore((state) => state.toggleEpisodeWatched);
  const markPreviousAsWatched = useStore((state) => state.markPreviousAsWatched);
  
  const controls = useAnimation();

  useEffect(() => {
    setMounted(true);
  }, []);

  const showEpisodes = (watchedEpisodes[showId] || []).filter(e => typeof e === 'object' && e !== null) as WatchedEpisode[];
  const isWatched = showEpisodes.some(e => e.id === episode.id);

  const handleToggle = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    
    if (!isWatched && episode.episode_number > 1) {
      // Prompt for previous episodes if checking an episode > 1
      const previousEpisodesWatched = allEpisodes
        .filter(e => e.episode_number < episode.episode_number)
        .every(e => showEpisodes.some(we => we.id === e.id));
      
      if (!previousEpisodesWatched) {
        setShowPrompt(true);
        return;
      }
    }
    
    executeToggle();
  };

  const executeToggle = () => {
    if (!isWatched) {
      const showName = watchlist[showId]?.name || 'Unknown Show';
      logActivity(showId, showName, seasonNumber, episode.episode_number, episode.name);
    }
    
    toggleEpisodeWatched(showId, {
      id: episode.id,
      season: seasonNumber,
      episode: episode.episode_number
    });
  };

  const handleCatchUp = () => {
    // Format allEpisodes to WatchedEpisode format for the store
    const formattedEpisodes = allEpisodes.map(ep => ({
      id: ep.id,
      season: ep.season_number,
      episode: ep.episode_number
    }));
    
    markPreviousAsWatched(showId, seasonNumber, episode.episode_number, formattedEpisodes);
    setShowPrompt(false);
  };

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (info.offset.x > 100) {
      handleToggle();
    }
    controls.start({ x: 0 }); // Snap back
  };

  return (
    <>
      <div className="relative rounded-xl overflow-hidden bg-accent">
        {/* Background reveals Check on swipe */}
        <div className="absolute inset-y-0 left-0 flex items-center px-6 text-accent-foreground font-bold">
          <Check className="w-6 h-6 mr-2" /> Mark Watched
        </div>

        <motion.div
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          onDragEnd={handleDragEnd}
          animate={controls}
          onClick={onClick}
          className="bg-card cursor-pointer border border-border rounded-xl p-4 flex gap-4 items-center relative z-10"
        >
          <div className="flex-1 min-w-0">
            <h4 className="font-bold text-foreground text-md truncate">
              {episode.episode_number}. {episode.name}
            </h4>
            <p className="text-xs text-muted-foreground mt-1">
              {episode.air_date ? new Date(episode.air_date).toLocaleDateString() : 'TBA'}
            </p>
            {episode.overview && (
              <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{episode.overview}</p>
            )}
          </div>

          <button
            onClick={handleToggle}
            className={`w-12 h-12 rounded-full flex justify-center items-center flex-shrink-0 transition-colors shadow-lg ${
              !mounted ? 'bg-muted' :
              isWatched ? 'bg-accent text-accent-foreground' : 'bg-muted text-foreground hover:bg-muted/80 border border-border'
            }`}
          >
            <Check className="w-6 h-6" />
          </button>
        </motion.div>
      </div>

      {/* Catch Up Prompt */}
      {showPrompt && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-foreground/80 backdrop-blur-sm">
          <div className="bg-card rounded-2xl p-6 max-w-sm w-full border border-border shadow-2xl">
            <h3 className="text-xl font-bold text-foreground mb-2">Catch up?</h3>
            <p className="text-muted-foreground text-sm mb-6">
              You are about to mark episode {episode.episode_number} as watched. Do you want to mark all previous episodes in this season as watched too?
            </p>
            <div className="flex flex-col gap-3">
              <button 
                onClick={handleCatchUp}
                className="w-full py-3 bg-accent text-accent-foreground font-bold rounded-xl"
              >
                Yes, mark all previous
              </button>
              <button 
                onClick={() => { setShowPrompt(false); executeToggle(); }}
                className="w-full py-3 bg-muted text-foreground font-bold rounded-xl"
              >
                No, just this one
              </button>
              <button 
                onClick={() => setShowPrompt(false)}
                className="w-full py-3 text-muted-foreground font-bold rounded-xl"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
