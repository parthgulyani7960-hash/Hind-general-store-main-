import React, { useState, useEffect } from 'react';
import { Bug, RefreshCw, Search, Eye, X, Server } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { fetchWithHandling } from '@/lib/api';
import { getAuthHeaders } from '@/lib/utils';
import toast from 'react-hot-toast';

const SystemLogsTab: React.FC = () => {
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedLogForDetails, setSelectedLogForDetails] = useState<any | null>(null);
    const [sortField, setSortField] = useState<'created_at' | 'id' | 'level' | 'path'>('created_at');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
    const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
    const [filterLevel, setFilterLevel] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState<string>('');

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const data = await fetchWithHandling<any[]>('/api/admin/system-logs', { headers: getAuthHeaders() });
            if (data) {
                setLogs(data);
                setLastRefreshed(new Date());
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, []);

    const clearLogs = async () => {
        if (!confirm('Clear all system logs? This action is irreversible.')) return;
        try {
            const data = await fetchWithHandling<any>('/api/admin/system-logs', { 
                method: 'DELETE',
                headers: getAuthHeaders()
            });
            if (data) {
                setLogs([]);
                toast.success('Logs cleared successfully');
            }
        } catch (err) {
            toast.error('Failed to clear logs');
        }
    };

    const handleSort = (field: 'created_at' | 'id' | 'level' | 'path') => {
        if (sortField === field) {
            setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('desc');
        }
    };

    const filteredLogs = logs.filter(log => {
        const matchesSearch = !searchQuery || 
            (log.message && log.message.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (log.path && log.path.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (log.id && String(log.id).includes(searchQuery));
        
        const matchesLevel = filterLevel === 'all' || 
            (log.level && log.level.toLowerCase() === filterLevel.toLowerCase());
            
        return matchesSearch && matchesLevel;
    });

    const sortedLogs = [...filteredLogs].sort((a, b) => {
        let valA = a[sortField];
        let valB = b[sortField];
        
        if (sortField === 'created_at') {
            valA = new Date(valA || 0).getTime();
            valB = new Date(valB || 0).getTime();
        } else if (sortField === 'id') {
            valA = Number(valA || 0);
            valB = Number(valB || 0);
        } else {
            valA = String(valA || '').toLowerCase();
            valB = String(valB || '').toLowerCase();
        }
        
        if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
        if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
        return 0;
    });

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-32">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-4xl font-black tracking-tighter text-stone-900 flex items-center gap-3">
                        <div className="p-3 bg-red-100 rounded-3xl text-red-600"><Bug size={32} /></div>
                        SYSTEM HEALTH REGISTRY
                    </h2>
                    <p className="text-stone-500 font-medium mt-1">Real-time monitoring of environment errors and integrity audits.</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={fetchLogs} className="bg-stone-100 text-stone-600 px-6 py-3 rounded-2xl text-xs font-bold uppercase tracking-widest hover:bg-stone-200 transition-all flex items-center gap-2 cursor-pointer">
                        <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
                    </button>
                    <button onClick={clearLogs} className="bg-stone-950 text-white px-6 py-3 rounded-2xl text-xs font-bold uppercase tracking-widest hover:bg-stone-800 transition-all shadow-lg shadow-stone-200 cursor-pointer">
                         Purge All Logs
                    </button>
                </div>
            </div>

            <div className="flex flex-col md:flex-row gap-4 items-center justify-between p-6 bg-stone-50/50 border border-stone-100 rounded-3xl">
                <div className="relative w-full md:w-96">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-stone-400">
                        <Search size={16} />
                    </span>
                    <input
                        type="text"
                        placeholder="Search logs by message, path or ID..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-11 pr-4 py-2.5 bg-white border border-stone-200 focus:border-indigo-500 rounded-2xl text-xs text-stone-800 transition-all outline-none"
                    />
                </div>
                
                <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] uppercase font-bold text-stone-400 tracking-wider">Severity:</span>
                        <select
                            value={filterLevel}
                            onChange={(e) => setFilterLevel(e.target.value)}
                            className="bg-white border border-stone-200 text-stone-700 font-bold text-xs rounded-xl px-3 py-2 outline-none focus:border-indigo-500"
                        >
                            <option value="all">⚡ All Severities</option>
                            <option value="error">❌ Errors</option>
                            <option value="info">ℹ️ Info</option>
                            <option value="warn">⚠️ Warnings</option>
                        </select>
                    </div>

                    <div className="flex items-center gap-2 px-3.5 py-2 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-2xl text-[11px] font-bold">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        <span className="font-mono tracking-wide">{loading ? 'SYNCING...' : `SYNCED: ${lastRefreshed.toLocaleTimeString()}`}</span>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-[2.5rem] border border-stone-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto no-scrollbar">
                    <table className="w-full text-left">
                        <thead className="bg-stone-50/50 text-stone-400 text-[10px] uppercase font-black tracking-[0.2em] border-b border-stone-100">
                            <tr>
                                <th onClick={() => handleSort('id')} className="px-6 py-5 cursor-pointer hover:bg-stone-100/50 transition-colors select-none">
                                    <div className="flex items-center gap-1">ID {sortField === 'id' ? (sortDirection === 'asc' ? '▲' : '▼') : '↕'}</div>
                                </th>
                                <th onClick={() => handleSort('created_at')} className="px-6 py-5 cursor-pointer hover:bg-stone-100/50 transition-colors select-none">
                                    <div className="flex items-center gap-1">Timestamp {sortField === 'created_at' ? (sortDirection === 'asc' ? '▲' : '▼') : '↕'}</div>
                                </th>
                                <th onClick={() => handleSort('level')} className="px-6 py-5 cursor-pointer hover:bg-stone-100/50 transition-colors select-none">
                                    <div className="flex items-center gap-1">Severity {sortField === 'level' ? (sortDirection === 'asc' ? '▲' : '▼') : '↕'}</div>
                                </th>
                                <th onClick={() => handleSort('path')} className="px-6 py-5 cursor-pointer hover:bg-stone-100/50 transition-colors select-none">
                                    <div className="flex items-center gap-1">Pathway {sortField === 'path' ? (sortDirection === 'asc' ? '▲' : '▼') : '↕'}</div>
                                </th>
                                <th className="px-6 py-5 font-bold">Message Exception Buffer</th>
                                <th className="px-6 py-5 text-right">Intervention</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-100">
                            {sortedLogs.map((log: any, idx: number) => (
                                <motion.tr 
                                    key={log.id}
                                    initial={{ opacity: 0, y: 4 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: Math.min(idx * 0.02, 0.4) }}
                                    className="hover:bg-stone-50/40 transition-colors group text-xs text-stone-600"
                                >
                                    <td className="px-6 py-4 font-mono font-bold text-stone-400">#{log.id}</td>
                                    <td className="px-6 py-4 font-medium whitespace-nowrap">{new Date(log.created_at).toLocaleString()}</td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-block text-[9px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full ${
                                            log.level === 'error' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'
                                        }`}>
                                            {log.level}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 font-mono text-[10px] max-w-[150px] truncate">{log.path || 'Core Kernel Action'}</td>
                                    <td className="px-6 py-4 max-w-sm truncate font-mono text-[11px] text-stone-800">{log.message}</td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button onClick={() => setSelectedLogForDetails(log)} className="p-2.5 bg-stone-100 hover:bg-stone-200 text-stone-600 hover:text-stone-900 rounded-xl transition-all cursor-pointer">
                                                <Eye size={13} />
                                            </button>
                                        </div>
                                    </td>
                                </motion.tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <AnimatePresence>
                {selectedLogForDetails && (
                    <div className="fixed inset-0 bg-stone-950/70 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
                        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white rounded-3xl border border-stone-200 shadow-2xl max-w-2xl w-full flex flex-col max-h-[85vh] overflow-hidden">
                            <div className="p-6 border-b border-stone-100 flex justify-between items-center bg-stone-50">
                                <div>
                                    <h3 className="text-sm font-black text-stone-900 uppercase tracking-wider flex items-center gap-2">
                                        <Server size={16} className="text-red-500 animate-pulse" /> Log Payload Inspector #{selectedLogForDetails.id}
                                    </h3>
                                    <p className="text-[10px] text-stone-400 font-medium mt-0.5">Beautified audit trails and system telemetry metadata</p>
                                </div>
                                <button onClick={() => setSelectedLogForDetails(null)} className="p-2 bg-stone-100 hover:bg-stone-200 rounded-full text-stone-500 transition-colors">
                                    <X size={16} />
                                </button>
                            </div>
                            <div className="p-6 overflow-y-auto space-y-5 no-scrollbar">
                                <div className="grid grid-cols-2 gap-3 bg-stone-50 p-4 rounded-2xl border border-stone-100 text-xs text-stone-650">
                                    <div>
                                        <p className="text-[9px] text-stone-400 font-black uppercase">Endpoint Path</p>
                                        <p className="font-mono text-stone-855 break-all mt-0.5">{selectedLogForDetails.path || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-[9px] text-stone-400 font-black uppercase">Trigger Timestamp</p>
                                        <p className="text-stone-800 font-bold mt-0.5">{new Date(selectedLogForDetails.created_at).toLocaleString()}</p>
                                    </div>
                                    <div className="pt-2 border-t border-stone-150">
                                        <p className="text-[9px] text-stone-400 font-black uppercase">Severity Level</p>
                                        <span className={`inline-block text-[9px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full mt-1 ${
                                            selectedLogForDetails.level === 'error' ? 'bg-red-100 text-red-650' : 'bg-blue-100 text-blue-650'
                                        }`}>
                                            {selectedLogForDetails.level}
                                        </span>
                                    </div>
                                    <div className="pt-2 border-t border-stone-150">
                                        <p className="text-[9px] text-stone-400 font-black uppercase">Associated Profile ID</p>
                                        <p className="font-mono font-bold text-stone-880 mt-1">{selectedLogForDetails.user_id || 'Global System Event'}</p>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Logged Message</p>
                                    <div className="bg-stone-50 p-3.5 rounded-xl border border-stone-150 text-xs font-mono font-bold text-stone-800 whitespace-pre-wrap break-all">
                                        {selectedLogForDetails.message}
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Telemetry Payload Details</p>
                                    <div className="bg-stone-950 p-4 rounded-2xl overflow-x-auto border border-stone-800">
                                        <pre className="text-emerald-400 font-mono text-[10px] leading-relaxed select-all">
                                            {(() => {
                                                let payload: any = selectedLogForDetails.details || selectedLogForDetails.metadata;
                                                if (typeof payload === 'string') {
                                                    try {
                                                        payload = JSON.parse(payload);
                                                    } catch (err) { }
                                                }
                                                return typeof payload === 'object' && payload !== null
                                                    ? JSON.stringify(payload, null, 2)
                                                    : payload || 'No supplemental details provided for this event.';
                                            })()}
                                        </pre>
                                    </div>
                                </div>
                            </div>
                            <div className="p-4 bg-stone-50 border-t border-stone-100 flex justify-end">
                                <button onClick={() => setSelectedLogForDetails(null)} className="px-5 py-2 bg-stone-900 hover:bg-stone-800 text-white font-extrabold text-[11px] uppercase tracking-widest rounded-xl transition-all">
                                    Dismiss Inspector
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default SystemLogsTab;
