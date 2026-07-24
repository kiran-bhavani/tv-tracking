"use client";

import Image from 'next/image';
import Link from 'next/link';
import { getImageUrl } from '@/lib/utils';
import { DollarSign, Award, UserCheck, Clock, Globe } from 'lucide-react';

interface MovieSpecsCardProps {
  movie: any;
}

function formatCurrency(num: number): string {
  if (!num || num === 0) return 'N/A';
  if (num >= 1_000_000_000) return `$${(num / 1_000_000_000).toFixed(2)}B`;
  if (num >= 1_000_000) return `$${(num / 1_000_000).toFixed(1)}M`;
  return `$${num.toLocaleString()}`;
}

export default function MovieSpecsCard({ movie }: MovieSpecsCardProps) {
  const budget = movie.budget || 0;
  const revenue = movie.revenue || 0;
  const hasFinancials = budget > 0 || revenue > 0;
  const profitMultiplier = (budget > 0 && revenue > 0) ? (revenue / budget).toFixed(1) : null;

  // Extract key crew
  const crew = movie.credits?.crew || [];
  const directors = crew.filter((c: any) => c.job === 'Director');
  const writers = crew.filter((c: any) => c.job === 'Screenplay' || c.job === 'Writer' || c.job === 'Story');
  
  // Deduplicate writers
  const uniqueWriters = Array.from(new Map(writers.map((w: any) => [w.id, w])).values());

  const hasCrew = directors.length > 0 || uniqueWriters.length > 0;

  if (!hasFinancials && !hasCrew && !movie.tagline) return null;

  return (
    <div className="px-4 mt-6">
      <div className="bg-muted/40 border border-border/60 rounded-2xl p-5 flex flex-col gap-4 shadow-sm">
        
        {/* Tagline */}
        {movie.tagline && (
          <p className="text-center italic text-sm text-accent font-medium leading-relaxed px-2 border-b border-border/40 pb-3">
            &ldquo;{movie.tagline}&rdquo;
          </p>
        )}

        {/* Financial Metrics */}
        {hasFinancials && (
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-background/60 rounded-xl p-3 border border-border/40 flex flex-col">
              <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground flex items-center gap-1">
                <DollarSign className="w-3 h-3 text-emerald-400" /> Budget
              </span>
              <span className="text-sm font-black text-foreground mt-0.5">{formatCurrency(budget)}</span>
            </div>

            <div className="bg-background/60 rounded-xl p-3 border border-border/40 flex flex-col">
              <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground flex items-center gap-1">
                <Award className="w-3 h-3 text-amber-400" /> Revenue
              </span>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="text-sm font-black text-foreground">{formatCurrency(revenue)}</span>
                {profitMultiplier && Number(profitMultiplier) > 1 && (
                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-400/10 px-1.5 py-0.5 rounded">
                    {profitMultiplier}x
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Crew Highlights (Director & Writer) */}
        {hasCrew && (
          <div className="flex flex-col gap-2 pt-1">
            <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Filmmakers</span>
            <div className="flex flex-wrap gap-3">
              {directors.map((director: any) => (
                <Link 
                  key={director.id} 
                  href={`/person/${director.id}`}
                  className="flex items-center gap-2.5 bg-background/80 hover:bg-background px-3 py-2 rounded-xl border border-border/50 group transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-muted overflow-hidden relative flex-shrink-0 border border-border">
                    {director.profile_path ? (
                      <Image src={getImageUrl(director.profile_path, 'w185')} alt={director.name} fill className="object-cover" />
                    ) : (
                      <UserCheck className="w-4 h-4 text-muted-foreground m-2" />
                    )}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-foreground group-hover:text-accent transition-colors">{director.name}</span>
                    <span className="text-[10px] text-muted-foreground font-medium">Director</span>
                  </div>
                </Link>
              ))}

              {uniqueWriters.slice(0, 2).map((writer: any) => (
                <Link 
                  key={writer.id} 
                  href={`/person/${writer.id}`}
                  className="flex items-center gap-2.5 bg-background/80 hover:bg-background px-3 py-2 rounded-xl border border-border/50 group transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-muted overflow-hidden relative flex-shrink-0 border border-border">
                    {writer.profile_path ? (
                      <Image src={getImageUrl(writer.profile_path, 'w185')} alt={writer.name} fill className="object-cover" />
                    ) : (
                      <UserCheck className="w-4 h-4 text-muted-foreground m-2" />
                    )}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-foreground group-hover:text-accent transition-colors">{writer.name}</span>
                    <span className="text-[10px] text-muted-foreground font-medium">Writer</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
