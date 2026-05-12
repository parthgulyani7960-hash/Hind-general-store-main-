import React from 'react';
import { Menu } from 'lucide-react';
import AdminSidebar from './AdminSidebar';
import { cn } from '../../types';

interface AdminDashboardLayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  user: any;
  logout: () => void;
  adminTheme: string;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  getDisplayLabel: (tab: string) => string;
  stats: any;
}

export default function AdminDashboardLayout({ 
  children, activeTab, setActiveTab, user, logout, adminTheme, 
  sidebarOpen, setSidebarOpen, getDisplayLabel, stats 
}: AdminDashboardLayoutProps) {
  return (
    <div className={cn("min-h-screen bg-stone-50 flex", adminTheme)}>
      <AdminSidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        user={user}
        logout={logout}
        isOpen={sidebarOpen}
        setIsOpen={setSidebarOpen}
        lowStockCount={0} // Placeholder for now, handle in context or refactor later
        newUserCount={0}
      />

      <div className="flex-1 min-w-0 flex flex-col h-screen overflow-hidden">
        <header className="h-20 bg-white/80 backdrop-blur-xl border-b border-stone-200 flex items-center justify-between px-6 lg:px-12 sticky top-0 z-40">
          <div className="flex items-center space-x-6">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 hover:bg-stone-50 rounded-xl text-stone-400 transition-colors"
            >
              <Menu size={24} />
            </button>
            <h2 className="text-xl font-black text-stone-900 tracking-tight hidden sm:block">
              {getDisplayLabel(activeTab)}
            </h2>
          </div>

          <div className="flex items-center space-x-3 bg-emerald-50 px-4 py-2 rounded-2xl border border-emerald-100 shadow-sm">
            <div className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </div>
            <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">
              {stats?.activeUsers || 0} Customer(s) Online
            </span>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto h-full w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
