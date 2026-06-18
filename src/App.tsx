import { BrowserRouter as Router, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import HeadOptimizer from './components/HeadOptimizer';
import SmartLink from './components/SmartLink';
import { NetworkBanner } from './components/NetworkBanner';
import { GlobalProgressBar } from './components/GlobalProgressBar';
import { OfflineIndicator } from './components/OfflineIndicator';
import { Toaster } from 'react-hot-toast';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import MobileBottomNav from './components/MobileBottomNav';
import BackToTop from './components/BackToTop';
import AuthGuard from './components/AuthGuard';
import { TopPromotionTicker } from './components/TopPromotionTicker';
import { AdminDiagnosticPanel } from './components/AdminDiagnosticPanel';

import { triggerFeedback } from './lib/feedback';
export { triggerFeedback };
import { useStore, StoreProvider } from './StoreContext';
import { LanguageProvider } from './LanguageContext';
import React, { useState, Suspense, lazy, useEffect, useRef } from 'react';
import toast, { useToasterStore } from 'react-hot-toast';
import { AnimatePresence, motion } from 'motion/react';
import { cn } from '@/lib/utils';
import { AlertTriangle } from 'lucide-react';
import { errorService, ErrorType } from './lib/incidentReporting';
import LoadingFallback from './components/LoadingFallback';
import AppCrashBoundary from './components/AppCrashBoundary';
import { DbConnectionIssue } from './components/DbConnectionIssue';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';


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

import { lazyWithRetry } from './lib/lazyLoader';

// High-Priority Core Pages
const Home = lazyWithRetry(() => import('./pages/Home'), 'Home');
const Products = lazyWithRetry(() => import('./pages/Products'), 'Products');
const Login = lazyWithRetry(() => import('./pages/Login'), 'Login');

// Preload helper for admin dashboard
const preloadAdmin = () => {
  import('./pages/AdminDashboard').catch(() => {});
  import('./pages/AdminPayments').catch(() => {});
};

// Aggressive Route-based Code Splitting to optimize 3.5MB bundle size
const ProductDetail = lazyWithRetry(() => import('./pages/ProductDetail'), 'ProductDetail');
const Cart = lazyWithRetry(() => import('./pages/Cart'), 'Cart');
const Checkout = lazyWithRetry(() => import('./pages/Checkout'), 'Checkout');
const Invoice = lazyWithRetry(() => import('./pages/Invoice'), 'Invoice');
const Support = lazyWithRetry(() => import('./pages/Support'), 'Support');
const Wishlist = lazyWithRetry(() => import('./pages/Wishlist'), 'Wishlist');
const Profile = lazyWithRetry(() => import('./pages/Profile'), 'Profile');
const Promotions = lazyWithRetry(() => import('./pages/Promotions'), 'Promotions');
const AboutUs = lazyWithRetry(() => import('./pages/AboutUs'), 'AboutUs');
const TermsAndConditions = lazyWithRetry(() => import('./pages/TermsAndConditions'), 'Terms');
const PrivacyPolicy = lazyWithRetry(() => import('./pages/PrivacyPolicy'), 'Privacy');
const AddMoney = lazyWithRetry(() => import('./pages/AddMoney'), 'Wallet');
const ActivityLogs = lazyWithRetry(() => import('./pages/ActivityLogs'), 'ActivityLogs');
const LegalPage = lazyWithRetry(() => import('./pages/LegalPage'), 'Legal');
const AdminDashboard = lazyWithRetry(() => import('./pages/AdminDashboard'), 'AdminDashboard');
const AdminPayments = lazyWithRetry(() => import('./pages/AdminPayments'), 'AdminPayments');
const DeliveryDashboard = lazyWithRetry(() => import('./pages/DeliveryDashboard'), 'Runner');
const MaintenancePage = lazyWithRetry(() => import('./pages/MaintenancePage'), 'Maintenance');
const TrackOrder = lazyWithRetry(() => import('./pages/TrackOrder'), 'Tracker');
const UserActivity = lazyWithRetry(() => import('./pages/UserActivityV2'), 'Activity');

// Lazy-loaded secondary overlay UI components for initial bundle size optimization
const ConfirmLogoutDialog = lazyWithRetry(() => import('./components/ConfirmLogoutDialog'), 'ConfirmLogoutDialog');
const ReviewPromptNotification = lazyWithRetry(() => import('./components/ReviewPromptNotification'), 'ReviewPromptNotification');
const FullScreenAlert = lazyWithRetry(() => import('./components/FullScreenAlert'), 'FullScreenAlert');
const FloatingCart = lazyWithRetry(() => import('./components/FloatingCart'), 'FloatingCart');
const GlobalAnnouncements = lazyWithRetry(() => import('./components/GlobalAnnouncements'), 'GlobalAnnouncements');

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
  
  const { showHelp, setShowHelp } = useKeyboardShortcuts();

  // Preload admin pages if user is admin
  useEffect(() => {
    if (isInitialAuthPerformed && user?.role === 'admin') {
      preloadAdmin();
    }
  }, [isInitialAuthPerformed, user?.role]);
  
  useEffect(() => {
    if (showHelp) {
      const handleCloseAll = () => {
        setShowHelp(false);
      };
      window.addEventListener('close-all-modals', handleCloseAll);
      return () => {
        window.removeEventListener('close-all-modals', handleCloseAll);
      };
    }
  }, [showHelp, setShowHelp]);

  const globalCategories = categories || [];
  
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const isAdmin = user && user.role === 'admin';
  
  const handleNewsletter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail) return;
    if (!window.confirm('Are you sure you want to subscribe to our newsletter?')) return;
    const success = await subscribeNewsletter(newsletterEmail);
    if (success) {
      setNewsletterEmail('');
    }
  };

  if (isAuthChecking && !isInitialAuthPerformed) {
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

      {/* Keyboard Shortcut Help Cheat Sheet Modal */}
      <AnimatePresence>
        {showHelp && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-stone-950 backdrop-blur-sm"
              onClick={() => setShowHelp(false)}
            />
            {/* Dialog body */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: "spring", duration: 0.4 }}
              className="bg-white rounded-[2.5rem] border border-stone-100 p-8 w-full max-w-sm shadow-2xl relative z-10 flex flex-col items-stretch overflow-hidden select-none"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-6 shrink-0">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-stone-50 rounded-lg border border-stone-100 text-stone-900 font-mono text-xs font-black shadow-sm">
                    ⌘
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-stone-900 tracking-tight leading-none">Keyboard Shortcuts</h3>
                    <p className="text-[9px] text-stone-400 font-bold uppercase tracking-widest mt-1">Universal Navigation</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowHelp(false)}
                  className="p-2 bg-stone-50 hover:bg-stone-100 border border-stone-100 rounded-full text-stone-400 hover:text-stone-900 transition-colors"
                >
                  ✕
                </button>
              </div>

              {/* Shortcuts list container */}
              <div className="space-y-4">
                <p className="text-[11px] text-stone-500 leading-relaxed bg-stone-50 py-2.5 px-4 rounded-xl border border-stone-100">
                  Quickly navigate across the shop and manage interfaces with these global developer keys.
                </p>
                
                <div className="divide-y divide-stone-100 text-[13px]">
                  <div className="flex items-center justify-between py-2.5">
                    <span className="font-medium text-stone-600">Go to Home Page</span>
                    <kbd className="px-2 py-0.5 bg-stone-50 rounded border border-stone-200 border-b-2 font-mono text-xs font-black shadow-sm text-stone-700">G</kbd>
                  </div>
                  <div className="flex items-center justify-between py-2.5">
                    <span className="font-medium text-stone-600">Open Shopping Cart</span>
                    <kbd className="px-2 py-0.5 bg-stone-50 rounded border border-stone-200 border-b-2 font-mono text-xs font-black shadow-sm text-stone-700">C</kbd>
                  </div>
                  <div className="flex items-center justify-between py-2.5">
                    <span className="font-medium text-stone-600">Go to My Profile</span>
                    <kbd className="px-2 py-0.5 bg-stone-50 rounded border border-stone-200 border-b-2 font-mono text-xs font-black shadow-sm text-stone-700">P</kbd>
                  </div>
                  <div className="flex items-center justify-between py-2.5">
                    <span className="font-medium text-stone-600">Close open modals / sheets</span>
                    <kbd className="px-1.5 py-0.5 bg-stone-50 rounded border border-stone-200 border-b-2 font-mono text-[10px] font-black shadow-sm text-stone-700">Esc</kbd>
                  </div>
                  <div className="flex items-center justify-between py-2.5">
                    <span className="font-medium text-stone-600">Toggle Keyboard Guide</span>
                    <kbd className="px-2 py-0.5 bg-stone-50 rounded border border-stone-200 border-b-2 font-mono text-xs font-black shadow-sm text-stone-700">?</kbd>
                  </div>
                </div>
              </div>

              {/* Footer info/tip */}
              <div className="mt-6 pt-4 border-t border-stone-100 flex items-center justify-center text-[10px] text-stone-400 font-bold uppercase tracking-widest gap-1 select-none">
                <span>💡 Press </span>
                <kbd className="px-1 bg-stone-50 rounded border border-stone-200 font-mono text-[9px] lowercase text-stone-500">?</kbd>
                <span> to toggle guide</span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </Suspense>
  );
}

