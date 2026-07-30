"use client";

import { useEffect, useState } from 'react';
import { fetchSocialComments, SocialComment } from '@/lib/socialComments';
import { MessageSquare, Star, ThumbsUp, Eye, EyeOff, ExternalLink, Sparkles } from 'lucide-react';
import Image from 'next/image';

interface TraktShoutsSectionProps {
  type: 'show' | 'movie' | 'episode';
  title: string;
  id: number;
  season?: number;
  episode?: number;
}

export default function TraktShoutsSection({ type, title, id, season, episode }: TraktShoutsSectionProps) {
  const [comments, setComments] = useState<SocialComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [revealedSpoilers, setRevealedSpoilers] = useState<Record<string, boolean>>({});

  useEffect(() => {
    async function loadComments() {
      setLoading(true);
      const data = await fetchSocialComments(type, title, id, season, episode);
      setComments(data);
      setLoading(false);
    }

    loadComments();
  }, [type, title, id, season, episode]);

  const toggleSpoiler = (commentId: string) => {
    setRevealedSpoilers(prev => ({ ...prev, [commentId]: !prev[commentId] }));
  };

  const getPlatformBadge = (platform: SocialComment['platform']) => {
    if (platform === 'trakt') {
      return <span className="bg-red-500/15 border border-red-500/30 text-red-400 text-[10px] font-black px-2 py-0.5 rounded-full uppercase">Trakt Shout</span>;
    }
    if (platform === 'serializd') {
      return <span className="bg-purple-500/15 border border-purple-500/30 text-purple-400 text-[10px] font-black px-2 py-0.5 rounded-full uppercase">Serializd Review</span>;
    }
    return <span className="bg-sky-500/15 border border-sky-500/30 text-sky-400 text-[10px] font-black px-2 py-0.5 rounded-full uppercase">Simkl Discussion</span>;
  };

  if (loading) {
    return (
      <div className="py-6 text-center text-xs text-muted-foreground animate-pulse font-medium">
        Loading community shouts from Trakt, Serializd & Simkl...
      </div>
    );
  }

  if (comments.length === 0) return null;

  return (
    <div className="flex flex-col gap-4 my-6">
      <div className="flex items-center justify-between">
        <h4 className="font-bold text-foreground text-sm flex items-center gap-1.5">
          <MessageSquare className="w-4 h-4 text-accent" /> Community Shouts & Reviews
        </h4>
        <span className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">
          Trakt • Serializd • Simkl
        </span>
      </div>

      <div className="flex flex-col gap-3">
        {comments.map((comment) => {
          const isSpoilerHidden = comment.isSpoiler && !revealedSpoilers[comment.id];

          return (
            <div key={comment.id} className="bg-card border border-border/80 rounded-2xl p-4 shadow-sm flex flex-col gap-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full overflow-hidden bg-accent/20 border border-accent/30 relative flex items-center justify-center font-black text-xs text-accent">
                    {comment.avatar ? (
                      <img src={comment.avatar} alt={comment.author} className="w-full h-full object-cover" />
                    ) : (
                      comment.author.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div className="flex flex-col">
                    <span className="font-bold text-foreground text-xs">{comment.author}</span>
                    <span className="text-[10px] text-muted-foreground">
                      {new Date(comment.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {comment.rating && (
                    <span className="flex items-center gap-1 text-amber-400 font-bold text-xs">
                      <Star className="w-3.5 h-3.5 fill-current" /> {comment.rating}/10
                    </span>
                  )}
                  {getPlatformBadge(comment.platform)}
                </div>
              </div>

              {/* Comment Content with Spoiler Blur */}
              <div className="relative">
                <p className={`text-xs text-foreground leading-relaxed ${isSpoilerHidden ? 'blur-sm select-none' : ''}`}>
                  {comment.comment}
                </p>

                {comment.isSpoiler && (
                  <button
                    onClick={() => toggleSpoiler(comment.id)}
                    className="mt-2 flex items-center gap-1 text-[11px] font-bold text-amber-400 hover:underline"
                  >
                    {isSpoilerHidden ? (
                      <>
                        <Eye className="w-3.5 h-3.5" /> Show Spoiler Warning
                      </>
                    ) : (
                      <>
                        <EyeOff className="w-3.5 h-3.5" /> Hide Spoiler
                      </>
                    )}
                  </button>
                )}
              </div>

              {/* Bottom Likes & Links */}
              <div className="flex items-center justify-between pt-2 border-t border-border/40 text-[11px] text-muted-foreground">
                <span className="flex items-center gap-1">
                  <ThumbsUp className="w-3 h-3 text-accent" /> {comment.likes} upvotes
                </span>

                {comment.serializdUrl && (
                  <a
                    href={comment.serializdUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-purple-400 font-bold hover:underline"
                  >
                    <span>View on Serializd</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
