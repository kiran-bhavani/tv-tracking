import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, Star, Play } from 'lucide-react';
import { notFound } from 'next/navigation';
import { getImageUrl } from '@/lib/utils';
import WatchlistButton from '@/components/WatchlistButton';
import ShowProgress from '@/components/ShowProgress';
import ShowCard from '@/components/ShowCard';
import SaveToListButton from '@/components/SaveToListButton';
import OverviewText from '@/components/OverviewText';
import MediaGallery from '@/components/MediaGallery';
import WatchProviders from '@/components/WatchProviders';
import MovieSpecsCard from '@/components/MovieSpecsCard';
import MovieCollectionCard from '@/components/MovieCollectionCard';
import MovieReviewSection from '@/components/MovieReviewSection';
import { fetchOmdbDetails } from '@/lib/omdb';
import { fetchTraktDetails } from '@/lib/trakt';
import { getMovieDetails } from '@/lib/tmdb';

export default async function MovieDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let movie: any;
  try {
    movie = await getMovieDetails(id);
    if (!movie || !movie.id) notFound();
  } catch {
    notFound();
  }

  const backdropUrl = getImageUrl(movie.backdrop_path, 'original');
  const posterUrl = getImageUrl(movie.poster_path, 'w500');

  const similarMovies = movie.recommendations?.results?.length > 0 
    ? movie.recommendations.results 
    : (movie.similar?.results || []);

  let finalOverview = movie.overview;
  let imdbRating = null;

  // Fallback 1: Trakt.tv
  if (!finalOverview || finalOverview.length < 10) {
    try {
      const traktData = await fetchTraktDetails(movie.id, 'movie');
      if (traktData && traktData.overview) {
        finalOverview = traktData.overview;
        imdbRating = traktData.ids?.imdb ? traktData.rating?.toFixed(1) : null;
      }
    } catch { /* skip */ }
  }

  // Fallback 2: OMDb (last resort)
  if (!finalOverview || finalOverview.length < 10) {
    try {
      const omdbData = await fetchOmdbDetails(movie.title, 'movie');
      if (omdbData) {
        finalOverview = omdbData.overview || finalOverview;
        imdbRating = omdbData.imdbRating;
      }
    } catch { /* skip */ }
  }

  return (
    <div className="min-h-screen bg-background pb-10">
      {/* Hero Section */}
      <div className="relative h-72 w-full">
        <Image
          src={backdropUrl}
          alt={movie.title}
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-[var(--background)]/40 text-accent-foreground/30" />
        
        {/* Back Button */}
        <Link href="/" className="absolute top-safe-pt mt-4 left-4 p-2 bg-muted rounded-full backdrop-blur-sm text-foreground">
          <ArrowLeft className="w-6 h-6" />
        </Link>
      </div>

      <div className="px-4 -mt-20 relative z-10 flex gap-4">
        {/* Poster */}
        <div className="w-28 h-40 flex-shrink-0 rounded-lg overflow-hidden border border-border shadow-2xl relative bg-card">
          <Image src={posterUrl} alt={movie.title} fill className="object-cover" priority />
        </div>
        
        {/* Title and Info */}
        <div className="pt-8 flex flex-col justify-end pb-2">
          <h1 className="text-2xl font-black text-foreground leading-tight">{movie.title}</h1>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-2 text-xs font-bold text-muted-foreground">
            <span className="flex items-center gap-1 text-accent">
              <Star className="w-4 h-4 fill-current" />
              {movie.vote_average.toFixed(1)}
              {imdbRating && ` • IMDb ${imdbRating}`}
            </span>
            <span>•</span>
            <span>{movie.release_date?.split('-')[0]}</span>
            <span>•</span>
            <span>{Math.floor(movie.runtime / 60)}h {movie.runtime % 60}m</span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="px-4 mt-6">
        <WatchlistButton show={{
          id: movie.id,
          name: movie.title,
          poster_path: movie.poster_path,
          backdrop_path: movie.backdrop_path,
          number_of_seasons: 0,
          number_of_episodes: 1, // Movies are 1 "episode"
          type: 'movie',
          runtime: movie.runtime || 120,
          genres: movie.genres || []
        }} />
        <SaveToListButton showId={movie.id} />
      </div>

      {/* Progress */}
      <ShowProgress showId={movie.id} totalEpisodes={1} />

      {/* Where to Watch */}
      <div className="px-4">
        <WatchProviders providersData={movie["watch/providers"]} countryCode="US" />
      </div>

      {/* Box Office & Crew Specs */}
      <MovieSpecsCard movie={movie} />

      {/* User Review & Rating Journal */}
      <MovieReviewSection movieId={movie.id} movieTitle={movie.title} />

      {/* Overview */}
      <OverviewText initialText={finalOverview} language={movie.original_language} type="movie" title={movie.title} />

      {/* Franchise Collection Progress */}
      {movie.belongs_to_collection && (
        <MovieCollectionCard collectionId={movie.belongs_to_collection.id} currentMovieId={movie.id} />
      )}

      {/* Photos & Videos */}
      <MediaGallery 
        videos={movie.videos?.results} 
        images={movie.images?.backdrops?.slice(0, 8)} 
      />

      {/* Cast (Horizontal Scroll) */}
      {movie.credits?.cast?.length > 0 && (
        <div className="mt-8">
          <h3 className="text-lg font-bold text-foreground px-4 mb-3">Cast</h3>
          <div className="flex overflow-x-auto gap-4 px-4 snap-x snap-mandatory hide-scrollbar">
            {movie.credits.cast.slice(0, 10).map((actor: any) => (
              <Link href={`/person/${actor.id}`} key={actor.id} className="flex-shrink-0 w-20 snap-center group">
                <div className="w-20 h-20 rounded-full overflow-hidden relative mb-2 bg-muted border border-border group-hover:border-accent transition-colors">
                  {actor.profile_path ? (
                    <Image src={getImageUrl(actor.profile_path, 'w500')} alt={actor.name} fill className="object-cover" />
                  ) : null}
                </div>
                <p className="text-[11px] font-bold text-foreground text-center truncate leading-tight group-hover:text-accent transition-colors">{actor.name}</p>
                <p className="text-[10px] text-muted-foreground text-center truncate leading-tight mt-0.5">{actor.character}</p>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Similar Movies */}
      {similarMovies.length > 0 && (
        <div className="mt-8">
          <h3 className="text-lg font-bold text-foreground px-4 mb-3">Similar Movies</h3>
          <div className="flex overflow-x-auto gap-4 px-4 pb-4 snap-x snap-mandatory hide-scrollbar">
            {similarMovies.slice(0, 10).map((similarMovie: any) => (
              <ShowCard key={similarMovie.id} show={{...similarMovie, media_type: 'movie'}} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
