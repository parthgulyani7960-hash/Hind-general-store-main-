import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useNavigate, Link } from 'react-router-dom';
import { useStore } from '@/StoreContext';
import { ShoppingBag, MapPin, CreditCard, CheckCircle2, ShieldCheck, AlertTriangle, Store, Truck, Compass, RotateCw, Navigation, Signal } from 'lucide-react';
import { cn, getAuthHeaders } from '@/lib/utils';
import { fetchWithHandling } from '@/lib/api';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/Button';
import { LocationStatus } from '@/components/LocationStatus';
import { triggerFeedback } from '@/lib/feedback';
import { queueOfflineOrder } from '@/lib/offline';

export default function Checkout() {
  const { cart, t, user, clearCart } = useStore();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [deliveryMethod, setDeliveryMethod] = useState<'delivery' | 'pickup' | null>(null);
  const [addressData, setAddressData] = useState({ 
    name: user?.name && user.name !== 'undefined' ? user.name : '', 
    phone: user?.phone || '', 
    address: user?.address || '',
    postcode: ''
  });
  const [detectedPostcode, setDetectedPostcode] = useState<string>('');
  const [coords, setCoords] = useState<{lat: number, lng: number} | null>(null);
  const [reverseGeocodedAddress, setReverseGeocodedAddress] = useState<string>('');
  const [tnc, setTnc] = useState(false);
  const [tncError, setTncError] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorHeader, setErrorHeader] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [isOfflineOrder, setIsOfflineOrder] = useState(false);
  const [locationPreference, setLocationPreference] = useState<'gps' | 'manual' | null>(null);

  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null);
  const [backoffDelay, setBackoffDelay] = useState<number>(0);
  const [currentAttempt, setCurrentAttempt] = useState<number>(0);
  const [isLocationLocked, setIsLocationLocked] = useState(false);

  const [shake, setShake] = useState(false);
  const isStep2Valid = addressData.name.trim().length >= 2 && 
                      /^[0-9]{10}$/.test(addressData.phone) && 
                      (deliveryMethod === 'pickup' || (addressData.address.trim().length >= 5 && /^[0-9]{6}$/.test(addressData.postcode)));

  const handleNextStep = () => {
    if (isStep2Valid) {
      triggerFeedback('medium');
      setStep(3);
    } else {
      triggerFeedback('heavy');
      setShake(true);
      setTimeout(() => setShake(false), 500);
      toast.error('Please complete all fields correctly');
    }
  };

  const fetchPreciseLocation = (attempt = 1, delay = 500) => {
    setGpsLoading(true);
    setGpsError(null);
    setCurrentAttempt(attempt);

    if (!navigator.geolocation) {
      setGpsError("Geolocation is not supported by your browser or environment.");
      setGpsLoading(false);
      return;
    }

    const options = { 
      enableHighAccuracy: true, 
      timeout: 5000, // Faster timeout for immediate precision
      maximumAge: 0 
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        setGpsAccuracy(accuracy);
        
        // Target precision: < 20 meters (User requested high accuracy/precision)
        if (accuracy > 20 && attempt < 2) { 
          setBackoffDelay(delay / 1000);
          const nextAttempt = attempt + 1;
          const nextDelay = 1000;
          setTimeout(() => {
            fetchPreciseLocation(nextAttempt, nextDelay);
          }, delay);
        } else {
          setCoords({ lat: latitude, lng: longitude });
          setIsLocationLocked(true);
          setGpsLoading(false);
          setBackoffDelay(0);
          toast.success(`Position Locked Precision: ±${accuracy?.toFixed(1) || '0'}m`);
          
          const geoUrl2 = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`;

          fetch(geoUrl2)
            .then(res => res.json())
            .then(data => {
              let fullStr = '';
              if (data) {
                const parts = [];
                if (data.locality) parts.push(data.locality);
                if (data.city) parts.push(data.city);
                if (data.principalSubdivision) parts.push(data.principalSubdivision);
                if (data.countryName) parts.push(data.countryName);
                if (data.postcode) {
                  parts.push(data.postcode);
                  setDetectedPostcode(data.postcode);
                  setAddressData(prev => ({ ...prev, postcode: data.postcode }));
                }
                fullStr = parts.join(', ');
              }
              if (fullStr) {
                setReverseGeocodedAddress(fullStr);
                setAddressData(prev => ({
                  ...prev,
                  address: fullStr
                }));
              }
            })
            .catch(() => {
                setReverseGeocodedAddress(`Lat: ${latitude.toFixed(6)}, Lng: ${longitude.toFixed(6)}`);
            });
        }
      },
      (err) => {
        console.warn(`GPS Attempt ${attempt} failed:`, err.message);
        if (attempt < 2) {
          setBackoffDelay(delay / 1000);
          const nextAttempt = attempt + 1;
          setTimeout(() => {
            fetchPreciseLocation(nextAttempt, 1000);
          }, delay);
        } else {
          setGpsError(`Low signal. Using standard approximation.`);
          setGpsLoading(false);
          setBackoffDelay(0);
        }
      },
      options
    );
  };

  useEffect(() => {
    // If delivery is chosen, start fetching location immediately to save time
    if (deliveryMethod === 'delivery' && !coords && !gpsLoading) {
      fetchPreciseLocation(1, 0);
    }
  }, [deliveryMethod]);

  useEffect(() => {
    if (cart.length === 0 && step !== 3 && step !== 4) {
      const timer = setTimeout(() => navigate('/cart'), 3000);
      return () => clearTimeout(timer);
    }
  }, [cart, step, deliveryMethod, navigate]);

  const placeOrder = async () => {
    if(!tnc) {
        setTncError(true);
        return;
    }
    
    setIsProcessing(true);
    setErrorHeader(null);

    try {
      const transactionId = `TXN-${Math.random().toString(36).substring(2, 12).toUpperCase()}`;
      
      const subtotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
      const deliveryFee = 0;
      
      const payload = {
        user_id: user?.id || 'guest',
        items: cart.map(i => ({
          id: i.id,
          name: i.name,
          price: i.price,
          quantity: i.quantity,
          variant_id: i.selectedVariant?.id || null
        })),
        total: subtotal + deliveryFee,
        subtotal: subtotal,
        delivery_fee: deliveryFee,
        address: {
          ...addressData,
          coordinates: coords,
          manual_address: reverseGeocodedAddress
        },
        payment_method: 'online',
        payment_id: transactionId,
        delivery_type: deliveryMethod || 'standard',
        notes: deliveryMethod === 'pickup' ? 'Self Pickup from Store' : `Delivery to: ${addressData.address}`
      };

      if (!navigator.onLine) {
        await queueOfflineOrder(payload);
        setIsOfflineOrder(true);
        setOrderId(`OFFLINE-${transactionId}`);
        clearCart();
        setStep(4);
        triggerFeedback('heavy');
        toast.success("Order Queued Offline! Will sync when back online.");
        return;
      }

      const res = await fetchWithHandling<any>('/api/orders', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload)
      });

      if (res && (res.success || res.order_id)) {
        setOrderId(res.order_id || res.id || 'N/A');
        clearCart();
        setStep(3);
        triggerFeedback('heavy');
        toast.success("Order Placed Successfully!");
      } else {
        throw new Error(res?.message || "Generic failure");
      }
    } catch (e) {
      // Security masked error (User Request: "tell them that something went wrong and it will be resolved soon")
      setErrorHeader("Something went wrong with the process. Our team is looking into it and it will be resolved soon.");
      console.error("SEC_AUDIT_LOG: Order failed, potential mismatch or network interrup", e);
    } finally {
      setIsProcessing(false);
    }
  };

  const steps = [
    { id: 1, label: 'Method' },
    { id: 2, label: 'Details' },
    { id: 3, label: 'Payment' },
    { id: 4, label: 'Review' },
    { id: 5, label: 'Success' },
  ];

  const renderStep = () => {
    const { config: storeConfig } = useStore();
    const upiId = storeConfig?.find(c => c.key === 'upi_id')?.value;
    const upiName = storeConfig?.find(c => c.key === 'upi_name')?.value;
    const upiQr = storeConfig?.find(c => c.key === 'upi_qr')?.value;
    const bankName = storeConfig?.find(c => c.key === 'bank_name')?.value;
    const accHolder = storeConfig?.find(c => c.key === 'account_holder')?.value;
    const accNumber = storeConfig?.find(c => c.key === 'account_number')?.value;
    const ifscCode = storeConfig?.find(c => c.key === 'ifsc_code')?.value;

    if (errorHeader) return (
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-8 text-center space-y-6"
      >
        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto text-red-500">
          <AlertTriangle size={32} />
        </div>
        <div className="space-y-2">
           <h3 className="text-lg font-black text-stone-900 capitalize">System Interruption</h3>
           <p className="text-stone-500 font-medium text-sm leading-relaxed">{errorHeader}</p>
        </div>
        <Button 
          className="w-full p-4 rounded-2xl bg-stone-900 text-white font-black uppercase tracking-widest active:scale-95 transition-all shadow-xl shadow-stone-900/10" 
          onClick={() => {
            triggerFeedback('light');
            setErrorHeader(null);
          }}
          variant="primary"
        >
          Return to Checkout
        </Button>
      </motion.div>
    );

    switch(step) {
      case 1: return <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-stone-900 text-white rounded-lg flex items-center justify-center font-black transition-all hover:scale-110">1</div>
          <h2 className="text-xl font-black tracking-tight text-stone-900">Selection Method</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button 
            onClick={() => {
              triggerFeedback('medium');
              setDeliveryMethod('delivery');
              setStep(2);
            }}
            className={cn(
              "p-6 rounded-3xl border-2 transition-all text-left flex flex-col gap-3 group relative overflow-hidden",
              deliveryMethod === 'delivery' ? "border-stone-900 bg-stone-900 text-white shadow-xl shadow-stone-900/10" : "border-stone-100 bg-white hover:border-stone-200"
            )}
          >
            <div className={cn(
              "w-12 h-12 rounded-2xl flex items-center justify-center transition-colors",
              deliveryMethod === 'delivery' ? "bg-white/10 text-white" : "bg-stone-50 text-stone-900"
            )}>
              <Truck size={24} />
            </div>
            <div>
              <div className="font-black text-sm uppercase tracking-widest">Address Delivery</div>
              <div className={cn(
                "text-[10px] font-bold mt-1",
                deliveryMethod === 'delivery' ? "text-white/60" : "text-stone-400"
              )}>Standard doorstep arrival</div>
            </div>
          </button>

          <button 
            onClick={() => {
              triggerFeedback('medium');
              setDeliveryMethod('pickup');
              setStep(2);
            }}
            className={cn(
              "p-6 rounded-3xl border-2 transition-all text-left flex flex-col gap-3 group relative overflow-hidden",
              deliveryMethod === 'pickup' ? "border-stone-900 bg-stone-900 text-white shadow-xl shadow-stone-900/10" : "border-stone-100 bg-white hover:border-stone-200"
            )}
          >
            <div className={cn(
              "w-12 h-12 rounded-2xl flex items-center justify-center transition-colors",
              deliveryMethod === 'pickup' ? "bg-white/10 text-white" : "bg-stone-50 text-stone-900"
            )}>
              <Store size={24} />
            </div>
            <div>
              <div className="font-black text-sm uppercase tracking-widest">Self Pickup</div>
              <div className={cn(
                "text-[10px] font-bold mt-1",
                deliveryMethod === 'pickup' ? "text-white/60" : "text-stone-400"
              )}>Collect from fulfillment hub</div>
            </div>
          </button>
        </div>
      </div>;

      case 2:
        if (deliveryMethod === 'delivery' && !locationPreference) {
          return (
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-stone-900 text-white rounded-lg flex items-center justify-center font-black">2</div>
                <h2 className="text-xl font-black tracking-tight text-stone-900">Delivery Preference</h2>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <button 
                  onClick={() => {
                    triggerFeedback('medium');
                    setLocationPreference('gps');
                    fetchPreciseLocation(1, 0);
                  }}
                  className="p-6 rounded-3xl border-2 border-emerald-100 bg-emerald-50/20 hover:bg-emerald-50 hover:border-emerald-200 transition-all text-left flex items-start gap-4"
                >
                  <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center text-white shrink-0">
                    <Navigation size={22} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                       <span className="font-black text-xs uppercase tracking-widest text-emerald-700">Use Live GPS</span>
                       <span className="bg-emerald-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded uppercase">Recommended</span>
                    </div>
                    <p className="text-[10px] font-bold text-emerald-600/70 mt-1 leading-relaxed">Detects your current location for the most accurate door-step delivery.</p>
                  </div>
                </button>

                <button 
                  onClick={() => {
                    triggerFeedback('medium');
                    setLocationPreference('manual');
                  }}
                  className="p-6 rounded-3xl border-2 border-stone-100 bg-white hover:bg-stone-50 transition-all text-left flex items-start gap-4"
                >
                  <div className="w-12 h-12 bg-stone-100 rounded-2xl flex items-center justify-center text-stone-900 shrink-0">
                    <MapPin size={22} />
                  </div>
                  <div className="flex-1">
                    <span className="font-black text-xs uppercase tracking-widest text-stone-900">Manual Address Entry</span>
                    <p className="text-[10px] font-bold text-stone-400 mt-1 leading-relaxed">Enter your house/locality address manually if you are ordering for elsewhere.</p>
                  </div>
                </button>
              </div>

              <Button 
                variant="ghost"
                className="w-full text-stone-400 text-[10px] font-black uppercase tracking-widest"
                onClick={() => setStep(1)}
              >
                Go Back
              </Button>
            </div>
          );
        }

        if (deliveryMethod === 'delivery' && locationPreference === 'gps' && !isLocationLocked) {
          return (
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-stone-900 text-white rounded-lg flex items-center justify-center font-black uppercase">GPS</div>
                <h2 className="text-xl font-black tracking-tight text-stone-900">Establishing Position</h2>
              </div>

              <div className="bg-emerald-50 border border-emerald-100/50 rounded-3xl p-6 text-center space-y-6 relative overflow-hidden">
                <div className="relative w-24 h-24 mx-auto flex items-center justify-center">
                  <div className="absolute inset-0 bg-emerald-500/10 rounded-full animate-ping duration-1000" />
                  <div className="absolute w-16 h-16 bg-emerald-500/20 rounded-full animate-pulse" />
                  <div className="relative w-12 h-12 bg-emerald-600 rounded-full flex items-center justify-center text-white shadow-lg">
                    {gpsLoading ? (
                      <RotateCw className="w-6 h-6 animate-spin" />
                    ) : (
                      <Signal className="w-6 h-6 animate-pulse" />
                    )}
                  </div>
                </div>

                <div className="space-y-1">
                  <h3 className="text-base font-black text-emerald-900 tracking-tight">Syncing Satellites...</h3>
                  <p className="text-[10px] text-emerald-600 font-bold leading-relaxed px-4">
                    Locating the nearest pin code and current location detected for precise doorway delivery.
                  </p>
                </div>

                <LocationStatus
                  status={gpsLoading ? 'fetching' : (gpsError ? 'error' : (isLocationLocked ? 'success' : 'idle'))}
                  accuracy={gpsAccuracy}
                  errorMessage={gpsError}
                  onRetry={() => fetchPreciseLocation(1, 1000)}
                  coords={coords}
                  backoffDelay={backoffDelay}
                  attempt={currentAttempt}
                  postcode={detectedPostcode}
                />
              </div>

              <div className="space-y-3">
                <Button 
                   variant="ghost"
                   className="w-full text-stone-400 text-[10px] font-black uppercase tracking-widest hover:text-stone-900"
                   onClick={() => setLocationPreference(null)}
                >
                   Change Preference
                </Button>
              </div>
            </div>
          );
        }

        if (deliveryMethod === 'pickup' && !isLocationLocked) {
          return (
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                 <div className="w-8 h-8 bg-indigo-900 text-white rounded-lg flex items-center justify-center font-black">
                   <ShieldCheck size={16} />
                 </div>
                 <h2 className="text-xl font-black tracking-tight text-stone-900 italic">Security Verification</h2>
              </div>

              <div className="bg-indigo-50 border border-indigo-100 rounded-3xl p-6 text-center space-y-6">
                <div className="relative w-20 h-20 mx-auto bg-white rounded-full flex items-center justify-center shadow-inner border border-indigo-100">
                   <Navigation size={32} className={cn("text-indigo-600", gpsLoading && "animate-pulse")} />
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-sm font-black text-indigo-900 uppercase tracking-widest">Order Locality Lock</h3>
                  <p className="text-[10px] text-indigo-600 font-bold leading-relaxed">
                    To prevent misplacement and verify pickup credentials, we log your starting coordinates for security verification at the store.
                  </p>
                </div>

                {gpsLoading ? (
                  <div className="flex items-center justify-center gap-2 text-indigo-600 text-[10px] font-black uppercase tracking-[0.2em]">
                    <RotateCw size={12} className="animate-spin" />
                    <span>Verifying Coordinates...</span>
                  </div>
                ) : gpsError ? (
                  <div className="space-y-3">
                    <p className="text-[9px] text-red-500 font-black uppercase">{gpsError}</p>
                    <Button 
                      variant="primary" 
                      className="bg-indigo-900 text-white text-[10px] font-black uppercase tracking-widest py-2 rounded-xl"
                      onClick={() => fetchPreciseLocation(1, 0)}
                    >
                      Retry Security Lock
                    </Button>
                  </div>
                ) : (
                  <Button 
                    variant="primary"
                    className="w-full bg-indigo-900 text-white rounded-2xl p-4 font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-900/10 active:scale-95 transition-all"
                    onClick={() => fetchPreciseLocation(1, 0)}
                    disabled={gpsLoading}
                  >
                    Start Security Verification
                  </Button>
                )}
              </div>

              <Button 
                variant="ghost"
                className="w-full text-stone-400 text-[10px] font-black uppercase tracking-widest"
                onClick={() => setStep(1)}
              >
                Go Back
              </Button>
            </div>
          );
        }

        return (
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-stone-900 text-white rounded-lg flex items-center justify-center font-black">2</div>
              <h2 className="text-xl font-black tracking-tight text-stone-900">
                {deliveryMethod === 'pickup' ? 'Collection Information' : 'Delivery Destination Details'}
              </h2>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5 focus-within:translate-x-1 transition-transform">
                <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">
                  {deliveryMethod === 'pickup' ? 'Collector Name' : 'Recipient Name'}
                </label>
                <div className="relative group">
                  <input 
                    type="text" 
                    placeholder="e.g. John Doe" 
                    autoComplete="name"
                    className={cn(
                      "w-full p-4 border-2 rounded-2xl focus:border-stone-900 outline-none transition-all font-bold placeholder:text-stone-300 pr-12",
                      addressData.name.trim().length >= 2 ? "border-emerald-100 bg-emerald-50/10" : "border-stone-100"
                    )}
                    value={addressData.name} 
                    onChange={(e) => setAddressData({...addressData, name: e.target.value})} 
                  />
                  {addressData.name.trim().length >= 2 && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-500">
                      <CheckCircle2 size={18} />
                    </div>
                  )}
                  {user?.name && addressData.name !== user.name && !addressData.name.trim().length && (
                    <button 
                      onClick={() => setAddressData(p => ({ ...p, name: user.name }))}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-primary uppercase bg-primary/5 px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      Fill My Name
                    </button>
                  )}
                </div>
              </div>

              <div className="space-y-1.5 focus-within:translate-x-1 transition-transform">
                <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">Primary Contact Number</label>
                <div className="relative group">
                  <input 
                    type="tel" 
                    inputMode="tel"
                    placeholder="Enter 10-digit mobile" 
                    autoComplete="tel"
                    className={cn(
                      "w-full p-4 border-2 rounded-2xl focus:border-stone-900 outline-none transition-all font-bold placeholder:text-stone-300 pr-12",
                      /^[0-9]{10}$/.test(addressData.phone) ? "border-emerald-100 bg-emerald-50/10" : "border-stone-100"
                    )}
                    value={addressData.phone} 
                    onChange={(e) => setAddressData({...addressData, phone: e.target.value.replace(/\D/g, '').slice(0,10)})} 
                  />
                  {/^[0-9]{10}$/.test(addressData.phone) && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-500">
                      <CheckCircle2 size={18} />
                    </div>
                  )}
                  {user?.phone && addressData.phone !== user.phone && !addressData.phone.length && (
                    <button 
                      onClick={() => setAddressData(p => ({ ...p, phone: user.phone }))}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-primary uppercase bg-primary/5 px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      Use Primary
                    </button>
                  )}
                </div>
              </div>

              {deliveryMethod === 'delivery' && (
                <div className="space-y-3">
                  <div className="space-y-1.5 focus-within:translate-x-1 transition-transform">
                    <div className="flex justify-between items-end mb-1 px-1">
                      <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Address Information</label>
                      {!isLocationLocked && !gpsLoading && (
                        <div className="flex items-center gap-2">
                          {user?.address && addressData.address !== user.address && (
                            <button 
                              onClick={() => setAddressData(p => ({ ...p, address: user.address || '' }))}
                              className="text-[10px] font-black text-primary uppercase bg-primary/5 px-3 py-1 rounded-full hover:bg-primary/10 transition-colors"
                            >
                              Profile Address
                            </button>
                          )}
                          <button 
                            onClick={() => fetchPreciseLocation(1, 500)}
                            className="flex items-center gap-1.5 text-[10px] font-black text-emerald-600 uppercase tracking-tight bg-emerald-50 px-3 py-1 rounded-full hover:bg-emerald-100 transition-colors"
                          >
                            <Navigation size={12} />
                            Use My Live Location
                          </button>
                        </div>
                      )}
                    </div>
                    
                    {isLocationLocked ? (
                      <div className="bg-stone-900 text-white rounded-3xl p-5 relative overflow-hidden group shadow-2xl">
                        {/* Decorative Background Accent */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
                        
                        <div className="flex items-start gap-4 mb-4 relative z-10">
                          <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center shrink-0">
                            <MapPin size={24} className="text-primary animate-pulse" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Verified GPS Location</p>
                              {addressData.postcode && (
                                <span className="bg-primary/20 text-primary text-[8px] font-black px-2 py-0.5 rounded-full border border-primary/30">
                                  PIN: {addressData.postcode}
                                </span>
                              )}
                            </div>
                            <p className="text-sm font-bold leading-tight break-words">
                              {addressData.address || "Live Location Locked"}
                            </p>
                          </div>
                        </div>

                        <div className="flex gap-2 relative z-10">
                          <button 
                            onClick={() => setIsLocationLocked(false)}
                            className="flex-1 bg-white/10 hover:bg-white/20 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                          >
                            Edit Manually
                          </button>
                          <button 
                            onClick={() => fetchPreciseLocation(1, 400)}
                            className="bg-primary/20 hover:bg-primary/30 text-primary px-4 py-2.5 rounded-xl transition-all"
                            title="Recalibrate GPS"
                          >
                            <RotateCw size={14} className={cn(gpsLoading && "animate-spin")} />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="flex gap-3">
                          <div className="flex-1 relative group">
                            <textarea 
                              placeholder="House No, Street, Locality..." 
                              autoComplete="street-address"
                              className={cn(
                                "w-full p-4 border-2 rounded-2xl focus:border-stone-900 outline-none transition-all min-h-[100px] font-bold placeholder:text-stone-300 resize-none shadow-inner bg-stone-50/30",
                                addressData.address.trim().length >= 10 ? "border-emerald-100 bg-emerald-50/10" : "border-stone-100"
                              )}
                              value={addressData.address} 
                              onChange={(e) => setAddressData({...addressData, address: e.target.value})} 
                            />
                            {addressData.address.trim().length >= 10 && (
                              <div className="absolute right-4 top-4 text-emerald-500">
                                <CheckCircle2 size={18} />
                              </div>
                            )}
                          </div>
                          <div className="w-28 sm:w-32 relative group">
                            <input 
                              type="text"
                              inputMode="numeric"
                              placeholder="PIN Code"
                              className={cn(
                                "w-full p-4 border-2 rounded-2xl focus:border-stone-900 outline-none transition-all font-bold placeholder:text-stone-300 shadow-inner bg-stone-50/30 text-center",
                                /^[0-9]{6}$/.test(addressData.postcode) ? "border-emerald-100 bg-emerald-50/10" : "border-stone-100"
                              )}
                              value={addressData.postcode}
                              onChange={(e) => setAddressData({...addressData, postcode: e.target.value.replace(/\D/g, '').slice(0, 6)})}
                            />
                            {/^[0-9]{6}$/.test(addressData.postcode) && (
                              <div className="absolute right-2 top-2 text-emerald-500">
                                <CheckCircle2 size={14} />
                              </div>
                            )}
                            <p className="text-[8px] font-black text-stone-400 uppercase text-center mt-1">6-Digit Code</p>
                          </div>
                        </div>
                        
                        {(gpsLoading || gpsError || coords) && (
                          <LocationStatus
                            status={gpsLoading ? 'fetching' : (gpsError ? 'error' : 'success')}
                            coords={coords}
                            accuracy={gpsAccuracy}
                            errorMessage={gpsError}
                            onRetry={() => fetchPreciseLocation(1, 0)}
                            attempt={currentAttempt}
                            backoffDelay={backoffDelay}
                            postcode={addressData.postcode}
                          />
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {deliveryMethod === 'delivery' && reverseGeocodedAddress && !gpsError && !isLocationLocked && (
              <div className="px-1">
                <p className="text-[10px] font-bold text-stone-500 bg-stone-50 p-3 rounded-2xl border border-stone-100 overflow-hidden text-ellipsis whitespace-nowrap">
                   {reverseGeocodedAddress}
                </p>
              </div>
            )}

            <motion.div
              animate={shake ? { x: [0, -10, 10, -10, 10, 0] } : { x: 0 }}
              transition={{ duration: 0.4 }}
            >
              <Button 
                variant="primary"
                className={cn(
                  "w-full p-5 rounded-2xl bg-stone-900 text-white font-black uppercase tracking-widest shadow-xl shadow-stone-900/10 active:scale-95 transition-all group",
                  !isStep2Valid && "opacity-80"
                )} 
                onClick={handleNextStep}
              >
                <span>Continue to Final Review</span>
              </Button>
            </motion.div>
            <Button 
              variant="ghost"
              className="w-full py-2 text-stone-400 font-extrabold uppercase text-[10px] tracking-widest" 
              onClick={() => {
                if (deliveryMethod === 'delivery') {
                  setIsLocationLocked(false);
                }
                setStep(1);
              }}
            >
              Go Back
            </Button>
          </div>
        );

      case 3: 
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-stone-900 text-white rounded-lg flex items-center justify-center font-black">3</div>
              <h2 className="text-xl font-black tracking-tight text-stone-900">Payment Information</h2>
            </div>

            <div className="space-y-4">
              <div className="bg-stone-50 p-6 rounded-3xl border border-stone-100 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black text-stone-900 uppercase tracking-widest">UPI Payment</h3>
                  <span className="text-[8px] bg-emerald-500 text-white px-2 py-0.5 rounded-full font-black uppercase">Instant</span>
                </div>
                
                {upiQr && (
                  <div className="flex justify-center py-2">
                    <img src={upiQr} alt="Payment QR" className="w-48 h-48 object-contain rounded-2xl shadow-xl border-4 border-white" />
                  </div>
                )}
                
                <div className="space-y-3">
                  <div>
                    <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-1">UPI Identifier</p>
                    <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-stone-100">
                      <p className="text-xs font-black text-stone-900 truncate pr-2">{upiId || 'N/A'}</p>
                      <button 
                        onClick={() => {
                          if (upiId) {
                            navigator.clipboard.writeText(upiId);
                            toast.success('UPI ID Copied');
                          }
                        }}
                        className="text-[10px] font-black text-primary uppercase"
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-1">Receiver Name</p>
                    <p className="text-xs font-bold text-stone-700">{upiName || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {(bankName || accNumber) && (
                <div className="bg-white p-6 rounded-3xl border border-stone-100 space-y-4 shadow-sm">
                  <h3 className="text-sm font-black text-stone-900 uppercase tracking-widest">Bank Transfer</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-1">Bank Name</p>
                      <p className="text-xs font-bold text-stone-900">{bankName || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-1">IFSC Code</p>
                      <p className="text-xs font-bold text-stone-900 uppercase">{ifscCode || 'N/A'}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-1">Account Number</p>
                      <div className="flex items-center justify-between bg-stone-50 p-3 rounded-xl border border-stone-100">
                        <p className="text-xs font-mono font-black text-stone-900">{accNumber || 'N/A'}</p>
                        <button 
                          onClick={() => {
                            if (accNumber) {
                              navigator.clipboard.writeText(accNumber);
                              toast.success('Acc Number Copied');
                            }
                          }}
                          className="text-[10px] font-black text-primary uppercase"
                        >
                          Copy
                        </button>
                      </div>
                    </div>
                    <div className="col-span-2">
                      <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-1">Account Holder</p>
                      <p className="text-xs font-bold text-stone-900">{accHolder || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <Button 
              variant="primary"
              className="w-full p-5 rounded-2xl bg-stone-900 text-white font-black uppercase tracking-widest shadow-xl shadow-stone-900/10 active:scale-95 transition-all" 
              onClick={() => {
                triggerFeedback('medium');
                setStep(4);
              }}
            >
              Confirm Details & Proceed
            </Button>
            <Button 
              variant="ghost"
              className="w-full py-2 text-stone-400 font-extrabold uppercase text-[10px] tracking-widest" 
              onClick={() => setStep(2)}
            >
              Go Back
            </Button>
          </div>
        );

      case 4: return <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-stone-900 text-white rounded-lg flex items-center justify-center font-black">4</div>
          <h2 className="text-xl font-black tracking-tight text-stone-900">Secure Order Review</h2>
        </div>

        <div className="bg-stone-50 p-6 rounded-2xl border-2 border-dashed border-stone-200 flex flex-col gap-4">
           <div className="flex justify-between items-center text-sm font-bold text-stone-600">
              <span className="uppercase tracking-widest text-[10px]">Method</span>
              <span className="text-stone-900 uppercase italic tracking-tighter text-xs">
                {deliveryMethod === 'delivery' ? 'Address Delivery' : 'Self Pickup'}
              </span>
           </div>
           
           <div className="flex justify-between items-start text-sm font-bold text-stone-600">
              <span className="uppercase tracking-widest text-[10px] mt-1">{deliveryMethod === 'pickup' ? 'Collector' : 'Recipient'}</span>
              <div className="text-right">
                <p className="text-stone-900 font-black">{addressData.name}</p>
                <p className="text-[10px] text-stone-400 font-mono">+{addressData.phone}</p>
              </div>
           </div>

           {deliveryMethod === 'delivery' && (
             <div className="flex justify-between items-start text-sm font-bold text-stone-600">
                <span className="uppercase tracking-widest text-[10px] mt-1">Destination</span>
                <div className="text-right max-w-[70%]">
                  <p className="text-stone-900 text-[11px] leading-tight break-words">{addressData.address}</p>
                  {addressData.postcode && <p className="text-primary text-[10px] font-black mt-1">PIN: {addressData.postcode}</p>}
                </div>
             </div>
           )}

           {deliveryMethod === 'pickup' && coords && (
             <div className="flex justify-between items-center text-sm font-bold text-stone-600">
                <span className="uppercase tracking-widest text-[10px]">Security Lock</span>
                <span className="text-indigo-600 text-[9px] font-black uppercase tracking-widest flex items-center gap-1">
                  <ShieldCheck size={10} /> GPS Verified
                </span>
             </div>
           )}

           <div className="h-px bg-stone-200 w-full" />
           <div className="flex justify-between items-end">
              <span className="font-extrabold text-stone-400 uppercase text-[10px] tracking-widest mb-1">Total Amount</span>
              <span className="font-black text-4xl text-stone-900 italic tracking-tighter">₹{cart.reduce((s, i) => s + i.price * i.quantity, 0)}</span>
           </div>
        </div>

        <div className="space-y-3">
          <label className={cn(
            "flex items-center gap-3 text-sm cursor-pointer p-5 rounded-2xl border-2 transition-all group",
            tncError ? "border-red-200 bg-red-50/50" : "border-stone-50 bg-stone-50 hover:bg-stone-100"
          )}>
              <input type="checkbox" className="w-5 h-5 rounded-lg border-stone-300 text-stone-900 focus:ring-0 focus:ring-offset-0 transition-all" checked={tnc} onChange={() => { setTnc(!tnc); setTncError(false); }} />
              <div className="flex flex-col">
                <span className="font-black text-stone-700 text-xs uppercase tracking-tight">Accept Terms</span>
                <span className="text-[10px] text-stone-400 font-bold">I agree to the <Link to="/terms" className="text-primary underline">service policy</Link></span>
              </div>
          </label>
        </div>

        <Button 
          variant="primary"
          className="w-full p-6 bg-stone-900 text-white disabled:opacity-50 font-black text-lg uppercase tracking-[0.2em] rounded-[2.5rem] shadow-2xl shadow-stone-900/30 active:scale-[0.98] transition-all relative overflow-hidden group" 
          disabled={isProcessing || !tnc} 
          isLoading={isProcessing}
          onClick={() => {
            triggerFeedback('heavy');
            placeOrder();
          }}
        >
          Authorize Payment
        </Button>
        
        {!isProcessing && (
          <Button 
            variant="ghost"
            className="w-full py-4 text-stone-400 font-extrabold uppercase text-[10px] tracking-widest hover:text-stone-900" 
            onClick={() => setStep(3)}
          >
            Modify Payment/Details
          </Button>
        )}
      </div>;

      case 5: return <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="space-y-8 text-center py-6"
      >
        <div className={cn(
          "w-24 h-24 rounded-[2.5rem] flex items-center justify-center mx-auto shadow-xl",
          isOfflineOrder ? "bg-stone-100 text-stone-500 shadow-stone-200/20" : "bg-emerald-50 text-emerald-500 shadow-emerald-500/10"
        )}>
           {isOfflineOrder ? <Truck size={48} /> : <CheckCircle2 size={48} />}
        </div>
        <div className="space-y-2">
           <h2 className="text-3xl font-black text-stone-900 tracking-tighter">
             {isOfflineOrder ? 'Order Queued!' : 'Order Success!'}
           </h2>
           <p className="text-stone-500 font-bold text-sm">
             {isOfflineOrder 
               ? 'You are currently offline. Your order will be sent automatically once connectivity is restored.' 
               : 'Your secure transaction has been logged.'}
           </p>
        </div>
        
        <div className="bg-stone-50 p-6 rounded-3xl border border-stone-100 inline-block w-full">
           <div className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-1">
             {isOfflineOrder ? 'Queue Identifier' : 'Receipt Number'}
           </div>
           <p className="text-stone-900 font-black text-lg font-mono">#{orderId}</p>
        </div>

        <button 
          className="w-full p-5 rounded-2xl bg-stone-900 text-white font-black uppercase tracking-widest hover:shadow-2xl hover:shadow-stone-900/20 active:scale-95 transition-all" 
          onClick={() => navigate(isOfflineOrder ? '/history' : '/history?tab=orders')}
        >
          {isOfflineOrder ? 'Return to History' : 'Track Progress'}
        </button>
      </motion.div>;
    }
  }

  return (
    <div className="min-h-screen md:min-h-[85vh] bg-stone-50/50 flex items-center justify-center p-0 sm:p-4 dynamic-viewport-form overflow-x-hidden">
      <div className="w-full max-w-xl px-4 py-8 sm:p-0">
        {/* Progress Header */}
        <div className="flex justify-between items-center mb-4 px-2">
           <Link to="/cart" className="text-xs font-black uppercase tracking-widest text-stone-400 hover:text-stone-900 transition-colors flex items-center gap-2">
              <ShoppingBag size={12} />
              Return to Bag
           </Link>
           <span className="text-[10px] font-black text-stone-400 uppercase tracking-[0.3em]">Phase {step}/{steps.length}</span>
        </div>

        {/* Progress Bar Container */}
        <div className="mb-10 h-1.5 w-full bg-stone-200 rounded-full overflow-hidden">
          <motion.div 
            className="h-full bg-stone-900"
            initial={{ width: 0 }}
            animate={{ width: `${(step / steps.length) * 100}%` }}
            transition={{ duration: 0.8, ease: "circOut" }}
          />
        </div>

        <motion.div 
          layout
          className="bg-white p-6 sm:p-10 rounded-[3rem] shadow-2xl shadow-stone-200 border border-stone-100"
        >
           {renderStep()}
        </motion.div>
        
        <div className="mt-8 text-center">
           <p className="text-[10px] font-black text-stone-300 uppercase tracking-[0.5em] flex items-center justify-center gap-2">
              <CreditCard size={12} />
              Secured by 256-bit encryption
           </p>
        </div>
      </div>
    </div>
  );
}

