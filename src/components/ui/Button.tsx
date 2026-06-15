import React from 'react';
import { motion, HTMLMotionProps } from 'motion/react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';
import { triggerFeedback } from '@/lib/feedback';

interface ButtonProps extends Omit<HTMLMotionProps<"button">, 'children'> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  isLoading?: boolean;
  children?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', isLoading, children, disabled, onClick, ...props }, ref) => {
    
    const handleVibrate = () => {
      triggerFeedback('light');
    };

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      handleVibrate();
      if (onClick) onClick(e);
    };
    
    const baseClasses = "relative flex items-center justify-center gap-2 px-6 py-3 rounded-2xl font-bold transition-all duration-200 outline-none focus:ring-4 focus:ring-stone-100 disabled:opacity-50 disabled:cursor-not-allowed select-none";
    
    const variantClasses = {
      primary: "bg-emerald-600 text-white hover:bg-emerald-700 shadow-md shadow-emerald-900/10 active:scale-[0.98]",
      secondary: "bg-stone-100 text-stone-900 hover:bg-stone-200 active:scale-[0.98]",
      danger: "bg-red-600 text-white hover:bg-red-700 shadow-md shadow-red-900/10 active:scale-[0.98]",
      ghost: "bg-transparent text-stone-600 hover:bg-stone-100 hover:text-stone-900 active:scale-[0.98]"
    };

    return (
      <motion.button
        ref={ref}
        whileHover={{ scale: disabled || isLoading ? 1 : 1.01 }}
        whileTap={{ scale: disabled || isLoading ? 1 : 0.98 }}
        className={cn(baseClasses, variantClasses[variant], className)}
        disabled={disabled || isLoading}
        onClick={handleClick}
        {...props}
      >
        {isLoading ? (
          <div className="flex items-center gap-2">
            <Loader2 className="animate-spin w-4 h-4 text-white/80" />
            <span className="opacity-80">Please wait...</span>
          </div>
        ) : (
          children
        )}
      </motion.button>
    );
  }
);

Button.displayName = "Button";
