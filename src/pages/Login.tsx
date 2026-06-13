import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Store, Lock, ShieldCheck, AlertCircle, Loader2, LogIn, ArrowRight
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useStore } from '@/StoreContext';
import toast from 'react-hot-toast';
import { fetchWithHandling } from '@/lib/api';
import { signInWithGoogle, handleAuthError } from '@/firebase';
import { cn } from '@/lib/utils';

/**
 * Premium, High-Fidelity Login View for Hind Store
 * Auto-detects users with Google Sign-In securely and quickly.
 * Employs clean literal human language and highly polished aesthetics.
 */
export default function Login() {
  const { user, setUser, isOnline } = useStore();
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [showSuccessTick, setShowSuccessTick] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  // Highlight if the redirect comes from profile, or show standard login to continue
  const fromProfile = location.state?.from?.pathname === '/profile' || 
                      sessionStorage.getItem('auth_redirect_url')?.includes('/profile');

  const getRedirectTarget = (userObj?: any) => {
    if (userObj?.role === 'admin' || userObj?.email === 'parthgulyani7960@gmail.com') {
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

  // Google Sign-In handler (Processes both registration and login automatically)
  const handleGoogleLogin = async () => {
    if (!isOnline) {
      toast.error('You are currently offline. Please check your internet connection.');
      return;
    }

    try {
      setLoading(true);
      setAuthError(null);
      const loaderId = toast.loading('Connecting with Google...', { id: 'auth-loader' });

      const result = await signInWithGoogle();
      if (!result) {
        setLoading(false);
        toast.dismiss('auth-loader');
        return;
      }
      
      const { token } = result;
      
      toast.loading('Logging you in...', { id: 'auth-loader' });
      
      const data = await fetchWithHandling<any>('/api/auth/firebase-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken: token })
      });

      if (data && data.success) {
        localStorage.setItem('hgs_token', token);
        localStorage.setItem('hgs_user', JSON.stringify(data.user));
        
        setShowSuccessTick(true);
        toast.dismiss('auth-loader');
        toast.success(`Welcome back, ${data.user.name || 'User'}!`);
        
        // Short snappy micro-delay for visual feedback tick before routing
        setTimeout(() => {
          setUser(data.user);
          const redirectUrl = getRedirectTarget(data.user);
          navigate(redirectUrl, { replace: true });
        }, 500);
      } else {
        const msg = data?.message || 'Access request was declined by server.';
        setAuthError(msg);
        toast.error(msg, { id: 'auth-loader' });
      }
    } catch (err: any) {
      toast.dismiss('auth-loader');
      console.error('Google Access Failure:', err);
      const errorMessage = handleAuthError(err);
      setAuthError(errorMessage);
      toast.error(`${errorMessage} Please try again.`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="login_page_container" className="fixed inset-0 w-full h-full bg-stone-50 flex flex-col items-center justify-center select-none overflow-hidden">
      {/* Background Decorative Grid */}
      <div id="login_bg_grid" className="absolute inset-0 bg-[linear-gradient(to_right,#80808005_1px,transparent_1px),linear-gradient(to_bottom,#80808005_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
      
      <div className="w-full flex flex-col items-center justify-center relative z-10 max-w-md mx-auto px-4">
        <motion.div 
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="w-full text-stone-900"
        >
          {/* Logo & Brand Identity */}
          <div className="text-center mb-8">
            <motion.div 
              whileHover={{ scale: 1.02 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="w-16 h-16 bg-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-600/10 border border-emerald-500/10 text-white"
            >
              <Store size={32} strokeWidth={2} />
            </motion.div>
            <h1 className="text-2xl font-bold text-stone-900 tracking-tight mb-1 font-sans">
              Hind Store
            </h1>
            <p className="text-xs text-stone-500 font-medium tracking-wide">
              Your trusted partner for wholesale & retail
            </p>
          </div>

          {/* Secure Login Card */}
          <div className="bg-white rounded-3xl shadow-xl shadow-stone-200/40 border border-stone-200/50 p-8 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-indigo-500" />
            
            <AnimatePresence mode="wait">
              {showSuccessTick ? (
                /* Successful redirect tick */
                <motion.div
                  key="success-indicator"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="flex flex-col items-center justify-center py-6 text-center"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, damping: 15 }}
                    className="w-16 h-16 bg-emerald-500 text-white rounded-full flex items-center justify-center mb-6 shadow-md shadow-emerald-500/20"
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
                  <p className="text-stone-500 text-sm">Redirecting to your dashboard...</p>
                </motion.div>
              ) : (
                /* Main Login Form */
                <motion.div 
                  key="form-view"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-6"
                >
                  {/* "Please log in to continue" Notification */}
                  {fromProfile ? (
                    <div id="login_required_alert" className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3 text-left">
                      <Lock className="text-amber-600 shrink-0 mt-0.5" size={18} />
                      <div className="space-y-0.5">
                        <p className="text-sm font-bold text-amber-900">Sign-in Required</p>
                        <p className="text-xs text-amber-700">Please log in to continue to your profile settings.</p>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center space-y-1">
                      <h3 className="text-xl font-black text-stone-950">Welcome Back</h3>
                      <p className="text-stone-500 text-sm">
                        Sign in to securely access your shopping dashboard.
                      </p>
                    </div>
                  )}

                  {/* Errors & Offline Warnings */}
                  {authError && (
                    <div className="bg-red-50 border border-red-200 p-4 rounded-2xl flex items-start gap-3 text-left">
                      <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={16} />
                      <div className="space-y-1">
                        <p className="text-xs font-semibold text-red-800 leading-tight">{authError}</p>
                        <button 
                          onClick={handleGoogleLogin}
                          className="text-xs font-bold text-red-600 hover:underline flex items-center gap-1.5 transition-all"
                        >
                          Retry Login <ArrowRight size={12} />
                        </button>
                      </div>
                    </div>
                  )}

                  {!isOnline && (
                    <div className="bg-stone-50 border border-stone-200 p-4 rounded-2xl flex items-start gap-3 text-left">
                      <AlertCircle size={16} className="text-stone-500 shrink-0 mt-0.5" />
                      <p className="text-xs text-stone-600">
                        You are currently offline. Please restore your internet connection to sign in safely.
                      </p>
                    </div>
                  )}

                  {/* Core Login Button */}
                  <div className="space-y-3">
                    <motion.button
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={handleGoogleLogin}
                      disabled={loading || !isOnline}
                      id="google_signin_button"
                      className={cn(
                        "w-full relative overflow-hidden rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-md hover:shadow-lg transition-all py-4 px-6 flex items-center justify-center gap-3 cursor-pointer border border-emerald-700/10",
                        (loading || !isOnline) && "opacity-50 pointer-events-none"
                      )}
                    >
                      {loading ? (
                        <Loader2 size={18} className="animate-spin text-white" />
                      ) : (
                        <>
                          <div className="w-5 h-5 flex items-center justify-center bg-white rounded-full p-1 shrink-0 shadow-sm">
                            <svg className="w-full h-full" viewBox="0 0 24 24">
                              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                            </svg>
                          </div>
                          <span className="font-semibold text-sm tracking-wide text-white">Continue with Google</span>
                        </>
                      )}
                    </motion.button>
                  </div>

                  {/* Secure login indicators */}
                  <div className="pt-6 border-t border-stone-100 flex justify-center gap-4 items-center text-[10px] text-stone-400 font-medium">
                    <span className="flex items-center gap-1">
                      <Lock size={12} className="text-emerald-500" /> Secure Login
                    </span>
                    <span className="w-1.5 h-1.5 rounded-full bg-stone-200" />
                    <span className="flex items-center gap-1">
                      <ShieldCheck size={12} className="text-emerald-500" /> Verified Identity
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
