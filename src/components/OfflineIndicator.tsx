import React, { useState, useEffect, useCallback } from 'react';
import { WifiOff, RefreshCw } from 'lucide-react';
import { useStore } from '@/StoreContext';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

export const OfflineIndicator = () => {
  const { isOnline } = useStore();
  const [isChecking, setIsChecking] = useState(false);

  const checkConnectivity = useCallback(async (silent = false) => {
    setIsChecking(true);
    try {
      const res = await fetch('/api/health', { method: 'GET', cache: 'no-store' });
      if (res.ok) {
        toast.success('Connection restored!');
        window.location.reload(); 
        return true;
      } else {
        throw new Error('Still offline');
      }
    } catch (err) {
      if (!silent) toast.error('Still offline');
      return false;
    } finally {
      setIsChecking(false);
    }
  }, []);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    let currentDelay = 2000;
    const maxDelay = 30000;

    const poll = async () => {
      const success = await checkConnectivity(true);
      if (!success) {
        currentDelay = Math.min(currentDelay * 2, maxDelay);
        timeoutId = setTimeout(poll, currentDelay);
      }
    };

    if (!isOnline) {
      timeoutId = setTimeout(poll, currentDelay);
    }

    return () => clearTimeout(timeoutId);
  }, [isOnline, checkConnectivity]);

  if (isOnline) return null;

  return (
    <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 bg-stone-900/90 backdrop-blur-md text-white px-5 py-2.5 rounded-2xl shadow-xl flex items-center gap-2.5 border border-stone-800 animate-in fade-in slide-in-from-top-2 duration-500">
      <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
      <span className="text-[11px] font-black uppercase tracking-widest leading-none">Working Offline</span>
      <button 
        onClick={() => checkConnectivity(false)}
        disabled={isChecking}
        className={cn("ml-2 p-1 rounded-full hover:bg-stone-700 transition-all", isChecking && "animate-spin")}
      >
        <RefreshCw size={14} />
      </button>
    </div>
  );
};
