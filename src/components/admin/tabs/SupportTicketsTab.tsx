import React, { useEffect } from 'react';
import { motion } from 'motion/react';
import { MessageSquare, Users, ShieldCheck, Send } from 'lucide-react';
import { cn } from '@/types';
import { db } from '@/firebase';
import { collection, onSnapshot, query, orderBy, addDoc, serverTimestamp } from 'firebase/firestore';

interface SupportTicketsTabProps {
  tickets: any[];
  selectedTicket: any;
  setSelectedTicket: (ticket: any) => void;
  fetchTickets: () => void;
  ticketMessages: any[];
  setTicketMessages: (messages: any[]) => void;
  replyMessage: string;
  setReplyMessage: (msg: string) => void;
  fetchWithHandling: <T>(url: string, options?: any) => Promise<T>;
  getAuthHeaders: () => any;
  toast: any;
  user: any;
}

export default function SupportTicketsTab({
  tickets,
  selectedTicket,
  setSelectedTicket,
  fetchTickets,
  ticketMessages,
  setTicketMessages,
  replyMessage,
  setReplyMessage,
  fetchWithHandling,
  getAuthHeaders,
  toast,
  user,
}: SupportTicketsTabProps) {
  useEffect(() => {
    if (!selectedTicket) return;
    
    const messagesRef = collection(db, 'tickets', String(selectedTicket.id), 'messages');
    const q = query(messagesRef, orderBy('created_at', 'asc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTicketMessages(msgs);
    });
    
    return () => unsubscribe();
  }, [selectedTicket, setTicketMessages]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-10 animate-in fade-in slide-in-from-bottom-4 duration-500 font-sans h-full overflow-hidden">
      <aside className="lg:col-span-1 bg-white rounded-[3rem] shadow-sm border border-stone-100 overflow-hidden flex flex-col h-full">
        <div className="p-8 border-b border-stone-100 flex items-center justify-between">
          <div>
            <h3 className="font-black text-2xl tracking-tight text-stone-900 text-left">Comms Log</h3>
            <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mt-1 text-left">Inbound Ticket Pool</p>
          </div>
          <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center font-black text-xs">
            {tickets.length}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto no-scrollbar divide-y divide-stone-50">
          {tickets.map((ticket) => (
            <button 
              key={ticket.id}
              onClick={() => {
                setSelectedTicket(ticket);
              }}
              className={cn(
                "w-full p-8 text-left hover:bg-stone-50/80 transition-all duration-300 group relative",
                selectedTicket?.id === ticket.id && "bg-stone-50"
              )}
            >
              {selectedTicket?.id === ticket.id && (
                <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-primary animate-in slide-in-from-left duration-300" />
              )}
              <div className="flex justify-between items-start mb-4">
                <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest bg-stone-100 px-2 py-0.5 rounded">#TKT-{ticket.id}</span>
                <span className={cn(
                  "text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-wider",
                  ticket.status === 'open' ? "bg-amber-50 text-amber-600 border border-amber-100" : "bg-emerald-50 text-emerald-600 border border-emerald-100"
                )}>
                  {ticket.status}
                </span>
              </div>
              <p className="font-black text-stone-900 text-base mb-1 tracking-tight group-hover:text-primary transition-colors text-left">{ticket.subject}</p>
              <p className="text-xs text-stone-400 font-medium line-clamp-1 text-left">{ticket.user_name} • {ticket.user_phone}</p>
            </button>
          ))}
          {tickets.length === 0 && (
            <div className="p-12 text-center text-stone-400 font-bold italic">No active frequency detected.</div>
          )}
        </div>
      </aside>

      <main className="lg:col-span-3 bg-white rounded-[3rem] shadow-sm border border-stone-100 flex flex-col h-full overflow-hidden relative">
        {selectedTicket ? (
          <>
            <header className="p-8 border-b border-stone-100 flex justify-between items-center bg-white z-10">
              <div className="flex items-center space-x-5">
                <div className="w-14 h-14 bg-stone-900 text-white rounded-2xl flex items-center justify-center rotate-3">
                  <MessageSquare size={28} />
                </div>
                <div>
                  <h3 className="font-black text-2xl tracking-tight text-stone-900 text-left">{selectedTicket.subject}</h3>
                  <p className="text-xs font-bold text-stone-400 mt-1 uppercase tracking-widest text-left">Linked To: <span className="text-stone-900">{selectedTicket.user_name}</span></p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                 <select 
                  className="bg-stone-55 border-stone-100 border-2 rounded-2xl px-6 py-3 text-xs font-black uppercase tracking-widest text-stone-600 focus:border-primary focus:bg-white outline-none transition-all cursor-pointer shadow-sm"
                  value={selectedTicket.status}
                  onChange={async (e) => {
                    const newStatus = e.target.value;
                    try {
                      const data = await fetchWithHandling<any>(`/api/admin/support/tickets/${selectedTicket.id}/status`, {
                        method: 'POST',
                        headers: getAuthHeaders(),
                        body: JSON.stringify({ status: newStatus })
                      });
                      if (data) {
                        toast.success('Protocol state updated');
                        fetchTickets();
                        setSelectedTicket({...selectedTicket, status: newStatus});
                      }
                    } catch (err) {
                      console.error('Update ticket status error:', err);
                    }
                  }}
                >
                  <option value="open">Open Portal</option>
                  <option value="in-progress">Executing</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Decommissioned</option>
                </select>
              </div>
            </header>
            
            <div className="flex-1 p-10 overflow-y-auto no-scrollbar space-y-8 bg-stone-50/30">
              <div className="flex items-start space-x-4 max-w-[85%] group">
                <div className="w-10 h-10 rounded-xl bg-stone-100 flex items-center justify-center shrink-0 text-stone-400 mt-1 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                  <Users size={18} />
                </div>
                <div className="bg-white p-6 rounded-[2rem] rounded-tl-none shadow-sm border border-stone-100">
                  <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-3 border-b border-stone-50 pb-2 text-left">{selectedTicket.user_name} • {new Date(selectedTicket.created_at).toLocaleString()}</p>
                  <p className="text-sm font-medium text-stone-700 leading-relaxed mb-4 text-left">{selectedTicket.message}</p>
                  
                  {selectedTicket.image_url && (
                    <div className="mt-4 pt-4 border-t border-stone-50">
                      <p className="text-[9px] font-black text-stone-400 uppercase tracking-widest mb-3 text-left">Attached Evidence Artifact</p>
                      <div className="relative group/img overflow-hidden rounded-2xl border border-stone-100 aspect-video max-w-sm">
                        <img 
                          referrerPolicy="no-referrer"
                          src={selectedTicket.image_url} 
                          alt="Support Evidence" 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 cursor-zoom-in"
                          onClick={() => {
                            try {
                              window.open(selectedTicket.image_url, '_blank');
                            } catch (e) {
                              toast.error('Unable to open image in new tab');
                            }
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {ticketMessages.map((msg, i) => (
                <motion.div 
                  key={i} 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    "flex items-start space-x-4 max-w-[85%]",
                    msg.user_id === user?.id ? "ml-auto flex-row-reverse space-x-reverse" : ""
                  )}
                >
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-1 shadow-sm",
                    msg.user_id === user?.id ? "bg-stone-900 text-white" : "bg-white border border-stone-100 text-stone-400"
                  )}>
                    {msg.user_id === user?.id ? <ShieldCheck size={18} /> : <Users size={18} />}
                  </div>
                  <div className={cn(
                    "p-6 rounded-[2rem] shadow-sm border transition-all",
                    msg.user_id === user?.id 
                      ? "bg-primary text-white border-primary rounded-tr-none shadow-xl shadow-primary/10 text-left" 
                      : "bg-white text-stone-700 border-stone-100 rounded-tl-none text-left"
                  )}>
                    <p className={cn("text-[10px] font-black mb-3 uppercase tracking-widest border-b pb-2", msg.user_id === user?.id ? "text-white/40 border-white/10" : "text-stone-300 border-stone-50")}>
                      {msg.user_id === user?.id ? 'System Administrator' : selectedTicket.user_name} • {new Date(msg.created_at).toLocaleString()}
                    </p>
                    <p className="text-sm font-medium leading-relaxed">{msg.message}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="p-10 border-t border-stone-100 bg-white">
              <div className="flex flex-col mb-4">
                <div className="flex flex-wrap gap-2 mb-4">
                  {[
                    "Confirmed, processing your order.",
                    "Order is ready for dispatch.",
                    "Delivered successfully. Thank you!",
                    "Please share coordinates/photo.",
                    "Out of stock. Wallet refund issued.",
                    "Support team is investigating.",
                  ].map((quick) => (
                    <button
                      key={quick}
                      onClick={() => setReplyMessage(quick)}
                      className="px-4 py-2 bg-stone-100 hover:bg-stone-900 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                    >
                      {quick}
                    </button>
                  ))}
                </div>
                <div className="flex space-x-4 bg-stone-50 p-2 rounded-[2.5rem] border border-stone-100 focus-within:bg-white focus-within:border-primary/30 focus-within:shadow-2xl focus-within:shadow-primary/5 transition-all duration-500">
                  <input 
                    type="text" 
                    placeholder="Inscribe dispatch response..."
                    className="flex-1 bg-transparent border-none rounded-3xl px-8 py-5 text-sm font-black uppercase tracking-wider placeholder:text-stone-300 outline-none"
                    value={replyMessage}
                    onChange={(e) => setReplyMessage(e.target.value)}
                    onKeyDown={async (e) => {
                      if (e.key === 'Enter' && replyMessage) {
                        try {
                          await addDoc(collection(db, 'tickets', String(selectedTicket.id), 'messages'), {
                            message: replyMessage,
                            user_id: user.id,
                            created_at: serverTimestamp()
                          });
                          setReplyMessage('');
                        } catch (err) {
                          console.error('Auto-dispatch error:', err);
                          toast.error('Failed to send message');
                        }
                      }
                    }}
                  />
                  <button 
                    onClick={async () => {
                      if (!replyMessage) return;
                      try {
                        await addDoc(collection(db, 'tickets', String(selectedTicket.id), 'messages'), {
                          message: replyMessage,
                          user_id: user.id,
                          created_at: serverTimestamp()
                        });
                        setReplyMessage('');
                      } catch (err) {
                        console.error('Send ticket message error:', err);
                        toast.error('Failed to send message');
                      }
                    }}
                    className="bg-stone-900 hover:bg-primary text-white px-12 py-5 rounded-[2rem] font-black uppercase tracking-widest transition-all shadow-xl shadow-stone-900/20 active:scale-95 group flex items-center space-x-3"
                  >
                    <span>Dispatch</span>
                    <Send size={18} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                  </button>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-stone-400 space-y-8 bg-stone-50/20 pointer-events-none">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/10 blur-3xl rounded-full animate-pulse" />
              <div className="relative p-12 bg-white rounded-[3rem] shadow-xl border border-stone-100 animate-bounce duration-[3000ms]">
                <MessageSquare size={64} className="text-stone-200" />
              </div>
            </div>
            <div className="text-center space-y-2">
              <h4 className="text-2xl font-black text-stone-900 tracking-tight">Select a Ticket</h4>
              <p className="font-bold text-stone-400 uppercase tracking-widest text-[10px]">Select a communication channel on the left to begin messaging.</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
