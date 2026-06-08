import React from 'react';
import { motion } from 'motion/react';
import { Plus, Tag, Pencil, RefreshCw, Trash2 } from 'lucide-react';
import { cn } from '@/types';

interface CouponsTabProps {
  coupons: any[];
  setCouponModal: (modal: { open: boolean; mode: 'add' | 'edit'; editingId?: number }) => void;
  setNewCoupon: (coupon: {
    code: string;
    type: 'flat' | 'percentage';
    value: string;
    min_order: string;
    usage_limit: string;
    limit_per_user: string;
    expiry_date: string;
  }) => void;
  toggleCouponStatus: (id: number) => void;
  deleteCoupon: (id: number) => void;
}

export default function CouponsTab({
  coupons,
  setCouponModal,
  setNewCoupon,
  toggleCouponStatus,
  deleteCoupon,
}: CouponsTabProps) {
  return (
    <div className="h-full overflow-y-auto no-scrollbar space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500 font-sans pb-10 pr-2">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div>
          <h2 className="text-4xl font-black text-stone-900 tracking-tight text-left">Coupons</h2>
          <p className="text-stone-500 mt-2 text-lg font-medium text-left">Create and manage discount coupons for your store.</p>
        </div>
        <button 
          onClick={() => {
            setCouponModal({ open: true, mode: 'add' });
            setNewCoupon({ code: '', type: 'flat', value: '', min_order: '', usage_limit: '', limit_per_user: '1', expiry_date: '' });
          }}
          className="group flex items-center space-x-3 bg-stone-900 text-white px-10 py-5 rounded-[2rem] text-sm font-black uppercase tracking-widest hover:bg-stone-800 transition-all shadow-2xl shadow-stone-900/30 hover:scale-105 active:scale-95"
        >
          <div className="p-1 bg-white/20 rounded-lg group-hover:rotate-12 transition-transform duration-500">
            <Plus size={20} />
          </div>
          <span>Create Coupon</span>
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {coupons.map((coupon, idx) => (
          <motion.div 
            key={coupon.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className={cn(
              "group bg-white rounded-[2.5rem] shadow-sm border-2 transition-all duration-500 relative overflow-hidden flex flex-col justify-between",
              coupon.active ? "border-stone-100 hover:border-primary/30" : "border-stone-50 opacity-60 grayscale"
            )}
          >
            <div className="p-8">
              <div className="flex justify-between items-start mb-8">
                <div className={cn(
                  "w-16 h-16 rounded-3xl flex items-center justify-center transition-all duration-500 group-hover:scale-110 shadow-lg",
                  coupon.active ? "bg-primary/10 text-primary" : "bg-stone-50 text-stone-300"
                )}>
                  <Tag size={32} />
                </div>
                
                <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                   <button 
                    onClick={() => {
                      setCouponModal({ open: true, mode: 'edit', editingId: coupon.id });
                      setNewCoupon({
                        code: coupon.code,
                        type: coupon.type,
                        value: coupon.value.toString(),
                        min_order: coupon.min_order.toString(),
                        usage_limit: coupon.usage_limit ? coupon.usage_limit.toString() : '',
                        limit_per_user: coupon.limit_per_user ? coupon.limit_per_user.toString() : '1',
                        expiry_date: coupon.expiry_date || ''
                      });
                    }}
                    className="p-3 bg-stone-50 hover:bg-stone-200 text-stone-600 rounded-2xl transition-all"
                  >
                    <Pencil size={18} />
                  </button>
                   <button 
                    onClick={() => toggleCouponStatus(coupon.id)}
                    className="p-3 bg-stone-50 hover:bg-emerald-50 hover:text-emerald-500 rounded-2xl transition-all"
                  >
                    <RefreshCw size={18} />
                  </button>
                  <button 
                    onClick={() => deleteCoupon(coupon.id)}
                    className="p-3 bg-stone-50 hover:bg-red-50 hover:text-red-500 rounded-2xl transition-all"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <p className="text-[10px] font-black text-stone-400 uppercase tracking-[0.25em] mb-1 text-left">Coupon Code</p>
                  <h3 className="text-2xl font-black text-stone-900 group-hover:text-primary transition-colors tracking-tighter text-left">{coupon.code}</h3>
                </div>

                <div className="flex items-end justify-between bg-stone-50 p-6 rounded-[2rem] border border-stone-100">
                  <div className="flex flex-col items-start">
                    <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest leading-none mb-1">Discount Value</p>
                    <p className="text-4xl font-black text-primary tracking-tighter">
                      {coupon.type === 'flat' ? `₹${coupon.value}` : `${coupon.value}%`}
                    </p>
                  </div>
                  <div className={cn(
                    "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest",
                    coupon.active ? "bg-emerald-100 text-emerald-700" : "bg-stone-200 text-stone-500"
                  )}>
                    {coupon.active ? 'Active' : 'Disabled'}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6 pt-2">
                  <div className="flex flex-col items-start">
                    <p className="text-[9px] font-black text-stone-400 uppercase tracking-widest mb-1 text-left">Usage Limit</p>
                    <p className="text-sm font-black text-stone-900">{coupon.usage_limit || 'UNLIMITED'}</p>
                    <p className="text-[8px] font-bold text-stone-400 uppercase mt-0.5">Used: {coupon.usage_count || 0}</p>
                  </div>
                  <div className="text-right flex flex-col items-end">
                    <p className="text-[9px] font-black text-stone-400 uppercase tracking-widest mb-1 text-right">Min Order</p>
                    <p className="text-sm font-black text-stone-900 text-right font-sans">₹{coupon.min_order}</p>
                    <p className="text-[8px] font-bold text-stone-400 uppercase mt-0.5 text-right">Limit/User: {coupon.limit_per_user || 1}</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className={cn(
              "h-2 w-full transition-colors duration-500 mt-auto",
              coupon.active ? "bg-primary" : "bg-stone-200"
            )} />
          </motion.div>
        ))}
        
        <motion.button
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          onClick={() => {
            setCouponModal({ open: true, mode: 'add' });
            setNewCoupon({ code: '', type: 'flat', value: '', min_order: '', usage_limit: '', limit_per_user: '1', expiry_date: '' });
          }}
          className="group border-4 border-dashed border-stone-100 rounded-[2.5rem] p-8 flex flex-col items-center justify-center space-y-6 hover:border-primary/20 hover:bg-primary/5 transition-all duration-500 min-h-[300px]"
        >
          <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center text-stone-200 group-hover:text-primary group-hover:scale-110 group-hover:rotate-12 transition-all duration-500 shadow-sm">
            <Plus size={40} />
          </div>
          <div className="text-center">
            <p className="text-base font-black text-stone-400 group-hover:text-primary tracking-tight transition-colors font-sans">Create New Coupon</p>
            <p className="text-[10px] font-bold text-stone-300 uppercase tracking-widest mt-1 font-sans">Add a new coupon code</p>
          </div>
        </motion.button>
      </div>
    </div>
  );
}
