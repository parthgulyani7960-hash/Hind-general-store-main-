import React from 'react';
import { IndianRupee, ShoppingBag, Activity, Users, Calendar } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../../../types';
import { 
  AreaChart, Area, CartesianGrid, Tooltip, ResponsiveContainer, XAxis, YAxis
} from 'recharts';

interface OverviewTabProps {
    stats: any;
    setActiveTab: (tab: string) => void;
}

export default function OverviewTab({ stats, setActiveTab }: OverviewTabProps) {
  const metrics = [
    { label: 'Total Revenue', value: `₹${stats?.netRevenue || 0}`, icon: <IndianRupee size={22} />, trend: '', color: 'emerald', key: 'revenue' },
    { label: 'Pending Orders', value: stats?.pendingOrders || 0, icon: <ShoppingBag size={22} />, trend: '', color: 'amber', key: 'orders' },
    { label: 'Online Customers', value: stats?.activeUsers || 0, icon: <Activity size={22} />, trend: 'Live', color: 'blue' },
    { label: 'New Customers', value: stats?.newUserCount || 0, icon: <Users size={22} />, trend: '', color: 'purple' }
  ];

  return (
    <div className="space-y-10">
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
                            stat.color === 'blue' ? "bg-blue-50 text-blue-600" :
                            "bg-purple-50 text-purple-600"
                        )}>
                            {stat.icon}
                        </div>
                    </div>
                    <p className="text-stone-400 text-[10px] font-black uppercase tracking-[0.2em] mb-1">{stat.label}</p>
                    <h3 className="text-3xl font-black text-stone-900 tracking-tighter">{stat.value}</h3>
                </motion.div>
            ))}
        </div>
    </div>
  );
}
