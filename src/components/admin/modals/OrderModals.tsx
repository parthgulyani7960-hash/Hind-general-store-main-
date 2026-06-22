import React from 'react';
import ModalContainer from '@/components/ui/ModalContainer';
import { X, ShieldCheck, ExternalLink, CheckCircle2, Package, Truck, Home, MapPin, Printer, FileText } from 'lucide-react';
import { cn } from '@/types';
import toast from 'react-hot-toast';
import { fetchWithHandling } from '@/lib/api';
import { getAuthHeaders, formatPhoneNumber } from '@/lib/utils';
import { triggerFeedback } from '@/lib/feedback';
import { motion } from 'motion/react';

interface OrderModalsProps {
  orderModal: { open: boolean; order: any; statusHistory: any[] };
  setOrderModal: (modal: any) => void;
  orderHistory: any[];
  config: any;
  handlePrintInvoice: (order: any) => void;
  handleApproveOrderPayment: (orderId: any) => void;
  updateOrderStatus: (orderId: any, status: string) => Promise<void>;
  fetchOrders: () => void;
}

export const OrderModals: React.FC<OrderModalsProps> = ({
  orderModal,
  setOrderModal,
  orderHistory,
  config,
  handlePrintInvoice,
  handleApproveOrderPayment,
  updateOrderStatus,
  fetchOrders,
}) => {
  return (
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
                <h3 className="text-2xl font-bold">Order #{orderModal.order.order_id || 'ORD-' + orderModal.order.id}</h3>
                <span className={cn(
                  "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm",
                  orderModal.order.payment_status === 'paid' ? "bg-emerald-500 text-white" :
                  orderModal.order.payment_status === 'failed' ? "bg-red-500 text-white" : "bg-amber-400 text-white"
                )}>
                  {orderModal.order.payment_status ? orderModal.order.payment_status.toUpperCase() : 'PENDING'}
                </span>
                {orderModal.order.delivery_type && (
                  <span className={cn(
                    "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm",
                    orderModal.order.delivery_type === 'pickup' ? "bg-orange-500 text-white" : "bg-blue-500 text-white"
                  )}>
                    {orderModal.order.delivery_type === 'pickup' ? 'PICKUP' : 'DELIVERY'}
                  </span>
                )}
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
            </div>

            <div className="space-y-6">
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
                    <div className="space-y-3">
                      <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-1">Payment Proof</p>
                      <div className="relative group rounded-xl overflow-hidden bg-white border border-stone-100 aspect-video flex items-center justify-center">
                        <img src={orderModal.order.payment_screenshot} alt="Payment Proof" className="max-w-full max-h-full object-contain" referrerPolicy="no-referrer" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-4">
                           <a href={orderModal.order.payment_screenshot} target="_blank" rel="noreferrer" className="p-2 bg-white rounded-full text-stone-900 hover:scale-110 transition-transform">
                             <ExternalLink size={20} />
                           </a>
                        </div>
                      </div>
                      {orderModal.order.payment_status === 'verifying' && (
                         <div className="flex items-center gap-2 mt-2">
                           <button 
                             onClick={() => {
                               triggerFeedback('medium');
                               handleApproveOrderPayment(orderModal.order.id);
                             }}
                             className="flex-1 py-3 bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20"
                           >
                             Verify & Approve
                           </button>
                           <button 
                             onClick={() => {
                               triggerFeedback('heavy');
                               updateOrderStatus(orderModal.order.id, 'failed');
                             }}
                             className="px-4 py-3 bg-red-50 text-red-500 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-red-100 transition-all"
                           >
                             Invalid
                           </button>
                         </div>
                      )}
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
                          const addr = typeof orderModal.order.address === 'string' 
                            ? JSON.parse(orderModal.order.address) 
                            : orderModal.order.address;
                          
                          if (addr && typeof addr === 'object') {
                            const latVal = orderModal.order.lat || addr.lat || (addr.coordinates && addr.coordinates.lat);
                            const lngVal = orderModal.order.lng || addr.lng || (addr.coordinates && addr.coordinates.lng);
                            
                            return (
                              <>
                                <p className="font-bold text-stone-800">{addr.name || 'Recipient'}</p>
                                {addr.phone && <p>{formatPhoneNumber(addr.phone)}</p>}
                                <p className="mt-1">{addr.address || addr.street_address || 'No precise street address'}</p>
                                <p>
                                  {addr.city || ''}
                                  {addr.city && addr.state ? ', ' : ''}
                                  {addr.state || ''} 
                                  {addr.pin_code || addr.pincode ? ` (${addr.pin_code || addr.pincode})` : ''}
                                </p>
                                {latVal && lngVal && (
                                  <a 
                                    href={`https://www.google.com/maps/search/?api=1&query=${latVal},${lngVal}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center space-x-1 p-2 bg-primary/5 text-primary rounded-lg text-[10px] font-black uppercase tracking-widest mt-2 hover:bg-primary/10 transition-colors"
                                  >
                                    <MapPin size={10} />
                                    <span>View on Map (GPS: {Number(latVal).toFixed(6)}, {Number(lngVal).toFixed(6)})</span>
                                  </a>
                                )}
                              </>
                            );
                          }
                          
                          return <p className="text-stone-800">{String(orderModal.order.address)}</p>;
                        } catch (e) {
                          return <p className="text-stone-800">{String(orderModal.order.address)}</p>;
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
                <h4 className="font-bold text-stone-900 mb-4">Delivery Partner Tracking ID</h4>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    className="flex-1 p-4 bg-white border border-stone-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm"
                    placeholder="Enter Delivery Partner Tracking ID..."
                    defaultValue={orderModal.order.tracking_id}
                    id={`tracking-id-${orderModal.order.id}`}
                  />
                  <button 
                    onClick={async () => {
                      triggerFeedback('medium');
                      const tracking_id = (document.getElementById(`tracking-id-${orderModal.order.id}`) as HTMLInputElement).value;
                      try {
                        const data = await fetchWithHandling<any>(`/api/admin/orders/${orderModal.order.id}/tracking`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
                          body: JSON.stringify({ tracking_id })
                        });
                        if (data) {
                          toast.success('Tracking ID saved');
                          // Notify user
                          fetch('/api/admin/notifications', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
                            body: JSON.stringify({
                              user_id: orderModal.order.user_id,
                              message: `Your order #${orderModal.order.order_id || orderModal.order.id} has been updated with delivery tracking ID: ${tracking_id}`,
                              type: 'order_update'
                            })
                          }).catch(console.error);
                          setOrderModal({ 
                            ...orderModal, 
                            order: { ...orderModal.order, tracking_id } 
                          });
                        }
                      } catch (err) {
                        console.error('Update tracking ID error:', err);
                      }
                    }}
                    className="px-4 bg-primary text-white rounded-xl hover:bg-primary/95 font-bold text-xs"
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
                      const { generateOrderInvoicePDF } = await import('@/services/pdfService');
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
                        <img src={orderModal.order.payment_screenshot} alt="Payment Proof" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
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
                          const confirmed = window.confirm('Mark this payment as RECEIVED and proceed with fulfillment?');
                          triggerFeedback('medium');
                          if (!confirmed) return;
                          triggerFeedback('heavy');
                          try {
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
                            triggerFeedback('medium');
                            if (reason) {
                              triggerFeedback('heavy');
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
                            triggerFeedback('medium');
                            if (reason) {
                              triggerFeedback('heavy');
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
                  className="w-full bg-stone-50 rounded-xl px-4 py-2 text-sm font-bold text-stone-800 focus:outline-none focus:ring-2 focus:ring-primary/20"
                  value={orderModal.order.status}
                  onChange={async (e) => {
                    triggerFeedback('light');
                    const newStatus = e.target.value;
                    await updateOrderStatus(orderModal.order.id, newStatus);
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
  );
};
