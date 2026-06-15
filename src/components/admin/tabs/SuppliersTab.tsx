import React from 'react';
import { motion } from 'motion/react';
import { Briefcase, Plus, Mail, Phone, Truck, Settings as SettingsIcon, Trash2 } from 'lucide-react';

interface SuppliersTabProps {
  suppliers: any[];
  setSupplierModal: (modal: { open: boolean; mode: 'add' | 'edit'; supplier: any }) => void;
  setNewSupplier: (supplier: {
    name: string;
    contact_person: string;
    email: string;
    phone: string;
    address: string;
  }) => void;
  handleDeleteSupplier: (id: number) => void;
}

export default function SuppliersTab({
  suppliers,
  setSupplierModal,
  setNewSupplier,
  handleDeleteSupplier,
}: SuppliersTabProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="max-w-full overflow-x-hidden space-y-8 font-sans pb-10 pr-2"
    >
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 font-sans">
        <div className="space-y-1">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary rotate-3">
              <Briefcase size={24} />
            </div>
            <h2 className="text-4xl font-black text-stone-900 tracking-tight text-left">Supply Chain Hub</h2>
          </div>
          <p className="text-stone-500 font-medium text-lg ml-1 text-left">Coordinate with global and local trade partners.</p>
        </div>
        
        <button 
          onClick={() => {
            setSupplierModal({ open: true, mode: 'add', supplier: null });
            setNewSupplier({ name: '', contact_person: '', email: '', phone: '', address: '' });
          }}
          className="bg-primary text-white px-8 py-4 rounded-2xl font-black flex items-center space-x-3 shadow-xl shadow-primary/20 hover:bg-primary/90 transition-all active:scale-95 whitespace-nowrap group text-sm"
        >
          <Plus size={20} className="group-hover:rotate-90 transition-transform duration-300" />
          <span>Onboard Supplier</span>
        </button>
      </div>
      
      <div className="bg-white rounded-[2.5rem] shadow-sm border border-stone-100 overflow-hidden font-sans">
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left font-sans">
            <thead className="bg-stone-50/50 text-stone-400 text-[10px] uppercase font-black tracking-widest">
              <tr>
                <th className="px-8 py-6">Partner Identity</th>
                <th className="px-6 py-6">Key Liaison</th>
                <th className="px-6 py-6">Communication Channels</th>
                <th className="px-6 py-6">Location</th>
                <th className="px-6 py-6">Partnership Since</th>
                <th className="px-8 py-6 text-right">Governance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100/50">
              {suppliers.map((supplier, idx) => (
                <motion.tr 
                  key={supplier.id} 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="hover:bg-stone-50/50 transition-all duration-300 group animate-in"
                >
                  <td className="px-8 py-6">
                     <div className="flex items-center space-x-3">
                       <div className="w-10 h-10 bg-stone-100 rounded-xl flex items-center justify-center text-stone-400 font-black group-hover:bg-primary group-hover:text-white transition-all transform group-hover:rotate-6">
                         {supplier.name?.[0] || 'S'}
                       </div>
                       <span className="font-black text-sm text-stone-900 tracking-tight text-left">{supplier.name}</span>
                     </div>
                  </td>
                  <td className="px-6 py-6">
                    <span className="text-sm font-bold text-stone-700 text-left block">{supplier.contact_person}</span>
                  </td>
                  <td className="px-6 py-6">
                    <div className="flex flex-col space-y-0.5 items-start">
                      <div className="flex items-center space-x-2 text-xs font-bold text-stone-500">
                        <Mail size={12} className="text-stone-300 shrink-0" />
                        <span>{supplier.email || 'N/A'}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-xs font-bold text-stone-500">
                        <Phone size={12} className="text-stone-300 shrink-0" />
                        <span>{supplier.phone || 'N/A'}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-6">
                    <div className="flex items-center gap-2 max-w-[200px]">
                      <div className="min-w-fit"><Truck size={14} className="text-stone-300" /></div>
                      <span className="text-xs font-medium text-stone-500 truncate" title={supplier.address}>{supplier.address}</span>
                    </div>
                  </td>
                  <td className="px-6 py-6 font-mono text-[10px] text-stone-400 uppercase font-black tracking-widest text-left">
                    {new Date(supplier.created_at).toLocaleDateString('en-IN', { month: 'short', year: 'numeric', day: 'numeric' })}
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <motion.button 
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => {
                          setSupplierModal({ open: true, mode: 'edit', supplier });
                          setNewSupplier({
                            name: supplier.name,
                            contact_person: supplier.contact_person,
                            email: supplier.email,
                            phone: supplier.phone,
                            address: supplier.address
                          });
                        }}
                        className="p-2.5 bg-stone-50 text-stone-400 hover:text-primary hover:bg-white hover:shadow-md border border-transparent rounded-xl transition-all"
                      >
                        <SettingsIcon size={18} />
                      </motion.button>
                      <motion.button 
                        whileHover={{ scale: 1.1, color: '#ef4444' }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleDeleteSupplier(supplier.id)}
                        className="p-2.5 bg-stone-50 text-stone-400 hover:bg-red-50 hover:shadow-md border border-transparent rounded-xl transition-all"
                      >
                        <Trash2 size={18} />
                      </motion.button>
                    </div>
                  </td>
                </motion.tr>
              ))}
              {suppliers.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-8 py-20 text-center">
                    <div className="w-20 h-20 bg-stone-50 rounded-full flex items-center justify-center mx-auto mb-6 pointer-events-none">
                      <Briefcase size={40} className="text-stone-200" />
                    </div>
                    <p className="text-stone-400 font-black uppercase tracking-widest text-xs">No active trade partners</p>
                    <p className="text-[10px] text-stone-400 font-medium mt-1">Start by onboarding your first supplier.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
}
