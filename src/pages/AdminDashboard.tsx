// AdminDashboard.tsx - Main entry for admin panel
import { adminService } from '@/services/adminService';
import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';
import { withErrorReporting } from '@/lib/uiUtils';
import { handleAppError } from '@/lib/errorUtils';
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
import { getAuthHeaders } from '@/lib/utils';
import { fetchWithHandling } from '@/lib/api';
import { StatSkeleton, TableRowSkeleton, OrderSkeleton } from '@/components/ui/Skeleton';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import FeatureToggles from '@/components/admin/FeatureToggles';
import ProductImageManager from '@/components/admin/ProductImageManager';
import { OrderStatusBadge } from '@/components/admin/OrderStatusBadge';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import ErrorBoundary from '@/components/ErrorBoundary';
import AdminDashboardLayout from '@/components/admin/AdminDashboardLayout';
import { ExportProgressModal } from '@/components/admin/modals/ExportProgressModal';
import AdminStatCard from '@/components/admin/AdminStatCard';
import { generateSystemHealthReportPDF } from '@/services/pdfService';
import { EmptyState } from '@/components/EmptyState';
import { exportData, asyncExportData } from '@/services/exportService';
import { logErrorToFirestore } from '@/services/errorLogger';
import imageCompression from 'browser-image-compression';
import OverviewTabHeader from '@/components/admin/tabs/OverviewTabHeader';
import OverviewTab from '@/components/admin/tabs/OverviewTab';
import PurchaseOrdersTab from '@/components/admin/tabs/PurchaseOrdersTab';
import OrderBatchingTab from '@/components/admin/tabs/OrderBatchingTab';
import ModalContainer from '@/components/ui/ModalContainer';

// Fix for default marker icon
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

