import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User, Mail, Phone, MapPin, ShoppingBag, Shield, HelpCircle, 
  ChevronRight, Camera, LogOut, Settings, Bell, CreditCard, 
  History, Wallet, Info, MessageSquare, ExternalLink, Activity, Globe, Plus, X,
  Heart, CheckCircle, Package, Truck, Home, Star, RefreshCw, Clock, Download, Trash2, Copy, Navigation2
} from 'lucide-react';
import { useStore } from '../StoreContext';
import { useNavigate, Link } from 'react-router-dom';
import { QRCodeCanvas } from 'qrcode.react';
import toast from 'react-hot-toast';
import { cn, Product } from '../types';
import { useEffect } from 'react';
import WholesaleInsights from '../components/WholesaleInsights';
import LocationPicker from '../components/LocationPicker';
import { fetchWithHandling } from '../lib/api';
import { getAuthHeaders } from '../lib/utils';
import { OrderSkeleton, ProductSkeleton, TableRowSkeleton } from '../components/ui/Skeleton';

export default function Profile() {
  const { 
    user, 
    setUser,
    logout, 
    updateProfile, 
    vibration, 
    setVibration, 
    config, 
    wishlist, 
    toggleWishlist, 
    subscribeNewsletter,
    addresses, deleteAddress, setDefaultAddress, saveAddress,
    simulatedRole, t, logActivity
  } = useStore();
  const navigate = useNavigate();
  const activeRole = simulatedRole || user?.role;
  const [isEditing, setIsEditing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [exportStatus, setExportStatus] = useState<{ status: string; created_at: string } | null>(null);

  const fetchExportStatus = async () => {
    fetchWithHandling<any>('/api/user/export-status', { headers: getAuthHeaders() })
      .then(data => {
        if (data) setExportStatus(data);
      });
  };

  useEffect(() => {
    fetchExportStatus();
  }, []);

  const [isExporting, setIsExporting] = useState(false);

  const handleExportData = async (format: 'pdf' | 'json') => {
    setIsExporting(true);
    try {
      const data = { user, orders, wallet: walletHistory };
      
      if (format === 'json') {
        const jsonString = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `my_data_${user?.name?.replace(/\s+/g, '_')}.json`;
        link.click();
        toast.success('JSON Data Exported');
      } else {
        const { generateUserExportPDF } = await import('../services/pdfService');
        generateUserExportPDF(data);
        toast.success('Professional PDF Report Generated');
      }
      logActivity('DATA_EXPORT', `User exported personal data as ${format.toUpperCase()}`);
    } catch (err) {
      toast.error('Failed to compile data archive');
    } finally {
      setIsExporting(false);
    }
  };

  const [deletionStatus, setDeletionStatus] = useState<any>(null);

  const fetchDeletionStatus = async () => {
    try {
      const data = await fetchWithHandling<any>('/api/user/deletion-request', { headers: getAuthHeaders() });
      if (data) setDeletionStatus(data);
    } catch (err) {}
  };

  useEffect(() => {
    fetchExportStatus();
    fetchDeletionStatus();
  }, []);

  const handleDataRequest = async (type: 'export' | 'delete') => {
    if (!window.confirm(t('confirm_action'))) return;

    if (type === 'export') {
      try {
        const data = await fetchWithHandling<any>('/api/user/export-data', { 
          method: 'POST',
          headers: getAuthHeaders()
        });
        if (data && data.success) {
          toast.success('Export requested. Admin will review soon.');
          fetchExportStatus();
        } else if (data) {
          toast.error(data.message || 'Failed to request export');
        }
      } catch (err) {
        console.error('Failed to request export:', err);
      }
    } else {
      const reason = window.prompt("Optional: Please tell us why you wish to delete your account:");
      try {
        const data = await fetchWithHandling<any>('/api/user/deletion-request', { 
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({ reason })
        });
        if (data && data.success) {
          toast.success(data.message);
          fetchDeletionStatus();
        }
      } catch (err) {
        toast.error('Failed to process deletion request');
      }
    }
  };
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [editingAddress, setEditingAddress] = useState<any>(null);
  const [deliveryAreas, setDeliveryAreas] = useState<any[]>([]);

  useEffect(() => {
    fetchWithHandling<any[]>('/api/delivery-areas')
      .then(data => {
        if (data) setDeliveryAreas(data);
      });
  }, []);

  const upiId = config.find(c => c.key === 'upi_id')?.value || 'hindstore@upi';
  const upiName = config.find(c => c.key === 'upi_name')?.value || 'General Store Karyana Shop Nayagaon';
  const upiQr = config.find(c => c.key === 'upi_qr')?.value;
  
  const bankName = config.find(c => c.key === 'bank_name')?.value;
  const bankHolder = config.find(c => c.key === 'account_holder')?.value;
  const bankAccount = config.find(c => c.key === 'account_number')?.value;
  const bankIfsc = config.find(c => c.key === 'ifsc_code')?.value;

  const qrRef = useRef<HTMLDivElement>(null);

  const downloadQR = () => {
    try {
      const canvas = qrRef.current?.querySelector('canvas');
      if (canvas) {
        const url = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.href = url;
        link.download = `hind_store_qr_${user?.id || 'payment'}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success('QR Code saved to gallery');
      } else {
        toast.error('QR Code not ready. Please try again.');
      }
    } catch (err) {
      console.error('QR Download Error:', err);
      toast.error('Failed to download QR code');
    }
  };

  const getCurrentLocation = () => {
    if ("geolocation" in navigator) {
      toast.loading('Fetching your location...', { id: 'geo' });
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          try {
            // Reverse geocoding can be complex without a proxy or API key, 
            // but we'll try to use a public one or at least save the coordinates
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
            const data = await res.json();
            
            if (data && data.address) {
              const addr = data.address;
              const city = addr.city || addr.town || addr.village || '';
              const state = addr.state || '';
              const postcode = addr.postcode || '';
              const road = addr.road || '';
              const neighbourhood = addr.neighbourhood || addr.suburb || '';

              const street_address = `${road}${neighbourhood ? ', ' + neighbourhood : ''}`;

              setFormData(prev => ({
                ...prev,
                street_address,
                city: city,
                state: state,
                pin_code: postcode.slice(0, 6)
              }));

              const saInput = document.querySelector('input[name="street_address"]') as HTMLInputElement;
              const cityInput = document.querySelector('input[name="city"]') as HTMLInputElement;
              const stateInput = document.querySelector('input[name="state"]') as HTMLInputElement;
              const pinInput = document.querySelector('input[name="pin_code"]') as HTMLInputElement;
              if (saInput) saInput.value = street_address;
              if (cityInput) cityInput.value = city;
              if (stateInput) stateInput.value = state;
              if (pinInput) pinInput.value = postcode.slice(0, 6);

              toast.success('Location updated successfully', { id: 'geo' });
            } else {
              setFormData(prev => ({ ...prev, address: `${latitude}, ${longitude}` }));
              toast.success('Coordinates captured', { id: 'geo' });
            }
          } catch (err) {
            toast.error('Reverse geocoding failed', { id: 'geo' });
          }
        },
        (error) => {
          toast.error(`Permission denied: ${error.message}`, { id: 'geo' });
        }
      );
    } else {
      toast.error('Geolocation is not supported by your browser');
    }
  };

  const lookupPincode = async (pincode: string, target: 'profile' | 'address') => {
    if (pincode.length !== 6) return;
    try {
      const res = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
      const data = await res.json();
      if (data[0].Status === 'Success') {
        const postOffice = data[0].PostOffice[0];
        if (target === 'profile') {
          setFormData(prev => ({
            ...prev,
            city: postOffice.District,
            state: postOffice.State
          }));
        }
        return { city: postOffice.District, state: postOffice.State };
      }
    } catch (err) {
      console.error('Pincode lookup failed');
    }
  };

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
    phone: user?.phone || '',
    lat: (user as any)?.lat || null,
    lng: (user as any)?.lng || null
  });

  const [orders, setOrders] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  const fetchOrders = async () => {
    if (!user) return;
    setLoadingOrders(true);
    try {
      const data = await fetchWithHandling<any[]>(`/api/orders/user/${user.id}`, { headers: getAuthHeaders() });
      if (data) setOrders(data);
    } catch (err) {
      console.error('Failed to fetch orders:', err);
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
      const data = await fetchWithHandling<any[]>(`/api/wallet-history/${user.id}`, { headers: getAuthHeaders() });
      if (data) setWalletHistory(data);
    } catch (err) {
      console.error('Failed to fetch wallet history:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const [activeProfileTab, setActiveProfileTab] = useState<'history' | 'wishlist' | 'addresses' | 'insights' | 'wallet' | 'khata'>('history');
  
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get('tab');
    const action = params.get('action');
    if (tab && ['history', 'wishlist', 'addresses', 'insights', 'wallet', 'khata'].includes(tab)) {
      setActiveProfileTab(tab as any);
    }
    if (action === 'add-money') {
      setActiveProfileTab('wallet');
      setShowAddMoney(true);
    }
  }, []);

  const [khataHistory, setKhataHistory] = useState<any[]>([]);
  const [loadingKhata, setLoadingKhata] = useState(false);

  const fetchKhataHistory = async () => {
    if (!user) return;
    setLoadingKhata(true);
    try {
      const data = await fetchWithHandling<any[]>(`/api/user/khata/history/${user.id}`, { headers: getAuthHeaders() });
      if (data) setKhataHistory(data);
    } catch (err) {
      console.error('Failed to fetch Khata history:', err);
    } finally {
      setLoadingKhata(false);
    }
  };

  useEffect(() => {
    if (activeProfileTab === 'khata') {
      fetchKhataHistory();
    }
  }, [activeProfileTab]);

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
      const orderData = await fetchWithHandling<any>(`/api/orders/${orderId}`, { headers: getAuthHeaders() });
      if (orderData) {
        setShowReturnModal({ open: true, orderId: orderData.id, orderItems: orderData.items });
        if (orderData.items && orderData.items.length > 0) {
            setReturnProductId(orderData.items[0].product_id);
            setReturnQuantity(1);
        }
      }
    } catch(err) {
      console.error('Failed to load order details:', err);
    }
  };

  const handleReturnSubmit = async () => {
    if (!returnProductId) { toast.error('Please select a product to return'); return; }
    if (!returnReason.trim()) { toast.error('Please provide a reason'); return; }
    
    setIsSubmitting(true);
    try {
      const data = await fetchWithHandling<any>(`/api/returns`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          order_id: showReturnModal.orderId,
          product_id: returnProductId,
          quantity: returnQuantity,
          reason: returnReason
        })
      });
      if (data) {
        toast.success('Return initiated! Admin will review your request.');
        setShowReturnModal({ open: false, orderId: null, orderItems: [] });
        setReturnReason('');
      }
    } catch(err) {
      console.error('Failed to initiate return:', err);
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
      const data = await fetchWithHandling<any>('/api/reviews', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          order_id: showReviewModal.orderId,
          rating: reviewRating,
          comment: reviewComment,
          user_name: user.name
        })
      });
      if (data) {
        toast.success('Review submitted successfully!');
        setShowReviewModal({ open: false, orderId: null });
        setReviewComment('');
        setReviewRating(5);
      }
    } catch (err) {
      console.error('Error submitting review:', err);
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
      const data = await fetchWithHandling<any>('/api/wallet/add', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          userId: user.id,
          amount: Number(addAmount),
          paymentId,
          screenshot
        })
      });
      if (data && data.success) {
        toast.success(data.message);
        setShowAddMoney(false);
        setAddAmount('');
        setPaymentId('');
        setScreenshot(null);
        fetchWalletHistory();
      } else if (data) {
        toast.error(data.message);
      }
    } catch (err) {
      console.error('Failed to submit request:', err);
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

  React.useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  if (!user) {
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
    <>
      <div className="max-w-4xl mx-auto px-4 py-8 pb-32 md:pb-8">
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
                  <div className="relative">
                    <input 
                      type="text" 
                      className="input-field" 
                      value={formData.pin_code}
                      placeholder="6 digit PIN"
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                        setFormData({...formData, pin_code: val});
                        if (val.length === 6) lookupPincode(val, 'profile');
                      }}
                    />
                    <LocationPicker onLocationFound={(lat, lng) => setFormData({...formData, lat, lng})} />
                  </div>
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
              { id: 'khata', label: 'Khata', icon: Clock },
              { id: 'settings', label: 'Settings', icon: Settings },
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
            {activeProfileTab === 'settings' && (
                <motion.div
                    key="settings"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="bg-white rounded-3xl shadow-sm border border-stone-100 p-6 space-y-6"
                >
                    <h3 className="font-bold text-lg">Notification Settings</h3>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <span>Order Status Updates</span>
                            <div 
                              className={cn("w-12 h-6 rounded-full cursor-pointer relative transition-colors duration-300", user?.notification_orders !== false ? "bg-primary" : "bg-stone-200")} 
                              onClick={async () => {
                                const val = user?.notification_orders !== false ? false : true;
                                const res = await fetchWithHandling<any>('/api/user/update-profile', {
                                  method: 'POST',
                                  headers: getAuthHeaders(),
                                  body: JSON.stringify({ notification_orders: val })
                                });
                                if (res?.success) {
                                  setUser(res.user);
                                  toast.success('Preference updated');
                                }
                              }}>
                                <div className={cn("absolute top-1 w-4 h-4 bg-white rounded-full transition-transform duration-300", user?.notification_orders !== false ? "left-7" : "left-1")}></div>
                            </div>
                        </div>
                         <div className="flex items-center justify-between">
                            <span>Promotions</span>
                            <div 
                              className={cn("w-12 h-6 rounded-full cursor-pointer relative transition-colors duration-300", user?.notification_promotions !== false ? "bg-primary" : "bg-stone-200")} 
                              onClick={async () => {
                                const val = user?.notification_promotions !== false ? false : true;
                                const res = await fetchWithHandling<any>('/api/user/update-profile', {
                                  method: 'POST',
                                  headers: getAuthHeaders(),
                                  body: JSON.stringify({ notification_promotions: val })
                                });
                                if (res?.success) {
                                  setUser(res.user);
                                  toast.success('Preference updated');
                                }
                              }}>
                                <div className={cn("absolute top-1 w-4 h-4 bg-white rounded-full transition-transform duration-300", user?.notification_promotions !== false ? "left-7" : "left-1")}></div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
            {activeProfileTab === 'khata' && (
              <motion.div 
                key="khata"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-white rounded-3xl shadow-sm border border-stone-100 overflow-hidden"
              >
                <div className="p-6 border-b border-stone-100 bg-stone-50/50">
                  <h3 className="font-bold text-lg">Khata Transaction History</h3>
                </div>
                <div className="p-6">
                  {loadingKhata ? (
                    <div className="text-center py-8">Loading...</div>
                  ) : khataHistory.length === 0 ? (
                    <div className="text-center py-8 text-stone-400">No Khata transactions found</div>
                  ) : (
                    <div className="space-y-4">
                      {khataHistory.map(tx => (
                        <div key={tx.id} className="flex justify-between items-center p-4 bg-stone-50 rounded-xl">
                          <div>
                            <p className="font-bold">{tx.description}</p>
                            <p className="text-xs text-stone-500">{new Date(tx.created_at).toLocaleDateString()}</p>
                          </div>
                          <p className={cn("font-black", tx.type === 'debit' ? 'text-red-600' : 'text-emerald-600')}>
                            {tx.type === 'debit' ? '-' : '+'}₹{tx.amount}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
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
                              "relative p-5 rounded-2xl border-2 transition-all",
                              addr.is_default ? "border-primary bg-primary/5" : "border-stone-100 hover:border-stone-200"
                            )}
                          >
                            <div className="flex justify-between items-start">
                              <div className="space-y-1">
                                <div className="flex items-center space-x-2">
                                  <span className="font-bold text-stone-900 text-sm">{addr.name}</span>
                                  {addr.is_default && (
                                    <span className="bg-primary text-white text-[8px] font-black uppercase px-2 py-0.5 rounded-full">Default</span>
                                  )}
                                </div>
                                <p className="text-xs text-stone-600 font-medium">{addr.phone}</p>
                                <p className="text-xs text-stone-500 mt-2 leading-relaxed">
                                  {addr.house_number ? `${addr.house_number}, ` : ''}{addr.address}, {addr.city}, {addr.state} - {addr.pin_code}
                                </p>
                                <span className="inline-block mt-2 text-[10px] font-bold text-primary uppercase tracking-widest bg-white px-2 py-1 rounded-full border border-primary/20">
                                  Zone: {addr.delivery_area}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center justify-end mt-4 pt-4 border-t border-stone-100 space-x-2">
                              {!addr.is_default && (
                                <button
                                  onClick={() => setDefaultAddress(addr.id)}
                                  className="text-[10px] font-bold text-stone-400 hover:text-primary uppercase tracking-widest transition-colors flex-1 text-left"
                                >
                                  {t('set_as_default')}
                                </button>
                              )}
                              <button 
                                onClick={() => {
                                  setEditingAddress(addr);
                                  setShowAddressModal(true);
                                }}
                                className="p-2 text-stone-400 hover:text-primary transition-colors hover:bg-stone-100 rounded-lg"
                              >
                                <Settings size={14} />
                              </button>
                              <button 
                                onClick={() => {
                                  if(window.confirm('Delete this address?')) deleteAddress(addr.id);
                                }}
                                className="p-2 text-stone-400 hover:text-red-500 transition-colors hover:bg-stone-100 rounded-lg"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
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
                <div className="p-6 border-b border-stone-100 flex justify-between items-center bg-stone-50/30">
                  <div className="flex items-center space-x-3">
                    <div className="p-2.5 bg-primary/10 rounded-xl text-primary">
                      <ShoppingBag size={18} />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg leading-tight">{t('order_history') || 'Order History'}</h3>
                      <p className="text-[10px] text-stone-400 font-bold uppercase tracking-wider">{t('track_and_manage') || 'Track and manage your orders'}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => fetchOrders()}
                    className={cn(
                      "p-2 hover:bg-stone-100 rounded-xl transition-all text-stone-400 hover:text-primary active:rotate-180 duration-500",
                      loadingOrders && "animate-spin"
                    )}
                    title="Refresh History"
                  >
                    <RefreshCw size={18} />
                  </button>
                </div>
                <div className="divide-y divide-stone-50">
                  {loadingOrders ? (
                    <div className="p-6 space-y-4">
                      <OrderSkeleton />
                      <OrderSkeleton />
                      <OrderSkeleton />
                    </div>
                  ) : orders.length === 0 ? (
                    <div className="p-12 flex flex-col items-center text-center space-y-4">
                      <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center text-stone-300">
                        <ShoppingBag size={24} />
                      </div>
                      <div>
                        <p className="text-stone-500 font-bold">No orders found yet.</p>
                        <p className="text-xs text-stone-400 mt-1">Looks like you haven't made your first order.</p>
                      </div>
                      <Link to="/products" className="btn-primary px-6 py-2.5 rounded-xl text-sm mt-2">
                        Start Shopping
                      </Link>
                    </div>
                  ) : (
                    orders.map((order) => (
                      <div key={order.id} className="p-4 md:p-6 hover:bg-stone-50 transition-colors border-b border-stone-50 last:border-0">
                        <div className="flex justify-between items-start mb-6">
                          <div>
                            <div className="flex items-center space-x-2">
                              <p className="font-black text-stone-900 tracking-tighter uppercase text-base">Order #{order.order_id || order.id}</p>
                              <button 
                                onClick={() => {
                                  navigator.clipboard.writeText(order.order_id || String(order.id));
                                  toast.success('Order ID copied!');
                                }}
                                className="p-1 hover:bg-stone-200 rounded-md transition-colors text-stone-400 hover:text-primary"
                                title="Copy Order ID"
                              >
                                <Copy size={12} />
                              </button>
                            </div>
                            <div className="flex items-center space-x-4 mt-2">
                                <p className="text-[10px] text-stone-500 font-bold bg-stone-100 px-2 py-1 rounded-lg uppercase tracking-wider">{new Date(order.created_at).toLocaleDateString()}</p>
                                <p className="text-[10px] text-stone-500 font-bold bg-stone-100 px-2 py-1 rounded-lg uppercase tracking-wider">{order.items_count || 0} Items</p>
                            </div>
                          </div>
                          <div className="flex flex-col items-end space-y-2">
                            <p className="font-black text-2xl text-primary leading-none tracking-tight">₹{order.total}</p>
                            <span className={cn(
                              "text-[10px] font-black px-3 py-1 rounded-lg uppercase tracking-widest border",
                              order.status === 'delivered' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                              order.status === 'cancelled' ? 'bg-red-50 text-red-600 border-red-100' : 
                              order.status === 'failed' ? 'bg-stone-900 text-white border-stone-900' : 
                              'bg-primary/10 text-primary border-primary/20'
                            )}>
                              {t(order.status) || order.status}
                            </span>
                          </div>
                        </div>

                        <div className="flex justify-between items-center bg-stone-50 p-4 rounded-2xl border border-stone-100/50 mb-6">
                            <div className="flex items-center space-x-4">
                                <Link 
                                    to={`/invoice/${order.id}`}
                                    className="text-[10px] font-black text-stone-500 hover:text-primary tracking-[0.2em] uppercase flex items-center space-x-1 transition-all"
                                >
                                    <Info size={12} />
                                    <span>{t('view_details') || 'DETAILS'}</span>
                                </Link>
                            </div>
                            <Link 
                                to={`/track-order?orderId=${order.order_id || order.id}&phone=${user?.phone}`}
                                className="bg-primary hover:bg-primary/90 text-white text-[10px] font-black tracking-[0.2em] uppercase flex items-center space-x-2 px-4 py-2 rounded-xl transition-all shadow-md shadow-primary/20"
                            >
                                <span>Track Order</span>
                                <Truck size={14} />
                            </Link>
                        </div>

                        {/* Order Tracking Timeline for Mobile */}
                        {['processing', 'shipped', 'delivered'].includes(order.status) && (
                          <div className="mt-2 flex items-center space-x-2">
                             {[
                               { s: 'pending', i: <Clock size={10} /> },
                               { s: 'processing', i: <Settings size={10} /> },
                               { s: 'shipped', i: <Truck size={10} /> },
                               { s: 'delivered', i: <CheckCircle size={10} /> }
                             ].map((step, idx) => {
                               const statuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'failed'];
                               const currentIdx = statuses.indexOf(order.status);
                               const stepIdx = statuses.indexOf(step.s);
                               const isActive = stepIdx <= currentIdx;
                               return (
                                 <React.Fragment key={step.s}>
                                   <div className={cn(
                                     "w-6 h-6 rounded-full flex items-center justify-center transition-all",
                                     isActive ? "bg-primary text-white shadow-sm shadow-primary/20 scale-110" : "bg-stone-100 text-stone-300"
                                   )}>
                                     {step.i}
                                   </div>
                                   {idx < 3 && (
                                     <div className={cn(
                                       "h-0.5 flex-1 rounded-full",
                                       isActive && stepIdx < currentIdx ? "bg-primary/30" : "bg-stone-100"
                                     )} />
                                   )}
                                 </React.Fragment>
                               )
                             })}
                          </div>
                        )}
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
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <ProductSkeleton />
                      <ProductSkeleton />
                    </div>
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
                      className="bg-white text-stone-900 px-8 py-3 rounded-2xl font-bold flex items-center space-x-2 hover:bg-primary hover:text-white transition-all shadow-xl shadow-stone-900/10"
                    >
                      <Plus size={20} />
                      <span>Add Money</span>
                    </button>
                  </div>
                </div>

                {/* Wallet Tracking UI */}
                <div className="bg-white rounded-3xl shadow-sm border border-stone-100 overflow-hidden">
                    <div className="p-6 border-b border-stone-100 flex justify-between items-center bg-stone-50/50">
                        <div>
                            <h3 className="font-black text-lg text-stone-900 uppercase tracking-tight">{t('wallet_tracking') || 'Wallet Tracking'}</h3>
                            <p className="text-xs text-stone-400 font-medium">Monitoring your flow of funds</p>
                        </div>
                        <div className="flex items-center space-x-3">
                             <button 
                                onClick={fetchWalletHistory}
                                className="p-2 hover:bg-white rounded-xl transition-all text-stone-400 hover:text-primary border border-transparent hover:border-stone-100 shadow-sm"
                                title="Refresh History"
                             >
                                <RefreshCw size={18} className={loadingHistory ? "animate-spin" : ""} />
                             </button>
                             <div className="p-2 bg-primary/10 rounded-xl">
                                <Wallet size={18} className="text-primary" />
                             </div>
                        </div>
                    </div>
                    
                    <div className="divide-y divide-stone-50">
                        {loadingHistory ? (
                            <div className="p-6 space-y-4">
                                <TableRowSkeleton columns={3} />
                                <TableRowSkeleton columns={3} />
                                <TableRowSkeleton columns={3} />
                            </div>
                        ) : walletHistory.length === 0 ? (
                            <div className="p-12 text-center text-stone-400 italic">No transactions yet</div>
                        ) : (
                            <>
                                {walletHistory.slice(0, 5).map((tx) => (
                                    <div key={tx.id} className="p-6 flex justify-between items-center hover:bg-stone-50 transition-all cursor-pointer">
                                        <div className="flex items-center space-x-4">
                                            <div className={cn(
                                                "p-3 rounded-2xl",
                                                tx.type === 'credit' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
                                            )}>
                                                {tx.type === 'credit' ? <Plus size={18} /> : <Trash2 size={18} />}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-stone-900 uppercase tracking-tighter">{tx.description || 'Wallet Transaction'}</p>
                                                <p className="text-[10px] text-stone-400 font-bold">{new Date(tx.created_at).toLocaleDateString()} • {tx.transaction_id || tx.id}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className={cn(
                                                "font-black text-lg",
                                                tx.type === 'credit' ? 'text-emerald-600' : 'text-stone-900'
                                            )}>
                                                {tx.type === 'credit' ? '+' : '-'} ₹{tx.amount}
                                            </p>
                                            <span className="text-[9px] font-black uppercase tracking-widest text-stone-400 bg-stone-100 px-2 py-0.5 rounded-full">{tx.status || 'approved'}</span>
                                        </div>
                                    </div>
                                ))}
                                {walletHistory.length > 5 && (
                                    <button className="w-full p-4 text-[10px] font-black text-primary uppercase tracking-[0.2em] bg-stone-50/50 hover:bg-stone-50 transition-colors">
                                        {t('view_all') || 'View All Transactions'}
                                    </button>
                                )}
                            </>
                        )}
                    </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Newsletter Section */}
          <div className="bg-primary/5 rounded-3xl p-8 border border-primary/10">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="text-center md:text-left">
                <h3 className="text-xl font-black text-primary mb-2">Join the General Store Karyana Shop Store Community</h3>
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
                  key={`resource-${idx}`} 
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
              
              <div 
                className="p-6 hover:bg-stone-50 transition-colors cursor-pointer group"
                onClick={() => {
                  toast.success('Language changed to English (Default)');
                  if(vibration && navigator.vibrate) navigator.vibrate(50);
                }}
              >
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

              <div 
                className="p-6 hover:bg-stone-50 transition-colors cursor-pointer group"
                onClick={() => toast.success('Cache cleared')}
              >
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
                    className="text-xs font-bold text-stone-400 group-hover:text-red-500 uppercase tracking-wider py-2 px-4 rounded-xl bg-stone-100 group-hover:bg-red-50 transition-colors"
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
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className={cn(
                      "p-3 rounded-2xl transition-colors",
                      isExporting ? "bg-amber-100 text-amber-600 animate-pulse" : "bg-stone-100 text-stone-500"
                    )}>
                      <Download size={20} />
                    </div>
                    <div>
                      <p className="font-bold text-stone-700">Export My Data Archive</p>
                      <p className="text-[10px] text-stone-400 font-medium">Download a structured copy of your profile and history</p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button 
                      disabled={isExporting}
                      onClick={() => handleExportData('pdf')} 
                      className="px-4 py-2 bg-stone-900 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-all disabled:opacity-50"
                    >
                      {isExporting ? 'Compiling...' : 'PDF'}
                    </button>
                    <button 
                      disabled={isExporting}
                      onClick={() => handleExportData('json')} 
                      className="px-4 py-2 bg-stone-100 text-stone-600 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-stone-200 transition-all disabled:opacity-50"
                    >
                      JSON
                    </button>
                  </div>
                </div>
              </div>
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-stone-100 rounded-2xl text-stone-500 group-hover:bg-red-50 group-hover:text-red-600 transition-colors">
                      <Trash2 size={20} />
                    </div>
                    <div>
                      <p className="font-bold text-stone-700">Permanent Account Deletion</p>
                      <p className="text-[10px] text-stone-400 font-medium">Request removal of all your data</p>
                    </div>
                  </div>
                  <div>
                    { (!deletionStatus || deletionStatus.status === 'NONE') ? (
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleDataRequest('delete'); }} 
                        className="text-[10px] font-black text-red-500 uppercase tracking-widest hover:underline"
                      >
                        Request Deletion
                      </button>
                    ) : (
                      <div className="flex flex-col items-end">
                        <span className={cn(
                          "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest",
                          deletionStatus.status === 'PENDING' ? "bg-amber-100 text-amber-600" : "bg-emerald-100 text-emerald-600"
                        )}>
                          {deletionStatus.status}
                        </span>
                        {deletionStatus.scheduled_for && (
                          <p className="text-[8px] text-stone-400 mt-1">Scheduled: {new Date(deletionStatus.scheduled_for).toLocaleDateString()}</p>
                        )}
                      </div>
                    )}
                  </div>
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
                <div ref={qrRef} className="w-56 h-56 bg-white mx-auto rounded-3xl border-4 border-white shadow-xl flex items-center justify-center mb-4 transition-transform hover:scale-105 overflow-hidden">
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
                <button 
                  onClick={downloadQR}
                  className="flex items-center justify-center space-x-2 text-[10px] font-black text-primary hover:text-primary/80 uppercase tracking-widest mx-auto mb-4"
                >
                  <Download size={14} />
                  <span>Download QR</span>
                </button>
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
                <div className="grid grid-cols-4 gap-2 mb-3">
                  {[200, 500, 1000, 2000].map(amt => (
                    <button
                      key={amt}
                      onClick={() => setAddAmount(amt.toString())}
                      className={cn(
                        "py-2 rounded-xl text-[10px] font-black border-2 transition-all",
                        addAmount === amt.toString() ? "bg-primary border-primary text-white" : "bg-stone-50 border-stone-100 text-stone-400"
                      )}
                    >
                      ₹{amt}
                    </button>
                  ))}
                </div>
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
                <h3 className="font-black text-xl text-stone-800 uppercase tracking-tight">
                  {editingAddress ? 'Edit Address' : 'Safe Delivery Location'}
                </h3>
                <button onClick={() => setShowAddressModal(false)} className="p-2 hover:bg-stone-100 rounded-xl transition-colors">
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
                className="p-6 space-y-4 max-h-[75vh] overflow-y-auto custom-scrollbar"
              >
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="text-[10px] font-black text-stone-400 uppercase tracking-[0.2em] mb-2 block">Address Nickname</label>
                    <div className="flex gap-2">
                      {['Home', 'Office', 'Shop', 'Other'].map(l => (
                        <label key={l} className="flex-1">
                          <input type="radio" name="label" value={l} className="hidden peer" defaultChecked={editingAddress?.label === l || (!editingAddress?.label && l === 'Home')} />
                          <div className="text-center py-2 rounded-xl border-2 border-stone-100 peer-checked:border-primary peer-checked:bg-primary/5 text-[10px] font-bold uppercase transition-all cursor-pointer">
                            {l}
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                  
                  <div className="col-span-2">
                    <label className="text-[10px] font-black text-stone-400 uppercase tracking-[0.2em] mb-2 block">Full Name</label>
                    <input 
                      name="name"
                      required
                      defaultValue={editingAddress?.name}
                      placeholder="Receiver's name"
                      className="w-full px-4 py-3 bg-stone-50 border border-stone-100 rounded-2xl outline-none focus:border-primary transition-all font-bold text-stone-700 placeholder:text-stone-300"
                    />
                  </div>
                  
                  <div className="col-span-2">
                    <label className="text-[10px] font-black text-stone-400 uppercase tracking-[0.2em] mb-2 block">Mobile Number</label>
                    <input 
                      name="phone"
                      required
                      defaultValue={editingAddress?.phone}
                      placeholder="10 digit number"
                      className="w-full px-4 py-3 bg-stone-50 border border-stone-100 rounded-2xl outline-none focus:border-primary transition-all font-bold text-stone-700 placeholder:text-stone-300"
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="text-[10px] font-black text-stone-400 uppercase tracking-[0.2em] mb-2 block">House / Flat / Area</label>
                    <div className="relative">
                      <input 
                        name="street_address"
                        required
                        defaultValue={editingAddress?.street_address}
                        placeholder="e.g. H.No 123, Sector 4"
                        className="w-full px-4 py-3 bg-stone-50 border border-stone-100 rounded-2xl outline-none focus:border-primary transition-all font-bold text-stone-700 pr-10 placeholder:text-stone-300"
                      />
                      <button 
                        type="button"
                        onClick={getCurrentLocation}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-primary hover:bg-primary/10 rounded-lg transition-all"
                        title="Detect my current location"
                      >
                        <Navigation2 size={16} />
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-black text-stone-400 uppercase tracking-[0.2em] mb-2 block">Pin Code</label>
                    <input 
                      name="pin_code"
                      required
                      defaultValue={editingAddress?.pin_code}
                      placeholder="6 digit PIN"
                      onChange={async (e) => {
                        const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                        e.target.value = val;
                        if (val.length === 6) {
                          const data = await lookupPincode(val, 'address');
                          if (data) {
                            const cityInput = document.querySelector('input[name="city"]') as HTMLInputElement;
                            const stateInput = document.querySelector('input[name="state"]') as HTMLInputElement;
                            if (cityInput) cityInput.value = data.city;
                            if (stateInput) stateInput.value = data.state;
                          }
                        }
                      }}
                      className="w-full px-4 py-3 bg-stone-50 border border-stone-100 rounded-2xl outline-none focus:border-primary transition-all font-bold text-stone-700 placeholder:text-stone-300"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-black text-stone-400 uppercase tracking-[0.2em] mb-2 block">City / Town</label>
                    <input name="city" required readOnly defaultValue={editingAddress?.city} className="w-full px-4 py-3 bg-stone-100 border border-stone-200 rounded-2xl outline-none focus:border-primary transition-all font-bold text-stone-600" />
                  </div>

                  <div className="col-span-2">
                    <label className="text-[10px] font-black text-stone-400 uppercase tracking-[0.2em] mb-2 block">Delivery Instructions</label>
                    <textarea 
                      name="delivery_instructions"
                      placeholder="e.g. Leave at gate, Call before arriving"
                      defaultValue={editingAddress?.delivery_instructions}
                      className="w-full px-4 py-3 bg-stone-50 border border-stone-100 rounded-2xl outline-none focus:border-primary transition-all font-bold text-stone-700 min-h-[80px] placeholder:text-stone-300"
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="text-[10px] font-black text-stone-400 uppercase tracking-[0.2em] mb-2 block">Delivery Area Zone</label>
                    <select
                      name="delivery_area"
                      required
                      defaultValue={editingAddress?.delivery_area}
                      className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-2xl outline-none focus:border-primary transition-all font-bold text-stone-700"
                    >
                      <option value="">Select Zone</option>
                      {deliveryAreas.map(area => (
                        <option key={area.id} value={area.name}>{area.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="pt-4">
                  <button 
                    type="submit"
                    className="w-full bg-primary text-white py-4 rounded-2xl font-black shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all uppercase tracking-[0.2em] text-xs"
                  >
                    Confirm & Save Address
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      </div>
    </>
  );
}

function SettingToggle({ icon: Icon, label, desc, enabled, onToggle, color }: any) {
  const { vibration } = useStore();
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
          onClick={() => {
            if (vibration && navigator.vibrate) navigator.vibrate(20);
            onToggle();
          }}
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
