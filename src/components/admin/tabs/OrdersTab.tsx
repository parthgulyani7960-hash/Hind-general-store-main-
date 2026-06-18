import React, { useState, useEffect } from 'react';
import { 
  ShoppingBag, Clock, Package, Truck, CheckCircle2, 
  Search, List, LayoutDashboard, RefreshCw, TrendingUp,
  Eye, MoreVertical, Check, Receipt, X 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';
import { OrderStatusBadge } from '@/components/admin/OrderStatusBadge';
import { StatSkeleton, TableRowSkeleton } from '@/components/ui/Skeleton';
import ExportTriggerButton from '@/components/admin/ExportTriggerButton';

interface OrdersTabProps {
    orders: any[];
    loading: boolean;
    fetchOrders: () => void;
    updateOrderStatus: (id: number, status: string) => Promise<void>;
    fetchOrderDetailsModal: (order: any) => void;
    handleBulkOrderAction: (action: string, value: string) => Promise<void>;
    asyncExportData: (type: string) => Promise<void>;
    config: any;
}

const OrdersTab: React.FC<OrdersTabProps> = ({ 
    orders, 
    loading, 
    fetchOrders, 
    updateOrderStatus, 
    fetchOrderDetailsModal,
    handleBulkOrderAction,
    asyncExportData,
    config,
}) => {
    const [ordersViewMode, setOrdersViewMode] = useState<'table' | 'kanban'>('table');
    const [orderSearchTerm, setOrderSearchTerm] = useState('');
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isOnline, setIsOnline] = useState(navigator.onLine);

    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    const handleManualRefresh = () => {
        if (!isOnline) return;
        setIsRefreshing(true);
        if (fetchOrders) fetchOrders();
        setTimeout(() => setIsRefreshing(false), 2000);
    };
    const [orderStatusFilter, setOrderStatusFilter] = useState<string>('All');
    const [orderDateStart, setOrderDateStart] = useState<string>('');
    const [orderDateEnd, setOrderDateEnd] = useState<string>('');
    const [orderSortBy, setOrderSortBy] = useState('date');
    const [orderSortOrder, setOrderSortOrder] = useState<'asc' | 'desc'>('desc');
    const [selectedOrders, setSelectedOrders] = useState<number[]>([]);
    const [activeActionMenuId, setActiveActionMenuId] = useState<string | null>(null);

    const filteredOrders = orders.filter(order => {
        const matchesStatus = orderStatusFilter === 'All' || 
          order.status === orderStatusFilter || 
          (orderStatusFilter === 'paid' && order.payment_status === 'paid') ||
          (orderStatusFilter === 'verifying' && order.payment_status === 'verifying');
        const orderDate = new Date(order.created_at).toISOString().split('T')[0];
        const matchesStart = !orderDateStart || orderDate >= orderDateStart;
        const matchesEnd = !orderDateEnd || orderDate <= orderDateEnd;
        const matchesSearch = !orderSearchTerm || 
          order.id.toString().includes((orderSearchTerm || '').replace('#ORD-', '')) ||
          order.user_name?.toLowerCase().includes(orderSearchTerm.toLowerCase());
        return matchesStatus && matchesStart && matchesEnd && matchesSearch;
    });

    const sortedOrders = [...filteredOrders].sort((a, b) => {
        let valA, valB;
        if (orderSortBy === 'date') {
            valA = new Date(a.created_at).getTime();
            valB = new Date(b.created_at).getTime();
        } else if (orderSortBy === 'id') {
            valA = a.id;
            valB = b.id;
        } else if (orderSortBy === 'customer') {
            valA = (a.user_name || '').toLowerCase();
            valB = (b.user_name || '').toLowerCase();
        } else {
            valA = a.total || 0;
            valB = b.total || 0;
        }
        return orderSortOrder === 'asc' ? (valA > valB ? 1 : -1) : (valA < valB ? 1 : -1);
    });

    return (
        <div className="max-w-full overflow-x-hidden space-y-6 animate-in fade-in duration-500 pb-10 pr-2">
            {/* Orders Header */}
            <header className="shrink-0 flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-2">
              <div>
                <h2 className="text-3xl font-bold text-stone-900 tracking-tight">Orders Registry</h2>
                <p className="text-stone-500 text-sm mt-1 font-sans">Manage, track, and complete physical store orders.</p>
              </div>
              <div className="flex bg-stone-100/80 p-1 rounded-2xl space-x-1 border border-stone-200/30">
                <button 
                  onClick={handleManualRefresh}
                  disabled={!isOnline || isRefreshing}
                  className={cn(
                    "flex items-center space-x-2 px-5 py-2.5 rounded-xl text-xs font-black transition-all font-sans uppercase tracking-wider",
                    !isOnline ? "opacity-50 cursor-not-allowed" : "bg-white text-stone-900 shadow-sm hover:bg-stone-50"
                  )}
                  title="Manual Registry Refresh"
                >
                  <RefreshCw size={14} className={cn(isRefreshing && "animate-spin")} />
                  <span>{isRefreshing ? 'Syncing...' : 'Refresh'}</span>
                </button>
                <div className="w-px h-6 bg-stone-200 self-center mx-1" />
                <button 
                  onClick={() => setOrdersViewMode('table')}
                  className={cn(
                    "flex items-center space-x-2 px-5 py-2.5 rounded-xl text-xs font-black transition-all font-sans uppercase tracking-wider",
                    ordersViewMode === 'table' ? "bg-white text-stone-900 shadow-sm" : "text-stone-400 hover:text-stone-600"
                  )}
                >
                  <List size={14} />
                  <span>Table View</span>
                </button>
                <button 
                  onClick={() => setOrdersViewMode('kanban')}
                  className={cn(
                    "flex items-center space-x-2 px-5 py-2.5 rounded-xl text-xs font-black transition-all font-sans uppercase tracking-wider",
                    ordersViewMode === 'kanban' ? "bg-white text-stone-900 shadow-sm" : "text-stone-400 hover:text-stone-600"
                  )}
                >
                  <LayoutDashboard size={14} />
                  <span>Kanban Board</span>
                </button>
              </div>
            </header>

            <div className="shrink-0 w-full md:w-64">
                <ExportTriggerButton type="orders" onClick={asyncExportData} />
            </div>

            <div className="flex-1 space-y-6 pb-10">
              {/* Order Metrics Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Pending Orders', val: orders.filter(o => o.status === 'pending').length, icon: Clock, color: 'amber', status: 'pending' },
                { label: 'Processing Orders', val: orders.filter(o => o.status === 'processing').length, icon: Package, color: 'blue', status: 'processing' },
                { label: 'Shipped Orders', val: orders.filter(o => o.status === 'shipped').length, icon: Truck, color: 'purple', status: 'shipped' },
                { label: 'Completed Orders', val: orders.filter(o => o.status === 'delivered').length, icon: CheckCircle2, color: 'emerald', status: 'delivered' }
              ].map((stat, i) => (
                <motion.div 
                  key={stat.label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="bg-stone-50/50 p-5 rounded-2xl border border-stone-200/40 flex items-center space-x-4"
                >
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center",
                    stat.color === 'amber' ? "bg-amber-100/40 text-amber-700" :
                    stat.color === 'blue' ? "bg-blue-100/40 text-blue-700" :
                    stat.color === 'purple' ? "bg-purple-100/40 text-purple-700" :
                    "bg-emerald-100/40 text-emerald-700"
                  )}>
                    <stat.icon size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-1">{stat.label}</p>
                    <div className="flex items-baseline space-x-2">
                      <span className="text-2xl font-black text-stone-900 tracking-tight">{stat.val}</span>
                      <span className={cn("text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider",
                        stat.color === 'amber' ? "bg-amber-50 text-amber-800" :
                        stat.color === 'blue' ? "bg-blue-50 text-blue-800" :
                        stat.color === 'purple' ? "bg-purple-50 text-purple-800" :
                        "bg-emerald-50 text-emerald-800"
                      )}>{stat.status}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Filters Dashboard */}
            <section className="bg-stone-50/40 p-6 rounded-3xl border border-stone-200/30 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-stone-400 uppercase tracking-wider">Search</label>
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" size={15} />
                  <input 
                    type="text" 
                    placeholder="Search ref ID or client..."
                    className="w-full bg-white border border-stone-200/60 rounded-xl pl-9.5 pr-4 py-2.5 text-xs text-stone-800 outline-none transition-all placeholder:text-stone-300 font-bold focus:border-stone-400"
                    value={orderSearchTerm}
                    onChange={(e) => setOrderSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-stone-400 uppercase tracking-wider">Status</label>
                <select 
                  className="w-full bg-white border border-stone-200/60 rounded-xl px-3.5 py-2.5 text-xs outline-none transition-all cursor-pointer font-black text-stone-700 focus:border-stone-400 uppercase tracking-wide"
                  value={orderStatusFilter}
                  onChange={(e) => setOrderStatusFilter(e.target.value)}
                >
                  <option value="All">All Transactions</option>
                  <option value="pending">Pending Review</option>
                  <option value="verifying">Payment Verifying</option>
                  <option value="processing">Processing</option>
                  <option value="shipped">On Route</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="failed">Failed Transaction</option>
                  <option value="paid">Settled (Paid)</option>
                </select>
              </div>

              <div className="flex items-end space-x-2">
                <div className="flex-1 space-y-1.5">
                  <label className="text-[10px] font-black text-stone-400 uppercase tracking-wider">Sort By</label>
                  <select 
                    className="w-full bg-white border border-stone-200/60 rounded-xl px-3.5 py-2.5 text-[10px] font-black uppercase outline-none transition-all cursor-pointer text-stone-700 focus:border-stone-400 tracking-wider"
                    value={orderSortBy}
                    onChange={(e) => setOrderSortBy(e.target.value)}
                  >
                    <option value="date">Order Date</option>
                    <option value="id">Reference ID</option>
                    <option value="customer">Client Name</option>
                    <option value="total">Value</option>
                  </select>
                </div>
                <button 
                  onClick={() => setOrderSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                  className="p-3 bg-white border border-stone-200/60 rounded-xl text-stone-400 hover:text-stone-800 transition-all shadow-sm"
                >
                  <TrendingUp size={16} className={cn(orderSortOrder === 'desc' && "rotate-180")} />
                </button>
                <button 
                  onClick={() => {
                    setOrderStatusFilter('All');
                    setOrderDateStart('');
                    setOrderDateEnd('');
                    setOrderSearchTerm('');
                    setOrderSortBy('date');
                    setOrderSortOrder('desc');
                  }}
                  className="p-3 bg-white border border-stone-200/60 rounded-xl text-stone-400 hover:text-red-500 transition-all shadow-sm"
                >
                  <RefreshCw size={16} />
                </button>
              </div>
            </section>

            {ordersViewMode === 'table' ? (
              <div className="bg-white rounded-3xl border border-stone-200/40 overflow-hidden shadow-sm">
                <div className="overflow-x-auto no-scrollbar">
                  <table className="w-full text-left">
                    <thead className="bg-stone-50/50 text-stone-400 text-[10px] uppercase font-black tracking-[0.2em] border-b border-stone-100">
                      <tr>
                        <th className="px-8 py-6 w-10">
                          <input 
                            type="checkbox" 
                            className="w-4 h-4 rounded-md border-stone-300 text-stone-900 focus:ring-stone-900 transition-all cursor-pointer"
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedOrders(sortedOrders.map(o => o.id));
                              } else {
                                setSelectedOrders([]);
                              }
                            }}
                          />
                        </th>
                        <th className="px-6 py-6">Order ID</th>
                        <th className="px-6 py-6">Customer Info</th>
                        <th className="px-6 py-6 text-right">Total Price</th>
                        <th className="px-6 py-6 font-black tracking-widest">Status</th>
                        <th className="px-6 py-6">Date</th>
                        <th className="px-8 py-6 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100/60">
                      {loading ? (
                         [...Array(5)].map((_, i) => (
                           <tr key={i}>
                             <td colSpan={7}>
                               <TableRowSkeleton columns={6} />
                             </td>
                           </tr>
                         ))
                      ) : sortedOrders.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="px-8 py-20 text-center">
                            <div className="flex flex-col items-center space-y-4">
                              <div className="w-16 h-16 bg-stone-50 rounded-full flex items-center justify-center text-stone-200">
                                <ShoppingBag size={32} />
                              </div>
                              <div className="space-y-1">
                                <p className="font-black text-stone-900">Archive Is Null</p>
                                <p className="text-sm text-stone-400 font-sans">No transactions recorded matching the current filter scope.</p>
                              </div>
                            </div>
                          </td>
                        </tr>
                      ) : sortedOrders.map((order, idx) => (
                        <motion.tr 
                          key={order.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.02 }}
                          className={cn(
                            "hover:bg-stone-50/40 transition-all duration-300 group cursor-default",
                            selectedOrders.includes(order.id) ? "bg-stone-50/60" : "bg-white"
                          )}
                        >
                          <td className="px-8 py-6">
                            <input 
                              type="checkbox" 
                              className="w-4 h-4 rounded-md border-stone-200 text-stone-900 focus:ring-stone-900 transition-all cursor-pointer"
                              checked={selectedOrders.includes(order.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedOrders([...selectedOrders, order.id]);
                                } else {
                                  setSelectedOrders(selectedOrders.filter(id => id !== order.id));
                                }
                              }}
                            />
                          </td>
                          <td className="px-6 py-6">
                            <div className="flex flex-col gap-2">
                                <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 bg-stone-900 text-white rounded-lg font-mono text-xs font-black tracking-tighter select-text">
                                  <span>{order.order_id || `ORD#${order.id}`}</span>
                                </span>
                                {order.delivery_type && (
                                  <span className={cn(
                                    "inline-flex items-center px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest border",
                                    order.delivery_type === 'pickup' ? "bg-orange-50 text-orange-600 border-orange-200" : "bg-blue-50 text-blue-600 border-blue-200"
                                  )}>
                                    {order.delivery_type}
                                  </span>
                                )}
                            </div>
                          </td>
                          <td className="px-6 py-6">
                             <div className="flex flex-col">
                                <p className="text-sm font-black text-stone-850 tracking-tight" title={order.user_name}>
                                  {order.user_name || 'Protocol Client'}
                                </p>
                                <p className="text-[10px] text-stone-400 font-bold tracking-wide mt-0.5 uppercase">
                                  {order.items?.length || 0} items
                                </p>
                             </div>
                          </td>
                          <td className="px-6 py-6 text-right">
                             <span className="text-base font-black text-stone-900 tracking-tight select-text">₹{(order.total || 0).toLocaleString()}</span>
                          </td>
                          <td className="px-6 py-6">
                            <OrderStatusBadge status={order.status} />
                          </td>
                          <td className="px-6 py-6">
                             <div className="flex flex-col">
                                <span className="text-xs font-black text-stone-800 tracking-tight select-text">{new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                             </div>
                          </td>
                          <td className="px-8 py-6 text-right">
                            <div className="flex items-center justify-end space-x-2.5">
                              <button 
                                onClick={() => fetchOrderDetailsModal(order)}
                                className="p-2.5 bg-stone-50 text-stone-500 hover:text-stone-900 rounded-xl transition-all border border-stone-200/45 shadow-sm"
                              >
                                <Eye size={16} />
                              </button>
                              
                              <div className="relative">
                                <button 
                                  onClick={() => setActiveActionMenuId(activeActionMenuId === `order_${order.id}` ? null : `order_${order.id}`)}
                                  className={cn(
                                    "p-2.5 bg-stone-50 text-stone-500 rounded-xl transition-all border border-stone-200/45 hover:text-stone-800 shadow-sm",
                                    activeActionMenuId === `order_${order.id}` && "bg-white text-stone-900 shadow-xl border-stone-200"
                                  )}
                                >
                                  <MoreVertical size={16} />
                                </button>
                                
                                <AnimatePresence>
                                  {activeActionMenuId === `order_${order.id}` && (
                                    <motion.div 
                                      initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                      animate={{ opacity: 1, scale: 1, y: 0 }}
                                      exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                      className="absolute right-0 top-full mt-3 w-64 bg-white rounded-2xl shadow-xl border border-stone-100 z-[100] overflow-hidden flex flex-col py-2.5"
                                      onMouseLeave={() => setActiveActionMenuId(null)}
                                    >
                                      {[ 
                                        {val: 'pending', label: 'Hold for Review', color: 'bg-amber-400'}, 
                                        {val: 'processing', label: 'Initiate Processing', color: 'bg-blue-400'}, 
                                        {val: 'shipped', label: 'Authorize Dispatch', color: 'bg-purple-400'}, 
                                        {val: 'delivered', label: 'Confirm Closure', color: 'bg-emerald-400'}, 
                                        {val: 'cancelled', label: 'Void Protocol', color: 'bg-red-400'} 
                                      ].map(s => (
                                        <button 
                                          key={s.val}
                                          onClick={() => {
                                            updateOrderStatus(order.id, s.val);
                                            setActiveActionMenuId(null);
                                          }}
                                          className={cn(
                                            "flex items-center justify-between px-6 py-2.5 hover:bg-stone-50 text-left text-xs font-black transition-all font-sans uppercase tracking-wider",
                                            order.status === s.val ? "text-stone-900 bg-stone-50" : "text-stone-500"
                                          )}
                                        >
                                          <span>{s.label}</span>
                                          {order.status === s.val && <Check size={14} className="text-stone-800" />}
                                        </button>
                                      ))}
                                      <div className="h-px bg-stone-100 my-2 mx-4" />
                                      <button 
                                        onClick={async () => {
                                          const { generateOrderInvoicePDF } = await import('@/services/pdfService');
                                          generateOrderInvoicePDF(order, config);
                                        }}
                                        className="flex items-center space-x-3 px-6 py-2.5 hover:bg-stone-50 group transition-all"
                                      >
                                        <Receipt size={14} className="text-stone-600" />
                                        <span className="text-xs font-black text-stone-800 font-sans uppercase tracking-wider">Generate History</span>
                                      </button>
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>
                            </div>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
                <div className="p-6 bg-stone-50/50 rounded-3xl border border-stone-200/20 flex gap-6 overflow-x-auto no-scrollbar min-h-[700px]">
                  {['pending', 'processing', 'shipped', 'delivered', 'cancelled'].map((statusColumn) => (
                    <div key={statusColumn} className="w-[320px] shrink-0 flex flex-col">
                      <div className="flex items-center justify-between mb-5 px-1.5">
                        <div className="flex items-center space-x-3">
                          <h4 className="font-black text-stone-800 uppercase tracking-widest text-[10px]">{statusColumn}</h4>
                          <span className="bg-white border border-stone-200/50 text-stone-500 text-[10px] font-black px-2 py-0.5 rounded-lg shadow-sm">
                            {orders.filter(o => o.status === statusColumn).length}
                          </span>
                        </div>
                      </div>
                      <div className="space-y-4 flex-1 overflow-y-auto no-scrollbar pb-10">
                        {sortedOrders.filter(o => o.status === statusColumn).map((order) => (
                          <motion.div
                            layout
                            key={order.id}
                            whileHover={{ y: -2 }}
                            className="bg-white p-5 rounded-2xl border border-stone-200/40 hover:border-stone-300 shadow-sm transition-all cursor-pointer group relative"
                            onClick={() => fetchOrderDetailsModal(order)}
                          >
                             <div className="flex justify-between items-start mb-3">
                               <span className="font-mono text-xs font-black text-stone-800 tracking-tighter">{order.order_id || `#ORD-${order.id}`}</span>
                               <span className="text-xs font-black text-stone-900 tracking-tight">₹{order.total}</span>
                             </div>
                             <h5 className="text-sm font-black text-stone-850 mb-1 truncate">{order.user_name || 'Anonymous Customer'}</h5>
                             <p className="text-[10px] text-stone-400 font-bold mb-3">{order.items?.length || 0} unique SKU items</p>
                             <div className="flex items-center justify-between pt-3 border-t border-stone-100/60 text-[9px] font-black uppercase tracking-widest text-stone-400">
                                <div className="flex items-center space-x-1.5">
                                    <Clock size={11} />
                                    <span>{new Date(order.created_at).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}</span>
                                </div>
                                <span className="bg-stone-100 px-2 py-0.5 rounded-md">{order.payment_method || 'Online'}</span>
                             </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
            )}
        </div>

        <AnimatePresence>
                {selectedOrders.length > 0 && (
                  <motion.div 
                    initial={{ y: 150, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 150, opacity: 0 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[80] bg-stone-900 text-white px-8 py-5 rounded-[2.5rem] shadow-2xl flex items-center space-x-8 w-fit max-w-4xl border border-stone-800"
                  >
                    <div className="flex flex-col border-r border-stone-700 pr-8">
                      <span className="text-3xl font-black text-white leading-none">{selectedOrders.length}</span>
                      <span className="text-[10px] uppercase font-black tracking-[0.2em] text-stone-500 mt-1">Directives</span>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                       {['processing', 'shipped', 'delivered'].map((s) => (
                           <button 
                            key={s}
                            onClick={() => handleBulkOrderAction('status', s)}
                            className="px-6 py-3 hover:bg-stone-800 rounded-2xl transition-all text-xs font-black uppercase tracking-widest flex items-center space-x-3 group font-sans"
                            >
                                <span>{s.toUpperCase()}</span>
                            </button>
                       ))}
                    </div>
                    
                    <div className="w-px h-8 bg-stone-800 mx-2" />
                    
                    <button 
                      onClick={() => setSelectedOrders([])}
                      className="p-3 bg-stone-800 hover:bg-stone-700 rounded-full transition-all text-stone-400 hover:text-white"
                    >
                      <X size={20} />
                    </button>
                  </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default OrdersTab;
