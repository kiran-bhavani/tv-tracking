import { useEffect, useRef } from 'react';
import { useStore } from '@/store/useStore';
import { fetchWatchlistScheduleAction } from '@/app/actions/tmdb';

export function useNotificationEngine() {
  const hasRun = useRef(false);
  
  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;
    
    if (typeof window === 'undefined') return;

    // Throttle checks to once every 4 hours per session to avoid TMDB spam on rapid reloads
    const lastCheck = sessionStorage.getItem('lastNotificationCheck');
    const now = Date.now();
    if (lastCheck && now - parseInt(lastCheck) < 1000 * 60 * 60 * 4) {
      return;
    }
    sessionStorage.setItem('lastNotificationCheck', now.toString());

    const checkUpcoming = async () => {
      // Use getState to avoid subscribing to all state changes (runs once)
      const state = useStore.getState();
      const watchlist = state.watchlist;
      const activeTvShows = Object.values(watchlist || {}).filter(show => show && show.type !== 'movie');
      
      if (activeTvShows.length === 0) return;
      
      try {
        const rawSchedule = await fetchWatchlistScheduleAction(
          activeTvShows.map(s => ({ id: s.id, name: s.name, type: s.type }))
        );
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        for (const item of (rawSchedule || [])) {
          if (!item) continue;
          
          const epData = (state.watchedEpisodes || {})[item.showId] || [];
          const watchedEps = (Array.isArray(epData) ? epData : []).filter(e => typeof e === 'object' && e !== null) as any[];
          const isWatched = watchedEps.some(e => e.season === item.season && e.episode === item.episode);
          
          if (isWatched) continue;
          
          const airDate = new Date(item.airDate);
          const daysOffset = Math.round((airDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          
          // Only notify for today (0) or tomorrow (1)
          if (daysOffset === 0 || daysOffset === 1) {
            const timeLabel = daysOffset === 0 ? "today" : "tomorrow";
            const notifId = `upcoming_${item.showId}_s${item.season}e${item.episode}`;
            
            state.addNotification({
              id: notifId,
              type: 'upcoming',
              title: `${item.showName} is airing ${timeLabel}!`,
              message: `Season ${item.season} Episode ${item.episode}${item.episodeName ? ` "${item.episodeName}"` : ''} drops ${timeLabel}.`,
              timestamp: new Date().toISOString(),
              read: false,
              targetUrl: `/show/${item.showId}`,
              iconBg: 'bg-accent/10',
              iconColor: 'text-accent'
            });
          }
        }
      } catch (err) {
        console.error("Notification engine failed:", err);
      }
    };
    
    // Small delay so it doesn't block critical main thread work on startup
    setTimeout(checkUpcoming, 3000);
  }, []);
}
