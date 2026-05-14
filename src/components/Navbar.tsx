import { motion, AnimatePresence } from 'motion/react';
import { ShoppingCart, User, Menu, X, Search, Phone, Heart, Clock, ShoppingBag, Languages, Trash2, Star, Camera, Store } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Link, useNavigate, NavLink } from 'react-router-dom';
import { useStore } from '../StoreContext';
import { cn } from '../types';

import UserAvatar from './UserAvatar';
import SearchOverlay from './SearchOverlay';
import NotificationBell from './NotificationBell';

const MiniCart = ({ cart, isOpen, showImages }: { cart: any[], isOpen: boolean, showImages: boolean }) => {
  const { t } = useStore();
  const subtotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const itemsToShow = cart.slice(0, 5);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.95 }}
          className="absolute top-full right-0 w-80 bg-white rounded-[2rem] shadow-2xl shadow-stone-200/50 border border-stone-100 p-6 z-50 mt-4 overflow-hidden"
        >
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-black text-stone-900">{t('mini_cart')}</h3>
            <span className="text-[10px] font-black text-white bg-primary px-2 py-0.5 rounded-full uppercase tracking-tighter">{cart.length}</span>
          </div>
          
          <div className="space-y-4 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
            {cart.length === 0 ? (
              <div className="text-center py-8 text-stone-400">
                <ShoppingBag size={32} className="mx-auto mb-2 opacity-20" />
                <p className="text-xs font-bold uppercase tracking-widest">{t('no_items') || 'Your cart is empty'}</p>
              </div>
            ) : (
              itemsToShow.map((item) => (
                <div key={item.id} className="flex items-center space-x-3 group">
                  {showImages ? (
                    <div className="w-14 h-14 bg-stone-50 rounded-xl overflow-hidden shrink-0 border border-stone-100">
                      <img src={item.image_url} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                    </div>
                  ) : (
                    <div className="w-14 h-14 flex items-center justify-center bg-stone-50 rounded-xl border border-stone-100 text-stone-400 shrink-0">
                      <Camera size={20} />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-stone-800 truncate">{item.name}</p>
                    <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">{item.quantity} x ₹{item.price}</p>
                  </div>
                  <p className="font-black text-sm text-stone-900">₹{item.price * item.quantity}</p>
                </div>
              ))
            )}
            {cart.length > 5 && (
              <p className="text-[10px] text-center font-bold text-stone-400 uppercase tracking-widest pt-2">
                + {cart.length - 5} more items
              </p>
            )}
          </div>
          
          <div className="mt-6 pt-6 border-t border-dashed border-stone-100 flex justify-between items-center">
            <p className="font-bold text-stone-500 uppercase tracking-[0.2em] text-[10px]">{t('subtotal')}</p>
            <p className="font-black text-2xl text-primary">₹{subtotal}</p>
          </div>
          
          <Link 
            to="/cart" 
            className="block w-full bg-stone-900 text-white text-center py-4 rounded-2xl mt-6 font-black text-xs uppercase tracking-widest hover:bg-primary transition-all shadow-lg hover:shadow-primary/20 active:scale-95"
          >
            {t('view_full_cart')}
          </Link>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default function Navbar() {
  const { user, cart, logout, wishlist, simulatedRole, setSimulatedRole, language, setLanguage, t, isOnline, config } = useStore();
  const showImages = config.find(c => c.key === 'feature_show_product_images')?.value !== 'false';
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMiniCartOpen, setIsMiniCartOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const navigate = useNavigate();
  const { addToCart, updateQuantity } = useStore();

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);



  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);
  const wishlistCount = wishlist.length;

  const navLinks = [
    { to: '/', label: t('home') },
    { to: '/about', label: t('about_us') },
    { to: '/products', label: t('products') },
    { to: '/support', label: t('support') },
    { to: '/track-order', label: 'Track Order' },
  ];

  return (
    <nav className="sticky top-0 z-50 glass shadow-sm pt-safe">
      {!isOnline && (
        <div className="bg-red-600 text-white text-center py-1 text-xs font-bold uppercase tracking-widest z-[60]">
          Offline Mode - Some features unavailable
        </div>
      )}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <Link to="/" className="flex items-center space-x-3 group mr-4">
            <div className="relative shrink-0">
              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center transform group-hover:-rotate-3 transition-all duration-700 shadow-xl overflow-hidden border border-stone-200 ring-1 ring-stone-100">
                <Store className="text-emerald-600" size={24} />
                <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/10 via-transparent to-transparent group-hover:opacity-100 transition-opacity duration-700" />
              </div>
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full border-2 border-white shadow-sm flex items-center justify-center">
                <ShoppingCart size={10} className="text-white" />
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-black text-stone-900 hidden lg:block leading-none tracking-tight group-hover:text-emerald-700 transition-colors">
                {config.find(c => c.key === 'store_name')?.value || 'Hind General Store'}
              </span>
              <div className="flex items-center space-x-1.5 text-[8px] font-black uppercase tracking-[0.2em] hidden lg:flex mt-1">
                <span className="text-stone-500">{config.find(c => c.key === 'store_address')?.value?.split(',')[0] || 'Nayagaon'} • Daily Essentials</span>
              </div>
            </div>
          </Link>

          <div className="relative flex-grow max-w-lg w-full mx-2 md:mx-4">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 text-stone-400 pointer-events-none" size={18} />
              <input
                type="text"
                readOnly
                placeholder={t('search_placeholder')}
                onClick={() => setIsSearchModalOpen(true)}
                className="w-full pl-10 pr-4 py-3 sm:py-2 min-h-[44px] sm:min-h-0 rounded-xl bg-stone-100/80 cursor-pointer text-sm focus:outline-none hover:bg-stone-200 transition-colors"
              />
            </div>
          </div>

          <div className="hidden md:flex items-center space-x-4 lg:space-x-8">
            {navLinks.map((link) => (
              <NavLink 
                key={link.to} 
                to={link.to} 
                className={({ isActive }) => cn(
                  "text-sm font-medium transition-colors hover:text-primary",
                  isActive ? "text-primary font-bold" : "text-stone-600"
                )}
              >
                {link.label}
              </NavLink>
            ))}
            {user?.role === 'admin' && (
              <NavLink 
                to="/admin" 
                className={({ isActive }) => cn(
                  "text-sm font-bold transition-colors",
                  isActive ? "text-primary" : "text-stone-900 hover:text-primary"
                )}
              >
                Admin Panel
              </NavLink>
            )}
          </div>

          <div className="flex items-center space-x-4">
            <div className="hidden lg:flex items-center bg-stone-100 rounded-xl p-1">
              {[
                { id: 'en', label: 'EN' },
                { id: 'hi', label: 'हि' },
                { id: 'pa', label: 'ਪੰਜਾਬੀ' }
              ].map((lang) => (
                <button
                  key={lang.id}
                  onClick={() => setLanguage(lang.id as any)}
                  className={cn(
                    "px-2 py-1 rounded-lg text-[10px] font-bold transition-all",
                    language === lang.id ? "bg-white text-primary shadow-sm" : "text-stone-400 hover:text-stone-600"
                  )}
                >
                  {lang.label}
                </button>
              ))}
            </div>

            {user?.role === 'admin' && (
              <div className="hidden xl:flex items-center bg-stone-100 rounded-xl p-1 space-x-1">
                {[
                  { id: null, label: 'Default', icon: User },
                  { id: 'retailer', label: 'Retail', icon: ShoppingCart },
                  { id: 'wholesaler', label: 'Wholesale', icon: ShoppingBag }
                ].map((r) => (
                  <button
                    key={r.label}
                    onClick={() => setSimulatedRole(r.id as any)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center space-x-1.5 transition-all",
                      (simulatedRole === r.id || (simulatedRole === null && r.id === null))
                        ? "bg-primary text-white shadow-sm" 
                        : "text-stone-400 hover:text-stone-600 hover:bg-stone-200"
                    )}
                  >
                    <r.icon size={12} />
                    <span>{r.label}</span>
                  </button>
                ))}
              </div>
            )}

            {user && (
              <div className="hidden lg:flex flex-col items-end mr-2">
                <span className="text-[10px] font-bold text-stone-400 uppercase">Wallet</span>
                <span className="text-sm font-bold text-primary">₹{user.wallet_balance}</span>
              </div>
            )}
            
            <Link to="/wishlist" className="relative p-2 text-stone-600 hover:text-primary transition-colors hidden md:block">
              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                <Heart size={24} />
              </motion.div>
              {wishlistCount > 0 && (
                <span className="absolute top-0 right-0 bg-red-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                  {wishlistCount}
                </span>
              )}
            </Link>

            <NotificationBell />

            <div 
              className="relative"
              onMouseEnter={() => setIsMiniCartOpen(true)}
              onMouseLeave={() => setIsMiniCartOpen(false)}
            >
              <Link to="/cart" className="relative p-2 text-stone-600 hover:text-primary transition-colors block">
                <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                    <ShoppingCart size={24} />
                </motion.div>
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center shadow-lg border-2 border-white">
                    {cartCount}
                  </span>
                )}
              </Link>
              <div className="hidden md:block">
                <MiniCart cart={cart} isOpen={isMiniCartOpen} showImages={showImages} />
              </div>
            </div>

            {user ? (
              <div className="hidden lg:flex items-center space-x-4">
                <Link to="/profile" className="flex items-center space-x-3 group bg-stone-50 hover:bg-stone-100 px-3 py-1.5 rounded-2xl border border-stone-100 transition-all">
                  <UserAvatar user={user} size="sm" />
                  <div className="flex flex-col items-start overflow-hidden">
                    <span className="text-xs font-bold text-stone-800 group-hover:text-primary transition-colors truncate max-w-[150px] leading-tight">
                      {user.name}
                    </span>
                    <span className="text-[8px] font-black text-white bg-primary px-1.5 py-0.5 rounded-md uppercase tracking-wider mt-0.5">
                      {user.role}
                    </span>
                  </div>
                </Link>
              </div>
            ) : (
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Link to="/login" className="btn-primary hidden md:flex items-center space-x-2">
                    <User size={18} />
                    <span>Login</span>
                  </Link>
              </motion.div>
            )}

            <div className="flex items-center space-x-2 md:hidden">
               <button 
                  className="p-2 text-stone-600 hover:text-primary transition-colors"
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
               >
                  {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
               </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="md:hidden bg-white border-t border-stone-100 p-4 space-y-4"
        >
          {user && (
            <div className="flex items-center space-x-3 pb-4 border-b border-stone-100 mb-4">
              <UserAvatar user={user} size="md" />
              <div>
                <p className="text-sm font-bold text-stone-900">{user.name}</p>
                <span className="text-[10px] font-bold text-white bg-primary px-1.5 py-0.5 rounded uppercase tracking-tighter">
                  {user.role}
                </span>
              </div>
            </div>
          )}
          {navLinks.map((link) => (
            <NavLink 
              key={link.to} 
              to={link.to} 
              onClick={() => setIsMenuOpen(false)}
              className={({ isActive }) => cn(
                "block text-lg py-3 min-h-[44px] font-medium transition-colors",
                isActive ? "text-primary font-bold bg-stone-50 rounded-xl px-4" : "text-stone-600 px-4"
              )}
            >
              {link.label}
            </NavLink>
          ))}
          {user?.role === 'admin' && (
            <NavLink 
              to="/admin" 
              onClick={() => setIsMenuOpen(false)}
              className={({ isActive }) => cn(
                "block text-lg py-3 min-h-[44px] font-bold transition-colors",
                isActive ? "text-primary bg-stone-50 rounded-xl px-4" : "text-stone-900 px-4"
              )}
            >
              Admin Panel
            </NavLink>
          )}
        </motion.div>
      )}

      <SearchOverlay 
        isOpen={isSearchModalOpen} 
        onClose={() => setIsSearchModalOpen(false)} 
        initialSearchQuery={searchQuery}
      />
    </nav>
  );
}

