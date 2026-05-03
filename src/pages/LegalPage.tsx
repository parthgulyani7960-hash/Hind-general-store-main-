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
      { title: '1. Information We Collect', text: 'We collect personal information that you provide to us, such as your name, phone number, email address, and delivery address. This information is collected when you register an account, place an order, or contact our support team. Additionally, we may automatically collect certain device and usage data through cookies and similar technologies (e.g., your device type, IP address, and interaction patterns) to optimize your shopping experience and protect our platform from security threats.' },
      { title: '2. How We Use Your Information', text: 'Your information is used to facilitate order fulfillment, manage your account, provide responsive customer support, and communicate essential updates about your services. Furthermore, we analyze usage patterns to personalize content, improve website performance, and maintain security.' },
      { title: '3. Data Security Measures', text: 'We employ robust technical and organizational security measures to protect your personal information against unauthorized access, loss, or misuse. All sensitive user data is encrypted at rest and in transit. Access to sensitive infrastructure is restricted to authorized personnel who are bound by strict confidentiality requirements.' },
      { title: '4. Cookies and Tracking', text: 'We use cookies and similar technologies to enhance your experience. These allow us to remember your preferences (like your login session and cart contents) and analyze traffic to improve site functionality. You can manage your cookie preferences through your browser settings.' },
      { title: '5. Third-Party Sharing', text: 'We do not sell or rent your personal information to third parties. We may share data with trusted vendors that assist in our operations (such as payment processing or delivery services) strictly under confidentiality agreements that prohibit the use of your data for any unauthorized purpose.' },
      { title: '6. User Rights and Data Control', text: 'You possess full control over your personal data. You have the right to request access to the data we hold about you, request corrections if your information is inaccurate, or ask us to delete your personal information, subject to legal retention obligations. You may exercise these rights by visiting your account settings or emailing our compliance team.' },
      { title: '7. Updates to this Policy', text: 'We may update this Privacy Policy from time to time to reflect changes in our data processing practices. We will notify you of any major changes by updating the "Last Updated" date at the bottom of this page.' },
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
