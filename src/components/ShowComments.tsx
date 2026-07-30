"use client";

import { useState, useEffect } from 'react';
import { collection, addDoc, query, where, orderBy, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { Send, User, MessageSquare, Image as ImageIcon, Eye, X, Award, ShieldCheck } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fetchMetacriticCriticReviews } from '@/lib/audienceReviews';
import { fetchRottenTomatoesReviews, fetchLetterboxdReviews, fetchDoubanReviews } from '@/lib/additionalReviews';

interface ShowCommentsProps {
  id: number;
  type: 'show' | 'movie';
  title: string;
}

function CommentCard({ comment }: { comment: any }) {
  const [revealed, setRevealed] = useState(!comment.isSpoiler);

  const isCritic = comment.isCritic || comment.userDisplayName?.includes('Critic') || comment.userDisplayName?.includes('Rotten Tomatoes');

  return (
    <div className={`p-4 rounded-2xl border transition-all ${isCritic ? 'bg-amber-500/5 border-amber-500/30' : 'bg-card border-border/80'}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${isCritic ? 'bg-amber-500 text-black' : 'bg-muted border border-border text-muted-foreground'}`}>
            {isCritic ? <Award className="w-4 h-4" /> : <User className="w-3.5 h-3.5" />}
          </div>
          <span className="font-bold text-sm text-foreground">{comment.userDisplayName}</span>
          {isCritic && (
            <span className="flex items-center gap-1 text-[10px] font-extrabold uppercase bg-amber-500/20 text-amber-500 px-2 py-0.5 rounded-full border border-amber-500/40">
              <ShieldCheck className="w-3 h-3" /> Top Critic
            </span>
          )}
        </div>
        <span className="text-[10px] text-muted-foreground">
          {comment.timestamp ? (typeof comment.timestamp.toDate === 'function' ? formatDistanceToNow(comment.timestamp.toDate(), { addSuffix: true }) : 'recently') : 'just now'}
        </span>
      </div>

      <div className={`relative transition-all ${!revealed ? 'cursor-pointer' : ''}`} onClick={() => !revealed && setRevealed(true)}>
        <div className={!revealed ? 'blur-md opacity-40 select-none' : ''}>
          <p className="text-sm text-foreground leading-relaxed break-words">{comment.text}</p>
        </div>

        {!revealed && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-background/90 border border-border px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-md">
              <Eye className="w-3.5 h-3.5" /> Tap to Reveal Spoiler
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ShowComments({ id, type, title }: ShowCommentsProps) {
  const { user } = useAuth();
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isSpoiler, setIsSpoiler] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let firestoreComments: any[] = [];
    let externalReviews: any[] = [];

    async function loadExternal() {
      try {
        const [meta, rt, lb, dbReviews] = await Promise.all([
          fetchMetacriticCriticReviews(title, type),
          fetchRottenTomatoesReviews(title),
          type === 'movie' ? fetchLetterboxdReviews(title) : Promise.resolve([]),
          fetchDoubanReviews(title)
        ]);

        const mappedMeta = meta.map(c => ({
          id: c.id,
          userDisplayName: c.author,
          text: c.text,
          isSpoiler: c.isSpoiler,
          isCritic: true
        }));

        const mappedRt = rt.map(c => ({
          id: c.id,
          userDisplayName: c.author,
          text: c.text,
          isSpoiler: c.isSpoiler,
          isCritic: true
        }));

        const mappedLb = lb.map(c => ({
          id: c.id,
          userDisplayName: c.author,
          text: c.text,
          isSpoiler: c.isSpoiler,
          isCritic: false
        }));

        const mappedDb = dbReviews.map(c => ({
          id: c.id,
          userDisplayName: c.author,
          text: c.text,
          isSpoiler: c.isSpoiler,
          isCritic: false
        }));

        externalReviews = [...mappedMeta, ...mappedRt, ...mappedLb, ...mappedDb];
        combine();
      } catch (err) {
        console.error("External reviews load error:", err);
      }
    }

    function combine() {
      setComments([...firestoreComments, ...externalReviews]);
      setLoading(false);
    }

    loadExternal();

    const q = query(
      collection(db, 'comments'),
      where('showId', '==', id),
      where('seasonNumber', '==', null),
      orderBy('timestamp', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      firestoreComments = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      combine();
    }, (err) => {
      console.error("Firestore show comments error:", err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [id, type, title]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !user) return;

    try {
      await addDoc(collection(db, 'comments'), {
        showId: id,
        seasonNumber: null,
        episodeNumber: null,
        userId: user.uid,
        userDisplayName: user.displayName || user.email?.split('@')[0] || 'User',
        text: newComment.trim().slice(0, 500),
        isSpoiler,
        timestamp: serverTimestamp()
      });
      setNewComment('');
      setIsSpoiler(false);
    } catch (err) {
      console.error("Error submitting show comment:", err);
    }
  };

  return (
    <div className="px-4 mt-10 pt-8 border-t border-border/60">
      <div className="flex items-center gap-2 mb-4">
        <MessageSquare className="w-5 h-5 text-accent" />
        <h3 className="font-bold text-foreground text-xl">Reviews & Critic Comments ({comments.length})</h3>
      </div>

      {user && (
        <form onSubmit={handleSubmit} className="mb-6 bg-card border border-border/80 p-3.5 rounded-2xl shadow-sm">
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder={`Share your review of ${title}...`}
            maxLength={500}
            className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none mb-3"
          />
          <div className="flex items-center justify-between pt-2 border-t border-border/40">
            <label className="flex items-center gap-1.5 cursor-pointer text-xs font-bold text-muted-foreground">
              <input type="checkbox" checked={isSpoiler} onChange={(e) => setIsSpoiler(e.target.checked)} className="rounded" />
              Contains Spoilers
            </label>
            <button type="submit" disabled={!newComment.trim()} className="px-4 py-1.5 rounded-full bg-accent text-accent-foreground font-bold text-xs disabled:opacity-50">
              Post Review
            </button>
          </div>
        </form>
      )}

      <div className="space-y-3">
        {loading ? (
          <p className="text-center text-xs text-muted-foreground py-4">Loading reviews...</p>
        ) : comments.length === 0 ? (
          <p className="text-center text-xs text-muted-foreground py-4 bg-muted/30 rounded-xl">Be the first to review {title}!</p>
        ) : (
          comments.map(c => <CommentCard key={c.id} comment={c} />)
        )}
      </div>
    </div>
  );
}
