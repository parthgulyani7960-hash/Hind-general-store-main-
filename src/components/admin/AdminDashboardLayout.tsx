import React from 'react';
import { Menu } from 'lucide-react';
import AdminSidebar from './AdminSidebar';
import { cn } from '../../types';

interface AdminDashboardLayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: any) => void;
  user: any;
  logout: () => void;
  adminTheme: string;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  getDisplayLabel: (tab: any) => string;
  stats: any;
  extraHeader?: React.ReactNode;
}

export default function AdminDashboardLayout({ 
  children, activeTab, setActiveTab, user, logout, adminTheme, 
  sidebarOpen, setSidebarOpen, getDisplayLabel, stats, extraHeader
}: AdminDashboardLayoutProps) {
  return (
    <div className={cn("h-screen bg-stone-50 flex overflow-hidden", adminTheme)}>
      <AdminSidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        user={user}
        logout={logout}
        isOpen={sidebarOpen}
        setIsOpen={setSidebarOpen}
        lowStockCount={0} 
        newUserCount={0}
      />

      <div className="flex-1 min-w-0 flex flex-col h-full overflow-hidden">
        <header className="h-16 md:h-20 bg-white/80 backdrop-blur-xl border-b border-stone-200 flex items-center justify-between px-4 md:px-6 lg:px-10 shrink-0">
          <div className="flex items-center space-x-4 md:space-x-6">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 hover:bg-stone-50 rounded-xl text-stone-400 transition-colors"
            >
              <Menu size={20} />
            </button>
            <h2 className="text-lg md:text-xl font-black text-stone-900 tracking-tight hidden sm:block truncate">
              {getDisplayLabel(activeTab)}
            </h2>
          </div>

          <div className="flex-1 flex justify-center px-4 max-w-2xl mx-auto">
            {extraHeader}
          </div>

          <div className="flex items-center space-x-2 md:space-x-3 bg-emerald-50 px-3 md:px-4 py-1.5 md:py-2 rounded-2xl border border-emerald-100 shadow-sm shrink-0">
            <div className="relative flex h-1.5 w-1.5 md:h-2 md:w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 md:h-2 md:w-2 bg-emerald-500"></span>
            </div>
            <span className="text-[9px] md:text-[10px] font-black text-emerald-700 uppercase tracking-widest whitespace-nowrap">
              {stats?.activeUsers || 0} Online
            </span>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto w-full h-[calc(100vh-4rem)] md:h-[calc(100vh-5rem)] p-3 md:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
