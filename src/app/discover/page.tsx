import Link from 'next/link';
import { getGenres, getTrendingShows, getPopularShows, getTrendingMovies, getPopularMovies } from '@/lib/tmdb';
import ShowCard from '@/components/ShowCard';
import { Search } from 'lucide-react';
import ForYouRecommendations from '@/components/ForYouRecommendations';
import InfiniteDiscoverRows from '@/components/InfiniteDiscoverRows';
import TrendingTrailersCarousel from '@/components/TrendingTrailersCarousel';

export const revalidate = 3600; // Revalidate every hour

export default async function DiscoverPage({ searchParams }: { searchParams: Promise<{ type?: string }> }) {
  const resolvedSearchParams = await searchParams;
  const isMovie = resolvedSearchParams.type === 'movie';
  
  const [trendingData, popularData, genresData] = await Promise.all([
    isMovie ? getTrendingMovies('week') : getTrendingShows('week'),
    isMovie ? getPopularMovies() : getPopularShows(),
    getGenres(isMovie ? 'movie' : 'tv')
  ]);

  const trending = trendingData.results || [];
  const popular = popularData.results || [];
  const genres = genresData.genres || [];

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Search Bar at the top (TV Time style) */}
      <div className="sticky top-0 z-40 bg-background/90 backdrop-blur-md pt-safe px-4 py-4 border-b border-border">
        <h1 className="text-2xl font-bold text-foreground mb-4">Discover</h1>
        <Link href="/search" className="flex items-center gap-3 bg-muted border border-border rounded-full py-3 px-4 text-muted-foreground hover:bg-muted/80 transition">
          <Search className="w-5 h-5" />
          <span>Search shows, movies, users...</span>
        </Link>
      </div>
      
      {/* Toggle */}
      <div className="px-4 mt-2 mb-4 flex justify-center">
        <div className="bg-muted p-1 rounded-full flex gap-1">
          <Link href="/discover?type=tv" className={`px-6 py-2 rounded-full font-bold text-sm transition-colors ${!isMovie ? 'bg-accent text-accent-foreground' : 'text-foreground'}`}>
            TV Shows
          </Link>
          <Link href="/discover?type=movie" className={`px-6 py-2 rounded-full font-bold text-sm transition-colors ${isMovie ? 'bg-accent text-accent-foreground' : 'text-foreground'}`}>
            Movies
          </Link>
        </div>
      </div>

      {/* Trending Trailers Video Carousel */}
      <TrendingTrailersCarousel />

      {/* Recommended For You Engine */}
      <ForYouRecommendations type={isMovie ? 'movie' : 'tv'} />

      <div className="flex flex-col gap-8 pb-8">
        {/* Trending Section */}
        <section>
          <div className="px-4 mb-3 flex justify-between items-end">
            <h2 className="text-xl font-bold text-foreground">Trending {isMovie ? 'Movies' : 'Shows'}</h2>
            <span className="text-xs text-[var(--accent)] font-medium">See all</span>
          </div>
          <div className="flex overflow-x-auto gap-4 px-4 snap-x snap-mandatory hide-scrollbar">
            {trending.slice(0, 10).map((item: any) => (
              <ShowCard key={item.id} show={{...item, media_type: isMovie ? 'movie' : 'tv'}} featured />
            ))}
          </div>
        </section>

        {/* Popular Section */}
        <section>
          <div className="px-6 mb-4 flex justify-between items-end">
            <h2 className="text-xl font-bold text-white tracking-tight">Popular Right Now</h2>
          </div>
          <div className="flex overflow-x-auto gap-4 px-6 snap-x snap-mandatory hide-scrollbar">
            {popular.map((item: any) => (
              <ShowCard key={item.id} show={{...item, media_type: isMovie ? 'movie' : 'tv'}} />
            ))}
          </div>
        </section>
        
        {/* Infinite Genre Rows */}
        <InfiniteDiscoverRows type={isMovie ? 'movie' : 'tv'} genres={genres} />
      </div>
    </div>
  );
}
