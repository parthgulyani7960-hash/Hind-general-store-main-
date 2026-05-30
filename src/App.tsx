import { BrowserRouter as Router, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { NetworkBanner } from './components/NetworkBanner';
import { Toaster } from 'react-hot-toast';
import Navbar from './components/Navbar';
import GlobalAnnouncements from './components/GlobalAnnouncements';
import MobileBottomNav from './components/MobileBottomNav';
import FloatingCart from './components/FloatingCart';
import BackToTop from './components/BackToTop';
import FullScreenAlert from './components/FullScreenAlert';
import AuthErrorReloader from './components/AuthErrorReloader';
import ReviewPromptNotification from './components/ReviewPromptNotification';

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
import { errorService, ErrorType } from './lib/errorReporting';
import LoadingFallback from './components/LoadingFallback';
import ErrorBoundary from './components/ErrorBoundary';

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

function ProtectedRoute({ children, adminOnly = false, runnerOnly = false }: { children: React.ReactNode; adminOnly?: boolean; runnerOnly?: boolean }) {
  const { user, isAuthChecking } = useStore();
  const location = useLocation();

  const isUserAdmin = user && (user.role as any) === 'admin';
  const isUserRunner = user && ((user.role as any) === 'delivery' || (user.role as any) === 'runner' || isUserAdmin);

  const hasShownNotLoggedInToast = useRef(false);

  useEffect(() => {
    if (!isAuthChecking) {
      if (!user && window.location.pathname !== '/login') {
        if (!hasShownNotLoggedInToast.current) {
          toast.error('Please log in to use these services');
          hasShownNotLoggedInToast.current = true;
        }
      } else if (adminOnly && !isUserAdmin) {
        toast.error('Access denied. Admin privileges required.');
      } else if (runnerOnly && !isUserRunner) {
        toast.error('Access denied. Delivery runner privileges required.');
      }
    }
  }, [user, adminOnly, runnerOnly, isAuthChecking, isUserAdmin, isUserRunner]);

  if (isAuthChecking) {
    return <LoadingFallback />;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (adminOnly && !isUserAdmin) {
    return <Navigate to="/" replace />;
  }

  if (runnerOnly && !isUserRunner) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

function AnimatedRoutes() {
  const location = useLocation();
  const { isMaintenance, user, isAuthChecking, subscribeNewsletter, config = [], t } = useStore();
  const [newsletterEmail, setNewsletterEmail] = useState('');
  
  const isAdmin = user && user.role === 'admin';

  const handleNewsletter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail) return;
    if (!window.confirm('Are you sure you want to subscribe to our newsletter?')) return;
    await subscribeNewsletter(newsletterEmail);
    setNewsletterEmail('');
  };

  if (isMaintenance && !isAdmin) {
    return (
      <Suspense fallback={<LoadingFallback message="System update in progress..." />}>
        <MaintenancePage />
      </Suspense>
    );
  }

  const showFooter = ['/', '/profile'].includes(location.pathname);

  return (
    <Suspense fallback={<LoadingFallback />}>
      <AnimatePresence mode="wait">
        {/* @ts-ignore */}
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<PageWrapper><Home /></PageWrapper>} />
          <Route path="/products" element={<PageWrapper><Products /></PageWrapper>} />
          <Route path="/product/:id" element={<PageWrapper><ProductDetail /></PageWrapper>} />
          <Route path="/cart" element={<PageWrapper><Cart /></PageWrapper>} />
          <Route path="/promotions" element={<PageWrapper><Promotions /></PageWrapper>} />
          <Route path="/about" element={<PageWrapper><AboutUs /></PageWrapper>} />
          <Route path="/checkout" element={<ProtectedRoute><PageWrapper><Checkout /></PageWrapper></ProtectedRoute>} />
          <Route path="/invoice/:id" element={<ProtectedRoute><PageWrapper><Invoice /></PageWrapper></ProtectedRoute>} />
          <Route path="/login" element={<PageWrapper><Login /></PageWrapper>} />
          <Route path="/support" element={<PageWrapper><Support /></PageWrapper>} />
          <Route path="/wishlist" element={<ProtectedRoute><PageWrapper><Wishlist /></PageWrapper></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><PageWrapper><Profile /></PageWrapper></ProtectedRoute>} />
          <Route path="/privacy-policy" element={<PageWrapper><PrivacyPolicy /></PageWrapper>} />
          <Route path="/add-money" element={<ProtectedRoute><PageWrapper><AddMoney /></PageWrapper></ProtectedRoute>} />
          <Route path="/admin/activity-logs" element={<ProtectedRoute adminOnly><PageWrapper><ActivityLogs /></PageWrapper></ProtectedRoute>} />
          <Route path="/terms-and-conditions" element={<PageWrapper><TermsAndConditions /></PageWrapper>} />
          <Route path="/contact" element={<PageWrapper><Support /></PageWrapper>} />
          <Route path="/admin" element={<ProtectedRoute adminOnly><PageWrapper><AdminDashboard /></PageWrapper></ProtectedRoute>} />
          <Route path="/admin/payments" element={<ProtectedRoute adminOnly><PageWrapper><AdminPayments /></PageWrapper></ProtectedRoute>} />
          <Route path="/runner" element={<ProtectedRoute runnerOnly><PageWrapper><DeliveryDashboard /></PageWrapper></ProtectedRoute>} />
          <Route path="/track-order" element={<PageWrapper><TrackOrder /></PageWrapper>} />
          <Route path="/history" element={<ProtectedRoute><PageWrapper><UserActivity /></PageWrapper></ProtectedRoute>} />
        </Routes>
      </AnimatePresence>
      {showFooter && (
        <footer className="bg-stone-900 text-stone-400 py-12 pb-32 md:pb-12 mt-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <h3 className="text-white font-bold text-lg">General Store Karyana Shop</h3>
              <p className="text-sm">Your one-stop shop for all karyana and daily essentials. Quality and trust since 1995.</p>
            </div>
            <div className="space-y-4">
              <h3 className="text-white font-bold text-lg">Quick Links</h3>
              <ul className="space-y-2 text-sm">
                <li><Link to="/products" className="hover:text-white transition-colors">All Products</Link></li>
                <li><Link to="/track-order" className="hover:text-white transition-colors">Track Order</Link></li>
                <li><Link to="/support" className="hover:text-white transition-colors">Help & Support</Link></li>
                <li><Link to="/login" className="hover:text-white transition-colors">My Account</Link></li>
              </ul>
            </div>
            <div className="space-y-4">
              <h3 className="text-white font-bold text-lg">Customer Care</h3>
              <ul className="space-y-2 text-sm">
                <li><Link to="/about" className="hover:text-white transition-colors">About Us</Link></li>
                <li><Link to="/contact" className="hover:text-white transition-colors">Contact Us</Link></li>
                <li><Link to="/privacy-policy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
                <li><Link to="/terms-and-conditions" className="hover:text-white transition-colors">Terms & Conditions</Link></li>
              </ul>
            </div>
            <div className="space-y-4">
              <h3 className="text-white font-bold text-lg">Newsletter</h3>
              <p className="text-sm">Subscribe to get special offers and updates.</p>
              <form onSubmit={handleNewsletter} className="flex">
                <input 
                  type="email" 
                  placeholder="Email" 
                  required
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  className="bg-stone-800 border-none rounded-l-lg px-4 py-2 w-full focus:ring-1 focus:ring-primary" 
                />
                <button type="submit" className="bg-primary text-white px-4 py-2 rounded-r-lg font-bold">Join</button>
              </form>
            </div>
          </div>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 pt-8 border-t border-stone-800 text-center text-xs">
            © {new Date().getFullYear()} {(config || []).find(c => c.key === 'store_name')?.value || 'New Hind General Store'}. All rights reserved.
          </div>
        </footer>
      )}
    </Suspense>
  );
}

