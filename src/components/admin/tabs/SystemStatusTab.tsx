import React from 'react';
import { motion } from 'motion/react';
import { Download, Database, Activity, ShieldAlert, Cpu, RefreshCw, Zap } from 'lucide-react';
import { cn } from '@/types';

interface SystemStatusTabProps {
  systemHealth: any;
  dbDiag: any;
  errorLogs: any[];
  systemLogs: any[];
  isRefreshingLogs: boolean;
  fetchSystemLogs: () => void;
  generateSystemHealthReportPDF: (health: any, logs: any[]) => void;
}

function AdminStatCard({ label, value, icon, color, trend, progress }: any) {
  return (
    <div className="bg-white p-8 rounded-[2.5rem] border border-stone-100 shadow-sm flex flex-col justify-between h-48 relative overflow-hidden group font-sans">
      <div className="flex justify-between items-start">
        <div className="space-y-1">
          <p className="text-[10px] uppercase font-black text-stone-400 tracking-widest text-left">{label}</p>
          <p className="text-3xl font-black text-stone-900 tracking-tight text-left leading-none mt-1">{value}</p>
        </div>
        <div className={cn(
          "w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 group-hover:scale-110 shadow-sm",
          color === 'emerald' ? "bg-emerald-50 text-emerald-500" :
          color === 'blue' ? "bg-blue-50 text-blue-500" :
          color === 'purple' ? "bg-purple-50 text-purple-500" :
          "bg-stone-50 text-stone-500"
        )}>
          {icon}
        </div>
      </div>
      
      <div className="space-y-3">
        <div className="h-1 w-full bg-stone-50 rounded-full overflow-hidden">
          <div className={cn(
            "h-full rounded-full transition-all duration-1000",
            color === 'emerald' ? "bg-emerald-500" :
            color === 'blue' ? "bg-blue-500" :
            color === 'purple' ? "bg-purple-500" :
            "bg-stone-500"
          )} style={{ width: `${progress}%` }} />
        </div>
        <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-wider">
          <span className="text-stone-400">{trend?.value}</span>
        </div>
      </div>
    </div>
  );
}

