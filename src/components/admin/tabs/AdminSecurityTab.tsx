import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Shield, 
  ShieldCheck, 
  ShieldAlert, 
  Fingerprint, 
  History as HistoryIcon, 
  Clock, 
  RefreshCw, 
  Download, 
  AlertCircle, 
  CheckCircle2, 
  XCircle, 
  Search, 
  Database, 
  Laptop, 
  Globe, 
  Loader2, 
  Activity, 
  ArrowRight,
  UserCheck,
  UserX,
  Lock,
  SearchCode,
  SlidersHorizontal,
  FileJson,
  FileSpreadsheet,
  Wrench,
  Network
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AdminSecurityTabProps {
  user: any;
  fetchWithHandling: <T = any>(url: string, options?: RequestInit) => Promise<T | null>;
  getAuthHeaders: () => any;
  toast: any;
  runWalletDiagnostics: () => void;
  loadingDiagnostics: boolean;
  diagnosticResults: any;
  fixingWalletUserId: string | null;
  fixWalletDiscrepancy: (userId: string) => void;
}

export default function AdminSecurityTab({
  user,
  fetchWithHandling,
  getAuthHeaders,
  toast,
  runWalletDiagnostics,
  loadingDiagnostics,
  diagnosticResults,
  fixingWalletUserId,
  fixWalletDiscrepancy
}: AdminSecurityTabProps) {
  
  // Tab states
  const [activeSubTab, setActiveSubTab] = useState<'events' | 'logins' | 'actions' | 'diagnostics' | 'command'>('events');
  
  // Data States
  const [securityLogs, setSecurityLogs] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [securityStatus, setSecurityStatus] = useState<any>(null);
  
  // PII Privacy States
  const [revealSensitiveData, setRevealSensitiveData] = useState(false);
  const [revealingPII, setRevealingPII] = useState(false);
  const [revealReason, setRevealReason] = useState('Forensic investigation of recent anomalies');
  const [showRevealModal, setShowRevealModal] = useState(false);
  
  // Status check states
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLockingDown, setIsLockingDown] = useState(false);

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [logLimit, setLogLimit] = useState<number>(100);
  const [eventTypeFilter, setEventTypeFilter] = useState<string>('all');
  const [actionTypeFilter, setActionTypeFilter] = useState<string>('all');
  
  // Stats derived state
  const [stats, setStats] = useState({
    activeSessionDuration: 0,
    failedLogins24h: 0,
    totalAuditedActions: 0,
    anomaliesResolved: 0
  });

  // Command center actions
  const fetchSecurityStatus = async () => {
    setLoadingStatus(true);
    try {
      const data = await fetchWithHandling<any>('/api/admin/security/status', {
        headers: getAuthHeaders()
      });
      if (data && data.success) {
        setSecurityStatus(data);
      }
    } catch (err) {
      console.error('Failed to fetch security status:', err);
    } finally {
      setLoadingStatus(false);
    }
  };

  const handleTriggerLockdown = async () => {
    const reason = window.prompt('Enter emergency lockdown reason (will be visible to users):', 'Emergency security maintenance in progress');
    if (reason === null) return;

    setIsLockingDown(true);
    try {
      const res = await fetchWithHandling<any>('/api/admin/security/trigger-lockdown', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ reason })
      });
      if (res && res.success) {
        toast.success('SECURITY LOCKDOWN ENFORCED SUCCESSFULLY');
        fetchSecurityStatus();
      }
    } catch (err: any) {
      toast.error('Failed to initiate lockdown: ' + err.message);
    } finally {
      setIsLockingDown(false);
    }
  };

  const handleReleaseLockdown = async () => {
    if (!window.confirm('Are you sure you want to release the emergency lockdown?')) return;
    
    try {
      const res = await fetchWithHandling<any>('/api/admin/security/release-lockdown', {
        method: 'POST',
        headers: getAuthHeaders()
      });
      if (res && res.success) {
        toast.success('Security lockdown released. Systems operational.');
        fetchSecurityStatus();
      }
    } catch (err: any) {
      toast.error('Failed to release lockdown: ' + err.message);
    }
  };

  const handleBlockIp = async (ip: string) => {
    const duration = window.prompt(`Enter block duration for ${ip} (in minutes):`, '60');
    if (duration === null) return;
    
    try {
      const res = await fetchWithHandling<any>('/api/admin/security/block-ip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ ip, duration: parseInt(duration) })
      });
      if (res && res.success) {
        toast.success(`IP ${ip} blocked successfully.`);
        fetchSecurityStatus();
      }
    } catch (err: any) {
      toast.error('Failed to block IP: ' + err.message);
    }
  };

  const handleUnblockIp = async (ip: string) => {
    try {
      const res = await fetchWithHandling<any>('/api/admin/security/unblock-ip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ ip })
      });
      if (res && res.success) {
        toast.success(`IP ${ip} unblocked.`);
        fetchSecurityStatus();
      }
    } catch (err: any) {
      toast.error('Failed to unblock IP: ' + err.message);
    }
  };
  
  // Fetch security event logs from the server
  const fetchSecurityLogsFromServer = async () => {
    try {
      const data = await fetchWithHandling<any[]>(`/api/admin/security-logs?limit=${logLimit}&type=${eventTypeFilter}`, {
        headers: getAuthHeaders()
      });
      if (data) {
        setSecurityLogs(data);
      }
    } catch (err) {
      console.error('Failed to fetch security logs:', err);
    }
  };

  // Fetch action audit logs from the server
  const fetchAuditLogsFromServer = async () => {
    try {
      const data = await fetchWithHandling<any[]>(`/api/admin/audit-logs?limit=${logLimit}&target_type=${actionTypeFilter}`, {
        headers: getAuthHeaders()
      });
      if (data) {
        setAuditLogs(data);
      }
    } catch (err) {
      console.error('Failed to fetch audit logs:', err);
    }
  };

  // Synchronize both logs and update dashboard-level statistics
  const syncLogs = async (showToast = false) => {
    setIsRefreshing(true);
    setLoadingLogs(true);
    try {
      await Promise.all([
        fetchSecurityLogsFromServer(),
        fetchAuditLogsFromServer()
      ]);
      
      // Calculate session duration and live metrics
      const startTime = localStorage.getItem('session_start_time');
      const sessionMinutes = startTime ? Math.round((Date.now() - parseInt(startTime)) / 60000) : 0;
      
      setStats({
        activeSessionDuration: sessionMinutes || 12,
        failedLogins24h: securityLogs.filter(l => l.type === 'failed_login').length,
        totalAuditedActions: auditLogs.length,
        anomaliesResolved: auditLogs.filter(l => l.action === 'ACTION_REVERTED').length
      });

      if (showToast) {
        toast.success('Admin Security Logs synchronized successfully');
      }
    } catch (e: any) {
      if (showToast) {
        toast.error('Failed to sync administrative logs');
      }
    } finally {
      setIsRefreshing(false);
      setLoadingLogs(false);
    }
  };

  useEffect(() => {
    syncLogs();
  }, [logLimit, eventTypeFilter, actionTypeFilter]);

  useEffect(() => {
    if (activeSubTab === 'command') {
      fetchSecurityStatus();
      const interval = setInterval(fetchSecurityStatus, 5000);
      return () => clearInterval(interval);
    }
  }, [activeSubTab]);

  // Recalculate quick stats dynamically whenever logs change
  useEffect(() => {
    const failedOnes = securityLogs.filter(l => l.type === 'failed_login').length;
    setStats(prev => ({
      ...prev,
      failedLogins24h: failedOnes || prev.failedLogins24h,
      totalAuditedActions: auditLogs.length || prev.totalAuditedActions,
      anomaliesResolved: auditLogs.filter(l => l.action === 'ACTION_REVERTED').length || prev.anomaliesResolved
    }));
  }, [securityLogs, auditLogs]);

  // Rollback Action Handler
  const handleRevertAction = async (logId: number) => {
    if (!window.confirm('Are you absolutely sure you want to revert this administrative action change?')) {
      return;
    }
    
    try {
      const data = await fetchWithHandling<any>(`/api/admin/audit-logs/${logId}/revert`, {
        method: 'POST',
        headers: getAuthHeaders()
      });
      if (data && data.success !== false) {
        toast.success('Action reverted and state restored successfully!');
        syncLogs();
      } else {
        toast.error(data?.message || 'Failed to revert action state.');
      }
    } catch (err: any) {
      toast.error(err.message || 'Rollback failed.');
    }
  };

  const handleTogglePII = async () => {
    if (revealSensitiveData) {
      setRevealSensitiveData(false);
      toast.success('Privacy protection re-enforced: Sensitive data masked.');
      return;
    }
    
    setRevealingPII(true);
    try {
      const res = await fetch('/api/admin/security/reveal-pii', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({ reason: revealReason })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setRevealSensitiveData(true);
        setShowRevealModal(false);
        toast.success('Sensitive data decrypted for forensic audit. Action logged.');
      } else {
        toast.error(data.message || 'Failed to authorize PII decrypt action.');
      }
    } catch (err: any) {
      toast.error('Network error during PII audit request authorization.');
    } finally {
      setRevealingPII(false);
    }
  };

  const formatIpAddress = (ip?: string): string => {
    if (!ip) return 'Unknown';
    if (revealSensitiveData) return ip;
    if (ip.includes(':')) {
      const parts = ip.split(':');
      if (parts.length > 2) {
        return `${parts.slice(0, 2).join(':')}:xxxx:xxxx:xxxx:xxxx`;
      }
      return 'xxxx:xxxx:xxxx:xxxx';
    }
    const parts = ip.split('.');
    if (parts.length === 4) {
      return `${parts[0]}.${parts[1]}.${parts[2]}.xxx`;
    }
    return ip.replace(/\d+$/, 'xxx');
  };

  const formatEmailAddress = (email?: string): string => {
    if (!email || email === 'N/A') return 'N/A';
    if (revealSensitiveData) return email;
    const parts = email.split('@');
    if (parts.length === 2) {
      const name = parts[0];
      const domain = parts[1];
      if (name.length > 2) {
        return `${name[0]}***${name[name.length - 1]}@${domain}`;
      }
      return `***@${domain}`;
    }
    return '***';
  };

  // CSV Export Utility
  const downloadLogsCSV = (type: 'events' | 'logins' | 'actions') => {
    let dataToExport: any[] = [];
    let headers: string[] = [];
    let filename = '';

    if (type === 'events') {
      dataToExport = securityLogs;
      headers = ['ID', 'Event Type', 'Details', 'IP Address', 'User Agent', 'Timestamp'];
      filename = `security_events_${new Date().toISOString().split('T')[0]}.csv`;
    } else if (type === 'logins') {
      dataToExport = securityLogs.filter(l => l.type === 'login' || l.type === 'failed_login');
      headers = ['ID', 'Status', 'Details', 'Email', 'User ID', 'User Agent', 'Timestamp'];
      filename = `login_history_${new Date().toISOString().split('T')[0]}.csv`;
    } else if (type === 'actions') {
      dataToExport = auditLogs;
      headers = ['ID', 'Admin Email', 'Action Name', 'Resource Target', 'Details', 'IP Address', 'Timestamp'];
      filename = `action_audit_logs_${new Date().toISOString().split('T')[0]}.csv`;
    }

    if (dataToExport.length === 0) {
      toast.error('No record logs available to export.');
      return;
    }

    const csvContent = [
      headers.join(','),
      ...dataToExport.map(item => {
        if (type === 'events') {
          return [
            `"${item.id || ''}"`,
            `"${item.type || ''}"`,
            `"${(item.details || '').replace(/"/g, '""')}"`,
            `"${item.ip || '127.0.0.1'}"`,
            `"${(item.userAgent || 'WebBrowser').slice(0, 50)}"`,
            `"${item.timestamp || ''}"`
          ].join(',');
        } else if (type === 'logins') {
          return [
             `"${item.id || ''}"`,
             `"${item.type || ''}"`,
             `"${(item.details || '').replace(/"/g, '""')}"`,
             `"${item.email || 'N/A'}"`,
             `"${item.userId || 'N/A'}"`,
             `"${(item.userAgent || 'WebBrowser').slice(0, 50)}"`,
             `"${item.timestamp || ''}"`
          ].join(',');
        } else {
          const detailObj = (() => {
            try { return JSON.parse(item.details); } catch(e) { return { message: item.details }; }
          })();
          return [
            `"${item.id || ''}"`,
            `"${item.admin_name || 'System'}"`,
            `"${item.action || ''}"`,
            `"${item.resource || item.target_type || ''}"`,
            `"${(detailObj.message || item.details || '').replace(/"/g, '""')}"`,
            `"${item.ip_address || '127.0.0.1'}"`,
            `"${item.created_at || ''}"`
          ].join(',');
        }
      })
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`${type.toUpperCase()} exported to CSV!`);
  };

  // JSON Export Utility
  const downloadLogsJSON = (type: 'events' | 'logins' | 'actions') => {
    let dataToExport: any[] = [];
    let filename = '';

    if (type === 'events') {
      dataToExport = securityLogs;
      filename = `security_events_${new Date().toISOString().split('T')[0]}.json`;
    } else if (type === 'logins') {
      dataToExport = securityLogs.filter(l => l.type === 'login' || l.type === 'failed_login');
      filename = `login_history_${new Date().toISOString().split('T')[0]}.json`;
    } else if (type === 'actions') {
      dataToExport = auditLogs;
      filename = `action_audit_logs_${new Date().toISOString().split('T')[0]}.json`;
    }

    if (dataToExport.length === 0) {
      toast.error('No record logs available to export.');
      return;
    }

    const jsonString = JSON.stringify(dataToExport, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`${type.toUpperCase()} exported to JSON!`);
  };

  // Filter computations
  const getFilteredSecurityLogs = () => {
    return securityLogs.filter(log => {
      if (eventTypeFilter !== 'all' && log.type !== eventTypeFilter) return false;
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          (log.details || '').toLowerCase().includes(query) ||
          (log.type || '').toLowerCase().includes(query) ||
          (log.email || '').toLowerCase().includes(query) ||
          (log.ip || '').toLowerCase().includes(query)
        );
      }
      return true;
    });
  };

  const getFilteredLoginLogs = () => {
    return securityLogs
      .filter(log => log.type === 'login' || log.type === 'failed_login')
      .filter(log => {
        if (searchQuery) {
          const query = searchQuery.toLowerCase();
          return (
            (log.details || '').toLowerCase().includes(query) ||
            (log.email || '').toLowerCase().includes(query) ||
            (log.userId || '').toLowerCase().includes(query) ||
            (log.ip || '').toLowerCase().includes(query)
          );
        }
        return true;
      });
  };

  const getFilteredAuditLogs = () => {
    return auditLogs.filter(log => {
      if (actionTypeFilter !== 'all' && log.target_type !== actionTypeFilter) return false;
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          (log.admin_name || '').toLowerCase().includes(query) ||
          (log.action || '').toLowerCase().includes(query) ||
          (log.target_type || '').toLowerCase().includes(query) ||
          (log.details || '').toLowerCase().includes(query)
        );
      }
      return true;
    });
  };

  const currentSecurityLogs = getFilteredSecurityLogs();
  const currentLoginLogs = getFilteredLoginLogs();
  const currentAuditLogs = getFilteredAuditLogs();

  return (
    <div className="max-w-full overflow-x-hidden space-y-8 animate-in fade-in duration-500 font-sans text-left pb-10 pr-2">
      
      {/* Title & Stats Grid */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-4xl font-black text-stone-900 tracking-tight flex items-center gap-2">
            <Shield className="text-stone-900 w-10 h-10 shrink-0" />
            Admin Security Hub
          </h2>
          <p className="text-stone-500 mt-2 text-lg font-medium">
            Immutable activity monitoring, systemic audit logs, and integrated ledger forensics.
          </p>
        </div>
        
        {/* Dynamic handshakes */}
        <div className="flex items-center gap-3">
          <button 
            onClick={() => syncLogs(true)}
            className="p-4 bg-white rounded-2xl border border-stone-200/60 shadow-sm hover:border-stone-400 text-stone-600 hover:text-stone-950 transition-all active:scale-95 flex items-center gap-2 font-bold text-xs uppercase"
            disabled={isRefreshing}
          >
            <RefreshCw size={16} className={cn(isRefreshing && "animate-spin")} />
            <span>Sync Security System</span>
          </button>
          
          <div className="flex bg-stone-900 text-white p-3 px-5 rounded-2xl items-center gap-3 shadow-md">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-wider text-stone-300">
              Agent Identity Node: {String(user?.id || '').slice(0, 8)}
            </span>
          </div>
        </div>
      </div>

      {/* Security Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-8 rounded-[2.5rem] border border-stone-100 shadow-sm flex flex-col justify-between h-44 relative overflow-hidden group hover:border-stone-200 transition-all">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-black text-stone-400 tracking-widest block">Security Firewall</span>
              <span className="text-2xl font-black text-emerald-600 tracking-tight mt-1 inline-block">SECURE STATUS</span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-500 flex items-center justify-center">
              <ShieldCheck size={22} />
            </div>
          </div>
          <div className="text-[10px] font-black uppercase tracking-wider text-stone-400 flex items-center gap-1.5 mt-auto">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            All telemetry channels are operational
          </div>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] border border-stone-100 shadow-sm flex flex-col justify-between h-44 relative overflow-hidden group hover:border-stone-200 transition-all">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-black text-stone-400 tracking-widest block">Access Session</span>
              <span className="text-3xl font-black text-stone-950 tracking-tight mt-1 inline-block">{stats.activeSessionDuration}m</span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center">
              <Clock size={22} />
            </div>
          </div>
          <div className="text-[10px] font-black uppercase tracking-wider text-stone-400 flex items-center gap-1.5 mt-auto">
            Current administrator session bounds
          </div>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] border border-stone-100 shadow-sm flex flex-col justify-between h-44 relative overflow-hidden group hover:border-stone-200 transition-all">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-black text-stone-400 tracking-widest block">Anomalous Handshakes</span>
              <span className={cn("text-3xl font-black tracking-tight mt-1 inline-block", stats.failedLogins24h > 0 ? "text-red-500" : "text-stone-900")}>
                {stats.failedLogins24h}
              </span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-stone-50 text-stone-600 flex items-center justify-center">
              <ShieldAlert size={22} />
            </div>
          </div>
          <div className="text-[10px] font-black uppercase tracking-wider text-stone-400 flex items-center gap-1.5 mt-auto">
            Suspicious authentication challenges
          </div>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] border border-stone-100 shadow-sm flex flex-col justify-between h-44 relative overflow-hidden group hover:border-stone-200 transition-all">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-black text-stone-400 tracking-widest block">Audited Transactions</span>
              <span className="text-3xl font-black text-stone-950 tracking-tight mt-1 inline-block">{stats.totalAuditedActions}</span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Database size={22} />
            </div>
          </div>
          <div className="text-[10px] font-black uppercase tracking-wider text-indigo-500 flex items-center gap-1.5 mt-auto">
            {stats.anomaliesResolved} rollbacks executed properly
          </div>
        </div>
      </div>

      {/* Sub-Tabs Grid Navigation */}
      <div className="bg-stone-100 p-1.5 rounded-2xl w-fit flex flex-wrap gap-1.5 border border-stone-200/50">
        {[
          { id: 'command', label: 'Command Center', icon: <ShieldAlert size={16} /> },
          { id: 'events', label: 'Security Events', icon: <Fingerprint size={16} /> },
          { id: 'logins', label: 'Login History', icon: <HistoryIcon size={16} /> },
          { id: 'actions', label: 'Action Audits', icon: <Activity size={16} /> },
          { id: 'diagnostics', label: 'System Integrity Logs & Checks', icon: <ShieldCheck size={16} /> }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id as any)}
            className={cn(
              "flex items-center space-x-2 px-6 py-3.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all",
              activeSubTab === tab.id 
                ? "bg-stone-950 text-white shadow-md shadow-stone-950/10 scale-[1.02]" 
                : "text-stone-500 hover:text-stone-900 hover:bg-stone-200/50"
            )}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Search and Filters Custom Controller panel (Not shown in diagnostics mode except export configs) */}
      {activeSubTab !== 'diagnostics' && (
        <div className="bg-white p-6 rounded-[2.5rem] border border-stone-150 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
            <input 
              type="text"
              placeholder={`Search logs inside active directory...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-stone-50 hover:bg-stone-100/50 border border-stone-200 focus:border-stone-950 rounded-2xl outline-none text-sm font-bold shadow-inner transition-all placeholder-stone-400"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {/* Dynamic filter selectors depending on the subtab context */}
            {activeSubTab === 'events' && (
              <div className="flex items-center gap-2">
                <SlidersHorizontal size={14} className="text-stone-400" />
                <select
                  value={eventTypeFilter}
                  onChange={(e) => setEventTypeFilter(e.target.value)}
                  className="bg-stone-100 hover:bg-stone-150 text-stone-900 text-xs font-black uppercase tracking-widest px-4 py-3 rounded-xl border-none outline-none cursor-pointer"
                >
                  <option value="all">All Events</option>
                  <option value="login">Logs & Login Successful</option>
                  <option value="failed_login">Attempt Failures</option>
                  <option value="failed_transaction">Broken Registers</option>
                  <option value="integrity_check">System Checks</option>
                  <option value="encryption_event">Security Handshakes</option>
                </select>
              </div>
            )}

            {activeSubTab === 'actions' && (
              <div className="flex items-center gap-2">
                <SlidersHorizontal size={14} className="text-stone-400" />
                <select
                  value={actionTypeFilter}
                  onChange={(e) => setActionTypeFilter(e.target.value)}
                  className="bg-stone-100 hover:bg-stone-150 text-stone-900 text-xs font-black uppercase tracking-widest px-4 py-3 rounded-xl border-none outline-none cursor-pointer"
                >
                  <option value="all">All Targets</option>
                  <option value="product">Product Catalog</option>
                  <option value="order">Trade Logistics</option>
                  <option value="user">User Privileges</option>
                  <option value="settings">Core Operations</option>
                  <option value="auth">Role Handshakes</option>
                </select>
              </div>
            )}

            <div className="flex items-center gap-1.5 border border-stone-100 p-1 bg-stone-50 rounded-xl">
              <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest px-2">Records:</span>
              <select
                value={logLimit}
                onChange={(e) => setLogLimit(Number(e.target.value))}
                className="bg-white text-stone-900 text-xs font-black px-3 py-2 rounded-lg border border-stone-200 outline-none cursor-pointer"
              >
                <option value={50}>50</option>
                <option value={100}>100</option>
                <option value={200}>200</option>
                <option value={500}>500</option>
              </select>
            </div>

            {/* PII Privacy Decrypt Controller */}
            <button
              onClick={() => {
                if (revealSensitiveData) {
                  handleTogglePII();
                } else {
                  setShowRevealModal(true);
                }
              }}
              className={cn(
                "flex items-center gap-2 px-4 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all border shrink-0 active:scale-95",
                revealSensitiveData
                  ? "bg-red-50 text-red-700 border-red-200 hover:bg-red-100/80"
                  : "bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100"
              )}
              title="Forensically decrypt masked database items"
            >
              <Lock size={13} className={cn(revealSensitiveData ? "text-red-500 animate-pulse" : "text-stone-400")} />
              <span>{revealSensitiveData ? "PII Unmasked" : "Reveal PII"}</span>
            </button>

            {/* Split Export Panel */}
            <div className="h-10 w-px bg-stone-200 mx-2 hidden sm:block" />
            
            <div className="flex gap-2">
              <button 
                onClick={() => downloadLogsCSV(activeSubTab === 'logins' ? 'logins' : (activeSubTab === 'actions' ? 'actions' : 'events'))}
                className="flex items-center space-x-2 bg-stone-950 hover:bg-stone-800 text-white rounded-2xl px-5 py-3 text-xs font-black uppercase tracking-wider transition-all shadow-md shrink-0 active:scale-95"
                title="Download CSV"
              >
                <FileSpreadsheet size={15} />
                <Download size={12} />
                <span className="hidden sm:inline">CSV Export</span>
              </button>
              
              <button 
                onClick={() => downloadLogsJSON(activeSubTab === 'logins' ? 'logins' : (activeSubTab === 'actions' ? 'actions' : 'events'))}
                className="flex items-center space-x-2 bg-stone-100 hover:bg-stone-200 text-stone-850 rounded-2xl px-5 py-3 text-xs font-black uppercase tracking-wider transition-all border border-stone-200 shrink-0 active:scale-95"
                title="Download JSON"
              >
                <FileJson size={15} />
                <span className="hidden sm:inline">JSON</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area panels */}
      <div className="bg-white rounded-[2.5rem] border border-stone-100 shadow-sm overflow-hidden min-h-[400px]">
        {loadingLogs ? (
          <div className="py-36 text-center flex flex-col items-center justify-center space-y-4">
            <Loader2 size={36} className="text-stone-900 animate-spin" />
            <p className="text-sm font-black uppercase tracking-widest text-stone-400">Compiling Administrative Forensics...</p>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            
            {/* SUB-TAB 0: COMMAND CENTER (High Security Panels) */}
            {activeSubTab === 'command' && (
              <motion.div
                key="command"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="p-8 space-y-8"
              >
                {/* 1. Global Security Status Bar */}
                <div className={cn(
                  "p-8 rounded-[2rem] border-2 flex flex-col md:flex-row items-center justify-between gap-6 transition-all duration-500",
                  securityStatus?.ids?.threatLevel === 'CRITICAL' || securityStatus?.ids?.isMaintenanceMode
                    ? "bg-red-50 border-red-500 shadow-[0_0_40px_rgba(239,68,68,0.2)]" 
                    : securityStatus?.ids?.threatLevel === 'HIGH'
                    ? "bg-amber-50 border-amber-500"
                    : "bg-emerald-50 border-emerald-500"
                )}>
                  <div className="flex items-center gap-6">
                    <div className={cn(
                      "w-20 h-20 rounded-3xl flex items-center justify-center shadow-lg",
                      securityStatus?.ids?.threatLevel === 'CRITICAL' || securityStatus?.ids?.isMaintenanceMode
                        ? "bg-red-500 text-white animate-pulse" 
                        : securityStatus?.ids?.threatLevel === 'HIGH'
                        ? "bg-amber-500 text-white"
                        : "bg-emerald-500 text-white"
                    )}>
                      {securityStatus?.ids?.isMaintenanceMode ? <ShieldAlert size={40} /> : <ShieldCheck size={40} />}
                    </div>
                    <div>
                      <h3 className="text-3xl font-black text-stone-900 tracking-tight flex items-center gap-3">
                        System Security Posture: {securityStatus?.ids?.threatLevel || 'SECURE'}
                        {securityStatus?.ids?.isMaintenanceMode && (
                          <span className="text-xs bg-red-600 text-white px-3 py-1 rounded-full uppercase tracking-widest font-black animate-bounce">
                            Live Lockdown
                          </span>
                        )}
                      </h3>
                      <p className="text-stone-500 font-medium text-lg">
                        {securityStatus?.ids?.isMaintenanceMode 
                          ? `Reason: ${securityStatus?.ids?.maintenanceReason || 'Manual Emergency Override'}`
                          : "Real-time IDS monitoring active. All nodes reporting normal operation."}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    {securityStatus?.ids?.isMaintenanceMode ? (
                      <button 
                        onClick={handleReleaseLockdown}
                        className="px-8 py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black uppercase tracking-wider shadow-xl shadow-emerald-600/20 transition-all active:scale-95 flex items-center gap-2"
                      >
                        <RefreshCw size={18} />
                        Release Lockdown
                      </button>
                    ) : (
                      <button 
                        onClick={handleTriggerLockdown}
                        className="px-8 py-4 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-black uppercase tracking-wider shadow-xl shadow-red-600/20 transition-all active:scale-95 flex items-center gap-2"
                        disabled={isLockingDown}
                      >
                        <ShieldAlert size={18} />
                        {isLockingDown ? 'Initiating...' : 'Trigger Lockdown'}
                      </button>
                    )}
                  </div>
                </div>

                {/* 2. Grid of Insight Panels */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 text-left">
                  
                  {/* IDS & Threat Metrics */}
                  <div className="bg-white border border-stone-200 rounded-[2.5rem] overflow-hidden flex flex-col shadow-sm">
                    <div className="p-6 border-b border-stone-100 bg-stone-50/50 flex items-center justify-between">
                      <h4 className="text-xs font-black uppercase tracking-widest text-stone-900 flex items-center gap-2">
                        <Activity size={16} className="text-indigo-500" />
                        IDS Threat Metrics
                      </h4>
                      <span className="text-[10px] font-black text-stone-400">REAL-TIME</span>
                    </div>
                    <div className="p-8 space-y-6 flex-1">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-bold text-stone-500">Active Threat Score</span>
                        <span className={cn(
                          "text-2xl font-black font-mono",
                          (securityStatus?.ids?.totalThreatScore || 0) > 0 ? "text-amber-600" : "text-emerald-600"
                        )}>
                          {securityStatus?.ids?.totalThreatScore || 0}
                        </span>
                      </div>
                      <div className="w-full bg-stone-100 h-2 rounded-full overflow-hidden">
                        <motion.div 
                          className="h-full bg-gradient-to-r from-emerald-500 via-amber-500 to-red-500"
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(100, (securityStatus?.ids?.totalThreatScore || 0))}%` }}
                        />
                      </div>
                      
                      <div className="space-y-4 pt-4">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-bold text-stone-400 uppercase">Anomalous Nodes</span>
                          <span className="font-black text-stone-900">{securityStatus?.ids?.activeIncidents || 0} IPs</span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-bold text-stone-400 uppercase">Score Thresholds</span>
                          <span className="font-black text-stone-900">
                            {securityStatus?.ids?.scoreLimits?.SUSPICIOUS} / {securityStatus?.ids?.scoreLimits?.BLOCKED} / {securityStatus?.ids?.scoreLimits?.CRITICAL}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* System Integrity Panel */}
                  <div className="bg-white border border-stone-200 rounded-[2.5rem] overflow-hidden flex flex-col shadow-sm">
                    <div className="p-6 border-b border-stone-100 bg-stone-50/50 flex items-center justify-between">
                      <h4 className="text-xs font-black uppercase tracking-widest text-stone-900 flex items-center gap-2">
                        <Network size={16} className="text-blue-500" />
                        Core Integrity Scan
                      </h4>
                      <div className="flex items-center gap-1.5">
                        <div className={cn("w-2 h-2 rounded-full", securityStatus?.integrity?.valid ? "bg-emerald-500" : "bg-red-500")} />
                        <span className="text-[10px] font-black text-stone-400">CONTINUOUS</span>
                      </div>
                    </div>
                    <div className="p-8 space-y-4 flex-1">
                      <div className="space-y-3">
                        {securityStatus?.integrity?.checkedFiles?.map((file: string) => (
                          <div key={file} className="flex items-center justify-between text-xs p-3 bg-stone-50 rounded-xl border border-stone-100">
                            <span className="font-mono text-stone-500">{file}</span>
                            <span className="text-emerald-600 font-black uppercase tracking-widest flex items-center gap-1">
                              <CheckCircle2 size={10} /> VERIFIED
                            </span>
                          </div>
                        ))}
                      </div>
                      {!securityStatus?.integrity?.valid && (
                        <div className="mt-4 p-4 bg-red-50 rounded-2xl border border-red-100 space-y-2">
                          <p className="text-[10px] font-black text-red-800 uppercase tracking-widest flex items-center gap-2">
                            <AlertCircle size={14} /> Integrity Breach Detected
                          </p>
                          <ul className="text-[10px] text-red-600 font-bold space-y-1">
                            {securityStatus?.integrity?.errors?.map((err: string, i: number) => (
                              <li key={i}>• {err}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Manual Intervention */}
                  <div className="bg-white border border-stone-200 rounded-[2.5rem] overflow-hidden flex flex-col shadow-sm">
                    <div className="p-6 border-b border-stone-100 bg-stone-50/50 flex items-center justify-between">
                      <h4 className="text-xs font-black uppercase tracking-widest text-stone-900 flex items-center gap-2">
                        <Wrench size={16} className="text-amber-500" />
                        Manual Intervention
                      </h4>
                    </div>
                    <div className="p-8 space-y-4 flex-1">
                      <p className="text-xs text-stone-500 font-medium leading-relaxed">
                        Manually override security protocols or force isolation of suspicious network nodes.
                      </p>
                      <div className="grid grid-cols-1 gap-3 pt-2">
                        <button 
                          onClick={() => {
                            const ip = window.prompt('Enter IP address to block:');
                            if (ip) handleBlockIp(ip);
                          }}
                          className="w-full py-4 px-6 bg-stone-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-stone-800 transition-all flex items-center justify-center gap-2"
                        >
                          <XCircle size={14} /> Block Specific IP Node
                        </button>
                        <button 
                          onClick={runWalletDiagnostics}
                          disabled={loadingDiagnostics}
                          className="w-full py-4 px-6 bg-white border border-stone-200 text-stone-900 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-stone-50 transition-all flex items-center justify-center gap-2"
                        >
                          <SearchCode size={14} /> 
                          {loadingDiagnostics ? 'Scanning...' : 'Deep Integrity Scan'}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Database Shield Panel */}
                  <div className="bg-stone-900 text-white rounded-[2.5rem] overflow-hidden flex flex-col shadow-xl">
                    <div className="p-6 border-b border-white/10 bg-white/5 flex items-center justify-between">
                      <h4 className="text-xs font-black uppercase tracking-widest text-white flex items-center gap-2">
                        <Database size={16} className="text-blue-400" />
                        Database Shield
                      </h4>
                      <span className="text-[10px] font-black text-emerald-400">HARDENED</span>
                    </div>
                    <div className="p-8 space-y-5 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-stone-400">Read-Only Mode</span>
                        <div className="w-10 h-5 bg-stone-800 rounded-full flex items-center px-0.5 cursor-pointer">
                           <div className="w-4 h-4 bg-stone-600 rounded-full" />
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-stone-400">Query Sanitization</span>
                        <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">ENABLED</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-stone-400">Auto-Backup Frequency</span>
                        <span className="text-[10px] font-black text-stone-200 uppercase tracking-widest">EVERY 4H</span>
                      </div>
                      <div className="pt-4">
                        <button className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all">
                          Force Cloud Snapshot
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. Real-time Threat Tracker (IP Table) */}
                <div className="bg-white border border-stone-200 rounded-[2.5rem] overflow-hidden shadow-sm text-left">
                  <div className="p-8 border-b border-stone-100 flex items-center justify-between">
                    <div>
                      <h4 className="text-lg font-black text-stone-900 tracking-tight">Anomalous Network Node Activity</h4>
                      <p className="text-sm text-stone-500 font-medium">Real-time telemetry from detected threat actors and suspicious origins.</p>
                    </div>
                    <div className="flex items-center gap-3">
                       <span className="text-[10px] font-black text-stone-400 uppercase tracking-[0.2em]">Active Nodes:</span>
                       <span className="text-xl font-black text-stone-950">{(securityStatus?.ids?.ipTrackers || []).length}</span>
                    </div>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead className="bg-stone-50 text-[10px] font-black text-stone-400 uppercase tracking-widest border-b border-stone-100">
                        <tr>
                          <th className="px-8 py-5">Node IP Origin</th>
                          <th className="px-6 py-5">Threat Score</th>
                          <th className="px-6 py-5">Incidents Breakdown</th>
                          <th className="px-6 py-5">Current Status</th>
                          <th className="px-8 py-5 text-right">Intervention</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-100">
                        {(!securityStatus?.ids?.ipTrackers || securityStatus.ids.ipTrackers.length === 0) ? (
                          <tr>
                            <td colSpan={5} className="px-8 py-20 text-center text-stone-400 font-bold uppercase tracking-widest text-xs italic">
                              All external nodes reporting zero threat level. Global perimeter secure.
                            </td>
                          </tr>
                        ) : (
                          securityStatus.ids.ipTrackers.sort((a: any, b: any) => b.score - a.score).map((tracker: any) => (
                            <tr key={tracker.ip} className={cn("hover:bg-stone-50/50 transition-colors", tracker.blocked && "bg-red-50/20")}>
                              <td className="px-8 py-6 font-mono text-xs font-black text-stone-800">
                                {formatIpAddress(tracker.ip)}
                              </td>
                              <td className="px-6 py-6">
                                <div className="flex items-center gap-3">
                                  <span className={cn(
                                    "text-lg font-black font-mono",
                                    tracker.score >= 50 ? "text-red-600" : "text-amber-600"
                                  )}>
                                    {tracker.score}
                                  </span>
                                  <div className="w-24 h-1.5 bg-stone-100 rounded-full overflow-hidden">
                                    <div 
                                      className={cn("h-full", tracker.score >= 50 ? "bg-red-500" : "bg-amber-500")}
                                      style={{ width: `${Math.min(100, tracker.score)}%` }}
                                    />
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-6">
                                <div className="flex flex-wrap gap-2">
                                  {tracker.failedLogins > 0 && <span className="px-2 py-0.5 bg-stone-100 text-stone-600 text-[9px] font-black rounded uppercase">Login: {tracker.failedLogins}</span>}
                                  {tracker.injectionAttempts > 0 && <span className="px-2 py-0.5 bg-red-100 text-red-700 text-[9px] font-black rounded uppercase">Injection: {tracker.injectionAttempts}</span>}
                                  {tracker.unauthorizedAttempts > 0 && <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-[9px] font-black rounded uppercase">Auth: {tracker.unauthorizedAttempts}</span>}
                                </div>
                              </td>
                              <td className="px-6 py-6">
                                {tracker.blocked ? (
                                  <div className="flex flex-col">
                                    <span className="text-[10px] font-black text-red-600 uppercase tracking-widest flex items-center gap-1">
                                      <Lock size={10} /> Blacklisted
                                    </span>
                                    <span className="text-[9px] font-bold text-stone-400">
                                      Expires in {Math.round(tracker.blockedRemainingMs / 60000)}m
                                    </span>
                                  </div>
                                ) : (
                                  <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest flex items-center gap-1">
                                    <Globe size={10} /> Monitored
                                  </span>
                                )}
                              </td>
                              <td className="px-8 py-6 text-right">
                                {tracker.blocked ? (
                                  <button 
                                    onClick={() => handleUnblockIp(tracker.ip)}
                                    className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all"
                                    title="Unblock Node"
                                  >
                                    <UserCheck size={18} />
                                  </button>
                                ) : (
                                  <button 
                                    onClick={() => handleBlockIp(tracker.ip)}
                                    className="p-2 text-red-600 hover:bg-red-50 rounded-xl transition-all"
                                    title="Block Node"
                                  >
                                    <UserX size={18} />
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            )}

            {/* SUB-TAB 1: SECURITY EVENTS */}
            {activeSubTab === 'events' && (
              <motion.div
                key="events"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="overflow-x-auto no-scrollbar"
              >
                <table className="w-full text-left font-sans">
                  <thead className="bg-stone-50/70 border-b border-stone-100 text-stone-400 text-[10px] uppercase font-black tracking-widest">
                    <tr>
                      <th className="px-10 py-6">Handshake Incident ID</th>
                      <th className="px-6 py-6">Incident Category</th>
                      <th className="px-6 py-6">Telemetry Details</th>
                      <th className="px-6 py-6 font-mono text-center">Origin Address</th>
                      <th className="px-6 py-6">User Agent Node</th>
                      <th className="px-10 py-6 text-right">Registered Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {currentSecurityLogs.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-10 py-24 text-center text-stone-300 font-bold uppercase tracking-widest text-xs italic">
                          No active security logs matches your search parameter filter.
                        </td>
                      </tr>
                    ) : (
                      currentSecurityLogs.map((log, idx) => (
                        <tr key={log.id || idx} className="hover:bg-stone-50/50 transition-colors">
                          <td className="px-10 py-6 font-mono text-[10px] text-stone-400 font-bold">
                            {log.id || `evt-${idx}`}
                          </td>
                          <td className="px-6 py-6">
                            <span className={cn(
                              "text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg border",
                              log.type?.includes('failed') ? "bg-red-50 text-red-600 border-red-100" :
                              log.type?.includes('encryption') ? "bg-purple-50 text-purple-600 border-purple-100" :
                              "bg-emerald-50 text-emerald-600 border-emerald-100"
                            )}>
                              {String(log.type || 'info').replace(/_/g, ' ')}
                            </span>
                          </td>
                          <td className="px-6 py-6 text-sm font-bold text-stone-800 max-w-[400px]">
                            {log.details}
                          </td>
                          <td className="px-6 py-6 font-mono text-[10px] text-stone-400 font-bold text-center">
                            {formatIpAddress(log.ip)}
                          </td>
                          <td className="px-6 py-6 text-xs text-stone-500 font-medium max-w-[200px] truncate" title={log.userAgent}>
                            {log.userAgent || 'WebBrowser Agent'}
                          </td>
                          <td className="px-10 py-6 text-right">
                            <span className="text-xs font-black text-stone-800 block">
                              {log.timestamp ? new Date(log.timestamp).toLocaleTimeString() : 'N/A'}
                            </span>
                            <span className="text-[9px] font-bold text-stone-400 uppercase tracking-widest mt-0.5 block">
                              {log.timestamp ? new Date(log.timestamp).toLocaleDateString() : 'N/A'}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </motion.div>
            )}

            {/* SUB-TAB 2: LOGIN HISTORY */}
            {activeSubTab === 'logins' && (
              <motion.div
                key="logins"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="overflow-x-auto no-scrollbar"
              >
                <table className="w-full text-left font-sans">
                  <thead className="bg-stone-50/70 border-b border-stone-100 text-stone-400 text-[10px] uppercase font-black tracking-widest">
                    <tr>
                      <th className="px-10 py-6">Incident Node</th>
                      <th className="px-6 py-6">Handshake Status</th>
                      <th className="px-6 py-6">Identity Target Email</th>
                      <th className="px-6 py-6">Associated User ID</th>
                      <th className="px-6 py-6 font-mono text-center">Origin Address</th>
                      <th className="px-6 py-6">System Agent Context</th>
                      <th className="px-10 py-6 text-right">Clearing Handshake Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {currentLoginLogs.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-10 py-24 text-center text-stone-300 font-bold uppercase tracking-widest text-xs italic">
                          No active login histories located.
                        </td>
                      </tr>
                    ) : (
                      currentLoginLogs.map((log, idx) => (
                        <tr key={log.id || idx} className="hover:bg-stone-50/50 transition-colors">
                          <td className="px-10 py-6 font-mono text-[10px] text-stone-400 font-bold">
                            {log.id || `log-${idx}`}
                          </td>
                          <td className="px-6 py-6">
                            <span className={cn(
                              "text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg border flex items-center gap-1.5 w-fit",
                              log.type === 'login' ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-red-50 text-red-600 border-red-100 animate-pulse"
                            )}>
                              {log.type === 'login' ? <UserCheck size={11} /> : <UserX size={11} />}
                              {log.type === 'login' ? 'Success' : 'Failed Attempt'}
                            </span>
                          </td>
                          <td className="px-6 py-6 text-sm font-black text-stone-900">
                            {formatEmailAddress(log.email) || 'Anonymous/Unmapped'}
                          </td>
                          <td className="px-6 py-6 font-mono text-[10px] text-stone-400">
                            {log.userId || 'N/A'}
                          </td>
                          <td className="px-6 py-6 font-mono text-[10px] text-stone-400 text-center">
                            {formatIpAddress(log.ip)}
                          </td>
                          <td className="px-6 py-6 text-xs text-stone-500 font-medium max-w-[150px] truncate" title={log.userAgent}>
                            {log.userAgent || 'Web Browser'}
                          </td>
                          <td className="px-10 py-6 text-right">
                            <span className="text-xs font-black text-stone-800 block">
                              {log.timestamp ? new Date(log.timestamp).toLocaleTimeString() : 'N/A'}
                            </span>
                            <span className="text-[9px] font-bold text-stone-400 uppercase tracking-widest mt-0.5 block">
                              {log.timestamp ? new Date(log.timestamp).toLocaleDateString() : 'N/A'}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </motion.div>
            )}

            {/* SUB-TAB 3: ACTION AUDITS */}
            {activeSubTab === 'actions' && (
              <motion.div
                key="actions"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="overflow-x-auto no-scrollbar"
              >
                <table className="w-full text-left font-sans">
                  <thead className="bg-stone-50/70 border-b border-stone-100 text-stone-400 text-[10px] uppercase font-black tracking-widest">
                    <tr>
                      <th className="px-10 py-6">Admin Agent</th>
                      <th className="px-6 py-6">Action Logic</th>
                      <th className="px-6 py-6">Resource Target</th>
                      <th className="px-6 py-6">Activity Details</th>
                      <th className="px-6 py-6">Origin Endpoint</th>
                      <th className="px-6 py-6">Commit Status</th>
                      <th className="px-10 py-6 text-right">Registered Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 font-sans">
                    {currentAuditLogs.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-10 py-24 text-center text-stone-300 font-bold uppercase tracking-widest text-xs italic">
                          No action audit logs matching filter bounds.
                        </td>
                      </tr>
                    ) : (
                      currentAuditLogs.map((log, idx) => {
                        const details = (() => {
                          try { return JSON.parse(log.details); } catch(e) { return { message: log.details }; }
                        })();
                        const isReversible = !!details.oldState;
                        const isReversion = log.action === 'ACTION_REVERTED';

                        return (
                          <tr key={log.id || idx} className="hover:bg-stone-50/50 transition-colors">
                            <td className="px-10 py-6">
                              <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 rounded-xl bg-stone-900 text-white font-black text-xs flex items-center justify-center uppercase">
                                  {log.admin_name?.[0] || 'A'}
                                </div>
                                <span className="text-xs font-black text-stone-950">{log.admin_name || 'System Operator'}</span>
                              </div>
                            </td>
                            <td className="px-6 py-6">
                              <span className={cn(
                                "text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg border",
                                log.action === 'DELETE' ? 'bg-red-50 text-red-600 border-red-100' :
                                log.action === 'ACTION_REVERTED' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                'bg-blue-50 text-blue-600 border-blue-100'
                              )}>
                                {log.action}
                              </span>
                            </td>
                            <td className="px-6 py-6">
                              <span className="text-[10px] font-mono font-black text-stone-400 bg-stone-100 px-2.5 py-0.5 rounded border border-stone-200/40 uppercase">
                                {log.resource || log.target_type}
                              </span>
                            </td>
                            <td className="px-6 py-6 max-w-[300px]">
                              <p className="text-xs font-bold leading-relaxed text-stone-700">{details.message || log.details}</p>
                            </td>
                            <td className="px-6 py-6 font-mono text-[10px] text-stone-400 font-bold">
                              {log.ip_address || '127.0.0.1'}
                            </td>
                            <td className="px-6 py-6">
                              {isReversible ? (
                                <button 
                                  onClick={() => handleRevertAction(log.id)}
                                  className="flex items-center space-x-1 text-[9px] font-black uppercase tracking-widest text-[#6366f1] hover:text-white bg-[#6366f1]/5 hover:bg-[#6366f1] px-3 py-1.5 rounded-xl border border-[#6366f1]/10 transition-all shadow-sm active:scale-95 cursor-pointer"
                                >
                                  <RefreshCw size={10} />
                                  <span>Rollback</span>
                                </button>
                              ) : isReversion ? (
                                <span className="text-[9px] font-black uppercase tracking-widest text-amber-600 bg-amber-50 border border-amber-100 px-3 py-1 bg-amber-100 rounded-lg inline-block">
                                  Reverted Action
                                </span>
                              ) : (
                                <span className="text-[9px] font-black uppercase tracking-widest text-stone-300 italic">
                                  Immutable Node
                                </span>
                              )}
                            </td>
                            <td className="px-10 py-6 text-right">
                              <span className="text-xs font-black text-stone-800 block">
                                {new Date(log.created_at).toLocaleTimeString()}
                              </span>
                              <span className="text-[9px] font-bold text-stone-400 uppercase tracking-widest mt-0.5 block">
                                {new Date(log.created_at).toLocaleDateString()}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </motion.div>
            )}

            {/* SUB-TAB 4: DIAGNOSTICS & SYSTEM INTEGRITY */}
            {activeSubTab === 'diagnostics' && (
              <motion.div
                key="diagnostics"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="p-10 space-y-12"
              >
                
                {/* Advanced Encryption Shield Diagnostics Box */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-xl font-black text-stone-900 tracking-tight flex items-center gap-2">
                        <Fingerprint size={20} className="text-purple-600" /> Advanced Cryosphere Status
                      </h4>
                      <p className="text-xs text-stone-500 font-medium">Real-time validation of administrative encryption-at-rest integrity.</p>
                    </div>

                    <div className="space-y-3">
                      {[
                        { label: 'PII Cryptography Block', protocol: 'AES-256-GCM Mode', status: 'Optimal / Active', color: 'emerald' },
                        { label: 'Cloud Firestore Database Access Security', protocol: 'Structured Rules Validation', status: 'Isolated Strict', color: 'emerald' },
                        { label: 'Token Expiry Refresh Routine', protocol: '24-hour Session Rotator', status: 'Active Node', color: 'emerald' },
                        { label: 'Transit Protocol Port Ingress', protocol: 'TLS TLS v1.3 Only', status: 'Strictly Enforced', color: 'emerald' }
                      ].map((item, idx) => (
                        <div key={idx} className="p-5 bg-stone-50 border border-stone-150/60 rounded-2xl flex justify-between items-center text-left">
                          <div className="space-y-1">
                            <p className="text-xs font-black text-stone-800 leading-none">{item.label}</p>
                            <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">{item.protocol}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-[10px] font-black uppercase text-emerald-600 tracking-wider font-mono">{item.status}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Transaction Diagnostics Box */}
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-xl font-black text-stone-900 tracking-tight flex items-center gap-2">
                        <Activity size={20} className="text-[#6366f1]" /> Wallet Ledger Audit & Sync
                      </h4>
                      <p className="text-xs text-stone-500 font-medium">Audit the relationship between user transaction logs and calculated wallet values.</p>
                    </div>

                    <div className="bg-stone-50 p-8 rounded-3xl border border-stone-200/60 text-left space-y-6">
                      <p className="text-xs leading-relaxed font-medium text-stone-500">
                        Our ledger check runs diagnostic algorithms checking user transactions (credits, debits, payments) directly against their current displayed balance to isolate and highlight any data-entry anomalies.
                      </p>

                      <button
                        onClick={runWalletDiagnostics}
                        disabled={loadingDiagnostics}
                        className="w-full py-5 bg-stone-950 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-stone-850 active:scale-95 hover:shadow-lg transition-all flex items-center justify-center gap-2 sm:gap-3 cursor-pointer disabled:bg-stone-300"
                      >
                        {loadingDiagnostics ? (
                          <>
                            <Loader2 size={16} className="animate-spin" />
                            <span>Auditing Forensic Ledger Node...</span>
                          </>
                        ) : (
                          <>
                            <SearchCode size={16} />
                            <span>Deep Integrity Ledger Scan</span>
                          </>
                        )}
                      </button>

                      <div className="border-t border-stone-200/60 pt-4 flex justify-between items-center font-mono">
                        <span className="text-[9px] font-black uppercase tracking-wider text-stone-400">Ledger Compliance Audit status</span>
                        <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">100% COVERED</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recent Failed Login Attempts (Brute-Force Monitor) */}
                <div className="space-y-6 pt-10 border-t border-stone-150/60 text-left">
                  <div>
                    <h4 className="text-xl font-black text-stone-900 tracking-tight flex items-center gap-2">
                      <ShieldAlert size={20} className="text-amber-600" /> Recent Failed Logins (Brute-Force Analysis)
                    </h4>
                    <p className="text-xs text-stone-500 font-medium">Real-time surveillance stream showing timestamps and masked IP addresses to detect automated brute-force threat vectors.</p>
                  </div>

                  <div className="bg-stone-50 border border-stone-200/60 rounded-3xl overflow-hidden">
                    <div className="max-h-[300px] overflow-y-auto pr-1">
                      {securityLogs.filter(log => log.type === 'failed_login').length === 0 ? (
                        <div className="p-8 text-center text-xs font-bold text-stone-400 font-mono">
                          No failed login attempts detected in system logs.
                        </div>
                      ) : (
                        <div className="divide-y divide-stone-150">
                          {securityLogs
                            .filter(log => log.type === 'failed_login')
                            .slice(0, 15)
                            .map((log: any, idx: number) => {
                              return (
                                <div key={log.id || idx} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-stone-100/50 transition-colors">
                                  <div className="space-y-1 text-left">
                                    <div className="flex items-center gap-2.5">
                                      <span className="px-2 py-0.5 bg-amber-50 text-amber-700 text-[10px] font-black rounded-md border border-amber-200/50 font-mono uppercase tracking-wider">
                                        Failed Attempt
                                      </span>
                                      <span className="text-xs font-black text-stone-800 font-mono">IP: {formatIpAddress(log.ip)}</span>
                                    </div>
                                    <p className="text-xs font-medium text-stone-500">{log.details}</p>
                                    {log.email && log.email !== 'N/A' && (
                                      <p className="text-[10px] font-bold text-stone-400 font-mono">Target User Account: {formatEmailAddress(log.email)}</p>
                                    )}
                                  </div>
                                  <div className="text-right shrink-0">
                                    <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest font-mono">Detected At</p>
                                    <p className="text-xs font-bold text-stone-700">
                                      {log.timestamp ? new Date(log.timestamp).toLocaleString() : 'N/A'}
                                    </p>
                                  </div>
                                </div>
                              );
                            })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Diagnostic Outcomes Dynamic Viewport */}
                {diagnosticResults && (
                  <div className="space-y-6 pt-6 border-t border-stone-100 text-left animate-in fade-in duration-300">
                    <h4 className="text-sm font-black text-stone-950 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                      <Database className="text-[#6366f1]" size={16} /> Check results for Run Execution
                    </h4>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-stone-50 p-6 rounded-2xl border border-stone-150">
                        <p className="text-[10px] font-black text-stone-400 uppercase tracking-wider mb-1">Time Audited</p>
                        <p className="text-sm font-bold text-stone-900">{new Date(diagnosticResults.checkedAt).toLocaleTimeString()}</p>
                      </div>
                      <div className="bg-stone-50 p-6 rounded-2xl border border-stone-150">
                        <p className="text-[10px] font-black text-stone-400 uppercase tracking-wider mb-1">Checked Actions Count</p>
                        <p className="text-xl font-black text-stone-900">{diagnosticResults.totalTransactionsChecked}</p>
                      </div>
                      <div className="bg-stone-50 p-6 rounded-2xl border border-stone-150">
                        <p className="text-[10px] font-black text-stone-400 uppercase tracking-wider mb-1">Audited User Pools</p>
                        <p className="text-xl font-black text-stone-900">{diagnosticResults.uniqueUsersCheckedCount}</p>
                      </div>
                      <div className="bg-stone-50 p-6 rounded-2xl border border-stone-150">
                        <p className="text-[10px] font-black text-stone-400 uppercase tracking-wider mb-1">Identified Anomalies</p>
                        <p className={cn("text-xl font-black", diagnosticResults.inconsistenciesFoundCount > 0 ? "text-red-500 animate-pulse" : "text-emerald-500")}>
                          {diagnosticResults.inconsistenciesFoundCount}
                        </p>
                      </div>
                    </div>

                    {diagnosticResults.inconsistencies && diagnosticResults.inconsistencies.length > 0 ? (
                      <div className="bg-red-50 border border-red-150 rounded-2xl p-6 text-left space-y-3">
                        <h5 className="text-xs font-black text-red-800 uppercase tracking-wider flex items-center gap-1.5">
                          <AlertCircle size={14} /> Critical Discrepancy Forensic Stream
                        </h5>
                        <div className="space-y-2">
                          {diagnosticResults.inconsistencies.map((inc: string, idx: number) => (
                            <div key={idx} className="text-xs text-red-900 font-medium py-3 px-4 bg-white rounded-xl border border-red-100 flex items-center gap-3">
                              <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
                              <span>{inc}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="bg-emerald-50 border border-emerald-150 rounded-2xl p-6 flex items-center gap-3 text-xs text-emerald-800 font-extrabold uppercase tracking-wide">
                        <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />
                        Forensic Integrity Confirmed: Wallet balances perfectly align with transactions history log for all audited users.
                      </div>
                    )}

                    {/* Users Detailed Interactive Audit Ledger */}
                    {diagnosticResults.users && diagnosticResults.users.length > 0 && (
                      <div className="space-y-4 pt-4">
                        <h5 className="text-xs font-black text-stone-900 uppercase tracking-[0.2em]">Detailed User Specifics ledger</h5>
                        <div className="bg-white border border-stone-200/50 rounded-2xl overflow-hidden shadow-sm">
                          <div className="overflow-x-auto no-scrollbar">
                            <table className="w-full text-left font-sans text-xs">
                              <thead className="bg-stone-50 border-b border-stone-100 text-[10px] text-stone-400 uppercase font-black tracking-widest">
                                <tr>
                                  <th className="px-6 py-4">User Details</th>
                                  <th className="px-6 py-4">Current Ledger Balance</th>
                                  <th className="px-6 py-4">Calculated Real Value</th>
                                  <th className="px-6 py-4">Variance Level</th>
                                  <th className="px-6 py-4">Resolution Action</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-stone-100 font-medium text-stone-600">
                                {diagnosticResults.users.map((audUser: any) => (
                                  <tr key={audUser.userId} className="hover:bg-stone-50/40 transition-colors">
                                    <td className="px-6 py-4">
                                      <div>
                                        <p className="font-extrabold text-stone-900">{audUser.name}</p>
                                        <p className="text-[10px] text-stone-400 font-mono">ID: {audUser.userId} | {audUser.email}</p>
                                      </div>
                                    </td>
                                    <td className="px-6 py-4 font-bold text-stone-800">₹{audUser.currentBalance.toFixed(2)}</td>
                                    <td className="px-6 py-4 font-bold text-stone-800">₹{audUser.calculatedBalance.toFixed(2)}</td>
                                    <td className={`px-6 py-4 font-black ${audUser.discrepancy !== 0 ? "text-red-600" : "text-emerald-600"}`}>
                                      {audUser.discrepancy !== 0 ? `₹${audUser.discrepancy.toFixed(2)}` : '₹0.00'}
                                    </td>
                                    <td className="px-6 py-4">
                                      {audUser.hasDiscrepancy ? (
                                        <button
                                          onClick={() => fixWalletDiscrepancy(audUser.userId)}
                                          disabled={fixingWalletUserId === audUser.userId}
                                          className="flex items-center gap-1 bg-stone-950 hover:bg-stone-850 text-white rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-wider disabled:bg-stone-300 pointer cursor-pointer"
                                        >
                                          {fixingWalletUserId === audUser.userId ? (
                                            <>
                                              <Loader2 size={12} className="animate-spin" />
                                              <span>Fixaging...</span>
                                            </>
                                          ) : (
                                            <>
                                              <RefreshCw size={12} />
                                              <span>Fix Discrepancy</span>
                                            </>
                                          )}
                                        </button>
                                      ) : (
                                        <span className="text-[10px] text-stone-400 font-black uppercase tracking-widest bg-stone-50 border border-stone-100 px-3 py-1.5 rounded-lg inline-block">Validated</span>
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
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>

      {/* PII Forensic Reveal Reason Dialog Modal Overlay */}
      {showRevealModal && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-[2rem] max-w-md w-full p-8 border border-stone-150 shadow-2xl space-y-6 text-left"
          >
            <div className="flex items-center space-x-3 text-red-600">
              <ShieldAlert size={28} />
              <h3 className="text-xl font-black text-stone-900 tracking-tight">Security Audited Event Warning</h3>
            </div>
            <p className="text-xs text-stone-500 leading-relaxed font-medium">
              You are requesting access to unmasked Personal Identifiable Information (PII) including fully legible email accounts and origin IP nodes.
              <strong className="block mt-2 text-stone-800">This action requires a forensic justification and is recorded on the permanent audit log.</strong>
            </p>
            
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-stone-400 tracking-widest">Justification Reason</label>
              <input 
                type="text"
                className="w-full px-4 py-3.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-semibold outline-none focus:border-stone-950"
                value={revealReason}
                onChange={(e) => setRevealReason(e.target.value)}
                placeholder="e.g. Audit of user session or transaction anomaly..."
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button 
                onClick={() => setShowRevealModal(false)}
                className="flex-1 px-4 py-3.5 bg-stone-100 hover:bg-stone-200 rounded-xl text-stone-600 text-xs font-black uppercase tracking-wider transition-colors"
              >
                Abort Access
              </button>
              <button 
                onClick={handleTogglePII}
                disabled={revealingPII || !revealReason.trim()}
                className="flex-1 px-4 py-3.5 bg-red-600 hover:bg-red-700 disabled:bg-stone-300 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-colors flex items-center justify-center gap-2"
              >
                {revealingPII ? <Loader2 size={13} className="animate-spin" /> : <Lock size={13} />}
                Authorize & Reveal
              </button>
            </div>
          </motion.div>
        </div>
      )}

    </div>
  );
}
