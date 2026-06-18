import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Store, User, ShieldCheck, CreditCard, ChevronRight, ChevronLeft, 
  Check, Info, FileText, AlertCircle, Sparkles, X, Loader2, Clock 
} from 'lucide-react';
import toast from 'react-hot-toast';
import { getAuthHeaders } from '@/lib/utils';
import { triggerFeedback } from '@/lib/feedback';

interface KhataWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function KhataWizard({ isOpen, onClose, onSuccess }: KhataWizardProps) {
  const [step, setStep] = useState(1);
  const [businessType, setBusinessType] = useState<'wholesaler' | 'retailer' | 'household' | ''>('');
  
  const [formData, setFormData] = useState({
    businessName: '',
    ownerName: '',
    gstNumber: '',
    contactPhone: '',
    estimatedCredit: '10000',
    preferredCycle: 'monthly',
    notes: '',
    agreed: false
  });

  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleNext = () => {
    triggerFeedback('light');
    if (step === 1) {
      if (!businessType) {
        toast.error('Please pick a category to continue.');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (!formData.businessName || !formData.ownerName || !formData.contactPhone) {
        toast.error('Please fill in your business name, owner name and registered phone.');
        return;
      }
      if (businessType === 'wholesaler' && !formData.gstNumber) {
        toast.error('GSTIN is required for Wholesaler classification.');
        return;
      }
      setStep(3);
    } else if (step === 3) {
      setStep(4);
    }
  };

  const handleBack = () => {
    triggerFeedback('light');
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleSubmit = async () => {
    triggerFeedback('medium');
    if (!formData.agreed) {
      toast.error('You must agree to the credit terms & background verification policy.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/profile/apply-khata', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({
          businessName: formData.businessName,
          ownerName: formData.ownerName,
          gstNumber: formData.gstNumber,
          businessType: businessType,
          estimatedCredit: Number(formData.estimatedCredit),
          wholesalerStatus: businessType === 'wholesaler',
          contactPhone: formData.contactPhone,
          notes: formData.notes
        })
      });

      const data = await res.json();
      if (data.success) {
        toast.success('Your Khata credit application is submitted successfully!');
        onSuccess();
        onClose();
      } else {
        toast.error(data.message || 'Something went wrong.');
      }
    } catch (err) {
      toast.error('Network failure submitting application.');
    } finally {
      setSubmitting(false);
    }
  };

  const getStepIndicatorLabel = (s: number) => {
    switch (s) {
      case 1: return 'Classification';
      case 2: return 'Business Credentials';
      case 3: return 'Credit Profile';
      case 4: return 'Terms & Declarations';
      default: return '';
    }
  };

  return (
    <div id="khata-wizard-modal" className="fixed inset-0 z-50 overflow-y-auto bg-stone-950/90 backdrop-blur-md flex items-center justify-center p-0 sm:p-4">
      <div className="bg-white w-full max-w-2xl h-full sm:h-auto sm:min-h-[500px] sm:rounded-[32px] shadow-2xl relative overflow-hidden flex flex-col">
        
        {/* Banner header decoration */}
        <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-emerald-400 via-teal-500 to-indigo-500"></div>

        {/* Top Header */}
        <div className="px-6 py-5 border-b border-stone-100 flex items-center justify-between mt-1 select-none shrink-0">
          <div>
            <h2 className="text-xl font-serif font-black text-stone-900 flex items-center gap-2">
              <Sparkles className="text-emerald-500 w-5 h-5 animate-pulse" />
              <span>Khata Credit Portal</span>
            </h2>
            <p className="text-[10px] text-stone-400 font-bold uppercase tracking-wider mt-0.5">
              Secure B2B Credit Application Wizard
            </p>
          </div>
          <button 
            id="close-khata-wizard"
            onClick={onClose} 
            className="p-2 text-stone-400 hover:text-stone-700 hover:bg-stone-50 rounded-2xl transition-all cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Progress Tracker */}
        <div className="bg-stone-50/50 px-6 py-4 border-b border-stone-100 flex items-center justify-between shrink-0 select-none">
          <div className="flex-1 flex items-center gap-2">
            {[1, 2, 3, 4].map((s) => (
              <React.Fragment key={s}>
                <div 
                  className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-black transition-all duration-300 ${
                    step === s 
                      ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20' 
                      : step > s 
                        ? 'bg-emerald-100 text-emerald-700' 
                        : 'bg-stone-200 text-stone-500'
                  }`}
                >
                  {step > s ? <Check size={12} className="stroke-[3]" /> : s}
                </div>
                {s < 4 && (
                  <div className={`flex-1 h-1 rounded-full transition-colors duration-300 ${
                    step > s ? 'bg-emerald-300' : 'bg-stone-200'
                  }`}></div>
                )}
              </React.Fragment>
            ))}
          </div>
          <div className="ml-4 shrink-0 text-right">
            <span className="text-[9px] font-black tracking-widest text-stone-400 uppercase">
              Step {step}/4
            </span>
            <p className="text-xs font-bold text-stone-700">{getStepIndicatorLabel(step)}</p>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto px-6 py-8">
          {step === 1 && (
            <motion.div 
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <div className="space-y-1">
                <h3 className="text-lg font-black text-stone-900">Define Your Business Identity</h3>
                <p className="text-xs text-stone-500">Pick the category that fits your operations best. Each Tier gets custom-tailored credit caps and billing timelines.</p>
              </div>

              {/* Grid selectors */}
              <div className="grid grid-cols-1 gap-4">
                {[
                  {
                    id: 'wholesaler',
                    title: 'Wholesaler / Bulk Distributor',
                    desc: 'High frequency purchase for warehouse supply. Best terms, highest capacity.',
                    cap: '₹50,000 Credit Limit',
                    cycle: '30-Day Billing Loop',
                    icon: Store,
                    style: 'border-emerald-200 hover:border-emerald-500 active-bg-emerald-50/20',
                    badge: 'Best Tier'
                  },
                  {
                    id: 'retailer',
                    title: 'Retailer / Local Shop Owner',
                    desc: 'Purchase for store retail stock or local business inventory. Fast approval.',
                    cap: '₹15,000 Credit Limit',
                    cycle: '15-Day Billing Cycle',
                    icon: Store,
                    style: 'border-blue-200 hover:border-blue-500 active-bg-blue-50/20',
                    badge: 'Recommended'
                  },
                  {
                    id: 'household',
                    title: 'Household / Frequent Shopper',
                    desc: 'Individual high-volume buyer with monthly household requirements.',
                    cap: '₹5,000 Credit Limit',
                    cycle: 'Monthly Settled Billing',
                    icon: User,
                    style: 'border-stone-200 hover:border-stone-500 active-bg-stone-50/20',
                    badge: 'Individual'
                  }
                ].map((item) => (
                  <div
                    key={item.id}
                    onClick={() => {
                      setBusinessType(item.id as any);
                      // Pre-populate estimated defaults
                      const targetCredits = { wholesaler: '50000', retailer: '15000', household: '5000' }[item.id];
                      const targetCycles = { wholesaler: 'monthly', retailer: 'fortnightly', household: 'monthly' }[item.id];
                      setFormData(prev => ({
                        ...prev,
                        estimatedCredit: targetCredits || '10000',
                        preferredCycle: targetCycles || 'monthly'
                      }));
                    }}
                    className={`relative p-5 border-2 rounded-2xl cursor-pointer transition-all flex items-start gap-4 ${
                      businessType === item.id 
                        ? 'border-emerald-500 bg-emerald-50/10 shadow-sm' 
                        : 'border-stone-100 hover:bg-stone-50/50'
                    }`}
                  >
                    <div className={`p-3 rounded-xl ${
                      businessType === item.id ? 'bg-emerald-500 text-white' : 'bg-stone-100 text-stone-500'
                    }`}>
                      <item.icon size={20} />
                    </div>
                    <div className="flex-1 pr-6">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-stone-900 text-sm">{item.title}</span>
                        {item.badge && (
                          <span className={`text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider ${
                            item.id === 'wholesaler' ? 'bg-emerald-100 text-emerald-800' 
                            : item.id === 'retailer' ? 'bg-blue-100 text-blue-800' 
                            : 'bg-stone-100 text-stone-700'
                          }`}>
                            {item.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-stone-500 mt-1">{item.desc}</p>
                      
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2.5 text-[10px] font-bold text-stone-400">
                        <span className="flex items-center gap-1">
                          <CreditCard size={11} className="text-emerald-500" />
                          <span>Cap: {item.cap}</span>
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock size={11} className="text-stone-500" />
                          <span>Terms: {item.cycle}</span>
                        </span>
                      </div>
                    </div>
                    {businessType === item.id && (
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 bg-emerald-500 text-white rounded-full flex items-center justify-center">
                        <Check size={12} className="stroke-[3]" />
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Dynamic Information Display Box based on Selection */}
              {businessType && (
                <motion.div 
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-4 rounded-xl border flex gap-3 text-xs leading-relaxed ${
                    businessType === 'wholesaler' 
                      ? 'bg-emerald-50/50 text-emerald-800 border-emerald-100'
                      : businessType === 'retailer'
                        ? 'bg-blue-50/50 text-blue-800 border-blue-100'
                        : 'bg-stone-50 text-stone-700 border-stone-200'
                  }`}
                >
                  <Info size={16} className="shrink-0 mt-0.5 text-current" />
                  <div className="space-y-1">
                    <p className="font-bold">Important Classification Rule:</p>
                    {businessType === 'wholesaler' && (
                      <p>
                        Wholesalers benefit from lowest bulk margins. **Active GSTIN verification** is mandatory in the next step. Minimum monthly spending is capped at ₹15,000 to maintain this premium status.
                      </p>
                    )}
                    {businessType === 'retailer' && (
                      <p>
                        Retailers are assigned a standard 15-day automated billing cycle. Recommended for local grocery stall and retail inventory buyers. GSTIN is encouraged for tax write-offs.
                      </p>
                    )}
                    {businessType === 'household' && (
                      <p>
                        Standard consumer billing is processed monthly with an active ₹5,000 margin limit. Applications are authorized digitally with zero documentation, based strictly on previous general history.
                      </p>
                    )}
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}

          {step === 2 && (
            <motion.div 
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-5"
            >
              <div className="space-y-1">
                <h3 className="text-lg font-black text-stone-900">Verify Business Authority</h3>
                <p className="text-xs text-stone-500">Provide legal identification and registration details to unlock higher credit caps.</p>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-stone-600 block">Business / Shop Name *</label>
                    <input 
                      type="text"
                      value={formData.businessName}
                      onChange={(e) => setFormData(prev => ({ ...prev, businessName: e.target.value }))}
                      required
                      className="w-full text-sm px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:border-emerald-500 focus:bg-white outline-none transition-all font-medium text-stone-800"
                      placeholder="e.g. Gulyani Grocery Store"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-stone-600 block">Owner Registered Name *</label>
                    <input 
                      type="text"
                      value={formData.ownerName}
                      onChange={(e) => setFormData(prev => ({ ...prev, ownerName: e.target.value }))}
                      required
                      className="w-full text-sm px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:border-emerald-500 focus:bg-white outline-none transition-all font-medium text-stone-800"
                      placeholder="e.g. Parth Gulyani"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-stone-600 block">
                      GSTIN Identification {businessType === 'wholesaler' ? '*' : '(Optional)'}
                    </label>
                    <input 
                      type="text"
                      value={formData.gstNumber}
                      onChange={(e) => setFormData(prev => ({ ...prev, gstNumber: e.target.value.toUpperCase() }))}
                      pattern="^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$"
                      className="w-full text-sm px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:border-emerald-500 focus:bg-white outline-none transition-all font-medium font-mono text-stone-800"
                      placeholder="e.g. 07AAAAA1111A1Z1"
                    />
                    {businessType === 'wholesaler' && (
                      <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                        <ShieldCheck size={12} />
                        <span>Mandatory for wholesale pricing active auditing.</span>
                      </span>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-stone-600 block">Primary Contact Phone *</label>
                    <input 
                      type="tel"
                      value={formData.contactPhone}
                      onChange={(e) => setFormData(prev => ({ ...prev, contactPhone: e.target.value }))}
                      className="w-full text-sm px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:border-emerald-500 focus:bg-white outline-none transition-all font-medium text-stone-800"
                      placeholder="e.g. +91 98765 43210"
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div 
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <div className="space-y-1">
                <h3 className="text-lg font-black text-stone-900">Configure Credit Policy Terms</h3>
                <p className="text-xs text-stone-500">Formulate your repayment frequencies and estimated volume limits.</p>
              </div>

              <div className="space-y-5">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-stone-600">Expected Monthly spending cap limit</label>
                    <span className="text-sm font-black text-emerald-600">₹{Number(formData.estimatedCredit).toLocaleString('en-IN')}</span>
                  </div>
                  <input 
                    type="range"
                    min="5000"
                    max={businessType === 'wholesaler' ? '50000' : businessType === 'retailer' ? '25000' : '10000'}
                    step="5000"
                    value={formData.estimatedCredit}
                    onChange={(e) => setFormData(prev => ({ ...prev, estimatedCredit: e.target.value }))}
                    className="w-full accent-emerald-500 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-stone-400 font-bold">
                    <span>Min: ₹5,000</span>
                    <span>Max: ₹{businessType === 'wholesaler' ? '50,000' : businessType === 'retailer' ? '25,000' : '10,000'}</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-stone-600 block">Repayment Billing Loop Option</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'weekly', label: 'Weekly', desc: 'Frequent clears' },
                      { id: 'fortnightly', label: '15 Days', desc: 'Mid-term cycles' },
                      { id: 'monthly', label: 'Monthly', desc: 'Consolidated end' }
                    ].map((cycle) => (
                      <div
                        key={cycle.id}
                        onClick={() => setFormData(prev => ({ ...prev, preferredCycle: cycle.id }))}
                        className={`p-3 border-2 rounded-xl text-center cursor-pointer transition-all ${
                          formData.preferredCycle === cycle.id 
                            ? 'border-emerald-500 bg-emerald-50/5' 
                            : 'border-stone-100 hover:bg-stone-50 text-stone-500'
                        }`}
                      >
                        <p className="text-xs font-black text-stone-800">{cycle.label}</p>
                        <p className="text-[9px] text-stone-400 mt-0.5">{cycle.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-stone-600 block">Brief usage rationale or notes</label>
                  <textarea
                    rows={3}
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    className="w-full text-sm p-4 bg-stone-50 border border-stone-200 rounded-xl focus:border-emerald-500 focus:bg-white outline-none transition-all text-stone-800 font-medium"
                    placeholder="Provide any additional comments (e.g. peak buying seasons, wholesale order category requirements)..."
                  />
                </div>
              </div>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div 
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <div className="space-y-1">
                <h3 className="text-lg font-black text-stone-900">Declarations and Credit Agreement</h3>
                <p className="text-xs text-stone-500">Carefully read the official protocols for general credit utilization protocol.</p>
              </div>

              <div className="space-y-4">
                <div className="p-5 bg-stone-50 rounded-2xl border border-stone-200 space-y-3 max-h-[160px] overflow-y-auto text-[11px] leading-relaxed text-stone-600 font-medium scrollbar-thin">
                  <p className="font-bold text-stone-800 text-xs">OFFICIAL B2B GENERAL TERMS FOR REPAYMENT:</p>
                  <p>1. Payments must be processed and fully cleared within the predefined billing frequency ({formData.preferredCycle === 'weekly' ? '7 Days' : formData.preferredCycle === 'fortnightly' ? '15 Days' : '30 Days'}).</p>
                  <p>2. Any transaction delay will trigger immediate freeze status on the credit line, forbidding further checkouts.</p>
                  <p>3. Outstanding balances left unsettled after the due buffer window are subject to nominal late penalties of 1.5% per week.</p>
                  <p>4. The store reserves full rights to run physical store site audits, digital credit checks, or historical ledger background checks before approving final limits.</p>
                </div>

                <div className="flex items-start gap-3 p-4 bg-emerald-50/20 border border-emerald-100 rounded-2xl">
                  <input 
                    type="checkbox"
                    id="checkbox-agreed"
                    checked={formData.agreed}
                    onChange={(e) => setFormData(prev => ({ ...prev, agreed: e.target.checked }))}
                    className="mt-1 accent-emerald-500 w-4 h-4 cursor-pointer"
                  />
                  <label htmlFor="checkbox-agreed" className="text-xs font-bold text-stone-700 leading-tight select-none cursor-pointer">
                    I solemnly declare that all provided B2B information is accurate and authorize the store management to run local business verification audits.
                  </label>
                </div>

                {/* Summary Box */}
                <div className="p-4 bg-stone-50 rounded-xl border border-stone-100 space-y-2 select-none text-xs">
                  <p className="font-extrabold uppercase tracking-widest text-[9px] text-stone-400">Application Summary:</p>
                  <div className="grid grid-cols-2 gap-y-1 text-stone-600">
                    <span className="font-semibold">Classification:</span>
                    <span className="font-bold text-stone-800 capitalize">{businessType}</span>
                    <span className="font-semibold">Shop Name:</span>
                    <span className="font-bold text-stone-800">{formData.businessName}</span>
                    <span className="font-semibold">Requested Limit:</span>
                    <span className="font-black text-emerald-600">₹{Number(formData.estimatedCredit).toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Bottom Actions Navigation */}
        <div className="px-6 py-5 border-t border-stone-100 flex items-center justify-between bg-stone-50 shrink-0">
          <button 
            id="wizard-back-btn"
            onClick={handleBack}
            disabled={step === 1 || submitting}
            className={`px-4 py-2.5 rounded-xl border font-bold text-xs flex items-center gap-1 cursor-pointer transition-all ${
              step === 1 
                ? 'opacity-0 cursor-default' 
                : 'border-stone-200 text-stone-600 hover:bg-stone-100 active:scale-95'
            }`}
          >
            <ChevronLeft size={16} />
            <span>Prev</span>
          </button>

          {step < 4 ? (
            <button 
              id="wizard-next-btn"
              onClick={handleNext}
              className="px-5 py-2.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl font-bold text-xs flex items-center gap-1 cursor-pointer transition-all active:scale-95 hover:shadow-md"
            >
              <span>Continue</span>
              <ChevronRight size={16} />
            </button>
          ) : (
            <button 
              id="wizard-submit-btn"
              onClick={handleSubmit}
              disabled={submitting}
              className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-300 text-white rounded-xl font-extrabold text-xs flex items-center gap-2 cursor-pointer transition-all active:scale-95 hover:shadow-lg hover:shadow-emerald-500/20"
            >
              {submitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Submitting Ledger...</span>
                </>
              ) : (
                <>
                  <ShieldCheck size={16} />
                  <span>Authorize & Submit</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
