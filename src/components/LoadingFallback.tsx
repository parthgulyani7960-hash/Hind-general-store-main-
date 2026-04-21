import React from 'react';
import { motion } from 'motion/react';
import { ShoppingBag } from 'lucide-react';

export default function LoadingFallback() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-stone-50 z-50">
      <motion.div 
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center space-y-4 text-primary"
      >
        <div className="relative">
          <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
          <ShoppingBag className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-primary" size={24} />
        </div>
        <div className="font-bold tracking-widest uppercase text-xs animate-pulse">Loading Hind Store...</div>
      </motion.div>
    </div>
  );
}