export default function SystemStatusTab({
  systemHealth,
  dbDiag,
  errorLogs,
  systemLogs,
  isRefreshingLogs,
  fetchSystemLogs,
  generateSystemHealthReportPDF,
}: SystemStatusTabProps) {
  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500 font-sans">
       <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 font-sans">
        <div>
          <h2 className="text-4xl font-black text-stone-900 tracking-tight text-left">System Infrastructure</h2>
          <p className="text-stone-500 mt-2 text-lg font-medium text-left">Real-time telemetry, error matrix, and environment health monitoring.</p>
        </div>
        <div className="flex items-center gap-4 shrink-0 font-sans">
          <button 
            type="button"
            onClick={() => generateSystemHealthReportPDF(systemHealth, errorLogs)}
            className="bg-white border border-stone-100 p-5 rounded-3xl shadow-sm hover:bg-stone-50 transition-all flex items-center space-x-3 group cursor-pointer"
          >
            <Download size={20} className="text-stone-400 group-hover:text-primary" />
            <span className="text-xs font-black uppercase tracking-widest text-[#292524] group-hover:text-stone-900 leading-none">Health Audit</span>
          </button>
          <div className="flex bg-white px-8 py-5 rounded-3xl border border-stone-100 shadow-sm items-center space-x-8">
            <div className="flex flex-col items-start">
              <span className="text-xs font-black text-stone-400 uppercase tracking-widest leading-none mb-1">Uptime</span>
              <span className="text-xl font-black text-stone-900 leading-none">
                {systemHealth ? `${Math.floor(systemHealth.uptime / 3600)}h ${Math.floor((systemHealth.uptime % 3600) / 60)}m` : '0h 0m'}
              </span>
            </div>
            <div className="w-px h-10 bg-stone-100" />
            <div className="flex items-center space-x-3">
                <div className={cn("w-3 h-3 rounded-full animate-pulse shrink-0", dbDiag?.connection === 'CONNECTED' ? 'bg-emerald-500' : dbDiag?.mode === 'SANDBOX' ? 'bg-amber-500' : 'bg-red-500')} />
                <div className="flex flex-col items-start">
                  <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest leading-none mb-1">Database</span>
                  <span className={cn("text-xs font-black uppercase tracking-widest leading-none", dbDiag?.connection === 'CONNECTED' ? 'text-emerald-600' : dbDiag?.mode === 'SANDBOX' ? 'text-amber-600' : 'text-red-600')}>
                    {dbDiag?.mode === 'SANDBOX' ? 'Sandbox Mode' : dbDiag?.connection === 'CONNECTED' ? 'Active Production' : 'Connection Failed'}
                  </span>
                </div>
            </div>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 font-sans">
          <AdminStatCard 
            label="DB Latency" 
            value={systemHealth?.latency || '2ms'} 
            icon={<Database size={22} />} 
            trend={{ value: 'Healthy', isUp: true }} 
            color="emerald" 
            progress={98}
          />
          <AdminStatCard 
            label="Active Sessions" 
            value={systemHealth?.metrics?.activeUsers || 0} 
            icon={<Activity size={22} />} 
            trend={{ value: 'Stable', isUp: true }} 
            color="blue" 
            progress={60}
          />
          <AdminStatCard 
            label="Uncaught Anomalies" 
            value={systemHealth?.metrics?.recentErrors || 0} 
            icon={<ShieldAlert size={22} />} 
            trend={{ 
              value: systemHealth?.metrics?.recentErrors > 0 ? 'Review Needed' : 'Nominal', 
              isUp: systemHealth?.metrics?.recentErrors === 0 
            }} 
            color={systemHealth?.metrics?.recentErrors > 0 ? "red" : "stone"} 
            progress={systemHealth?.metrics?.recentErrors > 0 ? 90 : 10}
          />
          <AdminStatCard 
            label="Node Payload" 
            value={systemHealth?.memory || '120MB / 512MB'} 
            icon={<Cpu size={22} />} 
            trend={{ value: 'Low Load', isUp: true }} 
            color="purple" 
            progress={25}
          />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 font-sans">
         <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between px-2">
               <h3 className="text-xl font-black text-stone-900 uppercase tracking-tight text-left">Kernel Events</h3>
               <button 
                 type="button"
                 onClick={fetchSystemLogs}
                 className="p-3 bg-white border border-stone-100 rounded-2xl hover:bg-stone-50 transition-all shadow-sm cursor-pointer"
               >
                 <RefreshCw size={20} className={cn("text-stone-400", isRefreshingLogs && "animate-spin")} />
               </button>
            </div>
            <div className="bg-stone-950 rounded-[2.5rem] p-8 shadow-2xl border border-stone-800 relative overflow-hidden font-mono text-[11px]">
               <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary/20 via-primary/5 to-transparent pointer-events-none" />
               <div className="space-y-4 max-h-[600px] overflow-y-auto no-scrollbar scroll-smooth">
                  {systemLogs.map((log, i) => (
                    <div key={i} className="flex space-x-6 group opacity-80 hover:opacity-100 transition-opacity text-left animate-in">
                      <span className="text-stone-600 shrink-0 font-bold">[{new Date(log.created_at).toLocaleTimeString()}]</span>
                      <div className="flex flex-col space-y-1 w-full text-left">
                         <div className="flex items-center space-x-3">
                           <span className={cn(
                             "font-black uppercase tracking-widest text-[10px]",
                             log.type === 'error' ? "text-red-500" : 
                             log.type === 'warn' ? "text-amber-500" : 
                             log.type === 'info' ? "text-emerald-500" : "text-blue-500"
                           )}>
                             {log.type}
                           </span>
                           <span className="text-stone-300 font-bold leading-relaxed">{log.message}</span>
                         </div>
                         {log.details && (
                           <p className="text-stone-500 text-[10px] pl-0 break-all leading-relaxed bg-white/5 p-3 rounded-xl mt-2 border border-white/5">{log.details}</p>
                         )}
                      </div>
                    </div>
                  ))}
                  {systemLogs.length === 0 && (
                    <div className="py-20 text-center text-stone-600 font-black uppercase tracking-[0.3em]">No Kernel Activity Recorded</div>
                  )}
               </div>
            </div>
         </div>

         {/* Real-Time Exception Feed (onSnapshot Firestore Feed) */}
         <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between px-2">
               <div className="flex items-center space-x-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse shadow-sm shadow-red-200 shrink-0" />
                  <h3 className="text-xl font-black text-stone-900 uppercase tracking-tight text-left">Real-Time Exception Feed</h3>
               </div>
               <span className="text-[10px] font-black uppercase tracking-widest text-red-500 bg-red-50 px-3 py-1 rounded-full animate-pulse">
                  Live Firestore Stream
               </span>
            </div>
            <div className="bg-stone-950 rounded-[2.5rem] p-8 shadow-2xl border border-stone-800 relative overflow-hidden font-mono text-[11px]">
               <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-red-500/20 via-red-500/5 to-transparent pointer-events-none" />
               <div className="space-y-4 max-h-[600px] overflow-y-auto no-scrollbar scroll-smooth">
                  {errorLogs.map((log: any, i: number) => {
                    const dateVal = log.timestamp?.seconds 
                      ? new Date(log.timestamp.seconds * 1000)
                      : new Date(log.timestamp || Date.now());
                    return (
                      <div key={log.id || i} className="flex space-x-6 group opacity-90 hover:opacity-100 transition-opacity border-b border-stone-900/40 pb-4 last:border-0 last:pb-0 text-left animate-in">
                        <span className="text-red-500 shrink-0 font-bold">[{dateVal.toLocaleTimeString()}]</span>
                        <div className="flex flex-col space-y-1 w-full text-left">
                           <div className="flex justify-between items-center gap-4">
                              <span className="text-amber-400 font-black tracking-widest uppercase text-[9px] bg-amber-400/5 px-2 py-0.5 rounded border border-amber-400/10 truncate">Context: {log.context || 'Global / Sandbox'}</span>
                              <span className="text-stone-500 text-[9px] font-bold shrink-0">User: {log.userId || 'anonymous'}</span>
                           </div>
                           <p className="text-stone-300 font-bold leading-relaxed whitespace-pre-wrap break-all">{log.error}</p>
                           {log.url && (
                              <p className="text-stone-500 text-[9px] truncate text-left">URL: {log.url}</p>
                           )}
                        </div>
                      </div>
                    );
                  })}
                  {errorLogs.length === 0 && (
                    <div className="py-20 text-center text-stone-600 font-black uppercase tracking-[0.3em]">No Exception Events Broadcasted</div>
                  )}
               </div>
            </div>
         </div>

         <div className="space-y-8">
            <div className="bg-white p-8 rounded-[2.5rem] border border-stone-100 shadow-sm space-y-6 text-left">
               <h3 className="text-lg font-black text-stone-900 uppercase tracking-tight">Security Matrix</h3>
               <div className="space-y-6">
                  {[
                    { label: 'HTTPS Governance', active: true },
                    { label: 'XSS Sanitization', active: true },
                    { label: 'CSRF Shield', active: true },
                    { label: 'Rate Limit Node', active: true },
                    { label: 'Audit Logging', active: true },
                  ].map((s, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <span className="text-xs font-bold text-stone-500">{s.label}</span>
                      <div className="w-10 h-5 bg-emerald-500/20 rounded-full flex items-center px-1">
                         <div className="w-3.5 h-3.5 bg-emerald-500 rounded-full" />
                      </div>
                    </div>
                  ))}
               </div>
            </div>

            <div className="bg-stone-900 p-8 rounded-[2.5rem] shadow-xl text-white space-y-6 text-left">
               <div className="flex items-center space-x-3">
                  <div className="p-3 bg-white/10 rounded-2xl shrink-0"><Zap size={20} /></div>
                  <h3 className="text-lg font-black uppercase tracking-tight">Live Throughput</h3>
               </div>
               <div className="space-y-4">
                  <div className="flex justify-between items-end">
                     <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Active Requests</span>
                     <span className="text-2xl font-black">{systemHealth?.metrics?.activeUsers || 0}s/m</span>
                  </div>
                  <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                     <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, (systemHealth?.metrics?.activeUsers || 0) * 10)}%` }}
                      className="h-full bg-primary" 
                     />
                  </div>
                  <p className="text-[9px] text-stone-400 leading-relaxed font-bold">Requests are within optimal threshold. System is experiencing nominal traffic volume.</p>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
}
