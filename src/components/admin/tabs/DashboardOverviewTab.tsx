import React from 'react';
import { motion } from 'motion/react';

export const DashboardOverviewTab = ({ data }: { data: any }) => {
  return (
    <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        className="h-full overflow-y-auto no-scrollbar p-8 pb-10 pr-2"
    >
        {/* Simplified overview content */}
        <h2 className="text-2xl font-black">Overview</h2>
    </motion.div>
  );
};
