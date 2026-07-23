import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, Star, Plus } from 'lucide-react';
import { getShowDetails } from '@/lib/tmdb';
import { getImageUrl } from '@/lib/utils';
import WatchlistButton from '@/components/WatchlistButton';
import ShowProgress from '@/components/ShowProgress';
import SeasonAccordion from '@/components/SeasonAccordion';
import MarkUpToDateButton from '@/components/MarkUpToDateButton';
import ShowCard from '@/components/ShowCard';
import SaveToListButton from '@/components/SaveToListButton';
import OverviewText from '@/components/OverviewText';
import { fetchOmdbDetails } from '@/lib/omdb';

export default async function ShowDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const show = await getShowDetails(id);
  const backdropUrl = getImageUrl(show.backdrop_path, 'original');
  const posterUrl = getImageUrl(show.poster_path, 'w500');

  const similarShows = show.recommendations?.results?.length > 0 
    ? show.recommendations.results 
    : (show.similar?.results || []);

  let finalOverview = show.overview;
  let imdbRating = null;
  
  if (!finalOverview || finalOverview.length < 10) {
    if (show.translations?.translations) {
      const originalLangTranslation = show.translations.translations.find((t: any) => t.iso_639_1 === show.original_language);
      if (originalLangTranslation?.data?.overview) {
        finalOverview = originalLangTranslation.data.overview;
      }
    }
  }

  if (!finalOverview || finalOverview.length < 10) {
    const omdbData = await fetchOmdbDetails(show.name, 'tv');
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
          alt={show.name}
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-accent/30" />
        
        {/* Back Button */}
        <Link href="/" className="absolute top-safe-pt mt-4 left-4 p-2 bg-foreground/80 rounded-full backdrop-blur-sm text-background">
          <ArrowLeft className="w-6 h-6" />
        </Link>
      </div>

      <div className="px-4 -mt-20 relative z-10 flex gap-4">
        {/* Poster */}
        <div className="w-28 h-40 flex-shrink-0 rounded-lg overflow-hidden border border-border shadow-2xl relative bg-muted">
          <Image src={posterUrl} alt={show.name} fill className="object-cover" priority />
        </div>
        
        {/* Title and Info */}
        <div className="pt-8 flex flex-col justify-end pb-2">
          <h1 className="text-2xl font-black text-foreground leading-tight">{show.name}</h1>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-2 text-xs font-bold text-muted-foreground">
            <span className="flex items-center gap-1 text-accent">
              <Star className="w-4 h-4 fill-current" />
              {show.vote_average.toFixed(1)}
              {imdbRating && ` • IMDb ${imdbRating}`}
            </span>
            <span>•</span>
            <span>{show.first_air_date?.split('-')[0]}</span>
            <span>•</span>
            <span>{show.status}</span>
            <span>•</span>
            <span>{show.number_of_seasons} Seasons</span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="px-4 mt-6 flex gap-3">
        <WatchlistButton show={{
          id: show.id,
          name: show.name,
          poster_path: show.poster_path,
          backdrop_path: show.backdrop_path,
          number_of_seasons: show.number_of_seasons,
          number_of_episodes: show.number_of_episodes,
          type: 'tv',
          runtime: show.episode_run_time?.[0] || 45,
          genres: show.genres || []
        }} />
        <MarkUpToDateButton showId={show.id} seasons={show.seasons} />
        <SaveToListButton showId={show.id} />
      </div>

      {/* Progress */}
      <ShowProgress showId={show.id} totalEpisodes={show.number_of_episodes || 0} />

      {/* Overview */}
      <OverviewText initialText={finalOverview} language={show.original_language} />

      {/* Cast (Horizontal Scroll) */}
      {show.credits?.cast?.length > 0 && (
        <div className="mt-8">
          <h3 className="text-lg font-bold text-foreground px-4 mb-3">Cast</h3>
          <div className="flex overflow-x-auto gap-4 px-4 snap-x snap-mandatory hide-scrollbar">
            {show.credits.cast.slice(0, 10).map((actor: any) => (
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

      {/* Seasons Accordion */}
      <div className="px-4 mt-8">
        <h3 className="text-lg font-bold text-foreground mb-3">Seasons</h3>
        <SeasonAccordion showId={show.id} seasons={show.seasons} />
      </div>

      {/* Similar Shows */}
      {similarShows.length > 0 && (
        <div className="mt-8">
          <h3 className="text-lg font-bold text-foreground px-4 mb-3">Similar Shows</h3>
          <div className="flex overflow-x-auto gap-4 px-4 pb-4 snap-x snap-mandatory hide-scrollbar">
            {similarShows.slice(0, 10).map((similarShow: any) => (
              <ShowCard key={similarShow.id} show={similarShow} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
