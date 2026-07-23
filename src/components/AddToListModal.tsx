"use client";

import { useState } from 'react';
import { useStore } from '@/store/useStore';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Check } from 'lucide-react';

interface AddToListModalProps {
  isOpen: boolean;
  onClose: () => void;
  showId: number;
}

export default function AddToListModal({ isOpen, onClose, showId }: AddToListModalProps) {
  const customLists = useStore(state => state.customLists);
  const createList = useStore(state => state.createList);
  const addToList = useStore(state => state.addToList);
  const removeFromList = useStore(state => state.removeFromList);
  
  const [isCreating, setIsCreating] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [newListDesc, setNewListDesc] = useState('');

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newListName.trim()) return;
    createList(newListName.trim(), newListDesc.trim());
    setIsCreating(false);
    setNewListName('');
    setNewListDesc('');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-foreground/80 backdrop-blur-sm p-4">
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="bg-background w-full sm:max-w-md rounded-2xl sm:rounded-3xl overflow-hidden flex flex-col max-h-[80vh] shadow-2xl relative border border-border"
          >
            {/* Header */}
            <div className="p-6 border-b border-border flex justify-between items-center bg-card">
              <h2 className="text-xl font-black text-foreground">Save to List</h2>
              <button 
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="overflow-y-auto p-4 flex flex-col gap-3">
              {customLists.length === 0 && !isCreating && (
                <div className="text-center py-8 px-4 text-muted-foreground">
                  <p className="mb-4 text-sm font-medium">You don&apos;t have any custom lists yet.</p>
                </div>
              )}

              {!isCreating ? (
                <>
                  {customLists.map(list => {
                    const isInList = list.shows.includes(showId);
                    return (
                      <button
                        key={list.id}
                        onClick={() => isInList ? removeFromList(list.id, showId) : addToList(list.id, showId)}
                        className="flex items-center justify-between p-4 rounded-xl border border-border bg-card hover:bg-muted transition-colors text-left"
                      >
                        <div>
                          <h4 className="font-bold text-foreground text-sm">{list.name}</h4>
                          {list.description && <p className="text-xs text-muted-foreground mt-0.5">{list.description}</p>}
                        </div>
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center border transition-colors ${
                          isInList ? 'bg-accent border-accent text-accent-foreground' : 'border-muted-foreground/30 text-transparent'
                        }`}>
                          <Check className="w-4 h-4" />
                        </div>
                      </button>
                    );
                  })}
                  
                  <button 
                    onClick={() => setIsCreating(true)}
                    className="mt-2 flex items-center justify-center gap-2 w-full py-4 rounded-xl border border-dashed border-muted-foreground/50 text-muted-foreground hover:text-foreground hover:border-foreground transition-colors font-bold"
                  >
                    <Plus className="w-5 h-5" />
                    Create New List
                  </button>
                </>
              ) : (
                <form onSubmit={handleCreate} className="flex flex-col gap-4 p-2">
                  <h3 className="font-bold text-foreground">Create a New List</h3>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-muted-foreground uppercase">List Name</label>
                    <input 
                      type="text" 
                      autoFocus
                      value={newListName}
                      onChange={e => setNewListName(e.target.value)}
                      placeholder="e.g. Binge-worthy Sci-Fi"
                      className="bg-muted px-4 py-3 rounded-xl border border-transparent focus:border-accent outline-none text-sm text-foreground transition-all"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-muted-foreground uppercase">Description (Optional)</label>
                    <textarea 
                      value={newListDesc}
                      onChange={e => setNewListDesc(e.target.value)}
                      placeholder="What is this list about?"
                      className="bg-muted px-4 py-3 rounded-xl border border-transparent focus:border-accent outline-none text-sm text-foreground transition-all resize-none h-20"
                    />
                  </div>
                  <div className="flex gap-3 mt-2">
                    <button 
                      type="button"
                      onClick={() => setIsCreating(false)}
                      className="flex-1 py-3 bg-muted text-foreground font-bold rounded-xl hover:bg-muted/80 transition-colors"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit"
                      disabled={!newListName.trim()}
                      className="flex-1 py-3 bg-accent text-accent-foreground font-bold rounded-xl disabled:opacity-50 transition-colors"
                    >
                      Create
                    </button>
                  </div>
                </form>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
