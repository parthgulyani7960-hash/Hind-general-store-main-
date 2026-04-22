import { BrowserRouter as Router, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Navbar from './components/Navbar';
import MobileBottomNav from './components/MobileBottomNav';
import BackToTop from './components/BackToTop';
import { useStore } from './StoreContext';
import React, { useState, Suspense, lazy } from 'react';
import toast from 'react-hot-toast';
import { AnimatePresence, motion } from 'motion/react';
import { cn } from './types';
import LoadingFallback from './components/LoadingFallback';
import ErrorBoundary from './components/ErrorBoundary';

// Lazy loaded pages for better caching and performance
const Home = lazy(() => import('./pages/Home'));
const Products = lazy(() => import('./pages/Products'));
const ProductDetail = lazy(() => import('./pages/ProductDetail'));
const Cart = lazy(() => import('./pages/Cart'));
const Checkout = lazy(() => import('./pages/Checkout'));
const Invoice = lazy(() => import('./pages/Invoice'));
const Login = lazy(() => import('./pages/Login'));
const CompleteProfile = lazy(() => import('./pages/CompleteProfile'));
const Support = lazy(() => import('./pages/Support'));
const Wishlist = lazy(() => import('./pages/Wishlist'));
const Profile = lazy(() => import('./pages/Profile'));
const Promotions = lazy(() => import('./pages/Promotions'));
const TermsAndConditions = lazy(() => import('./pages/TermsAndConditions'));
const LegalPage = lazy(() => import('./pages/LegalPage'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const DeliveryDashboard = lazy(() => import('./pages/DeliveryDashboard'));
const MaintenancePage = lazy(() => import('./pages/MaintenancePage'));
const TrackOrder = lazy(() => import('./pages/TrackOrder'));

function ProtectedRoute({ children, adminOnly = false, runnerOnly = false }: { children: React.ReactNode; adminOnly?: boolean; runnerOnly?: boolean }) {
  const { user } = useStore();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
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
    <Suspense fallback={<LoadingFallback />}>
      <AnimatePresence mode="wait">
        <Routes location={location}>
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
  const { subscribeNewsletter, adminTheme } = useStore();
  const [newsletterEmail, setNewsletterEmail] = useState('');

  const handleNewsletter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail) return;
    if (!window.confirm('Are you sure you want to subscribe to our newsletter?')) return;
    await subscribeNewsletter(newsletterEmail);
    setNewsletterEmail('');
  };

  return (
    <Router>
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
