import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, X, CheckCircle2 } from 'lucide-react';
import { useStore } from '@/StoreContext';
import { Link } from 'react-router-dom';
import { cn } from '@/types';

export default function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const { user, notificationsList, unreadNotificationsCount, readNotificationIds, fetchNotifications, markNotificationAsRead, startupPhase } = useStore();

  useEffect(() => {
    if (startupPhase >= 2) {
      fetchNotifications();
    }
  }, [user?.id, startupPhase]);

  const notifications = notificationsList || [];
  const unreadCount = unreadNotificationsCount || 0;

  return (
    <div className="relative group/bell" onMouseEnter={() => { setIsOpen(true); fetchNotifications(); }} onMouseLeave={() => setIsOpen(false)}>
      <button className="relative p-2 text-stone-600 hover:text-primary transition-colors block">
        <motion.div
           whileHover={{ rotate: 15 }}
           animate={unreadCount > 0 ? { 
             rotate: [0, -10, 10, -10, 10, 0],
             transition: { repeat: Infinity, duration: 4, repeatDelay: 2 }
           } : {}}
        >
          <Bell size={24} />
        </motion.div>
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 bg-red-500 text-white text-[9px] font-black w-4.5 h-4.5 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
            {unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute top-full right-0 w-80 bg-white rounded-[2.5rem] shadow-2xl shadow-stone-200/50 border border-stone-100 p-6 z-50 mt-4 overflow-hidden"
          >
            <div className="flex justify-between items-center mb-6">
              <div className="flex flex-col">
                <h3 className="font-black text-stone-900 tracking-tight">Notifications</h3>
                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mt-0.5">Stay Updated</span>
              </div>
              {unreadCount > 0 && (
                <button 
                  onClick={() => {
                    notifications.forEach(n => markNotificationAsRead(n.id));
                  }}
                  className="text-[10px] font-black text-primary uppercase tracking-tighter hover:underline"
                >
                  Clear All
                </button>
              )}
            </div>
            
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar no-scrollbar">
              {unreadCount === 0 ? (
                <div className="text-center py-10">
                  <div className="w-16 h-16 bg-stone-50 rounded-[1.5rem] flex items-center justify-center mx-auto mb-4 text-stone-200">
                    <CheckCircle2 size={32} />
                  </div>
                  <p className="text-xs font-black text-stone-900 uppercase tracking-tight">All Caught Up</p>
                  <p className="text-[10px] text-stone-400 font-medium mt-1">No pending updates at this time</p>
                </div>
              ) : (
                notifications.filter(n => !readNotificationIds.includes(n.id)).map(n => {
                    const content = (
                      <div className="bg-stone-50 hover:bg-stone-100/80 rounded-2xl p-4 border border-stone-100/60 transition-all flex items-start space-x-3 relative group/item">
                        <div className={cn(
                          "w-2 h-2 rounded-full mt-1.5 shrink-0 animate-pulse",
                          n.type === 'critical' ? 'bg-red-500' : 
                          n.type === 'alert' ? 'bg-amber-500' : 'bg-primary'
                        )} />
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start">
                            <h4 className="text-xs font-bold text-stone-900 truncate pr-4">{n.title || 'System Update'}</h4>
                          </div>
                          <p className="text-[11px] text-stone-500 mt-1 line-clamp-2 leading-relaxed">{n.message}</p>
                          <span className="text-[9px] font-bold text-stone-300 uppercase tracking-widest mt-2 block">
                            {new Date(n.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <button 
                          onClick={(e) => { e.preventDefault(); markNotificationAsRead(n.id); }}
                          className="absolute top-3 right-3 p-1 text-stone-200 hover:text-red-500 opacity-0 group-hover/item:opacity-100 transition-all"
                          title="Dismiss"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    );
                    return n.link ? <Link key={n.id} to={n.link} onClick={() => markNotificationAsRead(n.id)}>{content}</Link> : <div key={n.id}>{content}</div>;
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
