import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useStore } from '../StoreContext';

export default function FloatingCart() {
  const location = useLocation();
  const { cart } = useStore();
  
  const isValidPage = location.pathname === '/' || location.pathname === '/products' || location.pathname.startsWith('/product/');
  const showStickyCart = isValidPage && cart.length > 0;
  
  const cartTotal = cart.reduce((total, item) => total + (item.discount_price || item.price) * item.quantity, 0);

  return (
    <div className="fixed bottom-24 md:bottom-8 left-0 right-0 z-[45] px-4 pointer-events-none flex justify-center">
      <AnimatePresence>
        {showStickyCart && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            className="pointer-events-auto w-full max-w-lg"
          >
             <Link to="/checkout" className="bg-stone-900 border border-stone-800 text-white rounded-[2rem] p-4 px-6 flex items-center justify-between shadow-2xl shadow-stone-900/40 active:scale-95 transition-all group hover:bg-black">
              <div className="flex flex-col">
                <span className="text-xs text-stone-400 font-medium">{cart.length} item{cart.length > 1 ? 's' : ''} in cart</span>
                <span className="text-xl font-black font-mono tracking-tight">₹{cartTotal.toFixed(2)}</span>
              </div>
              <div className="flex items-center space-x-2 bg-primary px-5 py-3 rounded-2xl group-hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20">
                <span className="text-sm font-bold uppercase tracking-wider text-white">Checkout</span>
                <ArrowRight size={18} className="text-white group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
