// src/pages/CategoryAnalysisPage.jsx
import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { Tag } from 'lucide-react';
import { getCategoryAnalytics, getSubcategoryAnalytics } from '../services/api';

const fmt = (v) => {
  if (!v && v !== 0) return '—';
  if (v >= 1_000_000) return `₹${(v / 1_000_000).toFixed(2)}M`;
  if (v >= 1_000) return `₹${(v / 1_000).toFixed(1)}K`;
  return `₹${Number(v).toFixed(0)}`;
};

const COLORS = ['#2563eb','#059669','#d97706','#dc2626','#7c3aed','#0891b2'];

const CategoryAnalysisPage = () => {
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('category');

  useEffect(() => {
    Promise.all([getCategoryAnalytics(), getSubcategoryAnalytics()])
      .then(([cats, subs]) => { setCategories(cats); setSubcategories(subs); setLoading(false); });
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64 text-slate-400 text-sm">Loading category analytics…</div>;
  if (!categories.length) return <div className="flex items-center justify-center h-64 text-slate-400 text-sm">No category data found.</div>;

  const displayData = view === 'category' ? categories : subcategories;

  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        {[['category','Category'],['subcategory','Subcategory']].map(([k,label]) => (
          <button key={k} onClick={() => setView(k)}
            className={`px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-colors
              ${view===k ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'}`}>
            {label} View
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Revenue Bar */}
        <div className="fintech-card p-5">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <Tag className="w-4 h-4 text-blue-600" /> Revenue by {view === 'category' ? 'Category' : 'Subcategory'}
          </h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={displayData} layout="vertical" margin={{ top: 0, right: 20, left: 100, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={fmt} />
              <YAxis type="category" dataKey={view === 'category' ? 'category' : 'subcategory'} tick={{ fontSize: 9 }} width={95} />
              <Tooltip formatter={(v) => [fmt(v), 'Revenue']} />
              <Bar dataKey="total_revenue" radius={[0, 3, 3, 0]}>
                {displayData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Contribution Pie */}
        <div className="fintech-card p-5">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4">Revenue Contribution %</h3>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie
                data={displayData}
                dataKey="total_revenue"
                nameKey={view === 'category' ? 'category' : 'subcategory'}
                cx="50%" cy="50%" outerRadius={85}
                label={({ name, percent }) => `${name?.slice(0,12)} ${(percent*100).toFixed(0)}%`}
                labelLine={false} fontSize={9}
              >
                {displayData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={(v) => [fmt(v), 'Revenue']} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Table */}
      <div className="fintech-card overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            {view === 'category' ? 'Category' : 'Subcategory'} Breakdown
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60">
              <tr>
                {(view === 'category'
                  ? ['Category','Revenue','Quantity','Orders','AOV','Contribution %','Avg Discount','Products']
                  : ['Category','Subcategory','Revenue','Quantity','Orders','AOV','Contribution %','Products']
                ).map(h => (
                  <th key={h} className="px-4 py-2.5 text-left font-semibold text-slate-600 dark:text-slate-400 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {displayData.map((row, i) => (
                <tr key={i} className="border-t border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="px-4 py-2.5 font-medium text-slate-900 dark:text-white">{row.category}</td>
                  {view === 'subcategory' && <td className="px-4 py-2.5 text-slate-500">{row.subcategory}</td>}
                  <td className="px-4 py-2.5 font-semibold text-emerald-600">{fmt(row.total_revenue)}</td>
                  <td className="px-4 py-2.5">{Number(row.total_quantity||0).toLocaleString()}</td>
                  <td className="px-4 py-2.5">{Number(row.total_orders||0).toLocaleString()}</td>
                  <td className="px-4 py-2.5">{fmt(row.avg_order_value)}</td>
                  <td className="px-4 py-2.5">
                    <span className="bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded text-[10px] font-bold">
                      {Number(row.revenue_contribution_pct||0).toFixed(1)}%
                    </span>
                  </td>
                  {view === 'category' && <td className="px-4 py-2.5">{((row.avg_discount||0)*100).toFixed(1)}%</td>}
                  <td className="px-4 py-2.5">{Number(row.product_count||0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CategoryAnalysisPage;
