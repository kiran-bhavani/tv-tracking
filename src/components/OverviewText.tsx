"use client";

import { useState } from 'react';
import TranslateButton from './TranslateButton';

export default function OverviewText({ initialText, language }: { initialText: string; language: string }) {
  const [text, setText] = useState(initialText);
  const [translated, setTranslated] = useState(false);

  // If there's no text, or it's already english, or we already translated it, don't show the button
  const showTranslate = text && text.length > 10 && language !== 'en' && !translated;

  return (
    <div className="px-4 mt-8">
      <h3 className="text-lg font-bold text-foreground mb-2">Overview</h3>
      <p className="text-muted-foreground text-sm leading-relaxed whitespace-pre-wrap">
        {text || "No overview available."}
      </p>
      {showTranslate && (
        <TranslateButton text={text} onTranslate={(t) => {
          setText(t);
          setTranslated(true);
        }} />
      )}
    </div>
  );
}
