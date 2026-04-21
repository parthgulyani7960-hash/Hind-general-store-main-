import { motion } from 'motion/react';
import { ArrowRight, ShieldCheck, Truck, Clock, PhoneCall, ShoppingBag } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useStore } from '../StoreContext';
import toast from 'react-hot-toast';

export default function Home() {
  const { user } = useStore();

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
              <motion.p 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-primary font-bold uppercase tracking-widest text-sm"
              >
                Welcome back, {user.name}! 👋
              </motion.p>
            )}
            <h1 className="text-6xl font-bold text-primary leading-tight">
              Fresh Groceries <br />
              <span className="text-accent">Delivered to Your Door</span>
            </h1>
            <p className="text-xl text-stone-600">
              Hind General Store brings you the finest quality karyana items, grains, spices, and daily essentials at the best prices.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link to="/products" className="btn-primary text-lg px-8 py-4 flex items-center space-x-2">
                <span>Shop Now</span>
                <ArrowRight size={20} />
              </Link>
              <Link to="/support" className="bg-white text-stone-800 border border-stone-200 px-8 py-4 rounded-xl font-medium hover:bg-stone-50 transition-all flex items-center space-x-2">
                <PhoneCall size={20} />
                <span>Contact Support</span>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

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
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex justify-between items-end">
          <div>
            <h2 className="text-3xl font-bold text-stone-900">Popular Categories</h2>
            <p className="text-stone-500">Explore our wide range of products</p>
          </div>
          <Link to="/products" className="text-primary font-medium hover:underline">View All</Link>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {['Grains', 'Oils', 'Pulses', 'Essentials'].map((cat, i) => (
            <motion.div 
              key={i}
              whileHover={{ scale: 1.02 }}
              className="relative h-48 rounded-2xl overflow-hidden group cursor-pointer"
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
            </motion.div>
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
