import React from 'react';
import { RefreshCw } from 'lucide-react';
import { motion } from 'motion/react';

interface WalletRequestsTabProps {
    walletRequests: any[];
    fetchWalletRequests: () => void;
    handleWalletRequest: (requestId: string, action: 'approve' | 'reject') => void;
    handleViewEvidence: (evidenceUrl: string) => void;
}

export default function WalletRequestsTab({ 
  walletRequests, 
  fetchWalletRequests, 
  handleWalletRequest, 
  handleViewEvidence 
}: WalletRequestsTabProps) {
  return (
    <motion.div 
      initial="hidden"
      animate="show"
      variants={{
        hidden: { opacity: 0 },
        show: { opacity: 1, transition: { staggerChildren: 0.05 } }
      }}
      className="max-w-full overflow-x-hidden space-y-10 pb-10 pr-2"
    >
       <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 pb-2">
        <div>
          <h2 className="text-4xl font-black text-stone-900 tracking-tight">Financial Hub</h2>
          <p className="text-stone-500 mt-1 text-base font-medium">Verify and crystalize customer ledger top-up protocols.</p>
        </div>
        <motion.button 
          whileHover={{ rotate: 180 }}
          onClick={fetchWalletRequests}
          className="p-4 bg-white border border-stone-200 rounded-2xl text-stone-400 hover:text-stone-900 transition-all shadow-sm group"
        >
          <RefreshCw size={22} className="group-active:animate-spin" />
        </motion.button>
      </header>

      <div className="bg-white rounded-[2.5rem] shadow-sm border border-stone-100 overflow-hidden">
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left">
            <thead className="bg-stone-50/50 text-stone-400 text-[9px] uppercase font-black tracking-[0.25em]">
              <tr>
                <th className="px-10 py-8">Origin Node</th>
                <th className="px-6 py-8">Request Value</th>
                <th className="px-6 py-8">Protocol ID</th>
                <th className="px-6 py-8">Evidence</th>
                <th className="px-6 py-8">Time Slice</th>
                <th className="px-10 py-8 text-right">Goverance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-50">
              {walletRequests.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-10 py-32 text-center text-stone-400 font-bold uppercase tracking-widest text-xs">
                    No pending financial top-up requests found.
                  </td>
                </tr>
              ) : (
                walletRequests.map((request) => (
                  <tr key={request.id} className="hover:bg-stone-50/50 transition-colors group">
                    <td className="px-10 py-6">
                      <div className="flex flex-col">
                        <span className="text-sm font-black text-stone-900 line-clamp-1">{request.user_name}</span>
                        <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">{request.user_phone}</span>
                      </div>
                    </td>
                    <td className="px-6 py-6 font-black text-stone-900">₹{request.amount}</td>
                    <td className="px-6 py-6 font-mono text-xs text-stone-400">{request.id.slice(0, 8)}...</td>
                    <td className="px-6 py-6">
                      {(request.evidence_url || request.screenshot) ? (
                        <button 
                          onClick={() => handleViewEvidence(request.evidence_url || request.screenshot)}
                          className="text-[10px] font-black uppercase tracking-widest text-primary hover:underline"
                        >
                          Review Asset
                        </button>
                      ) : (
                        <span className="text-xs text-stone-300">None</span>
                      )}
                    </td>
                    <td className="px-6 py-6 text-xs text-stone-400 font-bold capitalize">
                      {new Date(request.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-10 py-6 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button 
                          onClick={() => handleWalletRequest(request.id, 'approve')}
                          className="px-4 py-2 bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20"
                        >
                          Approve
                        </button>
                        <button 
                          onClick={() => handleWalletRequest(request.id, 'reject')}
                          className="px-4 py-2 border border-stone-200 text-stone-400 text-[10px] font-black uppercase tracking-widest rounded-xl hover:text-stone-900 transition-all"
                        >
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
}
