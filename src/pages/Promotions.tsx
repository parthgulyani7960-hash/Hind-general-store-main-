import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Tag, ExternalLink, ShoppingBag, ArrowRight, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import SmartLink from '@/components/SmartLink';
import { cn } from '@/types';
import { fetchWithHandling } from '@/lib/api';
import { useStore } from '@/StoreContext';

interface Promotion {
  id: number;
  title: string;
  description: string;
  image_url: string;
  link: string;
  created_at: string;
}

export default function Promotions() {
  const { config = [] } = useStore();
  const isPageEnabled = config.find(c => c.key === 'feature_promotions_page_enabled')?.value !== 'false';
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isPageEnabled) {
      setLoading(false);
      return;
    }
    fetchWithHandling<Promotion[]>('/api/promotions')
      .then(data => {
        if (data) setPromotions(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isPageEnabled) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-stone-50 p-6 text-center">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white p-12 md:p-20 rounded-[3rem] border-2 border-dashed border-stone-200 max-w-2xl space-y-6 shadow-2xl shadow-stone-200/50"
        >
          <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 text-primary">
            <Sparkles size={48} className="animate-pulse" />
          </div>
          <h2 className="text-4xl font-black text-stone-900 tracking-tighter">Promotions coming soon!</h2>
          <p className="text-stone-500 font-medium text-lg leading-relaxed">
            We are working on bringing you exclusive deals and exciting seasonal offers. 
            Check back soon to discover the best discounts at New Hind General Store!
          </p>
          <Link to="/" className="btn-primary px-10 py-4 inline-flex items-center gap-2">
            <ShoppingBag size={20} />
            <span>Go Back Shopping</span>
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <main className="pt-24 pb-32 md:pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center space-y-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="inline-flex items-center space-x-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-bold uppercase tracking-wider"
            >
              <Sparkles size={16} />
              <span>Exclusive Offers</span>
            </motion.div>
            <h1 className="text-4xl md:text-5xl font-black text-stone-900">Promotions & Deals</h1>
            <p className="text-stone-500 max-w-2xl mx-auto">
              Discover the best deals, seasonal offers, and exclusive discounts at New Hind General Store.
              Don't miss out on our latest promotions!
            </p>
          </div>

          {promotions.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-[2.5rem] border-2 border-dashed border-stone-200">
              <Tag size={48} className="mx-auto text-stone-300 mb-4" />
              <h3 className="text-xl font-bold text-stone-600">No active promotions right now</h3>
              <p className="text-stone-400">Check back later for exciting deals!</p>
              <SmartLink to="/products" className="btn-primary mt-6 inline-flex">
                Browse Products
              </SmartLink>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {promotions.map((promo, idx) => (
                <motion.div 
                  key={promo.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="group bg-white rounded-[2.5rem] overflow-hidden shadow-sm border border-stone-100 hover:shadow-xl transition-all duration-500 flex flex-col sm:flex-row"
                >
                  <div className="sm:w-2/5 h-64 sm:h-auto relative overflow-hidden">
                    <img 
                      src={promo.image_url || `https://picsum.photos/seed/promo-${promo.id}/600/800`} 
                      alt={promo.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <div className="sm:w-3/5 p-8 flex flex-col justify-between space-y-6">
                    <div className="space-y-3">
                      <h3 className="text-2xl font-black text-stone-900 group-hover:text-primary transition-colors">{promo.title}</h3>
                      <p className="text-stone-500 text-sm leading-relaxed">{promo.description}</p>
                    </div>
                    <div className="flex items-center justify-between pt-4 border-t border-stone-50">
                      <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">
                        Added {promo.created_at ? new Date(promo.created_at).toLocaleDateString() : 'Recently'}
                      </span>
                      <SmartLink 
                        to={promo.link || '/products'} 
                        className="flex items-center space-x-2 text-primary font-bold hover:underline"
                      >
                        <span>View Deal</span>
                        {promo.link?.startsWith('http') ? <ExternalLink size={16} /> : <ArrowRight size={16} />}
                      </SmartLink>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* Featured Products Banner */}
          <section className="bg-stone-900 rounded-[3rem] p-8 md:p-16 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 blur-[100px] rounded-full -mr-32 -mt-32" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-accent/20 blur-[100px] rounded-full -ml-32 -mb-32" />
            
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-12">
              <div className="max-w-xl space-y-6">
                <h2 className="text-4xl md:text-5xl font-black leading-tight">
                  Save Big on <br />
                  <span className="text-primary">Monthly Essentials</span>
                </h2>
                <p className="text-stone-400 text-lg">
                  Get up to 20% off on bulk orders of grains, pulses, and spices. 
                  Stock up your kitchen with the finest quality products.
                </p>
                <div className="flex flex-wrap gap-4 pt-4">
                  <SmartLink to="/products" className="bg-primary text-white px-8 py-4 rounded-2xl font-bold hover:bg-primary/90 transition-all flex items-center space-x-2">
                    <ShoppingBag size={20} />
                    <span>Shop Essentials</span>
                  </SmartLink>
                  <SmartLink to="/support" className="bg-white/10 backdrop-blur text-white px-8 py-4 rounded-2xl font-bold hover:bg-white/20 transition-all">
                    Contact Sales
                  </SmartLink>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 w-full md:w-auto">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="w-full md:w-32 h-32 bg-white/5 rounded-2xl border border-white/10 p-2 hover:bg-white/10 transition-colors">
                    <img 
                      src={`https://picsum.photos/seed/product-${i}/200/200`} 
                      className="w-full h-full object-cover rounded-xl"
                      alt="Product"
                    />
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
