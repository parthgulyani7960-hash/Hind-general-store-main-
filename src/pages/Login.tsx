import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Store, Sparkles, KeyRound, Lock, ShieldCheck, 
  AlertCircle, RefreshCw, Smartphone, Loader2, ExternalLink
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useStore } from '@/StoreContext';
import toast from 'react-hot-toast';
import { fetchWithHandling } from '@/lib/api';
import { signInWithGoogle, handleAuthError } from '@/firebase';
import { cn } from '@/lib/utils';
// Removed import of signInWithEmailAndPassword from firebase/auth since it was only used for email login.

/**
 * High-Fidelity Login & Authentication View
 * Auto-detects new/existing users with Google Sign-In securely under Firebase protocols.
 * No registration option is displayed to guarantee absolute access control privacy.
 */
export default function Login() {
  const { user, setUser, isOnline } = useStore();
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  
  const [showSuccessTick, setShowSuccessTick] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

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
      const loaderId = toast.loading('Connecting securely with Google...', { id: 'auth-loader' });

      const result = await signInWithGoogle();
      if (!result) {
        setLoading(false);
        toast.dismiss('auth-loader');
        return;
      }
      
      const { token } = result;
      
      toast.loading('Registering session and setting up your dashboard...', { id: 'auth-loader' });
      
      // Artificial delay to simulate identity handshake and security parameter synchronization (User Request: "Add some delay and lag")
      await new Promise(resolve => setTimeout(resolve, 2400));

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
        
        setTimeout(() => {
          setUser(data.user);
          const redirectUrl = getRedirectTarget(data.user);
          navigate(redirectUrl, { replace: true });
        }, 1200);
      } else {
        const msg = data?.message || 'Handshake failed. Your access request was declined by server.';
        setAuthError(msg);
        toast.error(msg, { id: 'auth-loader' });
      }
    } catch (err: any) {
      toast.dismiss('auth-loader');
      console.error('Google Access Failure:', err);
      const errorMessage = handleAuthError(err);
      setAuthError(errorMessage);
      toast.error(`${errorMessage} If the problem persists, please contact our support team.`, { duration: 6000 });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-stone-100 via-stone-50 to-stone-100 flex flex-col items-center justify-center select-none overflow-hidden">
      {/* Background Decorative Mesh Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:16px_28px] pointer-events-none" />
      
      <div className="w-full flex flex-col items-center justify-center relative z-10 max-w-sm mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="w-full text-stone-900 px-4"
        >
          {/* Logo & Core Title */}
          <div className="text-center mb-10">
            <motion.div 
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 400, damping: 15 }}
              className="w-20 h-20 bg-gradient-to-tr from-emerald-600 to-indigo-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl text-white border border-stone-200/20"
            >
              <Store size={36} strokeWidth={2} />
            </motion.div>
            <h1 className="text-3xl font-black text-stone-900 tracking-tight leading-none mb-2 font-sans">
              Hind Store
            </h1>
            <p className="text-[10px] text-stone-500 font-bold tracking-wider uppercase flex items-center justify-center gap-1.5">
              <Sparkles size={11} className="text-emerald-600 animate-pulse animate-duration-1000" /> Secure Store Profile Access
            </p>
          </div>

          {/* Secure Handshake Authentication Card */}
          <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-stone-200/50 border border-stone-100/80 p-8 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-indigo-500" />
            
            <AnimatePresence mode="wait">
              {showSuccessTick ? (
                /* Succesful handshake tick overlay with exquisite motion physics */
                <motion.div
                  key="success-card"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                  className="flex flex-col items-center justify-center py-10 text-center"
                >
                  <motion.div
                    initial={{ scale: 0, rotate: -45 }}
                    animate={{ scale: [0, 1.2, 1], rotate: 0 }}
                    transition={{ duration: 0.6, times: [0, 0.7, 1] }}
                    className="w-24 h-24 bg-gradient-to-br from-emerald-500 to-teal-400 text-white rounded-full flex items-center justify-center mb-8 shadow-2xl shadow-emerald-500/30"
                  >
                    <motion.svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={3}
                      stroke="currentColor"
                      className="w-12 h-12"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ delay: 0.3, duration: 0.5 }}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </motion.svg>
                  </motion.div>
                  
                  <h3 className="text-2xl font-black text-slate-900 leading-none mb-3">Welcome back!</h3>
                  <p className="text-slate-500 text-sm font-medium">Opening your store dashboard securely...</p>
                </motion.div>
              ) : (
                /* Main Login UI Options (Auto-detecting signup/login behavior) */
                <motion.div 
                  key="default-auth-view"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-8"
                >
                  <div className="text-center space-y-1">
                    <h3 className="text-lg font-black text-stone-900 tracking-tight">Identity Handshake</h3>
                    <p className="text-stone-400 text-[11px] font-medium max-w-xs mx-auto">
                      Log in to sync your purchase parameters, addresses, and secure local balance.
                    </p>
                  </div>

                  {/* Responsive Error Notice boxes */}
                  {authError && (
                    <motion.div 
                      initial={{ scale: 0.95, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="bg-red-50 border border-red-100 p-3.5 rounded-2xl flex items-start gap-2.5 text-left"
                    >
                      <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={15} />
                      <div className="space-y-1">
                        <p className="text-[10px] font-bold text-red-800 leading-tight">{authError}</p>
                        <button 
                          onClick={handleGoogleLogin}
                          className="text-[9px] font-black uppercase tracking-widest text-red-600 hover:underline flex items-center gap-1 cursor-pointer transition-all"
                        >
                          <RefreshCw size={9} /> Re-Sync Google Handshake
                        </button>
                      </div>
                    </motion.div>
                  )}

                  {!isOnline && (
                    <div className="bg-amber-50 border border-amber-100 p-3.5 rounded-2xl flex items-start gap-2.5 text-left">
                      <Smartphone size={15} className="text-amber-500 shrink-0 mt-0.5" />
                      <p className="text-[10px] font-bold text-amber-850 leading-tight">
                        Working Offline. Internet connection required to verify and authorize session parameters.
                      </p>
                    </div>
                  )}

                  {/* Google Authenticator - Core auto-detection Login flow */}
                  <div className="space-y-3">
                    <motion.button
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={handleGoogleLogin}
                      disabled={loading || !isOnline}
                      className={cn(
                        "w-full relative group overflow-hidden rounded-2xl bg-slate-900 hover:bg-slate-800 text-white shadow-md hover:shadow-lg transition-all py-4 px-6 flex items-center justify-center gap-3 cursor-pointer",
                        (loading || !isOnline) && "opacity-55 pointer-events-none"
                      )}
                    >
                      {loading ? (
                        <Loader2 size={18} className="animate-spin text-amber-500" />
                      ) : (
                        <>
                          <div className="w-6 h-6 flex items-center justify-center bg-white rounded-full p-1 shrink-0 shadow-sm">
                            <svg className="w-full h-full" viewBox="0 0 24 24">
                              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                            </svg>
                          </div>
                          <span className="font-bold text-sm tracking-wide text-white">Continue with Google</span>
                        </>
                      )}
                    </motion.button>
                  </div>

                  {/* Encryption details and validation parameters */}
                  <div className="pt-6 border-t border-stone-100 flex justify-center gap-6 items-center text-[9px] text-stone-400 font-bold uppercase tracking-widest">
                    <span className="flex items-center gap-1.5 select-none">
                      <Lock size={12} className="text-emerald-500 font-black" /> Safe Handshake
                    </span>
                    <span className="flex items-center gap-1.5 select-none">
                      <KeyRound size={12} className="text-emerald-500 font-black" /> Session Secured
                    </span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          <div className="mt-8 flex flex-col items-center justify-center gap-2 text-stone-400">
             <div className="flex items-center gap-3">
              <ShieldCheck size={20} className="text-emerald-500/55" />
              <p className="text-[9px] font-black uppercase tracking-[0.2em] max-w-[200px] leading-tight text-stone-500">Automated Account Detection Active</p>
             </div>
             <div className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 border border-emerald-100">
               <Lock size={10} /> System Security Verified
             </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
