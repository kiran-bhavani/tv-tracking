"use client";

import { useState } from 'react';
import { Star, Edit3, Plus, RotateCcw, Quote } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { AnimatePresence } from 'framer-motion';
import MovieRatingModal from './MovieRatingModal';

interface MovieReviewSectionProps {
  movieId: number;
  movieTitle: string;
}

export default function MovieReviewSection({ movieId, movieTitle }: MovieReviewSectionProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const review = useStore((state) => state.movieReviews[movieId]);

  return (
    <div className="px-4 mt-6">
      <div className="bg-card border border-border/80 rounded-2xl p-5 shadow-md relative">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-foreground text-lg flex items-center gap-2">
            Your Movie Log
          </h3>
          <button
            onClick={() => setIsModalOpen(true)}
            className="text-xs font-bold text-accent bg-accent/10 hover:bg-accent/20 border border-accent/20 px-3 py-1.5 rounded-xl transition-colors flex items-center gap-1.5"
          >
            {review ? <Edit3 className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
            {review ? 'Edit Review' : 'Add Review'}
          </button>
        </div>

        {review ? (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between bg-muted/30 p-3 rounded-xl border border-border/40">
              {/* Star Rating Display */}
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-4 h-4 ${
                      star <= review.rating
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-muted-foreground/30'
                    }`}
                  />
                ))}
                <span className="text-xs font-black text-foreground ml-1">{review.rating}/5</span>
              </div>

              {/* Badges */}
              <div className="flex items-center gap-2">
                {review.isRewatch && (
                  <span className="text-[10px] uppercase font-bold text-accent bg-accent/10 px-2 py-0.5 rounded flex items-center gap-1">
                    <RotateCcw className="w-3 h-3" /> Rewatch
                  </span>
                )}
                <span className="text-[10px] text-muted-foreground">
                  {new Date(review.watchedDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
              </div>
            </div>

            {/* Review text */}
            {review.review && (
              <div className="relative pl-4 border-l-2 border-accent py-1">
                <p className="text-sm text-foreground leading-relaxed italic">
                  &ldquo;{review.review}&rdquo;
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-4 bg-muted/20 border border-dashed border-border/60 rounded-xl flex flex-col items-center gap-2">
            <p className="text-xs text-muted-foreground font-medium">Have you watched this movie? Log your rating and review.</p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="text-xs font-bold text-foreground bg-muted hover:bg-muted/80 px-4 py-2 rounded-xl transition-colors"
            >
              Rate & Review Film
            </button>
          </div>
        )}
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <MovieRatingModal
            movieId={movieId}
            movieTitle={movieTitle}
            onClose={() => setIsModalOpen(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
