// AdminDashboard.tsx - Main entry for admin panel - V2
import { adminService } from '@/services/adminService';
import React, { useState, useEffect, useMemo, useCallback, useRef, lazy, Suspense } from 'react';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';
import { withErrorReporting } from '@/lib/uiUtils';
import { handleAppError } from '@/lib/incidentUtils';
import { motion, AnimatePresence } from 'motion/react';
import { collection, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '@/firebase';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, AreaChart, Area, PieChart, Pie, Cell, Legend
} from 'recharts';
import { 
  LayoutDashboard, ShoppingBag, Package, Users, MessageSquare, 
  Settings, CreditCard, Activity, TrendingUp, AlertTriangle,
  ChevronRight, ChevronLeft, ChevronDown, Search, Filter, MoreVertical, Tag, Receipt, ArrowRight,
  BarChart3, Plus, Trash2, Download, Star, Clock, CheckCircle2,
  Calendar, X, Upload, History, Eye, Check, MessageCircle, Camera, Printer, CheckCheck, AlertCircle,
  MapPin, Phone, Globe, Shield, ShieldCheck, Bell, Database, RefreshCw, ShieldAlert,
  Image as ImageIcon, List, UserPlus, Send, Share2, ExternalLink, LogOut,
  StickyNote, Truck, Home, Navigation, IndianRupee, Layers, MousePointer, Copy, ToggleLeft,
  Menu, RotateCcw, PieChart as PieChartIcon, Zap, Target, Wallet, ArrowDown, Sparkles,
  MousePointer2, Megaphone, ImageOff, Briefcase, Mail, Pencil, Smartphone, Layout, 
  FileText, HelpCircle, Palette, Server, TrendingDown, Fingerprint, Bug, Cpu, Loader2, PackagePlus
} from 'lucide-react';
import { Link, useNavigate, Navigate, useLocation } from 'react-router-dom';
import { storage, ref, uploadBytesResumable, getDownloadURL } from '@/firebase';
import { useStore } from '@/StoreContext';
import { cn, Order, PromotionRule } from '@/types';
import { getAuthHeaders, formatPhoneNumber } from '@/lib/utils';
import { fetchWithHandling } from '@/lib/api';
import { logger } from '@/lib/logger';
import { StatSkeleton, TableRowSkeleton, OrderSkeleton } from '@/components/ui/Skeleton';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import FeatureToggles from '@/components/admin/FeatureToggles';
import ProductImageManager from '@/components/admin/ProductImageManager';
import { OrderStatusBadge } from '@/components/admin/OrderStatusBadge';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import AppCrashBoundary from '@/components/AppCrashBoundary';
import AdminDashboardLayout from '@/components/admin/AdminDashboardLayout';
import { ErrorDetailModal } from '@/components/admin/modals/ErrorDetailModal';
import { ExportProgressModal } from '@/components/admin/modals/ExportProgressModal';
import AdminStatCard from '@/components/admin/AdminStatCard';
import { generateSystemHealthReportPDF } from '@/services/pdfService';
import { EmptyState } from '@/components/EmptyState';
import { exportData, asyncExportData } from '@/services/exportService';
import { logErrorToFirestore } from '@/services/incidentLogger';
import imageCompression from 'browser-image-compression';
import OverviewTabHeader from '@/components/admin/tabs/OverviewTabHeader';
import OverviewTab from '@/components/admin/tabs/OverviewTab';
import PurchaseOrdersTab from '@/components/admin/tabs/PurchaseOrdersTab';
import OrderBatchingTab from '@/components/admin/tabs/OrderBatchingTab';
import ModalContainer from '@/components/ui/ModalContainer';
import { DashboardModals } from '@/components/admin/DashboardModals';
import { FinanceModals } from '@/components/admin/modals/FinanceModals';
import { MarketingModals } from '@/components/admin/modals/MarketingModals';
import { InventoryModals } from '@/components/admin/modals/InventoryModals';
import { CustomerSupportModals } from '@/components/admin/modals/CustomerSupportModals';
import { OrderModals } from '@/components/admin/modals/OrderModals';

import LogisticsTab from '@/components/admin/tabs/LogisticsTab';
import AuditLogsTab from '@/components/admin/tabs/AuditLogsTab';
import RolesTab from '@/components/admin/tabs/RolesTab';
import CategoriesTab from '@/components/admin/tabs/CategoriesTab';
import PaymentSettingsTab from '@/components/admin/tabs/PaymentSettingsTab';
import StoreSettingsTab from '@/components/admin/tabs/StoreSettingsTab';
import SupportTicketsTab from '@/components/admin/tabs/SupportTicketsTab';
import ExpensesTab from '@/components/admin/tabs/ExpensesTab';
import CouponsTab from '@/components/admin/tabs/CouponsTab';
import BulkDiscountsTab from '@/components/admin/tabs/BulkDiscountsTab';
import ReturnsTab from '@/components/admin/tabs/ReturnsTab';
import SuppliersTab from '@/components/admin/tabs/SuppliersTab';
import ReviewsTab from '@/components/admin/tabs/ReviewsTab';
import SuspiciousActivitiesTab from '@/components/admin/tabs/SuspiciousActivitiesTab';
import AdminManagementTab from '@/components/admin/tabs/AdminManagementTab';
import PromotionalRulesTab from '@/components/admin/tabs/PromotionalRulesTab';
import SecurityDataTab from '@/components/admin/tabs/SecurityDataTab';
import AdminSecurityTab from '@/components/admin/tabs/AdminSecurityTab';
import AutomaticReportsTab from '@/components/admin/tabs/AutomaticReportsTab';
import SystemStatusTab from '@/components/admin/tabs/SystemStatusTab';

// Fix for default marker icon
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

type Tab = 'Overview' | 'Analytics' | 'Announcements' | 'Notifications' | 'Orders' | 'Logistics' | 'Product Catalog' | 'Categories' | 'Customers' | 'Wallet Requests' | 'Payments' | 'Reviews' | 'Coupons' | 'Newsletter' | 'Roles' | 'Support Tickets' | 'Expenses' | 'Store Settings' | 'Payment Settings' | 'System Status' | 'System Logs' | 'Suspicious Activities' | 'Promotions' | 'Bulk Discounts' | 'Feature Toggles' | 'Suppliers' | 'Returns' | 'Audit Logs' | 'Automatic Reports' | 'Admin Management' | 'Data Exports' | 'Security & Data' | 'Security Audit' | 'Promotional Rules' | 'Purchase Orders' | 'Order Batching' | 'UPI Webhook Logs';

import { lazyWithRetry } from '@/lib/lazyLoader';
import { ComponentCrashBoundary } from '@/components/AppCrashBoundary';

// Lazy loaded admin tabs
const OrdersTab = lazyWithRetry(() => import('@/components/admin/tabs/OrdersTab'), 'Orders');
const PaymentsTab = lazyWithRetry(() => import('@/components/admin/tabs/PaymentsTab'), 'Payments');
const ProductsTab = lazyWithRetry(() => import('@/components/admin/tabs/ProductsTab'), 'Products');
const CustomersTab = lazyWithRetry(() => import('@/components/admin/tabs/CustomersTab'), 'Customers');
const AnalyticsTab = lazyWithRetry(() => import('@/components/admin/tabs/AnalyticsTab'), 'Analytics');
const NewsletterTab = lazyWithRetry(() => import('@/components/admin/tabs/NewsletterTab'), 'Newsletter');
const WalletRequestsTab = lazyWithRetry(() => import('@/components/admin/tabs/WalletRequestsTab'), 'Wallet');
const SystemLogsTab = lazyWithRetry(() => import('@/components/admin/tabs/SystemLogsTab'), 'SystemLogs');
const UPIWebhookLogsTab = lazyWithRetry(() => import('@/components/admin/tabs/UPIWebhookLogsTab'), 'UPIWebhook');
const DataExportsTab = lazyWithRetry(() => import('@/components/admin/tabs/DataExportsTab'), 'Exports');
const AnnouncementsTab = lazyWithRetry(() => import('@/components/admin/tabs/AnnouncementsTab'), 'Announcements');
const PromotionsTab = lazyWithRetry(() => import('@/components/admin/tabs/PromotionsTab'), 'Promotions');

