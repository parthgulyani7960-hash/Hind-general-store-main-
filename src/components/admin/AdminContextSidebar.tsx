import React from 'react';
import { CreditCard, Activity, Settings, ChevronRight } from 'lucide-react';
import { cn } from '@/types';

interface AdminContextSidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const contextItems = [
  { name: 'Payments', label: 'Payments', icon: CreditCard },
  { name: 'System Logs', label: 'Activity Logs', icon: Activity },
  { name: 'Store Settings', label: 'General Settings', icon: Settings },
];

export default function AdminContextSidebar({ activeTab, setActiveTab }: AdminContextSidebarProps) {
  // Only show context sidebar if active tab is one of the target tabs
  const isActiveContext = contextItems.some(item => item.name === activeTab);
  
  if (!isActiveContext) return null;

  return (
    <aside className="w-64 bg-white border-r border-stone-100 flex flex-col py-6 px-4">
      <h3 className="px-4 text-xs font-black text-stone-300 uppercase tracking-[0.25em] mb-4">
        Admin Context
      </h3>
      <div className="space-y-1">
        {contextItems.map((item) => {
          const isActive = activeTab === item.name;
          return (
            <button
              key={item.name}
              onClick={() => setActiveTab(item.name)}
              className={cn(
                "group flex w-full items-center justify-between px-4 py-3 rounded-2xl text-xs font-bold transition-all duration-300",
                isActive 
                  ? "bg-stone-900 text-white shadow-lg" 
                  : "text-stone-500 hover:bg-stone-50 hover:text-stone-900"
              )}
            >
              <div className="flex items-center space-x-3">
                <item.icon size={16} />
                <span>{item.label}</span>
              </div>
              {isActive && <ChevronRight size={16} />}
            </button>
          );
        })}
      </div>
    </aside>
  );
}
