import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, Star, Play } from 'lucide-react';
import { getImageUrl } from '@/lib/utils';
import WatchlistButton from '@/components/WatchlistButton';
import ShowProgress from '@/components/ShowProgress';
import ShowCard from '@/components/ShowCard';
import SaveToListButton from '@/components/SaveToListButton';
import OverviewText from '@/components/OverviewText';
import { fetchOmdbDetails } from '@/lib/omdb';

// Quick movie fetch directly in component since it's just one call
async function getMovieDetails(id: string) {
  const res = await fetch(`https://api.themoviedb.org/3/movie/${id}?append_to_response=credits,similar,recommendations&language=en-US`, {
    headers: {
      Authorization: `Bearer ${process.env.TMDB_API_TOKEN}`,
      accept: 'application/json'
    }
  });
  if (!res.ok) throw new Error('Failed to fetch movie');
  return res.json();
}

export default async function MovieDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const movie = await getMovieDetails(id);
  const backdropUrl = getImageUrl(movie.backdrop_path, 'original');
  const posterUrl = getImageUrl(movie.poster_path, 'w500');

  const similarMovies = movie.recommendations?.results?.length > 0 
    ? movie.recommendations.results 
    : (movie.similar?.results || []);

  let finalOverview = movie.overview;
  let imdbRating = null;

  if (!finalOverview || finalOverview.length < 10) {
    if (movie.translations?.translations) {
      const originalLangTranslation = movie.translations.translations.find((t: any) => t.iso_639_1 === movie.original_language);
      if (originalLangTranslation?.data?.overview) {
        finalOverview = originalLangTranslation.data.overview;
      }
    }
  }

  if (!finalOverview || finalOverview.length < 10) {
    const omdbData = await fetchOmdbDetails(movie.title, 'movie');
    if (omdbData) {
      finalOverview = omdbData.overview || finalOverview;
      imdbRating = omdbData.imdbRating;
    }
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

      {/* Watch Options (Just a dummy button for now) */}
      <div className="px-4 mt-6">
        <button className="w-full bg-accent/10 text-accent font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-accent/20 transition-colors">
          <Play className="w-5 h-5 fill-current" />
          Where to Watch
        </button>
      </div>

      {/* Overview */}
      <OverviewText initialText={finalOverview} language={movie.original_language} />

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
