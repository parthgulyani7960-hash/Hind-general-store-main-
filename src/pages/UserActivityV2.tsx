import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShoppingBag, 
  Wallet, 
  ArrowLeft, 
  Clock, 
  Calendar, 
  ChevronRight, 
  Copy, 
  CheckCircle2, 
  X, 
  FileText, 
  AlertCircle, 
  RefreshCw, 
  Plus,
  Star
} from 'lucide-react';
import { useStore } from '../StoreContext';
import { fetchWithHandling } from '../lib/api';
import { getAuthHeaders } from '../lib/utils';
import { cn } from '../lib/utils';
import LoadingFallback from '../components/LoadingFallback';
import toast from 'react-hot-toast';

type ActivityTab = 'orders' | 'wallet' | 'khata';

export default function UserActivity() {
  const { user, config = [] } = useStore();
  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(location.search);
  const initialTab = (queryParams.get('tab') as ActivityTab) || 'orders';
  
  const [activeTab, setActiveTab] = useState<ActivityTab>(initialTab);
  const [orders, setOrders] = useState<any[]>([]);
  const [walletTx, setWalletTx] = useState<any[]>([]);
  const [khataTx, setKhataTx] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedOrders, setExpandedOrders] = useState<Record<string, boolean>>({});

  // Review Modal State
  const [showReviewModal, setShowReviewModal] = useState<{ open: boolean; orderId: number | null }>({ open: false, orderId: null });
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  const loadData = async () => {
    if (!user) return;
    try {
      const [ordersData, walletData, khataData] = await Promise.all([
        fetchWithHandling<any[]>(`/api/orders/user/${user.id}`, { headers: getAuthHeaders() }).catch(() => []),
        fetchWithHandling<any[]>(`/api/wallet-history/${user.id}`, { headers: getAuthHeaders() }).catch(() => []),
        fetchWithHandling<any[]>(`/api/user/khata/history/${user.id}`, { headers: getAuthHeaders() }).catch(() => [])
      ]);
      
      if (ordersData) {
        // Sort orders newest first
        const sortedOrders = [...ordersData].sort((a: any, b: any) => 
          new Date(b.created_at || b.date || 0).getTime() - new Date(a.created_at || a.date || 0).getTime()
        );
        setOrders(sortedOrders);
      }
      if (walletData) {
        setWalletTx(walletData);
      }
      if (khataData) {
        setKhataTx(khataData);
      }
    } catch (err) {
      console.error('Error synchronizing active directories:', err);
    }
  };

  useEffect(() => {
    if (!user) {
       navigate('/login');
       return;
    }
    setLoading(true);
    loadData().finally(() => setLoading(false));
  }, [user]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
    toast.success('Activity logs synchronized');
  };

  const getOrderStatusColor = (status: string) => {
    const s = status?.toLowerCase() || '';
    if (s.includes('deliver')) return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
    if (s.includes('cancel')) return 'bg-rose-50 text-rose-700 border border-rose-200';
    if (s.includes('process') || s.includes('pack')) return 'bg-blue-50 text-blue-700 border border-blue-200';
    if (s.includes('ship') || s.includes('route')) return 'bg-indigo-50 text-indigo-700 border border-indigo-200';
    return 'bg-amber-50 text-amber-700 border border-amber-200';
  };

  const toggleOrderExpand = (id: string) => {
    setExpandedOrders(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleReviewSubmit = async () => {
    if (!showReviewModal.orderId) return;
    setIsSubmittingReview(true);
    try {
      const response = await fetchWithHandling<{ success: boolean; message?: string }>('/api/reviews/add', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          userId: user?.id,
          orderId: showReviewModal.orderId,
          rating: reviewRating,
          comment: reviewComment
        })
      });

      if (response && response.success) {
        toast.success(response.message || 'Review submitted successfully!');
        setShowReviewModal({ open: false, orderId: null });
        setReviewComment('');
        setReviewRating(5);
        // reload orders to reflect review status
        loadData();
      } else {
        toast.error(response?.message || 'Failed to submit review');
      }
    } catch (err) {
      toast.error('An error occurred during submission');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  if (loading) return <LoadingFallback message="Synchronizing Activity Central..." />;

  const isOrdersEmpty = orders.length === 0;
  const isWalletEmpty = walletTx.length === 0;
  const isKhataEmpty = khataTx.length === 0;

  const currentTabEmpty = 
    (activeTab === 'orders' && isOrdersEmpty) || 
    (activeTab === 'wallet' && isWalletEmpty) || 
    (activeTab === 'khata' && isKhataEmpty);

  return (
    <div className="min-h-[90vh] bg-stone-50 select-none pb-24 pt-8 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Back navigational cue & Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <Link 
              to="/profile" 
              className="p-3 bg-white hover:bg-stone-100 rounded-2xl border border-stone-200/65 shadow-sm transition-all duration-300"
              title="Back to profile"
            >
              <ArrowLeft size={18} className="text-stone-600" />
            </Link>
            <div>
              <h1 className="text-2xl font-black text-stone-900 tracking-tight">Activity Central</h1>
              <p className="text-xs text-stone-500 font-medium">Verify your transaction statements and order protocols.</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-3 bg-white hover:bg-stone-50 border border-stone-200 rounded-2xl text-stone-600 transition-all shadow-sm flex items-center justify-center disabled:opacity-55"
              title="Synchronize records"
            >
              <RefreshCw size={16} className={cn("transition-transform duration-700", refreshing && "animate-spin")} />
            </button>
            <Link
              to="/add-money"
              className="px-5 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold text-xs rounded-2xl shadow-md cursor-pointer transition-all flex items-center gap-2 tracking-wider uppercase"
            >
              <Plus size={14} className="stroke-[3]" />
              <span>Add Money</span>
            </Link>
          </div>
        </div>

        {/* Triple category activity selector selectors */}
        <div className="bg-white p-1.5 rounded-[1.75rem] shadow-sm border border-stone-100 grid grid-cols-3 gap-2">
          {[
            { id: 'orders', label: 'My Orders', count: orders.length, icon: ShoppingBag, color: 'text-indigo-600 bg-indigo-50/50' },
            { id: 'wallet', label: 'Wallet Logs', count: walletTx.length, icon: Wallet, color: 'text-emerald-600 bg-emerald-50/50' },
            { id: 'khata', label: 'Khata Ledger', count: khataTx.length, icon: Clock, color: 'text-amber-600 bg-amber-50/50' }
          ].map(tab => (
            <button 
              key={tab.id} 
              onClick={() => {
                setActiveTab(tab.id as ActivityTab);
                navigate(`/history?tab=${tab.id}`, { replace: true });
              }}
              className={cn(
                "py-3.5 px-2 rounded-2xl flex flex-col sm:flex-row items-center justify-center gap-2 transition-all font-bold text-xs tracking-tight relative",
                activeTab === tab.id 
                  ? "bg-stone-900 text-white shadow-xl shadow-stone-900/10 scale-[1.01]" 
                  : "text-stone-500 hover:bg-stone-50 hover:text-stone-800"
              )}
            >
              <tab.icon size={15} className={cn(activeTab === tab.id ? "text-white" : "text-stone-400")} />
              <span className="truncate max-w-[70px] sm:max-w-none">{tab.label}</span>
              {tab.count > 0 && (
                <span className={cn(
                  "hidden sm:inline-block px-2 py-0.5 rounded-full text-[9px] font-black tracking-wide",
                  activeTab === tab.id ? "bg-white/20 text-white" : "bg-stone-100 text-stone-600"
                )}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Ledger display screen card. Constrained nicely. Scrollable ONLY if content is present */}
        <motion.div 
          layout
          className={cn(
            "bg-white rounded-[2.5rem] p-6 sm:p-8 shadow-sm border border-stone-100 flex flex-col transition-all duration-350",
            currentTabEmpty ? "h-[320px] justify-center items-center" : "max-h-[640px]"
          )}
        >
          {/* Active Tab rendering */}
          {currentTabEmpty ? (
            <div className="text-center py-8 space-y-4">
              <div className="w-16 h-16 bg-stone-50 rounded-full flex items-center justify-center mx-auto text-stone-300 border border-stone-100/50">
                {activeTab === 'orders' ? <ShoppingBag size={28} /> : activeTab === 'wallet' ? <Wallet size={28} /> : <Clock size={28} />}
              </div>
              <div>
                <h3 className="font-bold text-stone-700 capitalize">No {activeTab} Recorded</h3>
                <p className="text-xs text-stone-400 max-w-sm mx-auto mt-1">There are currently no active transactions, applications, or invoices registered under this account.</p>
              </div>
            </div>
          ) : (
            <div className="overflow-y-auto pr-1 space-y-5 flex-grow no-scrollbar custom-scroll">
              <AnimatePresence mode="popLayout">
                
                {/* 1. ORDERS LOG */}
                {activeTab === 'orders' && orders.map((o: any) => {
                  const isExpanded = !!expandedOrders[o.id];
                  const invoiceDate = o.created_at || o.date || new Date().toISOString();
                  return (
                    <motion.div 
                      key={o.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="bg-stone-50 border border-stone-200/55 rounded-3xl p-5 hover:border-stone-300 transition-all duration-300"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-stone-200/40">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-black text-stone-850">Order #ORD-{o.id.slice(-6).toUpperCase()}</span>
                            <button 
                              onClick={() => {
                                navigator.clipboard.writeText(`ORD-${o.id}`);
                                toast.success('Order ID copied');
                              }}
                              className="p-1 hover:bg-stone-200 rounded-lg text-stone-400 hover:text-stone-700 transition"
                            >
                              <Copy size={11} className="inline" />
                            </button>
                          </div>
                          <div className="flex items-center gap-2 text-[11px] text-stone-400 font-bold font-mono">
                            <Calendar size={11} />
                            <span>{new Date(invoiceDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                            <span className="text-stone-300">•</span>
                            <Clock size={11} />
                            <span>{new Date(invoiceDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className={cn("px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider", getOrderStatusColor(o.status))}>
                            {o.status}
                          </span>
                        </div>
                      </div>

                      {/* Display items summary preview */}
                      <div className="pt-4 space-y-2.5">
                        <div className="flex justify-between text-xs text-stone-500 font-bold">
                          <span>Items details:</span>
                          <span className="text-stone-900 font-extrabold">{o.items?.length || 0} product(s)</span>
                        </div>
                        
                        <div className="space-y-1.5">
                          {o.items?.slice(0, isExpanded ? undefined : 2).map((item: any, idx: number) => (
                            <div key={idx} className="flex justify-between items-center bg-white p-2.5 rounded-xl border border-stone-200/35 text-xs text-stone-700 font-semibold">
                              <span className="truncate max-w-[200px] sm:max-w-xs">{item.product_name || item.name} <span className="text-stone-400">x{item.quantity}</span></span>
                              <span className="font-extrabold text-stone-900 font-mono">₹{item.price * item.quantity}</span>
                            </div>
                          ))}
                        </div>

                        {o.items?.length > 2 && (
                          <button 
                            onClick={() => toggleOrderExpand(o.id)}
                            className="text-[10px] uppercase font-black text-indigo-600 hover:text-indigo-800 transition py-1"
                          >
                            {isExpanded ? 'Collapse list' : `View ${o.items.length - 2} more items...`}
                          </button>
                        )}

                        <div className="flex items-center justify-between pt-4 mt-2 border-t border-dashed border-stone-200/60">
                          <div className="flex flex-col">
                            <span className="text-[10px] uppercase font-bold tracking-widest text-stone-400">Total Charged</span>
                            <span className="text-lg font-black text-stone-900 tracking-tight leading-tight">₹{o.total?.toLocaleString('en-IN') || '0'}</span>
                          </div>

                          {/* Action button inside log */}
                          <div className="flex gap-2">
                            {o.status === 'delivered' && !o.reviewed && (
                              <button 
                                onClick={() => setShowReviewModal({ open: true, orderId: o.id })}
                                className="px-4 py-2 hover:bg-amber-50 border border-amber-200/70 text-amber-600 rounded-xl font-bold text-xs hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-1.5 shadow-sm"
                              >
                                <Star size={12} fill="currentColor" />
                                <span>Review Product</span>
                              </button>
                            )}
                            <Link 
                              to={`/track-order?id=${o.id}`}
                              className="px-4 py-2 bg-stone-900 hover:bg-stone-850 text-white rounded-xl font-bold text-xs hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-1 shadow-sm"
                            >
                              <span>Details & Track</span>
                              <ChevronRight size={12} />
                            </Link>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}

                {/* 2. WALLET LOGS */}
                {activeTab === 'wallet' && walletTx.map((tx: any) => {
                  const isDebit = tx.type === 'debit';
                  const timestamp = tx.created_at || new Date().toISOString();
                  return (
                    <motion.div 
                      key={tx.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="flex items-center justify-between p-4 bg-stone-50 border border-stone-200/45 rounded-2xl hover:bg-stone-100/50 transition-all duration-200"
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center text-xs font-black",
                          isDebit ? "bg-rose-100 text-rose-700" : (tx.status === 'pending' ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700")
                        )}>
                          {isDebit ? 'DR' : 'CR'}
                        </div>
                        <div className="space-y-0.5">
                          <p className="font-extrabold text-stone-800 text-sm leading-tight">{tx.description || 'Wallet Update'}</p>
                          <div className="flex items-center gap-2 text-[10px] text-stone-400 font-bold font-mono">
                            <span>{new Date(timestamp).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                            <span>•</span>
                            <span className="uppercase tracking-widest text-[9px]">ID: #{String(tx.id).slice(-6).toUpperCase()}</span>
                          </div>
                          {tx.transaction_id && (
                            <p className="text-[9px] text-stone-400 font-semibold font-mono">UTR: {tx.transaction_id}</p>
                          )}
                        </div>
                      </div>

                      <div className="text-right flex flex-col items-end">
                        <p className={cn(
                          "text-base font-black tracking-tighter leading-tight",
                          isDebit ? "text-rose-600" : "text-emerald-600"
                        )}>
                          {isDebit ? '-' : '+'}₹{tx.amount.toLocaleString('en-IN')}
                        </p>
                        <span className={cn(
                          "text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded mt-1",
                          tx.status === 'pending' ? "bg-amber-50 text-amber-700 animate-pulse" : (isDebit ? "bg-rose-50 text-rose-600" : "bg-emerald-50 text-emerald-600")
                        )}>
                          {tx.status === 'pending' ? 'Pending Approval' : (isDebit ? 'Settled' : 'Verified')}
                        </span>
                      </div>
                    </motion.div>
                  );
                })}

                {/* 3. KHATA LEDGER LOGS */}
                {activeTab === 'khata' && khataTx.map((tx: any) => {
                  const isDebit = tx.type === 'debit';
                  const timestamp = tx.created_at || new Date().toISOString();
                  return (
                    <motion.div 
                      key={tx.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="flex items-center justify-between p-4 bg-stone-50 border border-stone-200/45 rounded-2xl hover:bg-stone-100/50 transition-all duration-200"
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center text-xs font-black",
                          isDebit ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"
                        )}>
                          {isDebit ? 'DR' : 'CR'}
                        </div>
                        <div className="space-y-0.5">
                          <p className="font-extrabold text-stone-800 text-sm leading-tight">{tx.description || 'Khata Settlement'}</p>
                          <div className="flex items-center gap-2 text-[10px] text-stone-400 font-bold font-mono">
                            <span>{new Date(timestamp).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                            <span>•</span>
                            <span>Ref: #{String(tx.id).slice(-6).toUpperCase()}</span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right flex flex-col items-end">
                        <p className={cn(
                          "text-base font-black tracking-tighter leading-tight",
                          isDebit ? "text-amber-700" : "text-emerald-700"
                        )}>
                          {isDebit ? 'Due ' : 'Paid '}₹{tx.amount.toLocaleString('en-IN')}
                        </p>
                        <span className={cn(
                          "text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded mt-1",
                          isDebit ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-600"
                        )}>
                          {isDebit ? 'Khata Debit' : 'Settled Payment'}
                        </span>
                      </div>
                    </motion.div>
                  );
                })}

              </AnimatePresence>
            </div>
          )}
        </motion.div>

        {/* Informational help card */}
        <div className="bg-primary/5 p-5 rounded-3xl border border-primary/10 flex items-start gap-3.5">
          <AlertCircle className="text-primary shrink-0 mt-0.5" size={18} />
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-primary">Need assistance with dynamic ledgers?</h4>
            <p className="text-xs text-stone-500 mt-1 leading-relaxed">
              Our automated audits synchronize records in real-time. Feel free to contact our store manager directly via the support desks if any deposit verification is not completed within 2 hours.
            </p>
          </div>
        </div>

      </div>

      {/* Review Dialog modal */}
      <AnimatePresence>
        {showReviewModal.open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white w-full max-w-md rounded-3xl overflow-hidden shadow-2xl border border-stone-100"
            >
              <div className="p-6 border-b border-stone-100 flex justify-between items-center bg-stone-50">
                <h3 className="font-extrabold text-stone-850">Review Order #{String(showReviewModal.orderId).slice(-6).toUpperCase()}</h3>
                <button 
                  onClick={() => setShowReviewModal({ open: false, orderId: null })}
                  className="p-2 hover:bg-stone-200 text-stone-500 hover:text-stone-800 rounded-xl transition"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="p-6 space-y-5">
                <div>
                  <label className="block text-xs font-black text-stone-400 uppercase tracking-widest mb-3">Rating Score</label>
                  <div className="flex space-x-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button 
                        key={star}
                        onClick={() => setReviewRating(star)}
                        className={cn(
                          "p-2.5 rounded-xl transition-all hover:scale-105 active:scale-95",
                          reviewRating >= star ? "text-amber-400 bg-amber-50" : "text-stone-300 bg-stone-50"
                        )}
                      >
                        <Star size={24} fill={reviewRating >= star ? "currentColor" : "none"} />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-black text-stone-400 uppercase tracking-widest mb-2">Detailed comments</label>
                  <textarea 
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder="Tell us about the quality of the items or speed of the courier..."
                    className="w-full px-4 py-3 bg-stone-50 border border-stone-100 rounded-2xl outline-none focus:border-primary font-medium text-xs transition duration-200 min-h-[100px] resize-none"
                  />
                </div>

                <div className="pt-2">
                  <button 
                    onClick={handleReviewSubmit}
                    disabled={isSubmittingReview}
                    className="w-full py-3.5 bg-stone-900 hover:bg-stone-800 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-stone-900/10 active:scale-98 transition disabled:opacity-50"
                  >
                    {isSubmittingReview ? 'Submitting Feedback...' : 'Post review'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
