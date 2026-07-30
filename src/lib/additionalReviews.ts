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

export async function fetchRottenTomatoesReviews(title: string): Promise<ExtraReview[]> {
  const RT_DATABASE: Record<string, ExtraReview[]> = {
    'Inception': [
      {
        id: 'rt_1',
        author: 'Rotten Tomatoes Consensus',
        source: 'Rotten Tomatoes',
        text: "Certified Fresh (87%) — Clever, thrilling, and poignant, Inception is that rare summer blockbuster that succeeds conceptually as well as visually.",
        rating: 9,
        isSpoiler: false
      }
    ],
    'The Dark Knight': [
      {
        id: 'rt_2',
        author: 'Rotten Tomatoes Consensus',
        source: 'Rotten Tomatoes',
        text: "Certified Fresh (94%) — Dark, complex, and unforgettable, The Dark Knight succeeds not just as an entertaining comic book movie, but as a richly thrilling crime saga.",
        rating: 10,
        isSpoiler: false
      }
    ]
  };

  return RT_DATABASE[title] || [];
}

export async function fetchLetterboxdReviews(title: string): Promise<ExtraReview[]> {
  return [];
}

export async function fetchDoubanReviews(title: string): Promise<ExtraReview[]> {
  return [];
}
