import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldAlert, AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';
import { useStore } from '../StoreContext';
import { cn } from '../lib/utils';

export default function FullScreenAlert() {
  const { currentAlert, markAlertAsRead, refreshUser } = useStore();
  const [timeLeft, setTimeLeft] = useState(0);
  const [canSkip, setCanSkip] = useState(false);

  useEffect(() => {
    if (currentAlert) {
      // Trigger user refresh if it's an account update
      if (currentAlert.title?.includes('Account') || currentAlert.title?.includes('Wallet')) {
        refreshUser();
      }

      const durationSec = Math.ceil((currentAlert.duration || 5000) / 1000);
      setTimeLeft(durationSec);
      setCanSkip(!currentAlert.is_unskippable);

      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setCanSkip(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      // Total auto-close timer
      const autoClose = setTimeout(() => {
        markAlertAsRead(currentAlert.id);
      }, (currentAlert.duration || 5000) + 1000); // Buffer for animation

      return () => {
        clearInterval(timer);
        clearTimeout(autoClose);
      };
    }
  }, [currentAlert?.id]);

  if (!currentAlert) return null;

  const getIcon = () => {
    switch (currentAlert.type) {
      case 'critical': return <ShieldAlert className="w-16 h-16 text-red-500" />;
      case 'warning': return <AlertTriangle className="w-16 h-16 text-amber-500" />;
      case 'success': return <CheckCircle2 className="w-16 h-16 text-green-500" />;
      default: return <Info className="w-16 h-16 text-blue-500" />;
    }
  };

  const getBgColor = () => {
    switch (currentAlert.type) {
      case 'critical': return 'bg-red-50';
      case 'warning': return 'bg-amber-50';
      case 'success': return 'bg-green-50';
      default: return 'bg-blue-50';
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9999] flex items-center justify-center p-6 bg-stone-900/40 backdrop-blur-md"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className={cn(
            "relative w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border-4",
            currentAlert.type === 'critical' ? 'border-red-200' : 
            currentAlert.type === 'warning' ? 'border-amber-200' :
            currentAlert.type === 'success' ? 'border-green-200' : 'border-blue-200'
          )}
        >
          {/* Progress Bar */}
          <div className="absolute top-0 left-0 w-full h-1 bg-stone-100">
            <motion.div
              initial={{ width: "100%" }}
              animate={{ width: "0%" }}
              transition={{ duration: (currentAlert.duration || 5000) / 1000, ease: "linear" }}
              className={cn(
                "h-full",
                currentAlert.type === 'critical' ? 'bg-red-500' : 
                currentAlert.type === 'warning' ? 'bg-amber-500' :
                currentAlert.type === 'success' ? 'bg-green-500' : 'bg-blue-500'
              )}
            />
          </div>

          {canSkip && (
            <button
              onClick={() => markAlertAsRead(currentAlert.id)}
              className="absolute top-6 right-6 p-2 text-stone-400 hover:text-stone-900 transition-colors"
            >
              <X size={24} />
            </button>
          )}

          <div className="p-10 space-y-8 text-center">
            <div className={cn(
              "w-24 h-24 mx-auto rounded-[2rem] flex items-center justify-center",
              getBgColor()
            )}>
              {getIcon()}
            </div>

            <div className="space-y-4">
              <h2 className="text-3xl font-black text-stone-900 leading-tight">
                {currentAlert.title}
              </h2>
              <p className="text-stone-600 text-lg leading-relaxed font-medium">
                {currentAlert.message}
              </p>
              {currentAlert.details && (
                <div className="p-5 bg-stone-50 rounded-2xl border border-stone-100 text-left">
                  <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-2">Technical Context / Reason</p>
                  <p className="text-stone-500 text-sm leading-relaxed italic">
                    "{currentAlert.details}"
                  </p>
                </div>
              )}
            </div>

            <div className="pt-4">
              {!canSkip ? (
                <div className="flex flex-col items-center space-y-3">
                  <div className="w-12 h-12 rounded-full border-4 border-stone-100 border-t-primary animate-spin" />
                  <p className="text-xs font-black text-stone-400 uppercase tracking-widest">
                    Applying changes... {timeLeft}s
                  </p>
                </div>
              ) : (
                <button
                  onClick={() => markAlertAsRead(currentAlert.id)}
                  className={cn(
                    "w-full py-4 rounded-2xl text-white font-black uppercase tracking-widest shadow-xl transition-transform hover:scale-[1.02] active:scale-[0.98]",
                    currentAlert.type === 'critical' ? 'bg-red-500 shadow-red-200' : 
                    currentAlert.type === 'warning' ? 'bg-amber-500 shadow-amber-200' :
                    currentAlert.type === 'success' ? 'bg-green-500 shadow-green-200' : 'bg-blue-500 shadow-blue-200'
                  )}
                >
                  Understood
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
