import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { Package, Truck, CheckCircle2, Search, ArrowRight, Home, Info, Phone, User, ShoppingBag, Copy, Share2, XCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { cn } from '../types';
import { handleAppError } from '../lib/errorUtils';
import { useStore } from '../StoreContext';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { fetchWithHandling } from '../lib/api';
import { getAuthHeaders } from '../lib/utils';
import L from 'leaflet';
import { io } from 'socket.io-client';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icon
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

export default function TrackOrder() {
  const { t, user } = useStore();
  const [orderId, setOrderId] = useState('');
  const [phoneNumber, setPhoneNumber] = useState(user?.phone || '');
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [runnerLocation, setRunnerLocation] = useState<any>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancellationReason, setCancellationReason] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [returnItem, setReturnItem] = useState<any>(null);
  const [returnQuantity, setReturnQuantity] = useState(1);
  const [returnReason, setReturnReason] = useState('');
  const [isReturning, setIsReturning] = useState(false);

  useEffect(() => {
    // If user is logged in, use their phone number automatically if not already set
    if (user?.phone && !phoneNumber) {
      setPhoneNumber(user.phone);
    }
  }, [user]);

  useEffect(() => {
    if (order && (order.status === 'shipped' || order.status === 'dispatched')) {
      const interval = setInterval(async () => {
        try {
          const data = await fetchWithHandling<any>(`/api/orders/${order.order_id}/runner-location`);
          if (data && data.location) setRunnerLocation(data);
        } catch (e) {}
      }, 15000);
      return () => clearInterval(interval);
    }
  }, [order]);

  const orderRef = useRef(order);
  useEffect(() => { orderRef.current = order; }, [order]);

  useEffect(() => {
    const socket = io(); 
    socket.on('data', (data) => {
        const currentOrder = orderRef.current;
        if (data.type === 'ORDER_STATUS_UPDATE' && currentOrder && (String(data.payload.id) === String(currentOrder.id) || String(data.payload.order_id) === String(currentOrder.order_id))) {
            setOrder((prev: any) => ({ ...prev, status: data.payload.status }));
            toast.success(`Order status updated to ${data.payload.status}`);
        }
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const handleCancelOrder = async () => {
    if (!cancellationReason.trim()) { toast.error('Please enter a reason'); return; }
    setIsCancelling(true);
    try {
      const data = await fetchWithHandling<any>(`/api/orders/${order.order_id}/cancel`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ reason: cancellationReason })
      });
      if (data) {
        toast.success('Order cancelled successfully');
        setOrder({...order, status: 'cancelled'});
        setShowCancelModal(false);
      }
    } catch (err: any) {
      handleAppError(err, 'Error cancelling order', 'cancelOrder', user?.role === 'admin');
    } finally {
      setIsCancelling(false);
    }
  };

  const handleReturnItem = async () => {
    if (!returnReason.trim()) { toast.error('Please enter a reason'); return; }
    if (returnQuantity < 1 || returnQuantity > returnItem?.quantity) { toast.error('Invalid quantity'); return; }
    
    setIsReturning(true);
    try {
      const data = await fetchWithHandling<any>(`/api/orders/${order.id}/return`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ product_id: returnItem.product_id, quantity: returnQuantity, reason: returnReason })
      });
      if (data && data.success) {
        toast.success('Return requested successfully');
        setShowReturnModal(false);
        // Refresh order data (could use original id, but autoTrack handles formatting)
        handleTrackAuto(orderId || order.id, phoneNumber || order.user_phone);
      } else if (data) {
        toast.error(data.message || 'Failed to request return');
      }
    } catch (err: any) {
      handleAppError(err, 'Error requesting return', 'returnItem', user?.role === 'admin');
    } finally {
      setIsReturning(false);
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('orderId');
    const phone = params.get('phone');
    const autoTrackValue = params.get('autotrack');
    
    if (id) setOrderId(id);
    if (phone) setPhoneNumber(phone);
    
    if (id && phone) {
      // Auto trigger fetch if both are present
      handleTrackAuto(id, phone);
    }
  }, []);

  const handleTrackAuto = async (id: string, phone: string) => {
    setLoading(true);
    try {
      const data = await fetchWithHandling<any>(`/api/public/orders/${encodeURIComponent(id.trim())}?phone=${encodeURIComponent(phone.trim())}`);
      if (data && data.success) setOrder(data.order);
    } catch (err) {}
    finally { setLoading(false); }
  };

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderId || !phoneNumber) {
      toast.error('Please enter both Order ID and Phone Number');
      return;
    }

    // New Validations
    const orderIdRegex = /^HGS-\d{8}-[A-Z0-9]{5}$/i;
    const phoneRegex = /^[6-9]\d{9}$/;

    if (!orderIdRegex.test(orderId.trim()) && !/^\d+$/.test(orderId.trim())) {
      toast.error('Invalid Order ID format (Expected: HGS-YYYYMMDD-XXXXX)');
      return;
    }

    if (!phoneRegex.test(phoneNumber.trim().replace(/\D/g, ''))) {
      toast.error('Please enter a valid 10-digit mobile number');
      return;
    }

    setLoading(true);
    try {
      // Input sanitation/format check (optional but good for security)
      const cleanOrderId = orderId.trim();
      const cleanPhone = phoneNumber.trim().replace(/\D/g, ''); // Extract only digits for server check or keep if using PhoneInput

      const data = await fetchWithHandling<any>(`/api/public/orders/${encodeURIComponent(cleanOrderId)}?phone=${encodeURIComponent(phoneNumber.trim())}`);
      
      if (data && data.success) {
        setOrder(data.order);
      } else if (data) {
        toast.error(data.message || 'Order not found');
        setOrder(null);
      }
    } catch (err: any) {
      handleAppError(err, 'Failed to fetch order status', 'fetchOrderStatus', user?.role === 'admin');
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { key: 'pending', label: t('order_placed'), icon: Package, description: 'We have received your order' },
    { key: 'confirmed', label: t('confirmed'), icon: CheckCircle2, description: 'Inventory has been reserved' },
    { key: 'processing', label: t('processing'), icon: Info, description: 'Your items are being packed' },
    { key: 'shipped', label: t('shipped'), icon: Truck, description: 'Order is out of the store' },
    { key: 'delivered', label: t('delivered'), icon: Home, description: 'Enjoy your purchase!' }
  ];

  const currentStepIndex = order ? steps.findIndex(s => s.key === order.status) : -1;

  const getStepDate = (stepIndex: number, isCompleted: boolean) => {
    if (!order) return null;
    if (!isCompleted) {
       if (stepIndex === steps.length - 1 && order.estimated_delivery_at) { 
         return `Exp. ${new Date(order.estimated_delivery_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}`;
       }
       return null;
    }
    
    const baseDate = new Date(order.created_at || Date.now());
    const simDate = new Date(baseDate.getTime() + (stepIndex * 60 * 60 * 1000));
    return simDate.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="min-h-screen pt-24 pb-32 md:pb-12 bg-stone-50">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6"
          >
            <Truck className="text-primary" size={40} />
          </motion.div>
          <h1 className="text-4xl font-black text-stone-900 mb-4">{t('track_order')}</h1>
          <p className="text-stone-500 font-medium">Enter your details below to see the latest status of your order.</p>
        </div>

        {/* Tracking Form */}
        <div className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-stone-200/50 border border-stone-100 mb-12">
          <form onSubmit={handleTrack} className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest ml-1">{t('order_id')}</label>
              <div className="relative">
                <Package className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-300" size={18} />
                <input 
                  type="text" 
                  placeholder="e.g. HGS-2024..."
                  value={orderId}
                  onChange={(e) => setOrderId(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-stone-50 border border-stone-100 rounded-2xl outline-none focus:border-primary transition-all font-bold text-stone-700"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest ml-1">{t('phone_number')}</label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-300" size={18} />
                <input 
                  type="tel" 
                  placeholder="e.g. 9876543210"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-stone-50 border border-stone-100 rounded-2xl outline-none focus:border-primary transition-all font-bold text-stone-700"
                />
              </div>
            </div>
            <div className="flex items-end">
              <button 
                type="submit"
                disabled={loading}
                className="w-full bg-primary text-white py-4 rounded-2xl font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                {loading ? <Search className="animate-spin" /> : <Search size={20} />}
                <span>{loading ? 'Searching...' : t('check_status')}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Results */}
        {order && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            {runnerLocation && (
              <div className="bg-white p-6 rounded-[2.5rem] shadow-xl shadow-stone-200/50 border border-stone-100 mb-8 overflow-hidden">
                <h4 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <Truck size={20} className="text-primary" />
                  Live Delivery Tracking
                </h4>
                <div className="h-64 rounded-2xl overflow-hidden">
                  <MapContainer center={[runnerLocation.location.lat, runnerLocation.location.lng]} zoom={13} className="h-full w-full">
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    <Marker position={[runnerLocation.location.lat, runnerLocation.location.lng]}>
                      <Popup>Runner: {runnerLocation.runner.name}</Popup>
                    </Marker>
                  </MapContainer>
                </div>
                <p className="mt-4 text-sm font-bold text-stone-700">Runner: {runnerLocation.runner.name} - {runnerLocation.runner.phone}</p>
              </div>
            )}

            <div className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-stone-200/50 border border-stone-100">
              <div className="flex justify-between items-center mb-12">
                <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4">
                  <h3 className="text-2xl font-black text-stone-900">Order #{order.order_id || order.id}</h3>
                  <div className="flex items-center space-x-2">
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText(order.order_id || String(order.id));
                        toast.success('Order ID copied to clipboard!');
                      }}
                      className="w-fit p-2 bg-stone-100 hover:bg-stone-200 rounded-xl transition-all text-stone-400 hover:text-primary flex items-center space-x-2"
                      title="Copy Order ID"
                    >
                      <Copy size={16} />
                      <span className="text-[10px] font-black uppercase tracking-widest">Copy ID</span>
                    </button>
                    <button 
                      onClick={() => {
                        const text = `Tracking Order #${order.order_id || order.id}\nStatus: ${order.status.toUpperCase()}\nTrack here: ${window.location.href}?orderId=${order.order_id || order.id}&phone=${phoneNumber}`;
                        if (navigator.share) {
                          navigator.share({ title: 'Order Tracking', text, url: window.location.href });
                        } else {
                          navigator.clipboard.writeText(text);
                          toast.success('Tracking info copied!');
                        }
                      }}
                      className="w-fit p-2 bg-stone-100 hover:bg-stone-200 rounded-xl transition-all text-stone-400 hover:text-green-500 flex items-center space-x-2"
                      title="Share Tracking"
                    >
                      <Share2 size={16} />
                      <span className="text-[10px] font-black uppercase tracking-widest">Share</span>
                    </button>
                  </div>
                </div>
                <div className="px-6 py-2 bg-primary/10 rounded-full">
                  <span className="text-sm font-black text-primary uppercase tracking-widest">{t(order.status) || order.status}</span>
                </div>
              </div>

              <div className="relative">
                {/* Connection Line */}
                <div className="absolute left-[23px] top-6 bottom-6 w-1.5 bg-stone-100 hidden md:block rounded-full" />
                <motion.div 
                  initial={{ height: 0 }}
                  animate={{ height: `${(Math.max(0, currentStepIndex) / (steps.length - 1)) * 100}%` }}
                  className="absolute left-[23px] top-6 w-1.5 bg-primary hidden md:block transition-all duration-1000 ease-in-out origin-top rounded-full shadow-lg shadow-primary/50 z-0"
                />
                
                <div className="space-y-12">
                  {steps.map((step, index) => {
                    const isCompleted = index <= currentStepIndex;
                    const isCurrent = index === currentStepIndex;

                    return (
                      <div key={step.key} className="flex flex-col md:flex-row items-start md:items-center relative z-10">
                        <div className={cn(
                          "w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 mr-6 mb-4 md:mb-0",
                          isCompleted ? "bg-primary text-white shadow-lg shadow-primary/30" : "bg-stone-50 text-stone-300 border border-stone-200"
                        )}>
                          <step.icon size={24} />
                        </div>
                        <div className="flex-1">
                          <h4 className={cn(
                            "text-lg font-bold transition-colors",
                            isCompleted ? "text-stone-900" : "text-stone-300"
                          )}>
                            {step.label}
                          </h4>
                          <p className={cn(
                            "text-sm font-medium transition-colors",
                            isCompleted ? "text-stone-500" : "text-stone-200"
                          )}>
                            {step.description}
                          </p>
                        </div>
                        <div className="flex flex-col items-start md:items-end mt-2 md:mt-0">
                          {isCurrent && (
                            <div className="px-4 py-1.5 bg-emerald-50 text-emerald-600 rounded-lg text-[10px] font-black uppercase tracking-widest hidden md:block mb-1.5">
                              Current Status
                            </div>
                          )}
                          {getStepDate(index, isCompleted) && (
                            <span className={cn(
                              "text-xs font-bold uppercase tracking-wider",
                              isCompleted ? "text-stone-400" : "text-stone-300"
                            )}>
                              {getStepDate(index, isCompleted)}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Order Items & Summary */}
            <div className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-stone-200/50 border border-stone-100">
               <h4 className="text-xl font-bold mb-6 flex items-center gap-2">
                 <ShoppingBag size={20} className="text-primary" />
                 {t('order_summary')}
               </h4>
               <div className="space-y-4">
                 {order.items && order.items.map((item: any) => (
                   <div key={item.id} className="flex flex-col md:flex-row md:items-center justify-between py-3 border-b border-stone-50 last:border-0 gap-4">
                     <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-stone-100 rounded-xl overflow-hidden shrink-0">
                           <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                        </div>
                        <div>
                          <p className="font-bold text-stone-900 text-sm">{item.name}</p>
                          <p className="text-xs text-stone-400">Qty: {item.quantity}</p>
                          {item.return_status && (
                            <span className={cn(
                              "text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full mt-1 inline-block",
                              item.return_status === 'pending' ? "bg-amber-100 text-amber-700" :
                              item.return_status === 'approved' ? "bg-emerald-100 text-emerald-700" :
                              item.return_status === 'rejected' ? "bg-red-100 text-red-700" :
                              "bg-blue-100 text-blue-700"
                            )}>
                              Return {item.return_status}
                            </span>
                          )}
                        </div>
                     </div>
                     <div className="flex flex-col items-end">
                       <p className="font-bold text-stone-900 text-sm md:text-base">₹{item.price * item.quantity}</p>
                       {order.status === 'delivered' && !item.return_status && user && (
                         (() => {
                           const orderDate = new Date(order.created_at);
                           const daysSinceOrder = (Date.now() - orderDate.getTime()) / (1000 * 3600 * 24);
                           const isReturnEligible = daysSinceOrder <= 7;
                           
                           return isReturnEligible ? (
                             <button 
                               onClick={() => {
                                 setReturnItem(item);
                                 setReturnQuantity(1);
                                 setReturnReason('');
                                 setShowReturnModal(true);
                               }}
                               className="text-xs md:text-sm font-bold text-primary hover:bg-primary/10 mt-2 px-3 py-1.5 md:px-5 md:py-2 rounded-full transition-all border border-primary/20 bg-primary/5 active:scale-95"
                             >
                               Return Item
                             </button>
                           ) : (
                             <Link 
                               to="/profile?tab=support"
                               className="text-[10px] md:text-xs font-medium text-stone-500 hover:text-stone-700 hover:bg-stone-50 mt-2 px-3 py-1.5 md:px-4 md:py-2 rounded-full transition-all border border-stone-200 bg-white active:scale-95 whitespace-nowrap"
                             >
                               Contact Support to Return
                             </Link>
                           );
                         })()
                       )}
                     </div>
                   </div>
                 ))}
                 <div className="pt-4 border-t border-stone-100 flex justify-between items-center">
                    <span className="font-bold text-stone-500 uppercase tracking-widest text-[10px]">{t('total')}</span>
                    <span className="text-2xl font-black text-primary">₹{order.total}</span>
                 </div>
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-stone-900 text-white p-8 rounded-[2.5rem] flex items-center justify-between group">
                <div>
                  <h4 className="text-xl font-bold mb-2">Need Help?</h4>
                  <p className="text-stone-400 text-xs font-medium">Contact our support team for assistance.</p>
                </div>
                <Link 
                  to="/support" 
                  className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center hover:bg-white/20 transition-all group-hover:scale-110"
                >
                  <ArrowRight size={20} />
                </Link>
              </div>
              <div className="bg-white p-8 rounded-[2.5rem] border border-stone-100 flex items-center justify-between group">
                <div>
                  <h4 className="text-xl font-bold text-stone-900 mb-2">Home Store</h4>
                  <p className="text-stone-500 text-xs font-medium">Continue shopping Hind General Store.</p>
                </div>
                <Link 
                  to="/" 
                  className="w-12 h-12 bg-primary text-white rounded-2xl flex items-center justify-center hover:scale-110 transition-all shadow-lg shadow-primary/20"
                >
                  <ArrowRight size={20} />
                </Link>
              </div>
              
              {(order.status === 'pending' || order.status === 'confirmed') && (
                <button 
                  onClick={() => setShowCancelModal(true)}
                  className="md:col-span-2 w-full bg-red-50 text-red-600 py-4 rounded-2xl font-bold hover:bg-red-100 transition-all"
                >
                  Cancel Order
                </button>
              )}
            </div>

            {showCancelModal && (
              <div className="fixed inset-0 bg-stone-900/50 z-50 flex items-center justify-center p-4">
                <div className="bg-white p-6 rounded-2xl w-full max-w-sm shadow-xl space-y-4">
                  <h3 className="text-lg font-bold">Cancel Order</h3>
                  <textarea 
                    placeholder="Enter reason for cancellation..."
                    value={cancellationReason}
                    onChange={(e) => setCancellationReason(e.target.value)}
                    className="w-full p-3 border rounded-xl"
                  />
                  <div className="flex flex-col sm:flex-row gap-3 mt-6">
                    <button onClick={() => setShowCancelModal(false)} className="flex-1 py-3 md:py-4 font-bold text-stone-500 hover:bg-stone-50 rounded-xl transition-all">Back</button>
                    <button onClick={handleCancelOrder} disabled={isCancelling} className="flex-1 py-3 md:py-4 bg-red-600 text-white font-bold rounded-xl active:scale-95 transition-all shadow-lg shadow-red-600/20">{isCancelling ? 'Cancelling...' : 'Confirm Cancel'}</button>
                  </div>
                </div>
              </div>
            )}

            {showReturnModal && returnItem && (
              <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="bg-white p-6 md:p-8 rounded-[2rem] w-full max-w-lg shadow-2xl space-y-6 md:space-y-8 animate-in fade-in zoom-in duration-200">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xl md:text-2xl font-black text-stone-900">Return Item</h3>
                    <button onClick={() => setShowReturnModal(false)} className="p-2 hover:bg-stone-100 rounded-full transition-colors">
                      <XCircle size={24} className="text-stone-400" />
                    </button>
                  </div>
                  
                  <div className="flex flex-col md:flex-row items-center md:items-start space-y-4 md:space-y-0 md:space-x-6 p-4 border border-stone-100 rounded-2xl bg-stone-50">
                    <div className="w-20 h-20 md:w-24 md:h-24 bg-white rounded-xl overflow-hidden shrink-0 shadow-sm">
                      <img src={returnItem.image_url} alt={returnItem.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="text-center md:text-left flex-1">
                      <p className="font-bold text-stone-900 text-sm md:text-base leading-tight">{returnItem.name}</p>
                      <p className="text-stone-500 text-sm md:text-base mt-1 font-mono">₹{returnItem.price}</p>
                    </div>
                  </div>

                  <div className="space-y-4 md:space-y-6">
                    <div>
                      <label className="block text-xs md:text-sm font-bold text-stone-500 uppercase tracking-wider mb-2">Quantity to Return</label>
                      <input 
                        type="number"
                        min="1"
                        max={returnItem.quantity}
                        value={returnQuantity}
                        onChange={(e) => setReturnQuantity(parseInt(e.target.value) || 1)}
                        className="w-full px-4 py-3 md:py-4 bg-stone-50 border border-stone-200 rounded-2xl text-stone-900 font-bold text-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                      />
                      <p className="text-xs text-stone-400 mt-2">Maximum: {returnItem.quantity}</p>
                    </div>

                    <div>
                      <label className="block text-xs md:text-sm font-bold text-stone-500 uppercase tracking-wider mb-2">Reason for Return</label>
                      <textarea 
                        placeholder="Please explain why you want to return this item..."
                        value={returnReason}
                        onChange={(e) => setReturnReason(e.target.value)}
                        className="w-full p-4 md:p-5 bg-stone-50 border border-stone-200 rounded-2xl text-sm md:text-base focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none"
                        rows={3}
                      />
                    </div>
                  </div>

                  <button 
                    onClick={handleReturnItem} 
                    disabled={isReturning || !returnReason.trim()}
                    className={cn(
                      "w-full py-4 md:py-5 rounded-2xl font-black text-sm md:text-base uppercase tracking-wider transition-all active:scale-95",
                      isReturning || !returnReason.trim() ? "bg-stone-100 text-stone-400 cursor-not-allowed border border-stone-200" : "bg-primary text-white hover:bg-primary/90 shadow-xl shadow-primary/30"
                    )}
                  >
                    {isReturning ? 'Submitting Request...' : 'Submit Request'}
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}
