import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell, Legend } from 'recharts';
import { Activity, Clock, Zap, AlertCircle, RefreshCw, BarChart3, TrendingUp, Cpu, Trash2 } from 'lucide-react';
import { fetchWithHandling } from '@/lib/api';
import { cn, getAuthHeaders } from '@/lib/utils';
import toast from 'react-hot-toast';

interface TimeSeriesPoint {
  time: string;
  avgLatency: number;
  requests: number;
}

interface EndpointStat {
  endpoint: string;
  avgLatency: number;
  maxLatency: number;
  requests: number;
}

export default function PerformanceMonitorTab() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{ timeSeries: TimeSeriesPoint[], slowEndpoints: EndpointStat[] } | null>(null);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await fetchWithHandling('/api/admin/developer/performance-stats') as { success: boolean; timeSeries: TimeSeriesPoint[]; slowEndpoints: EndpointStat[] };
      if (res?.success) {
        setData(res);
      }
    } catch (err) {
      toast.error('Failed to load performance metrics');
    } finally {
      setLoading(false);
    }
  };

  const handlePurgeTraces = async () => {
    if (!confirm('This will permanently delete all historical API trace logs from the database. Performance charts will be reset. Proceed?')) return;
    
    setLoading(true);
    try {
      const res = await fetch('/api/admin/system-heal', {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ component: 'clear_traces' })
      });
      
      const data = await res.json();
      if (data.success) {
        toast.success('Performance data purged successfully');
        fetchStats();
      } else {
        toast.error(data.message || 'Failed to purge data');
      }
    } catch (err) {
      toast.error('Purge operation failed');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);

  if (loading && !data) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-4">
        <RefreshCw className="text-primary animate-spin" size={48} />
        <p className="text-stone-400 font-black uppercase tracking-widest text-xs">Calibrating performance telemetry...</p>
      </div>
    );
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-stone-900 border border-white/10 p-4 rounded-2xl shadow-2xl">
          <p className="text-[10px] font-black text-stone-500 uppercase tracking-widest mb-2">{label}</p>
          <div className="space-y-1">
            <p className="text-sm font-black text-emerald-400">
              Latency: {payload[0].value}ms
            </p>
            {payload[1] && (
              <p className="text-sm font-black text-blue-400">
                Volume: {payload[1].value} reqs
              </p>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-[2.5rem] border border-stone-100 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <BarChart3 className="text-primary" size={24} />
            <h2 className="text-2xl font-black text-stone-900 tracking-tight">Performance Monitor</h2>
          </div>
          <p className="text-stone-400 text-xs font-bold uppercase tracking-widest">Real-time API latency & throughput analytics</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={handlePurgeTraces}
            className="p-3 bg-red-50 text-red-600 rounded-2xl hover:bg-red-100 transition-all flex items-center gap-2"
            disabled={loading}
            title="Purge Trace Logs"
          >
            <Trash2 size={18} />
            <span className="text-[10px] font-black uppercase tracking-widest pr-1">Purge Logs</span>
          </button>
          
          <button 
            onClick={fetchStats}
            className="p-3 bg-stone-900 text-white rounded-2xl hover:bg-black transition-all flex items-center gap-2"
            disabled={loading}
          >
            <RefreshCw size={18} className={cn(loading && "animate-spin")} />
            <span className="text-[10px] font-black uppercase tracking-widest pr-2">Sync Telemetry</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Latency Chart */}
        <div className="lg:col-span-2 bg-white p-8 rounded-[3rem] border border-stone-100 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-black text-stone-900 flex items-center gap-2">
              <TrendingUp className="text-emerald-500" size={20} />
              Latency Trends (24h)
            </h3>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-[10px] font-black text-stone-500 uppercase tracking-tight">Avg Latency (ms)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-blue-500" />
                <span className="text-[10px] font-black text-stone-500 uppercase tracking-tight">Request Count</span>
              </div>
            </div>
          </div>

          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data?.timeSeries || []} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorLatency" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorRequests" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="time" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
                  dx={-10}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area 
                  type="monotone" 
                  dataKey="avgLatency" 
                  stroke="#10b981" 
                  strokeWidth={3} 
                  fillOpacity={1} 
                  fill="url(#colorLatency)" 
                  animationDuration={1500}
                />
                <Area 
                  type="monotone" 
                  dataKey="requests" 
                  stroke="#3b82f6" 
                  strokeWidth={3} 
                  fillOpacity={1} 
                  fill="url(#colorRequests)" 
                  animationDuration={1500}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quick Stats Cards */}
        <div className="space-y-6">
          <div className="bg-stone-900 text-white p-8 rounded-[3rem] shadow-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-[60px] rounded-full -mr-10 -mt-10 group-hover:bg-emerald-500/20 transition-all duration-700" />
            <h4 className="text-[10px] font-black text-stone-500 uppercase tracking-widest mb-4">Global Performance</h4>
            <div className="space-y-6 relative z-10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-black">{data?.timeSeries.reduce((acc, curr) => acc + curr.avgLatency, 0) ? Math.round(data.timeSeries.reduce((acc, curr) => acc + curr.avgLatency, 0) / data.timeSeries.length) : 0}<span className="text-sm font-bold text-stone-500 ml-1">ms</span></p>
                  <label className="text-[8px] font-black text-stone-400 uppercase tracking-widest">System Avg Latency</label>
                </div>
                <div className="p-3 bg-emerald-500/10 rounded-2xl">
                  <Zap className="text-emerald-500" size={24} />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-black">{data?.timeSeries.reduce((acc, curr) => acc + curr.requests, 0) || 0}</p>
                  <label className="text-[8px] font-black text-stone-400 uppercase tracking-widest">Total Traces (24h)</label>
                </div>
                <div className="p-3 bg-blue-500/10 rounded-2xl">
                  <Activity className="text-blue-500" size={24} />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-8 rounded-[3rem] border border-stone-100 shadow-sm">
            <h4 className="text-[10px] font-black text-stone-500 uppercase tracking-widest mb-6 flex items-center gap-2">
              <AlertCircle size={14} className="text-amber-500" />
              SLA Thresholds
            </h4>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-stone-600">Critical ({'>'}1000ms)</span>
                <span className="text-xs font-black text-red-500">
                  {data?.slowEndpoints.filter(e => e.avgLatency > 1000).length || 0} Endpoints
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-stone-600">Warning ({'>'}500ms)</span>
                <span className="text-xs font-black text-amber-500">
                  {data?.slowEndpoints.filter(e => e.avgLatency > 500 && e.avgLatency <= 1000).length || 0} Endpoints
                </span>
              </div>
              <div className="w-full bg-stone-100 h-1.5 rounded-full overflow-hidden mt-4">
                <div 
                  className="bg-emerald-500 h-full transition-all duration-1000" 
                  style={{ width: `${Math.max(0, 100 - ((data?.slowEndpoints.filter(e => e.avgLatency > 500).length || 0) / (data?.slowEndpoints.length || 1) * 100))}%` }} 
                />
              </div>
              <p className="text-[8px] font-black text-stone-400 uppercase text-center mt-2 tracking-widest">System Health: {Math.max(0, 100 - ((data?.slowEndpoints.filter(e => e.avgLatency > 500).length || 0) / (data?.slowEndpoints.length || 1) * 100)).toFixed(1)}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Slow Endpoints List */}
      <div className="bg-white p-8 rounded-[3rem] border border-stone-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-lg font-black text-stone-900 flex items-center gap-2">
            <Cpu className="text-primary" size={20} />
            Resource-Intensive Endpoints
          </h3>
          <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest bg-stone-50 px-3 py-1 rounded-full border border-stone-100">Sorted by Avg Latency</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left border-b border-stone-100">
                <th className="pb-4 text-[10px] font-black text-stone-400 uppercase tracking-widest">Endpoint Path</th>
                <th className="pb-4 text-[10px] font-black text-stone-400 uppercase tracking-widest">Avg Latency</th>
                <th className="pb-4 text-[10px] font-black text-stone-400 uppercase tracking-widest">Max Latency</th>
                <th className="pb-4 text-[10px] font-black text-stone-400 uppercase tracking-widest">Traffic</th>
                <th className="pb-4 text-[10px] font-black text-stone-400 uppercase tracking-widest">Load Profile</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-50">
              {data?.slowEndpoints.map((endpoint, i) => (
                <tr key={i} className="group hover:bg-stone-50/50 transition-all">
                  <td className="py-4">
                    <p className="text-sm font-black text-stone-900 truncate max-w-[300px]">{endpoint.endpoint}</p>
                  </td>
                  <td className="py-4">
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "text-sm font-black",
                        endpoint.avgLatency > 1000 ? "text-red-500" : endpoint.avgLatency > 500 ? "text-amber-500" : "text-emerald-500"
                      )}>
                        {endpoint.avgLatency}ms
                      </span>
                    </div>
                  </td>
                  <td className="py-4 font-mono text-xs text-stone-500">{endpoint.maxLatency}ms</td>
                  <td className="py-4 font-bold text-stone-400 text-sm">{endpoint.requests} reqs</td>
                  <td className="py-4">
                    <div className="w-24 bg-stone-100 h-1.5 rounded-full overflow-hidden">
                      <div 
                        className={cn(
                          "h-full transition-all duration-1000",
                          endpoint.avgLatency > 1000 ? "bg-red-500" : endpoint.avgLatency > 500 ? "bg-amber-500" : "bg-emerald-500"
                        )}
                        style={{ width: `${Math.min(100, (endpoint.avgLatency / 2000) * 100)}%` }}
                      />
                    </div>
                  </td>
                </tr>
              ))}
              {!data?.slowEndpoints.length && (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-stone-400 text-xs font-bold uppercase tracking-widest">No endpoint data captured yet</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
