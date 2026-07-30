"use client";

import { useEffect, useState } from 'react';
import { fetchMdlMetadata, MdlMetadata } from '@/lib/mydramalist';
import { fetchSubtitleLanguages, SubtitleInfo } from '@/lib/subtitles';
import { Star, MessageSquare, Tag, Globe, Sparkles } from 'lucide-react';

interface MdlBadgesProps {
  title: string;
  originalLanguage?: string;
}

export default function MdlBadges({ title, originalLanguage }: MdlBadgesProps) {
  const [mdlData, setMdlData] = useState<MdlMetadata | null>(null);
  const [subData, setSubData] = useState<SubtitleInfo | null>(null);

  useEffect(() => {
    async function loadData() {
      const mdl = await fetchMdlMetadata(title, originalLanguage);
      const sub = await fetchSubtitleLanguages(title, originalLanguage);
      setMdlData(mdl);
      setSubData(sub);
    }

    loadData();
  }, [title, originalLanguage]);

  if (!mdlData && !subData) return null;

  return (
    <div className="flex flex-col gap-3 my-4">
      {/* Badges Row */}
      <div className="flex flex-wrap items-center gap-2">
        {/* MyDramaList Score */}
        {mdlData?.isAsianDrama && (
          <div className="flex items-center gap-1.5 px-3 py-1 bg-pink-500/15 border border-pink-500/30 text-pink-400 rounded-full text-xs font-bold shadow-sm">
            <Star className="w-3.5 h-3.5 fill-current text-pink-400" />
            <span>MDL Score: {mdlData.rating} / 10</span>
          </div>
        )}

        {/* Native Title */}
        {mdlData?.nativeTitle && (
          <div className="px-3 py-1 bg-card border border-border/80 text-foreground/80 rounded-full text-xs font-bold">
            {mdlData.nativeTitle}
          </div>
        )}

        {/* Subtitles Badge */}
        {subData && (
          <div className="flex items-center gap-1.5 px-3 py-1 bg-accent/15 border border-accent/30 text-accent rounded-full text-xs font-bold shadow-sm">
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Subs: {subData.availableLanguages.slice(0, 3).join(', ')}{subData.availableLanguages.length > 3 ? ` +${subData.availableLanguages.length - 3}` : ''}</span>
          </div>
        )}
      </div>

      {/* Tropes / Tags Pills */}
      {mdlData?.tags && mdlData.tags.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[10px] font-black uppercase text-muted-foreground tracking-wider mr-1 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-accent" /> Tropes:
          </span>
          {mdlData.tags.map((tag) => (
            <span
              key={tag}
              className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-muted/60 border border-border text-muted-foreground hover:text-foreground transition-colors"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
