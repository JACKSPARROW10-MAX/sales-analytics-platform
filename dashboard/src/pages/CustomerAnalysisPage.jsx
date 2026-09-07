// src/pages/CustomerAnalysisPage.jsx
import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from 'recharts';
import { Users } from 'lucide-react';
import { getCustomerAnalytics } from '../services/api';

const fmt = (v) => {
  if (!v && v !== 0) return '—';
  if (v >= 1_000_000) return `₹${(v / 1_000_000).toFixed(2)}M`;
  if (v >= 1_000) return `₹${(v / 1_000).toFixed(1)}K`;
  return `₹${Number(v).toFixed(0)}`;
};

const COLORS = ['#2563eb','#059669','#d97706','#dc2626','#7c3aed','#0891b2','#db2777'];

const CustomerAnalysisPage = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState('total_revenue');
  const [search, setSearch] = useState('');

  useEffect(() => {
    getCustomerAnalytics().then(d => { setCustomers(d); setLoading(false); });
  }, []);

  const sorted = [...customers]
    .filter(c => c.customer_name?.toLowerCase().includes(search.toLowerCase()) || c.region?.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => (b[sort] || 0) - (a[sort] || 0));

  const top10 = sorted.slice(0, 10);

  // Segment breakdown
  const segmentMap = {};
  customers.forEach(c => {
    if (!segmentMap[c.segment]) segmentMap[c.segment] = 0;
    segmentMap[c.segment] += (c.total_revenue || 0);
  });
  const segmentData = Object.entries(segmentMap).map(([name, value]) => ({ name, value: Math.round(value) }));

  if (loading) return <div className="flex items-center justify-center h-64 text-slate-400 text-sm">Loading customer analytics…</div>;
  if (!customers.length) return <div className="flex items-center justify-center h-64 text-slate-400 text-sm">No customer data found.</div>;

  const totalRevenue = customers.reduce((s, c) => s + (c.total_revenue || 0), 0);
  const totalOrders = customers.reduce((s, c) => s + (c.total_orders || 0), 0);
  const avgAOV = customers.length ? totalRevenue / customers.length : 0;

  return (
    <div className="space-y-6">
      {/* Summary KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          ['Total Customers', customers.length],
          ['Total Revenue', fmt(totalRevenue)],
          ['Total Orders', totalOrders.toLocaleString()],
          ['Avg Revenue / Customer', fmt(avgAOV)],
        ].map(([k, v]) => (
          <div key={k} className="fintech-card p-4">
            <p className="text-xs text-slate-500 dark:text-slate-400">{k}</p>
            <p className="text-xl font-bold text-slate-900 dark:text-white mt-1">{v}</p>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Top 10 by Revenue */}
        <div className="fintech-card p-5">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-600" /> Top 10 Customers by Revenue
          </h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={top10} layout="vertical" margin={{ top: 0, right: 20, left: 100, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={fmt} />
              <YAxis type="category" dataKey="customer_name" tick={{ fontSize: 9 }} width={95} />
              <Tooltip formatter={(v) => [fmt(v), 'Revenue']} />
              <Bar dataKey="total_revenue" radius={[0, 3, 3, 0]}>
                {top10.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Segment Pie */}
        <div className="fintech-card p-5">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4">Revenue by Segment</h3>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={segmentData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={85} label={({ name, percent }) => `${name} ${(percent*100).toFixed(0)}%`} labelLine={false} fontSize={10}>
                {segmentData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={(v) => [fmt(v), 'Revenue']} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Customer Table */}
      <div className="fintech-card overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3 flex-wrap">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">All Customers</h3>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or region…"
            className="ml-auto bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs w-52" />
          <div className="flex gap-1">
            {[['total_revenue','Revenue'],['total_orders','Orders'],['avg_order_value','AOV']].map(([k,label]) => (
              <button key={k} onClick={() => setSort(k)}
                className={`px-2.5 py-1 rounded text-[11px] font-semibold cursor-pointer
                  ${sort===k ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700'}`}>
                {label}
              </button>
            ))}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60">
              <tr>
                {['#','Customer','Region','Segment','Revenue','Orders','AOV','Contribution','Discount','First Purchase','Last Purchase'].map(h => (
                  <th key={h} className="px-3 py-2.5 text-left font-semibold text-slate-600 dark:text-slate-400 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.slice(0, 50).map((c, i) => (
                <tr key={c.customer_id} className="border-t border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="px-3 py-2 text-slate-400">{i+1}</td>
                  <td className="px-3 py-2 font-medium text-slate-900 dark:text-white">{c.customer_name}</td>
                  <td className="px-3 py-2 text-slate-500">{c.region}</td>
                  <td className="px-3 py-2"><span className="bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-1.5 py-0.5 rounded text-[10px]">{c.segment}</span></td>
                  <td className="px-3 py-2 font-semibold text-emerald-600">{fmt(c.total_revenue)}</td>
                  <td className="px-3 py-2">{Number(c.total_orders||0).toLocaleString()}</td>
                  <td className="px-3 py-2">{fmt(c.avg_order_value)}</td>
                  <td className="px-3 py-2"><span className="text-blue-600 font-bold">{Number(c.revenue_contribution_pct||0).toFixed(1)}%</span></td>
                  <td className="px-3 py-2">{((c.avg_discount||0)*100).toFixed(1)}%</td>
                  <td className="px-3 py-2 text-slate-400">{c.first_purchase_date?.slice(0,10) || '—'}</td>
                  <td className="px-3 py-2 text-slate-400">{c.last_purchase_date?.slice(0,10) || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {sorted.length > 50 && (
            <p className="text-center text-xs text-slate-400 py-3">Showing top 50 of {sorted.length} customers</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomerAnalysisPage;
