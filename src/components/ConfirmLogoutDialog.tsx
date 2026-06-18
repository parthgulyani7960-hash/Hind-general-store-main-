import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { LogOut, AlertTriangle, X } from 'lucide-react';
import { triggerFeedback } from '@/lib/feedback';

interface ConfirmLogoutDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export default function ConfirmLogoutDialog({ isOpen, onClose, onConfirm }: ConfirmLogoutDialogProps) {
  useEffect(() => {
    if (isOpen) {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          onClose();
        }
      };

      const handleCustomClose = () => {
        onClose();
      };

      window.addEventListener('keydown', handleKeyDown);
      window.addEventListener('close-all-modals', handleCustomClose);

      return () => {
        window.removeEventListener('keydown', handleKeyDown);
        window.removeEventListener('close-all-modals', handleCustomClose);
      };
    }
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-stone-900/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl relative z-10"
          >
            <div className="flex items-center gap-3 text-amber-600 mb-4">
              <AlertTriangle className="w-8 h-8" />
              <h2 className="text-xl font-bold text-stone-900">Sign Out?</h2>
            </div>
            <p className="text-stone-600 mb-6 text-sm">
              Are you sure you want to sign out? Your session details will be cleared, and you'll need to sign in again to access your account features.
            </p>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 py-3 rounded-xl border border-stone-200 text-stone-700 font-bold hover:bg-stone-50 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={() => { triggerFeedback('heavy'); onConfirm(); onClose(); }}
                className="flex-1 py-3 rounded-xl bg-slate-900 text-white font-bold hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
