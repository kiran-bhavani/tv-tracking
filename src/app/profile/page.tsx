"use client";

import { useEffect, useState } from 'react';
import TopNav from '@/components/TopNav';
import { useStore } from '@/store/useStore';
import { User as UserIcon, Clock, Tv, Film, TrendingUp, Edit3, Share } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertCircle } from 'lucide-react';

function Toast({ message, type, onDismiss }: { message: string; type: 'success' | 'error' | 'info'; onDismiss: () => void }) {
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
        type === 'error'
          ? 'bg-red-500/10 border-red-500/20 text-red-400'
          : 'bg-green-500/10 border-green-500/20 text-green-400'
      }`}
    >
      {type === 'error'
        ? <AlertCircle className="w-5 h-5 flex-shrink-0" />
        : <CheckCircle2 className="w-5 h-5 flex-shrink-0" />}
      <p className="text-sm font-semibold flex-1 whitespace-pre-line">{message}</p>
    </motion.div>
  );
}
import ManageListModal from '@/components/ManageListModal';

export default function ProfilePage() {
  const [mounted, setMounted] = useState(false);
  const { user } = useAuth();
  const watchedEpisodes = useStore(state => state.watchedEpisodes);
  const watchlistMap = useStore(state => state.watchlist);
  const customLists = useStore(state => state.customLists);
  const [sharingId, setSharingId] = useState<string | null>(null);
  
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  
  // Custom Lists Management
  const [managingList, setManagingList] = useState<any | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-background">
        <TopNav title="Profile" />
        <div className="flex justify-center mt-20 text-muted-foreground">Loading...</div>
      </div>
    );
  }

  const handleShareList = async (list: any) => {
    if (!user) {
      setToast({ message: "You must be logged in to share lists.", type: "error" });
      return;
    }
    setSharingId(list.id);
    try {
      const listRef = doc(db, 'public_lists', list.id);
      await setDoc(listRef, {
        ...list,
        authorId: user.uid,
        authorName: user.displayName || user.email?.split('@')[0] || 'User',
        updatedAt: new Date().toISOString()
      });
      
      const shareUrl = `${window.location.origin}/list/${list.id}`;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(shareUrl);
        setToast({ message: "Link copied to clipboard! Anyone with this link can view your list.", type: "success" });
      } else {
        setToast({ message: `Your list is public! Copy this link to share it:\n\n${shareUrl}`, type: "success" });
      }
    } catch (err) {
      console.error("Failed to share list:", err);
      setToast({ message: "Failed to generate share link.", type: "error" });
    } finally {
      setSharingId(null);
    }
  };

  let totalEpisodes = 0;
  let totalMovies = 0;
  let totalMinutes = 0;
  const genreCounts: Record<string, number> = {};
  
  Object.keys(watchedEpisodes).forEach(id => {
    const show = watchlistMap[Number(id)];
    if (show) {
      if (show.type === 'movie') {
        totalMovies += 1;
        totalMinutes += show.runtime || 120;
        show.genres?.forEach(g => {
          genreCounts[g.name] = (genreCounts[g.name] || 0) + 1;
        });
      } else {
        const showEpisodes = watchedEpisodes[Number(id)] || [];
        const count = showEpisodes.filter(e => typeof e === 'object' && e !== null).length;
        totalEpisodes += count;
        totalMinutes += count * (show.runtime || 45);
        show.genres?.forEach(g => {
          genreCounts[g.name] = (genreCounts[g.name] || 0) + count;
        });
      }
    }
  });

  const months = Math.floor(totalMinutes / (60 * 24 * 30));
  const days = Math.floor((totalMinutes % (60 * 24 * 30)) / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);

  const topGenres = Object.entries(genreCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  return (
    <div className="min-h-screen bg-background pb-10">
      <AnimatePresence>
        {toast && <Toast key="toast" message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />}
      </AnimatePresence>

      <TopNav title="Profile" />
      
      <div className="flex flex-col items-center pt-8 pb-6 border-b border-border">
        <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center mb-4 relative overflow-hidden border-2 border-accent">
          {user?.photoURL ? (
            <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" />
          ) : (
            <UserIcon className="w-12 h-12 text-muted-foreground" />
          )}
        </div>
        <h2 className="text-2xl font-black text-foreground">
          {user?.displayName || 'TV Fanatic'}
        </h2>
        <p className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
          {user?.email}
        </p>
      </div>

      <div className="px-4 py-8">
        <h3 className="text-lg font-bold text-foreground mb-6 flex items-center gap-2">
          <Clock className="w-5 h-5 text-accent" /> 
          Time Spent Watching
        </h3>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ staggerChildren: 0.1 }}
          className="flex justify-between items-end gap-2 text-center"
        >
          <motion.div className="flex-1 bg-muted border border-border rounded-2xl py-6 flex flex-col justify-center items-center shadow-lg">
            <span className="text-4xl font-black text-foreground">{months}</span>
            <span className="text-xs text-muted-foreground font-bold uppercase mt-1 tracking-wider">Months</span>
          </motion.div>
          <motion.div className="flex-1 bg-muted border border-border rounded-2xl py-6 flex flex-col justify-center items-center shadow-lg">
            <span className="text-4xl font-black text-foreground">{days}</span>
            <span className="text-xs text-muted-foreground font-bold uppercase mt-1 tracking-wider">Days</span>
          </motion.div>
          <motion.div className="flex-1 bg-muted border border-border rounded-2xl py-6 flex flex-col justify-center items-center shadow-lg">
            <span className="text-4xl font-black text-accent">{hours}</span>
            <span className="text-xs text-muted-foreground font-bold uppercase mt-1 tracking-wider">Hours</span>
          </motion.div>
        </motion.div>
      </div>

      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="px-4 py-4 grid grid-cols-2 gap-4"
      >
        <div className="bg-card rounded-xl p-4 flex items-center gap-4 shadow-lg border border-border/50">
          <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0">
            <Tv className="w-6 h-6 text-accent" />
          </div>
          <div>
            <div className="text-2xl font-black text-foreground">{totalEpisodes}</div>
            <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Episodes</div>
          </div>
        </div>

        <div className="bg-card rounded-xl p-4 flex items-center gap-4 shadow-lg border border-border/50">
          <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0">
            <Film className="w-6 h-6 text-accent" />
          </div>
          <div>
            <div className="text-2xl font-black text-foreground">{totalMovies}</div>
            <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Movies</div>
          </div>
        </div>
      </motion.div>

      {topGenres.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="px-4 py-6"
        >
          <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-accent" />
            Top Genres
          </h3>
          <div className="space-y-4 bg-card border border-border/50 rounded-2xl p-5 shadow-lg">
            {topGenres.map(([genre, count], index) => {
              const maxCount = topGenres[0][1];
              const percentage = Math.max(5, Math.round((count / maxCount) * 100));
              return (
                <div key={genre} className="flex flex-col gap-2">
                  <div className="flex justify-between text-sm font-bold">
                    <span className="text-foreground">{genre}</span>
                    <span className="text-muted-foreground text-xs">{count} titles</span>
                  </div>
                  <div className="h-3 w-full bg-muted rounded-full overflow-hidden shadow-inner">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${percentage}%` }}
                      transition={{ duration: 1, delay: 0.5 + (index * 0.2), ease: "easeOut" }}
                      className="h-full bg-accent rounded-full relative overflow-hidden" 
                    >
                      <div className="absolute inset-0 bg-white/20 translate-x-[-100%] animate-[shimmer_2s_infinite]" />
                    </motion.div>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      <div className="px-4 py-6 border-t border-border mt-4">
        <div className="mb-6 flex justify-between items-end">
          <div>
            <h3 className="text-xl font-bold text-foreground">My Lists</h3>
            <p className="text-sm text-muted-foreground mt-1">Curate and share your favorite shows</p>
          </div>
          <button 
            onClick={() => setManagingList('NEW')}
            className="text-xs font-bold bg-accent text-accent-foreground px-4 py-2 rounded-full shadow hover:bg-accent/90 transition-colors"
          >
            + New List
          </button>
        </div>
        
        {customLists.length === 0 ? (
          <div className="text-center py-10 bg-muted/30 rounded-2xl border border-dashed border-border">
            <Film className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-50" />
            <p className="text-muted-foreground text-sm font-medium">You haven&apos;t created any custom lists yet.</p>
            <p className="text-muted-foreground text-xs mt-1">Add shows to a list from their details page.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {customLists.map((list) => (
              <motion.div 
                key={list.id} 
                whileHover={{ scale: 1.02 }}
                className="group bg-card border border-border/50 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />
                
                <div className="relative z-10 flex flex-col h-full">
                  <div className="flex-1 mb-6">
                    <h4 className="font-bold text-foreground text-lg mb-1">{list.name}</h4>
                    <p className="text-sm text-muted-foreground line-clamp-2">{list.description}</p>
                  </div>
                  
                  <div className="flex items-center justify-between mt-auto">
                    <span className="text-xs font-bold text-accent bg-accent/10 px-3 py-1 rounded-full">
                      {list.shows.length} {list.shows.length === 1 ? 'item' : 'items'}
                    </span>
                    
                    <div className="flex gap-2">
                      <button 
                        onClick={() => setManagingList(list)}
                        className="p-2 bg-muted hover:bg-muted/80 text-foreground rounded-full transition-colors flex items-center justify-center"
                        title="Manage List"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      
                      <button 
                        onClick={() => handleShareList(list)}
                        disabled={sharingId === list.id}
                        className="px-4 py-2 bg-accent text-accent-foreground text-xs font-bold rounded-full transition-all flex items-center gap-2 hover:bg-accent/90 disabled:opacity-70"
                      >
                        {sharingId === list.id ? (
                          <div className="w-4 h-4 border-2 border-accent-foreground/30 border-t-accent-foreground rounded-full animate-spin" />
                        ) : (
                          <Share className="w-4 h-4" />
                        )}
                        Share
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <div className="px-4 py-8 flex flex-col items-center">
        {!user && (
          <>
            <p className="text-sm text-muted-foreground mb-4 text-center">
              Sign in to save your stats to the cloud and never lose your watchlist.
            </p>
            <Link href="/login" className="px-8 py-3 bg-accent text-accent-foreground rounded-full font-bold shadow-lg block text-center">
              Sign In
            </Link>
          </>
        )}
      </div>

      {managingList && (
        <ManageListModal 
          list={managingList === 'NEW' ? null : managingList}
          onClose={() => setManagingList(null)}
          onShare={handleShareList}
        />
      )}
    </div>
  );
}
