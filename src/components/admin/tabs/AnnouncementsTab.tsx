import React from 'react';
import { 
  Bell, Check, CheckCheck, RefreshCw, Plus, 
  Trash2, AlertCircle, ShieldAlert, Users, Calendar, Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';

interface AnnouncementsTabProps {
    notifications: any[];
    fetchNotifications: () => void;
    handleDeleteNotification: (id: string) => void;
    setNotificationModal: (val: any) => void;
    setNewNotification: (val: any) => void;
    fetchWithHandling: <T>(url: string, options?: any) => Promise<T | null>;
    getAuthHeaders: () => any;
    toast: any;
}

const AnnouncementsTab: React.FC<AnnouncementsTabProps> = ({
    notifications,
    fetchNotifications,
    handleDeleteNotification,
    setNotificationModal,
    setNewNotification,
    fetchWithHandling,
    getAuthHeaders,
    toast
}) => {
    return (
        <div className="space-y-8 animate-in fade-in duration-500">
             <div className="bg-white p-10 rounded-[3rem] shadow-xl shadow-stone-200/40 border border-stone-100 flex flex-col lg:flex-row justify-between items-center gap-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -mr-32 -mt-32" />
              <div className="relative z-10 text-center lg:text-left">
                <h2 className="text-4xl font-black text-stone-900 tracking-tighter">Broadcast Center</h2>
                <p className="text-stone-500 mt-2 text-lg max-w-md">Communicate with your customers in real-time. Alerts, updates, and promotions.</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 relative z-10 w-full lg:w-auto">
                {notifications.filter(n => !n.is_read).length > 0 && (
                  <button 
                    onClick={async () => {
                      try {
                        await fetchWithHandling('/api/admin/notifications/mark-read', { method: 'POST', headers: getAuthHeaders() });
                        fetchNotifications();
                        toast.success('All alerts acknowledged');
                      } catch (err) {}
                    }}
                    className="flex items-center justify-center space-x-3 bg-stone-100 text-stone-600 px-8 py-5 rounded-[2rem] text-sm font-black uppercase tracking-widest hover:bg-stone-200 transition-all active:scale-95 border border-stone-200"
                  >
                    <CheckCheck size={20} />
                    <span>Acknowledge All</span>
                  </button>
                )}
                <button 
                  onClick={() => setNotificationModal({ open: true })}
                  className="w-full lg:w-auto flex items-center justify-center space-x-3 bg-stone-900 text-white px-10 py-5 rounded-[2rem] text-sm font-black uppercase tracking-widest hover:bg-stone-800 transition-all shadow-2xl shadow-stone-900/30 hover:scale-105 active:scale-95"
                >
                  <Plus size={20} />
                  <span>New Announcement</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-8">
              {notifications.map((n: any) => (
                <motion.div 
                  layout
                  key={n.id} 
                  className={cn(
                    "bg-white p-8 rounded-[2.5rem] shadow-xl shadow-stone-200/20 border border-stone-100 group hover:border-primary/30 transition-all relative overflow-hidden",
                    n.is_read && "opacity-60 grayscale-[0.5]"
                  )}
                >
                  <div className={cn(
                    "absolute top-0 left-0 w-1.5 h-full transition-colors",
                    n.priority === 'high' ? 'bg-red-500' :
                    n.priority === 'medium' ? 'bg-amber-500' : 'bg-blue-500'
                  )} />
                  
                  <div className="flex flex-col md:flex-row justify-between gap-8">
                    <div className="flex space-x-6">
                      <div className={cn(
                        "w-16 h-16 rounded-[1.5rem] flex items-center justify-center shrink-0 shadow-lg transition-transform group-hover:scale-110",
                        n.type === 'system' ? 'bg-indigo-50 text-indigo-500' :
                        n.priority === 'high' ? 'bg-red-50 text-red-500' :
                        n.priority === 'medium' ? 'bg-amber-50 text-amber-500' : 'bg-blue-50 text-blue-500'
                      )}>
                        {n.type === 'system' ? <AlertCircle size={32} /> : n.type === 'alert' ? <ShieldAlert size={32} /> : <Bell size={32} />}
                      </div>
                      <div className="space-y-3">
                        <div className="flex items-center space-x-4">
                          <h4 className="text-2xl font-black text-stone-900 tracking-tight">{n.title}</h4>
                          <span className={cn(
                            "text-[9px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-full border-2",
                            n.type === 'system' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' :
                            n.priority === 'high' ? 'bg-red-50 text-red-600 border-red-100' :
                            n.priority === 'medium' ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-blue-50 text-blue-600 border-blue-100'
                          )}>
                            {n.type === 'system' ? 'System' : n.priority}
                          </span>
                        </div>
                        <div 
                          className="prose prose-stone prose-sm max-w-2xl text-stone-600 font-medium leading-relaxed"
                          dangerouslySetInnerHTML={{ __html: n.message }}
                        />
                        <div className="flex flex-wrap items-center gap-6 mt-6 pt-6 border-t border-stone-50">
                           <div className="flex items-center space-x-2 text-[10px] font-black uppercase tracking-widest text-stone-400">
                             <Users size={14} className="text-primary" />
                             <span>Audience: <span className="text-stone-600">{n.target_role || 'All'}</span></span>
                           </div>
                           <div className="flex items-center space-x-2 text-[10px] font-black uppercase tracking-widest text-stone-400">
                             <Calendar size={14} className="text-primary" />
                             <span>Dispatched: {new Date(n.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                           </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-row md:flex-col items-center justify-center md:items-end gap-3 shrink-0">
                      {!n.is_read && (
                        <button 
                          onClick={async () => {
                            try {
                              await fetchWithHandling(`/api/admin/notifications/${n.id}/mark-read`, { method: 'POST', headers: getAuthHeaders() });
                              fetchNotifications();
                            } catch (err) {}
                          }}
                          className="w-12 h-12 flex items-center justify-center bg-stone-50 text-stone-400 hover:bg-emerald-50 hover:text-emerald-500 rounded-2xl transition-all shadow-sm border border-stone-100"
                        >
                          <Check size={20} />
                        </button>
                      )}
                      <button 
                        onClick={() => handleDeleteNotification(n.id)}
                        className="w-12 h-12 flex items-center justify-center bg-stone-50 text-stone-400 hover:bg-red-50 hover:text-red-500 rounded-2xl transition-all shadow-sm border border-stone-100"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
        </div>
    );
};

export default AnnouncementsTab;
