// src/pages/PricingPage.jsx
import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ScatterChart, Scatter } from 'recharts';
import { Percent } from 'lucide-react';
import { getPricingAnalytics } from '../services/api';

const fmt = (v) => {
  if (!v && v !== 0) return '—';
  if (v >= 1_000_000) return `₹${(v / 1_000_000).toFixed(2)}M`;
  if (v >= 1_000) return `₹${(v / 1_000).toFixed(1)}K`;
  return `₹${Number(v).toFixed(0)}`;
};

const COLORS = ['#235347','#8EB69B','#163832','#0B2B26','#DAF1DE','#2d6b5a'];

const PricingPage = () => {
  const [data, setData] = useState({ summary: {}, by_product: [], by_category: [], discount_vs_quantity: [] });
  const [loading, setLoading] = useState(true);

  const loadData = () => {
    setLoading(true);
    getPricingAnalytics()
      .then(d => { setData(d || { summary: {}, by_product: [], by_category: [], discount_vs_quantity: [] }); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
    window.addEventListener('dashboard-refresh', loadData);
    return () => window.removeEventListener('dashboard-refresh', loadData);
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64 text-[#8EB69B] text-sm">Loading pricing analytics…</div>;

  const { summary, by_product, by_category, discount_vs_quantity } = data;

  return (
    <div className="space-y-6">
      {/* Summary KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          ['Avg Discount Rate', `${((summary.avg_discount || 0) * 100).toFixed(1)}%`],
          ['Revenue (Before Discount)', fmt(summary.revenue_before_discount)],
          ['Revenue (After Discount)', fmt(summary.revenue_after_discount)],
          ['Total Discount Given', fmt(summary.total_discount_amount)],
        ].map(([k, v]) => (
          <div key={k} className="fintech-card p-4">
            <p className="text-xs text-[#235347] dark:text-[#8EB69B]">{k}</p>
            <p className="text-xl font-bold text-[#051F20] dark:text-[#DAF1DE] mt-1">{v}</p>
          </div>
        ))}
      </div>

      {/* Effective Discount Banner */}
      {summary.effective_discount_pct !== undefined && (
        <div className="fintech-card p-4 bg-amber-50 dark:bg-amber-950/30 border-l-4 border-amber-500">
          <p className="text-xs font-semibold text-amber-700 dark:text-amber-300">
            Effective Discount Rate across all transactions: <span className="text-lg font-bold">{Number(summary.effective_discount_pct).toFixed(2)}%</span>
          </p>
          <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-1">
            This represents the actual revenue reduction after all discounts. Calculated from real transaction data.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* By Category */}
        <div className="fintech-card p-5">
          <h3 className="text-sm font-bold text-[#051F20] dark:text-[#DAF1DE] mb-4 flex items-center gap-2">
            <Percent className="w-4 h-4 text-amber-600" /> Avg Discount by Category
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={by_category} layout="vertical" margin={{ top: 0, right: 20, left: 90, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#8EB69B" opacity={0.3} />
              <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={v => `${(v*100).toFixed(1)}%`} />
              <YAxis type="category" dataKey="category" tick={{ fontSize: 10 }} width={85} />
              <Tooltip formatter={(v) => [`${(v*100).toFixed(1)}%`, 'Avg Discount']} />
              <Bar dataKey="avg_discount" radius={[0, 3, 3, 0]}>
                {by_category.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Revenue Before vs After Discount */}
        <div className="fintech-card p-5">
          <h3 className="text-sm font-bold text-[#051F20] dark:text-[#DAF1DE] mb-4">Revenue Before vs After Discount — by Category</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={by_category} margin={{ top: 0, right: 10, left: 10, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#8EB69B" opacity={0.3} />
              <XAxis dataKey="category" tick={{ fontSize: 9 }} angle={-20} textAnchor="end" />
              <YAxis tick={{ fontSize: 10 }} tickFormatter={fmt} />
              <Tooltip formatter={(v) => [fmt(v)]} />
              <Bar dataKey="revenue_before_discount" name="Before Discount" fill="#235347" radius={[3, 3, 0, 0]} />
              <Bar dataKey="revenue_after_discount" name="After Discount" fill="#8EB69B" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Highest Discount Products Table */}
      <div className="fintech-card overflow-hidden">
        <div className="p-4 border-b border-[#DAF1DE] dark:border-[#235347]">
          <h3 className="text-sm font-bold text-[#051F20] dark:text-[#DAF1DE]">Products — Discount Analysis (Sorted by Avg Discount)</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-[#163832]">
              <tr>
                {['Product','Category','Avg Discount %','Revenue Before','Revenue After','Discount Amount','Qty'].map(h => (
                  <th key={h} className="px-4 py-2.5 text-left font-semibold text-[#DAF1DE] whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {by_product.map((p, i) => {
                const discountAmt = (p.revenue_before_discount || 0) - (p.revenue_after_discount || 0);
                return (
                  <tr key={i} className="border-t border-[#DAF1DE] dark:border-[#235347] hover:bg-[#EDF8EF] dark:hover:bg-[#163832]">
                    <td className="px-4 py-2.5 font-medium text-[#051F20] dark:text-[#DAF1DE]">{p.product_name}</td>
                    <td className="px-4 py-2.5 text-[#235347] dark:text-[#8EB69B]">{p.category}</td>
                    <td className="px-4 py-2.5">
                      <span className={`font-bold ${(p.avg_discount||0) > 0.25 ? 'text-rose-600' : 'text-amber-600'}`}>
                        {((p.avg_discount||0)*100).toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-[#235347] dark:text-[#8EB69B]">{fmt(p.revenue_before_discount)}</td>
                    <td className="px-4 py-2.5 font-semibold text-[#8EB69B]">{fmt(p.revenue_after_discount)}</td>
                    <td className="px-4 py-2.5 text-rose-600 font-medium">-{fmt(discountAmt)}</td>
                    <td className="px-4 py-2.5">{Number(p.total_quantity||0).toLocaleString()}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PricingPage;
