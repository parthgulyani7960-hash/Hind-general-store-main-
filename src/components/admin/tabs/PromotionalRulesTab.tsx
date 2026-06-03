import React from 'react';
import { Plus } from 'lucide-react';
import { cn } from '@/types';

interface PromotionalRulesTabProps {
  promotionRules: any[];
  setNewPromotionRuleData: (rule: {
    title: string;
    type: 'bogo' | 'percentage' | 'flat';
    target_type: 'all' | 'product' | 'category';
    target_id: string;
    condition_qty: number;
    reward_qty: number;
    discount_value: number;
    active: boolean;
  }) => void;
  setPromotionRuleFormModal: (modal: { open: boolean; mode: 'add' | 'edit'; rule: any }) => void;
  handleDeleteRule: (id: number) => void;
}

export default function PromotionalRulesTab({
  promotionRules,
  setNewPromotionRuleData,
  setPromotionRuleFormModal,
  handleDeleteRule,
}: PromotionalRulesTabProps) {
  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500 font-sans">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 font-sans">
        <div>
          <h2 className="text-4xl font-black text-stone-900 tracking-tight text-left">Promotional Rule Configuration</h2>
          <p className="text-stone-500 mt-2 text-lg font-medium text-left">Manage BOGO, discounts, and tiered logic for products and categories.</p>
        </div>
        <button 
          onClick={() => {
            setNewPromotionRuleData({ title: '', type: 'bogo', target_type: 'all', target_id: '', condition_qty: 0, reward_qty: 0, discount_value: 0, active: true });
            setPromotionRuleFormModal({ open: true, mode: 'add', rule: null });
          }}
          className="group flex items-center space-x-3 bg-stone-900 text-white px-8 py-4 rounded-[2rem] font-black flex items-center shadow-2xl shadow-stone-300 hover:bg-stone-800 transition-all active:scale-95 text-sm uppercase tracking-widest leading-none"
        >
          <Plus size={18} className="shrink-0" />
          <span>Architect New Rule</span>
        </button>
      </header>
      
      <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-stone-100 font-sans animate-in">
           <div className="p-6 border-b border-stone-100 flex justify-between items-center">
              <h3 className="font-bold text-lg text-left">Existing Rules</h3>
           </div>
          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full text-left font-sans">
              <thead>
                <tr className="bg-stone-50 border-b border-stone-100 uppercase text-[10px] font-black text-stone-500 tracking-wider">
                  <th className="p-4 pl-6">Status</th>
                  <th className="p-4">Title</th>
                  <th className="p-4">Type</th>
                  <th className="p-4">Target</th>
                  <th className="p-4">Condition</th>
                  <th className="p-4">Reward</th>
                  <th className="p-4 col-emerald">Value</th>
                  <th className="p-4 pr-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 font-semibold text-stone-600">
                {promotionRules.map((rule) => (
                  <tr key={rule.id} className="hover:bg-stone-50 transition-colors">
                    <td className="p-4 pl-6">
                      <span className={cn(
                        "px-2 py-1 flex w-min items-center rounded-lg text-[10px] font-bold uppercase tracking-wider",
                        rule.active ? "bg-emerald-100 text-emerald-700 font-sans" : "bg-stone-100 text-stone-500 font-sans"
                      )}>
                        {rule.active ? 'Active' : 'Paused'}
                      </span>
                    </td>
                    <td className="p-4 font-bold max-w-[200px] truncate text-left text-stone-900">{rule.title}</td>
                    <td className="p-4 uppercase text-[10px] font-black text-stone-500 tracking-widest text-left">{rule.type}</td>
                    <td className="p-4">
                      <span className="bg-stone-100 px-2 py-1 rounded text-xs font-bold text-stone-600 font-sans">
                        {rule.target_type === 'all' ? 'Entire Store' : `${rule.target_type}: ${rule.target_id}`}
                      </span>
                    </td>
                    <td className="p-4 font-bold text-left">{rule.condition_qty || 0}</td>
                    <td className="p-4 font-bold text-left">{rule.reward_qty || 0}</td>
                    <td className="p-4 font-bold text-emerald-600 text-left">
                      {rule.type === 'percentage' ? `${rule.discount_value}%` : `₹${rule.discount_value || 0}`}
                    </td>
                    <td className="p-4 pr-6 text-right">
                       <div className="flex justify-end space-x-2">
                         <button 
                           onClick={() => {
                              setNewPromotionRuleData({ title: rule.title, type: rule.type, target_type: rule.target_type, target_id: rule.target_id, condition_qty: rule.condition_qty, reward_qty: rule.reward_qty, discount_value: rule.discount_value, active: rule.active });
                              setPromotionRuleFormModal({ open: true, mode: 'edit', rule });
                           }}
                           className="text-primary hover:text-primary/80 font-black text-xs uppercase"
                         >Edit</button>
                         <button 
                           onClick={() => handleDeleteRule(rule.id)}
                           className="text-red-500 hover:text-red-700 font-black text-xs uppercase"
                         >Delete</button>
                       </div>
                    </td>
                  </tr>
                ))}
                {promotionRules.length === 0 && (
                  <tr>
                    <td colSpan={8} className="p-12 text-center text-stone-400 italic">No promotion rules active.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
      </div>
    </div>
  );
}
