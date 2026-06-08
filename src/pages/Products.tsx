import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { logger } from '@/lib/logger';
import { 
  Search, Filter, ShoppingCart, Plus, Minus, 
  Share2, Heart, Star, Loader2, X, Camera,
  Zap, LayoutGrid, ArrowDownNarrowWide, ArrowUpNarrowWide, Clock,
  RefreshCw, ShoppingBag, Maximize2
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { Product, cn } from '@/types';
import { useStore } from '@/StoreContext';
import { useDeviceType } from '@/lib/device';
import toast from 'react-hot-toast';
import { db as fsDb, handleFirestoreError, OperationType, collection, getDocs, query, where, limit as limitFb } from '@/firebase';
import { fetchWithHandling } from '@/lib/api';
import { ProductSkeleton } from '@/components/ui/Skeleton';

import { io } from 'socket.io-client';

export default function Products() {
  const location = useLocation();
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedRating, setSelectedRating] = useState<number | null>(null);
  const [minPrice, setMinPrice] = useState('0');
  const [maxPrice, setMaxPrice] = useState('');
  const [sortBy, setSortBy] = useState('relevance');
  const [onSaleOnly, setOnSaleOnly] = useState(false);
  const [hoverQuickView, setHoverQuickView] = useState<number | null>(null);
  const { 
    t, addToCart, cart, updateQuantity, wishlist, toggleWishlist, user, getProductPrice, 
    simulatedRole, config = [], products, setProducts, fetchProducts, isLoadingProducts, isOnline,
    categories: globalCategories, fetchCategories
  } = useStore();
  
  const [searchTerm, setSearchTerm] = useState('');
  
  const loading = isLoadingProducts && products.length === 0;

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const search = params.get('search');
    if (search) {
      setSearchTerm(search);
    }
  }, [location.search]);
  const [loadFailed, setLoadFailed] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const showImages = (config || []).find(c => c.key === 'feature_show_product_images')?.value !== 'false';
  const { isMobile, isTablet } = useDeviceType();
  const activeRole = simulatedRole || user?.role;
  const [zoomImage, setZoomImage] = useState<string | null>(null);
  const [quickViewProduct, setQuickViewProduct] = useState<any>(null);
  const [showFloatingButtons, setShowFloatingButtons] = useState(false);
  const [showOptions, setShowOptions] = useState(true);
  const [showScrollUpPill, setShowScrollUpPill] = useState(false);

  // Use dynamic sticky top based on device
  const stickyTop = isMobile ? 'top-[56px]' : 'top-[64px]';

  const quickRanges = useMemo(() => {
    try {
      const setting = (config || []).find(c => c.key === 'quick_ranges');
      if (setting?.value) {
        return typeof setting.value === 'string' ? JSON.parse(setting.value) : setting.value;
      }
    } catch (e) {}
    return [
      { min: '0', max: '200', label: 'Budget' },
      { min: '200', max: '500', label: 'Daily Needs' },
      { min: '500', max: '2000', label: 'Premium' },
      { min: '2000', max: '', label: 'Wholesale' }
    ];
  }, [config]);

  useEffect(() => {
    if (isFilterOpen) {
      document.body.classList.add('drawer-open');
    } else {
      document.body.classList.remove('drawer-open');
    }
    return () => {
      document.body.classList.remove('drawer-open');
    };
  }, [isFilterOpen]);

  const lastFetchRef = useRef<string>('');
  useEffect(() => {
    let isMounted = true;
    const currentKey = `${user?.id}-${user?.role}`;
    
    // Initial fetch from global context
    if (products.length === 0) {
      fetchProducts();
    }

    // Real-Time Inventory Management Socket.io
    const socket = io();
    
    socket.on('data', (data) => {
      if (isMounted && data.type === 'INVENTORY_UPDATE') {
        setProducts(prevProducts => prevProducts.map(p => {
          if (p.id === data.product_id) {
            return { ...p, stock: data.stock };
          }
          return p;
        }));
      }
    });

    return () => {
      isMounted = false;
      socket.disconnect();
    };
  }, [user?.id, user?.role]);

  const filteredProducts = useMemo(() => {
    const searchTerms = searchTerm.toLowerCase().trim().split(' ').filter(Boolean);
    
    const base = products.filter(p => {
      const activePrice = getProductPrice(p, user?.role);
      
      const searchableText = `${p.name} ${p.description} ${p.category}`.toLowerCase();
      const matchesSearch = searchTerms.every(term => searchableText.includes(term));

      const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
      const matchesRating = selectedRating === null || Math.floor(p.avg_rating || 0) >= selectedRating;
      const matchesMinPrice = activePrice >= Number(minPrice);
      const matchesMaxPrice = maxPrice === '' || activePrice <= Number(maxPrice);
      const matchesSale = !onSaleOnly || p.discount > 0;
      const isListedAndActive = p.is_listed && !p.is_deleted && (p as any).deleted !== true;
      
      return matchesSearch && matchesCategory && matchesMinPrice && matchesMaxPrice && matchesRating && matchesSale && isListedAndActive;
    });

    return base.sort((a, b) => {
      // If there's a search term, rank by relevance score first
      if (searchTerms.length > 0 && sortBy === 'relevance') {
        const getScore = (product: Product) => {
          let score = 0;
          const name = (product.name || '').toLowerCase();
          const fullSearch = searchTerm.toLowerCase().trim();
          if (name === fullSearch) score += 200;
          else if (name.startsWith(fullSearch)) score += 100;
          else if (name.includes(fullSearch)) score += 50;
          return score;
        };
        const scoreDiff = getScore(b) - getScore(a);
        if (scoreDiff !== 0) return scoreDiff;
      }

      const priceA = getProductPrice(a, user?.role);
      const priceB = getProductPrice(b, user?.role);
      
      switch (sortBy) {
        case 'price-low': 
          return priceA - priceB;
        case 'price-high': 
          return priceB - priceA;
        case 'rating': 
          return (b.avg_rating || 0) - (a.avg_rating || 0);
        case 'popularity': 
          return ((b as any).review_count || 0) - ((a as any).review_count || 0);
        case 'newest': 
          return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
    case 'relevance': 
    default:
      return 0; // Default
  }
});
}, [products, searchTerm, selectedCategory, selectedRating, minPrice, maxPrice, sortBy, onSaleOnly, getProductPrice, user?.role]);

