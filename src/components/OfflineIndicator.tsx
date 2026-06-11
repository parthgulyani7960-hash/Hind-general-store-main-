import React from 'react';
import { WifiOff } from 'lucide-react';
import { useStore } from '@/StoreContext';

export const OfflineIndicator = () => {
  const { isOnline } = useStore();
  if (isOnline) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 bg-red-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
      <WifiOff size={18} />
      <span>You are offline</span>
    </div>
  );
};
