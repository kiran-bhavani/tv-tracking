"use client";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Tv, Film, Compass, User, Users } from 'lucide-react';
import { motion } from 'framer-motion';

const navItems = [
  { name: 'Shows', path: '/', icon: Tv },
  { name: 'Movies', path: '/movies', icon: Film },
  { name: 'Discover', path: '/discover', icon: Compass },
  { name: 'Community', path: '/community', icon: Users },
  { name: 'Profile', path: '/profile', icon: User },
];

export default function BottomNav() {
  const pathname = usePathname();

  if (pathname === '/onboarding' || pathname === '/login' || pathname === '/register') {
    return null;
  }

  return (
    <div className="fixed bottom-0 w-full px-4 pb-[env(safe-area-inset-bottom,16px)] pointer-events-none z-50">
      <nav className="pointer-events-auto mx-auto max-w-md bg-card/70 backdrop-blur-xl border border-white/10 rounded-full py-2.5 px-6 flex justify-between items-center shadow-2xl shadow-black/50">
        {navItems.map((item) => {
          const isActive = pathname === item.path;
          const Icon = item.icon;
          return (
            <Link href={item.path} key={item.name} className="relative flex flex-col items-center p-2 w-16">
              {isActive && (
                <motion.div
                  layoutId="nav-bg"
                  className="absolute inset-0 bg-white/5 rounded-full"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
              <Icon className={`w-5 h-5 relative z-10 transition-colors duration-200 ${isActive ? 'text-accent' : 'text-muted-foreground'}`} />
              <span className={`text-[9px] mt-1 font-bold relative z-10 transition-colors duration-200 ${isActive ? 'text-accent' : 'text-muted-foreground'}`}>
                {item.name}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
