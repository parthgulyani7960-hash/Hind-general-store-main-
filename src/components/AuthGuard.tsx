import React, { useEffect, useRef } from 'react';
import { useLocation, Navigate } from 'react-router-dom';
import { useStore } from '../StoreContext';
import LoadingFallback from './LoadingFallback';
import toast from 'react-hot-toast';

interface AuthGuardProps {
  children: React.ReactNode;
  allowedRoles?: string[]; // e.g., ['admin', 'delivery', 'runner']
}

export default function AuthGuard({ children, allowedRoles }: AuthGuardProps) {
  const { user, isAuthChecking } = useStore();
  const location = useLocation();
  const hasShownToast = useRef(false);

  const userRole = user?.role as string | undefined;

  // Determine if user has the required role
  const isAuthorized = !allowedRoles || (user && allowedRoles.includes(userRole || ''));

  useEffect(() => {
    if (!isAuthChecking) {
      if (!user) {
        if (!hasShownToast.current) {
          toast.error('Please log in to continue');
          hasShownToast.current = true;
        }
      } else if (allowedRoles && !isAuthorized) {
        toast.error('Access denied. Insufficient privileges.');
      }
    }
  }, [user, allowedRoles, isAuthChecking, isAuthorized]);

  if (isAuthChecking) {
    return <LoadingFallback />;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !isAuthorized) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
