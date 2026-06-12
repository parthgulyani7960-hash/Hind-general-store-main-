import React from 'react';
import ModalContainer from '@/components/ui/ModalContainer';
import { Send, Upload } from 'lucide-react';
import { cn, PromotionRule } from '@/types';
import toast from 'react-hot-toast';
import { fetchWithHandling } from '@/lib/api';
import { getAuthHeaders } from '@/lib/utils';

interface MarketingModalsProps {
  bulkDiscountModal: { open: boolean; mode: 'add' | 'edit'; discount: any };
  setBulkDiscountModal: (modal: any) => void;
  newBulkDiscount: { entity_type: 'product' | 'category'; entity_id: string; min_qty: string; discount_type: 'percentage' | 'flat'; discount_value: string; active: boolean };
  setNewBulkDiscount: (discount: any) => void;
  handleBulkDiscountSubmit: (e: React.FormEvent) => void;
  allProducts: any[];
  categories: any[];
  
  couponModal: { open: boolean; mode: 'add' | 'edit'; editingId?: number | string };
  setCouponModal: (modal: any) => void;
  newCoupon: { code: string; type: string; value: string; min_order: string; limit_per_user: string; expiry_date?: string };
  setNewCoupon: (coupon: any) => void;
  handleAddCoupon: (e: React.FormEvent) => void;
  
  promotionRuleFormModal: { open: boolean; mode: 'add' | 'edit'; rule: PromotionRule | null };
  setPromotionRuleFormModal: (modal: any) => void;
  newPromotionRuleData: Partial<PromotionRule>;
  setNewPromotionRuleData: (data: any) => void;
  handlePromotionRuleSubmit: (e: React.FormEvent) => void;
  
  promotionModal: { open: boolean; mode: 'add' | 'edit'; id?: any };
  setPromotionModal: (modal: any) => void;
  newPromotion: { title: string; description: string; image_url: string; link: string; active: boolean; target_role: string; start_time: string; end_time: string; banner_type: string; is_default: boolean };
  setNewPromotion: (promo: any) => void;
  handlePromotionSubmit: (e: React.FormEvent) => void;
  
  promotionProductsModal: { open: boolean; promotionId: number | null };
  setPromotionProductsModal: (modal: any) => void;
  linkedProductIds: number[];
  setLinkedProductIds: (ids: any) => void;
  
  notificationModal: { open: boolean };
  setNotificationModal: (modal: { open: boolean }) => void;
  newNotification: { title: string; message: string; type: string; priority: string; target_role: string; expires_at: string };
  setNewNotification: (notif: any) => void;
  handleNotificationSubmit: (e: React.FormEvent) => void;
}

