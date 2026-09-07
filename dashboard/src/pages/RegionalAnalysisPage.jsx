// src/pages/RegionalAnalysisPage.jsx
import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { MapPin } from 'lucide-react';
import { getRegionAnalytics, getSegmentAnalytics } from '../services/api';

const fmt = (v) => {
  if (!v && v !== 0) return '—';
  if (v >= 1_000_000) return `₹${(v / 1_000_000).toFixed(2)}M`;
  if (v >= 1_000) return `₹${(v / 1_000).toFixed(1)}K`;
  return `₹${Number(v).toFixed(0)}`;
};

const COLORS = ['#2563eb','#059669','#d97706','#dc2626','#7c3aed','#0891b2','#db2777'];

const RegionalAnalysisPage = () => {
  const [regions, setRegions] = useState([]);
  const [segments, setSegments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getRegionAnalytics(), getSegmentAnalytics()])
      .then(([r, s]) => { setRegions(r); setSegments(s); setLoading(false); });
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64 text-slate-400 text-sm">Loading regional analytics…</div>;
  if (!regions.length) return <div className="flex items-center justify-center h-64 text-slate-400 text-sm">No regional data found.</div>;

  const totalRevenue = regions.reduce((s, r) => s + (r.total_revenue || 0), 0);

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          ['Total Revenue', fmt(totalRevenue)],
          ['Total Regions', regions.length],
          ['Total Orders', regions.reduce((s, r) => s + (r.total_orders || 0), 0).toLocaleString()],
          ['Unique Customers', regions.reduce((s, r) => s + (r.unique_customers || 0), 0).toLocaleString()],
        ].map(([k, v]) => (
          <div key={k} className="fintech-card p-4">
            <p className="text-xs text-slate-500 dark:text-slate-400">{k}</p>
            <p className="text-xl font-bold text-slate-900 dark:text-white mt-1">{v}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Region Revenue Bar */}
        <div className="fintech-card p-5">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-blue-600" /> Revenue by Region
          </h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={regions} layout="vertical" margin={{ top: 0, right: 20, left: 90, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={fmt} />
              <YAxis type="category" dataKey="region" tick={{ fontSize: 10 }} width={85} />
              <Tooltip formatter={(v) => [fmt(v), 'Revenue']} />
              <Bar dataKey="total_revenue" radius={[0, 3, 3, 0]}>
                {regions.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Segment Revenue Pie */}
        <div className="fintech-card p-5">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4">Revenue by Customer Segment</h3>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={segments} dataKey="total_revenue" nameKey="segment"
                cx="50%" cy="50%" outerRadius={85}
                label={({ name, percent }) => `${name} ${(percent*100).toFixed(0)}%`}
                labelLine={false} fontSize={10}>
                {segments.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={(v) => [fmt(v), 'Revenue']} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Region Table */}
      <div className="fintech-card overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">Regional Breakdown</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60">
              <tr>
                {['Region','Revenue','Orders','AOV','Quantity','Customers','Contribution %','Avg Discount'].map(h => (
                  <th key={h} className="px-4 py-2.5 text-left font-semibold text-slate-600 dark:text-slate-400 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {regions.map((r, i) => (
                <tr key={r.region} className="border-t border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="px-4 py-2.5 font-medium text-slate-900 dark:text-white flex items-center gap-2">
                    <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                    {r.region}
                  </td>
                  <td className="px-4 py-2.5 font-semibold text-emerald-600">{fmt(r.total_revenue)}</td>
                  <td className="px-4 py-2.5">{Number(r.total_orders||0).toLocaleString()}</td>
                  <td className="px-4 py-2.5">{fmt(r.avg_order_value)}</td>
                  <td className="px-4 py-2.5">{Number(r.total_quantity||0).toLocaleString()}</td>
                  <td className="px-4 py-2.5">{Number(r.unique_customers||0).toLocaleString()}</td>
                  <td className="px-4 py-2.5">
                    <span className="bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded text-[10px] font-bold">
                      {Number(r.revenue_contribution_pct||0).toFixed(1)}%
                    </span>
                  </td>
                  <td className="px-4 py-2.5">{((r.avg_discount||0)*100).toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Segment Table */}
      {segments.length > 0 && (
        <div className="fintech-card overflow-hidden">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Customer Segment Analysis</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60">
                <tr>
                  {['Segment','Revenue','Orders','AOV','Quantity','Customers','Contribution %'].map(h => (
                    <th key={h} className="px-4 py-2.5 text-left font-semibold text-slate-600 dark:text-slate-400">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {segments.map((s, i) => (
                  <tr key={s.segment} className="border-t border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="px-4 py-2.5 font-medium text-slate-900 dark:text-white">{s.segment}</td>
                    <td className="px-4 py-2.5 font-semibold text-emerald-600">{fmt(s.total_revenue)}</td>
                    <td className="px-4 py-2.5">{Number(s.total_orders||0).toLocaleString()}</td>
                    <td className="px-4 py-2.5">{fmt(s.avg_order_value)}</td>
                    <td className="px-4 py-2.5">{Number(s.total_quantity||0).toLocaleString()}</td>
                    <td className="px-4 py-2.5">{Number(s.unique_customers||0).toLocaleString()}</td>
                    <td className="px-4 py-2.5">
                      <span className="bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded text-[10px] font-bold">
                        {Number(s.revenue_contribution_pct||0).toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default RegionalAnalysisPage;
