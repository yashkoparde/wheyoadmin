import React, { useState } from 'react';
import { getSupabase } from '../lib/supabase';
import { motion } from 'motion/react';
import { Lock, Cpu, Loader2, AlertCircle } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const supabase = getSupabase();
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-dark flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background Grid Accent */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
           style={{ backgroundImage: 'radial-gradient(#D4FF00 1px, transparent 0)', backgroundSize: '40px 40px' }} />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="flex items-center gap-4 mb-12">
          <div className="bg-brand-neon p-3">
            <Lock className="w-8 h-8 text-brand-dark" />
          </div>
          <div>
            <h1 className="text-4xl font-display leading-none tracking-tight">WHEYO</h1>
            <p className="text-[10px] font-mono text-brand-neon tracking-[0.4em] uppercase mt-1">Authorization Required</p>
          </div>
        </div>

        <div className="glass-card p-8 border-white/10">
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="font-mono text-[10px] tracking-widest text-white/40 uppercase flex items-center gap-2">
                <Cpu size={12} /> Personnel ID (Email)
              </label>
              <input 
                type="email"
                required
                className="w-full bg-brand-dark/50 border border-white/10 px-4 py-3 font-mono text-sm focus:border-brand-neon outline-none text-white transition-all"
                placeholder="ADMIN@WHEYO.SYSTEM"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="font-mono text-[10px] tracking-widest text-white/40 uppercase">Access Cipher (Password)</label>
              <input 
                type="password"
                required
                className="w-full bg-brand-dark/50 border border-white/10 px-4 py-3 font-mono text-sm focus:border-brand-neon outline-none text-white transition-all"
                placeholder="********"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {error && (
              <div className="p-4 bg-brand-orange/10 border border-brand-orange/30 flex items-center gap-3 text-brand-orange">
                <AlertCircle size={18} />
                <p className="font-mono text-[10px] uppercase">{error}</p>
              </div>
            )}

            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-brand-neon text-brand-dark font-display text-2xl py-4 hover:shadow-[0_0_30px_rgba(212,255,0,0.5)] transition-all flex items-center justify-center gap-3"
            >
              {loading ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin" />
                  AUTHENTICATING...
                </>
              ) : (
                'INITIALIZE SESSION'
              )}
            </button>
          </form>

          <div className="mt-8 pt-8 border-t border-white/5">
            <div className="flex justify-between items-center opacity-20 group">
              <div className="h-[1px] flex-1 bg-white" />
              <span className="font-mono text-[8px] mx-4 tracking-[0.5em] uppercase">Security Level 4</span>
              <div className="h-[1px] flex-1 bg-white" />
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
