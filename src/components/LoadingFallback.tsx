import React from 'react';
import { motion } from 'motion/react';
import { ShoppingBag } from 'lucide-react';

export default function LoadingFallback({ message }: { message?: string }) {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-stone-50 z-50">
      <div className="flex flex-col items-center space-y-8">
        <div className="relative flex items-center justify-center">
          {/* Outer Ring */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-20 h-20 border-t-2 border-r-2 border-primary rounded-full absolute"
          />
          {/* Inner Ring (Reverse) */}
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 border-b-2 border-l-2 border-secondary rounded-full absolute"
          />
          {/* Center Icon */}
          <motion.div
            animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="bg-white p-3 rounded-2xl shadow-xl shadow-stone-200/50 relative z-10"
          >
            <ShoppingBag className="text-primary" size={28} />
          </motion.div>
        </div>
        
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center"
        >
          <span className="font-black text-[10px] tracking-[0.3em] uppercase text-stone-400 mb-2">Hind-Store v1.0.0</span>
          <div className="flex items-center space-x-2">
            <span className="font-bold text-sm text-stone-900">{message || 'Synchronizing inventory...'}</span>
            <div className="flex space-x-1">
              {[0, 1, 2].map(i => (
                <motion.div
                  key={i}
                  animate={{ y: [0, -4, 0] }}
                  transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                  className="w-1 h-1 bg-primary rounded-full"
                />
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
