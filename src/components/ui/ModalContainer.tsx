import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ModalContainerProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  showHeader?: boolean;
}

/**
 * Reusable modal container component that enforces standards:
 * - Padding of 8 (p-8)
 * - Shadow (shadow-2xl)
 * - Rounded corners (rounded-[2.5rem])
 * - Smooth backdrop animations using Framer Motion
 * 
 * @param isOpen - Flag indicating visibility
 * @param onClose - Handler for shutting the dialog
 * @param title - Optional header text
 * @param children - Interactive inputs or layout markup
 * @param className - Optional additional custom classes
 * @param size - Optional sizing bounds
 * @param showHeader - Toggle display of standard close header
 */
export default function ModalContainer({
  isOpen,
  onClose,
  title,
  children,
  className,
  size = 'md',
  showHeader = true
}: ModalContainerProps) {
  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-5xl',
    full: 'max-w-full h-full sm:h-auto'
  };

  useEffect(() => {
    if (isOpen) {
      const originalStyle = window.getComputedStyle(document.body).overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalStyle;
      };
    }
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 md:p-10">
          {/* Backdrop Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-stone-900/60 backdrop-blur-md"
            onClick={onClose}
          />

          {/* Modal Card Pane */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className={cn(
              "bg-white rounded-[2.5rem] shadow-2xl relative z-10 w-full overflow-hidden border border-stone-100/50 flex flex-col max-h-full",
              sizeClasses[size],
              className
            )}
          >
            {/* Header section */}
            {showHeader && (title || onClose) && (
              <div className="px-8 pt-8 pb-4 flex items-center justify-between border-b border-stone-50 shrink-0">
                {title ? (
                  <h2 className="text-2xl font-black text-stone-900 tracking-tight">{title}</h2>
                ) : (
                  <div />
                )}
                <button
                  onClick={onClose}
                  className="p-3 bg-stone-50 hover:bg-stone-100 rounded-full transition-colors border border-stone-100/50 text-stone-500 hover:text-stone-900"
                >
                  <X size={18} />
                </button>
              </div>
            )}

            {/* Standard Body context */}
            <div className="flex-1 overflow-y-auto no-scrollbar">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
