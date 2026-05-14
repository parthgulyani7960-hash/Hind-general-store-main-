import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import toast from 'react-hot-toast';
import { Download, Printer, ArrowLeft, CheckCircle2, CheckCircle, Package, Truck, Home, Clock, XCircle, ShieldAlert, FileText, RefreshCw } from 'lucide-react';

import { StoreProvider, useStore } from '../StoreContext';
import { fetchWithHandling } from '../lib/api';
import { getAuthHeaders } from '../lib/utils';

export default function Invoice() {
  const { id } = useParams();
  const { config, user } = useStore();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
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

  const handleDownloadPDF = async () => {
    if (order.status === 'cancelled' || order.status === 'returned' || order.status === 'failed') {
      if (user?.role !== 'admin') {
        toast.error('Invoice is disabled for cancelled or returned orders.');
        return;
      }
    }
    const { generateOrderInvoicePDF } = await import('../services/pdfService');
    generateOrderInvoicePDF(order, config);
    toast.success('Invoice generated successfully!');
  };

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
            onClick={handleDownloadPDF} 
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
                {[
                  { id: 'pending', label: 'Order Placed', icon: CheckCircle },
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

        <div className="flex flex-col md:flex-row justify-between items-start mb-12 gap-8">
          <div>
            <div className="w-16 h-16 bg-stone-900 text-white rounded-[1.5rem] flex items-center justify-center font-black text-3xl mb-6 shadow-xl shadow-stone-900/20">
              {(config.find(c => c.key === 'store_name')?.value || 'H')[0]?.toUpperCase()}
            </div>
            <h1 className="text-3xl font-black text-stone-900 tracking-tighter">{config.find(c => c.key === 'store_name')?.value || 'Hind General Store'}</h1>
            <p className="text-stone-500 text-sm mt-2 font-medium max-w-[250px] leading-relaxed italic opacity-80">{config.find(c => c.key === 'store_address')?.value || 'Nayagaon, India'}</p>
            <p className="text-stone-600 text-sm font-bold mt-1">{config.find(c => c.key === 'store_phone')?.value || '+91 98765 43210'}</p>
          </div>
          <div className="text-right flex flex-col items-end">
            <span className="bg-primary/10 text-primary text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest mb-4 inline-block">Pro-Forma Document</span>
            <h2 className="text-5xl font-black text-stone-900 uppercase tracking-tighter leading-none">Invoice</h2>
            <div className="mt-6 space-y-1">
              <div className="flex items-center justify-end space-x-2">
                <p className="text-stone-400 font-bold uppercase text-[10px] tracking-widest">Order Reference</p>
                <span className="font-mono font-black text-stone-900 bg-stone-100 px-3 py-1 rounded-lg">#ORD-{order.id}</span>
              </div>
              <p className="text-stone-500 text-sm font-medium">Issue Date: <span className="font-bold text-stone-900">{new Date(order.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span></p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-12 py-8 border-y border-stone-100">
          <div className="relative">
            <div className="absolute -left-4 top-0 bottom-0 w-1 bg-primary/20 rounded-full" />
            <h3 className="text-[10px] font-black text-stone-400 uppercase tracking-[0.2em] mb-4">Origin Node: Bill To</h3>
            <p className="font-black text-xl text-stone-900 tracking-tight leading-tight">{order.user_name}</p>
            <p className="text-stone-500 font-bold text-sm mt-1">{order.user_phone}</p>
            <p className="text-stone-500 text-sm mt-3 font-medium italic opacity-80">{order.address}</p>
          </div>
          <div className="text-right">
            <h3 className="text-[10px] font-black text-stone-400 uppercase tracking-[0.2em] mb-4">Transaction Protocol</h3>
            <div className="space-y-3">
              <div>
                <p className="text-xs font-black text-stone-900 uppercase tracking-tight">{order.payment_method?.toUpperCase() || 'COD'}</p>
                <div className="mt-1 flex justify-end">
                  {order.payment_method === 'cod' ? (
                    <span className="text-[9px] font-black px-3 py-1 bg-stone-100 text-stone-500 rounded-lg uppercase tracking-widest">Pay on Delivery</span>
                  ) : order.status === 'delivered' ? (
                    <span className="text-[9px] font-black px-3 py-1 bg-emerald-500 text-white rounded-lg uppercase tracking-widest shadow-sm shadow-emerald-500/20">Settled</span>
                  ) : order.payment_screenshot ? (
                    <span className="text-[9px] font-black px-3 py-1 bg-amber-500 text-white rounded-lg uppercase tracking-widest shadow-sm shadow-amber-500/20">Awaiting Clearance</span>
                  ) : order.status === 'cancelled' || order.status === 'returned' ? (
                    <span className="text-[9px] font-black px-3 py-1 bg-red-600 text-white rounded-lg uppercase tracking-widest shadow-sm shadow-red-600/20">{order.status}</span>
                  ) : (
                    <span className="text-[9px] font-black px-3 py-1 bg-indigo-600 text-white rounded-lg uppercase tracking-widest shadow-sm shadow-indigo-600/20">Protocol Pending</span>
                  )}
                </div>
              </div>
              
              {order.payment_id && (
                <div>
                  <p className="text-[10px] text-stone-400 font-bold uppercase tracking-widest">Protocol ID</p>
                  <p className="text-xs font-mono font-black text-stone-800">{order.payment_id}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto no-scrollbar mb-12">
            <table className="w-full">
              <thead>
                <tr className="border-b border-stone-200 text-left">
                  <th className="py-5 text-[10px] font-black text-stone-400 uppercase tracking-[0.2em]">Item Asset / Description</th>
                  <th className="py-5 text-[10px] font-black text-stone-400 uppercase tracking-[0.2em] text-center">Qty</th>
                  <th className="py-5 text-[10px] font-black text-stone-400 uppercase tracking-[0.2em] text-right">Unit Val</th>
                  <th className="py-5 text-[10px] font-black text-stone-400 uppercase tracking-[0.2em] text-right">Net Sum</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-50">
                {order.items.map((item: any, i: number) => (
                  <tr key={i} className="hover:bg-stone-50 transition-colors group">
                    <td className="py-6 pr-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-stone-100 rounded-lg flex items-center justify-center text-stone-400 group-hover:bg-stone-900 group-hover:text-white transition-all">
                          <FileText size={16} />
                        </div>
                        <div>
                          <p className="font-black text-stone-900 text-sm tracking-tight">{item.product_name}</p>
                          <p className="text-[10px] text-stone-400 font-bold uppercase">Asset-ID: {item.product_id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-6 text-center text-sm font-black text-stone-900">{item.quantity}</td>
                    <td className="py-6 text-right text-sm font-medium text-stone-500">₹{item.price}</td>
                    <td className="py-6 text-right text-base font-black text-stone-900 tracking-tighter">₹{item.price * item.quantity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
        </div>

        <div className="flex justify-end pt-8 border-t border-stone-100">
          <div className="w-72 space-y-4">
            <div className="flex justify-between items-center text-stone-500 group">
              <span className="text-xs font-bold uppercase tracking-widest">Subtotal Sum</span>
              <span className="font-black text-lg text-stone-800">₹{order.total}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold uppercase tracking-widest text-stone-500">Delivery Logistics</span>
              <span className="bg-emerald-100 text-emerald-600 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-tighter">Complimentary</span>
            </div>
            <div className="pt-6 relative">
               {/* Decorative total line */}
              <div className="absolute top-0 right-0 left-0 h-1 bg-stone-100 rounded-full" />
              <div className="flex justify-between items-end">
                <div>
                    <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-1 leading-none">Gross Payable</p>
                    <p className="text-3xl font-black text-stone-900 tracking-tighter leading-none italic">TOTAL</p>
                </div>
                <div className="text-right">
                    <p className="text-4xl font-black text-primary tracking-tighter leading-none">₹{order.total}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-24 pt-12 border-t-2 border-stone-50 text-center relative">
          <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-white px-8">
             <CheckCircle2 size={32} className="text-emerald-500" strokeWidth={1.5} />
          </div>
          <div className="space-y-2">
            <p className="text-xl font-black text-stone-900 tracking-tight uppercase italic">{user?.name},</p>
            <p className="text-stone-400 font-bold text-sm tracking-widest uppercase">Thank you for orchestrating a transaction with Hind General Store.</p>
          </div>
          <p className="text-stone-300 text-[8px] font-black uppercase tracking-[0.4em] mt-12 opacity-50">Authorized Computer-Generated Document-No Sig Required</p>
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

