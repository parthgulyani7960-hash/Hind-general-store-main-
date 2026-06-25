import React, { useState, useEffect } from 'react';
import { FileDown, Clock, CheckCircle2, AlertCircle, Search, Filter, Download, Trash2, FileText, FileSpreadsheet, Eye, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { fetchWithHandling } from '@/lib/api';
import { getAuthHeaders } from '@/lib/utils';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'motion/react';

interface ExportLog {
  id: string;
  admin_id: string;
  action: string;
  details: string;
  created_at: string;
}

export default function DownloadsTab() {
  const [exports, setExports] = useState<ExportLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [isExporting, setIsExporting] = useState(false);
  const [selectedExportType, setSelectedExportType] = useState('orders');
  const [selectedFormat, setSelectedFormat] = useState('pdf');

  const handleGenerateExport = async () => {
    setIsExporting(true);
    triggerFeedback('medium');
    try {
      const response = await fetch(`/api/admin/export/${selectedExportType}?format=${selectedFormat}`, {
        headers: getAuthHeaders()
      });
      
      if (!response.ok) throw new Error('Export failed');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${selectedExportType}_export_${new Date().toISOString().split('T')[0]}.${selectedFormat}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      
      toast.success(`${selectedExportType.toUpperCase()} export generated in ${selectedFormat.toUpperCase()}`);
      fetchExportHistory(); // Refresh history
    } catch (err) {
      console.error('Export error:', err);
      toast.error('Failed to generate export');
    } finally {
      setIsExporting(false);
    }
  };

  const triggerFeedback = (type: 'light' | 'medium' | 'heavy') => {
    if ('vibrate' in navigator) {
      const patterns = { light: 10, medium: [10, 30, 10], heavy: [20, 50, 20] };
      navigator.vibrate(patterns[type]);
    }
  };

  const fetchExportHistory = async () => {
    setLoading(true);
    try {
      const data = await fetchWithHandling<ExportLog[]>('/api/admin/export-history', {
        headers: getAuthHeaders()
      });
      if (data) setExports(data);
    } catch (err) {
      toast.error('Failed to load export history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExportHistory();
  }, []);

  const filteredExports = exports.filter(exp => {
    const matchesSearch = exp.details.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'all' || exp.details.toLowerCase().includes(filterType.toLowerCase());
    return matchesSearch && matchesType;
  });

  const getFormatIcon = (details: string) => {
    if (details.toLowerCase().includes('pdf')) return <FileText className="text-red-500" size={18} />;
    if (details.toLowerCase().includes('csv') || details.toLowerCase().includes('xlsx')) return <FileSpreadsheet className="text-emerald-500" size={18} />;
    return <FileDown className="text-stone-400" size={18} />;
  };

  const parseDetails = (details: string) => {
    try {
      return JSON.parse(details);
    } catch {
      return { message: details };
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Export Generator Section */}
      <div className="bg-stone-900 text-white p-8 rounded-[3rem] shadow-2xl space-y-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 blur-[100px] rounded-full -mr-20 -mt-20" />
        
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 relative z-10">
          <div className="space-y-2 text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/20 text-primary rounded-full text-[10px] font-black uppercase tracking-widest border border-primary/20">
              <Sparkles size={12} />
              <span>Report Engine</span>
            </div>
            <h2 className="text-3xl font-black tracking-tight leading-none">Generate Document</h2>
            <p className="text-stone-400 text-xs font-bold uppercase tracking-widest">Select data origin and document format</p>
          </div>
          
          <div className="flex flex-wrap gap-4">
            <div className="space-y-2 text-left">
              <label className="text-[10px] font-black text-stone-500 uppercase tracking-widest ml-1">Data Source</label>
              <select 
                className="bg-stone-800 border-none rounded-2xl px-6 py-4 text-xs font-bold text-white focus:ring-2 focus:ring-primary/40 appearance-none min-w-[180px]"
                value={selectedExportType}
                onChange={(e) => setSelectedExportType(e.target.value)}
              >
                <option value="orders">Orders & Logistics</option>
                <option value="products">Inventory Catalog</option>
                <option value="customers">Customer Database</option>
                <option value="audit_logs">System Audit Trail</option>
              </select>
            </div>
            
            <div className="space-y-2 text-left">
              <label className="text-[10px] font-black text-stone-500 uppercase tracking-widest ml-1">Output Format</label>
              <div className="flex bg-stone-800 p-1 rounded-2xl border border-stone-700">
                {['pdf', 'csv', 'xlsx'].map((format) => (
                  <button
                    key={format}
                    onClick={() => setSelectedFormat(format)}
                    className={cn(
                      "px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                      selectedFormat === format 
                        ? "bg-primary text-white shadow-lg" 
                        : "text-stone-500 hover:text-stone-300"
                    )}
                  >
                    {format}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleGenerateExport}
              disabled={isExporting}
              className="px-8 py-4 bg-white text-stone-900 rounded-[2rem] font-black uppercase tracking-widest shadow-xl hover:bg-stone-100 transition-all flex items-center gap-3 disabled:opacity-50 h-[56px] self-end mb-0.5"
            >
              {isExporting ? <Clock className="animate-spin" size={18} /> : <Download size={18} />}
              <span>{isExporting ? 'Generating...' : 'Download Now'}</span>
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-[2.5rem] border border-stone-100 shadow-sm">
        <div className="space-y-1 text-left">
          <h2 className="text-2xl font-black text-stone-900 tracking-tight">Intelligence Exports</h2>
          <p className="text-xs font-bold text-stone-400 uppercase tracking-widest">History of generated reports & data extractions</p>
        </div>
        
        <div className="flex items-center gap-2">
           <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 group-focus-within:text-primary transition-colors" size={16} />
              <input 
                type="text" 
                placeholder="Search history..." 
                className="bg-stone-50 border-none rounded-2xl pl-11 pr-6 py-3 text-xs font-bold focus:ring-2 focus:ring-primary/20 w-64 transition-all"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
           </div>
           <button 
             onClick={fetchExportHistory}
             className="p-3 bg-stone-50 text-stone-600 rounded-2xl hover:bg-stone-100 transition-colors"
           >
             <Clock size={18} />
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-24 bg-stone-100 rounded-3xl animate-pulse" />
          ))
        ) : filteredExports.length === 0 ? (
          <div className="bg-white p-20 rounded-[3rem] border border-stone-100 text-center space-y-4">
             <div className="w-20 h-20 bg-stone-50 rounded-full flex items-center justify-center mx-auto text-stone-200">
                <FileDown size={40} />
             </div>
             <p className="text-stone-400 font-bold uppercase tracking-widest text-xs">No export logs detected in the system.</p>
          </div>
        ) : (
          filteredExports.map((exp) => {
            const details = parseDetails(exp.details);
            return (
              <motion.div 
                layout
                key={exp.id}
                className="bg-white p-5 rounded-3xl border border-stone-100 shadow-sm hover:shadow-md transition-all flex items-center justify-between group"
              >
                <div className="flex items-center gap-4">
                   <div className="w-12 h-12 bg-stone-50 rounded-2xl flex items-center justify-center shrink-0">
                      {getFormatIcon(exp.details)}
                   </div>
                   <div className="text-left">
                      <p className="text-sm font-black text-stone-900 leading-tight">{details.message}</p>
                      <div className="flex items-center gap-3 mt-1">
                         <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest">{new Date(exp.created_at).toLocaleString()}</span>
                         <span className="w-1 h-1 bg-stone-200 rounded-full" />
                         <span className="text-[10px] font-black text-primary uppercase tracking-widest">Admin ID: {exp.admin_id}</span>
                      </div>
                   </div>
                </div>

                <div className="flex items-center gap-2">
                   <button 
                     className="p-3 bg-stone-50 text-stone-400 hover:text-stone-900 hover:bg-stone-100 rounded-2xl transition-all"
                     title="View Metadata"
                   >
                     <Eye size={16} />
                   </button>
                   <button 
                     className="px-5 py-3 bg-stone-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all flex items-center gap-2 shadow-lg shadow-stone-200"
                   >
                     <Download size={14} />
                     <span>Re-Download</span>
                   </button>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}
