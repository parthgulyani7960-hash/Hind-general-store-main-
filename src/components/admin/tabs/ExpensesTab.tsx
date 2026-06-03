import React from 'react';
import { motion } from 'motion/react';
import { TrendingDown, Trash2, Plus, ShieldCheck } from 'lucide-react';

interface ExpensesTabProps {
  expenses: any[];
  setExpenseModal: (modal: { open: boolean }) => void;
  deleteExpense: (id: number) => void;
}

export default function ExpensesTab({
  expenses,
  setExpenseModal,
  deleteExpense,
}: ExpensesTabProps) {
  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500 font-sans">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div>
          <h2 className="text-4xl font-black text-stone-900 tracking-tight text-left">Deficit Ledger</h2>
          <p className="text-stone-500 mt-2 text-lg font-medium text-left">Operational expenditure and fiscal leakage auditing.</p>
        </div>
        <button 
          onClick={() => setExpenseModal({ open: true })}
          className="group flex items-center space-x-3 bg-stone-900 text-white px-10 py-5 rounded-[2rem] text-sm font-black uppercase tracking-widest hover:bg-stone-800 transition-all shadow-2xl shadow-stone-900/30 hover:scale-105 active:scale-95"
        >
          <div className="p-1 bg-white/20 rounded-lg group-hover:scale-110 transition-transform duration-500">
            <Plus size={20} />
          </div>
          <span>Log Expenditure</span>
        </button>
      </header>

      <div className="bg-white rounded-[2.5rem] shadow-sm border border-stone-100 overflow-hidden">
         <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left font-sans">
            <thead className="bg-stone-50/50 text-stone-400 text-[10px] uppercase font-black tracking-[0.2em]">
              <tr>
                <th className="px-10 py-8">Intercept Description</th>
                <th className="px-6 py-8">Taxonomy Category</th>
                <th className="px-6 py-8">Deficit Amount</th>
                <th className="px-6 py-8">Calendar Index</th>
                <th className="px-10 py-8 text-right">Operational Clearance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-50">
              {expenses.map((expense, idx) => (
                <motion.tr 
                  key={expense.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.03 }}
                  className="hover:bg-stone-50/80 transition-all group"
                >
                  <td className="px-10 py-6">
                     <div className="flex items-center space-x-4">
                       <div className="w-10 h-10 bg-red-50 text-red-500 rounded-xl flex items-center justify-center shrink-0">
                         <TrendingDown size={18} />
                       </div>
                       <span className="text-sm font-black text-stone-900 group-hover:text-red-600 transition-colors text-left">{expense.description}</span>
                     </div>
                  </td>
                  <td className="px-6 py-6">
                    <span className="text-[10px] font-black px-4 py-1.5 bg-stone-100 rounded-full uppercase tracking-widest text-stone-500">{expense.category}</span>
                  </td>
                  <td className="px-6 py-6 font-black text-red-600 text-lg tracking-tighter">₹{expense.amount}</td>
                  <td className="px-6 py-6 text-sm text-stone-400 font-medium text-left">
                    {new Date(expense.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="px-10 py-6 text-right">
                    <button 
                      onClick={() => deleteExpense(expense.id)}
                      className="p-3 bg-stone-50 hover:bg-red-50 hover:text-red-500 rounded-2xl transition-all opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </motion.tr>
              ))}
              {expenses.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-10 py-32 text-center">
                     <div className="flex flex-col items-center space-y-4 pointer-events-none">
                      <div className="p-6 bg-stone-50 rounded-full text-stone-200">
                        <ShieldCheck size={48} />
                      </div>
                      <p className="text-stone-400 font-bold italic">Zero deficit protocols confirmed. Profit focus optimized.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
