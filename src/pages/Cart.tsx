import { motion, AnimatePresence } from 'motion/react';
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight, Truck, MapPin, Tag, X, RefreshCw, CheckCircle2, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useStore } from '../StoreContext';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { calculateBulkDiscount, cn } from '../lib/utils';

export default function Cart() {
  const { t, cart, updateQuantity, removeFromCart, user, appliedCoupon, setAppliedCoupon, bulkDiscounts } = useStore();
  const [couponCode, setCouponCode] = useState(appliedCoupon?.code || '');
  const [isValidating, setIsValidating] = useState(false);

  const cartWithDiscounts = cart.map(item => {
    // The 'price' field in the cart item is already adjusted for the user role in StoreContext
    const basePrice = item.price;
    const bulkDiscountAmount = calculateBulkDiscount(item, item.quantity, bulkDiscounts);
    
    // Calculate next tier for hint
    const relevantDiscounts = bulkDiscounts.filter(bd => 
      bd.active && (
        (bd.entity_type === 'product' && bd.entity_id === item.id) ||
        (bd.entity_type === 'category' && bd.entity_name === item.category)
      )
    ).sort((a, b) => a.min_qty - b.min_qty);

    const nextTier = relevantDiscounts.find(bd => bd.min_qty > item.quantity);

    return {
      ...item,
      basePrice,
      bulkDiscountAmount,
      finalPrice: basePrice - bulkDiscountAmount,
      nextTier
    };
  });

  const subtotal = cartWithDiscounts.reduce((acc, item) => {
    return acc + item.finalPrice * item.quantity;
  }, 0);

  const totalBulkDiscount = cartWithDiscounts.reduce((acc, item) => {
    return acc + item.bulkDiscountAmount * item.quantity;
  }, 0);
  
  const couponDiscount = appliedCoupon 
    ? (appliedCoupon.type === 'percentage' 
        ? (subtotal * appliedCoupon.value) / 100 
        : appliedCoupon.value)
    : 0;

  const total = subtotal - couponDiscount;
  const freeDeliveryThreshold = 500;
  const progressToFree = Math.min((subtotal / freeDeliveryThreshold) * 100, 100);
  const remainingForFree = Math.max(freeDeliveryThreshold - subtotal, 0);

  const handleApplyCoupon = async () => {
    if (!couponCode) return;
    if (appliedCoupon) {
      toast.error('A coupon is already applied. Remove it first to use another.');
      return;
    }
    setIsValidating(true);
    try {
      const res = await fetch(`/api/coupons/validate?code=${couponCode}&total=${subtotal}`);
      const data = await res.json();
      if (data.success) {
        setAppliedCoupon(data.coupon);
        toast.success('Coupon applied successfully!');
      } else {
        toast.error(data.message || 'Invalid coupon code');
      }
    } catch (err) {
      toast.error('Failed to validate coupon. Please try again.');
    } finally {
      setIsValidating(false);
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
  };

  const getDeliveryEstimate = () => {
    if (!user?.pin_code) return "3-5 business days";
    const pinPrefix = user.pin_code.substring(0, 2);
    if (pinPrefix === '14') return "2-4 hours (Local Delivery)"; // Ludhiana/Punjab
    if (['11', '12', '13', '15', '16'].includes(pinPrefix)) return "1-2 business days";
    return "3-5 business days";
  };

  if (cart.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="space-y-8"
        >
          <div className="w-32 h-32 bg-stone-100 rounded-[2.5rem] flex items-center justify-center mx-auto relative group">
            <ShoppingBag size={56} className="text-stone-300 group-hover:text-primary transition-colors duration-500" />
            <motion.div 
              animate={{ 
                scale: [1, 1.2, 1],
                rotate: [0, 10, -10, 0]
              }}
              transition={{ repeat: Infinity, duration: 3 }}
              className="absolute -top-2 -right-2 w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center"
            >
              <Plus size={20} className="text-primary" />
            </motion.div>
          </div>
          <div className="space-y-2">
            <h1 className="text-4xl font-black text-stone-900 tracking-tight">{t('empty_cart') || 'Your Bag is Empty'}</h1>
            <p className="text-stone-500 max-w-sm mx-auto text-lg">{t('empty_cart_msg') || "Explore our premium selection and add some essentials to your bag."}</p>
          </div>
          <Link to="/products" className="inline-flex items-center space-x-3 bg-stone-900 text-white px-10 py-5 rounded-2xl font-black uppercase tracking-widest hover:bg-stone-800 transition-all shadow-xl shadow-stone-900/20 active:scale-95 group">
            <span>{t('start_shopping') || 'Return to Shop'}</span>
            <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-12">
        <div>
          <h1 className="text-5xl font-black text-stone-900 tracking-tighter">{t('shopping_cart') || 'Cart'}</h1>
          <p className="text-stone-500 font-bold mt-2 flex items-center">
            <ShoppingBag size={16} className="mr-2" />
            {cart.length} {cart.length === 1 ? 'item' : 'items'} in your bag
          </p>
        </div>
        
        {remainingForFree > 0 ? (
          <div className="bg-white p-6 rounded-[2.5rem] shadow-xl shadow-stone-200/30 border border-stone-100 max-w-sm w-full relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full -mr-12 -mt-12 transition-transform group-hover:scale-150 duration-700" />
            <div className="relative z-10">
              <div className="flex justify-between items-center mb-4">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-400">Unlock Free Delivery</span>
                <span className="text-[10px] font-black text-primary bg-primary/10 px-2 py-1 rounded-md">₹{remainingForFree} to go</span>
              </div>
              <div className="h-2.5 bg-stone-100 rounded-full overflow-hidden shadow-inner">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${progressToFree}%` }}
                  transition={{ type: 'spring', stiffness: 50, damping: 20 }}
                  className="h-full bg-linear-to-r from-primary to-accent relative"
                >
                  <motion.div 
                    animate={{ x: ['-100%', '200%'] }}
                    transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
                    className="absolute inset-0 bg-linear-to-r from-transparent via-white/30 to-transparent"
                  />
                </motion.div>
              </div>
              <p className="text-[9px] font-bold text-stone-400 mt-3 flex items-center">
                <Clock size={12} className="mr-1.5" />
                Valid for next <span className="text-stone-600 ml-1">24:00:00</span>
              </p>
            </div>
          </div>
        ) : (
          <motion.div 
            initial={{ scale: 0.9, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            className="bg-emerald-500 px-8 py-4 rounded-[2rem] shadow-xl shadow-emerald-500/20 flex items-center space-x-4 border border-emerald-400"
          >
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-white backdrop-blur-md">
              <Truck size={20} className="animate-bounce" />
            </div>
            <div>
               <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-100">Congratulations</p>
               <p className="text-white font-black text-sm tracking-tight">Free Delivery Activated!</p>
            </div>
          </motion.div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        <div className="lg:col-span-8 space-y-4">
          <AnimatePresence mode="popLayout">
            {cartWithDiscounts.map((item, index) => (
              <motion.div 
                key={`${item.id}-${item.selectedVariant?.id || 'base'}`}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, filter: "blur(8px)" }}
                transition={{ delay: index * 0.05 }}
                className="bg-white p-6 rounded-[2rem] shadow-sm border border-stone-100 flex items-center gap-6 group hover:border-primary/20 transition-all duration-500 border-l-4 border-l-transparent hover:border-l-primary"
              >
                <div className="relative shrink-0 overflow-hidden rounded-2xl">
                  <img 
                    src={item.image_url} 
                    className="w-28 h-28 object-cover transition-transform duration-700 group-hover:scale-110" 
                    alt={item.name} 
                    loading="lazy"
                    referrerPolicy="no-referrer"
                  />
                  {item.discount > 0 && (
                    <div className="absolute top-2 left-2 bg-red-500 text-white text-[8px] font-black uppercase px-2 py-1 rounded-lg shadow-lg">
                      {item.discount}% OFF
                    </div>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-2">
                    <div className="space-y-1">
                      <h3 className="font-black text-xl text-stone-900 group-hover:text-primary transition-colors truncate">{item.name}</h3>
                      <div className="flex flex-wrap items-center gap-3">
                        {item.selectedVariant && (
                          <span className="bg-stone-100 text-stone-600 text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg">
                            {item.selectedVariant.name}
                          </span>
                        )}
                        <span className="text-[10px] font-bold text-stone-400">₹{item.finalPrice} / {item.unit}</span>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="flex flex-col items-end">
                        <div className="flex items-center space-x-2">
                          {(item.basePrice !== item.finalPrice) && (
                            <span className="text-stone-300 text-sm line-through font-medium italic">₹{item.basePrice * item.quantity}</span>
                          )}
                          <span className="font-black text-2xl text-stone-900 tracking-tighter italic">₹{item.finalPrice * item.quantity}</span>
                        </div>
                        {item.bulkDiscountAmount > 0 && (
                          <span className="bg-emerald-50 text-emerald-600 text-[9px] font-black uppercase tracking-tighter px-2 py-0.5 rounded-md mt-1">
                            Save ₹{item.bulkDiscountAmount * item.quantity}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center space-x-2 bg-stone-50 rounded-2xl p-1.5 border border-stone-100">
                      <button 
                        onClick={() => updateQuantity(item.id, -1, item.selectedVariant?.id)} 
                        className="w-10 h-10 flex items-center justify-center hover:bg-white hover:text-primary active:scale-90 rounded-xl transition-all shadow-sm"
                      >
                        <Minus size={16} strokeWidth={3} />
                      </button>
                      <span className="font-black text-lg w-12 text-center text-stone-900 select-none">
                        {item.quantity}
                      </span>
                      <button 
                        onClick={() => updateQuantity(item.id, 1, item.selectedVariant?.id)} 
                        className="w-10 h-10 flex items-center justify-center bg-white text-stone-800 hover:text-primary active:scale-90 rounded-xl transition-all shadow-md shadow-stone-200/50"
                      >
                        <Plus size={16} strokeWidth={3} />
                      </button>
                    </div>

                    <div className="flex items-center gap-4">
                      {item.nextTier && (
                        <div className="hidden md:flex items-center space-x-2 text-[9px] font-black uppercase text-amber-600 bg-amber-50 px-3 py-2 rounded-xl border border-amber-100 animate-pulse">
                          <Tag size={12} />
                          <span>+ {item.nextTier.min_qty - item.quantity} to save more!</span>
                        </div>
                      )}
                      
                      <button 
                        onClick={() => removeFromCart(item.id, item.selectedVariant?.id)}
                        className="p-3 text-stone-300 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all group/del"
                        title="Remove Item"
                      >
                        <Trash2 size={20} className="group-hover/del:scale-110 transition-transform" />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        <div className="lg:col-span-4 sticky top-24">
          <div className="space-y-6">
            <div className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-stone-200/40 border border-stone-100 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full -mr-12 -mt-12 transition-transform duration-1000 group-hover:scale-150" />
              
              <h3 className="text-2xl font-black text-stone-900 mb-8 border-b border-stone-50 pb-4">{t('order_summary') || 'Summary'}</h3>
              
              <div className="space-y-6">
                {/* Coupon Section */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center px-1">
                    <span className="text-[10px] font-black text-stone-400 uppercase tracking-[0.2em]">Promo Code</span>
                    {appliedCoupon && (
                      <span className="text-[10px] font-black text-emerald-500 uppercase flex items-center">
                        <CheckCircle2 size={12} className="mr-1" />
                        Active
                      </span>
                    )}
                  </div>
                  
                  <div className={cn(
                    "relative flex items-center p-1.5 rounded-2xl border-2 transition-all group",
                    appliedCoupon ? "border-emerald-200 bg-emerald-50/20" : "border-stone-50 bg-stone-50 focus-within:border-stone-900 focus-within:bg-white"
                  )}>
                    <input 
                      type="text" 
                      placeholder={appliedCoupon ? "OFFER APPLIED" : "Code here..."}
                      className="flex-1 bg-transparent border-none focus:ring-0 pl-4 text-sm font-black uppercase placeholder:text-stone-300 placeholder:font-bold"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      disabled={!!appliedCoupon}
                    />
                    {appliedCoupon ? (
                      <button 
                        onClick={removeCoupon}
                        className="bg-emerald-500 text-white p-2 rounded-xl hover:bg-red-500 transition-colors"
                      >
                        <X size={16} />
                      </button>
                    ) : (
                      <button 
                        onClick={handleApplyCoupon}
                        disabled={isValidating || !couponCode}
                        className="bg-stone-900 text-white px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-stone-800 disabled:opacity-30 transition-all flex items-center"
                      >
                        {isValidating ? <RefreshCw size={14} className="animate-spin" /> : 'Apply'}
                      </button>
                    )}
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t border-stone-50">
                  <div className="flex justify-between text-stone-500 text-sm font-bold">
                    <span>Subtotal</span>
                    <span className="text-stone-900">₹{subtotal + totalBulkDiscount}</span>
                  </div>
                  
                  {totalBulkDiscount > 0 && (
                    <motion.div 
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="flex justify-between text-emerald-600 text-[11px] font-black uppercase tracking-widest"
                    >
                      <span className="flex items-center"><Tag size={12} className="mr-2" /> Bulk Benefits</span>
                      <span>-₹{totalBulkDiscount}</span>
                    </motion.div>
                  )}
                  
                  {appliedCoupon && (
                    <motion.div 
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="flex justify-between text-primary text-[11px] font-black uppercase tracking-widest"
                    >
                      <span className="flex items-center"><Tag size={12} className="mr-2" /> {appliedCoupon.code}</span>
                      <span>-₹{couponDiscount}</span>
                    </motion.div>
                  )}
                  
                  <div className="flex justify-between text-stone-500 text-sm font-bold">
                    <span>Delivery</span>
                    <span className="text-emerald-500 font-black text-xs uppercase">Free</span>
                  </div>
                  
                  <div className="pt-6 mt-2 border-t-4 border-stone-900 flex justify-between items-center group">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black text-stone-400 uppercase tracking-[0.2em]">Total Payable</span>
                      <span className="text-xs font-bold text-stone-500">Tax Incl.</span>
                    </div>
                    <span className="font-black text-4xl text-stone-900 tracking-tighter italic">₹{total}</span>
                  </div>
                </div>
                
                <Link 
                  to="/checkout" 
                  className="w-full bg-stone-900 text-white py-6 rounded-[2rem] flex items-center justify-center space-x-3 text-lg font-black uppercase tracking-widest hover:bg-stone-800 transition-all hover:shadow-2xl hover:shadow-stone-900/30 active:scale-[0.98] group/btn"
                >
                  <span>Checkout</span>
                  <ArrowRight size={20} className="group-hover/btn:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>

            <div className="bg-stone-900 text-white p-8 rounded-[2.5rem] relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 group-hover:scale-125 transition-transform duration-1000" />
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-white">
                  <Truck size={24} />
                </div>
                <div>
                  <h4 className="font-black text-sm uppercase tracking-widest text-white">Delivery Estimate</h4>
                  <p className="text-stone-400 text-xs">{user?.pin_code || 'Standard'}</p>
                </div>
              </div>
              <p className="text-xl font-bold italic text-white">{getDeliveryEstimate()}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
