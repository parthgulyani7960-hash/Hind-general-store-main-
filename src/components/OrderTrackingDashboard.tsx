import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Package, Truck, CheckCircle2, Home, Info, ShoppingBag, 
  ChevronRight, ChevronDown, Clock, MapPin, ExternalLink,
  AlertCircle, RefreshCw, RefreshCw as SpinnerIcon, Copy, Share2
} from 'lucide-react';
import { useStore } from '@/StoreContext';
import { db } from '@/firebase';
import { collection, query, where, orderBy, onSnapshot, limit } from 'firebase/firestore';
import { cn } from '@/types';
import toast from 'react-hot-toast';
import { fetchWithHandling } from '@/lib/api';
import { formatPhoneNumber } from '@/lib/utils';
import { OrderStatusTimeline } from '@/components/admin/OrderStatusTimeline';

// Leaflet imports for Live Map
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

interface OrderTrackingDashboardProps {
  onViewOrderDetails?: (orderId: string) => void;
}

export default function OrderTrackingDashboard({ onViewOrderDetails }: OrderTrackingDashboardProps) {
  const { user, t } = useStore();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedOrders, setExpandedOrders] = useState<Record<string, boolean>>({});
  const [runnerLocations, setRunnerLocations] = useState<Record<string, any>>({});
  const [timelineKeys, setTimelineKeys] = useState<Record<string, number>>({});

  const userIdStr = String(user?.id || '');

  // 1. Subscribe to orders in Firestore in real-time
  useEffect(() => {
    if (!userIdStr || !db) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const ordersQuery = query(
      collection(db, 'orders'),
      where('user_id', '==', userIdStr),
      orderBy('created_at', 'desc'),
      limit(25)
    );

    const unsubscribe = onSnapshot(
      ordersQuery,
      (snapshot) => {
        const orderData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setOrders(orderData);
        setError(null);
        setLoading(false);
      },
      (err) => {
        console.error('[OrderTrackingDashboard] Firestore subscription error:', err);
        setError('Unable to load real-time status. Please try refreshing.');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [userIdStr]);

  // 2. Separate active (tracking-eligible) and past orders
  const activeOrders = useMemo(() => {
    return orders.filter(
      order => 
        order.status && 
        ['pending', 'confirmed', 'processing', 'shipped', 'dispatched'].includes(order.status)
    );
  }, [orders]);

  const pastOrders = useMemo(() => {
    return orders.filter(
      order => 
        order.status && 
        ['delivered', 'cancelled', 'failed'].includes(order.status)
    );
  }, [orders]);

  // 3. Poll runner location for active shipped orders
  useEffect(() => {
    const shippedOrders = activeOrders.filter(
      o => o.status === 'shipped' || o.status === 'dispatched'
    );

    if (shippedOrders.length === 0) return;

    const fetchLocations = async () => {
      for (const order of shippedOrders) {
        try {
          const res = await fetchWithHandling<any>(`/api/orders/${order.order_id || order.id}/runner-location`);
          if (res && res.location) {
            setRunnerLocations(prev => ({
              ...prev,
              [order.id]: res
            }));
          }
        } catch (e) {
          // Silent catch to prevent console pollution
        }
      }
    };

    fetchLocations();
    const interval = setInterval(fetchLocations, 15000);

    return () => clearInterval(interval);
  }, [activeOrders]);

  const toggleExpand = (id: string) => {
    setExpandedOrders(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const getSteps = (order: any) => {
    const isPickup = order.delivery_type === 'pickup';
    return [
      { key: 'pending', label: t('order_placed') || 'Order Placed', icon: Package, description: 'We received your order' },
      { key: 'confirmed', label: t('confirmed') || 'Confirmed', icon: CheckCircle2, description: 'Inventory reserved' },
      { key: 'processing', label: t('processing') || 'Packing', icon: Info, description: 'Items are being packed' },
      { 
        key: 'shipped', 
        label: isPickup ? 'Ready for Pickup' : t('shipped') || 'In Transit', 
        icon: isPickup ? ShoppingBag : Truck, 
        description: isPickup ? 'Ready at the store' : 'Out with delivery agent' 
      },
      { 
        key: 'delivered', 
        label: isPickup ? 'Collected' : t('delivered') || 'Delivered', 
        icon: isPickup ? CheckCircle2 : Home, 
        description: isPickup ? 'Picked up from store' : 'Delivered safely' 
      }
    ];
  };

  const getStepDate = (order: any, stepIndex: number, isCompleted: boolean) => {
    const steps = getSteps(order);
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

  const copyToClipboard = (text: string, message: string) => {
    navigator.clipboard.writeText(text);
    toast.success(message);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <RefreshCw className="w-8 h-8 text-primary animate-spin" />
        <p className="text-stone-500 font-bold text-sm">Synchronizing live order status...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 rounded-2xl border border-red-100 text-center space-y-4 max-w-lg mx-auto">
        <AlertCircle className="w-10 h-10 text-red-500 mx-auto" />
        <h3 className="font-bold text-red-900">Connection Interrupted</h3>
        <p className="text-red-700 text-sm">{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="px-6 py-2 bg-red-600 text-white font-bold rounded-xl text-xs hover:bg-red-700 transition"
        >
          Try Reconnecting
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* 1. Active Orders Tracker */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-black text-stone-900 flex items-center gap-2">
              <Truck className="text-primary" size={22} />
              Active Delivery Tracking
            </h3>
            <p className="text-xs text-stone-400 mt-1">Real-time status of orders currently on their way to you</p>
          </div>
          <span className="px-3 py-1 bg-primary/10 text-primary text-xs font-black rounded-full">
            {activeOrders.length} {activeOrders.length === 1 ? 'Order' : 'Orders'} Active
          </span>
        </div>

        {activeOrders.length === 0 ? (
          <div className="p-12 text-center bg-stone-50 border border-dashed border-stone-200 rounded-[2rem] flex flex-col items-center justify-center space-y-4">
            <div className="p-4 bg-white rounded-full shadow-sm text-stone-300">
              <Package size={28} />
            </div>
            <div>
              <p className="font-bold text-stone-700">No active deliveries</p>
              <p className="text-xs text-stone-400 mt-1">When you place a new order, you can monitor its real-time journey here</p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {activeOrders.map((order) => {
              const steps = getSteps(order);
              const currentStepIndex = steps.findIndex(s => s.key === order.status);
              const isExpanded = expandedOrders[order.id];
              const runnerLocation = runnerLocations[order.id];

              return (
                <div 
                  key={order.id}
                  className="bg-white border border-stone-150 rounded-[2rem] shadow-sm hover:shadow-md transition-all overflow-hidden duration-300"
                >
                  {/* Order Overview Header */}
                  <div className="p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-stone-50/50 border-b border-stone-100">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-black text-stone-800">Order #{order.order_id || order.id}</span>
                        <span className={cn(
                          "text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full border",
                          order.delivery_type === 'pickup' 
                            ? "bg-orange-50 border-orange-100 text-orange-600" 
                            : "bg-blue-50 border-blue-100 text-blue-600"
                        )}>
                          {order.delivery_type || 'Delivery'}
                        </span>
                        <span className="text-xs text-stone-400 font-medium">
                          Placed {new Date(order.created_at || Date.now()).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                      <p className="text-xs text-stone-500 font-bold">
                        Total Value: <span className="text-stone-900 font-black">₹{Number(order.total || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-3 self-stretch md:self-auto justify-between md:justify-end">
                      <div className="flex items-center gap-1.5">
                        <button 
                          onClick={() => copyToClipboard(order.order_id || order.id, 'Order ID copied!')}
                          className="p-1.5 hover:bg-stone-100 rounded-lg text-stone-400 hover:text-stone-700 transition"
                          title="Copy ID"
                        >
                          <Copy size={14} />
                        </button>
                        <button 
                          onClick={() => copyToClipboard(`Tracking Order #${order.order_id || order.id}\nStatus: ${order.status.toUpperCase()}`, 'Tracking info copied!')}
                          className="p-1.5 hover:bg-stone-100 rounded-lg text-stone-400 hover:text-stone-700 transition"
                          title="Share Info"
                        >
                          <Share2 size={14} />
                        </button>
                      </div>
                      
                      <button
                        onClick={() => toggleExpand(order.id)}
                        className="flex items-center gap-1 text-xs font-black uppercase tracking-wider text-primary hover:bg-primary/5 py-2 px-3 rounded-xl transition"
                      >
                        <span>{isExpanded ? 'Hide Details' : 'Track Order'}</span>
                        {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                      </button>
                    </div>
                  </div>

                  {/* Stepper / Timeline representation */}
                  <div className="p-6">
                    {/* Horizontal Tracker for Large Screens */}
                    <div className="hidden md:flex justify-between items-center relative mb-8 px-4">
                      {/* Connection Line */}
                      <div className="absolute top-6 left-12 right-12 h-1 bg-stone-100 -z-10 rounded-full">
                        <div 
                          className="h-full bg-primary transition-all duration-500 rounded-full"
                          style={{ width: `${(Math.max(0, currentStepIndex) / (steps.length - 1)) * 100}%` }}
                        />
                      </div>

                      {steps.map((step, idx) => {
                        const isCompleted = idx <= currentStepIndex;
                        const isCurrent = idx === currentStepIndex;
                        const StepIcon = step.icon;

                        return (
                          <div key={step.key} className="flex flex-col items-center space-y-2 flex-1 text-center group">
                            <div className={cn(
                              "w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 relative border-2",
                              isCurrent ? "bg-primary text-white border-primary shadow-lg shadow-primary/20 scale-110" :
                              isCompleted ? "bg-emerald-50 text-emerald-600 border-emerald-200" :
                              "bg-white text-stone-300 border-stone-200"
                            )}>
                              <StepIcon size={18} />
                              {isCurrent && (
                                <span className="absolute -top-1 -right-1 flex h-3. w-3">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
                                </span>
                              )}
                            </div>
                            <div className="max-w-[120px]">
                              <p className={cn(
                                "text-xs font-black transition-colors duration-300",
                                isCurrent ? "text-primary" :
                                isCompleted ? "text-stone-800" :
                                "text-stone-400"
                              )}>
                                {step.label}
                              </p>
                              {getStepDate(order, idx, isCompleted) && (
                                <p className="text-[9px] text-stone-400 font-semibold uppercase mt-0.5 tracking-wider">
                                  {getStepDate(order, idx, isCompleted)}
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Vertical Tracker for Mobile Screens */}
                    <div className="md:hidden space-y-4">
                      {steps.map((step, idx) => {
                        const isCompleted = idx <= currentStepIndex;
                        const isCurrent = idx === currentStepIndex;
                        const StepIcon = step.icon;

                        return (
                          <div key={step.key} className="flex items-start gap-4">
                            <div className="flex flex-col items-center shrink-0">
                              <div className={cn(
                                "w-10 h-10 rounded-xl flex items-center justify-center border-2 transition-all",
                                isCurrent ? "bg-primary text-white border-primary shadow-md shadow-primary/15" :
                                isCompleted ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                                "bg-white text-stone-300 border-stone-150"
                              )}>
                                <StepIcon size={16} />
                              </div>
                              {idx < steps.length - 1 && (
                                <div className={cn(
                                  "w-0.5 h-8 my-1",
                                  isCompleted ? "bg-emerald-400" : "bg-stone-100"
                                )} />
                              )}
                            </div>
                            <div className="pt-1 flex-1">
                              <h4 className={cn(
                                "text-sm font-bold",
                                isCurrent ? "text-primary" :
                                isCompleted ? "text-stone-800" :
                                "text-stone-400"
                              )}>
                                {step.label}
                              </h4>
                              <p className="text-xs text-stone-400 font-medium">{step.description}</p>
                              {getStepDate(order, idx, isCompleted) && (
                                <span className="text-[10px] font-black uppercase tracking-wider text-stone-400 mt-1 block">
                                  {getStepDate(order, idx, isCompleted)}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Collapsible live map and order items */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3 }}
                          className="mt-6 pt-6 border-t border-stone-100 space-y-6 overflow-hidden"
                        >
                          {/* Live Map tracking */}
                          {runnerLocation && (
                            <div className="border border-stone-150 rounded-2xl overflow-hidden">
                              <div className="bg-stone-50 px-4 py-3 border-b border-stone-150 flex justify-between items-center">
                                <span className="text-xs font-black text-stone-700 uppercase tracking-wider flex items-center gap-1.5">
                                  <MapPin size={14} className="text-primary" />
                                  Live Delivery Route
                                </span>
                                <span className="text-[10px] font-bold text-stone-400">
                                  Agent: {runnerLocation.runner?.name || 'Assigned Agent'}
                                </span>
                              </div>
                              <div className="h-64 relative z-0">
                                <MapContainer 
                                  center={[runnerLocation.location.lat, runnerLocation.location.lng]} 
                                  zoom={14} 
                                  className="h-full w-full"
                                >
                                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                                  <Marker position={[runnerLocation.location.lat, runnerLocation.location.lng]}>
                                    <Popup>
                                      <div className="text-xs font-bold font-sans">
                                        <p>{runnerLocation.runner?.name || 'Delivery Partner'}</p>
                                        <p className="text-stone-500 font-medium mt-0.5">{formatPhoneNumber(runnerLocation.runner?.phone)}</p>
                                      </div>
                                    </Popup>
                                  </Marker>
                                </MapContainer>
                              </div>
                              <div className="p-3 bg-stone-50/50 text-xs text-stone-500 flex items-center justify-between">
                                <span>Agent Phone: {formatPhoneNumber(runnerLocation.runner?.phone)}</span>
                                <a 
                                  href={`tel:${runnerLocation.runner?.phone}`}
                                  className="text-primary font-black uppercase tracking-wider hover:underline"
                                >
                                  Call Agent
                                </a>
                              </div>
                            </div>
                          )}

                          {/* Order status history logs */}
                          <div className="bg-stone-50/50 border border-stone-150 rounded-2xl p-4">
                            <h4 className="text-xs font-black text-stone-700 uppercase tracking-widest mb-4">Detailed Status History</h4>
                            <OrderStatusTimeline key={timelineKeys[order.id] || 0} orderId={order.id} />
                          </div>

                          {/* Order Items Summary */}
                          <div>
                            <h4 className="text-xs font-black text-stone-700 uppercase tracking-widest mb-3">Order Content</h4>
                            <div className="divide-y divide-stone-100 border border-stone-150 rounded-2xl overflow-hidden bg-white">
                              {order.items && order.items.map((item: any) => (
                                <div key={item.id} className="p-4 flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-stone-50 rounded-lg overflow-hidden border border-stone-150 shrink-0">
                                      <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                                    </div>
                                    <div>
                                      <p className="text-sm font-bold text-stone-800">{item.name}</p>
                                      <p className="text-xs text-stone-400">Qty: {item.quantity}</p>
                                    </div>
                                  </div>
                                  <p className="text-sm font-black text-stone-800">
                                    ₹{Number((item.price || 0) * (item.quantity || 1)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>

                          {onViewOrderDetails && (
                            <button
                              onClick={() => onViewOrderDetails(order.id)}
                              className="w-full py-3 bg-stone-50 hover:bg-stone-100 border border-stone-150 rounded-2xl text-xs font-black text-stone-600 hover:text-stone-800 tracking-wider uppercase transition flex items-center justify-center gap-2"
                            >
                              View Full Invoice and Receipt
                              <ExternalLink size={12} />
                            </button>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 2. Past Orders Reference */}
      {pastOrders.length > 0 && (
        <div className="space-y-4 pt-4 border-t border-stone-100">
          <div>
            <h4 className="text-sm font-black text-stone-600 uppercase tracking-wider">Completed or Cancelled Deliveries</h4>
            <p className="text-xs text-stone-400 mt-0.5">Reference of your recently completed tracking activities</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pastOrders.slice(0, 4).map((order) => (
              <div 
                key={order.id}
                className="bg-stone-50/50 border border-stone-150 p-4 rounded-2xl flex justify-between items-center"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-stone-800">Order #{order.order_id || order.id}</span>
                    <span className={cn(
                      "text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.2 border rounded",
                      order.status === 'delivered' ? "bg-emerald-50 border-emerald-100 text-emerald-600" : "bg-stone-100 border-stone-200 text-stone-500"
                    )}>
                      {order.status}
                    </span>
                  </div>
                  <p className="text-[10px] text-stone-400 font-medium">
                    Placed {new Date(order.created_at || Date.now()).toLocaleDateString()}
                  </p>
                </div>

                {onViewOrderDetails && (
                  <button 
                    onClick={() => onViewOrderDetails(order.id)}
                    className="p-2 hover:bg-stone-150 rounded-xl text-primary transition"
                    title="View Invoice"
                  >
                    <ExternalLink size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
