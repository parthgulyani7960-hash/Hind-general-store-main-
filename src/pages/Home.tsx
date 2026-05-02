import { motion } from 'motion/react';
import { ArrowRight, ShieldCheck, Truck, Clock, PhoneCall, ShoppingBag } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useStore } from '../StoreContext';
import toast from 'react-hot-toast';
import { cn } from '../lib/utils';

export default function Home() {
  const { user, simulatedRole, t } = useStore();
  const activeRole = simulatedRole || user?.role;

  return (
    <div className="space-y-20 pb-20">
      {/* Hero Section */}
      <section className="relative h-[80vh] flex items-center overflow-hidden">
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

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
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
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-primary leading-[1.1] md:leading-tight">
              {activeRole === 'wholesaler' ? (
                <>{t('wholesale_portal')} <br /> <span className="text-accent">{t('bulk_supply')}</span></>
              ) : activeRole === 'retailer' ? (
                <>{t('retail_portal')} <br /> <span className="text-stone-400">{t('grow_business')}</span></>
              ) : (
                <>Premium Quality <br /> <span className="text-accent">General Essentials</span></>
              )}
            </h1>
            <p className="text-xl text-stone-600">
              {activeRole === 'wholesaler' 
                ? "Exclusive B2B access to bulk inventory at distributor rates. Direct supply for your warehouse."
                : activeRole === 'retailer'
                ? "Preferred pricing for retail stores. Restock your shelves with quality karyana at partner rates."
                : "Hind General Store brings you the finest quality karyana items, grains, spices, and daily essentials at the best prices."
              }
            </p>
            <div className="flex flex-wrap gap-4">
              <Link to="/products" className="btn-primary w-full md:w-auto text-lg px-8 py-4 flex items-center justify-center space-x-2">
                <span>{t('all_products')}</span>
                <ArrowRight size={20} />
              </Link>
              <Link to="/support" className="bg-white w-full md:w-auto justify-center text-stone-800 border border-stone-200 px-8 py-4 rounded-xl font-medium hover:bg-stone-50 transition-all flex items-center space-x-2">
                <PhoneCall size={20} />
                <span>Contact Support</span>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { icon: <ShieldCheck className="text-primary" size={32} />, title: 'Quality Assured', desc: 'Every product is handpicked and checked for quality.' },
            { icon: <Truck className="text-primary" size={32} />, title: 'Fast Delivery', desc: 'Get your orders delivered within 2 hours in local areas.' },
            { icon: <Clock className="text-primary" size={32} />, title: '24/7 Support', desc: 'Our team is always here to help you with your needs.' }
          ].map((feature, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              viewport={{ once: true }}
              className="bg-white p-8 rounded-2xl shadow-sm border border-stone-100 hover:shadow-md transition-all"
            >
              <div className="mb-4">{feature.icon}</div>
              <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
              <p className="text-stone-500">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Categories Preview */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 md:space-y-8">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-3">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-stone-900">Popular Categories</h2>
            <p className="text-sm md:text-base text-stone-500 mt-1 md:mt-0">Explore our wide range of products</p>
          </div>
          <Link to="/products" className="text-primary font-bold hover:underline inline-flex items-center">View All <ArrowRight size={16} className="ml-1" /></Link>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
          {['Grocery', 'Oils', 'Dairy', 'Personal Care'].map((cat, i) => (
            <Link 
              key={i}
              to={`/products?category=${encodeURIComponent(cat)}`}
              className="relative h-36 md:h-48 rounded-2xl overflow-hidden group block"
            >
              <img 
                src={`https://picsum.photos/seed/${cat}/400/300`} 
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                alt={cat}
                loading="lazy"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                <h3 className="text-white text-2xl font-bold">{cat}</h3>
              </div>
            </Link>
          ))}
        </div>
      </section>
      {/* Download App Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-primary rounded-[2rem] p-8 md:p-16 overflow-hidden relative flex flex-col md:flex-row items-center justify-between gap-12">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-accent/20 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl" />
          
          <div className="relative z-10 max-w-xl space-y-6 text-white">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="inline-block px-4 py-1.5 bg-white/20 backdrop-blur-md rounded-full text-xs font-bold uppercase tracking-widest"
            >
              Mobile Experience
            </motion.div>
            <h2 className="text-4xl md:text-5xl font-bold leading-tight">
              Get the Hind Store App <br />
              <span className="text-accent">on Your Android Device</span>
            </h2>
            <p className="text-lg text-white/80">
              Experience faster shopping, real-time order tracking, and exclusive app-only discounts. Install our PWA for a native app-like experience.
            </p>
            <div className="flex flex-wrap gap-4 pt-4">
              <button 
                onClick={() => {
                  toast.success('To install: Tap the 3 dots in Chrome and select "Install App" or "Add to Home Screen"');
                }}
                className="bg-white text-primary px-8 py-4 rounded-2xl font-bold flex items-center space-x-3 hover:bg-stone-50 transition-all shadow-xl"
              >
                <img src="https://upload.wikimedia.org/wikipedia/commons/d/d7/Android_robot.svg" className="w-6 h-6" alt="Android" />
                <span>Install for Android</span>
              </button>
            </div>
          </div>

          <motion.div 
            initial={{ opacity: 0, x: 50, rotate: 10 }}
            whileInView={{ opacity: 1, x: 0, rotate: -5 }}
            viewport={{ once: true }}
            className="relative z-10 hidden md:block"
          >
            <div className="w-64 h-[500px] bg-stone-900 rounded-[3rem] border-8 border-stone-800 shadow-2xl overflow-hidden relative">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-stone-800 rounded-b-2xl z-20" />
              <img 
                src="https://picsum.photos/seed/app-preview/400/800" 
                className="w-full h-full object-cover opacity-80"
                alt="App Preview"
                loading="lazy"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-stone-900 via-transparent to-transparent" />
              <div className="absolute bottom-8 left-0 right-0 px-6 text-center">
                <div className="w-12 h-12 bg-primary rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-lg">
                  <ShoppingBag className="text-white" size={24} />
                </div>
                <p className="text-white font-bold text-sm">Hind General Store</p>
                <p className="text-white/40 text-[10px]">v1.0.0</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