function PageWrapper({ children }: { children: React.ReactNode }) {
  const location = useLocation();
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
  return (
    <AppCrashBoundary>
      <LanguageProvider>
        <StoreProvider>
          <AppContent />
        </StoreProvider>
      </LanguageProvider>
    </AppCrashBoundary>
  );
}

import { useMobileInputFocus } from './hooks/useMobileInputFocus';

function AppContent() {
  const store = useStore();
  const { adminTheme, dbError, showLogoutDialog, setShowLogoutDialog, performLogout } = store;

  // Global mobile input behavior optimization
  useMobileInputFocus(true);

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
  }, [store.user?.id]);

  if (dbError) {
    return <DbConnectionIssue />;
  }

  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  
  useEffect(() => {
    if (typeof window === 'undefined' || !window.visualViewport) return;
    
    const handleResize = () => {
      if (!window.visualViewport) return;
      
      const isVisible = window.visualViewport.height < window.innerHeight * 0.8;
      setIsKeyboardVisible(isVisible);

      if (isVisible) {
        // Keyboard visible transition handled by useMobileInputFocus hook
      }
    };
    
    window.visualViewport.addEventListener('resize', handleResize);
    return () => window.visualViewport?.removeEventListener('resize', handleResize);
  }, []);

  return (
    <Router>
      <HeadOptimizer />
      <ScrollToTopOnNavigate />
      <Suspense fallback={null}>
        <ReviewPromptNotification />
      </Suspense>
      <Suspense fallback={null}>
        <FullScreenAlert />
      </Suspense>
      <div className={cn("min-h-screen flex flex-col pt-safe transition-all duration-300", adminTheme, isKeyboardVisible && "pb-0")}>
        <OfflineIndicator />
        <TopPromotionTicker />
        <GlobalProgressBar />
        <Suspense fallback={null}>
          <GlobalAnnouncements />
        </Suspense>
        <ToastManager />
        <Toaster position="top-center" />
        <Navbar />
        <Suspense fallback={null}>
          <ConfirmLogoutDialog 
            isOpen={showLogoutDialog} 
            onClose={() => setShowLogoutDialog(false)} 
            onConfirm={performLogout} 
          />
        </Suspense>
        <main className="flex-1 pb-24 md:pb-0 relative">
          <AnimatedRoutes />
        </main>
        <MobileBottomNav />
        <AdminDiagnosticPanel />
        <Suspense fallback={null}>
          <FloatingCart />
        </Suspense>
        <BackToTop />
      </div>
    </Router>
  );
}
