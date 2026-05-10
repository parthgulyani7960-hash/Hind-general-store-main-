import React from 'react';
import { PackageOpen } from 'lucide-react';

export const EmptyState = ({ 
  title = "No data found", 
  message = "Try adjusting your filters or search criteria.", 
  icon = <PackageOpen className="w-12 h-12 text-stone-300" /> 
}: { 
  title?: string;
  message?: string;
  icon?: React.ReactNode;
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center bg-stone-50 border-2 border-dashed border-stone-200 rounded-3xl">
      <div className="mb-4">{icon}</div>
      <h3 className="text-lg font-bold text-stone-900">{title}</h3>
      <p className="text-stone-500 mt-1 max-w-xs">{message}</p>
    </div>
  );
};
