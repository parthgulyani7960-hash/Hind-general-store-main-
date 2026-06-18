import React from 'react';
import ModalContainer from '@/components/ui/ModalContainer';
import { History, Plus, X } from 'lucide-react';
import { cn } from '@/types';
import toast from 'react-hot-toast';
import { fetchWithHandling } from '@/lib/api';
import { getAuthHeaders } from '@/lib/utils';
import { triggerFeedback } from '@/lib/feedback';

interface FinanceModalsProps {
  walletModal: { open: boolean; userId: number | null };
  setWalletModal: (modal: { open: boolean; userId: number | null }) => void;
  walletType: 'credit' | 'debit';
  setWalletType: (type: 'credit' | 'debit') => void;
  walletAmount: string;
  setWalletAmount: (amount: string) => void;
  handleWalletUpdate: () => void;
  
  walletHistoryModal: { open: boolean; userId: number | null; history: any[] };
  setWalletHistoryModal: (modal: any) => void;
  
  expenseModal: { open: boolean };
  setExpenseModal: (modal: { open: boolean }) => void;
  newExpense: { description: string; amount: string; category: string; date: string };
  setNewExpense: (expense: any) => void;
  handleAddExpense: (e: React.FormEvent) => void;
  
  roleModal: { open: boolean; mode: 'add' | 'edit'; role: any };
  setRoleModal: (modal: any) => void;
  newRole: { name: string; permissions: string[] };
  setNewRole: (role: any) => void;
  setRoles: (roles: any[]) => void;
}

