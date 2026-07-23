"use client";

import { useState } from 'react';
import { ArrowLeft, Bell, Star, Film } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

// Mock notifications since we don't have a backend trigger yet
const MOCK_NOTIFICATIONS = [
  {
    id: 1,
    type: 'welcome',
    title: 'Welcome to TV Time!',
    message: 'Your profile is all set up. Start tracking your favorite shows now.',
    time: 'Just now',
    read: false,
    icon: Star,
    color: 'text-yellow-500',
    bg: 'bg-yellow-500/10'
  },
  {
    id: 2,
    type: 'feature',
    title: 'Progressive Web App Ready',
    message: 'You can now install TV Time to your homescreen for a native app experience.',
    time: '2 hours ago',
    read: true,
    icon: Bell,
    color: 'text-accent',
    bg: 'bg-accent/10'
  },
  {
    id: 3,
    type: 'recommendation',
    title: 'New Sci-Fi Recommendations',
    message: 'Based on your likes, we think you might enjoy Severance on Apple TV+.',
    time: '1 day ago',
    read: true,
    icon: Film,
    color: 'text-purple-500',
    bg: 'bg-purple-500/10'
  }
];

export default function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-40 bg-background/90 backdrop-blur-md pt-safe px-4 py-3 flex items-center border-b border-border gap-4">
        <button onClick={() => router.back()} className="p-2 hover:bg-muted rounded-full transition-colors -ml-2">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-extrabold tracking-tight flex-1">Notifications</h1>
        {notifications.some(n => !n.read) && (
          <button onClick={markAllRead} className="text-xs font-bold text-accent hover:opacity-80">
            Mark all read
          </button>
        )}
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
            {notifications.map((notif, idx) => (
              <motion.div 
                key={notif.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className={`flex gap-4 p-4 rounded-2xl border ${notif.read ? 'bg-card border-border/50' : 'bg-muted border-accent/30'} transition-colors cursor-pointer hover:bg-muted/80`}
              >
                <div className={`mt-1 flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${notif.bg} ${notif.color}`}>
                  <notif.icon className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start gap-2">
                    <h4 className={`font-bold text-sm ${!notif.read && 'text-foreground'}`}>{notif.title}</h4>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider whitespace-nowrap">{notif.time}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1 leading-snug">{notif.message}</p>
                </div>
                {!notif.read && (
                  <div className="w-2 h-2 rounded-full bg-accent mt-2 flex-shrink-0" />
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
