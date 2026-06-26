import React, { useState, useEffect } from 'react';
import { getSupabase } from '../lib/supabase';
import { Coupon } from '../types';
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  Tag,
  AlertCircle,
  X,
  Loader2,
  Calendar
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

export default function CouponManager() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Partial<Coupon> | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [saving, setSaving] = useState(false);
  const [configError, setConfigError] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    try {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        throw error;
      }
      if (data) Object.freeze(data);
      setCoupons(data || []);
    } catch (e: any) {
      setConfigError(e.message);
    }
    setLoading(false);
  };

  const saveCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCoupon) return;

    setSaving(true);
    try {
      const supabase = getSupabase();

      if (editingCoupon.expires_at) {
        const expiryDate = new Date(editingCoupon.expires_at);
        if (expiryDate <= new Date()) {
          alert('Expiry date must be in the future.');
          setSaving(false);
          return;
        }
      }

      const finalCoupon = {
        code: editingCoupon.code?.toUpperCase(),
        discount_type: editingCoupon.discount_type,
        discount_value: editingCoupon.discount_value,
        min_order_value: editingCoupon.min_order_value || 0,
        is_active: editingCoupon.is_active ?? true,
        times_used: editingCoupon.times_used || 0,
        max_uses: editingCoupon.max_uses || null,
        expires_at: editingCoupon.expires_at || null
      };

      if (editingCoupon.id) {
        const { error } = await (supabase.from('coupons') as any).update(finalCoupon).eq('id', editingCoupon.id);
        if (error) throw error;
      } else {
        const { error } = await (supabase.from('coupons') as any).insert([finalCoupon]);
        if (error) throw error;
      }
      
      setIsModalOpen(false);
      setEditingCoupon(null);
      fetchCoupons();
    } catch (e: any) {
      console.error('Save Coupon Failed:', e);
      let errorMsg = e.message || 'Unknown database rejection';
      alert(`SYSTEM ERROR: ${errorMsg}`);
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (coupon: Coupon) => {
    try {
      const supabase = getSupabase();
      const updatedStatus = !coupon.is_active;
      
      const { error } = await (supabase.from('coupons') as any)
        .update({ is_active: updatedStatus })
        .eq('id', coupon.id);
        
      if (error) throw error;
      
      setCoupons(coupons.map(c => c.id === coupon.id ? { ...c, is_active: updatedStatus } : c));
    } catch (e: any) {
      alert(`SYSTEM ERROR: ${e.message}`);
    }
  };

  const deleteCoupon = async (id: string) => {
    try {
      const supabase = getSupabase();
      await supabase.from('coupons').delete().eq('id', id);
      fetchCoupons();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setDeleteConfirmId(null);
    }
  };

  const filteredCoupons = coupons.filter(c => 
    c.code.toLowerCase().includes(searchQuery.toLowerCase())
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
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-5xl font-display leading-tight tracking-tighter">PROMOTIONS</h2>
          <p className="font-mono text-sm text-brand-neon uppercase tracking-widest">Active Coupon Management</p>
        </div>
        <button 
          onClick={() => {
            setEditingCoupon({ 
              is_active: true, 
              discount_type: 'percentage',
              discount_value: 0,
              min_order_value: 0,
              times_used: 0
            });
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 bg-brand-neon text-brand-dark px-6 py-3 font-display text-xl hover:shadow-[0_0_20px_rgba(212,255,0,0.4)] transition-all"
        >
          <Plus size={24} />
          ADD COUPON
        </button>
      </header>

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row gap-4 p-4 glass-card">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={18} />
          <input 
            type="text" 
            placeholder="SEARCH BY COUPON CODE..."
            className="w-full bg-brand-dark/50 border border-white/10 px-10 py-3 font-mono text-xs focus:border-brand-neon outline-none transition-colors uppercase tracking-widest"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <div className="px-4 py-3 border border-white/10 text-brand-neon font-mono text-xs flex items-center gap-2">
            TOTAL: {coupons.length}
          </div>
        </div>
      </div>

      {/* List */}
      <div className="overflow-hidden border border-white/5 rounded-lg glass-card">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-white/5 border-b border-white/10 font-mono text-[10px] text-white/40 tracking-[0.3em] uppercase">
              <th className="p-4 pl-8">Code</th>
              <th className="p-4">Type</th>
              <th className="p-4">Value</th>
              <th className="p-4">Min Order</th>
              <th className="p-4">Usage Count</th>
              <th className="p-4">Expiry</th>
              <th className="p-4 text-center">Status</th>
              <th className="p-4 text-right pr-8">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {filteredCoupons.map((coupon) => (
              <motion.tr 
                key={coupon.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="group hover:bg-white/5 transition-colors cursor-default"
              >
                <td className="p-4 pl-8">
                  <div className="flex items-center gap-2">
                    <Tag size={12} className="text-white/20" />
                    <span className="font-display text-xl text-brand-neon transition-colors uppercase">{coupon.code}</span>
                  </div>
                </td>
                <td className="p-4">
                  <span className="font-mono text-xs text-white/60 tracking-widest uppercase">
                    {coupon.discount_type === 'percentage' ? '%' : 'FLAT'}
                  </span>
                </td>
                <td className="p-4">
                  <span className="font-display text-lg">
                    {coupon.discount_type === 'percentage' 
                      ? `${coupon.discount_value}%` 
                      : `₹${coupon.discount_value.toFixed(2)}`}
                  </span>
                </td>
                <td className="p-4">
                  <span className="font-mono text-xs text-white/60">
                    ₹{(coupon.min_order_value || 0).toFixed(2)}
                  </span>
                </td>
                <td className="p-4">
                  <span className="font-mono text-xs text-white/60 flex items-center gap-1">
                    {coupon.times_used || 0} / {coupon.max_uses || <span className="text-lg leading-none">∞</span>}
                  </span>
                </td>
                <td className="p-4">
                  <span className={cn("font-mono text-xs flex items-center gap-1", coupon.expires_at && new Date(coupon.expires_at) < new Date() ? "text-brand-orange" : "text-white/60")}>
                    {coupon.expires_at ? new Date(coupon.expires_at).toLocaleDateString() : 'NEVER'}
                  </span>
                </td>
                <td className="p-4">
                  <div className="flex justify-center">
                    {coupon.expires_at && new Date(coupon.expires_at) < new Date() ? (
                        <span className="px-3 py-1 flex items-center gap-2 rounded-full font-mono text-[9px] tracking-widest uppercase bg-brand-orange/10 text-brand-orange border border-brand-orange/30">EXPIRED</span>
                    ) : (
                      <button 
                        onClick={() => toggleStatus(coupon)}
                        className={cn(
                          "px-3 py-1 flex items-center gap-2 rounded-full font-mono text-[9px] tracking-widest uppercase cursor-pointer hover:opacity-80 transition-opacity",
                          coupon.is_active ? "bg-green-500/10 text-green-500 border border-green-500/30" : "bg-white/10 text-white/40 border border-white/20"
                        )}
                      >
                        {coupon.is_active ? 'ACTIVE' : 'INACTIVE'}
                      </button>
                    )}
                  </div>
                </td>
                <td className="p-4 text-right pr-8">
                  <div className="flex gap-2 justify-end items-center">
                    {deleteConfirmId === coupon.id ? (
                      <div className="flex items-center gap-1.5 bg-brand-dark/40 border border-brand-orange/30 px-2 py-1 rounded">
                        <span className="font-mono text-[8px] text-brand-orange uppercase animate-pulse">SURE?</span>
                        <button 
                          onClick={() => deleteCoupon(coupon.id)}
                          className="font-mono text-[9px] uppercase text-red-500 hover:text-red-400 font-bold transition-colors cursor-pointer"
                        >
                          YES
                        </button>
                        <span className="text-white/20 text-[9px]">|</span>
                        <button 
                          onClick={() => setDeleteConfirmId(null)}
                          className="font-mono text-[9px] uppercase text-white/40 hover:text-white transition-colors cursor-pointer"
                        >
                          NO
                        </button>
                      </div>
                    ) : (
                      <>
                        <button 
                          onClick={() => {
                            setEditingCoupon(coupon);
                            setIsModalOpen(true);
                          }}
                          className="p-2 hover:bg-white/10 text-white/40 hover:text-white transition-colors"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          onClick={() => setDeleteConfirmId(coupon.id)}
                          className="p-2 hover:bg-white/10 text-white/40 hover:text-brand-orange transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </motion.tr>
            ))}
            {filteredCoupons.length === 0 && (
               <tr>
                 <td colSpan={8} className="p-8 text-center text-white/20 font-mono text-xs tracking-widest uppercase">
                   No coupons found
                 </td>
               </tr>
            )}
          </tbody>
        </table>
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
              className="relative w-full max-w-lg bg-brand-gray border-2 border-white/10 flex flex-col shadow-2xl"
            >
              <div className="flex justify-between items-center p-8 pb-4 border-b border-white/5">
                <h3 className="text-4xl font-display">{editingCoupon?.id ? 'EDIT COUPON' : 'NEW COUPON'}</h3>
                <button onClick={() => setIsModalOpen(false)} className="text-white/40 hover:text-white">
                  <X size={32} />
                </button>
              </div>

              <div className="p-8 pt-6">
                <form onSubmit={saveCoupon} className="space-y-6">
                  <div className="space-y-2">
                    <label className="font-mono text-[10px] tracking-widest text-white/60 uppercase">COUPON CODE (WILL BE CAPITALIZED)</label>
                    <input 
                      required
                      className="w-full bg-brand-dark border border-white/10 px-4 py-3 font-mono text-sm focus:border-brand-neon outline-none uppercase"
                      value={editingCoupon?.code || ''}
                      onChange={(e) => setEditingCoupon({ ...editingCoupon!, code: e.target.value.toUpperCase() })}
                      placeholder="E.G. NEW50"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="font-mono text-[10px] tracking-widest text-white/60 uppercase">DISCOUNT TYPE</label>
                      <div className="relative">
                        <select 
                          className="w-full bg-brand-dark border border-white/10 px-4 py-3 font-mono text-sm focus:border-brand-neon outline-none appearance-none uppercase"
                          value={editingCoupon?.discount_type || 'percentage'}
                          onChange={(e) => setEditingCoupon({ ...editingCoupon!, discount_type: e.target.value as 'percentage' | 'fixed' })}
                        >
                          <option value="percentage">Percentage (%)</option>
                          <option value="fixed">Fixed Amount (₹)</option>
                        </select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="font-mono text-[10px] tracking-widest text-white/60 uppercase">
                        VALUE {editingCoupon?.discount_type === 'percentage' ? '(%)' : '(₹)'}
                      </label>
                      <input 
                        required
                        type="number"
                        step={editingCoupon?.discount_type === 'percentage' ? "0.1" : "0.01"}
                        className="w-full bg-brand-dark border border-white/10 px-4 py-3 font-mono text-sm focus:border-brand-neon outline-none"
                        value={editingCoupon?.discount_value ?? ''}
                        onChange={(e) => setEditingCoupon({ ...editingCoupon!, discount_value: parseFloat(e.target.value) || 0 })}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="font-mono text-[10px] tracking-widest text-white/60 uppercase">MINIMUM ORDER VALUE (₹)</label>
                      <input 
                        required
                        type="number"
                        step="0.01"
                        className="w-full bg-brand-dark border border-white/10 px-4 py-3 font-mono text-sm focus:border-brand-neon outline-none"
                        value={editingCoupon?.min_order_value ?? 0}
                        onChange={(e) => setEditingCoupon({ ...editingCoupon!, min_order_value: parseFloat(e.target.value) || 0 })}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="font-mono text-[10px] tracking-widest text-white/60 uppercase">MAXIMUM USES (OPTIONAL)</label>
                      <input 
                        type="number"
                        min="1"
                        placeholder="UNLIMITED"
                        className="w-full bg-brand-dark border border-white/10 px-4 py-3 font-mono text-sm focus:border-brand-neon outline-none"
                        value={editingCoupon?.max_uses ?? ''}
                        onChange={(e) => setEditingCoupon({ ...editingCoupon!, max_uses: e.target.value ? parseInt(e.target.value) : null })}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="font-mono text-[10px] tracking-widest text-white/60 uppercase">EXPIRY DATE (OPTIONAL)</label>
                    <input 
                      type="datetime-local"
                      className="w-full bg-brand-dark border border-white/10 px-4 py-3 font-mono text-sm focus:border-brand-neon outline-none"
                      value={editingCoupon?.expires_at ? new Date(new Date(editingCoupon.expires_at).getTime() - new Date(editingCoupon.expires_at).getTimezoneOffset() * 60000).toISOString().slice(0, 16) : ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        setEditingCoupon({ ...editingCoupon!, expires_at: val ? new Date(val).toISOString() : null });
                      }}
                    />
                  </div>
                  
                  <div className="flex items-center gap-3 py-2">
                    <input 
                      type="checkbox" 
                      id="is_active" 
                      className="w-6 h-6 accent-brand-neon"
                      checked={editingCoupon?.is_active ?? true}
                      onChange={(e) => setEditingCoupon({ ...editingCoupon!, is_active: e.target.checked })}
                    />
                    <label htmlFor="is_active" className="font-mono text-xs tracking-widest cursor-pointer uppercase">ACTIVATE IMMEDIATELY</label>
                  </div>

                  <div className="pt-6">
                    <button 
                      type="submit" 
                      disabled={saving}
                      className="w-full bg-brand-neon text-brand-dark font-display text-2xl py-4 hover:shadow-[0_0_30px_rgba(212,255,0,0.5)] transition-all uppercase disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {saving ? (
                        <>
                          <Loader2 className="w-6 h-6 animate-spin" />
                          PROCESSING...
                        </>
                      ) : (
                        'SAVE PROMOTION'
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
