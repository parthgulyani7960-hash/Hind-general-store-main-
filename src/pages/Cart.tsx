import { motion, AnimatePresence } from 'motion/react';
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight, Truck, MapPin, Tag, X, RefreshCw, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useStore } from '../StoreContext';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { calculateBulkDiscount, cn } from '../lib/utils';

export default function Cart() {
  const { cart, updateQuantity, removeFromCart, user, appliedCoupon, setAppliedCoupon, bulkDiscounts } = useStore();
  const [couponCode, setCouponCode] = useState(appliedCoupon?.code || '');
  const [isValidating, setIsValidating] = useState(false);

  const cartWithDiscounts = cart.map(item => {
    // The 'price' field in the cart item is already adjusted for the user role in StoreContext
    const basePrice = item.price;
    const bulkDiscountAmount = calculateBulkDiscount(item, item.quantity, bulkDiscounts);
    return {
      ...item,
      basePrice,
      bulkDiscountAmount,
      finalPrice: basePrice - bulkDiscountAmount
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
        <h1 className="text-3xl font-bold">Your cart is empty</h1>
        <p className="text-stone-500">Looks like you haven't added anything to your cart yet.</p>
        <Link to="/products" className="btn-primary inline-block">
          Start Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-3xl font-bold mb-8">Shopping Cart</h1>

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
                  <h3 className="font-bold text-lg text-stone-900 line-clamp-1">{item.name}</h3>
                  {item.selectedVariant ? (
                    <div className="flex flex-col">
                      <div className="flex items-center space-x-2">
                        <p className="text-primary text-sm font-bold">{item.selectedVariant.name}</p>
                        <p className={cn("text-sm", item.bulkDiscountAmount > 0 ? "text-stone-400 line-through" : "text-stone-500")}>₹{item.price}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col">
                      <p className={cn("text-sm", item.bulkDiscountAmount > 0 ? "text-stone-400 line-through" : "text-stone-500")}>₹{item.price} per unit</p>
                      {user?.role === 'wholesaler' && (
                        <span className="text-[10px] font-black text-emerald-600 uppercase tracking-tighter">Wholesale Price</span>
                      )}
                      {user?.role === 'retailer' && (
                        <span className="text-[10px] font-black text-blue-600 uppercase tracking-tighter">Retailer Price</span>
                      )}
                    </div>
                  )}
                  {item.bulkDiscountAmount > 0 && (
                    <p className="text-emerald-600 text-xs font-bold mt-0.5">Bulk Discount Applied: ₹{item.finalPrice} per unit</p>
                  )}
                  <div className="flex items-center space-x-4 mt-3">
                    <div className="flex items-center space-x-2 bg-stone-50 rounded-xl p-1.5 border border-stone-200/60 shadow-inner">
                      <motion.button 
                        whileTap={{ scale: 0.8 }}
                        onClick={() => updateQuantity(item.id, -1, item.selectedVariant?.id)} 
                        className="p-1.5 hover:bg-white hover:text-primary rounded-lg transition-colors shadow-sm"
                      >
                        <Minus size={14} strokeWidth={3} />
                      </motion.button>
                      <motion.span 
                        key={item.quantity}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="font-bold text-sm w-6 text-center text-stone-800"
                      >
                        {item.quantity}
                      </motion.span>
                      <motion.button 
                        whileTap={{ scale: 0.8 }}
                        onClick={() => updateQuantity(item.id, 1, item.selectedVariant?.id)} 
                        className="p-1.5 bg-white text-stone-700 hover:text-primary rounded-lg transition-colors shadow-sm"
                      >
                        <Plus size={14} strokeWidth={3} />
                      </motion.button>
                    </div>
                    <motion.button 
                      whileTap={{ scale: 0.8 }}
                      onClick={() => removeFromCart(item.id, item.selectedVariant?.id)}
                      className="text-red-400 hover:text-red-600 hover:bg-red-50 p-2.5 rounded-xl transition-colors"
                    >
                      <Trash2 size={18} />
                    </motion.button>
                  </div>
                </div>
                <div className="text-right flex flex-col items-end pb-2">
                  <p className="font-black text-xl text-stone-900 tracking-tight">₹{item.finalPrice * item.quantity}</p>
                  {item.bulkDiscountAmount > 0 && (
                    <motion.div 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="mt-1 bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded text-[10px] items-center font-bold inline-flex"
                    >
                      Saved ₹{item.bulkDiscountAmount * item.quantity}
                    </motion.div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-100 space-y-4">
            <h3 className="text-xl font-bold">Order Summary</h3>
            
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

            <div className="space-y-2 pt-2 border-t border-stone-100">
              <div className="flex justify-between text-stone-500">
                <span>Items Subtotal</span>
                <span>₹{subtotal + totalBulkDiscount}</span>
              </div>
              {totalBulkDiscount > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Bulk Savings</span>
                  <span>-₹{totalBulkDiscount}</span>
                </div>
              )}
              {appliedCoupon && (
                <div className="flex justify-between text-emerald-600">
                  <span>Coupon Discount</span>
                  <span>-₹{couponDiscount}</span>
                </div>
              )}
              <div className="flex justify-between text-stone-500">
                <span>Delivery Fee</span>
                <span className="text-emerald-600 font-medium">FREE</span>
              </div>
              <div className="pt-4 border-t border-stone-100 flex justify-between font-bold text-lg">
                <span>Total</span>
                <span>₹{total}</span>
              </div>
            </div>
            <Link to="/checkout" className="w-full btn-primary py-4 flex items-center justify-center space-x-2">
              <span>Proceed to Checkout</span>
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
