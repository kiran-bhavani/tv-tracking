"use client";

import { useState } from 'react';
import { Languages, Loader2 } from 'lucide-react';
import { translateText } from '@/app/actions/translate';

export default function TranslateButton({ text, onTranslate }: { text: string; onTranslate: (translated: string) => void }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const handleTranslate = async () => {
    setLoading(true);
    setError(false);
    try {
      const translated = await translateText(text);
      if (translated) {
        onTranslate(translated);
      }
    } catch (e) {
      console.error(e);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleTranslate}
      disabled={loading}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 mt-3 text-xs font-bold bg-accent/10 text-accent rounded-full hover:bg-accent/20 transition-colors disabled:opacity-50"
    >
      {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Languages className="w-3.5 h-3.5" />}
      {loading ? "Translating..." : error ? "Translation Failed - Try Again" : "Translate to English"}
    </button>
  );
}
