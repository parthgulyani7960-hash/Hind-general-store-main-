import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { LogIn, X, AlertCircle, RefreshCw } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useStore } from '../StoreContext';

export default function AuthErrorReloader() {
  const [showError, setShowError] = useState(false);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, user } = useStore();

  useEffect(() => {
    const handleAuthError = (event: any) => {
      // Don't show if we're already on the login page
      if (window.location.pathname === '/login') return;
      
      console.warn('[AUTH ERROR RELOADER] Caught auth error event', event.detail?.url);
      setErrorDetails(event.detail?.url || 'Unauthorized access detected');
      setShowError(true);
    };

    window.addEventListener('auth_error', handleAuthError);
    return () => window.removeEventListener('auth_error', handleAuthError);
  }, []);

  // Automatically redirect users to their dashboard/intended target if session has been successfully restored
  useEffect(() => {
    if (showError && user) {
      console.log('[AUTH ERROR RELOADER] Session successfully restored! Dismissing error overlay.');
      setShowError(false);
      
      // Determine dashboard destination based on user role
      if (user.role === 'admin') {
        navigate('/admin');
      } else if (user.role === 'runner') {
        navigate('/runner');
      } else {
        navigate('/');
      }
    }
  }, [showError, user, navigate]);

  const handleReauthenticate = async () => {
    setShowError(false);
    // Clear local auth state if any
    await logout();
    // Redirect to login with current location as source
    const returnUrl = encodeURIComponent(location.pathname + location.search);
    navigate(`/login?redirect=${returnUrl}`);
  };

  return (
    <AnimatePresence>
      {showError && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-stone-900/80 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border border-stone-100"
          >
            <div className="flex flex-col items-center text-center space-y-6">
              <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center">
                <AlertCircle className="text-red-500" size={32} />
              </div>
              
              <div className="space-y-2">
                <h2 className="text-2xl font-black text-stone-900 uppercase tracking-tight">Session Expired</h2>
                <p className="text-stone-500 font-medium leading-relaxed">
                  Your secure session has expired or you've been logged out from another device. 
                  Please re-authenticate to continue.
                </p>
                {errorDetails && (
                  <p className="text-[10px] font-mono text-stone-400 break-all bg-stone-50 p-2 rounded-lg">
                    Resource: {errorDetails}
                  </p>
                )}
              </div>

              <div className="flex flex-col w-full gap-3">
                <button
                  onClick={handleReauthenticate}
                  className="w-full py-4 bg-primary text-white rounded-2xl font-black uppercase tracking-[0.2em] shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center space-x-3"
                >
                  <LogIn size={18} />
                  <span>Login Again</span>
                </button>
                
                <button
                  onClick={() => setShowError(false)}
                  className="w-full py-4 text-stone-400 font-bold hover:text-stone-900 transition-colors"
                >
                  Close & Continue as Guest
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
