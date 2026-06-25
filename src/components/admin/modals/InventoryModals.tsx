import React from 'react';
import ModalContainer from '@/components/ui/ModalContainer';
import ProductImageManager from '@/components/admin/ProductImageManager';
import { Settings, Layers, Trash2, Plus, Loader2, Info, ShoppingCart, Tag, Box, Truck } from 'lucide-react';
import { cn } from '@/types';
import toast from 'react-hot-toast';
import { fetchWithHandling } from '@/lib/api';
import { getAuthHeaders } from '@/lib/utils';
import { triggerFeedback } from '@/lib/feedback';
import InfoButton from '@/components/InfoButton';

interface InventoryModalsProps {
  productModal: { open: boolean; mode: 'add' | 'edit' };
  setProductModal: (modal: any) => void;
  editingProduct: any;
  newProduct: { name: string; description: string; retail_price: string; wholesale_price: string; discount: string; stock: string; reorder_point: string; max_qty: string; batch_number: string; expiry_date: string; category: string; unit: string; is_subscribable: boolean; supplier_id: string; images: string[]; image: string; specifications: Record<string, string>; is_listed: boolean };
  setNewProduct: (product: any) => void;
  newSpec: { key: string; value: string };
  setNewSpec: (spec: any) => void;
  categories: any[];
  suppliers: any[];
  isSubmittingProduct: boolean;
  handleProductSubmit: (e: React.FormEvent) => void;
  
  stockEntryModal: { open: boolean; product: any };
  setStockEntryModal: (modal: any) => void;
  purchaseForm: { supplier_id: string; quantity: string; cost_price: string; invoice_number: string; batch_number: string; expiry_date: string };
  setPurchaseForm: (form: any) => void;
  handleStockEntrySubmit: (e: React.FormEvent) => void;
  
  imageModal: { open: boolean; productId: any; images: string[] };
  setImageModal: (modal: any) => void;
  
  categoryBatchModal: { open: boolean };
  setCategoryBatchModal: (modal: any) => void;
  newBatchCategory: string;
  setNewBatchCategory: (cat: string) => void;
  selectedProducts: any[];
  setProducts: (fn: any) => void;
  
  categoryModal: { open: boolean; mode: 'add' | 'edit'; category?: any };
  setCategoryModal: (modal: any) => void;
  newCategory: { name: string; description?: string; image_url?: string; active?: boolean; is_featured?: boolean };
  setNewCategory: (cat: any) => void;
  handleCategorySubmit: (e: React.FormEvent) => void;
  
  supplierModal: { open: boolean; mode: 'add' | 'edit'; supplier?: any };
  setSupplierModal: (modal: any) => void;
  newSupplier: { name: string; contact_person: string; email?: string; phone: string; address?: string };
  setNewSupplier: (sup: any) => void;
  handleSupplierSubmit: (e: React.FormEvent) => void;
  
  variantModal: { open: boolean; mode: 'add' | 'edit'; variant?: any; productId?: any };
  setVariantModal: (modal: any) => void;
  productVariants: any[];
  setProductVariants: (variants: any[]) => void;
}

