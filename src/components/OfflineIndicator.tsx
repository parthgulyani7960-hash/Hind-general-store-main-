import React from 'react';
import { WifiOff } from 'lucide-react';
import { useStore } from '@/StoreContext';

export const OfflineIndicator = () => {
  const { isOnline } = useStore();
  if (isOnline) return null;

  return (
    <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 bg-stone-900/90 backdrop-blur-md text-white px-5 py-2.5 rounded-2xl shadow-xl flex items-center gap-2.5 border border-stone-800 animate-in fade-in slide-in-from-top-2 duration-500">
      <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
      <span className="text-[11px] font-black uppercase tracking-widest leading-none">Working Offline</span>
    </div>
  );
};
