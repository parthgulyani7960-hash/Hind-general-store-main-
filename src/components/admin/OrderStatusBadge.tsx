import React, { useEffect } from 'react';
import { motion, useAnimation } from 'motion/react';
import { cn } from '@/types';

/**
 * Properties accepted by the OrderStatusBadge component.
 */
interface OrderStatusBadgeProps {
  /** The current status string of the order (e.g. 'delivered', 'cancelled', 'shipped', 'pending'). */
  status: string;
}

/**
 * A highly visual badging component that maps order statuses to standard matching status themes
 * and executes a dynamic, satisfying scaling bump on state changes.
 *
 * @component
 */
export const OrderStatusBadge: React.FC<OrderStatusBadgeProps> = ({ status }) => {
  const controls = useAnimation();

  useEffect(() => {
    // Trigger a pristine, satisfying spring-like scale "bump" when status changes
    controls.start({
      scale: [1, 1.12, 0.97, 1],
      transition: { 
        duration: 0.45, 
        times: [0, 0.35, 0.7, 1],
        ease: "easeInOut" 
      }
    });
  }, [status, controls]);

  return (
    <motion.span
      animate={controls}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        "inline-flex items-center space-x-2.5 px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-[0.15em] border transition-all duration-300 shadow-sm cursor-default select-none",
        status === 'delivered' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
        status === 'cancelled' ? 'bg-red-50 text-red-700 border-red-200' : 
        status === 'shipped' ? 'bg-purple-50 text-purple-700 border-purple-200' :
        'bg-amber-50 text-amber-700 border-amber-200'
      )}
    >
      <div className={cn(
        "w-2.5 h-2.5 rounded-full transition-colors duration-300",
        status === 'delivered' ? 'bg-emerald-500' : 
        status === 'cancelled' ? 'bg-red-500' : 
        status === 'shipped' ? 'bg-purple-500 animate-pulse' :
        'bg-amber-500 animate-pulse'
      )} />
      <span className="transition-colors duration-300">
        {status === 'shipped' ? 'On Route' : status}
      </span>
    </motion.span>
  );
};
