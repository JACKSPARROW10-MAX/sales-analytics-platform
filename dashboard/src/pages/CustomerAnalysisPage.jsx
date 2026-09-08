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

const COLORS = ['#2563EB','#64748B','#334155','#1E293B','#EFF6FF','#1D4ED8','#16A34A'];

const CustomerAnalysisPage = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState('total_revenue');
  const [search, setSearch] = useState('');

  const loadData = () => {
    setLoading(true);
    getCustomerAnalytics().then(d => { setCustomers(d); setLoading(false); });
  };

  useEffect(() => {
    loadData();
    window.addEventListener('dashboard-refresh', loadData);
    return () => window.removeEventListener('dashboard-refresh', loadData);
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

  if (loading) return <div className="flex items-center justify-center h-64 text-[#64748B] text-sm">Loading customer analytics…</div>;
  if (!customers.length) return <div className="flex items-center justify-center h-64 text-[#64748B] text-sm">No customer data found.</div>;

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
            <p className="text-xs text-[#2563EB] dark:text-[#64748B]">{k}</p>
            <p className="text-xl font-bold text-[#0F172A] dark:text-[#EFF6FF] mt-1">{v}</p>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Top 10 by Revenue */}
        <div className="fintech-card p-5">
          <h3 className="text-sm font-bold text-[#0F172A] dark:text-[#EFF6FF] mb-4 flex items-center gap-2">
            <Users className="w-4 h-4 text-[#2563EB] dark:text-[#64748B]" /> Top 10 Customers by Revenue
          </h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={top10} layout="vertical" margin={{ top: 0, right: 20, left: 100, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#64748B" opacity={0.3} />
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
          <h3 className="text-sm font-bold text-[#0F172A] dark:text-[#EFF6FF] mb-4">Revenue by Segment</h3>
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
        <div className="p-4 border-b border-[#EFF6FF] dark:border-[#2563EB] flex items-center gap-3 flex-wrap">
          <h3 className="text-sm font-bold text-[#0F172A] dark:text-[#EFF6FF]">All Customers</h3>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or region…"
            className="ml-auto bg-[#F8FAFC] dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#2563EB] rounded-lg px-3 py-1.5 text-xs w-52" />
          <div className="flex gap-1">
            {[['total_revenue','Revenue'],['total_orders','Orders'],['avg_order_value','AOV']].map(([k,label]) => (
              <button key={k} onClick={() => setSort(k)}
                className={`px-2.5 py-1 rounded text-[11px] font-semibold cursor-pointer
                  ${sort===k ? 'bg-[#2563EB] text-[#EFF6FF]' : 'bg-[#EFF6FF] dark:bg-[#1E293B] text-[#2563EB] dark:text-[#64748B] hover:bg-[#E2E8F0] dark:hover:bg-[#334155]'}`}>
                {label}
              </button>
            ))}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-[#334155]">
              <tr>
                {['#','Customer','Region','Segment','Revenue','Orders','AOV','Contribution','Discount','First Purchase','Last Purchase'].map(h => (
                  <th key={h} className="px-3 py-2.5 text-left font-semibold text-[#EFF6FF] whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.slice(0, 50).map((c, i) => (
                <tr key={c.customer_id} className="border-t border-[#EFF6FF] dark:border-[#2563EB] hover:bg-[#F8FAFC] dark:hover:bg-[#334155]">
                  <td className="px-3 py-2 text-[#64748B]">{i+1}</td>
                  <td className="px-3 py-2 font-medium text-[#0F172A] dark:text-[#EFF6FF]">{c.customer_name}</td>
                  <td className="px-3 py-2 text-[#2563EB] dark:text-[#64748B]">{c.region}</td>
                  <td className="px-3 py-2"><span className="bg-[#EFF6FF] dark:bg-[#334155] text-[#2563EB] dark:text-[#64748B] px-1.5 py-0.5 rounded text-[10px]">{c.segment}</span></td>
                  <td className="px-3 py-2 font-semibold text-[#64748B]">{fmt(c.total_revenue)}</td>
                  <td className="px-3 py-2">{Number(c.total_orders||0).toLocaleString()}</td>
                  <td className="px-3 py-2">{fmt(c.avg_order_value)}</td>
                  <td className="px-3 py-2"><span className="text-[#2563EB] dark:text-[#64748B] font-bold">{Number(c.revenue_contribution_pct||0).toFixed(1)}%</span></td>
                  <td className="px-3 py-2">{((c.avg_discount||0)*100).toFixed(1)}%</td>
                  <td className="px-3 py-2 text-[#64748B]">{c.first_purchase_date?.slice(0,10) || '—'}</td>
                  <td className="px-3 py-2 text-[#64748B]">{c.last_purchase_date?.slice(0,10) || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {sorted.length > 50 && (
            <p className="text-center text-xs text-[#64748B] py-3">Showing top 50 of {sorted.length} customers</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomerAnalysisPage;
