import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, X, Star, Zap, ShoppingCart, Minus, Plus, Camera, Filter, Maximize2 } from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useStore } from '@/StoreContext';
import { cn, Product } from '@/types';
import { ProgressiveImage } from '@/components/ui/ProgressiveImage';
import { fetchWithHandling } from '@/lib/api';

export default function SearchOverlay({
  isOpen,
  onClose,
  initialSearchQuery = ''
}: {
  isOpen: boolean;
  onClose: () => void;
  initialSearchQuery?: string;
}) {
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const { cart, updateQuantity, addToCart, getProductPrice, user, showImages, config } = useStore();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [minPrice, setMinPrice] = useState<string>('0');
  const [maxPrice, setMaxPrice] = useState<string>('');
  const [selectedRating, setSelectedRating] = useState<number | null>(null);

  // Close on route change
  useEffect(() => {
    onClose();
  }, [location.pathname]);

  const isFeatureImages = config?.find(c => c.key === 'feature_show_product_images')?.value !== 'false';

  useEffect(() => {
    if (isOpen && products.length === 0) {
      setLoading(true);
      fetchWithHandling<Product[]>('/api/products')
        .then(data => {
            if (data) setProducts(data);
            setLoading(false);
        })
        .catch(err => {
            console.error('Failed to load products for search', err);
            setLoading(false);
        });
    }
  }, [isOpen]);

  // Lock body scroll
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  const categories = useMemo(() => ['All', ...new Set(products.map(p => p.category))], [products]);

  useEffect(() => {
    // Clear results immediately if query is empty
    if (!searchQuery.trim()) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    const timer = setTimeout(() => {
      setLoading(false);
    }, 300); // Faster debounce
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const filteredProducts = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return [];

    // Improved regex for words including support for many scripts (Hindi included)
    const searchTerms = query.split(/[\s,]+/).filter(term => term.length > 0);

    const baseFiltered = products.filter(p => {
      const activePrice = getProductPrice(p, user?.role);
      
      const specText = Object.values(p.specifications || {}).join(' ').toLowerCase();
      // Added more searchable fields
      const searchableText = `${p.name} ${p.description || ''} ${p.category} ${p.unit || ''} ${specText}`.toLowerCase();
      
      // Match if at least one search term is found (OR matching) or all (AND matching)
      // Usually users want AND matching for specific queries
      const matchesSearch = searchTerms.every(term => searchableText.includes(term));

      const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
      const matchesRating = selectedRating === null || Math.floor(p.avg_rating || 0) >= selectedRating;
      const matchesMinPrice = (minPrice === '' || minPrice === '0') ? true : activePrice >= Number(minPrice);
      const matchesMaxPrice = (maxPrice === '' || maxPrice === '0') ? true : activePrice <= Number(maxPrice);
      
      return matchesSearch && matchesCategory && matchesRating && matchesMinPrice && matchesMaxPrice && p.is_listed;
    });

    return baseFiltered.sort((a, b) => {
      const getScore = (product: Product) => {
        let score = 0;
        const name = (product.name || '').toLowerCase();
        
        // Exact matches get highest priority
        if (name === query) score += 10000;
        else if (name.startsWith(query)) score += 5000;
        
        // Hindi/English Multilingual boost: check if query is in name or description
        searchTerms.forEach(term => {
          if (name.includes(term)) score += 1000;
          if (product.category.toLowerCase().includes(term)) score += 500;
        });

        // Recent items boost could be added here
        return score;
      };
      return getScore(b) - getScore(a);
    });
  }, [products, searchQuery, selectedCategory, minPrice, maxPrice, selectedRating, getProductPrice, user?.role]);

  // Highlight matches function with robust multilingual support
  const highlightMatch = (text: string, query: string) => {
    if (!query.trim() || !text) return <span>{text}</span>;
    
    const terms = query.toLowerCase().trim().split(/[\s,]+/).filter(Boolean);
    if (terms.length === 0) return <span>{text}</span>;

    try {
      // Escape terms for regex safety
      const escapedTerms = terms.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
      const regex = new RegExp(`(${escapedTerms.join('|')})`, 'gi');
      const parts = text.split(regex);
      
      return (
        <span>
          {parts.map((part, i) => 
            terms.some(t => part.toLowerCase() === t) 
              ? <mark key={i} className="bg-emerald-100 text-emerald-800 font-bold rounded px-0.5">{part}</mark> 
              : part
          )}
        </span>
      );
    } catch (e) {
      return <span>{text}</span>;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="fixed inset-0 z-[100] bg-white flex flex-col pb-[72px] md:pb-0"
          style={{ paddingTop: 'env(safe-area-inset-top, 16px)' }}
        >
          <div className="bg-white h-full flex flex-col relative w-full overflow-hidden">
            {/* Header Search Area - Fixed Height */}
            <div className="h-20 sm:h-24 px-4 sm:px-6 border-b border-stone-100 flex items-center space-x-4 bg-stone-50/50 relative z-10 shrink-0">
               <div className="flex-1 relative">
                  <motion.div
                    initial={{ x: -10, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                  >
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-primary" size={20} />
                    <input 
                      type="text" 
                      autoFocus
                      placeholder="Search for spices, pulses, grains..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="w-full bg-white border-2 border-stone-200 rounded-[2rem] py-4 pl-14 pr-4 text-lg sm:text-xl font-bold outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all shadow-md placeholder:text-stone-300"
                    />
                  </motion.div>
               </div>
               <motion.button 
                 whileTap={{ scale: 0.9 }}
                 onClick={onClose} 
                 className="p-4 bg-white border-2 border-stone-200 rounded-[2rem] text-stone-500 hover:text-stone-900 hover:bg-stone-100 transition-all shadow-md flex items-center justify-center shrink-0"
               >
                 <X size={24} />
               </motion.button>
            </div>

            {/* Main Body */}
            <div className="flex-1 overflow-hidden flex flex-col md:flex-row relative">
            {/* Filters Sidebar (Hidden on very small mobile, visible on md) */}
            <motion.div 
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="md:w-72 bg-stone-50 p-6 border-r border-stone-100 overflow-y-auto shrink-0 hidden md:block space-y-8 no-scrollbar"
            >
               <h3 className="text-xl font-black mb-6 text-stone-900">Filters</h3>
               
               {/* Category Filter */}
               <div className="space-y-3">
                 <h4 className="text-[10px] font-black uppercase text-stone-400 tracking-widest pl-1">Categories</h4>
                 <div className="flex flex-col space-y-1.5">
                   {categories.map(cat => (
                      <button 
                         key={cat}
                         onClick={() => setSelectedCategory(cat)}
                         className={cn(
                           "text-left px-5 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-between",
                           selectedCategory === cat 
                             ? "bg-primary text-white shadow-xl shadow-primary/20 scale-[1.02]" 
                             : "hover:bg-white text-stone-500 border border-transparent hover:border-stone-100"
                         )}
                      >
                         <span>{cat}</span>
                         {selectedCategory === cat && <div className="w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_8px_white]" />}
                      </button>
                   ))}
                 </div>
               </div>

               {/* Price Filter */}
               <div className="space-y-4 pt-6 border-t border-stone-200">
                 <h4 className="text-[10px] font-black uppercase text-stone-400 tracking-widest pl-1">Price Range</h4>
                 <div className="flex items-center space-x-2">
                   <div className="relative flex-1">
                     <span className="absolute left-2 top-2 text-[10px] font-bold text-stone-400">Min</span>
                     <input type="number" placeholder="0" value={minPrice || ''} onChange={e => setMinPrice(e.target.value)} className="w-full pt-6 pb-2 px-2 border border-stone-200 rounded-xl text-sm font-bold bg-white" />
                   </div>
                   <span className="text-stone-300">-</span>
                   <div className="relative flex-1">
                     <span className="absolute left-2 top-2 text-[10px] font-bold text-stone-400">Max</span>
                     <input type="number" placeholder="Any" value={maxPrice || ''} onChange={e => setMaxPrice(e.target.value)} className="w-full pt-6 pb-2 px-2 border border-stone-200 rounded-xl text-sm font-bold bg-white" />
                   </div>
                 </div>
               </div>

               {/* Rating Filter */}
               <div className="space-y-3 pt-6 border-t border-stone-200">
                 <h4 className="text-[10px] font-black uppercase text-stone-400 tracking-widest pl-1">Minimum Rating</h4>
                 <div className="flex flex-col space-y-1.5">
                   {[4, 3, 2, 1].map(rating => (
                     <button
                       key={rating}
                       onClick={() => setSelectedRating(selectedRating === rating ? null : rating)}
                       className={cn(
                          "flex items-center justify-between px-4 py-2.5 rounded-xl transition-all",
                          selectedRating === rating ? "bg-amber-50 border border-amber-200 text-amber-900" : "hover:bg-white border border-transparent hover:border-stone-200 text-stone-600"
                       )}
                     >
                       <div className="flex text-amber-400">
                         {[...Array(5)].map((_, i) => <Star key={i} size={14} fill={i < rating ? "currentColor" : "none"} className={i >= rating ? "text-stone-300" : ""} />)}
                       </div>
                       <span className="text-xs font-bold">& Up</span>
                     </button>
                   ))}
                 </div>
               </div>
            </motion.div>

            {/* Mobile Horizontal Filters (If md: is hidden) */}
            <div className="md:hidden flex items-center space-x-2 overflow-x-auto p-4 border-b border-stone-100 shrink-0 no-scrollbar">
              <button 
                onClick={() => navigate(`/products?search=${searchQuery}`)}
                className="px-4 py-2 bg-stone-900 text-white rounded-xl text-xs font-bold shrink-0 flex items-center space-x-2"
              >
                <Filter size={14} />
                <span>All Filters</span>
              </button>
              {categories.map(cat => (
                 <button 
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={cn(
                      "px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap shrink-0 border",
                      selectedCategory === cat ? "bg-primary text-white border-primary" : "bg-stone-50 border-stone-200 text-stone-600"
                    )}
                 >
                    {cat}
                 </button>
              ))}
            </div>

            {/* Results Grid */}
            <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-stone-50/30 no-scrollbar">
               {loading ? (
                 <div className="flex items-center justify-center h-full">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                 </div>
               ) : (
                 <>
                   {searchQuery.trim() === '' ? (
                     <div className="max-w-md mx-auto py-16 px-4 text-center space-y-6 flex flex-col justify-center h-full">
                       <div className="w-14 h-14 bg-stone-100 rounded-2xl flex items-center justify-center mx-auto text-stone-400">
                         <Search size={22} className="animate-pulse" />
                       </div>
                       <div>
                         <h3 className="text-lg font-bold text-stone-900">Search Products</h3>
                         <p className="text-stone-500 text-xs mt-1">Start typing to find karyana items, grains, spices, ghee, and daily essentials.</p>
                       </div>
                       <div className="space-y-2 pt-2">
                         <p className="text-[10px] font-black uppercase text-stone-400 tracking-widest text-center">Popular Searches</p>
                         <div className="flex flex-wrap justify-center gap-2">
                           {['Atta', 'Rice', 'Spices', 'Ghee', 'Sugar', 'Pulse', 'Tea'].map(tag => (
                             <button
                               key={tag}
                               onClick={() => setSearchQuery(tag)}
                               className="px-3.5 py-1.5 bg-white hover:bg-stone-100 text-stone-700 text-xs font-semibold rounded-lg border border-stone-200/50 shadow-sm transition-all hover:scale-105 active:scale-95"
                             >
                               {tag}
                             </button>
                           ))}
                         </div>
                       </div>
                     </div>
                   ) : (
                     <>
                       <p className="text-sm font-bold text-stone-400 mb-6 uppercase tracking-widest">{filteredProducts.length} Results Found</p>
                       {filteredProducts.length === 0 ? (
                          <div className="flex flex-col items-center justify-center p-12 text-center bg-white rounded-3xl border border-stone-100 shadow-sm">
                             <Search size={48} className="text-stone-300 mb-4" />
                             <h3 className="text-xl font-black text-stone-900 mb-2">No matches</h3>
                             <p className="text-stone-500 mb-6">Try adjusting your search or filters to find what you're looking for.</p>
                             <button onClick={() => { setSearchQuery(''); setSelectedCategory('All'); setSelectedRating(null); setMinPrice('0'); setMaxPrice(''); }} className="btn-primary text-sm">Clear Filters</button>
                          </div>
                       ) : (
                         <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 pb-20">
                           {filteredProducts.map(product => {
                             const cartItem = cart.find(c => c.id === product.id);
                             const activePrice = getProductPrice(product, user?.role);
                             
                             return (
                               <div key={product.id} className="bg-white rounded-2xl border border-stone-100 overflow-hidden flex flex-col group shadow-sm hover:shadow-xl transition-all h-full relative cursor-pointer" onClick={() => { onClose(); navigate(`/product/${product.id}`); }}>
                                  {product.discount > 0 && <div className="absolute top-4 left-4 z-10 bg-red-600 text-white px-3 py-1 rounded-[0.5rem] text-[10px] font-black uppercase tracking-widest shadow-xl shadow-red-500/20 animate-pulse">{product.discount}% OFF</div>}
                                  <div className="aspect-square relative overflow-hidden bg-stone-100 shrink-0">
                                    {isFeatureImages ? (
                                      <ProgressiveImage src={product.image_url} alt={product.name} className="w-full h-full" />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center text-stone-300"><Camera size={32} /></div>
                                    )}
                                  </div>
                                  <div className="p-4 flex flex-col flex-1 relative">
                                     <span className="text-[10px] uppercase tracking-widest font-black text-primary mb-1 block line-clamp-1">{product.category}</span>
                                     <h3 className="font-bold text-stone-900 text-sm mb-1 line-clamp-2 md:leading-snug min-h-[2.5rem] max-h-[2.5rem] overflow-hidden text-ellipsis break-words">{product.name}</h3>
                                     <div className="flex items-center space-x-2 text-stone-400 text-xs mb-3">
                                       <div className="flex space-x-0.5 text-amber-400">
                                          {[...Array(5)].map((_, i) => <Star key={i} size={10} fill={i < Math.floor(product.avg_rating || 0) ? "currentColor" : "none"} />)}
                                       </div>
                                     </div>
                                     <div className="mt-auto flex items-end justify-between">
                                       <div className="flex flex-col">
                                         {activePrice < product.price && <span className="text-xs text-stone-400 line-through font-bold">₹{product.price}</span>}
                                         <span className="text-lg font-black text-primary leading-none">₹{activePrice}</span>
                                       </div>
                                     </div>
                                     
                                     {/* Quick Add To Cart overlay on hover (desktop) or always visible mobile action */}
                                     <div className="absolute bottom-4 right-4" onClick={(e) => e.stopPropagation()}>
                                        {cartItem ? (
                                          <div className="flex items-center bg-stone-100 rounded-lg p-1 shadow-sm border border-stone-200">
                                            <button onClick={(e) => { e.stopPropagation(); updateQuantity(product.id, -1); }} className="w-6 h-6 flex flex-col items-center justify-center bg-white rounded shadow-sm text-primary hover:bg-stone-50"><Minus size={14} /></button>
                                            <span className="w-6 text-center text-xs font-bold">{cartItem.quantity}</span>
                                            <button onClick={(e) => { e.stopPropagation(); updateQuantity(product.id, 1); }} className="w-6 h-6 flex flex-col items-center justify-center bg-white rounded shadow-sm text-primary hover:bg-stone-50"><Plus size={14} /></button>
                                          </div>
                                        ) : (
                                          <button 
                                            onClick={(e) => { e.stopPropagation(); addToCart(product); }}
                                            className="w-12 h-12 bg-primary text-white rounded-2xl shadow-lg flex items-center justify-center hover:scale-110 active:scale-95 transition-all"
                                          >
                                            <Plus size={24} strokeWidth={3} />
                                          </button>
                                        )}
                                     </div>
                                  </div>
                               </div>
                             );
                           })}
                         </div>
                       )}
                     </>
                   )}
                 </>
               )}
            </div>
          </div>
        </div>
      </motion.div>
    )}
    </AnimatePresence>
  );
}

function CartIcon() {
  return <ShoppingCart size={16} />;
}
