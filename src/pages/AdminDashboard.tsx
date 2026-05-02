import React, { useState, useEffect } from 'react';
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
  Calendar, X, Upload, History, Eye, Check, MessageCircle, Camera,
  MapPin, Phone, Globe, Shield, ShieldCheck, Bell, Database, RefreshCw, ShieldAlert,
  Image as ImageIcon, List, UserPlus, Send, Share2, ExternalLink,
  StickyNote, Truck, Home, Navigation
} from 'lucide-react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { useStore } from '../StoreContext';
import { cn, Order } from '../types';
import toast from 'react-hot-toast';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';

type Tab = 'Overview' | 'Analytics' | 'Orders' | 'Logistics' | 'Product Catalog' | 'Categories' | 'Customers' | 'Wallet Requests' | 'Reviews' | 'Coupons' | 'Roles' | 'Support' | 'Newsletter' | 'Expenses' | 'Store Settings' | 'Payment Settings' | 'System Status' | 'Suspicious Activities' | 'Promotions' | 'Bulk Discounts' | 'Suppliers' | 'Returns' | 'Audit Logs';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { user, adminTheme, setAdminTheme, simulatedRole, setSimulatedRole } = useStore();
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<Tab>('Overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [categoryBatchModal, setCategoryBatchModal] = useState({ open: false });
  const [newBatchCategory, setNewBatchCategory] = useState('');
  const [stats, setStats] = useState<any>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
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
  const [ordersViewMode, setOrdersViewMode] = useState<'table' | 'kanban'>('table');
  const [orderSortBy, setOrderSortBy] = useState<string>('date');
  const [orderSortOrder, setOrderSortOrder] = useState<'asc' | 'desc'>('desc');
  const [coupons, setCoupons] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<any[]>([]);
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [productModal, setProductModal] = useState({ open: false, mode: 'add' as 'add' | 'edit' });
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [productSearchTerm, setProductSearchTerm] = useState('');
  const [productSortBy, setProductSortBy] = useState<'name' | 'price' | 'stock'>('name');
  const [newProduct, setNewProduct] = useState({ 
    name: '', description: '', price: '', stock: '', category: 'Grocery', image: '', 
    retail_price: '', wholesale_price: '', discount: '0', reorder_point: '10', max_qty: '0', is_listed: true,
    images: [] as string[],
    specifications: {} as Record<string, string>
  });
  const [imageModal, setImageModal] = useState({ open: false, productId: null as number | null, images: [] as string[] });
  const [couponModal, setCouponModal] = useState({ open: false });
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
  const [orderModal, setOrderModal] = useState({ open: false, order: null as any });
  const [notifications, setNotifications] = useState<any[]>([]);
  const [notificationModal, setNotificationModal] = useState({ open: false });
  const [newNotification, setNewNotification] = useState({ title: '', message: '', type: 'ad' });
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
  const [promotionModal, setPromotionModal] = useState({ open: false, mode: 'add' as 'add' | 'edit', promotion: null as any });
  const [promotionProductsModal, setPromotionProductsModal] = useState({ open: false, promotionId: null as number | null });
  const [linkedProductIds, setLinkedProductIds] = useState<number[]>([]);
  const [newPromotion, setNewPromotion] = useState({ title: '', description: '', image_url: '', link: '', active: true });
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

  // Global Search State
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');
  const [globalSearchResults, setGlobalSearchResults] = useState<{ products: any[], orders: any[], users: any[], suspicious?: any[] } | null>(null);
  const [isGlobalSearching, setIsGlobalSearching] = useState(false);

  // Enhanced Product Filters
  const [productStockFilter, setProductStockFilter] = useState<'all' | 'low' | 'out'>('all');
  const [productDiscountFilter, setProductDiscountFilter] = useState<'all' | 'discounted'>('all');
  const [productCategoryFilter, setProductCategoryFilter] = useState<string>('all');
  const [productListedFilter, setProductListedFilter] = useState<'all' | 'listed' | 'unlisted'>('all');
  const [productDateFilter, setProductDateFilter] = useState<string>('');

  // Customer History State
  const [customerHistoryModal, setCustomerHistoryModal] = useState<{ open: boolean; userId: number | null; orders: any[] }>({ open: false, userId: null, orders: [] });

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

  const fetchAuditLogs = async () => {
    setIsFetchingAudit(true);
    try {
      const res = await fetch('/api/admin/audit-logs');
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

  useEffect(() => {
    if (activeTab === 'Logistics') {
      fetchRunners();
      fetchOrders();
    }
    if (activeTab === 'Audit Logs') {
      fetchAuditLogs();
    }
    if (activeTab === 'Suspicious Activities') {
      fetchSuspiciousActivities();
    }
  }, [activeTab]);

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
  const [bulkDiscounts, setBulkDiscounts] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [supplierModal, setSupplierModal] = useState({ open: false, mode: 'add' as 'add' | 'edit', supplier: null as any });
  const [newSupplier, setNewSupplier] = useState({ name: '', contact_person: '', email: '', phone: '', address: '' });
  const [returns, setReturns] = useState<any[]>([]);

  const fetchReturns = async () => {
    try {
      const res = await fetch('/api/admin/returns');
      if (res.ok) {
        const data = await res.json();
        setReturns(data);
      }
    } catch (err) {
      console.error('Failed to fetch returns:', err);
    }
  };

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

  const fetchBulkDiscounts = async () => {
    try {
      const res = await fetch('/api/admin/bulk-discounts');
      const data = await res.json();
      setBulkDiscounts(data);
    } catch (err) {
      console.error('Failed to fetch bulk discounts:', err);
    }
  };

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

  const handleGlobalSearch = async (query: string) => {
    setGlobalSearchQuery(query);
    if (!query || query.length < 2) {
      setGlobalSearchResults(null);
      return;
    }

    setIsGlobalSearching(true);
    try {
      const res = await fetch(`/api/admin/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      setGlobalSearchResults(data);
    } catch (err) {
      console.error('Global search error:', err);
    } finally {
      setIsGlobalSearching(false);
    }
  };

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
      (productStockFilter === 'out' && Number(product.stock) <= 0);
      
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

  useEffect(() => {
    if (activeTab === 'System Status') {
      fetchSystemLogs();
      fetchSuspiciousActivities();
    }
    if (activeTab === 'Store Settings' || activeTab === 'Payment Settings') {
      fetchConfig();
    }
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
    const subject = encodeURIComponent('Special Offers from Hind General Store');
    const body = encodeURIComponent('Hello,\n\nCheck out our latest offers and fresh arrivals!\n\nRegards,\nHind General Store');
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

  const fetchOrders = async () => {
    try {
      const params = new URLSearchParams();
      if (orderStatusFilter !== 'All') params.append('status', orderStatusFilter.toLowerCase());
      if (orderDateStart) params.append('startDate', orderDateStart);
      if (orderDateEnd) params.append('endDate', orderDateEnd);
      if (orderSearchTerm) params.append('search', orderSearchTerm);
      if (orderUserIdFilter) params.append('userId', orderUserIdFilter);
      params.append('sortBy', orderSortBy);
      params.append('sortOrder', orderSortOrder);
      
      const res = await fetch(`/api/admin/orders?${params.toString()}`);
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to fetch orders: ${res.status}`);
      }
      const data = await res.json();
      setOrders(data);
    } catch (err: any) {
      console.error('Orders fetch error:', err);
      toast.error(`Unable to load orders: ${err.message}`);
    }
  };

  useEffect(() => {
    if (activeTab === 'Orders') {
      fetchOrders();
    }
  }, [orderStatusFilter, orderUserIdFilter, orderDateStart, orderDateEnd, orderSearchTerm, orderSortBy, orderSortOrder, activeTab]);

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/admin/stats');
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to fetch stats: ${res.status}`);
      }
      const data = await res.json();
      setStats(data);
    } catch (err: any) {
      console.error('Stats fetch error:', err);
      toast.error(`Unable to load dashboard stats: ${err.message}`);
    }
  };

  const fetchOrderDetailsModal = async (order: any) => {
    try {
      const res = await fetch(`/api/orders/${order.id}`);
      if (!res.ok) throw new Error('Order not found');
      const orderDetails = await res.json();
      setOrderModal({ open: true, order: orderDetails });
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

  const fetchAnalytics = async () => {
    setIsFetchingAnalytics(true);
    try {
      const params = new URLSearchParams();
      if (analyticsStartDate) params.append('startDate', analyticsStartDate);
      if (analyticsEndDate) params.append('endDate', analyticsEndDate);
      if (analyticsCategory !== 'all') params.append('category', analyticsCategory);
      if (analyticsSegment !== 'all') params.append('segment', analyticsSegment);
      
      const res = await fetch(`/api/admin/analytics?${params.toString()}`);
      const data = await res.json();
      setAnalyticsData(data);
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
    if (user?.role !== 'admin') return;

    const loadData = async () => {
      setLoading(true);
      try {
        const safeFetch = async (url: string, defaultValue: any = []) => {
          try {
            const res = await fetch(url);
            if (res.status === 401 || res.status === 403) {
              const data = await res.json().catch(() => ({}));
              toast.error(`Access Denied for ${url}: ${data.message || 'Please log in again'}`);
              return defaultValue;
            }
            if (!res.ok) {
              console.warn(`Fetch failed for ${url}: ${res.status}`);
              return defaultValue;
            }
            const data = await res.json();
            return data;
          } catch (e) {
            console.error(`Fetch error for ${url}:`, e);
            return defaultValue;
          }
        };

        const [
          statsRes, ordersRes, configRes, usersRes, productsRes, categoriesRes,
          ticketsRes, newsletterRes, notificationsRes, couponsRes, expensesRes,
          reviewsRes, promotionsRes, areasRes, analyticsRes, rolesRes, runnersRes, auditLogsRes
        ] = await Promise.all([
          safeFetch('/api/admin/stats', { revenue: 0, orders: 0, users: 0, lowStock: 0, revenueByDay: [], topCategories: [] }),
          safeFetch('/api/admin/orders'),
          safeFetch('/api/admin/config'),
          safeFetch('/api/admin/users'),
          safeFetch('/api/products'),
          safeFetch('/api/categories'),
          safeFetch('/api/admin/support/tickets'),
          safeFetch('/api/admin/newsletter'),
          safeFetch('/api/notifications'),
          safeFetch('/api/admin/coupons'),
          safeFetch('/api/admin/expenses'),
          safeFetch('/api/admin/reviews'),
          safeFetch('/api/promotions'),
          safeFetch('/api/delivery-areas'),
          safeFetch('/api/admin/analytics', { dailyRevenue: [], categorySales: [], statusDistribution: [] }),
          safeFetch('/api/admin/roles'),
          safeFetch('/api/admin/runners'),
          safeFetch('/api/admin/audit-logs')
        ]);

        setStats(statsRes);
        setOrders(ordersRes);
        setConfig(configRes);
        setUsers(usersRes);
        setAllProducts(productsRes);
        setLowStockProducts(productsRes.filter((p: any) => p.stock <= (p.reorder_point || 5)));
        setCategories(categoriesRes);
        setTickets(ticketsRes);
        setNewsletter(newsletterRes);
        setNotifications(notificationsRes);
        setCoupons(couponsRes);
        setExpenses(expensesRes);
        setReviews(reviewsRes);
        setPromotions(promotionsRes);
        setDeliveryAreas(areasRes);
        setAnalyticsData(analyticsRes);
        setRoles(rolesRes);
        setRunners(runnersRes || []);
        setAuditLogs(auditLogsRes || []);
        
        if (Array.isArray(configRes)) {
          const tnc = configRes.find((c: any) => c.key === 'terms_and_conditions');
          if (tnc) setTncContent(tnc.value);
          const faq = configRes.find((c: any) => c.key === 'faq_content');
          if (faq) setFaqContent(faq.value);
          const df = configRes.find((c: any) => c.key === 'delivery_fee');
          if (df) setDeliveryFee(df.value);
          const fdt = configRes.find((c: any) => c.key === 'free_delivery_threshold');
          if (fdt) setFreeDeliveryThreshold(fdt.value);
        }
      } catch (err) {
        console.error('Failed to load admin data', err);
        toast.error('Some data failed to load');
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

  const handlePromotionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = promotionModal.mode === 'add' ? '/api/admin/promotions' : `/api/admin/promotions/${promotionModal.id}`;
    const method = promotionModal.mode === 'add' ? 'POST' : 'PUT';
    
    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPromotion)
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Promotion ${promotionModal.mode === 'add' ? 'added' : 'updated'} successfully`);
        setPromotionModal({ open: false, mode: 'add', id: null });
        setNewPromotion({ title: '', description: '', image_url: '', link: '', active: true });
        fetchPromotions();
      }
    } catch (err) {
      toast.error('Failed to save promotion');
    }
  };

  const togglePromotionStatus = async (id: number) => {
    try {
      const res = await fetch(`/api/admin/promotions/${id}/toggle`, { method: 'POST' });
      if (res.ok) {
        toast.success('Promotion status updated');
        fetchPromotions();
      }
    } catch (err) {
      toast.error('Failed to update status');
    }
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
          specifications: {}
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
        setNewNotification({ title: '', message: '', type: 'ad' });
        fetchNotifications();
      }
    } catch (err) {
      toast.error('Failed to send notification');
    }
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
    await fetch('/api/admin/coupons', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newCoupon)
    });
    toast.success('Coupon added');
    setCouponModal({ open: false });
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
      ]
    },
    {
      title: 'Inventory',
      items: [
        { name: 'Product Catalog' as Tab, icon: Package },
        { name: 'Categories' as Tab, icon: List },
        { name: 'Bulk Discounts' as Tab, icon: Tag },
      ]
    },
    {
      title: 'Sales & Logistics',
      items: [
        { name: 'Orders' as Tab, icon: ShoppingBag },
        { name: 'Payment Automation' as any, icon: ShieldCheck, path: '/admin/payments' },
        { name: 'Logistics' as Tab, icon: Truck },
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
        { name: 'Support' as Tab, icon: MessageSquare },
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
    'Overview', 'Analytics', 'Orders', 'Returns', 'Product Catalog', 'Categories', 'Customers', 'Wallet Requests', 'Reviews', 
    'Coupons', 'Bulk Discounts', 'Suppliers', 'Roles', 'Promotions', 'Support', 'Newsletter', 'Expenses', 'Store Settings', 
    'Payment Settings', 'System Status'
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
                    <h2 className="text-lg font-bold text-stone-800">Hind General Store</h2>
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
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 bg-white border-b border-stone-200 h-16 flex items-center justify-between px-4 z-50">
        <h1 className="text-2xl font-black text-stone-900 leading-none">Admin<span className="text-primary">.</span></h1>
        <button 
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 text-stone-500 hover:bg-stone-100 rounded-lg"
        >
          {sidebarOpen ? <X size={24} /> : <List size={24} />}
        </button>
      </div>

      {/* Sidebar Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 w-72 bg-white border-r border-stone-200 z-50 lg:sticky lg:block overflow-y-auto no-scrollbar transition-transform duration-300 lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="p-8 border-b border-stone-100">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center text-white shadow-xl shadow-primary/20 transform rotate-3">
              <span className="font-black text-2xl">H</span>
            </div>
            <div>
              <h1 className="text-2xl font-black text-stone-900 leading-none">Admin<span className="text-primary">.</span></h1>
              <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mt-1">Hind Store</p>
            </div>
          </div>
        </div>

        <nav className="p-4 space-y-8">
          {sidebarGroups.map((group, i) => (
            <div key={i}>
              <h3 className="px-4 text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-4">{group.title}</h3>
              <div className="space-y-1">
                {group.items.map((item) => (
                  <button
                    key={item.name}
                    onClick={() => {
                      if ((item as any).path) {
                        navigate((item as any).path);
                      } else {
                        setActiveTab(item.name);
                      }
                      setSidebarOpen(false);
                    }}
                    className={cn(
                      "w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-all",
                      activeTab === item.name
                        ? "bg-primary text-white shadow-lg shadow-primary/20"
                        : "text-stone-500 hover:bg-stone-50 hover:text-primary"
                    )}
                  >
                    <item.icon size={18} />
                    <span>{item.name}</span>
                  </button>
                ))}
                {group.title === 'Settings' && (
                  <Link
                    to="/admin/payments"
                    className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-all text-stone-500 hover:bg-stone-50 hover:text-primary"
                  >
                    <ShieldCheck size={18} />
                    <span>UPI Automation</span>
                  </Link>
                )}
              </div>
            </div>
          ))}
        </nav>

        <div className="p-4 mt-auto border-t border-stone-100">
          <div className="flex items-center space-x-3 p-3 bg-stone-50 rounded-2xl border border-stone-100">
            <div className="w-10 h-10 rounded-xl bg-white border border-stone-200 flex items-center justify-center overflow-hidden shadow-sm shrink-0">
              {user.profile_photo ? (
                <img src={user.profile_photo} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-primary font-black uppercase">{user?.name?.[0] || 'A'}</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-stone-900 truncate">{user.name}</p>
              <p className="text-[10px] text-primary uppercase font-black tracking-wider">{user.role}</p>
            </div>
            <Link to="/" className="p-2 text-stone-400 hover:text-primary transition-colors">
              <ExternalLink size={16} />
            </Link>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top Header (Desktop) */}
        <header className="hidden lg:flex h-20 bg-white border-b border-stone-200 items-center justify-between px-8 sticky top-0 z-40">
          <div className="flex items-center space-x-4">
            <h2 className="text-xl font-bold text-stone-900">{activeTab}</h2>
            <div className="flex items-center space-x-3 bg-white/50 backdrop-blur-md text-primary px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] border border-stone-100 shadow-sm">
              <div className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-accent"></span>
              </div>
              <span>Operational: North Hub</span>
            </div>
          </div>

          <div className="flex items-center space-x-6">
            {user?.role === 'admin' && (
              <div className="flex items-center space-x-2 bg-stone-50 px-3 py-1.5 rounded-xl border border-stone-100">
                <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Preview Mode</span>
                <select 
                  value={simulatedRole || 'admin'} 
                  onChange={(e) => setSimulatedRole(e.target.value === 'admin' ? null : e.target.value)}
                  className="bg-transparent text-xs font-bold text-stone-700 outline-none border-none focus:ring-0 cursor-pointer"
                >
                  <option value="admin">Default (Admin)</option>
                  <option value="customer">Customer View</option>
                  <option value="retailer">Retailer View</option>
                  <option value="wholesaler">Wholesaler View</option>
                </select>
              </div>
            )}
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
              <input 
                type="text" 
                placeholder="Global Search..."
                className="bg-stone-100 border-none rounded-xl pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-primary/20 w-64 transition-all focus:w-80"
                value={globalSearchQuery}
                onChange={(e) => handleGlobalSearch(e.target.value)}
              />
              
              {globalSearchResults && (
                <div className="absolute top-full right-0 mt-2 w-[400px] bg-white rounded-2xl shadow-2xl border border-stone-100 overflow-hidden z-50">
                  <div className="p-4 max-h-[500px] overflow-y-auto space-y-4">
                    {globalSearchResults.products.length > 0 && (
                      <div>
                        <h4 className="text-[10px] font-bold text-stone-400 uppercase mb-2 tracking-wider">Products</h4>
                        <div className="space-y-2">
                          {globalSearchResults.products.map(p => (
                            <button 
                              key={p.id} 
                              onClick={() => { setActiveTab('Product Catalog'); setProductSearchTerm(p.name); setGlobalSearchResults(null); setGlobalSearchQuery(''); }}
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
                    
                    {globalSearchResults.orders.length > 0 && (
                      <div>
                        <h4 className="text-[10px] font-bold text-stone-400 uppercase mb-2 tracking-wider">Orders</h4>
                        <div className="space-y-2">
                          {globalSearchResults.orders.map(o => (
                            <button 
                              key={o.id} 
                              onClick={() => { setActiveTab('Orders'); setOrderSearchTerm(`#ORD-${o.id}`); setGlobalSearchResults(null); setGlobalSearchQuery(''); }}
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
                    
                    {globalSearchResults.users.length > 0 && (
                      <div>
                        <h4 className="text-[10px] font-bold text-stone-400 uppercase mb-2 tracking-wider">Customers</h4>
                        <div className="space-y-2">
                          {globalSearchResults.users.map(u => (
                            <button 
                              key={u.id} 
                              onClick={() => { setActiveTab('Customers'); setGlobalSearchResults(null); setGlobalSearchQuery(''); }}
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
                    
                    {globalSearchResults.suspicious && globalSearchResults.suspicious.length > 0 && (
                      <div>
                        <h4 className="text-[10px] font-bold text-stone-400 uppercase mb-2 tracking-wider">Security Alerts</h4>
                        <div className="space-y-2">
                          {globalSearchResults.suspicious.map(s => (
                            <button 
                              key={s.id} 
                              onClick={() => { setActiveTab('Suspicious Activities'); setGlobalSearchResults(null); setGlobalSearchQuery(''); }}
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
                    
                    {globalSearchResults.products.length === 0 && globalSearchResults.orders.length === 0 && globalSearchResults.users.length === 0 && (!globalSearchResults.suspicious || globalSearchResults.suspicious.length === 0) && (
                      <div className="p-8 text-center">
                        <p className="text-sm text-stone-400">No results found for "{globalSearchQuery}"</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex items-center space-x-2">
              <button className="p-2 text-stone-400 hover:text-primary hover:bg-stone-50 rounded-lg transition-all relative">
                <Bell size={20} />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
              </button>
              <button className="p-2 text-stone-400 hover:text-primary hover:bg-stone-50 rounded-lg transition-all">
                <Settings size={20} />
              </button>
            </div>
          </div>
        </header>

        <main className="p-4 lg:p-8 pt-20 lg:pt-8">
        {activeTab === 'Overview' && (
          <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-3xl font-bold text-stone-900">Welcome back, {user.name.split(' ')[0]}!</h2>
                <p className="text-stone-500 mt-1">Here's what's happening with your store today.</p>
              </div>
              <div className="flex items-center space-x-3">
                <div className="bg-white px-4 py-2 rounded-xl border border-stone-200 shadow-sm flex items-center space-x-2">
                  <Calendar size={16} className="text-stone-400" />
                  <span className="text-sm font-bold text-stone-600">{new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                </div>
                <button 
                  onClick={() => fetchStats()}
                  className="p-2 bg-white border border-stone-200 rounded-xl text-stone-400 hover:text-primary hover:border-primary transition-all shadow-sm"
                >
                  <RefreshCw size={18} />
                </button>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { label: 'Total Revenue', value: `₹${stats?.revenue || 0}`, icon: <TrendingUp className="text-emerald-600" />, trend: '+12.5%', color: 'bg-emerald-50', iconBg: 'bg-emerald-100', sparklineData: stats?.revenueByDay || [], sparklineKey: 'revenue', sparklineColor: '#059669' },
                { label: 'Total Orders', value: stats?.orders || 0, icon: <ShoppingBag className="text-blue-600" />, trend: '+5.2%', color: 'bg-blue-50', iconBg: 'bg-blue-100', sparklineData: stats?.revenueByDay || [], sparklineKey: 'orders', sparklineColor: '#2563EB' },
                { label: 'Active Customers', value: stats?.users || 0, icon: <Users className="text-purple-600" />, trend: '+2.1%', color: 'bg-purple-50', iconBg: 'bg-purple-100' },
                { label: 'Low Stock Items', value: stats?.lowStock || 0, icon: <AlertTriangle className="text-amber-600" />, trend: 'Critical', color: 'bg-amber-50', iconBg: 'bg-amber-100' }
              ].map((stat, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-white p-6 rounded-3xl shadow-sm border border-stone-100 hover:shadow-md transition-all group relative overflow-hidden"
                >
                  <div className="flex justify-between items-start mb-4 relative z-10">
                    <div className={cn("p-3 rounded-2xl transition-colors", stat.iconBg)}>{stat.icon}</div>
                    <span className={cn("text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-lg", 
                      stat.trend === 'Critical' ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'
                    )}>
                      {stat.trend}
                    </span>
                  </div>
                  <p className="text-stone-400 text-xs font-bold uppercase tracking-widest relative z-10">{stat.label}</p>
                  <h3 className="text-3xl font-bold mt-1 group-hover:text-primary transition-colors relative z-10">{stat.value}</h3>
                  {stat.sparklineData && stat.sparklineData.length > 0 && (
                    <div className="absolute bottom-0 left-0 right-0 h-16 opacity-30 group-hover:opacity-100 transition-opacity pointer-events-none">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={stat.sparklineData}>
                          <Line type="monotone" dataKey={stat.sparklineKey} stroke={stat.sparklineColor} strokeWidth={2} dot={false} isAnimationActive={true} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>

            {/* Quick Actions Panel */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              className="grid grid-cols-2 lg:grid-cols-6 gap-4"
            >
              {[
                { label: 'Add Product', icon: <Plus size={18} />, action: () => { setActiveTab('Product Catalog'); setProductModal({ open: true, mode: 'add' }); }, color: 'text-primary bg-primary/10 hover:bg-primary hover:text-white' },
                { label: 'Review Orders', icon: <ShoppingBag size={18} />, action: () => setActiveTab('Orders'), color: 'text-blue-600 bg-blue-50 hover:bg-blue-600 hover:text-white' },
                { label: 'Coupons', icon: <Tag size={18} />, action: () => setActiveTab('Coupons'), color: 'text-amber-600 bg-amber-50 hover:bg-amber-600 hover:text-white' },
                { label: 'Payments', icon: <IndianRupee size={18} />, action: () => navigate('/admin/payments'), color: 'text-emerald-600 bg-emerald-50 hover:bg-emerald-600 hover:text-white' },
                { label: 'Customers', icon: <Users size={18} />, action: () => setActiveTab('User Management'), color: 'text-purple-600 bg-purple-50 hover:bg-purple-600 hover:text-white' },
                { label: 'Health', icon: <Activity size={18} />, action: () => setActiveTab('System Status'), color: 'text-stone-600 bg-stone-100 hover:bg-stone-600 hover:text-white' }
              ].map((action, i) => (
                <button
                  key={i}
                  onClick={action.action}
                  className={cn("flex flex-col items-center justify-center p-4 rounded-2xl transition-all duration-300 gap-2 border border-transparent hover:border-black/5 hover:shadow-sm", action.color)}
                >
                  <div className="p-2 rounded-xl bg-white/20">{action.icon}</div>
                  <span className="text-[10px] font-black uppercase tracking-widest">{action.label}</span>
                </button>
              ))}
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Recent Orders */}
              <div className="lg:col-span-2 bg-white rounded-3xl shadow-sm border border-stone-100 overflow-hidden">
                <div className="p-8 border-b border-stone-100 flex justify-between items-center bg-stone-50/30">
                  <div>
                    <h3 className="font-bold text-lg">Recent Orders</h3>
                    <p className="text-xs text-stone-400 mt-1">Latest transactions from your customers</p>
                  </div>
                  <button 
                    onClick={() => setActiveTab('Orders')}
                    className="text-primary text-xs font-black uppercase tracking-wider hover:underline flex items-center space-x-1"
                  >
                    <span>View All Orders</span>
                    <ChevronRight size={14} />
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-stone-50/50 text-stone-400 text-[10px] uppercase font-black tracking-widest">
                      <tr>
                        <th className="px-8 py-5">Order ID</th>
                        <th className="px-6 py-5">Customer</th>
                        <th className="px-6 py-5">Amount</th>
                        <th className="px-6 py-5">Status</th>
                        <th className="px-6 py-5">Date</th>
                        <th className="px-8 py-5"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {orders.slice(0, 5).map((order) => (
                        <tr key={order.id} className="hover:bg-stone-50/50 transition-colors group">
                          <td className="px-8 py-5 font-mono text-xs font-bold text-stone-400 group-hover:text-primary transition-colors">#ORD-{order.id}</td>
                          <td className="px-6 py-5">
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-stone-100 rounded-lg flex items-center justify-center text-stone-400 font-bold text-xs uppercase">
                                {order.user_name?.[0] || 'U'}
                              </div>
                              <div>
                                <p className="text-sm font-bold text-stone-900">{order.user_name}</p>
                                <p className="text-[10px] text-stone-400 font-medium">{order.user_phone}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-5 font-black text-sm text-stone-900">₹{order.total}</td>
                          <td className="px-6 py-5">
                            <span className={cn(
                              "text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg",
                              order.status === 'pending' ? 'bg-amber-50 text-amber-600' : 
                              order.status === 'delivered' ? 'bg-emerald-50 text-emerald-600' :
                              order.status === 'cancelled' ? 'bg-red-50 text-red-600' :
                              'bg-blue-50 text-blue-600'
                            )}>
                              {order.status}
                            </span>
                          </td>
                          <td className="px-6 py-5 text-xs font-bold text-stone-500">
                            {new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                          </td>
                          <td className="px-8 py-5 text-right">
                            <button 
                              onClick={() => fetchOrderDetailsModal(order)}
                              className="p-2 bg-stone-50 text-stone-400 hover:text-primary hover:bg-white hover:shadow-sm border border-transparent hover:border-stone-100 rounded-xl transition-all"
                            >
                              <Eye size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Top Selling Products */}
              <div className="bg-white rounded-3xl shadow-sm border border-stone-100 overflow-hidden flex flex-col">
                <div className="p-8 border-b border-stone-100 bg-stone-50/30">
                  <h3 className="font-bold text-lg">Top Selling Products</h3>
                  <p className="text-xs text-stone-400 mt-1">Based on recent order volume</p>
                </div>
                <div className="p-6 space-y-5 flex-1">
                  {stats?.topProducts?.map((prod: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between group">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-lg bg-stone-100 flex items-center justify-center text-[10px] font-black text-stone-400 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                          0{idx + 1}
                        </div>
                        <p className="text-sm font-bold text-stone-700 group-hover:text-stone-900 transition-colors">{prod.name}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-black text-emerald-600">{prod.sold}</span>
                        <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest leading-none">Sold</span>
                      </div>
                    </div>
                  ))}
                  {!stats?.topProducts?.length && <p className="text-xs text-stone-400 italic text-center py-8">Not enough data yet</p>}
                </div>
                <div className="p-6 bg-stone-50/50 mt-auto">
                   <button onClick={() => setActiveTab('Analytics')} className="w-full py-3 bg-white border border-stone-200 rounded-xl text-xs font-black uppercase tracking-widest text-stone-500 hover:border-primary hover:text-primary transition-all shadow-sm">
                      Full Sales Report
                   </button>
                </div>
              </div>

              {/* System Status */}
              <div className="bg-white rounded-3xl shadow-sm border border-stone-100 p-8 space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-lg">System Health</h3>
                  <Activity size={18} className="text-stone-400" />
                </div>
                <div className="space-y-4">
                  {[
                    { label: 'API Server', status: 'Healthy', color: 'bg-primary', icon: <Globe size={14} /> },
                    { label: 'Database', status: 'Connected', color: 'bg-primary', icon: <Database size={14} /> },
                    { label: 'SMS Gateway', status: 'Online', color: 'bg-primary', icon: <Phone size={14} /> },
                    { label: 'Payment Gateway', status: 'Maintenance', color: 'bg-amber-500', icon: <CreditCard size={14} /> }
                  ].map((sys, i) => (
                    <div key={i} className="flex items-center justify-between p-4 bg-stone-50 rounded-2xl border border-stone-100/50">
                      <div className="flex items-center space-x-3">
                        <div className="text-stone-400">{sys.icon}</div>
                        <span className="text-sm font-bold text-stone-700">{sys.label}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-[10px] font-black uppercase tracking-wider text-stone-500">{sys.status}</span>
                        <div className={cn("w-2 h-2 rounded-full animate-pulse", sys.color)} />
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="pt-6 border-t border-stone-100">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Security Alerts</h4>
                    {suspiciousActivities.length > 0 && <span className="w-2 h-2 bg-red-500 rounded-full animate-ping" />}
                  </div>
                  <div className="space-y-3">
                    {suspiciousActivities.slice(0, 3).map((alert) => (
                      <div key={alert.id} className="flex items-start space-x-3 p-3 rounded-xl bg-red-50/50 border border-red-100">
                        <Shield size={14} className="text-red-500 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-xs font-bold text-red-900 leading-tight">{alert.activity_type}</p>
                          <p className="text-[10px] text-red-700 line-clamp-1 mt-0.5">{alert.description}</p>
                        </div>
                      </div>
                    ))}
                    {suspiciousActivities.length === 0 && (
                      <p className="text-[10px] text-stone-400 italic text-center py-2">No active security alerts</p>
                    )}
                  </div>
                </div>

                <div className="pt-6 border-t border-stone-100">
                   <div className="flex items-center justify-between mb-4">
                    <h4 className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Recent Logs</h4>
                    <button onClick={() => setActiveTab('System Status')} className="text-[10px] font-bold text-stone-400 hover:text-primary">View All</button>
                  </div>
                  <div className="space-y-3">
                    {stats?.recentActivities?.map((log: any) => (
                      <div key={log.id} className="flex items-start space-x-3 p-3 rounded-xl bg-stone-50 border border-stone-100">
                        {log.level === 'error' ? <AlertTriangle size={14} className="text-red-500 mt-0.5 shrink-0" /> : <Activity size={14} className="text-stone-400 mt-0.5 shrink-0" />}
                        <div className="flex-1 min-w-0">
                          <p className={cn("text-xs font-bold leading-tight truncate", log.level === 'error' ? "text-red-900" : "text-stone-700")}>{log.message}</p>
                          <p className="text-[9px] text-stone-400 font-medium mt-1">{new Date(log.created_at).toLocaleString('en-IN')}</p>
                        </div>
                      </div>
                    ))}
                    {(!stats?.recentActivities || stats.recentActivities.length === 0) && (
                      <p className="text-[10px] text-stone-400 italic text-center py-2">No recent system activity</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Low Stock Alerts */}
              <div className="bg-white rounded-3xl shadow-sm border border-stone-100 overflow-hidden">
                <div className="p-8 border-b border-stone-100 flex justify-between items-center bg-stone-50/30">
                  <div>
                    <h3 className="font-bold text-lg">Low Stock Alerts</h3>
                    <p className="text-xs text-stone-400 mt-1">Items requiring immediate attention</p>
                  </div>
                  <span className="bg-amber-100 text-amber-700 text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-xl">
                    {lowStockProducts.length} Items
                  </span>
                </div>
                <div className="p-8 space-y-4">
                  {lowStockProducts.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle2 size={32} />
                      </div>
                      <p className="text-stone-500 font-bold">All products are well stocked!</p>
                      <p className="text-xs text-stone-400 mt-1">No low stock alerts at the moment.</p>
                    </div>
                  ) : (
                    lowStockProducts.map((product) => (
                      <div key={product.id} className="flex items-center justify-between p-4 bg-white rounded-2xl border border-stone-100 hover:border-amber-200 transition-all group">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-stone-50 rounded-xl border border-stone-100 flex items-center justify-center overflow-hidden group-hover:scale-105 transition-transform">
                            <img src={product.image_url} alt="" className="w-full h-full object-cover" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-stone-900">{product.name}</p>
                            <p className="text-[10px] text-stone-400 uppercase font-black tracking-widest">{product.category}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-black text-red-600">{product.stock} {product.unit} left</p>
                          <button 
                            onClick={() => { setActiveTab('Product Catalog'); setProductSearchTerm(product.name); }}
                            className="text-[10px] font-black uppercase tracking-wider text-primary hover:underline mt-1"
                          >
                            Restock Now
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'Audit Logs' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Audit Logs</h2>
              <button 
                onClick={fetchAuditLogs}
                disabled={isFetchingAudit}
                className="btn-stone px-4 py-2 flex items-center space-x-2"
              >
                <RefreshCw size={16} className={cn(isFetchingAudit && "animate-spin")} />
                <span>Refresh Logs</span>
              </button>
            </div>
            <div className="bg-white rounded-3xl shadow-sm border border-stone-100 overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-stone-50 text-stone-400 text-[10px] uppercase font-bold tracking-wider">
                  <tr>
                    <th className="px-6 py-4">Admin</th>
                    <th className="px-6 py-4">Action</th>
                    <th className="px-6 py-4">Details</th>
                    <th className="px-6 py-4">IP Address</th>
                    <th className="px-6 py-4">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-stone-50 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-bold text-sm text-stone-900">{log.admin_name || 'System'}</p>
                        <p className="text-[10px] text-stone-400">ID: {log.admin_id}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-[10px] font-black bg-stone-100 text-stone-800 px-2 py-1 rounded-lg uppercase tracking-wider">{log.action}</span>
                        <p className="text-[10px] text-stone-400 mt-1">{log.resource}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-xs text-stone-600 max-w-xs truncate" title={log.details}>{log.details}</p>
                      </td>
                      <td className="px-6 py-4 text-xs font-mono text-stone-400">{log.ip_address}</td>
                      <td className="px-6 py-4 text-xs text-stone-500">{new Date(log.created_at).toLocaleString()}</td>
                    </tr>
                  ))}
                  {auditLogs.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-stone-400 italic">No audit logs found</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'Logistics' && (
          <div className="space-y-8">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-3xl font-serif font-black text-stone-900">Logistics Control Tower</h2>
                <p className="text-stone-500">Monitor active deliveries and manage your runner fleet</p>
              </div>
              <div className="flex space-x-3">
                <button 
                  onClick={() => setRunnerModal({ open: true, mode: 'add', runner: null })}
                  className="btn-primary"
                >
                  <Plus size={18} className="mr-2" />
                  Add Runner
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Fleet Overview */}
              <div className="lg:col-span-1 space-y-6">
                <div className="bg-white p-6 rounded-3xl border border-stone-100 shadow-sm">
                  <h3 className="text-xs font-black text-stone-400 uppercase tracking-widest mb-6">Fleet Status</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                      <p className="text-2xl font-black text-emerald-600">{runners.filter(r => r.status === 'active').length}</p>
                      <p className="text-[10px] font-bold text-emerald-600/70 uppercase">Active</p>
                    </div>
                    <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100">
                      <p className="text-2xl font-black text-amber-600">{runners.filter(r => r.status === 'on_delivery').length}</p>
                      <p className="text-[10px] font-bold text-amber-600/70 uppercase">Engaged</p>
                    </div>
                  </div>
                  <button 
                    onClick={async () => {
                      try {
                        const activeRunners = runners.filter(r => r.status === 'on_delivery' || r.status === 'active');
                        if (activeRunners.length === 0) {
                          toast.error('No runners to simulate');
                          return;
                        }
                        const r = activeRunners[Math.floor(Math.random() * activeRunners.length)];
                        const newLat = (r.current_lat || 30.9010) + (Math.random() - 0.5) * 0.005;
                        const newLng = (r.current_lng || 75.8573) + (Math.random() - 0.5) * 0.005;
                        
                        const res = await fetch('/api/runners/location', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ runner_id: r.id, lat: newLat, lng: newLng })
                        });
                        if (res.ok) {
                          toast.success(`Simulation: ${r.name} moved!`);
                          fetchRunners();
                        }
                      } catch (err) {
                        toast.error('Simulation failed');
                      }
                    }}
                    className="w-full mt-4 py-2 bg-stone-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-stone-800 transition-all flex items-center justify-center space-x-2"
                  >
                    <Navigation size={12} />
                    <span>Simulate Random Movement</span>
                  </button>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-stone-100 shadow-sm max-h-[600px] overflow-y-auto custom-scrollbar">
                  <h3 className="text-xs font-black text-stone-400 uppercase tracking-widest mb-4">Runners List</h3>
                  <div className="space-y-3">
                    {runners.map(runner => (
                      <div key={runner.id} className="p-4 bg-stone-50 rounded-2xl border border-stone-100 group transition-all hover:bg-white hover:shadow-md hover:-translate-y-0.5">
                        <div className="flex justify-between items-start">
                          <div className="flex items-center space-x-3">
                            <div className={cn(
                              "w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold",
                              runner.status === 'active' ? "bg-emerald-500 shadow-emerald-200" : 
                              runner.status === 'on_delivery' ? "bg-amber-500 shadow-amber-200" : "bg-stone-300"
                            )}>
                              {runner.name[0]}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-stone-900">{runner.name}</p>
                              <p className="text-[10px] text-stone-400">{runner.vehicle_type} • {runner.phone}</p>
                            </div>
                          </div>
                          <div className={cn(
                            "text-[8px] font-black uppercase px-1.5 py-0.5 rounded-full border",
                            runner.status === 'active' ? "border-emerald-200 bg-emerald-50 text-emerald-600" : 
                            runner.status === 'on_delivery' ? "border-amber-200 bg-amber-50 text-amber-600" : "border-stone-200 bg-stone-100 text-stone-400"
                          )}>
                            {runner.status}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Map & Active Shipments */}
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-stone-900 rounded-[2.5rem] h-[400px] relative overflow-hidden group shadow-2xl">
                  {/* Mock Map Background */}
                  <div className="absolute inset-0 opacity-20 pointer-events-none">
                    <svg width="100%" height="100%" viewBox="0 0 1000 600" fill="none">
                      <path d="M100 100H900V500H100V100Z" stroke="white" strokeWidth="0.5" strokeDasharray="5 5" />
                      <path d="M200 0V600" stroke="white" strokeWidth="0.2" />
                      <path d="M400 0V600" stroke="white" strokeWidth="0.2" />
                      <path d="M600 0V600" stroke="white" strokeWidth="0.2" />
                      <path d="M800 0V600" stroke="white" strokeWidth="0.2" />
                      <path d="M0 150H1000" stroke="white" strokeWidth="0.2" />
                      <path d="M0 300H1000" stroke="white" strokeWidth="0.2" />
                      <path d="M0 450H1000" stroke="white" strokeWidth="0.2" />
                    </svg>
                  </div>
                  
                  {/* Store Pin */}
                  <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
                    <div className="bg-primary p-2 rounded-xl shadow-lg ring-4 ring-primary/20 z-10">
                      <Home size={20} className="text-white" />
                    </div>
                    <span className="text-[10px] font-black text-white uppercase mt-2 drop-shadow-md">Warehouse Hub</span>
                  </div>

                  {/* Runner Pins */}
                  {runners.filter(r => r.status !== 'offline').map((r, i) => (
                    <motion.div 
                      key={r.id}
                      animate={{ 
                        x: 100 + (Math.sin(Date.now()/5000 + i) * 300),
                        y: 100 + (Math.cos(Date.now()/5000 + i) * 150)
                      }}
                      className="absolute flex flex-col items-center cursor-help"
                      title={`${r.name} - ${r.status}`}
                    >
                      <div className={cn(
                        "p-1.5 rounded-full border-2 border-white shadow-lg",
                        r.status === 'on_delivery' ? "bg-amber-500" : "bg-emerald-500"
                      )}>
                        <Truck size={14} className="text-white" />
                      </div>
                      <div className="bg-black/80 backdrop-blur px-2 py-0.5 rounded text-[8px] font-bold text-white mt-1">
                        {r.name.split(' ')[0]}
                      </div>
                    </motion.div>
                  ))}

                  <div className="absolute top-6 left-6 flex items-center space-x-2 bg-black/40 backdrop-blur px-4 py-2 rounded-2xl border border-white/10">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
                    <span className="text-[10px] font-bold text-white uppercase tracking-widest">Live: Ludhiana Region</span>
                  </div>

                  <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between pointer-events-none">
                    <div className="bg-black/60 backdrop-blur p-4 rounded-2xl border border-white/10 text-white space-y-1">
                      <p className="text-[10px] font-bold text-white/50 uppercase">Network Status</p>
                      <p className="text-xs font-bold font-mono">LATENCY: 42ms | DISPATCH: OK</p>
                    </div>
                    <div className="bg-primary p-4 rounded-2xl border border-white/20 text-white flex items-center space-x-4 shadow-xl pointer-events-auto cursor-pointer hover:bg-primary/90 transition-all">
                      <div className="text-right">
                        <p className="text-[10px] font-bold text-white/70 uppercase">Dispatcher View</p>
                        <p className="text-xs font-black">TOGGLE HEATMAP</p>
                      </div>
                      <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                        <Activity size={18} />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-[2rem] border border-stone-100 shadow-sm overflow-hidden">
                  <div className="p-6 border-b border-stone-100 flex justify-between items-center">
                    <h3 className="text-lg font-bold">Priority Dispatches</h3>
                    <div className="flex items-center space-x-2">
                       <span className="w-2 h-2 bg-primary rounded-full" />
                       <span className="text-[10px] font-bold text-stone-400 uppercase">Awaiting Assignment</span>
                    </div>
                  </div>
                  <div className="divide-y divide-stone-100">
                    {orders.filter(o => o.status === 'processing').length === 0 ? (
                      <div className="p-12 text-center text-stone-400 italic">No orders ready for dispatch</div>
                    ) : (
                      orders.filter(o => o.status === 'processing').map(order => (
                        <div key={order.id} className="p-4 flex items-center justify-between hover:bg-stone-50 transition-colors">
                          <div className="flex items-center space-x-4">
                            <div className="p-3 bg-stone-100 text-stone-500 rounded-2xl">
                              <ShoppingBag size={20} />
                            </div>
                            <div>
                              <p className="font-bold text-sm">#ORD-{order.id} <span className="text-xs font-normal text-stone-400">• {order.user_name}</span></p>
                              <p className="text-[10px] text-stone-400">{order.address?.slice(0, 40)}...</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-4">
                            <select 
                              className="input-field text-[10px] py-1 px-3 min-w-[150px]"
                              onChange={(e) => handleAssignRunner(order.id, parseInt(e.target.value))}
                              defaultValue=""
                            >
                              <option value="" disabled>Assign Runner</option>
                              {runners.filter(r => r.status === 'active').map(r => (
                                <option key={r.id} value={r.id}>{r.name} ({r.vehicle_type})</option>
                              ))}
                            </select>
                            <button className="p-2 text-stone-400 hover:text-primary transition-colors">
                              <ExternalLink size={18} />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'Analytics' && analyticsData && (
          <div className="space-y-8">
            {/* Analytics Filters */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-stone-100 flex flex-wrap items-center gap-4">
              <div className="flex items-center space-x-2">
                <Calendar size={16} className="text-stone-400" />
                <input 
                  type="date" 
                  value={analyticsStartDate}
                  onChange={(e) => setAnalyticsStartDate(e.target.value)}
                  className="bg-stone-50 border-none rounded-xl px-3 py-2 text-xs font-bold focus:ring-2 focus:ring-primary/20"
                />
                <span className="text-stone-400">to</span>
                <input 
                  type="date" 
                  value={analyticsEndDate}
                  onChange={(e) => setAnalyticsEndDate(e.target.value)}
                  className="bg-stone-50 border-none rounded-xl px-3 py-2 text-xs font-bold focus:ring-2 focus:ring-primary/20"
                />
              </div>
              
              <div className="h-8 w-px bg-stone-100 hidden md:block" />
              
              <select 
                value={analyticsCategory}
                onChange={(e) => setAnalyticsCategory(e.target.value)}
                className="bg-stone-50 border-none rounded-xl px-4 py-2 text-xs font-bold focus:ring-2 focus:ring-primary/20"
              >
                <option value="all">All Categories</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.name}>{cat.name}</option>
                ))}
              </select>

              <select 
                value={analyticsSegment}
                onChange={(e) => setAnalyticsSegment(e.target.value)}
                className="bg-stone-50 border-none rounded-xl px-4 py-2 text-xs font-bold focus:ring-2 focus:ring-primary/20"
              >
                <option value="all">All Segments</option>
                <option value="Regular">Regular</option>
                <option value="Irregular">Irregular</option>
              </select>

              <button 
                onClick={() => {
                  setAnalyticsStartDate('');
                  setAnalyticsEndDate('');
                  setAnalyticsCategory('all');
                  setAnalyticsSegment('all');
                }}
                className="p-2 text-stone-400 hover:text-primary transition-colors"
                title="Reset Filters"
              >
                <RefreshCw size={18} className={isFetchingAnalytics ? "animate-spin" : ""} />
              </button>

              <button 
                className="ml-auto flex items-center space-x-2 bg-stone-900 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-stone-800 transition-all shadow-lg shadow-stone-900/10"
                onClick={() => {
                  const csvContent = "data:text/csv;charset=utf-8," 
                    + "Metric,Value\n"
                    + `Total Revenue,${analyticsData.totalSales || 0}\n`
                    + `Total Orders,${analyticsData.totalOrders || 0}\n`
                    + `Avg Order Value,${Math.round((analyticsData.totalSales || 0) / (analyticsData.totalOrders || 1))}\n`
                    + `Inventory Cost,${analyticsData.inventoryData?.total_cost || 0}\n`
                    + `Potential Revenue,${analyticsData.inventoryData?.potential_revenue || 0}`;
                  const encodedUri = encodeURI(csvContent);
                  const link = document.createElement("a");
                  link.setAttribute("href", encodedUri);
                  link.setAttribute("download", `analytics_report_${new Date().toISOString().split('T')[0]}.csv`);
                  document.body.appendChild(link);
                  link.click();
                }}
              >
                <Download size={16} />
                <span>Export CSV</span>
              </button>
            </div>

            {/* Top Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-stone-100">
                <p className="text-stone-400 text-xs font-black uppercase tracking-widest mb-1">Total Revenue</p>
                <h3 className="text-3xl font-black">₹{(analyticsData.totalSales || 0).toLocaleString()}</h3>
                <div className="mt-2 flex items-center text-emerald-500 text-xs font-bold">
                  <TrendingUp size={14} className="mr-1" />
                  <span>+{(Math.random() * 10 + 5).toFixed(1)}% vs last period</span>
                </div>
              </div>
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-stone-100">
                <p className="text-stone-400 text-xs font-black uppercase tracking-widest mb-1">Total Orders</p>
                <h3 className="text-3xl font-black">{analyticsData.totalOrders}</h3>
                <div className="mt-2 flex items-center text-emerald-500 text-xs font-bold">
                  <ShoppingBag size={14} className="mr-1" />
                  <span>{Math.round(analyticsData.totalOrders / (analyticsData.salesOverTime.length || 1))} orders / day avg</span>
                </div>
              </div>
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-stone-100">
                <p className="text-stone-400 text-xs font-black uppercase tracking-widest mb-1">Conversion Rate</p>
                <h3 className="text-3xl font-black">
                  {analyticsData.conversionData.length > 0 
                    ? (analyticsData.conversionData.reduce((acc: any, curr: any) => acc + curr.orders, 0) / 
                       analyticsData.conversionData.reduce((acc: any, curr: any) => acc + curr.visitors, 0) * 100).toFixed(1) 
                    : '0.0'}%
                </h3>
                <div className="mt-2 flex items-center text-stone-400 text-xs font-bold">
                  <Users size={14} className="mr-1" />
                  <span>Based on traffic data</span>
                </div>
              </div>
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-stone-100">
                <p className="text-stone-400 text-xs font-black uppercase tracking-widest mb-1">Avg Order Value</p>
                <h3 className="text-3xl font-black">₹{Math.round((analyticsData.totalSales || 0) / (analyticsData.totalOrders || 1)).toLocaleString()}</h3>
                <div className="mt-2 flex items-center text-primary text-xs font-bold">
                  <Activity size={14} className="mr-1" />
                  <span>Steady growth</span>
                </div>
              </div>
            </div>

            {/* Key Insights */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-emerald-50 p-6 rounded-3xl border border-emerald-100">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="p-2 bg-emerald-500 text-white rounded-xl">
                    <TrendingUp size={18} />
                  </div>
                  <h4 className="font-black text-emerald-900">Growth Insight</h4>
                </div>
                <p className="text-sm text-emerald-800 leading-relaxed">
                  Your revenue has grown by <strong>15%</strong> this month. The <strong>{analyticsData.salesByCategory[0]?.name || 'top'}</strong> category is driving most of your sales.
                </p>
              </div>
              <div className="bg-amber-50 p-6 rounded-3xl border border-amber-100">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="p-2 bg-amber-500 text-white rounded-xl">
                    <AlertTriangle size={18} />
                  </div>
                  <h4 className="font-black text-amber-900">Inventory Alert</h4>
                </div>
                <p className="text-sm text-amber-800 leading-relaxed">
                  <strong>{lowStockProducts.length} items</strong> are below reorder point. Restocking these could prevent potential revenue loss of <strong>₹{(lowStockProducts.length * 500).toLocaleString()}</strong>.
                </p>
              </div>
              <div className="bg-blue-50 p-6 rounded-3xl border border-blue-100">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="p-2 bg-blue-500 text-white rounded-xl">
                    <Users size={18} />
                  </div>
                  <h4 className="font-black text-blue-900">Customer Loyalty</h4>
                </div>
                <p className="text-sm text-blue-800 leading-relaxed">
                  <strong>{analyticsData.rfmSegmentData?.find((s: any) => s.name === 'Champions')?.value || 0} Champions</strong> identified. Consider a loyalty program to increase their lifetime value.
                </p>
              </div>
            </div>

            {/* Inventory Value Report */}
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-stone-100">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-xl font-black">Inventory Valuation</h3>
                  <p className="text-xs text-stone-400 mt-1">Current stock levels and financial exposure</p>
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
              <div className="bg-white p-8 rounded-3xl shadow-sm border border-stone-100">
                <div className="mb-8">
                  <h3 className="text-xl font-black">Customer Segments</h3>
                  <p className="text-xs text-stone-400 mt-1">Classification based on purchase behavior (RFM)</p>
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

              <div className="bg-white p-8 rounded-3xl shadow-sm border border-stone-100">
                <div className="mb-8">
                  <h3 className="text-xl font-black">Segment Performance</h3>
                  <p className="text-xs text-stone-400 mt-1">Revenue contribution by each segment</p>
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
              <div className="bg-white p-8 rounded-3xl shadow-sm border border-stone-100">
                <h3 className="text-xl font-black mb-8">Sales by Category</h3>
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
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-stone-100">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-xl font-black">RFM Customer Segmentation</h3>
                  <p className="text-xs text-stone-400 mt-1">Analysis of Recency, Frequency, and Monetary value</p>
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
              <div className="bg-white p-8 rounded-3xl shadow-sm border border-stone-100">
                <h3 className="text-xl font-black mb-8">Conversion Funnel</h3>
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
              <div className="bg-white p-8 rounded-3xl shadow-sm border border-stone-100">
                <h3 className="text-xl font-black mb-8">Acquisition Sources</h3>
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
            <div className="bg-white rounded-3xl shadow-sm border border-stone-100 overflow-hidden">
              <div className="p-8 border-b border-stone-100">
                <h3 className="text-xl font-black">Top Selling Products</h3>
                <p className="text-xs text-stone-400 mt-1">Performance breakdown of your best-performing inventory</p>
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
          <div className="space-y-8">
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-stone-100 flex justify-between items-center">
              <div>
                <h2 className="text-3xl font-black">Security & Audit Logs</h2>
                <p className="text-stone-500 mt-1">Detailed history of all administrative actions and security events.</p>
              </div>
              <div className="flex items-center space-x-2">
                <button 
                  onClick={() => fetchAuditLogs()}
                  className="p-3 bg-stone-50 text-stone-400 hover:text-primary rounded-2xl border border-stone-100 transition-all"
                >
                  <RefreshCw size={20} className={isFetchingAudit ? "animate-spin" : ""} />
                </button>
                <div className="h-10 w-px bg-stone-100 mx-2" />
                <button 
                  className="flex items-center space-x-2 bg-stone-900 text-white px-5 py-3 rounded-2xl text-xs font-bold hover:bg-stone-800 transition-all shadow-lg shadow-stone-900/10"
                >
                  <Download size={16} />
                  <span>Download Full Audit</span>
                </button>
              </div>
            </div>

            <div className="bg-white rounded-3xl shadow-sm border border-stone-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                   <thead className="bg-stone-50/50 text-stone-400 text-[10px] uppercase font-black tracking-widest">
                    <tr>
                      <th className="px-8 py-5">Admin</th>
                      <th className="px-6 py-5">Action</th>
                      <th className="px-6 py-5">Resource</th>
                      <th className="px-6 py-5">Details</th>
                      <th className="px-6 py-5">IP Address</th>
                      <th className="px-8 py-5 text-right">Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {auditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-stone-50/30 transition-colors group">
                        <td className="px-8 py-5">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-stone-100 rounded-lg flex items-center justify-center text-stone-400 font-bold uppercase text-xs">
                              {log.admin_name?.[0] || 'A'}
                            </div>
                            <span className="text-xs font-bold text-stone-900">{log.admin_name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <span className={cn(
                            "text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg",
                            log.action === 'DELETE' ? 'bg-red-50 text-red-600' :
                            log.action === 'PUT' ? 'bg-blue-50 text-blue-600' : 'bg-emerald-50 text-emerald-600'
                          )}>
                            {log.action}
                          </span>
                        </td>
                        <td className="px-6 py-5">
                           <span className="text-xs font-mono text-stone-500 bg-stone-50 px-2 py-1 rounded border border-stone-100">{log.resource}</span>
                        </td>
                        <td className="px-6 py-5 max-w-[200px]">
                           <p className="text-[10px] text-stone-400 font-mono truncate cursor-help" title={log.details}>{log.details}</p>
                        </td>
                        <td className="px-6 py-5">
                           <span className="text-[10px] font-bold text-stone-500">{log.ip_address}</span>
                        </td>
                        <td className="px-8 py-5 text-right text-[10px] font-bold text-stone-400">
                           {new Date(log.created_at).toLocaleString('en-IN')}
                        </td>
                      </tr>
                    ))}
                    {auditLogs.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-8 py-12 text-center text-stone-400 italic">No audit records found</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'Orders' && (
          <div className="space-y-6">
            <div className="flex flex-wrap gap-4 bg-white p-6 rounded-2xl shadow-sm border border-stone-100">
              <div className="flex-1 min-w-[200px] space-y-1">
                <label className="text-[10px] font-bold text-stone-400 uppercase">Search Orders</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={16} />
                  <input 
                    type="text" 
                    placeholder="Search by ID or Customer..."
                    className="input-field pl-10 py-2 text-sm"
                    value={orderSearchTerm}
                    onChange={(e) => setOrderSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-stone-400 uppercase">User ID</label>
                <input 
                  type="number" 
                  className="input-field py-2 text-sm"
                  placeholder="ID..."
                  value={orderUserIdFilter}
                  onChange={(e) => setOrderUserIdFilter(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-stone-400 uppercase">Status</label>
                <select 
                  className="input-field py-2 text-sm"
                  value={orderStatusFilter}
                  onChange={(e) => setOrderStatusFilter(e.target.value)}
                >
                  <option value="All">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="processing">Processing</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="failed">Failed</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-stone-400 uppercase">From Date</label>
                <input 
                  type="date" 
                  className="input-field py-2 text-sm"
                  value={orderDateStart}
                  onChange={(e) => setOrderDateStart(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-stone-400 uppercase">To Date</label>
                <input 
                  type="date" 
                  className="input-field py-2 text-sm"
                  value={orderDateEnd}
                  onChange={(e) => setOrderDateEnd(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-stone-400 uppercase">Sort By</label>
                <div className="flex items-center space-x-2">
                  <select 
                    className="input-field py-2 text-sm"
                    value={orderSortBy}
                    onChange={(e) => setOrderSortBy(e.target.value)}
                  >
                    <option value="date">Date</option>
                    <option value="id">Order ID</option>
                    <option value="customer">Customer</option>
                    <option value="total">Amount</option>
                    <option value="status">Status</option>
                  </select>
                  <button 
                    onClick={() => setOrderSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                    className="p-2 bg-stone-100 rounded-xl hover:bg-stone-200 transition-colors"
                    title={orderSortOrder === 'asc' ? 'Ascending' : 'Descending'}
                  >
                    {orderSortOrder === 'asc' ? <TrendingUp size={16} /> : <TrendingUp size={16} className="rotate-180" />}
                  </button>
                </div>
              </div>
              <button 
                onClick={() => {
                  setOrderStatusFilter('All');
                  setOrderDateStart('');
                  setOrderDateEnd('');
                  setOrderSearchTerm('');
                  setOrderSortBy('date');
                  setOrderSortOrder('desc');
                }}
                className="py-2 px-4 text-sm font-bold text-stone-500 hover:bg-stone-100 rounded-xl transition-colors"
              >
                Reset
              </button>
            </div>

            {selectedOrders.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-primary/5 border border-primary/20 p-4 rounded-2xl flex items-center justify-between"
              >
                <div className="flex items-center space-x-4">
                  <span className="text-sm font-bold text-primary">{selectedOrders.length} Orders Selected</span>
                  <div className="h-4 w-px bg-primary/20" />
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold text-stone-500 uppercase">Bulk Action:</span>
                    <select 
                      className="bg-white border border-stone-200 rounded-lg text-xs font-bold py-1.5 px-3 focus:ring-primary/20"
                      onChange={(e) => {
                        if (e.target.value === 'delete') {
                          handleBulkOrderAction('delete');
                        } else if (e.target.value === 'print_slips') {
                          toast.success('Generated packing slips for ' + selectedOrders.length + ' orders. Preparing Print...', { icon: '🖨️' });
                          setTimeout(() => window.print(), 1000);
                        } else if (e.target.value) {
                          handleBulkOrderAction('status', e.target.value);
                        }
                        e.target.value = '';
                      }}
                    >
                      <option value="">Select Action...</option>
                      <option value="print_slips">🖨️ Print Packing Slips</option>
                      <option value="processing">Mark as Processing</option>
                      <option value="shipped">Mark as Shipped</option>
                      <option value="delivered">Mark as Delivered</option>
                      <option value="cancelled">Mark as Cancelled</option>
                      <option value="delete">Delete Selected</option>
                    </select>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedOrders([])}
                  className="text-xs font-bold text-primary hover:underline"
                >
                  Clear Selection
                </button>
              </motion.div>
            )}

            <div className="bg-white rounded-2xl shadow-sm border border-stone-100 overflow-hidden">
              <div className="p-6 border-b border-stone-100 flex justify-between items-center bg-stone-50">
                <div className="flex items-center space-x-6">
                  <h3 className="font-bold text-lg">Filtered Orders</h3>
                  <div className="bg-white p-1 rounded-lg border border-stone-200 flex space-x-1 shadow-sm">
                    <button 
                      onClick={() => setOrdersViewMode('table')}
                      className={cn("p-1.5 rounded-md transition-colors", ordersViewMode === 'table' ? "bg-stone-100 text-stone-900 shadow-sm" : "text-stone-400 hover:text-stone-600")}
                    >
                      <List size={16} />
                    </button>
                    <button 
                      onClick={() => setOrdersViewMode('kanban')}
                      className={cn("p-1.5 rounded-md transition-colors", ordersViewMode === 'kanban' ? "bg-stone-100 text-stone-900 shadow-sm" : "text-stone-400 hover:text-stone-600")}
                    >
                      <LayoutDashboard size={16} />
                    </button>
                  </div>
                </div>
                <div className="text-xs font-bold text-stone-400 uppercase">
                  Showing {orders.filter(order => {
                    const matchesStatus = orderStatusFilter === 'All' || order.status === orderStatusFilter;
                    const orderDate = new Date(order.created_at).toISOString().split('T')[0];
                    const matchesStart = !orderDateStart || orderDate >= orderDateStart;
                    const matchesEnd = !orderDateEnd || orderDate <= orderDateEnd;
                    const matchesSearch = !orderSearchTerm || 
                      order.id.toString().includes(orderSearchTerm.replace('#ORD-', '')) ||
                      order.user_name?.toLowerCase().includes(orderSearchTerm.toLowerCase());
                    return matchesStatus && matchesStart && matchesEnd && matchesSearch;
                  }).length} orders
                </div>
              </div>
              
              {ordersViewMode === 'table' ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-stone-50 text-stone-400 text-[10px] uppercase font-bold tracking-wider">
                    <tr>
                      <th className="px-6 py-4">
                        <input 
                          type="checkbox" 
                          className="rounded border-stone-300 text-primary focus:ring-primary"
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedOrders(orders.map(o => o.id));
                            } else {
                              setSelectedOrders([]);
                            }
                          }}
                        />
                      </th>
                      <th className="px-6 py-4">Order ID</th>
                      <th className="px-6 py-4">Customer</th>
                      <th className="px-6 py-4">Amount</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4">Date</th>
                      <th className="px-6 py-4">Quick View</th>
                      <th className="px-6 py-4">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
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
                      .map((order) => (
                      <tr key={order.id} className={cn(selectedOrders.includes(order.id) && "bg-primary/5")}>
                        <td className="px-6 py-4">
                          <input 
                            type="checkbox" 
                            className="rounded border-stone-300 text-primary focus:ring-primary"
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
                        <td className="px-6 py-4 font-mono text-sm">
                          <div className="flex items-center space-x-2">
                            <span>#ORD-{order.id}</span>
                            {order.admin_notes && (
                              <StickyNote size={14} className="text-amber-500" title="Has internal notes" />
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm font-bold">{order.user_name || 'Guest Customer'}</p>
                          <p className="text-xs text-stone-400">
                            {order.user_phone || (order.address ? JSON.parse(order.address).phone : 'N/A')}
                          </p>
                        </td>
                        <td className="px-6 py-4 font-bold text-sm">₹{order.total}</td>
                        <td className="px-6 py-4">
                          <span className={cn(
                            "text-[10px] font-bold px-2 py-1 rounded-full uppercase",
                            order.status === 'delivered' ? 'bg-emerald-50 text-emerald-600' : 
                            order.status === 'cancelled' ? 'bg-red-50 text-red-600' : 
                            order.status === 'failed' ? 'bg-stone-900 text-white' : 'bg-amber-50 text-amber-600'
                          )}>
                            {order.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-xs text-stone-500">
                          {new Date(order.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 flex items-center space-x-2">
                          <div className="relative group">
                            <select 
                              className={cn(
                                "text-[10px] font-bold uppercase tracking-tight border rounded-lg p-2 pr-8 appearance-none cursor-pointer transition-all focus:ring-2 focus:ring-primary/20",
                                order.status === 'delivered' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                                order.status === 'cancelled' ? 'bg-red-50 text-red-600 border-red-100' : 
                                order.status === 'failed' ? 'bg-stone-900 text-white border-stone-800' : 
                                'bg-amber-50 text-amber-600 border-amber-100'
                              )}
                              value={order.status}
                              onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                            >
                              <option value="pending">Pending</option>
                              <option value="processing">Processing</option>
                              <option value="shipped">Shipped</option>
                              <option value="delivered">Delivered</option>
                              <option value="cancelled">Cancelled</option>
                              <option value="failed">Failed</option>
                            </select>
                            <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-50">
                              <ChevronRight size={12} className="rotate-90" />
                            </div>
                          </div>
                          <button 
                            onClick={() => fetchOrderDetailsModal(order)}
                            className="p-2.5 bg-stone-100 hover:bg-stone-200 rounded-xl text-stone-500 hover:text-primary transition-all shadow-sm"
                            title="View Details"
                          >
                            <Eye size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              ) : (
                <div className="p-6 bg-stone-100/50 overflow-x-auto min-h-[600px] flex gap-6">
                  {['pending', 'processing', 'shipped', 'delivered'].map((statusColumn) => (
                    <div key={statusColumn} className="w-80 flex-shrink-0 bg-stone-100/80 rounded-2xl p-4 flex flex-col border border-stone-200">
                      <div className="flex justify-between items-center mb-4 px-2">
                        <h4 className="font-bold text-stone-700 capitalize flex items-center space-x-2">
                          <span>{statusColumn}</span>
                          <span className="bg-stone-200 text-stone-600 text-xs px-2 py-0.5 rounded-full">
                            {orders.filter(o => o.status === statusColumn && (orderStatusFilter === 'All' || orderStatusFilter === o.status)).length}
                          </span>
                        </h4>
                      </div>
                      <div className="flex-1 overflow-y-auto space-y-3 px-1 custom-scrollbar pb-10">
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
                            className="bg-white p-4 rounded-xl shadow-sm border border-stone-200 cursor-pointer hover:shadow-md transition-shadow group relative"
                            onClick={() => fetchOrderDetailsModal(order)}
                          >
                             <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                {statusColumn !== 'delivered' && statusColumn !== 'cancelled' && (
                                  <select 
                                    className="text-xs bg-stone-50 border border-stone-200 rounded p-1"
                                    onClick={(e) => e.stopPropagation()}
                                    onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                                    value=""
                                  >
                                    <option value="" disabled>Move to...</option>
                                    {statusColumn === 'pending' && <option value="processing">Processing</option>}
                                    {statusColumn === 'processing' && <option value="shipped">Shipped</option>}
                                    {statusColumn === 'shipped' && <option value="delivered">Delivered</option>}
                                    <option value="cancelled">Cancelled</option>
                                  </select>
                                )}
                             </div>
                             <div className="flex justify-between items-start mb-2">
                               <span className="text-xs font-bold font-mono text-primary">#ORD-{order.id}</span>
                               <span className="text-xs font-bold text-stone-500">₹{order.total}</span>
                             </div>
                             <p className="text-sm font-bold text-stone-800 truncate mb-1">{order.user_name || 'Guest Customer'}</p>
                             <p className="text-[10px] text-stone-400 mb-1">{order.user_phone || (order.address ? JSON.parse(order.address).phone : 'No Phone')}</p>
                             <div className="text-[10px] text-stone-400 flex items-center justify-between mt-3 pt-3 border-t border-stone-100">
                               <span className="flex items-center space-x-1">
                                  <Clock size={12} />
                                  <span>{new Date(order.created_at).toLocaleDateString()}</span>
                               </span>
                               <span className={cn("px-2 py-0.5 rounded text-[9px] uppercase font-bold",
                                  order.payment_method === 'cod' ? "bg-amber-100 text-amber-600" : "bg-emerald-100 text-emerald-600"
                               )}>{order.payment_method}</span>
                             </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'Product Catalog' && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <h2 className="text-2xl font-bold">Product Catalog & Inventory</h2>
              
              <div className="flex flex-1 max-w-2xl items-center space-x-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
                  <input 
                    type="text" 
                    placeholder="Search products..."
                    className="input-field pl-10 pr-4 py-2.5"
                    value={productSearchTerm}
                    onChange={(e) => {
                      setProductSearchTerm(e.target.value);
                      fetchSearchSuggestions(e.target.value);
                    }}
                    onFocus={() => {
                        if (productSearchTerm) fetchSearchSuggestions(productSearchTerm);
                    }}
                  />
                  {searchSuggestions.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-stone-100 z-50 overflow-hidden">
                      {searchSuggestions.map((s, i) => (
                        <button 
                          key={i}
                          onClick={() => {
                            setProductSearchTerm(s);
                            setSearchSuggestions([]);
                          }}
                          className="w-full text-left px-4 py-3 hover:bg-stone-50 text-sm font-medium border-b border-stone-50 last:border-0"
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-3">
                {selectedProducts.length > 0 && (
                  <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center space-x-3 bg-primary/10 px-4 py-2 rounded-xl border border-primary/20"
                  >
                    <span className="text-sm font-bold text-primary mr-2">{selectedProducts.length} Selected</span>
                    <div className="flex items-center bg-white rounded-lg shadow-sm border border-primary/20 p-1">
                      <button 
                        onClick={() => bulkUnlist(false)}
                        className="flex items-center space-x-1 px-3 py-1.5 hover:bg-stone-50 rounded-md text-primary transition-colors text-xs font-bold"
                      >
                        <Check size={14} />
                        <span>List</span>
                      </button>
                      <button 
                        onClick={() => bulkUnlist(true)}
                        className="flex items-center space-x-1 px-3 py-1.5 hover:bg-stone-50 rounded-md text-primary transition-colors text-xs font-bold border-l border-stone-100"
                      >
                        <X size={14} />
                        <span>Unlist</span>
                      </button>
                      <button 
                        onClick={bulkUpdateStock}
                        className="flex items-center space-x-1 px-3 py-1.5 hover:bg-stone-50 rounded-md text-primary transition-colors text-xs font-bold border-l border-stone-100"
                      >
                        <RefreshCw size={14} />
                        <span>Stock</span>
                      </button>
                      <button 
                        onClick={bulkUpdateCategory}
                        className="flex items-center space-x-1 px-3 py-1.5 hover:bg-stone-50 rounded-md text-primary transition-colors text-xs font-bold border-l border-stone-100"
                      >
                        <Tag size={14} />
                        <span>Category</span>
                      </button>
                      <button 
                        onClick={bulkDelete}
                        className="flex items-center space-x-1 px-3 py-1.5 hover:bg-red-50 rounded-md text-red-600 transition-colors text-xs font-bold border-l border-stone-100"
                      >
                        <Trash2 size={14} />
                        <span>Delete</span>
                      </button>
                    </div>
                    <div className="w-px h-4 bg-primary/20 mx-2" />
                    <button 
                      onClick={() => setSelectedProducts([])}
                      className="text-xs font-bold text-primary hover:underline"
                    >
                      Clear
                    </button>
                  </motion.div>
                )}
                <div className="flex items-center space-x-2">
                  <button 
                    onClick={downloadTemplate}
                    className="p-2 text-stone-500 hover:text-primary hover:bg-stone-100 rounded-xl transition-all flex items-center space-x-2 text-sm font-bold"
                    title="Download CSV Template"
                  >
                    <Download size={18} />
                    <span className="hidden sm:inline">Template</span>
                  </button>
                  <label className="cursor-pointer p-2 text-stone-500 hover:text-primary hover:bg-stone-100 rounded-xl transition-all flex items-center space-x-2 text-sm font-bold">
                    <Upload size={18} />
                    <span className="hidden sm:inline">Bulk Upload</span>
                    <input 
                      type="file" 
                      accept=".csv" 
                      className="hidden" 
                      onChange={handleBulkUpload}
                      disabled={bulkUploadLoading}
                    />
                  </label>
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
                  className="bg-primary text-white px-6 py-2.5 rounded-xl font-bold flex items-center space-x-2 shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all active:scale-95 whitespace-nowrap"
                >
                  <Plus size={18} />
                  <span>Add Product</span>
                </button>
                {(productStockFilter === 'low' || productStockFilter === 'out') && (
                  <button 
                    onClick={() => {
                      const lowStockProducts = filteredProducts.filter(p => Number(p.stock) <= Number(p.reorder_point || 5));
                      
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
                    }}
                    className="bg-stone-800 text-white px-6 py-2.5 rounded-xl font-bold flex items-center space-x-2 shadow-lg shadow-stone-800/20 hover:bg-stone-700 transition-all active:scale-95 whitespace-nowrap"
                  >
                    <Receipt size={18} />
                    <span>Generate PO</span>
                  </button>
                )}
              </div>
            </div>

            {/* Enhanced Filters */}
            <div className="bg-white p-5 rounded-3xl shadow-sm border border-stone-100 flex flex-wrap items-center gap-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-stone-50 rounded-lg text-stone-400">
                  <Filter size={18} />
                </div>
                <span className="text-sm font-black text-stone-400 uppercase tracking-widest">Filters</span>
              </div>
              
              <div className="flex items-center space-x-3">
                <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Stock Level</label>
                <select 
                  className="bg-stone-50 border-stone-100 rounded-xl text-xs font-bold py-2 px-4 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  value={productStockFilter}
                  onChange={(e) => setProductStockFilter(e.target.value as any)}
                >
                  <option value="all">All Stock</option>
                  <option value="low">Low Stock</option>
                  <option value="out">Out of Stock</option>
                </select>
              </div>

              <div className="flex items-center space-x-3">
                <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Discount</label>
                <select 
                  className="bg-stone-50 border-stone-100 rounded-xl text-xs font-bold py-2 px-4 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  value={productDiscountFilter}
                  onChange={(e) => setProductDiscountFilter(e.target.value as any)}
                >
                  <option value="all">All Products</option>
                  <option value="discounted">Discounted Only</option>
                </select>
              </div>

              <div className="flex items-center space-x-3">
                <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Category</label>
                <select 
                  className="bg-stone-50 border-stone-100 rounded-xl text-xs font-bold py-2 px-4 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  value={productCategoryFilter}
                  onChange={(e) => setProductCategoryFilter(e.target.value)}
                >
                  <option value="all">All Categories</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.name}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center space-x-3">
                <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Status</label>
                <select 
                  className="bg-stone-50 border-stone-100 rounded-xl text-xs font-bold py-2 px-4 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  value={productListedFilter}
                  onChange={(e) => setProductListedFilter(e.target.value as any)}
                >
                  <option value="all">All Status</option>
                  <option value="listed">Listed</option>
                  <option value="unlisted">Unlisted</option>
                </select>
              </div>

              <div className="flex items-center space-x-3">
                <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Date</label>
                <input 
                  type="date"
                  className="bg-stone-50 border-stone-100 rounded-xl text-xs font-bold py-2 px-4 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  value={productDateFilter}
                  onChange={(e) => setProductDateFilter(e.target.value)}
                />
              </div>

              <div className="flex items-center space-x-3">
                <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Sort By</label>
                <select 
                  className="bg-stone-50 border-stone-100 rounded-xl text-xs font-bold py-2 px-4 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  value={productSortBy}
                  onChange={(e) => setProductSortBy(e.target.value as any)}
                >
                  <option value="name">Name</option>
                  <option value="price">Price</option>
                  <option value="stock">Stock</option>
                </select>
              </div>

              <button 
                onClick={() => {
                  setProductStockFilter('all');
                  setProductDiscountFilter('all');
                  setProductCategoryFilter('all');
                  setProductListedFilter('all');
                  setProductDateFilter('');
                  setProductSearchTerm('');
                  setProductSortBy('name');
                }}
                className="ml-auto text-[10px] font-black uppercase tracking-widest text-stone-400 hover:text-primary transition-colors flex items-center space-x-2"
              >
                <RefreshCw size={14} />
                <span>Reset Filters</span>
              </button>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-stone-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-stone-50 text-stone-400 text-[10px] uppercase font-bold tracking-wider">
                    <tr>
                      <th className="px-6 py-4 w-10">
                        <input 
                          type="checkbox" 
                          className="rounded border-stone-300 text-primary focus:ring-primary"
                          checked={selectedProducts.length === filteredProducts.length && filteredProducts.length > 0}
                          onChange={toggleAllProducts}
                        />
                      </th>
                      <th className="px-6 py-4">Product</th>
                      <th className="px-6 py-4">Category</th>
                      <th className="px-6 py-4">Retail Price</th>
                      <th className="px-6 py-4">Wholesale</th>
                      <th className="px-6 py-4">Stock</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {filteredProducts.map((product) => (
                      <tr key={product.id} className={cn(
                        "hover:bg-stone-50 transition-colors",
                        selectedProducts.includes(product.id) && "bg-primary/5"
                      )}>
                        <td className="px-6 py-4">
                          <input 
                            type="checkbox" 
                            className="rounded border-stone-300 text-primary focus:ring-primary"
                            checked={selectedProducts.includes(product.id)}
                            onChange={() => toggleProductSelection(product.id)}
                          />
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-3">
                            <img 
                              src={product.image_url || product.image} 
                              alt="" 
                              loading="lazy"
                              referrerPolicy="no-referrer"
                              className="w-10 h-10 rounded-lg object-cover" 
                            />
                            <div>
                              <p className="text-sm font-bold">{product.name}</p>
                              <p className="text-[10px] text-stone-400 line-clamp-1 max-w-[200px]">{product.description}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-xs bg-stone-100 px-2 py-1 rounded-md text-stone-600">
                            {product.category}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <p className={cn(
                              "text-sm font-bold",
                              product.discount > 0 ? "text-emerald-600" : "text-stone-900"
                            )}>
                              ₹{product.price}
                            </p>
                            {product.discount > 0 && product.retail_price && (
                              <p className="text-[10px] text-stone-400 line-through">₹{product.retail_price}</p>
                            )}
                            {product.discount > 0 && (
                              <span className="text-[9px] bg-emerald-50 text-emerald-600 font-black px-1.5 py-0.5 rounded uppercase mt-1 w-fit">
                                {product.discount}% OFF
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 font-bold text-sm text-stone-500">
                          ₹{product.wholesale_price || '-'}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2">
                            <span className={cn(
                              "text-sm font-bold",
                              product.stock <= (product.reorder_point || 5) ? "text-red-600" : "text-stone-900"
                            )}>
                              {product.stock}
                            </span>
                            {product.stock <= (product.reorder_point || 5) && (
                              <AlertTriangle size={14} className="text-amber-500" />
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={cn(
                            "text-[10px] font-bold px-2 py-1 rounded-full uppercase",
                            product.is_listed ? "bg-emerald-50 text-emerald-600" : "bg-stone-100 text-stone-400"
                          )}>
                            {product.is_listed ? 'Listed' : 'Unlisted'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end space-x-2">
                            <button 
                              onClick={() => {
                                setVariantModal({ open: true, productId: product.id });
                                fetchProductVariants(product.id);
                              }}
                              className="p-2 hover:bg-stone-100 text-stone-400 hover:text-primary rounded-lg transition-colors"
                              title="Manage Variants"
                            >
                              <List size={16} />
                            </button>
                            <button 
                              onClick={() => {
                                setEditingProduct(product);
                                setNewProduct({
                                  name: product.name,
                                  description: product.description,
                                  price: product.price.toString(),
                                  stock: product.stock.toString(),
                                  category: product.category,
                                  image: product.image_url || product.image,
                                  retail_price: product.retail_price?.toString() || '',
                                  wholesale_price: product.wholesale_price?.toString() || '',
                                  discount: product.discount?.toString() || '0',
                                  reorder_point: product.reorder_point?.toString() || '10',
                                  max_qty: product.max_qty?.toString() || '0',
                                  is_listed: product.is_listed,
                                  images: product.images || [],
                                  specifications: product.specifications || {},
                                  supplier_id: product.supplier_id?.toString() || ''
                                } as any);
                                setProductModal({ open: true, mode: 'edit' });
                              }}
                              className="p-2 hover:bg-primary/10 text-stone-400 hover:text-primary rounded-lg transition-colors"
                            >
                              <Settings size={16} />
                            </button>
                            <button 
                              onClick={() => deleteProduct(product.id)}
                              className="p-2 hover:bg-red-50 text-stone-400 hover:text-red-600 rounded-lg transition-colors"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {filteredProducts.length === 0 && (
                <div className="text-center py-20 bg-stone-50/50">
                  <Package size={48} className="mx-auto mb-4 text-stone-200" />
                  <p className="text-stone-500 font-medium">No products found matching your search.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'Roles' && (
          <div className="space-y-6">
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
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Product Categories</h2>
              <button 
                onClick={() => setCategoryModal({ open: true, mode: 'add' })}
                className="btn-primary flex items-center space-x-2"
              >
                <Plus size={18} />
                <span>Add Category</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {categories.map((cat) => (
                <div key={cat.id} className="bg-white p-6 rounded-2xl shadow-sm border border-stone-100 flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-stone-50 rounded-xl flex items-center justify-center text-primary">
                      <ImageIcon size={24} />
                    </div>
                    <div>
                      <h4 className="font-bold text-stone-900">{cat.name}</h4>
                      <p className={cn(
                        "text-[10px] font-bold uppercase",
                        cat.is_out_of_stock ? "text-red-500" : "text-emerald-500"
                      )}>
                        {cat.is_out_of_stock ? 'Out of Stock' : 'In Stock'}
                      </p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button 
                      onClick={() => {
                        setEditingCategory(cat);
                        setNewCategory({ name: cat.name, icon: cat.icon });
                        setCategoryModal({ open: true, mode: 'edit' });
                      }}
                      className="p-2 hover:bg-stone-100 rounded-lg text-stone-400"
                    >
                      <Settings size={16} />
                    </button>
                    <button className="p-2 hover:bg-red-50 rounded-lg text-stone-400 hover:text-red-600">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'Wallet Requests' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold">Wallet Top-up Requests</h2>
                <p className="text-stone-500">Review and approve customer wallet payments</p>
              </div>
              <button 
                onClick={fetchWalletRequests}
                className="p-2 hover:bg-stone-100 rounded-xl text-stone-400 hover:text-primary transition-all"
              >
                <RefreshCw size={20} />
              </button>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-stone-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-stone-50 text-stone-400 text-[10px] uppercase font-bold tracking-wider">
                    <tr>
                      <th className="px-6 py-4">Customer</th>
                      <th className="px-6 py-4">Amount</th>
                      <th className="px-6 py-4">Transaction ID</th>
                      <th className="px-6 py-4">Screenshot</th>
                      <th className="px-6 py-4">Date</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {walletRequests.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-stone-400">
                          No pending requests found
                        </td>
                      </tr>
                    ) : (
                      walletRequests.map((req) => (
                        <tr key={req.id} className="hover:bg-stone-50 transition-colors">
                          <td className="px-6 py-4">
                            <p className="text-sm font-bold">{req.user_name}</p>
                            <p className="text-xs text-stone-400">{req.user_phone}</p>
                          </td>
                          <td className="px-6 py-4 font-bold text-primary">₹{req.amount}</td>
                          <td className="px-6 py-4 text-xs font-mono">{req.transaction_id || 'N/A'}</td>
                          <td className="px-6 py-4">
                            {req.screenshot ? (
                              <button 
                                onClick={() => window.open(req.screenshot, '_blank')}
                                className="flex items-center space-x-1 text-xs text-primary font-bold hover:underline"
                              >
                                <ImageIcon size={14} />
                                <span>View Proof</span>
                              </button>
                            ) : (
                              <span className="text-xs text-stone-300">No Proof</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-xs text-stone-500">
                            {new Date(req.created_at).toLocaleString()}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex justify-end items-center space-x-2">
                              <button 
                                onClick={() => handleApproveWalletRequest(req.id)}
                                className="bg-emerald-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-emerald-600 transition-colors"
                              >
                                Approve
                              </button>
                              <button 
                                onClick={() => handleRejectWalletRequest(req.id)}
                                className="bg-red-50 text-red-600 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-red-100 transition-colors"
                              >
                                Reject
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
        {activeTab === 'Customers' && (
          <div className="bg-white rounded-2xl shadow-sm border border-stone-100 overflow-hidden">
            <div className="p-6 border-b border-stone-100 flex items-center justify-between">
              <h3 className="font-bold text-lg">Customer Management</h3>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-stone-500 font-medium">Segment:</span>
                <select 
                  className="input-field py-1"
                  value={selectedSegment}
                  onChange={(e) => setSelectedSegment(e.target.value)}
                >
                  {segments.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-stone-50 text-stone-400 text-[10px] uppercase font-bold tracking-wider">
                  <tr>
                    <th className="px-6 py-4">Customer</th>
                    <th className="px-6 py-4">Role / Segment</th>
                    <th className="px-6 py-4">Wallet</th>
                    <th className="px-6 py-4">Total Orders / Spent</th>
                    <th className="px-6 py-4">Khata Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-stone-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center overflow-hidden">
                            {u.profile_photo ? (
                              <img src={u.profile_photo} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <Users size={18} className="text-stone-400" />
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-bold">{u.name}</p>
                            <p className="text-xs text-stone-400">{u.phone}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-stone-600 uppercase">{u.role}</span>
                          <span className="text-[10px] text-stone-400">{u.segment}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-bold text-primary">₹{u.wallet_balance}</p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-stone-900">{(u as any).total_orders || 0} Orders</span>
                          <span className="text-[10px] text-stone-400 font-bold">LTV: ₹{(u as any).total_spent || 0}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {u.khata_enabled ? (
                          <div className="flex flex-col">
                            <span className="text-xs font-bold text-emerald-600">Enabled</span>
                            <span className="text-[10px] text-stone-400">Bal: ₹{u.khata_balance}</span>
                          </div>
                        ) : (
                          <span className="text-xs font-bold text-stone-300">Disabled</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end items-center space-x-2">
                          <button 
                            onClick={() => setCustomerModal({ open: true, user: u })}
                            className="p-2 hover:bg-stone-100 rounded-lg text-stone-400 hover:text-primary transition-all"
                            title="View Details"
                          >
                            <Eye size={16} />
                          </button>
                          <button 
                            onClick={() => fetchCustomerOrders(u.id)}
                            className="p-2 hover:bg-stone-100 rounded-lg text-stone-400 hover:text-primary transition-all"
                            title="Order History"
                          >
                            <ShoppingBag size={16} />
                          </button>
                          <a 
                            href={`https://wa.me/91${u.phone.replace(/[^0-9]/g, '').slice(-10)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 text-emerald-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                            title="WhatsApp Customer"
                          >
                            <MessageCircle size={16} />
                          </a>
                          <button 
                            onClick={() => setWalletModal({ open: true, userId: u.id })}
                            className="text-[10px] bg-primary text-white px-3 py-1.5 rounded-lg font-bold hover:bg-primary/90 transition-colors"
                          >
                            Wallet
                          </button>
                          <button 
                            onClick={() => fetchWalletHistory(u.id)}
                            className="p-2 text-stone-400 hover:text-primary hover:bg-stone-100 rounded-lg transition-all"
                            title="History"
                          >
                            <History size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'Promotions' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold">Promotion Management</h2>
                <p className="text-stone-500">Manage store-wide promotions and banners</p>
              </div>
              <button 
                onClick={() => {
                  setNewPromotion({ title: '', description: '', image_url: '', link: '', active: true });
                  setPromotionModal({ open: true, mode: 'add', id: null });
                }}
                className="btn-primary flex items-center space-x-2"
              >
                <Plus size={18} />
                <span>Add Promotion</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {promotions.map((promo) => (
                <div key={promo.id} className="bg-white rounded-3xl overflow-hidden shadow-sm border border-stone-100 group flex flex-col">
                  <div className="h-40 relative">
                    <img src={promo.image_url} alt="" className="w-full h-full object-cover" />
                    <div className="absolute top-2 left-2">
                      <span className={cn(
                        "px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider shadow-sm",
                        promo.active ? "bg-emerald-500 text-white" : "bg-stone-500 text-white"
                      )}>
                        {promo.active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <div className="absolute top-2 right-2 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => {
                          setNewPromotion({ 
                            title: promo.title, 
                            description: promo.description, 
                            image_url: promo.image_url, 
                            link: promo.link,
                            active: !!promo.active
                          });
                          setPromotionModal({ open: true, mode: 'edit', id: promo.id });
                        }}
                        className="p-2 bg-white text-stone-600 rounded-full hover:text-primary shadow-lg"
                      >
                        <Settings size={14} />
                      </button>
                      <button 
                        onClick={async () => {
                          if (confirm('Delete this promotion?')) {
                            await fetch(`/api/admin/promotions/${promo.id}`, { method: 'DELETE' });
                            fetchPromotions();
                          }
                        }}
                        className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 shadow-lg"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                  <div className="p-6 space-y-2 flex-1 flex flex-col">
                    <h3 className="font-bold">{promo.title}</h3>
                    <p className="text-xs text-stone-500 line-clamp-2 flex-1">{promo.description}</p>
                    <div className="pt-4 flex justify-between items-center">
                      <button 
                        onClick={() => togglePromotionStatus(promo.id)}
                        className={cn(
                          "text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-lg transition-colors",
                          promo.active ? "bg-stone-100 text-stone-600 hover:bg-stone-200" : "bg-emerald-100 text-emerald-600 hover:bg-emerald-200"
                        )}
                      >
                        {promo.active ? 'Deactivate' : 'Activate'}
                      </button>
                      <button 
                        onClick={() => setPromotionProductsModal({ open: true, promotionId: promo.id })}
                        className="text-primary text-xs font-bold hover:underline flex items-center space-x-1"
                      >
                        <Package size={12} />
                        <span>Link Products</span>
                      </button>
                      <a href={promo.link} target="_blank" className="text-primary text-xs font-bold hover:underline flex items-center space-x-1">
                        <span>Link</span>
                        <ExternalLink size={12} />
                      </a>
                    </div>
                  </div>
                </div>
              ))}
              {promotions.length === 0 && (
                <div className="col-span-full py-20 text-center bg-stone-50 rounded-3xl border-2 border-dashed border-stone-200">
                  <ImageIcon size={48} className="mx-auto text-stone-300 mb-4 opacity-20" />
                  <p className="text-stone-500 font-bold">No promotions found</p>
                  <p className="text-stone-400 text-sm">Add banners or offers to show here</p>
                </div>
              )}
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
          <div className="max-w-4xl space-y-8">
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-stone-100 space-y-6">
              <h3 className="text-xl font-bold">System Settings</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center justify-between p-4 bg-stone-50 rounded-2xl">
                  <div>
                    <p className="font-bold text-stone-900">Maintenance Mode</p>
                    <p className="text-xs text-stone-500">Bypass for admins or with secret token</p>
                  </div>
                  <button 
                    onClick={() => updateSetting('maintenance_mode', getSetting('maintenance_mode') === 'true' ? 'false' : 'true')}
                    className={cn(
                      "w-12 h-6 rounded-full transition-colors relative",
                      getSetting('maintenance_mode') === 'true' ? "bg-primary" : "bg-stone-200"
                    )}
                  >
                    <div className={cn(
                      "absolute top-1 w-4 h-4 bg-white rounded-full transition-all",
                      getSetting('maintenance_mode') === 'true' ? "left-7" : "left-1"
                    )} />
                  </button>
                </div>
                <div>
                  <label className="block text-sm font-bold text-stone-700 mb-1">Admin Phone Number</label>
                  <input 
                    type="text" 
                    className="input-field"
                    placeholder="e.g., +919876543210"
                    defaultValue={config.find(c => c.key === 'admin_phone')?.value}
                    onBlur={(e) => updateSetting('admin_phone', e.target.value)}
                  />
                  <p className="text-[10px] text-stone-400 mt-1">Used for admin login bypass and notifications.</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-8 rounded-3xl shadow-sm border border-stone-100 space-y-6">
              <h3 className="text-xl font-bold">Contact & Location</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-stone-700 mb-1">Store Phone Number</label>
                  <input 
                    type="text" 
                    className="input-field"
                    defaultValue={config.find(c => c.key === 'store_phone')?.value}
                    onBlur={(e) => updateSetting('store_phone', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-stone-700 mb-1">WhatsApp Number</label>
                  <input 
                    type="text" 
                    className="input-field"
                    defaultValue={config.find(c => c.key === 'whatsapp_number')?.value}
                    onBlur={(e) => updateSetting('whatsapp_number', e.target.value)}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-stone-700 mb-1">WhatsApp Default Message</label>
                  <input 
                    type="text" 
                    className="input-field"
                    defaultValue={config.find(c => c.key === 'whatsapp_message')?.value}
                    onBlur={(e) => updateSetting('whatsapp_message', e.target.value)}
                  />
                  <p className="text-xs text-stone-400 mt-1">This message will be pre-filled when customers click the WhatsApp link.</p>
                </div>
                <div>
                  <label className="block text-sm font-bold text-stone-700 mb-1">Google Maps Link</label>
                  <input 
                    type="text" 
                    className="input-field"
                    placeholder="https://goo.gl/maps/..."
                    defaultValue={config.find(c => c.key === 'store_location')?.value}
                    onBlur={(e) => updateSetting('store_location', e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="bg-white p-8 rounded-3xl shadow-sm border border-stone-100 space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold">Delivery Settings</h3>
                <button 
                  onClick={async () => {
                    await updateSetting('delivery_fee', deliveryFee);
                    await updateSetting('free_delivery_threshold', freeDeliveryThreshold);
                    toast.success('Delivery settings saved');
                  }}
                  className="btn-primary py-2 px-6 text-sm"
                >
                  Save Delivery Settings
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-stone-400 uppercase tracking-wider">Default Delivery Fee (₹)</label>
                  <input 
                    type="number" 
                    className="input-field" 
                    value={deliveryFee}
                    onChange={(e) => setDeliveryFee(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-stone-400 uppercase tracking-wider">Free Delivery Threshold (₹)</label>
                  <input 
                    type="number" 
                    className="input-field" 
                    value={freeDeliveryThreshold}
                    onChange={(e) => setFreeDeliveryThreshold(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="bg-white p-8 rounded-3xl shadow-sm border border-stone-100 space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold">Delivery Areas</h3>
                <button 
                  onClick={() => {
                    setDeliveryAreaModal({ open: true, mode: 'add', area: null });
                    setNewDeliveryArea({ name: '', fee: '0', min_order: '0' });
                  }}
                  className="btn-primary py-2 px-6 text-sm flex items-center space-x-2"
                >
                  <Plus size={16} />
                  <span>Add Area</span>
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-stone-50 text-stone-400 text-[10px] uppercase font-bold tracking-wider">
                    <tr>
                      <th className="px-6 py-4">Area Name</th>
                      <th className="px-6 py-4">Delivery Fee</th>
                      <th className="px-6 py-4">Min Order for Fee</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {deliveryAreas.map((area) => (
                      <tr key={area.id} className="hover:bg-stone-50 transition-colors">
                        <td className="px-6 py-4 font-bold text-sm">{area.name}</td>
                        <td className="px-6 py-4 text-sm">₹{area.fee}</td>
                        <td className="px-6 py-4 text-sm">₹{area.min_order}</td>
                        <td className="px-6 py-4 text-right space-x-2">
                          <button 
                            onClick={() => {
                              setDeliveryAreaModal({ open: true, mode: 'edit', area });
                              setNewDeliveryArea({ name: area.name, fee: area.fee.toString(), min_order: area.min_order.toString() });
                            }}
                            className="p-2 text-stone-400 hover:text-primary transition-colors"
                          >
                            <Settings size={16} />
                          </button>
                          <button 
                            onClick={() => handleDeleteDeliveryArea(area.id)}
                            className="p-2 text-stone-400 hover:text-red-500 transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {deliveryAreas.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-6 py-8 text-center text-stone-400 italic">No delivery areas configured</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-white p-8 rounded-3xl shadow-sm border border-stone-100 space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold">Terms & Conditions Editor</h3>
                <div className="flex items-center space-x-4">
                  <Link to="/terms-and-conditions" target="_blank" className="text-xs font-bold text-primary hover:underline flex items-center space-x-1">
                    <span>View Page</span>
                    <ExternalLink size={12} />
                  </Link>
                  <button 
                    onClick={() => updateSetting('terms_and_conditions', tncContent)}
                    className="btn-primary py-2 px-6 text-sm"
                  >
                    Save T&C Changes
                  </button>
                </div>
              </div>
              <div className="quill-editor-container">
                <ReactQuill 
                  theme="snow"
                  value={tncContent}
                  onChange={setTncContent}
                  className="bg-white rounded-2xl overflow-hidden border border-stone-200"
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

              <div className="space-y-6 pt-12 border-t border-stone-100">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-bold">Frequently Asked Questions (FAQ)</h3>
                  <div className="flex items-center space-x-4">
                    <Link to="/support" target="_blank" className="text-xs font-bold text-primary hover:underline flex items-center space-x-1">
                      <span>View Support Page</span>
                      <ExternalLink size={12} />
                    </Link>
                    <button 
                      onClick={() => updateSetting('faq_content', faqContent)}
                      className="btn-primary py-2 px-6 text-sm"
                    >
                      Save FAQ Changes
                    </button>
                  </div>
                </div>
                <div className="quill-editor-container">
                  <ReactQuill 
                    theme="snow"
                    value={faqContent}
                    onChange={setFaqContent}
                    className="bg-white rounded-2xl overflow-hidden border border-stone-200"
                    modules={{
                      toolbar: [
                        [{ 'header': [1, 2, 3, false] }],
                        ['bold', 'italic', 'underline', 'strike'],
                        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                        ['link', 'clean']
                      ],
                    }}
                  />
                  <p className="text-xs text-stone-400 mt-4">Manage the FAQs displayed on the customer support page. Add categories, questions, and detailed answers.</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-8 rounded-3xl shadow-sm border border-stone-100 space-y-6">
              <h3 className="text-xl font-bold">Admin Dashboard Theme</h3>
              <p className="text-sm text-stone-500">Customize the appearance of your admin panel.</p>
              
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
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
                      "flex flex-col items-center p-4 rounded-2xl border-2 transition-all group",
                      adminTheme === t.id ? "border-primary bg-primary/5" : "border-stone-100 hover:border-stone-200"
                    )}
                  >
                    <div 
                      className="w-10 h-10 rounded-full mb-3 shadow-inner" 
                      style={{ backgroundColor: t.color }}
                    />
                    <span className={cn(
                      "text-xs font-bold",
                      adminTheme === t.id ? "text-primary" : "text-stone-600"
                    )}>
                      {t.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white p-8 rounded-3xl shadow-sm border border-stone-100 space-y-6">
              <h3 className="text-xl font-bold">General Settings</h3>
              
              <div className="flex items-center justify-between p-4 bg-stone-50 rounded-2xl">
                <div>
                  <p className="font-bold">Maintenance Mode</p>
                  <p className="text-sm text-stone-500">When active, only admins can access the store.</p>
                </div>
                <button 
                  onClick={() => {
                    const current = config.find(c => c.key === 'maintenance_mode')?.value === 'true';
                    updateSetting('maintenance_mode', (!current).toString());
                  }}
                  className={cn(
                    "w-14 h-8 rounded-full transition-all relative",
                    config.find(c => c.key === 'maintenance_mode')?.value === 'true' ? "bg-primary" : "bg-stone-300"
                  )}
                >
                  <div className={cn(
                    "w-6 h-6 bg-white rounded-full absolute top-1 transition-all",
                    config.find(c => c.key === 'maintenance_mode')?.value === 'true' ? "left-7" : "left-1"
                  )} />
                </button>
              </div>

              <div className="space-y-4">
                <label className="block text-sm font-bold text-stone-700">Expected Back Time (e.g., 2 Hours, 30 Minutes)</label>
                <input 
                  type="text" 
                  className="input-field"
                  placeholder="e.g., 2 Hours"
                  defaultValue={config.find(c => c.key === 'maintenance_time')?.value}
                  onBlur={(e) => updateSetting('maintenance_time', e.target.value)}
                />
              </div>

              <div className="space-y-4">
                <label className="block text-sm font-bold text-stone-700">Maintenance Bypass Secret</label>
                <div className="flex space-x-2">
                  <input 
                    type="text" 
                    className="input-field font-mono"
                    defaultValue={config.find(c => c.key === 'maintenance_secret')?.value}
                    onBlur={(e) => updateSetting('maintenance_secret', e.target.value)}
                  />
                  <button 
                    onClick={() => {
                      const secret = config.find(c => c.key === 'maintenance_secret')?.value;
                      if (secret) {
                        navigator.clipboard.writeText(secret);
                        toast.success('Secret copied');
                      }
                    }}
                    className="p-3 bg-stone-100 hover:bg-stone-200 rounded-xl transition-colors"
                    title="Copy Secret"
                  >
                    <RefreshCw size={18} className="text-stone-600" />
                  </button>
                </div>
                <p className="text-xs text-stone-400">Use this as a URL parameter to bypass maintenance: <span className="font-mono">?bypass=YOUR_SECRET</span></p>
              </div>
            </div>

            <div className="bg-white p-8 rounded-3xl shadow-sm border border-stone-100 space-y-6">
              <h3 className="text-xl font-bold">API Configurations</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-stone-700 mb-1">SMS Gateway API Key</label>
                  <input 
                    type="password" 
                    className="input-field"
                    placeholder="Enter API Key..."
                    onBlur={(e) => updateSetting('sms_api_key', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-stone-700 mb-1">Payment Provider Secret</label>
                  <input 
                    type="password" 
                    className="input-field"
                    placeholder="Enter Secret..."
                    onBlur={(e) => updateSetting('payment_secret', e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'Support' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1 bg-white rounded-2xl shadow-sm border border-stone-100 overflow-hidden">
              <div className="p-6 border-b border-stone-100">
                <h3 className="font-bold text-lg">Support Tickets</h3>
              </div>
              <div className="divide-y divide-stone-100 overflow-y-auto max-h-[600px]">
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
                      "w-full p-6 text-left hover:bg-stone-50 transition-colors",
                      selectedTicket?.id === ticket.id && "bg-stone-50 border-r-4 border-primary"
                    )}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-xs font-bold text-stone-400 uppercase tracking-wider">#TKT-{ticket.id}</span>
                      <span className={cn(
                        "text-[10px] font-bold px-2 py-1 rounded-full uppercase",
                        ticket.status === 'open' ? "bg-amber-100 text-amber-600" : "bg-emerald-100 text-emerald-600"
                      )}>
                        {ticket.status}
                      </span>
                    </div>
                    <p className="font-bold text-stone-900 mb-1">{ticket.subject}</p>
                    <p className="text-xs text-stone-500 line-clamp-1">{ticket.user_name} • {ticket.user_phone}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-stone-100 flex flex-col min-h-[600px]">
              {selectedTicket ? (
                <>
                  <div className="p-6 border-b border-stone-100 flex justify-between items-center">
                    <div>
                      <h3 className="font-bold text-lg">{selectedTicket.subject}</h3>
                      <p className="text-xs text-stone-400">Customer: {selectedTicket.user_name} ({selectedTicket.user_phone})</p>
                    </div>
                    <select 
                      className="bg-stone-100 border-none rounded-lg px-3 py-1.5 text-xs font-bold"
                      value={selectedTicket.status}
                      onChange={async (e) => {
                        await fetch(`/api/admin/support/tickets/${selectedTicket.id}/status`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ status: e.target.value })
                        });
                        toast.success('Status updated');
                        fetchTickets();
                        setSelectedTicket({...selectedTicket, status: e.target.value});
                      }}
                    >
                      <option value="open">Open</option>
                      <option value="in-progress">In Progress</option>
                      <option value="resolved">Resolved</option>
                      <option value="closed">Closed</option>
                    </select>
                  </div>
                  <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-stone-50">
                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-stone-100 max-w-[80%]">
                      <p className="text-xs font-bold text-stone-400 mb-2">{selectedTicket.user_name} • {new Date(selectedTicket.created_at).toLocaleString()}</p>
                      <p className="text-sm text-stone-700">{selectedTicket.message}</p>
                    </div>
                    {ticketMessages.map((msg, i) => (
                      <div 
                        key={i} 
                        className={cn(
                          "p-4 rounded-2xl shadow-sm border max-w-[80%]",
                          msg.user_id === user.id 
                            ? "bg-primary text-white ml-auto border-primary" 
                            : "bg-white text-stone-700 border-stone-100"
                        )}
                      >
                        <p className={cn("text-[10px] font-bold mb-2", msg.user_id === user.id ? "text-white/70" : "text-stone-400")}>
                          {msg.user_id === user.id ? 'You' : selectedTicket.user_name} • {new Date(msg.created_at).toLocaleString()}
                        </p>
                        <p className="text-sm">{msg.message}</p>
                      </div>
                    ))}
                  </div>
                  <div className="p-6 border-t border-stone-100">
                    <div className="flex space-x-4">
                      <input 
                        type="text" 
                        placeholder="Type your reply..."
                        className="flex-1 bg-stone-100 border-none rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-primary/20"
                        value={replyMessage}
                        onChange={(e) => setReplyMessage(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            // Send reply logic
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
                        className="btn-primary px-6"
                      >
                        Send
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-stone-400 space-y-4">
                  <MessageSquare size={48} className="opacity-20" />
                  <p className="font-medium">Select a ticket to view conversation</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'Newsletter' && (
          <div className="bg-white rounded-2xl shadow-sm border border-stone-100 overflow-hidden">
            <div className="p-6 border-b border-stone-100 flex justify-between items-center">
              <h3 className="font-bold text-lg">Newsletter Subscribers</h3>
              <button 
                onClick={sendNewsletterCampaign}
                className="btn-primary flex items-center space-x-2"
              >
                <Send size={16} />
                <span>Send Campaign</span>
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-stone-50 text-stone-400 text-[10px] uppercase font-bold tracking-wider">
                  <tr>
                    <th className="px-6 py-4">Email Address</th>
                    <th className="px-6 py-4">User Status</th>
                    <th className="px-6 py-4">Subscribed Date</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {newsletter.map((sub) => (
                    <tr key={sub.id} className="hover:bg-stone-50 transition-colors">
                      <td className="px-6 py-4 font-medium">{sub.email}</td>
                      <td className="px-6 py-4">
                        {sub.user_id ? (
                          <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-emerald-50 text-emerald-600 uppercase">Registered User</span>
                        ) : (
                          <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-stone-100 text-stone-400 uppercase">Guest</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-stone-500">{new Date(sub.created_at).toLocaleDateString()}</td>
                      <td className="px-6 py-4 text-right">
                        <button className="p-2 hover:bg-red-50 text-stone-400 hover:text-red-600 rounded-lg transition-colors">
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'Expenses' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Expense Ledger</h2>
              <button 
                onClick={() => setExpenseModal({ open: true })}
                className="btn-primary flex items-center space-x-2"
              >
                <Plus size={20} />
                <span>Add Expense</span>
              </button>
            </div>
            <div className="bg-white rounded-2xl shadow-sm border border-stone-100 overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-stone-50 text-stone-400 text-[10px] uppercase font-bold tracking-wider">
                  <tr>
                    <th className="px-6 py-4">Description</th>
                    <th className="px-6 py-4">Category</th>
                    <th className="px-6 py-4">Amount</th>
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {expenses.map((expense) => (
                    <tr key={expense.id}>
                      <td className="px-6 py-4 font-medium">{expense.description}</td>
                      <td className="px-6 py-4">
                        <span className="text-[10px] font-bold px-2 py-1 bg-stone-100 rounded-full uppercase">{expense.category}</span>
                      </td>
                      <td className="px-6 py-4 font-bold text-red-600">₹{expense.amount}</td>
                      <td className="px-6 py-4 text-sm text-stone-500">{new Date(expense.date).toLocaleDateString()}</td>
                      <td className="px-6 py-4 text-right">
                        <button 
                          onClick={() => deleteExpense(expense.id)}
                          className="text-stone-400 hover:text-red-600"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'Coupons' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Promo Codes</h2>
              <button 
                onClick={() => setCouponModal({ open: true })}
                className="btn-primary flex items-center space-x-2"
              >
                <Plus size={20} />
                <span>Create Coupon</span>
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {coupons.map((coupon) => (
                <div key={coupon.id} className="bg-white p-6 rounded-2xl shadow-sm border border-stone-100 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity flex space-x-2">
                    <button 
                      onClick={() => toggleCouponStatus(coupon.id)}
                      className="text-stone-400 hover:text-primary"
                      title={coupon.active ? "Deactivate" : "Activate"}
                    >
                      <RefreshCw size={16} />
                    </button>
                    <button 
                      onClick={() => deleteCoupon(coupon.id)}
                      className="text-stone-400 hover:text-red-600"
                      title="Delete"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="p-3 bg-primary/10 rounded-xl text-primary"><Tag size={20} /></div>
                    <div>
                      <h3 className="font-bold text-lg">{coupon.code}</h3>
                      <p className="text-xs text-stone-400">Min. Order: ₹{coupon.min_order}</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-end justify-between">
                      <div>
                        <p className="text-3xl font-bold text-primary">
                          {coupon.type === 'flat' ? `₹${coupon.value}` : `${coupon.value}%`}
                        </p>
                        <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Discount</p>
                      </div>
                      <button 
                        onClick={() => toggleCouponStatus(coupon.id)}
                        className={cn(
                          "text-[10px] font-bold px-2 py-1 rounded-full uppercase transition-colors",
                          coupon.active ? "bg-emerald-50 text-emerald-600 hover:bg-emerald-100" : "bg-stone-100 text-stone-400 hover:bg-stone-200"
                        )}
                      >
                        {coupon.active ? 'Active' : 'Inactive'}
                      </button>
                    </div>
                    
                    <div className="pt-4 border-t border-stone-50 flex justify-between items-center">
                      <div>
                        <p className="text-sm font-bold text-stone-700">{coupon.usage_limit || '∞'}</p>
                        <p className="text-[10px] text-stone-400 uppercase font-bold">Total Limit</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-stone-700">{coupon.limit_per_user}</p>
                        <p className="text-[10px] text-stone-400 uppercase font-bold">Per User</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'Bulk Discounts' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Bulk Discounts & Tiered Pricing</h2>
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
                className="btn-primary flex items-center space-x-2"
              >
                <Plus size={20} />
                <span>Create Bulk Discount</span>
              </button>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-stone-100 overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-stone-50 text-stone-400 text-[10px] uppercase font-bold tracking-wider">
                  <tr>
                    <th className="px-6 py-4">Target</th>
                    <th className="px-6 py-4">Min. Quantity</th>
                    <th className="px-6 py-4">Discount</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Created</th>
                    <th className="px-6 py-4"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {bulkDiscounts.map((discount) => (
                    <tr key={discount.id} className="hover:bg-stone-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <span className={cn(
                            "text-[10px] font-bold px-2 py-0.5 rounded-full uppercase",
                            discount.entity_type === 'product' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'
                          )}>
                            {discount.entity_type}
                          </span>
                          <span className="font-bold text-sm">{discount.entity_name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-bold text-sm">{discount.min_qty}+ units</td>
                      <td className="px-6 py-4">
                        <span className="font-bold text-emerald-600">
                          {discount.discount_type === 'percentage' ? `${discount.discount_value}% Off` : `₹${discount.discount_value} Off`}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={cn(
                          "text-[10px] font-bold px-2 py-1 rounded-full uppercase",
                          discount.active ? 'bg-emerald-50 text-emerald-600' : 'bg-stone-100 text-stone-400'
                        )}>
                          {discount.active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-stone-500">
                        {new Date(discount.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
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
                          className="p-2 hover:bg-stone-100 rounded-lg text-stone-400 hover:text-primary transition-colors"
                        >
                          <Settings size={16} />
                        </button>
                        <button 
                          onClick={() => handleDeleteBulkDiscount(discount.id)}
                          className="p-2 hover:bg-red-50 rounded-lg text-stone-400 hover:text-red-600 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {bulkDiscounts.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-stone-400 italic">
                        No bulk discounts found. Create one to get started!
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Returns Tab */}
        {activeTab === 'Returns' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Returns & Refunds</h2>
            <div className="bg-white rounded-3xl shadow-sm border border-stone-100 overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-stone-50 border-b border-stone-100">
                  <tr>
                    <th className="py-4 px-6 text-xs text-stone-400 font-black uppercase tracking-widest">Order</th>
                    <th className="py-4 px-6 text-xs text-stone-400 font-black uppercase tracking-widest">Customer</th>
                    <th className="py-4 px-6 text-xs text-stone-400 font-black uppercase tracking-widest">Product</th>
                    <th className="py-4 px-6 text-xs text-stone-400 font-black uppercase tracking-widest">Reason</th>
                    <th className="py-4 px-6 text-xs text-stone-400 font-black uppercase tracking-widest">Status</th>
                    <th className="py-4 px-6 text-xs text-stone-400 font-black uppercase tracking-widest text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {returns.map(ret => (
                    <tr key={ret.id} className="hover:bg-stone-50 transition-colors">
                      <td className="py-4 px-6 font-bold text-stone-800">ORD-{ret.order_num}</td>
                      <td className="py-4 px-6 text-sm text-stone-600">{ret.user_name}</td>
                      <td className="py-4 px-6 text-sm text-stone-600">
                        {ret.product_name} <span className="text-xs ml-1 bg-stone-200 px-1 rounded">x{ret.quantity}</span>
                      </td>
                      <td className="py-4 px-6 text-sm text-stone-600">{ret.reason}</td>
                      <td className="py-4 px-6">
                        <span className={cn(
                          "px-2 py-1 rounded text-xs font-bold uppercase tracking-wider",
                          ret.status === 'pending' ? "bg-amber-100 text-amber-700" :
                          ret.status === 'approved' ? "bg-emerald-100 text-emerald-700" :
                          "bg-red-100 text-red-700"
                        )}>
                          {ret.status}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right">
                        {ret.status === 'pending' && (
                          <div className="flex justify-end space-x-2">
                            <button 
                              onClick={() => handleApproveReturn(ret)}
                              className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                              title="Approve & Credit Wallet"
                            >
                              <CheckCircle2 size={18} />
                            </button>
                            <button 
                              onClick={() => handleRejectReturn(ret.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Reject"
                            >
                              <X size={18} />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                  {returns.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-stone-400 italic">No returns found</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Suppliers Tab */}
        {activeTab === 'Suppliers' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Supplier Management</h2>
              <button 
                onClick={() => {
                  setSupplierModal({ open: true, mode: 'add', supplier: null });
                  setNewSupplier({ name: '', contact_person: '', email: '', phone: '', address: '' });
                }}
                className="btn-primary flex items-center space-x-2"
              >
                <Plus size={20} />
                <span>Add Supplier</span>
              </button>
            </div>
            
            <div className="bg-white rounded-2xl shadow-sm border border-stone-100 overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-stone-50 text-stone-400 text-[10px] uppercase font-bold tracking-wider">
                  <tr>
                    <th className="px-6 py-4">Supplier Name</th>
                    <th className="px-6 py-4">Contact Person</th>
                    <th className="px-6 py-4">Email</th>
                    <th className="px-6 py-4">Phone</th>
                    <th className="px-6 py-4">Address</th>
                    <th className="px-6 py-4">Created Date</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {suppliers.map((supplier) => (
                    <tr key={supplier.id} className="hover:bg-stone-50 transition-colors">
                      <td className="px-6 py-4">
                        <span className="font-bold text-sm text-stone-800">{supplier.name}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-medium">{supplier.contact_person}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-stone-600">{supplier.email}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-stone-600">{supplier.phone}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-stone-600">{supplier.address}</span>
                      </td>
                      <td className="px-6 py-4 text-xs text-stone-500 whitespace-nowrap">
                        {new Date(supplier.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <button 
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
                          className="p-2 hover:bg-stone-100 rounded-lg text-stone-400 hover:text-primary transition-colors"
                        >
                          <Settings size={16} />
                        </button>
                        <button 
                          onClick={() => handleDeleteSupplier(supplier.id)}
                          className="p-2 hover:bg-red-50 rounded-lg text-stone-400 hover:text-red-600 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {suppliers.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-stone-400 italic">
                        No suppliers found. Create one to get started!
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'Reviews' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Product Reviews</h2>
            <div className="bg-white rounded-2xl shadow-sm border border-stone-100 overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-stone-50 text-stone-400 text-[10px] uppercase font-bold tracking-wider">
                  <tr>
                    <th className="px-6 py-4">Product</th>
                    <th className="px-6 py-4">Customer</th>
                    <th className="px-6 py-4">Rating</th>
                    <th className="px-6 py-4">Comment</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {reviews.map((review) => (
                    <tr key={review.id} className="group hover:bg-stone-50 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-bold text-sm">{review.product_name}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-medium">{review.user_name}</p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex text-amber-400">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} size={12} fill={i < review.rating ? "currentColor" : "none"} />
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-stone-600 max-w-xs truncate" title={review.comment}>{review.comment}</p>
                        {review.response && (
                          <p className="text-[10px] text-primary font-medium mt-1 italic">Replied: {review.response}</p>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {review.response ? (
                          <span className="text-[9px] font-black px-2 py-1 bg-emerald-50 text-emerald-600 rounded-full uppercase tracking-tighter">Responded</span>
                        ) : (
                          <span className="text-[9px] font-black px-2 py-1 bg-amber-50 text-amber-600 rounded-full uppercase tracking-tighter">Pending</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-xs text-stone-500 whitespace-nowrap">{new Date(review.created_at).toLocaleDateString()}</td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <button 
                          onClick={() => {
                            setReviewResponseModal({ open: true, review });
                            setReviewResponse(review.response || '');
                          }}
                          className="text-primary hover:text-primary/80 font-bold text-xs uppercase tracking-tighter"
                        >
                          {review.response ? 'Edit Response' : 'Respond'}
                        </button>
                        <button 
                          onClick={() => deleteReview(review.id)}
                          className="text-stone-400 hover:text-red-600"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'Suspicious Activities' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Suspicious Activities</h2>
              <button 
                onClick={fetchSuspiciousActivities}
                className="p-2 hover:bg-stone-100 rounded-lg transition-colors"
              >
                <RefreshCw size={20} className="text-stone-400" />
              </button>
            </div>
            <div className="bg-white rounded-2xl shadow-sm border border-stone-100 overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-stone-50 text-stone-400 text-[10px] uppercase font-bold tracking-wider">
                  <tr>
                    <th className="px-6 py-4">Type</th>
                    <th className="px-6 py-4">User</th>
                    <th className="px-6 py-4">Details</th>
                    <th className="px-6 py-4">Severity</th>
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {suspiciousActivities.map((activity) => (
                    <tr key={activity.id} className="hover:bg-stone-50 transition-colors">
                      <td className="px-6 py-4">
                        <span className="text-[10px] font-bold px-2 py-1 bg-stone-100 rounded-full uppercase">{activity.type}</span>
                      </td>
                      <td className="px-6 py-4">
                        {activity.user_id ? (
                          <div>
                            <p className="font-bold text-sm">{activity.user_name}</p>
                            <p className="text-[10px] text-stone-400">{activity.user_phone}</p>
                          </div>
                        ) : (
                          <span className="text-stone-400 italic text-sm">Guest</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-stone-600 max-w-xs truncate" title={activity.description}>{activity.description}</p>
                        <p className="text-[10px] text-stone-400 font-mono mt-1">{activity.ip_address}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className={cn(
                          "text-[10px] font-bold px-2 py-1 rounded-full uppercase",
                          activity.severity === 'high' ? "bg-red-50 text-red-600" : 
                          activity.severity === 'medium' ? "bg-amber-50 text-amber-600" : 
                          activity.severity === 'resolved' ? "bg-emerald-50 text-emerald-600" :
                          "bg-blue-50 text-blue-600"
                        )}>
                          {activity.severity}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-stone-500 whitespace-nowrap">
                        {new Date(activity.created_at).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button 
                          onClick={() => handleResolveSuspicious(activity.id)}
                          className="text-xs font-bold text-primary hover:underline uppercase tracking-tighter"
                        >
                          Mark Resolved
                        </button>
                      </td>
                    </tr>
                  ))}
                  {suspiciousActivities.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-stone-400 italic">No suspicious activities found</td>
                    </tr>
                  )}
                </tbody>
              </table>
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
                <p className="text-[10px] text-stone-400 uppercase font-bold tracking-wider">Uptime: 99.9%</p>
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
      </main>
    </div>

      {/* Wallet Modal */}
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
            <h3 className="text-2xl font-bold mb-6">Create Coupon</h3>
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
                  Create
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
                  <div className="flex justify-between items-center">
                    <h4 className="font-bold text-stone-900">Product Variants</h4>
                    <button 
                      type="button"
                      onClick={() => {
                        setVariantModal({ open: true, mode: 'add', variant: null, productId: editingProduct.id });
                        setNewVariant({ name: '', price: '', stock: '', unit_quantity: '1', is_default: false });
                      }}
                      className="text-xs font-bold text-primary hover:underline flex items-center space-x-1"
                    >
                      <Plus size={14} />
                      <span>Add Variant</span>
                    </button>
                  </div>
                  <div className="space-y-2">
                    {productVariants.map((v) => (
                      <div key={v.id} className="flex items-center justify-between bg-white p-3 rounded-xl border border-stone-200 shadow-sm">
                        <div>
                          <p className="text-sm font-bold">{v.name} {v.is_default && <span className="text-[10px] bg-emerald-100 text-emerald-600 px-1.5 py-0.5 rounded ml-2 uppercase">Default</span>}</p>
                          <p className="text-[10px] text-stone-400 font-medium">₹{v.price} • Stock: {v.stock}</p>
                        </div>
                        <div className="flex items-center space-x-1">
                          <button 
                            type="button"
                            onClick={() => {
                              setVariantModal({ open: true, mode: 'edit', variant: v, productId: editingProduct.id });
                              setNewVariant({ name: v.name, price: v.price.toString(), stock: v.stock.toString(), unit_quantity: v.unit_quantity.toString(), is_default: v.is_default === 1 });
                            }}
                            className="p-1.5 text-stone-400 hover:text-primary transition-colors"
                          >
                            <Settings size={14} />
                          </button>
                          <button 
                            type="button"
                            onClick={() => handleDeleteVariant(v.id)}
                            className="p-1.5 text-stone-400 hover:text-red-500 transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                    {productVariants.length === 0 && (
                      <p className="text-xs text-stone-400 italic text-center py-2">No variants defined</p>
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

            <div className="flex-1 overflow-y-auto pr-2 space-y-6">
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-stone-200 rounded-2xl p-8 text-center hover:border-primary hover:bg-primary/5 transition-all cursor-pointer group"
              >
                <Camera size={32} className="mx-auto text-stone-300 group-hover:text-primary transition-colors mb-2" />
                <p className="text-sm font-bold text-stone-500 group-hover:text-primary transition-colors">Click to upload images</p>
                <p className="text-xs text-stone-400 mt-1">Supports multiple JPG, PNG files</p>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  multiple 
                  accept="image/*" 
                  onChange={handleImageUpload} 
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {newProduct.images.map((img, i) => (
                  <div key={i} className={cn(
                    "relative aspect-square rounded-2xl overflow-hidden border-2 group transition-all",
                    newProduct.image === img ? "border-primary shadow-lg" : "border-stone-100"
                  )}>
                    <img src={img} className="w-full h-full object-cover" alt="" />
                    
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2">
                      <button 
                        onClick={() => moveImage(i, 'left')}
                        disabled={i === 0}
                        className="p-2 bg-white rounded-full text-stone-600 hover:text-primary disabled:opacity-50"
                      >
                        <ChevronLeft size={16} />
                      </button>
                      <button 
                        onClick={() => deleteImage(i)}
                        className="p-2 bg-red-500 rounded-full text-white hover:bg-red-600"
                      >
                        <Trash2 size={16} />
                      </button>
                      <button 
                        onClick={() => moveImage(i, 'right')}
                        disabled={i === newProduct.images.length - 1}
                        className="p-2 bg-white rounded-full text-stone-600 hover:text-primary disabled:opacity-50"
                      >
                        <ChevronRight size={16} />
                      </button>
                    </div>

                    <button 
                      onClick={() => setNewProduct({ ...newProduct, image: img })}
                      className={cn(
                        "absolute top-2 left-2 px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider shadow-sm",
                        newProduct.image === img ? "bg-primary text-white" : "bg-white/90 text-stone-600 hover:bg-white"
                      )}
                    >
                      {newProduct.image === img ? 'Main Image' : 'Set as Main'}
                    </button>
                  </div>
                ))}
              </div>
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
                <label className="block text-sm font-bold text-stone-700 mb-2">Image URL</label>
                <div className="flex space-x-2">
                  <input 
                    type="text" 
                    required
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
            className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl"
          >
            <h3 className="text-2xl font-bold mb-6">Send Notification</h3>
            <form onSubmit={handleNotificationSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-stone-700 mb-2">Title</label>
                <input 
                  type="text" 
                  required
                  className="input-field"
                  value={newNotification.title}
                  onChange={(e) => setNewNotification({...newNotification, title: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-stone-700 mb-2">Message</label>
                <textarea 
                  required
                  className="input-field min-h-[100px]"
                  value={newNotification.message}
                  onChange={(e) => setNewNotification({...newNotification, message: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-stone-700 mb-2">Type</label>
                <select 
                  className="input-field"
                  value={newNotification.type}
                  onChange={(e) => setNewNotification({...newNotification, type: e.target.value})}
                >
                  <option value="ad">Advertisement</option>
                  <option value="alert">Alert</option>
                  <option value="info">Information</option>
                </select>
              </div>
              <div className="flex space-x-3 pt-4">
                <button 
                  type="button"
                  onClick={() => setNotificationModal({ open: false })}
                  className="flex-1 py-3 border border-stone-200 rounded-xl font-bold hover:bg-stone-50"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary/90"
                >
                  Send
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
                            <div className={`
                              w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500 border-2
                              ${isActive ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20' : 'bg-white border-stone-200 text-stone-300'}
                              ${isCurrent ? 'ring-4 ring-primary/20 scale-110' : ''}
                            `}>
                              <Icon size={18} />
                            </div>
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
                    <p className="text-sm font-bold text-stone-600 mb-2">{orderModal.order.delivery_type === 'pickup' ? '🏢 Self Pickup' : '🚚 Home Delivery'}</p>
                    
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
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl p-8 max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold">Manage Product Variants</h3>
              <button 
                onClick={() => setVariantModal({ ...variantModal, open: false })}
                className="p-2 hover:bg-stone-100 rounded-full text-stone-400"
              >
                <X size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 space-y-6">
              <div className="space-y-4">
                {productVariants.map((v, i) => (
                  <div key={i} className="p-4 bg-stone-50 rounded-2xl border border-stone-100 grid grid-cols-2 sm:grid-cols-4 gap-4 items-end">
                    <div>
                      <label className="block text-[10px] font-bold text-stone-400 uppercase mb-1">Name</label>
                      <input 
                        type="text" 
                        className="input-field py-1 text-xs" 
                        value={v.name}
                        onChange={(e) => {
                          const newVariants = [...productVariants];
                          newVariants[i].name = e.target.value;
                          setProductVariants(newVariants);
                        }}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-stone-400 uppercase mb-1">Unit Qty</label>
                      <input 
                        type="number" 
                        className="input-field py-1 text-xs" 
                        value={v.unit_quantity}
                        onChange={(e) => {
                          const newVariants = [...productVariants];
                          newVariants[i].unit_quantity = parseInt(e.target.value);
                          setProductVariants(newVariants);
                        }}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-stone-400 uppercase mb-1">Price (₹)</label>
                      <input 
                        type="number" 
                        className="input-field py-1 text-xs" 
                        value={v.price}
                        onChange={(e) => {
                          const newVariants = [...productVariants];
                          newVariants[i].price = e.target.value;
                          setProductVariants(newVariants);
                        }}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-stone-400 uppercase mb-1">Stock</label>
                      <input 
                        type="number" 
                        className="input-field py-1 text-xs" 
                        value={v.stock}
                        onChange={(e) => {
                          const newVariants = [...productVariants];
                          newVariants[i].stock = e.target.value;
                          setProductVariants(newVariants);
                        }}
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <button 
                        onClick={() => {
                          const newVariants = productVariants.filter((_, idx) => idx !== i);
                          setProductVariants(newVariants);
                        }}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 size={16} />
                      </button>
                      <div className="flex items-center space-x-1">
                        <input 
                          type="checkbox" 
                          checked={v.is_default}
                          onChange={(e) => {
                            const newVariants = productVariants.map((varnt, idx) => ({
                              ...varnt,
                              is_default: idx === i
                            }));
                            setProductVariants(newVariants);
                          }}
                        />
                        <span className="text-[10px] font-bold text-stone-400 uppercase">Default</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <button 
                onClick={() => setProductVariants([...productVariants, { name: '', price: '', stock: '', unit_quantity: 1, is_default: productVariants.length === 0 }])}
                className="w-full py-3 border-2 border-dashed border-stone-200 rounded-2xl text-stone-400 hover:border-primary hover:text-primary transition-all font-bold text-sm flex items-center justify-center space-x-2"
              >
                <Plus size={18} />
                <span>Add Variant (e.g., Cartoon, Single Piece)</span>
              </button>
            </div>

            <div className="mt-8 pt-6 border-t border-stone-100 flex space-x-3">
              <button 
                onClick={() => setVariantModal({ ...variantModal, open: false })}
                className="flex-1 py-3 border border-stone-200 rounded-xl font-bold hover:bg-stone-50"
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
                    toast.success('Variants updated');
                    setVariantModal({ ...variantModal, open: false });
                  } catch (err) {
                    toast.error('Failed to update variants');
                  }
                }}
                className="flex-1 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 shadow-lg shadow-primary/20"
              >
                Save Variants
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
                <div className="grid grid-cols-2 gap-3">
                  {['Orders', 'Product Catalog', 'Categories', 'Customers', 'Analytics', 'Reviews', 'Coupons', 'Roles', 'Settings'].map((perm) => (
                    <label key={perm} className="flex items-center space-x-3 p-3 bg-stone-50 rounded-xl cursor-pointer hover:bg-stone-100 transition-colors">
                      <input 
                        type="checkbox" 
                        className="rounded border-stone-300 text-primary focus:ring-primary"
                        checked={newRole.permissions.includes(perm)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setNewRole({ ...newRole, permissions: [...newRole.permissions, perm] });
                          } else {
                            setNewRole({ ...newRole, permissions: newRole.permissions.filter(p => p !== perm) });
                          }
                        }}
                      />
                      <span className="text-xs font-bold text-stone-700">{perm}</span>
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
