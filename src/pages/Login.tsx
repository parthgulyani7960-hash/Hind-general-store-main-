import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Store, Sparkles, KeyRound, Lock, ArrowRight } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useStore } from '@/StoreContext';
import toast from 'react-hot-toast';
import { fetchWithHandling } from '@/lib/api';
import { signInWithGoogle } from '@/firebase';

export default function Login() {
  const { user, setUser } = useStore();
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect users who are already logged in
  React.useEffect(() => {
    if (user) {
      const redirectUrl = getRedirectTarget(user);
      navigate(redirectUrl, { replace: true });
    }
  }, [user, navigate]);

  // Save the attempted URL in sessionStorage in case of hard reload/refresh
  React.useEffect(() => {
    if ((location.state as any)?.from) {
      const fromState = (location.state as any).from;
      const fullPath = fromState.pathname + (fromState.search || '') + (fromState.hash || '');
      sessionStorage.setItem('auth_redirect_url', fullPath);
    }
  }, [location]);

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

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      toast.loading('Signing in safely...', { id: 'google-auth' });

      // Call Firebase Google authentication immediately (safeguards popup blockers)
      const { user: _firebaseUser, token } = await signInWithGoogle();
      
      // Pass the securely obtained token to our backend for session verification
      const data = await fetchWithHandling<any>('/api/auth/firebase-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken: token })
      });

      if (data && data.success) {
        localStorage.setItem('hgs_token', token);
        setUser(data.user);
        
        toast.success(`Welcome back, ${data.user.name || data.user.email || 'User'}!`, { id: 'google-auth' });
        
        const redirectUrl = getRedirectTarget(data.user);
        navigate(redirectUrl, { replace: true });
      } else {
        toast.error((data && data.message) || 'We could not complete your sign-in. Please try again.', { id: 'google-auth' });
      }
    } catch (err: any) {
      toast.dismiss('google-auth');
      toast.error(err.message || 'We could not sign you in. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-stone-100 via-stone-50 to-stone-100 relative py-8 px-4 flex flex-col items-center justify-center min-h-[calc(100vh-140px)] select-none overflow-hidden">
      {/* Premium Abstract Grid Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:16px_28px] pointer-events-none" />
      
      {/* Center card bounds layout */}
      <div className="w-full flex flex-col items-center justify-center relative z-10 max-w-sm mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="w-full"
        >
          {/* Brand Showcase */}
          <div className="text-center mb-6">
            <motion.div 
              whileHover={{ scale: 1.03 }}
              className="w-16 h-16 bg-gradient-to-tr from-emerald-600 to-indigo-600 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-xl text-white border border-stone-800"
            >
              <Store size={28} strokeWidth={2} />
            </motion.div>
            <h1 className="text-2xl font-black text-stone-900 tracking-tight leading-none mb-2">
              Hind Store
            </h1>
            <p className="text-[10px] text-stone-500 font-bold tracking-wider uppercase flex items-center justify-center gap-1.5">
              <Sparkles size={11} className="text-emerald-600 animate-pulse" /> Premium Grocery & Essentials
            </p>
          </div>

          {/* Login Container Card */}
          <div className="bg-white rounded-[2rem] shadow-xl shadow-stone-200/50 border border-stone-100/80 p-7 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-indigo-500"></div>
            
            <div className="space-y-6">
              <div className="text-center space-y-1.5">
                <h3 className="text-base font-bold text-stone-900 tracking-tight">Sign In</h3>
                <p className="text-stone-500 text-xs leading-relaxed max-w-xs mx-auto">
                  Use your Google account to log in securely. Your progress, orders, and wallet balance are synchronized automatically.
                </p>
              </div>

              {/* Login Button with Premium Styles */}
              <button
                id="google-signin-btn"
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full relative group overflow-hidden rounded-2xl bg-stone-900 hover:bg-stone-850 text-white shadow-md hover:shadow-lg transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed py-4 px-5 flex items-center justify-center gap-3.5 border border-stone-800"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span className="font-semibold text-xs tracking-wide">Securing connection...</span>
                  </div>
                ) : (
                  <>
                    <div className="w-5 h-5 flex items-center justify-center bg-white rounded-full p-0.5 shrink-0 shadow-sm">
                      <svg className="w-full h-full" viewBox="0 0 24 24">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                      </svg>
                    </div>
                    <span className="font-semibold text-xs tracking-wide">Continue with Google</span>
                    <ArrowRight size={14} className="text-white/40 group-hover:translate-x-0.5 transition-transform shrink-0" />
                  </>
                )}
              </button>

              {/* Secure Attributes list */}
              <div className="pt-4 border-t border-stone-100 flex justify-between items-center text-[9px] text-stone-400 font-bold uppercase tracking-wider">
                <span className="flex items-center gap-1.5 select-none">
                  <Lock size={10} className="text-emerald-600" /> Secure Processing
                </span>
                <span className="flex items-center gap-1.5 select-none">
                  <KeyRound size={10} className="text-emerald-600" /> Direct Handshake
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
