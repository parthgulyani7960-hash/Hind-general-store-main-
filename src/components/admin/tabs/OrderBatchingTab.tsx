import React, { useState, useEffect } from 'react';
import { Package, Truck, Loader2, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { fetchWithHandling } from '../../../lib/api';
import { getAuthHeaders } from '../../../lib/utils';
import { Order } from '../../../types';

export default function OrderBatchingTab() {
  const [pendingOrders, setPendingOrders] = useState<Order[]>([]);
  const [batchOrders, setBatchOrders] = useState<number[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    fetchPendingOrders();
  }, []);

  const fetchPendingOrders = async () => {
    try {
      const data = await fetchWithHandling<Order[]>('/api/admin/orders?status=pending', { headers: getAuthHeaders() });
      if (data) setPendingOrders(data);
    } catch (err) {
      console.error('Failed to fetch orders:', err);
    }
  };

  const handleBatch = async () => {
    if (batchOrders.length === 0) return;
    setIsProcessing(true);
    try {
      await fetchWithHandling('/api/admin/orders/batch-dispatch', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ order_ids: batchOrders })
      });
      toast.success(`Successfully batched ${batchOrders.length} orders`);
      setBatchOrders([]);
      fetchPendingOrders();
    } catch (err) {
      toast.error('Batching failed');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-black text-stone-900 tracking-tighter">Order Batching</h2>
        <button 
          onClick={handleBatch}
          disabled={batchOrders.length === 0 || isProcessing}
          className="bg-primary text-white px-6 py-3 rounded-2xl text-xs font-bold uppercase tracking-widest hover:bg-primary/90 disabled:opacity-50 flex items-center gap-2 transition-all"
        >
          {isProcessing ? <Loader2 className="animate-spin" size={16} /> : <Truck size={16} />}
          Dispatch {batchOrders.length} Orders
        </button>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-stone-100 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="text-[10px] uppercase font-black tracking-widest text-stone-400 bg-stone-50">
            <tr>
              <th className="p-4">
                <input 
                  type="checkbox"
                  onChange={(e) => {
                    if (e.target.checked) setBatchOrders(pendingOrders.map(o => o.id));
                    else setBatchOrders([]);
                  }}
                />
              </th>
              <th className="p-4">Order ID</th>
              <th className="p-4">Customer</th>
              <th className="p-4">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {pendingOrders.map(order => (
              <tr key={order.id} className="hover:bg-stone-50 transition-colors">
                <td className="p-4">
                  <input 
                    type="checkbox"
                    checked={batchOrders.includes(order.id)}
                    onChange={(e) => {
                      if (e.target.checked) setBatchOrders([...batchOrders, order.id]);
                      else setBatchOrders(batchOrders.filter(id => id !== order.id));
                    }}
                  />
                </td>
                <td className="p-4 font-bold text-sm">#{order.id}</td>
                <td className="p-4 text-sm">{order.user_name}</td>
                <td className="p-4 font-mono text-sm">₹{order.total_amount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