export const InventoryModals: React.FC<InventoryModalsProps> = ({
  productModal,
  setProductModal,
  editingProduct,
  newProduct,
  setNewProduct,
  newSpec,
  setNewSpec,
  categories,
  suppliers,
  isSubmittingProduct,
  handleProductSubmit,
  
  stockEntryModal,
  setStockEntryModal,
  purchaseForm,
  setPurchaseForm,
  handleStockEntrySubmit,
  
  imageModal,
  setImageModal,
  
  categoryBatchModal,
  setCategoryBatchModal,
  newBatchCategory,
  setNewBatchCategory,
  selectedProducts,
  setProducts,
  
  categoryModal,
  setCategoryModal,
  newCategory,
  setNewCategory,
  handleCategorySubmit,
  
  supplierModal,
  setSupplierModal,
  newSupplier,
  setNewSupplier,
  handleSupplierSubmit,
  
  variantModal,
  setVariantModal,
  productVariants,
  setProductVariants,
}) => {
  return (
    <>
      {/* Product Modal */}
      <ModalContainer
        isOpen={productModal.open}
        onClose={() => setProductModal({ open: false, mode: 'add' })}
        title={productModal.mode === 'add' ? 'Add New Product' : 'Edit Product'}
        size="full"
      >
        <div className="p-8 pb-10">
          <form 
            onSubmit={(e) => {
              triggerFeedback('medium');
              handleProductSubmit(e);
            }} 
            className="space-y-10 text-left"
          >
            {/* Section 1: Core Identity */}
            <section className="space-y-6">
              <div className="flex items-center gap-3 border-b border-stone-100 pb-4">
                <div className="p-2 bg-stone-900 text-white rounded-xl">
                  <Tag size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-stone-900 uppercase tracking-widest">Product Identity</h3>
                  <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mt-0.5">Basic information and visualization</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Product Designation</label>
                      <InfoButton content="The primary name displayed to customers. Use clear, descriptive labels." />
                    </div>
                    <input 
                      type="text" 
                      required
                      className="w-full bg-stone-50 border-none rounded-2xl px-6 py-4 text-sm font-bold text-stone-800 placeholder-stone-300 focus:ring-2 focus:ring-primary/20 transition-all shadow-inner"
                      placeholder="e.g., Organic Farm Fresh Tomatoes"
                      value={newProduct.name || ''}
                      onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Narrative Description</label>
                      <InfoButton content="Detailed information about product benefits, origins, or usage instructions." />
                    </div>
                    <textarea 
                      required
                      className="w-full bg-stone-50 border-none rounded-2xl px-6 py-4 text-sm font-bold text-stone-800 placeholder-stone-300 focus:ring-2 focus:ring-primary/20 min-h-[140px] transition-all shadow-inner"
                      placeholder="Describe the product details..."
                      value={newProduct.description || ''}
                      onChange={(e) => setNewProduct({...newProduct, description: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest text-left">Visual Assets</label>
                    <InfoButton content="Upload high-quality images. The first image will be used as the primary display thumbnail." />
                  </div>
                  <div className="bg-stone-50 rounded-[2rem] p-4 border border-stone-100 min-h-[220px]">
                    <ProductImageManager 
                      allImages={newProduct.images || []} 
                      primaryImage={newProduct.image || ''} 
                      onUpdate={(allImages, primaryImage) => {
                        setNewProduct({ ...newProduct, images: allImages || [], image: primaryImage || '' });
                      }}
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* Section 2: Economics & Fulfillment */}
            <section className="space-y-6">
              <div className="flex items-center gap-3 border-b border-stone-100 pb-4">
                <div className="p-2 bg-stone-900 text-white rounded-xl">
                  <ShoppingCart size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-stone-900 uppercase tracking-widest">Economics & Logic</h3>
                  <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mt-0.5">Pricing structures and inventory governance</p>
                </div>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                <div>
                  <label className="block text-[10px] font-black text-stone-400 uppercase tracking-widest mb-2 pl-2">Retail Price (₹)</label>
                  <input 
                    type="number" 
                    required
                    className="w-full bg-stone-50 border-none rounded-2xl px-6 py-4 text-sm font-bold text-stone-800 focus:ring-2 focus:ring-primary/20 transition-all"
                    value={newProduct.retail_price || ''}
                    onChange={(e) => setNewProduct({...newProduct, retail_price: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-stone-400 uppercase tracking-widest mb-2 pl-2">Wholesale (₹)</label>
                  <input 
                    type="number" 
                    className="w-full bg-stone-50 border-none rounded-2xl px-6 py-4 text-sm font-bold text-stone-800 focus:ring-2 focus:ring-primary/20 transition-all"
                    value={newProduct.wholesale_price || ''}
                    onChange={(e) => setNewProduct({...newProduct, wholesale_price: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-stone-400 uppercase tracking-widest mb-2 pl-2">Discount (%)</label>
                  <input 
                    type="number" 
                    className="w-full bg-stone-50 border-none rounded-2xl px-6 py-4 text-sm font-bold text-stone-800 focus:ring-2 focus:ring-primary/20 transition-all"
                    value={newProduct.discount || ''}
                    onChange={(e) => setNewProduct({...newProduct, discount: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-stone-400 uppercase tracking-widest mb-2 pl-2">Available Stock</label>
                  <input 
                    type="number" 
                    required
                    className="w-full bg-stone-50 border-none rounded-2xl px-6 py-4 text-sm font-bold text-stone-800 focus:ring-2 focus:ring-primary/20 transition-all"
                    value={newProduct.stock || ''}
                    onChange={(e) => setNewProduct({...newProduct, stock: e.target.value})}
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2 px-2">
                    <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Reorder Pt</label>
                    <InfoButton content="System will trigger an alert when stock drops below this specific value." />
                  </div>
                  <input 
                    type="number" 
                    className="w-full bg-stone-50 border-none rounded-2xl px-6 py-4 text-sm font-bold text-stone-800 focus:ring-2 focus:ring-primary/20 transition-all"
                    value={newProduct.reorder_point || ''}
                    onChange={(e) => setNewProduct({...newProduct, reorder_point: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-stone-400 uppercase tracking-widest mb-2 pl-2">Max Order Limit</label>
                  <input 
                    type="number" 
                    className="w-full bg-stone-50 border-none rounded-2xl px-6 py-4 text-sm font-bold text-stone-800 focus:ring-2 focus:ring-primary/20 transition-all"
                    value={newProduct.max_qty || ''}
                    onChange={(e) => setNewProduct({...newProduct, max_qty: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-stone-400 uppercase tracking-widest mb-2 pl-2">Category Segment</label>
                  <select 
                    className="w-full bg-stone-50 border-none rounded-2xl px-6 py-4 text-sm font-bold text-stone-800 focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer appearance-none"
                    value={newProduct.category || ''}
                    onChange={(e) => setNewProduct({...newProduct, category: e.target.value})}
                  >
                    <option value="">Select Category</option>
                    {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-stone-400 uppercase tracking-widest mb-2 pl-2">Measurement Unit</label>
                  <select 
                    className="w-full bg-stone-50 border-none rounded-2xl px-6 py-4 text-sm font-bold text-stone-800 focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer appearance-none"
                    value={newProduct.unit || 'kg'}
                    onChange={(e) => setNewProduct({...newProduct, unit: e.target.value})}
                  >
                    <option value="kg">kilogram (kg)</option>
                    <option value="gm">gram (gm)</option>
                    <option value="ltr">liter (ltr)</option>
                    <option value="ml">milliliter (ml)</option>
                    <option value="pcs">pieces (pcs)</option>
                    <option value="pkt">packet (pkt)</option>
                    <option value="dozen">dozen</option>
                    <option value="bunch">bunch</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center space-x-3 bg-stone-50 p-6 rounded-3xl border border-stone-100 group cursor-pointer hover:bg-stone-100 transition-all">
                <input 
                  type="checkbox"
                  id="is_subscribable_form"
                  className="w-6 h-6 rounded-lg border-stone-300 text-primary focus:ring-primary transition-all cursor-pointer"
                  checked={newProduct.is_subscribable || false}
                  onChange={(e) => setNewProduct({...newProduct, is_subscribable: e.target.checked})}
                />
                <div className="flex-1">
                  <label htmlFor="is_subscribable_form" className="text-sm font-black text-stone-900 cursor-pointer select-none">Enable Intelligence Subscription</label>
                  <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mt-1">Allows customers to automate recurring deliveries (Daily/Weekly/Monthly)</p>
                </div>
              </div>
            </section>

            {/* Section 3: Metadata & Variants */}
            <section className="space-y-6">
              <div className="flex items-center gap-3 border-b border-stone-100 pb-4">
                <div className="p-2 bg-stone-900 text-white rounded-xl">
                  <Layers size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-stone-900 uppercase tracking-widest">Metadata & Variants</h3>
                  <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mt-0.5">Custom specifications and product variants</p>
                </div>
              </div>

              <div className="p-6 bg-stone-50 rounded-[2rem] space-y-4">
                <div className="flex justify-between items-center mb-2">
                  <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Custom Specifications</label>
                  <InfoButton content="Add custom key-value pairs like Material, Color, Weight, etc." />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input 
                    type="text" 
                    placeholder="Key (e.g. Color)" 
                    className="bg-white border-none rounded-xl px-4 py-2 text-xs font-bold"
                    value={newSpec.key}
                    onChange={(e) => setNewSpec({...newSpec, key: e.target.value})}
                  />
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      placeholder="Value (e.g. Red)" 
                      className="flex-1 bg-white border-none rounded-xl px-4 py-2 text-xs font-bold"
                      value={newSpec.value}
                      onChange={(e) => setNewSpec({...newSpec, value: e.target.value})}
                    />
                    <button 
                      type="button"
                      onClick={() => {
                        if (newSpec.key && newSpec.value) {
                          setNewProduct({
                            ...newProduct,
                            specifications: { ...newProduct.specifications, [newSpec.key]: newSpec.value }
                          });
                          setNewSpec({ key: '', value: '' });
                        }
                      }}
                      className="p-2 bg-primary text-white rounded-xl hover:bg-primary/90"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {Object.entries(newProduct.specifications || {}).map(([key, value]) => (
                    <div key={key} className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-stone-100 shadow-sm text-[10px]">
                      <span className="font-black text-stone-400 uppercase">{key}:</span>
                      <span className="font-bold text-stone-900">{value as string}</span>
                      <button 
                        type="button"
                        onClick={() => {
                          const next = { ...newProduct.specifications };
                          delete next[key];
                          setNewProduct({ ...newProduct, specifications: next });
                        }}
                        className="ml-1 text-stone-300 hover:text-red-500"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {productModal.mode === 'edit' && editingProduct && (
                <div className="p-6 bg-stone-50 rounded-[2rem] space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Dynamic Variants</label>
                      <p className="text-[10px] font-bold text-stone-400 mt-0.5 italic">Manage SKU variations and specific pricing.</p>
                    </div>
                    <button 
                      type="button"
                      onClick={() => setVariantModal({ open: true, mode: 'edit', variant: null, productId: editingProduct.id })}
                      className="px-4 py-2 bg-stone-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all"
                    >
                      Configure Variants
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {productVariants.length > 0 ? (
                      productVariants.map((v) => (
                        <div key={v.id || v.name} className="bg-white border border-stone-200 px-4 py-2 rounded-xl text-[10px] font-bold shadow-sm">
                          {v.name} • ₹{v.price}
                        </div>
                      ))
                    ) : (
                      <p className="text-[10px] text-stone-400 font-bold italic py-4 w-full text-center">No active variants detected.</p>
                    )}
                  </div>
                </div>
              )}
            </section>

            {/* Supply Chain */}
            <section className="space-y-6">
              <div className="flex items-center gap-3 border-b border-stone-100 pb-4">
                <div className="p-2 bg-stone-900 text-white rounded-xl">
                  <Truck size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-stone-900 uppercase tracking-widest">Supply Chain & Governance</h3>
                  <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mt-0.5">Origin details and batch identifiers</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-[10px] font-black text-stone-400 uppercase tracking-widest mb-2">Linked Trade Partner</label>
                  <select 
                    className="w-full bg-stone-50 border-none rounded-2xl px-6 py-4 text-sm font-bold"
                    value={newProduct.supplier_id || ''}
                    onChange={(e) => setNewProduct({...newProduct, supplier_id: e.target.value})}
                  >
                    <option value="">Independent Product</option>
                    {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-stone-400 uppercase tracking-widest mb-2">Batch Identifier</label>
                  <input type="text" className="w-full bg-stone-50 border-none rounded-2xl px-6 py-4 text-sm font-bold" placeholder="e.g. B-0123" value={newProduct.batch_number || ''} onChange={(e) => setNewProduct({...newProduct, batch_number: e.target.value})} />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-stone-400 uppercase tracking-widest mb-2">Governance Expiry</label>
                  <input type="date" className="w-full bg-stone-50 border-none rounded-2xl px-6 py-4 text-sm font-bold" value={newProduct.expiry_date || ''} onChange={(e) => setNewProduct({...newProduct, expiry_date: e.target.value})} />
                </div>
              </div>
            </section>

            <div className="pt-10 flex gap-4">
              <button 
                type="button" 
                onClick={() => setProductModal({ open: false, mode: 'add' })} 
                className="flex-1 py-5 bg-stone-100 text-stone-600 rounded-[2rem] font-black uppercase tracking-widest hover:bg-stone-200 transition-all active:scale-95"
              >
                Discard
              </button>
              <button 
                type="submit" 
                disabled={isSubmittingProduct} 
                className="flex-[2] py-5 bg-stone-900 text-white rounded-[2rem] font-black uppercase tracking-widest shadow-2xl hover:bg-black transition-all disabled:opacity-50 flex items-center justify-center gap-3 active:scale-95"
              >
                {isSubmittingProduct ? <Loader2 size={20} className="animate-spin" /> : <span>Commit Changes</span>}
              </button>
            </div>
          </form>
        </div>
      </ModalContainer>

      {/* Purchase / Stock Entry Modal */}
      <ModalContainer
        isOpen={stockEntryModal.open}
        onClose={() => setStockEntryModal({ open: false, product: null })}
        title="New Stock Entry"
        size="md"
      >
        <div className="p-8 pb-10">
          <form 
            onSubmit={(e) => {
              triggerFeedback('medium');
              handleStockEntrySubmit(e);
            }} 
            className="space-y-4"
          >
            <div className="bg-stone-50 p-4 rounded-2xl flex items-center space-x-4 mb-4">
              <div className="w-12 h-12 bg-white rounded-xl border border-stone-100 overflow-hidden shrink-0">
                <img src={stockEntryModal.product?.image_url} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              </div>
              <div>
                <p className="font-bold text-stone-900">{stockEntryModal.product?.name}</p>
                <p className="text-xs text-stone-400">Current Stock: {stockEntryModal.product?.stock} {stockEntryModal.product?.unit}</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-stone-700 mb-2">Supplier</label>
              <select 
                required
                className="w-full bg-stone-50 rounded-xl px-4 py-3 text-sm font-bold text-stone-800 focus:outline-none focus:ring-2 focus:ring-primary/20"
                value={purchaseForm.supplier_id}
                onChange={(e) => setPurchaseForm({...purchaseForm, supplier_id: e.target.value})}
              >
                <option value="">Select Supplier</option>
                {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-stone-700 mb-2">Quantity Added</label>
                <input 
                  type="number" 
                  required
                  min="1"
                  className="w-full bg-stone-50 rounded-xl px-4 py-3 text-sm font-bold text-stone-800 placeholder-stone-300 focus:outline-none focus:ring-2 focus:ring-primary/20"
                  value={purchaseForm.quantity}
                  onChange={(e) => setPurchaseForm({...purchaseForm, quantity: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-stone-700 mb-2">Unit Cost (₹)</label>
                <input 
                  type="number" 
                  required
                  min="0"
                  step="0.01"
                  className="w-full bg-stone-50 rounded-xl px-4 py-3 text-sm font-bold text-stone-800 placeholder-stone-300 focus:outline-none focus:ring-2 focus:ring-primary/20"
                  value={purchaseForm.cost_price}
                  onChange={(e) => setPurchaseForm({...purchaseForm, cost_price: e.target.value})}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-stone-700 mb-2">Supplier Invoice #</label>
              <input 
                type="text" 
                className="w-full bg-stone-50 rounded-xl px-4 py-3 text-sm font-bold text-stone-800 placeholder-stone-300 focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="e.g. INV-2024-001"
                value={purchaseForm.invoice_number}
                onChange={(e) => setPurchaseForm({...purchaseForm, invoice_number: e.target.value})}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-stone-700 mb-2">Batch Number</label>
                <input 
                  type="text" 
                  className="w-full bg-stone-50 rounded-xl px-4 py-3 text-sm font-bold text-stone-800 placeholder-stone-300 focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="Batch ID"
                  value={purchaseForm.batch_number}
                  onChange={(e) => setPurchaseForm({...purchaseForm, batch_number: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-stone-700 mb-2">Expiry Date</label>
                <input 
                  type="date" 
                  className="w-full bg-stone-50 rounded-xl px-4 py-3 text-sm font-bold text-stone-800 focus:outline-none focus:ring-2 focus:ring-primary/20"
                  value={purchaseForm.expiry_date}
                  onChange={(e) => setPurchaseForm({...purchaseForm, expiry_date: e.target.value})}
                />
              </div>
            </div>

            <div className="pt-4 flex space-x-3">
              <button 
                type="button"
                onClick={() => setStockEntryModal({ open: false, product: null })}
                className="flex-1 py-3 border border-stone-200 rounded-xl font-bold hover:bg-stone-50"
              >
                Cancel
              </button>
              <button 
                type="submit"
                className="flex-1 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary/95 shadow-lg shadow-primary/20"
              >
                Confirm Entry
              </button>
            </div>
          </form>
        </div>
      </ModalContainer>

      {/* Image Management Modal */}
      <ModalContainer
        isOpen={imageModal.open}
        onClose={() => setImageModal({ ...imageModal, open: false })}
        title="Manage Product Images"
        size="lg"
      >
        <div className="p-8 pb-10 flex flex-col max-h-[80vh] overflow-hidden">
          <p className="text-stone-500 text-sm mb-6">Upload, reorder, and set main image</p>

          <div className="flex-1 overflow-y-auto pr-2 no-scrollbar">
            <ProductImageManager 
              allImages={imageModal.images} 
              primaryImage={newProduct.image} 
              onUpdate={(allImages, primaryImage) => {
                setNewProduct({ ...newProduct, images: allImages, image: primaryImage });
                setImageModal({ ...imageModal, images: allImages }); 
              }}
            />
          </div>

          <div className="mt-8 pt-6 border-t border-stone-100">
            <button 
              onClick={() => setImageModal({ ...imageModal, open: false })}
              className="w-full py-4 bg-primary text-white rounded-2xl font-bold hover:bg-primary/95 shadow-lg shadow-primary/20 transition-all"
            >
              Done Managing Images
            </button>
          </div>
        </div>
      </ModalContainer>

      {/* Category Batch Update Modal */}
      <ModalContainer
        isOpen={categoryBatchModal.open}
        onClose={() => {
          setCategoryBatchModal({ open: false });
          setNewBatchCategory('');
        }}
        title="Change Category"
        size="sm"
      >
        <div className="p-8 pb-10">
          <p className="text-sm text-stone-500 mb-6">
            Update category for {selectedProducts.length} selected products.
          </p>
          
          <select 
            className="w-full bg-stone-50 rounded-xl px-4 py-3 text-sm font-bold text-stone-800 focus:outline-none focus:ring-2 focus:ring-primary/20 mb-6"
            value={newBatchCategory}
            onChange={(e) => setNewBatchCategory(e.target.value)}
          >
            <option value="">Select Category</option>
            {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
          </select>

          <div className="flex space-x-3">
            <button 
              onClick={() => {
                setCategoryBatchModal({ open: false });
                setNewBatchCategory('');
              }}
              className="flex-1 py-3 border border-stone-200 rounded-xl font-bold hover:bg-stone-50"
            >
              Cancel
            </button>
            <button 
              onClick={async () => {
                if (!newBatchCategory) return toast.error('Please select a category');
                try {
                  const data = await fetchWithHandling<any>('/api/admin/products/batch-category', {
                    method: 'PUT',
                    headers: getAuthHeaders(),
                    body: JSON.stringify({
                      product_ids: selectedProducts,
                      category: newBatchCategory
                    })
                  });
                  if (data) {
                    toast.success('Category updated successfully');
                    setProducts((prev: any[]) => prev.map(p => 
                      selectedProducts.includes(p.id) ? { ...p, category: newBatchCategory } : p
                    ));
                    setCategoryBatchModal({ open: false });
                    setNewBatchCategory('');
                  }
                } catch (err) {
                  console.error('Batch Category Update Error:', err);
                }
              }}
              className="flex-1 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary/95"
            >
              Update
            </button>
          </div>
        </div>
      </ModalContainer>

      {/* Category Modal */}
      <ModalContainer
        isOpen={categoryModal.open}
        onClose={() => setCategoryModal({ open: false, mode: 'add' })}
        title={categoryModal.mode === 'add' ? 'Add Category' : 'Edit Category'}
        size="sm"
      >
        <div className="p-8 pb-10">
          <form 
            onSubmit={(e) => {
              triggerFeedback('medium');
              handleCategorySubmit(e);
            }} 
            className="space-y-4"
          >
            <div>
              <label className="block text-sm font-bold text-stone-700 mb-2">Category Name</label>
              <input 
                type="text" 
                required
                className="w-full bg-stone-50 rounded-xl px-4 py-3 text-sm font-bold text-stone-800 placeholder-stone-300 focus:outline-none focus:ring-2 focus:ring-primary/20"
                value={newCategory.name}
                onChange={(e) => setNewCategory({...newCategory, name: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-stone-700 mb-2">Description</label>
              <textarea 
                className="w-full bg-stone-50 rounded-xl px-4 py-3 text-sm font-bold text-stone-800 placeholder-stone-300 focus:outline-none focus:ring-2 focus:ring-primary/20 min-h-[80px]"
                value={newCategory.description}
                onChange={(e) => setNewCategory({...newCategory, description: e.target.value})}
              />
            </div>
            <div className="flex space-x-3 pt-4">
              <button 
                type="button"
                onClick={() => setCategoryModal({ open: false, mode: 'add' })}
                className="flex-1 py-3 border border-stone-200 rounded-xl font-bold hover:bg-stone-50"
              >
                Cancel
              </button>
              <button 
                type="submit"
                className="flex-1 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary/95"
              >
                {categoryModal.mode === 'add' ? 'Add' : 'Save'}
              </button>
            </div>
          </form>
        </div>
      </ModalContainer>

      {/* Supplier Modal */}
      <ModalContainer
        isOpen={supplierModal.open}
        onClose={() => setSupplierModal({ open: false, mode: 'add', supplier: null })}
        title={supplierModal.mode === 'add' ? 'Add Supplier' : 'Edit Supplier'}
        size="md"
      >
        <div className="p-8 pb-10">
          <form 
            onSubmit={(e) => {
              triggerFeedback('medium');
              handleSupplierSubmit(e);
            }} 
            className="space-y-4"
          >
            <div>
              <label className="block text-sm font-bold text-stone-700 mb-2">Supplier Name</label>
              <input 
                type="text" 
                required
                className="w-full bg-stone-50 rounded-xl px-4 py-3 text-sm font-bold text-stone-800 focus:outline-none focus:ring-2 focus:ring-primary/20"
                value={newSupplier.name}
                onChange={(e) => setNewSupplier({...newSupplier, name: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-stone-700 mb-2">Contact Person</label>
              <input 
                type="text" 
                required
                className="w-full bg-stone-50 rounded-xl px-4 py-3 text-sm font-bold text-stone-800 focus:outline-none focus:ring-2 focus:ring-primary/20"
                value={newSupplier.contact_person}
                onChange={(e) => setNewSupplier({...newSupplier, contact_person: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-stone-700 mb-2">Email</label>
              <input 
                type="email" 
                className="w-full bg-stone-50 rounded-xl px-4 py-3 text-sm font-bold text-stone-800 focus:outline-none focus:ring-2 focus:ring-primary/20"
                value={newSupplier.email}
                onChange={(e) => setNewSupplier({...newSupplier, email: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-stone-700 mb-2">Phone</label>
              <input 
                type="text" 
                required
                className="w-full bg-stone-50 rounded-xl px-4 py-3 text-sm font-bold text-stone-800 focus:outline-none focus:ring-2 focus:ring-primary/20"
                value={newSupplier.phone}
                onChange={(e) => setNewSupplier({...newSupplier, phone: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-stone-700 mb-2">Address</label>
              <textarea 
                className="w-full bg-stone-50 rounded-xl px-4 py-3 text-sm font-bold text-stone-800 focus:outline-none focus:ring-2 focus:ring-primary/20 h-24"
                value={newSupplier.address}
                onChange={(e) => setNewSupplier({...newSupplier, address: e.target.value})}
              />
            </div>
            <div className="flex space-x-3 pt-4">
              <button 
                type="button"
                onClick={() => setSupplierModal({ open: false, mode: 'add', supplier: null })}
                className="flex-1 py-3 border border-stone-200 rounded-xl font-bold hover:bg-stone-50"
              >
                Cancel
              </button>
              <button 
                type="submit"
                className="flex-1 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary/95"
              >
                Save
              </button>
            </div>
          </form>
        </div>
      </ModalContainer>

      {/* Variant Modal */}
      <ModalContainer
        isOpen={variantModal.open}
        onClose={() => setVariantModal({ open: false, mode: 'add' })}
        title="Manage Variants"
        size="xl"
        showHeader={true}
      >
        <div className="p-8 pb-10">
          <p className="text-sm text-stone-500 font-medium tracking-wide mb-8 select-none">Configure distinct pricing, stock, and multiple options for this product.</p>

          <div className="flex-1 overflow-y-auto pr-2 -mr-2 space-y-4 rounded-xl max-h-[50vh]">
            {productVariants.length === 0 ? (
              <div className="text-center py-16 bg-stone-50 rounded-[24px] border-2 border-dashed border-stone-200">
                <Layers size={48} className="mx-auto text-stone-300 mb-4" />
                <p className="text-stone-500 font-bold mb-2">No variants created</p>
                <p className="text-xs text-stone-400 max-w-sm mx-auto">Add a variant to configure specific pricing or independent stock counts for different sizes, colors, or bundles.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-5">
                {productVariants.map((v, i) => (
                  <div key={i} className="group p-5 bg-white rounded-2xl border border-stone-200 shadow-sm hover:border-primary/30 transition-all focus-within:border-primary/50 focus-within:ring-4 focus-within:ring-primary/5 relative">
                    <div className="flex flex-row sm:absolute sm:top-5 sm:right-5 mb-4 sm:mb-0 justify-between sm:justify-end items-center sm:space-x-4">
                       <label className="flex items-center space-x-2 cursor-pointer group/cb">
                         <input 
                           type="checkbox" 
                           checked={v.is_default === 1 || v.is_default === true}
                           onChange={(e) => {
                             const newVariants = productVariants.map((varnt, idx) => ({
                               ...varnt,
                               is_default: idx === i ? 1 : 0
                             }));
                             setProductVariants(newVariants);
                           }}
                           className="w-4 h-4 text-primary rounded ring-0 focus:ring-0 focus:outline-none border-stone-300 cursor-pointer" 
                         />
                         <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider group-hover/cb:text-stone-700 transition-colors">Default Variant</span>
                       </label>
                       <button 
                         onClick={() => {
                           const newVariants = productVariants.filter((_, idx) => idx !== i);
                           setProductVariants(newVariants);
                         }}
                         className="p-2 text-stone-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all ml-2 sm:ml-0"
                       >
                         <Trash2 size={16} className="stroke-[2.5]" />
                       </button>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-0 sm:mt-8">
                       <div>
                          <label className="block text-[10px] uppercase font-bold tracking-wider text-stone-400 mb-2 pl-1">Variant Name</label>
                          <input 
                            type="text" 
                            placeholder="e.g. 500g, Red, Combo" 
                            className="w-full bg-stone-50 border-none rounded-xl px-4 py-3 text-sm font-bold text-stone-800 placeholder-stone-300 focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all shadow-inner shadow-stone-100" 
                            value={v.name}
                            onChange={(e) => {
                              const newVariants = [...productVariants];
                              newVariants[i].name = e.target.value;
                              setProductVariants(newVariants);
                            }}
                          />
                       </div>
                       <div>
                          <label className="block text-[10px] uppercase font-bold tracking-wider text-stone-400 mb-2 pl-1">Price (₹)</label>
                          <input 
                            type="number" 
                            placeholder="0.00"
                            className="w-full bg-stone-50 border-none rounded-xl px-4 py-3 text-sm font-bold text-stone-800 placeholder-stone-300 focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all shadow-inner shadow-stone-100" 
                            value={v.price}
                            onChange={(e) => {
                              const newVariants = [...productVariants];
                              newVariants[i].price = e.target.value;
                              setProductVariants(newVariants);
                            }}
                          />
                       </div>
                       <div>
                          <label className="block text-[10px] uppercase font-bold tracking-wider text-stone-400 mb-2 pl-1">Unit Qty <span className="lowercase text-stone-300 font-medium">(multiplier)</span></label>
                          <input 
                            type="number" 
                            placeholder="1"
                            className="w-full bg-stone-50 border-none rounded-xl px-4 py-3 text-sm font-bold text-stone-800 placeholder-stone-300 focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all shadow-inner shadow-stone-100" 
                            value={v.unit_quantity}
                            onChange={(e) => {
                              const newVariants = [...productVariants];
                              newVariants[i].unit_quantity = parseInt(e.target.value) || 1;
                              setProductVariants(newVariants);
                            }}
                          />
                       </div>
                       <div>
                          <label className="block text-[10px] uppercase font-bold tracking-wider text-stone-400 mb-2 pl-1">Available Stock</label>
                          <input 
                            type="number" 
                            placeholder="0"
                            className="w-full bg-stone-50 border-none rounded-xl px-4 py-3 text-sm font-bold text-stone-800 placeholder-stone-300 focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all shadow-inner shadow-stone-100" 
                            value={v.stock}
                            onChange={(e) => {
                              const newVariants = [...productVariants];
                              newVariants[i].stock = e.target.value;
                              setProductVariants(newVariants);
                            }}
                          />
                       </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <button 
              onClick={() => {
                triggerFeedback('light');
                setProductVariants([...productVariants, { name: '', price: '', stock: '', unit_quantity: 1, is_default: productVariants.length === 0 ? 1 : 0 }]);
              }}
              className="w-full py-5 border-2 border-dashed border-stone-200 rounded-[20px] text-stone-400 hover:border-primary/50 hover:text-primary hover:bg-primary/5 transition-all font-bold text-sm flex items-center justify-center space-x-2 group mt-6"
            >
              <Plus size={18} className="transition-transform group-hover:scale-110 group-hover:rotate-90 duration-300" />
              <span>Add Variant Option</span>
            </button>
          </div>

          <div className="mt-8 pt-6 border-t border-stone-100 flex space-x-4 shrink-0">
            <button 
              onClick={() => setVariantModal({ ...variantModal, open: false })}
              className="flex-1 py-4 bg-stone-100 text-stone-600 rounded-2xl font-bold hover:bg-stone-200 transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={async () => {
                triggerFeedback('medium');
                try {
                  const data = await fetchWithHandling<any>(`/api/admin/products/${variantModal.productId}/variants`, {
                    method: 'POST',
                    headers: getAuthHeaders(),
                    body: JSON.stringify({ variants: productVariants })
                  });
                  if (data) {
                    toast.success('Variants fully updated');
                    setVariantModal({ ...variantModal, open: false });
                  }
                } catch (err) {
                  console.error('Update variants error:', err);
                }
              }}
              className="flex-[2] py-4 bg-stone-900 text-white rounded-2xl font-bold hover:bg-stone-800 transition-colors shadow-xl shadow-stone-250"
            >
              Save All Variants
            </button>
          </div>
        </div>
      </ModalContainer>
    </>
  );
};
