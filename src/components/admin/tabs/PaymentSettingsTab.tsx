import React from 'react';
import { Image as ImageIcon, Upload } from 'lucide-react';
import { cn } from '@/types';

interface PaymentSettingsTabProps {
  config: any[];
  updateSetting: (key: string, value: string) => void;
}

export default function PaymentSettingsTab({
  config,
  updateSetting,
}: PaymentSettingsTabProps) {
  const safeConfig = Array.isArray(config) ? config : [];

  return (
    <div className="max-w-full overflow-x-hidden max-w-2xl space-y-6 font-sans pb-10 pr-2">
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-stone-100 space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold text-stone-900">UPI Payment Details</h3>
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-stone-500 uppercase">Enable UPI</span>
              <button 
                onClick={() => updateSetting('upi_enabled', safeConfig.find(c => c.key === 'upi_enabled')?.value === 'true' ? 'false' : 'true')}
                className={cn(
                  "w-12 h-6 rounded-full transition-all relative flex items-center px-1",
                  safeConfig.find(c => c.key === 'upi_enabled')?.value === 'true' ? "bg-primary" : "bg-stone-200"
                )}
              >
                <div className={cn(
                  "w-4 h-4 bg-white rounded-full shadow-sm transition-transform",
                  safeConfig.find(c => c.key === 'upi_enabled')?.value === 'true' ? "translate-x-6" : "translate-x-0"
                )} />
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-primary/5 p-4 rounded-2xl border border-primary/10 mb-4">
            <label className="block text-xs font-black text-primary uppercase tracking-widest mb-2 text-left">Verification Mode</label>
            <div className="grid grid-cols-2 gap-2">
              <button 
                onClick={() => updateSetting('upi_verification_mode', 'manual')}
                className={cn(
                  "py-3 rounded-xl text-xs font-bold transition-all border-2",
                  safeConfig.find(c => c.key === 'upi_verification_mode')?.value === 'manual' || !safeConfig.find(c => c.key === 'upi_verification_mode')
                    ? "bg-primary text-white border-primary shadow-lg shadow-primary/20"
                    : "bg-white text-stone-500 border-stone-100 hover:border-stone-200"
                )}
              >
                Manually Verified
              </button>
              <button 
                onClick={() => updateSetting('upi_verification_mode', 'auto')}
                className={cn(
                  "py-3 rounded-xl text-xs font-bold transition-all border-2",
                  safeConfig.find(c => c.key === 'upi_verification_mode')?.value === 'auto'
                    ? "bg-primary text-white border-primary shadow-lg shadow-primary/20"
                    : "bg-white text-stone-500 border-stone-100 hover:border-stone-200"
                )}
              >
                Auto-Verification
              </button>
            </div>
            <p className="text-[10px] text-stone-500 mt-2 italic text-left">
              {safeConfig.find(c => c.key === 'upi_verification_mode')?.value === 'auto' 
                ? "* System will scan emails/webhooks for matching Order IDs." 
                : "* Customers must submit UTR/Screenshot for manual admin approval."}
            </p>
          </div>

          <div>
            <label className="block text-sm font-bold text-stone-700 mb-1 text-left">UPI ID</label>
            <input 
              type="text" 
              className="input-field"
              defaultValue={safeConfig.find(c => c.key === 'upi_id')?.value}
              onBlur={(e) => updateSetting('upi_id', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-stone-700 mb-1 text-left">Receiver Name</label>
            <input 
              type="text" 
              className="input-field"
              defaultValue={safeConfig.find(c => c.key === 'upi_name')?.value}
              onBlur={(e) => updateSetting('upi_name', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-bold text-stone-700 mb-1 text-left">QR Code Image</label>
            <div className="flex items-center space-x-4">
              <div className="w-24 h-24 bg-stone-100 rounded-xl border border-stone-200 overflow-hidden flex items-center justify-center flex-shrink-0">
                {safeConfig.find(c => c.key === 'upi_qr')?.value ? (
                  <img src={safeConfig.find(c => c.key === 'upi_qr')?.value} alt="QR" className="w-full h-full object-contain" />
                ) : (
                  <ImageIcon className="text-stone-300" size={32} />
                )}
              </div>
              <div className="flex-1 space-y-2">
                <input 
                  type="text" 
                  className="input-field text-xs"
                  placeholder="Image URL (https://...)"
                  defaultValue={safeConfig.find(c => c.key === 'upi_qr')?.value}
                  onBlur={(e) => updateSetting('upi_qr', e.target.value)}
                />
                <div className="relative">
                  <button className="w-full py-2 bg-stone-100 hover:bg-stone-200 rounded-lg text-xs font-bold transition-colors flex items-center justify-center space-x-2">
                    <Upload size={14} />
                    <span>Upload from Gallery</span>
                  </button>
                  <input 
                    type="file" 
                    accept="image/*"
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          updateSetting('upi_qr', reader.result as string);
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-stone-100">
            <h4 className="font-bold text-stone-600 text-left">Bank Account Details</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-stone-700 mb-1 text-left">Bank Name</label>
                <input 
                  type="text" 
                  className="input-field"
                  defaultValue={safeConfig.find(c => c.key === 'bank_name')?.value}
                  onBlur={(e) => updateSetting('bank_name', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-stone-700 mb-1 text-left">Account Holder Name</label>
                <input 
                  type="text" 
                  className="input-field"
                  defaultValue={safeConfig.find(c => c.key === 'account_holder')?.value}
                  onBlur={(e) => updateSetting('account_holder', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-stone-700 mb-1 text-left">Account Number</label>
                <input 
                  type="text" 
                  className="input-field"
                  defaultValue={safeConfig.find(c => c.key === 'account_number')?.value}
                  onBlur={(e) => updateSetting('account_number', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-stone-700 mb-1 text-left">IFSC Code</label>
                <input 
                  type="text" 
                  className="input-field"
                  defaultValue={safeConfig.find(c => c.key === 'ifsc_code')?.value}
                  onBlur={(e) => updateSetting('ifsc_code', e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
