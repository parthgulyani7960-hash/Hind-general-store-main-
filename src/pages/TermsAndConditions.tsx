import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { FileText, ChevronLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';

export default function TermsAndConditions() {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        const tnc = data.config?.find((s: any) => s.key === 'terms_and_conditions');
        if (tnc) setContent(tnc.value);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-stone-50">
      <Navbar />
      
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
                  <FileText size={32} />
                </div>
                <h1 className="text-3xl md:text-4xl font-black text-stone-900">Terms & Conditions</h1>
              </div>
              <p className="text-stone-500 font-bold uppercase tracking-widest text-[10px]">Version 2.1 • Last updated: April 21, 2026</p>
            </div>

            <div className="p-8 md:p-12">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-20 space-y-4">
                  <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                  <p className="text-stone-400 font-bold">Loading terms...</p>
                </div>
              ) : (
                <div 
                  className="prose prose-stone max-w-none prose-headings:font-black prose-p:text-stone-600 prose-p:leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: content || `
                    <div class="space-y-12">
                      <section class="border-l-4 border-stone-100 pl-8 transition-all hover:border-primary/40 group">
                        <h3 class="text-2xl font-black text-stone-900 mb-6 uppercase tracking-tight flex items-center">
                          <span class="w-8 h-8 bg-stone-100 text-stone-400 group-hover:bg-primary group-hover:text-white rounded-lg flex items-center justify-center text-sm mr-4 transition-colors">01</span>
                          Acceptance of Terms
                        </h3>
                        <div class="space-y-4 text-stone-600 leading-relaxed">
                          <p>By accessing, browsing, or using the {config.find(c => c.key === 'store_name')?.value || 'Hind General Store'} platform, you acknowledge that you have read, understood, and agreed to be bound by these Terms and Conditions. These terms constitute a legally binding agreement between you and the store regarding your use of our services, including our web portal, mobile app, and physical store interactions.</p>
                          <p>We reserve the right to update or modify these terms at any time without prior notice. Any changes will be effective immediately upon posting. Your continued use of the platform after such changes signifies your acceptance of the revised terms.</p>
                        </div>
                      </section>

                      <section class="border-l-4 border-stone-100 pl-8 transition-all hover:border-primary/40 group">
                        <h3 class="text-2xl font-black text-stone-900 mb-6 uppercase tracking-tight flex items-center">
                          <span class="w-8 h-8 bg-stone-100 text-stone-400 group-hover:bg-primary group-hover:text-white rounded-lg flex items-center justify-center text-sm mr-4 transition-colors">02</span>
                          User Registration & Identity
                        </h3>
                        <div class="space-y-4 text-stone-600 leading-relaxed">
                          <p>To access certain features (Ordering, Wallet, Khata), you must create a verified account. You agree to provide accurate, current, and complete information during the registration process.</p>
                          <p class="font-bold text-stone-800 bg-amber-50 p-4 rounded-2xl border border-amber-100">
                             CRITICAL: For security and verification, HGS mandates a clear profile photo and a verified phone number. This is essential for our delivery runners to identify you correctly and to authorize Khata (credit) transactions.
                          </p>
                          <p>You are solely responsible for maintaining the confidentiality of your account credentials. Any activity occurring under your account is your responsibility.</p>
                        </div>
                      </section>

                      <section class="border-l-4 border-stone-100 pl-8 transition-all hover:border-primary/40 group">
                        <h3 class="text-2xl font-black text-stone-900 mb-6 uppercase tracking-tight flex items-center">
                          <span class="w-8 h-8 bg-stone-100 text-stone-400 group-hover:bg-primary group-hover:text-white rounded-lg flex items-center justify-center text-sm mr-4 transition-colors">03</span>
                          Pricing, Product Info & Availability
                        </h3>
                        <div class="space-y-4 text-stone-600 leading-relaxed">
                          <p>While we strive for 100% accuracy, {config.find(c => c.key === 'store_name')?.value || 'Hind General Store'} does not warrant that product descriptions, pricing, or other content is error-free. In the event of a pricing error, we reserve the right to cancel any orders placed for that item.</p>
                          <p>All items are subject to stock availability. We may place limits on the quantity of items purchased per person or per order to ensure fair distribution during high-demand periods.</p>
                        </div>
                      </section>

                      <section class="border-l-4 border-stone-100 pl-8 transition-all hover:border-primary/40 group">
                        <h3 class="text-2xl font-black text-stone-900 mb-6 uppercase tracking-tight flex items-center">
                          <span class="w-8 h-8 bg-stone-100 text-stone-400 group-hover:bg-primary group-hover:text-white rounded-lg flex items-center justify-center text-sm mr-4 transition-colors">04</span>
                          Wallet & 'Khata' (Credit) Policy
                        </h3>
                        <div class="space-y-4 text-stone-600 leading-relaxed">
                          <p><strong>General Store Karyana Shop Wallet:</strong> Pre-paid balance used for instant checkouts. Refilling can be done via UPI or Cash-at-Store. Wallet balance is non-transferable and non-refundable to bank accounts except in extreme circumstances.</p>
                          <p><strong>The Khata System:</strong> Approved customers can avail of interest-free credit. Khata limits are calculated based on your purchase history and return rate. Failure to settle Khata balances within the agreed timeframe (weekly/monthly) will result in immediate suspension of ordering privileges and possible legal recovery efforts.</p>
                        </div>
                      </section>

                      <section class="border-l-4 border-stone-100 pl-8 transition-all hover:border-primary/40 group">
                        <h3 class="text-2xl font-black text-stone-900 mb-6 uppercase tracking-tight flex items-center">
                          <span class="w-8 h-8 bg-stone-100 text-stone-400 group-hover:bg-primary group-hover:text-white rounded-lg flex items-center justify-center text-sm mr-4 transition-colors">05</span>
                          Shipping, Delivery & Runner Safety
                        </h3>
                        <div class="space-y-4 text-stone-600 leading-relaxed">
                          <p><strong>Local Delivery:</strong> Ludhiana express delivery (PIN 141XXX) usually arrives in 2-4 hours. Delivery estimates are indicative and not guaranteed.</p>
                          <p><strong>Runner Safety:</strong> Our delivery runners are professionals. We maintain a zero-tolerance policy for verbal or physical abuse toward our staff. Any such behavior will result in a permanent platform ban and police reporting if necessary.</p>
                          <p><strong>Verification:</strong> At the time of delivery, runners may ask for a verification code or your name to ensure the package reaches the intended recipient.</p>
                        </div>
                      </section>

                      <section class="border-l-4 border-stone-100 pl-8 transition-all hover:border-primary/40 group">
                        <h3 class="text-2xl font-black text-stone-900 mb-6 uppercase tracking-tight flex items-center">
                          <span class="w-8 h-8 bg-stone-100 text-stone-400 group-hover:bg-primary group-hover:text-white rounded-lg flex items-center justify-center text-sm mr-4 transition-colors">06</span>
                          Return Policy
                        </h3>
                        <div class="space-y-4 text-stone-600 leading-relaxed">
                          <p><strong>Return Window:</strong> All return requests must be initiated within 48 hours of order delivery.</p>
                          <p><strong>Perishables (Dairy, Veg, Fruit):</strong> Must be inspected at the time of delivery. Returns will only be accepted in the presence of the delivery runner. If you find the items to be of poor quality, please hand them back immediately for an instant refund to your General Store Karyana Shop Wallet.</p>
                          <p><strong>Non-Perishables (Staples, Groceries, Packaged Goods):</strong> Unopened and undamaged items can be returned within 48 hours. Items with broken seals, signs of use, or missing original packaging will not be accepted unless there is a clear manufacturing defect.</p>
                          <p><strong>How to Initiate a Return:</strong>
                            <ol class="list-decimal pl-6 space-y-2">
                              <li>Navigate to your "Order History" in your Profile.</li>
                              <li>Select the relevant order.</li>
                              <li>Click the "Return" button on the item(s) you wish to return.</li>
                              <li>Select the product, specify quantity, and provide a valid reason for the return.</li>
                              <li>Submit the request. Your request will be reviewed by our admin team, and you will be notified of the status.</li>
                            </ol>
                          </p>
                          <p><strong>Refund Policy:</strong> Once a return request is approved by our admin, refunds will be credited to your General Store Karyana Shop Wallet. Refunds to original payment methods (Bank/Card) may take 5-7 business days as per banking standards.</p>
                        </div>
                      </section>

                      <section class="border-l-4 border-stone-100 pl-8 transition-all hover:border-primary/40 group">
                        <h3 class="text-2xl font-black text-stone-900 mb-6 uppercase tracking-tight flex items-center">
                          <span class="w-8 h-8 bg-stone-100 text-stone-400 group-hover:bg-primary group-hover:text-white rounded-lg flex items-center justify-center text-sm mr-4 transition-colors">07</span>
                          Security & Prohibited Activities
                        </h3>
                        <div class="space-y-4 text-stone-600 leading-relaxed">
                          <p>Users are prohibited from using the platform for any fraudulent purpose, including but not limited to:</p>
                          <ul class="list-disc pl-6 space-y-2">
                            <li>Creating multiple accounts to exploit promotional coupons.</li>
                            <li>Using stolen credit/debit cards or unauthorized digital wallets.</li>
                            <li>Attempting to bypass security protocols or scrape data from the platform.</li>
                            <li>Providing fake delivery locations to evade delivery charges.</li>
                          </ul>
                        </div>
                      </section>

                      <section class="border-l-4 border-stone-100 pl-8 transition-all hover:border-primary/40 group">
                        <h3 class="text-2xl font-black text-stone-900 mb-6 uppercase tracking-tight flex items-center">
                          <span class="w-8 h-8 bg-stone-100 text-stone-400 group-hover:bg-primary group-hover:text-white rounded-lg flex items-center justify-center text-sm mr-4 transition-colors">08</span>
                          Data Privacy & Security
                        </h3>
                        <div class="space-y-4 text-stone-600 leading-relaxed">
                          <p>Your privacy and the security of your personal data are our top priorities. We collect and use your information exclusively to enhance your shopping experience as detailed in our Privacy Policy. By continuing to use our services, you consent to receive crucial order updates, relevant offers, and logistical communications via SMS, WhatsApp, and Email.</p>
                          <p>Rest assured, we employ industry-standard encryption to protect your communications and personal data.</p>
                          <p>Note: Your delivery runner is provided with your phone number and location solely for the duration of the active delivery. They are strictly prohibited from storing or contacting you for any other purpose.</p>
                        </div>
                      </section>

                      <section class="border-l-4 border-stone-100 pl-8 transition-all hover:border-primary/40 group">
                        <h3 class="text-2xl font-black text-stone-900 mb-6 uppercase tracking-tight flex items-center">
                          <span class="w-8 h-8 bg-stone-100 text-stone-400 group-hover:bg-primary group-hover:text-white rounded-lg flex items-center justify-center text-sm mr-4 transition-colors">09</span>
                          Governing Law & Disputes
                        </h3>
                        <div class="space-y-4 text-stone-600 leading-relaxed">
                          <p>These terms are governed by the laws of India. Any disputes arising from these terms or your use of the platform shall be subject to the exclusive jurisdiction of the courts in Ludhiana, Punjab.</p>
                          <p>In case of grievances, please contact our support desk (support@hindstore.com) first. We aim to resolve all customer issues amicably within 72 hours.</p>
                        </div>
                      </section>
                    </div>
                  ` }}
                />
              )}
            </div>
          </motion.div>

          <div className="mt-12 text-center">
            <p className="text-stone-400 text-sm">
              If you have any questions about these terms, please contact our support team.
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
