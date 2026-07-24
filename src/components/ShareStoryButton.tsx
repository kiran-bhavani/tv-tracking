"use client";

import { useState } from 'react';
import { Share2 } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import SocialStoryModal from './SocialStoryModal';

interface ShareStoryButtonProps {
  title: string;
  posterPath: string | null;
  backdropPath: string | null;
  type: 'show' | 'movie';
  rating?: number;
  year?: string;
  tagline?: string;
}

export default function ShareStoryButton({
  title,
  posterPath,
  backdropPath,
  type,
  rating,
  year,
  tagline
}: ShareStoryButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="w-12 h-12 flex-shrink-0 bg-muted text-foreground rounded-xl flex items-center justify-center font-bold text-sm shadow-lg hover:bg-muted/80 transition-colors border border-border"
        aria-label="Share Story Card"
        title="Share Instagram/Twitter Story Card"
      >
        <Share2 className="w-5 h-5 text-accent" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <SocialStoryModal
            title={title}
            posterPath={posterPath}
            backdropPath={backdropPath}
            type={type}
            rating={rating}
            year={year}
            tagline={tagline}
            onClose={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
