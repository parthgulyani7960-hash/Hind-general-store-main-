import React from 'react';
import { motion } from 'motion/react';
import { Plus, Settings, Trash2, Image as ImageIcon } from 'lucide-react';
import { cn } from '@/types';

interface CategoriesTabProps {
  categories: any[];
  allProducts: any[];
  setCategoryModal: (modal: { open: boolean; mode: 'add' | 'edit' }) => void;
  setEditingCategory: (cat: any) => void;
  setNewCategory: (cat: { name: string; icon: string }) => void;
}

export default function CategoriesTab({
  categories,
  allProducts,
  setCategoryModal,
  setEditingCategory,
  setNewCategory,
}: CategoriesTabProps) {
  return (
    <div className="max-w-full overflow-x-hidden space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500 font-sans pb-10 pr-2">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div>
          <h2 className="text-4xl font-black text-stone-900 tracking-tight text-left">Product Categories</h2>
          <p className="text-stone-500 mt-2 text-lg font-medium text-left">Manage how your products are grouped and displayed.</p>
        </div>
        <button 
          onClick={() => setCategoryModal({ open: true, mode: 'add' })}
          className="group flex items-center space-x-3 bg-stone-900 text-white px-10 py-5 rounded-[2rem] text-sm font-black uppercase tracking-widest hover:bg-stone-800 transition-all shadow-2xl shadow-stone-900/30 hover:scale-105 active:scale-95"
        >
          <div className="p-1 bg-white/20 rounded-lg group-hover:rotate-90 transition-transform duration-500">
            <Plus size={20} />
          </div>
          <span>Add Category</span>
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {categories.map((cat, idx) => {
          const categoryProducts = allProducts.filter(p => p.category_id === (cat as any).id);
          const totalStock = categoryProducts.reduce((sum, p) => sum + (p.stock || 0), 0);
          const outOfStockCount = categoryProducts.filter(p => (p.stock || 0) <= 0).length;

          return (
            <motion.div 
              key={cat.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="group bg-white rounded-[2.5rem] shadow-sm border border-stone-100 hover:border-primary/30 transition-all duration-500 relative overflow-hidden flex flex-col justify-between"
            >
              <div className="p-8">
                <div className="flex justify-between items-start mb-8">
                  <div className="relative">
                    <div className={cn(
                      "w-16 h-16 rounded-3xl flex items-center justify-center transition-all duration-500 group-hover:scale-110 group-hover:rotate-3 shadow-lg",
                      cat.is_out_of_stock ? "bg-red-50 text-red-500" : "bg-primary/10 text-primary"
                    )}>
                       {cat.icon ? (
                         <i className={cn("text-2xl", cat.icon)} />
                       ) : (
                         <ImageIcon size={32} />
                       )}
                    </div>
                    {outOfStockCount > 0 && (
                      <div className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center border-4 border-white shadow-lg">
                        {outOfStockCount}
                      </div>
                    )}
                  </div>

                  <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => {
                        setEditingCategory(cat);
                        setNewCategory({ name: cat.name, icon: cat.icon });
                        setCategoryModal({ open: true, mode: 'edit' });
                      }}
                      className="p-3 bg-stone-50 hover:bg-primary/10 hover:text-primary rounded-2xl transition-all"
                    >
                      <Settings size={18} />
                    </button>
                    <button className="p-3 bg-stone-50 hover:bg-red-50 hover:text-red-500 rounded-2xl transition-all">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="text-xl font-black text-stone-900 group-hover:text-primary transition-colors tracking-tight text-left">{cat.name}</h4>
                    <span className={cn(
                      "text-[10px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-full border mt-2 inline-block",
                      cat.is_out_of_stock ? "bg-red-55 text-red-600 border-red-100" : "bg-emerald-55 text-emerald-600 border-emerald-110"
                    )}>
                      {cat.is_out_of_stock ? 'CRITICAL: OUT OF STOCK' : 'Operational'}
                    </span>
                  </div>

                  <div className="pt-6 border-t border-stone-50 grid grid-cols-2 gap-4">
                    <div className="space-y-0.5">
                      <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest leading-none text-left">SKU Count</p>
                      <p className="text-xl font-black text-stone-900 text-left">{categoryProducts.length}</p>
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest leading-none text-left">Net Inventory</p>
                      <p className="text-xl font-black text-stone-900 text-left">{totalStock}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="h-2 w-full bg-stone-50 mt-auto">
                <div 
                  className={cn("h-full transition-all duration-1000", cat.is_out_of_stock ? "bg-red-500" : "bg-primary")} 
                  style={{ width: `${Math.min(100, (totalStock / 500) * 100)}%` }}
                />
              </div>
            </motion.div>
          );
        })}
        
        <motion.button
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          onClick={() => setCategoryModal({ open: true, mode: 'add' })}
          className="group border-4 border-dashed border-stone-100 rounded-[2.5rem] p-8 flex flex-col items-center justify-center space-y-6 hover:border-primary/20 hover:bg-primary/5 transition-all duration-500 min-h-[300px]"
        >
          <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center text-stone-200 group-hover:text-primary group-hover:scale-110 group-hover:rotate-90 transition-all duration-500 shadow-sm">
            <Plus size={40} />
          </div>
          <div className="text-center">
            <p className="text-base font-black text-stone-400 group-hover:text-primary tracking-tight transition-colors">Expand Intelligence</p>
            <p className="text-[10px] font-bold text-stone-300 uppercase tracking-widest mt-1">Add domain category</p>
          </div>
        </motion.button>
      </div>
    </div>
  );
}