type Tab = 'Overview' | 'Analytics' | 'Announcements' | 'Orders' | 'Logistics' | 'Product Catalog' | 'Categories' | 'Customers' | 'Wallet Requests' | 'Reviews' | 'Coupons' | 'Roles' | 'Support Tickets' | 'Newsletter' | 'Expenses' | 'Store Settings' | 'Payment Settings' | 'System Status' | 'System Logs' | 'Suspicious Activities' | 'Promotions' | 'Bulk Discounts' | 'Feature Toggles' | 'Suppliers' | 'Returns' | 'Audit Logs' | 'Automatic Reports' | 'Admin Management' | 'Data Exports' | 'Security & Data' | 'Promotional Rules' | 'Purchase Orders' | 'Order Batching' | 'UPI Webhook Logs';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, adminTheme, setAdminTheme, simulatedRole, setSimulatedRole, logout, hasPermission } = useStore();
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<Tab>('Overview');

  React.useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tabParam = params.get('tab');
    if (tabParam) {
      const validTabs: Tab[] = [
        'Overview', 'Analytics', 'Announcements', 'Orders', 'Logistics', 
        'Product Catalog', 'Categories', 'Customers', 'Wallet Requests', 
        'Reviews', 'Coupons', 'Roles', 'Support Tickets', 'Newsletter', 
        'Expenses', 'Store Settings', 'Payment Settings', 'System Status', 
        'System Logs', 'Suspicious Activities', 'Promotions', 'Bulk Discounts', 
        'Feature Toggles', 'Suppliers', 'Returns', 'Audit Logs', 
        'Automatic Reports', 'Admin Management', 'Data Exports', 
        'Security & Data', 'Promotional Rules', 'Purchase Orders', 
        'Order Batching', 'UPI Webhook Logs'
      ];
      const foundMatch = validTabs.find(t => t.toLowerCase() === tabParam.toLowerCase());
      if (foundMatch) {
        setActiveTab(foundMatch);
      }
    }
  }, [location.search]);

  React.useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tabParam = params.get('tab');
    if (!tabParam || tabParam.toLowerCase() !== activeTab.toLowerCase()) {
      params.set('tab', activeTab);
      navigate({ search: params.toString() }, { replace: true });
    }
  }, [activeTab, navigate, location.search]);

  const maskPhoneNumber = (phone: string | null | undefined) => {
    if (!phone) return 'N/A';
    const clean = phone.trim();
    if (clean.length < 4) return '********';
    return clean.slice(0, 3) + '****' + clean.slice(-3);
  };
  const [exportProgress, setExportProgress] = useState<{ open: boolean; progress: number; label: string }>({ open: false, progress: 0, label: '' });
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

  const ExportActionModal = () => (
    <AnimatePresence>
      {exportModal.open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-stone-900/40 backdrop-blur-md p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-white max-w-lg w-full rounded-[3rem] shadow-2xl border-4 border-stone-100 overflow-hidden"
          >
            <div className="p-10 space-y-10">
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                   <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-stone-900 text-white rounded-xl flex items-center justify-center italic font-black">X</div>
                      <h3 className="text-3xl font-black text-stone-900 tracking-tight">Export Central</h3>
                   </div>
                   <p className="text-stone-400 font-bold uppercase text-[10px] tracking-[0.2em] ml-1">Archive & Intel Dispatch Protocol</p>
                </div>
                <button 
                  onClick={() => setExportModal({ ...exportModal, open: false })}
                  className="p-3 bg-stone-50 border border-stone-100 rounded-2xl text-stone-400 hover:text-stone-900 transition-all active:scale-95"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="text-xs font-black text-stone-400 uppercase tracking-widest block mb-4 border-l-2 border-stone-200 pl-4">Resource Target</label>
                  <div className="grid grid-cols-2 gap-4">
                    {['orders', 'products', 'users', 'audit', 'expenses', 'analytics'].map((t) => (
                      <button
                        key={t}
                        onClick={() => setExportModal({ ...exportModal, type: t as any })}
                        className={cn(
                          "px-6 py-5 rounded-2xl border-2 transition-all text-xs font-black uppercase tracking-widest text-left relative group",
                          exportModal.type === t ? "bg-stone-900 text-white border-stone-900 shadow-xl shadow-stone-200" : "bg-stone-50 border-stone-100 text-stone-400 hover:border-stone-200"
                        )}
                      >
                        {t}
                        {exportModal.type === t && <div className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full animate-pulse" />}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                   <label className="text-xs font-black text-stone-400 uppercase tracking-widest block mb-4 border-l-2 border-stone-200 pl-4">Manifest Cipher (Format)</label>
                   <div className="flex flex-wrap gap-4">
                      {['pdf', 'csv', 'xlsx', 'json'].map((f) => (
                        <button
                          key={f}
                          onClick={() => setExportFormat(f as any)}
                          className={cn(
                            "px-8 py-5 rounded-2xl border-2 transition-all text-xs font-black uppercase tracking-widest relative overflow-hidden",
                            exportFormat === f ? "bg-white border-primary text-primary shadow-lg shadow-primary/5" : "bg-stone-50 border-stone-100 text-stone-400 hover:border-stone-200"
                          )}
                        >
                          {f}
                        </button>
                      ))}
                   </div>
                </div>
              </div>

              <div className="pt-6 border-t border-stone-100 flex items-center justify-between gap-6">
                 <p className="text-[10px] text-stone-400 font-bold max-w-[200px] leading-relaxed italic">Warning: Confidential operational data will be serialized. Ensure secure transport.</p>
                 <button
                  onClick={() => handleGlobalExport(exportModal.type, exportFormat)}
                  className="flex-1 bg-stone-900 text-white px-10 py-5 rounded-2xl font-black uppercase tracking-widest shadow-2xl shadow-stone-900/20 hover:bg-black transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center space-x-3"
                 >
                   <Download size={18} />
                   <span>Initiate Dispatch</span>
                 </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

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
    const timer = setTimeout(() => setDebouncedGlobalSearchQuery(globalSearchQuery), 500);
    return () => clearTimeout(timer);
  }, [globalSearchQuery]);
  




  const DataExportsView = () => {
    const [exports, setExports] = useState<any[]>([]);
    const [isExporting, setIsExporting] = useState<string | null>(null);
    const [exportFormatSelection, setExportFormatSelection] = useState<string | null>(null);
    
    useEffect(() => {
        fetchWithHandling<any[]>('/api/admin/data-exports', { headers: getAuthHeaders() })
          .then(data => data && setExports(data));
    }, []);
    
    const approve = withErrorReporting(async (id: number) => {
        const data = await fetchWithHandling<any>(`/api/admin/data-exports/${id}/approve`, { 
            method: 'POST',
            headers: getAuthHeaders()
        });
        if (data) {
            setExports(exports.map(e => e.id === id ? {...e, status: 'APPROVED'} : e));
            toast.success('Approved');
        }
    }, 'Approve Export Request');

    const reject = withErrorReporting(async (id: number) => {
        const data = await fetchWithHandling<any>(`/api/admin/data-exports/${id}/reject`, { 
            method: 'POST',
            headers: getAuthHeaders()
        });
        if (data) {
            setExports(exports.map(e => e.id === id ? {...e, status: 'REJECTED'} : e));
            toast.success('Rejected');
        }
    }, 'Reject Export Request');

    const handleSystemExport = async (entity: string, format: 'csv' | 'pdf') => {
        if (format === 'pdf') {
            const { asyncExportData } = await import('../services/exportService');
            
            const columnsMap: any = {
                orders: [
                    { header: 'Order ID', dataKey: 'id' },
                    { header: 'Customer', dataKey: 'user_name' },
                    { header: 'Total Value', dataKey: 'total', halign: 'right' },
                    { header: 'Status', dataKey: 'status' },
                    { header: 'Placement Date', dataKey: 'created_at' }
                ],
                users: [
                    { header: 'Legal Identity', dataKey: 'name' },
                    { header: 'Phone Node', dataKey: 'phone' },
                    { header: 'Wallet Liquidity', dataKey: 'wallet_balance', halign: 'right' },
                    { header: 'Lifecycle Segment', dataKey: 'computed_segment' }
                ],
                products: [
                    { header: 'Item Name', dataKey: 'name' },
                    { header: 'Category', dataKey: 'category' },
                    { header: 'Units in Stock', dataKey: 'stock', halign: 'center' },
                    { header: 'Retail Point', dataKey: 'retail_price', halign: 'right' }
                ],
                wallet_transactions: [
                    { header: 'Reference', dataKey: 'id' },
                    { header: 'Type', dataKey: 'type' },
                    { header: 'Magnitude', dataKey: 'amount', halign: 'right' },
                    { header: 'Execution Node', dataKey: 'created_at' }
                ],
                system_logs: [
                    { header: 'Event', dataKey: 'message' },
                    { header: 'Level', dataKey: 'level' },
                    { header: 'Registry Node', dataKey: 'created_at' }
                ],
                audit_logs: [
                    { header: 'Administrative Action', dataKey: 'action' },
                    { header: 'Operator', dataKey: 'admin_name' },
                    { header: 'Directives', dataKey: 'details' },
                    { header: 'Execution Node', dataKey: 'created_at' }
                ]
            };

            await asyncExportData(
                () => fetchWithHandling<any[]>(`/api/admin/export-data/${entity}`, { headers: getAuthHeaders() }).then(d => d || []),
                columnsMap[entity] || [],
                'pdf',
                `${entity}_report`,
                (prog) => setExportProgress({ open: true, progress: prog, label: `Vaulting ${entity.toUpperCase()} data packet...` }),
                { title: `System ${entity.replace('_', ' ').toUpperCase()} Intelligence Report` }
            );
            return;
        }

        try {
            setIsExporting(`${entity}-${format}`);
            const response = await fetch(`/api/admin/export/${entity}?format=${format}`, {
               headers: getAuthHeaders()
            });

            if (!response.ok) throw new Error('Export failed');
            
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${entity}_export_${new Date().toISOString().split('T')[0]}.${format}`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            
            toast.success(`${entity.toUpperCase()} export (${format.toUpperCase()}) completed.`);
        } catch (err) {
            toast.error('Export failed');
            console.error(err);
        } finally {
            setIsExporting(null);
        }
    };

    return (
        <div className="space-y-8">
            <div className="bg-white rounded-[2.5rem] p-8 border border-stone-100 shadow-sm relative overflow-hidden">
                 <div className="absolute top-0 right-0 p-8 opacity-5">
                    <Database size={200} />
                 </div>
                 <h2 className="text-2xl font-black mb-2 flex items-center gap-2 relative z-10"><Download className="text-primary" /> System Data Exports</h2>
                 <p className="text-stone-500 mb-8 relative z-10">Scalable backend CSV generation for large datasets. Safe for 10,000+ records.</p>
                 
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 relative z-10">
                    {['orders', 'users', 'products', 'wallet_transactions', 'system_logs', 'audit_logs'].map((ent) => (
                        <div key={ent} className="flex flex-col gap-2">
                          <button 
                              onClick={() => setExportFormatSelection(ent)}
                              disabled={isExporting !== null}
                              className="p-6 border border-stone-200 rounded-2xl hover:border-primary hover:bg-stone-50 transition-all text-left group"
                          >
                               <div className="w-12 h-12 bg-stone-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-primary/10 transition-colors">
                                   {isExporting?.startsWith(ent) ? <RefreshCw className="animate-spin text-primary" /> : <Download className="group-hover:text-primary transition-colors text-stone-600" />}
                               </div>
                               <h3 className="font-bold text-lg text-stone-900 capitalize mb-1">{ent?.replace('_', ' ')}</h3>
                               <p className="text-xs text-stone-400">Export as...</p>
                          </button>
                          {exportFormatSelection === ent && (
                             <div className="flex gap-2">
                                <button onClick={() => {handleSystemExport(ent, 'csv'); setExportFormatSelection(null);}} className="flex-1 bg-stone-100 text-stone-700 py-2 rounded-xl text-xs font-bold hover:bg-stone-200">CSV</button>
                                <button onClick={() => {handleSystemExport(ent, 'pdf'); setExportFormatSelection(null);}} className="flex-1 bg-stone-100 text-stone-700 py-2 rounded-xl text-xs font-bold hover:bg-stone-200">PDF</button>
                             </div>
                          )}
                        </div>
                    ))}
                 </div>
            </div>

            <div className="bg-white rounded-[2.5rem] p-8 border border-stone-100 shadow-sm">
                <h2 className="text-2xl font-bold mb-6">User Export Requests</h2>
                <div className="responsive-table-container">
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
                        {(exports || []).map((e: any) => (
                            <tr key={e.id}>
                                <td className="py-4 text-sm font-bold">{e.user_name}</td>
                                <td className="py-4 text-xs text-center">{new Date(e.created_at).toLocaleString()}</td>
                                <td className="py-4 text-xs font-black text-center">{e.status}</td>
                                <td className="py-4 text-right">
                                    {e.status === 'PENDING_REVIEW' && (
                                        <div className="flex gap-2 justify-end">
                                            <button onClick={() => approve(e.id)} className="bg-emerald-600 text-white px-4 py-2 rounded-xl text-[10px] font-bold hover:bg-emerald-700 uppercase tracking-widest transition-colors">Approve</button>
                                            <button onClick={() => reject(e.id)} className="bg-red-500 text-white px-4 py-2 rounded-xl text-[10px] font-bold hover:bg-red-600 uppercase tracking-widest transition-colors">Reject</button>
                                        </div>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                </div>
            </div>
        </div>
    );
  };

  const UPIWebhookLogsView = () => {
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'failed' | 'all'>('failed');

    const fetchLogs = async () => {
      setLoading(true);
      try {
        const data = await fetchWithHandling<any[]>('/api/admin/emails-log', { headers: getAuthHeaders() });
        if (data) setLogs(data);
      } catch (err) {
        console.error('Failed to fetch UPI logs:', err);
      } finally {
        setLoading(false);
      }
    };

    useEffect(() => {
      fetchLogs();
    }, []);

    const filteredLogs = logs.filter(log => {
      if (filter === 'failed') {
        const status = String(log.match_status || '').toUpperCase();
        return status === 'FAILED' || status === 'REVIEW_REQUIRED';
      }
      return true;
    });

    return (
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-32">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-4xl font-black tracking-tighter text-stone-900 flex items-center gap-3">
              <div className="p-3 bg-indigo-100 rounded-3xl text-indigo-600"><Mail size={32} /></div>
              UPI WEBHOOKS & EMAIL PARSING LOGS
            </h2>
            <p className="text-stone-500 font-medium mt-1">Audit trail of bank payment alerts, matches, and failed automation lookups.</p>
          </div>
          <div className="flex gap-2">
            <button onClick={fetchLogs} className="bg-stone-100 text-stone-600 px-6 py-3 rounded-2xl text-xs font-bold uppercase tracking-widest hover:bg-stone-200 transition-all flex items-center gap-2">
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
            </button>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex bg-stone-100 p-1.5 rounded-2xl w-fit">
          <button 
            onClick={() => setFilter('failed')}
            className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${filter === 'failed' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500 hover:text-stone-800'}`}
          >
            Failed & Review Required UPI ({logs.filter(l => String(l.match_status).toUpperCase() !== 'MATCHED').length})
          </button>
          <button 
            onClick={() => setFilter('all')}
            className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${filter === 'all' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500 hover:text-stone-800'}`}
          >
            All Logs ({logs.length})
          </button>
        </div>

        {loading ? (
          <div className="p-12 text-center text-stone-400 font-bold">
            <Loader2 className="animate-spin mx-auto mb-4 text-stone-400" size={32} />
            Parsing dynamic stream databases...
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="bg-white p-16 rounded-[2.5rem] border border-stone-100 text-center space-y-4">
            <div className="w-16 h-16 bg-stone-50 rounded-full flex items-center justify-center mx-auto text-stone-300">
              <CheckCircle2 size={32} />
            </div>
            <h3 className="text-xl font-black text-stone-900 uppercase tracking-tighter">No Failed Webhooks Found</h3>
            <p className="text-stone-500 text-sm max-w-sm mx-auto">All recent bank UPI incoming alerts have been parsed and automated securely.</p>
          </div>
        ) : (
          <div className="bg-white rounded-[2.5rem] border border-stone-100 shadow-sm overflow-hidden divide-y divide-stone-100">
            {filteredLogs.map((log: any) => {
              const matchesOrder = log.matched_order_id || log.extracted_note || '';
              const matchStatus = String(log.match_status || '').toUpperCase();
              return (
                <div key={log.id} className="p-8 hover:bg-stone-50/40 transition-colors">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                        matchStatus === 'MATCHED' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                        matchStatus === 'REVIEW_REQUIRED' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                        'bg-red-50 text-red-600 border-red-100'
                      }`}>
                        {matchStatus}
                      </span>
                      <h4 className="font-extrabold text-stone-800 text-sm tracking-tight truncate max-w-sm md:max-w-md">
                        {log.subject || 'Bank Alert Email Received'}
                      </h4>
                    </div>
                    <span className="text-[10px] text-stone-400 font-bold tracking-wider bg-stone-100 px-3 py-1 rounded-lg">
                      {new Date(log.created_at || log.extracted_timestamp || Date.now()).toLocaleString()}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-xs text-stone-600 mt-2">
                    <div className="md:col-span-3 space-y-4">
                      {/* Match Reason callout card */}
                      <div className={`p-4 rounded-2xl border ${
                        matchStatus === 'MATCHED' ? 'bg-emerald-50/30 border-emerald-100/50 text-emerald-800' :
                        matchStatus === 'REVIEW_REQUIRED' ? 'bg-amber-50/30 border-amber-100/50 text-amber-800' :
                        'bg-red-50/30 border-red-100/50 text-red-800'
                      }`}>
                        <p className="text-[9px] font-black uppercase tracking-widest leading-none mb-1">Reason for Match Verdict</p>
                        <p className="font-bold text-xs">{log.match_reason || 'No match reason log found.'}</p>
                      </div>

                      {/* Email Snippet Display */}
                      <div className="bg-stone-50/50 border border-stone-100 p-4 rounded-xl">
                        <p className="text-[9px] text-stone-400 font-extrabold uppercase tracking-wider mb-2">Raw Alert Snippet Body</p>
                        <p className="font-mono text-[11px] leading-relaxed break-words whitespace-pre-wrap select-all text-stone-600">
                          {log.body || 'No message snippet provided.'}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4 bg-stone-50 p-4 rounded-2xl border border-stone-100">
                      <p className="text-[9px] font-black uppercase tracking-widest text-stone-400 mb-1">Parsed Extract</p>
                      
                      <div className="space-y-2.5">
                        <div>
                          <p className="text-[9px] font-black text-stone-400 uppercase">Alert Amount</p>
                          <p className="text-base font-black text-stone-800">
                            {log.extracted_amount ? `₹${Number(log.extracted_amount).toFixed(2)}` : 'NaN'}
                          </p>
                        </div>

                        <div>
                          <p className="text-[9px] font-black text-stone-400 uppercase">Target Order</p>
                          <p className="text-xs font-extrabold text-stone-700">
                            {matchesOrder ? `#${matchesOrder}` : 'No parsed Order ID'}
                          </p>
                        </div>

                        <div>
                          <p className="text-[9px] font-black text-stone-400 uppercase">Sender Address</p>
                          <p className="text-[10px] font-bold text-stone-500 break-all">
                            {log.sender || 'N/A'}
                          </p>
                        </div>

                        <div>
                          <p className="text-[9px] font-black text-stone-400 uppercase">Unique ID</p>
                          <p className="font-mono text-[10px] text-stone-400 truncate select-all" title={log.message_id || log.id}>
                            {log.message_id || log.id || 'N/A'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };  const SystemLogsView = () => {
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedLogForDetails, setSelectedLogForDetails] = useState<any | null>(null);
    const [sortField, setSortField] = useState<'created_at' | 'id' | 'level' | 'path'>('created_at');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
    const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
    const [filterLevel, setFilterLevel] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState<string>('');

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const data = await fetchWithHandling<any[]>('/api/admin/system-logs', { headers: getAuthHeaders() });
            if (data) {
                setLogs(data);
                setLastRefreshed(new Date());
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, []);

    const clearLogs = async () => {
        if (!confirm('Clear all system logs? This action is irreversible.')) return;
        try {
            const data = await fetchWithHandling<any>('/api/admin/system-logs', { 
                method: 'DELETE',
                headers: getAuthHeaders()
            });
            if (data) {
                setLogs([]);
                toast.success('Logs cleared successfully');
            }
        } catch (err) {
            toast.error('Failed to clear logs');
        }
    };

    const handleSort = (field: 'created_at' | 'id' | 'level' | 'path') => {
        if (sortField === field) {
            setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('desc');
        }
    };

    // Filter logs
    const filteredLogs = logs.filter(log => {
        const matchesSearch = !searchQuery || 
            (log.message && log.message.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (log.path && log.path.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (log.id && String(log.id).includes(searchQuery));
        
        const matchesLevel = filterLevel === 'all' || 
            (log.level && log.level.toLowerCase() === filterLevel.toLowerCase());
            
        return matchesSearch && matchesLevel;
    });

    // Sort logs
    const sortedLogs = [...filteredLogs].sort((a, b) => {
        let valA = a[sortField];
        let valB = b[sortField];
        
        if (sortField === 'created_at') {
            valA = new Date(valA || 0).getTime();
            valB = new Date(valB || 0).getTime();
        } else if (sortField === 'id') {
            valA = Number(valA || 0);
            valB = Number(valB || 0);
        } else {
            valA = String(valA || '').toLowerCase();
            valB = String(valB || '').toLowerCase();
        }
        
        if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
        if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
        return 0;
    });

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-32">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-4xl font-black tracking-tighter text-stone-900 flex items-center gap-3">
                        <div className="p-3 bg-red-100 rounded-3xl text-red-600"><Bug size={32} /></div>
                        SYSTEM HEALTH REGISTRY
                    </h2>
                    <p className="text-stone-500 font-medium mt-1">Real-time monitoring of environment errors and integrity audits.</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={fetchLogs} className="bg-stone-100 text-stone-600 px-6 py-3 rounded-2xl text-xs font-bold uppercase tracking-widest hover:bg-stone-200 transition-all flex items-center gap-2 cursor-pointer">
                        <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
                    </button>
                    <button onClick={clearLogs} className="bg-stone-950 text-white px-6 py-3 rounded-2xl text-xs font-bold uppercase tracking-widest hover:bg-stone-800 transition-all shadow-lg shadow-stone-200 cursor-pointer">
                         Purge All Logs
                    </button>
                </div>
            </div>

            {/* Search and Filters Bar */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between p-6 bg-stone-50/50 border border-stone-100 rounded-3xl">
                <div className="relative w-full md:w-96">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-stone-400">
                        <Search size={16} />
                    </span>
                    <input
                        type="text"
                        placeholder="Search logs by message, path or ID..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-11 pr-4 py-2.5 bg-white border border-stone-200 focus:border-indigo-500 rounded-2xl text-xs text-stone-800 transition-all outline-none animate-none"
                    />
                </div>
                
                <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] uppercase font-bold text-stone-400 tracking-wider">Severity:</span>
                        <select
                            value={filterLevel}
                            onChange={(e) => setFilterLevel(e.target.value)}
                            className="bg-white border border-stone-200 text-stone-700 font-bold text-xs rounded-xl px-3 py-2 outline-none focus:border-indigo-500"
                        >
                            <option value="all">⚡ All Severities</option>
                            <option value="error">❌ Errors</option>
                            <option value="info">ℹ️ Info</option>
                            <option value="warn">⚠️ Warnings</option>
                        </select>
                    </div>

                    {/* Dynamic Auto-indicator badge (Visual Refresh Indicator) */}
                    <div className="flex items-center gap-2 px-3.5 py-2 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-2xl text-[11px] font-bold">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        <span className="font-mono tracking-wide">{loading ? 'SYNCING...' : `SYNCED: ${lastRefreshed.toLocaleTimeString()}`}</span>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-[2.5rem] border border-stone-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto no-scrollbar">
                    <table className="w-full text-left">
                        <thead className="bg-stone-50/50 text-stone-400 text-[10px] uppercase font-black tracking-[0.2em] border-b border-stone-100">
                            <tr>
                                <th 
                                    onClick={() => handleSort('id')}
                                    className="px-6 py-5 cursor-pointer hover:bg-stone-100/50 transition-colors select-none"
                                >
                                    <div className="flex items-center gap-1">
                                        ID {sortField === 'id' ? (sortDirection === 'asc' ? '▲' : '▼') : '↕'}
                                    </div>
                                </th>
                                <th 
                                    onClick={() => handleSort('created_at')}
                                    className="px-6 py-5 cursor-pointer hover:bg-stone-100/50 transition-colors select-none"
                                >
                                    <div className="flex items-center gap-1">
                                        Timestamp {sortField === 'created_at' ? (sortDirection === 'asc' ? '▲' : '▼') : '↕'}
                                    </div>
                                </th>
                                <th 
                                    onClick={() => handleSort('level')}
                                    className="px-6 py-5 cursor-pointer hover:bg-stone-100/50 transition-colors select-none"
                                >
                                    <div className="flex items-center gap-1">
                                        Severity {sortField === 'level' ? (sortDirection === 'asc' ? '▲' : '▼') : '↕'}
                                    </div>
                                </th>
                                <th 
                                    onClick={() => handleSort('path')}
                                    className="px-6 py-5 cursor-pointer hover:bg-stone-100/50 transition-colors select-none"
                                >
                                    <div className="flex items-center gap-1">
                                        Pathway {sortField === 'path' ? (sortDirection === 'asc' ? '▲' : '▼') : '↕'}
                                    </div>
                                </th>
                                <th className="px-6 py-5 font-bold">Message Exception Buffer</th>
                                <th className="px-6 py-5 text-right">Intervention</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-100">
                            {sortedLogs.map((log: any, idx: number) => (
                                <motion.tr 
                                    key={log.id}
                                    initial={{ opacity: 0, y: 4 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: Math.min(idx * 0.02, 0.4) }}
                                    className="hover:bg-stone-50/40 transition-colors group text-xs text-stone-600"
                                >
                                    <td className="px-6 py-4 font-mono font-bold text-stone-400">#{log.id}</td>
                                    <td className="px-6 py-4 font-medium whitespace-nowrap">
                                        {new Date(log.created_at).toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-block text-[9px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full ${
                                            log.level === 'error' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'
                                        }`}>
                                            {log.level}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 font-mono text-[10px] max-w-[150px] truncate">
                                        {log.path || 'Core Kernel Action'}
                                    </td>
                                    <td className="px-6 py-4 max-w-sm truncate font-mono text-[11px] text-stone-800">
                                        {log.message}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button 
                                                onClick={() => setSelectedLogForDetails(log)}
                                                className="p-2.5 bg-stone-100 hover:bg-stone-200 text-stone-600 hover:text-stone-900 rounded-xl transition-all cursor-pointer"
                                                title="Beautify Details Payload"
                                            >
                                                <Eye size={13} />
                                            </button>
                                        </div>
                                    </td>
                                </motion.tr>
                            ))}
                            {sortedLogs.length === 0 && !loading && (
                                <tr>
                                    <td colSpan={6} className="py-24 text-center text-stone-400 font-bold italic bg-stone-50/50">
                                        <div className="flex flex-col items-center justify-center">
                                            <CheckCircle2 size={36} className="text-emerald-500 mb-3" />
                                            <p className="text-sm font-black uppercase tracking-tight text-stone-800">Empty Exception Buffer</p>
                                            <p className="text-xs text-stone-400 font-normal mt-1 leading-normal max-w-xs">No registries match your search criteria or the server environment is fully stable.</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                            {loading && sortedLogs.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="py-24 text-center">
                                        <div className="flex flex-col items-center justify-center">
                                            <div className="animate-spin text-primary mb-3"><RefreshCw size={24} /></div>
                                            <p className="text-[10px] font-black uppercase tracking-widest text-stone-400">Syncing with Registry...</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Micro-Telemetry JSON Modal Payload Viewer */}
            <AnimatePresence>
                {selectedLogForDetails && (
                    <div className="fixed inset-0 bg-stone-950/70 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white rounded-3xl border border-stone-200 shadow-2xl max-w-2xl w-full flex flex-col max-h-[85vh] overflow-hidden"
                        >
                            {/* Modal Header */}
                            <div className="p-6 border-b border-stone-100 flex justify-between items-center bg-stone-50">
                                <div>
                                    <h3 className="text-sm font-black text-stone-900 uppercase tracking-wider flex items-center gap-2">
                                        <Server size={16} className="text-red-500 animate-pulse" /> Log Payload Inspector #{selectedLogForDetails.id}
                                    </h3>
                                    <p className="text-[10px] text-stone-400 font-medium mt-0.5">Beautified audit trails and system telemetry metadata</p>
                                </div>
                                <button 
                                    onClick={() => setSelectedLogForDetails(null)}
                                    className="p-2 bg-stone-100 hover:bg-stone-200 rounded-full text-stone-500 transition-colors cursor-pointer"
                                >
                                    <X size={16} />
                                </button>
                            </div>

                            {/* Modal Body */}
                            <div className="p-6 overflow-y-auto space-y-5 no-scrollbar">
                                {/* Context Summary Card */}
                                <div className="grid grid-cols-2 gap-3 bg-stone-50 p-4 rounded-2xl border border-stone-100 text-xs text-stone-650">
                                    <div>
                                        <p className="text-[9px] text-stone-400 font-black uppercase">Endpoint Path</p>
                                        <p className="font-mono text-stone-855 break-all mt-0.5">{selectedLogForDetails.path || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-[9px] text-stone-400 font-black uppercase">Trigger Timestamp</p>
                                        <p className="text-stone-800 font-bold mt-0.5">{new Date(selectedLogForDetails.created_at).toLocaleString()}</p>
                                    </div>
                                    <div className="pt-2 border-t border-stone-150">
                                        <p className="text-[9px] text-stone-400 font-black uppercase">Severity Level</p>
                                        <span className={`inline-block text-[9px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full mt-1 ${
                                            selectedLogForDetails.level === 'error' ? 'bg-red-100 text-red-650' : 'bg-blue-100 text-blue-650'
                                        }`}>
                                            {selectedLogForDetails.level}
                                        </span>
                                    </div>
                                    <div className="pt-2 border-t border-stone-150">
                                        <p className="text-[9px] text-stone-400 font-black uppercase">Associated Profile ID</p>
                                        <p className="font-mono font-bold text-stone-880 mt-1">{selectedLogForDetails.user_id || 'Global System Event'}</p>
                                    </div>
                                </div>

                                {/* Message */}
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Logged Message</p>
                                    <div className="bg-stone-50 p-3.5 rounded-xl border border-stone-150 text-xs font-mono font-bold text-stone-800 whitespace-pre-wrap break-all">
                                        {selectedLogForDetails.message}
                                    </div>
                                </div>

                                {/* Raw/Beautified JSON Payload */}
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Telemetry Payload Details</p>
                                    <div className="bg-stone-950 p-4 rounded-2xl overflow-x-auto border border-stone-800">
                                        <pre className="text-emerald-400 font-mono text-[10px] leading-relaxed select-all">
                                            {(() => {
                                                let payload: any = selectedLogForDetails.details || selectedLogForDetails.metadata;
                                                if (typeof payload === 'string') {
                                                    try {
                                                        payload = JSON.parse(payload);
                                                    } catch (err) {
                                                        // It's a plain string
                                                    }
                                                }
                                                return typeof payload === 'object' && payload !== null
                                                    ? JSON.stringify(payload, null, 2)
                                                    : payload || 'No supplemental details provided for this event.';
                                            })()}
                                        </pre>
                                    </div>
                                </div>
                            </div>

                            {/* Modal Footer */}
                            <div className="p-4 bg-stone-50 border-t border-stone-100 flex justify-end">
                                <button 
                                    onClick={() => setSelectedLogForDetails(null)}
                                    className="px-5 py-2 bg-stone-900 hover:bg-stone-800 text-white font-extrabold text-[11px] uppercase tracking-widest rounded-xl transition-all cursor-pointer"
                                >
                                    Dismiss Inspector
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
  };

  const NewsletterView = () => {
    const [subs, setSubs] = useState<any[]>([]);
    const [subSearch, setSubSearch] = useState('');
    const [selectedEmails, setSelectedEmails] = useState<string[]>([]);
    const [newEmail, setNewEmail] = useState('');
    const [addLoading, setAddLoading] = useState(false);
    
    // Campaign composer states
    const [subject, setSubject] = useState('');
    const [campaignText, setCampaignText] = useState('');
    const [sending, setSending] = useState(false);
    const [dispatchMethod, setDispatchMethod] = useState<'email' | 'in-app' | 'system-notification'>('email');
    const [campaigns, setCampaigns] = useState<any[]>([]);
    const [syncing, setSyncing] = useState(false);

    const fetchSubs = async () => {
      try {
        const data = await fetchWithHandling<any[]>('/api/admin/newsletter', { headers: getAuthHeaders() });
        if (data) {
          setSubs(data);
          // Auto select all by default
          setSelectedEmails(data.map(s => s.email));
        }
      } catch (err) {
        console.error(err);
      }
    };

    const fetchCampaigns = async () => {
      try {
        const data = await fetchWithHandling<any[]>('/api/admin/newsletter/campaigns', { headers: getAuthHeaders() });
        if (data) {
          setCampaigns(data);
        }
      } catch (err) {
        console.error(err);
      }
    };

    useEffect(() => {
      fetchSubs();
      fetchCampaigns();
    }, []);

    const handleAddSubscriber = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!newEmail || !newEmail.includes('@')) {
        toast.error('Please enter a valid email address');
        return;
      }
      setAddLoading(true);
      try {
        const res = await fetchWithHandling<any>('/api/admin/newsletter/add', {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({ email: newEmail })
        });
        if (res && res.success) {
          toast.success('Subscriber added successfully!');
          setNewEmail('');
          fetchSubs();
        } else {
          toast.error(res?.message || 'Failed to add subscriber');
        }
      } catch (err: any) {
        toast.error(err?.message || 'Error occurred while adding subscriber');
      } finally {
        setAddLoading(false);
      }
    };

    const handleSyncUsers = async () => {
      setSyncing(true);
      try {
        const res = await fetchWithHandling<any>('/api/admin/newsletter/sync-users', {
          method: 'POST',
          headers: getAuthHeaders()
        });
        if (res && res.success) {
          toast.success(`Successfully imported ${res.count} registered users to newsletter!`);
          fetchSubs();
        } else {
          toast.error('Sync failed');
        }
      } catch (err: any) {
        toast.error(err?.message || 'Error occurred while syncing users');
      } finally {
        setSyncing(false);
      }
    };

    const handleDeleteSubscriber = async (id: string, email: string) => {
      if (!window.confirm(`Are you sure you want to remove ${email} from the subscription list?`)) return;
      try {
        const res = await fetchWithHandling<any>(`/api/admin/newsletter/${id}`, {
          method: 'DELETE',
          headers: getAuthHeaders()
        });
        if (res && res.success) {
          toast.success('Subscriber removed');
          setSubs(subs.filter(s => s.id !== id));
          setSelectedEmails(selectedEmails.filter(e => e !== email));
        }
      } catch (err) {
        toast.error('Failed to remove subscriber');
      }
    };

    const handleSendCampaign = async (e: React.FormEvent) => {
      e.preventDefault();
      if (selectedEmails.length === 0) {
        toast.error('Please select at least one subscriber recipient');
        return;
      }
      if (!subject || !campaignText) {
        toast.error('Campaign Subject and Message Body are required');
        return;
      }
      setSending(true);
      try {
        const res = await fetchWithHandling<any>('/api/admin/newsletter/send', {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({
            subject,
            message: campaignText,
            recipientCount: selectedEmails.length,
            channel: dispatchMethod
          })
        });
        if (res && res.success) {
          toast.success(`Campaign Dispatched Successfully via [${dispatchMethod.toUpperCase()}]!`);
          
          if (dispatchMethod === 'email') {
            // Open user's mail client as well for direct email copy delivery
            const emails = selectedEmails.join(',');
            const mailtoSubject = encodeURIComponent(subject);
            const mailtoBody = encodeURIComponent(campaignText);
            window.open(`mailto:${emails}?subject=${mailtoSubject}&body=${mailtoBody}`);
          }
          
          setSubject('');
          setCampaignText('');
          fetchCampaigns();
        } else {
          toast.error('Failed to dispatch campaign');
        }
      } catch (err: any) {
        toast.error(err?.message || 'Error occurred while sending campaign');
      } finally {
        setSending(false);
      }
    };

    const filteredSubs = subs.filter(s => 
      s.email.toLowerCase().includes(subSearch.toLowerCase()) ||
      (s.user_name && s.user_name.toLowerCase().includes(subSearch.toLowerCase()))
    );

    const isAllSelected = filteredSubs.length > 0 && filteredSubs.every(s => selectedEmails.includes(s.email));

    const toggleSelectAll = () => {
      if (isAllSelected) {
        // Deselect only filtered ones
        const filteredEmails = filteredSubs.map(s => s.email);
        setSelectedEmails(selectedEmails.filter(e => !filteredEmails.includes(e)));
      } else {
        // Select filtered ones
        const filteredEmails = filteredSubs.map(s => s.email);
        setSelectedEmails(Array.from(new Set([...selectedEmails, ...filteredEmails])));
      }
    };

    const toggleSelectEmail = (email: string) => {
      if (selectedEmails.includes(email)) {
        setSelectedEmails(selectedEmails.filter(e => e !== email));
      } else {
        setSelectedEmails([...selectedEmails, email]);
      }
    };

    return (
      <div className="space-y-8 animate-in fade-in duration-500">
         <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-stone-100 pb-8">
          <div>
            <h2 className="text-4xl font-black text-stone-900 tracking-tight">Newsletter & Campaigns</h2>
            <p className="text-stone-500 mt-2 text-lg font-medium">Add, manage, and dispatch beautiful campaign emails to your subscribers list.</p>
          </div>
          <div className="flex items-center gap-6 bg-white border border-stone-100 px-6 py-4 rounded-3xl shadow-sm">
             <div className="flex flex-col pr-6 border-r border-stone-100">
                <span className="text-[10px] font-black text-stone-400 uppercase tracking-wider mb-1">Total Subscribers</span>
                <span className="text-2xl font-black text-stone-900">{subs.length}</span>
             </div>
             <div className="flex flex-col">
                <span className="text-[10px] font-black text-stone-400 uppercase tracking-wider mb-1">Selected Recipients</span>
                <span className="text-2xl font-black text-stone-800">{selectedEmails.length}</span>
             </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* List Column */}
          <div className="lg:col-span-7 space-y-6">
            {/* Quick manual subscribers adder & user synchronizer */}
            <div className="bg-white rounded-[2.5rem] border border-stone-100 p-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex-1 space-y-4">
                <h3 className="text-lg font-black text-stone-900 uppercase tracking-tight">Add Subscriber Manually</h3>
                <form onSubmit={handleAddSubscriber} className="flex gap-4">
                  <div className="relative flex-1">
                    <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-stone-400" size={20} />
                    <input
                      type="email"
                      placeholder="Enter email address (e.g. user@example.com)"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      className="w-full bg-stone-50 border-stone-200 border-2 rounded-2xl pl-12 pr-6 py-4 text-stone-900 placeholder:text-stone-300 outline-none focus:border-stone-900 focus:bg-white transition-all text-sm font-semibold"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={addLoading}
                    className="bg-stone-900 hover:bg-stone-800 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50 pointer-events-auto cursor-pointer"
                  >
                    {addLoading ? 'Adding...' : 'Subscribe'}
                  </button>
                </form>
              </div>

              <div className="w-full md:w-px md:h-20 bg-stone-100" />

              <div className="flex flex-col space-y-3 justify-center">
                <h3 className="text-[10px] font-black text-stone-400 uppercase tracking-widest text-center md:text-left pl-1">Import Customers</h3>
                <button
                  type="button"
                  onClick={handleSyncUsers}
                  disabled={syncing}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer font-sans"
                >
                  <Users size={16} />
                  <span>{syncing ? 'Syncing...' : 'Sync Registered Users'}</span>
                </button>
                <span className="text-[9px] text-stone-400 font-medium text-center">Sync account email registers</span>
              </div>
            </div>

            {/* List Table container */}
            <div className="bg-white rounded-[2.5rem] border border-stone-100 p-8 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <h3 className="text-lg font-black text-stone-900 uppercase tracking-tight">Subscription Directory</h3>
                {/* Search bar */}
                <input
                  type="text"
                  placeholder="Search subscribers..."
                  value={subSearch}
                  onChange={(e) => setSubSearch(e.target.value)}
                  className="bg-stone-50 border border-stone-250 rounded-xl px-4 py-2 text-xs font-semibold outline-none focus:border-stone-450 focus:bg-white transition-all w-full sm:w-64"
                />
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-stone-50/50 text-stone-400 text-[10px] uppercase font-black tracking-[0.2em] border-b border-stone-100">
                    <tr>
                      <th className="px-4 py-5 w-12 text-center border-b border-stone-100">
                        <input
                          type="checkbox"
                          checked={isAllSelected}
                          onChange={toggleSelectAll}
                          className="w-4 h-4 rounded border-stone-300 text-stone-900 focus:ring-stone-900 focus:ring-2 cursor-pointer"
                        />
                      </th>
                      <th className="px-4 py-5 border-b border-stone-100">Subscriber</th>
                      <th className="px-4 py-5 border-b border-stone-100">User Status</th>
                      <th className="px-4 py-5 border-b border-stone-100">Subscribed On</th>
                      <th className="px-4 py-5 text-right border-b border-stone-100">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-50">
                    {filteredSubs.map((sub, idx) => (
                      <tr key={sub.id} className="hover:bg-stone-50/50 transition-colors group">
                        <td className="px-4 py-4 text-center">
                          <input
                            type="checkbox"
                            checked={selectedEmails.includes(sub.email)}
                            onChange={() => toggleSelectEmail(sub.email)}
                            className="w-4 h-4 rounded border-stone-300 text-stone-900 focus:ring-stone-900 focus:ring-2 cursor-pointer"
                          />
                        </td>
                        <td className="px-4 py-4 mr-2">
                          <div className="flex items-center space-x-3">
                            <div className="w-9 h-9 bg-stone-100 text-stone-500 rounded-xl flex items-center justify-center font-bold text-sm">
                              {sub.user_name?.[0] || sub.email[0].toUpperCase()}
                            </div>
                            <div className="flex flex-col min-w-0">
                              <span className="text-sm font-black text-stone-900 truncate max-w-[200px]" title={sub.email}>{sub.email}</span>
                              {sub.user_name && <span className="text-[10px] text-stone-400 font-bold">{sub.user_name}</span>}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          {sub.user_id ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-100 font-sans">
                              Registered User
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider bg-stone-100 text-stone-500 font-sans">
                              Guest Reader
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-4 text-xs font-semibold text-stone-400">
                          {sub.created_at ? new Date(sub.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'External'}
                        </td>
                        <td className="px-4 py-4 text-right">
                          <button
                            onClick={() => handleDeleteSubscriber(sub.id, sub.email)}
                            className="p-2 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all cursor-pointer font-sans"
                            title="Remove Subscriber"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {filteredSubs.length === 0 && (
                      <tr>
                        <td colSpan={5} className="text-center py-20 text-stone-400 italic font-semibold font-sans">
                          No newsletter subscribers matching search criteria.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Composer Column */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white rounded-[2.5rem] border border-stone-100 p-8 shadow-sm space-y-6">
              <div>
                <h3 className="text-xl font-black text-stone-900 uppercase tracking-tight">Campaign Composer</h3>
                <p className="text-xs text-stone-400 font-medium font-sans">Design and dispatch instant email updates safely to subscribers.</p>
              </div>

              {/* Dispatch Method selection */}
              <div className="space-y-3">
                <label className="text-[10px] font-black text-stone-400 uppercase tracking-wider">Choose Delivery Dispatch Channel</label>
                <div className="grid grid-cols-1 gap-2 font-sans text-xs">
                  {[
                    { id: 'email', name: 'Email Broadcast List', desc: 'Direct mail delivery with direct client email fallback.' },
                    { id: 'in-app', name: 'In-App General Banner Alert', desc: 'Creates a banner announcement across the customer page.' },
                    { id: 'system-notification', name: 'Live Database Cabinet Notification', desc: 'Saves campaign directly inside account notifications.' }
                  ].map((method) => (
                    <button
                      key={method.id}
                      type="button"
                      onClick={() => setDispatchMethod(method.id as any)}
                      className={cn(
                        "p-4 rounded-2xl border text-left transition-all flex items-start gap-4 cursor-pointer",
                        dispatchMethod === method.id 
                          ? "border-stone-950 bg-stone-50 shadow-sm" 
                          : "border-stone-100 hover:border-stone-200 bg-white"
                      )}
                    >
                      <input 
                        type="radio" 
                        readOnly 
                        checked={dispatchMethod === method.id} 
                        className="mt-0.5 pointer-events-none accent-stone-950 cursor-pointer" 
                      />
                      <div>
                        <p className="font-extrabold text-stone-900 uppercase tracking-wide text-[10px] mb-0.5">{method.name}</p>
                        <p className="text-[10px] text-stone-500 font-medium">{method.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Template quick-fills */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-stone-400 uppercase tracking-wider">Quick Fill Design Template</label>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSubject('🔥 Bulk Karyana Sale - Flat 15% OFF Everything!');
                      setCampaignText('Dear Customer,\n\nGeneral Store Karyana Shop is currently offering flat 15% off across all daily groceries, flours, grains, and kitchen spices!\n\nUse Coupon Code KARYANA15 on checkout or order directly via the HindStore app today.\n\nWarm regards,\nHindStore Management');
                    }}
                    className="px-3.5 py-1.5 bg-stone-50 border border-stone-200 text-stone-600 rounded-xl text-[10px] font-bold hover:border-stone-900 hover:bg-stone-900 hover:text-white transition-all text-left cursor-pointer"
                  >
                    Sale Announcement
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSubject('🌱 Fresh Arrivals: Premium Basmati Rice & Organic Turmeric');
                      setCampaignText('Hello Reader,\n\nWe have just refreshed our inventory with premium long-grain Basmati Rice and high-curcumin Organic Turmeric powder. Handpicked for premium quality and authentic taste.\n\nCheck out the Catalog in-app to explore pricing and options.\n\nStay healthy,\nHindStore Team');
                    }}
                    className="px-3.5 py-1.5 bg-stone-50 border border-stone-200 text-stone-600 rounded-xl text-[10px] font-bold hover:border-stone-900 hover:bg-stone-900 hover:text-white transition-all text-left cursor-pointer"
                  >
                    New Stock Alert
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSubject('📢 Store Hours and Delivery Schedule Update');
                      setCampaignText('Dear Subscribers,\n\nPlease note that General Store is updating its delivery hours. Active delivery sessions will now start from 8:00 AM up to 10:00 PM daily to better serve you.\n\nPlace your orders early for guaranteed same-day delivery!\n\nBest regards,\nHindStore Logistics');
                    }}
                    className="px-3.5 py-1.5 bg-stone-50 border border-stone-200 text-stone-600 rounded-xl text-[10px] font-bold hover:border-stone-900 hover:bg-stone-900 hover:text-white transition-all text-left cursor-pointer"
                  >
                    Schedule Update
                  </button>
                </div>
              </div>

              <form onSubmit={handleSendCampaign} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-stone-400 uppercase tracking-wider pl-1">Email Subject Line</label>
                  <input
                    type="text"
                    required
                    placeholder="Enter email subject header..."
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full bg-stone-50 border-stone-200 border-2 rounded-xl px-5 py-3.5 text-stone-900 placeholder:text-stone-300 outline-none focus:border-stone-900 focus:bg-white transition-all text-sm font-semibold"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-stone-400 uppercase tracking-wider pl-1 font-sans">Message Body</label>
                  <textarea
                    required
                    rows={8}
                    placeholder="Write detailed campaign description..."
                    value={campaignText}
                    onChange={(e) => setCampaignText(e.target.value)}
                    className="w-full bg-stone-50 border-stone-200 border-2 rounded-2xl px-5 py-4 text-stone-900 placeholder:text-stone-300 outline-none focus:border-stone-900 focus:bg-white transition-all text-sm font-medium h-52 resize-none leading-relaxed"
                  />
                </div>

                <div className="flex flex-col gap-4 bg-stone-50 p-5 rounded-2xl border border-stone-100 font-sans">
                  <div className="flex justify-between items-center text-xs font-bold text-stone-500">
                    <span>Target Recipients:</span>
                    <span className="text-stone-950 font-black">{selectedEmails.length} Readers</span>
                  </div>
                  <button
                    type="submit"
                    disabled={sending}
                    className="w-full bg-stone-900 hover:bg-stone-800 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all hover:shadow-lg active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                  >
                    {sending ? (
                      <>
                        <RefreshCw className="animate-spin" size={14} />
                        <span>Sending Packets...</span>
                      </>
                    ) : (
                      <>
                        <Send size={14} />
                        <span>Send Campaign Now</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* Campaign History Log */}
            <div className="bg-white rounded-[2.5rem] border border-stone-100 p-8 shadow-sm space-y-4">
              <div>
                <h3 className="text-xl font-black text-stone-900 uppercase tracking-tight">Campaign Dispatch Logs</h3>
                <p className="text-xs text-stone-400 font-medium font-sans">History of campaigns dispatched from this admin panel.</p>
              </div>

              <div className="space-y-3 font-sans h-80 overflow-y-auto no-scrollbar pr-1">
                {campaigns.map((c) => (
                  <div key={c.id} className="p-4 rounded-2xl border border-stone-100 bg-stone-50/50 space-y-2 text-xs">
                    <div className="flex justify-between items-start gap-4">
                      <p className="font-extrabold text-stone-900 line-clamp-1">{c.subject}</p>
                      <span className="bg-stone-200 text-stone-700 font-black uppercase text-[8px] tracking-wider px-2 py-0.5 rounded shrink-0">
                        {c.channel}
                      </span>
                    </div>
                    <p className="text-stone-500 line-clamp-2 text-[11px] leading-relaxed pr-2">{c.message}</p>
                    <div className="flex justify-between items-center text-[10px] text-stone-400 font-bold pt-1 border-t border-stone-100/50">
                      <span>Recipients: {c.recipient_count}</span>
                      <span>
                        {new Date(c.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                ))}
                {campaigns.length === 0 && (
                  <p className="text-stone-400 italic text-center text-xs py-8">No previous campaigns sent.</p>
                )}
              </div>
            </div>
          </div>
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
    expiry_date: '',
    unit: 'kg',
    is_subscribable: false
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
    // Sequentially load data to avoid hitting rate limits
    const initData = async () => {
      try {
        await Promise.all([
            // Add a small delay between requests if necessary, or use a throttled fetcher
            fetchStats(),
            // add other critical initial data fetches here
        ]);
      } catch (err) {
        console.error('Initial data load error:', err);
      }
    };
    
    initData();
    const pollStats = setInterval(fetchStats, 60000); // Poll every 60s
    return () => clearInterval(pollStats);
  }, []);

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => setLoading(false), 500); // 500ms delay to force wait then hide
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
      'Automatic Reports': 'Anomalies'
    };
    return mapping[tab] || tab;
  };

  const TabContent = () => {
    switch (activeTab) {
      case 'Overview': return <OverviewTab stats={stats} setActiveTab={setActiveTab} refreshStats={fetchStats} />;
      case 'Purchase Orders': return <PurchaseOrdersTab />;
      case 'Order Batching': return <OrderBatchingTab />;
      default: return <div className="p-8 text-stone-500">Feature not yet fully redesigned.</div>;
    }
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
    setLoading(true);
    try {
      const data = await adminService.getStats();
      if (data) setStats(data);
    } catch (err: any) {
      console.error('Stats fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchExpiringProducts = async () => {
    try {
      const data = await fetchWithHandling<any[]>('/api/admin/inventory/expiring', { headers: getAuthHeaders() });
      if (data) {
        setExpiringSoon(data);
      }
    } catch (err) {
      console.error('Failed to fetch expiring products:', err);
    }
  };

  const fetchOrders = () => {
    // Proactive HTTP load to protect against direct Firestore subscription permission failure
    fetchWithHandling<any[]>('/api/admin/orders', { headers: getAuthHeaders() })
      .then(data => {
        if (data) setOrders(data);
      })
      .catch(err => {
        console.warn('REST Orders fetch warning:', err);
      });

    let q = query(collection(db, 'orders'), orderBy('created_at', 'desc'));
    return onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setOrders(data);
    }, (err) => {
      console.warn('Firestore Orders subscription fell back safely to REST API due to:', err.message);
      fetchWithHandling<any[]>('/api/admin/orders', { headers: getAuthHeaders() })
        .then(data => {
          if (data) setOrders(data);
        })
        .catch(fetchErr => {
          console.error('REST backup orders fetch failed:', fetchErr);
        });
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
    // Proactive HTTP load
    fetchWithHandling<any[]>('/api/products')
      .then(data => {
        if (data) {
          setAllProducts(data);
          setLowStockProducts(data.filter((p: any) => p.stock <= (p.reorder_point || 5)));
        }
      })
      .catch(err => {
        console.warn('REST Products fetch warning:', err);
      });

    const q = query(collection(db, 'products'));
    return onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAllProducts(data);
      setLowStockProducts(data.filter((p: any) => p.stock <= (p.reorder_point || 5)));
    }, (err) => {
      console.warn('Firestore Products subscription fell back safely to REST API due to:', err.message);
      fetchWithHandling<any[]>('/api/products')
        .then(data => {
          if (data) {
            setAllProducts(data);
            setLowStockProducts(data.filter((p: any) => p.stock <= (p.reorder_point || 5)));
          }
        })
        .catch(fetchErr => {
          console.error('REST backup products fetch failed:', fetchErr);
        });
    });
  };

  useEffect(() => {
    let unsubscribeOrders: () => void;
    let unsubscribeProducts: () => void;
    
    if (user?.role === 'admin') {
      if (activeTab === 'Overview' || activeTab === 'Product Catalog') {
        unsubscribeProducts = fetchProducts();
      }
      if (activeTab === 'Overview' || activeTab === 'Orders') {
        unsubscribeOrders = fetchOrders();
      }
    }
    return () => {
      if (unsubscribeOrders) unsubscribeOrders();
      if (unsubscribeProducts) unsubscribeProducts();
    };
  }, [activeTab, user]);

  const [newBatchCategory, setNewBatchCategory] = useState('');
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
    try {
      const data = await fetchWithHandling<any[]>('/api/admin/expenses', { headers: getAuthHeaders() });
      if (data) {
        setExpenses(data);
      }
    } catch (err) {
      console.error('Failed to fetch expenses:', err);
    }
  };

  useEffect(() => {
    if (activeTab === 'Expenses') fetchExpenses();
    if (activeTab === 'Support Tickets') fetchTickets();
    if (activeTab === 'Suspicious Activities') fetchSuspiciousActivities();
  }, [activeTab]);
  const [reviewResponse, setReviewResponse] = useState('');
  const [promotions, setPromotions] = useState<any[]>([]);

  const [promotionModal, setPromotionModal] = useState({ open: false, mode: 'add' as 'add' | 'edit', id: null as number | null });
  const [promotionProductsModal, setPromotionProductsModal] = useState({ open: false, promotionId: null as number | null });
  const [linkedProductIds, setLinkedProductIds] = useState<number[]>([]);
  const [newPromotion, setNewPromotion] = useState({ title: '', description: '', image_url: '', link: '', active: true, target_role: 'all', start_time: '', end_time: '', banner_type: 'standard', is_default: false });
  const [deliveryFee, setDeliveryFee] = useState('0');
  const [freeDeliveryThreshold, setFreeDeliveryThreshold] = useState('500');
  const [deliveryAreas, setDeliveryAreas] = useState<any[]>([]);
  const [deliveryAreaModal, setDeliveryAreaModal] = useState({ open: false, mode: 'add' as 'add' | 'edit', area: null as any });
  const [newDeliveryArea, setNewDeliveryArea] = useState({ name: '', fee: '0', min_order: '0' });

  const [productVariants, setProductVariants] = useState<any[]>([]);
  const [variantModal, setVariantModal] = useState({ open: false, mode: 'add' as 'add' | 'edit', variant: null as any, productId: null as number | null });
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
      console.error('Failed to fetch individual customer activities:', err);
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
      console.error('Purchase submit error:', err);
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
  const [runnerModal, setRunnerModal] = useState({ open: false, mode: 'add' as 'add' | 'edit', runner: null as any });
  const [newRunner, setNewRunner] = useState({ name: '', phone: '' });

  const fetchAdmins = async () => {
    setIsAdminRefreshing(true);
    try {
      const data = await fetchWithHandling<any[]>('/api/admin/admins', { headers: getAuthHeaders() });
      if (data) setAdmins(data);
    } catch (err) {}
    finally { setIsAdminRefreshing(false); }
  };

  const fetchDeletionRequests = async () => {
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
      console.error('Failed to fetch runners:', err);
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
      console.error('Failed to fetch audit logs:', err);
    } finally {
      setIsFetchingAudit(false);
    }
  };

  const fetchSuspiciousActivities = async () => {
    try {
      const data = await fetchWithHandling<any[]>('/api/admin/suspicious-activities', { headers: getAuthHeaders() });
      if (data) {
        setSuspiciousActivities(data);
      }
    } catch (err) {
      console.error('Failed to fetch suspicious activities:', err);
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
      console.error('Failed to resolve activity:', err);
    }
  };

  const handleAssignRunner = async (orderId: number, runnerId: number) => {
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
      console.error('Assign runner error:', err);
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
      console.error('Save runner error:', err);
    }
  };

  const fetchWalletRequests = async () => {
    try {
      const data = await fetchWithHandling<any[]>('/api/admin/wallet/requests', { headers: getAuthHeaders() });
      if (data) {
        setWalletRequests(data);
      }
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
      const data = await fetchWithHandling<any>(`/api/admin/wallet/requests/${id}/approve`, { 
        method: 'POST',
        headers: getAuthHeaders()
      });
      if (data) {
        toast.success('Wallet request approved');
        fetchWalletRequests();
      }
    } catch (err) {
      console.error('Approve wallet request error:', err);
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
      console.error('Reject wallet request error:', err);
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
      console.error('Approve return error:', err);
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
      console.error('Reject return error:', err);
    }
  };

  const fetchSuppliers = async () => {
    try {
      const data = await fetchWithHandling<any[]>('/api/admin/suppliers', { headers: getAuthHeaders() });
      if (data) {
        setSuppliers(data);
      }
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
      console.error('Save supplier error:', err);
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
      console.error('Delete supplier error:', err);
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
      console.error('Bulk discount submit error:', err);
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
      console.error('Toggle bulk discount error:', err);
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
      console.error('Delete bulk discount error:', err);
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
        console.error('Global search error:', err);
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
    try {
      const data = await fetchWithHandling<any[]>('/api/admin/config', { headers: getAuthHeaders() });
      if (data) {
        setConfig(data);
      }
    } catch (err) {
      console.error('Failed to fetch config:', err);
    }
  };



  const fetchUsers = () => {
    // Proactive HTTP load to protect against direct Firestore subscription permission failure
    fetchWithHandling<any[]>('/api/admin/users', { headers: getAuthHeaders() })
      .then(data => {
        if (data) setUsers(data);
      })
      .catch(err => {
        console.warn('REST Users fetch warning:', err);
      });

    const q = query(collection(db, 'users'), orderBy('created_at', 'desc'));
    return onSnapshot(q, (snapshot) => {
      const usersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUsers(usersData);
    }, (err) => {
      console.warn('Firestore Users subscription fell back safely to REST API due to:', err.message);
      fetchWithHandling<any[]>('/api/admin/users', { headers: getAuthHeaders() })
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
      const data = await fetchWithHandling<any[]>('/api/categories', { headers: getAuthHeaders() });
      if (data) {
        setCategories(data);
      }
    } catch (err) {
      console.error('Categories fetch error:', err);
    }
  };

  const fetchTickets = async () => {
    try {
      const data = await fetchWithHandling<any[]>('/api/admin/support/tickets', { headers: getAuthHeaders() });
      if (data) {
        setTickets(data);
      }
    } catch (err) {
      console.error('Tickets fetch error:', err);
    }
  };

  const fetchNewsletter = async () => {
    try {
      const data = await fetchWithHandling<any[]>('/api/admin/newsletter', { headers: getAuthHeaders() });
      if (data) {
        setNewsletter(data);
      }
    } catch (err) {
      console.error('Newsletter fetch error:', err);
    }
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
    try {
      const data = await fetchWithHandling<any[]>('/api/notifications', { headers: getAuthHeaders() });
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
    setLoading(true);
    try {
      const data = await fetchWithHandling<any[]>('/api/admin/promotional-rules', {
        headers: getAuthHeaders()
      });
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
    setLoading(true);
    try {
      const data = await fetchWithHandling<any[]>('/api/admin/bulk-discounts', { headers: getAuthHeaders() });
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
        const [statsData, ordersData, configData, usersData, productsData, categoriesData, expiringData, notifData] = await Promise.all([
          fetchWithHandling<any>('/api/admin/stats', { headers: getAuthHeaders() }),
          fetchWithHandling<any[]>('/api/admin/orders', { headers: getAuthHeaders() }),
          fetchWithHandling<any[]>('/api/admin/config', { headers: getAuthHeaders() }),
          fetchWithHandling<any[]>('/api/admin/users', { headers: getAuthHeaders() }),
          fetchWithHandling<any[]>('/api/products', { headers: getAuthHeaders() }),
          fetchWithHandling<any[]>('/api/categories', { headers: getAuthHeaders() }),
          fetchWithHandling<any[]>('/api/admin/inventory/expiring', { headers: getAuthHeaders() }),
          fetchWithHandling<any[]>('/api/notifications', { headers: getAuthHeaders() })
        ]);

        if (statsData) setStats(statsData);
        if (ordersData) setOrders(ordersData);
        if (configData) setConfig(configData);
        if (usersData) setUsers(usersData);
        if (productsData) {
          setAllProducts(productsData);
          setLowStockProducts(productsData.filter((p: any) => p.stock <= (p.reorder_point || 5)));
        }
        if (categoriesData) setCategories(categoriesData);
        if (expiringData) setExpiringSoon(expiringData);
        if (notifData) setNotifications(notifData);

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
        setPurchaseForm({ supplier_id: '', quantity: '', cost_price: '', invoice_number: '', batch_number: '', expiry_date: '' });
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
    const newStock = prompt('Enter new stock value for selected products:');
    if (newStock === null || isNaN(Number(newStock))) return;
    
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
    'Customers', 'Wallet Requests', 'Reviews', 'Coupons', 'Roles', 'Support Tickets', 'Newsletter', 
    'Expenses', 'Store Settings', 'Payment Settings', 'System Status', 'Suspicious Activities', 'Promotions', 
    'Bulk Discounts', 'Feature Toggles', 'Suppliers', 'Returns', 'Audit Logs', 'Automatic Reports', 'Data Exports', 'Promotional Rules', 'UPI Webhook Logs'
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

            {/* Global Export Engine */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
               <div className="lg:col-span-1 bg-stone-900 rounded-[2.5rem] p-8 text-white flex flex-col justify-between">
                  <div>
                    <h3 className="text-2xl font-black tracking-tight">Intelligence Reporting</h3>
                    <p className="text-stone-400 text-sm mt-1">Enterprise-grade data extraction & audit protocols.</p>
                  </div>
                  <div className="mt-8 space-y-4">
                    <div className="flex items-center space-x-3 text-emerald-400 text-[10px] font-black uppercase tracking-widest bg-emerald-400/10 p-3 rounded-2xl">
                      <Activity size={14} className="animate-pulse" />
                      <span>Extraction Engine Online</span>
                    </div>
                  </div>
               </div>
               <div className="lg:col-span-2 bg-white rounded-[2.5rem] p-8 border border-stone-100 flex items-center justify-center">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full">
                    <ExportTriggerButton type="users" />
                    <ExportTriggerButton type="orders" />
                    <ExportTriggerButton type="products" />
                  </div>
               </div>
            </div>

            {/* Core Operational metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {loading ? (
                [...Array(4)].map((_, i) => <StatSkeleton key={i} />)
              ) : [
                { label: 'Total Revenue', value: `₹${stats?.netRevenue || 0}`, icon: <IndianRupee size={22} />, trend: { value: '+12%', isUp: true }, color: 'emerald' as const, key: 'revenue', progress: 85 },
                { label: 'Pending Orders', value: stats?.pendingOrders || 0, icon: <ShoppingBag size={22} />, trend: { value: 'Critical', isUp: false }, color: 'amber' as const, key: 'orders', progress: 40 },
                { label: 'Online Customers', value: stats?.activeUsers || 0, icon: <Activity size={22} />, trend: { value: 'Live', isUp: true, color: 'text-blue-500' }, color: 'blue' as const, progress: 65 },
                { label: 'New Customers', value: stats?.newUserCount || 0, icon: <Users size={22} />, trend: { value: '+24', isUp: true }, color: 'purple' as const, progress: 30 }
              ].map((stat, i) => {
                const { key, ...rest } = stat;
                return (
                  <AdminStatCard
                    key={key || stat.label}
                    {...(rest as any)}
                    onClick={() => {
                      if (key === 'revenue') setActiveTab('Analytics');
                      if (key === 'orders') setActiveTab('Orders');
                    }}
                  />
                );
              })}
            </div>

            <section className="bg-stone-50 p-10 rounded-[3rem] border border-dashed border-stone-200">
               <div className="flex items-center space-x-4 mb-8">
                  <div className="p-3 bg-stone-900 text-white rounded-2xl shadow-xl shadow-stone-900/10">
                    <Zap size={24} />
                  </div>
                  <div>
                     <h3 className="text-2xl font-black text-stone-900 tracking-tight">Rapid Directives</h3>
                     <p className="text-stone-500 font-medium">Bypass menus and execute primary operational shortcuts.</p>
                  </div>
               </div>

               <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
                  {[
                    { label: 'New Product', action: () => { setActiveTab('Product Catalog'); setShowAddProduct(true); }, icon: PackagePlus, color: 'text-stone-900' },
                    { label: 'New Broadcast', action: () => { setActiveTab('Announcements'); setNotificationModal({ open: true }); }, icon: Megaphone, color: 'text-emerald-500' },
                    { label: 'Security Audit', action: () => setActiveTab('Audit Logs'), icon: ShieldCheck, color: 'text-blue-500' },
                    { label: 'Admin Ops', action: () => setActiveTab('Admin Management'), icon: Shield, color: 'text-red-500' },
                    { label: 'Status Feed', action: () => setActiveTab('System Status'), icon: Activity, color: 'text-amber-500' },
                    { label: 'Wallet Flows', action: () => setActiveTab('Wallet Requests'), icon: Wallet, color: 'text-purple-500' }
                  ].map((btn, i) => (
                    <motion.button 
                      key={i}
                      whileHover={{ scale: 1.05, y: -4 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={btn.action}
                      className="bg-white p-6 rounded-[2rem] border border-stone-100 shadow-sm flex flex-col items-center justify-center space-y-4 hover:shadow-xl hover:shadow-stone-200 transition-all group"
                    >
                       <div className={cn("p-4 rounded-2xl bg-stone-50 group-hover:bg-stone-900 group-hover:text-white transition-all", btn.color)}>
                         <btn.icon size={22} />
                       </div>
                       <span className="text-[10px] font-black uppercase text-stone-400 tracking-widest group-hover:text-stone-900 transition-colors">{btn.label}</span>
                    </motion.button>
                  ))}
               </div>
            </section>

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
                <div className="h-72 w-full min-h-72">
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
                        dataKey="date" 
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
                        <span className="text-xs font-black text-white/40 uppercase tracking-widest">{sys.label}</span>
                        <span className="text-xs font-bold text-white mt-0.5">{sys.status}</span>
                      </div>
                      <span className="text-xs font-black font-mono text-emerald-500">{sys.delay}ms</span>
                    </div>
                  ))}
                </div>

                <div className="pt-6 border-t border-white/10 space-y-4 relative z-10">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-white/40 uppercase tracking-widest">Network Alert Feed</span>
                    <button onClick={() => setActiveTab('System Status')} className="text-xs font-black text-emerald-500 hover:underline">Full Trace</button>
                  </div>
                  <div className="space-y-3">
                    {stats?.recentActivities?.slice(0, 2).map((log: any) => (
                      <div key={log.id} className="flex items-start space-x-3">
                        <div className={cn("w-1.5 h-1.5 rounded-full mt-1.5 shrink-0", log.level === 'error' ? "bg-red-500" : "bg-white/20")} />
                        <p className="text-xs font-medium text-white/70 line-clamp-2 leading-relaxed">{log.message}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <button 
                  onClick={() => setActiveTab('Audit Logs')}
                  className="w-full relative z-10 py-4 bg-emerald-500 text-stone-900 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-emerald-400 transition-all active:scale-95 shadow-xl shadow-emerald-500/20"
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
                          <p className="text-sm font-black tracking-tight select-text">#ORD-{order.id}</p>
                          <p className="text-xs font-bold text-stone-400 group-hover:text-white/50 select-text">{order.user_name}</p>
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
                   onClick={() => { setActiveTab('Orders'); fetchOrders(); }}
                   className="mt-8 py-4 border-2 border-stone-100 rounded-2xl text-xs font-black uppercase tracking-widest text-stone-400 hover:text-stone-900 hover:border-stone-900 transition-all w-full"
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
              <div className="flex flex-col sm:flex-row gap-4 relative z-10 w-full lg:w-auto">
                {notifications.filter(n => !n.is_read).length > 0 && (
                  <button 
                    onClick={async () => {
                      try {
                        await fetchWithHandling('/api/admin/notifications/mark-read', { method: 'POST', headers: getAuthHeaders() });
                        fetchNotifications();
                        toast.success('All alerts acknowledged');
                      } catch (err) {}
                    }}
                    className="flex items-center justify-center space-x-3 bg-stone-100 text-stone-600 px-8 py-5 rounded-[2rem] text-sm font-black uppercase tracking-widest hover:bg-stone-200 transition-all active:scale-95 border border-stone-200"
                  >
                    <CheckCheck size={20} />
                    <span>Acknowledge All</span>
                  </button>
                )}
                <button 
                  onClick={() => setNotificationModal({ open: true })}
                  className="w-full lg:w-auto flex items-center justify-center space-x-3 bg-stone-900 text-white px-10 py-5 rounded-[2rem] text-sm font-black uppercase tracking-widest hover:bg-stone-800 transition-all shadow-2xl shadow-stone-900/30 hover:scale-105 active:scale-95"
                >
                  <Plus size={20} />
                  <span>New Announcement</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-8">
              {notifications.map((n: any) => (
                <motion.div 
                  layout
                  key={n.id} 
                  className={cn(
                    "bg-white p-8 rounded-[2.5rem] shadow-xl shadow-stone-200/20 border border-stone-100 group hover:border-primary/30 transition-all relative overflow-hidden",
                    n.is_read && "opacity-60 grayscale-[0.5]"
                  )}
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
                        n.type === 'system' ? 'bg-indigo-50 text-indigo-500' :
                        n.priority === 'high' ? 'bg-red-50 text-red-500' :
                        n.priority === 'medium' ? 'bg-amber-50 text-amber-500' : 'bg-blue-50 text-blue-500'
                      )}>
                        {n.type === 'system' ? <AlertCircle size={32} /> : n.type === 'alert' ? <ShieldAlert size={32} /> : <Bell size={32} />}
                      </div>
                      <div className="space-y-3">
                        <div className="flex items-center space-x-4">
                          <h4 className="text-2xl font-black text-stone-900 tracking-tight">{n.title}</h4>
                          <span className={cn(
                            "text-[9px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-full border-2",
                            n.type === 'system' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' :
                            n.priority === 'high' ? 'bg-red-50 text-red-600 border-red-100' :
                            n.priority === 'medium' ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-blue-50 text-blue-600 border-blue-100'
                          )}>
                            {n.type === 'system' ? 'System' : n.priority}
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
                      {!n.is_read && (
                        <button 
                          onClick={async () => {
                            try {
                              await fetchWithHandling(`/api/admin/notifications/${n.id}/mark-read`, { method: 'POST', headers: getAuthHeaders() });
                              fetchNotifications();
                            } catch (err) {}
                          }}
                          className="w-12 h-12 flex items-center justify-center bg-stone-50 text-stone-400 hover:bg-emerald-50 hover:text-emerald-500 rounded-2xl transition-all shadow-sm border border-stone-100"
                          title="Acknowledge Alert"
                        >
                          <Check size={20} />
                        </button>
                      )}
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

                <ExportTriggerButton type="analytics" />

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
              <AdminStatCard 
                label="Gross Revenue"
                value={`₹${(analyticsData.totalSales || 0).toLocaleString()}`}
                icon={<IndianRupee size={20} />}
                trend={{ value: '+12.4%', isUp: true }}
                color="emerald"
                progress={Math.min(100, (analyticsData.totalSales / (stats?.revenue || 1)) * 100)}
              />
              <AdminStatCard 
                label="Fulfilled Orders"
                value={analyticsData.totalOrders}
                icon={<ShoppingBag size={20} />}
                trend={{ value: 'Active', isUp: true, color: 'text-primary' }}
                color="primary"
                progress={55}
              />
              <AdminStatCard 
                label="Conversion Velocity"
                value={`${analyticsData.conversionData?.length > 0 && analyticsData.conversionData.reduce((acc: any, curr: any) => acc + curr.visitors, 0) > 0
                  ? (analyticsData.conversionData.reduce((acc: any, curr: any) => acc + curr.orders, 0) / 
                     analyticsData.conversionData.reduce((acc: any, curr: any) => acc + curr.visitors, 0) * 100).toFixed(1) 
                  : '4.2'}%`}
                icon={<Zap size={20} />}
                trend={{ value: 'High', isUp: true, color: 'text-blue-500' }}
                color="blue"
                progress={40}
              />
              <AdminStatCard 
                label="Stock Portfolio Val."
                value={`₹${(analyticsData.inventoryData?.total_cost || 0).toLocaleString()}`}
                icon={<Wallet size={20} />}
                trend={{ value: 'Focus', isUp: false, color: 'text-amber-500' }}
                color="amber"
                progress={85}
              />
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
                    <span className="font-black text-xs uppercase tracking-[0.2em] select-text">Growth Projection</span>
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
                <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-stone-100 group transition-all hover:shadow-xl hover:shadow-stone-200/20">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                    <div>
                      <h3 className="text-xl font-black text-stone-900 tracking-tight">Revenue Velocity</h3>
                      <p className="text-xs text-stone-400 mt-1">
                        {showWeeklyComparison ? "Last week vs This week performance comparison" : "30-day transactional throughput"}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      {/* Weekly Comparison Toggle Switch */}
                      <div className="flex bg-stone-100 p-1 rounded-xl">
                        <button
                          onClick={() => setShowWeeklyComparison(false)}
                          className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all duration-200 ${
                            !showWeeklyComparison 
                              ? 'bg-white text-stone-900 shadow-sm' 
                              : 'text-stone-400 hover:text-stone-600'
                          }`}
                        >
                          30 Days
                        </button>
                        <button
                          onClick={() => setShowWeeklyComparison(true)}
                          className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all duration-200 ${
                            showWeeklyComparison 
                              ? 'bg-white text-stone-900 shadow-sm' 
                              : 'text-stone-400 hover:text-stone-600'
                          }`}
                        >
                          Weekly Comp
                        </button>
                      </div>

                      <div className="flex items-center space-x-2 text-emerald-500 bg-emerald-50 px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-widest">
                        <TrendingUp size={12} />
                        <span>Live Feed</span>
                      </div>
                    </div>
                  </div>
                  <div className="h-80 min-h-[320px] w-full">
                    {showWeeklyComparison && (
                      <div className="flex items-center justify-end space-x-6 mb-4 text-[10px] font-black uppercase tracking-wider">
                        <div className="flex items-center">
                          <span className="w-3 h-1.5 rounded bg-emerald-500 mr-2" />
                          <span className="text-stone-600">This Week</span>
                        </div>
                        <div className="flex items-center">
                          <span className="w-3 h-1.5 border-t-2 border-stone-400 border-dashed mr-2" />
                          <span className="text-stone-400">Last Week</span>
                        </div>
                      </div>
                    )}
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart 
                        data={showWeeklyComparison ? getWeeklyComparisonData() : salesAnalytics.dailySales} 
                        margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                      >
                        <defs>
                          <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="colorThisWeek" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.11}/>
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="colorLastWeek" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.05}/>
                            <stop offset="95%" stopColor="#94a3b8" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis 
                          dataKey={showWeeklyComparison ? "day" : "date"} 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
                          dy={10}
                        />
                        <YAxis 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
                        />
                        <Tooltip 
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const data = payload[0].payload;
                              if (showWeeklyComparison) {
                                return (
                                  <div className="bg-stone-900 text-white p-4 rounded-2xl shadow-2xl border border-white/10 space-y-2 select-text">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-stone-400">
                                      Day: {data.day}
                                    </p>
                                    <div className="flex items-center justify-between space-x-6">
                                      <span className="text-xs text-emerald-400 font-bold flex items-center">
                                        <span className="w-2 h-2 rounded-full bg-emerald-400 mr-1.5" />
                                        This Week ({data.thisWeekDate || 'Date N/A'}):
                                      </span>
                                      <span className="text-xs font-black">₹{(data.thisWeek || 0).toLocaleString()}</span>
                                    </div>
                                    <div className="flex items-center justify-between space-x-6">
                                      <span className="text-xs text-stone-400 font-bold flex items-center">
                                        <span className="w-2 h-2 rounded-full bg-stone-400 mr-1.5" />
                                        Last Week ({data.lastWeekDate || 'Date N/A'}):
                                      </span>
                                      <span className="text-xs font-black text-stone-300">₹{(data.lastWeek || 0).toLocaleString()}</span>
                                    </div>
                                    {data.lastWeek > 0 && (
                                      <div className="pt-1.5 border-t border-white/5 text-[10px] font-bold">
                                        {data.thisWeek >= data.lastWeek ? (
                                          <span className="text-emerald-400">
                                            ▲ +{(((data.thisWeek - data.lastWeek) / data.lastWeek) * 100).toFixed(1)}% vs last week
                                          </span>
                                        ) : (
                                          <span className="text-rose-400">
                                            ▼ -{(((data.lastWeek - data.thisWeek) / data.lastWeek) * 100).toFixed(1)}% vs last week
                                          </span>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                );
                              } else {
                                return (
                                  <div className="bg-stone-900 text-white p-4 rounded-2xl shadow-2xl border border-white/10">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-stone-400 mb-1">{payload[0].payload.date}</p>
                                    <p className="text-lg font-black">₹{payload[0].value?.toLocaleString()}</p>
                                  </div>
                                );
                              }
                            }
                            return null;
                          }}
                        />
                        {showWeeklyComparison ? (
                          <>
                            <Area 
                              type="monotone" 
                              dataKey="thisWeek" 
                              name="This Week"
                              stroke="#10b981" 
                              strokeWidth={4}
                              fillOpacity={1} 
                              fill="url(#colorThisWeek)" 
                            />
                            <Area 
                              type="monotone" 
                              dataKey="lastWeek" 
                              name="Last Week"
                              stroke="#94a3b8" 
                              strokeWidth={3}
                              strokeDasharray="5 5"
                              fillOpacity={1}
                              fill="url(#colorLastWeek)"
                            />
                          </>
                        ) : (
                          <Area 
                            type="monotone" 
                            dataKey="total" 
                            stroke="#3b82f6" 
                            strokeWidth={4}
                            fillOpacity={1} 
                            fill="url(#colorTotal)" 
                          />
                        )}
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-stone-100 group transition-all hover:shadow-xl hover:shadow-stone-200/20">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h3 className="text-xl font-black text-stone-900 tracking-tight">Elite Performance</h3>
                      <p className="text-xs text-stone-400 mt-1">Top grossing assets by volume</p>
                    </div>
                    <div className="flex items-center space-x-2 text-primary bg-primary/5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest">
                      <Sparkles size={12} />
                      <span>Elite Tier</span>
                    </div>
                  </div>
                  <div className="h-80 min-h-[320px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={salesAnalytics.topProducts} layout="vertical" margin={{ top: 0, right: 30, left: 40, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                        <XAxis type="number" hide />
                        <YAxis 
                          dataKey="name" 
                          type="category" 
                          axisLine={false} 
                          tickLine={false}
                          tick={{ fill: '#1e293b', fontSize: 10, fontWeight: 900 }}
                          width={100}
                        />
                        <Tooltip 
                          cursor={{ fill: '#f8fafc' }}
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              return (
                                <div className="bg-white p-4 rounded-2xl shadow-2xl border border-stone-100">
                                  <p className="text-sm font-black text-stone-900">{payload[0].payload.name}</p>
                                  <div className="mt-2 space-y-1">
                                    <div className="flex justify-between items-center gap-4">
                                      <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Units Sold</span>
                                      <span className="text-sm font-black text-emerald-600">{payload[0].value}</span>
                                    </div>
                                    <div className="flex justify-between items-center gap-4">
                                      <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Efficiency</span>
                                      <span className="text-sm font-black text-stone-900">88%</span>
                                    </div>
                                  </div>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Bar 
                          dataKey="sold" 
                          fill="#3b82f6" 
                          radius={[0, 10, 10, 0]}
                          barSize={24}
                        />
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
                  <p className="text-lg font-black">{analyticsData.inventoryData?.total_items || 0}</p>
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
                
                <div className="md:col-span-2 h-[300px] min-h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={[
                      { name: 'Cost Value', value: analyticsData.inventoryData?.total_cost || 0, fill: '#EF4444' },
                      { name: 'Potential Revenue', value: analyticsData.inventoryData?.potential_revenue || 0, fill: '#10B981' },
                      { name: 'Potential Profit', value: (analyticsData.inventoryData?.potential_revenue || 0) - (analyticsData.inventoryData?.total_cost || 0), fill: '#F27D26' }
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
                        { (analyticsData.rfmSegmentData || []).map((entry: any, index: number) => (
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
                  { (analyticsData.rfmSegmentData || []).sort((a: any, b: any) => b.revenue - a.revenue).map((segment: any, idx: number) => (
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
                        { (analyticsData.salesByCategory || []).map((_: any, index: number) => (
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
                
                <div className="lg:col-span-2 responsive-table-container">
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
                        { (analyticsData.conversionFunnel || []).map((entry: any, index: number) => (
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
                        { (analyticsData.acquisitionSources || []).map((_: any, index: number) => (
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
              <div className="responsive-table-container">
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
                    {(analyticsData.popularProducts || []).map((p: any, i: number) => (
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
                                  <div className="w-3 h-3 bg-stone-300 rounded-full" />
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

        {activeTab === 'Order Batching' && (
          <OrderBatchingTab />
        )}

        {activeTab === 'Orders' && (
          <div className="space-y-6">
            {/* Orders Header - Soft & Flat */}
            <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-2">
              <div>
                <h2 className="text-3xl font-bold text-stone-900 tracking-tight">Orders Registry</h2>
                <p className="text-stone-500 text-sm mt-1">Manage, track, and complete physical store orders.</p>
              </div>
              <div className="bg-stone-100/80 p-1 rounded-2xl flex space-x-1 border border-stone-200/30">
                <button 
                  onClick={() => setOrdersViewMode('table')}
                  className={cn(
                    "flex items-center space-x-1.5 px-5 py-2.5 rounded-xl text-xs font-bold transition-all",
                    ordersViewMode === 'table' ? "bg-white text-stone-900 shadow-sm" : "text-stone-400 hover:text-stone-600"
                  )}
                >
                  <List size={14} />
                  <span>Table View</span>
                </button>
                <button 
                  onClick={() => setOrdersViewMode('kanban')}
                  className={cn(
                    "flex items-center space-x-1.5 px-5 py-2.5 rounded-xl text-xs font-bold transition-all",
                    ordersViewMode === 'kanban' ? "bg-white text-stone-900 shadow-sm" : "text-stone-400 hover:text-stone-600"
                  )}
                >
                  <LayoutDashboard size={14} />
                  <span>Kanban Board</span>
                </button>
              </div>
             </header>
 
             <ExportTriggerButton type="orders" />

             {/* Order Metrics Stats - Soft & Flat Pastels */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {loading ? (
                [...Array(4)].map((_, i) => <StatSkeleton key={i} />)
              ) : [
                { label: 'Pending Orders', val: orders.filter(o => o.status === 'pending').length, icon: Clock, color: 'amber', status: 'pending' },
                { label: 'Processing Orders', val: orders.filter(o => o.status === 'processing').length, icon: Package, color: 'blue', status: 'processing' },
                { label: 'Shipped Orders', val: orders.filter(o => o.status === 'shipped').length, icon: Truck, color: 'purple', status: 'shipped' },
                { label: 'Completed Orders', val: orders.filter(o => o.status === 'delivered').length, icon: CheckCircle2, color: 'emerald', status: 'delivered' }
              ].map((stat, i) => (
                <motion.div 
                  key={stat.label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="bg-stone-50/50 p-5 rounded-2xl border border-stone-200/40 flex items-center space-x-4"
                >
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center",
                    stat.color === 'amber' ? "bg-amber-100/40 text-amber-700" :
                    stat.color === 'blue' ? "bg-blue-100/40 text-blue-700" :
                    stat.color === 'purple' ? "bg-purple-100/40 text-purple-700" :
                    "bg-emerald-100/40 text-emerald-700"
                  )}>
                    <stat.icon size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1">{stat.label}</p>
                    <div className="flex items-baseline space-x-2">
                      <span className="text-2xl font-black text-stone-900 tracking-tight">{stat.val}</span>
                      <span className={cn("text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider",
                        stat.color === 'amber' ? "bg-amber-50 text-amber-800" :
                        stat.color === 'blue' ? "bg-blue-50 text-blue-800" :
                        stat.color === 'purple' ? "bg-purple-50 text-purple-800" :
                        "bg-emerald-50 text-emerald-800"
                      )}>{stat.status}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Filters Dashboard - Soft, Flat and Spacious */}
            <section className="bg-stone-50/40 p-6 rounded-3xl border border-stone-200/30 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Search</label>
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" size={15} />
                  <input 
                    type="text" 
                    placeholder="Search ref ID or client..."
                    className="w-full bg-white border border-stone-200/60 rounded-xl pl-9.5 pr-4 py-2.5 text-xs text-stone-800 outline-none transition-all placeholder:text-stone-300 font-medium focus:border-stone-400"
                    value={orderSearchTerm}
                    onChange={(e) => setOrderSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Status</label>
                <select 
                  className="w-full bg-white border border-stone-200/60 rounded-xl px-3.5 py-2.5 text-xs outline-none transition-all cursor-pointer font-bold text-stone-700 focus:border-stone-400"
                  value={orderStatusFilter}
                  onChange={(e) => setOrderStatusFilter(e.target.value)}
                >
                  <option value="All">All Transactions</option>
                  <option value="pending">Pending Review</option>
                  <option value="verifying">Payment Verifying</option>
                  <option value="processing">Processing</option>
                  <option value="shipped">On Route</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="failed">Failed Transaction</option>
                  <option value="paid">Settled (Paid)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Order Type</label>
                <select 
                  className="w-full bg-white border border-stone-200/60 rounded-xl px-3.5 py-2.5 text-xs outline-none transition-all cursor-pointer font-bold text-stone-700 focus:border-stone-400"
                  value={orderDeliveryFilter}
                  onChange={(e) => setOrderDeliveryFilter(e.target.value as any)}
                >
                  <option value="all">All Types</option>
                  <option value="delivery">Home Delivery</option>
                  <option value="pickup">Store Pickup</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Date Range</label>
                <div className="flex items-center space-x-2">
                  <input 
                    type="date" 
                    className="w-full bg-white border border-stone-200/60 rounded-xl px-3 py-2.5 text-xs outline-none transition-all font-bold text-stone-700"
                    value={orderDateStart}
                    onChange={(e) => setOrderDateStart(e.target.value)}
                  />
                  <span className="text-stone-300">→</span>
                  <input 
                    type="date" 
                    className="w-full bg-white border border-stone-200/60 rounded-xl px-3 py-2.5 text-xs outline-none transition-all font-bold text-stone-700"
                    value={orderDateEnd}
                    onChange={(e) => setOrderDateEnd(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex items-end space-x-2">
                <div className="flex-1 space-y-1.5">
                  <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Sort By</label>
                  <select 
                    className="w-full bg-white border border-stone-200/60 rounded-xl px-3.5 py-2.5 text-xs outline-none transition-all cursor-pointer font-bold text-stone-700 focus:border-stone-400"
                    value={orderSortBy}
                    onChange={(e) => setOrderSortBy(e.target.value)}
                  >
                    <option value="date font-bold">Order Date</option>
                    <option value="id font-bold">Reference ID</option>
                    <option value="customer font-bold">Client Name</option>
                    <option value="total font-bold">Total Value</option>
                  </select>
                </div>
                <button 
                  onClick={() => setOrderSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                  className="p-3 bg-white border border-stone-200/60 rounded-xl text-stone-400 hover:text-stone-800 transition-all shadow-sm"
                >
                  <TrendingUp size={16} className={cn(orderSortOrder === 'desc' && "rotate-180")} />
                </button>
                <button 
                  onClick={() => {
                    setOrderStatusFilter('All');
                    setOrderDateStart('');
                    setOrderDateEnd('');
                    setOrderSearchTerm('');
                    setOrderSortBy('date');
                    setOrderSortOrder('desc');
                    setOrderDeliveryFilter('all');
                  }}
                  className="p-3 bg-white border border-stone-200/60 rounded-xl text-stone-400 hover:text-red-500 transition-all shadow-sm"
                >
                  <RefreshCw size={16} />
                </button>
              </div>
            </section>

            {ordersViewMode === 'table' ? (
              <div className="bg-white rounded-3xl border border-stone-200/40 overflow-hidden shadow-sm">
                <div className="responsive-table-container no-scrollbar">
                  <table className="w-full text-left">
                    <thead className="bg-stone-50/50 text-stone-400 text-[10px] uppercase font-bold tracking-[0.2em] border-b border-stone-100">
                      <tr>
                        <th className="px-8 py-6 w-10">
                          <input 
                            type="checkbox" 
                            className="w-4 h-4 rounded-md border-stone-300 text-stone-900 focus:ring-stone-900 transition-all cursor-pointer"
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedOrders(orders.map(o => o.id));
                              } else {
                                setSelectedOrders([]);
                              }
                            }}
                          />
                        </th>
                        <th className="px-6 py-6">Order ID</th>
                        <th className="px-6 py-6">Customer Info</th>
                        <th className="px-6 py-6 text-right">Total Price</th>
                        <th className="px-6 py-6">Status</th>
                        <th className="px-6 py-6">Date</th>
                        <th className="px-8 py-6 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100/60">
                      {loading ? (
                        [...Array(5)].map((_, i) => (
                           <tr key={i}>
                             <td colSpan={7}>
                               <TableRowSkeleton columns={6} />
                             </td>
                           </tr>
                        ))
                      ) : orders.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="px-8 py-20 text-center">
                            <div className="flex flex-col items-center space-y-4">
                              <div className="w-16 h-16 bg-stone-50 rounded-full flex items-center justify-center text-stone-200">
                                <ShoppingBag size={32} />
                              </div>
                              <div className="space-y-1">
                                <p className="font-bold text-stone-900">Archive Is Null</p>
                                <p className="text-sm text-stone-400">No transactions recorded matching the current filter scope.</p>
                              </div>
                            </div>
                          </td>
                        </tr>
                      ) : orders
                        .filter(order => {
                          const matchesStatus = orderStatusFilter === 'All' || 
                            order.status === orderStatusFilter || 
                            (orderStatusFilter === 'paid' && order.payment_status === 'paid') ||
                            (orderStatusFilter === 'verifying' && order.payment_status === 'verifying');
                          const matchesDelivery = orderDeliveryFilter === 'all' || order.delivery_type === orderDeliveryFilter;
                          const orderDate = new Date(order.created_at).toISOString().split('T')[0];
                          const matchesStart = !orderDateStart || orderDate >= orderDateStart;
                          const matchesEnd = !orderDateEnd || orderDate <= orderDateEnd;
                          const matchesSearch = !orderSearchTerm || 
                            order.id.toString().includes((orderSearchTerm || '').replace('#ORD-', '')) ||
                            order.user_name?.toLowerCase().includes(orderSearchTerm.toLowerCase());
                          return matchesStatus && matchesDelivery && matchesStart && matchesEnd && matchesSearch;
                        })
                        .map((order, idx) => (
                        <motion.tr 
                          key={order.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.02 }}
                          className={cn(
                            "hover:bg-stone-50/40 transition-all duration-300 group cursor-default",
                            selectedOrders.includes(order.id) ? "bg-stone-50/60" : "bg-white"
                          )}
                        >
                          <td className="px-8 py-6">
                            <input 
                              type="checkbox" 
                              className="w-4 h-4 rounded-md border-stone-200 text-stone-900 focus:ring-stone-900 transition-all cursor-pointer"
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
                          <td className="px-6 py-6">
                            <div className="flex items-center space-x-3">
                              <div className="flex flex-col">
                                <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 bg-stone-900 text-white rounded-lg font-mono text-xs font-black tracking-tighter select-text">
                                  <span>ORD</span>
                                  <span className="text-stone-400">#</span>
                                  <span>{order.id}</span>
                                </span>
                                {order.delivery_type === 'pickup' && (
                                  <span className="mt-1 bg-stone-100 text-stone-700 text-[8px] px-2 py-0.5 rounded-md font-bold uppercase tracking-wider w-fit border border-stone-200/50">Pickup</span>
                                )}
                                <div className="flex items-center space-x-2 mt-2">
                                  <span className="text-[9px] font-bold text-stone-400 uppercase tracking-widest">{order.payment_method || 'Online'}</span>
                                  {order.admin_notes && <div className="w-1.5 h-1.5 rounded-full bg-amber-400" title="Internal Persistence" />}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-6">
                            <button 
                              onClick={() => {
                                if (order.user_name) {
                                  setCustomerSearchTerm(order.user_name);
                                  setSelectedSegment('all');
                                  setActiveTab('Customers');
                                }
                              }}
                              className="flex items-center space-x-3.5 text-left group/btn outline-none focus:outline-none"
                            >
                              <div className="w-9 h-9 rounded-xl bg-stone-100/60 flex items-center justify-center text-xs font-black text-stone-600 uppercase border border-stone-250/20 overflow-hidden group-hover/btn:border-stone-400 transition-colors">
                                {order.user_name ? (
                                  <span className="text-stone-700 font-bold">{order.user_name[0]}</span>
                                ) : (
                                  <Users size={15} />
                                )}
                              </div>
                              <div className="max-w-[180px]">
                                <p className="text-sm font-bold text-stone-850 group-hover/btn:text-stone-950 transition-colors line-clamp-1 tracking-tight" title={order.user_name}>
                                  {order.user_name || 'Protocol Client'}
                                </p>
                                <p className="text-[10px] text-stone-400 font-semibold tracking-wide mt-0.5 whitespace-nowrap">
                                  {order.items?.length || 0} items • View Customer
                                </p>
                              </div>
                            </button>
                          </td>
                          <td className="px-6 py-6 text-right">
                            <div className="flex flex-col items-end">
                              <span className="text-base font-bold text-stone-900 tracking-tight select-text">₹{(order.total || 0).toLocaleString()}</span>
                              <div className="flex items-center space-x-1.5 mt-1">
                                <div className={cn(
                                  "w-1.5 h-1.5 rounded-full",
                                  order.payment_status === 'paid' ? "bg-emerald-500" :
                                  order.payment_status === 'failed' ? "bg-red-500" : "bg-amber-500"
                                )} />
                                <span className={cn(
                                  "text-[10px] font-bold uppercase tracking-wider",
                                  order.payment_status === 'paid' ? "text-emerald-600" :
                                  order.payment_status === 'failed' ? "text-red-700" : "text-amber-700"
                                )}>
                                  {order.payment_status ? order.payment_status.toUpperCase() : 'PENDING'}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-6">
                            <OrderStatusBadge status={order.status} />
                          </td>
                          <td className="px-6 py-6">
                            <div className="flex flex-col">
                              <span className="text-xs font-bold text-stone-800 tracking-tight select-text">{new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                              <span className="text-[10px] font-medium text-stone-400 uppercase tracking-wider mt-0.5 select-text">{new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                          </td>
                          <td className="px-8 py-6 text-right">
                            <div className="flex items-center justify-end space-x-2.5">
                              <motion.button 
                                whileHover={{ scale: 1.05, backgroundColor: '#f5f5f4' }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => fetchOrderDetailsModal(order)}
                                className="p-2.5 bg-stone-50 text-stone-500 hover:text-stone-900 rounded-xl transition-all border border-stone-200/45 shadow-sm"
                                title="Inspect Protocol"
                              >
                                <Eye size={16} strokeWidth={2.2} />
                              </motion.button>
                              
                              {["pending", "processing"].includes(order.status) && (
                                 <button
                                   onClick={() => updateOrderStatus(order.id, 'shipped')}
                                   className={cn(
                                     "px-3.5 py-2 font-bold text-[10px] uppercase tracking-wider rounded-xl transition-colors shadow-sm whitespace-nowrap",
                                     order.delivery_type === 'pickup' 
                                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200/50 hover:bg-emerald-100" 
                                      : "bg-purple-50 text-purple-700 border border-purple-200/50 hover:bg-purple-100"
                                   )}
                                   title={order.delivery_type === 'pickup' ? "Mark Ready for Pickup" : "Ship Order"}
                                 >
                                    {order.delivery_type === 'pickup' ? 'Ready' : 'Ship'}
                                 </button>
                              )}
                              
                              {order.status === "shipped" && (
                                 <button
                                   onClick={() => updateOrderStatus(order.id, 'delivered')}
                                   className="px-3.5 py-2 bg-stone-900 text-white hover:bg-stone-800 font-bold text-[10px] uppercase tracking-wider rounded-xl transition-colors shadow-sm whitespace-nowrap"
                                   title={order.delivery_type === 'pickup' ? "Complete Pickup" : "Deliver Order"}
                                 >
                                    {order.delivery_type === 'pickup' ? 'Picked' : 'Deliver'}
                                 </button>
                              )}

                              <div className="relative">
                                <motion.button 
                                  whileHover={{ scale: 1.05, backgroundColor: '#f5f5f4' }}
                                  whileTap={{ scale: 0.95 }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveActionMenuId(activeActionMenuId === `order_${order.id}` ? null : `order_${order.id}`);
                                  }}
                                  className={cn(
                                    "p-2.5 bg-stone-50 text-stone-500 rounded-xl transition-all border border-stone-200/45 hover:text-stone-800 shadow-sm",
                                    activeActionMenuId === `order_${order.id}` && "bg-white text-stone-900 shadow-xl border-stone-200"
                                  )}
                                >
                                  <MoreVertical size={16} strokeWidth={2.2} />
                                </motion.button>
                                
                                <AnimatePresence>
                                  {activeActionMenuId === `order_${order.id}` && (
                                    <motion.div 
                                      initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                      animate={{ opacity: 1, scale: 1, y: 0 }}
                                      exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                      className="absolute right-0 top-full mt-3 w-64 bg-white rounded-2xl shadow-xl border border-stone-100 z-[100] overflow-hidden flex flex-col py-2.5"
                                      onMouseLeave={() => setActiveActionMenuId(null)}
                                    >
                                      <div className="px-6 py-2 text-[9px] font-black uppercase text-stone-400 tracking-[0.2em] mb-1">State Control</div>
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
                                            "flex items-center justify-between px-6 py-2.5 hover:bg-stone-50 text-left text-xs font-bold transition-all",
                                            order.status === s.val ? "text-stone-900 bg-stone-50" : "text-stone-500"
                                          )}
                                        >
                                          <div className="flex items-center space-x-2.5">
                                            <div className={cn("w-1.5 h-1.5 rounded-full", order.status === s.val ? s.color : "bg-stone-200")} />
                                            <span>{s.label}</span>
                                          </div>
                                          {order.status === s.val && <Check size={14} className="text-stone-800" />}
                                        </button>
                                      ))}
                                      <div className="h-px bg-stone-100 my-2 mx-4" />
                                      <button 
                                        onClick={async () => {
                                          const { generateOrderInvoicePDF } = await import('../services/pdfService');
                                          setExportProgress({ open: true, progress: 30, label: 'Collating order telemetry...' });
                                          generateOrderInvoicePDF(order, config);
                                          setExportProgress({ open: true, progress: 100, label: 'Invoice Generated' });
                                          setTimeout(() => setExportProgress({ open: false, progress: 0, label: '' }), 1000);
                                        }}
                                        className="flex items-center space-x-3 px-6 py-2.5 hover:bg-stone-50 group transition-all"
                                      >
                                        <div className="p-2 bg-stone-100 rounded-lg group-hover:bg-stone-200 transition-colors">
                                          <Receipt size={14} className="text-stone-600" />
                                        </div>
                                        <span className="text-xs font-bold text-stone-800">Generate Ledger</span>
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
              <div className="p-6 bg-stone-50/50 rounded-3xl border border-stone-200/20 flex gap-6 overflow-x-auto no-scrollbar min-h-[700px]">
                  {['pending', 'processing', 'shipped', 'delivered', 'cancelled'].map((statusColumn) => (
                    <div key={statusColumn} className="w-[320px] shrink-0 flex flex-col">
                      <div className="flex items-center justify-between mb-5 px-1.5">
                        <div className="flex items-center space-x-3">
                          <h4 className="font-bold text-stone-800 uppercase tracking-wider text-xs">{statusColumn}</h4>
                          <span className="bg-white border border-stone-200/50 text-stone-500 text-[10px] font-bold px-2 py-0.5 rounded-lg shadow-sm">
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
                              order.id.toString().includes(orderSearchTerm?.replace('#ORD-', '')) ||
                              order.user_name?.toLowerCase().includes(orderSearchTerm.toLowerCase());
                            return matchesStatus && matchesStart && matchesEnd && matchesSearch;
                          }).map((order) => (
                          <motion.div
                            layout
                            key={order.id}
                            whileHover={{ y: -2 }}
                            className="bg-white p-5 rounded-2xl border border-stone-200/40 hover:border-stone-300 shadow-sm transition-all cursor-pointer group relative"
                            onClick={() => fetchOrderDetailsModal(order)}
                          >
                            <div className="flex justify-between items-start mb-3">
                              <div className="flex flex-col">
                                <span className="font-mono text-xs font-bold text-stone-800 tracking-tighter">#ORD-{order.id}</span>
                                {order.delivery_type === 'pickup' && (
                                  <span className="mt-1 bg-stone-100 text-stone-700 text-[7px] px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wider w-fit border border-stone-200/30">Pickup</span>
                                )}
                              </div>
                              <div className="flex flex-col items-end">
                                <span className="text-xs font-bold text-stone-900 tracking-tight">₹{order.total}</span>
                                <span className={cn(
                                  "text-[8px] font-bold uppercase tracking-wider mt-1 px-1.5 py-0.5 rounded-md",
                                  order.payment_status === 'paid' ? "bg-emerald-50 text-emerald-600 border border-emerald-100/50" :
                                  order.payment_status === 'failed' ? "bg-red-50 text-red-600 border border-red-100/50" : "bg-amber-50 text-amber-600 border border-amber-100/50"
                                )}>
                                  {order.payment_status ? order.payment_status.toUpperCase() : 'PENDING'}
                                </span>
                              </div>
                            </div>
                            <h5 className="text-sm font-bold text-stone-850 mb-1 truncate">{order.user_name || 'Anonymous Customer'}</h5>
                            <p className="text-[10px] text-stone-400 font-medium mb-3 line-clamp-1">{order.items?.length || 0} unique SKU items</p>
                            
                            <div className="flex items-center justify-between pt-3 border-t border-stone-100/60">
                              <div className="flex items-center space-x-2 text-stone-400 font-bold uppercase tracking-widest text-[9px]">
                                <Clock size={11} />
                                <span>{new Date(order.created_at).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}</span>
                              </div>
                              <span className={cn(
                                "text-[8px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-widest",
                                order.payment_method === 'cod' ? "bg-amber-50 text-amber-600 border border-amber-100/40" : "bg-emerald-50 text-emerald-600 border border-emerald-100/45"
                              )}>
                                {order.payment_method || 'Online'}
                              </span>
                            </div>

                            {/* Dropdown for quick status move */}
                            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                              <select 
                                className="text-[8px] font-bold uppercase tracking-wider bg-stone-950 text-white border-0 rounded-lg px-2 py-1 outline-none cursor-pointer"
                                onClick={(e) => e.stopPropagation()}
                                onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                                value=""
                              >
                                <option value="" disabled>Move</option>
                                {statusColumn === 'pending' && <option value="processing">Process</option>}
                                {statusColumn === 'processing' && (
                                  <option value="shipped">
                                    {order.delivery_type === 'pickup' ? 'Mark Ready' : 'Dispatch'}
                                  </option>
                                )}
                                {statusColumn === 'shipped' && (
                                  <option value="delivered">
                                    {order.delivery_type === 'pickup' ? 'Complete' : 'Deliver'}
                                  </option>
                                )}
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
            <div className="bg-white px-6 py-4 rounded-3xl border border-stone-100 shadow-sm flex flex-col min-w-[140px] hidden xl:flex">
              <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-1">Low Stock</span>
              <span className="text-xl font-black text-red-500">{allProducts.filter(p => p.stock <= (p.reorder_point || 5)).length}</span>
            </div>
            <div className="bg-white px-6 py-4 rounded-3xl border border-stone-100 shadow-sm flex flex-col min-w-[140px] hidden xl:flex">
                <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-1">Total SKU</span>
                <span className="text-xl font-black text-primary">{allProducts.length}</span>
            </div>
            <div className="hidden lg:flex items-center space-x-2 bg-emerald-50 text-emerald-600 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest border border-emerald-100">
              <Activity size={14} className="animate-pulse" />
              <span>Live Sync Active</span>
            </div>
            <div className="relative z-50">
              <button 
                onClick={() => {
                  setProductModal({ open: true, mode: 'add' });
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
                }}
                className="bg-primary text-white px-8 py-4 rounded-2xl font-black flex items-center space-x-3 shadow-xl shadow-primary/20 hover:bg-primary/90 transition-all active:scale-95 group"
              >
                <Plus size={20} className="group-hover:rotate-90 transition-transform duration-300" />
                <span>Initialize Product</span>
              </button>
            </div>
          </div>
        </div>

        <ExportTriggerButton type="products" />

        {/* Intelligence Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <AdminStatCard 
            label="Total SKU Catalog" 
            value={allProducts.length} 
            icon={<Package size={22} />} 
            color="primary"
            trend={{ value: 'Active', isUp: true }}
            progress={100}
          />
          <AdminStatCard 
            label="Out of Stock" 
            value={allProducts.filter(p => Number(p.stock) <= 0).length} 
            icon={<AlertTriangle size={22} />} 
            color="red"
            trend={{ value: 'Action Required', isUp: false }}
            progress={allProducts.length > 0 ? (allProducts.filter(p => Number(p.stock) <= 0).length / allProducts.length) * 100 : 0}
          />
          <AdminStatCard 
            label="Low Stock Replenish" 
            value={allProducts.filter(p => Number(p.stock) > 0 && Number(p.stock) <= Number(p.reorder_point || 5)).length} 
            icon={<ShieldAlert size={22} />} 
            color="amber"
            trend={{ value: 'Reviewing', isUp: true, color: 'text-amber-500' }}
            progress={45}
          />
          <AdminStatCard 
            label="Expiring Manifest" 
            value={allProducts.filter(p => p.expiry_date && new Date(p.expiry_date) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)).length} 
            icon={<Clock size={22} />} 
            color="emerald"
            trend={{ value: 'Mitigation', isUp: true }}
            progress={15}
          />
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
                <label className="text-xs font-black text-stone-400 uppercase tracking-widest px-1">Stock</label>
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
                <label className="text-xs font-black text-stone-400 uppercase tracking-widest px-1">Category</label>
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
                <label className="text-xs font-black text-stone-400 uppercase tracking-widest px-1">Status</label>
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
                <label className="text-xs font-black text-stone-400 uppercase tracking-widest px-1">Sort By</label>
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
                  <thead className="bg-stone-50/50 text-stone-400 text-xs uppercase font-black tracking-[0.15em]">
                    <tr>
                      <th className="px-8 py-6 w-10">
                        <input 
                          type="checkbox" 
                          className="w-5 h-5 rounded-lg border-stone-300 text-primary focus:ring-primary transition-all cursor-pointer"
                          checked={selectedProducts.length === filteredProducts.length && filteredProducts.length > 0}
                          onChange={toggleAllProducts}
                        />
                      </th>
                      <th className="px-6 py-6">Inventory Node</th>
                      <th className="px-6 py-6">Category</th>
                      <th className="px-6 py-6">Pricing & Margin</th>
                      <th className="px-6 py-6">Unit Liquidity</th>
                      <th className="px-6 py-6">Lifecycle Control</th>
                      <th className="px-6 py-6">Market Visibility</th>
                      <th className="px-8 py-6 text-right">Operational Directives</th>
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
                                <span className="absolute -top-2 -right-2 bg-accent text-white text-xs font-black px-1.5 py-0.5 rounded-full shadow-lg">-{product.discount}%</span>
                              )}
                            </div>
                            <div className="max-w-[240px]">
                              <p className="text-sm font-black text-stone-900 group-hover:text-primary transition-colors truncate select-text">{product.name}</p>
                              <p className="text-xs text-stone-400 font-medium line-clamp-1 mt-0.5 select-text">{product.description}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-6">
                          <span className="text-xs font-black uppercase tracking-widest text-stone-500 bg-stone-100 px-3 py-1.5 rounded-xl border border-stone-200/50 select-text">{product.category}</span>
                        </td>
                        <td className="px-6 py-6">
                          <div className="space-y-1">
                            <div className="flex items-center space-x-2">
                              <span className="text-sm font-black text-stone-900 select-text">₹{(product.retail_price || product.price).toLocaleString()}</span>
                              <span className="text-xs font-bold text-stone-400 uppercase tracking-widest">Retail</span>
                            </div>
                            {product.wholesale_price && (
                              <div className="flex items-center space-x-2">
                                <span className="text-xs font-bold text-stone-500 select-text">₹{product.wholesale_price.toLocaleString()}</span>
                                <span className="text-xs font-bold text-stone-400 uppercase tracking-widest">W/S</span>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-6">
                          <div className="flex flex-col">
                            <span className={cn(
                              "text-xs font-black uppercase tracking-widest mb-1 shadow-sm px-2 py-0.5 rounded-md w-fit select-text",
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
                              <span className="text-sm font-black text-stone-700 select-text">{product.stock} <span className="text-xs text-stone-400 font-bold uppercase tracking-widest">Units</span></span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-6">
                           <div className="flex flex-col">
                              {product.expiry_date ? (
                                <>
                                  <span className={cn(
                                    "text-xs font-black uppercase tracking-widest mb-1",
                                    new Date(product.expiry_date) < new Date(Date.now() + 15 * 24 * 60 * 60 * 1000) ? "text-red-500" : "text-stone-400"
                                  )}>
                                    Expiry Ctrl
                                  </span>
                                  <span className="text-sm font-black text-stone-700 select-text">{new Date(product.expiry_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                </>
                              ) : (
                                <span className="text-xs text-stone-300 italic font-bold">No Expiry Tracked</span>
                              )}
                           </div>
                        </td>
                        <td className="px-6 py-6">
                          <span className={cn(
                            "inline-flex items-center space-x-2 px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-widest border transition-all duration-300",
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
                              onClick={() => { 
                                setEditingProduct(product); 
                                setNewProduct({
                                  ...product,
                                  images: typeof product.images === 'string' ? JSON.parse(product.images) : (product.images || []),
                                  image: product.image || (product.images && (typeof product.images === 'string' ? JSON.parse(product.images) : product.images).length > 0 ? (typeof product.images === 'string' ? JSON.parse(product.images) : product.images)[0] : '')
                                });
                                setProductModal({ open: true, mode: 'edit' });
                              }}
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
                    <span className="text-xs uppercase font-bold tracking-widest text-stone-400">Selected</span>
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
                    const emailInput = document.getElementById('admin-email-input') as HTMLInputElement;
                    const email = emailInput?.value;
                    if (!email) return;
                    try {
                      const data = await fetchWithHandling<any>('/api/admin/make-admin', {
                        method: 'POST',
                        headers: getAuthHeaders(),
                        body: JSON.stringify({ email })
                      });
                      if (data) {
                        toast.success('Admin role granted');
                        if (emailInput) emailInput.value = '';
                      }
                    } catch (e) {
                      console.error('Make admin error:', e);
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
                            try {
                              const data = await fetchWithHandling<any>(`/api/admin/roles/${role.id}`, { 
                                method: 'DELETE',
                                headers: getAuthHeaders()
                              });
                              if (data) {
                                toast.success('Role deleted');
                                const rolesData = await fetchWithHandling<any[]>('/api/admin/roles', { headers: getAuthHeaders() });
                                if (rolesData) setRoles(rolesData);
                              }
                            } catch (err) {
                              console.error('Delete role error:', err);
                            }
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
              <div className="flex flex-wrap gap-4 items-end">
                <div className="bg-white px-6 py-4 rounded-3xl border border-stone-100 shadow-sm flex flex-col min-w-[140px]">
                  <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-1">Total Humans</span>
                  <span className="text-xl font-black text-primary">{users.length}</span>
                </div>
                <div className="bg-white px-6 py-4 rounded-3xl border border-stone-100 shadow-sm flex flex-col min-w-[140px]">
                  <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-1">Active Wallets</span>
                  <span className="text-xl font-black text-emerald-500">₹{users.reduce((acc, u) => acc + (u.wallet_balance || 0), 0).toLocaleString()}</span>
                </div>
                <div className="flex flex-col items-end gap-3">
                  <ExportTriggerButton type="users" />
                </div>
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
                {['all', 'Khata Requests', 'Champion', 'Loyal', 'Recent', 'At Risk', 'Lost'].map((segment) => (
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
                    value={customerSearchTerm}
                    onChange={(e) => setCustomerSearchTerm(e.target.value)}
                  />
                </div>
                <motion.button 
                  whileHover={{ rotate: 180 }}
                  onClick={() => { setSelectedSegment('all'); setCustomerSearchTerm(''); }}
                  className="p-3.5 bg-stone-50 border border-stone-200 rounded-2xl text-stone-400 hover:text-primary transition-all shadow-sm"
                >
                  <RefreshCw size={20} />
                </motion.button>
              </div>
            </section>

            <div className="bg-white rounded-[2.5rem] shadow-sm border border-stone-100 overflow-hidden">
              <div className="overflow-x-auto no-scrollbar hidden md:block">
                <table className="w-full text-left">
                  <thead className="bg-stone-50/50 text-stone-400 text-xs uppercase font-black tracking-[0.15em]">
                    <tr>
                      <th className="px-8 py-6">Human Identity</th>
                      <th className="px-6 py-6">Lifecycle Segment</th>
                      <th className="px-6 py-6 text-right">Settlement Wallet</th>
                      <th className="px-6 py-6">Commercial value</th>
                      <th className="px-6 py-6">Credit Policy</th>
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
                             <p className="text-sm font-black text-stone-900 group-hover:text-primary transition-colors tracking-tight select-text">{u.name || (u.email ? u.email.split('@')[0] : 'Unknown User')}</p>
                              <p className="text-xs text-stone-400 font-bold uppercase tracking-[0.15em] mt-0.5 select-text">{maskPhoneNumber(u.phone) || u.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-6">
                          <div className="flex flex-col space-y-2">
                            <div className="flex items-center space-x-2">
                               <span className={cn(
                                 "inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border",
                                 u.computed_segment === 'Champion' ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                                 u.computed_segment === 'Loyal' ? "bg-blue-50 text-blue-600 border-blue-100" :
                                 u.computed_segment === 'Recent' ? "bg-amber-50 text-amber-600 border-amber-100" :
                                 u.computed_segment === 'At Risk' ? "bg-orange-50 text-orange-600 border-orange-100" :
                                 "bg-stone-50 text-stone-500 border-stone-100"
                               )}>
                                 {u.computed_segment || u.segment || 'PROSPECT'}
                               </span>
                               {u.rfm_score && <span className="text-xs font-mono font-black text-stone-300 tracking-tighter">RFM:{u.rfm_score}</span>}
                            </div>
                            <span className="text-xs font-black text-stone-400 uppercase tracking-[0.2em]">{u.role} Access LVL</span>
                          </div>
                        </td>
                        <td className="px-6 py-6 text-right">
                          <div className="flex flex-col items-end">
                            <span className="text-base font-black text-primary tracking-tighter select-text">₹{(u.wallet_balance || 0).toLocaleString()}</span>
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
                            <span className="text-sm font-black text-stone-900 tracking-tight select-text">{(u as any).total_orders || 0} Transactions</span>
                            <span className="text-xs font-black text-emerald-600 uppercase tracking-widest mt-1.5 underline decoration-emerald-100 underline-offset-4 decoration-2">LTV: ₹{((u as any).total_spent || 0).toLocaleString()}</span>
                            {u.khata_requested && !u.khata_enabled && (
                               <span className="mt-2 flex items-center gap-1.5 text-[8px] font-black bg-amber-100 text-amber-600 px-2 py-1 rounded-lg uppercase tracking-widest animate-pulse border border-amber-200">
                                  <Clock size={10} />
                                  Audit Pending
                               </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-6">
                           <div className="flex flex-col">
                             <div className="flex items-center space-x-2.5">
                               <div className={cn("w-2 h-2 rounded-full", u.khata_enabled ? "bg-emerald-500 animate-pulse" : "bg-stone-200")} />
                               <span className={cn("text-xs font-black uppercase tracking-[0.15em]", u.khata_enabled ? "text-stone-900" : "text-stone-300")}>
                                 {u.khata_enabled ? 'Line of Credit' : 'NO LINE'}
                               </span>
                             </div>
                             {u.khata_enabled && <span className="text-xs text-primary font-black mt-1.5 pl-4.5 tracking-tighter italic select-text">USED: ₹{(u.khata_balance || 0).toLocaleString()}</span>}
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
                                      
                                      {/* Highlight for users who haven't ordered but are active */}
                                      {((u as any).total_orders === 0) && (
                                        <div className="mx-6 mb-2 px-4 py-3 bg-amber-50 rounded-2xl border border-amber-100 flex items-center gap-3">
                                          <AlertCircle size={16} className="text-amber-600 animate-pulse" />
                                          <div className="flex flex-col">
                                            <span className="text-[9px] font-black text-amber-900 uppercase">Conversion Target</span>
                                            <span className="text-[8px] font-bold text-amber-700 leading-tight">Zero Transactions Detected. High Potential Prospect.</span>
                                          </div>
                                        </div>
                                      )}

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

                                      {(u.wallet_balance <= 0) && (
                                        <button 
                                          onClick={async () => {
                                            if (confirm(`Authorize ₹100 Loyalty Rescue Drop for ${u.name}?`)) {
                                              try {
                                                const data = await fetchWithHandling<any>(`/api/admin/users/${u.id}/wallet`, {
                                                  method: 'POST',
                                                  headers: getAuthHeaders(),
                                                  body: JSON.stringify({ amount: 100, type: 'credit', reason: 'Admin Recovery Reward' })
                                                });
                                                if (data) {
                                                  toast.success('Loyalty drop authorized!');
                                                  setUsers(prev => prev.map(usr => usr.id === u.id ? { ...usr, wallet_balance: (usr.wallet_balance || 0) + 100 } : usr));
                                                }
                                              } catch (err) {}
                                            }
                                            setActiveActionMenuId(null);
                                          }}
                                          className="flex items-center space-x-5 px-8 py-4 hover:bg-emerald-50 group transition-all"
                                        >
                                          <div className="p-2.5 bg-emerald-100 rounded-2xl text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-all"><Plus size={18} /></div>
                                          <span className="text-xs font-black text-emerald-900 group-hover:text-emerald-600 uppercase tracking-widest">Rescue Drop (₹100)</span>
                                        </button>
                                      )}

                                      <a 
                                        href={`https://wa.me/91${u.phone?.replace(/[^0-9]/g, '').slice(-10)}`}
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
                          <p className="text-lg font-black text-stone-900 tracking-tight leading-none">{u.name || (u.email ? u.email.split('@')[0] : 'Unknown')}</p>
                          <p className="text-[10px] text-stone-400 font-bold uppercase tracking-widest mt-2">{maskPhoneNumber(u.phone) || u.email}</p>
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
                    setNewPromotionRuleData({ title: '', type: 'percentage', target_type: 'all', target_id: '', condition_qty: 1, discount_value: 0, active: true });
                    setPromotionRuleFormModal({ open: true, mode: 'add', rule: null });
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
                          <td className="p-4 font-bold max-w-[200px] truncate">{rule.title}</td>
                          <td className="p-4 uppercase text-[10px] font-black text-stone-500 tracking-widest">{rule.type}</td>
                          <td className="p-4">
                            <span className="bg-stone-100 px-2 py-1 rounded text-xs font-bold text-stone-600">
                              {rule.target_type === 'all' ? 'Entire Store' : `${rule.target_type}: ${rule.target_id}`}
                            </span>
                          </td>
                          <td className="p-4 font-bold">{rule.condition_qty || 0}</td>
                          <td className="p-4 font-bold text-emerald-600">
                            {rule.type === 'percentage' && `${rule.discount_value}%`}
                            {rule.type === 'fixed' && `₹${rule.discount_value}`}
                            {rule.type === 'bogo' && `By ${rule.condition_qty} Get ${rule.reward_qty}`}
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
                                  setNewPromotionRuleData({
                                    title: rule.title,
                                    type: rule.type,
                                    target_type: rule.target_type,
                                    target_id: rule.target_id || '',
                                    condition_qty: rule.condition_qty || 1,
                                    reward_qty: rule.reward_qty || 1,
                                    discount_value: rule.discount_value,
                                    active: rule.active
                                  });
                                  setPromotionRuleFormModal({ open: true, mode: 'edit', rule: rule });
                                }}
                                className="p-2 text-stone-400 hover:text-primary hover:bg-stone-100 rounded-xl transition-colors"
                              >
                                <Settings size={16} />
                              </button>
                              <button 
                                onClick={() => handleDeleteRule(rule.id)}
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
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold">UPI Payment Details</h3>
                <div className="flex items-center space-x-6">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold text-stone-500 uppercase">Enable UPI</span>
                    <button 
                      onClick={() => updateSetting('upi_enabled', config.find(c => c.key === 'upi_enabled')?.value === 'true' ? 'false' : 'true')}
                      className={cn(
                        "w-12 h-6 rounded-full transition-all relative flex items-center px-1",
                        config.find(c => c.key === 'upi_enabled')?.value === 'true' ? "bg-primary" : "bg-stone-200"
                      )}
                    >
                      <div className={cn(
                        "w-4 h-4 bg-white rounded-full shadow-sm transition-transform",
                        config.find(c => c.key === 'upi_enabled')?.value === 'true' ? "translate-x-6" : "translate-x-0"
                      )} />
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-primary/5 p-4 rounded-2xl border border-primary/10 mb-4">
                  <label className="block text-xs font-black text-primary uppercase tracking-widest mb-2">Verification Mode</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button 
                      onClick={() => updateSetting('upi_verification_mode', 'manual')}
                      className={cn(
                        "py-3 rounded-xl text-xs font-bold transition-all border-2",
                        config.find(c => c.key === 'upi_verification_mode')?.value === 'manual' || !config.find(c => c.key === 'upi_verification_mode')
                          ? "bg-primary text-white border-primary shadow-lg shadow-primary/20"
                          : "bg-white text-stone-500 border-stone-100 hover:border-stone-200"
                      )}
                    >
                      Manually Verified
                    </button>
                    <button 
                      onClick={() => updateSetting('upi_verification_mode', 'auto')}
                      className={cn(
                        "py-3 rounded-xl text-xs font-bold transition-all border-2",
                        config.find(c => c.key === 'upi_verification_mode')?.value === 'auto'
                          ? "bg-primary text-white border-primary shadow-lg shadow-primary/20"
                          : "bg-white text-stone-500 border-stone-100 hover:border-stone-200"
                      )}
                    >
                      Auto-Verification
                    </button>
                  </div>
                  <p className="text-[10px] text-stone-500 mt-2 italic">
                    {config.find(c => c.key === 'upi_verification_mode')?.value === 'auto' 
                      ? "* System will scan emails/webhooks for matching Order IDs." 
                      : "* Customers must submit UTR/Screenshot for manual admin approval."}
                  </p>
                </div>

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
                          const data = await fetchWithHandling('/api/admin/broadcast-alert', {
                            method: 'POST',
                            headers: getAuthHeaders(),
                            body: JSON.stringify({ 
                              title, message, type, 
                              duration: 8000, 
                              is_unskippable: true 
                            })
                          });
                          if (data) {
                            toast.success('Alert Sent');
                            (document.getElementById('broadcast-title') as HTMLInputElement).value = '';
                            (document.getElementById('broadcast-message') as HTMLTextAreaElement).value = '';
                          }
                        } catch (e) {
                          console.error('Broadcast alert error:', e);
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
              <section className="relative group">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-purple-500 blur-2xl opacity-10 group-hover:opacity-20 transition-opacity rounded-[3rem]" />
                <div className="relative bg-white/80 backdrop-blur-xl p-10 rounded-[3rem] shadow-sm border border-indigo-50 space-y-10 overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 rounded-full -mr-32 -mt-32 opacity-50" />
                  
                  <div className="relative z-10">
                    <div className="flex items-center space-x-4 mb-10">
                      <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20 rotate-3">
                        <Database size={24} />
                      </div>
                      <h3 className="text-2xl font-black text-stone-900 tracking-tight">Store Access</h3>
                    </div>

                    <div className="space-y-4">
                      <div className="group flex items-center justify-between p-6 bg-white/50 border border-indigo-100/50 rounded-[2rem] hover:border-indigo-500/30 hover:bg-white transition-all duration-300 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.02)]">
                    <div className="space-y-1">
                      <p className="font-black text-stone-900 uppercase tracking-widest text-[10px]">Maintenance Mode</p>
                      <p className="text-xs text-stone-400 font-bold">Only you can access the store when this is ON.</p>
                    </div>
                    <button 
                      onClick={() => updateSetting('maintenance_mode', getSetting('maintenance_mode') === 'true' ? 'false' : 'true')}
                      className={cn(
                        "w-12 h-6 rounded-full transition-all duration-300 relative",
                        getSetting('maintenance_mode') === 'true' ? "bg-primary" : "bg-stone-200"
                      )}
                    >
                      <div className={cn(
                        "absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-300 shadow-sm ml-1",
                        getSetting('maintenance_mode') === 'true' ? "translate-x-6" : "translate-x-0"
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
              </div>
            </div>
          </section>

              <section className="relative group">
                <div className="absolute inset-0 bg-gradient-to-br from-pink-500 to-rose-500 blur-2xl opacity-10 group-hover:opacity-20 transition-opacity rounded-[3rem]" />
                <div className="relative bg-white/80 backdrop-blur-xl p-10 rounded-[3rem] shadow-sm border border-pink-50 space-y-10 overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-pink-50 rounded-full -mr-32 -mt-32 opacity-50" />
                  <div className="relative z-10">
                    <div className="flex items-center space-x-4 mb-10">
                      <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-rose-600 text-white rounded-2xl flex items-center justify-center -rotate-3 shadow-lg shadow-pink-500/20">
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
                    onClick={async () => {
                      setSelectedTicket(ticket);
                      try {
                        const data = await fetchWithHandling<any[]>(`/api/admin/support/tickets/${ticket.id}/messages`, {
                          headers: getAuthHeaders()
                        });
                        if (data) setTicketMessages(data);
                      } catch (err) {
                        console.error('Fetch ticket messages error:', err);
                      }
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
                          const newStatus = e.target.value;
                          try {
                            const data = await fetchWithHandling<any>(`/api/admin/support/tickets/${selectedTicket.id}/status`, {
                              method: 'POST',
                              headers: getAuthHeaders(),
                              body: JSON.stringify({ status: newStatus })
                            });
                            if (data) {
                              toast.success('Protocol state updated');
                              fetchTickets();
                              setSelectedTicket({...selectedTicket, status: newStatus});
                            }
                          } catch (err) {
                            console.error('Update ticket status error:', err);
                          }
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
                        <p className="text-sm font-medium text-stone-700 leading-relaxed mb-4">{selectedTicket.message}</p>
                        
                        {selectedTicket.image_url && (
                          <div className="mt-4 pt-4 border-t border-stone-50">
                            <p className="text-[9px] font-black text-stone-400 uppercase tracking-widest mb-3">Attached Evidence Artifact</p>
                            <div className="relative group/img overflow-hidden rounded-2xl border border-stone-100 aspect-video max-w-sm">
                              <img 
                                src={selectedTicket.image_url} 
                                alt="Support Evidence" 
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 cursor-zoom-in"
                                onClick={() => window.open(selectedTicket.image_url, '_blank')}
                              />
                            </div>
                          </div>
                        )}
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
                    <div className="flex flex-col mb-4">
                      <div className="flex flex-wrap gap-2 mb-4">
                        {[
                          "Confirmed, processing your order.",
                          "Order is ready for dispatch.",
                          "Delivered successfully. Thank you!",
                          "Please share coordinates/photo.",
                          "Out of stock. Wallet refund issued.",
                          "Support team is investigating.",
                        ].map((quick) => (
                          <button
                            key={quick}
                            onClick={() => setReplyMessage(quick)}
                            className="px-4 py-2 bg-stone-100 hover:bg-stone-900 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                          >
                            {quick}
                          </button>
                        ))}
                      </div>
                      <div className="flex space-x-4 bg-stone-50 p-2 rounded-[2.5rem] border border-stone-100 focus-within:bg-white focus-within:border-primary/30 focus-within:shadow-2xl focus-within:shadow-primary/5 transition-all duration-500">
                        <input 
                          type="text" 
                          placeholder="Inscribe dispatch response..."
                          className="flex-1 bg-transparent border-none rounded-3xl px-8 py-5 text-sm font-black uppercase tracking-wider placeholder:text-stone-300 outline-none"
                          value={replyMessage}
                          onChange={(e) => setReplyMessage(e.target.value)}
                          onKeyDown={async (e) => {
                            if (e.key === 'Enter' && replyMessage) {
                              // Duplicate logic for send
                              try {
                                const data = await fetchWithHandling<any>(`/api/admin/support/tickets/${selectedTicket.id}/messages`, {
                                  method: 'POST',
                                  headers: getAuthHeaders(),
                                  body: JSON.stringify({ user_id: user.id, message: replyMessage })
                                });
                                if (data) {
                                  setReplyMessage('');
                                  const msgs = await fetchWithHandling<any[]>(`/api/admin/support/tickets/${selectedTicket.id}/messages`, {
                                    headers: getAuthHeaders()
                                  });
                                  if (msgs) setTicketMessages(msgs);
                                }
                              } catch (err) {
                                console.error('Auto-dispatch error:', err);
                              }
                            }
                          }}
                        />
                        <button 
                          onClick={async () => {
                            if (!replyMessage) return;
                            try {
                              const data = await fetchWithHandling<any>(`/api/admin/support/tickets/${selectedTicket.id}/messages`, {
                                method: 'POST',
                                headers: getAuthHeaders(),
                                body: JSON.stringify({ user_id: user.id, message: replyMessage })
                              });
                              if (data) {
                                setReplyMessage('');
                                const messagesData = await fetchWithHandling<any[]>(`/api/admin/support/tickets/${selectedTicket.id}/messages`, {
                                  headers: getAuthHeaders()
                                });
                                if (messagesData) setTicketMessages(messagesData);
                              }
                            } catch (err) {
                              console.error('Send ticket message error:', err);
                            }
                          }}
                          className="bg-stone-900 hover:bg-primary text-white px-12 py-5 rounded-[2rem] font-black uppercase tracking-widest transition-all shadow-xl shadow-stone-900/20 active:scale-95 group flex items-center space-x-3"
                        >
                          <span>Dispatch</span>
                          <Send size={18} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                        </button>
                      </div>
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
                    <h4 className="text-2xl font-black text-stone-900 tracking-tight">Select a Ticket</h4>
                    <p className="font-bold text-stone-400 uppercase tracking-widest text-[10px]">Select a communication channel on the left to begin messaging.</p>
                  </div>
                </div>
              )}
            </main>
          </div>
        )}

        {activeTab === 'Newsletter' && (
          <NewsletterView />
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
                  setNewCoupon({ code: '', type: 'flat', value: '', min_order: '', usage_limit: '', limit_per_user: '1', expiry_date: '' });
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
                              limit_per_user: coupon.limit_per_user ? coupon.limit_per_user.toString() : '1',
                              expiry_date: coupon.expiry_date || ''
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
                  setNewCoupon({ code: '', type: 'flat', value: '', min_order: '', usage_limit: '', limit_per_user: '1', expiry_date: '' });
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
        {activeTab === 'Returns' && (() => {
          const filteredReturns = returns.filter((ret) => {
            if (selectedReturnReason === 'all') return true;
            if (!ret.reason) return false;
            const reasonLower = ret.reason.toLowerCase();
            const filterLower = selectedReturnReason.toLowerCase();
            return reasonLower.includes(filterLower);
          });

          return (
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

              {/* Filter Dropdown Area */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-6 bg-stone-50/50 rounded-3xl border border-stone-100 gap-4">
                <div className="flex items-center space-x-3">
                  <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">Catalogic Issue Filter:</span>
                  <div className="relative">
                    <select
                      id="return-reason-filter"
                      value={selectedReturnReason}
                      onChange={(e) => setSelectedReturnReason(e.target.value)}
                      className="appearance-none bg-white border border-stone-200 text-stone-700 font-extrabold text-xs rounded-2xl pl-4 pr-10 py-2.5 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all cursor-pointer"
                    >
                      <option value="all">🔍 Show All Returns</option>
                      <option value="Damaged">⚠️ Damaged / Quality Issues</option>
                      <option value="Incorrect Item">📦 Incorrect Item Sent</option>
                      <option value="Customer Change of Mind">💭 Customer Change of Mind</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-stone-400">
                      <ChevronDown size={14} />
                    </div>
                  </div>
                </div>

                {/* Quality Insights summary */}
                {returns.length > 0 && (() => {
                  const total = returns.length;
                  const damagedCount = returns.filter(r => r.reason?.toLowerCase().includes('damaged')).length;
                  const incorrectCount = returns.filter(r => r.reason?.toLowerCase().includes('incorrect')).length;
                  const mindCount = returns.filter(r => r.reason?.toLowerCase().includes('mind') || r.reason?.toLowerCase().includes('change') || r.reason?.toLowerCase().includes('customer')).length;
                  
                  return (
                    <div className="flex flex-wrap gap-2 text-[10px] font-mono text-stone-500 font-bold bg-white border border-stone-100 rounded-2xl p-2">
                      <span className="px-2 py-1 bg-red-50 text-red-700 rounded-lg">Damaged: {damagedCount}</span>
                      <span className="px-2 py-1 bg-amber-50 text-amber-700 rounded-lg">Incorrect: {incorrectCount}</span>
                      <span className="px-2 py-1 bg-sky-50 text-sky-700 rounded-lg">Change of Mind: {mindCount}</span>
                    </div>
                  );
                })()}
              </div>

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
                      {filteredReturns.map((ret, idx) => (
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
                      {filteredReturns.length === 0 && (
                        <tr>
                          <td colSpan={6} className="px-10 py-32 text-center text-stone-400 font-bold italic bg-stone-50/50 rounded-[2.5rem]">No returns or refunds match this filter criteria.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          );
        })()}

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
                   <span className="text-2xl font-black text-primary">{reviews.length > 0 ? (reviews.reduce((acc, r) => acc + (Number(r.rating) || 0), 0) / reviews.length).toFixed(1) : "0.0"} / 5.0</span>
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
                             <span className="text-xs font-black text-stone-800 tracking-tight">
                               {review.created_at ? new Date(review.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : 'N/A'}
                             </span>
                             <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest mt-0.5">
                               {review.created_at ? new Date(review.created_at).getFullYear() : ''}
                             </span>
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

        {activeTab === 'System Logs' && <SystemLogsView />}

        {activeTab === 'UPI Webhook Logs' && <UPIWebhookLogsView />}

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

        {activeTab === 'Admin Management' && (
          <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-8">
              <div>
                <h2 className="text-4xl font-black text-stone-900 tracking-tight">Admin Governance</h2>
                <p className="text-stone-500 mt-2 text-lg font-medium">Manage operational privileges, track activity nodes, and enforce security protocols.</p>
              </div>
              <div className="flex items-center space-x-3">
                 <div className="bg-white p-6 rounded-3xl shadow-sm border border-stone-100 flex items-center space-x-8">
                   <div className="flex flex-col">
                     <span className="text-[10px] uppercase font-black text-stone-400 tracking-widest leading-none mb-1">Active Admins</span>
                     <span className="text-2xl font-black text-stone-900">{admins.length}</span>
                   </div>
                 </div>
                 <button 
                  onClick={fetchAdmins}
                  disabled={isAdminRefreshing}
                  className="bg-stone-50 p-6 rounded-3xl border border-stone-100 hover:bg-stone-100 transition-all active:scale-95"
                 >
                   <RefreshCw className={cn("text-stone-400", isAdminRefreshing && "animate-spin")} size={24} />
                 </button>
              </div>
            </header>

            <div className="bg-white rounded-[2.5rem] shadow-sm border border-stone-100 overflow-hidden">
              <div className="overflow-x-auto no-scrollbar">
                <table className="w-full text-left">
                  <thead className="bg-stone-50/50 text-stone-400 text-[10px] uppercase font-black tracking-[0.25em]">
                    <tr>
                      <th className="px-10 py-8">Administrator Identity</th>
                      <th className="px-6 py-8">Role Tier</th>
                      <th className="px-6 py-8">State Persistence</th>
                      <th className="px-6 py-8">Last Node Access</th>
                      <th className="px-10 py-8 text-right">Goverance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-50">
                    {admins.map((adm, idx) => (
                      <motion.tr 
                        key={adm.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="group hover:bg-stone-50/50 transition-all"
                      >
                        <td className="px-10 py-7">
                          <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-stone-100 rounded-2xl flex items-center justify-center text-stone-400 group-hover:bg-stone-900 group-hover:text-white transition-all duration-300">
                              <Shield size={18} />
                            </div>
                            <div>
                              <p className="text-sm font-black text-stone-900">{adm.name || 'Admin Entity'}</p>
                              <p className="text-[10px] text-stone-400 font-bold uppercase tracking-widest">{adm.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-7">
                          <span className={cn(
                            "px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border",
                            adm.role === 'owner' ? "bg-purple-50 text-purple-600 border-purple-100" :
                            adm.role === 'admin' ? "bg-red-50 text-red-600 border-red-100" :
                            "bg-blue-50 text-blue-600 border-blue-100"
                          )}>
                            {adm.role}
                          </span>
                        </td>
                        <td className="px-6 py-7">
                           <div className="flex items-center space-x-2">
                             <div className={cn("w-2 h-2 rounded-full", adm.status === 'disabled' ? 'bg-red-500' : 'bg-emerald-500')} />
                             <span className="text-[10px] font-black text-stone-800 uppercase tracking-widest">
                               {adm.status === 'disabled' ? 'Disabled' : 'Operational'}
                             </span>
                           </div>
                        </td>
                        <td className="px-6 py-7">
                          <div className="flex flex-col">
                            <span className="text-[11px] font-black text-stone-800">
                              {adm.last_login_at ? new Date(adm.last_login_at).toLocaleString() : 'Never accessed'}
                            </span>
                          </div>
                        </td>
                        <td className="px-10 py-7 text-right">
                          <div className="flex justify-end space-x-3">
                             <button
                               onClick={async () => {
                                 const status = adm.status === 'disabled' ? 'active' : 'disabled';
                                 try {
                                   await fetchWithHandling(`/api/admin/admins/${adm.id}/status`, {
                                     method: 'POST',
                                     headers: getAuthHeaders(),
                                     body: JSON.stringify({ status })
                                   });
                                   toast.success(`Admin ${status === 'active' ? 'enabled' : 'disabled'}`);
                                   fetchAdmins();
                                 } catch (err) {}
                               }}
                               className={cn(
                                 "px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all",
                                 adm.status === 'disabled' ? "bg-emerald-50 text-emerald-600 hover:bg-emerald-100" : "bg-amber-50 text-amber-600 hover:bg-amber-100"
                               )}
                             >
                               {adm.status === 'disabled' ? 'Enable' : 'Disable'}
                             </button>
                             <button
                               onClick={async () => {
                                 if (confirm(`Are you sure you want to revoke admin rights for ${adm.email}?`)) {
                                   try {
                                     await fetchWithHandling(`/api/admin/admins/${adm.id}/revoke`, {
                                       method: 'POST',
                                       headers: getAuthHeaders()
                                     });
                                     toast.success('Admin rights revoked');
                                     fetchAdmins();
                                   } catch (err) {}
                                 }
                               }}
                               className="px-4 py-2.5 bg-red-50 text-red-600 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-red-100 transition-all"
                             >
                               Revoke Access
                             </button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-stone-50 p-8 rounded-[2rem] border border-dashed border-stone-200">
                <div className="flex items-center space-x-4 mb-6">
                  <div className="p-3 bg-stone-900 text-white rounded-2xl">
                    <Activity size={24} />
                  </div>
                  <div>
                     <h3 className="text-xl font-black text-stone-900 uppercase tracking-tight">Governance Intelligence</h3>
                     <p className="text-stone-500 font-medium">Recent high-level node modifications and access patterns.</p>
                  </div>
                </div>
                
                <div className="bg-white rounded-3xl border border-stone-100 overflow-hidden">
                   <div className="max-h-96 overflow-y-auto no-scrollbar">
                      <table className="w-full text-left">
                         <thead className="bg-stone-50/50 text-stone-400 text-[9px] uppercase font-black tracking-widest">
                            <tr>
                               <th className="px-8 py-5">Node Identity</th>
                               <th className="px-6 py-5">Directive Action</th>
                               <th className="px-6 py-5">Target Resource</th>
                               <th className="px-8 py-5 text-right">Time Offset</th>
                            </tr>
                         </thead>
                         <tbody className="divide-y divide-stone-50">
                            {auditLogs.slice(0, 20).map((log, lIdx) => (
                               <tr key={log.id} className="hover:bg-stone-50/50 transition-all font-mono text-[10px]">
                                  <td className="px-8 py-4 font-black text-stone-600">{log.admin_id}</td>
                                  <td className="px-6 py-4">
                                     <span className="bg-amber-50 text-amber-600 px-2 py-1 rounded text-[8px] font-black border border-amber-100">{log.action}</span>
                                  </td>
                                  <td className="px-6 py-4 text-stone-400">{log.target_type}#{log.target_id}</td>
                                  <td className="px-8 py-4 text-right text-stone-300">{new Date(log.created_at).toLocaleString()}</td>
                               </tr>
                            ))}
                         </tbody>
                      </table>
                   </div>
                </div>
              </div>

              <div className="bg-white rounded-[2rem] p-8 border border-stone-150 shadow-sm relative group overflow-hidden">
                 <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                   <Trash2 size={120} />
                 </div>
                 <h3 className="text-2xl font-black text-stone-900 tracking-tight italic mb-8 relative z-10">Data Deletion Queue</h3>
                 <div className="space-y-4 relative z-10">
                    {deletionRequests.length === 0 ? (
                      <div className="text-center py-20 text-stone-300 bg-stone-50/50 rounded-[2.5rem] border border-dashed border-stone-200">
                        <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                          <CheckCircle2 size={32} className="text-emerald-500" />
                        </div>
                        <p className="font-black uppercase text-[10px] tracking-[0.25em] text-stone-300">Privacy Compliance: 100%</p>
                        <p className="text-xs font-bold text-stone-400 mt-2">No active user deletion requests pending.</p>
                      </div>
                    ) : (
                      deletionRequests.map((req, i) => (
                        <div key={req.id} className="p-8 bg-red-50/50 rounded-[2.5rem] border border-red-100 space-y-6 shadow-sm">
                          <div className="flex justify-between items-start">
                            <div className="flex items-center space-x-4">
                              <div className="w-12 h-12 bg-white rounded-2xl border border-red-100 flex items-center justify-center text-red-500 shadow-sm">
                                <Users size={20} />
                              </div>
                              <div>
                                <p className="font-black text-red-900 leading-none text-lg tracking-tight">{req.user_name}</p>
                                <p className="text-[10px] font-bold text-red-400 uppercase tracking-widest mt-1.5">Cipher: SYS-DEL-0{req.id}</p>
                              </div>
                            </div>
                            <span className="px-3 py-1 bg-red-100 text-red-600 rounded-lg text-[9px] font-black uppercase tracking-widest border border-red-200">Pending Authorization</span>
                          </div>
                          <div className="bg-white p-5 rounded-2xl text-[11px] font-bold text-red-800 leading-relaxed italic relative border border-red-50">
                             <span className="absolute -top-3 left-6 px-2 bg-white text-[8px] uppercase tracking-widest text-red-300">User Testimony</span>
                            "{req.reason || 'No internal reason documented'}"
                          </div>
                          <div className="flex gap-3">
                             <button 
                              onClick={() => approveDeletion(req.id)} 
                              className="flex-1 py-4 bg-red-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-red-200 hover:bg-red-700 transition-all hover:scale-[1.02] active:scale-[0.98]"
                             >
                               Authorize Full Purge
                             </button>
                             <button 
                              onClick={() => rejectDeletion(req.id)} 
                              className="px-8 py-4 bg-white text-red-500 rounded-2xl text-xs font-black uppercase tracking-widest border border-red-100 hover:bg-red-50 transition-all"
                             >
                               Reject
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

        {activeTab === 'Promotional Rules' && (
          <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-8">
              <div>
                <h2 className="text-4xl font-black text-stone-900 tracking-tight">Promotional Rule Configuration</h2>
                <p className="text-stone-500 mt-2 text-lg font-medium">Manage BOGO, discounts, and tiered logic for products and categories.</p>
              </div>
              <button 
                onClick={() => {
                  setNewPromotionRuleData({ title: '', type: 'bogo', target_type: 'all', target_id: '', condition_qty: 0, reward_qty: 0, discount_value: 0, active: true });
                  setPromotionRuleFormModal({ open: true, mode: 'add', rule: null });
                }}
                className="bg-stone-900 text-white px-8 py-4 rounded-[2rem] font-black flex items-center space-x-3 shadow-2xl shadow-stone-300 hover:bg-stone-800 transition-all active:scale-95 group"
              >
                <Plus size={18} />
                <span className="uppercase tracking-widest text-xs">Architect New Rule</span>
              </button>
            </header>
            
            <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-stone-100">
                 <div className="p-6 border-b border-stone-100 flex justify-between items-center">
                    <h3 className="font-bold text-lg">Existing Rules</h3>
                 </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="bg-stone-50 border-b border-stone-100 uppercase text-[10px] font-black text-stone-500 tracking-wider">
                        <th className="p-4">Status</th>
                        <th className="p-4">Title</th>
                        <th className="p-4">Type</th>
                        <th className="p-4">Target</th>
                        <th className="p-4">Condition</th>
                        <th className="p-4">Reward</th>
                        <th className="p-4">Value</th>
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
                          <td className="p-4 font-bold max-w-[200px] truncate">{rule.title}</td>
                          <td className="p-4 uppercase text-[10px] font-black text-stone-500 tracking-widest">{rule.type}</td>
                          <td className="p-4">
                            <span className="bg-stone-100 px-2 py-1 rounded text-xs font-bold text-stone-600">
                              {rule.target_type === 'all' ? 'Entire Store' : `${rule.target_type}: ${rule.target_id}`}
                            </span>
                          </td>
                          <td className="p-4 font-bold">{rule.condition_qty || 0}</td>
                          <td className="p-4 font-bold">{rule.reward_qty || 0}</td>
                          <td className="p-4 font-bold text-emerald-600">
                            {rule.type === 'percentage' ? `${rule.discount_value}%` : `₹${rule.discount_value || 0}`}
                          </td>
                          <td className="p-4 text-right">
                             <div className="flex justify-end space-x-2">
                               <button 
                                 onClick={() => {
                                    setNewPromotionRuleData({ title: rule.title, type: rule.type, target_type: rule.target_type, target_id: rule.target_id, condition_qty: rule.condition_qty, reward_qty: rule.reward_qty, discount_value: rule.discount_value, active: rule.active });
                                    setPromotionRuleFormModal({ open: true, mode: 'edit', rule });
                                 }}
                                 className="text-primary hover:text-primary/80 font-bold"
                               >Edit</button>
                               <button 
                                 onClick={() => handleDeleteRule(rule.id)}
                                 className="text-red-500 hover:text-red-700 font-bold"
                               >Delete</button>
                             </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
            </div>
          </div>
        )}

        {activeTab === 'Data Exports' && (
          <DataExportsView />
        )}

        {activeTab === 'Security & Data' && (
          <section className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <AdminStatCard label="Security Node" value="ACTIVE" icon={<ShieldCheck size={22} />} color="emerald" trend={{ value: 'Protocol Live', isUp: true }} progress={100} />
              <AdminStatCard label="Data Encryption" value="256-BIT" icon={<Fingerprint size={22} />} color="purple" trend={{ value: 'AES/GCM', isUp: true }} progress={100} />
              <AdminStatCard label="Audit Coverage" value="100%" icon={<Database size={22} />} color="stone" trend={{ value: 'Infinite Sync', isUp: true }} progress={100} />
            </div>
            
            <div className="bg-white p-10 rounded-[3rem] border border-stone-100 shadow-sm">
               <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-12">
                  <div className="flex items-center space-x-6">
                    <div className="w-16 h-16 bg-stone-900 text-white rounded-[1.5rem] flex items-center justify-center shadow-xl shadow-stone-200">
                       <Shield size={28} />
                    </div>
                    <div>
                       <h3 className="text-3xl font-black text-stone-900 tracking-tight leading-none uppercase italic">Security & Data Governance</h3>
                       <p className="text-[10px] font-black text-stone-400 uppercase tracking-[0.25em] mt-3">Active Privacy & Operational Integrity Policy</p>
                    </div>
                  </div>
                  <div className="flex bg-stone-50 p-2 rounded-2xl border border-stone-100 items-center space-x-4">
                     <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse ml-2" />
                     <span className="text-[10px] font-black text-stone-600 uppercase tracking-widest pr-4">Identity Node: {user?.id?.slice(0, 8)}</span>
                  </div>
               </div>
               
               <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                  <div className="space-y-8">
                     <h4 className="text-[10px] font-black text-stone-300 uppercase tracking-[0.25em] px-2 flex items-center gap-2">
                        <ToggleLeft size={14} className="text-stone-300" />
                        Access & Privacy Controls
                     </h4>
                     <div className="space-y-4">
                        {[
                          { label: 'Mask Phone Numbers', desc: 'Securely conceal user contact details in non-critical administrative views', active: true, icon: Smartphone },
                          { label: 'Data Encryption', desc: 'Automatic AES-256 serialization of all PII (Personally Identifiable Information)', active: true, icon: Server },
                          { label: 'Real-time Audit Trace', desc: 'Immutable logging of every administrative transaction and data mutation', active: true, icon: History },
                          { label: 'Session Rotation', desc: 'Automated 24h refresh cycle for all active administrative tokens', active: false, icon: RotateCcw }
                        ].map((item, i) => (
                          <div key={i} className="flex items-center justify-between p-8 bg-stone-50 rounded-[2.5rem] border border-stone-100 group hover:border-primary/20 transition-all">
                             <div className="flex items-start space-x-6 flex-1 pr-8">
                                <div className="p-3 bg-white rounded-2xl text-stone-400 group-hover:text-primary transition-colors shadow-sm">
                                   <item.icon size={20} />
                                </div>
                                <div>
                                   <p className="text-base font-black text-stone-900 tracking-tight leading-none mb-1.5">{item.label}</p>
                                   <p className="text-[11px] text-stone-400 font-bold leading-relaxed">{item.desc}</p>
                                </div>
                             </div>
                             <button className={cn(
                               "w-14 h-8 rounded-full relative transition-all duration-500 shadow-inner",
                               item.active ? "bg-emerald-500 shadow-emerald-200" : "bg-stone-200"
                             )}>
                                <div className={cn(
                                  "absolute top-1 w-6 h-6 bg-white rounded-full transition-all duration-500 shadow-md",
                                  item.active ? "right-1" : "left-1"
                                )} />
                             </button>
                          </div>
                        ))}
                     </div>
                  </div>
                  
                  <div className="space-y-8">
                     <h4 className="text-[10px] font-black text-stone-300 uppercase tracking-[0.25em] px-2 flex items-center gap-2">
                        <Database size={14} className="text-stone-300" />
                        Infrastructure Health Trace
                     </h4>
                     <div className="bg-stone-900 rounded-[3rem] p-10 text-white space-y-10 relative overflow-hidden shadow-2xl">
                        <div className="absolute top-0 right-0 p-12 opacity-[0.03] rotate-12">
                           <Database size={180} />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-8 relative z-10">
                           <div className="space-y-2">
                              <p className="text-[10px] font-black uppercase tracking-[0.4em] opacity-40">Identity Nodes</p>
                              <div className="flex items-end space-x-2">
                                 <p className="text-4xl font-black tracking-tighter italic leading-none">2,841</p>
                                 <span className="text-[10px] text-emerald-400 font-black mb-1">+4.2%</span>
                              </div>
                           </div>
                           <div className="space-y-2">
                              <p className="text-[10px] font-black uppercase tracking-[0.4em] opacity-40">Link Stability</p>
                              <div className="flex items-end space-x-2">
                                 <p className="text-4xl font-black tracking-tighter italic leading-none">99.8%</p>
                                 <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse mb-2" />
                              </div>
                           </div>
                        </div>

                        <div className="space-y-4 relative z-10 pt-4">
                           <div className="flex justify-between items-end mb-2">
                             <p className="text-[10px] font-black uppercase tracking-[0.4em] opacity-40 leading-none">Database Payload: 4.2GB / 50GB</p>
                             <p className="text-xs font-black italic">8.4% Capacity</p>
                           </div>
                           <div className="h-2 bg-white/5 rounded-full overflow-hidden border border-white/5">
                              <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: '8.4%' }}
                                transition={{ duration: 1.5, ease: "easeOut" }}
                                className="h-full bg-primary shadow-[0_0_15px_rgba(251,191,36,0.3)]" 
                              />
                           </div>
                        </div>

                        <div className="bg-white/5 rounded-[2rem] p-6 space-y-4 relative z-10 border border-white/5 backdrop-blur-sm">
                           <h5 className="text-[10px] font-black uppercase tracking-[0.3em] opacity-50 mb-2">Active Protocols</h5>
                           <div className="space-y-3">
                              {[
                                { label: 'Automated Redundancy', status: 'Healthy', color: 'text-emerald-400' },
                                { label: 'Deep Packet Inspection', status: 'Running', color: 'text-primary' },
                                { label: 'Cross-Region Replication', status: 'Synchronized', color: 'text-emerald-400' }
                              ].map((p, i) => (
                                <div key={i} className="flex justify-between items-center text-xs font-bold py-1">
                                   <span className="opacity-70">{p.label}</span>
                                   <span className={cn("text-[10px] font-black uppercase tracking-widest", p.color)}>{p.status}</span>
                                </div>
                              ))}
                           </div>
                        </div>
                     </div>
                  </div>
               </div>
            </div>

            <div className="bg-white p-10 rounded-[3rem] border border-stone-100 shadow-sm mt-8">
               <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
                  <div>
                     <h3 className="text-2xl font-black text-stone-900 tracking-tight flex items-center gap-2">
                        <Wallet size={24} className="text-primary" /> Wallet Ledger Audit & Integrity Scan
                     </h3>
                     <p className="text-xs text-stone-500 font-medium mt-1">Cross-reference the latest 50 wallet_transactions with user.wallet_balance to flag mismatch anomalies.</p>
                  </div>
                  <button 
                     onClick={runWalletDiagnostics}
                     disabled={loadingDiagnostics}
                     className="px-6 py-3 bg-stone-900 text-white text-xs font-black uppercase tracking-widest rounded-2xl hover:bg-stone-800 transition-all active:scale-95 disabled:bg-stone-300 disabled:scale-100 flex items-center gap-2 cursor-pointer animate-in fade-in duration-300"
                  >
                     {loadingDiagnostics ? (
                        <>
                           <Loader2 size={14} className="animate-spin" /> Auditing Ledger...
                        </>
                     ) : (
                        <>
                           <RefreshCw size={14} /> Run Dynamic Integrity Scan
                        </>
                     )}
                  </button>
               </div>

               {diagnosticResults && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                     <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-stone-50 p-6 rounded-2xl border border-stone-100">
                           <p className="text-[10px] font-black text-stone-400 uppercase tracking-wider mb-1">Time Executed</p>
                           <p className="text-sm font-bold text-stone-800">{new Date(diagnosticResults.checkedAt).toLocaleTimeString()}</p>
                        </div>
                        <div className="bg-stone-50 p-6 rounded-2xl border border-stone-100">
                           <p className="text-[10px] font-black text-stone-400 uppercase tracking-wider mb-1">Transactions Verified</p>
                           <p className="text-xl font-black text-stone-900">{diagnosticResults.totalTransactionsChecked}</p>
                        </div>
                        <div className="bg-stone-50 p-6 rounded-2xl border border-stone-100">
                           <p className="text-[10px] font-black text-stone-400 uppercase tracking-wider mb-1">Unique Users Checked</p>
                           <p className="text-xl font-black text-stone-900">{diagnosticResults.uniqueUsersCheckedCount}</p>
                        </div>
                        <div className="bg-stone-50 p-6 rounded-2xl border border-stone-100">
                           <p className="text-[10px] font-black text-stone-400 uppercase tracking-wider mb-1">Inconsistencies</p>
                           <p className={cn("text-xl font-black", diagnosticResults.inconsistenciesFoundCount > 0 ? "text-red-500 animate-pulse" : "text-emerald-500")}>
                              {diagnosticResults.inconsistenciesFoundCount}
                           </p>
                        </div>
                     </div>

                     {diagnosticResults.inconsistencies && diagnosticResults.inconsistencies.length > 0 ? (
                        <div className="bg-red-50/50 rounded-2xl p-6 border border-red-100 space-y-3">
                           <h4 className="text-xs font-black text-red-800 uppercase tracking-wider flex items-center gap-1">
                              <AlertCircle size={14} /> Anomaly Forensics Log
                           </h4>
                           <div className="space-y-2">
                              {diagnosticResults.inconsistencies.map((inc: string, idx: number) => (
                                 <div key={idx} className="text-xs text-red-900 font-medium py-2 px-4 bg-white rounded-xl border border-red-50/50 shadow-sm flex items-center gap-3">
                                    <div className="w-2.5 h-2.5 rounded-full bg-red-500 shrink-0" />
                                    <span>{inc}</span>
                                 </div>
                              ))}
                           </div>
                        </div>
                     ) : (
                        <div className="bg-emerald-50/50 rounded-2xl p-6 border border-emerald-100 flex items-center gap-3 text-xs text-emerald-800 font-black uppercase tracking-wider">
                           <CheckCircle2 size={16} className="text-emerald-500 shrink-0" /> Integrity Confirmed: No ledger/balance discrepancies found in latest transaction nodes.
                        </div>
                     )}

                     {/* Audited Users Detailed Interactive Table */}
                     {diagnosticResults.users && diagnosticResults.users.length > 0 && (
                        <div className="space-y-4">
                           <h4 className="text-sm font-black text-stone-900 uppercase tracking-wider flex items-center gap-2">
                              <Database size={16} className="text-[#6366f1]" /> Detailed Audited Users Ledger
                           </h4>
                           <div className="bg-white rounded-3xl border border-stone-200/60 overflow-hidden shadow-sm">
                              <div className="overflow-x-auto no-scrollbar">
                                 <table className="w-full text-left text-xs">
                                    <thead className="bg-stone-50 border-b border-stone-100 text-[10px] text-stone-400 uppercase font-black tracking-widest">
                                       <tr>
                                          <th className="px-6 py-4">User Details</th>
                                          <th className="px-6 py-4">Current Balance</th>
                                          <th className="px-6 py-4">Calculated Ledger</th>
                                          <th className="px-6 py-4">Discrepancy Amount</th>
                                          <th className="px-6 py-4">Audit Verdict</th>
                                          <th className="px-6 py-4 text-right">Verification & Correction</th>
                                       </tr>
                                    </thead>
                                    <tbody className="divide-y divide-stone-100 font-semibold text-stone-600">
                                       {diagnosticResults.users.map((audUser: any) => (
                                          <tr key={audUser.userId} className="hover:bg-stone-50/40 transition-colors">
                                             <td className="px-6 py-4">
                                                <div>
                                                   <p className="font-extrabold text-stone-800">{audUser.name}</p>
                                                   <p className="text-[10px] text-stone-400 font-mono">ID: {audUser.userId} | {audUser.email}</p>
                                                </div>
                                             </td>
                                             <td className="px-6 py-4 font-bold text-stone-700">₹{audUser.currentBalance.toFixed(2)}</td>
                                             <td className="px-6 py-4 font-bold text-stone-700">₹{audUser.calculatedBalance.toFixed(2)}</td>
                                             <td className={`px-6 py-4 font-black ${audUser.discrepancy !== 0 ? "text-red-600" : "text-emerald-600"}`}>
                                                {audUser.discrepancy !== 0 ? `₹${audUser.discrepancy.toFixed(2)}` : '₹0.00'}
                                             </td>
                                             <td className="px-6 py-4">
                                                <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider flex items-center gap-1.5 w-fit ${
                                                   audUser.hasDiscrepancy 
                                                      ? "bg-red-50 text-red-600 border border-red-100 animate-pulse" 
                                                      : "bg-emerald-50 text-emerald-600 border border-emerald-100"
                                                }`}>
                                                   <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${audUser.hasDiscrepancy ? "bg-red-500" : "bg-emerald-500"}`} />
                                                   {audUser.hasDiscrepancy ? 'Action Required' : 'Status Stable'}
                                                </span>
                                             </td>
                                             <td className="px-6 py-4 text-right">
                                                {audUser.hasDiscrepancy ? (
                                                   <button
                                                      onClick={() => fixWalletDiscrepancy(audUser.userId)}
                                                      disabled={fixingWalletUserId === audUser.userId}
                                                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-[10px] uppercase tracking-widest rounded-xl transition-all disabled:bg-stone-300 flex items-center gap-1.5 ml-auto cursor-pointer"
                                                   >
                                                      {fixingWalletUserId === audUser.userId ? (
                                                         <>
                                                            <Loader2 size={12} className="animate-spin" /> Fixing...
                                                         </>
                                                      ) : (
                                                         <>
                                                            <RefreshCw size={12} /> Fix Discrepancy
                                                         </>
                                                      )}
                                                   </button>
                                                ) : (
                                                   <span className="text-[10px] text-stone-400 font-bold uppercase tracking-wider select-none">Passed Audit</span>
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
                  </div>
               )}
            </div>
          </section>
        )}

        {activeTab === 'Purchase Orders' && (
          <PurchaseOrdersTab />
        )}

        {activeTab === 'Automatic Reports' && (
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
              <div className="responsive-table-container no-scrollbar">
                <table className="w-full text-left">
                  <thead className="bg-stone-50/50 text-stone-400 text-[10px] uppercase font-black tracking-[0.25em]">
                    <tr>
                      <th className="px-10 py-8">ID / Reporter</th>
                      <th className="px-6 py-8">Scope & Context</th>
                      <th className="px-6 py-8">Error Details</th>
                      <th className="px-6 py-8">Device Context</th>
                      <th className="px-6 py-8">Timestamp</th>
                      <th className="px-10 py-8 text-right">Actions</th>
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
                           <div className="flex flex-col">
                              <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest leading-none">ERR-{bug.id.toString().slice(-6)}</span>
                              <span className="text-xs font-black text-stone-800 tracking-tight mt-1 truncate max-w-[120px]">{bug.reporter_name || 'System Node'}</span>
                              <span className="text-[9px] font-bold text-stone-300 uppercase tracking-widest mt-1">UID: {bug.user_id ? bug.user_id.slice(0, 8) : 'GUEST'}</span>
                           </div>
                        </td>
                        <td className="px-6 py-6">
                          <div className="flex flex-col space-y-1">
                             <div className="flex items-center space-x-2">
                               <div className={cn("w-2 h-2 rounded-full animate-pulse", bug.type === 'API_ERROR' ? 'bg-orange-500' : 'bg-red-500')} />
                               <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest">{bug.type || 'REPORTER'}</span>
                             </div>
                             <span className="text-[11px] font-black text-stone-800 uppercase tracking-tighter truncate max-w-[150px]" title={bug.path}>{bug.path || 'System Core'}</span>
                             {bug.api_endpoint && <span className="text-[9px] text-stone-400 truncate max-w-[150px] italic">{bug.api_endpoint}</span>}
                          </div>
                        </td>
                        <td className="px-6 py-6">
                           <div className="max-w-[300px] space-y-1">
                             <p className="text-xs font-bold text-red-600 line-clamp-1" title={bug.message}>{bug.message}</p>
                             <p className="text-[10px] text-stone-400 font-medium leading-relaxed line-clamp-2 italic">{bug.why || 'No root cause identified.'}</p>
                           </div>
                        </td>
                        <td className="px-6 py-6">
                           <div className="flex flex-col space-y-1">
                             <span className="text-[10px] font-bold text-stone-500 uppercase tracking-widest truncate max-w-[150px]" title={bug.device_info}>{bug.device_info || 'Unknown Device'}</span>
                             <span className="text-[9px] text-stone-400">{bug.screen_resolution || 'Unknown Res'}</span>
                             {bug.network_status && <span className="text-[9px] text-emerald-500 font-black uppercase tracking-tighter">{bug.network_status}</span>}
                           </div>
                        </td>
                        <td className="px-6 py-6">
                           <div className="flex flex-col space-y-1 font-sans">
                             <span className="text-[10px] font-black text-stone-600 uppercase tracking-[0.2em]">{new Date(bug.created_at).toLocaleDateString()}</span>
                             <span className="text-[9px] font-bold text-stone-300 italic">{new Date(bug.created_at).toLocaleTimeString()}</span>
                           </div>
                        </td>
                        <td className="px-10 py-6 text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <button 
                              onClick={() => {
                                setReportDetailModal({ open: true, report: bug });
                              }}
                              className="w-10 h-10 bg-white border border-stone-100 rounded-xl flex items-center justify-center text-stone-400 hover:text-primary transition-all shadow-sm"
                              title="Review Cipher"
                            >
                              <Eye size={16} />
                            </button>
                            <button 
                              onClick={async () => {
                                try {
                                  await fetchWithHandling(`/api/bugs/report/${bug.id}`, { method: 'DELETE', headers: getAuthHeaders() });
                                  setBugReports(bugReports.filter((b: any) => b.id !== bug.id));
                                  toast.success('Report Cleared');
                                } catch (err) {}
                              }}
                              className="w-10 h-10 bg-white border border-stone-100 rounded-xl flex items-center justify-center text-stone-400 hover:text-red-500 transition-all shadow-sm"
                              title="Purge Entry"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
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
          <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
             <header className="flex flex-col md:flex-row md:items-end justify-between gap-8">
              <div>
                <h2 className="text-4xl font-black text-stone-900 tracking-tight">System Infrastructure</h2>
                <p className="text-stone-500 mt-2 text-lg font-medium">Real-time telemetry, error matrix, and environment health monitoring.</p>
              </div>
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => generateSystemHealthReportPDF(systemHealth, errorLogs)}
                  className="bg-white border border-stone-100 p-5 rounded-3xl shadow-sm hover:bg-stone-50 transition-all flex items-center space-x-3 group"
                >
                  <Download size={20} className="text-stone-400 group-hover:text-primary" />
                  <span className="text-xs font-black uppercase tracking-widest">Health Audit</span>
                </button>
                <div className="flex bg-white px-8 py-5 rounded-3xl border border-stone-100 shadow-sm items-center space-x-8">
                  <div className="flex flex-col">
                    <span className="text-xs font-black text-stone-400 uppercase tracking-widest leading-none mb-1">Uptime</span>
                    <span className="text-xl font-black text-stone-900">{systemHealth ? `${Math.floor(systemHealth.uptime / 3600)}h ${Math.floor((systemHealth.uptime % 3600) / 60)}m` : '0h 0m'}</span>
                  </div>
                  <div className="w-px h-10 bg-stone-100" />
                  <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-xs font-black text-emerald-600 uppercase tracking-widest">Active Node</span>
                  </div>
                </div>
              </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <AdminStatCard 
                  label="DB Latency" 
                  value={systemHealth?.latency || '2ms'} 
                  icon={<Database size={22} />} 
                  trend={{ value: 'Healthy', isUp: true }} 
                  color="emerald" 
                  progress={98}
                />
                <AdminStatCard 
                  label="Active Sessions" 
                  value={systemHealth?.metrics?.activeUsers || 0} 
                  icon={<Activity size={22} />} 
                  trend={{ value: 'Stable', isUp: true, color: 'text-blue-500' }} 
                  color="blue" 
                  progress={60}
                />
                <AdminStatCard 
                  label="Uncaught Anomalies" 
                  value={systemHealth?.metrics?.recentErrors || 0} 
                  icon={<ShieldAlert size={22} />} 
                  trend={{ 
                    value: systemHealth?.metrics?.recentErrors > 0 ? 'Review Needed' : 'Nominal', 
                    isUp: systemHealth?.metrics?.recentErrors === 0 
                  }} 
                  color={systemHealth?.metrics?.recentErrors > 0 ? "red" : "stone"} 
                  progress={systemHealth?.metrics?.recentErrors > 0 ? 90 : 10}
                />
                <AdminStatCard 
                  label="Node Payload" 
                  value={systemHealth?.memory || '120MB / 512MB'} 
                  icon={<Cpu size={22} />} 
                  trend={{ value: 'Low Load', isUp: true, color: 'text-purple-500' }} 
                  color="purple" 
                  progress={25}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
               <div className="lg:col-span-2 space-y-6">
                  <div className="flex items-center justify-between px-2">
                     <h3 className="text-xl font-black text-stone-900 uppercase tracking-tight">Kernel Events</h3>
                     <button 
                       onClick={fetchSystemLogs}
                       className="p-3 bg-white border border-stone-100 rounded-2xl hover:bg-stone-50 transition-all shadow-sm"
                     >
                       <RefreshCw size={20} className={cn("text-stone-400", isRefreshingLogs && "animate-spin")} />
                     </button>
                  </div>
                  <div className="bg-stone-950 rounded-[2.5rem] p-8 shadow-2xl border border-stone-800 relative overflow-hidden">
                     <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary/20 via-primary/5 to-transparent" />
                     <div className="space-y-4 font-mono text-[11px] max-h-[600px] overflow-y-auto no-scrollbar scroll-smooth">
                        {systemLogs.map((log, i) => (
                          <div key={i} className="flex space-x-6 group opacity-80 hover:opacity-100 transition-opacity">
                            <span className="text-stone-600 shrink-0 font-bold">[{new Date(log.created_at).toLocaleTimeString()}]</span>
                            <div className="flex flex-col space-y-1 w-full">
                               <div className="flex items-center space-x-3">
                                 <span className={cn(
                                   "font-black uppercase tracking-widest",
                                   log.type === 'error' ? "text-red-500" : 
                                   log.type === 'warn' ? "text-amber-500" : 
                                   log.type === 'info' ? "text-emerald-500" : "text-blue-500"
                                 )}>
                                   {log.type}
                                 </span>
                                 <span className="text-stone-300 font-bold leading-relaxed">{log.message}</span>
                               </div>
                               {log.details && (
                                 <p className="text-stone-500 text-[10px] pl-0 break-all leading-relaxed bg-white/5 p-3 rounded-xl mt-2 border border-white/5">{log.details}</p>
                               )}
                            </div>
                          </div>
                        ))}
                        {systemLogs.length === 0 && (
                          <div className="py-20 text-center text-stone-600 font-black uppercase tracking-[0.3em]">No Kernel Activity Recorded</div>
                        )}
                     </div>
                  </div>
               </div>

                  {/* Real-Time Exception Feed (onSnapshot Firestore Feed) */}
                  <div className="lg:col-span-2 space-y-6">
                     <div className="flex items-center justify-between px-2">
                        <div className="flex items-center space-x-3">
                           <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse shadow-sm shadow-red-200" />
                           <h3 className="text-xl font-black text-stone-900 uppercase tracking-tight">Real-Time Exception Feed</h3>
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-red-500 bg-red-50 px-3 py-1 rounded-full animate-pulse">
                           Live Firestore Stream
                        </span>
                     </div>
                     <div className="bg-stone-950 rounded-[2.5rem] p-8 shadow-2xl border border-stone-800 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-red-500/20 via-red-500/5 to-transparent" />
                        <div className="space-y-4 font-mono text-[11px] max-h-[600px] overflow-y-auto no-scrollbar scroll-smooth">
                           {errorLogs.map((log: any, i: number) => {
                             const dateVal = log.timestamp?.seconds 
                               ? new Date(log.timestamp.seconds * 1000)
                               : new Date(log.timestamp || Date.now());
                             return (
                               <div key={log.id || i} className="flex space-x-6 group opacity-90 hover:opacity-100 transition-opacity border-b border-stone-900/40 pb-4 last:border-0 last:pb-0 text-left">
                                 <span className="text-red-500 shrink-0 font-bold">[{dateVal.toLocaleTimeString()}]</span>
                                 <div className="flex flex-col space-y-1 w-full text-left">
                                    <div className="flex items-center justify-between">
                                       <span className="text-amber-400 font-black tracking-widest uppercase text-[9px] bg-amber-400/5 px-2 py-0.5 rounded border border-amber-400/10">Context: {log.context || 'Global / Sandbox'}</span>
                                       <span className="text-stone-500 text-[9px] font-bold">User: {log.userId || 'anonymous'}</span>
                                    </div>
                                    <p className="text-stone-300 font-bold leading-relaxed whitespace-pre-wrap break-all">{log.error}</p>
                                    {log.url && (
                                       <p className="text-stone-500 text-[9px] truncate">URL: {log.url}</p>
                                    )}
                                 </div>
                               </div>
                             );
                           })}
                           {errorLogs.length === 0 && (
                             <div className="py-20 text-center text-stone-600 font-black uppercase tracking-[0.3em]">No Exception Events Broadcasted</div>
                           )}
                        </div>
                     </div>
                  </div>

               <div className="space-y-8">
                  <div className="bg-white p-8 rounded-[2.5rem] border border-stone-100 shadow-sm space-y-6">
                     <h3 className="text-lg font-black text-stone-900 uppercase tracking-tight">Security Matrix</h3>
                     <div className="space-y-6">
                        {[
                          { label: 'HTTPS Governance', active: true },
                          { label: 'XSS Sanitization', active: true },
                          { label: 'CSRF Shield', active: true },
                          { label: 'Rate Limit Node', active: true },
                          { label: 'Audit Logging', active: true },
                        ].map((s, i) => (
                          <div key={i} className="flex items-center justify-between">
                            <span className="text-xs font-bold text-stone-500">{s.label}</span>
                            <div className="w-10 h-5 bg-emerald-500/20 rounded-full flex items-center px-1">
                               <div className="w-3.5 h-3.5 bg-emerald-500 rounded-full" />
                            </div>
                          </div>
                        ))}
                     </div>
                  </div>

                  <div className="bg-stone-900 p-8 rounded-[2.5rem] shadow-xl text-white space-y-6">
                     <div className="flex items-center space-x-3">
                        <div className="p-3 bg-white/10 rounded-2xl"><Zap size={20} /></div>
                        <h3 className="text-lg font-black uppercase tracking-tight">Live Throughput</h3>
                     </div>
                     <div className="space-y-4">
                        <div className="flex justify-between items-end">
                           <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Active Requests</span>
                           <span className="text-2xl font-black">{systemHealth?.metrics?.activeUsers || 0}s/m</span>
                        </div>
                        <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                           <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(100, (systemHealth?.metrics?.activeUsers || 0) * 10)}%` }}
                            className="h-full bg-primary" 
                           />
                        </div>
                        <p className="text-[9px] text-stone-500 leading-relaxed font-bold">Requests are within optimal threshold. System is experiencing nominal traffic volume.</p>
                     </div>
                  </div>
               </div>
            </div>
          </div>
        )}
        </motion.div>
      </AnimatePresence>
    </div>

      <ModalContainer
        isOpen={walletModal.open}
        onClose={() => setWalletModal({ open: false, userId: null })}
        title="Update Wallet"
        size="sm"
      >
        <div className="p-8 pb-10 space-y-6">
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
        </div>
      </ModalContainer>

      {/* Bulk Discount Modal */}
      <ModalContainer
        isOpen={bulkDiscountModal.open}
        onClose={() => setBulkDiscountModal({ open: false, mode: 'add', discount: null })}
        title={bulkDiscountModal.mode === 'add' ? 'Create Bulk Discount' : 'Edit Bulk Discount'}
        size="md"
      >
        <div className="p-8 pb-10">
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
        </div>
      </ModalContainer>

      {/* Coupon Modal */}
      <ModalContainer
        isOpen={couponModal.open}
        onClose={() => setCouponModal({ open: false })}
        title={couponModal.mode === 'edit' ? 'Update Coupon' : 'Create Coupon'}
        size="md"
      >
        <div className="p-8 pb-10">
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
                <label className="block text-sm font-bold text-stone-700 mb-2">Limit Per User</label>
                <input 
                  type="number" 
                  required
                  className="input-field"
                  value={newCoupon.limit_per_user}
                  onChange={(e) => setNewCoupon({...newCoupon, limit_per_user: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-stone-700 mb-2">Expiry Date</label>
                <input 
                  type="date" 
                  className="input-field"
                  value={(newCoupon as any).expiry_date || ''}
                  onChange={(e) => setNewCoupon({...newCoupon, expiry_date: e.target.value} as any)}
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
        </div>
      </ModalContainer>

      {/* Expense Modal */}
      <ModalContainer
        isOpen={expenseModal.open}
        onClose={() => setExpenseModal({ open: false })}
        title="Add Expense"
        size="md"
      >
        <div className="p-8 pb-10">
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
        </div>
      </ModalContainer>
      {/* Product Modal */}
      <ModalContainer
        isOpen={productModal.open}
        onClose={() => setProductModal({ open: false, mode: 'add' })}
        title={productModal.mode === 'add' ? 'Add New Product' : 'Edit Product'}
        size="md"
      >
        <div className="p-8 pb-10">
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
                <div>
                  <label className="block text-sm font-bold text-stone-700 mb-2">Unit</label>
                  <select 
                    className="input-field"
                    value={(newProduct as any).unit || 'kg'}
                    onChange={(e) => setNewProduct({...newProduct, unit: e.target.value} as any)}
                  >
                    <option value="kg">kilogram (kg)</option>
                    <option value="gm">gram (gm)</option>
                    <option value="ltr">liter (ltr)</option>
                    <option value="ml">milliliter (ml)</option>
                    <option value="pcs">pieces (pcs)</option>
                    <option value="pkt">packet (pkt)</option>
                    <option value="dozen">dozen</option>
                    <option value="bunch">bunch</option>
                  </select>
                </div>
                <div className="md:col-span-2 flex items-center space-x-3 bg-stone-50 p-4 rounded-2xl border border-stone-100">
                  <input 
                    type="checkbox"
                    id="is_subscribable"
                    className="w-5 h-5 rounded-lg border-stone-300 text-primary focus:ring-primary"
                    checked={(newProduct as any).is_subscribable}
                    onChange={(e) => setNewProduct({...newProduct, is_subscribable: e.target.checked} as any)}
                  />
                  <label htmlFor="is_subscribable" className="text-sm font-bold text-stone-700">Enable Subscription (Daily/Weekly delivery)</label>
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
                  disabled={isSubmittingProduct}
                  className="flex-1 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  {isSubmittingProduct && <Loader2 size={18} className="animate-spin" />}
                  <span>{productModal.mode === 'add' ? 'Add Product' : 'Update Product'}</span>
                </button>
              </div>
            </form>
          </div>
        </ModalContainer>
      {/* Purchase / Stock Entry Modal */}
      <ModalContainer
        isOpen={stockEntryModal.open}
        onClose={() => setStockEntryModal({ open: false, product: null })}
        title="New Stock Entry"
        size="md"
      >
        <div className="p-8 pb-10">
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
          </div>
        </ModalContainer>

      {/* Image Management Modal */}
      <ModalContainer
        isOpen={imageModal.open}
        onClose={() => setImageModal({ ...imageModal, open: false })}
        title="Manage Product Images"
        size="lg"
      >
        <div className="p-8 pb-10 flex flex-col max-h-[80vh] overflow-hidden">
          <p className="text-stone-500 text-sm mb-6">Upload, reorder, and set main image</p>

          <div className="flex-1 overflow-y-auto pr-2 no-scrollbar">
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
        </div>
      </ModalContainer>

      {/* Category Batch Update Modal */}
      <ModalContainer
        isOpen={categoryBatchModal.open}
        onClose={() => {
          setCategoryBatchModal({ open: false });
          setNewBatchCategory('');
        }}
        title="Change Category"
        size="sm"
      >
        <div className="p-8 pb-10">
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
        </div>
      </ModalContainer>

      {/* Wallet History Modal */}
      <ModalContainer
        isOpen={walletHistoryModal.open}
        onClose={() => setWalletHistoryModal({ ...walletHistoryModal, open: false })}
        title="Transaction History"
        size="lg"
      >
        <div className="p-8 pb-10 flex flex-col max-h-[70vh]">
          <div className="flex-1 overflow-y-auto pr-2 no-scrollbar">
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
        </div>
      </ModalContainer>

      {/* Supplier Modal */}
      <ModalContainer
        isOpen={supplierModal.open}
        onClose={() => setSupplierModal({ open: false, mode: 'add', supplier: null })}
        title={supplierModal.mode === 'add' ? 'Add Supplier' : 'Edit Supplier'}
        size="md"
      >
        <div className="p-8 pb-10">
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
        </div>
      </ModalContainer>

      {/* Promotion Rule Modal */}
      <ModalContainer
        isOpen={promotionRuleFormModal.open}
        onClose={() => setPromotionRuleFormModal({ open: false, mode: 'add', rule: null })}
        title={promotionRuleFormModal.mode === 'add' ? 'Create Target Rule' : 'Edit Target Rule'}
        size="md"
      >
        <div className="p-8 pb-10">
          <form onSubmit={handlePromotionRuleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-stone-700 mb-2">Rule Title</label>
                <input 
                  type="text" 
                  required
                  className="input-field"
                  value={newPromotionRuleData.title}
                  onChange={(e) => setNewPromotionRuleData({...newPromotionRuleData, title: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-stone-700 mb-2">Discount Type</label>
                  <select 
                    className="input-field"
                    value={newPromotionRuleData.type}
                    onChange={(e) => setNewPromotionRuleData({...newPromotionRuleData, type: e.target.value})}
                  >
                    <option value="percentage">Percentage OFF</option>
                    <option value="fixed">Fixed Amount OFF</option>
                    <option value="bogo">Buy X Get Y (BOGO)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-stone-700 mb-2">Discount Value {newPromotionRuleData.type === 'bogo' && '(Y)'}</label>
                  <input 
                    type="number" 
                    required
                    min="1"
                    className="input-field"
                    value={newPromotionRuleData.discount_value}
                    onChange={(e) => setNewPromotionRuleData({...newPromotionRuleData, discount_value: parseFloat(e.target.value)})}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div>
                  <label className="block text-sm font-bold text-stone-700 mb-2">Target Scope</label>
                  <select 
                    className="input-field"
                    value={newPromotionRuleData.target_type}
                    onChange={(e) => setNewPromotionRuleData({...newPromotionRuleData, target_type: e.target.value})}
                  >
                    <option value="all">Entire Store</option>
                    <option value="category">Specific Category</option>
                    <option value="product">Specific Product</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-stone-700 mb-2">Required Qty {newPromotionRuleData.type === 'bogo' && '(X)'}</label>
                  <input 
                    type="number" 
                    required
                    min="1"
                    className="input-field"
                    value={newPromotionRuleData.condition_qty}
                    onChange={(e) => setNewPromotionRuleData({...newPromotionRuleData, condition_qty: parseInt(e.target.value)})}
                  />
                </div>
              </div>
              
              {newPromotionRuleData.target_type !== 'all' && (
                <div>
                  <label className="block text-sm font-bold text-stone-700 mb-2">Target Name / ID</label>
                  <input 
                    type="text" 
                    required
                    placeholder={newPromotionRuleData.target_type === 'category' ? "e.g., Electronics" : "Product ID (e.g., 12)"}
                    className="input-field"
                    value={newPromotionRuleData.target_id}
                    onChange={(e) => setNewPromotionRuleData({...newPromotionRuleData, target_id: e.target.value})}
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                 <div>
                  <label className="block text-sm font-bold text-stone-700 mb-2">Start Date</label>
                  <input 
                    type="date"
                    className="input-field"
                    value={newPromotionRuleData.start_date || ''}
                    onChange={(e) => setNewPromotionRuleData({...newPromotionRuleData, start_date: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-stone-700 mb-2">End Date</label>
                  <input 
                    type="date"
                    className="input-field"
                    value={newPromotionRuleData.end_date || ''}
                    onChange={(e) => setNewPromotionRuleData({...newPromotionRuleData, end_date: e.target.value})}
                  />
                </div>
              </div>

              <div className="flex items-center space-x-3 p-4 bg-stone-50 rounded-2xl">
                <input 
                  type="checkbox" 
                  id="promorule_active"
                  className="w-5 h-5 rounded border-stone-300 text-primary focus:ring-primary"
                  checked={newPromotionRuleData.active}
                  onChange={(e) => setNewPromotionRuleData({...newPromotionRuleData, active: e.target.checked})}
                />
                <label htmlFor="promorule_active" className="text-sm font-bold text-stone-700">Active</label>
              </div>
              <div className="flex space-x-3 pt-4">
                <button 
                  type="button"
                  onClick={() => setPromotionRuleFormModal({ open: false, mode: 'add', rule: null })}
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
          </div>
        </ModalContainer>

      {/* Promotion Modal */}
      <ModalContainer
        isOpen={promotionModal.open}
        onClose={() => setPromotionModal({ open: false, mode: 'add', id: null })}
        title={promotionModal.mode === 'add' ? 'Add Promotion' : 'Edit Promotion'}
        size="md"
      >
        <div className="p-8 pb-10">
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
          </div>
        </ModalContainer>

      {/* Category Modal */}
      <ModalContainer
        isOpen={categoryModal.open}
        onClose={() => setCategoryModal({ open: false, mode: 'add' })}
        title={categoryModal.mode === 'add' ? 'Add Category' : 'Edit Category'}
        size="sm"
        showHeader={true}
      >
        <div className="p-8 pb-10">
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
        </div>
      </ModalContainer>

      {/* Notification Modal */}
      <ModalContainer
        isOpen={notificationModal.open}
        onClose={() => setNotificationModal({ open: false })}
        title="Broadcast Announcement"
        size="lg"
      >
        <div className="p-8 pb-10">
          <p className="text-stone-500 text-sm mt-1 mb-8 select-none">Create and dispatch informative messages across the platform.</p>
          <form onSubmit={handleNotificationSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-xs font-black text-stone-400 uppercase tracking-widest mb-2 select-none">Subject Title</label>
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
                  <label className="block text-xs font-black text-stone-400 uppercase tracking-widest mb-2 select-none">Message Content</label>
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
          </div>
        </ModalContainer>

      {/* Customer Detail Modal */}
      <ModalContainer
        isOpen={customerModal.open && customerModal.user !== null}
        onClose={() => setCustomerModal({ open: false, user: null })}
        size="lg"
        showHeader={false}
      >
        {customerModal.user && (
          <div className="p-8 pb-10">
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
                  <p className="text-stone-500">{maskPhoneNumber(customerModal.user.phone)}</p>
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
                    <label className="block text-xs font-bold text-stone-400 uppercase mb-1 select-none">Role</label>
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
                    <label className="block text-xs font-bold text-stone-400 uppercase mb-1 select-none">Segment</label>
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

                <div className="bg-stone-50 p-6 rounded-2xl space-y-4 border-2 border-red-100">
                  <h4 className="font-bold text-red-900 border-b border-red-200 pb-2">Destructive Security Controls</h4>
                  <div className="grid grid-cols-2 gap-3">
                     <button 
                       onClick={() => {
                          if (window.confirm("CRITICAL: Reset all wallet tokens to zero?")) {
                             handleUserUpdate(customerModal.user.id, { wallet_balance: 0 });
                          }
                       }}
                       className="py-3 px-2 bg-white border border-stone-100 text-red-600 rounded-xl text-[10px] font-black uppercase tracking-tighter hover:bg-red-600 hover:text-white transition-all shadow-sm"
                     >
                        Reset Wallet
                     </button>
                     <button 
                       onClick={() => {
                          if (window.confirm("CRITICAL: Clear all khata liabilities?")) {
                             handleUserUpdate(customerModal.user.id, { khata_balance: 0 });
                          }
                       }}
                       className="py-3 px-2 bg-white border border-stone-100 text-red-600 rounded-xl text-[10px] font-black uppercase tracking-tighter hover:bg-red-600 hover:text-white transition-all shadow-sm"
                     >
                        Clear Khata
                     </button>
                     <button 
                       onClick={() => {
                          const newStatus = customerModal.user.status === 'banned' ? 'active' : 'banned';
                          if (window.confirm(`Protocol: ${newStatus === 'banned' ? 'Deactivate and Ban' : 'Reactivate'} user?`)) {
                             handleUserUpdate(customerModal.user.id, { status: newStatus });
                          }
                       }}
                       className={cn(
                          "col-span-2 py-4 rounded-xl text-white text-[10px] font-black uppercase tracking-widest shadow-lg transition-all",
                          customerModal.user.status === 'banned' ? "bg-emerald-600 shadow-emerald-500/20" : "bg-red-600 shadow-red-500/20"
                       )}
                     >
                        {customerModal.user.status === 'banned' ? 'Authorize User Reactivation' : 'Issue Immediate Network Ban'}
                     </button>
                  </div>
                </div>

                <div className="bg-stone-50 p-6 rounded-2xl space-y-4">
                  <h4 className="font-bold text-stone-900 border-b border-stone-200 pb-2">Contact Info</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-stone-400 uppercase mb-1 select-none">Name</label>
                      <input 
                        type="text" 
                        className="input-field py-2 text-sm"
                        defaultValue={customerModal.user.name}
                        onBlur={(e) => handleUserUpdate(customerModal.user.id, { name: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-stone-400 uppercase mb-1 select-none">Phone</label>
                      <input 
                        type="text" 
                        className="input-field py-2 text-sm"
                        defaultValue={customerModal.user.phone}
                        onBlur={(e) => handleUserUpdate(customerModal.user.id, { phone: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-stone-400 uppercase mb-1 select-none">Email</label>
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
                    <div className="pt-4 mt-4 border-t border-stone-100">
                      <label className="block text-[10px] font-black text-amber-500 uppercase mb-2 flex items-center gap-2">
                         <Shield size={10} />
                         <span>Internal Intelligence Notes</span>
                      </label>
                      <textarea 
                        className="w-full bg-amber-50/10 border border-amber-100 rounded-xl p-4 text-xs font-bold text-stone-600 placeholder:text-stone-300 outline-none focus:ring-2 focus:ring-amber-500/20 transition-all min-h-[100px]"
                        placeholder="Log behavioral observations, trade reputation, or verification notes..."
                        defaultValue={customerModal.user.admin_notes}
                        onBlur={(e) => handleUserUpdate(customerModal.user.id, { admin_notes: e.target.value })}
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
                      onClick={async () => {
                        const { generateUserExportPDF } = await import('../services/pdfService');
                        setExportProgress({ open: true, progress: 10, label: 'Accessing secure user nodes...' });
                        try {
                          const [orders, wallet, activities] = await Promise.all([
                            fetchWithHandling<any[]>(`/api/admin/orders?userId=${customerModal.user.id}`, { headers: getAuthHeaders() }),
                            fetchWithHandling<any[]>(`/api/admin/wallet/history?userId=${customerModal.user.id}`, { headers: getAuthHeaders() }),
                            fetchWithHandling<any[]>(`/api/admin/activities?userId=${customerModal.user.id}`, { headers: getAuthHeaders() })
                          ]);
                          setExportProgress({ open: true, progress: 60, label: 'Serializing user history...' });
                          generateUserExportPDF({ user: customerModal.user, orders: orders || [], wallet: wallet || [], activities: activities || [] });
                          setExportProgress({ open: true, progress: 100, label: 'Dossier Dispatch Successful' });
                          toast.success('Dossier generated successfully');
                        } catch (err) {
                          toast.error('Failed to generate full dossier');
                        } finally {
                          setTimeout(() => setExportProgress({ open: false, progress: 0, label: '' }), 1500);
                        }
                      }}
                      className="w-full py-2 text-sm border border-primary text-primary rounded-xl font-bold hover:bg-primary hover:text-white transition-all flex items-center justify-center space-x-2"
                    >
                      <Download size={16} />
                      <span>Export Full Dossier</span>
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
                            const data = await fetchWithHandling<any>(`/api/admin/users/${customerModal.user.id}`, { 
                              method: 'DELETE',
                              headers: getAuthHeaders()
                            });
                            if (data) {
                              toast.success('User deleted securely');
                              setCustomerModal({ open: false, user: null });
                              fetchUsers();
                            }
                          } catch(e) {
                            console.error('Delete user error:', e);
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
          </div>
        )}
      </ModalContainer>

      {/* Order Detail Modal */}
      <ModalContainer
        isOpen={reviewResponseModal.open && reviewResponseModal.review !== null}
        onClose={() => setReviewResponseModal({ open: false, review: null })}
        title="Respond to Review"
        size="md"
        showHeader={true}
      >
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
        </ModalContainer>

      <ModalContainer
        isOpen={orderModal.open && orderModal.order !== null}
        onClose={() => setOrderModal({ open: false, order: null, statusHistory: [] })}
        size="lg"
        showHeader={false}
      >
        {orderModal.order && (
          <div className="p-8">
            <div className="flex justify-between items-start mb-6">
              <div>
                <div className="flex items-center space-x-3">
                  <h3 className="text-2xl font-bold">Order #ORD-{orderModal.order.id}</h3>
                  <span className={cn(
                    "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm",
                    orderModal.order.payment_status === 'paid' ? "bg-emerald-500 text-white" :
                    orderModal.order.payment_status === 'failed' ? "bg-red-500 text-white" : "bg-amber-400 text-white"
                  )}>
                    {orderModal.order.payment_status ? orderModal.order.payment_status.toUpperCase() : 'PENDING'}
                  </span>
                </div>
                <p className="text-stone-500">{new Date(orderModal.order.created_at).toLocaleString()}</p>
              </div>
              <button onClick={() => setOrderModal({ open: false, order: null, statusHistory: [] })} className="p-2 hover:bg-stone-100 rounded-full">
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
                    <div className="pt-3 border-t border-stone-100 flex justify-between items-center">
                        <span className="font-bold text-lg text-stone-900">Total</span>
                        <div className="flex flex-col items-end">
                          <span className="text-2xl font-black text-primary">₹{orderModal.order.total}</span>
                          <div className="flex items-center gap-2 mt-1">
                            {orderModal.order.wallet_used > 0 && (
                               <span className="text-[8px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">Wallet: ₹{orderModal.order.wallet_used}</span>
                            )}
                            {orderModal.order.payment_method === 'khata' && (
                               <span className="text-[8px] font-black uppercase tracking-widest text-primary bg-primary/5 px-1.5 py-0.5 rounded border border-primary/10">Khata Credit</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-stone-900 p-6 rounded-2xl text-white space-y-4">
                  <h4 className="font-bold border-b border-white/10 pb-2 flex items-center gap-2">
                    <ShieldCheck size={16} className="text-primary" />
                    Security Verification Node
                  </h4>
                  <div className="grid grid-cols-1 gap-3">
                    <div className="space-y-1">
                      <p className="text-[8px] font-black text-stone-500 uppercase tracking-widest">Digital Fingerprint (IP)</p>
                      <p className="text-xs font-mono text-stone-300">{(orderModal.order as any).ip_address || '127.0.0.1 (Local Node)'}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[8px] font-black text-stone-500 uppercase tracking-widest">Client Interface</p>
                      <p className="text-[10px] font-medium text-stone-400 leading-tight">{(orderModal.order as any).user_agent || 'Mozilla/5.0 (System Client)'}</p>
                    </div>
                    <div className="flex justify-between items-end">
                      <div className="space-y-1">
                        <p className="text-[8px] font-black text-stone-500 uppercase tracking-widest">Geostationary Metadata</p>
                        <p className="text-xs text-stone-300">{(orderModal.order as any).city || 'Unknown'}, {(orderModal.order as any).region || 'Processing...'}</p>
                      </div>
                      <div className="px-2 py-1 bg-white/10 rounded-lg border border-white/5">
                         <span className="text-[9px] font-black text-emerald-400 uppercase tracking-[0.2em]">Verified</span>
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
                                  <a 
                                    href={`https://www.google.com/maps/search/?api=1&query=${orderModal.order.lat || addr.lat},${orderModal.order.lng || addr.lng}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center space-x-1 p-2 bg-primary/5 text-primary rounded-lg text-[10px] font-black uppercase tracking-widest mt-2 hover:bg-primary/10 transition-colors"
                                  >
                                    <MapPin size={10} />
                                    <span>View on Map (GPS: {(orderModal.order.lat || addr.lat).toFixed(4)}, {(orderModal.order.lng || addr.lng).toFixed(4)})</span>
                                  </a>
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
                          const data = await fetchWithHandling<any>(`/api/admin/orders/${orderModal.order.id}/tracking`, {
                            method: 'POST',
                            headers: getAuthHeaders(),
                            body: JSON.stringify({ tracking_id })
                          });
                          if (data) {
                            toast.success('Tracking ID saved');
                            setOrderModal({ 
                              ...orderModal, 
                              order: { ...orderModal.order, tracking_id } 
                            });
                          }
                        } catch (err) {
                          console.error('Update tracking ID error:', err);
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
                        const data = await fetchWithHandling<any>(`/api/admin/orders/${orderModal.order.id}/estimated-delivery`, {
                          method: 'POST',
                          headers: getAuthHeaders(),
                          body: JSON.stringify({ estimated_delivery_at: value })
                        });
                        if (data) {
                          toast.success('Estimated delivery time updated');
                          setOrderModal({ 
                            ...orderModal, 
                            order: { ...orderModal.order, estimated_delivery_at: value } 
                          });
                          fetchOrders();
                        }
                      } catch (err) {
                        console.error('Update delivery error:', err);
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
                        const data = await fetchWithHandling<any>(`/api/admin/orders/${orderModal.order.id}/notes`, {
                          method: 'POST',
                          headers: getAuthHeaders(),
                          body: JSON.stringify({ admin_notes: notes })
                        });
                        if (data) {
                          toast.success('Notes saved');
                          setOrderModal({ 
                            ...orderModal, 
                            order: { ...orderModal.order, admin_notes: notes } 
                          });
                          fetchOrders();
                        }
                      } catch (err) {
                        console.error('Save notes error:', err);
                      }
                    }}
                  />
                  <p className="text-[10px] text-stone-400 mt-2 italic">Notes are only visible to administrators.</p>
                </div>
                
                <div className="flex space-x-3 pt-6 border-t border-stone-100">
                   <button 
                     onClick={async () => {
                        const { generateOrderInvoicePDF } = await import('../services/pdfService');
                        generateOrderInvoicePDF(orderModal.order, config);
                     }}
                     className="flex-1 py-4 bg-stone-900 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-emerald-600 flex items-center justify-center space-x-2 shadow-lg transition-all active:scale-95 group"
                   >
                     <FileText size={18} className="group-hover:rotate-12 transition-transform" />
                     <span>Download Pro Invoice</span>
                   </button>
                   <button 
                     onClick={() => handlePrintInvoice(orderModal.order)}
                     className="p-4 bg-stone-100 text-stone-600 rounded-2xl hover:bg-stone-200 transition-colors"
                   >
                     <Printer size={18} />
                   </button>
                 </div>
              </div>

              <div className="space-y-6">
                <div className="bg-stone-50 p-6 rounded-2xl">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-bold text-stone-900">Financial Governance</h4>
                    <span className={cn(
                      "px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest",
                      orderModal.order.payment_status === 'paid' ? "bg-emerald-100 text-emerald-600" :
                      orderModal.order.payment_status === 'failed' ? "bg-red-100 text-red-600" : "bg-amber-100 text-amber-600"
                    )}>
                      {orderModal.order.payment_status || 'Unsettled'}
                    </span>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex justify-between items-center bg-white p-3 rounded-xl border border-stone-100">
                      <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Payment Method</span>
                      <span className="text-xs font-black uppercase tracking-widest text-primary">{orderModal.order.payment_method}</span>
                    </div>

                    {orderModal.order.payment_utr && (
                      <div className="bg-white p-3 rounded-xl border border-stone-100">
                         <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-1">Declared UTR / Ref</p>
                         <p className="text-sm font-mono font-bold text-stone-800 break-all">{orderModal.order.payment_utr}</p>
                      </div>
                    )}
                    
                    {orderModal.order.payment_screenshot ? (
                      <div className="space-y-4">
                        <div className="relative group aspect-video rounded-xl overflow-hidden border border-stone-200 bg-white">
                          <img src={orderModal.order.payment_screenshot} alt="Payment Proof" className="w-full h-full object-contain" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <a href={orderModal.order.payment_screenshot} target="_blank" rel="noreferrer" className="p-3 bg-white rounded-full text-stone-900 shadow-xl hover:scale-110 transition-transform">
                              <ExternalLink size={20} />
                            </a>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 bg-stone-100 rounded-xl border border-dashed border-stone-200 text-stone-400 text-[10px] font-bold uppercase tracking-widest text-center">
                        No Documentation Uploaded
                      </div>
                    )}
                    
                    {orderModal.order.payment_status !== 'paid' && orderModal.order.status !== 'cancelled' && (
                      <div className="flex flex-col gap-3 pt-2">
                        <button 
                          onClick={async () => {
                            if (!window.confirm('Mark this payment as RECEIVED and proceed with fulfillment?')) return;
                            try {
                              // If it's still pending, move to processing. If it's already processing, just update payment.
                              const targetStatus = orderModal.order.status === 'pending' || orderModal.order.status === 'verifying' ? 'processing' : orderModal.order.status;
                              const data = await fetchWithHandling<any>(`/api/admin/orders/${orderModal.order.id}/status`, {
                                method: 'POST',
                                headers: getAuthHeaders(),
                                body: JSON.stringify({ status: targetStatus })
                              });
                              if (data) {
                                toast.success('Payment Verified & Order Escalated');
                                setOrderModal({ open: false, order: null, statusHistory: [] });
                                fetchOrders();
                              }
                            } catch (err) {
                              console.error('Approve order error:', err);
                            }
                          }}
                          className="w-full bg-emerald-600 text-white py-4 rounded-xl font-black text-[10px] uppercase tracking-[.2em] shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 transition-all flex items-center justify-center gap-2"
                        >
                          <CheckCircle2 size={16} />
                          <span>Approve Payment</span>
                        </button>
                        <div className="grid grid-cols-2 gap-2">
                          <button 
                            onClick={async () => {
                              const reason = prompt('Enter rejection reason (User will be notified to retry):');
                              if (reason) {
                                try {
                                  const data = await fetchWithHandling<any>(`/api/admin/orders/${orderModal.order.id}/fail-payment`, {
                                    method: 'POST',
                                    headers: getAuthHeaders(),
                                    body: JSON.stringify({ reason })
                                  });
                                  if (data) {
                                     toast.error('Payment Discarded. Protocol reset for client.');
                                     setOrderModal({ open: false, order: null, statusHistory: [] });
                                     fetchOrders();
                                  }
                                } catch (err) {
                                  console.error('Fail payment error:', err);
                                }
                              }
                            }}
                            className="bg-white text-amber-600 border-2 border-amber-100 py-3 rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-amber-50 transition-all"
                          >
                            Reject Proof
                          </button>
                          <button 
                            onClick={async () => {
                              const reason = prompt('Enter cancellation reason:');
                              if (reason) {
                                try {
                                  const data = await fetchWithHandling<any>(`/api/admin/orders/${orderModal.order.id}/status`, {
                                    method: 'POST',
                                    headers: getAuthHeaders(),
                                    body: JSON.stringify({ status: 'cancelled', rejection_reason: reason })
                                  });
                                  if (data) {
                                     toast.error('Order Cancelled');
                                     setOrderModal({ open: false, order: null, statusHistory: [] });
                                     fetchOrders();
                                  }
                                } catch (err) {
                                  console.error('Cancel order error:', err);
                                }
                              }
                            }}
                            className="bg-white text-red-600 border-2 border-red-100 py-3 rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-red-50 transition-all"
                          >
                            Cancel Order
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
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
          </div>
        )}
      </ModalContainer>
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
        onClose={() => setVariantModal({ ...variantModal, open: false })}
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
      <ModalContainer
        isOpen={reportDetailModal.open && reportDetailModal.report !== null}
        onClose={() => setReportDetailModal({ open: false, report: null })}
        size="lg"
        showHeader={false}
      >
        {reportDetailModal.report && (
          <div className="p-8">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-red-50 text-red-500 rounded-2xl">
                  <Bug size={32} />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-stone-900 tracking-tight">System Error Details</h3>
                  <p className="text-xs font-bold text-stone-400 uppercase tracking-widest mt-1">ID: ERR-{reportDetailModal.report.id.toString().slice(-6)}</p>
                </div>
              </div>
              <button 
                onClick={() => setReportDetailModal({ open: false, report: null })}
                className="p-3 hover:bg-stone-50 rounded-2xl text-stone-400 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-8">
              {/* Summary Section */}
              <div className="grid grid-cols-2 gap-4">
                 <div className="p-4 bg-stone-50 rounded-2xl border border-stone-100">
                    <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest block mb-1">Occurrence</span>
                    <span className="text-xs font-bold text-stone-800">{new Date(reportDetailModal.report.created_at).toLocaleString()}</span>
                 </div>
                 <div className="p-4 bg-stone-50 rounded-2xl border border-stone-100">
                    <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest block mb-1">Error Type</span>
                    <span className={cn("text-xs font-black px-2 py-0.5 rounded-lg", reportDetailModal.report.type === 'API_ERROR' ? 'bg-orange-100 text-orange-600' : 'bg-red-100 text-red-600')}>
                      {reportDetailModal.report.type}
                    </span>
                 </div>
              </div>

              {/* Identity & Origin */}
              <div className="space-y-4">
                <h4 className="text-[10px] font-black text-stone-300 uppercase tracking-[0.2em] px-2">Origin & Reporter</h4>
                <div className="bg-white rounded-3xl border border-stone-100 p-6 space-y-4 shadow-sm">
                   <div className="flex justify-between items-center py-2 border-b border-stone-50">
                      <span className="text-xs font-bold text-stone-500">Reporter</span>
                      <span className="text-xs font-black text-stone-900">{reportDetailModal.report.reporter_name || 'Anonymous User'}</span>
                   </div>
                   <div className="flex justify-between items-center py-2 border-b border-stone-50">
                      <span className="text-xs font-bold text-stone-500">User ID</span>
                      <span className="text-xs font-mono font-bold text-stone-400">{reportDetailModal.report.user_id || 'unauthenticated'}</span>
                   </div>
                   <div className="flex justify-between items-center py-2 border-b border-stone-50">
                      <span className="text-xs font-bold text-stone-500">Node Path</span>
                      <span className="text-xs font-black text-primary">{reportDetailModal.report.path || 'Root Content'}</span>
                   </div>
                   {reportDetailModal.report.api_endpoint && (
                     <div className="flex justify-between items-center py-2">
                        <span className="text-xs font-bold text-stone-500">API Endpoint</span>
                        <span className="text-xs font-mono font-bold text-stone-900 bg-stone-100 px-2 py-1 rounded-lg">{reportDetailModal.report.api_endpoint}</span>
                     </div>
                   )}
                </div>
              </div>

              {/* Environmental Metrics */}
              <div className="space-y-4">
                <h4 className="text-[10px] font-black text-stone-300 uppercase tracking-[0.2em] px-2">Device & Browser Context</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div className="p-4 bg-white border border-stone-100 rounded-3xl shadow-sm flex items-center space-x-4">
                      <div className="p-2 bg-stone-50 rounded-xl text-stone-400"><LayoutDashboard size={18} /></div>
                      <div>
                        <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest leading-none mb-1">Canvas Resolution</p>
                        <p className="text-xs font-bold text-stone-800">{reportDetailModal.report.screen_resolution || 'Unknown'}</p>
                      </div>
                   </div>
                   <div className="p-4 bg-white border border-stone-100 rounded-3xl shadow-sm flex items-center space-x-4">
                      <div className="p-2 bg-stone-50 rounded-xl text-stone-400"><Activity size={18} /></div>
                      <div>
                        <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest leading-none mb-1">Network State</p>
                        <p className="text-xs font-bold text-stone-800">{reportDetailModal.report.network_status || 'Unknown'}</p>
                      </div>
                   </div>
                   <div className="p-4 bg-white border border-stone-100 rounded-3xl shadow-sm col-span-full">
                      <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest leading-none mb-2 px-1">Agent Signature</p>
                      <p className="text-[10px] font-mono text-stone-500 break-all leading-relaxed bg-stone-50 p-3 rounded-xl border border-stone-100">{reportDetailModal.report.device_info}</p>
                   </div>
                </div>
              </div>

              {/* Error Details */}
              <div className="space-y-4">
                <h4 className="text-[10px] font-black text-stone-300 uppercase tracking-[0.2em] px-2">Payload & Trace</h4>
                <div className="space-y-4">
                  <div className="p-6 bg-red-50/50 rounded-3xl border border-red-100">
                    <p className="text-[10px] font-black text-red-400 uppercase tracking-widest mb-2">Primary Exception</p>
                    <p className="text-sm font-black text-red-600 leading-tight">{reportDetailModal.report.message}</p>
                  </div>
                  
                  {reportDetailModal.report.stack_trace && (
                    <div className="p-6 bg-stone-900 rounded-3xl overflow-hidden">
                      <p className="text-[10px] font-black text-stone-500 uppercase tracking-widest mb-3">StackTrace Console</p>
                      <pre className="text-[10px] font-mono text-stone-300 overflow-x-auto no-scrollbar max-h-48 scroll-smooth">
                        {reportDetailModal.report.stack_trace}
                      </pre>
                    </div>
                  )}

                  {reportDetailModal.report.metadata && (
                    <div className="p-6 bg-white border border-stone-100 rounded-3xl shadow-sm">
                      <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-3">Associated Metadata</p>
                      <pre className="text-[10px] font-mono text-stone-600 bg-stone-50 p-4 rounded-xl overflow-x-auto no-scrollbar border border-stone-100">
                        {JSON.stringify(typeof reportDetailModal.report.metadata === 'string' ? JSON.parse(reportDetailModal.report.metadata) : reportDetailModal.report.metadata, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-10 flex space-x-3">
               <button 
                onClick={() => setReportDetailModal({ open: false, report: null })}
                className="flex-1 py-4 bg-stone-900 text-white rounded-[1.5rem] font-black uppercase tracking-widest text-xs shadow-xl shadow-stone-200"
               >
                 Acknowledge Report
               </button>
               <button 
                onClick={async () => {
                  try {
                    await fetchWithHandling(`/api/bugs/report/${reportDetailModal.report.id}`, { method: 'DELETE', headers: getAuthHeaders() });
                    setBugReports(bugReports.filter((b: any) => b.id !== reportDetailModal.report.id));
                    setReportDetailModal({ open: false, report: null });
                    toast.success('Report Purged');
                  } catch (err) {}
                }}
                className="w-16 h-16 bg-red-50 text-red-500 rounded-[1.5rem] flex items-center justify-center hover:bg-red-500 hover:text-white transition-all shadow-sm"
               >
                 <Trash2 size={24} />
               </button>
            </div>
          </div>
        )}
      </ModalContainer>
      <ExportProgressModal open={exportProgress.open} progress={exportProgress.progress} label={exportProgress.label} />
      <ExportActionModal />
    </AdminDashboardLayout>
  );
}
