"use client";

import { CheckCircle2, Loader2, AlertCircle } from "lucide-react";
import { useStore, WatchedEpisode } from "@/store/useStore";
import { getSeasonDetails } from "@/lib/tmdb";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

function Toast({ message, type, onDismiss }: { message: string; type: 'success' | 'error'; onDismiss: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 4000);
    return () => clearTimeout(t);
  }, [onDismiss]);
  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      className={`fixed top-4 left-4 right-4 z-[100] flex items-center gap-3 p-4 rounded-2xl shadow-2xl border ${
        type === 'success'
          ? 'bg-green-500/10 border-green-500/20 text-green-400'
          : 'bg-red-500/10 border-red-500/20 text-red-400'
      }`}
    >
      {type === 'success'
        ? <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
        : <AlertCircle className="w-5 h-5 flex-shrink-0" />}
      <p className="text-sm font-semibold flex-1">{message}</p>
    </motion.div>
  );
}

function ConfirmModal({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-4 pb-6 sm:pb-0">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onCancel} />
      <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}
        className="relative w-full max-w-sm bg-card border border-white/10 rounded-3xl p-6 shadow-2xl">
        <div className="w-14 h-14 rounded-2xl bg-accent/10 flex items-center justify-center mb-4 mx-auto">
          <CheckCircle2 className="w-7 h-7 text-accent" />
        </div>
        <h3 className="text-xl font-black text-center mb-2">Mark Up To Date?</h3>
        <p className="text-sm text-muted-foreground text-center mb-6 leading-relaxed">
          Are you sure you want to mark ALL episodes of this show as watched? This will update your progress.
        </p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 py-3 bg-muted font-bold rounded-xl text-sm hover:bg-muted/80 transition-colors">
            Cancel
          </button>
          <button onClick={onConfirm} className="flex-1 py-3 bg-accent text-white font-bold rounded-xl text-sm hover:bg-accent/90 transition-colors">
            Confirm
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default function MarkUpToDateButton({ showId, seasons }: { showId: number, seasons: any[] }) {
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const markShowAsFinished = useStore((state) => state.markShowAsFinished);

  const handleMarkUpToDate = async () => {
    setShowConfirm(false);
    setIsLoading(true);
    try {
      const validSeasons = seasons.filter(s => s.season_number > 0);
      const allEpisodes: WatchedEpisode[] = []; // Changed from let to const

      // Fetch all seasons in parallel to get their episodes
      const seasonPromises = validSeasons.map(s => getSeasonDetails(showId, s.season_number));
      const seasonResults = await Promise.all(seasonPromises);

      seasonResults.forEach(seasonData => {
        if (seasonData.episodes) {
          seasonData.episodes.forEach((ep: any) => {
            allEpisodes.push({
              id: ep.id,
              season: seasonData.season_number,
              episode: ep.episode_number
            });
          });
        }
      });

      markShowAsFinished(showId, allEpisodes);
      setToast({ message: "Show marked as Up to Date!", type: "success" });
    } catch (error) {
      console.error("Failed to fetch episodes", error);
      setToast({ message: "Failed to mark show as up to date.", type: "error" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setShowConfirm(true)}
        disabled={isLoading}
        className="w-14 flex-shrink-0 flex items-center justify-center bg-card border border-border rounded-2xl shadow-xl hover:bg-muted/80 transition-colors"
        aria-label="Mark show as up to date"
      >
        {isLoading ? <Loader2 className="w-6 h-6 animate-spin text-accent" /> : <CheckCircle2 className="w-6 h-6 text-accent" />}
      </button>

      <AnimatePresence>
        {toast && <Toast key="toast" message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />}
        {showConfirm && <ConfirmModal key="modal" onConfirm={handleMarkUpToDate} onCancel={() => setShowConfirm(false)} />}
      </AnimatePresence>
    </>
  );
}
