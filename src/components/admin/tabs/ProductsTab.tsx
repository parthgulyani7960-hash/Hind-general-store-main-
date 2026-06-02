import React, { useState } from 'react';
import { 
  Package, Plus, AlertTriangle, ShieldAlert, Clock, 
  Search, RefreshCw, Upload, Download, Receipt, 
  Filter, Settings, Trash2, Tag, Check, X,
  Activity, PackagePlus, Image as ImageIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';
import ExportTriggerButton from '@/components/admin/ExportTriggerButton';
import AdminStatCard from '@/components/admin/AdminStatCard';

interface ProductsTabProps {
    allProducts: any[];
    categories: any[];
    loading: boolean;
    setProductModal: (val: any) => void;
    setNewProduct: (val: any) => void;
    setEditingProduct: (val: any) => void;
    deleteProduct: (id: number) => Promise<void>;
    handleBulkUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
    downloadTemplate: () => void;
    generatePurchaseOrder: () => void;
    bulkUpdateStock: () => void;
    bulkUpdateCategory: () => void;
    bulkUnlist: (unlist: boolean) => void;
    bulkDelete: () => void;
    bulkStockValue: string;
    setBulkStockValue: (val: string) => void;
}

const ProductsTab: React.FC<ProductsTabProps> = ({
    allProducts,
    categories,
    loading,
    setProductModal,
    setNewProduct,
    setEditingProduct,
    deleteProduct,
    handleBulkUpload,
    downloadTemplate,
    generatePurchaseOrder,
    bulkUpdateStock,
    bulkUpdateCategory,
    bulkUnlist,
    bulkDelete,
    bulkStockValue,
    setBulkStockValue
}) => {
    const [productSearchTerm, setProductSearchTerm] = useState('');
    const [searchSuggestions, setSearchSuggestions] = useState<string[]>([]);
    const [productStockFilter, setProductStockFilter] = useState<'all' | 'low' | 'out' | 'expiring'>('all');
    const [productCategoryFilter, setProductCategoryFilter] = useState('all');
    const [productListedFilter, setProductListedFilter] = useState<'all' | 'listed' | 'unlisted'>('all');
    const [productSortBy, setProductSortBy] = useState<'name' | 'price' | 'stock' | 'created_at'>('name');
    const [productSortOrder, setProductSortOrder] = useState<'asc' | 'desc'>('asc');
    const [selectedProducts, setSelectedProducts] = useState<number[]>([]);
    const [productDiscountFilter, setProductDiscountFilter] = useState('all');
    const [productDateFilter, setProductDateFilter] = useState('');

    const filteredProducts = allProducts.filter(product => {
        const matchesSearch = !productSearchTerm || 
          product.name.toLowerCase().includes(productSearchTerm.toLowerCase()) ||
          product.description.toLowerCase().includes(productSearchTerm.toLowerCase()) ||
          product.category.toLowerCase().includes(productSearchTerm.toLowerCase());
        const matchesCategory = productCategoryFilter === 'all' || product.category === productCategoryFilter;
        const matchesStock = productStockFilter === 'all' || 
          (productStockFilter === 'low' && Number(product.stock) > 0 && Number(product.stock) <= Number(product.reorder_point || 5)) ||
          (productStockFilter === 'out' && Number(product.stock) <= 0) ||
          (productStockFilter === 'expiring' && product.expiry_date && new Date(product.expiry_date) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000));
        const matchesListed = productListedFilter === 'all' || 
          (productListedFilter === 'listed' && product.is_listed) ||
          (productListedFilter === 'unlisted' && !product.is_listed);
        return matchesSearch && matchesCategory && matchesStock && matchesListed;
    });

    const sortedProducts = [...filteredProducts].sort((a, b) => {
        let valA, valB;
        if (productSortBy === 'price') {
            valA = a.price || 0;
            valB = b.price || 0;
        } else if (productSortBy === 'stock') {
            valA = a.stock || 0;
            valB = b.stock || 0;
        } else if (productSortBy === 'created_at') {
            valA = new Date(a.created_at).getTime();
            valB = new Date(b.created_at).getTime();
        } else {
            valA = (a.name || '').toLowerCase();
            valB = (b.name || '').toLowerCase();
        }
        return productSortOrder === 'asc' ? (valA > valB ? 1 : -1) : (valA < valB ? 1 : -1);
    });

    const toggleProductSelection = (id: number) => {
        setSelectedProducts(prev => prev.includes(id) ? prev.filter(pId => pId !== id) : [...prev, id]);
    };

    const toggleAllProducts = () => {
        if (selectedProducts.length === filteredProducts.length) {
            setSelectedProducts([]);
        } else {
            setSelectedProducts(filteredProducts.map(p => p.id));
        }
    };

    return (
      <div className="space-y-8 animate-in fade-in duration-500">
        {/* Inventory Control Center Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary rotate-3">
                <Package size={24} />
              </div>
              <h2 className="text-4xl font-black text-stone-900 tracking-tight">Inventory Status</h2>
            </div>
            <p className="text-stone-500 font-medium text-lg ml-1">Real-time stock control & catalog management.</p>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="bg-white px-6 py-4 rounded-3xl border border-stone-100 shadow-sm flex flex-col min-w-[140px] hidden xl:flex">
              <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-1">Low Stock</span>
              <span className="text-xl font-black text-red-500">{allProducts.filter(p => p.stock <= (p.reorder_point || 5)).length}</span>
            </div>
            <div className="bg-white px-6 py-4 rounded-3xl border border-stone-100 shadow-sm flex flex-col min-w-[140px] hidden xl:flex">
                <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-1">Total SKU</span>
                <span className="text-xl font-black text-primary">{allProducts.length}</span>
            </div>
            <div className="hidden lg:flex items-center space-x-2 bg-emerald-50 text-emerald-600 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest border border-emerald-100">
              <Activity size={14} className="animate-pulse" />
              <span>Live Sync Active</span>
            </div>
            <div className="relative z-50">
              <button 
                onClick={() => {
                  setProductModal({ open: true, mode: 'add' });
                  setNewProduct({ 
                    name: '', description: '', price: '', stock: '', category: 'Grocery', image: '',
                    retail_price: '', wholesale_price: '', discount: '0', reorder_point: '10', max_qty: '0', is_listed: true,
                    images: [],
                    specifications: {},
                    batch_number: '',
                    expiry_date: '',
                    unit: 'kg',
                    is_subscribable: false
                  } as any);
                }}
                className="bg-primary text-white px-8 py-4 rounded-2xl font-black flex items-center space-x-3 shadow-xl shadow-primary/20 hover:bg-primary/90 transition-all active:scale-95 group"
              >
                <Plus size={20} className="group-hover:rotate-90 transition-transform duration-300" />
                <span>Initialize Product</span>
              </button>
            </div>
          </div>
        </div>

        <div className="w-full md:w-64">
            <ExportTriggerButton type="products" onClick={() => {}} />
        </div>

        {/* Intelligence Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <AdminStatCard 
            label="Total SKU Catalog" 
            value={allProducts.length} 
            icon={<Package size={22} />} 
            color="primary"
            trend={{ value: 'Active', isUp: true }}
            progress={100}
          />
          <AdminStatCard 
            label="Out of Stock" 
            value={allProducts.filter(p => Number(p.stock) <= 0).length} 
            icon={<AlertTriangle size={22} />} 
            color="red"
            trend={{ value: 'Action Required', isUp: false }}
            progress={allProducts.length > 0 ? (allProducts.filter(p => Number(p.stock) <= 0).length / allProducts.length) * 100 : 0}
          />
          <AdminStatCard 
            label="Low Stock Replenish" 
            value={allProducts.filter(p => Number(p.stock) > 0 && Number(p.stock) <= Number(p.reorder_point || 5)).length} 
            icon={<ShieldAlert size={22} />} 
            color="amber"
            trend={{ value: 'Reviewing', isUp: true, color: 'text-amber-500' }}
            progress={45}
          />
          <AdminStatCard 
            label="Expiring Manifest" 
            value={allProducts.filter(p => p.expiry_date && new Date(p.expiry_date) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)).length} 
            icon={<Clock size={22} />} 
            color="emerald"
            trend={{ value: 'Mitigation', isUp: true }}
            progress={15}
          />
        </div>

        {/* Global Catalog Utility Bar */}
        <div className="flex flex-col lg:flex-row gap-6 items-center">
          <div className="w-full lg:flex-1 relative group">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-stone-300 group-focus-within:text-primary transition-colors" size={20} />
            <input 
              type="text" 
              placeholder="Search by SKU, Name, Category or Batch Number..."
              className="w-full bg-white border-stone-200 border rounded-[2rem] pl-16 pr-6 py-4 text-sm focus:ring-8 focus:ring-primary/5 outline-none transition-all placeholder:text-stone-300 font-medium shadow-sm hover:border-stone-300 focus:border-primary"
              value={productSearchTerm}
              onChange={(e) => {
                setProductSearchTerm(e.target.value);
              }}
            />
          </div>

          <div className="flex items-center space-x-3 w-full lg:w-auto">
            <div className="flex items-center p-1 bg-white border border-stone-100 rounded-2xl shadow-sm">
              <button 
                onClick={downloadTemplate}
                className="p-3 text-stone-400 hover:text-primary transition-all rounded-xl hover:bg-stone-50"
                title="Export CSV Template"
              >
                <Download size={20} />
              </button>
              <label className="p-3 text-stone-400 hover:text-emerald-500 transition-all rounded-xl cursor-pointer hover:bg-stone-50">
                <Upload size={20} />
                <input type="file" accept=".csv" className="hidden" onChange={handleBulkUpload} />
              </label>
              {(productStockFilter === 'low' || productStockFilter === 'out') && (
                <button 
                  onClick={generatePurchaseOrder}
                  className="p-3 text-stone-400 hover:text-amber-500 transition-all rounded-xl hover:bg-stone-50"
                  title="Generate PO for Low Stock"
                >
                  <Receipt size={20} />
                </button>
              )}
            </div>
            
            <div className="h-10 w-px bg-stone-200 mx-2" />
            
            <button 
              className="p-4 bg-white border border-stone-100 rounded-2xl text-stone-400 hover:text-primary hover:shadow-md transition-all active:scale-95"
            >
              <RefreshCw size={20} />
            </button>
          </div>
        </div>

        {/* Enhanced Filters */}
        <section className="bg-white p-6 rounded-[2rem] shadow-sm border border-stone-100 flex flex-wrap items-center gap-8">
          <div className="flex items-center space-x-3 pr-6 border-r border-stone-100">
            <div className="p-3 bg-primary/10 rounded-2xl text-primary">
              <Filter size={20} />
            </div>
            <span className="text-xs font-black text-stone-900 uppercase tracking-widest leading-none">Catalog<br/><span className="text-stone-400 font-bold">Filters</span></span>
          </div>
          
          <div className="space-y-1.5">
            <label className="text-xs font-black text-stone-400 uppercase tracking-widest px-1">Stock</label>
            <select 
              className="bg-stone-50 border-stone-200 border rounded-xl text-xs font-bold py-2.5 px-4 focus:ring-4 focus:ring-primary/10 outline-none transition-all appearance-none cursor-pointer"
              value={productStockFilter}
              onChange={(e) => setProductStockFilter(e.target.value as any)}
            >
              <option value="all">All Inventory</option>
              <option value="low">Low Stock Only</option>
              <option value="out">Out of Stock</option>
              <option value="expiring">Near Expiry</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-black text-stone-400 uppercase tracking-widest px-1">Category</label>
            <select 
              className="bg-stone-50 border-stone-200 border rounded-xl text-xs font-bold py-2.5 px-4 focus:ring-4 focus:ring-primary/10 outline-none transition-all appearance-none cursor-pointer min-w-[140px]"
              value={productCategoryFilter}
              onChange={(e) => setProductCategoryFilter(e.target.value)}
            >
              <option value="all">All Categories</option>
              {categories.map(c => (
                <option key={c.id} value={c.name}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-black text-stone-400 uppercase tracking-widest px-1">Sort By</label>
            <select 
              className="bg-stone-50 border-stone-200 border rounded-xl text-xs font-bold py-2.5 px-4 focus:ring-4 focus:ring-primary/10 outline-none transition-all appearance-none cursor-pointer"
              value={productSortBy}
              onChange={(e) => setProductSortBy(e.target.value as any)}
            >
              <option value="name">Name (A-Z)</option>
              <option value="price">Price (Value)</option>
              <option value="stock">Stock (Count)</option>
              <option value="created_at">Submission Date</option>
            </select>
          </div>

          <motion.button 
            whileHover={{ rotate: -90 }}
            onClick={() => {
              setProductStockFilter('all');
              setProductCategoryFilter('all');
              setProductListedFilter('all');
              setProductSearchTerm('');
              setProductSortBy('name');
            }}
            className="ml-auto p-3 bg-stone-50 text-stone-400 hover:text-primary hover:bg-white border border-stone-100 rounded-2xl transition-all shadow-sm group"
            title="Reset Filters"
          >
            <RefreshCw size={20} className="group-active:scale-90" />
          </motion.button>
        </section>

        <div className="bg-white rounded-[2.5rem] shadow-sm border border-stone-100 overflow-hidden">
          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full text-left">
              <thead className="bg-stone-50/50 text-stone-400 text-xs uppercase font-black tracking-[0.15em]">
                <tr>
                  <th className="px-8 py-6 w-10">
                    <input 
                      type="checkbox" 
                      className="w-5 h-5 rounded-lg border-stone-300 text-primary focus:ring-primary transition-all cursor-pointer"
                      checked={selectedProducts.length === filteredProducts.length && filteredProducts.length > 0}
                      onChange={toggleAllProducts}
                    />
                  </th>
                  <th className="px-6 py-6">Inventory Node</th>
                  <th className="px-6 py-6">Category</th>
                  <th className="px-6 py-6">Pricing & Margin</th>
                  <th className="px-6 py-6">Unit Liquidity</th>
                  <th className="px-6 py-6 text-right">Operational Directives</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-50">
                {sortedProducts.map((product, idx) => (
                  <motion.tr 
                    key={product.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.03 }}
                    className={cn(
                    "hover:bg-stone-50/80 transition-all duration-300 group",
                    selectedProducts.includes(product.id) && "bg-primary/[0.03]"
                  )}>
                    <td className="px-8 py-6">
                      <input 
                        type="checkbox" 
                        className="w-5 h-5 rounded-lg border-stone-300 text-primary focus:ring-primary transition-all cursor-pointer"
                        checked={selectedProducts.includes(product.id)}
                        onChange={() => toggleProductSelection(product.id)}
                      />
                    </td>
                    <td className="px-6 py-6">
                      <div className="flex items-center space-x-4">
                        <div className="relative">
                          <img 
                            src={product.image_url || product.image} 
                            alt="" 
                            loading="lazy"
                            referrerPolicy="no-referrer"
                            className="w-14 h-14 rounded-2xl object-cover shadow-sm border border-stone-100 group-hover:scale-110 transition-transform duration-500" 
                          />
                        </div>
                        <div className="max-w-[240px]">
                          <p className="text-sm font-black text-stone-900 group-hover:text-primary transition-colors truncate">{product.name}</p>
                          <p className="text-xs text-stone-400 font-medium line-clamp-1 mt-0.5">{product.description}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-6">
                      <span className="text-xs font-black uppercase tracking-widest text-stone-500 bg-stone-100 px-3 py-1.5 rounded-xl border border-stone-200/50">{product.category}</span>
                    </td>
                    <td className="px-6 py-6">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-black text-stone-900">₹{(product.retail_price || product.price).toLocaleString()}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-6">
                      <div className="flex flex-col">
                        <span className={cn(
                          "text-xs font-black uppercase tracking-widest mb-1 shadow-sm px-2 py-0.5 rounded-md w-fit",
                          Number(product.stock) <= 0 ? "bg-red-50 text-red-600" : 
                          Number(product.stock) <= Number(product.reorder_point || 5) ? "bg-amber-50 text-amber-600" : 
                          "bg-emerald-50 text-emerald-600"
                        )}>
                          {Number(product.stock) <= 0 ? 'Depleted' : Number(product.stock) <= Number(product.reorder_point || 5) ? 'Low Stock' : 'Stable'}
                        </span>
                        <span className="text-sm font-black text-stone-700">{product.stock} Units</span>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button 
                          onClick={() => { 
                            setEditingProduct(product); 
                            setProductModal({ open: true, mode: 'edit' });
                          }}
                          className="p-2.5 bg-stone-50 text-stone-500 hover:text-primary rounded-xl transition-all"
                        >
                          <Settings size={18} />
                        </button>
                        <button 
                          onClick={() => deleteProduct(product.id)}
                          className="p-2.5 bg-stone-50 text-stone-500 hover:text-red-500 rounded-xl transition-all"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <AnimatePresence>
          {selectedProducts.length > 0 && (
            <motion.div 
              initial={{ y: 150, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 150, opacity: 0 }}
              className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[80] bg-stone-900 text-white px-6 py-4 rounded-[2rem] shadow-2xl flex items-center space-x-6 w-[90%] max-w-4xl border border-stone-800"
            >
               <div className="flex flex-col border-r border-stone-700 pr-6 mr-2">
                <span className="text-2xl font-black text-white">{selectedProducts.length}</span>
                <span className="text-xs uppercase font-bold tracking-widest text-stone-400">Selected</span>
              </div>
              <div className="flex flex-1 items-center space-x-4">
                  <button onClick={() => bulkUnlist(false)} className="text-sm font-bold hover:text-emerald-400 transition-colors">Make Active</button>
                  <button onClick={() => bulkUnlist(true)} className="text-sm font-bold hover:text-amber-400 transition-colors">Make Inactive</button>
                  <button onClick={bulkDelete} className="text-sm font-bold hover:text-red-400 transition-colors">Delete</button>
              </div>
              <button 
                onClick={() => setSelectedProducts([])}
                className="bg-stone-800 hover:bg-stone-700 p-2 rounded-full transition-all"
              >
                <X size={16} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
};

export default ProductsTab;
