import React from 'react';
import { 
  ShieldAlert, 
  Smartphone, 
  Mail, 
  Layout, 
  Truck, 
  MapPin, 
  Settings as SettingsIcon, 
  Trash2, 
  Palette, 
  CheckCircle2, 
  Zap, 
  Copy, 
  Server 
} from 'lucide-react';
import { cn } from '@/types';

interface StoreSettingsTabProps {
  toast: any;
  getAuthHeaders: () => any;
  fetchWithHandling: <T>(url: string, options?: any) => Promise<T>;
  config: any[];
  getSetting: (key: string) => string;
  updateSetting: (key: string, value: string) => void;
  deliveryFee: any;
  setDeliveryFee: (fee: any) => void;
  freeDeliveryThreshold: any;
  setFreeDeliveryThreshold: (th: any) => void;
  deliveryAreas: any[];
  setDeliveryAreaModal: (modal: { open: boolean; mode: 'add' | 'edit'; area?: any }) => void;
  setNewDeliveryArea: (area: { name: string; fee: string; min_order: string }) => void;
  handleDeleteDeliveryArea: (id: number) => void;
  adminTheme: string;
  setAdminTheme: (theme: string) => void;
}

export default function StoreSettingsTab({
  toast,
  getAuthHeaders,
  fetchWithHandling,
  config,
  getSetting,
  updateSetting,
  deliveryFee,
  setDeliveryFee,
  freeDeliveryThreshold,
  setFreeDeliveryThreshold,
  deliveryAreas,
  setDeliveryAreaModal,
  setNewDeliveryArea,
  handleDeleteDeliveryArea,
  adminTheme,
  setAdminTheme,
}: StoreSettingsTabProps) {
  return (
    <div className="h-full overflow-y-auto no-scrollbar max-w-5xl space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20 font-sans pr-2">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-stone-100 pb-10">
        <div>
          <h2 className="text-4xl font-black text-stone-900 tracking-tight text-left">Store Settings</h2>
          <p className="text-stone-500 mt-2 text-lg font-medium text-left">Manage your store's general information, security, and delivery settings.</p>
        </div>
        <div className="bg-white px-6 py-4 rounded-[2rem] shadow-sm border border-stone-100 flex items-center space-x-4">
          <div className="w-3 h-3 bg-emerald-500 rounded-full" />
          <span className="text-xs font-black text-stone-900 uppercase tracking-widest">Settings are synced</span>
        </div>
      </div>

      {/* Announcement Broadcast */}
      <section className="relative group">
        <div className="absolute inset-0 bg-gradient-to-br from-red-600 to-red-700 blur-2xl opacity-10 group-hover:opacity-20 transition-opacity" />
        <div className="relative bg-white border-4 border-red-50 rounded-[3rem] shadow-2xl shadow-red-200/40 p-10 overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-red-55 rounded-full -mr-40 -mt-40 opacity-50 pointer-events-none" />
          
          <div className="relative z-10 space-y-10">
            <div className="flex items-center space-x-6">
              <div className="w-20 h-20 bg-red-600 text-white rounded-[2rem] flex items-center justify-center shadow-2xl shadow-red-600/30 rotate-3">
                <ShieldAlert size={40} />
              </div>
              <div>
                <h3 className="text-3xl font-black text-stone-900 tracking-tight leading-none mb-2 text-left">Send Urgent Alert</h3>
                <p className="text-stone-400 font-bold uppercase text-[10px] tracking-[0.2em] text-left">Send an alert message to all online customers</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-4">
              <div className="space-y-4">
                <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest pl-4 text-left block">Alert Title</label>
                <input 
                  id="broadcast-title"
                  type="text" 
                  placeholder="e.g. SHOP CLOSED TODAY"
                  className="w-full bg-stone-50 border-stone-100 border-2 rounded-[1.5rem] px-8 py-5 text-stone-900 placeholder:text-stone-300 outline-none focus:border-red-500 focus:bg-white transition-all font-black uppercase tracking-widest text-sm"
                />
              </div>
              <div className="space-y-4">
                <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest pl-4 text-left block">Priority Level</label>
                <select 
                  id="broadcast-type"
                  className="w-full bg-stone-50 border-stone-100 border-2 rounded-[1.5rem] px-8 py-5 text-stone-900 outline-none focus:border-red-500 focus:bg-white transition-all font-black uppercase tracking-widest text-sm appearance-none cursor-pointer"
                >
                  <option value="critical">Critical (Level 5)</option>
                  <option value="warning">Warning (Level 3)</option>
                  <option value="info">Info (Level 1)</option>
                  <option value="success">Success (Level 0)</option>
                </select>
              </div>
              <div className="lg:col-span-2 space-y-4">
                <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest pl-4 text-left block">Alert Message</label>
                <textarea 
                  id="broadcast-message"
                  placeholder="Write your message here..."
                  className="w-full bg-stone-50 border-stone-100 border-2 rounded-[2rem] px-8 py-6 text-stone-900 placeholder:text-stone-300 outline-none focus:border-red-500 focus:bg-white transition-all font-medium h-40 resize-none"
                />
              </div>
            </div>

            <div className="flex flex-col md:flex-row items-center justify-between gap-6 pt-6 border-t border-stone-100 bg-stone-50/50 -mx-10 -mb-10 p-10">
              <p className="text-xs text-stone-400 font-bold max-w-sm italic text-left">Warning: This will immediately show an alert to every customer currently on the website.</p>
              <button 
                onClick={async () => {
                  const title = (document.getElementById('broadcast-title') as HTMLInputElement).value;
                  const message = (document.getElementById('broadcast-message') as HTMLTextAreaElement).value;
                  const type = (document.getElementById('broadcast-type') as HTMLSelectElement).value;
                  
                  if (!title || !message) {
                    toast.error('Title and message are required');
                    return;
                  }
                  
                  if (!window.confirm('SEND ALERT TO ALL USERS?')) return;
                  
                  try {
                    const data = await fetchWithHandling('/api/admin/broadcast-alert', {
                      method: 'POST',
                      headers: getAuthHeaders(),
                      body: JSON.stringify({ 
                        title, message, type, 
                        duration: 8000, 
                        is_unskippable: true 
                      })
                    });
                    if (data) {
                      toast.success('Alert Sent');
                      (document.getElementById('broadcast-title') as HTMLInputElement).value = '';
                      (document.getElementById('broadcast-message') as HTMLTextAreaElement).value = '';
                    }
                  } catch (e) {
                    console.error('Broadcast alert error:', e);
                  }
                }}
                className="w-full md:w-auto bg-red-600 text-white px-12 py-5 rounded-[2rem] font-black uppercase tracking-widest hover:bg-black transition-all shadow-2xl shadow-red-600/30 hover:scale-105 active:scale-95"
              >
                Send Message Now
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Core Settings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <section className="relative group">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-505 to-purple-500 blur-2xl opacity-10 group-hover:opacity-20 transition-opacity rounded-[3rem]" />
          <div className="relative bg-white/80 backdrop-blur-xl p-10 rounded-[3rem] shadow-sm border border-indigo-50 space-y-10 overflow-hidden h-full">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-55 rounded-full -mr-32 -mt-32 opacity-50 pointer-events-none" />
            
            <div className="relative z-10 space-y-6">
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20 rotate-3">
                  <Server size={24} />
                </div>
                <h3 className="text-2xl font-black text-stone-900 tracking-tight">Store Access</h3>
              </div>

              <div className="group flex items-center justify-between p-6 bg-white/50 border border-indigo-100/50 rounded-[2rem] hover:border-indigo-500/30 hover:bg-white transition-all duration-300 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.02)]">
                <div className="space-y-1">
                  <p className="font-black text-stone-900 uppercase tracking-widest text-[10px] text-left">Maintenance Mode</p>
                  <p className="text-xs text-stone-400 font-bold text-left">Only you can access the store when this is ON.</p>
                </div>
                <button 
                  onClick={() => updateSetting('maintenance_mode', getSetting('maintenance_mode') === 'true' ? 'false' : 'true')}
                  className={cn(
                    "w-12 h-6 rounded-full transition-all duration-300 relative flex items-center px-1",
                    getSetting('maintenance_mode') === 'true' ? "bg-primary" : "bg-stone-200"
                  )}
                >
                  <div className={cn(
                    "w-4 h-4 bg-white rounded-full transition-all duration-300 shadow-sm",
                    getSetting('maintenance_mode') === 'true' ? "translate-x-6" : "translate-x-0"
                  )} />
                </button>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest pl-4 text-left block">Admin Email Address</label>
                <div className="relative">
                   <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-stone-300" size={18} />
                   <input 
                    type="email" 
                    className="w-full bg-stone-50 border-stone-100 border-2 rounded-[1.5rem] pl-16 pr-8 py-5 text-stone-900 font-bold focus:border-primary focus:bg-white outline-none transition-all"
                    placeholder="you@example.com"
                    defaultValue={config.find(c => c.key === 'admin_email')?.value}
                    onBlur={(e) => updateSetting('admin_email', e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest pl-4 text-left block">Admin Phone Number</label>
                <div className="relative">
                   <Smartphone className="absolute left-6 top-1/2 -translate-y-1/2 text-stone-300" size={18} />
                   <input 
                    type="text" 
                    className="w-full bg-stone-50 border-stone-100 border-2 rounded-[1.5rem] pl-16 pr-8 py-5 text-stone-900 font-bold focus:border-primary focus:bg-white outline-none transition-all"
                    placeholder="+91 Number"
                    defaultValue={config.find(c => c.key === 'admin_phone')?.value}
                    onBlur={(e) => updateSetting('admin_phone', e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="relative group">
          <div className="absolute inset-0 bg-gradient-to-br from-pink-500 to-rose-500 blur-2xl opacity-10 group-hover:opacity-20 transition-opacity rounded-[3rem]" />
          <div className="relative bg-white/80 backdrop-blur-xl p-10 rounded-[3rem] shadow-sm border border-pink-50 space-y-10 overflow-hidden h-full">
            <div className="absolute top-0 right-0 w-64 h-64 bg-pink-55 rounded-full -mr-32 -mt-32 opacity-50 pointer-events-none" />
            <div className="relative z-10 space-y-6">
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-rose-600 text-white rounded-2xl flex items-center justify-center -rotate-3 shadow-lg shadow-pink-500/20">
                  <Layout size={24} />
                </div>
                <h3 className="text-2xl font-black text-stone-900 tracking-tight">Contact Information</h3>
              </div>

              <div className="space-y-6">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest pl-4 text-left block">Store Name</label>
                  <input 
                    type="text" 
                    className="w-full bg-stone-50 border-stone-100 border-2 rounded-[1.5rem] px-8 py-5 text-stone-900 font-bold focus:border-primary focus:bg-white outline-none transition-all"
                    placeholder="Organization Name"
                    defaultValue={config.find(c => c.key === 'store_name')?.value}
                    onBlur={(e) => updateSetting('store_name', e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest pl-2 text-left block">Support Phone</label>
                    <input 
                      type="text" 
                      className="w-full bg-stone-50 border-stone-100 border-2 rounded-[1.5rem] px-6 py-5 text-stone-900 font-bold focus:border-primary focus:bg-white outline-none transition-all text-sm"
                      defaultValue={config.find(c => c.key === 'store_phone')?.value}
                      onBlur={(e) => updateSetting('store_phone', e.target.value)}
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest pl-2 text-left block">WhatsApp Business</label>
                    <input 
                      type="text" 
                      className="w-full bg-stone-50 border-stone-100 border-2 rounded-[1.5rem] px-6 py-5 text-stone-900 font-bold focus:border-primary focus:bg-white outline-none transition-all text-sm"
                      defaultValue={config.find(c => c.key === 'whatsapp_number')?.value}
                      onBlur={(e) => updateSetting('whatsapp_number', e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest pl-4 text-left block">Store Address</label>
                  <input 
                    type="text" 
                    className="w-full bg-stone-50 border-stone-100 border-2 rounded-[1.5rem] px-8 py-5 text-stone-900 font-bold focus:border-primary focus:bg-white outline-none transition-all"
                    placeholder="Dispatch HQ Address"
                    defaultValue={config.find(c => c.key === 'store_address')?.value}
                    onBlur={(e) => updateSetting('store_address', e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Delivery Logistics */}
      <section className="bg-white p-10 rounded-[3rem] shadow-sm border border-stone-100 space-y-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-[2rem] flex items-center justify-center shadow-lg shadow-emerald-100 flex-shrink-0">
              <Truck size={32} />
            </div>
            <div>
              <h3 className="text-3xl font-black text-stone-900 tracking-tight text-left">Delivery Fees</h3>
              <p className="text-stone-400 font-bold uppercase text-[10px] tracking-[0.2em] mt-1 text-left">Set shipping costs and free delivery rules</p>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-4">
             <div className="bg-emerald-50 px-6 py-3 rounded-2xl border border-emerald-100 flex flex-col items-start">
               <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest leading-none mb-1">Standard Fee</span>
               <span className="text-lg font-black text-emerald-800">₹{deliveryFee}</span>
             </div>
             <button 
              onClick={async () => {
                await updateSetting('delivery_fee', deliveryFee);
                await updateSetting('free_delivery_threshold', freeDeliveryThreshold);
                toast.success('Logistics protocol synchronized');
              }}
              className="bg-emerald-600 text-white px-10 py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-600/20 active:scale-95 text-xs"
            >
              Save Delivery Rules
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div className="space-y-4">
            <div className="flex items-center justify-between px-2">
              <label className="text-xs font-black text-stone-400 uppercase tracking-widest">Standard Delivery Charge (₹)</label>
              <span className="text-[10px] font-bold text-stone-300">Basic cost for any order</span>
            </div>
            <input 
              type="number" 
              className="w-full bg-stone-50 border-stone-100 border-2 rounded-[1.5rem] px-10 py-6 text-2xl font-black text-stone-900 focus:border-emerald-500 focus:bg-white outline-none transition-all tracking-tighter" 
              value={deliveryFee}
              onChange={(e) => setDeliveryFee(e.target.value)}
            />
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between px-2">
              <label className="text-xs font-black text-stone-400 uppercase tracking-widest">Free Delivery threshold (₹)</label>
              <span className="text-[10px] font-bold text-emerald-500">Orders above this get free delivery</span>
            </div>
            <input 
              type="number" 
              className="w-full bg-stone-50 border-stone-100 border-2 rounded-[1.5rem] px-10 py-6 text-2xl font-black text-stone-900 focus:border-emerald-500 focus:bg-white outline-none transition-all tracking-tighter" 
              value={freeDeliveryThreshold}
              onChange={(e) => setFreeDeliveryThreshold(e.target.value)}
            />
          </div>
        </div>

        <div className="bg-stone-50 rounded-[2.5rem] p-4 pt-10 border border-stone-100 overflow-hidden mt-6">
          <div className="px-6 flex items-center justify-between mb-6">
            <div>
              <h4 className="text-xl font-black text-stone-900 tracking-tight text-left">Active Delivery Zones</h4>
              <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mt-1 text-left">Geo-fenced area exceptions</p>
            </div>
            <button 
              onClick={() => {
                setDeliveryAreaModal({ open: true, mode: 'add', area: null });
                setNewDeliveryArea({ name: '', fee: '0', min_order: '0' });
              }}
              className="bg-white text-stone-900 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border-2 border-stone-100 hover:border-emerald-500 hover:text-emerald-600 transition-all shadow-sm"
            >
              + Add Zone
            </button>
          </div>
          <div className="overflow-x-auto no-scrollbar px-6 pb-6">
            <table className="w-full text-left">
              <thead className="text-[10px] font-black text-stone-400 uppercase tracking-[0.25em]">
                <tr className="border-b-2 border-stone-100">
                  <th className="py-6 pr-6">Zone Name</th>
                  <th className="py-6 px-6">Delivery Fee</th>
                  <th className="py-6 px-6">Min Order</th>
                  <th className="py-6 pl-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {deliveryAreas.map((area) => (
                  <tr key={area.id} className="group hover:bg-white transition-all duration-300">
                    <td className="py-6 pr-6">
                       <div className="flex items-center space-x-3">
                         <div className="w-10 h-10 bg-white rounded-xl shadow-sm border border-stone-100 flex items-center justify-center text-stone-300 group-hover:text-emerald-500 transition-colors">
                           <MapPin size={18} />
                         </div>
                         <span className="font-black text-stone-900 tracking-tight">{area.name}</span>
                       </div>
                    </td>
                    <td className="py-6 px-6 font-black text-stone-700 tracking-tighter text-lg">₹{area.fee}</td>
                    <td className="py-6 px-6 font-black text-stone-700 tracking-tighter text-lg">₹{area.min_order}</td>
                    <td className="py-6 pl-6 text-right space-x-2">
                      <button 
                        onClick={() => {
                          setDeliveryAreaModal({ open: true, mode: 'edit', area });
                          setNewDeliveryArea({ name: area.name, fee: area.fee.toString(), min_order: area.min_order.toString() });
                        }}
                        className="p-3 bg-stone-100 hover:bg-primary/10 hover:text-primary rounded-2xl transition-all border border-transparent shadow-sm"
                      >
                        <SettingsIcon size={18} />
                      </button>
                      <button 
                        onClick={() => handleDeleteDeliveryArea(area.id)}
                        className="p-3 bg-stone-100 hover:bg-red-50 hover:text-red-500 rounded-2xl transition-all border border-transparent shadow-sm"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
                {deliveryAreas.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-12 text-center text-stone-400 font-bold italic bg-stone-50/50 rounded-[2rem]">No delivery zones added yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-stone-100 space-y-10">
         <div className="flex items-center space-x-4">
          <div className="w-14 h-14 bg-stone-900 text-white rounded-2xl flex items-center justify-center rotate-12">
            <Palette size={28} />
          </div>
          <div>
            <h3 className="text-3xl font-black text-stone-900 tracking-tight text-left">Store Theme</h3>
            <p className="text-stone-400 font-bold uppercase text-[10px] tracking-[0.2em] mt-1 text-left">Change the look and feel of your store</p>
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
          {[
            { id: 'theme-navy', name: 'Navy', color: '#0f172a' },
            { id: 'theme-orange', name: 'Orange', color: '#ea580c' },
            { id: 'theme-emerald', name: 'Emerald', color: '#059669' },
            { id: 'theme-indigo', name: 'Indigo', color: '#312e81' },
            { id: 'theme-slate', name: 'Slate', color: '#334155' },
            { id: 'theme-amber', name: 'Amber', color: '#d97706' },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setAdminTheme(t.id)}
              className={cn(
                "flex flex-col items-center p-6 rounded-[2rem] border-2 transition-all group relative overflow-hidden",
                adminTheme === t.id ? "border-primary bg-stone-50 shadow-xl" : "border-stone-100 hover:border-stone-200 bg-white"
              )}
            >
              <div 
                className="w-12 h-12 rounded-2xl mb-4 shadow-lg group-hover:scale-110 transition-transform" 
                style={{ backgroundColor: t.color }}
              />
              <span className={cn(
                "text-[10px] font-black uppercase tracking-widest leading-none",
                adminTheme === t.id ? "text-primary" : "text-stone-400 group-hover:text-stone-900"
              )}>
                {t.name}
              </span>
              {adminTheme === t.id && (
                <div className="absolute top-2 right-2 text-primary">
                  <CheckCircle2 size={14} />
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-stone-100 space-y-10">
         <div className="flex items-center space-x-4">
          <div className="w-14 h-14 bg-red-600 text-white rounded-2xl flex items-center justify-center -rotate-6">
            <ShieldAlert size={28} />
          </div>
          <div>
            <h3 className="text-3xl font-black text-stone-900 tracking-tight text-left">System Safe-Mode</h3>
            <p className="text-stone-400 font-bold uppercase text-[10px] tracking-[0.2em] mt-1 text-left">Maintenance & Global Access Control</p>
          </div>
        </div>
        
        <div className="flex items-center justify-between p-8 bg-stone-50 rounded-[2.5rem] border border-stone-100">
          <div className="flex items-center space-x-6">
             <div className={cn(
               "w-12 h-12 rounded-2xl flex items-center justify-center transition-colors shadow-sm",
               config.find(c => c.key === 'maintenance_mode')?.value === 'true' ? "bg-red-600 text-white" : "bg-white text-stone-300"
             )}>
               <Zap size={20} />
             </div>
             <div>
              <p className="font-black text-stone-900 tracking-tight text-lg text-left">Maintenance Mode Active</p>
              <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mt-1 text-left">Restrict all frontend traffic to admin nodes only.</p>
            </div>
          </div>
          <button 
            onClick={() => {
              const current = config.find(c => c.key === 'maintenance_mode')?.value === 'true';
              updateSetting('maintenance_mode', (!current).toString());
            }}
            className={cn(
              "w-20 h-10 rounded-full transition-all relative p-1 shadow-inner",
              config.find(c => c.key === 'maintenance_mode')?.value === 'true' ? "bg-red-600" : "bg-stone-200"
            )}
          >
            <div className={cn(
              "w-8 h-8 bg-white rounded-full shadow-lg transition-all",
              config.find(c => c.key === 'maintenance_mode')?.value === 'true' ? "ml-10" : "ml-0"
            )} />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <div className="flex items-center justify-between px-2">
              <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Expected Restoration Time</label>
              <span className="text-[9px] font-bold text-stone-300 italic">User Facing Message</span>
            </div>
            <input 
              type="text" 
              className="w-full bg-stone-50 border-stone-100 border-2 rounded-[1.5rem] px-8 py-4 text-xl font-black text-stone-900 focus:border-red-500 focus:bg-white outline-none transition-all tracking-tight"
              placeholder="e.g., 2 Hours"
              defaultValue={config.find(c => c.key === 'maintenance_time')?.value}
              onBlur={(e) => updateSetting('maintenance_time', e.target.value)}
            />
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between px-2">
              <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Bypass Clearance Secret</label>
              <span className="text-[9px] font-bold text-stone-300 italic">Dev Overpass</span>
            </div>
            <div className="flex space-x-3">
              <input 
                type="text" 
                className="flex-1 bg-stone-50 border-stone-100 border-2 rounded-[1.5rem] px-8 py-4 text-xl font-mono font-black text-stone-900 focus:border-red-500 focus:bg-white outline-none transition-all tracking-tight text-left"
                defaultValue={config.find(c => c.key === 'maintenance_secret')?.value}
                onBlur={(e) => updateSetting('maintenance_secret', e.target.value)}
              />
              <button 
                onClick={() => {
                  const secret = config.find(c => c.key === 'maintenance_secret')?.value;
                  if (secret) {
                    navigator.clipboard.writeText(secret);
                    toast.success('Clearance token copied');
                  }
                }}
                className="p-5 bg-stone-100 hover:bg-stone-200 rounded-[1.5rem] transition-all group shadow-sm border border-stone-200"
                title="Copy Secret"
              >
                <Copy size={20} className="text-stone-600 group-hover:scale-110 transition-transform" />
              </button>
            </div>
            <p className="px-4 text-[9px] text-stone-400 font-bold uppercase tracking-widest leading-relaxed text-left">
              Append <span className="text-red-500 font-black">?bypass=YOUR_SECRET</span> to the URL to bypass maintenance protocol.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-stone-100 space-y-10">
         <div className="flex items-center space-x-4">
          <div className="w-14 h-14 bg-blue-600 text-white rounded-2xl flex items-center justify-center rotate-6">
            <Server size={28} />
          </div>
          <div>
            <h3 className="text-3xl font-black text-stone-900 tracking-tight text-left">API Interface Gateway</h3>
            <p className="text-stone-400 font-bold uppercase text-[10px] tracking-[0.2em] mt-1 text-left">Third-Party Service Integration Cipher</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div className="space-y-4">
             <div className="flex items-center justify-between px-2">
              <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest">SMS Gateway Access Key</label>
              <span className="text-[10px] font-black px-2 py-0.5 bg-blue-50 text-blue-600 rounded">EXTERNAL</span>
            </div>
            <input 
              type="password" 
              className="w-full bg-stone-50 border-stone-100 border-2 rounded-[1.5rem] px-8 py-4 text-xl font-black text-stone-900 focus:border-blue-500 focus:bg-white outline-none transition-all tracking-widest"
              placeholder="••••••••••••••••"
              onBlur={(e) => updateSetting('sms_api_key', e.target.value)}
            />
          </div>
          
          <div className="space-y-4">
             <div className="flex items-center justify-between px-2">
              <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest font-sans">Payment Provider Ledger Secret</label>
              <span className="text-[10px] font-black px-2 py-0.5 bg-blue-50 text-blue-600 rounded">SECURE</span>
            </div>
            <input 
              type="password" 
              className="w-full bg-stone-50 border-stone-100 border-2 rounded-[1.5rem] px-8 py-4 text-xl font-black text-stone-900 focus:border-blue-500 focus:bg-white outline-none transition-all tracking-widest"
              placeholder="••••••••••••••••"
              onBlur={(e) => updateSetting('payment_secret', e.target.value)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
