import React from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface ExportProgressModalProps {
  open: boolean;
  progress: number;
  label: string;
}

export const ExportProgressModal: React.FC<ExportProgressModalProps> = ({ open, progress, label }) => (
  <AnimatePresence>
    {open && (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-[2rem] p-10 max-w-sm w-full shadow-2xl text-center space-y-6"
        >
          <div className="relative w-24 h-24 mx-auto">
            <svg className="w-full h-full transform -rotate-90">
              <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-stone-100" />
              <circle 
                cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="transparent" 
                strokeDasharray={251.2}
                strokeDashoffset={251.2 - (251.2 * progress) / 100}
                className="text-primary transition-all duration-500 ease-out" 
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xl font-black text-stone-900">{progress}%</span>
            </div>
          </div>
          <p className="font-semibold text-stone-600">{label}</p>
        </motion.div>
      </div>
    )}
  </AnimatePresence>
);
