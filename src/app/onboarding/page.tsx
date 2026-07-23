"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { getPopularShows } from '@/lib/tmdb';
import { getImageUrl } from '@/lib/utils';
import Image from 'next/image';
import { Check, Loader2, ArrowRight, ArrowLeft, Sparkles, Globe, Star, Tv } from 'lucide-react';
import { useStore } from '@/store/useStore';

const AVATARS = [
  { url: "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix&backgroundColor=b6e3f4", label: "Felix" },
  { url: "https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka&backgroundColor=ffdfbf", label: "Aneka" },
  { url: "https://api.dicebear.com/7.x/avataaars/svg?seed=Molly&backgroundColor=c0aede", label: "Molly" },
  { url: "https://api.dicebear.com/7.x/avataaars/svg?seed=Bandit&backgroundColor=d1d4f9", label: "Bandit" },
  { url: "https://api.dicebear.com/7.x/avataaars/svg?seed=Jack&backgroundColor=b6e3f4", label: "Jack" },
  { url: "https://api.dicebear.com/7.x/avataaars/svg?seed=Kitty&backgroundColor=ffdfbf", label: "Kitty" },
];

const LANGUAGES = ["English", "Spanish", "French", "German", "Japanese", "Korean", "Italian", "Portuguese", "Hindi", "Arabic", "Chinese", "Turkish"];
const GENRES = [
  { name: "Action", emoji: "💥" },
  { name: "Adventure", emoji: "🗺️" },
  { name: "Animation", emoji: "🎨" },
  { name: "Comedy", emoji: "😂" },
  { name: "Crime", emoji: "🔍" },
  { name: "Documentary", emoji: "🎬" },
  { name: "Drama", emoji: "🎭" },
  { name: "Fantasy", emoji: "🧙" },
  { name: "Horror", emoji: "👻" },
  { name: "Mystery", emoji: "🔮" },
  { name: "Romance", emoji: "❤️" },
  { name: "Sci-Fi", emoji: "🚀" },
  { name: "Thriller", emoji: "😰" },
  { name: "Western", emoji: "🤠" },
];

const STEP_META = [
  { title: "Your Profile", subtitle: "Make it yours", icon: "👤" },
  { title: "Your Taste", subtitle: "What you love", icon: "🎬" },
  { title: "Your Watchlist", subtitle: "Pick 3 to start", icon: "📺" },
];

const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 60 : -60, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -60 : 60, opacity: 0 }),
};

