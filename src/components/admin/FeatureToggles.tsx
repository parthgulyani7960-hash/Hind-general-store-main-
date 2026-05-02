import React from 'react';
import toast from 'react-hot-toast';
import { cn } from '../../lib/utils';
import { Settings, ToggleLeft, ToggleRight } from 'lucide-react';

interface FeatureTogglesProps {
  config: any[];
  onUpdate: () => void;
}

const FEATURES = [
  { key: 'feature_wholesaler_enabled', label: 'Wholesaler Module' },
  { key: 'feature_bulk_discount_enabled', label: 'Bulk Discount Module' },
  { key: 'feature_khata_enabled', label: 'Khata System (Credit)' },
  { key: 'feature_delivery_areas_enabled', label: 'Delivery Areas (Zones)' },
];

export default function FeatureToggles({ config, onUpdate }: FeatureTogglesProps) {
  const handleToggle = async (key: string, currentValue: string) => {
    const newValue = currentValue === 'true' ? 'false' : 'true';
    try {
      const res = await fetch('/api/admin/config/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [key]: newValue })
      });
      if (res.ok) {
        toast.success('Feature updated successfully');
        onUpdate();
      } else {
        toast.error('Failed to update feature');
      }
    } catch (error) {
      toast.error('Failed to update feature');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Feature Toggles</h2>
        <div className="text-sm text-stone-500 font-medium">Global System Controls</div>
      </div>
      
      <div className="grid gap-4">
        {FEATURES.map((feature) => {
          const setting = config.find(c => c.key === feature.key);
          const isEnabled = setting ? setting.value === 'true' : false;
          
          return (
            <div key={feature.key} className="bg-white p-6 rounded-3xl border border-stone-100 shadow-sm flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className={cn("p-3 rounded-2xl", isEnabled ? "bg-primary/10 text-primary" : "bg-stone-100 text-stone-400")}>
                  <Settings size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-stone-900">{feature.label}</h3>
                  <p className="text-xs text-stone-500 uppercase tracking-wider mt-0.5">Key: {feature.key}</p>
                </div>
              </div>
              
              <button
                onClick={() => handleToggle(feature.key, isEnabled ? 'true' : 'false')}
                className={cn(
                  "p-2 rounded-xl transition-all",
                  isEnabled ? "text-primary" : "text-stone-300"
                )}
              >
                {isEnabled ? <ToggleRight size={40} /> : <ToggleLeft size={40} />}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
