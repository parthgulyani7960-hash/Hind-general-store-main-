import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  FileSpreadsheet, FileText, Check, Loader2, Download, 
  AlertCircle, X, Sparkles, Clock, Coins, ShoppingCart, User as UserIcon
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useStore } from '@/StoreContext';
import { triggerFeedback } from '@/lib/feedback';

interface ExportManagementProps {
  isOpen: boolean;
  onClose: () => void;
  orders: any[];
  walletHistory: any[];
}

export function ExportManagement({ isOpen, onClose, orders, walletHistory }: ExportManagementProps) {
  const { user, logActivity } = useStore();
  const [format, setFormat] = useState<'csv' | 'pdf'>('pdf');
  
  // Expose scopes
  const [includeProfile, setIncludeProfile] = useState(true);
  const [includeOrders, setIncludeOrders] = useState(true);
  const [includeWallet, setIncludeWallet] = useState(true);

  const [isCompiling, setIsCompiling] = useState(false);
  const [compileStep, setCompileStep] = useState('');

  if (!isOpen) return null;

  const countOrders = includeOrders ? orders.length : 0;
  const countWallet = includeWallet ? walletHistory.length : 0;

  const handleStartExport = async () => {
    setIsCompiling(true);
    triggerFeedback('medium');

    try {
      if (format === 'pdf') {
        setCompileStep('Contacting secure data vault...');
        await new Promise(r => setTimeout(r, 5));

        setCompileStep('Compiling official legal dossier metadata...');
        await new Promise(r => setTimeout(r, 5));

        // Let's create custom filtered data based on user selectors
        const payload: any = {
          user: includeProfile ? user : { name: 'REDACTED', phone: 'REDACTED', email: 'REDACTED', wallet_balance: 0 },
          orders: includeOrders ? orders : [],
          wallet: includeWallet ? walletHistory : [],
          activities: [
            { date: new Date().toISOString(), type: 'DATA_EXPORT', severity: 'low', details: 'User generated custom account PDF Dossier export' }
          ]
        };

        setCompileStep('Rendering vectors and high-contrast tables...');
        const { generateUserExportPDF } = await import('../services/pdfService');
        const doc = await generateUserExportPDF(payload);

        setCompileStep('Writing file stream and initiating system download...');
        await new Promise(r => setTimeout(r, 5));

        // Use clean save protocol
        const safeName = `Account_Dossier_HGS_${user?.id || 'User'}.pdf`;
        doc.save(safeName);

        toast.success('Your formal account dossier PDF is ready and downloading!');
        logActivity('DATA_EXPORT', `User downloaded PDF account dossier data export`);
      } else {
        // Compile CSV
        setCompileStep('Auditing tabular rows...');
        await new Promise(r => setTimeout(r, 5));

        setCompileStep('Constructing comma-separated buffers...');
        const csvRows: string[] = [];
        
        if (includeProfile) {
          csvRows.push("--- USER PROFILE DATA ---");
          csvRows.push("Field,Value");
          csvRows.push(`"Name","${user?.name || 'NOT SPECIFIED'}"`);
          csvRows.push(`"Phone","${user?.phone || 'NOT LINKED'}"`);
          csvRows.push(`"Email","${user?.email || 'OFFLINE_ACCOUNT'}"`);
          csvRows.push(`"Wallet Balance","INR ${parseFloat(String(user?.wallet_balance || 0)).toFixed(2)}"`);
          csvRows.push(`"Address","${(user?.address || 'N/A').replace(/"/g, '""').replace(/\n/g, ' ')}"`);
          csvRows.push("");
        }

        if (includeOrders) {
          csvRows.push("--- COMMERCIAL ORDER HISTORY ---");
          csvRows.push("Order ID,Date,Total Amount,Payment Method,Status,Payment Ref");
          if (orders && orders.length > 0) {
            orders.forEach((o: any) => {
              let dateStr = 'N/A';
              try {
                if (o.created_at) dateStr = new Date(o.created_at).toISOString().split('T')[0];
              } catch (e) {}
              csvRows.push(`"#ORD-${o.id}","${dateStr}","INR ${parseFloat(String(o.total || 0)).toFixed(2)}","${o.payment_method}","${o.status}","${o.payment_id || 'LOCAL'}"`);
            });
          } else {
            csvRows.push("No orders available");
          }
          csvRows.push("");
        }

        if (includeWallet) {
          csvRows.push("--- FINANCIAL WALLET LEDGER ---");
          csvRows.push("Date,Type,Amount,Description");
          if (walletHistory && walletHistory.length > 0) {
            walletHistory.forEach((w: any) => {
              let dateStr = 'N/A';
              try {
                if (w.created_at) dateStr = new Date(w.created_at).toISOString().replace('T', ' ').substring(0, 16);
              } catch (e) {}
              csvRows.push(`"${dateStr}","${w.type}","INR ${parseFloat(String(w.amount || 0)).toFixed(2)}","${(w.description || '').replace(/"/g, '""').replace(/\n/g, ' ')}"`);
            });
          } else {
            csvRows.push("No wallet activity transactions on record");
          }
        }

        setCompileStep('Injecting charset margins and firing download...');
        await new Promise(r => setTimeout(r, 5));

        const csvContent = csvRows.join("\n");
        const csvBlob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const csvDownloadUrl = URL.createObjectURL(csvBlob);
        
        const csvLink = document.createElement("a");
        csvLink.href = csvDownloadUrl;
        csvLink.setAttribute("download", `account_data_${user?.id || 'User'}.csv`);
        document.body.appendChild(csvLink);
        csvLink.click();
        
        document.body.removeChild(csvLink);
        URL.revokeObjectURL(csvDownloadUrl);

        toast.success('Tabular CSV ledger downloaded successfully!');
        logActivity('DATA_EXPORT', `User generated personal details CSV spreadsheet export`);
      }
      onClose();
    } catch (err: any) {
      console.error(err);
      toast.error('File generation failure. Please retry.');
    } finally {
      setIsCompiling(false);
      setCompileStep('');
    }
  };

  return (
    <div id="export-management-modal" className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl relative border border-stone-100 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Top Header */}
        <div className="p-6 border-b border-stone-100 flex items-center justify-between">
          <div className="space-y-1">
            <h3 className="text-lg font-serif font-black text-stone-900 flex items-center gap-2">
              <Sparkles className="text-emerald-500 w-5 h-5" />
              <span>Export Management Hub</span>
            </h3>
            <p className="text-[10px] text-stone-400 font-extrabold uppercase tracking-wide">Secure Data Retrieval Protocols</p>
          </div>
          <button 
            id="close-export-btn"
            onClick={onClose} 
            disabled={isCompiling}
            className="p-2 text-stone-400 hover:text-stone-700 hover:bg-stone-50 rounded-2xl transition-all cursor-pointer disabled:opacity-50"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {isCompiling ? (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-emerald-100 border-t-emerald-500 rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center text-emerald-500 font-black text-xs">
                  HGS
                </div>
              </div>
              <div className="space-y-1">
                <p className="font-extrabold text-stone-800 text-sm">Compiling Data Archive</p>
                <p className="text-xs text-stone-400 max-w-xs">{compileStep}</p>
              </div>
            </div>
          ) : (
            <>
              {/* Format Select Grid */}
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-wider text-stone-400 block">Select Target Format</label>
                <div className="grid grid-cols-2 gap-3">
                  <div
                    onClick={() => {
                      setFormat('pdf');
                      triggerFeedback('light');
                    }}
                    className={`p-4 border-2 rounded-2xl cursor-pointer transition-all flex flex-col items-center text-center gap-2 ${
                      format === 'pdf' 
                        ? 'border-emerald-500 bg-emerald-50/5' 
                        : 'border-stone-100 hover:bg-stone-50'
                    }`}
                  >
                    <div className={`p-3 rounded-xl ${format === 'pdf' ? 'bg-emerald-500 text-white' : 'bg-stone-100 text-stone-500'}`}>
                      <FileText size={20} />
                    </div>
                    <div>
                      <p className="text-xs font-black text-stone-800">Formal Dossier (PDF)</p>
                      <p className="text-[10px] text-stone-400 mt-0.5">Styled document with watermark & grid lines</p>
                    </div>
                  </div>

                  <div
                    onClick={() => {
                      setFormat('csv');
                      triggerFeedback('light');
                    }}
                    className={`p-4 border-2 rounded-2xl cursor-pointer transition-all flex flex-col items-center text-center gap-2 ${
                      format === 'csv' 
                        ? 'border-emerald-500 bg-emerald-50/5' 
                        : 'border-stone-100 hover:bg-stone-50'
                    }`}
                  >
                    <div className={`p-3 rounded-xl ${format === 'csv' ? 'bg-emerald-500 text-white' : 'bg-stone-100 text-stone-500'}`}>
                      <FileSpreadsheet size={20} />
                    </div>
                    <div>
                      <p className="text-xs font-black text-stone-800">Tabular Ledger (CSV)</p>
                      <p className="text-[10px] text-stone-400 mt-0.5">Raw spreadsheet, best for spreadsheet analyses</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Data Scope Selectors */}
              <div className="space-y-3">
                <label className="text-xs font-black uppercase tracking-wider text-stone-400 block">Select Scope Details</label>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3.5 bg-stone-50 rounded-2xl border border-stone-100">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white text-stone-500 rounded-xl border border-stone-100">
                        <UserIcon size={16} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-stone-800">Profile & Contact Metadata</p>
                        <p className="text-[10px] text-stone-400">Personal contact endpoints, physical delivery coordinates</p>
                      </div>
                    </div>
                    <input 
                      type="checkbox"
                      checked={includeProfile}
                      onChange={(e) => setIncludeProfile(e.target.checked)}
                      className="accent-emerald-500 w-4 h-4 cursor-pointer"
                    />
                  </div>

                  <div className="flex items-center justify-between p-3.5 bg-stone-50 rounded-2xl border border-stone-100">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white text-stone-500 rounded-xl border border-stone-100">
                        <ShoppingCart size={16} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-stone-800">Order Logs & Invoices</p>
                        <p className="text-[10px] text-stone-400">{orders.length} orders on ledger file</p>
                      </div>
                    </div>
                    <input 
                      type="checkbox"
                      checked={includeOrders}
                      onChange={(e) => setIncludeOrders(e.target.checked)}
                      className="accent-emerald-500 w-4 h-4 cursor-pointer"
                    />
                  </div>

                  <div className="flex items-center justify-between p-3.5 bg-stone-50 rounded-2xl border border-stone-100">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white text-stone-500 rounded-xl border border-stone-100">
                        <Coins size={16} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-stone-800">Wallet Operations Ledger</p>
                        <p className="text-[10px] text-stone-400">{walletHistory.length} ledger logs found</p>
                      </div>
                    </div>
                    <input 
                      type="checkbox"
                      checked={includeWallet}
                      onChange={(e) => setIncludeWallet(e.target.checked)}
                      className="accent-emerald-500 w-4 h-4 cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              {/* Data Density Summary Card */}
              <div className="p-4 bg-emerald-50/25 border border-emerald-100 rounded-2xl flex items-start gap-3">
                <AlertCircle className="text-emerald-500 mt-0.5 shrink-0" size={16} />
                <div className="space-y-0.5">
                  <p className="text-xs font-bold text-emerald-900">Compile Capacity Estimate</p>
                  <p className="text-[10px] text-emerald-700 leading-relaxed">
                    Including {includeProfile ? '1 Profile' : 'NO Profile'}, {countOrders} Orders, and {countWallet} Financial transactions. Compiled output format: <strong className="uppercase">{format}</strong>. File sizing: ~{((includeProfile ? 5 : 0) + countOrders * 3 + countWallet * 2 + 10)}KB.
                  </p>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Bottom Actions footer */}
        <div className="p-6 border-t border-stone-100 bg-stone-50 flex gap-3">
          <button
            onClick={onClose}
            disabled={isCompiling}
            className="flex-1 py-3 bg-white border border-stone-200 text-stone-600 font-bold rounded-2xl text-xs uppercase tracking-wider hover:bg-stone-100 transition-colors cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleStartExport}
            disabled={isCompiling || (!includeProfile && !includeOrders && !includeWallet)}
            className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-600 disabled:bg-stone-200 disabled:text-stone-400 text-white font-extrabold rounded-2xl text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-emerald-500/10"
          >
            {isCompiling ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                <span>Generating...</span>
              </>
            ) : (
              <>
                <Download size={14} />
                <span>Export Now</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
