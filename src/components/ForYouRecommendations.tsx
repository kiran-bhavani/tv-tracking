"use client";

import { useEffect, useState, useRef } from "react";
import { useStore } from "@/store/useStore";
import { getShowRecommendations, getMovieRecommendations } from "@/lib/tmdb";
import { cacheManager } from "@/lib/cache";
import ShowCard from "./ShowCard";

interface ForYouRecommendationsProps {
  type: "tv" | "movie";
}

export default function ForYouRecommendations({ type }: ForYouRecommendationsProps) {
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const watchedEpisodes = useStore((state) => state.watchedEpisodes);
  const watchlist = useStore((state) => state.watchlist);

  // Compute seed IDs outside the effect so we can create a stable cache key
  const seedIds = (() => {
    const ids = type === "tv"
      ? [...new Set([
          ...Object.keys(watchedEpisodes).map(Number),
          ...Object.values(watchlist).filter(i => i.type === 'tv').map(i => i.id)
        ])]
      : Object.values(watchlist).filter(i => i.type === 'movie').map(i => i.id);
    return ids.slice(0, 5); // cap at 5 seeds
  })();

  const cacheKey = `recs_${type}_${seedIds.slice().sort().join(',')}`;
  const prevCacheKey = useRef('');

  useEffect(() => {
    // Skip if nothing changed or no seeds available
    if (seedIds.length === 0) { setLoading(false); return; }
    if (cacheKey === prevCacheKey.current) return;
    prevCacheKey.current = cacheKey;

    const cached = cacheManager.get<any[]>(cacheKey);
    if (cached) { setRecommendations(cached); setLoading(false); return; }

    let mounted = true;
    setLoading(true);

    async function fetchRecommendations() {
      try {
        const itemsToAvoid = new Set<number>(seedIds);

        // Pick up to 2 random seeds to keep results fresh without hammering the API
        const shuffled = [...seedIds].sort(() => 0.5 - Math.random()).slice(0, 2);

        const fetchFn = type === "tv" ? getShowRecommendations : getMovieRecommendations;
        const results = await Promise.all(
          shuffled.map(id => fetchFn(id).catch(() => ({ results: [] })))
        );

        const scoreMap = new Map<number, { item: any; score: number }>();
        results.forEach(res => {
          if (res?.results) {
            res.results.forEach((item: any) => {
              if (itemsToAvoid.has(item.id)) return;
              if (scoreMap.has(item.id)) {
                scoreMap.get(item.id)!.score += 1;
              } else {
                scoreMap.set(item.id, { item, score: 1 });
              }
            });
          }
        });

        const final = Array.from(scoreMap.values())
          .sort((a, b) => b.score !== a.score ? b.score - a.score : 0.5 - Math.random())
          .map(e => ({ ...e.item, media_type: type }))
          .slice(0, 10);

        cacheManager.set(cacheKey, final);
        if (mounted) { setRecommendations(final); setLoading(false); }
      } catch {
        if (mounted) setLoading(false);
      }
    }

    fetchRecommendations();
    return () => { mounted = false; };
  }, [cacheKey]);

  if (loading || recommendations.length === 0) return null;

  return (
    <section className="mt-6 mb-4">
      <h2 className="text-base font-black text-foreground px-1 mb-3 tracking-tight">
        Recommended For You
      </h2>
      <div className="flex overflow-x-auto gap-3 pb-2 hide-scrollbar -mx-1 px-1">
        {recommendations.map((item) => (
          <ShowCard key={item.id} show={item} />
        ))}
      </div>
    </section>
  );
}
