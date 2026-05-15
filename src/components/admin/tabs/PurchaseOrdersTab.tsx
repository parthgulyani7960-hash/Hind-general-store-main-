import React, { useState, useEffect } from 'react';
import { db } from '../../../firebase';
import { collection, query, orderBy, getDocs, addDoc, serverTimestamp, doc, updateDoc, increment, runTransaction } from 'firebase/firestore';
import { PackagePlus, Plus } from 'lucide-react';
import { toast } from 'sonner';

export default function PurchaseOrdersTab() {
  const [orders, setOrders] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'purchase_records'), orderBy('created_at', 'desc'));
      const snapshot = await getDocs(q);
      setOrders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      
      const prodQ = query(collection(db, 'products'));
      const prodSnapshot = await getDocs(prodQ);
      setProducts(prodSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
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
    
    if(!productId) {
        toast.error('Please select a product');
        return;
    }

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
      toast.error('Failed to log purchase order.');
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
        <form onSubmit={handleAddOrder} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-stone-500 uppercase tracking-widest">Supplier Details</label>
            <input name="supplier_details" placeholder="Supplier Name/ID" className="w-full p-3 border rounded-xl" required />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-stone-500 uppercase tracking-widest">Select Product</label>
            <select name="product_id" className="w-full p-3 border rounded-xl" required>
              <option value="">Select a product</option>
              {products.map(p => <option key={p.id} value={p.id}>{p.name} (ID: {p.id})</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-stone-500 uppercase tracking-widest">Quantity</label>
            <input type="number" name="quantity" placeholder="0" className="w-full p-3 border rounded-xl" required />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-stone-500 uppercase tracking-widest">Cost Price (₹)</label>
            <input type="number" name="cost_price" placeholder="0.00" className="w-full p-3 border rounded-xl" required />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-stone-500 uppercase tracking-widest">Invoice Number</label>
            <input name="invoice_number" placeholder="e.g. INV-2026-001" className="w-full p-3 border rounded-xl" />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-stone-500 uppercase tracking-widest">Batch Number</label>
            <input name="batch_number" placeholder="Batch #ID" className="w-full p-3 border rounded-xl" />
          </div>
          <div className="space-y-2 md:col-span-2">
            <label className="text-xs font-bold text-stone-500 uppercase tracking-widest">Expiry Date</label>
            <input type="date" name="expiry_date" className="w-full p-3 border rounded-xl" />
          </div>
          <button type="submit" className="md:col-span-2 bg-stone-900 text-white py-4 rounded-2xl font-bold flex items-center justify-center space-x-2 hover:bg-stone-800 transition-colors">
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
