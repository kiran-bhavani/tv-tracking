"use client";

import { ArrowLeft, Bell, Tv, Users, AlertCircle, Check } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore, AppNotification } from '@/store/useStore';
import { formatDistanceToNow } from 'date-fns';

const getIconForType = (type: string) => {
  switch (type) {
    case 'upcoming': return Tv;
    case 'social': return Users;
    default: return Bell;
  }
};

export default function NotificationsPage() {
  const router = useRouter();
  const notifications = useStore(state => state.notifications);
  const markAllNotificationsRead = useStore(state => state.markAllNotificationsRead);
  const markNotificationRead = useStore(state => state.markNotificationRead);
  const clearNotifications = useStore(state => state.clearNotifications);

  const handleNotificationClick = (notif: AppNotification) => {
    if (!notif.read) {
      markNotificationRead(notif.id);
    }
    if (notif.targetUrl) {
      router.push(notif.targetUrl);
    }
  };

  const hasUnread = notifications.some(n => !n.read);

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-40 bg-background/90 backdrop-blur-md pt-safe px-4 py-3 flex items-center border-b border-border gap-4">
        <button onClick={() => router.back()} className="p-2 hover:bg-muted rounded-full transition-colors -ml-2">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-extrabold tracking-tight flex-1">Notifications</h1>
        {hasUnread ? (
          <button onClick={markAllNotificationsRead} className="text-xs font-bold text-accent hover:opacity-80 flex items-center gap-1">
            <Check className="w-3 h-3" /> Mark all read
          </button>
        ) : notifications.length > 0 ? (
           <button onClick={clearNotifications} className="text-xs font-bold text-muted-foreground hover:text-red-400">
            Clear all
          </button>
        ) : null}
      </header>

      <div className="p-4">
        {notifications.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Bell className="w-8 h-8 opacity-50" />
            </div>
            <p className="font-bold text-foreground">You&apos;re all caught up!</p>
            <p className="text-sm mt-1">Check back later for new alerts.</p>
          </div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {notifications.map((notif, idx) => {
                const Icon = getIconForType(notif.type);
                const timeAgo = formatDistanceToNow(new Date(notif.timestamp), { addSuffix: true });
                
                return (
                  <motion.div 
                    key={notif.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: Math.min(idx * 0.05, 0.3) }}
                    onClick={() => handleNotificationClick(notif)}
                    className={`flex gap-4 p-4 rounded-2xl border ${notif.read ? 'bg-card border-border/50' : 'bg-muted border-accent/30'} transition-colors ${notif.targetUrl ? 'cursor-pointer hover:bg-muted/80' : ''}`}
                  >
                    <div className={`mt-1 flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${notif.iconBg || 'bg-accent/10'} ${notif.iconColor || 'text-accent'}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start gap-2">
                        <h4 className={`font-bold text-sm truncate ${!notif.read && 'text-foreground'}`}>{notif.title}</h4>
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider whitespace-nowrap">{timeAgo}</span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1 leading-snug line-clamp-2">{notif.message}</p>
                    </div>
                    {!notif.read && (
                      <div className="w-2 h-2 rounded-full bg-accent mt-2 flex-shrink-0" />
                    )}
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
