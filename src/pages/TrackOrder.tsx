import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { Package, Truck, CheckCircle2, Search, ArrowRight, Home, Info, Phone, User, ShoppingBag, Copy, Share2, XCircle, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { OrderStatusTimeline } from '@/components/admin/OrderStatusTimeline';
import { cn } from '@/types';
import { handleAppError } from '@/lib/errorUtils';
import { useStore } from '@/StoreContext';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { fetchWithHandling } from '@/lib/api';
import { getAuthHeaders } from '@/lib/utils';
import { Skeleton } from '@/components/ui/Skeleton';
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
  const [searchPerformed, setSearchPerformed] = useState(false);
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
    if (!window.confirm('Are you sure you want to cancel this order?')) return;
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
    const id = params.get('orderId') || params.get('id');
    const phone = params.get('phone');
    if (id) setOrderId(id);
    if (phone) setPhoneNumber(phone);
    
    if (id && phone) {
      handleTrackAuto(id, phone);
    }
  }, [user]);

  const handleTrackAuto = async (id: string, phone: string) => {
    setLoading(true);
    try {
      const data = await fetchWithHandling<any>(`/api/public/orders/${encodeURIComponent(id.trim())}?phone=${encodeURIComponent(phone.trim())}`);
      if (data && data.success) setOrder(data.order);
      else toast.error(data?.message || 'Could not find order.');
    } catch (err) {
        toast.error('Failed to fetch order');
    }
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
      toast.error('Invalid Order ID format. Expected: HGS-YYYYMMDD-XXXXX');
      return;
    }

    if (!phoneRegex.test(phoneNumber.trim().replace(/\D/g, ''))) {
      toast.error('Please enter a valid 10-digit mobile number');
      return;
    }

    setOrder(null); // Clear previous results
    setLoading(true);
    setSearchPerformed(false); // Reset to show a fresh state
    try {
      // Input sanitation/format check
      const cleanOrderId = orderId.trim();
      const cleanPhone = phoneNumber.trim().replace(/\D/g, ''); 

      const data = await fetchWithHandling<any>(`/api/public/orders/${encodeURIComponent(cleanOrderId)}?phone=${encodeURIComponent(cleanPhone)}`);
      
      setSearchPerformed(true); // Mark as done for feedback
      if (data && data.success) {
        setOrder(data.order);
        toast.success('Order details found successfully.');
      } else {
        toast.error(data?.message || 'Order not found. Please check your details.');
        setOrder(null);
      }
    } catch (err: any) {
      handleAppError(err, 'Failed to fetch order status', 'fetchOrderStatus', user?.role === 'admin');
    } finally {
      setLoading(false);
    }
  };

  const [showRetryModal, setShowRetryModal] = useState(false);
  const [retryPaymentMethod, setRetryPaymentMethod] = useState('');
  const [retryUtr, setRetryUtr] = useState('');
  const [retryScreenshot, setRetryScreenshot] = useState('');
  const [isRetrying, setIsRetrying] = useState(false);

  const handleRetryPayment = async () => {
    if (!retryPaymentMethod) { toast.error('Please select a payment method'); return; }
    if (retryPaymentMethod === 'upi' && !retryUtr && !retryScreenshot) {
      toast.error('Please provide UTR or Screenshot for UPI payment');
      return;
    }
    
    setIsRetrying(true);
    try {
      const data = await fetchWithHandling<any>(`/api/orders/${order.id}/retry-payment`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          payment_method: retryPaymentMethod,
          payment_utr: retryUtr,
          payment_screenshot: retryScreenshot
        })
      });
      if (data && data.success) {
        toast.success(data.message || 'Payment info updated');
        setShowRetryModal(false);
        handleTrackAuto(orderId || order.id, phoneNumber || order.user_phone);
      }
    } catch (err: any) {
      handleAppError(err, 'Error updating payment', 'retryPayment', user?.role === 'admin');
    } finally {
      setIsRetrying(false);
    }
  };

  const steps = [
    { key: 'pending', label: t('order_placed'), icon: Package, description: 'We have received your order' },
    { key: 'confirmed', label: t('confirmed'), icon: CheckCircle2, description: 'Inventory has been reserved' },
    { key: 'processing', label: t('processing'), icon: Info, description: 'Your items are being packed' },
    { key: 'shipped', label: order?.delivery_type === 'pickup' ? 'Ready for Pickup' : t('shipped'), icon: Truck, description: order?.delivery_type === 'pickup' ? 'Order is staged at the counter' : 'Order is out of the store' },
    { key: 'delivered', label: order?.delivery_type === 'pickup' ? 'Picked Up' : t('delivered'), icon: Home, description: order?.delivery_type === 'pickup' ? 'Thank you for visiting!' : 'Enjoy your purchase!' }
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
    <div className="track-order-container min-h-screen pt-24 pb-32 md:pb-12 bg-stone-50">
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
        {loading ? (
          <div className="space-y-8 animate-in fade-in duration-500">
            <div className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-stone-200/50 border border-stone-100">
              <div className="flex justify-between items-center mb-12">
                <div className="space-y-4">
                  <Skeleton className="h-8 w-64" />
                  <Skeleton className="h-4 w-48" />
                </div>
                <Skeleton className="h-10 w-32 rounded-full" />
              </div>
              <div className="space-y-12">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center space-x-6">
                    <Skeleton className="w-12 h-12 rounded-2xl shrink-0" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-5 w-1/3" />
                      <Skeleton className="h-4 w-2/3" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-stone-200/50 border border-stone-100">
              <Skeleton className="h-6 w-48 mb-6" />
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <Skeleton className="w-12 h-12 rounded-xl" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-16" />
                      </div>
                    </div>
                    <Skeleton className="h-5 w-20" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : !loading && searchPerformed && !order ? (
          <div className="text-center py-20 bg-white rounded-[2.5rem] border border-stone-100 shadow-sm">
              <Package className="mx-auto text-stone-300 mb-4" size={48} />
              <p className="text-stone-500 font-bold text-lg">Order not found.</p>
              <p className="text-stone-400 text-sm mt-1">Please check your Order ID and phone number.</p>
          </div>
        ) : order && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            {order.payment_status === 'failed' && (
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-red-50 border-2 border-red-200 p-6 rounded-[2rem] flex flex-col md:flex-row items-center justify-between gap-6"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-red-100 text-red-600 rounded-2xl">
                    <AlertCircle size={24} />
                  </div>
                  <div>
                    <h4 className="text-red-900 font-black uppercase tracking-tight">Payment Verification Failed</h4>
                    <p className="text-red-700 text-sm font-medium">Your payment proof was rejected. Please update your payment information within 24 hours to avoid automatic cancellation.</p>
                  </div>
                </div>
                <button 
                  onClick={() => {
                    setRetryPaymentMethod(order.payment_method);
                    setShowRetryModal(true);
                  }}
                  className="px-8 py-3 bg-red-600 text-white font-black rounded-xl shadow-lg shadow-red-600/20 hover:scale-[1.02] active:scale-95 transition-all whitespace-nowrap"
                >
                  Fix Payment Now
                </button>
              </motion.div>
            )}

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
                <div className="px-6 py-2 bg-primary/10 rounded-full flex items-center gap-2">
                  <span className="text-sm font-black text-primary uppercase tracking-widest">{t(order.status) || order.status}</span>
                  {order.delivery_type === 'pickup' && (
                    <span className="bg-emerald-500 text-white text-[9px] px-2 py-0.5 rounded-full font-black uppercase tracking-tighter shadow-sm blur-[0.2px]">Pickup</span>
                  )}
                </div>
              </div>

              <div className="vertical-timeline">
                <motion.div 
                  initial={{ height: 0 }}
                  animate={{ height: `${(Math.max(0, currentStepIndex) / (steps.length - 1)) * 100}%` }}
                  className="timeline-progress-line"
                  style={{ height: `calc(${(Math.max(0, currentStepIndex) / (steps.length - 1)) * 100}% - 48px)` }}
                />
                
                {steps.map((step, index) => {
                  const isCompleted = index <= currentStepIndex;
                  const isCurrent = index === currentStepIndex;

                  return (
                    <div key={step.key} className="timeline-step">
                      <div className={cn(
                        "timeline-icon-box",
                        isCompleted ? "completed" : "pending"
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
                <OrderStatusTimeline orderId={order.id} />
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
                    <div className="flex flex-col items-end">
                      <span className="text-2xl font-black text-primary">₹{order.total}</span>
                      <span className={cn(
                        "text-[10px] font-black uppercase tracking-widest mt-1 px-2 py-0.5 rounded-lg",
                        order.payment_status === 'paid' ? "bg-emerald-100 text-emerald-600" :
                        order.payment_status === 'failed' ? "bg-red-100 text-red-600" : "bg-amber-100 text-amber-600"
                      )}>
                        {order.payment_status ? order.payment_status.toUpperCase() : 'PENDING'}
                      </span>
                      {order.payment_status === 'failed' && order.status !== 'cancelled' && (
                        <button 
                          onClick={() => {
                            setRetryPaymentMethod(order.payment_method);
                            setShowRetryModal(true);
                          }}
                          className="mt-2 text-[10px] font-bold text-primary underline"
                        >
                          Retry Payment
                        </button>
                      )}
                    </div>
                 </div>
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-stone-900 text-white p-8 rounded-[2.5rem] flex items-center justify-between group">
                <div>
                  <h4 className="text-xl font-bold mb-2 tracking-tight">Support Node</h4>
                  <p className="text-stone-400 text-xs font-medium">Real-time resolution for order queries.</p>
                </div>
                <Link 
                  to="/profile?tab=support" 
                  className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center hover:bg-white/20 transition-all group-hover:scale-110"
                >
                  <ArrowRight size={20} />
                </Link>
              </div>
              <div className="bg-white p-8 rounded-[2.5rem] border border-stone-100 flex items-center justify-between group overflow-hidden relative">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-2xl" />
                <div className="relative z-10">
                  <h4 className="text-xl font-black text-stone-900 mb-1 tracking-tighter">Prime Catalog</h4>
                  <p className="text-stone-500 text-xs font-medium">Continue your shopping journey.</p>
                </div>
                <Link 
                  to="/products"
                  className="relative z-10 w-12 h-12 bg-primary text-white rounded-2xl flex items-center justify-center hover:scale-110 transition-all shadow-lg shadow-primary/20"
                >
                  <ShoppingBag size={20} />
                </Link>
              </div>
              
              {order.delivery_type === 'pickup' && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="md:col-span-2 bg-emerald-50 p-8 rounded-[2.5rem] border-2 border-emerald-100 shadow-sm relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 p-8 opacity-5">
                     <Home size={120} />
                  </div>
                  <div className="flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
                    <div className="flex items-center gap-6">
                      <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center text-emerald-500 shadow-xl shadow-emerald-500/10 border border-emerald-50">
                         <Home size={32} />
                      </div>
                      <div>
                        <h4 className="text-2xl font-black text-emerald-900 tracking-tighter">Collection Protocol</h4>
                        <p className="text-sm font-bold text-emerald-700/80 mb-1">New Hind General Store</p>
                        <p className="text-xs text-emerald-600 font-medium max-w-xs leading-relaxed">Shop No. 1, Main Market, Nayagaon, SAS Nagar, Punjab</p>
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                      <a 
                        href="https://www.google.com/maps/search/?api=1&query=New+Hind+General+Store+Nayagaon+SAS+Nagar" 
                        target="_blank" 
                        rel="noreferrer"
                        className="flex items-center justify-center gap-3 px-8 py-4 bg-emerald-600 text-white rounded-2xl hover:bg-emerald-700 transition-all font-black text-xs uppercase tracking-widest shadow-lg shadow-emerald-600/30 active:scale-95"
                      >
                        <Truck size={18} />
                        <span>Route Navigation</span>
                      </a>
                    </div>
                  </div>
                </motion.div>
              )}

              {(order.status === 'pending' || order.status === 'confirmed') && (
                <button 
                  onClick={() => setShowCancelModal(true)}
                  className="md:col-span-2 w-full bg-stone-100 text-stone-400 py-4 rounded-2xl font-bold hover:bg-red-50 hover:text-red-500 transition-all text-xs uppercase tracking-[0.2em]"
                >
                  Terminate Order Request
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
            {showRetryModal && (
              <div className="fixed inset-0 bg-stone-900/50 z-50 flex items-center justify-center p-4">
                <div className="bg-white p-6 rounded-3xl w-full max-w-md shadow-xl space-y-6">
                  <div>
                    <h3 className="text-xl font-bold text-stone-900">Retry Payment</h3>
                    <p className="text-sm text-stone-500 mt-1">Update your payment details to proceed with the order.</p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-2 block">Payment Method</label>
                      <select 
                        value={retryPaymentMethod}
                        onChange={(e) => setRetryPaymentMethod(e.target.value)}
                        className="w-full p-4 bg-stone-50 border border-stone-100 rounded-2xl outline-none focus:border-primary font-bold text-stone-700"
                      >
                        <option value="upi">UPI (Manual)</option>
                        <option value="cod">Cash on Delivery</option>
                        {user?.khata_enabled && <option value="khata">Khata (Credit)</option>}
                        <option value="wallet">Wallet</option>
                      </select>
                    </div>

                    {retryPaymentMethod === 'upi' && (
                      <>
                        <div>
                          <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-2 block">UTR Number</label>
                          <input 
                            type="text" 
                            placeholder="Enter 12-digit UPI Transaction Ref"
                            value={retryUtr}
                            onChange={(e) => setRetryUtr(e.target.value)}
                            className="w-full p-4 bg-stone-50 border border-stone-100 rounded-2xl outline-none focus:border-primary font-bold text-stone-700"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-2 block">Screenshot URL (Optional)</label>
                          <input 
                            type="text" 
                            placeholder="Paste screenshot link if any"
                            value={retryScreenshot}
                            onChange={(e) => setRetryScreenshot(e.target.value)}
                            className="w-full p-4 bg-stone-50 border border-stone-100 rounded-2xl outline-none focus:border-primary font-bold text-stone-700"
                          />
                        </div>
                      </>
                    )}
                  </div>

                  <div className="flex gap-4">
                    <button 
                      onClick={() => setShowRetryModal(false)}
                      className="flex-1 py-4 font-bold text-stone-500 hover:bg-stone-50 rounded-2xl transition-all"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={handleRetryPayment}
                      disabled={isRetrying}
                      className="flex-1 py-4 bg-primary text-white font-bold rounded-2xl active:scale-95 transition-all shadow-lg shadow-primary/20 disabled:opacity-50"
                    >
                      {isRetrying ? 'Updating...' : 'Submit Update'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}
