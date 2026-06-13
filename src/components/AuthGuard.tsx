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
  const isAuthorized = !!user && (!allowedRoles || (
    allowedRoles.includes(userRole || '') &&
    (userRole !== 'admin' || !allowedRoles.includes('admin') || isAdminWhitelisted === true)
  ));

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
    } else if (isInitialAuthPerformed && user && allowedRoles && !isAuthorized && !isVerifyingWhitelist && isAdminWhitelisted !== null) {
      logger.warn('[AuthGuard] Access denied: Insufficient privileges');
      toast.error('Access denied. Insufficient privileges.');
    }
    
    return () => clearTimeout(gracePeriodTimer);
  }, [user, allowedRoles, isAuthorized, isInitialAuthPerformed, location.pathname, userRole, isVerifyingWhitelist, isAdminWhitelisted, isAuthChecking, isRevalidating]);

  if (isAuthChecking || (isCheckingWhitelistNeeded && (isVerifyingWhitelist || isAdminWhitelisted === null))) {
    logger.info('[AuthGuard] Blocking render: checking auth/whitelist', { isAuthChecking, isVerifyingWhitelist, isAdminWhitelisted });
    return <LoadingFallback message="Verifying administrative access..." />;
  }

  if (isRevalidating && !user) {
    logger.info('[AuthGuard] Blocking render: revalidating');
    return <LoadingFallback message="Re-authenticating..." />;
  }

  if (isInitialAuthPerformed && !user) {
    logger.info('[AuthGuard] Blocking render: No user, redirecting to login');
    return (
      <>
        <LoadingFallback message="Redirecting to login..." />
        <Navigate to="/login" state={{ from: location }} replace />
      </>
    );
  }

  if (allowedRoles && !isAuthorized) {
    logger.warn('[AuthGuard] Blocking render: Not authorized:', { userRole, allowedRoles });
    return <Navigate to="/" replace />;
  }

  logger.info('[AuthGuard] Allowing render for:', location.pathname);
  return <>{children}</>;
}
