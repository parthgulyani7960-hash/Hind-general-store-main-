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
  Ban,
  ShieldAlert,
  Unlock,
  AlertTriangle,
  FileCheck
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { securityService, SecurityLog } from '@/services/securityService';
import toast from 'react-hot-toast';

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
          color === 'red' ? "bg-red-50 text-red-500 animate-pulse" :
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
            color === 'red' ? "bg-red-500" :
            color === 'purple' ? "bg-purple-500" :
            color === 'orange' ? "bg-orange-500" :
            "bg-stone-500"
          )} style={{ width: `${progress}%` }} />
        </div>
        <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-wider font-mono">
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

  // Advanced Security Dashboard States
  const [idsStatus, setIdsStatus] = useState<any>(null);
  const [integrityStatus, setIntegrityStatus] = useState<any>(null);
  const [loadingSecurityAction, setLoadingSecurityAction] = useState(false);
  const [lockdownReason, setLockdownReason] = useState('');

  const fetchSecurityData = async () => {
    setIsSyncingLogs(true);
    try {
      const logs = await securityService.getRecentLogs(25);
      setSecurityLogs(logs);
      setSessionMinutes(securityService.getSessionDuration());

      // Fetch Live IDS and Integrity Status
      const res = await fetch('/api/admin/security/status');
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setIdsStatus(data.ids);
          setIntegrityStatus(data.integrity);
        }
      }
    } catch (err) {
      console.error('[FRONTEND_SECURITY] Status fetch error:', err);
    } finally {
      setIsSyncingLogs(false);
    }
  };

  useEffect(() => {
    fetchSecurityData();
    const interval = setInterval(fetchSecurityData, 15000); // 15s refresh
    return () => clearInterval(interval);
  }, []);

  const handleTriggerLockdown = async () => {
    const reason = lockdownReason.trim() || 'Manual emergency lockdown initiated by administrator';
    setLoadingSecurityAction(true);
    try {
      const res = await fetch('/api/admin/security/trigger-lockdown', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(data.message || 'Store lockdown activated successfully!');
        setLockdownReason('');
        fetchSecurityData();
      } else {
        toast.error(data.message || 'Failed to trigger store lockdown.');
      }
    } catch (err) {
      toast.error('Network error during lockdown transmission.');
    } finally {
      setLoadingSecurityAction(false);
    }
  };

  const handleReleaseLockdown = async () => {
    setLoadingSecurityAction(true);
    try {
      const res = await fetch('/api/admin/security/release-lockdown', {
        method: 'POST'
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(data.message || 'Store lockdown de-escalated successfully!');
        fetchSecurityData();
      } else {
        toast.error(data.message || 'Failed to release storefront lockdown.');
      }
    } catch (err) {
      toast.error('Network error during lockdown release handshake.');
    } finally {
      setLoadingSecurityAction(false);
    }
  };

  // Determine current security threat tier values
  const threatTier = idsStatus?.threatLevel || 'LOW';
  const isMaintenance = idsStatus?.isMaintenanceMode || false;

  return (
    <section className="max-w-full overflow-x-hidden space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 font-sans pb-10 pr-2">
      
      {/* 4 Stat Cards incorporating IDS Threat Data */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 font-sans">
        <AdminStatCard 
          label="Threat Index Index" 
          value={threatTier} 
          icon={threatTier === 'LOW' ? <ShieldCheck size={22} /> : <ShieldAlert size={22} />} 
          color={threatTier === 'LOW' ? 'emerald' : 'red'} 
          trend={{ value: `${idsStatus?.activeIncidents || 0} Incident Vectors` }} 
          progress={threatTier === 'LOW' ? 10 : threatTier === 'MEDIUM' ? 40 : threatTier === 'HIGH' ? 75 : 100} 
        />
        <AdminStatCard 
          label="Store Status" 
          value={isMaintenance ? "MAINTENANCE" : "ACTIVE"} 
          icon={<Server size={22} />} 
          color={isMaintenance ? 'red' : 'emerald'} 
          trend={{ value: isMaintenance ? 'Lockdown active' : 'Storefront live' }} 
          progress={isMaintenance ? 100 : 100} 
        />
        <AdminStatCard 
          label="Live Session" 
          value={`${sessionMinutes}m`} 
          icon={<Clock size={22} />} 
          color="orange" 
          trend={{ value: 'Audit rotation active' }} 
          progress={75} 
        />
        <AdminStatCard 
          label="File Integrity" 
          value={integrityStatus?.valid ? "VERIFIED" : "COMPROMISED"} 
          icon={<FileCheck size={22} />} 
          color={integrityStatus?.valid ? 'purple' : 'red'} 
          trend={{ value: `${integrityStatus?.checkedFiles?.length || 0} Core footprint nodes` }} 
          progress={integrityStatus?.valid ? 100 : 50} 
        />
      </div>

      {/* EMERGENCY LOCKDOWN / SYSTEM THREAT DASHBOARD */}
      <div className="bg-white p-10 rounded-[3rem] border border-stone-100 shadow-sm text-left space-y-8">
        <div className="flex items-center space-x-4 border-b border-stone-100 pb-6">
          <div className={cn(
            "w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg",
            isMaintenance ? "bg-red-500 text-white animate-pulse" : "bg-stone-900 text-white"
          )}>
            <ShieldAlert size={22} />
          </div>
          <div>
            <h3 className="text-xl font-black text-stone-900 tracking-tight">Intrusion Detection & Emergency Controls</h3>
            <p className="text-xs text-stone-500 font-medium">Automatic/manual storefront isolation on high-risk threat triggers.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Active Lockdown State details */}
          <div className="space-y-6">
            <div className={cn(
              "p-8 rounded-[2.5rem] border flex flex-col justify-between h-full space-y-6",
              isMaintenance ? "bg-red-50/50 border-red-100" : "bg-stone-50/50 border-stone-100"
            )}>
              <div className="space-y-2">
                <span className={cn(
                  "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border",
                  isMaintenance ? "bg-red-100/60 text-red-600 border-red-200" : "bg-emerald-100/60 text-emerald-600 border-emerald-200"
                )}>
                  {isMaintenance ? 'Lockdown Enforced' : 'Store Secure'}
                </span>
                <h4 className="text-2xl font-black text-stone-900 leading-tight pt-2">
                  {isMaintenance ? 'Automatic Isolation Engaged' : 'Storefront Operating Normally'}
                </h4>
                <p className="text-xs text-stone-500 font-medium leading-relaxed">
                  {isMaintenance 
                    ? `The server automatically suspended storefront customer access at ${idsStatus?.maintenanceTriggeredAt ? new Date(idsStatus.maintenanceTriggeredAt).toLocaleTimeString() : 'N/A'}. Reason: ${idsStatus?.maintenanceReason}`
                    : 'System is monitoring logs and requests dynamically. In case of aggressive brute force, SQL injection, or signature tempering, storefront access will immediately trigger a lockdown.'
                  }
                </p>
              </div>

              {/* Action Buttons */}
              <div className="space-y-4">
                {isMaintenance ? (
                  <button
                    onClick={handleReleaseLockdown}
                    disabled={loadingSecurityAction}
                    className="w-full px-6 py-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black uppercase tracking-[0.2em] rounded-2xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xl shadow-emerald-100 disabled:bg-stone-300"
                  >
                    {loadingSecurityAction ? <Loader2 size={16} className="animate-spin" /> : <Unlock size={16} />}
                    De-escalate & Unlock Store
                  </button>
                ) : (
                  <div className="space-y-3">
                    <input
                      type="text"
                      placeholder="Specify lockdown audit reason..."
                      value={lockdownReason}
                      onChange={(e) => setLockdownReason(e.target.value)}
                      className="w-full px-5 py-4 bg-white border border-stone-200 rounded-2xl text-xs font-semibold focus:outline-none focus:border-stone-400"
                    />
                    <button
                      onClick={handleTriggerLockdown}
                      disabled={loadingSecurityAction}
                      className="w-full px-6 py-4 bg-stone-900 hover:bg-stone-800 text-white text-xs font-black uppercase tracking-[0.2em] rounded-2xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xl shadow-stone-200 disabled:bg-stone-300"
                    >
                      {loadingSecurityAction ? <Loader2 size={16} className="animate-spin" /> : <ShieldAlert size={16} />}
                      Force Manual Emergency Lockdown
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Core File Integrity Scan results */}
          <div className="space-y-6">
            <div className="p-8 bg-stone-50/50 rounded-[2.5rem] border border-stone-100 flex flex-col justify-between h-full space-y-4">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="text-sm font-black uppercase tracking-wider text-stone-700 flex items-center gap-2">
                    <FileCheck size={16} className="text-purple-500" /> Core Footprint Audit
                  </h4>
                  <span className={cn(
                    "text-[10px] font-black uppercase tracking-widest",
                    integrityStatus?.valid ? "text-emerald-500" : "text-red-500"
                  )}>
                    {integrityStatus?.valid ? 'PASSED' : 'BREACHED'}
                  </span>
                </div>

                <div className="space-y-2">
                  {integrityStatus?.checkedFiles?.map((file: string, idx: number) => {
                    const isLeaked = integrityStatus?.errors?.some((err: string) => err.includes(file));
                    return (
                      <div key={idx} className="flex items-center justify-between p-3.5 bg-white rounded-xl border border-stone-100 text-xs font-semibold">
                        <span className="font-mono text-stone-600">{file}</span>
                        <div className="flex items-center gap-2">
                          <div className={cn("w-1.5 h-1.5 rounded-full animate-pulse", isLeaked ? "bg-red-500" : "bg-emerald-500")} />
                          <span className={isLeaked ? "text-red-500 text-[10px] font-black uppercase tracking-wider" : "text-emerald-500 text-[10px] font-black uppercase tracking-wider"}>
                            {isLeaked ? 'Modified / Empty' : 'Secure'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {integrityStatus?.errors?.length > 0 && (
                  <div className="p-4 bg-red-50 rounded-2xl border border-red-100 space-y-2">
                    <p className="text-[10px] font-black uppercase tracking-wider text-red-800 flex items-center gap-1">
                      <AlertTriangle size={12} /> System Breaches Found:
                    </p>
                    <ul className="text-[11px] text-red-900 font-medium list-disc list-inside space-y-1">
                      {integrityStatus.errors.map((err: string, i: number) => (
                        <li key={i}>{err}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>

        {/* IP Reputation Tracker list */}
        {idsStatus?.ipTrackers?.length > 0 && (
          <div className="space-y-4 pt-4 border-t border-stone-100">
            <h4 className="text-sm font-black text-stone-800 uppercase tracking-wider flex items-center gap-2">
              <Ban size={15} className="text-red-500" /> IDS Active IP Tracker & Blacklists
            </h4>
            <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-sm">
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-50 border-b border-stone-100 text-[10px] text-stone-400 uppercase font-black tracking-widest">
                  <tr>
                    <th className="px-6 py-4">IP Node Address</th>
                    <th className="px-6 py-4">Threat Score</th>
                    <th className="px-6 py-4">Failed Logins</th>
                    <th className="px-6 py-4">Injections Blocked</th>
                    <th className="px-6 py-4">Reputation Verdict</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 font-semibold text-stone-600">
                  {idsStatus.ipTrackers.map((ipTracker: any, idx: number) => (
                    <tr key={idx} className="hover:bg-stone-50/40">
                      <td className="px-6 py-4 font-mono font-bold text-stone-800">{ipTracker.ip}</td>
                      <td className="px-6 py-4 font-black text-stone-900">{ipTracker.score}</td>
                      <td className="px-6 py-4">{ipTracker.failedLogins}</td>
                      <td className="px-6 py-4">{ipTracker.injectionAttempts}</td>
                      <td className="px-6 py-4">
                        <span className={cn(
                          "px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider flex items-center gap-1 w-fit",
                          ipTracker.blocked 
                            ? "bg-red-50 text-red-600 border border-red-100 animate-pulse" 
                            : ipTracker.score >= 10 
                            ? "bg-amber-50 text-amber-600 border border-amber-100" 
                            : "bg-emerald-50 text-emerald-600 border border-emerald-100"
                        )}>
                          <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", ipTracker.blocked ? "bg-red-500" : ipTracker.score >= 10 ? "bg-amber-500" : "bg-emerald-500")} />
                          {ipTracker.blocked ? `Blocked (${Math.round(ipTracker.blockedRemainingMs / 60000)}m left)` : ipTracker.score >= 10 ? 'Suspicious Node' : 'Reputable'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
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
                className="p-3 bg-stone-50 rounded-2xl border border-stone-100 hover:bg-stone-100 transition-colors cursor-pointer"
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
                  <div className="flex-1 space-y-3 pr-1 max-h-[400px] overflow-y-auto no-scrollbar">
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
                            <div className="flex items-center gap-2 pt-1 opacity-40 group-hover:opacity-80 transition-opacity font-mono">
                               <Fingerprint size={10} />
                               <span className="text-[9px] uppercase tracking-tighter truncate">{log.userAgent?.split(' ')[0] || 'WebClient'}</span>
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
                                             <p className="text-[10px] text-stone-400 font-mono text-left">ID: {audUser.userId} | {audUser.email}</p>
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
