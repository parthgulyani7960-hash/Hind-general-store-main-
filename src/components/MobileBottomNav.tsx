import { motion, AnimatePresence } from 'motion/react';
import { Home, ShoppingBag, ShoppingCart, User, Heart, Check } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useStore } from '../StoreContext';
import { cn } from '../types';

export default function MobileBottomNav() {
  const location = useLocation();
  const { cart, wishlist, lastAddedId } = useStore();
  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  const navItems = [
    { icon: Home, label: 'Home', path: '/' },
    { icon: ShoppingBag, label: 'Shop', path: '/products' },
    { icon: ShoppingCart, label: 'Cart', path: '/cart', badge: cartCount, highlight: !!lastAddedId },
    { icon: Heart, label: 'Saved', path: '/wishlist', badge: wishlist.length },
    { icon: User, label: 'Profile', path: '/profile' }
  ];

  return (
    <div className="md:hidden fixed bottom-4 left-4 right-4 z-50 pointer-events-none">
      <motion.div 
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-white/90 backdrop-blur-xl border border-stone-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.06)] rounded-[2rem] py-2 px-2 flex items-center justify-around pointer-events-auto max-w-lg mx-auto"
      >
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link 
              key={item.path} 
              to={item.path}
              className="relative flex flex-col items-center justify-center p-2 group outline-none"
            >
              <motion.div 
                animate={item.highlight ? { 
                  scale: [1, 1.2, 1],
                } : {}}
                className={cn(
                  "p-2.5 rounded-2xl transition-all duration-300 relative",
                  isActive ? "bg-stone-900 text-white" : "text-stone-400 group-hover:text-stone-600",
                  item.highlight && !isActive && "text-primary"
                )}
              >
                {item.highlight && !isActive ? <Check size={20} strokeWidth={2.5} /> : <item.icon size={20} strokeWidth={isActive ? 2.5 : 2} />}
                
                <AnimatePresence>
                  {item.badge !== undefined && item.badge > 0 && (
                    <motion.span 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      key={item.badge}
                      className="absolute -top-0.5 -right-0.5 bg-primary text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center border-2 border-white shadow-sm"
                    >
                      {item.badge}
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.div>
              
              <span className={cn(
                "text-[9px] font-bold uppercase tracking-[0.05em] mt-1 transition-all",
                isActive ? "text-stone-900 opacity-100" : "text-stone-400 opacity-0 -translate-y-1"
              )}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </motion.div>
    </div>
  );
}
