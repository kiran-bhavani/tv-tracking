"use client";

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useStore } from '@/store/useStore';
import { Users, X, Sparkles, CheckCircle2, Film, Tv, Loader2 } from 'lucide-react';
import ShowCard from './ShowCard';

interface WatchTogetherModalProps {
  targetUserUid: string;
  targetUserName: string;
  onClose: () => void;
}

export default function WatchTogetherModal({ targetUserUid, targetUserName, onClose }: WatchTogetherModalProps) {
  const [loading, setLoading] = useState(true);
  const [targetWatchlist, setTargetWatchlist] = useState<any[]>([]);
  const myWatchlistMap = useStore((state) => state.watchlist);

  useEffect(() => {
    async function fetchTargetWatchlist() {
      try {
        const userRef = doc(db, 'users', targetUserUid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          const data = userSnap.data();
          const items = Object.values(data.watchlist || {}) as any[];
          setTargetWatchlist(items);
        }
      } catch (err) {
        console.error("Failed to load friend's watchlist", err);
      } finally {
        setLoading(false);
      }
    }

    fetchTargetWatchlist();
  }, [targetUserUid]);

  const myWatchlist = Object.values(myWatchlistMap || {}) as any[];
  const myIds = new Set(myWatchlist.map(s => s.id));

  // Find mutual items
  const mutualItems = targetWatchlist.filter(item => myIds.has(item.id));

  // Match score calculation
  const totalUnique = new Set([...myWatchlist.map(s => s.id), ...targetWatchlist.map(s => s.id)]).size;
  const matchScore = totalUnique > 0 ? Math.round((mutualItems.length / Math.min(myWatchlist.length || 1, targetWatchlist.length || 1)) * 100) : 0;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-md p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="w-full max-w-lg bg-card border border-border rounded-3xl p-6 shadow-2xl relative flex flex-col gap-5 overflow-hidden max-h-[85vh] overflow-y-auto hide-scrollbar"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-muted-foreground hover:text-foreground transition-colors p-1 z-10"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-accent/20 text-accent flex items-center justify-center border border-accent/30 shadow-inner">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-black text-foreground">Watch Together Matchmaker</h3>
            <p className="text-xs text-muted-foreground font-medium">Matching watchlists with {targetUserName}</p>
          </div>
        </div>

        {loading ? (
          <div className="py-12 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-accent" />
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            {/* Match Score Banner */}
            <div className="bg-gradient-to-r from-accent/20 via-accent/10 to-transparent border border-accent/30 rounded-2xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-accent animate-pulse" />
                <span className="text-sm font-bold text-foreground">Watchlist Synergy</span>
              </div>
              <span className="text-xl font-black text-accent bg-accent/15 px-3 py-1 rounded-full border border-accent/20">
                {matchScore}% Match!
              </span>
            </div>

            {/* Mutual Titles List */}
            <div className="flex flex-col gap-3">
              <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Titles You BOTH Want To Watch ({mutualItems.length})
              </h4>

              {mutualItems.length === 0 ? (
                <div className="text-center py-8 bg-muted/20 border border-dashed border-border/60 rounded-2xl p-4">
                  <p className="text-xs text-muted-foreground font-medium">
                    No mutual titles found on both watchlists yet. Try adding some popular movies or shows!
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-3">
                  {mutualItems.map((item) => (
                    <ShowCard key={item.id} show={item} />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
