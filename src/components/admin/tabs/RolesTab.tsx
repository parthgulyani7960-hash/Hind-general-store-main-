import React from 'react';
import { Plus, Settings, Trash2 } from 'lucide-react';

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
    <div className="h-full overflow-y-auto no-scrollbar space-y-6 pb-10 pr-2">
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-stone-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-stone-900 text-left">Admin Management</h2>
          <p className="text-sm text-stone-500 text-left">Grant admin privileges via email</p>
        </div>
        <div className="flex gap-2">
          <input 
            type="email"
            placeholder="Enter email..."
            className="input-field w-64"
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
                }
              } catch (e) {
                console.error('Make admin error:', e);
              }
            }}
            className="btn-primary py-2 px-6 text-sm"
          >
            Grant Admin
          </button>
        </div>
      </div>

      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-stone-900">User Roles & Permissions</h2>
        <button 
          onClick={() => {
            setRoleModal({ open: true, mode: 'add', role: null });
            setNewRole({ name: '', permissions: [] });
          }}
          className="btn-primary flex items-center space-x-2"
        >
          <Plus size={18} />
          <span>Create New Role</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {roles.map((role) => (
          <div key={role.id} className="bg-white p-6 rounded-3xl shadow-sm border border-stone-100 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-bold text-stone-900">{role.name}</h3>
                <div className="flex space-x-2">
                  <button 
                    onClick={() => {
                      setRoleModal({ open: true, mode: 'edit', role });
                      setNewRole({ name: role.name, permissions: JSON.parse(role.permissions || '[]') });
                    }}
                    className="p-2 text-stone-400 hover:text-primary transition-colors"
                  >
                    <Settings size={16} />
                  </button>
                  <button 
                    onClick={async () => {
                      if (!confirm('Delete this role?')) return;
                      try {
                        const data = await fetchWithHandling<any>(`/api/admin/roles/${role.id}`, { 
                          method: 'DELETE',
                          headers: getAuthHeaders()
                        });
                        if (data) {
                          toast.success('Role deleted');
                          const rolesData = await fetchWithHandling<any[]>('/api/admin/roles', { headers: getAuthHeaders() });
                          if (rolesData) setRoles(rolesData);
                        }
                      } catch (err) {
                        console.error('Delete role error:', err);
                      }
                    }}
                    className="p-2 text-stone-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {JSON.parse(role.permissions || '[]').map((p: string) => (
                  <span key={p} className="text-[10px] font-bold bg-stone-100 text-stone-500 px-2 py-1 rounded-full uppercase">
                    {p}
                  </span>
                ))}
              </div>
            </div>
            <div className="mt-6 pt-4 border-t border-stone-50">
              <p className="text-xs text-stone-400 text-left">Created on {new Date(role.created_at).toLocaleDateString()}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
