"use server";

import { fetchTraktDetails } from '@/lib/trakt';

export async function fetchTraktEpisodeAction(showTmdbId: number | string, seasonNumber: number, episodeNumber: number) {
  try {
    const data = await fetchTraktDetails(showTmdbId, 'episode', seasonNumber, episodeNumber);
    if (data && data.overview) {
      return { overview: data.overview };
    }
    return null;
  } catch (error) {
    console.error("Failed to fetch Trakt episode in Server Action", error);
    return null;
  }
}
