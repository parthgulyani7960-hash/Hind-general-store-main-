import React from 'react';
import ModalContainer from '@/components/ui/ModalContainer';
import { Users, X, Shield, Download, History, Star, ShoppingBag, StickyNote, AlertTriangle, ShieldCheck } from 'lucide-react';
import { cn } from '@/types';
import toast from 'react-hot-toast';
import { fetchWithHandling } from '@/lib/api';
import { getAuthHeaders, formatPhoneNumber } from '@/lib/utils';
import { triggerFeedback } from '@/lib/feedback';

interface CustomerSupportModalsProps {
  customerModal: { open: boolean; user: any };
  setCustomerModal: (modal: any) => void;
  handleUserUpdate: (userId: number | string, data: any) => void;
  setWalletModal: (modal: any) => void;
  setExportProgress: (prog: any) => void;
  fetchCustomerOrders: (userId: any) => void;
  walletHistoryModal: { userId: any; history: any[] };
  fetchWalletHistory: (userId: any) => void;
  customerActivities: any[];
  fetchUsers: () => void;
  
  reviewResponseModal: { open: boolean; review: any };
  setReviewResponseModal: (modal: any) => void;
  reviewResponse: string;
  setReviewResponse: (resp: string) => void;
  handleRespondReview: () => void;
  
  customerHistoryModal: { open: boolean; orders: any[] };
  setCustomerHistoryModal: (modal: any) => void;
  fetchOrderDetailsModal: (order: any) => void;
}

