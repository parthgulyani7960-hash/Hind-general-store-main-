import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, X, Star, Zap, ShoppingCart, Minus, Plus, Camera, Filter } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useStore } from '../StoreContext';
import { cn, Product } from '../types';

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
  
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [minPrice, setMinPrice] = useState<string>('0');
  const [maxPrice, setMaxPrice] = useState<string>('');
  const [selectedRating, setSelectedRating] = useState<number | null>(null);

  const isFeatureImages = config?.find(c => c.key === 'feature_show_product_images')?.value !== 'false';

  useEffect(() => {
    if (isOpen && products.length === 0) {
      setLoading(true);
      fetch('/api/products')
        .then(res => res.json())
        .then(data => {
            setProducts(data);
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

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const activePrice = getProductPrice(p, user?.role);
      const searchTerms = searchQuery.toLowerCase().trim().split(' ').filter(Boolean);
      
      const matchesSearch = searchTerms.length === 0 || searchTerms.every(term => 
        (p.name?.toLowerCase() || '').includes(term) || 
        (p.description?.toLowerCase() || '').includes(term) ||
        (p.category?.toLowerCase() || '').includes(term)
      );

      const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
      const matchesRating = selectedRating === null || Math.floor(p.avg_rating || 0) >= selectedRating;
      const matchesMinPrice = activePrice >= Number(minPrice);
      const matchesMaxPrice = maxPrice === '' || activePrice <= Number(maxPrice);
      
      return matchesSearch && matchesCategory && matchesRating && matchesMinPrice && matchesMaxPrice && p.is_listed;
    });
  }, [products, searchQuery, selectedCategory, minPrice, maxPrice, selectedRating, getProductPrice, user?.role]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-stone-900/60 backdrop-blur-md flex flex-col pt-safe"
      >
        <div className="bg-white shadow-xl max-h-[90vh] h-[90vh] mt-auto rounded-t-3xl sm:rounded-none sm:h-full sm:max-h-full sm:mt-0 flex flex-col relative w-full overflow-hidden">
          {/* Header Search Area */}
          <div className="p-4 sm:p-6 border-b border-stone-100 flex items-center space-x-4 bg-stone-50/50 relative z-10 shrink-0">
             <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={20} />
                <input 
                  type="text" 
                  autoFocus
                  placeholder="What are you looking for?"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full bg-white border border-stone-200 rounded-2xl py-4 pl-12 pr-4 text-lg font-bold outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all shadow-sm"
                />
             </div>
             <button onClick={onClose} className="p-4 bg-white border border-stone-200 rounded-2xl text-stone-500 hover:text-stone-900 hover:bg-stone-100 transition-all shadow-sm">
               <X size={24} />
             </button>
          </div>

          {/* Main Body */}
          <div className="flex-1 overflow-hidden flex flex-col md:flex-row relative">
            {/* Filters Sidebar (Hidden on very small mobile, visible on md) */}
            <div className="md:w-72 bg-stone-50 p-6 border-r border-stone-100 overflow-y-auto shrink-0 hidden md:block space-y-8 no-scrollbar">
               <h3 className="text-xl font-black mb-6 text-stone-900">Filters</h3>
               
               {/* Category Filter */}
               <div className="space-y-3">
                 <h4 className="text-xs font-black uppercase text-stone-400 tracking-widest">Categories</h4>
                 <div className="flex flex-col space-y-2">
                   {categories.map(cat => (
                      <button 
                         key={cat}
                         onClick={() => setSelectedCategory(cat)}
                         className={cn(
                           "text-left px-4 py-2.5 rounded-xl text-sm font-bold transition-all",
                           selectedCategory === cat ? "bg-primary text-white shadow-md shadow-primary/20" : "hover:bg-white text-stone-600 border border-transparent hover:border-stone-200"
                         )}
                      >
                         {cat}
                      </button>
                   ))}
                 </div>
               </div>

               {/* Price Filter */}
               <div className="space-y-4 pt-6 border-t border-stone-200">
                 <h4 className="text-xs font-black uppercase text-stone-400 tracking-widest">Price Range</h4>
                 <div className="flex items-center space-x-2">
                   <input type="number" placeholder="Min" value={minPrice || ''} onChange={e => setMinPrice(e.target.value)} className="w-full p-2 border border-stone-200 rounded-lg text-sm bg-white" />
                   <span className="text-stone-400">-</span>
                   <input type="number" placeholder="Max" value={maxPrice || ''} onChange={e => setMaxPrice(e.target.value)} className="w-full p-2 border border-stone-200 rounded-lg text-sm bg-white" />
                 </div>
               </div>

               {/* Rating Filter */}
               <div className="space-y-3 pt-6 border-t border-stone-200">
                 <h4 className="text-xs font-black uppercase text-stone-400 tracking-widest">Minimum Rating</h4>
                 <div className="flex flex-col space-y-2">
                   {[4, 3, 2, 1].map(rating => (
                     <button
                       key={rating}
                       onClick={() => setSelectedRating(selectedRating === rating ? null : rating)}
                       className={cn(
                          "flex items-center space-x-2 p-2 rounded-lg transition-all",
                          selectedRating === rating ? "bg-amber-50 border border-amber-200" : "hover:bg-white border border-transparent hover:border-stone-200"
                       )}
                     >
                       <div className="flex text-amber-400">
                         {[...Array(5)].map((_, i) => <Star key={i} size={14} fill={i < rating ? "currentColor" : "none"} className={i >= rating ? "text-stone-300" : ""} />)}
                       </div>
                       <span className="text-xs font-bold text-stone-600">& Up</span>
                     </button>
                   ))}
                 </div>
               </div>
            </div>

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
            <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-stone-50/30">
               {loading ? (
                 <div className="flex items-center justify-center h-full">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
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
                              {product.discount > 0 && <div className="absolute top-2 left-2 z-10 bg-accent text-white px-2 py-0.5 rounded-md text-[10px] font-black">{product.discount}% OFF</div>}
                              <div className="h-40 md:h-48 relative overflow-hidden bg-stone-100 shrink-0">
                                {isFeatureImages ? (
                                  <img src={product.image_url} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-stone-300"><Camera size={32} /></div>
                                )}
                              </div>
                              <div className="p-4 flex flex-col flex-1 relative">
                                 <span className="text-[10px] uppercase tracking-widest font-black text-primary mb-1 block line-clamp-1">{product.category}</span>
                                 <h3 className="font-bold text-stone-900 text-sm mb-1 line-clamp-2 md:leading-snug">{product.name}</h3>
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
                                        className="w-10 h-10 md:w-8 md:h-8 bg-primary text-white rounded-xl shadow-lg flex items-center justify-center hover:scale-110 active:scale-95 transition-all"
                                      >
                                        <CartIcon />
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
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

function CartIcon() {
  return <ShoppingCart size={16} />;
}
