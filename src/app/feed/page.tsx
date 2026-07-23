"use client";

import { useEffect, useState } from 'react';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import TopNav from '@/components/TopNav';
import Link from 'next/link';
import { Users, User, Tv } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function FeedPage() {
  const { user } = useAuth();
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Listen to global activity feed
    const q = query(
      collection(db, 'activityFeed'),
      orderBy('timestamp', 'desc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const acts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setActivities(acts);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching activity feed:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="min-h-screen bg-background pb-10">
      <TopNav title="Activity Feed" />
      
      {!user && (
        <div className="px-4 py-8 bg-muted border-b border-border text-center">
          <Users className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <h2 className="text-lg font-bold text-foreground">Join the Community</h2>
          <p className="text-sm text-muted-foreground mt-2 mb-4">
            Sign in to let your friends see what you&apos;re watching!
          </p>
          <Link href="/login" className="bg-accent text-accent-foreground px-6 py-2 rounded-full font-bold">
            Sign In
          </Link>
        </div>
      )}

      <div className="px-4 py-6 space-y-6">
        {loading ? (
          <div className="flex justify-center py-10">
            <span className="text-muted-foreground font-bold">Loading feed...</span>
          </div>
        ) : activities.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground">
            No recent activity. Watch an episode to start the feed!
          </div>
        ) : (
          activities.map((act) => (
            <div key={act.id} className="flex gap-4 border-b border-border/50 pb-6 last:border-0">
              <div className="w-12 h-12 rounded-full bg-muted border border-border flex items-center justify-center flex-shrink-0">
                <User className="w-6 h-6 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start gap-2">
                  <h4 className="font-bold text-foreground truncate">
                    {act.userDisplayName}
                  </h4>
                  <span className="text-[10px] text-muted-foreground whitespace-nowrap flex-shrink-0">
                    {act.timestamp ? formatDistanceToNow(act.timestamp.toDate(), { addSuffix: true }) : 'just now'}
                  </span>
                </div>
                
                <p className="text-sm text-muted-foreground mt-1">
                  watched <span className="font-bold text-accent">S{act.seasonNumber} E{act.episodeNumber}</span> of
                </p>
                <Link href={`/show/${act.showId}`} className="inline-flex items-center gap-1.5 mt-2 text-foreground font-black hover:text-accent transition-colors">
                  <Tv className="w-4 h-4" />
                  {act.showName}
                </Link>
                {act.episodeName && (
                  <p className="text-xs text-muted-foreground mt-1 truncate">&quot;{act.episodeName}&quot;</p>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
