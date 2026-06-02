import React from 'react';
import { 
  IndianRupee, ShoppingBag, Activity, Users, ArrowUpRight, TrendingUp,
  Zap, PackagePlus, Megaphone, ShieldCheck, Shield, Wallet, Download
} from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '@/types';
import { 
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
    ResponsiveContainer
} from 'recharts';
import AdminStatCard from '@/components/admin/AdminStatCard';
import { StatSkeleton } from '@/components/ui/Skeleton';
import OverviewTabHeader from './OverviewTabHeader';

interface OverviewTabProps {
    stats: any;
    setActiveTab: (tab: any) => void;
    refreshStats: (silent?: boolean) => Promise<void>;
    loading: boolean;
    setExportModal: (modal: any) => void;
    setShowAddProduct: (show: boolean) => void;
    setNotificationModal: (modal: any) => void;
}

export default function OverviewTab({ 
  stats, 
  setActiveTab, 
  refreshStats, 
  loading, 
  setExportModal,
  setShowAddProduct,
  setNotificationModal
}: OverviewTabProps) {

  const revenueData = React.useMemo(() => {
    return stats?.revenueByDay || [];
  }, [stats]);

  const ExportTriggerButton = ({ type }: { type: 'orders' | 'products' | 'users' | 'audit' | 'expenses' | 'analytics' }) => (
    <button
      onClick={() => setExportModal({ open: true, type })}
      className="flex items-center space-x-3 bg-white border border-stone-200 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest text-stone-500 hover:text-stone-950 hover:border-stone-950 transition-all active:scale-95 shadow-sm"
    >
      <Download size={14} strokeWidth={3} />
      <span>Export Intel</span>
    </button>
  );

  return (
    <motion.div 
        initial="hidden"
        animate="show"
        variants={{
          hidden: { opacity: 0 },
          show: {
            opacity: 1,
            transition: {
              staggerChildren: 0.05
            }
          }
        }}
        className="space-y-10"
    >
        <OverviewTabHeader fetchStats={refreshStats} />

        {/* Global Export Engine */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
           <div className="lg:col-span-1 bg-stone-900 rounded-[2.5rem] p-8 text-white flex flex-col justify-between">
              <div>
                <h3 className="text-2xl font-black tracking-tight">Intelligence Reporting</h3>
                <p className="text-stone-400 text-sm mt-1">Enterprise-grade data extraction & audit protocols.</p>
              </div>
              <div className="mt-8 space-y-4">
                <div className="flex items-center space-x-3 text-emerald-400 text-[10px] font-black uppercase tracking-widest bg-emerald-400/10 p-3 rounded-2xl">
                  <Activity size={14} className="animate-pulse" />
                  <span>Extraction Engine Online</span>
                </div>
              </div>
           </div>
           <div className="lg:col-span-2 bg-white rounded-[2.5rem] p-8 border border-stone-100 flex items-center justify-center">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full">
                <ExportTriggerButton type="users" />
                <ExportTriggerButton type="orders" />
                <ExportTriggerButton type="products" />
              </div>
           </div>
        </div>

        {/* Core Operational metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {loading ? (
            [...Array(4)].map((_, i) => <StatSkeleton key={i} />)
          ) : [
            { label: 'Total Revenue', value: `₹${stats?.netRevenue || 0}`, icon: <IndianRupee size={22} />, trend: { value: '+12%', isUp: true }, color: 'emerald' as const, key: 'revenue', progress: 85 },
            { label: 'Pending Orders', value: stats?.pendingOrders || 0, icon: <ShoppingBag size={22} />, trend: { value: 'Critical', isUp: false }, color: 'amber' as const, key: 'orders', progress: 40 },
            { label: 'Online Customers', value: stats?.activeUsers || 0, icon: <Activity size={22} />, trend: { value: 'Live', isUp: true, color: 'text-blue-500' }, color: 'blue' as const, progress: 65 },
            { label: 'New Customers', value: stats?.newUserCount || 0, icon: <Users size={22} />, trend: { value: '+24', isUp: true }, color: 'purple' as const, progress: 30 }
          ].map((stat) => {
            const { key, ...rest } = stat;
            return (
              <AdminStatCard
                key={key || stat.label}
                {...(rest as any)}
                onClick={() => {
                  if (key === 'revenue') setActiveTab('Analytics');
                  if (key === 'orders') setActiveTab('Orders');
                }}
              />
            );
          })}
        </div>

        <section className="bg-stone-50 p-10 rounded-[3rem] border border-dashed border-stone-200">
           <div className="flex items-center space-x-4 mb-8">
              <div className="p-3 bg-stone-900 text-white rounded-2xl shadow-xl shadow-stone-900/10">
                <Zap size={24} />
              </div>
              <div>
                 <h3 className="text-2xl font-black text-stone-900 tracking-tight">Rapid Directives</h3>
                 <p className="text-stone-500 font-medium">Bypass menus and execute primary operational shortcuts.</p>
              </div>
           </div>

           <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
              {[
                { label: 'New Product', action: () => { setActiveTab('Product Catalog'); setShowAddProduct(true); }, icon: PackagePlus, color: 'text-stone-900' },
                { label: 'New Broadcast', action: () => { setActiveTab('Announcements'); setNotificationModal({ open: true }); }, icon: Megaphone, color: 'text-emerald-500' },
                { label: 'Security Audit', action: () => setActiveTab('Audit Logs'), icon: ShieldCheck, color: 'text-blue-500' },
                { label: 'Admin Ops', action: () => setActiveTab('Admin Management'), icon: Shield, color: 'text-red-500' },
                { label: 'Status Feed', action: () => setActiveTab('System Status'), icon: Activity, color: 'text-amber-500' },
                { label: 'Wallet Flows', action: () => setActiveTab('Wallet Requests'), icon: Wallet, color: 'text-purple-500' }
              ].map((btn, i) => (
                <motion.button 
                  key={i}
                  whileHover={{ scale: 1.05, y: -4 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={btn.action}
                  className="bg-white p-6 rounded-[2rem] border border-stone-100 shadow-sm flex flex-col items-center justify-center space-y-4 hover:shadow-xl hover:shadow-stone-200 transition-all group"
                >
                   <div className={cn("p-4 rounded-2xl bg-stone-50 group-hover:bg-stone-900 group-hover:text-white transition-all", btn.color)}>
                     <btn.icon size={22} />
                   </div>
                   <span className="text-[10px] font-black uppercase text-stone-400 tracking-widest group-hover:text-stone-900 transition-colors">{btn.label}</span>
                </motion.button>
              ))}
           </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Performance Analytics */}
          <motion.div
            variants={{ hidden: { opacity: 0, x: -20 }, show: { opacity: 1, x: 0 } }}
            className="lg:col-span-2 bg-white p-10 rounded-[3rem] shadow-sm border border-stone-100 space-y-8"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-black text-stone-900 tracking-tight">Revenue & Sales</h3>
                <p className="text-xs text-stone-400 font-bold uppercase tracking-widest mt-1">Growth over the last 30 days</p>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-emerald-500 rounded-full" />
                <span className="text-[10px] font-black text-stone-500 uppercase tracking-widest">Normal Growth</span>
              </div>
            </div>
            <div className="h-72 w-full min-h-72">
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <AreaChart data={revenueData}>
                  <defs>
                    <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#1c1917" stopOpacity={0.05}/>
                      <stop offset="95%" stopColor="#1c1917" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="5 5" vertical={false} stroke="#f5f5f4" />
                  <XAxis 
                    dataKey="date" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fontSize: 10, fill: '#a8a29e', fontWeight: 900}} 
                    tickFormatter={(v) => (typeof v === 'string' && v.length >= 5) ? v.slice(5) : v}
                  />
                  <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#a8a29e', fontWeight: 900}} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '1.5rem', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '1rem' }}
                    itemStyle={{ fontWeight: 900, color: '#1c1917' }}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#1c1917" strokeWidth={4} fillOpacity={1} fill="url(#revenueGradient)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Maintenance & Health */}
          <motion.div
            variants={{ hidden: { opacity: 0, x: 20 }, show: { opacity: 1, x: 0 } }}
            className="bg-stone-900 rounded-[3rem] p-10 text-white space-y-8 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl pointer-events-none" />
            <div className="relative z-10 flex items-center justify-between">
              <h3 className="text-xl font-black tracking-tight">System Status</h3>
              <Activity size={20} className="text-emerald-500 animate-pulse" />
            </div>

            <div className="space-y-4 relative z-10">
              {[
                { label: 'Site Performance', status: 'Healthy', delay: 42 },
                { label: 'Order Processing', status: 'Active', delay: 8 },
                { label: 'Database Status', status: 'Stable', delay: 0 }
              ].map((sys, i) => (
                <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center justify-between backdrop-blur-sm">
                  <div className="flex flex-col">
                    <span className="text-xs font-black text-white/40 uppercase tracking-widest">{sys.label}</span>
                    <span className="text-xs font-bold text-white mt-0.5">{sys.status}</span>
                  </div>
                  <span className="text-xs font-black font-mono text-emerald-500">{sys.delay}ms</span>
                </div>
              ))}
            </div>

            <div className="pt-6 border-t border-white/10 space-y-4 relative z-10">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-white/40 uppercase tracking-widest">Network Alert Feed</span>
                <button onClick={() => setActiveTab('System Status')} className="text-xs font-black text-emerald-500 hover:underline">Full Trace</button>
              </div>
              <div className="space-y-3">
                {stats?.recentActivities?.slice(0, 2).map((log: any) => (
                  <div key={log.id} className="flex items-start space-x-3">
                    <div className={cn("w-1.5 h-1.5 rounded-full mt-1.5 shrink-0", log.level === 'error' ? "bg-red-500" : "bg-white/20")} />
                    <p className="text-xs font-medium text-white/70 line-clamp-2 leading-relaxed">{log.message}</p>
                  </div>
                ))}
              </div>
            </div>

            <button 
              onClick={() => setActiveTab('Audit Logs')}
              className="w-full relative z-10 py-4 bg-emerald-500 text-stone-900 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-emerald-400 transition-all active:scale-95 shadow-xl shadow-emerald-500/20"
            >
               Access Activity Stream
            </button>
          </motion.div>
        </div>
    </motion.div>
  );
}