export const FinanceModals: React.FC<FinanceModalsProps> = ({
  walletModal,
  setWalletModal,
  walletType,
  setWalletType,
  walletAmount,
  setWalletAmount,
  handleWalletUpdate,
  
  walletHistoryModal,
  setWalletHistoryModal,
  
  expenseModal,
  setExpenseModal,
  newExpense,
  setNewExpense,
  handleAddExpense,
  
  roleModal,
  setRoleModal,
  newRole,
  setNewRole,
  setRoles,
}) => {
  return (
    <>
      {/* Wallet Modal */}
      <ModalContainer
        isOpen={walletModal.open}
        onClose={() => setWalletModal({ open: false, userId: null })}
        title="Update Wallet"
        size="sm"
      >
        <div className="p-8 pb-10 space-y-6">
          <div className="space-y-4">
            <div className="flex bg-stone-100 p-1 rounded-xl">
              <button 
                onClick={() => setWalletType('credit')}
                className={cn("flex-1 py-2 rounded-lg text-sm font-bold transition-all", walletType === 'credit' ? "bg-white shadow-sm text-primary" : "text-stone-500")}
              >
                Add Money
              </button>
              <button 
                onClick={() => setWalletType('debit')}
                className={cn("flex-1 py-2 rounded-lg text-sm font-bold transition-all", walletType === 'debit' ? "bg-white shadow-sm text-red-600" : "text-stone-500")}
              >
                Deduct Money
              </button>
            </div>
            <input 
              type="number" 
              placeholder="Amount (₹)"
              className="w-full bg-stone-50 rounded-xl px-4 py-3 text-center text-2xl font-bold focus:outline-none focus:ring-2 focus:ring-primary/20"
              value={walletAmount}
              onChange={(e) => setWalletAmount(e.target.value)}
            />
          </div>
          <div className="flex space-x-3">
            <button 
              onClick={() => setWalletModal({ open: false, userId: null })}
              className="flex-1 py-3 rounded-xl font-bold text-stone-500 hover:bg-stone-100"
            >
              Cancel
            </button>
            <button 
              onClick={() => {
                triggerFeedback('medium');
                handleWalletUpdate();
              }}
              className="flex-1 py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary/90"
            >
              Confirm
            </button>
          </div>
        </div>
      </ModalContainer>

      {/* Wallet History Modal */}
      <ModalContainer
        isOpen={walletHistoryModal.open}
        onClose={() => setWalletHistoryModal({ ...walletHistoryModal, open: false })}
        title="Transaction History"
        size="lg"
      >
        <div className="p-8 pb-10 flex flex-col max-h-[70vh]">
          <div className="flex-1 overflow-y-auto pr-2 no-scrollbar">
            {walletHistoryModal.history.length === 0 ? (
              <div className="text-center py-12 text-stone-400">
                <History size={48} className="mx-auto mb-4 opacity-20" />
                <p>No transactions found for this user.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {walletHistoryModal.history.map((tx) => (
                  <div key={tx.id} className="p-4 bg-stone-50 rounded-2xl border border-stone-100 flex justify-between items-center">
                    <div className="flex items-center space-x-4">
                      <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center",
                        tx.type === 'credit' ? "bg-emerald-100 text-emerald-600" : "bg-red-100 text-red-600"
                      )}>
                        {tx.type === 'credit' ? <Plus size={20} /> : <X size={20} />}
                      </div>
                      <div>
                        <p className="font-bold text-sm">{tx.description}</p>
                        <p className="text-[10px] text-stone-400 uppercase font-bold tracking-wider">
                          {new Date(tx.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className={cn(
                      "font-bold text-lg",
                      tx.type === 'credit' ? "text-emerald-600" : "text-red-600"
                    )}>
                      {tx.type === 'credit' ? '+' : '-'}₹{tx.amount}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </ModalContainer>

      {/* Expense Modal */}
      <ModalContainer
        isOpen={expenseModal.open}
        onClose={() => setExpenseModal({ open: false })}
        title="Add Expense"
        size="md"
      >
        <div className="p-8 pb-10">
          <form 
            onSubmit={(e) => {
              triggerFeedback('medium');
              handleAddExpense(e);
            }} 
            className="space-y-4"
          >
            <div>
              <label className="block text-sm font-bold text-stone-700 mb-2">Description</label>
              <input 
                type="text" 
                required
                className="w-full bg-stone-50 rounded-xl px-4 py-3 text-sm font-bold text-stone-800 placeholder-stone-300 focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="Electricity Bill, Rent, etc."
                value={newExpense.description}
                onChange={(e) => setNewExpense({...newExpense, description: e.target.value})}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-stone-700 mb-2">Amount (₹)</label>
                <input 
                  type="number" 
                  required
                  className="w-full bg-stone-50 rounded-xl px-4 py-3 text-sm font-bold text-stone-800 placeholder-stone-300 focus:outline-none focus:ring-2 focus:ring-primary/20"
                  value={newExpense.amount}
                  onChange={(e) => setNewExpense({...newExpense, amount: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-stone-700 mb-2">Category</label>
                <select 
                  className="w-full bg-stone-50 rounded-xl px-4 py-3 text-sm font-bold text-stone-800 focus:outline-none focus:ring-2 focus:ring-primary/20"
                  value={newExpense.category}
                  onChange={(e) => setNewExpense({...newExpense, category: e.target.value})}
                >
                  <option value="Stock">Stock</option>
                  <option value="Utilities">Utilities</option>
                  <option value="Rent">Rent</option>
                  <option value="Staff">Staff</option>
                  <option value="Others">Others</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-stone-700 mb-2">Date</label>
              <input 
                type="date" 
                required
                className="w-full bg-stone-50 rounded-xl px-4 py-3 text-sm font-bold text-stone-800 focus:outline-none focus:ring-2 focus:ring-primary/20"
                value={newExpense.date}
                onChange={(e) => setNewExpense({...newExpense, date: e.target.value})}
              />
            </div>
            <div className="flex space-x-3 pt-4">
              <button 
                type="button"
                onClick={() => setExpenseModal({ open: false })}
                className="flex-1 py-3 border border-stone-200 rounded-xl font-bold hover:bg-stone-50"
              >
                Cancel
              </button>
              <button 
                type="submit"
                className="flex-1 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary/90"
              >
                Add
              </button>
            </div>
          </form>
        </div>
      </ModalContainer>

      {/* Role Modal */}
      <ModalContainer
        isOpen={roleModal.open}
        onClose={() => setRoleModal({ ...roleModal, open: false })}
        title={roleModal.mode === 'add' ? 'Create New Role' : 'Edit Role'}
        size="md"
        showHeader={true}
      >
        <div className="p-8 pb-10">
          <p className="text-stone-500 text-sm mb-6">Define permissions for this administrative role.</p>
          <div className="space-y-6">
            <div>
              <label className="block text-[10px] font-bold text-stone-400 uppercase mb-2 tracking-wider">Role Name</label>
              <input 
                type="text" 
                className="w-full bg-stone-50 rounded-xl px-4 py-3 text-sm font-bold text-stone-800 placeholder-stone-300 focus:outline-none focus:ring-2 focus:ring-primary/20" 
                placeholder="e.g., Order Manager"
                value={newRole.name}
                onChange={(e) => setNewRole({ ...newRole, name: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-stone-400 uppercase mb-3 tracking-wider">Permissions</label>
              <div className="grid grid-cols-1 gap-3">
                {[
                  { label: 'View Dashboard', value: 'view_dashboard' },
                  { label: 'Manage Orders', value: 'manage_orders' },
                  { label: 'Manage Products', value: 'manage_products' },
                  { label: 'Manage Users', value: 'manage_users' },
                  { label: 'View Analytics', value: 'view_analytics' },
                  { label: 'Manage Settings', value: 'manage_settings' },
                ].map((perm) => (
                  <label key={perm.value} className="flex items-center space-x-3 p-3 bg-stone-50 rounded-xl cursor-pointer hover:bg-stone-100 transition-colors">
                    <input 
                      type="checkbox" 
                      className="rounded border-stone-300 text-primary focus:ring-primary"
                      checked={newRole.permissions.includes(perm.value)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setNewRole({ ...newRole, permissions: [...newRole.permissions, perm.value] });
                        } else {
                          setNewRole({ ...newRole, permissions: newRole.permissions.filter(p => p !== perm.value) });
                        }
                      }}
                    />
                    <span className="text-xs font-bold text-stone-700">{perm.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
          <div className="mt-8 pt-6 border-t border-stone-100 flex space-x-3">
            <button 
              onClick={() => setRoleModal({ ...roleModal, open: false })}
              className="flex-1 py-3 border border-stone-200 rounded-xl font-bold hover:bg-stone-50 transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={async () => {
                triggerFeedback('light');
                if (!newRole.name) return toast.error('Role name is required');
                try {
                  const method = roleModal.mode === 'add' ? 'POST' : 'PUT';
                  const url = roleModal.mode === 'add' ? '/api/admin/roles' : `/api/admin/roles/${roleModal.role.id}`;
                  const data = await fetchWithHandling<any>(url, {
                    method,
                    headers: getAuthHeaders(),
                    body: JSON.stringify(newRole)
                  });
                  if (data) {
                    toast.success(`Role ${roleModal.mode === 'add' ? 'created' : 'updated'}`);
                    setRoleModal({ ...roleModal, open: false });
                    const rolesData = await fetchWithHandling<any[]>('/api/admin/roles', { headers: getAuthHeaders() });
                    if (rolesData) setRoles(rolesData);
                  }
                } catch (err) {
                  console.error('Save role error:', err);
                }
              }}
              className="flex-1 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all"
            >
              {roleModal.mode === 'add' ? 'Create Role' : 'Save Changes'}
            </button>
          </div>
        </div>
      </ModalContainer>
    </>
  );
};
