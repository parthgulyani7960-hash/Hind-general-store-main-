import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Heart, ShoppingCart, Trash2, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Product } from '@/types';
import { useStore } from '@/StoreContext';
import toast from 'react-hot-toast';
import { fetchWithHandling } from '@/lib/api';
import { ProductSkeleton } from '@/components/ui/Skeleton';

export default function Wishlist() {
  const { wishlist, toggleWishlist, addToCart, products: allProducts, isLoadingProducts, isOnline } = useStore();
  
  const products = allProducts.filter((p: Product) => wishlist.includes(p.id));
  const loading = isLoadingProducts && allProducts.length === 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(6)].map((_, i) => (
              <ProductSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 py-12 pb-32 md:pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-serif font-bold text-stone-900">My Wishlist</h1>
              <p className="text-stone-500 mt-2">Products you've saved for later</p>
            </div>
            <Link to="/products" className="text-primary font-bold flex items-center space-x-2 hover:underline">
              <span>Continue Shopping</span>
              <ArrowRight size={18} />
            </Link>
          </div>

          {!isOnline && (
            <div className="bg-amber-50 border border-amber-200/60 rounded-[1.5rem] p-5 flex items-center text-amber-800">
              <span className="p-2.5 bg-amber-500/10 text-amber-600 rounded-xl mr-3 flex items-center justify-center">
                <Heart size={18} className="animate-pulse" />
              </span>
              <div>
                <p className="text-xs font-black uppercase tracking-wider">Offline State</p>
                <p className="text-xs text-amber-700/80 font-medium mt-0.5">Viewing saved wishlist items from local cache. Connect to complete purchases.</p>
              </div>
            </div>
          )}
        </div>

        {products.length === 0 ? (
          <div className="bg-white rounded-3xl p-16 text-center shadow-sm border border-stone-100">
            <div className="w-20 h-20 bg-stone-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Heart size={40} className="text-stone-200" />
            </div>
            <h2 className="text-2xl font-bold text-stone-900 mb-2">Your wishlist is empty</h2>
            <p className="text-stone-500 mb-8 max-w-md mx-auto">
              Save items you love to your wishlist and they'll appear here.
            </p>
            <Link to="/products" className="btn-primary px-8 py-4 inline-flex items-center space-x-2">
              <span>Browse Products</span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {products.map((product) => (
              <motion.div 
                key={product.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-3xl overflow-hidden shadow-sm border border-stone-100 group"
              >
                <div className="relative h-64 overflow-hidden">
                  <img 
                    src={product.image_url} 
                    alt={product.name}
                    loading="lazy"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <button 
                    onClick={() => toggleWishlist(product.id)}
                    className="absolute top-4 right-4 p-2 bg-white/90 backdrop-blur rounded-xl text-red-500 shadow-sm hover:bg-red-500 hover:text-white transition-all"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
                
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <span className="text-[10px] uppercase tracking-wider font-bold text-stone-400">{product.category}</span>
                      <h3 className="text-xl font-bold text-stone-900">{product.name}</h3>
                    </div>
                    <span className="text-lg font-bold text-primary">₹{product.price}</span>
                  </div>
                  
                  <button 
                    onClick={() => {
                      addToCart(product);
                      toast.success('Added to cart');
                    }}
                    className="w-full btn-primary py-4 flex items-center justify-center space-x-2"
                  >
                    <ShoppingCart size={20} />
                    <span>Move to Cart</span>
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