export const MarketingModals: React.FC<MarketingModalsProps> = ({
  bulkDiscountModal,
  setBulkDiscountModal,
  newBulkDiscount,
  setNewBulkDiscount,
  handleBulkDiscountSubmit,
  allProducts,
  categories,
  
  couponModal,
  setCouponModal,
  newCoupon,
  setNewCoupon,
  handleAddCoupon,
  
  promotionRuleFormModal,
  setPromotionRuleFormModal,
  newPromotionRuleData,
  setNewPromotionRuleData,
  handlePromotionRuleSubmit,
  
  promotionModal,
  setPromotionModal,
  newPromotion,
  setNewPromotion,
  handlePromotionSubmit,
  
  promotionProductsModal,
  setPromotionProductsModal,
  linkedProductIds,
  setLinkedProductIds,
  
  notificationModal,
  setNotificationModal,
  newNotification,
  setNewNotification,
  handleNotificationSubmit,
}) => {
  return (
    <>
      {/* Bulk Discount Modal */}
      <ModalContainer
        isOpen={bulkDiscountModal.open}
        onClose={() => setBulkDiscountModal({ open: false, mode: 'add', discount: null })}
        title={bulkDiscountModal.mode === 'add' ? 'Create Bulk Discount' : 'Edit Bulk Discount'}
        size="md"
      >
        <div className="p-8 pb-10">
          <form onSubmit={handleBulkDiscountSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-stone-700 mb-2">Discount Type</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setNewBulkDiscount({ ...newBulkDiscount, entity_type: 'product', entity_id: '' })}
                  className={cn(
                    "py-2 rounded-xl text-sm font-bold border transition-all",
                    newBulkDiscount.entity_type === 'product' ? "bg-primary/10 border-primary text-primary" : "border-stone-200 text-stone-400 hover:bg-stone-50"
                  )}
                >
                  Product Based
                </button>
                <button
                  type="button"
                  onClick={() => setNewBulkDiscount({ ...newBulkDiscount, entity_type: 'category', entity_id: '' })}
                  className={cn(
                    "py-2 rounded-xl text-sm font-bold border transition-all",
                    newBulkDiscount.entity_type === 'category' ? "bg-primary/10 border-primary text-primary" : "border-stone-200 text-stone-400 hover:bg-stone-50"
                  )}
                >
                  Category Based
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-stone-700 mb-2">
                Select {newBulkDiscount.entity_type === 'product' ? 'Product' : 'Category'}
              </label>
              <select
                required
                className="w-full bg-stone-50 rounded-xl px-4 py-3 text-sm font-bold text-stone-800 focus:outline-none focus:ring-2 focus:ring-primary/20"
                value={newBulkDiscount.entity_id}
                onChange={(e) => setNewBulkDiscount({ ...newBulkDiscount, entity_id: e.target.value })}
              >
                <option value="">Select Target</option>
                {newBulkDiscount.entity_type === 'product' ? (
                  allProducts.map(p => <option key={p.id} value={p.id}>{p.name}</option>)
                ) : (
                  categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)
                )}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-stone-700 mb-2">Min. Quantity</label>
                <input
                  type="number"
                  required
                  min="1"
                  className="w-full bg-stone-50 rounded-xl px-4 py-3 text-sm font-bold text-stone-800 placeholder-stone-300 focus:outline-none focus:ring-2 focus:ring-primary/20"
                  value={newBulkDiscount.min_qty}
                  onChange={(e) => setNewBulkDiscount({ ...newBulkDiscount, min_qty: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-stone-700 mb-2">Discount Type</label>
                <select
                  className="w-full bg-stone-50 rounded-xl px-4 py-3 text-sm font-bold text-stone-800 focus:outline-none focus:ring-2 focus:ring-primary/20"
                  value={newBulkDiscount.discount_type}
                  onChange={(e) => setNewBulkDiscount({ ...newBulkDiscount, discount_type: e.target.value as any })}
                >
                  <option value="percentage">Percentage (%)</option>
                  <option value="flat">Flat Amount (₹)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-stone-700 mb-2">Discount Value</label>
              <input
                type="number"
                required
                min="0"
                className="w-full bg-stone-50 rounded-xl px-4 py-3 text-sm font-bold text-stone-800 placeholder-stone-300 focus:outline-none focus:ring-2 focus:ring-primary/20"
                value={newBulkDiscount.discount_value}
                onChange={(e) => setNewBulkDiscount({ ...newBulkDiscount, discount_value: e.target.value })}
              />
            </div>

            <div className="flex items-center space-x-3 p-4 bg-stone-50 rounded-2xl">
              <input 
                type="checkbox" 
                id="bd_active"
                className="w-5 h-5 rounded border-stone-300 text-primary focus:ring-primary"
                checked={newBulkDiscount.active}
                onChange={(e) => setNewBulkDiscount({...newBulkDiscount, active: e.target.checked})}
              />
              <label htmlFor="bd_active" className="text-sm font-bold text-stone-700">Active Discount</label>
            </div>

            <div className="flex space-x-3 pt-4">
              <button 
                type="button"
                onClick={() => setBulkDiscountModal({ open: false, mode: 'add', discount: null })}
                className="flex-1 py-3 border border-stone-200 rounded-xl font-bold hover:bg-stone-50"
              >
                Cancel
              </button>
              <button 
                type="submit"
                className="flex-1 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary/90"
              >
                {bulkDiscountModal.mode === 'add' ? 'Create' : 'Update'}
              </button>
            </div>
          </form>
        </div>
      </ModalContainer>

      {/* Coupon Modal */}
      <ModalContainer
        isOpen={couponModal.open}
        onClose={() => setCouponModal({ open: false, mode: 'add' })}
        title={couponModal.mode === 'edit' ? 'Update Coupon' : 'Create Coupon'}
        size="md"
      >
        <div className="p-8 pb-10">
          <form onSubmit={handleAddCoupon} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-stone-700 mb-2">Coupon Code</label>
              <input 
                type="text" 
                required
                className="w-full bg-stone-50 rounded-xl px-4 py-3 text-sm font-bold text-stone-800 placeholder-stone-350 focus:outline-none focus:ring-2 focus:ring-primary/20 uppercase font-mono"
                placeholder="WELCOME10"
                value={newCoupon.code}
                onChange={(e) => setNewCoupon({...newCoupon, code: e.target.value.toUpperCase()})}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-stone-700 mb-2">Type</label>
                <select 
                  className="w-full bg-stone-50 rounded-xl px-4 py-3 text-sm font-bold text-stone-800 focus:outline-none focus:ring-2 focus:ring-primary/20"
                  value={newCoupon.type}
                  onChange={(e) => setNewCoupon({...newCoupon, type: e.target.value})}
                >
                  <option value="flat">Flat Amount</option>
                  <option value="percentage">Percentage</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-stone-700 mb-2">Value</label>
                <input 
                  type="number" 
                  required
                  className="w-full bg-stone-50 rounded-xl px-4 py-3 text-sm font-bold text-stone-800 placeholder-stone-300 focus:outline-none focus:ring-2 focus:ring-primary/20"
                  value={newCoupon.value}
                  onChange={(e) => setNewCoupon({...newCoupon, value: e.target.value})}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-stone-700 mb-2">Min. Order (₹)</label>
              <input 
                type="number" 
                required
                className="w-full bg-stone-50 rounded-xl px-4 py-3 text-sm font-bold text-stone-800 placeholder-stone-300 focus:outline-none focus:ring-2 focus:ring-primary/20"
                value={newCoupon.min_order}
                onChange={(e) => setNewCoupon({...newCoupon, min_order: e.target.value})}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-stone-700 mb-2">Limit Per User</label>
                <input 
                  type="number" 
                  required
                  className="w-full bg-stone-50 rounded-xl px-4 py-3 text-sm font-bold text-stone-800 placeholder-stone-300 focus:outline-none focus:ring-2 focus:ring-primary/20"
                  value={newCoupon.limit_per_user}
                  onChange={(e) => setNewCoupon({...newCoupon, limit_per_user: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-stone-700 mb-2">Expiry Date</label>
                <input 
                  type="date" 
                  className="w-full bg-stone-50 rounded-xl px-4 py-3 text-sm font-bold text-stone-800 focus:outline-none focus:ring-2 focus:ring-primary/20"
                  value={newCoupon.expiry_date || ''}
                  onChange={(e) => setNewCoupon({...newCoupon, expiry_date: e.target.value})}
                />
              </div>
            </div>
            <div className="flex space-x-3 pt-4">
              <button 
                type="button"
                onClick={() => setCouponModal({ open: false, mode: 'add' })}
                className="flex-1 py-3 border border-stone-200 rounded-xl font-bold hover:bg-stone-50"
              >
                Cancel
              </button>
              <button 
                type="submit"
                className="flex-1 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary/90"
              >
                {couponModal.mode === 'edit' ? 'Update' : 'Create'}
              </button>
            </div>
          </form>
        </div>
      </ModalContainer>

      {/* Promotion Rule Modal */}
      <ModalContainer
        isOpen={promotionRuleFormModal.open}
        onClose={() => setPromotionRuleFormModal({ open: false, mode: 'add', rule: null })}
        title={promotionRuleFormModal.mode === 'add' ? 'Create Target Rule' : 'Edit Target Rule'}
        size="md"
      >
        <div className="p-8 pb-10">
          <form onSubmit={handlePromotionRuleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-stone-700 mb-2">Rule Title</label>
              <input 
                type="text" 
                required
                className="w-full bg-stone-50 rounded-xl px-4 py-3 text-sm font-bold text-stone-800 placeholder-stone-300 focus:outline-none focus:ring-2 focus:ring-primary/20"
                value={newPromotionRuleData.title || ''}
                onChange={(e) => setNewPromotionRuleData({...newPromotionRuleData, title: e.target.value})}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-stone-700 mb-2">Discount Type</label>
                <select 
                  className="w-full bg-stone-50 rounded-xl px-4 py-3 text-sm font-bold text-stone-800 focus:outline-none focus:ring-2 focus:ring-primary/20"
                  value={newPromotionRuleData.type || 'bogo'}
                  onChange={(e) => setNewPromotionRuleData({...newPromotionRuleData, type: e.target.value as any})}
                >
                  <option value="percentage">Percentage OFF</option>
                  <option value="fixed">Fixed Amount OFF</option>
                  <option value="bogo">Buy X Get Y (BOGO)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-stone-700 mb-2">Discount Value {newPromotionRuleData.type === 'bogo' && '(Y)'}</label>
                <input 
                  type="number" 
                  required
                  min="1"
                  className="w-full bg-stone-50 rounded-xl px-4 py-3 text-sm font-bold text-stone-800 placeholder-stone-300 focus:outline-none focus:ring-2 focus:ring-primary/20"
                  value={newPromotionRuleData.discount_value || ''}
                  onChange={(e) => setNewPromotionRuleData({...newPromotionRuleData, discount_value: parseFloat(e.target.value)})}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-stone-700 mb-2">Target Scope</label>
                <select 
                  className="w-full bg-stone-50 rounded-xl px-4 py-3 text-sm font-bold text-stone-800 focus:outline-none focus:ring-2 focus:ring-primary/20"
                  value={newPromotionRuleData.target_type || 'all'}
                  onChange={(e) => setNewPromotionRuleData({...newPromotionRuleData, target_type: e.target.value as any})}
                >
                  <option value="all">Entire Store</option>
                  <option value="category">Specific Category</option>
                  <option value="product">Specific Product</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-stone-700 mb-2">Required Qty {newPromotionRuleData.type === 'bogo' && '(X)'}</label>
                <input 
                  type="number" 
                  required
                  min="1"
                  className="w-full bg-stone-50 rounded-xl px-4 py-3 text-sm font-bold text-stone-800 placeholder-stone-300 focus:outline-none focus:ring-2 focus:ring-primary/20"
                  value={newPromotionRuleData.condition_qty || ''}
                  onChange={(e) => setNewPromotionRuleData({...newPromotionRuleData, condition_qty: parseInt(e.target.value)})}
                />
              </div>
            </div>
            
            {newPromotionRuleData.target_type !== 'all' && (
              <div>
                <label className="block text-sm font-bold text-stone-700 mb-2">Target Name / ID</label>
                <input 
                  type="text" 
                  required
                  placeholder={newPromotionRuleData.target_type === 'category' ? "e.g., Electronics" : "Product ID (e.g., 12)"}
                  className="w-full bg-stone-50 rounded-xl px-4 py-3 text-sm font-bold text-stone-800 placeholder-stone-300 focus:outline-none focus:ring-2 focus:ring-primary/20"
                  value={newPromotionRuleData.target_id || ''}
                  onChange={(e) => setNewPromotionRuleData({...newPromotionRuleData, target_id: e.target.value})}
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-stone-700 mb-2">Start Date</label>
                <input 
                  type="date"
                  className="w-full bg-stone-50 rounded-xl px-4 py-3 text-sm font-bold text-stone-800 focus:outline-none focus:ring-2 focus:ring-primary/20"
                  value={newPromotionRuleData.start_date || ''}
                  onChange={(e) => setNewPromotionRuleData({...newPromotionRuleData, start_date: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-stone-700 mb-2">End Date</label>
                <input 
                  type="date"
                  className="w-full bg-stone-50 rounded-xl px-4 py-3 text-sm font-bold text-stone-800 focus:outline-none focus:ring-2 focus:ring-primary/20"
                  value={newPromotionRuleData.end_date || ''}
                  onChange={(e) => setNewPromotionRuleData({...newPromotionRuleData, end_date: e.target.value})}
                />
              </div>
            </div>

            <div className="flex items-center space-x-3 p-4 bg-stone-50 rounded-2xl">
              <input 
                type="checkbox" 
                id="promorule_active"
                className="w-5 h-5 rounded border-stone-300 text-primary focus:ring-primary"
                checked={newPromotionRuleData.active || false}
                onChange={(e) => setNewPromotionRuleData({...newPromotionRuleData, active: e.target.checked})}
              />
              <label htmlFor="promorule_active" className="text-sm font-bold text-stone-700">Active</label>
            </div>
            <div className="flex space-x-3 pt-4">
              <button 
                type="button"
                onClick={() => setPromotionRuleFormModal({ open: false, mode: 'add', rule: null })}
                className="flex-1 py-3 border border-stone-200 rounded-xl font-bold hover:bg-stone-50 transition-colors"
              >
                Cancel
              </button>
              <button 
                type="submit"
                className="flex-1 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition-colors"
              >
                Save Rule
              </button>
            </div>
          </form>
        </div>
      </ModalContainer>

      {/* Promotion Modal */}
      <ModalContainer
        isOpen={promotionModal.open}
        onClose={() => setPromotionModal({ open: false, mode: 'add', id: null })}
        title={promotionModal.mode === 'add' ? 'Add Promotion' : 'Edit Promotion'}
        size="md"
      >
        <div className="p-8 pb-10">
          <form onSubmit={handlePromotionSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-stone-700 mb-2">Title</label>
              <input 
                type="text" 
                required
                className="w-full bg-stone-50 rounded-xl px-4 py-3 text-sm font-bold text-stone-800 placeholder-stone-300 focus:outline-none focus:ring-2 focus:ring-primary/20"
                value={newPromotion.title}
                onChange={(e) => setNewPromotion({...newPromotion, title: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-stone-700 mb-2">Description</label>
              <textarea 
                required
                className="w-full bg-stone-50 rounded-xl px-4 py-3 text-sm font-bold text-stone-800 placeholder-stone-300 focus:outline-none focus:ring-2 focus:ring-primary/20 min-h-[100px]"
                value={newPromotion.description}
                onChange={(e) => setNewPromotion({...newPromotion, description: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-stone-700 mb-2">Image URL (Optional)</label>
              <div className="flex space-x-2">
                <input 
                  type="text" 
                  className="w-full bg-stone-50 rounded-xl px-4 py-3 text-sm font-bold text-stone-800 placeholder-stone-300 focus:outline-none focus:ring-2 focus:ring-primary/20"
                  value={newPromotion.image_url}
                  onChange={(e) => setNewPromotion({...newPromotion, image_url: e.target.value})}
                />
                <div className="relative">
                  <button type="button" className="p-3 bg-stone-100 rounded-xl hover:bg-stone-200 transition-colors">
                    <Upload size={18} />
                  </button>
                  <input 
                    type="file" 
                    accept="image/*"
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setNewPromotion({...newPromotion, image_url: reader.result as string});
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                </div>
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-stone-700 mb-2">Link (Optional)</label>
              <input 
                type="text" 
                className="w-full bg-stone-50 rounded-xl px-4 py-3 text-sm font-bold text-stone-800 placeholder-stone-300 focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="/products or https://..."
                value={newPromotion.link}
                onChange={(e) => setNewPromotion({...newPromotion, link: e.target.value})}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-stone-700 mb-2">Target Audience</label>
                <select 
                  className="w-full bg-stone-50 rounded-xl px-4 py-3 text-sm font-bold text-stone-800 focus:outline-none focus:ring-2 focus:ring-primary/20"
                  value={newPromotion.target_role}
                  onChange={(e) => setNewPromotion({...newPromotion, target_role: e.target.value})}
                >
                  <option value="all">All Users</option>
                  <option value="customer">Retail Customers</option>
                  <option value="wholesaler">Wholesale Buyers</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-stone-700 mb-2">Banner Type</label>
                <select 
                  className="w-full bg-stone-50 rounded-xl px-4 py-3 text-sm font-bold text-stone-800 focus:outline-none focus:ring-2 focus:ring-primary/20"
                  value={newPromotion.banner_type}
                  onChange={(e) => setNewPromotion({...newPromotion, banner_type: e.target.value})}
                >
                  <option value="standard">Standard Banner</option>
                  <option value="hero">Hero Slider (Top)</option>
                  <option value="hidden">Hidden (No Banner)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-stone-700 mb-2">Start Time (Optional)</label>
                <input 
                  type="datetime-local" 
                  className="w-full bg-stone-50 rounded-xl px-4 py-3 text-sm font-bold text-stone-800 focus:outline-none focus:ring-2 focus:ring-primary/20"
                  value={newPromotion.start_time}
                  onChange={(e) => setNewPromotion({...newPromotion, start_time: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-stone-700 mb-2">End Time (Optional)</label>
                <input 
                  type="datetime-local" 
                  className="w-full bg-stone-50 rounded-xl px-4 py-3 text-sm font-bold text-stone-800 focus:outline-none focus:ring-2 focus:ring-primary/20"
                  value={newPromotion.end_time}
                  onChange={(e) => setNewPromotion({...newPromotion, end_time: e.target.value})}
                />
              </div>
            </div>

            <div className="flex items-center space-x-3 p-4 bg-stone-50 rounded-2xl">
              <input 
                type="checkbox" 
                id="promo_active"
                className="w-5 h-5 rounded border-stone-300 text-primary focus:ring-primary"
                checked={newPromotion.active}
                onChange={(e) => setNewPromotion({...newPromotion, active: e.target.checked})}
              />
              <label htmlFor="promo_active" className="text-sm font-bold text-stone-700">Active (Visible on store)</label>
            </div>
            <div className="flex items-center space-x-3 p-4 bg-stone-50 rounded-2xl">
              <input 
                type="checkbox" 
                id="promo_default"
                className="w-5 h-5 rounded border-stone-300 text-primary focus:ring-primary"
                checked={newPromotion.is_default}
                onChange={(e) => setNewPromotion({...newPromotion, is_default: e.target.checked})}
              />
              <label htmlFor="promo_default" className="text-sm font-bold text-stone-700">Set as Default Banner</label>
            </div>
            <div className="flex space-x-3 pt-4">
              <button 
                type="button"
                onClick={() => setPromotionModal({ open: false, mode: 'add', id: null })}
                className="flex-1 py-3 border border-stone-200 rounded-xl font-bold hover:bg-stone-50"
              >
                Cancel
              </button>
              <button 
                type="submit"
                className="flex-1 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary/95"
              >
                {promotionModal.mode === 'add' ? 'Add Promotion' : 'Update Promotion'}
              </button>
            </div>
          </form>
        </div>
      </ModalContainer>

      {/* Linked Products to Promotion Modal */}
      <ModalContainer
        isOpen={promotionProductsModal.open}
        onClose={() => setPromotionProductsModal({ ...promotionProductsModal, open: false })}
        title="Link Products to Promotion"
        size="lg"
        showHeader={true}
      >
        <div className="p-8 pb-10">
          <div className="flex-1 overflow-y-auto pr-2 space-y-4 max-h-[50vh]">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {allProducts.map((product) => {
                const isLinked = linkedProductIds.includes(product.id);
                return (
                  <div key={product.id} className="p-4 bg-stone-50 rounded-2xl border border-stone-100 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <img src={product.image_url} className="w-10 h-10 rounded-lg object-cover" alt="" referrerPolicy="no-referrer" />
                      <div>
                        <p className="font-bold text-sm text-stone-800">{product.name}</p>
                        <p className="text-[10px] text-stone-400 font-bold uppercase">₹{product.price}</p>
                      </div>
                    </div>
                    <button 
                      onClick={async () => {
                        try {
                          if (isLinked) {
                            const data = await fetchWithHandling<any>(`/api/admin/promotions/${promotionProductsModal.promotionId}/products/${product.id}`, { 
                              method: 'DELETE',
                              headers: getAuthHeaders()
                            });
                            if (data) {
                              setLinkedProductIds(linkedProductIds.filter(id => id !== product.id));
                              toast.success('Product unlinked');
                            }
                          } else {
                            const data = await fetchWithHandling<any>(`/api/admin/promotions/${promotionProductsModal.promotionId}/products`, {
                              method: 'POST',
                              headers: getAuthHeaders(),
                              body: JSON.stringify({ product_id: product.id })
                            });
                            if (data) {
                              setLinkedProductIds([...linkedProductIds, product.id]);
                              toast.success('Product linked');
                            }
                          }
                        } catch (err) {
                          console.error('Update promotion products error:', err);
                        }
                      }}
                      className={cn(
                        "px-3 py-1.5 rounded-xl text-xs font-bold transition-all",
                        isLinked ? "bg-red-50 text-red-600 hover:bg-red-100" : "bg-primary/10 text-primary hover:bg-primary/20"
                      )}
                    >
                      {isLinked ? 'Unlink' : 'Link'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-stone-100">
            <button 
              onClick={() => setPromotionProductsModal({ ...promotionProductsModal, open: false })}
              className="w-full py-4 bg-primary text-white rounded-2xl font-bold hover:bg-primary/95 shadow-lg shadow-primary/20 transition-all"
            >
              Done
            </button>
          </div>
        </div>
      </ModalContainer>

      {/* Broadcast Announcement Modal */}
      <ModalContainer
        isOpen={notificationModal.open}
        onClose={() => setNotificationModal({ open: false })}
        title="Broadcast Announcement"
        size="lg"
      >
        <div className="p-8 pb-10">
          <p className="text-stone-500 text-sm mt-1 mb-8 select-none">Create and dispatch informative messages across the platform.</p>
          <form onSubmit={handleNotificationSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-xs font-black text-stone-400 uppercase tracking-widest mb-2 select-none">Subject Title</label>
                <input 
                  type="text" 
                  required
                  placeholder="E.g. Weekend Flash Sale Live!"
                  className="w-full bg-stone-50 rounded-xl px-4 py-4 text-base font-bold text-stone-800 placeholder-stone-300 focus:outline-none focus:ring-2 focus:ring-primary/20"
                  value={newNotification.title}
                  onChange={(e) => setNewNotification({...newNotification, title: e.target.value})}
                />
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-xs font-black text-stone-400 uppercase tracking-widest mb-2 select-none">Message Content</label>
                <textarea 
                  required
                  placeholder="Enter detailed announcement message..."
                  className="w-full bg-stone-50 rounded-xl px-4 py-4 text-base font-bold text-stone-800 placeholder-stone-300 focus:outline-none focus:ring-2 focus:ring-primary/20 min-h-[120px] resize-none"
                  value={newNotification.message}
                  onChange={(e) => setNewNotification({...newNotification, message: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-stone-400 uppercase tracking-widest mb-2">Announcement Type</label>
                <select 
                  className="w-full bg-stone-50 rounded-xl px-4 py-3 text-sm font-bold text-stone-800 focus:outline-none focus:ring-2 focus:ring-primary/20"
                  value={newNotification.type}
                  onChange={(e) => setNewNotification({...newNotification, type: e.target.value})}
                >
                  <option value="announcement">📢 Format Announcement</option>
                  <option value="ad">🏷️ Promotional Ad</option>
                  <option value="alert">🚨 Critical Alert</option>
                  <option value="info">ℹ️ System Info</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black text-stone-400 uppercase tracking-widest mb-2">Priority Level</label>
                <select 
                  className="w-full bg-stone-50 rounded-xl px-4 py-3 text-sm font-bold text-stone-800 focus:outline-none focus:ring-2 focus:ring-primary/20"
                  value={newNotification.priority}
                  onChange={(e) => setNewNotification({...newNotification, priority: e.target.value})}
                >
                  <option value="low">Low (Standard)</option>
                  <option value="medium">Medium (Important)</option>
                  <option value="high">High (Urgent)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black text-stone-400 uppercase tracking-widest mb-2">Target Audience</label>
                <select 
                  className="w-full bg-stone-50 rounded-xl px-4 py-3 text-sm font-bold text-stone-800 focus:outline-none focus:ring-2 focus:ring-primary/20"
                  value={newNotification.target_role}
                  onChange={(e) => setNewNotification({...newNotification, target_role: e.target.value})}
                >
                  <option value="all">Everyone</option>
                  <option value="user">Registered Customers Only</option>
                  <option value="admin">Admin Team Only</option>
                  <option value="delivery">Delivery Staff</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black text-stone-400 uppercase tracking-widest mb-2">Expiry Date (Optional)</label>
                <input 
                  type="datetime-local"
                  className="w-full bg-stone-50 rounded-xl px-4 py-3 text-sm font-bold text-stone-800 focus:outline-none focus:ring-2 focus:ring-primary/20"
                  value={newNotification.expires_at}
                  onChange={(e) => setNewNotification({...newNotification, expires_at: e.target.value})}
                />
              </div>
            </div>

            <div className="flex space-x-4 pt-4">
              <button 
                type="button"
                onClick={() => setNotificationModal({ open: false })}
                className="flex-1 py-4 border border-stone-200 rounded-2xl font-bold text-stone-600 hover:bg-stone-50 transition-all"
              >
                Discard
              </button>
              <button 
                type="submit"
                className="flex-[2] py-4 bg-stone-900 text-white rounded-2xl font-bold hover:bg-stone-800 transition-all shadow-xl shadow-stone-900/10 flex items-center justify-center space-x-2"
              >
                <Send size={18} />
                <span>Dispatch Announcement</span>
              </button>
            </div>
          </form>
        </div>
      </ModalContainer>
    </>
  );
};
