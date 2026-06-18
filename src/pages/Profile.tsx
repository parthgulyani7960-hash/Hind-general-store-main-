import React, { useState, useRef } from 'react';
import { logger } from '@/lib/logger';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User, Mail, Phone, MapPin, ShoppingBag, Shield, HelpCircle, 
  ChevronRight, ChevronDown, Check, Camera, LogOut, Settings, Bell, CreditCard, 
  History, Wallet, Info, MessageSquare, ExternalLink, Activity, Globe, Plus, X,
  Heart, CheckCircle, Package, Truck, Home, Star, RefreshCw, Clock, Download, Trash2, Copy, Navigation2, MoreVertical,
  ArrowRight, ShieldCheck, Book, TrendingUp, Maximize2, Lock, AlertCircle, Loader2
} from 'lucide-react';
import { useStore } from '@/StoreContext';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { QRCodeCanvas } from 'qrcode.react';
import toast from 'react-hot-toast';
import { cn, Product } from '@/types';
import { auth } from '@/firebase';
import { useEffect } from 'react';
import WholesaleInsights from '@/components/WholesaleInsights';
import LocationPicker from '@/components/LocationPicker';
import WalletModal from '@/components/WalletModal';
import LoadingFallback from '@/components/LoadingFallback';
import { KhataWizard } from '@/components/KhataWizard';
import { ExportManagement } from '@/components/ExportManagement';
import { useProfileAuthDebug } from '@/hooks/useProfileAuthDebug';
import { fetchWithHandling } from '@/lib/api';
import { triggerFeedback } from '@/lib/feedback';
import { getAuthHeaders, formatPhoneNumber, isValidPhone } from '@/lib/utils';
import { OrderSkeleton, ProductSkeleton, TableRowSkeleton } from '@/components/ui/Skeleton';
import { autofillLocation } from '@/lib/geocoding';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

const GOOGLE_MAPS_KEY = (typeof process !== 'undefined' && process.env?.GOOGLE_MAPS_PLATFORM_KEY) || '';

