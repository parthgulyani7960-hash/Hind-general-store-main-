import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';

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
    // Fetch order history for the orderId
    fetch(`/api/orders/${orderId}/history`)
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

  if (loading) return <div>Loading timeline...</div>;

  const statuses = ['pending', 'processing', 'shipped', 'delivered'];
  const currentStep = statuses.indexOf(history.length > 0 ? history[history.length - 1].status : 'pending');

  return (
    <div className="w-full flex items-center justify-between p-4 bg-gray-50 rounded-lg">
      {statuses.map((status, index) => (
        <div key={status} className="flex flex-col items-center flex-1">
          <motion.div
            className={`w-4 h-4 rounded-full ${index <= currentStep ? 'bg-blue-500' : 'bg-gray-300'}`}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
          />
          <span className="text-xs mt-2 capitalize text-gray-600">{status}</span>
        </div>
      ))}
    </div>
  );
};
