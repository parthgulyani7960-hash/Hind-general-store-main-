import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShoppingBag, MapPin, CreditCard, CheckCircle2, 
  ArrowRight, ArrowLeft, Truck, ShieldCheck, 
  Wallet, Camera, X, AlertCircle, Download, Clock,
  Plus, Minus
} from 'lucide-react';
import { useStore } from '../StoreContext';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { cn, calculateBulkDiscount } from '../lib/utils';
import { QRCodeCanvas } from 'qrcode.react';

type Step = 'address' | 'payment' | 'confirmation';

export default function Checkout() {
  const { 
    cart, user, appliedCoupon, clearCart, 
    fetchUser, bulkDiscounts, config,
    addresses, fetchAddresses,
    updateQuantity, removeFromCart
  } = useStore();
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('address');
  const [isProcessing, setIsProcessing] = useState(false);
  const qrRef = useRef<HTMLDivElement>(null);
  const [showSavedAddresses, setShowSavedAddresses] = useState(false);

  const upiId = config.find(c => c.key === 'upi_id')?.value || 'hindstore@upi';
  const upiName = config.find(c => c.key === 'upi_name')?.value || 'Hind General Store';
  const upiQr = config.find(c => c.key === 'upi_qr')?.value;
  
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
      // Only auto-select if we haven't manually chosen to use custom or selected something else
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
  const [dynamicDeliveryFee, setDynamicDeliveryFee] = useState(40);
  
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
    
    // Check minimum order for zone
    if (selectedArea && subtotal < selectedArea.min_order) {
        toast.error(`Minimum order amount for ${selectedArea.name} is ₹${selectedArea.min_order}. Add more items to your cart.`);
        return;
    }
    
    setStep('payment');
  };

  // Payment State
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'wallet' | 'upi'>('cod');
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [utr, setUtr] = useState('');
  const [paymentRef] = useState(`HGS-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`);

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

  const deliveryFee = selectedArea ? selectedArea.fee : (subtotal > 500 ? 0 : 40);
  const total = subtotal - couponDiscount + deliveryFee;

  useEffect(() => {
    if (cart.length === 0 && step !== 'confirmation') {
      navigate('/cart');
    }
  }, [cart, navigate, step]);

  const handleScreenshotUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setScreenshot(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const downloadQR = () => {
    const canvas = qrRef.current?.querySelector('canvas');
    if (canvas) {
      const url = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = url;
      a.download = `payment-qr-${total}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  const placeOrder = async () => {
    if (!user) {
      toast.error('Please login to place an order');
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

    if (paymentMethod === 'wallet' && user.wallet_balance < total) {
      toast.error('Insufficient wallet balance');
      return;
    }

    if (paymentMethod === 'upi') {
      if (!screenshot) {
        toast.error('Please upload payment screenshot');
        return;
      }
      if (!utr || utr.length < 8) {
        toast.error('Please enter a valid Transaction ID / UTR');
        return;
      }
    }

    setIsProcessing(true);
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id,
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
          payment_method: paymentMethod,
          payment_screenshot: screenshot,
          payment_utr: utr,
          payment_ref: paymentRef,
          address: JSON.stringify(addressData), 
          coupon_code: appliedCoupon?.code
        })
      });

      let data;
      try {
        data = await res.json();
      } catch (e) {
        throw new Error('Server returned an invalid response.');
      }

      if (!res.ok) {
        throw new Error(data.message || 'Failed to place order.');
      }

      toast.success('Order placed successfully!');
      clearCart();
      fetchUser(); 
      setStep('confirmation');

    } catch (err: any) {
      toast.error(err.message || 'Failed to place order');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 py-12">
      <div className="max-w-5xl mx-auto px-4">
        {/* Checkout Steps */}
        <div className="flex items-center justify-center mb-12">
          {[
            { id: 'address', label: 'Address', icon: MapPin },
            { id: 'payment', label: 'Payment', icon: CreditCard },
            { id: 'confirmation', label: 'Done', icon: CheckCircle2 },
          ].map((s, i) => (
            <div key={s.id} className="flex items-center">
              <div className={cn(
                "flex flex-col items-center space-y-2",
                step === s.id ? "text-primary" : "text-stone-400"
              )}>
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all",
                  step === s.id ? "bg-primary text-white border-primary" : "bg-white border-stone-200"
                )}>
                  <s.icon size={20} />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest">{s.label}</span>
              </div>
              {i < 2 && (
                <div className={cn(
                  "w-20 h-0.5 mx-4 rounded-full",
                  i === 0 && (step === 'payment' || step === 'confirmation') ? "bg-primary" : "bg-stone-200"
                )} />
              )}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Main Content */}
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
                    <h2 className="text-2xl font-bold">Shipping Address</h2>
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
                      <input 
                        type="text" 
                        className="input-field" 
                        value={addressData.pin_code}
                        onChange={(e) => setAddressData({...addressData, pin_code: e.target.value})}
                      />
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
                      <p className="text-[10px] text-stone-400">Selecting a zone will calculate any applicable delivery fees or minimum order requirements.</p>
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

              {step === 'payment' && (
                <motion.div 
                  key="payment"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-6"
                >
                  <div className="bg-white p-8 rounded-3xl shadow-sm border border-stone-100 space-y-6">
                    <h2 className="text-2xl font-bold">Payment Method</h2>
                    
                    <div className="space-y-4">
                      {/* Wallet Option */}
                      <button 
                        onClick={() => setPaymentMethod('wallet')}
                        className={cn(
                          "w-full p-6 rounded-2xl border-2 transition-all flex items-center justify-between",
                          paymentMethod === 'wallet' ? "border-primary bg-primary/5" : "border-stone-100 hover:border-stone-200"
                        )}
                      >
                        <div className="flex items-center space-x-4">
                          <div className={cn("p-3 rounded-xl", paymentMethod === 'wallet' ? "bg-primary text-white" : "bg-stone-100 text-stone-400")}>
                            <Wallet size={24} />
                          </div>
                          <div className="text-left">
                            <p className="font-bold">Pay via Wallet</p>
                            <p className="text-xs text-stone-500">Current Balance: ₹{user.wallet_balance}</p>
                          </div>
                        </div>
                        {paymentMethod === 'wallet' && <CheckCircle2 className="text-primary" />}
                      </button>

                      {/* UPI Option */}
                      <div className={cn(
                        "rounded-2xl border-2 transition-all overflow-hidden",
                        paymentMethod === 'upi' ? "border-primary" : "border-stone-100 hover:border-stone-200"
                      )}>
                        <button 
                          onClick={() => setPaymentMethod('upi')}
                          className={cn(
                            "w-full p-6 flex items-center justify-between",
                            paymentMethod === 'upi' ? "bg-primary/5" : ""
                          )}
                        >
                          <div className="flex items-center space-x-4">
                            <div className={cn("p-3 rounded-xl", paymentMethod === 'upi' ? "bg-primary text-white" : "bg-stone-100 text-stone-400")}>
                              <CreditCard size={24} />
                            </div>
                            <div className="text-left">
                              <p className="font-bold">Online Payment (UPI)</p>
                              <p className="text-xs text-stone-500">Scan QR and upload screenshot</p>
                            </div>
                          </div>
                          {paymentMethod === 'upi' && <CheckCircle2 className="text-primary" />}
                        </button>
                        
                        {paymentMethod === 'upi' && (
                          <motion.div 
                            initial={{ height: 0 }}
                            animate={{ height: 'auto' }}
                            className="p-6 bg-stone-50 border-t border-stone-100 space-y-6"
                          >
                            <div className="flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-8">
                              <div ref={qrRef} className="bg-white p-4 rounded-2xl shadow-sm border border-stone-200 flex flex-col items-center">
                                <QRCodeCanvas 
                                  value={`upi://pay?pa=${upiId}&pn=${encodeURIComponent(upiName)}&am=${total}&cu=INR&tr=${paymentRef}`}
                                  size={150}
                                  level="H"
                                  includeMargin={true}
                                />
                                <p className="text-[10px] font-bold text-stone-600 mt-3">Pay Amount: ₹{total}</p>
                                <button 
                                  onClick={downloadQR}
                                  className="mt-3 flex items-center space-x-1 text-xs font-bold text-primary hover:text-primary/80 transition-colors"
                                >
                                  <Download size={12} />
                                  <span>Download QR</span>
                                </button>
                              </div>
                              <div className="flex-1 space-y-4 w-full">
                                <div className="space-y-4">
                                  <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Upload Payment Screenshot</label>
                                  <div className="relative">
                                    <input 
                                      type="file" 
                                      accept="image/*"
                                      onChange={handleScreenshotUpload}
                                      className="hidden" 
                                      id="payment-screenshot"
                                    />
                                    {screenshot ? (
                                      <div className="relative w-full h-40 rounded-xl overflow-hidden border border-stone-200">
                                        <img src={screenshot} alt="Screenshot preview" className="w-full h-full object-cover" />
                                        <button
                                          type="button"
                                          onClick={() => setScreenshot(null)}
                                          className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                                        >
                                          <X size={14} />
                                        </button>
                                      </div>
                                    ) : (
                                      <label 
                                        htmlFor="payment-screenshot"
                                        className="flex flex-col items-center justify-center space-y-2 w-full py-8 border-2 border-dashed border-stone-200 rounded-xl cursor-pointer hover:border-primary transition-all bg-white"
                                      >
                                        <Camera size={24} className="text-stone-400" />
                                        <span className="text-sm font-bold text-stone-500">Click to upload screenshot</span>
                                      </label>
                                    )}
                                  </div>
                                </div>
                                <div className="space-y-2">
                                  <label className="text-xs font-bold text-stone-600 uppercase tracking-wider">Transaction ID (UTR)</label>
                                  <input 
                                    type="text" 
                                    placeholder="Enter your 12-digit UPI Transaction ID"
                                    className="input-field bg-white border-primary focus:ring-primary"
                                    value={utr}
                                    onChange={(e) => setUtr(e.target.value)}
                                  />
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </div>

                      {/* Khata Option (B2B Credit) */}
                      {user.khata_enabled && (
                        <button 
                          onClick={() => setPaymentMethod('khata' as any)}
                          className={cn(
                            "w-full p-6 rounded-2xl border-2 transition-all flex items-center justify-between",
                            paymentMethod === 'khata' ? "border-primary bg-primary/5" : "border-stone-100 hover:border-stone-200"
                          )}
                        >
                          <div className="flex items-center space-x-4">
                            <div className={cn("p-3 rounded-xl", paymentMethod === 'khata' ? "bg-primary text-white" : "bg-stone-100 text-stone-400")}>
                              <Clock size={24} />
                            </div>
                            <div className="text-left">
                              <p className="font-bold">Khata (Credit Line)</p>
                              <p className="text-xs text-stone-500">Buy now, pay later within {user.khata_limit || 0} limit</p>
                              <div className="mt-1 w-full bg-stone-200 h-1 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-primary" 
                                  style={{ width: `${Math.min(100, ((user.khata_balance || 0) / (user.credit_limit || 10000)) * 100)}%` }} 
                                />
                              </div>
                            </div>
                          </div>
                          {paymentMethod === 'khata' && <CheckCircle2 className="text-primary" />}
                        </button>
                      )}

                      {/* COD Option */}
                      <button 
                        onClick={() => setPaymentMethod('cod')}
                        className={cn(
                          "w-full p-6 rounded-2xl border-2 transition-all flex items-center justify-between",
                          paymentMethod === 'cod' ? "border-primary bg-primary/5" : "border-stone-100 hover:border-stone-200"
                        )}
                      >
                        <div className="flex items-center space-x-4">
                          <div className={cn("p-3 rounded-xl", paymentMethod === 'cod' ? "bg-primary text-white" : "bg-stone-100 text-stone-400")}>
                            <Truck size={24} />
                          </div>
                          <div className="text-left">
                            <p className="font-bold">Cash on Delivery</p>
                            <p className="text-xs text-stone-500">Pay when you receive your order</p>
                          </div>
                        </div>
                        {paymentMethod === 'cod' && <CheckCircle2 className="text-primary" />}
                      </button>
                    </div>
                    
                    <div className="flex items-center space-x-2 mt-4">
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

                  <div className="flex space-x-4">
                    <button 
                      onClick={() => setStep('address')}
                      className="flex-1 py-4 border border-stone-200 rounded-2xl font-bold text-stone-500 hover:bg-stone-100 flex items-center justify-center space-x-2"
                    >
                      <ArrowLeft size={18} />
                      <span>Back to Address</span>
                    </button>
                    <button 
                      onClick={placeOrder}
                      disabled={isProcessing}
                      className="flex-[2] btn-primary py-4 flex items-center justify-center space-x-2 shadow-xl shadow-primary/20"
                    >
                      <span>{isProcessing ? 'Processing...' : `Pay ₹${total}`}</span>
                      {!isProcessing && <ArrowRight size={18} />}
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
                    <p className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-4">Order Details</p>
                    <div className="space-y-2">
                      <div className="flex justify-between space-x-12">
                        <span className="text-sm text-stone-500">Payment Status</span>
                        <span className="text-sm font-bold text-emerald-600 uppercase">Success</span>
                      </div>
                      <div className="flex justify-between space-x-12">
                        <span className="text-sm text-stone-500">Delivery Method</span>
                        <span className="text-sm font-bold">Standard Delivery</span>
                      </div>
                      <div className="flex justify-between space-x-12">
                        <span className="text-sm text-stone-500">Estimated Arrival</span>
                        <span className="text-sm font-bold">2-4 Business Days</span>
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
              <h3 className="text-xl font-bold">Order Summary</h3>
              
              <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                <AnimatePresence mode="popLayout">
                  {cartWithDiscounts.map((item) => (
                    <motion.div 
                      key={`${item.id}-${item.selectedVariant?.id || 'base'}`}
                      layout
                      initial={{ opacity: 0, x: -10, scale: 0.95 }}
                      animate={{ opacity: 1, x: 0, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9, filter: "blur(4px)" }}
                      className="flex items-center space-x-4 border-b border-stone-50 pb-4 last:border-0 last:pb-0"
                    >
                      <div className="w-12 h-12 rounded-lg overflow-hidden border border-stone-100 shrink-0">
                        <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold line-clamp-1">{item.name}</p>
                        <div className="flex items-center space-x-2 mt-1">
                          <div className="flex items-center space-x-1.5 bg-stone-50 rounded border border-stone-200">
                            <motion.button 
                              whileTap={{ scale: 0.8 }}
                              onClick={() => updateQuantity(item.id, -1, item.selectedVariant?.id)} 
                              className="p-1 hover:bg-white text-stone-500 hover:text-primary rounded transition-colors"
                            >
                              <Minus size={10} strokeWidth={3} />
                            </motion.button>
                            <span className="font-bold text-[10px] w-3 text-center leading-none">{item.quantity}</span>
                            <motion.button 
                              whileTap={{ scale: 0.8 }}
                              onClick={() => updateQuantity(item.id, 1, item.selectedVariant?.id)} 
                              className="p-1 hover:bg-white text-stone-500 hover:text-primary rounded transition-colors"
                            >
                              <Plus size={10} strokeWidth={3} />
                            </motion.button>
                          </div>
                        </div>
                        {item.bulkDiscountAmount > 0 && (
                          <p className="text-[8px] text-emerald-600 font-bold uppercase mt-1">Bulk Discount Applied</p>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs font-bold">₹{item.finalPrice * item.quantity}</p>
                        {item.bulkDiscountAmount > 0 && (
                          <p className="text-[8px] text-emerald-600 font-medium">Saved ₹{item.bulkDiscountAmount * item.quantity}</p>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              <div className="space-y-3 pt-6 border-t border-stone-100">
                <div className="flex justify-between text-sm text-stone-500">
                  <span>Items Subtotal</span>
                  <span>₹{subtotal + totalBulkDiscount}</span>
                </div>
                {totalBulkDiscount > 0 && (
                  <div className="flex justify-between text-sm text-emerald-600">
                    <span>Bulk Savings</span>
                    <span>-₹{totalBulkDiscount}</span>
                  </div>
                )}
                {couponDiscount > 0 && (
                  <div className="flex justify-between text-sm text-emerald-600">
                    <span>Coupon Discount</span>
                    <span>-₹{couponDiscount}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm text-stone-500">
                  <span>Delivery Fee</span>
                  <span>{deliveryFee === 0 ? 'FREE' : `₹${deliveryFee}`}</span>
                </div>
                <div className="pt-4 border-t border-stone-100 flex justify-between font-black text-xl">
                  <span>Total</span>
                  <span>₹{total}</span>
                </div>
              </div>

              <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100 flex items-start space-x-3">
                <ShieldCheck size={20} className="text-emerald-600 mt-0.5" />
                <div>
                  <p className="text-[10px] font-bold text-emerald-800 uppercase tracking-widest">Secure Checkout</p>
                  <p className="text-[10px] text-emerald-600">Your data is protected by industry-standard encryption.</p>
                </div>
              </div>
            </div>

            {step === 'address' && (
              <div className="bg-amber-50 p-6 rounded-3xl border border-amber-100 space-y-3">
                <div className="flex items-center space-x-2 text-amber-600">
                  <AlertCircle size={18} />
                  <span className="text-xs font-bold uppercase tracking-tight">Important Note</span>
                </div>
                <p className="text-[10px] text-amber-700 leading-relaxed">
                  Please ensure your delivery address and phone number are correct. We use these details for order verification and delivery updates.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
