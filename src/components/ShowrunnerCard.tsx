"use client";

import Image from 'next/image';
import Link from 'next/link';
import { getImageUrl } from '@/lib/utils';
import { UserCheck } from 'lucide-react';

interface ShowrunnerCardProps {
  createdBy: any[];
}

export default function ShowrunnerCard({ createdBy }: ShowrunnerCardProps) {
  if (!createdBy || createdBy.length === 0) return null;

  return (
    <div className="px-4 mt-6">
      <div className="flex flex-col gap-2">
        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Created By</span>
        <div className="flex flex-wrap gap-3">
          {createdBy.map((creator: any) => (
            <Link
              key={creator.id}
              href={`/person/${creator.id}`}
              className="flex items-center gap-3 bg-muted/50 hover:bg-muted/80 px-3.5 py-2.5 rounded-2xl border border-border/60 group transition-colors shadow-sm"
            >
              <div className="w-10 h-10 rounded-full bg-muted overflow-hidden relative flex-shrink-0 border border-border">
                {creator.profile_path ? (
                  <Image src={getImageUrl(creator.profile_path, 'w185')} alt={creator.name} fill className="object-cover" />
                ) : (
                  <UserCheck className="w-5 h-5 text-muted-foreground m-2.5" />
                )}
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-foreground group-hover:text-accent transition-colors">
                  {creator.name}
                </span>
                <span className="text-[10px] text-muted-foreground font-medium">Creator & Showrunner</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
