import React, { useState, useEffect } from 'react';
import { getSupabase } from '../lib/supabase';
import { Product } from '../types';
import { 
  Plus, 
  Search, 
  MoreHorizontal, 
  Edit2, 
  Trash2, 
  Package,
  Zap,
  Filter,
  X,
  AlertCircle,
  Upload,
  Loader2,
  RefreshCw,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

import { cn } from '../lib/utils';

export default function ProductManager({ session }: { session?: any }) {
  const isAdmin = !!session;
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [configError, setConfigError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  
  // Segment-specific state
  const [activeTab, setActiveTab] = useState<'student_menu' | 'proff_menu' | 'elite_menu'>('student_menu');
  const [targetSegment, setTargetSegment] = useState<'current' | 'all'>('current');

  useEffect(() => {
    fetchProducts();
  }, [activeTab]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const supabase = getSupabase() as any;
      const { data, error } = await supabase
        .from(activeTab)
        .select('*');
      
      if (error) {
        throw error;
      }
      
      if (data) {
        const sorted = [...data].sort((a: any, b: any) => {
          const numA = parseInt(a.code?.match(/\d+$/)?.[0] || '999', 10);
          const numB = parseInt(b.code?.match(/\d+$/)?.[0] || '999', 10);
          return numA - numB;
        });
        setProducts(sorted);
      }
    } catch (e: any) {
      console.error(`Error fetching products from ${activeTab}:`, e);
      setConfigError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const saveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    setUploading(true);
    try {
      const supabase = getSupabase() as any;
      let imageUrl = editingProduct.image_url;

      // Handle Image Upload if a new file is selected
      if (selectedFile) {
        const fileExt = selectedFile.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `${fileName}`; // Directly in bucket or 'products/' folder

        const { error: uploadError } = await supabase.storage
          .from('menu-items')
          .upload(filePath, selectedFile, {
            cacheControl: '3600',
            upsert: true
          });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('menu-items')
          .getPublicUrl(filePath);
        
        imageUrl = publicUrl;
      }

      // Ensure keys match database schema exactly
      const finalProduct = {
        code: editingProduct.code,
        name: editingProduct.name,
        description: editingProduct.description,
        price: editingProduct.price,
        protein: editingProduct.protein,
        calories: editingProduct.calories,
        carbs: editingProduct.carbs,
        fat: editingProduct.fat,
        image_url: imageUrl,
        category: editingProduct.category,
        is_veg: editingProduct.is_veg,
        tags: editingProduct.tags || [],
        is_available: editingProduct.is_available,
        ingredients: editingProduct.ingredients,
        protein_source: editingProduct.protein_source
      };

      if (editingProduct.id) {
        if (targetSegment === 'all') {
          const targetTables = ['student_menu', 'proff_menu', 'elite_menu'];
          const promises = targetTables.map(table => 
            supabase.from(table).upsert({ id: editingProduct.id, ...finalProduct })
          );
          const results = await Promise.all(promises);
          const failed = results.find(r => r.error);
          if (failed && failed.error) throw failed.error;
        } else {
          const { error } = await supabase.from(activeTab).update(finalProduct).eq('id', editingProduct.id);
          if (error) throw error;
        }
      } else {
        if (targetSegment === 'all') {
          const targetTables = ['student_menu', 'proff_menu', 'elite_menu'];
          const newId = crypto.randomUUID ? crypto.randomUUID() : undefined;
          const insertPayload = newId ? { id: newId, ...finalProduct } : finalProduct;

          const promises = targetTables.map(table => 
            supabase.from(table).insert([insertPayload])
          );
          const results = await Promise.all(promises);
          const failed = results.find(r => r.error);
          if (failed && failed.error) throw failed.error;
        } else {
          const { error } = await supabase.from(activeTab).insert([finalProduct]);
          if (error) throw error;
        }
      }
      
      setIsModalOpen(false);
      setEditingProduct(null);
      setSelectedFile(null);
      fetchProducts();
    } catch (e: any) {
      console.error('Core Logic Failure:', e);
      let errorMsg = e.message || 'Unknown database rejection';
      
      if (errorMsg.includes('row-level security policy')) {
        errorMsg = 'DATABASE ACCESS DENIED: Please ensure you have added the required RLS POLICIES in your Supabase SQL Editor (check the logs for the SQL command).';
      }
      
      alert(`SYSTEM ERROR: ${errorMsg}`);
    } finally {
      setUploading(false);
    }
  };

  const deleteProduct = async (id: string, scope: 'current' | 'all') => {
    try {
      const supabase = getSupabase() as any;
      if (scope === 'all') {
        const targetTables = ['student_menu', 'proff_menu', 'elite_menu'];
        const promises = targetTables.map(table => 
          supabase.from(table).delete().eq('id', id)
        );
        const results = await Promise.all(promises);
        const failed = results.find(r => r.error);
        if (failed && failed.error) throw failed.error;
      } else {
        const { error } = await supabase.from(activeTab).delete().eq('id', id);
        if (error) throw error;
      }
      fetchProducts();
    } catch (e: any) {
      alert(`Delete failed: ${e.message}`);
    } finally {
      setDeleteConfirmId(null);
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    p.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-brand-neon border-t-transparent rounded-full animate-spin" />
          <p className="font-mono text-sm tracking-widest text-brand-neon animate-pulse">ESTABLISHING UPLINK...</p>
        </div>
      </div>
    );
  }

  if (configError) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="max-w-md glass-card p-8 border-brand-orange text-center">
          <AlertCircle className="w-12 h-12 text-brand-orange mx-auto mb-4" />
          <h3 className="text-2xl font-display text-brand-orange mb-4">CONFIG ERROR</h3>
          <p className="font-mono text-sm text-white/60 mb-6">{configError}</p>
          <div className="p-4 bg-brand-orange/10 border border-brand-orange/30 text-[10px] font-mono text-white/40 uppercase">
            Awaiting manual core override in environment secrets
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-5xl font-display leading-tight tracking-tighter">INVENTORY MATRIX</h2>
          <p className="font-mono text-sm text-brand-neon uppercase tracking-widest">{isAdmin ? 'Active product management' : 'Public Menu'}</p>
        </div>
        {isAdmin && (
          <div className="flex flex-wrap items-center gap-4">
            <button 
              id="add-asset-btn"
              onClick={() => {
                setEditingProduct({ is_available: true });
                setTargetSegment('current');
                setIsModalOpen(true);
              }}
              className="flex items-center gap-2 bg-brand-neon text-brand-dark px-6 py-3 font-display text-xl hover:shadow-[0_0_20px_rgba(212,255,0,0.4)] transition-all cursor-pointer"
            >
              <Plus size={24} />
              ADD ASSET
            </button>
          </div>
        )}
      </header>

      {/* Menu Segment Navigation Tabs */}
      <div className="border-b border-white/10 pb-1 flex flex-wrap gap-2">
        {(['student_menu', 'proff_menu', 'elite_menu'] as const).map((tab) => {
          const isActive = activeTab === tab;
          const label = {
            student_menu: '🎓 Student Menu',
            proff_menu: '💼 Professional Menu',
            elite_menu: '🏆 Elite Athlete Menu'
          }[tab];
          const dbName = tab;
          
          return (
            <button
              key={tab}
              id={`tab-${tab}`}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "px-5 py-3 font-display text-base uppercase tracking-wider transition-all border-t-2 border-x border-b relative cursor-pointer",
                isActive 
                  ? "border-t-brand-neon border-x-white/10 border-b-transparent bg-brand-neon/5 text-brand-neon font-black"
                  : "border-transparent border-b-white/10 text-white/50 hover:text-white"
              )}
            >
              <div className="flex items-center gap-2">
                <span>{label}</span>
                <span className={cn(
                  "font-mono text-[9px] px-1.5 py-0.5 rounded",
                  isActive ? "bg-brand-neon/20 text-brand-neon font-bold" : "bg-white/5 text-white/30"
                )}>
                  {dbName}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row gap-4 p-4 glass-card">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={18} />
          <input 
            type="text" 
            placeholder="SEARCH BY CODE OR NAME..."
            className="w-full bg-brand-dark/50 border border-white/10 px-10 py-3 font-mono text-xs focus:border-brand-neon outline-none transition-colors uppercase tracking-widest"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-3 border border-white/10 text-white/40 font-mono text-xs hover:text-white transition-colors flex items-center gap-2">
            <Filter size={14} /> CATEGORY
          </button>
          <div className="px-4 py-3 border border-white/10 text-brand-neon font-mono text-xs flex items-center gap-2">
            TOTAL: {products.length}
          </div>
        </div>
      </div>

      {/* Grid List */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {filteredProducts.map((product) => (
          <motion.div 
            key={product.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="glass-card flex overflow-hidden border-l-4 border-l-brand-neon group"
          >
            <div className="w-32 bg-white/5 flex items-center justify-center border-r border-white/5 group-hover:bg-brand-neon/10 transition-colors overflow-hidden">
              {product.image_url ? (
                <img 
                  src={product.image_url} 
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <Package size={40} className="text-white/20 group-hover:text-brand-neon transition-colors" />
              )}
            </div>
            <div className="flex-1 p-6 relative">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    {(() => {
                      const num = parseInt(product.code.match(/\d+$/)?.[0] || '0', 10);
                      const displayId = num > 0 ? (100 + num) : '';
                      return displayId ? (
                        <span className="font-mono text-[9px] font-bold bg-brand-neon/15 text-brand-neon px-2 py-0.5 rounded border border-brand-neon/35 uppercase tracking-wider">
                          ID: {displayId}
                        </span>
                      ) : null;
                    })()}
                    <span className="font-mono text-[10px] text-white/40 uppercase tracking-[0.15em]">{product.code}</span>
                  </div>
                  <h3 className="text-2xl font-display leading-none">{product.name}</h3>
                </div>
                {isAdmin && (
                  <div className="flex gap-2 items-center">
                    {deleteConfirmId === product.id ? (
                      <div className="flex flex-col gap-2 bg-brand-dark/95 border border-brand-orange/30 p-3 rounded shadow-2xl z-10 max-w-[240px]">
                        <span className="font-mono text-[9px] text-brand-orange uppercase font-bold animate-pulse">DELETE CODESET:</span>
                        <div className="flex flex-col gap-1.5">
                          <button 
                            id={`delete-current-${product.id}`}
                            onClick={() => deleteProduct(product.id, 'current')}
                            className="font-mono text-[9px] uppercase text-left text-white/70 hover:text-brand-neon transition-colors cursor-pointer"
                          >
                            - CURRENT SEGMENT ONLY
                          </button>
                          <button 
                            id={`delete-global-${product.id}`}
                            onClick={() => deleteProduct(product.id, 'all')}
                            className="font-mono text-[9px] uppercase text-left text-red-500 hover:text-red-400 font-bold transition-colors cursor-pointer"
                          >
                            - GLOBALLY FROM ALL 3 MENUS
                          </button>
                          <button 
                            id={`delete-cancel-${product.id}`}
                            onClick={() => setDeleteConfirmId(null)}
                            className="font-mono text-[9px] uppercase text-left text-white/40 hover:text-white transition-colors cursor-pointer"
                          >
                            - CANCEL
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <button 
                          id={`edit-asset-${product.id}`}
                          onClick={() => {
                            setEditingProduct(product);
                            setTargetSegment('current');
                            setIsModalOpen(true);
                          }}
                          className="p-2 hover:bg-white/10 text-white/40 hover:text-white transition-colors"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button 
                          id={`confirm-delete-${product.id}`}
                          onClick={() => setDeleteConfirmId(product.id)}
                          className="p-2 hover:bg-white/10 text-white/40 hover:text-brand-orange transition-colors"
                        >
                          <Trash2 size={18} />
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
              
              <div className="flex flex-wrap gap-x-8 gap-y-4 mt-4">
                <div>
                  <p className="text-[10px] font-mono text-white/40 uppercase mb-1">PRICE</p>
                  <p className="font-display text-xl text-brand-neon">₹{product.price.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-[10px] font-mono text-white/40 uppercase mb-1">PROTEIN</p>
                  <p className="font-display text-xl">{product.protein}G</p>
                </div>
                <div>
                  <p className="text-[10px] font-mono text-white/40 uppercase mb-1">SOURCE</p>
                  <p className="font-display text-xl truncate max-w-[100px]">{product.protein_source || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-[10px] font-mono text-white/40 uppercase mb-1">CALORIES</p>
                  <p className="font-display text-xl">{product.calories}KCAL</p>
                </div>
                <div>
                  <p className="text-[10px] font-mono text-white/40 uppercase mb-1">TYPE</p>
                  <div className={cn(
                    "font-mono text-[10px] px-2 py-0.5 inline-block border",
                    product.is_veg ? "border-green-500 text-green-500" : "border-red-500 text-red-500"
                  )}>
                    {product.is_veg ? 'VEG' : 'NON-VEG'}
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-mono text-white/40 uppercase mb-1">STATUS</p>
                  <div className={cn(
                    "font-mono text-[10px] px-2 py-0.5 inline-block",
                    product.is_available ? "bg-brand-neon/10 text-brand-neon" : "bg-brand-orange/10 text-brand-orange"
                  )}>
                    {product.is_available ? 'IN_STOCK' : 'UNAVAILABLE'}
                  </div>
                </div>
              </div>

              <div className="absolute bottom-0 right-0 p-2 opacity-5 pointer-events-none">
                <Zap size={60} />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 sm:p-12">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-brand-dark/90 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-2xl bg-brand-gray border-2 border-white/10 flex flex-col max-h-[90vh] shadow-2xl"
            >
              <div className="flex justify-between items-center p-8 pb-4 border-b border-white/5">
                <h3 className="text-4xl font-display">{editingProduct?.id ? 'UPGRADE ASSET' : 'NEW ASSET'}</h3>
                <button onClick={() => setIsModalOpen(false)} className="text-white/40 hover:text-white">
                  <X size={32} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 pt-6 custom-scrollbar">
                <form onSubmit={saveProduct} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Target Menu Segment Form Selector */}
                    <div className="md:col-span-2 space-y-2 bg-brand-dark/40 border border-white/5 p-4 rounded">
                      <label className="font-mono text-[10px] tracking-widest text-brand-neon uppercase font-bold">TARGET MENU SEGMENT</label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-1.5">
                        <button
                          type="button"
                          id="segment-current-btn"
                          onClick={() => setTargetSegment('current')}
                          className={cn(
                            "px-4 py-3 font-mono text-[11px] text-left border transition-all flex flex-col justify-center cursor-pointer",
                            targetSegment === 'current'
                              ? "border-brand-neon bg-brand-neon/10 text-white"
                              : "border-white/10 text-white/50 hover:border-white/30"
                          )}
                        >
                          <span className="font-bold">ONLY CURRENT SEGMENT</span>
                          <span className="text-[9px] text-white/40 uppercase mt-0.5">
                            {activeTab === 'student_menu' ? '🎓 Student Menu Only' : activeTab === 'proff_menu' ? '💼 Professional Menu Only' : '🏆 Elite Athlete Menu Only'}
                          </span>
                        </button>
                        
                        <button
                          type="button"
                          id="segment-all-btn"
                          onClick={() => setTargetSegment('all')}
                          className={cn(
                            "px-4 py-3 font-mono text-[11px] text-left border transition-all flex flex-col justify-center cursor-pointer",
                            targetSegment === 'all'
                              ? "border-brand-neon bg-brand-neon/10 text-white"
                              : "border-white/10 text-white/50 hover:border-white/30"
                          )}
                        >
                          <span className="font-bold text-brand-neon">APPLY GLOBALLY (ALL 3)</span>
                          <span className="text-[9px] text-white/40 uppercase mt-0.5">
                            Sync across Student, Professional & Elite Menus
                          </span>
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="font-mono text-[10px] tracking-widest text-white/60 uppercase">PRODUCT CODE</label>
                      <input 
                        required
                        className="w-full bg-brand-dark border border-white/10 px-4 py-3 font-mono text-sm focus:border-brand-neon outline-none uppercase"
                        value={editingProduct?.code || ''}
                        onChange={(e) => setEditingProduct({ ...editingProduct!, code: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="font-mono text-[10px] tracking-widest text-white/60 uppercase">CATEGORY</label>
                      <input 
                        required
                        className="w-full bg-brand-dark border border-white/10 px-4 py-3 font-mono text-sm focus:border-brand-neon outline-none uppercase"
                        value={editingProduct?.category || ''}
                        onChange={(e) => setEditingProduct({ ...editingProduct!, category: e.target.value })}
                      />
                    </div>
                    <div className="md:col-span-2 space-y-2">
                      <label className="font-mono text-[10px] tracking-widest text-white/60 uppercase">ASSET NAME</label>
                      <input 
                        required
                        className="w-full bg-brand-dark border border-white/10 px-4 py-3 font-mono text-sm focus:border-brand-neon outline-none uppercase"
                        value={editingProduct?.name || ''}
                        onChange={(e) => setEditingProduct({ ...editingProduct!, name: e.target.value })}
                      />
                    </div>
                    <div className="md:col-span-2 space-y-2">
                      <label className="font-mono text-[10px] tracking-widest text-white/60 uppercase">DESCRIPTION</label>
                      <textarea 
                        className="w-full bg-brand-dark border border-white/10 px-4 py-3 font-mono text-sm focus:border-brand-neon outline-none uppercase min-h-[80px]"
                        value={editingProduct?.description || ''}
                        onChange={(e) => setEditingProduct({ ...editingProduct!, description: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="font-mono text-[10px] tracking-widest text-white/60 uppercase">PRICE (₹)</label>
                      <input 
                        required
                        type="number"
                        step="0.01"
                        className="w-full bg-brand-dark border border-white/10 px-4 py-3 font-mono text-sm focus:border-brand-neon outline-none"
                        value={editingProduct?.price ?? ''}
                        onChange={(e) => setEditingProduct({ ...editingProduct!, price: parseFloat(e.target.value) || 0 })}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="font-mono text-[10px] tracking-widest text-white/60 uppercase">PROTEIN CONTENT (G)</label>
                      <input 
                        required
                        type="number"
                        step="0.1"
                        className="w-full bg-brand-dark border border-white/10 px-4 py-3 font-mono text-sm focus:border-brand-neon outline-none"
                        value={editingProduct?.protein ?? ''}
                        onChange={(e) => setEditingProduct({ ...editingProduct!, protein: parseFloat(e.target.value) || 0 })}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="font-mono text-[10px] tracking-widest text-white/60 uppercase">PROTEIN SOURCE</label>
                      <input 
                        className="w-full bg-brand-dark border border-white/10 px-4 py-3 font-mono text-sm focus:border-brand-neon outline-none uppercase"
                        value={editingProduct?.protein_source || ''}
                        onChange={(e) => setEditingProduct({ ...editingProduct!, protein_source: e.target.value })}
                        placeholder="E.G. WHEY ISOLATE, PEA PROTEIN"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="font-mono text-[10px] tracking-widest text-white/60 uppercase">CALORIES (KCAL)</label>
                      <input 
                        required
                        type="number"
                        className="w-full bg-brand-dark border border-white/10 px-4 py-3 font-mono text-sm focus:border-brand-neon outline-none"
                        value={editingProduct?.calories ?? ''}
                        onChange={(e) => setEditingProduct({ ...editingProduct!, calories: parseFloat(e.target.value) || 0 })}
                      />
                    </div>
                    <div className="md:col-span-2 space-y-2">
                      <label className="font-mono text-[10px] tracking-widest text-white/60 uppercase">INGREDIENTS</label>
                      <textarea 
                        className="w-full bg-brand-dark border border-white/10 px-4 py-3 font-mono text-sm focus:border-brand-neon outline-none uppercase min-h-[60px]"
                        value={editingProduct?.ingredients || ''}
                        onChange={(e) => setEditingProduct({ ...editingProduct!, ingredients: e.target.value })}
                        placeholder="E.G. WHEY, STEVIA, COCOA"
                      />
                    </div>
                    <div className="md:col-span-2 space-y-3">
                      <label className="font-mono text-[10px] tracking-widest text-white/60 uppercase">SYSTEM TAGS</label>
                      <div className="flex flex-wrap gap-2">
                        {['S-001', 'P-001', 'E-001', 'HIGH-PROTEIN', 'LOW-CARB', 'KETO', 'VEGAN', 'BULK', 'LEAN', 'PRE-WORKOUT', 'POST-WORKOUT'].map(tag => (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => {
                              const currentTags = editingProduct?.tags || [];
                              const newTags = currentTags.includes(tag)
                                ? currentTags.filter(t => t !== tag)
                                : [...currentTags, tag];
                              setEditingProduct({ ...editingProduct!, tags: newTags });
                            }}
                            className={cn(
                              "px-3 py-1 font-mono text-[10px] border transition-colors",
                              editingProduct?.tags?.includes(tag)
                                ? "bg-brand-neon border-brand-neon text-brand-dark"
                                : "border-white/10 text-white/40 hover:border-white/30"
                            )}
                          >
                            {tag}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="font-mono text-[10px] tracking-widest text-white/60 uppercase">CARBS (G)</label>
                      <input 
                        required
                        type="number"
                        step="0.1"
                        className="w-full bg-brand-dark border border-white/10 px-4 py-3 font-mono text-sm focus:border-brand-neon outline-none"
                        value={editingProduct?.carbs ?? ''}
                        onChange={(e) => setEditingProduct({ ...editingProduct!, carbs: parseFloat(e.target.value) || 0 })}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="font-mono text-[10px] tracking-widest text-white/60 uppercase">FAT (G)</label>
                      <input 
                        required
                        type="number"
                        step="0.1"
                        className="w-full bg-brand-dark border border-white/10 px-4 py-3 font-mono text-sm focus:border-brand-neon outline-none"
                        value={editingProduct?.fat ?? ''}
                        onChange={(e) => setEditingProduct({ ...editingProduct!, fat: parseFloat(e.target.value) || 0 })}
                      />
                    </div>
                    <div className="md:col-span-2 space-y-2">
                      <label className="font-mono text-[10px] tracking-widest text-white/60 uppercase">ASSET IMAGE</label>
                      <div className="flex gap-4">
                        <div className="flex-1">
                          <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-white/10 bg-brand-dark/50 hover:border-brand-neon/50 transition-colors cursor-pointer group">
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                              {selectedFile ? (
                                <p className="font-mono text-[10px] text-brand-neon uppercase">{selectedFile.name}</p>
                              ) : (
                                <>
                                  <Upload className="w-8 h-8 text-white/20 group-hover:text-brand-neon transition-colors mb-2" />
                                  <p className="font-mono text-[10px] text-white/40 uppercase">DOCK IMAGE FILE</p>
                                </>
                              )}
                            </div>
                            <input 
                              type="file" 
                              className="hidden" 
                              accept="image/*"
                              onChange={(e) => {
                                if (e.target.files?.[0]) {
                                  setSelectedFile(e.target.files[0]);
                                }
                              }}
                            />
                          </label>
                        </div>
                        {(selectedFile || editingProduct?.image_url) && (
                          <div className="w-32 h-32 border border-white/10 overflow-hidden bg-white/5">
                            <img 
                              src={selectedFile ? URL.createObjectURL(selectedFile) : editingProduct?.image_url || ''} 
                              alt="Preview" 
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-8">
                    <div className="flex items-center gap-3 py-2">
                      <input 
                        type="checkbox" 
                        id="is_available" 
                        className="w-6 h-6 accent-brand-neon"
                        checked={editingProduct?.is_available || false}
                        onChange={(e) => setEditingProduct({ ...editingProduct!, is_available: e.target.checked })}
                      />
                      <label htmlFor="is_available" className="font-mono text-xs tracking-widest cursor-pointer uppercase">IN STOCK</label>
                    </div>
                    <div className="flex items-center gap-3 py-2">
                      <input 
                        type="checkbox" 
                        id="is_veg" 
                        className="w-6 h-6 accent-green-500"
                        checked={editingProduct?.is_veg || false}
                        onChange={(e) => setEditingProduct({ ...editingProduct!, is_veg: e.target.checked })}
                      />
                      <label htmlFor="is_veg" className="font-mono text-xs tracking-widest cursor-pointer text-green-500 uppercase">VEGETARIAN</label>
                    </div>
                  </div>

                  <div className="pt-6 pb-4">
                    <button 
                      type="submit" 
                      disabled={uploading}
                      className="w-full bg-brand-neon text-brand-dark font-display text-2xl py-4 hover:shadow-[0_0_30px_rgba(212,255,0,0.5)] transition-all uppercase disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {uploading ? (
                        <>
                          <Loader2 className="w-6 h-6 animate-spin" />
                          PROCESSING...
                        </>
                      ) : (
                        'COMMENCE_SAVING'
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
