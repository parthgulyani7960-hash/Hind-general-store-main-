import React from 'react';
import { motion } from 'motion/react';
import { ChevronDown, ShieldCheck, Check, X } from 'lucide-react';
import { cn } from '@/types';

interface ReturnsTabProps {
  returns: any[];
  selectedReturnReason: string;
  setSelectedReturnReason: (reason: string) => void;
  handleApproveReturn: (ret: any) => void;
  handleRejectReturn: (id: number) => void;
}

export default function ReturnsTab({
  returns,
  selectedReturnReason,
  setSelectedReturnReason,
  handleApproveReturn,
  handleRejectReturn,
}: ReturnsTabProps) {
  const filteredReturns = returns.filter((ret) => {
    if (selectedReturnReason === 'all') return true;
    if (!ret.reason) return false;
    const reasonLower = ret.reason.toLowerCase();
    const filterLower = selectedReturnReason.toLowerCase();
    return reasonLower.includes(filterLower);
  });

  const total = returns.length;
  const damagedCount = returns.filter(r => r.reason?.toLowerCase().includes('damaged')).length;
  const incorrectCount = returns.filter(r => r.reason?.toLowerCase().includes('incorrect')).length;
  const mindCount = returns.filter(r => r.reason?.toLowerCase().includes('mind') || r.reason?.toLowerCase().includes('change') || r.reason?.toLowerCase().includes('customer')).length;

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500 font-sans">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 font-sans">
        <div>
          <h2 className="text-4xl font-black text-stone-900 tracking-tight text-left">Resolution Depot</h2>
          <p className="text-stone-500 mt-2 text-lg font-medium text-left">Verify grievances, inspect liabilities, and restore customer favor.</p>
        </div>
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-stone-100 flex items-center space-x-8">
           <div className="flex flex-col items-start">
             <span className="text-[10px] uppercase font-black text-stone-400 tracking-widest leading-none mb-1">Liability Pool</span>
             <span className="text-2xl font-black text-red-500">{returns.length} Pending</span>
           </div>
           <div className="w-px h-10 bg-stone-100" />
           <div className="flex flex-col items-start">
             <span className="text-[10px] uppercase font-black text-stone-400 tracking-widest leading-none mb-1">Health Score</span>
             <span className="text-2xl font-black text-emerald-500">99.2%</span>
           </div>
        </div>
      </header>

      {/* Filter Dropdown Area */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-6 bg-stone-50/50 rounded-3xl border border-stone-100 gap-4 font-sans">
        <div className="flex items-center space-x-3">
          <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">Catalogic Issue Filter:</span>
          <div className="relative">
            <select
              id="return-reason-filter"
              value={selectedReturnReason}
              onChange={(e) => setSelectedReturnReason(e.target.value)}
              className="appearance-none bg-white border border-stone-200 text-stone-700 font-extrabold text-xs rounded-2xl pl-4 pr-10 py-2.5 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all cursor-pointer"
            >
              <option value="all">🔍 Show All Returns</option>
              <option value="Damaged">⚠️ Damaged / Quality Issues</option>
              <option value="Incorrect Item">📦 Incorrect Item Sent</option>
              <option value="Customer Change of Mind">💭 Customer Change of Mind</option>
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-stone-400">
              <ChevronDown size={14} />
            </div>
          </div>
        </div>

        {/* Quality Insights summary */}
        {returns.length > 0 && (
          <div className="flex flex-wrap gap-2 text-[10px] font-mono text-stone-500 font-bold bg-white border border-stone-100 rounded-2xl p-2">
            <span className="px-2 py-1 bg-red-50 text-red-700 rounded-lg">Damaged: {damagedCount}</span>
            <span className="px-2 py-1 bg-amber-50 text-amber-700 rounded-lg">Incorrect: {incorrectCount}</span>
            <span className="px-2 py-1 bg-sky-50 text-sky-700 rounded-lg">Change of Mind: {mindCount}</span>
          </div>
        )}
      </div>

      <div className="bg-white rounded-[3rem] shadow-sm border border-stone-100 overflow-hidden font-sans">
         <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left font-sans">
            <thead className="bg-stone-50/50 text-stone-400 text-[10px] uppercase font-black tracking-[0.25em]">
              <tr>
                <th className="px-10 py-8">Origin Order</th>
                <th className="px-6 py-8">Claimant Node</th>
                <th className="px-6 py-8">Faulty SKU</th>
                <th className="px-6 py-8">Reason Cipher</th>
                <th className="px-6 py-8">Protocol State</th>
                <th className="px-10 py-8 text-right">Intervention</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-50">
              {filteredReturns.map((ret, idx) => (
                <motion.tr 
                  key={ret.id} 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.04 }}
                  className="hover:bg-stone-50/80 transition-all group animate-in"
                >
                  <td className="px-10 py-6 font-black text-stone-900 tracking-tighter text-left">ORD-{ret.order_num}</td>
                  <td className="px-6 py-6 font-bold text-stone-600 text-xs uppercase tracking-widest text-left">{ret.user_name}</td>
                  <td className="px-6 py-6 font-sans">
                     <div className="flex flex-col items-start">
                       <span className="text-sm font-black text-stone-900 text-left">{ret.product_name}</span>
                       <span className="text-[10px] font-black text-primary uppercase mt-1 tracking-widest">Quantity: {ret.quantity} units</span>
                     </div>
                  </td>
                  <td className="px-6 py-6 italic text-stone-400 font-medium text-xs max-w-[200px] truncate text-left">{ret.reason}</td>
                  <td className="px-6 py-6">
                    <span className={cn(
                      "px-4 py-1.5 rounded-2xl text-[9px] font-black uppercase tracking-widest border",
                      ret.status === 'pending' ? "bg-amber-50 text-amber-600 border-amber-100" :
                      ret.status === 'approved' ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                      "bg-red-50 text-red-600 border-red-100"
                    )}>
                      {ret.status}
                    </span>
                  </td>
                  <td className="px-10 py-6 text-right">
                    {ret.status === 'pending' ? (
                      <div className="flex justify-end space-x-3">
                        <button 
                          onClick={() => handleApproveReturn(ret)}
                          className="p-4 bg-emerald-600 text-white rounded-2xl hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-500/20 active:scale-95 inline-flex items-center"
                          title="Authorize Refund"
                        >
                          <Check size={18} />
                        </button>
                        <button 
                          onClick={() => handleRejectReturn(ret.id)}
                          className="p-4 bg-red-600 text-white rounded-2xl hover:bg-red-700 transition-all shadow-xl shadow-red-500/20 active:scale-95 inline-flex items-center"
                          title="Decline Claim"
                        >
                          <X size={18} />
                        </button>
                      </div>
                    ) : (
                      <div className="flex justify-end items-center space-x-2 text-stone-300">
                         <ShieldCheck size={16} />
                         <span className="text-[10px] font-black uppercase tracking-widest">Settled</span>
                      </div>
                    )}
                  </td>
                </motion.tr>
              ))}
              {filteredReturns.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-10 py-32 text-center text-stone-400 font-bold italic bg-stone-50/50 rounded-[2.5rem]">No returns or refunds match this filter criteria.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
