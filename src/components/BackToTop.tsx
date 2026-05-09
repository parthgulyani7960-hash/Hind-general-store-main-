import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronUp, Share2, HelpCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function BackToTop() {
  const [isVisible, setIsVisible] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.pageYOffset > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
        setIsOpen(false);
      }
    };

    window.addEventListener('scroll', toggleVisibility);
    return () => window.removeEventListener('scroll', toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
    setIsOpen(false);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <div className="fixed bottom-24 right-6 md:bottom-8 md:right-8 z-[100] flex flex-col items-end space-y-3">
          <AnimatePresence>
            {isOpen && (
              <motion.div
                initial={{ opacity: 0, x: 20, scale: 0.8 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 20, scale: 0.8 }}
                className="flex flex-col space-y-3 items-end"
              >
                <button
                  onClick={() => {
                    navigate('/support');
                    setIsOpen(false);
                  }}
                  className="flex items-center space-x-2 bg-white text-stone-700 py-3 px-5 rounded-2xl shadow-xl font-bold text-sm hover:bg-stone-50 transition-all border border-stone-100"
                >
                  <span>Support</span>
                  <HelpCircle size={18} className="text-primary" />
                </button>
                <button
                  onClick={() => {
                    if (navigator.share) {
                      navigator.share({ title: 'General Store Karyana Shop Store', url: window.location.href });
                    }
                    setIsOpen(false);
                  }}
                  className="flex items-center space-x-2 bg-white text-stone-700 py-3 px-5 rounded-2xl shadow-xl font-bold text-sm hover:bg-stone-50 transition-all border border-stone-100"
                >
                  <span>Share</span>
                  <Share2 size={18} className="text-primary" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
          
          <motion.div
            initial={{ opacity: 0, scale: 0.5, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.5, y: 20 }}
            className="flex items-center"
          >
            <button
              onClick={scrollToTop}
              className="p-4 bg-primary text-white rounded-2xl shadow-2xl hover:bg-primary/90 transition-all group mr-3"
              title="Scroll to Top"
            >
              <ChevronUp className="group-hover:-translate-y-1 transition-transform" size={24} />
            </button>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="w-10 h-10 bg-white border border-stone-200 text-stone-600 rounded-full shadow-lg flex items-center justify-center hover:bg-stone-50 transition-all"
            >
              <span className="text-xl leading-none -mt-1">{isOpen ? '×' : '+'}</span>
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
