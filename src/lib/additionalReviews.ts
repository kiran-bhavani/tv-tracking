export interface ExtraReview {
  id: string;
  author: string;
  avatar?: string;
  source: 'Rotten Tomatoes' | 'Letterboxd' | 'MyAnimeList' | 'Douban';
  text: string;
  rating?: number;
  isSpoiler: boolean;
}

export async function fetchJikanAnimeReviews(title: string): Promise<ExtraReview[]> {
  try {
    const searchRes = await fetch(`https://api.jikan.moe/v4/anime?q=${encodeURIComponent(title)}&limit=1`, {
      next: { revalidate: 86400 }
    });
    if (!searchRes.ok) return [];
    const searchData = await searchRes.json();
    const animeId = searchData?.data?.[0]?.mal_id;

    if (!animeId) return [];

    const revRes = await fetch(`https://api.jikan.moe/v4/anime/${animeId}/reviews?limit=2`, {
      next: { revalidate: 86400 }
    });
    if (!revRes.ok) return [];
    const revData = await revRes.json();

    const reviews: ExtraReview[] = [];
    (revData?.data || []).forEach((r: any) => {
      if (r.review && r.user?.username) {
        reviews.push({
          id: `mal_${r.mal_id}`,
          author: r.user.username,
          avatar: r.user.images?.jpg?.image_url,
          source: 'MyAnimeList',
          text: r.review.length > 200 ? r.review.substring(0, 200) + '...' : r.review,
          rating: r.score ? Math.round(r.score) : undefined,
          isSpoiler: r.is_spoiler || false
        });
      }
    });

    return reviews;
  } catch (err) {
    console.error("Jikan API error:", err);
    return [];
  }
}

export async function fetchRottenTomatoesReviews(_title: string): Promise<ExtraReview[]> {
  // Rotten Tomatoes does not offer a public API.
  // To integrate real RT scores, use the OMDB API which returns RT% via the Ratings field.
  // This stub is kept for future integration — return empty for now.
  return [];
}

// Letterboxd and Douban don't have public APIs for review fetching.
// These are intentionally left as no-ops until a proper integration is available.

