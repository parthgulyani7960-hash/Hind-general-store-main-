import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import toast from 'react-hot-toast';
import { Download, Printer, ArrowLeft, CheckCircle2, CheckCircle, Package, Truck, Home, Clock, XCircle, ShieldAlert, FileText, RefreshCw, Sparkles, Receipt, CheckSquare } from 'lucide-react';

import { StoreProvider, useStore } from '@/StoreContext';
import { fetchWithHandling } from '@/lib/api';
import { getAuthHeaders, amountToWords } from '@/lib/utils';

export default function Invoice() {
  const { id } = useParams();
  const { config = [], user } = useStore();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [hasAutoDownloaded, setHasAutoDownloaded] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchWithHandling<any>(`/api/orders/${id}`, { headers: getAuthHeaders() })
      .then(data => {
        if (data) setOrder(data);
        setLoading(false);
      });
  }, [id]);

  const handlePrint = () => {
    toast.success('Opening document for Print...', { icon: '📄' });
    setTimeout(() => window.print(), 500);
  };

  const handleDownloadPDF = async (triggeredAuto = false) => {
    if (!order) return;
    if (order.status === 'cancelled' || order.status === 'returned' || order.status === 'failed') {
      if (user?.role !== 'admin') {
        if (!triggeredAuto) {
          toast.error('Invoice is disabled for cancelled or returned orders.');
        }
        return;
      }
    }
    const { generateOrderInvoicePDF } = await import('../services/pdfService');
    generateOrderInvoicePDF(order, config);
    if (!triggeredAuto) {
      toast.success('Invoice generated successfully!');
    }
  };

  useEffect(() => {
    if (order && !hasAutoDownloaded && order.status !== 'cancelled' && order.status !== 'failed' && order.status !== 'returned') {
      const autoTimer = setTimeout(() => {
        handleDownloadPDF(true);
        setHasAutoDownloaded(true);
        toast.success("Invoice PDF generated and downloaded!", { icon: "📥" });
      }, 1500);
      return () => clearTimeout(autoTimer);
    }
  }, [order, hasAutoDownloaded]);

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>;
  if (!order) return <div className="text-center py-20">Order not found</div>;

  const isInvoiceDisabled = (order.status === 'cancelled' || order.status === 'returned' || order.status === 'failed') && user?.role !== 'admin';

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 pb-32 md:pb-10">
      <div className="flex justify-between items-center mb-8 no-print">
        <button onClick={() => navigate(-1)} className="flex items-center space-x-2 text-stone-500 hover:text-primary transition-colors">
          <ArrowLeft size={20} />
          <span className="font-bold uppercase tracking-widest text-xs">Back</span>
        </button>
        <div className="flex space-x-4">
          <button 
            onClick={() => handleDownloadPDF(false)} 
            disabled={isInvoiceDisabled}
            className={`flex items-center space-x-2 px-6 py-3 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl transition-all active:scale-95 ${isInvoiceDisabled ? 'bg-stone-100 text-stone-400 cursor-not-allowed' : 'bg-stone-900 text-white hover:bg-stone-800 shadow-stone-900/10'}`}
          >
            <Download size={18} />
            <span>{isInvoiceDisabled ? 'Invoice Disabled' : 'Download PDF'}</span>
          </button>
          <button onClick={handlePrint} className="p-3 bg-white border border-stone-200 text-stone-600 rounded-2xl hover:bg-stone-50 transition-colors shadow-sm">
            <Printer size={18} />
          </button>
        </div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white p-8 md:p-12 rounded-[2.5rem] shadow-2xl border border-stone-100 invoice-container relative overflow-hidden"
      >
        {isInvoiceDisabled && (
          <div className="absolute inset-0 z-10 bg-white/60 backdrop-blur-[2px] flex items-center justify-center p-8 no-print">
            <div className="bg-red-600 text-white p-10 rounded-[2rem] shadow-2xl max-w-sm text-center space-y-4">
              <ShieldAlert size={64} strokeWidth={1.5} className="mx-auto" />
              <h2 className="text-2xl font-black uppercase tracking-tighter">Document Void</h2>
              <p className="text-sm font-medium opacity-90">This invoice has been disabled because the order was {order.status}. Contact support for re-generation.</p>
              <button onClick={() => navigate('/support')} className="w-full bg-white text-red-600 py-3 rounded-xl font-bold text-sm uppercase tracking-widest">Contact Admin</button>
            </div>
          </div>
        )}

        {/* Order Tracking Timeline (No Print) */}
        <div className="mb-12 no-print p-6 bg-stone-50 rounded-2xl border border-stone-100">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xs font-bold text-stone-400 uppercase tracking-widest">Order Status Tracking</h3>
            {user?.role === 'admin' && (
              <span className="text-[10px] font-black bg-stone-900 text-white px-3 py-1 rounded-full uppercase tracking-tighter">Admin View</span>
            )}
          </div>
          
          {(order.status === 'cancelled' || order.status === 'failed' || order.status === 'returned') ? (
            <div className={`flex items-center space-x-3 p-4 rounded-2xl border ${order.status === 'returned' ? 'bg-amber-50 border-amber-100 text-amber-900' : 'bg-red-50 border-red-100 text-red-900'}`}>
              <div className={`p-2 rounded-xl ${order.status === 'returned' ? 'bg-amber-100 text-amber-600' : 'bg-red-100 text-red-600'}`}>
                {order.status === 'returned' ? <RefreshCw size={20} /> : <XCircle size={20} />}
              </div>
              <div>
                <p className="text-sm font-bold uppercase tracking-tight">Order {order.status.charAt(0).toUpperCase() + order.status.slice(1)}</p>
                <p className="text-xs opacity-70">Status updated: {new Date(order.updated_at || order.created_at).toLocaleString()}</p>
                {order.rejection_reason && (
                  <div className="mt-2 p-2 bg-white/50 rounded-lg border border-black/5">
                    <p className="text-[9px] font-black uppercase tracking-tighter opacity-50">Admin Note</p>
                    <p className="text-xs italic">"{order.rejection_reason}"</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="relative">
              <div className="flex justify-between relative z-10">
                {(order.delivery_type === 'pickup'
                  ? [
                      { id: 'pending', label: 'Order Placed', icon: CheckCircle },
                      { id: 'processing', label: 'Packed', icon: Package },
                      { id: 'shipped', label: 'Ready for Pickup', icon: Clock },
                      { id: 'delivered', label: 'Collected', icon: CheckCircle2 },
                    ]
                  : [
                      { id: 'pending', label: 'Order Placed', icon: CheckCircle },
                      { id: 'processing', label: 'Packed', icon: Package },
                      { id: 'shipped', label: 'Shipped', icon: Truck },
                      { id: 'delivered', label: 'Delivered', icon: Home },
                    ]
                ).map((step, i) => {
                  const statuses = ['pending', 'processing', 'shipped', 'delivered'];
                  const currentIndex = statuses.indexOf(order.status);
                  const isActive = i <= currentIndex;
                  const isCurrent = i === currentIndex;
                  const Icon = step.icon;
                  
                  return (
                    <div key={step.id} className="flex flex-col items-center">
                      <div className={`
                        w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500 border-2
                        ${isActive ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20' : 'bg-white border-stone-200 text-stone-300'}
                        ${isCurrent ? 'ring-4 ring-primary/20 animate-pulse' : ''}
                      `}>
                        <Icon size={18} />
                      </div>
                      <span className={`
                        text-[10px] font-bold mt-3 uppercase tracking-tight transition-colors duration-500
                        ${isActive ? 'text-primary' : 'text-stone-400'}
                      `}>
                        {step.label}
                      </span>
                    </div>
                  );
                })}
              </div>
              
              {/* Connecting Lines */}
              <div className="absolute top-[20px] left-8 right-8 h-[2px] bg-stone-200 -z-0">
                <div 
                  className="h-full bg-primary transition-all duration-1000 ease-out" 
                  style={{ width: `${(Math.max(0, ['pending', 'processing', 'shipped', 'delivered'].indexOf(order.status)) / 3) * 100}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Watermark diagonal vector layering */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden z-0">
          <div className="text-[120px] font-black text-stone-400/[0.04] tracking-[0.25em] rotate-[-25deg] uppercase whitespace-nowrap">
            ORIGINAL HGS INVOICE
          </div>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-start mb-12 gap-8 relative z-10">
          <div>
            <div className="w-16 h-16 bg-gradient-to-tr from-emerald-600 to-stone-900 text-white rounded-[1.755rem] flex items-center justify-center font-black text-3xl mb-6 shadow-xl shadow-emerald-600/10 ring-4 ring-emerald-50">
              {((config || []).find(c => c.key === 'store_name')?.value || 'H')[0]?.toUpperCase()}
            </div>
            <h1 className="text-3xl font-black text-stone-900 tracking-tight flex items-center bg-gradient-to-r from-stone-900 via-stone-800 to-emerald-700 bg-clip-text text-transparent">
              {(config || []).find(c => c.key === 'store_name')?.value || 'New Hind General Store'}
            </h1>
            <p className="text-stone-500 text-xs mt-2 font-bold uppercase tracking-widest text-emerald-600">Digital Tax Invoice Partner</p>
            <p className="text-stone-500 text-xs mt-1.5 font-medium max-w-[280px] leading-relaxed italic opacity-85">
              {(config || []).find(c => c.key === 'store_address')?.value || 'Shop No. 5, Main Market, Nayagaon, India'}
            </p>
            <div className="mt-4 space-y-1 text-xs text-stone-600 font-bold">
              <p>Phone: <span className="text-stone-800">{(config || []).find(c => c.key === 'store_phone')?.value || '+91 99882-27755'}</span></p>
              <p>FSSAI License: <span className="text-stone-800">{(config || []).find(c => c.key === 'fssai_number')?.value || 'N/A'}</span></p>
              <p>GSTIN: <span className="text-stone-800 uppercase">{(config || []).find(c => c.key === 'gst_number')?.value || '07HQGST8849L1Z5'}</span></p>
            </div>
          </div>
          <div className="text-right flex flex-col items-end">
            <span className="bg-emerald-500/10 text-emerald-600 text-[9px] font-black px-4 py-1.5 rounded-full uppercase tracking-wider mb-4 border border-emerald-500/20 shadow-sm flex items-center gap-1">
              <Sparkles size={10} className="animate-spin-slow" />
              AUTHENTIC FISCAL RECORD
            </span>
            <h2 className="text-5xl font-black text-stone-900 uppercase tracking-tighter leading-none">Tax Invoice</h2>
            <div className="mt-6 space-y-1">
              <div className="flex items-center justify-end space-x-2">
                <p className="text-stone-400 font-bold uppercase text-[9px] tracking-widest">Invoice Number</p>
                <span className="font-mono text-xs font-black text-stone-900 bg-stone-100 px-3 py-1 rounded-lg border border-stone-200">
                  INV/2026/06/{String(order.id).padStart(5, '0')}
                </span>
              </div>
              <div className="flex items-center justify-end space-x-2 mt-1.5">
                <p className="text-stone-400 font-bold uppercase text-[9px] tracking-widest">Order Reference</p>
                <span className="font-mono text-xs font-black text-stone-800 bg-stone-100 px-3 py-1 rounded-lg">
                  #ORD-{order.id}
                </span>
              </div>
              <p className="text-stone-500 text-[11px] font-bold mt-2">
                Issue Date: <span className="font-black text-stone-900">{new Date(order.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-12 py-8 border-y border-stone-100 relative z-10">
          <div className="relative">
            <div className="absolute -left-4 top-0 bottom-0 w-1 bg-emerald-500 rounded-full shadow" />
            <h3 className="text-[10px] font-black text-stone-400 uppercase tracking-[0.2em] mb-4">Origin Node: Bill To</h3>
            <p className="font-black text-xl text-stone-900 tracking-tight leading-tight uppercase">{order.user_name || 'VALUED CUSTOMER'}</p>
            <p className="text-stone-500 font-bold text-xs mt-1.5">Phone: <span className="text-stone-800">{order.user_phone || 'N/A'}</span></p>
            <p className="text-stone-500 font-bold text-xs">Email Ref: <span className="text-slate-700">{order.user_email || 'N/A'}</span></p>
            
            <div className="mt-4 p-4 rounded-2xl bg-stone-50 border border-stone-150 relative">
               <p className="text-[9px] font-black text-stone-400 uppercase tracking-widest mb-1 leading-none">Shipping Destination</p>
               <p className="text-xs text-stone-600 font-medium leading-relaxed italic pr-2">{order.address || 'COLLECTION POINT: NEW HIND GENERAL STORE, NAYAGAON'}</p>
            </div>
          </div>
          <div className="text-right flex flex-col justify-between items-end">
            <div>
              <h3 className="text-[10px] font-black text-stone-400 uppercase tracking-[0.2em] mb-4">Transaction Protocol</h3>
              <p className="text-sm font-black text-stone-900 uppercase tracking-tight">{order.payment_method?.toUpperCase() || 'COD'}</p>
              <div className="mt-1 flex justify-end">
                {order.payment_method === 'cod' ? (
                  <span className="text-[9px] font-black px-3 py-1 bg-amber-500/10 text-amber-700 border border-amber-500/20 rounded-lg uppercase tracking-wider">Pay on Delivery</span>
                ) : order.status === 'delivered' ? (
                  <span className="text-[9px] font-black px-3 py-1 bg-emerald-500 text-white rounded-lg uppercase tracking-wider shadow-sm shadow-emerald-500/20">Settled (Released)</span>
                ) : order.payment_screenshot ? (
                  <span className="text-[9px] font-black px-3 py-1 bg-amber-500 text-white rounded-lg uppercase tracking-wider shadow-sm shadow-amber-500/20">Awaiting Clearance</span>
                ) : order.status === 'cancelled' || order.status === 'returned' ? (
                  <span className="text-[9px] font-black px-3 py-1 bg-red-600 text-white rounded-lg uppercase tracking-wider shadow-sm shadow-red-600/20">{order.status}</span>
                ) : (
                  <span className="text-[9px] font-black px-3 py-1 bg-emerald-600 text-white border border-emerald-500/25 rounded-lg uppercase tracking-wider shadow-sm shadow-emerald-600/10">Paid</span>
                )}
              </div>
            </div>
            
            {order.payment_id && (
              <div className="mt-4">
                <p className="text-[10px] text-stone-400 font-black uppercase tracking-widest">Protocol ID</p>
                <p className="text-xs font-mono font-black text-stone-800 bg-stone-50 px-2 py-1 rounded border border-stone-100">{order.payment_id}</p>
              </div>
            )}
          </div>
        </div>

        <div className="overflow-x-auto no-scrollbar mb-12 relative z-10">
          <table className="w-full text-left min-w-[650px] overflow-hidden rounded-2xl border border-stone-100">
            <thead>
              <tr className="bg-stone-900/90 text-white border-b border-stone-200">
                <th className="py-4 px-4 text-[10px] font-black uppercase tracking-widest text-stone-200">IDX</th>
                <th className="py-4 px-4 text-[10px] font-black uppercase tracking-widest text-stone-200 pl-2">Line Item / Description</th>
                <th className="py-4 px-4 text-[10px] font-black uppercase tracking-widest text-stone-200 text-right">MRP</th>
                <th className="py-4 px-4 text-[10px] font-black uppercase tracking-widest text-stone-200 text-right">Discount</th>
                <th className="py-4 px-4 text-[10px] font-black uppercase tracking-widest text-stone-200 text-right">Unit rate</th>
                <th className="py-4 px-4 text-[10px] font-black uppercase tracking-widest text-stone-200 text-center">GST (INC)</th>
                <th className="py-4 px-4 text-[10px] font-black uppercase tracking-widest text-stone-200 text-center">Qty</th>
                <th className="py-4 px-4 text-[10px] font-black uppercase tracking-widest text-stone-200 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 bg-white">
              {order.items.map((item: any, i: number) => {
                const qty = item.quantity || 1;
                const unitPrice = parseFloat(String(item.price || 0));
                const mrp = parseFloat(String(item.mrp || Math.ceil(unitPrice * 1.15)));
                const discount = Math.max(0, mrp - unitPrice);
                const amount = unitPrice * qty;
                const gstInc = amount * 5 / 105; // 5% inclusive calculation for on-screen
                
                return (
                  <tr key={i} className="hover:bg-emerald-500/[0.015] transition-colors group">
                    <td className="py-5 px-4 font-mono font-bold text-stone-400 text-xs text-center">{String(i + 1).padStart(2, '0')}</td>
                    <td className="py-5 px-4 pl-2">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-stone-100 rounded-lg flex items-center justify-center text-stone-500 group-hover:bg-stone-900 group-hover:text-white transition-all shadow-sm">
                          <Receipt size={14} />
                        </div>
                        <div>
                          <p className="font-bold text-stone-900 text-xs tracking-tight">{item.name}</p>
                          <p className="text-[9px] text-stone-400 font-bold uppercase tracking-tight">ID: {item.product_id || item.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-5 px-4 text-right font-bold text-stone-500 text-xs shadow-sm shadow-stone-50/5">₹{mrp.toFixed(2)}</td>
                    <td className="py-5 px-4 text-right font-black text-rose-500 text-xs">
                      {discount > 0 ? `-₹${discount.toFixed(2)}` : '₹0.00'}
                    </td>
                    <td className="py-5 px-4 text-right font-bold text-stone-700 text-xs">₹{unitPrice.toFixed(2)}</td>
                    <td className="py-5 px-4 text-center">
                      <div className="inline-flex flex-col text-center">
                        <span className="text-[10px] font-black text-stone-800">5% rate</span>
                        <span className="text-[9px] text-stone-400 font-bold leading-none mt-0.5">₹{gstInc.toFixed(2)}</span>
                      </div>
                    </td>
                    <td className="py-5 px-4 text-center font-mono font-black text-stone-900 text-xs">{qty}</td>
                    <td className="py-5 px-4 text-right font-black text-emerald-600 text-sm tracking-tight">₹{amount.toFixed(2)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Dynamic financial grid + Stamp time downstream */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start pt-8 border-t border-stone-100 relative z-10">
          
          {/* Dynamic pay stamp box with timestamp matching order details */}
          <div className="border-[3px] border-dashed border-emerald-500/40 p-6 rounded-[1.85rem] bg-emerald-500/[0.02] flex flex-col relative overflow-hidden backdrop-blur-xs select-none">
            <div className="absolute top-4 right-4 text-emerald-500/20">
              <CheckSquare size={52} strokeWidth={1} />
            </div>
            <div className="flex items-center space-x-2.5 mb-2 pb-2.5 border-b border-emerald-500/10">
              <div className="p-1 rounded-lg bg-emerald-500 text-white shadow-sm shadow-emerald-500/30">
                <CheckCircle2 size={16} />
              </div>
              <span className="text-[10px] uppercase font-black tracking-widest text-emerald-600 leading-none">★ Verified secure deposit stamp ★</span>
            </div>
            <p className="text-xs font-black text-emerald-800 uppercase tracking-tight">NEW HIND GENERAL STORE</p>
            
            <div className="mt-4 space-y-1.5 text-xs font-mono font-bold text-stone-600">
              <div className="flex justify-between border-b border-stone-100 pb-1">
                <span>Protocol:</span>
                <span className="text-stone-800 uppercase">{order.payment_method || 'CASH'}</span>
              </div>
              <div className="flex justify-between border-b border-stone-100 pb-1">
                <span>Verification status:</span>
                <span className="text-emerald-600 uppercase">SETTLED (Verified)</span>
              </div>
              <div className="flex justify-between border-b border-stone-100 pb-1">
                <span>Stamp Date-Time:</span>
                <span className="text-stone-800">{new Date(order.created_at).toLocaleString('en-IN', { hour12: true })}</span>
              </div>
              <div className="flex justify-between pb-1">
                <span>Transaction Ref:</span>
                <span className="text-stone-800 font-black">{order.payment_id || order.payment_utr || 'HGS-INTERNAL-NODE'}</span>
              </div>
            </div>
            
            <div className="mt-4 text-[9px] text-center font-bold text-stone-400 border-t border-emerald-500/10 pt-2.5 uppercase tracking-widest">
              Digital Authenticated Record
            </div>
          </div>

          <div className="space-y-4">
            {/* Totals calculations for screen */}
            {(() => {
              const screenItems = order.items.map((item: any) => {
                const q = item.quantity || 1;
                const price = parseFloat(String(item.price || 0));
                const mrp = parseFloat(String(item.mrp || Math.ceil(price * 1.15)));
                return { mrp, q, price };
              });
              const totalMrp = screenItems.reduce((acc: number, x: any) => acc + (x.mrp * x.q), 0);
              const couponSavings = parseFloat(String(order.coupon_discount || order.discount || 0));
              const totalDiscountedVal = Math.max(0, totalMrp - parseFloat(order.total));
              
              let walletCredits = 0;
              let khataCredits = 0;
              if (order.payment_method === 'wallet') {
                walletCredits = parseFloat(String(order.total));
              } else if (order.payment_method === 'khata') {
                khataCredits = parseFloat(String(order.total));
              }

              return (
                <div className="bg-stone-50 p-6 rounded-3xl border border-stone-150 space-y-3 shadow-xs">
                  <div className="flex justify-between items-center text-xs font-bold text-stone-500">
                    <span>MRP Total Gross:</span>
                    <span className="font-black text-stone-800 text-sm">₹{totalMrp.toFixed(2)}</span>
                  </div>
                  
                  {couponSavings > 0 && (
                    <div className="flex justify-between items-center text-xs font-bold text-rose-500">
                      <span>Coupon Deductions:</span>
                      <span className="font-black">-₹{couponSavings.toFixed(2)}</span>
                    </div>
                  )}

                  {walletCredits > 0 && (
                    <div className="flex justify-between items-center text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded">
                      <span>Wallet Balance Applied:</span>
                      <span className="font-black">₹{walletCredits.toFixed(2)}</span>
                    </div>
                  )}

                  {khataCredits > 0 && (
                    <div className="flex justify-between items-center text-xs font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded">
                      <span>Khata Balance Applied:</span>
                      <span className="font-black">₹{khataCredits.toFixed(2)}</span>
                    </div>
                  )}

                  <div className="flex justify-between items-center text-xs font-bold text-emerald-600">
                    <span>Overall Savings (HGS Loyalty):</span>
                    <span className="font-black">₹{totalDiscountedVal.toFixed(2)}</span>
                  </div>

                  <div className="flex justify-between items-center text-xs font-bold text-stone-500">
                    <span>Logistics handling:</span>
                    <span className="text-emerald-600 font-bold text-[10px] tracking-widest bg-emerald-100 px-2.5 py-0.5 rounded-full uppercase">Free</span>
                  </div>

                  <div className="pt-4 border-t border-stone-200">
                    <div className="flex justify-between items-end">
                      <div>
                        <p className="text-[10px] font-black text-emerald-600 uppercase tracking-wider leading-none">Gross Invoice Total</p>
                        <p className="text-2xl font-black text-stone-900 tracking-tight leading-none mt-1 uppercase italic">Total payable</p>
                      </div>
                      <p className="text-4xl font-black text-stone-900 bg-emerald-100 shadow-xs px-3 py-1.5 rounded-2xl tracking-tighter self-center border border-emerald-200">
                        ₹{parseFloat(order.total).toFixed(2)}
                      </p>
                    </div>
                  </div>

                  {/* Amount in words representation */}
                  <div className="pt-3.5 mt-2 border-t border-stone-200/60 text-left">
                    <p className="text-[9px] font-black text-stone-400 uppercase tracking-widest">Amount in Words</p>
                    <p className="text-[11px] font-bold text-stone-600 mt-1 italic leading-relaxed">
                      "{amountToWords(parseFloat(order.total))}"
                    </p>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>

        <div className="mt-20 pt-10 border-t border-stone-150 text-center relative z-10">
          <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-white px-8">
             <CheckCircle2 size={32} className="text-emerald-500 shadow-sm" strokeWidth={1.5} />
          </div>
          <div className="space-y-2">
            <p className="text-xl font-black text-stone-900 tracking-tight uppercase italic">{order.user_name || 'Valued Customer'},</p>
            <p className="text-stone-400 font-bold text-xs tracking-wider uppercase">Thank you for orchestrating a secure commercial deposit with New Hind General Store.</p>
          </div>
          <p className="text-stone-300 text-[8px] font-black uppercase tracking-[0.4em] mt-12 opacity-50">Authorized Computer-Generated Receipt-No Signature Required</p>
        </div>
      </motion.div>

      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
          .invoice-container { border: none !important; box-shadow: none !important; padding: 0 !important; }
        }
      `}</style>
    </div>
  );
}

