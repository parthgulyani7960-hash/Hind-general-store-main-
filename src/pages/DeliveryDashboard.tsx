import React, { useState, useEffect } from 'react';
import { useStore } from '../StoreContext';
import { Package, MapPin, CheckCircle, Navigation, Phone, Map, Car, Truck } from 'lucide-react';
import toast from 'react-hot-toast';

export default function DeliveryDashboard() {
  const { user } = useStore();
  const [assignedOrders, setAssignedOrders] = useState<any[]>([]);

  useEffect(() => {
    // Ideally this queries orders assigned to delivery_boy_id = user.id
    // But for a mock/prototype, let's just fetch all 'processing' or 'dispatched' orders.
    const fetchOrders = async () => {
      try {
        const res = await fetch('/api/runner/orders');
        const data = await res.json();
        setAssignedOrders(data);
      } catch (err) {
        toast.error('Failed to load assignments');
      }
    };
    fetchOrders();
  }, []);

  const updateOrderStatus = async (id: number, status: string) => {
    try {
      const res = await fetch(`/api/runner/orders/${id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        toast.success(`Order marked as ${status}`);
        setAssignedOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o));
      } else {
        toast.error('Failed to update status');
      }
    } catch (err) {
      toast.error('Update failed');
    }
  };

  const openMapsUrl = (addressStr: string) => {
     let addressObj: any = {};
     try { addressObj = JSON.parse(addressStr); } catch(e) {}
     const query = encodeURIComponent(`${addressObj?.address || ''} ${addressObj?.city || ''} ${addressObj?.pin_code || ''} ${addressObj?.delivery_area || ''}`);
     window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-stone-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex items-center space-x-4 mb-8">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
               <Car size={32} />
            </div>
            <div>
              <h1 className="text-3xl font-serif font-bold text-stone-800">Runner Portal</h1>
              <p className="text-stone-500 font-medium">Welcome back, {user?.name}</p>
            </div>
        </div>

        <div className="space-y-6">
          <h2 className="text-xl font-bold font-serif mb-4 flex items-center space-x-2">
            <Map size={20} className="text-stone-400" />
            <span>Today's Route</span>
          </h2>
          {assignedOrders.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-3xl border border-stone-200">
               <Package size={48} className="mx-auto text-stone-300 mb-4" />
               <h3 className="text-xl font-bold text-stone-500">No active assignments</h3>
               <p className="text-stone-400">You're all caught up for the day!</p>
            </div>
          ) : (
            assignedOrders.map(order => {
              let addressDetails: any = {};
              try { addressDetails = JSON.parse(order.address); } catch(e) {}
              
              return (
                <div key={order.id} className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm flex flex-col md:flex-row gap-6">
                  <div className="flex-1 space-y-4">
                    <div className="flex justify-between items-start">
                        <div>
                          <span className="text-[10px] font-black tracking-widest uppercase text-blue-500 bg-blue-50 px-2 py-1 rounded">ORD-{order.id}</span>
                          <h3 className="font-bold text-lg mt-2">{addressDetails.name || order.user_name}</h3>
                        </div>
                        <div className="text-right">
                           <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                             order.status === 'dispatched' ? 'bg-amber-100 text-amber-700' : 'bg-stone-100 text-stone-700'
                           }`}>
                             {order.status}
                           </span>
                        </div>
                    </div>
                    
                    <div className="flex items-start space-x-3 text-stone-600">
                      <MapPin size={18} className="mt-1 flex-shrink-0 text-stone-400" />
                      <div>
                        <p>{addressDetails.address}</p>
                        <p>{addressDetails.city}, {addressDetails.pin_code}</p>
                        <p className="text-xs font-bold text-primary mt-1 uppercase">Zone: {addressDetails.delivery_area}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 text-stone-600">
                      <Phone size={18} className="text-stone-400" />
                      <a href={`tel:${addressDetails.phone}`} className="font-medium text-blue-600 underline">
                        {addressDetails.phone}
                      </a>
                    </div>
                    
                    <div className="bg-stone-50 p-4 rounded-xl border border-stone-100 flex justify-between items-center">
                        <span className="text-xs font-bold text-stone-500 uppercase">Collect Payment</span>
                        <span className="font-black text-lg">₹{order.total} <span className="text-xs font-bold text-stone-400 bg-stone-200 px-1 rounded ml-1">{order.payment_method.toUpperCase()}</span></span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 justify-center border-t md:border-t-0 md:border-l border-stone-100 pt-4 md:pt-0 md:pl-6 min-w-[200px]">
                     <button 
                       onClick={() => openMapsUrl(order.address)}
                       className="w-full bg-blue-50 text-blue-600 px-4 py-3 rounded-xl font-bold flex items-center justify-center space-x-2 transition-colors hover:bg-blue-100"
                     >
                       <Navigation size={18} />
                       <span>Navigate</span>
                     </button>
                     {order.status === 'processing' && (
                         <button 
                           onClick={() => updateOrderStatus(order.id, 'dispatched')}
                           className="w-full bg-stone-800 text-white px-4 py-3 rounded-xl font-bold flex items-center justify-center space-x-2 transition-colors hover:bg-stone-700"
                         >
                           <Truck size={18} />
                           <span>Mark Dispatched</span>
                         </button>
                     )}
                     {order.status === 'dispatched' && (
                         <button 
                           onClick={() => updateOrderStatus(order.id, 'delivered')}
                           className="w-full bg-emerald-500 text-white px-4 py-3 rounded-xl font-bold flex items-center justify-center space-x-2 transition-colors hover:bg-emerald-600"
                         >
                           <CheckCircle size={18} />
                           <span>Confirm Delivery</span>
                         </button>
                     )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
