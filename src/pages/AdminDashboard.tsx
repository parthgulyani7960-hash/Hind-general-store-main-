import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { withErrorReporting } from '../lib/uiUtils';
import { handleAppError } from '../lib/errorUtils';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, AreaChart, Area, PieChart, Pie, Cell, Legend
} from 'recharts';
import { 
  LayoutDashboard, ShoppingBag, Package, Users, MessageSquare, 
  Settings, CreditCard, Activity, TrendingUp, AlertTriangle,
  ChevronRight, ChevronLeft, Search, Filter, MoreVertical, Tag, Receipt, ArrowRight,
  BarChart3, Plus, Trash2, Download, Star, Clock, CheckCircle2,
  Calendar, X, Upload, History, Eye, Check, MessageCircle, Camera, Printer,
  MapPin, Phone, Globe, Shield, ShieldCheck, Bell, Database, RefreshCw, ShieldAlert,
  Image as ImageIcon, List, UserPlus, Send, Share2, ExternalLink, LogOut,
  StickyNote, Truck, Home, Navigation, IndianRupee, Layers, MousePointer, Copy,
  Menu, RotateCcw, PieChart as PieChartIcon, Zap, Target, Wallet, ArrowDown, Sparkles,
  MousePointer2, Megaphone, ImageOff, Briefcase, Mail, Pencil, Smartphone, Layout, 
  FileText, HelpCircle, Palette, Server, TrendingDown, Fingerprint, Bug
} from 'lucide-react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { useStore } from '../StoreContext';
import { cn, Order } from '../types';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import FeatureToggles from '../components/admin/FeatureToggles';
import ProductImageManager from '../components/admin/ProductImageManager';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import AdminSidebar from '../components/admin/AdminSidebar';
import { EmptyState } from '../components/EmptyState';
import { 
  generateOrderInvoicePDF, 
  generateUserExportPDF,
  generateAdminCustomerReportPDF
} from '../services/pdfService';
import { logErrorToFirestore } from '../services/errorLogger';
import OverviewTabHeader from '../components/admin/tabs/OverviewTabHeader';

// Fix for default marker icon
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

type Tab = 'Overview' | 'Analytics' | 'Announcements' | 'Orders' | 'Logistics' | 'Product Catalog' | 'Categories' | 'Customers' | 'Wallet Requests' | 'Reviews' | 'Coupons' | 'Roles' | 'Support Tickets' | 'Newsletter' | 'Expenses' | 'Store Settings' | 'Payment Settings' | 'System Status' | 'Suspicious Activities' | 'Promotions' | 'Bulk Discounts' | 'Feature Toggles' | 'Suppliers' | 'Returns' | 'Audit Logs' | 'Bug Reports' | 'Data Exports';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { user, adminTheme, setAdminTheme, simulatedRole, setSimulatedRole, logout, hasPermission } = useStore();
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<Tab>('Overview');
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');
  const [debouncedGlobalSearchQuery, setDebouncedGlobalSearchQuery] = useState('');
  
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedGlobalSearchQuery(globalSearchQuery), 500);
    return () => clearTimeout(timer);
  }, [globalSearchQuery]);
  
  const DataExportsView = () => {
    const [exports, setExports] = useState<any[]>([]);
    
    useEffect(() => {
        fetch('/api/admin/data-exports')
          .then(res => {
            if (!res.ok) throw new Error('Failed to fetch exports');
            return res.json();
          })
          .then(setExports)
          .catch(err => console.error('Error fetching data exports:', err));
    }, []);
    
    const approve = withErrorReporting(async (id: number) => {
        const res = await fetch(`/api/admin/data-exports/${id}/approve`, { method: 'POST' });
        if (res.ok) {
            setExports(exports.map(e => e.id === id ? {...e, status: 'APPROVED'} : e));
            toast.success('Approved');
        } else {
            throw new Error('Failed to approve export');
        }
    }, 'Approve Export Request');

    const reject = withErrorReporting(async (id: number) => {
        const res = await fetch(`/api/admin/data-exports/${id}/reject`, { method: 'POST' });
        if (res.ok) {
            setExports(exports.map(e => e.id === id ? {...e, status: 'REJECTED'} : e));
            toast.success('Rejected');
        } else {
            throw new Error('Failed to reject export');
        }
    }, 'Reject Export Request');

    return (
        <div className="bg-white rounded-3xl p-8 border border-stone-100 shadow-sm">
            <h2 className="text-2xl font-bold mb-6">Data Export Requests</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                  <thead className="text-[10px] uppercase font-black tracking-widest text-stone-400">
                      <tr>
                          <th className="py-2">User</th>
                          <th className="py-2 text-center">Date Requested</th>
                          <th className="py-2 text-center">Status</th>
                          <th className="py-2 text-right">Action</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                      {exports.map((e: any) => (
                          <tr key={e.id}>
                              <td className="py-4 text-sm font-bold">{e.user_name}</td>
                              <td className="py-4 text-xs text-center">{new Date(e.created_at).toLocaleString()}</td>
                              <td className="py-4 text-xs font-black text-center">{e.status}</td>
                              <td className="py-4 text-right">
                                  {e.status === 'PENDING_REVIEW' && (
                                      <div className="flex gap-2 justify-end">
                                          <button onClick={() => approve(e.id)} className="bg-emerald-600 text-white p-2 rounded text-[10px] font-bold hover:bg-emerald-700">Approve</button>
                                          <button onClick={() => reject(e.id)} className="bg-red-500 text-white p-2 rounded text-[10px] font-bold hover:bg-red-600">Reject</button>
                                      </div>
                                  )}
                              </td>
                          </tr>
                      ))}
                  </tbody>
              </table>
            </div>
        </div>
    );
};
  const [newProduct, setNewProduct] = useState({ 
    name: '', description: '', price: '', stock: '', category: 'Grocery', image: '', 
    retail_price: '', wholesale_price: '', discount: '0', reorder_point: '10', max_qty: '0', is_listed: true,
    images: [] as string[],
    specifications: {} as Record<string, string>,
    batch_number: '',
    expiry_date: ''
  });
  const [stats, setStats] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [config, setConfig] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [walletModal, setWalletModal] = useState<{ open: boolean; userId: number | null }>({ open: false, userId: null });
  const [walletAmount, setWalletAmount] = useState('');
  const [walletType, setWalletType] = useState<'credit' | 'debit'>('credit');
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('All');
  const [orderUserIdFilter, setOrderUserIdFilter] = useState<string>('');
  const [orderDateStart, setOrderDateStart] = useState<string>('');
  const [orderDateEnd, setOrderDateEnd] = useState<string>('');
  const [orderSearchTerm, setOrderSearchTerm] = useState('');
  const [debouncedOrderSearchTerm, setDebouncedOrderSearchTerm] = useState('');
  
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedOrderSearchTerm(orderSearchTerm), 500);
    return () => clearTimeout(timer);
  }, [orderSearchTerm]);
  const [ordersViewMode, setOrdersViewMode] = useState<'table' | 'kanban'>('table');
  const [orderSortBy, setOrderSortBy] = useState<string>('date');
  const [orderSortOrder, setOrderSortOrder] = useState<'asc' | 'desc'>('desc');
  const [coupons, setCoupons] = useState<any[]>([]);
  const [bulkDiscounts, setBulkDiscounts] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<any[]>([]);
  const [expiringSoon, setExpiringSoon] = useState<any[]>([]);
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [productModal, setProductModal] = useState({ open: false, mode: 'add' as 'add' | 'edit' });
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [productSearchTerm, setProductSearchTerm] = useState('');
  const [productSortBy, setProductSortBy] = useState<'name' | 'price' | 'stock' | 'created_at'>('name');
  const [categoryBatchModal, setCategoryBatchModal] = useState({ open: false });
  const [activeActionMenuId, setActiveActionMenuId] = useState<number | string | null>(null);
  const [newUserCount, setNewUserCount] = useState(0);

  // Polling for real-time stats
  useEffect(() => {
    fetchStats();
    const pollStats = setInterval(() => {
      fetchStats();
    }, 30000); // Poll every 30s to reduce load
    return () => clearInterval(pollStats);
  }, []);

  const getDisplayLabel = (tab: string) => {
    const mapping: Record<string, string> = {
      'Overview': 'Dashboard',
      'Analytics': 'Sales Reports',
      'Announcements': 'Announcements',
      'Orders': 'Orders',
      'Product Catalog': 'Products',
      'Categories': 'Categories',
      'Logistics': 'Delivery',
      'Suppliers': 'Suppliers',
      'Returns': 'Returns',
      'Wallet Requests': 'Wallet Top-ups',
      'Coupons': 'Coupons',
      'Bulk Discounts': 'Bulk Pricing',
      'Expenses': 'Expenses',
      'Customers': 'Customers',
      'Reviews': 'Reviews',
      'Support Tickets': 'Support',
      'Newsletter': 'Newsletter',
      'Store Settings': 'Settings',
      'System Status': 'System Health',
      'Suspicious Activities': 'Security',
      'Audit Logs': 'Activity Logs',
      'Bug Reports': 'Bugs'
    };
    return mapping[tab] || tab;
  };

  // Verify auth and role
  useEffect(() => {
    if (users.length > 0) {
      const yesterday = new Date();
      yesterday.setHours(yesterday.getHours() - 24);
      const newOnes = users.filter(u => new Date(u.created_at) > yesterday).length;
      setNewUserCount(newOnes);
    }
  }, [users]);

  useEffect(() => {
    console.log("Admin Dashboard Auth Check: user =", user);
    if (user) {
        console.log("User Role:", user.role);
    }
  }, [user]);

  if (!user) {
    return <div className="p-8 text-center text-stone-600">Please log in to access the admin dashboard.</div>;
  }
  if (user.role !== 'admin') {
    return <div className="p-8 text-center text-red-500">Access denied. Your role is {user.role}. Admin privileges are required.</div>;
  }


  const fetchStats = async () => {
    try {
      const res = await fetch('/api/admin/stats');
      if (!res.ok) throw new Error(`Stats failure: ${res.status}`);
      const data = await res.json();
      setStats(data || {});
    } catch (err: any) {
      console.error('Stats fetch error:', err);
      logErrorToFirestore(err, 'Dashboard Stats Fetch Failure');
      toast.error('Unable to load dashboard stats - error reported to admin console');
    }
  };

  const fetchExpiringProducts = async () => {
    try {
      const res = await fetch('/api/admin/inventory/expiring');
      if (res.ok) {
        const data = await res.json();
        setExpiringSoon(data);
      }
    } catch (err) {
      console.error('Failed to fetch expiring products:', err);
    }
  };

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (orderStatusFilter !== 'All') params.append('status', orderStatusFilter.toLowerCase());
      if (orderDateStart) params.append('startDate', orderDateStart);
      if (orderDateEnd) params.append('endDate', orderDateEnd);
      if (debouncedOrderSearchTerm) params.append('search', debouncedOrderSearchTerm);
      if (orderUserIdFilter) params.append('userId', orderUserIdFilter);
      params.append('sortBy', orderSortBy);
      params.append('sortOrder', orderSortOrder);
      
      const res = await fetch(`/api/admin/orders?${params.toString()}`);
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to fetch orders: ${res.status}`);
      }
      setOrders(await res.json());
    } catch (err: any) {
      console.error(err);
      toast.error(`Failed to fetch orders: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchReturns = async () => {
    try {
        const res = await fetch('/api/admin/returns');
        if (!res.ok) throw new Error('Failed to fetch returns');
        setReturns(await res.json());
    } catch (err: any) {
        handleAppError(err, 'Failed to fetch returns', 'fetchReturns');
    }
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      console.log('Fetching products...');
      const res = await fetch('/api/products');
      if (res.ok) {
        const data = await res.json();
        console.log('Products fetched:', data);
        setAllProducts(data);
        setLowStockProducts(data.filter((p: any) => p.stock <= (p.reorder_point || 5)));
      } else {
        console.error('Failed to fetch products:', res.status, res.statusText);
        throw new Error('Failed to fetch products');
      }
    } catch (err) {
      console.error('Error fetching products:', err);
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role !== 'admin') return;
    
    if (activeTab === 'Overview') {
      fetchStats();
      fetchProducts();
    } else if (activeTab === 'Orders') {
      fetchOrders();
    } else if (activeTab === 'Products') {
      fetchProducts();
    } else if (activeTab === 'Promotions') {
      fetchPromotions();
      fetchPromotionRules();
    } else if (activeTab === 'Bulk Discounts') {
      fetchBulkDiscounts();
    }
  }, [activeTab, user, orderStatusFilter, orderUserIdFilter, orderDateStart, orderDateEnd, debouncedOrderSearchTerm, orderSortBy, orderSortOrder]);

  const [newBatchCategory, setNewBatchCategory] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [imageModal, setImageModal] = useState({ open: false, productId: null as number | null, images: [] as string[] });
  const [couponModal, setCouponModal] = useState<{ open: boolean; mode: 'add' | 'edit'; editingId?: number | string }>({ open: false, mode: 'add' });
  const [expenseModal, setExpenseModal] = useState({ open: false });
  const [newCoupon, setNewCoupon] = useState({ code: '', type: 'flat', value: '', min_order: '', usage_limit: '', limit_per_user: '1' });
  const [newExpense, setNewExpense] = useState({ description: '', amount: '', category: 'Stock', date: new Date().toISOString().split('T')[0] });
  const [walletHistoryModal, setWalletHistoryModal] = useState<{ open: boolean; userId: number | null; history: any[] }>({ open: false, userId: null, history: [] });
  const [bulkUploadLoading, setBulkUploadLoading] = useState(false);
  const [newSpec, setNewSpec] = useState({ key: '', value: '' });
  const [categories, setCategories] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [newsletter, setNewsletter] = useState<any[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [ticketMessages, setTicketMessages] = useState<any[]>([]);
  const [replyMessage, setReplyMessage] = useState('');
  const [categoryModal, setCategoryModal] = useState({ open: false, mode: 'add' as 'add' | 'edit' });
  const [newCategory, setNewCategory] = useState({ name: '', icon: 'Package' });
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [customerModal, setCustomerModal] = useState({ open: false, user: null as any });
  const [orderModal, setOrderModal] = useState({ open: false, order: null as any, statusHistory: [] as any[] });
  const [orderHistory, setOrderHistory] = useState([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [notificationModal, setNotificationModal] = useState({ open: false });
  const [newNotification, setNewNotification] = useState({ 
    title: '', 
    message: '', 
    type: 'ad',
    priority: 'medium',
    target_role: 'all',
    expires_at: ''
  });
  const [selectedProducts, setSelectedProducts] = useState<number[]>([]);
  const [selectedOrders, setSelectedOrders] = useState<number[]>([]);
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [analyticsTimeframe, setAnalyticsTimeframe] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [analyticsStartDate, setAnalyticsStartDate] = useState<string>('');
  const [analyticsEndDate, setAnalyticsEndDate] = useState<string>('');
  const [analyticsCategory, setAnalyticsCategory] = useState<string>('all');
  const [analyticsSegment, setAnalyticsSegment] = useState<string>('all');
  const [isFetchingAnalytics, setIsFetchingAnalytics] = useState(false);
  const [roles, setRoles] = useState<any[]>([]);
  const [roleModal, setRoleModal] = useState({ open: false, mode: 'add' as 'add' | 'edit', role: null as any });
  const [newRole, setNewRole] = useState({ name: '', permissions: [] as string[] });
  const [searchSuggestions, setSearchSuggestions] = useState<string[]>([]);
  const [suspiciousActivities, setSuspiciousActivities] = useState<any[]>([]);
  const [systemLogs, setSystemLogs] = useState<any[]>([]);
  const [isRefreshingLogs, setIsRefreshingLogs] = useState(false);
  const [reviewResponseModal, setReviewResponseModal] = useState<{ open: boolean; review: any }>({ open: false, review: null });
  const [reviewResponse, setReviewResponse] = useState('');
  const [promotions, setPromotions] = useState<any[]>([]);
  const [promotionRules, setPromotionRules] = useState<any[]>([]);
  const [promotionRuleModal, setPromotionRuleModal] = useState({ open: false, mode: 'add' as 'add' | 'edit', id: null as number | null });
  const [newPromotionRule, setNewPromotionRule] = useState({ title: '', type: 'percentage', target_type: 'all', target_id: '', condition_qty: 1, discount_value: 0, active: true });
  const [promotionModal, setPromotionModal] = useState({ open: false, mode: 'add' as 'add' | 'edit', id: null as number | null });
  const [promotionProductsModal, setPromotionProductsModal] = useState({ open: false, promotionId: null as number | null });
  const [linkedProductIds, setLinkedProductIds] = useState<number[]>([]);
  const [newPromotion, setNewPromotion] = useState({ title: '', description: '', image_url: '', link: '', active: true, target_role: 'all', start_time: '', end_time: '', banner_type: 'standard', is_default: false });
  const [deliveryFee, setDeliveryFee] = useState('0');
  const [freeDeliveryThreshold, setFreeDeliveryThreshold] = useState('500');
  const [tncContent, setTncContent] = useState('');
  const [faqContent, setFaqContent] = useState('');
  const [deliveryAreas, setDeliveryAreas] = useState<any[]>([]);
  const [deliveryAreaModal, setDeliveryAreaModal] = useState({ open: false, mode: 'add' as 'add' | 'edit', area: null as any });
  const [newDeliveryArea, setNewDeliveryArea] = useState({ name: '', fee: '0', min_order: '0' });

  const [productVariants, setProductVariants] = useState<any[]>([]);
  const [variantModal, setVariantModal] = useState({ open: false, mode: 'add' as 'add' | 'edit', variant: null as any, productId: null as number | null });
  const [newVariant, setNewVariant] = useState({ name: '', price: '', stock: '', unit_quantity: '1', is_default: false });

  const [selectedSegment, setSelectedSegment] = useState('All');
  const getCustomerSegment = (user: any) => user.segment || 'New';
  const filteredUsers = selectedSegment === 'All' 
    ? users 
    : users.filter(u => getCustomerSegment(u) === selectedSegment);
  const segments = ['All', ...Array.from(new Set(users.map(u => getCustomerSegment(u))))];

  const fetchOrderStatusHistory = async (orderId: number) => {
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/status-history`);
      if (res.ok) {
        const data = await res.json();
        setOrderModal(prev => ({ ...prev, statusHistory: data.history }));
      }
    } catch (err: any) {
      handleAppError(err, 'Failed to fetch status history', 'fetchOrderStatusHistory');
    }
  };

  useEffect(() => {
    if (orderModal.open && orderModal.order) {
      fetchOrderStatusHistory(orderModal.order.id);
    }
  }, [orderModal.open, orderModal.order?.id]);
  const [globalSearchResults, setGlobalSearchResults] = useState<{ products: any[], orders: any[], users: any[], suspicious?: any[] } | null>(null);
  const [searchFilter, setSearchFilter] = useState<'all' | 'products' | 'orders' | 'users' | 'suspicious'>('all');
  const [isGlobalSearching, setIsGlobalSearching] = useState(false);
  const [customerActivities, setCustomerActivities] = useState<any[]>([]);
  const [customerOrders, setCustomerOrders] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const fetchCustomerActivities = async (userId: number) => {
    try {
      const res = await fetch(`/api/admin/activities?userId=${userId}`);
      if (res.ok) {
        const data = await res.json();
        setCustomerActivities(data);
      }
    } catch (err) {
      console.error('Failed to fetch individual customer activities');
    }
  };

  useEffect(() => {
    if (customerModal.open && customerModal.user) {
      fetchCustomerActivities(customerModal.user.id);
    }
  }, [customerModal.open, customerModal.user?.id]);

  // Enhanced Product Filters
  const [productStockFilter, setProductStockFilter] = useState<'all' | 'low' | 'out'>('all');
  const [productDiscountFilter, setProductDiscountFilter] = useState<'all' | 'discounted'>('all');
  const [productCategoryFilter, setProductCategoryFilter] = useState<string>('all');
  const [productListedFilter, setProductListedFilter] = useState<'all' | 'listed' | 'unlisted'>('all');
  const [productDateFilter, setProductDateFilter] = useState<string>('');

  // Customer History State
  const [customerHistoryModal, setCustomerHistoryModal] = useState<{ open: boolean; userId: number | null; orders: any[] }>({ open: false, userId: null, orders: [] });

  // Stock Entry State
  const [stockEntryModal, setStockEntryModal] = useState<{ open: boolean, product: any }>({ open: false, product: null });
  const [purchaseForm, setPurchaseForm] = useState({ supplier_id: '', product_id: '', quantity: '', cost_price: '', invoice_number: '', batch_number: '', expiry_date: '' });

  const handlePurchaseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/purchases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(purchaseForm)
      });
      if (res.ok) {
        toast.success('Purchase recorded successfully');
        setPurchaseForm({ supplier_id: '', product_id: '', quantity: '', cost_price: '', invoice_number: '', batch_number: '', expiry_date: '' });
      } else {
        const data = await res.json();
        toast.error(data.message || 'Failed to record purchase');
      }
    } catch (err) {
      toast.error('Failed to record purchase');
    }
  };

  const [walletRequests, setWalletRequests] = useState<any[]>([]);
  const [runners, setRunners] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [isFetchingAudit, setIsFetchingAudit] = useState(false);
  const [runnerModal, setRunnerModal] = useState({ open: false, mode: 'add' as 'add' | 'edit', runner: null as any });
  const [newRunner, setNewRunner] = useState({ name: '', phone: '' });

  const fetchRunners = async () => {
    try {
      const res = await fetch('/api/admin/runners');
      const data = await res.json();
      setRunners(data);
    } catch (err) {
      console.error('Failed to fetch runners');
    }
  };

  const fetchAuditLogs = async (target_type = 'all', limit = 100) => {
    setIsFetchingAudit(true);
    try {
      const res = await fetch(`/api/admin/audit-logs?target_type=${target_type}&limit=${limit}`);
      const data = await res.json();
      setAuditLogs(data);
    } catch (err) {
      console.error('Failed to fetch audit logs');
    } finally {
      setIsFetchingAudit(false);
    }
  };

  const fetchSuspiciousActivities = async () => {
    try {
      const res = await fetch('/api/admin/suspicious-activities');
      const data = await res.json();
      setSuspiciousActivities(data);
    } catch (err) {
      console.error('Failed to fetch suspicious activities');
    }
  };

  const handleResolveSuspicious = async (id: number) => {
    try {
      const res = await fetch(`/api/admin/suspicious-activities/${id}/resolve`, { method: 'POST' });
      if (res.ok) {
        toast.success('Activity resolved');
        fetchSuspiciousActivities();
      }
    } catch (err) {
      toast.error('Failed to resolve activity');
    }
  };

  const handleAssignRunner = async (orderId: number, runnerId: number) => {
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/assign-runner`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ runner_id: runnerId, estimated_delivery_minutes: 30 })
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Runner assigned and order dispatched!');
        fetchOrders(); // Refresh orders
        fetchRunners(); // Refresh runners
      } else {
        toast.error(data.message);
      }
    } catch (err) {
      toast.error('Failed to assign runner');
    }
  };

  const [auditLogLimit, setAuditLogLimit] = useState(500);
  const [auditLogType, setAuditLogType] = useState('all');

  useEffect(() => {
    if (activeTab === 'Audit Logs') {
      fetchAuditLogs(auditLogType, auditLogLimit);
    }
  }, [activeTab, auditLogType, auditLogLimit]);

  const handleSaveRunner = async () => {
    try {
      const res = await fetch('/api/admin/runners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRunner)
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Runner added successfully');
        setRunnerModal({ open: false, mode: 'add', runner: null });
        setNewRunner({ name: '', phone: '' });
        fetchRunners();
      } else {
        toast.error(data.message);
      }
    } catch (err) {
      toast.error('Failed to save runner');
    }
  };

  const fetchWalletRequests = async () => {
    try {
      const res = await fetch('/api/admin/wallet/requests');
      const data = await res.json();
      setWalletRequests(data);
    } catch (err) {
      console.error('Failed to fetch wallet requests:', err);
    }
  };

  useEffect(() => {
    if (activeTab === 'Wallet Requests') {
      fetchWalletRequests();
    }
  }, [activeTab]);

  const handleApproveWalletRequest = async (id: number) => {
    try {
      const res = await fetch(`/api/admin/wallet/requests/${id}/approve`, { method: 'POST' });
      if (res.ok) {
        toast.success('Wallet request approved');
        fetchWalletRequests();
      }
    } catch (err) {
      toast.error('Failed to approve request');
    }
  };

  const handleRejectWalletRequest = async (id: number) => {
    const reason = prompt('Enter rejection reason:');
    if (reason === null) return;
    try {
      const res = await fetch(`/api/admin/wallet/requests/${id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason })
      });
      if (res.ok) {
        toast.success('Wallet request rejected');
        fetchWalletRequests();
      }
    } catch (err) {
      toast.error('Failed to reject request');
    }
  };
  const [poData, setPoData] = useState<any[] | null>(null);
  const [showPOPrint, setShowPOPrint] = useState(false);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [supplierModal, setSupplierModal] = useState({ open: false, mode: 'add' as 'add' | 'edit', supplier: null as any });
  const [newSupplier, setNewSupplier] = useState({ name: '', contact_person: '', email: '', phone: '', address: '' });
  const [returns, setReturns] = useState<any[]>([]);


  const handleApproveReturn = async (returnObj: any) => {
    const amount = prompt(`Enter refund amount to drop in ${returnObj.user_name}'s wallet for Order #${returnObj.order_num}:`, returnObj.refund_amount || 0);
    if (amount === null) return;

    const restock = confirm(`Do you want to restock these ${returnObj.quantity} items back into the inventory?`);
    
    try {
      const res = await fetch(`/api/admin/returns/${returnObj.id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          refund_amount: parseFloat(amount),
          restock: restock 
        })
      });
      if (res.ok) {
        toast.success(`Return approved. ₹${amount} added to user wallet.${restock ? ' Stock updated.' : ''}`);
        fetchReturns();
      } else {
        toast.error('Failed to approve return');
      }
    } catch (err) {
      toast.error('Failed to approve return');
    }
  };

  const handleRejectReturn = async (id: number) => {
    if (!confirm('Reject this return request?')) return;
    try {
      const res = await fetch(`/api/admin/returns/${id}/reject`, { method: 'POST' });
      if (res.ok) {
        toast.success('Return rejected');
        fetchReturns();
      }
    } catch (err) {
      toast.error('Failed to reject return');
    }
  };

  const fetchSuppliers = async () => {
    try {
      const res = await fetch('/api/admin/suppliers');
      const data = await res.json();
      setSuppliers(data);
    } catch (err) {
      console.error('Failed to fetch suppliers:', err);
    }
  };

  useEffect(() => {
    if (activeTab === 'Suppliers') {
      fetchSuppliers();
    } else if (activeTab === 'Returns') {
      fetchReturns();
    }
  }, [activeTab]);

  const handleSupplierSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = supplierModal.mode === 'add' 
      ? '/api/admin/suppliers' 
      : `/api/admin/suppliers/${supplierModal.supplier.id}`;
    const method = supplierModal.mode === 'add' ? 'POST' : 'PUT';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSupplier)
      });
      if (res.ok) {
        toast.success(`Supplier ${supplierModal.mode === 'add' ? 'created' : 'updated'} successfully`);
        setSupplierModal({ open: false, mode: 'add', supplier: null });
        fetchSuppliers();
      } else {
        const data = await res.json();
        toast.error(data.message || 'Failed to save supplier');
      }
    } catch (err) {
      toast.error('Failed to save supplier');
    }
  };

  const handleDeleteSupplier = async (id: number) => {
    if (!confirm('Are you sure you want to delete this supplier? This will also unlink them from their products.')) return;
    try {
      const res = await fetch(`/api/admin/suppliers/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Supplier deleted');
        fetchSuppliers();
      }
    } catch (err) {
      toast.error('Failed to delete supplier');
    }
  };

  const [bulkDiscountModal, setBulkDiscountModal] = useState({ open: false, mode: 'add' as 'add' | 'edit', discount: null as any });
  const [newBulkDiscount, setNewBulkDiscount] = useState({ 
    entity_type: 'product' as 'product' | 'category', 
    entity_id: '', 
    min_qty: '5', 
    discount_type: 'percentage' as 'percentage' | 'flat', 
    discount_value: '10',
    active: true
  });


  useEffect(() => {
    if (activeTab === 'Bulk Discounts') {
      fetchBulkDiscounts();
    }
  }, [activeTab]);

  const handleBulkDiscountSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = bulkDiscountModal.mode === 'add' 
      ? '/api/admin/bulk-discounts' 
      : `/api/admin/bulk-discounts/${bulkDiscountModal.discount.id}`;
    const method = bulkDiscountModal.mode === 'add' ? 'POST' : 'PUT';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newBulkDiscount)
      });
      if (res.ok) {
        toast.success(`Bulk discount ${bulkDiscountModal.mode === 'add' ? 'created' : 'updated'} successfully`);
        setBulkDiscountModal({ open: false, mode: 'add', discount: null });
        fetchBulkDiscounts();
      } else {
        const data = await res.json();
        toast.error(data.message || 'Failed to save bulk discount');
      }
    } catch (err) {
      toast.error('Failed to save bulk discount');
    }
  };

  const handleToggleBulkDiscount = async (discount: any) => {
    try {
      const res = await fetch(`/api/admin/bulk-discounts/${discount.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...discount, active: !discount.active })
      });
      if (res.ok) {
        toast.success(`Bulk discount ${!discount.active ? 'enabled' : 'disabled'}`);
        fetchBulkDiscounts();
      } else {
        toast.error('Failed to toggle bulk discount');
      }
    } catch (err) {
      toast.error('Failed to toggle bulk discount');
    }
  };

  const handleDeleteBulkDiscount = async (id: number) => {
    if (!confirm('Are you sure you want to delete this bulk discount?')) return;
    try {
      const res = await fetch(`/api/admin/bulk-discounts/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Bulk discount deleted');
        fetchBulkDiscounts();
      }
    } catch (err) {
      toast.error('Failed to delete bulk discount');
    }
  };

  useEffect(() => {
    const performGlobalSearch = async () => {
      if (!debouncedGlobalSearchQuery || debouncedGlobalSearchQuery.length < 2) {
        setGlobalSearchResults(null);
        return;
      }

      setIsGlobalSearching(true);
      try {
        const res = await fetch(`/api/admin/search?q=${encodeURIComponent(debouncedGlobalSearchQuery)}`);
        const data = await res.json();
        setGlobalSearchResults(data);
      } catch (err) {
        console.error('Global search error:', err);
      } finally {
        setIsGlobalSearching(false);
      }
    };

    performGlobalSearch();
  }, [debouncedGlobalSearchQuery]);

  const fetchCustomerOrders = async (userId: number) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}/orders`);
      const data = await res.json();
      setCustomerHistoryModal({ open: true, userId, orders: data });
    } catch (err) {
      console.error('Failed to fetch customer orders:', err);
      toast.error('Failed to load order history');
    }
  };


  const fetchPromotionProducts = async (promoId: number) => {
    try {
      const res = await fetch(`/api/admin/promotions/${promoId}/products`);
      const data = await res.json();
      setLinkedProductIds(data.map((p: any) => p.id));
    } catch (err) {
      console.error('Failed to fetch promotion products:', err);
    }
  };

  useEffect(() => {
    if (promotionProductsModal.open && promotionProductsModal.promotionId) {
      fetchPromotionProducts(promotionProductsModal.promotionId);
    }
  }, [promotionProductsModal.open, promotionProductsModal.promotionId]);

  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}`;
    const socket = new WebSocket(wsUrl);
    const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');

    socket.onopen = () => {
      console.log('Connected to admin notification center');
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        audio.play().catch(e => console.log('Audio play failed:', e));
        
        switch (data.type) {
          case 'NEW_ORDER':
            toast.success(`New Order Received! Total: ₹${data.payload.total}`, {
              duration: 6000,
              icon: '🛍️',
              style: {
                borderRadius: '16px',
                background: '#10b981',
                color: '#fff',
                fontWeight: 'bold'
              }
            });
            // Refresh orders and stats
            fetchOrders();
            fetchStats();
            break;
            
          case 'LOW_STOCK':
            data.payload.forEach((item: any) => {
              toast.error(`Low Stock Alert: ${item.name} (Only ${item.stock} left)`, {
                duration: 8000,
                icon: '⚠️',
                style: {
                  borderRadius: '16px',
                  background: '#f59e0b',
                  color: '#fff',
                  fontWeight: 'bold'
                }
              });
            });
            fetchAllProducts();
            break;
            
          case 'NEW_TICKET':
            toast.success(`New Support Inquiry: ${data.payload.subject}`, {
              duration: 6000,
              icon: '💬',
              style: {
                borderRadius: '16px',
                background: '#3b82f6',
                color: '#fff',
                fontWeight: 'bold'
              }
            });
            fetchTickets();
            break;
            
          case 'NEW_MESSAGE':
            toast.success(`New Message in Ticket #${data.payload.ticket_id}`, {
              duration: 4000,
              icon: '📩',
              style: {
                borderRadius: '16px',
                background: '#6366f1',
                color: '#fff',
                fontWeight: 'bold'
              }
            });
            if (selectedTicket && selectedTicket.id === parseInt(data.payload.ticket_id)) {
              fetchTicketMessages(selectedTicket.id);
            }
            break;
        }
      } catch (err) {
        console.error('WebSocket message error:', err);
      }
    };

    socket.onclose = () => {
      console.log('Disconnected from notification center');
    };

    return () => {
      if (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING) {
        socket.close();
      }
    };
  }, [selectedTicket]);

  const filteredProducts = allProducts.filter(product => {
    const matchesSearch = !productSearchTerm || 
      product.name.toLowerCase().includes(productSearchTerm.toLowerCase()) ||
      product.description.toLowerCase().includes(productSearchTerm.toLowerCase()) ||
      product.category.toLowerCase().includes(productSearchTerm.toLowerCase());
    
    const matchesStock = productStockFilter === 'all' || 
      (productStockFilter === 'low' && Number(product.stock) <= (Number(product.reorder_point) || 5) && Number(product.stock) > 0) ||
      (productStockFilter === 'out' && Number(product.stock) <= 0) ||
      (productStockFilter === 'expiring' && product.expiry_date && new Date(product.expiry_date) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000));
      
    const matchesDiscount = productDiscountFilter === 'all' || 
      (productDiscountFilter === 'discounted' && Number(product.discount) > 0);
      
    const matchesCategory = productCategoryFilter === 'all' || 
      product.category === productCategoryFilter;
      
    const matchesListed = productListedFilter === 'all' || 
      (productListedFilter === 'listed' && product.is_listed) ||
      (productListedFilter === 'unlisted' && !product.is_listed);
      
    const matchesDate = !productDateFilter || 
      new Date(product.created_at).toISOString().split('T')[0] === productDateFilter;
    
    return matchesSearch && matchesStock && matchesDiscount && matchesCategory && matchesListed && matchesDate;
  }).sort((a, b) => {
    if (productSortBy === 'name') return a.name.localeCompare(b.name);
    if (productSortBy === 'price') return a.price - b.price;
    if (productSortBy === 'stock') return a.stock - b.stock;
    if (productSortBy === 'created_at') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    return 0;
  });

  const fetchSystemLogs = async () => {
    setIsRefreshingLogs(true);
    try {
      const res = await fetch('/api/admin/system-logs');
      const data = await res.json();
      setSystemLogs(data);
    } catch (err) {
      toast.error('Failed to fetch system logs');
    } finally {
      setIsRefreshingLogs(false);
    }
  };

  const resolveSuspiciousActivity = async (id: number) => {
    try {
      await fetch(`/api/admin/suspicious-activities/${id}/resolve`, { method: 'POST' });
      toast.success('Activity resolved');
      fetchSuspiciousActivities();
    } catch (err) {
      toast.error('Failed to resolve activity');
    }
  };

  const [bugReports, setBugReports] = useState<any[]>([]);

  const fetchBugReports = async () => {
    try {
      const res = await fetch('/api/admin/bugs');
      if (!res.ok) throw new Error('Failed to fetch bugs');
      const data = await res.json();
      setBugReports(data);
    } catch (err) {
      console.error('Bug reports fetch error:', err);
    }
  };

  useEffect(() => {
    if (activeTab === 'Bug Reports') {
      fetchBugReports();
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'Orders' || activeTab === 'Analytics') {
      fetchOrders();
    }
    // Remove other fetches here that are covered by loadData or unnecessary
  }, [activeTab]);

  const fetchConfig = async () => {
    const res = await fetch('/api/admin/config');
    const data = await res.json();
    setConfig(data);
  };

  const fetchUsers = async () => {
    const res = await fetch('/api/admin/users');
    const data = await res.json();
    setUsers(data);
  };

  useEffect(() => {
    setSelectedProducts([]);
  }, [activeTab]);

  const fetchAllProducts = async () => {
    try {
      const res = await fetch('/api/products');
      if (!res.ok) throw new Error('Failed to fetch products');
      const data = await res.json();
      setAllProducts(data);
      setLowStockProducts(data.filter((p: any) => p.stock <= (p.reorder_point || 5)));
    } catch (err) {
      console.error('Products fetch error:', err);
      toast.error('Failed to load products');
    }
  };

  const fetchCategories = async () => {
    const res = await fetch('/api/categories');
    const data = await res.json();
    setCategories(data);
  };

  const fetchTickets = async () => {
    const res = await fetch('/api/admin/support/tickets');
    const data = await res.json();
    setTickets(data);
  };

  const fetchNewsletter = async () => {
    const res = await fetch('/api/admin/newsletter');
    const data = await res.json();
    setNewsletter(data);
  };

  const sendNewsletterCampaign = () => {
    if (newsletter.length === 0) {
      toast.error('No subscribers found');
      return;
    }
    const emails = newsletter.map(sub => sub.email).join(',');
    const subject = encodeURIComponent('Special Offers from General Store Karyana Shop Nayagaon');
    const body = encodeURIComponent('Hello,\n\nCheck out our latest offers and fresh arrivals!\n\nRegards,\nGeneral Store Karyana Shop');
    window.open(`mailto:${emails}?subject=${subject}&body=${body}`);
  };

  const fetchNotifications = async () => {
    const res = await fetch('/api/notifications');
    const data = await res.json();
    setNotifications(data);
  };

  const fetchDeliveryAreas = async () => {
    const res = await fetch('/api/delivery-areas');
    const data = await res.json();
    setDeliveryAreas(data);
  };

  const fetchPromotions = async () => {
    try {
      const res = await fetch('/api/promotions');
      const data = await res.json();
      setPromotions(data);
    } catch (err) {
      console.error('Promotions fetch error:', err);
    }
  };

  const fetchPromotionRules = async () => {
    try {
      const res = await fetch('/api/promotions-rules');
      const data = await res.json();
      setPromotionRules(data);
    } catch (err) {
      console.error('Promotion Rules fetch error:', err);
    }
  };

  const fetchBulkDiscounts = async () => {
    try {
      const res = await fetch('/api/admin/bulk-discounts');
      if (res.ok) setBulkDiscounts(await res.json());
      else toast.error('Failed to load bulk discounts');
    } catch (err) {
      toast.error('Failed to load bulk discounts');
    }
  };

  const handleAddDeliveryArea = async () => {
    try {
      const res = await fetch('/api/admin/delivery-areas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newDeliveryArea)
      });
      if (res.ok) {
        toast.success('Delivery area added');
        setDeliveryAreaModal({ open: false, mode: 'add', area: null });
        setNewDeliveryArea({ name: '', fee: '0', min_order: '0' });
        fetchDeliveryAreas();
      }
    } catch (err) {
      toast.error('Failed to add delivery area');
    }
  };

  const handleUpdateDeliveryArea = async () => {
    try {
      const res = await fetch(`/api/admin/delivery-areas/${deliveryAreaModal.area.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newDeliveryArea)
      });
      if (res.ok) {
        toast.success('Delivery area updated');
        setDeliveryAreaModal({ open: false, mode: 'add', area: null });
        setNewDeliveryArea({ name: '', fee: '0', min_order: '0' });
        fetchDeliveryAreas();
      }
    } catch (err) {
      toast.error('Failed to update delivery area');
    }
  };

  const handleDeleteDeliveryArea = async (id: number) => {
    if (!confirm('Are you sure you want to delete this delivery area?')) return;
    try {
      const res = await fetch(`/api/admin/delivery-areas/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        toast.success('Delivery area deleted');
        fetchDeliveryAreas();
      }
    } catch (err) {
      toast.error('Failed to delete delivery area');
    }
  };

  const fetchProductVariants = async (productId: number) => {
    try {
      const res = await fetch(`/api/products/${productId}/variants`);
      if (!res.ok) throw new Error('Failed to fetch variants');
      const data = await res.json();
      setProductVariants(data);
    } catch (err) {
      console.error('Variants fetch error:', err);
      toast.error('Failed to load product variants');
    }
  };

  const handleAddVariant = async () => {
    if (!variantModal.productId) return;
    try {
      const res = await fetch(`/api/admin/products/${variantModal.productId}/variants`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newVariant)
      });
      if (res.ok) {
        toast.success('Variant added');
        setVariantModal({ ...variantModal, open: false });
        setNewVariant({ name: '', price: '', stock: '', unit_quantity: '1', is_default: false });
        fetchProductVariants(variantModal.productId);
      }
    } catch (err) {
      toast.error('Failed to add variant');
    }
  };

  const handleUpdateVariant = async () => {
    if (!variantModal.variant || !variantModal.productId) return;
    try {
      const res = await fetch(`/api/admin/variants/${variantModal.variant.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newVariant)
      });
      if (res.ok) {
        toast.success('Variant updated');
        setVariantModal({ ...variantModal, open: false });
        setNewVariant({ name: '', price: '', stock: '', unit_quantity: '1', is_default: false });
        fetchProductVariants(variantModal.productId);
      }
    } catch (err) {
      toast.error('Failed to update variant');
    }
  };

  const handleDeleteVariant = async (id: number) => {
    if (!confirm('Are you sure you want to delete this variant?')) return;
    try {
      const res = await fetch(`/api/admin/variants/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        toast.success('Variant deleted');
        if (variantModal.productId) fetchProductVariants(variantModal.productId);
      }
    } catch (err) {
      toast.error('Failed to delete variant');
    }
  };

  const handleBulkOrderAction = async (action: string, value?: any) => {
    if (!confirm(`Are you sure you want to ${action} ${selectedOrders.length} orders?`)) return;
    try {
      const res = await fetch('/api/admin/orders/bulk-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedOrders, action, value })
      });
      if (res.ok) {
        toast.success('Bulk action completed');
        setSelectedOrders([]);
        fetchOrders();
      }
    } catch (err) {
      toast.error('Failed to perform bulk action');
    }
  };

  const fetchSearchSuggestions = async (q: string) => {
    if (!q) {
      setSearchSuggestions([]);
      return;
    }
    try {
      const res = await fetch(`/api/search/suggestions?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setSearchSuggestions(data);
    } catch (err) {
      console.error('Suggestions fetch error:', err);
    }
  };


  const fetchOrderDetailsModal = async (order: any) => {
    try {
      const res = await fetch(`/api/orders/${order.id}`);
      if (!res.ok) throw new Error('Order not found');
      const orderDetails = await res.json();
      setOrderModal({ open: true, order: orderDetails });

      const histRes = await fetch(`/api/admin/orders/${order.id}/status-history`);
      if (histRes.ok) {
        const histData = await histRes.json();
        setOrderHistory(histData.history || []);
      }
    } catch (err: any) {
      console.error('Failed to fetch order details:', err);
      // Fallback
      setOrderModal({ open: true, order });
    }
  };

  const fetchTicketMessages = async (ticketId: number) => {
    const res = await fetch(`/api/support/tickets/${ticketId}/messages`);
    const data = await res.json();
    setTicketMessages(data);
  };

  const [salesAnalytics, setSalesAnalytics] = useState<{ dailySales: any[], topProducts: any[] } | null>(null);

  const fetchAnalytics = async () => {
    setIsFetchingAnalytics(true);
    try {
      const params = new URLSearchParams();
      if (analyticsStartDate) params.append('startDate', analyticsStartDate);
      if (analyticsEndDate) params.append('endDate', analyticsEndDate);
      if (analyticsCategory !== 'all') params.append('category', analyticsCategory);
      if (analyticsSegment !== 'all') params.append('segment', analyticsSegment);
      
      const [res, salesRes] = await Promise.all([
        fetch(`/api/admin/analytics?${params.toString()}`),
        fetch('/api/admin/sales-analytics')
      ]);
      const data = await res.json();
      const salesData = await salesRes.json();
      setAnalyticsData(data);
      setSalesAnalytics(salesData);
    } catch (err) {
      console.error('Failed to fetch analytics:', err);
    } finally {
      setIsFetchingAnalytics(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'Analytics') {
      fetchAnalytics();
    }
  }, [activeTab, analyticsStartDate, analyticsEndDate, analyticsCategory, analyticsSegment]);

  useEffect(() => {
    if (user?.role !== 'admin') {
      setLoading(false);
      return;
    }

    const loadData = async () => {
      setLoading(true);
      try {
        const fetchJSON = (url: string) => fetch(url).then(r => {
          if (!r.ok) throw new Error(`HTTP error! status: ${r.status}`);
          return r.json();
        }).catch(err => {
          console.error(`Fetch failed for ${url}:`, err);
          return null;
        });

        const [statsRes, ordersRes, configRes, usersRes, productsRes, categoriesRes, expiringRes] = await Promise.all([
          fetchJSON('/api/admin/stats'),
          fetchJSON('/api/admin/orders'),
          fetchJSON('/api/admin/config'),
          fetchJSON('/api/admin/users'),
          fetchJSON('/api/products'),
          fetchJSON('/api/categories'),
          fetchJSON('/api/admin/inventory/expiring')
        ]);

        setStats(statsRes || {});
        setOrders(ordersRes || []);
        setConfig(configRes || []);
        setUsers(usersRes || []);
        if (productsRes) {
          setAllProducts(productsRes);
          setLowStockProducts(productsRes.filter((p: any) => p.stock <= (p.reorder_point || 5)));
        } else {
          setAllProducts([]);
          setLowStockProducts([]);
        }
        setCategories(categoriesRes || []);
        setExpiringSoon(expiringRes || []);
      } catch (err) {
        console.error('Failed to load initial admin data', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user]);

  const updateSetting = async (key: string, value: string) => {
    try {
      await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, value })
      });
      toast.success(`Updated ${key}`);
      fetchConfig();
    } catch (err) {
      toast.error('Failed to update setting');
    }
  };

  const getSetting = (key: string) => {
    return config.find(c => c.key === key)?.value;
  };

  const updateOrderStatus = async (id: number, status: string) => {
    let rejection_reason = '';
    if (status === 'cancelled' || status === 'failed') {
      const reason = window.prompt('Please provide a reason for cancellation/rejection:');
      if (reason === null) return; // User cancelled the prompt
      rejection_reason = reason;
    }

    try {
      const res = await fetch(`/api/admin/orders/${id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, rejection_reason })
      });
      
      const data = await res.json();
      if (res.ok) {
        toast.success(`Order #${id} status updated to ${status}`);
        fetchOrders();
      } else {
        toast.error(data.message || 'Failed to update order status');
      }
    } catch (err) {
      console.error('Update order status error:', err);
      toast.error('Error updating order status. Check your connection.');
    }
  };

  const handleRespondReview = async () => {
    if (!reviewResponseModal.review || !reviewResponse) return;
    try {
      const res = await fetch(`/api/admin/reviews/${reviewResponseModal.review.id}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ response: reviewResponse })
      });
      if (res.ok) {
        toast.success('Response submitted');
        setReviewResponseModal({ open: false, review: null });
        setReviewResponse('');
        fetch('/api/admin/reviews').then(res => res.json()).then(setReviews);
      }
    } catch (err) {
      toast.error('Failed to submit response');
    }
  };

  const handleDeletePromotion = async (id: number) => {
    if (!window.confirm('Delete this promotion?')) return;
    try {
      const res = await fetch(`/api/admin/promotions/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete promotion');
      toast.success('Promotion deleted');
      fetchPromotions();
    } catch (err: any) {
      handleAppError(err, 'Failed to delete promotion', 'deletePromotion', true);
    }
  };

  const handlePromotionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPromotion.title.trim()) {
        toast.error('Title is required');
        return;
    }
    const url = promotionModal.mode === 'add' ? '/api/admin/promotions' : `/api/admin/promotions/${promotionModal.id}`;
    const method = promotionModal.mode === 'add' ? 'POST' : 'PUT';
    
    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPromotion)
      });
      if (!res.ok) throw new Error(`Failed to ${promotionModal.mode} promotion`);
      const data = await res.json();
      if (data.success) {
        toast.success(`Promotion ${promotionModal.mode === 'add' ? 'added' : 'updated'} successfully`);
        setPromotionModal({ open: false, mode: 'add', id: null });
        setNewPromotion({ title: '', description: '', image_url: '', link: '', active: true });
        fetchPromotions();
      }
    } catch (err: any) {
      handleAppError(err, 'Failed to save promotion', 'savePromotion', true);
    }
  };

  const togglePromotionStatus = async (id: number) => {
    try {
      const res = await fetch(`/api/admin/promotions/${id}/toggle`, { method: 'POST' });
      if (!res.ok) throw new Error('Failed to update promotion status');
      toast.success('Promotion status updated');
      fetchPromotions();
    } catch (err: any) {
      handleAppError(err, 'Failed to update status', 'togglePromotionStatus', true);
    }
  };

  const handleDeletePromotionRule = async (id: number) => {
    if (!window.confirm('Delete this rule?')) return;
    try {
      const res = await fetch(`/api/admin/promotions-rules/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete rule');
      toast.success('Discount rule deleted');
      fetchPromotionRules();
    } catch (err: any) {
      handleAppError(err, 'Failed to delete rule', 'deletePromotionRule', true);
    }
  };

  const handlePromotionRuleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = promotionRuleModal.mode === 'add' ? '/api/admin/promotions-rules' : `/api/admin/promotions-rules/${promotionRuleModal.id}`;
    const method = promotionRuleModal.mode === 'add' ? 'POST' : 'PUT';
    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPromotionRule)
      });
      if (!res.ok) throw new Error(`Failed to ${promotionRuleModal.mode} rule`);
      const data = await res.json();
      if (data.success) {
        toast.success(`Discount rule ${promotionRuleModal.mode === 'add' ? 'created' : 'updated'} successfully`);
        setPromotionRuleModal({ open: false, mode: 'add', id: null });
        setNewPromotionRule({ title: '', type: 'percentage', target_type: 'all', target_id: '', condition_qty: 1, discount_value: 0, active: true });
        fetchPromotionRules();
      }
    } catch (err: any) {
      handleAppError(err, 'Failed to save rule', 'savePromotionRule', true);
    }
  };

  const togglePromotionRuleStatus = async (id: number) => {
    try {
      const res = await fetch(`/api/admin/promotions-rules/${id}/toggle`, { method: 'POST' });
      if (!res.ok) throw new Error('Failed to update rule status');
      toast.success('Rule status updated');
      fetchPromotionRules();
    } catch (err: any) {
      handleAppError(err, 'Failed to update rule status', 'togglePromotionRuleStatus', true);
    }
  };

  const generatePurchaseOrder = () => {
    const lowStockProducts = allProducts.filter(p => Number(p.stock) <= Number(p.reorder_point || 5));
    
    const groupedBySupplier = lowStockProducts.reduce((acc, curr) => {
        const sid = curr.supplier_id || 'unassigned';
        if (!acc[sid]) acc[sid] = [];
        acc[sid].push(curr);
        return acc;
    }, {} as Record<string, any[]>);

    const formattedPO = Object.keys(groupedBySupplier).map(sid => {
         const supplier = suppliers.find(s => s.id.toString() === sid.toString());
         return {
             supplier: supplier || { name: 'Unassigned / Independent', address: '', contact_person: '', phone: '', email: '' },
             items: groupedBySupplier[sid]
         };
    });
    
    if (formattedPO.length === 0) {
      toast.error('No low stock items found to generate PO.');
      return;
    }

    setPoData(formattedPO);
    setShowPOPrint(true);
    
    toast.success('Generated Purchase Orders by Supplier. Preparing print...', { icon: '📄' });
    setTimeout(() => window.print(), 1000);
  };

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = productModal.mode === 'add' ? '/api/admin/products' : `/api/admin/products/${editingProduct.id}`;
    const method = productModal.mode === 'add' ? 'POST' : 'PUT';

    // Calculate discounted price
    const retail = parseFloat(newProduct.retail_price || '0');
    const discount = parseFloat(newProduct.discount || '0');
    const calculatedPrice = discount > 0 ? Math.round(retail * (1 - discount / 100)) : retail;

    const productData = {
      ...newProduct,
      price: calculatedPrice.toString(),
      discount_price: calculatedPrice // Also set discount_price for compatibility
    };

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData)
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(`Product ${productModal.mode === 'add' ? 'added' : 'updated'}`);
        setProductModal({ open: false, mode: 'add' });
        setNewProduct({ 
          name: '', description: '', price: '', stock: '', category: 'Grocery', image: '',
          retail_price: '', wholesale_price: '', discount: '0', reorder_point: '10', max_qty: '0', is_listed: true,
          images: [],
          specifications: {},
          batch_number: '',
          expiry_date: ''
        } as any);
        fetchAllProducts();
      } else {
        toast.error(data.message || 'Failed to save product');
      }
    } catch (err) {
      console.error('Product submit error:', err);
      toast.error('Failed to save product. Check your connection.');
    }
  };

  const handleStockEntrySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stockEntryModal.product) return;
    try {
      const res = await fetch('/api/admin/inventory/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: stockEntryModal.product.id,
          ...purchaseForm
        })
      });
      if (res.ok) {
        toast.success('Stock entry recorded successfully');
        setStockEntryModal({ open: false, product: null });
        setPurchaseForm({ supplier_id: '', quantity: '', cost_price: '', invoice_number: '', batch_number: '', expiry_date: '' });
        fetchAllProducts();
        fetchStats();
      } else {
        const data = await res.json();
        toast.error(data.message || 'Failed to record stock entry');
      }
    } catch (err) {
      toast.error('Network error during stock entry');
    }
  };

  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = categoryModal.mode === 'add' ? '/api/admin/categories' : `/api/admin/categories/${editingCategory.id}`;
    const method = categoryModal.mode === 'add' ? 'POST' : 'PUT';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCategory)
      });
      if (res.ok) {
        toast.success(`Category ${categoryModal.mode === 'add' ? 'added' : 'updated'}`);
        setCategoryModal({ open: false, mode: 'add' });
        setNewCategory({ name: '', icon: 'Package' });
        fetchCategories();
      }
    } catch (err) {
      toast.error('Failed to save category');
    }
  };

  const handleRevertAction = async (logId: number) => {
    if (!confirm('Are you sure you want to revert this action? This will restore the previous state.')) return;
    try {
      const res = await fetch(`/api/admin/audit-logs/${logId}/revert`, { method: 'POST' });
      if (res.ok) {
        toast.success('Action reverted successfully');
        fetchAuditLogs();
        // Refresh relevant data based on log action if needed, or just full refresh stats
        fetchStats();
      } else {
        const data = await res.json();
        toast.error(data.message || 'Failed to revert action');
      }
    } catch (err) {
      toast.error('Network error during reversion');
    }
  };

  const handleNotificationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newNotification)
      });
      if (res.ok) {
        toast.success('Notification sent');
        setNotificationModal({ open: false });
        setNewNotification({ 
          title: '', 
          message: '', 
          type: 'ad',
          priority: 'medium',
          target_role: 'all',
          expires_at: ''
        });
        fetchNotifications();
      }
    } catch (err) {
      toast.error('Failed to send notification');
    }
  };

  const handleDeleteNotification = async (id: number) => {
    if (!confirm('Are you sure you want to delete this announcement?')) return;
    try {
      const res = await fetch(`/api/admin/notifications/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Announcement removed');
        fetchNotifications();
      }
    } catch (err) {
      toast.error('Failed to delete announcement');
    }
  };

  const handlePrintInvoice = (order: any) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    
    let addr: any = {};
    try {
      addr = typeof order.address === 'string' ? JSON.parse(order.address || '{}') : (order.address || {});
    } catch (e) {
      addr = { address: order.address };
    }
    const date = new Date(order.created_at).toLocaleDateString('en-IN');
    
    const html = `
      <html>
        <head>
          <title>Invoice #ORD-${order.id}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 40px; color: #1c1917; line-height: 1.5; }
            .header { display: flex; justify-content: space-between; border-bottom: 2px solid #f5f5f4; padding-bottom: 20px; margin-bottom: 30px; }
            .logo { font-size: 24px; font-weight: 800; letter-spacing: -0.025em; }
            .invoice-details { text-align: right; }
            .section { margin-bottom: 30px; }
            .section-title { font-weight: 800; text-transform: uppercase; font-size: 10px; color: #a8a29e; margin-bottom: 8px; letter-spacing: 0.1em; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th { text-align: left; background: #fafaf9; padding: 12px; font-size: 11px; font-weight: 800; text-transform: uppercase; color: #78716c; }
            td { padding: 12px; border-bottom: 1px solid #f5f5f4; font-size: 13px; }
            .total-section { margin-top: 30px; border-top: 2px solid #f5f5f4; padding-top: 20px; }
            .total-row { display: flex; justify-content: flex-end; gap: 60px; margin-bottom: 8px; font-size: 14px; }
            .grand-total { font-size: 20px; font-weight: 800; color: #c2410c; margin-top: 15px; border-top: 1px solid #f5f5f4; pt: 15px; }
            .footer { margin-top: 60px; font-size: 11px; color: #a8a29e; text-align: center; border-top: 1px dashed #e7e5e4; padding-top: 20px; }
            @media print {
              body { padding: 20px; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="logo">HIND GENERAL STORE</div>
              <p style="font-size: 12px; color: #78716c; margin: 4px 0 0 0;">Karyana Shop Nayagaon</p>
            </div>
            <div class="invoice-details">
              <div style="font-weight: 800; font-size: 14px;">TAX INVOICE</div>
              <div style="color: #78716c; font-size: 12px;">#ORD-${order.id}</div>
              <div style="color: #78716c; font-size: 12px;">Date: ${date}</div>
            </div>
          </div>
          
          <div style="display: flex; gap: 60px;">
            <div class="section" style="flex: 1;">
              <div class="section-title">Customer Details</div>
              <div style="font-weight: 700; font-size: 14px;">${addr.name || 'Valued Customer'}</div>
              <div style="font-size: 13px;">Phone: ${addr.phone || 'N/A'}</div>
              <div style="font-size: 13px; margin-top: 4px; color: #444;">${addr.address || ''}</div>
              <div style="font-size: 13px; color: #444;">${addr.city || ''} ${addr.state || ''} ${addr.pincode || ''}</div>
            </div>
            <div class="section" style="flex: 1;">
              <div class="section-title">Transaction Info</div>
              <div style="font-size: 13px;"><strong>Payment:</strong> ${order.payment_method?.toUpperCase()}</div>
              <div style="font-size: 13px;"><strong>Delivery:</strong> ${order.delivery_type?.toUpperCase()}</div>
              ${order.tracking_id ? `<div style="font-size: 13px;"><strong>Tracking ID:</strong> ${order.tracking_id}</div>` : ''}
              ${order.payment_utr ? `<div style="font-size: 13px;"><strong>UTR:</strong> ${order.payment_utr}</div>` : ''}
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th style="width: 50%;">Item Description</th>
                <th>Price</th>
                <th>Qty</th>
                <th style="text-align: right;">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${(order.items || []).map((item: any) => `
                <tr>
                  <td style="font-weight: 600;">
                    ${item.product_name || 'General Item'} 
                    ${item.variant_name ? `<br/><span style="font-size: 10px; color: #a8a29e; font-weight: normal;">Variant: ${item.variant_name}</span>` : ''}
                  </td>
                  <td>₹${item.price}</td>
                  <td>${item.quantity}</td>
                  <td style="text-align: right; font-weight: 700;">₹${item.price * item.quantity}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="total-section">
            <div class="total-row">
              <span style="color: #78716c;">Subtotal:</span>
              <span style="font-weight: 600; min-width: 100px;">₹${order.subtotal || order.total}</span>
            </div>
            ${order.discount > 0 ? `
            <div class="total-row" style="color: #059669;">
              <span>Discount:</span>
              <span style="font-weight: 600; min-width: 100px;">-₹${order.discount}</span>
            </div>` : ''}
            <div class="total-row">
              <span style="color: #78716c;">Delivery Fee:</span>
              <span style="font-weight: 600; min-width: 100px;">₹${order.delivery_fee || 0}</span>
            </div>
            <div class="total-row grand-total">
              <span>Total Payable:</span>
              <span style="min-width: 100px;">₹${order.total}</span>
            </div>
          </div>

          <div class="footer">
            <p style="font-weight: 700; color: #57534e;">Thank you for your business!</p>
            <p>Hind General Store | Shop No. 1, Main Market, Nayagaon, SAS Nagar, Punjab</p>
            <p>For support, call us at +91 95015 67756 or email hind.store@gmail.com</p>
          </div>
          
          <script>
            window.onload = function() { 
              setTimeout(() => {
                window.print(); 
              }, 500);
            }
          </script>
        </body>
      </html>
    `;
    
    printWindow.document.write(html);
    printWindow.document.close();
  };

  const handleUserUpdate = async (userId: number, data: any) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (res.ok) {
        toast.success('User updated');

        // Automatically queue a full-screen alert for the user about account changes
        let alertTitle = 'Account Updated';
        let alertMessage = 'Your account features have been updated by the administrator.';
        let alertDetails = `Changes: ${Object.keys(data).join(', ')}`;
        
        if (data.role) {
          alertTitle = 'Role Changed';
          alertMessage = `Your account role has been updated to ${data.role.toUpperCase()}.`;
        } else if (data.is_verified !== undefined) {
          alertTitle = data.is_verified ? 'Account Verified ✅' : 'Verification Suspended ⚠️';
          alertMessage = data.is_verified ? 'Your identity has been verified. Welcome!' : 'Your verification status has been revoked.';
        } else if (data.khata_enabled !== undefined) {
          alertTitle = data.khata_enabled ? 'Khata Facility Enabled 💳' : 'Khata Facility Disabled';
          alertMessage = data.khata_enabled ? 'You can now use Khata (Credit Line) for your orders.' : 'The Khata facility is no longer available on your account.';
        }

        await fetch(`/api/admin/users/${userId}/alert`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            title: alertTitle, 
            message: alertMessage, 
            details: alertDetails, 
            type: 'success', 
            duration: 5000, 
            is_unskippable: true 
          })
        }).catch(err => console.error('Alert failed', err));

        // Update local state without closing modal
        if (customerModal.user && customerModal.user.id === userId) {
          setCustomerModal({ ...customerModal, user: { ...customerModal.user, ...data } });
        }
        fetchUsers();
      }
    } catch (err) {
      toast.error('Failed to update user');
    }
  };

  const deleteProduct = async (id: number) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    try {
      const res = await fetch(`/api/admin/products/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok) {
        toast.success('Product deleted');
        fetchAllProducts();
      } else {
        toast.error(data.message || 'Failed to delete product');
      }
    } catch (err) {
      console.error('Delete product error:', err);
      toast.error('Failed to delete product. Check your connection.');
    }
  };

  const handleBulkUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setBulkUploadLoading(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\n');
      const headers = lines[0].split(',');
      const products = lines.slice(1).filter(line => line.trim()).map(line => {
        const values = line.split(',');
        const product: any = {};
        headers.forEach((header, i) => {
          product[header.trim()] = values[i]?.trim();
        });
        return product;
      });

      try {
        const res = await fetch('/api/admin/products/bulk', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ products })
        });
        const data = await res.json();
        if (data.success) {
          toast.success(`Successfully uploaded ${data.count} products`);
          fetchAllProducts();
        } else {
          toast.error(data.message || 'Bulk upload failed');
        }
      } catch (err) {
        toast.error('Network error during bulk upload');
      } finally {
        setBulkUploadLoading(false);
      }
    };
    reader.readAsText(file);
  };

  const downloadTemplate = () => {
    const headers = 'name,description,price,stock,category,image_url';
    const blob = new Blob([headers], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'product_template.csv';
    a.click();
  };

  const toggleProductSelection = (id: number) => {
    setSelectedProducts(prev => 
      prev.includes(id) ? prev.filter(pId => pId !== id) : [...prev, id]
    );
  };

  const toggleAllProducts = () => {
    if (selectedProducts.length === filteredProducts.length && filteredProducts.length > 0) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(filteredProducts.map(p => p.id));
    }
  };

  const bulkUnlist = async (unlist: boolean) => {
    if (selectedProducts.length === 0) return;
    try {
      const res = await fetch('/api/admin/products/bulk-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedProducts, action: 'list', value: !unlist })
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(`Successfully ${unlist ? 'unlisted' : 'listed'} ${selectedProducts.length} products`);
        setSelectedProducts([]);
        fetchAllProducts();
      } else {
        toast.error(data.message || 'Bulk action failed');
      }
    } catch (err) {
      console.error('Bulk unlist error:', err);
      toast.error('Failed to perform bulk action');
    }
  };

  const bulkUpdateStock = async () => {
    if (selectedProducts.length === 0) return;
    const newStock = prompt('Enter new stock value for selected products:');
    if (newStock === null || isNaN(Number(newStock))) return;
    
    if (!confirm(`Are you sure you want to update stock to ${newStock} for ${selectedProducts.length} products?`)) {
      return;
    }
    
    try {
      const res = await fetch('/api/admin/products/bulk-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedProducts, action: 'stock', value: Number(newStock) })
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(`Updated stock for ${selectedProducts.length} products`);
        setSelectedProducts([]);
        fetchAllProducts();
      } else {
        toast.error(data.message || 'Bulk update failed');
      }
    } catch (err) {
      console.error('Bulk stock update error:', err);
      toast.error('Failed to update stock');
    }
  };

  const bulkDelete = async () => {
    if (selectedProducts.length === 0) return;
    if (!confirm(`Are you sure you want to delete ${selectedProducts.length} products?`)) return;
    
    try {
      const res = await fetch('/api/admin/products/bulk-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedProducts, action: 'delete' })
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(`Deleted ${selectedProducts.length} products`);
        setSelectedProducts([]);
        fetchAllProducts();
      } else {
        toast.error(data.message || 'Bulk delete failed');
      }
    } catch (err) {
      console.error('Bulk delete error:', err);
      toast.error('Failed to delete products');
    }
  };

  const bulkUpdateCategory = async () => {
    if (selectedProducts.length === 0) return;
    setCategoryBatchModal({ open: true });
  };

  const handleBatchCategoryUpdate = async () => {
    if (!newBatchCategory) return;
    
    if (!confirm(`Are you sure you want to update category to "${newBatchCategory}" for ${selectedProducts.length} products?`)) {
      return;
    }

    try {
      const res = await fetch('/api/admin/products/bulk-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedProducts, action: 'category', value: newBatchCategory })
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(`Updated category for ${selectedProducts.length} products`);
        setSelectedProducts([]);
        setCategoryBatchModal({ open: false });
        setNewBatchCategory('');
        fetchAllProducts();
      } else {
        toast.error(data.message || 'Bulk update failed');
      }
    } catch (err) {
      console.error('Bulk category update error:', err);
      toast.error('Failed to update category');
    }
  };

  const fetchWalletHistory = async (userId: number) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}/wallet-history`);
      const data = await res.json();
      setWalletHistoryModal({ open: true, userId, history: data });
    } catch (err) {
      toast.error('Failed to fetch wallet history');
    }
  };

  const deleteReview = async (id: number) => {
    if (!confirm('Delete this review?')) return;
    await fetch(`/api/admin/reviews/${id}`, { method: 'DELETE' });
    toast.success('Review deleted');
    fetch('/api/admin/reviews').then(res => res.json()).then(setReviews);
  };

  const updateReviewStatus = async (id: number, status: string) => {
    await fetch(`/api/admin/reviews/${id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    toast.success('Review status updated');
    fetch('/api/admin/reviews').then(res => res.json()).then(setReviews);
  };

  const deleteCoupon = async (id: number) => {
    if (!confirm('Delete this coupon?')) return;
    await fetch(`/api/admin/coupons/${id}`, { method: 'DELETE' });
    toast.success('Coupon deleted');
    fetch('/api/admin/coupons').then(res => res.json()).then(setCoupons);
  };

  const toggleCouponStatus = async (id: number) => {
    await fetch(`/api/admin/coupons/${id}/toggle`, { method: 'POST' });
    toast.success('Coupon status updated');
    fetch('/api/admin/coupons').then(res => res.json()).then(setCoupons);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const uploadedUrls: string[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const reader = new FileReader();
      const promise = new Promise<string>((resolve) => {
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });
      uploadedUrls.push(await promise);
    }

    const updatedImages = [...newProduct.images, ...uploadedUrls];
    setNewProduct({ ...newProduct, images: updatedImages });
    
    // If we are in the imageModal, update it too
    if (imageModal.open) {
      setImageModal({ ...imageModal, images: [...imageModal.images, ...uploadedUrls] });
    }
    
    // If no main image yet, set the first one as main
    if (!newProduct.image && uploadedUrls.length > 0) {
      setNewProduct(prev => ({ ...prev, image: uploadedUrls[0], images: [...prev.images, ...uploadedUrls] }));
    }
  };

  const moveImage = (index: number, direction: 'left' | 'right') => {
    const images = [...newProduct.images];
    const newIndex = direction === 'left' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= images.length) return;
    
    const temp = images[index];
    images[index] = images[newIndex];
    images[newIndex] = temp;
    
    setNewProduct({ ...newProduct, images });
    if (imageModal.open) setImageModal({ ...imageModal, images });
  };

  const deleteImage = (index: number) => {
    const images = newProduct.images.filter((_, i) => i !== index);
    let mainImage = newProduct.image;
    
    // If we deleted the main image, pick a new one or clear it
    if (newProduct.image === newProduct.images[index]) {
      mainImage = images.length > 0 ? images[0] : '';
    }
    
    setNewProduct({ ...newProduct, images, image: mainImage });
    if (imageModal.open) setImageModal({ ...imageModal, images });
  };

  const deleteExpense = async (id: number) => {
    if (!confirm('Delete this expense?')) return;
    await fetch(`/api/admin/expenses/${id}`, { method: 'DELETE' });
    toast.success('Expense deleted');
    fetch('/api/admin/expenses').then(res => res.json()).then(setExpenses);
  };

  const handleAddCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = couponModal.mode === 'edit' ? `/api/admin/coupons/${couponModal.editingId}` : '/api/admin/coupons';
    const method = couponModal.mode === 'edit' ? 'PUT' : 'POST';
    
    await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newCoupon)
    });
    toast.success(couponModal.mode === 'edit' ? 'Coupon updated' : 'Coupon added');
    setCouponModal({ open: false, mode: 'add' });
    setNewCoupon({ code: '', type: 'flat', value: '', min_order: '', usage_limit: '', limit_per_user: '1' });
    fetch('/api/admin/coupons').then(res => res.json()).then(setCoupons);
  };

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch('/api/admin/expenses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newExpense)
    });
    toast.success('Expense added');
    setExpenseModal({ open: false });
    fetch('/api/admin/expenses').then(res => res.json()).then(setExpenses);
  };

  const handleWalletUpdate = async () => {
    if (!walletModal.userId || !walletAmount) return;
    try {
      await fetch(`/api/admin/users/${walletModal.userId}/wallet`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          amount: walletAmount, 
          type: walletType, 
          description: `Admin manual ${walletType}` 
        })
      });
      toast.success('Wallet updated');
      setWalletModal({ open: false, userId: null });
      setWalletAmount('');
      fetchUsers();
    } catch (err) {
      toast.error('Failed to update wallet');
    }
  };

  const sidebarGroups = [
    {
      title: 'Dashboard',
      items: [
        { name: 'Overview' as Tab, icon: LayoutDashboard },
        { name: 'Analytics' as Tab, icon: BarChart3 },
        { name: 'Announcements' as Tab, icon: Bell },
      ]
    },
    {
      title: 'Inventory',
      items: [
        { name: 'Product Catalog' as Tab, icon: Package },
        { name: 'Categories' as Tab, icon: List },
        { name: 'Bulk Discounts' as Tab, icon: Tag },
        { name: 'Suppliers' as Tab, icon: Truck },
      ]
    },
    {
      title: 'Sales & Logistics',
      items: [
        { name: 'Orders' as Tab, icon: ShoppingBag },
        { name: 'Payment Automation' as any, icon: ShieldCheck, path: '/admin/payments' },
        { name: 'Logistics' as Tab, icon: Truck },
        { name: 'Returns' as Tab, icon: Receipt },
        { name: 'Coupons' as Tab, icon: CreditCard },
        { name: 'Promotions' as Tab, icon: TrendingUp },
      ]
    },
    {
      title: 'Customers',
      items: [
        { name: 'Customers' as Tab, icon: Users },
        { name: 'Wallet Requests' as Tab, icon: CreditCard },
        { name: 'Reviews' as Tab, icon: Star },
        { name: 'Newsletter' as Tab, icon: Send },
      ]
    },
    {
      title: 'Operations',
      items: [
        { name: 'Support Tickets' as Tab, icon: MessageSquare },
        { name: 'Expenses' as Tab, icon: Receipt },
        { name: 'Audit Logs' as Tab, icon: History },
        { name: 'Roles' as Tab, icon: Shield },
      ]
    },
    {
      title: 'Settings',
      items: [
        { name: 'Store Settings' as Tab, icon: Settings },
        { name: 'Payment Settings' as Tab, icon: CreditCard },
        { name: 'Suspicious Activities' as Tab, icon: AlertTriangle },
        { name: 'System Status' as Tab, icon: Activity },
        { name: 'Bug Reports' as Tab, icon: AlertTriangle },
        { name: 'Feature Toggles' as Tab, icon: Settings },
      ]
    }
  ];

  const getGroupedSalesData = () => {
    if (!analyticsData || !analyticsData.salesOverTime) return [];
    if (analyticsTimeframe === 'daily') return analyticsData.salesOverTime;
    
    const grouped: any = {};
    analyticsData.salesOverTime.forEach((d: any) => {
      const date = new Date(d.date);
      let key = '';
      if (analyticsTimeframe === 'weekly') {
        const firstDay = new Date(date);
        firstDay.setDate(date.getDate() - date.getDay());
        key = `Week of ${firstDay.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`;
      } else {
        key = date.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
      }
      
      if (!grouped[key]) grouped[key] = { date: key, sales: 0, orders: 0 };
      grouped[key].sales += d.sales;
      grouped[key].orders += d.orders;
    });
    
    return Object.values(grouped);
  };

  if (!user || user.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  const tabs: Tab[] = [
    'Overview', 'Analytics', 'Announcements', 'Orders', 'Logistics', 'Product Catalog', 'Categories', 
    'Customers', 'Wallet Requests', 'Reviews', 'Coupons', 'Roles', 'Support Tickets', 'Newsletter', 
    'Expenses', 'Store Settings', 'Payment Settings', 'System Status', 'Suspicious Activities', 'Promotions', 
    'Bulk Discounts', 'Feature Toggles', 'Suppliers', 'Returns', 'Audit Logs', 'Bug Reports', 'Data Exports'
  ];

  if (showPOPrint && poData) {
    return (
      <div className="bg-white min-h-screen text-black print:p-0">
        <div className="p-4 print:hidden text-right border-b">
          <button onClick={() => window.print()} className="bg-primary text-white px-4 py-2 rounded font-bold mr-4">Print Now</button>
          <button onClick={() => setShowPOPrint(false)} className="bg-stone-200 px-4 py-2 rounded font-bold text-stone-800 hover:bg-stone-300">Close</button>
        </div>
        <div className="max-w-5xl mx-auto bg-white print:max-w-none">
           {poData.map((po, index) => (
             <div key={index} className="p-8 print:p-0 print:border-none border-b border-stone-200 mb-8" style={{ pageBreakAfter: 'always' }}>
                <div className="flex justify-between items-start mb-8">
                  <div>
                    <h1 className="text-3xl font-serif font-bold text-stone-800 tracking-tight">PURCHASE ORDER</h1>
                    <p className="text-stone-500 mt-1">PO-{Date.now().toString().slice(-6)}-{index + 1}</p>
                    <p className="text-stone-500 mt-1">Date: {new Date().toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <h2 className="text-lg font-bold text-stone-800">General Store Karyana Shop</h2>
                    <p className="text-stone-500 text-sm">123 Market Road, Ludhiana</p>
                    <p className="text-stone-500 text-sm">Phone: {config.find(c => c.key === 'admin_phone')?.value || '7888422429'}</p>
                  </div>
                </div>

                <div className="bg-stone-50 p-6 rounded-xl border border-stone-100 mb-8">
                  <h3 className="font-bold text-stone-800 mb-2 uppercase tracking-widest text-xs">Supplier Details</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                        <p className="font-bold text-stone-700">{po.supplier.name}</p>
                        <p className="text-stone-600 text-sm">{po.supplier.address || 'Address not provided'}</p>
                    </div>
                    <div>
                        <p className="text-stone-600 text-sm">Contact: {po.supplier.contact_person || 'N/A'}</p>
                        <p className="text-stone-600 text-sm">Phone: {po.supplier.phone || 'N/A'}</p>
                        <p className="text-stone-600 text-sm">Email: {po.supplier.email || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b-2 border-stone-800 text-stone-800">
                      <th className="py-3 px-2 font-bold w-1/2">Item Description</th>
                      <th className="py-3 px-2 font-bold text-right">Current Stock</th>
                      <th className="py-3 px-2 font-bold text-right">Reorder Point</th>
                      <th className="py-3 px-2 font-bold text-right">Required Qty</th>
                    </tr>
                  </thead>
                  <tbody>
                    {po.items.map((item: any) => {
                      const requiredQty = (item.max_qty || 20) - item.stock;
                      return (
                        <tr key={item.id} className="border-b border-stone-200 text-stone-700">
                          <td className="py-3 px-2">
                            <p className="font-medium">{item.name}</p>
                            <p className="text-xs text-stone-500">ID: {item.id} | Unit: {item.unit}</p>
                          </td>
                          <td className="py-3 px-2 text-right">
                            <span className="bg-red-100 text-red-800 px-2 py-1 rounded font-bold">{item.stock}</span>
                          </td>
                          <td className="py-3 px-2 text-right">{item.reorder_point || 5}</td>
                          <td className="py-3 px-2 text-right font-bold text-stone-900 bg-stone-50">
                            {requiredQty > 0 ? requiredQty : (item.reorder_point || 5)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                
                <div className="mt-16 pt-8 border-t border-stone-200 flex justify-between text-stone-500 text-sm">
                   <p>Authorized Signature: ______________________</p>
                   <p>Date: ______________________</p>
                </div>
             </div>
           ))}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("min-h-screen bg-stone-50 flex", adminTheme)}>
      <AdminSidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        user={user} 
        logout={logout} 
        isOpen={sidebarOpen} 
        setIsOpen={setSidebarOpen} 
        lowStockCount={lowStockProducts.length}
        newUserCount={newUserCount}
      />

      {/* Main Content */}
      <div className="flex-1 min-w-0 flex flex-col h-screen overflow-hidden">
        {/* Header */}
        <header className="h-20 bg-white/80 backdrop-blur-xl border-b border-stone-200 flex items-center justify-between px-6 lg:px-12 sticky top-0 z-40">
          <div className="flex items-center space-x-6">
            <button 
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 hover:bg-stone-50 rounded-xl text-stone-400 transition-colors"
            >
              <Menu size={24} />
            </button>
            <h2 className="text-xl font-black text-stone-900 tracking-tight hidden sm:block">{getDisplayLabel(activeTab)}</h2>
          </div>
            
            <div className="flex items-center space-x-3 bg-emerald-50 px-4 py-2 rounded-2xl border border-emerald-100 shadow-sm">
              <div className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </div>
              <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">{stats?.activeUsers || 0} Customer(s) Online</span>
            </div>

          <div className="flex items-center space-x-8">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 transition-colors group-focus-within:text-primary" size={18} />
              <input 
                type="text" 
                placeholder="Search products, orders..."
                className="bg-stone-100/50 border-stone-200 border rounded-2xl pl-11 pr-5 py-2.5 text-sm focus:ring-4 focus:ring-primary/10 w-64 transition-all focus:w-96 focus:bg-white outline-none font-medium"
                value={globalSearchQuery}
                onChange={(e) => setGlobalSearchQuery(e.target.value)}
              />
              
              {globalSearchResults && (
                <div className="absolute top-full right-0 mt-2 w-[500px] bg-white rounded-2xl shadow-2xl border border-stone-100 overflow-hidden z-50">
                  <div className="flex p-2 border-b border-stone-100 gap-1 overflow-x-auto">
                    {(['all', 'products', 'orders', 'users', 'suspicious'] as const).map(filter => (
                      <button
                        key={filter}
                        onClick={() => setSearchFilter(filter)}
                        className={cn(
                          "px-3 py-1 text-[10px] uppercase font-bold rounded-full transition-colors",
                          searchFilter === filter ? "bg-primary text-white" : "bg-stone-100 text-stone-500 hover:bg-stone-200"
                        )}
                      >
                        {filter}
                      </button>
                    ))}
                  </div>
                  <div className="p-4 max-h-[500px] overflow-y-auto space-y-4">
                    {(searchFilter === 'all' || searchFilter === 'products') && globalSearchResults.products.length > 0 && (
                      <div>
                        <h4 className="text-[10px] font-bold text-stone-400 uppercase mb-2 tracking-wider">Products</h4>
                        <div className="space-y-2">
                          {globalSearchResults.products.map(p => (
                            <button 
                              key={p.id} 
                              onClick={() => { setActiveTab('Product Catalog'); setProductSearchTerm(p.name); setGlobalSearchResults(null); setGlobalSearchQuery(''); setSearchFilter('all'); }}
                              className="w-full text-left p-2 hover:bg-stone-50 rounded-lg flex items-center space-x-3 transition-colors"
                            >
                              <div className="w-8 h-8 bg-stone-100 rounded-md overflow-hidden">
                                <img src={p.image_url} className="w-full h-full object-cover" alt="" />
                              </div>
                              <div>
                                <p className="text-xs font-bold">{p.name}</p>
                                <p className="text-[10px] text-stone-400">{p.category}</p>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {(searchFilter === 'all' || searchFilter === 'orders') && globalSearchResults.orders.length > 0 && (
                      <div>
                        <h4 className="text-[10px] font-bold text-stone-400 uppercase mb-2 tracking-wider">Orders</h4>
                        <div className="space-y-2">
                          {globalSearchResults.orders.map(o => (
                            <button 
                              key={o.id} 
                              onClick={() => { setActiveTab('Orders'); setOrderSearchTerm(`#ORD-${o.id}`); setGlobalSearchResults(null); setGlobalSearchQuery(''); setSearchFilter('all'); }}
                              className="w-full text-left p-2 hover:bg-stone-50 rounded-lg flex items-center space-x-3 transition-colors"
                            >
                              <div className="w-8 h-8 bg-primary/10 text-primary rounded-md flex items-center justify-center">
                                <ShoppingBag size={14} />
                              </div>
                              <div>
                                <p className="text-xs font-bold">#ORD-{o.id}</p>
                                <p className="text-[10px] text-stone-400">{o.user_name} • ₹{o.total}</p>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {(searchFilter === 'all' || searchFilter === 'users') && globalSearchResults.users.length > 0 && (
                      <div>
                        <h4 className="text-[10px] font-bold text-stone-400 uppercase mb-2 tracking-wider">Customers</h4>
                        <div className="space-y-2">
                          {globalSearchResults.users.map(u => (
                            <button 
                              key={u.id} 
                              onClick={() => { setActiveTab('Customers'); setGlobalSearchResults(null); setGlobalSearchQuery(''); setSearchFilter('all'); }}
                              className="w-full text-left p-2 hover:bg-stone-50 rounded-lg flex items-center space-x-3 transition-colors"
                            >
                              <div className="w-8 h-8 bg-stone-100 rounded-md flex items-center justify-center text-stone-400">
                                <Users size={14} />
                              </div>
                              <div>
                                <p className="text-xs font-bold">{u.name}</p>
                                <p className="text-[10px] text-stone-400">{u.phone}</p>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {(searchFilter === 'all' || searchFilter === 'suspicious') && globalSearchResults.suspicious && globalSearchResults.suspicious.length > 0 && (
                      <div>
                        <h4 className="text-[10px] font-bold text-stone-400 uppercase mb-2 tracking-wider">Security Alerts</h4>
                        <div className="space-y-2">
                          {globalSearchResults.suspicious.map(s => (
                            <button 
                              key={s.id} 
                              onClick={() => { setActiveTab('Suspicious Activities'); setGlobalSearchResults(null); setGlobalSearchQuery(''); setSearchFilter('all'); }}
                              className="w-full text-left p-2 hover:bg-stone-50 rounded-lg flex items-center space-x-3 transition-colors"
                            >
                              <div className="w-8 h-8 bg-red-50 text-red-500 rounded-md flex items-center justify-center">
                                <ShieldAlert size={14} />
                              </div>
                              <div>
                                <p className="text-xs font-bold text-red-600">{s.activity_type}</p>
                                <p className="text-[10px] text-stone-400 truncate w-64">{s.description}</p>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    { (searchFilter === 'all' && globalSearchResults.products.length === 0 && globalSearchResults.orders.length === 0 && globalSearchResults.users.length === 0 && (!globalSearchResults.suspicious || globalSearchResults.suspicious.length === 0)) ||
                      (searchFilter !== 'all' && (
                        (searchFilter === 'products' && globalSearchResults.products.length === 0) ||
                        (searchFilter === 'orders' && globalSearchResults.orders.length === 0) ||
                        (searchFilter === 'users' && globalSearchResults.users.length === 0) ||
                        (searchFilter === 'suspicious' && (!globalSearchResults.suspicious || globalSearchResults.suspicious.length === 0))
                      )) 
                    && (
                      <div className="p-8 text-center">
                        <p className="text-sm text-stone-400">No {searchFilter !== 'all' ? searchFilter : ''} results found for "{globalSearchQuery}"</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex items-center space-x-2">
              <button 
                onClick={() => setActiveTab('Announcements')}
                className="p-2 text-stone-400 hover:text-primary hover:bg-stone-50 rounded-lg transition-all relative"
                title="Notifications"
              >
                <Bell size={20} />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
              </button>
              <button 
                onClick={() => setActiveTab('Store Settings')}
                className="p-2 text-stone-400 hover:text-primary hover:bg-stone-50 rounded-lg transition-all"
                title="Settings"
              >
                <Settings size={20} />
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto w-full p-6 lg:p-12 space-y-12">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
        {activeTab === 'Overview' && (
          <motion.div 
            initial="hidden"
            animate="show"
            variants={{
              hidden: { opacity: 0 },
              show: {
                opacity: 1,
                transition: {
                  staggerChildren: 0.05
                }
              }
            }}
            className="space-y-10"
          >
            <OverviewTabHeader fetchStats={fetchStats} />

            {/* Core Operational metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { label: 'Total Revenue', value: `₹${stats?.netRevenue || 0}`, icon: <IndianRupee size={22} />, trend: '', color: 'emerald', key: 'revenue' },
                { label: 'Pending Orders', value: stats?.pendingOrders || 0, icon: <ShoppingBag size={22} />, trend: '', color: 'amber', key: 'orders' },
                { label: 'Online Customers', value: stats?.activeUsers || 0, icon: <Activity size={22} />, trend: 'Live', color: 'blue' },
                { label: 'New Customers', value: stats?.newUserCount || 0, icon: <Users size={22} />, trend: '', color: 'purple' }
              ].map((stat, i) => (
                <motion.div 
                  key={i}
                  variants={{
                    hidden: { opacity: 0, y: 20 },
                    show: { opacity: 1, y: 0 }
                  }}
                  whileHover={{ y: -5 }}
                  className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-stone-100 transition-all group relative overflow-hidden"
                >
                  <div className="flex justify-between items-start mb-6">
                    <div className={cn(
                      "p-4 rounded-2xl transition-all duration-300",
                      stat.color === 'emerald' ? "bg-emerald-50 text-emerald-600" :
                      stat.color === 'amber' ? "bg-amber-50 text-amber-600" :
                      stat.color === 'red' ? "bg-red-50 text-red-600" :
                      "bg-stone-50 text-stone-900"
                    )}>
                      {stat.icon}
                    </div>
                  </div>
                  <p className="text-stone-400 text-[10px] font-black uppercase tracking-[0.2em] mb-1">{stat.label}</p>
                  <h3 className="text-3xl font-black text-stone-900 tracking-tighter">{stat.value}</h3>
                  
                  {stats?.revenueByDay && stats.revenueByDay.length > 0 && stat.key && (
                    <div className="absolute bottom-0 left-0 right-0 h-16 opacity-30 pointer-events-none">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={stats.revenueByDay}>
                          <Area 
                            type="monotone" 
                            dataKey={stat.key} 
                            stroke="currentColor" 
                            strokeWidth={2} 
                            fill={stat.color === 'emerald' ? '#10b981' : '#f59e0b'}
                            fillOpacity={0.05}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Performance Analytics */}
              <motion.div
                variants={{ hidden: { opacity: 0, x: -20 }, show: { opacity: 1, x: 0 } }}
                className="lg:col-span-2 bg-white p-10 rounded-[3rem] shadow-sm border border-stone-100 space-y-8"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-black text-stone-900 tracking-tight">Revenue & Sales</h3>
                    <p className="text-xs text-stone-400 font-bold uppercase tracking-widest mt-1">Growth over the last 30 days</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-emerald-500 rounded-full" />
                    <span className="text-[10px] font-black text-stone-500 uppercase tracking-widest">Normal Growth</span>
                  </div>
                </div>
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={stats?.revenueByDay || []}>
                      <defs>
                        <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#1c1917" stopOpacity={0.05}/>
                          <stop offset="95%" stopColor="#1c1917" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="5 5" vertical={false} stroke="#f5f5f4" />
                      <XAxis 
                        dataKey="day" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{fontSize: 10, fill: '#a8a29e', fontWeight: 900}} 
                        tickFormatter={(v) => v.slice(5)}
                      />
                      <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#a8a29e', fontWeight: 900}} />
                      <Tooltip 
                        contentStyle={{ borderRadius: '1.5rem', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '1rem' }}
                        itemStyle={{ fontWeight: 900, color: '#1c1917' }}
                      />
                      <Area type="monotone" dataKey="revenue" stroke="#1c1917" strokeWidth={4} fillOpacity={1} fill="url(#revenueGradient)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>

              {/* Maintenance & Health */}
              <motion.div
                variants={{ hidden: { opacity: 0, x: 20 }, show: { opacity: 1, x: 0 } }}
                className="bg-stone-900 rounded-[3rem] p-10 text-white space-y-8 relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl pointer-events-none" />
                <div className="relative z-10 flex items-center justify-between">
                  <h3 className="text-xl font-black tracking-tight">System Status</h3>
                  <Activity size={20} className="text-emerald-500 animate-pulse" />
                </div>

                <div className="space-y-4 relative z-10">
                  {[
                    { label: 'Site Performance', status: 'Healthy', delay: Math.floor(Math.random() * 20) + 30 },
                    { label: 'Order Processing', status: 'Active', delay: Math.floor(Math.random() * 10) + 5 },
                    { label: 'Database Status', status: 'Stable', delay: 0 }
                  ].map((sys, i) => (
                    <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center justify-between backdrop-blur-sm">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">{sys.label}</span>
                        <span className="text-xs font-bold text-white mt-0.5">{sys.status}</span>
                      </div>
                      <span className="text-[10px] font-black font-mono text-emerald-500">{sys.delay}ms</span>
                    </div>
                  ))}
                </div>

                <div className="pt-6 border-t border-white/10 space-y-4 relative z-10">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Network Alert Feed</span>
                    <button onClick={() => setActiveTab('System Status')} className="text-[10px] font-black text-emerald-500 hover:underline">Full Trace</button>
                  </div>
                  <div className="space-y-3">
                    {stats?.recentActivities?.slice(0, 2).map((log: any) => (
                      <div key={log.id} className="flex items-start space-x-3">
                        <div className={cn("w-1.5 h-1.5 rounded-full mt-1.5 shrink-0", log.level === 'error' ? "bg-red-500" : "bg-white/20")} />
                        <p className="text-[10px] font-medium text-white/70 line-clamp-2 leading-relaxed">{log.message}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <button 
                  onClick={() => setActiveTab('Audit Logs')}
                  className="w-full relative z-10 py-4 bg-emerald-500 text-stone-900 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-400 transition-all active:scale-95 shadow-xl shadow-emerald-500/20"
                >
                  View Activity Logs
                </button>
              </motion.div>
            </div>

            {/* Fulfillment Awareness */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <motion.div
                variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}
                className="bg-white p-10 rounded-[3rem] shadow-sm border border-stone-100 flex flex-col"
              >
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h3 className="text-xl font-black text-stone-900 tracking-tight">Recent Orders</h3>
                    <p className="text-xs text-stone-400 font-bold uppercase tracking-widest mt-1">Orders waiting to be processed</p>
                  </div>
                  <div className="flex -space-x-3">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="w-10 h-10 rounded-full border-4 border-white bg-stone-100 flex items-center justify-center text-[10px] font-black text-stone-400">D{i}</div>
                    ))}
                  </div>
                </div>
                <div className="space-y-4 flex-1">
                  {orders.filter(o => o.status === 'processing').slice(0, 3).map((order) => (
                    <div key={order.id} className="p-4 bg-stone-50 rounded-3xl border border-stone-100 flex items-center justify-between group hover:bg-stone-900 hover:text-white transition-all duration-300">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 rounded-xl bg-white border border-stone-200 flex items-center justify-center text-stone-900 group-hover:bg-white/10 group-hover:border-white/20 group-hover:text-white transition-colors">
                          <ShoppingBag size={18} />
                        </div>
                        <div>
                          <p className="text-sm font-black tracking-tight">#ORD-{order.id}</p>
                          <p className="text-[10px] font-bold text-stone-400 group-hover:text-white/50">{order.user_name}</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => setActiveTab('Orders')}
                        className="p-2 rounded-lg bg-white shadow-sm border border-stone-200 text-stone-400 hover:text-stone-900 transition-colors opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0"
                      >
                        <ArrowRight size={16} />
                      </button>
                    </div>
                  ))}
                  {orders.filter(o => o.status === 'processing').length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center py-10 opacity-30 text-stone-400 grayscale">
                      <Package size={48} strokeWidth={1} className="mb-4" />
                      <p className="text-xs font-black uppercase tracking-widest">No Active Fulfillment</p>
                    </div>
                  )}
                </div>
                <button 
                   onClick={() => setActiveTab('Orders')}
                   className="mt-8 py-4 border-2 border-stone-100 rounded-2xl text-[10px] font-black uppercase tracking-widest text-stone-400 hover:text-stone-900 hover:border-stone-900 transition-all"
                >
                  View All Orders
                </button>
              </motion.div>

              <motion.div
                variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}
                className="bg-white p-10 rounded-[3rem] shadow-sm border border-stone-100"
              >
                 <div className="flex items-center justify-between mb-8">
                  <div>
                    <h3 className="text-xl font-black text-stone-900 tracking-tight">Low Stock Alerts</h3>
                    <p className="text-xs text-stone-400 font-bold uppercase tracking-widest mt-1">Products that need restocking</p>
                  </div>
                  <AlertTriangle size={20} className={cn(lowStockProducts.length > 0 ? "text-red-500 animate-pulse" : "text-emerald-500")} />
                </div>
                
                <div className="space-y-4">
                   {lowStockProducts.slice(0, 4).map((p) => (
                    <div key={p.id} className="flex items-center justify-between p-4 bg-stone-50 rounded-3xl border border-stone-100">
                      <div className="flex items-center space-x-4">
                         <div className="w-12 h-12 rounded-xl bg-white border border-stone-200 overflow-hidden shrink-0">
                           <img src={p.image_url} alt="" className="w-full h-full object-cover" />
                         </div>
                         <div>
                            <p className="text-sm font-black text-stone-900 truncate max-w-[150px]">{p.name}</p>
                            <div className="flex items-center space-x-2 mt-0.5">
                              <span className="text-[9px] font-black text-red-500 uppercase">Stock Low</span>
                              <span className="text-[9px] font-bold text-stone-400">• {p.stock} Units left</span>
                            </div>
                         </div>
                      </div>
                      <button 
                        onClick={() => { setActiveTab('Product Catalog'); setProductSearchTerm(p.name); }}
                        className="px-4 py-2 bg-stone-900 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-stone-800 transition-all"
                      >
                        Restock
                      </button>
                    </div>
                  ))}
                  {lowStockProducts.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-10 opacity-30 text-stone-400 grayscale">
                      <CheckCircle2 size={48} strokeWidth={1} className="mb-4 text-emerald-500" />
                      <p className="text-xs font-black uppercase tracking-widest">Inventory Stabilized</p>
                    </div>
                  )}
                </div>
                <button 
                  onClick={() => setActiveTab('Product Catalog')}
                  className="w-full mt-8 py-4 border-2 border-stone-100 rounded-2xl text-[10px] font-black uppercase tracking-widest text-stone-400 hover:text-stone-900 hover:border-stone-900 transition-all"
                >
                  View Full Inventory
                </button>
              </motion.div>
            </div>
          </motion.div>
        )}


        {activeTab === 'Announcements' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
             <div className="bg-white p-10 rounded-[3rem] shadow-xl shadow-stone-200/40 border border-stone-100 flex flex-col lg:flex-row justify-between items-center gap-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -mr-32 -mt-32" />
              <div className="relative z-10 text-center lg:text-left">
                <h2 className="text-4xl font-black text-stone-900 tracking-tighter">Broadcast Center</h2>
                <p className="text-stone-500 mt-2 text-lg max-w-md">Communicate with your customers in real-time. Alerts, updates, and promotions.</p>
              </div>
              <button 
                onClick={() => setNotificationModal({ open: true })}
                className="relative z-10 w-full lg:w-auto flex items-center justify-center space-x-3 bg-stone-900 text-white px-10 py-5 rounded-[2rem] text-sm font-black uppercase tracking-widest hover:bg-stone-800 transition-all shadow-2xl shadow-stone-900/30 hover:scale-105 active:scale-95"
              >
                <Plus size={20} />
                <span>New Announcement</span>
              </button>
            </div>

            <div className="grid grid-cols-1 gap-8">
              {notifications.map((n: any) => (
                <motion.div 
                  layout
                  key={n.id} 
                  className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-stone-200/20 border border-stone-100 group hover:border-primary/30 transition-all relative overflow-hidden"
                >
                  <div className={cn(
                    "absolute top-0 left-0 w-1.5 h-full transition-colors",
                    n.priority === 'high' ? 'bg-red-500' :
                    n.priority === 'medium' ? 'bg-amber-500' : 'bg-blue-500'
                  )} />
                  
                  <div className="flex flex-col md:flex-row justify-between gap-8">
                    <div className="flex space-x-6">
                      <div className={cn(
                        "w-16 h-16 rounded-[1.5rem] flex items-center justify-center shrink-0 shadow-lg transition-transform group-hover:scale-110",
                        n.priority === 'high' ? 'bg-red-50 text-red-500' :
                        n.priority === 'medium' ? 'bg-amber-50 text-amber-500' : 'bg-blue-50 text-blue-500'
                      )}>
                        {n.type === 'alert' ? <ShieldAlert size={32} /> : <Bell size={32} />}
                      </div>
                      <div className="space-y-3">
                        <div className="flex items-center space-x-4">
                          <h4 className="text-2xl font-black text-stone-900 tracking-tight">{n.title}</h4>
                          <span className={cn(
                            "text-[9px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-full border-2",
                            n.priority === 'high' ? 'bg-red-50 text-red-600 border-red-100' :
                            n.priority === 'medium' ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-blue-50 text-blue-600 border-blue-100'
                          )}>
                            {n.priority}
                          </span>
                        </div>
                        <div 
                          className="prose prose-stone prose-sm max-w-2xl text-stone-600 font-medium leading-relaxed"
                          dangerouslySetInnerHTML={{ __html: n.message }}
                        />
                        <div className="flex flex-wrap items-center gap-6 mt-6 pt-6 border-t border-stone-50">
                           <div className="flex items-center space-x-2 text-[10px] font-black uppercase tracking-widest text-stone-400">
                             <Users size={14} className="text-primary" />
                             <span>Audience: <span className="text-stone-600">{n.target_role || 'All'}</span></span>
                           </div>
                           <div className="flex items-center space-x-2 text-[10px] font-black uppercase tracking-widest text-stone-400">
                             <Calendar size={14} className="text-primary" />
                             <span>Dispatched: {new Date(n.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                           </div>
                           {n.expires_at && (
                             <div className="flex items-center space-x-2 text-[10px] font-black uppercase tracking-widest text-red-400 bg-red-50 px-3 py-1 rounded-lg">
                               <Clock size={14} />
                               <span>Expires: {new Date(n.expires_at).toLocaleDateString('en-IN')}</span>
                             </div>
                           )}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-row md:flex-col items-center justify-center md:items-end gap-3 shrink-0">
                      <button 
                        onClick={() => handleDeleteNotification(n.id)}
                        className="w-12 h-12 flex items-center justify-center bg-stone-50 text-stone-400 hover:bg-red-50 hover:text-red-500 rounded-2xl transition-all shadow-sm border border-stone-100"
                        title="Delete Announcement"
                      >
                        <Trash2 size={20} />
                      </button>
                      <button 
                        onClick={() => {
                          setNewNotification({
                            title: n.title,
                            message: n.message,
                            type: n.type,
                            priority: n.priority,
                            target_role: n.target_role,
                            expires_at: n.expires_at || ''
                          });
                          setNotificationModal({ open: true });
                        }}
                        className="w-12 h-12 flex items-center justify-center bg-stone-50 text-stone-400 hover:bg-primary/10 hover:text-primary rounded-2xl transition-all shadow-sm border border-stone-100"
                        title="Clone & Re-send"
                      >
                        <RefreshCw size={20} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
              {notifications.length === 0 && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-stone-50 rounded-[3rem] p-24 text-center border-4 border-dashed border-stone-200"
                >
                  <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-6 text-stone-200 shadow-sm">
                    <Bell size={48} />
                  </div>
                  <h3 className="text-2xl font-black text-stone-900">Silence is Golden</h3>
                  <p className="text-stone-500 max-w-sm mx-auto mt-4 font-medium">Capture the attention of your customers with a well-crafted broadcast announcement.</p>
                </motion.div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'Analytics' && analyticsData && (
          <div className="space-y-8">
            {/* Intel Dashboard Header */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
              <div className="space-y-1">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary rotate-3">
                    <PieChartIcon size={24} />
                  </div>
                  <h2 className="text-4xl font-black text-stone-900 tracking-tight">Sales Reports</h2>
                </div>
                <p className="text-stone-500 font-medium text-lg ml-1">View detailed reports of your store's sales.</p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center bg-white p-1.5 rounded-2xl shadow-sm border border-stone-100">
                  <div className="flex items-center px-4 space-x-2 border-r border-stone-100">
                    <Calendar size={14} className="text-stone-400" />
                    <input 
                      type="date" 
                      value={analyticsStartDate}
                      onChange={(e) => setAnalyticsStartDate(e.target.value)}
                      className="bg-transparent border-none p-0 text-[10px] font-black uppercase tracking-widest focus:ring-0 w-24"
                    />
                    <span className="text-stone-300 text-[10px]">→</span>
                    <input 
                      type="date" 
                      value={analyticsEndDate}
                      onChange={(e) => setAnalyticsEndDate(e.target.value)}
                      className="bg-transparent border-none p-0 text-[10px] font-black uppercase tracking-widest focus:ring-0 w-24"
                    />
                  </div>
                  <button 
                    onClick={() => {
                      setAnalyticsStartDate('');
                      setAnalyticsEndDate('');
                    }}
                    className="p-2 text-stone-300 hover:text-primary transition-colors"
                  >
                    <RefreshCw size={14} className={isFetchingAnalytics ? "animate-spin" : ""} />
                  </button>
                </div>

                <div className="flex bg-white p-1.5 rounded-2xl shadow-sm border border-stone-100">
                   <select 
                    value={analyticsCategory}
                    onChange={(e) => setAnalyticsCategory(e.target.value)}
                    className="bg-transparent border-none text-[10px] font-black uppercase tracking-widest focus:ring-0 pr-8"
                  >
                    <option value="all">Global</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.name}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                <button 
                  className="bg-stone-900 text-white px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center space-x-3 shadow-xl shadow-stone-900/20 hover:bg-black transition-all active:scale-95"
                  onClick={() => window.print()}
                >
                  <Printer size={18} />
                  <span>Generate Report</span>
                </button>
              </div>
            </div>

            {/* Top Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-stone-100 group hover:border-primary/20 transition-all duration-500">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-stone-50 rounded-2xl text-stone-400 group-hover:bg-primary group-hover:text-white transition-all transform group-hover:-rotate-12">
                    <IndianRupee size={20} />
                  </div>
                  <div className="flex items-center text-emerald-500 text-[10px] font-black uppercase tracking-widest">
                    <TrendingUp size={12} className="mr-1" />
                    <span>+12.4%</span>
                  </div>
                </div>
                <p className="text-stone-400 text-[10px] font-black uppercase tracking-widest mb-1">Gross Revenue</p>
                <h3 className="text-3xl font-black text-stone-900">₹{(analyticsData.totalSales || 0).toLocaleString()}</h3>
                <div className="mt-4 h-1 w-full bg-stone-50 rounded-full overflow-hidden">
                   <motion.div initial={{ width: 0 }} animate={{ width: '70%' }} className="h-full bg-emerald-500" />
                </div>
              </div>

              <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-stone-100 group hover:border-primary/20 transition-all duration-500">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-stone-50 rounded-2xl text-stone-400 group-hover:bg-primary group-hover:text-white transition-all transform group-hover:-rotate-12">
                    <ShoppingBag size={20} />
                  </div>
                  <div className="flex items-center text-primary text-[10px] font-black uppercase tracking-widest">
                    <Activity size={12} className="mr-1" />
                    <span>Active</span>
                  </div>
                </div>
                <p className="text-stone-400 text-[10px] font-black uppercase tracking-widest mb-1">Fulfilled Orders</p>
                <h3 className="text-3xl font-black text-stone-900">{analyticsData.totalOrders}</h3>
                <div className="mt-4 h-1 w-full bg-stone-50 rounded-full overflow-hidden">
                   <motion.div initial={{ width: 0 }} animate={{ width: '55%' }} className="h-full bg-primary" />
                </div>
              </div>

               <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-stone-100 group hover:border-primary/20 transition-all duration-500">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-stone-50 rounded-2xl text-stone-400 group-hover:bg-primary group-hover:text-white transition-all transform group-hover:-rotate-12">
                    <Zap size={20} />
                  </div>
                  <div className="flex items-center text-blue-500 text-[10px] font-black uppercase tracking-widest">
                    <Target size={12} className="mr-1" />
                    <span>High</span>
                  </div>
                </div>
                <p className="text-stone-400 text-[10px] font-black uppercase tracking-widest mb-1">Conversion Velocity</p>
                <h3 className="text-3xl font-black text-stone-900">
                  {analyticsData.conversionData?.length > 0 && analyticsData.conversionData.reduce((acc: any, curr: any) => acc + curr.visitors, 0) > 0
                    ? (analyticsData.conversionData.reduce((acc: any, curr: any) => acc + curr.orders, 0) / 
                       analyticsData.conversionData.reduce((acc: any, curr: any) => acc + curr.visitors, 0) * 100).toFixed(1) 
                    : '4.2'}%
                </h3>
                <div className="mt-4 h-1 w-full bg-stone-50 rounded-full overflow-hidden">
                   <motion.div initial={{ width: 0 }} animate={{ width: '40%' }} className="h-full bg-blue-500" />
                </div>
              </div>

               <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-stone-100 group hover:border-primary/20 transition-all duration-500">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-stone-50 rounded-2xl text-stone-400 group-hover:bg-primary group-hover:text-white transition-all transform group-hover:-rotate-12">
                    <Wallet size={20} />
                  </div>
                  <div className="flex items-center text-amber-500 text-[10px] font-black uppercase tracking-widest">
                    <ArrowDown size={12} className="mr-1" />
                    <span>Focus</span>
                  </div>
                </div>
                <p className="text-stone-400 text-[10px] font-black uppercase tracking-widest mb-1">Stock Portfolio Val.</p>
                <h3 className="text-3xl font-black text-stone-900">₹{(analyticsData.inventoryData?.total_cost || 0).toLocaleString()}</h3>
                <div className="mt-4 h-1 w-full bg-stone-50 rounded-full overflow-hidden">
                   <motion.div initial={{ width: 0 }} animate={{ width: '85%' }} className="h-full bg-amber-500" />
                </div>
              </div>
            </div>

            {/* AI Actionable Insights */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <motion.div 
                whileHover={{ y: -5 }}
                className="bg-stone-900 p-8 rounded-[2.5rem] text-white overflow-hidden relative group"
              >
                <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                   <Sparkles size={120} />
                </div>
                <div className="relative z-10 space-y-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-primary">
                      <TrendingUp size={20} />
                    </div>
                    <span className="font-black text-xs uppercase tracking-[0.2em]">Growth Projection</span>
                  </div>
                  <p className="text-stone-400 font-medium leading-relaxed">
                    Based on current velocity, revenue is projected to exceed <span className="text-white font-black">₹{(analyticsData.totalSales * 1.15).toLocaleString()}</span> by month-end.
                  </p>
                  <div className="flex items-center text-[10px] font-black uppercase tracking-widest text-emerald-400">
                    <CheckCircle2 size={12} className="mr-2" />
                    <span>Strategy Verified</span>
                  </div>
                </div>
              </motion.div>

              <motion.div 
                whileHover={{ y: -5 }}
                className="bg-white p-8 rounded-[2.5rem] border border-stone-100 shadow-sm overflow-hidden relative group"
              >
                <div className="space-y-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-500">
                      <AlertTriangle size={20} />
                    </div>
                    <span className="font-black text-xs uppercase tracking-[0.2em] text-stone-400">Stock At Risk</span>
                  </div>
                  <p className="text-stone-500 font-medium leading-relaxed">
                    <span className="text-stone-900 font-black">{lowStockProducts.length} items</span> are critical. Restock now to capture <span className="text-stone-900 font-black">₹42k</span> in pending demand.
                  </p>
                   <button 
                    onClick={() => setActiveTab('Product Catalog')}
                    className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center hover:translate-x-2 transition-transform"
                   >
                    Review Catalog <ArrowRight size={12} className="ml-2" />
                  </button>
                </div>
              </motion.div>

              <motion.div 
                whileHover={{ y: -5 }}
                className="bg-white p-8 rounded-[2.5rem] border border-stone-100 shadow-sm overflow-hidden relative group"
              >
                <div className="space-y-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center text-red-500">
                      <Clock size={20} />
                    </div>
                    <span className="font-black text-xs uppercase tracking-[0.2em] text-stone-400">Near Expiry</span>
                  </div>
                  <p className="text-stone-500 font-medium leading-relaxed">
                    <span className="text-stone-900 font-black">{expiringSoon.length} entries</span> approach terminal dates. Strategy: Flash liquidation recommended.
                  </p>
                   <button 
                    onClick={() => setActiveTab('Product Catalog')}
                    className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center hover:translate-x-2 transition-transform"
                   >
                    Clearance Flow <ArrowRight size={12} className="ml-2" />
                  </button>
                </div>
              </motion.div>

              <motion.div 
                whileHover={{ y: -5 }}
                className="bg-white p-8 rounded-[2.5rem] border border-stone-100 shadow-sm overflow-hidden relative group"
              >
                <div className="space-y-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-500">
                      <Users size={20} />
                    </div>
                    <span className="font-black text-xs uppercase tracking-[0.2em] text-stone-400">Loyalty Matrix</span>
                  </div>
                  <p className="text-stone-500 font-medium leading-relaxed">
                    Your <span className="text-stone-900 font-black">Champions</span> segment grew by <span className="text-stone-900 font-black">8.4%</span>. Deploy VIP coupons to lock in value.
                  </p>
                   <button 
                    onClick={() => setActiveTab('Promotions')}
                    className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center hover:translate-x-2 transition-transform"
                   >
                    Create Campaign <ArrowRight size={12} className="ml-2" />
                  </button>
                </div>
              </motion.div>
            </div>

            {/* Daily Trends & Product Analytics */}
            {salesAnalytics && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-stone-100">
                  <h3 className="text-xl font-black mb-6">Revenue Velocity (30D)</h3>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={salesAnalytics.dailySales}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Area type="monotone" dataKey="total" stroke="#3b82f6" fill="#bfdbfe" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-stone-100">
                  <h3 className="text-xl font-black mb-6 text-stone-900">Elite Performance Ledger</h3>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={salesAnalytics.topProducts} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                        <XAxis type="number" />
                        <YAxis dataKey="name" type="category" width={100} />
                        <Tooltip />
                        <Bar dataKey="sold" fill="#10b981" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            )}
            
            {/* Existing Analytics */}
            <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-stone-100">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-xl font-black text-stone-900 tracking-tight">Inventory Valuation Audit</h3>
                  <p className="text-xs text-stone-400 mt-1">Real-time asset exposure and markup efficiency</p>
                </div>
                <div className="bg-stone-50 px-4 py-2 rounded-2xl border border-stone-100">
                  <span className="text-[10px] font-black uppercase tracking-widest text-stone-400">Total Items</span>
                  <p className="text-lg font-black">{analyticsData.inventoryData.total_items}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="space-y-6">
                  <div>
                    <p className="text-stone-400 text-[10px] font-black uppercase tracking-widest mb-2">Total Stock Quantity</p>
                    <h4 className="text-2xl font-black">{(analyticsData.inventoryData?.total_stock || 0).toLocaleString()} units</h4>
                  </div>
                  <div>
                    <p className="text-stone-400 text-[10px] font-black uppercase tracking-widest mb-2">Total Inventory Cost</p>
                    <h4 className="text-2xl font-black text-red-600">₹{(analyticsData.inventoryData?.total_cost || 0).toLocaleString()}</h4>
                  </div>
                  <div>
                    <p className="text-stone-400 text-[10px] font-black uppercase tracking-widest mb-2">Potential Revenue</p>
                    <h4 className="text-2xl font-black text-emerald-600">₹{(analyticsData.inventoryData?.potential_revenue || 0).toLocaleString()}</h4>
                  </div>
                  <div className="pt-4 border-t border-stone-100">
                    <p className="text-stone-400 text-[10px] font-black uppercase tracking-widest mb-2">Potential Profit Margin</p>
                    <h4 className="text-2xl font-black text-primary">
                      {analyticsData.inventoryData?.potential_revenue > 0 
                        ? (((analyticsData.inventoryData.potential_revenue - analyticsData.inventoryData.total_cost) / analyticsData.inventoryData.potential_revenue) * 100).toFixed(1)
                        : '0.0'}%
                    </h4>
                  </div>
                </div>
                
                <div className="md:col-span-2 h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={[
                      { name: 'Cost Value', value: analyticsData.inventoryData.total_cost, fill: '#EF4444' },
                      { name: 'Potential Revenue', value: analyticsData.inventoryData.potential_revenue, fill: '#10B981' },
                      { name: 'Potential Profit', value: analyticsData.inventoryData.potential_revenue - analyticsData.inventoryData.total_cost, fill: '#F27D26' }
                    ]}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f5f5f5" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#A8A29E', fontWeight: 700}} />
                      <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#A8A29E', fontWeight: 700}} tickFormatter={(val) => `₹${val/1000}k`} />
                      <Tooltip 
                        formatter={(val: any) => `₹${(val || 0).toLocaleString()}`}
                        contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)'}}
                      />
                      <Bar dataKey="value" radius={[8, 8, 0, 0]} barSize={60} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Customer Segmentation & RFM Analysis */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-stone-100">
                <div className="mb-8">
                  <h3 className="text-xl font-black text-stone-900">Identity-Based Segments</h3>
                  <p className="text-xs text-stone-400 mt-1">Behavioral classification (RFM Matrix)</p>
                </div>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={analyticsData.rfmSegmentData}
                        cx="50%"
                        cy="50%"
                        innerRadius={80}
                        outerRadius={110}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {analyticsData.rfmSegmentData.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={[
                            '#F27D26', // Primary
                            '#10B981', // Emerald
                            '#3B82F6', // Blue
                            '#8B5CF6', // Violet
                            '#F59E0B'  // Amber
                          ][index % 5]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                      />
                      <Legend verticalAlign="bottom" height={36}/>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-stone-100">
                <div className="mb-8">
                  <h3 className="text-xl font-black text-stone-900">Profit Center Attribution</h3>
                  <p className="text-xs text-stone-400 mt-1">Segment-specific revenue contribution</p>
                </div>
                <div className="space-y-6">
                  {analyticsData.rfmSegmentData.sort((a: any, b: any) => b.revenue - a.revenue).map((segment: any, idx: number) => (
                    <div key={idx} className="space-y-2">
                       <div className="flex justify-between text-xs font-bold uppercase tracking-widest">
                          <span className="text-stone-900">{segment.name}</span>
                          <span className="text-stone-400">₹{(segment.revenue || 0).toLocaleString()}</span>
                       </div>
                       <div className="h-2 w-full bg-stone-100 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${(segment.revenue / analyticsData.totalSales * 100) || 0}%` }}
                            className="h-full bg-primary rounded-full"
                          />
                       </div>
                    </div>
                  ))}
                  {(!analyticsData.rfmSegmentData || analyticsData.rfmSegmentData.length === 0) && (
                    <p className="text-center text-stone-400 italic py-12">Waiting for more customer data...</p>
                  )}
                </div>
              </div>
            </div>

            {/* Existing Sales Trend ... */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 bg-white p-8 rounded-3xl shadow-sm border border-stone-100">
                <div className="flex justify-between items-center mb-8">
                  <div>
                    <h3 className="text-xl font-black">Sales Performance & Forecast</h3>
                    <p className="text-xs text-stone-400 mt-1">Historical data with 7-day predictive trend</p>
                  </div>
                  <div className="flex bg-stone-100 p-1 rounded-xl">
                    <button 
                      onClick={() => setAnalyticsTimeframe('daily')}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all",
                        analyticsTimeframe === 'daily' ? "bg-white shadow-sm text-primary" : "text-stone-400 hover:text-stone-600"
                      )}
                    >
                      Daily
                    </button>
                    <button 
                      onClick={() => setAnalyticsTimeframe('weekly')}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all",
                        analyticsTimeframe === 'weekly' ? "bg-white shadow-sm text-primary" : "text-stone-400 hover:text-stone-600"
                      )}
                    >
                      Weekly
                    </button>
                    <button 
                      onClick={() => setAnalyticsTimeframe('monthly')}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all",
                        analyticsTimeframe === 'monthly' ? "bg-white shadow-sm text-primary" : "text-stone-400 hover:text-stone-600"
                      )}
                    >
                      Monthly
                    </button>
                  </div>
                </div>
                <div className="h-[350px] relative">
                  {isFetchingAnalytics && (
                    <div className="absolute inset-0 bg-white/50 backdrop-blur-[2px] z-10 flex items-center justify-center rounded-2xl">
                      <div className="flex flex-col items-center">
                        <RefreshCw size={24} className="text-primary animate-spin mb-2" />
                        <p className="text-[10px] font-black uppercase tracking-widest text-stone-400">Updating Forecast...</p>
                      </div>
                    </div>
                  )}
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={[
                      ...getGroupedSalesData(),
                      // Enhanced 7-day forecast based on linear trend of last 14 days
                      ...(() => {
                        const sales = analyticsData.salesOverTime;
                        if (sales.length < 2) return [];
                        
                        const last14 = sales.slice(-14);
                        const n = last14.length;
                        const xSum = (n * (n - 1)) / 2;
                        const ySum = last14.reduce((acc: number, curr: any) => acc + curr.sales, 0);
                        const xySum = last14.reduce((acc: number, curr: any, i: number) => acc + (i * curr.sales), 0);
                        const x2Sum = (n * (n - 1) * (2 * n - 1)) / 6;
                        
                        const slope = (n * xySum - xSum * ySum) / (n * x2Sum - xSum * xSum);
                        const intercept = (ySum - slope * xSum) / n;
                        
                        const lastDate = new Date(sales[sales.length - 1].date);
                        return Array.from({ length: 7 }).map((_, i) => {
                          const forecastDate = new Date(lastDate);
                          forecastDate.setDate(lastDate.getDate() + i + 1);
                          const forecastVal = Math.max(0, slope * (n + i) + intercept);
                          // Add some seasonality/noise
                          const noise = (Math.random() - 0.5) * (forecastVal * 0.1);
                          return {
                            date: forecastDate.toISOString().split('T')[0],
                            sales: 0,
                            forecast: Math.round(forecastVal + noise)
                          };
                        });
                      })()
                    ]}>
                      <defs>
                        <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#F27D26" stopOpacity={0.15}/>
                          <stop offset="95%" stopColor="#F27D26" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorForecast" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#A8A29E" stopOpacity={0.1}/>
                          <stop offset="95%" stopColor="#A8A29E" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f5f5f5" />
                      <XAxis 
                        dataKey="date" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{fontSize: 10, fill: '#A8A29E', fontWeight: 700}} 
                        tickFormatter={(val) => new Date(val).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      />
                      <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{fontSize: 10, fill: '#A8A29E', fontWeight: 700}}
                        tickFormatter={(val) => `₹${val >= 1000 ? (val/1000).toFixed(1) + 'k' : val}`}
                      />
                      <Tooltip 
                        contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '12px'}}
                        itemStyle={{fontWeight: 900, fontSize: '12px'}}
                        labelStyle={{fontWeight: 900, fontSize: '10px', color: '#A8A29E', marginBottom: '4px'}}
                        formatter={(val: any, name: string) => [
                          `₹${(val || 0).toLocaleString()}`, 
                          name === 'sales' ? 'Actual Revenue' : 'Forecasted'
                        ]}
                      />
                      <Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', marginBottom: '20px'}} />
                      <Area type="monotone" dataKey="sales" name="Actual Revenue" stroke="#F27D26" strokeWidth={4} fillOpacity={1} fill="url(#colorSales)" />
                      <Area type="monotone" dataKey="forecast" name="Forecasted" stroke="#A8A29E" strokeWidth={2} strokeDasharray="5 5" fillOpacity={1} fill="url(#colorForecast)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Popular Categories */}
              <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-stone-100">
                <h3 className="text-xl font-black mb-8 text-stone-900">Category Dominance</h3>
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={analyticsData.salesByCategory}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {analyticsData.salesByCategory.map((_: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={['#F27D26', '#3B82F6', '#10B981', '#8B5CF6', '#EC4899', '#F59E0B'][index % 6]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)'}}
                      />
                      <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{fontSize: '10px', fontWeight: 700, textTransform: 'uppercase'}} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-8 space-y-3">
                  {analyticsData.salesByCategory.slice(0, 3).map((cat: any, i: number) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: ['#F27D26', '#3B82F6', '#10B981'][i] }} />
                        <span className="text-xs font-bold text-stone-600">{cat.name}</span>
                      </div>
                      <span className="text-xs font-black">₹{(cat.value || 0).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Customer Segmentation Analysis */}
            <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-stone-100">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-xl font-black text-stone-900">Customer Groups</h3>
                  <p className="text-xs text-stone-400 mt-1">Detailed ranking based on purchase history.</p>
                </div>
              </div>
              
              {/* Live Fleet Map */}
             <div className="bg-white p-6 rounded-[2rem] border border-stone-100 shadow-sm mb-8">
               <h3 className="text-xs font-black text-stone-400 uppercase tracking-widest mb-6">Live Logistics Network</h3>
               <div className="h-[400px] rounded-2xl overflow-hidden">
                 <MapContainer center={[12.9716, 77.5946]} zoom={11} className="h-full w-full">
                   <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                   {runners.filter(r => r.current_lat && r.current_lng).map(runner => (
                     <Marker key={runner.id} position={[runner.current_lat, runner.current_lng]}>
                       <Popup>
                         <div className="font-bold">{runner.name}</div>
                         <div className="text-xs">{runner.status}</div>
                       </Popup>
                     </Marker>
                   ))}
                 </MapContainer>
               </div>
             </div>

             <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="h-[300px]">
                  <p className="text-[10px] font-black uppercase tracking-widest text-stone-400 mb-4">Segment Distribution</p>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={analyticsData.rfmSegmentData || []}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {(analyticsData.rfmSegmentData || []).map((_: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={['#10B981', '#F27D26', '#3B82F6', '#F59E0B', '#EF4444', '#A8A29E'][index % 6]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{borderRadius: '16px', border: 'none'}} />
                      <Legend verticalAlign="bottom" iconType="circle" wrapperStyle={{fontSize: '10px', fontWeight: 700}} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                
                <div className="lg:col-span-2 overflow-x-auto">
                  <p className="text-[10px] font-black uppercase tracking-widest text-stone-400 mb-4">High Value Customers & RFM Scores</p>
                  <table className="w-full text-left">
                    <thead className="bg-stone-50/50 text-stone-400 text-[10px] uppercase font-black tracking-widest">
                      <tr>
                        <th className="px-4 py-3">Customer</th>
                        <th className="px-4 py-3">RFM Segment</th>
                        <th className="px-4 py-3">R-F-M Score</th>
                        <th className="px-4 py-3">Orders</th>
                        <th className="px-4 py-3">Total Spent</th>
                        <th className="px-4 py-3">Last Active</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {analyticsData.customerData
                        .sort((a: any, b: any) => b.total_spent - a.total_spent)
                        .slice(0, 5)
                        .map((cust: any) => (
                          <tr key={cust.id} className="hover:bg-stone-50/50 transition-colors">
                            <td className="px-4 py-3 font-bold text-sm">{cust.name}</td>
                            <td className="px-4 py-3">
                              <span className={cn(
                                "px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider",
                                cust.rfmSegment === 'Champions' ? "bg-emerald-100 text-emerald-600" : 
                                cust.rfmSegment === 'Loyal' ? "bg-blue-100 text-blue-600" :
                                cust.rfmSegment === 'At Risk' ? "bg-amber-100 text-amber-600" :
                                "bg-stone-100 text-stone-600"
                              )}>
                                {cust.rfmSegment}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex space-x-1">
                                {[...Array(3)].map((_, i) => (
                                  <div key={i} className={cn("w-2 h-2 rounded-full", i < cust.rScore ? "bg-emerald-500" : "bg-stone-200")} title="Recency" />
                                ))}
                                <div className="w-1" />
                                {[...Array(3)].map((_, i) => (
                                  <div key={i} className={cn("w-2 h-2 rounded-full", i < cust.fScore ? "bg-blue-500" : "bg-stone-200")} title="Frequency" />
                                ))}
                                <div className="w-1" />
                                {[...Array(3)].map((_, i) => (
                                  <div key={i} className={cn("w-2 h-2 rounded-full", i < cust.mScore ? "bg-primary" : "bg-stone-200")} title="Monetary" />
                                ))}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm font-black">{cust.order_count}</td>
                            <td className="px-4 py-3 text-sm font-black text-primary">₹{(cust.total_spent || 0).toLocaleString()}</td>
                            <td className="px-4 py-3 text-xs text-stone-400">
                              {cust.last_order ? new Date(cust.last_order).toLocaleDateString() : 'Never'}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Conversion Rate Trend */}
              <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-stone-100">
                <h3 className="text-xl font-black mb-8 text-stone-900">Acquisition Funnel</h3>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart 
                      layout="vertical"
                      data={analyticsData.conversionFunnel}
                      margin={{ left: 40, right: 40 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f5f5f5" />
                      <XAxis type="number" hide />
                      <YAxis 
                        dataKey="name" 
                        type="category" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{fontSize: 10, fill: '#A8A29E', fontWeight: 700}}
                      />
                      <Tooltip 
                        contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)'}}
                        formatter={(val: any) => [(val || 0).toLocaleString(), 'Users']}
                      />
                      <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={40}>
                        {analyticsData.conversionFunnel.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Acquisition Sources */}
              <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-stone-100">
                <h3 className="text-xl font-black mb-8 text-stone-900">Traffic Attribution</h3>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={analyticsData.acquisitionSources}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {analyticsData.acquisitionSources.map((_: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={['#F27D26', '#3B82F6', '#10B981', '#8B5CF6'][index % 4]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)'}}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Popular Products Table */}
            <div className="bg-white rounded-[2.5rem] shadow-sm border border-stone-100 overflow-hidden">
              <div className="p-8 border-b border-stone-100">
                <h3 className="text-xl font-black text-stone-900">Top Performing SKUs</h3>
                <p className="text-xs text-stone-400 mt-1">Efficiency breakdown of high-velocity inventory</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-stone-50/50 text-stone-400 text-[10px] uppercase font-black tracking-widest">
                    <tr>
                      <th className="px-8 py-5">Rank</th>
                      <th className="px-6 py-5">Product Name</th>
                      <th className="px-6 py-5">Orders</th>
                      <th className="px-6 py-5">Quantity Sold</th>
                      <th className="px-6 py-5">Stock Left</th>
                      <th className="px-6 py-5">Performance</th>
                      <th className="px-8 py-5">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {analyticsData.popularProducts.map((p: any, i: number) => (
                      <tr key={i} className="hover:bg-stone-50/50 transition-colors">
                        <td className="px-8 py-5">
                          <span className="w-6 h-6 bg-stone-100 rounded-lg flex items-center justify-center text-[10px] font-black text-stone-400">
                            {i + 1}
                          </span>
                        </td>
                        <td className="px-6 py-5 font-bold text-sm text-stone-900">{p.name}</td>
                        <td className="px-6 py-5 text-sm font-black text-stone-600">{p.sales_count}</td>
                        <td className="px-6 py-5 text-sm font-black text-stone-600">{p.total_qty}</td>
                        <td className="px-6 py-5">
                          <span className={cn(
                            "text-xs font-bold",
                            p.stock <= 5 ? "text-red-600" : "text-stone-600"
                          )}>
                            {p.stock} units
                          </span>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex items-center space-x-3">
                            <div className="flex-1 h-1.5 bg-stone-100 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-primary" 
                                style={{ width: `${(p.total_qty / analyticsData.popularProducts[0].total_qty) * 100}%` }}
                              />
                            </div>
                            <span className="text-[10px] font-black text-stone-400">
                              {Math.round((p.total_qty / analyticsData.popularProducts[0].total_qty) * 100)}%
                            </span>
                          </div>
                        </td>
                        <td className="px-8 py-5">
                          {p.stock <= 5 && (
                            <button 
                              onClick={() => { setActiveTab('Product Catalog'); setProductSearchTerm(p.name); }}
                              className="text-[10px] font-black uppercase tracking-wider text-primary hover:underline"
                            >
                              Restock
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'Logistics' && (
          <div className="space-y-8">
            <div className="flex justify-between items-center bg-white p-8 rounded-3xl shadow-sm border border-stone-100">
              <div>
                <h2 className="text-3xl font-black">Logistics Hub</h2>
                <p className="text-stone-500 mt-1">Manage delivery runners and track active deliveries.</p>
              </div>
              <button 
                onClick={() => setRunnerModal({ open: true, mode: 'add' })}
                className="bg-primary text-white px-6 py-3 rounded-2xl font-bold flex items-center space-x-2 shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
              >
                <Plus size={18} />
                <span>Add Runner</span>
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                {/* Active Deliveries Map Placeholder */}
                <div className="bg-stone-900 rounded-3xl aspect-[16/9] relative overflow-hidden group shadow-2xl">
                  {/* Mock Map UI */}
                  <div className="absolute inset-0 opacity-40 bg-[url('https://api.mapbox.com/styles/v1/mapbox/dark-v10/static/-122.4241,37.78,14,0/800x450?access_token=pk.xxx')] bg-cover" />
                  
                  {/* Map Hotspots (Mock Runners) */}
                  <div className="absolute top-1/4 left-1/3 animate-bounce">
                    <div className="bg-primary text-white p-2 rounded-full shadow-lg border-2 border-white">
                      <Truck size={14} />
                    </div>
                  </div>
                  <div className="absolute bottom-1/3 right-1/4 animate-pulse">
                    <div className="bg-emerald-500 text-white p-2 rounded-full shadow-lg border-2 border-white">
                      <Truck size={14} />
                    </div>
                  </div>

                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                     <p className="text-white/20 font-black text-6xl rotate-[-20deg]">LIVE TRACKING</p>
                  </div>
                  
                  <div className="absolute bottom-6 left-6 right-6 bg-stone-900/80 backdrop-blur-md border border-white/10 p-4 rounded-2xl flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                        <Activity size={20} />
                      </div>
                      <div>
                        <p className="text-white text-xs font-bold uppercase tracking-widest">Active Runners</p>
                        <p className="text-white/60 text-xs">4 of 5 runners on duty</p>
                      </div>
                    </div>
                    <div className="h-8 w-px bg-white/10" />
                    <div>
                      <p className="text-white text-xs font-bold uppercase tracking-widest">Live Updates</p>
                      <p className="text-emerald-400 text-xs font-bold">Enabled</p>
                    </div>
                  </div>
                </div>

                {/* Dispatch Queue */}
                <div className="bg-white rounded-3xl shadow-sm border border-stone-100 overflow-hidden">
                  <div className="p-8 border-b border-stone-100 flex justify-between items-center bg-stone-50/50">
                    <h3 className="text-lg font-black">Dispatch Queue</h3>
                    <span className="bg-amber-100 text-amber-700 text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-xl">
                      {orders.filter(o => o.status === 'pending').length} Pending Orders
                    </span>
                  </div>
                  <div className="divide-y divide-stone-100">
                    {orders.filter(o => o.status === 'pending').map(order => (
                      <div key={order.id} className="p-6 flex items-center justify-between hover:bg-stone-50/30 transition-all group">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
                            <ShoppingBag size={20} />
                          </div>
                          <div>
                            <p className="text-sm font-black text-stone-900">#ORD-{order.id} • ₹{order.total}</p>
                            <p className="text-[10px] text-stone-400 font-bold uppercase tracking-widest leading-none mt-1">{order.address}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                           <select 
                            className="bg-stone-100 border-none rounded-xl px-3 py-2 text-xs font-bold focus:ring-2 focus:ring-primary/20"
                            onChange={(e) => handleAssignRunner(order.id, parseInt(e.target.value))}
                            defaultValue=""
                           >
                            <option value="" disabled>Assign Runner</option>
                            {runners.filter(r => r.status === 'active' && !r.is_busy).map(r => (
                              <option key={r.id} value={r.id}>{r.name}</option>
                            ))}
                           </select>
                           <button className="p-2 bg-stone-100 text-stone-400 rounded-xl hover:bg-primary hover:text-white transition-all">
                              <ArrowRight size={16} />
                           </button>
                        </div>
                      </div>
                    ))}
                    {orders.filter(o => o.status === 'pending').length === 0 && (
                      <div className="p-12 text-center">
                        <div className="w-16 h-16 bg-stone-50 text-stone-300 rounded-full flex items-center justify-center mx-auto mb-4">
                          <CheckCircle2 size={32} />
                        </div>
                        <p className="text-stone-400 font-bold">Queue is empty!</p>
                        <p className="text-[10px] text-stone-400 uppercase tracking-widest mt-1">Ready for next orders</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                {/* Runner Status List */}
                <div className="bg-white rounded-3xl shadow-sm border border-stone-100 p-8">
                  <h3 className="text-lg font-black mb-6">Runners Fleet</h3>
                  <div className="space-y-4">
                    {runners.map(runner => (
                      <div key={runner.id} className="p-4 bg-stone-50 rounded-2xl border border-stone-100/50 group relative overflow-hidden">
                        <div className="flex items-center justify-between mb-3">
                           <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
                                <Truck size={18} />
                              </div>
                              <div>
                                <p className="text-sm font-black text-stone-900">{runner.name}</p>
                                <p className="text-[10px] text-stone-400 font-bold uppercase tracking-widest">{runner.phone}</p>
                              </div>
                           </div>
                           <span className={cn(
                             "text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-lg",
                             runner.is_busy ? "bg-amber-100 text-amber-600" : "bg-emerald-100 text-emerald-600"
                           )}>
                             {runner.is_busy ? "Busy" : "Ready"}
                           </span>
                        </div>
                        {runner.is_busy && (
                          <div className="mt-2 text-xs font-bold text-stone-500 flex items-center justify-between">
                            <span className="flex items-center gap-1"><Clock size={12} /> 22 min left</span>
                            <span className="text-[10px] text-primary">View Track</span>
                          </div>
                        )}
                        <div className="absolute inset-x-0 bottom-0 h-1 bg-stone-200">
                           <div className="h-full bg-primary" style={{ width: runner.is_busy ? '65%' : '0%' }} title="Loading progress mock" />
                        </div>
                      </div>
                    ))}
                    <button 
                      onClick={() => setRunnerModal({ open: true, mode: 'add' })}
                      className="w-full py-4 bg-stone-50 border-2 border-dashed border-stone-200 rounded-2xl text-stone-400 font-black uppercase text-xs tracking-widest hover:border-primary hover:bg-stone-100/50 hover:text-primary transition-all"
                    >
                      + Register New Runner
                    </button>
                  </div>
                </div>

                {/* Logistics Stats */}
                <div className="bg-stone-900 text-white p-8 rounded-3xl shadow-xl space-y-6">
                  <h3 className="font-bold text-lg">Delivery Metrics</h3>
                  <div className="space-y-6">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs text-white/60 font-bold uppercase tracking-widest">Avg Delivery Time</span>
                        <span className="text-lg font-black">24m</span>
                      </div>
                      <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full bg-primary w-3/4 rounded-full" />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs text-white/60 font-bold uppercase tracking-widest">Fleet Utilization</span>
                        <span className="text-lg font-black">80%</span>
                      </div>
                      <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 w-[80%] rounded-full" />
                      </div>
                    </div>
                    <div className="pt-6 border-t border-white/10 grid grid-cols-2 gap-4">
                      <div className="text-center">
                        <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest mb-1">Delivered</p>
                        <p className="text-2xl font-black">342</p>
                      </div>
                      <div className="text-center">
                        <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest mb-1">Cancelled</p>
                        <p className="text-2xl font-black text-red-400">12</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'Audit Logs' && (
          <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-8">
              <div>
                <h2 className="text-4xl font-black text-stone-900 tracking-tight">Security & Audit Cipher</h2>
                <p className="text-stone-500 mt-2 text-lg font-medium">Detailed forensics of all administrative actions and security events.</p>
              </div>
              <div className="flex flex-wrap items-center gap-4 bg-white p-3 rounded-[2rem] shadow-sm border border-stone-100">
                <select 
                  className="bg-stone-50 text-stone-900 px-6 py-4 rounded-2xl border-none text-[10px] font-black uppercase tracking-widest outline-none focus:ring-2 focus:ring-primary/20 appearance-none cursor-pointer"
                  value={auditLogType}
                  onChange={(e) => setAuditLogType(e.target.value)}
                >
                  <option value="all">Unfiltered Domain</option>
                  <option value="product">Product Protocol</option>
                  <option value="order">Trade Logistics</option>
                  <option value="user">Human Intelligence</option>
                  <option value="settings">Core Parameters</option>
                  <option value="auth">Security Handshake</option>
                </select>
                <div className="w-px h-10 bg-stone-100 hidden sm:block" />
                <button 
                  onClick={() => fetchAuditLogs(auditLogType, auditLogLimit)}
                  className="p-4 bg-stone-50 text-stone-400 hover:text-primary rounded-2xl transition-all shadow-sm group"
                >
                  <RefreshCw size={20} className={cn("group-active:animate-spin", isFetchingAudit && "animate-spin")} />
                </button>
                 <button 
                  className="flex items-center space-x-3 bg-stone-900 text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-xl shadow-stone-900/10 active:scale-95"
                >
                  <Download size={18} />
                  <span>Export Cipher Log</span>
                </button>
              </div>
            </header>

            <div className="bg-white rounded-[3rem] shadow-sm border border-stone-100 overflow-hidden">
              <div className="overflow-x-auto no-scrollbar">
                <table className="w-full text-left">
                   <thead className="bg-stone-50/50 text-stone-400 text-[10px] uppercase font-black tracking-[0.25em]">
                    <tr>
                      <th className="px-10 py-8">Admin Agent</th>
                      <th className="px-6 py-8">Action Logic</th>
                      <th className="px-6 py-8">Resource Target</th>
                      <th className="px-6 py-8">Activity Details</th>
                      <th className="px-6 py-8">Endpoint IP</th>
                      <th className="px-6 py-8">Operational Clearing</th>
                      <th className="px-10 py-8 text-right">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-50">
                    {auditLogs.map((log, idx) => {
                      const details = (() => {
                        try { return JSON.parse(log.details); } catch(e) { return { message: log.details }; }
                      })();
                      const isReversible = !!details.oldState;
                      const isReversion = log.action === 'ACTION_REVERTED';

                      return (
                        <motion.tr 
                          key={log.id} 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.02 }}
                          className="hover:bg-stone-50/50 transition-colors group"
                        >
                          <td className="px-10 py-6">
                            <div className="flex items-center space-x-4">
                              <div className="w-10 h-10 bg-stone-900 text-white rounded-xl flex items-center justify-center text-[10px] font-black uppercase shadow-sm rotate-3 group-hover:rotate-0 transition-transform">
                                {log.admin_name?.[0] || 'A'}
                              </div>
                              <span className="text-sm font-black text-stone-900">{log.admin_name || 'System Auto'}</span>
                            </div>
                          </td>
                          <td className="px-6 py-6">
                            <span className={cn(
                              "text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-lg border",
                              log.action === 'DELETE' ? 'bg-red-50 text-red-600 border-red-100' :
                              log.action === 'ACTION_REVERTED' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                              log.action === 'PUT' || log.action?.includes('UPDATE') ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                            )}>
                              {log.action}
                            </span>
                          </td>
                          <td className="px-6 py-6">
                             <span className="text-[10px] font-mono font-black text-stone-400 bg-stone-100 px-3 py-1 rounded-lg uppercase border border-stone-200/50">
                               {log.resource || log.target_type}
                             </span>
                          </td>
                          <td className="px-6 py-6 max-w-[300px]">
                             <div className="space-y-1">
                               <p className="text-[10px] text-stone-600 font-bold leading-relaxed">{details.message || log.details}</p>
                               {isReversion && (
                                 <div className="flex items-center space-x-1 text-[9px] text-amber-600 font-black uppercase tracking-widest mt-2">
                                    <ShieldCheck size={10} />
                                    <span>Protocol Reverted</span>
                                 </div>
                               )}
                             </div>
                          </td>
                          <td className="px-6 py-6 font-mono text-[10px] text-stone-400 font-black">
                            {log.ip_address || '127.0.0.1'}
                          </td>
                          <td className="px-6 py-6">
                             {isReversible ? (
                               <button 
                                 onClick={() => handleRevertAction(log.id)}
                                 className="flex items-center space-x-2 text-[9px] font-black uppercase tracking-widest text-primary hover:text-white bg-primary/5 hover:bg-primary px-4 py-2 rounded-2xl border border-primary/10 transition-all shadow-sm active:scale-95"
                               >
                                 <RefreshCw size={12} />
                                 <span>Rollback</span>
                               </button>
                             ) : isReversion ? (
                               <button 
                                 onClick={() => handleRevertAction(log.id)}
                                 className="flex items-center space-x-2 text-[9px] font-black uppercase tracking-widest text-amber-600 hover:text-white bg-amber-50 hover:bg-amber-600 px-4 py-2 rounded-2xl border border-amber-200 transition-all shadow-sm active:scale-95"
                               >
                                 <RefreshCw size={12} />
                                 <span>Relay Original</span>
                               </button>
                             ) : (
                               <div className="flex items-center space-x-2 text-[10px] text-stone-300 font-black uppercase tracking-widest italic opacity-50">
                                  <Lock size={12} />
                                  <span>Immutable</span>
                               </div>
                             )}
                          </td>
                          <td className="px-10 py-6 text-right">
                             <p className="text-[10px] font-black text-stone-900 tracking-tighter">
                               {new Date(log.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                             </p>
                             <p className="text-[9px] font-bold text-stone-400 uppercase tracking-widest mt-1">
                               {new Date(log.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                             </p>
                          </td>
                        </motion.tr>
                      );
                    })}
                    {auditLogs.length === 0 && (
                      <tr>
                        <td colSpan={7} className="px-10 py-32 text-center">
                          <div className="flex flex-col items-center space-y-4">
                            <div className="p-8 bg-stone-50 rounded-full text-stone-200 animate-pulse">
                              <Database size={48} />
                            </div>
                            <p className="text-stone-400 font-bold italic">Forensic archives are empty. Stable state confirmed.</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'Orders' && (
          <div className="space-y-10">
            {/* Orders Header */}
            <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <div className="p-2 bg-stone-900 text-white rounded-xl">
                    <ShoppingBag size={20} />
                  </div>
                  <span className="text-[10px] font-black uppercase text-stone-400 tracking-[0.2em]">Fulfillment Protocol</span>
                </div>
                <h2 className="text-4xl font-black text-stone-900 tracking-tight">Order Logistics Command</h2>
                <p className="text-stone-500 mt-1 text-lg font-medium">Monitoring and fulfilling Hind General Store transactions.</p>
              </div>
              <div className="bg-stone-100 p-1.5 rounded-[1.5rem] border border-stone-200 flex space-x-1 shadow-inner">
                <button 
                  onClick={() => setOrdersViewMode('table')}
                  className={cn(
                    "flex items-center space-x-2 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all",
                    ordersViewMode === 'table' ? "bg-white text-stone-900 shadow-xl shadow-stone-200/50" : "text-stone-400 hover:text-stone-700"
                  )}
                >
                  <List size={16} />
                  <span>Command Ledger</span>
                </button>
                <button 
                  onClick={() => setOrdersViewMode('kanban')}
                  className={cn(
                    "flex items-center space-x-2 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all",
                    ordersViewMode === 'kanban' ? "bg-white text-stone-900 shadow-xl shadow-stone-200/50" : "text-stone-400 hover:text-stone-700"
                  )}
                >
                  <LayoutDashboard size={16} />
                  <span>Logistics Pipeline</span>
                </button>
              </div>
            </header>

            {/* Logistics Hub Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { label: 'Pending Review', val: orders.filter(o => o.status === 'pending').length, icon: Clock, color: 'amber', trend: 'Response Required' },
                { label: 'Active Fulfillment', val: orders.filter(o => o.status === 'processing').length, icon: Settings, color: 'blue', trend: 'In Preparations' },
                { label: 'In Transit', val: orders.filter(o => o.status === 'shipped').length, icon: Truck, color: 'purple', trend: 'Logistics Network' },
                { label: 'Success Velocity', val: orders.filter(o => o.status === 'delivered').length, icon: CheckCircle2, color: 'emerald', trend: 'Closed Transactions' }
              ].map((stat, i) => (
                <motion.div 
                  key={stat.label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-white p-6 rounded-[2rem] shadow-sm border border-stone-100 flex items-center space-x-5"
                >
                  <div className={cn(
                    "w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg transform -rotate-3 transition-transform hover:rotate-0",
                    stat.color === 'amber' ? "bg-amber-100 text-amber-600 shadow-amber-100/50" :
                    stat.color === 'blue' ? "bg-blue-100 text-blue-600 shadow-blue-100/50" :
                    stat.color === 'purple' ? "bg-purple-100 text-purple-600 shadow-purple-100/50" :
                    "bg-emerald-100 text-emerald-600 shadow-emerald-100/50"
                  )}>
                    <stat.icon size={24} strokeWidth={2.5} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest leading-none mb-1">{stat.label}</p>
                    <div className="flex items-baseline space-x-2">
                      <span className="text-2xl font-black text-stone-900 tracking-tighter">{stat.val}</span>
                      <span className={cn("text-[9px] font-black px-1.5 py-0.5 rounded-full",
                        stat.color === 'amber' ? "bg-amber-50 text-amber-700" :
                        stat.color === 'blue' ? "bg-blue-50 text-blue-700" :
                        stat.color === 'purple' ? "bg-purple-50 text-purple-700" :
                        "bg-emerald-50 text-emerald-700"
                      )}>{stat.trend}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Advanced Logistics Filters */}
            <section className="bg-white p-10 rounded-[3rem] shadow-sm border border-stone-100 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 relative overflow-hidden">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-stone-400 uppercase tracking-[0.2em] px-1">Customer / Order ID</label>
                <div className="relative group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-300 group-focus-within:text-primary transition-colors" size={18} />
                  <input 
                    type="text" 
                    placeholder="Search orders..."
                    className="w-full bg-stone-50 border-stone-200 border rounded-2xl pl-12 pr-4 py-3 text-sm focus:ring-4 focus:ring-primary/10 outline-none transition-all placeholder:text-stone-300 font-medium"
                    value={orderSearchTerm}
                    onChange={(e) => setOrderSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-stone-400 uppercase tracking-[0.2em] px-1">Fulfillment Status</label>
                <select 
                  className="w-full bg-stone-50 border-stone-200 border rounded-2xl px-4 py-3 text-sm focus:ring-4 focus:ring-primary/10 outline-none transition-all appearance-none cursor-pointer font-bold text-stone-700"
                  value={orderStatusFilter}
                  onChange={(e) => setOrderStatusFilter(e.target.value)}
                >
                  <option value="All">All Transactions</option>
                  <option value="pending">Pending Review</option>
                  <option value="processing">Processing</option>
                  <option value="shipped">On Route</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="failed">Failed</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-stone-400 uppercase tracking-[0.2em] px-1">Timeline Range</label>
                <div className="flex items-center space-x-2">
                  <input 
                    type="date" 
                    className="w-full bg-stone-50 border-stone-200 border rounded-2xl px-4 py-3 text-sm focus:ring-4 focus:ring-primary/10 outline-none transition-all font-bold text-stone-700"
                    value={orderDateStart}
                    onChange={(e) => setOrderDateStart(e.target.value)}
                  />
                  <span className="text-stone-300">→</span>
                  <input 
                    type="date" 
                    className="w-full bg-stone-50 border-stone-200 border rounded-2xl px-4 py-3 text-sm focus:ring-4 focus:ring-primary/10 outline-none transition-all font-bold text-stone-700"
                    value={orderDateEnd}
                    onChange={(e) => setOrderDateEnd(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex items-end space-x-3">
                <div className="flex-1 space-y-2">
                  <label className="text-[10px] font-black text-stone-400 uppercase tracking-[0.2em] px-1">Sort Preference</label>
                  <select 
                    className="w-full bg-stone-50 border-stone-200 border rounded-2xl px-4 py-3 text-sm focus:ring-4 focus:ring-primary/10 outline-none transition-all appearance-none cursor-pointer font-bold text-stone-700"
                    value={orderSortBy}
                    onChange={(e) => setOrderSortBy(e.target.value)}
                  >
                    <option value="date">Order Date</option>
                    <option value="id">Reference ID</option>
                    <option value="customer">Client Name</option>
                    <option value="total">Total Value</option>
                  </select>
                </div>
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setOrderSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                  className="p-3.5 bg-stone-50 border border-stone-200 rounded-2xl text-stone-400 hover:text-primary transition-all shadow-sm"
                >
                  <TrendingUp size={18} className={cn(orderSortOrder === 'desc' && "rotate-180")} />
                </motion.button>
                <motion.button 
                  whileHover={{ rotate: 180 }}
                  onClick={() => {
                    setOrderStatusFilter('All');
                    setOrderDateStart('');
                    setOrderDateEnd('');
                    setOrderSearchTerm('');
                    setOrderSortBy('date');
                    setOrderSortOrder('desc');
                  }}
                  className="p-3.5 bg-stone-50 border border-stone-200 rounded-2xl text-stone-400 hover:text-red-500 transition-all shadow-sm"
                >
                  <RefreshCw size={18} />
                </motion.button>
              </div>
            </section>

            {ordersViewMode === 'table' ? (
              <div className="bg-white rounded-[2.5rem] shadow-sm border border-stone-100 overflow-hidden">
                <div className="overflow-x-auto no-scrollbar">
                  <table className="w-full text-left">
                    <thead className="bg-stone-50/50 text-stone-400 text-[10px] uppercase font-black tracking-[0.2em]">
                      <tr>
                        <th className="px-10 py-7 w-10">
                          <input 
                            type="checkbox" 
                            className="w-5 h-5 rounded-lg border-stone-300 text-stone-900 focus:ring-stone-900 transition-all cursor-pointer"
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedOrders(orders.map(o => o.id));
                              } else {
                                setSelectedOrders([]);
                              }
                            }}
                          />
                        </th>
                        <th className="px-6 py-7">Directive ID</th>
                        <th className="px-6 py-7">Client Intel</th>
                        <th className="px-6 py-7 text-right">Settlement</th>
                        <th className="px-6 py-7">Operational State</th>
                        <th className="px-6 py-7">Timestamp</th>
                        <th className="px-10 py-7 text-right">Goverance</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-50">
                      {orders
                        .filter(order => {
                          const matchesStatus = orderStatusFilter === 'All' || order.status === orderStatusFilter;
                          const orderDate = new Date(order.created_at).toISOString().split('T')[0];
                          const matchesStart = !orderDateStart || orderDate >= orderDateStart;
                          const matchesEnd = !orderDateEnd || orderDate <= orderDateEnd;
                          const matchesSearch = !orderSearchTerm || 
                            order.id.toString().includes(orderSearchTerm.replace('#ORD-', '')) ||
                            order.user_name?.toLowerCase().includes(orderSearchTerm.toLowerCase());
                          return matchesStatus && matchesStart && matchesEnd && matchesSearch;
                        })
                        .map((order, idx) => (
                        <motion.tr 
                          key={order.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.02 }}
                          className={cn(
                            "hover:bg-primary/[0.02] transition-all duration-300 group cursor-default",
                            selectedOrders.includes(order.id) ? "bg-primary/[0.04]" : "bg-white"
                          )}
                        >
                          <td className="px-10 py-7">
                            <input 
                              type="checkbox" 
                              className="w-5 h-5 rounded-lg border-stone-200 text-stone-900 focus:ring-stone-900 transition-all cursor-pointer"
                              checked={selectedOrders.includes(order.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedOrders([...selectedOrders, order.id]);
                                } else {
                                  setSelectedOrders(selectedOrders.filter(id => id !== order.id));
                                }
                              }}
                            />
                          </td>
                          <td className="px-6 py-7">
                            <div className="flex items-center space-x-3">
                              <div className="flex flex-col">
                                <span className="font-mono text-sm font-black text-stone-900 tracking-tighter">#ORD-{order.id}</span>
                                <div className="flex items-center space-x-2 mt-1.5">
                                  <span className="text-[10px] font-black text-stone-300 uppercase tracking-widest">{order.payment_method || 'Online'}</span>
                                  {order.admin_notes && <div className="w-1.5 h-1.5 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.5)]" title="Internal Persistence" />}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-7">
                            <div className="flex items-center space-x-4">
                              <div className="w-10 h-10 rounded-2xl bg-stone-100 flex items-center justify-center text-[10px] font-black text-stone-400 uppercase border-2 border-white shadow-sm overflow-hidden group-hover:border-primary/20 transition-colors">
                                {order.user_name ? (
                                  <span className="text-stone-900">{order.user_name[0]}</span>
                                ) : (
                                  <Users size={16} />
                                )}
                              </div>
                              <div className="max-w-[200px]">
                                <p className="text-sm font-black text-stone-900 group-hover:text-primary transition-colors truncate tracking-tight">{order.user_name || 'Protocol Client'}</p>
                                <p className="text-[10px] text-stone-400 font-bold tracking-wide mt-0.5">{order.items?.length || 0} unique SKUs in transit</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-7 text-right">
                            <div className="flex flex-col items-end">
                              <span className="text-base font-black text-stone-900 tracking-tighter">₹{order.total}</span>
                              <div className="flex items-center space-x-1 mt-1">
                                <div className="w-1 h-1 rounded-full bg-emerald-500" />
                                <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">Settled</span>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-7">
                            <span className={cn(
                              "inline-flex items-center space-x-2 px-4 py-2 rounded-[1.2rem] text-[10px] font-black uppercase tracking-widest border transition-all duration-500",
                              order.status === 'delivered' ? 'bg-emerald-50 text-emerald-600 border-emerald-200 shadow-sm shadow-emerald-100' : 
                              order.status === 'cancelled' ? 'bg-red-50 text-red-600 border-red-200 shadow-sm shadow-red-100' : 
                              order.status === 'shipped' ? 'bg-purple-50 text-purple-600 border-purple-200 shadow-sm shadow-purple-100' :
                              'bg-amber-50 text-amber-600 border-amber-200 shadow-sm shadow-amber-100'
                            )}>
                              <div className={cn(
                                "w-2 h-2 rounded-full",
                                order.status === 'delivered' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 
                                order.status === 'cancelled' ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]' : 
                                order.status === 'shipped' ? 'bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.5)] animate-pulse' :
                                'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)] animate-pulse'
                              )} />
                              <span>{order.status === 'shipped' ? 'On Route' : order.status}</span>
                            </span>
                          </td>
                          <td className="px-6 py-7">
                            <div className="flex flex-col">
                              <span className="text-xs font-black text-stone-800 tracking-tight">{new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                              <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest mt-0.5">{new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                          </td>
                          <td className="px-10 py-7 text-right">
                            <div className="flex items-center justify-end space-x-3">
                              <motion.button 
                                whileHover={{ scale: 1.1, backgroundColor: '#f5f5f4' }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => fetchOrderDetailsModal(order)}
                                className="p-3 bg-stone-50 text-stone-500 hover:text-stone-900 border border-transparent hover:border-stone-200 rounded-2xl transition-all shadow-sm"
                                title="Inspect Protocol"
                              >
                                <Eye size={18} strokeWidth={2.5} />
                              </motion.button>
                              <div className="relative">
                                <motion.button 
                                  whileHover={{ scale: 1.1, backgroundColor: '#f5f5f4' }}
                                  whileTap={{ scale: 0.95 }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveActionMenuId(activeActionMenuId === `order_${order.id}` ? null : `order_${order.id}`);
                                  }}
                                  className={cn(
                                    "p-3 bg-stone-50 text-stone-500 rounded-2xl transition-all border border-transparent hover:border-stone-200 hover:text-primary shadow-sm",
                                    activeActionMenuId === `order_${order.id}` && "bg-white text-primary shadow-xl border-stone-200"
                                  )}
                                >
                                  <MoreVertical size={18} strokeWidth={2.5} />
                                </motion.button>
                                
                                <AnimatePresence>
                                  {activeActionMenuId === `order_${order.id}` && (
                                    <motion.div 
                                      initial={{ opacity: 0, scale: 0.9, y: 10, x: 10 }}
                                      animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
                                      exit={{ opacity: 0, scale: 0.9, y: 10, x: 10 }}
                                      className="absolute right-0 top-full mt-4 w-72 bg-white rounded-[2rem] shadow-2xl shadow-stone-300 border border-stone-100 z-[100] overflow-hidden flex flex-col py-4"
                                      onMouseLeave={() => setActiveActionMenuId(null)}
                                    >
                                      <div className="px-8 py-3 text-[10px] font-black uppercase text-stone-400 tracking-[0.25em] mb-2">Transition Directive</div>
                                      {[ 
                                        {val: 'pending', label: 'Hold for Review', color: 'bg-amber-400'}, 
                                        {val: 'processing', label: 'Initiate Processing', color: 'bg-blue-400'}, 
                                        {val: 'shipped', label: 'Authorize Dispatch', color: 'bg-purple-400'}, 
                                        {val: 'delivered', label: 'Confirm Closure', color: 'bg-emerald-400'}, 
                                        {val: 'cancelled', label: 'Void Protocol', color: 'bg-red-400'} 
                                      ].map(s => (
                                        <button 
                                          key={s.val}
                                          onClick={() => {
                                            updateOrderStatus(order.id, s.val);
                                            setActiveActionMenuId(null);
                                          }}
                                          className={cn(
                                            "flex items-center justify-between px-8 py-3 hover:bg-stone-50 text-left text-[11px] font-black uppercase tracking-wider transition-all",
                                            order.status === s.val ? "text-primary bg-primary/[0.04]" : "text-stone-500"
                                          )}
                                        >
                                          <div className="flex items-center space-x-3">
                                            <div className={cn("w-1.5 h-1.5 rounded-full", order.status === s.val ? s.color : "bg-stone-200")} />
                                            <span>{s.label}</span>
                                          </div>
                                          {order.status === s.val && <Check size={14} className="text-primary" />}
                                        </button>
                                      ))}
                                      <div className="h-px bg-stone-100 my-4 mx-6" />
                                      <button className="flex items-center space-x-4 px-8 py-4 hover:bg-stone-50 group transition-all">
                                        <div className="p-2.5 bg-stone-100 rounded-2xl group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                                          <Receipt size={16} />
                                        </div>
                                        <span className="text-xs font-black text-stone-900 group-hover:text-primary uppercase tracking-widest">Generate Ledger</span>
                                      </button>
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>
                            </div>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="p-8 bg-stone-50/50 flex gap-8 overflow-x-auto no-scrollbar min-h-[700px]">
                  {['pending', 'processing', 'shipped', 'delivered', 'cancelled'].map((statusColumn) => (
                    <div key={statusColumn} className="w-[340px] shrink-0 flex flex-col">
                      <div className="flex items-center justify-between mb-6 px-2">
                        <div className="flex items-center space-x-3">
                          <h4 className="font-black text-stone-900 uppercase tracking-widest text-xs">{statusColumn}</h4>
                          <span className="bg-white border border-stone-200 text-stone-500 text-[10px] font-bold px-2 py-0.5 rounded-lg shadow-sm">
                            {orders.filter(o => o.status === statusColumn).length}
                          </span>
                        </div>
                      </div>
                      <div className="space-y-4 flex-1 overflow-y-auto no-scrollbar pb-10">
                        {orders.filter(order => {
                            const matchesStatus = order.status === statusColumn && (orderStatusFilter === 'All' || order.status === orderStatusFilter);
                            const orderDate = new Date(order.created_at).toISOString().split('T')[0];
                            const matchesStart = !orderDateStart || orderDate >= orderDateStart;
                            const matchesEnd = !orderDateEnd || orderDate <= orderDateEnd;
                            const matchesSearch = !orderSearchTerm || 
                              order.id.toString().includes(orderSearchTerm.replace('#ORD-', '')) ||
                              order.user_name?.toLowerCase().includes(orderSearchTerm.toLowerCase());
                            return matchesStatus && matchesStart && matchesEnd && matchesSearch;
                          }).map((order) => (
                          <motion.div
                            layout
                            key={order.id}
                            whileHover={{ y: -4 }}
                            className="bg-white p-6 rounded-3xl shadow-sm border border-stone-100 hover:shadow-xl hover:shadow-stone-200/50 transition-all cursor-pointer group relative"
                            onClick={() => fetchOrderDetailsModal(order)}
                          >
                            <div className="flex justify-between items-start mb-4">
                              <span className="font-mono text-xs font-black text-primary tracking-tighter">#ORD-{order.id}</span>
                              <span className="text-xs font-black text-stone-900 tracking-tight">₹{order.total}</span>
                            </div>
                            <h5 className="text-sm font-black text-stone-900 mb-1 truncate">{order.user_name || 'Anonymous Customer'}</h5>
                            <p className="text-[10px] text-stone-400 font-medium mb-4 line-clamp-1">{order.items?.length || 0} unique SKU items</p>
                            
                            <div className="flex items-center justify-between pt-4 border-t border-stone-50">
                              <div className="flex items-center space-x-2 text-stone-400 font-bold uppercase tracking-widest text-[9px]">
                                <Clock size={12} />
                                <span>{new Date(order.created_at).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}</span>
                              </div>
                              <span className={cn(
                                "text-[8px] font-black px-2 py-1 rounded-lg uppercase tracking-widest",
                                order.payment_method === 'cod' ? "bg-amber-50 text-amber-600" : "bg-emerald-50 text-emerald-600"
                              )}>
                                {order.payment_method || 'Online'}
                              </span>
                            </div>

                            {/* Dropdown for quick status move */}
                            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                              <select 
                                className="text-[9px] font-black uppercase tracking-widest bg-stone-900 text-white border-0 rounded-lg px-2 py-1 outline-none cursor-pointer"
                                onClick={(e) => e.stopPropagation()}
                                onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                                value=""
                              >
                                <option value="" disabled>Move</option>
                                {statusColumn === 'pending' && <option value="processing">Process</option>}
                                {statusColumn === 'processing' && <option value="shipped">Ship</option>}
                                {statusColumn === 'shipped' && <option value="delivered">Deliver</option>}
                                <option value="cancelled">Void</option>
                              </select>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Bottom Contextual Action Bar for Bulk Management (Orders) */}
              <AnimatePresence>
                {selectedOrders.length > 0 && (
                  <motion.div 
                    initial={{ y: 150, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 150, opacity: 0 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[80] bg-stone-900 text-white px-8 py-5 rounded-[2.5rem] shadow-2xl flex items-center space-x-8 w-fit max-w-4xl border border-stone-800"
                  >
                    <div className="flex flex-col border-r border-stone-700 pr-8">
                      <span className="text-3xl font-black text-white leading-none">{selectedOrders.length}</span>
                      <span className="text-[10px] uppercase font-black tracking-[0.2em] text-stone-500 mt-1">Directives</span>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button 
                        onClick={() => handleBulkOrderAction('status', 'processing')}
                        className="px-6 py-3 hover:bg-stone-800 rounded-2xl transition-all text-xs font-black uppercase tracking-widest flex items-center space-x-3 group"
                      >
                        <div className="p-2 bg-stone-800 rounded-xl group-hover:bg-blue-500/20 group-hover:text-blue-400 transition-colors"><Settings size={16} /></div>
                        <span>Process</span>
                      </button>
                      <button 
                        onClick={() => handleBulkOrderAction('status', 'shipped')}
                        className="px-6 py-3 hover:bg-stone-800 rounded-2xl transition-all text-xs font-black uppercase tracking-widest flex items-center space-x-3 group"
                      >
                        <div className="p-2 bg-stone-800 rounded-xl group-hover:bg-purple-500/20 group-hover:text-purple-400 transition-colors"><Truck size={16} /></div>
                        <span>Dispatch</span>
                      </button>
                      <button 
                        onClick={() => handleBulkOrderAction('status', 'delivered')}
                        className="px-6 py-3 hover:bg-stone-800 rounded-2xl transition-all text-xs font-black uppercase tracking-widest flex items-center space-x-3 group"
                      >
                        <div className="p-2 bg-stone-800 rounded-xl group-hover:bg-emerald-500/20 group-hover:text-emerald-400 transition-colors"><CheckCircle2 size={16} /></div>
                        <span>Close</span>
                      </button>
                    </div>
                    
                    <div className="w-px h-8 bg-stone-800 mx-2" />
                    
                    <button 
                      onClick={() => setSelectedOrders([])}
                      className="p-3 bg-stone-800 hover:bg-stone-700 rounded-full transition-all text-stone-400 hover:text-white"
                    >
                      <X size={20} />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
        )}
        {activeTab === 'Product Catalog' && (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-8"
      >
        {/* Inventory Control Center Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary rotate-3">
                <Package size={24} />
              </div>
              <h2 className="text-4xl font-black text-stone-900 tracking-tight">Inventory Status</h2>
            </div>
            <p className="text-stone-500 font-medium text-lg ml-1">Real-time stock control & catalog management.</p>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="hidden lg:flex items-center space-x-2 bg-emerald-50 text-emerald-600 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border border-emerald-100">
              <Activity size={14} className="animate-pulse" />
              <span>Live Sync Active</span>
            </div>
            <button 
              onClick={() => {
                setProductModal({ open: true, mode: 'add' });
                setNewProduct({ 
                  name: '', description: '', price: '', stock: '', category: 'Grocery', image: '',
                  retail_price: '', wholesale_price: '', discount: '0', reorder_point: '10', max_qty: '0', is_listed: true,
                  images: []
                } as any);
              }}
              className="bg-primary text-white px-8 py-4 rounded-2xl font-black flex items-center space-x-3 shadow-xl shadow-primary/20 hover:bg-primary/90 transition-all active:scale-95 group"
            >
              <Plus size={20} className="group-hover:rotate-90 transition-transform duration-300" />
              <span>Initialize Product</span>
            </button>
          </div>
        </div>

        {/* Intelligence Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { label: 'Total SKU', val: allProducts.length, icon: Package, color: 'stone', trend: 'Catalog Depth' },
            { label: 'Out of Stock', val: allProducts.filter(p => Number(p.stock) <= 0).length, icon: AlertTriangle, color: 'red', trend: 'Immediate Action' },
            { label: 'Low Stock Alert', val: allProducts.filter(p => Number(p.stock) > 0 && Number(p.stock) <= Number(p.reorder_point || 5)).length, icon: ShieldAlert, color: 'amber', trend: 'Replenishment Needed' },
            { label: 'Expiring Soon', val: allProducts.filter(p => p.expiry_date && new Date(p.expiry_date) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)).length, icon: Clock, color: 'emerald', trend: 'Waste Mitigation' }
          ].map((stat, i) => (
            <motion.div 
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-white p-6 rounded-[2rem] border border-stone-100 shadow-sm hover:shadow-xl hover:shadow-stone-200/40 transition-all group overflow-hidden relative"
            >
              <div className={cn(
                "absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 rounded-full opacity-[0.03] transition-transform duration-500 group-hover:scale-150",
                stat.color === 'red' ? 'bg-red-500' : stat.color === 'amber' ? 'bg-amber-500' : stat.color === 'emerald' ? 'bg-emerald-500' : 'bg-primary'
              )} />
              <div className="flex items-center justify-between mb-4">
                <div className={cn(
                  "p-3 rounded-2xl",
                  stat.color === 'red' ? 'bg-red-50 text-red-500' : stat.color === 'amber' ? 'bg-amber-50 text-amber-500' : stat.color === 'emerald' ? 'bg-emerald-50 text-emerald-500' : 'bg-stone-50 text-stone-500'
                )}>
                  <stat.icon size={20} />
                </div>
                <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest">{stat.trend}</span>
              </div>
              <div className="space-y-1">
                <p className="text-3xl font-black text-stone-900 tracking-tighter">{stat.val}</p>
                <p className="text-[11px] font-bold text-stone-500 uppercase tracking-widest">{stat.label}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Global Catalog Utility Bar */}
        <div className="flex flex-col lg:flex-row gap-6 items-center">
          <div className="w-full lg:flex-1 relative group">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-stone-300 group-focus-within:text-primary transition-colors" size={20} />
            <input 
              type="text" 
              placeholder="Search by SKU, Name, Category or Batch Number..."
              className="w-full bg-white border-stone-200 border rounded-[2rem] pl-16 pr-6 py-4 text-sm focus:ring-8 focus:ring-primary/5 outline-none transition-all placeholder:text-stone-300 font-medium shadow-sm hover:border-stone-300 focus:border-primary"
              value={productSearchTerm}
              onChange={(e) => {
                setProductSearchTerm(e.target.value);
                fetchSearchSuggestions(e.target.value);
              }}
            />
            {searchSuggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-3 bg-white rounded-3xl shadow-2xl shadow-stone-200/50 border border-stone-100 z-50 overflow-hidden py-2 backdrop-blur-xl bg-white/90">
                {searchSuggestions.map((s, i) => (
                  <button 
                    key={i}
                    onClick={() => {
                      setProductSearchTerm(s);
                      setSearchSuggestions([]);
                    }}
                    className="w-full text-left px-8 py-3.5 hover:bg-stone-50 text-sm font-bold text-stone-600 transition-colors flex items-center space-x-3"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-stone-300" />
                    <span>{s}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center space-x-3 w-full lg:w-auto">
            <div className="flex items-center p-1 bg-white border border-stone-100 rounded-2xl shadow-sm">
              <button 
                onClick={downloadTemplate}
                className="p-3 text-stone-400 hover:text-primary transition-all rounded-xl hover:bg-stone-50"
                title="Export CSV Template"
              >
                <Download size={20} />
              </button>
              <label className="p-3 text-stone-400 hover:text-emerald-500 transition-all rounded-xl cursor-pointer hover:bg-stone-50">
                <Upload size={20} />
                <input type="file" accept=".csv" className="hidden" onChange={handleBulkUpload} />
              </label>
              {(productStockFilter === 'low' || productStockFilter === 'out') && (
                <button 
                  onClick={generatePurchaseOrder}
                  className="p-3 text-stone-400 hover:text-amber-500 transition-all rounded-xl hover:bg-stone-50"
                  title="Generate PO for Low Stock"
                >
                  <Receipt size={20} />
                </button>
              )}
            </div>
            
            <div className="h-10 w-px bg-stone-200 mx-2" />
            
            <button 
              onClick={() => {/* refresh logic */}}
              className="p-4 bg-white border border-stone-100 rounded-2xl text-stone-400 hover:text-primary hover:shadow-md transition-all active:scale-95"
            >
              <RefreshCw size={20} />
            </button>
          </div>
        </div>


            {/* Enhanced Filters */}
            <section className="bg-white p-6 rounded-[2rem] shadow-sm border border-stone-100 flex flex-wrap items-center gap-8">
              <div className="flex items-center space-x-3 pr-6 border-r border-stone-100">
                <div className="p-3 bg-primary/10 rounded-2xl text-primary">
                  <Filter size={20} />
                </div>
                <span className="text-xs font-black text-stone-900 uppercase tracking-widest leading-none">Catalog<br/><span className="text-stone-400 font-bold">Filters</span></span>
              </div>
              
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest px-1">Stock</label>
                <select 
                  className="bg-stone-50 border-stone-200 border rounded-xl text-xs font-bold py-2.5 px-4 focus:ring-4 focus:ring-primary/10 outline-none transition-all appearance-none cursor-pointer"
                  value={productStockFilter}
                  onChange={(e) => setProductStockFilter(e.target.value as any)}
                >
                  <option value="all">All Inventory</option>
                  <option value="low">Low Stock Only</option>
                  <option value="out">Out of Stock</option>
                  <option value="expiring">Near Expiry</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest px-1">Category</label>
                <select 
                  className="bg-stone-50 border-stone-200 border rounded-xl text-xs font-bold py-2.5 px-4 focus:ring-4 focus:ring-primary/10 outline-none transition-all appearance-none cursor-pointer min-w-[140px]"
                  value={productCategoryFilter}
                  onChange={(e) => setProductCategoryFilter(e.target.value)}
                >
                  <option value="all">All Categories</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.name}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest px-1">Status</label>
                <select 
                  className="bg-stone-50 border-stone-200 border rounded-xl text-xs font-bold py-2.5 px-4 focus:ring-4 focus:ring-primary/10 outline-none transition-all appearance-none cursor-pointer"
                  value={productListedFilter}
                  onChange={(e) => setProductListedFilter(e.target.value as any)}
                >
                  <option value="all">All Status</option>
                  <option value="listed">Currently Listed</option>
                  <option value="unlisted">Unlisted Items</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest px-1">Sort By</label>
                <select 
                  className="bg-stone-50 border-stone-200 border rounded-xl text-xs font-bold py-2.5 px-4 focus:ring-4 focus:ring-primary/10 outline-none transition-all appearance-none cursor-pointer"
                  value={productSortBy}
                  onChange={(e) => setProductSortBy(e.target.value as any)}
                >
                  <option value="name">Name (A-Z)</option>
                  <option value="price">Price (Value)</option>
                  <option value="stock">Stock (Count)</option>
                  <option value="created_at">Submission Date</option>
                </select>
              </div>

              <motion.button 
                whileHover={{ rotate: -90 }}
                onClick={() => {
                  setProductStockFilter('all');
                  setProductDiscountFilter('all');
                  setProductCategoryFilter('all');
                  setProductListedFilter('all');
                  setProductDateFilter('');
                  setProductSearchTerm('');
                  setProductSortBy('name');
                }}
                className="ml-auto p-3 bg-stone-50 text-stone-400 hover:text-primary hover:bg-white border border-stone-100 rounded-2xl transition-all shadow-sm group"
                title="Reset Filters"
              >
                <RefreshCw size={20} className="group-active:scale-90" />
              </motion.button>
            </section>

            <div className="bg-white rounded-[2.5rem] shadow-sm border border-stone-100 overflow-hidden">
              <div className="overflow-x-auto no-scrollbar">
                <table className="w-full text-left">
                  <thead className="bg-stone-50/50 text-stone-400 text-[10px] uppercase font-black tracking-[0.15em]">
                    <tr>
                      <th className="px-8 py-6 w-10">
                        <input 
                          type="checkbox" 
                          className="w-5 h-5 rounded-lg border-stone-300 text-primary focus:ring-primary transition-all cursor-pointer"
                          checked={selectedProducts.length === filteredProducts.length && filteredProducts.length > 0}
                          onChange={toggleAllProducts}
                        />
                      </th>
                      <th className="px-6 py-6">Product Information</th>
                      <th className="px-6 py-6">Category</th>
                      <th className="px-6 py-6">Price Points</th>
                      <th className="px-6 py-6">Stock Status</th>
                      <th className="px-6 py-6">Visibility</th>
                      <th className="px-8 py-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-50">
                    {filteredProducts.map((product, idx) => (
                      <motion.tr 
                        key={product.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.03 }}
                        className={cn(
                        "hover:bg-stone-50/80 transition-all duration-300 group",
                        selectedProducts.includes(product.id) && "bg-primary/[0.03]"
                      )}>
                        <td className="px-8 py-6">
                          <input 
                            type="checkbox" 
                            className="w-5 h-5 rounded-lg border-stone-300 text-primary focus:ring-primary transition-all cursor-pointer"
                            checked={selectedProducts.includes(product.id)}
                            onChange={() => toggleProductSelection(product.id)}
                          />
                        </td>
                        <td className="px-6 py-6">
                          <div className="flex items-center space-x-4">
                            <div className="relative">
                              <img 
                                src={product.image_url || product.image} 
                                alt="" 
                                loading="lazy"
                                referrerPolicy="no-referrer"
                                className="w-14 h-14 rounded-2xl object-cover shadow-sm border border-stone-100 group-hover:scale-110 transition-transform duration-500" 
                              />
                              {product.discount > 0 && (
                                <span className="absolute -top-2 -right-2 bg-accent text-white text-[8px] font-black px-1.5 py-0.5 rounded-full shadow-lg">-{product.discount}%</span>
                              )}
                            </div>
                            <div className="max-w-[240px]">
                              <p className="text-sm font-black text-stone-900 group-hover:text-primary transition-colors truncate">{product.name}</p>
                              <p className="text-[10px] text-stone-400 font-medium line-clamp-1 mt-0.5">{product.description}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-6">
                          <span className="text-[10px] font-black uppercase tracking-widest text-stone-500 bg-stone-100 px-3 py-1.5 rounded-xl border border-stone-200/50">{product.category}</span>
                        </td>
                        <td className="px-6 py-6">
                          <div className="space-y-1">
                            <div className="flex items-center space-x-2">
                              <span className="text-xs font-black text-stone-900">₹{product.retail_price || product.price}</span>
                              <span className="text-[9px] font-bold text-stone-400 uppercase tracking-widest">Retail</span>
                            </div>
                            {product.wholesale_price && (
                              <div className="flex items-center space-x-2">
                                <span className="text-[11px] font-bold text-stone-500">₹{product.wholesale_price}</span>
                                <span className="text-[9px] font-bold text-stone-400 uppercase tracking-widest">Wholesale</span>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-6">
                          <div className="flex flex-col">
                            <span className={cn(
                              "text-[10px] font-black uppercase tracking-widest mb-1 shadow-sm px-2 py-0.5 rounded-md w-fit",
                              Number(product.stock) <= 0 ? "bg-red-50 text-red-600" : 
                              Number(product.stock) <= Number(product.reorder_point || 5) ? "bg-amber-50 text-amber-600" : 
                              "bg-emerald-50 text-emerald-600"
                            )}>
                              {Number(product.stock) <= 0 ? 'Depleted' : Number(product.stock) <= Number(product.reorder_point || 5) ? 'Low Stock' : 'Stable'}
                            </span>
                            <div className="flex items-center space-x-2">
                              <div className="h-1.5 w-24 bg-stone-100 rounded-full overflow-hidden flex-shrink-0">
                                <motion.div 
                                  initial={{ width: 0 }}
                                  animate={{ width: `${Math.min(100, (Number(product.stock) / 100) * 100)}%` }}
                                  className={cn(
                                    "h-full transition-all duration-1000",
                                    Number(product.stock) <= Number(product.reorder_point || 5) ? "bg-red-500" : "bg-emerald-500"
                                  )}
                                />
                              </div>
                              <span className="text-xs font-black text-stone-700">{product.stock} <span className="text-[10px] text-stone-400 font-bold uppercase tracking-widest">Units</span></span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-6">
                           <div className="flex flex-col">
                              {product.expiry_date ? (
                                <>
                                  <span className={cn(
                                    "text-[9px] font-black uppercase tracking-widest mb-1",
                                    new Date(product.expiry_date) < new Date(Date.now() + 15 * 24 * 60 * 60 * 1000) ? "text-red-500" : "text-stone-400"
                                  )}>
                                    Expiry Control
                                  </span>
                                  <span className="text-xs font-black text-stone-700">{new Date(product.expiry_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                </>
                              ) : (
                                <span className="text-[10px] text-stone-300 italic font-bold">No Expiry Tracked</span>
                              )}
                           </div>
                        </td>
                        <td className="px-6 py-6">
                          <span className={cn(
                            "inline-flex items-center space-x-2 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all duration-300",
                            product.is_listed 
                              ? "bg-emerald-50 text-emerald-600 border-emerald-100/50" 
                              : "bg-red-50 text-red-600 border-red-100/50"
                          )}>
                            <div className={cn("w-1.5 h-1.5 rounded-full", product.is_listed ? "bg-emerald-500 animate-pulse" : "bg-red-500")} />
                            <span>{product.is_listed ? 'Public' : 'Hidden'}</span>
                          </span>
                        </td>
                        <td className="px-8 py-6 text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <motion.button 
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => { setEditingProduct(product); setProductModal({ open: true, mode: 'edit' }); }}
                              className="p-2.5 bg-stone-50 text-stone-500 hover:text-primary hover:bg-white hover:shadow-md border border-transparent hover:border-stone-100 rounded-xl transition-all"
                              title="Edit Product"
                            >
                              <Settings size={18} />
                            </motion.button>
                            <motion.button 
                              whileHover={{ scale: 1.1, color: '#ef4444' }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => deleteProduct(product.id)}
                              className="p-2.5 bg-stone-50 text-stone-500 hover:bg-white hover:shadow-md border border-transparent hover:border-red-100 rounded-xl transition-all"
                              title="Delete Product"
                            >
                              <Trash2 size={18} />
                            </motion.button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Bottom Contextual Action Bar for Bulk Management */}
            <AnimatePresence>
              {selectedProducts.length > 0 && activeTab === 'Product Catalog' && (
                <motion.div 
                  initial={{ y: 150, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: 150, opacity: 0 }}
                  transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                  className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[80] bg-stone-900 text-white px-6 py-4 rounded-[2rem] shadow-2xl flex items-center space-x-6 w-[90%] max-w-4xl border border-stone-800"
                >
                  <div className="flex flex-col border-r border-stone-700 pr-6 mr-2">
                    <span className="text-2xl font-black text-white">{selectedProducts.length}</span>
                    <span className="text-[10px] uppercase font-bold tracking-widest text-stone-400">Selected</span>
                  </div>
                  
                  <div className="flex flex-1 items-center space-x-2 md:space-x-4 overflow-x-auto no-scrollbar">
                      <button 
                        onClick={() => bulkUnlist(false)}
                        className="flex items-center space-x-2 px-4 py-2 hover:bg-stone-800 rounded-xl transition-colors whitespace-nowrap group"
                      >
                        <div className="p-2 bg-stone-800 group-hover:bg-stone-700 rounded-lg transition-colors"><Check size={16} className="text-emerald-400" /></div>
                        <span className="font-bold text-sm">Make Active</span>
                      </button>
                      <button 
                        onClick={() => bulkUnlist(true)}
                        className="flex items-center space-x-2 px-4 py-2 hover:bg-stone-800 rounded-xl transition-colors whitespace-nowrap group"
                      >
                         <div className="p-2 bg-stone-800 group-hover:bg-stone-700 rounded-lg transition-colors"><X size={16} className="text-amber-400" /></div>
                        <span className="font-bold text-sm">Make Inactive</span>
                      </button>
                      <button 
                        onClick={bulkUpdateStock}
                        className="flex items-center space-x-2 px-4 py-2 hover:bg-stone-800 rounded-xl transition-colors whitespace-nowrap group"
                      >
                         <div className="p-2 bg-stone-800 group-hover:bg-stone-700 rounded-lg transition-colors"><RefreshCw size={16} className="text-blue-400" /></div>
                        <span className="font-bold text-sm">Update Stock</span>
                      </button>
                      <button 
                        onClick={bulkUpdateCategory}
                        className="flex items-center space-x-2 px-4 py-2 hover:bg-stone-800 rounded-xl transition-colors whitespace-nowrap group"
                      >
                         <div className="p-2 bg-stone-800 group-hover:bg-stone-700 rounded-lg transition-colors"><Tag size={16} className="text-purple-400" /></div>
                        <span className="font-bold text-sm">Change Category</span>
                      </button>
                  </div>
                  
                  <button 
                    onClick={bulkDelete}
                    className="p-3 bg-red-500/20 hover:bg-red-500 text-red-500 hover:text-white rounded-xl transition-all"
                    title="Delete Selected"
                  >
                    <Trash2 size={18} />
                  </button>
                  <button 
                    onClick={() => setSelectedProducts([])}
                    className="bg-stone-800 hover:bg-stone-700 p-2 rounded-full transition-all"
                  >
                    <X size={16} />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
        {activeTab === 'Roles' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-stone-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold">Admin Management</h2>
                <p className="text-sm text-stone-500">Grant admin privileges via email</p>
              </div>
              <div className="flex gap-2">
                <input 
                  type="email"
                  placeholder="Enter email..."
                  className="input-field w-64"
                  id="admin-email-input"
                />
                <button 
                  onClick={async () => {
                    const email = (document.getElementById('admin-email-input') as HTMLInputElement).value;
                    if (!email) return;
                    try {
                      const res = await fetch('/api/admin/make-admin', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email })
                      });
                      if (res.ok) {
                        toast.success('Admin role granted');
                        (document.getElementById('admin-email-input') as HTMLInputElement).value = '';
                      } else {
                        const data = await res.json();
                        toast.error(data.message);
                      }
                    } catch (e) {
                      toast.error('Failed to grant admin role');
                    }
                  }}
                  className="btn-primary py-2 px-6 text-sm"
                >
                  Grant Admin
                </button>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">User Roles & Permissions</h2>
              <button 
                onClick={() => {
                  setRoleModal({ open: true, mode: 'add', role: null });
                  setNewRole({ name: '', permissions: [] });
                }}
                className="btn-primary flex items-center space-x-2"
              >
                <Plus size={18} />
                <span>Create New Role</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {roles.map((role) => (
                <div key={role.id} className="bg-white p-6 rounded-3xl shadow-sm border border-stone-100 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-lg font-bold">{role.name}</h3>
                      <div className="flex space-x-2">
                        <button 
                          onClick={() => {
                            setRoleModal({ open: true, mode: 'edit', role });
                            setNewRole({ name: role.name, permissions: JSON.parse(role.permissions || '[]') });
                          }}
                          className="p-2 text-stone-400 hover:text-primary transition-colors"
                        >
                          <Settings size={16} />
                        </button>
                        <button 
                          onClick={async () => {
                            if (!confirm('Delete this role?')) return;
                            await fetch(`/api/admin/roles/${role.id}`, { method: 'DELETE' });
                            toast.success('Role deleted');
                            fetch('/api/admin/roles').then(res => res.json()).then(setRoles);
                          }}
                          className="p-2 text-stone-400 hover:text-red-500 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {JSON.parse(role.permissions || '[]').map((p: string) => (
                        <span key={p} className="text-[10px] font-bold bg-stone-100 text-stone-500 px-2 py-1 rounded-full uppercase">
                          {p}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="mt-6 pt-4 border-t border-stone-50">
                    <p className="text-xs text-stone-400">Created on {new Date(role.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'Categories' && (
          <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-8">
              <div>
                <h2 className="text-4xl font-black text-stone-900 tracking-tight">Product Categories</h2>
                <p className="text-stone-500 mt-2 text-lg font-medium">Manage how your products are grouped and displayed.</p>
              </div>
              <button 
                onClick={() => setCategoryModal({ open: true, mode: 'add' })}
                className="group flex items-center space-x-3 bg-stone-900 text-white px-10 py-5 rounded-[2rem] text-sm font-black uppercase tracking-widest hover:bg-stone-800 transition-all shadow-2xl shadow-stone-900/30 hover:scale-105 active:scale-95"
              >
                <div className="p-1 bg-white/20 rounded-lg group-hover:rotate-90 transition-transform duration-500">
                  <Plus size={20} />
                </div>
                <span>Add Category</span>
              </button>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {categories.map((cat, idx) => {
                const categoryProducts = allProducts.filter(p => p.category_id === (cat as any).id);
                const totalStock = categoryProducts.reduce((sum, p) => sum + (p.stock || 0), 0);
                const outOfStockCount = categoryProducts.filter(p => (p.stock || 0) <= 0).length;

                return (
                  <motion.div 
                    key={cat.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="group bg-white rounded-[2.5rem] shadow-sm border border-stone-100 hover:border-primary/30 transition-all duration-500 relative overflow-hidden"
                  >
                    <div className="p-8">
                      <div className="flex justify-between items-start mb-8">
                        <div className="relative">
                          <div className={cn(
                            "w-16 h-16 rounded-3xl flex items-center justify-center transition-all duration-500 group-hover:scale-110 group-hover:rotate-3 shadow-lg",
                            cat.is_out_of_stock ? "bg-red-50 text-red-500" : "bg-primary/10 text-primary"
                          )}>
                             {cat.icon ? (
                               <i className={cn("text-2xl", cat.icon)} />
                             ) : (
                               <ImageIcon size={32} />
                             )}
                          </div>
                          {outOfStockCount > 0 && (
                            <div className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center border-4 border-white shadow-lg">
                              {outOfStockCount}
                            </div>
                          )}
                        </div>

                        <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => {
                              setEditingCategory(cat);
                              setNewCategory({ name: cat.name, icon: cat.icon });
                              setCategoryModal({ open: true, mode: 'edit' });
                            }}
                            className="p-3 bg-stone-50 hover:bg-primary/10 hover:text-primary rounded-2xl transition-all"
                          >
                            <Settings size={18} />
                          </button>
                          <button className="p-3 bg-stone-50 hover:bg-red-50 hover:text-red-500 rounded-2xl transition-all">
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <h4 className="text-xl font-black text-stone-900 group-hover:text-primary transition-colors tracking-tight">{cat.name}</h4>
                          <span className={cn(
                            "text-[10px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-full border mt-2 inline-block",
                            cat.is_out_of_stock ? "bg-red-50 text-red-600 border-red-100" : "bg-emerald-50 text-emerald-600 border-emerald-100"
                          )}>
                            {cat.is_out_of_stock ? 'CRITICAL: OUT OF STOCK' : 'Operational'}
                          </span>
                        </div>

                        <div className="pt-6 border-t border-stone-50 grid grid-cols-2 gap-4">
                          <div className="space-y-0.5">
                            <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest leading-none">SKU Count</p>
                            <p className="text-xl font-black text-stone-900">{categoryProducts.length}</p>
                          </div>
                          <div className="space-y-0.5">
                            <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest leading-none">Net Inventory</p>
                            <p className="text-xl font-black text-stone-900">{totalStock}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="h-2 w-full bg-stone-50 mt-auto">
                      <div 
                        className={cn("h-full transition-all duration-1000", cat.is_out_of_stock ? "bg-red-500 w-full" : "bg-primary")} 
                        style={{ width: `${Math.min(100, (totalStock / 500) * 100)}%` }}
                      />
                    </div>
                  </motion.div>
                );
              })}
              
              <motion.button
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                onClick={() => setCategoryModal({ open: true, mode: 'add' })}
                className="group border-4 border-dashed border-stone-100 rounded-[2.5rem] p-8 flex flex-col items-center justify-center space-y-6 hover:border-primary/20 hover:bg-primary/5 transition-all duration-500"
              >
                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center text-stone-200 group-hover:text-primary group-hover:scale-110 group-hover:rotate-90 transition-all duration-500 shadow-sm">
                  <Plus size={40} />
                </div>
                <div className="text-center">
                  <p className="text-base font-black text-stone-400 group-hover:text-primary tracking-tight transition-colors">Expand Intelligence</p>
                  <p className="text-[10px] font-bold text-stone-300 uppercase tracking-widest mt-1">Add domain category</p>
                </div>
              </motion.button>
            </div>
          </div>
        )}

        {activeTab === 'Wallet Requests' && (
          <motion.div 
            initial="hidden"
            animate="show"
            variants={{
              hidden: { opacity: 0 },
              show: { opacity: 1, transition: { staggerChildren: 0.05 } }
            }}
            className="space-y-10"
          >
             <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 pb-2">
              <div>
                <h2 className="text-4xl font-black text-stone-900 tracking-tight">Financial Hub</h2>
                <p className="text-stone-500 mt-1 text-base font-medium">Verify and crystalize customer ledger top-up protocols.</p>
              </div>
              <motion.button 
                whileHover={{ rotate: 180 }}
                onClick={fetchWalletRequests}
                className="p-4 bg-white border border-stone-200 rounded-2xl text-stone-400 hover:text-stone-900 transition-all shadow-sm group"
              >
                <RefreshCw size={22} className="group-active:animate-spin" />
              </motion.button>
            </header>

            <div className="bg-white rounded-[2.5rem] shadow-sm border border-stone-100 overflow-hidden">
              <div className="overflow-x-auto no-scrollbar">
                <table className="w-full text-left">
                  <thead className="bg-stone-50/50 text-stone-400 text-[9px] uppercase font-black tracking-[0.25em]">
                    <tr>
                      <th className="px-10 py-8">Origin Node</th>
                      <th className="px-6 py-8">Request Value</th>
                      <th className="px-6 py-8">Protocol ID</th>
                      <th className="px-6 py-8">Evidence</th>
                      <th className="px-6 py-8">Time Slice</th>
                      <th className="px-10 py-8 text-right">Goverance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-50">
                    {walletRequests.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-10 py-32 text-center">
                          <div className="flex flex-col items-center space-y-4 opacity-20 grayscale">
                            <ShieldCheck size={64} strokeWidth={1} />
                            <p className="text-xs font-black uppercase tracking-[0.3em]">All Transactions Settled</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      walletRequests.map((req, idx) => (
                        <motion.tr 
                          key={req.id} 
                          variants={{ hidden: { opacity: 0, x: -10 }, show: { opacity: 1, x: 0 } }}
                          className="hover:bg-stone-50/80 transition-all group"
                        >
                          <td className="px-10 py-7">
                            <div className="flex items-center space-x-4">
                              <div className="w-12 h-12 bg-stone-100 rounded-2xl flex items-center justify-center text-stone-400 group-hover:bg-stone-900 group-hover:text-white transition-all duration-300">
                                <Users size={18} />
                              </div>
                              <div>
                                <p className="text-sm font-black text-stone-900">{req.user_name}</p>
                                <p className="text-[10px] text-stone-400 font-bold uppercase tracking-widest leading-tight">{req.user_phone}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-7 font-black text-stone-900 text-lg tracking-tighter">₹{req.amount}</td>
                          <td className="px-6 py-7">
                            <span className="font-mono text-[10px] font-black text-stone-400 border border-stone-200 px-3 py-1.5 rounded-lg uppercase tracking-wider">
                              {req.transaction_id || 'X-VOID'}
                            </span>
                          </td>
                          <td className="px-6 py-7">
                            {req.screenshot ? (
                              <button 
                                onClick={() => window.open(req.screenshot, '_blank')}
                                className="flex items-center space-x-2 text-[10px] text-stone-900 font-bold uppercase tracking-widest hover:underline decoration-stone-900 underline-offset-4"
                              >
                                <Eye size={14} />
                                <span>Inspect Artifact</span>
                              </button>
                            ) : (
                              <span className="text-[9px] text-stone-300 font-black uppercase tracking-widest italic">No Data Artifact</span>
                            )}
                          </td>
                          <td className="px-6 py-7">
                            <div className="flex flex-col">
                              <span className="text-xs font-black text-stone-800 tracking-tight">{new Date(req.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</span>
                              <span className="text-[9px] font-bold text-stone-400 mt-1 uppercase tracking-widest">{new Date(req.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                          </td>
                          <td className="px-10 py-7 text-right">
                            <div className="flex justify-end items-center space-x-3">
                              <motion.button 
                                whileHover={{ y: -2 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handleRejectWalletRequest(req.id)}
                                className="px-5 py-3 bg-white text-stone-400 hover:text-red-500 rounded-xl text-[10px] font-black uppercase tracking-widest border border-stone-100 transition-all hover:bg-stone-50"
                              >
                                Decline
                              </motion.button>
                              <motion.button 
                                whileHover={{ y: -2 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handleApproveWalletRequest(req.id)}
                                className="bg-stone-900 text-white px-7 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-stone-800 transition-all shadow-xl shadow-stone-900/10 active:scale-95"
                              >
                                Approve
                              </motion.button>
                            </div>
                          </td>
                        </motion.tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}
        {activeTab === 'Customers' && (
          <div className="space-y-10">
            {/* Intelligence Header */}
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-8">
              <div>
                  <h2 className="text-4xl font-black text-stone-900 tracking-tight">Customer Insights</h2>
                <p className="text-stone-500 mt-2 text-lg font-medium">Segment behavior, wallet states, and lifetime value analytics.</p>
              </div>
              <div className="flex items-center space-x-3">
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-stone-100 flex items-center space-x-8">
                   <div className="flex flex-col">
                     <span className="text-[10px] uppercase font-black text-stone-400 tracking-widest leading-none mb-1">Active Pool</span>
                     <span className="text-2xl font-black text-stone-900">{filteredUsers.length}</span>
                   </div>
                   <div className="w-px h-10 bg-stone-100" />
                   <div className="flex flex-col">
                     <span className="text-[10px] uppercase font-black text-stone-400 tracking-widest leading-none mb-1">Retention</span>
                     <span className="text-2xl font-black text-emerald-500">88.4%</span>
                   </div>
                </div>
                <button 
                  onClick={() => generateAdminCustomerReportPDF(users)}
                  className="bg-stone-900 text-white p-6 rounded-3xl shadow-xl shadow-stone-200 hover:scale-105 active:scale-95 transition-all flex items-center space-x-3"
                >
                  <Download size={20} />
                  <div className="flex flex-col items-start text-left">
                    <span className="text-[10px] font-black uppercase tracking-widest leading-none mb-1">Intelligence</span>
                    <span className="text-xs font-bold opacity-60">Full Dossier</span>
                  </div>
                </button>
              </div>
            </header>

            {/* Segment & Search Toolbar */}
            <section className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-stone-100 flex flex-wrap items-center gap-8">
              <div className="flex items-center space-x-3 pr-8 border-r border-stone-100 h-12">
                <div className="p-3 bg-stone-900 rounded-2xl text-white">
                  <Users size={20} />
                </div>
                <span className="text-xs font-black text-stone-900 uppercase tracking-widest leading-none">Social<br/><span className="text-stone-400 font-bold">Groups</span></span>
              </div>
              
              <div className="flex flex-1 items-center space-x-2 overflow-x-auto no-scrollbar scroll-smooth gap-1">
                {['all', 'Champion', 'Loyal', 'Recent', 'At Risk', 'Lost'].map((segment) => (
                  <button
                    key={segment}
                    onClick={() => setSelectedSegment(segment)}
                    className={cn(
                      "px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap outline-none",
                      selectedSegment === segment
                        ? "bg-stone-900 text-white shadow-xl shadow-stone-200" 
                        : "text-stone-400 hover:text-stone-900 hover:bg-stone-50"
                    )}
                  >
                    {segment === 'all' ? 'All Intelligence' : segment}
                  </button>
                ))}
              </div>

              <div className="flex items-center space-x-4 pl-4 border-l border-stone-100">
                <div className="relative group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-300 group-focus-within:text-primary transition-colors" size={18} />
                  <input 
                    type="text" 
                    placeholder="Search humans..."
                    className="bg-stone-50 border-stone-200 border rounded-2xl pl-12 pr-4 py-3.5 text-sm focus:ring-4 focus:ring-primary/10 outline-none transition-all placeholder:text-stone-300 font-medium w-64 uppercase tracking-wider text-[10px]"
                  />
                </div>
                <motion.button 
                  whileHover={{ rotate: 180 }}
                  onClick={() => setSelectedSegment('all')}
                  className="p-3.5 bg-stone-50 border border-stone-200 rounded-2xl text-stone-400 hover:text-primary transition-all shadow-sm"
                >
                  <RefreshCw size={20} />
                </motion.button>
              </div>
            </section>

            <div className="bg-white rounded-[2.5rem] shadow-sm border border-stone-100 overflow-hidden">
              <div className="overflow-x-auto no-scrollbar hidden md:block">
                <table className="w-full text-left">
                  <thead className="bg-stone-50/50 text-stone-400 text-[10px] uppercase font-black tracking-[0.15em]">
                    <tr>
                      <th className="px-8 py-6">Identity Profile</th>
                      <th className="px-6 py-6">Engagement Segment</th>
                      <th className="px-6 py-6 text-right">Settlement Wallet</th>
                      <th className="px-6 py-6">Commercial value</th>
                      <th className="px-6 py-6">Khata Policy</th>
                      <th className="px-8 py-6 text-right">Governance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-50">
                    {filteredUsers.map((u, idx) => (
                      <motion.tr 
                        key={u.id} 
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.03 }}
                        className="hover:bg-stone-50/80 transition-all duration-300 group"
                      >
                        <td className="px-8 py-6">
                          <div className="flex items-center space-x-4">
                            <div className="relative">
                              <div className="w-14 h-14 rounded-[1.25rem] bg-stone-100 flex items-center justify-center overflow-hidden border border-stone-200/50 shadow-sm group-hover:scale-105 transition-transform duration-500">
                                {u.profile_photo ? (
                                  <img src={u.profile_photo} alt="" className="w-full h-full object-cover" />
                                ) : (
                                  <Users size={22} className="text-stone-400" />
                                )}
                              </div>
                              <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-4 border-white shadow-sm ring-1 ring-emerald-100" />
                            </div>
                            <div>
                              <p className="text-sm font-black text-stone-900 group-hover:text-primary transition-colors tracking-tight">{u.name}</p>
                              <p className="text-[10px] text-stone-400 font-bold uppercase tracking-[0.15em] mt-0.5">{u.phone}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-6">
                          <div className="flex flex-col space-y-2">
                            <div className="flex items-center space-x-2">
                               <span className={cn(
                                 "inline-flex items-center px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border",
                                 u.computed_segment === 'Champion' ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                                 u.computed_segment === 'Loyal' ? "bg-blue-50 text-blue-600 border-blue-100" :
                                 u.computed_segment === 'Recent' ? "bg-amber-50 text-amber-600 border-amber-100" :
                                 u.computed_segment === 'At Risk' ? "bg-orange-50 text-orange-600 border-orange-100" :
                                 "bg-stone-50 text-stone-500 border-stone-100"
                               )}>
                                 {u.computed_segment || u.segment || 'PROSPECT'}
                               </span>
                               {u.rfm_score && <span className="text-[10px] font-mono font-black text-stone-300 tracking-tighter">RFM:{u.rfm_score}</span>}
                            </div>
                            <span className="text-[9px] font-black text-stone-400 uppercase tracking-[0.2em]">{u.role} Access LVL</span>
                          </div>
                        </td>
                        <td className="px-6 py-6 text-right">
                          <div className="flex flex-col items-end">
                            <span className="text-base font-black text-primary tracking-tighter">₹{u.wallet_balance}</span>
                            <button 
                              onClick={() => setWalletModal({ open: true, userId: u.id })}
                              className="text-[9px] font-black uppercase tracking-widest text-stone-400 hover:text-primary transition-colors mt-1.5 underline decoration-stone-200 underline-offset-4"
                            >
                              Ledger Top-up
                            </button>
                          </div>
                        </td>
                        <td className="px-6 py-6 font-bold text-sm text-stone-500">
                          <div className="flex flex-col">
                            <span className="text-sm font-black text-stone-900 tracking-tight">{(u as any).total_orders || 0} Transactions</span>
                            <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mt-1.5">Spent: ₹{(u as any).total_spent || 0}</span>
                          </div>
                        </td>
                        <td className="px-6 py-6">
                           <div className="flex flex-col">
                             <div className="flex items-center space-x-2.5">
                               <div className={cn("w-2 h-2 rounded-full", u.khata_enabled ? "bg-emerald-500 animate-pulse" : "bg-stone-200")} />
                               <span className={cn("text-[10px] font-black uppercase tracking-[0.15em]", u.khata_enabled ? "text-stone-900" : "text-stone-300")}>
                                 {u.khata_enabled ? 'Merchant Credit' : 'NO LINE'}
                               </span>
                             </div>
                             {u.khata_enabled && <span className="text-[10px] text-primary font-black mt-1.5 pl-4.5 tracking-tighter italic">UTIL: ₹{u.khata_balance}</span>}
                           </div>
                        </td>
                        <td className="px-8 py-6 text-right relative">
                          <div className="flex justify-end items-center space-x-2">
                             <motion.button 
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => { setCustomerModal({ open: true, user: u }); }}
                                className="p-3 bg-stone-50 text-stone-500 hover:text-primary hover:bg-white hover:shadow-xl hover:shadow-stone-200/50 border border-transparent hover:border-stone-100 rounded-2xl transition-all"
                                title="Intelligence"
                              >
                                <Eye size={18} />
                              </motion.button>
                              <div className="relative">
                                <motion.button 
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveActionMenuId(activeActionMenuId === `user_${u.id}` ? null : `user_${u.id}`);
                                  }}
                                  className={cn(
                                    "p-3 bg-stone-50 text-stone-500 rounded-2xl transition-all border border-transparent hover:bg-white hover:shadow-xl hover:shadow-stone-200/50 hover:text-primary",
                                    activeActionMenuId === `user_${u.id}` && "bg-white text-primary shadow-xl shadow-stone-200/50 border-stone-100"
                                  )}
                                >
                                  <MoreVertical size={18} />
                                </motion.button>
                                
                                <AnimatePresence>
                                  {activeActionMenuId === `user_${u.id}` && (
                                    <motion.div 
                                      initial={{ opacity: 0, scale: 0.95, y: 10, x: 10 }}
                                      animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
                                      exit={{ opacity: 0, scale: 0.95, y: 10, x: 10 }}
                                      className="absolute right-0 top-full mt-4 w-72 bg-white rounded-[2rem] shadow-2xl shadow-stone-300 border border-stone-100 z-[60] overflow-hidden flex flex-col py-4"
                                      onMouseLeave={() => setActiveActionMenuId(null)}
                                    >
                                      <div className="px-8 py-2 text-[10px] font-black uppercase text-stone-300 tracking-[0.25em] mb-2">CRM Directives</div>
                                      <button 
                                        onClick={() => { fetchCustomerOrders(u.id); setActiveActionMenuId(null); }}
                                        className="flex items-center space-x-5 px-8 py-4 hover:bg-stone-50 group transition-all"
                                      >
                                        <div className="p-2.5 bg-stone-100 rounded-2xl group-hover:bg-primary/10 group-hover:text-primary transition-colors"><ShoppingBag size={18} /></div>
                                        <span className="text-xs font-black text-stone-900 group-hover:text-primary uppercase tracking-widest">Transaction History</span>
                                      </button>
                                      
                                      <button 
                                        onClick={() => { fetchWalletHistory(u.id); setActiveActionMenuId(null); }}
                                        className="flex items-center space-x-5 px-8 py-4 hover:bg-stone-50 group transition-all"
                                      >
                                        <div className="p-2.5 bg-stone-100 rounded-2xl group-hover:bg-primary/10 group-hover:text-primary transition-colors"><History size={18} /></div>
                                        <span className="text-xs font-black text-stone-900 group-hover:text-primary uppercase tracking-widest">Wallet Trail</span>
                                      </button>

                                      <a 
                                        href={`https://wa.me/91${u.phone.replace(/[^0-9]/g, '').slice(-10)}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center space-x-5 px-8 py-4 hover:bg-emerald-50 group transition-all"
                                      >
                                        <div className="p-2.5 bg-emerald-100 rounded-2xl text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-all"><MessageCircle size={18} /></div>
                                        <span className="text-xs font-black text-stone-900 group-hover:text-emerald-600 uppercase tracking-widest">Secure WhatsApp</span>
                                      </a>

                                      <div className="h-px bg-stone-100 my-4 mx-6" />
                                      <button className="flex items-center space-x-5 px-8 py-4 hover:bg-amber-50 group transition-all">
                                        <div className="p-2.5 bg-amber-100 rounded-2xl text-amber-600 group-hover:bg-amber-600 group-hover:text-white transition-all"><Bell size={18} /></div>
                                        <span className="text-xs font-black text-stone-900 group-hover:text-amber-600 uppercase tracking-widest">Push Alert Node</span>
                                      </button>
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card Experience */}
              <div className="md:hidden space-y-6 p-6 bg-stone-50/50">
                {filteredUsers.map((u) => (
                  <motion.div 
                    layout
                    key={u.id} 
                    className="bg-white rounded-[2rem] p-6 border border-stone-100 shadow-sm space-y-6 relative overflow-hidden"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-16 h-16 rounded-2xl bg-stone-100 flex items-center justify-center overflow-hidden border border-stone-200">
                           {u.profile_photo ? <img src={u.profile_photo} alt="" className="w-full h-full object-cover" /> : <Users size={24} className="text-stone-300" />}
                        </div>
                        <div>
                          <p className="text-lg font-black text-stone-900 tracking-tight leading-none">{u.name}</p>
                          <p className="text-[10px] text-stone-400 font-bold uppercase tracking-widest mt-2">{u.phone}</p>
                        </div>
                      </div>
                      <span className="text-[8px] font-black px-2 py-1 bg-stone-900 text-white rounded-lg uppercase tracking-widest">{u.role}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-stone-50 p-4 rounded-2xl border border-stone-100">
                        <span className="text-[9px] font-black text-stone-400 uppercase tracking-widest block mb-1">Settlement</span>
                        <span className="text-sm font-black text-primary">₹{u.wallet_balance}</span>
                      </div>
                      <div className="bg-stone-50 p-4 rounded-2xl border border-stone-100">
                         <span className="text-[9px] font-black text-stone-400 uppercase tracking-widest block mb-1">Segment</span>
                         <span className="text-sm font-black text-stone-900">{u.computed_segment || 'N/A'}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                       <div className="flex items-center space-x-2">
                         <button onClick={() => setCustomerModal({ open: true, user: u })} className="w-12 h-12 bg-white border border-stone-100 rounded-2xl flex items-center justify-center text-stone-400 shadow-sm"><Eye size={20} /></button>
                         <button onClick={() => fetchCustomerOrders(u.id)} className="w-12 h-12 bg-white border border-stone-100 rounded-2xl flex items-center justify-center text-stone-400 shadow-sm"><ShoppingBag size={20} /></button>
                       </div>
                       <button 
                        onClick={() => setWalletModal({ open: true, userId: u.id })}
                        className="flex-1 ml-4 bg-stone-900 text-white h-12 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-stone-200"
                       >
                         Top up Ledgers
                       </button>
                    </div>
                  </motion.div>
                ))}
              </div>

              {filteredUsers.length === 0 && (
                <div className="py-24 text-center">
                  <div className="w-24 h-24 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-8 animate-pulse text-stone-300">
                    <Users size={40} />
                  </div>
                  <h4 className="text-2xl font-black text-stone-900 tracking-tight">No Customers Found</h4>
                  <p className="text-stone-400 font-medium mt-2">No users matching your search were found.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'Promotions' && (
          <div className="space-y-10">
            {/* Campaign Header */}
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-8">
              <div>
                <h2 className="text-4xl font-black text-stone-900 tracking-tight">Campaign Center</h2>
                <p className="text-stone-500 mt-2 text-lg font-medium">Coordinate store-wide visual banners and promotional announcements.</p>
              </div>
              <button 
                onClick={() => {
                  setNewPromotion({ title: '', description: '', image_url: '', link: '', active: true });
                  setPromotionModal({ open: true, mode: 'add', id: null });
                }}
                className="bg-stone-900 text-white px-8 py-4 rounded-[2rem] font-black flex items-center space-x-3 shadow-2xl shadow-stone-300 hover:bg-stone-800 transition-all active:scale-95 group"
              >
                <div className="p-1 bg-white/20 rounded-lg group-hover:rotate-90 transition-transform"><Plus size={18} /></div>
                <span className="uppercase tracking-widest text-xs">Architect New Banner</span>
              </button>
            </header>

            {/* Banner Performance Stats - Simulated for UI richness */}
            <section className="grid grid-cols-1 md:grid-cols-4 gap-6">
               {[
                 { label: 'Live Banners', val: promotions.filter(p => p.active).length, icon: Eye, color: 'text-primary' },
                 { label: 'Avg Click Rate', val: '4.2%', icon: MousePointer2, color: 'text-emerald-500' },
                 { label: 'Campaign Reach', val: '12.4k', icon: Users, color: 'text-blue-500' },
                 { label: 'Total Variants', val: promotions.length, icon: Megaphone, color: 'text-purple-500' }
               ].map((stat, i) => (
                 <div key={i} className="bg-white p-6 rounded-3xl border border-stone-100 shadow-sm flex items-center space-x-4">
                    <div className={cn("p-3 rounded-2xl bg-stone-50", stat.color)}>
                      <stat.icon size={20} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest leading-none mb-1">{stat.label}</p>
                      <p className="text-xl font-black text-stone-900">{stat.val}</p>
                    </div>
                 </div>
               ))}
            </section>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {promotions.map((promo, idx) => (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  key={promo.id} 
                  className="bg-white rounded-[2.5rem] overflow-hidden shadow-sm border border-stone-100 group flex flex-col hover:shadow-2xl hover:shadow-stone-200 transition-all duration-500"
                >
                  <div className="h-56 relative bg-stone-100 overflow-hidden">
                    {promo.image_url ? (
                      <img 
                        src={promo.image_url} 
                        alt="" 
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-stone-300">
                        <ImageOff size={40} className="mb-2" />
                        <span className="text-[10px] uppercase font-black tracking-widest">Missing Creative</span>
                      </div>
                    )}
                    
                    <div className="absolute top-4 left-4 flex gap-2">
                      <div className={cn(
                        "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-[0.15em] shadow-lg border border-white/20 backdrop-blur-md",
                        promo.active ? "bg-emerald-500/90 text-white" : "bg-stone-500/90 text-white line-through opacity-50"
                      )}>
                        {promo.active ? 'Broadcasting' : 'Off-Air'}
                      </div>
                      {!!promo.is_default && (
                        <div className="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-[0.15em] shadow-lg border border-white/20 backdrop-blur-md bg-blue-500 text-white">
                          Global Default
                        </div>
                      )}
                    </div>

                    <div className="absolute inset-0 bg-stone-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-3 backdrop-blur-sm">
                        <motion.button 
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => togglePromotionStatus(promo.id)}
                          className="w-12 h-12 bg-white text-stone-900 rounded-2xl flex items-center justify-center hover:bg-primary hover:text-white transition-all shadow-xl"
                          title={promo.active ? "Cease Campaign" : "Authorize Campaign"}
                        >
                          {promo.active ? <X size={20} /> : <Check size={20} />}
                        </motion.button>
                        <motion.button 
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => {
                            setNewPromotion({ 
                              title: promo.title, 
                              description: promo.description, 
                              image_url: promo.image_url, 
                              link: promo.link,
                              active: !!promo.active,
                              target_role: promo.target_role || 'all',
                              start_time: promo.start_time || '',
                              end_time: promo.end_time || '',
                              priority: promo.priority || 0,
                              is_default: !!promo.is_default
                            } as any);
                            setPromotionModal({ open: true, mode: 'edit', id: promo.id });
                          }}
                          className="w-12 h-12 bg-white text-stone-900 rounded-2xl flex items-center justify-center hover:bg-stone-900 hover:text-white transition-all shadow-xl"
                        >
                          <Settings size={20} />
                        </motion.button>
                        <motion.button 
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleDeletePromotion(promo.id)}
                          className="w-12 h-12 bg-red-500 text-white rounded-2xl flex items-center justify-center shadow-xl"
                        >
                          <Trash2 size={20} />
                        </motion.button>
                    </div>
                  </div>

                  <div className="p-8 flex flex-col flex-1">
                    <div className="flex items-center justify-between mb-2">
                       <span className="text-[10px] font-black uppercase text-stone-400 tracking-[0.2em]">Target: {promo.target_role || 'All Audience'}</span>
                       <span className="text-[10px] font-black text-primary uppercase">Priority {promo.priority || 0}</span>
                    </div>
                    <h3 className="text-xl font-black text-stone-900 tracking-tight leading-tight mb-2 truncate">{promo.title}</h3>
                    <p className="text-xs text-stone-500 font-medium line-clamp-2 mb-6 leading-relaxed flex-1">{promo.description}</p>
                    
                    <div className="pt-6 border-t border-stone-50 flex items-center justify-between">
                       <div className="flex flex-col">
                          <span className="text-[9px] font-black text-stone-300 uppercase tracking-widest">CTA Destination</span>
                          <span className="text-[10px] font-bold text-stone-500 truncate max-w-[150px]">{promo.link || 'In-App Navigation'}</span>
                       </div>
                       <div className="p-3 bg-stone-50 group-hover:bg-primary/10 group-hover:text-primary rounded-xl transition-colors">
                          <ExternalLink size={16} />
                       </div>
                    </div>
                  </div>
                </motion.div>
              ))}

              {promotions.length === 0 && (
                <div className="col-span-full py-32 bg-stone-50/50 rounded-[3rem] border border-stone-100 text-center">
                  <div className="w-24 h-24 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-8 animate-pulse text-stone-200">
                    <Megaphone size={40} />
                  </div>
                  <h4 className="text-2xl font-black text-stone-900 tracking-tight">Eerie Silence</h4>
                  <p className="text-stone-400 font-medium mt-2">No active campaigns are currently broadcasting to your audience.</p>
                </div>
              )}
            </div>

            <div className="mt-12 space-y-6">
              <div className="flex justify-between items-center bg-white p-6 rounded-3xl border border-stone-100 shadow-sm">
                <div>
                  <h2 className="text-2xl font-bold">Discount Rules</h2>
                  <p className="text-stone-500">Configure BOGO, Percentage, and Fixed discounts</p>
                </div>
                <button 
                  onClick={() => {
                    setNewPromotionRule({ title: '', type: 'percentage', target_type: 'all', target_id: '', condition_qty: 1, discount_value: 0, active: true });
                    setPromotionRuleModal({ open: true, mode: 'add', id: null });
                  }}
                  className="bg-stone-900 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center space-x-2"
                >
                  <Plus size={16} />
                  <span>Create Rule</span>
                </button>
              </div>

              <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-stone-100">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="bg-stone-50 border-b border-stone-100 uppercase text-[10px] font-black text-stone-500 tracking-wider">
                        <th className="p-4">Status</th>
                        <th className="p-4">Title</th>
                        <th className="p-4">Type</th>
                        <th className="p-4">Target</th>
                        <th className="p-4">Min Qty</th>
                        <th className="p-4">Discount Value</th>
                        <th className="p-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {promotionRules.map((rule) => (
                        <tr key={rule.id} className="hover:bg-stone-50 transition-colors">
                          <td className="p-4">
                            <span className={cn(
                              "px-2 py-1 flex w-min items-center rounded-lg text-[10px] font-bold uppercase tracking-wider",
                              rule.active ? "bg-emerald-100 text-emerald-700" : "bg-stone-100 text-stone-500"
                            )}>
                              {rule.active ? 'Active' : 'Paused'}
                            </span>
                          </td>
                          <td className="p-4 font-bold max-w-[200px] truncate">{rule.name}</td>
                          <td className="p-4 uppercase text-[10px] font-black text-stone-500 tracking-widest">{rule.type}</td>
                          <td className="p-4">
                            <span className="bg-stone-100 px-2 py-1 rounded text-xs font-bold text-stone-600">
                              {rule.target_type === 'all' ? 'Entire Store' : `${rule.target_type}: ${rule.target_id}`}
                            </span>
                          </td>
                          <td className="p-4 font-bold">{rule.min_qty || 0}</td>
                          <td className="p-4 font-bold text-emerald-600">
                            {rule.type === 'percentage' && `${rule.value}%`}
                            {rule.type === 'fixed' && `₹${rule.value}`}
                            {rule.type === 'bogo' && `By ${rule.min_qty} Get ${rule.value}`}
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end space-x-2">
                              <button 
                                onClick={() => togglePromotionRuleStatus(rule.id)}
                                className={cn(
                                  "p-2 rounded-xl transition-colors",
                                  rule.active ? "text-amber-500 bg-amber-50" : "text-emerald-500 bg-emerald-50"
                                )}
                                title={rule.active ? "Pause Rule" : "Activate Rule"}
                              >
                                {rule.active ? <X size={16} /> : <Check size={16} />}
                              </button>
                              <button 
                                onClick={() => {
                                  setNewPromotionRule({
                                    title: rule.name,
                                    type: rule.type,
                                    target_type: rule.target_type,
                                    target_id: rule.target_id || '',
                                    condition_qty: rule.min_qty || 1,
                                    discount_value: rule.value,
                                    active: rule.active
                                  });
                                  setPromotionRuleModal({ open: true, mode: 'edit', id: rule.id });
                                }}
                                className="p-2 text-stone-400 hover:text-primary hover:bg-stone-100 rounded-xl transition-colors"
                              >
                                <Settings size={16} />
                              </button>
                              <button 
                                onClick={() => handleDeletePromotionRule(rule.id)}
                                className="p-2 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {promotionRules.length === 0 && (
                        <tr>
                          <td colSpan={7} className="p-8 text-center text-stone-400 font-bold">
                            No discount rules configured yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="mt-12 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold">Highlighted Discounted Products</h3>
                <div className="flex items-center space-x-2 text-xs font-bold text-stone-400 uppercase">
                  <Tag size={14} />
                  <span>{allProducts.filter(p => p.discount > 0).length} Items on Sale</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {allProducts.filter(p => p.discount > 0).slice(0, 8).map(product => (
                  <div key={product.id} className="bg-white p-4 rounded-2xl shadow-sm border border-stone-100 flex items-center space-x-4">
                    <div className="w-16 h-16 bg-stone-50 rounded-xl overflow-hidden flex-shrink-0">
                      <img src={product.image_url} className="w-full h-full object-cover" alt="" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold truncate">{product.name}</p>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-bold text-primary">₹{product.retail_price}</span>
                        <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded">-{product.discount}%</span>
                      </div>
                      <button 
                        onClick={() => {
                          setVariantModal({ open: true, productId: product.id });
                          fetchProductVariants(product.id);
                        }}
                        className="text-[10px] font-bold text-stone-400 hover:text-primary uppercase tracking-wider mt-1"
                      >
                        Manage Variants (Cartoon/Piece)
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'Payment Settings' && (
          <div className="max-w-2xl space-y-6">
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-stone-100 space-y-6">
              <h3 className="text-xl font-bold">UPI Payment Details</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-stone-700 mb-1">UPI ID</label>
                  <input 
                    type="text" 
                    className="input-field"
                    defaultValue={config.find(c => c.key === 'upi_id')?.value}
                    onBlur={(e) => updateSetting('upi_id', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-stone-700 mb-1">Receiver Name</label>
                  <input 
                    type="text" 
                    className="input-field"
                    defaultValue={config.find(c => c.key === 'upi_name')?.value}
                    onBlur={(e) => updateSetting('upi_name', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-stone-700 mb-1">QR Code Image</label>
                  <div className="flex items-center space-x-4">
                    <div className="w-24 h-24 bg-stone-100 rounded-xl border border-stone-200 overflow-hidden flex items-center justify-center">
                      {config.find(c => c.key === 'upi_qr')?.value ? (
                        <img src={config.find(c => c.key === 'upi_qr')?.value} alt="QR" className="w-full h-full object-contain" />
                      ) : (
                        <ImageIcon className="text-stone-300" size={32} />
                      )}
                    </div>
                    <div className="flex-1 space-y-2">
                      <input 
                        type="text" 
                        className="input-field text-xs"
                        placeholder="Image URL (https://...)"
                        defaultValue={config.find(c => c.key === 'upi_qr')?.value}
                        onBlur={(e) => updateSetting('upi_qr', e.target.value)}
                      />
                      <div className="relative">
                        <button className="w-full py-2 bg-stone-100 hover:bg-stone-200 rounded-lg text-xs font-bold transition-colors flex items-center justify-center space-x-2">
                          <Upload size={14} />
                          <span>Upload from Gallery</span>
                        </button>
                        <input 
                          type="file" 
                          accept="image/*"
                          className="absolute inset-0 opacity-0 cursor-pointer"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                updateSetting('upi_qr', reader.result as string);
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t border-stone-100">
                  <h4 className="font-bold text-stone-600">Bank Account Details</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-stone-700 mb-1">Bank Name</label>
                      <input 
                        type="text" 
                        className="input-field"
                        defaultValue={config.find(c => c.key === 'bank_name')?.value}
                        onBlur={(e) => updateSetting('bank_name', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-stone-700 mb-1">Account Holder Name</label>
                      <input 
                        type="text" 
                        className="input-field"
                        defaultValue={config.find(c => c.key === 'account_holder')?.value}
                        onBlur={(e) => updateSetting('account_holder', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-stone-700 mb-1">Account Number</label>
                      <input 
                        type="text" 
                        className="input-field"
                        defaultValue={config.find(c => c.key === 'account_number')?.value}
                        onBlur={(e) => updateSetting('account_number', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-stone-700 mb-1">IFSC Code</label>
                      <input 
                        type="text" 
                        className="input-field"
                        defaultValue={config.find(c => c.key === 'ifsc_code')?.value}
                        onBlur={(e) => updateSetting('ifsc_code', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'Store Settings' && (
          <div className="max-w-5xl space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-stone-100 pb-10">
              <div>
                <h2 className="text-4xl font-black text-stone-900 tracking-tight">Store Settings</h2>
                <p className="text-stone-500 mt-2 text-lg font-medium">Manage your store's general information, security, and delivery settings.</p>
              </div>
              <div className="bg-white px-6 py-4 rounded-[2rem] shadow-sm border border-stone-100 flex items-center space-x-4">
                <div className="w-3 h-3 bg-emerald-500 rounded-full" />
                <span className="text-xs font-black text-stone-900 uppercase tracking-widest">Settings are synced</span>
              </div>
            </div>

            {/* Announcement Broadcast */}
            <section className="relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-red-600 to-red-700 blur-2xl opacity-10 group-hover:opacity-20 transition-opacity" />
              <div className="relative bg-white border-4 border-red-50 rounded-[3rem] shadow-2xl shadow-red-200/40 p-10 overflow-hidden">
                <div className="absolute top-0 right-0 w-80 h-80 bg-red-50 rounded-full -mr-40 -mt-40 opacity-50" />
                
                <div className="relative z-10 space-y-10">
                  <div className="flex items-center space-x-6">
                    <div className="w-20 h-20 bg-red-600 text-white rounded-[2rem] flex items-center justify-center shadow-2xl shadow-red-600/30 rotate-3">
                      <ShieldAlert size={40} />
                    </div>
                    <div>
                      <h3 className="text-3xl font-black text-stone-900 tracking-tight leading-none mb-2">Send Urgent Alert</h3>
                      <p className="text-stone-400 font-bold uppercase text-[10px] tracking-[0.2em]">Send an alert message to all online customers</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-4">
                    <div className="space-y-4">
                      <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest pl-4">Alert Title</label>
                      <input 
                        id="broadcast-title"
                        type="text" 
                        placeholder="e.g. SHOP CLOSED TODAY"
                        className="w-full bg-stone-50 border-stone-100 border-2 rounded-[1.5rem] px-8 py-5 text-stone-900 placeholder:text-stone-300 outline-none focus:border-red-500 focus:bg-white transition-all font-black uppercase tracking-widest text-sm"
                      />
                    </div>
                    <div className="space-y-4">
                      <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest pl-4">Priority Level</label>
                      <select 
                        id="broadcast-type"
                        className="w-full bg-stone-50 border-stone-100 border-2 rounded-[1.5rem] px-8 py-5 text-stone-900 outline-none focus:border-red-500 focus:bg-white transition-all font-black uppercase tracking-widest text-sm appearance-none cursor-pointer"
                      >
                        <option value="critical">Critical (Level 5)</option>
                        <option value="warning">Warning (Level 3)</option>
                        <option value="info">Info (Level 1)</option>
                        <option value="success">Success (Level 0)</option>
                      </select>
                    </div>
                    <div className="lg:col-span-2 space-y-4">
                      <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest pl-4">Alert Message</label>
                      <textarea 
                        id="broadcast-message"
                        placeholder="Write your message here..."
                        className="w-full bg-stone-50 border-stone-100 border-2 rounded-[2rem] px-8 py-6 text-stone-900 placeholder:text-stone-300 outline-none focus:border-red-500 focus:bg-white transition-all font-medium h-40 resize-none"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col md:flex-row items-center justify-between gap-6 pt-6 border-t border-stone-100 bg-stone-50/50 -mx-10 -mb-10 p-10">
                    <p className="text-xs text-stone-400 font-bold max-w-sm italic">Warning: This will immediately show an alert to every customer currently on the website.</p>
                    <button 
                      onClick={async () => {
                        const title = (document.getElementById('broadcast-title') as HTMLInputElement).value;
                        const message = (document.getElementById('broadcast-message') as HTMLTextAreaElement).value;
                        const type = (document.getElementById('broadcast-type') as HTMLSelectElement).value;
                        
                        if (!title || !message) {
                          toast.error('Title and message are required');
                          return;
                        }
                        
                        if (!window.confirm('SEND ALERT TO ALL USERS?')) return;
                        
                        try {
                          const res = await fetch('/api/admin/broadcast-alert', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ 
                              title, message, type, 
                              duration: 8000, 
                              is_unskippable: true 
                            })
                          });
                          if (res.ok) {
                            toast.success('Alert Sent');
                            (document.getElementById('broadcast-title') as HTMLInputElement).value = '';
                            (document.getElementById('broadcast-message') as HTMLTextAreaElement).value = '';
                          }
                        } catch (e) {
                          toast.error('Failed to send alert');
                        }
                      }}
                      className="w-full md:w-auto bg-red-600 text-white px-12 py-5 rounded-[2rem] font-black uppercase tracking-widest hover:bg-black transition-all shadow-2xl shadow-red-600/30 hover:scale-105 active:scale-95"
                    >
                      Send Message Now
                    </button>
                  </div>
                </div>
              </div>
            </section>

            {/* Core Settings */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
              <section className="bg-white p-10 rounded-[3rem] shadow-sm border border-stone-100 space-y-10">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-stone-900 text-white rounded-2xl flex items-center justify-center rotate-3">
                    <Database size={24} />
                  </div>
                  <h3 className="text-2xl font-black text-stone-900 tracking-tight">Store Access</h3>
                </div>

                <div className="space-y-8">
                  <div className="group flex items-center justify-between p-8 bg-stone-50 border border-stone-100 rounded-[2rem] hover:border-primary/20 hover:bg-white transition-all duration-300">
                    <div className="space-y-1">
                      <p className="font-black text-stone-900 uppercase tracking-widest text-[10px]">Maintenance Mode</p>
                      <p className="text-xs text-stone-400 font-bold">Only you can access the store when this is ON.</p>
                    </div>
                    <button 
                      onClick={() => updateSetting('maintenance_mode', getSetting('maintenance_mode') === 'true' ? 'false' : 'true')}
                      className={cn(
                        "w-16 h-8 rounded-full transition-all duration-500 relative ring-4 ring-offset-2 ring-transparent",
                        getSetting('maintenance_mode') === 'true' ? "bg-primary ring-primary/10 shadow-lg shadow-primary/20" : "bg-stone-200"
                      )}
                    >
                      <div className={cn(
                        "absolute top-1 w-6 h-6 bg-white rounded-full transition-all duration-500 shadow-sm",
                        getSetting('maintenance_mode') === 'true' ? "left-9" : "left-1"
                      )} />
                    </button>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest pl-4">Admin Email Address</label>
                    <div className="relative">
                       <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-stone-300" size={18} />
                       <input 
                        type="email" 
                        className="w-full bg-stone-50 border-stone-100 border-2 rounded-[1.5rem] pl-16 pr-8 py-5 text-stone-900 font-bold focus:border-primary focus:bg-white outline-none transition-all"
                        placeholder="you@example.com"
                        defaultValue={config.find(c => c.key === 'admin_email')?.value}
                        onBlur={(e) => updateSetting('admin_email', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest pl-4">Admin Phone Number</label>
                    <div className="relative">
                       <Smartphone className="absolute left-6 top-1/2 -translate-y-1/2 text-stone-300" size={18} />
                       <input 
                        type="text" 
                        className="w-full bg-stone-50 border-stone-100 border-2 rounded-[1.5rem] pl-16 pr-8 py-5 text-stone-900 font-bold focus:border-primary focus:bg-white outline-none transition-all"
                        placeholder="+91 Number"
                        defaultValue={config.find(c => c.key === 'admin_phone')?.value}
                        onBlur={(e) => updateSetting('admin_phone', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </section>

              <section className="bg-white p-10 rounded-[3rem] shadow-sm border border-stone-100 space-y-10">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-primary text-white rounded-2xl flex items-center justify-center -rotate-3">
                    <Layout size={24} />
                  </div>
                  <h3 className="text-2xl font-black text-stone-900 tracking-tight">Contact Information</h3>
                </div>

                <div className="space-y-6">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest pl-4">Store Name</label>
                    <input 
                      type="text" 
                      className="w-full bg-stone-50 border-stone-100 border-2 rounded-[1.5rem] px-8 py-5 text-stone-900 font-bold focus:border-primary focus:bg-white outline-none transition-all"
                      placeholder="Organization Name"
                      defaultValue={config.find(c => c.key === 'store_name')?.value}
                      onBlur={(e) => updateSetting('store_name', e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest pl-2">Support Phone</label>
                      <input 
                        type="text" 
                        className="w-full bg-stone-50 border-stone-100 border-2 rounded-[1.5rem] px-6 py-5 text-stone-900 font-bold focus:border-primary focus:bg-white outline-none transition-all text-sm"
                        defaultValue={config.find(c => c.key === 'store_phone')?.value}
                        onBlur={(e) => updateSetting('store_phone', e.target.value)}
                      />
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest pl-2">WhatsApp Business</label>
                      <input 
                        type="text" 
                        className="w-full bg-stone-50 border-stone-100 border-2 rounded-[1.5rem] px-6 py-5 text-stone-900 font-bold focus:border-primary focus:bg-white outline-none transition-all text-sm"
                        defaultValue={config.find(c => c.key === 'whatsapp_number')?.value}
                        onBlur={(e) => updateSetting('whatsapp_number', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest pl-4">Store Address</label>
                    <input 
                      type="text" 
                      className="w-full bg-stone-50 border-stone-100 border-2 rounded-[1.5rem] px-8 py-5 text-stone-900 font-bold focus:border-primary focus:bg-white outline-none transition-all"
                      placeholder="Dispatch HQ Address"
                      defaultValue={config.find(c => c.key === 'store_address')?.value}
                      onBlur={(e) => updateSetting('store_address', e.target.value)}
                    />
                  </div>
                </div>
              </section>
            </div>

            {/* Delivery Logistics */}
            <section className="bg-white p-10 rounded-[3rem] shadow-sm border border-stone-100 space-y-10">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-[2rem] flex items-center justify-center shadow-lg shadow-emerald-100 flex-shrink-0">
                    <Truck size={32} />
                  </div>
                  <div>
                    <h3 className="text-3xl font-black text-stone-900 tracking-tight">Delivery Fees</h3>
                    <p className="text-stone-400 font-bold uppercase text-[10px] tracking-[0.2em] mt-1">Set shipping costs and free delivery rules</p>
                  </div>
                </div>
                
                <div className="flex flex-wrap items-center gap-4">
                   <div className="bg-emerald-50 px-6 py-3 rounded-2xl border border-emerald-100 flex flex-col">
                     <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest leading-none mb-1">Standard Fee</span>
                     <span className="text-lg font-black text-emerald-800">₹{deliveryFee}</span>
                   </div>
                   <button 
                    onClick={async () => {
                      await updateSetting('delivery_fee', deliveryFee);
                      await updateSetting('free_delivery_threshold', freeDeliveryThreshold);
                      toast.success('Logistics protocol synchronized');
                    }}
                    className="bg-emerald-600 text-white px-10 py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-600/20 active:scale-95 text-xs"
                  >
                    Save Delivery Rules
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-4">
                  <div className="flex items-center justify-between px-2">
                    <label className="text-xs font-black text-stone-400 uppercase tracking-widest">Standard Delivery Charge (₹)</label>
                    <span className="text-[10px] font-bold text-stone-300">Basic cost for any order</span>
                  </div>
                  <input 
                    type="number" 
                    className="w-full bg-stone-50 border-stone-100 border-2 rounded-[1.5rem] px-10 py-6 text-2xl font-black text-stone-900 focus:border-emerald-500 focus:bg-white outline-none transition-all tracking-tighter" 
                    value={deliveryFee}
                    onChange={(e) => setDeliveryFee(e.target.value)}
                  />
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between px-2">
                    <label className="text-xs font-black text-stone-400 uppercase tracking-widest">Free Delivery threshold (₹)</label>
                    <span className="text-[10px] font-bold text-emerald-500">Orders above this get free delivery</span>
                  </div>
                  <input 
                    type="number" 
                    className="w-full bg-stone-50 border-stone-100 border-2 rounded-[1.5rem] px-10 py-6 text-2xl font-black text-stone-900 focus:border-emerald-500 focus:bg-white outline-none transition-all tracking-tighter" 
                    value={freeDeliveryThreshold}
                    onChange={(e) => setFreeDeliveryThreshold(e.target.value)}
                  />
                </div>
              </div>

              <div className="bg-stone-50 rounded-[2.5rem] p-4 pt-10 border border-stone-100 overflow-hidden mt-6">
                <div className="px-6 flex items-center justify-between mb-6">
                  <div>
                    <h4 className="text-xl font-black text-stone-900 tracking-tight">Active Delivery Zones</h4>
                    <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mt-1">Geo-fenced area exceptions</p>
                  </div>
                  <button 
                    onClick={() => {
                      setDeliveryAreaModal({ open: true, mode: 'add', area: null });
                      setNewDeliveryArea({ name: '', fee: '0', min_order: '0' });
                    }}
                    className="bg-white text-stone-900 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border-2 border-stone-100 hover:border-emerald-500 hover:text-emerald-600 transition-all shadow-sm"
                  >
                    + Add Zone
                  </button>
                </div>
                <div className="overflow-x-auto no-scrollbar px-6 pb-6">
                  <table className="w-full text-left">
                    <thead className="text-[10px] font-black text-stone-400 uppercase tracking-[0.25em]">
                      <tr className="border-b-2 border-stone-100">
                        <th className="py-6 pr-6">Zone Name</th>
                        <th className="py-6 px-6">Delivery Fee</th>
                        <th className="py-6 px-6">Min Order</th>
                        <th className="py-6 pl-6 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {deliveryAreas.map((area) => (
                        <tr key={area.id} className="group hover:bg-white transition-all duration-300">
                          <td className="py-6 pr-6">
                             <div className="flex items-center space-x-3">
                               <div className="w-10 h-10 bg-white rounded-xl shadow-sm border border-stone-100 flex items-center justify-center text-stone-300 group-hover:text-emerald-500 transition-colors">
                                 <MapPin size={18} />
                               </div>
                               <span className="font-black text-stone-900 tracking-tight">{area.name}</span>
                             </div>
                          </td>
                          <td className="py-6 px-6 font-black text-stone-700 tracking-tighter text-lg">₹{area.fee}</td>
                          <td className="py-6 px-6 font-black text-stone-700 tracking-tighter text-lg">₹{area.min_order}</td>
                          <td className="py-6 pl-6 text-right space-x-2">
                            <button 
                              onClick={() => {
                                setDeliveryAreaModal({ open: true, mode: 'edit', area });
                                setNewDeliveryArea({ name: area.name, fee: area.fee.toString(), min_order: area.min_order.toString() });
                              }}
                              className="p-3 bg-stone-100 hover:bg-primary/10 hover:text-primary rounded-2xl transition-all border border-transparent shadow-sm"
                            >
                              <Settings size={18} />
                            </button>
                            <button 
                              onClick={() => handleDeleteDeliveryArea(area.id)}
                              className="p-3 bg-stone-100 hover:bg-red-50 hover:text-red-500 rounded-2xl transition-all border border-transparent shadow-sm"
                            >
                              <Trash2 size={18} />
                            </button>
                          </td>
                        </tr>
                      ))}
                      {deliveryAreas.length === 0 && (
                        <tr>
                          <td colSpan={4} className="py-12 text-center text-stone-400 font-bold italic bg-stone-50/50 rounded-[2rem]">No delivery zones added yet.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>

            <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-stone-100 space-y-10">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-4">
                  <div className="w-14 h-14 bg-stone-900 text-white rounded-2xl flex items-center justify-center rotate-3">
                    <FileText size={28} />
                  </div>
                  <div>
                    <h3 className="text-3xl font-black text-stone-900 tracking-tight">Terms & Conditions</h3>
                    <p className="text-stone-400 font-bold uppercase text-[10px] tracking-[0.2em] mt-1">Manage store rules and customer agreements</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <Link to="/terms-and-conditions" target="_blank" className="p-4 bg-stone-50 text-stone-400 hover:text-primary rounded-2xl transition-all shadow-sm group">
                    <ExternalLink size={20} className="group-hover:scale-110 transition-transform" />
                  </Link>
                  <button 
                    onClick={() => updateSetting('terms_and_conditions', tncContent)}
                    className="bg-stone-900 text-white px-10 py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-black transition-all shadow-xl shadow-stone-900/20 active:scale-95 text-xs"
                  >
                    Commit Changes
                  </button>
                </div>
              </div>
              <div className="quill-editor-container bg-stone-50 rounded-[2.5rem] p-2 border border-stone-100">
                <ReactQuill 
                  theme="snow"
                  value={tncContent}
                  onChange={setTncContent}
                  className="bg-white rounded-[2rem] overflow-hidden border-none"
                  modules={{
                    toolbar: [
                      [{ 'header': [1, 2, 3, false] }],
                      ['bold', 'italic', 'underline', 'strike'],
                      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                      ['link', 'clean']
                    ],
                  }}
                />
              </div>

              <div className="space-y-10 pt-10 border-t border-stone-100">
                <div className="flex justify-between items-center">
                   <div className="flex items-center space-x-4">
                    <div className="w-14 h-14 bg-primary text-white rounded-2xl flex items-center justify-center -rotate-3">
                      <HelpCircle size={28} />
                    </div>
                    <div>
                      <h3 className="text-3xl font-black text-stone-900 tracking-tight">Help & FAQ</h3>
                      <p className="text-stone-400 font-bold uppercase text-[10px] tracking-[0.2em] mt-1">Frequently asked questions for customers</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <Link to="/support" target="_blank" className="p-4 bg-stone-50 text-stone-400 hover:text-primary rounded-2xl transition-all shadow-sm group">
                      <ExternalLink size={20} className="group-hover:scale-110 transition-transform" />
                    </Link>
                    <button 
                      onClick={() => updateSetting('faq_content', faqContent)}
                      className="bg-primary text-white px-10 py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-primary/80 transition-all shadow-xl shadow-primary/20 active:scale-95 text-xs"
                    >
                      Save FAQ
                    </button>
                  </div>
                </div>
                <div className="quill-editor-container bg-stone-50 rounded-[2.5rem] p-2 border border-stone-100">
                  <ReactQuill 
                    theme="snow"
                    value={faqContent}
                    onChange={setFaqContent}
                    className="bg-white rounded-[2rem] overflow-hidden border-none"
                    modules={{
                      toolbar: [
                        [{ 'header': [1, 2, 3, false] }],
                        ['bold', 'italic', 'underline', 'strike'],
                        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                        ['link', 'clean']
                      ],
                    }}
                  />
                  <p className="text-[10px] text-stone-400 mt-6 font-bold uppercase tracking-widest text-center px-10">Populate the Frequently Asked Questions database to reduce inbound support frequency.</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-stone-100 space-y-10">
               <div className="flex items-center space-x-4">
                <div className="w-14 h-14 bg-stone-900 text-white rounded-2xl flex items-center justify-center rotate-12">
                  <Palette size={28} />
                </div>
                <div>
                  <h3 className="text-3xl font-black text-stone-900 tracking-tight">Store Theme</h3>
                  <p className="text-stone-400 font-bold uppercase text-[10px] tracking-[0.2em] mt-1">Change the look and feel of your store</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
                {[
                  { id: 'theme-navy', name: 'Navy', color: '#0f172a' },
                  { id: 'theme-orange', name: 'Orange', color: '#ea580c' },
                  { id: 'theme-emerald', name: 'Emerald', color: '#059669' },
                  { id: 'theme-indigo', name: 'Indigo', color: '#312e81' },
                  { id: 'theme-slate', name: 'Slate', color: '#334155' },
                  { id: 'theme-amber', name: 'Amber', color: '#d97706' },
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setAdminTheme(t.id)}
                    className={cn(
                      "flex flex-col items-center p-6 rounded-[2rem] border-2 transition-all group relative overflow-hidden",
                      adminTheme === t.id ? "border-primary bg-stone-50 shadow-xl" : "border-stone-100 hover:border-stone-200 bg-white"
                    )}
                  >
                    <div 
                      className="w-12 h-12 rounded-2xl mb-4 shadow-lg group-hover:scale-110 transition-transform" 
                      style={{ backgroundColor: t.color }}
                    />
                    <span className={cn(
                      "text-[10px] font-black uppercase tracking-widest leading-none",
                      adminTheme === t.id ? "text-primary" : "text-stone-400 group-hover:text-stone-900"
                    )}>
                      {t.name}
                    </span>
                    {adminTheme === t.id && (
                      <div className="absolute top-2 right-2 text-primary">
                        <CheckCircle2 size={14} />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-stone-100 space-y-10">
               <div className="flex items-center space-x-4">
                <div className="w-14 h-14 bg-red-600 text-white rounded-2xl flex items-center justify-center -rotate-6">
                  <ShieldAlert size={28} />
                </div>
                <div>
                  <h3 className="text-3xl font-black text-stone-900 tracking-tight">System Safe-Mode</h3>
                  <p className="text-stone-400 font-bold uppercase text-[10px] tracking-[0.2em] mt-1">Maintenance & Global Access Control</p>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-8 bg-stone-50 rounded-[2.5rem] border border-stone-100">
                <div className="flex items-center space-x-6">
                   <div className={cn(
                     "w-12 h-12 rounded-2xl flex items-center justify-center transition-colors shadow-sm",
                     config.find(c => c.key === 'maintenance_mode')?.value === 'true' ? "bg-red-600 text-white" : "bg-white text-stone-300"
                   )}>
                     <Zap size={20} />
                   </div>
                   <div>
                    <p className="font-black text-stone-900 tracking-tight text-lg">Maintenance Mode Active</p>
                    <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mt-1">Restrict all frontend traffic to admin nodes only.</p>
                  </div>
                </div>
                <button 
                  onClick={() => {
                    const current = config.find(c => c.key === 'maintenance_mode')?.value === 'true';
                    updateSetting('maintenance_mode', (!current).toString());
                  }}
                  className={cn(
                    "w-20 h-10 rounded-full transition-all relative p-1 shadow-inner",
                    config.find(c => c.key === 'maintenance_mode')?.value === 'true' ? "bg-red-600" : "bg-stone-200"
                  )}
                >
                  <div className={cn(
                    "w-8 h-8 bg-white rounded-full shadow-lg transition-all",
                    config.find(c => c.key === 'maintenance_mode')?.value === 'true' ? "ml-10" : "ml-0"
                  )} />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div className="flex items-center justify-between px-2">
                    <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Expected Restoration Time</label>
                    <span className="text-[9px] font-bold text-stone-300 italic">User Facing Message</span>
                  </div>
                  <input 
                    type="text" 
                    className="w-full bg-stone-50 border-stone-100 border-2 rounded-[1.5rem] px-8 py-4 text-xl font-black text-stone-900 focus:border-red-500 focus:bg-white outline-none transition-all tracking-tight"
                    placeholder="e.g., 2 Hours"
                    defaultValue={config.find(c => c.key === 'maintenance_time')?.value}
                    onBlur={(e) => updateSetting('maintenance_time', e.target.value)}
                  />
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between px-2">
                    <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Bypass Clearance Secret</label>
                    <span className="text-[9px] font-bold text-stone-300 italic">Dev Overpass</span>
                  </div>
                  <div className="flex space-x-3">
                    <input 
                      type="text" 
                      className="flex-1 bg-stone-50 border-stone-100 border-2 rounded-[1.5rem] px-8 py-4 text-xl font-mono font-black text-stone-900 focus:border-red-500 focus:bg-white outline-none transition-all tracking-tight"
                      defaultValue={config.find(c => c.key === 'maintenance_secret')?.value}
                      onBlur={(e) => updateSetting('maintenance_secret', e.target.value)}
                    />
                    <button 
                      onClick={() => {
                        const secret = config.find(c => c.key === 'maintenance_secret')?.value;
                        if (secret) {
                          navigator.clipboard.writeText(secret);
                          toast.success('Clearance token copied');
                        }
                      }}
                      className="p-5 bg-stone-100 hover:bg-stone-200 rounded-[1.5rem] transition-all group shadow-sm border border-stone-200"
                      title="Copy Secret"
                    >
                      <Copy size={20} className="text-stone-600 group-hover:scale-110 transition-transform" />
                    </button>
                  </div>
                  <p className="px-4 text-[9px] text-stone-400 font-bold uppercase tracking-widest leading-relaxed">
                    Append <span className="text-red-500">?bypass=YOUR_SECRET</span> to the URL to bypass maintenance protocol.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-stone-100 space-y-10">
               <div className="flex items-center space-x-4">
                <div className="w-14 h-14 bg-blue-600 text-white rounded-2xl flex items-center justify-center rotate-6">
                  <Server size={28} />
                </div>
                <div>
                  <h3 className="text-3xl font-black text-stone-900 tracking-tight">API Interface Gateway</h3>
                  <p className="text-stone-400 font-bold uppercase text-[10px] tracking-[0.2em] mt-1">Third-Party Service Integration Cipher</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-4">
                   <div className="flex items-center justify-between px-2">
                    <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest">SMS Gateway Access Key</label>
                    <span className="text-[10px] font-black px-2 py-0.5 bg-blue-50 text-blue-600 rounded">EXTERNAL</span>
                  </div>
                  <input 
                    type="password" 
                    className="w-full bg-stone-50 border-stone-100 border-2 rounded-[1.5rem] px-8 py-4 text-xl font-black text-stone-900 focus:border-blue-500 focus:bg-white outline-none transition-all tracking-widest"
                    placeholder="••••••••••••••••"
                    onBlur={(e) => updateSetting('sms_api_key', e.target.value)}
                  />
                </div>
                
                <div className="space-y-4">
                   <div className="flex items-center justify-between px-2">
                    <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Payment Provider Ledger Secret</label>
                    <span className="text-[10px] font-black px-2 py-0.5 bg-blue-50 text-blue-600 rounded">SECURE</span>
                  </div>
                  <input 
                    type="password" 
                    className="w-full bg-stone-50 border-stone-100 border-2 rounded-[1.5rem] px-8 py-4 text-xl font-black text-stone-900 focus:border-blue-500 focus:bg-white outline-none transition-all tracking-widest"
                    placeholder="••••••••••••••••"
                    onBlur={(e) => updateSetting('payment_secret', e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'Support Tickets' && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <aside className="lg:col-span-1 bg-white rounded-[3rem] shadow-sm border border-stone-100 overflow-hidden flex flex-col h-[800px]">
              <div className="p-8 border-b border-stone-100 flex items-center justify-between">
                <div>
                  <h3 className="font-black text-2xl tracking-tight text-stone-900">Comms Log</h3>
                  <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mt-1">Inbound Ticket Pool</p>
                </div>
                <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center font-black text-xs">
                  {tickets.length}
                </div>
              </div>
              <div className="flex-1 overflow-y-auto no-scrollbar divide-y divide-stone-50">
                {tickets.map((ticket) => (
                  <button 
                    key={ticket.id}
                    onClick={() => {
                      setSelectedTicket(ticket);
                      fetch(`/api/admin/support/tickets/${ticket.id}/messages`)
                        .then(res => res.json())
                        .then(data => setTicketMessages(data));
                    }}
                    className={cn(
                      "w-full p-8 text-left hover:bg-stone-50/80 transition-all duration-300 group relative",
                      selectedTicket?.id === ticket.id && "bg-stone-50"
                    )}
                  >
                    {selectedTicket?.id === ticket.id && (
                      <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-primary animate-in slide-in-from-left duration-300" />
                    )}
                    <div className="flex justify-between items-start mb-4">
                      <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest bg-stone-100 px-2 py-0.5 rounded">#TKT-{ticket.id}</span>
                      <span className={cn(
                        "text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-wider",
                        ticket.status === 'open' ? "bg-amber-50 text-amber-600 border border-amber-100" : "bg-emerald-50 text-emerald-600 border border-emerald-100"
                      )}>
                        {ticket.status}
                      </span>
                    </div>
                    <p className="font-black text-stone-900 text-base mb-1 tracking-tight group-hover:text-primary transition-colors">{ticket.subject}</p>
                    <p className="text-xs text-stone-400 font-medium line-clamp-1">{ticket.user_name} • {ticket.user_phone}</p>
                  </button>
                ))}
                {tickets.length === 0 && (
                  <div className="p-12 text-center text-stone-400 font-bold italic">No active frequency detected.</div>
                )}
              </div>
            </aside>

            <main className="lg:col-span-3 bg-white rounded-[3rem] shadow-sm border border-stone-100 flex flex-col h-[800px] overflow-hidden relative">
              {selectedTicket ? (
                <>
                  <header className="p-8 border-b border-stone-100 flex justify-between items-center bg-white z-10">
                    <div className="flex items-center space-x-5">
                      <div className="w-14 h-14 bg-stone-900 text-white rounded-2xl flex items-center justify-center rotate-3">
                        <MessageSquare size={28} />
                      </div>
                      <div>
                        <h3 className="font-black text-2xl tracking-tight text-stone-900">{selectedTicket.subject}</h3>
                        <p className="text-xs font-bold text-stone-400 mt-1 uppercase tracking-widest">Linked To: <span className="text-stone-900">{selectedTicket.user_name}</span></p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                       <select 
                        className="bg-stone-50 border-stone-100 border-2 rounded-2xl px-6 py-3 text-xs font-black uppercase tracking-widest text-stone-600 focus:border-primary focus:bg-white outline-none transition-all cursor-pointer shadow-sm"
                        value={selectedTicket.status}
                        onChange={async (e) => {
                          await fetch(`/api/admin/support/tickets/${selectedTicket.id}/status`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ status: e.target.value })
                          });
                          toast.success('Protocol state updated');
                          fetchTickets();
                          setSelectedTicket({...selectedTicket, status: e.target.value});
                        }}
                      >
                        <option value="open">Open Portal</option>
                        <option value="in-progress">Executing</option>
                        <option value="resolved">Resolved</option>
                        <option value="closed">Decommissioned</option>
                      </select>
                    </div>
                  </header>
                  
                  <div className="flex-1 p-10 overflow-y-auto no-scrollbar space-y-8 bg-stone-50/30">
                    <div className="flex items-start space-x-4 max-w-[85%] group">
                      <div className="w-10 h-10 rounded-xl bg-stone-100 flex items-center justify-center shrink-0 text-stone-400 mt-1 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                        <Users size={18} />
                      </div>
                      <div className="bg-white p-6 rounded-[2rem] rounded-tl-none shadow-sm border border-stone-100">
                        <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-3 border-b border-stone-50 pb-2">{selectedTicket.user_name} • {new Date(selectedTicket.created_at).toLocaleString()}</p>
                        <p className="text-sm font-medium text-stone-700 leading-relaxed">{selectedTicket.message}</p>
                      </div>
                    </div>

                    {ticketMessages.map((msg, i) => (
                      <motion.div 
                        key={i} 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={cn(
                          "flex items-start space-x-4 max-w-[85%]",
                          msg.user_id === user.id ? "ml-auto flex-row-reverse space-x-reverse" : ""
                        )}
                      >
                        <div className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-1 shadow-sm",
                          msg.user_id === user.id ? "bg-stone-900 text-white" : "bg-white border border-stone-100 text-stone-400"
                        )}>
                          {msg.user_id === user.id ? <ShieldCheck size={18} /> : <Users size={18} />}
                        </div>
                        <div className={cn(
                          "p-6 rounded-[2rem] shadow-sm border transition-all",
                          msg.user_id === user.id 
                            ? "bg-primary text-white border-primary rounded-tr-none shadow-xl shadow-primary/10" 
                            : "bg-white text-stone-700 border-stone-100 rounded-tl-none"
                        )}>
                          <p className={cn("text-[10px] font-black mb-3 uppercase tracking-widest border-b pb-2", msg.user_id === user.id ? "text-white/40 border-white/10" : "text-stone-300 border-stone-50")}>
                            {msg.user_id === user.id ? 'System Administrator' : selectedTicket.user_name} • {new Date(msg.created_at).toLocaleString()}
                          </p>
                          <p className="text-sm font-medium leading-relaxed">{msg.message}</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  <div className="p-10 border-t border-stone-100 bg-white">
                    <div className="flex space-x-4 bg-stone-50 p-2 rounded-[2.5rem] border border-stone-100 focus-within:bg-white focus-within:border-primary/30 focus-within:shadow-2xl focus-within:shadow-primary/5 transition-all duration-500">
                      <input 
                        type="text" 
                        placeholder="Inscribe dispatch response..."
                        className="flex-1 bg-transparent border-none rounded-3xl px-8 py-5 text-sm font-black uppercase tracking-wider placeholder:text-stone-300 outline-none"
                        value={replyMessage}
                        onChange={(e) => setReplyMessage(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && replyMessage) {
                            // Trigger send logic
                          }
                        }}
                      />
                      <button 
                        onClick={async () => {
                          if (!replyMessage) return;
                          await fetch(`/api/admin/support/tickets/${selectedTicket.id}/messages`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ user_id: user.id, message: replyMessage })
                          });
                          setReplyMessage('');
                          fetch(`/api/admin/support/tickets/${selectedTicket.id}/messages`)
                            .then(res => res.json())
                            .then(data => setTicketMessages(data));
                        }}
                        className="bg-stone-900 hover:bg-primary text-white px-12 py-5 rounded-[2rem] font-black uppercase tracking-widest transition-all shadow-xl shadow-stone-900/20 active:scale-95 group flex items-center space-x-3"
                      >
                        <span>Dispatch</span>
                        <Send size={18} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-stone-400 space-y-8 bg-stone-50/20">
                  <div className="relative">
                    <div className="absolute inset-0 bg-primary/10 blur-3xl rounded-full" />
                    <div className="relative p-12 bg-white rounded-[3rem] shadow-xl border border-stone-100 animate-bounce duration-[3000ms]">
                      <MessageSquare size={64} className="text-stone-200" />
                    </div>
                  </div>
                  <div className="text-center space-y-2">
                    <h4 className="text-2xl font-black text-stone-900 tracking-tight">Silent Frequencies</h4>
                    <p className="font-bold text-stone-400 uppercase tracking-widest text-[10px]">Select a communication node to begin intercept.</p>
                  </div>
                </div>
              )}
            </main>
          </div>
        )}

        {activeTab === 'Newsletter' && (
          <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
             <header className="flex flex-col md:flex-row md:items-end justify-between gap-8">
              <div>
                <h2 className="text-4xl font-black text-stone-900 tracking-tight">Publicity Ledger</h2>
                <p className="text-stone-500 mt-2 text-lg font-medium">Broadcast reach and subscriber acquisition metrics.</p>
              </div>
              <button 
                onClick={sendNewsletterCampaign}
                className="group flex items-center space-x-3 bg-stone-900 text-white px-10 py-5 rounded-[2rem] text-sm font-black uppercase tracking-widest hover:bg-stone-800 transition-all shadow-2xl shadow-stone-900/30 hover:scale-105 active:scale-95"
              >
                <div className="p-1 bg-white/20 rounded-lg group-hover:-rotate-12 transition-transform duration-500">
                  <Send size={20} />
                </div>
                <span>Deploy Campaign</span>
              </button>
            </header>

            <div className="bg-white rounded-[2.5rem] shadow-sm border border-stone-100 overflow-hidden">
              <div className="overflow-x-auto no-scrollbar">
                <table className="w-full text-left">
                  <thead className="bg-stone-50/50 text-stone-400 text-[10px] uppercase font-black tracking-[0.2em]">
                    <tr>
                      <th className="px-10 py-8">Email Endpoint</th>
                      <th className="px-6 py-8">Account Integrity</th>
                      <th className="px-6 py-8">Acquisition Date</th>
                      <th className="px-10 py-8 text-right">Termination</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-50">
                    {newsletter.map((sub, idx) => (
                      <motion.tr 
                        key={sub.id} 
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.03 }}
                        className="hover:bg-stone-50/80 transition-all group"
                      >
                        <td className="px-10 py-6">
                          <div className="flex items-center space-x-4">
                            <div className="w-10 h-10 bg-stone-100 rounded-xl flex items-center justify-center text-stone-400 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                              <Mail size={18} />
                            </div>
                            <span className="text-sm font-black text-stone-900">{sub.email}</span>
                          </div>
                        </td>
                        <td className="px-6 py-6 transition-all">
                          {sub.user_id ? (
                            <div className="flex items-center space-x-2">
                               <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                               <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Registered User Pool</span>
                            </div>
                          ) : (
                            <div className="flex items-center space-x-2 opacity-50">
                               <div className="w-2 h-2 bg-stone-400 rounded-full" />
                               <span className="text-[10px] font-black uppercase tracking-widest text-stone-500">External Prospect</span>
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-6 text-sm text-stone-400 font-medium">
                          {new Date(sub.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </td>
                        <td className="px-10 py-6 text-right">
                          <button className="p-3 bg-stone-50 hover:bg-red-50 hover:text-red-500 rounded-2xl transition-all opacity-0 group-hover:opacity-100">
                            <Trash2 size={18} />
                          </button>
                        </td>
                      </motion.tr>
                    ))}
                    {newsletter.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-10 py-32 text-center text-stone-400 italic">No publicity endpoints registered.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'Expenses' && (
          <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-8">
              <div>
                <h2 className="text-4xl font-black text-stone-900 tracking-tight">Deficit Ledger</h2>
                <p className="text-stone-500 mt-2 text-lg font-medium">Operational expenditure and fiscal leakage auditing.</p>
              </div>
              <button 
                onClick={() => setExpenseModal({ open: true })}
                className="group flex items-center space-x-3 bg-stone-900 text-white px-10 py-5 rounded-[2rem] text-sm font-black uppercase tracking-widest hover:bg-stone-800 transition-all shadow-2xl shadow-stone-900/30 hover:scale-105 active:scale-95"
              >
                <div className="p-1 bg-white/20 rounded-lg group-hover:scale-110 transition-transform duration-500">
                  <Plus size={20} />
                </div>
                <span>Log Expenditure</span>
              </button>
            </header>

            <div className="bg-white rounded-[2.5rem] shadow-sm border border-stone-100 overflow-hidden">
               <div className="overflow-x-auto no-scrollbar">
                <table className="w-full text-left">
                  <thead className="bg-stone-50/50 text-stone-400 text-[10px] uppercase font-black tracking-[0.2em]">
                    <tr>
                      <th className="px-10 py-8">Intercept Description</th>
                      <th className="px-6 py-8">Taxonomy Category</th>
                      <th className="px-6 py-8">Deficit Amount</th>
                      <th className="px-6 py-8">Calendar Index</th>
                      <th className="px-10 py-8 text-right">Operational Clearance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-50">
                    {expenses.map((expense, idx) => (
                      <motion.tr 
                        key={expense.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.03 }}
                        className="hover:bg-stone-50/80 transition-all group"
                      >
                        <td className="px-10 py-6">
                           <div className="flex items-center space-x-4">
                             <div className="w-10 h-10 bg-red-50 text-red-500 rounded-xl flex items-center justify-center shrink-0">
                               <TrendingDown size={18} />
                             </div>
                             <span className="text-sm font-black text-stone-900 group-hover:text-red-600 transition-colors">{expense.description}</span>
                           </div>
                        </td>
                        <td className="px-6 py-6">
                          <span className="text-[10px] font-black px-4 py-1.5 bg-stone-100 rounded-full uppercase tracking-widest text-stone-500">{expense.category}</span>
                        </td>
                        <td className="px-6 py-6 font-black text-red-600 text-lg tracking-tighter shadow-red-500/10">₹{expense.amount}</td>
                        <td className="px-6 py-6 text-sm text-stone-400 font-medium">
                          {new Date(expense.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </td>
                        <td className="px-10 py-6 text-right">
                          <button 
                            onClick={() => deleteExpense(expense.id)}
                            className="p-3 bg-stone-50 hover:bg-red-50 hover:text-red-500 rounded-2xl transition-all opacity-0 group-hover:opacity-100"
                          >
                            <Trash2 size={18} />
                          </button>
                        </td>
                      </motion.tr>
                    ))}
                    {expenses.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-10 py-32 text-center">
                           <div className="flex flex-col items-center space-y-4">
                            <div className="p-6 bg-stone-50 rounded-full text-stone-200">
                              <ShieldCheck size={48} />
                            </div>
                            <p className="text-stone-400 font-bold italic">Zero deficit protocols confirmed. Profit focus optimized.</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'Coupons' && (
          <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-8">
              <div>
                <h2 className="text-4xl font-black text-stone-900 tracking-tight">Coupons</h2>
                <p className="text-stone-500 mt-2 text-lg font-medium">Create and manage discount coupons for your store.</p>
              </div>
              <button 
                onClick={() => {
                  setCouponModal({ open: true, mode: 'add' });
                  setNewCoupon({ code: '', type: 'flat', value: '', min_order: '', usage_limit: '', limit_per_user: '1' });
                }}
                className="group flex items-center space-x-3 bg-stone-900 text-white px-10 py-5 rounded-[2rem] text-sm font-black uppercase tracking-widest hover:bg-stone-800 transition-all shadow-2xl shadow-stone-900/30 hover:scale-105 active:scale-95"
              >
                <div className="p-1 bg-white/20 rounded-lg group-hover:rotate-12 transition-transform duration-500">
                  <Plus size={20} />
                </div>
                <span>Create Coupon</span>
              </button>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {coupons.map((coupon, idx) => (
                <motion.div 
                  key={coupon.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className={cn(
                    "group bg-white rounded-[2.5rem] shadow-sm border-2 transition-all duration-500 relative overflow-hidden",
                    coupon.active ? "border-stone-100 hover:border-primary/30" : "border-stone-50 opacity-60 grayscale"
                  )}
                >
                  <div className="p-8">
                    <div className="flex justify-between items-start mb-8">
                      <div className={cn(
                        "w-16 h-16 rounded-3xl flex items-center justify-center transition-all duration-500 group-hover:scale-110 shadow-lg",
                        coupon.active ? "bg-primary/10 text-primary" : "bg-stone-50 text-stone-300"
                      )}>
                        <Tag size={32} />
                      </div>
                      
              <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                         <button 
                          onClick={() => {
                            setCouponModal({ open: true, mode: 'edit', editingId: coupon.id });
                            setNewCoupon({
                              code: coupon.code,
                              type: coupon.type,
                              value: coupon.value.toString(),
                              min_order: coupon.min_order.toString(),
                              usage_limit: coupon.usage_limit ? coupon.usage_limit.toString() : '',
                              limit_per_user: coupon.limit_per_user ? coupon.limit_per_user.toString() : '1'
                            });
                          }}
                          className="p-3 bg-stone-50 hover:bg-stone-200 text-stone-600 rounded-2xl transition-all"
                        >
                          <Pencil size={18} />
                        </button>
                         <button 
                          onClick={() => toggleCouponStatus(coupon.id)}
                          className="p-3 bg-stone-50 hover:bg-emerald-50 hover:text-emerald-500 rounded-2xl transition-all"
                        >
                          <RefreshCw size={18} />
                        </button>
                        <button 
                          onClick={() => deleteCoupon(coupon.id)}
                          className="p-3 bg-stone-50 hover:bg-red-50 hover:text-red-500 rounded-2xl transition-all"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div>
                        <p className="text-[10px] font-black text-stone-400 uppercase tracking-[0.25em] mb-1">Coupon Code</p>
                        <h3 className="text-2xl font-black text-stone-900 group-hover:text-primary transition-colors tracking-tighter">{coupon.code}</h3>
                      </div>

                      <div className="flex items-end justify-between bg-stone-50 p-6 rounded-[2rem] border border-stone-100">
                        <div>
                          <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest leading-none mb-1">Discount Value</p>
                          <p className="text-4xl font-black text-primary tracking-tighter">
                            {coupon.type === 'flat' ? `₹${coupon.value}` : `${coupon.value}%`}
                          </p>
                        </div>
                        <div className={cn(
                          "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest",
                          coupon.active ? "bg-emerald-100 text-emerald-700" : "bg-stone-200 text-stone-500"
                        )}>
                          {coupon.active ? 'Active' : 'Disabled'}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-6 pt-2">
                        <div>
                          <p className="text-[9px] font-black text-stone-400 uppercase tracking-widest mb-1">Usage Limit</p>
                          <p className="text-sm font-black text-stone-900">{coupon.usage_limit || 'UNLIMITED'}</p>
                          <p className="text-[8px] font-bold text-stone-400 uppercase mt-0.5">Used: {coupon.usage_count || 0}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[9px] font-black text-stone-400 uppercase tracking-widest mb-1">Min Order</p>
                          <p className="text-sm font-black text-stone-900">₹{coupon.min_order}</p>
                          <p className="text-[8px] font-bold text-stone-400 uppercase mt-0.5">Limit Per User: {coupon.limit_per_user || 1}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className={cn(
                    "h-2 w-full transition-colors duration-500",
                    coupon.active ? "bg-primary" : "bg-stone-200"
                  )} />
                </motion.div>
              ))}
              
              <motion.button
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                onClick={() => {
                  setCouponModal({ open: true, mode: 'add' });
                  setNewCoupon({ code: '', type: 'flat', value: '', min_order: '', usage_limit: '', limit_per_user: '1' });
                }}
                className="group border-4 border-dashed border-stone-100 rounded-[2.5rem] p-8 flex flex-col items-center justify-center space-y-6 hover:border-primary/20 hover:bg-primary/5 transition-all duration-500 min-h-[300px]"
              >
                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center text-stone-200 group-hover:text-primary group-hover:scale-110 group-hover:rotate-12 transition-all duration-500 shadow-sm">
                  <Plus size={40} />
                </div>
                <div className="text-center">
                  <p className="text-base font-black text-stone-400 group-hover:text-primary tracking-tight transition-colors">Create New Coupon</p>
                  <p className="text-[10px] font-bold text-stone-300 uppercase tracking-widest mt-1">Add a new coupon code</p>
                </div>
              </motion.button>
            </div>
          </div>
        )}

        {activeTab === 'Bulk Discounts' && (
          <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-8">
              <div>
                <h2 className="text-4xl font-black text-stone-900 tracking-tight">Tiered Pricing Engine</h2>
                <p className="text-stone-500 mt-2 text-lg font-medium">B2B algorithmic discounts and bulk procurement logic.</p>
              </div>
              <button 
                onClick={() => {
                  setBulkDiscountModal({ open: true, mode: 'add', discount: null });
                  setNewBulkDiscount({ 
                    entity_type: 'product', 
                    entity_id: '', 
                    min_qty: '5', 
                    discount_type: 'percentage', 
                    discount_value: '10',
                    active: true
                  });
                }}
                className="group flex items-center space-x-3 bg-stone-900 text-white px-10 py-5 rounded-[2rem] text-sm font-black uppercase tracking-widest hover:bg-stone-800 transition-all shadow-2xl shadow-stone-900/30 hover:scale-105 active:scale-95"
              >
                <div className="p-1 bg-white/20 rounded-lg group-hover:scale-110 transition-transform duration-500">
                  <Plus size={20} />
                </div>
                <span>Provision Rule</span>
              </button>
            </header>

            <div className="bg-white rounded-[2.5rem] shadow-sm border border-stone-100 overflow-hidden">
               <div className="overflow-x-auto no-scrollbar">
                <table className="w-full text-left">
                  <thead className="bg-stone-50/50 text-stone-400 text-[10px] uppercase font-black tracking-[0.2em]">
                    <tr>
                      <th className="px-10 py-8">Target Entity</th>
                      <th className="px-6 py-8">Trigger Quantity</th>
                      <th className="px-6 py-8">Algorithmic Discount</th>
                      <th className="px-6 py-8">Operational State</th>
                      <th className="px-10 py-8 text-right">Clearance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-50">
                    {bulkDiscounts.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-10 py-32 text-center">
                          <div className="flex flex-col items-center space-y-4">
                            <div className="p-6 bg-stone-50 rounded-full text-stone-200">
                              <Zap size={48} />
                            </div>
                            <p className="text-stone-400 font-bold italic">No tiered pricing protocols active. Deploy a rule to begin scaling.</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      bulkDiscounts.map((discount, idx) => (
                        <motion.tr 
                          key={discount.id} 
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          className="hover:bg-stone-50/80 transition-all group"
                        >
                          <td className="px-10 py-6">
                            <div className="flex items-center space-x-3">
                              <span className={cn(
                                "text-[9px] font-black px-3 py-1 rounded-lg uppercase tracking-widest",
                                discount.entity_type === 'product' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'
                              )}>
                                {discount.entity_type === 'product' ? 'SKU' : 'DOMAIN'}
                              </span>
                              <span className="font-black text-stone-900 group-hover:text-primary transition-colors">{discount.entity_name}</span>
                            </div>
                          </td>
                          <td className="px-6 py-6 font-black text-stone-900 tracking-tight text-lg">{discount.min_qty}<span className="text-stone-300 ml-1 text-sm">units+</span></td>
                          <td className="px-6 py-6 transition-all">
                            <span className="font-black text-emerald-600 text-lg tracking-tighter bg-emerald-50 px-4 py-2 rounded-2xl">
                              {discount.discount_type === 'percentage' ? `${discount.discount_value}% Off` : `₹${discount.discount_value} Off`}
                            </span>
                          </td>
                          <td className="px-6 py-6">
                            <button 
                              onClick={() => handleToggleBulkDiscount(discount)}
                              className={cn(
                                "w-14 h-7 rounded-full transition-all duration-500 relative",
                                discount.active ? 'bg-primary' : 'bg-stone-200'
                              )}
                            >
                              <div className={cn(
                                "absolute top-1 w-5 h-5 bg-white rounded-full shadow-sm transition-all duration-500",
                                discount.active ? 'translate-x-[28px]' : 'translate-x-1'
                              )} />
                            </button>
                          </td>
                          <td className="px-10 py-6 text-right space-x-2">
                            <button 
                              onClick={() => {
                                setBulkDiscountModal({ open: true, mode: 'edit', discount });
                                setNewBulkDiscount({
                                  entity_type: discount.entity_type,
                                  entity_id: discount.entity_id.toString(),
                                  min_qty: discount.min_qty.toString(),
                                  discount_type: discount.discount_type,
                                  discount_value: discount.discount_value.toString(),
                                  active: discount.active === 1
                                });
                              }}
                              className="p-3 bg-stone-100 hover:bg-white hover:shadow-xl hover:shadow-stone-200/50 hover:text-primary rounded-2xl transition-all border border-transparent"
                            >
                              <Settings size={18} />
                            </button>
                            <button 
                              onClick={() => handleDeleteBulkDiscount(discount.id)}
                              className="p-3 bg-stone-100 hover:bg-white hover:shadow-xl hover:shadow-red-200/50 hover:text-red-500 rounded-2xl transition-all border border-transparent"
                            >
                              <Trash2 size={18} />
                            </button>
                          </td>
                        </motion.tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Returns Tab */}
        {activeTab === 'Returns' && (
          <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-8">
              <div>
                <h2 className="text-4xl font-black text-stone-900 tracking-tight">Resolution Depot</h2>
                <p className="text-stone-500 mt-2 text-lg font-medium">Verify grievances, inspect liabilities, and restore customer favor.</p>
              </div>
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-stone-100 flex items-center space-x-8">
                 <div className="flex flex-col">
                   <span className="text-[10px] uppercase font-black text-stone-400 tracking-widest leading-none mb-1">Liability Pool</span>
                   <span className="text-2xl font-black text-red-500">{returns.length} Pending</span>
                 </div>
                 <div className="w-px h-10 bg-stone-100" />
                 <div className="flex flex-col">
                   <span className="text-[10px] uppercase font-black text-stone-400 tracking-widest leading-none mb-1">Health Score</span>
                   <span className="text-2xl font-black text-emerald-500">99.2%</span>
                 </div>
              </div>
            </header>

            <div className="bg-white rounded-[3rem] shadow-sm border border-stone-100 overflow-hidden">
               <div className="overflow-x-auto no-scrollbar">
                <table className="w-full text-left">
                  <thead className="bg-stone-50/50 text-stone-400 text-[10px] uppercase font-black tracking-[0.25em]">
                    <tr>
                      <th className="px-10 py-8">Origin Order</th>
                      <th className="px-6 py-8">Claimant Node</th>
                      <th className="px-6 py-8">Faulty SKU</th>
                      <th className="px-6 py-8">Reason Cipher</th>
                      <th className="px-6 py-8">Protocol State</th>
                      <th className="px-10 py-8 text-right">Intervention</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-50">
                    {returns.map((ret, idx) => (
                      <motion.tr 
                        key={ret.id} 
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.04 }}
                        className="hover:bg-stone-50/80 transition-all group"
                      >
                        <td className="px-10 py-6 font-black text-stone-900 tracking-tighter">ORD-{ret.order_num}</td>
                        <td className="px-6 py-6 font-bold text-stone-600 text-xs uppercase tracking-widest">{ret.user_name}</td>
                        <td className="px-6 py-6">
                           <div className="flex flex-col">
                             <span className="text-sm font-black text-stone-900">{ret.product_name}</span>
                             <span className="text-[10px] font-black text-primary uppercase mt-1 tracking-widest">Quantity: {ret.quantity} units</span>
                           </div>
                        </td>
                        <td className="px-6 py-6 italic text-stone-400 font-medium text-xs max-w-[200px] truncate">{ret.reason}</td>
                        <td className="px-6 py-6">
                          <span className={cn(
                            "px-4 py-1.5 rounded-2xl text-[9px] font-black uppercase tracking-widest border",
                            ret.status === 'pending' ? "bg-amber-50 text-amber-600 border-amber-100 active:animate-pulse" :
                            ret.status === 'approved' ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                            "bg-red-50 text-red-600 border-red-100"
                          )}>
                            {ret.status}
                          </span>
                        </td>
                        <td className="px-10 py-6 text-right">
                          {ret.status === 'pending' ? (
                            <div className="flex justify-end space-x-3">
                              <button 
                                onClick={() => handleApproveReturn(ret)}
                                className="p-4 bg-emerald-600 text-white rounded-2xl hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-500/20 active:scale-95"
                                title="Authorize Refund"
                              >
                                <Check size={18} />
                              </button>
                              <button 
                                onClick={() => handleRejectReturn(ret.id)}
                                className="p-4 bg-red-600 text-white rounded-2xl hover:bg-red-700 transition-all shadow-xl shadow-red-500/20 active:scale-95"
                                title="Decline Claim"
                              >
                                <X size={18} />
                              </button>
                            </div>
                          ) : (
                            <div className="flex justify-end items-center space-x-2 text-stone-300">
                               <ShieldCheck size={16} />
                               <span className="text-[10px] font-black uppercase tracking-widest">Settled</span>
                            </div>
                          )}
                        </td>
                      </motion.tr>
                    ))}
                    {returns.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-10 py-32 text-center text-stone-400 font-bold italic bg-stone-50/50 rounded-[2.5rem]">No pending returns or refunds.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'Feature Toggles' && (
          <FeatureToggles config={config} onUpdate={fetchConfig} />
        )}

        {/* Supply Chain Hub (Suppliers) */}
        {activeTab === 'Suppliers' && (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-8"
          >
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div className="space-y-1">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary rotate-3">
                    <Briefcase size={24} />
                  </div>
                  <h2 className="text-4xl font-black text-stone-900 tracking-tight">Supply Chain Hub</h2>
                </div>
                <p className="text-stone-500 font-medium text-lg ml-1">Coordinate with global and local trade partners.</p>
              </div>
              
              <button 
                onClick={() => {
                  setSupplierModal({ open: true, mode: 'add', supplier: null });
                  setNewSupplier({ name: '', contact_person: '', email: '', phone: '', address: '' });
                }}
                className="bg-primary text-white px-8 py-4 rounded-2xl font-black flex items-center space-x-3 shadow-xl shadow-primary/20 hover:bg-primary/90 transition-all active:scale-95 whitespace-nowrap group"
              >
                <Plus size={20} className="group-hover:rotate-90 transition-transform duration-300" />
                <span>Onboard Supplier</span>
              </button>
            </div>
            
            <div className="bg-white rounded-[2.5rem] shadow-sm border border-stone-100 overflow-hidden">
              <div className="overflow-x-auto no-scrollbar">
                <table className="w-full text-left">
                  <thead className="bg-stone-50/50 text-stone-400 text-[10px] uppercase font-black tracking-widest">
                    <tr>
                      <th className="px-8 py-6">Partner Identity</th>
                      <th className="px-6 py-6">Key Liaison</th>
                      <th className="px-6 py-6">Communication Channels</th>
                      <th className="px-6 py-6">Location</th>
                      <th className="px-6 py-6">Partnership Since</th>
                      <th className="px-8 py-6 text-right">Governance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100/50">
                    {suppliers.map((supplier, idx) => (
                      <motion.tr 
                        key={supplier.id} 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="hover:bg-stone-50/50 transition-all duration-300 group"
                      >
                        <td className="px-8 py-6">
                           <div className="flex items-center space-x-3">
                             <div className="w-10 h-10 bg-stone-100 rounded-xl flex items-center justify-center text-stone-400 font-black group-hover:bg-primary group-hover:text-white transition-all transform group-hover:rotate-6">
                               {supplier.name?.[0] || 'S'}
                             </div>
                             <span className="font-black text-sm text-stone-900 tracking-tight">{supplier.name}</span>
                           </div>
                        </td>
                        <td className="px-6 py-6">
                          <span className="text-sm font-bold text-stone-700">{supplier.contact_person}</span>
                        </td>
                        <td className="px-6 py-6">
                          <div className="flex flex-col space-y-0.5">
                            <div className="flex items-center space-x-2 text-xs font-bold text-stone-500">
                              <Mail size={12} className="text-stone-300" />
                              <span>{supplier.email || 'N/A'}</span>
                            </div>
                            <div className="flex items-center space-x-2 text-xs font-bold text-stone-500">
                              <Phone size={12} className="text-stone-300" />
                              <span>{supplier.phone || 'N/A'}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-6">
                          <div className="flex items-center gap-2 max-w-[200px]">
                            <div className="min-w-fit"><Truck size={14} className="text-stone-300" /></div>
                            <span className="text-xs font-medium text-stone-500 truncate" title={supplier.address}>{supplier.address}</span>
                          </div>
                        </td>
                        <td className="px-6 py-6 font-mono text-[10px] text-stone-400 uppercase font-black tracking-widest">
                          {new Date(supplier.created_at).toLocaleDateString('en-IN', { month: 'short', year: 'numeric', day: 'numeric' })}
                        </td>
                        <td className="px-8 py-6 text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <motion.button 
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => {
                                setSupplierModal({ open: true, mode: 'edit', supplier });
                                setNewSupplier({
                                  name: supplier.name,
                                  contact_person: supplier.contact_person,
                                  email: supplier.email,
                                  phone: supplier.phone,
                                  address: supplier.address
                                });
                              }}
                              className="p-2.5 bg-stone-50 text-stone-400 hover:text-primary hover:bg-white hover:shadow-md border border-transparent rounded-xl transition-all"
                            >
                              <Settings size={18} />
                            </motion.button>
                            <motion.button 
                              whileHover={{ scale: 1.1, color: '#ef4444' }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => handleDeleteSupplier(supplier.id)}
                              className="p-2.5 bg-stone-50 text-stone-400 hover:bg-red-50 hover:shadow-md border border-transparent rounded-xl transition-all"
                            >
                              <Trash2 size={18} />
                            </motion.button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                    {suppliers.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-8 py-20 text-center">
                          <div className="w-20 h-20 bg-stone-50 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Briefcase size={40} className="text-stone-200" />
                          </div>
                          <p className="text-stone-400 font-black uppercase tracking-widest text-xs">No active trade partners</p>
                          <p className="text-[10px] text-stone-400 font-medium mt-1">Start by onboarding your first supplier.</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'Reviews' && (
          <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-8">
              <div className="space-y-1">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary rotate-6">
                    <Star size={24} fill="currentColor" />
                  </div>
                  <h2 className="text-4xl font-black text-stone-900 tracking-tight">Customer Reviews</h2>
                </div>
                <p className="text-stone-500 font-medium text-lg ml-1">Moderate customer feedback and review ratings.</p>
              </div>
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-stone-100 flex items-center space-x-8">
                 <div className="flex flex-col">
                   <span className="text-[10px] uppercase font-black text-stone-400 tracking-widest leading-none mb-1">Total Reviews</span>
                   <span className="text-2xl font-black text-stone-900">{reviews.length} Total</span>
                 </div>
                 <div className="w-px h-10 bg-stone-100" />
                 <div className="flex flex-col">
                   <span className="text-[10px] uppercase font-black text-stone-400 tracking-widest leading-none mb-1">Average Rating</span>
                   <span className="text-2xl font-black text-primary">{(reviews.reduce((acc, r) => acc + r.rating, 0) / (reviews.length || 1)).toFixed(1)} / 5.0</span>
                 </div>
              </div>
            </header>

            <div className="bg-white rounded-[3rem] shadow-sm border border-stone-100 overflow-hidden">
              <div className="overflow-x-auto no-scrollbar">
                <table className="w-full text-left">
                  <thead className="bg-stone-50/50 text-stone-400 text-[10px] uppercase font-black tracking-[0.25em]">
                    <tr>
                      <th className="px-10 py-8">Product</th>
                      <th className="px-6 py-8">Customer</th>
                      <th className="px-6 py-8">Rating</th>
                      <th className="px-6 py-8">Comment</th>
                      <th className="px-6 py-8">Status</th>
                      <th className="px-6 py-8">Date</th>
                      <th className="px-10 py-8 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-50">
                    {reviews.map((review, idx) => (
                      <motion.tr 
                        key={review.id} 
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.04 }}
                        className="group hover:bg-stone-50/80 transition-all"
                      >
                        <td className="px-10 py-6">
                          <p className="font-black text-stone-900 tracking-tighter truncate max-w-[180px]" title={review.product_name}>{review.product_name}</p>
                        </td>
                        <td className="px-6 py-6">
                          <p className="text-xs font-bold text-stone-600 uppercase tracking-widest">{review.user_name}</p>
                        </td>
                        <td className="px-6 py-6">
                          <div className="flex space-x-0.5 text-amber-400">
                            {[...Array(5)].map((_, i) => (
                              <Star key={i} size={14} fill={i < review.rating ? "currentColor" : "none"} className={i < review.rating ? "drop-shadow-[0_0_8px_rgba(251,191,36,0.3)]" : ""} />
                            ))}
                          </div>
                        </td>
                        <td className="px-6 py-6">
                          <div className="max-w-[280px]">
                            <p className="text-sm text-stone-600 italic font-medium leading-relaxed mb-1 line-clamp-2" title={review.comment}>"{review.comment}"</p>
                            {review.response && (
                              <div className="flex items-center space-x-2 text-[10px] text-primary font-black uppercase tracking-widest bg-primary/5 px-2 py-1 rounded-lg border border-primary/10 w-fit">
                                <MessageSquare size={10} />
                                <span>Response Logged</span>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-6">
                          <span className={cn(
                              "text-[9px] font-black px-3 py-1.5 rounded-2xl uppercase tracking-widest border",
                              review.status === 'approved' ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                              review.status === 'rejected' ? "bg-red-50 text-red-600 border-red-100" :
                              "bg-amber-50 text-amber-600 border-amber-100 animate-pulse"
                          )}>{review.status}</span>
                        </td>
                        <td className="px-6 py-6 whitespace-nowrap">
                           <div className="flex flex-col">
                             <span className="text-xs font-black text-stone-800 tracking-tight">{new Date(review.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                             <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest mt-0.5">{new Date(review.created_at).getFullYear()}</span>
                           </div>
                        </td>
                        <td className="px-10 py-6 text-right">
                          <div className="flex items-center justify-end space-x-3">
                            {review.status === 'pending' && (
                              <div className="flex space-x-2 mr-2">
                                <button 
                                  onClick={() => updateReviewStatus(review.id, 'approved')} 
                                  className="p-3 bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white rounded-xl transition-all shadow-sm border border-emerald-100"
                                  title="Approve"
                                >
                                  <Check size={16} />
                                </button>
                                <button 
                                  onClick={() => updateReviewStatus(review.id, 'rejected')} 
                                  className="p-3 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white rounded-xl transition-all shadow-sm border border-red-100"
                                  title="Reject"
                                >
                                  <X size={16} />
                                </button>
                              </div>
                            )}
                            <button 
                              onClick={() => {
                                setReviewResponseModal({ open: true, review });
                                setReviewResponse(review.response || '');
                              }}
                              className="p-3 bg-stone-50 text-stone-400 hover:text-primary hover:bg-white hover:shadow-md rounded-xl transition-all border border-transparent hover:border-stone-100"
                              title={review.response ? 'Edit Response' : 'Reply'}
                            >
                              <MessageCircle size={18} />
                            </button>
                            <button 
                              onClick={() => deleteReview(review.id)}
                              className="p-3 bg-stone-50 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all border border-transparent"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                    {reviews.length === 0 && (
                      <tr>
                        <td colSpan={7} className="px-10 py-32 text-center text-stone-400 font-bold italic bg-stone-50/50 rounded-[3rem]">No customer reviews found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'Suspicious Activities' && (
          <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
             <header className="flex flex-col md:flex-row md:items-end justify-between gap-8">
              <div className="space-y-1">
                <div className="flex items-center space-x-3">
                  <div className="w-14 h-14 bg-red-600 text-white rounded-2xl flex items-center justify-center -rotate-6 shadow-xl shadow-red-200">
                    <ShieldAlert size={28} />
                  </div>
                  <h2 className="text-4xl font-black text-stone-900 tracking-tight">Security Monitoring</h2>
                </div>
                <p className="text-stone-500 font-medium text-lg ml-1">Track unusual activities and security events.</p>
              </div>
              <button 
                onClick={fetchSuspiciousActivities}
                className="bg-white p-6 rounded-3xl shadow-sm border border-stone-100 text-stone-400 hover:text-primary transition-all group active:scale-95"
              >
                <RefreshCw size={24} className="group-hover:rotate-180 transition-transform duration-500" />
              </button>
            </header>

            <div className="bg-white rounded-[3rem] shadow-sm border border-stone-100 overflow-hidden">
              <div className="overflow-x-auto no-scrollbar">
                <table className="w-full text-left">
                  <thead className="bg-stone-50/50 text-stone-400 text-[10px] uppercase font-black tracking-[0.25em]">
                    <tr>
                      <th className="px-10 py-8">Activity Type</th>
                      <th className="px-6 py-8">User</th>
                      <th className="px-6 py-8">Details</th>
                      <th className="px-6 py-8">Risk</th>
                      <th className="px-6 py-8">Time</th>
                      <th className="px-10 py-8 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-50">
                    {suspiciousActivities.map((activity, idx) => (
                      <motion.tr 
                        key={activity.id} 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.04 }}
                        className="hover:bg-red-50/20 transition-all group"
                      >
                        <td className="px-10 py-6">
                          <span className="text-[10px] font-black px-3 py-1.5 bg-stone-100 group-hover:bg-white text-stone-500 rounded-xl uppercase tracking-widest border border-stone-100 group-hover:border-stone-200 transition-colors">{activity.type}</span>
                        </td>
                        <td className="px-6 py-6">
                          {activity.user_id ? (
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 bg-stone-100 rounded-xl flex items-center justify-center text-stone-400 font-black">
                                {activity.user_name?.[0] || 'U'}
                              </div>
                              <div>
                                <p className="font-black text-sm text-stone-900 tracking-tight">{activity.user_name}</p>
                                <p className="text-[10px] text-stone-400 font-bold tracking-widest uppercase">{activity.user_phone}</p>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center space-x-3 text-stone-300">
                               <Fingerprint size={20} />
                               <span className="italic font-bold text-xs uppercase tracking-widest">Guest User</span>
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-6">
                          <div className="max-w-[300px] space-y-1">
                            <p className="text-sm text-stone-600 font-medium leading-relaxed truncate" title={activity.description}>{activity.description}</p>
                            <div className="flex items-center space-x-2 text-[10px] font-mono text-stone-400 bg-stone-50 w-fit px-2 py-0.5 rounded border border-stone-100">
                               <Globe size={10} />
                               <span>{activity.ip_address}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-6">
                          <span className={cn(
                            "inline-flex items-center space-x-2 text-[10px] font-black px-4 py-2 rounded-2xl uppercase tracking-widest border",
                            activity.severity === 'high' ? "bg-red-50 text-red-600 border-red-100 shadow-[0_0_15px_rgba(239,68,68,0.1)]" : 
                            activity.severity === 'medium' ? "bg-amber-50 text-amber-600 border-amber-100 shadow-[0_0_15px_rgba(245,158,11,0.1)]" : 
                            activity.severity === 'resolved' ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                            "bg-blue-50 text-blue-600 border-blue-100"
                          )}>
                             <div className={cn(
                               "w-1.5 h-1.5 rounded-full",
                               activity.severity === 'high' ? "bg-red-500 animate-ping" : 
                               activity.severity === 'medium' ? "bg-amber-500 animate-pulse" : 
                               activity.severity === 'resolved' ? "bg-emerald-500" : "bg-blue-500"
                             )} />
                             <span>{activity.severity}</span>
                          </span>
                        </td>
                        <td className="px-6 py-6 whitespace-nowrap">
                           <div className="flex flex-col">
                             <span className="text-xs font-black text-stone-800 tracking-tight">{new Date(activity.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                             <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest mt-0.5">{new Date(activity.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                           </div>
                        </td>
                        <td className="px-10 py-6 text-right">
                          <button 
                            onClick={() => handleResolveSuspicious(activity.id)}
                            className="bg-stone-900 text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-xl shadow-stone-900/10 active:scale-95"
                          >
                            Mark Resolved
                          </button>
                        </td>
                      </motion.tr>
                    ))}
                    {suspiciousActivities.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-10 py-32 text-center text-stone-400 font-bold italic bg-stone-50/50 rounded-[3rem]">System integrity confirmed. No active threat vectors discovered.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'Data Exports' && (
          <DataExportsView />
        )}

        {activeTab === 'Bug Reports' && (
          <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
             <header className="flex flex-col md:flex-row md:items-end justify-between gap-8">
              <div className="space-y-1">
                <div className="flex items-center space-x-3">
                  <div className="w-14 h-14 bg-amber-500 text-white rounded-2xl flex items-center justify-center rotate-12 shadow-xl shadow-amber-200">
                    <Bug size={28} />
                  </div>
                  <h2 className="text-4xl font-black text-stone-900 tracking-tight">System Anomalies</h2>
                </div>
                <p className="text-stone-500 font-medium text-lg ml-1">Automated capture of runtime exceptions and UI failures.</p>
              </div>
              <div className="flex items-center space-x-4 bg-white p-4 rounded-3xl border border-stone-100 shadow-sm">
                 <div className="p-3 bg-red-50 text-red-500 rounded-2xl">
                   <Activity size={20} />
                 </div>
                 <div className="pr-4">
                   <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Active Errors</p>
                   <p className="text-lg font-black text-stone-900">{bugReports.length}</p>
                 </div>
              </div>
            </header>

            <div className="bg-white rounded-[3rem] shadow-sm border border-stone-100 overflow-hidden">
              <div className="overflow-x-auto no-scrollbar">
                <table className="w-full text-left">
                  <thead className="bg-stone-50/50 text-stone-400 text-[10px] uppercase font-black tracking-[0.25em]">
                    <tr>
                      <th className="px-10 py-8">Trace ID</th>
                      <th className="px-6 py-8">Reporter Identity</th>
                      <th className="px-6 py-8">Anomalous Component</th>
                      <th className="px-6 py-8">Error Cipher</th>
                      <th className="px-6 py-8">Protocol Stack</th>
                      <th className="px-10 py-8 text-right">Goverance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-50">
                    {bugReports.map((bug: any, idx: number) => (
                      <motion.tr 
                        key={bug.id} 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: idx * 0.05 }}
                        className="hover:bg-stone-50/50 transition-all font-mono group"
                      >
                        <td className="px-10 py-6">
                           <span className="text-[10px] font-black text-stone-400 group-hover:text-stone-900 transition-colors uppercase tracking-widest">ERR-{bug.id.toString().slice(-6)}</span>
                        </td>
                        <td className="px-6 py-6">
                           <div className="flex flex-col">
                              <span className="text-xs font-black text-stone-800 tracking-tight">{bug.reporter_name || 'System Node'}</span>
                              <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mt-0.5">UID: {bug.user_id?.slice(0, 8) || 'GUEST'}</span>
                           </div>
                        </td>
                        <td className="px-6 py-6">
                          <div className="flex items-center space-x-2">
                             <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                             <span className="text-[11px] font-black text-stone-800 uppercase tracking-tighter truncate max-w-[150px]" title={bug.path}>{bug.path || 'System Core'}</span>
                          </div>
                        </td>
                        <td className="px-6 py-6">
                           <div className="max-w-[300px] space-y-1">
                             <p className="text-xs font-bold text-red-600 line-clamp-1" title={bug.message}>{bug.message}</p>
                             <p className="text-[10px] text-stone-400 font-medium leading-relaxed line-clamp-2 italic">{bug.why || 'No root cause identified.'}</p>
                           </div>
                        </td>
                        <td className="px-6 py-6">
                           <div className="flex flex-col space-y-1 font-sans">
                             <span className="text-[10px] font-black text-stone-600 uppercase tracking-[0.2em]">{new Date(bug.created_at).toLocaleDateString()}</span>
                             <span className="text-[9px] font-bold text-stone-300 italic">{new Date(bug.created_at).toLocaleTimeString()}</span>
                           </div>
                        </td>
                        <td className="px-10 py-6 text-right">
                          <button 
                            onClick={async () => {
                              try {
                                const res = await fetch(`/api/admin/bugs/${bug.id}`, { method: 'DELETE' });
                                if (res.ok) {
                                  toast.success('Anomaly purged from logs');
                                  fetchBugReports();
                                }
                              } catch (err) {
                                toast.error('Purge failure');
                              }
                            }}
                            className="p-3 bg-stone-100 text-stone-400 hover:text-red-500 hover:bg-white hover:shadow-md hover:border-red-100 border border-transparent rounded-2xl transition-all"
                            title="Purge Anomaly"
                          >
                            <Trash2 size={18} />
                          </button>
                        </td>
                      </motion.tr>
                    ))}
                    {bugReports.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-10 py-32 text-center text-stone-400 font-bold italic bg-stone-50/50 rounded-[3rem]">Optimal runtime performance. Zero anomalies recently logged.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'System Status' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-100">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg"><CheckCircle2 size={20} /></div>
                  <h4 className="font-bold">Database</h4>
                </div>
                <p className="text-sm text-stone-500 mb-2">Status: <span className="text-emerald-600 font-bold">Healthy</span></p>
                <p className="text-[10px] text-stone-400 uppercase font-bold tracking-wider">Last Sync: Just Now</p>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-100">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg"><Globe size={20} /></div>
                  <h4 className="font-bold">API Server</h4>
                </div>
                <p className="text-sm text-stone-500 mb-2">Status: <span className="text-emerald-600 font-bold">Online</span></p>
                <p className="text-[10px] text-stone-400 uppercase font-bold tracking-wider">Active Conns: {stats?.activeUsers || 0}</p>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-100">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg"><Shield size={20} /></div>
                  <h4 className="font-bold">Security</h4>
                </div>
                <p className="text-sm text-stone-500 mb-2">Status: <span className="text-emerald-600 font-bold">Protected</span></p>
                <p className="text-[10px] text-stone-400 uppercase font-bold tracking-wider">Firewall: Active</p>
              </div>
            </div>

            <div className="bg-white p-8 rounded-3xl shadow-sm border border-stone-100">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold">System Logs</h3>
                <button 
                  onClick={fetchSystemLogs}
                  disabled={isRefreshingLogs}
                  className="p-2 hover:bg-stone-100 rounded-lg transition-colors disabled:opacity-50"
                >
                  <RefreshCw size={20} className={cn("text-stone-400", isRefreshingLogs && "animate-spin")} />
                </button>
              </div>
              <div className="space-y-4 font-mono text-xs max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                {systemLogs.map((log, i) => (
                  <div key={i} className="p-3 bg-stone-50 rounded-xl border border-stone-100 flex space-x-4">
                    <span className="text-stone-400">[{new Date(log.created_at).toLocaleString()}]</span>
                    <span className={cn(
                      "font-bold",
                      log.type === 'error' ? "text-red-600" : 
                      log.type === 'warn' ? "text-amber-600" : 
                      log.type === 'info' ? "text-emerald-600" : "text-blue-600"
                    )}>
                      {log.type.toUpperCase()}
                    </span>
                    <span className="text-stone-700">{log.message}</span>
                    {log.details && (
                      <span className="text-stone-400 text-[10px] truncate max-w-xs" title={log.details}>
                        {log.details}
                      </span>
                    )}
                  </div>
                ))}
                {systemLogs.length === 0 && (
                  <div className="text-center py-12 text-stone-400 italic">No system logs found</div>
                )}
              </div>
            </div>
          </div>
        )}
        </motion.div>
      </AnimatePresence>
    </main>
    </div>

      {walletModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white p-8 rounded-3xl shadow-2xl max-w-sm w-full space-y-6"
          >
            <h3 className="text-xl font-bold">Update Wallet</h3>
            <div className="space-y-4">
              <div className="flex bg-stone-100 p-1 rounded-xl">
                <button 
                  onClick={() => setWalletType('credit')}
                  className={cn("flex-1 py-2 rounded-lg text-sm font-bold transition-all", walletType === 'credit' ? "bg-white shadow-sm text-primary" : "text-stone-500")}
                >
                  Add Money
                </button>
                <button 
                  onClick={() => setWalletType('debit')}
                  className={cn("flex-1 py-2 rounded-lg text-sm font-bold transition-all", walletType === 'debit' ? "bg-white shadow-sm text-red-600" : "text-stone-500")}
                >
                  Deduct Money
                </button>
              </div>
              <input 
                type="number" 
                placeholder="Amount (₹)"
                className="input-field text-center text-2xl font-bold"
                value={walletAmount}
                onChange={(e) => setWalletAmount(e.target.value)}
              />
            </div>
            <div className="flex space-x-3">
              <button 
                onClick={() => setWalletModal({ open: false, userId: null })}
                className="flex-1 py-3 rounded-xl font-bold text-stone-500 hover:bg-stone-100"
              >
                Cancel
              </button>
              <button 
                onClick={handleWalletUpdate}
                className="flex-1 btn-primary py-3"
              >
                Confirm
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Bulk Discount Modal */}
      {bulkDiscountModal.open && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl"
          >
            <h3 className="text-2xl font-bold mb-6">
              {bulkDiscountModal.mode === 'add' ? 'Create Bulk Discount' : 'Edit Bulk Discount'}
            </h3>
            <form onSubmit={handleBulkDiscountSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-stone-700 mb-2">Discount Type</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewBulkDiscount({ ...newBulkDiscount, entity_type: 'product', entity_id: '' })}
                    className={cn(
                      "py-2 rounded-xl text-sm font-bold border transition-all",
                      newBulkDiscount.entity_type === 'product' ? "bg-primary/10 border-primary text-primary" : "border-stone-200 text-stone-400 hover:bg-stone-50"
                    )}
                  >
                    Product Based
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewBulkDiscount({ ...newBulkDiscount, entity_type: 'category', entity_id: '' })}
                    className={cn(
                      "py-2 rounded-xl text-sm font-bold border transition-all",
                      newBulkDiscount.entity_type === 'category' ? "bg-primary/10 border-primary text-primary" : "border-stone-200 text-stone-400 hover:bg-stone-50"
                    )}
                  >
                    Category Based
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-stone-700 mb-2">
                  Select {newBulkDiscount.entity_type === 'product' ? 'Product' : 'Category'}
                </label>
                <select
                  required
                  className="input-field"
                  value={newBulkDiscount.entity_id}
                  onChange={(e) => setNewBulkDiscount({ ...newBulkDiscount, entity_id: e.target.value })}
                >
                  <option value="">Select Target</option>
                  {newBulkDiscount.entity_type === 'product' ? (
                    allProducts.map(p => <option key={p.id} value={p.id}>{p.name}</option>)
                  ) : (
                    categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)
                  )}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-stone-700 mb-2">Min. Quantity</label>
                  <input
                    type="number"
                    required
                    min="1"
                    className="input-field"
                    value={newBulkDiscount.min_qty}
                    onChange={(e) => setNewBulkDiscount({ ...newBulkDiscount, min_qty: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-stone-700 mb-2">Discount Type</label>
                  <select
                    className="input-field"
                    value={newBulkDiscount.discount_type}
                    onChange={(e) => setNewBulkDiscount({ ...newBulkDiscount, discount_type: e.target.value as any })}
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="flat">Flat Amount (₹)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-stone-700 mb-2">Discount Value</label>
                <input
                  type="number"
                  required
                  min="0"
                  className="input-field"
                  value={newBulkDiscount.discount_value}
                  onChange={(e) => setNewBulkDiscount({ ...newBulkDiscount, discount_value: e.target.value })}
                />
              </div>

              <div className="flex items-center space-x-3 p-4 bg-stone-50 rounded-2xl">
                <input 
                  type="checkbox" 
                  id="bd_active"
                  className="w-5 h-5 rounded border-stone-300 text-primary focus:ring-primary"
                  checked={newBulkDiscount.active}
                  onChange={(e) => setNewBulkDiscount({...newBulkDiscount, active: e.target.checked})}
                />
                <label htmlFor="bd_active" className="text-sm font-bold text-stone-700">Active Discount</label>
              </div>

              <div className="flex space-x-3 pt-4">
                <button 
                  type="button"
                  onClick={() => setBulkDiscountModal({ open: false, mode: 'add', discount: null })}
                  className="flex-1 py-3 border border-stone-200 rounded-xl font-bold hover:bg-stone-50"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary/90"
                >
                  {bulkDiscountModal.mode === 'add' ? 'Create' : 'Update'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Coupon Modal */}
      {couponModal.open && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl"
          >
            <h3 className="text-2xl font-bold mb-6">{couponModal.mode === 'edit' ? 'Update Coupon' : 'Create Coupon'}</h3>
            <form onSubmit={handleAddCoupon} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-stone-700 mb-2">Coupon Code</label>
                <input 
                  type="text" 
                  required
                  className="input-field uppercase font-mono"
                  placeholder="WELCOME10"
                  value={newCoupon.code}
                  onChange={(e) => setNewCoupon({...newCoupon, code: e.target.value.toUpperCase()})}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-stone-700 mb-2">Type</label>
                  <select 
                    className="input-field"
                    value={newCoupon.type}
                    onChange={(e) => setNewCoupon({...newCoupon, type: e.target.value})}
                  >
                    <option value="flat">Flat Amount</option>
                    <option value="percentage">Percentage</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-stone-700 mb-2">Value</label>
                  <input 
                    type="number" 
                    required
                    className="input-field"
                    value={newCoupon.value}
                    onChange={(e) => setNewCoupon({...newCoupon, value: e.target.value})}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-stone-700 mb-2">Min. Order (₹)</label>
                <input 
                  type="number" 
                  required
                  className="input-field"
                  value={newCoupon.min_order}
                  onChange={(e) => setNewCoupon({...newCoupon, min_order: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-stone-700 mb-2">Total Limit</label>
                  <input 
                    type="number" 
                    className="input-field"
                    placeholder="Unlimited"
                    value={newCoupon.usage_limit}
                    onChange={(e) => setNewCoupon({...newCoupon, usage_limit: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-stone-700 mb-2">Limit Per User</label>
                  <input 
                    type="number" 
                    required
                    className="input-field"
                    value={newCoupon.limit_per_user}
                    onChange={(e) => setNewCoupon({...newCoupon, limit_per_user: e.target.value})}
                  />
                </div>
              </div>
              <div className="flex space-x-3 pt-4">
                <button 
                  type="button"
                  onClick={() => setCouponModal({ open: false })}
                  className="flex-1 py-3 border border-stone-200 rounded-xl font-bold hover:bg-stone-50"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary/90"
                >
                  {couponModal.mode === 'edit' ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Expense Modal */}
      {expenseModal.open && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl"
          >
            <h3 className="text-2xl font-bold mb-6">Add Expense</h3>
            <form onSubmit={handleAddExpense} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-stone-700 mb-2">Description</label>
                <input 
                  type="text" 
                  required
                  className="input-field"
                  placeholder="Electricity Bill, Rent, etc."
                  value={newExpense.description}
                  onChange={(e) => setNewExpense({...newExpense, description: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-stone-700 mb-2">Amount (₹)</label>
                  <input 
                    type="number" 
                    required
                    className="input-field"
                    value={newExpense.amount}
                    onChange={(e) => setNewExpense({...newExpense, amount: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-stone-700 mb-2">Category</label>
                  <select 
                    className="input-field"
                    value={newExpense.category}
                    onChange={(e) => setNewExpense({...newExpense, category: e.target.value})}
                  >
                    <option value="Stock">Stock</option>
                    <option value="Utilities">Utilities</option>
                    <option value="Rent">Rent</option>
                    <option value="Staff">Staff</option>
                    <option value="Others">Others</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-stone-700 mb-2">Date</label>
                <input 
                  type="date" 
                  required
                  className="input-field"
                  value={newExpense.date}
                  onChange={(e) => setNewExpense({...newExpense, date: e.target.value})}
                />
              </div>
              <div className="flex space-x-3 pt-4">
                <button 
                  type="button"
                  onClick={() => setExpenseModal({ open: false })}
                  className="flex-1 py-3 border border-stone-200 rounded-xl font-bold hover:bg-stone-50"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary/90"
                >
                  Add
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
      {/* Product Modal */}
      {productModal.open && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl p-8 max-w-lg w-full shadow-2xl overflow-y-auto max-h-[90vh]"
          >
            <h3 className="text-2xl font-bold mb-6">
              {productModal.mode === 'add' ? 'Add New Product' : 'Edit Product'}
            </h3>
            <form onSubmit={handleProductSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-stone-700 mb-2">Product Name</label>
                <input 
                  type="text" 
                  required
                  className="input-field"
                  placeholder="e.g., Fresh Tomatoes"
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-stone-700 mb-2">Description</label>
                <textarea 
                  required
                  className="input-field min-h-[100px] py-3"
                  placeholder="Product description..."
                  value={newProduct.description}
                  onChange={(e) => setNewProduct({...newProduct, description: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-stone-700 mb-2">Product Images</label>
                <ProductImageManager 
                  allImages={newProduct.images || []} 
                  primaryImage={newProduct.image || ''} 
                  onUpdate={(allImages, primaryImage) => {
                    setNewProduct({ ...newProduct, images: allImages || [], image: primaryImage || '' });
                  }}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-stone-700 mb-2">Retail Price (₹)</label>
                  <input 
                    type="number" 
                    required
                    className="input-field"
                    value={newProduct.retail_price}
                    onChange={(e) => setNewProduct({...newProduct, retail_price: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-stone-700 mb-2">Wholesale Price (₹)</label>
                  <input 
                    type="number" 
                    className="input-field"
                    value={newProduct.wholesale_price}
                    onChange={(e) => setNewProduct({...newProduct, wholesale_price: e.target.value})}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-stone-700 mb-2">Discount (%)</label>
                  <input 
                    type="number" 
                    className="input-field"
                    value={newProduct.discount}
                    onChange={(e) => setNewProduct({...newProduct, discount: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-stone-700 mb-2">Stock Quantity</label>
                  <input 
                    type="number" 
                    required
                    className="input-field"
                    value={newProduct.stock}
                    onChange={(e) => setNewProduct({...newProduct, stock: e.target.value})}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-stone-700 mb-2">Reorder Point</label>
                  <input 
                    type="number" 
                    className="input-field"
                    value={newProduct.reorder_point}
                    onChange={(e) => setNewProduct({...newProduct, reorder_point: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-stone-700 mb-2">Max Order Qty</label>
                  <input 
                    type="number" 
                    className="input-field"
                    value={newProduct.max_qty}
                    onChange={(e) => setNewProduct({...newProduct, max_qty: e.target.value})}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-stone-700 mb-2">Batch Number</label>
                  <input 
                    type="text" 
                    className="input-field"
                    placeholder="e.g. B-0123"
                    value={(newProduct as any).batch_number || ''}
                    onChange={(e) => setNewProduct({...newProduct, batch_number: e.target.value} as any)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-stone-700 mb-2">Expiry Date</label>
                  <input 
                    type="date" 
                    className="input-field"
                    value={(newProduct as any).expiry_date || ''}
                    onChange={(e) => setNewProduct({...newProduct, expiry_date: e.target.value} as any)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-stone-700 mb-2">Category</label>
                  <select 
                    className="input-field"
                    value={newProduct.category}
                    onChange={(e) => setNewProduct({...newProduct, category: e.target.value})}
                  >
                    {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-stone-700 mb-2">Supplier</label>
                  <select 
                    className="input-field"
                    value={newProduct.supplier_id || ''}
                    onChange={(e) => setNewProduct({...newProduct, supplier_id: e.target.value})}
                  >
                    <option value="">No Supplier Link</option>
                    {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-stone-700 mb-2">Product Images</label>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {newProduct.images.map((img, i) => (
                      <div key={i} className="relative w-16 h-16 rounded-lg overflow-hidden border border-stone-200 group">
                        <img src={img} className="w-full h-full object-cover" alt="" />
                        {newProduct.image === img && (
                          <div className="absolute top-0 left-0 bg-primary text-white text-[8px] px-1 font-bold">MAIN</div>
                        )}
                      </div>
                    ))}
                    <button 
                      type="button"
                      onClick={() => setImageModal({ open: true, productId: editingProduct?.id || null, images: newProduct.images })}
                      className="w-16 h-16 rounded-lg border-2 border-dashed border-stone-200 flex items-center justify-center text-stone-400 hover:border-primary hover:text-primary transition-all"
                    >
                      <Plus size={20} />
                    </button>
                  </div>
                  <button 
                    type="button"
                    onClick={() => setImageModal({ open: true, productId: editingProduct?.id || null, images: newProduct.images })}
                    className="text-xs font-bold text-primary hover:underline"
                  >
                    Manage & Upload Images
                  </button>
                </div>
              </div>
              <div className="p-6 bg-stone-50 rounded-2xl space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="font-bold text-stone-900">Specifications</h4>
                </div>
                <div className="space-y-3">
                  {Object.entries(newProduct.specifications || {}).map(([key, value]) => (
                    <div key={key} className="flex items-center space-x-2">
                      <div className="w-1/3">
                        <input 
                          type="text"
                          className="input-field py-2 text-sm bg-stone-100"
                          value={key}
                          readOnly
                        />
                      </div>
                      <div className="flex-1">
                        <input 
                          type="text"
                          className="input-field py-2 text-sm"
                          placeholder="Value"
                          value={value}
                          onChange={(e) => setNewProduct({
                            ...newProduct,
                            specifications: { ...newProduct.specifications, [key]: e.target.value }
                          })}
                        />
                      </div>
                      <button 
                        type="button"
                        onClick={() => {
                          const newSpecs = { ...newProduct.specifications };
                          delete newSpecs[key];
                          setNewProduct({ ...newProduct, specifications: newSpecs });
                        }}
                        className="p-2 text-stone-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                  
                  <div className="flex items-center space-x-2 pt-2 border-t border-stone-200">
                    <input 
                      type="text"
                      className="w-1/3 input-field py-2 text-sm"
                      placeholder="e.g., Weight"
                      value={newSpec.key}
                      onChange={(e) => setNewSpec({ ...newSpec, key: e.target.value })}
                    />
                    <input 
                      type="text"
                      className="flex-1 input-field py-2 text-sm"
                      placeholder="e.g., 500g"
                      value={newSpec.value}
                      onChange={(e) => setNewSpec({ ...newSpec, value: e.target.value })}
                    />
                    <button 
                      type="button"
                      onClick={() => {
                        if (newSpec.key && newSpec.value) {
                          setNewProduct({
                            ...newProduct,
                            specifications: { ...newProduct.specifications, [newSpec.key]: newSpec.value }
                          });
                          setNewSpec({ key: '', value: '' });
                        }
                      }}
                      className="p-2 bg-primary text-white rounded-lg hover:bg-primary/90"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-3 p-4 bg-stone-50 rounded-2xl">
                <input 
                  type="checkbox" 
                  id="is_listed"
                  className="w-5 h-5 rounded border-stone-300 text-primary focus:ring-primary"
                  checked={newProduct.is_listed}
                  onChange={(e) => setNewProduct({...newProduct, is_listed: e.target.checked})}
                />
                <label htmlFor="is_listed" className="text-sm font-bold text-stone-700">List this product on store</label>
              </div>

              {productModal.mode === 'edit' && editingProduct && (
                <div className="p-6 bg-stone-50 rounded-2xl space-y-4">
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <h4 className="font-bold text-stone-900">Product Variants</h4>
                      <p className="text-[10px] text-stone-400 font-medium">Configure options natively above or manage dynamically.</p>
                    </div>
                    <button 
                      type="button"
                      onClick={() => {
                        setVariantModal({ open: true, mode: 'edit', variant: null, productId: editingProduct.id });
                      }}
                      className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-bold transition-colors flex items-center space-x-2"
                    >
                      <Settings size={14} />
                      <span>Manage Variants</span>
                    </button>
                  </div>
                  <div className="space-y-2">
                    {productVariants.length > 0 ? (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {productVariants.map((v) => (
                          <div key={v.id || v.name} className="flex items-center space-x-2 bg-white border border-stone-200 px-3 py-2 rounded-xl text-xs shadow-sm">
                             <span className="font-bold text-stone-700">{v.name}</span>
                             <span className="text-stone-300">•</span>
                             <span className="text-stone-500 font-medium">₹{v.price}</span>
                             {(v.is_default === 1 || v.is_default === true) && (
                               <span className="ml-1 w-2 h-2 rounded-full bg-emerald-500" title="Default Variant"></span>
                             )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-stone-400 italic text-center py-4 bg-stone-50 rounded-2xl border border-dashed border-stone-200">No variants defined. The standard product price will be used.</p>
                    )}
                  </div>
                </div>
              )}
              <div className="flex space-x-3 pt-4">
                <button 
                  type="button"
                  onClick={() => setProductModal({ open: false, mode: 'add' })}
                  className="flex-1 py-3 border border-stone-200 rounded-xl font-bold hover:bg-stone-50"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary/90"
                >
                  {productModal.mode === 'add' ? 'Add Product' : 'Update Product'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
      {/* Purchase / Stock Entry Modal */}
      {stockEntryModal.open && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl p-8 max-w-lg w-full shadow-2xl relative max-h-[90vh] overflow-y-auto"
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold">New Stock Entry</h3>
              <button 
                onClick={() => setStockEntryModal({ open: false, product: null })}
                className="p-2 hover:bg-stone-100 rounded-full text-stone-400"
              >
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleStockEntrySubmit} className="space-y-4">
              <div className="bg-stone-50 p-4 rounded-2xl flex items-center space-x-4 mb-4">
                <div className="w-12 h-12 bg-white rounded-xl border border-stone-100 overflow-hidden shrink-0">
                  <img src={stockEntryModal.product?.image_url} alt="" className="w-full h-full object-cover" />
                </div>
                <div>
                  <p className="font-bold text-stone-900">{stockEntryModal.product?.name}</p>
                  <p className="text-xs text-stone-400">Current Stock: {stockEntryModal.product?.stock} {stockEntryModal.product?.unit}</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-stone-700 mb-2">Supplier</label>
                <select 
                  required
                  className="input-field"
                  value={purchaseForm.supplier_id}
                  onChange={(e) => setPurchaseForm({...purchaseForm, supplier_id: e.target.value})}
                >
                  <option value="">Select Supplier</option>
                  {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-stone-700 mb-2">Quantity Added</label>
                  <input 
                    type="number" 
                    required
                    min="1"
                    className="input-field"
                    value={purchaseForm.quantity}
                    onChange={(e) => setPurchaseForm({...purchaseForm, quantity: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-stone-700 mb-2">Unit Cost (₹)</label>
                  <input 
                    type="number" 
                    required
                    min="0"
                    step="0.01"
                    className="input-field"
                    value={purchaseForm.cost_price}
                    onChange={(e) => setPurchaseForm({...purchaseForm, cost_price: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-stone-700 mb-2">Supplier Invoice #</label>
                <input 
                  type="text" 
                  className="input-field"
                  placeholder="e.g. INV-2024-001"
                  value={purchaseForm.invoice_number}
                  onChange={(e) => setPurchaseForm({...purchaseForm, invoice_number: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-stone-700 mb-2">Batch Number</label>
                  <input 
                    type="text" 
                    className="input-field"
                    placeholder="Batch ID"
                    value={purchaseForm.batch_number}
                    onChange={(e) => setPurchaseForm({...purchaseForm, batch_number: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-stone-700 mb-2">Expiry Date</label>
                  <input 
                    type="date" 
                    className="input-field"
                    value={purchaseForm.expiry_date}
                    onChange={(e) => setPurchaseForm({...purchaseForm, expiry_date: e.target.value})}
                  />
                </div>
              </div>

              <div className="pt-4 flex space-x-3">
                <button 
                  type="button"
                  onClick={() => setStockEntryModal({ open: false, product: null })}
                  className="flex-1 py-3 border border-stone-200 rounded-xl font-bold hover:bg-stone-50"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 shadow-lg shadow-primary/20"
                >
                  Confirm Entry
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Image Management Modal */}
      {imageModal.open && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl p-8 max-w-2xl w-full shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]"
          >
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-2xl font-bold">Manage Product Images</h3>
                <p className="text-stone-500 text-sm">Upload, reorder, and set main image</p>
              </div>
              <button 
                onClick={() => setImageModal({ ...imageModal, open: false })}
                className="p-2 hover:bg-stone-100 rounded-full text-stone-400"
              >
                <X size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto pr-2">
              <ProductImageManager 
                allImages={imageModal.images} 
                primaryImage={newProduct.image} 
                onUpdate={(allImages, primaryImage) => {
                  setNewProduct({ ...newProduct, images: allImages, image: primaryImage });
                  setImageModal({ ...imageModal, images: allImages }); 
                }}
              />
            </div>

            <div className="mt-8 pt-6 border-t border-stone-100">
              <button 
                onClick={() => setImageModal({ ...imageModal, open: false })}
                className="w-full py-4 bg-primary text-white rounded-2xl font-bold hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all"
              >
                Done Managing Images
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Category Batch Update Modal */}
      {categoryBatchModal.open && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl"
          >
            <h3 className="text-xl font-bold mb-4">Change Category</h3>
            <p className="text-sm text-stone-500 mb-6">
              Update category for {selectedProducts.length} selected products.
            </p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-stone-700 mb-2">Select New Category</label>
                <select 
                  className="input-field"
                  value={newBatchCategory}
                  onChange={(e) => setNewBatchCategory(e.target.value)}
                >
                  <option value="">Select Category</option>
                  {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                </select>
              </div>

              <div className="flex space-x-3 pt-4">
                <button 
                  onClick={() => {
                    setCategoryBatchModal({ open: false });
                    setNewBatchCategory('');
                  }}
                  className="flex-1 py-3 border border-stone-200 rounded-xl font-bold hover:bg-stone-50"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleBatchCategoryUpdate}
                  disabled={!newBatchCategory}
                  className="flex-1 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 disabled:opacity-50"
                >
                  Update
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Wallet History Modal */}
      {walletHistoryModal.open && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl p-8 max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold">Transaction History</h3>
              <button 
                onClick={() => setWalletHistoryModal({ ...walletHistoryModal, open: false })}
                className="p-2 hover:bg-stone-100 rounded-full text-stone-400"
              >
                <X size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto pr-2">
              {walletHistoryModal.history.length === 0 ? (
                <div className="text-center py-12 text-stone-400">
                  <History size={48} className="mx-auto mb-4 opacity-20" />
                  <p>No transactions found for this user.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {walletHistoryModal.history.map((tx) => (
                    <div key={tx.id} className="p-4 bg-stone-50 rounded-2xl border border-stone-100 flex justify-between items-center">
                      <div className="flex items-center space-x-4">
                        <div className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center",
                          tx.type === 'credit' ? "bg-emerald-100 text-emerald-600" : "bg-red-100 text-red-600"
                        )}>
                          {tx.type === 'credit' ? <Plus size={20} /> : <X size={20} />}
                        </div>
                        <div>
                          <p className="font-bold text-sm">{tx.description}</p>
                          <p className="text-[10px] text-stone-400 uppercase font-bold tracking-wider">
                            {new Date(tx.created_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className={cn(
                        "font-bold text-lg",
                        tx.type === 'credit' ? "text-emerald-600" : "text-red-600"
                      )}>
                        {tx.type === 'credit' ? '+' : '-'}₹{tx.amount}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
      {/* Supplier Modal */}
      {supplierModal.open && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl"
          >
            <h3 className="text-2xl font-bold mb-6">
              {supplierModal.mode === 'add' ? 'Add Supplier' : 'Edit Supplier'}
            </h3>
            <form onSubmit={handleSupplierSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-stone-700 mb-2">Supplier Name</label>
                <input 
                  type="text" 
                  required
                  className="input-field"
                  value={newSupplier.name}
                  onChange={(e) => setNewSupplier({...newSupplier, name: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-stone-700 mb-2">Contact Person</label>
                <input 
                  type="text" 
                  required
                  className="input-field"
                  value={newSupplier.contact_person}
                  onChange={(e) => setNewSupplier({...newSupplier, contact_person: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-stone-700 mb-2">Email</label>
                <input 
                  type="email" 
                  className="input-field"
                  value={newSupplier.email}
                  onChange={(e) => setNewSupplier({...newSupplier, email: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-stone-700 mb-2">Phone</label>
                <input 
                  type="text" 
                  required
                  className="input-field"
                  value={newSupplier.phone}
                  onChange={(e) => setNewSupplier({...newSupplier, phone: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-stone-700 mb-2">Address</label>
                <textarea 
                  className="input-field h-24"
                  value={newSupplier.address}
                  onChange={(e) => setNewSupplier({...newSupplier, address: e.target.value})}
                />
              </div>
              <div className="flex space-x-3 pt-4">
                <button 
                  type="button"
                  onClick={() => setSupplierModal({ open: false, mode: 'add', supplier: null })}
                  className="flex-1 py-3 border border-stone-200 rounded-xl font-bold hover:bg-stone-50"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary/90"
                >
                  Save
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Promotion Rule Modal */}
      {promotionRuleModal.open && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl relative max-h-[90vh] overflow-y-auto"
          >
            <h3 className="text-2xl font-bold mb-6">
              {promotionRuleModal.mode === 'add' ? 'Create Target Rule' : 'Edit Target Rule'}
            </h3>
            <form onSubmit={handlePromotionRuleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-stone-700 mb-2">Rule Title</label>
                <input 
                  type="text" 
                  required
                  className="input-field"
                  value={newPromotionRule.title}
                  onChange={(e) => setNewPromotionRule({...newPromotionRule, title: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-stone-700 mb-2">Discount Type</label>
                  <select 
                    className="input-field"
                    value={newPromotionRule.type}
                    onChange={(e) => setNewPromotionRule({...newPromotionRule, type: e.target.value})}
                  >
                    <option value="percentage">Percentage OFF</option>
                    <option value="fixed">Fixed Amount OFF</option>
                    <option value="bogo">Buy X Get Y (BOGO)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-stone-700 mb-2">Discount Value {newPromotionRule.type === 'bogo' && '(Y)'}</label>
                  <input 
                    type="number" 
                    required
                    min="1"
                    className="input-field"
                    value={newPromotionRule.discount_value}
                    onChange={(e) => setNewPromotionRule({...newPromotionRule, discount_value: parseFloat(e.target.value)})}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div>
                  <label className="block text-sm font-bold text-stone-700 mb-2">Target Scope</label>
                  <select 
                    className="input-field"
                    value={newPromotionRule.target_type}
                    onChange={(e) => setNewPromotionRule({...newPromotionRule, target_type: e.target.value})}
                  >
                    <option value="all">Entire Store</option>
                    <option value="category">Specific Category</option>
                    <option value="product">Specific Product</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-stone-700 mb-2">Required Qty {newPromotionRule.type === 'bogo' && '(X)'}</label>
                  <input 
                    type="number" 
                    required
                    min="1"
                    className="input-field"
                    value={newPromotionRule.condition_qty}
                    onChange={(e) => setNewPromotionRule({...newPromotionRule, condition_qty: parseInt(e.target.value)})}
                  />
                </div>
              </div>
              
              {newPromotionRule.target_type !== 'all' && (
                <div>
                  <label className="block text-sm font-bold text-stone-700 mb-2">Target Name / ID</label>
                  <input 
                    type="text" 
                    required
                    placeholder={newPromotionRule.target_type === 'category' ? "e.g., Electronics" : "Product ID (e.g., 12)"}
                    className="input-field"
                    value={newPromotionRule.target_id}
                    onChange={(e) => setNewPromotionRule({...newPromotionRule, target_id: e.target.value})}
                  />
                </div>
              )}

              <div className="flex items-center space-x-3 p-4 bg-stone-50 rounded-2xl">
                <input 
                  type="checkbox" 
                  id="promorule_active"
                  className="w-5 h-5 rounded border-stone-300 text-primary focus:ring-primary"
                  checked={newPromotionRule.active}
                  onChange={(e) => setNewPromotionRule({...newPromotionRule, active: e.target.checked})}
                />
                <label htmlFor="promorule_active" className="text-sm font-bold text-stone-700">Active</label>
              </div>
              <div className="flex space-x-3 pt-4">
                <button 
                  type="button"
                  onClick={() => setPromotionRuleModal({ open: false, mode: 'add', id: null })}
                  className="flex-1 py-3 border border-stone-200 rounded-xl font-bold hover:bg-stone-50 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition-colors"
                >
                  Save Rule
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Promotion Modal */}
      {promotionModal.open && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl"
          >
            <h3 className="text-2xl font-bold mb-6">
              {promotionModal.mode === 'add' ? 'Add Promotion' : 'Edit Promotion'}
            </h3>
            <form onSubmit={handlePromotionSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-stone-700 mb-2">Title</label>
                <input 
                  type="text" 
                  required
                  className="input-field"
                  value={newPromotion.title}
                  onChange={(e) => setNewPromotion({...newPromotion, title: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-stone-700 mb-2">Description</label>
                <textarea 
                  required
                  className="input-field min-h-[100px]"
                  value={newPromotion.description}
                  onChange={(e) => setNewPromotion({...newPromotion, description: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-stone-700 mb-2">Image URL (Optional)</label>
                <div className="flex space-x-2">
                  <input 
                    type="text" 
                    className="input-field"
                    value={newPromotion.image_url}
                    onChange={(e) => setNewPromotion({...newPromotion, image_url: e.target.value})}
                  />
                  <div className="relative">
                    <button type="button" className="p-3 bg-stone-100 rounded-xl hover:bg-stone-200 transition-colors">
                      <Upload size={18} />
                    </button>
                    <input 
                      type="file" 
                      accept="image/*"
                      className="absolute inset-0 opacity-0 cursor-pointer"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setNewPromotion({...newPromotion, image_url: reader.result as string});
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-stone-700 mb-2">Link (Optional)</label>
                <input 
                  type="text" 
                  className="input-field"
                  placeholder="/products or https://..."
                  value={newPromotion.link}
                  onChange={(e) => setNewPromotion({...newPromotion, link: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-stone-700 mb-2">Target Audience</label>
                  <select 
                    className="input-field"
                    value={newPromotion.target_role}
                    onChange={(e) => setNewPromotion({...newPromotion, target_role: e.target.value})}
                  >
                    <option value="all">All Users</option>
                    <option value="customer">Retail Customers</option>
                    <option value="wholesaler">Wholesale Buyers</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-stone-700 mb-2">Banner Type</label>
                  <select 
                    className="input-field"
                    value={newPromotion.banner_type}
                    onChange={(e) => setNewPromotion({...newPromotion, banner_type: e.target.value})}
                  >
                    <option value="standard">Standard Banner</option>
                    <option value="hero">Hero Slider (Top)</option>
                    <option value="hidden">Hidden (No Banner)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-stone-700 mb-2">Start Time (Optional)</label>
                  <input 
                    type="datetime-local" 
                    className="input-field"
                    value={newPromotion.start_time}
                    onChange={(e) => setNewPromotion({...newPromotion, start_time: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-stone-700 mb-2">End Time (Optional)</label>
                  <input 
                    type="datetime-local" 
                    className="input-field"
                    value={newPromotion.end_time}
                    onChange={(e) => setNewPromotion({...newPromotion, end_time: e.target.value})}
                  />
                </div>
              </div>

              <div className="flex items-center space-x-3 p-4 bg-stone-50 rounded-2xl">
                <input 
                  type="checkbox" 
                  id="promo_active"
                  className="w-5 h-5 rounded border-stone-300 text-primary focus:ring-primary"
                  checked={newPromotion.active}
                  onChange={(e) => setNewPromotion({...newPromotion, active: e.target.checked})}
                />
                <label htmlFor="promo_active" className="text-sm font-bold text-stone-700">Active (Visible on store)</label>
              </div>
              <div className="flex items-center space-x-3 p-4 bg-stone-50 rounded-2xl">
                <input 
                  type="checkbox" 
                  id="promo_default"
                  className="w-5 h-5 rounded border-stone-300 text-primary focus:ring-primary"
                  checked={newPromotion.is_default}
                  onChange={(e) => setNewPromotion({...newPromotion, is_default: e.target.checked})}
                />
                <label htmlFor="promo_default" className="text-sm font-bold text-stone-700">Set as Default Banner</label>
              </div>
              <div className="flex space-x-3 pt-4">
                <button 
                  type="button"
                  onClick={() => setPromotionModal({ open: false, mode: 'add', id: null })}
                  className="flex-1 py-3 border border-stone-200 rounded-xl font-bold hover:bg-stone-50"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary/90"
                >
                  {promotionModal.mode === 'add' ? 'Add Promotion' : 'Update Promotion'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Category Modal */}
      {categoryModal.open && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl"
          >
            <h3 className="text-2xl font-bold mb-6">
              {categoryModal.mode === 'add' ? 'Add Category' : 'Edit Category'}
            </h3>
            <form onSubmit={handleCategorySubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-stone-700 mb-2">Category Name</label>
                <input 
                  type="text" 
                  required
                  className="input-field"
                  value={newCategory.name}
                  onChange={(e) => setNewCategory({...newCategory, name: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-stone-700 mb-2">Icon Name (Lucide)</label>
                <input 
                  type="text" 
                  className="input-field"
                  value={newCategory.icon}
                  onChange={(e) => setNewCategory({...newCategory, icon: e.target.value})}
                />
              </div>
              <div className="flex space-x-3 pt-4">
                <button 
                  type="button"
                  onClick={() => setCategoryModal({ open: false, mode: 'add' })}
                  className="flex-1 py-3 border border-stone-200 rounded-xl font-bold hover:bg-stone-50"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary/90"
                >
                  Save
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Notification Modal */}
      {notificationModal.open && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-[2.5rem] p-10 max-w-xl w-full shadow-2xl border border-stone-100"
          >
            <div className="flex justify-between items-center mb-8">
              <div>
                <h3 className="text-2xl font-black text-stone-900">Broadcast Announcement</h3>
                <p className="text-stone-500 text-sm mt-1">Create and dispatch informative messages across the platform.</p>
              </div>
              <button 
                onClick={() => setNotificationModal({ open: false })}
                className="p-2 hover:bg-stone-100 rounded-full transition-colors text-stone-400"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleNotificationSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-black text-stone-400 uppercase tracking-widest mb-2">Subject Title</label>
                  <input 
                    type="text" 
                    required
                    placeholder="E.g. Weekend Flash Sale Live!"
                    className="input-field py-4 text-base"
                    value={newNotification.title}
                    onChange={(e) => setNewNotification({...newNotification, title: e.target.value})}
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-black text-stone-400 uppercase tracking-widest mb-2">Message Content</label>
                  <textarea 
                    required
                    placeholder="Enter detailed announcement message..."
                    className="input-field min-h-[120px] py-4 text-base resize-none"
                    value={newNotification.message}
                    onChange={(e) => setNewNotification({...newNotification, message: e.target.value})}
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-stone-400 uppercase tracking-widest mb-2">Announcement Type</label>
                  <select 
                    className="input-field py-3 text-sm"
                    value={newNotification.type}
                    onChange={(e) => setNewNotification({...newNotification, type: e.target.value})}
                  >
                    <option value="announcement">📢 Formal Announcement</option>
                    <option value="ad">🏷️ Promotional Ad</option>
                    <option value="alert">🚨 Critical Alert</option>
                    <option value="info">ℹ️ System Info</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-stone-400 uppercase tracking-widest mb-2">Priority Level</label>
                  <select 
                    className="input-field py-3 text-sm"
                    value={newNotification.priority}
                    onChange={(e) => setNewNotification({...newNotification, priority: e.target.value})}
                  >
                    <option value="low">Low (Standard)</option>
                    <option value="medium">Medium (Important)</option>
                    <option value="high">High (Urgent)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-stone-400 uppercase tracking-widest mb-2">Target Audience</label>
                  <select 
                    className="input-field py-3 text-sm"
                    value={newNotification.target_role}
                    onChange={(e) => setNewNotification({...newNotification, target_role: e.target.value})}
                  >
                    <option value="all">Everyone</option>
                    <option value="user">Registered Customers Only</option>
                    <option value="admin">Admin Team Only</option>
                    <option value="delivery">Delivery Staff</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-stone-400 uppercase tracking-widest mb-2">Expiry Date (Optional)</label>
                  <input 
                    type="datetime-local"
                    className="input-field py-3 text-sm"
                    value={newNotification.expires_at}
                    onChange={(e) => setNewNotification({...newNotification, expires_at: e.target.value})}
                  />
                </div>
              </div>

              <div className="flex space-x-4 pt-4">
                <button 
                  type="button"
                  onClick={() => setNotificationModal({ open: false })}
                  className="flex-1 py-4 border border-stone-200 rounded-2xl font-bold text-stone-600 hover:bg-stone-50 transition-all font-sans"
                >
                  Discard
                </button>
                <button 
                  type="submit"
                  className="flex-2 py-4 bg-stone-900 text-white rounded-2xl font-bold hover:bg-stone-800 transition-all shadow-xl shadow-stone-900/10 font-sans flex items-center justify-center space-x-2"
                >
                  <Send size={18} />
                  <span>Dispatch Announcement</span>
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Customer Detail Modal */}
      {customerModal.open && customerModal.user && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl p-8 max-w-2xl w-full shadow-2xl overflow-y-auto max-h-[90vh]"
          >
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 rounded-full bg-stone-100 overflow-hidden">
                  {customerModal.user.profile_photo ? (
                    <img src={customerModal.user.profile_photo} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-stone-300">
                      <Users size={32} />
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="text-2xl font-bold">{customerModal.user.name}</h3>
                  <p className="text-stone-500">{customerModal.user.phone}</p>
                  <p className="text-xs text-primary font-bold mt-1">
                    {customerModal.user.lat && customerModal.user.lng ? `Lat: ${customerModal.user.lat.toFixed(4)}, Lng: ${customerModal.user.lng.toFixed(4)}` : 'Location unknown'}
                  </p>
                </div>
              </div>
              <button onClick={() => setCustomerModal({ open: false, user: null })} className="p-2 hover:bg-stone-100 rounded-full">
                <X size={24} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="bg-stone-50 p-6 rounded-2xl space-y-4">
                  <h4 className="font-bold text-stone-900 border-b border-stone-200 pb-2">Account Settings</h4>
                  <div>
                    <label className="block text-[10px] font-bold text-stone-400 uppercase mb-1">Role</label>
                    <select 
                      className="input-field py-2 text-sm"
                      value={customerModal.user.role}
                      onChange={(e) => handleUserUpdate(customerModal.user.id, { role: e.target.value })}
                    >
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-stone-400 uppercase mb-1">Segment</label>
                    <select 
                      className="input-field py-2 text-sm"
                      value={customerModal.user.segment}
                      onChange={(e) => handleUserUpdate(customerModal.user.id, { segment: e.target.value })}
                    >
                      <option value="retail">Retail</option>
                      <option value="wholesale">Wholesale</option>
                      <option value="vip">VIP</option>
                    </select>
                  </div>
                </div>

                <div className="bg-stone-50 p-6 rounded-2xl space-y-4">
                  <h4 className="font-bold text-stone-900 border-b border-stone-200 pb-2">Contact Info</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-bold text-stone-400 uppercase mb-1">Name</label>
                      <input 
                        type="text" 
                        className="input-field py-2 text-sm"
                        defaultValue={customerModal.user.name}
                        onBlur={(e) => handleUserUpdate(customerModal.user.id, { name: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-stone-400 uppercase mb-1">Phone</label>
                      <input 
                        type="text" 
                        className="input-field py-2 text-sm"
                        defaultValue={customerModal.user.phone}
                        onBlur={(e) => handleUserUpdate(customerModal.user.id, { phone: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-stone-400 uppercase mb-1">Email</label>
                      <input 
                        type="email" 
                        className="input-field py-2 text-sm"
                        defaultValue={customerModal.user.email}
                        onBlur={(e) => handleUserUpdate(customerModal.user.id, { email: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-stone-400 uppercase mb-1">Shop Name</label>
                      <input 
                        type="text" 
                        className="input-field py-2 text-sm"
                        defaultValue={customerModal.user.shop_name}
                        onBlur={(e) => handleUserUpdate(customerModal.user.id, { shop_name: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-stone-400 uppercase mb-1">Pin Code</label>
                      <input 
                        type="text" 
                        className="input-field py-2 text-sm"
                        defaultValue={customerModal.user.pin_code}
                        onBlur={(e) => handleUserUpdate(customerModal.user.id, { pin_code: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-stone-400 uppercase mb-1">Street Address</label>
                      <input 
                        type="text" 
                        className="input-field py-2 text-sm"
                        defaultValue={customerModal.user.street_address}
                        onBlur={(e) => handleUserUpdate(customerModal.user.id, { street_address: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-stone-400 uppercase mb-1">City</label>
                      <input 
                        type="text" 
                        className="input-field py-2 text-sm"
                        defaultValue={customerModal.user.city}
                        onBlur={(e) => handleUserUpdate(customerModal.user.id, { city: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-stone-400 uppercase mb-1">State</label>
                      <input 
                        type="text" 
                        className="input-field py-2 text-sm"
                        defaultValue={customerModal.user.state}
                        onBlur={(e) => handleUserUpdate(customerModal.user.id, { state: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="bg-primary/5 p-6 rounded-2xl space-y-4 border border-primary/10">
                  <div className="flex justify-between items-center">
                    <h4 className="font-bold text-primary">Khata Wallet</h4>
                    <div 
                      className={cn(
                        "w-12 h-6 rounded-full p-1 cursor-pointer transition-colors",
                        customerModal.user.khata_enabled ? "bg-primary" : "bg-stone-300"
                      )}
                      onClick={() => handleUserUpdate(customerModal.user.id, { khata_enabled: !customerModal.user.khata_enabled })}
                    >
                      <div className={cn("w-4 h-4 bg-white rounded-full transition-transform", customerModal.user.khata_enabled ? "translate-x-6" : "translate-x-0")} />
                    </div>
                  </div>
                  
                  {customerModal.user.khata_enabled && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-[10px] font-bold text-stone-400 uppercase mb-1">Khata Limit (₹)</label>
                        <input 
                          type="number" 
                          className="input-field py-2 text-sm"
                          defaultValue={customerModal.user.khata_limit}
                          onBlur={(e) => handleUserUpdate(customerModal.user.id, { khata_limit: e.target.value })}
                        />
                      </div>
                      <div className="p-4 bg-white rounded-xl border border-primary/10">
                        <p className="text-xs text-stone-500 mb-1">Current Balance</p>
                        <p className="text-2xl font-bold text-primary">₹{customerModal.user.khata_balance}</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="bg-stone-50 p-6 rounded-2xl space-y-4">
                  <h4 className="font-bold text-stone-900 border-b border-stone-200 pb-2">Wallet Balance</h4>
                  <div className="p-4 bg-white rounded-xl border border-stone-200">
                    <p className="text-xs text-stone-500 mb-1">Main Wallet</p>
                    <p className="text-2xl font-bold text-stone-900">₹{customerModal.user.wallet_balance}</p>
                  </div>
                  <div className="flex flex-col space-y-2">
                    <button 
                      onClick={() => setWalletModal({ open: true, userId: customerModal.user.id })}
                      className="w-full btn-primary py-2 text-sm"
                    >
                      Manage Funds
                    </button>
                    <button 
                      onClick={() => fetchCustomerOrders(customerModal.user.id)}
                      className="w-full py-2 text-sm border border-stone-200 rounded-xl font-bold hover:bg-stone-50 flex items-center justify-center space-x-2"
                    >
                      <History size={16} />
                      <span>View Order History</span>
                    </button>
                  </div>
                </div>

                <div className="bg-stone-50 p-6 rounded-2xl space-y-4">
                  <h4 className="font-bold text-stone-900 border-b border-stone-200 pb-2">Recent Transactions</h4>
                  <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                    {walletHistoryModal.userId === customerModal.user.id ? (
                      walletHistoryModal.history.map((tx: any) => (
                        <div key={tx.id} className="text-[10px] p-2 bg-white rounded border border-stone-100 flex justify-between">
                          <div>
                            <p className="font-bold">{tx.description}</p>
                            <p className="text-stone-400">ID: {tx.transaction_id || `TXN-${tx.id}`}</p>
                          </div>
                          <p className={tx.type === 'credit' ? 'text-emerald-600' : 'text-red-600'}>
                            {tx.type === 'credit' ? '+' : '-'}₹{tx.amount}
                          </p>
                        </div>
                      ))
                    ) : (
                      <button 
                        onClick={() => fetchWalletHistory(customerModal.user.id)}
                        className="text-xs text-primary font-bold hover:underline"
                      >
                        Load History
                      </button>
                    )}
                  </div>
                </div>

                <div className="bg-stone-50 p-6 rounded-2xl space-y-4">
                  <h4 className="font-bold text-stone-900 border-b border-stone-200 pb-2 flex items-center">
                    <ShieldCheck size={16} className="mr-2 text-stone-400" />
                    Security Activity Log
                  </h4>
                  <div className="space-y-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                    {customerActivities.length > 0 ? (
                      customerActivities.map((act: any) => (
                        <div key={act.id} className="text-[10px] p-2 bg-white rounded-lg border border-stone-100 space-y-1">
                          <div className="flex justify-between items-start">
                            <span className={cn(
                              "font-black uppercase tracking-tighter px-1.5 py-0.5 rounded",
                              act.severity === 'high' ? "bg-red-100 text-red-700" : 
                              act.severity === 'medium' ? "bg-amber-100 text-amber-700" :
                              "bg-blue-100 text-blue-700"
                            )}>
                              {act.type}
                            </span>
                            <span className="text-stone-300 font-mono">{new Date(act.date).toLocaleString()}</span>
                          </div>
                          <p className="text-stone-600 leading-normal">{act.details}</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-stone-400 py-4 text-center">No security activities logged</p>
                    )}
                  </div>
                </div>

                <div className="bg-red-50 p-6 rounded-2xl space-y-4 border border-red-100 mt-6">
                  <h4 className="font-bold text-red-700 border-b border-red-200 pb-2 flex items-center"><AlertTriangle size={16} className="mr-2" /> Danger Zone & safety measures</h4>
                  <div className="space-y-2 text-xs text-red-800">
                    <p><span className="font-bold">Account Created:</span> {customerModal.user.created_at ? new Date(customerModal.user.created_at).toLocaleString() : 'N/A'}</p>
                    <p><span className="font-bold">Last Known IP:</span> (Logged securely)</p>
                    <button 
                      onClick={async () => {
                        if(confirm('Are you absolutely sure? This will delete all user data and cannot be undone.')) {
                          try {
                            await fetch(`/api/admin/users/${customerModal.user.id}`, { method: 'DELETE' });
                            toast.success('User deleted securely');
                            setCustomerModal({ open: false, user: null });
                            fetchUsers();
                          } catch(e) {
                            toast.error('Failed to delete user');
                          }
                        }
                      }}
                      className="w-full mt-4 py-2 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-colors shadow-sm"
                    >
                      Delete User Account
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Order Detail Modal */}
      {reviewResponseModal.open && reviewResponseModal.review && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden"
          >
            <div className="p-6 border-b border-stone-100 flex justify-between items-center">
              <h3 className="text-xl font-bold">Respond to Review</h3>
              <button 
                onClick={() => setReviewResponseModal({ open: false, review: null })}
                className="p-2 hover:bg-stone-100 rounded-full text-stone-400 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="p-4 bg-stone-50 rounded-2xl border border-stone-100">
                <div className="flex justify-between items-start mb-2">
                  <p className="font-bold text-sm">{reviewResponseModal.review.user_name}</p>
                  <div className="flex text-amber-400">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={10} fill={i < reviewResponseModal.review.rating ? "currentColor" : "none"} />
                    ))}
                  </div>
                </div>
                <p className="text-sm text-stone-600 italic">"{reviewResponseModal.review.comment}"</p>
              </div>
              
              <div className="space-y-2">
                <label className="text-xs font-bold text-stone-400 uppercase tracking-wider">Your Response</label>
                <textarea 
                  className="w-full p-4 bg-stone-50 border border-stone-200 rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all min-h-[150px] text-sm"
                  placeholder="Write your response here..."
                  value={reviewResponse}
                  onChange={(e) => setReviewResponse(e.target.value)}
                />
              </div>
            </div>
            <div className="p-6 bg-stone-50 flex justify-end space-x-3">
              <button 
                onClick={() => setReviewResponseModal({ open: false, review: null })}
                className="px-6 py-2 text-stone-500 font-bold hover:text-stone-700 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleRespondReview}
                disabled={!reviewResponse}
                className="btn-primary px-8"
              >
                Submit Response
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {orderModal.open && orderModal.order && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl p-8 max-w-2xl w-full shadow-2xl overflow-y-auto max-h-[90vh]"
          >
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-2xl font-bold">Order #ORD-{orderModal.order.id}</h3>
                <p className="text-stone-500">{new Date(orderModal.order.created_at).toLocaleString()}</p>
              </div>
              <button onClick={() => setOrderModal({ open: false, order: null })} className="p-2 hover:bg-stone-100 rounded-full">
                <X size={24} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="bg-stone-50 p-6 rounded-2xl">
                  <h4 className="font-bold text-stone-900 mb-4">Status History</h4>
                  <div className="space-y-3">
                    {orderHistory.map((h: any, i: number) => (
                      <div key={i} className="flex justify-between text-sm">
                        <span className="font-medium capitalize">{h.status}</span>
                        <span className="text-stone-500">{new Date(h.timestamp).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-stone-50 p-6 rounded-2xl">
                  <h4 className="font-bold text-stone-900 mb-4">Order Items</h4>
                  <div className="space-y-3">
                    {orderModal.order.items?.map((item: any, i: number) => (
                      <div key={i} className="flex justify-between text-sm">
                        <div className="flex flex-col">
                          <span className="font-medium">{item.product_name || item.name}</span>
                          {item.variant_name && (
                            <span className="text-[10px] text-stone-400 font-bold uppercase tracking-wider">
                              Variant: {item.variant_name}
                            </span>
                          )}
                        </div>
                        <div className="text-right">
                          <span className="block text-stone-500 text-xs">{item.quantity} x ₹{item.price}</span>
                          <span className="font-bold">₹{item.price * item.quantity}</span>
                        </div>
                      </div>
                    ))}
                    <div className="border-t border-stone-200 pt-3 mt-3 space-y-2">
                      <div className="flex justify-between text-sm text-stone-500">
                        <span>Subtotal</span>
                        <span>₹{orderModal.order.subtotal || orderModal.order.total}</span>
                      </div>
                      {orderModal.order.discount > 0 && (
                        <div className="flex justify-between text-sm text-emerald-600">
                          <span>Discount</span>
                          <span>-₹{orderModal.order.discount}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-sm text-stone-500">
                        <span>Delivery Fee</span>
                        <span>₹{orderModal.order.delivery_fee || 0}</span>
                      </div>
                      <div className="pt-3 border-t border-stone-100 flex justify-between font-bold text-lg">
                        <span>Total</span>
                        <span className="text-primary">₹{orderModal.order.total}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-stone-50 p-6 rounded-2xl">
                  <h4 className="font-bold text-stone-900 mb-4">Payment & Verification</h4>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-stone-500 font-medium">Method</span>
                      <span className="font-bold uppercase tracking-wider text-primary">{orderModal.order.payment_method}</span>
                    </div>
                    {orderModal.order.payment_utr && (
                      <div className="p-3 bg-white border border-stone-100 rounded-xl">
                        <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-1">UPI Transaction ID (UTR)</p>
                        <p className="text-sm font-mono font-bold text-stone-800 break-all">{orderModal.order.payment_utr}</p>
                      </div>
                    )}
                    {orderModal.order.payment_ref && (
                      <div className="p-3 bg-white border border-stone-100 rounded-xl">
                        <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-1">System Payment Ref</p>
                        <p className="text-sm font-mono font-bold text-stone-800 break-all">{orderModal.order.payment_ref}</p>
                      </div>
                    )}
                    {orderModal.order.payment_screenshot && (
                      <div>
                        <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-2">Payment Proof</p>
                        <div className="relative group rounded-xl overflow-hidden bg-white border border-stone-100 aspect-video flex items-center justify-center">
                          <img src={orderModal.order.payment_screenshot} alt="Payment Proof" className="max-w-full max-h-full object-contain" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-4">
                             <a href={orderModal.order.payment_screenshot} target="_blank" rel="noreferrer" className="p-2 bg-white rounded-full text-stone-900 hover:scale-110 transition-transform">
                               <ExternalLink size={20} />
                             </a>
                          </div>
                        </div>
                      </div>
                    )}
                    {(orderModal.order.payment_method === 'wallet' || orderModal.order.wallet_used > 0) && (
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-stone-500 font-medium">Wallet Used</span>
                        <span className="font-bold text-emerald-600">₹{orderModal.order.wallet_used}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-stone-50 p-6 rounded-2xl">
                  <h4 className="font-bold text-stone-900 mb-4">Order Progress</h4>
                  <div className="relative pt-2 pb-6">
                    <div className="flex justify-between relative z-10">
                      {[
                        { id: 'pending', label: 'Placed', icon: CheckCircle2 },
                        { id: 'processing', label: 'Packed', icon: Package },
                        { id: 'shipped', label: 'Shipped', icon: Truck },
                        { id: 'delivered', label: 'Delivered', icon: Home },
                      ].map((step, i) => {
                        const statuses = ['pending', 'processing', 'shipped', 'delivered'];
                        const currentIndex = statuses.indexOf(orderModal.order.status);
                        const isActive = i <= currentIndex && currentIndex !== -1;
                        const isCurrent = i === currentIndex;
                        const Icon = step.icon;
                        
                        return (
                          <div key={step.id} className="flex flex-col items-center">
                            <motion.div 
                              animate={isCurrent ? { scale: [1, 1.05, 1] } : {}}
                              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                              className={`
                              w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500 border-2
                              ${isActive ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20' : 'bg-white border-stone-200 text-stone-300'}
                              ${isCurrent ? 'ring-4 ring-primary/20 scale-110' : ''}
                            `}>
                              <Icon size={18} />
                            </motion.div>
                            <span className={`
                              text-[10px] font-bold mt-3 uppercase tracking-wider
                              ${isActive ? 'text-primary' : 'text-stone-400'}
                            `}>
                              {step.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                    <div className="absolute top-[22px] left-8 right-8 h-[2px] bg-stone-200 -z-0">
                      <div 
                        className="h-full bg-primary transition-all duration-1000 ease-out" 
                        style={{ width: `${(Math.max(0, ['pending', 'processing', 'shipped', 'delivered'].indexOf(orderModal.order.status)) / 3) * 100}%` }}
                      />
                    </div>
                  </div>

                  <div className="mt-6 pt-6 border-t border-stone-100">
                    <h4 className="font-bold text-stone-900 mb-2">Delivery Info</h4>
                    {/* Status History */}
                  <div className="bg-stone-50 p-4 rounded-2xl mb-6">
                    <h4 className="font-bold text-stone-900 mb-3 text-sm">Status Update History</h4>
                    <div className="space-y-2">
                      {orderModal.statusHistory.map((h: any, i: number) => (
                        <div key={i} className="flex justify-between items-center text-xs">
                          <span className="font-medium text-stone-700 capitalize">{h.status}</span>
                          <span className="text-stone-400">{new Date(h.timestamp).toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                    
                    {orderModal.order.address && (
                      <div className="text-sm text-stone-600 space-y-1 mb-4 bg-white p-4 rounded-xl border border-stone-100">
                        {(() => {
                          try {
                            const addr = JSON.parse(orderModal.order.address);
                            return (
                              <>
                                <p className="font-bold text-stone-800">{addr.name}</p>
                                <p>{addr.phone}</p>
                                <p className="mt-1">{addr.address}</p>
                                <p>{addr.city}, {addr.state} {addr.pincode}</p>
                                {(orderModal.order.lat || addr.lat) && (
                                  <p className="text-xs text-primary font-mono mt-2">
                                    GPS: {(orderModal.order.lat || addr.lat).toFixed(4)}, {(orderModal.order.lng || addr.lng).toFixed(4)}
                                  </p>
                                )}
                              </>
                            );
                          } catch (e) {
                            return <p>{orderModal.order.address}</p>;
                          }
                        })()}
                      </div>
                    )}
                    
                    <p className="text-sm text-stone-600 mt-2"><span className="font-bold text-stone-800 mr-2">Notes:</span>{orderModal.order.notes || 'None provided'}</p>
                    {orderModal.order.rejection_reason && (
                      <div className="mt-4 p-3 bg-red-50 border border-red-100 rounded-xl">
                        <p className="text-[10px] font-black text-red-600 uppercase tracking-widest mb-1">Rejection Reason</p>
                        <p className="text-xs text-red-700 font-medium">{orderModal.order.rejection_reason}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-stone-50 p-6 rounded-2xl">
                  <h4 className="font-bold text-stone-900 mb-4">Shipment Tracking</h4>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      className="flex-1 p-4 bg-white border border-stone-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm"
                      placeholder="Enter Tracking ID..."
                      defaultValue={orderModal.order.tracking_id}
                      id={`tracking-id-${orderModal.order.id}`}
                    />
                    <button 
                      onClick={async () => {
                        const tracking_id = (document.getElementById(`tracking-id-${orderModal.order.id}`) as HTMLInputElement).value;
                        try {
                          const res = await fetch(`/api/admin/orders/${orderModal.order.id}/tracking`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ tracking_id })
                          });
                          if (res.ok) {
                            toast.success('Tracking ID saved');
                            setOrderModal({ 
                              ...orderModal, 
                              order: { ...orderModal.order, tracking_id } 
                            });
                          }
                        } catch (err) {
                          toast.error('Failed to save tracking ID');
                        }
                      }}
                      className="px-4 bg-primary text-white rounded-xl hover:bg-primary/90 font-bold text-xs"
                    >
                      Save
                    </button>
                  </div>
                </div>

                <div className="bg-stone-50 p-6 rounded-2xl">
                  <h4 className="font-bold text-stone-900 mb-4">Estimated Delivery</h4>
                  <input
                    type="datetime-local"
                    className="w-full p-4 bg-white border border-stone-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm"
                    defaultValue={orderModal.order.estimated_delivery_at ? new Date(orderModal.order.estimated_delivery_at).toISOString().slice(0, 16) : ''}
                    onBlur={async (e) => {
                      const value = e.target.value;
                      if (!value || value === (orderModal.order.estimated_delivery_at ? new Date(orderModal.order.estimated_delivery_at).toISOString().slice(0, 16) : '')) return;
                      
                      try {
                        const res = await fetch(`/api/admin/orders/${orderModal.order.id}/estimated-delivery`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ estimated_delivery_at: value })
                        });
                        if (res.ok) {
                          toast.success('Estimated delivery time updated');
                          setOrderModal({ 
                            ...orderModal, 
                            order: { ...orderModal.order, estimated_delivery_at: value } 
                          });
                          fetchOrders();
                        } else {
                          toast.error('Failed to update estimated delivery time');
                        }
                      } catch (err) {
                        toast.error('Failed to update. Check your connection.');
                      }
                    }}
                  />
                </div>
                
                <div className="bg-stone-50 p-6 rounded-2xl">
                  <h4 className="font-bold text-stone-900 mb-4">Internal Admin Notes</h4>
                  <textarea 
                    className="w-full p-4 bg-white border border-stone-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all min-h-[100px] text-sm"
                    placeholder="Add internal notes about this order..."
                    defaultValue={orderModal.order.admin_notes}
                    onBlur={async (e) => {
                      const notes = e.target.value;
                      if (notes === orderModal.order.admin_notes) return;
                      
                      try {
                        const res = await fetch(`/api/admin/orders/${orderModal.order.id}/notes`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ admin_notes: notes })
                        });
                        if (res.ok) {
                          toast.success('Notes saved');
                          setOrderModal({ 
                            ...orderModal, 
                            order: { ...orderModal.order, admin_notes: notes } 
                          });
                          fetchOrders();
                        } else {
                          toast.error('Failed to save notes');
                        }
                      } catch (err) {
                        console.error('Save notes error:', err);
                        toast.error('Failed to save notes. Check your connection.');
                      }
                    }}
                  />
                  <p className="text-[10px] text-stone-400 mt-2 italic">Notes are only visible to administrators.</p>
                </div>
                
                <div className="flex space-x-3 pt-6 border-t border-stone-100">
                  <button 
                    onClick={() => handlePrintInvoice(orderModal.order)}
                    className="flex-1 py-4 bg-stone-900 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-stone-800 flex items-center justify-center space-x-2 shadow-lg transition-all"
                  >
                    <Printer size={18} />
                    <span>Download/Print Invoice</span>
                  </button>
                </div>
              </div>

              <div className="space-y-6">
                <div className="bg-stone-50 p-6 rounded-2xl">
                  <h4 className="font-bold text-stone-900 mb-4">Payment Verification</h4>
                  <p className="text-xs font-bold text-stone-400 uppercase mb-2">Method: {orderModal.order.payment_method}</p>
                  
                  {orderModal.order.payment_screenshot ? (
                    <div className="space-y-4">
                      <div className="aspect-video rounded-xl overflow-hidden border border-stone-200 bg-white">
                        <img src={orderModal.order.payment_screenshot} alt="Payment Proof" className="w-full h-full object-contain" />
                      </div>
                      <p className="text-sm font-bold text-stone-700 text-center">Payment ID: {orderModal.order.payment_id || 'N/A'}</p>
                      
                      {orderModal.order.status === 'pending' && (
                        <div className="flex space-x-3">
                          <button 
                            onClick={async () => {
                              try {
                                const res = await fetch(`/api/admin/orders/${orderModal.order.id}/status`, {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ status: 'processing' })
                                });
                                if (res.ok) {
                                  toast.success('Order Approved');
                                  setOrderModal({ open: false, order: null });
                                  fetchOrders();
                                } else {
                                  toast.error('Failed to approve order');
                                }
                              } catch (err) {
                                console.error('Approve order error:', err);
                                toast.error('Error approving order');
                              }
                            }}
                            className="flex-1 bg-emerald-600 text-white py-2 rounded-xl font-bold hover:bg-emerald-700"
                          >
                            Approve
                          </button>
                          <button 
                            onClick={async () => {
                              const reason = prompt('Enter rejection reason:');
                              if (reason) {
                                try {
                                  const res = await fetch(`/api/admin/orders/${orderModal.order.id}/status`, {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ status: 'cancelled', rejection_reason: reason })
                                  });
                                  if (res.ok) {
                                    toast.error('Order Rejected');
                                    setOrderModal({ open: false, order: null });
                                    fetchOrders();
                                  } else {
                                    toast.error('Failed to reject order');
                                  }
                                } catch (err) {
                                  console.error('Reject order error:', err);
                                  toast.error('Error rejecting order');
                                }
                              }
                            }}
                            className="flex-1 bg-red-600 text-white py-2 rounded-xl font-bold hover:bg-red-700"
                          >
                            Reject
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-4 bg-amber-50 rounded-xl border border-amber-100 text-amber-700 text-sm italic text-center">
                      No payment proof uploaded yet.
                    </div>
                  )}
                </div>

                <div className="bg-stone-50 p-6 rounded-2xl">
                  <h4 className="font-bold text-stone-900 mb-4">Update Status</h4>
                  <select 
                    className="input-field py-2 text-sm"
                    value={orderModal.order.status}
                    onChange={async (e) => {
                      const newStatus = e.target.value;
                      await updateOrderStatus(orderModal.order.id, newStatus);
                      // Update local modal state to reflect the change
                      setOrderModal(prev => ({
                        ...prev,
                        order: { ...prev.order, status: newStatus }
                      }));
                    }}
                  >
                    <option value="pending">Pending</option>
                    <option value="processing">Processing</option>
                    <option value="shipped">Shipped</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
      {/* Customer History Modal */}
      {customerHistoryModal.open && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl p-8 max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold">Customer Order History</h3>
              <button 
                onClick={() => setCustomerHistoryModal({ ...customerHistoryModal, open: false })}
                className="p-2 hover:bg-stone-100 rounded-full text-stone-400"
              >
                <X size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto pr-2">
              {customerHistoryModal.orders.length === 0 ? (
                <div className="text-center py-12 text-stone-400">
                  <ShoppingBag size={48} className="mx-auto mb-4 opacity-20" />
                  <p>No orders found for this customer.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {customerHistoryModal.orders.map((order) => (
                    <div key={order.id} className="p-4 bg-stone-50 rounded-2xl border border-stone-100 flex justify-between items-center">
                      <div>
                        <div className="flex items-center space-x-2">
                          <p className="font-bold text-sm">#ORD-{order.id}</p>
                          {order.admin_notes && (
                            <StickyNote size={12} className="text-amber-500" title="Has internal notes" />
                          )}
                        </div>
                        <p className="text-[10px] text-stone-400 uppercase font-bold tracking-wider">
                          {new Date(order.created_at).toLocaleString()}
                        </p>
                        <span className={cn(
                          "text-[8px] font-bold px-1.5 py-0.5 rounded-full uppercase mt-1 inline-block",
                          order.status === 'delivered' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                        )}>
                          {order.status}
                        </span>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg">₹{order.total}</p>
                        <button 
                          onClick={() => {
                            fetchOrderDetailsModal(order);
                            setCustomerHistoryModal({ ...customerHistoryModal, open: false });
                          }}
                          className="text-xs text-primary font-bold hover:underline"
                        >
                          View Details
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}

      {/* Promotion Products Modal */}
      {promotionProductsModal.open && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl p-8 max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold">Link Products to Promotion</h3>
              <button 
                onClick={() => setPromotionProductsModal({ ...promotionProductsModal, open: false })}
                className="p-2 hover:bg-stone-100 rounded-full text-stone-400"
              >
                <X size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {allProducts.map((product) => {
                  const isLinked = linkedProductIds.includes(product.id);
                  return (
                    <div key={product.id} className="p-4 bg-stone-50 rounded-2xl border border-stone-100 flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <img src={product.image_url} className="w-10 h-10 rounded-lg object-cover" alt="" />
                        <div>
                          <p className="font-bold text-sm">{product.name}</p>
                          <p className="text-[10px] text-stone-400 font-bold uppercase">₹{product.price}</p>
                        </div>
                      </div>
                      <button 
                        onClick={async () => {
                          try {
                            if (isLinked) {
                              await fetch(`/api/admin/promotions/${promotionProductsModal.promotionId}/products/${product.id}`, { method: 'DELETE' });
                              setLinkedProductIds(prev => prev.filter(id => id !== product.id));
                              toast.success('Product unlinked');
                            } else {
                              await fetch(`/api/admin/promotions/${promotionProductsModal.promotionId}/products`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ product_id: product.id })
                              });
                              setLinkedProductIds(prev => [...prev, product.id]);
                              toast.success('Product linked');
                            }
                          } catch (err) {
                            toast.error('Failed to update promotion products');
                          }
                        }}
                        className={cn(
                          "px-3 py-1.5 rounded-xl text-xs font-bold transition-all",
                          isLinked ? "bg-red-50 text-red-600 hover:bg-red-100" : "bg-primary/10 text-primary hover:bg-primary/20"
                        )}
                      >
                        {isLinked ? 'Unlink' : 'Link'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-stone-100">
              <button 
                onClick={() => setPromotionProductsModal({ ...promotionProductsModal, open: false })}
                className="w-full py-4 bg-primary text-white rounded-2xl font-bold hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all"
              >
                Done
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Variant Modal */}
      {variantModal.open && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 sm:p-6 bg-stone-900/40 backdrop-blur-md">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-white rounded-[32px] p-6 sm:p-10 max-w-4xl w-full shadow-2xl flex flex-col max-h-[90vh] border border-stone-100 relative"
          >
            <div className="flex justify-between items-start mb-8">
              <div>
                <h3 className="text-3xl font-black text-stone-900 tracking-tight mb-2">Manage Variants</h3>
                <p className="text-sm text-stone-500 font-medium tracking-wide">Configure distinct pricing, stock, and multiple options for this product.</p>
              </div>
              <button 
                onClick={() => setVariantModal({ ...variantModal, open: false })}
                className="p-3 hover:bg-stone-100 rounded-full text-stone-400 hover:text-stone-700 transition-colors bg-stone-50"
              >
                <X size={20} className="stroke-[3]" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 -mr-2 space-y-4 rounded-xl">
              {productVariants.length === 0 ? (
                <div className="text-center py-16 bg-stone-50 rounded-[24px] border-2 border-dashed border-stone-200">
                  <Layers size={48} className="mx-auto text-stone-300 mb-4" />
                  <p className="text-stone-500 font-bold mb-2">No variants created</p>
                  <p className="text-xs text-stone-400 max-w-sm mx-auto">Add a variant to configure specific pricing or independent stock counts for different sizes, colors, or bundles.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-5">
                  {productVariants.map((v, i) => (
                    <div key={i} className="group p-5 bg-white rounded-2xl border border-stone-200 shadow-sm hover:border-primary/30 transition-all focus-within:border-primary/50 focus-within:ring-4 focus-within:ring-primary/5 relative">
                      <div className="flex flex-row sm:absolute sm:top-5 sm:right-5 mb-4 sm:mb-0 justify-between sm:justify-end items-center sm:space-x-4">
                         <label className="flex items-center space-x-2 cursor-pointer group/cb">
                           <input 
                             type="checkbox" 
                             checked={v.is_default === 1 || v.is_default === true}
                             onChange={(e) => {
                               const newVariants = productVariants.map((varnt, idx) => ({
                                 ...varnt,
                                 is_default: idx === i ? 1 : 0
                               }));
                               setProductVariants(newVariants);
                             }}
                             className="w-4 h-4 text-primary rounded ring-0 focus:ring-0 focus:outline-none border-stone-300 cursor-pointer" 
                           />
                           <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider group-hover/cb:text-stone-700 transition-colors">Default Variant</span>
                         </label>
                         <button 
                           onClick={() => {
                             const newVariants = productVariants.filter((_, idx) => idx !== i);
                             setProductVariants(newVariants);
                           }}
                           className="p-2 text-stone-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all ml-2 sm:ml-0"
                         >
                           <Trash2 size={16} className="stroke-[2.5]" />
                         </button>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-0 sm:mt-8">
                         <div>
                            <label className="block text-[10px] uppercase font-bold tracking-wider text-stone-400 mb-2 pl-1">Variant Name</label>
                            <input 
                              type="text" 
                              placeholder="e.g. 500g, Red, Combo" 
                              className="w-full bg-stone-50 border-none rounded-xl px-4 py-3 text-sm font-bold text-stone-800 placeholder-stone-300 focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all shadow-inner shadow-stone-100" 
                              value={v.name}
                              onChange={(e) => {
                                const newVariants = [...productVariants];
                                newVariants[i].name = e.target.value;
                                setProductVariants(newVariants);
                              }}
                            />
                         </div>
                         <div>
                            <label className="block text-[10px] uppercase font-bold tracking-wider text-stone-400 mb-2 pl-1">Price (₹)</label>
                            <input 
                              type="number" 
                              placeholder="0.00"
                              className="w-full bg-stone-50 border-none rounded-xl px-4 py-3 text-sm font-bold text-stone-800 placeholder-stone-300 focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all shadow-inner shadow-stone-100" 
                              value={v.price}
                              onChange={(e) => {
                                const newVariants = [...productVariants];
                                newVariants[i].price = e.target.value;
                                setProductVariants(newVariants);
                              }}
                            />
                         </div>
                         <div>
                            <label className="block text-[10px] uppercase font-bold tracking-wider text-stone-400 mb-2 pl-1">Unit Qty <span className="lowercase text-stone-300 font-medium">(multiplier)</span></label>
                            <input 
                              type="number" 
                              placeholder="1"
                              className="w-full bg-stone-50 border-none rounded-xl px-4 py-3 text-sm font-bold text-stone-800 placeholder-stone-300 focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all shadow-inner shadow-stone-100" 
                              value={v.unit_quantity}
                              onChange={(e) => {
                                const newVariants = [...productVariants];
                                newVariants[i].unit_quantity = parseInt(e.target.value) || 1;
                                setProductVariants(newVariants);
                              }}
                            />
                         </div>
                         <div>
                            <label className="block text-[10px] uppercase font-bold tracking-wider text-stone-400 mb-2 pl-1">Available Stock</label>
                            <input 
                              type="number" 
                              placeholder="0"
                              className="w-full bg-stone-50 border-none rounded-xl px-4 py-3 text-sm font-bold text-stone-800 placeholder-stone-300 focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all shadow-inner shadow-stone-100" 
                              value={v.stock}
                              onChange={(e) => {
                                const newVariants = [...productVariants];
                                newVariants[i].stock = e.target.value;
                                setProductVariants(newVariants);
                              }}
                            />
                         </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <button 
                onClick={() => setProductVariants([...productVariants, { name: '', price: '', stock: '', unit_quantity: 1, is_default: productVariants.length === 0 ? 1 : 0 }])}
                className="w-full py-5 border-2 border-dashed border-stone-200 rounded-[20px] text-stone-400 hover:border-primary/50 hover:text-primary hover:bg-primary/5 transition-all font-bold text-sm flex items-center justify-center space-x-2 group mt-6"
              >
                <Plus size={18} className="transition-transform group-hover:scale-110 group-hover:rotate-90 duration-300" />
                <span>Add Variant Option</span>
              </button>
            </div>

            <div className="mt-8 pt-6 border-t border-stone-100 flex space-x-4 shrink-0">
              <button 
                onClick={() => setVariantModal({ ...variantModal, open: false })}
                className="flex-1 py-4 bg-stone-100 text-stone-600 rounded-2xl font-bold hover:bg-stone-200 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={async () => {
                  try {
                    await fetch(`/api/admin/products/${variantModal.productId}/variants`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ variants: productVariants })
                    });
                    toast.success('Variants fully updated');
                    setVariantModal({ ...variantModal, open: false });
                  } catch (err) {
                    toast.error('Failed to update variants');
                  }
                }}
                className="flex-[2] py-4 bg-stone-900 text-white rounded-2xl font-bold hover:bg-stone-800 transition-colors shadow-xl shadow-stone-200"
              >
                Save All Variants
              </button>
            </div>
          </motion.div>
        </div>
      )}
      {/* Role Modal */}
      {roleModal.open && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-[32px] shadow-2xl w-full max-w-md p-8 overflow-hidden relative"
          >
            <button 
              onClick={() => setRoleModal({ ...roleModal, open: false })}
              className="absolute top-6 right-6 p-2 hover:bg-stone-100 rounded-full transition-colors"
            >
              <X size={20} className="text-stone-400" />
            </button>

            <div className="mb-8">
              <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mb-4">
                <Shield size={28} />
              </div>
              <h3 className="text-2xl font-bold">{roleModal.mode === 'add' ? 'Create New Role' : 'Edit Role'}</h3>
              <p className="text-stone-500 text-sm">Define permissions for this administrative role.</p>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-[10px] font-bold text-stone-400 uppercase mb-2 tracking-wider">Role Name</label>
                <input 
                  type="text" 
                  className="input-field py-3" 
                  placeholder="e.g., Order Manager"
                  value={newRole.name}
                  onChange={(e) => setNewRole({ ...newRole, name: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-stone-400 uppercase mb-3 tracking-wider">Permissions</label>
                  <div className="grid grid-cols-1 gap-3">
                  {[
                    { label: 'View Dashboard', value: 'view_dashboard' },
                    { label: 'Manage Orders', value: 'manage_orders' },
                    { label: 'Manage Products', value: 'manage_products' },
                    { label: 'Manage Users', value: 'manage_users' },
                    { label: 'View Analytics', value: 'view_analytics' },
                    { label: 'Manage Settings', value: 'manage_settings' },
                  ].map((perm) => (
                    <label key={perm.value} className="flex items-center space-x-3 p-3 bg-stone-50 rounded-xl cursor-pointer hover:bg-stone-100 transition-colors">
                      <input 
                        type="checkbox" 
                        className="rounded border-stone-300 text-primary focus:ring-primary"
                        checked={newRole.permissions.includes(perm.value as any)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setNewRole({ ...newRole, permissions: [...newRole.permissions, perm.value as any] });
                          } else {
                            setNewRole({ ...newRole, permissions: newRole.permissions.filter(p => p !== perm.value) });
                          }
                        }}
                      />
                      <span className="text-xs font-bold text-stone-700">{perm.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-stone-100 flex space-x-3">
              <button 
                onClick={() => setRoleModal({ ...roleModal, open: false })}
                className="flex-1 py-3 border border-stone-200 rounded-xl font-bold hover:bg-stone-50 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={async () => {
                  if (!newRole.name) return toast.error('Role name is required');
                  try {
                    const method = roleModal.mode === 'add' ? 'POST' : 'PUT';
                    const url = roleModal.mode === 'add' ? '/api/admin/roles' : `/api/admin/roles/${roleModal.role.id}`;
                    await fetch(url, {
                      method,
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(newRole)
                    });
                    toast.success(`Role ${roleModal.mode === 'add' ? 'created' : 'updated'}`);
                    setRoleModal({ ...roleModal, open: false });
                    fetch('/api/admin/roles').then(res => res.json()).then(setRoles);
                  } catch (err) {
                    toast.error('Failed to save role');
                  }
                }}
                className="flex-1 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all"
              >
                {roleModal.mode === 'add' ? 'Create Role' : 'Save Changes'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
