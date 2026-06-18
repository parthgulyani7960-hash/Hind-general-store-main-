import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/types';

interface ProgressiveImageProps {
  src: string;
  alt: string;
  className?: string;
  placeholderSrc?: string; // Optional low-res version
  blur?: boolean;
  loading?: "lazy" | "eager";
}

export const ProgressiveImage = ({ 
  src, 
  alt, 
  className, 
  placeholderSrc,
  blur = true,
  loading = "lazy"
}: ProgressiveImageProps) => {
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <div className={cn("relative overflow-hidden bg-stone-100", className)}>
      {/* Automatic Blur-up Placeholder (simulated with a very low-res fallback) */}
      {!isLoaded && (
        <img 
          src={placeholderSrc || src}
          alt=""
          className="absolute inset-0 w-full h-full object-cover blur-2xl scale-110 opacity-60"
          loading="lazy"
        />
      )}

      <motion.img
        src={src}
        alt={alt}
        loading={loading}
        onLoad={() => setIsLoaded(true)}
        initial={false}
        animate={{
          opacity: isLoaded ? 1 : 0,
          scale: isLoaded ? 1 : 1.05,
          filter: isLoaded ? 'blur(0px)' : 'blur(4px)'
        }}
        transition={{ 
          duration: 0.6,
          ease: "easeOut"
        }}
        className={cn(
          "w-full h-full object-cover relative z-10",
          !isLoaded && "pointer-events-none"
        )}
      />
    </div>
  );
};
