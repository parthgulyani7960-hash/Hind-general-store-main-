import React from 'react';
import { Info } from 'lucide-react';
import toast from 'react-hot-toast';

export default function InfoButton({ title, message }: { title: string, message: string }) {
  return (
    <button
      type="button"
      onClick={() => toast.success(`${title}: ${message}`, { icon: 'ℹ️' })}
      className="p-1 rounded-full text-stone-400 hover:text-primary transition-colors"
    >
      <Info size={16} />
    </button>
  );
}
