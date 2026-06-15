import React, { useState, useEffect } from 'react';
import { Mail, RefreshCw, Users, Trash2, Send } from 'lucide-react';
import { adminService } from '@/services/adminService';
import { fetchWithHandling } from '@/lib/api';
import { getAuthHeaders, cn } from '@/lib/utils';
import toast from 'react-hot-toast';

const NewsletterTab: React.FC = () => {
    const [subs, setSubs] = useState<any[]>([]);
    const [subSearch, setSubSearch] = useState('');
    const [selectedEmails, setSelectedEmails] = useState<string[]>([]);
    const [newEmail, setNewEmail] = useState('');
    const [addLoading, setAddLoading] = useState(false);
    
    // Campaign composer states
    const [subject, setSubject] = useState('');
    const [campaignText, setCampaignText] = useState('');
    const [sending, setSending] = useState(false);
    const [dispatchMethod, setDispatchMethod] = useState<'email' | 'in-app' | 'system-notification'>('email');
    const [campaigns, setCampaigns] = useState<any[]>([]);
    const [syncing, setSyncing] = useState(false);

    const fetchSubs = async () => {
      try {
        const data = await adminService.getNewsletterSubs(getAuthHeaders());
        if (data) {
          setSubs(data);
          // Auto select all by default
          setSelectedEmails(data.map(s => s.email));
        }
      } catch (err) {
        console.error(err);
      }
    };

    const fetchCampaigns = async () => {
      try {
        const data = await adminService.getNewsletterCampaigns(getAuthHeaders());
        if (data) {
          setCampaigns(data);
        }
      } catch (err) {
        console.error(err);
      }
    };

    useEffect(() => {
      fetchSubs();
      fetchCampaigns();
    }, []);

    const handleAddSubscriber = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!newEmail || !newEmail.includes('@')) {
        toast.error('Please enter a valid email address');
        return;
      }
      setAddLoading(true);
      try {
        const res = await fetchWithHandling<any>('/api/admin/newsletter/add', {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({ email: newEmail })
        });
        if (res && res.success) {
          toast.success('Subscriber added successfully!');
          setNewEmail('');
          fetchSubs();
        } else {
          toast.error(res?.message || 'Failed to add subscriber');
        }
      } catch (err: any) {
        toast.error(err?.message || 'Error occurred while adding subscriber');
      } finally {
        setAddLoading(false);
      }
    };

    const handleSyncUsers = async () => {
      setSyncing(true);
      try {
        const res = await fetchWithHandling<any>('/api/admin/newsletter/sync-users', {
          method: 'POST',
          headers: getAuthHeaders()
        });
        if (res && res.success) {
          toast.success(`Successfully imported ${res.count} registered users to newsletter!`);
          fetchSubs();
        } else {
          toast.error('Sync failed');
        }
      } catch (err: any) {
        toast.error(err?.message || 'Error occurred while syncing users');
      } finally {
        setSyncing(false);
      }
    };

    const handleDeleteSubscriber = async (id: string, email: string) => {
      if (!window.confirm(`Are you sure you want to remove ${email} from the subscription list?`)) return;
      try {
        const res = await fetchWithHandling<any>(`/api/admin/newsletter/${id}`, {
          method: 'DELETE',
          headers: getAuthHeaders()
        });
        if (res && res.success) {
          toast.success('Subscriber removed');
          setSubs(subs.filter(s => s.id !== id));
          setSelectedEmails(selectedEmails.filter(e => e !== email));
        }
      } catch (err) {
        toast.error('Failed to remove subscriber');
      }
    };

    const handleSendCampaign = async (e: React.FormEvent) => {
      e.preventDefault();
      if (selectedEmails.length === 0) {
        toast.error('Please select at least one subscriber recipient');
        return;
      }
      if (!subject || !campaignText) {
        toast.error('Campaign Subject and Message Body are required');
        return;
      }
      setSending(true);
      try {
        const res = await fetchWithHandling<any>('/api/admin/newsletter/send', {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({
            subject,
            message: campaignText,
            recipientCount: selectedEmails.length,
            channel: dispatchMethod
          })
        });
        if (res && res.success) {
          toast.success(`Campaign Dispatched Successfully via [${dispatchMethod.toUpperCase()}]!`);
          
          if (dispatchMethod === 'email') {
            const emails = selectedEmails.join(',');
            const mailtoSubject = encodeURIComponent(subject);
            const mailtoBody = encodeURIComponent(campaignText);
            window.open(`mailto:${emails}?subject=${mailtoSubject}&body=${mailtoBody}`);
          }
          
          setSubject('');
          setCampaignText('');
          fetchCampaigns();
        } else {
          toast.error('Failed to dispatch campaign');
        }
      } catch (err: any) {
        toast.error(err?.message || 'Error occurred while sending campaign');
      } finally {
        setSending(false);
      }
    };

    const filteredSubs = subs.filter(s => 
      s && (s.email || '').toLowerCase().includes(subSearch.toLowerCase()) ||
      (s.user_name && s.user_name.toLowerCase().includes(subSearch.toLowerCase()))
    );

    const isAllSelected = filteredSubs.length > 0 && filteredSubs.every(s => selectedEmails.includes(s.email));

    const toggleSelectAll = () => {
      if (isAllSelected) {
        const filteredEmails = filteredSubs.map(s => s.email);
        setSelectedEmails(selectedEmails.filter(e => !filteredEmails.includes(e)));
      } else {
        const filteredEmails = filteredSubs.map(s => s.email);
        setSelectedEmails(Array.from(new Set([...selectedEmails, ...filteredEmails])));
      }
    };

    const toggleSelectEmail = (email: string) => {
      if (selectedEmails.includes(email)) {
        setSelectedEmails(selectedEmails.filter(e => e !== email));
      } else {
        setSelectedEmails([...selectedEmails, email]);
      }
    };

    return (
      <div className="space-y-8 animate-in fade-in duration-500">
         <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-stone-100 pb-8">
          <div>
            <h2 className="text-4xl font-black text-stone-900 tracking-tight">Newsletter & Campaigns</h2>
            <p className="text-stone-500 mt-2 text-lg font-medium">Add, manage, and dispatch beautiful campaign emails to your subscribers list.</p>
          </div>
          <div className="flex items-center gap-6 bg-white border border-stone-100 px-6 py-4 rounded-3xl shadow-sm">
             <div className="flex flex-col pr-6 border-r border-stone-100">
                <span className="text-[10px] font-black text-stone-400 uppercase tracking-wider mb-1">Total Subscribers</span>
                <span className="text-2xl font-black text-stone-900">{subs.length}</span>
             </div>
             <div className="flex flex-col">
                <span className="text-[10px] font-black text-stone-400 uppercase tracking-wider mb-1">Selected Recipients</span>
                <span className="text-2xl font-black text-stone-800">{selectedEmails.length}</span>
             </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white rounded-[2.5rem] border border-stone-100 p-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex-1 space-y-4">
                <h3 className="text-lg font-black text-stone-900 uppercase tracking-tight">Add Subscriber Manually</h3>
                <form onSubmit={handleAddSubscriber} className="flex gap-4">
                  <div className="relative flex-1">
                    <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-stone-400" size={20} />
                    <input
                      type="email"
                      placeholder="Enter email address (e.g. user@example.com)"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      className="w-full bg-stone-50 border-stone-200 border-2 rounded-2xl pl-12 pr-6 py-4 text-stone-900 placeholder:text-stone-300 outline-none focus:border-stone-900 focus:bg-white transition-all text-sm font-semibold"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={addLoading}
                    className="bg-stone-900 hover:bg-stone-800 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50 pointer-events-auto cursor-pointer"
                  >
                    {addLoading ? 'Adding...' : 'Subscribe'}
                  </button>
                </form>
              </div>

              <div className="w-full md:w-px md:h-20 bg-stone-100" />

              <div className="flex flex-col space-y-3 justify-center">
                <h3 className="text-[10px] font-black text-stone-400 uppercase tracking-widest text-center md:text-left pl-1">Import Customers</h3>
                <button
                  type="button"
                  onClick={handleSyncUsers}
                  disabled={syncing}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer font-sans"
                >
                  <Users size={16} />
                  <span>{syncing ? 'Syncing...' : 'Sync Registered Users'}</span>
                </button>
              </div>
            </div>

            <div className="bg-white rounded-[2.5rem] border border-stone-100 p-8 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <h3 className="text-lg font-black text-stone-900 uppercase tracking-tight">Subscription Directory</h3>
                <input
                  type="text"
                  placeholder="Search subscribers..."
                  value={subSearch}
                  onChange={(e) => setSubSearch(e.target.value)}
                  className="bg-stone-50 border border-stone-250 rounded-xl px-4 py-2 text-xs font-semibold outline-none focus:border-stone-450 focus:bg-white transition-all w-full sm:w-64"
                />
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-stone-50/50 text-stone-400 text-[10px] uppercase font-black tracking-[0.2em] border-b border-stone-100">
                    <tr>
                      <th className="px-4 py-5 w-12 text-center border-b border-stone-100">
                        <input
                          type="checkbox"
                          checked={isAllSelected}
                          onChange={toggleSelectAll}
                          className="w-4 h-4 rounded border-stone-300 text-stone-900 focus:ring-stone-900 focus:ring-2 cursor-pointer"
                        />
                      </th>
                      <th className="px-4 py-5 border-b border-stone-100">Subscriber</th>
                      <th className="px-4 py-5 border-b border-stone-100">User Status</th>
                      <th className="px-4 py-5 border-b border-stone-100">Subscribed On</th>
                      <th className="px-4 py-5 text-right border-b border-stone-100">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-50">
                    {filteredSubs.map((sub) => (
                      <tr key={sub.id} className="hover:bg-stone-50/50 transition-colors group">
                        <td className="px-4 py-4 text-center">
                          <input
                            type="checkbox"
                            checked={selectedEmails.includes(sub.email)}
                            onChange={() => toggleSelectEmail(sub.email)}
                            className="w-4 h-4 rounded border-stone-300 text-stone-900 focus:ring-stone-900 focus:ring-2 cursor-pointer"
                          />
                        </td>
                        <td className="px-4 py-4 mr-2">
                          <div className="flex items-center space-x-3">
                            <div className="w-9 h-9 bg-stone-100 text-stone-500 rounded-xl flex items-center justify-center font-bold text-sm">
                              {sub.user_name?.[0] || sub.email[0].toUpperCase()}
                            </div>
                            <div className="flex flex-col min-w-0">
                              <span className="text-sm font-black text-stone-900 truncate max-w-[200px]" title={sub.email}>{sub.email}</span>
                              {sub.user_name && <span className="text-[10px] text-stone-400 font-bold">{sub.user_name}</span>}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          {sub.user_id ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-100 font-sans">
                              Registered User
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider bg-stone-100 text-stone-500 font-sans">
                              Guest Reader
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-4 text-xs font-semibold text-stone-400">
                          {sub.created_at ? new Date(sub.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'External'}
                        </td>
                        <td className="px-4 py-4 text-right">
                          <button
                            onClick={() => handleDeleteSubscriber(sub.id, sub.email)}
                            className="p-2 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all cursor-pointer"
                            title="Remove Subscriber"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white rounded-[2.5rem] border border-stone-100 p-8 shadow-sm space-y-6">
              <div>
                <h3 className="text-xl font-black text-stone-900 uppercase tracking-tight">Campaign Composer</h3>
                <p className="text-xs text-stone-400 font-medium font-sans">Design and dispatch instant email updates safely to subscribers.</p>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-stone-400 uppercase tracking-wider">Choose Delivery Dispatch Channel</label>
                <div className="grid grid-cols-1 gap-2 font-sans text-xs">
                  {[
                    { id: 'email', name: 'Email Broadcast List', desc: 'Direct mail delivery with direct client email fallback.' },
                    { id: 'in-app', name: 'In-App General Banner Alert', desc: 'Creates a banner announcement across the customer page.' },
                    { id: 'system-notification', name: 'Live Database Cabinet Notification', desc: 'Saves campaign directly inside account notifications.' }
                  ].map((method) => (
                    <button
                      key={method.id}
                      type="button"
                      onClick={() => setDispatchMethod(method.id as any)}
                      className={cn(
                        "p-4 rounded-2xl border text-left transition-all flex items-start gap-4 cursor-pointer",
                        dispatchMethod === method.id 
                          ? "border-stone-950 bg-stone-50 shadow-sm" 
                          : "border-stone-100 hover:border-stone-200 bg-white"
                      )}
                    >
                      <input 
                        type="radio" 
                        readOnly 
                        checked={dispatchMethod === method.id} 
                        className="mt-0.5 accent-stone-950 cursor-pointer" 
                      />
                      <div>
                        <p className="font-extrabold text-stone-900 uppercase tracking-wide text-[10px] mb-0.5">{method.name}</p>
                        <p className="text-[10px] text-stone-500 font-medium">{method.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <form onSubmit={handleSendCampaign} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-stone-400 uppercase tracking-wider pl-1">Email Subject Line</label>
                  <input
                    type="text"
                    required
                    placeholder="Enter email subject header..."
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full bg-stone-50 border-stone-200 border-2 rounded-xl px-5 py-3.5 text-stone-900 placeholder:text-stone-300 outline-none focus:border-stone-900 focus:bg-white transition-all text-sm font-semibold"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-stone-400 uppercase tracking-wider pl-1 font-sans">Message Body</label>
                  <textarea
                    required
                    rows={8}
                    placeholder="Write detailed campaign description..."
                    value={campaignText}
                    onChange={(e) => setCampaignText(e.target.value)}
                    className="w-full bg-stone-50 border-stone-200 border-2 rounded-2xl px-5 py-4 text-stone-900 placeholder:text-stone-300 outline-none focus:border-stone-900 focus:bg-white transition-all text-sm font-medium h-52 resize-none leading-relaxed"
                  />
                </div>

                <div className="flex flex-col gap-4 bg-stone-50 p-5 rounded-2xl border border-stone-100 font-sans">
                  <div className="flex justify-between items-center text-xs font-bold text-stone-500">
                    <span>Target Recipients:</span>
                    <span className="text-stone-950 font-black">{selectedEmails.length} Readers</span>
                  </div>
                  <button
                    type="submit"
                    disabled={sending}
                    className="w-full bg-stone-900 hover:bg-stone-800 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all hover:shadow-lg active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                  >
                    {sending ? (
                      <>
                        <RefreshCw className="animate-spin" size={14} />
                        <span>Sending Packets...</span>
                      </>
                    ) : (
                      <>
                        <Send size={14} />
                        <span>Send Campaign Now</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>

            <div className="bg-white rounded-[2.5rem] border border-stone-100 p-8 shadow-sm space-y-4">
              <div>
                <h3 className="text-xl font-black text-stone-900 uppercase tracking-tight">Campaign Dispatch Logs</h3>
                <p className="text-xs text-stone-400 font-medium font-sans">History of campaigns dispatched from this admin panel.</p>
              </div>

              <div className="space-y-3 font-sans h-80 overflow-y-auto no-scrollbar pr-1">
                {campaigns.map((c) => (
                  <div key={c.id} className="p-4 rounded-2xl border border-stone-100 bg-stone-50/50 space-y-2 text-xs">
                    <div className="flex justify-between items-start gap-4">
                      <p className="font-extrabold text-stone-900 line-clamp-1">{c.subject}</p>
                      <span className="bg-stone-200 text-stone-700 font-black uppercase text-[8px] tracking-wider px-2 py-0.5 rounded shrink-0">
                        {c.channel}
                      </span>
                    </div>
                    <p className="text-stone-500 line-clamp-2 text-[11px] leading-relaxed pr-2">{c.message}</p>
                    <div className="flex justify-between items-center text-[10px] text-stone-400 font-bold pt-1 border-t border-stone-100/50">
                      <span>Recipients: {c.recipient_count}</span>
                      <span>
                        {new Date(c.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
};

export default NewsletterTab;
