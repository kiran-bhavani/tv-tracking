import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { AuthProvider } from '@/contexts/AuthContext';
import BottomNav from "@/components/BottomNav";
import OnboardingGuard from "@/components/OnboardingGuard";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const viewport: Viewport = {
  themeColor: "#0a0a0a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  title: {
    default: "TV Time Tracker",
    template: "%s | TV Time Tracker",
  },
  description: "Track your favorite TV shows and movies. Mark episodes as watched, discover new content, and share lists with friends.",
  keywords: ["tv tracker", "tv show tracker", "movie tracker", "watchlist", "episode tracker"],
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "TV Time",
  },
  applicationName: "TV Time Tracker",
  openGraph: {
    type: "website",
    title: "TV Time Tracker",
    description: "Track your favorite TV shows and movies.",
    siteName: "TV Time Tracker",
  },
  twitter: {
    card: "summary",
    title: "TV Time Tracker",
    description: "Track your favorite TV shows and movies.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`h-full antialiased ${inter.className}`}>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <AuthProvider>
          <OnboardingGuard>
            <main className="flex-1 pb-32">
              {children}
            </main>
            <BottomNav />
          </OnboardingGuard>
        </AuthProvider>
      </body>
    </html>
  );
}
