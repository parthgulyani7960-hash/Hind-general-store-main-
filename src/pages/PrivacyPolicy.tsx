import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Shield, ChevronLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { fetchWithHandling } from '@/lib/api';
import { useStore } from '@/StoreContext';

export default function PrivacyPolicy() {
  const { config = [] } = useStore();
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWithHandling<any>('/api/settings')
      .then(data => {
        if (data && data.config) {
          const policy = data.config.find((s: any) => s.key === 'privacy_policy');
          if (policy) setContent(policy.value);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-stone-50">
      
      <main className="pt-24 pb-32 md:pb-20 px-4">
        <div className="max-w-4xl mx-auto">
          <Link 
            to="/" 
            className="inline-flex items-center space-x-2 text-stone-500 hover:text-primary transition-colors mb-8 group"
          >
            <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
            <span className="font-bold">Back to Home</span>
          </Link>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-[2.5rem] shadow-sm border border-stone-100 overflow-hidden"
          >
            <div className="p-8 md:p-12 bg-primary/5 border-b border-primary/10">
              <div className="flex items-center space-x-4 mb-4">
                <div className="p-3 bg-primary/10 rounded-2xl text-primary">
                  <Shield size={32} />
                </div>
                <h1 className="text-3xl md:text-4xl font-black text-stone-900">Privacy Policy</h1>
              </div>
              <p className="text-stone-500 font-bold uppercase tracking-widest text-[10px]">Version 1.2 • Last updated: April 21, 2026</p>
            </div>

            <div className="p-8 md:p-12">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-20 space-y-4">
                  <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                  <p className="text-stone-400 font-bold">Loading policy...</p>
                </div>
              ) : (
                <div 
                  className="prose prose-stone max-w-none prose-headings:font-black prose-p:text-stone-600 prose-p:leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: content || `
                    <div class="space-y-6">
                      <p>At ${(config || []).find(c => c.key === 'store_name')?.value || 'New Hind General Store'}, we value your privacy and are committed to protecting your personal information.</p>
                      <h3>Information We Collect</h3>
                      <p>We collect information you provide directly to us (e.g., name, email, address, phone number during registration or order placement). We also automatically collect some technical data when you use our platform.</p>
                      <h3>How We Use Your Information</h3>
                      <p>We use your data to process orders, improve our services, communicate important updates, and personalize your experience.</p>
                      <h3>Your Rights</h3>
                      <p>You have the right to access, update, or request deletion of your personal data. Please contact support for any such requests.</p>
                    </div>
                  ` }}
                />
              )}
            </div>
          </motion.div>

          <div className="mt-12 text-center">
            <p className="text-stone-400 text-sm">
              If you have any questions about this privacy policy, please contact our support team.
            </p>
            <Link to="/support" className="text-primary font-bold hover:underline mt-2 inline-block">
              Contact Support
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
