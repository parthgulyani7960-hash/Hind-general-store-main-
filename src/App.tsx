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
import { TopPromotionTicker } from './components/TopPromotionTicker';
import ConfirmLogoutDialog from './components/ConfirmLogoutDialog';
import { AdminDiagnosticPanel } from './components/AdminDiagnosticPanel';

import { triggerFeedback } from './lib/feedback';
export { triggerFeedback };
import { useStore } from './StoreContext';
import React, { useState, Suspense, lazy, useEffect, useRef } from 'react';
import toast, { useToasterStore } from 'react-hot-toast';
import { AnimatePresence, motion } from 'motion/react';
import { cn } from './types';
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
  
  const { showHelp, setShowHelp } = useKeyboardShortcuts();
  
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
        <TopPromotionTicker />
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
          <AnimatedRoutes />
        </main>
        <MobileBottomNav />
        <FloatingCart />
        <BackToTop />
      </div>
    </Router>
  );
}
