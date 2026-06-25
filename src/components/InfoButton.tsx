import React from 'react';
import { HelpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface InfoButtonProps {
  content: string;
  title?: string;
  className?: string;
}

export default function InfoButton({ content, title, className }: InfoButtonProps) {
  const [show, setShow] = React.useState(false);

  return (
    <div className="relative inline-block ml-1 align-middle">
      <button 
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        onClick={() => setShow(!show)}
        className={cn("text-stone-300 hover:text-primary transition-colors cursor-help p-0.5", className)}
      >
        <HelpCircle size={14} />
      </button>

      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 5, scale: 0.95 }}
            className="absolute z-[1000] bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-4 bg-stone-900 text-white rounded-2xl shadow-2xl border border-stone-800 pointer-events-none"
          >
            {title && <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-2 border-b border-stone-800 pb-1">{title}</p>}
            <p className="text-xs font-medium leading-relaxed opacity-90">{content}</p>
            <div className="absolute top-full left-1/2 -translate-x-1/2 w-3 h-3 bg-stone-900 rotate-45 -mt-1.5 border-r border-b border-stone-800" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}
