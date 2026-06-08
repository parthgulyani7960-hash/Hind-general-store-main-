import React from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ImageGalleryModalProps {
  images: string[];
  initialIndex: number;
  onClose: () => void;
}

export const ImageGalleryModal: React.FC<ImageGalleryModalProps> = ({ images, initialIndex, onClose }) => {
  const [index, setIndex] = React.useState(initialIndex);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div id="product-modal" className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4" onClick={onClose}>
      <motion.div 
         initial={{ opacity: 0, y: 50, scale: 0.95 }}
         animate={{ opacity: 1, y: 0, scale: 1 }}
         exit={{ opacity: 0, y: 20, scale: 0.95 }}
         className="modal-content-wrapper backdrop-blur-xl bg-white/10 p-6 rounded-3xl"
         onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-white/10 rounded-full text-white hover:bg-white/20">
          <X size={24} />
        </button>
      
      <button 
        onClick={(e) => { e.stopPropagation(); setIndex((i) => (i - 1 + images.length) % images.length); }}
        className="absolute left-4 p-2 bg-white/10 rounded-full text-white hover:bg-white/20"
      >
        <ChevronLeft size={24} />
      </button>
      
      <motion.img
        key={index}
        src={images[index]}
        initial={{ opacity: 0, x: 100 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -100 }}
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={1}
        onDragEnd={(e, { offset, velocity }) => {
          const swipe = Math.abs(offset.x) * velocity.x;
          if (swipe < -10000) setIndex((i) => (i + 1) % images.length);
          else if (swipe > 10000) setIndex((i) => (i - 1 + images.length) % images.length);
        }}
        className="max-w-full max-h-full object-contain cursor-grab active:cursor-grabbing"
        onClick={(e) => e.stopPropagation()}
      />
      
      <button 
        onClick={(e) => { e.stopPropagation(); setIndex((i) => (i + 1) % images.length); }}
        className="absolute right-4 p-2 bg-white/10 rounded-full text-white hover:bg-white/20"
      >
        <ChevronRight size={24} />
      </button>
      
      <div className="absolute bottom-4 text-white text-sm">
        {index + 1} / {images.length}
      </div>
      </motion.div>
    </div>
  );
};
