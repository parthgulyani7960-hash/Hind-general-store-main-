import React from 'react';
import { motion } from 'motion/react';
import { Plus, Zap, Settings as SettingsIcon, Trash2 } from 'lucide-react';
import { cn } from '@/types';

interface BulkDiscountsTabProps {
  bulkDiscounts: any[];
  setBulkDiscountModal: (modal: { open: boolean; mode: 'add' | 'edit'; discount: any }) => void;
  setNewBulkDiscount: (discount: {
    entity_type: 'product' | 'category';
    entity_id: string;
    min_qty: string;
    discount_type: 'percentage' | 'flat';
    discount_value: string;
    active: boolean;
  }) => void;
  handleToggleBulkDiscount: (discount: any) => void;
  handleDeleteBulkDiscount: (id: number) => void;
}

export default function BulkDiscountsTab({
  bulkDiscounts,
  setBulkDiscountModal,
  setNewBulkDiscount,
  handleToggleBulkDiscount,
  handleDeleteBulkDiscount,
}: BulkDiscountsTabProps) {
  return (
    <div className="max-w-full overflow-x-hidden space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500 font-sans pb-10 pr-2">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 font-sans">
        <div>
          <h2 className="text-4xl font-black text-stone-900 tracking-tight text-left">Tiered Pricing Engine</h2>
          <p className="text-stone-500 mt-2 text-lg font-medium text-left">B2B algorithmic discounts and bulk procurement logic.</p>
        </div>
        <button 
          onClick={() => {
            setBulkDiscountModal({ open: true, mode: 'add', discount: null });
            setNewBulkDiscount({ 
              entity_type: 'product', 
              entity_id: '', 
              min_qty: '5', 
              discount_type: 'percentage', 
              discount_value: '10',
              active: true
            });
          }}
          className="group flex items-center space-x-3 bg-stone-900 text-white px-10 py-5 rounded-[2rem] text-sm font-black uppercase tracking-widest hover:bg-stone-800 transition-all shadow-2xl shadow-stone-900/30 hover:scale-105 active:scale-95"
        >
          <div className="p-1 bg-white/20 rounded-lg group-hover:scale-110 transition-transform duration-500">
            <Plus size={20} />
          </div>
          <span>Provision Rule</span>
        </button>
      </header>

      <div className="bg-white rounded-[2.5rem] shadow-sm border border-stone-100 overflow-hidden font-sans">
         <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left font-sans">
            <thead className="bg-stone-50/50 text-stone-400 text-[10px] uppercase font-black tracking-[0.2em]">
              <tr>
                <th className="px-10 py-8">Target Entity</th>
                <th className="px-6 py-8">Trigger Quantity</th>
                <th className="px-6 py-8">Algorithmic Discount</th>
                <th className="px-6 py-8">Operational State</th>
                <th className="px-10 py-8 text-right">Clearance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-50">
              {bulkDiscounts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-10 py-32 text-center">
                    <div className="flex flex-col items-center space-y-4 pointer-events-none">
                      <div className="p-6 bg-stone-50 rounded-full text-stone-200">
                        <Zap size={48} />
                      </div>
                      <p className="text-stone-400 font-bold italic">No tiered pricing protocols active. Deploy a rule to begin scaling.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                bulkDiscounts.map((discount, idx) => (
                  <motion.tr 
                    key={discount.id} 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="hover:bg-stone-50/80 transition-all group animate-in"
                  >
                    <td className="px-10 py-6">
                      <div className="flex items-center space-x-3">
                        <span className={cn(
                          "text-[9px] font-black px-3 py-1 rounded-lg uppercase tracking-widest",
                          discount.entity_type === 'product' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'
                        )}>
                          {discount.entity_type === 'product' ? 'SKU' : 'DOMAIN'}
                        </span>
                        <span className="font-black text-stone-900 group-hover:text-primary transition-colors text-left">{discount.entity_name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-6 font-black text-stone-900 tracking-tight text-lg">{discount.min_qty}<span className="text-stone-300 ml-1 text-sm">units+</span></td>
                    <td className="px-6 py-6 transition-all">
                      <span className="font-black text-emerald-600 text-lg tracking-tighter bg-emerald-50 px-4 py-2 rounded-2xl">
                        {discount.discount_type === 'percentage' ? `${discount.discount_value}% Off` : `₹${discount.discount_value} Off`}
                      </span>
                    </td>
                    <td className="px-6 py-6">
                      <button 
                        onClick={() => handleToggleBulkDiscount(discount)}
                        className={cn(
                          "w-14 h-7 rounded-full transition-all duration-500 relative flex items-center px-1",
                          discount.active ? 'bg-primary' : 'bg-stone-200'
                        )}
                      >
                        <div className={cn(
                          "w-5 h-5 bg-white rounded-full shadow-sm transition-all duration-500",
                          discount.active ? 'translate-x-[28px]' : 'translate-x-0'
                        )} />
                      </button>
                    </td>
                    <td className="px-10 py-6 text-right space-x-2">
                      <button 
                        onClick={() => {
                          setBulkDiscountModal({ open: true, mode: 'edit', discount });
                          setNewBulkDiscount({
                            entity_type: discount.entity_type,
                            entity_id: discount.entity_id.toString(),
                            min_qty: discount.min_qty.toString(),
                            discount_type: discount.discount_type,
                            discount_value: discount.discount_value.toString(),
                            active: discount.active === 1
                          });
                        }}
                        className="p-3 bg-stone-100 hover:bg-white hover:shadow-xl hover:shadow-stone-200/50 hover:text-primary rounded-2xl transition-all border border-transparent inline-flex items-center"
                      >
                        <SettingsIcon size={18} />
                      </button>
                      <button 
                        onClick={() => handleDeleteBulkDiscount(discount.id)}
                        className="p-3 bg-stone-100 hover:bg-white hover:shadow-xl hover:shadow-red-200/50 hover:text-red-500 rounded-2xl transition-all border border-transparent inline-flex items-center"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
