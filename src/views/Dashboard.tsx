import React, { useEffect, useState } from 'react';
import { 
  Activity, 
  DollarSign, 
  Zap, 
  Users,
  ArrowUpRight,
  TrendingDown,
  AlertCircle
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from 'recharts';
import { motion } from 'motion/react';
import { getSupabase } from '../lib/supabase';
import { Order } from '../types';
import { cn } from '../lib/utils';
import { format, startOfDay } from 'date-fns';

interface StatCardProps {
  label: string;
  value: string;
  trend: string;
  isCustomTrend?: boolean;
}

const StatCard = ({ label, value, trend, isCustomTrend }: StatCardProps) => (
  <div className="glass-card p-6 relative overflow-hidden group">
    <div className="absolute top-0 right-0 w-24 h-24 bg-brand-neon/5 blur-2xl group-hover:bg-brand-neon/10 transition-colors" />
    <p className="text-white/40 font-mono text-xs uppercase tracking-[0.2em] mb-2">{label}</p>
    <h3 className="text-4xl font-display tracking-tight mb-2">{value}</h3>
    <div className={cn("flex items-center gap-1 text-xs font-bold", isCustomTrend ? "text-brand-orange" : "text-brand-neon")}>
      {isCustomTrend ? <TrendingDown size={14} /> : <ArrowUpRight size={14} />}
      <span>{trend}</span>
    </div>
  </div>
);

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [configError, setConfigError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    revenue: 0,
    clients: 0,
    protein: 0,
    orders: 0
  });
  const [revenuePulse, setRevenuePulse] = useState<{name: string, value: number}[]>([]);
  const [topItems, setTopItems] = useState<{name: string, sales: number, color: string}[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const supabase = getSupabase();
      
      // Get today's orders
      const today = startOfDay(new Date()).toISOString();
      const { data: orders, error } = await (supabase.from('orders') as any)
        .select('*')
        .gte('created_at', today);

      if (error) throw error;

      if (orders) {
        // Calculate Stats
        const revenue = orders.reduce((acc, curr) => acc + (curr.final_price || curr.total_price), 0);
        let proteinTotal = 0;
        orders.forEach(order => {
          const items = order.items as any[];
          if (Array.isArray(items)) {
            items.forEach(item => {
              proteinTotal += (item.protein || 0) * (item.quantity || 1);
            });
          }
        });
        const distinctClients = new Set(orders.map(o => o.customer_name)).size;

        setStats({
          revenue,
          clients: distinctClients,
          protein: proteinTotal,
          orders: orders.length
        });

        // Revenue Pulse (Group by hour for today)
        const hourlyData: Record<string, number> = {};
        orders.forEach(order => {
          const hour = format(new Date(order.created_at), 'HH:00');
          hourlyData[hour] = (hourlyData[hour] || 0) + order.total_price;
        });

        const pulseChart = Object.entries(hourlyData)
          .map(([name, value]) => ({ name, value }))
          .sort((a, b) => a.name.localeCompare(b.name));
        
        setRevenuePulse(pulseChart);

        // Top Fuel Sources
        const itemCounts: Record<string, number> = {};
        orders.forEach(order => {
          const items = order.items as any[];
          if (Array.isArray(items)) {
            items.forEach(item => {
              if (item.name) {
                itemCounts[item.name] = (itemCounts[item.name] || 0) + (item.quantity || 1);
              }
            });
          }
        });

        const COLORS = ['#D4FF00', '#FF3E00', '#FFFFFF', '#D4FF00', '#FF3E00'];
        const top = Object.entries(itemCounts)
          .map(([name, sales]) => ({ name, sales }))
          .sort((a, b) => b.sales - a.sales)
          .slice(0, 5)
          .map((item, i) => ({ ...item, color: COLORS[i % COLORS.length] }));

        setTopItems(top);
      }
    } catch (e: any) {
      setConfigError(e.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-brand-neon border-t-transparent rounded-full animate-spin" />
          <p className="font-mono text-sm tracking-widest text-brand-neon animate-pulse">SYNCING DATA...</p>
        </div>
      </div>
    );
  }

  if (configError) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="max-w-md glass-card p-8 border-brand-orange text-center">
          <AlertCircle className="w-12 h-12 text-brand-orange mx-auto mb-4" />
          <h3 className="text-2xl font-display text-brand-orange mb-4">SYSTEM OFFLINE</h3>
          <p className="font-mono text-sm text-white/60 mb-6">{configError}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header className="flex justify-between items-end">
        <div>
          <h2 className="text-5xl font-display leading-tight tracking-tighter">DASHBOARD</h2>
          <p className="font-mono text-sm text-brand-neon uppercase tracking-widest">Real-time performance metrics</p>
        </div>
        <div className="flex gap-4">
          <div className="px-4 py-2 border border-white/20 bg-white/5 font-mono text-xs uppercase">
            STATUS: <span className="text-brand-neon">OPERATIONAL</span>
          </div>
          <div className="px-4 py-2 border border-white/20 bg-white/5 font-mono text-xs uppercase">
            TODAY: <span className="text-brand-neon">{stats.orders} ORDERS</span>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard label="Daily Revenue" value={`₹${stats.revenue.toFixed(2)}`} trend="Live Total" />
        <StatCard label="Unique Clients" value={stats.clients.toString()} trend="Loyalty Index" />
        <StatCard label="Protein Sold" value={`${(stats.protein / 1000).toFixed(1)}kg`} trend="Nutrient Mass" />
        <StatCard label="Avg Turnaround" value="~15m" trend="Logistics Efficiency" isCustomTrend />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 glass-card p-8 min-h-[400px]">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-2xl font-display">Revenue Pulse</h3>
          </div>
          <div className="h-[300px] w-full" style={{ minHeight: '300px' }}>
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
              <AreaChart data={revenuePulse.length > 0 ? revenuePulse : [{name: 'Waiting', value: 0}]}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#D4FF00" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#D4FF00" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f1f1f" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  stroke="#404040" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false}
                  fontFamily="JetBrains Mono"
                />
                <YAxis 
                  stroke="#404040" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false}
                  fontFamily="JetBrains Mono"
                  tickFormatter={(val) => `₹${val}`}
                />
                <Tooltip 
                  formatter={(value: number) => [`₹${value.toFixed(2)}`, 'Revenue']}
                  contentStyle={{ 
                    backgroundColor: '#141414', 
                    border: '1px solid #D4FF00',
                    color: '#fff',
                    fontFamily: 'JetBrains Mono',
                    fontSize: '12px'
                  }} 
                />
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#D4FF00" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorValue)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-card p-8">
          <h3 className="text-2xl font-display mb-8">TOP FUEL SOURCES</h3>
          <div className="h-[300px] w-full" style={{ minHeight: '300px' }}>
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
              <BarChart data={topItems.length > 0 ? topItems : [{name: 'N/A', sales: 0, color: '#111'}]} layout="vertical">
                <XAxis type="number" hide />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  stroke="#404040" 
                  fontSize={8} 
                  width={100}
                  axisLine={false}
                  tickLine={false}
                  fontFamily="JetBrains Mono"
                />
                <Tooltip cursor={{ fill: 'transparent' }} />
                <Bar dataKey="sales" radius={[0, 4, 4, 0]} barSize={20}>
                  {topItems.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          {topItems.length > 0 && (
            <div className="mt-4 pt-4 border-t border-white/5 space-y-2">
              <div className="flex justify-between items-center text-[10px] font-mono text-white/40 uppercase">
                <span>Core Inventory Sync</span>
                <span className="text-brand-neon">SECURED</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
