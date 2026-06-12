import { useState, useEffect } from 'react';

export interface NetworkStatus {
  isOnline: boolean;
  latency: number | null;
}

export const useNetwork = () => {
  const [status, setStatus] = useState<NetworkStatus>({
    isOnline: navigator.onLine,
    latency: null
  });

  useEffect(() => {
    let intervalId: any;

    const measureLatency = async () => {
      if (!navigator.onLine) return;
      
      const start = performance.now();
      try {
        // We use a small fetch to measure latency. 
        // /favicon.ico is a good choice as it's usually small and cached by CDNs but still requires a roundtrip
        await fetch('/favicon.ico', { method: 'HEAD', cache: 'no-store' });
        const end = performance.now();
        setStatus(prev => ({ ...prev, latency: Math.round(end - start), isOnline: navigator.onLine }));
      } catch (err) {
        // If ping fails, we don't necessarily want to mark as offline if navigator says we are online
        // but we clear the latency
        setStatus(prev => ({ ...prev, latency: null, isOnline: navigator.onLine }));
      }
    };

    const handleOnline = () => {
      setStatus(prev => ({ ...prev, isOnline: true }));
      measureLatency();
    };
    
    const handleOffline = () => {
      setStatus(prev => ({ ...prev, isOnline: false, latency: null }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial measurement
    if (navigator.onLine) {
      measureLatency();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return status;
};
