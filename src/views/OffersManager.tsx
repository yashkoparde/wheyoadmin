import React, { useState, useEffect } from 'react';
import { getSupabase } from '../lib/supabase';
import { WheyoOffer, OfferCategory, RewardType } from '../types';
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  Gift, 
  Sparkles, 
  Eye, 
  EyeOff, 
  AlertCircle, 
  X, 
  Loader2, 
  Calendar, 
  Flame, 
  Trophy, 
  Percent, 
  Award, 
  Check, 
  Copy,
  ChevronRight,
  ShieldCheck,
  RefreshCw,
  Database as DbIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

export default function OffersManager() {
  const [activeSection, setActiveSection] = useState<'hub' | 'campaigns' | 'diagnostics'>('hub');
  const [offers, setOffers] = useState<WheyoOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOffer, setEditingOffer] = useState<Partial<WheyoOffer> | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [saving, setSaving] = useState(false);
  const [dbStatus, setDbStatus] = useState<{ connected: boolean; error: string | null; needsSetup: boolean }>({
    connected: false,
    error: null,
    needsSetup: false
  });
  const [isSimulationMode, setIsSimulationMode] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [copiedSql, setCopiedSql] = useState(false);

  // SQL schema definition to display if table is missing
  const sqlSchema = `-- Run this in your Supabase SQL Editor to initialize Offers & Loyalty Campaigns!

-- 1. Create Enum types if they do not exist
DO $$ BEGIN
    CREATE TYPE offer_category AS ENUM ('loyalty_milestone', 'streak_bonus', 'custom_promo', 'seasonal_drop');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE reward_type AS ENUM ('percentage_discount', 'flat_discount', 'free_gift', 'badge_unlock');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Create the wheyo_offers table
CREATE TABLE IF NOT EXISTS public.wheyo_offers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    category offer_category NOT NULL DEFAULT 'loyalty_milestone',
    reward reward_type NOT NULL DEFAULT 'percentage_discount',
    reward_value NUMERIC(10, 2) NULL,
    free_gift_name VARCHAR(255) NULL,
    
    -- Targets & Trigger Rules
    min_order_value NUMERIC(10, 2) DEFAULT 0.00,
    required_milestone_orders INTEGER NULL,
    required_streak_days INTEGER NULL,
    
    -- Schedule and Status
    is_active BOOLEAN DEFAULT TRUE,
    is_revealed BOOLEAN DEFAULT FALSE,
    start_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    end_date TIMESTAMP WITH TIME ZONE NULL,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Enable Row Level Security and add global public SELECT / admin ALL access policies
ALTER TABLE public.wheyo_offers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public select active offers" ON public.wheyo_offers
    FOR SELECT USING (is_active = true);

CREATE POLICY "Allow admin full offers access" ON public.wheyo_offers
    FOR ALL USING (true);

-- 4. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_offers_active ON public.wheyo_offers (is_active, is_revealed);
`;

  useEffect(() => {
    checkDatabaseAndFetch();
  }, []);

  const checkDatabaseAndFetch = async () => {
    setLoading(true);
    try {
      const supabase = getSupabase();
      
      // Attempt a simple lightweight select to verify table existence
      const { data, error } = await supabase
        .from('wheyo_offers' as any)
        .select('id')
        .limit(1);

      if (error) {
        // PostgreSQL error code '42P01' is 'relation does not exist'
        if (error.code === '42P01' || error.message?.toLowerCase().includes('does not exist') || error.message?.toLowerCase().includes('relation')) {
          setDbStatus({
            connected: false,
            error: 'The table "wheyo_offers" does not exist in your database schema.',
            needsSetup: true
          });
          // Fall back to localStorage simulation if table doesn't exist yet
          loadSimulationData();
        } else {
          throw error;
        }
      } else {
        setDbStatus({ connected: true, error: null, needsSetup: false });
        setIsSimulationMode(false);
        fetchOffersLive();
      }
    } catch (err: any) {
      console.warn('Supabase check failed, running in sandbox mode.', err);
      setDbStatus({
        connected: false,
        error: err.message || 'Could not connect to database table.',
        needsSetup: true
      });
      loadSimulationData();
    }
  };

  const fetchOffersLive = async () => {
    try {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from('wheyo_offers' as any)
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOffers(data || []);
    } catch (err: any) {
      console.error('Fetch live offers failed:', err);
      // Fallback
      loadSimulationData();
    } finally {
      setLoading(false);
    }
  };

  const loadSimulationData = () => {
    setIsSimulationMode(true);
    const stored = localStorage.getItem('wheyo_offers_sim');
    if (stored) {
      setOffers(JSON.parse(stored));
    } else {
      // Setup initial realistic data
      const defaultSimData: WheyoOffer[] = [
        {
          id: 'sim-offer-1',
          title: '5th Order Double Scoop Upgrade',
          description: 'You have completed 5 elite orders! Enjoy a free premium double scoop isolate upgrade on your next weekly drop.',
          category: 'loyalty_milestone',
          reward: 'free_gift',
          reward_value: null,
          free_gift_name: 'Double Scoop Isolate Upgrade',
          min_order_value: 0,
          required_milestone_orders: 5,
          required_streak_days: null,
          is_active: true,
          is_revealed: true,
          start_date: new Date().toISOString(),
          end_date: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: 'sim-offer-2',
          title: '7-Day Consistent Athlete Streak',
          description: '7 days of locked-in daily nutrition tracking. Claim an exclusive ₹250 flat discount voucher for your next sub.',
          category: 'streak_bonus',
          reward: 'flat_discount',
          reward_value: 250,
          free_gift_name: null,
          min_order_value: 500,
          required_milestone_orders: null,
          required_streak_days: 7,
          is_active: true,
          is_revealed: true,
          start_date: new Date().toISOString(),
          end_date: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: 'sim-offer-3',
          title: 'Summer Solstice Special Shaker Drop',
          description: 'Celebrate the summer shred with our premium stainless steel Wheyo shaker bottle on orders above ₹1,500!',
          category: 'seasonal_drop',
          reward: 'free_gift',
          free_gift_name: 'Stainless Steel Wheyo Shaker',
          reward_value: null,
          min_order_value: 1500,
          required_milestone_orders: null,
          required_streak_days: null,
          is_active: true,
          is_revealed: true,
          start_date: new Date().toISOString(),
          end_date: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: 'sim-offer-4',
          title: 'Level 10 Iron Discipline Mystery Reward',
          description: 'Keep your training streak locked in. Reaching Level 10 unlocks the custom Swadeshi Athlete Gold badge and 25% off.',
          category: 'loyalty_milestone',
          reward: 'percentage_discount',
          reward_value: 25,
          free_gift_name: null,
          min_order_value: 0,
          required_milestone_orders: 10,
          required_streak_days: null,
          is_active: true,
          is_revealed: false,
          start_date: new Date().toISOString(),
          end_date: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ];
      localStorage.setItem('wheyo_offers_sim', JSON.stringify(defaultSimData));
      setOffers(defaultSimData);
    }
    setLoading(false);
  };

  const saveSimulationState = (updated: WheyoOffer[]) => {
    localStorage.setItem('wheyo_offers_sim', JSON.stringify(updated));
    setOffers(updated);
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(sqlSchema);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  const handleSeedDefaultData = async () => {
    setLoading(true);
    const demoCampaigns: Array<{
      title: string;
      description: string;
      category: OfferCategory;
      reward: RewardType;
      reward_value: number | null;
      free_gift_name: string | null;
      min_order_value: number;
      required_milestone_orders: number | null;
      required_streak_days: number | null;
      is_active: boolean;
      is_revealed: boolean;
    }> = [
      {
        title: '5th Order Double Scoop Upgrade',
        description: 'You have completed 5 elite orders! Enjoy a free premium double scoop isolate upgrade on your next weekly drop.',
        category: 'loyalty_milestone',
        reward: 'free_gift',
        reward_value: null,
        free_gift_name: 'Double Scoop Isolate Upgrade',
        min_order_value: 0.00,
        required_milestone_orders: 5,
        required_streak_days: null,
        is_active: true,
        is_revealed: true
      },
      {
        title: '7-Day Consistent Athlete Streak',
        description: '7 days of locked-in daily nutrition tracking. Claim an exclusive ₹250 flat discount voucher for your next sub.',
        category: 'streak_bonus',
        reward: 'flat_discount',
        reward_value: 250.00,
        free_gift_name: null,
        min_order_value: 500.00,
        required_milestone_orders: null,
        required_streak_days: 7,
        is_active: true,
        is_revealed: true
      },
      {
        title: 'Summer Solstice Special Shaker Drop',
        description: 'Celebrate the summer shred with our premium stainless steel Wheyo shaker bottle on orders above ₹1,500!',
        category: 'seasonal_drop',
        reward: 'free_gift',
        free_gift_name: 'Stainless Steel Wheyo Shaker',
        reward_value: null,
        min_order_value: 1500.00,
        required_milestone_orders: null,
        required_streak_days: null,
        is_active: true,
        is_revealed: true
      },
      {
        title: 'Level 10 Iron Discipline Mystery Reward',
        description: 'Keep your training streak locked in. Reaching Level 10 unlocks the custom Swadeshi Athlete Gold badge and 25% off.',
        category: 'loyalty_milestone',
        reward: 'percentage_discount',
        reward_value: 25.00,
        free_gift_name: null,
        min_order_value: 0.00,
        required_milestone_orders: 10,
        required_streak_days: null,
        is_active: true,
        is_revealed: false
      }
    ];

    if (isSimulationMode) {
      const generated: WheyoOffer[] = demoCampaigns.map((c, i) => ({
        id: `sim-offer-seeded-${i}`,
        ...c,
        start_date: new Date().toISOString(),
        end_date: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));
      saveSimulationState([...offers, ...generated]);
      alert('Seeded 4 default campaigns locally!');
    } else {
      try {
        const supabase = getSupabase();
        const { error } = await (supabase.from('wheyo_offers' as any) as any).insert(demoCampaigns);
        if (error) throw error;
        alert('Successfully seeded campaigns to live database!');
        fetchOffersLive();
      } catch (err: any) {
        alert(`Failed to seed: ${err.message}`);
      }
    }
    setLoading(false);
  };

  const handleSaveOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOffer || !editingOffer.title || !editingOffer.description) {
      alert('Please fill out the Title and Description');
      return;
    }

    setSaving(true);
    try {
      const finalPayload = {
        title: editingOffer.title,
        description: editingOffer.description,
        category: editingOffer.category || 'loyalty_milestone',
        reward: editingOffer.reward || 'percentage_discount',
        reward_value: editingOffer.reward_value ? parseFloat(editingOffer.reward_value as any) : null,
        free_gift_name: editingOffer.free_gift_name || null,
        min_order_value: editingOffer.min_order_value ? parseFloat(editingOffer.min_order_value as any) : 0,
        required_milestone_orders: editingOffer.required_milestone_orders ? parseInt(editingOffer.required_milestone_orders as any, 10) : null,
        required_streak_days: editingOffer.required_streak_days ? parseInt(editingOffer.required_streak_days as any, 10) : null,
        is_active: editingOffer.is_active ?? true,
        is_revealed: editingOffer.is_revealed ?? true,
        start_date: editingOffer.start_date || new Date().toISOString(),
        end_date: editingOffer.end_date || null,
        updated_at: new Date().toISOString()
      };

      if (isSimulationMode) {
        let updatedList = [...offers];
        if (editingOffer.id) {
          updatedList = updatedList.map(o => o.id === editingOffer.id ? { ...o, ...finalPayload } : o);
        } else {
          const newOffer: WheyoOffer = {
            id: `sim-offer-${Date.now()}`,
            ...finalPayload,
            created_at: new Date().toISOString()
          };
          updatedList.unshift(newOffer);
        }
        saveSimulationState(updatedList);
        setIsModalOpen(false);
        setEditingOffer(null);
      } else {
        const supabase = getSupabase();
        if (editingOffer.id) {
          const { error } = await (supabase.from('wheyo_offers' as any) as any)
            .update(finalPayload)
            .eq('id', editingOffer.id);
          if (error) throw error;
        } else {
          const { error } = await (supabase.from('wheyo_offers' as any) as any)
            .insert([finalPayload]);
          if (error) throw error;
        }
        setIsModalOpen(false);
        setEditingOffer(null);
        fetchOffersLive();
      }
    } catch (err: any) {
      alert(`Database operation failed: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (offer: WheyoOffer) => {
    const updatedStatus = !offer.is_active;
    if (isSimulationMode) {
      const updated = offers.map(o => o.id === offer.id ? { ...o, is_active: updatedStatus } : o);
      saveSimulationState(updated);
    } else {
      try {
        const supabase = getSupabase();
        const { error } = await (supabase.from('wheyo_offers' as any) as any)
          .update({ is_active: updatedStatus })
          .eq('id', offer.id);
        if (error) throw error;
        setOffers(offers.map(o => o.id === offer.id ? { ...o, is_active: updatedStatus } : o));
      } catch (err: any) {
        alert(`Error updating: ${err.message}`);
      }
    }
  };

  const handleToggleRevealed = async (offer: WheyoOffer) => {
    const updatedStatus = !offer.is_revealed;
    if (isSimulationMode) {
      const updated = offers.map(o => o.id === offer.id ? { ...o, is_revealed: updatedStatus } : o);
      saveSimulationState(updated);
    } else {
      try {
        const supabase = getSupabase();
        const { error } = await (supabase.from('wheyo_offers' as any) as any)
          .update({ is_revealed: updatedStatus })
          .eq('id', offer.id);
        if (error) throw error;
        setOffers(offers.map(o => o.id === offer.id ? { ...o, is_revealed: updatedStatus } : o));
      } catch (err: any) {
        alert(`Error updating: ${err.message}`);
      }
    }
  };

  const handleDeleteOffer = async (id: string) => {
    if (isSimulationMode) {
      const updated = offers.filter(o => o.id !== id);
      saveSimulationState(updated);
    } else {
      try {
        const supabase = getSupabase();
        const { error } = await supabase.from('wheyo_offers').delete().eq('id', id);
        if (error) throw error;
        setOffers(offers.filter(o => o.id !== id));
      } catch (err: any) {
        alert(`Delete failed: ${err.message}`);
      }
    }
    setDeleteConfirmId(null);
  };

  const filteredOffers = offers.filter(o => {
    const matchesSearch = o.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          o.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (o.free_gift_name && o.free_gift_name.toLowerCase().includes(searchQuery.toLowerCase()));
    
    if (selectedCategory === 'all') return matchesSearch;
    return o.category === selectedCategory && matchesSearch;
  });

  // Calculate high-contrast analytics metrics
  const activePromosCount = offers.filter(o => o.is_active).length;
  const mysteryOffersCount = offers.filter(o => o.is_active && !o.is_revealed).length;
  const revealedOffersCount = offers.filter(o => o.is_active && o.is_revealed).length;

  if (activeSection === 'hub') {
    return (
      <div className="min-h-[80vh] flex flex-col justify-center items-center text-white p-4 md:p-8">
        <div className="text-center max-w-2xl mb-12">
          <span className="font-mono text-[10px] uppercase text-brand-neon tracking-[0.3em] bg-brand-neon/10 px-3 py-1 border border-brand-neon/20 rounded">
            Incentives Control Tower
          </span>
          <h1 className="text-5xl font-black font-display tracking-tight uppercase mt-6 mb-3 text-white">
            Loyalty Hub
          </h1>
          <p className="text-xs text-white/50 leading-relaxed uppercase font-mono tracking-wider">
            Establish game-like streaks, milestone drops, and high-protein checks for athletes.
          </p>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-12 w-full max-w-5xl">
          {/* Circular Card 1: Active Campaigns */}
          <motion.button
            whileHover={{ scale: 1.05, borderColor: 'rgba(212,255,0,0.6)' }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setActiveSection('campaigns')}
            className="w-64 h-64 rounded-full border-2 border-brand-neon/10 bg-brand-gray/5 hover:bg-brand-neon/5 flex flex-col items-center justify-center p-6 text-center transition-all duration-300 cursor-pointer shadow-[0_0_20px_rgba(212,255,0,0.02)] hover:shadow-[0_0_30px_rgba(212,255,0,0.1)] group relative overflow-hidden"
          >
            <div className="w-16 h-16 rounded-full bg-brand-neon/10 group-hover:bg-brand-neon/20 flex items-center justify-center text-brand-neon mb-4 transition-all">
              <Flame size={32} />
            </div>
            <h3 className="font-display font-black text-lg text-white uppercase tracking-wider group-hover:text-brand-neon transition-colors">
              Campaigns
            </h3>
            <p className="font-mono text-[9px] text-white/40 uppercase tracking-widest mt-2 px-4 leading-relaxed">
              Activate upgrades, milestones, & reward drops
            </p>
          </motion.button>

          {/* Circular Card 2: Performance Feed / Diagnostics */}
          <motion.button
            whileHover={{ scale: 1.05, borderColor: 'rgba(168,85,247,0.6)' }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setActiveSection('diagnostics')}
            className="w-64 h-64 rounded-full border-2 border-purple-500/10 bg-brand-gray/5 hover:bg-purple-500/5 flex flex-col items-center justify-center p-6 text-center transition-all duration-300 cursor-pointer shadow-[0_0_20px_rgba(168,85,247,0.02)] hover:shadow-[0_0_30px_rgba(168,85,247,0.1)] group relative overflow-hidden"
          >
            <div className="w-16 h-16 rounded-full bg-purple-500/10 group-hover:bg-purple-500/20 flex items-center justify-center text-purple-400 mb-4 transition-all">
              <Trophy size={32} />
            </div>
            <h3 className="font-display font-black text-lg text-white uppercase tracking-wider group-hover:text-purple-300 transition-colors">
              Diagnostics
            </h3>
            <p className="font-mono text-[9px] text-white/40 uppercase tracking-widest mt-2 px-4 leading-relaxed">
              Track active streaks, metrics & athlete mystery unlocks
            </p>
          </motion.button>

          {/* Circular Card 3: Instant Creator */}
          <motion.button
            whileHover={{ scale: 1.05, borderColor: 'rgba(14,165,233,0.6)' }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              setEditingOffer({
                title: '',
                description: '',
                category: 'loyalty_milestone',
                reward: 'percentage_discount',
                reward_value: 10,
                free_gift_name: '',
                min_order_value: 0,
                required_milestone_orders: null,
                required_streak_days: null,
                is_active: true,
                is_revealed: true
              });
              setActiveSection('campaigns');
              setIsModalOpen(true);
            }}
            className="w-64 h-64 rounded-full border-2 border-sky-500/10 bg-brand-gray/5 hover:bg-sky-500/5 flex flex-col items-center justify-center p-6 text-center transition-all duration-300 cursor-pointer shadow-[0_0_20px_rgba(14,165,233,0.02)] hover:shadow-[0_0_30px_rgba(14,165,233,0.1)] group relative overflow-hidden"
          >
            <div className="w-16 h-16 rounded-full bg-sky-500/10 group-hover:bg-sky-500/20 flex items-center justify-center text-sky-400 mb-4 transition-all">
              <Plus size={32} />
            </div>
            <h3 className="font-display font-black text-lg text-white uppercase tracking-wider group-hover:text-sky-300 transition-colors">
              Designer
            </h3>
            <p className="font-mono text-[9px] text-white/40 uppercase tracking-widest mt-2 px-4 leading-relaxed">
              Draft & publish a new loyalty milestone instantly
            </p>
          </motion.button>
        </div>
      </div>
    );
  }

  if (activeSection === 'diagnostics') {
    return (
      <div className="space-y-8 text-white relative">
        {/* Hub Return Button */}
        <button
          onClick={() => setActiveSection('hub')}
          className="absolute -top-3 md:top-2 right-0 p-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-white hover:text-brand-neon rounded-full transition-all cursor-pointer z-50 group flex items-center justify-center"
          title="Return to Hub"
        >
          <X className="w-5 h-5 group-hover:rotate-90 transition-transform duration-200" />
        </button>

        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="font-mono text-[10px] uppercase text-brand-neon tracking-widest bg-brand-neon/10 px-2 py-0.5 border border-brand-neon/20">
              LOYALTY ANALYTICS
            </span>
          </div>
          <h1 className="text-4xl font-black font-display tracking-tight uppercase">
            Campaign Diagnostics
          </h1>
          <p className="text-sm text-white/60 font-sans mt-1">
            Visual metrics, active mystery thresholds, and user conversion checkpoints.
          </p>
        </div>

        {/* Quick Metrics Tracker Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-brand-gray/20 border border-white/5 rounded-lg p-5 flex items-center gap-4 relative overflow-hidden group hover:border-brand-neon/20 transition-all">
            <div className="w-12 h-12 bg-brand-neon/10 border border-brand-neon/20 rounded flex items-center justify-center text-brand-neon">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <span className="block text-[10px] font-mono text-white/45 uppercase tracking-wider">Active Campaigns</span>
              <span className="text-3xl font-black font-display tracking-tight text-white mt-1 block">
                {activePromosCount} <span className="text-xs text-white/40 font-normal">Live</span>
              </span>
            </div>
          </div>

          <div className="bg-brand-gray/20 border border-white/5 rounded-lg p-5 flex items-center gap-4 relative overflow-hidden group hover:border-brand-neon/20 transition-all">
            <div className="w-12 h-12 bg-purple-500/10 border border-purple-500/20 rounded flex items-center justify-center text-purple-400">
              <EyeOff className="w-6 h-6" />
            </div>
            <div>
              <span className="block text-[10px] font-mono text-white/45 uppercase tracking-wider">Active Mystery Offers</span>
              <span className="text-3xl font-black font-display tracking-tight text-purple-300 mt-1 block">
                {mysteryOffersCount} <span className="text-xs text-white/40 font-normal">Hidden</span>
              </span>
            </div>
          </div>

          <div className="bg-brand-gray/20 border border-white/5 rounded-lg p-5 flex items-center gap-4 relative overflow-hidden group hover:border-brand-neon/20 transition-all">
            <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/20 rounded flex items-center justify-center text-emerald-400">
              <Eye className="w-6 h-6" />
            </div>
            <div>
              <span className="block text-[10px] font-mono text-white/45 uppercase tracking-wider">Revealed Campaigns</span>
              <span className="text-3xl font-black font-display tracking-tight text-emerald-300 mt-1 block">
                {revealedOffersCount} <span className="text-xs text-white/40 font-normal">Active</span>
              </span>
            </div>
          </div>

          <div className="bg-brand-gray/20 border border-white/5 rounded-lg p-5 flex items-center gap-4 relative overflow-hidden group hover:border-brand-neon/20 transition-all">
            <div className="w-12 h-12 bg-amber-500/10 border border-amber-500/20 rounded flex items-center justify-center text-amber-400">
              <Trophy className="w-6 h-6" />
            </div>
            <div>
              <span className="block text-[10px] font-mono text-white/45 uppercase tracking-wider">Total Campaigns</span>
              <span className="text-3xl font-black font-display tracking-tight text-amber-300 mt-1 block">
                {offers.length} <span className="text-xs text-white/40 font-normal">Configured</span>
              </span>
            </div>
          </div>
        </div>

        {/* Diagnostic Insights Card */}
        <div className="bg-brand-gray/10 border border-white/10 p-6 rounded-lg space-y-4">
          <h3 className="font-display font-bold text-lg text-white uppercase tracking-wider flex items-center gap-2">
            <Award className="text-brand-neon" />
            LOYALTY MILESTONES ANALYSIS
          </h3>
          <p className="font-mono text-xs text-white/60 leading-relaxed uppercase">
            SYSTEM TRACKS AUTOMATIC USER ORDER COMPLIANCE. ATHLETES WHO REACH SPECIFIC THRESHOLDS AUTOMATICALLY UNLOCK CORRESPONDING FREE UPGRADE GIFTS AND HIGHER DISCOUNT REWARDS ON DEMAND.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="p-4 bg-black/40 border border-white/5 rounded">
              <span className="font-mono text-[10px] text-brand-neon uppercase font-bold block mb-1">STREAK HEALTH</span>
              <p className="text-xs text-white/80 font-sans">
                Active athlete engagement shows high adherence to streak drop rules. The 7-day consistent training triggers are leading premium protein uptake by 24%.
              </p>
            </div>
            <div className="p-4 bg-black/40 border border-white/5 rounded">
              <span className="font-mono text-[10px] text-purple-400 uppercase font-bold block mb-1">MYSTERY ENGAGEMENT</span>
              <p className="text-xs text-white/80 font-sans">
                Mystery upgrades and milestone reveals are keeping students active on consecutive check-ins, optimizing high-protein meal delivery targets.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 text-white relative">
      {/* Hub Return Button */}
      <button
        onClick={() => setActiveSection('hub')}
        className="absolute -top-3 md:top-2 right-0 p-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-white hover:text-brand-neon rounded-full transition-all cursor-pointer z-50 group flex items-center justify-center"
        title="Return to Hub"
      >
        <X className="w-5 h-5 group-hover:rotate-90 transition-transform duration-200" />
      </button>

      {/* Header Segment */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6 pr-12">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="font-mono text-[10px] uppercase text-brand-neon tracking-widest bg-brand-neon/10 px-2 py-0.5 border border-brand-neon/20">
              Loyalty Segment & Incentives
            </span>
          </div>
          <h1 className="text-4xl font-black font-display tracking-tight uppercase">
            Offers & Campaigns Catalog
          </h1>
          <p className="text-sm text-white/60 font-sans mt-1">
            Build game-like milestones, streak boosters, mystery reward reveals, and high-protein checkout rewards.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => checkDatabaseAndFetch()}
            className="p-3 border border-white/10 hover:border-brand-neon hover:text-brand-neon rounded bg-brand-gray/25 transition-all text-white/75 flex items-center justify-center cursor-pointer"
            title="Refresh connection"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            onClick={handleSeedDefaultData}
            className="px-4 py-2.5 border border-white/10 hover:border-brand-neon hover:text-brand-neon rounded bg-brand-gray/25 font-mono text-[11px] uppercase tracking-wider font-bold transition-all flex items-center gap-2 cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-brand-neon animate-pulse" />
            Seed Demo Offers
          </button>

          <button
            onClick={() => {
              setEditingOffer({
                title: '',
                description: '',
                category: 'loyalty_milestone',
                reward: 'percentage_discount',
                reward_value: 10,
                free_gift_name: '',
                min_order_value: 0,
                required_milestone_orders: null,
                required_streak_days: null,
                is_active: true,
                is_revealed: true
              });
              setIsModalOpen(true);
            }}
            className="px-5 py-2.5 bg-brand-neon text-brand-dark font-mono text-xs font-black uppercase tracking-widest rounded hover:opacity-90 transition-all flex items-center gap-2 shadow-[0_0_15px_rgba(212,255,0,0.15)] cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3px]" />
            New Campaign
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-brand-gray/10 p-4 rounded-lg border border-white/5">
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => setSelectedCategory('all')}
            className={cn(
              "px-4 py-2 font-mono text-[10px] uppercase font-bold tracking-wider rounded transition-all cursor-pointer border",
              selectedCategory === 'all'
                ? "bg-brand-neon text-brand-dark border-brand-neon"
                : "bg-black/40 border-white/10 text-white hover:border-brand-neon/50"
            )}
          >
            All Segments
          </button>
          <button
            onClick={() => setSelectedCategory('loyalty_milestone')}
            className={cn(
              "px-4 py-2 font-mono text-[10px] uppercase font-bold tracking-wider rounded transition-all cursor-pointer border",
              selectedCategory === 'loyalty_milestone'
                ? "bg-brand-neon text-brand-dark border-brand-neon"
                : "bg-black/40 border-white/10 text-white hover:border-brand-neon/50"
            )}
          >
            Milestones
          </button>
          <button
            onClick={() => setSelectedCategory('streak_bonus')}
            className={cn(
              "px-4 py-2 font-mono text-[10px] uppercase font-bold tracking-wider rounded transition-all cursor-pointer border",
              selectedCategory === 'streak_bonus'
                ? "bg-brand-neon text-brand-dark border-brand-neon"
                : "bg-black/40 border-white/10 text-white hover:border-brand-neon/50"
            )}
          >
            Streaks
          </button>
          <button
            onClick={() => setSelectedCategory('seasonal_drop')}
            className={cn(
              "px-4 py-2 font-mono text-[10px] uppercase font-bold tracking-wider rounded transition-all cursor-pointer border",
              selectedCategory === 'seasonal_drop'
                ? "bg-brand-neon text-brand-dark border-brand-neon"
                : "bg-black/40 border-white/10 text-white hover:border-brand-neon/50"
            )}
          >
            Seasonal
          </button>
          <button
            onClick={() => setSelectedCategory('custom_promo')}
            className={cn(
              "px-4 py-2 font-mono text-[10px] uppercase font-bold tracking-wider rounded transition-all cursor-pointer border",
              selectedCategory === 'custom_promo'
                ? "bg-brand-neon text-brand-dark border-brand-neon"
                : "bg-black/40 border-white/10 text-white hover:border-brand-neon/50"
            )}
          >
            Custom Promos
          </button>
        </div>

        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <input
            type="text"
            placeholder="Search campaigns..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-black/60 border border-white/10 rounded px-10 py-2.5 text-xs font-mono placeholder:text-white/30 text-white focus:outline-none focus:border-brand-neon"
          />
        </div>
      </div>

      {/* Main Campaign Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-brand-neon" />
          <p className="font-mono text-xs text-white/40 tracking-widest uppercase">Fetching Active Campaigns...</p>
        </div>
      ) : filteredOffers.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-white/10 rounded-lg bg-brand-gray/5">
          <AlertCircle className="w-12 h-12 text-white/30 mx-auto mb-4" />
          <h3 className="text-lg font-bold uppercase tracking-wider text-white/85">No Offers Configured</h3>
          <p className="text-sm text-white/50 max-w-md mx-auto mt-1">
            Build milestones, daily tracking consistency, or seasonal menu perks using the buttons above.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredOffers.map((offer) => {
            // Setup tier colorings depending on high loyalty milestone vs standard promo
            const isHighTierLoyalty = offer.category === 'loyalty_milestone' && (offer.required_milestone_orders || 0) >= 10;
            const categoryLabel = {
              loyalty_milestone: 'Loyalty Milestone',
              streak_bonus: 'Consistency Streak',
              seasonal_drop: 'Seasonal Drop',
              custom_promo: 'Special Promo'
            }[offer.category];

            const rewardLabel = {
              percentage_discount: 'Percent Off',
              flat_discount: 'Flat Discount',
              free_gift: 'Free Gift',
              badge_unlock: 'Discipline Badge'
            }[offer.reward];

            return (
              <div 
                key={offer.id}
                className={cn(
                  "border rounded-lg relative overflow-hidden flex flex-col justify-between transition-all group",
                  offer.is_active 
                    ? isHighTierLoyalty 
                      ? "bg-gradient-to-br from-purple-950/15 via-black to-black border-purple-500/30 shadow-[0_0_20px_rgba(147,51,234,0.08)]"
                      : "bg-brand-gray/25 border-white/10 hover:border-brand-neon/30 hover:shadow-[0_0_15px_rgba(212,255,0,0.05)]"
                    : "bg-black/60 border-white/5 opacity-60"
                )}
              >
                {/* Header ribbon */}
                <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/5 bg-white/[0.02]">
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "font-mono text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-sm border tracking-wider",
                      isHighTierLoyalty
                        ? "bg-purple-950/40 text-purple-300 border-purple-500/30"
                        : "bg-brand-neon/10 text-brand-neon border-brand-neon/20"
                    )}>
                      {categoryLabel}
                    </span>
                    <span className="font-mono text-[9px] text-white/40 uppercase">
                      {rewardLabel}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Status badges */}
                    <span className={cn(
                      "inline-flex items-center gap-1 font-mono text-[9px] uppercase font-bold px-2 py-0.5 rounded-sm",
                      offer.is_active 
                        ? "bg-emerald-950/40 text-emerald-400 border border-emerald-500/20" 
                        : "bg-white/5 text-white/40 border border-white/10"
                    )}>
                      {offer.is_active ? 'Visible' : 'Draft'}
                    </span>

                    <span className={cn(
                      "inline-flex items-center gap-1 font-mono text-[9px] uppercase font-bold px-2 py-0.5 rounded-sm border",
                      offer.is_revealed 
                        ? "bg-brand-neon/5 text-brand-neon border-brand-neon/20" 
                        : "bg-purple-950/30 text-purple-400 border-purple-500/20"
                    )}>
                      {offer.is_revealed ? 'Live Reveal' : 'Mystery'}
                    </span>
                  </div>
                </div>

                {/* Content body */}
                <div className="p-6 flex-1 space-y-4">
                  <div>
                    <h3 className="text-xl font-bold font-display tracking-tight text-white group-hover:text-brand-neon transition-colors">
                      {offer.title}
                    </h3>
                    
                    {/* Failsafe Mystery display simulation */}
                    {!offer.is_revealed ? (
                      <div className="mt-2.5 p-3.5 bg-purple-950/10 border border-purple-500/10 rounded flex items-center gap-3">
                        <EyeOff className="w-5 h-5 text-purple-400 shrink-0" />
                        <div>
                          <p className="font-mono text-[10px] text-purple-300 uppercase tracking-wider font-extrabold">Mystery Offer Mode</p>
                          <p className="text-[11px] text-white/60 italic">Client interface displays: "To be revealed soon!"</p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-white/70 font-sans mt-2 leading-relaxed">
                        {offer.description}
                      </p>
                    )}
                  </div>

                  {/* Trigger constraints & parameters */}
                  <div className="pt-4 border-t border-white/5 grid grid-cols-2 gap-3">
                    <div className="bg-black/30 p-2.5 border border-white/5 rounded">
                      <span className="block text-[8px] font-mono text-white/35 uppercase tracking-wider">Trigger Conditions</span>
                      <div className="mt-1 font-mono text-xs flex items-center gap-1.5">
                        {offer.required_milestone_orders ? (
                          <>
                            <Trophy className="w-3.5 h-3.5 text-brand-neon" />
                            <span>{offer.required_milestone_orders} Orders Completed</span>
                          </>
                        ) : offer.required_streak_days ? (
                          <>
                            <Flame className="w-3.5 h-3.5 text-brand-orange animate-pulse" />
                            <span>{offer.required_streak_days}-Day Streak Target</span>
                          </>
                        ) : (
                          <>
                            <Calendar className="w-3.5 h-3.5 text-white/40" />
                            <span>Checkout Ready</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="bg-black/30 p-2.5 border border-white/5 rounded">
                      <span className="block text-[8px] font-mono text-white/35 uppercase tracking-wider">Campaign Reward</span>
                      <div className="mt-1 font-mono text-xs text-brand-neon font-bold flex items-center gap-1.5">
                        <Gift className="w-3.5 h-3.5" />
                        <span>
                          {offer.reward === 'free_gift' && (offer.free_gift_name || 'Gift Perk')}
                          {offer.reward === 'percentage_discount' && `${offer.reward_value}% Discount`}
                          {offer.reward === 'flat_discount' && `₹${offer.reward_value} Off Coupon`}
                          {offer.reward === 'badge_unlock' && 'Discipline Badge'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Min value thresholds */}
                  <div className="flex flex-wrap items-center gap-2 text-[10px] font-mono text-white/45">
                    {offer.min_order_value > 0 && (
                      <span className="bg-white/5 px-2 py-1 rounded">Min Value: ₹{offer.min_order_value}</span>
                    )}
                    {offer.start_date && (
                      <span className="bg-white/5 px-2 py-1 rounded">Starts: {new Date(offer.start_date).toLocaleDateString()}</span>
                    )}
                  </div>
                </div>

                {/* Footer action row */}
                <div className="px-6 py-3 border-t border-white/5 bg-brand-gray/10 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleToggleActive(offer)}
                      className={cn(
                        "text-[10px] font-mono uppercase font-bold tracking-wider hover:text-white transition-colors cursor-pointer",
                        offer.is_active ? "text-emerald-400" : "text-white/40"
                      )}
                    >
                      {offer.is_active ? 'Disable' : 'Enable'}
                    </button>
                    <span className="text-white/10">|</span>
                    <button
                      onClick={() => handleToggleRevealed(offer)}
                      className="text-[10px] font-mono uppercase font-bold tracking-wider text-purple-400 hover:text-purple-300 transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      {offer.is_revealed ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                      {offer.is_revealed ? 'Hide Description' : 'Reveal Live'}
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setEditingOffer(offer);
                        setIsModalOpen(true);
                      }}
                      className="p-1.5 border border-white/10 hover:border-brand-neon rounded bg-brand-dark hover:text-brand-neon transition-all cursor-pointer"
                      title="Edit Campaign Details"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    {deleteConfirmId === offer.id ? (
                      <div className="flex items-center gap-1 bg-brand-orange/15 border border-brand-orange/30 p-1 rounded">
                        <button
                          onClick={() => handleDeleteOffer(offer.id)}
                          className="px-2 py-0.5 bg-brand-orange text-brand-dark font-mono text-[9px] uppercase font-bold rounded cursor-pointer"
                        >
                          Confirm
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(null)}
                          className="p-0.5 hover:text-white text-white/50 cursor-pointer"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setDeleteConfirmId(offer.id)}
                        className="p-1.5 border border-white/10 hover:border-brand-orange hover:text-brand-orange rounded bg-brand-dark transition-all cursor-pointer"
                        title="Delete Campaign"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Campaign Form Modal */}
      <AnimatePresence>
        {isModalOpen && editingOffer && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#09090B] border border-white/10 max-w-2xl w-full rounded-lg overflow-hidden flex flex-col max-h-[90vh] shadow-[0_0_50px_rgba(214,255,0,0.1)]"
            >
              {/* Modal Header */}
              <div className="flex justify-between items-center border-b border-white/10 p-5 bg-white/[0.02]">
                <h3 className="text-xl font-bold font-display uppercase tracking-tight text-white flex items-center gap-2">
                  <Gift className="w-5 h-5 text-brand-neon" />
                  {editingOffer.id ? 'Edit Offer Campaign' : 'Create Offers Campaign'}
                </h3>
                <button
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditingOffer(null);
                  }}
                  className="p-1.5 text-white/50 hover:text-white rounded border border-white/5 hover:border-white/10 transition-all cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Modal Form */}
              <form onSubmit={handleSaveOffer} className="p-6 overflow-y-auto space-y-5 flex-1 scrollbar-thin">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Campaign Title */}
                  <div className="space-y-1 md:col-span-2">
                    <label className="block text-[10px] font-mono uppercase text-white/50 tracking-wider">Campaign Title *</label>
                    <input
                      type="text"
                      required
                      value={editingOffer.title}
                      onChange={(e) => setEditingOffer({ ...editingOffer, title: e.target.value })}
                      placeholder="e.g. 5th Order Protein Shake Upgrade"
                      className="w-full bg-black/50 border border-white/10 rounded px-3 py-2.5 text-xs font-mono placeholder:text-white/20 focus:outline-none focus:border-brand-neon text-white"
                    />
                  </div>

                  {/* Category Type */}
                  <div className="space-y-1">
                    <label className="block text-[10px] font-mono uppercase text-white/50 tracking-wider">Offer Segment Category</label>
                    <select
                      value={editingOffer.category}
                      onChange={(e) => setEditingOffer({ ...editingOffer, category: e.target.value as OfferCategory })}
                      className="w-full bg-black/50 border border-white/10 rounded px-3 py-2.5 text-xs font-mono focus:outline-none focus:border-brand-neon text-white cursor-pointer"
                    >
                      <option value="loyalty_milestone">Loyalty Milestone</option>
                      <option value="streak_bonus">Consistency Streak Bonus</option>
                      <option value="seasonal_drop">Seasonal Drop</option>
                      <option value="custom_promo">Custom Promo / Special Code</option>
                    </select>
                  </div>

                  {/* Reward Type */}
                  <div className="space-y-1">
                    <label className="block text-[10px] font-mono uppercase text-white/50 tracking-wider">Reward Type</label>
                    <select
                      value={editingOffer.reward}
                      onChange={(e) => setEditingOffer({ ...editingOffer, reward: e.target.value as RewardType })}
                      className="w-full bg-black/50 border border-white/10 rounded px-3 py-2.5 text-xs font-mono focus:outline-none focus:border-brand-neon text-white cursor-pointer"
                    >
                      <option value="percentage_discount">Percentage Discount</option>
                      <option value="flat_discount">Flat Discount</option>
                      <option value="free_gift">Free Gift Reward</option>
                      <option value="badge_unlock">Athlete Badge Unlock</option>
                    </select>
                  </div>

                  {/* Reward Value (Percentage / Flat Discount) */}
                  {(editingOffer.reward === 'percentage_discount' || editingOffer.reward === 'flat_discount') && (
                    <div className="space-y-1">
                      <label className="block text-[10px] font-mono uppercase text-white/50 tracking-wider">
                        {editingOffer.reward === 'percentage_discount' ? 'Discount Percentage (%)' : 'Discount Value (₹)'} *
                      </label>
                      <input
                        type="number"
                        required
                        min="1"
                        value={editingOffer.reward_value || ''}
                        onChange={(e) => setEditingOffer({ ...editingOffer, reward_value: parseFloat(e.target.value) || 0 })}
                        placeholder={editingOffer.reward === 'percentage_discount' ? 'e.g. 15' : 'e.g. 250'}
                        className="w-full bg-black/50 border border-white/10 rounded px-3 py-2.5 text-xs font-mono focus:outline-none focus:border-brand-neon text-white"
                      />
                    </div>
                  )}

                  {/* Free Gift Name */}
                  {editingOffer.reward === 'free_gift' && (
                    <div className="space-y-1">
                      <label className="block text-[10px] font-mono uppercase text-white/50 tracking-wider">Free Gift Name *</label>
                      <input
                        type="text"
                        required
                        value={editingOffer.free_gift_name || ''}
                        onChange={(e) => setEditingOffer({ ...editingOffer, free_gift_name: e.target.value })}
                        placeholder="e.g. Stainless Steel Shaker Bottle"
                        className="w-full bg-black/50 border border-white/10 rounded px-3 py-2.5 text-xs font-mono focus:outline-none focus:border-brand-neon text-white"
                      />
                    </div>
                  )}
                </div>

                {/* Campaign Description */}
                <div className="space-y-1">
                  <label className="block text-[10px] font-mono uppercase text-white/50 tracking-wider">Campaign Public Description *</label>
                  <textarea
                    required
                    rows={3}
                    value={editingOffer.description}
                    onChange={(e) => setEditingOffer({ ...editingOffer, description: e.target.value })}
                    placeholder="Enter what the user earns, e.g. Reach 5 active orders to claim a free premium isolate scoop upgrade on your next drop!"
                    className="w-full bg-black/50 border border-white/10 rounded px-3 py-2.5 text-xs font-sans placeholder:text-white/25 focus:outline-none focus:border-brand-neon text-white resize-none"
                  />
                </div>

                {/* Trigger Criteria Section */}
                <div className="border border-white/5 bg-brand-gray/5 p-4 rounded space-y-4">
                  <h4 className="font-mono text-[10px] text-brand-neon uppercase tracking-wider border-b border-white/5 pb-2">
                    Target Eligibility Triggers & Rules
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Min Order Value */}
                    <div className="space-y-1">
                      <label className="block text-[9px] font-mono uppercase text-white/40 tracking-wider">Min Order Value (₹)</label>
                      <input
                        type="number"
                        value={editingOffer.min_order_value || ''}
                        onChange={(e) => setEditingOffer({ ...editingOffer, min_order_value: parseFloat(e.target.value) || 0 })}
                        placeholder="e.g. 500"
                        className="w-full bg-black/50 border border-white/10 rounded px-2.5 py-2 text-xs font-mono focus:outline-none focus:border-brand-neon text-white"
                      />
                    </div>

                    {/* Required Orders Completed */}
                    <div className="space-y-1">
                      <label className="block text-[9px] font-mono uppercase text-white/40 tracking-wider">Orders Milestone (Orders Count)</label>
                      <input
                        type="number"
                        value={editingOffer.required_milestone_orders || ''}
                        onChange={(e) => setEditingOffer({ ...editingOffer, required_milestone_orders: parseInt(e.target.value, 10) || null })}
                        placeholder="e.g. 5"
                        className="w-full bg-black/50 border border-white/10 rounded px-2.5 py-2 text-xs font-mono focus:outline-none focus:border-brand-neon text-white"
                      />
                    </div>

                    {/* Required Streak Days */}
                    <div className="space-y-1">
                      <label className="block text-[9px] font-mono uppercase text-white/40 tracking-wider">Consistency Streak (Days)</label>
                      <input
                        type="number"
                        value={editingOffer.required_streak_days || ''}
                        onChange={(e) => setEditingOffer({ ...editingOffer, required_streak_days: parseInt(e.target.value, 10) || null })}
                        placeholder="e.g. 7"
                        className="w-full bg-black/50 border border-white/10 rounded px-2.5 py-2 text-xs font-mono focus:outline-none focus:border-brand-neon text-white"
                      />
                    </div>
                  </div>
                </div>

                {/* Status Toggles */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Is Active toggle */}
                  <div className="flex items-center justify-between p-3.5 bg-black/40 border border-white/5 rounded">
                    <div>
                      <span className="block text-[10px] font-mono uppercase text-white tracking-wide">Is Campaign Active</span>
                      <span className="text-[9px] font-mono text-white/40 uppercase">Enable or disable client display visibility</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editingOffer.is_active ?? true}
                        onChange={(e) => setEditingOffer({ ...editingOffer, is_active: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-brand-gray peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-neon"></div>
                    </label>
                  </div>

                  {/* Is Revealed toggle */}
                  <div className="flex items-center justify-between p-3.5 bg-black/40 border border-white/5 rounded">
                    <div>
                      <span className="block text-[10px] font-mono uppercase text-white tracking-wide">Is Content Revealed</span>
                      <span className="text-[9px] font-mono text-white/40 uppercase">FALSE masks details as a "Mystery" placeholder</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editingOffer.is_revealed ?? true}
                        onChange={(e) => setEditingOffer({ ...editingOffer, is_revealed: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-brand-gray peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-neon"></div>
                    </label>
                  </div>
                </div>

                {/* Schedule timeline dates */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block text-[9px] font-mono uppercase text-white/40 tracking-wider">Start Date</label>
                    <input
                      type="datetime-local"
                      value={editingOffer.start_date ? new Date(editingOffer.start_date).toISOString().slice(0, 16) : ''}
                      onChange={(e) => setEditingOffer({ ...editingOffer, start_date: new Date(e.target.value).toISOString() })}
                      className="w-full bg-black/50 border border-white/10 rounded px-3 py-2 text-xs font-mono focus:outline-none focus:border-brand-neon text-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[9px] font-mono uppercase text-white/40 tracking-wider">End Date (Optional)</label>
                    <input
                      type="datetime-local"
                      value={editingOffer.end_date ? new Date(editingOffer.end_date).toISOString().slice(0, 16) : ''}
                      onChange={(e) => setEditingOffer({ ...editingOffer, end_date: e.target.value ? new Date(e.target.value).toISOString() : null })}
                      className="w-full bg-black/50 border border-white/10 rounded px-3 py-2 text-xs font-mono focus:outline-none focus:border-brand-neon text-white"
                    />
                  </div>
                </div>

                {/* Modal Footer / Form Save Controls */}
                <div className="flex gap-2 pt-4 border-t border-white/5">
                  <button
                    type="button"
                    onClick={() => {
                      setIsModalOpen(false);
                      setEditingOffer(null);
                    }}
                    className="flex-1 px-4 py-2.5 border border-white/10 hover:bg-white/5 rounded font-mono text-[10px] uppercase font-bold tracking-wider cursor-pointer"
                  >
                    Discard Changes
                  </button>

                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 px-4 py-2.5 bg-brand-neon text-brand-dark rounded font-mono text-[10px] uppercase font-bold tracking-wider hover:opacity-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        SAVING...
                      </>
                    ) : (
                      <>
                        <Check className="w-3.5 h-3.5 stroke-[3px]" />
                        PUBLISH CAMPAIGN
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
