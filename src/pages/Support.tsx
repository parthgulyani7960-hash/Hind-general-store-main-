import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  MessageCircle, Mail, Phone, MapPin, Send, HelpCircle, 
  Shield, FileText, Wallet, ShoppingBag, LogOut, Plus, ChevronRight,
  CheckCircle, Package, Truck, Home as HomeIcon, Clock, XCircle
} from 'lucide-react';
import { useStore } from '../StoreContext';
import { Link } from 'react-router-dom';
import { cn } from '../types';
import toast from 'react-hot-toast';
import UserAvatar from '../components/UserAvatar';

export default function Support() {
  const { user, logout, refreshUser, config, fetchConfig } = useStore();
  const [orders, setOrders] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [loading, setLoading] = useState(false);
  const [showTC, setShowTC] = useState(false);
  const [faqHtml, setFaqHtml] = useState<string | null>(null);

  useEffect(() => {
    fetchConfig();
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        const faq = data.config?.find((s: any) => s.key === 'faq_content');
        if (faq) setFaqHtml(faq.value);
      });

    const params = new URLSearchParams(window.location.search);
    const subjectParam = params.get('subject');
    const messageParam = params.get('message');

    if (user) {
      setForm(prev => ({ 
        ...prev, 
        name: user.name || '', 
        email: user.email || '',
        subject: subjectParam || prev.subject,
        message: messageParam || prev.message
      }));
      refreshUser();
      fetch('/api/admin/orders')
        .then(res => res.json())
        .then(data => setOrders(data.filter((o: any) => o.user_id === user.id)));
      
      fetch('/api/admin/support/tickets')
        .then(res => res.json())
        .then(data => setTickets(data.filter((t: any) => t.user_id === user.id)));
    } else if (subjectParam || messageParam) {
      setForm(prev => ({
        ...prev,
        subject: subjectParam || prev.subject,
        message: messageParam || prev.message
      }));
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/support/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          user_id: user?.id || null, 
          name: form.name,
          email: form.email,
          subject: form.subject, 
          message: form.message 
        })
      });
      if (res.ok) {
        toast.success('Support ticket created! We will contact you soon.');
        setForm({ name: '', email: '', subject: '', message: '' });
        if (user) {
          // Refresh tickets
          const tRes = await fetch('/api/admin/support/tickets');
          const tData = await tRes.json();
          setTickets(tData.filter((t: any) => t.user_id === user.id));
        }
      }
    } catch (err) {
      toast.error('Failed to submit ticket');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pb-32 md:pb-12 space-y-16">
      <div className="bg-stone-900 rounded-[3rem] p-12 text-center text-white space-y-4">
        <h1 className="text-5xl font-black tracking-tight">Need Assistance?</h1>
        <p className="text-stone-400 text-lg max-w-2xl mx-auto">
          We're here to help you with anything from order tracking to product inquiries. Reach out through any of our channels below.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
        {[
          { title: 'WhatsApp', icon: MessageCircle, color: 'bg-emerald-50 text-emerald-600', text: 'Chat Now', action: `https://wa.me/${(config.find(c => c.key === 'whatsapp_number')?.value || '919876543210').replace(/\D/g, '')}?text=${encodeURIComponent(user ? `Hello, I need support for my account (User ID: ${user.id}, Name: ${user.name}, Phone: ${user.phone}).` : "Hello, I need support.")}` },
          { title: 'Call Us', icon: Phone, color: 'bg-blue-50 text-blue-600', text: config.find(c => c.key === 'store_phone')?.value || '+91 98765 43210', action: `tel:${config.find(c => c.key === 'store_phone')?.value || '+919876543210'}` },
          { title: 'Email', icon: Mail, color: 'bg-amber-50 text-amber-600', text: 'support@hindstore.com', action: `mailto:support@hindstore.com?subject=${encodeURIComponent("Support Request")}&body=${encodeURIComponent(user ? `I need help for my account.\n\nUser ID: ${user.id}\nName: ${user.name}\nPhone: ${user.phone}\n\nDetails:` : "I need help.")}` },
        ].map((item, i) => (
          <a key={i} href={item.action} target={item.title === 'WhatsApp' ? "_blank" : undefined} className="group bg-white p-8 rounded-[2rem] border border-stone-100 shadow-sm hover:shadow-xl transition-all flex flex-col items-center text-center space-y-4">
            <div className={cn("w-16 h-16 rounded-3xl flex items-center justify-center transition-transform group-hover:scale-110", item.color)}>
              <item.icon size={32} />
            </div>
            <div>
              <h3 className="font-black text-lg">{item.title}</h3>
              <p className="text-sm font-bold text-primary mt-1 group-hover:underline">{item.text}</p>
            </div>
          </a>
        ))}
      </div>

      {user && (
        <section className="bg-white rounded-3xl shadow-sm border border-stone-100 overflow-hidden max-w-5xl mx-auto">
          <div className="p-8 bg-primary text-white">
            <div className="flex items-center space-x-4">
              <UserAvatar user={user} size="lg" className="border-white/20" />
              <div>
                <h2 className="text-2xl font-bold">{user.name}</h2>
                <p className="text-white/70">{user.phone}</p>
              </div>
              <button 
                onClick={logout}
                className="ml-auto p-2 hover:bg-white/10 rounded-xl transition-colors"
                title="Logout"
              >
                <LogOut size={24} />
              </button>
            </div>
          </div>
          
          <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="flex items-center space-x-3 text-stone-400 uppercase text-[10px] font-bold tracking-widest">
                <Wallet size={14} />
                <span>Wallet Balance</span>
              </div>
              <div className="flex items-center justify-between p-4 bg-stone-50 rounded-2xl border border-stone-100">
                <span className="text-3xl font-bold text-primary">₹{user.wallet_balance}</span>
                <Link 
                  to="/profile?tab=wallet"
                  className="text-xs font-bold text-primary bg-primary/10 px-3 py-1 rounded-lg hover:bg-primary/20 transition-colors"
                >
                  Add Money
                </Link>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center space-x-3 text-stone-400 uppercase text-[10px] font-bold tracking-widest">
                <MapPin size={14} />
                <span>Saved Address</span>
              </div>
              <div className="p-4 bg-stone-50 rounded-2xl border border-stone-100 min-h-[76px]">
                <p className="text-sm text-stone-600 line-clamp-2">{user.address || 'No address saved yet.'}</p>
              </div>
            </div>
          </div>

          {tickets.length > 0 && (
            <div className="px-8 pb-8">
              <div className="flex items-center space-x-3 text-stone-400 uppercase text-[10px] font-bold tracking-widest mb-4">
                <MessageCircle size={14} />
                <span>My Support Tickets</span>
              </div>
              <div className="space-y-3">
                {tickets.map((ticket) => (
                  <div key={ticket.id} className="p-4 bg-stone-50 rounded-2xl border border-stone-100 flex justify-between items-center">
                    <div>
                      <p className="text-sm font-bold">{ticket.subject}</p>
                      <p className="text-[10px] text-stone-400">ID: #TKT-{ticket.id} • {new Date(ticket.created_at).toLocaleDateString()}</p>
                    </div>
                    <span className={cn(
                      "text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider",
                      ticket.status === 'open' ? "bg-amber-100 text-amber-600" : 
                      ticket.status === 'in-progress' ? "bg-blue-100 text-blue-600" : 
                      "bg-emerald-100 text-emerald-600"
                    )}>
                      {ticket.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {user.role === 'admin' && (
            <div className="px-8 pb-8">
              <Link 
                to="/admin"
                className="w-full p-4 bg-primary/5 border border-primary/20 rounded-2xl flex items-center justify-between group hover:bg-primary/10 transition-all"
              >
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-primary text-white rounded-xl shadow-sm">
                    <Shield size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-stone-900">Admin Dashboard</h3>
                    <p className="text-xs text-stone-500">Manage products, orders, and store settings</p>
                  </div>
                </div>
                <ChevronRight size={20} className="text-stone-400 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          )}

          <div className="px-8 pb-8">
            <div className="flex items-center space-x-3 text-stone-400 uppercase text-[10px] font-bold tracking-widest mb-4">
              <ShoppingBag size={14} />
              <span>Recent Orders</span>
            </div>
            <div className="space-y-3">
              {orders.length === 0 ? (
                <p className="text-stone-400 text-sm italic">No orders placed yet.</p>
              ) : (
                orders.slice(0, 3).map((order) => (
                  <div key={order.id} className="p-4 bg-stone-50 rounded-2xl border border-stone-100 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-bold">#ORD-{order.id}</p>
                        <p className="text-[10px] text-stone-400">{new Date(order.created_at).toLocaleDateString()}</p>
                      </div>
                      <div className="flex items-center space-x-4">
                        <span className="text-xs font-bold text-primary">₹{order.total}</span>
                        <Link to={`/invoice/${order.id}`} className="p-2 text-stone-400 hover:text-primary transition-colors">
                          <FileText size={18} />
                        </Link>
                      </div>
                    </div>
                    
                    {/* Progress Bar */}
                    {(order.status === 'cancelled' || order.status === 'failed') ? (
                      <div className="flex items-center space-x-3 p-4 bg-red-50 rounded-2xl border border-red-100">
                        <div className="p-2 bg-red-100 text-red-600 rounded-xl">
                          <XCircle size={20} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-red-900">Order {order.status === 'cancelled' ? 'Cancelled' : 'Failed'}</p>
                          <p className="text-[10px] text-red-600">This order was {order.status === 'cancelled' ? 'cancelled' : 'marked as failed'} and will not be processed.</p>
                          {order.rejection_reason && (
                            <div className="mt-2 p-2 bg-white/50 rounded-lg border border-red-200">
                              <p className="text-[10px] font-black text-red-800 uppercase tracking-tighter">Reason</p>
                              <p className="text-xs text-red-700">{order.rejection_reason}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="relative pt-4 pb-2">
                        <div className="flex justify-between relative z-10">
                          {[
                            { id: 'pending', label: 'Placed', icon: CheckCircle },
                            { id: 'processing', label: 'Packed', icon: Package },
                            { id: 'shipped', label: 'Shipped', icon: Truck },
                            { id: 'delivered', label: 'Delivered', icon: HomeIcon },
                          ].map((step, i) => {
                            const statuses = ['pending', 'processing', 'shipped', 'delivered'];
                            const currentIndex = statuses.indexOf(order.status);
                            const isActive = i <= currentIndex;
                            const isCurrent = i === currentIndex;
                            const Icon = step.icon;
                            
                            return (
                              <div key={step.id} className="flex flex-col items-center group">
                                <div className={cn(
                                  "w-8 h-8 rounded-full flex items-center justify-center transition-all duration-500 border-2",
                                  isActive 
                                    ? "bg-primary border-primary text-white shadow-lg shadow-primary/20" 
                                    : "bg-white border-stone-200 text-stone-300",
                                  isCurrent && "ring-4 ring-primary/20 animate-pulse"
                                )}>
                                  <Icon size={14} />
                                </div>
                                <span className={cn(
                                  "text-[9px] font-bold mt-2 uppercase tracking-tight transition-colors duration-500",
                                  isActive ? "text-primary" : "text-stone-400"
                                )}>
                                  {step.label}
                                </span>
                                {isCurrent && (
                                  <span className="text-[7px] text-primary font-bold animate-bounce mt-0.5">
                                    Current
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                        
                        {/* Connecting Lines */}
                        <div className="absolute top-[30px] left-6 right-6 h-[2px] bg-stone-100 -z-0">
                          <div 
                            className="h-full bg-primary transition-all duration-1000 ease-out" 
                            style={{ width: `${(Math.max(0, ['pending', 'processing', 'shipped', 'delivered'].indexOf(order.status)) / 3) * 100}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {order.status === 'pending' && (
                      <div className="flex items-center space-x-2 p-2 bg-amber-50 rounded-xl border border-amber-100">
                        <Clock size={12} className="text-amber-600" />
                        <p className="text-[10px] text-amber-700 font-medium">
                          Your order is being verified by the store.
                        </p>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </section>
      )}

      <section className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <div className="inline-flex items-center space-x-2 bg-primary/10 text-primary px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest mb-4">
            <HelpCircle size={14} />
            <span>Got Questions?</span>
          </div>
          <h2 className="text-3xl font-black text-stone-900">Frequently Asked Questions</h2>
          <p className="text-stone-500 mt-2">Everything you need to know about General Store Karyana Shop Nayagaon. Last Updated: {new Date().toLocaleDateString()}</p>
        </div>

        {faqHtml ? (
          <div 
            className="prose prose-stone max-w-none prose-headings:font-black prose-p:text-stone-600 prose-p:leading-relaxed bg-white p-8 md:p-12 rounded-[2.5rem] border border-stone-100 shadow-sm"
            dangerouslySetInnerHTML={{ __html: faqHtml }}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[
              {
                cat: "Order Management & Tracking",
                q: [
                  { q: "How can I track my live order status?", a: "Go to your Profile or Support page above. You'll see a real-time progress bar for your most recent orders. Once an order is 'Shipped', you can see the assigned delivery runner's status. For any delays beyond the estimated 30-minute window, please use the WhatsApp shortcut for instant clarification." },
                  { q: "What should I do if my items are missing or damaged?", a: "Perishables like dairy or produce should be inspected at delivery. For other items, take a photo and create a support ticket below or message us on WhatsApp with your Order ID (#ORD-XXX) within 24 hours. We provide instant wallet refunds for verified damages." },
                  { q: "Can I cancel an order after placing it?", a: "You can only cancel an order while it is in the 'Pending' status. Once the store starts 'Processing' (packing) your items, cancellations are no longer possible as the items are already committed for delivery." }
                ]
              },
              {
                cat: "Wallet, Payments & Khata",
                q: [
                  { q: "What is General Store Karyana Shop Wallet and how does it work?", a: "General Store Karyana Shop Wallet is our integrated digital payment system. You can pre-load balance for faster checkouts. All refunds are instantly credited to this wallet. You can pay via UPI to top up your balance by contacting your delivery runner or visiting the store." },
                  { q: "Who is eligible for the 'Khata' credit system?", a: "Khata (Credit) is exclusively for our regular verified customers. After 10 successful delivered orders, you can apply for a Khata limit. This allows you to order groceries on 0% interest credit, payable weekly or monthly." },
                  { q: "Why did my payment fail but money was deducted?", a: "This is rare but happens due to bank server delays. If your order status is 'Failed', the amount will be automatically refunded to your source account by your bank within 3-5 business days. You can also send us a screenshot on WhatsApp for manual verification." }
                ]
              },
              {
                cat: "Logistics & Delivery Runners",
                q: [
                  { q: "Who are 'Runners' and how do they deliver?", a: "Runners are our dedicated fleet of delivery partners. They are locally verified and trained in safe handling. They use the HGS Delivery App to ensure your products reach you within the promised time frame (usually 2-4 hours for local Ludhiana orders)." },
                  { q: "Do you offer contactless delivery?", a: "Yes. You can mention 'Contactless Delivery' in the order notes at checkout. Our runner will leave the package at your doorstep and notify you via call or WhatsApp. This is only possible for pre-paid (Wallet) orders." },
                  { q: "What are your delivery hours?", a: "We deliver from 9:00 AM to 9:30 PM, seven days a week. Orders placed after 9:00 PM are automatically scheduled for the next morning slot at 9:30 AM." }
                ]
              },
              {
                cat: "Privacy, Security & Accounts",
                q: [
                  { q: "Is my personal data safe with General Store Karyana Shop?", a: "We prioritize your privacy above all. Your phone number and address are only shared with the assigned delivery runner during the active delivery phase. We use industry-standard encryption for all data storage. We never sell your data to third-party marketers." },
                  { q: "Why is a profile photo mandatory?", a: "To maintain the integrity of our 'Khata' system and ensure the safety of our runners, we require a clear profile photo. This prevents identity theft and ensures that the delivery reaches the right person in high-density areas." },
                  { q: "Can I have multiple accounts?", a: "No. Our system detects multiple accounts linked to the same device or phone number. Fraudulent activities like coupon stacking via multiple accounts result in permanent bans and forfeiture of existing wallet balances." }
                ]
              }
            ].map((category, idx) => (
              <div key={idx} className="space-y-6">
                <h3 className="text-sm font-black text-primary uppercase tracking-widest border-b border-primary/10 pb-2 flex items-center space-x-2">
                  <span className="w-1.5 h-1.5 bg-primary rounded-full" />
                  <span>{category.cat}</span>
                </h3>
                <div className="space-y-6">
                  {category.q.map((faq, fidx) => (
                    <div key={fidx} className="group">
                      <p className="font-bold text-stone-900 group-hover:text-primary transition-colors flex items-start space-x-2">
                        <span className="text-primary mt-1">•</span>
                        <span>{faq.q}</span>
                      </p>
                      <p className="text-sm text-stone-600 mt-2 pl-4 border-l border-stone-100 leading-relaxed italic">{faq.a}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Support Form */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="bg-white p-8 rounded-3xl shadow-sm border border-stone-100 space-y-6">
            <h3 className="text-2xl font-bold">Send us a message</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className="text-sm font-medium text-stone-700">Your Name</label>
                <input 
                  type="text" 
                  required
                  className="input-field" 
                  placeholder="John Doe"
                  value={form.name}
                  onChange={e => setForm({...form, name: e.target.value})}
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-stone-700">Email Address</label>
                <input 
                  type="email" 
                  required
                  className="input-field" 
                  placeholder="john@example.com"
                  value={form.email}
                  onChange={e => setForm({...form, email: e.target.value})}
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-stone-700">Subject</label>
              <input 
                type="text" 
                required
                className="input-field" 
                placeholder="Order Issue, Product Inquiry, etc."
                value={form.subject}
                onChange={e => setForm({...form, subject: e.target.value})}
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-stone-700">Message</label>
              <textarea 
                required
                rows={5}
                className="input-field resize-none" 
                placeholder="How can we help you today?"
                value={form.message}
                onChange={e => setForm({...form, message: e.target.value})}
              />
            </div>
            <button 
              type="submit" 
              disabled={loading}
              className="btn-primary w-full py-4 flex items-center justify-center space-x-2"
            >
              {loading ? (
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Send size={18} />
                  <span>Submit Ticket</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Quick Links */}
        <div className="space-y-4">
          <div className="bg-white p-6 rounded-3xl border border-stone-100 shadow-sm space-y-4">
            <h3 className="font-bold">Quick Help</h3>
            <div className="space-y-2">
              <Link to="/privacy-policy" className="flex items-center justify-between p-3 hover:bg-stone-50 rounded-xl transition-colors group">
                <div className="flex items-center space-x-3">
                  <Shield size={18} className="text-stone-400 group-hover:text-primary" />
                  <span className="text-sm font-medium">Privacy Policy</span>
                </div>
                <ChevronRight size={16} className="text-stone-300" />
              </Link>
              <Link to="/terms-and-conditions" className="flex items-center justify-between p-3 hover:bg-stone-50 rounded-xl transition-colors group">
                <div className="flex items-center space-x-3">
                  <FileText size={18} className="text-stone-400 group-hover:text-primary" />
                  <span className="text-sm font-medium">Terms & Conditions</span>
                </div>
                <ChevronRight size={16} className="text-stone-300" />
              </Link>
            </div>
          </div>
          
          <div className="bg-primary/5 p-6 rounded-3xl border border-primary/10 space-y-2">
            <h3 className="font-bold text-primary">Store Location</h3>
            <p className="text-xs text-stone-600 leading-relaxed whitespace-pre-line">
              {config.find(c => c.key === 'store_address')?.value || 'Main Market, Nayagaon'}
            </p>
            <a 
              href={config.find(c => c.key === 'store_location')?.value || '#'} 
              target="_blank" 
              className="inline-block text-xs font-bold text-primary hover:underline mt-2"
            >
              Get Directions
            </a>
          </div>
        </div>
      </div>

      {/* T&C Modal */}
      {showTC && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[80vh] flex flex-col overflow-hidden"
          >
            <div className="p-6 border-b border-stone-100 flex justify-between items-center bg-stone-50">
              <h2 className="text-xl font-bold">Terms & Conditions</h2>
              <button onClick={() => setShowTC(false)} className="p-2 hover:bg-stone-200 rounded-lg transition-colors">
                <Plus size={24} className="rotate-45" />
              </button>
            </div>
            <div className="p-8 overflow-y-auto">
              <div className="whitespace-pre-wrap text-stone-600 leading-relaxed font-sans">
                {config.find(c => c.key === 'store_tc')?.value || "Default Terms & Conditions..."}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
