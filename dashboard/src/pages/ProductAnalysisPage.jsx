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

const COLORS = ['#235347','#8EB69B','#163832','#0B2B26','#DAF1DE','#051F20','#2d6b5a','#5a9e82','#3d7a66','#1a4a3c'];

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

  if (loading) return <div className="flex items-center justify-center h-64 text-[#8EB69B] text-sm">Loading product analytics…</div>;
  if (!products.length) return <div className="flex items-center justify-center h-64 text-[#8EB69B] text-sm">No product data — run the ETL pipeline first.</div>;

  return (
    <div className="space-y-6">
      {/* Sort controls */}
      <div className="flex gap-2 flex-wrap">
        {[['total_revenue','By Revenue'],['total_quantity','By Quantity'],['total_orders','By Orders'],['avg_order_value','By AOV']].map(([k, label]) => (
          <button key={k} onClick={() => setSort(k)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors
              ${sort === k ? 'bg-[#235347] text-[#DAF1DE]' : 'bg-[#DAF1DE] dark:bg-[#0B2B26] text-[#235347] dark:text-[#8EB69B] hover:bg-[#c4dfc8] dark:hover:bg-[#163832]'}`}>
            {label}
          </button>
        ))}
      </div>

      {/* Top Products Bar Chart */}
      <div className="fintech-card p-5">
        <h3 className="text-sm font-bold text-[#051F20] dark:text-[#DAF1DE] mb-4 flex items-center gap-2">
          <Package className="w-4 h-4 text-[#235347] dark:text-[#8EB69B]" /> Top Products — {sort.replace(/_/g,' ')}
        </h3>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={sorted} layout="vertical" margin={{ top: 0, right: 20, left: 120, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#8EB69B" opacity={0.3} />
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
        <div className="p-4 border-b border-[#DAF1DE] dark:border-[#235347]">
          <h3 className="text-sm font-bold text-[#051F20] dark:text-[#DAF1DE]">All Products — Detailed Breakdown</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-[#163832]">
              <tr>
                {['Product','Category','Revenue','Qty','Orders','AOV','Contribution %','Avg Discount','Unit Price'].map(h => (
                  <th key={h} className="px-4 py-2.5 text-left font-semibold text-[#DAF1DE] whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.map((p, i) => (
                <tr key={p.product_id}
                  onClick={() => setSelected(selected?.product_id === p.product_id ? null : p)}
                  className={`border-t border-[#DAF1DE] dark:border-[#235347] cursor-pointer transition-colors
                    ${selected?.product_id === p.product_id ? 'bg-[#DAF1DE] dark:bg-[#163832]' : 'hover:bg-[#EDF8EF] dark:hover:bg-[#0B2B26]'}`}>
                  <td className="px-4 py-2.5 font-medium text-[#051F20] dark:text-[#DAF1DE]">{p.product_name}</td>
                  <td className="px-4 py-2.5 text-[#235347] dark:text-[#8EB69B]">{p.category}</td>
                  <td className="px-4 py-2.5 font-semibold text-[#8EB69B]">{fmt(p.total_revenue)}</td>
                  <td className="px-4 py-2.5">{Number(p.total_quantity || 0).toLocaleString()}</td>
                  <td className="px-4 py-2.5">{Number(p.total_orders || 0).toLocaleString()}</td>
                  <td className="px-4 py-2.5">{fmt(p.avg_order_value)}</td>
                  <td className="px-4 py-2.5">
                    <span className="bg-[#DAF1DE] dark:bg-[#163832] text-[#235347] dark:text-[#8EB69B] px-2 py-0.5 rounded text-[10px] font-bold">
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
        <div className="fintech-card p-5 border-l-4 border-[#235347]">
          <h4 className="text-sm font-bold text-[#051F20] dark:text-[#DAF1DE] mb-3">📦 {selected.product_name} — Detail</h4>
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
              <div key={k} className="bg-[#EDF8EF] dark:bg-[#0B2B26] p-3 rounded-lg">
                <p className="text-[#235347] dark:text-[#8EB69B] mb-0.5">{k}</p>
                <p className="font-bold text-[#051F20] dark:text-[#DAF1DE]">{v}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductAnalysisPage;