function PageWrapper({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ 
        duration: 0.5, 
        ease: [0.22, 1, 0.36, 1],
        scale: { duration: 0.6, ease: [0.22, 1, 0.36, 1] }
      }}
      className="page-transition-wrapper origin-top"
    >
      <Suspense fallback={<LoadingFallback message="Loading content..." fullScreen={false} />}>
         {children}
      </Suspense>
    </motion.div>
  );
}

export default function App() {
  const store = useStore();
  const { adminTheme } = store;

  useEffect(() => {
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

    window.addEventListener('error', handleGlobalError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    return () => {
      window.removeEventListener('error', handleGlobalError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  return (
    <Router>
      <ScrollToTopOnNavigate />
      <AuthErrorReloader />
      <ReviewPromptNotification />
      <FullScreenAlert />
      <div className={cn("min-h-screen flex flex-col pt-safe", adminTheme)}>
        <NetworkBanner />
        <GlobalAnnouncements />
        <ToastManager />
        <Toaster position="top-center" />
        <Navbar />
        <main className="flex-1 pb-24 md:pb-0">
          <ErrorBoundary>
            <AnimatedRoutes />
          </ErrorBoundary>
        </main>
        <MobileBottomNav />
        <FloatingCart />
        <BackToTop />
      </div>
    </Router>
  );
}
