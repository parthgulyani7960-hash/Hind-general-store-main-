import React, { useEffect, useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { Activity, ChevronLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { fetchWithHandling } from '@/lib/api';
import { getAuthHeaders, cn } from '@/lib/utils';
import { Severity } from '@/lib/incidentReporting';

export default function ActivityLogs() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [severityFilter, setSeverityFilter] = useState<Severity | 'All'>('All');

  useEffect(() => {
    fetchWithHandling<any[]>('/api/admin/system-logs', { headers: getAuthHeaders() })
      .then(data => {
        if (data) {
          setLogs(data);
          console.log('Logs structure:', data[0]);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const filteredLogs = useMemo(() => {
    if (severityFilter === 'All') return logs;
    return logs.filter(log => log.severity === severityFilter || (severityFilter === Severity.MEDIUM && (!log.severity || log.level === 'info')));
  }, [logs, severityFilter]);

  return (
    <div className="h-[calc(100vh-4.5rem)] bg-stone-50 overflow-y-auto no-scrollbar scroll-smooth">
      <main className="py-10 px-4">
        <div className="max-w-5xl mx-auto">
          <Link 
            to="/admin" 
            className="inline-flex items-center space-x-2 text-stone-500 hover:text-primary transition-colors mb-8 group"
          >
            <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
            <span className="font-bold">Back to Dashboard</span>
          </Link>

          <header className="flex items-center justify-between mb-8">
             <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-2xl text-primary">
                  <Activity size={32} />
                </div>
                <h1 className="text-3xl font-black text-stone-900">System Activity Logs</h1>
             </div>
          </header>

          {loading ? (
            <div className="text-center py-20 text-stone-500 font-bold">Loading system activity...</div>
          ) : (
            <div className="bg-white rounded-[2.5rem] shadow-sm border border-stone-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-stone-500 uppercase bg-stone-50 font-black tracking-widest border-b border-stone-100">
                            <tr>
                                <th className="px-6 py-4">Timestamp</th>
                                <th className="px-6 py-4">Level</th>
                                <th className="px-6 py-4">Message</th>
                                <th className="px-6 py-4">Path</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-100">
                            {filteredLogs.map((log, i) => (
                                <tr key={i} className="hover:bg-stone-50 transition-colors">
                                    <td className="px-6 py-4 text-stone-600 font-mono">{new Date(log.created_at).toLocaleString()}</td>
                                    <td className="px-6 py-4"><span className={cn("px-2 py-1 rounded-md text-[10px] font-black uppercase", (log.severity === Severity.CRITICAL || log.level === 'error') ? 'bg-red-100 text-red-700' : 'bg-stone-100 text-stone-600')}>{log.severity || log.level}</span></td>
                                    <td className="px-6 py-4 text-stone-800 font-medium">{log.message}</td>
                                    <td className="px-6 py-4 text-stone-500 text-xs font-mono">{log.path}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
