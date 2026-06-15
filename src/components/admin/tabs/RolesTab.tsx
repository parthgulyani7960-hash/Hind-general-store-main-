import React from 'react';
import { Plus, Settings, Trash2, UserCog } from 'lucide-react';
import { motion } from 'motion/react';

interface RolesTabProps {
  roles: any[];
  setRoleModal: (modal: { open: boolean; mode: 'add' | 'edit'; role?: any }) => void;
  setNewRole: (role: { name: string; permissions: string[] }) => void;
  setRoles: (roles: any[]) => void;
  getAuthHeaders: () => any;
  fetchWithHandling: <T>(url: string, options?: any) => Promise<T>;
  toast: any;
}

export default function RolesTab({
  roles,
  setRoleModal,
  setNewRole,
  setRoles,
  getAuthHeaders,
  fetchWithHandling,
  toast,
}: RolesTabProps) {
  return (
    <div className="max-w-full overflow-x-hidden space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500 font-sans pb-10 pr-2">
      <header className="shrink-0 flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div>
          <h2 className="text-4xl font-black text-stone-900 tracking-tight text-left">Role Architecture</h2>
          <p className="text-stone-500 mt-2 text-lg font-medium text-left">Configure authorization tiers, permission mappings, and access protocols.</p>
        </div>
        <button 
          onClick={() => {
            setRoleModal({ open: true, mode: 'add', role: null });
            setNewRole({ name: '', permissions: [] });
          }}
          className="group flex items-center space-x-3 bg-stone-900 text-white px-10 py-5 rounded-[2rem] text-sm font-black uppercase tracking-widest hover:bg-stone-800 transition-all shadow-2xl shadow-stone-900/30 hover:scale-105 active:scale-95"
        >
          <Plus size={20} />
          <span>Create New Tier</span>
        </button>
      </header>

      <div className="bg-stone-50 border border-stone-200/60 p-8 rounded-[2.5rem] flex flex-col lg:flex-row lg:items-center justify-between gap-8">
        <div className="text-left md:max-w-md">
          <h3 className="text-xl font-black text-stone-900 tracking-tight">Rapid Privilege Escalation</h3>
          <p className="text-sm text-stone-500 font-medium mt-2 leading-relaxed">
            Instantly promote an existing user identity to the global administrator whitelist via their email reference.
          </p>
        </div>
        <div className="flex gap-3 w-full lg:w-auto shrink-0">
          <input 
            type="email"
            placeholder="Identity Email Reference..."
            className="w-full lg:w-80 px-6 py-5 bg-white border border-stone-200 rounded-3xl outline-none focus:border-stone-900 text-sm font-bold shadow-sm"
            id="admin-email-input"
          />
          <button 
            onClick={async () => {
              const emailInput = document.getElementById('admin-email-input') as HTMLInputElement;
              const email = emailInput?.value;
              if (!email) return;
              try {
                const data = await fetchWithHandling<any>('/api/admin/make-admin', {
                  method: 'POST',
                  headers: getAuthHeaders(),
                  body: JSON.stringify({ email })
                });
                if (data) {
                  toast.success('Admin role granted');
                  if (emailInput) emailInput.value = '';
                  // In a real app, you might want to refresh lists here
                }
              } catch (e) {
                console.error('Make admin error:', e);
              }
            }}
            className="px-8 py-5 bg-stone-950 text-white rounded-3xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-stone-800 transition-all shadow-lg active:scale-95"
          >
            Grant Access
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
        {roles.map((role, idx) => (
          <motion.div 
            key={role.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.05 }}
            className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-stone-100 flex flex-col justify-between group hover:border-primary/20 hover:shadow-xl transition-all duration-500"
          >
            <div>
              <div className="flex justify-between items-start mb-6">
                <div className="p-4 bg-stone-50 text-stone-900 rounded-2xl group-hover:bg-stone-950 group-hover:text-white transition-colors duration-500">
                  <UserCog size={28} />
                </div>
                <div className="flex space-x-2">
                  <button 
                    onClick={() => {
                      setRoleModal({ open: true, mode: 'edit', role });
                      setNewRole({ name: role.name, permissions: JSON.parse(role.permissions || '[]') });
                    }}
                    className="p-3 text-stone-400 hover:text-primary hover:bg-primary/5 rounded-xl transition-all"
                    title="Designate Scopes"
                  >
                    <Settings size={18} />
                  </button>
                  <button 
                    onClick={async () => {
                      if (!confirm('Permanently deconstruct this role tier?')) return;
                      try {
                        const data = await fetchWithHandling<any>(`/api/admin/roles/${role.id}`, { 
                          method: 'DELETE',
                          headers: getAuthHeaders()
                        });
                        if (data) {
                          toast.success('Role tier deconstructed');
                          const rolesData = await fetchWithHandling<any[]>('/api/admin/roles', { headers: getAuthHeaders() });
                          if (rolesData) setRoles(rolesData);
                        }
                      } catch (err) {
                        console.error('Delete role error:', err);
                      }
                    }}
                    className="p-3 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                    title="Remove Tier"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
              
              <h3 className="text-2xl font-black text-stone-900 tracking-tight mb-2 text-left">{role.name}</h3>
              <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-6 text-left">Authorized Capability Map</p>
              
              <div className="flex flex-wrap gap-2.5">
                {JSON.parse(role.permissions || '[]').map((p: string) => (
                  <span key={p} className="text-[9px] font-black bg-stone-50 text-stone-500 px-3 py-1.5 rounded-xl uppercase tracking-widest border border-stone-100 flex items-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-2" />
                    {p}
                  </span>
                ))}
                {JSON.parse(role.permissions || '[]').length === 0 && (
                  <span className="text-[10px] font-bold text-stone-300 italic">No nodes assigned</span>
                )}
              </div>
            </div>
            
            <div className="mt-8 pt-6 border-t border-stone-50 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-stone-200" />
                <span className="text-[10px] text-stone-400 font-black uppercase tracking-widest">
                  Active Tier
                </span>
              </div>
              <span className="text-[10px] text-stone-300 font-bold italic">
                {new Date(role.created_at).toLocaleDateString()}
              </span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
