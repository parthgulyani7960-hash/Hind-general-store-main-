import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { 
  TrendingUp, 
  ShoppingBag, 
  PieChart as PieIcon, 
  BarChart3, 
  ArrowUpRight, 
  Package,
  Calendar
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { useStore } from '../StoreContext';
import { cn } from '../lib/utils';
import { fetchWithHandling } from '../lib/api';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function WholesaleInsights() {
  const { user } = useStore();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchWithHandling<any>(`/api/user/insights/${user.id}`)
        .then(data => {
          if (data) setData(data);
        })
        .finally(() => setLoading(false));
    }
  }, [user?.id]);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <div key={`skeleton-${i}`} className="h-32 bg-stone-100 rounded-3xl" />)}
        </div>
        <div className="grid grid-cols-2 gap-6">
          <div className="h-80 bg-stone-100 rounded-3xl" />
          <div className="h-80 bg-stone-100 rounded-3xl" />
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-[2rem] border border-stone-100 shadow-sm">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl w-fit mb-4">
            <TrendingUp size={20} />
          </div>
          <p className="text-stone-500 text-[10px] font-bold uppercase tracking-widest mb-1">Total Procurement</p>
          <h3 className="text-2xl font-black text-stone-900">₹{data.totalSpent?.toLocaleString()}</h3>
        </div>

        <div className="bg-white p-6 rounded-[2rem] border border-stone-100 shadow-sm">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl w-fit mb-4">
            <ShoppingBag size={20} />
          </div>
          <p className="text-stone-500 text-[10px] font-bold uppercase tracking-widest mb-1">Total Orders</p>
          <h3 className="text-2xl font-black text-stone-900">{data.orderCount}</h3>
        </div>

        <div className="bg-white p-6 rounded-[2rem] border border-stone-100 shadow-sm">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl w-fit mb-4">
            <Calendar size={20} />
          </div>
          <p className="text-stone-500 text-[10px] font-bold uppercase tracking-widest mb-1">Khata Balance</p>
          <h3 className="text-2xl font-black text-stone-900">₹{user?.khata_balance?.toLocaleString() || 0}</h3>
        </div>

        <div className="bg-stone-900 p-6 rounded-[2rem] border border-stone-800 text-white">
          <div className="p-3 bg-white/10 text-white rounded-2xl w-fit mb-4">
            <BarChart3 size={20} />
          </div>
          <p className="text-stone-400 text-[10px] font-bold uppercase tracking-widest mb-1">Total Savings</p>
          <h3 className="text-2xl font-black text-white">₹{Math.round(data.totalSavings || 0).toLocaleString()}</h3>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-[2.5rem] border border-stone-100 shadow-sm">
          <h3 className="text-lg font-black text-stone-900 mb-8">Procurement Trend</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.spendingHistory}>
                <defs>
                  <linearGradient id="colorSpent" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 600, fill: '#94a3b8' }} 
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 600, fill: '#94a3b8' }}
                  tickFormatter={(val) => `₹${val}`}
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  itemStyle={{ fontWeight: 800, color: '#10b981' }}
                />
                <Area type="monotone" dataKey="amount" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorSpent)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] border border-stone-100 shadow-sm">
          <h3 className="text-lg font-black text-stone-900 mb-8">Category Breakdown</h3>
          <div className="h-64 flex flex-col sm:flex-row items-center">
            <div className="w-full sm:w-1/2 h-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.categoryBreakdown}
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {data.categoryBreakdown.map((_: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '16px', border: 'none' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="w-full sm:w-1/2 space-y-3 mt-4 sm:mt-0">
              {data.categoryBreakdown.slice(0, 5).map((item: any, index: number) => (
                <div key={item.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                    <span className="font-bold text-stone-600">{item.name}</span>
                  </div>
                  <span className="font-black text-stone-900">₹{item.value.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Top Products */}
      <div className="bg-white p-8 rounded-[2.5rem] border border-stone-100 shadow-sm">
        <h3 className="text-lg font-black text-stone-900 mb-6">Most Purchased</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.topProducts?.map((product: any, idx: number) => (
            <div key={`top-product-${idx}`} className="flex items-center p-3 bg-stone-50 rounded-2xl border border-stone-100">
              <img src={product.image_url} alt={product.name} className="w-12 h-12 rounded-xl object-cover mr-4" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-stone-900 truncate">{product.name}</p>
                <p className="text-[10px] text-stone-400 font-bold uppercase">{product.total_qty} Units</p>
              </div>
              <p className="text-xs font-black text-primary">₹{product.total_spent.toLocaleString()}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
