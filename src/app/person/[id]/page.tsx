import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { getPersonDetails } from '@/lib/tmdb';
import { getImageUrl } from '@/lib/utils';
import ShowCard from '@/components/ShowCard';

export default async function PersonDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const person = await getPersonDetails(id);
  const profileUrl = getImageUrl(person.profile_path, 'h632');

  const credits = person.combined_credits?.cast || [];
  const knownFor = [...credits]
    .sort((a, b) => b.vote_count - a.vote_count)
    .slice(0, 10);

  // Sort full filmography by date descending
  const filmography = [...credits].sort((a, b) => {
    const dateA = a.release_date || a.first_air_date || '';
    const dateB = b.release_date || b.first_air_date || '';
    return dateB.localeCompare(dateA);
  });

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Top Bar */}
      <div className="sticky top-0 z-40 bg-background/90 backdrop-blur-md pt-safe px-4 py-3 flex items-center border-b border-border">
        <Link href=".." className="p-2 -ml-2 rounded-full hover:bg-muted text-foreground transition-colors">
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <h1 className="text-lg font-bold ml-2 truncate">{person.name}</h1>
      </div>

      {/* Hero Section */}
      <div className="px-6 py-6 flex gap-6 items-start border-b border-border">
        <div className="w-32 h-48 flex-shrink-0 rounded-xl overflow-hidden shadow-2xl relative bg-muted border border-border">
          {person.profile_path ? (
            <Image src={profileUrl} alt={person.name} fill className="object-cover" priority />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">No Photo</div>
          )}
        </div>
        
        <div className="flex flex-col flex-1">
          <h1 className="text-2xl font-black text-foreground leading-tight mb-1">{person.name}</h1>
          <p className="text-sm font-bold text-accent mb-3">{person.known_for_department}</p>
          
          {person.birthday && (
            <p className="text-xs text-muted-foreground mb-1">
              <span className="font-bold text-white/70">Born:</span> {person.birthday}
            </p>
          )}
          {person.place_of_birth && (
            <p className="text-xs text-muted-foreground">
              <span className="font-bold text-white/70">Place:</span> {person.place_of_birth}
            </p>
          )}
        </div>
      </div>

      {/* Biography */}
      {person.biography && (
        <div className="px-6 py-6 border-b border-border">
          <h3 className="text-lg font-bold text-foreground mb-3">Biography</h3>
          <p className="text-sm text-muted-foreground leading-relaxed line-clamp-6">
            {person.biography}
          </p>
        </div>
      )}

      {/* Known For */}
      {knownFor.length > 0 && (
        <div className="py-6 border-b border-border">
          <h3 className="text-lg font-bold text-foreground px-6 mb-4">Known For</h3>
          <div className="flex overflow-x-auto gap-4 px-6 snap-x snap-mandatory hide-scrollbar">
            {knownFor.map((credit: any) => (
              <ShowCard key={`${credit.id}-${credit.credit_id}`} show={credit} />
            ))}
          </div>
        </div>
      )}

      {/* Filmography */}
      {filmography.length > 0 && (
        <div className="py-6 px-6">
          <h3 className="text-lg font-bold text-foreground mb-4">Filmography</h3>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(128px,1fr))] gap-4 justify-items-center">
            {filmography.map((credit: any) => (
              <ShowCard key={`${credit.id}-${credit.credit_id}`} show={credit} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
