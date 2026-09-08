// src/pages/ProductAnalysisPage.jsx
import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Package } from 'lucide-react';
import { getProductAnalytics } from '../services/api';

const fmt = (v) => {
  if (!v && v !== 0) return '—';
  if (v >= 1_000_000) return `₹${(v / 1_000_000).toFixed(2)}M`;
  if (v >= 1_000) return `₹${(v / 1_000).toFixed(1)}K`;
  return `₹${Number(v).toFixed(0)}`;
};

const COLORS = ['#2563EB','#64748B','#334155','#1E293B','#EFF6FF','#0F172A','#1D4ED8','#16A34A','#1D4ED8','#1E3A8A'];

const ProductAnalysisPage = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [sort, setSort] = useState('total_revenue');

  const loadData = () => {
    setLoading(true);
    getProductAnalytics().then(data => {
      setProducts(data);
      setLoading(false);
    });
  };

  useEffect(() => {
    loadData();
    window.addEventListener('dashboard-refresh', loadData);
    return () => window.removeEventListener('dashboard-refresh', loadData);
  }, []);

  const sorted = [...products].sort((a, b) => (b[sort] || 0) - (a[sort] || 0));

  if (loading) return <div className="flex items-center justify-center h-64 text-[#64748B] text-sm">Loading product analytics…</div>;
  if (!products.length) return <div className="flex items-center justify-center h-64 text-[#64748B] text-sm">No product data — run the ETL pipeline first.</div>;

  return (
    <div className="space-y-6">
      {/* Sort controls */}
      <div className="flex gap-2 flex-wrap">
        {[['total_revenue','By Revenue'],['total_quantity','By Quantity'],['total_orders','By Orders'],['avg_order_value','By AOV']].map(([k, label]) => (
          <button key={k} onClick={() => setSort(k)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors
              ${sort === k ? 'bg-[#2563EB] text-[#EFF6FF]' : 'bg-[#EFF6FF] dark:bg-[#1E293B] text-[#2563EB] dark:text-[#64748B] hover:bg-[#E2E8F0] dark:hover:bg-[#334155]'}`}>
            {label}
          </button>
        ))}
      </div>

      {/* Top Products Bar Chart */}
      <div className="fintech-card p-5">
        <h3 className="text-sm font-bold text-[#0F172A] dark:text-[#EFF6FF] mb-4 flex items-center gap-2">
          <Package className="w-4 h-4 text-[#2563EB] dark:text-[#64748B]" /> Top Products — {sort.replace(/_/g,' ')}
        </h3>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={sorted} layout="vertical" margin={{ top: 0, right: 20, left: 120, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#64748B" opacity={0.3} />
            <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={v => sort === 'total_revenue' || sort === 'avg_order_value' ? fmt(v) : v.toLocaleString()} />
            <YAxis type="category" dataKey="product_name" tick={{ fontSize: 10 }} width={115} />
            <Tooltip formatter={(v) => [sort.includes('revenue') || sort.includes('value') ? fmt(v) : v.toLocaleString(), sort.replace(/_/g,' ')]} />
            <Bar dataKey={sort} radius={[0, 3, 3, 0]}>
              {sorted.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Product Table */}
      <div className="fintech-card overflow-hidden">
        <div className="p-4 border-b border-[#EFF6FF] dark:border-[#2563EB]">
          <h3 className="text-sm font-bold text-[#0F172A] dark:text-[#EFF6FF]">All Products — Detailed Breakdown</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-[#334155]">
              <tr>
                {['Product','Category','Revenue','Qty','Orders','AOV','Contribution %','Avg Discount','Unit Price'].map(h => (
                  <th key={h} className="px-4 py-2.5 text-left font-semibold text-[#EFF6FF] whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.map((p, i) => (
                <tr key={p.product_id}
                  onClick={() => setSelected(selected?.product_id === p.product_id ? null : p)}
                  className={`border-t border-[#EFF6FF] dark:border-[#2563EB] cursor-pointer transition-colors
                    ${selected?.product_id === p.product_id ? 'bg-[#EFF6FF] dark:bg-[#334155]' : 'hover:bg-[#F8FAFC] dark:hover:bg-[#1E293B]'}`}>
                  <td className="px-4 py-2.5 font-medium text-[#0F172A] dark:text-[#EFF6FF]">{p.product_name}</td>
                  <td className="px-4 py-2.5 text-[#2563EB] dark:text-[#64748B]">{p.category}</td>
                  <td className="px-4 py-2.5 font-semibold text-[#64748B]">{fmt(p.total_revenue)}</td>
                  <td className="px-4 py-2.5">{Number(p.total_quantity || 0).toLocaleString()}</td>
                  <td className="px-4 py-2.5">{Number(p.total_orders || 0).toLocaleString()}</td>
                  <td className="px-4 py-2.5">{fmt(p.avg_order_value)}</td>
                  <td className="px-4 py-2.5">
                    <span className="bg-[#EFF6FF] dark:bg-[#334155] text-[#2563EB] dark:text-[#64748B] px-2 py-0.5 rounded text-[10px] font-bold">
                      {Number(p.revenue_contribution_pct || 0).toFixed(1)}%
                    </span>
                  </td>
                  <td className="px-4 py-2.5">{((p.avg_discount || 0) * 100).toFixed(1)}%</td>
                  <td className="px-4 py-2.5">₹{Number(p.unit_price || 0).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Selected Product Detail */}
      {selected && (
        <div className="fintech-card p-5 border-l-4 border-[#2563EB]">
          <h4 className="text-sm font-bold text-[#0F172A] dark:text-[#EFF6FF] mb-3">📦 {selected.product_name} — Detail</h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            {[
              ['Revenue', fmt(selected.total_revenue)],
              ['Quantity', Number(selected.total_quantity).toLocaleString()],
              ['Orders', Number(selected.total_orders).toLocaleString()],
              ['AOV', fmt(selected.avg_order_value)],
              ['Contribution', `${Number(selected.revenue_contribution_pct).toFixed(1)}%`],
              ['Avg Discount', `${((selected.avg_discount||0)*100).toFixed(1)}%`],
              ['Min Order', fmt(selected.min_order_revenue)],
              ['Max Order', fmt(selected.max_order_revenue)],
            ].map(([k, v]) => (
              <div key={k} className="bg-[#F8FAFC] dark:bg-[#1E293B] p-3 rounded-lg">
                <p className="text-[#2563EB] dark:text-[#64748B] mb-0.5">{k}</p>
                <p className="font-bold text-[#0F172A] dark:text-[#EFF6FF]">{v}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductAnalysisPage;
