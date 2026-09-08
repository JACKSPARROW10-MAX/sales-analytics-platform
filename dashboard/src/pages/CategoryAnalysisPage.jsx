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

const COLORS = ['#235347','#8EB69B','#163832','#0B2B26','#DAF1DE','#2d6b5a'];

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

  if (loading) return <div className="flex items-center justify-center h-64 text-[#8EB69B] text-sm">Loading category analytics…</div>;
  if (!categories.length) return <div className="flex items-center justify-center h-64 text-[#8EB69B] text-sm">No category data found.</div>;

  const displayData = view === 'category' ? categories : subcategories;

  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        {[['category','Category'],['subcategory','Subcategory']].map(([k,label]) => (
          <button key={k} onClick={() => setView(k)}
            className={`px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-colors
              ${view===k ? 'bg-[#235347] text-[#DAF1DE]' : 'bg-[#DAF1DE] dark:bg-[#0B2B26] text-[#235347] dark:text-[#8EB69B] hover:bg-[#c4dfc8] dark:hover:bg-[#163832]'}`}>
            {label} View
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Revenue Bar */}
        <div className="fintech-card p-5">
          <h3 className="text-sm font-bold text-[#051F20] dark:text-[#DAF1DE] mb-4 flex items-center gap-2">
            <Tag className="w-4 h-4 text-[#235347] dark:text-[#8EB69B]" /> Revenue by {view === 'category' ? 'Category' : 'Subcategory'}
          </h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={displayData} layout="vertical" margin={{ top: 0, right: 20, left: 100, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#8EB69B" opacity={0.3} />
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
          <h3 className="text-sm font-bold text-[#051F20] dark:text-[#DAF1DE] mb-4">Revenue Contribution %</h3>
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
        <div className="p-4 border-b border-[#DAF1DE] dark:border-[#235347]">
          <h3 className="text-sm font-bold text-[#051F20] dark:text-[#DAF1DE]">
            {view === 'category' ? 'Category' : 'Subcategory'} Breakdown
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-[#163832]">
              <tr>
                {(view === 'category'
                  ? ['Category','Revenue','Quantity','Orders','AOV','Contribution %','Avg Discount','Products']
                  : ['Category','Subcategory','Revenue','Quantity','Orders','AOV','Contribution %','Products']
                ).map(h => (
                  <th key={h} className="px-4 py-2.5 text-left font-semibold text-[#DAF1DE] whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {displayData.map((row, i) => (
                <tr key={i} className="border-t border-[#DAF1DE] dark:border-[#235347] hover:bg-[#EDF8EF] dark:hover:bg-[#163832]">
                  <td className="px-4 py-2.5 font-medium text-[#051F20] dark:text-[#DAF1DE]">{row.category}</td>
                  {view === 'subcategory' && <td className="px-4 py-2.5 text-[#235347] dark:text-[#8EB69B]">{row.subcategory}</td>}
                  <td className="px-4 py-2.5 font-semibold text-[#8EB69B]">{fmt(row.total_revenue)}</td>
                  <td className="px-4 py-2.5">{Number(row.total_quantity||0).toLocaleString()}</td>
                  <td className="px-4 py-2.5">{Number(row.total_orders||0).toLocaleString()}</td>
                  <td className="px-4 py-2.5">{fmt(row.avg_order_value)}</td>
                  <td className="px-4 py-2.5">
                    <span className="bg-[#DAF1DE] dark:bg-[#163832] text-[#235347] dark:text-[#8EB69B] px-2 py-0.5 rounded text-[10px] font-bold">
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
