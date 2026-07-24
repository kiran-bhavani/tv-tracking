"use client";

import { useState, useEffect } from 'react';
import { collection, addDoc, query, where, orderBy, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { Send, User, MessageSquare, Image as ImageIcon, EyeOff, Eye, X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import Image from 'next/image';

const REACTION_GIFS = [
  "https://media.giphy.com/media/26ufdipQqUpiX5LEo/giphy.gif",
  "https://media.giphy.com/media/l0HlvtIPzPdt2usKs/giphy.gif",
  "https://media.giphy.com/media/3o7TKyPpWvFrpwSkhO/giphy.gif",
  "https://media.giphy.com/media/fsQbx1hX7hPBBpIM5b/giphy.gif",
  "https://media.giphy.com/media/3o6Zt4HU9uwXmXSAuI/giphy.gif",
  "https://media.giphy.com/media/jUwpNzg9IcyrK/giphy.gif"
];

// Helper Component for Spoiler Comments
function CommentItem({ comment }: { comment: any }) {
  const [revealed, setRevealed] = useState(!comment.isSpoiler);
  
  return (
    <div className="flex gap-3 relative">
      <div className="w-8 h-8 rounded-full bg-muted border border-border flex items-center justify-center flex-shrink-0 mt-1 z-10 relative">
        <User className="w-4 h-4 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 mb-1">
          <span className="font-bold text-foreground text-sm">{comment.userDisplayName}</span>
          <span className="text-[10px] text-muted-foreground">
            {comment.timestamp ? formatDistanceToNow(comment.timestamp.toDate(), { addSuffix: true }) : 'just now'}
          </span>
          {comment.isSpoiler && (
            <span className="text-[10px] uppercase font-bold tracking-wider text-red-500 bg-red-500/10 px-1.5 py-0.5 rounded">Spoiler</span>
          )}
        </div>
        
        <div className={`relative transition-all duration-300 ${!revealed ? 'cursor-pointer group' : ''}`} onClick={() => !revealed && setRevealed(true)}>
          <div className={!revealed ? 'blur-md opacity-50 pointer-events-none select-none' : ''}>
            {comment.text && (
              <p className="text-sm text-foreground leading-relaxed bg-muted/50 p-3 rounded-xl rounded-tl-none inline-block border border-border/50 break-words max-w-full">
                {comment.text}
              </p>
            )}
            
            {comment.mediaUrl && (
              <div className="mt-2 relative rounded-xl overflow-hidden border border-border inline-block max-w-[200px] sm:max-w-[250px]">
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
    </div>
  );
}

interface EpisodeCommentsProps {
  showId: number;
  seasonNumber: number;
  episodeNumber: number;
}

export default function EpisodeComments({ showId, seasonNumber, episodeNumber }: EpisodeCommentsProps) {
  const { user } = useAuth();
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isSpoiler, setIsSpoiler] = useState(false);
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [selectedGif, setSelectedGif] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [cooldown, setCooldown] = useState(false);

  useEffect(() => {
    const q = query(
      collection(db, 'comments'),
      where('showId', '==', showId),
      where('seasonNumber', '==', seasonNumber),
      where('episodeNumber', '==', episodeNumber),
      orderBy('timestamp', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedComments = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setComments(fetchedComments);
      setLoading(false);
    }, (error) => {
      // It might fail on first run due to missing indexes, but we can catch it here
      console.error("Error fetching comments. Missing index?", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [showId, seasonNumber, episodeNumber]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!newComment.trim() && !selectedGif) || !user || cooldown) return;
    if (newComment.trim().length > 500) return;

    setCooldown(true);
    setTimeout(() => setCooldown(false), 5000);

    try {
      await addDoc(collection(db, 'comments'), {
        showId,
        seasonNumber,
        episodeNumber,
        userId: user.uid,
        userDisplayName: user.displayName || user.email?.split('@')[0] || 'User',
        text: newComment.trim().slice(0, 500),
        mediaUrl: selectedGif,
        isSpoiler: isSpoiler,
        timestamp: serverTimestamp()
      });
      setNewComment('');
      setSelectedGif(null);
      setIsSpoiler(false);
      setShowGifPicker(false);
    } catch (error) {
      console.error("Error posting comment:", error);
    }
  };

  return (
    <div className="mt-8 border-t border-border pt-6">
      <div className="flex items-center gap-2 mb-4">
        <MessageSquare className="w-5 h-5 text-foreground" />
        <h3 className="font-bold text-foreground text-lg">Comments ({comments.length})</h3>
      </div>

      {/* Comment Form */}
      {user ? (
        <div className="mb-6 bg-card border border-border rounded-2xl p-3 shadow-sm relative">
          
          {/* Selected GIF Preview */}
          {selectedGif && (
            <div className="relative inline-block mb-3 group">
              <img src={selectedGif} alt="Selected GIF" className="w-32 rounded-lg border border-border" />
              <button 
                onClick={() => setSelectedGif(null)}
                className="absolute -top-2 -right-2 w-6 h-6 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="What did you think of this episode?"
              maxLength={500}
              className="flex-1 bg-transparent px-2 text-sm text-foreground placeholder:text-muted-foreground outline-none"
            />
            <button
              type="submit"
              disabled={(!newComment.trim() && !selectedGif) || cooldown}
              className="w-9 h-9 rounded-full bg-accent flex items-center justify-center text-accent-foreground disabled:opacity-50 disabled:cursor-not-allowed transition-opacity flex-shrink-0"
            >
              <Send className="w-4 h-4 ml-0.5" />
            </button>
          </form>

          <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/50">
            <div className="flex items-center gap-3">
              <button 
                type="button"
                onClick={() => setShowGifPicker(!showGifPicker)}
                className={`p-1.5 rounded-md transition-colors ${showGifPicker || selectedGif ? 'bg-accent/20 text-accent' : 'text-muted-foreground hover:bg-muted'}`}
                title="Add GIF"
              >
                <ImageIcon className="w-5 h-5" />
              </button>
              
              <label className="flex items-center gap-1.5 cursor-pointer group">
                <div className={`w-8 h-4 rounded-full relative transition-colors ${isSpoiler ? 'bg-red-500' : 'bg-muted border border-border'}`}>
                  <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${isSpoiler ? 'left-4' : 'left-1'}`} />
                </div>
                <input 
                  type="checkbox" 
                  checked={isSpoiler} 
                  onChange={(e) => setIsSpoiler(e.target.checked)}
                  className="sr-only"
                />
                <span className={`text-xs font-bold transition-colors ${isSpoiler ? 'text-red-500' : 'text-muted-foreground group-hover:text-foreground'}`}>
                  Spoilers
                </span>
              </label>
            </div>
          </div>

          {/* GIF Picker */}
          {showGifPicker && (
            <div className="absolute top-full left-0 w-full sm:w-[320px] mt-2 bg-card border border-border rounded-xl shadow-2xl p-3 z-50">
              <div className="flex justify-between items-center mb-2 pb-2 border-b border-border/50">
                <span className="text-xs font-bold text-muted-foreground">Quick Reactions</span>
                <button onClick={() => setShowGifPicker(false)} className="text-muted-foreground hover:text-foreground">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2 h-48 overflow-y-auto hide-scrollbar">
                {REACTION_GIFS.map((gif, i) => (
                  <button 
                    key={i} 
                    type="button"
                    onClick={() => {
                      setSelectedGif(gif);
                      setShowGifPicker(false);
                    }}
                    className="relative aspect-video rounded overflow-hidden border border-border/50 hover:border-accent transition-colors"
                  >
                    <img src={gif} alt="GIF option" className="w-full h-full object-cover" loading="lazy" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-muted rounded-xl p-4 text-center mb-6 border border-border">
          <p className="text-sm text-muted-foreground font-medium">Log in to join the conversation.</p>
        </div>
      )}

      {/* Comments List */}
      <div className="space-y-4">
        {loading ? (
          <p className="text-center text-muted-foreground text-sm py-4">Loading comments...</p>
        ) : comments.length === 0 ? (
          <p className="text-center text-muted-foreground text-sm py-4 bg-muted/50 rounded-xl">Be the first to comment!</p>
        ) : (
          comments.map(comment => (
            <CommentItem key={comment.id} comment={comment} />
          ))
        )}
      </div>
    </div>
  );
}
