import React from 'react';
import SmartLink from './SmartLink';
import { translations } from '../translations';

export default function Footer({ 
    config, 
    handleNewsletter, 
    newsletterEmail, 
    setNewsletterEmail 
}: { 
    config: any[], 
    handleNewsletter: (e: React.FormEvent) => void,
    newsletterEmail: string,
    setNewsletterEmail: (email: string) => void
}) {
    return (
        <footer className="bg-stone-900 text-stone-400 py-12 pb-32 md:pb-12 mt-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8">
                <div className="space-y-4">
                    <h3 className="text-white font-bold text-lg">General Store Karyana Shop</h3>
                    <p className="text-sm">Your one-stop shop for all karyana and daily essentials. Quality and trust since 1995.</p>
                </div>
                <div className="space-y-4">
                    <h3 className="text-white font-bold text-lg">Quick Links</h3>
                    <ul className="space-y-2 text-sm">
                        <li><SmartLink to="/products" className="hover:text-white transition-colors">All Products</SmartLink></li>
                        <li><SmartLink to="/track-order" className="hover:text-white transition-colors">Track Order</SmartLink></li>
                        <li><SmartLink to="/support" className="hover:text-white transition-colors">Help & Support</SmartLink></li>
                        <li><SmartLink to="/login" className="hover:text-white transition-colors">My Account</SmartLink></li>
                    </ul>
                </div>
                <div className="space-y-4">
                    <h3 className="text-white font-bold text-lg">Customer Care</h3>
                    <ul className="space-y-2 text-sm">
                        <li><SmartLink to="/about" className="hover:text-white transition-colors">About Us</SmartLink></li>
                        <li><SmartLink to="/contact" className="hover:text-white transition-colors">Contact Us</SmartLink></li>
                        <li><SmartLink to="/privacy-policy" className="hover:text-white transition-colors">Privacy Policy</SmartLink></li>
                        <li><SmartLink to="/terms-and-conditions" className="hover:text-white transition-colors">Terms & Conditions</SmartLink></li>
                    </ul>
                </div>
                <div className="space-y-4">
                    <h3 className="text-white font-bold text-lg">Newsletter</h3>
                    <p className="text-sm">Subscribe to get special offers and updates.</p>
                    <form onSubmit={handleNewsletter} className="flex">
                        <input 
                            type="email" 
                            placeholder="Email" 
                            required
                            value={newsletterEmail}
                            onChange={(e) => setNewsletterEmail(e.target.value)}
                            className="bg-stone-800 border-none rounded-l-lg px-4 py-2 w-full focus:ring-1 focus:ring-primary" 
                        />
                        <button type="submit" className="bg-primary text-white px-4 py-2 rounded-r-lg font-bold">Join</button>
                    </form>
                </div>
            </div>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 pt-8 border-t border-stone-800 text-center text-xs">
                © {new Date().getFullYear()} {(config || []).find(c => c.key === 'store_name')?.value || 'New Hind General Store'}. All rights reserved.
            </div>
        </footer>
    );
}
