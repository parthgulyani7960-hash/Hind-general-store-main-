import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Package, Truck, CheckCircle2, Search, ArrowRight, Home, Info, Phone, User, ShoppingBag, Copy } from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { cn } from '../types';
import { useStore } from '../StoreContext';

export default function TrackOrder() {
  const { t } = useStore();
  const [orderId, setOrderId] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(false);

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

      const res = await fetch(`/api/public/orders/${encodeURIComponent(cleanOrderId)}?phone=${encodeURIComponent(phoneNumber.trim())}`);
      
      if (!res.ok) {
        let errorMessage = 'Failed to fetch order status';
        try {
          const errorData = await res.json();
          errorMessage = errorData.message || errorMessage;
        } catch (e) {
        }
        throw new Error(errorMessage);
      }

      const data = await res.json();
      if (data.success) {
        setOrder(data.order);
      } else {
        toast.error(data.message || 'Order not found');
        setOrder(null);
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to fetch order status');
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
            <div className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-stone-200/50 border border-stone-100">
              <div className="flex justify-between items-center mb-12">
                <div className="flex flex-col md:flex-row md:items-center space-y-2 md:space-y-0 md:space-x-4">
                  <h3 className="text-2xl font-black text-stone-900">Order #{order.order_id || order.id}</h3>
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
                </div>
                <div className="px-6 py-2 bg-primary/10 rounded-full">
                  <span className="text-sm font-black text-primary uppercase tracking-widest">{t(order.status) || order.status}</span>
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

            {/* Order Items & Summary */}
            <div className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-stone-200/50 border border-stone-100">
               <h4 className="text-xl font-bold mb-6 flex items-center gap-2">
                 <ShoppingBag size={20} className="text-primary" />
                 {t('order_summary')}
               </h4>
               <div className="space-y-4">
                 {order.items && order.items.map((item: any) => (
                   <div key={item.id} className="flex items-center justify-between py-3 border-b border-stone-50 last:border-0">
                     <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-stone-100 rounded-xl overflow-hidden shrink-0">
                           <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                        </div>
                        <div>
                          <p className="font-bold text-stone-900 text-sm">{item.name}</p>
                          <p className="text-xs text-stone-400">Qty: {item.quantity}</p>
                        </div>
                     </div>
                     <p className="font-bold text-stone-900 text-sm">₹{item.price * item.quantity}</p>
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
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
