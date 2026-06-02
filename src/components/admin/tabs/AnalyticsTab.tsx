import React, { useState } from 'react';
import { 
  PieChart as PieChartIcon, Calendar, RefreshCw, Printer, 
  IndianRupee, ShoppingBag, Zap, Wallet, TrendingUp, 
  Sparkles, AlertTriangle, ArrowRight, Clock, Users,
  CheckCircle2, Download
} from 'lucide-react';
import { motion } from 'motion/react';
import { 
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
    ResponsiveContainer, BarChart, Bar, Cell, PieChart, Pie
} from 'recharts';
import { cn } from '@/lib/utils';
import ExportTriggerButton from '@/components/admin/ExportTriggerButton';
import AdminStatCard from '@/components/admin/AdminStatCard';

interface AnalyticsTabProps {
    stats: any;
    analyticsData: any;
    salesAnalytics: any;
    lowStockProducts: any[];
    expiringSoon: any[];
    isFetchingAnalytics: boolean;
    analyticsStartDate: string;
    setAnalyticsStartDate: (val: string) => void;
    analyticsEndDate: string;
    setAnalyticsEndDate: (val: string) => void;
    analyticsCategory: string;
    setAnalyticsCategory: (val: string) => void;
    categories: any[];
    setActiveTab: (val: string) => void;
    setProductSearchTerm: (val: string) => void;
}

const AnalyticsTab: React.FC<AnalyticsTabProps> = ({
    stats,
    analyticsData,
    salesAnalytics,
    lowStockProducts,
    expiringSoon,
    isFetchingAnalytics,
    analyticsStartDate,
    setAnalyticsStartDate,
    analyticsEndDate,
    setAnalyticsEndDate,
    analyticsCategory,
    setAnalyticsCategory,
    categories,
    setActiveTab,
    setProductSearchTerm
}) => {
    const [showWeeklyComparison, setShowWeeklyComparison] = useState(false);

    const getWeeklyComparisonData = () => {
        if (!salesAnalytics?.weeklyComparison) return [];
        return salesAnalytics.weeklyComparison;
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Intel Dashboard Header */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
              <div className="space-y-1">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary rotate-3">
                    <PieChartIcon size={24} />
                  </div>
                  <h2 className="text-4xl font-black text-stone-900 tracking-tight">Sales Reports</h2>
                </div>
                <p className="text-stone-500 font-medium text-lg ml-1">View detailed reports of your store&apos;s sales.</p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center bg-white p-1.5 rounded-2xl shadow-sm border border-stone-100">
                  <div className="flex items-center px-4 space-x-2 border-r border-stone-100">
                    <Calendar size={14} className="text-stone-400" />
                    <input 
                      type="date" 
                      value={analyticsStartDate}
                      onChange={(e) => setAnalyticsStartDate(e.target.value)}
                      className="bg-transparent border-none p-0 text-[10px] font-black uppercase tracking-widest focus:ring-0 w-24 outline-none"
                    />
                    <span className="text-stone-300 text-[10px]">→</span>
                    <input 
                      type="date" 
                      value={analyticsEndDate}
                      onChange={(e) => setAnalyticsEndDate(e.target.value)}
                      className="bg-transparent border-none p-0 text-[10px] font-black uppercase tracking-widest focus:ring-0 w-24 outline-none"
                    />
                  </div>
                  <button 
                    onClick={() => {
                      setAnalyticsStartDate('');
                      setAnalyticsEndDate('');
                    }}
                    className="p-2 text-stone-300 hover:text-primary transition-colors"
                  >
                    <RefreshCw size={14} className={isFetchingAnalytics ? "animate-spin" : ""} />
                  </button>
                </div>

                <div className="flex bg-white p-1.5 rounded-2xl shadow-sm border border-stone-100">
                   <select 
                    value={analyticsCategory}
                    onChange={(e) => setAnalyticsCategory(e.target.value)}
                    className="bg-transparent border-none text-[10px] font-black uppercase tracking-widest focus:ring-0 pr-8 outline-none appearance-none cursor-pointer"
                  >
                    <option value="all">Global</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.name}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                <ExportTriggerButton type="analytics" onClick={() => {}} />

                <button 
                  className="bg-stone-900 text-white px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center space-x-3 shadow-xl shadow-stone-900/20 hover:bg-black transition-all active:scale-95"
                  onClick={() => window.print()}
                >
                  <Printer size={18} />
                  <span>Generate Report</span>
                </button>
              </div>
            </div>

            {/* Top Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <AdminStatCard 
                label="Gross Revenue"
                value={`₹${(analyticsData?.totalSales || 0).toLocaleString()}`}
                icon={<IndianRupee size={20} />}
                trend={{ value: '+12.4%', isUp: true }}
                color="emerald"
                progress={80}
              />
              <AdminStatCard 
                label="Fulfilled Orders"
                value={analyticsData?.totalOrders || 0}
                icon={<ShoppingBag size={20} />}
                trend={{ value: 'Active', isUp: true, color: 'text-primary' }}
                color="primary"
                progress={55}
              />
              <AdminStatCard 
                label="Conversion Rate"
                value="4.2%"
                icon={<Zap size={20} />}
                trend={{ value: 'High', isUp: true, color: 'text-blue-500' }}
                color="blue"
                progress={40}
              />
              <AdminStatCard 
                label="Inventory Value"
                value={`₹${(analyticsData?.inventoryData?.total_cost || 0).toLocaleString()}`}
                icon={<Wallet size={20} />}
                trend={{ value: 'Focus', isUp: false, color: 'text-amber-500' }}
                color="amber"
                progress={85}
              />
            </div>

            {/* Daily Trends & Product Analytics */}
            {salesAnalytics && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-stone-100 group transition-all hover:shadow-xl hover:shadow-stone-200/20">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                    <div>
                      <h3 className="text-xl font-black text-stone-900 tracking-tight">Revenue Velocity</h3>
                      <p className="text-xs text-stone-400 mt-1">
                        {showWeeklyComparison ? "Last week vs This week performance comparison" : "30-day transactional throughput"}
                      </p>
                    </div>
                  </div>
                  <div className="h-80 min-h-[320px] w-full" style={{ minWidth: "1px", minHeight: "1px" }}>
                    <ResponsiveContainer width="99%" height={320} minWidth={0} minHeight={0}>
                      <AreaChart 
                        data={showWeeklyComparison ? getWeeklyComparisonData() : salesAnalytics.dailySales} 
                        margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                      >
                        <defs>
                          <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis 
                          dataKey={showWeeklyComparison ? "day" : "date"} 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
                          dy={10}
                        />
                        <YAxis 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
                        />
                        <Tooltip />
                        <Area 
                            type="monotone" 
                            dataKey="revenue" 
                            stroke="#1c1917" 
                            strokeWidth={4} 
                            fillOpacity={1} 
                            fill="url(#colorTotal)" 
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-stone-100">
                    <h3 className="text-xl font-black text-stone-900 tracking-tight mb-8">Category Mix</h3>
                    <div className="h-80 w-full" style={{ minWidth: "1px", minHeight: "1px" }}>
                         <ResponsiveContainer width="99%" height={320} minWidth={0} minHeight={0}>
                            <PieChart>
                                <Pie
                                    data={analyticsData?.categorySales || []}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={100}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {(analyticsData?.categorySales || []).map((entry: any, index: number) => (
                                        <Cell key={`cell-${index}`} fill={['#1c1917', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'][index % 5]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                         </ResponsiveContainer>
                    </div>
                </div>
              </div>
            )}
        </div>
    );
};

export default AnalyticsTab;
