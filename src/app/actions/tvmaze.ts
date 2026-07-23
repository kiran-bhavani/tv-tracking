"use server";

import { fetchTvmazeEpisode } from '@/lib/tvmaze';

export async function fetchTvmazeEpisodeAction(showName: string, season: number, episode: number) {
  try {
    const data = await fetchTvmazeEpisode(showName, season, episode);
    if (data && data.summary) {
      return { overview: data.summary };
    }
    return null;
  } catch (error) {
    console.error("Failed to fetch TVmaze episode in Server Action", error);
    return null;
  }
}
