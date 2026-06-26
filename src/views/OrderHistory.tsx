import React, { useEffect, useState } from 'react';
import { getSupabase } from '../lib/supabase';
import { Order } from '../types';
import { motion } from 'motion/react';
import { 
  History, 
  Search, 
  Filter, 
  Calendar,
  CheckCircle2,
  XCircle,
  Hash,
  ChevronRight,
  Download,
  FileText,
  TrendingUp,
  PackageCheck
} from 'lucide-react';
import { cn } from '../lib/utils';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function OrderHistory() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'delivered' | 'cancelled'>('all');
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  const deleteOrder = async (id: number) => {
    try {
      const supabase = getSupabase();
      // Remove from backend
      const { error } = await supabase.from('orders').delete().eq('id', id);
      if (error) throw error;
      
      try {
        // Reset sequence so the next order re-uses the deleted ID if it was the latest
        await supabase.rpc('reset_orders_sequence');
      } catch (err) {
        console.warn('Sequence reset skipped (RPC not found). Update SQL schema for sequence reset feature.');
      }
      
      // Remove from local state
      setOrders(prev => prev.filter(o => o.id !== id));
    } catch (e: any) {
      console.error(e);
      alert(`System Error: ${e.message}\n\nPlease ensure you have applied the latest SQL policies in your Supabase SQL editor to allow deletion.`);
    } finally {
      setDeleteConfirmId(null);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .in('status', ['delivered', 'cancelled'])
        .order('created_at', { ascending: false });

      if (!error && data) {
        setOrders(data);
      }
    } catch (e: any) {
      console.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders = orders.filter(o => {
    const matchesSearch = o.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         o.id.toString().includes(searchTerm);
    const matchesFilter = filter === 'all' || o.status === filter;
    return matchesSearch && matchesFilter;
  });

  const totalRevenue = filteredOrders.reduce((sum, o) => sum + (o.final_price || o.total_price), 0);
  const totalOrders = filteredOrders.length;

  const exportToCSV = () => {
    const headers = ['Order ID', 'Customer Name', 'Timestamp', 'Status', 'Total Price'];
    const rows = filteredOrders.map(o => [
      o.id,
      `"${o.customer_name.replace(/"/g, '""')}"`,
      new Date(o.created_at).toLocaleString(),
      o.status,
      (o.final_price || o.total_price).toFixed(2)
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `order_history_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text('ORDER ARCHIVE REPORT', 14, 20);
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);
    doc.text(`Total Orders: ${totalOrders}`, 14, 35);
    doc.text(`Total Revenue: INR ${totalRevenue.toFixed(2)}`, 14, 40);
    
    const tableColumn = ['ID', 'Customer', 'Date', 'Status', 'Total (INR)'];
    const tableRows = filteredOrders.map(o => [
      o.id.toString(),
      o.customer_name,
      new Date(o.created_at).toLocaleDateString(),
      o.status.toUpperCase(),
      (o.final_price || o.total_price).toFixed(2)
    ]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 45,
      theme: 'grid',
      headStyles: { fillColor: [212, 255, 0], textColor: [0, 0, 0], fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [245, 245, 245] }
    });

    doc.save(`order_history_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  return (
    <div className="space-y-8">
      <header className="flex justify-between items-end">
        <div>
          <h2 className="text-5xl font-display leading-tight tracking-tighter">ORDER LOGS</h2>
          <p className="font-mono text-sm text-brand-neon uppercase tracking-widest">Order History Archive</p>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={exportToCSV}
            className="flex items-center gap-2 font-mono text-[10px] px-4 py-2 border border-white/10 hover:border-brand-neon hover:text-brand-neon text-white/40 transition-all tracking-[0.3em] uppercase"
          >
            <Download size={14} /> Export CSV
          </button>
          <button 
            onClick={exportToPDF}
            className="flex items-center gap-2 font-mono text-[10px] px-4 py-2 border border-white/10 hover:border-brand-neon hover:text-brand-neon text-white/40 transition-all tracking-[0.3em] uppercase"
          >
            <FileText size={14} /> Export PDF
          </button>
        </div>
      </header>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-brand-neon transition-colors" size={20} />
          <input 
            type="text"
            placeholder="SEARCH BY CUSTOMER OR ORDER ID..."
            className="w-full bg-brand-gray/30 border border-white/10 py-4 pl-12 pr-4 font-mono text-xs focus:border-brand-neon outline-none text-white tracking-widest uppercase transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
            {(['all', 'delivered', 'cancelled'] as const).map((f) => {
              const labelMap: Record<string, string> = {
                'all': 'ALL ORDERS',
                'delivered': 'SUCCESSFUL',
                'cancelled': 'ABORTED'
              };
              return (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={cn(
                    "px-6 py-4 font-display text-sm tracking-widest transition-all",
                    filter === f 
                      ? "bg-brand-neon text-brand-dark" 
                      : "bg-brand-gray/30 border border-white/10 text-white/40 hover:text-white"
                  )}
                >
                  {labelMap[f]}
                </button>
              );
            })}
        </div>
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-64 gap-4">
            <div className="w-8 h-8 border-2 border-brand-neon border-t-transparent rounded-full animate-spin" />
            <p className="font-mono text-[10px] text-brand-neon animate-pulse tracking-widest">LOADING ORDER LOGS...</p>
          </div>
        ) : filteredOrders.length > 0 ? (
          <>
            <div className="overflow-hidden border border-white/5 rounded-lg">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-white/5 border-b border-white/10 font-mono text-[10px] text-white/40 tracking-[0.3em] uppercase">
                    <th className="p-4 pl-8">ORDER ID</th>
                    <th className="p-4">Customer</th>
                    <th className="p-4">Timestamp</th>
                    <th className="p-4 text-center">Status</th>
                    <th className="p-4 text-right">Total</th>
                    <th className="p-4 text-right pr-8">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredOrders.map((order) => (
                    <motion.tr 
                      key={order.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="group hover:bg-white/5 transition-colors cursor-default"
                    >
                      <td className="p-4 pl-8">
                        <div className="flex items-center gap-2">
                          <Hash size={12} className="text-white/20" />
                          <span className="font-mono text-[10px] text-white/40 group-hover:text-white transition-colors">{order.id}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="font-display text-lg uppercase leading-none">{order.customer_name}</div>
                        <div className="font-mono text-[8px] text-white/20 tracking-widest mt-1">{order.pickup_point}</div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2 font-mono text-[10px] text-white/40">
                          <Calendar size={12} />
                          {new Date(order.created_at).toLocaleDateString()}
                          <span className="opacity-20">|</span>
                          {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex justify-center">
                          <div className={cn(
                            "px-3 py-1 flex items-center gap-2 rounded-full font-mono text-[9px] tracking-widest uppercase",
                            order.status === 'delivered' ? "bg-green-500/10 text-green-500" : "bg-brand-orange/10 text-brand-orange"
                          )}>
                            {order.status === 'delivered' ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                            {order.status === 'delivered' ? 'SUCCESSFUL' : 'ABORTED'}
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-right">
                        <div className="font-display text-xl text-brand-neon">
                          ₹{(order.final_price || order.total_price).toFixed(2)}
                        </div>
                      </td>
                      <td className="p-4 text-right pr-8">
                        {deleteConfirmId === order.id ? (
                          <div className="flex items-center justify-end gap-2">
                            <span className="font-mono text-[9px] text-brand-orange uppercase animate-pulse">SURE?</span>
                            <button 
                              onClick={() => deleteOrder(order.id)}
                              className="font-mono text-[10px] uppercase text-red-500 hover:text-red-400 font-bold transition-colors cursor-pointer"
                            >
                              YES
                            </button>
                            <span className="text-white/20">|</span>
                            <button 
                              onClick={() => setDeleteConfirmId(null)}
                              className="font-mono text-[10px] uppercase text-white/40 hover:text-white transition-colors cursor-pointer"
                            >
                              NO
                            </button>
                          </div>
                        ) : (
                          <button 
                            onClick={() => setDeleteConfirmId(order.id)}
                            className="font-mono text-[10px] uppercase text-red-500/60 hover:text-red-500 transition-colors cursor-pointer"
                            title="Wipe record completely"
                          >
                            DELETE
                          </button>
                        )}
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* History Stats Footer */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
              <div className="glass-card p-6 flex items-center justify-between border-l-4 border-l-brand-neon">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-brand-neon/10 flex items-center justify-center text-brand-neon">
                    <PackageCheck size={24} />
                  </div>
                  <div>
                    <p className="font-mono text-[10px] text-white/40 uppercase tracking-widest">Total Orders</p>
                    <h4 className="font-display text-3xl">{totalOrders} ENTRIES</h4>
                  </div>
                </div>
              </div>
              <div className="glass-card p-6 flex items-center justify-between border-l-4 border-l-brand-neon">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-brand-neon/10 flex items-center justify-center text-brand-neon">
                    <TrendingUp size={24} />
                  </div>
                  <div>
                    <p className="font-mono text-[10px] text-white/40 uppercase tracking-widest">Total Revenue</p>
                    <h4 className="font-display text-3xl">₹{totalRevenue.toFixed(2)}</h4>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-64 border border-dashed border-white/5 rounded-lg text-white/10 uppercase">
            <History size={48} className="mb-4" strokeWidth={1} />
            <p className="font-mono text-xs tracking-widest">No entries found in archive</p>
          </div>
        )}
      </div>
    </div>
  );
}
