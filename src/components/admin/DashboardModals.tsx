import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Download } from 'lucide-react';
import { cn } from '@/types';

export const ExportActionModal = ({
  exportModal,
  setExportModal,
  exportFormat,
  setExportFormat,
  handleGlobalExport,
}: any) => (
    <AnimatePresence>
      {exportModal.open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-stone-900/40 backdrop-blur-md p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-white max-w-lg w-full rounded-[3rem] shadow-2xl border-4 border-stone-100 overflow-hidden"
          >
            <div className="p-10 space-y-10">
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                   <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-stone-900 text-white rounded-xl flex items-center justify-center italic font-black">X</div>
                      <h3 className="text-3xl font-black text-stone-900 tracking-tight">Export Central</h3>
                   </div>
                   <p className="text-stone-400 font-bold uppercase text-[10px] tracking-[0.2em] ml-1">Archive & Intel Dispatch Protocol</p>
                </div>
                <button 
                  onClick={() => setExportModal({ ...exportModal, open: false })}
                  className="p-3 bg-stone-50 border border-stone-100 rounded-2xl text-stone-400 hover:text-stone-900 transition-all active:scale-95"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="text-xs font-black text-stone-400 uppercase tracking-widest block mb-4 border-l-2 border-stone-200 pl-4">Resource Target</label>
                  <div className="grid grid-cols-2 gap-4">
                    {['orders', 'products', 'users', 'audit', 'expenses', 'analytics'].map((t) => (
                      <button
                        key={t}
                        onClick={() => setExportModal({ ...exportModal, type: t as any })}
                        className={cn(
                          "px-6 py-5 rounded-2xl border-2 transition-all text-xs font-black uppercase tracking-widest text-left relative group",
                          exportModal.type === t ? "bg-stone-900 text-white border-stone-900 shadow-xl shadow-stone-200" : "bg-stone-50 border-stone-100 text-stone-400 hover:border-stone-200"
                        )}
                      >
                        {t}
                        {exportModal.type === t && <div className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full animate-pulse" />}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                   <label className="text-xs font-black text-stone-400 uppercase tracking-widest block mb-4 border-l-2 border-stone-200 pl-4">Manifest Cipher (Format)</label>
                   <div className="flex flex-wrap gap-4">
                      {['pdf', 'csv', 'xlsx', 'json'].map((f) => (
                        <button
                          key={f}
                          onClick={() => setExportFormat(f as any)}
                          className={cn(
                            "px-8 py-5 rounded-2xl border-2 transition-all text-xs font-black uppercase tracking-widest relative overflow-hidden",
                            exportFormat === f ? "bg-white border-primary text-primary shadow-lg shadow-primary/5" : "bg-stone-50 border-stone-100 text-stone-400 hover:border-stone-200"
                          )}
                        >
                          {f}
                        </button>
                      ))}
                   </div>
                </div>
              </div>

              <div className="pt-6 border-t border-stone-100 flex items-center justify-between gap-6">
                 <p className="text-[10px] text-stone-400 font-bold max-w-[200px] leading-relaxed italic">Warning: Confidential operational data will be serialized. Ensure secure transport.</p>
                 <button
                  onClick={() => handleGlobalExport(exportModal.type, exportFormat)}
                  className="flex-1 bg-stone-900 text-white px-10 py-5 rounded-2xl font-black uppercase tracking-widest shadow-2xl shadow-stone-900/20 hover:bg-black transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center space-x-3"
                 >
                   <Download size={18} />
                   <span>Initiate Dispatch</span>
                 </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

export const DashboardModals = ({
  exportModal,
  setExportModal,
  exportFormat,
  setExportFormat,
  handleGlobalExport,
  exportProgress,
  ExportProgressModal,
}: any) => (
  <>
    <ExportProgressModal open={exportProgress.open} progress={exportProgress.progress} label={exportProgress.label} />
    <ExportActionModal 
        exportModal={exportModal}
        setExportModal={setExportModal}
        exportFormat={exportFormat}
        setExportFormat={setExportFormat}
        handleGlobalExport={handleGlobalExport}
    />
  </>
);
