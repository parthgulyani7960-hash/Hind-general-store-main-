import { motion, AnimatePresence } from 'motion/react';
import { ShoppingCart, User, Menu, X, Search, Phone, Heart, Clock, ShoppingBag, Languages, Trash2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Link, useNavigate, NavLink } from 'react-router-dom';
import { useStore } from '../StoreContext';
import { cn } from '../types';

import UserAvatar from './UserAvatar';

const MiniCart = ({ cart, isOpen }: { cart: any[], isOpen: boolean }) => {
  const subtotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const itemsToShow = cart.slice(0, 3);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          className="absolute top-full right-0 w-80 bg-white rounded-2xl shadow-xl border border-stone-100 p-4 z-50 mt-2"
        >
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-lg">Mini Cart</h3>
            <span className="text-xs text-stone-500">{cart.length} items</span>
          </div>
          
          <div className="space-y-3 max-h-[300px] overflow-y-auto">
            {itemsToShow.map((item) => (
              <div key={item.id} className="flex items-center space-x-3">
                <img src={item.image_url} alt={item.name} className="w-12 h-12 rounded-lg object-cover" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold truncate">{item.name}</p>
                  <p className="text-xs text-stone-500">{item.quantity} x ₹{item.price}</p>
                </div>
                <p className="font-bold text-sm">₹{item.price * item.quantity}</p>
              </div>
            ))}
          </div>
          
          <div className="mt-4 pt-4 border-t border-stone-100 flex justify-between items-center">
            <p className="font-bold">Subtotal</p>
            <p className="font-black text-lg text-primary">₹{subtotal}</p>
          </div>
          
          <Link to="/cart" className="block w-full bg-primary text-white text-center py-2 rounded-xl mt-4 font-bold text-sm hover:bg-opacity-90">
            View Full Cart
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
  const [suggestions, setSuggestions] = useState<string[]>([]);
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

  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);
  const wishlistCount = wishlist.length;

  const navLinks = [
    { to: '/', label: t('home') },
    { to: '/products', label: t('products') },
    { to: '/support', label: t('support') },
    { to: '/track-order', label: 'Track Order' },
  ];

  return (
    <nav className="sticky top-0 z-50 glass shadow-sm">
      {!isOnline && (
        <div className="bg-red-600 text-white text-center py-1 text-xs font-bold uppercase tracking-widest z-[60]">
          Offline Mode - Some features unavailable
        </div>
      )}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="relative">
              <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center transform group-hover:rotate-6 transition-transform shadow-lg shadow-primary/20 overflow-hidden">
                <span className="text-white font-black text-2xl relative z-10">H</span>
                <div className="absolute inset-0 bg-white/10 group-hover:translate-x-full transition-transform duration-500" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white shadow-sm" />
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-black text-stone-900 hidden sm:block leading-none tracking-tight group-hover:text-primary transition-colors">
                Hind<span className="text-primary">.</span>
              </span>
              <div className="flex items-center space-x-1 text-[9px] text-stone-400 font-black uppercase tracking-[0.2em] hidden sm:flex mt-1">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>Live Status</span>
              </div>
            </div>
          </Link>

          <div className="relative flex-1 max-w-sm mx-4">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 text-stone-400" size={18} />
              <input
                type="text"
                placeholder={t('search_placeholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setShowSuggestions(true)}
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-stone-100 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-lg border border-stone-100 overflow-hidden z-50">
                {suggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => {
                      setSearchQuery(suggestion);
                      setShowSuggestions(false);
                      navigate(`/products?search=${encodeURIComponent(suggestion)}`);
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-stone-50 text-sm"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
            {showSuggestions && searchQuery.trim().length >= 2 && suggestions.length === 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-lg border border-stone-100 p-4 text-sm text-stone-500 z-50">
                No products found.
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
            
            <Link to="/wishlist" className="relative p-2 text-stone-600 hover:text-primary transition-colors">
              <Heart size={24} />
              {wishlistCount > 0 && (
                <span className="absolute top-0 right-0 bg-red-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                  {wishlistCount}
                </span>
              )}
            </Link>

            <div 
                className="relative"
                onMouseEnter={() => setIsMiniCartOpen(true)}
                onMouseLeave={() => setIsMiniCartOpen(false)}
            >
              <Link to="/cart" className="relative p-2 text-stone-600 hover:text-primary transition-colors">
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
              <div className="flex items-center space-x-4">
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
                <button 
                  onClick={logout}
                  className="text-sm text-red-600 hover:text-red-700 font-medium hidden sm:block"
                >
                  Logout
                </button>
              </div>
            ) : (
              <Link to="/login" className="btn-primary flex items-center space-x-2">
                <User size={18} />
                <span>Login</span>
              </Link>
            )}

            <button 
              className="md:hidden p-2 text-stone-600"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
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
                "block text-base font-medium transition-colors",
                isActive ? "text-primary font-bold" : "text-stone-600"
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
                "block text-base font-bold transition-colors",
                isActive ? "text-primary" : "text-stone-900"
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

