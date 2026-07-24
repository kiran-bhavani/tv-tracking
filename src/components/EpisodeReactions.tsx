"use client";

import { useState, useEffect } from 'react';
import { doc, getDoc, setDoc, onSnapshot, updateDoc, increment } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { Crown, Heart, User, Sparkles } from 'lucide-react';
import Image from 'next/image';
import { getImageUrl } from '@/lib/utils';

const EMOTIONS = [
  { id: 'mind_blown', label: 'Mind Blown', emoji: '😱' },
  { id: 'sad', label: 'Sad', emoji: '😭' },
  { id: 'hilarious', label: 'Hilarious', emoji: '😂' },
  { id: 'shocked', label: 'Shocked', emoji: '😡' },
  { id: 'boring', label: 'Boring', emoji: '😴' },
];

interface EpisodeReactionsProps {
  showId: number;
  seasonNumber: number;
  episodeNumber: number;
  cast?: any[];
}

export default function EpisodeReactions({ showId, seasonNumber, episodeNumber, cast = [] }: EpisodeReactionsProps) {
  const { user } = useAuth();
  const docId = `${showId}_${seasonNumber}_${episodeNumber}`;

  // Reaction State
  const [reactionCounts, setReactionCounts] = useState<Record<string, number>>({});
  const [userReaction, setUserReaction] = useState<string | null>(null);

  // Character Vote State
  const [characterVotes, setCharacterVotes] = useState<Record<string, number>>({});
  const [userCharVote, setUserCharVote] = useState<number | null>(null);

  // Firestore Listener for Emotion Polls & Character Votes
  useEffect(() => {
    const reactionRef = doc(db, 'episodeReactions', docId);
    const unsubReactions = onSnapshot(reactionRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        setReactionCounts(data.counts || {});
        if (user && data.userVotes && data.userVotes[user.uid]) {
          setUserReaction(data.userVotes[user.uid]);
        }
      }
    });

    const charRef = doc(db, 'characterVotes', docId);
    const unsubChar = onSnapshot(charRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        setCharacterVotes(data.votes || {});
        if (user && data.userVotes && data.userVotes[user.uid]) {
          setUserCharVote(data.userVotes[user.uid]);
        }
      }
    });

    return () => {
      unsubReactions();
      unsubChar();
    };
  }, [docId, user]);

  const handleVoteEmotion = async (emotionId: string) => {
    if (!user) return;
    const reactionRef = doc(db, 'episodeReactions', docId);
    const prevReaction = userReaction;

    try {
      setUserReaction(emotionId);
      const updatePayload: any = {
        [`counts.${emotionId}`]: increment(1),
        [`userVotes.${user.uid}`]: emotionId
      };
      if (prevReaction && prevReaction !== emotionId) {
        updatePayload[`counts.${prevReaction}`] = increment(-1);
      }
      await setDoc(reactionRef, updatePayload, { merge: true });
    } catch (err) {
      console.error("Failed to vote emotion", err);
    }
  };

  const handleVoteCharacter = async (personId: number) => {
    if (!user) return;
    const charRef = doc(db, 'characterVotes', docId);
    const prevVote = userCharVote;

    try {
      setUserCharVote(personId);
      const updatePayload: any = {
        [`votes.${personId}`]: increment(1),
        [`userVotes.${user.uid}`]: personId
      };
      if (prevVote && prevVote !== personId) {
        updatePayload[`votes.${prevVote}`] = increment(-1);
      }
      await setDoc(charRef, updatePayload, { merge: true });
    } catch (err) {
      console.error("Failed to vote character", err);
    }
  };

  // Calculate total emotion votes
  const totalEmotionVotes = Object.values(reactionCounts).reduce((a, b) => a + b, 0);

  // Find winning character ID
  let winningCharId: number | null = null;
  let maxCharVotes = 0;
  Object.entries(characterVotes).forEach(([id, votes]) => {
    if (votes > maxCharVotes) {
      maxCharVotes = votes;
      winningCharId = Number(id);
    }
  });

  return (
    <div className="mt-8 flex flex-col gap-6 border-t border-border pt-6">
      
      {/* Section 1: Emotion Poll */}
      <div className="flex flex-col gap-3">
        <h4 className="font-bold text-foreground text-sm flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-accent" /> How did this episode make you feel?
        </h4>

        <div className="grid grid-cols-5 gap-2">
          {EMOTIONS.map((item) => {
            const isSelected = userReaction === item.id;
            const count = reactionCounts[item.id] || 0;
            const percent = totalEmotionVotes > 0 ? Math.round((count / totalEmotionVotes) * 100) : 0;

            return (
              <button
                key={item.id}
                onClick={() => handleVoteEmotion(item.id)}
                disabled={!user}
                className={`flex flex-col items-center gap-1 p-2.5 rounded-2xl border transition-all relative overflow-hidden group ${
                  isSelected
                    ? 'bg-accent/20 border-accent text-foreground scale-105 shadow-md'
                    : 'bg-muted/30 border-border/60 hover:bg-muted text-muted-foreground'
                }`}
              >
                <span className="text-2xl group-hover:scale-125 transition-transform">{item.emoji}</span>
                <span className="text-[10px] font-bold truncate max-w-full">{item.label}</span>
                {totalEmotionVotes > 0 && (
                  <span className="text-[9px] font-black text-accent">{percent}%</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Section 2: Character MVP Vote */}
      {cast && cast.length > 0 && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-foreground text-sm flex items-center gap-2">
              <Crown className="w-4 h-4 text-amber-400" /> Vote Episode MVP Character
            </h4>
            {winningCharId && (
              <span className="text-[10px] font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded flex items-center gap-1 border border-amber-400/20">
                <Crown className="w-3 h-3 fill-current" /> Leader Has {maxCharVotes} {maxCharVotes === 1 ? 'vote' : 'votes'}
              </span>
            )}
          </div>

          <div className="flex overflow-x-auto gap-3 pb-2 snap-x hide-scrollbar">
            {cast.slice(0, 8).map((actor: any) => {
              const isVoted = userCharVote === actor.id;
              const isWinner = winningCharId === actor.id && maxCharVotes > 0;
              const votes = characterVotes[actor.id] || 0;

              return (
                <div
                  key={actor.id}
                  onClick={() => handleVoteCharacter(actor.id)}
                  className={`flex-shrink-0 w-20 snap-start flex flex-col items-center cursor-pointer group relative p-1.5 rounded-2xl border transition-all ${
                    isVoted
                      ? 'bg-accent/20 border-accent scale-105 shadow-lg'
                      : 'bg-muted/20 border-border/40 hover:bg-muted/50'
                  }`}
                >
                  {/* Crown for winner */}
                  {isWinner && (
                    <div className="absolute -top-2 z-10 bg-amber-400 text-black p-1 rounded-full shadow-lg border border-amber-200">
                      <Crown className="w-3.5 h-3.5 fill-current" />
                    </div>
                  )}

                  <div className="w-14 h-14 rounded-full overflow-hidden relative mb-1.5 bg-muted border border-border group-hover:border-accent transition-colors">
                    {actor.profile_path ? (
                      <Image src={getImageUrl(actor.profile_path, 'w185')} alt={actor.name} fill className="object-cover" />
                    ) : (
                      <User className="w-6 h-6 text-muted-foreground m-4" />
                    )}
                  </div>

                  <span className="text-[10px] font-bold text-foreground text-center truncate max-w-full leading-tight">
                    {actor.character || actor.name}
                  </span>
                  <span className="text-[9px] text-muted-foreground text-center truncate max-w-full">
                    {actor.name}
                  </span>

                  {votes > 0 && (
                    <span className="text-[9px] font-black text-accent mt-1">
                      {votes} {votes === 1 ? 'vote' : 'votes'}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
