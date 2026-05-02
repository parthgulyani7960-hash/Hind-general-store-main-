import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShoppingBag, MapPin, CreditCard, CheckCircle2, 
  ArrowRight, ArrowLeft, Truck, ShieldCheck, 
  Wallet, Camera, X, AlertCircle, Download, Clock,
  Plus, Minus, RefreshCcw, Loader2, Copy
} from 'lucide-react';
import { useStore } from '../StoreContext';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { cn, calculateBulkDiscount } from '../lib/utils';
import { QRCodeCanvas } from 'qrcode.react';
import InfoButton from '../components/InfoButton';

type Step = 'address' | 'payment_method' | 'awaiting_payment' | 'confirmation';

export default function Checkout() {
  const { 
    cart, user, appliedCoupon, clearCart, 
    fetchUser, bulkDiscounts, config,
    addresses, fetchAddresses,
    updateQuantity, removeFromCart,
    isProfileComplete,
    t
  } = useStore();
  const navigate = useNavigate();

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

  const downloadQR = () => {
    const canvas = qrRef.current?.querySelector('canvas');
    if (canvas) {
      const url = canvas.toDataURL("image/png");
      const link = document.createElement('a');
      link.download = `HindStore_Order_${pendingOrder.order_id}.png`;
      link.href = url;
      link.click();
      toast.success('QR Code saved to gallery!');
    }
  };

  const upiId = config.find(c => c.key === 'upi_id')?.value || 'hindstore@upi';
  const upiName = config.find(c => c.key === 'upi_name')?.value || 'Hind General Store';
  
  // Address State
  const [useCustomAddress, setUseCustomAddress] = useState(false);
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);

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
    fetch('/api/delivery-areas')
      .then(res => res.json())
      .then(data => setDeliveryAreas(data))
      .catch(console.error);
  }, []);

  const [addressConfirmed, setAddressConfirmed] = useState(false);
  const [termsConfirmed, setTermsConfirmed] = useState(false);

  const validateAddress = () => {
    return addressData.name && addressData.phone && addressData.address && addressData.city && addressData.pin_code && addressData.delivery_area && addressConfirmed;
  };

  const selectedArea = deliveryAreas.find(a => a.name === addressData.delivery_area);

  const handleNextStep = () => {
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

  const deliveryFee = selectedArea ? selectedArea.fee : (subtotal > 500 ? 0 : 40);
  const total = subtotal - couponDiscount + deliveryFee;

  useEffect(() => {
    if (cart.length === 0 && !['confirmation', 'awaiting_payment'].includes(step)) {
      navigate('/cart');
    }
  }, [cart, navigate, step]);

  const placeOrder = async (method: 'cod' | 'wallet' | 'upi') => {
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
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user?.id || null,
          items: cartWithDiscounts.map(item => ({
            id: item.id,
            quantity: item.quantity,
            variant_id: item.selectedVariant?.id,
            price: item.finalPrice
          })),
          total,
          subtotal: subtotal + totalBulkDiscount,
          discount: couponDiscount + totalBulkDiscount,
          bulk_discount: totalBulkDiscount,
          coupon_discount: couponDiscount,
          delivery_fee: deliveryFee,
          payment_method: method,
          address: JSON.stringify(addressData), 
          coupon_code: appliedCoupon?.code
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Failed to place order.');
      }

      setPendingOrder(data.order);

      if (method === 'upi') {
        setStep('awaiting_payment');
      } else {
        toast.success('Order placed successfully!');
        clearCart();
        fetchUser(); 
        setStep('confirmation');
      }

    } catch (err: any) {
      toast.error(err.message || 'Failed to place order');
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
          const res = await fetch(`/api/orders/${pendingOrder.id}`);
          const data = await res.json();
          if (data.status === 'paid' || data.status === 'PAID') {
            toast.success('Payment received successfully! ✅');
            clearCart();
            fetchUser();
            setStep('confirmation');
          } else if (data.status === 'FAILED' || data.status === 'EXPIRED') {
            toast.error('Payment verification failed or expired.');
            setStep('payment_method');
          }
        } catch (err) {
          console.error('Polling error:', err);
        }
      }, 5000);
    }
    return () => clearInterval(interval);
  }, [step, pendingOrder]);

  // Removed early return for guest checkout

  return (
    <div className="min-h-screen bg-stone-50 py-12">
      <div className="max-w-5xl mx-auto px-4">
        {/* Checkout Steps */}
        <div className="flex items-center justify-center mb-12">
          {[
            { id: 'address', label: 'Address', icon: MapPin },
            { id: 'payment_method', label: 'Payment', icon: CreditCard },
            { id: 'confirmation', label: 'Done', icon: CheckCircle2 },
          ].map((s, i) => (
            <div key={s.id} className="flex items-center">
              <div className={cn(
                "flex flex-col items-center space-y-2",
                (step === s.id || (s.id === 'payment_method' && step === 'awaiting_payment')) ? "text-primary" : "text-stone-400"
              )}>
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all",
                  (step === s.id || (s.id === 'payment_method' && step === 'awaiting_payment')) ? "bg-primary text-white border-primary" : "bg-white border-stone-200"
                )}>
                  <s.icon size={20} />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest">{s.label}</span>
              </div>
              {i < 2 && (
                <div className={cn(
                  "w-20 h-0.5 mx-4 rounded-full",
                  i === 0 && (['payment_method', 'awaiting_payment', 'confirmation'].includes(step)) ? "bg-primary" : "bg-stone-200"
                )} />
              )}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2">
            <AnimatePresence mode="wait">
              {step === 'address' && (
                <motion.div 
                  key="address"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="bg-white p-8 rounded-3xl shadow-sm border border-stone-100 space-y-6"
                >
                  <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                       {t('shipping_address') || 'Shipping Address'}
                       <InfoButton title="Shipping" message="Ensure your delivery address is accurate for timely delivery." />
                    </h2>
                    {addresses.length > 0 && (
                      <button 
                        onClick={() => setUseCustomAddress(!useCustomAddress)}
                        className="text-xs font-bold text-primary flex items-center space-x-1 hover:underline"
                      >
                        <MapPin size={14} />
                        <span>{useCustomAddress ? 'Select Saved Address' : 'Enter Custom Address'}</span>
                      </button>
                    )}
                  </div>

                  {!useCustomAddress && addresses.length > 0 ? (
                    <div className="grid grid-cols-1 gap-4">
                      {addresses.map((addr) => (
                        <button
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
                            selectedAddressId === addr.id ? "border-primary bg-primary/5" : "border-stone-100 hover:border-stone-200"
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
                              <div className="text-primary bg-white rounded-full p-1 shadow-sm">
                                <CheckCircle2 size={24} />
                              </div>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-stone-400 uppercase tracking-wider">Full Name</label>
                        <input 
                          type="text" 
                          className="input-field" 
                          value={addressData.name}
                          onChange={(e) => setAddressData({...addressData, name: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-stone-400 uppercase tracking-wider">Phone Number</label>
                        <input 
                          type="text" 
                          className="input-field" 
                          value={addressData.phone}
                          onChange={(e) => setAddressData({...addressData, phone: e.target.value})}
                        />
                      </div>
                      <div className="md:col-span-2 space-y-2">
                        <label className="text-xs font-bold text-stone-400 uppercase tracking-wider">Street Address</label>
                        <textarea 
                          className="input-field min-h-[100px]" 
                          value={addressData.address}
                          onChange={(e) => setAddressData({...addressData, address: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-stone-400 uppercase tracking-wider">City</label>
                        <input 
                          type="text" 
                          className="input-field" 
                          value={addressData.city}
                          onChange={(e) => setAddressData({...addressData, city: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-stone-400 uppercase tracking-wider">Pin Code</label>
                        <div className="relative">
                          <input 
                            type="text" 
                            className="input-field pr-10" 
                            value={addressData.pin_code}
                            placeholder="6 digit PIN"
                            onChange={async (e) => {
                              const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                              setAddressData({...addressData, pin_code: val});
                              if (val.length === 6) {
                                try {
                                  const res = await fetch(`https://api.postalpincode.in/pincode/${val}`);
                                  const data = await res.json();
                                  if (data[0].Status === 'Success') {
                                    const po = data[0].PostOffice[0];
                                    setAddressData(prev => ({
                                      ...prev,
                                      city: po.District,
                                      state: po.State
                                    }));
                                  }
                                } catch (err) {
                                  console.error('Pincode lookup failed');
                                }
                              }
                            }}
                          />
                          <button 
                            type="button"
                            onClick={() => {
                              if ("geolocation" in navigator) {
                                toast.loading('Fetching location...', { id: 'geo_checkout' });
                                navigator.geolocation.getCurrentPosition(
                                  async (pos) => {
                                    const { latitude, longitude } = pos.coords;
                                    try {
                                      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
                                      const data = await res.json();
                                      if (data && data.address) {
                                        const addr = data.address;
                                        setAddressData(prev => ({
                                          ...prev,
                                          address: `${addr.road || ''}${addr.neighbourhood ? ', ' + addr.neighbourhood : ''}`,
                                          city: addr.city || addr.town || addr.village || '',
                                          state: addr.state || '',
                                          pin_code: addr.postcode?.slice(0, 6) || ''
                                        }));
                                        toast.success('Location found!', { id: 'geo_checkout' });
                                      } else {
                                        setAddressData(prev => ({...prev, address: `${latitude}, ${longitude}`}));
                                        toast.success('Location coordinates captured', { id: 'geo_checkout' });
                                      }
                                    } catch(err) {
                                      toast.error('Could not reverse geocode', { id: 'geo_checkout' });
                                    }
                                  },
                                  (err) => toast.error('Location denied', { id: 'geo_checkout' })
                                );
                              }
                            }}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-all"
                            title="Use My Current Location"
                          >
                            <MapPin size={16} />
                          </button>
                        </div>
                      </div>
                      <div className="md:col-span-2 space-y-2">
                        <label className="text-xs font-bold text-stone-400 uppercase tracking-wider">Delivery Zone</label>
                        <select 
                          className="input-field" 
                          value={addressData.delivery_area}
                          onChange={(e) => setAddressData({...addressData, delivery_area: e.target.value})}
                        >
                          <option value="">Select your delivery zone...</option>
                          {deliveryAreas.map(area => (
                            <option key={area.id} value={area.name}>
                               {area.name} (Min. Order ₹{area.min_order} | Fee ₹{area.fee})
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}
                  
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
                  <button 
                    onClick={handleNextStep}
                    className="w-full btn-primary py-4 flex items-center justify-center space-x-2"
                  >
                    <span>Continue to Payment</span>
                    <ArrowRight size={18} />
                  </button>
                </motion.div>
              )}

              {step === 'payment_method' && (
                <motion.div 
                  key="payment_method"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-6"
                >
                  <div className="bg-white p-8 rounded-3xl shadow-sm border border-stone-100 space-y-6">
                    <h2 className="text-2xl font-bold">Select Payment Method</h2>
                    
                    <div className="grid grid-cols-1 gap-4">
                      {/* UPI QR - Recommended */}
                      <div className="relative group">
                        <button 
                          onClick={() => isLoggedIn && placeOrder('upi')}
                          disabled={isProcessing || !isLoggedIn}
                          className={cn(
                            "w-full p-6 rounded-2xl border-2 transition-all flex items-center justify-between",
                            !isLoggedIn ? "bg-stone-50 border-stone-100 cursor-not-allowed opacity-70" : "border-stone-100 hover:border-primary hover:bg-primary/5"
                          )}
                        >
                          <div className="flex items-center space-x-4">
                            <div className={cn(
                              "p-3 rounded-xl transition-colors",
                              !isLoggedIn ? "bg-stone-200 text-stone-400" : "bg-stone-100 group-hover:bg-primary group-hover:text-white"
                            )}>
                              <CreditCard size={24} />
                            </div>
                            <div className="text-left">
                              <p className="font-bold">UPI QR Automation</p>
                              <p className="text-xs text-stone-500">Fast auto-verification via UPI Note</p>
                            </div>
                          </div>
                          <ArrowRight size={18} className="text-stone-300 group-hover:text-primary" />
                        </button>
                        {!isLoggedIn && (
                          <div className="mt-2 flex items-center justify-between px-2">
                            <p className="text-[10px] text-stone-500 font-medium italic">* Login required for UPI automated payments.</p>
                            <button 
                              onClick={() => navigate('/login')}
                              className="text-[10px] font-black text-primary uppercase tracking-wider hover:underline"
                            >
                              Login with Google
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Wallet */}
                      <div className="relative group">
                        <button 
                          onClick={() => isLoggedIn && placeOrder('wallet')}
                          disabled={isProcessing || !isLoggedIn || (user?.wallet_balance || 0) < total}
                          className={cn(
                            "w-full p-6 rounded-3xl border-2 transition-all flex items-center justify-between",
                            !isLoggedIn ? "bg-stone-50 border-stone-100 cursor-not-allowed opacity-70" : "border-stone-100 hover:border-primary hover:bg-primary/5",
                            isLoggedIn && (user?.wallet_balance || 0) < total && "opacity-50 cursor-not-allowed"
                          )}
                        >
                          <div className="flex items-center space-x-4">
                            <div className={cn(
                              "p-4 rounded-2xl transition-colors",
                              !isLoggedIn ? "bg-stone-200 text-stone-400" : "bg-stone-100 group-hover:bg-primary group-hover:text-white"
                            )}>
                              <Wallet size={24} />
                            </div>
                            <div className="text-left">
                              <p className="font-bold text-stone-900">Store Wallet</p>
                              {isLoggedIn ? (
                                <div className="mt-1 flex items-center">
                                  <span className={cn(
                                    "px-2 py-0.5 rounded-full text-[10px] font-black uppercase border",
                                    (user?.wallet_balance || 0) < total ? "bg-red-50 text-red-600 border-red-100" : "bg-emerald-50 text-emerald-600 border-emerald-100"
                                  )}>
                                    Balance: ₹{user?.wallet_balance || 0}
                                  </span>
                                </div>
                              ) : (
                                <p className="text-xs text-stone-500">Login to access your wallet</p>
                              )}
                            </div>
                          </div>
                          {isProcessing ? <Loader2 size={18} className="animate-spin text-primary" /> : <ArrowRight size={18} className="text-stone-300 group-hover:text-primary" />}
                        </button>
                      </div>

                      {/* Khata */}
                      {(!isLoggedIn || user?.khata_enabled) && (
                        <div className="relative group">
                          <button 
                            onClick={() => isLoggedIn && placeOrder('khata' as any)}
                            disabled={isProcessing || !isLoggedIn || (user?.khata_balance || 0) + total > (user?.credit_limit || 0)}
                            className={cn(
                              "w-full p-6 rounded-3xl border-2 transition-all flex items-center justify-between",
                              !isLoggedIn ? "bg-stone-50 border-stone-100 cursor-not-allowed opacity-70" : "border-stone-100 hover:border-blue-500 hover:bg-blue-50/50",
                              isLoggedIn && (user?.khata_balance || 0) + total > (user?.credit_limit || 0) && "opacity-50 cursor-not-allowed"
                            )}
                          >
                            <div className="flex items-center space-x-4">
                              <div className={cn(
                                "p-4 rounded-2xl transition-colors",
                                !isLoggedIn ? "bg-stone-200 text-stone-400" : "bg-stone-100 group-hover:bg-blue-500 group-hover:text-white"
                              )}>
                                <Clock size={24} />
                              </div>
                              <div className="text-left">
                                <p className="font-bold text-stone-900">Khata (Credit Line)</p>
                                {isLoggedIn ? (
                                  <div className="mt-1 flex flex-wrap gap-2">
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-blue-50 text-blue-600 border border-blue-100">
                                      Limit: ₹{user?.credit_limit || 0}
                                    </span>
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-stone-50 text-stone-500 border border-stone-200">
                                      Used: ₹{user?.khata_balance || 0}
                                    </span>
                                  </div>
                                ) : (
                                  <p className="text-xs text-stone-500">Login to view credit limit</p>
                                )}
                              </div>
                            </div>
                            <ArrowRight size={18} className={cn("text-stone-300", isLoggedIn && "group-hover:text-blue-500")} />
                          </button>
                        </div>
                      )}

                      {/* COD */}
                      <button 
                        onClick={() => placeOrder('cod')}
                        disabled={isProcessing}
                        className="w-full p-6 rounded-2xl border-2 border-stone-100 hover:border-emerald-500 hover:bg-emerald-50/50 transition-all flex items-center justify-between group"
                      >
                        <div className="flex items-center space-x-4">
                          <div className="p-3 rounded-xl bg-stone-100 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                            <Truck size={24} />
                          </div>
                          <div className="text-left">
                            <p className="font-bold">Cash on Delivery</p>
                            <p className="text-xs text-stone-500">Pay at your doorstep</p>
                          </div>
                        </div>
                        <ArrowRight size={18} className="text-stone-300 group-hover:text-emerald-500" />
                      </button>
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
                    className="w-full py-4 border border-stone-200 rounded-2xl font-bold text-stone-500 hover:bg-stone-100 flex items-center justify-center space-x-2"
                  >
                    <ArrowLeft size={18} />
                    <span>Back to Address</span>
                  </button>
                </motion.div>
              )}

              {step === 'awaiting_payment' && pendingOrder && (
                <motion.div 
                  key="awaiting_payment"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-white p-8 rounded-3xl shadow-sm border border-stone-100 space-y-8 text-center"
                >
                  <div className="space-y-2">
                    <h2 className="text-2xl font-bold">Complete Your Payment</h2>
                    <p className="text-stone-500 text-sm">Scan the QR code below using any UPI app (PhonePe, GPay, Paytm, etc.)</p>
                  </div>

                  <div className="flex flex-col items-center space-y-6">
                    <div className="bg-white p-8 rounded-[3rem] shadow-2xl border border-stone-100 relative group max-w-md w-full overflow-hidden">
                      {/* Decorative Background Elements */}
                      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-3xl" />
                      <div className="absolute bottom-0 left-0 w-32 h-32 bg-emerald-500/5 rounded-full -ml-16 -mb-16 blur-3xl" />
                      
                      <div className="relative z-10 flex flex-col items-center">
                        <div className="flex items-center space-x-3 mb-8">
                          <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center shadow-lg transform rotate-6 border-4 border-white">
                            <span className="text-white font-black text-xl">H</span>
                          </div>
                          <div className="text-left">
                            <p className="text-sm font-black text-stone-900 leading-tight">Hind General Store</p>
                            <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Official Payment QR</p>
                          </div>
                        </div>

                        <div className="flex justify-center mb-8" ref={qrRef}>
                          <div className="relative p-6 bg-white rounded-[2.5rem] shadow-sm border border-stone-100 ring-12 ring-stone-50">
                            <QRCodeCanvas 
                              value={`upi://pay?pa=${upiId}&pn=${encodeURIComponent(upiName)}&am=${total}&cu=INR&tn=${pendingOrder.order_id}`}
                              size={220}
                              level="H"
                              includeMargin={false}
                              fgColor="#1c1917"
                              eyeRadius={[
                                { outer: [20, 20, 4, 20], inner: [8, 8, 2, 8] },
                                { outer: [20, 20, 20, 4], inner: [8, 8, 8, 2] },
                                { outer: [20, 4, 20, 20], inner: [8, 2, 8, 8] },
                              ]}
                              imageSettings={{
                                src: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 40'%3E%3Crect width='40' height='40' rx='14' fill='%23ea580c'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='white' font-family='Inter, sans-serif' font-weight='900' font-size='24'%3EH%3C/text%3E%3C/svg%3E",
                                height: 50,
                                width: 50,
                                excavate: true,
                              }}
                            />
                          </div>
                        </div>

                        <div className="w-full space-y-6">
                          <div className="text-center">
                            <p className="text-[10px] font-black text-stone-400 uppercase tracking-[0.3em] mb-2">Total Amount</p>
                            <p className="text-5xl font-black text-stone-900 tracking-tight">₹{total}</p>
                            
                            <div className="mt-4 inline-flex items-center gap-2 px-4 py-1.5 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-100 shadow-sm shadow-emerald-500/5">
                               <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                               <span className="text-[10px] font-black uppercase tracking-widest">Securing Payment...</span>
                            </div>
                          </div>

                          <div className="pt-6 border-t border-dashed border-stone-200">
                             <div className="bg-primary/5 p-5 rounded-3xl border-2 border-primary/10 text-center relative group/token">
                                <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-1">Transaction Note (Embedded)</p>
                                <p className="text-xl font-black text-primary tracking-widest">{pendingOrder.order_id}</p>
                                <p className="text-[8px] text-primary/60 font-bold mt-1 uppercase tracking-tighter">Automatic matching verification active</p>
                             </div>
                             
                             <div className="mt-4 flex justify-center">
                                <button 
                                  onClick={downloadQR}
                                  className="flex items-center gap-2 px-6 py-2.5 bg-stone-900 text-white rounded-2xl hover:bg-stone-800 transition-all font-black text-[10px] uppercase tracking-[0.1em] shadow-lg shadow-stone-900/20"
                                >
                                  <Download size={14} className="text-primary" />
                                  <span>Download QR Card</span>
                                </button>
                             </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="w-full space-y-4 max-w-sm">
                      {/* Step by Step Instructions */}
                      <div className="space-y-3 text-xs font-medium text-stone-600 bg-white p-5 rounded-3xl border border-stone-100 shadow-sm">
                        <p className="font-black text-stone-900 mb-3 flex items-center gap-2">
                          <CheckCircle2 size={16} className="text-primary" />
                          Steps for Auto-Verification
                        </p>
                        <div className="space-y-3">
                          <div className="flex items-start gap-3">
                            <span className="w-5 h-5 rounded-full bg-stone-100 text-stone-600 flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5 border border-stone-200">1</span>
                            <p>Scan the QR or use the button below to pay.</p>
                          </div>
                          <div className="flex items-start gap-3">
                            <span className="w-5 h-5 rounded-full bg-stone-100 text-stone-600 flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5 border border-stone-200">2</span>
                            <p>In your UPI app, locate the <span className="font-bold text-stone-900 border-b-2 border-primary/20">Note / Add Message</span> field.</p>
                          </div>
                          <div className="flex items-start gap-3 bg-primary/5 p-4 rounded-2xl border border-primary/10">
                            <span className="w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5 shadow-sm">3</span>
                            <div>
                                <p className="font-black text-stone-900 border-b-2 border-primary/20 inline-block mb-1">Paste your Order ID</p>
                                <p>Enter <span className="font-black text-primary px-1.5 py-0.5 bg-white rounded border border-primary/20">{pendingOrder.order_id}</span> in the <span className="font-bold text-stone-900 italic">Note / Remark</span> field of your UPI app. This is **CRITICAL** for instant delivery.</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Mobile Deep Link Button */}
                      <div className="block md:hidden">
                        <a 
                          href={`upi://pay?pa=${upiId}&pn=${encodeURIComponent(upiName)}&am=${total}&cu=INR&tn=${pendingOrder.order_id}`}
                          className="w-full btn-primary py-4 rounded-2xl flex items-center justify-center space-x-2 shadow-lg shadow-primary/20"
                        >
                          <CreditCard size={20} />
                          <span className="font-bold">Pay with UPI App</span>
                        </a>
                        <p className="text-[10px] text-stone-400 text-center mt-2">Opens GPay, PhonePe, Paytm, etc.</p>
                      </div>

                      <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 text-amber-800 text-xs text-left flex gap-3">
                        <AlertCircle className="shrink-0" size={18} />
                        <div>
                          <p><strong>Crucial:</strong> Do not change the <strong>Note/Remark</strong>. Our system uses the Order ID <strong>{pendingOrder.order_id}</strong> for auto-verification.</p>
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-center space-y-3">
                        <div className="flex items-center space-x-3 text-primary">
                          <RefreshCcw className="animate-spin" size={18} />
                          <span className="font-bold animate-pulse">Waiting for payment confirmation...</span>
                        </div>
                        <p className="text-[10px] text-stone-400">Payment detection usually takes 30-60 seconds after successful transaction.</p>
                      </div>
                    </div>

                    <button 
                      onClick={() => setStep('payment_method')}
                      className="text-xs font-bold text-stone-400 hover:text-stone-600 transition-colors"
                    >
                      Cancel and choose different method
                    </button>
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
                    <p className="text-stone-500">Thank you for shopping with Hind General Store.</p>
                  </div>
                  <div className="bg-stone-50 p-6 rounded-2xl border border-stone-100 inline-block text-left">
                    <p className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-4">{t('order_details') || 'Order Details'}</p>
                    <div className="space-y-2">
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
                        <span className="text-sm font-bold">{t('standard_delivery') || 'Standard Delivery'}</span>
                      </div>
                      <div className="flex justify-between space-x-12">
                        <span className="text-sm text-stone-500">{t('estimated_arrival') || 'Estimated Arrival'}</span>
                        <span className="text-sm font-bold">2-4 {(t('business_days') || 'Business Days')}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row justify-center gap-4">
                    <button 
                      onClick={() => navigate('/profile')}
                      className="px-8 py-4 border border-stone-200 rounded-2xl font-bold hover:bg-stone-50 transition-colors"
                    >
                      View Order History
                    </button>
                    <button 
                      onClick={() => navigate('/products')}
                      className="px-8 py-4 btn-primary rounded-2xl"
                    >
                      Continue Shopping
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Order Summary Sidebar */}
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-stone-100 space-y-6">
              <h3 className="text-xl font-bold">{t('order_summary') || 'Order Summary'}</h3>
              
              <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {cartWithDiscounts.map((item) => (
                  <div 
                    key={`${item.id}-${item.selectedVariant?.id || 'base'}`}
                    className="flex items-center space-x-4 border-b border-stone-50 pb-4 last:border-0 last:pb-0"
                  >
                    <div className="w-12 h-12 rounded-lg overflow-hidden border border-stone-100 shrink-0">
                      <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold line-clamp-1">{item.name}</p>
                      <p className="text-xs text-stone-500 mt-0.5">Qty: {item.quantity}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-black">₹{item.finalPrice * item.quantity}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-3 pt-6 border-t border-stone-100">
                <div className="flex justify-between text-sm">
                  <span className="text-stone-500">Subtotal</span>
                  <span className="font-bold text-stone-800">₹{subtotal}</span>
                </div>
                {couponDiscount > 0 && (
                  <div className="flex justify-between text-sm text-emerald-600">
                    <span>Coupon Discount</span>
                    <span className="font-black">-₹{couponDiscount}</span>
                  </div>
                )}
                {totalBulkDiscount > 0 && (
                  <div className="flex justify-between text-sm text-emerald-600">
                    <span>Bulk Discount</span>
                    <span className="font-black">-₹{totalBulkDiscount}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-stone-500">Delivery Fee</span>
                  <span className="font-bold text-stone-800">{deliveryFee === 0 ? 'FREE' : `₹${deliveryFee}`}</span>
                </div>
                <div className="flex justify-between text-lg pt-3 border-t border-stone-200">
                  <span className="font-black text-stone-900">Total</span>
                  <span className="text-2xl font-black text-primary">₹{total}</span>
                </div>
              </div>
            </div>

            <div className="bg-stone-900 text-white p-6 rounded-3xl shadow-xl shadow-stone-200 space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-primary">
                  <ShieldCheck size={24} />
                </div>
                <div>
                  <p className="text-sm font-bold">Secure Checkout</p>
                  <p className="text-[10px] text-stone-400">SSL Encrypted Transactions</p>
                </div>
              </div>
              <p className="text-[10px] text-stone-500 italic">By placing this order, you agree to our policies regarding returns and cancellations. All UPI payments are processed via automated verification.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
