import React from 'react';
import { Wifi, WifiOff, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';
import { useStore } from '@/StoreContext';

export default function NetworkStatusIndicator() {
  const { isOnline, latency } = useStore();

  const getLatencyColor = (ms: number | null) => {
    if (ms === null) return 'text-stone-400';
    if (ms < 150) return 'text-emerald-500';
    if (ms < 400) return 'text-amber-500';
    return 'text-rose-500';
  };

  const getLatencyBg = (ms: number | null) => {
    if (ms === null) return 'bg-stone-100';
    if (ms < 150) return 'bg-emerald-500';
    if (ms < 400) return 'bg-amber-500';
    return 'bg-rose-500';
  };

  return (
    <div className="flex items-center">
      <AnimatePresence mode="wait">
        {!isOnline ? (
          <motion.div
            key="offline"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="flex items-center space-x-1.5 px-2 py-1 bg-rose-50 text-rose-600 rounded-full border border-rose-100"
          >
            <WifiOff size={10} className="stroke-[3]" />
            <span className="text-[9px] font-black uppercase tracking-wider">Offline</span>
          </motion.div>
        ) : (
          <motion.div
            key="online"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="flex items-center space-x-2 group relative cursor-help"
          >
            <div className="flex items-center space-x-1.5 px-2 py-1 bg-stone-50 text-stone-600 rounded-full border border-stone-100 transition-all hover:bg-white hover:shadow-sm">
                <div className="relative">
                    <div className={cn("w-1.5 h-1.5 rounded-full", getLatencyBg(latency))} />
                    <div className={cn("absolute inset-0 w-1.5 h-1.5 rounded-full animate-ping opacity-75", getLatencyBg(latency))} />
                </div>
                <span className={cn("text-[9px] font-black uppercase tracking-widest", getLatencyColor(latency))}>
                    {latency ? `${latency}ms` : 'Syncing'}
                </span>
            </div>

            {/* Tooltip */}
            <div className="absolute top-full right-0 mt-2 w-48 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-[70] transform translate-y-1 group-hover:translate-y-0">
                <div className="bg-white rounded-xl shadow-xl border border-stone-100 p-3">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Network Health</span>
                        <Wifi size={12} className="text-emerald-500" />
                    </div>
                    <div className="space-y-1.5">
                        <div className="flex justify-between items-center text-[11px] font-bold">
                            <span className="text-stone-500">Status</span>
                            <span className="text-emerald-600 font-black">Stable</span>
                        </div>
                        <div className="flex justify-between items-center text-[11px] font-bold">
                            <span className="text-stone-500">Latency</span>
                            <span className={cn("font-black", getLatencyColor(latency))}>{latency || '--'} ms</span>
                        </div>
                        <div className="pt-1.5 border-t border-stone-50 mt-1.5">
                            <p className="text-[9px] text-stone-400 leading-tight">
                                Real-time sync is active. Faster response times ensure smoother shopping.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
