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
    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{label}</p>
    <p className="text-xl font-bold text-slate-900 dark:text-white">{value}</p>
    {sub && <p className="text-[11px] text-slate-400">{sub}</p>}
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

  useEffect(() => { load(); }, [metric, period, ma]);

  const totalRevenue = data.reduce((s, r) => s + (r.value || 0), 0);
  const avgValue = data.length ? totalRevenue / data.length : 0;
  const maxValue = data.length ? Math.max(...data.map(r => r.value || 0)) : 0;
  const minValue = data.length ? Math.min(...data.map(r => r.value || 0)) : 0;

  const chartLabel = metric === 'revenue' ? 'Revenue (₹)' : metric === 'quantity' ? 'Units Sold' : 'Transactions';

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
          {['revenue', 'quantity', 'transactions'].map(m => (
            <button key={m} onClick={() => setMetric(m)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold capitalize transition-colors cursor-pointer
                ${metric === m ? 'bg-white dark:bg-slate-700 text-blue-700 dark:text-blue-300 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>
              {m}
            </button>
          ))}
        </div>
        <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
          {['daily', 'weekly', 'monthly'].map(p => (
            <button key={p} onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold capitalize transition-colors cursor-pointer
                ${period === p ? 'bg-white dark:bg-slate-700 text-blue-700 dark:text-blue-300 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>
              {p}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
          <span>Moving Avg:</span>
          <select value={ma} onChange={e => setMa(Number(e.target.value))}
            className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-2 py-1 text-xs">
            <option value={0}>Off</option>
            <option value={3}>3-period</option>
            <option value={7}>7-period</option>
            <option value={12}>12-period</option>
          </select>
        </div>
        <button onClick={load} className="ml-auto flex items-center gap-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg transition-colors cursor-pointer">
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
        <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-blue-600" /> {chartLabel} Trend — {period}
        </h3>
        {loading ? (
          <div className="h-64 flex items-center justify-center text-slate-400 text-xs">Loading…</div>
        ) : data.length === 0 ? (
          <div className="h-64 flex items-center justify-center text-slate-400 text-xs">No data — run the pipeline first.</div>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <defs>
                <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563eb" stopOpacity={0.18} />
                  <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="period_start" tick={{ fontSize: 10 }} tickFormatter={v => v?.slice(0, 7)} />
              <YAxis tick={{ fontSize: 10 }} tickFormatter={v => metric === 'revenue' ? fmt(v) : v.toLocaleString()} />
              <Tooltip formatter={(v) => [metric === 'revenue' ? fmt(v) : v.toLocaleString(), chartLabel]} labelFormatter={l => `Period: ${l?.slice(0, 10)}`} />
              <Area type="monotone" dataKey="value" name={chartLabel} stroke="#2563eb" strokeWidth={2} fill="url(#grad)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Bar chart for comparison */}
      {!loading && data.length > 0 && (
        <div className="fintech-card p-5">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4">Period-by-Period Breakdown</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data.slice(-20)} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="period_start" tick={{ fontSize: 10 }} tickFormatter={v => v?.slice(0, 7)} />
              <YAxis tick={{ fontSize: 10 }} tickFormatter={v => metric === 'revenue' ? fmt(v) : v} />
              <Tooltip formatter={(v) => [metric === 'revenue' ? fmt(v) : v.toLocaleString(), chartLabel]} />
              <Bar dataKey="value" fill="#3b82f6" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

export default SalesAnalyticsPage;
