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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4" onClick={onClose}>
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
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-full max-h-full object-contain"
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
    </div>
  );
};
