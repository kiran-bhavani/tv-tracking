"use client";

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

export default function BackButton({ className }: { className?: string }) {
  const router = useRouter();
  return (
    <button
      onClick={() => router.back()}
      aria-label="Go back"
      title="Go back"
      className={className ?? "absolute top-4 left-4 z-50 w-11 h-11 rounded-full bg-black/60 backdrop-blur-md border border-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-all active:scale-95 shadow-lg"}
    >
      <ArrowLeft className="w-5 h-5" />
    </button>
  );
}
