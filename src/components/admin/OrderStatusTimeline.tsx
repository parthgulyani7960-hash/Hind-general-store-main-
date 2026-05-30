import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { cn } from '@/types';

interface StatusHistory {
  status: string;
  timestamp: string;
}

interface OrderStatusTimelineProps {
  orderId: string;
}

export const OrderStatusTimeline: React.FC<OrderStatusTimelineProps> = ({ orderId }) => {
  const [history, setHistory] = useState<StatusHistory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/public/orders/${orderId}/history`)
      .then(res => res.json())
      .then(data => {
        setHistory(data.history || []);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch order history', err);
        setLoading(false);
      });
  }, [orderId]);

  if (loading) return null;
  if (history.length === 0) return null;

  return (
    <div className="w-full space-y-4 pt-8 border-t border-stone-100">
      <h4 className="text-sm font-black text-stone-900 uppercase tracking-widest">Status Timeline</h4>
      <div className="space-y-4">
        {history.map((item, index) => (
          <div key={index} className="flex gap-4">
            <div className="flex flex-col items-center">
              <div className="w-3 h-3 rounded-full bg-primary" />
              {index < history.length - 1 && <div className="w-0.5 h-full bg-stone-200" />}
            </div>
            <div className="flex-1 pb-4">
              <p className="text-sm font-bold text-stone-900 capitalize">{item.status}</p>
              <p className="text-xs text-stone-400 font-medium">
                {new Date(item.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
