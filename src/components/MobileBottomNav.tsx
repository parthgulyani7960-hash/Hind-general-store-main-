import { motion, AnimatePresence } from 'motion/react';
import { Home, ShoppingBag, ShoppingCart, User, Heart, Check } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useStore } from '../StoreContext';
import { cn } from '../types';

export default function MobileBottomNav() {
  const location = useLocation();
  const { cart, wishlist, lastAddedId } = useStore();
  
  const navItems = [
    { icon: Home, label: 'Home', path: '/' },
    { icon: ShoppingBag, label: 'Shop', path: '/products' },
    { icon: ShoppingCart, label: 'Cart', path: '/cart', badge: cart.length, highlight: !!lastAddedId },
    { icon: Heart, label: 'Saved', path: '/wishlist', badge: wishlist.length },
    { icon: User, label: 'Profile', path: '/profile' }
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 px-4 pb-safe pt-2 pointer-events-none mb-4">
      <motion.div 
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        className="bg-white/95 backdrop-blur-2xl border border-stone-200/50 shadow-[0_-8px_40px_rgb(0,0,0,0.12)] rounded-3xl py-3 px-4 flex items-center justify-around pointer-events-auto max-w-lg mx-auto"
      >
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link 
              key={item.path} 
              to={item.path}
              className="relative flex flex-col items-center justify-center p-3 group outline-none"
            >
              <motion.div 
                animate={item.highlight ? { 
                  scale: [1, 1.3, 1],
                  rotate: [0, -10, 10, 0]
                } : {}}
                className={cn(
                  "p-2.5 rounded-2xl transition-all duration-300 relative",
                  isActive ? "bg-primary text-white scale-110 shadow-lg shadow-primary/30" : "text-stone-400 group-active:scale-90",
                  item.highlight && !isActive && "text-primary"
                )}
              >
                {item.highlight && !isActive ? <Check size={20} strokeWidth={3} /> : <item.icon size={20} strokeWidth={isActive ? 2.5 : 2} />}
                
                <AnimatePresence>
                  {item.badge !== undefined && item.badge > 0 && (
                    <motion.span 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      key={item.badge}
                      className="absolute -top-1 -right-1 bg-accent text-white text-[9px] font-black w-4.5 h-4.5 rounded-full flex items-center justify-center border-2 border-white shadow-sm"
                    >
                      {item.badge}
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.div>
              
              {isActive && (
                <motion.div 
                  layoutId="bottomNavDot"
                  className="absolute -bottom-1.5 w-1 h-1 bg-primary rounded-full shadow-sm shadow-primary/50"
                />
              )}

              <span className={cn(
                "text-[9px] font-black uppercase tracking-[0.1em] mt-1.5 transition-all",
                isActive ? "text-primary opacity-100" : "text-stone-400 opacity-0 translate-y-2"
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
