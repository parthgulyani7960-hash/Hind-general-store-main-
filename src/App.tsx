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
import React, { useState, Suspense, lazy, useEffect } from 'react';
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

// Aggressive Route-based Code Splitting to optimize 3.5MB bundle size
const ProductDetail = lazy(() => import('./pages/ProductDetail'));
const Cart = lazy(() => import('./pages/Cart'));
const Checkout = lazy(() => import('./pages/Checkout'));
const Invoice = lazy(() => import('./pages/Invoice'));
const CompleteProfile = lazy(() => import('./pages/CompleteProfile'));
const Support = lazy(() => import('./pages/Support'));
const Wishlist = lazy(() => import('./pages/Wishlist'));
const Profile = lazy(() => import('./pages/Profile'));
const Promotions = lazy(() => import('./pages/Promotions'));
const AboutUs = lazy(() => import('./pages/AboutUs'));
const TermsAndConditions = lazy(() => import('./pages/TermsAndConditions'));
const LegalPage = lazy(() => import('./pages/LegalPage'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const AdminPayments = lazy(() => import('./pages/AdminPayments'));
const DeliveryDashboard = lazy(() => import('./pages/DeliveryDashboard'));
const MaintenancePage = lazy(() => import('./pages/MaintenancePage'));
const TrackOrder = lazy(() => import('./pages/TrackOrder'));

function ProtectedRoute({ children, adminOnly = false, runnerOnly = false }: { children: React.ReactNode; adminOnly?: boolean; runnerOnly?: boolean }) {
  const { user, isAuthChecking } = useStore();
  const location = useLocation();

  useEffect(() => {
    if (!isAuthChecking) {
      if (!user && window.location.pathname !== '/login') {
        toast.error('Please log in to use these services');
      } else if (adminOnly && user && user.role !== 'admin') {
        toast.error('Access denied. Admin privileges required.');
      } else if (runnerOnly && user && user.role !== 'delivery' && user.role !== 'admin') {
        toast.error('Access denied. Delivery runner privileges required.');
      }
    }
  }, [user, adminOnly, runnerOnly, isAuthChecking]);

  if (isAuthChecking) {
    return <LoadingFallback />;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (adminOnly && user.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  if (runnerOnly && user.role !== 'delivery' && user.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

function AnimatedRoutes() {
  const location = useLocation();
  const { isMaintenance, user, isAuthChecking } = useStore();
  
  // Secret bypass check: if URL has ?bypass=admin_bypass_2024
  const hasBypass = new URLSearchParams(window.location.search).get('bypass') === 'admin_bypass_2024';
  const isAdmin = user?.role === 'admin';

  if (isAuthChecking) {
    return <LoadingFallback message="Synchronizing secure session..." />;
  }

  if (isMaintenance && !isAdmin && !hasBypass) {
    return (
      <Suspense fallback={<LoadingFallback message="Entering maintenance mode..." />}>
        <MaintenancePage />
      </Suspense>
    );
  }

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
          <Route path="/complete-profile" element={<ProtectedRoute><PageWrapper><CompleteProfile /></PageWrapper></ProtectedRoute>} />
          <Route path="/support" element={<PageWrapper><Support /></PageWrapper>} />
          <Route path="/wishlist" element={<ProtectedRoute><PageWrapper><Wishlist /></PageWrapper></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><PageWrapper><Profile /></PageWrapper></ProtectedRoute>} />
          <Route path="/privacy-policy" element={<PageWrapper><LegalPage title="Privacy Policy" type="privacy" /></PageWrapper>} />
          <Route path="/terms-and-conditions" element={<PageWrapper><TermsAndConditions /></PageWrapper>} />
          <Route path="/contact" element={<PageWrapper><Support /></PageWrapper>} />
          <Route path="/admin" element={<ProtectedRoute adminOnly><PageWrapper><AdminDashboard /></PageWrapper></ProtectedRoute>} />
          <Route path="/admin/payments" element={<ProtectedRoute adminOnly><PageWrapper><AdminPayments /></PageWrapper></ProtectedRoute>} />
          <Route path="/runner" element={<ProtectedRoute runnerOnly><PageWrapper><DeliveryDashboard /></PageWrapper></ProtectedRoute>} />
          <Route path="/track-order" element={<PageWrapper><TrackOrder /></PageWrapper>} />
        </Routes>
      </AnimatePresence>
    </Suspense>
  );
}

function PageWrapper({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -30 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="page-transition-wrapper"
    >
      <Suspense fallback={<LoadingFallback message="Loading content..." />}>
         {children}
      </Suspense>
    </motion.div>
  );
}

export default function App() {
  const store = useStore();
  const { subscribeNewsletter, adminTheme, t, config = [] } = store;
  const [newsletterEmail, setNewsletterEmail] = useState('');

  useEffect(() => {
    // Global error handler
    const handleGlobalError = (event: ErrorEvent) => {
      errorService.report({
        type: ErrorType.SYSTEM_ERROR,
        message: event.message || 'Global Runtime Error',
        stack: event.error?.stack,
        userId: store.user?.id
      });
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      errorService.report({
        type: ErrorType.SYSTEM_ERROR,
        message: event.reason?.message || 'Unhandled Promise Rejection',
        stack: event.reason?.stack || String(event.reason),
        userId: store.user?.id
      });
    };

    window.addEventListener('error', handleGlobalError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    return () => {
      window.removeEventListener('error', handleGlobalError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  const handleNewsletter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail) return;
    if (!window.confirm('Are you sure you want to subscribe to our newsletter?')) return;
    await subscribeNewsletter(newsletterEmail);
    setNewsletterEmail('');
  };

  return (
    <Router>
      <ScrollToTopOnNavigate />
      <AuthErrorReloader />
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
        <footer className="bg-stone-900 text-stone-400 py-12 pb-32 md:pb-12">
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
            © {new Date().getFullYear()} {config.find(c => c.key === 'store_name')?.value || 'Hind General Store'}. All rights reserved.
          </div>
        </footer>
      </div>
    </Router>
  );
}
