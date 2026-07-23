"use client";

import { useAuth } from '@/contexts/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';

export default function OnboardingGuard({ children }: { children: React.ReactNode }) {
  const { user, loading, onboardingComplete } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (loading || !isMounted) return;

    const isAuthRoute = pathname === '/login' || pathname === '/register' || pathname === '/forgot-password';
    const isOnboardingRoute = pathname === '/onboarding';

    if (user && !onboardingComplete && !isOnboardingRoute) {
      router.push('/onboarding');
    } else if (user && onboardingComplete && (isAuthRoute || isOnboardingRoute)) {
      router.push('/');
    }
  }, [user, loading, onboardingComplete, pathname, router, isMounted]);

  if (!isMounted || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  // If user needs onboarding and isn't on the onboarding page, block render to prevent flash
  if (user && !onboardingComplete && pathname !== '/onboarding') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  return <>{children}</>;
}
