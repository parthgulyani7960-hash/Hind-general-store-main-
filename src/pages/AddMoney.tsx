import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronLeft, 
  Wallet, 
  ArrowRight,
  Upload, 
  CheckCircle2, 
  Copy, 
  Download,
  Loader2,
  ShieldCheck,
  Check,
  ChevronRight
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { fetchWithHandling } from '../lib/api';
import { getAuthHeaders } from '../lib/utils';
import toast from 'react-hot-toast';
import { useStore } from '../StoreContext';
import { cn } from '../lib/utils';

export default function AddMoney() {
  const navigate = useNavigate();
  const { user, config = [] } = useStore();

  const [step, setStep] = useState(1);
  const [amount, setAmount] = useState('');
  const [paymentId, setPaymentId] = useState('');
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [confirm, setConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedId, setCopiedId] = useState(false);

  const upiId = config.find(c => c.key === 'upi_id')?.value || 'parthgulyani7960@okaxis';
  const upiName = config.find(c => c.key === 'upi_name')?.value || 'General Store Karyana Shop';
  const upiQrOverridden = config.find(c => c.key === 'upi_qr')?.value;

  const numericAmount = Number(amount) || 0;
  const upiLink = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(upiName)}&am=${numericAmount}&cu=INR&tn=Add_Money_Wallet`;
  const dynamicQrCodeSrc = `https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${encodeURIComponent(upiLink)}`;
  const displayQr = upiQrOverridden || dynamicQrCodeSrc;

  const downloadQR = async () => {
    try {
      const response = await fetch(displayQr);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `payment-qr-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast.success('QR downloaded');
    } catch {
      toast.error('Failed to download');
    }
  };

  const handleCopyUpiId = () => {
    navigator.clipboard.writeText(upiId);
    setCopiedId(true);
    toast.success('Copied!');
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleSubmit = async () => {
    if (!paymentId.trim() || !screenshot || !confirm) return;
    setIsSubmitting(true);
    try {
      const data = await fetchWithHandling<{ success: boolean; message?: string }>('/api/wallet/add', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ userId: user?.id, amount: Number(amount), paymentId: paymentId.trim(), screenshot })
      });
      if (data && data.success) {
        toast.success(data.message || 'Submitted');
        navigate('/history?tab=wallet');
      } else toast.error(data?.message || 'Failed');
    } finally { setIsSubmitting(false); }
  };

  const quickAmounts = [200, 500, 1000, 2000];

  return (
    <div className="h-screen bg-stone-50 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 flex items-center justify-between bg-white border-b border-stone-100">
        <Link to="/history?tab=wallet" className="p-2 hover:bg-stone-100 rounded-xl transition">
          <ChevronLeft size={20} className="text-stone-700" />
        </Link>
        <h1 className="font-black text-stone-900 tracking-tight">Deposit Funds</h1>
        <div className="w-10" />
      </div>

      {/* Stepper Progress */}
      <div className="flex gap-2 p-6 justify-center">
        {[1, 2, 3].map(s => (
          <div key={s} className={cn("h-1.5 w-12 rounded-full transition-all", step >= s ? "bg-stone-900" : "bg-stone-200")} />
        ))}
      </div>

      {/* Main Content Area (No Scroll) */}
      <div className="flex-1 relative overflow-hidden">
        <AnimatePresence mode="wait">
          
          {/* Step 1: Amount */}
          {step === 1 && (
            <motion.div key="1" initial={{ x: 50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -50, opacity: 0 }} className="h-full w-full flex flex-col items-center justify-center p-6 space-y-8">
              <h2 className="text-2xl font-black text-stone-900">Enter Amount</h2>
              <input type="number" value={amount} onChange={e => setAmount(e.target.value)} className="w-full max-w-xs text-center text-4xl font-extrabold py-4 bg-transparent outline-none" placeholder="₹ 0" />
              <div className="flex gap-2">
                {quickAmounts.map(a => (
                  <button key={a} onClick={() => setAmount(String(a))} className="px-4 py-2 bg-stone-200 rounded-xl font-bold text-xs">+ ₹{a}</button>
                ))}
              </div>
              <button disabled={Number(amount) < 50} onClick={() => setStep(2)} className="bg-stone-900 text-white px-8 py-3 rounded-2xl font-black disabled:opacity-40">Continue</button>
            </motion.div>
          )}

          {/* Step 2: Payment */}
          {step === 2 && (
            <motion.div key="2" initial={{ x: 50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -50, opacity: 0 }} className="h-full w-full flex flex-col items-center justify-center p-6 space-y-6">
              <div className="p-4 bg-white rounded-3xl shadow-sm border border-stone-100">
                <img src={displayQr} alt="QR" className="w-56 h-56" />
              </div>
              <div className="flex gap-2">
                <button onClick={handleCopyUpiId} className="px-4 py-2 bg-stone-100 rounded-xl text-xs font-bold flex items-center gap-2"><Copy size={14}/> ID: {upiId.slice(0,10)}...</button>
                <button onClick={downloadQR} className="px-4 py-2 bg-stone-900 text-white rounded-xl text-xs font-bold flex items-center gap-2"><Download size={14}/> Save QR</button>
              </div>
              <div className="flex gap-4">
                <button onClick={() => setStep(1)} className="text-sm font-bold text-stone-500">Back</button>
                <button onClick={() => setStep(3)} className="bg-emerald-600 text-white px-8 py-3 rounded-2xl font-black">Paid</button>
              </div>
            </motion.div>
          )}

          {/* Step 3: Proof */}
          {step === 3 && (
            <motion.div key="3" initial={{ x: 50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -50, opacity: 0 }} className="h-full w-full flex flex-col items-center justify-center p-6 space-y-6">
              <input type="text" value={paymentId} onChange={e => setPaymentId(e.target.value)} placeholder="UTR / Transaction ID" className="w-full max-w-sm px-4 py-3 bg-white rounded-xl border border-stone-200" />
              <input type="file" accept="image/*" onChange={e => {
                const reader = new FileReader();
                reader.onloadend = () => setScreenshot(reader.result as string);
                reader.readAsDataURL(e.target.files![0]);
              }} className="hidden" id="file" />
              <label htmlFor="file" className="cursor-pointer text-xs font-bold p-4 border rounded-xl">{screenshot ? 'Screenshot Attached' : 'Attach Screenshot'}</label>
              <label className="flex gap-2 text-xs"><input type="checkbox" checked={confirm} onChange={e => setConfirm(e.target.checked)}/> Acknowledge audit logs</label>
              <button disabled={isSubmitting} onClick={handleSubmit} className="bg-stone-900 text-white px-8 py-3 rounded-2xl font-black">{isSubmitting ? '...' : 'Complete Deposit'}</button>
            </motion.div>
          )}
          
        </AnimatePresence>
      </div>
    </div>
  );
}
