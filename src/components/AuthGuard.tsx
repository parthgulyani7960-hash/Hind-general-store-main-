import React, { useEffect, useRef, useState } from 'react';
import { useLocation, Navigate } from 'react-router-dom';
import { useStore } from '../StoreContext';
import LoadingFallback from './LoadingFallback';
import toast from 'react-hot-toast';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { logger } from '@/lib/logger';

interface AuthGuardProps {
  children: React.ReactNode;
  allowedRoles?: string[]; // e.g., ['admin', 'delivery', 'runner']
}

export default function AuthGuard({ children, allowedRoles }: AuthGuardProps) {
  const { user, isAuthChecking, isRevalidating, isInitialAuthPerformed } = useStore();
  const location = useLocation();
  const hasShownToast = useRef(false);

  const [isAdminWhitelisted, setIsAdminWhitelisted] = useState<boolean | null>(null);
  const [isVerifyingWhitelist, setIsVerifyingWhitelist] = useState(false);

  const userRole = user?.role as string | undefined;
  const userEmail = user?.email;
  const isCheckingWhitelistNeeded = !!allowedRoles && allowedRoles.includes('admin') && !!user;

  useEffect(() => {
    let active = true;
    
    // If the user already has the 'admin' role in their profile, skip the whitelist check
    // as the source of truth for the session already confirmed their identity.
    if (userRole === 'admin') {
      setIsAdminWhitelisted(true);
      return;
    }

    if (isCheckingWhitelistNeeded && userEmail && isAdminWhitelisted === null && !isVerifyingWhitelist) {
      setIsVerifyingWhitelist(true);
      const cleanEmail = userEmail.replace(/\s+/g, '').trim().toLowerCase();
      const docRef = doc(db, 'admin_whitelist', cleanEmail);
      getDoc(docRef)
        .then((docSnap) => {
          if (active) {
            if (docSnap.exists() && docSnap.data()?.status === 'active') {
              setIsAdminWhitelisted(true);
            } else {
              setIsAdminWhitelisted(false);
              logger.warn('[AuthGuard] Administrative access denied: Whitelist verification failed');
            }
          }
        })
        .catch((err) => {
          logger.error('[AuthGuard] Error checking admin whitelist', {
            error: err instanceof Error ? err.message : String(err),
            stack: err instanceof Error ? err.stack : undefined,
            email: cleanEmail
          });
          if (active) {
            setIsAdminWhitelisted(false);
          }
        })
        .finally(() => {
          if (active) {
            setIsVerifyingWhitelist(false);
          }
        });
    }
    return () => {
      active = false;
    };
  }, [isCheckingWhitelistNeeded, userEmail, isAdminWhitelisted, isVerifyingWhitelist]);

  // Determine if user has the required role
  const isAuthorized = !!user && (!allowedRoles || allowedRoles.includes(userRole || ''));

  useEffect(() => {
    // Add a grace period to prevent false auth-wall triggers on slow mobile networks
    const gracePeriodTimer = setTimeout(() => {
        logger.info('[AuthGuard] Grace period expired, checking auth finality...');
    }, 2000);

    logger.info('[AuthGuard] Mount/Update state:', {
      user: user ? String(user.id) : 'null',
      isAuthChecking,
      isInitialAuthPerformed,
      isRevalidating,
      location: location.pathname
    });

    if (isInitialAuthPerformed && !user) {
      logger.warn('[AuthGuard] Access denied: User not authenticated');
      if (!hasShownToast.current) {
        // Use a short delay to ensure toast is visible after navigation
        setTimeout(() => {
          if (!hasShownToast.current) {
             toast.error('Logging into Hind Store...', { id: 'auth-redirect-toast' });
             hasShownToast.current = true;
          }
        }, 100);
      }
    } else if (isInitialAuthPerformed && user && allowedRoles && !isAuthorized) {
      logger.warn('[AuthGuard] Access denied: Insufficient privileges');
      toast.error('Access denied. Insufficient privileges.');
    }
    
    return () => clearTimeout(gracePeriodTimer);
  }, [user, allowedRoles, isAuthorized, isInitialAuthPerformed, location.pathname, userRole, isAuthChecking, isRevalidating]);

  if (!isInitialAuthPerformed || isAuthChecking) {
    return <LoadingFallback message="Verifying credentials..." />;
  }

  if (isRevalidating && !user) {
    return <LoadingFallback message="Refreshing session..." />;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !isAuthorized) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
