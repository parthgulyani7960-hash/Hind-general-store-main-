import { useState, useEffect } from 'react';
import { useStore } from '@/StoreContext';

/**
 * Diagnostic hook for the Profile page to monitor auth/data loading states.
 * Helps identify why a blank screen occurs.
 */
export const useProfileDiagnostics = (isFetchingUser: boolean) => {
  const { isAuthChecking, dbError, isApiUp, user } = useStore();
  const [debugState, setDebugState] = useState<string>('Initializing');

  useEffect(() => {
    let status = 'Loading...';
    
    if (isAuthChecking) {
      status = 'Auth Checking';
    } else if (isFetchingUser) {
      status = 'Fetching User Data';
    } else if (dbError) {
      status = 'Database Error';
    } else if (!isApiUp) {
      status = 'API Offline';
    } else if (!user) {
      status = 'Auth Wall (No User)';
    } else {
      status = 'Ready';
    }
    
    setDebugState(status);
    console.log(`[Profile Diagnostics] Current status: ${status}`);
  }, [isAuthChecking, isFetchingUser, dbError, isApiUp, user]);

  return { debugState, isAuthChecking, isFetchingUser, dbError, isApiUp };
};
