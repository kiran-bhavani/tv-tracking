"use client";

import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Trash2, Search, Loader2, Plus, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useStore, CustomList } from '@/store/useStore';
import { getShowDetails, searchMulti } from '@/lib/tmdb';
import { cacheManager } from '@/lib/cache';

interface ManageListModalProps {
  list: CustomList | null; // null means Create Mode
  onClose: () => void;
  onShare: (list: CustomList) => void;
}
function Toast({ message, type, onDismiss }: { message: string; type: 'success' | 'error' | 'info'; onDismiss: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 4000);
    return () => clearTimeout(t);
  }, [onDismiss]);
  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      className={`fixed top-4 left-4 right-4 z-[110] flex items-center gap-3 p-4 rounded-2xl shadow-2xl border ${
        type === 'error'
          ? 'bg-red-500/10 border-red-500/20 text-red-400'
          : 'bg-green-500/10 border-green-500/20 text-green-400'
      }`}
    >
      {type === 'error'
        ? <AlertCircle className="w-5 h-5 flex-shrink-0" />
        : <CheckCircle2 className="w-5 h-5 flex-shrink-0" />}
      <p className="text-sm font-semibold flex-1 whitespace-pre-line">{message}</p>
    </motion.div>
  );
}

function ConfirmModal({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center px-4 pb-6 sm:pb-0">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onCancel} />
      <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}
        className="relative w-full max-w-sm bg-card border border-white/10 rounded-3xl p-6 shadow-2xl">
        <div className="w-14 h-14 rounded-2xl bg-red-500/10 flex items-center justify-center mb-4 mx-auto">
          <Trash2 className="w-7 h-7 text-red-500" />
        </div>
        <h3 className="text-xl font-black text-center mb-2">Delete List?</h3>
        <p className="text-sm text-muted-foreground text-center mb-6 leading-relaxed">
          Are you sure you want to completely delete this list? This action cannot be undone.
        </p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 py-3 bg-muted font-bold rounded-xl text-sm hover:bg-muted/80 transition-colors">
            Cancel
          </button>
          <button onClick={onConfirm} className="flex-1 py-3 bg-red-500 text-white font-bold rounded-xl text-sm hover:bg-red-600 transition-colors">
            Delete
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default function ManageListModal({ list, onClose, onShare }: ManageListModalProps) {
  const isCreateMode = !list;
  const [name, setName] = useState(list?.name || '');
  const [description, setDescription] = useState(list?.description || '');
  
  // Holds full TMDB objects for rendering cards
  const [showsData, setShowsData] = useState<any[]>([]);
  const [loadingInitial, setLoadingInitial] = useState(!isCreateMode);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  
  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const createList = useStore(state => state.createList);
  const updateList = useStore(state => state.updateList);
  const deleteList = useStore(state => state.deleteList);

  // Load existing shows if in Edit mode
  useEffect(() => {
    async function loadShows() {
      if (!list || !list.shows || list.shows.length === 0) {
        setLoadingInitial(false);
        return;
      }
      
      const promises = list.shows.map(async (id) => {
        const cacheKey = `show_details_${id}`;
        const cached = cacheManager.get<any>(cacheKey);
        if (cached) return cached;
        try {
          const data = await getShowDetails(id);
          cacheManager.set(cacheKey, data);
          return data;
        } catch (e) {
          // If a movie was added instead of a show, getShowDetails (which calls /tv/) will fail. 
          // We should ideally use a generic fetch if we know the type, but since we just need the poster for the modal, 
          // we can try fetching movie details if tv details fail.
          const res = await fetch(`https://api.themoviedb.org/3/movie/${id}?api_key=${process.env.NEXT_PUBLIC_TMDB_API_KEY || 'YOUR_KEY_HERE'}`);
          if (res.ok) {
            const data = await res.json();
            return data;
          }
          return null;
        }
      });
      
      const results = await Promise.allSettled(promises);
      const validShows = results
        .filter((r): r is PromiseFulfilledResult<any> => r.status === 'fulfilled' && r.value !== null)
        .map(r => (r as PromiseFulfilledResult<any>).value);
        
      setShowsData(validShows);
      setLoadingInitial(false);
    }
    loadShows();
  }, [list]);

  // Handle Search Input
  useEffect(() => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const data = await searchMulti(searchQuery);
        // Filter only tv and movies with posters
        const validResults = data.results.filter((item: any) => 
          (item.media_type === 'tv' || item.media_type === 'movie') && item.poster_path
        );
        setSearchResults(validResults.slice(0, 5));
      } catch (err) {
        console.error("Search failed:", err);
      } finally {
        setIsSearching(false);
      }
    }, 500);

    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [searchQuery]);

  const handleSave = () => {
    if (!name.trim()) {
      setToast({ message: "List name cannot be empty", type: "error" });
      return;
    }
    
    const showIds = showsData.map(s => s.id);
    
    if (isCreateMode) {
      createList(name.trim(), description.trim(), showIds);
    } else {
      updateList(list.id, name.trim(), description.trim(), showIds);
    }
    
    onClose();
  };

  const handleAddSearchResult = (item: any) => {
    if (showsData.find(s => s.id === item.id)) {
      // Already in list
      setSearchQuery('');
      return;
    }
    setShowsData(prev => [...prev, item]);
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleRemoveItem = (showId: number) => {
    setShowsData(prev => prev.filter(s => s.id !== showId));
  };

  return (
    <>
      <AnimatePresence>
        {toast && <Toast key="toast" message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />}
        {showConfirmDelete && (
          <ConfirmModal 
            key="confirmDelete" 
            onConfirm={() => {
              deleteList(list!.id);
              setShowConfirmDelete(false);
              onClose();
            }} 
            onCancel={() => setShowConfirmDelete(false)} 
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center">
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
          />

        {/* Modal */}
        <motion.div 
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="relative w-full max-w-xl bg-card border-t border-border sm:border sm:rounded-3xl shadow-2xl flex flex-col h-[90vh] sm:h-[85vh] overflow-hidden"
        >
          {/* Header */}
          <div className="flex justify-between items-center p-5 border-b border-border/50 bg-background/50 backdrop-blur-md sticky top-0 z-20">
            <h3 className="font-black text-xl text-foreground">
              {isCreateMode ? 'Create New List' : 'Edit List'}
            </h3>
            <div className="flex gap-3">
              <button onClick={onClose} className="p-2 bg-muted rounded-full text-muted-foreground hover:text-foreground transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="overflow-y-auto p-5 hide-scrollbar flex-1 relative">
            
            {/* Edit Details */}
            <div className="space-y-4 mb-8">
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 block">List Name</label>
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-muted border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent transition-all"
                  placeholder="E.g. Sci-Fi Masterpieces"
                  autoFocus={isCreateMode}
                />
              </div>
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 block">Description (Optional)</label>
                <textarea 
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-muted border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent transition-all resize-none h-20"
                  placeholder="What is this list about?"
                />
              </div>
            </div>

            {/* Live Search */}
            <div className="mb-8 relative z-10">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 block">Add Shows or Movies</label>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl pl-10 pr-4 py-3 text-sm text-foreground focus:outline-none focus:border-accent transition-colors shadow-inner"
                  placeholder="Search for a title to add..."
                />
                {isSearching && (
                  <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground animate-spin" />
                )}
              </div>

              {/* Search Dropdown */}
              <AnimatePresence>
                {searchResults.length > 0 && searchQuery && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-xl shadow-2xl overflow-hidden z-20"
                  >
                    {searchResults.map((item) => {
                      const title = item.name || item.title;
                      const isAdded = showsData.some(s => s.id === item.id);
                      
                      return (
                        <div key={item.id} className="flex items-center gap-3 p-3 hover:bg-muted transition-colors border-b border-border/50 last:border-0">
                          <img 
                            src={`https://image.tmdb.org/t/p/w92${item.poster_path}`} 
                            alt={title}
                            className="w-10 h-14 object-cover rounded-md bg-muted"
                          />
                          <div className="flex-1 overflow-hidden">
                            <h4 className="font-bold text-sm text-foreground truncate">{title}</h4>
                            <p className="text-xs text-muted-foreground uppercase">{item.media_type}</p>
                          </div>
                          <button 
                            onClick={() => handleAddSearchResult(item)}
                            disabled={isAdded}
                            className={`p-2 rounded-full flex items-center justify-center transition-colors ${
                              isAdded ? 'bg-muted text-muted-foreground cursor-not-allowed' : 'bg-accent/20 text-accent hover:bg-accent hover:text-accent-foreground'
                            }`}
                          >
                            {isAdded ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                          </button>
                        </div>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* List Grid */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h4 className="font-bold text-foreground">Items in List ({showsData.length})</h4>
              </div>
              
              {loadingInitial ? (
                <div className="flex justify-center items-center py-10">
                  <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                </div>
              ) : showsData.length === 0 ? (
                <div className="text-center py-10 bg-muted/30 rounded-xl border border-dashed border-border text-sm text-muted-foreground">
                  Your list is empty. Search above to add items!
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 pb-6">
                  {showsData.map((show, idx) => (
                    <motion.div 
                      key={show.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: idx * 0.03 }}
                      className="relative aspect-[2/3] rounded-xl overflow-hidden border border-border/50 group shadow-sm"
                    >
                      <img 
                        src={`https://image.tmdb.org/t/p/w200${show.poster_path}`} 
                        alt={show.name || show.title} 
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center backdrop-blur-[2px]">
                        <button 
                          onClick={() => handleRemoveItem(show.id)}
                          className="w-12 h-12 rounded-full bg-red-500 text-white flex items-center justify-center shadow-2xl hover:scale-110 transition-transform"
                          title="Remove from list"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          {/* Footer Actions */}
          <div className="p-5 border-t border-border bg-background/80 backdrop-blur-md flex justify-between items-center z-10 shadow-[0_-10px_40px_rgba(0,0,0,0.1)]">
            {!isCreateMode && (
              <button 
                onClick={() => setShowConfirmDelete(true)}
                className="text-xs font-bold text-red-500 hover:bg-red-500/10 px-4 py-2 rounded-full transition-colors"
              >
                Delete List
              </button>
            )}
            
            <button 
              onClick={handleSave}
              className={`px-8 py-3 bg-accent text-accent-foreground rounded-full font-black text-sm shadow-lg hover:shadow-xl hover:bg-accent/90 transition-all ${isCreateMode ? 'w-full' : 'ml-auto'}`}
            >
              <div className="flex items-center gap-2 justify-center">
                <Save className="w-4 h-4" /> 
                {isCreateMode ? 'Create List' : 'Save Changes'}
              </div>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  </>
  );
}

// Dummy check icon since we missed importing it initially
function Check(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  );
}
