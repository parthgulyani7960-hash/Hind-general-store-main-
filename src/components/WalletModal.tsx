import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Wallet, CreditCard, ChevronRight, Camera, 
  CheckCircle2, Download, ExternalLink, Info, Loader2,
  Plus, ArrowRight
} from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import { cn, User } from '@/types';
import toast from 'react-hot-toast';
import ModalContainer from './ui/ModalContainer';

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  refreshHistory: () => void;
  config: any[];
}

type Mode = 'amount' | 'payment' | 'submission' | 'success';

export default function WalletModal({ isOpen, onClose, user, refreshHistory, config }: WalletModalProps) {
  const [mode, setMode] = useState<Mode>('amount');
  const [amount, setAmount] = useState('');
  const [utr, setUtr] = useState('');
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const qrRef = useRef<HTMLDivElement>(null);

  const upiId = config.find(c => c.key === 'upi_id')?.value || 'hindstore@upi';
  const upiName = config.find(c => c.key === 'upi_name')?.value || 'General Store Karyana Shop';
  
  const bankName = config.find(c => c.key === 'bank_name')?.value;
  const bankHolder = config.find(c => c.key === 'account_holder')?.value;
  const bankAccount = config.find(c => c.key === 'account_number')?.value;
  const bankIfsc = config.find(c => c.key === 'ifsc_code')?.value;

  const downloadQR = () => {
    const canvas = qrRef.current?.querySelector('canvas');
    if (canvas) {
      const url = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = url;
      link.download = `payment_qr_${user.id}.png`;
      link.click();
      toast.success('QR Code saved');
    }
  };

  const handleSubmit = async () => {
    if (!amount || isNaN(Number(amount))) {
      toast.error('Invalid amount');
      return;
    }
    if (!utr && !screenshot) {
      toast.error('Please provide UTR or Screenshot');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/wallet/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          userId: user.id,
          amount: Number(amount),
          paymentId: utr,
          screenshot
        })
      });
      const data = await res.json();
      if (data.success) {
        setMode('success');
        refreshHistory();
      } else {
        toast.error(data.message);
      }
    } catch (err) {
      toast.error('Failed to submit request');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleScreenshotUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setScreenshot(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  if (!isOpen) return null;

  return (
    <ModalContainer
      isOpen={isOpen}
      onClose={onClose}
      size="xl"
      showHeader={false}
      className="max-w-4xl sm:rounded-[3rem] h-full sm:h-auto border-0"
    >
      <div className="flex flex-col md:flex-row h-full relative z-10">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 sm:top-8 sm:right-8 z-30 p-2 bg-stone-100/80 hover:bg-stone-200 text-stone-900 rounded-full transition-all border border-stone-200/50 shadow-sm"
        >
          <X size={20} />
        </button>

        {/* Brand Side - Visual Context */}
        <div className="w-full md:w-[320px] bg-stone-900 p-8 sm:p-12 text-white flex flex-col justify-between shrink-0 overflow-hidden relative">
           {/* Abstract Glows */}
           <div className="absolute -top-20 -right-20 w-64 h-64 bg-primary/20 rounded-full blur-[100px]" />
           <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-emerald-500/10 rounded-full blur-[100px]" />

           <div className="relative z-10 space-y-12">
              <div className="flex items-center gap-4">
                 <div className="w-14 h-14 bg-white/10 backdrop-blur-md rounded-[1.25rem] border border-white/20 flex items-center justify-center shadow-lg">
                    <Wallet size={28} className="text-primary" />
                 </div>
                 <div>
                    <h3 className="text-2xl font-black tracking-tight leading-none">Wallet</h3>
                    <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mt-1">Refill Station</p>
                 </div>
              </div>

              <div className="space-y-8">
                 {[
                   { step: 1, label: 'Identify Value', active: mode === 'amount' },
                   { step: 2, label: 'Authorize UPI', active: mode === 'payment' },
                   { step: 3, label: 'Verify Payload', active: mode === 'submission' }
                 ].map((s) => (
                   <div key={s.step} className={cn("flex items-center gap-5 transition-all duration-500", s.active ? "translate-x-2" : "opacity-30 grayscale")}>
                      <div className={cn("w-8 h-8 rounded-full border-2 flex items-center justify-center text-[10px] font-black shadow-inner", s.active ? "bg-primary border-primary text-white shadow-primary/20" : "border-white/20")}>{s.step}</div>
                      <span className="text-[11px] font-bold uppercase tracking-[0.2em]">{s.label}</span>
                   </div>
                 ))}
              </div>
           </div>

           <div className="relative z-10 pt-12">
              <div className="bg-white/5 backdrop-blur-md p-6 rounded-3xl border border-white/10 shadow-2xl">
                 <p className="text-[9px] font-black text-stone-500 uppercase tracking-widest mb-2">Available Balance</p>
                 <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-black">₹{user.wallet_balance}</span>
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                 </div>
                 <p className="text-[8px] text-stone-500 font-bold mt-4 uppercase tracking-tighter leading-relaxed">Secured with military grade SSL and manual audit verification protocols.</p>
              </div>
           </div>
        </div>

        {/* Action Panel */}
        <div className="flex-1 bg-white p-8 sm:p-16 overflow-y-auto no-scrollbar relative flex flex-col justify-center">
          <AnimatePresence mode="wait">
            {mode === 'amount' && (
              <motion.div 
                key="amount"
                initial={{ opacity: 0, scale: 0.98, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98, y: -10 }}
                className="max-w-md mx-auto w-full space-y-12"
              >
                <div className="text-center sm:text-left">
                  <h2 className="text-4xl font-black text-stone-900 tracking-tight leading-tight">Define Deposit<br/><span className="text-stone-300">Amount</span></h2>
                  <p className="text-stone-500 mt-3 font-medium">Funds will be added instantly after verification.</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {[200, 500, 1000, 2000].map(amt => (
                    <motion.button 
                      whileHover={{ y: -4, scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      key={amt}
                      onClick={() => setAmount(amt.toString())}
                      className={cn(
                        "group py-6 rounded-[2rem] border-2 transition-all duration-300 flex flex-col items-center gap-1",
                        amount === amt.toString() 
                          ? "bg-primary border-primary text-white shadow-2xl shadow-primary/30" 
                          : "bg-white border-stone-100 text-stone-900 hover:border-primary hover:shadow-xl shadow-stone-100"
                      )}
                    >
                      <span className={cn("text-[9px] font-black uppercase tracking-widest mb-1 group-hover:text-primary transition-colors", amount === amt.toString() && "text-white/60")}>Refill</span>
                      <span className="text-2xl font-black tracking-tighter">₹{amt}</span>
                    </motion.button>
                  ))}
                </div>

                <div className="relative group">
                  <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-emerald-500/20 rounded-[2.5rem] blur opacity-0 group-focus-within:opacity-100 transition-opacity" />
                  <div className="relative flex items-center bg-stone-50 border border-stone-100 rounded-[2rem] px-8 py-7 focus-within:bg-white focus-within:border-primary focus-within:shadow-2xl transition-all">
                    <span className="text-4xl font-black text-stone-200 mr-4 group-focus-within:text-primary transition-colors">₹</span>
                    <input 
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="Custom Value"
                      className="w-full bg-transparent outline-none text-4xl font-black text-stone-900 placeholder:text-stone-200 tracking-tighter"
                    />
                  </div>
                </div>

                <motion.button 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={!amount || Number(amount) < 10}
                  onClick={() => setMode('payment')}
                  className="w-full bg-stone-900 text-white py-7 rounded-[2rem] font-black text-sm uppercase tracking-[0.3em] shadow-2xl shadow-stone-300 hover:bg-primary transition-all disabled:opacity-30 disabled:scale-100 flex items-center justify-center gap-4 group"
                >
                  <span>Generate Payment Protocol</span>
                  <Plus size={20} className="group-hover:rotate-90 transition-transform" />
                </motion.button>
              </motion.div>
            )}

            {mode === 'payment' && (
              <motion.div 
                key="payment"
                initial={{ opacity: 0, scale: 0.98, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98, y: -10 }}
                className="max-w-md mx-auto w-full flex flex-col items-center space-y-10"
              >
                <div className="text-center">
                  <h2 className="text-4xl font-black text-stone-900 tracking-tight leading-tight">Station <span className="text-stone-300">UPI</span><br/>Gateway</h2>
                  <p className="text-stone-500 mt-3 font-medium">Capture this QR and fulfill exactly <span className="font-black text-primary">₹{amount}</span></p>
                </div>

                <div ref={qrRef} className="relative group">
                  <div className="absolute -inset-8 bg-primary/5 rounded-full blur-3xl animate-pulse -z-10" />
                  <div className="p-8 bg-white rounded-[3.5rem] border-8 border-stone-50 shadow-2xl relative transition-transform duration-500 group-hover:scale-105">
                    <QRCodeCanvas 
                      value={`upi://pay?pa=${upiId}&pn=${encodeURIComponent(upiName)}&am=${amount}&cu=INR`}
                      size={240}
                      level="H"
                      imageSettings={{
                        src: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 40'%3E%3Crect width='40' height='40' rx='12' fill='%23ea580c'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='white' font-family='sans-serif' font-weight='900' font-size='22'%3EH%3C/text%3E%3C/svg%3E",
                        height: 50,
                        width: 50,
                        excavate: true,
                      }}
                    />
                  </div>
                  <motion.button 
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={downloadQR}
                    className="absolute -bottom-4 -right-4 w-16 h-16 bg-stone-900 text-white rounded-3xl shadow-2xl flex items-center justify-center hover:bg-primary transition-all rotate-3 hover:rotate-0"
                  >
                    <Download size={24} />
                  </motion.button>
                </div>

                <div className="w-full grid grid-cols-2 gap-4">
                   <div className="bg-stone-50 p-5 rounded-3xl border border-stone-100 flex flex-col items-center justify-center text-center">
                      <p className="text-[8px] font-black text-stone-400 uppercase tracking-widest mb-1">UPI Handle</p>
                      <p className="text-xs font-black text-stone-800 break-all select-all cursor-copy" onClick={() => { navigator.clipboard.writeText(upiId); toast.success('ID Copied'); }}>{upiId}</p>
                   </div>
                   <div className="bg-emerald-50 p-5 rounded-3xl border border-emerald-100 flex flex-col items-center justify-center text-center">
                      <p className="text-[8px] font-black text-emerald-400 uppercase tracking-widest mb-1">Gateway Mode</p>
                      <p className="text-xs font-black text-emerald-800">High Speed Secure</p>
                   </div>
                </div>

                <div className="flex flex-col w-full gap-4 pt-4">
                  <motion.button 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setMode('submission')}
                    className="w-full bg-primary text-white py-7 rounded-[2rem] font-black text-sm uppercase tracking-[0.3em] shadow-2xl shadow-primary/20 flex items-center justify-center gap-3"
                  >
                    <span>Authorize Fulfillment</span>
                    <CheckCircle2 size={20} />
                  </motion.button>
                  <button 
                    onClick={() => setMode('amount')}
                    className="text-[10px] font-black text-stone-400 uppercase tracking-[0.2em] hover:text-stone-600 transition-colors"
                  >
                    Recalibrate Amount
                  </button>
                </div>
              </motion.div>
            )}

            {mode === 'submission' && (
              <motion.div 
                key="submission"
                initial={{ opacity: 0, scale: 0.98, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98, y: -10 }}
                className="max-w-md mx-auto w-full space-y-10"
              >
                <div className="text-center sm:text-left">
                  <h2 className="text-4xl font-black text-stone-900 tracking-tight leading-tight">Payload<br/><span className="text-stone-300">Verification</span></h2>
                  <p className="text-stone-500 mt-3 font-medium">Upload proof to finalize the ledger update.</p>
                </div>

                <div className="space-y-6">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-1 ml-1">UTR Reference Code</label>
                    <input 
                      type="text"
                      value={utr}
                      onChange={(e) => setUtr(e.target.value)}
                      placeholder="12-digit UPI Number"
                      className="w-full px-8 py-6 bg-stone-50 border border-stone-100 rounded-[2rem] outline-none focus:border-primary font-black text-stone-800 placeholder:text-stone-200 tracking-widest focus:bg-white transition-all shadow-inner"
                    />
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-1 ml-1">Audit Screenshot</label>
                    <div className="relative group">
                       <div className="absolute -inset-1 bg-gradient-to-r from-primary to-emerald-500 rounded-[2.5rem] blur opacity-0 group-hover:opacity-20 transition-opacity" />
                      <input 
                        type="file" 
                        accept="image/*"
                        onChange={handleScreenshotUpload}
                        className="hidden" 
                        id="modal-screenshot-upload"
                      />
                      <label 
                        htmlFor="modal-screenshot-upload"
                        className={cn(
                          "flex flex-col items-center justify-center gap-4 w-full py-12 border-2 border-dashed rounded-[2.5rem] cursor-pointer transition-all relative overflow-hidden",
                          screenshot ? "border-primary bg-primary/5" : "border-stone-100 hover:border-primary bg-stone-50/50"
                        )}
                      >
                        {screenshot ? (
                          <div className="relative group/img">
                            <img src={screenshot} alt="Preview" className="w-48 h-48 object-cover rounded-3xl shadow-2xl border-4 border-white rotate-2 group-hover/img:rotate-0 transition-transform duration-500" />
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/img:opacity-100 transition-opacity rounded-3xl flex items-center justify-center">
                               <Plus size={32} className="text-white rotate-45" onClick={(e) => { e.preventDefault(); setScreenshot(null); }} />
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="p-4 bg-white rounded-2xl shadow-sm text-stone-300">
                               <Camera size={32} />
                            </div>
                            <div className="text-center">
                               <span className="block text-sm font-black text-stone-900 uppercase tracking-widest">Select Evidence</span>
                               <span className="text-[10px] font-bold text-stone-400 uppercase tracking-tighter mt-1">PNG, JPG or WEBP supported</span>
                            </div>
                          </>
                        )}
                      </label>
                    </div>
                  </div>
                </div>

                <motion.button 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={isSubmitting || (!utr && !screenshot)}
                  onClick={handleSubmit}
                  className="w-full bg-stone-900 text-white py-7 rounded-[2rem] font-black text-sm uppercase tracking-[0.3em] shadow-2xl shadow-stone-300 hover:bg-primary transition-all disabled:opacity-30 flex items-center justify-center gap-4"
                >
                  {isSubmitting ? <Loader2 className="animate-spin" size={24} /> : <CheckCircle2 size={24} />}
                  <span>Initialize Verification</span>
                </motion.button>
                
                <button 
                  onClick={() => setMode('payment')}
                  className="w-full text-[10px] font-black text-stone-400 uppercase tracking-[0.2em] hover:text-stone-600 transition-colors text-center"
                >
                  Return to QR Matrix
                </button>
              </motion.div>
            )}

            {mode === 'success' && (
              <motion.div 
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center space-y-10 max-w-sm mx-auto"
              >
                <div className="relative inline-block">
                   <div className="absolute inset-0 bg-emerald-500 blur-3xl opacity-20 animate-pulse" />
                   <div className="w-32 h-32 bg-emerald-100 text-emerald-600 rounded-[2.5rem] flex items-center justify-center mx-auto relative border-4 border-white shadow-2xl rotate-6 group-hover:rotate-0 transition-transform duration-700">
                     <CheckCircle2 size={64} />
                   </div>
                </div>
                
                <div className="space-y-4">
                  <h2 className="text-4xl font-black text-stone-900 tracking-tight leading-tight">Transmission<br/>Successful</h2>
                  <p className="text-stone-500 font-medium leading-relaxed italic">Payload for <span className="text-stone-900 font-black">₹{amount}</span> is currently navigating the manual audit queue. Expect normalization within 48 operational hours.</p>
                </div>

                <motion.button 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onClose}
                  className="w-full bg-emerald-600 text-white py-7 rounded-[2rem] font-black text-sm uppercase tracking-[0.3em] shadow-2xl shadow-emerald-500/20 hover:bg-emerald-700 transition-all"
                >
                  Terminate Session
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </ModalContainer>
  );
}
