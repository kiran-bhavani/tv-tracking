"use server";

const TMDB_API_TOKEN = process.env.TMDB_API_TOKEN;
const BASE_URL = 'https://api.themoviedb.org/3';

const fetchOptions = {
  method: 'GET',
  headers: {
    accept: 'application/json',
    Authorization: `Bearer ${TMDB_API_TOKEN}`,
  },
  next: { revalidate: 3600 } // Cache heavily on the server for 1 hour to reduce TMDB hits
};

/**
 * Internal helper: fetch from TMDB and return parsed JSON.
 * Throws on non-ok responses for consistent error handling.
 */
async function fetchTMDB(path: string) {
  const res = await fetch(`${BASE_URL}${path}`, fetchOptions);
  if (!res.ok) throw new Error(`TMDB fetch failed for ${path}: ${res.status}`);
  return res.json();
}

export async function getTrendingShows(timeWindow: 'day' | 'week' = 'week') {
  return fetchTMDB(`/trending/tv/${timeWindow}?language=en-US`);
}

export async function getTrendingMovies(timeWindow: 'day' | 'week' = 'week') {
  return fetchTMDB(`/trending/movie/${timeWindow}?language=en-US`);
}

export async function getPopularShows() {
  return fetchTMDB('/tv/popular?language=en-US&page=1');
}

export async function getPopularMovies() {
  return fetchTMDB('/movie/popular?language=en-US&page=1');
}

export async function searchMulti(query: string) {
  return fetchTMDB(`/search/multi?query=${encodeURIComponent(query)}&include_adult=false&language=en-US&page=1`);
}

export const getShowCredits = async (id: string | number) => {
  return fetchTMDB(`/tv/${id}/credits`);
};

export const getUpcomingEpisodes = async (showIds: number[]) => {
  const promises = showIds.map(async (id) => {
    const data = await fetchTMDB(`/tv/${id}`);
    if (data.next_episode_to_air) {
      return {
        showId: id,
        showName: data.name,
        poster_path: data.poster_path,
        next_episode_to_air: data.next_episode_to_air
      };
    }
    return null;
  });

  const results = await Promise.all(promises);
  return results.filter(Boolean) as any[];
};

export async function getShowDetails(seriesId: string | number) {
  return fetchTMDB(`/tv/${seriesId}?append_to_response=credits,similar,recommendations,videos`);
}

export async function getSeasonDetails(seriesId: string | number, seasonNumber: string | number) {
  return fetchTMDB(`/tv/${seriesId}/season/${seasonNumber}`);
}

export async function getShowRecommendations(seriesId: string | number) {
  return fetchTMDB(`/tv/${seriesId}/recommendations?language=en-US&page=1`);
}

export async function getMovieRecommendations(movieId: string | number) {
  return fetchTMDB(`/movie/${movieId}/recommendations?language=en-US&page=1`);
}

export async function getGenres(type: 'tv' | 'movie' = 'tv') {
  return fetchTMDB(`/genre/${type}/list?language=en-US`);
}

export async function getDiscoverByGenre(type: 'tv' | 'movie', genreId: number, page: number = 1) {
  return fetchTMDB(`/discover/${type}?with_genres=${genreId}&page=${page}&sort_by=popularity.desc&language=en-US`);
}

export async function getPersonDetails(personId: string | number) {
  return fetchTMDB(`/person/${personId}?append_to_response=combined_credits&language=en-US`);
}

export async function getMovieDetails(movieId: string | number) {
  return fetchTMDB(`/movie/${movieId}?append_to_response=credits,similar,recommendations,videos`);
}
