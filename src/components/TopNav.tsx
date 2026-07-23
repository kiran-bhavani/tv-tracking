import { Bell, Settings } from 'lucide-react';
import Link from 'next/link';

export default function TopNav({ title = "TV Time" }: { title?: string }) {
  return (
    <header className="sticky top-0 z-40 bg-background/90 backdrop-blur-md pt-safe px-4 py-3 flex justify-between items-center border-b border-border">
      <h1 className="text-xl font-extrabold tracking-tight text-foreground">{title}</h1>
      <div className="flex gap-4">
        <Link href="/notifications" className="text-muted-foreground hover:text-foreground transition relative">
          <Bell className="w-5 h-5" />
          <span className="absolute top-0 right-0 w-2 h-2 bg-accent rounded-full border border-background"></span>
        </Link>
        <Link href="/settings" className="text-muted-foreground hover:text-foreground transition">
          <Settings className="w-5 h-5" />
        </Link>
      </div>
    </header>
  );
}
