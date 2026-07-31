"use client";

import { useState } from 'react';
import { ListPlus } from 'lucide-react';
import AddToListModal from './AddToListModal';

interface SaveToListButtonProps {
  showId: number;
}

export default function SaveToListButton({ showId }: SaveToListButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <button 
        onClick={() => setIsModalOpen(true)}
        className="w-14 h-14 flex-shrink-0 bg-muted text-foreground rounded-2xl flex items-center justify-center font-bold text-sm shadow-lg hover:bg-muted/80 transition-all active:scale-95 border border-border relative group"
        aria-label="Save to Custom List"
        title="Save to Custom List"
      >
        <ListPlus className="w-5 h-5 group-hover:scale-110 transition-transform" />
      </button>
      
      <AddToListModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        showId={showId} 
      />
    </>
  );
}
