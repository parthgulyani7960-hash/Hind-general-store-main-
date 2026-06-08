import React from 'react';
import { motion } from 'motion/react';
import { Bug, Activity, Eye, Trash2 } from 'lucide-react';
import { cn } from '@/types';

interface AutomaticReportsTabProps {
  bugReports: any[];
  setBugReports: (reports: any[]) => void;
  setReportDetailModal: (modal: { open: boolean; report: any }) => void;
  fetchWithHandling: <T>(url: string, options?: any) => Promise<T>;
  getAuthHeaders: () => any;
  toast: any;
}

export default function AutomaticReportsTab({
  bugReports,
  setBugReports,
  setReportDetailModal,
  fetchWithHandling,
  getAuthHeaders,
  toast,
}: AutomaticReportsTabProps) {
  return (
    <div className="h-full overflow-y-auto no-scrollbar space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500 font-sans pb-10 pr-2">
       <header className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div className="space-y-1">
          <div className="flex items-center space-x-3">
            <div className="w-14 h-14 bg-amber-500 text-white rounded-2xl flex items-center justify-center rotate-12 shadow-xl shadow-amber-200">
              <Bug size={28} />
            </div>
            <h2 className="text-4xl font-black text-stone-900 tracking-tight text-left">System Anomalies</h2>
          </div>
          <p className="text-stone-500 font-medium text-lg ml-1 text-left">Automated capture of runtime exceptions and UI failures.</p>
        </div>
        <div className="flex items-center space-x-4 bg-white p-4 rounded-3xl border border-stone-100 shadow-sm">
           <div className="p-3 bg-red-50 text-red-500 rounded-2xl shrink-0">
             <Activity size={20} />
           </div>
           <div className="pr-4 text-left">
             <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest leading-none">Active Errors</p>
             <p className="text-lg font-black text-stone-900 mt-1">{bugReports.length}</p>
           </div>
        </div>
      </header>

      <div className="bg-white rounded-[3rem] shadow-sm border border-stone-100 overflow-hidden font-sans">
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left font-sans">
            <thead className="bg-stone-50/50 text-stone-400 text-[10px] uppercase font-black tracking-[0.25em]">
              <tr>
                <th className="px-10 py-8">ID / Reporter</th>
                <th className="px-6 py-8">Scope & Context</th>
                <th className="px-6 py-8">Error Details</th>
                <th className="px-6 py-8">Device Context</th>
                <th className="px-6 py-8">Timestamp</th>
                <th className="px-10 py-8 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-50">
              {bugReports.map((bug, idx) => (
                <motion.tr 
                  key={bug.id} 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: idx * 0.05 }}
                  className="hover:bg-stone-50/50 transition-all font-mono group animate-in"
                >
                  <td className="px-10 py-6">
                     <div className="flex flex-col items-start">
                        <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest leading-none">ERR-{bug.id.toString().slice(-6)}</span>
                        <span className="text-xs font-black text-stone-800 tracking-tight mt-1 truncate max-w-[120px]" title={bug.reporter_name}>{bug.reporter_name || 'System Node'}</span>
                        <span className="text-[9px] font-bold text-stone-300 uppercase tracking-widest mt-1">UID: {bug.user_id ? bug.user_id.slice(0, 8) : 'GUEST'}</span>
                     </div>
                  </td>
                  <td className="px-6 py-6">
                    <div className="flex flex-col space-y-1 items-start">
                       <div className="flex items-center space-x-2">
                          <div className={cn("w-2 h-2 rounded-full animate-pulse shrink-0", bug.type === 'API_ERROR' ? 'bg-orange-500' : 'bg-red-500')} />
                          <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest">{bug.type || 'REPORTER'}</span>
                       </div>
                       <span className="text-[11px] font-black text-stone-800 uppercase tracking-tighter truncate max-w-[150px] text-left" title={bug.path}>{bug.path || 'System Core'}</span>
                       {bug.api_endpoint && <span className="text-[9px] text-stone-400 truncate max-w-[150px] italic text-left">{bug.api_endpoint}</span>}
                    </div>
                  </td>
                  <td className="px-6 py-6 font-sans">
                     <div className="max-w-[300px] space-y-1 text-left">
                       <p className="text-xs font-bold text-red-600 line-clamp-1" title={bug.message}>{bug.message}</p>
                       <p className="text-[10px] text-stone-400 font-medium leading-relaxed line-clamp-2 italic">"{bug.why || 'No root cause identified.'}"</p>
                     </div>
                  </td>
                  <td className="px-6 py-6">
                     <div className="flex flex-col space-y-1 items-start">
                       <span className="text-[10px] font-bold text-stone-500 uppercase tracking-widest truncate max-w-[150px] text-left" title={bug.device_info}>{bug.device_info || 'Unknown Device'}</span>
                       <span className="text-[9px] text-stone-400 text-left">{bug.screen_resolution || 'Unknown Res'}</span>
                       {bug.network_status && <span className="text-[9px] text-emerald-500 font-black uppercase tracking-tighter text-left">{bug.network_status}</span>}
                     </div>
                  </td>
                  <td className="px-6 py-6">
                     <div className="flex flex-col space-y-1 font-sans items-start">
                       <span className="text-[10px] font-black text-stone-600 uppercase tracking-[0.2em]">{new Date(bug.created_at).toLocaleDateString()}</span>
                       <span className="text-[9px] font-bold text-stone-300 italic">{new Date(bug.created_at).toLocaleTimeString()}</span>
                     </div>
                  </td>
                  <td className="px-10 py-6 text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <button 
                        onClick={() => {
                          setReportDetailModal({ open: true, report: bug });
                        }}
                        className="w-10 h-10 bg-white border border-stone-100 rounded-xl flex items-center justify-center text-stone-400 hover:text-primary transition-all shadow-sm"
                        title="Review Cipher"
                      >
                        <Eye size={16} />
                      </button>
                      <button 
                        onClick={async () => {
                          try {
                            await fetchWithHandling(`/api/bugs/report/${bug.id}`, { method: 'DELETE', headers: getAuthHeaders() });
                            setBugReports(bugReports.filter((b: any) => b.id !== bug.id));
                            toast.success('Report Cleared');
                          } catch (err) {}
                        }}
                        className="w-10 h-10 bg-white border border-stone-100 rounded-xl flex items-center justify-center text-[#ef4444] hover:bg-red-50/50 hover:border-red-100 transition-all shadow-sm"
                        title="Purge Entry"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
              {bugReports.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-10 py-32 text-center text-stone-400 font-bold italic bg-stone-50/50 rounded-[3rem]">Optimal runtime performance. Zero anomalies recently logged.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
