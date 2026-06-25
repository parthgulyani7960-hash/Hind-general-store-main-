import React from 'react';
import { motion } from 'motion/react';
import { cn } from '@/types';
import { LucideIcon } from 'lucide-react';

/**
 * Properties accepted by the AdminStatCard component.
 */
interface AdminStatCardProps {
  /** The descriptive text label of the statistic representing the metric. */
  label: string;
  /** The value (text or number) of the metric to showcase prominently. */
  value: string | number;
  /** Lucide icon or custom React Node to display on the top-left of the card. */
  icon: React.ReactNode;
  /** Optional meta trend object indicating percentage/ratio change of the metric. */
  trend?: {
    /** The displayed change string (e.g., "+12.4%"). */
    value: string;
    /** If true, styles the metric as trending up (positive green color scheme). */
    isUp?: boolean;
    /** Supplementary categorization label or timeframe (e.g. "vs last week"). */
    label?: string;
    /** Custom Tailwind color override class name for the text representation. */
    color?: string;
  };
  /** Aesthetic color scheme preset mapped to backgrounds and matching status themes. */
  color?: 'primary' | 'emerald' | 'amber' | 'blue' | 'red' | 'stone' | 'purple';
  /** Completion progress bar percentage (0 to 100). Defaults visually if omitted. */
  progress?: number;
  /** Supplementary standard CSS class declarations to append to the container container. */
  className?: string;
  /** Triggered action when clicked. Highlights card container with cursor indicators. */
  onClick?: () => void;
  /** Allows highlighting or clipboard-copying of the display score metric text. */
  selectText?: boolean;
}

/**
 * Render standard administrative kpi metrics cards with beautiful micro-interactions, 
 * adaptive color mappings, trends, and hover state triggers.
 *
 * @component
 */
export default function AdminStatCard({
  label,
  value,
  icon,
  trend,
  color = 'stone',
  progress,
  className,
  onClick,
  selectText = true
}: AdminStatCardProps) {
  
  const colorMap: Record<string, string> = {
    primary: 'bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white',
    emerald: 'bg-emerald-50 text-emerald-600 group-hover:bg-emerald-500 group-hover:text-white',
    amber: 'bg-amber-50 text-amber-600 group-hover:bg-amber-500 group-hover:text-white',
    blue: 'bg-blue-50 text-blue-600 group-hover:bg-blue-500 group-hover:text-white',
    red: 'bg-red-50 text-red-600 group-hover:bg-red-500 group-hover:text-white',
    purple: 'bg-purple-50 text-purple-600 group-hover:bg-purple-500 group-hover:text-white',
    stone: 'bg-stone-50 text-stone-900 group-hover:bg-stone-900 group-hover:text-white'
  };

  const trendColors = trend?.isUp ? 'text-emerald-500' : (trend?.color || 'text-red-500');

const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  };

  return (
    <motion.div 
      variants={cardVariants}
      whileHover={onClick ? { y: -5 } : {}}
      onClick={onClick}
      className={cn(
        "bg-white p-8 rounded-[2.5rem] shadow-sm border border-stone-100 group transition-all duration-500",
        onClick && "cursor-pointer hover:border-primary/20 hover:shadow-xl hover:shadow-stone-200/40",
        className
      )}
    >
      <div className="flex justify-between items-start mb-4">
        <div className={cn(
          "p-3 rounded-2xl transition-all transform group-hover:-rotate-12",
          colorMap[color] || colorMap.stone
        )}>
          {icon}
        </div>
        {trend && (
          <div className={cn("flex items-center text-xs font-black uppercase tracking-widest", trendColors)}>
            <span>{trend.value}</span>
            {trend.label && <span className="ml-1 text-stone-300 font-bold">/ {trend.label}</span>}
          </div>
        )}
      </div>
      <p className="text-stone-400 text-xs font-black uppercase tracking-widest mb-1 select-none">{label}</p>
      <h3 className={cn(
        "text-3xl font-black text-stone-900 tracking-tighter transition-colors",
        selectText && "select-text"
      )}>
        {value}
      </h3>
      <div className="mt-4 h-1 w-full bg-stone-50 rounded-full overflow-hidden">
        <motion.div 
          initial={{ width: 0 }} 
          animate={{ width: progress ? `${progress}%` : '60%' }} 
          className={cn(
            "h-full transition-all",
            color === 'primary' ? 'bg-primary' : 
            color === 'emerald' ? 'bg-emerald-500' : 
            color === 'amber' ? 'bg-amber-500' :
            color === 'blue' ? 'bg-blue-500' :
            color === 'red' ? 'bg-red-500' : 
            color === 'purple' ? 'bg-purple-600' : 'bg-stone-900'
          )} 
        />
      </div>
    </motion.div>
  );
}
