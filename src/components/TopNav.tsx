"use client";

import { useState } from 'react';
import { Bell, Settings, Search, Users, Sparkles } from 'lucide-react';
import Link from 'next/link';
import SearchAutoCompleteModal from './SearchAutoCompleteModal';

export default function TopNav({ title = "BingePulse" }: { title?: string }) {
  const [showSearch, setShowSearch] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl pt-safe px-4 py-3 flex justify-between items-center border-b border-white/5 shadow-lg shadow-black/40">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-accent/20 border border-accent/40 flex items-center justify-center text-accent shadow-sm shadow-accent/20">
            <Sparkles className="w-4 h-4 fill-current" />
          </div>
          <h1 className="text-xl font-black tracking-tight text-white flex items-center gap-1.5">
            {title}
          </h1>
        </div>

        <div className="flex gap-1.5 items-center">
          <button
            onClick={() => setShowSearch(true)}
            className="w-11 h-11 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-zinc-300 hover:text-accent hover:bg-white/10 transition-all active:scale-95"
            title="Instant Search"
            aria-label="Instant Search"
          >
            <Search className="w-5 h-5" />
          </button>

          <Link 
            href="/community" 
            className="w-11 h-11 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-zinc-300 hover:text-accent hover:bg-white/10 transition-all active:scale-95"
            title="Community Feed"
            aria-label="Community Feed"
          >
            <Users className="w-5 h-5" />
          </Link>

          <Link 
            href="/notifications" 
            className="w-11 h-11 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-zinc-300 hover:text-white hover:bg-white/10 transition-all active:scale-95 relative"
            title="Notifications"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-accent rounded-full border border-black animate-pulse"></span>
          </Link>

          <Link 
            href="/settings" 
            className="w-11 h-11 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-zinc-300 hover:text-white hover:bg-white/10 transition-all active:scale-95"
            title="Settings"
            aria-label="Settings"
          >
            <Settings className="w-5 h-5" />
          </Link>
        </div>
      </header>

      <SearchAutoCompleteModal isOpen={showSearch} onClose={() => setShowSearch(false)} />
    </>
  );
}
