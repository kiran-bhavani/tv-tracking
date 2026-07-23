// Server-side Trakt API helper
// This file should ONLY be imported in Server Components or Server Actions

const TRAKT_CLIENT_ID = process.env.TRAKT_CLIENT_ID;

export async function fetchTraktDetails(tmdbId: string | number, type: 'movie' | 'show' | 'episode', season?: number, episode?: number) {
  if (!TRAKT_CLIENT_ID) {
    console.warn("TRAKT_CLIENT_ID is not configured");
    return null;
  }

  let url = "";
  
  if (type === 'episode' && season !== undefined && episode !== undefined) {
    // Trakt supports tmdb:ID lookups directly
    url = `https://api.trakt.tv/shows/tmdb:${tmdbId}/seasons/${season}/episodes/${episode}?extended=full`;
  } else if (type === 'show') {
    url = `https://api.trakt.tv/shows/tmdb:${tmdbId}?extended=full`;
  } else if (type === 'movie') {
    url = `https://api.trakt.tv/movies/tmdb:${tmdbId}?extended=full`;
  } else {
    return null;
  }

  try {
    const res = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        'trakt-api-version': '2',
        'trakt-api-key': TRAKT_CLIENT_ID,
      },
      next: { revalidate: 86400 } // Cache for 24 hours
    });

    if (!res.ok) {
      console.error(`Trakt fetch failed: ${url} - Status: ${res.status}`);
      return null;
    }

    const data = await res.json();
    return data;
  } catch (e) {
    console.error("Trakt API Error:", e);
    return null;
  }
}
