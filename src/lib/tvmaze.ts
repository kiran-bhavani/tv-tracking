// Server-side / Client-side TVmaze API helper

export interface TvmazeEpisode {
  id: number;
  name: string;
  season: number;
  number: number;
  airdate: string;
  airstamp: string;
  runtime: number;
  image?: {
    medium?: string;
    original?: string;
  };
  summary?: string;
}

export async function fetchTvmazeShow(showName: string) {
  try {
    const res = await fetch(`https://api.tvmaze.com/singlesearch/shows?q=${encodeURIComponent(showName)}`, {
      next: { revalidate: 86400 }
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data;
  } catch (error) {
    console.error("TVmaze Show Error:", error);
    return null;
  }
}

export async function fetchTvmazeShowEpisodes(showName: string): Promise<TvmazeEpisode[]> {
  try {
    const show = await fetchTvmazeShow(showName);
    if (!show || !show.id) return [];

    const res = await fetch(`https://api.tvmaze.com/shows/${show.id}/episodes?specials=1`, {
      next: { revalidate: 86400 }
    });
    if (!res.ok) return [];
    const data = await res.json();

    return (data || []).map((ep: any) => ({
      ...ep,
      summary: ep.summary ? ep.summary.replace(/<[^>]*>?/gm, '') : ''
    }));
  } catch (error) {
    console.error("TVmaze Full Episodes Error:", error);
    return [];
  }
}

export async function fetchTvmazeSchedule(country: string = 'US'): Promise<any[]> {
  try {
    const res = await fetch(`https://api.tvmaze.com/schedule?country=${country}`, {
      next: { revalidate: 3600 }
    });
    if (!res.ok) return [];
    return await res.json();
  } catch (error) {
    console.error("TVmaze Schedule Error:", error);
    return [];
  }
}

export async function fetchTvmazeEpisode(showName: string, season: number, episode: number) {
  try {
    const show = await fetchTvmazeShow(showName);
    if (!show || !show.id) return null;
    
    const res = await fetch(`https://api.tvmaze.com/shows/${show.id}/episodebynumber?season=${season}&number=${episode}`, {
      next: { revalidate: 86400 }
    });
    if (!res.ok) return null;
    const data = await res.json();
    
    if (data && data.summary) {
      data.summary = data.summary.replace(/<[^>]*>?/gm, ''); 
    }
    
    return data;
  } catch (error) {
    console.error("TVmaze Episode Error:", error);
    return null;
  }
}
