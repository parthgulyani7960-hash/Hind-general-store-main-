import React from 'react';
import { motion } from 'motion/react';
import { ShieldAlert, RefreshCw, Fingerprint, Globe } from 'lucide-react';
import { cn } from '@/types';

interface SuspiciousActivitiesTabProps {
  suspiciousActivities: any[];
  fetchSuspiciousActivities: () => void;
  handleResolveSuspicious: (id: number) => void;
}

export default function SuspiciousActivitiesTab({
  suspiciousActivities,
  fetchSuspiciousActivities,
  handleResolveSuspicious,
}: SuspiciousActivitiesTabProps) {
  return (
    <div className="max-w-full overflow-x-hidden space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500 font-sans pb-10 pr-2">
       <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 font-sans">
        <div className="space-y-1">
          <div className="flex items-center space-x-3">
            <div className="w-14 h-14 bg-red-600 text-white rounded-2xl flex items-center justify-center -rotate-6 shadow-xl shadow-red-200">
              <ShieldAlert size={28} />
            </div>
            <h2 className="text-4xl font-black text-stone-900 tracking-tight text-left">Security Monitoring</h2>
          </div>
          <p className="text-stone-500 font-medium text-lg ml-1 text-left">Track unusual activities and security events.</p>
        </div>
        <button 
          onClick={fetchSuspiciousActivities}
          className="bg-white p-6 rounded-3xl shadow-sm border border-stone-100 text-stone-400 hover:text-primary transition-all group active:scale-95 flex items-center justify-center shrink-0"
        >
          <RefreshCw size={24} className="group-hover:rotate-180 transition-transform duration-500 text-stone-400" />
        </button>
      </header>

      <div className="bg-white rounded-[3rem] shadow-sm border border-stone-100 overflow-hidden font-sans">
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left font-sans">
            <thead className="bg-stone-50/50 text-stone-400 text-[10px] uppercase font-black tracking-[0.25em]">
              <tr>
                <th className="px-10 py-8">Activity Type</th>
                <th className="px-6 py-8">User</th>
                <th className="px-6 py-8">Details</th>
                <th className="px-6 py-8">Risk</th>
                <th className="px-6 py-8">Time</th>
                <th className="px-10 py-8 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-50 font-sans">
              {suspiciousActivities.map((activity, idx) => (
                <motion.tr 
                  key={activity.id} 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.04 }}
                  className="hover:bg-red-50/20 transition-all group animate-in"
                >
                  <td className="px-10 py-6">
                    <span className="text-[10px] font-black px-3 py-1.5 bg-stone-100 group-hover:bg-white text-stone-500 rounded-xl uppercase tracking-widest border border-stone-100 group-hover:border-stone-200 transition-colors">{activity.type}</span>
                  </td>
                  <td className="px-6 py-6">
                    {activity.user_id ? (
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-stone-100 rounded-xl flex items-center justify-center text-stone-400 font-black shrink-0">
                          {activity.user_name?.[0] || 'U'}
                        </div>
                        <div className="flex flex-col items-start">
                          <p className="font-black text-sm text-stone-900 tracking-tight">{activity.user_name}</p>
                          <p className="text-[10px] text-stone-400 font-bold tracking-widest uppercase text-left">{activity.user_phone}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-3 text-stone-300">
                         <Fingerprint size={20} className="shrink-0" />
                         <span className="italic font-bold text-xs uppercase tracking-widest text-left">Guest User</span>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-6">
                    <div className="max-w-[300px] space-y-1 flex flex-col items-start">
                      <p className="text-sm text-stone-600 font-medium leading-relaxed truncate text-left w-full" title={activity.description}>{activity.description}</p>
                      <div className="flex items-center space-x-2 text-[10px] font-mono text-stone-400 bg-stone-50 w-fit px-2 py-0.5 rounded border border-stone-100">
                         <Globe size={10} className="shrink-0" />
                         <span>{activity.ip_address}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-6">
                    <span className={cn(
                      "inline-flex items-center space-x-2 text-[10px] font-black px-4 py-2 rounded-2xl uppercase tracking-widest border shrink-0",
                      activity.severity === 'high' ? "bg-red-50 text-red-600 border-red-100 shadow-[0_0_15px_rgba(239,68,68,0.1)]" : 
                      activity.severity === 'medium' ? "bg-amber-50 text-amber-600 border-amber-100 shadow-[0_0_15px_rgba(245,158,11,0.1)]" : 
                      activity.severity === 'resolved' ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                      "bg-blue-50 text-blue-600 border-blue-100"
                    )}>
                       <div className={cn(
                         "w-1.5 h-1.5 rounded-full shrink-0",
                         activity.severity === 'high' ? "bg-red-500 animate-ping" : 
                         activity.severity === 'medium' ? "bg-amber-500 animate-pulse" : 
                         activity.severity === 'resolved' ? "bg-emerald-500" : "bg-blue-500"
                       )} />
                       <span>{activity.severity}</span>
                    </span>
                  </td>
                  <td className="px-6 py-6 whitespace-nowrap">
                     <div className="flex flex-col items-start">
                       <span className="text-xs font-black text-stone-800 tracking-tight text-left">{new Date(activity.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                       <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest mt-0.5 text-left">{new Date(activity.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                     </div>
                  </td>
                  <td className="px-10 py-6 text-right">
                    <button 
                      onClick={() => handleResolveSuspicious(activity.id)}
                      className="bg-stone-900 text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-xl shadow-stone-900/10 active:scale-95 shrink-0 whitespace-nowrap"
                    >
                      Mark Resolved
                    </button>
                  </td>
                </motion.tr>
              ))}
              {suspiciousActivities.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-10 py-32 text-center text-stone-400 font-bold italic bg-stone-50/50 rounded-[3rem]">System integrity confirmed. No active threat vectors discovered.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
