import { motion, AnimatePresence } from 'motion/react';
import { ShoppingCart, User, Menu, X, Search, Phone, Heart, Clock, ShoppingBag, Languages, Trash2, Star, Camera, Store, ChevronDown, LogOut, ArrowRight, Wallet, Sparkles, ShieldCheck } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Link, useNavigate, NavLink, useLocation } from 'react-router-dom';
import { useStore } from '@/StoreContext';
import { cn } from '@/types';
import toast from 'react-hot-toast';

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
          initial={{ opacity: 0, y: 15, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 15, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 350, damping: 25 }}
          className="absolute top-full right-0 w-80 bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl shadow-indigo-900/10 border border-indigo-100 p-6 z-50 mt-4 overflow-hidden"
        >
          {/* Subtle top decoration beam */}
    
          
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-extrabold text-stone-900 font-display text-sm">{t('mini_cart') || 'Shopping Basket'}</h3>
            <span className="text-[10px] font-black text-white bg-gradient-to-r from-indigo-500 to-purple-600 px-2.5 py-0.5 rounded-full uppercase tracking-wider">{cart.length}</span>
          </div>
          
          <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1 no-scrollbar">
            {cart.length === 0 ? (
              <div className="text-center py-8 text-stone-400">
                <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-3">
                  <ShoppingBag size={20} className="text-indigo-400" />
                </div>
                <p className="text-xs font-bold uppercase tracking-widest">{t('no_items') || 'Your cart is empty'}</p>
              </div>
            ) : (
              itemsToShow.map((item) => (
                <div key={item.id} className="flex items-center space-x-3 group/item">
                  {showImages ? (
                    <div className="w-12 h-12 bg-stone-50 rounded-xl overflow-hidden shrink-0 border border-stone-100">
                      <img src={item.image_url} alt={item.name} className="w-full h-full object-cover group-hover/item:scale-110 transition-transform duration-500" />
                    </div>
                  ) : (
                    <div className="w-12 h-12 flex items-center justify-center bg-stone-50 rounded-xl border border-stone-100 text-stone-400 shrink-0">
                      <Camera size={16} />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-stone-800 truncate">{item.name}</p>
                    <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">{item.quantity} x ₹{item.price}</p>
                  </div>
                  <p className="font-extrabold text-xs text-stone-900">₹{item.price * item.quantity}</p>
                </div>
              ))
            )}
            {cart.length > 5 && (
              <p className="text-[10px] text-center font-bold text-indigo-500 uppercase tracking-widest pt-2 flex items-center justify-center gap-1">
                <span>+ {cart.length - 5} more items</span>
                <ArrowRight size={10} />
              </p>
            )}
          </div>
          
          <div className="mt-6 pt-5 border-t border-dashed border-stone-100 flex justify-between items-center">
            <p className="font-bold text-stone-400 uppercase tracking-widest text-[9px]">{t('subtotal') || 'Estimate Subtotal'}</p>
            <p className="font-extrabold text-xl text-indigo-600">₹{subtotal}</p>
          </div>
          
          <Link 
            to="/cart" 
            className="flex items-center justify-center space-x-2 block w-full bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-700 text-white text-center py-3.5 rounded-2xl mt-5 font-bold text-xs uppercase tracking-widest hover:shadow-lg hover:shadow-indigo-500/20 active:scale-95 transition-all outline-none"
          >
            <span>{t('view_full_cart') || 'Proceed to Cart'}</span>
            <ArrowRight size={12} />
          </Link>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default function Navbar() {
  const { user, cart, logout, wishlist, language, setLanguage, t, isOnline, config = [], isApiUp } = useStore();
  const showImages = (config || []).find(c => c.key === 'feature_show_product_images')?.value !== 'false';
  const isUserAdmin = user?.role === 'admin';
  
  useEffect(() => {
    // Role monitoring removed for production security protocol
  }, [user, isUserAdmin]);

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMiniCartOpen, setIsMiniCartOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (user && user.wallet_balance !== undefined) {
      const balanceCheck = sessionStorage.getItem('login_welcome_shown');
      if (!balanceCheck && (user.name || user.email)) {
        toast((t) => (
          <div className="flex flex-col gap-2 p-1">
            <span className="font-bold text-indigo-900 flex items-center gap-1.5 font-display">
              <Sparkles size={16} className="text-indigo-500 animate-spin" />
              Welcome back, {(user.name && user.name !== 'undefined' && user.name !== 'Firebase User') ? user.name : (user.email?.split('@')[0] || 'Guest')}!
            </span>
            <span className="text-xs text-stone-600">Your current wallet balance is: <span className="font-bold text-emerald-600">₹{user.wallet_balance}</span></span>
          </div>
        ), { duration: 5000 });
        sessionStorage.setItem('login_welcome_shown', 'true');
      }
    }
  }, [user]);

  useEffect(() => {
    const handleOpenSearch = () => setIsSearchModalOpen(true);
    window.addEventListener('open-search-overlay', handleOpenSearch);
    return () => window.removeEventListener('open-search-overlay', handleOpenSearch);
  }, []);

  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  const navLinks = [
    { to: '/', label: t('home') || 'Home' },
    { to: '/products', label: t('products') || 'Products', highlight: true },
    { to: '/track-order', label: 'Track Order' },
    { to: '/support', label: t('support') || 'Support' },
  ];

  const hideSearchRoutes = ['/', '/products'];
  const shouldShowNavbarSearch = !hideSearchRoutes.includes(location.pathname);

  return (
    <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-xl border-b border-indigo-50 shadow-sm relative font-sans">
      {!isApiUp && (
        <div className="bg-amber-500 text-stone-950 px-4 py-2 text-xs font-bold font-mono tracking-wider flex items-center justify-center gap-2 text-center relative z-50 ring-1 ring-amber-600/25">
          <div className="w-2 h-2 bg-stone-950 rounded-full animate-ping shrink-0" />
          <span><b>API CONNECTIVITY ALERT:</b> The backend server is currently offline or unreachable. Some real-time services may be disabled.</span>
        </div>
      )}

      {/* Glow Rainbow Accent strip at the top */}
      <div className="h-[4px] bg-gradient-to-r from-teal-400 via-indigo-500 to-pink-500 w-full relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-teal-400 via-indigo-500 to-pink-500 mix-blend-overlay blur-sm animate-pulse opacity-85" />
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-18 items-center">
          
          {/* Colorful Branding Area */}
          <Link to="/" className="flex items-center space-x-3 group shrink-0 select-none">
            <motion.div 
              whileHover={{ scale: 1.08, rotate: -4 }}
              whileTap={{ scale: 0.95 }}
              className="relative shrink-0"
            >
              <div className="w-10 h-10 md:w-11 md:h-11 bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/25 border border-white/20">
                <Store className="text-white" size={20} />
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-lime-500 rounded-full border-2 border-white shadow-sm flex items-center justify-center">
                <div className="w-1.5 h-1.5 bg-white rounded-full animate-ping" />
              </div>
            </motion.div>
            
            <div className="flex flex-col">
              <span className="text-[13px] md:text-sm font-black text-slate-900 leading-none tracking-tight group-hover:bg-clip-text group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-indigo-600 group-hover:to-pink-500 transition-all font-display duration-300">
                {(config || []).find(c => c.key === 'store_name')?.value || 'New Hind General Store'}
              </span>
              <div className="flex items-center space-x-1.5 text-[9px] font-bold uppercase tracking-wider mt-1 text-slate-400">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                <span>{(config || []).find(c => c.key === 'store_address')?.value?.split(',')[0] || 'Nayagaon'}</span>
              </div>
            </div>
          </Link>

          {/* Premium Search Box */}
          {shouldShowNavbarSearch ? (
            <div className="relative flex-grow max-w-[220px] lg:max-w-md mx-6 hidden md:block">
              <div className="relative group/search">
                <Search className="absolute left-3.5 top-3 text-slate-400 pointer-events-none group-focus-within/search:text-indigo-600 transition-colors" size={14} />
                <input
                  type="text"
                  readOnly
                  placeholder={t('search_placeholder') || 'Express catalog search...'}
                  onClick={() => setIsSearchModalOpen(true)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-100 cursor-pointer text-xs font-semibold focus:outline-none hover:bg-white hover:border-indigo-200 transition-all shadow-inner shadow-slate-100/40"
                />
              </div>
            </div>
          ) : <div className="flex-grow hidden md:block" />}

          {/* Control actions bar */}
          <div className="flex items-center space-x-2 sm:space-x-3.5">
            
            {/* Desktop NavLinks with custom pills */}
            <div className="hidden md:flex items-center space-x-1 lg:space-x-2">
              {navLinks.map((link) => (
                <motion.div key={link.to} whileHover={{ y: -1.5 }} whileTap={{ y: 0 }}>
                  <NavLink 
                    to={link.to} 
                    className={({ isActive }) => cn(
                      "text-xs font-bold transition-all px-4 py-2 rounded-xl border font-display tracking-tight flex items-center space-x-1",
                      isActive 
                        ? "text-indigo-600 bg-indigo-50/70 border-indigo-100 shadow-sm font-black" 
                        : (link as any).highlight 
                          ? "text-pink-600 border-pink-100 bg-pink-50/50 hover:bg-pink-100/50 hover:text-pink-700" 
                          : "text-slate-600 border-transparent hover:text-indigo-600 hover:bg-indigo-50/30"
                    )}
                  >
                    <span>{link.label}</span>
                  </NavLink>
                </motion.div>
              ))}
            </div>

            {/* Wallet Quick Indicator - Elegant design */}
            {user && (
              <Link 
                to="/history?tab=wallet" 
                className="hidden lg:flex items-center space-x-2 bg-gradient-to-r from-emerald-50/80 via-teal-50/50 to-indigo-50/30 border border-emerald-100/60 px-3.5 py-1.5 rounded-2xl hover:opacity-90 active:scale-95 transition-all"
                title="Your Wallet"
              >
                <div className="w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
                  <Wallet size={10} className="stroke-[3]" />
                </div>
                <div className="flex flex-col items-start leading-none">
                  <span className="text-[8px] font-bold text-emerald-700 uppercase tracking-widest">Balance</span>
                  <span className="text-xs font-extrabold text-slate-800 mt-0.5">₹{user.wallet_balance}</span>
                </div>
              </Link>
            )}

            {/* Wallet trigger for mobile screen */}
            {user && (
              <Link 
                to="/history?tab=wallet" 
                className="flex lg:hidden items-center bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-650 hover:to-teal-650 p-2.5 px-3 rounded-2xl text-xs font-extrabold text-white shadow-md shadow-emerald-500/25 active:scale-95 transition-all shrink-0"
                title="Wallet Balance"
              >
                <Wallet size={14} className="mr-1 inline stroke-[2.5]" />
                <span>₹{user.wallet_balance}</span>
              </Link>
            )}

            <div className="h-6 w-px bg-slate-100 hidden md:block" />
            
            {/* Notification Bell with Micro-Badge */}
            <div className="hidden sm:block">
              <NotificationBell />
            </div>

            {/* Mobile/Tablet Search trigger icon */}
            <button 
              onClick={() => setIsSearchModalOpen(true)}
              className="p-2.5 text-slate-600 hover:bg-slate-50 hover:text-indigo-600 transition-colors md:hidden rounded-2xl"
              title="Search Catalog"
            >
              <Search size={18} />
            </button>

            {/* Interactive Cart Button with MiniCart hover dropdown */}
            <div 
              className="relative relative-group"
              onMouseEnter={() => setIsMiniCartOpen(true)}
              onMouseLeave={() => setIsMiniCartOpen(false)}
            >
              <Link 
                to="/cart" 
                className="relative p-2.5 text-slate-700 hover:bg-slate-50 hover:text-indigo-600 transition-all block rounded-2xl"
              >
                <ShoppingCart size={18} />
                {cartCount > 0 && (
                  <span className="absolute top-1 right-1 bg-gradient-to-r from-pink-500 to-rose-500 text-white text-[9px] font-black w-4.5 h-4.5 rounded-full flex items-center justify-center shadow-md shadow-pink-500/25 border-2 border-white animate-pulse">
                    {cartCount}
                  </span>
                )}
              </Link>
              <MiniCart cart={cart} isOpen={isMiniCartOpen} showImages={showImages} />
            </div>

            {/* Custom Interactive Avatar Dropdown Menu */}
            {user ? (
              <div className="hidden md:block group relative">
                <button className="flex items-center space-x-2 bg-slate-50 hover:bg-indigo-50/50 px-3.5 py-1.75 rounded-full border border-slate-200/60 transition-all outline-none focus:ring-4 focus:ring-indigo-100 shrink-0">
                  <UserAvatar user={user} size="sm" />
                  <span className="text-xs font-bold text-slate-700 truncate max-w-[85px] leading-tight">
                    {user.name && user.name !== 'undefined' ? user.name : 'Account'}
                  </span>
                  <ChevronDown size={13} className="text-slate-400 transition-transform duration-300 group-hover:rotate-180" />
                </button>
                
                {/* Custom popup card menu */}
                <div className="absolute right-0 top-full pt-3.5 w-56 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50 transform group-hover:translate-y-0 translate-y-1.5">
                  <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-xl shadow-slate-200/80 border border-slate-100 p-2.5 space-y-1">
                    <div className="px-3.5 py-2">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Signed in as</p>
                      <p className="text-xs font-black text-slate-800 truncate select-all">{user.email}</p>
                    </div>
                    <div className="h-px bg-slate-100 mx-2" />
                    
                    <Link to="/profile" className="flex items-center space-x-2 px-3.5 py-2.5 text-xs font-bold text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 rounded-xl transition-all">
                      <User size={14} className="text-slate-400" />
                      <span>My Profile</span>
                    </Link>
                    
                    <Link to="/history?tab=orders" className="flex items-center space-x-2 px-3.5 py-2.5 text-xs font-bold text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 rounded-xl transition-all">
                      <Clock size={14} className="text-slate-400" />
                      <span>My Orders</span>
                    </Link>

                    {isUserAdmin && (
                      <Link to="/admin" className="flex items-center space-x-2 px-3.5 py-2.5 text-xs font-bold text-indigo-700 hover:bg-indigo-50/80 rounded-xl transition-all">
                        <ShieldCheck size={14} className="text-indigo-500" />
                        <span>Admin Panel</span>
                      </Link>
                    )}

                    <div className="h-px bg-slate-100 my-1 mx-2" />
                    
                    <button 
                      onClick={logout} 
                      className="w-full flex items-center space-x-2 px-3.5 py-2.5 text-xs font-bold text-red-600 hover:bg-red-50 rounded-xl transition-all"
                    >
                      <LogOut size={14} className="text-red-400" />
                      <span>Logout</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <Link 
                to="/login" 
                className="bg-indigo-50 hover:bg-indigo-100 text-indigo-600 p-2.5 rounded-full hidden md:block transition-all hover:scale-105 active:scale-95 shadow-sm" 
                title="Login / Register"
              >
                <User size={18} />
              </Link>
            )}

            {/* Fancy Menu Button with rotating states on mobile */}
            <motion.button 
                whileTap={{ scale: 0.90 }}
                className="p-2.5 text-slate-600 hover:text-indigo-600 hover:bg-slate-50 transition-colors rounded-2xl relative select-none md:hidden"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                aria-label="Toggle Menu"
            >
              <AnimatePresence mode="wait">
                {isMenuOpen ? (
                  <motion.div
                    key="close"
                    initial={{ opacity: 0, rotate: -45 }}
                    animate={{ opacity: 1, rotate: 0 }}
                    exit={{ opacity: 0, rotate: 45 }}
                    transition={{ duration: 0.15 }}
                  >
                    <X size={20} />
                  </motion.div>
                ) : (
                  <motion.div
                    key="menu"
                    initial={{ opacity: 0, rotate: 45 }}
                    animate={{ opacity: 1, rotate: 0 }}
                    exit={{ opacity: 0, rotate: -45 }}
                    transition={{ duration: 0.15 }}
                  >
                    <Menu size={20} />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>
          </div>

        </div>
      </div>

      {/* Mobile Drawer Menu Overlays with elastic bounce animations */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, height: 0, y: -10 }}
            animate={{ opacity: 1, height: 'auto', y: 0 }}
            exit={{ opacity: 0, height: 0, y: -10 }}
            transition={{ type: "spring", stiffness: 260, damping: 28 }}
            className="bg-white/95 backdrop-blur-xl border-t border-slate-100 overflow-hidden shadow-xl absolute w-full left-0 top-full z-[100]"
          >
            <div className="p-4 space-y-2 border-b border-indigo-100/30">
              {navLinks.map((link, idx) => (
                <motion.div
                  initial={{ opacity: 0, x: -15 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  key={link.to}
                >
                  <NavLink 
                    to={link.to} 
                    onClick={() => setIsMenuOpen(false)}
                    className={({ isActive }) => cn(
                      "flex items-center space-x-3 py-3 px-5 text-sm font-bold transition-all rounded-2xl font-display",
                      isActive 
                        ? "text-indigo-700 bg-indigo-50/70 shadow-sm font-extrabold" 
                        : "text-slate-600 hover:bg-slate-50"
                    )}
                  >
                    {link.to === '/' && <Store size={18} className="text-indigo-400" />}
                    {link.to === '/products' && <ShoppingBag size={18} className="text-pink-400" />}
                    {link.to === '/track-order' && <Clock size={18} className="text-indigo-400" />}
                    {link.to === '/support' && <Phone size={18} className="text-teal-400" />}
                    <span>{link.label}</span>
                  </NavLink>
                </motion.div>
              ))}

              <div className="h-px bg-slate-100 my-3 mx-4" />
              
              {user ? (
                <div className="space-y-1.5">
                  <motion.div
                    initial={{ opacity: 0, x: -15 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <NavLink 
                      to="/history?tab=orders" 
                      onClick={() => setIsMenuOpen(false)}
                      className="flex items-center space-x-3 py-3 px-5 text-sm font-bold text-slate-600 hover:bg-slate-50 rounded-2xl font-display"
                    >
                      <Clock size={18} className="text-slate-400" />
                      <span>My Orders</span>
                    </NavLink>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, x: -15 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.25 }}
                  >
                    <NavLink 
                      to="/profile" 
                      onClick={() => setIsMenuOpen(false)}
                      className="flex items-center space-x-3 py-3 px-5 text-sm font-bold text-slate-600 hover:bg-slate-50 rounded-2xl font-display"
                    >
                      <User size={18} className="text-slate-400" />
                      <span>My Profile</span>
                    </NavLink>
                  </motion.div>

                  {isUserAdmin && (
                    <motion.div
                      initial={{ opacity: 0, x: -15 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 }}
                    >
                      <NavLink 
                        to="/admin" 
                        onClick={() => setIsMenuOpen(false)}
                        className={({ isActive }) => cn(
                          "flex items-center space-x-3 py-3 px-5 text-sm font-bold transition-all rounded-2xl font-display",
                          isActive ? "text-indigo-700 bg-indigo-50" : "text-indigo-600 hover:bg-indigo-50/50"
                        )}
                      >
                        <ShieldCheck size={18} className="text-indigo-500" />
                        <span>Admin Dashboard</span>
                      </NavLink>
                    </motion.div>
                  )}

                  <motion.div
                    initial={{ opacity: 0, x: -15 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.35 }}
                  >
                    <button 
                      onClick={() => { logout(); setIsMenuOpen(false); }}
                      className="w-full flex items-center space-x-3 text-left py-3 px-5 text-sm font-bold text-red-650 hover:bg-red-50 rounded-2xl mt-1 font-display"
                    >
                      <LogOut size={18} className="text-red-400" />
                      <span>Log Out</span>
                    </button>
                  </motion.div>
                </div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, x: -15 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <NavLink 
                    to="/login" 
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center justify-center space-x-2 w-full py-3.5 px-5 text-sm font-extrabold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 rounded-2xl shadow-md font-display"
                  >
                    <User size={16} />
                    <span>Sign In to Account</span>
                  </NavLink>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <SearchOverlay 
        isOpen={isSearchModalOpen} 
        onClose={() => setIsSearchModalOpen(false)} 
        initialSearchQuery={searchQuery}
      />
    </nav>
  );
}
