import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, X } from 'lucide-react';
import { useStore } from '../StoreContext';
import { Link } from 'react-router-dom';

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [readIds, setReadIds] = useState<number[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const { user, simulatedRole } = useStore();
  const activeRole = simulatedRole || user?.role || 'user';

  useEffect(() => {
    const saved = localStorage.getItem('read_notifications');
    if (saved) setReadIds(JSON.parse(saved));

    const fetchNotifs = () => {
      fetch('/api/notifications')
        .then(res => res.json())
        .then(data => {
            // Filter by user_id and activeRole
            const visible = data.filter((n: any) => 
                (n.user_id === user?.id || !n.user_id) && 
                (!n.target_role || n.target_role === 'all' || n.target_role === activeRole)
            );
          setNotifications(visible);
        })
        .catch(() => {});
    };
    
    fetchNotifs();
    const interval = setInterval(fetchNotifs, 45000);
    return () => clearInterval(interval);
  }, [activeRole, user?.id]);

  const unreadCount = notifications.filter(n => !readIds.includes(n.id)).length;

  const markAsRead = (id: number, createdAt: string) => {
    const now = new Date().getTime();
    const created = new Date(createdAt).getTime();
    if (now - created < 5000) {
        return; // Don't allow dismissal for 5 seconds
    }
    const next = [...readIds, id];
    setReadIds(next);
    localStorage.setItem('read_notifications', JSON.stringify(next));
  };

  return (
    <div className="relative" onMouseEnter={() => setIsOpen(true)} onMouseLeave={() => setIsOpen(false)}>
      <button className="relative p-2 text-stone-600 hover:text-primary transition-colors block">
        <motion.div
          animate={unreadCount > 0 ? { scale: [1, 1.1, 1] } : {}}
          transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
        >
          <Bell size={24} />
        </motion.div>
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 bg-red-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
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
            className="absolute top-full right-0 w-80 bg-white rounded-[2rem] shadow-2xl shadow-stone-200/50 border border-stone-100 p-6 z-50 mt-4 overflow-hidden"
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-black text-stone-900">Notifications</h3>
            </div>
            
            <div className="space-y-4 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar hide-scrollbar">
              {notifications.filter(n => !readIds.includes(n.id)).length === 0 ? (
                <div className="text-center py-6">
                  <Bell size={32} className="mx-auto text-stone-200 mb-2" />
                  <p className="text-sm font-bold text-stone-400">All caught up!</p>
                </div>
              ) : (
                notifications.filter(n => !readIds.includes(n.id)).map(n => {
                    const content = (
                      <div className="bg-stone-50 rounded-2xl p-4 border border-stone-100 flex items-start space-x-3 relative group">
                        <div className="flex-1">
                          <h4 className="text-sm font-bold text-stone-900">{n.title || 'Notification'}</h4>
                          <p className="text-xs text-stone-500 mt-1 line-clamp-2">{n.message}</p>
                        </div>
                        <button 
                          onClick={(e) => { e.preventDefault(); markAsRead(n.id, n.created_at); }}
                          className="text-stone-300 hover:text-red-500 transition-colors"
                          title="Dismiss"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    );
                    return n.link ? <Link key={n.id} to={n.link} onClick={() => markAsRead(n.id, n.created_at)}>{content}</Link> : <div key={n.id}>{content}</div>;
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
