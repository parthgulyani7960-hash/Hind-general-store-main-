import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShoppingCart, Share2, ArrowLeft, ShieldCheck, Truck, Info, Star, 
  MessageSquare, Plus, Minus, Clock, Camera, Image as ImageIcon,
  ChevronLeft, ChevronRight, X, MapPin, Trash2, List, ShoppingBag,
  CheckCircle2, ThumbsUp, Filter, Heart, Tag, Navigation2
} from 'lucide-react';
import { Product, Review, cn } from '../types';
import { useStore } from '../StoreContext';
import toast from 'react-hot-toast';
import { triggerFeedback } from '../App';

export default function ProductDetail() {
  const { id } = useParams();
  const [product, setProduct] = useState<Product | any>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [purchasedProductIds, setPurchasedProductIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [activeImage, setActiveImage] = useState(0);
  const [zoomIndex, setZoomIndex] = useState<number | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState<any>(null);
  const [variants, setVariants] = useState<any[]>([]);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [quantity, setQuantity] = useState(1);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { addToCart, user, cart, updateQuantity, bulkDiscounts, getProductPrice, simulatedRole, wishlist, toggleWishlist, t } = useStore();
  const navigate = useNavigate();
  const activeRole = simulatedRole || user?.role;
  const isInWishlist = wishlist.includes(product?.id);

  const handleToggleWishlist = () => {
    if (!user) {
      toast.error('Please login to manage wishlist');
      navigate('/login');
      return;
    }
    triggerFeedback('medium');
    toggleWishlist(product.id);
  };

  const getActivePrice = (p: any) => {
    if (!p) return 0;
    const basePrice = getProductPrice(p, activeRole);
    if (p.discount > 0) {
      return Math.round(basePrice * (1 - p.discount / 100));
    }
    return basePrice;
  };

  useEffect(() => {
    if (user) {
        fetch(`/api/orders/user/${user.id}`)
            .then(res => res.json())
            .then(orders => {
                const purchased = new Set<number>();
                orders.forEach((order: any) => {
                    order.items?.forEach((item: any) => purchased.add(item.product_id));
                });
                setPurchasedProductIds(Array.from(purchased));
            });
    }
  }, [user]);

  const isVerifiedPurchase = (review: any) => {
    return !!review.is_verified;
  };

  const productBulkDiscounts = bulkDiscounts.filter(bd => 
    bd.active && (
      (bd.entity_type === 'product' && bd.entity_id === Number(id)) ||
      (bd.entity_type === 'category' && bd.entity_name === product?.category)
    )
  ).sort((a, b) => a.min_qty - b.min_qty);

  const fetchProduct = () => {
    setLoading(true);
    fetch(`/api/products/${id}`)
      .then(res => {
        if (!res.ok) throw new Error('Product not found');
        return res.json();
      })
      .then(data => {
        setProduct(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  const fetchReviews = () => {
    fetch(`/api/products/${id}/reviews`)
      .then(res => res.json())
      .then(setReviews);
  };

  const fetchVariants = () => {
    fetch(`/api/products/${id}/variants`)
      .then(res => res.json())
      .then(data => {
        setVariants(data);
        const defaultVariant = data.find((v: any) => v.is_default);
        if (defaultVariant) setSelectedVariant(defaultVariant);
      });
  };

  const fetchRelatedProducts = () => {
    fetch(`/api/products/${id}/related`)
      .then(res => res.json())
      .then(setRelatedProducts);
  };

  useEffect(() => {
    fetchProduct();
    fetchReviews();
    fetchVariants();
    fetchRelatedProducts();
    setQuantity(1);
  }, [id]);

  const allImages = product ? [product.image_url, ...(product.images || [])].filter(Boolean) : [];

  const getDeliveryEstimate = () => {
    if (!user?.pin_code) return "3-5 business days";
    const pinPrefix = user.pin_code.substring(0, 2);
    if (pinPrefix === '14') return "2-4 hours (Local Delivery)"; // Ludhiana/Punjab
    if (['11', '12', '13', '15', '16'].includes(pinPrefix)) return "1-2 business days";
    return "3-5 business days";
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!user || user.role !== 'admin') {
      toast.error('Only admins can upload images');
      return;
    }
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    const uploadedUrls: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const reader = new FileReader();
      const promise = new Promise<string>((resolve) => {
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });
      uploadedUrls.push(await promise);
    }

    try {
      const res = await fetch(`/api/admin/products/${id}/images`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ images: uploadedUrls })
      });
      
      if (res.ok) {
        toast.success('Images uploaded successfully!');
        fetchProduct();
        setShowUploadModal(false);
      } else {
        toast.error('Failed to upload images');
      }
    } catch (err) {
      toast.error('Error uploading images');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteImage = async (imageUrl: string) => {
    if (!user || user.role !== 'admin') return;
    if (!window.confirm('Are you sure you want to delete this image?')) return;

    try {
      const res = await fetch(`/api/admin/products/${id}/images`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl })
      });
      
      if (res.ok) {
        toast.success('Image deleted');
        fetchProduct();
        if (activeImage >= allImages.length - 1) {
          setActiveImage(Math.max(0, allImages.length - 2));
        }
      } else {
        toast.error('Failed to delete image');
      }
    } catch (err) {
      toast.error('Error deleting image');
    }
  };

  const handleMoveImage = async (index: number, direction: 'up' | 'down') => {
    if (!user || user.role !== 'admin') return;
    
    // allImages is [product.image_url, ...product.images]
    const currentImages = [product.image_url, ...(product.images || [])].filter(Boolean);
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (newIndex < 0 || newIndex >= currentImages.length) return;
    
    const updatedAll = [...currentImages];
    const temp = updatedAll[index];
    updatedAll[index] = updatedAll[newIndex];
    updatedAll[newIndex] = temp;
    
    // Split back into image_url and images
    const newImageUrl = updatedAll[0];
    const newImages = updatedAll.slice(1);
    
    try {
      const res = await fetch(`/api/admin/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          ...product, 
          image: newImageUrl, 
          images: newImages 
        })
      });
      if (res.ok) {
        fetchProduct();
        setActiveImage(newIndex);
      }
    } catch (err) {
      toast.error('Failed to reorder images');
    }
  };

  const handleSetMainImage = async (imageUrl: string) => {
    if (!user || user.role !== 'admin') return;
    
    const currentAll = [product.image_url, ...(product.images || [])].filter(Boolean);
    const newImages = currentAll.filter(img => img !== imageUrl);
    const newImageUrl = imageUrl;

    try {
      const res = await fetch(`/api/admin/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          ...product, 
          image: newImageUrl, 
          images: newImages 
        })
      });
      if (res.ok) {
        toast.success('Main image updated');
        fetchProduct();
        setActiveImage(0);
      }
    } catch (err) {
      toast.error('Failed to update main image');
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error('Please login to leave a review');
      return;
    }
    try {
      await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: Number(id),
          user_name: user.name,
          rating,
          comment
        })
      });
      toast.success('Review submitted!');
      setComment('');
      setRating(5);
      fetchReviews();
    } catch (err) {
      toast.error('Failed to submit review');
    }
  };

  const handleShare = () => {
    const url = window.location.href;
    const text = `Check out this product: ${product?.name}`;
    
    // Create sharing options
    const shareData = {
      title: product?.name,
      text: text,
      url: url,
    };

    if (navigator.share) {
      navigator.share(shareData).catch(console.error);
    } else {
      // Fallback for desktop: Show alert or custom modal with links
      // For now, prompt user to copy link if share API not available
      navigator.clipboard.writeText(url);
      toast.success('Link copied to clipboard!');
      
      // Open platforms in new tab for copy link scenario
      const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`;
      const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
      
      window.open(whatsappUrl, '_blank');
      window.open(facebookUrl, '_blank');
    }
  };

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>;
  if (!product) return <div className="text-center py-20">Product not found</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <button onClick={() => navigate(-1)} className="flex items-center space-x-2 text-stone-500 hover:text-primary mb-8 transition-colors">
        <ArrowLeft size={20} />
        <span>Back to Store</span>
      </button>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        {/* Image Gallery */}
        <div className="space-y-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative rounded-3xl overflow-hidden shadow-lg border border-stone-100 bg-white aspect-square group"
          >
            {/* Zoom trigger */}
            <button
              onClick={() => setZoomIndex(activeImage)}
              className="absolute top-4 left-4 p-2 bg-white/80 backdrop-blur-sm rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10"
            >
              <ImageIcon size={20} />
            </button>
            <AnimatePresence mode="wait">
              <motion.img 
                key={activeImage}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                src={allImages[activeImage]} 
                alt={product.name} 
                loading="lazy"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover" 
              />
            </AnimatePresence>
            
            {allImages.length > 1 && (
              <>
                <button 
                  onClick={() => setActiveImage((prev) => (prev === 0 ? allImages.length - 1 : prev - 1))}
                  className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-white/80 backdrop-blur-sm rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <ChevronLeft size={20} />
                </button>
                <button 
                  onClick={() => setActiveImage((prev) => (prev === allImages.length - 1 ? 0 : prev + 1))}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-white/80 backdrop-blur-sm rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <ChevronRight size={20} />
                </button>
              </>
            )}

            {user?.role === 'admin' && (
              <div className="absolute bottom-4 right-4 flex space-x-2">
                {activeImage > 0 && (
                  <button 
                    onClick={() => handleDeleteImage(allImages[activeImage])}
                    className="p-3 bg-red-500 text-white rounded-full shadow-xl hover:scale-110 transition-transform"
                    title="Delete Photo"
                  >
                    <Trash2 size={20} />
                  </button>
                )}
                <button 
                  onClick={() => setShowUploadModal(true)}
                  className="p-3 bg-primary text-white rounded-full shadow-xl hover:scale-110 transition-transform"
                  title="Manage Photos"
                >
                  <Camera size={20} />
                </button>
              </div>
            )}
          </motion.div>

          {allImages.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {allImages.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImage(i)}
                  className={cn(
                    "relative w-20 h-20 rounded-xl overflow-hidden border-2 transition-all flex-shrink-0",
                    activeImage === i ? "border-primary shadow-md" : "border-transparent opacity-60 hover:opacity-100"
                  )}
                >
                  <img src={img} className="w-full h-full object-cover" alt={`Thumbnail ${i}`} loading="lazy" referrerPolicy="no-referrer" />
                </button>
              ))}
            </div>
          )}
        </div>

        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-8"
        >
          <div>
            <div className="flex justify-between items-start">
              <span className="text-xs font-bold uppercase tracking-widest text-primary bg-primary/10 px-3 py-1 rounded-full">{product.category}</span>
              <div className="flex items-center space-x-1 text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
                <Truck size={14} />
                <span className="text-[10px] font-bold uppercase">In Stock</span>
              </div>
            </div>
            <h1 className="text-4xl font-bold text-stone-900 mt-4">{product.name}</h1>
            <div className="flex items-center space-x-3 mt-2">
              <div className="flex items-center space-x-1.5 bg-amber-50 px-2 py-1 rounded-lg border border-amber-100">
                <Star size={14} className="text-amber-500" fill="currentColor" />
                <span className="text-sm font-black text-amber-700">{(product.avg_rating || 0).toFixed(1)}</span>
              </div>
              <div className="flex text-amber-400">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={14} fill={i < Math.round(product.avg_rating || 0) ? "currentColor" : "none"} />
                ))}
              </div>
              <span className="text-sm text-stone-400 font-bold">({product.review_count || 0} reviews)</span>
            </div>
            
            <div className="flex flex-col space-y-1">
              <div className="flex items-baseline space-x-3 mt-2">
                <p className={cn(
                  "text-4xl font-black",
                  getActivePrice(product) < product.price ? "text-emerald-600" : "text-primary"
                )}>
                  ₹{selectedVariant 
                    ? (product.discount > 0 ? Math.round(selectedVariant.price * (1 - product.discount / 100)) : selectedVariant.price)
                    : getActivePrice(product)}
                </p>
                {(product.discount > 0 || (selectedVariant ? selectedVariant.price : getProductPrice(product, user?.role)) < (selectedVariant ? selectedVariant.price : product.price)) && (
                  <p className="text-xl text-stone-400 line-through font-medium">
                    ₹{selectedVariant ? selectedVariant.price : product.price}
                  </p>
                )}
                <span className="text-sm text-stone-400 font-normal">per {selectedVariant ? selectedVariant.name : (product.unit || 'unit')}</span>
              </div>
              {user?.role === 'wholesaler' && product.wholesale_price && !selectedVariant && (
                <span className="text-xs font-black text-emerald-600 uppercase tracking-widest">Wholesale Account Pricing Applied</span>
              )}
              {user?.role === 'retailer' && product.retail_price && !selectedVariant && (
                <span className="text-xs font-black text-blue-600 uppercase tracking-widest">Retailer Account Pricing Applied</span>
              )}
            </div>
          </div>

          {/* Variant Selection */}
          {variants.length > 0 && (
            <div className="space-y-4">
              <p className="text-sm font-bold text-stone-700 uppercase tracking-wider">Select Variant</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {variants.map((v) => (
                  <button
                    key={v.id}
                    onClick={() => setSelectedVariant(v)}
                    className={cn(
                      "p-4 rounded-2xl border-2 transition-all text-left flex flex-col",
                      selectedVariant?.id === v.id 
                        ? "border-primary bg-primary/5 shadow-md" 
                        : "border-stone-100 bg-white hover:border-stone-200"
                    )}
                  >
                    <span className="font-bold text-sm">{v.name}</span>
                    <span className="text-primary font-bold">
                      ₹{product.discount > 0 ? Math.round(v.price * (1 - product.discount / 100)) : v.price}
                    </span>
                    {product.discount > 0 && (
                      <span className="text-[10px] text-stone-400 line-through">₹{v.price}</span>
                    )}
                    {v.unit_quantity > 1 && (
                      <span className="text-[10px] text-stone-400">Pack of {v.unit_quantity}</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Delivery Estimate */}
          <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-primary">
                <Truck size={18} />
                <span className="text-sm font-bold uppercase tracking-tight">Estimated Delivery</span>
              </div>
              {user?.pin_code && (
                <div className="flex items-center space-x-1 text-[10px] text-stone-400 font-bold">
                  <MapPin size={10} />
                  <span>{user.pin_code}</span>
                </div>
              )}
            </div>
            <p className="text-lg font-bold text-stone-800">{getDeliveryEstimate()}</p>
            <p className="text-[10px] text-stone-400">Delivery times are estimates and may vary based on order volume.</p>
          </div>

          {/* Bulk Discount Tiers */}
          {productBulkDiscounts.length > 0 && (
            <div className="space-y-4 p-6 bg-emerald-50 rounded-3xl border border-emerald-100">
              <div className="flex items-center space-x-2 text-emerald-700">
                <Tag size={18} />
                <p className="text-sm font-bold uppercase tracking-wider">Bulk Savings Available</p>
              </div>
              <div className="grid grid-cols-1 gap-2">
                {productBulkDiscounts.map((bd, i) => (
                  <div key={i} className="flex items-center justify-between bg-white/50 p-3 rounded-xl border border-emerald-200/50">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center text-emerald-600 font-bold text-xs">
                        {bd.min_qty}+
                      </div>
                      <p className="text-sm font-medium text-emerald-800">Buy {bd.min_qty} or more units</p>
                    </div>
                    <p className="text-sm font-bold text-emerald-600">
                      {bd.discount_type === 'percentage' ? `${bd.discount_value}% Off` : `₹${bd.discount_value} Off`}
                    </p>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-emerald-600 font-medium italic">* Discount applied automatically in cart based on quantity.</p>
            </div>
          )}

          {/* Pricing Grid */}
          {(product.wholesale_price || product.retail_price) && (
            <div className="grid grid-cols-2 gap-4 p-4 bg-stone-50 rounded-2xl border border-stone-100">
              {product.wholesale_price && (
                <div>
                  <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Wholesale Price</p>
                  <p className="text-lg font-bold text-stone-700">₹{product.wholesale_price}</p>
                </div>
              )}
              {product.retail_price && (
                <div>
                  <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Retail Price</p>
                  <p className="text-lg font-bold text-stone-700">₹{product.retail_price}</p>
                </div>
              )}
            </div>
          )}

          <p className="text-stone-600 leading-relaxed text-lg">{product.description}</p>

          {product.specifications && Object.keys(product.specifications).length > 0 && (
            <div className="space-y-4 p-6 bg-stone-50 rounded-3xl border border-stone-100">
              <div className="flex items-center space-x-2 text-stone-700">
                <List size={18} />
                <p className="text-sm font-bold uppercase tracking-wider">Product Specifications</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {Object.entries(product.specifications).map(([key, value]) => (
                  <div key={key} className="flex flex-col space-y-1">
                    <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">{key}</span>
                    <span className="text-sm font-bold text-stone-700">{value as string}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-col gap-4">
            <div className="flex flex-col xl:flex-row items-stretch xl:items-center gap-4 flex-1">
              <div className="flex items-center justify-between xl:justify-center bg-stone-50 rounded-2xl p-2 border border-stone-200">
                <button 
                  onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
                  className="p-3 hover:bg-white rounded-xl transition-all text-primary shadow-sm min-w-[48px] min-h-[48px] flex items-center justify-center"
                >
                  <Minus size={20} />
                </button>
                <div className="flex flex-col items-center px-4">
                  <span className="text-2xl font-bold">{quantity}</span>
                </div>
                <button 
                  onClick={() => setQuantity(prev => Math.min(selectedVariant ? selectedVariant.stock : product.stock, prev + 1))}
                  className="p-3 hover:bg-white rounded-xl transition-all text-primary shadow-sm min-w-[48px] min-h-[48px] flex items-center justify-center"
                >
                  <Plus size={20} />
                </button>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 flex-1">
                <button 
                  onClick={() => {
                    addToCart(product, selectedVariant, quantity);
                    toast.success('Added to cart!');
                  }}
                  className="flex-1 btn-outline border-primary text-primary py-4 flex items-center justify-center space-x-2 text-lg hover:bg-primary/5 min-h-[56px] mobile-active-state"
                >
                  <ShoppingCart size={22} />
                  <span>Add to Cart</span>
                </button>
                <button 
                  onClick={() => {
                    addToCart(product, selectedVariant, quantity);
                    navigate('/cart');
                  }}
                  className="flex-1 btn-primary py-4 flex items-center justify-center space-x-2 text-lg min-h-[56px] mobile-active-state"
                >
                  <ShoppingBag size={22} />
                  <span>Buy Now</span>
                </button>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <button 
                onClick={handleShare}
                className="flex-1 px-6 py-4 bg-stone-100 text-stone-600 rounded-xl hover:bg-stone-200 transition-all flex items-center justify-center space-x-2 font-bold min-h-[56px] mobile-active-state"
                title="Share Product"
              >
                <Share2 size={20} />
                <span>Share</span>
              </button>
              
              <button 
                onClick={handleToggleWishlist}
                className={cn(
                  "flex-1 px-6 py-4 rounded-xl transition-all flex items-center justify-center space-x-2 font-bold min-h-[56px] mobile-active-state",
                  isInWishlist ? "bg-red-50 text-red-500 border border-red-200 hover:bg-red-100" : "bg-stone-100 text-stone-600 border border-transparent hover:bg-stone-200"
                )}
                title={isInWishlist ? "Remove from Wishlist" : "Add to Wishlist"}
              >
                <Heart size={20} className={isInWishlist ? "fill-current" : ""} />
                <span>{isInWishlist ? "Wishlisted" : "Wishlist"}</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-8 border-t border-stone-100">
            <div className="flex items-center space-x-3 text-stone-600">
              <ShieldCheck className="text-primary" size={24} />
              <span className="text-sm font-medium">100% Quality Guaranteed</span>
            </div>
            <div className="flex items-center space-x-3 text-stone-600">
              <Truck className="text-primary" size={24} />
              <span className="text-sm font-medium">Fast Local Delivery</span>
            </div>
            <div className="flex items-center space-x-3 text-stone-600">
              <Info className="text-primary" size={24} />
              <span className="text-sm font-medium">Stock: {selectedVariant ? selectedVariant.stock : product.stock} {product.unit}s available</span>
            </div>
            {product.reorder_point !== undefined && (
              <div className="flex items-center space-x-3 text-stone-600">
                <Clock className="text-primary" size={24} />
                <span className="text-sm font-medium">Reorder Point: {product.reorder_point} {product.unit}s</span>
              </div>
            )}
            {product.max_qty !== undefined && (
              <div className="flex items-center space-x-3 text-stone-600">
                <Plus className="text-primary" size={24} />
                <span className="text-sm font-medium">Max Order Qty: {product.max_qty} {product.unit}s</span>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Related Products Section */}
      {relatedProducts.length > 0 && (
        <div className="mt-20 space-y-8">
          <div className="flex justify-between items-end">
            <div>
              <h2 className="text-3xl font-bold text-stone-900">Related Products</h2>
              <p className="text-stone-500">You might also like these items from {product.category}</p>
            </div>
            <Link to="/products" className="text-primary font-bold hover:underline flex items-center space-x-1">
              <span>View All</span>
              <ChevronRight size={16} />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {relatedProducts.map((p) => (
              <motion.div 
                key={p.id}
                whileHover={{ y: -5 }}
                className="bg-white rounded-2xl overflow-hidden shadow-sm border border-stone-100 group"
              >
                <Link to={`/product/${p.id}`} className="relative h-48 block overflow-hidden">
                  <img 
                    src={p.image_url} 
                    alt={p.name} 
                    loading="lazy"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  {p.discount > 0 && (
                    <div className="absolute top-2 left-2 bg-emerald-500 text-white text-[10px] font-bold px-2 py-1 rounded-lg">
                      {p.discount}% OFF
                    </div>
                  )}
                  <button 
                    onClick={(e) => {
                      e.preventDefault();
                      toggleWishlist(p.id);
                    }}
                    className={cn(
                      "absolute top-2 right-2 p-2 rounded-lg backdrop-blur shadow-sm transition-all z-20",
                      wishlist.includes(p.id) 
                        ? "bg-red-500 text-white" 
                        : "bg-white/90 text-stone-400 hover:text-red-500"
                    )}
                  >
                    <Heart size={16} fill={wishlist.includes(p.id) ? "currentColor" : "none"} />
                  </button>
                </Link>
                <div className="p-4 space-y-2">
                  <div className="flex justify-between items-start">
                    <h3 className="font-bold text-stone-900 line-clamp-1">{p.name}</h3>
                    <p className="font-bold text-primary">₹{p.price}</p>
                  </div>
                  <p className="text-xs text-stone-500 line-clamp-2">{p.description}</p>
                  <button 
                    onClick={() => addToCart(p)}
                    className="w-full py-2 bg-stone-50 text-primary rounded-xl text-sm font-bold hover:bg-primary hover:text-white transition-all flex items-center justify-center space-x-2"
                  >
                    <ShoppingCart size={14} />
                    <span>Add to Cart</span>
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Reviews Section */}
      <div className="mt-32 space-y-12">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold text-stone-900">Customer Feedback</h2>
            <p className="text-stone-500 font-medium">What our verified customers are saying</p>
          </div>
          <button 
            onClick={() => {
              const el = document.getElementById('review-form');
              el?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="text-primary font-bold hover:underline flex items-center space-x-1"
          >
            <span>Write a Review</span>
            <Plus size={16} />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Rating Summary Card */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white p-8 rounded-3xl border border-stone-100 shadow-sm space-y-6">
              <div className="flex items-center space-x-6">
                <div className="text-center">
                  <p className="text-6xl font-black text-stone-900">{(product.avg_rating || 0).toFixed(1)}</p>
                  <div className="flex text-amber-400 mt-2">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={18} fill={i < Math.round(product.avg_rating || 0) ? "currentColor" : "none"} />
                    ))}
                  </div>
                  <p className="text-stone-400 text-xs font-bold uppercase tracking-widest mt-2">{product.review_count || 0} Reviews</p>
                </div>
                <div className="flex-1 space-y-2">
                  {[5, 4, 3, 2, 1].map((stars) => {
                    const count = reviews.filter(r => r.rating === stars).length;
                    const percentage = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
                    return (
                      <div key={stars} className="flex items-center space-x-3 text-xs">
                        <span className="font-bold text-stone-500 w-3">{stars}</span>
                        <div className="flex-1 h-2 bg-stone-100 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${percentage}%` }}
                            className="h-full bg-primary" 
                          />
                        </div>
                        <span className="text-stone-400 w-8 text-right font-medium">{Math.round(percentage)}%</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div id="review-form" className="pt-6 border-t border-stone-50">
                <h3 className="text-lg font-bold mb-4">Post a Review</h3>
                <form onSubmit={handleSubmitReview} className="space-y-4">
                  <div className="flex flex-col space-y-2">
                    <label className="text-[10px] font-black uppercase text-stone-400 tracking-widest">Rate this product</label>
                    <div className="flex space-x-1">
                      {[1, 2, 3, 4, 5].map((num) => (
                        <button
                          key={num}
                          type="button"
                          onClick={() => setRating(num)}
                          className={cn(
                            "p-1.5 transition-all",
                            rating >= num ? "text-amber-400" : "text-stone-200"
                          )}
                        >
                          <Star size={24} fill={rating >= num ? "currentColor" : "none"} />
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-stone-400 tracking-widest">Your Experience</label>
                    <textarea
                      required
                      className="w-full bg-stone-50 border-stone-100 rounded-2xl p-4 text-sm font-medium focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all min-h-[120px] outline-none placeholder:text-stone-300"
                      placeholder="Share your thoughts with other customers..."
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                    />
                  </div>
                  <button type="submit" className="w-full btn-primary py-4 text-xs font-black uppercase tracking-[0.2em] shadow-xl shadow-primary/20">
                    Submit Feedback
                  </button>
                </form>
              </div>
            </div>
          </div>

          {/* Individual Reviews List */}
          <div className="lg:col-span-8 flex flex-col space-y-6">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2 text-stone-400">
                <Filter size={14} />
                <span className="text-xs font-bold uppercase tracking-widest">Sort: Most Recent</span>
              </div>
            </div>

            {reviews.length === 0 ? (
              <div className="text-center py-20 bg-stone-50 rounded-3xl border border-dashed border-stone-200">
                <MessageSquare className="mx-auto text-stone-200 mb-4" size={48} />
                <p className="text-stone-400 font-medium">No reviews yet. Be the first to share your thoughts!</p>
              </div>
            ) : (
              reviews.map((review, i) => (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  key={review.id} 
                  className="bg-white p-8 rounded-3xl border border-stone-100 shadow-sm relative group overflow-hidden"
                >
                  <div className="flex items-start justify-between relative z-10">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-stone-100 rounded-full flex items-center justify-center text-primary font-black text-lg border-2 border-white shadow-sm">
                        {review.user_name?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <p className="font-bold text-stone-900">{review.user_name}</p>
                          {review.is_verified && (
                            <div className="flex items-center space-x-1 bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full border border-emerald-100">
                              <CheckCircle2 size={10} />
                              <span className="text-[9px] font-black uppercase tracking-wider">Verified Purchase</span>
                            </div>
                          )}
                        </div>
                        <p className="text-[10px] text-stone-400 font-bold uppercase tracking-widest mt-0.5">{new Date(review.created_at).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                      </div>
                    </div>
                    <div className="flex text-amber-400 bg-amber-50 p-1.5 px-3 rounded-full border border-amber-100">
                      {[...Array(5)].map((_, starIdx) => (
                        <Star key={starIdx} size={14} fill={starIdx < review.rating ? "currentColor" : "none"} />
                      ))}
                    </div>
                  </div>
                  
                  <div className="mt-6 relative z-10">
                    <p className="text-stone-600 leading-relaxed font-medium whitespace-pre-wrap">{review.comment}</p>
                  </div>
                  
                  {review.response && (
                    <div className="mt-6 p-6 bg-primary/5 rounded-2xl border border-primary/10 relative z-10">
                      <div className="flex items-center space-x-2 mb-3">
                        <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center shadow-sm">
                          <span className="text-[10px] text-white font-black">S</span>
                        </div>
                        <p className="text-[10px] font-black text-primary uppercase tracking-[0.1em]">Store Performance Response</p>
                      </div>
                      <p className="text-sm text-stone-700 font-bold leading-relaxed">{review.response}</p>
                    </div>
                  )}

                  <div className="mt-6 pt-6 border-t border-stone-50 flex items-center space-x-4">
                    <button className="flex items-center space-x-1.5 text-[10px] font-bold text-stone-400 hover:text-primary transition-colors">
                      <ThumbsUp size={12} />
                      <span>Helpful</span>
                    </button>
                    <button className="flex items-center space-x-1.5 text-[10px] font-bold text-stone-400 hover:text-red-400 transition-colors">
                      <span>Report</span>
                    </button>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Upload Modal */}
      <AnimatePresence>
        {showUploadModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white w-full max-w-md rounded-3xl p-8 shadow-2xl relative"
            >
              <button 
                onClick={() => setShowUploadModal(false)}
                className="absolute top-6 right-6 text-stone-400 hover:text-stone-900 transition-colors"
              >
                <X size={24} />
              </button>

              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <ImageIcon className="text-primary" size={32} />
                </div>
                <h2 className="text-2xl font-bold">Manage Product Photos</h2>
                <p className="text-stone-500 text-sm">Upload, reorder, or set the main image</p>
              </div>

              <div className="space-y-6">
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-stone-200 rounded-2xl p-6 text-center hover:border-primary hover:bg-primary/5 transition-all cursor-pointer group"
                >
                  <Camera size={24} className="mx-auto text-stone-300 group-hover:text-primary transition-colors mb-2" />
                  <p className="text-xs font-bold text-stone-500 group-hover:text-primary transition-colors">Click to upload more</p>
                </div>

                <div className="grid grid-cols-3 gap-3 max-h-[400px] overflow-y-auto p-1 scrollbar-hide">
                  {allImages.map((img, i) => (
                    <div key={i} className="relative aspect-square rounded-xl overflow-hidden border border-stone-100 group shadow-sm">
                      <img src={img} className="w-full h-full object-cover" alt="" />
                      
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center space-y-2">
                        <div className="flex items-center space-x-2">
                          {i > 0 && (
                            <button 
                              onClick={() => handleMoveImage(i, 'up')}
                              className="p-1.5 bg-white rounded-full text-stone-600 hover:text-primary shadow-sm"
                              title="Move Up"
                            >
                              <ChevronLeft size={14} />
                            </button>
                          )}
                          <button 
                            onClick={() => handleDeleteImage(img)}
                            className="p-1.5 bg-red-500 rounded-full text-white hover:bg-red-600 shadow-sm"
                            title="Delete"
                          >
                            <Trash2 size={14} />
                          </button>
                          {i < allImages.length - 1 && (
                            <button 
                              onClick={() => handleMoveImage(i, 'down')}
                              className="p-1.5 bg-white rounded-full text-stone-600 hover:text-primary shadow-sm"
                              title="Move Down"
                            >
                              <ChevronRight size={14} />
                            </button>
                          )}
                        </div>
                        
                        {img !== product.image_url && (
                          <button 
                            onClick={() => handleSetMainImage(img)}
                            className="px-2 py-1 bg-white text-stone-900 text-[9px] font-bold rounded-lg hover:bg-primary hover:text-white transition-colors shadow-sm"
                          >
                            Set as Main
                          </button>
                        )}
                      </div>

                      {img === product.image_url && (
                        <div className="absolute top-2 left-2 bg-primary text-white text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter shadow-lg">Main</div>
                      )}
                    </div>
                  ))}
                </div>

                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  multiple 
                  accept="image/*" 
                  onChange={handleImageUpload} 
                />

                {uploading && (
                  <div className="flex items-center justify-center space-x-3 p-4 bg-stone-50 rounded-xl">
                    <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                    <span className="text-sm font-bold text-stone-600">Uploading images...</span>
                  </div>
                )}

                <button 
                  onClick={() => setShowUploadModal(false)}
                  className="w-full py-4 text-stone-500 font-bold hover:text-stone-900 transition-colors"
                >
                  Maybe Later
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Zoom Modal */}
      <AnimatePresence>
        {zoomIndex !== null && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/95 backdrop-blur-md"
            onClick={() => setZoomIndex(null)}
          >
            <button 
              onClick={() => setZoomIndex(null)}
              className="absolute top-6 right-6 p-2 bg-white/10 text-white rounded-full hover:bg-white/20 z-10"
            >
              <X size={24} />
            </button>
            <button 
                onClick={(e) => { e.stopPropagation(); setZoomIndex(prev => prev === null ? null : (prev === 0 ? allImages.length - 1 : prev - 1))}}
                className="absolute left-6 p-3 bg-white/10 text-white rounded-full hover:bg-white/20 z-10"
            >
                <ChevronLeft size={24} />
            </button>
            <button 
                onClick={(e) => { e.stopPropagation(); setZoomIndex(prev => prev === null ? null : (prev === allImages.length - 1 ? 0 : prev + 1))}}
                className="absolute right-6 p-3 bg-white/10 text-white rounded-full hover:bg-white/20 z-10"
            >
                <ChevronRight size={24} />
            </button>
            <motion.img 
              key={zoomIndex}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              src={allImages[zoomIndex]}
              alt="Zoomed"
              className="max-w-full max-h-full object-contain"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
