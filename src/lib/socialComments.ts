export interface SocialComment {
  id: string;
  author: string;
  avatar?: string;
  platform: 'trakt' | 'simkl' | 'serializd';
  comment: string;
  rating?: number;
  isSpoiler: boolean;
  likes: number;
  createdAt: string;
  serializdUrl?: string;
}

export async function fetchSocialComments(
  type: 'show' | 'movie' | 'episode',
  title: string,
  id: number,
  season?: number,
  episode?: number
): Promise<SocialComment[]> {
  const comments: SocialComment[] = [];

  const traktClientId = process.env.NEXT_PUBLIC_TRAKT_CLIENT_ID || process.env.TRAKT_CLIENT_ID;

  if (traktClientId) {
    try {
      let endpoint = '';
      if (type === 'movie') {
        endpoint = `https://api.trakt.tv/movies/${id}/comments/trending`;
      } else if (type === 'show') {
        endpoint = `https://api.trakt.tv/shows/${id}/comments/trending`;
      } else if (type === 'episode' && season !== undefined && episode !== undefined) {
        endpoint = `https://api.trakt.tv/shows/${id}/seasons/${season}/episodes/${episode}/comments/trending`;
      }

      if (endpoint) {
        const res = await fetch(endpoint, {
          headers: {
            'Content-Type': 'application/json',
            'trakt-api-version': '2',
            'trakt-api-key': traktClientId
          },
          next: { revalidate: 3600 }
        });

        if (res.ok) {
          const data = await res.json();
          (data || []).slice(0, 10).forEach((item: any) => {
            if (item.comment) {
              comments.push({
                id: `trakt_${item.comment.id}`,
                author: item.user?.username || 'Trakt Member',
                avatar: item.user?.images?.avatar?.full,
                platform: 'trakt',
                comment: item.comment.comment,
                rating: item.comment.user_rating,
                isSpoiler: item.comment.spoiler || false,
                likes: item.comment.likes || 0,
                createdAt: item.comment.created_at
              });
            }
          });
        }
      }
    } catch (err) {
      console.error("Trakt comments error:", err);
    }
  }

  return comments;
}
