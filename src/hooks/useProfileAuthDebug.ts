import { useState, useEffect } from 'react';
import { useStore } from '@/StoreContext';

/**
 * Specialized debug hook to monitor auth state and data fetching for the Profile page.
 */
export const useProfileAuthDebug = () => {
  const { isAuthChecking, user, dbError, isApiUp, isRevalidating } = useStore();
  const [debug, setDebug] = useState({ status: 'Initializing', details: '' });

  useEffect(() => {
    let status = 'Initializing';
    let details = '';

    if (isAuthChecking) {
      status = 'Auth Checking';
      details = 'Verifying Firebase authentication state...';
    } else if (isRevalidating) {
      status = 'Syncing';
      details = 'Fetching user profile data from server...';
    } else if (dbError) {
      status = 'Database Error';
      details = `Connection issue: ${dbError}`;
    } else if (!isApiUp) {
      status = 'API Offline';
      details = 'Unable to reach backend service.';
    } else if (!user) {
      status = 'Auth Wall';
      details = 'No active user session detected.';
    } else {
      status = 'Ready';
      details = 'Profile data loaded.';
    }

    setDebug({ status, details });
    console.log(`[ProfileDebug] ${status}: ${details}`);
  }, [isAuthChecking, isRevalidating, user, dbError, isApiUp]);

  return debug;
};
