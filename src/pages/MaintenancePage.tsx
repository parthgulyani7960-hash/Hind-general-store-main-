import React, { useEffect } from 'react';
import { motion } from 'motion/react';
import { Hammer, Clock, MessageCircle } from 'lucide-react';
import { useStore } from '@/StoreContext';

export default function MaintenancePage() {
  const { config = [], fetchConfig } = useStore();

  useEffect(() => {
    fetchConfig();
  }, []);

  const whatsappNumber = (config || []).find(c => c.key === 'whatsapp_number')?.value || '+91 98765 43210';
  const whatsappMessage = (config || []).find(c => c.key === 'whatsapp_message')?.value || 'Hello General Store Karyana, I would like to inquire about an order.';
  const maintenanceTime = (config || []).find(c => c.key === 'maintenance_time')?.value || '2 Hours';

  const handleWhatsApp = () => {
    const encodedMessage = encodeURIComponent(whatsappMessage);
    const cleanNumber = whatsappNumber.replace(/\D/g, '');
    window.open(`https://wa.me/${cleanNumber}?text=${encodedMessage}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full bg-white p-10 rounded-3xl shadow-xl border border-stone-100 text-center space-y-6"
      >
        <div className="w-20 h-20 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto">
          <Hammer className="text-amber-600 animate-bounce" size={40} />
        </div>
        
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-stone-900">Under Maintenance</h1>
          <p className="text-stone-500">
            General Store Karyana Shop is currently updating to serve you better. We'll be back online shortly!
          </p>
        </div>

        <div className="pt-6 border-t border-stone-100 grid grid-cols-2 gap-4">
          <div className="text-left">
            <div className="flex items-center space-x-2 text-stone-400 mb-1">
              <Clock size={14} />
              <span className="text-[10px] font-bold uppercase">Expected Back</span>
            </div>
            <p className="font-bold text-sm">Within {maintenanceTime}</p>
          </div>
          <div className="text-left">
            <div className="flex items-center space-x-2 text-stone-400 mb-1">
              <MessageCircle size={14} />
              <span className="text-[10px] font-bold uppercase">Urgent Orders</span>
            </div>
            <button 
              onClick={handleWhatsApp}
              className="font-bold text-sm text-primary hover:underline"
            >
              WhatsApp Us
            </button>
          </div>
        </div>

        <div className="pt-4 space-y-2">
          <p className="text-[10px] text-stone-300">
            General Store Karyana Shop is currently under maintenance.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
