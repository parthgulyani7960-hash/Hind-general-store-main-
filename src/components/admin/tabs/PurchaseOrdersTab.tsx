import React, { useState, useEffect } from 'react';
import { db } from '../../../lib/firebase';
import { collection, query, orderBy, getDocs, addDoc, serverTimestamp, doc, updateDoc, increment, runTransaction } from 'firebase/firestore';
import { PackagePlus, Plus } from 'lucide-react';
import { toast } from 'sonner';

export default function PurchaseOrdersTab() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'purchase_records'), orderBy('created_at', 'desc'));
      const snapshot = await getDocs(q);
      setOrders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (err) {
      console.error('Error fetching purchase orders:', err);
      toast.error('Failed to load purchase orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleAddOrder = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const quantity = Number(formData.get('quantity'));
    const productId = formData.get('product_id') as string;
    
    const data = {
      supplier_details: formData.get('supplier_details'),
      product_id: productId,
      quantity,
      cost_price: Number(formData.get('cost_price')),
      invoice_number: formData.get('invoice_number'),
      batch_number: formData.get('batch_number'),
      expiry_date: formData.get('expiry_date'),
      created_at: serverTimestamp()
    };
    
    try {
      await runTransaction(db, async (transaction) => {
        const productRef = doc(db, 'products', productId);
        transaction.update(productRef, { stock: increment(quantity) });
        const newOrderRef = doc(collection(db, 'purchase_records'));
        transaction.set(newOrderRef, data);
      });
      toast.success('Purchase order logged and stock updated successfully');
      e.currentTarget.reset();
      fetchOrders();
    } catch (err) {
      console.error('Error adding purchase order:', err);
      toast.error('Failed to log purchase order. Check Product ID.');
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header>
        <h2 className="text-4xl font-black text-stone-900 tracking-tight">Purchase Orders</h2>
        <p className="text-stone-500 mt-2 text-lg font-medium">Log and track supplier purchases.</p>
      </header>
      
      <div className="bg-white p-8 rounded-3xl border border-stone-100 shadow-sm">
        <h3 className="text-xl font-black mb-6">Log New Purchase</h3>
        <form onSubmit={handleAddOrder} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input name="supplier_details" placeholder="Supplier Details" className="p-3 border rounded-xl" required />
          <input name="product_id" placeholder="Product ID" className="p-3 border rounded-xl" required />
          <input type="number" name="quantity" placeholder="Quantity" className="p-3 border rounded-xl" required />
          <input type="number" name="cost_price" placeholder="Cost Price" className="p-3 border rounded-xl" required />
          <input name="invoice_number" placeholder="Invoice Number" className="p-3 border rounded-xl" />
          <input name="batch_number" placeholder="Batch Number" className="p-3 border rounded-xl" />
          <input type="date" name="expiry_date" className="p-3 border rounded-xl" />
          <button type="submit" className="bg-stone-900 text-white py-3 rounded-xl font-bold flex items-center justify-center space-x-2 hover:bg-stone-800">
            <Plus size={18} />
            <span>Log Purchase</span>
          </button>
        </form>
      </div>

      <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-stone-100">
         <table className="w-full text-left text-sm">
            <thead className="bg-stone-50 border-b border-stone-100 uppercase text-[10px] font-black text-stone-500 tracking-wider">
              <tr>
                <th className="p-4">Product ID</th>
                <th className="p-4">Supplier</th>
                <th className="p-4">Qty</th>
                <th className="p-4">Cost</th>
                <th className="p-4">Invoice</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {orders.map(order => (
                <tr key={order.id}>
                  <td className="p-4 font-bold">{order.product_id}</td>
                  <td className="p-4">{order.supplier_details}</td>
                  <td className="p-4 font-bold">{order.quantity}</td>
                  <td className="p-4 text-emerald-600 font-bold">₹{order.cost_price}</td>
                  <td className="p-4 text-xs font-mono">{order.invoice_number}</td>
                </tr>
              ))}
            </tbody>
         </table>
      </div>
    </div>
  );
}
