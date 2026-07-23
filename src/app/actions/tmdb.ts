"use server";

import { getEpisodeDetails } from '@/lib/tmdb';

export async function fetchTmdbEpisodeAction(showId: number | string, seasonNumber: number | string, episodeNumber: number | string) {
  try {
    const data = await getEpisodeDetails(showId, seasonNumber, episodeNumber);
    return data;
  } catch (error) {
    console.error("Failed to fetch TMDB episode in Server Action", error);
    return null;
  }
}
