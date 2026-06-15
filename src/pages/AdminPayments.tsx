import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, AlertCircle, CheckCircle2, XCircle, 
  Search, Filter, RefreshCcw, Mail, Clock, 
  ArrowRight, ExternalLink, MessageSquare, History,
  Activity, Settings, Loader2, IndianRupee
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import toast from 'react-hot-toast';
import { cn, getAuthHeaders } from '@/lib/utils';
import { fetchWithHandling } from '@/lib/api';

interface EmailLog {
  id: number;
  message_id: string;
  sender: string;
  subject: string;
  body: string;
  extracted_amount: number;
  extracted_note: string;
  extracted_timestamp: string;
  match_status: 'MATCHED' | 'FAILED' | 'REVIEW_REQUIRED';
  match_reason: string;
  matched_order_id: string;
  created_at: string;
}

export default function AdminPayments() {
  const [logs, setLogs] = useState<EmailLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'ALL' | 'MATCHED' | 'FAILED' | 'REVIEW_REQUIRED'>('ALL');
  const [status, setStatus] = useState<any>(null);

  const [activeTab, setActiveTab] = useState<'EMAILS' | 'WALLET' | 'AUDIT'>('EMAILS');
  const [walletLogs, setWalletLogs] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const [emails, wallet, audit] = await Promise.all([
        fetchWithHandling<EmailLog[]>('/api/admin/emails-log', { headers: getAuthHeaders() }),
        fetchWithHandling<any[]>('/api/admin/wallet-credits', { headers: getAuthHeaders() }),
        fetchWithHandling<any[]>('/api/admin/audit-logs', { headers: getAuthHeaders() })
      ]);
      
      if (emails) setLogs(emails);
      if (wallet) setWalletLogs(wallet);
      if (audit) setAuditLogs(audit);
    } catch (err) {
      console.error('Failed to fetch admin data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStatus = async () => {
    try {
      const data = await fetchWithHandling<any>('/api/admin/payment-system-status', {
        headers: getAuthHeaders()
      });
      if (data) setStatus(data);
    } catch (err) {
      console.error('Failed to fetch status:', err);
    }
  };

  useEffect(() => {
    fetchLogs();
    fetchStatus();
    const interval = setInterval(fetchLogs, 30000); // refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const syncNow = async () => {
    setIsLoading(true);
    try {
      const data = await fetchWithHandling<any>('/api/admin/payment-sync-now', { 
        method: 'POST',
        headers: getAuthHeaders()
      });
      if (data) {
        if (data.success) {
          toast.success(data.message);
          fetchLogs();
        } else {
          toast.error(data.message);
        }
      }
    } catch (err) {
      console.error('Sync failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      log.matched_order_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.extracted_note?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.body || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filter === 'ALL' || log.match_status === filter;
    
    return matchesSearch && matchesFilter;
  });

  const filteredWallet = walletLogs.filter(w => 
    w.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    w.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredAudit = auditLogs.filter(a => 
    a.admin_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.details?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleManualApprove = async (orderId: string) => {
    const reason = window.prompt(`Approve Order ${orderId}? Enter internal note:`, 'Approved manually by admin');
    if (reason === null) return;
    
    try {
      const data = await fetchWithHandling<any>(`/api/admin/orders/${orderId}/manual-approve`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ notes: reason })
      });
      if (data) {
        toast.success('Order approved successfully');
        fetchLogs();
      }
    } catch (err) {
      console.error('Error approving order:', err);
    }
  };

  return (
    <div className="h-[calc(100vh-4.5rem)] bg-stone-50 overflow-y-auto no-scrollbar scroll-smooth">
      <div className="max-w-7xl mx-auto p-6 md:p-10 space-y-8 pb-32">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-stone-900 flex items-center gap-3">
              <ShieldCheck className="text-primary" size={32} />
              Payment & Audit System
            </h1>
            <p className="text-stone-500 font-medium mt-1">Automated verification, manual overrides & security logs</p>
          </div>
          <div className="flex items-center gap-3">
            <div className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold border",
              status?.gmailConfigured ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-red-50 text-red-700 border-red-100"
            )}>
              <div className={cn("w-2 h-2 rounded-full", status?.gmailConfigured ? "bg-emerald-500 animate-pulse" : "bg-red-500")} />
              {status?.gmailConfigured ? "Gmail API: Active" : "Gmail API: Stopped"}
            </div>
            <button 
              onClick={syncNow}
              disabled={isLoading}
              className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white rounded-xl text-xs font-black shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
            >
              <RefreshCcw size={16} className={isLoading ? "animate-spin" : ""} />
              Sync Gmail Now
            </button>
            <button 
              onClick={fetchLogs}
              className="p-3 bg-white border border-stone-200 rounded-xl hover:bg-stone-50 transition-colors text-stone-600 shadow-sm"
              title="Refresh All"
            >
              <RefreshCcw size={18} className={isLoading ? "animate-spin" : ""} />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center space-x-1 bg-stone-200/50 p-1 rounded-2xl w-fit">
          <button 
            onClick={() => setActiveTab('EMAILS')}
            className={cn(
              "px-6 py-2.5 rounded-xl text-xs font-black transition-all",
              activeTab === 'EMAILS' ? "bg-white text-stone-900 shadow-sm" : "text-stone-500 hover:bg-white/50"
            )}
          >
            Email Verification Logs
          </button>
          <button 
            onClick={() => setActiveTab('WALLET')}
            className={cn(
              "px-6 py-2.5 rounded-xl text-xs font-black transition-all",
              activeTab === 'WALLET' ? "bg-white text-stone-900 shadow-sm" : "text-stone-500 hover:bg-white/50"
            )}
          >
            Wallet Tracking
          </button>
          <button 
            onClick={() => setActiveTab('AUDIT')}
            className={cn(
              "px-6 py-2.5 rounded-xl text-xs font-black transition-all",
              activeTab === 'AUDIT' ? "bg-white text-stone-900 shadow-sm" : "text-stone-500 hover:bg-white/50"
            )}
          >
            System Audit Logs
          </button>
        </div>

        {/* Stats Grid - context aware */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-3xl border border-stone-100 shadow-sm">
            <p className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-2">
              {activeTab === 'EMAILS' ? 'Scanned Messages' : activeTab === 'WALLET' ? 'Total Credits' : 'Audit Actions'}
            </p>
            <p className="text-3xl font-black text-stone-900">
              {activeTab === 'EMAILS' ? logs.length : activeTab === 'WALLET' ? walletLogs.length : auditLogs.length}
            </p>
            <div className="flex items-center gap-1 mt-2 text-[10px] text-stone-500 font-bold">
              <Clock size={12} />
              Last Updated: {status?.lastSync ? new Date(status.lastSync).toLocaleTimeString() : 'N/A'}
            </div>
          </div>
          {activeTab === 'EMAILS' ? (
            <>
              <div className="bg-white p-6 rounded-3xl border border-stone-100 shadow-sm border-l-4 border-l-emerald-500">
                <p className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-2">Auto-Matched</p>
                <p className="text-3xl font-black text-emerald-600">{logs.filter(l => l.match_status === 'MATCHED').length}</p>
                <p className="text-[10px] text-stone-500 font-bold mt-2">Verified via Gmail Note</p>
              </div>
              <div className="bg-white p-6 rounded-3xl border border-stone-100 shadow-sm border-l-4 border-l-amber-500">
                <p className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-2">Pending Review</p>
                <p className="text-3xl font-black text-amber-600">{logs.filter(l => l.match_status === 'REVIEW_REQUIRED').length}</p>
                <p className="text-[10px] text-stone-500 font-bold mt-2">Manual check required</p>
              </div>
              <div className="bg-white p-6 rounded-3xl border border-stone-100 shadow-sm border-l-4 border-l-blue-500">
                <p className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-2">Configured Sender</p>
                <p className="text-sm font-black text-stone-700 truncate">{status?.bankSender?.split('@')[1] || 'hdfcbank.net'}</p>
                <p className="text-[10px] text-stone-500 font-bold mt-2">Trusted bank domain</p>
              </div>
            </>
          ) : activeTab === 'WALLET' ? (
            <>
              <div className="bg-white p-6 rounded-3xl border border-stone-100 shadow-sm border-l-4 border-l-emerald-500">
                <p className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-2">Total Value</p>
                <p className="text-3xl font-black text-emerald-600">₹{walletLogs.reduce((acc, curr) => acc + curr.amount, 0).toFixed(2)}</p>
                <p className="text-[10px] text-stone-500 font-bold mt-2">Cumulative credit volume</p>
              </div>
              <div className="bg-white p-6 rounded-3xl border border-stone-100 shadow-sm border-l-4 border-l-primary">
                <p className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-2">Unique Users</p>
                <p className="text-3xl font-black text-primary">{new Set(walletLogs.map(w => w.user_id)).size}</p>
                <p className="text-[10px] text-stone-500 font-bold mt-2">Paying customer base</p>
              </div>
            </>
          ) : null}
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-2xl border border-stone-100 shadow-sm flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
            <input 
              type="text" 
              placeholder={`Search ${activeTab.toLowerCase()}...`}
              className="w-full pl-10 pr-4 py-3 bg-stone-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary/20"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          {activeTab === 'EMAILS' && (
            <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0">
              {(['ALL', 'MATCHED', 'REVIEW_REQUIRED', 'FAILED'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={cn(
                    "px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap",
                    filter === f 
                      ? "bg-primary text-white shadow-lg shadow-primary/20" 
                      : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                  )}
                >
                  {f}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Data Tables */}
        <div className="bg-white rounded-3xl border border-stone-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            {activeTab === 'EMAILS' ? (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-stone-50 border-b border-stone-100">
                    <th className="px-6 py-4 text-[10px] font-bold text-stone-400 uppercase tracking-widest">Transaction / Date</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-stone-400 uppercase tracking-widest">Extracted Info</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-stone-400 uppercase tracking-widest">Status</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-stone-400 uppercase tracking-widest">Details / Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-50">
                  {isLoading ? (
                    Array(5).fill(0).map((_, i) => (
                      <tr key={i} className="animate-pulse">
                        <td colSpan={4} className="px-6 py-8">
                          <div className="h-10 bg-stone-100 rounded-xl" />
                        </td>
                      </tr>
                    ))
                  ) : filteredLogs.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-20 text-center text-stone-400 italic">No logs found.</td>
                    </tr>
                  ) : (
                    filteredLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-stone-50 transition-colors group">
                        <td className="px-6 py-6">
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                              log.match_status === 'MATCHED' ? "bg-emerald-100 text-emerald-600" : 
                              log.match_status === 'REVIEW_REQUIRED' ? "bg-amber-100 text-amber-600" :
                              "bg-stone-100 text-stone-400"
                            )}>
                               <Mail size={18} />
                            </div>
                            <div>
                              <p className="text-xs font-bold text-stone-900 mb-1">Message #{log.message_id.substring(0, 8)}</p>
                              <p className="text-[10px] text-stone-400 flex items-center gap-1 font-medium">
                                <Clock size={10} />
                                {new Date(log.created_at).toLocaleString()}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-6 font-medium">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                               <span className="text-sm font-black text-stone-900">₹{log.extracted_amount || '0'}</span>
                               <span className="text-[10px] text-primary bg-primary/5 px-2 py-0.5 rounded-full border border-primary/10 font-bold uppercase">{log.extracted_note || 'No Note'}</span>
                            </div>
                            <p className="text-[10px] text-stone-400 truncate max-w-[200px]">{log.body}</p>
                          </div>
                        </td>
                        <td className="px-6 py-6">
                          <div className={cn(
                            "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider",
                            log.match_status === 'MATCHED' ? "bg-emerald-100 text-emerald-800" :
                            log.match_status === 'REVIEW_REQUIRED' ? "bg-amber-100 text-amber-800" :
                            "bg-stone-100 text-stone-800"
                          )}>
                            {log.match_status === 'MATCHED' && <CheckCircle2 size={12} />}
                            {log.match_status === 'REVIEW_REQUIRED' && <Clock size={12} />}
                            {log.match_status === 'FAILED' && <XCircle size={12} />}
                            {log.match_status}
                          </div>
                        </td>
                        <td className="px-6 py-6 font-medium text-xs">
                          <div className="flex items-center justify-between gap-4">
                            <div className="max-w-[250px]">
                              <p className={cn(
                                "text-[10px] font-bold leading-tight",
                                log.match_status === 'REVIEW_REQUIRED' ? "text-amber-700" : "text-stone-600"
                              )}>{log.match_reason}</p>
                              {log.match_status === 'MATCHED' && (
                                <p className="text-[10px] text-emerald-600 font-black mt-1">Matched with: {log.matched_order_id}</p>
                              )}
                              {log.match_status === 'REVIEW_REQUIRED' && log.matched_order_id && (
                                <p className="text-[10px] text-amber-500 font-black mt-1 italic">Potential match: {log.matched_order_id}</p>
                              )}
                            </div>
                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              {log.match_status === 'REVIEW_REQUIRED' && log.matched_order_id && (
                                <button 
                                  onClick={() => handleManualApprove(log.matched_order_id)}
                                  className="p-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-500/20"
                                  title="Approve Manually"
                                >
                                  <CheckCircle2 size={16} />
                                </button>
                              )}
                              <button className="p-2 bg-white border border-stone-200 text-stone-500 rounded-lg hover:bg-stone-100 transition-colors">
                                <ExternalLink size={16} />
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            ) : activeTab === 'WALLET' ? (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-stone-100/50 border-b border-stone-200">
                    <th className="px-6 py-4 text-[10px] font-black text-stone-400 uppercase tracking-[0.2em]">User Transaction</th>
                    <th className="px-6 py-4 text-[10px] font-black text-stone-400 uppercase tracking-[0.2em]">Value</th>
                    <th className="px-6 py-4 text-[10px] font-black text-stone-400 uppercase tracking-[0.2em]">Context / Reason</th>
                    <th className="px-6 py-4 text-[10px] font-black text-stone-400 uppercase tracking-[0.2em] text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-50">
                  {filteredWallet.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-20 text-center text-stone-400 italic">No wallet transactions found.</td>
                    </tr>
                  ) : (
                    filteredWallet.map((credit) => (
                      <tr key={credit.id} className="hover:bg-stone-50 transition-colors group">
                        <td className="px-6 py-6">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center font-black">
                              {credit.user_name?.[0] || 'U'}
                            </div>
                            <div>
                              <p className="text-sm font-black text-stone-900">{credit.user_name}</p>
                              <p className="text-[10px] text-stone-400 font-bold">{new Date(credit.created_at).toLocaleString('en-IN')}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-6 font-black text-lg text-emerald-600">
                           ₹{credit.amount}
                        </td>
                        <td className="px-6 py-6">
                           <p className="text-xs font-bold text-stone-800">{credit.description}</p>
                           <span className="text-[9px] bg-stone-100 text-stone-400 px-2 py-0.5 rounded-full font-black uppercase tracking-widest border border-stone-200 mt-1 inline-block">
                              {credit.type || 'wallet_load'}
                           </span>
                        </td>
                        <td className="px-6 py-6 text-right">
                           <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-end space-x-2">
                              <button 
                                onClick={() => toast.success('Sending receipt to user email...')}
                                className="p-2 bg-white border border-stone-200 text-stone-400 hover:text-primary rounded-lg transition-colors"
                              >
                                <Mail size={16} />
                              </button>
                              <button className="p-2 bg-white border border-stone-200 text-stone-400 hover:text-primary rounded-lg transition-colors">
                                <ExternalLink size={16} />
                              </button>
                           </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-stone-50 border-b border-stone-100">
                    <th className="px-6 py-4 text-[10px] font-bold text-stone-400 uppercase tracking-widest">Admin / Date</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-stone-400 uppercase tracking-widest">Action</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-stone-400 uppercase tracking-widest">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-50">
                  {filteredAudit.map((audit) => (
                    <tr key={audit.id} className="hover:bg-stone-50 transition-colors">
                      <td className="px-6 py-6">
                        <p className="text-xs font-bold text-stone-900">{audit.admin_name || 'System'}</p>
                        <p className="text-[10px] text-stone-400">{new Date(audit.created_at).toLocaleString()}</p>
                      </td>
                      <td className="px-6 py-6">
                        <span className="px-2 py-1 bg-stone-100 text-stone-800 text-[10px] font-black rounded-md border border-stone-200">
                          {audit.action}
                        </span>
                      </td>
                      <td className="px-6 py-6">
                        <p className="text-[10px] font-bold text-stone-600 leading-tight">{audit.details}</p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* System Logs / Help */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-stone-900 rounded-3xl p-8 text-white space-y-6">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <Activity className="text-primary" />
              Matching Rules
            </h3>
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0 text-primary">1</div>
                <div>
                  <p className="text-sm font-bold">Order ID Match</p>
                  <p className="text-xs text-stone-400 mt-1">The note/remark in UPI transaction MUST contain the exact Order ID (e.g., ORD-171...).</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0 text-primary">2</div>
                <div>
                  <p className="text-sm font-bold">Amount Validation</p>
                  <p className="text-xs text-stone-400 mt-1">Extracted amount from email must match order total precisely.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0 text-primary">3</div>
                <div>
                  <p className="text-sm font-bold">Time Window</p>
                  <p className="text-xs text-stone-400 mt-1">Payments are only processed if the timestamp is within 3 hours of order creation.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-8 rounded-3xl border border-stone-200 space-y-6">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <Settings className="text-stone-400" />
              Configurations
            </h3>
            <div className="space-y-4">
               <div>
                  <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Trusted Sender Email</label>
                  <div className="mt-1 p-3 bg-stone-50 rounded-xl border border-stone-100 flex items-center justify-between">
                     <span className="text-sm font-medium text-stone-700">{status?.bankSender || 'alerts@hdfcbank.net'}</span>
                     <Mail size={14} className="text-stone-300" />
                  </div>
               </div>
               <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10">
                  <p className="text-xs font-bold text-primary mb-1">Configuration Note:</p>
                  <p className="text-[10px] text-stone-600 leading-relaxed italic">Gmail Refresh Tokens expire after 7 days if your App is in 'Testing' mode. For production, ensure the app is published in Google Cloud Console.</p>
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
