import React, { useState, useEffect } from 'react';
import { Menu, Activity, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { fetchWithHandling } from '../../lib/api';
import { getAuthHeaders } from '../../lib/utils';
import AdminSidebar from './AdminSidebar';
import { cn } from '../../types';
import LoadingFallback from '../LoadingFallback';

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
  loading?: boolean;
}

export default function AdminDashboardLayout({ 
  children, activeTab, setActiveTab, user, logout, adminTheme, 
  sidebarOpen, setSidebarOpen, getDisplayLabel, stats, extraHeader, loading
}: AdminDashboardLayoutProps) {

  const navigate = useNavigate();
  const [healthStatus, setHealthStatus] = useState<'healthy' | 'warning' | 'critical' | 'offline'>('offline');
  const [isMinimized, setIsMinimized] = useState(false);
  
  useEffect(() => {
    if (user && user.role !== 'admin') {
      navigate('/');
    }
  }, [user, navigate]);
  
  // ... health check effect ...
  useEffect(() => {
    let mounted = true;
    const checkHealth = async () => {
      try {
        const data = await fetchWithHandling<any>('/api/admin/health-indicator', { headers: getAuthHeaders() });
        if (mounted && data) {
          setHealthStatus(data.status || 'offline');
        }
      } catch (err) {
        if (mounted) setHealthStatus('offline');
      }
    };
    checkHealth();
    const interval = setInterval(checkHealth, 30000); // Check every 30s
    return () => { mounted = false; clearInterval(interval); };
  }, []);

  const healthColors = {
    healthy: 'bg-emerald-50 border-emerald-100 text-emerald-700 marker:bg-emerald-500',
    warning: 'bg-amber-50 border-amber-100 text-amber-700 marker:bg-amber-500',
    critical: 'bg-red-50 border-red-100 text-red-700 marker:bg-red-500',
    offline: 'bg-stone-50 border-stone-100 text-stone-500 marker:bg-stone-500',
  };
  const healthColorStr = healthColors[healthStatus];

  return (
    <div className={cn("h-screen bg-stone-50 flex overflow-hidden", adminTheme)}>
      <AdminSidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        user={user}
        logout={logout}
        isOpen={sidebarOpen}
        setIsOpen={setSidebarOpen}
        lowStockCount={stats?.lowStock || 0} 
        newUserCount={stats?.newUserCount || 0}
        isMinimized={isMinimized}
      />

      <div className="flex-1 min-w-0 flex flex-col h-full overflow-hidden relative">
        <header className="h-24 bg-white border-b border-stone-100 flex items-center justify-between px-6 md:px-10 sticky top-0 z-40 w-full">
          <div className="flex items-center space-x-4 md:space-x-6">
            <button
              onClick={() => {
                if (window.innerWidth >= 1024) {
                   setIsMinimized(!isMinimized);
                } else {
                   setSidebarOpen(!sidebarOpen);
                }
              }}
              className="p-3 hover:bg-stone-50 rounded-2xl text-stone-900 transition-all active:scale-95 border border-stone-200 hover:border-stone-400 shadow-sm relative z-[110]"
              id="admin-menu-toggle"
              aria-label="Toggle Dashboard Menu"
            >
              <Menu size={24} strokeWidth={2.5} />
            </button>
            <h1 className="text-xl md:text-3xl font-black text-stone-950 tracking-tighter truncate max-w-[200px] md:max-w-none">
              {getDisplayLabel(activeTab)}
            </h1>
          </div>
          
          <div className="flex items-center gap-6">
            <button 
               onClick={() => setActiveTab('System Status')}
               className="flex items-center gap-3 bg-stone-50 border border-stone-100 px-5 py-2.5 rounded-full font-bold text-xs uppercase tracking-wider text-stone-600 hover:bg-stone-100 hover:border-stone-200 transition-all cursor-pointer"
               title="View System Health"
            >
               <div className={cn("w-2 h-2 rounded-full animate-pulse", 
                 healthStatus === 'healthy' ? 'bg-emerald-500' : 
                 healthStatus === 'warning' ? 'bg-amber-500' : 
                 healthStatus === 'critical' ? 'bg-red-500' : 'bg-stone-400'
               )}></div>
               <span className="font-black text-stone-700">{healthStatus}</span>
            </button>
            <div className="h-10 w-px bg-stone-100" />
            <button 
               onClick={() => {
                 setActiveTab('Product Catalog');
                 toast.success('Switched to Products. Click "+ Add Product" to create new.');
               }}
               className="flex items-center gap-3 bg-stone-900 text-white px-6 py-3 rounded-2xl font-black text-sm hover:bg-stone-850 hover:shadow-lg transition-all active:scale-95"
            >
               <Sparkles size={18} className="text-amber-400" />
               <span>New Action</span>
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto w-full p-8">
            <div className="max-w-[1600px] mx-auto space-y-8">
                {loading ? <LoadingFallback fullScreen={false} message="Loading dashboard..." /> : children}
            </div>
        </main>
      </div>
    </div>
  );
}
