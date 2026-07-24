"use client";

import { useState, useEffect } from 'react';
import { WifiOff, Wifi } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(false);
  const [showReconnected, setShowReconnected] = useState(false);

  useEffect(() => {
    // Initial check
    if (typeof window !== 'undefined') {
      setIsOffline(!navigator.onLine);
    }

    const handleOffline = () => {
      setIsOffline(true);
      setShowReconnected(false);
    };

    const handleOnline = () => {
      setIsOffline(false);
      setShowReconnected(true);
      setTimeout(() => setShowReconnected(false), 3000);
    };

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);

    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  return (
    <AnimatePresence>
      {isOffline && (
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -50, opacity: 0 }}
          className="fixed top-0 left-0 right-0 z-[100] bg-amber-500 text-amber-950 font-black text-xs py-2 px-4 flex items-center justify-center gap-2 shadow-lg"
        >
          <WifiOff className="w-4 h-4 stroke-[2.5]" />
          <span>Offline Mode — Displaying cached watchlist data</span>
        </motion.div>
      )}

      {showReconnected && !isOffline && (
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -50, opacity: 0 }}
          className="fixed top-0 left-0 right-0 z-[100] bg-emerald-500 text-emerald-950 font-black text-xs py-2 px-4 flex items-center justify-center gap-2 shadow-lg"
        >
          <Wifi className="w-4 h-4 stroke-[2.5]" />
          <span>Reconnected to Internet!</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
