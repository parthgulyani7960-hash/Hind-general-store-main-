import { motion } from 'motion/react';
import { ArrowRight, ShieldCheck, Truck, Clock, PhoneCall, ShoppingBag, Eye, X } from 'lucide-react';
import React from 'react';
import { Link } from 'react-router-dom';
import SmartLink from '../components/SmartLink';
import { useStore } from '../StoreContext';
import toast from 'react-hot-toast';
import { cn } from '../lib/utils';

import ErrorBoundary from '../components/ErrorBoundary';

function HomeInner() {
  const { user, simulatedRole, t, config } = useStore();
  const activeRole = simulatedRole || user?.role;
  const [categories, setCategories] = React.useState<any[]>([]);
  const [loadingCats, setLoadingCats] = React.useState(true);
  const [banners, setBanners] = React.useState<any[]>([]);
  
  const previewPromoId = new URLSearchParams(window.location.search).get('preview_promo');
  const [previewPromo, setPreviewPromo] = React.useState<any>(null);

  const bannersLoaded = React.useRef(false);

  React.useEffect(() => {
    const fetchHomeData = () => {
      fetch('/api/categories')
        .then(res => res.json())
        .then(data => {
          setCategories(data);
          setLoadingCats(false);
        })
        .catch(() => setLoadingCats(false));

      fetch('/api/promotions')
        .then(res => res.json())
        .then(data => {
          const activeBanners = data.filter((p: any) => p.active);
          setBanners(activeBanners);

          if (!bannersLoaded.current) {
            activeBanners.forEach((b: any) => {
              fetch(`/api/promotions/${b.id}/view`, { method: 'POST' }).catch(() => {});
            });
            bannersLoaded.current = true;
          }

          if (previewPromoId) {
            const p = data.find((x: any) => x.id === parseInt(previewPromoId));
            if (p) setPreviewPromo(p);
          }
        });
    };

    fetchHomeData();
    const interval = setInterval(fetchHomeData, 60000);
    return () => clearInterval(interval);
  }, [previewPromoId]);

  const handleBannerClick = (id: number) => {
    fetch(`/api/promotions/${id}/click`, { method: 'POST' }).catch(() => {});
  };

  const heroBanners = banners.filter(b => b.banner_type === 'hero' || !b.banner_type || b.banner_type === 'standard');

  return (
    <div className="space-y-20 pb-safe md:pb-20">
      {/* Hero Section */}
      <section className="relative min-h-[80vh] flex items-center overflow-hidden py-20 pb-0">
        <div className="absolute inset-0 z-0 bg-stone-50 overflow-hidden">
          <div className="absolute inset-0 z-0">
             <img 
              src="https://picsum.photos/seed/grocery/1920/1080?blur=2" 
               className="w-full h-full object-cover opacity-20"
               alt="Hero background"
               loading="lazy"
               referrerPolicy="no-referrer"
             />
             <div className="absolute inset-0 bg-gradient-to-r from-stone-50 via-stone-50/80 to-transparent" />
          </div>
        </div>

        {/* Promo Preview Logic */}
        {previewPromoId && (
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-[100] bg-stone-900 text-white px-6 py-2 rounded-full font-bold text-sm shadow-xl items-center space-x-2 flex">
            <Eye size={16} className="text-secondary" />
            <span>Admin Preview Mode Active</span>
            <button 
              onClick={() => {
                const url = new URL(window.location.href);
                url.searchParams.delete('preview_promo');
                window.history.replaceState({}, '', url);
                window.location.reload();
              }}
              className="ml-4 bg-white/20 hover:bg-white/40 p-1 rounded-full transition-colors"
            >
              <X size={14} />
            </button>
          </div>
        )}

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-2xl space-y-6"
          >
            {user && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="flex items-center space-x-3"
              >
                <div className={cn(
                  "px-4 py-1.5 rounded-xl text-white font-black uppercase text-[9px] tracking-[0.2em] shadow-lg flex items-center space-x-2",
                  activeRole === 'wholesaler' ? "bg-accent" : 
                  activeRole === 'retailer' ? "bg-secondary" : 
                  activeRole === 'admin' ? "bg-primary border border-white/20" : "bg-stone-500"
                )}>
                  <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                  <span>{activeRole === 'wholesaler' ? t('wholesale_portal') : activeRole === 'retailer' ? t('retail_portal') : 'Verified Account'}</span>
                </div>
                <p className="text-primary font-bold uppercase tracking-widest text-sm">
                  {t('welcome')}, {user.name}! 👋
                </p>
              </motion.div>
            )}
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-primary leading-[1.1] md:leading-tight">
              {activeRole === 'wholesaler' ? (
                <>{t('wholesale_portal')} <br /> <span className="text-accent">{t('bulk_supply')}</span></>
              ) : activeRole === 'retailer' ? (
                <>{t('retail_portal')} <br /> <span className="text-stone-400">{t('grow_business')}</span></>
              ) : (
                <>Premium Quality <br /> <span className="text-accent">General Essentials</span></>
              )}
            </h1>
            <p className="text-lg md:text-xl text-stone-600">
              {activeRole === 'wholesaler' 
                ? "Exclusive B2B access to bulk inventory at distributor rates. Direct supply for your warehouse."
                : activeRole === 'retailer'
                ? "Preferred pricing for retail stores. Restock your shelves with quality karyana at partner rates."
                : `${config.find(c => c.key === 'store_name')?.value || 'Hind General Store'} brings you the finest quality karyana items, grains, spices, and daily essentials at the best prices.`
              }
            </p>
            <div className="flex flex-wrap gap-4 mt-8">
              <Link to="/products" className="btn-primary w-full md:w-auto flex items-center justify-center space-x-2">
                <span>{t('all_products')}</span>
                <ArrowRight size={18} />
              </Link>
              <Link to="/support" className="btn-outline w-full md:w-auto items-center justify-center flex space-x-2">
                <PhoneCall size={18} />
                <span>Contact Support</span>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Render Banners */}
      {previewPromo ? (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 pt-6 mt-6">
          <div className={`relative w-full overflow-hidden rounded-3xl shadow-xl h-[300px] md:h-[400px] ${!previewPromo.image_url ? 'bg-gradient-to-r from-primary to-blue-600' : ''}`}>
            {previewPromo.image_url && <img src={previewPromo.image_url} className="w-full h-full object-cover" alt="" />}
            <div className={`absolute inset-0 p-8 md:p-12 flex flex-col justify-center ${previewPromo.image_url ? 'bg-gradient-to-r from-black/60 to-transparent' : ''}`}>
              <h1 className="text-3xl md:text-5xl font-black text-white mb-4">{previewPromo.title}</h1>
              <p className="text-lg md:text-2xl text-stone-200">{previewPromo.description}</p>
              <SmartLink to={previewPromo.link || '/products'} className="mt-6 bg-white text-black px-6 py-3 rounded-xl font-bold w-fit uppercase tracking-widest text-xs md:text-sm hover:scale-105 transition-transform">
                Explore Deals
              </SmartLink>
            </div>
            {!previewPromo.active && (
              <div className="absolute top-4 right-4 bg-red-500 text-white px-3 py-1.5 rounded-lg font-bold uppercase tracking-widest text-[10px] md:text-xs animate-pulse">
                Inactive
              </div>
            )}
          </div>
        </div>
      ) : heroBanners.length > 0 ? (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full pt-6 mt-6 grid grid-cols-1 gap-4">
           <motion.div 
             initial={{ opacity: 0, y: 30 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ duration: 0.6 }}
             onClick={() => handleBannerClick(heroBanners[0].id)}
             className={`w-full h-[300px] md:h-[400px] rounded-3xl overflow-hidden drop-shadow-xl relative shadow-stone-900/10 group cursor-pointer ${!heroBanners[0].image_url ? 'bg-gradient-to-br from-primary to-blue-600' : ''}`}
           >
              {heroBanners[0].image_url && <img src={heroBanners[0].image_url} className="w-full h-full object-cover transition-transform duration-[2s] group-hover:scale-105" alt="Promotion" />}
              <div className={`absolute inset-0 p-6 md:p-12 flex flex-col justify-end ${heroBanners[0].image_url ? 'bg-gradient-to-t from-stone-900 via-stone-900/40 to-transparent' : ''}`}>
                <motion.h1 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-2xl md:text-5xl font-black text-white mb-2 md:mb-4 leading-tight tracking-tight max-w-3xl"
                >
                  {heroBanners[0].title}
                </motion.h1>
                <motion.p 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-base md:text-xl text-stone-200 max-w-2xl font-light mb-6 md:mb-8"
                >
                  {heroBanners[0].description}
                </motion.p>
                {heroBanners[0].link && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                  >
                    <SmartLink onClick={() => handleBannerClick(heroBanners[0].id)} to={heroBanners[0].link || '/products'} className="inline-flex items-center space-x-2 bg-white text-stone-900 px-6 py-3 md:px-8 md:py-4 rounded-full font-bold uppercase tracking-widest text-xs hover:scale-105 transition-transform">
                      <span>Explore Deal</span>
                      <ArrowRight size={16} />
                    </SmartLink>
                  </motion.div>
                )}
              </div>
           </motion.div>
           {heroBanners.length > 1 && (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {heroBanners.slice(1, 4).map((promo, idx) => (
                  <motion.div 
                    key={idx}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 + idx * 0.1 }}
                    onClick={() => handleBannerClick(promo.id)}
                    className={`h-[200px] md:h-[220px] rounded-3xl overflow-hidden drop-shadow-md relative group shadow-stone-900/10 cursor-pointer ${!promo.image_url ? 'bg-gradient-to-br from-indigo-500 to-primary' : ''}`}
                  >
                    {promo.image_url && <img src={promo.image_url} className="w-full h-full object-cover transition-transform duration-[2s] group-hover:scale-105" alt="Promotion" />}
                    <div className={`absolute inset-0 p-6 flex flex-col justify-end ${promo.image_url ? 'bg-gradient-to-t from-stone-900 via-stone-900/40 to-transparent' : ''}`}>
                      <h3 className="text-xl md:text-2xl font-black text-white mb-2">{promo.title}</h3>
                      <p className="text-stone-300 text-sm line-clamp-2 mb-3">{promo.description}</p>
                      {promo.link && (
                        <SmartLink onClick={(e: any) => { e.stopPropagation(); handleBannerClick(promo.id); }} to={promo.link || '/products'} className="inline-flex items-center space-x-1 text-white font-bold tracking-wider text-[10px] uppercase hover:underline z-20 relative">
                          <span>View Promos</span>
                          <ArrowRight size={14} />
                        </SmartLink>
                      )}
                    </div>
                  </motion.div>
                ))}
             </div>
           )}
        </div>
      ) : null}

      {/* Role-Specific Isolation Sections */}
      {activeRole === 'wholesaler' && (
        <section className="bg-primary py-20 relative overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 flex flex-col md:flex-row items-center justify-between gap-12">
            <div className="max-w-2xl space-y-6">
              <span className="text-accent font-black uppercase tracking-widest text-xs">Wholesale Distribution Only</span>
              <h2 className="text-4xl font-bold text-white leading-tight">Bulk Inventory Management & Distributor Pricing</h2>
              <p className="text-stone-300 text-lg">
                As a Wholesaler, you have isolated access to our bulk logistics. View case-lot pricing and manage large-scale replenishment directly.
              </p>
              <div className="flex space-x-4">
                <Link to="/products" className="bg-accent text-white px-8 py-4 rounded-xl font-bold hover:bg-opacity-90 shadow-xl transition-all">
                  Request Case-Lot Quote
                </Link>
              </div>
            </div>
            <div className="bg-white/5 backdrop-blur-xl p-8 rounded-[2rem] border border-white/10 w-full md:w-80">
              <p className="text-accent font-bold text-sm mb-4">Your Average Savings</p>
              <p className="text-white text-5xl font-black mb-2">32%</p>
              <p className="text-stone-400 text-xs uppercase tracking-widest font-black">Below Retail MRP</p>
            </div>
          </div>
          <div className="absolute top-0 right-0 w-96 h-96 bg-accent/10 rounded-full blur-[100px]" />
        </section>
      )}

      {activeRole === 'retailer' && (
        <section className="bg-secondary py-20 relative overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 flex flex-col md:flex-row items-center justify-between gap-12">
            <div className="max-w-2xl space-y-6">
              <span className="text-accent font-black uppercase tracking-widest text-xs">Retail Partner Dashboard</span>
              <h2 className="text-4xl font-bold text-white leading-tight">Enhance Your Store's Margin with Partner Pricing</h2>
              <p className="text-stone-300 text-lg">
                Dedicated support for retail shop owners. Access exclusive partner discounts and priority restocking schedules.
              </p>
              <div className="flex space-x-4">
                <Link to="/products" className="bg-white text-primary px-8 py-4 rounded-xl font-bold hover:bg-stone-50 transition-all shadow-xl">
                  Browse Partner Deals
                </Link>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 w-full md:w-auto">
              {['Priority Delivery', 'Net-30 Billing', 'Inventory Sync', 'Returns Policy'].map((perk, i) => (
                <div key={i} className="bg-white/5 backdrop-blur-md p-4 rounded-2xl border border-white/10 text-center">
                  <p className="text-accent font-bold text-xs">{perk}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/5 rounded-full blur-[100px]" />
        </section>
      )}

      {/* Features */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          variants={{
            hidden: { opacity: 0 },
            visible: { opacity: 1, transition: { staggerChildren: 0.15 } }
          }}
          className="grid grid-cols-1 md:grid-cols-3 gap-8"
        >
          {[
            { icon: <ShieldCheck className="text-primary" size={32} />, title: 'Quality Assured', desc: 'Every product is handpicked and checked for quality.' },
            { icon: <Truck className="text-primary" size={32} />, title: 'Fast Delivery', desc: 'Get your orders delivered within 2 hours in local areas.' },
            { icon: <Clock className="text-primary" size={32} />, title: '24/7 Support', desc: 'Our team is always here to help you with your needs.' }
          ].map((feature, i) => (
            <motion.div 
              key={i}
              variants={{
                hidden: { opacity: 0, y: 30, scale: 0.95 },
                visible: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', damping: 20 } }
              }}
              whileHover={{ y: -8, transition: { duration: 0.2 } }}
              className="bg-white p-8 md:p-12 rounded-3xl shadow-sm border border-stone-100 hover:shadow-xl hover:border-primary/20 transition-all duration-300 relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500 ease-out" />
              <div className="mb-6 relative z-10 w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors duration-300 text-primary">
                {React.cloneElement(feature.icon, { className: "currentColor" })}
              </div>
              <h3 className="text-2xl md:text-3xl font-bold mb-4 relative z-10">{feature.title}</h3>
              <p className="text-lg text-stone-600 relative z-10 leading-relaxed">{feature.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Categories Preview */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 md:space-y-8 mt-12 mb-12">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-3"
        >
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-stone-900">Popular Categories</h2>
            <p className="text-sm md:text-base text-stone-500 mt-1 md:mt-0">Explore our wide range of products</p>
          </div>
          <Link to="/products" className="text-primary font-bold hover:underline inline-flex items-center">View All <ArrowRight size={16} className="ml-1" /></Link>
        </motion.div>

        <motion.div 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          variants={{
            hidden: { opacity: 0 },
            visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
          }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6"
        >
          {loadingCats ? (
            [...Array(4)].map((_, i) => (
              <div key={i} className="h-36 md:h-48 rounded-2xl bg-stone-100 animate-pulse" />
            ))
          ) : categories.length > 0 ? (
            categories.slice(0, 4).map((cat, i) => (
              <motion.div
                key={i}
                variants={{
                  hidden: { opacity: 0, scale: 0.9, y: 20 },
                  visible: { opacity: 1, scale: 1, y: 0, transition: { type: 'spring', damping: 20 } }
                }}
              >
                <Link 
                  to={`/products?category=${encodeURIComponent(cat.name)}`}
                  className="relative h-36 md:h-48 rounded-2xl overflow-hidden group block shadow-md hover:shadow-xl transition-shadow duration-300"
                >
                  <img 
                    src={cat.image_url || `https://picsum.photos/seed/${cat.name}/400/300`} 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                    alt={cat.name}
                    loading="lazy"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-stone-900/80 via-stone-900/20 to-transparent flex items-end p-4 md:p-6 opacity-80 group-hover:opacity-100 transition-opacity duration-300">
                    <motion.div
                      initial={{ y: 10, opacity: 0 }}
                      whileInView={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.2 + (i * 0.1) }}
                    >
                      <h3 className="text-white text-lg md:text-xl lg:text-2xl font-black shadow-black drop-shadow-md">{cat.name}</h3>
                      <p className="text-white/80 text-[8px] md:text-[10px] font-bold uppercase tracking-widest mt-1">Explore Collection</p>
                    </motion.div>
                  </div>
                </Link>
              </motion.div>
            ))
          ) : (
            ['Grocery', 'Oils', 'Dairy', 'Personal Care'].map((name, i) => (
              <div key={i} className="h-36 md:h-48 rounded-2xl bg-stone-50 border border-stone-100 flex items-center justify-center">
                 <span className="text-stone-300 font-bold">{name}</span>
              </div>
            ))
          )}
        </motion.div>
      </section>
      {/* Download App Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-20">
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
          className="bg-primary rounded-[3rem] p-8 md:p-16 overflow-hidden relative flex flex-col md:flex-row items-center justify-between gap-12 shadow-2xl shadow-primary/20"
        >
          <motion.div 
            animate={{ 
              rotate: [0, 360],
              scale: [1, 1.2, 1] 
            }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl pointer-events-none" 
          />
          <motion.div 
            animate={{ 
              rotate: [360, 0],
              scale: [1, 1.5, 1] 
            }}
            transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
            className="absolute bottom-0 left-0 w-80 h-80 bg-accent/20 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl pointer-events-none" 
          />
          
          <div className="relative z-10 max-w-xl space-y-6 text-white">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="inline-block px-4 py-1.5 bg-white/20 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-widest border border-white/10 shadow-sm"
            >
              Mobile Experience
            </motion.div>
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="text-4xl md:text-5xl font-black leading-[1.1]"
            >
              Get the General Store Karyana Shop App <br />
              <span className="text-secondary drop-shadow-sm">on Your Device</span>
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
              className="text-lg text-white/90 font-medium"
            >
              Experience faster shopping, real-time order tracking, and exclusive app-only discounts. Install our PWA for a native app-like experience.
            </motion.p>
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.5 }}
              className="flex flex-wrap gap-4 pt-4"
            >
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  toast.success('To install: Tap the 3 dots in Chrome and select "Install App" or "Add to Home Screen"');
                }}
                className="bg-white text-primary px-8 py-4 rounded-2xl font-black flex items-center space-x-3 hover:bg-stone-50 transition-all shadow-xl text-sm tracking-wide uppercase"
              >
                <img src="https://upload.wikimedia.org/wikipedia/commons/d/d7/Android_robot.svg" className="w-5 h-5" alt="Android" />
                <span>Install App</span>
              </motion.button>
            </motion.div>
          </div>

          <motion.div 
            initial={{ opacity: 0, x: 50, rotate: 10, scale: 0.8 }}
            whileInView={{ opacity: 1, x: 0, rotate: -6, scale: 1 }}
            whileHover={{ rotate: 0, scale: 1.05, transition: { duration: 0.4 } }}
            viewport={{ once: true }}
            transition={{ type: "spring", damping: 15 }}
            className="relative z-10 hidden md:block group cursor-pointer"
          >
            <div className="w-64 h-[500px] bg-stone-900 rounded-[3rem] border-8 border-stone-800 shadow-2xl shadow-black/50 overflow-hidden relative group-hover:border-stone-700 transition-colors duration-300">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-6 bg-stone-800 rounded-b-xl z-20 transition-colors duration-300 group-hover:bg-stone-700" />
              <img 
                src="https://picsum.photos/seed/app-preview/400/800" 
                className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-500"
                alt="App Preview"
                loading="lazy"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-stone-900 via-stone-900/20 to-transparent flex flex-col justify-end px-6 pb-10">
                <motion.div 
                  initial={{ y: 20, opacity: 0 }}
                  whileInView={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.8 }}
                  className="w-12 h-12 bg-primary rounded-2xl mb-4 flex items-center justify-center shadow-lg border border-white/10 backdrop-blur-sm mx-auto"
                >
                  <ShoppingBag className="text-white" size={20} />
                </motion.div>
                <motion.p 
                  initial={{ y: 20, opacity: 0 }}
                  whileInView={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.9 }}
                  className="text-white font-black text-sm text-center tracking-wide shadow-black drop-shadow-md"
                >
                  {config.find(c => c.key === 'store_name')?.value || 'Hind General Store'}
                </motion.p>
                <motion.p 
                  initial={{ y: 20, opacity: 0 }}
                  whileInView={{ y: 0, opacity: 1 }}
                  transition={{ delay: 1.0 }}
                  className="text-white/40 text-[10px] text-center font-bold tracking-widest uppercase mt-1"
                >
                  v1.0.0
                </motion.p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </section>
    </div>
  );
}

export default function Home() {
  return (
    <ErrorBoundary>
      <HomeInner />
    </ErrorBoundary>
  );
}
