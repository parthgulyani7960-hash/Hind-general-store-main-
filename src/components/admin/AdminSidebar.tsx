import React from 'react';
import { LayoutDashboard, ShoppingBag, Package, Users, Settings, Truck, TrendingUp, LogOut } from 'lucide-react';
import { cn } from '../../types';

const menuItems = [
  { name: 'Overview', icon: LayoutDashboard },
  { name: 'Orders', icon: ShoppingBag },
  { name: 'Products', icon: Package },
  { name: 'Customers', icon: Users },
  { name: 'Logistics', icon: Truck },
  { name: 'Analytics', icon: TrendingUp },
  { name: 'Store Settings', icon: Settings },
];

interface AdminSidebarProps {
  activeTab: string;
  setActiveTab: (tab: any) => void;
  user: any;
  logout: () => void;
}

export default function AdminSidebar({ activeTab, setActiveTab, user, logout }: AdminSidebarProps) {
  return (
    <aside className="w-64 bg-stone-950 text-white min-h-screen p-6 flex flex-col flex-shrink-0">
      <div className="text-2xl font-black mb-10 tracking-tighter">APP ADMIN</div>
      <nav className="space-y-2 flex-1 overflow-y-auto pr-2">
        {menuItems.map((item) => (
          <button
            key={item.name}
            onClick={() => setActiveTab(item.name)}
            className={cn(
              "flex w-full items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-all",
              activeTab === item.name ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-stone-400 hover:bg-stone-800 hover:text-white"
            )}
          >
            <item.icon size={18} />
            <span>{item.name}</span>
          </button>
        ))}
      </nav>

      <div className="p-4 mt-auto border-t border-stone-800">
        <div className="flex items-center space-x-3 p-3 bg-stone-900 rounded-2xl border border-stone-800">
          <div className="w-10 h-10 rounded-xl bg-stone-800 border border-stone-700 flex items-center justify-center overflow-hidden shadow-sm shrink-0">
             <span className="text-primary font-black uppercase text-xs">{user?.name?.[0] || 'A'}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-white truncate">{user.name}</p>
            <p className="text-[10px] text-primary uppercase font-black tracking-wider">{user.role}</p>
          </div>
          <button onClick={logout} className="p-2 text-stone-500 hover:text-red-500 transition-colors" title="Logout">
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
}
