import React from 'react';
import { motion } from 'motion/react';
import { 
  Shield, 
  ShieldCheck, 
  Fingerprint, 
  Database, 
  Smartphone, 
  Server, 
  History, 
  RotateCcw, 
  ToggleLeft, 
  AlertCircle, 
  CheckCircle2, 
  Wallet, 
  Loader2, 
  RefreshCw 
} from 'lucide-react';
import { cn } from '@/types';

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
  return (
    <section className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 font-sans">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-sans">
        <AdminStatCard label="Security Node" value="ACTIVE" icon={<ShieldCheck size={22} />} color="emerald" trend={{ value: 'Protocol Live', isUp: true }} progress={100} />
        <AdminStatCard label="Data Encryption" value="256-BIT" icon={<Fingerprint size={22} />} color="purple" trend={{ value: 'AES/GCM', isUp: true }} progress={100} />
        <AdminStatCard label="Audit Coverage" value="100%" icon={<Database size={22} />} color="stone" trend={{ value: 'Infinite Sync', isUp: true }} progress={100} />
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
            <div className="flex bg-stone-50 p-2 rounded-2xl border border-stone-100 items-center space-x-4">
               <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse ml-2" />
               <span className="text-[10px] font-black text-stone-600 uppercase tracking-widest pr-4">Identity Node: {String(user?.id || '').slice(0, 8)}</span>
            </div>
         </div>
         
         <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div className="space-y-8">
               <h4 className="text-[10px] font-black text-stone-300 uppercase tracking-[0.25em] px-2 flex items-center gap-2 text-left">
                  <ToggleLeft size={14} className="text-stone-300" />
                  Access & Privacy Controls
               </h4>
               <div className="space-y-4">
                  {[
                    { label: 'Mask Phone Numbers', desc: 'Securely conceal user contact details in non-critical administrative views', active: true, icon: Smartphone },
                    { label: 'Data Encryption', desc: 'Automatic AES-256 serialization of all PII (Personally Identifiable Information)', active: true, icon: Server },
                    { label: 'Real-time Audit Trace', desc: 'Immutable logging of every administrative transaction and data mutation', active: true, icon: History },
                    { label: 'Session Rotation', desc: 'Automated 24h refresh cycle for all active administrative tokens', active: false, icon: RotateCcw }
                  ].map((item, i) => (
                    <div key={i} className="flex items-center justify-between p-8 bg-stone-50 rounded-[2.5rem] border border-stone-100 group hover:border-primary/20 transition-all text-left">
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
               <h4 className="text-[10px] font-black text-stone-300 uppercase tracking-[0.25em] px-2 flex items-center gap-2 text-left">
                  <Database size={14} className="text-stone-300 animate-pulse" />
                  Infrastructure Health Trace
               </h4>
               <div className="bg-stone-900 rounded-[3rem] p-10 text-white space-y-10 relative overflow-hidden shadow-2xl">
                  <div className="absolute top-0 right-0 p-12 opacity-[0.03] rotate-12 pointer-events-none">
                     <Database size={180} />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-8 relative z-10 font-sans">
                     <div className="space-y-2 flex flex-col items-start">
                        <p className="text-[10px] font-black uppercase tracking-[0.4em] opacity-40">Identity Nodes</p>
                        <div className="flex items-end space-x-2">
                           <p className="text-4xl font-black tracking-tighter italic leading-none">2,841</p>
                           <span className="text-[10px] text-emerald-400 font-black mb-1">+4.2%</span>
                        </div>
                     </div>
                     <div className="space-y-2 flex flex-col items-start">
                        <p className="text-[10px] font-black uppercase tracking-[0.4em] opacity-40">Link Stability</p>
                        <div className="flex items-end space-x-2">
                           <p className="text-4xl font-black tracking-tighter italic leading-none">99.8%</p>
                           <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse mb-2" />
                        </div>
                     </div>
                  </div>

                  <div className="space-y-4 relative z-10 pt-4">
                     <div className="flex justify-between items-end mb-2">
                       <p className="text-[10px] font-black uppercase tracking-[0.4em] opacity-40 leading-none text-left">Database Payload: 4.2GB / 50GB</p>
                       <p className="text-xs font-black italic">8.4% Capacity</p>
                     </div>
                     <div className="h-2 bg-white/5 rounded-full overflow-hidden border border-white/5">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: '8.4%' }}
                          transition={{ duration: 1.5, ease: "easeOut" }}
                          className="h-full bg-primary shadow-[0_0_15px_rgba(251,191,36,0.3)]" 
                        />
                     </div>
                  </div>

                  <div className="bg-white/5 rounded-[2rem] p-6 space-y-4 relative z-10 border border-white/5 backdrop-blur-sm">
                     <h5 className="text-[10px] font-black uppercase tracking-[0.3em] opacity-50 mb-2 text-left">Active Protocols</h5>
                     <div className="space-y-3">
                        {[
                          { label: 'Automated Redundancy', status: 'Healthy', color: 'text-emerald-400' },
                          { label: 'Deep Packet Inspection', status: 'Running', color: 'text-primary' },
                          { label: 'Cross-Region Replication', status: 'Synchronized', color: 'text-emerald-400' }
                        ].map((p, i) => (
                          <div key={i} className="flex justify-between items-center text-xs font-bold py-1">
                             <span className="opacity-70 text-left">{p.label}</span>
                             <span className={cn("text-[10px] font-black uppercase tracking-widest", p.color)}>{p.status}</span>
                          </div>
                        ))}
                     </div>
                  </div>
               </div>
            </div>
         </div>
      </div>

      <div className="bg-white p-10 rounded-[3rem] border border-stone-100 shadow-sm mt-8 font-sans">
         <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
            <div>
               <h3 className="text-2xl font-black text-stone-900 tracking-tight flex items-center gap-2 text-left">
                  <Wallet size={24} className="text-primary" /> Wallet Ledger Audit & Integrity Scan
               </h3>
               <p className="text-xs text-stone-500 font-medium mt-1 text-left">Cross-reference the latest 50 wallet_transactions with user.wallet_balance to flag mismatch anomalies.</p>
            </div>
            <button 
               onClick={runWalletDiagnostics}
               disabled={loadingDiagnostics}
               className="px-6 py-3 bg-stone-900 text-white text-xs font-black uppercase tracking-widest rounded-2xl hover:bg-stone-800 transition-all active:scale-95 disabled:bg-stone-300 disabled:scale-100 flex items-center gap-2 cursor-pointer shrink-0"
            >
               {loadingDiagnostics ? (
                  <>
                     <Loader2 size={14} className="animate-spin" /> Auditing Ledger...
                  </>
               ) : (
                  <>
                     <RefreshCw size={14} /> Run Dynamic Integrity Scan
                  </>
               )}
            </button>
         </div>

         {diagnosticResults && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
               <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-stone-50 p-6 rounded-2xl border border-stone-100 flex flex-col items-start">
                     <p className="text-[10px] font-black text-stone-400 uppercase tracking-wider mb-1">Time Executed</p>
                     <p className="text-sm font-bold text-stone-800">{new Date(diagnosticResults.checkedAt).toLocaleTimeString()}</p>
                  </div>
                  <div className="bg-stone-50 p-6 rounded-2xl border border-stone-100 flex flex-col items-start">
                     <p className="text-[10px] font-black text-stone-400 uppercase tracking-wider mb-1">Transactions Verified</p>
                     <p className="text-xl font-black text-stone-900">{diagnosticResults.totalTransactionsChecked}</p>
                  </div>
                  <div className="bg-stone-50 p-6 rounded-2xl border border-stone-100 flex flex-col items-start">
                     <p className="text-[10px] font-black text-stone-400 uppercase tracking-wider mb-1">Unique Users Checked</p>
                     <p className="text-xl font-black text-stone-950">{diagnosticResults.uniqueUsersCheckedCount}</p>
                  </div>
                  <div className="bg-stone-50 p-6 rounded-2xl border border-stone-100 flex flex-col items-start">
                     <p className="text-[10px] font-black text-stone-400 uppercase tracking-wider mb-1">Inconsistencies</p>
                     <p className={cn("text-xl font-black", diagnosticResults.inconsistenciesFoundCount > 0 ? "text-red-500 animate-pulse" : "text-emerald-500")}>
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
                              <thead className="bg-stone-50 border-b border-stone-100 text-[10px] text-stone-400 uppercase font-black tracking-widest">
                                 <tr>
                                    <th className="px-6 py-4">User Details</th>
                                    <th className="px-6 py-4">Current Balance</th>
                                    <th className="px-6 py-4">Calculated Ledger</th>
                                    <th className="px-6 py-4">Discrepancy Amount</th>
                                    <th className="px-6 py-4">Audit Verdict</th>
                                    <th className="px-6 py-4 text-right">Verification & Correction</th>
                                 </tr>
                              </thead>
                              <tbody className="divide-y divide-stone-100 font-semibold text-stone-600">
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
