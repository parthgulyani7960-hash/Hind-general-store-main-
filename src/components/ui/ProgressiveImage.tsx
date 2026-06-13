import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/types';

interface ProgressiveImageProps {
  src: string;
  alt: string;
  className?: string;
  placeholderSrc?: string; // Optional low-res version
  blur?: boolean;
}

export const ProgressiveImage = ({ 
  src, 
  alt, 
  className, 
  placeholderSrc,
  blur = true 
}: ProgressiveImageProps) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(placeholderSrc || src);

  useEffect(() => {
    const img = new Image();
    img.src = src;
    img.onload = () => {
      setCurrentSrc(src);
      setIsLoaded(true);
    };
  }, [src]);

  return (
    <div className={cn("relative overflow-hidden bg-stone-100", className)}>
      {/* Skeleton / Placeholder background */}
      {!isLoaded && (
        <div className="absolute inset-0 animate-pulse bg-stone-200" />
      )}
      
      <motion.img
        src={currentSrc}
        alt={alt}
        initial={false}
        animate={{
          filter: blur && !isLoaded ? 'blur(10px)' : 'blur(0px)',
          scale: !isLoaded ? 1.05 : 1,
          opacity: isLoaded || placeholderSrc ? 1 : 0
        }}
        transition={{ 
          duration: 0.6,
          ease: "easeOut"
        }}
        className={cn(
          "w-full h-full object-cover transition-opacity duration-300",
          !isLoaded && placeholderSrc ? "opacity-100" : ""
        )}
        onLoad={() => {
            if (currentSrc === src) setIsLoaded(true);
        }}
      />
    </div>
  );
};
