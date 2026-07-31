"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Tv, Film, Compass, CalendarDays, User } from 'lucide-react';
import { motion } from 'framer-motion';

const navItems = [
  { name: 'Shows', path: '/', icon: Tv },
  { name: 'Movies', path: '/movies', icon: Film },
  { name: 'Discover', path: '/discover', icon: Compass },
  { name: 'Calendar', path: '/calendar', icon: CalendarDays },
  { name: 'Profile', path: '/profile', icon: User },
];

export default function BottomNav() {
  const pathname = usePathname();

  if (pathname === '/onboarding' || pathname === '/login' || pathname === '/register') {
    return null;
  }

  return (
    <div className="fixed bottom-3 left-0 right-0 w-full px-4 pb-safe pointer-events-none z-50 flex justify-center">
      <nav className="pointer-events-auto w-full max-w-md ios-glass-pill rounded-full py-2 px-3 flex justify-around items-center shadow-2xl shadow-black/80">
        {navItems.map((item) => {
          const isActive = pathname === item.path;
          const Icon = item.icon;
          return (
            <Link 
              href={item.path} 
              key={item.name} 
              className="relative flex flex-col items-center py-2 px-3 rounded-full transition-all active:scale-95 min-w-[64px]"
            >
              {isActive && (
                <motion.div
                  layoutId="nav-bg-active"
                  className="absolute inset-0 bg-accent/15 border border-accent/30 rounded-full shadow-lg shadow-accent/10"
                  transition={{ type: "spring", stiffness: 400, damping: 28 }}
                />
              )}
              <Icon 
                className={`w-5 h-5 relative z-10 transition-colors duration-200 ${
                  isActive ? 'text-accent stroke-[2.5]' : 'text-zinc-400 hover:text-white'
                }`} 
              />
              <span 
                className={`text-[10px] mt-1 font-bold tracking-tight relative z-10 transition-colors duration-200 ${
                  isActive ? 'text-accent font-black' : 'text-zinc-400'
                }`}
              >
                {item.name}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
