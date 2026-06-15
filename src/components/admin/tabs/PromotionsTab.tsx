import React from 'react';
import { 
  Plus, Megaphone, Eye, MousePointer2, Users, 
  Trash2, X, Check, Settings, ExternalLink, ImageOff
} from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';

interface PromotionsTabProps {
    promotions: any[];
    setNewPromotion: (val: any) => void;
    setPromotionModal: (val: any) => void;
    togglePromotionStatus: (id: string) => void;
    handleDeletePromotion: (id: string) => void;
    setNewPromotionRuleData: (val: any) => void;
    setPromotionRuleFormModal: (val: any) => void;
}

const PromotionsTab: React.FC<PromotionsTabProps> = ({
    promotions,
    setNewPromotion,
    setPromotionModal,
    togglePromotionStatus,
    handleDeletePromotion,
    setNewPromotionRuleData,
    setPromotionRuleFormModal
}) => {
    return (
        <div className="max-w-full overflow-x-hidden space-y-10 animate-in fade-in duration-500 pb-10 pr-2">
            {/* Campaign Header */}
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-8">
              <div>
                <h2 className="text-4xl font-black text-stone-900 tracking-tight">Campaign Center</h2>
                <p className="text-stone-500 mt-2 text-lg font-medium">Coordinate store-wide visual banners and promotional announcements.</p>
              </div>
              <button 
                onClick={() => {
                  setNewPromotion({ title: '', description: '', image_url: '', link: '', active: true, target_role: 'all', start_time: '', end_time: '', banner_type: 'standard', is_default: false });
                  setPromotionModal({ open: true, mode: 'add' });
                }}
                className="bg-stone-900 text-white px-8 py-4 rounded-[2rem] font-black flex items-center space-x-3 shadow-2xl shadow-stone-300 hover:bg-stone-800 transition-all active:scale-95 group"
              >
                <Plus size={18} />
                <span className="uppercase tracking-widest text-xs">Architect New Banner</span>
              </button>
            </header>

            {/* Banner Performance Stats */}
            <section className="grid grid-cols-1 md:grid-cols-4 gap-6">
               {[
                 { label: 'Live Banners', val: promotions.filter(p => p.active).length, icon: Eye, color: 'text-primary' },
                 { label: 'Avg Click Rate', val: '4.2%', icon: MousePointer2, color: 'text-emerald-500' },
                 { label: 'Campaign Reach', val: '12.4k', icon: Users, color: 'text-blue-500' },
                 { label: 'Total Variants', val: promotions.length, icon: Megaphone, color: 'text-purple-500' }
               ].map((stat, i) => (
                 <div key={i} className="bg-white p-6 rounded-3xl border border-stone-100 shadow-sm flex items-center space-x-4">
                    <div className={cn("p-3 rounded-2xl bg-stone-50", stat.color)}>
                      <stat.icon size={20} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest leading-none mb-1">{stat.label}</p>
                      <p className="text-xl font-black text-stone-900">{stat.val}</p>
                    </div>
                 </div>
               ))}
            </section>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {promotions.map((promo, idx) => (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  key={promo.id} 
                  className="bg-white rounded-[2.5rem] overflow-hidden shadow-sm border border-stone-100 group flex flex-col hover:shadow-2xl hover:shadow-stone-200 transition-all duration-500"
                >
                  <div className="h-56 relative bg-stone-100 overflow-hidden">
                    {promo.image_url ? (
                      <img 
                        src={promo.image_url} 
                        alt="" 
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-stone-300">
                        <ImageOff size={40} className="mb-2" />
                        <span className="text-[10px] uppercase font-black tracking-widest">Missing Creative</span>
                      </div>
                    )}
                    
                    <div className="absolute inset-0 bg-stone-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-3 backdrop-blur-sm">
                        <button 
                          onClick={() => togglePromotionStatus(promo.id)}
                          className="w-12 h-12 bg-white text-stone-900 rounded-2xl flex items-center justify-center hover:bg-primary"
                        >
                          {promo.active ? <X size={20} /> : <Check size={20} />}
                        </button>
                        <button 
                          onClick={() => handleDeletePromotion(promo.id)}
                          className="w-12 h-12 bg-red-500 text-white rounded-2xl flex items-center justify-center"
                        >
                          <Trash2 size={20} />
                        </button>
                    </div>
                  </div>

                  <div className="p-8 flex flex-col flex-1">
                    <h3 className="text-xl font-black text-stone-900 tracking-tight leading-tight mb-2 truncate">{promo.title}</h3>
                    <p className="text-xs text-stone-500 font-medium line-clamp-2 mb-6 leading-relaxed flex-1">{promo.description}</p>
                    
                    <div className="pt-6 border-t border-stone-50 flex items-center justify-between">
                       <span className="text-[10px] font-black uppercase text-stone-400 tracking-[0.2em]">{promo.target_role || 'All Audience'}</span>
                       <div className="p-3 bg-stone-50 group-hover:bg-primary/10 rounded-xl transition-colors">
                          <ExternalLink size={16} />
                       </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
        </div>
    );
};

export default PromotionsTab;
