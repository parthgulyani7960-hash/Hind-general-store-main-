import React from 'react';
import { Plus, Truck, Activity, ShoppingBag, ArrowRight, Clock, CheckCircle2 } from 'lucide-react';
import { cn } from '@/types';
import { formatPhoneNumber } from '@/lib/utils';

interface LogisticsTabProps {
  orders: any[];
  runners: any[];
  setRunnerModal: (modal: { open: boolean; mode: 'add' | 'edit'; runner?: any }) => void;
  handleAssignRunner: (orderId: number, runnerId: number) => void;
}

export default function LogisticsTab({
  orders,
  runners,
  setRunnerModal,
  handleAssignRunner,
}: LogisticsTabProps) {
  return (
    <div className="h-full overflow-y-auto no-scrollbar space-y-8 pb-10 pr-2">
      <div className="flex justify-between items-center bg-white p-8 rounded-3xl shadow-sm border border-stone-100">
        <div>
          <h2 className="text-3xl font-black text-stone-900 tracking-tight">Logistics Hub</h2>
          <p className="text-stone-500 mt-1">Manage delivery runners and track active deliveries.</p>
        </div>
        <button 
          onClick={() => setRunnerModal({ open: true, mode: 'add' })}
          className="bg-primary text-white px-6 py-3 rounded-2xl font-bold flex items-center space-x-2 shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
        >
          <Plus size={18} />
          <span>Add Runner</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* Active Deliveries Map Placeholder */}
          <div className="bg-stone-900 rounded-3xl aspect-[16/9] relative overflow-hidden group shadow-2xl">
            {/* Mock Map UI */}
            <div className="absolute inset-0 opacity-40 bg-[url('https://api.mapbox.com/styles/v1/mapbox/dark-v10/static/-122.4241,37.78,14,0/800x450?access_token=pk.xxx')] bg-cover" />
            
            {/* Map Hotspots (Mock Runners) */}
            <div className="absolute top-1/4 left-1/3 animate-bounce">
              <div className="bg-primary text-white p-2 rounded-full shadow-lg border-2 border-white">
                <Truck size={14} />
              </div>
            </div>
            <div className="absolute bottom-1/3 right-1/4 animate-pulse">
              <div className="bg-emerald-500 text-white p-2 rounded-full shadow-lg border-2 border-white">
                <Truck size={14} />
              </div>
            </div>

            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
               <p className="text-white/20 font-black text-6xl rotate-[-20deg]">LIVE TRACKING</p>
            </div>
            
            <div className="absolute bottom-6 left-6 right-6 bg-stone-900/80 backdrop-blur-md border border-white/10 p-4 rounded-2xl flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <Activity size={20} />
                </div>
                <div>
                  <p className="text-white text-xs font-bold uppercase tracking-widest">Active Runners</p>
                  <p className="text-white/60 text-xs text-left">4 of 5 runners on duty</p>
                </div>
              </div>
              <div className="h-8 w-px bg-white/10" />
              <div>
                <p className="text-white text-xs font-bold uppercase tracking-widest">Live Updates</p>
                <p className="text-emerald-400 text-xs font-bold text-left">Enabled</p>
              </div>
            </div>
          </div>

          {/* Dispatch Queue */}
          <div className="bg-white rounded-3xl shadow-sm border border-stone-100 overflow-hidden">
            <div className="p-8 border-b border-stone-100 flex justify-between items-center bg-stone-50/50">
              <h3 className="text-lg font-black text-stone-950">Dispatch Queue</h3>
              <span className="bg-amber-100 text-amber-700 text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-xl">
                {orders.filter(o => o.status === 'pending').length} Pending Orders
              </span>
            </div>
            <div className="divide-y divide-stone-100">
              {orders.filter(o => o.status === 'pending').map(order => (
                <div key={order.id} className="p-6 flex items-center justify-between hover:bg-stone-50/30 transition-all group">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
                      <ShoppingBag size={20} />
                    </div>
                    <div>
                      <p className="text-sm font-black text-stone-900 text-left">#ORD-{order.id} • ₹{order.total}</p>
                      <p className="text-[10px] text-stone-400 font-bold uppercase tracking-widest leading-none mt-1 text-left">{order.address}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                     <select 
                      className="bg-stone-100 border-none rounded-xl px-3 py-2 text-xs font-bold focus:ring-2 focus:ring-primary/20 cursor-pointer"
                      onChange={(e) => handleAssignRunner(order.id, parseInt(e.target.value))}
                      defaultValue=""
                     >
                      <option value="" disabled>Assign Runner</option>
                      {runners.filter(r => r.status === 'active' && !r.is_busy).map(r => (
                        <option key={r.id} value={r.id}>{r.name}</option>
                      ))}
                     </select>
                     <button className="p-2 bg-stone-100 text-stone-400 rounded-xl hover:bg-primary hover:text-white transition-all">
                        <ArrowRight size={16} />
                     </button>
                  </div>
                </div>
              ))}
              {orders.filter(o => o.status === 'pending').length === 0 && (
                <div className="p-12 text-center">
                  <div className="w-16 h-16 bg-stone-50 text-stone-300 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 size={32} />
                  </div>
                  <p className="text-stone-400 font-bold">Queue is empty!</p>
                  <p className="text-[10px] text-stone-400 uppercase tracking-widest mt-1">Ready for next orders</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Runner Status List */}
          <div className="bg-white rounded-3xl shadow-sm border border-stone-100 p-8">
            <h3 className="text-lg font-black text-stone-950 mb-6">Runners Fleet</h3>
            <div className="space-y-4">
              {runners.map(runner => (
                <div key={runner.id} className="p-4 bg-stone-50 rounded-2xl border border-stone-100/50 group relative overflow-hidden">
                  <div className="flex items-center justify-between mb-3">
                     <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
                          <Truck size={18} />
                        </div>
                        <div>
                          <p className="text-sm font-black text-stone-900 text-left">{runner.name}</p>
                          <p className="text-[10px] text-stone-400 font-bold uppercase tracking-widest text-left">{formatPhoneNumber(runner.phone)}</p>
                        </div>
                     </div>
                     <span className={cn(
                       "text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-lg",
                       runner.is_busy ? "bg-amber-100 text-amber-600" : "bg-emerald-100 text-emerald-600"
                     )}>
                       {runner.is_busy ? "Busy" : "Ready"}
                     </span>
                  </div>
                  {runner.is_busy && (
                    <div className="mt-2 text-xs font-bold text-stone-500 flex items-center justify-between">
                      <span className="flex items-center gap-1"><Clock size={12} strokeWidth={2.5} /> 22 min left</span>
                      <span className="text-[10px] text-primary hover:underline cursor-pointer">View Track</span>
                    </div>
                  )}
                  <div className="absolute inset-x-0 bottom-0 h-1 bg-stone-200">
                     <div className="h-full bg-primary" style={{ width: runner.is_busy ? '65%' : '0%' }} title="Loading progress mock" />
                  </div>
                </div>
              ))}
              <button 
                onClick={() => setRunnerModal({ open: true, mode: 'add' })}
                className="w-full py-4 bg-stone-50 border-2 border-dashed border-stone-200 rounded-2xl text-stone-400 font-black uppercase text-xs tracking-widest hover:border-primary hover:bg-stone-100/50 hover:text-primary transition-all"
              >
                + Register New Runner
              </button>
            </div>
          </div>

          {/* Logistics Stats */}
          <div className="bg-stone-900 text-white p-8 rounded-3xl shadow-xl space-y-6">
            <h3 className="font-bold text-lg text-left">Delivery Metrics</h3>
            <div className="space-y-6">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs text-white/60 font-bold uppercase tracking-widest">Avg Delivery Time</span>
                  <span className="text-lg font-black">24m</span>
                </div>
                <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-primary w-3/4 rounded-full" />
                </div>
              </div>
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs text-white/60 font-bold uppercase tracking-widest">Fleet Utilization</span>
                  <span className="text-lg font-black">80%</span>
                </div>
                <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 w-[80%] rounded-full" />
                </div>
              </div>
              <div className="pt-6 border-t border-white/10 grid grid-cols-2 gap-4">
                <div className="text-center">
                  <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest mb-1">Delivered</p>
                  <p className="text-2xl font-black text-white">342</p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest mb-1">Cancelled</p>
                  <p className="text-2xl font-black text-red-400">12</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
