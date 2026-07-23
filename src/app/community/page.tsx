"use client";

import { useEffect, useState } from 'react';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import TopNav from '@/components/TopNav';
import { User, Eye, Users } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
import { cacheManager } from '@/lib/cache';
import { getShowDetails } from '@/lib/tmdb';
import { motion } from 'framer-motion';

// Helper component to lazily fetch and cache show names
function ShowBadge({ showId, season, episode }: { showId: number, season: number, episode: number }) {
  const [showName, setShowName] = useState<string>(`Show #${showId}`);

  useEffect(() => {
    async function fetchName() {
      const cacheKey = `show_details_${showId}`;
      const cached = cacheManager.get<any>(cacheKey);
      if (cached) {
        setShowName(cached.name || cached.title);
      } else {
        try {
          const data = await getShowDetails(showId);
          cacheManager.set(cacheKey, data);
          setShowName(data.name || data.title);
        } catch (e) {
          // Ignore
        }
      }
    }
    fetchName();
  }, [showId]);

  return (
    <Link href={`/show/${showId}`} className="text-xs font-bold text-accent hover:underline">
      {showName} • S{season}E{episode}
    </Link>
  );
}

function FeedItem({ comment, index }: { comment: any, index: number }) {
  const [revealed, setRevealed] = useState(!comment.isSpoiler);
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="flex gap-3 p-4 border-b border-border/50 bg-background hover:bg-card/30 transition-colors"
    >
      <div className="w-10 h-10 rounded-full bg-muted border border-border flex items-center justify-center flex-shrink-0 mt-1">
        <User className="w-5 h-5 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-0.5">
          <div className="flex items-center gap-2">
            <span className="font-bold text-foreground text-sm">{comment.userDisplayName || 'Anonymous'}</span>
            <span className="text-[10px] text-muted-foreground">
              {comment.timestamp ? formatDistanceToNow(comment.timestamp.toDate(), { addSuffix: true }) : 'just now'}
            </span>
          </div>
          {comment.isSpoiler && (
            <span className="text-[9px] uppercase font-bold tracking-wider text-red-500 bg-red-500/10 px-1.5 py-0.5 rounded">Spoiler</span>
          )}
        </div>
        
        <div className="mb-2">
          <ShowBadge showId={comment.showId} season={comment.seasonNumber} episode={comment.episodeNumber} />
        </div>
        
        <div className={`relative transition-all duration-300 ${!revealed ? 'cursor-pointer group mt-1' : 'mt-1'}`} onClick={() => !revealed && setRevealed(true)}>
          <div className={!revealed ? 'blur-md opacity-50 pointer-events-none select-none' : ''}>
            {comment.text && (
              <p className="text-sm text-foreground leading-relaxed break-words">
                {comment.text}
              </p>
            )}
            
            {comment.mediaUrl && (
              <div className="mt-3 relative rounded-xl overflow-hidden border border-border inline-block max-w-[250px]">
                <img src={comment.mediaUrl} alt="Reaction GIF" className="w-full h-auto object-cover" loading="lazy" />
              </div>
            )}
          </div>
          
          {!revealed && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="bg-background/80 backdrop-blur-sm border border-border px-3 py-1.5 rounded-full flex items-center gap-2 shadow-lg group-hover:scale-105 transition-transform">
                <Eye className="w-4 h-4 text-foreground" />
                <span className="text-xs font-bold text-foreground">Tap to Reveal</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export default function CommunityPage() {
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, 'comments'),
      orderBy('timestamp', 'desc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetched = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setComments(fetched);
      setLoading(false);
    }, (err) => {
      console.error("Community Feed Error:", err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="min-h-screen bg-background pb-20">
      <TopNav title="Community Feed" />
      
      <div className="pt-2 px-4 pb-4 border-b border-border sticky top-14 bg-background/90 backdrop-blur-md z-10 flex items-center gap-2">
        <Users className="w-5 h-5 text-accent" />
        <span className="text-sm font-bold text-muted-foreground">What everyone is watching</span>
      </div>

      <div className="flex flex-col">
        {loading ? (
          <div className="p-8 text-center text-muted-foreground text-sm font-bold">
            <span className="animate-pulse">Loading global feed...</span>
          </div>
        ) : comments.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-sm">
            It&apos;s quiet... too quiet.
          </div>
        ) : (
          comments.map((comment, index) => (
            <FeedItem key={comment.id} comment={comment} index={index} />
          ))
        )}
      </div>
    </div>
  );
}
