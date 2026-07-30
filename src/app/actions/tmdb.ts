"use server";

import { getEpisodeDetails, getTrendingShows, getTrendingMovies, getShowDetails, getMovieDetails } from '@/lib/tmdb';
import { fetchTvmazeShow } from '@/lib/tvmaze';

export async function fetchTmdbEpisodeAction(showId: number | string, seasonNumber: number | string, episodeNumber: number | string) {
  try {
    const data = await getEpisodeDetails(showId, seasonNumber, episodeNumber);
    return data;
  } catch (error) {
    console.error("Failed to fetch TMDB episode in Server Action", error);
    return null;
  }
}

/**
 * Dynamic Trending Trailers & Clips Action
 * Fetches current trending TV shows & movies from TMDB and gets their official YouTube video keys.
 */
export async function fetchTrendingTrailersAction() {
  try {
    const [tvRes, movieRes] = await Promise.allSettled([
      getTrendingShows('week'),
      getTrendingMovies('week')
    ]);

    const tvItems = tvRes.status === 'fulfilled' ? (tvRes.value.results || []).slice(0, 4) : [];
    const movieItems = movieRes.status === 'fulfilled' ? (movieRes.value.results || []).slice(0, 4) : [];

    const combined = [...movieItems, ...tvItems].sort(() => 0.5 - Math.random());

    const videoPromises = combined.map(async (item: any) => {
      try {
        const isMovie = item.title !== undefined;
        const details = isMovie 
          ? await getMovieDetails(item.id).catch(() => null)
          : await getShowDetails(item.id).catch(() => null);

        const videos = details?.videos?.results || [];
        const trailer = videos.find((v: any) => v.site === 'YouTube' && (v.type === 'Trailer' || v.type === 'Teaser')) || videos[0];

        if (!trailer?.key) return null;

        return {
          id: item.id,
          title: item.title || item.name,
          media_type: isMovie ? 'movie' : 'tv',
          type: trailer.type || 'Official Trailer',
          videoKey: trailer.key,
          backdrop_path: item.backdrop_path || item.poster_path,
          poster_path: item.poster_path
        };
      } catch {
        return null;
      }
    });

    const results = await Promise.all(videoPromises);
    return results.filter(Boolean);
  } catch (error) {
    console.error("Failed to fetch trending trailers", error);
    return [];
  }
}

/**
 * Watchlist Calendar Schedule Action
 * Fetches real upcoming air dates for watchlist shows using TMDB + TVmaze multi-source fallback.
 */
export async function fetchWatchlistScheduleAction(shows: Array<{ id: number; name: string; type?: string; poster_path?: string }>) {
  try {
    const tvShows = shows.filter(s => s.type !== 'movie');

    const schedulePromises = tvShows.map(async (show) => {
      try {
        // Source 1: TMDB
        const tmdbData = await getShowDetails(show.id).catch(() => null);
        const nextEp = tmdbData?.next_episode_to_air;

        if (nextEp?.air_date) {
          return {
            showId: show.id,
            showName: show.name,
            poster_path: show.poster_path || tmdbData.poster_path,
            season: nextEp.season_number ?? 1,
            episode: nextEp.episode_number ?? 1,
            episodeName: nextEp.name || `Episode ${nextEp.episode_number}`,
            airDate: nextEp.air_date,
            source: 'TMDB'
          };
        }

        // Source 2: TVmaze fallback (especially great for anime and non-US shows)
        const tvmazeData = await fetchTvmazeShow(show.name).catch(() => null);
        const embeddedNext = tvmazeData?._embedded?.nextepisode;

        if (embeddedNext?.airdate) {
          return {
            showId: show.id,
            showName: show.name,
            poster_path: show.poster_path,
            season: embeddedNext.season ?? 1,
            episode: embeddedNext.number ?? 1,
            episodeName: embeddedNext.name || `Episode ${embeddedNext.number}`,
            airDate: embeddedNext.airdate,
            source: 'TVmaze'
          };
        }

        return null;
      } catch {
        return null;
      }
    });

    const results = await Promise.all(schedulePromises);
    return results.filter(Boolean);
  } catch (error) {
    console.error("Failed to fetch watchlist schedule", error);
    return [];
  }
}
