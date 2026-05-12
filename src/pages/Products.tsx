import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, Filter, ShoppingCart, Plus, Minus, 
  Share2, Heart, Star, Loader2, X, Camera,
  Zap, LayoutGrid, ArrowDownNarrowWide, ArrowUpNarrowWide, Clock
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { Product, cn } from '../types';
import { useStore } from '../StoreContext';
import { useDeviceType } from '../lib/device';
import toast from 'react-hot-toast';
import { db as fsDb, handleFirestoreError, OperationType, collection, getDocs, query, where } from '../firebase';

export default function Products() {
  const location = useLocation();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const search = params.get('search');
    if (search) {
      setSearchTerm(search);
    }
  }, [location.search]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedRating, setSelectedRating] = useState<number | null>(null);
  const [minPrice, setMinPrice] = useState('0');
  const [maxPrice, setMaxPrice] = useState('');
  const [sortBy, setSortBy] = useState('relevance');
  const [onSaleOnly, setOnSaleOnly] = useState(false);
  const [hoverQuickView, setHoverQuickView] = useState<number | null>(null);
  const { t, addToCart, cart, updateQuantity, wishlist, toggleWishlist, user, getProductPrice, simulatedRole, config } = useStore();
  const showImages = config.find(c => c.key === 'feature_show_product_images')?.value !== 'false';
  const { isMobile, isTablet } = useDeviceType();
  const activeRole = simulatedRole || user?.role;

  const [error, setError] = useState<string | null>(null);

  // Use dynamic sticky top based on device
  const stickyTop = isMobile ? 'top-[56px]' : 'top-[64px]';

  const fetchProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Try local API
      console.log('Fetching products from /api/products...');
      const res = await fetch('/api/products');
      if (res.ok) {
        const data = await res.json();
        console.log('Fetched products:', data.length);
        setProducts(data);
        if (data.length > 0) {
          const maxP = Math.max(...data.map((p: Product) => getProductPrice(p, user?.role)));
          setMaxPrice(maxP.toString());
        }
        return;
      } else {
        console.warn('API returned non-ok status:', res.status);
      }
      
      // 2. If API fails, try direct Firestore fallback (User request: "stored in the Firebase")
      console.log('API failed, attempting Firestore fallback...');
      try {
        const q = query(collection(fsDb, 'products'), where('is_listed', '==', true));
        let snapshot;
        try {
          snapshot = await getDocs(q);
        } catch (error) {
          handleFirestoreError(error, OperationType.GET, 'products');
        }
        
        const fbData = snapshot!.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
        console.log('Fetched products from Firestore:', fbData.length);
        
        if (fbData.length > 0) {
          setProducts(fbData);
          const maxP = Math.max(...fbData.map((p: any) => getProductPrice(p as any, user?.role)));
          setMaxPrice(maxP.toString());
          toast.success('Loaded products from backup source');
        } else {
          throw new Error('No products found in backup');
        }
      } catch (fbErr: any) {
        throw new Error(`Primary and backup sources failed. ${fbErr.message}`);
      }
    } catch (err: any) {
      console.error('Products fetch error:', err);
      setError(err.message || 'Something went wrong');
      toast.error('Could not load products. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();

    // Real-Time Inventory Management WebSocket
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}`;
    const socket = new WebSocket(wsUrl);

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'INVENTORY_UPDATE') {
          setProducts(prevProducts => prevProducts.map(p => {
            if (p.id === data.product_id) {
              return { ...p, stock: data.stock };
            }
            return p;
          }));
        }
      } catch (e) {}
    };

    return () => {
      socket.close();
    };
  }, [user?.role]);

  const filteredProducts = products
    .filter(p => {
      const activePrice = getProductPrice(p, user?.role);
      const searchTerms = searchTerm.toLowerCase().trim().split(' ').filter(Boolean);
      
      const matchesSearch = searchTerms.length === 0 || searchTerms.every(term => 
        (p.name?.toLowerCase() || '').includes(term) || 
        (p.description?.toLowerCase() || '').includes(term) ||
        (p.category?.toLowerCase() || '').includes(term) ||
        (p.variants?.some(v => v.name?.toLowerCase().includes(term)) || false)
      );

      const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
      const matchesRating = selectedRating === null || Math.floor(p.avg_rating || 0) >= selectedRating;
      const matchesMinPrice = activePrice >= Number(minPrice);
      const matchesMaxPrice = maxPrice === '' || activePrice <= Number(maxPrice);
      const matchesSale = !onSaleOnly || p.discount > 0;
      return matchesSearch && matchesCategory && matchesMinPrice && matchesMaxPrice && matchesRating && matchesSale && p.is_listed;
    })
      .sort((a, b) => {
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
          default:
            return 0; // Relevance
        }
      });

  const categories = ['All', ...new Set(products.map(p => p.category))];

  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [zoomImage, setZoomImage] = useState<string | null>(null);
  const [showFloatingButtons, setShowFloatingButtons] = useState(false);

  // Body scroll lock
  useEffect(() => {
    if (isFilterOpen || quickViewProduct) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isFilterOpen, quickViewProduct]);

  useEffect(() => {
    const handleScroll = () => {
      setShowFloatingButtons(window.scrollY > 300);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center space-y-4">
        <Loader2 className="animate-spin h-12 w-12 text-primary" />
        <p className="text-stone-500 font-medium">{t('loading_products') || 'Loading products...'}</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="bg-white p-8 rounded-3xl shadow-xl border border-stone-100 max-w-md w-full text-center space-y-6">
        <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto">
          <X size={32} />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-black text-stone-900">{t('failed_load_products') || 'Failed to load products'}</h2>
          <p className="text-stone-500">{error}</p>
        </div>
        <button 
          onClick={() => fetchProducts()}
          className="w-full btn-primary py-4"
        >
          {t('try_again') || 'Try Again'}
        </button>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 pb-32 md:pb-10 space-y-8">
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
              
              <div className="flex flex-col md:flex-row">
                <div className="md:w-1/2 h-[300px] md:h-[500px] relative">
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
                  <button
                    onClick={() => setZoomImage(quickViewProduct.image_url)}
                    className="absolute top-4 left-4 p-2 bg-white/80 backdrop-blur-sm rounded-full hover:bg-white transition-colors"
                  >
                    <Camera size={20} />
                  </button>
                </div>
                <div className="md:w-1/2 p-8 space-y-6 overflow-y-auto max-h-[500px]">
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

      <div className="flex flex-col gap-6">
        {/* Modern Top Navigation & Filter Bar - Enhanced for better stickiness and mobile detection */}
        <div className={cn("sticky pb-4 z-40 bg-stone-50 bg-opacity-90 backdrop-blur-xl px-4 md:px-0 -mx-4 md:mx-0 transition-all", stickyTop)}>
          <div className="bg-white p-4 rounded-3xl border border-stone-100 shadow-xl shadow-stone-200/40 space-y-4">
            <div className="flex flex-col md:flex-row gap-4 items-center">
            {/* Search - More prominent with better focus states */}
            <div className="relative flex-1 group w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 group-focus-within:text-primary transition-colors" size={18} />
              <input 
                type="text" 
                placeholder="Find something special..."
                className="w-full bg-stone-50 border-2 border-transparent rounded-2xl py-3.5 pl-12 pr-4 focus:border-primary/20 focus:bg-white transition-all text-sm font-black outline-none placeholder:text-stone-300 placeholder:font-bold"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto hide-scrollbar touch-pan-x">
               {/* Quick Filters & Sorting */}
               <motion.button
                 whileTap={{ scale: 0.95 }}
                 onClick={() => setOnSaleOnly(!onSaleOnly)}
                 className={cn(
                   "flex items-center space-x-2 px-5 py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all whitespace-nowrap border-2",
                   onSaleOnly ? "bg-accent border-accent text-white shadow-lg shadow-accent/30" : "bg-stone-50 border-stone-100 text-stone-400 hover:bg-stone-100"
                 )}
               >
                 <Zap size={12} fill={onSaleOnly ? "currentColor" : "none"} />
                 <span>On Sale</span>
               </motion.button>
               
               <div className="relative">
                 <select 
                   value={sortBy}
                   onChange={(e) => setSortBy(e.target.value)}
                   className="appearance-none bg-stone-50 border-2 border-stone-100 text-stone-600 px-5 py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all whitespace-nowrap outline-none focus:border-primary/20"
                 >
                   <option value="relevance">Recommended</option>
                   <option value="price-low">Price: Low to High</option>
                   <option value="price-high">Price: High to Low</option>
                   <option value="rating">Top Rated</option>
                   <option value="popularity">Trending</option>
                 </select>
               </div>
               
               <motion.button
                 whileTap={{ scale: 0.95 }}
                 onClick={() => setIsFilterOpen(true)}
                 className={cn(
                   "flex items-center space-x-2 px-5 py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all whitespace-nowrap border-2",
                   (selectedRating !== null || minPrice !== '0' || maxPrice !== '' || sortBy !== 'relevance') 
                     ? "bg-primary border-primary text-white shadow-lg shadow-primary/30" 
                     : "bg-stone-900 border-stone-900 text-white hover:bg-stone-800"
                 )}
               >
                 <Filter size={12} />
                 <span>Filters {(selectedRating !== null || minPrice !== '0' || (maxPrice !== '' && maxPrice !== Math.max(...products.map(p => getProductPrice(p, user?.role))).toString()) || sortBy !== 'relevance') && '•'}</span>
               </motion.button>
            </div>
          </div>
        </div>

          <div className="flex flex-col gap-3">
            {/* Quick Categories Bar */}
            <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={cn(
                    "px-5 py-3 md:py-2 min-h-[44px] md:min-h-0 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap border-2",
                    selectedCategory === cat 
                      ? "bg-primary border-primary text-white shadow-lg shadow-primary/20 scale-105" 
                      : "bg-white border-stone-100 text-stone-400 hover:border-stone-200 hover:text-stone-600"
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>

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

      {/* Filter Drawer Overlay */}
        <AnimatePresence>
          {isFilterOpen && (
            <>
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsFilterOpen(false)}
                className="fixed inset-0 bg-stone-900/60 backdrop-blur-md z-[60] overscroll-none"
              />
              <motion.div 
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="fixed top-0 right-0 h-full w-full max-w-sm bg-white z-[70] shadow-2xl flex flex-col overscroll-none"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-8 border-b border-stone-100 flex items-center justify-between bg-stone-50/50">
                  <div>
                    <h2 className="text-xl font-black text-stone-900">Filters</h2>
                    <p className="text-stone-400 text-[10px] font-black uppercase tracking-widest">Personalize your feed</p>
                  </div>
                  <button 
                    onClick={() => setIsFilterOpen(false)}
                    className="p-3 bg-white rounded-2xl hover:bg-stone-50 transition-all shadow-sm border border-stone-100"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-8 space-y-12 no-scrollbar">
                  {/* Sorting Section - Redesigned for visual clarity */}
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <ArrowDownNarrowWide size={16} className="text-primary" />
                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-400">Sort Collection</h3>
                      </div>
                      <span className="text-[9px] font-bold text-stone-300">Choose logic</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { id: 'relevance', label: 'Recommended', icon: Star },
                        { id: 'popularity', label: 'Trending', icon: Zap },
                        { id: 'price-low', label: 'Price: Low', icon: ArrowDownNarrowWide },
                        { id: 'price-high', label: 'Price: High', icon: ArrowUpNarrowWide },
                        { id: 'rating', label: 'Top Rated', icon: Star },
                        { id: 'newest', label: 'Newest', icon: Clock },
                      ].map(option => (
                        <button
                          key={option.id}
                          onClick={() => setSortBy(option.id)}
                          className={cn(
                            "group flex flex-col items-start p-4 rounded-2xl border-2 transition-all text-left space-y-3 relative overflow-hidden",
                            sortBy === option.id 
                              ? "border-primary bg-primary/5 text-primary" 
                              : "border-stone-50 text-stone-500 hover:border-stone-200 hover:bg-stone-50"
                          )}
                        >
                          {sortBy === option.id && (
                            <motion.div 
                              layoutId="sort-active-bg"
                              className="absolute top-0 right-0 w-8 h-8 bg-primary/10 rounded-bl-2xl flex items-center justify-center"
                            >
                              <div className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
                            </motion.div>
                          )}
                          <option.icon size={18} className={sortBy === option.id ? "text-primary" : "text-stone-300 group-hover:text-stone-400"} />
                          <span className="font-black text-[11px] leading-tight uppercase tracking-tight">{option.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Price Section - Bento style inputs */}
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Zap size={16} className="text-primary" />
                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-400">Cost Spectrum</h3>
                      </div>
                      <div className="text-[9px] font-bold text-stone-300 bg-stone-50 px-2 py-0.5 rounded-full">INR (₹)</div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-stone-50 p-5 rounded-[2rem] border border-stone-100 flex flex-col space-y-3 group focus-within:border-primary/20 transition-all">
                        <label className="text-[9px] font-black uppercase text-stone-400 tracking-tighter ml-1">Minimum</label>
                        <div className="flex items-center space-x-2">
                          <span className="text-stone-300 font-black text-xs">₹</span>
                          <input 
                            type="number" 
                            placeholder="0"
                            value={minPrice} 
                            onChange={(e) => setMinPrice(e.target.value)} 
                            className="bg-transparent font-black text-xl w-full outline-none placeholder:text-stone-200"
                          />
                        </div>
                        <div className="flex gap-1">
                          {[0, 100, 500].map(val => (
                            <button 
                              key={val}
                              onClick={() => setMinPrice(val.toString())}
                              className="text-[8px] font-black uppercase tracking-tighter text-stone-400 hover:text-primary"
                            >
                              {val === 0 ? 'Any' : `₹${val}`}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="bg-stone-50 p-5 rounded-[2rem] border border-stone-100 flex flex-col space-y-3 group focus-within:border-primary/20 transition-all">
                        <label className="text-[9px] font-black uppercase text-stone-400 tracking-tighter ml-1">Maximum</label>
                        <div className="flex items-center space-x-2">
                          <span className="text-stone-300 font-black text-xs">₹</span>
                          <input 
                            type="number" 
                            placeholder="Any"
                            value={maxPrice} 
                            onChange={(e) => setMaxPrice(e.target.value)} 
                            className="bg-transparent font-black text-xl w-full outline-none placeholder:text-stone-200"
                          />
                        </div>
                        <div className="flex gap-1 justify-end">
                          {[1000, 5000, 10000].map(val => (
                            <button 
                              key={val}
                              onClick={() => setMaxPrice(val.toString())}
                              className="text-[8px] font-black uppercase tracking-tighter text-stone-400 hover:text-primary"
                            >
                              ₹{val/1000}k
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Rating Section - Refined Star Selectors */}
                  <div className="space-y-6">
                    <div className="flex items-center gap-2">
                      <Star size={16} className="text-primary" />
                      <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-400">User Satisfaction</h3>
                    </div>
                    {/* On Sale Toggle in Drawer */}
                    <div className="bg-stone-50 p-4 rounded-2xl border border-stone-100 flex items-center justify-between mb-2">
                       <div className="flex items-center space-x-3">
                         <div className="p-2 bg-accent/10 rounded-lg text-accent">
                           <Zap size={16} fill="currentColor" />
                         </div>
                         <div className="flex flex-col">
                           <span className="text-[11px] font-black uppercase tracking-tight text-stone-900">On Sale Only</span>
                           <span className="text-[9px] font-bold text-stone-400">Show discounted items</span>
                         </div>
                       </div>
                       <button
                         onClick={() => setOnSaleOnly(!onSaleOnly)}
                         className={cn(
                           "relative w-12 h-6 rounded-full transition-colors",
                           onSaleOnly ? "bg-accent" : "bg-stone-200"
                         )}
                       >
                         <motion.div 
                           animate={{ x: onSaleOnly ? 24 : 4 }}
                           className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm"
                         />
                       </button>
                    </div>
                    <div className="space-y-3">
                      {[5, 4, 3, 2].map(rating => (
                        <button
                          key={rating}
                          onClick={() => setSelectedRating(selectedRating === rating ? null : rating)}
                          className={cn(
                            "w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-all relative overflow-hidden group",
                            selectedRating === rating 
                              ? "bg-amber-50/50 border-amber-300 text-amber-700" 
                              : "bg-white border-stone-50 text-stone-500 hover:border-amber-100"
                          )}
                        >
                          <div className="flex items-center space-x-3">
                            <div className="flex space-x-1">
                              {[...Array(5)].map((_, i) => (
                                <Star 
                                  key={i} 
                                  size={12} 
                                  className={cn(
                                    "transition-colors",
                                    i < rating ? "text-amber-400" : "text-stone-100"
                                  )} 
                                  fill="currentColor" 
                                />
                              ))}
                            </div>
                            <span className="font-black text-[11px] uppercase tracking-widest">{rating}+ Stars</span>
                          </div>
                          {selectedRating === rating ? (
                            <motion.div 
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="w-5 h-5 bg-amber-400 rounded-full flex items-center justify-center"
                            >
                              <div className="w-1.5 h-1.5 bg-white rounded-full" />
                            </motion.div>
                          ) : (
                            <span className="text-[9px] font-bold text-stone-300 group-hover:text-amber-200 transition-colors">Select Range</span>
                          )}
                        </button>
                      ))}
                      <button 
                         onClick={() => setSelectedRating(null)}
                         className={cn(
                           "w-full text-center py-3 text-[9px] font-black uppercase tracking-widest transition-colors",
                           selectedRating === null ? "text-primary bg-primary/5 rounded-xl border border-primary/10" : "text-stone-400 hover:text-stone-600"
                         )}
                      >
                        All Ratings
                      </button>
                    </div>
                  </div>
                </div>

                <div className="p-8 bg-white border-t border-stone-100 flex items-center justify-between">
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
                    }} 
                    className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-400 hover:text-primary transition-colors"
                  >
                    Reset
                  </button>
                  <button 
                    onClick={() => setIsFilterOpen(false)}
                    className="px-10 py-4 bg-primary text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-primary/25 hover:scale-105 active:scale-95 transition-all"
                  >
                    View Result
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>


        {/* Product Grid Content */}
        <div className="flex-1">
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
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8"
      >
        <AnimatePresence mode="popLayout">
        {filteredProducts.map((product) => {
          const cartItem = cart.find(item => item.id === product.id);
          
          return (
            <motion.div 
              key={product.id}
              layout
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: -20, transition: { duration: 0.2 } }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              onMouseEnter={() => setHoverQuickView(product.id)}
              onMouseLeave={() => setHoverQuickView(null)}
              className="relative bg-white rounded-3xl overflow-hidden shadow-sm border border-stone-100 hover:shadow-xl transition-all duration-300 flex flex-col p-4 md:p-6"
              whileHover={{ y: -5, scale: 1.02 }}
            >
              <Link to={`/product/${product.id}`} className="relative h-56 sm:h-64 overflow-hidden block group/image mb-4 -mx-4 -mt-4 md:-mx-6 md:-mt-6">
                {showImages ? (
                  <img 
                    src={product.image_url || `https://picsum.photos/seed/${product.id}/600/600`} 
                    alt={product.name}
                    loading="lazy"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover/image:scale-105 transition-transform duration-500 bg-stone-100"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-stone-100 text-stone-400">
                    <Camera size={48} />
                  </div>
                )}
                
                {/* Improved Quick View Overlay */}
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/image:opacity-100 transition-opacity flex items-center justify-center pointer-events-none z-10">
                  <button 
                    onClick={(e) => {
                      e.preventDefault();
                      setQuickViewProduct(product);
                    }}
                    className="bg-white text-stone-900 px-6 py-3 rounded-full font-black text-xs md:text-sm flex items-center space-x-2 pointer-events-auto hover:bg-stone-50 hover:scale-105 transition-all shadow-xl"
                  >
                    <Search size={18} />
                    <span>Quick View</span>
                  </button>
                </div>

                <div className="absolute top-4 left-4 flex flex-col space-y-2 z-20">
                    {product.discount > 0 && (
                      <div className="bg-accent text-white px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider shadow-lg">
                        {product.discount}% OFF
                      </div>
                    )}
                </div>
                <div className="absolute top-4 right-4 flex flex-col space-y-2 z-20">
                    <div className={cn(
                      "bg-white/90 backdrop-blur px-3 py-2 rounded-xl text-sm font-black shadow-sm flex flex-col items-end",
                      getProductPrice(product, user?.role) < product.price ? "text-accent" : "text-primary"
                    )}>
                    <div className="flex flex-col items-end">
                      <div className="flex items-center space-x-1">
                        {getProductPrice(product, user?.role) < product.price && (
                          <span className="text-xs text-stone-400 line-through font-bold">₹{product.price}</span>
                        )}
                        <span className="text-xl">₹{getProductPrice(product, user?.role)}</span>
                      </div>
                      {user?.role === 'wholesaler' && product.wholesale_price && (
                        <span className="text-[10px] font-black uppercase tracking-tighter">Wholesale</span>
                      )}
                      {user?.role === 'retailer' && product.retail_price && (
                        <span className="text-[10px] font-black uppercase tracking-tighter">Retail</span>
                      )}
                    </div>
                  </div>
                  <button 
                    onClick={(e) => {
                      e.preventDefault();
                      toggleWishlist(product.id);
                    }}
                    className={cn(
                      "p-3 rounded-xl backdrop-blur shadow-sm transition-all pointer-events-auto",
                      wishlist.includes(product.id) 
                        ? "bg-red-500 text-white" 
                        : "bg-white/90 text-stone-400 hover:text-red-500"
                    )}
                  >
                    <Heart size={20} fill={wishlist.includes(product.id) ? "currentColor" : "none"} />
                  </button>
                </div>
                
                {/* Direct Add to Cart on Image */}
                <div className="absolute bottom-4 right-4 z-20">
                  {product.stock <= 0 ? (
                    <div className="bg-stone-900/90 text-white text-[10px] uppercase font-black px-3 py-2 rounded-xl backdrop-blur shadow-xl">
                      Out of Stock
                    </div>
                  ) : cartItem ? (
                     <div className="flex flex-col items-center bg-white/90 backdrop-blur rounded-full shadow-xl border border-stone-100 pointer-events-auto">
                        <button 
                          onClick={(e) => { 
                            e.preventDefault(); 
                            if (cartItem.quantity >= product.stock) {
                              toast.error(`Only ${product.stock} items left`);
                              return;
                            }
                            updateQuantity(product.id, 1); 
                          }} 
                          className="p-3 hover:bg-stone-100 text-primary transition-colors rounded-t-full"
                        >
                          <Plus size={16} className="stroke-[3px]" />
                        </button>
                        <span className="font-bold text-sm py-1 font-mono">{cartItem.quantity}</span>
                        <button 
                          onClick={(e) => { e.preventDefault(); updateQuantity(product.id, -1); }} 
                          className="p-3 hover:bg-stone-100 text-primary transition-colors rounded-b-full"
                        >
                          <Minus size={16} className="stroke-[3px]" />
                        </button>
                     </div>
                  ) : (
                    <button 
                      onClick={(e) => { e.preventDefault(); addToCart(product); }}
                      className="bg-primary hover:bg-primary/90 text-white rounded-full shadow-2xl flex items-center justify-center pointer-events-auto transition-transform active:scale-95 group/add"
                    >
                      <div className="p-4">
                        <Plus size={24} className="stroke-[3px] group-hover/add:rotate-90 transition-transform duration-300" />
                      </div>
                    </button>
                  )}
                </div>
              </Link>
              
              <div className="flex-1 flex flex-col">
                <Link to={`/product/${product.id}`} className="mb-4 block group">
                  <span className="text-xs uppercase tracking-widest font-black text-primary">{product.category}</span>
                  <h3 className="text-2xl md:text-3xl font-black text-stone-900 group-hover:text-primary transition-colors mt-1">{product.name}</h3>
                  <div className="flex items-center space-x-2 mt-2">
                    <div className="flex text-amber-400">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} size={14} fill={i < Math.round((product as any).avg_rating || 0) ? "currentColor" : "none"} />
                      ))}
                    </div>
                    <span className="text-xs text-stone-400 font-black">({(product as any).review_count || 0} reviews)</span>
                  </div>
                </Link>
                <p className="text-base md:text-lg text-stone-600 mb-6 line-clamp-3 leading-relaxed">{product.description}</p>
                
                <div className="mt-auto flex space-x-3">
                  {product.stock <= 0 ? (
                    <div className="flex-1 bg-stone-100 text-stone-500 font-black uppercase text-xs flex items-center justify-center rounded-xl p-3 border border-stone-200 cursor-not-allowed">
                       Out of Stock
                    </div>
                  ) : cartItem ? (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex-1 flex items-center justify-between bg-stone-50 rounded-xl p-1 border border-stone-200"
                    >
                      <button 
                        onClick={() => updateQuantity(product.id, -1)}
                        className="p-2 hover:bg-white rounded-lg transition-colors text-primary"
                      >
                        <Minus size={16} />
                      </button>
                      <span className="font-bold">{cartItem.quantity}</span>
                      <button 
                        onClick={() => {
                          if (cartItem.quantity >= product.stock) {
                            toast.error(`Only ${product.stock} items left in stock`);
                            return;
                          }
                          updateQuantity(product.id, 1);
                        }}
                        className="p-2 hover:bg-white rounded-lg transition-colors text-primary"
                      >
                        <Plus size={16} />
                      </button>
                    </motion.div>
                  ) : (
                    <motion.button 
                      whileTap={{ scale: 0.95 }}
                      onClick={() => addToCart(product)}
                      className="flex-1 btn-primary flex items-center justify-center space-x-2 shadow-lg shadow-primary/20"
                    >
                      <ShoppingCart size={18} />
                      <span className="text-xs font-black uppercase tracking-widest">Add</span>
                    </motion.button>
                  )}
                  <button 
                    onClick={(e) => {
                      e.preventDefault();
                      const url = `${window.location.origin}/product/${product.id}`;
                      if (navigator.share) {
                        navigator.share({ title: product.name, url });
                      } else {
                        navigator.clipboard.writeText(url);
                        toast.success('Link copied');
                      }
                    }}
                    className="p-3 bg-stone-100 text-stone-600 rounded-xl hover:bg-stone-200 transition-all"
                  >
                    <Share2 size={18} />
                  </button>
                </div>
              </div>
              <AnimatePresence>
                {hoverQuickView === product.id && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="absolute inset-0 bg-white/95 backdrop-blur-md z-30 p-6 flex flex-col items-center justify-center text-center shadow-xl hidden sm:flex"
                  >
                     <img src={product.image_url} alt={product.name} className="w-32 h-32 object-cover rounded-2xl shadow-md mb-4" />
                     <h3 className="text-xl font-bold text-stone-900 mb-2 truncate w-full">{product.name}</h3>
                     <p className="text-primary font-black text-2xl mb-6">₹{getProductPrice(product, user?.role)}</p>
                     
                     <div className="w-full flex space-x-2">
                        {cartItem ? (
                           <div className="flex-1 flex items-center justify-between bg-stone-100 rounded-xl p-2 border border-stone-200">
                             <button onClick={() => updateQuantity(product.id, -1)} className="p-3 hover:bg-white rounded-lg transition-colors text-primary"><Minus size={20} /></button>
                             <span className="font-bold text-lg">{cartItem.quantity}</span>
                             <button onClick={() => updateQuantity(product.id, 1)} className="p-3 hover:bg-white rounded-lg transition-colors text-primary"><Plus size={20} /></button>
                           </div>
                        ) : (
                          <motion.button 
                            whileTap={{ scale: 0.95 }}
                            onClick={(e) => { e.preventDefault(); addToCart(product); }}
                            className="flex-1 btn-primary py-4 text-lg font-black uppercase tracking-[0.2em] shadow-xl shadow-primary/25 flex justify-center items-center gap-2"
                          >
                            <ShoppingCart size={20} />
                            <span>Quick Add</span>
                          </motion.button>
                        )}
                        <button 
                           onClick={(e) => {
                             e.preventDefault();
                             toggleWishlist(product.id);
                           }}
                           className={cn(
                             "p-4 rounded-xl border border-stone-200 transition-all flex items-center justify-center",
                             wishlist.includes(product.id) 
                               ? "bg-red-50 text-red-500 border-red-200 hover:bg-red-100" 
                               : "bg-white text-stone-400 hover:text-red-500 hover:bg-stone-50"
                           )}
                        >
                           <Heart size={24} fill={wishlist.includes(product.id) ? "currentColor" : "none"} />
                        </button>
                     </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
        </AnimatePresence>
      </motion.div>

      {filteredProducts.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 px-4">
          <div className="bg-stone-50 p-8 rounded-[2rem] text-center border border-stone-100 max-w-sm">
            <h3 className="text-xl font-black text-stone-900 mb-2">No products found</h3>
            <p className="text-stone-500 mb-6">We couldn't find any products matching the current filters.</p>
            <button 
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('All');
                setSelectedRating(null);
                setMinPrice('0');
                setMaxPrice('');
                setOnSaleOnly(false);
                setSortBy('relevance');
              }}
              className="px-8 py-3 bg-primary text-white rounded-xl font-bold hover:scale-105 transition-transform"
            >
              Clear Filters
            </button>
          </div>
        </div>
      )}

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
  );
}
