"use client";

import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import TopNav from '@/components/TopNav';
import { User, Tv, Film, Star, Share2, Loader2, Users } from 'lucide-react';
import ShowCard from '@/components/ShowCard';
import { motion, AnimatePresence } from 'framer-motion';
import WatchTogetherModal from '@/components/WatchTogetherModal';

export default function PublicUserProfilePage({ params }: { params: { uid: string } }) {
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [showWatchTogether, setShowWatchTogether] = useState(false);

  useEffect(() => {
    async function loadUser() {
      try {
        const userRef = doc(db, 'users', params.uid);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
          setError("User profile not found.");
          setLoading(false);
          return;
        }

        setUserData(userSnap.data());
      } catch (err) {
        console.error("Failed to load profile", err);
        setError("Failed to load user profile.");
      } finally {
        setLoading(false);
      }
    }

    loadUser();
  }, [params.uid]);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  if (error || !userData) {
    return (
      <div className="min-h-screen bg-background">
        <TopNav title="User Not Found" />
        <div className="flex flex-col items-center justify-center mt-32 px-6 text-center">
          <p className="text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  const watchlist = Object.values(userData.watchlist || {}) as any[];
  const movieReviews = Object.entries(userData.movieReviews || {}) as [string, any][];

  return (
    <div className="min-h-screen bg-background pb-20">
      <TopNav title="User Profile" />

      {/* Profile Header */}
      <div className="px-6 pt-8 pb-6 border-b border-border bg-card/30 flex flex-col items-center text-center relative">
        <div className="w-24 h-24 rounded-full bg-accent/20 border-2 border-accent flex items-center justify-center mb-4 shadow-xl overflow-hidden relative">
          {userData.photoURL ? (
            <img src={userData.photoURL} alt={userData.displayName} className="w-full h-full object-cover" />
          ) : (
            <User className="w-12 h-12 text-accent" />
          )}
        </div>

        <h1 className="text-2xl font-black text-foreground">{userData.displayName || 'TV Time User'}</h1>
        <p className="text-xs text-muted-foreground mt-1">TV & Movie Enthusiast</p>

        <div className="flex gap-2 mt-4">
          <button
            onClick={() => setShowWatchTogether(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-accent text-accent-foreground rounded-full text-xs font-bold shadow-lg hover:bg-accent/90 transition-colors"
          >
            <Users className="w-4 h-4" />
            <span>Watch Together</span>
          </button>
          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 px-4 py-2 bg-accent/20 text-accent rounded-full text-xs font-bold hover:bg-accent/30 transition-colors"
          >
            <Share2 className="w-4 h-4" />
            {copied ? 'Copied!' : 'Share Profile'}
          </button>
        </div>
      </div>

      {/* Watchlist Section */}
      <div className="p-6">
        <h3 className="font-bold text-foreground text-lg mb-4 flex items-center gap-2">
          <Tv className="w-5 h-5 text-accent" /> Public Watchlist ({watchlist.length})
        </h3>

        {watchlist.length === 0 ? (
          <p className="text-sm text-muted-foreground italic">No shows or movies on watchlist yet.</p>
        ) : (
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
            {watchlist.map((show: any) => (
              <ShowCard key={show.id} show={show} />
            ))}
          </div>
        )}
      </div>

      {/* Movie Reviews Section */}
      {movieReviews.length > 0 && (
        <div className="p-6 border-t border-border">
          <h3 className="font-bold text-foreground text-lg mb-4 flex items-center gap-2">
            <Film className="w-5 h-5 text-accent" /> Movie Reviews ({movieReviews.length})
          </h3>

          <div className="flex flex-col gap-3">
            {movieReviews.map(([movieId, rev]) => (
              <div key={movieId} className="bg-card border border-border/80 rounded-2xl p-4 shadow-sm flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-amber-400 font-bold text-xs">
                    <Star className="w-4 h-4 fill-current" /> {rev.rating} / 5
                  </div>
                  <span className="text-[10px] text-muted-foreground">
                    {new Date(rev.watchedDate).toLocaleDateString()}
                  </span>
                </div>
                {rev.review && (
                  <p className="text-sm text-foreground leading-relaxed italic">
                    &ldquo;{rev.review}&rdquo;
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      <AnimatePresence>
        {showWatchTogether && (
          <WatchTogetherModal
            targetUserUid={params.uid}
            targetUserName={userData.displayName || 'User'}
            onClose={() => setShowWatchTogether(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
