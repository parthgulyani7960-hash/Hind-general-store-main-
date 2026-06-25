import React, { useState, useEffect } from 'react';
import { useStore } from '@/StoreContext';
import { auth, db } from '@/firebase';
import { Activity, ShieldAlert, AlertCircle, RefreshCw, Database, Terminal, Shield, Info, Trash2 } from 'lucide-react';
import { fetchWithHandling } from '@/lib/api';
import { cn, getAuthHeaders } from '@/lib/utils';
import { format } from 'date-fns';

export default function DiagnosticsTab() {
  const { user, diagnosticLogs, runtimeErrors, clearDiagnostics } = useStore();
  const [diagnostics, setDiagnostics] = useState<any>(null);
  const [failedLogins, setFailedLogins] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Security: only admins can view
  const isAdmin = user?.role === 'admin';

  const fetchFailedLogins = async () => {
    if (!isAdmin) return;
    setLoading(true);
    try {
      const res = await fetchWithHandling('/api/admin/security-logs?limit=20&type=failed_login') as any[];
      if (res) {
        setFailedLogins(res);
      }
    } catch (err) {
      console.error('Failed to fetch failed logins diagnostics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFailedLogins();
    const interval = setInterval(fetchFailedLogins, 30000);
    return () => clearInterval(interval);
  }, [isAdmin]);

  useEffect(() => {
    if (!isAdmin) return;
    const data = {
      browser: navigator.userAgent,
      platform: navigator.platform,
      authStatus: user ? 'Authenticated' : 'Unauthenticated',
      userId: user?.id,
      timestamp: new Date().toISOString(),
      firebaseAuthInitialized: !!auth,
      firebaseDbInitialized: !!db,
      firebaseProjectId: (auth as any)?.app?.options?.projectId || 'Unknown',
    };
    setDiagnostics(data);
  }, [user, isAdmin]);

  const handleClearCache = async () => {
    if (!confirm('This will clear all local storage, session storage, and service worker caches. The application will reload. Proceed?')) return;
    
    localStorage.clear();
    sessionStorage.clear();
    
    if ('caches' in window) {
      try {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
      } catch (err) {
        console.error('Failed to clear CacheStorage:', err);
      }
    }

    if ('serviceWorker' in navigator) {
      try {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map(r => r.unregister()));
      } catch (err) {
        console.error('Failed to unregister service workers:', err);
      }
    }

    window.location.reload();
  };

  const maskIp = (ip?: string): string => {
    if (!ip) return 'Unknown';
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

  if (!isAdmin) return (
    <div className="p-12 text-center bg-white rounded-[3rem] border border-stone-100">
      <ShieldAlert className="mx-auto text-red-500 mb-4" size={48} />
      <h2 className="text-2xl font-black text-stone-900">Access Restricted</h2>
      <p className="text-stone-500 mt-2">Only administrators can access diagnostic tools.</p>
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-[2.5rem] border border-stone-100 shadow-sm">
        <div className="space-y-1 text-left">
          <div className="flex items-center gap-2">
            <Activity className="text-primary" size={24} />
            <h2 className="text-2xl font-black text-stone-900 tracking-tight">Diagnostic Hub</h2>
          </div>
          <p className="text-stone-400 text-xs font-bold uppercase tracking-widest pl-8">Low-level system telemetry and state inspection</p>
        </div>
        
        <div className="flex gap-3">
          <button 
            onClick={clearDiagnostics}
            className="px-4 py-3 bg-stone-100 text-stone-600 rounded-2xl hover:bg-stone-200 transition-all text-[10px] font-black uppercase tracking-widest flex items-center gap-2"
            title="Clear current session logs"
          >
            <Trash2 size={16} />
            Clear Hub Console
          </button>
          <button 
            onClick={handleClearCache}
            className="px-6 py-3 bg-red-600 text-white rounded-2xl hover:bg-red-700 transition-all text-xs font-black uppercase tracking-widest flex items-center gap-2"
          >
            <RefreshCw size={16} />
            Force Global Cache Purge
          </button>
          <button 
            onClick={fetchFailedLogins}
            className="p-3 bg-stone-900 text-white rounded-2xl hover:bg-black transition-all"
            disabled={loading}
          >
            <RefreshCw size={18} className={cn(loading && "animate-spin")} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: API Health & Errors */}
        <div className="lg:col-span-2 space-y-6">
          {/* API Health */}
          <div className="bg-white p-8 rounded-[3rem] border border-stone-100 shadow-sm">
            <h3 className="text-lg font-black text-stone-900 mb-6 flex items-center gap-2">
              <Activity className="text-blue-500" size={20} />
              API Health Monitor
            </h3>
            {diagnosticLogs.length === 0 ? (
              <div className="py-12 text-center bg-stone-50 rounded-3xl border border-dashed border-stone-200">
                <p className="text-stone-400 text-xs font-bold uppercase tracking-widest">No API activity logged in this session</p>
              </div>
            ) : (
              <div className="space-y-3">
                {diagnosticLogs.map((log, i) => (
                  <div key={i} className={cn(
                    "p-4 rounded-2xl border flex items-center justify-between",
                    log.ok ? "bg-emerald-50/50 border-emerald-100" : "bg-red-50/50 border-red-100"
                  )}>
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "w-2 h-2 rounded-full",
                        log.ok ? "bg-emerald-500" : "bg-red-500 animate-pulse"
                      )} />
                      <div>
                        <p className="text-sm font-black text-stone-900">HTTP {log.status} - {log.statusText || (log.ok ? 'OK' : 'Error')}</p>
                        <p className="text-[10px] font-bold text-stone-500 uppercase tracking-widest">{new Date(log.timestamp).toLocaleTimeString()}</p>
                      </div>
                    </div>
                    {log.error && <span className="text-[10px] font-bold text-red-600 bg-red-100 px-3 py-1 rounded-full">{log.error}</span>}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* System Errors */}
          <div className="bg-white p-8 rounded-[3rem] border border-stone-100 shadow-sm">
            <h3 className="text-lg font-black text-stone-900 mb-6 flex items-center gap-2">
              <AlertCircle className="text-red-500" size={20} />
              System Runtime Errors
            </h3>
            {runtimeErrors.length === 0 ? (
              <div className="py-12 text-center bg-stone-50 rounded-3xl border border-dashed border-stone-200">
                <p className="text-stone-400 text-xs font-bold uppercase tracking-widest">No runtime errors detected</p>
              </div>
            ) : (
              <div className="space-y-3">
                {runtimeErrors.map((err, i) => (
                  <div key={i} className="p-4 rounded-2xl border border-red-100 bg-red-50/30">
                    <p className="text-sm font-black text-red-900">{err.type}: {err.message}</p>
                    <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest mt-1">
                      Component: {err.component || 'Global'} • {new Date().toLocaleTimeString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Brute Force Monitor */}
          <div className="bg-white p-8 rounded-[3rem] border border-stone-100 shadow-sm">
            <h3 className="text-lg font-black text-stone-900 mb-6 flex items-center gap-2">
              <Shield className="text-amber-500" size={20} />
              Brute-Force Detection (Failed Logins)
            </h3>
            {failedLogins.length === 0 ? (
              <div className="py-12 text-center bg-stone-50 rounded-3xl border border-dashed border-stone-200">
                <p className="text-stone-400 text-xs font-bold uppercase tracking-widest">No recent failed logins</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {failedLogins.map((log, i) => (
                  <div key={i} className="p-4 rounded-2xl border border-amber-100 bg-amber-50/30">
                    <div className="flex justify-between mb-2">
                      <span className="text-[10px] font-black text-amber-600 bg-amber-100 px-2 py-0.5 rounded uppercase">IP: {maskIp(log.ip)}</span>
                      <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">{format(new Date(log.timestamp), 'HH:mm:ss')}</span>
                    </div>
                    <p className="text-xs font-bold text-stone-700 leading-snug">{log.details}</p>
                    {log.email && <p className="text-[10px] text-stone-400 mt-2 font-bold uppercase">Target: {log.email}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: System Info */}
        <div className="space-y-6">
          <div className="bg-stone-900 text-white p-8 rounded-[3rem] shadow-xl overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 blur-[60px] rounded-full -mr-10 -mt-10" />
            <div className="relative z-10 space-y-6">
              <div className="flex items-center gap-2">
                <Terminal className="text-primary" size={20} />
                <h3 className="text-lg font-black">Environment</h3>
              </div>
              
              {diagnostics && (
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-black text-stone-500 uppercase tracking-widest block mb-1">Platform</label>
                    <p className="text-sm font-bold text-stone-300 break-all">{diagnostics.platform}</p>
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-stone-500 uppercase tracking-widest block mb-1">User Agent</label>
                    <p className="text-[10px] font-mono text-stone-400 break-all bg-black/20 p-2 rounded-lg border border-white/5">{diagnostics.browser}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-black text-stone-500 uppercase tracking-widest block mb-1">Firebase Auth</label>
                      <p className={cn("text-xs font-black", diagnostics.firebaseAuthInitialized ? "text-emerald-400" : "text-red-400")}>
                        {diagnostics.firebaseAuthInitialized ? 'CONNECTED' : 'DISCONNECTED'}
                      </p>
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-stone-500 uppercase tracking-widest block mb-1">Firestore</label>
                      <p className={cn("text-xs font-black", diagnostics.firebaseDbInitialized ? "text-emerald-400" : "text-red-400")}>
                        {diagnostics.firebaseDbInitialized ? 'CONNECTED' : 'DISCONNECTED'}
                      </p>
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-stone-500 uppercase tracking-widest block mb-1">Project ID</label>
                    <p className="text-[10px] font-mono text-stone-300">{diagnostics.firebaseProjectId}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white p-8 rounded-[3rem] border border-stone-100 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Info className="text-stone-400" size={20} />
              <h3 className="text-sm font-black text-stone-900 uppercase tracking-widest">Diagnostic Meta</h3>
            </div>
            <p className="text-xs text-stone-500 font-bold leading-relaxed">
              This panel provides real-time visibility into the client-side execution environment. 
              Logs are session-persistent and will clear upon a full page reload unless otherwise noted.
            </p>
            <div className="mt-6 pt-6 border-t border-stone-50">
              <p className="text-[10px] text-stone-300 font-black uppercase text-center tracking-tighter">Diagnostic ID: {Math.random().toString(36).substring(7).toUpperCase()}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
