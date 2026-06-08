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
          logger.error('[AuthGuard] Error checking admin whitelist');
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
    (!allowedRoles.includes('admin') || isAdminWhitelisted === true)
  ));

  useEffect(() => {
    if (isInitialAuthPerformed && !user) {
        logger.warn('[AuthGuard] Access denied: User not authenticated');
        if (!hasShownToast.current) {
          toast.error('Please log in to continue');
          hasShownToast.current = true;
        }
    } else if (isInitialAuthPerformed && user && allowedRoles && !isAuthorized && !isVerifyingWhitelist && isAdminWhitelisted !== null) {
        logger.warn('[AuthGuard] Access denied: Insufficient privileges');
        toast.error('Access denied. Insufficient privileges.');
    }
  }, [user, allowedRoles, isAuthorized, isInitialAuthPerformed, location.pathname, userRole, isVerifyingWhitelist, isAdminWhitelisted]);

  if (isAuthChecking || (isCheckingWhitelistNeeded && (isVerifyingWhitelist || isAdminWhitelisted === null))) {
    return <LoadingFallback message="Verifying administrative access..." />;
  }

  if (isRevalidating && !user) {
    return <LoadingFallback message="Re-authenticating..." />;
  }

  if (isInitialAuthPerformed && !user) {
    return (
      <>
        <LoadingFallback message="Redirecting to login..." />
        <Navigate to="/login" state={{ from: location }} replace />
      </>
    );
  }

  if (allowedRoles && !isAuthorized) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