export default function OnboardingPage() {
  const { user, completeOnboarding } = useAuth();

  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(1);
  const [saving, setSaving] = useState(false);

  // Step 1: Profile
  const [name, setName] = useState('');
  const [dob, setDob] = useState('');
  const [photoURL, setPhotoURL] = useState(AVATARS[0].url);

  // Step 2: Preferences
  const [selectedLanguages, setSelectedLanguages] = useState<Set<string>>(new Set(['English']));
  const [selectedGenres, setSelectedGenres] = useState<Set<string>>(new Set());

  // Step 3: Shows
  const [shows, setShows] = useState<any[]>([]);
  const [selectedShows, setSelectedShows] = useState<Set<number>>(new Set());
  const [loadingShows, setLoadingShows] = useState(true);

  const addToWatchlist = useStore(state => state.addToWatchlist);
  const removeFromWatchlist = useStore(state => state.removeFromWatchlist);

  useEffect(() => {
    if (user && !name) {
      setName(user.displayName || user.email?.split('@')[0] || '');
      if (user.photoURL) setPhotoURL(user.photoURL);
    }
  }, [user]);

  useEffect(() => {
    async function loadShows() {
      try {
        const data = await getPopularShows();
        setShows(data.results.slice(0, 30));
      } catch (err) {
        console.error("Failed to load shows", err);
      } finally {
        setLoadingShows(false);
      }
    }
    loadShows();
  }, []);

  const goTo = (next: number) => {
    setDirection(next > step ? 1 : -1);
    setStep(next);
  };

  const toggleLanguage = (lang: string) => {
    const next = new Set(selectedLanguages);
    if (next.has(lang)) { if (next.size > 1) next.delete(lang); }
    else next.add(lang);
    setSelectedLanguages(next);
  };

  const toggleGenre = (genre: string) => {
    const next = new Set(selectedGenres);
    if (next.has(genre)) next.delete(genre);
    else next.add(genre);
    setSelectedGenres(next);
  };

  const toggleShow = (show: any) => {
    const next = new Set(selectedShows);
    if (next.has(show.id)) {
      next.delete(show.id);
      removeFromWatchlist(show.id);
    } else {
      next.add(show.id);
      addToWatchlist({
        id: show.id,
        name: show.name || show.title,
        poster_path: show.poster_path,
        backdrop_path: show.backdrop_path,
        number_of_seasons: 1,
        type: 'tv',
      });
    }
    setSelectedShows(next);
  };

  const handleFinish = async () => {
    if (selectedShows.size < 3) return;
    setSaving(true);
    try {
      await completeOnboarding({
        displayName: name.trim() || 'TV Fanatic',
        dob,
        photoURL,
        languages: Array.from(selectedLanguages),
        genres: Array.from(selectedGenres),
      });
    } catch {
      setSaving(false);
    }
  };

  const canProceedStep1 = name.trim().length > 0;
  const canProceedStep2 = selectedGenres.size >= 2;
  const canFinish = selectedShows.size >= 3;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col overflow-hidden">

      {/* ── Ambient Background Glow ─────────────────── */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-accent/20 blur-[120px]" />
        <div className="absolute top-1/2 -right-40 w-80 h-80 rounded-full bg-purple-600/10 blur-[100px]" />
        <div className="absolute -bottom-20 left-1/3 w-72 h-72 rounded-full bg-blue-600/10 blur-[100px]" />
      </div>

      {/* ── Header ──────────────────────────────────── */}
      <div className="relative z-10 px-6 pt-12 pb-4">
        {/* Logo */}
        <div className="flex items-center gap-2 mb-8">
          <div className="w-8 h-8 rounded-xl bg-accent flex items-center justify-center shadow-lg shadow-accent/30">
            <Tv className="w-4 h-4 text-white" />
          </div>
          <span className="text-sm font-black text-foreground tracking-tight">TV Time</span>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-3 mb-2">
          {step > 1 && (
            <motion.button
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              onClick={() => goTo(step - 1)}
              className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:bg-muted/80 transition-colors flex-shrink-0"
            >
              <ArrowLeft className="w-4 h-4" />
            </motion.button>
          )}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold text-accent uppercase tracking-widest">
                Step {step} of 3
              </span>
            </div>
            <h1 className="text-2xl font-black text-foreground leading-tight">
              {STEP_META[step - 1].title}
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {STEP_META[step - 1].subtitle}
            </p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="flex gap-1.5 mt-4">
          {[1, 2, 3].map(n => (
            <div key={n} className="flex-1 h-1 rounded-full overflow-hidden bg-muted">
              <motion.div
                className="h-full bg-accent rounded-full"
                initial={{ width: 0 }}
                animate={{ width: step >= n ? '100%' : '0%' }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* ── Content ─────────────────────────────────── */}
      <div className="relative z-10 flex-1 overflow-hidden px-6">
        <AnimatePresence custom={direction} mode="wait">

          {/* STEP 1 — Profile */}
          {step === 1 && (
            <motion.div
              key="step1"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="space-y-7"
            >
              {/* Avatar grid */}
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3 block">
                  Choose Avatar
                </label>
                <div className="grid grid-cols-6 gap-3">
                  {AVATARS.map((av) => (
                    <button
                      key={av.label}
                      onClick={() => setPhotoURL(av.url)}
                      className={`relative aspect-square rounded-full overflow-hidden transition-all duration-200 ${
                        photoURL === av.url
                          ? 'ring-2 ring-accent ring-offset-2 ring-offset-background scale-110'
                          : 'opacity-60 hover:opacity-90 hover:scale-105'
                      }`}
                    >
                      <img src={av.url} alt={av.label} className="w-full h-full object-cover" />
                      {photoURL === av.url && (
                        <div className="absolute inset-0 bg-accent/20 flex items-center justify-center">
                          <Check className="w-4 h-4 text-white drop-shadow" strokeWidth={3} />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Selected avatar preview */}
              <div className="flex items-center gap-4 p-4 bg-card border border-border/50 rounded-2xl">
                <div className="w-16 h-16 rounded-full overflow-hidden ring-2 ring-accent flex-shrink-0">
                  <img src={photoURL} alt="Selected avatar" className="w-full h-full object-cover" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground font-medium mb-1">Your profile preview</p>
                  <p className="font-black text-foreground text-lg leading-tight">{name || 'Your Name'}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{user?.email}</p>
                </div>
              </div>

              {/* Form */}
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1.5 block">
                    Display Name <span className="text-accent">*</span>
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full bg-card border border-border rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-accent transition-colors text-sm font-medium"
                    placeholder="E.g. Alex Chen"
                    autoComplete="name"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1.5 block">
                    Date of Birth <span className="text-muted-foreground text-[10px] normal-case font-normal">(optional)</span>
                  </label>
                  <input
                    type="date"
                    value={dob}
                    onChange={e => setDob(e.target.value)}
                    className="w-full bg-card border border-border rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-accent transition-colors text-sm [color-scheme:dark]"
                  />
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 2 — Preferences */}
          {step === 2 && (
            <motion.div
              key="step2"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="space-y-7"
            >
              {/* Languages */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Globe className="w-4 h-4 text-accent" />
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                    Preferred Languages
                  </label>
                </div>
                <div className="flex flex-wrap gap-2">
                  {LANGUAGES.map(lang => (
                    <button
                      key={lang}
                      onClick={() => toggleLanguage(lang)}
                      className={`px-3 py-1.5 rounded-full text-sm font-semibold transition-all duration-200 ${
                        selectedLanguages.has(lang)
                          ? 'bg-accent text-white shadow-lg shadow-accent/20 scale-105'
                          : 'bg-card border border-border text-muted-foreground hover:border-accent/50 hover:text-foreground'
                      }`}
                    >
                      {lang}
                    </button>
                  ))}
                </div>
              </div>

              {/* Genres */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-accent" />
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                      Favorite Genres
                    </label>
                  </div>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                    selectedGenres.size >= 2
                      ? 'text-accent bg-accent/10'
                      : 'text-muted-foreground bg-muted'
                  }`}>
                    {selectedGenres.size} selected {selectedGenres.size >= 2 ? '✓' : '(pick 2+)'}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {GENRES.map(({ name: genre, emoji }) => (
                    <button
                      key={genre}
                      onClick={() => toggleGenre(genre)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold transition-all duration-200 ${
                        selectedGenres.has(genre)
                          ? 'bg-accent text-white shadow-lg shadow-accent/20 scale-105'
                          : 'bg-card border border-border text-muted-foreground hover:border-accent/50 hover:text-foreground'
                      }`}
                    >
                      <span>{emoji}</span>
                      {genre}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 3 — Pick Shows */}
          {step === 3 && (
            <motion.div
              key="step3"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3, ease: 'easeOut' }}
            >
              {/* Counter badge */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-accent" />
                  <p className="text-sm text-muted-foreground font-medium">
                    Tap a show to add it to your watchlist
                  </p>
                </div>
                <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black transition-colors ${
                  canFinish ? 'bg-accent/20 text-accent' : 'bg-muted text-muted-foreground'
                }`}>
                  <Tv className="w-3 h-3" />
                  {selectedShows.size}/3
                </div>
              </div>

              {loadingShows ? (
                <div className="flex justify-center items-center py-24">
                  <div className="flex flex-col items-center gap-3">
                    <Loader2 className="w-8 h-8 animate-spin text-accent" />
                    <p className="text-sm text-muted-foreground">Loading popular shows…</p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 pb-32">
                  {shows.map((show, idx) => {
                    const isSelected = selectedShows.has(show.id);
                    const posterUrl = getImageUrl(show.poster_path, 'w500');
                    return (
                      <motion.button
                        key={show.id}
                        initial={{ opacity: 0, scale: 0.85 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: idx * 0.015, duration: 0.25 }}
                        onClick={() => toggleShow(show)}
                        className={`relative aspect-[2/3] rounded-xl overflow-hidden transition-all duration-200 ${
                          isSelected
                            ? 'ring-2 ring-accent ring-offset-1 ring-offset-background scale-[1.03]'
                            : 'opacity-80 hover:opacity-100 active:scale-95'
                        }`}
                      >
                        <Image
                          src={posterUrl}
                          alt={show.name || show.title}
                          fill
                          className="object-cover"
                          sizes="(max-width: 640px) 33vw, 25vw"
                        />
                        {/* Show name overlay */}
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                          <p className="text-[10px] text-white font-bold leading-tight line-clamp-2">
                            {show.name || show.title}
                          </p>
                        </div>
                        {/* Selected overlay */}
                        <AnimatePresence>
                          {isSelected && (
                            <motion.div
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              className="absolute inset-0 bg-accent/30 flex items-start justify-end p-2"
                            >
                              <div className="w-6 h-6 rounded-full bg-accent flex items-center justify-center shadow-lg">
                                <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.button>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      {/* ── Sticky Bottom CTA ───────────────────────── */}
      <div className="relative z-10 fixed bottom-0 left-0 right-0 px-6 pb-8 pt-4 bg-gradient-to-t from-background via-background/95 to-transparent">
        {step < 3 ? (
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => goTo(step + 1)}
            disabled={step === 1 ? !canProceedStep1 : !canProceedStep2}
            className="w-full py-4 rounded-2xl font-black text-base bg-accent text-white shadow-2xl shadow-accent/30 flex justify-center items-center gap-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:bg-accent/90"
          >
            Continue
            <ArrowRight className="w-5 h-5" />
          </motion.button>
        ) : (
          <>
            {!canFinish && (
              <p className="text-center text-xs text-muted-foreground mb-2 font-medium">
                Select {3 - selectedShows.size} more show{3 - selectedShows.size !== 1 ? 's' : ''} to continue
              </p>
            )}
            <motion.button
              whileTap={{ scale: 0.97 }}
              disabled={!canFinish || saving}
              onClick={handleFinish}
              className="w-full py-4 rounded-2xl font-black text-base shadow-2xl shadow-accent/30 flex justify-center items-center gap-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed bg-accent text-white hover:bg-accent/90"
            >
              {saving ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Setting up your profile…
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Start Watching
                </>
              )}
            </motion.button>
          </>
        )}
      </div>
    </div>
  );
}
