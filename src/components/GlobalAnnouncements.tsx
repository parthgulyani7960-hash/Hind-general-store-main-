import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, Info, Megaphone, X, ChevronRight, Zap } from 'lucide-react';
import { cn } from '@/types';
import { useStore } from '@/StoreContext';

interface Announcement {
  id: number;
  title: string;
  content: string;
  type: 'info' | 'warning' | 'error' | 'success' | 'maintenance' | 'promo';
  priority: 'low' | 'medium' | 'high' | 'critical';
  is_dismissible: boolean | number;
}

export default function GlobalAnnouncements() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [dismissedIds, setDismissedIds] = useState<number[]>(() => {
    const saved = localStorage.getItem('hgs_dismissed_announcements');
    return saved ? JSON.parse(saved) : [];
  });
  const { fetchWithHandling, user } = useStore();

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchWithHandling<Announcement[]>('/api/announcements');
        if (data) setAnnouncements(data);
      } catch (err) {}
    };
    load();
  }, [fetchWithHandling]);

  const handleDismiss = (id: number) => {
    const newDismissed = [...dismissedIds, id];
    setDismissedIds(newDismissed);
    localStorage.setItem('hgs_dismissed_announcements', JSON.stringify(newDismissed));
  };

  const processed = announcements
    .filter(a => !dismissedIds.includes(a.id))
    .filter(a => {
        if (user) return true;
        return a.type === 'maintenance' || a.title.toLowerCase().includes('update');
    })
    .sort((a,b) => b.id - a.id);

  const visibleAnnouncements = processed.length > 0 ? [processed[0]] : [];

  if (visibleAnnouncements.length === 0) return null;

  return (
    <div className="w-full space-y-px">
      <AnimatePresence>
        {visibleAnnouncements.map((ann) => (
          <motion.div
            key={ann.id}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className={cn(
              "relative px-4 py-3 sm:px-6 flex items-center justify-between overflow-hidden",
              ann.type === 'maintenance' ? "bg-red-600 text-white" :
              ann.type === 'promo' ? "bg-amber-400 text-stone-900" :
              ann.type === 'warning' ? "bg-orange-500 text-white" :
              ann.type === 'error' ? "bg-red-500 text-white" :
              "bg-stone-900 text-white"
            )}
          >
            <div className="flex items-center space-x-3 max-w-4xl mx-auto w-full">
              <div className="shrink-0 p-1.5 bg-white/20 rounded-lg">
                {ann.type === 'maintenance' && < Zap size={16} className="animate-pulse" />}
                {ann.type === 'promo' && <Megaphone size={16} />}
                {ann.type === 'info' && <Info size={16} />}
                {(ann.type === 'warning' || ann.type === 'error') && <AlertTriangle size={16} />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm font-black uppercase tracking-tight truncate">
                  {ann.title}
                </p>
                <p className="text-[10px] sm:text-xs font-medium opacity-80 line-clamp-1">
                  {ann.content}
                </p>
              </div>
              
              {ann.is_dismissible ? (
                <button 
                  onClick={() => handleDismiss(ann.id)}
                  className="p-1.5 hover:bg-white/10 rounded-full transition-colors shrink-0"
                >
                  <X size={16} />
                </button>
              ) : (
                <div className="p-1.5 opacity-40 shrink-0">
                  < ChevronRight size={16} />
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
