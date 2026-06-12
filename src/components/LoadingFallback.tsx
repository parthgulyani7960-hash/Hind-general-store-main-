import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { ShoppingBag, AlertOctagon, ArrowRight, ShieldAlert } from 'lucide-react';

export default function LoadingFallback({ message, fullScreen = true }: { message?: string; fullScreen?: boolean }) {
  const [isSlow, setIsSlow] = useState(false);
  const [testCrash, setTestCrash] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsSlow(true);
    }, 4000); // Trigger slow mode diagnostics slightly earlier for testing
    return () => clearTimeout(timer);
  }, []);

  if (testCrash) {
    throw new Error("Simulated Lightweight System Crash for Admin Panel Verification");
  }

  const handleForceBypass = () => {
    window.dispatchEvent(new CustomEvent('force_bypass_loading'));
  };

  return (
    <div className={fullScreen ? "fixed inset-0 flex flex-col items-center justify-center bg-stone-50 z-50 p-4" : "w-full min-h-[50vh] flex flex-col items-center justify-center bg-transparent py-16 p-4"}>
      <div className="flex flex-col items-center space-y-8 max-w-md w-full">
        <div className="relative flex items-center justify-center">
          {/* Outer Ring */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 border-t-2 border-r-2 border-primary rounded-full absolute"
          />
          {/* Inner Ring (Reverse) */}
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
            className="w-12 h-12 border-b-2 border-l-2 border-secondary rounded-full absolute"
          />
          {/* Center Icon */}
          <motion.div
            animate={{ scale: [1, 1.15, 1], opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="bg-white p-2.5 rounded-2xl shadow-xl shadow-stone-200/50 relative z-10"
          >
            <ShoppingBag className="text-primary" size={22} />
          </motion.div>
        </div>
        
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center w-full"
        >
          <span className="font-black text-[9px] tracking-[0.25em] uppercase text-stone-400 mb-2">New Hind General Store V1.0.0</span>
          <div className="flex flex-col items-center space-y-2 w-full text-center">
            <span className="font-bold text-sm text-stone-900">{message || 'Synchronizing inventory...'}</span>
            <div className="flex flex-col items-center mt-2 opacity-60">
                <span className="text-[10px] text-stone-500 font-bold uppercase tracking-widest">Secure Connection Active</span>
            </div>
            
            {isSlow && (
              <motion.span 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-amber-600 text-[10px] font-bold uppercase tracking-wider mt-1 px-3 py-1 bg-amber-50 rounded-full border border-amber-100"
              >
                Server is taking longer to respond
              </motion.span>
            )}

            <div className="flex space-x-1 py-2">
              {[0, 1, 2].map(i => (
                <motion.div
                  key={i}
                  animate={{ y: [0, -4, 0] }}
                  transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                  className="w-1.5 h-1.5 bg-primary rounded-full"
                />
              ))}
            </div>

          </div>
        </motion.div>
      </div>
    </div>
  );
}
