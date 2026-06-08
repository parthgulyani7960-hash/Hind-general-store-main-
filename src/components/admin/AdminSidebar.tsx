import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LayoutDashboard, ShoppingBag, Package, Users, Settings, Truck, TrendingUp, LogOut, Menu, X, Megaphone, Bell,
  CreditCard, MessageSquare, Ticket, UserCog, LifeBuoy, Mail, DollarSign, Activity, AlertTriangle, 
  Percent, ToggleLeft, Briefcase, RotateCcw, ClipboardList, Bug, ShieldAlert, BookOpen, Shield, PackagePlus,
  Terminal, ShieldCheck
} from 'lucide-react';
import { cn } from '@/types';

const menuGroups = [
  {
    label: 'Overview',
    items: [
      { name: 'Overview', label: 'Dashboard', icon: LayoutDashboard },
      { name: 'Analytics', label: 'Sales Reports', icon: TrendingUp },
      { name: 'Announcements', label: 'Announcements', icon: Megaphone },
      { name: 'Notifications', label: 'Notifications', icon: Bell },
    ]
  },
  {
    label: 'Store Operations',
    items: [
      { name: 'Orders', label: 'Orders', icon: ShoppingBag },
      { name: 'Product Catalog', label: 'Products', icon: Package },
      { name: 'Categories', label: 'Categories', icon: BookOpen },
      { name: 'Logistics', label: 'Delivery', icon: Truck },
      { name: 'Order Batching', label: 'Order Batching', icon: ClipboardList },
      { name: 'Suppliers', label: 'Suppliers', icon: Briefcase },
      { name: 'Returns', label: 'Returns', icon: RotateCcw },
      { name: 'Purchase Orders', label: 'Purchase Orders', icon: PackagePlus },
    ]
  },
  {
    label: 'Finance',
    items: [
      { name: 'Wallet Requests', label: 'Wallet Top-ups', icon: CreditCard },
      { name: 'Payments', label: 'Payment Sync', icon: CreditCard },
      { name: 'Coupons', label: 'Coupons', icon: Ticket },
      { name: 'Bulk Discounts', label: 'Bulk Pricing', icon: Percent },
      { name: 'Expenses', label: 'Expenses', icon: DollarSign },
    ]
  },
  {
    label: 'Support',
    items: [
      { name: 'Customers', label: 'Customers', icon: Users },
      { name: 'Reviews', label: 'Reviews', icon: MessageSquare },
      { name: 'Support Tickets', label: 'Support', icon: LifeBuoy },
      { name: 'Newsletter', label: 'Newsletter', icon: Mail },
    ]
  },
  {
    label: 'System',
    items: [
      { name: 'Admin Management', label: 'Admin Ops', icon: Shield },
      { name: 'Store Settings', label: 'Settings', icon: Settings },
      { name: 'System Status', label: 'System Health', icon: Activity },
      { name: 'Suspicious Activities', label: 'Risk Manager', icon: ShieldAlert },
      { name: 'Audit Logs', label: 'Activity Logs', icon: ClipboardList },
      { name: 'Security & Data', label: 'Security & Data', icon: Shield },
      { name: 'Security Audit', label: 'Security Audit', icon: ShieldCheck },
      { name: 'Automatic Reports', label: 'Anomalies', icon: Bug },
      { name: 'Diagnostic Console', label: 'Diagnostic Panel', icon: Terminal },
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
  isMinimized: boolean;
}

/**
 * AdminSidebar manages the main navigation for the admin panel,
 * displaying menu groups, stock alerts, and profile actions.
 * 
 * @param activeTab - The currently active tab name.
 * @param setActiveTab - Callback for updating the active tab.
 * @param user - Current user object.
 * @param logout - Callback for handling user logout.
 * @param isOpen - Whether the navigation panel is visible (mobile).
 * @param setIsOpen - Callback for toggling the sidebar visibility.
 * @param lowStockCount - Numerical count of products with low stock.
 * @param newUserCount - Numerical count of new user registrations.
 * @param isMinimized - Whether the sidebar is in a minimized collapsed state (desktop).
 */
export default function AdminSidebar({ activeTab, setActiveTab, user, logout, isOpen, setIsOpen, lowStockCount = 0, newUserCount = 0, isMinimized }: AdminSidebarProps) {
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, setIsOpen]);

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
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      <aside 
        role="dialog"
        aria-modal={isOpen ? "true" : "false"}
        aria-label="Admin Navigation Panel"
        className={cn(
          "fixed inset-y-0 left-0 z-[100] bg-white border-r border-stone-200 flex flex-col transition-all duration-300 md:sticky md:translate-x-0 h-screen",
          isMinimized ? "w-20" : "w-64",
          isOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full md:translate-x-0"
        )}
      >
        <div className={cn("p-6 pb-4 flex-1 flex flex-col min-h-0", isMinimized && "items-center")}>
          <div className={cn("flex items-center justify-between mb-6", isMinimized ? "flex-col gap-4" : "px-2")}>
            <div className={cn("flex items-center space-x-3", isMinimized && "justify-center")}>
              <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white shadow-xl shadow-primary/20 transform rotate-3 animate-pulse">
                <span className="font-black text-xl">H</span>
              </div>
              {!isMinimized && (
                <div>
                  <h1 className="text-xl font-black text-stone-900 leading-none tracking-tight">Hind Admin</h1>
                  <p className="text-xs font-bold text-stone-400 uppercase tracking-widest mt-1">Management Dashboard</p>
                </div>
              )}
            </div>
            
            {!isMinimized && (
              <button
                onClick={() => setIsOpen(false)}
                className="md:hidden p-2 text-stone-400 hover:text-stone-900 hover:bg-stone-100 rounded-xl transition-all duration-200 active:scale-95"
                aria-label="Close sidebar menu"
              >
                <X size={18} />
              </button>
            )}
          </div>

          <div className={cn("space-y-8 overflow-y-auto no-scrollbar", isMinimized && "items-center")}>
            {menuGroups.map((group) => (
              <div key={group.label} className={cn("space-y-3", isMinimized && "flex flex-col items-center")}>
                {!isMinimized && <h3 className="px-4 text-xs font-black text-stone-300 uppercase tracking-[0.25em]">{group.label}</h3>}
                <div className="space-y-1 w-full">
                  {group.items.map((item) => {
                    const isActive = activeTab === item.name;
                    return (
                      <motion.button
                        key={item.name}
                        whileHover={{ x: isMinimized ? 0 : 4 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={(e) => { 
                          e.preventDefault();
                          if (item.name === 'Diagnostic Console') {
                            window.dispatchEvent(new Event('open-diagnostic-console'));
                            if (window.innerWidth < 768) setIsOpen(false);
                            return;
                          }
                          setActiveTab(item.name); 
                          if (window.innerWidth < 768) setIsOpen(false); 
                        }}
                        className={cn(
                          "group flex w-full items-center px-4 py-3 rounded-2xl text-xs font-bold transition-all duration-300 relative overflow-hidden",
                          isMinimized ? "justify-center" : "justify-between",
                          isActive 
                            ? "bg-stone-900 text-white shadow-lg shadow-stone-900/10" 
                            : "text-stone-500 hover:bg-stone-50 hover:text-stone-900"
                        )}
                      >
                        <div className={cn("flex items-center relative z-10", !isMinimized && "space-x-3")}>
                          <item.icon size={18} className={cn("transition-transform duration-300", isActive ? "scale-110" : "group-hover:scale-110")} />
                          {!isMinimized && <span>{item.label}</span>}
                        </div>
                        {!isMinimized && (item.name === 'Product Catalog' && lowStockCount > 0) && (
                          <span className={cn(
                            "text-xs font-black px-2 py-0.5 rounded-full transition-colors relative z-10",
                            isActive ? "bg-white text-stone-900" : "bg-red-50 text-red-500"
                          )}>
                            {lowStockCount}
                          </span>
                        )}
                        {!isMinimized && (item.name === 'Customers' && newUserCount > 0) && (
                          <span className={cn(
                            "text-xs font-black px-2 py-0.5 rounded-full transition-colors relative z-10",
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

        <div className={cn("p-6 border-t border-stone-100 bg-white", isMinimized && "flex flex-col items-center")}>
          <div className={cn("bg-stone-50 rounded-[2rem] p-4 border border-stone-100", isMinimized ? "w-16 h-16 flex items-center justify-center p-0" : "w-full")}>
            {isMinimized ? (
                <div className="w-10 h-10 rounded-xl bg-white border border-stone-200 flex items-center justify-center font-black text-stone-900">{user?.name?.[0] || 'A'}</div>
            ) : (
                <>
                <div className="flex items-center space-x-3 mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-white border border-stone-200 p-0.5 overflow-hidden shadow-sm">
                        <div className="w-full h-full rounded-xl bg-stone-100 flex items-center justify-center">
                          <span className="text-stone-900 font-black uppercase text-base">{user?.name?.[0] || 'A'}</span>
                        </div>
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-black text-stone-900 truncate tracking-tight">{user?.name || 'Admin'}</p>
                        <div className="flex items-center space-x-1">
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          <p className="text-xs text-stone-400 font-bold uppercase tracking-wider">Store Manager</p>
                        </div>
                    </div>
                </div>
                <button 
                  onClick={logout}
                  className="w-full flex items-center justify-center space-x-2 py-3 bg-white border border-stone-200 rounded-xl text-stone-500 text-xs font-black uppercase tracking-widest hover:text-red-500 hover:border-red-100 hover:bg-red-50 transition-all duration-300 shadow-sm"
                >
                  <LogOut size={14} />
                  <span>Logout</span>
                </button>
                </>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
