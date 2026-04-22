import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Package, Truck, CheckCircle2, Search, ArrowRight, Home, Phone, Info, MapPin, User, Navigation } from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { cn } from '../types';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';

// Fix Leaflet marker icon issue by using CDN urls
const DefaultIcon = L.icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

// Custom Runner Icon
const runnerIcon = L.divIcon({
  html: `<div class="bg-primary p-2 rounded-full border-2 border-white shadow-lg text-white"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5.5 3.5a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z"/><path d="M19 13v-3l-1.1-2.3c-.3-.5-.8-.7-1.3-.7H12"/><path d="M12 7v4l-1 1H8"/><path d="M18 17a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z"/><path d="M12 18v-2.5c0-.8-.7-1.5-1.5-1.5H7.5c-.8 0-1.5.7-1.5 1.5V21"/></svg></div>`,
  className: '',
  iconSize: [32, 32],
  iconAnchor: [16, 16]
});

function MapRecenter({ coords }: { coords: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(coords);
  }, [coords]);
  return null;
}

export default function TrackOrder() {
  const [orderId, setOrderId] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [runnerLocation, setRunnerLocation] = useState<{lat: number, lng: number} | null>(null);

  useEffect(() => {
    if (!order?.assigned_runner_id) return;

    // Set initial location
    if (order.current_lat && order.current_lng) {
      setRunnerLocation({ lat: order.current_lat, lng: order.current_lng });
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(`${protocol}//${window.location.host}`);

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'RUNNER_LOCATION_UPDATE' && data.runner_id === order.assigned_runner_id) {
          setRunnerLocation({ lat: data.lat, lng: data.lng });
          if (order.status !== 'shipped' && order.status !== 'delivered') {
            // Update local order status if needed or just let it be
          }
        }
      } catch (e) {
        console.error('Socket error:', e);
      }
    };

    return () => ws.close();
  }, [order?.assigned_runner_id]);

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderId || !phoneNumber) {
      toast.error('Please enter both Order ID and Phone Number');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/public/orders/${orderId}?phone=${phoneNumber}`);
      const data = await res.json();
      if (data.success) {
        setOrder(data.order);
      } else {
        toast.error(data.message || 'Order not found');
        setOrder(null);
      }
    } catch (err) {
      toast.error('Failed to fetch order status');
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { key: 'pending', label: 'Order Placed', icon: Package, description: 'We have received your order' },
    { key: 'confirmed', label: 'Confirmed', icon: CheckCircle2, description: 'Inventory has been reserved' },
    { key: 'processing', label: 'Processing', icon: Info, description: 'Your items are being packed' },
    { key: 'shipped', label: 'Out for Delivery', icon: Truck, description: 'Our delivery partner is on the way' },
    { key: 'delivered', label: 'Delivered', icon: Home, description: 'Enjoy your purchase!' }
  ];

  const currentStepIndex = order ? steps.findIndex(s => s.key === order.status) : -1;

  return (
    <div className="min-h-screen pt-24 pb-12 bg-stone-50">
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
          <h1 className="text-4xl font-black text-stone-900 mb-4">Track Your Order</h1>
          <p className="text-stone-500 font-medium">Enter your details below to see the latest status of your delivery.</p>
        </div>

        {/* Tracking Form */}
        <div className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-stone-200/50 border border-stone-100 mb-12">
          <form onSubmit={handleTrack} className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest ml-1">Order ID</label>
              <div className="relative">
                <Package className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-300" size={18} />
                <input 
                  type="text" 
                  placeholder="e.g. 1024"
                  value={orderId}
                  onChange={(e) => setOrderId(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-stone-50 border border-stone-100 rounded-2xl outline-none focus:border-primary transition-all font-bold text-stone-700"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest ml-1">Phone Number</label>
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
                <span>{loading ? 'Tracking...' : 'Track Now'}</span>
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
            {/* Status Timeline */}
            {order.assigned_runner_id && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-[2.5rem] shadow-xl shadow-stone-200/50 border border-stone-100 overflow-hidden"
              >
                <div className="p-6 border-b border-stone-100 bg-stone-50/50 flex justify-between items-center">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-primary text-white rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
                      <Navigation size={20} />
                    </div>
                    <div>
                      <h3 className="font-black text-stone-900 leading-tight">Live Delivery Track</h3>
                      <p className="text-[10px] font-bold text-primary uppercase tracking-widest">Real-time GPS Active</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="text-right">
                      <p className="text-sm font-bold text-stone-900">{order.runner_name || 'Delivery Partner'}</p>
                      <p className="text-[10px] text-stone-500 font-medium">Coming to your location</p>
                    </div>
                    <a href={`tel:${order.runner_phone}`} className="w-10 h-10 bg-white border border-stone-100 rounded-xl flex items-center justify-center text-primary shadow-sm hover:scale-105 active:scale-95 transition-all">
                      <Phone size={18} />
                    </a>
                  </div>
                </div>

                <div className="h-[350px] relative z-0">
                  <MapContainer 
                    center={runnerLocation ? [runnerLocation.lat, runnerLocation.lng] : [30.9010, 75.8573]} 
                    zoom={15} 
                    style={{ height: '100%', width: '100%' }}
                    zoomControl={false}
                  >
                    <TileLayer
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      attribution='&copy; OpenStreetMap contributors'
                    />
                    {runnerLocation && (
                      <Marker position={[runnerLocation.lat, runnerLocation.lng]} icon={runnerIcon}>
                        <Popup>
                          <div className="text-center font-bold">
                            <p className="text-primary">{order.runner_name}</p>
                            <p className="text-[10px] text-stone-500">Out for Delivery</p>
                          </div>
                        </Popup>
                        <MapRecenter coords={[runnerLocation.lat, runnerLocation.lng]} />
                      </Marker>
                    )}
                  </MapContainer>

                  {!runnerLocation && (
                    <div className="absolute inset-0 bg-stone-900/10 backdrop-blur-[2px] flex items-center justify-center z-[1000]">
                      <div className="bg-white px-6 py-3 rounded-2xl shadow-xl flex items-center space-x-3">
                        <div className="w-2 h-2 bg-primary rounded-full animate-ping" />
                        <span className="text-xs font-bold text-stone-600">Waiting for runner location...</span>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            <div className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-stone-200/50 border border-stone-100">
              <div className="flex justify-between items-center mb-12">
                <div>
                  <h3 className="text-2xl font-black text-stone-900">Order #{order.id}</h3>
                  <p className="text-sm text-stone-500 font-medium">Placed on {new Date(order.created_at).toLocaleDateString()}</p>
                </div>
                <div className="px-6 py-2 bg-primary/10 rounded-full">
                  <span className="text-sm font-black text-primary uppercase tracking-widest">{order.status}</span>
                </div>
              </div>

              <div className="relative">
                {/* Connection Line */}
                <div className="absolute left-6 top-0 bottom-0 w-1 bg-stone-100 hidden md:block" />
                
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
                        {isCurrent && (
                          <div className="px-4 py-1.5 bg-emerald-50 text-emerald-600 rounded-lg text-[10px] font-black uppercase tracking-widest hidden md:block">
                            Current Status
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Quick Actions */}
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
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