export default function Profile() {
  console.log('[PROFILE] Rendering component');
  const { 
    user, 
    setUser,
    logout, 
    updateProfile, 
    vibration, 
    setVibration, 
    notifications,
    setNotifications,
    sound,
    setSound,
    wishlist, 
    toggleWishlist, 
    subscribeNewsletter,
    unsubscribeNewsletter,
    checkNewsletterStatus,
    addresses, deleteAddress, setDefaultAddress, saveAddress,
    simulatedRole, t, logActivity,
    config = [],
    language,
    setLanguage,
    refreshUser,
    fetchConfig,
    isMaintenance,
    isAuthChecking,
    isRevalidating
  } = useStore();
  
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // 5-second safety timeout for data refresh - only run if a potential session exists
    const token = localStorage.getItem('hgs_token');
    if (!token && !user) return;

    const timer = setTimeout(() => {
        if (!user && refreshUser) {
            refreshUser();
        }
    }, 5000);
    return () => clearTimeout(timer);
  }, [user, refreshUser]);

  const activeRole = simulatedRole || user?.role;
  const emailMatch = user?.email ? user.email.toLowerCase().includes('parthgulyani7960@gmail.com') : false;
  const isUserAdmin = user && (user.role === 'admin' || emailMatch || simulatedRole === 'admin');
  const [isEditing, setIsEditing] = useState(false);
  const [showLanguageSelector, setShowLanguageSelector] = useState(false);
  const [showKhataWizard, setShowKhataWizard] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingAddress, setIsSavingAddress] = useState(false);
  const [showManageAccountModal, setShowManageAccountModal] = useState(false);
  const [accountName, setAccountName] = useState(user?.name || '');
  const [accountPhone, setAccountPhone] = useState(user?.phone || '');
  const [isSavingAccount, setIsSavingAccount] = useState(false);
  const [isError, setIsError] = useState(false);

  const lastLoadedUserIdRef = useRef<string | number | null>(null);
  const isMountedRef = useRef(true);
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (user) {
      setAccountName(user.name || '');
      setAccountPhone(user.phone || '');
    }
  }, [user]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showPhotoSelector, setShowPhotoSelector] = useState(false);
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  
  // This state is initialized below with user data

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 480 }, 
          height: { ideal: 480 }, 
          facingMode: 'user' 
        } 
      });
      setCameraStream(stream);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }, 150);
    } catch (err: any) {
      console.error('Failed to access camera:', err);
      toast.error('Could not access camera. Please check permissions or device setup.');
      setShowCameraModal(false);
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      const size = Math.min(video.videoWidth, video.videoHeight) || 480;
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.translate(size, 0);
        ctx.scale(-1, 1);
        const sx = (video.videoWidth - size) / 2;
        const sy = (video.videoHeight - size) / 2;
        ctx.drawImage(video, sx, sy, size, size, 0, 0, size, size);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        
        setFormData(prev => ({ ...prev, profile_photo: dataUrl }));
        updateProfile({ profile_photo: dataUrl });
        
        toast.success('New profile photo set successfully!');
        stopCamera();
        setShowCameraModal(false);
      }
    }
  };

  const [exportStatus, setExportStatus] = useState<{ status: string; created_at: string } | null>(null);

  const fetchExportStatus = async () => {
    fetchWithHandling<any>('/api/user/export-status', { headers: getAuthHeaders() })
      .then(data => {
        if (data) setExportStatus(data);
      });
  };

  // Redundant fetchExportStatus effect removed - handled by combined status effect below

  const [isExporting, setIsExporting] = useState(false);
  const [isPurging, setIsPurging] = useState(false);
  const [exportUrl, setExportUrl] = useState<string | null>(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportTimeLeft, setExportTimeLeft] = useState(60);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [deleteReason, setDeleteReason] = useState('Direct customer request via profile');
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleteIsSubmitting, setDeleteIsSubmitting] = useState(false);

  useEffect(() => {
    let timer: any;
    if (showExportModal && exportUrl) {
      setExportTimeLeft(60);
      timer = setInterval(() => {
        setExportTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            setShowExportModal(false);
            if (exportUrl) {
              URL.revokeObjectURL(exportUrl);
            }
            setExportUrl(null);
            toast.error('The secure viewing session has expired for your privacy.');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [showExportModal, exportUrl]);

  const handleExportData = async () => {
    setIsExporting(true);
    try {
      const data = { user, orders, wallet: walletHistory };
      
      const { generateUserExportPDF } = await import('../services/pdfService');
      const doc = await generateUserExportPDF(data);
      
      // Output as blob URL for secure, temporary previewing
      const blob = doc.output('blob');
      const url = URL.createObjectURL(blob);
      setExportUrl(url);
      setShowExportModal(true);
      
      // Generate and trigger a direct CSV file download as well
      const csvRows: string[] = [];
      csvRows.push("--- USER PROFILE DATA ---");
      csvRows.push("Field,Value");
      csvRows.push(`"Name","${user?.name || 'NOT SPECIFIED'}"`);
      csvRows.push(`"Phone","${user?.phone || 'NOT LINKED'}"`);
      csvRows.push(`"Email","${user?.email || 'OFFLINE_ACCOUNT'}"`);
      csvRows.push(`"Wallet Balance","INR ${parseFloat(String(user?.wallet_balance || 0)).toFixed(2)}"`);
      csvRows.push(`"Address","${(user?.address || 'N/A').replace(/"/g, '""').replace(/\n/g, ' ')}"`);
      csvRows.push("");
      csvRows.push("--- ORDER HISTORY ---");
      csvRows.push("Order ID,Date,Total Amount,Payment Method,Status");
      if (orders && orders.length > 0) {
        orders.forEach((o: any) => {
          let dateStr = 'N/A';
          try {
            if (o.created_at) dateStr = new Date(o.created_at).toISOString().split('T')[0];
          } catch (e) {}
          csvRows.push(`"#ORD-${o.id}","${dateStr}","INR ${parseFloat(String(o.total || 0)).toFixed(2)}","${o.payment_method}","${o.status}"`);
        });
      } else {
        csvRows.push("No orders available");
      }
      csvRows.push("");
      csvRows.push("--- FINANCIAL WALLET LEDGER ---");
      csvRows.push("Date,Type,Amount,Description");
      if (walletHistory && walletHistory.length > 0) {
        walletHistory.forEach((w: any) => {
          let dateStr = 'N/A';
          try {
            if (w.created_at) dateStr = new Date(w.created_at).toISOString().replace('T', ' ').substring(0, 16);
          } catch (e) {}
          csvRows.push(`"${dateStr}","${w.type}","INR ${parseFloat(String(w.amount || 0)).toFixed(2)}","${(w.description || '').replace(/"/g, '""').replace(/\n/g, ' ')}"`);
        });
      } else {
        csvRows.push("No wallet activity transactions on record");
      }

      const csvContent = csvRows.join("\n");
      const csvBlob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const csvDownloadUrl = URL.createObjectURL(csvBlob);
      const csvLink = document.createElement("a");
      csvLink.href = csvDownloadUrl;
      csvLink.setAttribute("download", `export_my_data_${user?.id || 'user'}.csv`);
      document.body.appendChild(csvLink);
      csvLink.click();
      document.body.removeChild(csvLink);
      URL.revokeObjectURL(csvDownloadUrl);

      toast.success('Your secure account data archive has been compiled and direct CSV downloaded!');
      logActivity('DATA_EXPORT', `User generated personal data archive CSV and PDF dossier`);
    } catch (err) {
      console.error('Export failed:', err);
      toast.error('Failed to compile data archive. Please notify admin.');
    } finally {
      setIsExporting(false);
    }
  };

  const handlePurgeCache = () => {
    const confirmed = window.confirm('Reset local application cache? This will clear your temporary shopping cart, search history, and saved identifiers, but you will remain signed in.');
    triggerFeedback('medium');
    if (confirmed) {
      triggerFeedback('heavy');
      setIsPurging(true);
      setTimeout(() => {
        localStorage.removeItem('cart-storage');
        localStorage.removeItem('search-history');
        localStorage.removeItem('selected_language');
        localStorage.removeItem('user_identifier');
        localStorage.removeItem('hgs_identifier');
        try {
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && !key.startsWith('firebase:')) {
              localStorage.removeItem(key);
            }
          }
        } catch (e) {}
        toast.success('Application cache successfully cleared!');
        setIsPurging(false);
        window.location.reload();
      }, 1500);
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
      setDeleteConfirmText('');
      setShowDeleteConfirmModal(true);
      triggerFeedback('heavy');
    }
  };

  const submitDeletionRequest = async () => {
    setDeleteIsSubmitting(true);
    triggerFeedback('medium');
    try {
      const data = await fetchWithHandling<any>('/api/user/deletion-request', { 
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ reason: deleteReason || "Direct customer request via profile" })
      });
      if (data && data.success) {
        toast.success(data.message || 'Your deletion request has been submitted for review.');
        fetchDeletionStatus();
        setShowDeleteConfirmModal(false);
      } else {
        toast.error(data?.message || 'Failed to process deletion request');
      }
    } catch (err) {
      toast.error('Failed to process deletion request');
    } finally {
      setDeleteIsSubmitting(false);
    }
  };
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [editingAddress, setEditingAddress] = useState<any>(null);
  const [editingOrder, setEditingOrder] = useState<any>(null);
  const [showEditOrderModal, setShowEditOrderModal] = useState(false);
  const [showAddMoney, setShowAddMoney] = useState(false);
  const [isUpdatingOrder, setIsUpdatingOrder] = useState(false);

  const editSectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('edit') === 'true') {
      setIsEditing(true);
    }
  }, [location.search]);

  useEffect(() => {
    if (isEditing && editSectionRef.current) {
      editSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [isEditing]);

  const displayPhoneNumber = (phone: string | null | undefined) => {
    return formatPhoneNumber(phone);
  };
  const [deliveryAreas, setDeliveryAreas] = useState<any[]>([]);

  useEffect(() => {
    fetchWithHandling<any[]>('/api/delivery-areas')
      .then(data => {
        if (data) setDeliveryAreas(data);
      });
  }, []);

  const upiId = (config || []).find(c => c.key === 'upi_id')?.value || 'hindstore@upi';
  const upiName = (config || []).find(c => c.key === 'upi_name')?.value || 'General Store Karyana Shop Nayagaon';
  const upiQr = (config || []).find(c => c.key === 'upi_qr')?.value;
  
  const bankName = (config || []).find(c => c.key === 'bank_name')?.value;
  const bankHolder = (config || []).find(c => c.key === 'account_holder')?.value;
  const bankAccount = (config || []).find(c => c.key === 'account_number')?.value;
  const bankIfsc = (config || []).find(c => c.key === 'ifsc_code')?.value;

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

  const getCurrentLocation = async () => {
    const data = await autofillLocation(GOOGLE_MAPS_KEY);
    if (data) {
      setFormData(prev => ({
        ...prev,
        street_address: data.address,
        city: data.city,
        state: data.state,
        pin_code: data.pin_code,
        lat: data.latitude,
        lng: data.longitude
      }));

      toast.success(`Position Verified: ${data.city}, ${data.pin_code}`, { icon: '📍' });

      // Manually update inputs if needed for some reason, though formData should drive it
      const saInput = document.querySelector('input[name="street_address"]') as HTMLInputElement;
      const cityInput = document.querySelector('input[name="city"]') as HTMLInputElement;
      const stateInput = document.querySelector('input[name="state"]') as HTMLInputElement;
      const pinInput = document.querySelector('input[name="pin_code"]') as HTMLInputElement;
      if (saInput) saInput.value = data.address;
      if (cityInput) cityInput.value = data.city;
      if (stateInput) stateInput.value = data.state;
      if (pinInput) pinInput.value = data.pin_code;
    } else {
      toast.error('Location services unavailable or permission denied.');
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
    owner_name: (user as any)?.owner_name || '',
    alternate_phone: (user as any)?.alternate_phone || '',
    business_type: (user as any)?.business_type || 'retail',
    gst_number: (user as any)?.gst_number || '',
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

  const fetchOrders = React.useCallback(async () => {
    if (!user) return;
    setOrders(prev => {
      if (prev.length === 0) {
        setLoadingOrders(true);
      }
      return prev;
    });
    try {
      const data = await fetchWithHandling<any[]>(`/api/orders/user/${user.id}`, { headers: getAuthHeaders() });
      if (isMountedRef.current && data) {
        setOrders(data);
      }
    } catch (err) {
      console.error('Failed to fetch orders:', err);
    } finally {
      if (isMountedRef.current) {
        setLoadingOrders(false);
      }
    }
  }, [user?.id]);

  const handleUpdateOrder = async () => {
    if (!editingOrder) return;
    
    setIsUpdatingOrder(true);
    try {
      const res = await fetchWithHandling<any>(`/api/orders/${editingOrder.id}/update-items`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          items: editingOrder.items,
          total: editingOrder.total
        })
      });

      if (res?.success) {
        toast.success('Order updated successfully!');
        setShowEditOrderModal(false);
        fetchOrders();
      } else {
        toast.error(res?.message || 'Failed to update order');
      }
    } catch (err) {
      toast.error('Error updating order');
    } finally {
      setIsUpdatingOrder(false);
    }
  };

  const [walletHistory, setWalletHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const fetchWalletHistory = React.useCallback(async () => {
    if (!user) return;
    setWalletHistory(prev => {
      if (prev.length === 0) {
        setLoadingHistory(true);
      }
      return prev;
    });
    try {
      const data = await fetchWithHandling<any[]>(`/api/wallet-history/${user.id}`, { headers: getAuthHeaders() });
      if (isMountedRef.current && data) {
        setWalletHistory(data);
      }
    } catch (err) {
      console.error('Failed to fetch wallet history:', err);
    } finally {
      if (isMountedRef.current) {
        setLoadingHistory(false);
      }
    }
  }, [user?.id]);

  const loadData = React.useCallback(async (forceUserRefresh = false) => {
    console.log('PROFILE_RENDER_START');
    setIsError(false);
    if (forceUserRefresh) {
      setLoadingOrders(true);
      setLoadingHistory(true);
      setOrders([]);
      setWalletHistory([]);
    }
    try {
      if (forceUserRefresh && refreshUser) {
        await refreshUser();
      }
      await Promise.all([fetchOrders(), fetchWalletHistory()]);
      console.log('PROFILE_RENDER_COMPLETE');
    } catch (err) {
      setIsError(true);
      toast.error('Failed to load profile data.');
    }
  }, [refreshUser, fetchOrders, fetchWalletHistory]);

  // Sync formData and refresh data when user changes
  useEffect(() => {
    if (user) {
      if (user.id !== lastLoadedUserIdRef.current) {
        lastLoadedUserIdRef.current = user.id;
        setFormData({
          name: user.name || '',
          username: user.username || '',
          email: user.email || '',
          shop_name: user.shop_name || '',
          owner_name: (user as any).owner_name || '',
          alternate_phone: (user as any).alternate_phone || '',
          business_type: (user as any).business_type || 'retail',
          gst_number: (user as any).gst_number || '',
          pin_code: user.pin_code || '',
          street_address: (user as any).street_address || '',
          city: (user as any).city || '',
          state: (user as any).state || '',
          zip_code: (user as any).zip_code || '',
          address: user.address || '',
          profile_photo: user.profile_photo || '',
          phone: user.phone || '',
          lat: (user as any).lat || null,
          lng: (user as any).lng || null
        });
        
        loadData();
      }
    } else {
      lastLoadedUserIdRef.current = null;
    }
  }, [user, loadData]);

  const [activeProfileTab, setActiveProfileTab] = useState<'history' | 'wishlist' | 'addresses' | 'insights' | 'wallet' | 'khata' | 'settings'>('settings');
  
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    const action = params.get('action');
    const reviewOrderId = params.get('reviewOrderId');
    if (tab && ['history', 'wishlist', 'addresses', 'insights', 'wallet', 'khata', 'settings'].includes(tab)) {
      setActiveProfileTab(tab as any);
    }
    if (action === 'add-money') {
      navigate('/add-money');
    }
    if (reviewOrderId) {
      setActiveProfileTab('history');
      setShowReviewModal({ open: true, orderId: Number(reviewOrderId) });
    }
  }, [location.search]);

  const [khataHistory, setKhataHistory] = useState<any[]>([]);
  const [loadingKhata, setLoadingKhata] = useState(false);

  const fetchKhataHistory = React.useCallback(async () => {
    if (!user) return;
    setKhataHistory(prev => {
      if (prev.length === 0) {
        setLoadingKhata(true);
      }
      return prev;
    });
    try {
      const data = await fetchWithHandling<any[]>(`/api/user/khata/history/${user.id}`, { headers: getAuthHeaders() });
      if (isMountedRef.current && data) {
        setKhataHistory(data);
      }
    } catch (err) {
      console.error('Failed to fetch Khata history:', err);
    } finally {
      if (isMountedRef.current) {
        setLoadingKhata(false);
      }
    }
  }, [user?.id]);

  useEffect(() => {
    if (activeProfileTab === 'khata') {
      fetchKhataHistory();
    }
  }, [activeProfileTab, fetchKhataHistory]);

  
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
    triggerFeedback('medium');
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
  const [newsletterEmail, setNewsletterEmail] = useState(user?.email || '');
  const [isSubscribed, setIsSubscribed] = useState<boolean | null>(null);
  const [checkingNewsletter, setCheckingNewsletter] = useState(false);
  const [submittingNewsletter, setSubmittingNewsletter] = useState(false);

  useEffect(() => {
    const fetchStatus = async () => {
      if (user?.email) {
        setCheckingNewsletter(true);
        const status = await checkNewsletterStatus(user.email);
        setIsSubscribed(status);
        setCheckingNewsletter(false);
      }
    };
    fetchStatus();
  }, [user?.email, checkNewsletterStatus]);

  useEffect(() => {
    if (user?.email && !newsletterEmail) {
      setNewsletterEmail(user.email);
    }
  }, [user]);

  const handleNewsletterAction = async () => {
    if (!newsletterEmail || !isValidEmail(newsletterEmail)) {
      toast.error('Please enter a valid email address');
      return;
    }
    
    setSubmittingNewsletter(true);
    try {
      if (isSubscribed) {
        const success = await unsubscribeNewsletter(newsletterEmail);
        if (success) {
          setIsSubscribed(false);
          toast.success('You have been unsubscribed from our newsletter.');
          logActivity('NEWSLETTER_UNSUBSCRIBE', `User unsubscribed: ${newsletterEmail}`);
        }
      } else {
        const success = await subscribeNewsletter(newsletterEmail);
        if (success) {
          setIsSubscribed(true);
          toast.success('Welcome to the community! You are now subscribed.');
          logActivity('NEWSLETTER_SUBSCRIBE', `User subscribed: ${newsletterEmail}`);
        }
      }
    } catch (err) {
      toast.error('Communication error. Please try again.');
    } finally {
      setSubmittingNewsletter(false);
    }
  };

  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleReviewSubmit = async () => {
    triggerFeedback('medium');
    if (!reviewComment.trim()) {
      toast.error('Please enter a comment');
      return;
    }
    setIsSubmitting(true);
    try {
      const { fetchWithHandling } = await import('@/lib/api');
      const data = await fetchWithHandling<any>('/api/reviews', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          order_id: showReviewModal.orderId,
          rating: reviewRating,
          comment: reviewComment,
          user_name: user?.name
        })
      });
      if (data) {
        toast.success(`Thank you! Your feedback on Order #ORD-${showReviewModal.orderId} has been received`);
        setShowReviewModal({ open: false, orderId: null });
        setReviewComment('');
        setReviewRating(5);
        fetchOrders();
      }
    } catch (err) {
      console.error('Error submitting review:', err);
    } finally {
      setIsSubmitting(false);
    }
  };
  const [wishlistProducts, setWishlistProducts] = useState<Product[]>([]);
  const [loadingWishlist, setLoadingWishlist] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});

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

  const getMonthlySpendingData = () => {
    const activeOrders = orders.filter(o => o.status !== 'cancelled' && o.status !== 'failed');
    const monthsData: Record<string, number> = {};
    const now = new Date();
    
    // Initialize last 6 months sequentially
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = d.toLocaleString('en-US', { month: 'short' });
      const year = d.getFullYear().toString().slice(-2);
      const key = `${monthName} '${year}`;
      monthsData[key] = 0;
    }
    
    activeOrders.forEach(o => {
      const date = new Date(o.created_at);
      const monthName = date.toLocaleString('en-US', { month: 'short' });
      const year = date.getFullYear().toString().slice(-2);
      const key = `${monthName} '${year}`;
      
      const totalAmount = Number(o.total || 0);
      if (key in monthsData) {
        monthsData[key] += totalAmount;
      } else {
        monthsData[key] = totalAmount;
      }
    });
    
    return Object.entries(monthsData).map(([month, amount]) => ({
      month,
      amount: Math.round(amount * 100) / 100
    }));
  };

  // Removed redundant effect block

  const handlePhoneChange = (key: 'phone' | 'alternate_phone', val: string) => {
    const cleaned = val.replace(/\D/g, '').slice(0, 10);
    setFormData({ ...formData, [key]: cleaned });
  };

  const handleSave = async () => {
    triggerFeedback('medium');
    if (isSavingProfile) return;
    // Phone validation
    if (!isValidPhone(formData.phone)) {
      toast.error('Primary phone must be exactly 10 digits');
      return;
    }

    if (formData.alternate_phone && !isValidPhone(formData.alternate_phone)) {
      toast.error('Alternate phone must be exactly 10 digits');
      return;
    }

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

    setIsSavingProfile(true);
    const toastId = toast.loading('Synchronizing profile parameters with secure cloud vault...', { id: 'profile-save-pulse' });
    
    try {
      // Artificial delay to simulate profile security validation (User Request: "Add some delay and lag")
      await new Promise(resolve => setTimeout(resolve, 2800));

      await updateProfile(formData);
      toast.success('Your profile has been securely updated.', { id: toastId });
      setIsEditing(false);
    } catch (err: any) {
      console.error('[CRITICAL] Profile update error:', err);
      toast.error(err?.message || 'Failed to update profile. Please try again.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handlePhotoUpload = (file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      setFormData({ ...formData, profile_photo: result });
      updateProfile({ profile_photo: result });
      toast.success('Profile photo uploaded and processed!');
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

  const { status, details } = useProfileAuthDebug();

  // ... inside Profile return component
  if (isError) {
      return (
        <div className="flex h-screen items-center justify-center p-4">
            <div className="p-8 bg-white rounded-2xl shadow-xl text-center border border-stone-100">
                <h2 className="text-xl font-bold text-stone-900 mb-4">Connection Issue</h2>
                <p className="text-stone-500 mb-6">Unable to load profile data. Please check your connection and retry.</p>
                <button 
                  onClick={() => loadData(true)}
                  className="px-6 py-2 bg-amber-500 text-white rounded-full font-bold shadow-lg hover:shadow-xl transition-all flex items-center gap-2 mx-auto"
                >
                  <RefreshCw size={16} />
                  Retry Loading
                </button>
            </div>
        </div>
      );
  }

  if (isAuthChecking) {
    return (
      <div className="flex h-screen flex-col items-center justify-center p-4 bg-stone-50/50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
        <p className="text-stone-500 font-medium text-sm">Authenticating session...</p>
      </div>
    );
  }

  // If user object is missing, redirect/show login.
  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center p-4 bg-stone-50">
        <div className="p-8 bg-white rounded-3xl shadow-xl text-center border border-stone-200/50 max-w-sm w-full">
            <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-emerald-100 text-emerald-600">
              <Lock size={24} />
            </div>
            <h2 className="text-xl font-bold text-stone-900 mb-2 font-sans">Please log in to continue</h2>
            <p className="text-stone-500 mb-6 text-xs">Account login is required to view your profile settings.</p>
            <p className="text-xs text-stone-400 mb-6 italic">{details}</p>
            <button 
              onClick={() => navigate('/login')}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-semibold shadow-md shadow-emerald-600/10 hover:shadow-lg transition-all"
            >
              Sign In with Google
            </button>
        </div>
      </div>
    );
  }

  // Defensive check with safe fallbacks.
  const displayUserName = user?.name || user?.email?.split('@')[0] || 'Dear Customer';
  const displayUserEmail = user?.email || 'No email registered';

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
    { icon: Info, label: 'Terms & Conditions', path: '/terms-and-conditions', desc: 'Read our usage terms' },
    { icon: Shield, label: 'Privacy Policy', path: '/privacy-policy', desc: 'How we handle your data' },
    { icon: HelpCircle, label: 'Help & Support', path: '/support', desc: 'Get assistance' },
    { icon: MessageSquare, label: 'Contact Us', path: '/contact', desc: 'Reach out to us' },
    { icon: Truck, label: 'Track Order', path: '/track-order', desc: 'Check delivery status', color: 'text-primary' },
  ];

  return (
    <div className="w-full max-w-full min-h-screen bg-stone-50/50 py-8 px-4 sm:px-6 lg:px-8 pb-16 relative overflow-x-hidden">

      <div className="w-full max-w-6xl mx-auto space-y-8 pb-32">
        {/* Profile Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-slate-900 via-stone-900 to-slate-950 rounded-[2.5rem] p-8 md:p-12 shadow-[0_30px_70px_rgba(15,23,42,0.18)] border border-slate-800 relative overflow-hidden group text-white"
        >
          {/* Options / Three Dots */}
          <button 
            className="absolute top-6 right-6 z-20 p-2 text-white/50 hover:text-white hover:bg-white/10 rounded-full transition-colors"
            onClick={() => setActiveProfileTab('settings')}
            title="More Options"
          >
            <MoreVertical size={24} />
          </button>

          {/* Accent Gold Lighting */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/5 rounded-full blur-3xl -translate-y-12 translate-x-12 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl translate-y-12 -translate-x-12 pointer-events-none" />

          <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12 relative z-10">
            <div className="relative group/photo">
              <div 
                className="w-32 h-32 md:w-40 md:h-40 rounded-full bg-slate-800 border-4 border-amber-500/30 overflow-hidden flex items-center justify-center cursor-pointer transition-all hover:scale-105 hover:border-amber-400"
                onClick={() => setShowPhotoSelector(true)}
              >
                {formData.profile_photo ? (
                  <img src={formData.profile_photo} alt={user?.name || 'User'} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-5xl font-serif font-black text-amber-400 uppercase">{user?.name?.[0] || 'U'}</span>
                )}
              </div>
              <motion.button 
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setShowPhotoSelector(true)}
                className="absolute bottom-2 right-2 p-3 bg-amber-500 text-slate-950 rounded-full shadow-xl hover:bg-amber-400 transition-colors"
              >
                <Camera size={20} />
              </motion.button>
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*"
                capture="user"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handlePhotoUpload(file);
                }} 
              />
            </div>

            <div className="flex-1 text-center md:text-left space-y-4">
              <div>
                <h1 className="text-3xl md:text-4xl font-serif font-black text-white tracking-tight leading-none group-hover:text-amber-400 transition-colors">{displayUserName}</h1>
                <p className="text-slate-400 font-bold mt-2.5 flex items-center justify-center md:justify-start gap-1 text-sm">
                  <Mail size={13} className="text-amber-500/70" /> {displayUserEmail}
                </p>
              </div>
              
              <div className="flex flex-wrap justify-center md:justify-start gap-2">
                <div className={cn(
                  "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 border",
                  isUserAdmin 
                    ? "bg-amber-500/10 text-amber-300 border-amber-500/20" 
                    : "bg-white/5 text-stone-300 border-white/10"
                )}>
                  {isUserAdmin ? <Shield size={10} className="text-amber-400" /> : <User size={10} />}
                  {isUserAdmin ? 'Administrator' : user.role}
                </div>
                {user.segment && (
                  <div className="px-4 py-1.5 bg-white/5 border border-white/10 text-slate-300 rounded-full text-[10px] font-black uppercase tracking-widest">
                    {user.segment} Client
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-3 pt-2 justify-center md:justify-start">
                <button 
                  onClick={() => {
                    const nextVal = !isEditing;
                    setIsEditing(nextVal);
                    if (nextVal) {
                      setTimeout(() => {
                        const el = document.getElementById('edit-profile-section');
                        el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }, 150);
                    }
                  }}
                  className={cn(
                    "px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all shadow-md active:scale-95 flex items-center gap-2",
                    isEditing ? "bg-stone-100 text-stone-700 hover:bg-stone-200" : "bg-primary text-white hover:bg-primary/90"
                  )}
                >
                  <Settings size={14} className={isEditing ? "animate-spin" : ""} />
                  {isEditing ? 'Discard Changes' : 'Edit My Profile'}
                </button>
              </div>
            </div>
          </div>

          {/* Quick Stats Banner */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-12 pt-10 border-t border-white/10">
            <button 
              type="button"
              onClick={() => setActiveProfileTab('wallet')}
              className="p-5 bg-white/5 hover:bg-emerald-500/10 border border-white/10 hover:border-emerald-500/30 active:scale-95 transition-all rounded-[2rem] text-center cursor-pointer block w-full outline-none group/stat"
            >
              <div className="flex items-center justify-center gap-1.5 mb-2">
                <Wallet size={12} className="text-emerald-400" />
                <p className="text-[10px] font-black text-amber-500/80 uppercase tracking-widest font-mono">Store Credit</p>
              </div>
              <p className="text-3xl font-black text-white group-hover/stat:text-emerald-400 transition-colors">₹{user.wallet_balance}</p>
              <span className="text-[8px] text-white/30 font-bold uppercase tracking-tighter">Available Balance</span>
            </button>
            <button 
              type="button"
              onClick={() => setActiveProfileTab('history')}
              className="p-5 bg-white/5 hover:bg-slate-700/30 border border-white/10 hover:border-white/20 active:scale-95 transition-all rounded-[2rem] text-center cursor-pointer block w-full outline-none group/stat"
            >
               <div className="flex items-center justify-center gap-1.5 mb-2">
                <Package size={12} className="text-stone-400" />
                <p className="text-[10px] font-black text-amber-500/80 uppercase tracking-widest font-mono">Orders</p>
              </div>
              <p className="text-3xl font-black text-white">{orders.length}</p>
              <span className="text-[8px] text-white/30 font-bold uppercase tracking-tighter">Lifetime Count</span>
            </button>
            <button 
              type="button"
              onClick={() => setActiveProfileTab('wishlist')}
              className="p-5 bg-white/5 hover:bg-pink-500/10 border border-white/10 hover:border-pink-500/20 active:scale-95 transition-all rounded-[2rem] text-center cursor-pointer block w-full outline-none group/stat"
            >
               <div className="flex items-center justify-center gap-1.5 mb-2">
                 <Heart size={12} className="text-pink-400" />
                 <p className="text-[10px] font-black text-amber-500/80 uppercase tracking-widest font-mono">Wishlist</p>
               </div>
              <p className="text-3xl font-black text-white group-hover/stat:text-pink-400 transition-colors">{wishlist.length}</p>
              <span className="text-[8px] text-white/30 font-bold uppercase tracking-tighter">Saved Items</span>
            </button>
            <button 
              type="button"
              onClick={() => setActiveProfileTab('khata')}
              className="p-5 bg-white/5 hover:bg-amber-500/10 border border-white/10 hover:border-amber-500/30 active:scale-95 transition-all rounded-[2rem] text-center cursor-pointer block w-full outline-none group/stat"
            >
               <div className="flex items-center justify-center gap-1.5 mb-2">
                 <RefreshCw size={12} className="text-amber-400" />
                 <p className="text-[10px] font-black text-amber-500/80 uppercase tracking-widest font-mono">Khata Ledger</p>
               </div>
              <p className={cn("text-3xl font-black transition-colors", user.khata_enabled ? "text-amber-400" : "text-white/60")}>
                {user.khata_enabled ? `₹${user.khata_balance}` : user.khata_requested ? '...' : '0'}
              </p>
              <span className="text-[8px] text-white/30 font-bold uppercase tracking-tighter">
                {user.khata_enabled ? 'Active Account' : 'Manual Credit'}
              </span>
            </button>
          </div>
        </motion.div>

        {isEditing && (
          <motion.div 
            id="edit-profile-section"
            ref={editSectionRef}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mt-8 pt-8 border-t border-stone-150"
          >
            <div className="mb-8 text-center md:text-left">
              <h2 className="text-2xl font-serif font-black text-slate-800">Account Modification Panel</h2>
              <p className="text-stone-500 text-sm mt-1">Review and update your profile parameters to keep your identity synchronized.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-primary mb-4">Identity Credentials</h4>
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
                <label className="block text-sm font-bold text-stone-700 mb-1">Owner / Father's Name</label>
                <input 
                  type="text" 
                  className="input-field" 
                  value={formData.owner_name}
                  placeholder="Legal owner name"
                  onChange={(e) => setFormData({...formData, owner_name: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-stone-700 mb-1">Phone Number</label>
                  <input 
                    type="tel" 
                    className={cn(
                      "input-field",
                      formData.phone && !isValidPhone(formData.phone) ? "border-amber-400" : ""
                    )}
                    value={formData.phone}
                    onChange={(e) => handlePhoneChange('phone', e.target.value)}
                    maxLength={10}
                    placeholder="10-digit mobile"
                  />
                  {formData.phone && formData.phone.length > 0 && formData.phone.length < 10 && (
                    <p className="text-[10px] text-amber-600 font-bold mt-1 uppercase">Requires 10 digits ({formData.phone.length}/10)</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-bold text-stone-700 mb-1">Alt. Phone</label>
                  <input 
                    type="tel" 
                    className={cn(
                      "input-field",
                      formData.alternate_phone && !isValidPhone(formData.alternate_phone) ? "border-amber-400" : ""
                    )}
                    value={formData.alternate_phone}
                    onChange={(e) => handlePhoneChange('alternate_phone', e.target.value)}
                    maxLength={10}
                    placeholder="Secondary contact"
                  />
                  {formData.alternate_phone && formData.alternate_phone.length > 0 && formData.alternate_phone.length < 10 && (
                    <p className="text-[10px] text-amber-600 font-bold mt-1 uppercase">Requires 10 digits ({formData.alternate_phone.length}/10)</p>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-stone-700 mb-1">Business Type</label>
                  <select 
                    className="input-field"
                    value={formData.business_type}
                    onChange={(e) => setFormData({...formData, business_type: e.target.value})}
                  >
                    <option value="retail">General Store / Retail</option>
                    <option value="wholesale">Wholesaler</option>
                    <option value="restaurant">Cafe / Restaurant</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                   <label className="block text-sm font-bold text-stone-700 mb-1">GST Number (Optional)</label>
                   <input 
                     type="text" 
                     className="input-field" 
                     value={formData.gst_number}
                     placeholder="Valid GSTIN"
                     onChange={(e) => setFormData({...formData, gst_number: e.target.value})}
                   />
                </div>
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
          </div>
            
          <div className="md:col-span-2 flex justify-end">
              <button 
                onClick={handleSave}
                disabled={isSavingProfile}
                className={cn(
                  "btn-primary px-12 flex items-center justify-center gap-2",
                  isSavingProfile && "opacity-50 cursor-not-allowed"
                )}
              >
                {isSavingProfile ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <span>Save Changes</span>
                )}
              </button>
            </div>
          </motion.div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="md:col-span-2 space-y-6">
            {/* Tabs for Profile Sections */}
            <div className="flex p-1 bg-stone-100/80 rounded-2xl overflow-x-auto md:flex-wrap gap-1 sm:gap-2 no-scrollbar">
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
                  onClick={() => {
                      setActiveProfileTab(tab.id as any);
                      navigate(`/profile?tab=${tab.id}`);
                  }}
                  className={cn(
                    "flex-1 md:flex-none flex items-center justify-center space-x-2 py-3 px-4 rounded-xl text-sm font-bold transition-all shrink-0 whitespace-nowrap",
                    activeProfileTab === tab.id 
                      ? "bg-white text-primary shadow-sm" 
                      : "text-stone-500 hover:text-stone-700 hover:bg-stone-200/50"
                  )}
                >
                <tab.icon size={16} className={activeProfileTab === tab.id ? "text-primary" : "text-stone-400"} />
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
                    className="bg-white rounded-3xl shadow-sm border border-stone-100 p-6 space-y-8"
                >
                    <div className="space-y-4">
                        <div className="bg-stone-50 rounded-2xl border border-stone-100 divide-y divide-stone-100">
                          <div className="flex items-center justify-between p-4">
                              <span>Order Status Updates</span>
                              <div 
                                className={cn("w-12 h-6 rounded-full cursor-pointer relative transition-colors duration-300", (user?.notification_orders !== false) ? "bg-primary" : "bg-stone-200")} 
                                onClick={async () => {
                                  const currentVal = user?.notification_orders !== false;
                                  const newVal = !currentVal;
                                  
                                  // Optimistic Update
                                  const previousUser = { ...user };
                                  setUser({ ...user, notification_orders: newVal } as any);
                                  
                                  try {
                                    const res = await fetchWithHandling<any>('/api/user/update-profile', {
                                      method: 'POST',
                                      headers: getAuthHeaders(),
                                      body: JSON.stringify({ notification_orders: newVal })
                                    });
                                    if (res?.success) {
                                      setUser(res.user);
                                      toast.success('Preference updated');
                                    } else {
                                      setUser(previousUser as any);
                                      toast.error('Failed to sync preference');
                                    }
                                  } catch (err) {
                                    setUser(previousUser as any);
                                    toast.error('Connectivity issue');
                                  }
                                }}>
                                  <div className={cn("absolute top-1 w-4 h-4 bg-white rounded-full transition-transform duration-300 shadow-sm", (user?.notification_orders !== false) ? "left-7" : "left-1")}></div>
                              </div>
                          </div>
                           <div className="flex items-center justify-between p-4">
                              <span>Promotional Announcements</span>
                              <div 
                                className={cn("w-12 h-6 rounded-full cursor-pointer relative transition-colors duration-300", (user?.notification_promotions !== false) ? "bg-primary" : "bg-stone-200")} 
                                onClick={async () => {
                                  const currentVal = user?.notification_promotions !== false;
                                  const newVal = !currentVal;
                                  
                                  // Optimistic Update
                                  const previousUser = { ...user };
                                  setUser({ ...user, notification_promotions: newVal } as any);

                                  try {
                                    const res = await fetchWithHandling<any>('/api/user/update-profile', {
                                      method: 'POST',
                                      headers: getAuthHeaders(),
                                      body: JSON.stringify({ notification_promotions: newVal })
                                    });
                                    if (res?.success) {
                                      setUser(res.user);
                                      toast.success('Preference updated');
                                    } else {
                                      setUser(previousUser as any);
                                      toast.error('Failed to sync preference');
                                    }
                                  } catch (err) {
                                    setUser(previousUser as any);
                                    toast.error('Connectivity issue');
                                  }
                                }}>
                                  <div className={cn("absolute top-1 w-4 h-4 bg-white rounded-full transition-transform duration-300 shadow-sm", (user?.notification_promotions !== false) ? "left-7" : "left-1")}></div>
                              </div>
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
                className="space-y-6"
              >
                {/* Khata Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white p-6 rounded-3xl border border-stone-100 shadow-sm flex flex-col items-center text-center">
                    <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 mb-3">
                      <Clock size={24} />
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-stone-400 mb-1">Credit Limit</p>
                    <p className="text-2xl font-black text-stone-900">₹{user?.credit_limit || 0}</p>
                  </div>
                  <div className="bg-white p-6 rounded-3xl border border-stone-100 shadow-sm flex flex-col items-center text-center">
                    <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center text-red-600 mb-3">
                      <ArrowRight className="rotate-45" size={24} />
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-stone-400 mb-1">Current Dues</p>
                    <p className="text-2xl font-black text-stone-900">₹{user?.khata_balance || 0}</p>
                  </div>
                  <div className="bg-white p-6 rounded-3xl border border-stone-100 shadow-sm flex flex-col items-center text-center">
                    <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 mb-3">
                      <ShieldCheck size={24} />
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-stone-400 mb-1">Available Credit</p>
                    <p className="text-2xl font-black text-stone-900">₹{Math.max(0, (user?.credit_limit || 0) - (user?.khata_balance || 0))}</p>
                  </div>
                </div>

                <div className="bg-white rounded-3xl border border-stone-100 shadow-sm overflow-hidden">
                  <div className="p-6 border-b border-stone-100 flex justify-between items-center bg-stone-50/50">
                    <h3 className="font-black text-lg text-stone-900">Transaction History</h3>
                    <div className="px-3 py-1 bg-stone-200 rounded-full text-[10px] font-bold text-stone-600 uppercase tracking-widest">
                      {khataHistory.length} Entries
                    </div>
                  </div>
                  
                  <div className="p-0">
                    {loadingKhata ? (
                      <div className="text-center py-12 space-y-4">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                        <p className="text-stone-400 text-sm font-medium">Synchronizing Ledger...</p>
                      </div>
                    ) : khataHistory.length === 0 ? (
                      <div className="text-center py-16 px-6">
                        <div className="w-16 h-16 bg-stone-50 rounded-full flex items-center justify-center mx-auto mb-4 text-stone-300">
                          <Clock size={32} />
                        </div>
                        <h3 className="text-stone-900 font-bold">No Records Found</h3>
                        <p className="text-stone-500 text-xs mt-1">Your credit transaction history will appear here once you place Khata orders.</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-stone-50">
                        {khataHistory.map(tx => (
                          <motion.div 
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1 }}
                            key={tx.id} 
                            className="flex justify-between items-center p-5 hover:bg-stone-50/50 transition-colors"
                          >
                            <div className="space-y-1">
                              <p className="font-bold text-stone-800">{tx.description}</p>
                              <div className="flex items-center gap-2 text-stone-400">
                                <Clock size={12} />
                                <p className="text-[10px] font-bold uppercase tracking-wider">{new Date(tx.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                                <span className="text-stone-200">•</span>
                                <p className="text-[10px] font-bold uppercase tracking-wider">ID: #{String(tx.id).slice(-6).toUpperCase()}</p>
                              </div>
                            </div>
                            <div className="text-right flex flex-col items-end">
                              <p className={cn(
                                "text-lg font-black tracking-tighter leading-none mb-1", 
                                tx.type === 'debit' ? 'text-red-600' : 'text-emerald-600'
                              )}>
                                {tx.type === 'debit' ? '-' : '+'}₹{tx.amount.toLocaleString('en-IN')}
                              </p>
                              <span className={cn(
                                "text-[8px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-widest",
                                tx.type === 'debit' ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'
                              )}>
                                {tx.type === 'debit' ? 'Purchased' : 'Settled'}
                              </span>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="bg-blue-50/50 p-6 rounded-3xl border border-blue-100 flex items-start gap-4 mx-2 sm:mx-6 md:mx-0">
                   <div className="p-3 bg-white rounded-2xl text-blue-600 shadow-sm shrink-0">
                      <ShieldCheck size={20} />
                   </div>
                   <div className="space-y-1">
                      <h4 className="text-sm font-bold text-blue-900">Khata Terms & Safety</h4>
                      <p className="text-xs text-blue-700 leading-relaxed">
                        Khata is a credit-based system for our regular customers. Please ensure timely payments to maintain your credit limit. All transactions are logged and verified by the store manager.
                      </p>
                   </div>
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
                    <p className="text-xs text-stone-600 font-medium">{displayPhoneNumber(addr.phone)}</p>
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
                  if(window.confirm('Delete this address?')) {
                    triggerFeedback('heavy');
                    deleteAddress(addr.id);
                  }
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
              <div className="space-y-6">
                {/* Monthly Spending Trend Recharts wrapper */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-3xl shadow-sm border border-stone-100 p-6 space-y-6 overflow-hidden bg-gradient-to-br from-white to-stone-50/20"
                >
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <div className="flex items-center gap-2 text-stone-800">
                        <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                          <TrendingUp size={18} />
                        </div>
                        <h3 className="font-extrabold text-lg tracking-tight">Monthly Spending Trend</h3>
                      </div>
                      <p className="text-xs text-stone-400 mt-1">A timeline of your overall store spending (excluding cancelled or failed orders)</p>
                    </div>
                    {/* Summary Quick Metrics */}
                    {orders.length > 0 && (() => {
                      const monthlySpendingData = getMonthlySpendingData();
                      const totalSpent6m = monthlySpendingData.reduce((acc, item) => acc + item.amount, 0);
                      const avgSpent6m = Math.round((totalSpent6m / 6) * 100) / 100;
                      return (
                        <div className="flex gap-4">
                          <div className="bg-stone-50 border border-stone-150 rounded-xl px-4 py-2 text-right">
                            <span className="text-[9px] text-stone-400 font-bold uppercase tracking-wider block">Total Spent</span>
                            <span className="text-sm font-black text-stone-800">₹{totalSpent6m.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                          </div>
                          <div className="bg-stone-50 border border-stone-150 rounded-xl px-4 py-2 text-right">
                            <span className="text-[9px] text-stone-400 font-bold uppercase tracking-wider block">Avg/Month</span>
                            <span className="text-sm font-black text-stone-800">₹{avgSpent6m.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Chart representation */}
                  {orders.length === 0 ? (
                    <div className="py-8 text-center text-xs text-stone-400 select-none italic">
                      No order details available to generate spending trends.
                    </div>
                  ) : (
                    <div className="w-full h-64 min-w-[200px]" style={{ minWidth: "200px", minHeight: "256px" }}>
                      <ResponsiveContainer width="100%" height="100%" minWidth={200} minHeight={200}>
                        <AreaChart
                          data={getMonthlySpendingData()}
                          margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                        >
                          <defs>
                            <linearGradient id="spendingColor" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                              <stop offset="95%" stopColor="#10b981" stopOpacity={0.01}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f1f1" />
                          <XAxis 
                            dataKey="month" 
                            stroke="#888888" 
                            fontSize={10}
                            fontWeight={600}
                            tickLine={false} 
                            axisLine={false}
                          />
                          <YAxis 
                            stroke="#888888" 
                            fontSize={10} 
                            fontWeight={600}
                            tickLine={false} 
                            axisLine={false}
                            tickFormatter={(v) => `₹${v}`}
                          />
                          <Tooltip 
                            contentStyle={{ 
                              background: '#ffffff', 
                              border: '1px solid #e5e7eb', 
                              borderRadius: '1rem',
                              boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05)',
                              fontFamily: 'Inter, sans-serif'
                            }}
                            formatter={(value: any) => [`₹${Number(value).toFixed(2)}`, 'Spending']}
                            labelClassName="font-extrabold text-[#111827] text-xs"
                          />
                          <Area 
                            type="monotone" 
                            dataKey="amount" 
                            stroke="#10b981" 
                            strokeWidth={2.5}
                            fillOpacity={1} 
                            fill="url(#spendingColor)" 
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </motion.div>

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
                      <Link to="/history?tab=orders" className="text-[10px] text-primary font-black uppercase tracking-widest hover:underline flex items-center gap-1">
                        View Full History <ChevronRight size={10} />
                      </Link>
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
                <div className="divide-y divide-stone-50 space-y-6">
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
                    orders.map((order) => {
                      const orderSubtotal = Number(order.subtotal || order.total || 0);
                      const deliveryCharge = Number(order.delivery_charge || 0);
                      const discountCoupon = Number(order.coupon_discount || order.discount || 0);
                      const walletAmountApplied = Number(order.wallet_used || 0);
                      const computedGrandTotal = Number(order.total || 0);
                      
                      return (
                        <div key={order.id} className="p-6 md:p-8 hover:bg-stone-50/80 transition-all border-b border-stone-100 last:border-0 rounded-3xl mb-6 bg-white/50 shadow-sm hover:shadow-md duration-300">
                          {/* 1. Header with Badge & copy button */}
                          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-black rounded-md tracking-wider uppercase">Receipt Details</span>
                                <h4 className="font-extrabold text-stone-900 tracking-tight text-lg uppercase flex items-center gap-1.5">
                                  #{order.order_id || order.id.toString().slice(-6).toUpperCase()}
                                </h4>
                              </div>
                              <p className="text-xs text-stone-400 mt-1.5 font-semibold flex items-center gap-1">
                                <Clock size={12} /> Ordered: {new Date(order.created_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                              </p>
                            </div>

                            <div className="flex items-center gap-2 flex-wrap">
                              {/* Payment status badge */}
                              <span className={cn(
                                "text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider flex items-center gap-1 border",
                                order.payment_status === 'paid' ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" :
                                order.payment_status === 'failed' ? "bg-red-50 text-red-600 border-red-100" : "bg-amber-50 text-amber-600 border-amber-100"
                              )}>
                                <span className={cn("w-1.5 h-1.5 rounded-full",
                                  order.payment_status === 'paid' ? "bg-emerald-500" :
                                  order.payment_status === 'failed' ? "bg-red-500" : "bg-amber-400"
                                )} />
                                {order.payment_status ? order.payment_status.toUpperCase() : 'PENDING'}
                              </span>

                              {/* Order/Delivery Status badge */}
                              <span className={cn(
                                "text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider border shadow-sm transition-all duration-300",
                                order.status === 'delivered' ? 'bg-emerald-500 text-white border-emerald-500' : 
                                order.status === 'cancelled' ? 'bg-red-500 text-white border-red-500' : 
                                order.status === 'failed' ? 'bg-stone-900 text-white border-stone-900' : 
                                order.status === 'shipped' ? 'bg-blue-500 text-white border-blue-500' :
                                'bg-amber-500 text-white border-amber-500 animate-pulse'
                              )}>
                                {(t(order.status) || (order.status || 'PENDING').toUpperCase())}
                              </span>
                            </div>
                          </div>

                          {/* 2. Items List */}
                          {order.items && order.items.length > 0 && (
                            <div className="mb-6 bg-stone-50/50 rounded-2xl p-4 border border-stone-100/50 space-y-3">
                              <p className="text-[10px] font-black text-stone-400 uppercase tracking-wider">Item Details & Prices (Click to Audit)</p>
                              <div className="space-y-2.5 col-span-2">
                                {order.items.map((item: any, idx: number) => {
                                  const itemKey = `${order.id}-${idx}`;
                                  const isExpanded = !!expandedItems[itemKey];
                                  const itemTotal = Number(item.price || 0) * Number(item.quantity || 1);
                                  return (
                                    <div key={idx} className="bg-white rounded-xl border border-stone-100 overflow-hidden shadow-sm hover:border-stone-350 transition-all">
                                      {/* Row header, clickable to toggle */}
                                      <div 
                                        onClick={() => setExpandedItems(prev => ({ ...prev, [itemKey]: !isExpanded }))}
                                        className="flex justify-between items-center gap-4 p-3 cursor-pointer select-none hover:bg-stone-50/50 transition-colors"
                                      >
                                        <div className="flex items-center gap-3">
                                          <div className="w-10 h-10 bg-stone-100 rounded-lg border border-stone-110 overflow-hidden flex items-center justify-center shrink-0">
                                            {item.image_url ? (
                                              <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                            ) : (
                                              <ShoppingBag size={16} className="text-stone-300" />
                                            )}
                                          </div>
                                          <div>
                                            <p className="text-xs font-bold text-stone-800 line-clamp-1">{item.name}</p>
                                            <p className="text-[10px] text-stone-400 font-medium mt-0.5 flex items-center gap-1.5">
                                              <span>₹{item.price} × {item.quantity}</span>
                                              {item.variant_name && <span className="text-[8px] bg-stone-100 text-stone-500 px-1.5 py-0.2 rounded font-black">{item.variant_name}</span>}
                                            </p>
                                          </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <p className="text-xs font-extrabold text-stone-700">₹{itemTotal}</p>
                                          <motion.div animate={{ rotate: isExpanded ? 90 : 0 }} className="text-stone-400">
                                            <ChevronRight size={14} />
                                          </motion.div>
                                        </div>
                                      </div>

                                      {/* Animated Expandable Details Panel */}
                                      <AnimatePresence initial={false}>
                                        {isExpanded && (
                                          <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: "auto", opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.2, ease: "easeInOut" }}
                                            className="overflow-hidden"
                                          >
                                            <div className="px-4 pb-4 pt-2 border-t border-stone-100 bg-stone-50/30 text-stone-600 font-medium space-y-2.5 text-[11px] font-sans">
                                              <p className="text-[8px] font-black text-stone-400 uppercase tracking-widest select-none">TRANSPARENCY DETAILS SHEET</p>
                                              
                                              <div className="space-y-1 bg-white p-3 rounded-xl border border-stone-100 shadow-sm text-stone-500">
                                                <div className="flex justify-between">
                                                  <span>Price per Unit:</span>
                                                  <span className="font-extrabold text-stone-800">₹{Number(item.price).toFixed(2)}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                  <span>Quantity:</span>
                                                  <span className="font-extrabold text-stone-800">× {item.quantity}</span>
                                                </div>
                                                <div className="flex justify-between border-t border-stone-100 pt-1.5 mt-1.5 text-stone-600 font-bold">
                                                  <span className="text-stone-700">Item Subtotal:</span>
                                                  <span className="font-black text-stone-900 font-sans">₹{itemTotal.toFixed(2)}</span>
                                                </div>
                                              </div>

                                              <div className="text-[10px] text-amber-800 leading-relaxed italic bg-amber-500/5 p-2.5 rounded-xl flex items-start gap-1.5 border border-amber-500/10">
                                                <Info size={12} className="shrink-0 mt-0.5 text-amber-600" />
                                                <span>Dynamic Formula Checklist: Unit Price × Demand Volume. Tax matching is processed at the aggregate payment level as displayed in the checkout math ledger below.</span>
                                              </div>

                                              <div className="flex gap-2.5 pt-2">
                                                <Link 
                                                  to={`/product/${item.product_id || item.id}#reviews`} 
                                                  className="flex-1 flex items-center justify-center gap-1.5 bg-stone-900 hover:bg-stone-800 text-white text-[10px] font-black uppercase tracking-wider py-2.5 rounded-xl transition-all shadow-sm"
                                                >
                                                  <Star size={11} fill="currentColor" className="text-amber-400" />
                                                  <span>Leave Product Review</span>
                                                </Link>
                                                <Link 
                                                  to={`/product/${item.product_id || item.id}`} 
                                                  className="flex-1 flex items-center justify-center bg-white hover:bg-stone-50 border border-stone-200 text-stone-700 text-[10px] font-black uppercase tracking-wider py-2.5 rounded-xl transition-all"
                                                >
                                                  <span>View Product Details</span>
                                                </Link>
                                              </div>
                                            </div>
                                          </motion.div>
                                        )}
                                      </AnimatePresence>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {/* 3. Calculations step-by-step breakdown */}
                          <div className="mb-6 bg-stone-50 p-4 rounded-2xl border border-stone-100 space-y-3.5">
                            <div className="flex justify-between items-center">
                              <p className="text-[10px] font-black text-stone-400 uppercase tracking-wider">Audit Trail & Calculations (Formula Verified)</p>
                              <span className="text-[9px] bg-emerald-500/10 text-emerald-700 border border-emerald-500/10 px-2 py-0.5 rounded-md font-bold uppercase tracking-wider flex items-center gap-1">
                                <ShieldCheck size={10} /> Math Verified
                              </span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-semibold text-stone-600 border-b border-stone-200/60 pb-3">
                              <div className="space-y-1.5">
                                <div className="flex justify-between">
                                  <span>Cart Subtotal</span>
                                  <span>₹{orderSubtotal.toFixed(2)}</span>
                                </div>
                                {deliveryCharge > 0 && (
                                  <div className="flex justify-between">
                                    <span>Delivery Charge</span>
                                    <span>+₹{deliveryCharge.toFixed(2)}</span>
                                  </div>
                                )}
                              </div>
                              <div className="space-y-1.5">
                                {discountCoupon > 0 && (
                                  <div className="flex justify-between text-emerald-600">
                                    <span>Coupon Discount</span>
                                    <span>-₹{discountCoupon.toFixed(2)}</span>
                                  </div>
                                )}
                                {walletAmountApplied > 0 && (
                                  <div className="flex justify-between text-primary">
                                    <span>Wallet Cash Applied</span>
                                    <span>-₹{walletAmountApplied.toFixed(2)}</span>
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="flex justify-between items-center pt-1.5">
                              <div>
                                <span className="text-[10px] text-stone-400 uppercase font-black tracking-wider font-sans">Total Chargeable</span>
                                <p className="text-[9px] text-stone-400 leading-none italic mt-0.5 font-sans">
                                  (Subtotal {deliveryCharge > 0 && '+ Delivery'} {discountCoupon > 0 && '- Coupon'} {walletAmountApplied > 0 && '- Wallet'})
                                </p>
                              </div>
                              <p className="text-xl font-black text-primary tracking-tight">₹{computedGrandTotal.toFixed(2)}</p>
                            </div>
                          </div>

                          {/* 4. Timeline Shipping stepper */}
                          <div className="mb-6 p-4 bg-stone-50 rounded-2xl border border-stone-100">
                            {order.status === 'shipped' && order.estimated_delivery_at && (
                              <div className="mb-4 flex items-center justify-between p-2.5 bg-primary/5 border border-primary/10 rounded-xl">
                                <div className="flex items-center space-x-2">
                                  <Clock size={14} className="text-primary animate-pulse shrink-0" />
                                  <span className="text-[11px] font-bold text-primary">Est. Arrival: {new Date(order.estimated_delivery_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                                {order.last_status_update && (
                                  <span className="text-[9px] bg-white px-2 py-0.5 rounded-full border border-stone-100 shadow-sm text-stone-500 font-medium italic truncate max-w-[200px]">
                                    "{order.last_status_update}"
                                  </span>
                                )}
                              </div>
                            )}

                            {(order.status === 'cancelled' || order.status === 'failed') && order.rejection_reason && (
                              <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-xl">
                                <p className="text-[10px] font-black text-red-600 uppercase tracking-widest mb-1 font-sans">Reason for {order.status === 'cancelled' ? 'Cancellation' : 'Failure'}</p>
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
                                        ${isActive ? 'text-primary font-black' : 'text-stone-400'}
                                      `}>
                                        {step.label}
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                              <div className="absolute top-[15px] left-6 right-6 h-[1.5px] bg-stone-200 -z-0">
                                <div 
                                  className={cn(
                                    "h-full transition-all duration-1000 ease-out",
                                    order.status === 'delivered' ? "bg-emerald-500" :
                                    order.status === 'cancelled' || order.status === 'failed' ? "bg-red-500" : "bg-primary"
                                  )}
                                  style={{ width: `${(Math.max(0, ['pending', 'processing', 'shipped', 'delivered'].indexOf(order.status)) / 3) * 100}%` }}
                                />
                              </div>
                            </div>
                          </div>

                          {/* 5. Utility commands / Actions */}
                          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-stone-100/50 p-3 rounded-2xl border border-stone-200/30">
                            <div className="flex items-center gap-4 flex-wrap">
                              <Link 
                                to={`/invoice/${order.id}`}
                                className="text-[10px] font-black text-stone-600 hover:text-primary tracking-wider uppercase flex items-center gap-1 transition-all"
                              >
                                <Info size={12} />
                                <span>{t('view_details') || 'DETAILS'}</span>
                              </Link>

                              {order.status === 'pending' && (
                                <button 
                                  onClick={() => {
                                    setEditingOrder(JSON.parse(JSON.stringify(order)));
                                    setShowEditOrderModal(true);
                                  }}
                                  className="text-[10px] font-black text-amber-600 hover:text-amber-700 tracking-wider uppercase flex items-center gap-1 transition-all"
                                >
                                  <Settings size={12} />
                                  <span>EDIT ORDER</span>
                                </button>
                              )}

                              {order.payment_status === 'failed' && order.status !== 'cancelled' && (
                                <Link 
                                  to={`/track-order?orderId=${order.order_id || order.id}&phone=${order.user_phone || user?.phone}`}
                                  className="text-[10px] font-black text-primary hover:underline tracking-wider uppercase flex items-center gap-1 transition-all"
                                >
                                  <RefreshCw size={12} />
                                  <span>RETRY PAYMENT</span>
                                </Link>
                              )}

                              {order.status === 'delivered' && (
                                <div className="flex items-center gap-4">
                                  {order.is_reviewed ? (
                                    <div className="text-[10px] font-black text-amber-500 flex items-center gap-0.5 cursor-default bg-amber-50 px-2.5 py-1 rounded-lg">
                                      <Star size={10} fill="currentColor" />
                                      <span>Reviewed</span>
                                    </div>
                                  ) : (
                                    <button 
                                      onClick={() => setShowReviewModal({ open: true, orderId: order.id })}
                                      className="text-[10px] font-black text-primary hover:underline flex items-center gap-1"
                                    >
                                      <Star size={12} />
                                      <span>Review Item</span>
                                    </button>
                                  )}
                                  <button 
                                    onClick={() => openReturnModal(order.id)}
                                    className="text-[10px] font-black text-stone-500 hover:text-red-500 transition-colors flex items-center gap-1"
                                  >
                                    <RefreshCw size={12} />
                                    <span>Return</span>
                                  </button>
                                </div>
                              )}
                            </div>

                            <Link 
                              to={`/track-order?orderId=${order.order_id || order.id}&phone=${user?.phone}`}
                              className="bg-stone-900 hover:bg-stone-800 text-white text-[10px] font-black tracking-widest uppercase flex items-center gap-1.5 px-4 py-2.5 rounded-xl transition-all w-full sm:w-auto text-center justify-center cursor-pointer active:scale-95"
                            >
                              <span>Track Live Shipment</span>
                              <Truck size={14} />
                            </Link>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </motion.div>
            </div>
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
                            src={product.image_url} 
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
                    <div className="flex gap-4">
                      <button 
                        onClick={() => {
                          logger.info('Wallet recharge intent triggered');
                          navigate('/add-money');
                        }}
                        className="bg-white text-stone-900 px-8 py-3 rounded-2xl font-bold flex items-center space-x-2 hover:bg-primary hover:text-white transition-all shadow-xl shadow-stone-900/10"
                      >
                        <Plus size={20} />
                        <span>Add Money</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Wallet Tracking UI */}
                <div className="bg-white rounded-3xl shadow-sm border border-stone-100 overflow-hidden">
                    <div className="p-6 border-b border-stone-100 flex justify-between items-center bg-stone-50/50">
                        <div>
                            <h3 className="font-black text-lg text-stone-900 uppercase tracking-tight">{t('wallet_tracking') || 'Wallet Tracking'}</h3>
                            <Link to="/history?tab=wallet" className="text-[10px] text-primary font-black uppercase tracking-widest hover:underline flex items-center gap-1">
                                View Full Ledger <ChevronRight size={10} />
                            </Link>
                        </div>
                        <div className="px-3 py-1 bg-stone-100 rounded-full text-[10px] font-bold text-stone-500 uppercase tracking-widest">
                           {walletHistory.length} Entries
                        </div>
                    </div>
                    
                    <div className="p-0">
                        {loadingHistory ? (
                           <div className="text-center py-12 space-y-4">
                             <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                             <p className="text-stone-400 text-sm font-medium">Loading History...</p>
                           </div>
                        ) : walletHistory.length === 0 ? (
                           <div className="py-16 text-center">
                              <div className="w-16 h-16 bg-stone-50 rounded-full flex items-center justify-center mx-auto mb-4 text-stone-300">
                                 <Wallet size={32} />
                              </div>
                              <p className="text-stone-400 italic">No wallet transactions found.</p>
                           </div>
                        ) : (
                          <div className="divide-y divide-stone-50">
                            {walletHistory.map(tx => (
                              <div key={tx.id} className="flex justify-between items-center p-5 hover:bg-stone-50/50 transition-colors">
                                <div className="space-y-1">
                                  <p className="font-bold text-stone-800">{tx.description}</p>
                                  <div className="flex items-center gap-2 text-stone-400">
                                    <Clock size={12} />
                                    <p className="text-[10px] font-bold uppercase tracking-wider">{new Date(tx.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                                    <span className="text-stone-200">•</span>
                                    <p className="text-[10px] font-bold uppercase tracking-wider">Ref: #{String(tx.id).slice(-8).toUpperCase()}</p>
                                  </div>
                                </div>
                                <div className="text-right flex flex-col items-end">
                                  <p className={cn(
                                    "text-lg font-black tracking-tighter leading-none mb-1", 
                                    tx.type === 'debit' ? 'text-red-600' : (tx.status === 'pending' ? 'text-amber-500' : 'text-emerald-600')
                                  )}>
                                    {tx.type === 'debit' ? '-' : '+'}₹{tx.amount.toLocaleString('en-IN')}
                                  </p>
                                  <div className="flex flex-col items-end gap-1">
                                    <span className={cn(
                                      "text-[8px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-widest",
                                      tx.type === 'debit' ? 'bg-red-50 text-red-600' : (tx.status === 'pending' ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600')
                                    )}>
                                      {tx.type === 'debit' ? 'Spent' : (tx.status === 'pending' ? 'Verifying' : 'Added')}
                                    </span>
                                    {tx.status === 'pending' && (
                                       <span className="text-[7px] text-amber-400 font-bold uppercase animate-pulse">Request Sent</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                    </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Newsletter Section */}
          <div className="bg-emerald-50 rounded-3xl p-8 border border-emerald-100 shadow-sm">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
              <div className="text-center lg:text-left max-w-xl">
                <div className="flex items-center justify-center lg:justify-start gap-3 mb-2">
                  <Mail className="text-emerald-600" size={24} />
                  <h3 className="text-xl font-black text-stone-900">Community Connections</h3>
                </div>
                <p className="text-sm text-stone-600 font-medium">
                  {isSubscribed ? 
                    "You are currently part of our priority circular. We'll keep you notified of wholesale stock arrivals and seasonal discounts." :
                    "Join the General Store Karyana Shop community for exclusive wholesale price updates, seasonal arrivals, and priority stock alerts."
                  }
                </p>
              </div>
              <div className="flex flex-col sm:flex-row w-full lg:w-auto bg-white p-2 rounded-2xl shadow-md border border-stone-100 gap-2">
                <div className="relative flex-1 min-w-[240px]">
                  <input 
                    type="email" 
                    placeholder="Your secure email address"
                    value={newsletterEmail}
                    onChange={(e) => setNewsletterEmail(e.target.value)}
                    className="w-full px-4 py-3 text-sm outline-none bg-transparent font-medium text-stone-700"
                  />
                  {checkingNewsletter && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <Loader2 size={14} className="animate-spin text-stone-400" />
                    </div>
                  )}
                </div>
                <button 
                  onClick={handleNewsletterAction}
                  disabled={submittingNewsletter}
                  className={cn(
                    "px-8 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-lg active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2",
                    isSubscribed ? 
                      "bg-stone-100 text-stone-500 hover:bg-stone-200" : 
                      "bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-200"
                  )}
                >
                  {submittingNewsletter ? <Loader2 size={14} className="animate-spin" /> : null}
                  {isSubscribed ? 'Unsubscribe' : 'Enroll Now'}
                </button>
              </div>
            </div>
            {isSubscribed === false && newsletterEmail === user?.email && (
              <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-widest mt-4 text-center lg:text-left">
                ● Status: Not Enrolled. We miss you in the circle!
              </p>
            )}
            {isSubscribed === true && (
              <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-widest mt-4 text-center lg:text-left">
                ● Status: Active Subscriber. You're receiving priority updates.
              </p>
            )}
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
        <div className="bg-white rounded-3xl border border-stone-100 shadow-sm overflow-hidden">
          <div className="p-8 border-b border-stone-100 bg-stone-50/30 flex items-center justify-between">
            <div>
              <h3 className="text-xl font-serif font-black flex items-center space-x-3">
                <div className="p-2 bg-emerald-100 text-emerald-600 rounded-xl">
                  <Book size={22} />
                </div>
                <span>Khata Credit</span>
              </h3>
              <p className="text-[10px] text-stone-400 font-bold uppercase tracking-[0.2em] mt-3">Buy Now, Pay Later Protocol</p>
            </div>
            {user?.khata_allowed ? (
              <div className="px-3 py-1 bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg shadow-emerald-500/20">
                Active
              </div>
            ) : user?.khata_requested ? (
              <div className="px-3 py-1 bg-amber-500 text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg shadow-amber-500/20 animate-pulse">
                In Review
              </div>
            ) : null}
          </div>

          <div className="p-8 space-y-6">
            {!user?.khata_allowed && !user?.khata_requested && (
              <div className="space-y-4">
                <div className="p-6 bg-stone-50 rounded-2xl border-2 border-dashed border-stone-200">
                  <p className="text-sm font-bold text-stone-600 mb-2">Want to buy groceries on credit?</p>
                  <p className="text-xs text-stone-400 leading-relaxed">Applying for Khata allows you to place orders and pay for them later at your convenience. Admin approval required based on your transaction history.</p>
                </div>
                <button 
                  onClick={() => {
                    setShowKhataWizard(true);
                    triggerFeedback('medium');
                  }}
                  className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold text-xs transition-all active:scale-98 hover:shadow-md cursor-pointer"
                >
                  Apply for Khata Access (Interactive Setup)
                </button>
              </div>
            )}

            {user?.khata_requested && !user?.khata_allowed && (
              <div className="p-6 bg-amber-50 rounded-2xl border border-amber-100 flex items-center gap-4">
                <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center text-amber-500">
                   <Clock size={24} />
                </div>
                <div className="flex-1">
                   <p className="text-sm font-black text-amber-900">Application Under Review</p>
                   <p className="text-xs text-amber-600">Verification usually takes 24-48 business hours.</p>
                </div>
              </div>
            )}

            {user?.khata_allowed && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                 <div className="p-6 bg-emerald-50 rounded-3xl border border-emerald-100">
                    <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">Current Limit</p>
                    <p className="text-2xl font-black text-emerald-900">₹{user.khata_limit || '5000'}</p>
                 </div>
                 <div className="p-6 bg-stone-900 rounded-3xl border border-stone-800 text-white">
                    <p className="text-[10px] font-black text-stone-500 uppercase tracking-widest mb-1">Balance Used</p>
                    <p className="text-2xl font-black">₹0</p>
                 </div>
              </div>
            )}
          </div>
        </div>

      {/* Settings & Sidebar */}
      <div className="space-y-6">
        <div className="bg-white rounded-3xl border border-stone-100 shadow-sm overflow-hidden">
          <div className="p-8 border-b border-stone-100 bg-stone-50/30">
            <h3 className="text-xl font-serif font-black flex items-center space-x-3">
              <div className="p-2 bg-primary/10 rounded-xl">
                <Settings size={22} className="text-primary" />
              </div>
              <span>Preferences</span>
            </h3>
            <p className="text-[10px] text-stone-400 font-bold uppercase tracking-[0.2em] mt-3">Tailor your workspace</p>
          </div>
          
          <div className="divide-y divide-stone-50">
            <SettingToggle 
              icon={Bell} 
              label="Real-time Alerts" 
              desc="Instant order & promotional pings" 
              enabled={notifications} 
              onToggle={() => setNotifications(!notifications)} 
              color="text-blue-500"
            />
            <SettingToggle 
              icon={Activity} 
              label="Kinetic Feedback" 
              desc="Tactile response on interactions" 
              enabled={vibration} 
              onToggle={() => setVibration(!vibration)} 
              color="text-emerald-500"
            />
            <SettingToggle 
              icon={MessageSquare} 
              label="Auditory Cues" 
              desc="Atmospheric sounds for app state" 
              enabled={sound} 
              onToggle={() => setSound(!sound)} 
              color="text-purple-500"
            />
              
              <div className="p-6 hover:bg-stone-50 transition-colors cursor-pointer group">
                <div 
                  className="flex items-center justify-between"
                  onClick={() => {
                    setShowLanguageSelector(!showLanguageSelector);
                    triggerFeedback('light');
                  }}
                >
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-stone-100 rounded-2xl text-stone-500 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                      <Globe size={20} />
                    </div>
                    <div>
                      <p className="font-bold text-stone-700">Language</p>
                      <p className="text-[10px] text-stone-400 font-medium">
                        {language === 'en' ? 'ENGLISH (EN)' : language === 'hi' ? 'HINDI (HI)' : 'PUNJABI (PA)'}
                      </p>
                    </div>
                  </div>
                  <ChevronDown size={18} className={cn("text-stone-300 group-hover:text-primary transition-all duration-300", showLanguageSelector && "rotate-180 text-primary")} />
                </div>

                <AnimatePresence>
                  {showLanguageSelector && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="mt-4 pl-14 space-y-2 overflow-hidden"
                    >
                      {[
                        { code: 'en', label: 'English (EN)' },
                        { code: 'hi', label: 'Hindi (HI)' },
                        { code: 'pa', label: 'Punjabi (PA)' }
                      ].map((lang) => (
                        <div 
                          key={lang.code}
                          onClick={() => {
                            setLanguage(lang.code as any);
                            toast.success(`Language set to ${lang.label}`);
                            triggerFeedback('medium');
                          }}
                          className={cn(
                            "flex items-center justify-between py-2 px-3.5 rounded-xl transition-all border",
                            language === lang.code 
                              ? "bg-primary/5 text-primary border-primary/20 font-bold" 
                              : "text-stone-500 border-transparent hover:bg-stone-100"
                          )}
                        >
                          <span className="text-xs">{lang.label}</span>
                          {language === lang.code && <Check size={14} className="text-primary" />}
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div 
                className="p-6 hover:bg-stone-50 transition-colors cursor-pointer group"
                onClick={handlePurgeCache}
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
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePurgeCache();
                    }}
                    className="text-xs font-bold text-stone-400 group-hover:text-red-500 uppercase tracking-wider py-2 px-4 rounded-xl bg-stone-100 group-hover:bg-red-50 transition-colors"
                  >
                    Clear
                  </button>
                </div>
              </div>
            </div>
          </div>

          <button 
            onClick={() => {
              triggerFeedback('heavy');
              logout();
            }}
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
                    <div className="p-3 bg-stone-100 rounded-2xl text-stone-500">
                      <Download size={20} />
                    </div>
                    <div>
                      <p className="font-bold text-stone-700">Export Account Data</p>
                      <p className="text-[10px] text-stone-400 font-medium">Configure and compile customized CSV spreadsheets or high-contrast official PDF dossiers</p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                       <button 
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          setShowExportModal(true);
                          triggerFeedback('medium');
                        }} 
                        className="px-6 py-2.5 bg-stone-900 text-white hover:bg-emerald-600 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 cursor-pointer shadow-md shadow-stone-900/10"
                      >
                      <ShieldCheck size={12} />
                      <span>Configure Export Plan</span>
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
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          triggerFeedback('heavy');
                          handleDataRequest('delete'); 
                        }} 
                        className="text-[10px] font-black text-red-500 uppercase tracking-widest hover:underline"
                      >
                        Request Deletion
                      </button>
                    ) : (
                      <div className="flex flex-col items-end">
                        <span className={cn(
                          "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest text-white",
                          deletionStatus.status === 'PENDING' ? "bg-amber-500 shadow-sm" : "bg-emerald-500 shadow-sm"
                        )}>
                          {deletionStatus.status === 'PENDING' ? 'Deletion Requested' : 'Processed'}
                        </span>
                        <p className="text-[10px] font-bold text-stone-400 mt-1">{new Date(deletionStatus.created_at).toLocaleDateString()}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
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
                <h3 className="font-bold text-lg">Review Order #{showReviewModal.orderId}</h3>
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
                  triggerFeedback('medium');
                  if (isSavingAddress) return;
                  setIsSavingAddress(true);
                  try {
                    const formData = new FormData(e.currentTarget);
                    const data = Object.fromEntries(formData);
                    
                    const phone = data.phone as string;
                    if (!isValidPhone(phone)) {
                      toast.error('Please enter a valid 10-digit mobile number');
                      return;
                    }

                    await saveAddress({
                      ...data,
                      id: editingAddress?.id,
                      is_default: data.is_default === 'on'
                    } as any);
                    setShowAddressModal(false);
                  } catch (err: any) {
                    console.error('[CRITICAL] Address save error:', err);
                    toast.error(err?.message || 'Failed to save address');
                  } finally {
                    setIsSavingAddress(false);
                  }
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
                      type="tel"
                      required
                      defaultValue={editingAddress?.phone}
                      placeholder="10 digit number"
                      maxLength={10}
                      onKeyPress={(e) => {
                        if (!/[0-9]/.test(e.key)) {
                          e.preventDefault();
                        }
                      }}
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
                    <label className="text-[10px] font-black text-stone-400 uppercase tracking-[0.2em] mb-2 block">State</label>
                    <input name="state" required readOnly defaultValue={editingAddress?.state} className="w-full px-4 py-3 bg-stone-100 border border-stone-200 rounded-2xl outline-none focus:border-primary transition-all font-bold text-stone-600" />
                  </div>

                  <div className="col-span-2">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input type="checkbox" name="is_default" defaultChecked={editingAddress?.is_default} className="w-4 h-4 text-primary rounded border-stone-300 focus:ring-primary" />
                      <span className="text-xs font-bold text-stone-700">Set as default address</span>
                    </label>
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
                    disabled={isSavingAddress}
                    className={cn(
                      "w-full bg-primary text-white py-4 rounded-2xl font-black shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all uppercase tracking-[0.2em] text-xs flex items-center justify-center gap-2",
                      isSavingAddress && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    {isSavingAddress ? (
                      <>
                        <RefreshCw size={14} className="animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <span>Confirm & Save Address</span>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showEditOrderModal && editingOrder && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl border border-stone-100"
            >
              <div className="bg-amber-500 p-6 text-white flex justify-between items-center">
                <div className="flex items-center space-x-3">
                  <div className="p-2.5 bg-white/20 rounded-xl">
                    <ShoppingBag size={20} />
                  </div>
                  <div>
                    <h2 className="text-xl font-black tracking-tight leading-none">Edit Order #{editingOrder.order_id || editingOrder.id}</h2>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80 mt-1">Pending Confirmation</p>
                  </div>
                </div>
                <button onClick={() => setShowEditOrderModal(false)} className="p-2 hover:bg-white/20 rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 max-h-[60vh] overflow-y-auto no-scrollbar space-y-4">
                {editingOrder.items.map((item: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between p-4 bg-stone-50 rounded-2xl border border-stone-100 group transition-all hover:bg-white hover:shadow-sm">
                    <div className="flex items-center space-x-4">
                      <div className="w-16 h-16 bg-white rounded-xl border border-stone-100 overflow-hidden flex items-center justify-center">
                        {item.image_url ? (
                          <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                        ) : (
                          <ShoppingBag size={24} className="text-stone-200" />
                        )}
                      </div>
                      <div>
                        <p className="font-extrabold text-stone-900 group-hover:text-amber-600 transition-colors">{item.name}</p>
                        <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mt-1">₹{item.price} per unit</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center bg-white border border-stone-200 rounded-xl p-1 shadow-sm">
                        <button 
                          onClick={() => {
                            const newItems = [...editingOrder.items];
                            if (newItems[idx].quantity > 1) {
                              newItems[idx].quantity--;
                              const newTotal = newItems.reduce((acc, it) => acc + (it.price * (it.quantity || 0)), 0);
                              setEditingOrder({ ...editingOrder, items: newItems, total: newTotal });
                            }
                          }}
                          className="w-8 h-8 flex items-center justify-center hover:bg-stone-50 rounded-lg transition-colors text-stone-500"
                        >
                          -
                        </button>
                        <span className="w-10 text-center font-black text-sm text-stone-900">{item.quantity}</span>
                        <button 
                          onClick={() => {
                            const newItems = [...editingOrder.items];
                            newItems[idx].quantity = (newItems[idx].quantity || 0) + 1;
                            const newTotal = newItems.reduce((acc, it) => acc + (it.price * (it.quantity || 0)), 0);
                            setEditingOrder({ ...editingOrder, items: newItems, total: newTotal });
                          }}
                          className="w-8 h-8 flex items-center justify-center hover:bg-stone-50 rounded-lg transition-colors text-stone-500"
                        >
                          +
                        </button>
                      </div>
                      <button 
                        onClick={() => {
                          if (editingOrder.items.length <= 1) {
                            toast.error('Order must have at least one item');
                            return;
                          }
                          const newItems = editingOrder.items.filter((_: any, i: number) => i !== idx);
                          const newTotal = newItems.reduce((acc, it) => acc + (it.price * (it.quantity || 0)), 0);
                          setEditingOrder({ ...editingOrder, items: newItems, total: newTotal });
                        }}
                        className="p-2 text-stone-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-8 bg-stone-50/50 border-t border-stone-100">
                <div className="flex justify-between items-center mb-6">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-stone-400 uppercase tracking-[0.2em] leading-none">New Confirmation Total</p>
                    <p className="text-sm font-medium text-stone-500 italic">Adjusted items will show in details</p>
                  </div>
                  <p className="text-4xl font-black text-amber-600 tracking-tighter leading-none">₹{editingOrder.total}</p>
                </div>

                <div className="flex gap-4">
                  <button 
                    onClick={() => setShowEditOrderModal(false)}
                    className="flex-1 py-4 text-stone-400 hover:text-stone-600 font-black uppercase tracking-[0.2em] text-[10px] transition-colors"
                  >
                    Discard Changes
                  </button>
                  <button 
                  onClick={() => {
                    triggerFeedback('medium');
                    handleUpdateOrder();
                  }}
                    disabled={isUpdatingOrder}
                    className={cn(
                      "flex-[2] btn-primary py-4 text-xs flex items-center justify-center space-x-3 shadow-xl shadow-primary/20",
                      isUpdatingOrder && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    {isUpdatingOrder ? (
                      <>
                        <RefreshCw size={16} className="animate-spin" />
                        <span>Applying Updates...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle size={16} />
                        <span>Confirm Adjustments</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Camera Capture and Photo Choice Modals */}
      <AnimatePresence>
        {showPhotoSelector && (
          <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white text-stone-900 rounded-3xl p-6 max-w-sm w-full border border-stone-200/50 shadow-2xl relative"
            >
              <button 
                onClick={() => setShowPhotoSelector(false)}
                className="absolute top-4 right-4 p-1 rounded-full text-stone-400 hover:text-stone-600 hover:bg-stone-100 transition-all cursor-pointer"
              >
                <X size={18} />
              </button>
              <h3 className="text-lg font-bold text-center mb-5 font-serif text-slate-900">Update Profile Picture</h3>
              <div className="space-y-3">
                <button 
                  onClick={async () => {
                    setShowPhotoSelector(false);
                    setShowCameraModal(true);
                    await startCamera();
                  }}
                  className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-bold flex items-center justify-center gap-3 transition-colors shadow-sm cursor-pointer"
                >
                  <Camera size={18} />
                  <span>Take Live Photo</span>
                </button>
                <button 
                  onClick={() => {
                    setShowPhotoSelector(false);
                    fileInputRef.current?.click();
                  }}
                  className="w-full py-3.5 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-2xl font-bold flex items-center justify-center gap-3 transition-colors border border-stone-200 cursor-pointer"
                >
                  <Plus size={18} />
                  <span>Upload from Device</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {showCameraModal && (
          <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex flex-col items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-950 text-white rounded-3xl overflow-hidden max-w-md w-full border border-slate-800 shadow-2xl flex flex-col relative"
            >
              <div className="flex items-center justify-between p-4 border-b border-slate-900">
                <h3 className="text-md font-bold tracking-tight text-white flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                  Live Camera Preview
                </h3>
                <button 
                  onClick={() => {
                    stopCamera();
                    setShowCameraModal(false);
                  }}
                  className="p-1.5 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="relative aspect-square w-full bg-black flex items-center justify-center overflow-hidden">
                <video 
                  ref={videoRef} 
                  autoPlay 
                  playsInline 
                  muted 
                  className="w-full h-full object-cover scale-x-[-1]"
                />
                
                <div className="absolute inset-0 pointer-events-none border-[30px] md:border-[40px] border-black/50 flex items-center justify-center">
                  <div className="w-full h-full rounded-full border-2 border-dashed border-amber-500/80 pointer-events-none animate-pulse" />
                </div>
              </div>

              <div className="p-6 bg-slate-900 flex flex-col items-center gap-4">
                <span className="text-[11px] font-medium text-slate-400 text-center">
                  Position your face centered inside the camera guide
                </span>
                
                <div className="flex items-center gap-6">
                  <button 
                    onClick={() => {
                      stopCamera();
                      setShowCameraModal(false);
                    }}
                    className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold font-mono uppercase tracking-widest transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  
                  <button 
                    onClick={capturePhoto}
                    className="w-16 h-16 rounded-full bg-amber-500 hover:bg-amber-400 flex items-center justify-center text-slate-950 border-4 border-slate-950 active:scale-95 transition-transform shadow-lg cursor-pointer animate-pulse"
                    title="Capture Photo"
                  >
                    <div className="w-6 h-6 rounded-full bg-slate-950 border border-amber-500" />
                  </button>
                  
                  <div className="w-12" />
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {showManageAccountModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 text-left">
            {/* Backdrop */}
            <div 
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowManageAccountModal(false)}
            ></div>
            
            {/* Modal Container */}
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative bg-white rounded-3xl p-6 md:p-8 w-full max-w-md shadow-2xl border border-stone-100 z-10 max-h-[80vh] overflow-y-auto"
            >
              <h3 className="text-xl font-serif font-black text-stone-900 mb-2 flex items-center gap-2">
                <User className="text-amber-500" />
                <span>Personal Information</span>
              </h3>
              <p className="text-stone-500 text-xs mb-6">
                Keep your details up to date to ensure fast delivery and account safety.
              </p>
              
              <form onSubmit={async (e) => {
                e.preventDefault();
                setIsSavingAccount(true);
                try {
                  // 1. Firebase Auth display name update
                  if (auth?.currentUser) {
                    const { updateProfile: firebaseUpdateProfile } = await import('firebase/auth');
                    await firebaseUpdateProfile(auth.currentUser, {
                      displayName: accountName
                    });
                  }
                  
                  // 2. Database update-profile call
                  await updateProfile({
                    name: accountName,
                    phone: accountPhone
                  });
                  
                  setShowManageAccountModal(false);
                } catch (err: any) {
                  console.error('[CRITICAL] Account update failure:', err);
                  toast.error(err.message || 'Verification or update failed.');
                } finally {
                  setIsSavingAccount(false);
                }
              }} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-1.5 font-mono">
                    Full Name
                  </label>
                  <input 
                    type="text" 
                    required
                    value={accountName}
                    onChange={(e) => setAccountName(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:outline-none focus:border-amber-500 font-medium text-stone-900 bg-stone-50/50 text-sm"
                    placeholder="e.g. Parth Gulyani"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-1.5 font-mono">
                    Mobile Number
                  </label>
                  <input 
                    type="text" 
                    required
                    value={accountPhone}
                    onChange={(e) => setAccountPhone(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:outline-none focus:border-amber-500 font-medium text-stone-900 bg-stone-50/50 text-sm"
                    placeholder="e.g. +91 98765 43210"
                  />
                </div>
                
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowManageAccountModal(false)}
                    className="flex-1 py-3 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold rounded-xl text-xs uppercase tracking-wider transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingAccount}
                    className="flex-1 py-3 bg-amber-500 hover:bg-amber-400 disabled:bg-amber-300 text-stone-950 font-bold rounded-xl text-xs uppercase tracking-wider transition-colors flex items-center justify-center gap-2"
                  >
                    {isSavingAccount ? (
                      <>
                        <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
                        <span>Saving...</span>
                      </>
                    ) : (
                      <span>Save Changes</span>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {showKhataWizard && (
          <KhataWizard 
            isOpen={showKhataWizard} 
            onClose={() => setShowKhataWizard(false)} 
            onSuccess={refreshUser} 
          />
        )}

        {showExportModal && (
          <ExportManagement 
            isOpen={showExportModal} 
            onClose={() => setShowExportModal(false)}
            orders={orders}
            walletHistory={walletHistory}
          />
        )}

        {showDeleteConfirmModal && (
          <div id="delete-account-modal" className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/90 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl border border-stone-100 space-y-6"
            >
              <div className="space-y-2 text-center">
                <div className="w-16 h-16 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mx-auto border border-red-100">
                  <AlertCircle size={28} />
                </div>
                <h3 className="text-xl font-serif font-black text-stone-900">Irreversible Action</h3>
                <p className="text-xs text-stone-400 font-extrabold uppercase tracking-widest font-mono text-red-500">Security Access Node Deletion</p>
              </div>

              <div className="p-4 bg-stone-50 rounded-2xl border border-stone-100 text-xs text-stone-500 leading-relaxed text-center space-y-2">
                <p>
                  You are initiating a formal request to permanently delete your Hind General Store account and erase your connected database attributes. 
                </p>
                <p className="font-bold text-stone-800">
                  This action is irreversible once finalized by the security team.
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-wider text-stone-400">Reason for Request (Optional)</label>
                  <input
                    type="text"
                    value={deleteReason}
                    onChange={(e) => setDeleteReason(e.target.value)}
                    placeholder="E.g., Privacy concerns, moving out, etc."
                    className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-800 focus:outline-none focus:border-red-500 transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-wider text-stone-400 flex justify-between">
                    <span>Confirmation Code</span>
                    <span className="text-red-500 font-bold">Type "DELETE"</span>
                  </label>
                  <input
                    type="text"
                    value={deleteConfirmText}
                    placeholder="Type DELETE to confirm"
                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                    className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-800 text-center font-mono font-bold uppercase tracking-widest focus:outline-none focus:border-red-500 transition-colors"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirmModal(false)}
                  disabled={deleteIsSubmitting}
                  className="flex-1 py-3 bg-stone-100 hover:bg-stone-250 text-stone-750 font-bold rounded-2xl text-xs uppercase tracking-wider transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={submitDeletionRequest}
                  disabled={deleteIsSubmitting || deleteConfirmText !== 'DELETE'}
                  className="flex-1 py-3 bg-red-600 hover:bg-red-700 disabled:bg-stone-100 disabled:text-stone-300 text-white font-extrabold rounded-2xl text-xs uppercase tracking-wider transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-red-500/10"
                >
                  {deleteIsSubmitting ? (
                    <>
                      <Loader2 size={12} className="animate-spin" />
                      <span>Sending...</span>
                    </>
                  ) : (
                    <span>Delete Account</span>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
    </div>
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
            triggerFeedback('light');
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
