import React from 'react';
import { useNetwork } from '../hooks/useNetwork';
import { WifiOff } from 'lucide-react';

export const NetworkBanner = () => {
  const isOnline = useNetwork();
  
  if (isOnline) return null;
  
  return (
    <div className="fixed top-0 left-0 right-0 bg-red-600 text-white p-2 text-center text-xs font-bold z-50 flex items-center justify-center space-x-2">
      <WifiOff size={14} />
      <span>No internet connection detected</span>
    </div>
  );
};
