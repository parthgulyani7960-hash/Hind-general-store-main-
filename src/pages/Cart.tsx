import { motion, AnimatePresence } from 'motion/react';
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight, Truck, MapPin, Tag, X, RefreshCw, CheckCircle2 } from 'lucide-react';
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
      <div className="max-w-7xl mx-auto px-4 py-20 text-center space-y-6">
        <div className="w-24 h-24 bg-stone-100 rounded-full flex items-center justify-center mx-auto">
          <ShoppingBag size={48} className="text-stone-300" />
        </div>
        <h1 className="text-3xl font-bold">{t('empty_cart') || 'Your cart is empty'}</h1>
        <p className="text-stone-500">{t('empty_cart_msg') || "Looks like you haven't added anything to your cart yet."}</p>
        <Link to="/products" className="btn-primary inline-block">
          {t('start_shopping') || 'Start Shopping'}
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-3xl font-bold mb-8">{t('shopping_cart') || 'Shopping Cart'}</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-4">
          <AnimatePresence mode="popLayout">
            {cartWithDiscounts.map((item) => (
              <motion.div 
                key={`${item.id}-${item.selectedVariant?.id || 'base'}`}
                layout
                initial={{ opacity: 0, x: -20, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9, filter: "blur(4px)" }}
                transition={{ duration: 0.2 }}
                className="bg-white p-4 rounded-2xl shadow-sm border border-stone-100 flex items-center space-x-4"
              >
                <img 
                  src={item.image_url} 
                  className="w-24 h-24 object-cover rounded-xl shadow-sm" 
                  alt={item.name} 
                  loading="lazy"
                  referrerPolicy="no-referrer"
                />
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-lg text-stone-900 line-clamp-1">{item.name}</h3>
                      {item.selectedVariant && (
                        <p className="text-primary text-xs font-black uppercase tracking-widest mt-0.5">{item.selectedVariant.name}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="flex flex-col items-end">
                        <div className="flex items-baseline space-x-2">
                          {item.bulkDiscountAmount > 0 && (
                            <span className="text-stone-400 text-xs line-through font-medium">₹{item.basePrice * item.quantity}</span>
                          )}
                          <span className="font-black text-xl text-stone-900 tracking-tight">₹{item.finalPrice * item.quantity}</span>
                        </div>
                        {item.bulkDiscountAmount > 0 && (
                          <span className="text-[10px] font-black text-emerald-600 uppercase tracking-tighter">
                            Saved ₹{item.bulkDiscountAmount * item.quantity}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <div className={cn(
                      "px-2 py-1 rounded-lg text-[10px] font-bold",
                      item.bulkDiscountAmount > 0 ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : "bg-stone-50 text-stone-500"
                    )}>
                      ₹{item.finalPrice} / {item.selectedVariant ? item.selectedVariant.name : (item.unit || 'unit')}
                    </div>
                    
                    {user?.role === 'wholesaler' && !item.selectedVariant && (
                      <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded-lg text-[10px] font-bold border border-blue-100">Wholesale Rate</span>
                    )}
                  </div>

                  {item.nextTier && (
                    <div className="mt-3 p-2 bg-amber-50/50 rounded-xl border border-amber-100/50 flex items-center justify-between group">
                      <p className="text-[10px] font-bold text-amber-700 flex items-center">
                        <Tag size={10} className="mr-1" />
                        Buy {item.nextTier.min_qty - item.quantity} more to save ₹{item.nextTier.discount_type === 'percentage' ? `${item.nextTier.discount_value}%` : `₹${item.nextTier.discount_value}`} extra per unit
                      </p>
                      <Plus size={10} className="text-amber-400 group-hover:text-amber-600 transition-colors" />
                    </div>
                  )}

                  <div className="flex items-center space-x-6 mt-4">
                    <div className="flex items-center space-x-1 bg-stone-100/50 rounded-xl p-1 border border-stone-200/40">
                      <motion.button 
                        whileTap={{ scale: 0.9 }}
                        onClick={() => updateQuantity(item.id, -1, item.selectedVariant?.id)} 
                        className="p-1.5 hover:bg-white hover:text-primary rounded-lg transition-all shadow-sm"
                      >
                        <Minus size={14} strokeWidth={3} />
                      </motion.button>
                      <span className="font-black text-sm w-8 text-center text-stone-800">
                        {item.quantity}
                      </span>
                      <motion.button 
                        whileTap={{ scale: 0.9 }}
                        onClick={() => updateQuantity(item.id, 1, item.selectedVariant?.id)} 
                        className="p-1.5 bg-white text-stone-700 hover:text-primary rounded-lg transition-all shadow-sm"
                      >
                        <Plus size={14} strokeWidth={3} />
                      </motion.button>
                    </div>
                    
                    <button 
                      onClick={() => removeFromCart(item.id, item.selectedVariant?.id)}
                      className="text-stone-300 hover:text-red-500 transition-colors flex items-center space-x-1.5"
                    >
                      <Trash2 size={14} />
                      <span className="text-[10px] font-black uppercase tracking-widest">Remove</span>
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-100 space-y-4">
            <h3 className="text-xl font-bold">{t('order_summary') || 'Order Summary'}</h3>
            
            {/* Coupon Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-stone-400 uppercase tracking-wider">Promo Code</label>
                {appliedCoupon && (
                  <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center space-x-2"
                  >
                    <span className="bg-emerald-100 text-emerald-700 text-[10px] px-2 py-0.5 rounded-full font-black">
                      {appliedCoupon.code}
                    </span>
                    <span className="text-[10px] font-bold text-emerald-600">Applied!</span>
                  </motion.div>
                )}
              </div>
              
              <div className="relative group">
                <div className={cn(
                  "flex items-center space-x-2 p-1 rounded-xl border-2 transition-all",
                  appliedCoupon ? "border-emerald-200 bg-emerald-50/30" : "border-stone-100 bg-stone-50 focus-within:border-primary focus-within:bg-white"
                )}>
                  <div className="flex-1 relative flex items-center">
                    <div className={cn(
                      "absolute left-3 transition-colors flex items-center justify-center w-6 h-6 rounded-lg",
                      appliedCoupon ? "bg-emerald-500 text-white" : "bg-stone-200 text-stone-400"
                    )}>
                      <Tag size={14} />
                    </div>
                    <input 
                      type="text" 
                      placeholder={appliedCoupon ? "Coupon Applied" : "Enter code"}
                      className={cn(
                        "w-full bg-transparent border-none focus:ring-0 pl-12 text-sm py-2 font-bold uppercase placeholder:text-stone-300",
                        appliedCoupon ? "text-emerald-700" : "text-stone-700"
                      )}
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      disabled={!!appliedCoupon}
                    />
                  </div>
                  
                  {appliedCoupon ? (
                    <button 
                      onClick={removeCoupon}
                      className="p-2 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all mr-1"
                      title="Remove Coupon"
                    >
                      <X size={16} />
                    </button>
                  ) : (
                    <button 
                      onClick={handleApplyCoupon}
                      disabled={isValidating || !couponCode}
                      className="bg-stone-900 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-stone-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all mr-1"
                    >
                      {isValidating ? <RefreshCw size={14} className="animate-spin" /> : 'Apply'}
                    </button>
                  )}
                </div>
              </div>

              {appliedCoupon && (
                <motion.div 
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center space-x-2 text-[10px] text-emerald-600 font-bold bg-emerald-50 p-2 rounded-lg border border-emerald-100"
                >
                  <CheckCircle2 size={12} />
                  <span>Coupon "{appliedCoupon.code}" applied! You saved ₹{couponDiscount}.</span>
                </motion.div>
              )}
            </div>

            <div className="space-y-4 pt-4 border-t border-stone-100">
              <div className="flex justify-between text-stone-500 text-sm">
                <span className="flex items-center"><ShoppingBag size={14} className="mr-2" /> Items Subtotal</span>
                <span className="font-bold text-stone-900">₹{subtotal + totalBulkDiscount}</span>
              </div>
              
              {totalBulkDiscount > 0 && (
                <motion.div 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex justify-between text-emerald-600 text-sm bg-emerald-50/50 p-2 rounded-xl border border-emerald-100/50"
                >
                  <span className="flex items-center font-bold italic"><CheckCircle2 size={14} className="mr-2" /> Bulk Savings</span>
                  <span className="font-black">-₹{totalBulkDiscount}</span>
                </motion.div>
              )}
              
              {appliedCoupon && (
                <motion.div 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex justify-between text-blue-600 text-sm bg-blue-50/50 p-2 rounded-xl border border-blue-100/50"
                >
                  <span className="flex items-center font-bold italic"><Tag size={14} className="mr-2" /> Coupon ({appliedCoupon.code})</span>
                  <span className="font-black">-₹{couponDiscount}</span>
                </motion.div>
              )}
              
              <div className="flex justify-between text-stone-500 text-sm">
                <span className="flex items-center"><Truck size={14} className="mr-2" /> Delivery Fee</span>
                <span className="text-emerald-600 font-black uppercase tracking-widest text-[10px]">Free Delivery</span>
              </div>
              
              <div className="pt-4 border-t-2 border-stone-100 flex justify-between items-center group">
                <span className="font-black text-xs uppercase tracking-[0.2em] text-stone-400 group-hover:text-stone-600 transition-colors">Total Payable</span>
                <span className="font-black text-3xl text-stone-900 tracking-tighter">₹{total}</span>
              </div>
            </div>
            <Link to="/checkout" className="w-full btn-primary py-4 flex items-center justify-center space-x-2">
              <span>{t('proceed_to_checkout') || 'Proceed to Checkout'}</span>
              <ArrowRight size={18} />
            </Link>
          </div>

          <div className="bg-primary/5 p-6 rounded-2xl border border-primary/10 space-y-3">
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
            <p className="text-[10px] text-stone-400">Standard delivery times apply. Local orders are prioritized.</p>
          </div>
          
          <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100 flex items-start space-x-3">
            <div className="bg-emerald-100 p-2 rounded-lg text-emerald-600">
              <ShoppingBag size={20} />
            </div>
            <div>
              <p className="text-sm font-bold text-emerald-800">Free Delivery</p>
              <p className="text-xs text-emerald-600">You're eligible for free delivery on this order!</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
