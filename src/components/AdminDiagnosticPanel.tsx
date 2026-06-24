import React, { useState, useEffect } from 'react';
import { useStore } from '@/StoreContext';
import { auth, db } from '@/firebase';

export const AdminDiagnosticPanel = () => {
  const { user } = useStore();
  const [diagnostics, setDiagnostics] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [profileLogs, setProfileLogs] = useState<any[]>([]);
  const [systemErrors, setSystemErrors] = useState<any[]>([]);
  const [failedLogins, setFailedLogins] = useState<any[]>([]);

  // Security: only admins can view the diagnostic panel
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    const handleLog = (e: any) => {
      const entry = e.detail;
      setProfileLogs(prev => [entry, ...prev].slice(0, 5));
    };
    window.addEventListener('diagnostic_api_log', handleLog);
    return () => window.removeEventListener('diagnostic_api_log', handleLog);
  }, []);

  useEffect(() => {
    const handleError = (e: any) => {
      setSystemErrors(prev => [e.detail, ...prev].slice(0, 5));
    };
    window.addEventListener('system_error', handleError);
    return () => window.removeEventListener('system_error', handleError);
  }, []);

  useEffect(() => {
    if (!isAdmin || !isVisible) return;
    const fetchFailedLogins = async () => {
      try {
        const token = localStorage.getItem('hgs_token');
        const res = await fetch('/api/admin/security-logs?limit=10&type=failed_login', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (res.ok) {
          const data = await res.json();
          setFailedLogins(data);
        }
      } catch (err) {
        console.error('Failed to fetch failed logins diagnostics:', err);
      }
    };
    fetchFailedLogins();
    const interval = setInterval(fetchFailedLogins, 30000); // refresh every 30s
    return () => clearInterval(interval);
  }, [isAdmin, isVisible]);

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
      profileEndpointLogs: profileLogs,
      recentSystemErrors: systemErrors
    };
    setDiagnostics(data);

    const handleKeydown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.altKey && e.key === 'd') {
        setIsVisible(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeydown);
    return () => window.removeEventListener('keydown', handleKeydown);
  }, [user, isAdmin, profileLogs, systemErrors, isVisible]);

  if (!isAdmin || !isVisible || !diagnostics) return null;

  return (
    <div className="fixed bottom-0 right-0 z-[100] bg-slate-900 text-white p-4 text-xs font-mono max-w-sm rounded-tl-lg shadow-2xl border border-slate-700 overflow-y-auto max-h-[80vh]">
      <h3 className="font-bold mb-2 flex justify-between">
        Admin Diagnostics 
        <span className="text-gray-500">(Ctrl+Alt+D)</span>
      </h3>
      
      <div className="mb-4">
        <p className="text-blue-400 font-bold mb-1 underline">Profile API Health Monitoring:</p>
        {profileLogs.length === 0 ? (
          <p className="text-gray-500 text-[10px]">No profile calls logged yet...</p>
        ) : (
          <div className="space-y-2">
            {profileLogs.map((log, i) => (
              <div key={i} className={`p-1 rounded border ${log.ok ? 'border-green-800 bg-green-900/20' : 'border-red-800 bg-red-900/20'}`}>
                <div className="flex justify-between">
                  <span className={log.ok ? 'text-green-400' : 'text-red-400'}>
                    [{log.status}] {log.statusText}
                  </span>
                  <span className="text-gray-500 text-[9px]">{new Date(log.timestamp).toLocaleTimeString()}</span>
                </div>
                {log.error && <p className="text-orange-300 text-[9px] mt-1">Err: {log.error}</p>}
                {(log.status === 401 || log.status === 403 || log.status >= 500) && (
                  <p className="text-red-300 font-bold text-[9px] mt-1 animate-pulse">
                    CRITICAL ERROR PATTERN DETECTED
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mb-4">
        <p className="text-red-400 font-bold mb-1 underline">Recent System Errors:</p>
        {systemErrors.length === 0 ? (
          <p className="text-gray-500 text-[10px]">No system errors logged...</p>
        ) : (
          <div className="space-y-2">
            {systemErrors.map((err, i) => (
              <div key={i} className="p-1 rounded border border-red-800 bg-red-900/20 text-red-300">
                <p className="text-[10px] font-bold">{err.type}: {err.message}</p>
                {err.component && <p className="text-[9px] text-gray-500">Component: {err.component}</p>}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mb-4">
        <p className="text-amber-400 font-bold mb-1 underline">Recent Failed Logins (Brute-Force Monitor):</p>
        {failedLogins.length === 0 ? (
          <p className="text-gray-500 text-[10px]">No failed logins recorded...</p>
        ) : (
          <div className="space-y-2 max-h-[160px] overflow-y-auto no-scrollbar">
            {failedLogins.map((log, i) => {
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

              return (
                <div key={log.id || i} className="p-1.5 rounded border border-amber-800 bg-amber-900/20 text-amber-300">
                  <div className="flex justify-between text-[9px] font-semibold text-amber-400 mb-0.5">
                    <span>IP: {maskIp(log.ip)}</span>
                    <span className="text-gray-500">
                      {log.timestamp ? new Date(log.timestamp).toLocaleTimeString() : 'N/A'}
                    </span>
                  </div>
                  <p className="text-[10px] text-stone-300 leading-tight break-words">{log.details}</p>
                  {log.email && log.email !== 'N/A' && (
                    <p className="text-[9px] text-stone-400 mt-0.5">User: {log.email}</p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <pre className="mt-4 border-t border-slate-700 pt-2">{JSON.stringify(diagnostics, (key, value) => (key === 'profileEndpointLogs' || key === 'recentSystemErrors') ? undefined : value, 2)}</pre>
      <button className="mt-4 w-full bg-red-900 hover:bg-red-800 p-2 rounded text-white font-bold" onClick={() => localStorage.clear()}>Clear All Storage</button>
    </div>
  );
};
