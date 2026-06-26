import React, { useState } from 'react';
import { 
  Shield, 
  Database, 
  Terminal, 
  Cpu, 
  Globe, 
  Clock,
  Zap,
  Activity,
  AlertTriangle,
  Loader2,
  CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getSupabase } from '../lib/supabase';

export default function Settings() {
  const [confirmWipe, setConfirmWipe] = useState(false);
  const [wiping, setWiping] = useState(false);
  const [wipeResult, setWipeResult] = useState<{ success: boolean; message: string } | null>(null);

  const systemMetrics = [
    { label: 'DATABASE LATENCY', value: '12ms', status: 'optimal', icon: Database },
    { label: 'UPLINK INTEGRITY', value: '99.9%', status: 'optimal', icon: Globe },
    { label: 'CORE TEMPERATURE', value: '42°C', status: 'stable', icon: Cpu },
    { label: 'AUTH PROTOCOL', value: 'AES-256', status: 'active', icon: Shield },
  ];

  const handleWipeOrders = async () => {
    setWiping(true);
    setWipeResult(null);
    try {
      const supabase = getSupabase();
      // Delete all entries from the orders table
      const { error } = await supabase.from('orders').delete().neq('id', -1);
      
      if (error) {
        throw error;
      }
      
      setWipeResult({
        success: true,
        message: 'All orders have been permanently cleared from the database.'
      });
      setConfirmWipe(false);
    } catch (err: any) {
      console.error('Error wiping orders:', err);
      setWipeResult({
        success: false,
        message: err.message || 'An error occurred while wiping order assets.'
      });
    } finally {
      setWiping(false);
    }
  };

  return (
    <div className="space-y-10">
      <header>
        <h2 className="text-5xl font-display leading-tight tracking-tighter">SYSTEM CONTROL</h2>
        <p className="font-mono text-sm text-brand-neon uppercase tracking-widest">Core infrastructure management</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {systemMetrics.map((metric, i) => (
          <motion.div
            key={metric.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="glass-card p-6 border-l-2 border-l-brand-neon"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="p-2 bg-brand-neon/10 text-brand-neon">
                <metric.icon size={20} />
              </div>
              <span className="font-mono text-[10px] text-white/40 tracking-widest">{metric.label}</span>
            </div>
            <div className="flex items-end justify-between">
              <span className="text-3xl font-display">{metric.value}</span>
              <span className="font-mono text-[8px] text-brand-neon uppercase flex items-center gap-1">
                <Activity size={10} /> {metric.status}
              </span>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-card p-8">
            <h3 className="text-2xl font-display mb-6 flex items-center gap-3">
              <Terminal size={24} className="text-brand-neon" />
              OPERATOR LOGS
            </h3>
            <div className="bg-black/40 border border-white/5 p-4 font-mono text-[10px] space-y-2 h-64 overflow-y-auto custom-scrollbar">
              <p className="text-white/40">[ {new Date().toISOString()} ] AUTH_SERVICE: Initializing handshake...</p>
              <p className="text-brand-neon">[ {new Date().toISOString()} ] DB_UPLINK: Connection established with Supabase Cloud</p>
              <p className="text-white/40">[ {new Date().toISOString()} ] CACHE_HIT: 94% efficiency on inventory queries</p>
              <p className="text-brand-orange">[ {new Date().toISOString()} ] WARN: High traffic detected in sector-7</p>
              <p className="text-white/40">[ {new Date().toISOString()} ] SYSTEM: Cooling fans engaged @ 4000RPM</p>
              <p className="text-brand-neon">[ {new Date().toISOString()} ] SYNC: Inventory matrix synchronized across nodes</p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="glass-card p-8">
            <h3 className="text-2xl font-display mb-6">PROTOCOLS</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 border border-white/5 bg-white/5">
                <span className="font-mono text-xs text-white/60">DARK MODE</span>
                <div className="w-10 h-5 bg-brand-neon rounded-full p-1 relative">
                  <div className="w-3 h-3 bg-brand-dark rounded-full absolute right-1" />
                </div>
              </div>
              <div className="flex items-center justify-between p-3 border border-white/5 bg-white/5 opacity-50">
                <span className="font-mono text-xs text-white/60">AUTO-ARCHIVE</span>
                <div className="w-10 h-5 bg-white/10 rounded-full p-1 relative">
                  <div className="w-3 h-3 bg-white/40 rounded-full absolute left-1" />
                </div>
              </div>
              <div className="flex items-center justify-between p-3 border border-white/5 bg-white/5">
                <span className="font-mono text-xs text-white/60">REAL-TIME SYNC</span>
                <div className="w-10 h-5 bg-brand-neon rounded-full p-1 relative">
                  <div className="w-3 h-3 bg-brand-dark rounded-full absolute right-1" />
                </div>
              </div>
            </div>
          </div>

          <div className="glass-card p-8 border-brand-orange/30 relative overflow-hidden">
            <h3 className="text-2xl font-display text-brand-orange mb-2">DANGER ZONE</h3>
            <p className="font-mono text-[10px] text-white/40 mb-6 uppercase tracking-wider">Destructive core actions</p>
            
            {wipeResult && (
              <div className={`p-4 mb-4 border font-mono text-[11px] uppercase ${wipeResult.success ? 'border-brand-neon bg-brand-neon/5 text-brand-neon' : 'border-brand-orange bg-brand-orange/5 text-brand-orange'}`}>
                <div className="flex items-start gap-2">
                  {wipeResult.success ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
                  <div>
                    <span className="font-bold">{wipeResult.success ? 'SUCCESS' : 'FAILED'}</span>
                    <p className="text-[10px] text-white/70 mt-1 leading-relaxed">{wipeResult.message}</p>
                  </div>
                </div>
              </div>
            )}

            {confirmWipe ? (
              <div className="space-y-4 border border-brand-orange/20 bg-brand-orange/5 p-4 rounded mb-4">
                <div className="flex gap-2 text-brand-orange">
                  <AlertTriangle size={20} className="shrink-0" />
                  <div className="font-mono text-[10px] leading-relaxed uppercase">
                    <span className="font-black text-xs block mb-1">ARE YOU ABSOLUTELY SURE?</span>
                    This will permanently delete <span className="text-white font-bold">ALL order entries</span> across the entire database. This action is irreversible.
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    disabled={wiping}
                    onClick={handleWipeOrders}
                    className="flex-1 py-2 bg-brand-orange hover:bg-brand-orange/80 disabled:opacity-50 text-brand-dark font-mono text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    {wiping ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        WIPING...
                      </>
                    ) : (
                      'YES, WIPE ALL ORDERS'
                    )}
                  </button>
                  <button
                    disabled={wiping}
                    onClick={() => setConfirmWipe(false)}
                    className="px-4 py-2 border border-white/20 text-white/80 hover:text-white hover:border-white/40 font-mono text-xs uppercase tracking-wider transition-all cursor-pointer"
                  >
                    CANCEL
                  </button>
                </div>
              </div>
            ) : (
              <button 
                id="wipe-all-assets-btn"
                disabled={wiping}
                onClick={() => {
                  setConfirmWipe(true);
                  setWipeResult(null);
                }}
                className="w-full py-4 border border-brand-orange/30 text-brand-orange font-display text-lg tracking-widest hover:bg-brand-orange hover:text-brand-dark transition-all cursor-pointer disabled:opacity-50"
              >
                WIPE ALL ORDERS
              </button>
            )}

            <div className="mt-4 p-3 bg-white/5 border border-white/5 rounded">
              <span className="font-mono text-[9px] text-white/30 uppercase block font-bold mb-1">PROTECTION SCOPE:</span>
              <p className="font-mono text-[9px] text-white/50 leading-relaxed uppercase">
                Only order history data will be cleared. Your active offers, subscriptions, coupon codes, and inventory menu segments are completely preserved.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
