import React from 'react';
import { 
  LayoutDashboard, 
  ShoppingBag, 
  ChefHat, 
  History,
  Settings, 
  LogOut,
  Dumbbell,
  User as UserIcon,
  Tag,
  Users,
  Globe,
  Gift
} from 'lucide-react';
import { motion } from 'motion/react';
import { getSupabase } from '../lib/supabase';
import { cn } from '../lib/utils';

interface NavItemProps {
  icon: React.ElementType;
  label: string;
  active: boolean;
  onClick: () => void;
}

const NavItem = ({ icon: Icon, label, active, onClick }: NavItemProps) => (
  <button
    role="menuitem"
    onClick={onClick}
    className={cn(
      "flex items-center gap-4 px-6 py-4 w-full text-left transition-all duration-200 group",
      active 
        ? "bg-brand-neon text-brand-dark" 
        : "text-white/60 hover:text-brand-neon hover:bg-white/5"
    )}
  >
    <Icon className={cn("w-6 h-6", active ? "text-brand-dark" : "group-hover:text-brand-neon")} />
    <span className="font-display text-lg tracking-widest">{label}</span>
    {active && (
      <motion.div 
        layoutId="active-indicator"
        className="ml-auto w-1 h-8 bg-brand-dark"
      />
    )}
  </button>
);

interface LayoutProps {
  children: React.ReactNode;
  activeView: string;
  onViewChange: (view: string) => void;
  user: any;
}

export default function Layout({ children, activeView, onViewChange, user }: LayoutProps) {
  const handleLogout = async () => {
    const supabase = getSupabase();
    await supabase.auth.signOut();
  };

  return (
    <div className="flex h-screen bg-brand-dark overflow-hidden">
      {/* Sidebar */}
      <aside className="w-72 border-r border-white/10 flex flex-col bg-brand-dark relative z-10">
        <div className="p-8 pb-12 flex items-center gap-3">
          <div className="bg-brand-neon p-2">
            <Dumbbell className="w-8 h-8 text-brand-dark" />
          </div>
          <div>
            <h1 className="text-3xl font-display leading-none tracking-tighter">WHEYO</h1>
            <p className="text-[10px] font-mono text-brand-neon tracking-[0.3em] mt-1 uppercase">Admin Central</p>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto" role="menu">
          {user && (
            <>
              <NavItem 
                icon={LayoutDashboard} 
                label="War Room" 
                active={activeView === 'dashboard'} 
                onClick={() => onViewChange('dashboard')} 
              />
              <NavItem 
                icon={ChefHat} 
                label="Order Feed" 
                active={activeView === 'orders'} 
                onClick={() => onViewChange('orders')} 
              />
              <NavItem 
                icon={History} 
                label="Archive" 
                active={activeView === 'history'} 
                onClick={() => onViewChange('history')} 
              />
            </>
          )}
          <NavItem 
            icon={ShoppingBag} 
            label="Inventory" 
            active={activeView === 'products'} 
            onClick={() => onViewChange('products')} 
          />
          <NavItem 
            icon={Globe} 
            label="SEO Hub" 
            active={activeView === 'seo'} 
            onClick={() => onViewChange('seo')} 
          />
          {user && (
            <>
              <NavItem 
                icon={Tag} 
                label="Coupons" 
                active={activeView === 'coupons'} 
                onClick={() => onViewChange('coupons')} 
              />
              <NavItem 
                icon={Gift} 
                label="Offers" 
                active={activeView === 'offers'} 
                onClick={() => onViewChange('offers')} 
              />
              <NavItem 
                icon={Users} 
                label="Subscriptions" 
                active={activeView === 'subscriptions'} 
                onClick={() => onViewChange('subscriptions')} 
              />
            </>
          )}
        </nav>

        <div className="mt-auto border-t border-white/10">
          {user ? (
            <>
              <div className="px-6 py-4 flex items-center gap-3 border-b border-white/5 bg-white/5">
                <div className="w-8 h-8 rounded bg-brand-neon/20 flex items-center justify-center border border-brand-neon/30">
                  <UserIcon className="w-4 h-4 text-brand-neon" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-mono text-white/40 uppercase truncate">{user?.email}</p>
                  <p className="text-[8px] font-mono text-brand-neon uppercase tracking-widest">Operator Active</p>
                </div>
              </div>
              <NavItem 
                icon={Settings} 
                label="Systems" 
                active={activeView === 'settings'} 
                onClick={() => onViewChange('settings')} 
              />
              <button 
                role="menuitem"
                onClick={handleLogout}
                className="flex items-center gap-4 px-6 py-4 w-full text-left text-brand-orange hover:bg-brand-orange/10 transition-colors group"
              >
                <LogOut className="w-6 h-6 group-hover:scale-110 transition-transform" />
                <span className="font-display text-lg tracking-widest">ABORT SESSION</span>
              </button>
            </>
          ) : (
            <button 
              onClick={() => onViewChange('dashboard')} 
              className="flex items-center gap-4 px-6 py-4 w-full text-left text-brand-neon hover:bg-brand-neon/10 transition-colors group"
            >
              <UserIcon className="w-6 h-6 group-hover:scale-110 transition-transform" />
              <span className="font-display text-lg tracking-widest uppercase">Operator Login</span>
            </button>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto relative">
        {/* Top Header Background Blur effect */}
        <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-brand-neon/5 to-transparent pointer-events-none" />
        
        <div className="p-10 relative">
          <motion.div
            key={activeView}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-7xl mx-auto"
          >
            {children}
          </motion.div>
        </div>
      </main>
    </div>
  );
}
