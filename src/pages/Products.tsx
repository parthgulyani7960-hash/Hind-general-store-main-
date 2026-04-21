import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Filter, ShoppingCart, Plus, Minus, Share2, Heart, Star, Loader2, X, Camera } from 'lucide-react';
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
  const { addToCart, cart, updateQuantity, wishlist, toggleWishlist } = useStore();

  useEffect(() => {
    fetch('/api/products')
      .then(res => res.json())
      .then(data => {
        setProducts(data);
        setLoading(false);
        const maxP = Math.max(...data.map((p: Product) => p.price));
        setMaxPrice(maxP.toString());
      });
  }, []);

  const filteredProducts = products
    .filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           p.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
      const matchesRating = selectedRating === null || Math.floor(p.avg_rating || 0) >= selectedRating;
      const matchesMinPrice = p.price >= Number(minPrice);
      const matchesMaxPrice = maxPrice === '' || p.price <= Number(maxPrice);
      return matchesSearch && matchesCategory && matchesMinPrice && matchesMaxPrice && matchesRating && p.is_listed;
    })
    .sort((a, b) => {
      if (sortBy === 'price-low') return a.price - b.price;
      if (sortBy === 'price-high') return b.price - a.price;
      if (sortBy === 'rating') return (b.avg_rating || 0) - (a.avg_rating || 0);
      if (sortBy === 'newest') return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
      return 0; // Relevance (default order from API)
    });

  const categories = ['All', ...new Set(products.map(p => p.category))];

  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [zoomImage, setZoomImage] = useState<string | null>(null);

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
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
                  
                  <div className="flex items-baseline space-x-3">
                    <span className="text-4xl font-black text-primary">₹{quickViewProduct.price}</span>
                    {quickViewProduct.retail_price && quickViewProduct.discount > 0 && (
                      <span className="text-xl text-stone-300 line-through font-bold">₹{quickViewProduct.retail_price}</span>
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
                      <span>Add to Cart</span>
                    </button>
                    <Link 
                      to={`/product/${quickViewProduct.id}`}
                      className="px-6 py-4 border border-stone-200 rounded-2xl font-bold hover:bg-stone-50 transition-colors flex items-center justify-center"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar */}
        <aside className="w-full md:w-64 space-y-6 flex-shrink-0">
          <div className="bg-white p-6 rounded-2xl border border-stone-100 shadow-sm space-y-6 sticky top-20">
            <h3 className="font-bold text-lg">Filters</h3>
            
            {/* Category Filter */}
            <div className="space-y-2">
              <p className="text-sm font-bold text-stone-700">Category</p>
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`block w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    selectedCategory === cat ? 'bg-primary text-white' : 'text-stone-600 hover:bg-stone-50'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Price Filter */}
            <div className="space-y-2">
              <p className="text-sm font-bold text-stone-700">Price Range</p>
              <div className="flex items-center space-x-2">
                <input type="number" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} className="input-field w-full" placeholder="Min" />
                <span className="text-stone-300">-</span>
                <input type="number" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} className="input-field w-full" placeholder="Max" />
              </div>
            </div>

            {/* Rating Filter */}
            <div className="space-y-2">
              <p className="text-sm font-bold text-stone-700">Minimum Rating</p>
              {[5, 4, 3, 2, 1].map(rating => (
                <button
                  key={rating}
                  onClick={() => setSelectedRating(selectedRating === rating ? null : rating)}
                  className={`flex items-center space-x-2 w-full p-2 rounded-lg text-sm ${selectedRating === rating ? 'bg-amber-100 text-amber-900' : 'text-stone-600'}`}
                >
                  <Star size={16} fill={selectedRating && selectedRating >= rating ? "currentColor" : "none"} className="text-amber-400" />
                  <span>{rating}+ Stars</span>
                </button>
              ))}
            </div>
            
            <button onClick={() => { setSearchTerm(''); setSelectedCategory('All'); setSelectedRating(null); setMinPrice('0'); setMaxPrice('10000'); }} className="w-full btn-outline py-2">Clear Filters</button>
          </div>
        </aside>

        {/* Product Grid */}
        <div className="flex-1 space-y-8">
          <div className="flex flex-col sm:flex-row justify-between items-center bg-white p-4 rounded-2xl border border-stone-100 shadow-sm gap-4">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
              <input 
                type="text" 
                placeholder="Search..."
                className="input-field pl-10 pr-4 w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <select className="input-field w-full sm:w-40" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="relevance">Relevance</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="rating">Top Rated</option>
              <option value="newest">Newest First</option>
            </select>
          </div>

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
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0 }
              }}
              className="bg-white rounded-2xl overflow-hidden shadow-sm border border-stone-100 hover:shadow-md transition-all flex flex-col"
            >
              <Link to={`/product/${product.id}`} className="relative h-48 overflow-hidden block">
                <img 
                  src={product.image_url} 
                  alt={product.name}
                  loading="lazy"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-2 left-2 flex flex-col space-y-2">
                  {product.discount > 0 && (
                    <div className="bg-emerald-500 text-white px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider shadow-lg animate-pulse">
                      {product.discount}% OFF
                    </div>
                  )}
                </div>
                <div className="absolute top-2 right-2 flex flex-col space-y-2">
                  <div className={cn(
                    "bg-white/90 backdrop-blur px-2 py-1 rounded-lg text-xs font-bold shadow-sm flex flex-col items-end",
                    product.discount > 0 ? "text-emerald-600" : "text-primary"
                  )}>
                    <div className="flex items-center space-x-1">
                      {product.discount > 0 && product.retail_price && (
                        <span className="text-[10px] text-stone-400 line-through font-medium">₹{product.retail_price}</span>
                      )}
                      <span>₹{product.price}</span>
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
                  <button 
                    onClick={(e) => {
                      e.preventDefault();
                      setQuickViewProduct(product);
                    }}
                    className="p-2 bg-white/90 text-stone-400 hover:text-primary rounded-lg backdrop-blur shadow-sm transition-all"
                    title="Quick View"
                  >
                    <Search size={16} />
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
                    <button 
                      onClick={() => addToCart(product)}
                      className="flex-1 btn-primary flex items-center justify-center space-x-2"
                    >
                      <ShoppingCart size={18} />
                      <span>Add</span>
                    </button>
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
