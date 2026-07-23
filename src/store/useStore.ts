import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface WatchlistShow {
  id: number;
  name: string;
  poster_path: string | null;
  backdrop_path: string | null;
  number_of_seasons: number;
  number_of_episodes?: number;
  type: 'tv' | 'movie'; // for future proofing
  runtime?: number;
  genres?: { id: number, name: string }[];
}

export interface WatchedEpisode {
  id: number;
  season: number;
  episode: number;
}

export interface CustomList {
  id: string;
  name: string;
  description: string;
  shows: number[]; // Array of show/movie IDs
}

interface AppState {
  watchlist: Record<number, WatchlistShow>;
  watchedEpisodes: Record<number, WatchedEpisode[]>; // showId -> array of episode objects
  customLists: CustomList[];
  
  addToWatchlist: (show: WatchlistShow) => void;
  removeFromWatchlist: (showId: number) => void;
  toggleEpisodeWatched: (showId: number, episode: WatchedEpisode) => void;
  markPreviousAsWatched: (showId: number, currentSeason: number, currentEpisode: number, allEpisodes: WatchedEpisode[]) => void;
  markSeasonAsWatched: (showId: number, seasonEpisodes: WatchedEpisode[]) => void;
  markShowAsFinished: (showId: number, allEpisodes: WatchedEpisode[]) => void;
  
  createList: (name: string, description: string, shows?: number[]) => void;
  updateList: (listId: string, name: string, description: string, shows?: number[]) => void;
  deleteList: (listId: string) => void;
  addToList: (listId: string, showId: number) => void;
  removeFromList: (listId: string, showId: number) => void;
  
  setStoreData: (watchlist: Record<number, WatchlistShow>, watchedEpisodes: Record<number, WatchedEpisode[]>, customLists?: CustomList[]) => void;
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      watchlist: {},
      watchedEpisodes: {},
      customLists: [],

      addToWatchlist: (show) => set((state) => ({
        watchlist: { ...state.watchlist, [show.id]: show },
        watchedEpisodes: { ...state.watchedEpisodes, [show.id]: state.watchedEpisodes[show.id] || [] }
      })),

      removeFromWatchlist: (showId) => set((state) => {
        const newWatchlist = { ...state.watchlist };
        delete newWatchlist[showId];
        return { watchlist: newWatchlist };
      }),

      toggleEpisodeWatched: (showId, episode) => set((state) => {
        // Clean out legacy number arrays if they exist
        const showEpisodes = (state.watchedEpisodes[showId] || []).filter(e => typeof e === 'object' && e !== null) as WatchedEpisode[];
        const isWatched = showEpisodes.some(e => e.id === episode.id);
        
        return {
          watchedEpisodes: {
            ...state.watchedEpisodes,
            [showId]: isWatched 
              ? showEpisodes.filter(e => e.id !== episode.id)
              : [...showEpisodes, episode]
          }
        };
      }),

      markPreviousAsWatched: (showId, currentSeason, currentEpisode, allEpisodes) => set((state) => {
        const showEpisodes = (state.watchedEpisodes[showId] || []).filter(e => typeof e === 'object' && e !== null) as WatchedEpisode[];
        const existingIds = new Set(showEpisodes.map(e => e.id));
        
        // Find all episodes that are before or equal to the current one
        const previousEpisodes = allEpisodes.filter(e => 
          e.season < currentSeason || 
          (e.season === currentSeason && e.episode <= currentEpisode)
        );

        const newWatched = [...showEpisodes];
        previousEpisodes.forEach(ep => {
          if (!existingIds.has(ep.id)) {
            newWatched.push(ep);
          }
        });

        return {
          watchedEpisodes: {
            ...state.watchedEpisodes,
            [showId]: newWatched
          }
        };
      }),

      markSeasonAsWatched: (showId, seasonEpisodes) => set((state) => {
        const showEpisodes = (state.watchedEpisodes[showId] || []).filter(e => typeof e === 'object' && e !== null) as WatchedEpisode[];
        const existingIds = new Set(showEpisodes.map(e => e.id));
        
        const newWatched = [...showEpisodes];
        seasonEpisodes.forEach(ep => {
          if (!existingIds.has(ep.id)) {
            newWatched.push(ep);
          }
        });

        return {
          watchedEpisodes: {
            ...state.watchedEpisodes,
            [showId]: newWatched
          }
        };
      }),

      markShowAsFinished: (showId, allEpisodes) => set((state) => {
        const showEpisodes = (state.watchedEpisodes[showId] || []).filter(e => typeof e === 'object' && e !== null) as WatchedEpisode[];
        const existingIds = new Set(showEpisodes.map(e => e.id));
        
        const newWatched = [...showEpisodes];
        allEpisodes.forEach(ep => {
          if (!existingIds.has(ep.id)) {
            newWatched.push(ep);
          }
        });

        return {
          watchedEpisodes: {
            ...state.watchedEpisodes,
            [showId]: newWatched
          }
        };
      }),

      createList: (name, description, shows = []) => set((state) => ({
        customLists: [...state.customLists, {
          id: crypto.randomUUID(),
          name,
          description,
          shows
        }]
      })),


      updateList: (listId, name, description, shows) => set((state) => ({
        customLists: state.customLists.map(list => 
          list.id === listId ? { ...list, name, description, ...(shows ? { shows } : {}) } : list
        )
      })),

      deleteList: (listId) => set((state) => ({
        customLists: state.customLists.filter(list => list.id !== listId)
      })),

      addToList: (listId, showId) => set((state) => ({
        customLists: state.customLists.map(list => {
          if (list.id === listId && !list.shows.includes(showId)) {
            return { ...list, shows: [...list.shows, showId] };
          }
          return list;
        })
      })),

      removeFromList: (listId, showId) => set((state) => ({
        customLists: state.customLists.map(list => {
          if (list.id === listId) {
            return { ...list, shows: list.shows.filter(id => id !== showId) };
          }
          return list;
        })
      })),

      setStoreData: (watchlist, watchedEpisodes, customLists = []) => set({ watchlist, watchedEpisodes, customLists })
    }),
    {
      name: 'tvtime-storage', // key in local storage
    }
  )
);
