import React, { useState, useEffect } from 'react';
import { Mail, RefreshCw, Loader2, CheckCircle2 } from 'lucide-react';
import { fetchWithHandling } from '@/lib/api';
import { getAuthHeaders } from '@/lib/utils';

const UPIWebhookLogsTab: React.FC = () => {
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'failed' | 'all'>('failed');

    const fetchLogs = async () => {
      setLoading(true);
      try {
        const data = await fetchWithHandling<any[]>('/api/admin/emails-log', { headers: getAuthHeaders() });
        if (data) setLogs(data);
      } catch (err) {
        console.error('Failed to fetch UPI logs:', err);
      } finally {
        setLoading(false);
      }
    };

    useEffect(() => {
      fetchLogs();
    }, []);

    const filteredLogs = logs.filter(log => {
      if (filter === 'failed') {
        const status = String(log.match_status || '').toUpperCase();
        return status === 'FAILED' || status === 'REVIEW_REQUIRED';
      }
      return true;
    });

    return (
      <div className="h-full overflow-y-auto no-scrollbar space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-32 pr-2">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-4xl font-black tracking-tighter text-stone-900 flex items-center gap-3">
              <div className="p-3 bg-indigo-100 rounded-3xl text-indigo-600"><Mail size={32} /></div>
              UPI WEBHOOKS & EMAIL PARSING LOGS
            </h2>
            <p className="text-stone-500 font-medium mt-1">Audit trail of bank payment alerts, matches, and failed automation lookups.</p>
          </div>
          <div className="flex gap-2">
            <button onClick={fetchLogs} className="bg-stone-100 text-stone-600 px-6 py-3 rounded-2xl text-xs font-bold uppercase tracking-widest hover:bg-stone-200 transition-all flex items-center gap-2">
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
            </button>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex bg-stone-100 p-1.5 rounded-2xl w-fit">
          <button 
            onClick={() => setFilter('failed')}
            className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${filter === 'failed' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500 hover:text-stone-800'}`}
          >
            Failed & Review Required UPI ({logs.filter(l => String(l.match_status).toUpperCase() !== 'MATCHED').length})
          </button>
          <button 
            onClick={() => setFilter('all')}
            className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${filter === 'all' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500 hover:text-stone-800'}`}
          >
            All Logs ({logs.length})
          </button>
        </div>

        {loading ? (
          <div className="p-12 text-center text-stone-400 font-bold">
            <Loader2 className="animate-spin mx-auto mb-4 text-stone-400" size={32} />
            Parsing dynamic stream databases...
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="bg-white p-16 rounded-[2.5rem] border border-stone-100 text-center space-y-4">
            <div className="w-16 h-16 bg-stone-50 rounded-full flex items-center justify-center mx-auto text-stone-300">
              <CheckCircle2 size={32} />
            </div>
            <h3 className="text-xl font-black text-stone-900 uppercase tracking-tighter">No Failed Webhooks Found</h3>
            <p className="text-stone-500 text-sm max-w-sm mx-auto">All recent bank UPI incoming alerts have been parsed and automated securely.</p>
          </div>
        ) : (
          <div className="bg-white rounded-[2.5rem] border border-stone-100 shadow-sm overflow-hidden divide-y divide-stone-100">
            {filteredLogs.map((log: any) => {
              const matchesOrder = log.matched_order_id || log.extracted_note || '';
              const matchStatus = String(log.match_status || '').toUpperCase();
              return (
                <div key={log.id} className="p-8 hover:bg-stone-50/40 transition-colors">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                        matchStatus === 'MATCHED' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                        matchStatus === 'REVIEW_REQUIRED' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                        'bg-red-50 text-red-600 border-red-100'
                      }`}>
                        {matchStatus}
                      </span>
                      <h4 className="font-extrabold text-stone-800 text-sm tracking-tight truncate max-w-sm md:max-w-md">
                        {log.subject || 'Bank Alert Email Received'}
                      </h4>
                    </div>
                    <span className="text-[10px] text-stone-400 font-bold tracking-wider bg-stone-100 px-3 py-1 rounded-lg">
                      {new Date(log.created_at || log.extracted_timestamp || Date.now()).toLocaleString()}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-xs text-stone-600 mt-2">
                    <div className="md:col-span-3 space-y-4">
                      {/* Match Reason callout card */}
                      <div className={`p-4 rounded-2xl border ${
                        matchStatus === 'MATCHED' ? 'bg-emerald-50/30 border-emerald-100/50 text-emerald-800' :
                        matchStatus === 'REVIEW_REQUIRED' ? 'bg-amber-50/30 border-amber-100/50 text-amber-800' :
                        'bg-red-50/30 border-red-100/50 text-red-800'
                      }`}>
                        <p className="text-[9px] font-black uppercase tracking-widest leading-none mb-1">Reason for Match Verdict</p>
                        <p className="font-bold text-xs">{log.match_reason || 'No match reason log found.'}</p>
                      </div>

                      {/* Email Snippet Display */}
                      <div className="bg-stone-50/50 border border-stone-100 p-4 rounded-xl">
                        <p className="text-[9px] text-stone-400 font-extrabold uppercase tracking-wider mb-2">Raw Alert Snippet Body</p>
                        <p className="font-mono text-[11px] leading-relaxed break-words whitespace-pre-wrap select-all text-stone-600">
                          {log.body || 'No message snippet provided.'}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4 bg-stone-50 p-4 rounded-2xl border border-stone-100">
                      <p className="text-[9px] font-black uppercase tracking-widest text-stone-400 mb-1">Parsed Extract</p>
                      
                      <div className="space-y-2.5">
                        <div>
                          <p className="text-[9px] font-black text-stone-400 uppercase">Alert Amount</p>
                          <p className="text-base font-black text-stone-800">
                            {log.extracted_amount ? `₹${Number(log.extracted_amount).toFixed(2)}` : 'NaN'}
                          </p>
                        </div>

                        <div>
                          <p className="text-[9px] font-black text-stone-400 uppercase">Target Order</p>
                          <p className="text-xs font-extrabold text-stone-700">
                            {matchesOrder ? `#${matchesOrder}` : 'No parsed Order ID'}
                          </p>
                        </div>

                        <div>
                          <p className="text-[9px] font-black text-stone-400 uppercase">Sender Address</p>
                          <p className="text-[10px] font-bold text-stone-500 break-all">
                            {log.sender || 'N/A'}
                          </p>
                        </div>

                        <div>
                          <p className="text-[9px] font-black text-stone-400 uppercase">Unique ID</p>
                          <p className="font-mono text-[10px] text-stone-400 truncate select-all" title={log.message_id || log.id}>
                            {log.message_id || log.id || 'N/A'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
};

export default UPIWebhookLogsTab;
