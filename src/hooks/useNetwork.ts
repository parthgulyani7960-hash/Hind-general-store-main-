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
        setStatus(prev => ({ ...prev, latency: Math.round(end - start), isOnline: true }));
      } catch (err) {
        setStatus(prev => ({ ...prev, latency: null, isOnline: false }));
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

    // Measure periodically (every 30 seconds) if the page is visible
    intervalId = setInterval(() => {
      if (document.visibilityState === 'visible') {
        measureLatency();
      }
    }, 30000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(intervalId);
    };
  }, []);

  return status;
};
