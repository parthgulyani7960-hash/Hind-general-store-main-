import React from 'react';
import { IndianRupee, ShoppingBag, Activity, Users } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../../../types';

interface OverviewMetricsGridProps {
  stats: any;
}

export default function OverviewMetricsGrid({ stats }: OverviewMetricsGridProps) {
  const metrics = [
    { label: 'Total Revenue', value: `₹${stats?.netRevenue || 0}`, icon: <IndianRupee size={22} />, trend: '', color: 'emerald', key: 'revenue' },
    { label: 'Pending Orders', value: stats?.pendingOrders || 0, icon: <ShoppingBag size={22} />, trend: '', color: 'amber', key: 'orders' },
    { label: 'Online Customers', value: stats?.activeUsers || 0, icon: <Activity size={22} />, trend: 'Live', color: 'blue' },
    { label: 'New Customers', value: stats?.newUserCount || 0, icon: <Users size={22} />, trend: '', color: 'purple' }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {metrics.map((stat, i) => (
        <motion.div 
          key={i}
          variants={{
            hidden: { opacity: 0, y: 20 },
            show: { opacity: 1, y: 0 }
          }}
          whileHover={{ y: -5 }}
          className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-stone-100 transition-all group relative overflow-hidden"
        >
          <div className="flex justify-between items-start mb-6">
            <div className={cn(
              "p-4 rounded-2xl transition-all duration-300",
              stat.color === 'emerald' ? "bg-emerald-50 text-emerald-600" :
              stat.color === 'amber' ? "bg-amber-50 text-amber-600" :
              "bg-stone-50 text-stone-900"
            )}>
              {stat.icon}
            </div>
            <span className={cn(
              "text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-lg border",
              stat.trend === 'Live' ? "bg-emerald-50 text-emerald-600 border-emerald-100 animate-pulse" :
              "bg-stone-50 text-stone-400 border-stone-100"
            )}>
              {stat.trend || 'Updated'}
            </span>
          </div>
          <p className="text-stone-400 text-[10px] font-black uppercase tracking-[0.2em] mb-1">{stat.label}</p>
          <h3 className="text-3xl font-black text-stone-900 tracking-tighter">{stat.value}</h3>
        </motion.div>
      ))}
    </div>
  );
}
