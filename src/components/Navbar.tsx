import { motion, AnimatePresence } from 'motion/react';
import { ShoppingCart, User, Menu, X, Search, Phone, Heart, Clock, ShoppingBag, Languages, Trash2, Star } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Link, useNavigate, NavLink } from 'react-router-dom';
import { useStore } from '../StoreContext';
import { cn } from '../types';

import UserAvatar from './UserAvatar';

const MiniCart = ({ cart, isOpen }: { cart: any[], isOpen: boolean }) => {
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
                  <div className="w-14 h-14 bg-stone-50 rounded-xl overflow-hidden shrink-0 border border-stone-100">
                    <img src={item.image_url} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                  </div>
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
  const { user, cart, logout, wishlist, simulatedRole, setSimulatedRole, language, setLanguage, t, isOnline } = useStore();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMiniCartOpen, setIsMiniCartOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<{id: number, name: string}[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (searchQuery.trim().length < 2) {
        setSuggestions([]);
        return;
      }
      try {
        const res = await fetch(`/api/search/suggestions?q=${encodeURIComponent(searchQuery)}`);
        if (res.ok) {
          const data = await res.json();
          setSuggestions(data);
          setShowSuggestions(true);
        }
      } catch (err) {
        console.error('Failed to fetch suggestions');
      }
    };
    const timer = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    const handleClickOutside = () => setShowSuggestions(false);
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);
  const wishlistCount = wishlist.length;

  const navLinks = [
    { to: '/', label: t('home') },
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
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="relative">
              <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center transform group-hover:rotate-6 transition-all duration-700 shadow-2xl shadow-primary/30 overflow-hidden border border-white/10 ring-1 ring-white/5">
                <span className="text-white font-black text-xl relative z-10 tracking-tighter group-hover:scale-110 transition-transform duration-500 italic">HG</span>
                <div className="absolute inset-0 bg-gradient-to-br from-accent/40 via-transparent to-transparent group-hover:opacity-100 transition-opacity duration-700" />
                <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-accent rounded-lg border-2 border-white shadow-sm flex items-center justify-center">
                <Star size={8} className="text-white fill-white" />
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-black text-stone-900 hidden sm:block leading-none tracking-tight group-hover:text-primary transition-colors">
                <span className="text-primary">Hind</span> General
              </span>
              <div className="flex items-center space-x-1.5 text-[9px] font-black uppercase tracking-[0.3em] hidden sm:flex mt-1.5">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-accent"></span>
                </span>
                <span className="text-stone-400">Premium Quality</span>
              </div>
            </div>
          </Link>

          <div className="relative flex-grow max-w-lg w-full mx-2 md:mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 text-stone-400" size={18} />
              <input
                type="text"
                placeholder={t('search_placeholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setShowSuggestions(true)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && searchQuery.trim()) {
                    setShowSuggestions(false);
                    navigate(`/products?search=${encodeURIComponent(searchQuery)}`);
                  }
                }}
                className="w-full pl-10 pr-4 py-3 sm:py-2 min-h-[44px] sm:min-h-0 rounded-xl bg-stone-100 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-lg border border-stone-100 overflow-hidden z-50">
                {suggestions.map((suggestion: any) => (
                  <button
                    key={suggestion.id}
                    onClick={() => {
                      setSearchQuery(suggestion.name);
                      setShowSuggestions(false);
                      navigate(`/product/${suggestion.id}`);
                    }}
                    className="w-full text-left px-4 py-3 min-h-[44px] hover:bg-stone-50 text-sm transition-colors flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-3">
                      <img src={suggestion.image_url} alt={suggestion.name} className="w-10 h-10 rounded-md object-cover" />
                      <div className="flex flex-col">
                        <span className="font-medium text-stone-700 group-hover:text-primary transition-colors">{suggestion.name}</span>
                        <span className="text-[10px] text-stone-400 uppercase tracking-wider">{suggestion.category}</span>
                      </div>
                    </div>
                    <Search size={14} className="text-stone-300" />
                  </button>
                ))}
              </div>
            )}
            {showSuggestions && searchQuery.trim().length >= 2 && suggestions.length === 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-lg border border-stone-100 p-4 z-50 overflow-hidden">
                <div className="flex flex-col items-center text-center space-y-3">
                  <div className="w-12 h-12 bg-stone-50 rounded-2xl flex items-center justify-center">
                    <ShoppingBag size={24} className="text-stone-300" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-stone-900">Product not found</p>
                    <p className="text-[10px] text-stone-400 font-medium">We couldn't find what you're looking for</p>
                  </div>
                  <button 
                    onClick={() => {
                      setShowSuggestions(false);
                      navigate(`/support?subject=${encodeURIComponent(`Product Request: ${searchQuery}`)}&message=${encodeURIComponent(`I couldn't find the product "${searchQuery}" in your store. Could you please check if it is available or if you can order it?`)}`);
                    }}
                    className="w-full py-2 bg-primary text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-primary/90 transition-all"
                  >
                    Submit a Request
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="hidden md:flex items-center space-x-8">
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
              <Heart size={24} />
              {wishlistCount > 0 && (
                <span className="absolute top-0 right-0 bg-red-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                  {wishlistCount}
                </span>
              )}
            </Link>

            <div 
              className="relative hidden md:block"
              onMouseEnter={() => setIsMiniCartOpen(true)}
              onMouseLeave={() => setIsMiniCartOpen(false)}
            >
              <Link to="/cart" className="relative p-2 text-stone-600 hover:text-primary transition-colors block">
                <ShoppingCart size={24} />
                {cartCount > 0 && (
                  <span className="absolute top-0 right-0 bg-accent text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </Link>
              <MiniCart cart={cart} isOpen={isMiniCartOpen} />
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
              <Link to="/login" className="btn-primary hidden md:flex items-center space-x-2">
                <User size={18} />
                <span>Login</span>
              </Link>
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
    </nav>
  );
}

