import Link from 'next/link';
import { ArrowLeft, Tv } from 'lucide-react';

export default function ShowNotFound() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-8 text-center">
      <div className="w-20 h-20 bg-muted rounded-2xl flex items-center justify-center mb-6 border border-border">
        <Tv className="w-10 h-10 text-muted-foreground" />
      </div>
      <h1 className="text-2xl font-black text-foreground mb-2">Show Not Found</h1>
      <p className="text-muted-foreground text-sm mb-8 max-w-xs">
        We couldn&apos;t find this show. It may have been removed or the link is incorrect.
      </p>
      <Link
        href="/"
        className="flex items-center gap-2 bg-accent text-accent-foreground font-bold px-6 py-3 rounded-xl hover:bg-accent/90 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Home
      </Link>
    </div>
  );
}