const handleEnlargeImage = (e: React.MouseEvent, url: string) => {
  e.preventDefault();
  e.stopPropagation();
  setZoomImage(url);
};

  const storeCategories = useMemo(() => {
    const list = globalCategories.map(c => c.name);
    return ['All', ...list];
  }, [globalCategories]);

  // Render context logging suppressed for production
  
  // Body scroll lock and hide mobile nav
  useEffect(() => {
    const mobileNav = document.querySelector('.mobile-bottom-nav');
    if (isFilterOpen || quickViewProduct) {
      document.body.style.overflow = 'hidden';
      if (mobileNav) (mobileNav as HTMLElement).style.transform = 'translateY(100px)';
    } else {
      document.body.style.overflow = 'unset';
      if (mobileNav) (mobileNav as HTMLElement).style.transform = 'translateY(0)';
    }
    return () => { 
      document.body.style.overflow = 'unset'; 
      if (mobileNav) (mobileNav as HTMLElement).style.transform = 'translateY(0)';
    };
  }, [isFilterOpen, quickViewProduct]);

  const saveFilters = () => {
    const filterState = {
      selectedCategory,
      selectedRating,
      minPrice,
      maxPrice,
      sortBy,
      onSaleOnly
    };
    localStorage.setItem('hgs_saved_filters', JSON.stringify(filterState));
    toast.success('Filters saved for next time');
  };

  const loadSavedFilters = () => {
    try {
      const saved = localStorage.getItem('hgs_saved_filters');
      if (saved) {
        const state = JSON.parse(saved);
        setSelectedCategory(state.selectedCategory || 'All');
        setSelectedRating(state.selectedRating || null);
        setMinPrice(state.minPrice || '0');
        setMaxPrice(state.maxPrice || '');
        setSortBy(state.sortBy || 'relevance');
        setOnSaleOnly(state.onSaleOnly || false);
        toast.success('Saved filters applied');
      }
    } catch (e) {}
  };

  useEffect(() => {
    let lastY = window.scrollY;
    let ticking = false;

    const updateScrollDir = () => {
      const currentY = window.scrollY;
      
      // Minimum difference to trigger visibility toggle
      if (Math.abs(currentY - lastY) < 15) {
        ticking = false;
        return;
      }

      if (currentY > lastY) {
        // Scrolling down - hide sticky options and the scroll helper
        setShowOptions(false);
        setShowScrollUpPill(false);
        setShowFloatingButtons(false);
      } else if (currentY < lastY) {
        // Scrolling up
        if (currentY > 300) {
          // Down the page, hide the massive header bar but show sleek scroll-to-top helper
          setShowOptions(false);
          setShowScrollUpPill(true);
          setShowFloatingButtons(true);
        } else {
          // Near the top, standard search shows up, helper hides
          setShowOptions(true);
          setShowScrollUpPill(false);
          setShowFloatingButtons(false);
        }
      }
      
      lastY = currentY <= 0 ? 0 : currentY;
      ticking = false;
    };

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(updateScrollDir);
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  if (loading) return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex items-center justify-between mb-8">
        <div className="h-10 w-48 bg-stone-100 animate-pulse rounded-xl" />
        <div className="h-10 w-32 bg-stone-100 animate-pulse rounded-xl" />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
        {[...Array(12)].map((_, i) => (
          <ProductSkeleton key={i} />
        ))}
      </div>
    </div>
  );

  const isFilterActive = selectedCategory !== 'All' || onSaleOnly || selectedRating !== null || minPrice !== '0' || (maxPrice !== '' && products.length > 0 && maxPrice !== Math.max(...products.map(p => getProductPrice(p, user?.role))).toString()) || sortBy !== 'relevance';

  // Rendering Main Return
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 pb-32 md:pb-10 space-y-8 relative">

      {/* Zoom Modal */}
      <AnimatePresence>
        {zoomImage && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm"
            onClick={() => setZoomImage(null)}
          >
            <button 
              onClick={() => setZoomImage(null)}
              className="absolute top-6 right-6 p-2 bg-white/20 text-white rounded-full hover:bg-white/30"
            >
              <X size={24} />
            </button>
            <motion.img 
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              src={zoomImage}
              alt="Zoomed"
              className="max-w-full max-h-full object-contain"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quick View Modal */}
      <AnimatePresence>
        {quickViewProduct && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-4xl rounded-3xl overflow-hidden shadow-2xl relative"
            >
              <button 
                onClick={() => setQuickViewProduct(null)}
                className="absolute top-6 right-6 p-2 bg-white/80 backdrop-blur-md rounded-full shadow-lg z-10 hover:scale-110 transition-transform"
              >
                <X size={20} />
              </button>
              
              <div className="flex flex-col md:flex-row max-h-[90vh] md:max-h-none overflow-y-auto md:overflow-visible no-scrollbar">
                <div className="md:w-1/2 h-[300px] md:h-[600px] relative">
                  {showImages ? (
                    <img 
                      src={quickViewProduct.image_url || `https://picsum.photos/seed/${quickViewProduct.id}/800/800`} 
                      alt={quickViewProduct.name}
                      className="w-full h-full object-cover bg-stone-100"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-stone-100 text-stone-400">
                      <Camera size={48} />
                    </div>
                  )}
                </div>
                <div className="md:w-1/2 p-6 md:p-12 space-y-8 overflow-y-auto no-scrollbar">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-primary bg-primary/10 px-3 py-1 rounded-full">{quickViewProduct.category}</span>
                    <h2 className="text-3xl font-black mt-4">{quickViewProduct.name}</h2>
                    <div className="flex items-center space-x-2 mt-2">
                      <div className="flex text-amber-400">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} size={14} fill={i < Math.floor(quickViewProduct.avg_rating || 5) ? "currentColor" : "none"} />
                        ))}
                      </div>
                      <span className="text-xs text-stone-400 font-bold">({quickViewProduct.review_count || 0} reviews)</span>
                    </div>
                  </div>
                  
                  <div className="flex flex-col">
                    <div className="flex items-baseline space-x-3">
                      <span className="text-4xl font-black text-primary">₹{getProductPrice(quickViewProduct, user?.role)}</span>
                      {getProductPrice(quickViewProduct, user?.role) < quickViewProduct.price && (
                        <span className="text-xl text-stone-300 line-through font-bold">₹{quickViewProduct.price}</span>
                      )}
                    </div>
                    {user?.role === 'wholesaler' && quickViewProduct.wholesale_price && (
                       <span className="text-[10px] font-black text-accent uppercase tracking-widest mt-1">Wholesale Account Price</span>
                    )}
                    {user?.role === 'retailer' && quickViewProduct.retail_price && (
                       <span className="text-[10px] font-black text-secondary uppercase tracking-widest mt-1">Retailer Account Price</span>
                    )}
                  </div>
                  
                  <p className="text-stone-600 leading-relaxed">{quickViewProduct.description}</p>
                  
                    <div className="pt-6 border-t border-stone-100 flex gap-4">
                      {quickViewProduct.stock <= 0 ? (
                        <div className="flex-1 bg-stone-100 text-stone-400 py-4 flex items-center justify-center rounded-2xl font-bold uppercase tracking-widest text-sm border-2 border-stone-200">
                           Out of Stock
                        </div>
                      ) : (
                        <button 
                          onClick={() => {
                            addToCart(quickViewProduct);
                            setQuickViewProduct(null);
                          }}
                          className="flex-1 btn-primary py-4 flex items-center justify-center space-x-2"
                        >
                          <ShoppingCart size={20} />
                          <span>{t('add_to_cart')}</span>
                        </button>
                      )}
                      
                      <button 
                        onClick={(e) => {
                          e.preventDefault();
                          const url = `${window.location.origin}/product/${quickViewProduct.id}`;
                          if (navigator.share) {
                            navigator.share({ title: quickViewProduct.name, url });
                          } else {
                            navigator.clipboard.writeText(url);
                            toast.success('Link copied');
                          }
                        }}
                        className="px-4 py-4 border border-stone-200 rounded-2xl text-stone-600 hover:text-primary hover:bg-stone-50 transition-colors flex items-center justify-center"
                        title="Share Product"
                      >
                        <Share2 size={20} />
                      </button>

                      <Link 
                        to={`/product/${quickViewProduct.id}`}
                        className="px-6 py-4 border border-stone-200 rounded-2xl font-bold hover:bg-stone-50 transition-colors flex items-center justify-center text-sm uppercase tracking-widest"
                      >
                        {t('view_details') || 'View Details'}
                      </Link>
                    </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="flex flex-col">
        {/* Modern Top Navigation & Filter Bar - Enhanced for better stickiness */}
        <div 
          id="filter-section" 
          className={cn(
            "sticky z-40 bg-stone-50/80 backdrop-blur-xl px-4 md:px-0 -mx-4 md:mx-0 transition-transform duration-300 border-b border-stone-200/50 mb-6", 
            stickyTop,
            (showOptions || !isMobile) ? "translate-y-0 opacity-100" : "-translate-y-[110%] opacity-0 pointer-events-none"
          )}
        >
          <div className="max-w-7xl mx-auto py-4 space-y-4">
            <div className="flex flex-col md:flex-row gap-4 items-center">
            {/* Search - More prominent with better focus states & Entrance animation */}
            <motion.div 
              initial={{ y: -10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="relative flex-1 group w-full"
            >
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 group-focus-within:text-primary transition-colors" size={18} />
              <input 
                type="text" 
                placeholder={t('find_something_special') || "Find something special..."}
                className="w-full bg-white border-2 border-stone-100 rounded-2xl py-3.5 pl-12 pr-4 focus:border-primary/20 focus:ring-4 focus:ring-primary/5 transition-all text-sm font-medium outline-none placeholder:text-stone-400 shadow-sm hover:shadow-md"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </motion.div>
            
            <div className="grid grid-cols-3 gap-2 w-full md:flex md:items-center py-0.5 animate-fade-in">
               {/* Quick Filters & Sorting - Strictly non-scrollable on mobile */}
               <motion.button
                 whileTap={{ scale: 0.95 }}
                 onClick={() => setOnSaleOnly(!onSaleOnly)}
                 className={cn(
                   "w-full flex items-center justify-center space-x-1 px-1.5 py-3.5 rounded-2xl font-black text-[9px] uppercase tracking-[0.05em] transition-all whitespace-nowrap border-2",
                   onSaleOnly ? "bg-accent border-accent text-white shadow-lg shadow-accent/30" : "bg-stone-50 border-stone-100 text-stone-400 hover:bg-stone-100"
                 )}
               >
                 <Zap size={10} fill={onSaleOnly ? "currentColor" : "none"} />
                 <span>On Sale</span>
               </motion.button>
               
               
               <div className="relative w-full">
                 <select 
                   value={sortBy}
                   onChange={(e) => setSortBy(e.target.value)}
                   className="w-full text-center appearance-none bg-stone-50 border-2 border-stone-100 text-stone-600 px-1 py-3.5 rounded-2xl font-black text-[9px] uppercase tracking-[0.05em] transition-all outline-none focus:border-primary/20"
                 >
                   <option value="relevance">Recommend</option>
                   <option value="price-low">Price: Low</option>
                   <option value="price-high">Price: High</option>
                   <option value="rating">Top Rated</option>
                   <option value="popularity">Trending</option>
                 </select>
               </div>
               
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsFilterOpen(true)}
                  className={cn(
                    "w-full flex items-center justify-center space-x-1 px-1.5 py-3.5 rounded-2xl font-black text-[9px] uppercase tracking-[0.05em] transition-all whitespace-nowrap border-2",
                    isFilterActive
                      ? "bg-primary border-primary text-white shadow-lg shadow-primary/30 ring-4 ring-primary/10" 
                      : "bg-stone-900 border-stone-900 text-white hover:bg-stone-800"
                  )}
                >
                  <Filter size={10} />
                  <span>Filters {isFilterActive ? '•' : ''}</span>
                </motion.button>
            </div>
          </div>

          <div className="flex flex-col gap-3">

            {/* Active Filter Chips */}
            {(selectedCategory !== 'All' || onSaleOnly || selectedRating !== null || minPrice !== '0' || sortBy !== 'relevance' || searchTerm) && (
              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-stone-50">
                <span className="text-[9px] font-black uppercase tracking-tighter text-stone-400 mr-1">Active:</span>
                {searchTerm && (
                  <div className="flex items-center gap-1.5 bg-stone-100 px-3 py-1.5 rounded-lg text-[10px] font-bold text-stone-600">
                    <span>"{searchTerm}"</span>
                    <button onClick={() => setSearchTerm('')}><X size={10} /></button>
                  </div>
                )}
                {selectedCategory !== 'All' && (
                  <div className="flex items-center gap-1.5 bg-primary/10 px-3 py-1.5 rounded-lg text-[10px] font-bold text-primary">
                    <span>{selectedCategory}</span>
                    <button onClick={() => setSelectedCategory('All')}><X size={10} /></button>
                  </div>
                )}
                {onSaleOnly && (
                  <div className="flex items-center gap-1.5 bg-accent/10 px-3 py-1.5 rounded-lg text-[10px] font-bold text-accent">
                    <span>On Sale</span>
                    <button onClick={() => setOnSaleOnly(false)}><X size={10} /></button>
                  </div>
                )}
                {selectedRating !== null && (
                  <div className="flex items-center gap-1.5 bg-amber-50 px-3 py-1.5 rounded-lg text-[10px] font-bold text-amber-600">
                    <span className="flex items-center">{selectedRating}+ <Star size={8} className="ml-0.5" fill="currentColor" /></span>
                    <button onClick={() => setSelectedRating(null)}><X size={10} /></button>
                  </div>
                )}
                {minPrice !== '0' && (
                  <div className="flex items-center gap-1.5 bg-stone-100 px-3 py-1.5 rounded-lg text-[10px] font-bold text-stone-600">
                    <span>Min: ₹{minPrice}</span>
                    <button onClick={() => setMinPrice('0')}><X size={10} /></button>
                  </div>
                )}
                <button 
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedCategory('All');
                    setSelectedRating(null);
                    setMinPrice('0');
                    setOnSaleOnly(false);
                    setSortBy('relevance');
                  }}
                  className="text-[9px] font-black uppercase tracking-widest text-primary hover:underline ml-auto"
                >
                  Clear All
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

    {/* Right Slide-Over Mobile Filters Drawer */}
        <AnimatePresence>
          {isFilterOpen && (
            <>
              {/* Semi-transparent Overlay */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsFilterOpen(false)}
                className="fixed inset-0 bg-stone-900/60 backdrop-blur-md z-[60] overscroll-none"
              />
              
              {/* Drawer Container */}
              <div className="fixed inset-y-0 right-0 z-[70] flex justify-end pointer-events-none w-full">
              <motion.div 
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "spring", damping: 28, stiffness: 220 }}
                className="bg-white w-full max-w-sm h-full shadow-[0_0_50px_rgba(0,0,0,0.15)] flex flex-col pointer-events-auto border-l border-stone-150 relative pb-safe"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-6 border-b border-stone-100 flex items-center justify-between bg-stone-50/50 shrink-0">
                  <div>
                    <h2 className="text-xl font-black text-stone-900">Filters</h2>
                    <p className="text-stone-400 text-[10px] font-black uppercase tracking-widest">Personalize your feed</p>
                  </div>
                  <button 
                    onClick={() => setIsFilterOpen(false)}
                    className="p-3 bg-white rounded-2xl hover:bg-stone-50 transition-all shadow-sm border border-stone-100 text-stone-500 hover:text-stone-900"
                  >
                    <X size={20} />
                  </button>
                </div>

                  {/* Scrollable Filters Body */}
                  <div className="flex-1 overflow-y-auto p-6 space-y-8 no-scrollbar">
                    {/* Filter Categories Display */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <LayoutGrid size={14} className="text-primary" />
                        <h3 className="text-[9px] font-black uppercase tracking-[0.2em] text-stone-400">Shop Categories</h3>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {storeCategories.map(cat => (
                          <button
                            key={cat}
                            onClick={() => setSelectedCategory(cat)}
                            className={cn(
                              "py-3 px-2 rounded-xl border-2 transition-all text-center text-[9px] font-black uppercase tracking-wider",
                              selectedCategory === cat 
                                ? "border-stone-900 bg-stone-900 text-white shadow-xl shadow-stone-900/20" 
                                : "border-stone-100 bg-white text-stone-500 hover:border-stone-200 hover:bg-stone-50"
                            )}
                          >
                            {cat}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Sorting Section */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <ArrowDownNarrowWide size={14} className="text-primary" />
                        <h3 className="text-[9px] font-black uppercase tracking-[0.2em] text-stone-400">Sort Collection</h3>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { id: 'relevance', label: 'Recommended' },
                          { id: 'popularity', label: 'Trending' },
                          { id: 'price-low', label: 'Price: Low' },
                          { id: 'price-high', label: 'Price: High' },
                          { id: 'rating', label: 'Top Rated' },
                          { id: 'newest', label: 'Newest' },
                        ].map(option => (
                          <button
                            key={option.id}
                            onClick={() => setSortBy(option.id)}
                            className={cn(
                              "py-3 px-4 rounded-xl border-2 transition-all text-center text-[10px] font-black uppercase tracking-wider",
                              sortBy === option.id 
                                ? "border-stone-900 bg-stone-900 text-white shadow-xl shadow-stone-900/20" 
                                : "border-stone-100 bg-white text-stone-400 hover:border-stone-200 hover:bg-stone-50"
                            )}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Price Presets */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <Zap size={14} className="text-primary" />
                        <h3 className="text-[9px] font-black uppercase tracking-[0.2em] text-stone-400">Smart Price Ranges</h3>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { min: '0', max: '200', label: 'Budget' },
                          { min: '200', max: '500', label: 'Mid-Range' },
                          { min: '500', max: '2000', label: 'Premium' },
                          { min: '2000', max: '10000', label: 'Wholesale' }
                        ].map((range, idx) => (
                          <motion.button
                            key={idx}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            onClick={() => {
                              setMinPrice(range.min);
                              setMaxPrice(range.max);
                            }}
                            className={cn(
                              "py-3 px-4 rounded-xl border-2 text-[10px] font-black uppercase tracking-widest transition-all",
                              minPrice === range.min && maxPrice === range.max 
                                ? "border-stone-900 bg-stone-900 text-white shadow-xl shadow-stone-900/20" 
                                : "border-stone-100 bg-white text-stone-400 hover:border-stone-200"
                            )}
                          >
                            {range.label} (₹{range.max})
                          </motion.button>
                        ))}
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3 pt-2">
                        <div className="space-y-1">
                          <label className="text-[8px] font-black uppercase text-stone-400 tracking-tighter">Min</label>
                          <input 
                            type="number" 
                            value={minPrice} 
                            onChange={(e) => setMinPrice(e.target.value)} 
                            className="w-full bg-stone-50 border border-stone-100 rounded-lg p-2 text-xs font-bold outline-none focus:border-primary/20"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[8px] font-black uppercase text-stone-400 tracking-tighter">Max</label>
                          <input 
                            type="number" 
                            value={maxPrice} 
                            onChange={(e) => setMaxPrice(e.target.value)} 
                            className="w-full bg-stone-50 border border-stone-100 rounded-lg p-2 text-xs font-bold outline-none focus:border-primary/20"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Rating Selector */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <Star size={14} className="text-secondary" />
                        <h3 className="text-[9px] font-black uppercase tracking-[0.2em] text-stone-400">Ratings</h3>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {[5, 4, 3, 2].map(rating => (
                          <button
                            key={rating}
                            onClick={() => setSelectedRating(selectedRating === rating ? null : rating)}
                            className={cn(
                              "px-4 py-2 rounded-xl border transition-all text-[10px] font-bold flex items-center gap-1.5",
                              selectedRating === rating 
                                ? "border-amber-400 bg-amber-50 text-amber-700" 
                                : "border-stone-100 text-stone-500 hover:bg-stone-50"
                            )}
                          >
                            {rating} <Star size={10} fill="currentColor" />
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Sale Toggle */}
                    <div className="bg-stone-50 p-4 rounded-xl border border-stone-100 flex items-center justify-between animate-fade-in">
                       <div className="flex flex-col">
                         <span className="text-[10px] font-black uppercase tracking-tight text-stone-900">On Sale Only</span>
                         <span className="text-[8px] font-bold text-stone-400">Show discounts</span>
                       </div>
                       <button
                         onClick={() => setOnSaleOnly(!onSaleOnly)}
                         className={cn(
                           "relative w-10 h-5 rounded-full transition-colors",
                           onSaleOnly ? "bg-accent" : "bg-stone-200"
                         )}
                       >
                         <motion.div 
                           animate={{ x: onSaleOnly ? 22 : 4 }}
                           className="absolute top-1 w-3 h-3 bg-white rounded-full shadow-sm"
                         />
                       </button>
                    </div>
                  </div>

                  {/* Apply & Reset Buttons */}
                  <div className="p-6 bg-white border-t border-stone-150 flex items-center justify-between shrink-0">
                    <button 
                      onClick={() => { 
                        setSearchTerm(''); 
                        setSelectedCategory('All'); 
                        setSelectedRating(null); 
                        setMinPrice('0'); 
                        const maxP = Math.max(...products.map(p => getProductPrice(p, user?.role)));
                        setMaxPrice(maxP.toString());
                        setOnSaleOnly(false);
                        setSortBy('relevance');
                        toast.success('Filters cleared');
                      }} 
                      className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-400 hover:text-primary transition-colors"
                    >
                      Clear All
                    </button>
                    <button 
                      onClick={() => {
                        setIsFilterOpen(false);
                        toast.success('Filters applied');
                      }}
                      className="px-6 py-3.5 bg-stone-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-stone-900/25 hover:scale-105 active:scale-95 transition-all"
                    >
                      Apply Filters ({filteredProducts.length})
                    </button>
                  </div>
                </motion.div>
              </div>
            </>
          )}
        </AnimatePresence>


        {/* Full-Width Grid Content */}
        <div className="w-full">
      <motion.div 
        layout
        initial="hidden"
        animate="visible"
        variants={{
          hidden: { opacity: 0 },
          visible: {
            opacity: 1,
            transition: {
              staggerChildren: 0.05
            }
          }
        }}
        className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6"
      >
        <AnimatePresence mode="popLayout">
        {filteredProducts.map((product) => {
          const cartItem = cart.find(item => item.id === product.id);
          
          return (
            <motion.div 
              key={product.id}
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              whileHover={{ 
                y: -10,
                transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] }
              }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="relative bg-white rounded-2xl overflow-hidden shadow-sm border border-stone-100 hover:shadow-2xl hover:shadow-stone-200/50 hover:border-primary/20 transition-all duration-300 flex flex-col p-3 z-0 hover:z-10"
            >
              <Link 
                to={`/product/${product.id}`} 
                className="relative aspect-[4/3] w-[calc(100%+1.5rem)] overflow-hidden block group/image mb-2 -mx-3 -mt-3 rounded-t-2xl bg-stone-50"
              >
                {showImages ? (
                  <motion.img 
                    src={product.image_url || `https://picsum.photos/seed/${product.id}/600/600`} 
                    alt={product.name}
                    loading="lazy"
                    referrerPolicy="no-referrer"
                    whileHover={{ scale: 1.1 }}
                    transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                    className="w-full h-full object-cover bg-stone-100 animate-fade-in"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-stone-100 text-stone-400">
                    <Camera size={24} />
                  </div>
                )}
                
                <div className="absolute top-2 left-2 flex flex-col space-y-1 z-20">
                    {product.discount > 0 && (
                      <div className="bg-red-600 text-white px-3 py-1.5 rounded-[0.5rem] text-[11px] font-black uppercase tracking-widest shadow-xl shadow-red-500/20 animate-pulse border border-red-400/30">
                        {product.discount}% OFF
                      </div>
                    )}
                </div>

                <div className="absolute inset-0 bg-black/0 group-hover/image:bg-black/10 transition-colors duration-300" />
                
                <button 
                  onClick={(e) => handleEnlargeImage(e, product.image_url || `https://picsum.photos/seed/${product.id}/800/800`)}
                  className="absolute bottom-4 right-4 p-3 bg-white/80 backdrop-blur-md text-stone-900 rounded-[1.25rem] opacity-0 group-hover/image:opacity-100 transform translate-y-2 group-hover/image:translate-y-0 transition-all duration-300 shadow-xl border border-stone-100 hover:bg-stone-900 hover:text-white"
                  title="Enlarge View"
                >
                  <Maximize2 size={16} strokeWidth={3} />
                </button>
              </Link>
              
              <div className="flex-1 flex flex-col">
                <Link to={`/product/${product.id}`} className="mb-2 block group">
                  <h3 className="text-sm font-black text-stone-900 group-hover:text-primary transition-colors leading-tight line-clamp-2 min-h-[2.5rem] max-h-[2.5rem] overflow-hidden text-ellipsis break-words">{product.name}</h3>
                </Link>
                
                <div className="mt-auto flex items-center justify-between pt-2 border-t border-stone-50">
                  <div className="flex flex-col">
                    <span className="text-sm font-black text-primary">₹{getProductPrice(product, user?.role)}</span>
                    {product.discount > 0 && (
                      <span className="text-[10px] text-stone-400 line-through font-bold">₹{product.price}</span>
                    )}
                  </div>

                  {product.stock <= 0 ? (
                    <div className="text-[9px] uppercase font-black text-stone-400 bg-stone-100 px-3 py-2 rounded-xl border border-stone-200">Out of Stock</div>
                  ) : cartItem ? (
                     <div className="flex items-center bg-stone-950 text-white rounded-[1.25rem] p-1.5 shadow-xl border border-stone-800">
                        <button onClick={() => updateQuantity(product.id, -1)} className="p-2 px-3 hover:bg-white/10 rounded-xl transition-all active:scale-90"><Minus size={18} strokeWidth={4} /></button>
                        <span className="font-black text-sm px-2 min-w-[1.5rem] text-center">{cartItem.quantity}</span>
                        <button onClick={() => updateQuantity(product.id, 1)} className="p-2 px-3 hover:bg-white/10 rounded-xl transition-all active:scale-90"><Plus size={18} strokeWidth={4} /></button>
                     </div>
                  ) : (
                    <motion.button 
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => addToCart(product)}
                      className="bg-stone-950 text-white p-4 rounded-[1.25rem] shadow-2xl shadow-stone-900/20 transition-all flex items-center justify-center group/btn border border-stone-800"
                    >
                      <Plus size={20} strokeWidth={4} className="group-hover/btn:scale-110 transition-transform" />
                    </motion.button>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
        </AnimatePresence>
      </motion.div>

      {filteredProducts.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 px-4">
          <div className="flex flex-col items-center text-center space-y-8 max-w-lg">
            <div className="relative">
              <div className="w-24 h-24 bg-stone-50 rounded-full flex items-center justify-center animate-pulse">
                <ShoppingBag className="text-stone-300" size={48} />
              </div>
              <div className="absolute -bottom-2 -right-2 bg-white p-2 rounded-full shadow-lg">
                <Search size={20} className={cn("text-primary", loadFailed && "text-red-500")} />
              </div>
            </div>
            
            <div className="space-y-3">
              <h3 className="text-2xl font-black text-stone-900 uppercase tracking-tight">
                {loadFailed ? 'Service Temporarily Offline' : 'No products match your search'}
              </h3>
              <p className="text-stone-500 font-medium leading-relaxed">
                {loadFailed 
                  ? 'We are currently unable to connect to the store database. The search service is temporarily offline, but all navigation menus and dashboard elements remain fully responsive.' 
                  : "We couldn't find anything matching your current filters. Try adjusting your price range or exploring different categories."
                }
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full">
              {loadFailed ? (
                <button 
                  onClick={() => fetchProducts()}
                  className="flex-1 px-8 py-4 bg-primary text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  Retry Connection
                </button>
              ) : (
                <>
                  <button 
                    onClick={() => {
                      setSearchTerm('');
                      setSelectedCategory('All');
                      setSelectedRating(null);
                      setMinPrice('0');
                      setMaxPrice('');
                      setOnSaleOnly(false);
                      setSortBy('relevance');
                      toast.success('Filters cleared');
                    }}
                    className="flex-1 px-8 py-4 bg-primary text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                  >
                    Reset All Filters
                  </button>
                  <button 
                    onClick={() => setIsFilterOpen(true)}
                    className="flex-1 px-8 py-4 bg-white text-stone-900 border-2 border-stone-100 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-stone-50 transition-all border-dashed"
                  >
                    Refine Selection
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Dynamic Pop-up Sliding Welcome for Automatic Scroll back to Top */}
      <AnimatePresence>
        {showScrollUpPill && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 280, damping: 22 }}
            className="fixed bottom-[88px] left-1/2 -translate-x-1/2 z-50 pointer-events-auto"
          >
            <button
              onClick={() => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
                setShowScrollUpPill(false);
                setShowOptions(true);
              }}
              className="bg-stone-900 border border-stone-800/80 text-white px-6 py-3.5 rounded-full shadow-[0_20px_40px_rgba(0,0,0,0.25)] flex items-center space-x-3 text-[10px] font-black uppercase tracking-widest hover:bg-stone-800 focus:outline-none ring-4 ring-primary/20 backdrop-blur-md active:scale-95 transition-all"
            >
              <ArrowUpNarrowWide size={12} className="text-primary animate-bounce" />
              <span>Scroll to Search & Filters?</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Buttons */}
      {showFloatingButtons && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0 }}
          className="fixed bottom-24 right-6 md:bottom-10 z-40 flex flex-col gap-4"
        >
          <button 
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="p-4 bg-white text-primary rounded-2xl shadow-indigo-500/10 shadow-2xl hover:scale-110 active:scale-95 transition-all border border-stone-100"
            aria-label="Scroll to top"
          >
            <ArrowUpNarrowWide size={isMobile ? 24 : 20} />
          </button>
          <a 
            href="tel:+919876543210" 
            className="p-4 bg-primary text-white rounded-2xl shadow-indigo-500/20 shadow-2xl hover:scale-110 active:scale-95 transition-all"
            aria-label="Call Support"
          >
            <span className="sr-only">Call Support</span>
            <svg xmlns="http://www.w3.org/2000/svg" width={isMobile ? 24 : 20} height={isMobile ? 24 : 20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
          </a>
        </motion.div>
      )}
      </div>
    </div>
  </div>
  );
}
