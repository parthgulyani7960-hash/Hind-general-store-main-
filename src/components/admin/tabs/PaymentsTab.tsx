import React, { useState, useEffect } from 'react';
import { 
  Zap, Mail, Wallet, Shield, History, 
  Search, RefreshCw, CheckCircle2, XCircle, 
  AlertCircle, ArrowUpRight, ArrowDownLeft,
  Filter, Eye, ExternalLink, ShieldCheck, MailWarning
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';

interface PaymentsTabProps {
  fetchWithHandling: <T>(url: string, options?: any) => Promise<T>;
  getAuthHeaders: () => any;
  toast: any;
}

export default function PaymentsTab({ fetchWithHandling, getAuthHeaders, toast }: PaymentsTabProps) {
  const [activeSubTab, setActiveSubTab] = useState<'verification' | 'logs' | 'wallets' | 'audit'>('verification');
  const [logs, setLogs] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [walletCredits, setWalletCredits] = useState<any[]>([]);
  const [systemStatus, setSystemStatus] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const fetchPaymentData = async () => {
    setLoading(true);
    try {
      const [emailLogs, audit, wallets, status] = await Promise.all([
        fetchWithHandling<any[]>('/api/admin/emails-log', { headers: getAuthHeaders() }),
        fetchWithHandling<any[]>('/api/admin/audit-logs', { headers: getAuthHeaders() }),
        fetchWithHandling<any[]>('/api/admin/wallet-credits', { headers: getAuthHeaders() }),
        fetchWithHandling<any>('/api/admin/payment-system-status', { headers: getAuthHeaders() })
      ]);
      setLogs(emailLogs || []);
      setAuditLogs(audit || []);
      setWalletCredits(wallets || []);
      setSystemStatus(status);
    } catch (err) {
      console.error('Failed to fetch payment data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPaymentData();
  }, []);

  const handleSyncNow = async () => {
    setSyncing(true);
    try {
      await fetchWithHandling('/api/admin/payment-sync-now', { 
        method: 'POST', 
        headers: getAuthHeaders() 
      });
      toast.success('Gmail Sync Triggered');
      fetchPaymentData();
    } catch (err) {
      toast.error('Sync failed');
    } finally {
      setSyncing(false);
    }
  };

  const handleManualApprove = async (orderId: string) => {
    if (!orderId) return;
    const confirmApprove = confirm(`Manually verify payment for order ${orderId}? This will mark it as PAID and notify the runner.`);
    if (!confirmApprove) return;

    try {
      await fetchWithHandling(`/api/admin/orders/${orderId}/manual-approve`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ notes: 'Manual approval from email dashboard' })
      });
      toast.success('Order Verified Successfully');
      fetchPaymentData();
    } catch (err) {
      toast.error('Approval failed');
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 font-sans">
      {/* Header with Control Panel */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div className="space-y-1">
          <div className="flex items-center space-x-3">
            <div className="w-14 h-14 bg-stone-900 text-white rounded-2xl flex items-center justify-center rotate-12 shadow-xl shadow-stone-200">
              <Zap size={28} />
            </div>
            <h2 className="text-4xl font-black text-stone-900 tracking-tight text-left">FinOps Intelligence</h2>
          </div>
          <p className="text-stone-500 font-medium text-lg ml-1 text-left">Real-time payment matching & ledger synchronization.</p>
        </div>

        <div className="flex items-center space-x-3">
          {systemStatus?.gmailConnected ? (
            <div className="flex items-center space-x-2 bg-emerald-50 text-emerald-600 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest border border-emerald-100">
              <ShieldCheck size={14} className="animate-pulse" />
              <span>Gmail Pipeline Link Active</span>
            </div>
          ) : (
            <div className="flex items-center space-x-2 bg-red-50 text-red-600 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest border border-red-100">
               <MailWarning size={14} />
               <span>Bridge Disconnected</span>
            </div>
          )}
          
          <button 
            disabled={syncing}
            onClick={handleSyncNow}
            className={cn(
              "px-8 py-4 rounded-2xl font-black flex items-center space-x-3 shadow-xl transition-all active:scale-95 group",
              syncing ? "bg-stone-100 text-stone-400" : "bg-stone-900 text-white hover:bg-stone-800 shadow-stone-200"
            )}
          >
            <RefreshCw size={20} className={cn(syncing && "animate-spin")} />
            <span>{syncing ? 'Syncing Pipeline...' : 'Manual Sync'}</span>
          </button>
        </div>
      </header>

      {/* Sub-Tabs Navigation */}
      <nav className="flex space-x-1 bg-stone-100 p-1 rounded-2xl w-fit">
        {[
          { id: 'verification', label: 'Email Matching', icon: <Mail size={16} /> },
          { id: 'wallets', label: 'Wallet Credits', icon: <Wallet size={16} /> },
          { id: 'audit', label: 'Audit Log', icon: <Shield size={16} /> },
          { id: 'logs', label: 'System Logs', icon: <History size={16} /> },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id as any)}
            className={cn(
              "flex items-center space-x-2 px-6 py-3 rounded-xl text-xs font-bold transition-all",
              activeSubTab === tab.id ? "bg-white text-stone-900 shadow-sm" : "text-stone-400 hover:text-stone-600"
            )}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </nav>

      {/* Content Area */}
      <div className="bg-white rounded-[2.5rem] shadow-sm border border-stone-100 overflow-hidden">
        {activeSubTab === 'verification' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-stone-50/50 text-stone-400 text-[10px] uppercase font-black tracking-[0.25em]">
                <tr>
                  <th className="px-10 py-8">Origin / Subject</th>
                  <th className="px-6 py-8">Value Extraction</th>
                  <th className="px-6 py-8">Verification Status</th>
                  <th className="px-6 py-8">Linked Protocol</th>
                  <th className="px-10 py-8 text-right">Goverance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-50">
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-10 py-24 text-center text-stone-300 font-bold uppercase tracking-widest text-xs italic">
                      No matching events found in the synchronization cache.
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id} className="hover:bg-stone-50/50 transition-colors">
                      <td className="px-10 py-6">
                        <div className="flex flex-col">
                          <span className="text-xs font-black text-stone-900 truncate max-w-[150px]">{log.sender || 'Bank Alert'}</span>
                          <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mt-1">{new Date(log.created_at).toLocaleString()}</span>
                        </div>
                      </td>
                      <td className="px-6 py-6">
                         <div className="flex flex-col">
                           <span className="text-sm font-black text-stone-900">₹{log.extracted_amount || 0}</span>
                           <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mt-1">Ref: {log.extracted_note || 'N/A'}</span>
                         </div>
                      </td>
                      <td className="px-6 py-6">
                        {log.match_status === 'MATCHED' ? (
                          <div className="flex items-center space-x-2 text-emerald-500">
                            <CheckCircle2 size={16} />
                            <span className="text-[10px] font-black uppercase tracking-widest">Auto Verified</span>
                          </div>
                        ) : log.match_status === 'REVIEW_REQUIRED' ? (
                          <div className="flex items-center space-x-2 text-amber-500">
                             <AlertCircle size={16} />
                             <span className="text-[10px] font-black uppercase tracking-widest">Manual Node Needed</span>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-2 text-stone-300">
                             <XCircle size={16} />
                             <span className="text-[10px] font-black uppercase tracking-widest">Irrelevant</span>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-6 font-mono text-xs text-stone-400">
                        {log.matched_order_id ? (
                           <div className="flex items-center space-x-2">
                              <span className="bg-stone-100 text-stone-600 px-2 py-1 rounded-md">{log.matched_order_id}</span>
                           </div>
                        ) : '---'}
                      </td>
                      <td className="px-10 py-6 text-right">
                         <button 
                           onClick={() => log.matched_order_id && handleManualApprove(log.matched_order_id)}
                           disabled={!log.matched_order_id || log.match_status === 'MATCHED'}
                           className={cn(
                             "px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                             log.match_status === 'MATCHED' ? "bg-stone-50 text-stone-300 cursor-not-allowed" : "bg-primary text-white hover:bg-primary/90 shadow-lg shadow-primary/10"
                           )}
                         >
                           {log.match_status === 'MATCHED' ? 'Resolved' : 'Verify'}
                         </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeSubTab === 'wallets' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-stone-50/50 text-stone-400 text-[10px] uppercase font-black tracking-[0.25em]">
                <tr>
                  <th className="px-10 py-8">Ledger Entity</th>
                  <th className="px-6 py-8">Flow Vector</th>
                  <th className="px-6 py-8">Value (₹)</th>
                  <th className="px-6 py-8">Verification Source</th>
                  <th className="px-10 py-8 text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-50">
                {walletCredits.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-10 py-24 text-center text-stone-300 font-bold uppercase tracking-widest text-xs italic">
                      No monetary ledger transactions recorded.
                    </td>
                  </tr>
                ) : (
                  walletCredits.map((tx) => (
                    <tr key={tx.id} className="hover:bg-stone-50/50 transition-colors">
                       <td className="px-10 py-6">
                        <div className="flex flex-col">
                          <span className="text-xs font-black text-stone-900">{tx.user_name || 'System Ledger'}</span>
                          <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mt-1">ID: {tx.user_id?.slice(0,8)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-6">
                         <div className={cn(
                           "flex items-center space-x-2 w-fit px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest",
                           tx.type === 'credit' ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
                         )}>
                           {tx.type === 'credit' ? <Plus size={12} /> : <ArrowDownLeft size={12} />}
                           <span>{tx.type === 'credit' ? 'Inflow' : 'Outflow'}</span>
                         </div>
                      </td>
                      <td className="px-6 py-6 font-black text-stone-900 border-l border-stone-50">
                        ₹{Math.abs(tx.amount).toLocaleString()}
                      </td>
                      <td className="px-6 py-6 font-medium text-stone-400 text-[11px] max-w-[200px] truncate">
                         {tx.description || 'N/A'}
                      </td>
                      <td className="px-10 py-6 text-right font-mono text-[10px] font-bold text-stone-300">
                         {new Date(tx.created_at).toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeSubTab === 'audit' && (
           <div className="overflow-x-auto">
           <table className="w-full text-left">
             <thead className="bg-stone-50/50 text-stone-400 text-[10px] uppercase font-black tracking-[0.25em]">
               <tr>
                 <th className="px-10 py-8">Administrator</th>
                 <th className="px-6 py-8">Directive</th>
                 <th className="px-6 py-8">Target ID</th>
                 <th className="px-6 py-8">Complexity Details</th>
                 <th className="px-10 py-8 text-right">Horizon Time</th>
               </tr>
             </thead>
             <tbody className="divide-y divide-stone-50 font-mono">
               {auditLogs.map((log) => (
                 <tr key={log.id} className="hover:bg-stone-50/50 transition-colors">
                   <td className="px-10 py-6">
                      <div className="flex items-center space-x-3">
                         <div className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center text-stone-400 text-[10px] font-black">
                            {log.admin_name?.slice(0, 2).toUpperCase() || 'SYS'}
                         </div>
                         <span className="text-xs font-black text-stone-800">{log.admin_name || 'System Auto'}</span>
                      </div>
                   </td>
                   <td className="px-6 py-6">
                      <span className="px-2 py-1 bg-stone-950 text-white rounded text-[9px] font-black uppercase tracking-widest">{log.action || 'INTERACTION'}</span>
                   </td>
                   <td className="px-6 py-6 text-[10px] font-bold text-stone-400">
                      {log.target_id?.slice(0, 12)}...
                   </td>
                   <td className="px-6 py-6 text-[10px] text-stone-500 max-w-[300px] truncate" title={log.details}>
                      {log.details || 'Operational record processed.'}
                   </td>
                   <td className="px-10 py-6 text-right text-[10px] font-bold text-stone-300">
                      {new Date(log.created_at).toLocaleString()}
                   </td>
                 </tr>
               ))}
             </tbody>
           </table>
         </div>
        )}
      </div>
    </div>
  );
}
