import { BrowserRouter as Router, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import SmartLink from './components/SmartLink';
import { NetworkBanner } from './components/NetworkBanner';
import { GlobalProgressBar } from './components/GlobalProgressBar';
import { OfflineIndicator } from './components/OfflineIndicator';
import { Toaster } from 'react-hot-toast';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import GlobalAnnouncements from './components/GlobalAnnouncements';
import MobileBottomNav from './components/MobileBottomNav';
import FloatingCart from './components/FloatingCart';
import BackToTop from './components/BackToTop';
import FullScreenAlert from './components/FullScreenAlert';
import AuthGuard from './components/AuthGuard';
import ReviewPromptNotification from './components/ReviewPromptNotification';
import ConfirmLogoutDialog from './components/ConfirmLogoutDialog';
import { AdminDiagnosticPanel } from './components/AdminDiagnosticPanel';

// Shared Vibration Helper for Flash Messages
export const triggerFeedback = (type: 'light' | 'medium' | 'heavy' = 'light') => {
  if (typeof window !== 'undefined' && 'vibrate' in navigator) {
    const patterns = {
      light: [10],
      medium: [30],
      heavy: [50, 30, 50]
    };
    navigator.vibrate(patterns[type]);
  }
};
import { useStore } from './StoreContext';
import React, { useState, Suspense, lazy, useEffect, useRef } from 'react';
import toast, { useToasterStore } from 'react-hot-toast';
import { AnimatePresence, motion } from 'motion/react';
import { cn } from './types';
import { errorService, ErrorType } from './lib/incidentReporting';
import LoadingFallback from './components/LoadingFallback';
import AppCrashBoundary from './components/AppCrashBoundary';
import { DbConnectionIssue } from './components/DbConnectionIssue';


function ToastManager() {
  const { toasts } = useToasterStore();
  const MAX_TOASTS = 4;
  
  useEffect(() => {
    toasts
      .filter((t) => t.visible)
      .filter((_, i) => i >= MAX_TOASTS)
      .forEach((t) => toast.dismiss(t.id));
  }, [toasts]);
  
  return null;
}

function ScrollToTopOnNavigate() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [pathname]);

  return null;
}

import Home from './pages/Home';
import Products from './pages/Products';
import Login from './pages/Login';

// Helper to retry lazy-loaded modules in case of temporary network dropouts or chunk failures
function lazyWithRetry<T extends React.ComponentType<any>>(
  componentImport: () => Promise<{ default: T }>
): React.LazyExoticComponent<T> {
  return lazy(async () => {
    try {
      return await componentImport();
    } catch (error) {
      console.warn('Failed to load dynamic page module, attempting automatic reload retry...', error);
      try {
        // Wait 1.5 seconds and attempt once more
        await new Promise((resolve) => setTimeout(resolve, 1500));
        return await componentImport();
      } catch (retryError) {
        console.error('Dynamic module retry load failed:', retryError);
        // Suppress fatals, return a graceful offline-ready message as a React component
        return {
          default: (() => (
            <div className="flex flex-col items-center justify-center p-8 text-center min-h-[60vh] bg-stone-50 select-text">
              <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center mb-4 text-amber-500 animate-pulse">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-stone-800">Connection Interrupted</h3>
              <p className="text-sm text-stone-500 mt-2 max-w-sm leading-relaxed">
                We couldn't connect to the server to load this section. Please check your network and try again.
              </p>
              <button 
                onClick={() => window.location.reload()} 
                className="mt-6 px-5 py-2.5 bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-md active:scale-[0.98]"
              >
                Reload App
              </button>
            </div>
          )) as unknown as T
        };
      }
    }
  });
}

