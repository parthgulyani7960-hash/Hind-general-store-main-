import React from 'react';
import { motion } from 'motion/react';
import { Shield, Info, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface LegalPageProps {
  title: string;
  type: 'privacy' | 'tnc';
}

export default function LegalPage({ title, type }: LegalPageProps) {
  const navigate = useNavigate();

  const content = {
    privacy: [
      { title: 'Information We Collect', text: 'We collect personal information that you provide to us, such as your name, phone number, email address, and delivery address. This information is collected when you register an account, place an order, or contact our support team.' },
      { title: 'How We Use Your Information', text: 'We use your information to process and fulfill your orders, manage your account, provide customer support, and send you important updates about your orders or our services. We may also use your data to improve our website and personalize your shopping experience.' },
      { title: 'Data Security', text: 'We implement a variety of security measures to maintain the safety of your personal information. Your sensitive data is encrypted and stored securely. Access to your personal information is restricted to authorized personnel only.' },
      { title: 'Cookies and Tracking', text: 'We use cookies and similar tracking technologies (like local storage) to enhance your experience on our website. These technologies help us remember your login session, cart items, and preferences.' },
      { title: 'Third-Party Disclosure', text: 'We do not sell, trade, or otherwise transfer your personally identifiable information to outside parties. This does not include trusted third parties who assist us in operating our website or conducting our business, so long as those parties agree to keep this information confidential.' },
      { title: 'Your Rights', text: 'You have the right to access, correct, or delete your personal information. You can manage your profile details through your account settings or by contacting our support team.' },
    ],
    tnc: [
      { title: 'Order Acceptance', text: 'All orders are subject to availability and confirmation of the order price.' },
      { title: 'Pricing', text: 'Prices are inclusive of GST where applicable. Delivery charges may apply based on your location.' },
      { title: 'Wallet & Khata', text: 'Wallet balances are non-refundable. Khata system is provided at the discretion of the admin.' },
      { title: 'Returns', text: 'Perishable items like dairy and grains can only be returned at the time of delivery if quality is not met.' },
    ]
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <button 
        onClick={() => navigate(-1)}
        className="flex items-center space-x-2 text-stone-500 hover:text-primary mb-8 font-bold transition-colors"
      >
        <ArrowLeft size={20} />
        <span>Back</span>
      </button>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-3xl p-8 md:p-12 shadow-sm border border-stone-100"
      >
        <div className="flex items-center space-x-4 mb-8">
          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
            {type === 'privacy' ? <Shield size={32} /> : <Info size={32} />}
          </div>
          <h1 className="text-4xl font-black text-stone-900">{title}</h1>
        </div>

        <div className="space-y-8">
          {content[type].map((section, idx) => (
            <div key={idx} className="space-y-2">
              <h3 className="text-xl font-bold text-stone-800">{idx + 1}. {section.title}</h3>
              <p className="text-stone-600 leading-relaxed">{section.text}</p>
            </div>
          ))}
        </div>

        <div className="mt-12 pt-8 border-t border-stone-100 text-stone-400 text-sm">
          Last updated: {new Date().toLocaleDateString()}
        </div>
      </motion.div>
    </div>
  );
}
