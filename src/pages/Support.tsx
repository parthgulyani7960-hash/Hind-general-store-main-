import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  MessageCircle, Mail, Phone, MapPin, Send, HelpCircle, 
  Shield, FileText, Wallet, ShoppingBag, LogOut, Plus, ChevronRight,
  CheckCircle, Package, Truck, Home as HomeIcon, Clock, XCircle, Search, LifeBuoy, AlertTriangle,Camera
} from 'lucide-react';
import { useStore } from '@/StoreContext';
import { Link } from 'react-router-dom';
import { cn } from '@/types';
import toast from 'react-hot-toast';
import UserAvatar from '@/components/UserAvatar';
import { getAuthHeaders } from '@/lib/utils';
import { fetchWithHandling } from '@/lib/api';
import SupportChat from '@/components/SupportChat';
import { db } from '@/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export default function Support() {
  const { user, logout, refreshUser, config = [], fetchConfig, simulatedRole } = useStore();
  const isUserAdmin = user && (user.role === 'admin' || (user.email ? user.email.toLowerCase().includes('parthgulyani7960@gmail.com') : false) || simulatedRole === 'admin');
  const [orders, setOrders] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [form, setForm] = useState({ name: '', email: '', phone: '', subject: '', message: '', image: null as File | null });
  const [loading, setLoading] = useState(false);
  const [showTC, setShowTC] = useState(false);
  const [faqHtml, setFaqHtml] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFaqCategory, setActiveFaqCategory] = useState<string>('all');
  const [openFaqIndex, setOpenFaqIndex] = useState<string | null>(null);

  const supportSubjects = [
    "Payment / Transaction Issue",
    "Order Delay or Tracking",
    "Damaged or Missing Items",
    "Wallet & Khata Assistance",
    "App Technical Glitch",
    "Wholesale Inquiry",
    "General Feedback / Suggestion",
    "Other"
  ];

  useEffect(() => {
    if (user) {
      setForm(prev => ({ 
        ...prev, 
        name: user.name || prev.name || '', 
        email: user.email || prev.email || '',
        phone: user.phone || prev.phone || ''
      }));
    }
  }, [user]);

  useEffect(() => {
    fetchConfig();
    fetchWithHandling<any>('/api/settings').then(data => {
      if (data) {
        const faq = data.config?.find((s: any) => s.key === 'faq_content');
        if (faq) setFaqHtml(faq.value);
      }
    });

    const params = new URLSearchParams(window.location.search);
    const subjectParam = params.get('subject');
    const messageParam = params.get('message');

    if (user) {
      refreshUser();
      fetchWithHandling<any[]>('/api/admin/orders', { headers: getAuthHeaders() })
        .then(data => {
          if (data) setOrders(data.filter((o: any) => o.user_id === user.id));
        });
      
      fetchWithHandling<any[]>('/api/admin/support/tickets', { headers: getAuthHeaders() })
        .then(data => {
          if (data) setTickets(data.filter((t: any) => t.user_id === user.id));
        });
    } else if (subjectParam || messageParam) {
      setForm(prev => ({
        ...prev,
        subject: subjectParam || prev.subject,
        message: messageParam || prev.message
      }));
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Enforce 500 word limit
    const wordCount = form.message.trim().split(/\s+/).filter(Boolean).length;
    if (wordCount > 500) {
      toast.error('Message details are limited to 500 words. Please shorten your request.');
      return;
    }

    setLoading(true);
    try {
      let imageUrl = null;
      if (form.image) {
        // Convert image to base64 for submission (simple implementation for preview/local scale)
        imageUrl = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.readAsDataURL(form.image!);
        });
      }

      const data = await fetchWithHandling<any>('/api/support/tickets', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ 
          user_id: user?.id || null, 
          name: form.name,
          email: form.email,
          subject: form.subject, 
          message: form.message,
          image_url: imageUrl
        })
      });

      // Also save to Firestore for real-time chat
      if (data && data.ticket_id || data?.id) {
        const ticketId = String(data.ticket_id || data.id || Date.now());
        await addDoc(collection(db, 'tickets'), {
          id: ticketId,
          user_id: user?.id || null,
          user_name: form.name,
          subject: form.subject,
          message: form.message,
          status: 'open',
          created_at: serverTimestamp(),
          image_url: imageUrl
        });
      }

      if (data) {
        toast.success('Support ticket created! We will contact you soon.');
        setForm(prev => ({ ...prev, subject: '', message: '', image: null }));
        if (user) {
          const tData = await fetchWithHandling<any[]>('/api/admin/support/tickets', {
            headers: getAuthHeaders()
          });
          if (tData) setTickets(tData.filter((t: any) => t.user_id === user.id));
        }
      }
    } catch (err) {
      console.error('Submit ticket error:', err);
      toast.error('Failed to submit ticket. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const defaultFaqs = [
    {
      cat: "Order Management & Tracking",
      q: [
        { q: "How can I track my live order status?", a: "Go to your Profile or Support page above. You'll see a real-time progress bar for your most recent orders. Once an order is 'Shipped', you can see the assigned delivery runner's status by clicking 'Track Status'." },
        { q: "What should I do if my items are missing or damaged?", a: "Take a photo/video and create a support ticket below or message us on WhatsApp with your Order ID (#ORD-XXX) within 24 hours. We provide instant wallet refunds or replacements for verified damages." },
        { q: "Can I cancel an order after placing it?", a: "You can only cancel an order while it is in the 'Pending' status. Once the store starts 'Processing' (packing) your items, cancellations are no longer possible as the items are already being prepared." },
        { q: "Where can I find my previous order invoices?", a: "All your invoices are stored in the 'Order History' section of your profile. Click on any past order to download the official PDF invoice for your records." }
      ]
    },
    {
      cat: "Wallet, Payments & Khata",
      q: [
        { q: "What is the Store Wallet and how does it work?", a: "The Wallet is our integrated digital payment system. You can pre-load balance for faster checkouts. All refunds are instantly credited to this wallet and can be used for your next purchase." },
        { q: "Who is eligible for the 'Khata' credit system?", a: "Khata (Credit) is exclusively for our regular verified customers. After 10 successful delivered orders, you can apply for a Khata limit. This allows you to order now and pay later at the end of the month." },
        { q: "Why did my payment fail but money was deducted?", a: "If your order status is 'Failed', the amount will be automatically refunded to your source account by your bank within 1-2 business days. For UPI, modern apps usually refund within 24 hours." },
        { q: "Can I withdraw my wallet balance back to my bank?", a: "Currently, wallet balance is restricted for store purchases only. However, if you are closing your account, you can contact support for a manual refund processing." }
      ]
    },
    {
      cat: "Logistics & Delivery",
      q: [
        { q: "Do you offer contactless delivery?", a: "Yes. You can mention 'Contactless Delivery' in the order notes at checkout. Our runner will leave the package at your doorstep and take a photo for confirmation." },
        { q: "What are your delivery hours?", a: "We deliver from 9:00 AM to 9:30 PM, seven days a week. Orders placed after 9:00 PM are automatically scheduled for the next morning or processed on high priority if 'Rapid Delivery' was chosen." },
        { q: "How do I change my delivery address after ordering?", a: "Once an order is placed, the address cannot be changed in-app. Please call us immediately or WhatsApp your new location pin so we can update the runner's route." }
      ]
    }
  ];

  const filteredFaqs = defaultFaqs.map(category => ({
    ...category,
    q: category.q.filter(faq => 
      faq.q.toLowerCase().includes(searchQuery.toLowerCase()) || 
      faq.a.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (searchQuery.toLowerCase() === 'money' && (faq.q.toLowerCase().includes('wallet') || faq.q.toLowerCase().includes('payment'))) ||
      (searchQuery.toLowerCase() === 'return' && faq.q.toLowerCase().includes('damaged'))
    )
  })).filter(category => category.q.length > 0 && (activeFaqCategory === 'all' || category.cat === activeFaqCategory));

  return (
    <div className="min-h-screen bg-stone-50 pb-32 md:pb-12 text-left">
      {/* Hero Section */}
      <div className="bg-stone-900 pt-16 pb-28 px-4 sm:px-6 lg:px-8 shadow-inner">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div className="space-y-6 max-w-2xl">
            <div className="inline-flex items-center space-x-2 bg-white/10 text-stone-200 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest backdrop-blur-md border border-white/5">
              <LifeBuoy size={16} />
              <span>Help Center</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white leading-tight">
              How can we <br className="hidden md:block" /> help you today?
            </h1>
            <p className="text-stone-400 text-lg leading-relaxed">
              Find answers, track your orders, or reach out to our team directly. We are always here to assist you.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 -mt-12 relative z-10 space-y-12">
        
        {/* Contact Methods Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { 
              title: 'WhatsApp Chat', 
              desc: 'Instant replies',
              icon: MessageCircle, 
              color: 'text-emerald-600', 
              bg: 'bg-emerald-500/10 border-emerald-500/20 hover:border-emerald-500/40',
              text: 'Message Us', 
              action: `https://wa.me/${((config || []).find(c => c.key === 'whatsapp_number')?.value || '919876543210').replace(/\D/g, '')}?text=${encodeURIComponent(user ? `Hello Hind Store Support, I need assistance with my account.\n\n👤 Name: ${user.name || 'N/A'}\n📱 Phone: ${user.phone || 'N/A'}\n📧 Email: ${user.email || 'N/A'}\n🆔 User ID: ${user.id}\n\nI have a question regarding:` : "Hello Hind Store Support, I need assistance with a query. Please help.")}` 
            },
            { 
              title: 'Call Support', 
              desc: 'Speak directly to us',
              icon: Phone, 
              color: 'text-blue-600', 
              bg: 'bg-blue-500/10 border-blue-500/20 hover:border-blue-500/40',
              text: (config || []).find(c => c.key === 'store_phone')?.value || '+91 98765 43210', 
              action: `tel:${(config || []).find(c => c.key === 'store_phone')?.value || '+919876543210'}` 
            },
            { 
              title: 'Email Us', 
              desc: 'For detailed queries',
              icon: Mail, 
              color: 'text-amber-600', 
              bg: 'bg-amber-500/10 border-amber-500/20 hover:border-amber-500/40',
              text: 'support@hindstore.com', 
              action: `mailto:support@hindstore.com?subject=${encodeURIComponent("Support Request")}&body=${encodeURIComponent(user ? `I need help for my account.\n\nUser ID: ${user.id}\nName: ${user.name}\nPhone: ${user.phone}\n\nDetails:` : "I need help.")}` 
            },
          ].map((item, i) => (
            <a 
              key={i} 
              href={item.action} 
              target={item.title === 'WhatsApp Chat' ? "_blank" : undefined} 
              className={cn("group bg-white p-6 md:p-8 rounded-[2rem] border shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all flex items-start gap-5", item.bg.replace('bg-', 'hover:bg-').split(' ')[1])}
            >
              <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110", item.bg.split(' ')[0], item.color)}>
                <item.icon size={26} strokeWidth={2.5} />
              </div>
              <div className="flex justify-center flex-col h-14 w-full overflow-hidden">
                <h3 className="font-bold text-stone-900 leading-tight truncate">{item.title}</h3>
                <p className="text-sm font-medium text-stone-500 mt-0.5 group-hover:hidden truncate">{item.desc}</p>
                <p className="text-sm font-bold text-primary mt-0.5 hidden group-hover:block transition-all truncate">{item.text}</p>
              </div>
            </a>
          ))}
        </div>

        {user && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-black text-stone-900">Active Support Corridors</h2>
              <div className="px-4 py-1 bg-primary/10 text-primary rounded-full text-[10px] font-black uppercase tracking-widest animate-pulse">Live Link Active</div>
            </div>
            <SupportChat user={user} />
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
            {/* Direct Message Form */}
            <div id="ticket-form" className="bg-white rounded-[2.5rem] p-6 sm:p-10 border border-stone-100 shadow-sm relative overflow-hidden h-fit">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-full -z-0" />
              <div className="relative z-10">
                <h2 className="text-2xl font-black text-stone-900 mb-2">Submit a Ticket</h2>
                <p className="text-stone-500 text-sm mb-8">Report an error, issue, or request assistance directly to our support team.</p>
                
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="space-y-1.5 flex flex-col">
                      <label className="text-[11px] font-bold text-stone-700 uppercase tracking-widest px-1">Name</label>
                      <input 
                        type="text" required 
                        className="w-full bg-stone-50 border border-stone-200 rounded-2xl px-4 py-3 focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm outline-none font-bold" 
                        placeholder="Your Name"
                        value={form.name} onChange={e => setForm({...form, name: e.target.value})}
                      />
                    </div>
                    <div className="space-y-1.5 flex flex-col">
                      <label className="text-[11px] font-bold text-stone-700 uppercase tracking-widest px-1">Email</label>
                      <input 
                        type="email" required 
                        className="w-full bg-stone-50 border border-stone-200 rounded-2xl px-4 py-3 focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm outline-none font-bold" 
                        placeholder="Email Address"
                        value={form.email} onChange={e => setForm({...form, email: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="space-y-1.5 flex flex-col">
                      <label className="text-[11px] font-bold text-stone-700 uppercase tracking-widest px-1">Mobile Number</label>
                      <input 
                        type="tel" required 
                        className="w-full bg-stone-50 border border-stone-200 rounded-2xl px-4 py-3 focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm outline-none font-bold" 
                        placeholder="Mobile for contact"
                        value={form.phone} onChange={e => setForm({...form, phone: e.target.value})}
                      />
                    </div>
                    <div className="space-y-1.5 flex flex-col">
                      <label className="text-[11px] font-bold text-stone-700 uppercase tracking-widest px-1">Subject</label>
                      <select 
                        required 
                        className="w-full bg-stone-50 border border-stone-200 rounded-2xl px-4 py-3 focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm outline-none font-bold"
                        value={form.subject} onChange={e => setForm({...form, subject: e.target.value})}
                      >
                         <option value="" disabled>Choose a Category</option>
                         {supportSubjects.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="space-y-1.5 flex flex-col">
                    <div className="flex items-center justify-between px-1">
                      <label className="text-[11px] font-bold text-stone-700 uppercase tracking-widest">Message Details</label>
                      <span className={cn("text-[9px] font-black uppercase", form.message.split(/\s+/).filter(Boolean).length > 500 ? "text-red-500" : "text-stone-400")}>
                        {form.message.split(/\s+/).filter(Boolean).length} / 500 words
                      </span>
                    </div>
                    <textarea 
                      required rows={4}
                      className="w-full bg-stone-50 border border-stone-200 rounded-2xl px-4 py-3 focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm outline-none resize-none font-medium" 
                      placeholder="Please describe what went wrong or how we can help..."
                      value={form.message} onChange={e => setForm({...form, message: e.target.value})}
                    />
                  </div>

                  <div className="space-y-1.5 flex flex-col">
                    <label className="text-[11px] font-bold text-stone-700 uppercase tracking-widest px-1">Attach Evidence (Optional)</label>
                    <div className="relative group/upload">
                       <input 
                         type="file" 
                         accept="image/*"
                         capture="environment"
                         className="absolute inset-0 opacity-0 cursor-pointer z-10"
                         onChange={(e) => {
                           const file = e.target.files?.[0];
                           if (file) setForm({...form, image: file});
                         }}
                       />
                       <div className="w-full py-6 border-2 border-dashed border-stone-200 rounded-2xl bg-stone-50/50 flex flex-col items-center justify-center gap-2 group-hover/upload:border-primary/40 group-hover/upload:bg-primary/5 transition-all">
                          {form.image ? (
                             <div className="flex items-center gap-2 text-emerald-600 font-bold text-xs">
                               <CheckCircle size={14} />
                               <span>{form.image.name}</span>
                             </div>
                          ) : (
                             <>
                               <Camera size={20} className="text-stone-400 group-hover/upload:text-primary transition-colors" />
                               <span className="text-[10px] font-black uppercase tracking-widest text-stone-400 group-hover/upload:text-primary">Click to Take Photo or Upload</span>
                             </>
                          )}
                       </div>
                    </div>
                  </div>

                  <button 
                    type="submit" disabled={loading || (form.message.split(/\s+/).filter(Boolean).length > 500)}
                   className="w-full bg-stone-900 text-white rounded-2xl py-4 font-bold tracking-wide flex items-center justify-center gap-2 hover:bg-stone-800 focus:scale-[0.98] transition-all disabled:opacity-70 mt-4 shadow-md"
                 >
                   {loading ? (
                     <div className="w-5 h-5 border-2 border-stone-500 border-t-white rounded-full animate-spin" />
                   ) : (
                     <><span>Submit Ticket</span><Send size={16} /></>
                   )}
                 </button>
               </form>
              </div>
            </div>

            {/* Knowledge Base / FAQ */}
            <div className="flex flex-col">
              <div className="bg-white rounded-[2.5rem] p-6 sm:p-10 border border-stone-100 shadow-sm flex-1">
                <h2 className="text-2xl font-black text-stone-900 mb-2">Frequently Asked Questions</h2>
                <p className="text-stone-500 text-sm mb-6">Find quick answers to common questions. If you can't find what you're looking for here, please submit a ticket using the form.</p>
                
                {/* Search Box */}
                <div className="relative mb-6">
                  <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" />
                  <input 
                    type="text" 
                    placeholder="Search questions..." 
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-2xl py-3.5 pl-12 pr-4 text-sm focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                  />
                </div>

                {/* Category Filter Pills */}
                {!faqHtml && (
                  <div className="flex gap-2 overflow-x-auto pb-2 mb-4 hide-scrollbar snap-x">
                     <button 
                       onClick={() => setActiveFaqCategory('all')}
                       className={cn("px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap snap-center transition-all", activeFaqCategory === 'all' ? 'bg-stone-900 text-white shadow-md' : 'bg-stone-100 text-stone-600 hover:bg-stone-200')}
                     >All Topics</button>
                     {defaultFaqs.map(cat => (
                        <button 
                           key={cat.cat}
                           onClick={() => setActiveFaqCategory(cat.cat)}
                          className={cn("px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap snap-center transition-all", activeFaqCategory === cat.cat ? 'bg-stone-900 text-white shadow-md' : 'bg-stone-100 text-stone-600 hover:bg-stone-200')}
                        >{cat.cat}</button>
                     ))}
                  </div>
                )}

                <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                  {faqHtml ? (
                    <div 
                      className="prose prose-sm max-w-none prose-stone prose-headings:font-bold prose-p:text-stone-600"
                      dangerouslySetInnerHTML={{ __html: faqHtml }}
                    />
                  ) : (
                    filteredFaqs.length > 0 ? filteredFaqs.map((category, idx) => (
                      <div key={idx} className="space-y-3 pt-2">
                        <h3 className="text-[10px] font-black text-stone-400 uppercase tracking-[0.2em] pl-1 mb-2 border-b border-stone-100 pb-1">{category.cat}</h3>
                        <div className="space-y-2">
                          {category.q.map((faq, fidx) => {
                            const isId = `${idx}-${fidx}`;
                            const isOpen = openFaqIndex === isId;
                            return (
                              <div 
                                key={fidx} 
                                className={cn(
                                  "bg-stone-50 rounded-2xl border transition-all duration-300 group cursor-pointer shadow-sm overflow-hidden",
                                  isOpen ? "border-primary bg-white ring-4 ring-primary/5" : "border-stone-100/80 hover:bg-white hover:border-stone-200"
                                )}
                                onClick={() => setOpenFaqIndex(isOpen ? null : isId)}
                              >
                                <div className="p-4 flex items-center justify-between gap-4">
                                  <p className={cn("font-bold text-sm transition-colors pr-2", isOpen ? "text-primary" : "text-stone-900 group-hover:text-primary")}>{faq.q}</p>
                                  <ChevronRight size={16} className={cn("text-stone-300 transition-transform duration-300", isOpen ? "rotate-90 text-primary" : "")} />
                                </div>
                                <AnimatePresence>
                                  {isOpen && (
                                    <motion.div 
                                      initial={{ height: 0, opacity: 0 }}
                                      animate={{ height: "auto", opacity: 1 }}
                                      exit={{ height: 0, opacity: 0 }}
                                      className="overflow-hidden"
                                    >
                                      <div className="px-4 pb-4 pt-0">
                                        <div className="h-px bg-stone-100 w-full mb-3" />
                                        <p className="text-xs text-stone-600 leading-relaxed font-medium">{faq.a}</p>
                                      </div>
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )) : (
                      <div className="text-center py-12 text-stone-500">
                        <HelpCircle size={32} className="mx-auto text-stone-300 mb-3" />
                        <p>No answers found for "{searchQuery}"</p>
                        <p className="text-[10px] font-bold uppercase tracking-widest mt-2">Try searching keywords like 'wallet', 'return' or 'money'</p>
                      </div>
                    )
                  )}
                </div>
              </div>
            </div>
        </div>

      </div>

      {/* T&C Modal */}
      {showTC && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-stone-900/60 backdrop-blur-sm p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-white rounded-[2.5rem] shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden relative"
          >
            <div className="p-6 sm:p-8 flex justify-between items-center bg-stone-50 border-b border-stone-100 shrink-0">
              <h2 className="text-xl font-black text-stone-900">Terms & Conditions</h2>
              <button onClick={() => setShowTC(false)} className="p-2 hover:bg-stone-200 text-stone-500 rounded-xl transition-colors bg-white shadow-sm border border-stone-100">
                <Plus size={20} className="rotate-45" />
              </button>
            </div>
            <div className="p-6 sm:p-8 overflow-y-auto flex-1 custom-scrollbar">
              <div className="whitespace-pre-wrap text-stone-600 text-sm leading-relaxed">
                {(config || []).find(c => c.key === 'store_tc')?.value || "Default Terms & Conditions..."}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
