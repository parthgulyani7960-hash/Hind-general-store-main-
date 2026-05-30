import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShoppingBag, Wallet, ArrowLeft, ChevronRight, Clock, CheckCircle2, 
  XCircle, AlertCircle, Package, Truck, Home, Filter, Search, Download, 
  Settings, Info, ExternalLink, Calendar, MapPin, Receipt, ArrowRight,
  TrendingUp, TrendingDown, History, CreditCard, Activity, RefreshCw, Shield
} from 'lucide-react';
import { useStore } from '@/StoreContext';
import { fetchWithHandling } from '@/lib/api';
import { getAuthHeaders } from '@/lib/utils';
import { cn } from '@/types';
import LoadingFallback from '@/components/LoadingFallback';
import toast from 'react-hot-toast';
import { OrderStatusTimeline } from '@/components/admin/OrderStatusTimeline';

type ActivityTab = 'orders' | 'wallet' | 'other';

export default function UserActivity() {
  const { user, t } = useStore();
  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(location.search);
  const initialTab = (queryParams.get('tab') as ActivityTab) || 'orders';
  
  const [activeTab, setActiveTab] = useState<ActivityTab>(initialTab);
  const [orders, setOrders] = useState<any[]>([]);
  const [walletTx, setWalletTx] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    if (!user) {
       navigate('/login');
       return;
    }

    const loadData = async () => {
      setLoading(true);
      try {
        const [ordersData, walletData] = await Promise.all([
          fetchWithHandling<any[]>(`/api/orders/user/${user.id}`, { headers: getAuthHeaders() }),
          fetchWithHandling<any[]>(`/api/wallet-history/${user.id}`, { headers: getAuthHeaders() })
        ]);
        
        if (ordersData) setOrders(ordersData);
        if (walletData) setWalletTx(walletData);
      } catch (err) {
        console.error('Failed to load activity:', err);
        toast.error('Failed to synchronize activity logs');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user, navigate]);

  const filteredOrders = orders.filter(o => {
    const matchesSearch = String(o.order_id || o.id).toLowerCase().includes(searchQuery.toLowerCase()) ||
                          o.items.some((it: any) => it.name.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = filterStatus === 'all' || o.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const filteredWallet = walletTx.filter(tx => {
    const matchesSearch = tx.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          String(tx.id).toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'cancelled': return 'bg-red-50 text-red-600 border-red-100';
      case 'shipped': return 'bg-amber-50 text-amber-600 border-amber-100';
      case 'pending': return 'bg-primary/10 text-primary border-primary/20';
      default: return 'bg-stone-50 text-stone-500 border-stone-100';
    }
  };

  const maskPhoneNumber = (phone: string | null | undefined) => {
    if (!phone) return 'N/A';
    const clean = phone.trim();
    if (clean.length < 4) return '********';
    return clean.slice(0, 3) + '****' + clean.slice(-3);
  };

  if (loading) return <LoadingFallback message="Synchronizing Activity Logs..." />;

  return (
    <div className="min-h-screen bg-stone-50 pb-20">
      <div className="max-w-5xl mx-auto p-4 md:p-8">
           <div className="flex items-center space-x-4 mb-6">
              <button 
                onClick={() => navigate('/profile')}
                className="w-10 h-10 bg-stone-50 border border-stone-100 rounded-xl flex items-center justify-center text-stone-400 hover:text-stone-900 transition-all active:scale-90"
              >
                <ArrowLeft size={20} />
              </button>
              <div>
                <h1 className="text-2xl font-black text-stone-950 tracking-tighter">Activity Central</h1>
                <p className="text-[10px] font-black text-stone-400 uppercase tracking-[0.2em] mt-1">Dedicated Log View</p>
              </div>
           </div>

           {/* Tab Switcher */}
           <div className="flex bg-stone-100 p-1.5 rounded-2xl">
              {[
                { id: 'orders', label: 'Order History', icon: ShoppingBag },
                { id: 'wallet', label: 'Wallet Logs', icon: Wallet },
                { id: 'other', label: 'Other Activity', icon: Activity }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as ActivityTab)}
                  className={cn(
                    "flex-1 flex items-center justify-center space-x-2 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-500 relative overflow-hidden",
                    activeTab === tab.id 
                      ? "bg-white text-stone-900 shadow-xl shadow-stone-200/50" 
                      : "text-stone-400 hover:text-stone-600"
                  )}
                >
                  <tab.icon size={16} className={cn("transition-transform duration-500", activeTab === tab.id ? "scale-110" : "")} />
                  <span>{tab.label}</span>
                  {activeTab === tab.id && (
                    <motion.div 
                      layoutId="tab-active"
                      className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-1 bg-stone-900 rounded-full"
                    />
                  )}
                </button>
              ))}
           </div>
        </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Universal Search/Filter Bar */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
           <div className="flex-1 relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-stone-400 group-focus-within:text-stone-900 transition-colors">
                <Search size={18} />
              </div>
              <input 
                type="text"
                placeholder={`Search ${activeTab}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white border border-stone-200 rounded-[1.25rem] pl-12 pr-6 py-4 text-sm font-medium focus:ring-4 focus:ring-stone-900/5 focus:border-stone-900 transition-all shadow-sm"
              />
           </div>
           {activeTab === 'orders' && (
             <div className="flex bg-white border border-stone-200 rounded-[1.25rem] p-1 shadow-sm overflow-x-auto no-scrollbar">
                {['all', 'pending', 'shipped', 'delivered', 'cancelled'].map((status) => (
                  <button
                    key={status}
                    onClick={() => setFilterStatus(status)}
                    className={cn(
                      "px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all",
                      filterStatus === status ? "bg-stone-900 text-white shadow-lg" : "text-stone-400 hover:text-stone-600"
                    )}
                  >
                    {status}
                  </button>
                ))}
             </div>
           )}
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'orders' && (
            <motion.div
              key="orders-view"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {filteredOrders.length === 0 ? (
                <div className="text-center py-24 bg-white rounded-[3rem] border border-stone-100 shadow-sm">
                   <div className="w-20 h-20 bg-stone-50 rounded-full flex items-center justify-center mx-auto mb-6">
                      <ShoppingBag size={32} className="text-stone-200" />
                   </div>
                   <h3 className="text-xl font-black text-stone-900">No Orders Found</h3>
                   <p className="text-sm text-stone-400 mt-2 font-medium">Your purchase history is clear.</p>
                   <Link to="/products" className="inline-block mt-8 px-8 py-4 bg-stone-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-stone-900/20 active:scale-95 transition-all">Start Shopping</Link>
                </div>
              ) : (
                filteredOrders.map((order) => (
                  <motion.div 
                    key={order.id}
                    layout
                    className="bg-white border border-stone-100 rounded-[2.5rem] overflow-hidden shadow-sm hover:shadow-xl hover:shadow-stone-200/50 transition-all group"
                  >
                    <div className="p-5 md:p-8">
                       <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
                          <div className="flex items-center space-x-4">
                             <div className="w-14 h-14 bg-stone-50 rounded-2xl flex items-center justify-center text-stone-400 group-hover:bg-primary group-hover:text-white transition-all duration-500 shadow-inner">
                                <Package size={24} />
                             </div>
                             <div>
                                <div className="flex items-center space-x-2">
                                  <h4 className="text-lg font-black text-stone-900 tracking-tight leading-none group-hover:text-primary transition-colors">Order #{order.order_id || order.id}</h4>
                                  {order.delivery_type === 'pickup' && (
                                     <span className="bg-amber-100 text-amber-700 text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter">Self Pickup</span>
                                  )}
                                </div>
                                <div className="flex items-center space-x-3 mt-2">
                                   <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest leading-none border-r border-stone-200 pr-3">{new Date(order.created_at).toLocaleDateString()}</p>
                                   <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest leading-none">{order.items.length} Assets</p>
                                </div>
                             </div>
                          </div>
                          
                          <div className="flex flex-col items-end gap-2">
                             <span className={cn(
                               "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border",
                               getStatusColor(order.status)
                             )}>
                               {order.status === 'shipped' && order.delivery_type === 'pickup' ? 'READY FOR PICKUP' : order.status}
                             </span>
                             <p className="text-2xl font-black text-stone-900 tracking-tight leading-none">₹{order.total}</p>
                          </div>
                       </div>

                       <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-8 py-6 md:py-8 border-t border-stone-50">
                          <div className="space-y-4">
                             <div className="flex items-center justify-between">
                                <p className="text-[10px] font-black text-stone-400 uppercase tracking-[0.2em]">Asset Manifest</p>
                                <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest leading-none sm:hidden">{order.items.length} Items</p>
                             </div>
                             <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-1 gap-3 md:space-y-3">
                                {order.items.slice(0, 3).map((item: any, idx: number) => (
                                  <div key={idx} className="flex items-center gap-3 md:gap-4 group/item bg-stone-50/30 p-2 sm:p-0 rounded-xl sm:bg-transparent">
                                     <div className="w-8 h-8 md:w-10 md:h-10 bg-stone-50 rounded-lg overflow-hidden border border-stone-100 flex items-center justify-center shrink-0">
                                        <img src={item.image_url} alt="" className="w-full h-full object-cover opacity-80 group-hover/item:opacity-100 transition-opacity" />
                                     </div>
                                     <div className="flex-1 min-w-0">
                                        <p className="text-[11px] md:text-xs font-bold text-stone-700 truncate">{item.name}</p>
                                        <p className="text-[9px] md:text-[10px] text-stone-400 font-medium whitespace-nowrap">Qty: {item.quantity} • ₹{item.price}</p>
                                     </div>
                                  </div>
                                ))}
                                {order.items.length > 3 && (
                                  <p className="text-[9px] text-stone-400 font-bold italic ml-2 sm:ml-14">+ {order.items.length - 3} more assets</p>
                                )}
                             </div>
                          </div>
                          
                          <div className="space-y-4 lg:border-l lg:border-stone-50 lg:pl-8">
                             <p className="text-[10px] font-black text-stone-400 uppercase tracking-[0.2em]">Transaction Logistics</p>
                             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
                                <div className="flex items-start gap-3 md:gap-4">
                                   <div className="w-8 h-8 rounded-lg bg-stone-50 flex items-center justify-center text-stone-400 shrink-0">
                                      <MapPin size={14} className="md:w-4 md:h-4" />
                                   </div>
                                   <div className="min-w-0">
                                      <p className="text-[11px] md:text-xs font-bold text-stone-700">Delivery Address</p>
                                      <p className="text-[9px] md:text-[10px] text-stone-400 mt-1 leading-relaxed truncate sm:whitespace-normal sm:max-w-none max-w-[150px]">{order.address}</p>
                                   </div>
                                </div>
                                <div className="flex items-start gap-3 md:gap-4">
                                   <div className="w-8 h-8 rounded-lg bg-stone-50 flex items-center justify-center text-stone-400 shrink-0">
                                      <CreditCard size={14} className="md:w-4 md:h-4" />
                                   </div>
                                   <div className="min-w-0">
                                      <p className="text-[11px] md:text-xs font-bold text-stone-700">Payment Protocol</p>
                                      <p className="text-[9px] md:text-[10px] text-stone-400 mt-1 uppercase font-black tracking-widest">{order.payment_method || 'COD'} • {order.payment_status?.toUpperCase() || 'SETTLED'}</p>
                                   </div>
                                </div>
                             </div>
                          </div>
                       </div>

                       <div className="pt-8 border-t border-stone-50 grid grid-cols-2 lg:grid-cols-4 gap-4">
                          <Link 
                            to={`/invoice/${order.id}`}
                            className="flex items-center justify-center space-x-3 py-3 md:py-4 bg-stone-900 text-white rounded-2xl font-black text-[9px] md:text-[10px] uppercase tracking-widest shadow-lg shadow-stone-900/10 hover:bg-black hover:scale-[1.02] active:scale-95 transition-all"
                          >
                             <Receipt size={14} className="w-3.5 h-3.5 md:w-4 md:h-4" />
                             <span>Digital Invoice</span>
                          </Link>
                          <Link 
                            to={`/track-order?orderId=${order.order_id || order.id}&phone=${order.user_phone || user?.phone}`}
                            className="flex items-center justify-center space-x-3 py-3 md:py-4 bg-white border border-stone-200 text-stone-950 rounded-2xl font-black text-[9px] md:text-[10px] uppercase tracking-widest hover:border-stone-900 hover:bg-stone-50 active:scale-95 transition-all shadow-sm"
                          >
                             <Activity size={14} className="w-3.5 h-3.5 md:w-4 md:h-4" />
                             <span>Real-time Track</span>
                          </Link>
                          {order.status === 'pending' && (
                             <button className="flex items-center justify-center space-x-3 py-3 md:py-4 bg-amber-50 text-amber-600 border border-amber-100 rounded-2xl font-black text-[9px] md:text-[10px] uppercase tracking-widest hover:bg-amber-100 active:scale-95 transition-all shadow-sm">
                                <Settings size={14} className="w-3.5 h-3.5 md:w-4 md:h-4" />
                                <span>Adjust Assets</span>
                             </button>
                          )}
                          <Link 
                            to="/support"
                            className="flex lg:flex items-center justify-center space-x-3 py-3 md:py-4 bg-white border border-stone-200 text-stone-400 rounded-2xl font-black text-[9px] md:text-[10px] uppercase tracking-widest hover:text-stone-900 hover:border-stone-900 active:scale-95 transition-all shadow-sm"
                          >
                             <Info size={14} className="w-3.5 h-3.5 md:w-4 md:h-4" />
                             <span>Help Node</span>
                          </Link>
                       </div>
                       
                       {/* Timeline Component Injection */}
                       <div className="mt-6">
                           <OrderStatusTimeline orderId={order.id} />
                       </div>
                    </div>
                  </motion.div>
                ))
              )}
            </motion.div>
          )}

          {activeTab === 'wallet' && (
            <motion.div
              key="wallet-view"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="bg-stone-900 text-white p-10 rounded-[3rem] shadow-2xl relative overflow-hidden group">
                 <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:scale-110 transition-transform duration-1000">
                    <Wallet size={120} />
                 </div>
                 <div className="relative z-10">
                    <p className="text-[10px] font-black uppercase tracking-[0.4em] opacity-50 mb-4">Total Liquid Assets</p>
                    <div className="flex items-center space-x-4">
                       <h2 className="text-6xl font-black tracking-tighter">₹{user?.wallet_balance || 0}</h2>
                       <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center animate-bounce">
                          <ArrowRight size={20} className="-rotate-45" />
                       </div>
                    </div>
                    <div className="mt-10 flex gap-4">
                       <button className="px-8 py-4 bg-white text-stone-900 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:scale-[1.02] active:scale-95 transition-all">Top Up Protocol</button>
                       <button className="px-8 py-4 bg-white/10 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-white/20 active:scale-95 transition-all">View Analytics</button>
                    </div>
                 </div>
              </div>

              <div className="bg-white rounded-[3rem] border border-stone-100 shadow-sm overflow-hidden">
                 <div className="p-8 border-b border-stone-50 flex justify-between items-center bg-stone-50/50">
                    <h3 className="text-lg font-black text-stone-900 tracking-tight">Ledger History</h3>
                    <button className="text-[9px] font-black text-stone-400 hover:text-stone-950 uppercase tracking-[0.2em] transition-colors">Export Ledger CSV</button>
                 </div>
                 
                 <div className="divide-y divide-stone-50 overflow-y-auto no-scrollbar max-h-[600px]">
                    {filteredWallet.length === 0 ? (
                       <div className="p-20 text-center space-y-4">
                          <Activity size={40} className="text-stone-100 mx-auto" />
                          <p className="text-stone-400 font-bold text-sm uppercase tracking-widest">No ledger entries detected</p>
                       </div>
                    ) : (
                      filteredWallet.map((tx) => (
                        <div key={tx.id} className="p-8 flex items-center justify-between hover:bg-stone-50 transition-all group">
                           <div className="flex items-center space-x-6">
                              <div className={cn(
                                "w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 shadow-inner",
                                tx.type === 'credit' ? "bg-emerald-50 text-emerald-600 group-hover:bg-emerald-500 group-hover:text-white" : "bg-red-50 text-red-600 group-hover:bg-red-500 group-hover:text-white"
                              )}>
                                 {tx.type === 'credit' ? <TrendingUp size={24} /> : <TrendingDown size={24} />}
                              </div>
                              <div>
                                 <p className="text-base font-black text-stone-900 tracking-tight leading-none mb-2">{tx.description || (tx.type === 'credit' ? 'Wallet Top-up' : 'Order Purchase')}</p>
                                 <div className="flex flex-wrap items-center gap-2">
                                    <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest leading-none">{new Date(tx.created_at).toLocaleString()}</p>
                                    <span className="w-1 h-1 bg-stone-200 rounded-full" />
                                    <p className="text-[10px] font-black text-stone-500 uppercase tracking-widest leading-none select-all">ID: {tx.id}</p>
                                    
                                    {tx.status && (
                                      <>
                                        <span className="w-1 h-1 bg-stone-200 rounded-full" />
                                        <span className={cn(
                                          "text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-wider",
                                          String(tx.status).toLowerCase() === 'approved' ? "bg-emerald-50 text-emerald-600" :
                                          String(tx.status).toLowerCase() === 'pending' ? "bg-amber-100 text-amber-700 animate-pulse" :
                                          "bg-red-100 text-red-700"
                                        )}>
                                          {tx.status}
                                        </span>
                                      </>
                                    )}

                                    {(!tx.status || ['pending', 'failed', 'rejected'].includes(String(tx.status).toLowerCase())) && (
                                      <Link 
                                        to={`/support?txId=${tx.id}&subject=Verify Transaction ID: ${tx.id}`}
                                        className="ml-1 text-[10px] font-black text-indigo-600 hover:text-indigo-800 hover:underline flex items-center gap-0.5 bg-indigo-50 px-2.5 py-0.5 rounded-lg border border-indigo-100 transition-colors"
                                      >
                                        <span>verify</span>
                                        <ExternalLink size={10} />
                                      </Link>
                                    )}
                                 </div>
                              </div>
                           </div>
                           <div className="text-right flex flex-col items-end">
                              <p className={cn(
                                "text-2xl font-black tracking-tighter leading-none mb-2",
                                tx.type === 'credit' ? "text-emerald-600" : "text-red-600"
                              )}>
                                {tx.type === 'credit' ? '+' : '-'}₹{tx.amount}
                              </p>
                              <span className={cn(
                                "text-[9px] font-black px-3 py-1 rounded-lg uppercase tracking-widest",
                                tx.type === 'credit' ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
                              )}>
                                {tx.type.toUpperCase()}
                              </span>
                           </div>
                        </div>
                      ))
                    )}
                 </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'other' && (
            <motion.div
              key="other-view"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-6"
            >
               <div className="bg-white p-10 rounded-[3rem] border border-stone-100 shadow-sm space-y-8 group transition-all hover:border-primary/20">
                  <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                     <Shield size={28} />
                  </div>
                  <div>
                    <h4 className="text-2xl font-black text-stone-900 tracking-tighter">Security Logs</h4>
                    <p className="text-sm text-stone-400 mt-2 font-medium leading-relaxed">Review login sessions, device authorizations, and credential modification timestamps.</p>
                  </div>
                  <button className="btn-secondary w-full py-4 text-[10px]">Access Secure Logs</button>
               </div>
               <div className="bg-white p-10 rounded-[3rem] border border-stone-100 shadow-sm space-y-8 group transition-all hover:border-primary/20">
                  <div className="w-16 h-16 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                     <History size={28} />
                  </div>
                  <div>
                    <h4 className="text-2xl font-black text-stone-900 tracking-tighter">Review Cycles</h4>
                    <p className="text-sm text-stone-400 mt-2 font-medium leading-relaxed">Dedicated history of your feedback provided to karyana catalog assets.</p>
                  </div>
                  <button className="btn-secondary w-full py-4 text-[10px]">View Feedback Ledger</button>
               </div>
               <div className="bg-white p-10 rounded-[3rem] border border-stone-100 shadow-sm space-y-8 group transition-all hover:border-primary/20 md:col-span-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Activity size={28} />
                      </div>
                      <div>
                         <h4 className="text-2xl font-black text-stone-900 tracking-tighter">Session Synchronization</h4>
                         <p className="text-xs text-stone-400 font-bold uppercase tracking-widest mt-1">Real-time Node Health</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 bg-emerald-50 p-3 rounded-2xl">
                       <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                       <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">Active Link</span>
                    </div>
                  </div>
               </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
