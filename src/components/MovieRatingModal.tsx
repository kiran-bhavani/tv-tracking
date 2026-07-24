"use client";

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Star, X, RotateCcw, Check } from 'lucide-react';
import { useStore, MovieReview } from '@/store/useStore';

interface MovieRatingModalProps {
  movieId: number;
  movieTitle: string;
  onClose: () => void;
}

export default function MovieRatingModal({ movieId, movieTitle, onClose }: MovieRatingModalProps) {
  const existingReview = useStore((state) => state.movieReviews[movieId]);
  const saveMovieReview = useStore((state) => state.saveMovieReview);
  const deleteMovieReview = useStore((state) => state.deleteMovieReview);

  const [rating, setRating] = useState<number>(existingReview?.rating || 4);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [reviewText, setReviewText] = useState<string>(existingReview?.review || '');
  const [isRewatch, setIsRewatch] = useState<boolean>(existingReview?.isRewatch || false);

  const handleSave = () => {
    saveMovieReview(movieId, {
      rating,
      review: reviewText.trim() || undefined,
      watchedDate: existingReview?.watchedDate || new Date().toISOString(),
      isRewatch
    });
    onClose();
  };

  const handleDelete = () => {
    deleteMovieReview(movieId);
    onClose();
  };

  const activeDisplayRating = hoverRating !== null ? hoverRating : rating;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="w-full max-w-md bg-card border border-border rounded-2xl p-6 shadow-2xl relative flex flex-col gap-5"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors p-1"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex flex-col gap-1">
          <h3 className="text-xl font-black text-foreground">Log & Review</h3>
          <p className="text-xs text-muted-foreground font-medium truncate">{movieTitle}</p>
        </div>

        {/* Star Rating Picker */}
        <div className="flex flex-col items-center gap-2 py-2 bg-muted/30 rounded-xl border border-border/40 p-4">
          <span className="text-xs font-bold text-accent uppercase tracking-wider">
            {activeDisplayRating} / 5 Stars
          </span>
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(null)}
                onClick={() => setRating(star)}
                className="p-1 transition-transform hover:scale-125 focus:outline-none"
              >
                <Star
                  className={`w-8 h-8 transition-colors ${
                    star <= activeDisplayRating
                      ? 'fill-amber-400 text-amber-400'
                      : 'text-muted-foreground/40'
                  }`}
                />
              </button>
            ))}
          </div>
        </div>

        {/* Review Text */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-foreground">Your Thoughts (Optional)</label>
          <textarea
            value={reviewText}
            onChange={(e) => setReviewText(e.target.value)}
            placeholder="What did you think of the film?"
            rows={3}
            maxLength={500}
            className="w-full bg-muted/50 border border-border rounded-xl p-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-accent transition-colors resize-none"
          />
        </div>

        {/* Rewatch Toggle */}
        <label className="flex items-center justify-between p-3 bg-muted/30 rounded-xl border border-border/40 cursor-pointer group select-none">
          <div className="flex items-center gap-2">
            <RotateCcw className={`w-4 h-4 transition-colors ${isRewatch ? 'text-accent' : 'text-muted-foreground'}`} />
            <span className="text-xs font-bold text-foreground">I&apos;ve watched this film before (Rewatch)</span>
          </div>
          <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${isRewatch ? 'bg-accent border-accent text-accent-foreground' : 'border-border bg-background'}`}>
            {isRewatch && <Check className="w-3.5 h-3.5 stroke-[3]" />}
          </div>
          <input
            type="checkbox"
            checked={isRewatch}
            onChange={(e) => setIsRewatch(e.target.checked)}
            className="sr-only"
          />
        </label>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          {existingReview && (
            <button
              type="button"
              onClick={handleDelete}
              className="px-4 py-2.5 rounded-xl border border-red-500/30 text-red-400 hover:bg-red-500/10 text-xs font-bold transition-colors"
            >
              Remove
            </button>
          )}
          <button
            type="button"
            onClick={handleSave}
            className="flex-1 bg-accent text-accent-foreground font-bold text-sm py-2.5 rounded-xl hover:bg-accent/90 transition-colors shadow-lg"
          >
            Save Entry
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
