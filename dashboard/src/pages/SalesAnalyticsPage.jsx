// src/pages/SalesAnalyticsPage.jsx
import React, { useState, useEffect } from 'react';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingUp, RefreshCw } from 'lucide-react';
import { getAnalyticsSummary } from '../services/api';

const fmt = (v) => {
  if (v === null || v === undefined) return '—';
  if (v >= 1_000_000) return `₹${(v / 1_000_000).toFixed(2)}M`;
  if (v >= 1_000) return `₹${(v / 1_000).toFixed(1)}K`;
  return `₹${Number(v).toFixed(0)}`;
};

const MetricCard = ({ label, value, sub }) => (
  <div className="fintech-card p-4 space-y-1">
    <p className="text-xs text-[#235347] dark:text-[#8EB69B] font-medium">{label}</p>
    <p className="text-xl font-bold text-[#051F20] dark:text-[#DAF1DE]">{value}</p>
    {sub && <p className="text-[11px] text-[#8EB69B]">{sub}</p>}
  </div>
);

const SalesAnalyticsPage = () => {
  const [metric, setMetric] = useState('revenue');
  const [period, setPeriod] = useState('monthly');
  const [ma, setMa] = useState(0);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const rows = await getAnalyticsSummary(metric, period, ma);
    setData(rows);
    setLoading(false);
  };

  useEffect(() => {
    load();
    const handleRefresh = () => load();
    window.addEventListener('dashboard-refresh', handleRefresh);
    return () => window.removeEventListener('dashboard-refresh', handleRefresh);
  }, [metric, period, ma]);

  const totalRevenue = data.reduce((s, r) => s + (r.value || 0), 0);
  const avgValue = data.length ? totalRevenue / data.length : 0;
  const maxValue = data.length ? Math.max(...data.map(r => r.value || 0)) : 0;
  const minValue = data.length ? Math.min(...data.map(r => r.value || 0)) : 0;

  const chartLabel = metric === 'revenue' ? 'Revenue (₹)' : metric === 'quantity' ? 'Units Sold' : 'Transactions';

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex gap-1 bg-[#DAF1DE] dark:bg-[#0B2B26] rounded-lg p-1">
          {['revenue', 'quantity', 'transactions'].map(m => (
            <button key={m} onClick={() => setMetric(m)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold capitalize transition-colors cursor-pointer
                ${metric === m ? 'bg-white dark:bg-[#163832] text-[#235347] dark:text-[#DAF1DE] shadow-sm' : 'text-[#235347] hover:text-[#051F20] dark:text-[#8EB69B] dark:hover:text-[#DAF1DE]'}`}>
              {m}
            </button>
          ))}
        </div>
        <div className="flex gap-1 bg-[#DAF1DE] dark:bg-[#0B2B26] rounded-lg p-1">
          {['daily', 'weekly', 'monthly'].map(p => (
            <button key={p} onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold capitalize transition-colors cursor-pointer
                ${period === p ? 'bg-white dark:bg-[#163832] text-[#235347] dark:text-[#DAF1DE] shadow-sm' : 'text-[#235347] hover:text-[#051F20] dark:text-[#8EB69B] dark:hover:text-[#DAF1DE]'}`}>
              {p}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 text-xs text-[#235347] dark:text-[#8EB69B]">
          <span>Moving Avg:</span>
          <select value={ma} onChange={e => setMa(Number(e.target.value))}
            className="bg-white dark:bg-[#0B2B26] border border-[#c4dfc8] dark:border-[#235347] rounded px-2 py-1 text-xs">
            <option value={0}>Off</option>
            <option value={3}>3-period</option>
            <option value={7}>7-period</option>
            <option value={12}>12-period</option>
          </select>
        </div>
        <button onClick={load} className="ml-auto flex items-center gap-1.5 text-xs bg-[#235347] hover:bg-[#163832] text-[#DAF1DE] px-3 py-1.5 rounded-lg transition-colors cursor-pointer">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <MetricCard label="Total" value={metric === 'revenue' ? fmt(totalRevenue) : totalRevenue.toLocaleString()} sub={`Across ${data.length} periods`} />
        <MetricCard label="Average / Period" value={metric === 'revenue' ? fmt(avgValue) : avgValue.toFixed(0)} />
        <MetricCard label="Peak" value={metric === 'revenue' ? fmt(maxValue) : maxValue.toLocaleString()} />
        <MetricCard label="Trough" value={metric === 'revenue' ? fmt(minValue) : minValue.toLocaleString()} />
      </div>

      {/* Trend Chart */}
      <div className="fintech-card p-5">
        <h3 className="text-sm font-bold text-[#051F20] dark:text-[#DAF1DE] mb-4 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-[#235347] dark:text-[#8EB69B]" /> {chartLabel} Trend — {period}
        </h3>
        {loading ? (
          <div className="h-64 flex items-center justify-center text-[#8EB69B] text-xs">Loading…</div>
        ) : data.length === 0 ? (
          <div className="h-64 flex items-center justify-center text-[#8EB69B] text-xs">No data — run the pipeline first.</div>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <defs>
                <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#235347" stopOpacity={0.18} />
                  <stop offset="95%" stopColor="#235347" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#8EB69B" opacity={0.3} />
              <XAxis dataKey="period_start" tick={{ fontSize: 10 }} tickFormatter={v => v?.slice(0, 7)} />
              <YAxis tick={{ fontSize: 10 }} tickFormatter={v => metric === 'revenue' ? fmt(v) : v.toLocaleString()} />
              <Tooltip formatter={(v) => [metric === 'revenue' ? fmt(v) : v.toLocaleString(), chartLabel]} labelFormatter={l => `Period: ${l?.slice(0, 10)}`} />
              <Area type="monotone" dataKey="value" name={chartLabel} stroke="#235347" strokeWidth={2} fill="url(#grad)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Bar chart for comparison */}
      {!loading && data.length > 0 && (
        <div className="fintech-card p-5">
          <h3 className="text-sm font-bold text-[#051F20] dark:text-[#DAF1DE] mb-4">Period-by-Period Breakdown</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data.slice(-20)} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#8EB69B" opacity={0.3} />
              <XAxis dataKey="period_start" tick={{ fontSize: 10 }} tickFormatter={v => v?.slice(0, 7)} />
              <YAxis tick={{ fontSize: 10 }} tickFormatter={v => metric === 'revenue' ? fmt(v) : v} />
              <Tooltip formatter={(v) => [metric === 'revenue' ? fmt(v) : v.toLocaleString(), chartLabel]} />
              <Bar dataKey="value" fill="#235347" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

export default SalesAnalyticsPage;
