import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useStore } from '@/StoreContext';
import { Link } from 'react-router-dom';
import { Megaphone, ExternalLink, ArrowRight, X } from 'lucide-react';

export const TopPromotionTicker = () => {
    const { announcements = [], config = [] } = useStore();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isVisible, setIsVisible] = useState(true);

    // Filter announcements to find ones suitable for the top bar or use the fallback
    const tickerItems = announcements.length > 0 
        ? announcements.map(a => ({ id: a.id, text: a.content, link: '/' }))
        : [{ id: 'default', text: 'Shop online with ease. Fresh essentials delivered to your doorstep in 1-2 business days!', link: '/products' }];

    useEffect(() => {
        if (tickerItems.length <= 1) return;
        const interval = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % tickerItems.length);
        }, 5000);
        return () => clearInterval(interval);
    }, [tickerItems.length]);

    if (!isVisible || tickerItems.length === 0) return null;

    const currentItem = tickerItems[currentIndex];

    return (
        <div className="bg-stone-900 overflow-hidden relative z-[100]">
            <div className="max-w-7xl mx-auto px-4 h-9 sm:h-10 flex items-center justify-between text-white/90">
                <div className="flex-1 overflow-hidden pointer-events-none">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentIndex}
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: -20, opacity: 0 }}
                            transition={{ duration: 0.5, ease: "anticipate" }}
                            className="flex items-center justify-center gap-2 text-[10px] sm:text-[11px] font-black uppercase tracking-widest whitespace-nowrap"
                        >
                            <Megaphone size={12} className="text-emerald-400 animate-pulse" />
                            <span className="truncate max-w-[200px] sm:max-w-md">{currentItem.text}</span>
                        </motion.div>
                    </AnimatePresence>
                </div>

                <div className="flex items-center gap-4">
                    <Link 
                        to={currentItem.link} 
                        className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-[0.15em] bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-full transition-all border border-white/5 active:scale-95 group"
                    >
                        <span>Learn More</span>
                        <ArrowRight size={10} className="group-hover:translate-x-0.5 transition-transform" />
                    </Link>
                    <button 
                        onClick={() => setIsVisible(false)}
                        className="text-white/40 hover:text-white transition-colors"
                    >
                        <X size={14} />
                    </button>
                </div>
            </div>
            
            {/* Animated Glow Line at Bottom */}
            <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent animate-pulse" />
        </div>
    );
};
