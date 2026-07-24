"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  ArrowLeft, Bell, BellOff, Download, Upload, Trash2, LogOut,
  Loader2, Key, CheckCircle, AlertCircle, ChevronRight,
  Shield, Palette, Database, User as UserIcon, Settings as SettingsIcon,
  Moon, Smartphone, ExternalLink
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useStore } from '@/store/useStore';
import { auth, messaging, db } from '@/lib/firebase';
import {
  signOut, deleteUser, reauthenticateWithPopup,
  GoogleAuthProvider, EmailAuthProvider, reauthenticateWithCredential
} from 'firebase/auth';
import { getToken } from 'firebase/messaging';
import { doc, deleteDoc, setDoc } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { usePWAInstall } from '@/hooks/usePWAInstall';

// ── Toast ─────────────────────────────────────────────────────────────────────
function Toast({ message, type, onDismiss }: { message: string; type: 'success' | 'error'; onDismiss: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 4000);
    return () => clearTimeout(t);
  }, [onDismiss]);
  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      className={`fixed top-4 left-4 right-4 z-[100] flex items-center gap-3 p-4 rounded-2xl shadow-2xl border ${
        type === 'success'
          ? 'bg-green-500/10 border-green-500/20 text-green-400'
          : 'bg-red-500/10 border-red-500/20 text-red-400'
      }`}
    >
      {type === 'success'
        ? <CheckCircle className="w-5 h-5 flex-shrink-0" />
        : <AlertCircle className="w-5 h-5 flex-shrink-0" />}
      <p className="text-sm font-semibold flex-1">{message}</p>
    </motion.div>
  );
}

// ── Section Header ─────────────────────────────────────────────────────────────
function SectionLabel({ label }: { label: string }) {
  return (
    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.15em] px-1 mb-2">
      {label}
    </p>
  );
}

// ── Setting Row ────────────────────────────────────────────────────────────────
function SettingRow({
  icon, iconBg, label, subtitle, onClick, rightSlot, destructive = false, disabled = false
}: {
  icon: React.ReactNode;
  iconBg: string;
  label: string;
  subtitle?: string;
  onClick?: () => void;
  rightSlot?: React.ReactNode;
  destructive?: boolean;
  disabled?: boolean;
}) {
  const isClickable = !!onClick && !disabled;
  return (
    <div
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onClick={!disabled ? onClick : undefined}
      onKeyDown={isClickable ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick?.(); } } : undefined}
      className={`w-full flex items-center gap-4 px-4 py-3.5 transition-colors text-left group select-none
        ${isClickable ? (destructive ? 'hover:bg-red-500/5 active:bg-red-500/10 cursor-pointer' : 'hover:bg-white/[0.03] active:bg-white/[0.06] cursor-pointer') : 'cursor-default'}
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
      `}
    >
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBg}`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold leading-tight ${destructive ? 'text-red-400' : 'text-foreground'}`}>
          {label}
        </p>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-0.5 truncate">{subtitle}</p>
        )}
      </div>
      {rightSlot ?? (isClickable && !destructive && (
        <ChevronRight className="w-4 h-4 text-muted-foreground/50 group-hover:text-muted-foreground transition-colors flex-shrink-0" />
      ))}
    </div>
  );
}

// ── Card Container ─────────────────────────────────────────────────────────────
function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-card/60 border border-white/[0.06] rounded-2xl overflow-hidden divide-y divide-white/[0.05] shadow-xl">
      {children}
    </div>
  );
}

// ── Toggle ─────────────────────────────────────────────────────────────────────
function Toggle({ enabled, loading, onToggle }: { enabled: boolean; loading?: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      disabled={enabled || loading}
      aria-label={enabled ? 'Enabled' : 'Enable'}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0
        ${enabled ? 'bg-accent' : 'bg-muted border border-white/10'}`}
    >
      {loading
        ? <Loader2 className="w-3 h-3 animate-spin text-foreground/70 mx-auto" />
        : <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform
            ${enabled ? 'translate-x-6' : 'translate-x-1'}`}
          />
      }
    </button>
  );
}

