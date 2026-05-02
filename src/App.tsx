import { BrowserRouter as Router, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Navbar from './components/Navbar';
import MobileBottomNav from './components/MobileBottomNav';
import BackToTop from './components/BackToTop';
import { useStore } from './StoreContext';
import React, { useState, Suspense, lazy, useEffect } from 'react';
import toast from 'react-hot-toast';
import { AnimatePresence, motion } from 'motion/react';
import { cn } from './types';
import LoadingFallback from './components/LoadingFallback';
import ErrorBoundary from './components/ErrorBoundary';

function ScrollToTopOnNavigate() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [pathname]);

  return null;
}

// Standard imports to avoid Suspense blanking issues with AnimatePresence
import Home from './pages/Home';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Invoice from './pages/Invoice';
import Login from './pages/Login';
import CompleteProfile from './pages/CompleteProfile';
import Support from './pages/Support';
import Wishlist from './pages/Wishlist';
import Profile from './pages/Profile';
import Promotions from './pages/Promotions';
import TermsAndConditions from './pages/TermsAndConditions';
import LegalPage from './pages/LegalPage';
import AdminDashboard from './pages/AdminDashboard';
import AdminPayments from './pages/AdminPayments';
import DeliveryDashboard from './pages/DeliveryDashboard';
import MaintenancePage from './pages/MaintenancePage';
import TrackOrder from './pages/TrackOrder';

function ProtectedRoute({ children, adminOnly = false, runnerOnly = false }: { children: React.ReactNode; adminOnly?: boolean; runnerOnly?: boolean }) {
  const { user, isProfileComplete } = useStore();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Redirect to complete profile if needed, UNLESS already on that page
  if (!isProfileComplete() && location.pathname !== '/complete-profile') {
    return <Navigate to="/complete-profile" replace />;
  }

  if (adminOnly && user.role !== 'admin') {
    toast.error('Access denied. Admin privileges required.');
    return <Navigate to="/" replace />;
  }

  if (runnerOnly && user.role !== 'delivery' && user.role !== 'admin') {
    toast.error('Access denied. Delivery runner privileges required.');
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

function AnimatedRoutes() {
  const location = useLocation();
  const { isMaintenance, user } = useStore();
  
  // Secret bypass check: if URL has ?bypass=admin_bypass_2024
  const hasBypass = new URLSearchParams(window.location.search).get('bypass') === 'admin_bypass_2024';
  const isAdmin = user?.role === 'admin';

  if (isMaintenance && !isAdmin && !hasBypass) {
    return <MaintenancePage />;
  }

  return (
    <>
      <AnimatePresence mode="wait">
        {/* @ts-ignore */}
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<PageWrapper><Home /></PageWrapper>} />
            <Route path="/products" element={<PageWrapper><Products /></PageWrapper>} />
          <Route path="/product/:id" element={<PageWrapper><ProductDetail /></PageWrapper>} />
          <Route path="/cart" element={<PageWrapper><Cart /></PageWrapper>} />
          <Route path="/promotions" element={<PageWrapper><Promotions /></PageWrapper>} />
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
    </>
  );
}

function PageWrapper({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
    >
      {children}
    </motion.div>
  );
}

export default function App() {
  const { subscribeNewsletter, adminTheme, t } = useStore();
  const [newsletterEmail, setNewsletterEmail] = useState('');

  useEffect(() => {
    // Show a small notification when the app is refreshed
    const hasRefreshed = sessionStorage.getItem('hgs_refreshed');
    if (hasRefreshed) {
      toast.success(t('welcome_back') || 'Welcome back! Page refreshed.', {
        icon: '🔄',
        duration: 3000,
        position: 'bottom-center'
      });
    }
    sessionStorage.setItem('hgs_refreshed', 'true');
  }, [t]);

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
      <div className={cn("min-h-screen flex flex-col", adminTheme)}>
        <Toaster position="top-center" />
        <Navbar />
        <main className="flex-1 pb-16 md:pb-0">
          <ErrorBoundary>
            <AnimatedRoutes />
          </ErrorBoundary>
        </main>
        <MobileBottomNav />
        <BackToTop />
        <footer className="bg-stone-900 text-stone-400 py-12 pb-20 md:pb-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <h3 className="text-white font-bold text-lg">Hind General Store</h3>
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
            © {new Date().getFullYear()} Hind General Store. All rights reserved.
          </div>
        </footer>
      </div>
    </Router>
  );
}
