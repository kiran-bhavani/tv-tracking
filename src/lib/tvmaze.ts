// Server-side / Client-side TVmaze API helper

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

export async function fetchTvmazeEpisode(showName: string, season: number, episode: number) {
  try {
    // First get the show ID
    const show = await fetchTvmazeShow(showName);
    if (!show || !show.id) return null;
    
    // Then fetch the episode by season and number
    const res = await fetch(`https://api.tvmaze.com/shows/${show.id}/episodebynumber?season=${season}&number=${episode}`, {
      next: { revalidate: 86400 }
    });
    if (!res.ok) return null;
    const data = await res.json();
    
    // TVmaze returns HTML tags in summary, we should strip them or let the frontend render them carefully
    // For now we strip simple tags
    if (data && data.summary) {
      data.summary = data.summary.replace(/<[^>]*>?/gm, ''); 
    }
    
    return data;
  } catch (error) {
    console.error("TVmaze Episode Error:", error);
    return null;
  }
}
