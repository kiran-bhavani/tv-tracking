"use client";

import { useState } from 'react';
import { Sparkles, Loader2, BookOpen } from 'lucide-react';
import TranslateButton from './TranslateButton';
import { generateOverviewAction } from '@/app/actions/ai';

export default function OverviewText({ 
  initialText, 
  language,
  type,
  title,
  season,
  episode
}: { 
  initialText: string; 
  language: string;
  type?: 'show' | 'movie' | 'episode';
  title?: string;
  season?: number;
  episode?: number;
}) {
  const [text, setText] = useState(initialText);
  const [translated, setTranslated] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generatedSource, setGeneratedSource] = useState<'wikipedia' | 'ai' | null>(null);

  // If there's no text, or it's already english, or we already translated it, don't show the button
  const showTranslate = text && text.length > 10 && language !== 'en' && !translated;
  
  // If there's absolutely no text, we show the Generate button
  const needsGeneration = (!text || text.length < 10) && title && type;

  const handleGenerate = async () => {
    if (!type || !title) return;
    setGenerating(true);
    try {
      const data = await generateOverviewAction(type, title, season, episode);
      if (data && data.overview) {
        setText(data.overview);
        setGeneratedSource(data.source as 'wikipedia' | 'ai');
      } else {
        setText("Sorry, we couldn't find or generate an overview for this title.");
      }
    } catch (e) {
      console.error(e);
      setText("Sorry, an error occurred while generating the overview.");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="px-4 mt-8">
      <h3 className="text-lg font-bold text-foreground mb-2 flex items-center gap-2">
        Overview
        {generatedSource === 'ai' && <span className="text-[10px] bg-accent/20 text-accent px-1.5 py-0.5 rounded flex items-center gap-1"><Sparkles className="w-3 h-3"/> AI Generated</span>}
        {generatedSource === 'wikipedia' && <span className="text-[10px] bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded flex items-center gap-1"><BookOpen className="w-3 h-3"/> Wikipedia</span>}
      </h3>
      
      {needsGeneration ? (
        <div className="bg-muted/30 border border-border rounded-xl p-4 flex flex-col items-center text-center gap-3 mt-2">
          <p className="text-sm text-muted-foreground">No description available for this title.</p>
          <button 
            onClick={handleGenerate}
            disabled={generating}
            className="bg-accent text-background font-bold text-sm px-4 py-2 rounded-full flex items-center gap-2 hover:bg-accent/90 transition-colors disabled:opacity-50"
          >
            {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {generating ? "Searching the web & AI..." : "Generate Overview"}
          </button>
        </div>
      ) : (
        <>
          <p className="text-muted-foreground text-sm leading-relaxed whitespace-pre-wrap">
            {text || "No overview available."}
          </p>
          {showTranslate && (
            <TranslateButton text={text} onTranslate={(t) => {
              setText(t);
              setTranslated(true);
            }} />
          )}
        </>
      )}
    </div>
  );
}
