import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Home, ShoppingBag, ShoppingCart, User, Heart } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useStore } from '@/StoreContext';
import { triggerFeedback } from '@/lib/feedback';
import { cn } from '@/lib/utils';

export default function MobileBottomNav() {
  const location = useLocation();
  const { cart, wishlist, lastAddedId } = useStore();
  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Detect if keyboard is visible using Visual Viewport API if available
    // Fallback to window resize for older browsers
    const handleViewportChange = () => {
      if (window.visualViewport) {
        // If the viewport height is significantly less than the window innerHeight, 
        // it means something (usually the keyboard) is taking up space.
        const isKeyboardOpen = window.visualViewport.height < window.innerHeight * 0.85;
        setIsVisible(!isKeyboardOpen);
      }
    };

    const originalHeight = window.innerHeight;
    const handleResize = () => {
      if (!window.visualViewport) {
        if (window.innerHeight < originalHeight * 0.8) {
          setIsVisible(false);
        } else {
          setIsVisible(true);
        }
      }
    };

    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleViewportChange);
      window.visualViewport.addEventListener('scroll', handleViewportChange);
    }
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleViewportChange);
        window.visualViewport.removeEventListener('scroll', handleViewportChange);
      }
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  if (!isVisible) return null;

  const navItems = [
    { icon: Home, label: 'Home', path: '/' },
    { icon: ShoppingBag, label: 'Shop', path: '/products' },
    { icon: ShoppingCart, label: 'Cart', path: '/cart', badge: cartCount, highlight: !!lastAddedId },
    { icon: Heart, label: 'Saved', path: '/wishlist', badge: wishlist.length },
    { icon: User, label: 'Profile', path: '/profile' }
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-[110] mobile-bottom-nav transition-transform duration-500 ease-in-out">
      <motion.div 
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        className="bg-white/95 backdrop-blur-2xl border-t border-stone-200/60 shadow-[0_-8px_30px_rgb(0,0,0,0.04)] py-1 px-4 flex items-center justify-between pb-safe"
      >
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link 
              key={item.path} 
              to={item.path}
              onClick={() => triggerFeedback('light')}
              className="relative flex flex-col items-center justify-center p-2 pt-3 group outline-none min-w-[64px]"
            >
              <div 
                className={cn(
                  "transition-all duration-300 relative rounded-xl",
                  isActive ? "text-primary" : "text-stone-400 group-hover:text-stone-600"
                )}
              >
                <item.icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                
                <AnimatePresence>
                  {item.badge !== undefined && item.badge > 0 && (
                    <motion.span 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      key={item.badge}
                      className="absolute -top-1.5 -right-1.5 bg-primary text-white text-[8px] font-black w-4 h-4 rounded-full flex items-center justify-center border-2 border-white shadow-sm"
                    >
                      {item.badge}
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>
              
              <span className={cn(
                "text-[8px] font-black uppercase tracking-[0.1em] mt-1.5 transition-all text-center",
                isActive ? "text-primary opacity-100" : "text-stone-400 opacity-60"
              )}>
                {item.label}
              </span>

              {isActive && (
                <motion.div 
                  layoutId="active-nav-dot"
                  className="absolute bottom-1 w-1 h-1 bg-primary rounded-full"
                />
              )}
            </Link>
          );
        })}
      </motion.div>
    </div>
  );
}
