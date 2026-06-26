import { useEffect, useState } from 'react';
import Layout from './components/Layout';
import Dashboard from './views/Dashboard';
import OrderFeed from './views/OrderFeed';
import ProductManager from './views/ProductManager';
import OrderHistory from './views/OrderHistory';
import CouponManager from './views/CouponManager';
import Subscriptions from './views/Subscriptions';
import Settings from './views/Settings';
import SeoHub from './views/SeoHub';
import Login from './views/Login';
import OffersManager from './views/OffersManager';
import { getSupabase } from './lib/supabase';

type View = 'dashboard' | 'orders' | 'history' | 'products' | 'coupons' | 'subscriptions' | 'settings' | 'seo' | 'offers';

export default function App() {
  const [activeView, setActiveView] = useState<View>('dashboard');
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [configError, setConfigError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const supabase = getSupabase();
      
      // Get initial session safely
      supabase.auth.getSession().then(({ data, error }) => {
        if (error) {
          console.error('Session retrieval error:', error);
          if (error.message?.toLowerCase().includes('refresh token') || error.message?.toLowerCase().includes('not found')) {
            // Sign out to clear any local storage session caches that are corrupt
            supabase.auth.signOut().catch(() => {});
          }
        }
        setSession(data?.session || null);
        setLoading(false);
      }).catch((err) => {
        console.error('getSession promise rejected:', err);
        setSession(null);
        setLoading(false);
      });

      // Listen for auth changes
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        setSession(session);
      });

      return () => subscription.unsubscribe();
    } catch (err: any) {
      console.error('Supabase initialization failed:', err);
      setConfigError(err.message);
      setLoading(false);
    }
  }, []);

  const renderView = () => {
    // Protected views logic
    if (!session && activeView !== 'products' && activeView !== 'seo') {
      return <Login />;
    }

    switch (activeView) {
      case 'dashboard':
        return <Dashboard />;
      case 'orders':
        return <OrderFeed />;
      case 'history':
        return <OrderHistory />;
      case 'products':
        return <ProductManager session={session} />;
      case 'coupons':
        return <CouponManager />;
      case 'subscriptions':
        return <Subscriptions user={session?.user || null} />;
      case 'settings':
        return <Settings />;
      case 'seo':
        return <SeoHub />;
      case 'offers':
        return <OffersManager />;
      default:
        return <Dashboard />;
    }
  };

  if (configError) {
    return (
      <div className="min-h-screen bg-brand-dark flex items-center justify-center p-6">
        <div className="glass-card max-w-md w-full p-8 border-brand-orange text-center">
          <h2 className="text-2xl font-display text-brand-orange mb-4">SYSTEM CONFIGURATION ERROR</h2>
          <p className="font-mono text-sm text-white/70 mb-6">{configError}</p>
          <div className="text-left font-mono text-[10px] bg-black/50 p-4 rounded text-white/40">
            <p>Please define these in your .env file or deployment settings:</p>
            <ul className="list-disc pl-4 mt-2">
              <li>VITE_SUPABASE_URL</li>
              <li>VITE_SUPABASE_ANON_KEY</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-dark flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-brand-neon border-t-transparent rounded-full animate-spin" />
          <p className="font-mono text-xs tracking-[0.3em] text-brand-neon animate-pulse uppercase">Booting System...</p>
        </div>
      </div>
    );
  }

  return (
    <Layout 
      activeView={activeView} 
      onViewChange={(v) => setActiveView(v as View)}
      user={session?.user || null}
    >
      {renderView()}
    </Layout>
  );
}
