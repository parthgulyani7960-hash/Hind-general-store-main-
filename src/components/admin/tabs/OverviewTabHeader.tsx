import React from 'react';
import { Calendar, RefreshCw } from 'lucide-react';
import { motion } from 'motion/react';

interface OverviewTabProps {
  fetchStats: () => void;
}

export default function OverviewTabHeader({ fetchStats }: OverviewTabProps) {
  return (
    <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2">
      <div>
        <h2 className="text-4xl font-black text-stone-900 tracking-tight">Dashboard Overview</h2>
        <p className="text-stone-500 mt-1 text-base font-medium">Quick summary of your store's current performance.</p>
      </div>
      <div className="flex items-center space-x-3">
        <div className="bg-white px-5 py-3 rounded-2xl border border-stone-200 shadow-sm flex items-center space-x-3">
          <Calendar size={18} className="text-stone-900" />
          <span className="text-xs font-black text-stone-700 tracking-tight uppercase tracking-widest">
            {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
          </span>
        </div>
        <motion.button 
          whileHover={{ rotate: 180 }}
          transition={{ duration: 0.5 }}
          onClick={fetchStats}
          className="p-3 bg-white border border-stone-200 rounded-2xl text-stone-400 hover:text-stone-900 hover:border-stone-900 transition-all shadow-sm active:scale-90"
        >
          <RefreshCw size={20} />
        </motion.button>
      </div>
    </header>
  );
}
