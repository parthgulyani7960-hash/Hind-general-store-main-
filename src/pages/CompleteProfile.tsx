import React, { useState, useRef } from 'react';
import { motion } from 'motion/react';
import { User, Phone, ArrowRight, Camera, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../StoreContext';
import toast from 'react-hot-toast';
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';

export default function CompleteProfile() {
  const { setUser, user } = useStore();
  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: '',
    profile_photo: user?.profile_photo || '',
    acquisition_source: 'direct'
  });
  const [loading, setLoading] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const navigate = useNavigate();
  const { isProfileComplete } = useStore();

  React.useEffect(() => {
    if (isProfileComplete()) {
      navigate('/', { replace: true });
    }
  }, [isProfileComplete, navigate]);

  const startCamera = async () => {
    try {
      setShowCamera(true);
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      toast.error('Could not access camera');
      setShowCamera(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
    setShowCamera(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const photo = canvas.toDataURL('image/jpeg');
        setFormData({ ...formData, profile_photo: photo });
        stopCamera();
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.phone) {
      toast.error('Please enter a valid phone number');
      return;
    }
    if (!formData.profile_photo) {
      toast.error('Profile photo is mandatory for receiving orders');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/complete-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (data.success) {
        setUser(data.user);
        const storeName = 'Hind General Store'; // fallback
        toast.success(`Profile completed successfully! Welcome to ${storeName}.`);
        navigate('/');
      } else {
        toast.error(data.message || 'Failed to complete profile');
      }
    } catch (err) {
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 pb-safe md:pb-12">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white p-8 rounded-3xl shadow-xl border border-stone-100"
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <User className="text-primary" size={32} />
          </div>
          <h1 className="text-2xl font-bold text-stone-900">Complete Your Profile</h1>
          <p className="text-stone-500">Please provide your details to continue</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-col items-center mb-6">
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-stone-100 border-2 border-stone-200 overflow-hidden flex items-center justify-center">
                {formData.profile_photo ? (
                  <img src={formData.profile_photo} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <Camera className="text-stone-300" size={32} />
                )}
              </div>
              <button 
                type="button"
                onClick={startCamera}
                className="absolute bottom-0 right-0 p-2 bg-primary text-white rounded-full shadow-lg hover:scale-110 transition-transform"
              >
                <Camera size={16} />
              </button>
            </div>
            <p className="text-[10px] font-bold text-stone-400 uppercase mt-2 tracking-wider">Mandatory Profile Photo</p>
          </div>

          {showCamera && (
            <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center p-4">
              <div className="relative w-full max-w-md aspect-[3/4] bg-stone-900 rounded-3xl overflow-hidden">
                <video 
                  ref={videoRef} 
                  autoPlay 
                  playsInline 
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 border-[20px] border-black/20 pointer-events-none">
                  <div className="w-full h-full border-2 border-white/30 rounded-2xl" />
                </div>
              </div>
              <div className="flex items-center space-x-6 mt-8">
                <button 
                  type="button"
                  onClick={stopCamera}
                  className="p-4 bg-white/10 text-white rounded-full hover:bg-white/20 transition-colors"
                >
                  <X size={24} />
                </button>
                <button 
                  type="button"
                  onClick={capturePhoto}
                  className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-2xl hover:scale-105 active:scale-95 transition-transform"
                >
                  <div className="w-16 h-16 border-4 border-stone-200 rounded-full" />
                </button>
                <div className="w-14" />
              </div>
              <canvas ref={canvasRef} className="hidden" />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Full Name</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
              <input 
                type="text" 
                placeholder="Enter your full name"
                className="input-field pl-12"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Phone Number</label>
            <div className="phone-input-container">
              <PhoneInput
                international
                defaultCountry="IN"
                value={formData.phone}
                onChange={(val) => setFormData({...formData, phone: val || ''})}
                className="input-field"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">How did you hear about us?</label>
            <select 
              className="input-field w-full p-3 rounded-lg border border-stone-200"
              value={formData.acquisition_source}
              onChange={(e) => setFormData({...formData, acquisition_source: e.target.value})}
            >
              <option value="direct">Direct</option>
              <option value="whatsapp">WhatsApp</option>
              <option value="social_media">Social Media</option>
              <option value="friend">Referred by Friend</option>
              <option value="other">Other</option>
            </select>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full btn-primary py-4 flex items-center justify-center space-x-2"
          >
            {loading ? (
              <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <span>Complete Profile</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