// ── Delete / Reauth Modals ─────────────────────────────────────────────────────
function ConfirmDeleteModal({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-4 pb-6 sm:pb-0">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onCancel} />
      <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}
        className="relative w-full max-w-sm bg-card border border-white/10 rounded-3xl p-6 shadow-2xl">
        <div className="w-14 h-14 rounded-2xl bg-red-500/10 flex items-center justify-center mb-4 mx-auto">
          <Trash2 className="w-7 h-7 text-red-500" />
        </div>
        <h3 className="text-xl font-black text-center mb-2">Delete Account?</h3>
        <p className="text-sm text-muted-foreground text-center mb-6 leading-relaxed">
          This cannot be undone. Your watchlist, episodes, and lists will be permanently erased.
        </p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 py-3 bg-muted font-bold rounded-xl text-sm hover:bg-muted/80 transition-colors">
            Cancel
          </button>
          <button onClick={onConfirm} className="flex-1 py-3 bg-red-500 text-white font-bold rounded-xl text-sm hover:bg-red-600 transition-colors">
            Delete
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function PasswordModal({ error, deleting, onConfirm, onCancel }: {
  error: string; deleting: boolean;
  onConfirm: (pw: string) => void; onCancel: () => void;
}) {
  const [pw, setPw] = useState('');
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-4 pb-6 sm:pb-0">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onCancel} />
      <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}
        className="relative w-full max-w-sm bg-card border border-white/10 rounded-3xl p-6 shadow-2xl">
        <div className="w-14 h-14 rounded-2xl bg-red-500/10 flex items-center justify-center mb-4 mx-auto">
          <Key className="w-7 h-7 text-red-500" />
        </div>
        <h3 className="text-xl font-black text-center mb-1">Verify Identity</h3>
        <p className="text-sm text-muted-foreground text-center mb-5">Enter your password to confirm deletion.</p>
        <input
          type="password" value={pw} onChange={e => setPw(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && onConfirm(pw)}
          placeholder="Your password"
          className="w-full bg-muted border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-red-500 transition-colors mb-2"
          autoFocus
        />
        {error && <p className="text-xs text-red-400 font-medium mb-4 text-center">{error}</p>}
        <div className="flex gap-3 mt-3">
          <button onClick={onCancel} className="flex-1 py-3 bg-muted font-bold rounded-xl text-sm hover:bg-muted/80 transition-colors">
            Cancel
          </button>
          <button onClick={() => onConfirm(pw)} disabled={!pw || deleting}
            className="flex-1 py-3 bg-red-500 text-white font-bold rounded-xl text-sm flex justify-center items-center gap-2 disabled:opacity-50 hover:bg-red-600 transition-colors">
            {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function SettingsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { isInstallable, promptInstall } = usePWAInstall();

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const showToast = useCallback((message: string, type: 'success' | 'error') => setToast({ message, type }), []);

  const [pushEnabled, setPushEnabled] = useState(false);
  const [pushLoading, setPushLoading] = useState(false);

  const [deleting, setDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if ('Notification' in window) setPushEnabled(Notification.permission === 'granted');
  }, []);

  const handleEnablePush = async () => {
    if (!user || !messaging) return;
    setPushLoading(true);
    try {
      const perm = await Notification.requestPermission();
      if (perm === 'granted') {
        const token = await getToken(messaging, { vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY });
        if (token) await setDoc(doc(db, 'users', user.uid), { pushToken: token }, { merge: true });
        setPushEnabled(true);
        showToast('Push notifications enabled!', 'success');
      } else {
        showToast('Permission denied. Enable in browser settings.', 'error');
      }
    } catch {
      showToast('Failed to enable notifications.', 'error');
    } finally {
      setPushLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut(auth);
    router.push('/login');
  };

  const handleExportData = () => {
    const { watchlist, watchedEpisodes, customLists, movieReviews } = useStore.getState();
    const blob = new Blob([JSON.stringify({ watchlist, watchedEpisodes, customLists, movieReviews, exportDate: new Date().toISOString() }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tvtime_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Data exported successfully!', 'success');
  };

  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (json && (json.watchlist || json.watchedEpisodes)) {
          useStore.getState().setStoreData(
            json.watchlist || {},
            json.watchedEpisodes || {},
            json.customLists || [],
            json.movieReviews || {}
          );
          showToast('Watchlist & history imported successfully!', 'success');
        } else {
          showToast('Invalid backup file structure.', 'error');
        }
      } catch {
        showToast('Failed to parse import file.', 'error');
      }
    };
    reader.readAsText(file);
  };

  const executeDeletion = async (credential?: any) => {
    if (!user) return;
    setDeleting(true);
    setDeleteError('');
    try {
      if (credential) await reauthenticateWithCredential(user, credential);
      await deleteDoc(doc(db, 'users', user.uid));
      await deleteUser(user);
      useStore.getState().setStoreData({}, {}, []);
      router.push('/login');
    } catch (error: any) {
      if (error.code === 'auth/requires-recent-login') {
        const provider = user.providerData[0]?.providerId;
        if (provider === 'google.com') {
          try {
            await reauthenticateWithPopup(user, new GoogleAuthProvider());
            await executeDeletion();
          } catch {
            setDeleteError('Google re-auth failed. Log out and log back in.');
            setDeleting(false);
          }
        } else {
          setShowPasswordModal(true);
          setDeleting(false);
        }
      } else {
        setDeleteError(error.message || 'Deletion failed.');
        setDeleting(false);
      }
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center p-8">
          <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4 mx-auto">
            <SettingsIcon className="w-8 h-8 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground mb-5 text-sm">Sign in to access settings.</p>
          <button onClick={() => router.push('/login')}
            className="px-8 py-3 bg-accent text-white rounded-xl font-bold text-sm hover:bg-accent/90 transition-colors">
            Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-32">
      {/* Ambient glow */}
      <div className="pointer-events-none fixed top-0 right-0 w-64 h-64 rounded-full bg-accent/5 blur-[80px] -mr-20 -mt-20" />

      {/* Toast */}
      <AnimatePresence>
        {toast && <Toast key="t" message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />}
      </AnimatePresence>

      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-white/[0.06] px-4 py-4 flex items-center gap-3">
        <button onClick={() => router.back()} className="w-9 h-9 rounded-xl bg-muted/50 flex items-center justify-center hover:bg-muted transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <h1 className="text-lg font-black tracking-tight">Settings</h1>
      </header>

      <div className="px-4 pt-6 max-w-lg mx-auto space-y-6">

        {/* ── Profile Card ──────────────────────────────────── */}
        <div className="bg-gradient-to-br from-accent/10 to-purple-600/5 border border-accent/20 rounded-3xl p-5 flex items-center gap-4 shadow-xl">
          <div className="w-16 h-16 rounded-2xl overflow-hidden bg-muted border-2 border-accent/30 flex-shrink-0">
            {user.photoURL
              ? <img src={user.photoURL} alt="Avatar" className="w-full h-full object-cover" />
              : <div className="w-full h-full flex items-center justify-center"><UserIcon className="w-8 h-8 text-muted-foreground" /></div>
            }
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-black text-foreground text-lg leading-tight truncate">{user.displayName || 'TV Fanatic'}</h2>
            <p className="text-sm text-muted-foreground truncate mt-0.5">{user.email}</p>
            <div className="flex items-center gap-1 mt-1.5">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-[10px] font-bold text-green-400 uppercase tracking-wider">Active</span>
            </div>
          </div>
        </div>

        {/* ── Account ───────────────────────────────────────── */}
        <div>
          <SectionLabel label="Account" />
          <Card>
            <SettingRow
              icon={<LogOut className="w-4 h-4 text-orange-400" />}
              iconBg="bg-orange-500/10"
              label="Sign Out"
              subtitle="You'll need to log back in"
              onClick={handleSignOut}
            />
          </Card>
        </div>

        {/* ── Preferences ───────────────────────────────────── */}
        <div>
          <SectionLabel label="Preferences" />
          <Card>
            <SettingRow
              icon={pushEnabled
                ? <Bell className="w-4 h-4 text-accent" />
                : <BellOff className="w-4 h-4 text-muted-foreground" />
              }
              iconBg="bg-accent/10"
              label="Push Notifications"
              subtitle={pushEnabled ? "You'll get episode alerts" : 'Get notified about new episodes'}
              rightSlot={<Toggle enabled={pushEnabled} loading={pushLoading} onToggle={handleEnablePush} />}
            />
            <SettingRow
              icon={<Moon className="w-4 h-4 text-indigo-400" />}
              iconBg="bg-indigo-500/10"
              label="Dark Mode"
              subtitle="Always on — it's the only way"
              rightSlot={
                <span className="text-[10px] font-black text-accent bg-accent/10 px-2 py-1 rounded-full uppercase tracking-wider">On</span>
              }
            />
            <SettingRow
              icon={<Smartphone className="w-4 h-4 text-blue-400" />}
              iconBg="bg-blue-500/10"
              label="Install App"
              subtitle={isInstallable ? "Add to home screen for native experience" : "Tap Share > Add to Home Screen on iOS"}
              onClick={promptInstall}
              rightSlot={<ExternalLink className="w-4 h-4 text-muted-foreground/50" />}
            />
          </Card>
        </div>

        {/* ── Data & Privacy ─────────────────────────────────── */}
        <div>
          <SectionLabel label="Data & Privacy" />
          <Card>
            <SettingRow
              icon={<Download className="w-4 h-4 text-blue-400" />}
              iconBg="bg-blue-500/10"
              label="Export My Data"
              subtitle="Download watchlist as JSON"
              onClick={handleExportData}
            />
            <SettingRow
              icon={<Upload className="w-4 h-4 text-emerald-400" />}
              iconBg="bg-emerald-500/10"
              label="Import Watchlist & History"
              subtitle="Restore from JSON backup file"
              onClick={() => fileInputRef.current?.click()}
            />
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImportData}
              accept=".json"
              className="hidden"
            />
            <SettingRow
              icon={<Shield className="w-4 h-4 text-green-400" />}
              iconBg="bg-green-500/10"
              label="Privacy Policy"
              subtitle="How we handle your data"
              onClick={() => {}}
              rightSlot={<ExternalLink className="w-4 h-4 text-muted-foreground/50" />}
            />
          </Card>
        </div>

        {/* ── Danger Zone ────────────────────────────────────── */}
        <div>
          <SectionLabel label="Danger Zone" />
          <Card>
            <SettingRow
              icon={deleting ? <Loader2 className="w-4 h-4 text-red-400 animate-spin" /> : <Trash2 className="w-4 h-4 text-red-400" />}
              iconBg="bg-red-500/10"
              label="Delete Account"
              subtitle="Permanently erase all data"
              onClick={() => setShowConfirm(true)}
              destructive
              disabled={deleting}
            />
          </Card>
        </div>

        {/* Footer & Attributions */}
        <div className="pt-6 pb-12 flex flex-col items-center gap-6">
          <div className="flex flex-col items-center gap-3 w-full max-w-xs opacity-60 hover:opacity-100 transition-opacity">
            <p className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">Data Providers</p>
            <div className="flex items-center justify-center gap-6 w-full">
              {/* TMDB Attribution */}
              <a href="https://www.themoviedb.org/" target="_blank" rel="noopener noreferrer" className="flex flex-col items-center">
                <img src="https://www.themoviedb.org/assets/2/v4/logos/v2/blue_short-8e7b30f73a4020692ccca9c88bafe5dcb6f8a62a4c6bc55cd9ba82bb2cd95f6c.svg" alt="TMDB" className="h-3.5 opacity-80" />
              </a>
              {/* Trakt Attribution */}
              <a href="https://trakt.tv" target="_blank" rel="noopener noreferrer" className="flex flex-col items-center">
                {/* Fallback to text if the image is missing, but setup for the official dark mode logo */}
                <div className="flex items-center gap-1.5">
                  <div className="w-4 h-4 rounded-md bg-[#ED1C24] flex items-center justify-center text-white font-bold text-[10px]">t</div>
                  <span className="font-bold text-foreground text-sm tracking-tight">trakt.</span>
                </div>
              </a>
            </div>
            <p className="text-[10px] text-muted-foreground/70 text-center leading-tight mt-2 px-4">
              This product uses the TMDB API but is not endorsed or certified by TMDB. Premium metadata provided by Trakt.tv and OMDb.
            </p>
          </div>

          <div className="text-center">
            <p className="text-[11px] text-muted-foreground/50 font-medium">
              TV Time Tracker · v1.0.0
            </p>
            <p className="text-[11px] text-muted-foreground/30 mt-0.5">
              Made with ❤️ using Next.js & Firebase
            </p>
          </div>
        </div>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {showConfirm && (
          <ConfirmDeleteModal
            onConfirm={() => { setShowConfirm(false); executeDeletion(); }}
            onCancel={() => setShowConfirm(false)}
          />
        )}
        {showPasswordModal && (
          <PasswordModal
            error={deleteError}
            deleting={deleting}
            onConfirm={(pw) => {
              if (!user?.email) return;
              setShowPasswordModal(false);
              executeDeletion(EmailAuthProvider.credential(user.email, pw));
            }}
            onCancel={() => { setShowPasswordModal(false); setDeleteError(''); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
