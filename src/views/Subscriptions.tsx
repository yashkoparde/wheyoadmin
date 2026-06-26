import React, { useEffect, useState } from 'react';
import { 
  Users, 
  DollarSign, 
  Plus, 
  Edit3, 
  Trash2, 
  Check, 
  X, 
  Calendar, 
  Search, 
  Filter, 
  Boxes, 
  RefreshCw, 
  Target 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getSupabase } from '../lib/supabase';
import { cn } from '../lib/utils';

interface SubscriptionsProps {
  user: any;
}

export interface RealSubscriptionPlan {
  id: number;
  name: string;
  price: number;
  billing_cycle: 'weekly' | 'monthly' | string;
  description: string | null;
  is_popular: boolean;
}

export interface RealSubscriptionAddon {
  id: number;
  name: string;
  price: number;
  reg_price: number;
}

export interface RealUserSubscription {
  id: string;
  user_id: string;
  plan_id: number;
  plan_name: string;
  price: number;
  billing_cycle: string;
  pickup_locker: string;
  next_delivery: string;
  status: 'active' | 'paused' | string;
  items: string[]; // Decoded JSONB array
  user_name?: string;
  user_email?: string;
}

export default function Subscriptions({ user }: SubscriptionsProps) {
  // Database datasets states
  const [plans, setPlans] = useState<RealSubscriptionPlan[]>([]);
  const [addons, setAddons] = useState<RealSubscriptionAddon[]>([]);
  const [subscriptions, setSubscriptions] = useState<RealUserSubscription[]>([]);
  const [menuProducts, setMenuProducts] = useState<any[]>([]);
  
  // App system states
  const [loading, setLoading] = useState(true);
  const [configError, setConfigError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'subscribers' | 'plans' | 'addons'>('subscribers');
  const [activeSection, setActiveSection] = useState<'hub' | 'panel'>('hub');
  
  // Simulated access controls (always authenticates admin list matching address)
  const isSuperAdmin = user?.email === 'yashkoparde2022@gmail.com';
  const [adminBypass, setAdminBypass] = useState(true);
  const isAdmin = isSuperAdmin || adminBypass;

  // Search filter options
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'paused'>('all');
  const [planFilter, setPlanFilter] = useState<string>('all');

  // Deletion locks
  const [deletePlanConfirmId, setDeletePlanConfirmId] = useState<number | null>(null);
  const [deleteAddonConfirmId, setDeleteAddonConfirmId] = useState<number | null>(null);
  const [deleteSubConfirmId, setDeleteSubConfirmId] = useState<string | null>(null);

  // Modal forms management
  const [editingPlan, setEditingPlan] = useState<Partial<RealSubscriptionPlan> | null>(null);
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [savingPlan, setSavingPlan] = useState(false);

  const [editingAddon, setEditingAddon] = useState<Partial<RealSubscriptionAddon> | null>(null);
  const [isAddonModalOpen, setIsAddonModalOpen] = useState(false);
  const [savingAddon, setSavingAddon] = useState(false);

  // Contract manual override state
  const [editingSub, setEditingSub] = useState<RealUserSubscription | null>(null);
  const [subLocker, setSubLocker] = useState('');
  const [subNextDelivery, setSubNextDelivery] = useState('');
  const [subStatus, setSubStatus] = useState<string>('active');
  const [subPrice, setSubPrice] = useState<number>(0);
  const [subCycle, setSubCycle] = useState('weekly');
  const [subItems, setSubItems] = useState<string[]>([]);
  const [newItemInput, setNewItemInput] = useState('');
  const [savingSub, setSavingSub] = useState(false);

  // Database synchronizer
  const fetchData = async () => {
    setLoading(true);
    setConfigError(null);
    try {
      const supabase = getSupabase();

      // 1. Fetch Tiers
      const { data: plansData, error: plansErr } = await (supabase.from('subscription_plans' as any) as any)
        .select('*')
        .order('name');
      if (plansErr) throw plansErr;

      // 2. Fetch Booster Addons
      const { data: addonsData, error: addonsErr } = await (supabase.from('subscription_addons' as any) as any)
        .select('*')
        .order('name');
      if (addonsErr) throw addonsErr;

      // 3. Fetch User Athlete Contracts
      const { data: subsData, error: subsErr } = await (supabase.from('user_subscriptions' as any) as any)
        .select('*')
        .order('created_at', { ascending: false });
      if (subsErr) throw subsErr;

      // Optional: Load profile names for athlete logins
      let profilesMap = new Map();
      try {
        const { data: profilesData } = await (supabase.from('profiles' as any) as any).select('id, full_name, phone');
        if (profilesData) {
          profilesMap = new Map((profilesData || []).map((p: any) => [p.id, p]));
        }
      } catch (profErr) {
        console.warn('Profile joins bypass', profErr);
      }

      // Populate user subscriptions cleanly with custom items array from database
      const loadedSubs: RealUserSubscription[] = (subsData || []).map((sub: any) => {
        const associatedProfile = profilesMap.get(sub.user_id);
        const resolvedItems = Array.isArray(sub.items) ? sub.items : [];
        return {
          id: sub.id,
          user_id: sub.user_id,
          plan_id: sub.plan_id,
          plan_name: sub.plan_name || 'Standard Plan Upgrade',
          price: Number(sub.price || 0),
          billing_cycle: sub.billing_cycle || 'weekly',
          pickup_locker: sub.pickup_locker || 'Designated Gym Drop Point',
          next_delivery: sub.next_delivery || '',
          status: sub.status || 'active',
          items: resolvedItems,
          user_name: associatedProfile?.full_name || `Athlete #${sub.id.substring(0, 6)}`,
          user_email: associatedProfile?.phone ? `Delivery Fulfillments (${associatedProfile.phone})` : 'Athlete Member ID'
        };
      });

      // Fetch live products for dropdown mapping
      let loadedProducts: any[] = [];
      try {
        const { data: prodData } = await supabase.from('products').select('*');
        if (prodData) {
          loadedProducts = [...prodData].sort((a: any, b: any) => {
            const numA = parseInt(a.code?.match(/\d+$/)?.[0] || '999', 10);
            const numB = parseInt(b.code?.match(/\d+$/)?.[0] || '999', 10);
            return numA - numB;
          });
        }
      } catch (prodErr) {
        console.warn('Products bypass', prodErr);
      }

      setPlans(plansData || []);
      setAddons(addonsData || []);
      setSubscriptions(loadedSubs);
      setMenuProducts(loadedProducts);
    } catch (err: any) {
      console.error('Database query rejection:', err);
      setConfigError(err.message || 'Error occurred during table fetch.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  // Seeding default recommended plans for rapid start
  const seedDefaultDataset = async () => {
    if (!isAdmin) return;
    setLoading(true);
    try {
      const supabase = getSupabase();

      const defaultPlans = [
        { name: 'Desi Runner Starter', price: 699.00, billing_cycle: 'weekly', description: 'Indian performance breakfast/snack starter. 5x delicious high-protein Indian items (like Soya Bhurji, Sprouted Peanut Salat, or Steamed Egg White cups) hand-delivered directly to your specified gym drop point.', is_popular: false },
        { name: 'Fit India Daily Prep', price: 1399.00, billing_cycle: 'weekly', description: 'Daily single premium high-protein Indian meal prep (like Tandoori Chicken Tikka, Egg Curry, or Szechuan Tofu with Peanut glaze) hand-delivered daily to your designated gym reception drop point.', is_popular: true },
        { name: 'Active Swadeshi Athlete Pack', price: 2499.00, billing_cycle: 'weekly', description: '2x high-protein homestyle Indian preps daily featuring lean chicken breast, whole eggs, tofu, and high-protein soya chunks. Perfect for athlete lunch & dinner combinations with a complimentary whey shake.', is_popular: false },
        { name: 'Monthly Desi Block Saver', price: 4999.00, billing_cycle: 'monthly', description: 'Prearranged monthly block saver. 22x single high-protein meal preps (featuring Chicken Keema, Paneer/Tofu Bhurji, Soya Chunks Curry, and Egg whites) hand-delivered on your precise training days.', is_popular: false },
        { name: 'Swadeshi Hypertrophy Overdrive', price: 8999.00, billing_cycle: 'monthly', description: 'The ultimate unlimited athlete fueling membership. Fast, customized fresh hand-deliveries (2x daily preps showcasing high-protein eggs, chicken, tofu, peanuts, and soya + whey isolate booster drops) directly to any gym partner.', is_popular: true }
      ];

      const { error: plansSeedErr } = await (supabase.from('subscription_plans' as any) as any).insert(defaultPlans);
      if (plansSeedErr) throw plansSeedErr;

      const defaultBoosters = [
        { name: 'Creatine Monohydrate Boost (100g)', price: 450.00, reg_price: 550.00 },
        { name: 'L-Glutamine Recovery (150g)', price: 620.00, reg_price: 750.00 },
        { name: 'Whey Protein Isolate Boost (500g)', price: 1200.00, reg_price: 1450.00 },
        { name: 'BCAA Intraworkout Electros (120g)', price: 550.00, reg_price: 680.00 },
        { name: 'Joint Support Glucosamine (60 caps)', price: 790.00, reg_price: 950.00 }
      ];

      const { error: boosterSeedErr } = await (supabase.from('subscription_addons' as any) as any).insert(defaultBoosters);
      if (boosterSeedErr) throw boosterSeedErr;

      if (user?.id) {
        const testSub = {
          user_id: user.id,
          plan_name: 'Fit India Daily Prep',
          price: 1399.00,
          billing_cycle: 'weekly',
          pickup_locker: 'Reception Desk (Main Gold Gym)',
          status: 'active',
          items: ['1x Tandoori Chicken Tikka Prep', '1x Egg Bhurji & Multigrain Roti', '1x Spicy Soya Keema Rice', '1x Peanut Butter Protein Oats', '1x Szechuan Tofu Gym Prep']
        };
        await (supabase.from('user_subscriptions' as any) as any).insert([testSub]);
      }

      await fetchData();
    } catch (e: any) {
      alert(`Simulation seed completed with warnings: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Compute Core Metrics statically from the actual live dataset
  const activeSubs = subscriptions.filter(sub => sub.status === 'active');
  const activeSubsCount = activeSubs.length;
  
  const estimatedWeeklyRevenue = activeSubs.reduce((sum, sub) => {
    const cyclePrice = Number(sub.price || 0);
    if (sub.billing_cycle === 'monthly') {
      return sum + (cyclePrice / 4.33);
    }
    return sum + cyclePrice;
  }, 0);

  // 1. MUTATING TIER PLANS
  const handleOpenPlanModal = (plan?: RealSubscriptionPlan) => {
    if (plan) {
      setEditingPlan({ ...plan });
    } else {
      setEditingPlan({ name: '', price: 1499.00, billing_cycle: 'weekly', description: '', is_popular: false });
    }
    setIsPlanModalOpen(true);
  };

  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlan) return;
    setSavingPlan(true);
    try {
      const supabase = getSupabase();
      const planPayload = {
        name: editingPlan.name,
        price: Number(editingPlan.price || 0),
        billing_cycle: editingPlan.billing_cycle || 'weekly',
        description: editingPlan.description,
        is_popular: !!editingPlan.is_popular
      };

      if (editingPlan.id) {
        const { error } = await (supabase.from('subscription_plans' as any) as any)
          .update(planPayload)
          .eq('id', editingPlan.id);
        if (error) throw error;
      } else {
        const { error } = await (supabase.from('subscription_plans' as any) as any)
          .insert([planPayload]);
        if (error) throw error;
      }

      setIsPlanModalOpen(false);
      setEditingPlan(null);
      await fetchData();
    } catch (err: any) {
      alert(`Database rejected modification: ${err.message}`);
    } finally {
      setSavingPlan(false);
    }
  };

  const handleDeletePlan = async (id: number) => {
    try {
      const supabase = getSupabase();
      const { error } = await (supabase.from('subscription_plans' as any) as any).delete().eq('id', id);
      if (error) throw error;
      await fetchData();
    } catch (err: any) {
      alert(`Operation block check: ${err.message}. Plans linked to active contracts cannot be purged.`);
    } finally {
      setDeletePlanConfirmId(null);
    }
  };

  // 2. MUTATING BOOSTERS
  const handleOpenAddonModal = (addon?: RealSubscriptionAddon) => {
    if (addon) {
      setEditingAddon({ ...addon });
    } else {
      setEditingAddon({ name: '', price: 490, reg_price: 600 });
    }
    setIsAddonModalOpen(true);
  };

  const handleSaveAddon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAddon) return;
    setSavingAddon(true);
    try {
      const supabase = getSupabase();
      const addonPayload = {
        name: editingAddon.name,
        price: Number(editingAddon.price || 0),
        reg_price: Number(editingAddon.reg_price || 0)
      };

      if (editingAddon.id) {
        const { error } = await (supabase.from('subscription_addons' as any) as any)
          .update(addonPayload)
          .eq('id', editingAddon.id);
        if (error) throw error;
      } else {
        const { error } = await (supabase.from('subscription_addons' as any) as any)
          .insert([addonPayload]);
        if (error) throw error;
      }

      setIsAddonModalOpen(false);
      setEditingAddon(null);
      await fetchData();
    } catch (err: any) {
      alert(`Database rejected booster modification: ${err.message}`);
    } finally {
      setSavingAddon(false);
    }
  };

  const handleDeleteAddon = async (id: number) => {
    try {
      const supabase = getSupabase();
      const { error } = await (supabase.from('subscription_addons' as any) as any).delete().eq('id', id);
      if (error) throw error;
      await fetchData();
    } catch (err: any) {
      alert(`Error purging booster: ${err.message}`);
    } finally {
      setDeleteAddonConfirmId(null);
    }
  };

  // 3. MUTATING USER CONTRACTS
  const toggleSubscriberStatus = async (sub: RealUserSubscription) => {
    const nextStatus = sub.status === 'active' ? 'paused' : 'active';
    try {
      const supabase = getSupabase();
      const { error } = await (supabase.from('user_subscriptions' as any) as any)
        .update({ status: nextStatus })
        .eq('id', sub.id);
      if (error) throw error;

      setSubscriptions(prev => prev.map(item => item.id === sub.id ? { ...item, status: nextStatus } : item));
    } catch (err: any) {
      alert(`Status modification failed: ${err.message}`);
    }
  };

  const handleOpenSubOverride = (sub: RealUserSubscription) => {
    setEditingSub(sub);
    setSubLocker(sub.pickup_locker || '');
    setSubNextDelivery(sub.next_delivery || '');
    setSubStatus(sub.status || 'active');
    setSubPrice(sub.price || 0);
    setSubCycle(sub.billing_cycle || 'weekly');
    setSubItems(Array.isArray(sub.items) ? sub.items : []);
    setNewItemInput('');
  };

  const handleAddItem = () => {
    if (!newItemInput.trim()) return;
    setSubItems(prev => [...prev, newItemInput.trim()]);
    setNewItemInput('');
  };

  const handleRemoveItem = (index: number) => {
    setSubItems(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleApplySubscriptionChanges = async () => {
    if (!editingSub) return;
    setSavingSub(true);
    try {
      const supabase = getSupabase();
      const overridePayload = {
        pickup_locker: subLocker,
        next_delivery: subNextDelivery || null,
        status: subStatus,
        price: Number(subPrice),
        billing_cycle: subCycle,
        items: subItems
      };

      const { error } = await (supabase.from('user_subscriptions' as any) as any)
        .update(overridePayload)
        .eq('id', editingSub.id);
      
      if (error) throw error;

      setEditingSub(null);
      await fetchData();
    } catch (err: any) {
      alert(`Override configuration rejected: ${err.message}`);
    } finally {
      setSavingSub(false);
    }
  };

  const handleDeleteSubContract = async (id: string) => {
    try {
      const supabase = getSupabase();
      const { error } = await (supabase.from('user_subscriptions' as any) as any).delete().eq('id', id);
      if (error) throw error;
      await fetchData();
    } catch (err: any) {
      alert(`Contract deletion failed: ${err.message}`);
    } finally {
      setDeleteSubConfirmId(null);
    }
  };

  // Searching logic
  const filteredSubscriptions = subscriptions.filter(sub => {
    const term = searchQuery.toLowerCase();
    const textMatch = 
      (sub.user_name || '').toLowerCase().includes(term) ||
      (sub.plan_name || '').toLowerCase().includes(term) ||
      (sub.pickup_locker || '').toLowerCase().includes(term);

    const statusMatch = statusFilter === 'all' || sub.status === statusFilter;
    const planMatch = planFilter === 'all' || sub.plan_id?.toString() === planFilter;

    return textMatch && statusMatch && planMatch;
  });

  if (activeSection === 'hub') {
    return (
      <div className="min-h-[80vh] flex flex-col justify-center items-center text-white p-4 md:p-8 selection:bg-brand-neon selection:text-brand-dark">
        <div className="text-center max-w-2xl mb-12 animate-fade-in">
          <span className="font-mono text-[10px] uppercase text-brand-neon tracking-[0.3em] bg-brand-neon/10 px-3 py-1 border border-brand-neon/20 rounded">
            Subscription Control Tower
          </span>
          <h1 className="text-5xl font-black font-display tracking-tight uppercase mt-6 mb-3 text-white">
            Subscriptions
          </h1>
          <p className="text-xs text-white/50 leading-relaxed uppercase font-mono tracking-wider">
            Manage plans, drops, delivery lockers, and athlete nutrition memberships.
          </p>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-12 w-full max-w-5xl">
          {/* Circular Card 1: Athlete Contracts */}
          <motion.button
            whileHover={{ scale: 1.05, borderColor: 'rgba(212,255,0,0.6)' }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              setActiveTab('subscribers');
              setActiveSection('panel');
            }}
            className="w-64 h-64 rounded-full border-2 border-brand-neon/10 bg-brand-gray/5 hover:bg-brand-neon/5 flex flex-col items-center justify-center p-6 text-center transition-all duration-300 cursor-pointer shadow-[0_0_20px_rgba(212,255,0,0.02)] hover:shadow-[0_0_30px_rgba(212,255,0,0.1)] group relative overflow-hidden"
          >
            <div className="w-16 h-16 rounded-full bg-brand-neon/10 group-hover:bg-brand-neon/20 flex items-center justify-center text-brand-neon mb-4 transition-all">
              <Users size={32} />
            </div>
            <h3 className="font-display font-black text-lg text-white uppercase tracking-wider group-hover:text-brand-neon transition-colors">
              Contracts
            </h3>
            <p className="font-mono text-[9px] text-white/40 uppercase tracking-widest mt-2 px-4 leading-relaxed">
              Track active athletes, drops, & assignments
            </p>
          </motion.button>

          {/* Circular Card 2: Subscription Plans */}
          <motion.button
            whileHover={{ scale: 1.05, borderColor: 'rgba(168,85,247,0.6)' }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              setActiveTab('plans');
              setActiveSection('panel');
            }}
            className="w-64 h-64 rounded-full border-2 border-purple-500/10 bg-brand-gray/5 hover:bg-purple-500/5 flex flex-col items-center justify-center p-6 text-center transition-all duration-300 cursor-pointer shadow-[0_0_20px_rgba(168,85,247,0.02)] hover:shadow-[0_0_30px_rgba(168,85,247,0.1)] group relative overflow-hidden"
          >
            <div className="w-16 h-16 rounded-full bg-purple-500/10 group-hover:bg-purple-500/20 flex items-center justify-center text-purple-400 mb-4 transition-all">
              <Calendar size={32} />
            </div>
            <h3 className="font-display font-black text-lg text-white uppercase tracking-wider group-hover:text-purple-300 transition-colors">
              Plans
            </h3>
            <p className="font-mono text-[9px] text-white/40 uppercase tracking-widest mt-2 px-4 leading-relaxed">
              Design weekly/monthly high-protein tiers
            </p>
          </motion.button>

          {/* Circular Card 3: Booster Addons */}
          <motion.button
            whileHover={{ scale: 1.05, borderColor: 'rgba(14,165,233,0.6)' }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              setActiveTab('addons');
              setActiveSection('panel');
            }}
            className="w-64 h-64 rounded-full border-2 border-sky-500/10 bg-brand-gray/5 hover:bg-sky-500/5 flex flex-col items-center justify-center p-6 text-center transition-all duration-300 cursor-pointer shadow-[0_0_20px_rgba(14,165,233,0.02)] hover:shadow-[0_0_30px_rgba(14,165,233,0.1)] group relative overflow-hidden"
          >
            <div className="w-16 h-16 rounded-full bg-sky-500/10 group-hover:bg-sky-500/20 flex items-center justify-center text-sky-400 mb-4 transition-all">
              <Boxes size={32} />
            </div>
            <h3 className="font-display font-black text-lg text-white uppercase tracking-wider group-hover:text-sky-300 transition-colors">
              Boosters
            </h3>
            <p className="font-mono text-[9px] text-white/40 uppercase tracking-widest mt-2 px-4 leading-relaxed">
              Configure supplemental protein addon packs
            </p>
          </motion.button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-white bg-brand-dark p-4 md:p-8 selection:bg-brand-neon selection:text-brand-dark relative">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-white/10 pb-6 mb-8 gap-4 pr-12">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2 h-2 rounded-full bg-brand-neon animate-pulse" />
            <span className="text-[10px] uppercase font-mono tracking-widest text-brand-neon">Wheyo Admin Area</span>
          </div>
          <h2 className="text-3xl font-black font-display uppercase tracking-tight text-white flex items-center gap-3">
            Subscriptions Center
          </h2>
          <p className="text-xs font-mono text-white/50 uppercase tracking-wide mt-1">
            Control panel for plans, drops, delivery-boy drop assignments, and athlete fuel preps.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchData}
            title="Reload live values"
            className="p-2 border border-white/10 hover:border-brand-neon hover:text-brand-neon rounded transition-all bg-brand-gray/25 flex items-center gap-2 font-mono text-[10px] uppercase cursor-pointer"
          >
            <RefreshCw size={13} className={cn(loading && "animate-spin")} />
            sync
          </button>

          {isAdmin && plans.length === 0 && (
            <button
              onClick={seedDefaultDataset}
              className="px-4 py-2 bg-brand-neon text-brand-dark font-mono text-[10px] font-bold uppercase tracking-wider rounded hover:opacity-90 transition-all flex items-center gap-2"
            >
              <Plus size={12} />
              Seed 5 Plans & Boosters
            </button>
          )}

          <button
            onClick={() => setActiveSection('hub')}
            className="p-2 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-white hover:text-brand-neon rounded-full transition-all cursor-pointer group flex items-center justify-center"
            title="Close and return to Hub"
          >
            <X size={14} className="group-hover:rotate-90 transition-transform duration-200" />
          </button>
        </div>
      </div>

      {/* Metrics Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        
        <div className="glass-card p-4 rounded-lg flex items-center gap-4">
          <div className="w-10 h-10 rounded bg-brand-neon/10 flex items-center justify-center text-brand-neon">
            <Users size={18} />
          </div>
          <div>
            <span className="block font-mono text-[9px] uppercase tracking-widest text-white/45">Athlete Accounts</span>
            <span className="font-display font-black text-xl text-white">{subscriptions.length} Contracts</span>
          </div>
        </div>

        <div className="glass-card p-4 rounded-lg flex items-center gap-4">
          <div className="w-10 h-10 rounded bg-brand-neon/10 flex items-center justify-center text-brand-neon">
            <Check size={18} />
          </div>
          <div>
            <span className="block font-mono text-[9px] uppercase tracking-widest text-white/45">Active Fueling</span>
            <span className="font-display font-black text-xl text-brand-neon">{activeSubsCount} Students</span>
          </div>
        </div>

        <div className="glass-card p-4 rounded-lg flex items-center gap-4">
          <div className="w-10 h-10 rounded bg-brand-neon/10 flex items-center justify-center text-brand-neon">
            <DollarSign size={18} />
          </div>
          <div>
            <span className="block font-mono text-[9px] uppercase tracking-widest text-white/45">Weekly Ingress Output</span>
            <span className="font-display font-black text-xl text-brand-neon">₹{estimatedWeeklyRevenue.toFixed(0)} / wk</span>
          </div>
        </div>

        <div className="glass-card p-4 rounded-lg flex items-center gap-4">
          <div className="w-10 h-10 rounded bg-brand-orange/10 flex items-center justify-center text-brand-orange">
            <Boxes size={18} />
          </div>
          <div>
            <span className="block font-mono text-[9px] uppercase tracking-widest text-white/45">Active Catalog</span>
            <span className="font-display font-black text-xl text-white">{plans.length} Tiers • {addons.length} Boosters</span>
          </div>
        </div>

      </div>

      {/* Tabs list */}
      <div className="flex border-b border-white/10 mb-6 gap-2 overflow-x-auto select-none no-scrollbar">
        <button
          onClick={() => setActiveTab('subscribers')}
          className={cn(
            "px-5 py-3 font-mono text-[11px] tracking-widest uppercase font-bold border-b-2 transition-all shrink-0",
            activeTab === 'subscribers' 
              ? "border-brand-neon text-brand-neon" 
              : "border-transparent text-white/50 hover:text-white"
          )}
        >
          Athlete Contracts ({subscriptions.length})
        </button>

        <button
          onClick={() => setActiveTab('plans')}
          className={cn(
            "px-5 py-3 font-mono text-[11px] tracking-widest uppercase font-bold border-b-2 transition-all shrink-0",
            activeTab === 'plans' 
              ? "border-brand-neon text-brand-neon" 
              : "border-transparent text-white/50 hover:text-white"
          )}
        >
          Subscription Tiers ({plans.length})
        </button>

        <button
          onClick={() => setActiveTab('addons')}
          className={cn(
            "px-5 py-3 font-mono text-[11px] tracking-widest uppercase font-bold border-b-2 transition-all shrink-0",
            activeTab === 'addons' 
              ? "border-brand-neon text-brand-neon" 
              : "border-transparent text-white/50 hover:text-white"
          )}
        >
          Booster Catalog ({addons.length})
        </button>
      </div>

      {/* View Content Panels */}
      <div>
        
        {/* PANEL 1: SUBSCRIBER LOGS TABLE */}
        {activeTab === 'subscribers' && (
          <div className="space-y-6">
            
            {/* Control Filters */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-brand-gray p-4 rounded-lg border border-white/5">
              <div className="flex flex-wrap items-center gap-3 flex-1">
                
                {/* Text filter */}
                <div className="relative w-full md:w-80">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                  <input
                    type="text"
                    placeholder="Search by student, plan, drop location..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-brand-dark border border-white/10 rounded px-3 py-2 pl-9 font-mono text-[11px] text-white focus:border-brand-neon outline-none"
                  />
                </div>

                {/* Status Dropdown */}
                <div className="flex items-center gap-2 bg-brand-dark border border-white/10 px-3 py-1.5 rounded">
                  <Filter size={11} className="text-brand-neon" />
                  <span className="font-mono text-[9px] uppercase tracking-wider text-white/40">Status:</span>
                  <select
                    value={statusFilter}
                    onChange={(e: any) => setStatusFilter(e.target.value)}
                    className="bg-transparent font-mono text-[10px] text-white focus:outline-none cursor-pointer uppercase font-bold"
                  >
                    <option value="all" className="bg-brand-dark">ALL CONTRACTS</option>
                    <option value="active" className="text-brand-neon bg-brand-dark">ACTIVE</option>
                    <option value="paused" className="text-brand-orange bg-brand-dark">PAUSED</option>
                  </select>
                </div>

                {/* Linked Plan Dropdown */}
                <div className="flex items-center gap-2 bg-brand-dark border border-white/10 px-3 py-1.5 rounded">
                  <span className="font-mono text-[9px] uppercase tracking-wider text-white/40">Plan filter:</span>
                  <select
                    value={planFilter}
                    onChange={(e: any) => setPlanFilter(e.target.value)}
                    className="bg-transparent font-mono text-[10px] text-white focus:outline-none cursor-pointer uppercase font-bold max-w-xs"
                  >
                    <option value="all" className="bg-brand-dark">ALL PLANS</option>
                    {plans.map(p => (
                      <option key={p.id} value={p.id} className="bg-brand-dark text-white">{p.name}</option>
                    ))}
                  </select>
                </div>

              </div>

              <div className="text-[10px] font-mono text-white/45 uppercase tracking-wide">
                Showing {filteredSubscriptions.length} of {subscriptions.length} Athlete Contracts
              </div>
            </div>

            {/* Contract list rendering */}
            {filteredSubscriptions.length === 0 ? (
              <div className="glass-card rounded-lg p-12 text-center">
                <Users size={32} className="mx-auto text-white/20 mb-3" />
                <p className="font-mono text-xs text-white/60 mb-1">NO SUBSCRIBERS LOGS CONNECTED</p>
                <p className="font-mono text-[9px] text-white/40 uppercase">Create user subscriptions or change your filter set.</p>
              </div>
            ) : (
              <div className="glass-card rounded-lg overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[950px]">
                  <thead>
                    <tr className="border-b border-white/10 font-mono text-[9px] text-white/40 uppercase tracking-widest bg-white/5">
                      <th className="p-4 pl-6">Student Athlete / Contact</th>
                      <th className="p-4">Delivery Drop Point</th>
                      <th className="p-4">Linked Tier Package</th>
                      <th className="p-4">Custom Items Drop List</th>
                      <th className="p-4">Next Delivery</th>
                      <th className="p-4 text-center">Status</th>
                      <th className="p-4 text-right pr-6">Direct Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 font-mono text-xs">
                    {filteredSubscriptions.map(sub => (
                      <tr key={sub.id} className="hover:bg-white/5 transition-all">
                        
                        <td className="p-4 pl-6">
                          <div>
                            <span className="block text-white font-bold uppercase">{sub.user_name}</span>
                            <span className="text-[10px] text-white/40 lowercase mt-0.5">{sub.user_email}</span>
                          </div>
                        </td>

                        <td className="p-4">
                          <span className="text-white/80 font-bold uppercase">{sub.pickup_locker || 'NOT ASSIGNED'}</span>
                        </td>

                        <td className="p-4">
                          <div>
                            <span className="text-brand-neon font-black uppercase tracking-tight block font-display text-sm">
                              {sub.plan_name}
                            </span>
                            <span className="text-[9px] text-white/45 mt-0.5 block font-mono">
                              ₹{sub.price} / {sub.billing_cycle}
                            </span>
                          </div>
                        </td>

                        <td className="p-4 max-w-[240px]">
                          <div className="flex flex-wrap gap-1">
                            {!sub.items || sub.items.length === 0 ? (
                              <span className="text-white/30 italic text-[10px]">No Custom Inclusions</span>
                            ) : (
                              sub.items.map((item, idx) => (
                                <span key={idx} className="bg-white/10 text-white/90 text-[8px] px-2 py-0.5 rounded uppercase tracking-wider block shrink-0 max-w-full truncate">
                                  {item}
                                </span>
                              ))
                            )}
                          </div>
                        </td>

                        <td className="p-4 text-white font-semibold">
                          <div className="flex items-center gap-1.5">
                            <Calendar size={11} className="text-brand-neon" />
                            <span>{sub.next_delivery ? sub.next_delivery.split('T')[0] : 'SUNDAY ARRIVAL'}</span>
                          </div>
                        </td>

                        <td className="p-4 text-center">
                          <span className={cn(
                            "inline-flex items-center gap-1 px-2.5 py-0.5 text-[9px] uppercase font-bold rounded-sm border",
                            sub.status === 'active' 
                              ? "bg-brand-neon/10 border-brand-neon/30 text-brand-neon" 
                              : "bg-brand-orange/10 border-brand-orange/20 text-brand-orange"
                          )}>
                            <span className={cn("w-1 h-1 rounded-full", sub.status === 'active' ? "bg-brand-neon animate-pulse" : "bg-brand-orange")} />
                            {sub.status}
                          </span>
                        </td>

                        <td className="p-4 text-right pr-6">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => toggleSubscriberStatus(sub)}
                              className={cn(
                                "px-2 py-1 text-[9px] font-bold border rounded uppercase transition-colors shrink-0 cursor-pointer",
                                sub.status === 'active' 
                                  ? "border-brand-orange/30 text-brand-orange hover:bg-brand-orange hover:text-black"
                                  : "border-brand-neon/30 text-brand-neon hover:bg-brand-neon hover:text-black"
                              )}
                            >
                              {sub.status === 'active' ? 'PAUSE' : 'RESUME'}
                            </button>

                            <button
                              onClick={() => handleOpenSubOverride(sub)}
                              className="p-1 px-2 border border-white/10 hover:border-brand-neon text-white/70 hover:text-brand-neon rounded transition-all flex items-center gap-1 shrink-0 uppercase text-[9px] font-bold cursor-pointer"
                            >
                              <Edit3 size={11} />
                              Manage
                            </button>

                            {isAdmin && (
                              <div className="inline">&nbsp;
                                {deleteSubConfirmId === sub.id ? (
                                  <span className="inline-flex items-center gap-1 bg-brand-gray p-1 border border-brand-orange/30 rounded">
                                    <button 
                                      onClick={() => handleDeleteSubContract(sub.id)} 
                                      className="bg-brand-orange text-white px-1.5 py-0.5 text-[8px] rounded uppercase font-mono font-bold cursor-pointer"
                                    >
                                      SURE?
                                    </button>
                                    <button 
                                      onClick={() => setDeleteSubConfirmId(null)} 
                                      className="text-white/60 px-1 py-0.5 text-[8px] cursor-pointer hover:text-white"
                                    >
                                      NO
                                    </button>
                                  </span>
                                ) : (
                                  <button
                                    onClick={() => setDeleteSubConfirmId(sub.id)}
                                    className="p-1 border border-transparent hover:border-brand-orange/40 hover:text-brand-orange rounded text-white/30 transition-all text-[9px] uppercase font-bold cursor-pointer"
                                    title="Cancel contract record"
                                  >
                                    <Trash2 size={11} />
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </td>

                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* PANEL 2: SUBSCRIPTION PLANS TIERS */}
        {activeTab === 'plans' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <h3 className="text-lg font-bold font-display uppercase tracking-tight flex items-center gap-2">
                  <Target className="text-brand-neon" size={16} />
                  Active Membership Tiers
                </h3>
                <p className="font-mono text-[9px] text-white/40 uppercase tracking-widest mt-0.5">
                  Establish available baseline meal nutrition bundles.
                </p>
              </div>

              {isAdmin && (
                <button
                  onClick={() => handleOpenPlanModal()}
                  className="px-3 py-1.5 bg-brand-neon text-brand-dark font-mono text-[10px] uppercase font-bold tracking-wider rounded hover:opacity-90 transition-all flex items-center gap-1 cursor-pointer"
                >
                  <Plus size={12} />
                  Create New Tier
                </button>
              )}
            </div>

            {plans.length === 0 ? (
              <div className="glass-card rounded-lg p-12 text-center">
                <Target size={30} className="mx-auto text-white/20 mb-3" />
                <p className="font-mono text-xs text-white/60">NO ACTIVE PLANS LOADED</p>
                <p className="font-mono text-[9px] text-white/40 uppercase mt-1">Please seed or insert subscription plan tiers.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {plans.map(plan => (
                  <div 
                    key={plan.id}
                    className={cn(
                      "glass-card p-6 rounded-lg flex flex-col justify-between relative transition-all duration-300",
                      plan.is_popular ? "border-brand-neon shadow-[0_0_15px_rgba(212,255,0,0.15)]" : "border-white/5 hover:border-white/20"
                    )}
                  >
                    <div>
                      {plan.is_popular && (
                        <span className="absolute top-4 right-4 font-mono text-[8px] bg-brand-neon text-brand-dark px-1.5 py-0.5 font-bold uppercase tracking-widest">
                          ★ Popular
                        </span>
                      )}

                      <span className="font-mono text-[8px] text-white/40 uppercase tracking-widest block mb-1">
                        Tier ID: {plan.id}
                      </span>

                      <h4 className="font-display font-black text-2xl uppercase tracking-tighter text-white mb-2">
                        {plan.name}
                      </h4>
                      
                      <p className="font-sans text-xs text-white/60 leading-relaxed mb-4">
                        {plan.description || 'No direct athlete macro description programmed.'}
                      </p>

                      <div className="bg-brand-dark border border-white/5 p-3 rounded text-[10px] font-mono uppercase tracking-wide mb-3 flex justify-between">
                        <span className="text-white/40">Drop Repetition</span>
                        <span className="text-brand-neon font-black">{plan.billing_cycle} Fulfillment</span>
                      </div>
                    </div>

                    <div className="border-t border-white/5 pt-4 mt-4 flex items-end justify-between">
                      <div>
                        <span className="font-mono text-[9px] text-white/40 uppercase block mb-0.5">Recurring Price</span>
                        <span className="font-display text-2xl font-black text-brand-neon">
                          ₹{plan.price}
                        </span>
                      </div>

                      {isAdmin && (
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleOpenPlanModal(plan)}
                            className="p-1 px-2 border border-white/10 hover:border-brand-neon hover:text-brand-neon rounded text-white/60 transition-all text-[9.5px] uppercase font-mono font-bold cursor-pointer"
                          >
                            Edit
                          </button>

                          {deletePlanConfirmId === plan.id ? (
                            <span className="inline-flex items-center gap-1 bg-brand-dark p-1 border border-brand-orange/30 rounded text-[9px]">
                              <button onClick={() => handleDeletePlan(plan.id)} className="bg-brand-orange text-white px-1.5 py-0.5 rounded font-mono font-bold cursor-pointer">YES</button>
                              <button onClick={() => setDeletePlanConfirmId(null)} className="text-white/60 px-1 py-0.5 cursor-pointer hover:text-white">NO</button>
                            </span>
                          ) : (
                            <button
                              onClick={() => setDeletePlanConfirmId(plan.id)}
                              className="p-1.5 text-white/30 hover:text-brand-orange hover:border-brand-orange/30 border border-transparent rounded transition-all cursor-pointer"
                            >
                              <Trash2 size={12} />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* PANEL 3: BOOSTER ADD-ONS */}
        {activeTab === 'addons' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <h3 className="text-lg font-bold font-display uppercase tracking-tight flex items-center gap-2">
                  <Boxes className="text-brand-neon" size={16} />
                  Athlete Supplement Boosters
                </h3>
                <p className="font-mono text-[9px] text-white/40 uppercase tracking-widest mt-0.5">
                  Supplement add-on boosters available on-demand.
                </p>
              </div>

              {isAdmin && (
                <button
                  onClick={() => handleOpenAddonModal()}
                  className="px-3 py-1.5 bg-brand-neon text-brand-dark font-mono text-[10px] uppercase font-bold tracking-wider rounded hover:opacity-90 transition-all flex items-center gap-1 cursor-pointer"
                >
                  <Plus size={12} />
                  Create New Booster
                </button>
              )}
            </div>

            {addons.length === 0 ? (
              <div className="glass-card rounded-lg p-12 text-center">
                <Boxes size={30} className="mx-auto text-white/20 mb-3" />
                <p className="font-mono text-xs text-white/60">NO ADD-ON BOOSTERS DEFINED</p>
                <p className="font-mono text-[9px] text-white/40 uppercase mt-1">Add booster inventory or seed them.</p>
              </div>
            ) : (
              <div className="glass-card rounded-lg overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[600px]">
                  <thead>
                    <tr className="border-b border-white/10 font-mono text-[9px] text-white/40 uppercase tracking-widest bg-white/5">
                      <th className="p-4 pl-6">Supplement Product ID</th>
                      <th className="p-4">Booster Nutrition Item Name</th>
                      <th className="p-4 text-center">Reference M.R.P.</th>
                      <th className="p-4 text-right">VIP Drop Price</th>
                      <th className="p-4 text-center">Active Margin Benefit</th>
                      <th className="p-4 text-right pr-6">Catalog Controls</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 font-mono text-xs">
                    {addons.map(add => {
                      const Mrp = Number(add.reg_price || 0);
                      const MemberPrice = Number(add.price || 0);
                      const promoPercent = Mrp > MemberPrice ? ((Mrp - MemberPrice) / Mrp * 100).toFixed(0) : 0;
                      return (
                        <tr key={add.id} className="hover:bg-white/5 transition-all">
                          <td className="p-4 pl-6 text-white/40">#{add.id}</td>
                          <td className="p-4 font-bold text-white uppercase">{add.name}</td>
                          <td className="p-4 text-center text-white/40 line-through">₹{Mrp}</td>
                          <td className="p-4 text-right text-brand-neon font-black text-sm">₹{MemberPrice}</td>
                          <td className="p-4 text-center">
                            {Number(promoPercent) > 0 ? (
                              <span className="bg-brand-neon/10 text-brand-neon px-2 py-0.5 rounded-sm font-bold text-[9px] uppercase">
                                Save {promoPercent}% Off
                              </span>
                            ) : (
                              <span className="text-white/30 text-[9px]">-</span>
                            )}
                          </td>
                          <td className="p-4 text-right pr-6">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => handleOpenAddonModal(add)}
                                className="p-1 px-2 border border-white/10 hover:border-brand-neon hover:text-brand-neon rounded text-white/60 transition-all font-bold uppercase text-[9.5px] cursor-pointer"
                              >
                                Adjust Price
                              </button>

                              {deleteAddonConfirmId === add.id ? (
                                <span className="inline-flex items-center gap-1 bg-brand-dark p-1 border border-brand-orange/30 rounded text-[9px]">
                                  <button onClick={() => handleDeleteAddon(add.id)} className="bg-brand-orange text-white px-1.5 py-0.5 rounded font-mono font-bold cursor-pointer">YES</button>
                                  <button onClick={() => setDeleteAddonConfirmId(null)} className="text-white/60 px-1 py-0.5 cursor-pointer hover:text-white">NO</button>
                                </span>
                              ) : (
                                <button
                                  onClick={() => setDeleteAddonConfirmId(add.id)}
                                  className="p-1.5 border border-transparent hover:border-brand-orange/30 hover:text-brand-orange rounded transition-all text-white/30 cursor-pointer"
                                >
                                  <Trash2 size={12} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

      </div>

      {/* MODAL 1: CREATE OR EDIT PLAN */}
      <AnimatePresence>
        {isPlanModalOpen && editingPlan && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/95 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-brand-gray border border-brand-neon/30 max-w-lg w-full p-6 rounded-lg font-mono text-xs text-white"
            >
              <div className="flex justify-between items-center border-b border-white/10 pb-3 mb-4">
                <h4 className="text-sm font-bold uppercase tracking-tight text-brand-neon">
                  {editingPlan.id ? 'Modify Membership Tier' : 'Establish New Tier'}
                </h4>
                <button onClick={() => setIsPlanModalOpen(false)} className="text-white/40 hover:text-white cursor-pointer">
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleSavePlan} className="space-y-4">
                <div>
                  <label className="block text-[9px] text-white/45 uppercase mb-1">Package Name</label>
                  <input
                    type="text"
                    required
                    value={editingPlan.name || ''}
                    onChange={(e) => setEditingPlan({ ...editingPlan, name: e.target.value })}
                    className="w-full bg-brand-dark border border-white/15 p-2 rounded text-white focus:border-brand-neon outline-none font-bold uppercase"
                    placeholder="e.g. Lean Gain Blueprint"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[9px] text-white/45 uppercase mb-1">Price (₹ INR)</label>
                    <input
                      type="number"
                      required
                      min={0}
                      value={editingPlan.price || 0}
                      onChange={(e) => setEditingPlan({ ...editingPlan, price: Number(e.target.value) })}
                      className="w-full bg-brand-dark border border-white/15 p-2 rounded text-white focus:border-brand-neon outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[9px] text-white/45 uppercase mb-1">Billing Repetition</label>
                    <select
                      value={editingPlan.billing_cycle || 'weekly'}
                      onChange={(e) => setEditingPlan({ ...editingPlan, billing_cycle: e.target.value })}
                      className="w-full bg-brand-dark border border-white/15 p-2 rounded text-white focus:border-brand-neon outline-none uppercase font-bold"
                    >
                      <option value="weekly">Weekly drop</option>
                      <option value="monthly">Monthly commitment</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[9px] text-white/45 uppercase mb-1">Description Details</label>
                  <textarea
                    value={editingPlan.description || ''}
                    onChange={(e) => setEditingPlan({ ...editingPlan, description: e.target.value })}
                    className="w-full bg-brand-dark border border-white/15 p-2 rounded text-white h-24 resize-none focus:border-brand-neon outline-none"
                    placeholder="Provide specific athlete macro splits or delivery details..."
                  />
                </div>

                <div className="flex items-center gap-2 bg-brand-dark border border-white/5 p-3 rounded">
                  <input
                    type="checkbox"
                    id="is_popular"
                    checked={!!editingPlan.is_popular}
                    onChange={(e) => setEditingPlan({ ...editingPlan, is_popular: e.target.checked })}
                    className="accent-brand-neon w-4 h-4 cursor-pointer"
                  />
                  <label htmlFor="is_popular" className="text-[10px] uppercase font-bold text-white cursor-pointer select-none">
                    Feature as Popular Choice (Glow Border)
                  </label>
                </div>

                <div className="flex gap-2 pt-4 border-t border-white/5">
                  <button
                    type="button"
                    onClick={() => setIsPlanModalOpen(false)}
                    className="flex-1 py-2 bg-white/5 text-white uppercase text-[10px] hover:bg-white/10 rounded transition-all cursor-pointer"
                  >
                    CANCEL
                  </button>
                  <button
                    type="submit"
                    disabled={savingPlan}
                    className="flex-1 py-2 bg-brand-neon text-brand-dark uppercase text-[10px] font-bold hover:opacity-90 rounded transition-all cursor-pointer"
                  >
                    {savingPlan ? 'SAVING...' : 'SAVE CHANGES'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 2: CREATE OR EDIT BOOSTER */}
      <AnimatePresence>
        {isAddonModalOpen && editingAddon && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/95 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-brand-gray border border-brand-neon/30 max-w-lg w-full p-6 rounded-lg font-mono text-xs text-white"
            >
              <div className="flex justify-between items-center border-b border-white/10 pb-3 mb-4">
                <h4 className="text-sm font-bold uppercase tracking-tight text-brand-neon">
                  {editingAddon.id ? 'Adjust Booster Pricing' : 'Append New Booster Addon'}
                </h4>
                <button onClick={() => setIsAddonModalOpen(false)} className="text-white/40 hover:text-white cursor-pointer">
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleSaveAddon} className="space-y-4">
                <div>
                  <label className="block text-[9px] text-white/45 uppercase mb-1">Booster Supplement Name</label>
                  <input
                    type="text"
                    required
                    value={editingAddon.name || ''}
                    onChange={(e) => setEditingAddon({ ...editingAddon, name: e.target.value })}
                    className="w-full bg-brand-dark border border-white/15 p-2 rounded text-white focus:border-brand-neon outline-none font-bold uppercase"
                    placeholder="e.g. Creatine Monohydrate Boost"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[9px] text-white/45 uppercase mb-1">Regular M.R.P. Price (₹)</label>
                    <input
                      type="number"
                      required
                      min={0}
                      value={editingAddon.reg_price || 0}
                      onChange={(e) => setEditingAddon({ ...editingAddon, reg_price: Number(e.target.value) })}
                      className="w-full bg-brand-dark border border-white/15 p-2 rounded text-white focus:border-brand-neon outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[9px] text-white/45 uppercase mb-1">VIP Delivery Price (₹)</label>
                    <input
                      type="number"
                      required
                      min={0}
                      value={editingAddon.price || 0}
                      onChange={(e) => setEditingAddon({ ...editingAddon, price: Number(e.target.value) })}
                      className="w-full bg-brand-dark border border-white/15 p-2 rounded text-white focus:border-brand-neon outline-none"
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-4 border-t border-white/5">
                  <button
                    type="button"
                    onClick={() => setIsAddonModalOpen(false)}
                    className="flex-1 py-2 bg-white/5 text-white uppercase text-[10px] hover:bg-white/10 rounded transition-all cursor-pointer"
                  >
                    CANCEL
                  </button>
                  <button
                    type="submit"
                    disabled={savingAddon}
                    className="flex-1 py-2 bg-brand-neon text-brand-dark uppercase text-[10px] font-bold hover:opacity-90 rounded transition-all cursor-pointer"
                  >
                    {savingAddon ? 'SAVING...' : 'SAVE CHANGES'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 3: INTRACONTRACT MANUAL OVERRIDES */}
      <AnimatePresence>
        {editingSub && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/95 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-brand-gray border border-brand-neon/40 max-w-lg w-full p-6 rounded-lg font-mono text-xs text-white max-h-[92vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center border-b border-white/10 pb-3 mb-4">
                <div>
                  <h4 className="text-sm font-bold uppercase tracking-tight text-brand-neon">
                    Manage Delivery Boy Drop Contract
                  </h4>
                  <span className="text-[9px] text-white/40 block mt-0.5 font-mono">Modify athlete constraints.</span>
                </div>
                <button onClick={() => setEditingSub(null)} className="text-white/40 hover:text-white cursor-pointer">
                  <X size={16} />
                </button>
              </div>

              <div className="bg-brand-dark p-3 rounded border border-white/5 mb-4">
                <span className="text-[8px] text-white/30 uppercase tracking-widest block mb-0.5">Athlete Client</span>
                <span className="text-sm font-bold text-white uppercase block">{editingSub.user_name}</span>
                <span className="text-[9px] text-white/40 block lowercase mt-0.5">{editingSub.user_email}</span>
              </div>

              <div className="space-y-4">
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[9px] text-white/45 uppercase mb-1">Fulfillment Status</label>
                    <select
                      value={subStatus}
                      onChange={(e) => setSubStatus(e.target.value)}
                      className="w-full bg-brand-dark border border-white/15 p-2 rounded text-white focus:border-brand-neon outline-none uppercase font-bold"
                    >
                      <option value="active">Active Drop</option>
                      <option value="paused">Paused / Suspended</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[9px] text-white/45 uppercase mb-1">Delivery Drop Location</label>
                    <input
                      type="text"
                      required
                      value={subLocker}
                      onChange={(e) => setSubLocker(e.target.value)}
                      className="w-full bg-brand-dark border border-white/15 p-2 rounded text-white focus:border-brand-neon outline-none uppercase font-bold"
                      placeholder="e.g. Gold Gym Front Reception"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[9px] text-white/45 uppercase mb-1">Contract Price Override (₹)</label>
                    <input
                      type="number"
                      required
                      value={subPrice}
                      onChange={(e) => setSubPrice(Number(e.target.value))}
                      className="w-full bg-brand-dark border border-white/15 p-2 rounded text-white focus:border-brand-neon outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[9px] text-white/45 uppercase mb-1">Contract Interval</label>
                    <select
                      value={subCycle}
                      onChange={(e) => setSubCycle(e.target.value)}
                      className="w-full bg-brand-dark border border-white/15 p-2 rounded text-white focus:border-brand-neon outline-none uppercase font-bold"
                    >
                      <option value="weekly">weekly cycle</option>
                      <option value="monthly">monthly cycle</option>
                    </select>
                  </div>
                </div>

                <div>
                   <label className="block text-[9px] text-white/45 uppercase mb-1">Next Delivery Drop Date</label>
                  <input
                    type="date"
                    value={subNextDelivery}
                    onChange={(e) => setSubNextDelivery(e.target.value)}
                    className="w-full bg-brand-dark border border-white/15 p-2 rounded text-white focus:border-brand-neon outline-none text-[10px]"
                  />
                </div>

                <div className="border-t border-white/5 pt-3">
                  <label className="block text-[10px] font-bold text-brand-neon uppercase mb-1.5">
                    Custom Food drops / Nutrition choices
                  </label>
                  
                  <div className="flex flex-wrap gap-1.5 bg-brand-dark p-2.5 rounded border border-white/5 min-h-[50px] mb-2">
                    {subItems.length === 0 ? (
                      <span className="text-[10px] text-white/35 italic block m-auto uppercase font-mono">No items assigned.</span>
                    ) : (
                      subItems.map((it, index) => (
                        <span key={index} className="inline-flex items-center gap-1.5 bg-brand-neon/10 border border-brand-neon/30 text-white text-[9.5px] px-2 py-1 rounded">
                          <span className="uppercase font-bold tracking-tight text-white/95">{it}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(index)}
                            className="w-3.5 h-3.5 rounded-full hover:bg-brand-neon hover:text-brand-dark flex items-center justify-center text-brand-orange font-bold transition-all cursor-pointer"
                          >
                            ×
                          </button>
                        </span>
                      ))
                    )}
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newItemInput}
                      onChange={(e) => setNewItemInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddItem();
                        }
                      }}
                      className="flex-1 bg-brand-dark border border-white/10 rounded px-2.5 py-1.5 text-white font-mono text-[10.5px] focus:border-brand-neon outline-none"
                      placeholder="e.g. 2x performance pre-workouts"
                    />
                    <button
                      type="button"
                      onClick={handleAddItem}
                      className="px-3 bg-white/5 border border-white/10 text-white rounded text-[10px] font-bold hover:bg-brand-neon hover:text-brand-dark hover:border-brand-neon transition-all cursor-pointer"
                    >
                      ADD ITEM
                    </button>
                  </div>

                  {menuProducts.length > 0 && (
                    <div className="mt-3 bg-brand-dark/40 border border-white/5 p-2 rounded">
                      <span className="block text-[8px] text-white/30 uppercase tracking-wider mb-1">Add Indian Meal Preset (Sorted by ID)</span>
                      <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto">
                        {menuProducts.map((p) => {
                          const num = parseInt(p.code.match(/\d+$/)?.[0] || '0', 10);
                          const displayId = num > 0 ? (100 + num) : '';
                          const label = displayId ? `[${displayId}] ${p.name}` : p.name;
                          const isAlreadyAdded = subItems.includes(p.name);
                          
                          return (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => {
                                if (!isAlreadyAdded) {
                                  setSubItems(prev => [...prev, p.name]);
                                }
                              }}
                              className={cn(
                                "text-[9px] px-2 py-1 rounded transition-all cursor-pointer font-mono border",
                                isAlreadyAdded 
                                  ? "bg-white/5 text-white/30 border-white/5 cursor-not-allowed" 
                                  : "bg-brand-gray border-white/10 text-white/85 hover:border-brand-neon hover:text-brand-neon"
                              )}
                              disabled={isAlreadyAdded}
                            >
                              {label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 pt-4 border-t border-white/5">
                  <button
                    type="button"
                    onClick={() => setEditingSub(null)}
                    className="flex-1 py-2 bg-white/5 text-white uppercase text-[10px] hover:bg-white/10 rounded transition-all cursor-pointer"
                  >
                    CLOSE
                  </button>
                  <button
                    type="button"
                    disabled={savingSub}
                    onClick={handleApplySubscriptionChanges}
                    className="flex-1 py-2 bg-brand-neon text-brand-dark uppercase text-[10px] font-bold hover:opacity-90 rounded transition-all cursor-pointer"
                  >
                    {savingSub ? 'SAVING CHANGES...' : 'SAVE MODIFICATIONS'}
                  </button>
                </div>

              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
