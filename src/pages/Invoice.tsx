import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import toast from 'react-hot-toast';
import { Download, Printer, ArrowLeft, CheckCircle2, CheckCircle, Package, Truck, Home, Clock, XCircle } from 'lucide-react';

export default function Invoice() {
  const { id } = useParams();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetch(`/api/orders/${id}`)
      .then(res => res.json())
      .then(data => {
        setOrder(data);
        setLoading(false);
      });
  }, [id]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>;
  if (!order) return <div className="text-center py-20">Order not found</div>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="flex justify-between items-center mb-8 no-print">
        <button onClick={() => navigate(-1)} className="flex items-center space-x-2 text-stone-500 hover:text-primary">
          <ArrowLeft size={20} />
          <span>Back</span>
        </button>
        <div className="flex space-x-4">
          <button onClick={handlePrint} className="btn-primary flex items-center space-x-2">
            <Printer size={18} />
            <span>Print Invoice</span>
          </button>
        </div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white p-12 rounded-3xl shadow-xl border border-stone-100 invoice-container"
      >
        {/* Order Tracking Timeline (No Print) */}
        <div className="mb-12 no-print p-6 bg-stone-50 rounded-2xl border border-stone-100">
          <h3 className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-6">Order Status Tracking</h3>
          
          {(order.status === 'cancelled' || order.status === 'failed') ? (
            <div className="flex items-center space-x-3 p-4 bg-red-50 rounded-2xl border border-red-100">
              <div className="p-2 bg-red-100 text-red-600 rounded-xl">
                <XCircle size={20} />
              </div>
              <div>
                <p className="text-sm font-bold text-red-900">Order {order.status === 'cancelled' ? 'Cancelled' : 'Failed'}</p>
                <p className="text-xs text-red-600">This order was {order.status === 'cancelled' ? 'cancelled' : 'marked as failed'} and will not be processed.</p>
                {order.rejection_reason && (
                  <div className="mt-2 p-2 bg-white/50 rounded-lg border border-red-200">
                    <p className="text-[10px] font-black text-red-800 uppercase tracking-tighter">Reason</p>
                    <p className="text-xs text-red-700">{order.rejection_reason}</p>
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
                      {isCurrent && (
                        <span className="text-[8px] text-primary font-bold animate-bounce mt-1">
                          Current
                        </span>
                      )}
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

        <div className="flex justify-between items-start mb-12">
          <div>
            <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center text-white font-bold text-2xl mb-4">H</div>
            <h1 className="text-2xl font-bold text-primary">Hind General Store</h1>
            <p className="text-stone-500 text-sm">Main Market, Ludhiana, Punjab</p>
            <p className="text-stone-500 text-sm">+91 98765 43210</p>
          </div>
          <div className="text-right">
            <h2 className="text-4xl font-bold text-stone-900 uppercase tracking-tighter">Invoice</h2>
            <div className="flex items-center justify-end space-x-2 mt-2">
              <p className="text-stone-500">Order ID: <span className="font-mono font-bold text-stone-900">#ORD-{order.id}</span></p>
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(String(order.id));
                  toast.success('Order ID copied!');
                }}
                className="p-1 hover:bg-stone-100 rounded-md transition-colors text-stone-300 hover:text-primary no-print"
                title="Copy Order ID"
              >
                <Download size={14} className="rotate-180" /> {/* Using icon as a helper */}
              </button>
            </div>
            <p className="text-stone-500">Date: <span className="font-bold text-stone-900">{new Date(order.created_at).toLocaleDateString()}</span></p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-12 mb-12">
          <div>
            <h3 className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-4">Bill To</h3>
            <p className="font-bold text-lg">{order.user_name}</p>
            <p className="text-stone-600">{order.user_phone}</p>
            <p className="text-stone-600 mt-2">{order.address}</p>
          </div>
          <div className="text-right">
            <h3 className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-4">Payment Info</h3>
            <p className="font-bold text-stone-900 uppercase">{order.payment_method}</p>
            <div className="mt-1">
              {order.payment_method === 'cod' ? (
                <span className="text-[10px] font-bold px-2 py-1 bg-stone-100 text-stone-600 rounded-md uppercase">COD (Pay on Delivery)</span>
              ) : order.status === 'delivered' ? (
                <span className="text-[10px] font-bold px-2 py-1 bg-emerald-100 text-emerald-600 rounded-md uppercase">Paid</span>
              ) : order.payment_screenshot ? (
                <span className="text-[10px] font-bold px-2 py-1 bg-amber-100 text-amber-600 rounded-md uppercase">Pending Verification</span>
              ) : order.status === 'cancelled' ? (
                <span className="text-[10px] font-bold px-2 py-1 bg-red-100 text-red-600 rounded-md uppercase">Cancelled</span>
              ) : (
                <span className="text-[10px] font-bold px-2 py-1 bg-amber-100 text-amber-600 rounded-md uppercase">Payment Pending</span>
              )}
            </div>
            
            {order.payment_screenshot && (
              <div className="mt-4 no-print">
                <p className="text-[10px] text-stone-400 uppercase font-bold mb-2">Payment Proof</p>
                <div className="relative group inline-block">
                  <img 
                    src={order.payment_screenshot} 
                    alt="Payment Proof" 
                    className="w-24 h-24 object-cover rounded-xl border border-stone-200 shadow-sm transition-transform group-hover:scale-105 cursor-zoom-in"
                    onClick={() => window.open(order.payment_screenshot, '_blank')}
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center pointer-events-none">
                    <Download size={16} className="text-white" />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <table className="w-full mb-12">
          <thead>
            <tr className="border-b-2 border-stone-100 text-left">
              <th className="py-4 text-xs font-bold text-stone-400 uppercase">Item Description</th>
              <th className="py-4 text-xs font-bold text-stone-400 uppercase text-center">Qty</th>
              <th className="py-4 text-xs font-bold text-stone-400 uppercase text-right">Price</th>
              <th className="py-4 text-xs font-bold text-stone-400 uppercase text-right">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {order.items.map((item: any) => (
              <tr key={item.id}>
                <td className="py-4 font-medium">{item.product_name}</td>
                <td className="py-4 text-center">{item.quantity}</td>
                <td className="py-4 text-right">₹{item.price}</td>
                <td className="py-4 text-right font-bold">₹{item.price * item.quantity}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex justify-end">
          <div className="w-64 space-y-3">
            <div className="flex justify-between text-stone-500">
              <span>Subtotal</span>
              <span>₹{order.total}</span>
            </div>
            <div className="flex justify-between text-stone-500">
              <span>Delivery</span>
              <span className="text-emerald-600">FREE</span>
            </div>
            <div className="pt-4 border-t-2 border-stone-100 flex justify-between font-bold text-2xl text-primary">
              <span>Total</span>
              <span>₹{order.total}</span>
            </div>
          </div>
        </div>

        <div className="mt-20 pt-12 border-t border-stone-100 text-center">
          <div className="flex items-center justify-center space-x-2 text-emerald-600 font-bold mb-2">
            <CheckCircle2 size={20} />
            <span>Thank you for shopping with us!</span>
          </div>
          <p className="text-stone-400 text-xs">This is a computer generated invoice and does not require a physical signature.</p>
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
