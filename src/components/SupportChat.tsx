import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, Send, User, ShieldCheck, ChevronLeft, Clock, History } from 'lucide-react';
import { db } from '@/firebase';
import { collection, onSnapshot, query, orderBy, addDoc, serverTimestamp, where } from 'firebase/firestore';
import { cn } from '@/types';
import toast from 'react-hot-toast';

interface Message {
  id: string;
  message: string;
  user_id: string;
  created_at: any;
}

interface SupportChatProps {
  user: any;
}

export default function SupportChat({ user }: SupportChatProps) {
  const [tickets, setTickets] = useState<any[]>([]);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);

  // Fetch user's tickets
  useEffect(() => {
    if (!user?.id) return;

    const ticketsRef = collection(db, 'tickets');
    const q = query(ticketsRef, where('user_id', '==', String(user.id)), orderBy('created_at', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const tks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTickets(tks);
      setLoading(false);
    }, (error) => {
      console.error('[SupportChat] Error fetching tickets:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user?.id]);

  // Fetch messages for selected ticket
  useEffect(() => {
    if (!selectedTicketId) {
      setMessages([]);
      return;
    }

    const messagesRef = collection(db, 'tickets', selectedTicketId, 'messages');
    const q = query(messagesRef, orderBy('created_at', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Message[];
      setMessages(msgs);
    });

    return () => unsubscribe();
  }, [selectedTicketId]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newMessage.trim() || !selectedTicketId) return;

    try {
      await addDoc(collection(db, 'tickets', selectedTicketId, 'messages'), {
        message: newMessage,
        user_id: user.id,
        created_at: serverTimestamp()
      });
      setNewMessage('');
    } catch (error) {
      console.error('[SupportChat] Error sending message:', error);
      toast.error('Failed to send message');
    }
  };

  const selectedTicket = tickets.find(t => t.id === selectedTicketId);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-stone-400">
        <div className="w-8 h-8 border-4 border-stone-200 border-t-primary rounded-full animate-spin mb-4" />
        <p className="text-xs font-black uppercase tracking-widest">Synching Signals...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-[2.5rem] border border-stone-100 shadow-sm overflow-hidden flex flex-col h-[600px]">
      <AnimatePresence mode="wait">
        {!selectedTicketId ? (
          <motion.div
            key="list"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="flex-1 flex flex-col"
          >
            <div className="p-8 border-b border-stone-100 bg-stone-50/50">
              <h3 className="text-xl font-black text-stone-900 flex items-center gap-2">
                <History className="text-primary" size={20} />
                Your Support Tickets
              </h3>
              <p className="text-xs font-bold text-stone-400 mt-1 uppercase tracking-widest">View and manage your active inquiries</p>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {tickets.length > 0 ? (
                tickets.map(ticket => (
                  <button
                    key={ticket.id}
                    onClick={() => setSelectedTicketId(ticket.id)}
                    className="w-full p-6 rounded-3xl border border-stone-100 hover:border-primary/30 hover:bg-primary/5 transition-all group flex items-center justify-between text-left"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black bg-stone-900 text-white px-2 py-0.5 rounded uppercase tracking-tighter shadow-sm">
                          TKT-{ticket.id.slice(-4).toUpperCase()}
                        </span>
                        <span className={cn(
                          "text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full",
                          ticket.status === 'open' ? "bg-amber-100 text-amber-600" : "bg-emerald-100 text-emerald-600"
                        )}>
                          {ticket.status}
                        </span>
                      </div>
                      <h4 className="font-bold text-stone-900 group-hover:text-primary transition-colors">{ticket.subject}</h4>
                      <p className="text-xs text-stone-400 line-clamp-1">{ticket.message}</p>
                    </div>
                    <ChevronLeft className="text-stone-300 rotate-180 group-hover:translate-x-1 group-hover:text-primary transition-all" size={20} />
                  </button>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center p-12 text-center text-stone-400 space-y-4">
                  <div className="w-16 h-16 bg-stone-50 rounded-3xl flex items-center justify-center">
                    <MessageSquare size={32} />
                  </div>
                  <div>
                    <p className="font-bold text-stone-900">No active tickets found</p>
                    <p className="text-xs mt-1">Submit the form above if you need assistance.</p>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="chat"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex-1 flex flex-col h-full"
          >
            <div className="p-6 border-b border-stone-100 bg-white flex items-center gap-4">
              <button 
                onClick={() => setSelectedTicketId(null)}
                className="p-2 hover:bg-stone-100 rounded-xl transition-colors text-stone-400"
              >
                <ChevronLeft size={24} />
              </button>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                   <h3 className="font-bold text-stone-900 truncate max-w-[200px] sm:max-w-xs">{selectedTicket?.subject}</h3>
                   <span className={cn(
                    "text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full",
                    selectedTicket?.status === 'open' ? "bg-amber-100 text-amber-600" : "bg-emerald-100 text-emerald-600"
                  )}>
                    {selectedTicket?.status}
                  </span>
                </div>
                <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Active Resolution Channel</p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-stone-50/50">
              <div className="flex flex-col items-center mb-8">
                <span className="text-[9px] font-black text-stone-300 uppercase tracking-[0.2em] bg-white px-3 py-1 rounded-full shadow-sm border border-stone-100">Portal Initialized</span>
              </div>

              {/* Initial Message */}
              <div className="flex items-start gap-3 max-w-[85%]">
                <div className="w-8 h-8 rounded-xl bg-stone-100 flex items-center justify-center shrink-0 text-stone-400">
                  <User size={16} />
                </div>
                <div className="bg-white p-4 rounded-3xl rounded-tl-none shadow-sm border border-stone-100">
                  <p className="text-sm font-medium text-stone-700">{selectedTicket?.message}</p>
                </div>
              </div>

              {messages.map((msg, i) => (
                <div 
                  key={msg.id} 
                  className={cn(
                    "flex items-start gap-3 max-w-[85%]",
                    msg.user_id === user.id ? "ml-auto flex-row-reverse" : ""
                  )}
                >
                  <div className={cn(
                    "w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-sm",
                    msg.user_id === user.id ? "bg-stone-900 text-white" : "bg-white border border-stone-100 text-primary"
                  )}>
                    {msg.user_id === user.id ? <User size={16} /> : <ShieldCheck size={16} />}
                  </div>
                  <div className={cn(
                    "p-4 rounded-3xl shadow-sm border transition-all",
                    msg.user_id === user.id 
                      ? "bg-stone-900 text-white border-stone-900 rounded-tr-none" 
                      : "bg-primary text-white border-primary rounded-tl-none"
                  )}>
                    <p className="text-xs font-semibold leading-relaxed">{msg.message}</p>
                    <div className={cn(
                      "flex items-center gap-1 mt-2 text-[8px] font-black uppercase tracking-tighter opacity-40",
                      msg.user_id === user.id ? "justify-end" : "justify-start"
                    )}>
                      <Clock size={8} />
                      {msg.created_at?.toDate ? msg.created_at.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Sending...'}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <form onSubmit={handleSendMessage} className="p-4 border-t border-stone-100 bg-white">
              <div className="flex gap-2 p-1 bg-stone-100 rounded-2xl border border-stone-200/50 focus-within:bg-white focus-within:border-primary/20 transition-all">
                <input
                  type="text"
                  placeholder="Link into frequency..."
                  className="flex-1 bg-transparent border-none px-4 py-3 text-sm font-bold text-stone-700 outline-none"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim()}
                  className="bg-stone-900 text-white p-3 rounded-xl hover:bg-primary transition-all disabled:opacity-50 active:scale-95"
                >
                  <Send size={18} />
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
