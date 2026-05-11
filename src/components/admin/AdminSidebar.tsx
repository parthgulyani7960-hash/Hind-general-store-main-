import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LayoutDashboard, ShoppingBag, Package, Users, Settings, Truck, TrendingUp, LogOut, Menu, X, Megaphone,
  CreditCard, MessageSquare, Ticket, UserCog, LifeBuoy, Mail, DollarSign, Activity, AlertTriangle, 
  Percent, ToggleLeft, Briefcase, RotateCcw, ClipboardList, Bug, ShieldAlert, BookOpen
} from 'lucide-react';
import { cn } from '../../types';

const menuGroups = [
  {
    label: 'Store Management',
    items: [
      { name: 'Overview', label: 'Dashboard Overview', icon: LayoutDashboard },
      { name: 'Analytics', label: 'Business Analytics', icon: TrendingUp },
      { name: 'Announcements', label: 'Store Announcements', icon: Megaphone },
    ]
  },
  {
    label: 'Inventory & Orders',
    items: [
      { name: 'Orders', label: 'Order Management', icon: ShoppingBag },
      { name: 'Product Catalog', label: 'Product Catalog', icon: Package },
      { name: 'Categories', label: 'Product Categories', icon: BookOpen },
      { name: 'Logistics', label: 'Delivery & Shipping', icon: Truck },
      { name: 'Suppliers', label: 'Suppliers & Vendors', icon: Briefcase },
      { name: 'Returns', label: 'Returns & Refunds', icon: RotateCcw },
    ]
  },
  {
    label: 'Accounts & Finance',
    items: [
      { name: 'Wallet Requests', label: 'Wallet Top-ups', icon: CreditCard },
      { name: 'Coupons', label: 'Discount Coupons', icon: Ticket },
      { name: 'Bulk Discounts', label: 'Bulk Price Rules', icon: Percent },
      { name: 'Expenses', label: 'Shop Expenses', icon: DollarSign },
    ]
  },
  {
    label: 'Customers & Support',
    items: [
      { name: 'Customers', label: 'Customer Base', icon: Users },
      { name: 'Reviews', label: 'Customer Reviews', icon: MessageSquare },
      { name: 'Support Tickets', label: 'Support Center', icon: LifeBuoy },
      { name: 'Newsletter', label: 'Newsletter Hub', icon: Mail },
    ]
  },
  {
    label: 'Settings & System',
    items: [
      { name: 'Store Settings', label: 'Store Configuration', icon: Settings },
      { name: 'System Status', label: 'System Health', icon: Activity },
      { name: 'Suspicious Activities', label: 'Security Alerts', icon: ShieldAlert },
      { name: 'Audit Logs', label: 'Activity Logs', icon: ClipboardList },
      { name: 'Bug Reports', label: 'Reported Issues', icon: Bug },
    ]
  }
];

interface AdminSidebarProps {
  activeTab: string;
  setActiveTab: (tab: any) => void;
  user: any;
  logout: () => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  lowStockCount?: number;
  newUserCount?: number;
}

export default function AdminSidebar({ activeTab, setActiveTab, user, logout, isOpen, setIsOpen, lowStockCount = 0, newUserCount = 0 }: AdminSidebarProps) {
  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm z-40 md:hidden"
          />
        )}
      </AnimatePresence>

      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-stone-200 flex flex-col transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] md:sticky md:translate-x-0 h-screen",
        isOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
      )}>
        <div className="p-8 pb-4 flex-1 flex flex-col min-h-0">
          <div className="flex items-center space-x-3 mb-8 px-2">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white shadow-xl shadow-primary/20 transform rotate-3">
              <span className="font-black text-xl">H</span>
            </div>
            <div>
              <h1 className="text-xl font-black text-stone-900 leading-none tracking-tight">Hind Admin</h1>
              <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mt-1">Management Dashboard</p>
            </div>
          </div>

          <div className="space-y-8 overflow-y-auto no-scrollbar pr-2 -mr-2">
            {menuGroups.map((group) => (
              <div key={group.label} className="space-y-3">
                <h3 className="px-4 text-[10px] font-black text-stone-300 uppercase tracking-[0.25em]">{group.label}</h3>
                <div className="space-y-1">
                  {group.items.map((item) => {
                    const isActive = activeTab === item.name;
                    return (
                      <motion.button
                        key={item.name}
                        whileHover={{ x: 4 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => { 
                          setActiveTab(item.name); 
                          if (window.innerWidth < 768) setIsOpen(false); 
                        }}
                        className={cn(
                          "group flex w-full items-center justify-between px-4 py-3 rounded-2xl text-xs font-bold transition-all duration-300 relative overflow-hidden",
                          isActive 
                            ? "bg-stone-900 text-white shadow-lg shadow-stone-900/10" 
                            : "text-stone-500 hover:bg-stone-50 hover:text-stone-900"
                        )}
                      >
                        <div className="flex items-center space-x-3 relative z-10">
                          <item.icon size={18} className={cn("transition-transform duration-300", isActive ? "scale-110" : "group-hover:scale-110")} />
                          <span>{item.label}</span>
                        </div>
                        {item.name === 'Product Catalog' && lowStockCount > 0 && (
                          <span className={cn(
                            "text-[9px] font-black px-2 py-0.5 rounded-full transition-colors relative z-10",
                            isActive ? "bg-white text-stone-900" : "bg-red-50 text-red-500"
                          )}>
                            {lowStockCount}
                          </span>
                        )}
                        {item.name === 'Customers' && newUserCount > 0 && (
                          <span className={cn(
                            "text-[9px] font-black px-2 py-0.5 rounded-full transition-colors relative z-10",
                            isActive ? "bg-white text-stone-900" : "bg-emerald-50 text-emerald-500"
                          )}>
                            {newUserCount}
                          </span>
                        )}
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-6 border-t border-stone-100 bg-white">
          <div className="bg-stone-50 rounded-[2rem] p-4 border border-stone-100">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-white border border-stone-200 p-0.5 overflow-hidden shadow-sm">
                <div className="w-full h-full rounded-xl bg-stone-100 flex items-center justify-center">
                  <span className="text-stone-900 font-black uppercase text-base">{user?.name?.[0] || 'A'}</span>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-black text-stone-900 truncate tracking-tight">{user.name}</p>
                <div className="flex items-center space-x-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <p className="text-[10px] text-stone-400 font-bold uppercase tracking-wider">Store Manager</p>
                </div>
              </div>
            </div>
            <button 
              onClick={logout}
              className="w-full flex items-center justify-center space-x-2 py-3 bg-white border border-stone-200 rounded-xl text-stone-500 text-[10px] font-black uppercase tracking-widest hover:text-red-500 hover:border-red-100 hover:bg-red-50 transition-all duration-300 shadow-sm"
            >
              <LogOut size={14} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
