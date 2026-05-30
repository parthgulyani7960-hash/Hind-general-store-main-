import React from 'react';
import { motion } from 'motion/react';
import { Store, MapPin, Phone, Mail, Clock, ShieldCheck, HeartHandshake, Search, ExternalLink } from 'lucide-react';
import { useStore } from '@/StoreContext';

export default function AboutUs() {
  const { config = [] } = useStore();
  
  const storeAddress = (config || []).find(c => c.key === 'store_address')?.value || 'Main Market, Nayagaon';
  const storePhone = (config || []).find(c => c.key === 'store_phone')?.value || '+91 98765 43210';
  const googleMapsLink = (config || []).find(c => c.key === 'store_location')?.value || 'https://maps.google.com/?q=Nayagaon';

  return (
    <div className="min-h-screen bg-stone-50 pb-20 pt-safe">
      <div className="bg-primary pt-12 pb-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-stone-900/10" />
        <div className="max-w-7xl mx-auto relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center space-x-2 bg-white/20 backdrop-blur-md px-4 py-2 rounded-full text-white text-sm font-bold uppercase tracking-widest mb-6"
          >
            <Store size={16} />
            <span>Serving Nayagaon Since 2010</span>
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-6xl font-black text-white mb-6 tracking-tight"
          >
            General Store Karyana Shop
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg md:text-xl text-stone-100 max-w-2xl mx-auto font-medium"
          >
            Your trusted neighborhood store for fresh groceries, daily essentials, and premium quality products at the best prices.
          </motion.p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-12 relative z-20">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-3xl p-8 shadow-sm border border-stone-100"
            >
              <h2 className="text-2xl font-black text-stone-900 mb-6 flex items-center space-x-3">
                <HeartHandshake className="text-primary" size={28} />
                <span>Our Story</span>
              </h2>
              <div className="space-y-4 text-stone-600 leading-relaxed text-lg">
                <p>
                  Welcome to General Store Karyana Shop Nayagaon! We have been a cornerstone of the Nayagaon community, providing families with high-quality daily essentials, fresh produce, and exceptional customer service.
                </p>
                <p>
                  Our mission is simple: to make your daily shopping convenient, affordable, and joyful. We source the best grains, spices, and groceries to ensure that your kitchen is always stocked with the finest ingredients.
                </p>
              </div>
            </motion.div>

            {/* Find Us on Google Section */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white rounded-3xl p-8 shadow-sm border border-stone-100 overflow-hidden relative"
            >
              <div className="absolute top-0 right-0 p-8 opacity-5">
                <Search size={120} />
              </div>
              <h2 className="text-2xl font-black text-stone-900 mb-6 flex items-center space-x-3 relative z-10">
                <Search className="text-primary" size={28} />
                <span>Find Us on Google</span>
              </h2>
              <div className="relative z-10">
                <p className="text-stone-600 mb-6 text-lg">
                  Leave a review, view our latest photos, and explore what our community is saying about our store.
                </p>
                <div className="bg-stone-50 border border-stone-200 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0">
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-white rounded-xl shadow-sm flex items-center justify-center text-primary border border-stone-100">
                      <span className="font-black text-2xl">G</span>
                    </div>
                    <div>
                      <p className="font-bold text-stone-900 text-lg">Google Reviews</p>
                      <p className="text-stone-500 text-sm">See us on Google</p>
                    </div>
                  </div>
                  <a 
                    href="https://share.google/eDIcmy3eSRRKtEW43" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="btn-primary w-full sm:w-auto px-8 py-4 flex items-center justify-center space-x-2 shadow-xl shadow-primary/20"
                  >
                    <span>View Listing</span>
                    <ExternalLink size={18} />
                  </a>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-white rounded-3xl p-8 shadow-sm border border-stone-100"
            >
              <h3 className="text-xl font-black text-stone-900 mb-6 flex items-center space-x-3">
                <MapPin className="text-primary" size={24} />
                <span>Visit Our Store</span>
              </h3>
              
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="p-3 bg-stone-50 rounded-xl text-stone-600">
                    <MapPin size={20} />
                  </div>
                  <div>
                    <p className="font-bold text-stone-900">Location</p>
                    <p className="text-stone-600 leading-relaxed mt-1 whitespace-pre-line">{storeAddress}</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="p-3 bg-stone-50 rounded-xl text-stone-600">
                    <Clock size={20} />
                  </div>
                  <div>
                    <p className="font-bold text-stone-900">Store Hours</p>
                    <p className="text-stone-600 mt-1">Mon - Sun: 7:00 AM - 9:30 PM</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="p-3 bg-stone-50 rounded-xl text-stone-600">
                    <Phone size={20} />
                  </div>
                  <div>
                    <p className="font-bold text-stone-900">Contact</p>
                    <p className="text-stone-600 mt-1">{storePhone}</p>
                  </div>
                </div>
              </div>

              <div className="mt-8 rounded-xl overflow-hidden h-48 border border-stone-100 shadow-inner">
                <iframe 
                  title="map"
                  src={`https://www.google.com/maps?q=${encodeURIComponent(storeAddress)}&output=embed`}
                  allowFullScreen
                  loading="lazy"
                  className="w-full h-full border-0"
                />
              </div>

              <div className="mt-4">
                <a 
                  href={googleMapsLink || `https://maps.google.com/?q=${encodeURIComponent(storeAddress)}`}
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-full bg-stone-900 text-white rounded-xl py-4 font-bold flex items-center justify-center space-x-2 hover:bg-stone-800 transition-colors"
                >
                  <MapPin size={18} />
                  <span>Get Directions</span>
                </a>
              </div>
            </motion.div>
          </div>

        </div>
      </div>
    </div>
  );
}
