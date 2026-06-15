import React, { useState, useEffect } from 'react';
import { Download, Database, RefreshCw } from 'lucide-react';
import { fetchWithHandling } from '@/lib/api';
import { getAuthHeaders } from '@/lib/utils';
import toast from 'react-hot-toast';
import { withErrorReporting } from '@/lib/uiUtils';

interface DataExportsTabProps {
  setExportProgress: (data: { open: boolean; progress: number; label: string }) => void;
}

const DataExportsTab: React.FC<DataExportsTabProps> = ({ setExportProgress }) => {
    const [exports, setExports] = useState<any[]>([]);
    const [isExporting, setIsExporting] = useState<string | null>(null);
    const [exportFormatSelection, setExportFormatSelection] = useState<string | null>(null);
    
    useEffect(() => {
        fetchWithHandling<any[]>('/api/admin/data-exports', { headers: getAuthHeaders() })
          .then(data => data && setExports(data));
    }, []);
    
    const approve = withErrorReporting(async (id: number) => {
        const data = await fetchWithHandling<any>(`/api/admin/data-exports/${id}/approve`, { 
            method: 'POST',
            headers: getAuthHeaders()
        });
        if (data) {
            setExports(prev => prev.map(e => e.id === id ? {...e, status: 'APPROVED'} : e));
            toast.success('Approved');
        }
    }, 'Approve Export Request');

    const reject = withErrorReporting(async (id: number) => {
        const data = await fetchWithHandling<any>(`/api/admin/data-exports/${id}/reject`, { 
            method: 'POST',
            headers: getAuthHeaders()
        });
        if (data) {
            setExports(prev => prev.map(e => e.id === id ? {...e, status: 'REJECTED'} : e));
            toast.success('Rejected');
        }
    }, 'Reject Export Request');

    const handleSystemExport = async (entity: string, format: 'csv' | 'pdf') => {
        if (format === 'pdf') {
            try {
                const { asyncExportData } = await import('@/services/exportService');
                
                const columnsMap: any = {
                    orders: [
                        { header: 'Order ID', dataKey: 'id' },
                        { header: 'Customer', dataKey: 'user_name' },
                        { header: 'Total Value', dataKey: 'total', halign: 'right' },
                        { header: 'Status', dataKey: 'status' },
                        { header: 'Placement Date', dataKey: 'created_at' }
                    ],
                    users: [
                        { header: 'Legal Identity', dataKey: 'name' },
                        { header: 'Phone Node', dataKey: 'phone' },
                        { header: 'Wallet Liquidity', dataKey: 'wallet_balance', halign: 'right' },
                        { header: 'Lifecycle Segment', dataKey: 'computed_segment' }
                    ],
                    products: [
                        { header: 'Item Name', dataKey: 'name' },
                        { header: 'Category', dataKey: 'category' },
                        { header: 'Units in Stock', dataKey: 'stock', halign: 'center' },
                        { header: 'Retail Point', dataKey: 'retail_price', halign: 'right' }
                    ],
                    wallet_transactions: [
                        { header: 'Reference', dataKey: 'id' },
                        { header: 'Type', dataKey: 'type' },
                        { header: 'Magnitude', dataKey: 'amount', halign: 'right' },
                        { header: 'Execution Node', dataKey: 'created_at' }
                    ],
                    system_logs: [
                        { header: 'Event', dataKey: 'message' },
                        { header: 'Level', dataKey: 'level' },
                        { header: 'Registry Node', dataKey: 'created_at' }
                    ],
                    audit_logs: [
                        { header: 'Administrative Action', dataKey: 'action' },
                        { header: 'Operator', dataKey: 'admin_name' },
                        { header: 'Directives', dataKey: 'details' },
                        { header: 'Execution Node', dataKey: 'created_at' }
                    ]
                };

                await asyncExportData(
                    () => fetchWithHandling<any[]>(`/api/admin/export-data/${entity}`, { headers: getAuthHeaders() }).then(d => d || []),
                    columnsMap[entity] || [],
                    'pdf',
                    `${entity}_report`,
                    (prog) => setExportProgress({ open: true, progress: prog, label: `Vaulting ${entity.toUpperCase()} data packet...` }),
                    { title: `System ${entity.replace('_', ' ').toUpperCase()} Intelligence Report` }
                );
            } catch (err) {
                 toast.error('PDF Export engine failed');
            }
            return;
        }

        try {
            setIsExporting(`${entity}-${format}`);
            const response = await fetch(`/api/admin/export/${entity}?format=${format}`, {
               headers: getAuthHeaders()
            });

            if (!response.ok) throw new Error('Export failed');
            
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${entity}_export_${new Date().toISOString().split('T')[0]}.${format}`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            
            toast.success(`${entity.toUpperCase()} export (${format.toUpperCase()}) completed.`);
        } catch (err) {
            toast.error('Export failed');
            console.error(err);
        } finally {
            setIsExporting(null);
        }
    };

    return (
        <div className="max-w-full overflow-x-hidden space-y-8 pb-10 pr-2">
            <div className="bg-white rounded-[2.5rem] p-8 border border-stone-100 shadow-sm relative overflow-hidden">
                 <div className="absolute top-0 right-0 p-8 opacity-5">
                    <Database size={200} />
                 </div>
                 <h2 className="text-2xl font-black mb-2 flex items-center gap-2 relative z-10"><Download className="text-primary" /> System Data Exports</h2>
                 <p className="text-stone-500 mb-8 relative z-10">Scalable backend CSV generation for large datasets. Safe for 10,000+ records.</p>
                 
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 relative z-10">
                    {['orders', 'users', 'products', 'wallet_transactions', 'system_logs', 'audit_logs'].map((ent) => {
                        const friendlyName = ent === 'wallet_transactions' ? 'Financial Hub' : ent === 'system_logs' ? 'System Intel' : ent === 'audit_logs' ? 'Governance Records' : ent;

                        return (
                          <div key={ent} className="flex flex-col gap-2">
                            <button 
                                onClick={() => setExportFormatSelection(ent)}
                                disabled={isExporting !== null}
                                className="p-6 border border-stone-200 rounded-2xl hover:border-primary hover:bg-stone-50 transition-all text-left group"
                            >
                                 <div className="w-12 h-12 bg-stone-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-primary/10 transition-colors">
                                     {isExporting?.startsWith(ent) ? <RefreshCw className="animate-spin text-primary" /> : <Download className="group-hover:text-primary transition-colors text-stone-600" />}
                                 </div>
                                 <h3 className="font-bold text-lg text-stone-900 capitalize mb-1">{friendlyName.replace('_', ' ')}</h3>
                                 <p className="text-xs text-stone-400">Export as...</p>
                            </button>
                            {exportFormatSelection === ent && (
                               <div className="flex gap-2">
                                  <button onClick={() => {handleSystemExport(ent, 'csv'); setExportFormatSelection(null);}} className="flex-1 bg-stone-100 text-stone-700 py-2 rounded-xl text-xs font-bold hover:bg-stone-200">CSV</button>
                                  <button onClick={() => {handleSystemExport(ent, 'pdf'); setExportFormatSelection(null);}} className="flex-1 bg-stone-100 text-stone-700 py-2 rounded-xl text-xs font-bold hover:bg-stone-200">PDF</button>
                               </div>
                            )}
                          </div>
                      );
                    })}
                 </div>
            </div>

            <div className="bg-white rounded-[2.5rem] p-8 border border-stone-100 shadow-sm">
                <h2 className="text-2xl font-bold mb-6">User Export Requests</h2>
                <div className="responsive-table-container">
                <table className="w-full text-left">
                    <thead className="text-[10px] uppercase font-black tracking-widest text-stone-400">
                        <tr>
                            <th className="py-2">User</th>
                            <th className="py-2 text-center">Date Requested</th>
                            <th className="py-2 text-center">Status</th>
                            <th className="py-2 text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                        {(exports || []).map((e: any) => (
                            <tr key={e.id}>
                                <td className="py-4 text-sm font-bold">{e.user_name}</td>
                                <td className="py-4 text-xs text-center">{new Date(e.created_at).toLocaleString()}</td>
                                <td className="py-4 text-xs font-black text-center">{e.status}</td>
                                <td className="py-4 text-right">
                                    {e.status === 'PENDING_REVIEW' && (
                                        <div className="flex gap-2 justify-end">
                                            <button onClick={() => approve(e.id)} className="bg-emerald-600 text-white px-4 py-2 rounded-xl text-[10px] font-bold hover:bg-emerald-700 uppercase tracking-widest transition-colors">Approve</button>
                                            <button onClick={() => reject(e.id)} className="bg-red-500 text-white px-4 py-2 rounded-xl text-[10px] font-bold hover:bg-red-600 uppercase tracking-widest transition-colors">Reject</button>
                                        </div>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                </div>
            </div>
        </div>
    );
};

export default DataExportsTab;