export const CustomerSupportModals: React.FC<CustomerSupportModalsProps> = ({
  customerModal,
  setCustomerModal,
  handleUserUpdate,
  setWalletModal,
  setExportProgress,
  fetchCustomerOrders,
  walletHistoryModal,
  fetchWalletHistory,
  customerActivities,
  fetchUsers,
  
  reviewResponseModal,
  setReviewResponseModal,
  reviewResponse,
  setReviewResponse,
  handleRespondReview,
  
  customerHistoryModal,
  setCustomerHistoryModal,
  fetchOrderDetailsModal,
}) => {
  const displayPhoneNumber = (phone: string | null | undefined) => {
    return formatPhoneNumber(phone);
  };

  return (
    <>
      {/* Customer Detail Modal */}
      <ModalContainer
        isOpen={customerModal.open && customerModal.user !== null}
        onClose={() => setCustomerModal({ open: false, user: null })}
        size="lg"
        showHeader={false}
      >
        {customerModal.user && (
          <div className="p-8 pb-10">
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 rounded-full bg-stone-100 overflow-hidden">
                  {customerModal.user.profile_photo ? (
                    <img src={customerModal.user.profile_photo} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-stone-300">
                      <Users size={32} />
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="text-2xl font-bold">{customerModal.user.name}</h3>
                  <p className="text-stone-500">{displayPhoneNumber(customerModal.user.phone)}</p>
                  <p className="text-xs text-primary font-bold mt-1">
                    {customerModal.user.lat && customerModal.user.lng ? `Lat: ${customerModal.user.lat.toFixed(4)}, Lng: ${customerModal.user.lng.toFixed(4)}` : 'Location unknown'}
                  </p>
                </div>
              </div>
              <button onClick={() => setCustomerModal({ open: false, user: null })} className="p-2 hover:bg-stone-100 rounded-full">
                <X size={24} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="bg-stone-50 p-6 rounded-2xl space-y-4">
                  <h4 className="font-bold text-stone-900 border-b border-stone-200 pb-2">Account Settings</h4>
                  <div>
                    <label className="block text-xs font-bold text-stone-400 uppercase mb-1 select-none">Role</label>
                    <select 
                      className="w-full bg-stone-50 rounded-xl px-4 py-2 text-sm font-bold text-stone-800 focus:outline-none focus:ring-2 focus:ring-primary/20"
                      value={customerModal.user.role}
                      onChange={(e) => handleUserUpdate(customerModal.user.id, { role: e.target.value })}
                    >
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-stone-400 uppercase mb-1 select-none">Segment</label>
                    <select 
                      className="w-full bg-stone-50 rounded-xl px-4 py-2 text-sm font-bold text-stone-800 focus:outline-none focus:ring-2 focus:ring-primary/20"
                      value={customerModal.user.segment}
                      onChange={(e) => handleUserUpdate(customerModal.user.id, { segment: e.target.value })}
                    >
                      <option value="retail">Retail</option>
                      <option value="wholesale">Wholesale</option>
                      <option value="vip">VIP</option>
                    </select>
                  </div>
                </div>

                <div className="bg-stone-50 p-6 rounded-2xl space-y-4 border-2 border-red-100">
                  <h4 className="font-bold text-red-900 border-b border-red-200 pb-2">Destructive Security Controls</h4>
                  <div className="grid grid-cols-2 gap-3">
                     <button 
                       onClick={() => {
                          const confirmed = window.confirm("CRITICAL: Reset all wallet tokens to zero?");
                          triggerFeedback('medium');
                          if (confirmed) {
                             triggerFeedback('heavy');
                             handleUserUpdate(customerModal.user.id, { wallet_balance: 0 });
                          }
                       }}
                       className="py-3 px-2 bg-white border border-stone-100 text-red-600 rounded-xl text-[10px] font-black uppercase tracking-tighter hover:bg-red-650 hover:text-white transition-all shadow-sm"
                     >
                        Reset Wallet
                     </button>
                     <button 
                       onClick={() => {
                          const confirmed = window.confirm("CRITICAL: Clear all khata liabilities?");
                          triggerFeedback('medium');
                          if (confirmed) {
                             triggerFeedback('heavy');
                             handleUserUpdate(customerModal.user.id, { khata_balance: 0 });
                          }
                       }}
                       className="py-3 px-2 bg-white border border-stone-100 text-red-600 rounded-xl text-[10px] font-black uppercase tracking-tighter hover:bg-red-650 hover:text-white transition-all shadow-sm"
                     >
                        Clear Khata
                     </button>
                     <button 
                       onClick={() => {
                          const newStatus = customerModal.user.status === 'banned' ? 'active' : 'banned';
                          const confirmed = window.confirm(`Protocol: ${newStatus === 'banned' ? 'Deactivate and Ban' : 'Reactivate'} user?`);
                          triggerFeedback('medium');
                          if (confirmed) {
                             triggerFeedback('heavy');
                             handleUserUpdate(customerModal.user.id, { status: newStatus });
                          }
                       }}
                       className={cn(
                          "col-span-2 py-4 rounded-xl text-white text-[10px] font-black uppercase tracking-widest shadow-lg transition-all",
                          customerModal.user.status === 'banned' ? "bg-emerald-600 shadow-emerald-500/20" : "bg-red-600 shadow-red-500/20"
                       )}
                     >
                        {customerModal.user.status === 'banned' ? 'Authorize User Reactivation' : 'Issue Immediate Network Ban'}
                     </button>
                  </div>
                </div>

                <div className="bg-stone-50 p-6 rounded-2xl space-y-4">
                  <h4 className="font-bold text-stone-900 border-b border-stone-200 pb-2">Contact Info</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-stone-400 uppercase mb-1 select-none">Name</label>
                      <input 
                        type="text" 
                        className="w-full bg-stone-50 rounded-xl px-4 py-2 text-sm font-bold text-stone-800 focus:outline-none focus:ring-2 focus:ring-primary/20"
                        defaultValue={customerModal.user.name}
                        onBlur={(e) => handleUserUpdate(customerModal.user.id, { name: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-stone-400 uppercase mb-1 select-none">Phone</label>
                      <input 
                        type="text" 
                        className="w-full bg-stone-50 rounded-xl px-4 py-2 text-sm font-bold text-stone-800 focus:outline-none focus:ring-2 focus:ring-primary/20"
                        defaultValue={customerModal.user.phone}
                        onBlur={(e) => handleUserUpdate(customerModal.user.id, { phone: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-stone-400 uppercase mb-1 select-none">Email</label>
                      <input 
                        type="email" 
                        className="w-full bg-stone-50 rounded-xl px-4 py-2 text-sm font-bold text-stone-800 focus:outline-none focus:ring-2 focus:ring-primary/20"
                        defaultValue={customerModal.user.email}
                        onBlur={(e) => handleUserUpdate(customerModal.user.id, { email: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-stone-400 uppercase mb-1 font-sans">Shop Name</label>
                      <input 
                        type="text" 
                        className="w-full bg-stone-50 rounded-xl px-4 py-2 text-sm font-bold text-stone-800 focus:outline-none focus:ring-2 focus:ring-primary/20"
                        defaultValue={customerModal.user.shop_name}
                        onBlur={(e) => handleUserUpdate(customerModal.user.id, { shop_name: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-stone-400 uppercase mb-1">Pin Code</label>
                      <input 
                        type="text" 
                        className="w-full bg-stone-50 rounded-xl px-4 py-2 text-sm font-bold text-stone-800 focus:outline-none focus:ring-2 focus:ring-primary/20"
                        defaultValue={customerModal.user.pin_code}
                        onBlur={(e) => handleUserUpdate(customerModal.user.id, { pin_code: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-stone-400 uppercase mb-1">Street Address</label>
                      <input 
                        type="text" 
                        className="w-full bg-stone-50 rounded-xl px-4 py-2 text-sm font-bold text-stone-800 focus:outline-none focus:ring-2 focus:ring-primary/20"
                        defaultValue={customerModal.user.street_address}
                        onBlur={(e) => handleUserUpdate(customerModal.user.id, { street_address: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-stone-400 uppercase mb-1">City</label>
                      <input 
                        type="text" 
                        className="w-full bg-stone-50 rounded-xl px-4 py-2 text-sm font-bold text-stone-800 focus:outline-none focus:ring-2 focus:ring-primary/20"
                        defaultValue={customerModal.user.city}
                        onBlur={(e) => handleUserUpdate(customerModal.user.id, { city: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-stone-400 uppercase mb-1">State</label>
                      <input 
                        type="text" 
                        className="w-full bg-stone-50 rounded-xl px-4 py-2 text-sm font-bold text-stone-800 focus:outline-none focus:ring-2 focus:ring-primary/20"
                        defaultValue={customerModal.user.state}
                        onBlur={(e) => handleUserUpdate(customerModal.user.id, { state: e.target.value })}
                      />
                    </div>
                    <div className="pt-4 mt-4 border-t border-stone-100">
                      <label className="block text-[10px] font-black text-amber-500 uppercase mb-2 flex items-center gap-2">
                         <Shield size={10} />
                         <span>Internal Intelligence Notes</span>
                      </label>
                      <textarea 
                        className="w-full bg-amber-50/10 border border-amber-100 rounded-xl p-4 text-xs font-bold text-stone-600 placeholder:text-stone-300 outline-none focus:ring-2 focus:ring-amber-500/20 transition-all min-h-[100px]"
                        placeholder="Log behavioral observations, trade reputation, or verification notes..."
                        defaultValue={customerModal.user.admin_notes}
                        onBlur={(e) => handleUserUpdate(customerModal.user.id, { admin_notes: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="bg-primary/5 p-6 rounded-2xl space-y-4 border border-primary/10">
                  <div className="flex justify-between items-center">
                    <h4 className="font-bold text-primary">Khata Wallet</h4>
                    <div 
                      className={cn(
                        "w-12 h-6 rounded-full p-1 cursor-pointer transition-colors",
                        customerModal.user.khata_enabled ? "bg-primary" : "bg-stone-300"
                      )}
                      onClick={() => handleUserUpdate(customerModal.user.id, { khata_enabled: !customerModal.user.khata_enabled })}
                    >
                      <div className={cn("w-4 h-4 bg-white rounded-full transition-transform", customerModal.user.khata_enabled ? "translate-x-6" : "translate-x-0")} />
                    </div>
                  </div>
                  
                  {customerModal.user.khata_enabled && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-[10px] font-bold text-stone-400 uppercase mb-1">Khata Limit (₹)</label>
                        <input 
                          type="number" 
                          className="w-full bg-stone-50 rounded-xl px-4 py-2 text-sm font-bold text-stone-800 focus:outline-none focus:ring-2 focus:ring-primary/20"
                          defaultValue={customerModal.user.khata_limit}
                          onBlur={(e) => handleUserUpdate(customerModal.user.id, { khata_limit: e.target.value })}
                        />
                      </div>
                      <div className="p-4 bg-white rounded-xl border border-primary/10">
                        <p className="text-xs text-stone-500 mb-1">Current Balance</p>
                        <p className="text-2xl font-bold text-primary">₹{customerModal.user.khata_balance}</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="bg-stone-50 p-6 rounded-2xl space-y-4">
                  <h4 className="font-bold text-stone-900 border-b border-stone-200 pb-2">Wallet Balance</h4>
                  <div className="p-4 bg-white rounded-xl border border-stone-200">
                    <p className="text-xs text-stone-500 mb-1">Main Wallet</p>
                    <p className="text-2xl font-bold text-stone-930">₹{customerModal.user.wallet_balance}</p>
                  </div>
                  <div className="flex flex-col space-y-2">
                    <button 
                      onClick={() => {
                        triggerFeedback('medium');
                        setWalletModal({ open: true, userId: customerModal.user.id });
                      }}
                      className="w-full py-2 bg-primary text-white rounded-xl font-bold hover:bg-primary/95 text-sm"
                    >
                      Manage Funds
                    </button>
                    <button 
                      onClick={async () => {
                        triggerFeedback('medium');
                        const { generateUserExportPDF } = await import('@/services/pdfService');
                        setExportProgress({ open: true, progress: 10, label: 'Accessing secure user nodes...' });
                        try {
                          const [orders, wallet, activities] = await Promise.all([
                            fetchWithHandling<any[]>(`/api/admin/orders?userId=${customerModal.user.id}`, { headers: getAuthHeaders() }),
                            fetchWithHandling<any[]>(`/api/admin/wallet/history?userId=${customerModal.user.id}`, { headers: getAuthHeaders() }),
                            fetchWithHandling<any[]>(`/api/admin/activities?userId=${customerModal.user.id}`, { headers: getAuthHeaders() })
                          ]);
                          setExportProgress({ open: true, progress: 60, label: 'Serializing user history...' });
                          generateUserExportPDF({ user: customerModal.user, orders: orders || [], wallet: wallet || [], activities: activities || [] });
                          setExportProgress({ open: true, progress: 100, label: 'Dossier Dispatch Successful' });
                          toast.success('Dossier generated successfully');
                        } catch (err) {
                          toast.error('Failed to generate full dossier');
                        } finally {
                          setTimeout(() => setExportProgress({ open: false, progress: 0, label: '' }), 1500);
                        }
                      }}
                      className="w-full py-2 text-sm border border-primary text-primary rounded-xl font-bold hover:bg-primary hover:text-white transition-all flex items-center justify-center space-x-2"
                    >
                      <Download size={16} />
                      <span>Export Full Dossier</span>
                    </button>
                    <button 
                      onClick={() => fetchCustomerOrders(customerModal.user.id)}
                      className="w-full py-2 text-sm border border-stone-200 rounded-xl font-bold hover:bg-stone-50 flex items-center justify-center space-x-2"
                    >
                      <History size={16} />
                      <span>View Order History</span>
                    </button>
                  </div>
                </div>

                <div className="bg-stone-50 p-6 rounded-2xl space-y-4">
                  <h4 className="font-bold text-stone-900 border-b border-stone-200 pb-2">Recent Transactions</h4>
                  <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                    {walletHistoryModal.userId === customerModal.user.id ? (
                      walletHistoryModal.history.map((tx: any) => (
                        <div key={tx.id} className="text-[10px] p-2 bg-white rounded border border-stone-100 flex justify-between">
                          <div>
                            <p className="font-bold">{tx.description}</p>
                            <p className="text-stone-400">ID: {tx.transaction_id || `TXN-${tx.id}`}</p>
                          </div>
                          <p className={tx.type === 'credit' ? 'text-emerald-600' : 'text-red-600'}>
                            {tx.type === 'credit' ? '+' : '-'}₹{tx.amount}
                          </p>
                        </div>
                      ))
                    ) : (
                      <button 
                        onClick={() => fetchWalletHistory(customerModal.user.id)}
                        className="text-xs text-primary font-bold hover:underline"
                      >
                        Load History
                      </button>
                    )}
                  </div>
                </div>

                <div className="bg-stone-50 p-6 rounded-2xl space-y-4">
                  <h4 className="font-bold text-stone-900 border-b border-stone-200 pb-2 flex items-center">
                    <ShieldCheck size={16} className="mr-2 text-stone-400" />
                    Security Activity Log
                  </h4>
                  <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                    {customerActivities.length > 0 ? (
                      customerActivities.map((act: any) => (
                        <div key={act.id} className="text-[10px] p-2 bg-white rounded-lg border border-stone-100 space-y-1">
                          <div className="flex justify-between items-start">
                            <span className={cn(
                              "font-black uppercase tracking-tighter px-1.5 py-0.5 rounded",
                              act.severity === 'high' ? "bg-red-100 text-red-700" : 
                              act.severity === 'medium' ? "bg-amber-100 text-amber-700" :
                              "bg-blue-100 text-blue-700"
                            )}>
                              {act.type}
                            </span>
                            <span className="text-stone-300 font-mono">{new Date(act.date).toLocaleString()}</span>
                          </div>
                          <p className="text-stone-600 leading-normal">{act.details}</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-stone-400 py-4 text-center">No security activities logged</p>
                    )}
                  </div>
                </div>

                <div className="bg-red-50 p-6 rounded-2xl space-y-4 border border-red-100 mt-6">
                  <h4 className="font-bold text-red-700 border-b border-red-200 pb-2 flex items-center"><AlertTriangle size={16} className="mr-2" /> Danger Zone & safety measures</h4>
                  <div className="space-y-2 text-xs text-red-800">
                    <p><span className="font-bold">Account Created:</span> {customerModal.user.created_at ? new Date(customerModal.user.created_at).toLocaleString() : 'N/A'}</p>
                    <p><span className="font-bold">Last Known IP:</span> (Logged securely)</p>
                    <button 
                      onClick={async () => {
                        const confirmed = confirm('Are you absolutely sure? This will delete all user data and cannot be undone.');
                        triggerFeedback('medium');
                        if(confirmed) {
                          triggerFeedback('heavy');
                          try {
                            const data = await fetchWithHandling<any>(`/api/admin/users/${customerModal.user.id}`, { 
                              method: 'DELETE',
                              headers: getAuthHeaders()
                            });
                            if (data) {
                              toast.success('User deleted securely');
                              setCustomerModal({ open: false, user: null });
                              fetchUsers();
                            }
                          } catch(e) {
                            console.error('Delete user error:', e);
                          }
                        }
                      }}
                      className="w-full mt-4 py-2 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-colors shadow-sm"
                    >
                      Delete User Account
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </ModalContainer>

      {/* Responder Detail Modal */}
      <ModalContainer
        isOpen={reviewResponseModal.open && reviewResponseModal.review !== null}
        onClose={() => setReviewResponseModal({ open: false, review: null })}
        title="Respond to Review"
        size="md"
        showHeader={true}
      >
        {reviewResponseModal.review && (
          <>
            <div className="p-6 space-y-4">
              <div className="p-4 bg-stone-50 rounded-2xl border border-stone-100">
                <div className="flex justify-between items-start mb-2">
                  <p className="font-bold text-sm">{reviewResponseModal.review.user_name}</p>
                  <div className="flex text-amber-400">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={10} fill={i < reviewResponseModal.review.rating ? "currentColor" : "none"} />
                    ))}
                  </div>
                </div>
                <p className="text-sm text-stone-650 italic">"{reviewResponseModal.review.comment}"</p>
              </div>
              
              <div className="space-y-2">
                <label className="text-xs font-bold text-stone-400 uppercase tracking-wider">Your Response</label>
                <textarea 
                  className="w-full p-4 bg-stone-50 border border-stone-200 rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all min-h-[150px] text-sm"
                  placeholder="Write your response here..."
                  value={reviewResponse}
                  onChange={(e) => setReviewResponse(e.target.value)}
                />
              </div>
            </div>
            <div className="p-6 bg-stone-50 flex justify-end space-x-3">
              <button 
                onClick={() => setReviewResponseModal({ open: false, review: null })}
                className="px-6 py-2 text-stone-500 font-bold hover:text-stone-700 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  triggerFeedback('medium');
                  handleRespondReview();
                }}
                disabled={!reviewResponse}
                className="px-6 py-2 bg-primary text-white rounded-xl font-bold hover:bg-primary/95 shadow-lg disabled:opacity-50"
              >
                Submit Response
              </button>
            </div>
          </>
        )}
      </ModalContainer>

      {/* Customer History Modal */}
      <ModalContainer
        isOpen={customerHistoryModal.open}
        onClose={() => setCustomerHistoryModal({ ...customerHistoryModal, open: false })}
        title="Customer Order History"
        size="lg"
        showHeader={true}
      >
        <div className="p-8 pb-10">
          <div className="flex-1 overflow-y-auto pr-2">
            {customerHistoryModal.orders.length === 0 ? (
              <div className="text-center py-12 text-stone-400">
                <ShoppingBag size={48} className="mx-auto mb-4 opacity-20" />
                <p>No orders found for this customer.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {customerHistoryModal.orders.map((order) => (
                  <div key={order.id} className="p-4 bg-stone-50 rounded-2xl border border-stone-100 flex justify-between items-center">
                    <div>
                      <div className="flex items-center space-x-2">
                        <p className="font-bold text-sm">#ORD-{order.id}</p>
                        {order.admin_notes && (
                          <StickyNote size={12} className="text-amber-500" />
                        )}
                      </div>
                      <p className="text-[10px] text-stone-400 uppercase font-bold tracking-wider">
                        {new Date(order.created_at).toLocaleString()}
                      </p>
                      <span className={cn(
                        "text-[8px] font-bold px-1.5 py-0.5 rounded-full uppercase mt-1 inline-block",
                        order.status === 'delivered' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                      )}>
                        {order.status}
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg">₹{order.total}</p>
                      <button 
                        onClick={() => {
                          fetchOrderDetailsModal(order);
                          setCustomerHistoryModal({ ...customerHistoryModal, open: false });
                        }}
                        className="text-xs text-primary font-bold hover:underline"
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </ModalContainer>
    </>
  );
};
