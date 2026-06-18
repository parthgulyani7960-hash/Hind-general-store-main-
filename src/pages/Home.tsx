import { motion } from 'motion/react';
import { ArrowRight, ShieldCheck, Truck, Clock, PhoneCall, ShoppingBag, Eye, X, Search } from 'lucide-react';
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import SmartLink from '@/components/SmartLink';
import { useStore } from '@/StoreContext';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';
import { fetchWithHandling } from '@/lib/api';
import { ProgressiveImage } from '@/components/ui/ProgressiveImage';
import LoadingFallback from '@/components/LoadingFallback';

import AppCrashBoundary from '@/components/AppCrashBoundary';

function HomeInner() {
  const { user, simulatedRole, t, config = [], categories: globalCategories, fetchCategories, isLoadingCategories } = useStore();
  const navigate = useNavigate();
  const [localSearch, setLocalSearch] = React.useState('');
  const [banners, setBanners] = React.useState<any[]>([]);
  const [previewPromo, setPreviewPromo] = React.useState<any>(null);
  const [currentHeroIndex, setCurrentHeroIndex] = React.useState(0);
  
  const bannersLoaded = React.useRef(false);


  const previewPromoId = new URLSearchParams(window.location.search).get('preview_promo');
  const activeRole = simulatedRole || user?.role;
  const heroBanners = banners.filter(b => b.banner_type === 'hero' || !b.banner_type || b.banner_type === 'standard');

  React.useEffect(() => {
    if (heroBanners.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentHeroIndex((prev) => (prev + 1) % heroBanners.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [heroBanners.length]);

  React.useEffect(() => {
    const fetchHomeData = () => {
      // Trigger global categories fetch if empty
      if (!globalCategories || globalCategories.length === 0) {
        fetchCategories();
      }

      fetchWithHandling<any[]>('/api/promotions')
        .then(data => {
          if (data) {
            const activeBanners = data.filter((p: any) => p.active);
            setBanners(activeBanners);

            if (previewPromoId && !isNaN(parseInt(previewPromoId))) {
              const p = data.find((x: any) => x.id === parseInt(previewPromoId));
              if (p) setPreviewPromo(p);
            }
          }
        })
        .catch(() => {});
    };

    fetchHomeData();
  }, [previewPromoId, globalCategories.length, fetchCategories]);

  if (isLoadingCategories && globalCategories.length === 0) return <LoadingFallback message="Synchronizing categories..." fullScreen={false} />;


  const handleBannerClick = (id: number) => {
    fetchWithHandling(`/api/promotions/${id}/click`, { method: 'POST' });
  };

  return (
    <div className="bg-stone-50 min-h-screen pb-20 relative">
      {/* Aesthetic Hero Hero */}
      <section className="relative w-full bg-white overflow-hidden flex items-center min-h-[50vh] sm:min-h-[60vh]">
        {heroBanners.length > 0 ? (
          heroBanners.slice(0, 2).map((banner, index) => (
            <motion.div 
              key={banner.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: index === currentHeroIndex ? 1 : 0 }}
              transition={{ duration: 0.8 }}
              className="absolute inset-0 flex items-center"
            >
               <div className="w-full max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-center md:justify-between px-4 sm:px-6 lg:px-8 py-10 md:py-20 gap-8">
                  <div className="flex-1 space-y-4 md:space-y-6 text-center md:text-left z-10 w-full">
                    <motion.h1 
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-black text-stone-950 tracking-tighter leading-[0.95]"
                    >
                      {banner.title}
                    </motion.h1>
              <motion.p 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-sm sm:text-base lg:text-lg text-stone-600 max-w-lg font-medium leading-relaxed mx-auto md:mx-0"
              >
                {banner.description}
              </motion.p>

              {/* Integrated Search Bar */}
              <motion.div 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="relative max-w-md mx-auto md:mx-0 group"
              >
                 <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-stone-400 group-focus-within:text-emerald-500 transition-colors" size={18} />
                 <input 
                   type="text"
                   placeholder="Search for essentials..."
                   className="w-full bg-stone-50 border-2 border-stone-100 rounded-3xl py-3.5 pl-12 pr-6 font-bold text-stone-900 outline-none focus:border-emerald-500/20 focus:ring-8 focus:ring-emerald-500/5 transition-all shadow-sm group-hover:shadow-md text-sm"
                   onFocus={() => {
                     const event = new CustomEvent('open-search-overlay');
                     window.dispatchEvent(event);
                   }}
                 />
              </motion.div>

              <motion.div 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="pt-2 flex items-center justify-center md:justify-start gap-4"
              >
                <Link to={banner.link || '/products'} onClick={() => handleBannerClick(banner.id)} className="bg-emerald-500 text-white rounded-full px-8 md:px-10 py-3 md:py-4 font-bold text-base md:text-lg hover:bg-emerald-600 transition-all transform hover:scale-105 inline-flex items-center gap-2 shadow-lg shadow-emerald-500/20">
                    {banner.button_text || 'Explore'} <ArrowRight size={18} />
                </Link>
              </motion.div>
                  </div>
                  <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="flex-1 w-full md:w-auto relative rounded-[2rem] md:rounded-[3rem] overflow-hidden shadow-2xl mt-8 md:mt-0 hidden sm:block hover:scale-[1.01] transition-transform duration-300 cursor-pointer"
                  >
                     <Link to={banner.link || '/products'} onClick={() => handleBannerClick(banner.id)}>
                       <ProgressiveImage 
                         src={banner.image_url || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=800'} 
                         className="w-full h-[300px] md:h-[500px]" 
                         alt="Banner" 
                         loading="eager"
                       />
                     </Link>
                  </motion.div>
               </div>
            </motion.div>
          ))
        ) : (
          /* Default Static Hero */
          <div className="w-full flex flex-col md:flex-row items-center justify-center md:justify-between px-6 md:px-8 lg:px-24 py-16 md:py-0 gap-8">
            <div className="flex-1 space-y-6 md:space-y-8 text-center md:text-left z-10 w-full">
              <h1 className="text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-black text-stone-950 tracking-tighter leading-[0.95]">
                Fresh Daily,<br/>
                <span className="text-emerald-500">Delivered Fast.</span>
              </h1>
              <p className="text-base sm:text-lg lg:text-xl text-stone-600 max-w-lg font-medium leading-relaxed mx-auto md:mx-0">
                Choose from a curated selection of grains, spices, and daily essentials.
              </p>

              {/* Integrated Search Bar */}
              <div className="relative max-w-md mx-auto md:mx-0 group">
                 <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-stone-400 group-focus-within:text-emerald-500 transition-colors" size={18} />
                 <input 
                   type="text"
                   placeholder="Search for products..."
                   className="w-full bg-stone-50 border-2 border-stone-100 rounded-3xl py-3.5 pl-12 pr-6 font-bold text-stone-900 outline-none focus:border-emerald-500/20 focus:ring-8 focus:ring-emerald-500/5 transition-all shadow-sm group-hover:shadow-md text-sm"
                   onFocus={() => {
                     const event = new CustomEvent('open-search-overlay');
                     window.dispatchEvent(event);
                   }}
                 />
              </div>

              <div className="pt-2 flex items-center justify-center md:justify-start gap-4">
                <Link to="/products" className="bg-emerald-500 text-white rounded-full px-8 md:px-10 py-3 md:py-4 font-bold text-base md:text-lg hover:bg-emerald-600 transition-all transform hover:scale-105 inline-flex items-center gap-2 shadow-lg shadow-emerald-500/20">
                    Start Shopping <ArrowRight size={18} />
                </Link>
              </div>
            </div>
            <div className="flex-1 w-full md:w-auto relative rounded-[2rem] md:rounded-[3rem] overflow-hidden shadow-2xl mt-8 md:mt-0 hidden sm:block">
               <ProgressiveImage 
                 src="https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=800" 
                 className="w-full h-[300px] md:h-[500px]" 
                 alt="Fresh Groceries" 
                 loading="eager"
               />
            </div>
         </div>
        )}
      </section>

      {/* Quick Utilities Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 md:mt-4 relative z-30">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <motion.div 
            whileHover={{ y: -5 }}
            className="bg-white p-6 rounded-[2.5rem] shadow-xl shadow-stone-200/50 border border-stone-100 flex items-center gap-6 group"
          >
            <div className="w-16 h-16 bg-emerald-50 rounded-[1.5rem] flex items-center justify-center text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-all duration-500">
               <Search size={28} />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-black text-stone-900 leading-tight">Fast Product Search</h3>
              <p className="text-stone-500 text-sm font-medium">Find your daily essentials in seconds.</p>
              <button 
                onClick={() => {
                  const event = new CustomEvent('open-search-overlay');
                  window.dispatchEvent(event);
                }}
                className="mt-2 text-emerald-600 text-xs font-black uppercase tracking-widest hover:underline"
              >
                Open Search
              </button>
            </div>
          </motion.div>

          <motion.div 
            whileHover={{ y: -5 }}
            className="bg-stone-900 p-6 rounded-[2.5rem] shadow-xl shadow-stone-900/10 border border-stone-800 flex items-center gap-6 group"
          >
            <div className="w-16 h-16 bg-stone-800 rounded-[1.5rem] flex items-center justify-center text-emerald-400 group-hover:bg-emerald-500 group-hover:text-white transition-all duration-500">
               <Clock size={28} />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-black text-white leading-tight">Track Your Order</h3>
              <p className="text-stone-400 text-sm font-medium">Real-time status of your deliveries.</p>
              <Link to="/track-order" className="mt-2 inline-block text-emerald-400 text-xs font-black uppercase tracking-widest hover:underline">
                Track Now
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Categories Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex justify-between items-center mb-10">
          <h2 className="text-3xl font-black text-stone-950 tracking-tight">Shop by Category</h2>
          <Link to="/products" className="text-emerald-600 font-bold hover:text-emerald-800 flex items-center gap-1">
            Browse All <ArrowRight size={16} />
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {isLoadingCategories ? (
            [...Array(4)].map((_, i) => <div key={i} className="h-48 rounded-3xl bg-stone-100 animate-pulse" />)
          ) : globalCategories.length > 0 ? (
            globalCategories.slice(0, 4).map((cat: any, i: number) => (
              <Link 
                key={i}
                to={`/products?category=${encodeURIComponent(cat.name)}`}
                className="group relative h-64 rounded-3xl overflow-hidden block shadow-sm hover:shadow-lg transition-shadow duration-300"
              >
                <img 
                  src={cat.image_url && cat.image_url.trim() !== '' ? cat.image_url : `https://picsum.photos/seed/${encodeURIComponent(cat.name)}/400/300`} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  alt={cat.name}
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-stone-950/70 to-transparent p-6 flex flex-col justify-end">
                  <h3 className="text-white text-xl font-bold">{cat.name}</h3>
                </div>
              </Link>
            ))
          ) : null}
        </div>
      </section>

      {/* Features/Highlights */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-white p-8 rounded-3xl border border-stone-100 shadow-sm">
          {[
            { icon: <ShieldCheck />, title: 'Quality Assured', desc: 'Handpicked, quality checked.' },
            { icon: <Truck />, title: 'Fast Delivery', desc: 'Rapid local fulfillment.' },
            { icon: <Clock />, title: '24/7 Support', desc: 'Always here to help.' }
          ].map((feature, i) => (
            <div key={i} className="flex flex-col items-center text-center p-4">
              <div className="text-emerald-600 mb-4 p-3 rounded-full bg-emerald-50">
                {React.cloneElement(feature.icon, { size: 28 })}
              </div>
              <h3 className="font-bold mb-1 text-stone-950">{feature.title}</h3>
              <p className="text-stone-600 text-sm">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export default function Home() {
  return <HomeInner />;
}
