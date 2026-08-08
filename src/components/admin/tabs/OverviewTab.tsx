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
    healthStatus?: 'healthy' | 'warning' | 'critical' | 'offline';
    systemLogs?: any[];
}

export default function OverviewTab({ 
  stats, 
  setActiveTab, 
  refreshStats, 
  loading, 
  setExportModal,
  setShowAddProduct,
  setNotificationModal,
  healthStatus = 'offline',
  systemLogs = []
}: OverviewTabProps) {

  const revenueData = React.useMemo(() => {
    return stats?.revenueByDay || [];
  }, [stats]);

  const ExportTriggerButton = ({ type, label }: { type: 'orders' | 'products' | 'users' | 'audit' | 'expenses' | 'analytics', label: string }) => (
    <button
      onClick={() => setExportModal({ open: true, type })}
      className="flex items-center space-x-2 bg-white border border-stone-200 px-4 py-2 rounded-xl text-xs font-bold text-stone-600 hover:text-stone-900 hover:border-stone-900 transition-all active:scale-95 shadow-sm"
    >
      <Download size={14} />
      <span>{label}</span>
    </button>
  );

  return (
    <div className="max-w-full overflow-x-hidden pb-10 pr-2">
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
        className="max-w-full overflow-x-hidden space-y-6 pb-10"
    >
        <OverviewTabHeader fetchStats={refreshStats} />

        {/* Compact Export Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-stone-100 shadow-sm">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <p className="text-xs font-bold text-stone-700">Data Extraction Engine</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <ExportTriggerButton type="users" label="Export Customers" />
            <ExportTriggerButton type="orders" label="Export Orders" />
            <ExportTriggerButton type="products" label="Export Products" />
          </div>
        </div>

        {/* Core Operational metrics Grid */}
        <motion.div 
          variants={{
            hidden: { opacity: 0 },
            show: {
              opacity: 1,
              transition: {
                staggerChildren: 0.1
              }
            }
          }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
        >
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
        </motion.div>

        <section className="bg-white p-6 rounded-2xl border border-stone-100 shadow-sm">
           <div className="flex items-center space-x-3 mb-4">
              <Zap size={18} className="text-stone-900" />
              <h3 className="text-base font-bold text-stone-900">Quick Actions</h3>
           </div>

           <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {[
                { label: 'New Product', action: () => { setActiveTab('Product Catalog'); setShowAddProduct(true); }, icon: PackagePlus, color: 'bg-stone-100 text-stone-900' },
                { label: 'New Broadcast', action: () => { setActiveTab('Announcements'); setNotificationModal({ open: true }); }, icon: Megaphone, color: 'bg-emerald-50 text-emerald-600' },
                { label: 'Security Audit', action: () => setActiveTab('Audit Logs'), icon: ShieldCheck, color: 'bg-blue-50 text-blue-600' },
                { label: 'Admin Ops', action: () => setActiveTab('Admin Management'), icon: Shield, color: 'bg-red-50 text-red-600' },
                { label: 'Status Feed', action: () => setActiveTab('System Status'), icon: Activity, color: 'bg-amber-50 text-amber-600' },
                { label: 'Wallet Flows', action: () => setActiveTab('Wallet Requests'), icon: Wallet, color: 'bg-purple-50 text-purple-600' }
              ].map((btn, i) => (
                <button 
                  key={i}
                  onClick={btn.action}
                  className="bg-stone-50 hover:bg-stone-100/80 p-3.5 rounded-xl flex items-center space-x-3 transition-all text-left group border border-transparent hover:border-stone-200"
                >
                   <div className={cn("p-2 rounded-lg shrink-0 transition-colors", btn.color)}>
                     <btn.icon size={16} />
                   </div>
                   <span className="text-xs font-bold text-stone-700 group-hover:text-stone-900 transition-colors">{btn.label}</span>
                </button>
              ))}
           </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           {/* Performance Analytics */}
           <motion.div
            variants={{ hidden: { opacity: 0, x: -20 }, show: { opacity: 1, x: 0 } }}
            className="lg:col-span-2 bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-stone-100 space-y-6"
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
            <div className="h-72 w-full min-h-[288px] relative">
              {revenueData && revenueData.length > 0 ? (
                <ResponsiveContainer width="100%" height={288} minWidth={200} minHeight={200}>
                  <AreaChart data={revenueData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
              ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-stone-50 rounded-2xl border border-dashed border-stone-100">
                  <p className="text-[10px] font-black uppercase tracking-widest text-stone-400">Awaiting Data Streams...</p>
                </div>
              )}
            </div>
          </motion.div>

          {/* Real State-Driven System Status */}
          <motion.div
            variants={{ hidden: { opacity: 0, x: 20 }, show: { opacity: 1, x: 0 } }}
            className="bg-stone-900 rounded-3xl p-6 md:p-8 text-white space-y-6 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl pointer-events-none" />
            <div className="relative z-10 flex items-center justify-between">
              <h3 className="text-xl font-black tracking-tight">System Status</h3>
              <Activity size={20} className={cn("animate-pulse", healthStatus === 'healthy' ? "text-emerald-500" : healthStatus === 'warning' ? "text-amber-500" : "text-red-500")} />
            </div>

            <div className="space-y-3 relative z-10">
              {[
                { 
                  label: 'API Gateway', 
                  status: healthStatus === 'healthy' ? 'Healthy' : healthStatus === 'warning' ? 'Degraded' : healthStatus === 'critical' ? 'Critical' : 'Offline', 
                  value: healthStatus === 'healthy' ? 'Active' : 'Unavailable',
                  color: healthStatus === 'healthy' ? 'text-emerald-400' : healthStatus === 'warning' ? 'text-amber-400' : 'text-red-500'
                },
                { 
                  label: 'Active Sessions', 
                  status: `${stats?.activeUsers || 1} live`, 
                  value: 'Connected', 
                  color: 'text-emerald-400' 
                },
                { 
                  label: 'Firestore Database', 
                  status: healthStatus !== 'offline' ? 'Connected' : 'Offline', 
                  value: healthStatus !== 'offline' ? 'Stable' : 'Offline', 
                  color: healthStatus !== 'offline' ? 'text-emerald-400' : 'text-red-500' 
                }
              ].map((sys, i) => (
                <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center justify-between backdrop-blur-sm">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">{sys.label}</span>
                    <span className="text-xs font-bold text-white mt-0.5">{sys.status}</span>
                  </div>
                  <span className={cn("text-xs font-black uppercase tracking-wider", sys.color)}>{sys.value}</span>
                </div>
              ))}
            </div>

            <div className="pt-6 border-t border-white/10 space-y-4 relative z-10">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-white/40 uppercase tracking-widest">Network Alert Feed</span>
                <button onClick={() => setActiveTab('System Status')} className="text-xs font-black text-emerald-500 hover:underline">Full Trace</button>
              </div>
              <div className="space-y-3">
                {systemLogs && systemLogs.length > 0 ? (
                  systemLogs.slice(0, 2).map((log: any, i: number) => (
                    <div key={log.id || i} className="flex items-start space-x-3">
                      <div className={cn("w-1.5 h-1.5 rounded-full mt-1.5 shrink-0", log.type === 'error' ? "bg-red-500" : "bg-white/20")} />
                      <p className="text-xs font-medium text-white/70 line-clamp-2 leading-relaxed">{log.message}</p>
                    </div>
                  ))
                ) : (
                  <div className="flex items-start space-x-3">
                    <div className="w-1.5 h-1.5 rounded-full mt-1.5 bg-white/20 shrink-0" />
                    <p className="text-xs font-medium text-white/40 leading-relaxed">No critical network alerts reported.</p>
                  </div>
                )}
              </div>
            </div>

            <button 
              onClick={() => setActiveTab('System Status')}
              className="w-full relative z-10 py-4 bg-emerald-500 text-stone-900 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-emerald-400 transition-all active:scale-95 shadow-xl shadow-emerald-500/20"
            >
               Access System Telemetry
            </button>
          </motion.div>
        </div>
    </motion.div>
    </div>
  );
}

