import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User, Mail, Phone, MapPin, ShoppingBag, Shield, HelpCircle, 
  ChevronRight, Camera, LogOut, Settings, Bell, CreditCard, 
  History, Wallet, Info, MessageSquare, ExternalLink, Activity, Globe, Plus, X,
  Heart, CheckCircle, Package, Truck, Home, Star, RefreshCw, Clock, Download, Trash2
} from 'lucide-react';
import { useStore } from '../StoreContext';
import { useNavigate, Link } from 'react-router-dom';
import { QRCodeCanvas } from 'qrcode.react';
import toast from 'react-hot-toast';
import { cn, Product } from '../types';
import { useEffect } from 'react';
import WholesaleInsights from '../components/WholesaleInsights';

export default function Profile() {
  const { 
    user, 
    logout, 
    updateProfile, 
    vibration, 
    setVibration, 
    config, 
    wishlist, 
    toggleWishlist, 
    subscribeNewsletter,
    addresses, deleteAddress, setDefaultAddress, saveAddress,
    simulatedRole, t
  } = useStore();
  const navigate = useNavigate();
  const activeRole = simulatedRole || user?.role;
  const [isEditing, setIsEditing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeProfileTab, setActiveProfileTab] = useState<'history' | 'wishlist' | 'wallet' | 'insights' | 'addresses'>('history');
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [editingAddress, setEditingAddress] = useState<any>(null);
  const [deliveryAreas, setDeliveryAreas] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/delivery-areas')
      .then(res => res.json())
      .then(setDeliveryAreas)
      .catch(console.error);
  }, []);

  const upiId = config.find(c => c.key === 'upi_id')?.value || 'hindstore@upi';
  const upiName = config.find(c => c.key === 'upi_name')?.value || 'Hind General Store';
  const upiQr = config.find(c => c.key === 'upi_qr')?.value;
  
  const bankName = config.find(c => c.key === 'bank_name')?.value;
  const bankHolder = config.find(c => c.key === 'account_holder')?.value;
  const bankAccount = config.find(c => c.key === 'account_number')?.value;
  const bankIfsc = config.find(c => c.key === 'ifsc_code')?.value;

  const [formData, setFormData] = useState({
    name: user?.name || '',
    username: user?.username || '',
    email: user?.email || '',
    shop_name: user?.shop_name || '',
    pin_code: user?.pin_code || '',
    street_address: (user as any)?.street_address || '',
    city: (user as any)?.city || '',
    state: (user as any)?.state || '',
    zip_code: (user as any)?.zip_code || '',
    address: user?.address || '',
    profile_photo: user?.profile_photo || '',
    phone: user?.phone || ''
  });

  const [orders, setOrders] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  const fetchOrders = async () => {
    if (!user) return;
    setLoadingOrders(true);
    try {
      const res = await fetch(`/api/orders/user/${user.id}`);
      const data = await res.json();
      setOrders(data);
    } catch (err) {
      console.error('Failed to fetch orders');
    } finally {
      setLoadingOrders(false);
    }
  };

  const [walletHistory, setWalletHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const fetchWalletHistory = async () => {
    if (!user) return;
    setLoadingHistory(true);
    try {
      const res = await fetch(`/api/wallet-history/${user.id}`);
      const data = await res.json();
      setWalletHistory(data);
    } catch (err) {
      console.error('Failed to fetch wallet history');
    } finally {
      setLoadingHistory(false);
    }
  };

  const [showAddMoney, setShowAddMoney] = useState(false);
  const [addAmount, setAddAmount] = useState('');
  const [paymentId, setPaymentId] = useState('');
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState<{ open: boolean; orderId: number | null }>({ open: false, orderId: null });
  const [showReturnModal, setShowReturnModal] = useState<{ open: boolean; orderId: number | null; orderItems: any[] }>({ open: false, orderId: null, orderItems: [] });
  const [returnProductId, setReturnProductId] = useState<number | null>(null);
  const [returnQuantity, setReturnQuantity] = useState<number>(1);
  const [returnReason, setReturnReason] = useState('');
  const [reviewRating, setReviewRating] = useState(5);

  const openReturnModal = async (orderId: number) => {
    try {
      const res = await fetch(`/api/orders/${orderId}`);
      if (res.ok) {
        const orderData = await res.json();
        setShowReturnModal({ open: true, orderId: orderData.id, orderItems: orderData.items });
        if (orderData.items && orderData.items.length > 0) {
            setReturnProductId(orderData.items[0].product_id);
            setReturnQuantity(1);
        }
      } else {
        toast.error('Failed to load order items for return');
      }
    } catch(err) {
      toast.error('Failed to load order details');
    }
  };

  const handleReturnSubmit = async () => {
    if (!returnProductId) { toast.error('Please select a product to return'); return; }
    if (!returnReason.trim()) { toast.error('Please provide a reason'); return; }
    
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/orders/${showReturnModal.orderId}/return`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: returnProductId,
          quantity: returnQuantity,
          reason: returnReason
        })
      });
      if (res.ok) {
        toast.success('Return initiated! Admin will review your request.');
        setShowReturnModal({ open: false, orderId: null, orderItems: [] });
        setReturnReason('');
      } else {
         const data = await res.json();
         toast.error(data.message || 'Failed to initiate return');
      }
    } catch(err) {
      toast.error('Failed to initiate return');
    } finally {
      setIsSubmitting(false);
    }
  };
  const [reviewComment, setReviewComment] = useState('');
  const [newsletterEmail, setNewsletterEmail] = useState(user.email || '');

  const handleReviewSubmit = async () => {
    if (!reviewComment.trim()) {
      toast.error('Please enter a comment');
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id: showReviewModal.orderId,
          rating: reviewRating,
          comment: reviewComment,
          user_name: user.name
        })
      });
      if (res.ok) {
        toast.success('Review submitted successfully!');
        setShowReviewModal({ open: false, orderId: null });
        setReviewComment('');
        setReviewRating(5);
      } else {
        toast.error('Failed to submit review');
      }
    } catch (err) {
      toast.error('Error submitting review');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNewsletterSubscribe = async () => {
    if (!newsletterEmail) return;
    if (!window.confirm('Are you sure you want to subscribe to our newsletter?')) return;
    try {
      await subscribeNewsletter(newsletterEmail);
      toast.success('Subscribed to newsletter!');
    } catch (err) {
      toast.error('Subscription failed');
    }
  };
  const [wishlistProducts, setWishlistProducts] = useState<Product[]>([]);
  const [loadingWishlist, setLoadingWishlist] = useState(false);

  useEffect(() => {
    const fetchWishlistProducts = async () => {
      if (activeProfileTab === 'wishlist' && wishlist.length > 0) {
        setLoadingWishlist(true);
        try {
          const res = await fetch('/api/products');
          if (res.ok) {
            const allProducts: Product[] = await res.json();
            const filtered = allProducts.filter(p => wishlist.includes(p.id));
            setWishlistProducts(filtered);
          }
        } catch (err) {
          console.error('Failed to fetch wishlist products');
        } finally {
          setLoadingWishlist(false);
        }
      }
    };
    fetchWishlistProducts();
  }, [activeProfileTab, wishlist]);

  const handleAddMoney = async () => {
    if (!addAmount || isNaN(Number(addAmount))) {
      toast.error('Please enter a valid amount');
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/wallet/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          amount: Number(addAmount),
          paymentId,
          screenshot
        })
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message);
        setShowAddMoney(false);
        setAddAmount('');
        setPaymentId('');
        setScreenshot(null);
        fetchWalletHistory();
      } else {
        toast.error(data.message);
      }
    } catch (err) {
      toast.error('Failed to submit request');
    } finally {
      setIsSubmitting(false);
    }
  };

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

  React.useEffect(() => {
    fetchOrders();
    fetchWalletHistory();
  }, [user?.id]);

  if (!user) {
    navigate('/login');
    return null;
  }

  const handleSave = async () => {
    // Address validation
    if (formData.street_address && formData.street_address.length < 5) {
      toast.error('Street address is too short');
      return;
    }
    if (formData.zip_code || formData.pin_code) {
      const code = formData.zip_code || formData.pin_code;
      if (!/^\d{5,6}$/.test(code)) {
        toast.error('Please enter a valid 5 or 6 digit postal code');
        return;
      }
    }
    if (formData.city && formData.city.length < 2) {
      toast.error('Please enter a valid city');
      return;
    }
    if (formData.state && formData.state.length < 2) {
      toast.error('Please enter a valid state');
      return;
    }

    await updateProfile(formData);
    setIsEditing(false);
  };

  const handlePhotoUpload = (file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData({ ...formData, profile_photo: reader.result as string });
      toast.success('Photo updated locally. Click "Save Changes" to persist.');
    };
    reader.readAsDataURL(file);
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      handlePhotoUpload(file);
    }
  };

  const menuItems = [
    { icon: Wallet, label: 'My Wallet', value: `₹${user.wallet_balance}`, color: 'text-primary', id: 'wallet' },
    { 
      icon: CreditCard, 
      label: 'Khata Wallet', 
      value: user.khata_enabled ? `₹${user.khata_balance}` : 'Disabled', 
      color: user.khata_enabled ? 'text-accent' : 'text-stone-400',
      sub: user.khata_enabled ? `Limit: ₹${user.khata_limit}` : 'Contact admin to enable',
      id: 'khata'
    },
  ];

  const resourceItems = [
    ...(user.role === 'admin' ? [{ icon: Shield, label: 'Admin Dashboard', path: '/admin', color: 'text-stone-900', desc: 'Manage store, orders & users' }] : []),
    { icon: Info, label: 'Terms & Conditions', path: '/terms-and-conditions', desc: 'Read our usage terms' },
    { icon: Shield, label: 'Privacy Policy', path: '/privacy-policy', desc: 'How we handle your data' },
    { icon: HelpCircle, label: 'Help & Support', path: '/support', desc: 'Get assistance' },
    { icon: MessageSquare, label: 'Contact Us', path: '/contact', desc: 'Reach out to us' },
    { icon: Truck, label: 'Track Order', path: '/track-order', desc: 'Check delivery status', color: 'text-primary' },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Profile Header */}
      <div className="bg-white rounded-3xl p-8 shadow-sm border border-stone-100 mb-6">
        <div className="flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-8">
          <div className="relative group">
            <div 
              className="w-32 h-32 rounded-full bg-stone-100 border-4 border-white shadow-lg overflow-hidden flex items-center justify-center cursor-pointer transition-all hover:bg-stone-200"
              onDragOver={onDragOver}
              onDrop={onDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              {formData.profile_photo ? (
                <img src={formData.profile_photo} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-4xl font-black text-primary uppercase">{user?.name?.[0] || 'U'}</span>
              )}
            </div>
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-0 right-0 p-2 bg-primary text-white rounded-full shadow-lg hover:scale-110 transition-transform"
            >
              <Camera size={18} />
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*" 
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handlePhotoUpload(file);
              }} 
            />
          </div>

          <div className="flex-1 text-center md:text-left">
            <h1 className="text-3xl font-bold text-stone-900">{user.name}</h1>
            <p className="text-stone-500 font-medium">@{user.username || 'no_username'}</p>
            <div className="flex flex-wrap justify-center md:justify-start gap-2 mt-3">
              <span className="px-3 py-1 bg-primary/10 text-primary text-xs font-bold rounded-full uppercase tracking-wider">
                {user.role}
              </span>
              <span className="px-3 py-1 bg-stone-100 text-stone-600 text-xs font-bold rounded-full uppercase tracking-wider">
                {user.segment}
              </span>
            </div>
          </div>

          <div className="flex space-x-3">
            <button 
              onClick={() => setIsEditing(!isEditing)}
              className="px-6 py-2 border border-stone-200 rounded-xl font-bold hover:bg-stone-50 transition-colors"
            >
              {isEditing ? 'Cancel' : 'Edit Profile'}
            </button>
          </div>
        </div>

        {isEditing && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mt-8 pt-8 border-t border-stone-100 grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-stone-700 mb-1">Full Name</label>
                <input 
                  type="text" 
                  className="input-field" 
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-stone-700 mb-1">Username</label>
                <input 
                  type="text" 
                  className="input-field" 
                  value={formData.username}
                  onChange={(e) => setFormData({...formData, username: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-stone-700 mb-1">Email Address</label>
                <input 
                  type="email" 
                  className="input-field" 
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-stone-700 mb-1">Phone Number</label>
                <input 
                  type="text" 
                  className="input-field" 
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                />
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-stone-700 mb-1">Shop Name</label>
                <input 
                  type="text" 
                  className="input-field" 
                  value={formData.shop_name}
                  onChange={(e) => setFormData({...formData, shop_name: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-stone-700 mb-1">Street Address</label>
                <input 
                  type="text" 
                  className="input-field" 
                  value={formData.street_address}
                  onChange={(e) => setFormData({...formData, street_address: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-stone-700 mb-1">City</label>
                  <input 
                    type="text" 
                    className="input-field" 
                    value={formData.city}
                    onChange={(e) => setFormData({...formData, city: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-stone-700 mb-1">State</label>
                  <input 
                    type="text" 
                    className="input-field" 
                    value={formData.state}
                    onChange={(e) => setFormData({...formData, state: e.target.value})}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-stone-700 mb-1">Zip Code</label>
                  <input 
                    type="text" 
                    className="input-field" 
                    value={formData.zip_code}
                    onChange={(e) => setFormData({...formData, zip_code: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-stone-700 mb-1">Pin Code</label>
                  <input 
                    type="text" 
                    className="input-field" 
                    value={formData.pin_code}
                    onChange={(e) => setFormData({...formData, pin_code: e.target.value})}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-stone-700 mb-1">Full Address (Optional)</label>
                <textarea 
                  className="input-field min-h-[80px]" 
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                />
              </div>
            </div>
            <div className="md:col-span-2 flex justify-end">
              <button 
                onClick={handleSave}
                className="btn-primary px-12"
              >
                Save Changes
              </button>
            </div>
          </motion.div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="md:col-span-2 space-y-6">
          {/* Tabs for Profile Sections */}
          <div className="flex p-1 bg-stone-100 rounded-2xl">
            {[
              { id: 'history', label: 'Orders', icon: ShoppingBag },
              { id: 'wishlist', label: 'Wishlist', icon: Heart },
              { id: 'addresses', label: 'Addresses', icon: Home },
              ...(activeRole === 'wholesaler' || activeRole === 'retailer' ? [{ id: 'insights', label: 'Insights', icon: Activity }] : []),
              { id: 'wallet', label: 'Wallet', icon: Wallet },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveProfileTab(tab.id as any)}
                className={cn(
                  "flex-1 flex items-center justify-center space-x-2 py-3 rounded-xl text-sm font-bold transition-all",
                  activeProfileTab === tab.id 
                    ? "bg-white text-primary shadow-sm" 
                    : "text-stone-500 hover:text-stone-700"
                )}
              >
                <tab.icon size={16} />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <AnimatePresence mode="wait">
            {activeProfileTab === 'insights' && (activeRole === 'wholesaler' || activeRole === 'retailer') && (
              <WholesaleInsights key="insights" />
            )}
            {activeProfileTab === 'addresses' && (
              <motion.div 
                key="addresses"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                <div className="bg-white rounded-3xl shadow-sm border border-stone-100 overflow-hidden">
                  <div className="p-6 border-b border-stone-100 flex justify-between items-center bg-stone-50/50">
                    <div>
                      <h3 className="font-bold text-lg">{t('manage_addresses')}</h3>
                      <p className="text-xs text-stone-400">Save your multiple delivery locations</p>
                    </div>
                    <button 
                      onClick={() => {
                        setEditingAddress(null);
                        setShowAddressModal(true);
                      }}
                      className="btn-primary py-2 px-4 text-xs flex items-center space-x-2"
                    >
                      <Plus size={14} />
                      <span>{t('add_new_address')}</span>
                    </button>
                  </div>
                  
                  <div className="p-6">
                    {addresses.length === 0 ? (
                      <div className="py-12 text-center space-y-4">
                        <div className="w-16 h-16 bg-stone-50 text-stone-300 rounded-full flex items-center justify-center mx-auto">
                          <Home size={32} />
                        </div>
                        <p className="text-stone-400 italic">{t('no_addresses_found')}</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 gap-4">
                        {addresses.map((addr) => (
                          <div 
                            key={addr.id} 
                            className={cn(
                              "relative p-6 rounded-2xl border-2 transition-all",
                              addr.is_default ? "border-primary bg-primary/5" : "border-stone-100 hover:border-stone-200"
                            )}
                          >
                            <div className="flex justify-between items-start">
                              <div className="space-y-1">
                                <div className="flex items-center space-x-2">
                                  <span className="font-black text-stone-900">{addr.name}</span>
                                  {addr.is_default && (
                                    <span className="bg-primary text-white text-[8px] font-bold uppercase px-2 py-0.5 rounded-full">Default</span>
                                  )}
                                </div>
                                <p className="text-sm text-stone-600">{addr.phone}</p>
                                <p className="text-sm text-stone-500 mt-2 leading-relaxed">
                                  {addr.address}, {addr.city}, {addr.state} - {addr.pin_code}
                                </p>
                                <div className="mt-2 text-[10px] font-bold text-primary uppercase tracking-widest bg-white px-3 py-1 rounded-full border border-primary/20 inline-block">
                                  Zone: {addr.delivery_area}
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                <button 
                                  onClick={() => {
                                    setEditingAddress(addr);
                                    setShowAddressModal(true);
                                  }}
                                  className="p-2 text-stone-400 hover:text-primary transition-colors hover:bg-white rounded-lg border border-transparent hover:border-stone-100"
                                >
                                  <Settings size={16} />
                                </button>
                                <button 
                                  onClick={() => {
                                    if(window.confirm('Delete this address?')) deleteAddress(addr.id);
                                  }}
                                  className="p-2 text-stone-400 hover:text-red-500 transition-colors hover:bg-white rounded-lg border border-transparent hover:border-stone-100"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </div>
                            {!addr.is_default && (
                              <button 
                                onClick={() => setDefaultAddress(addr.id)}
                                className="mt-4 text-[10px] font-bold text-stone-400 hover:text-primary uppercase tracking-widest transition-colors"
                              >
                                {t('set_as_default')}
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
            {activeProfileTab === 'history' && (
              <motion.div 
                key="history"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-white rounded-3xl shadow-sm border border-stone-100 overflow-hidden"
              >
                <div className="p-6 border-b border-stone-100 flex justify-between items-center">
                  <div>
                    <h3 className="font-bold text-lg">Order History</h3>
                    <p className="text-xs text-stone-400">Track and manage your orders</p>
                  </div>
                  <History size={20} className="text-stone-300" />
                </div>
                <div className="divide-y divide-stone-50">
                  {loadingOrders ? (
                    <div className="p-12 text-center text-stone-400">Loading orders...</div>
                  ) : orders.length === 0 ? (
                    <div className="p-12 text-center text-stone-400 italic">No orders found yet.</div>
                  ) : (
                    orders.map((order) => (
                      <div key={order.id} className="p-6 hover:bg-stone-50 transition-colors">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <p className="font-bold text-stone-900">Order #ORD-{order.id}</p>
                            <p className="text-xs text-stone-400">{new Date(order.created_at).toLocaleDateString()}</p>
                          </div>
                          <div className="flex flex-col items-end space-y-1">
                            <p className="font-bold text-primary">₹{order.total}</p>
                            <span className={cn(
                              "text-[10px] font-bold px-2 py-1 rounded-full uppercase",
                              order.status === 'delivered' ? 'bg-accent/10 text-accent' : 
                              order.status === 'cancelled' ? 'bg-red-50 text-red-600' : 
                              order.status === 'failed' ? 'bg-stone-900 text-white' : 'bg-primary/10 text-primary'
                            )}>
                              {order.status}
                            </span>
                          </div>
                        </div>

                        {/* Order Tracking Timeline */}
                        <div className="mb-6 p-4 bg-stone-50 rounded-2xl border border-stone-100">
                          {order.status === 'shipped' && order.estimated_delivery_at && (
                            <div className="mb-4 flex items-center justify-between p-3 bg-primary/5 border border-primary/10 rounded-xl">
                              <div className="flex items-center space-x-2">
                                <Clock size={16} className="text-primary animate-pulse" />
                                <span className="text-xs font-bold text-primary">Est. Arrival: {new Date(order.estimated_delivery_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                              </div>
                              {order.last_status_update && (
                                <span className="text-[10px] bg-white px-2 py-0.5 rounded-full border border-stone-100 shadow-sm text-stone-500 font-medium italic">
                                  "{order.last_status_update}"
                                </span>
                              )}
                            </div>
                          )}
                          {(order.status === 'cancelled' || order.status === 'failed') && order.rejection_reason && (
                            <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-xl">
                              <p className="text-[10px] font-black text-red-600 uppercase tracking-widest mb-1">Reason for {order.status === 'cancelled' ? 'Cancellation' : 'Failure'}</p>
                              <p className="text-xs text-red-700 font-medium">{order.rejection_reason}</p>
                            </div>
                          )}
                          <div className="relative">
                            <div className="flex justify-between relative z-10">
                              {[
                                { id: 'pending', label: 'Placed', icon: CheckCircle },
                                { id: 'processing', label: 'Packed', icon: Package },
                                { id: 'shipped', label: 'Shipped', icon: Truck },
                                { id: 'delivered', label: 'Delivered', icon: Home },
                              ].map((step, i) => {
                                const statuses = ['pending', 'processing', 'shipped', 'delivered'];
                                const currentIndex = statuses.indexOf(order.status);
                                const isActive = i <= currentIndex;
                                const isCurrent = i === currentIndex;
                                const Icon = step.icon;
                                
                                return (
                                  <div key={step.id} className="flex flex-col items-center">
                                    <div className={`
                                      w-8 h-8 rounded-full flex items-center justify-center transition-all duration-500 border-2
                                      ${isActive ? 'bg-primary border-primary text-white' : 'bg-white border-stone-200 text-stone-300'}
                                      ${isCurrent ? 'ring-4 ring-primary/20' : ''}
                                    `}>
                                      <Icon size={14} />
                                    </div>
                                    <span className={`
                                      text-[8px] font-bold mt-2 uppercase tracking-tight
                                      ${isActive ? 'text-primary' : 'text-stone-400'}
                                    `}>
                                      {step.label}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                            <div className="absolute top-[15px] left-6 right-6 h-[1.5px] bg-stone-200 -z-0">
                              <div 
                                className="h-full bg-primary transition-all duration-1000 ease-out" 
                                style={{ width: `${(Math.max(0, ['pending', 'processing', 'shipped', 'delivered'].indexOf(order.status)) / 3) * 100}%` }}
                              />
                            </div>
                          </div>
                        </div>

                        <div className="flex justify-between items-center">
                          <p className="text-sm font-bold text-primary">₹{order.total}</p>
                          <div className="flex items-center space-x-4">
                            {order.status === 'delivered' && (
                              <>
                                <button 
                                  onClick={() => setShowReviewModal({ open: true, orderId: order.id })}
                                  className="text-xs font-bold text-primary hover:underline flex items-center space-x-1"
                                >
                                  <Star size={12} />
                                  <span>Review</span>
                                </button>
                                <button 
                                  onClick={() => openReturnModal(order.id)}
                                  className="text-xs font-bold text-stone-500 hover:text-red-500 transition-colors flex items-center space-x-1 ml-4"
                                >
                                  <RefreshCw size={12} />
                                  <span>Return</span>
                                </button>
                              </>
                            )}
                            <Link to={`/invoice/${order.id}`} className="text-xs font-bold text-stone-400 hover:text-primary transition-colors flex items-center space-x-1 ml-4">
                              <span>Invoice</span>
                              <ExternalLink size={12} />
                            </Link>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            )}

            {activeProfileTab === 'wishlist' && (
              <motion.div 
                key="wishlist"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-white rounded-3xl shadow-sm border border-stone-100 overflow-hidden"
              >
                <div className="p-6 border-b border-stone-100 flex justify-between items-center">
                  <div>
                    <h3 className="font-bold text-lg">My Wishlist</h3>
                    <p className="text-xs text-stone-400">Products you've saved for later</p>
                  </div>
                  <Heart size={20} className="text-stone-300" />
                </div>
                <div className="p-6">
                  {loadingWishlist ? (
                    <div className="py-12 text-center text-stone-400 italic">Loading wishlist...</div>
                  ) : wishlistProducts.length === 0 ? (
                    <div className="py-12 text-center text-stone-400 italic">Your wishlist is empty.</div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {wishlistProducts.map((product) => (
                        <div key={product.id} className="flex items-center space-x-4 p-4 bg-stone-50 rounded-2xl border border-stone-100 group hover:border-primary transition-colors">
                          <img 
                            src={product.image} 
                            alt={product.name} 
                            className="w-16 h-16 object-cover rounded-xl"
                            referrerPolicy="no-referrer"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-stone-900 truncate">{product.name}</p>
                            <p className="text-sm font-black text-primary">₹{product.price}</p>
                          </div>
                          <div className="flex flex-col space-y-2">
                            <button 
                              onClick={() => toggleWishlist(product.id)}
                              className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <X size={16} />
                            </button>
                            <Link 
                              to={`/product/${product.id}`}
                              className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors"
                            >
                              <ExternalLink size={16} />
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {activeProfileTab === 'wallet' && (
              <motion.div 
                key="wallet"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                {/* Wallet Balance Card */}
                <div className="bg-stone-900 text-white p-8 rounded-3xl shadow-xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-8 opacity-10">
                    <Wallet size={120} />
                  </div>
                  <div className="relative z-10">
                    <p className="text-stone-400 text-xs font-bold uppercase tracking-widest mb-2">Available Balance</p>
                    <h2 className="text-5xl font-black mb-6">₹{user.wallet_balance}</h2>
                    <button 
                      onClick={() => setShowAddMoney(true)}
                      className="bg-white text-stone-900 px-8 py-3 rounded-2xl font-bold flex items-center space-x-2 hover:bg-primary hover:text-white transition-all"
                    >
                      <Plus size={20} />
                      <span>Add Money</span>
                    </button>
                  </div>
                </div>

                {/* Wallet History */}
                <div className="bg-white rounded-3xl shadow-sm border border-stone-100 overflow-hidden">
                  <div className="p-6 border-b border-stone-100 flex justify-between items-center bg-stone-50/50">
                    <div>
                      <h3 className="font-bold text-lg">Detailed Transaction History</h3>
                      <p className="text-xs text-stone-400">Track every penny spent and credited</p>
                    </div>
                    <div className="flex items-center space-x-2">
                       <button 
                        onClick={fetchWalletHistory} 
                        className="p-2 text-stone-400 hover:text-primary transition-colors bg-white rounded-xl border border-stone-100 shadow-sm"
                        disabled={loadingHistory}
                       >
                         <RefreshCw size={16} className={loadingHistory ? "animate-spin" : ""} />
                       </button>
                    </div>
                  </div>
                  
                  <div className="divide-y divide-stone-50">
                    {loadingHistory ? (
                      <div className="p-12 text-center">
                         <div className="flex justify-center mb-4">
                           <RefreshCw size={32} className="text-primary animate-spin" />
                         </div>
                         <p className="text-sm font-bold text-stone-400">Fetching history...</p>
                      </div>
                    ) : walletHistory.length === 0 ? (
                      <div className="p-12 text-center py-20">
                         <div className="w-16 h-16 bg-stone-50 text-stone-300 rounded-full flex items-center justify-center mx-auto mb-4">
                           <History size={32} />
                         </div>
                         <p className="text-stone-400 font-bold italic">No transactions recorded yet.</p>
                         <p className="text-[10px] text-stone-300 uppercase tracking-widest mt-1">Add money or place orders to see history</p>
                      </div>
                    ) : (
                      walletHistory.map((tx) => (
                        <div key={tx.id} className="p-6 hover:bg-stone-50 transition-all group border-l-4 border-transparent hover:border-primary">
                          <div className="flex justify-between items-center">
                            <div className="flex items-center space-x-5">
                              <div className={cn(
                                "w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110",
                                tx.type === 'credit' ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-red-50 text-red-600 border border-red-100"
                              )}>
                                {tx.type === 'credit' ? <Plus size={20} /> : <X size={20} />}
                              </div>
                              <div>
                                <p className="font-black text-stone-900 group-hover:text-primary transition-colors">{tx.description}</p>
                                <div className="flex items-center space-x-2 mt-1">
                                  <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">{new Date(tx.created_at).toLocaleDateString()}</span>
                                  <span className="text-[10px] text-stone-200">•</span>
                                  <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">{new Date(tx.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className={cn(
                                "text-lg font-black tracking-tight",
                                tx.type === 'credit' ? "text-emerald-600" : "text-red-600"
                              )}>
                                {tx.type === 'credit' ? '+' : '-'}₹{tx.amount}
                              </p>
                              <div className="flex flex-col items-end gap-1 mt-1">
                                {tx.transaction_id && (
                                  <p className="text-[8px] font-black text-stone-400 uppercase tracking-widest">ID: {tx.transaction_id}</p>
                                )}
                                <span className={cn(
                                  "px-2 py-0.5 rounded-full text-[8px] font-black uppercase border",
                                  tx.status === 'approved' ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                                  tx.status === 'pending' ? "bg-amber-50 text-amber-600 border-amber-100" : 
                                  "bg-red-50 text-red-600 border-red-100"
                                )}>
                                  {tx.status || 'approved'}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  {walletHistory.length > 5 && (
                    <div className="p-4 bg-stone-50 text-center border-t border-stone-100">
                       <p className="text-[10px] font-black text-stone-400 uppercase tracking-[0.2em]">End of History</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Newsletter Section */}
          <div className="bg-primary/5 rounded-3xl p-8 border border-primary/10">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="text-center md:text-left">
                <h3 className="text-xl font-black text-primary mb-2">Join the Hind Store Community</h3>
                <p className="text-sm text-stone-600">Get exclusive offers, new arrivals and shopping tips directly in your inbox.</p>
              </div>
              <div className="flex w-full md:w-auto bg-white p-1.5 rounded-2xl shadow-sm border border-stone-100">
                <input 
                  type="email" 
                  placeholder="Your email address"
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  className="flex-1 px-4 py-2 text-sm outline-none bg-transparent"
                />
                <button 
                  onClick={handleNewsletterSubscribe}
                  className="bg-primary text-white px-6 py-2 rounded-xl font-bold text-sm hover:bg-primary/90 transition-colors"
                >
                  Subscribe
                </button>
              </div>
            </div>
          </div>

          {/* Dedicated Resources & Access Section */}
          <div className="bg-white rounded-3xl shadow-sm border border-stone-100 overflow-hidden">
            <div className="p-6 border-b border-stone-100">
              <h3 className="font-bold text-lg">Resources & Access</h3>
              <p className="text-xs text-stone-400">Important links and administrative tools</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-stone-50">
              {resourceItems.map((item, idx) => (
                <Link 
                  key={idx} 
                  to={item.path}
                  className="flex items-center justify-between p-6 hover:bg-stone-50 transition-colors group"
                >
                  <div className="flex items-center space-x-4">
                    <div className={cn("p-3 rounded-2xl bg-stone-100 group-hover:bg-primary/10 transition-colors", item.color || "text-stone-500 group-hover:text-primary")}>
                      <item.icon size={20} />
                    </div>
                    <div>
                      <p className="font-bold text-stone-700">{item.label}</p>
                      <p className="text-[10px] text-stone-400 font-medium">{item.desc}</p>
                    </div>
                  </div>
                  <ChevronRight size={18} className="text-stone-300 group-hover:text-primary transition-colors" />
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Settings & Sidebar */}
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-stone-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-stone-100 bg-stone-50/50">
              <h3 className="font-bold text-lg flex items-center space-x-2">
                <Settings size={20} className="text-primary" />
                <span>App Settings</span>
              </h3>
              <p className="text-[10px] text-stone-400 font-medium uppercase tracking-wider mt-1">Customize your experience</p>
            </div>
            
            <div className="divide-y divide-stone-50">
              <SettingToggle 
                icon={Bell} 
                label="Push Notifications" 
                desc="Order status & offers" 
                enabled={useStore().notifications} 
                onToggle={() => useStore().setNotifications(!useStore().notifications)} 
                color="text-blue-500"
              />
              <SettingToggle 
                icon={Activity} 
                label="Haptic Feedback" 
                desc="Vibrate on interactions" 
                enabled={useStore().vibration} 
                onToggle={() => useStore().setVibration(!useStore().vibration)} 
                color="text-emerald-500"
              />
              <SettingToggle 
                icon={MessageSquare} 
                label="Sound Effects" 
                desc="Play sounds on actions" 
                enabled={useStore().sound} 
                onToggle={() => useStore().setSound(!useStore().sound)} 
                color="text-purple-500"
              />
              
              <div className="p-6 hover:bg-stone-50 transition-colors cursor-pointer group">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-stone-100 rounded-2xl text-stone-500 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                      <Globe size={20} />
                    </div>
                    <div>
                      <p className="font-bold text-stone-700">Language</p>
                      <p className="text-[10px] text-stone-400 font-medium">English (Default)</p>
                    </div>
                  </div>
                  <ChevronRight size={18} className="text-stone-300 group-hover:text-primary transition-colors" />
                </div>
              </div>

              <div className="p-6 hover:bg-stone-50 transition-colors cursor-pointer group">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-stone-100 rounded-2xl text-stone-500 group-hover:bg-red-50 group-hover:text-red-500 transition-colors">
                      <History size={20} />
                    </div>
                    <div>
                      <p className="font-bold text-stone-700">Clear Cache</p>
                      <p className="text-[10px] text-stone-400 font-medium">Free up local storage</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => toast.success('Cache cleared')}
                    className="text-[10px] font-bold text-stone-400 hover:text-red-500 uppercase tracking-wider"
                  >
                    Clear
                  </button>
                </div>
              </div>
            </div>
          </div>

          <button 
            onClick={logout}
            className="w-full p-6 bg-red-50 text-red-600 rounded-3xl font-bold flex items-center justify-center space-x-3 hover:bg-red-100 transition-colors border border-red-100"
          >
            <LogOut size={20} />
            <span>Logout Account</span>
          </button>

          {/* Privacy & Data Section */}
          <div className="bg-white rounded-3xl border border-stone-100 shadow-sm overflow-hidden mt-6">
            <div className="p-6 border-b border-stone-100 bg-stone-50/50">
              <h3 className="font-bold text-lg flex items-center space-x-2">
                <Shield size={20} className="text-emerald-600" />
                <span>Privacy & Data</span>
              </h3>
              <p className="text-[10px] text-stone-400 font-medium uppercase tracking-wider mt-1">Manage your personal information</p>
            </div>
            <div className="divide-y divide-stone-50">
              <div 
                onClick={() => {
                  const data = JSON.stringify({ user, orders, walletHistory }, null, 2);
                  const blob = new Blob([data], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const link = document.createElement('a');
                  link.href = url;
                  link.download = `my_data_${user.name.replace(/\s+/g, '_')}.json`;
                  link.click();
                  toast.success('Your data has been compiled and downloaded.');
                }}
                className="p-6 hover:bg-stone-50 transition-colors cursor-pointer group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-stone-100 rounded-2xl text-stone-500 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                      <Download size={20} />
                    </div>
                    <div>
                      <p className="font-bold text-stone-700">Export My Data</p>
                      <p className="text-[10px] text-stone-400 font-medium">Download all your profile and history data</p>
                    </div>
                  </div>
                  <ChevronRight size={18} className="text-stone-300 group-hover:text-primary transition-colors" />
                </div>
              </div>
              <div 
                onClick={() => {
                  if (window.confirm('Are you absolutely sure? This will send a request to our administrators to permanently delete your account and all associated data.')) {
                    toast.success('Deletion request sent to administrators. We will process this within 48 hours.');
                  }
                }}
                className="p-6 hover:bg-stone-50 transition-colors cursor-pointer group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-stone-100 rounded-2xl text-stone-500 group-hover:bg-red-50 group-hover:text-red-600 transition-colors">
                      <Trash2 size={20} />
                    </div>
                    <div>
                      <p className="font-bold text-stone-700">Request Data Deletion</p>
                      <p className="text-[10px] text-stone-400 font-medium">Permanently remove your account and data</p>
                    </div>
                  </div>
                  <ChevronRight size={18} className="text-stone-300 group-hover:text-red-600 transition-colors" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Money Modal */}
      {showAddMoney && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white p-8 rounded-3xl shadow-2xl max-w-md w-full space-y-6"
          >
            <div className="flex justify-between items-center">
              <h3 className="text-2xl font-bold">Add Money to Wallet</h3>
              <button onClick={() => setShowAddMoney(false)} className="p-2 hover:bg-stone-100 rounded-full">
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 no-scrollbar">
              <div className="bg-primary/5 p-6 rounded-3xl border border-primary/10 text-center">
                <p className="text-xs font-black text-primary uppercase tracking-[0.2em] mb-4">Official Payment QR</p>
                <div className="w-56 h-56 bg-white mx-auto rounded-3xl border-4 border-white shadow-xl flex items-center justify-center mb-4 transition-transform hover:scale-105 overflow-hidden">
                  <QRCodeCanvas 
                    value={`upi://pay?pa=${upiId}&pn=${encodeURIComponent(upiName)}&am=0&cu=INR`}
                    size={200}
                    level="H"
                    includeMargin={false}
                    fgColor="#0c0a09"
                    imageSettings={{
                      src: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 40'%3E%3Crect width='40' height='40' rx='12' fill='%23ea580c'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='white' font-family='sans-serif' font-weight='900' font-size='22'%3EH%3C/text%3E%3C/svg%3E",
                      height: 44,
                      width: 44,
                      excavate: true,
                    }}
                  />
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] text-stone-900 font-black uppercase tracking-widest">{upiName}</p>
                  <p className="text-[10px] text-stone-400 font-bold uppercase tracking-tighter">Scan with any UPI App</p>
                </div>
              </div>

              {bankName && (
                <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200">
                  <p className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-2">Bank Transfer Details</p>
                  <div className="space-y-1 text-xs">
                    <p><span className="text-stone-400">Bank:</span> <span className="font-bold">{bankName}</span></p>
                    <p><span className="text-stone-400">Holder:</span> <span className="font-bold">{bankHolder}</span></p>
                    <p><span className="text-stone-400">A/C No:</span> <span className="font-bold font-mono">{bankAccount}</span></p>
                    <p><span className="text-stone-400">IFSC:</span> <span className="font-bold font-mono">{bankIfsc}</span></p>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-xs font-bold text-stone-400 uppercase tracking-wider">Amount to Add (₹)</label>
                <input 
                  type="number" 
                  placeholder="Enter amount"
                  className="input-field text-xl font-bold"
                  value={addAmount}
                  onChange={(e) => setAddAmount(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-stone-400 uppercase tracking-wider">Transaction ID / UTR</label>
                <input 
                  type="text" 
                  placeholder="Enter 12-digit UTR"
                  className="input-field"
                  value={paymentId}
                  onChange={(e) => setPaymentId(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-stone-400 uppercase tracking-wider">Upload Screenshot</label>
                <div className="relative">
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={handleScreenshotUpload}
                    className="hidden" 
                    id="wallet-screenshot"
                  />
                  <label 
                    htmlFor="wallet-screenshot"
                    className="flex items-center justify-center space-x-2 w-full py-3 border-2 border-dashed border-stone-200 rounded-xl cursor-pointer hover:border-primary transition-all"
                  >
                    <Camera size={18} className="text-stone-400" />
                    <span className="text-sm font-bold text-stone-500">{screenshot ? 'Screenshot Selected' : 'Choose Image'}</span>
                  </label>
                </div>
                {screenshot && (
                  <div className="mt-2 relative w-20 h-20 rounded-lg overflow-hidden border border-stone-200">
                    <img src={screenshot} alt="Preview" className="w-full h-full object-cover" />
                    <button onClick={() => setScreenshot(null)} className="absolute top-0 right-0 p-1 bg-red-500 text-white rounded-bl-lg">
                      <X size={12} />
                    </button>
                  </div>
                )}
              </div>
            </div>

            <button 
              onClick={handleAddMoney}
              disabled={isSubmitting || !addAmount || !paymentId}
              className="w-full btn-primary py-4 text-lg shadow-xl shadow-primary/20 disabled:opacity-50"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Request'}
            </button>
            <p className="text-[10px] text-stone-400 text-center">Balance will be updated within 2-4 hours after verification.</p>
          </motion.div>
        </div>
      )}

      {/* Review Modal */}
      <AnimatePresence>
        {showReviewModal.open && (
           <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white w-full max-w-md rounded-3xl overflow-hidden shadow-2xl"
            >
              <div className="p-6 border-b border-stone-100 flex justify-between items-center bg-stone-50">
                <h3 className="font-bold text-lg">Review Order #ORD-{showReviewModal.orderId}</h3>
                <button onClick={() => setShowReviewModal({ open: false, orderId: null })} className="p-2 hover:bg-stone-200 rounded-xl transition-colors">
                  <X size={20} />
                </button>
              </div>
              <div className="p-6 space-y-6">
                <div>
                  <label className="block text-xs font-bold text-stone-400 uppercase tracking-widest mb-3">Rating</label>
                  <div className="flex space-x-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button 
                        key={star}
                        onClick={() => setReviewRating(star)}
                        className={cn(
                          "p-2 rounded-xl transition-all",
                          reviewRating >= star ? "text-amber-400 bg-amber-50" : "text-stone-300 bg-stone-50"
                        )}
                      >
                        <Star size={24} fill={reviewRating >= star ? "currentColor" : "none"} />
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-400 uppercase tracking-widest mb-2">Your Feedback</label>
                  <textarea 
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder="Tell us about your experience with this order..."
                    className="w-full px-4 py-3 bg-stone-50 border border-stone-100 rounded-2xl outline-none focus:border-primary transition-colors min-h-[120px] resize-none"
                  />
                </div>
                <button 
                  onClick={handleReviewSubmit}
                  disabled={isSubmitting}
                  className="w-full bg-primary text-white py-4 rounded-2xl font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Review'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Return Modal */}
      <AnimatePresence>
        {showReturnModal.open && (
           <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white w-full max-w-md rounded-3xl overflow-hidden shadow-2xl"
            >
              <div className="p-6 border-b border-stone-100 flex justify-between items-center bg-stone-50">
                <h3 className="font-bold text-lg">Return Items - ORD-{showReturnModal.orderId}</h3>
                <button onClick={() => setShowReturnModal({ open: false, orderId: null, orderItems: [] })} className="p-2 hover:bg-stone-200 rounded-xl transition-colors">
                  <X size={20} />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-2 block">Select Product</label>
                  <select 
                    className="w-full px-4 py-3 bg-stone-50 border border-stone-100 rounded-2xl outline-none focus:border-primary transition-colors font-bold text-stone-700"
                    value={returnProductId || ''}
                    onChange={(e) => setReturnProductId(Number(e.target.value))}
                  >
                    {showReturnModal.orderItems?.map(item => (
                       <option key={item.id} value={item.product_id}>{item.product_name} x{item.quantity}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-2 block">Return Quantity</label>
                  <input 
                    type="number"
                    min="1"
                    max={showReturnModal.orderItems?.find(i => i.product_id === returnProductId)?.quantity || 1}
                    value={returnQuantity}
                    onChange={(e) => setReturnQuantity(Number(e.target.value))}
                    className="w-full px-4 py-3 bg-stone-50 border border-stone-100 rounded-2xl outline-none focus:border-primary transition-colors font-bold text-stone-700"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-2 block">Reason for Return</label>
                  <textarea 
                    value={returnReason}
                    onChange={(e) => setReturnReason(e.target.value)}
                    placeholder="Product damaged, incorrect item, etc."
                    className="w-full px-4 py-3 bg-stone-50 border border-stone-100 rounded-2xl outline-none focus:border-primary transition-colors min-h-[120px] resize-none"
                  />
                </div>

                <div className="pt-2">
                  <button 
                    onClick={handleReturnSubmit}
                    disabled={isSubmitting}
                    className="w-full bg-red-500 text-white py-4 rounded-2xl font-bold shadow-lg shadow-red-500/20 hover:bg-red-600 transition-all disabled:opacity-50"
                  >
                    {isSubmitting ? 'Submitting...' : 'Request Return'}
                  </button>
                  <p className="text-[10px] text-stone-400 mt-2 text-center">Approved returns will be automatically credited to your store wallet.</p>
                </div>
              </div>
            </motion.div>
          </div>
        )}
        {showAddressModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl"
            >
              <div className="p-6 border-b border-stone-100 flex justify-between items-center bg-stone-50/50">
                <h3 className="font-black text-xl text-stone-800">
                  {editingAddress ? t('edit_address') : t('add_new_address')}
                </h3>
                <button onClick={() => setShowAddressModal(false)} className="p-2 hover:bg-white rounded-xl transition-colors">
                  <X size={20} />
                </button>
              </div>

              <form 
                onSubmit={async (e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  const data = Object.fromEntries(formData);
                  await saveAddress({
                    ...data,
                    id: editingAddress?.id,
                    is_default: editingAddress?.is_default || false
                  } as any);
                  setShowAddressModal(false);
                }}
                className="p-6 space-y-4 max-h-[70vh] overflow-y-auto"
              >
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1.5 block">Full Name</label>
                    <input 
                      name="name"
                      required
                      defaultValue={editingAddress?.name}
                      className="w-full px-4 py-3 bg-stone-50 border border-stone-100 rounded-2xl outline-none focus:border-primary transition-colors font-bold text-stone-700"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1.5 block">Phone Number</label>
                    <input 
                      name="phone"
                      required
                      defaultValue={editingAddress?.phone}
                      className="w-full px-4 py-3 bg-stone-50 border border-stone-100 rounded-2xl outline-none focus:border-primary transition-colors font-bold text-stone-700"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1.5 block">Pin Code</label>
                    <input 
                      name="pin_code"
                      required
                      defaultValue={editingAddress?.pin_code}
                      className="w-full px-4 py-3 bg-stone-50 border border-stone-100 rounded-2xl outline-none focus:border-primary transition-colors font-bold text-stone-700"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1.5 block">Full Address</label>
                  <textarea 
                    name="address"
                    required
                    defaultValue={editingAddress?.address}
                    className="w-full px-4 py-3 bg-stone-50 border border-stone-100 rounded-2xl outline-none focus:border-primary transition-colors min-h-[80px] font-bold text-stone-700"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1.5 block">City</label>
                    <input 
                      name="city"
                      required
                      defaultValue={editingAddress?.city || 'Samana'}
                      className="w-full px-4 py-3 bg-stone-50 border border-stone-100 rounded-2xl outline-none focus:border-primary transition-colors font-bold text-stone-700"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1.5 block">State</label>
                    <input 
                      name="state"
                      required
                      defaultValue={editingAddress?.state || 'Punjab'}
                      className="w-full px-4 py-3 bg-stone-50 border border-stone-100 rounded-2xl outline-none focus:border-primary transition-colors font-bold text-stone-700"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1.5 block">Delivery Zone</label>
                  <select 
                    name="delivery_area"
                    required
                    defaultValue={editingAddress?.delivery_area}
                    className="w-full px-4 py-3 bg-stone-50 border border-stone-100 rounded-2xl outline-none focus:border-primary transition-colors font-bold text-stone-700"
                  >
                    <option value="">Select a zone</option>
                    {deliveryAreas.map(area => (
                      <option key={area.id} value={area.name}>{area.name}</option>
                    ))}
                  </select>
                </div>

                <button 
                  type="submit"
                  className="w-full bg-primary text-white py-4 rounded-2xl font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all mt-4"
                >
                  Save Address
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SettingToggle({ icon: Icon, label, desc, enabled, onToggle, color }: any) {
  return (
    <div className="p-6 hover:bg-stone-50 transition-colors">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className={cn("p-3 rounded-2xl bg-stone-100", color)}>
            <Icon size={20} />
          </div>
          <div>
            <p className="font-bold text-stone-700">{label}</p>
            <p className="text-[10px] text-stone-400 font-medium">{desc}</p>
          </div>
        </div>
        <div 
          onClick={onToggle}
          className={cn(
            "w-12 h-6 rounded-full relative p-1 cursor-pointer transition-all duration-300 ease-in-out",
            enabled ? "bg-emerald-500 shadow-inner shadow-emerald-600/20" : "bg-stone-200 shadow-inner"
          )}
        >
          <motion.div 
            animate={{ x: enabled ? 24 : 0 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
            className="w-4 h-4 bg-white rounded-full shadow-md" 
          />
        </div>
      </div>
    </div>
  );
}
