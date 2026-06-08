import React from 'react';
import { motion } from 'motion/react';
import { RefreshCw, Download, ShieldCheck, Database } from 'lucide-react';
import { cn } from '@/types';

interface AuditLogsTabProps {
  auditLogType: string;
  setAuditLogType: (type: string) => void;
  fetchAuditLogs: (type: string, limitVal?: number) => void;
  isFetchingAudit: boolean;
  auditLogLimit: number;
  auditLogs: any[];
  handleRevertAction: (logId: number) => void;
}

export default function AuditLogsTab({
  auditLogType,
  setAuditLogType,
  fetchAuditLogs,
  isFetchingAudit,
  auditLogLimit,
  auditLogs,
  handleRevertAction,
}: AuditLogsTabProps) {
  return (
    <div className="h-full overflow-y-auto no-scrollbar space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
      <header className="shrink-0 flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div>
          <h2 className="text-4xl font-black text-stone-900 tracking-tight">Security & Audit Cipher</h2>
          <p className="text-stone-500 mt-2 text-lg font-medium">Detailed forensics of all administrative actions and security events.</p>
        </div>
        <div className="flex flex-wrap items-center gap-4 bg-white p-3 rounded-[2rem] shadow-sm border border-stone-100">
          <select 
            className="bg-stone-55 text-stone-900 px-6 py-4 rounded-2xl border-none text-[10px] font-black uppercase tracking-widest outline-none focus:ring-2 focus:ring-primary/20 appearance-none cursor-pointer"
            value={auditLogType}
            onChange={(e) => setAuditLogType(e.target.value)}
          >
            <option value="all">Unfiltered Domain</option>
            <option value="product">Product Protocol</option>
            <option value="order">Trade Logistics</option>
            <option value="user">Human Intelligence</option>
            <option value="settings">Core Parameters</option>
            <option value="auth">Security Handshake</option>
          </select>
          <div className="w-px h-10 bg-stone-100 hidden sm:block" />
          <button 
            onClick={() => fetchAuditLogs(auditLogType, auditLogLimit)}
            className="p-4 bg-stone-50 text-stone-400 hover:text-primary rounded-2xl transition-all shadow-sm group"
          >
            <RefreshCw size={20} className={cn("group-active:animate-spin", isFetchingAudit && "animate-spin")} />
          </button>
           <button 
            className="flex items-center space-x-3 bg-stone-900 text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-xl shadow-stone-900/10 active:scale-95"
          >
            <Download size={18} />
            <span>Export Cipher Log</span>
          </button>
        </div>
      </header>

      <div className="bg-white rounded-[3rem] shadow-sm border border-stone-100 overflow-hidden">
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left">
             <thead className="bg-stone-50/50 text-stone-400 text-[10px] uppercase font-black tracking-[0.25em]">
              <tr>
                <th className="px-10 py-8">Admin Agent</th>
                <th className="px-6 py-8">Action Logic</th>
                <th className="px-6 py-8">Resource Target</th>
                <th className="px-6 py-8">Activity Details</th>
                <th className="px-6 py-8">Endpoint IP</th>
                <th className="px-6 py-8">Operational Clearing</th>
                <th className="px-10 py-8 text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-50">
              {auditLogs.map((log, idx) => {
                const details = (() => {
                  try { return JSON.parse(log.details); } catch(e) { return { message: log.details }; }
                })();
                const isReversible = !!details.oldState;
                const isReversion = log.action === 'ACTION_REVERTED';

                return (
                  <motion.tr 
                    key={log.id} 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.02 }}
                    className="hover:bg-stone-50/50 transition-colors group"
                  >
                    <td className="px-10 py-6">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-stone-900 text-white rounded-xl flex items-center justify-center text-[10px] font-black uppercase shadow-sm rotate-3 group-hover:rotate-0 transition-transform">
                          {log.admin_name?.[0] || 'A'}
                        </div>
                        <span className="text-sm font-black text-stone-900">{log.admin_name || 'System Auto'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-6">
                      <span className={cn(
                        "text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-lg border",
                        log.action === 'DELETE' ? 'bg-red-50 text-red-600 border-red-100' :
                        log.action === 'ACTION_REVERTED' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                        log.action === 'PUT' || log.action?.includes('UPDATE') ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                      )}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-6">
                       <span className="text-[10px] font-mono font-black text-stone-400 bg-stone-100 px-3 py-1 rounded-lg uppercase border border-stone-200/50">
                         {log.resource || log.target_type}
                       </span>
                    </td>
                    <td className="px-6 py-6 max-w-[300px]">
                       <div className="space-y-1">
                         <p className="text-[10px] text-stone-600 font-bold leading-relaxed">{details.message || log.details}</p>
                         {isReversion && (
                           <div className="flex items-center space-x-1 text-[9px] text-amber-600 font-black uppercase tracking-widest mt-2 justify-start">
                              <ShieldCheck size={10} />
                              <span>Protocol Reverted</span>
                           </div>
                         )}
                       </div>
                    </td>
                    <td className="px-6 py-6 font-mono text-[10px] text-stone-400 font-black">
                      {log.ip_address || '127.0.0.1'}
                    </td>
                    <td className="px-6 py-6">
                       {isReversible ? (
                         <button 
                           onClick={() => handleRevertAction(log.id)}
                           className="flex items-center space-x-2 text-[9px] font-black uppercase tracking-widest text-primary hover:text-white bg-primary/5 hover:bg-primary px-4 py-2 rounded-2xl border border-primary/10 transition-all shadow-sm active:scale-95"
                         >
                           <RefreshCw size={12} />
                           <span>Rollback</span>
                         </button>
                       ) : isReversion ? (
                         <button 
                           onClick={() => handleRevertAction(log.id)}
                           className="flex items-center space-x-2 text-[9px] font-black uppercase tracking-widest text-amber-600 hover:text-white bg-amber-50 hover:bg-amber-600 px-4 py-2 rounded-2xl border border-amber-200 transition-all shadow-sm active:scale-95"
                         >
                           <RefreshCw size={12} />
                           <span>Relay Original</span>
                         </button>
                       ) : (
                         <div className="flex items-center space-x-2 text-[10px] text-stone-300 font-black uppercase tracking-widest italic opacity-50 justify-start">
                            <div className="w-3 h-3 bg-stone-300 rounded-full" />
                            <span>Immutable</span>
                         </div>
                       )}
                    </td>
                    <td className="px-10 py-6 text-right">
                       <p className="text-[10px] font-black text-stone-900 tracking-tighter">
                         {new Date(log.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                       </p>
                       <p className="text-[9px] font-bold text-stone-400 uppercase tracking-widest mt-1">
                         {new Date(log.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                       </p>
                    </td>
                  </motion.tr>
                );
              })}
              {auditLogs.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-10 py-32 text-center">
                    <div className="flex flex-col items-center space-y-4">
                      <div className="p-8 bg-stone-50 rounded-full text-stone-200 animate-pulse">
                        <Database size={48} />
                      </div>
                      <p className="text-stone-400 font-bold italic">Forensic archives are empty. Stable state confirmed.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