// Aggressive Route-based Code Splitting to optimize 3.5MB bundle size
const ProductDetail = lazyWithRetry(() => import('./pages/ProductDetail'));
const Cart = lazyWithRetry(() => import('./pages/Cart'));
const Checkout = lazyWithRetry(() => import('./pages/Checkout'));
const Invoice = lazyWithRetry(() => import('./pages/Invoice'));
const Support = lazyWithRetry(() => import('./pages/Support'));
const Wishlist = lazyWithRetry(() => import('./pages/Wishlist'));
const Profile = lazyWithRetry(() => import('./pages/Profile'));
const Promotions = lazyWithRetry(() => import('./pages/Promotions'));
const AboutUs = lazyWithRetry(() => import('./pages/AboutUs'));
const TermsAndConditions = lazyWithRetry(() => import('./pages/TermsAndConditions'));
const PrivacyPolicy = lazyWithRetry(() => import('./pages/PrivacyPolicy'));
const AddMoney = lazyWithRetry(() => import('./pages/AddMoney'));
const ActivityLogs = lazyWithRetry(() => import('./pages/ActivityLogs'));
const LegalPage = lazyWithRetry(() => import('./pages/LegalPage'));
const AdminDashboard = lazyWithRetry(() => import('./pages/AdminDashboard'));
const AdminPayments = lazyWithRetry(() => import('./pages/AdminPayments'));
const DeliveryDashboard = lazyWithRetry(() => import('./pages/DeliveryDashboard'));
const MaintenancePage = lazyWithRetry(() => import('./pages/MaintenancePage'));
const TrackOrder = lazyWithRetry(() => import('./pages/TrackOrder'));
const UserActivity = lazyWithRetry(() => import('./pages/UserActivityV2'));



function AnimatedRoutes() {
  const location = useLocation();
  const { 
    isMaintenance, 
    user, 
    isAuthChecking, 
    subscribeNewsletter, 
    config = [], 
    t, 
    isInitialAuthPerformed,
    categories,
    isOnline,
    isApiUp
  } = useStore();
  
  const globalCategories = categories || [];
  
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const isAdmin = user && user.role === 'admin';
  
  const handleNewsletter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail) return;
    if (!window.confirm('Are you sure you want to subscribe to our newsletter?')) return;
    await subscribeNewsletter(newsletterEmail);
    setNewsletterEmail('');
  };

  console.log('[ANIMATED_ROUTES] Rendering routes for path:', location.pathname, { isAuthChecking, isInitialAuthPerformed });

  if (isAuthChecking && !isInitialAuthPerformed) {
    console.log('[ANIMATED_ROUTES] Showing initial loading screen');
    return <LoadingFallback message="Initializing store..." />;
  }

  if (isMaintenance && !isAdmin) {
    return (
      <Suspense fallback={<LoadingFallback message="System update in progress..." />}>
        <MaintenancePage />
      </Suspense>
    );
  }

  const showFooter = ['/', '/profile'].includes(location.pathname);

  return (
    <Suspense fallback={<LoadingFallback message="Loading..." />}>
      <div id="application-content-root" className="min-h-full flex flex-col relative bg-white">
        <div className="flex-1 flex flex-col">
          <AppCrashBoundary fallback={<div className="p-20 text-center"><h1>Application Error</h1><p>We encountered a critical crash. Please reload.</p><button onClick={() => window.location.reload()} className="btn-primary mt-4">Reload App</button></div>}>
            <AnimatePresence mode="wait" initial={false}>
              <Routes location={location} key={location.pathname}>
                <Route path="/" element={<PageWrapper><Home /></PageWrapper>} />
                <Route path="/products" element={<PageWrapper><Products /></PageWrapper>} />
                <Route path="/product/:id" element={<PageWrapper><ProductDetail /></PageWrapper>} />
                <Route path="/cart" element={<PageWrapper><Cart /></PageWrapper>} />
                <Route path="/promotions" element={<PageWrapper><Promotions /></PageWrapper>} />
                <Route path="/about" element={<PageWrapper><AboutUs /></PageWrapper>} />
                <Route path="/checkout" element={<AuthGuard><PageWrapper><Checkout /></PageWrapper></AuthGuard>} />
                <Route path="/invoice/:id" element={<AuthGuard><PageWrapper><Invoice /></PageWrapper></AuthGuard>} />
                <Route path="/wishlist" element={<AuthGuard><PageWrapper><Wishlist /></PageWrapper></AuthGuard>} />
                <Route path="/profile" element={<AuthGuard><PageWrapper><Profile /></PageWrapper></AuthGuard>} />
                <Route path="/add-money" element={<AuthGuard><PageWrapper><AddMoney /></PageWrapper></AuthGuard>} />
                <Route path="/admin/activity-logs" element={<AuthGuard allowedRoles={['admin']}><PageWrapper><ActivityLogs /></PageWrapper></AuthGuard>} />
                <Route path="/admin" element={<AuthGuard allowedRoles={['admin']}><PageWrapper><AdminDashboard /></PageWrapper></AuthGuard>} />
                <Route path="/admin/payments" element={<AuthGuard allowedRoles={['admin']}><PageWrapper><AdminPayments /></PageWrapper></AuthGuard>} />
                <Route path="/runner" element={<AuthGuard allowedRoles={['delivery', 'runner', 'admin']}><PageWrapper><DeliveryDashboard /></PageWrapper></AuthGuard>} />
                <Route path="/history" element={<AuthGuard><PageWrapper><UserActivity /></PageWrapper></AuthGuard>} />
                <Route path="/track-order" element={<AuthGuard><PageWrapper><TrackOrder /></PageWrapper></AuthGuard>} />
                <Route path="/support" element={<PageWrapper><Support /></PageWrapper>} />
                <Route path="/contact" element={<PageWrapper><Support /></PageWrapper>} />
                <Route path="/login" element={<PageWrapper><Login /></PageWrapper>} />
                <Route path="/privacy-policy" element={<PageWrapper><PrivacyPolicy /></PageWrapper>} />
                <Route path="/terms-and-conditions" element={<PageWrapper><TermsAndConditions /></PageWrapper>} />
                <Route path="/legal" element={<PageWrapper><LegalPage title="Legal Information" type="privacy" /></PageWrapper>} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </AnimatePresence>
          </AppCrashBoundary>
        </div>
        
        {showFooter && (
          <Footer 
            config={config} 
            handleNewsletter={handleNewsletter} 
            newsletterEmail={newsletterEmail} 
            setNewsletterEmail={setNewsletterEmail} 
          />
        )}
      </div>
    </Suspense>
  );
}

