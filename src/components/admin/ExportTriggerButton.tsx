import React from 'react';
import { Download } from 'lucide-react';

interface ExportTriggerButtonProps {
    type: 'orders' | 'products' | 'users' | 'audit' | 'expenses' | 'analytics';
    onClick: (type: any) => void;
    disabled?: boolean;
}

const ExportTriggerButton: React.FC<ExportTriggerButtonProps> = ({ type, onClick, disabled }) => (
    <button 
      onClick={() => onClick(type)}
      disabled={disabled}
      className="flex items-center justify-center space-x-3 bg-stone-50 hover:bg-stone-100 border border-stone-200/60 text-stone-600 px-6 py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50 group font-sans h-full w-full"
    >
      <div className="p-2.5 bg-white rounded-xl shadow-sm group-hover:scale-110 transition-transform">
        <Download size={16} />
      </div>
      <span>Export {type}</span>
    </button>
);

export default ExportTriggerButton;
