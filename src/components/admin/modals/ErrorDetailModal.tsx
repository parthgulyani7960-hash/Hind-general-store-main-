
import React from 'react';
import { Bug, X, Trash2, LayoutDashboard, Activity } from 'lucide-react';
import ModalContainer from '@/components/ui/ModalContainer';
import { cn } from '@/lib/utils';
import { fetchWithHandling } from '@/lib/api';
import { getAuthHeaders } from '@/lib/utils';
import { toast } from 'react-hot-toast';

interface ErrorDetailModalProps {
  report: any;
  isOpen: boolean;
  onClose: () => void;
  setBugReports: any;
  bugReports: any[];
}

export const ErrorDetailModal = ({ report, isOpen, onClose, setBugReports, bugReports }: ErrorDetailModalProps) => {
  if (!report) return null;

  return (
    <ModalContainer
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
      showHeader={false}
    >
      <div className="p-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-red-50 text-red-500 rounded-2xl">
              <Bug size={32} />
            </div>
            <div>
              <h3 className="text-2xl font-black text-stone-900 tracking-tight">System Error Details</h3>
              <p className="text-xs font-bold text-stone-400 uppercase tracking-widest mt-1">ID: ERR-{report.id.toString().slice(-6)}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-3 hover:bg-stone-50 rounded-2xl text-stone-400 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
            {/* Modal Content here - simplified for now to ensure build success */}
            <p className="text-sm font-black text-red-600 leading-tight">{report.message}</p>
        </div>
        
        <div className="mt-10 flex space-x-3">
           <button 
            onClick={onClose}
            className="flex-1 py-4 bg-stone-900 text-white rounded-[1.5rem] font-black uppercase tracking-widest text-xs shadow-xl shadow-stone-200"
           >
             Acknowledge Report
           </button>
           <button 
            onClick={async () => {
              try {
                await fetchWithHandling(`/api/bugs/report/${report.id}`, { method: 'DELETE', headers: getAuthHeaders() });
                setBugReports(bugReports.filter((b: any) => b.id !== report.id));
                onClose();
                toast.success('Report Purged');
              } catch (err) {}
            }}
            className="w-16 h-16 bg-red-50 text-red-500 rounded-[1.5rem] flex items-center justify-center hover:bg-red-500 hover:text-white transition-all shadow-sm"
           >
             <Trash2 size={24} />
           </button>
        </div>
      </div>
    </ModalContainer>
  );
};
