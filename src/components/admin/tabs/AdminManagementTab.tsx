import React from 'react';
import { motion } from 'motion/react';
import { Shield, RefreshCw, Activity, Trash2, CheckCircle2, Users } from 'lucide-react';
import { cn } from '@/types';

interface AdminManagementTabProps {
  admins: any[];
  isAdminRefreshing: boolean;
  fetchAdmins: () => void;
  auditLogs: any[];
  deletionRequests: any[];
  approveDeletion: (id: number) => void;
  rejectDeletion: (id: number) => void;
  fetchWithHandling: <T>(url: string, options?: any) => Promise<T>;
  getAuthHeaders: () => any;
  toast: any;
}

export default function AdminManagementTab({
  admins,
  isAdminRefreshing,
  fetchAdmins,
  auditLogs,
  deletionRequests,
  approveDeletion,
  rejectDeletion,
  fetchWithHandling,
  getAuthHeaders,
  toast,
}: AdminManagementTabProps) {
  return (
    <div className="max-w-full overflow-x-hidden space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500 font-sans pb-10">
      <header className="shrink-0 flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div>
          <h2 className="text-4xl font-black text-stone-900 tracking-tight text-left">Admin Governance</h2>
          <p className="text-stone-500 mt-2 text-lg font-medium text-left">Manage operational privileges, track activity nodes, and enforce security protocols.</p>
        </div>
        <div className="flex items-center space-x-3 shrink-0">
           <div className="bg-white p-6 rounded-3xl shadow-sm border border-stone-100 flex items-center space-x-8">
             <div className="flex flex-col items-start">
               <span className="text-[10px] uppercase font-black text-stone-400 tracking-widest leading-none mb-1">Active Admins</span>
               <span className="text-2xl font-black text-stone-900">{admins.length}</span>
             </div>
           </div>
           <button 
            onClick={fetchAdmins}
            disabled={isAdminRefreshing}
            className="bg-stone-50 p-6 rounded-3xl border border-stone-100 hover:bg-stone-100 transition-all active:scale-95"
           >
             <RefreshCw className={cn("text-stone-400", isAdminRefreshing && "animate-spin")} size={24} />
           </button>
        </div>
      </header>

      {/* Whitelist Admin Form */}
      <div className="bg-stone-50 border border-stone-200/60 p-6 rounded-[2rem] flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="text-left md:max-w-md">
          <h3 className="text-lg font-black text-stone-900 tracking-tight">Whitelist New Administrator</h3>
          <p className="text-xs text-stone-500 font-medium mt-1 leading-relaxed">
            If the account already exists, it instantly gains admin privileges. If the account is pending, the email will be whitelisted automatically for future registrations or logins.
          </p>
        </div>
        <form onSubmit={async (e) => {
          e.preventDefault();
          const form = e.currentTarget;
          const emailInput = form.elements.namedItem('email') as HTMLInputElement;
          const durationInput = form.elements.namedItem('duration') as HTMLSelectElement;
          const emailValue = emailInput?.value?.trim();
          const durationValue = durationInput?.value;
          if (!emailValue) return;
          try {
            const data = await fetchWithHandling<{ success: boolean; message?: string }>('/api/admin/make-admin', {
              method: 'POST',
              headers: getAuthHeaders(),
              body: JSON.stringify({ email: emailValue, duration: durationValue })
            });
            if (data && data.success) {
              toast.success(data.message || 'Access granted!');
              if (emailInput) emailInput.value = '';
              fetchAdmins();
            } else {
              toast.error(data?.message || 'Failed to grant access.');
            }
          } catch (err: any) {
            toast.error(err.message || 'Failed to complete process.');
          }
        }} className="flex gap-2 w-full md:w-auto shrink-0">
          <input 
            type="email"
            name="email"
            required
            placeholder="Enter admin email..."
            className="w-full md:w-80 px-5 py-4 bg-white border border-stone-200 rounded-2xl outline-none focus:border-stone-900 text-sm font-bold shadow-sm"
          />
          <select name="duration" className="px-3 py-4 bg-white border border-stone-200 rounded-2xl text-sm font-bold shadow-sm">
             <option value="permanent">Permanent</option>
             <option value="1">1 Hour</option>
             <option value="24">24 Hours</option>
             <option value="168">1 Week</option>
          </select>
          <button 
            type="submit"
            className="px-6 py-4 bg-stone-950 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-stone-800 transition-all shadow-md shrink-0 animate-pulse"
          >
            Grant Admin
          </button>
        </form>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-sm border border-stone-100 overflow-hidden font-sans">
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left font-sans">
            <thead className="bg-stone-50/50 text-stone-400 text-[10px] uppercase font-black tracking-[0.25em]">
              <tr>
                <th className="px-10 py-8">Administrator</th>
                <th className="px-6 py-8">Access Type</th>
                <th className="px-6 py-8">Expires</th>
                <th className="px-6 py-8">Status</th>
                <th className="px-10 py-8 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-50">
              {admins.map((adm, idx) => (
                <motion.tr 
                  key={adm.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="group hover:bg-stone-50/50 transition-all animate-in"
                >
                  <td className="px-10 py-7">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-stone-100 rounded-2xl flex items-center justify-center text-stone-400 group-hover:bg-stone-900 group-hover:text-white transition-all duration-300 shrink-0">
                        <Shield size={18} />
                      </div>
                      <div className="flex flex-col items-start">
                        <p className="text-sm font-black text-stone-900 text-left">{adm.name || 'Admin'}</p>
                        <p className="text-[10px] text-stone-400 font-bold uppercase tracking-widest text-left">{adm.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-7">
                     <span className={cn(
                      "px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border",
                      adm.isPermanent ? "bg-purple-50 text-purple-600 border-purple-100" : "bg-blue-50 text-blue-600 border-blue-100"
                     )}>
                       {adm.isPermanent ? 'Permanent' : 'Temporary'}
                     </span>
                  </td>
                  <td className="px-6 py-7 text-[10px] font-bold text-stone-600">
                    {adm.expiresAt ? new Date(adm.expiresAt).toLocaleString() : 'N/A'}
                  </td>
                  <td className="px-6 py-7">
                      <div className={cn("w-2 h-2 rounded-full", adm.status === 'active' ? 'bg-emerald-500' : 'bg-red-500')} />
                      <span className="text-[10px] font-black text-stone-800 uppercase tracking-widest">
                         {adm.status === 'active' ? 'Active' : 'Disabled'}
                      </span>
                  </td>
                  <td className="px-10 py-7 text-right">
                    <button
                      onClick={async () => {
                        if (window.confirm('Revoke access?')) {
                          try {
                            await fetchWithHandling(`/api/admin/revoke-admin`, {
                              method: 'POST',
                              headers: getAuthHeaders(),
                              body: JSON.stringify({ email: adm.email })
                            });
                            toast.success('Access revoked');
                            fetchAdmins();
                          } catch (err) {}
                        }
                      }}
                      className="px-4 py-2.5 bg-red-50 text-red-600 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-red-100 transition-all"
                    >
                      Revoke
                    </button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 font-sans">
        <div className="bg-stone-50 p-8 rounded-[2rem] border border-dashed border-stone-200">
          <div className="flex items-center space-x-4 mb-6">
            <div className="p-3 bg-stone-900 text-white rounded-2xl shrink-0">
              <Activity size={24} />
            </div>
            <div>
               <h3 className="text-xl font-black text-stone-900 uppercase tracking-tight text-left">Governance Intelligence</h3>
               <p className="text-stone-500 font-medium text-left">Recent high-level node modifications and access patterns.</p>
            </div>
          </div>
          
          <div className="bg-white rounded-3xl border border-stone-100 overflow-hidden">
             <div className="max-h-96 overflow-y-auto no-scrollbar">
                <table className="w-full text-left font-sans">
                   <thead className="bg-stone-50/50 text-stone-400 text-[9px] uppercase font-black tracking-widest">
                      <tr>
                         <th className="px-8 py-5">Node Identity</th>
                         <th className="px-6 py-5">Directive Action</th>
                         <th className="px-6 py-5">Target Resource</th>
                         <th className="px-8 py-5 text-right">Time Offset</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-stone-50">
                      {auditLogs.slice(0, 20).map((log) => (
                         <tr key={log.id} className="hover:bg-stone-50/50 transition-all font-mono text-[10px]">
                            <td className="px-8 py-4 font-black text-stone-600 text-left">{log.admin_id}</td>
                            <td className="px-6 py-4 text-left">
                               <span className="bg-amber-50 text-amber-600 px-2 py-1 rounded text-[8px] font-black border border-amber-100">{log.action}</span>
                            </td>
                            <td className="px-6 py-4 text-stone-400 text-left">{log.target_type}#{log.target_id}</td>
                            <td className="px-8 py-4 text-right text-stone-300">{new Date(log.created_at).toLocaleString()}</td>
                         </tr>
                      ))}
                      {auditLogs.length === 0 && (
                        <tr>
                          <td colSpan={4} className="py-8 text-center text-stone-400 italic">No logs parsed</td>
                        </tr>
                      )}
                   </tbody>
                </table>
             </div>
          </div>
        </div>

        <div className="bg-white rounded-[2rem] p-8 border border-stone-150 shadow-sm relative group overflow-hidden">
           <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none">
             <Trash2 size={120} />
           </div>
           <h3 className="text-2xl font-black text-stone-900 tracking-tight italic mb-8 relative z-10 text-left">Data Deletion Queue</h3>
           <div className="space-y-4 relative z-10">
              {deletionRequests.length === 0 ? (
                <div className="text-center py-20 text-stone-300 bg-stone-50/50 rounded-[2.5rem] border border-dashed border-stone-200 pointer-events-none">
                  <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                    <CheckCircle2 size={32} className="text-emerald-500" />
                  </div>
                  <p className="font-black uppercase text-[10px] tracking-[0.25em] text-stone-300">Privacy Compliance: 100%</p>
                  <p className="text-xs font-bold text-stone-400 mt-2">No active user deletion requests pending.</p>
                </div>
              ) : (
                deletionRequests.map((req) => (
                  <div key={req.id} className="p-8 bg-red-50/50 rounded-[2.5rem] border border-red-100 space-y-6 shadow-sm">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-white rounded-2xl border border-red-100 flex items-center justify-center text-red-500 shadow-sm shrink-0">
                          <Users size={20} />
                        </div>
                        <div className="flex flex-col items-start">
                          <p className="font-black text-red-900 leading-none text-lg tracking-tight text-left">{req.user_name}</p>
                          <p className="text-[10px] font-bold text-red-400 uppercase tracking-widest mt-1.5">Cipher: SYS-DEL-0{req.id}</p>
                        </div>
                      </div>
                      <span className="px-3 py-1 bg-red-100 text-red-600 rounded-lg text-[9px] font-black uppercase tracking-widest border border-red-200">Pending Authorization</span>
                    </div>
                    <div className="bg-white p-5 rounded-2xl text-[11px] font-bold text-red-800 leading-relaxed italic relative border border-red-50 text-left">
                       <span className="absolute -top-3 left-6 px-2 bg-white text-[8px] uppercase tracking-widest text-red-300">User Testimony</span>
                      "{req.reason || 'No internal reason documented'}"
                    </div>
                    <div className="flex gap-3">
                       <button 
                        onClick={() => approveDeletion(req.id)} 
                        className="flex-1 py-4 bg-red-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-red-200 hover:bg-red-700 transition-all hover:scale-[1.02] active:scale-[0.98]"
                       >
                         Authorize Full Purge
                       </button>
                       <button 
                        onClick={() => rejectDeletion(req.id)} 
                        className="px-8 py-4 bg-white text-red-500 rounded-2xl text-xs font-black uppercase tracking-widest border border-red-100 hover:bg-red-50 transition-all"
                       >
                         Reject
                       </button>
                    </div>
                  </div>
                ))
              )}
           </div>
        </div>
      </div>
    </div>
  );
}
