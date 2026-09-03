import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Store, Lock, ShieldCheck, AlertCircle, ArrowLeft, Loader2
} from 'lucide-react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useStore } from '@/StoreContext';
import toast from 'react-hot-toast';
import { fetchWithHandling } from '@/lib/api';
import { signInWithGoogle, handleRedirectResult, handleAuthError } from '@/firebase';
import { triggerFeedback } from '@/lib/feedback';
import { securityService } from '@/services/securityService';

/**
 * Clean, High-Fidelity Google Authentication View for Hind Store
 * Streamlined purely for secure "Continue with Google" sign-in.
 */
export default function Login() {
  const { user, isOnline, login } = useStore();
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [showSuccessTick, setShowSuccessTick] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  const fromProfile = location.state?.from?.pathname === '/profile' || 
                      sessionStorage.getItem('auth_redirect_url')?.includes('/profile');

  const getRedirectTarget = (userObj?: any) => {
    if (userObj?.role === 'admin' || userObj?.email === 'parthgulyani7960@gmail.com' || userObj?.email === 'admin@hindstore.com') {
      return "/admin";
    }
    const savedRedirect = sessionStorage.getItem('auth_redirect_url');
    if (savedRedirect) {
      sessionStorage.removeItem('auth_redirect_url');
      return savedRedirect;
    }
    const fromState = (location.state as any)?.from;
    if (fromState) {
      return fromState.pathname + (fromState.search || '') + (fromState.hash || '');
    }
    return "/";
  };

  // Redirect users who are already logged in
  useEffect(() => {
    if (user) {
      const redirectUrl = getRedirectTarget(user);
      navigate(redirectUrl, { replace: true });
    }
  }, [user, navigate]);

  // Save redirection target in session state to handle page reloads
  useEffect(() => {
    if ((location.state as any)?.from) {
      const fromState = (location.state as any).from;
      const fullPath = fromState.pathname + (fromState.search || '') + (fromState.hash || '');
      sessionStorage.setItem('auth_redirect_url', fullPath);
    }
  }, [location]);

  // Process redirect results from mobile / fallback authentication flows
  useEffect(() => {
    const processRedirect = async () => {
      setLoading(true);
      const result = await handleRedirectResult();
      if (result) {
        toast.loading('Logging you in...', { id: 'auth-loader' });
        try {
          const data = await fetchWithHandling<any>('/api/auth/firebase-login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ idToken: result.token })
          });
          if (data && data.success && data.user) {
            login(data.user, result.token);
            setShowSuccessTick(true);
            toast.dismiss('auth-loader');
            toast.success(`Welcome back, ${data.user.name || 'User'}!`);
            const redirectUrl = getRedirectTarget(data.user);
            navigate(redirectUrl, { replace: true });
          } else {
            setAuthError(data?.message || 'Access request was declined by server.');
          }
        } catch (err: any) {
          setAuthError(err.message || 'Server connection failed.');
        } finally {
          toast.dismiss('auth-loader');
        }
      }
      setLoading(false);
    };
    processRedirect();
  }, [navigate, login]);

  // Primary Google Sign-In Handler
  const handleGoogleLogin = async () => {
    triggerFeedback('medium');
    if (!isOnline) {
      toast.error('You are currently offline. Please check your internet connection.');
      return;
    }

    try {
      setLoading(true);
      setAuthError(null);
      toast.loading('Connecting with Google...', { id: 'auth-loader' });

      const result = await signInWithGoogle();
      if (!result) {
        setLoading(false);
        toast.dismiss('auth-loader');
        return;
      }
      
      const { token } = result;
      toast.loading('Signing in...', { id: 'auth-loader' });
      
      const data = await fetchWithHandling<any>('/api/auth/firebase-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken: token })
      });

      if (data && data.success && data.user) {
        login(data.user, token);
        
        setShowSuccessTick(true);
        toast.dismiss('auth-loader');
        toast.success(`Welcome back, ${data.user.name || 'User'}!`);
        
        const redirectUrl = getRedirectTarget(data.user);
        navigate(redirectUrl, { replace: true });
      } else {
        const msg = data?.message || 'Access request was declined by server.';
        setAuthError(msg);
        toast.error(msg, { id: 'auth-loader' });
        securityService.trackAuth('failed_login', { email: 'Unknown (Declined)' });
      }
    } catch (err: any) {
      toast.dismiss('auth-loader');
      console.error('Google Access Failure:', err);
      const errorMessage = handleAuthError(err);
      setAuthError(errorMessage);
      securityService.trackAuth('failed_login', { email: 'Unknown (Google Exception)' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="login_page_container" className="min-h-screen w-full bg-stone-50 flex flex-col justify-center items-center relative overflow-x-hidden p-4 sm:p-6 lg:p-8">
      {/* Background Decorative Grid */}
      <div id="login_bg_grid" className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
      
      {/* Ambient background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Main Centered Content Container */}
      <div className="w-full max-w-md mx-auto relative z-10 flex flex-col items-center">
        {/* Back Link */}
        <div className="w-full flex justify-start mb-4">
          <Link
            to="/"
            id="login_back_to_home_btn"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-500 hover:text-emerald-700 transition-colors py-1.5 px-3 rounded-full hover:bg-stone-100"
          >
            <ArrowLeft size={14} />
            <span>Return to Store</span>
          </Link>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="w-full"
        >
          {/* Logo & Brand Identity */}
          <div className="text-center mb-6">
            <motion.div 
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="w-16 h-16 bg-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-3.5 shadow-lg shadow-emerald-600/20 border border-emerald-500/30 text-white"
            >
              <Store size={30} strokeWidth={2.2} />
            </motion.div>
            <h1 className="text-2xl sm:text-3xl font-bold text-stone-900 tracking-tight mb-1">
              Hind Store
            </h1>
            <p className="text-xs sm:text-sm text-stone-500 font-medium">
              Your trusted partner for wholesale & retail
            </p>
          </div>

          {/* Secure Login Card */}
          <div className="bg-white rounded-3xl shadow-xl shadow-stone-200/60 border border-stone-200/80 p-6 sm:p-8 relative overflow-hidden">
            {/* Top Brand Stripe */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600" />
            
            <AnimatePresence mode="wait">
              {showSuccessTick ? (
                /* Successful redirect tick */
                <motion.div
                  key="success-indicator"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="flex flex-col items-center justify-center py-8 text-center"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 220, damping: 16 }}
                    className="w-16 h-16 bg-emerald-500 text-white rounded-full flex items-center justify-center mb-4 shadow-lg shadow-emerald-500/25"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={3}
                      stroke="currentColor"
                      className="w-8 h-8"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  </motion.div>
                  
                  <h3 className="text-xl font-bold text-stone-900 mb-1">Authenticated</h3>
                  <p className="text-stone-500 text-sm">Redirecting to your account...</p>
                </motion.div>
              ) : (
                /* Main Login View */
                <motion.div 
                  key="google-login-view"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-6"
                >
                  {/* Notification / Header */}
                  {fromProfile ? (
                    <div id="login_required_alert" className="bg-amber-50 border border-amber-200/90 rounded-2xl p-4 flex items-start gap-3 text-left">
                      <Lock className="text-amber-600 shrink-0 mt-0.5" size={18} />
                      <div className="space-y-0.5">
                        <p className="text-xs font-bold text-amber-950">Sign-in Required</p>
                        <p className="text-xs text-amber-800 leading-relaxed">
                          Please sign in with your Google account to access your profile, order history, and saved addresses.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center space-y-1.5">
                      <h2 className="text-lg sm:text-xl font-bold text-stone-900">
                        Sign In to Your Account
                      </h2>
                      <p className="text-stone-500 text-xs sm:text-sm leading-relaxed max-w-xs mx-auto">
                        Access your wholesale catalog, track orders, and manage account details.
                      </p>
                    </div>
                  )}

                  {/* Errors & Offline Warnings */}
                  {authError && (
                    <div id="login_error_alert" className="bg-red-50 border border-red-200 p-3.5 rounded-2xl flex items-start gap-2.5 text-left">
                      <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={16} />
                      <p className="text-xs font-medium text-red-800 leading-tight">{authError}</p>
                    </div>
                  )}

                  {!isOnline && (
                    <div id="login_offline_alert" className="bg-stone-50 border border-stone-200 p-3.5 rounded-2xl flex items-start gap-2.5 text-left">
                      <AlertCircle size={16} className="text-stone-500 shrink-0 mt-0.5" />
                      <p className="text-xs text-stone-600">
                        You are currently offline. Please restore your internet connection to sign in safely.
                      </p>
                    </div>
                  )}

                  {/* CENTERED GOOGLE SIGN-IN BUTTON */}
                  <div className="pt-2 flex flex-col items-center">
                    <button
                      type="button"
                      id="google_signin_button"
                      onClick={handleGoogleLogin}
                      disabled={loading || !isOnline}
                      className="w-full flex items-center justify-center gap-3 py-3.5 px-5 bg-white hover:bg-stone-50 text-stone-800 font-semibold text-sm rounded-2xl border border-stone-300/90 shadow-sm hover:shadow-md hover:border-stone-400 active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer group"
                    >
                      {loading ? (
                        <Loader2 size={18} className="animate-spin text-emerald-600" />
                      ) : (
                        <div className="w-5 h-5 flex items-center justify-center shrink-0">
                          <svg className="w-full h-full group-hover:scale-105 transition-transform" viewBox="0 0 24 24">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                          </svg>
                        </div>
                      )}
                      <span className="text-stone-800 font-medium">
                        {loading ? 'Connecting with Google...' : 'Continue with Google'}
                      </span>
                    </button>
                  </div>

                  {/* Trust and security badges */}
                  <div className="pt-4 border-t border-stone-100 flex justify-center gap-5 items-center text-xs text-stone-400 font-medium">
                    <span className="flex items-center gap-1.5">
                      <Lock size={13} className="text-emerald-600" /> Secure Sign-In
                    </span>
                    <span className="w-1 h-1 rounded-full bg-stone-300" />
                    <span className="flex items-center gap-1.5">
                      <ShieldCheck size={13} className="text-emerald-600" /> Verified Identity
                    </span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
