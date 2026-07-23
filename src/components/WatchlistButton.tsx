"use client";

import { Check, Plus } from 'lucide-react';
import { useStore, WatchlistShow } from '@/store/useStore';
import { useEffect, useState } from 'react';

export default function WatchlistButton({ show }: { show: WatchlistShow }) {
  // Prevent hydration mismatch by only rendering after mount
  const [mounted, setMounted] = useState(false);
  const watchlist = useStore((state) => state.watchlist);
  const addToWatchlist = useStore((state) => state.addToWatchlist);
  const removeFromWatchlist = useStore((state) => state.removeFromWatchlist);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return (
    <button className="flex-1 py-3 rounded-xl font-bold flex justify-center items-center gap-2 bg-white/5 text-gray-500">
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
      className={`w-full py-4 rounded-2xl font-black text-lg flex justify-center items-center gap-2 transition-all shadow-xl active:scale-95 ${
        isInWatchlist 
          ? 'bg-card text-foreground border border-border' 
          : 'bg-accent text-accent-foreground'
      }`}
    >
      {isInWatchlist ? <Check className="w-6 h-6 text-[var(--accent)]" /> : <Plus className="w-6 h-6" />}
      {isInWatchlist ? 'In Watchlist' : 'Add to Watchlist'}
    </button>
  );
}
