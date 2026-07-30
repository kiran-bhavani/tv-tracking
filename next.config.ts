import type { NextConfig } from "next";
import withPWAInit from "next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  skipWaiting: true,
});

const nextConfig: NextConfig = {
  turbopack: {},
  images: {
    unoptimized: true,
    remotePatterns: [
      { protocol: 'https', hostname: 'image.tmdb.org', port: '', pathname: '/**' },
      { protocol: 'https', hostname: 'api.dicebear.com', port: '', pathname: '/**' },
      { protocol: 'https', hostname: 'img.youtube.com', port: '', pathname: '/**' },
      // Reddit avatars and static assets
      { protocol: 'https', hostname: 'www.redditstatic.com', port: '', pathname: '/**' },
      { protocol: 'https', hostname: 'styles.redditmedia.com', port: '', pathname: '/**' },
      { protocol: 'https', hostname: 'preview.redd.it', port: '', pathname: '/**' },
      // MyAnimeList / Jikan avatars
      { protocol: 'https', hostname: 'cdn.myanimelist.net', port: '', pathname: '/**' },
      // Giphy reaction GIFs
      { protocol: 'https', hostname: 'media.giphy.com', port: '', pathname: '/**' },
      { protocol: 'https', hostname: 'media0.giphy.com', port: '', pathname: '/**' },
      { protocol: 'https', hostname: 'media1.giphy.com', port: '', pathname: '/**' },
      { protocol: 'https', hostname: 'media2.giphy.com', port: '', pathname: '/**' },
      { protocol: 'https', hostname: 'media3.giphy.com', port: '', pathname: '/**' },
      // TMDB network logos and external sources
      { protocol: 'https', hostname: '*.tmdb.org', port: '', pathname: '/**' },
      // Firebase / Google user avatars
      { protocol: 'https', hostname: 'lh3.googleusercontent.com', port: '', pathname: '/**' },
      { protocol: 'https', hostname: 'firebasestorage.googleapis.com', port: '', pathname: '/**' },
    ],
  },
};


export default withPWA(nextConfig);
