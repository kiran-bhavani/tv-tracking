export interface AudienceComment {
  id: string;
  author: string;
  avatar?: string;
  source: 'Reddit' | 'Metacritic' | 'Letterboxd';
  text: string;
  rating?: number;
  isSpoiler: boolean;
  score?: number;
  createdAt?: string;
}

export async function fetchRedditComments(title: string, season?: number, episode?: number): Promise<AudienceComment[]> {
  try {
    const queryTerm = season && episode ? `${title} Season ${season} Episode ${episode}` : title;
    const url = `https://www.reddit.com/search.json?q=${encodeURIComponent(queryTerm)}&sort=relevance&limit=5`;

    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; TVTrackerApp/1.0)' },
      next: { revalidate: 1800 }
    });

    if (!res.ok) return [];
    const data = await res.json();
    const posts = data?.data?.children || [];

    const comments: AudienceComment[] = [];

    posts.forEach((post: any) => {
      const pData = post.data;
      if (pData && pData.title) {
        const bodyText = pData.selftext && pData.selftext.length > 20 
          ? (pData.selftext.length > 250 ? pData.selftext.substring(0, 250) + '...' : pData.selftext)
          : pData.title;

        comments.push({
          id: `reddit_${pData.id}`,
          author: `u/${pData.author || 'Redditor'} (r/${pData.subreddit || 'television'})`,
          avatar: 'https://www.redditstatic.com/shnooful.png',
          source: 'Reddit',
          text: bodyText,
          isSpoiler: pData.spoiler || false,
          score: pData.score || 0
        });
      }
    });

    return comments.slice(0, 4);
  } catch (err) {
    console.error("Reddit API error:", err);
    return [];
  }
}

export async function fetchMetacriticCriticReviews(_title: string, _type: 'show' | 'movie'): Promise<AudienceComment[]> {
  // Metacritic does not have a public API.
  // Professional critic reviews from Metacritic would require a scraping integration or
  // a licensed data provider. This stub returns empty until that integration is added.
  return [];
}

