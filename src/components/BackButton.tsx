"use client";
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

export default function BackButton({ className }: { className?: string }) {
  const router = useRouter();
  return (
    <button
      onClick={() => router.back()}
      aria-label="Go back"
      className={className ?? "absolute top-safe-pt mt-4 left-4 p-2 bg-foreground/80 rounded-full backdrop-blur-sm text-background hover:bg-foreground transition-colors"}
    >
      <ArrowLeft className="w-6 h-6" />
    </button>
  );
}
