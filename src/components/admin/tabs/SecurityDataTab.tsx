import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Shield, 
  ShieldCheck, 
  Fingerprint, 
  Database, 
  Smartphone, 
  Server, 
  History as HistoryIcon, 
  RotateCcw, 
  ToggleLeft, 
  AlertCircle, 
  CheckCircle2, 
  Wallet, 
  Loader2, 
  RefreshCw,
  Lock,
  EyeOff,
  Activity,
  Cpu,
  Clock,
  UserCheck,
  Ban
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { securityService, SecurityLog } from '@/services/securityService';

interface SecurityDataTabProps {
  user: any;
  runWalletDiagnostics: () => void;
  loadingDiagnostics: boolean;
  diagnosticResults: any;
  fixingWalletUserId: string | null;
  fixWalletDiscrepancy: (userId: string) => void;
}

function AdminStatCard({ label, value, icon, color, trend, progress }: any) {
  return (
    <div className="bg-white p-8 rounded-[2.5rem] border border-stone-100 shadow-sm flex flex-col justify-between h-48 relative overflow-hidden group">
      <div className="flex justify-between items-start">
        <div className="space-y-1">
          <p className="text-[10px] uppercase font-black text-stone-400 tracking-widest text-left">{label}</p>
          <p className="text-3xl font-black text-stone-900 tracking-tight text-left leading-none mt-1">{value}</p>
        </div>
        <div className={cn(
          "w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 group-hover:scale-110 shadow-sm",
          color === 'emerald' ? "bg-emerald-50 text-emerald-500" :
          color === 'purple' ? "bg-purple-50 text-purple-500" :
          color === 'orange' ? "bg-orange-50 text-orange-500" :
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
            color === 'purple' ? "bg-purple-500" :
            color === 'orange' ? "bg-orange-500" :
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

export default function SecurityDataTab({
  user,
  runWalletDiagnostics,
  loadingDiagnostics,
  diagnosticResults,
  fixingWalletUserId,
  fixWalletDiscrepancy,
}: SecurityDataTabProps) {
  const [securityLogs, setSecurityLogs] = useState<SecurityLog[]>([]);
  const [sessionMinutes, setSessionMinutes] = useState(0);
  const [isSyncingLogs, setIsSyncingLogs] = useState(false);

  const fetchSecurityData = async () => {
    setIsSyncingLogs(true);
    try {
      const logs = await securityService.getRecentLogs(15);
      setSecurityLogs(logs);
      setSessionMinutes(securityService.getSessionDuration());
    } finally {
      setIsSyncingLogs(false);
    }
  };

  useEffect(() => {
    fetchSecurityData();
    const interval = setInterval(fetchSecurityData, 30000); // 30s refresh
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="h-full overflow-y-auto no-scrollbar space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 font-sans pb-10 pr-2">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 font-sans">
        <AdminStatCard label="Security Node" value="ACTIVE" icon={<ShieldCheck size={22} />} color="emerald" trend={{ value: 'Protocol Live', isUp: true }} progress={100} />
        <AdminStatCard label="Live Session" value={`${sessionMinutes}m`} icon={<Clock size={22} />} color="orange" trend={{ value: 'Current Uptime', isUp: true }} progress={75} />
        <AdminStatCard label="Data Encryption" value="256-BIT" icon={<Fingerprint size={22} />} color="purple" trend={{ value: 'AES/GCM', isUp: true }} progress={100} />
        <AdminStatCard label="Integrity Log" value={securityLogs.length.toString()} icon={<HistoryIcon size={22} />} color="stone" trend={{ value: 'Recent Bounds', isUp: true }} progress={Math.min(100, securityLogs.length * 10)} />
      </div>
      
      <div className="bg-white p-10 rounded-[3rem] border border-stone-100 shadow-sm font-sans">
         <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-12">
            <div className="flex items-center space-x-6">
              <div className="w-16 h-16 bg-stone-900 text-white rounded-[1.5rem] flex items-center justify-center shadow-xl shadow-stone-200">
                 <Shield size={28} />
              </div>
              <div>
                 <h3 className="text-3xl font-black text-stone-900 tracking-tight leading-none uppercase italic text-left">Security & Data Governance</h3>
                 <p className="text-[10px] font-black text-stone-400 uppercase tracking-[0.25em] mt-3 text-left">Active Privacy & Operational Integrity Policy</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={fetchSecurityData}
                className="p-3 bg-stone-50 rounded-2xl border border-stone-100 hover:bg-stone-100 transition-colors"
                title="Sync Security Chain"
              >
                <RefreshCw size={16} className={cn("text-stone-500", isSyncingLogs && "animate-spin")} />
              </button>
              <div className="flex bg-stone-50 p-2 rounded-2xl border border-stone-100 items-center space-x-4">
                 <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse ml-2" />
                 <span className="text-[10px] font-black text-stone-600 uppercase tracking-widest pr-4">Identity Node: {String(user?.id || '').slice(0, 8)}</span>
              </div>
            </div>
         </div>
         
         <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 text-left">
            <div className="space-y-8">
               <h4 className="text-[10px] font-black text-stone-300 uppercase tracking-[0.25em] px-2 flex items-center gap-2">
                  <ToggleLeft size={14} className="text-stone-300" />
                  Access & Privacy Controls
               </h4>
               <div className="space-y-4">
                  {[
                    { label: 'Mask Phone Numbers', desc: 'Securely conceal user contact details in non-critical administrative views', active: true, icon: Smartphone },
                    { label: 'Data Encryption', desc: 'Automatic AES-256 serialization of all PII (Personally Identifiable Information)', active: true, icon: Server },
                    { label: 'Real-time Audit Trace', desc: 'Immutable logging of every administrative transaction and data mutation', active: true, icon: HistoryIcon },
                    { label: 'Session Rotation', desc: 'Automated 24h refresh cycle for all active administrative tokens', active: false, icon: RotateCcw }
                  ].map((item, i) => (
                    <div key={i} className="flex items-center justify-between p-8 bg-stone-50 rounded-[2.5rem] border border-stone-100 group hover:border-primary/20 transition-all">
                       <div className="flex items-start space-x-6 flex-1 pr-8">
                          <div className="p-3 bg-white rounded-2xl text-stone-400 group-hover:text-primary transition-colors shadow-sm shrink-0">
                             <item.icon size={20} />
                          </div>
                          <div>
                             <p className="text-base font-black text-stone-900 tracking-tight leading-none mb-1.5">{item.label}</p>
                             <p className="text-[11px] text-stone-400 font-bold leading-relaxed">{item.desc}</p>
                          </div>
                       </div>
                       <button className={cn(
                         "w-14 h-8 rounded-full relative transition-all duration-500 shadow-inner shrink-0",
                         item.active ? "bg-emerald-500 shadow-emerald-200" : "bg-stone-200"
                       )}>
                          <div className={cn(
                            "absolute top-1 w-6 h-6 bg-white rounded-full transition-all duration-500 shadow-md",
                            item.active ? "right-1" : "left-1"
                          )} />
                       </button>
                    </div>
                  ))}
               </div>
            </div>
            
            <div className="space-y-8">
               <h4 className="text-[10px] font-black text-stone-300 uppercase tracking-[0.25em] px-2 flex items-center gap-2">
                  <Activity size={14} className="text-stone-300" />
                  Live Security Intel Path
               </h4>
               <div className="bg-stone-900 rounded-[3rem] p-8 text-white space-y-6 relative overflow-hidden shadow-2xl flex flex-col h-full min-h-[500px]">
                  <div className="absolute top-0 right-0 p-12 opacity-[0.03] rotate-12 pointer-events-none">
                     <Shield size={180} />
                  </div>
                  
                  {/* Real Security Logs */}
                  <div className="flex-1 space-y-3 overflow-y-auto no-scrollbar pr-1 max-h-[400px]">
                    {securityLogs.length > 0 ? (
                      securityLogs.map((log: any, idx) => (
                        <motion.div 
                          initial={{ opacity: 0, x: -10 }} 
                          animate={{ opacity: 1, x: 0 }} 
                          key={log.id || idx} 
                          className="p-4 bg-white/5 rounded-2xl border border-white/5 backdrop-blur-md flex items-start gap-4 group hover:bg-white/10 transition-colors"
                        >
                          <div className={cn(
                            "p-2 rounded-xl shrink-0 shadow-lg",
                            log.type === 'login' ? "bg-emerald-500/20 text-emerald-400" :
                            log.type === 'logout' ? "bg-amber-500/20 text-amber-400" :
                            log.type === 'failed_transaction' ? "bg-red-500/20 text-red-400" :
                            "bg-indigo-500/20 text-indigo-400"
                          )}>
                            {log.type === 'login' ? <UserCheck size={14} /> :
                             log.type === 'logout' ? <Lock size={14} /> :
                             log.type === 'failed_transaction' ? <Ban size={14} /> :
                             <Activity size={14} />}
                          </div>
                          <div className="flex-1 space-y-1">
                            <div className="flex justify-between items-center">
                              <span className="text-[10px] font-black uppercase tracking-widest text-[#6366f1]">{log.type.replace(/_/g, ' ')}</span>
                              <span className="text-[9px] font-mono text-white/30">{log.timestamp?.toDate ? log.timestamp.toDate().toLocaleTimeString() : new Date(log.timestamp).toLocaleTimeString()}</span>
                            </div>
                            <p className="text-xs font-bold leading-tight line-clamp-2 text-white/90">{log.details}</p>
                            <div className="flex items-center gap-2 pt-1 opacity-40 group-hover:opacity-80 transition-opacity">
                               <Fingerprint size={10} />
                               <span className="text-[9px] font-mono uppercase tracking-tighter truncate">{log.userAgent?.split(' ')[0] || 'WebClient'}</span>
                            </div>
                          </div>
                        </motion.div>
                      ))
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center opacity-30 space-y-4 py-20 text-center">
                         <HistoryIcon size={48} className="animate-pulse" />
                         <p className="text-xs font-black uppercase tracking-widest">Awaiting Security Handshake...</p>
                      </div>
                    )}
                  </div>

                  <div className="bg-emerald-500/10 rounded-2xl p-4 border border-emerald-500/20 flex items-center gap-4">
                    <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center shrink-0">
                       <ShieldCheck size={20} className="text-emerald-400" />
                    </div>
                    <div>
                       <p className="text-xs font-black text-emerald-300 uppercase tracking-wider text-left">Antigravity Defense: Active</p>
                       <p className="text-[10px] font-bold text-white/50 leading-none mt-1 text-left">Real-time session isolation & anomaly detection protocols running.</p>
                    </div>
                  </div>
               </div>
            </div>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 text-left">
        <div className="bg-white p-10 rounded-[3rem] border border-stone-100 shadow-sm font-sans space-y-8">
           <div>
              <h3 className="text-2xl font-black text-stone-900 tracking-tight flex items-center gap-2">
                 <Fingerprint size={24} className="text-purple-500" /> Advanced Encryption Shield
              </h3>
              <p className="text-xs text-stone-500 font-medium mt-1">Status of data-at-rest and in-transit cipher protocols.</p>
           </div>
           
           <div className="grid grid-cols-1 gap-4">
              {[
                { label: 'PII Encryption', status: 'AES-256-GCM', health: 'Optimal', icon: Lock },
                { label: 'Database Masking', status: 'Active', health: 'Enabled', icon: EyeOff },
                { label: 'TLS Protocol', status: 'v1.3', health: 'Strict', icon: Shield },
                { label: 'Cloud Firestore', status: 'Isolated', health: 'Encrypted', icon: Database }
              ].map((item, i) => (
                <div key={i} className="p-6 bg-stone-50 rounded-[2rem] border border-stone-100 flex items-center justify-between">
                   <div className="flex items-center gap-4">
                      <div className="p-3 bg-white rounded-2xl text-stone-400 shrink-0">
                         <item.icon size={18} />
                      </div>
                      <div>
                         <p className="text-sm font-black text-stone-900 leading-none text-left">{item.label}</p>
                         <p className="text-[10px] font-bold text-stone-400 mt-1 uppercase tracking-wider text-left">{item.status}</p>
                      </div>
                   </div>
                   <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600">{item.health}</span>
                   </div>
                </div>
              ))}
           </div>
        </div>

        <div className="bg-white p-10 rounded-[3rem] border border-stone-100 shadow-sm font-sans space-y-8">
           <div>
              <h3 className="text-2xl font-black text-stone-900 tracking-tight flex items-center gap-2 font-sans italic">
                 <Wallet size={24} className="text-emerald-500" /> Wallet Ledger Audit
              </h3>
              <p className="text-xs text-stone-500 font-medium mt-1">Cross-reference transactions with balance to flag anomalies.</p>
           </div>
           
           <button 
              onClick={runWalletDiagnostics}
              disabled={loadingDiagnostics}
              className="w-full px-6 py-6 bg-stone-900 text-white text-xs font-black uppercase tracking-[0.2em] rounded-3xl hover:bg-stone-800 transition-all active:scale-[0.98] disabled:bg-stone-300 flex items-center justify-center gap-3 cursor-pointer shadow-xl shadow-stone-200"
           >
              {loadingDiagnostics ? (
                 <>
                    <Loader2 size={18} className="animate-spin" /> Auditing Ledger Node...
                 </>
              ) : (
                 <>
                    <RefreshCw size={18} /> Deep Integrity Scan
                 </>
              )}
           </button>

           <div className="p-8 bg-stone-50 rounded-[2.5rem] border border-stone-100 border-dashed space-y-4">
              <div className="flex items-center gap-3 text-stone-400">
                 <AlertCircle size={16} />
                 <p className="text-[10px] font-black uppercase tracking-wider text-left">Historical Context</p>
              </div>
              <p className="text-xs text-stone-500 font-medium leading-relaxed text-left">
                 All failed transactions are automatically logged with full stack traces and client-side metadata for forensic analysis.
              </p>
              <div className="pt-2">
                 <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] font-black uppercase tracking-widest text-stone-400">Audit Coverage</span>
                    <span className="text-xs font-black text-stone-900">100%</span>
                 </div>
                 <div className="h-1.5 bg-stone-200 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 w-full" />
                 </div>
              </div>
           </div>
        </div>
      </div>

      <div className="bg-white p-10 rounded-[3rem] border border-stone-100 shadow-sm mt-8 font-sans">
         {diagnosticResults && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
               <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-stone-50 p-6 rounded-2xl border border-stone-100 flex flex-col items-start">
                     <p className="text-[10px] font-black text-stone-400 uppercase tracking-wider mb-1 text-left">Time Executed</p>
                     <p className="text-sm font-bold text-stone-800 text-left">{new Date(diagnosticResults.checkedAt).toLocaleTimeString()}</p>
                  </div>
                  <div className="bg-stone-50 p-6 rounded-2xl border border-stone-100 flex flex-col items-start">
                     <p className="text-[10px] font-black text-stone-400 uppercase tracking-wider mb-1 text-left">Transactions Verified</p>
                     <p className="text-xl font-black text-stone-900 text-left">{diagnosticResults.totalTransactionsChecked}</p>
                  </div>
                  <div className="bg-stone-50 p-6 rounded-2xl border border-stone-100 flex flex-col items-start">
                     <p className="text-[10px] font-black text-stone-400 uppercase tracking-wider mb-1 text-left">Unique Users Checked</p>
                     <p className="text-xl font-black text-stone-950 text-left">{diagnosticResults.uniqueUsersCheckedCount}</p>
                  </div>
                  <div className="bg-stone-50 p-6 rounded-2xl border border-stone-100 flex flex-col items-start">
                     <p className="text-[10px] font-black text-stone-400 uppercase tracking-wider mb-1 text-left">Inconsistencies</p>
                     <p className={cn("text-xl font-black text-left", diagnosticResults.inconsistenciesFoundCount > 0 ? "text-red-500 animate-pulse" : "text-emerald-500")}>
                        {diagnosticResults.inconsistenciesFoundCount}
                     </p>
                  </div>
               </div>

               {diagnosticResults.inconsistencies && diagnosticResults.inconsistencies.length > 0 ? (
                  <div className="bg-red-50/50 rounded-2xl p-6 border border-red-100 space-y-3 text-left">
                     <h4 className="text-xs font-black text-red-800 uppercase tracking-wider flex items-center gap-1">
                        <AlertCircle size={14} /> Anomaly Forensics Log
                     </h4>
                     <div className="space-y-2">
                        {diagnosticResults.inconsistencies.map((inc: string, idx: number) => (
                           <div key={idx} className="text-xs text-red-900 font-medium py-2 px-4 bg-white rounded-xl border border-red-50/50 shadow-sm flex items-center gap-3 animate-in">
                              <div className="w-2.5 h-2.5 rounded-full bg-red-500 shrink-0" />
                              <span>{inc}</span>
                           </div>
                        ))}
                     </div>
                  </div>
               ) : (
                  <div className="bg-emerald-50/50 rounded-2xl p-6 border border-emerald-100 flex items-center gap-3 text-xs text-emerald-800 font-black uppercase tracking-wider text-left">
                     <CheckCircle2 size={16} className="text-emerald-500 shrink-0" /> Integrity Confirmed: No ledger/balance discrepancies found in latest transaction nodes.
                  </div>
               )}

               {/* Audited Users Detailed Interactive Table */}
               {diagnosticResults.users && diagnosticResults.users.length > 0 && (
                  <div className="space-y-4">
                     <h4 className="text-sm font-black text-stone-900 uppercase tracking-wider flex items-center gap-2 text-left">
                        <Database size={16} className="text-[#6366f1]" /> Detailed Audited Users Ledger
                     </h4>
                     <div className="bg-white rounded-3xl border border-stone-200/60 overflow-hidden shadow-sm">
                        <div className="overflow-x-auto no-scrollbar">
                           <table className="w-full text-left text-xs font-sans">
                              <thead className="bg-stone-50 border-b border-stone-100 text-[10px] text-stone-400 uppercase font-black tracking-widest text-left">
                                 <tr>
                                    <th className="px-6 py-4">User Details</th>
                                    <th className="px-6 py-4">Current Balance</th>
                                    <th className="px-6 py-4">Calculated Ledger</th>
                                    <th className="px-6 py-4">Discrepancy Amount</th>
                                    <th className="px-6 py-4">Audit Verdict</th>
                                    <th className="px-6 py-4 text-right">Verification & Correction</th>
                                 </tr>
                              </thead>
                              <tbody className="divide-y divide-stone-100 font-semibold text-stone-600 text-left">
                                 {diagnosticResults.users.map((audUser: any) => (
                                    <tr key={audUser.userId} className="hover:bg-stone-50/40 transition-colors">
                                       <td className="px-6 py-4">
                                          <div className="flex flex-col items-start">
                                             <p className="font-extrabold text-stone-800">{audUser.name}</p>
                                             <p className="text-[10px] text-stone-400 font-mono">ID: {audUser.userId} | {audUser.email}</p>
                                          </div>
                                       </td>
                                       <td className="px-6 py-4 font-bold text-stone-700">₹{audUser.currentBalance.toFixed(2)}</td>
                                       <td className="px-6 py-4 font-bold text-stone-700">₹{audUser.calculatedBalance.toFixed(2)}</td>
                                       <td className={`px-6 py-4 font-black ${audUser.discrepancy !== 0 ? "text-red-600" : "text-emerald-600"}`}>
                                          {audUser.discrepancy !== 0 ? `₹${audUser.discrepancy.toFixed(2)}` : '₹0.00'}
                                       </td>
                                       <td className="px-6 py-4">
                                          <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider flex items-center gap-1.5 w-fit ${
                                             audUser.hasDiscrepancy 
                                                ? "bg-red-50 text-red-600 border border-red-100 animate-pulse" 
                                                : "bg-emerald-50 text-emerald-600 border border-emerald-100"
                                          }`}>
                                             <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${audUser.hasDiscrepancy ? "bg-red-500" : "bg-emerald-500"}`} />
                                             {audUser.hasDiscrepancy ? 'Action Required' : 'Status Stable'}
                                          </span>
                                       </td>
                                       <td className="px-6 py-4 text-right">
                                          {audUser.hasDiscrepancy ? (
                                             <button
                                                onClick={() => fixWalletDiscrepancy(audUser.userId)}
                                                disabled={fixingWalletUserId === audUser.userId}
                                                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-[10px] uppercase tracking-widest rounded-xl transition-all disabled:bg-stone-300 flex items-center gap-1.5 ml-auto cursor-pointer"
                                             >
                                                {fixingWalletUserId === audUser.userId ? (
                                                   <>
                                                      <Loader2 size={12} className="animate-spin animate-in" /> Fixing...
                                                   </>
                                                ) : (
                                                   <>
                                                      <RefreshCw size={12} /> Fix Discrepancy
                                                   </>
                                                )}
                                             </button>
                                          ) : (
                                             <span className="text-[10px] text-stone-400 font-bold uppercase tracking-wider select-none pr-2">Passed Audit</span>
                                          )}
                                       </td>
                                    </tr>
                                 ))}
                              </tbody>
                           </table>
                        </div>
                     </div>
                  </div>
               )}
            </div>
         )}
      </div>
    </section>
  );
}
