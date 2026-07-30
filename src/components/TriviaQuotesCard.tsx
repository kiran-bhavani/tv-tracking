"use client";

import { useEffect, useState } from 'react';
import { Quote, ChevronDown, Sparkles, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { generateTriviaAction } from '@/app/actions/ai';

interface TriviaQuotesCardProps {
  title: string;
  type: 'show' | 'movie';
  tagline?: string;
}

const POPULAR_QUOTES: Record<string, { quote: string; speaker: string }> = {
  'Inception': { quote: "An idea is like a virus. Resilient. Highly contagious.", speaker: "Cobb" },
  'The Dark Knight': { quote: "Why so serious?", speaker: "The Joker" },
  'Breaking Bad': { quote: "I am the one who knocks!", speaker: "Walter White" },
  'Stranger Things': { quote: "Friends don't lie.", speaker: "Eleven" },
  'Pulp Fiction': { quote: "Say 'what' one more time, I dare you!", speaker: "Jules Winnfield" },
  'The Godfather': { quote: "I'm gonna make him an offer he can't refuse.", speaker: "Don Corleone" },
  'Fight Club': { quote: "The first rule of Fight Club is: You do not talk about Fight Club.", speaker: "Tyler Durden" },
  'Interstellar': { quote: "Love is the one thing that transcends time and space.", speaker: "Brand" },
  'Game of Thrones': { quote: "When you play the game of thrones, you win or you die.", speaker: "Cersei Lannister" },
};

const HARDCODED_TRIVIA: Record<string, string[]> = {
  'Inception': [
    "Christopher Nolan wrote the script over a period of 10 years.",
    "The film's runtime is 2h 28m, which matches the length of the song 'Non, je ne regrette rien' played backwards."
  ],
  'The Dark Knight': [
    "Heath Ledger spent six weeks isolated in a hotel room preparing for the Joker role.",
    "The hospital explosion was filmed live in an abandoned candy factory in Chicago."
  ],
  'Breaking Bad': [
    "Aaron Paul's character Jesse Pinkman was originally supposed to die in Season 1.",
    "Bryan Cranston was cast partly due to his performance in an episode of The X-Files written by Vince Gilligan."
  ],
  'Stranger Things': [
    "Over 900 boys and 307 girls auditioned for the main child roles.",
    "The Duffer Brothers listened to 1980s synth music while writing the script."
  ]
};

export default function TriviaQuotesCard({ title, type, tagline }: TriviaQuotesCardProps) {
  const [showTrivia, setShowTrivia] = useState(false);
  const [triviaList, setTriviaList] = useState<string[]>(HARDCODED_TRIVIA[title] || []);
  const [loadingTrivia, setLoadingTrivia] = useState(false);

  const quoteData = POPULAR_QUOTES[title] || (tagline ? { quote: tagline, speaker: 'Official Tagline' } : null);

  useEffect(() => {
    async function loadTrivia() {
      if (HARDCODED_TRIVIA[title]) return;
      setLoadingTrivia(true);
      try {
        const facts = await generateTriviaAction(title, type);
        if (facts && Array.isArray(facts)) {
          setTriviaList(facts);
        }
      } catch (err) {
        console.error("Trivia fetch error:", err);
      } finally {
        setLoadingTrivia(false);
      }
    }

    loadTrivia();
  }, [title, type]);

  if (!quoteData && triviaList.length === 0 && !loadingTrivia) return null;

  return (
    <div className="px-4 my-6">
      <div className="bg-card border border-border/80 rounded-2xl p-5 shadow-md flex flex-col gap-4 relative overflow-hidden">
        
        {/* Quote Section */}
        {quoteData && (
          <div className="flex gap-3 items-start bg-muted/30 p-4 rounded-xl border border-border/40">
            <Quote className="w-6 h-6 text-accent flex-shrink-0 mt-0.5 opacity-80 rotate-180" />
            <div className="flex flex-col">
              <p className="text-sm font-bold text-foreground italic leading-relaxed">
                &ldquo;{quoteData.quote}&rdquo;
              </p>
              <span className="text-[11px] font-black text-accent mt-1.5 uppercase tracking-wider">
                — {quoteData.speaker}
              </span>
            </div>
          </div>
        )}

        {/* Trivia Accordion */}
        <div className="flex flex-col">
          <button
            onClick={() => setShowTrivia(!showTrivia)}
            className="flex items-center justify-between text-xs font-bold text-muted-foreground hover:text-foreground transition-colors pt-1"
          >
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-accent" /> Did You Know? ({triviaList.length} Trivia Facts)
            </span>
            <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${showTrivia ? 'rotate-180 text-accent' : ''}`} />
          </button>

          <AnimatePresence>
            {showTrivia && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                {loadingTrivia ? (
                  <div className="flex items-center gap-2 py-4 text-xs text-muted-foreground animate-pulse">
                    <Loader2 className="w-4 h-4 animate-spin text-accent" /> Fetching behind-the-scenes trivia...
                  </div>
                ) : (
                  <ul className="flex flex-col gap-2 mt-3 pt-3 border-t border-border/40 text-xs text-foreground list-disc list-inside leading-relaxed">
                    {triviaList.map((fact, idx) => (
                      <li key={idx} className="pl-1">
                        <span className="text-muted-foreground">{fact}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
