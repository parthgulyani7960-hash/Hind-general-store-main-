import React, { useState } from 'react';
import { motion } from 'motion/react';
import { User } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useStore } from '../StoreContext';
import { handleAppError } from '../lib/errorUtils';
import toast from 'react-hot-toast';

import { signInWithGoogle } from '../firebase';

export default function Login() {
  const { setUser } = useStore();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const location = useLocation();
  const from = (location.state as any)?.from?.pathname || "/";

  const handleGoogleLogin = async () => {
    setLoading(true);
    let token = null;
    try {
      const { token: idToken } = await signInWithGoogle();
      token = idToken;
    } catch (err: any) {
      console.error('Full Auth Error:', err);
      handleAppError(err, 'Firebase Auth failed', 'firebaseLogin', true); // Changed to true to see details
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/auth/firebase-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken: token })
      });

      if (!res.ok) {
        let errorMessage = 'Login failed';
        try {
          const errorData = await res.json();
          errorMessage = errorData.message || errorMessage;
        } catch (e) {
          // If response was not JSON (e.g. HTML error page from proxy)
        }
        throw new Error(errorMessage);
      }

      const data = await res.json();

      if (data.success) {
        if (data.token) {
          localStorage.setItem('hgs_token', data.token);
        }
        setUser(data.user);
        toast.success('Welcome!');
        if (data.isNewUser) {
          navigate('/complete-profile');
        } else {
          navigate(from, { replace: true });
        }
      } else {
        toast.error(data.message || 'Login API failed');
      }
    } catch (err: any) {
      handleAppError(err, 'Backend Authentication failed', 'backendLogin', false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white p-8 rounded-3xl shadow-xl border border-stone-100 text-center"
      >
        <div className="mb-8">
          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <User className="text-primary" size={32} />
          </div>
          <h1 className="text-2xl font-bold text-stone-900">Welcome to Hind General Store</h1>
          <p className="text-stone-500 mt-2">Continue with Google to start shopping</p>
        </div>

        <button 
          type="button" 
          onClick={handleGoogleLogin} 
          disabled={loading}
          className="w-full flex items-center justify-center space-x-3 bg-white border border-stone-200 text-stone-700 py-3 rounded-xl hover:bg-stone-50 transition-all font-bold shadow-sm"
        >
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
          <span>{loading ? 'Signing in...' : 'Continue with Google'}</span>
        </button>
      </motion.div>
    </div>
  );
}

