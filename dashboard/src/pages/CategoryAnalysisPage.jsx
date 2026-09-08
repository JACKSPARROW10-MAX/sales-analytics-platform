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

const COLORS = ['#2563EB','#64748B','#334155','#1E293B','#EFF6FF','#1D4ED8'];

const CategoryAnalysisPage = () => {
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('category');

  const loadData = () => {
    setLoading(true);
    Promise.all([getCategoryAnalytics(), getSubcategoryAnalytics()])
      .then(([cats, subs]) => { 
        setCategories(cats || []); 
        setSubcategories(subs || []); 
        setLoading(false); 
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
    window.addEventListener('dashboard-refresh', loadData);
    return () => window.removeEventListener('dashboard-refresh', loadData);
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64 text-[#64748B] text-sm">Loading category analytics…</div>;
  if (!categories.length) return <div className="flex items-center justify-center h-64 text-[#64748B] text-sm">No category data found.</div>;

  const displayData = view === 'category' ? categories : subcategories;

  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        {[['category','Category'],['subcategory','Subcategory']].map(([k,label]) => (
          <button key={k} onClick={() => setView(k)}
            className={`px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-colors
              ${view===k ? 'bg-[#2563EB] text-[#EFF6FF]' : 'bg-[#EFF6FF] dark:bg-[#1E293B] text-[#2563EB] dark:text-[#64748B] hover:bg-[#E2E8F0] dark:hover:bg-[#334155]'}`}>
            {label} View
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Revenue Bar */}
        <div className="fintech-card p-5">
          <h3 className="text-sm font-bold text-[#0F172A] dark:text-[#EFF6FF] mb-4 flex items-center gap-2">
            <Tag className="w-4 h-4 text-[#2563EB] dark:text-[#64748B]" /> Revenue by {view === 'category' ? 'Category' : 'Subcategory'}
          </h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={displayData} layout="vertical" margin={{ top: 0, right: 20, left: 100, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#64748B" opacity={0.3} />
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
          <h3 className="text-sm font-bold text-[#0F172A] dark:text-[#EFF6FF] mb-4">Revenue Contribution %</h3>
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
        <div className="p-4 border-b border-[#EFF6FF] dark:border-[#2563EB]">
          <h3 className="text-sm font-bold text-[#0F172A] dark:text-[#EFF6FF]">
            {view === 'category' ? 'Category' : 'Subcategory'} Breakdown
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-[#334155]">
              <tr>
                {(view === 'category'
                  ? ['Category','Revenue','Quantity','Orders','AOV','Contribution %','Avg Discount','Products']
                  : ['Category','Subcategory','Revenue','Quantity','Orders','AOV','Contribution %','Products']
                ).map(h => (
                  <th key={h} className="px-4 py-2.5 text-left font-semibold text-[#EFF6FF] whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {displayData.map((row, i) => (
                <tr key={i} className="border-t border-[#EFF6FF] dark:border-[#2563EB] hover:bg-[#F8FAFC] dark:hover:bg-[#334155]">
                  <td className="px-4 py-2.5 font-medium text-[#0F172A] dark:text-[#EFF6FF]">{row.category}</td>
                  {view === 'subcategory' && <td className="px-4 py-2.5 text-[#2563EB] dark:text-[#64748B]">{row.subcategory}</td>}
                  <td className="px-4 py-2.5 font-semibold text-[#64748B]">{fmt(row.total_revenue)}</td>
                  <td className="px-4 py-2.5">{Number(row.total_quantity||0).toLocaleString()}</td>
                  <td className="px-4 py-2.5">{Number(row.total_orders||0).toLocaleString()}</td>
                  <td className="px-4 py-2.5">{fmt(row.avg_order_value)}</td>
                  <td className="px-4 py-2.5">
                    <span className="bg-[#EFF6FF] dark:bg-[#334155] text-[#2563EB] dark:text-[#64748B] px-2 py-0.5 rounded text-[10px] font-bold">
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
