import React from 'react';
import toast from 'react-hot-toast';
import { cn, getAuthHeaders } from '@/lib/utils';
import { fetchWithHandling } from '@/lib/api';
import { Settings } from 'lucide-react';
import { motion } from 'motion/react';

interface FeatureTogglesProps {
  config: any[];
  onUpdate: () => void;
}

const FEATURES = [
  { key: 'feature_wholesaler_enabled', label: 'Wholesaler Module', description: 'Enable the wholesaler B2B dashboard and features.' },
  { key: 'feature_bulk_discount_enabled', label: 'Bulk Discount Module', description: 'Allow setting tiered pricing for bulk orders.' },
  { key: 'feature_khata_enabled', label: 'Khata System (Credit)', description: 'Enable credit management for trusted customers.' },
  { key: 'feature_top_bar_enabled', label: 'Top Promotion Bar', description: 'Enable or disable the animated ticker bar at the very top.' },
  { key: 'feature_announcement_bar_enabled', label: 'Announcement Bar', description: 'Enable or disable the global announcement bar.' },
  { key: 'feature_promotions_page_enabled', label: 'Promotions Page Active', description: 'If disabled, users see a "Coming Soon" message on the promotions page.' },
  { key: 'feature_delivery_areas_enabled', label: 'Delivery Areas (Zones)', description: 'Restrict services based on geographic zones.' },
  { key: 'feature_show_product_images', label: 'Display Product Images', description: 'Enable or disable the display of product images across the site.' },
];

export default function FeatureToggles({ config, onUpdate }: FeatureTogglesProps) {
  const handleToggle = async (key: string, currentValue: string) => {
    const newValue = currentValue === 'true' ? 'false' : 'true';
    try {
      const result = await fetchWithHandling<any>('/api/admin/config/update', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({ [key]: newValue })
      });
      if (result) {
        toast.success('Feature updated');
        onUpdate();
      }
    } catch (error) {
      // toast is already handled in fetchWithHandling for serious errors
      // but here success depends on result being present
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end border-b border-stone-100 pb-6">
        <div>
            <h2 className="text-3xl font-black text-stone-900 tracking-tighter">Feature Toggles</h2>
            <p className="text-sm text-stone-500 font-medium mt-1">Manage global system functionalities and module availability.</p>
        </div>
      </div>
      
      <div className="grid gap-4">
        {FEATURES.map((feature) => {
          const setting = (config || []).find(c => c.key === feature.key);
          const isEnabled = setting ? setting.value === 'true' : false;
          
          return (
            <motion.div 
                key={feature.key} 
                className={cn(
                    "bg-white p-6 rounded-3xl border shadow-sm flex items-center justify-between transition-colors",
                    isEnabled ? "border-primary/20 shadow-primary/5" : "border-stone-100"
                )}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex items-center space-x-4">
                <div className={cn("p-4 rounded-2xl", isEnabled ? "bg-primary/10 text-primary" : "bg-stone-100 text-stone-400")}>
                  <Settings size={22} />
                </div>
                <div>
                  <h3 className="font-bold text-stone-900">{feature.label}</h3>
                  <p className="text-xs text-stone-500 mt-1 max-w-sm">{feature.description}</p>
                </div>
              </div>
              
              <button
                onClick={() => handleToggle(feature.key, isEnabled ? 'true' : 'false')}
                className={cn(
                  "relative w-16 h-8 rounded-full transition-colors duration-300",
                  isEnabled ? "bg-primary" : "bg-stone-200"
                )}
              >
                <motion.div
                    className="absolute top-1 w-6 h-6 bg-white rounded-full shadow-sm"
                    initial={false}
                    animate={{ x: isEnabled ? 32 : 4 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              </button>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
