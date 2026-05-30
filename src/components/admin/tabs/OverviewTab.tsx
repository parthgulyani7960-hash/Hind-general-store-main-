import React from 'react';
import { IndianRupee, ShoppingBag, Activity, Users, ArrowUpRight } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '@/types';

interface OverviewTabProps {
    stats: any;
    setActiveTab: (tab: string) => void;
    refreshStats: () => Promise<void>;
}

export default function OverviewTab({ stats, setActiveTab, refreshStats }: OverviewTabProps) {
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const metrics = [
    { label: 'Total Revenue', value: `₹${stats?.netRevenue || 0}`, icon: <IndianRupee size={24} />, trend: '+12.5%', color: 'emerald', key: 'revenue' },
    { label: 'Pending Orders', value: stats?.pendingOrders || 0, icon: <ShoppingBag size={24} />, trend: '-2.4%', color: 'amber', key: 'orders' },
    { label: 'Online Customers', value: stats?.activeUsers || 0, icon: <Activity size={24} />, trend: 'Live', color: 'blue' },
    { label: 'New Customers', value: stats?.newUserCount || 0, icon: <Users size={24} />, trend: '+5.2%', color: 'purple' }
  ];

  const handleRefresh = async () => {
      setIsRefreshing(true);
      await refreshStats();
      setIsRefreshing(false);
  }

  return (
    <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="space-y-10"
    >
        <header className="mb-4 flex items-center justify-between">
            <div>
                <h1 className="text-4xl font-black text-stone-900 tracking-tighter">Dashboard Overview</h1>
                <p className="text-stone-500 font-medium mt-1">Here is a quick look at how your store is performing today.</p>
            </div>
            <button 
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="flex items-center gap-2 bg-stone-100 hover:bg-stone-200 text-stone-700 px-6 py-3 rounded-2xl text-xs font-bold uppercase tracking-widest transition-all"
            >
                {isRefreshing ? <Activity size={14} className="animate-spin" /> : <Activity size={14} />} 
                Refresh
            </button>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {metrics.map((stat, i) => (
                <motion.div 
                    key={stat.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1, duration: 0.4 }}
                    whileHover={{ y: -5 }}
                    className="bg-white p-8 rounded-[2rem] shadow-sm border border-stone-100 transition-all group hover:shadow-xl hover:shadow-stone-100"
                >
                    <div className="flex justify-between items-start mb-6">
                        <div className={cn(
                            "p-4 rounded-2xl transition-all duration-300",
                            stat.color === 'emerald' ? "bg-emerald-50 text-emerald-600" :
                            stat.color === 'amber' ? "bg-amber-50 text-amber-600" :
                            stat.color === 'blue' ? "bg-blue-50 text-blue-600" :
                            "bg-purple-50 text-purple-600"
                        )}>
                            {stat.icon}
                        </div>
                        {stat.trend && (
                            <span className={cn(
                                "flex items-center gap-1 text-xs font-black uppercase tracking-widest px-2 py-1 rounded-full",
                                stat.trend.includes('+') ? "text-emerald-600 bg-emerald-50" : 
                                stat.trend === 'Live' ? "text-blue-600 bg-blue-50" : 
                                "text-red-500 bg-red-50"
                            )}>
                                {stat.trend} <ArrowUpRight size={10} />
                            </span>
                        )}
                    </div>
                    <p className="text-stone-400 text-xs font-black uppercase tracking-[0.2em] mb-1">{stat.label}</p>
                    <h3 className="text-3xl font-black text-stone-950 tracking-tighter">{stat.value}</h3>
                </motion.div>
            ))}
        </div>
    </motion.div>
  );
}
