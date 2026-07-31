"use client";

import { useState, useEffect } from 'react';
import { collection, addDoc, query, where, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { Send, User, MessageSquare, Eye, Award, ShieldCheck, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fetchRedditComments, fetchMetacriticCriticReviews } from '@/lib/audienceReviews';
import { fetchJikanAnimeReviews, fetchRottenTomatoesReviews } from '@/lib/additionalReviews';
import { fetchSocialComments } from '@/lib/socialComments';

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
          <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs overflow-hidden ${isCritic ? 'bg-amber-500 text-black' : 'bg-muted border border-border text-muted-foreground'}`}>
            {comment.avatar ? (
              <img src={comment.avatar} alt={comment.userDisplayName} className="w-full h-full object-cover" />
            ) : isCritic ? (
              <Award className="w-4 h-4" />
            ) : (
              <User className="w-3.5 h-3.5" />
            )}
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
        const [reddit, trakt, anime, meta] = await Promise.all([
          fetchRedditComments(title),
          fetchSocialComments(type, title, id),
          fetchJikanAnimeReviews(title),
          fetchMetacriticCriticReviews(title, type, id)
        ]);

        const mappedReddit = reddit.map(r => ({
          id: r.id,
          userDisplayName: r.author,
          avatar: r.avatar,
          text: r.text,
          isSpoiler: r.isSpoiler,
          isCritic: false
        }));

        const mappedTrakt = trakt.map(t => ({
          id: t.id,
          userDisplayName: `${t.author} (${t.platform})`,
          avatar: t.avatar,
          text: t.comment,
          isSpoiler: t.isSpoiler,
          isCritic: false
        }));

        const mappedAnime = anime.map(a => ({
          id: a.id,
          userDisplayName: `${a.author} (MyAnimeList)`,
          avatar: a.avatar,
          text: a.text,
          isSpoiler: a.isSpoiler,
          isCritic: false
        }));

        const mappedMeta = meta.map(m => ({
          id: m.id,
          userDisplayName: m.author,
          text: m.text,
          isSpoiler: m.isSpoiler,
          isCritic: true
        }));

        externalReviews = [...mappedReddit, ...mappedTrakt, ...mappedAnime, ...mappedMeta];
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
      where('showId', '==', id)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      firestoreComments = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter((c: any) => !c.seasonNumber || c.seasonNumber === 0);
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
        seasonNumber: 0,
        episodeNumber: 0,
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
        <h3 className="font-bold text-foreground text-xl">Reviews & Audience Comments ({comments.length})</h3>
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
          <div className="flex items-center justify-center gap-2 py-6 text-xs text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin text-accent" /> Loading reviews...
          </div>
        ) : comments.length === 0 ? (
          <p className="text-center text-xs text-muted-foreground py-4 bg-muted/30 rounded-xl">Be the first to review {title}!</p>
        ) : (
          comments.map(c => <CommentCard key={c.id} comment={c} />)
        )}
      </div>
    </div>
  );
}
