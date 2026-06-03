import { db } from '@/firebase';
import { doc, onSnapshot, getDoc } from 'firebase/firestore';

export interface OrderUpdate {
  status: string;
  location?: {
    lat: number;
    lng: number;
  };
  estimated_delivery_at?: string;
  [key: string]: any;
}

export class OrderTrackingService {
  static subscribeToOrder(orderId: string, onUpdate: (data: OrderUpdate) => void, onError?: (error: any) => void) {
    // We assume the orderId passed here is the Firestore document ID
    // If orderId is a custom human-readable ID (like HGS-...), we might need to query first
    // but the instruction says "fetches real-time shipment status from Firebase"
    
    const orderRef = doc(db, 'orders', orderId);
    
    return onSnapshot(orderRef, (snapshot) => {
      if (snapshot.exists()) {
        onUpdate({ id: snapshot.id, ...snapshot.data() } as OrderUpdate);
      }
    }, (error) => {
      console.error('[OrderTrackingService] Error subscribing to order:', error);
      if (onError) onError(error);
    });
  }

  static async getOrderOnce(orderId: string): Promise<OrderUpdate | null> {
    const orderRef = doc(db, 'orders', orderId);
    const snapshot = await getDoc(orderRef);
    if (snapshot.exists()) {
      return { id: snapshot.id, ...snapshot.data() } as OrderUpdate;
    }
    return null;
  }
}
