import React from 'react';
import { motion, HTMLMotionProps } from 'motion/react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends HTMLMotionProps<"button"> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', isLoading, children, disabled, ...props }, ref) => {
    
    const baseClasses = "relative flex items-center justify-center gap-2 px-6 py-3 rounded-2xl font-bold transition-all duration-200 outline-none focus:ring-4 focus:ring-indigo-100 disabled:opacity-50 disabled:cursor-not-allowed";
    
    const variantClasses = {
      primary: "bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-600/20 active:scale-[0.98]",
      secondary: "bg-stone-100 text-stone-900 hover:bg-stone-200 active:scale-[0.98]",
      danger: "bg-red-600 text-white hover:bg-red-700 shadow-lg shadow-red-600/20 active:scale-[0.98]",
      ghost: "bg-transparent text-stone-600 hover:bg-stone-100 hover:text-stone-900"
    };

    return (
      <motion.button
        ref={ref}
        whileHover={{ scale: disabled || isLoading ? 1 : 1.02 }}
        whileTap={{ scale: disabled || isLoading ? 1 : 0.98 }}
        className={cn(baseClasses, variantClasses[variant], className)}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && <Loader2 className="animate-spin w-4 h-4" />}
        {children}
      </motion.button>
    );
  }
);

Button.displayName = "Button";