export default function AdminDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, adminTheme, setAdminTheme, simulatedRole, setSimulatedRole, logout, hasPermission } = useStore();
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTabState] = useState<Tab>('Overview');
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'offline'>('synced');
  const [isLoading, setIsLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);

  // Unified Tab Management - Handler that syncs with URL and scrolls to top
  const setActiveTab = useCallback((newTab: Tab) => {
    setActiveTabState(newTab);
    
    // Update URL for deep linking support
    const params = new URLSearchParams(location.search);
    params.set('tab', newTab);
    navigate({ search: params.toString() }, { replace: true });
    
    // Smooth scroll to container top on tab change for UX
    if (typeof document !== 'undefined') {
      const container = document.getElementById('admin-main-scroll-container');
      if (container) {
        container.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  }, [location.search, navigate]);

  // Centralized event listener for diagnostic console
  useEffect(() => {
    const handleOpenDiagnostics = () => {
      setActiveTab('System Logs');
    };
    window.addEventListener('open-diagnostic-console', handleOpenDiagnostics);
    return () => window.removeEventListener('open-diagnostic-console', handleOpenDiagnostics);
  }, [setActiveTab]);

  const validTabs: Tab[] = [
    'Overview', 'Analytics', 'Announcements', 'Orders', 'Logistics', 
    'Product Catalog', 'Categories', 'Customers', 'Wallet Requests', 
    'Reviews', 'Coupons', 'Newsletter', 'Roles', 'Support Tickets', 
    'Expenses', 'Store Settings', 'Payment Settings', 'System Status', 
    'System Logs', 'Suspicious Activities', 'Promotions', 'Bulk Discounts', 
    'Feature Toggles', 'Suppliers', 'Returns', 'Audit Logs', 
    'Automatic Reports', 'Admin Management', 'Data Exports', 
    'Security & Data', 'Security Audit', 'Promotional Rules', 'Purchase Orders', 
    'Order Batching', 'UPI Webhook Logs', 'Notifications'
  ];

  // 1. Initial tab from URL
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tabParam = params.get('tab');
    if (tabParam) {
      const foundMatch = validTabs.find(t => t.toLowerCase() === tabParam.toLowerCase());
      if (foundMatch && foundMatch !== activeTab) {
        setActiveTabState(foundMatch);
      }
    }
  }, []); // Only on mount

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    setSyncStatus(isOnline ? 'synced' : 'offline');
  }, [isOnline]);

  const checkOffline = () => {
    if (!isOnline) {
      toast.error('You are currently offline. Please check your network connection.', {
        id: 'offline-toast',
      });
      return true;
    }
    return false;
  };
  useEffect(() => {
    if (activeTab === 'System Status' || activeTab === 'Security & Data' || activeTab === 'Security Audit') {
      runDbDiagnostics();
    }
  }, [activeTab]);

  const displayPhoneNumber = (phone: string | null | undefined) => {
    return formatPhoneNumber(phone);
  };
  const [exportProgress, setExportProgress] = useState<{ open: boolean; progress: number; label: string }>({ open: false, progress: 0, label: '' });
  const [dbDiag, setDbDiag] = useState<any>(null);
  const [isInitializingDb, setIsInitializingDb] = useState(false);

  const runDbDiagnostics = async () => {
    try {
      const data = await fetchWithHandling<any>('/api/db-test', { headers: getAuthHeaders() });
      setDbDiag(data);
      if (data?.connection === 'FAILED') {
        toast.error('Database connection failed. See System Status for details.');
      }
    } catch (err) {
      toast.error('Failed to run database diagnostics');
    }
  };

  const initializeDatabase = async () => {
    if (!window.confirm('This will create initialization documents for all required collections. Continue?')) return;
    setIsInitializingDb(true);
    try {
      const data = await fetchWithHandling<any>('/api/admin/db-initialize', {
        method: 'POST',
        headers: getAuthHeaders()
      });
      if (data.success) {
        toast.success(data.message);
        runDbDiagnostics();
      } else {
        toast.error(data.message);
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to initialize database');
    } finally {
      setIsInitializingDb(false);
    }
  };

  const seedDatabase = async () => {
    if (!window.confirm('This will populate the database with sample products and categories. Continue?')) return;
    setIsInitializingDb(true);
    try {
      const data = await fetchWithHandling<any>('/api/admin/db-seed', {
        method: 'POST',
        headers: getAuthHeaders()
      });
      if (data.success) {
        toast.success(data.message);
        runDbDiagnostics();
      } else {
        toast.error(data.message);
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to seed database');
    } finally {
      setIsInitializingDb(false);
    }
  };

  const [globalSearchQuery, setGlobalSearchQuery] = useState('');
  const [debouncedGlobalSearchQuery, setDebouncedGlobalSearchQuery] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false); // Default closed on mobile
  const [exportModal, setExportModal] = useState({ open: false, type: 'orders' as any });
  const [exportFormat, setExportFormat] = useState<'pdf' | 'csv' | 'xlsx' | 'json'>('pdf');
  const [tncContent, setTncContent] = useState('');
  const [faqContent, setFaqContent] = useState('');
  const [diagnosticResults, setDiagnosticResults] = useState<any>(null);
  const [loadingDiagnostics, setLoadingDiagnostics] = useState(false);
  const [fixingWalletUserId, setFixingWalletUserId] = useState<string | null>(null);

  const fixWalletDiscrepancy = async (userId: string) => {
    setFixingWalletUserId(userId);
    try {
      const response = await fetchWithHandling<any>('/api/admin/fix-wallet-discrepancy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({ userId })
      });
      if (response && response.success) {
        toast.success(`Discrepancy Corrected! Wallet balance successfully verified and updated.`);
        runWalletDiagnostics();
      } else {
        toast.error(response?.message || 'Failed to correct wallet discrepancy');
      }
    } catch (err: any) {
      console.error('Wallet correction failed:', err);
      toast.error('Automated correction request failed.');
    } finally {
      setFixingWalletUserId(null);
    }
  };

  const runWalletDiagnostics = async () => {
    setLoadingDiagnostics(true);
    try {
      const data = await fetchWithHandling<any>('/api/admin/diagnose-wallets', {
        headers: getAuthHeaders()
      });
      setDiagnosticResults(data);
    } catch (err: any) {
      console.error('Wallet diagnostic failed:', err);
    } finally {
      setLoadingDiagnostics(false);
    }
  };

  const handleGlobalExport = async (type: string, format: 'pdf' | 'csv' | 'xlsx' | 'json') => {
    setExportModal({ ...exportModal, open: false });
    setExportProgress({ open: true, progress: 0, label: `Preparing ${type.toUpperCase()} manifest...` });
    
    try {
      const headers = getAuthHeaders();
      let columns: any[] = [];
      let fetchDataFn: () => Promise<any[]>;

      switch (type) {
        case 'orders':
          fetchDataFn = () => fetchWithHandling('/api/admin/orders', { headers }).then(d => (d as any[]) || []);
          columns = [
            { header: 'Order ID', dataKey: 'id' },
            { header: 'Customer', dataKey: 'user_name' },
            { header: 'Total', dataKey: 'total' },
            { header: 'Status', dataKey: 'status' },
            { header: 'Date', dataKey: 'created_at' }
          ];
          break;
        case 'products':
          fetchDataFn = () => fetchWithHandling('/api/products', { headers }).then(d => (d as any[]) || []);
          columns = [
            { header: 'Name', dataKey: 'name' },
            { header: 'Category', dataKey: 'category' },
            { header: 'Price', dataKey: 'price' },
            { header: 'Stock', dataKey: 'stock' }
          ];
          break;
        case 'users':
          fetchDataFn = () => fetchWithHandling('/api/admin/users', { headers }).then(d => (d as any[]) || []);
          columns = [
            { header: 'Name', dataKey: 'name' },
            { header: 'Phone', dataKey: 'phone' },
            { header: 'Email', dataKey: 'email' },
            { header: 'Wallet', dataKey: 'wallet_balance' }
          ];
          break;
        case 'audit':
          fetchDataFn = () => fetchWithHandling('/api/admin/audit-logs', { headers }).then(d => (d as any[]) || []);
          columns = [
            { header: 'Action', dataKey: 'action' },
            { header: 'Admin', dataKey: 'admin_name' },
            { header: 'Details', dataKey: 'details' },
            { header: 'Date', dataKey: 'created_at' }
          ];
          break;
        case 'expenses':
          fetchDataFn = () => fetchWithHandling('/api/admin/expenses', { headers }).then(d => (d as any[]) || []);
          columns = [
            { header: 'Description', dataKey: 'description' },
            { header: 'Amount', dataKey: 'amount' },
            { header: 'Category', dataKey: 'category' },
            { header: 'Date', dataKey: 'date' }
          ];
          break;
        case 'analytics':
          fetchDataFn = async () => {
            const data = await fetchWithHandling<any>('/api/admin/analytics', { headers });
            return (data?.dailySales || []);
          };
          columns = [
            { header: 'Date', dataKey: 'date' },
            { header: 'Revenue', dataKey: 'revenue' },
            { header: 'Orders', dataKey: 'orderCount' },
            { header: 'Average Value', dataKey: 'averageOrderValue' }
          ];
          break;
        default:
          throw new Error('Unsupported export type');
      }
      
      const { asyncExportData } = await import('../services/exportService');
      await asyncExportData(
        fetchDataFn,
        columns,
        format,
        `${type}_export`,
        (prog) => setExportProgress(p => ({ ...p, progress: prog, label: `Crafting ${format.toUpperCase()} asset packet...` })),
        { title: `${type.toUpperCase()} Comprehensive Report` }
      );
      
      setExportProgress(p => ({ ...p, progress: 100, label: 'Transmission Complete' }));
      toast.success('Asset Cipher successfully dispatched');
      setTimeout(() => setExportProgress({ open: false, progress: 0, label: '' }), 1500);
      
    } catch (err) {
      console.error('Export error:', err);
      toast.error('Export protocol failed');
      setExportProgress({ open: false, progress: 0, label: '' });
    }
  };

  const ExportTriggerButton = ({ type }: { type: 'orders' | 'products' | 'users' | 'audit' | 'expenses' | 'analytics' }) => (
    <button
      onClick={() => setExportModal({ open: true, type })}
      className="flex items-center space-x-3 bg-white border border-stone-200 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest text-stone-500 hover:text-stone-950 hover:border-stone-950 transition-all active:scale-95 shadow-sm"
    >
      <Download size={14} strokeWidth={3} />
      <span>Export Intel</span>
    </button>
  );
  
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedGlobalSearchQuery(globalSearchQuery), 1000);
    return () => clearTimeout(timer);
  }, [globalSearchQuery]);
  




  const [newProduct, setNewProduct] = useState({ 
    name: '', description: '', price: '', stock: '', category: 'Grocery', image: '', 
    retail_price: '', wholesale_price: '', discount: '0', reorder_point: '10', max_qty: '0', is_listed: true,
    images: [] as string[],
    specifications: {} as Record<string, string>,
    batch_number: '',
    expiry_date: '',
    unit: 'kg',
    is_subscribable: false,
    supplier_id: ''
  });
  const [stats, setStats] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [config, setConfig] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [walletModal, setWalletModal] = useState<{ open: boolean; userId: number | null }>({ open: false, userId: null });
  const [walletAmount, setWalletAmount] = useState('');
  const [walletType, setWalletType] = useState<'credit' | 'debit'>('credit');
  const [reportDetailModal, setReportDetailModal] = useState<{ open: boolean; report: any | null }>({ open: false, report: null });
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('All');
  const [orderDeliveryFilter, setOrderDeliveryFilter] = useState<'all' | 'delivery' | 'pickup'>('all');
  const [orderUserIdFilter, setOrderUserIdFilter] = useState<string>('');
  const [orderDateStart, setOrderDateStart] = useState<string>('');
  const [orderDateEnd, setOrderDateEnd] = useState<string>('');
  const [orderSearchTerm, setOrderSearchTerm] = useState('');
  const [debouncedOrderSearchTerm, setDebouncedOrderSearchTerm] = useState('');
  
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedOrderSearchTerm(orderSearchTerm), 1000);
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

  const activeTabRef = useRef(activeTab);
  useEffect(() => {
    activeTabRef.current = activeTab;
  }, [activeTab]);

  const isFetchingStats = useRef(false);
  const isCheckingHealth = useRef(false);

  // Initial load only on login/mount
  useEffect(() => {
    if (!user || user.role !== 'admin' || !navigator.onLine) return;
    
    fetchStats(true);
    checkHealth();
  }, [user]);

  // Centralized background polling for real-time dashboard health and metrics
  useEffect(() => {
    if (!user || user.role !== 'admin') return;

    let mounted = true;

    // Centralized interval (Reduced frequency: every 60s for health, 2m for stats)
    // Only happens if the document is visible to save battery and network
    const pollingInterval = setInterval(() => {
      if (!mounted || !navigator.onLine || document.hidden) return;
      
      // Health check runs every 60s
      checkHealth();

      // Stats fetch runs every 2 minutes (every 2nd tick)
      // but only if on Overview tab or Analytics tab to avoid useless background calls
      const needsStats = activeTabRef.current === 'Overview' || activeTabRef.current === 'Analytics';
      if (needsStats) {
        fetchStats(true); 
      }
    }, 60000);

    return () => {
      mounted = false;
      clearInterval(pollingInterval);
    };
  }, [user]); // Only dependent on user. activeTab handled by activeTabRef

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => setLoading(false), 500); 
    return () => clearTimeout(timer);
  }, [activeTab]);

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
      'Purchase Orders': 'Purchase Orders',
      'Order Batching': 'Order Batching',
      'Wallet Requests': 'Wallet Top-ups',
      'Payments': 'Payment Sync',
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
      'Admin Security': 'Security Audit',
      'Automatic Reports': 'Anomalies'
    };
    return mapping[tab] || tab;
  };

  const TabContent = () => {
    return (
      <ComponentCrashBoundary name={`Tab: ${activeTab}`}>
        <Suspense fallback={
          <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
            <Activity size={40} className="text-stone-300 animate-spin" />
            <p className="text-stone-400 font-bold uppercase tracking-widest text-xs">Loading Intelligence Tab...</p>
          </div>
        }>
        {(() => {
          switch (activeTab) {
            case 'Overview': 
              return (
                <OverviewTab 
                  stats={stats} 
                  setActiveTab={setActiveTab} 
                  refreshStats={fetchStats} 
                  loading={loading}
                  setExportModal={setExportModal}
                  setShowAddProduct={setShowAddProduct}
                  setNotificationModal={setNotificationModal}
                />
              );
            case 'Orders':
              return (
                <OrdersTab 
                  orders={orders} 
                  loading={loading}
                  fetchOrders={() => {
                    if (checkOffline()) return;
                    adminService.getOrders(getAuthHeaders()).then(data => {
                      if (data) setOrders(data);
                    });
                  }}
                  updateOrderStatus={updateOrderStatus}
                  fetchOrderDetailsModal={fetchOrderDetailsModal}
                  handleBulkOrderAction={handleBulkOrderAction}
                  asyncExportData={async (type) => { await handleGlobalExport(type, 'xlsx'); }}
                  config={config}
                />
              );
            case 'Product Catalog':
              return (
                <ProductsTab 
                  allProducts={allProducts}
                  categories={categories}
                  loading={loading}
                  setProductModal={setProductModal}
                  setNewProduct={setNewProduct}
                  setEditingProduct={setEditingProduct}
                  deleteProduct={deleteProduct}
                  handleBulkUpload={handleBulkUpload}
                  downloadTemplate={downloadTemplate}
                  generatePurchaseOrder={generatePurchaseOrder}
                  bulkUpdateStock={bulkUpdateStock}
                  bulkUpdateCategory={bulkUpdateCategory}
                  bulkUnlist={bulkUnlist}
                  bulkDelete={bulkDelete}
                  bulkStockValue={bulkStockValue}
                  setBulkStockValue={setBulkStockValue}
                  refreshProducts={() => {
                    if (checkOffline()) return;
                    adminService.getProducts(getAuthHeaders()).then(data => {
                      if (data) setAllProducts(data);
                    });
                  }}
                />
              );
            case 'Purchase Orders': 
              return <PurchaseOrdersTab />;
            case 'Order Batching': 
              return <OrderBatchingTab />;
            case 'Newsletter':
              return <NewsletterTab />;
            case 'UPI Webhook Logs':
              return <UPIWebhookLogsTab />;
            case 'System Logs':
              return <SystemLogsTab />;
            case 'Data Exports':
              return <DataExportsTab setExportProgress={setExportProgress} />;
            case 'Analytics':
              return (
                <AnalyticsTab 
                  stats={stats}
                  analyticsData={analyticsData}
                  salesAnalytics={salesAnalytics}
                  lowStockProducts={lowStockProducts}
                  expiringSoon={expiringSoon}
                  isFetchingAnalytics={isFetchingAnalytics}
                  analyticsStartDate={analyticsStartDate}
                  setAnalyticsStartDate={setAnalyticsStartDate}
                  analyticsEndDate={analyticsEndDate}
                  setAnalyticsEndDate={setAnalyticsEndDate}
                  analyticsCategory={analyticsCategory}
                  setAnalyticsCategory={setAnalyticsCategory}
                  categories={categories}
                  setActiveTab={(val) => setActiveTab(val as Tab)}
                  setProductSearchTerm={setProductSearchTerm}
                />
              );
            case 'Customers':
              return (
                <CustomersTab 
                  users={users}
                  loading={loading}
                  setWalletModal={setWalletModal}
                  setCustomerModal={setCustomerModal}
                  fetchCustomerOrders={fetchCustomerOrders}
                  fetchWalletHistory={fetchWalletHistory}
                  setUsers={setUsers}
                  fetchWithHandling={fetchWithHandling}
                  getAuthHeaders={getAuthHeaders}
                  toast={toast}
                />
              );
            case 'Announcements':
            case 'Notifications':
              return (
                <AnnouncementsTab 
                  notifications={notifications}
                  fetchNotifications={fetchNotifications}
                  handleDeleteNotification={(id) => handleDeleteNotification(Number(id))}
                  setNotificationModal={setNotificationModal}
                  setNewNotification={setNewNotification}
                  fetchWithHandling={fetchWithHandling}
                  getAuthHeaders={getAuthHeaders}
                  toast={toast}
                />
              );
            case 'Promotions':
              return (
                <PromotionsTab 
                  promotions={promotions}
                  setNewPromotion={setNewPromotion}
                  setPromotionModal={setPromotionModal}
                  togglePromotionStatus={(id) => togglePromotionStatus(Number(id))}
                  handleDeletePromotion={(id) => handleDeletePromotion(Number(id))}
                  setNewPromotionRuleData={setNewPromotionRuleData}
                  setPromotionRuleFormModal={setPromotionRuleFormModal}
                />
              );
            case 'Wallet Requests':
              return (
                <WalletRequestsTab 
                  walletRequests={walletRequests}
                  fetchWalletRequests={fetchWalletRequests}
                  handleWalletRequest={async (requestId, action) => {
                    if (action === 'approve') {
                      await handleApproveWalletRequest(Number(requestId));
                    } else {
                      await handleRejectWalletRequest(Number(requestId));
                    }
                  }}
                  handleViewEvidence={(url) => {
                    window.open(url, '_blank', 'noopener,noreferrer');
                  }}
                />
              );
            case 'Payments':
              return (
                <PaymentsTab 
                  fetchWithHandling={fetchWithHandling}
                  getAuthHeaders={getAuthHeaders}
                  toast={toast}
                />
              );
            case 'Logistics':
              return (
                <LogisticsTab
                  orders={orders}
                  runners={runners}
                  setRunnerModal={setRunnerModal}
                  handleAssignRunner={handleAssignRunner}
                />
              );
            case 'Audit Logs':
              return (
                <AuditLogsTab
                  auditLogType={auditLogType}
                  setAuditLogType={setAuditLogType}
                  fetchAuditLogs={fetchAuditLogs}
                  isFetchingAudit={isFetchingAudit}
                  auditLogLimit={auditLogLimit}
                  auditLogs={auditLogs}
                  handleRevertAction={handleRevertAction}
                />
              );
            case 'Roles':
              return (
                <RolesTab
                  roles={roles}
                  setRoleModal={setRoleModal as any}
                  setNewRole={setNewRole}
                  setRoles={setRoles}
                  getAuthHeaders={getAuthHeaders}
                  fetchWithHandling={fetchWithHandling}
                  toast={toast}
                />
              );
            case 'Categories':
              return (
                <CategoriesTab
                  categories={categories}
                  allProducts={allProducts}
                  setCategoryModal={setCategoryModal}
                  setEditingCategory={setEditingCategory}
                  setNewCategory={setNewCategory}
                />
              );
            case 'Payment Settings':
              return (
                <PaymentSettingsTab
                  config={config}
                  updateSetting={updateSetting}
                />
              );
            case 'Store Settings':
              return (
                <StoreSettingsTab
                  toast={toast}
                  getAuthHeaders={getAuthHeaders}
                  fetchWithHandling={fetchWithHandling}
                  config={config}
                  getSetting={getSetting}
                  updateSetting={updateSetting}
                  deliveryFee={deliveryFee}
                  setDeliveryFee={setDeliveryFee}
                  freeDeliveryThreshold={freeDeliveryThreshold}
                  setFreeDeliveryThreshold={setFreeDeliveryThreshold}
                  deliveryAreas={deliveryAreas}
                  setDeliveryAreaModal={setDeliveryAreaModal as any}
                  setNewDeliveryArea={setNewDeliveryArea}
                  handleDeleteDeliveryArea={handleDeleteDeliveryArea}
                  adminTheme={adminTheme}
                  setAdminTheme={setAdminTheme}
                />
              );
            case 'Support Tickets':
              return (
                <SupportTicketsTab
                  tickets={tickets}
                  selectedTicket={selectedTicket}
                  setSelectedTicket={setSelectedTicket}
                  fetchTickets={fetchTickets}
                  ticketMessages={ticketMessages}
                  setTicketMessages={setTicketMessages}
                  replyMessage={replyMessage}
                  setReplyMessage={setReplyMessage}
                  fetchWithHandling={fetchWithHandling}
                  getAuthHeaders={getAuthHeaders}
                  toast={toast}
                  user={user}
                />
              );
            case 'Expenses':
              return (
                <ExpensesTab
                  expenses={expenses}
                  setExpenseModal={setExpenseModal}
                  deleteExpense={deleteExpense}
                />
              );
            case 'Coupons':
              return (
                <CouponsTab
                  coupons={coupons}
                  setCouponModal={setCouponModal}
                  setNewCoupon={setNewCoupon}
                  toggleCouponStatus={toggleCouponStatus}
                  deleteCoupon={deleteCoupon}
                />
              );
            case 'Bulk Discounts':
              return (
                <BulkDiscountsTab
                  bulkDiscounts={bulkDiscounts}
                  setBulkDiscountModal={setBulkDiscountModal}
                  setNewBulkDiscount={setNewBulkDiscount}
                  handleToggleBulkDiscount={handleToggleBulkDiscount}
                  handleDeleteBulkDiscount={handleDeleteBulkDiscount}
                />
              );
            case 'Returns':
              return (
                <ReturnsTab
                  returns={returns}
                  selectedReturnReason={selectedReturnReason}
                  setSelectedReturnReason={setSelectedReturnReason}
                  handleApproveReturn={handleApproveReturn}
                  handleRejectReturn={handleRejectReturn}
                />
              );
            case 'Feature Toggles':
              return <FeatureToggles config={config} onUpdate={fetchConfig} />;
            case 'Suppliers':
              return (
                <SuppliersTab
                  suppliers={suppliers}
                  setSupplierModal={setSupplierModal}
                  setNewSupplier={setNewSupplier}
                  handleDeleteSupplier={handleDeleteSupplier}
                />
              );
            case 'Reviews':
              return (
                <ReviewsTab
                  reviews={reviews}
                  setReviewResponseModal={setReviewResponseModal}
                  setReviewResponse={setReviewResponse}
                  updateReviewStatus={updateReviewStatus}
                  deleteReview={deleteReview}
                />
              );
            case 'Suspicious Activities':
              return (
                <SuspiciousActivitiesTab
                  suspiciousActivities={suspiciousActivities}
                  fetchSuspiciousActivities={fetchSuspiciousActivities}
                  handleResolveSuspicious={handleResolveSuspicious}
                />
              );
            case 'Admin Management':
              return (
                <AdminManagementTab
                  admins={admins}
                  isAdminRefreshing={isAdminRefreshing}
                  fetchAdmins={fetchAdmins}
                  auditLogs={auditLogs}
                  deletionRequests={deletionRequests}
                  approveDeletion={approveDeletion}
                  rejectDeletion={rejectDeletion}
                  fetchWithHandling={fetchWithHandling}
                  getAuthHeaders={getAuthHeaders}
                  toast={toast}
                />
              );
            case 'Promotional Rules':
              return (
                <PromotionalRulesTab
                  promotionRules={promotionRules}
                  setNewPromotionRuleData={setNewPromotionRuleData as any}
                  setPromotionRuleFormModal={setPromotionRuleFormModal}
                  handleDeleteRule={handleDeleteRule}
                />
              );
            case 'Security & Data':
              return (
                <SecurityDataTab
                  user={user}
                  runWalletDiagnostics={runWalletDiagnostics}
                  loadingDiagnostics={loadingDiagnostics}
                  diagnosticResults={diagnosticResults}
                  fixingWalletUserId={fixingWalletUserId}
                  fixWalletDiscrepancy={fixWalletDiscrepancy}
                />
              );
            case 'Security Audit':
              return (
                <AdminSecurityTab 
                  user={user} 
                  fetchWithHandling={fetchWithHandling}
                  getAuthHeaders={getAuthHeaders}
                  toast={toast}
                  runWalletDiagnostics={runWalletDiagnostics}
                  loadingDiagnostics={loadingDiagnostics}
                  diagnosticResults={diagnosticResults}
                  fixingWalletUserId={fixingWalletUserId}
                  fixWalletDiscrepancy={fixWalletDiscrepancy}
                />
              );
            case 'Automatic Reports':
              return (
                <AutomaticReportsTab
                  bugReports={bugReports}
                  setBugReports={setBugReports}
                  setReportDetailModal={setReportDetailModal}
                  fetchWithHandling={fetchWithHandling}
                  getAuthHeaders={getAuthHeaders}
                  toast={toast}
                />
              );
            case 'System Status':
              return (
                <SystemStatusTab
                  systemHealth={systemHealth}
                  dbDiag={dbDiag}
                  errorLogs={errorLogs}
                  systemLogs={systemLogs}
                  isRefreshingLogs={isRefreshingLogs}
                  fetchSystemLogs={fetchSystemLogs}
                  generateSystemHealthReportPDF={generateSystemHealthReportPDF}
                />
              );
            default: 
              return <div className="p-8 text-stone-500">Feature {activeTab} not yet fully redesigned.</div>;
          }
        })()}
        </Suspense>
      </ComponentCrashBoundary>
    );
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
    logger.info("Admin Dashboard Auth Check: user =", user);
    if (user) {
        logger.info("User Role:", user.role);
    }
  }, [user]);

  if (!user) {
    return <div className="p-8 text-center text-stone-600">Please log in to access the admin dashboard.</div>;
  }
  if (user.role !== 'admin') {
    return <div className="p-8 text-center text-red-500">Access denied. Your role is {user.role}. Admin privileges are required.</div>;
  }


  const [healthStatus, setHealthStatus] = useState<'healthy' | 'warning' | 'critical' | 'offline'>('offline');

  const fetchStats = async (silent = false) => {
    if (!navigator.onLine) return;
    if (isFetchingStats.current) return;
    
    if (!silent) setLoading(true);
    isFetchingStats.current = true;
    
    try {
      const data = await adminService.getStats(getAuthHeaders());
      if (data) setStats(data);
    } catch (err: any) {
      logger.error('Stats fetch error:', err);
    } finally {
      isFetchingStats.current = false;
      if (!silent) setLoading(false);
    }
  };

  const checkHealth = async () => {
    if (!navigator.onLine) return;
    if (isCheckingHealth.current) return;
    
    isCheckingHealth.current = true;
    try {
      const data = await fetchWithHandling<any>('/api/admin/health-indicator', { headers: getAuthHeaders() });
      if (data) {
        setHealthStatus(data.status || 'offline');
      }
    } catch (err) {
      setHealthStatus('offline');
    } finally {
      isCheckingHealth.current = false;
    }
  };

  const fetchExpiringProducts = async () => {
    try {
      const data = await fetchWithHandling<any[]>('/api/admin/inventory/expiring', { headers: getAuthHeaders() });
      if (data) {
        setExpiringSoon(data);
      }
    } catch (err) {
      logger.error('Failed to fetch expiring products:', err);
    }
  };

  const fetchOrders = () => {
    if (!navigator.onLine) return () => {};
    let q = query(collection(db, 'orders'), orderBy('created_at', 'desc'));
    return onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setOrders(data);
    }, (err) => {
      logger.warn(`Firestore Orders subscription fell back safely to REST API due to: ${err.message}`);
      adminService.getOrders(getAuthHeaders())
        .then(data => { if (data) setOrders(data); })
        .catch(fetchErr => logger.error('REST backup orders fetch failed:', fetchErr));
    });
  };

  const fetchReturns = async () => {
    try {
        const data = await fetchWithHandling<any[]>('/api/admin/returns', { headers: getAuthHeaders() });
        if (data) {
          setReturns(data);
        }
    } catch (err: any) {
        handleAppError(err, 'Failed to fetch returns', 'fetchReturns');
    }
  };

  const fetchProducts = () => {
    if (!navigator.onLine) return () => {};
    const q = query(collection(db, 'products'));
    return onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAllProducts(data);
      setLowStockProducts(data.filter((p: any) => p.stock <= (p.reorder_point || 5)));
    }, (err) => {
      logger.warn(`Firestore Products subscription fell back safely to REST API due to: ${err.message}`);
      adminService.getProducts(getAuthHeaders())
        .then(data => {
          if (data) {
            setAllProducts(data);
            setLowStockProducts(data.filter((p: any) => p.stock <= (p.reorder_point || 5)));
          }
        })
        .catch(fetchErr => {
          logger.error('REST backup products fetch failed:', fetchErr);
        });
    });
  };

  useEffect(() => {
    let unsubscribeOrders: () => void;
    let unsubscribeProducts: () => void;
    
    if (user?.role === 'admin') {
      // Subscribe once on mount
      unsubscribeProducts = fetchProducts();
      unsubscribeOrders = fetchOrders();
    }
    return () => {
      if (unsubscribeOrders) unsubscribeOrders();
      if (unsubscribeProducts) unsubscribeProducts();
    };
  }, [user]);

  const [newBatchCategory, setNewBatchCategory] = useState('');
  const [imageModal, setImageModal] = useState({ open: false, productId: null as number | null, images: [] as string[] });
  const [couponModal, setCouponModal] = useState<{ open: boolean; mode: 'add' | 'edit'; editingId?: number | string }>({ open: false, mode: 'add' });
  const [expenseModal, setExpenseModal] = useState({ open: false });
  const [newCoupon, setNewCoupon] = useState({ code: '', type: 'flat', value: '', min_order: '', usage_limit: '', limit_per_user: '1', expiry_date: '' });
  const [newExpense, setNewExpense] = useState({ description: '', amount: '', category: 'Stock', date: new Date().toISOString().split('T')[0] });
  const [walletHistoryModal, setWalletHistoryModal] = useState<{ open: boolean; userId: number | null; history: any[] }>({ open: false, userId: null, history: [] });
  const [bulkUploadLoading, setBulkUploadLoading] = useState(false);
  const [newSpec, setNewSpec] = useState({ key: '', value: '' });
  const [categories, setCategories] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
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
  const [bulkStockValue, setBulkStockValue] = useState<string>('');
  const [selectedOrders, setSelectedOrders] = useState<number[]>([]);
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [analyticsTimeframe, setAnalyticsTimeframe] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [analyticsStartDate, setAnalyticsStartDate] = useState<string>('');
  const [analyticsEndDate, setAnalyticsEndDate] = useState<string>('');
  const [analyticsCategory, setAnalyticsCategory] = useState<string>('all');
  const [analyticsSegment, setAnalyticsSegment] = useState<string>('all');
  const [isFetchingAnalytics, setIsFetchingAnalytics] = useState(false);
  const [showWeeklyComparison, setShowWeeklyComparison] = useState<boolean>(false);
  const [roles, setRoles] = useState<any[]>([]);
  const [roleModal, setRoleModal] = useState({ open: false, mode: 'add' as 'add' | 'edit', role: null as any });
  const [newRole, setNewRole] = useState({ name: '', permissions: [] as string[] });
  const [searchSuggestions, setSearchSuggestions] = useState<string[]>([]);
  const [suspiciousActivities, setSuspiciousActivities] = useState<any[]>([]);
  const [systemLogs, setSystemLogs] = useState<any[]>([]);
  const [errorLogs, setErrorLogs] = useState<any[]>([]);
  const [systemHealth, setSystemHealth] = useState<any>(null);
  const [isRefreshingLogs, setIsRefreshingLogs] = useState(false);
  const [reviewResponseModal, setReviewResponseModal] = useState<{ open: boolean; review: any }>({ open: false, review: null });
  const fetchExpenses = async () => {
    if (!navigator.onLine) return;
    try {
      const data = await adminService.getExpenses(getAuthHeaders());
      if (data) {
        setExpenses(data);
      }
    } catch (err) {
      logger.error('Failed to fetch expenses:', err);
    }
  };

  useEffect(() => {
    let unsubscribe: () => void;
    if (activeTab === 'Expenses') fetchExpenses();
    if (activeTab === 'Support Tickets') {
      unsubscribe = fetchTickets();
    }
    if (activeTab === 'Suspicious Activities') fetchSuspiciousActivities();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [activeTab]);
  const [reviewResponse, setReviewResponse] = useState('');
  const [promotions, setPromotions] = useState<any[]>([]);

  const [promotionModal, setPromotionModal] = useState<{ open: boolean; mode: 'add' | 'edit'; id?: any }>({ open: false, mode: 'add' });
  const [promotionProductsModal, setPromotionProductsModal] = useState({ open: false, promotionId: null as number | null });
  const [linkedProductIds, setLinkedProductIds] = useState<number[]>([]);
  const [newPromotion, setNewPromotion] = useState({ title: '', description: '', image_url: '', link: '', active: true, target_role: 'all', start_time: '', end_time: '', banner_type: 'standard', is_default: false });
  const [deliveryFee, setDeliveryFee] = useState('0');
  const [freeDeliveryThreshold, setFreeDeliveryThreshold] = useState('500');
  const [deliveryAreas, setDeliveryAreas] = useState<any[]>([]);
  const [deliveryAreaModal, setDeliveryAreaModal] = useState({ open: false, mode: 'add' as 'add' | 'edit', area: null as any });
  const [newDeliveryArea, setNewDeliveryArea] = useState({ name: '', fee: '0', min_order: '0' });

  const [productVariants, setProductVariants] = useState<any[]>([]);
  const [variantModal, setVariantModal] = useState<{ open: boolean; mode: 'add' | 'edit'; variant?: any; productId?: any }>({ open: false, mode: 'add' });
  const [newVariant, setNewVariant] = useState({ name: '', price: '', stock: '', unit_quantity: '1', is_default: false });

  const [selectedSegment, setSelectedSegment] = useState('all');
  const [customerSearchTerm, setCustomerSearchTerm] = useState('');
  const getCustomerSegment = (user: any) => user.segment || 'New';
  const filteredUsers = (selectedSegment === 'all' 
    ? users 
    : selectedSegment === 'Khata Requests'
      ? users.filter(u => u.khata_requested && !u.khata_enabled)
      : users.filter(u => getCustomerSegment(u) === selectedSegment)
  ).filter(u => {
    if (!customerSearchTerm) return true;
    const term = customerSearchTerm.toLowerCase();
    return (
      (u.name || '').toLowerCase().includes(term) ||
      (u.email || '').toLowerCase().includes(term) ||
      (u.phone || '').includes(term)
    );
  });
  const segments = ['All', ...Array.from(new Set(users.map(u => getCustomerSegment(u))))];

  const fetchOrderStatusHistory = async (orderId: number) => {
    try {
      const data = await fetchWithHandling<any>(`/api/admin/orders/${orderId}/status-history`, { headers: getAuthHeaders() });
      if (data) {
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
      const data = await fetchWithHandling<any[]>(`/api/admin/activities?userId=${userId}`, { headers: getAuthHeaders() });
      if (data) {
        setCustomerActivities(data);
      }
    } catch (err) {
      logger.error('Failed to fetch individual customer activities:', err);
    }
  };

  useEffect(() => {
    if (customerModal.open && customerModal.user) {
      fetchCustomerActivities(customerModal.user.id);
    }
  }, [customerModal.open, customerModal.user?.id]);

  // Enhanced Product Filters
  const [productStockFilter, setProductStockFilter] = useState<'all' | 'low' | 'out' | 'expiring'>('all');
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
      const data = await fetchWithHandling<any>('/api/admin/purchases', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(purchaseForm)
      });
      if (data) {
        toast.success('Purchase recorded successfully');
        setPurchaseForm({ supplier_id: '', product_id: '', quantity: '', cost_price: '', invoice_number: '', batch_number: '', expiry_date: '' });
      }
    } catch (err) {
      logger.error('Purchase submit error:', err);
    }
  };

  const [walletRequests, setWalletRequests] = useState<any[]>([]);
  const [runners, setRunners] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [isFetchingAudit, setIsFetchingAudit] = useState(false);
  const [admins, setAdmins] = useState<any[]>([]);
  const [isAdminRefreshing, setIsAdminRefreshing] = useState(false);
  const [deletionRequests, setDeletionRequests] = useState<any[]>([]);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [runnerModal, setRunnerModal] = useState<{ open: boolean; mode: 'add' | 'edit'; runner?: any }>({ open: false, mode: 'add' });
  const [newRunner, setNewRunner] = useState({ name: '', phone: '' });

  const fetchAdmins = async () => {
    if (!navigator.onLine) return;
    setIsAdminRefreshing(true);
    try {
      const data = await adminService.getAdmins(getAuthHeaders());
      if (data) setAdmins(data);
    } catch (err) {}
    finally { setIsAdminRefreshing(false); }
  };

  const fetchDeletionRequests = async () => {
    if (!navigator.onLine) return;
    try {
      const data = await fetchWithHandling<any[]>('/api/admin/deletion-requests', { headers: getAuthHeaders() });
      if (data) setDeletionRequests(data);
    } catch (err) {}
  };

  const approveDeletion = async (id: number) => {
    if (!confirm('This will schedule the absolute deletion of the user. Are you sure?')) return;
    try {
      await fetchWithHandling(`/api/admin/deletion-requests/${id}/approve`, {
        method: 'POST',
        headers: getAuthHeaders()
      });
      toast.success('Deletion authorized and scheduled');
      fetchDeletionRequests();
    } catch (err) {}
  };

  const rejectDeletion = async (id: number) => {
    try {
      await fetchWithHandling(`/api/admin/deletion-requests/${id}/reject`, {
        method: 'POST',
        headers: getAuthHeaders()
      });
      toast.success('Deletion request rejected');
      fetchDeletionRequests();
    } catch (err) {}
  };

  useEffect(() => {
    if (activeTab === 'Admin Management') {
      fetchAdmins();
      fetchDeletionRequests();
    }
  }, [activeTab]);

  const fetchRunners = async () => {
    try {
      const data = await fetchWithHandling<any[]>('/api/admin/runners', { headers: getAuthHeaders() });
      if (data) {
        setRunners(data);
      }
    } catch (err) {
      logger.error('Failed to fetch runners:', err);
    }
  };

  const fetchAuditLogs = async (target_type = 'all', limit = 100) => {
    setIsFetchingAudit(true);
    try {
      const data = await fetchWithHandling<any[]>(`/api/admin/audit-logs?target_type=${target_type}&limit=${limit}`, { headers: getAuthHeaders() });
      if (data) {
        setAuditLogs(data);
      }
    } catch (err) {
      logger.error('Failed to fetch audit logs:', err);
    } finally {
      setIsFetchingAudit(false);
    }
  };

  const fetchSuspiciousActivities = async () => {
    if (!navigator.onLine) return;
    try {
      const data = await adminService.getSuspiciousActivities(getAuthHeaders());
      if (data) {
        setSuspiciousActivities(data);
      }
    } catch (err) {
      logger.error('Failed to fetch suspicious activities:', err);
    }
  };

  const handleResolveSuspicious = async (id: number) => {
    try {
      const data = await fetchWithHandling<any>(`/api/admin/suspicious-activities/${id}/resolve`, { 
        method: 'POST',
        headers: getAuthHeaders()
      });
      if (data) {
        toast.success('Activity resolved');
        fetchSuspiciousActivities();
      }
    } catch (err) {
      logger.error('Failed to resolve activity:', err);
    }
  };

  const handleAssignRunner = async (orderId: number, runnerId: number) => {
    if (checkOffline()) return;
    try {
      const data = await fetchWithHandling<any>(`/api/admin/orders/${orderId}/assign-runner`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ runner_id: runnerId, estimated_delivery_minutes: 30 })
      });
      if (data) {
        toast.success('Runner assigned and order dispatched!');
        fetchOrders(); // Refresh orders
        fetchRunners(); // Refresh runners
      }
    } catch (err) {
      logger.error('Assign runner error:', err);
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
      const data = await fetchWithHandling<any>('/api/admin/runners', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(newRunner)
      });
      if (data) {
        toast.success('Runner added successfully');
        setRunnerModal({ open: false, mode: 'add', runner: null });
        setNewRunner({ name: '', phone: '' });
        fetchRunners();
      }
    } catch (err) {
      logger.error('Save runner error:', err);
    }
  };

  const fetchWalletRequests = async () => {
    if (!navigator.onLine) return;
    try {
      const data = await adminService.getWalletRequests(getAuthHeaders());
      if (data) {
        setWalletRequests(data);
      }
    } catch (err) {
      logger.error('Failed to fetch wallet requests:', err);
    }
  };

  useEffect(() => {
    if (activeTab === 'Wallet Requests') {
      fetchWalletRequests();
    }
  }, [activeTab]);

  const handleApproveWalletRequest = async (id: number) => {
    try {
      const data = await fetchWithHandling<any>(`/api/admin/wallet/requests/${id}/approve`, { 
        method: 'POST',
        headers: getAuthHeaders()
      });
      if (data) {
        toast.success('Wallet request approved');
        fetchWalletRequests();
      }
    } catch (err) {
      logger.error('Approve wallet request error:', err);
    }
  };

  const handleRejectWalletRequest = async (id: number) => {
    const reason = prompt('Enter rejection reason:');
    if (reason === null) return;
    try {
      const data = await fetchWithHandling<any>(`/api/admin/wallet/requests/${id}/reject`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ reason })
      });
      if (data) {
        toast.success('Wallet request rejected');
        fetchWalletRequests();
      }
    } catch (err) {
      logger.error('Reject wallet request error:', err);
    }
  };
  const handleApproveOrderPayment = async (orderId: number) => {
    const notes = prompt('Enter payment verification notes (e.g. UTR matches):', 'Payment verified manually by admin.');
    if (notes === null) return;
    try {
      const data = await fetchWithHandling<any>(`/api/admin/orders/${orderId}/manual-approve`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ notes })
      });
      if (data) {
        toast.success(`Order ${orderId} marked as PAID`);
        fetchOrders();
        if (orderModal.order && (orderModal.order.id === orderId || orderId.toString().includes(orderModal.order.order_id))) {
           setOrderModal({ ...orderModal, order: { ...orderModal.order, payment_status: 'paid' } });
        }
      }
    } catch (err) {
      logger.error('Payment approval error:', err);
    }
  };

  const [poData, setPoData] = useState<any[] | null>(null);
  const [showPOPrint, setShowPOPrint] = useState(false);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [supplierModal, setSupplierModal] = useState({ open: false, mode: 'add' as 'add' | 'edit', supplier: null as any });
  const [newSupplier, setNewSupplier] = useState({ name: '', contact_person: '', email: '', phone: '', address: '' });
  const [returns, setReturns] = useState<any[]>([]);
  const [selectedReturnReason, setSelectedReturnReason] = useState<string>('all');

  const [promotionRules, setPromotionRules] = useState<PromotionRule[]>([]);
  const [promotionRuleFormModal, setPromotionRuleFormModal] = useState({ open: false, mode: 'add' as 'add' | 'edit', rule: null as PromotionRule | null });
  const [newPromotionRuleData, setNewPromotionRuleData] = useState<Partial<PromotionRule>>({ title: '', type: 'bogo', target_type: 'all', target_id: '', condition_qty: 0, reward_qty: 0, discount_value: 0, active: true, start_date: '', end_date: '' });

  const handlePromotionRuleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPromotionRuleData.start_date && newPromotionRuleData.end_date && newPromotionRuleData.start_date > newPromotionRuleData.end_date) {
      toast.error('End Date cannot be before Start Date');
      return;
    }
    try {
      const url = promotionRuleFormModal.mode === 'add' ? '/api/admin/promotional-rules' : `/api/admin/promotional-rules/${promotionRuleFormModal.rule?.id}`;
      const method = promotionRuleFormModal.mode === 'add' ? 'POST' : 'PUT';
      const data = await fetchWithHandling<any>(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify(newPromotionRuleData)
      });
      if (data) {
        toast.success(promotionRuleFormModal.mode === 'add' ? 'Rule created' : 'Rule updated');
        fetchPromotionRules();
        setPromotionRuleFormModal({ open: false, mode: 'add', rule: null });
        setNewPromotionRuleData({ title: '', type: 'bogo', target_type: 'all', target_id: '', condition_qty: 0, reward_qty: 0, discount_value: 0, active: true });
      }
    } catch (err: any) {
      handleAppError(err, 'Failed to save rule', 'promotionRuleSubmit', true);
    }
  };

  const handleDeleteRule = async (id: number) => {
    if (!confirm('Are you sure you want to delete this rule?')) return;
    try {
      const data = await fetchWithHandling<any>(`/api/admin/promotional-rules/${id}`, { 
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      if (data) {
        toast.success('Rule deleted');
        fetchPromotionRules();
      }
    } catch (err: any) {
      handleAppError(err, 'Failed to delete rule', 'deleteRule', true);
    }
  };


  const handleApproveReturn = async (returnObj: any) => {
    const amount = prompt(`Enter refund amount to drop in ${returnObj.user_name}'s wallet for Order #${returnObj.order_num}:`, returnObj.refund_amount || 0);
    if (amount === null) return;

    const restock = confirm(`Do you want to restock these ${returnObj.quantity} items back into the inventory?`);
    
    try {
      const data = await fetchWithHandling<any>(`/api/admin/returns/${returnObj.id}/approve`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ 
          refund_amount: parseFloat(amount),
          restock: restock 
        })
      });
      if (data) {
        toast.success(`Return approved. ₹${amount} added to user wallet.${restock ? ' Stock updated.' : ''}`);
        fetchReturns();
      }
    } catch (err) {
      logger.error('Approve return error:', err);
    }
  };

  const handleRejectReturn = async (id: number) => {
    if (!confirm('Reject this return request?')) return;
    try {
      const data = await fetchWithHandling<any>(`/api/admin/returns/${id}/reject`, { 
        method: 'POST',
        headers: getAuthHeaders()
      });
      if (data) {
        toast.success('Return rejected');
        fetchReturns();
      }
    } catch (err) {
      logger.error('Reject return error:', err);
    }
  };

  const fetchSuppliers = async () => {
    if (!navigator.onLine) return;
    try {
      const data = await adminService.getSuppliers(getAuthHeaders());
      if (data) {
        setSuppliers(data);
      }
    } catch (err) {
      logger.error('Failed to fetch suppliers:', err);
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
      const data = await fetchWithHandling<any>(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify(newSupplier)
      });
      if (data) {
        toast.success(`Supplier ${supplierModal.mode === 'add' ? 'created' : 'updated'} successfully`);
        setSupplierModal({ open: false, mode: 'add', supplier: null });
        fetchSuppliers();
      }
    } catch (err) {
      logger.error('Save supplier error:', err);
    }
  };

  const handleDeleteSupplier = async (id: number) => {
    if (!confirm('Are you sure you want to delete this supplier? This will also unlink them from their products.')) return;
    try {
      const data = await fetchWithHandling<any>(`/api/admin/suppliers/${id}`, { 
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      if (data) {
        toast.success('Supplier deleted');
        fetchSuppliers();
      }
    } catch (err) {
      logger.error('Delete supplier error:', err);
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
    if (activeTab === 'Promotional Rules') {
      fetchPromotionRules();
    }
  }, [activeTab]);

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
      const data = await fetchWithHandling<any>(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify(newBulkDiscount)
      });
      if (data) {
        toast.success(`Bulk discount ${bulkDiscountModal.mode === 'add' ? 'created' : 'updated'} successfully`);
        setBulkDiscountModal({ open: false, mode: 'add', discount: null });
        fetchBulkDiscounts();
      }
    } catch (err) {
      logger.error('Bulk discount submit error:', err);
    }
  };

  const handleToggleBulkDiscount = async (discount: any) => {
    try {
      const data = await fetchWithHandling<any>(`/api/admin/bulk-discounts/${discount.id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ ...discount, active: !discount.active })
      });
      if (data) {
        toast.success(`Bulk discount ${!discount.active ? 'enabled' : 'disabled'}`);
        fetchBulkDiscounts();
      }
    } catch (err) {
      logger.error('Toggle bulk discount error:', err);
    }
  };

  const handleDeleteBulkDiscount = async (id: number) => {
    if (!confirm('Are you sure you want to delete this bulk discount?')) return;
    try {
      const data = await fetchWithHandling<any>(`/api/admin/bulk-discounts/${id}`, { 
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      if (data) {
        toast.success('Bulk discount deleted');
        fetchBulkDiscounts();
      }
    } catch (err) {
      logger.error('Delete bulk discount error:', err);
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
        const data = await fetchWithHandling<any>(`/api/admin/search?q=${encodeURIComponent(debouncedGlobalSearchQuery)}`, { headers: getAuthHeaders() });
        if (data) {
          setGlobalSearchResults(data);
        }
      } catch (err) {
        logger.error('Global search error:', err);
      } finally {
        setIsGlobalSearching(false);
      }
    };

    performGlobalSearch();
  }, [debouncedGlobalSearchQuery]);

  const fetchCustomerOrders = async (userId: number) => {
    try {
      const data = await fetchWithHandling<any[]>(`/api/admin/users/${userId}/orders`, { headers: getAuthHeaders() });
      if (data) {
        setCustomerHistoryModal({ open: true, userId, orders: data });
      }
    } catch (err) {
      console.error('Failed to fetch customer orders:', err);
    }
  };


  const fetchPromotionProducts = async (promoId: number) => {
    try {
      const data = await fetchWithHandling<any[]>(`/api/admin/promotions/${promoId}/products`, { headers: getAuthHeaders() });
      if (data) {
        setLinkedProductIds(data.map((p: any) => p.id));
      }
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
    const socket = io();
    const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');

    socket.on('connect', () => {
      console.log('Connected to admin notification center (Socket.io)');
    });

    socket.on('data', (data) => {
        audio.play().catch(e => console.log('Audio play failed:', e));
        
        const processData = (d: any) => {
          switch (d.type) {
            case 'NEW_ORDER':
              toast.success(`New Order Received! Total: ₹${d.payload.total}`, {
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
              const stockAlerts = d.payload || [{ id: d.product_id, name: d.name, stock: d.stock }];
              if (Array.isArray(stockAlerts)) {
                stockAlerts.forEach((item: any) => {
                  if (item && item.name) {
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
                  }
                });
              }
              fetchAllProducts();
              fetchNotifications();
              break;
              
            case 'NEW_TICKET':
              toast.success(`New Support Inquiry: ${d.payload.subject}`, {
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
              fetchNotifications();
              break;
              
            case 'NEW_MESSAGE':
              toast.success(`New Message in Ticket #${d.payload.ticket_id}`, {
                duration: 4000,
                icon: '📩',
                style: {
                  borderRadius: '16px',
                  background: '#6366f1',
                  color: '#fff',
                  fontWeight: 'bold'
                }
              });
              if (selectedTicket && selectedTicket.id === parseInt(d.payload.ticket_id)) {
                fetchTicketMessages(selectedTicket.id);
              }
              break;
          }
        };

        if (data.type === 'BATCHED_ORDER_UPDATES') {
            data.payload.forEach((d: any) => processData(d));
        } else {
            processData(data);
        }
    });

    return () => {
      socket.disconnect();
    };
  }, [selectedTicket]);

  const filteredProducts = allProducts.filter(product => {
    const matchesSearch = !productSearchTerm || 
      (product.name || '').toLowerCase().includes(productSearchTerm.toLowerCase()) ||
      (product.description || '').toLowerCase().includes(productSearchTerm.toLowerCase()) ||
      (product.category || '').toLowerCase().includes(productSearchTerm.toLowerCase());
    
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
      const data = await fetchWithHandling<any[]>('/api/admin/system-logs', { headers: getAuthHeaders() });
      if (data) {
        setSystemLogs(data);
      }
    } catch (err) {
      console.error('Failed to fetch system logs:', err);
    } finally {
      setIsRefreshingLogs(false);
    }
  };

  const fetchSystemHealth = async () => {
    try {
      const data = await fetchWithHandling<any>('/api/admin/system/health', { headers: getAuthHeaders() });
      if (data) setSystemHealth(data);
    } catch (err) {}
  };

  const resolveSuspiciousActivity = async (id: number) => {
    try {
      const data = await fetchWithHandling<any>(`/api/admin/suspicious-activities/${id}/resolve`, { 
        method: 'POST',
        headers: getAuthHeaders()
      });
      if (data) {
        toast.success('Activity resolved');
        fetchSuspiciousActivities();
      }
    } catch (err) {
      console.error('Resolve suspicious activity error:', err);
    }
  };

  const [bugReports, setBugReports] = useState<any[]>([]);

  const fetchBugReports = async () => {
    try {
      const data = await fetchWithHandling<any[]>('/api/admin/bugs', { headers: getAuthHeaders() });
      if (data) {
        setBugReports(data);
      }
    } catch (err) {
      console.error('Bug reports fetch error:', err);
    }
  };

  const fetchReviews = async () => {
    try {
      const data = await fetchWithHandling<any[]>('/api/admin/reviews', { headers: getAuthHeaders() });
      if (data) setReviews(data);
    } catch (err) {
      console.error('Failed to fetch reviews:', err);
    }
  };

  useEffect(() => {
    if (activeTab === 'Automatic Reports') {
      fetchBugReports();
    }
    if (activeTab === 'Admin Management') {
      fetchAdmins();
    }
    if (activeTab === 'System Status') {
      fetchSystemLogs();
      fetchSystemHealth();
    }
    if (activeTab === 'Reviews') {
      fetchReviews();
    }
    if (activeTab === 'Purchase Orders') {
      // Logic handled via onSnapshot in PurchaseOrdersTab
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab !== 'System Status') return;

    const q = query(
      collection(db, 'error_logs'),
      orderBy('timestamp', 'desc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const logs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setErrorLogs(logs);
    }, (error) => {
      console.warn('error_logs subscription failed, using REST API fallback:', error.message);
      // Fetch from API instead of throwing!
      fetchWithHandling<any[]>('/api/admin/system-logs', { headers: getAuthHeaders() })
        .then(data => {
          if (data) {
            setErrorLogs(data.map(log => ({
              id: log.id || log.uid || Math.random().toString(),
              timestamp: log.created_at || log.timestamp || new Date().toISOString(),
              message: log.message || JSON.stringify(log),
              severity: log.level || 'ERROR',
              context: log.context || 'System'
            })));
          }
        })
        .catch(fetchErr => {
          console.error('REST backup error_logs fetch failed:', fetchErr);
        });
    });

    return () => {
      unsubscribe();
    };
  }, [activeTab]);



  const fetchConfig = async () => {
    if (!navigator.onLine) return;
    try {
      const data = await adminService.getConfig(getAuthHeaders());
      if (data) {
        setConfig(data);
      }
    } catch (err) {
      console.error('Failed to fetch config:', err);
    }
  };



  const fetchUsers = () => {
    if (!navigator.onLine) return () => {};
    // Only use REST if explicitly requested or if onSnapshot is unavailable/unstable
    // Removed proactive load to stop multiple API calls
    
    const q = query(collection(db, 'users'), orderBy('created_at', 'desc'));
    return onSnapshot(q, (snapshot) => {
      const usersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUsers(usersData);
    }, (err) => {
      console.warn('Firestore Users subscription fell back safely to REST API due to:', err.message);
      adminService.getUsers(getAuthHeaders())
        .then(data => {
          if (data) setUsers(data);
        })
        .catch(fetchErr => {
          console.error('REST backup users fetch failed:', fetchErr);
        });
    });
  };

  useEffect(() => {
    let unsubscribe: () => void;
    if (activeTab === 'Customers') {
      unsubscribe = fetchUsers();
    }
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [activeTab]);

  const fetchAllProducts = async () => {
    try {
      const data = await fetchWithHandling<any[]>('/api/products', { headers: getAuthHeaders() });
      if (data) {
        setAllProducts(data);
        setLowStockProducts(data.filter((p: any) => p.stock <= (p.reorder_point || 5)));
      }
    } catch (err) {
      console.error('Products fetch error:', err);
    }
  };

  const fetchCategories = async () => {
    try {
      const data = await adminService.getCategories(getAuthHeaders());
      if (data) {
        setCategories(data);
      }
    } catch (err) {
      console.error('Categories fetch error:', err);
    }
  };

  const fetchTickets = () => {
    // Proactive HTTP load to protect against direct Firestore subscription permission failure
    fetchWithHandling<any[]>('/api/admin/support/tickets', { headers: getAuthHeaders() })
      .then(data => {
        if (data) setTickets(data);
      })
      .catch(err => {
        console.warn('REST Tickets fetch warning:', err);
      });

    const q = query(collection(db, 'tickets'), orderBy('created_at', 'desc'));
    return onSnapshot(q, (snapshot) => {
      const ticketsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTickets(ticketsData);
    }, (err) => {
      console.warn('Firestore Tickets subscription fell back safely to REST API due to:', err.message);
      fetchWithHandling<any[]>('/api/admin/support/tickets', { headers: getAuthHeaders() })
        .then(data => {
          if (data) setTickets(data);
        })
        .catch(fetchErr => {
          console.error('REST backup tickets fetch failed:', fetchErr);
        });
    });
  };

  const fetchNotifications = async () => {
    try {
      const data = await adminService.getNotifications(getAuthHeaders());
      if (data) {
        setNotifications(data);
      }
    } catch (err) {
      console.error('Notifications fetch error:', err);
    }
  };

  const fetchDeliveryAreas = async () => {
    try {
      const data = await fetchWithHandling<any[]>('/api/delivery-areas', { headers: getAuthHeaders() });
      if (data) {
        setDeliveryAreas(data);
      }
    } catch (err) {
      console.error('Delivery areas fetch error:', err);
    }
  };

  const fetchPromotions = async () => {
    if (!navigator.onLine) return;
    setLoading(true);
    try {
      const data = await fetchWithHandling<any[]>('/api/promotions', { headers: getAuthHeaders() });
      if (data) {
        setPromotions(data);
      }
    } catch (err) {
      console.error('Promotions fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPromotionRules = async () => {
    if (!navigator.onLine) return;
    setLoading(true);
    try {
      const data = await adminService.getPromotionRules(getAuthHeaders());
      if (data) {
        setPromotionRules(data);
      }
    } catch (err: any) {
      handleAppError(err, 'Failed to fetch promotion rules', 'fetchPromotionRules');
    } finally {
      setLoading(false);
    }
  };

  const fetchBulkDiscounts = async () => {
    if (!navigator.onLine) return;
    setLoading(true);
    try {
      const data = await adminService.getBulkDiscounts(getAuthHeaders());
      if (data) {
        setBulkDiscounts(data);
      }
    } catch (err) {
      console.error('Bulk discounts fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddDeliveryArea = async () => {
    try {
      const data = await fetchWithHandling<any>('/api/admin/delivery-areas', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(newDeliveryArea)
      });
      if (data) {
        toast.success('Delivery area added');
        setDeliveryAreaModal({ open: false, mode: 'add', area: null });
        setNewDeliveryArea({ name: '', fee: '0', min_order: '0' });
        fetchDeliveryAreas();
      }
    } catch (err) {
      console.error('Add delivery area error:', err);
    }
  };

  const handleUpdateDeliveryArea = async () => {
    try {
      const data = await fetchWithHandling<any>(`/api/admin/delivery-areas/${deliveryAreaModal.area.id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(newDeliveryArea)
      });
      if (data) {
        toast.success('Delivery area updated');
        setDeliveryAreaModal({ open: false, mode: 'add', area: null });
        setNewDeliveryArea({ name: '', fee: '0', min_order: '0' });
        fetchDeliveryAreas();
      }
    } catch (err) {
      console.error('Update delivery area error:', err);
    }
  };

  const handleDeleteDeliveryArea = async (id: number) => {
    if (!confirm('Are you sure you want to delete this delivery area?')) return;
    try {
      const data = await fetchWithHandling<any>(`/api/admin/delivery-areas/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      if (data) {
        toast.success('Delivery area deleted');
        fetchDeliveryAreas();
      }
    } catch (err) {
      console.error('Delete delivery area error:', err);
    }
  };

  const fetchProductVariants = async (productId: number) => {
    try {
      const data = await fetchWithHandling<any[]>(`/api/products/${productId}/variants`, { headers: getAuthHeaders() });
      if (data) {
        setProductVariants(data);
      }
    } catch (err) {
      console.error('Variants fetch error:', err);
    }
  };

  const handleAddVariant = async () => {
    if (!variantModal.productId) return;
    try {
      const data = await fetchWithHandling<any>(`/api/admin/products/${variantModal.productId}/variants`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(newVariant)
      });
      if (data) {
        toast.success('Variant added');
        setVariantModal({ ...variantModal, open: false });
        setNewVariant({ name: '', price: '', stock: '', unit_quantity: '1', is_default: false });
        fetchProductVariants(variantModal.productId);
      }
    } catch (err) {
      console.error('Add variant error:', err);
    }
  };

  const handleUpdateVariant = async () => {
    if (!variantModal.variant || !variantModal.productId) return;
    try {
      const data = await fetchWithHandling<any>(`/api/admin/variants/${variantModal.variant.id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(newVariant)
      });
      if (data) {
        toast.success('Variant updated');
        setVariantModal({ ...variantModal, open: false });
        setNewVariant({ name: '', price: '', stock: '', unit_quantity: '1', is_default: false });
        fetchProductVariants(variantModal.productId);
      }
    } catch (err) {
      console.error('Update variant error:', err);
    }
  };

  const handleDeleteVariant = async (id: number) => {
    if (!confirm('Are you sure you want to delete this variant?')) return;
    try {
      const data = await fetchWithHandling<any>(`/api/admin/variants/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      if (data) {
        toast.success('Variant deleted');
        if (variantModal.productId) fetchProductVariants(variantModal.productId);
      }
    } catch (err) {
      console.error('Delete variant error:', err);
    }
  };

  const handleBulkOrderAction = async (action: string, value?: any) => {
    if (!confirm(`Are you sure you want to ${action} ${selectedOrders.length} orders?`)) return;
    try {
      const data = await fetchWithHandling<any>('/api/admin/orders/bulk-update', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ ids: selectedOrders, action, value })
      });
      if (data) {
        toast.success('Bulk action completed');
        setSelectedOrders([]);
        fetchOrders();
      }
    } catch (err) {
      console.error('Bulk order action error:', err);
    }
  };

  // Form persistence for product creation
  useEffect(() => {
    const saved = localStorage.getItem('hgs_draft_product');
    if (saved && productModal.mode === 'add') {
      try {
        const parsed = JSON.parse(saved);
        setNewProduct(prev => ({ ...prev, ...parsed }));
      } catch (e) {}
    }
  }, []);

  useEffect(() => {
    if (productModal.mode === 'add' && productModal.open) {
      localStorage.setItem('hgs_draft_product', JSON.stringify(newProduct));
    }
  }, [newProduct, productModal.open, productModal.mode]);

  const fetchSearchSuggestions = async (q: string) => {
    if (!q) {
      setSearchSuggestions([]);
      return;
    }
    try {
      const data = await fetchWithHandling<string[]>(`/api/search/suggestions?q=${encodeURIComponent(q)}`, { headers: getAuthHeaders() });
      if (data) {
        setSearchSuggestions(data);
      }
    } catch (err) {
      console.error('Suggestions fetch error:', err);
    }
  };


  const fetchOrderDetailsModal = async (order: any) => {
    try {
      const orderDetails = await fetchWithHandling<any>(`/api/orders/${order.id}`, { headers: getAuthHeaders() });
      if (orderDetails) {
        setOrderModal({ open: true, order: orderDetails, statusHistory: [] });

        const histData = await fetchWithHandling<any>(`/api/admin/orders/${order.id}/status-history`, { headers: getAuthHeaders() });
        if (histData) {
          setOrderHistory(histData.history || []);
        }
      }
    } catch (err: any) {
      console.error('Failed to fetch order details:', err);
      // Fallback
      setOrderModal({ open: true, order, statusHistory: [] });
    }
  };

  const fetchTicketMessages = async (ticketId: number) => {
    try {
      const data = await fetchWithHandling<any[]>(`/api/support/tickets/${ticketId}/messages`, { headers: getAuthHeaders() });
      if (data) {
        setTicketMessages(data);
      }
    } catch (err) {
      console.error('Ticket messages fetch error:', err);
    }
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
      
      const [data, salesData] = await Promise.all([
        fetchWithHandling<any>(`/api/admin/analytics?${params.toString()}`, { headers: getAuthHeaders() }),
        fetchWithHandling<any>(`/api/admin/sales-analytics?${params.toString()}`, { headers: getAuthHeaders() })
      ]);
      
      if (data) setAnalyticsData(data);
      if (salesData) setSalesAnalytics(salesData);
    } catch (err) {
      console.error('Failed to fetch analytics:', err);
    } finally {
      setIsFetchingAnalytics(false);
    }
  };

  const getWeeklyComparisonData = () => {
    if (!salesAnalytics?.dailySales || salesAnalytics.dailySales.length === 0) {
      return [];
    }
    
    const rawData = [...salesAnalytics.dailySales];
    const thisWeekDays = rawData.slice(-7);
    const lastWeekDays = rawData.slice(-14, -7);
    
    const weekdaysShort = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    const comparisonList = weekdaysShort.map((dayName, idx) => {
      const thisWeekItem = thisWeekDays.find(item => {
        const d = new Date(item.date);
        return d.getDay() === idx;
      });
      
      const lastWeekItem = lastWeekDays.find(item => {
        const d = new Date(item.date);
        return d.getDay() === idx;
      });
      
      return {
        day: dayName,
        dayIdx: idx,
        thisWeek: thisWeekItem ? thisWeekItem.total : 0,
        lastWeek: lastWeekItem ? lastWeekItem.total : 0,
        thisWeekDate: thisWeekItem?.date || '',
        lastWeekDate: lastWeekItem?.date || '',
      };
    });
    
    if (thisWeekDays.length > 0) {
      const firstDayIdx = new Date(thisWeekDays[0].date).getDay();
      const orderedList = [];
      for (let i = 0; i < 7; i++) {
        const targetIdx = (firstDayIdx + i) % 7;
        const compItem = comparisonList.find(c => c.dayIdx === targetIdx);
        if (compItem) {
          orderedList.push(compItem);
        }
      }
      return orderedList;
    }
    
    return comparisonList;
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
        const headers = getAuthHeaders();
        // Optimized to only fetch non-live/non-polled data
        const [configData, usersData, expiringData, notifData, catData] = await Promise.all([
          adminService.getConfig(headers),
          adminService.getUsers(headers),
          adminService.getExpiring(headers),
          adminService.getNotifications(headers),
          adminService.getCategories(headers)
        ]);

        if (configData) setConfig(configData);
        if (usersData) setUsers(usersData);
        if (expiringData) setExpiringSoon(expiringData);
        if (notifData) setNotifications(notifData);
        if (catData) setCategories(catData);
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
      await fetchWithHandling('/api/admin/settings', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ key, value })
      });
      toast.success(`Updated ${key}`);
      fetchConfig();
    } catch (err) {
      console.error('Failed to update setting:', err);
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
      const data = await fetchWithHandling<any>(`/api/admin/orders/${id}/status`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ status, rejection_reason })
      });
      
      if (data) {
        toast.success(`Order #${id} status updated to ${status}`);
        fetchOrders();
      }
    } catch (err) {
      console.error('Update order status error:', err);
    }
  };

  const handleRespondReview = async () => {
    if (!reviewResponseModal.review || !reviewResponse) return;
    try {
      const data = await fetchWithHandling<any>(`/api/admin/reviews/${reviewResponseModal.review.id}/respond`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ response: reviewResponse })
      });
      if (data) {
        toast.success('Response submitted');
        setReviewResponseModal({ open: false, review: null });
        setReviewResponse('');
        const reviewsData = await fetchWithHandling<any[]>('/api/admin/reviews', { headers: getAuthHeaders() });
        if (reviewsData) setReviews(reviewsData);
      }
    } catch (err) {
      console.error('Review respond error:', err);
    }
  };

  const handleDeletePromotion = async (id: number) => {
    if (!window.confirm('Delete this promotion?')) return;
    try {
      const data = await fetchWithHandling<any>(`/api/admin/promotions/${id}`, { 
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      if (data) {
        toast.success('Promotion deleted');
        fetchPromotions();
      }
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
      const data = await fetchWithHandling<any>(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify(newPromotion)
      });
      if (data) {
        toast.success(`Promotion ${promotionModal.mode === 'add' ? 'added' : 'updated'} successfully`);
        setPromotionModal({ open: false, mode: 'add', id: null });
        setNewPromotion({ title: '', description: '', image_url: '', link: '', active: true } as any);
        fetchPromotions();
      }
    } catch (err: any) {
      handleAppError(err, 'Failed to save promotion', 'savePromotion', true);
    }
  };

  const togglePromotionStatus = async (id: number) => {
    try {
      const data = await fetchWithHandling<any>(`/api/admin/promotions/${id}/toggle`, { 
        method: 'POST',
        headers: getAuthHeaders()
      });
      if (data) {
        toast.success('Promotion status updated');
        fetchPromotions();
      }
    } catch (err: any) {
      handleAppError(err, 'Failed to update status', 'togglePromotionStatus', true);
    }
  };

  const togglePromotionRuleStatus = async (id: number) => {
    try {
      const data = await fetchWithHandling<any>(`/api/admin/promotional-rules/${id}/toggle`, { 
        method: 'POST',
        headers: getAuthHeaders()
      });
      if (data) {
        toast.success('Rule status updated');
        fetchPromotionRules();
      }
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

  const [isSubmittingProduct, setIsSubmittingProduct] = useState(false);
  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingProduct(true);
    const url = productModal.mode === 'add' ? '/api/admin/products' : `/api/admin/products/${editingProduct.id}`;
    const method = productModal.mode === 'add' ? 'POST' : 'PUT';

    // Calculate discounted price
    const retail = parseFloat(newProduct.retail_price || '0');
    const discount = parseFloat(newProduct.discount || '0');
    const calculatedPrice = discount > 0 ? Math.round(retail * (1 - discount / 100)) : retail;

    const productData = {
      ...newProduct,
      images: JSON.stringify(newProduct.images),
      price: calculatedPrice.toString(),
      discount_price: calculatedPrice // Also set discount_price for compatibility
    };

    try {
      const data = await fetchWithHandling<any>(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify(productData)
      });
      if (data) {
        toast.success(`Product ${productModal.mode === 'add' ? 'added' : 'updated'}`);
        if (productModal.mode === 'add') {
          localStorage.removeItem('hgs_draft_product');
        }
        setProductModal({ open: false, mode: 'add' });
        setNewProduct({ 
          name: '', description: '', price: '', stock: '', category: 'Grocery', image: '',
          retail_price: '', wholesale_price: '', discount: '0', reorder_point: '10', max_qty: '0', is_listed: true,
          images: [],
          specifications: {},
          batch_number: '',
          expiry_date: '',
          unit: 'kg',
          is_subscribable: false
        } as any);
        fetchAllProducts();
      }
    } catch (err) {
      console.error('Product submit error:', err);
    } finally {
      setIsSubmittingProduct(false);
    }
  };

  const handleStockEntrySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stockEntryModal.product) return;
    try {
      const data = await fetchWithHandling<any>('/api/admin/inventory/purchase', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          product_id: stockEntryModal.product.id,
          ...purchaseForm
        })
      });
      if (data) {
        toast.success('Stock entry recorded successfully');
        setStockEntryModal({ open: false, product: null });
        setPurchaseForm({ supplier_id: '', product_id: '', quantity: '', cost_price: '', invoice_number: '', batch_number: '', expiry_date: '' });
        fetchAllProducts();
        fetchStats();
      }
    } catch (err) {
      console.error('Stock entry error:', err);
    }
  };

  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = categoryModal.mode === 'add' ? '/api/admin/categories' : `/api/admin/categories/${editingCategory.id}`;
    const method = categoryModal.mode === 'add' ? 'POST' : 'PUT';

    try {
      const data = await fetchWithHandling<any>(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify(newCategory)
      });
      if (data) {
        toast.success(`Category ${categoryModal.mode === 'add' ? 'added' : 'updated'}`);
        setCategoryModal({ open: false, mode: 'add' });
        setNewCategory({ name: '', icon: 'Package' });
        fetchCategories();
      }
    } catch (err) {
      console.error('Category submit error:', err);
    }
  };

  const handleRevertAction = async (logId: number) => {
    if (!confirm('Are you sure you want to revert this action? This will restore the previous state.')) return;
    try {
      const data = await fetchWithHandling<any>(`/api/admin/audit-logs/${logId}/revert`, { 
        method: 'POST',
        headers: getAuthHeaders()
      });
      if (data) {
        toast.success('Action reverted successfully');
        fetchAuditLogs();
        fetchStats();
      }
    } catch (err) {
      console.error('Revert action error:', err);
    }
  };

  const handleNotificationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = await fetchWithHandling<any>('/api/admin/notifications', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(newNotification)
      });
      if (data) {
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
      console.error('Notification submit error:', err);
    }
  };

  const handleDeleteNotification = async (id: number) => {
    if (!confirm('Are you sure you want to delete this announcement?')) return;
    try {
      const data = await fetchWithHandling<any>(`/api/admin/notifications/${id}`, { 
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      if (data) {
        toast.success('Announcement removed');
        fetchNotifications();
      }
    } catch (err) {
      console.error('Delete notification error:', err);
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
            <p>New Hind General Store | Shop No. 1, Main Market, Nayagaon, SAS Nagar, Punjab</p>
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
      const updateData = await fetchWithHandling<any>(`/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(data)
      });
      if (updateData) {
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

        await fetchWithHandling<any>(`/api/admin/users/${userId}/alert`, {
          method: 'POST',
          headers: getAuthHeaders(),
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
      console.error('Update user error:', err);
    }
  };

  const deleteProduct = async (id: number) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    try {
      const data = await fetchWithHandling<any>(`/api/admin/products/${id}`, { 
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      if (data) {
        toast.success('Product deleted');
        fetchAllProducts();
      }
    } catch (err) {
      console.error('Delete product error:', err);
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
        const data = await fetchWithHandling<any>('/api/admin/products/bulk', {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({ products })
        });
        if (data) {
          toast.success(`Successfully uploaded ${data.count} products`);
          fetchAllProducts();
        }
      } catch (err) {
        console.error('Bulk upload error:', err);
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
      const data = await fetchWithHandling<any>('/api/admin/products/bulk-update', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ ids: selectedProducts, action: 'list', value: !unlist })
      });
      if (data) {
        toast.success(`Successfully ${unlist ? 'unlisted' : 'listed'} ${selectedProducts.length} products`);
        setSelectedProducts([]);
        fetchAllProducts();
      }
    } catch (err) {
      console.error('Bulk unlist error:', err);
    }
  };

  const bulkUpdateStock = async () => {
    if (selectedProducts.length === 0) return;
    
    let newStock = bulkStockValue;
    if (!newStock) {
      newStock = prompt('Enter new stock value for selected products:');
    }
    
    if (newStock === null || newStock === '' || isNaN(Number(newStock))) {
      toast.error('Please enter a valid numeric stock value');
      return;
    }
    
    if (!confirm(`Are you sure you want to update stock to ${newStock} for ${selectedProducts.length} products?`)) {
      return;
    }
    
    try {
      const data = await fetchWithHandling<any>('/api/admin/products/bulk-update', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ ids: selectedProducts, action: 'stock', value: Number(newStock) })
      });
      if (data) {
        toast.success(`Updated stock for ${selectedProducts.length} products`);
        setSelectedProducts([]);
        setBulkStockValue('');
        fetchAllProducts();
      }
    } catch (err) {
      console.error('Bulk stock update error:', err);
    }
  };

  const bulkDelete = async () => {
    if (selectedProducts.length === 0) return;
    if (!confirm(`Are you sure you want to delete ${selectedProducts.length} products?`)) return;
    
    try {
      const data = await fetchWithHandling<any>('/api/admin/products/bulk-update', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ ids: selectedProducts, action: 'delete' })
      });
      if (data) {
        toast.success(`Deleted ${selectedProducts.length} products`);
        setSelectedProducts([]);
        fetchAllProducts();
      }
    } catch (err) {
      console.error('Bulk delete error:', err);
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
      const data = await fetchWithHandling<any>('/api/admin/products/bulk-update', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ ids: selectedProducts, action: 'category', value: newBatchCategory })
      });
      if (data) {
        toast.success(`Updated category for ${selectedProducts.length} products`);
        setSelectedProducts([]);
        setCategoryBatchModal({ open: false });
        setNewBatchCategory('');
        fetchAllProducts();
      }
    } catch (err) {
      console.error('Bulk category update error:', err);
    }
  };

  const fetchWalletHistory = async (userId: number) => {
    try {
      const data = await fetchWithHandling<any[]>(`/api/admin/users/${userId}/wallet-history`, { headers: getAuthHeaders() });
      if (data) {
        setWalletHistoryModal({ open: true, userId, history: data });
      }
    } catch (err) {
      console.error('Wallet history fetch error:', err);
    }
  };

  const deleteReview = async (id: number) => {
    if (!confirm('Delete this review?')) return;
    try {
      const data = await fetchWithHandling<any>(`/api/admin/reviews/${id}`, { 
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      if (data) {
        toast.success('Review deleted');
        const reviewsData = await fetchWithHandling<any[]>('/api/admin/reviews', { headers: getAuthHeaders() });
        if (reviewsData) setReviews(reviewsData);
      }
    } catch (err) {
      console.error('Delete review error:', err);
    }
  };

  const updateReviewStatus = async (id: number, status: string) => {
    try {
      const data = await fetchWithHandling<any>(`/api/admin/reviews/${id}/status`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ status })
      });
      if (data) {
        toast.success('Review status updated');
        const reviewsData = await fetchWithHandling<any[]>('/api/admin/reviews', { headers: getAuthHeaders() });
        if (reviewsData) setReviews(reviewsData);
      }
    } catch (err) {
      console.error('Update review status error:', err);
    }
  };

  const deleteCoupon = async (id: number) => {
    if (!confirm('Delete this coupon?')) return;
    try {
      const data = await fetchWithHandling<any>(`/api/admin/coupons/${id}`, { 
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      if (data) {
        toast.success('Coupon deleted');
        const couponsData = await fetchWithHandling<any[]>('/api/admin/coupons', { headers: getAuthHeaders() });
        if (couponsData) setCoupons(couponsData);
      }
    } catch (err) {
      console.error('Delete coupon error:', err);
    }
  };

  const toggleCouponStatus = async (id: number) => {
    try {
      const data = await fetchWithHandling<any>(`/api/admin/coupons/${id}/toggle`, { 
        method: 'POST',
        headers: getAuthHeaders()
      });
      if (data) {
        toast.success('Coupon status updated');
        const couponsData = await fetchWithHandling<any[]>('/api/admin/coupons', { headers: getAuthHeaders() });
        if (couponsData) setCoupons(couponsData);
      }
    } catch (err) {
      console.error('Toggle coupon status error:', err);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const uploadedUrls: string[] = [];
    const toastId = toast.loading(`Uploading ${files.length} image(s)...`);

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        let fileToUpload = file;
        try {
          // Compress image before upload
          const options = {
            maxSizeMB: 1,
            maxWidthOrHeight: 1200,
            useWebWorker: true,
            fileType: 'image/jpeg'
          };
          fileToUpload = await imageCompression(file, options);
        } catch (compressionErr) {
          console.error('Image compression failed:', compressionErr);
          // Fallback to original file
        }
        
        // Use Firebase Storage
        const storageRef = ref(storage, `products/${Date.now()}_${fileToUpload.name}`);
        const uploadTask = uploadBytesResumable(storageRef, fileToUpload);
        
        await new Promise<void>((resolve, reject) => {
          uploadTask.on('state_changed', 
            null, 
            (error) => reject(error), 
            async () => {
              const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
              uploadedUrls.push(downloadURL);
              resolve();
            }
          );
        });
      }

      const updatedImages = [...newProduct.images, ...uploadedUrls];
      setNewProduct({ ...newProduct, images: updatedImages });
      
      if (imageModal.open) {
        setImageModal({ ...imageModal, images: [...imageModal.images, ...uploadedUrls] });
      }
      
      if (!newProduct.image && uploadedUrls.length > 0) {
        setNewProduct(prev => ({ ...prev, image: uploadedUrls[0], images: [...prev.images, ...uploadedUrls] }));
      }
      
      toast.success('Images uploaded successfully', { id: toastId });
    } catch (err) {
      console.error('Image upload failed:', err);
      toast.error('Failed to upload image', { id: toastId });
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
    try {
      const data = await fetchWithHandling<any>(`/api/admin/expenses/${id}`, { 
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      if (data) {
        toast.success('Expense deleted');
        fetchExpenses();
      }
    } catch (err) {
      console.error('Delete expense error:', err);
    }
  };

  const handleAddCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = couponModal.mode === 'edit' ? `/api/admin/coupons/${couponModal.editingId}` : '/api/admin/coupons';
    const method = couponModal.mode === 'edit' ? 'PUT' : 'POST';
    
    try {
      const data = await fetchWithHandling<any>(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify(newCoupon)
      });
      if (data) {
        toast.success(couponModal.mode === 'edit' ? 'Coupon updated' : 'Coupon added');
        setCouponModal({ open: false, mode: 'add' });
        setNewCoupon({ code: '', type: 'flat', value: '', min_order: '', usage_limit: '', limit_per_user: '1', expiry_date: '' });
        const couponsData = await fetchWithHandling<any[]>('/api/admin/coupons', { headers: getAuthHeaders() });
        if (couponsData) setCoupons(couponsData);
      }
    } catch (err) {
      console.error('Save coupon error:', err);
    }
  };

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = await fetchWithHandling<any>('/api/admin/expenses', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(newExpense)
      });
      if (data) {
        toast.success('Expense added');
        setExpenseModal({ open: false });
        fetchExpenses();
      }
    } catch (err) {
      console.error('Save expense error:', err);
    }
  };

  const handleWalletUpdate = async () => {
    if (!walletModal.userId || !walletAmount) return;
    try {
      const data = await fetchWithHandling<any>(`/api/admin/users/${walletModal.userId}/wallet`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ 
          amount: walletAmount, 
          type: walletType, 
          description: `Admin manual ${walletType}` 
        })
      });
      if (data) {
        toast.success('Wallet updated');
        setWalletModal({ open: false, userId: null });
        setWalletAmount('');
        fetchUsers();
      }
    } catch (err) {
      console.error('Wallet update error:', err);
    }
  };

  const sidebarGroups = [
    {
      title: 'Dashboard',
      items: [
        { name: 'Overview' as Tab, icon: LayoutDashboard },
        { name: 'Analytics' as Tab, icon: BarChart3 },
        { name: 'Announcements' as Tab, icon: Megaphone },
      ]
    },
    {
      title: 'Inventory',
      items: [
        { name: 'Product Catalog' as Tab, icon: Package },
        { name: 'Categories' as Tab, icon: List },
        { name: 'Bulk Discounts' as Tab, icon: Tag },
        { name: 'Suppliers' as Tab, icon: Briefcase },
      ]
    },
    {
      title: 'Governance',
      items: [
        { name: 'Admin Management' as Tab, icon: Shield },
        { name: 'Roles' as Tab, icon: Fingerprint },
        { name: 'Data Exports' as Tab, icon: Download },
      ]
    },
    {
      title: 'Sales & Logistics',
      items: [
        { name: 'Orders' as Tab, icon: ShoppingBag },
        { name: 'Logistics' as Tab, icon: Truck },
        { name: 'Returns' as Tab, icon: Receipt },
        { name: 'Coupons' as Tab, icon: CreditCard },
        { name: 'Promotions' as Tab, icon: TrendingUp },
        { name: 'UPI Webhook Logs' as Tab, icon: Mail },
      ]
    },
    {
      title: 'Operations',
      items: [
        { name: 'Customers' as Tab, icon: Users },
        { name: 'Support Tickets' as Tab, icon: MessageSquare },
        { name: 'Expenses' as Tab, icon: Receipt },
        { name: 'Audit Logs' as Tab, icon: History },
      ]
    },
    {
      title: 'Settings & Status',
      items: [
        { name: 'Store Settings' as Tab, icon: Settings },
        { name: 'System Status' as Tab, icon: Activity },
        { name: 'System Logs' as Tab, icon: Bug },
        { name: 'Suspicious Activities' as Tab, icon: AlertTriangle },
        { name: 'Automatic Reports' as Tab, icon: List },
        { name: 'Feature Toggles' as Tab, icon: Layout },
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
    'Customers', 'Wallet Requests', 'Reviews', 'Coupons', 'Newsletter', 'Roles', 'Support Tickets', 
    'Purchase Orders', 'Order Batching', 'Expenses', 'Store Settings', 'Payment Settings', 'System Status', 'System Logs', 
    'Suspicious Activities', 'Promotions', 'Bulk Discounts', 'Feature Toggles', 'Suppliers', 'Returns', 'Audit Logs', 
    'Automatic Reports', 'Data Exports', 'Promotional Rules', 'UPI Webhook Logs'
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
                    <p className="text-stone-500 text-sm">Phone: {formatPhoneNumber(config.find(c => c.key === 'admin_phone')?.value || '7888422429')}</p>
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
                        <p className="text-stone-600 text-sm">Phone: {po.supplier.phone ? formatPhoneNumber(po.supplier.phone) : 'N/A'}</p>
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

  const SearchUI = (
    <div className="flex items-center space-x-4 md:space-x-8 w-full max-w-xl">
      <div className="relative group flex-1">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 transition-colors group-focus-within:text-primary" size={18} />
        <input 
          type="text" 
          placeholder="Search products, orders..."
          className="bg-stone-100/50 border-stone-200 border rounded-2xl pl-11 pr-5 py-2 md:py-2.5 text-sm focus:ring-4 focus:ring-primary/10 w-full transition-all focus:bg-white outline-none font-medium"
          value={globalSearchQuery}
          onChange={(e) => setGlobalSearchQuery(e.target.value)}
        />
        
        {globalSearchResults && (
          <div className="absolute top-full right-0 left-0 mt-2 bg-white rounded-2xl shadow-2xl border border-stone-100 overflow-hidden z-50">
            <div className="flex p-2 border-b border-stone-100 gap-1 overflow-x-auto no-scrollbar">
              {(['all', 'products', 'orders', 'users', 'suspicious'] as const).map(filter => (
                <button
                  key={filter}
                  onClick={() => setSearchFilter(filter)}
                  className={cn(
                    "px-3 py-1 text-[10px] uppercase font-bold rounded-full transition-colors whitespace-nowrap",
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
                          <p className="text-[10px] text-stone-400">{formatPhoneNumber(u.phone)}</p>
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
                  <p className="text-sm text-stone-400">No {searchFilter} results found for "{globalSearchQuery}"</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      
      <div className="flex items-center space-x-2 hidden md:flex">
        <button 
          onClick={() => setActiveTab('Announcements')}
          className="p-2 text-stone-400 hover:text-primary hover:bg-stone-50 rounded-lg transition-all relative"
          title="Notifications"
        >
          <Bell size={20} />
          {notifications.filter(n => !n.is_read).length > 0 && (
            <span className="absolute top-0 right-0 min-w-[16px] h-4 bg-red-500 text-white text-[8px] font-black flex items-center justify-center rounded-full border-2 border-white px-1">
              {notifications.filter(n => !n.is_read).length}
            </span>
          )}
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
  );

  return (
    <AdminDashboardLayout
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      user={user}
      logout={logout}
      adminTheme={adminTheme}
      sidebarOpen={sidebarOpen}
      setSidebarOpen={setSidebarOpen}
      getDisplayLabel={getDisplayLabel}
      stats={stats}
      extraHeader={SearchUI}
      loading={loading}
      healthStatus={healthStatus}
      syncStatus={syncStatus}
      pendingOrdersCount={orders.filter(o => o.status === 'pending').length}
    >
      <div className="space-y-4 md:space-y-8 pb-12">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            <TabContent />
          </motion.div>
        </AnimatePresence>
      </div>


      <FinanceModals
        walletModal={walletModal}
        setWalletModal={setWalletModal}
        walletType={walletType}
        setWalletType={setWalletType}
        walletAmount={walletAmount}
        setWalletAmount={setWalletAmount}
        handleWalletUpdate={handleWalletUpdate}
        expenseModal={expenseModal}
        setExpenseModal={setExpenseModal}
        newExpense={newExpense}
        setNewExpense={setNewExpense}
        handleAddExpense={handleAddExpense}
        walletHistoryModal={walletHistoryModal}
        setWalletHistoryModal={setWalletHistoryModal}
        roleModal={roleModal}
        setRoleModal={setRoleModal}
        newRole={newRole}
        setNewRole={setNewRole}
        setRoles={setRoles}
      />
      
      <MarketingModals
        bulkDiscountModal={bulkDiscountModal}
        setBulkDiscountModal={setBulkDiscountModal}
        newBulkDiscount={newBulkDiscount}
        setNewBulkDiscount={setNewBulkDiscount}
        handleBulkDiscountSubmit={handleBulkDiscountSubmit}
        allProducts={allProducts}
        categories={categories}
        
        couponModal={couponModal}
        setCouponModal={setCouponModal}
        newCoupon={newCoupon}
        setNewCoupon={setNewCoupon}
        handleAddCoupon={handleAddCoupon}
        
        promotionRuleFormModal={promotionRuleFormModal}
        setPromotionRuleFormModal={setPromotionRuleFormModal}
        newPromotionRuleData={newPromotionRuleData}
        setNewPromotionRuleData={setNewPromotionRuleData}
        handlePromotionRuleSubmit={handlePromotionRuleSubmit}
        
        promotionModal={promotionModal}
        setPromotionModal={setPromotionModal}
        newPromotion={newPromotion}
        setNewPromotion={setNewPromotion}
        handlePromotionSubmit={handlePromotionSubmit}
        
        promotionProductsModal={promotionProductsModal}
        setPromotionProductsModal={setPromotionProductsModal}
        linkedProductIds={linkedProductIds}
        setLinkedProductIds={setLinkedProductIds}
        
        notificationModal={notificationModal}
        setNotificationModal={setNotificationModal}
        newNotification={newNotification}
        setNewNotification={setNewNotification}
        handleNotificationSubmit={handleNotificationSubmit}
      />

      <InventoryModals
        productModal={productModal}
        setProductModal={setProductModal}
        editingProduct={editingProduct}
        newProduct={newProduct}
        setNewProduct={setNewProduct}
        newSpec={newSpec}
        setNewSpec={setNewSpec}
        categories={categories}
        suppliers={suppliers}
        isSubmittingProduct={isSubmittingProduct}
        handleProductSubmit={handleProductSubmit}
        stockEntryModal={stockEntryModal}
        setStockEntryModal={setStockEntryModal}
        purchaseForm={purchaseForm}
        setPurchaseForm={setPurchaseForm}
        handleStockEntrySubmit={handleStockEntrySubmit}
        imageModal={imageModal}
        setImageModal={setImageModal}
        categoryBatchModal={categoryBatchModal}
        setCategoryBatchModal={setCategoryBatchModal}
        newBatchCategory={newBatchCategory}
        setNewBatchCategory={setNewBatchCategory}
        selectedProducts={selectedProducts}
        setProducts={setAllProducts}
        categoryModal={categoryModal}
        setCategoryModal={setCategoryModal}
        newCategory={newCategory}
        setNewCategory={setNewCategory}
        handleCategorySubmit={handleCategorySubmit}
        supplierModal={supplierModal}
        setSupplierModal={setSupplierModal}
        newSupplier={newSupplier}
        setNewSupplier={setNewSupplier}
        handleSupplierSubmit={handleSupplierSubmit}
        variantModal={variantModal}
        setVariantModal={setVariantModal}
        productVariants={productVariants}
        setProductVariants={setProductVariants}
      />

      <CustomerSupportModals
        customerModal={customerModal}
        setCustomerModal={setCustomerModal}
        handleUserUpdate={handleUserUpdate}
        setWalletModal={setWalletModal}
        setExportProgress={setExportProgress}
        fetchCustomerOrders={fetchCustomerOrders}
        walletHistoryModal={walletHistoryModal}
        fetchWalletHistory={fetchWalletHistory}
        customerActivities={customerActivities}
        fetchUsers={fetchUsers}
        reviewResponseModal={reviewResponseModal}
        setReviewResponseModal={setReviewResponseModal}
        reviewResponse={reviewResponse}
        setReviewResponse={setReviewResponse}
        handleRespondReview={handleRespondReview}
        customerHistoryModal={customerHistoryModal}
        setCustomerHistoryModal={setCustomerHistoryModal}
        fetchOrderDetailsModal={fetchOrderDetailsModal}
      />

      <OrderModals
        orderModal={orderModal}
        setOrderModal={setOrderModal}
        orderHistory={orderHistory}
        config={config}
        handlePrintInvoice={handlePrintInvoice}
        handleApproveOrderPayment={handleApproveOrderPayment}
        updateOrderStatus={updateOrderStatus}
        fetchOrders={fetchOrders}
      />

      {/* Legacy Inventory & History Modals replaced */}

      {/* Legacy Customer, Review & Order Modals replaced */}
      {/* Customer History Modal */}
      <ModalContainer
        isOpen={customerHistoryModal.open}
        onClose={() => setCustomerHistoryModal({ ...customerHistoryModal, open: false })}
        title="Customer Order History"
        size="lg"
        showHeader={true}
      >
        <div className="p-8 pb-10">

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
                            <StickyNote size={12} className="text-amber-500" />
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
          </div>
        </ModalContainer>

      {/* Promotion Products Modal */}
      <ModalContainer
        isOpen={promotionProductsModal.open}
        onClose={() => setPromotionProductsModal({ ...promotionProductsModal, open: false })}
        title="Link Products to Promotion"
        size="lg"
        showHeader={true}
      >
        <div className="p-8 pb-10">

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
                              const data = await fetchWithHandling<any>(`/api/admin/promotions/${promotionProductsModal.promotionId}/products/${product.id}`, { 
                                method: 'DELETE',
                                headers: getAuthHeaders()
                              });
                              if (data) {
                                setLinkedProductIds(prev => prev.filter(id => id !== product.id));
                                toast.success('Product unlinked');
                              }
                            } else {
                              const data = await fetchWithHandling<any>(`/api/admin/promotions/${promotionProductsModal.promotionId}/products`, {
                                method: 'POST',
                                headers: getAuthHeaders(),
                                body: JSON.stringify({ product_id: product.id })
                              });
                              if (data) {
                                setLinkedProductIds(prev => [...prev, product.id]);
                                toast.success('Product linked');
                              }
                            }
                          } catch (err) {
                            console.error('Update promotion products error:', err);
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
          </div>
        </ModalContainer>

      {/* Variant Modal */}
      <ModalContainer
        isOpen={variantModal.open}
        onClose={() => setVariantModal({ open: false, mode: 'add' })}
        title="Manage Variants"
        size="xl"
        showHeader={true}
      >
        <div className="p-8 pb-10">
          <p className="text-sm text-stone-500 font-medium tracking-wide mb-8 select-none">Configure distinct pricing, stock, and multiple options for this product.</p>

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
                    const data = await fetchWithHandling<any>(`/api/admin/products/${variantModal.productId}/variants`, {
                      method: 'POST',
                      headers: getAuthHeaders(),
                      body: JSON.stringify({ variants: productVariants })
                    });
                    if (data) {
                      toast.success('Variants fully updated');
                      setVariantModal({ ...variantModal, open: false });
                    }
                  } catch (err) {
                    console.error('Update variants error:', err);
                  }
                }}
                className="flex-[2] py-4 bg-stone-900 text-white rounded-2xl font-bold hover:bg-stone-800 transition-colors shadow-xl shadow-stone-200"
              >
                Save All Variants
              </button>
            </div>
          </div>
        </ModalContainer>
      {/* Role Modal */}
      <ModalContainer
        isOpen={roleModal.open}
        onClose={() => setRoleModal({ ...roleModal, open: false })}
        title={roleModal.mode === 'add' ? 'Create New Role' : 'Edit Role'}
        size="md"
        showHeader={true}
      >
        <div className="p-8 pb-10">
          <p className="text-stone-500 text-sm mb-6">Define permissions for this administrative role.</p>

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
                    const data = await fetchWithHandling<any>(url, {
                      method,
                      headers: getAuthHeaders(),
                      body: JSON.stringify(newRole)
                    });
                    if (data) {
                      toast.success(`Role ${roleModal.mode === 'add' ? 'created' : 'updated'}`);
                      setRoleModal({ ...roleModal, open: false });
                      const rolesData = await fetchWithHandling<any[]>('/api/admin/roles', { headers: getAuthHeaders() });
                      if (rolesData) setRoles(rolesData);
                    }
                  } catch (err) {
                    console.error('Save role error:', err);
                  }
                }}
                className="flex-1 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all"
              >
                {roleModal.mode === 'add' ? 'Create Role' : 'Save Changes'}
              </button>
            </div>
          </div>
        </ModalContainer>
      <DashboardModals 
        exportModal={exportModal}
        setExportModal={setExportModal}
        exportFormat={exportFormat}
        setExportFormat={setExportFormat}
        handleGlobalExport={handleGlobalExport}
        exportProgress={exportProgress}
        ExportProgressModal={ExportProgressModal}
      />
    </AdminDashboardLayout>
  );
}

