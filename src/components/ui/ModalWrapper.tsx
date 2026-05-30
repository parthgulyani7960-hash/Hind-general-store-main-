import React from 'react';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';

interface ModalWrapperProps {
  title: string;
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

/**
 * A reusable modal component with consistent styling.
 * @param title - The title of the modal.
 * @param isOpen - Whether the modal is open.
 * @param onClose - Function to close the modal.
 * @param children - The content of the modal.
 */
export default function ModalWrapper({ title, isOpen, onClose, children }: ModalWrapperProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-stone-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="bg-white rounded-[2rem] shadow-2xl p-6 w-full max-w-lg relative z-10 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-black text-stone-900">{title}</h2>
          <button onClick={onClose} className="p-2 hover:bg-stone-100 rounded-xl transition-all">
            <X size={20} className="text-stone-500" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
