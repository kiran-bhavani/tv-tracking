"use client";

import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import TopNav from '@/components/TopNav';
import { Loader2, Share2 } from 'lucide-react';
import { getShowDetails } from '@/lib/tmdb';
import ShowCard from '@/components/ShowCard';
import { motion } from 'framer-motion';

export default function PublicListPage({ params }: { params: { id: string } }) {
  const [listData, setListData] = useState<any>(null);
  const [shows, setShows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function loadList() {
      try {
        const listRef = doc(db, 'public_lists', params.id);
        const listSnap = await getDoc(listRef);

        if (!listSnap.exists()) {
          setError("This list doesn't exist or has been removed.");
          setLoading(false);
          return;
        }

        const data = listSnap.data();
        setListData(data);

        // Fetch details for all shows in the list
        if (data.shows && data.shows.length > 0) {
          const promises = data.shows.map((id: number) => getShowDetails(id));
          const results = await Promise.allSettled(promises);
          
          const validShows = results
            .filter((r): r is PromiseFulfilledResult<any> => r.status === 'fulfilled')
            .map(r => r.value);
            
          setShows(validShows);
        }
      } catch (err) {
        console.error("Failed to load list", err);
        setError("Failed to load list.");
      } finally {
        setLoading(false);
      }
    }

    loadList();
  }, [params.id]);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <TopNav title="List Not Found" />
        <div className="flex flex-col items-center justify-center mt-32 px-6 text-center">
          <p className="text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <TopNav title="Shared List" />

      {/* Header */}
      <div className="px-6 pt-8 pb-6 border-b border-border bg-card/30">
        <motion.h1 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl font-black text-foreground"
        >
          {listData.name}
        </motion.h1>
        
        {listData.description && (
          <motion.p 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-muted-foreground mt-2"
          >
            {listData.description}
          </motion.p>
        )}

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex items-center justify-between mt-6"
        >
          <div className="text-sm font-bold text-accent">
            Curated by {listData.authorName || 'a TV Time User'}
          </div>
          
          <button 
            onClick={handleShare}
            className="flex items-center gap-2 px-4 py-2 bg-accent/20 text-accent rounded-full text-sm font-bold hover:bg-accent/30 transition-colors"
          >
            <Share2 className="w-4 h-4" />
            {copied ? 'Copied!' : 'Share'}
          </button>
        </motion.div>
      </div>

      {/* Grid */}
      <div className="p-4 grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 mt-4">
        {shows.length === 0 ? (
          <div className="col-span-full text-center text-muted-foreground py-10">
            This list is empty.
          </div>
        ) : (
          shows.map((show, idx) => (
            <motion.div
              key={show.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.05 }}
            >
              <ShowCard show={{...show, media_type: 'tv'}} />
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
