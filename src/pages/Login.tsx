import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Store, Sparkles, ArrowRight } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useStore } from '../StoreContext';
import { handleAppError } from '../lib/errorUtils';
import toast from 'react-hot-toast';
import { fetchWithHandling } from '../lib/api';
import { signInWithGoogle } from '../firebase';

export default function Login() {
  const { setUser } = useStore();
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as any)?.from?.pathname || "/";

  const handleGoogleLogin = async () => {
    try {
      // Call Firebase immediately so browser treats it as a direct user action (prevents popup blockers)
      const { user: _firebaseUser, token } = await signInWithGoogle();

      setLoading(true);
      toast.loading('Authenticating securely...', { id: 'google-auth' });
      
      // Pass the securely obtained token to our backend for session management
      const data = await fetchWithHandling<any>('/api/auth/firebase-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken: token })
      });

      if (data && data.success) {
        // IMPORTANT: We use the Firebase ID token as our secondary session token for IFrame contexts
        // where cross-site cookies are blocked.
        localStorage.setItem('hgs_token', token);
        
        setUser(data.user);
        console.log('[DEBUG] Login successful, user object name:', data.user.name, 'object:', JSON.stringify(data.user, null, 2));
        toast.success(`Welcome back, ${data.user.name || data.user.email || 'User'}!`, { id: 'google-auth' });
        
        navigate(from, { replace: true });
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

  const handleDemoLogin = async (role: string) => {
    try {
      setLoading(true);
      toast.loading(`Logging in as Demo ${role.toUpperCase()}...`, { id: 'demo-auth' });
      
      const response = await fetch('/api/auth/demo-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role })
      });
      
      const data = await response.json();
      if (data && data.success) {
        localStorage.setItem('hgs_token', data.token);
        setUser(data.user);
        toast.success(`Welcome back (Demo Mode as ${role.toUpperCase()})!`, { id: 'demo-auth' });
        navigate(from, { replace: true });
      } else {
        toast.error((data && data.message) || 'Demo login failed.', { id: 'demo-auth' });
      }
    } catch (err: any) {
      toast.dismiss('demo-auth');
      toast.error(err.message || 'Connection to demo auth endpoint failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen py-10 flex flex-col items-center justify-center px-4 bg-gradient-to-br from-indigo-50 via-purple-50/50 to-pink-50 relative overflow-hidden select-none">
      {/* Dynamic Background Graphics */}
      <div className="absolute top-0 left-0 w-[40rem] h-[40rem] bg-indigo-500/10 rounded-full blur-3xl -translate-y-1/2 -translate-x-1/2 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[40rem] h-[40rem] bg-pink-500/10 rounded-full blur-3xl translate-y-1/2 translate-x-1/2 pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="max-w-md w-full relative z-10"
      >
        {/* Brand Showcase */}
        <div className="text-center mb-10">
          <motion.div 
            whileHover={{ rotate: 5, scale: 1.05 }}
            className="w-24 h-24 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-indigo-500/20 text-white"
          >
            <Store size={44} strokeWidth={2.5} />
          </motion.div>
          <h1 className="text-4xl font-serif font-black text-slate-900 tracking-tight leading-none mb-3">
            Hind General Store
          </h1>
          <p className="text-sm text-slate-600 font-medium flex items-center justify-center gap-2">
            <Sparkles size={14} className="text-indigo-500" /> Premium Grocery & Essentials <Sparkles size={14} className="text-pink-500" />
          </p>
        </div>

        {/* Master Account Portal Container */}
        <div className="bg-white/80 backdrop-blur-xl rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-white p-8 md:p-10 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
          
          <div className="space-y-8">
            <div className="text-center">
              <h3 className="text-xl font-bold text-slate-900 mb-2">Welcome</h3>
              <p className="text-slate-500 text-sm">Sign in securely using your Google account to access the store.</p>
            </div>

            <button
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full relative group overflow-hidden rounded-2xl bg-white border border-slate-200 hover:border-slate-300 shadow-sm transition-all hover:shadow-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-slate-50/50 to-white pointer-events-none"></div>
              <div className="px-6 py-4 flex items-center justify-center gap-4 relative z-10">
                <svg className="w-6 h-6 shrink-0" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                <span className="font-semibold text-slate-700 text-base">{loading ? 'Connecting...' : 'Continue with Google'}</span>
              </div>
            </button>

            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-slate-100"></div>
              <span className="flex-shrink mx-4 text-slate-400 text-[10px] font-bold tracking-wider uppercase">Or Secure Demo Access</span>
              <div className="flex-grow border-t border-slate-100"></div>
            </div>

            <div className="grid grid-cols-2 gap-3 pb-2">
              <button
                type="button"
                onClick={() => handleDemoLogin('admin')}
                disabled={loading}
                className="px-4 py-3 bg-slate-900 text-white rounded-xl font-bold text-xs hover:bg-slate-800 transition-all hover:scale-[1.02] shadow-sm cursor-pointer disabled:opacity-50"
              >
                Login as Admin
              </button>
              <button
                type="button"
                onClick={() => handleDemoLogin('customer')}
                disabled={loading}
                className="px-4 py-3 bg-indigo-600 text-white rounded-xl font-bold text-xs hover:bg-indigo-500 transition-all hover:scale-[1.02] shadow-sm cursor-pointer disabled:opacity-50"
              >
                Login as Customer
              </button>
            </div>
          </div>
        </div>

        {/* Security Footer */}
        <p className="text-[11px] text-slate-400 mt-8 text-center px-4 leading-relaxed font-medium">
          Powered by Secure Login. By continuing, you agree to our Terms of Service.
        </p>
      </motion.div>
    </div>
  );
}
