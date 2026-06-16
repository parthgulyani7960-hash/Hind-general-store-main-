import React, { useState, useEffect } from 'react';
import { Cpu, CheckCircle2, AlertCircle, RefreshCw, Play, Pause } from 'lucide-react';
import { fetchWithHandling } from '@/lib/api';
import toast from 'react-hot-toast';

const API_ENDPOINTS = [
  { name: 'Health Check', path: '/api/health' },
  { name: 'Products', path: '/api/products' },
  { name: 'Orders', path: '/api/orders' },
  { name: 'Users', path: '/api/users' },
  { name: 'System Status', path: '/api/status' },
];

export default function ApiMonitorTab() {
  const [statuses, setStatuses] = useState<Record<string, 'loading' | 'ok' | 'error'>>({});

  const checkApi = async (path: string) => {
    setStatuses(prev => ({ ...prev, [path]: 'loading' }));
    try {
      await fetch(path);
      setStatuses(prev => ({ ...prev, [path]: 'ok' }));
      toast.success(`${path} is operational`);
    } catch (e) {
      setStatuses(prev => ({ ...prev, [path]: 'error' }));
      toast.error(`${path} failed`);
    }
  };

  useEffect(() => {
    API_ENDPOINTS.forEach(api => checkApi(api.path));
  }, []);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-black text-stone-900">API Monitoring</h2>
        <button className="flex items-center space-x-2 text-xs font-bold text-stone-500 hover:text-stone-900" onClick={() => API_ENDPOINTS.forEach(a => checkApi(a.path))}>
          <RefreshCw size={14} />
          <span>Refresh All</span>
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {API_ENDPOINTS.map(api => (
          <div key={api.path} className="p-4 bg-white rounded-2xl border border-stone-100 shadow-sm flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className={cn("p-3 rounded-xl", statuses[api.path] === 'ok' ? 'bg-emerald-50 text-emerald-500' : statuses[api.path] === 'error' ? 'bg-red-50 text-red-500' : 'bg-stone-50')}>
                <Cpu size={20} />
              </div>
              <div>
                <h3 className="font-bold text-stone-900">{api.name}</h3>
                <code className="text-[10px] text-stone-400 bg-stone-100 px-1.5 py-0.5 rounded italic">{api.path}</code>
              </div>
            </div>
            {statuses[api.path] === 'loading' ? (
              <RefreshCw className="animate-spin text-stone-300" />
            ) : statuses[api.path] === 'ok' ? (
              <CheckCircle2 className="text-emerald-500" />
            ) : (
              <AlertCircle className="text-red-500" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

const cn = (...classes: string[]) => classes.filter(Boolean).join(' ');
