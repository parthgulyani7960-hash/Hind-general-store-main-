import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShoppingBag, MapPin, CreditCard, CheckCircle2, 
  ArrowRight, ArrowLeft, Truck, ShieldCheck, 
  Wallet, Camera, X, AlertCircle, Download, Clock, Book,
  Plus, Minus, RefreshCcw, Loader2, Copy, Info
} from 'lucide-react';
import { useStore } from '../StoreContext';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { cn, calculateBulkDiscount } from '../lib/utils';
import { handleAppError } from '../lib/errorUtils';
import { QRCodeCanvas } from 'qrcode.react';
import InfoButton from '../components/InfoButton';
import { fetchWithHandling } from '../lib/api';
import { getAuthHeaders } from '../lib/utils';
import { autofillLocation } from '../lib/geocoding';

type Step = 'address' | 'payment_method' | 'review' | 'awaiting_payment' | 'confirmation';

const GOOGLE_MAPS_KEY = process.env.GOOGLE_MAPS_PLATFORM_KEY || '';

export default function Checkout() {
  const { 
    cart, user, appliedCoupon, clearCart, 
    fetchUser, bulkDiscounts, fetchBulkDiscounts, config = [], promotions, fetchPromotions,
    addresses, fetchAddresses,
    updateQuantity, removeFromCart,
    isProfileComplete,
    t
  } = useStore();
  const navigate = useNavigate();

  // Full Screen Mode state
  const [fullscreen, setFullscreen] = useState(true);

  useEffect(() => {
    fetchBulkDiscounts();
    fetchPromotions();
    // Hide chat or other distractions if they exist in a global way? 
    // Usually we don't have that, but we can make the layout immersive.
  }, [fetchBulkDiscounts, fetchPromotions]);

  useEffect(() => {
    if (!isProfileComplete()) {
      toast.error('Please complete your profile to place an order.');
      navigate('/complete-profile');
    }
  }, [isProfileComplete, navigate]);

  const [step, setStep] = useState<Step>('address');
  const [isProcessing, setIsProcessing] = useState(false);
  const qrRef = useRef<HTMLDivElement>(null);
  
  // Pending Order Details (after creation)
  const [pendingOrder, setPendingOrder] = useState<any>(null);
  const [manualPaymentInfo, setManualPaymentInfo] = useState({ utr: '', screenshot: '' });
  const [isSubmittingProof, setIsSubmittingProof] = useState(false);

  // Calculation logic

  const submitPaymentProof = async () => {
    if (!manualPaymentInfo.utr && !manualPaymentInfo.screenshot) {
      toast.error('Please provide either UTR number or a payment screenshot URL.');
      return;
    }
    setIsSubmittingProof(true);
    try {
      const data = await fetchWithHandling<any>(`/api/orders/${pendingOrder.id}/payment-proof`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(manualPaymentInfo)
      });
      if (data) {
        toast.success('Payment proof submitted! Admin will verify soon.');
        setStep('confirmation');
      }
    } catch (err: any) {
      handleAppError(err, 'Failed to submit proof', 'submitProof', user?.role === 'admin');
    } finally {
      setIsSubmittingProof(false);
    }
  };

  const downloadQR = () => {
    const canvas = qrRef.current?.querySelector('canvas');
    if (canvas) {
      const url = canvas.toDataURL("image/png");
      const link = document.createElement('a');
      link.download = `General_Store_Karyana_Shop_Order_${pendingOrder.order_id}.png`;
      link.href = url;
      link.click();
      toast.success('QR Code saved to gallery!');
    }
  };

  const upiId = (config || []).find(c => c.key === 'upi_id')?.value || 'hindstore@upi';
  const upiName = (config || []).find(c => c.key === 'upi_name')?.value || 'General Store Karyana Shop';
  const isUpiEnabled = (config || []).find(c => c.key === 'upi_enabled')?.value !== 'false';
  const khataEnabled = (config || []).find(c => c.key === 'khata_enabled')?.value === 'true';
  const upiMode = (config || []).find(c => c.key === 'upi_verification_mode')?.value || 'manual';
  
  // Address State
  const [useCustomAddress, setUseCustomAddress] = useState(false);
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);

  // Payment State
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'cod' | 'wallet' | 'upi' | 'khata' | null>(null);

  const [isCurrentLocationMode, setIsCurrentLocationMode] = useState(false);
  const [addressData, setAddressData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    address: user?.address || '',
    city: user?.city || '',
    state: user?.state || '',
    zip_code: user?.zip_code || '',
    pin_code: user?.pin_code || '',
    delivery_area: ''
  });

  useEffect(() => {
    if (addresses && addresses.length > 0) {
      const defaultAddr = addresses.find(a => a.is_default) || addresses[0];
      if (!useCustomAddress && !selectedAddressId) {
        setSelectedAddressId(defaultAddr.id);
        setAddressData({
          name: defaultAddr.name,
          phone: defaultAddr.phone,
          address: defaultAddr.address,
          city: defaultAddr.city,
          state: defaultAddr.state,
          zip_code: defaultAddr.zip_code,
          pin_code: defaultAddr.pin_code,
          delivery_area: defaultAddr.delivery_area
        });
      }
    } else {
      setUseCustomAddress(true);
    }
  }, [addresses]);
  
  const [deliveryAreas, setDeliveryAreas] = useState<any[]>([]);
  
  const isLoggedIn = !!user;

  useEffect(() => {
    fetchWithHandling<any[]>('/api/delivery-areas')
      .then(data => {
        if (data) setDeliveryAreas(data);
      });
  }, []);

  const [deliveryMethod, setDeliveryMethod] = useState<'delivery' | 'pickup'>('delivery');
  const [addressConfirmed, setAddressConfirmed] = useState(false);
  const [termsConfirmed, setTermsConfirmed] = useState(false);

  const validateAddress = () => {
    if (deliveryMethod === 'pickup') return true; // No address needed for pickup primarily
    if (isCurrentLocationMode) return addressData.name && addressData.phone && addressConfirmed;
    return addressData.name && addressData.phone && addressData.address && addressData.city && addressData.pin_code && addressData.delivery_area && addressConfirmed;
  };

  const selectedArea = deliveryAreas.find(a => a.name === addressData.delivery_area);

    const handleNextStep = async () => {
    if (!validateAddress()) {
      toast.error('Please fill all address fields, select a delivery zone, and confirm accuracy.');
      return;
    }
    
    if (selectedArea && subtotal < selectedArea.min_order) {
        toast.error(`Minimum order amount for ${selectedArea.name} is ₹${selectedArea.min_order}. Add more items to your cart.`);
        return;
    }
    
    setStep('payment_method');
  };

  // Calculation logic
  const cartWithDiscounts = cart.map(item => {
    const basePrice = item.price;
    const bulkDiscountAmount = calculateBulkDiscount(item, item.quantity, bulkDiscounts);
    
    // Apply promotions
    let promoDiscountAmount = 0;
    const itemDiscounts: number[] = [];

    promotions.forEach(promo => {
      if (!promo.active) return;
      
      const isEligible = 
        promo.target_type === 'all' || 
        (promo.target_type === 'category' && item.category === promo.target_id) || 
        (promo.target_type === 'product' && String(item.id) === String(promo.target_id)) ||
        // fallback for older properties if still somehow set 
        (promo.category && item.category === promo.category) ||
        (promo.product_id && item.id === promo.product_id);

      if (isEligible) {
        if (promo.type === 'percentage') {
          const validPercentage = Math.max(0, Math.min(100, promo.value));
          itemDiscounts.push((basePrice * validPercentage) / 100);
        } else if (promo.type === 'bogo') {
          const minQ = promo.min_qty || 2;
          if (item.quantity >= minQ) {
            const freeItems = Math.floor(item.quantity / minQ) * (promo.value || 1);
            const bogoDiscount = Math.min((basePrice * item.quantity), (basePrice * freeItems));
            itemDiscounts.push(bogoDiscount / item.quantity);
          }
        } else if (promo.type === 'fixed') {
          if (!promo.min_qty || item.quantity >= promo.min_qty) {
            itemDiscounts.push(promo.value / item.quantity);
          }
        }
      }
    });

    // Sum discounts and cap total item discount at basePrice per item
    promoDiscountAmount = itemDiscounts.reduce((sum, d) => sum + d, 0);
    promoDiscountAmount = Math.min(promoDiscountAmount, basePrice);

    return {
      ...item,
      basePrice,
      bulkDiscountAmount,
      promoDiscountAmount,
      finalPrice: Math.max(0, basePrice - bulkDiscountAmount - promoDiscountAmount)
    };
  });

  const subtotal = cartWithDiscounts.reduce((acc, item) => {
    return acc + item.finalPrice * item.quantity;
  }, 0);

  const totalBulkDiscount = cartWithDiscounts.reduce((acc, item) => {
    return acc + item.bulkDiscountAmount * item.quantity;
  }, 0);

  const totalPromoDiscount = cartWithDiscounts.reduce((acc, item) => {
    return acc + item.promoDiscountAmount * item.quantity;
  }, 0);
  
  const couponDiscount = appliedCoupon 
    ? (appliedCoupon.type === 'percentage' 
        ? (subtotal * appliedCoupon.value) / 100 
        : appliedCoupon.value)
    : 0;

  const deliveryFee = deliveryMethod === 'pickup' ? 0 : (selectedArea ? selectedArea.fee : (subtotal > 500 ? 0 : 40));
  const total = subtotal - couponDiscount + deliveryFee;

  useEffect(() => {
    if (cart.length === 0 && !['confirmation', 'awaiting_payment'].includes(step)) {
      navigate('/cart');
    }
  }, [cart, navigate, step]);

  const placeOrder = async (method: 'cod' | 'wallet' | 'upi' | 'khata') => {
    if (!isLoggedIn && method !== 'cod') {
      toast.error('Please login to use this payment method');
      navigate('/login');
      return;
    }

    if (cart.length === 0) {
      toast.error('Your cart is empty');
      navigate('/cart');
      return;
    }

    if (!termsConfirmed) {
      toast.error('Please agree to the Terms & Conditions');
      return;
    }

    if (method === 'wallet' && user.wallet_balance < total) {
      toast.error('Insufficient wallet balance. Redirecting to add money...', { icon: '💰' });
      setTimeout(() => {
        navigate('/profile?tab=wallet&action=add-money');
      }, 1000);
      return;
    }

    setIsProcessing(true);
    try {
      const data = await fetchWithHandling<any>('/api/orders', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          user_id: user?.id || null,
          items: cartWithDiscounts.map(item => ({
            id: item.id,
            quantity: item.quantity,
            variant_id: item.selectedVariant?.id,
            price: item.finalPrice
          })),
          total,
          subtotal: subtotal + totalBulkDiscount + totalPromoDiscount,
          discount: couponDiscount + totalBulkDiscount + totalPromoDiscount,
          bulk_discount: totalBulkDiscount,
          promo_discount: totalPromoDiscount,
          coupon_discount: couponDiscount,
          delivery_fee: deliveryFee,
          delivery_type: deliveryMethod,
          payment_method: method,
          address: deliveryMethod === 'pickup' ? JSON.stringify({ name: user?.name, phone: user?.phone, address: 'STORE_PICKUP_SELECTED' }) : JSON.stringify(addressData), 
          coupon_code: appliedCoupon?.code
        })
      });

      if (data) {
        setPendingOrder(data.order);

        if (method === 'upi') {
          setStep('awaiting_payment');
        } else {
          toast.success('Order placed successfully!');
          clearCart();
          fetchUser(); 
          setStep('confirmation');
        }
      }

    } catch (err: any) {
      handleAppError(err, 'Failed to place order', 'placeOrder', user?.role === 'admin');
    } finally {
      setIsProcessing(false);
    }
  };

  // Poll for payment status if step is awaiting_payment
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (step === 'awaiting_payment' && pendingOrder) {
      interval = setInterval(async () => {
        try {
          const data = await fetchWithHandling<any>(`/api/orders/${pendingOrder.id}`, { headers: getAuthHeaders() });
          if (data && (data.status === 'paid' || data.status === 'PAID' || data.payment_status === 'paid')) {
            toast.success('Payment received successfully! ✅');
            clearCart();
            fetchUser();
            setStep('confirmation');
          } else if (data && (data.status === 'FAILED' || data.status === 'EXPIRED')) {
            toast.error('Payment verification failed or expired.');
            setStep('payment_method');
          }
        } catch (err) {
          // Silent fail for polling errors to avoid toast spam
        }
      }, 10000);
    }
    return () => clearInterval(interval);
  }, [step, pendingOrder]);

  const [checkoutMode, setCheckoutMode] = useState(true);

  if (!cart.length && step !== 'confirmation') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-stone-50">
        <div className="w-24 h-24 bg-stone-100 rounded-full flex items-center justify-center mb-6">
          <ShoppingBag className="text-stone-300" size={40} />
        </div>
        <h2 className="text-2xl font-black text-stone-900 mb-2">Cart is Empty</h2>
        <p className="text-stone-500 mb-8">You need items in your cart to checkout.</p>
        <button 
          onClick={() => navigate('/cart')}
          className="btn-primary px-8 py-3"
        >
          Return to Cart
        </button>
      </div>
    );
  }

  return (
    <div className={cn(
      "min-h-screen bg-stone-50 transition-all duration-700",
      checkoutMode ? "py-0 sm:py-8" : "py-12"
    )}>
      {/* Full Screen Immersive Wrapper */}
      <div className={cn(
        "max-w-6xl mx-auto transition-all duration-700",
        checkoutMode ? "bg-white sm:rounded-[3rem] sm:shadow-[0_40px_100px_-20px_rgba(0,0,0,0.15)] sm:border sm:border-stone-100 min-h-screen sm:min-h-0 overflow-hidden" : ""
      )}>
        
        {/* Header - Minimalist */}
        <div className="p-6 sm:p-8 flex items-center justify-between border-b border-stone-50">
          <div className="flex items-center gap-4">
             <button 
               onClick={() => step === 'address' ? navigate('/cart') : setStep(step === 'payment_method' ? 'address' : (step === 'review' ? 'payment_method' : 'address'))}
               className="p-2 hover:bg-stone-50 rounded-full transition-colors"
             >
               <ArrowLeft size={20} />
             </button>
             <div>
               <h1 className="text-xl sm:text-2xl font-black font-serif tracking-tight">Secured Checkout</h1>
               <p className="text-[9px] font-black text-stone-400 uppercase tracking-widest">{cart.length} Items • Standard Shipping</p>
             </div>
          </div>
          <div className="hidden sm:flex items-center gap-3">
             <div className="text-right">
                <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest leading-none mb-1">Total Payable</p>
                <p className="text-xl font-black text-stone-900">₹{total.toFixed(2)}</p>
             </div>
             <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                <ShieldCheck size={20} />
             </div>
          </div>
        </div>

        {/* Improved Step Progress */}
        <div className="px-6 sm:px-12 py-6 bg-stone-50/50 border-b border-stone-100 flex justify-between overflow-x-auto gap-4 no-scrollbar">
           {[
             { id: 'address', label: 'Shipping', icon: MapPin },
             { id: 'payment_method', label: 'Payment', icon: CreditCard },
             { id: 'review', label: 'Review', icon: ShieldCheck },
             { id: 'confirmation', label: 'Complete', icon: CheckCircle2 },
           ].map((s, i) => {
             const isActive = step === s.id || (s.id === 'payment_method' && step === 'awaiting_payment');
             const isPast = ['address', 'payment_method', 'review', 'confirmation'].indexOf(step) > i;
             
             return (
               <div key={s.id} className="flex items-center gap-3 shrink-0">
                  <div className={cn(
                    "w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-500",
                    isActive ? "bg-primary text-white shadow-lg shadow-primary/20 scale-110" : (isPast ? "bg-emerald-500 text-white" : "bg-white border border-stone-100 text-stone-300")
                  )}>
                    {isPast ? <CheckCircle2 size={18} /> : <s.icon size={18} />}
                  </div>
                  <div className="hidden md:block">
                     <p className={cn("text-[9px] font-black uppercase tracking-widest leading-none mb-1", isActive ? "text-primary" : "text-stone-300")}>Step {i+1}</p>
                     <p className={cn("text-xs font-black", isActive ? "text-stone-900" : "text-stone-400")}>{s.label}</p>
                  </div>
                  {i < 3 && <div className="h-px w-8 sm:w-12 bg-stone-200 ml-2" />}
               </div>
             );
           })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 overflow-hidden">
          {/* Main Form Content */}
          <div className="lg:col-span-8 p-6 sm:p-12 border-r border-stone-100">
            <AnimatePresence mode="wait" initial={false}>
              {step === 'address' && (
                <motion.div 
                  key="address"
                  initial={{ opacity: 0, x: -25, scale: 0.98 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: 25, scale: 0.98, filter: "blur(4px)" }}
                  transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                  className="bg-white p-5 md:p-8 rounded-2xl md:rounded-3xl shadow-sm border border-stone-100 space-y-6"
                >
                  <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                       Fulfillment Method
                       <InfoButton title="Fulfillment" message="Choose between doorstep delivery or self-pickup from our physical store." />
                    </h2>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <button 
                      onClick={() => setDeliveryMethod('delivery')}
                      className={cn(
                        "p-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all",
                        deliveryMethod === 'delivery' ? "border-primary bg-primary/5 text-primary" : "border-stone-100 hover:border-stone-200 text-stone-400"
                      )}
                    >
                      <Truck size={24} />
                      <span className="text-xs font-black uppercase tracking-widest">Home Delivery</span>
                    </button>
                    <button 
                      onClick={() => setDeliveryMethod('pickup')}
                      className={cn(
                        "p-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all",
                        deliveryMethod === 'pickup' ? "border-primary bg-primary/5 text-primary" : "border-stone-100 hover:border-stone-200 text-stone-400"
                      )}
                    >
                      <ShoppingBag size={24} />
                      <span className="text-xs font-black uppercase tracking-widest">Store Pickup</span>
                    </button>
                  </div>

                  {deliveryMethod === 'pickup' ? (
                     <motion.div 
                       initial={{ opacity: 0, y: 10 }}
                       animate={{ opacity: 1, y: 0 }}
                       className="bg-emerald-50 border border-emerald-100 p-6 rounded-3xl space-y-3"
                     >
                        <h3 className="text-emerald-900 font-bold flex items-center gap-2 text-lg">
                           <CheckCircle2 size={20} />
                           Store Pickup Selected
                        </h3>
                        <p className="text-emerald-700 text-sm leading-relaxed">
                           You can pick up your order from our store once it's confirmed. 
                           <br />
                           <strong>Location:</strong> Near Main Market, Sector 12, Chandigarh.
                           <br />
                           <strong>Timing:</strong> 9:00 AM - 9:00 PM (Mon-Sat)
                        </p>
                        <div className="pt-2">
                           <span className="px-3 py-1.5 bg-white text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-100">Zero Delivery Fee</span>
                        </div>
                     </motion.div>
                  ) : (
                    <>
                      <div className="flex justify-between items-center">
                        <h2 className="text-2xl font-bold flex items-center gap-2">
                           Shipping Address
                           <InfoButton title="Shipping" message="Ensure your delivery address is accurate for timely delivery." />
                        </h2>
                      </div>

                      {!useCustomAddress && addresses.length > 0 ? (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                             <h3 className="text-sm font-bold text-stone-500 uppercase">Saved Addresses</h3>
                             <button 
                               onClick={() => setUseCustomAddress(true)}
                               className="text-xs font-bold text-primary flex items-center space-x-1 hover:bg-primary/5 px-3 py-1.5 rounded-full transition-colors"
                             >
                               <Plus size={14} />
                               <span>Add New Address</span>
                             </button>
                          </div>
                          <div className="grid grid-cols-1 gap-4">
                            {addresses.map((addr, idx) => (
                              <motion.button
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.1 }}
                                key={addr.id}
                                onClick={() => {
                                  setSelectedAddressId(addr.id);
                                  setAddressData({
                                    name: addr.name,
                                    phone: addr.phone,
                                    address: addr.address,
                                    city: addr.city,
                                    state: addr.state,
                                    zip_code: addr.zip_code,
                                    pin_code: addr.pin_code,
                                    delivery_area: addr.delivery_area
                                  });
                                }}
                                className={cn(
                                  "text-left p-6 rounded-2xl border-2 transition-all relative",
                                  selectedAddressId === addr.id ? "border-primary bg-primary/5 shadow-md shadow-primary/5" : "border-stone-100 hover:border-stone-200"
                                )}
                              >
                                <div className="flex justify-between items-start">
                                  <div className="space-y-1">
                                     <div className="flex items-center space-x-2">
                                        <p className="font-bold text-stone-800 text-lg">{addr.name}</p>
                                        {addr.is_default && <span className="text-[10px] bg-primary text-white px-2 py-0.5 rounded-full font-bold uppercase">Default</span>}
                                     </div>
                                     <p className="text-sm text-stone-600 font-medium">{addr.phone}</p>
                                     <p className="text-sm text-stone-500 max-w-[80%] leading-relaxed">{addr.address}, {addr.city}, {addr.state} - {addr.pin_code}</p>
                                     <p className="text-[10px] text-primary mt-2 font-bold uppercase tracking-wider bg-white border border-primary/20 px-3 py-1 rounded-full w-min whitespace-nowrap">Zone: {addr.delivery_area}</p>
                                  </div>
                                  {selectedAddressId === addr.id && (
                                    <motion.div 
                                      initial={{ scale: 0 }}
                                      animate={{ scale: 1 }}
                                      className="text-primary bg-primary/10 rounded-full p-1 shadow-sm"
                                    >
                                      <CheckCircle2 size={20} />
                                    </motion.div>
                                  )}
                                </div>
                              </motion.button>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-6">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="text-sm font-bold text-stone-500 uppercase">New Address</h3>
                            {addresses.length > 0 && (
                              <button 
                                onClick={() => { setUseCustomAddress(false); setSelectedAddressId(addresses[0]?.id || null); }}
                                className="text-xs font-bold text-stone-500 hover:text-stone-800 transition-colors"
                              >
                                Cancel
                              </button>
                            )}
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             {/* Address Mode Cards */}
                             <button 
                               onClick={async () => {
                                 setIsCurrentLocationMode(true);
                                 const data = await autofillLocation(GOOGLE_MAPS_KEY);
                                 if (data) {
                                   setAddressData(prev => ({
                                     ...prev,
                                     address: data.address,
                                     city: data.city,
                                     state: data.state,
                                     pin_code: data.pin_code
                                   }));
                                 }
                               }}
                               className="col-span-1 md:col-span-2 flex items-center justify-center space-x-3 p-5 rounded-2xl border-2 border-primary bg-primary/5 hover:bg-primary/10 transition-colors text-primary"
                             >
                                <MapPin size={24} />
                                <div className="text-left">
                                   <p className="font-bold text-lg">Deliver to Current Location</p>
                                   <p className="text-xs opacity-80">Automatically fetch and fill your precise live location</p>
                                </div>
                             </button>

                             <div className="col-span-1 md:col-span-2 flex items-center gap-4 py-2">
                                <div className="flex-1 h-px bg-stone-200"></div>
                                <p className="text-xs font-bold text-stone-400 uppercase tracking-widest">OR TYPE MANUALLY</p>
                                <div className="flex-1 h-px bg-stone-200"></div>
                             </div>

                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest pl-1">Full Name</label>
                              <input 
                                type="text" 
                                className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-2xl outline-none focus:border-primary transition-colors font-bold text-stone-700"
                                value={addressData.name}
                                onChange={(e) => setAddressData({...addressData, name: e.target.value})}
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest pl-1">Phone Number</label>
                              <input 
                                type="text" 
                                className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-2xl outline-none focus:border-primary transition-colors font-bold text-stone-700"
                                value={addressData.phone}
                                onChange={(e) => setAddressData({...addressData, phone: e.target.value})}
                              />
                            </div>
                            
                            {!isCurrentLocationMode && (
                              <>
                                <div className="space-y-1 col-span-2 md:col-span-1">
                                  <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest pl-1">Postcode</label>
                                  <div className="relative">
                                    <input 
                                      type="text" 
                                      disabled
                                      className="w-full px-4 py-3 pr-12 bg-stone-200 border border-stone-200 rounded-2xl outline-none font-bold text-stone-700"
                                      value={addressData.pin_code}
                                      placeholder="Auto-filled via location"
                                    />
                                    <button 
                                      type="button"
                                      onClick={async () => {
                                        const data = await autofillLocation(GOOGLE_MAPS_KEY);
                                        if (data) {
                                          setAddressData(prev => ({
                                            ...prev,
                                            pin_code: data.pin_code,
                                            city: data.city,
                                            state: data.state
                                          }));
                                        }
                                      }}
                                      className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-primary/20 text-primary rounded-xl hover:bg-primary transition-all hover:text-white"
                                      title="Fetch Pin Code via Location"
                                    >
                                      <MapPin size={16} />
                                    </button>
                                  </div>
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest pl-1">City (Auto-filled by Pin Code)</label>
                                  <input 
                                    type="text" 
                                    disabled
                                    className="w-full px-4 py-3 bg-stone-200 text-stone-500 border border-stone-200 rounded-2xl outline-none font-bold"
                                    value={addressData.city}
                                  />
                                </div>
                                <div className="md:col-span-2 space-y-1">
                                  <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest pl-1">Street Address</label>
                                  <textarea 
                                    className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-2xl outline-none focus:border-primary transition-colors font-bold text-stone-700 min-h-[80px]"
                                    value={addressData.address}
                                    onChange={(e) => setAddressData({...addressData, address: e.target.value})}
                                  />
                                </div>
                                <div className="col-span-2 space-y-1">
                                  <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest pl-1">Delivery Area</label>
                                  <select 
                                    className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-2xl outline-none focus:border-primary transition-colors font-bold text-stone-700"
                                    value={addressData.delivery_area}
                                    onChange={(e) => setAddressData({...addressData, delivery_area: e.target.value})}
                                  >
                                    <option value="">Select your delivery area...</option>
                                    {deliveryAreas.map(area => (
                                      <option key={area.id} value={area.name}>
                                         {area.name} (Min. Order ₹{area.min_order} | Fee ₹{area.fee})
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                  {deliveryMethod === 'delivery' && (
                  <div className="flex items-center space-x-2 pt-4 border-t border-stone-100">
                    <input 
                      type="checkbox" 
                      id="address-confirm" 
                      className="rounded text-primary" 
                      checked={addressConfirmed}
                      onChange={(e) => setAddressConfirmed(e.target.checked)}
                    />
                    <label htmlFor="address-confirm" className="text-sm font-bold text-stone-700">
                      Shipping address details are accurate.
                    </label>
                  </div>
                )}

                  <motion.button 
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleNextStep}
                    className="w-full btn-primary py-4 flex items-center justify-center space-x-2 shadow-lg shadow-primary/20"
                  >
                    <span>{deliveryMethod === 'pickup' ? 'Confirm Pickup & Pay' : 'Continue to Payment'}</span>
                    <ArrowRight size={18} />
                  </motion.button>
                </motion.div>
              )}

              {step === 'payment_method' && (
                <motion.div 
                  key="payment_method"
                  initial={{ opacity: 0, x: -25, scale: 0.98 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: 25, scale: 0.98, filter: "blur(4px)" }}
                  transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                  className="space-y-6"
                >
                  <div className="bg-white p-8 rounded-3xl shadow-sm border border-stone-100 space-y-6">
                    <h2 className="text-2xl font-bold">Select Payment Method</h2>
                    
                    <div className="grid grid-cols-1 gap-3">
                      {/* UPI QR - Recommended */}
                      {isUpiEnabled && (
                        <div className="relative group">
                          <motion.button 
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => { isLoggedIn && setSelectedPaymentMethod('upi'); isLoggedIn && setStep('review'); }}
                            disabled={isProcessing || !isLoggedIn}
                            className={cn(
                              "w-full p-5 rounded-2xl border-2 transition-all flex items-center justify-between",
                              !isLoggedIn ? "bg-stone-50 border-stone-100 cursor-not-allowed opacity-70" : "border-stone-100 hover:border-primary hover:bg-primary/5 shadow-sm"
                            )}
                          >
                            <div className="flex items-center space-x-4">
                              <div className={cn(
                                "p-3 rounded-xl transition-colors",
                                !isLoggedIn ? "bg-stone-200 text-stone-400" : "bg-stone-100 group-hover:bg-primary group-hover:text-white"
                              )}>
                                <CreditCard size={20} />
                              </div>
                              <div className="text-left">
                                <p className="font-bold text-stone-800">UPI Payment {upiMode === 'manual' ? '(Manual Proof)' : '(Auto Verification)'}</p>
                                <p className="text-[10px] text-stone-500 font-bold uppercase tracking-wider">
                                  {upiMode === 'manual' ? 'Pay & Submit screenshot/UTR' : 'Fast auto-verification via UPI Note'}
                                </p>
                              </div>
                            </div>
                            <ArrowRight size={16} className="text-stone-300 group-hover:text-primary transition-transform group-hover:translate-x-1" />
                          </motion.button>
                          {!isLoggedIn && (
                            <div className="mt-2 flex items-center justify-between px-2">
                              <p className="text-[10px] text-stone-500 font-medium italic">* Login required for UPI payments.</p>
                              <button 
                                onClick={() => navigate('/login')}
                                className="text-[10px] font-black text-primary uppercase tracking-wider hover:underline"
                              >
                                Login with Google
                              </button>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Khata Credit */}
                      {khataEnabled && (user?.khata_enabled || user?.khata_allowed) && (
                        <div className="relative group">
                          <motion.button 
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => { setSelectedPaymentMethod('khata'); setStep('review'); }}
                            disabled={isProcessing}
                            className={cn(
                              "w-full p-5 rounded-2xl border-2 transition-all flex items-center justify-between",
                              "border-stone-100 hover:border-emerald-500 hover:bg-emerald-50 shadow-sm"
                            )}
                          >
                            <div className="flex items-center space-x-4">
                              <div className="p-3 rounded-xl bg-emerald-100 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                                <Book size={20} />
                              </div>
                              <div className="text-left">
                                <p className="font-bold text-stone-800">Khata Credit</p>
                                <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">Buy Now, Pay Later</p>
                              </div>
                            </div>
                            <ArrowRight size={16} className="text-stone-300 group-hover:text-emerald-500 transition-transform group-hover:translate-x-1" />
                          </motion.button>
                        </div>
                      )}

                      {/* Store Wallet */}
                      <div className="relative group">
                        <motion.button 
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => { isLoggedIn && setSelectedPaymentMethod('wallet'); isLoggedIn && setStep('review'); }}
                          disabled={isProcessing || !isLoggedIn || (user?.wallet_balance || 0) < total}
                          className={cn(
                            "w-full p-5 rounded-2xl border-2 transition-all flex items-center justify-between",
                            !isLoggedIn ? "bg-stone-50 border-stone-100 cursor-not-allowed opacity-70" : "border-stone-100 hover:border-primary hover:bg-primary/5 shadow-sm",
                            isLoggedIn && (user?.wallet_balance || 0) < total && "opacity-50 cursor-not-allowed"
                          )}
                        >
                          <div className="flex items-center space-x-4">
                            <div className={cn(
                              "p-3 rounded-xl transition-colors",
                              !isLoggedIn ? "bg-stone-200 text-stone-400" : "bg-stone-100 group-hover:bg-primary group-hover:text-white"
                            )}>
                              <Wallet size={20} />
                            </div>
                            <div className="text-left">
                              <p className="font-bold text-stone-800">Store Wallet</p>
                              {isLoggedIn ? (
                                <div className="mt-1 flex items-center">
                                  <span className={cn(
                                    "px-2 py-0.5 rounded-full text-[9px] font-black uppercase border",
                                    (user?.wallet_balance || 0) < total ? "bg-red-50 text-red-600 border-red-100" : "bg-emerald-50 text-emerald-600 border-emerald-100"
                                  )}>
                                    Balance: ₹{user?.wallet_balance || 0}
                                  </span>
                                </div>
                              ) : (
                                <p className="text-[10px] text-stone-500 uppercase tracking-widest font-bold">Login to access wallet</p>
                              )}
                            </div>
                          </div>
                          {isProcessing ? <Loader2 size={16} className="animate-spin text-primary" /> : <ArrowRight size={16} className="text-stone-300 group-hover:text-primary transition-transform group-hover:translate-x-1" />}
                        </motion.button>
                      </div>

                      {/* COD */}
                      <div className="relative group">
                        <motion.button 
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => { setSelectedPaymentMethod('cod'); setStep('review'); }}
                          disabled={isProcessing}
                          className="w-full p-5 rounded-2xl border-2 border-stone-100 hover:border-emerald-500 hover:bg-emerald-50/50 transition-all flex items-center justify-between group shadow-sm"
                        >
                          <div className="flex items-center space-x-4">
                            <div className="p-3 rounded-xl bg-stone-100 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                              <Truck size={20} />
                            </div>
                            <div className="text-left">
                              <p className="font-bold text-stone-800">Cash on Delivery</p>
                              <p className="text-[10px] text-stone-500 font-bold uppercase tracking-widest">Pay at your doorstep</p>
                            </div>
                          </div>
                          <ArrowRight size={16} className="text-stone-300 group-hover:text-emerald-500 transition-transform group-hover:translate-x-1" />
                        </motion.button>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 pt-4 border-t border-stone-100">
                      <input 
                        type="checkbox" 
                        id="terms" 
                        className="rounded text-primary" 
                        checked={termsConfirmed}
                        onChange={(e) => setTermsConfirmed(e.target.checked)}
                      />
                      <label htmlFor="terms" className="text-xs text-stone-500">
                        I agree to the <Link to="/terms-and-conditions" className="text-primary hover:underline">Terms & Conditions</Link>
                      </label>
                    </div>
                  </div>

                  <button 
                    onClick={() => setStep('address')}
                    className="w-full py-4 border border-stone-200 rounded-2xl font-bold text-stone-500 hover:bg-stone-50 flex items-center justify-center space-x-2 transition-colors"
                  >
                    <ArrowLeft size={18} />
                    <span>Back to Address</span>
                  </button>
                </motion.div>
              )}

              {step === 'review' && (
                <motion.div 
                  key="review"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="bg-white p-8 rounded-3xl shadow-sm border border-stone-100 space-y-6"
                >
                  <h2 className="text-2xl font-bold">Review Order</h2>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                        {cartWithDiscounts.map(item => (
                            <div key={item.id} className="flex justify-between text-sm text-stone-600">
                                <span>{item.name} x {item.quantity}</span>
                                <span>₹{item.finalPrice * item.quantity}</span>
                            </div>
                        ))}
                    </div>
                    <div className="border-t border-stone-100 pt-4 space-y-2 text-stone-600">
                        <div className="flex justify-between">
                            <span>Subtotal</span>
                            <span>₹{subtotal}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Delivery Fee</span>
                            <span>₹{deliveryFee}</span>
                        </div>
                        <div className="flex justify-between font-bold text-lg text-stone-900 border-t pt-2">
                            <span>Total</span>
                            <span>₹{total}</span>
                        </div>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm text-stone-600">
                    <p>Payment Method: <strong className="uppercase">{selectedPaymentMethod}</strong></p>
                  </div>
                  
                  <button 
                    onClick={() => selectedPaymentMethod && placeOrder(selectedPaymentMethod)}
                    disabled={isProcessing}
                    className="w-full btn-primary py-4 flex items-center justify-center gap-2"
                  >
                    {isProcessing ? (
                        <>
                            <Loader2 className="animate-spin" size={18} />
                            Placing Order...
                        </>
                    ) : 'Confirm and Pay'}
                  </button>
                  <button 
                    onClick={() => setStep('payment_method')}
                    disabled={isProcessing}
                    className="w-full py-4 border border-stone-200 rounded-2xl font-bold text-stone-500 hover:bg-stone-100"
                  >
                    Back
                  </button>
                </motion.div>
              )}

              {step === 'awaiting_payment' && pendingOrder && (
                <motion.div 
                  key="awaiting_payment"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="fixed inset-0 z-[100] bg-stone-900/95 backdrop-blur-xl flex flex-col items-center justify-center p-4 overflow-y-auto"
                >
                   <div className="absolute top-4 right-4 sm:top-8 sm:right-8">
                      <button onClick={() => setStep('payment')} className="p-3 bg-white/10 text-white rounded-full hover:bg-white/20 transition-all"><X size={24} /></button>
                   </div>
                   <div className="bg-white rounded-[3rem] w-full max-w-lg p-8 shadow-2xl relative">
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-3 mb-8">
                           <div className="w-12 h-12 bg-stone-900 rounded-2xl flex items-center justify-center text-white"><span className="text-xl font-black">H</span></div>
                           <div className="text-left">
                              <p className="text-sm font-black text-stone-900 leading-none">Gateway Node</p>
                              <p className="text-[10px] font-black text-primary uppercase tracking-widest mt-1">ID: {pendingOrder.order_id}</p>
                           </div>
                        </div>

                        <div className="flex justify-center mb-8" ref={qrRef}>
                          <div className="relative p-6 bg-white rounded-[2.5rem] shadow-sm border border-stone-100 ring-12 ring-stone-50">
                            <QRCodeCanvas 
                              value={`upi://pay?pa=${upiId}&pn=${encodeURIComponent(upiName)}&am=${total}&cu=INR&tn=${pendingOrder.order_id}`}
                              size={200}
                              level="H"
                            />
                          </div>
                        </div>

                        <div className="space-y-2 mb-8">
                           <p className="text-[10px] font-black text-stone-300 uppercase tracking-[0.3em]">Authorized Payload</p>
                           <p className="text-5xl font-black text-stone-900 tracking-tighter">₹{total}</p>
                        </div>

                        {upiMode === 'manual' && (
                           <div className="space-y-4 bg-stone-50 p-6 rounded-3xl border border-stone-100 text-left">
                              <input 
                                type="text" 
                                placeholder="12-digit UPI Number"
                                className="w-full px-5 py-4 bg-white border border-stone-200 rounded-2xl outline-none focus:border-primary text-sm font-bold"
                                value={manualPaymentInfo.utr}
                                onChange={(e) => setManualPaymentInfo({...manualPaymentInfo, utr: e.target.value})}
                              />
                              <button 
                                onClick={submitPaymentProof}
                                disabled={isSubmittingProof || !manualPaymentInfo.utr}
                                className="w-full py-5 bg-stone-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl disabled:opacity-30"
                              >
                                Submit Proof
                              </button>
                           </div>
                        )}
                        <button onClick={downloadQR} className="text-[10px] font-black text-stone-400 uppercase tracking-widest mt-8">Download QR Card</button>
                      </div>
                   </div>
                </motion.div>
              )}

              {step === 'confirmation' && (
                <motion.div 
                  key="confirmation"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-white p-12 rounded-3xl shadow-sm border border-stone-100 text-center space-y-8"
                >
                  <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle2 size={48} />
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-3xl font-bold">Order Confirmed!</h2>
                    <p className="text-stone-500">Thank you for shopping with General Store Karyana Shop.</p>
                  </div>
                  <div className="bg-stone-50 p-6 rounded-2xl border border-stone-100 inline-block text-left w-full">
                    <p className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-4">{t('order_details') || 'Order Details'}</p>
                    <div className="grid md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                            <div className="flex justify-between space-x-12">
                                <span className="text-sm text-stone-500">{t('order_id') || 'Order ID'}</span>
                                <span className="text-sm font-bold uppercase">{pendingOrder?.order_id || '#HGS-PENDING'}</span>
                            </div>
                            <div className="flex justify-between space-x-12">
                                <span className="text-sm text-stone-500">{t('payment_status') || 'Payment Status'}</span>
                                <span className="text-sm font-bold text-emerald-600 uppercase">{t('paid') || 'Paid'}</span>
                            </div>
                            <div className="flex justify-between space-x-12">
                                <span className="text-sm text-stone-500">{t('delivery_method') || 'Delivery Method'}</span>
                                <span className="text-sm font-bold">{deliveryMethod === 'pickup' ? (t('store_pickup') || 'Store Pickup') : (t('standard_delivery') || 'Standard Delivery')}</span>
                            </div>
                            <div className="flex justify-between space-x-12">
                                <span className="text-sm text-stone-500">{t('estimated_arrival') || 'Estimated Arrival'}</span>
                                <span className="text-sm font-bold">{deliveryMethod === 'pickup' ? (t('ready_in_one_hour') || 'Ready in 1-2 Hours') : `2-4 ${(t('business_days') || 'Business Days')}`}</span>
                            </div>
                        </div>
                        {pendingOrder?.payment_method === 'upi' && (
                            <div className="bg-white p-4 rounded-2xl flex flex-col items-center shadow-sm border border-stone-100">
                                <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-2">Payment QR</p>
                                <QRCodeCanvas 
                                  value={`upi://pay?pa=${upiId}&pn=${encodeURIComponent(upiName)}&am=${total}&cu=INR&tn=${pendingOrder.order_id}`}
                                  size={120}
                                  level="L"
                                />
                            </div>
                        )}
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row justify-center gap-4">
                    <button 
                      onClick={() => navigate('/profile?tab=history')}
                      className="px-8 py-4 bg-white border border-stone-200 rounded-2xl font-bold text-stone-900 hover:bg-stone-50 transition-all active:scale-95 shadow-sm"
                    >
                      View Order History
                    </button>
                    <button 
                      onClick={() => navigate('/products')}
                      className="px-8 py-4 btn-primary rounded-2xl shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95"
                    >
                      Continue Shopping
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Right Sidebar - Order Summary (Floating on Desktop) */}
          <div className="lg:col-span-4 bg-stone-50/50 p-6 sm:p-8 space-y-8 h-full">
            <div className="sticky top-8 space-y-8">
              <div>
                <h3 className="text-lg font-black text-stone-900 mb-6 flex items-center gap-2">
                   <ShoppingBag size={20} className="text-primary" />
                   Order Summary
                </h3>
                
                <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 no-scrollbar">
                  {cartWithDiscounts.map((item) => (
                    <div key={`${item.id}-${item.selectedVariant?.id || 'base'}`} className="flex gap-4 group">
                      <div className="w-16 h-16 bg-white rounded-2xl border border-stone-100 flex-shrink-0 overflow-hidden shadow-sm">
                        <img src={item.image_url} alt={item.name} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-black text-stone-800 truncate mb-1">{item.name}</p>
                        <p className="text-[9px] font-bold text-stone-400 uppercase tracking-widest mb-1">Qty: {item.quantity}</p>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-stone-900">₹{(item.finalPrice * item.quantity).toFixed(0)}</span>
                          {item.price > item.finalPrice && (
                            <span className="text-[10px] text-stone-400 line-through">₹{(item.price * item.quantity).toFixed(0)}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Price Breakdown */}
              <div className="space-y-4 pt-6 border-t border-stone-100">
                <div className="flex justify-between text-sm">
                  <span className="text-stone-500 font-bold">Subtotal</span>
                  <span className="text-stone-900 font-black">₹{subtotal.toFixed(0)}</span>
                </div>
                
                {(totalBulkDiscount + totalPromoDiscount + couponDiscount) > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-emerald-500 font-bold">Store Discount</span>
                    <span className="text-emerald-500 font-black">-₹{(totalBulkDiscount + totalPromoDiscount + couponDiscount).toFixed(0)}</span>
                  </div>
                )}

                <div className="flex justify-between text-sm">
                  <div className="flex items-center gap-1">
                    <span className="text-stone-500 font-bold">Delivery Fee</span>
                    {deliveryMethod === 'pickup' && <span className="text-[8px] bg-emerald-100 text-emerald-600 px-1.5 py-0.5 rounded-full font-black uppercase tracking-widest">Free</span>}
                  </div>
                  <span className="text-stone-900 font-black">₹{deliveryFee.toFixed(0)}</span>
                </div>

                <div className="pt-6 border-t border-stone-100 flex justify-between items-center">
                  <div>
                    <p className="text-[10px] font-black text-stone-400 uppercase tracking-[0.2em] leading-none mb-1">Total Amount</p>
                    <p className="text-3xl font-black text-stone-900 tracking-tight">₹{total.toFixed(0)}</p>
                  </div>
                  <div className="text-right">
                     <p className="text-[8px] font-black text-emerald-500 uppercase tracking-widest bg-emerald-50 px-2 py-1 rounded-full border border-emerald-100">You Save ₹{(totalBulkDiscount + totalPromoDiscount + couponDiscount).toFixed(0)}</p>
                  </div>
                </div>
              </div>

              {/* Trust Badges */}
              <div className="grid grid-cols-2 gap-3 pt-4">
                 <div className="p-3 bg-white rounded-2xl border border-stone-100 flex flex-col items-center text-center gap-1">
                    <ShieldCheck size={16} className="text-emerald-500" />
                    <p className="text-[8px] font-black text-stone-800 uppercase tracking-widest">Safe Payments</p>
                 </div>
                 <div className="p-3 bg-white rounded-2xl border border-stone-100 flex flex-col items-center text-center gap-1">
                    <Truck size={16} className="text-primary" />
                    <p className="text-[8px] font-black text-stone-800 uppercase tracking-widest">Fast Delivery</p>
                 </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
