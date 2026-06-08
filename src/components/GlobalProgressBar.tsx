import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

export const GlobalProgressBar = () => {
  const [loadingCount, setLoadingCount] = useState(0);

  useEffect(() => {
    const handleStart = () => setLoadingCount(prev => prev + 1);
    const handleStop = () => setLoadingCount(prev => Math.max(0, prev - 1));

    window.addEventListener('api_loading_start', handleStart);
    window.addEventListener('api_loading_stop', handleStop);

    return () => {
      window.removeEventListener('api_loading_start', handleStart);
      window.removeEventListener('api_loading_stop', handleStop);
    };
  }, []);

  return (
    <AnimatePresence>
      {loadingCount > 0 && (
        <motion.div
          className="fixed top-0 left-0 right-0 h-1 bg-amber-500 z-[9999]"
          initial={{ scaleX: 0, opacity: 0 }}
          animate={{ scaleX: 1, opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{ transformOrigin: 'left' }}
        />
      )}
    </AnimatePresence>
  );
};
