import { useEffect, useState } from 'react';
import { getSupabase } from '../lib/supabase';
import { Order } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Clock, 
  Flame, 
  CheckCircle2, 
  Truck, 
  AlertCircle,
  Hash,
  User,
  MoreVertical
} from 'lucide-react';
import { playNotificationSound } from '../lib/sounds';

import { cn } from '../lib/utils';

type OrderStatus = Order['status'];

const STATUS_CONFIG: Record<OrderStatus, { label: string; icon: any; color: string }> = {
  pending: { label: 'PENDING', icon: Clock, color: 'text-white/40' },
  preparing: { label: 'PREPARING', icon: Flame, color: 'text-brand-orange' },
  ready: { label: 'READY', icon: CheckCircle2, color: 'text-brand-neon' },
  delivered: { label: 'DELIVERED', icon: Truck, color: 'text-white/20' },
  cancelled: { label: 'CANCELLED', icon: AlertCircle, color: 'text-red-500' }
};

export default function OrderFeed() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [configError, setConfigError] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [activeTab, setActiveTab] = useState<OrderStatus>('pending');
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  useEffect(() => {
    let subscription: any;
    
    try {
      const supabase = getSupabase();
      fetchOrders();

      subscription = supabase
        .channel('orders_channel')
        .on(
          'postgres_changes' as any,
          { event: '*', table: 'orders', schema: 'public' },
          (payload: any) => {
            if (payload.eventType === 'INSERT') {
              setOrders(prev => [payload.new as Order, ...prev]);
              playNotificationSound();
            } else if (payload.eventType === 'UPDATE') {
              setOrders(prev => prev.map(o => o.id === payload.new.id ? payload.new as Order : o));
              // Update selected order if it was the one modified
              setSelectedOrder(prev => prev && prev.id === payload.new.id ? payload.new as Order : prev);
            } else if (payload.eventType === 'DELETE') {
              setOrders(prev => prev.filter(o => o.id !== payload.old.id));
              if (selectedOrder?.id === payload.old.id) setSelectedOrder(null);
            }
          }
        )
        .subscribe();
    } catch (e: any) {
      setConfigError(e.message);
      setLoading(false);
    }

    return () => {
      if (subscription) subscription.unsubscribe();
    };
  }, []);

  const fetchOrders = async () => {
    try {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        setOrders(data);
      }
    } catch (e: any) {
      setConfigError(e.message);
    }
    setLoading(false);
  };

  const deleteOrder = async (id: number) => {
    try {
      const supabase = getSupabase();
      const { error } = await supabase.from('orders').delete().eq('id', id);
      if (error) throw error;
      
      try {
        // Reset sequence so the next order re-uses the deleted ID if it was the latest
        await supabase.rpc('reset_orders_sequence');
      } catch (err) {
        console.warn('Sequence reset skipped (RPC not found). Update SQL schema for sequence reset feature.');
      }
      
      setOrders(prev => prev.filter(o => o.id !== id));
      if (selectedOrder?.id === id) setSelectedOrder(null);
    } catch (e: any) {
      console.error(e);
      alert(`System Error: ${e.message}\n\nPlease ensure you have applied the latest SQL policies in your Supabase SQL editor to allow deletion.`);
    } finally {
      setDeleteConfirmId(null);
    }
  };

  const updateStatus = async (id: number, newStatus: OrderStatus) => {
    // Optimistic update
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status: newStatus } : o));
    
    // Update selected order if it's currently open in the modal
    if (selectedOrder?.id === id) {
      setSelectedOrder(prev => prev ? { ...prev, status: newStatus } : null);
    }

    try {
      const supabase = getSupabase();
      const { error } = await (supabase.from('orders') as any)
        .update({ status: newStatus })
        .eq('id', id);
      
      if (error) throw error;
    } catch (e: any) {
      // Revert in case of failure (fetch fresh data for this order)
      const supabase = getSupabase();
      const { data } = await supabase.from('orders').select('*').eq('id', id).single();
      if (data) {
        setOrders(prev => prev.map(o => o.id === id ? data as Order : o));
        if (selectedOrder?.id === id) setSelectedOrder(data as Order);
      }
      alert(`System Error: ${e.message}`);
    }
  };

  const allStatuses: OrderStatus[] = ['pending', 'preparing', 'ready', 'delivered', 'cancelled'];
  const getCount = (status: OrderStatus) => orders.filter(o => o.status === status).length;
  const filteredOrders = orders.filter(o => o.status === activeTab);

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
    <div className="space-y-8 pb-12">
      <header className="flex flex-col gap-8">
        <div>
          <h2 className="text-5xl font-display leading-tight tracking-tighter">OPERATIONS FEED</h2>
          <p className="font-mono text-sm text-brand-neon uppercase tracking-widest">Real-time logistics management</p>
        </div>

        {/* Status Dashboard Tabs */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {allStatuses.map((status) => {
            const config = STATUS_CONFIG[status];
            const isActive = activeTab === status;
            const count = getCount(status);
            
            return (
              <motion.button
                key={status}
                whileHover={{ y: -4 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setActiveTab(status)}
                className={cn(
                  "glass-card p-6 flex flex-col gap-4 border-b-4 transition-all relative overflow-hidden group",
                  isActive ? cn("border-b-brand-neon bg-brand-neon/5") : "border-b-transparent hover:border-b-white/20"
                )}
              >
                {isActive && (
                  <motion.div 
                    layoutId="active-glow"
                    className="absolute inset-0 bg-brand-neon/5 pointer-events-none"
                  />
                )}
                <div className="flex justify-between items-start">
                  <div className={cn("p-2 bg-white/5 rounded", isActive ? config.color : "text-white/20")}>
                    <config.icon size={20} />
                  </div>
                  <span className={cn(
                    "font-display text-2xl leading-none",
                    isActive ? "text-brand-neon" : "text-white/20"
                  )}>{count}</span>
                </div>
                <div className="text-left">
                  <h4 className={cn(
                    "font-display text-sm tracking-widest uppercase",
                    isActive ? "text-white" : "text-white/40"
                  )}>{config.label}</h4>
                  <div className={cn(
                    "h-1 w-12 mt-2 transition-all duration-500",
                    isActive ? "bg-brand-neon w-full" : "bg-white/5"
                  )} />
                </div>
              </motion.button>
            );
          })}
        </div>
      </header>

      {/* Focused Status View */}
      <div className="space-y-6">
        <div className="flex justify-between items-end pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className={cn("w-2 h-2 rounded-full animate-pulse", STATUS_CONFIG[activeTab].color.replace('text-', 'bg-'))} />
            <h3 className="font-display text-3xl tracking-tight uppercase">
              {STATUS_CONFIG[activeTab].label} <span className="text-white/20 font-mono text-xl ml-2">[{filteredOrders.length}]</span>
            </h3>
          </div>
          <p className="font-mono text-[10px] text-white/20 uppercase tracking-[0.3em]">Status Sector Active</p>
        </div>

        {filteredOrders.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            <AnimatePresence mode="popLayout">
              {filteredOrders.map((order) => (
                <motion.div
                  key={order.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  onClick={() => setSelectedOrder(order)}
                  className="glass-card p-6 cursor-pointer hover:border-brand-neon/50 group transition-all"
                >
                  <div className="flex justify-between items-start mb-6">
                    <div className="px-3 py-1 bg-white/5 border border-white/10 rounded font-mono text-[10px] text-white/40 uppercase group-hover:text-brand-neon group-hover:border-brand-neon/30 transition-colors">
                      ORD-{order.id.toString().padStart(4, '0')}
                    </div>
                    <span className="font-mono text-[10px] text-white/20">
                      {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 bg-white/5 border border-white/10 flex items-center justify-center text-white/40 group-hover:text-brand-neon transition-colors">
                      <User size={24} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-display text-2xl truncate uppercase leading-none">{order.customer_name}</h4>
                      <p className="font-mono text-[10px] text-white/20 mt-2 uppercase tracking-widest">{order.pickup_point}</p>
                    </div>
                  </div>

                  <div className="bg-black/40 border border-white/5 rounded p-4 mb-6 space-y-2">
                    {(order.items as any[])?.slice(0, 3).map((item: any, i: number) => (
                      <div key={i} className="flex justify-between text-xs font-mono">
                        <span className="text-white/60 truncate pr-4">{item.name}</span>
                        <span className="text-brand-neon">x{item.quantity}</span>
                      </div>
                    ))}
                    {(order.items as any[])?.length > 3 && (
                      <div className="text-[10px] font-mono text-brand-neon pt-2 border-t border-white/5 text-center uppercase tracking-widest">
                        + {(order.items as any[])?.length - 3} additional units
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="font-display text-3xl">₹{(order.final_price || order.total_price).toFixed(2)}</div>
                    <div className="flex gap-2">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          const nextStatusMap: Record<string, OrderStatus> = {
                            'pending': 'preparing',
                            'preparing': 'ready',
                            'ready': 'delivered'
                          };
                          const nextStatus = nextStatusMap[order.status];
                          if (nextStatus) {
                            updateStatus(order.id, nextStatus);
                          }
                        }}
                        className={cn(
                          "px-6 py-3 font-display text-xs tracking-widest transition-all",
                          ['delivered', 'cancelled'].includes(order.status) 
                            ? "hidden"
                            : "bg-brand-neon text-brand-dark hover:shadow-[0_0_20px_rgba(212,255,0,0.4)]"
                        )}
                      >
                        {order.status === 'pending' ? 'PREPARE' : order.status === 'preparing' ? 'READY' : order.status === 'ready' ? 'DELIVER' : 'COMPLETE'}
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-96 border-2 border-dashed border-white/5 rounded-2xl bg-white/5 backdrop-blur-sm">
            <div className="p-6 bg-white/5 rounded-full text-white/10 mb-6">
              {(() => {
                const Icon = STATUS_CONFIG[activeTab].icon;
                return <Icon size={48} strokeWidth={1} />;
              })()}
            </div>
            <p className="font-display text-2xl text-white/20 uppercase tracking-widest">No Active Sessions In {STATUS_CONFIG[activeTab].label}</p>
            <p className="font-mono text-[10px] text-white/10 mt-2 uppercase tracking-[0.4em]">Sector {activeTab} is clear</p>
          </div>
        )}
      </div>

      {/* Order Detail Modal */}
      <AnimatePresence>
        {selectedOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-brand-dark/90 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="glass-card w-full max-w-2xl overflow-hidden flex flex-col md:flex-row h-full max-h-[700px]"
            >
              <div className="w-full md:w-1/3 bg-brand-neon p-8 flex flex-col">
                <div className="flex items-center gap-2 text-brand-dark opacity-40 mb-4">
                  <Hash size={18} />
                  <span className="font-mono text-sm font-bold">ORD-{selectedOrder.id}</span>
                </div>
                <h3 className="text-4xl font-display text-brand-dark mb-2 leading-none uppercase">{selectedOrder.customer_name}</h3>
                <p className="font-mono text-[10px] text-brand-dark opacity-60 tracking-widest mb-8">{selectedOrder.customer_phone}</p>
                
                <div className="mt-auto space-y-6">
                  <div>
                    <span className="block font-mono text-[10px] text-brand-dark opacity-40 tracking-widest uppercase mb-1">Status</span>
                    <div className="flex items-center gap-2 p-3 bg-brand-dark/10 rounded-lg text-brand-dark">
                      {(() => {
                        const Config = STATUS_CONFIG[selectedOrder.status];
                        return <><Config.icon size={20} /> <span className="font-display text-xl tracking-widest">{Config.label}</span></>;
                      })()}
                    </div>
                  </div>
                  <div>
                    <span className="block font-mono text-[10px] text-brand-dark opacity-40 tracking-widest uppercase mb-1">Pick-up Point</span>
                    <div className="flex items-center gap-2 font-display text-xl text-brand-dark uppercase">
                      <Truck size={20} /> {selectedOrder.pickup_point}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex-1 p-8 overflow-y-auto custom-scrollbar flex flex-col">
                <div className="flex justify-between items-center mb-8">
                  <h4 className="font-mono text-xs tracking-[0.4em] text-white/40 uppercase">Manifest List</h4>
                  <button onClick={() => setSelectedOrder(null)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                    <AlertCircle size={24} className="rotate-45" />
                  </button>
                </div>

                <div className="flex-1 space-y-4">
                  {(selectedOrder.items as any[]).map((item, i) => (
                    <div key={i} className="flex justify-between items-center p-4 bg-white/5 border border-white/5 rounded">
                      <div>
                        <p className="font-display text-lg leading-none uppercase">{item.name}</p>
                        <p className="font-mono text-[10px] text-white/40 mt-1 uppercase">Unit ID: {item.id}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-display text-xl text-brand-neon">x{item.quantity}</p>
                        <p className="font-mono text-[10px] text-white/40 mt-1">₹{((item.price || 0) * item.quantity).toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-8 pt-8 border-t border-white/10 space-y-4">
                  <div className="flex justify-between font-mono text-xs text-white/40">
                    <span>Subtotal</span>
                    <span>₹{selectedOrder.total_price.toFixed(2)}</span>
                  </div>
                  {selectedOrder.discount_amount > 0 && (
                    <div className="flex justify-between font-mono text-xs text-brand-orange">
                      <span>Discount</span>
                      <span>-₹{selectedOrder.discount_amount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center pt-2">
                    <span className="font-display text-2xl tracking-tighter">TOTAL AMOUNT</span>
                    <span className="font-display text-4xl text-brand-neon tracking-tighter">₹{selectedOrder.final_price?.toFixed(2) || selectedOrder.total_price.toFixed(2)}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-8">
                  {selectedOrder.status !== 'delivered' && selectedOrder.status !== 'cancelled' ? (
                    <>
                      <button 
                        onClick={() => updateStatus(selectedOrder.id, 'cancelled')}
                        className="py-4 border border-brand-orange text-brand-orange font-display tracking-[0.2em] hover:bg-brand-orange hover:text-brand-dark transition-all"
                      >
                        ABORT ORDER
                      </button>
                      {selectedOrder.status !== 'ready' ? (
                        <button 
                          onClick={() => {
                            const next: Record<string, OrderStatus> = { 'pending': 'preparing', 'preparing': 'ready' };
                            const nextStatus = next[selectedOrder.status];
                            if (nextStatus) updateStatus(selectedOrder.id, nextStatus);
                          }}
                          className="py-4 bg-brand-neon text-brand-dark font-display tracking-[0.2em] hover:shadow-[0_0_20px_rgba(212,255,0,0.5)] transition-all"
                        >
                          PUSH TO {selectedOrder.status === 'pending' ? 'PREPARING' : 'READY'}
                        </button>
                      ) : (
                        <button 
                          onClick={() => updateStatus(selectedOrder.id, 'delivered')}
                          className="py-4 bg-green-500 text-brand-dark font-display tracking-[0.2em] hover:shadow-[0_0_20px_rgba(34,197,94,0.5)] transition-all"
                        >
                          MARK AS DELIVERED
                        </button>
                      )}
                    </>
                  ) : (
                    <button 
                      onClick={() => setSelectedOrder(null)}
                      className="col-span-2 py-4 bg-white/5 text-white/40 font-display tracking-[0.2em] hover:bg-white/10 transition-all uppercase"
                    >
                      Exit Order Report
                    </button>
                  )}
                  
                  {/* Delete Button for Admin Override */}
                  {deleteConfirmId === selectedOrder.id ? (
                    <div className="col-span-2 flex items-center justify-between gap-4 border border-brand-orange p-3 rounded mt-4">
                      <span className="font-mono text-xs text-brand-orange uppercase animate-pulse">PERMANENTLY WIPE ORDER?</span>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => deleteOrder(selectedOrder.id)}
                          className="px-4 py-2 bg-brand-orange text-brand-dark rounded font-mono text-[10px] font-bold uppercase cursor-pointer"
                        >
                          CONFIRM DELETE
                        </button>
                        <button 
                          onClick={() => setDeleteConfirmId(null)}
                          className="px-4 py-2 border border-white/10 hover:border-white/20 rounded font-mono text-[10px] font-bold uppercase text-white/60 hover:text-white cursor-pointer"
                        >
                          CANCEL
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button 
                      onClick={() => setDeleteConfirmId(selectedOrder.id)}
                      className="col-span-2 py-4 border border-red-500/20 text-red-500 font-display tracking-[0.2em] hover:bg-red-500/90 hover:text-white transition-all uppercase mt-4 cursor-pointer"
                    >
                      Delete Order Permanently
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

