import React, { useState, useEffect } from 'react';
import { useNetwork } from '@/hooks/useNetwork';
import { WifiOff, AlertTriangle, RefreshCw, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const NetworkBanner = () => {
  const { isOnline } = useNetwork();
  const [firebaseError, setFirebaseError] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(() => {
    try {
      return sessionStorage.getItem('hgs_network_dismissed') === 'true';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    const handleFirebaseUnreachable = (e: Event) => {
      const customEvent = e as CustomEvent;
      const detail = customEvent.detail;
      if (detail) {
        if (typeof detail === 'object' && detail !== null) {
          setFirebaseError(detail.message || detail.error || 'The store servers are currently unreachable.');
        } else {
          setFirebaseError(String(detail));
        }
      } else {
        setFirebaseError('The store servers are currently unreachable.');
      }
    };

    window.addEventListener('firebase_unreachable', handleFirebaseUnreachable);
    window.addEventListener('database_error', handleFirebaseUnreachable);
    return () => {
      window.removeEventListener('firebase_unreachable', handleFirebaseUnreachable);
      window.removeEventListener('database_error', handleFirebaseUnreachable);
    };
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    try {
      sessionStorage.setItem('hgs_network_dismissed', 'true');
    } catch {}
  };

  const handleRetry = () => {
    window.location.reload();
  };

  const handleClearData = () => {
    localStorage.clear();
    sessionStorage.clear();
    window.location.href = '/';
  };

  const showBanner = (!isOnline || !!firebaseError) && !dismissed;

  return (
    <AnimatePresence>
      {showBanner && (
        <motion.div
          key="NetworkBanner"
          initial={{ opacity: 0, y: -50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ type: 'spring', damping: 20, stiffness: 150 }}
          className="fixed top-6 left-1/2 -translate-x-1/2 z-[9999] w-[92%] max-w-lg"
        >
          <div className="bg-stone-900/95 backdrop-blur-md text-white border border-stone-800 p-6 rounded-[2rem] shadow-2xl flex flex-col gap-4 relative">
            <button
              onClick={handleDismiss}
              className="absolute top-4 right-4 p-1.5 hover:bg-stone-800 text-stone-500 hover:text-stone-300 rounded-full transition-colors"
              title="Dismiss warning"
            >
              <X size={16} />
            </button>

            <div className="flex items-start gap-4">
              <div className="p-3 bg-amber-500/10 text-amber-400 rounded-2xl shrink-0 animate-pulse">
                {!isOnline ? <WifiOff size={22} /> : <AlertTriangle size={22} />}
              </div>
              
              <div className="flex-grow min-w-0 pr-6">
                <h4 className="text-sm font-black uppercase tracking-wider text-stone-200">
                  {!isOnline ? 'Connection Offline' : 'Database Connection Lost'}
                </h4>
                <p className="text-xs text-stone-400 mt-1 leading-relaxed">
                  {!isOnline 
                    ? 'Your internet connection was interrupted. Please check your cellular network or Wi-Fi.'
                    : 'The connection to the secure database was lost. Please verify your internet and refresh.'}
                </p>
                {firebaseError && (
                  <p className="text-[10px] text-stone-500 mt-2 font-mono break-words">
                    Details: {firebaseError}
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-2.5 mt-2 pt-4 border-t border-stone-800/60">
              <button
                onClick={handleRetry}
                className="w-full px-5 py-2.5 bg-white text-stone-900 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-stone-100 transition-all active:scale-[0.98] flex items-center justify-center space-x-2"
              >
                <RefreshCw size={12} className="animate-spin" style={{ animationDuration: '6s' }} />
                <span>Reconnect Now</span>
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
