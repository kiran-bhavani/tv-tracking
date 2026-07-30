"use client";

import { BookmarkPlus, BookmarkCheck, BookmarkMinus } from 'lucide-react';
import { useStore, WatchlistShow } from '@/store/useStore';
import { useEffect, useState } from 'react';

export default function WatchlistButton({ show }: { show: WatchlistShow }) {
  const [mounted, setMounted] = useState(() => typeof window !== 'undefined');
  const [isHovered, setIsHovered] = useState(false);

  const watchlist = useStore((state) => state.watchlist);
  const addToWatchlist = useStore((state) => state.addToWatchlist);
  const removeFromWatchlist = useStore((state) => state.removeFromWatchlist);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return (
    <button className="w-full py-4 rounded-2xl font-bold flex justify-center items-center gap-2 bg-white/5 text-muted-foreground animate-pulse">
      Loading...
    </button>
  );

  const isInWatchlist = !!watchlist[show.id];

  const toggleWatchlist = () => {
    if (isInWatchlist) {
      removeFromWatchlist(show.id);
    } else {
      addToWatchlist(show);
    }
  };

  return (
    <button 
      onClick={toggleWatchlist}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`w-full py-4 rounded-2xl font-black text-base sm:text-lg flex justify-center items-center gap-2.5 transition-all shadow-xl active:scale-95 border ${
        isInWatchlist 
          ? isHovered
            ? 'bg-red-500/15 text-red-400 border-red-500/30 shadow-red-500/10'
            : 'bg-accent/15 text-accent border-accent/30 shadow-accent/10' 
          : 'bg-accent text-accent-foreground border-accent shadow-accent/20 hover:bg-accent/90'
      }`}
      title={isInWatchlist ? "Click to remove from Watchlist" : "Click to add to Watchlist"}
    >
      {isInWatchlist ? (
        isHovered ? (
          <>
            <BookmarkMinus className="w-6 h-6" />
            <span>Remove from Watchlist</span>
          </>
        ) : (
          <>
            <BookmarkCheck className="w-6 h-6 fill-current" />
            <span>Saved in Watchlist</span>
          </>
        )
      ) : (
        <>
          <BookmarkPlus className="w-6 h-6" />
          <span>+ Add to Watchlist</span>
        </>
      )}
    </button>
  );
}
