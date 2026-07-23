"use server";

// OMDB API key is stored in an environment variable (server-side only).
// Add OMDB_API_KEY to your .env.local file.
const OMDB_API_KEY = process.env.OMDB_API_KEY;

export interface OmdbEpisodeData {
  overview: string | null;
  imdbRating: string | null;
}

export async function fetchOmdbEpisodeDetails(showName: string, seasonNumber: number, episodeNumber: number): Promise<OmdbEpisodeData | null> {
  if (!OMDB_API_KEY) {
    console.warn("OMDB_API_KEY is not set. Skipping OMDB fetch.");
    return null;
  }
  try {
    const res = await fetch(`https://www.omdbapi.com/?apikey=${OMDB_API_KEY}&t=${encodeURIComponent(showName)}&Season=${seasonNumber}&Episode=${episodeNumber}`);
    
    if (!res.ok) return null;
    
    const data = await res.json();
    
    if (data.Response === "True") {
      return {
        overview: data.Plot && data.Plot !== "N/A" ? data.Plot : null,
        imdbRating: data.imdbRating && data.imdbRating !== "N/A" ? data.imdbRating : null,
      };
    }
    
    return null;
  } catch (error) {
    console.error("OMDb fetch error:", error);
    return null;
  }
}

export async function fetchOmdbDetails(title: string, type: 'movie' | 'tv'): Promise<OmdbEpisodeData | null> {
  if (!OMDB_API_KEY) {
    console.warn("OMDB_API_KEY is not set. Skipping OMDB fetch.");
    return null;
  }
  try {
    const searchType = type === 'movie' ? 'movie' : 'series';
    const res = await fetch(`https://www.omdbapi.com/?apikey=${OMDB_API_KEY}&t=${encodeURIComponent(title)}&type=${searchType}`);
    
    if (!res.ok) return null;
    
    const data = await res.json();
    
    if (data.Response === "True") {
      return {
        overview: data.Plot && data.Plot !== "N/A" ? data.Plot : null,
        imdbRating: data.imdbRating && data.imdbRating !== "N/A" ? data.imdbRating : null,
      };
    }
    
    return null;
  } catch (error) {
    console.error("OMDb fetch error:", error);
    return null;
  }
}
