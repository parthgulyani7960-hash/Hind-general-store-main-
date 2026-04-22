import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { 
  TrendingUp, 
  ShoppingBag, 
  PieChart as PieIcon, 
  BarChart3, 
  ArrowUpRight, 
  ArrowDownRight,
  Package,
  Calendar
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, Legend
} from 'recharts';
import { useStore } from '../../StoreContext';
import { cn } from '../../lib/utils';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function SpendingInsights() {
  const { user } = useStore();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInsights();
  }, [user?.id]);

  const fetchInsights = async () => {
    if (!user) return;
    try {
      const res = await fetch(`/api/user/insights/${user.id}`);
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error('Failed to fetch insights', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-8 pb-12">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-6 rounded-[2rem] border border-stone-100 shadow-sm"
        >
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
              <TrendingUp size={24} />
            </div>
          </div>
          <p className="text-stone-500 text-xs font-bold uppercase tracking-widest mb-1">Total Spent</p>
          <h3 className="text-3xl font-black text-stone-900 mb-2">₹{data.totalSpent?.toLocaleString()}</h3>
          <div className="flex items-center text-xs font-bold text-emerald-600">
            <ArrowUpRight size={14} className="mr-1" />
            <span>+12.5% from last month</span>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white p-6 rounded-[2rem] border border-stone-100 shadow-sm"
        >
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
              <ShoppingBag size={24} />
            </div>
          </div>
          <p className="text-stone-500 text-xs font-bold uppercase tracking-widest mb-1">Total Orders</p>
          <h3 className="text-3xl font-black text-stone-900 mb-2">{data.orderCount}</h3>
          <div className="flex items-center text-xs font-bold text-blue-600">
            <Package size={14} className="mr-1" />
            <span>Avg. ₹{(data.totalSpent / data.orderCount).toFixed(0)} / order</span>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white p-6 rounded-[2rem] border border-stone-100 shadow-sm"
        >
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl">
              <Calendar size={24} />
            </div>
          </div>
          <p className="text-stone-500 text-xs font-bold uppercase tracking-widest mb-1">Current Khata</p>
          <h3 className="text-3xl font-black text-stone-900 mb-2">₹{user?.khata_balance?.toLocaleString() || 0}</h3>
          <div className="flex items-center text-xs font-bold text-stone-400">
             <span>Limit: ₹{user?.credit_limit?.toLocaleString() || 10000}</span>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-stone-900 p-6 rounded-[2rem] border border-stone-800 text-white shadow-xl shadow-stone-200"
        >
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-white/10 text-white rounded-2xl">
              <BarChart3 size={24} />
            </div>
          </div>
          <p className="text-stone-400 text-[10px] font-bold uppercase tracking-widest mb-1">Savings</p>
          <h3 className="text-3xl font-black text-white mb-2">₹{data.totalSavings?.toLocaleString() || 0}</h3>
          <p className="text-[10px] text-stone-500 font-medium italic">Via bulk discounts & coupons</p>
        </motion.div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Spending Trend */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-stone-100 shadow-sm">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-xl font-black text-stone-900">Spending Trend</h3>
            <select className="bg-stone-50 border-none rounded-xl text-xs font-bold py-2 px-3 outline-none">
              <option>Last 6 Months</option>
              <option>Last Year</option>
            </select>
          </div>
          <div className="h-80 w-full">
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
                  dy={10}
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
                <Area 
                  type="monotone" 
                  dataKey="amount" 
                  stroke="#10b981" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorSpent)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-stone-100 shadow-sm">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-xl font-black text-stone-900">Category Breakdown</h3>
            <PieIcon className="text-stone-300" size={20} />
          </div>
          <div className="h-80 w-full flex flex-col md:flex-row items-center">
            <div className="h-full w-full md:w-2/3">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.categoryBreakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {data.categoryBreakdown.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="w-full md:w-1/3 space-y-4">
              {data.categoryBreakdown.map((item: any, index: number) => (
                <div key={item.name} className="flex flex-col">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center space-x-2">
                       <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                       <span className="text-xs font-bold text-stone-700">{item.name}</span>
                    </div>
                    <span className="text-xs font-black text-stone-900">₹{item.value.toLocaleString()}</span>
                  </div>
                  <div className="w-full h-1 bg-stone-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full transition-all duration-1000" 
                      style={{ 
                        width: `${(item.value / data.totalSpent) * 100}%`,
                        backgroundColor: COLORS[index % COLORS.length]
                      }} 
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Top Purchased Products */}
      <div className="bg-white p-8 rounded-[2.5rem] border border-stone-100 shadow-sm">
        <h3 className="text-xl font-black text-stone-900 mb-8">Top Purchased Products</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {data.topProducts.map((product: any, idx: number) => (
            <div key={idx} className="flex items-center p-4 bg-stone-50 rounded-3xl border border-stone-100 group hover:bg-white hover:border-primary/20 transition-all cursor-default">
              <div className="w-16 h-16 rounded-2xl overflow-hidden mr-4 shrink-0 shadow-sm">
                <img src={product.image_url} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-black text-stone-900 truncate">{product.name}</h4>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">{product.total_qty} units bought</span>
                  <span className="text-xs font-black text-primary">₹{product.total_spent.toLocaleString()}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
