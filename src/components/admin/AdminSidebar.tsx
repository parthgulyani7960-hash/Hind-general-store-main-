import React, { useState } from 'react';
import { 
  LayoutDashboard, ShoppingBag, Package, Users, Settings, Truck, TrendingUp, LogOut, Menu, X, Megaphone,
  CreditCard, MessageSquare, Ticket, UserCog, LifeBuoy, Mail, DollarSign, Activity, AlertTriangle, 
  Percent, ToggleLeft, Briefcase, RotateCcw, ClipboardList, Bug, ShieldAlert, BookOpen
} from 'lucide-react';
import { cn } from '../../types';

const menuItems = [
  { name: 'Overview', icon: LayoutDashboard },
  { name: 'Analytics', icon: TrendingUp },
  { name: 'Announcements', icon: Megaphone },
  { name: 'Orders', icon: ShoppingBag },
  { name: 'Logistics', icon: Truck },
  { name: 'Product Catalog', icon: Package },
  { name: 'Categories', icon: BookOpen },
  { name: 'Customers', icon: Users },
  { name: 'Wallet Requests', icon: CreditCard },
  { name: 'Reviews', icon: MessageSquare },
  { name: 'Coupons', icon: Ticket },
  { name: 'Roles', icon: UserCog },
  { name: 'Support Tickets', icon: LifeBuoy },
  { name: 'Newsletter', icon: Mail },
  { name: 'Expenses', icon: DollarSign },
  { name: 'Store Settings', icon: Settings },
  { name: 'Payment Settings', icon: CreditCard },
  { name: 'System Status', icon: Activity },
  { name: 'Suspicious Activities', icon: ShieldAlert },
  { name: 'Promotions', icon: Megaphone },
  { name: 'Bulk Discounts', icon: Percent },
  { name: 'Feature Toggles', icon: ToggleLeft },
  { name: 'Suppliers', icon: Briefcase },
  { name: 'Returns', icon: RotateCcw },
  { name: 'Audit Logs', icon: ClipboardList },
  { name: 'Bug Reports', icon: Bug },
];

interface AdminSidebarProps {
  activeTab: string;
  setActiveTab: (tab: any) => void;
  user: any;
  logout: () => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

export default function AdminSidebar({ activeTab, setActiveTab, user, logout, isOpen, setIsOpen }: AdminSidebarProps) {
  return (
    <>
      <button 
        className="md:hidden p-4 text-white z-50 fixed top-4 left-4 bg-stone-900 rounded-lg"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X /> : <Menu />}
      </button>

      <aside className={cn(
        "fixed inset-y-0 left-0 z-40 w-64 bg-stone-950 text-white p-6 flex flex-col flex-shrink-0 transition-transform duration-300 ease-in-out md:relative md:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="text-2xl font-black mb-10 tracking-tighter md:mt-0 mt-16">APP ADMIN</div>
        <nav className="space-y-2 flex-1 overflow-y-auto pr-2">
          {menuItems.map((item) => (
            <button
              key={item.name}
              onClick={() => { setActiveTab(item.name); if (window.innerWidth < 768) setIsOpen(false); }}
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
    </>
  );
}
