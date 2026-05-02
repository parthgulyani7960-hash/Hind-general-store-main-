import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, Filter, ShoppingCart, Plus, Minus, 
  Share2, Heart, Star, Loader2, X, Camera,
  Zap, LayoutGrid, ArrowDownNarrowWide, ArrowUpNarrowWide, Clock
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Product, cn } from '../types';
import { useStore } from '../StoreContext';
import toast from 'react-hot-toast';

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedRating, setSelectedRating] = useState<number | null>(null);
  const [minPrice, setMinPrice] = useState('0');
  const [maxPrice, setMaxPrice] = useState('');
  const [sortBy, setSortBy] = useState('relevance');
  const [onSaleOnly, setOnSaleOnly] = useState(false);
  const [hoverQuickView, setHoverQuickView] = useState<number | null>(null);
  const { t, addToCart, cart, updateQuantity, wishlist, toggleWishlist, user, getProductPrice, simulatedRole } = useStore();
  const activeRole = simulatedRole || user?.role;

  const [error, setError] = useState<string | null>(null);

  const fetchProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/products');
      if (!res.ok) throw new Error('Failed to fetch products');
      const data = await res.json();
      setProducts(data);
      if (data.length > 0) {
        const maxP = Math.max(...data.map((p: Product) => getProductPrice(p, user?.role)));
        setMaxPrice(maxP.toString());
      }
    } catch (err: any) {
      console.error('Products fetch error:', err);
      setError(err.message || 'Something went wrong');
      toast.error('Could not load products. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [user?.role]);

  const filteredProducts = products
    .filter(p => {
      const activePrice = getProductPrice(p, user?.role);
      const searchTerms = searchTerm.toLowerCase().trim().split(' ').filter(Boolean);
      
      const matchesSearch = searchTerms.length === 0 || searchTerms.every(term => 
        p.name.toLowerCase().includes(term) || 
        p.description.toLowerCase().includes(term) ||
        p.category.toLowerCase().includes(term)
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
      if (sortBy === 'price-low') return priceA - priceB;
      if (sortBy === 'price-high') return priceB - priceA;
      if (sortBy === 'rating') return (b.avg_rating || 0) - (a.avg_rating || 0);
      if (sortBy === 'popularity') return ((b as any).review_count || 0) - ((a as any).review_count || 0);
      if (sortBy === 'newest') return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
      return 0; // Relevance
    });

  const categories = ['All', ...new Set(products.map(p => p.category))];

  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [zoomImage, setZoomImage] = useState<string | null>(null);

  // Body scroll lock
  useEffect(() => {
    if (isFilterOpen || quickViewProduct) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isFilterOpen, quickViewProduct]);

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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
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
                  <img 
                    src={quickViewProduct.image_url} 
                    alt={quickViewProduct.name}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
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
                      <Link 
                        to={`/product/${quickViewProduct.id}`}
                        className="px-6 py-4 border border-stone-200 rounded-2xl font-bold hover:bg-stone-50 transition-colors flex items-center justify-center"
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
        {/* Modern Top Navigation & Filter Bar */}
        <div className="sticky top-[64px] pb-4 z-40 bg-stone-50/80 backdrop-blur-md px-4 md:px-0 -mx-4 md:mx-0">
          <div className="bg-white p-4 rounded-3xl border border-stone-100 shadow-xl shadow-stone-200/40 space-y-4">
            <div className="flex flex-col md:flex-row gap-4 items-center">
            {/* Search - More prominent with better focus states */}
            <div className="relative flex-1 group w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 group-focus-within:text-primary transition-colors" size={18} />
              <input 
                type="text" 
                placeholder="Search products, brands, categories..."
                className="w-full bg-stone-50 border-2 border-transparent rounded-2xl py-3.5 pl-12 pr-4 focus:border-primary/20 focus:bg-white transition-all text-sm font-bold outline-none placeholder:text-stone-400 placeholder:font-medium"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto hide-scrollbar">
               {/* Quick Filters */}
               <button
                 onClick={() => setOnSaleOnly(!onSaleOnly)}
                 className={cn(
                   "flex items-center space-x-2 px-5 py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all whitespace-nowrap",
                   onSaleOnly ? "bg-accent text-white shadow-lg shadow-accent/30" : "bg-stone-50 text-stone-500 hover:bg-stone-100"
                 )}
               >
                 <Zap size={12} fill={onSaleOnly ? "currentColor" : "none"} />
                 <span>On Sale</span>
               </button>

               <div className="h-8 w-px bg-stone-200 mx-1 hidden md:block" />

               <button
                 onClick={() => setIsFilterOpen(true)}
                 className={cn(
                   "flex items-center space-x-2 px-5 py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all whitespace-nowrap",
                   (selectedRating !== null || minPrice !== '0' || maxPrice !== '' || sortBy !== 'relevance') 
                     ? "bg-primary text-white shadow-lg shadow-primary/30" 
                     : "bg-stone-900 text-white hover:bg-stone-800"
                 )}
               >
                 <Filter size={12} />
                 <span>Filters {(selectedRating !== null || minPrice !== '0' || (maxPrice !== '' && maxPrice !== Math.max(...products.map(p => getProductPrice(p, user?.role))).toString()) || sortBy !== 'relevance') && '•'}</span>
               </button>
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
                    "px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap border-2",
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

                <div className="flex-1 overflow-y-auto p-8 space-y-12">
                  {/* Sorting Section */}
                  <div className="space-y-6">
                    <div className="flex items-center gap-2">
                      <LayoutGrid size={14} className="text-primary" />
                      <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-400">Sort Results</h3>
                    </div>
                    <div className="grid grid-cols-1 gap-2">
                      {[
                        { id: 'relevance', label: 'Recommended', icon: Star },
                        { id: 'popularity', label: 'Best Sellers', icon: Zap },
                        { id: 'price-low', label: 'Lowest Price', icon: ArrowDownNarrowWide },
                        { id: 'price-high', label: 'Highest Price', icon: ArrowUpNarrowWide },
                        { id: 'rating', label: 'User Rating', icon: Star },
                        { id: 'newest', label: 'Newly Added', icon: Clock },
                      ].map(option => (
                        <button
                          key={option.id}
                          onClick={() => setSortBy(option.id)}
                          className={cn(
                            "group flex items-center justify-between p-4 rounded-2xl border-2 transition-all",
                            sortBy === option.id 
                              ? "border-primary bg-primary/5 text-primary" 
                              : "border-stone-50 text-stone-500 hover:border-stone-200 hover:bg-stone-50"
                          )}
                        >
                          <div className="flex items-center space-x-3">
                            <option.icon size={16} className={sortBy === option.id ? "text-primary" : "text-stone-300 group-hover:text-stone-400"} />
                            <span className="font-bold text-sm tracking-tight">{option.label}</span>
                          </div>
                          {sortBy === option.id && <div className="w-2 h-2 bg-primary rounded-full" />}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Price Section */}
                  <div className="space-y-6">
                    <div className="flex items-center gap-2">
                      <Zap size={14} className="text-primary" />
                      <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-400">Price Threshold</h3>
                    </div>
                    <div className="bg-stone-50 p-6 rounded-3xl space-y-8 border border-stone-100">
                      <div className="flex flex-col space-y-6">
                        <div className="space-y-3">
                          <p className="text-[9px] font-black uppercase text-stone-400 tracking-tighter">Minimum Price</p>
                          <div className="flex items-center space-x-2">
                            <button 
                              onClick={() => {
                                const next = Math.max(0, (parseInt(minPrice || '0') || 0) - 10);
                                setMinPrice(next.toString());
                              }}
                              className="w-10 h-10 bg-white border border-stone-200 rounded-xl flex items-center justify-center text-stone-600 hover:bg-stone-100 transition-colors"
                            >
                              <Minus size={14} />
                            </button>
                            <div className="flex-1 flex items-center bg-white border border-stone-200 rounded-xl px-3 py-2">
                              <span className="text-stone-400 font-bold text-sm mr-1">₹</span>
                              <input 
                                type="number" 
                                value={minPrice} 
                                onChange={(e) => setMinPrice(e.target.value)} 
                                className="bg-transparent font-black text-lg w-full outline-none"
                              />
                            </div>
                            <button 
                              onClick={() => {
                                const next = (parseInt(minPrice || '0') || 0) + 10;
                                setMinPrice(next.toString());
                              }}
                              className="w-10 h-10 bg-white border border-stone-200 rounded-xl flex items-center justify-center text-stone-600 hover:bg-stone-100 transition-colors"
                            >
                              <Plus size={14} />
                            </button>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <p className="text-[9px] font-black uppercase text-stone-400 tracking-tighter">Maximum Price</p>
                          <div className="flex items-center space-x-2">
                            <button 
                              onClick={() => {
                                const next = Math.max(0, (parseInt(maxPrice || '0') || 0) - 50);
                                setMaxPrice(next.toString());
                              }}
                              className="w-10 h-10 bg-white border border-stone-200 rounded-xl flex items-center justify-center text-stone-600 hover:bg-stone-100 transition-colors"
                            >
                              <Minus size={14} />
                            </button>
                            <div className="flex-1 flex items-center justify-end bg-white border border-stone-200 rounded-xl px-3 py-2">
                              <span className="text-stone-400 font-bold text-sm mr-1">₹</span>
                              <input 
                                type="number" 
                                value={maxPrice} 
                                onChange={(e) => setMaxPrice(e.target.value)} 
                                className="bg-transparent font-black text-lg w-full text-right outline-none"
                              />
                            </div>
                            <button 
                              onClick={() => {
                                const next = (parseInt(maxPrice || '0') || 0) + 50;
                                setMaxPrice(next.toString());
                              }}
                              className="w-10 h-10 bg-white border border-stone-200 rounded-xl flex items-center justify-center text-stone-600 hover:bg-stone-100 transition-colors"
                            >
                              <Plus size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Rating Section */}
                  <div className="space-y-6">
                    <div className="flex items-center gap-2">
                      <Star size={14} className="text-primary" />
                      <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-400">Min Rating</h3>
                    </div>
                    <div className="flex justify-between gap-2">
                      {[5, 4, 3, 2, 1].map(rating => (
                        <button
                          key={rating}
                          onClick={() => setSelectedRating(selectedRating === rating ? null : rating)}
                          className={cn(
                            "flex flex-col items-center justify-center flex-1 py-4 rounded-2xl border-2 transition-all space-y-2 shadow-sm",
                            selectedRating === rating 
                              ? "bg-amber-50 border-amber-400 text-amber-600 scale-105 shadow-lg shadow-amber-200/40" 
                              : "bg-white border-stone-50 text-stone-400 hover:border-amber-100 hover:text-amber-400"
                          )}
                        >
                          <Star size={18} fill={selectedRating === rating ? "currentColor" : "none"} />
                          <span className="font-black text-[10px] tracking-tighter">{rating}★</span>
                        </button>
                      ))}
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
        initial="hidden"
        animate="visible"
        variants={{
          hidden: { opacity: 0 },
          visible: {
            opacity: 1,
            transition: {
              staggerChildren: 0.1
            }
          }
        }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8"
      >
        {filteredProducts.map((product) => {
          const cartItem = cart.find(item => item.id === product.id);
          
          return (
            <motion.div 
              key={product.id}
              layout
              onMouseEnter={() => setHoverQuickView(product.id)}
              onMouseLeave={() => setHoverQuickView(null)}
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0 }
              }}
              className="relative bg-white rounded-2xl overflow-hidden shadow-sm border border-stone-100 hover:shadow-md transition-all flex flex-col"
            >
              <Link to={`/product/${product.id}`} className="relative h-48 overflow-hidden block group/image">
                <img 
                  src={product.image_url} 
                  alt={product.name}
                  loading="lazy"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover group-hover/image:scale-105 transition-transform duration-500"
                />
                
                {/* Improved Quick View Overlay */}
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/image:opacity-100 transition-opacity flex items-center justify-center pointer-events-none z-10">
                  <button 
                    onClick={(e) => {
                      e.preventDefault();
                      setQuickViewProduct(product);
                    }}
                    className="bg-white text-stone-900 px-6 py-2 rounded-full font-bold flex items-center space-x-2 pointer-events-auto hover:bg-stone-50 hover:scale-105 transition-all shadow-xl"
                  >
                    <Search size={16} />
                    <span>Quick View</span>
                  </button>
                </div>

                <div className="absolute top-2 left-2 flex flex-col space-y-2 z-20">
                    {product.discount > 0 && (
                      <div className="bg-accent text-white px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider shadow-lg">
                        {product.discount}% OFF
                      </div>
                    )}
                </div>
                <div className="absolute top-2 right-2 flex flex-col space-y-2 z-20">
                    <div className={cn(
                      "bg-white/90 backdrop-blur px-2 py-1 rounded-lg text-xs font-bold shadow-sm flex flex-col items-end",
                      getProductPrice(product, user?.role) < product.price ? "text-accent" : "text-primary"
                    )}>
                    <div className="flex flex-col items-end">
                      <div className="flex items-center space-x-1">
                        {getProductPrice(product, user?.role) < product.price && (
                          <span className="text-[10px] text-stone-400 line-through font-medium">₹{product.price}</span>
                        )}
                        <span>₹{getProductPrice(product, user?.role)}</span>
                      </div>
                      {user?.role === 'wholesaler' && product.wholesale_price && (
                        <span className="text-[8px] font-black uppercase tracking-tighter">Wholesale</span>
                      )}
                      {user?.role === 'retailer' && product.retail_price && (
                        <span className="text-[8px] font-black uppercase tracking-tighter">Retail</span>
                      )}
                    </div>
                  </div>
                  <button 
                    onClick={(e) => {
                      e.preventDefault();
                      toggleWishlist(product.id);
                    }}
                    className={cn(
                      "p-2 rounded-lg backdrop-blur shadow-sm transition-all",
                      wishlist.includes(product.id) 
                        ? "bg-red-500 text-white" 
                        : "bg-white/90 text-stone-400 hover:text-red-500"
                    )}
                  >
                    <Heart size={16} fill={wishlist.includes(product.id) ? "currentColor" : "none"} />
                  </button>
                </div>
              </Link>
              
              <div className="p-4 flex-1 flex flex-col">
                <Link to={`/product/${product.id}`} className="mb-2 block group">
                  <span className="text-[10px] uppercase tracking-wider font-bold text-stone-400">{product.category}</span>
                  <h3 className="text-lg font-bold text-stone-900 group-hover:text-primary transition-colors">{product.name}</h3>
                  <div className="flex items-center space-x-1 mt-1">
                    <div className="flex text-amber-400">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} size={10} fill={i < Math.round((product as any).avg_rating || 0) ? "currentColor" : "none"} />
                      ))}
                    </div>
                    <span className="text-[10px] text-stone-400 font-bold">({(product as any).review_count || 0})</span>
                  </div>
                </Link>
                <p className="text-sm text-stone-500 mb-4 line-clamp-2">{product.description}</p>
                
                <div className="mt-auto flex space-x-2">
                  {cartItem ? (
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
                        onClick={() => updateQuantity(product.id, 1)}
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
                     </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </motion.div>

      {filteredProducts.length === 0 && (
        <div className="text-center py-20">
          <p className="text-stone-500 text-lg">No products found matching your criteria.</p>
        </div>
      )}
      </div>
    </div>
  </div>
  );
}