function PageWrapper({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  useEffect(() => {
    console.log(`[PAGE_WRAPPER] Mounted for path: ${location.pathname}`);
  }, [location.pathname]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="flex-1 flex flex-col relative"
    >
      <Suspense fallback={<LoadingFallback message="Loading content..." fullScreen={false} />}>
         {children}
      </Suspense>
    </motion.div>
  );
}

export default function App() {
  const store = useStore();
  const { adminTheme, dbError, showLogoutDialog, setShowLogoutDialog, performLogout } = store;

  useEffect(() => {
    // Notify the bootstrap monitor that the React application is mounting successfully
    if (typeof window !== 'undefined') {
      (window as any).__markAppAsLoaded?.();
    }

    // Global error handler
    const handleGlobalError = (event: ErrorEvent) => {
      errorService.report({
        type: ErrorType.SYSTEM_ERROR,
        message: event.message || 'Global Runtime Error',
        stack: event.error?.stack,
        userId: String(store.user?.id || '')
      });
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      errorService.report({
        type: ErrorType.SYSTEM_ERROR,
        message: event.reason?.message || 'Unhandled Promise Rejection',
        stack: event.reason?.stack || String(event.reason),
        userId: String(store.user?.id || '')
      });
    };

    const handleSessionExpired = () => {
      toast.error('Session expired, please sign in again');
    };

    window.addEventListener('error', handleGlobalError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    window.addEventListener('session_expired', handleSessionExpired);
    
    return () => {
      window.removeEventListener('error', handleGlobalError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      window.removeEventListener('session_expired', handleSessionExpired);
    };
  }, []);

  if (dbError) {
    return <DbConnectionIssue />;
  }

  return (
    <Router>
      <ScrollToTopOnNavigate />
      <ReviewPromptNotification />
      <FullScreenAlert />
      <div className={cn("min-h-screen flex flex-col pt-safe", adminTheme)}>
        <OfflineIndicator />
        <GlobalProgressBar />
        <GlobalAnnouncements />
        <ToastManager />
        <Toaster position="top-center" />
        <Navbar />
        <ConfirmLogoutDialog 
          isOpen={showLogoutDialog} 
          onClose={() => setShowLogoutDialog(false)} 
          onConfirm={performLogout} 
        />
        <main className="flex-1 pb-24 md:pb-0 relative">
          <AdminDiagnosticPanel />
          <AnimatedRoutes />
        </main>
        <MobileBottomNav />
        <FloatingCart />
        <BackToTop />
      </div>
    </Router>
  );
}
