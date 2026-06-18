import React, { useState } from 'react';
import { 
  Users, Search, RefreshCw, Eye, MoreVertical, 
  ShoppingBag, History, Plus, MessageCircle, Bell,
  ShieldCheck, Clock, AlertCircle, IndianRupee, Activity, LayoutDashboard, Database
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn, formatPhoneNumber } from '@/lib/utils';
import ExportTriggerButton from '@/components/admin/ExportTriggerButton';

interface CustomersTabProps {
    users: any[];
    loading: boolean;
    setWalletModal: (val: any) => void;
    setCustomerModal: (val: any) => void;
    fetchCustomerOrders: (id: number) => void;
    fetchWalletHistory: (id: number) => void;
    setUsers: React.Dispatch<React.SetStateAction<any[]>>;
    fetchWithHandling: <T>(url: string, options?: any) => Promise<T | null>;
    getAuthHeaders: () => any;
    toast: any;
}

const CustomersTab: React.FC<CustomersTabProps> = ({
    users,
    loading,
    setWalletModal,
    setCustomerModal,
    fetchCustomerOrders,
    fetchWalletHistory,
    setUsers,
    fetchWithHandling,
    getAuthHeaders,
    toast
}) => {
    const [customerSearchTerm, setCustomerSearchTerm] = useState('');
    const [selectedSegment, setSelectedSegment] = useState('all');
    const [activeActionMenuId, setActiveActionMenuId] = useState<string | null>(null);

    const displayPhoneNumber = (phone: string | null | undefined) => {
        return formatPhoneNumber(phone);
    };

    const filteredUsers = users.filter(u => {
        const matchesSearch = !customerSearchTerm || 
          (u.name?.toLowerCase() || '').includes(customerSearchTerm.toLowerCase()) ||
          (u.phone?.toString() || '').includes(customerSearchTerm) ||
          (u.email?.toLowerCase() || '').includes(customerSearchTerm.toLowerCase());
        
        const matchesSegment = selectedSegment === 'all' || 
          u.computed_segment === selectedSegment || 
          (selectedSegment === 'Khata Requests' && u.khata_requested && !u.khata_enabled);
          
        return matchesSearch && matchesSegment;
    });

    return (
        <div className="max-w-full overflow-x-hidden space-y-10 animate-in fade-in duration-500 pb-10">
            {/* Intelligence Header */}
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-8">
              <div>
                <h2 className="text-4xl font-black text-stone-900 tracking-tight">Customer Insights</h2>
                <p className="text-stone-500 mt-2 text-lg font-medium">Segment behavior, wallet states, and lifetime value analytics.</p>
              </div>
              <div className="flex flex-wrap gap-4 items-end">
                <div className="bg-white px-6 py-4 rounded-3xl border border-stone-100 shadow-sm flex flex-col min-w-[140px]">
                  <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-1">Total Humans</span>
                  <span className="text-xl font-black text-primary">{users.length}</span>
                </div>
                <div className="bg-white px-6 py-4 rounded-3xl border border-stone-100 shadow-sm flex flex-col min-w-[140px]">
                  <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-1">Active Wallets</span>
                  <span className="text-xl font-black text-emerald-500">₹{users.reduce((acc, u) => acc + (u.wallet_balance || 0), 0).toLocaleString()}</span>
                </div>
                <div className="flex flex-col items-end gap-3">
                  <ExportTriggerButton type="users" onClick={() => {}} />
                </div>
              </div>
            </header>

            {/* Segment & Search Toolbar */}
            <section className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-stone-100 flex flex-wrap items-center gap-8">
              <div className="flex items-center space-x-3 pr-8 border-r border-stone-100 h-12">
                <div className="p-3 bg-stone-900 rounded-2xl text-white">
                  <Users size={20} />
                </div>
                <span className="text-xs font-black text-stone-900 uppercase tracking-widest leading-none">Social<br/><span className="text-stone-400 font-bold">Groups</span></span>
              </div>
              
              <div className="flex flex-1 items-center space-x-2 overflow-x-auto no-scrollbar scroll-smooth gap-1">
                {['all', 'Khata Requests', 'Champion', 'Loyal', 'Recent', 'At Risk', 'Lost'].map((segment) => (
                  <button
                    key={segment}
                    onClick={() => setSelectedSegment(segment)}
                    className={cn(
                      "px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap outline-none",
                      selectedSegment === segment
                        ? "bg-stone-900 text-white shadow-xl shadow-stone-200" 
                        : "text-stone-400 hover:text-stone-900 hover:bg-stone-50"
                    )}
                  >
                    {segment === 'all' ? 'All Intelligence' : segment}
                  </button>
                ))}
              </div>

              <div className="flex items-center space-x-4 pl-4 border-l border-stone-100">
                <div className="relative group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-300 group-focus-within:text-primary transition-colors" size={18} />
                  <input 
                    type="text" 
                    placeholder="Search humans..."
                    className="bg-stone-50 border-stone-200 border rounded-2xl pl-12 pr-4 py-3.5 text-sm focus:ring-4 focus:ring-primary/10 outline-none transition-all placeholder:text-stone-300 font-medium w-64 uppercase tracking-wider text-[10px]"
                    value={customerSearchTerm}
                    onChange={(e) => setCustomerSearchTerm(e.target.value)}
                  />
                </div>
                <motion.button 
                  whileHover={{ rotate: 180 }}
                  onClick={() => { setSelectedSegment('all'); setCustomerSearchTerm(''); }}
                  className="p-3.5 bg-stone-50 border border-stone-200 rounded-2xl text-stone-400 hover:text-primary transition-all shadow-sm"
                >
                  <RefreshCw size={20} />
                </motion.button>
              </div>
            </section>

            <div className="bg-white rounded-[2.5rem] shadow-sm border border-stone-100 overflow-hidden">
              <div className="overflow-x-auto no-scrollbar hidden md:block">
                <table className="w-full text-left">
                  <thead className="bg-stone-50/50 text-stone-400 text-xs uppercase font-black tracking-[0.15em]">
                    <tr>
                      <th className="px-8 py-6">Human Identity</th>
                      <th className="px-6 py-6">Lifecycle Segment</th>
                      <th className="px-6 py-6 text-right">Settlement Wallet</th>
                      <th className="px-6 py-6">Commercial value</th>
                      <th className="px-6 py-6">Credit Policy</th>
                      <th className="px-8 py-6 text-right">Governance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-50">
                    {filteredUsers.map((u, idx) => (
                      <motion.tr 
                        key={u.id} 
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.03 }}
                        className="hover:bg-stone-50/80 transition-all duration-300 group"
                      >
                        <td className="px-8 py-6">
                          <div className="flex items-center space-x-4">
                            <div className="relative">
                              <div className="w-14 h-14 rounded-[1.25rem] bg-stone-100 flex items-center justify-center overflow-hidden border border-stone-200/50 shadow-sm group-hover:scale-105 transition-transform duration-500">
                                {u.profile_photo ? (
                                  <img src={u.profile_photo} alt="" className="w-full h-full object-cover" />
                                ) : (
                                  <Users size={22} className="text-stone-400" />
                                )}
                              </div>
                            </div>
                            <div>
                             <p className="text-sm font-black text-stone-900 group-hover:text-primary transition-colors tracking-tight select-text">{u.name || (u.email ? u.email.split('@')[0] : 'Unknown User')}</p>
                              <p className="text-xs text-stone-400 font-bold uppercase tracking-[0.15em] mt-0.5 select-text">{displayPhoneNumber(u.phone) || u.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-6">
                           <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border bg-stone-50 text-stone-500 border-stone-100">
                             {u.computed_segment || u.segment || 'PROSPECT'}
                           </span>
                        </td>
                        <td className="px-6 py-6 text-right">
                          <span className="text-base font-black text-primary tracking-tighter select-text">₹{(u.wallet_balance || 0).toLocaleString()}</span>
                        </td>
                        <td className="px-6 py-6 font-bold text-sm text-stone-500">
                           <span className="text-sm font-black text-stone-900 tracking-tight select-text">{(u as any).total_orders || 0} Transactions</span>
                        </td>
                        <td className="px-6 py-6">
                            <span className={cn("text-xs font-black uppercase tracking-[0.15em]", u.khata_enabled ? "text-stone-900" : "text-stone-300")}>
                                {u.khata_enabled ? 'Line of Credit' : 'NO LINE'}
                            </span>
                        </td>
                        <td className="px-8 py-6 text-right flex items-center justify-end gap-2">
                          <button 
                            onClick={() => setWalletModal({ open: true, user: u })}
                            className="p-3 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-2xl transition-all"
                          >
                            <IndianRupee size={18} />
                          </button>
                          <button 
                            onClick={() => setCustomerModal({ open: true, user: u })}
                            className="p-3 bg-stone-50 text-stone-500 hover:text-primary rounded-2xl transition-all"
                          >
                            <Eye size={18} />
                          </button>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
        </div>
    );
};

export default CustomersTab;
