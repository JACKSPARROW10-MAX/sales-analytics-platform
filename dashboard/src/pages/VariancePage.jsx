// src/pages/VariancePage.jsx
// Sales Variance Analysis — Actual vs Expected (Moving Average Baseline)
// This is DIFFERENT from Anomaly Detection.
// Anomaly Detection: Is this transaction statistically unusual?
// Variance Analysis: How much does actual revenue differ from expected (moving avg baseline)?

import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';
import { BarChart2, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { getVarianceData } from '../services/api';

const fmt = (v) => {
  if (!v && v !== 0) return '—';
  if (Math.abs(v) >= 1_000_000) return `₹${(v / 1_000_000).toFixed(2)}M`;
  if (Math.abs(v) >= 1_000) return `₹${(v / 1_000).toFixed(1)}K`;
  return `₹${Number(v).toFixed(0)}`;
};

const VariancePage = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = () => {
    setLoading(true);
    getVarianceData(40)
      .then(d => { setData(d || []); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
    window.addEventListener('dashboard-refresh', loadData);
    return () => window.removeEventListener('dashboard-refresh', loadData);
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64 text-[#8EB69B] text-sm">Loading variance analysis…</div>;
  if (!data.length) return (
    <div className="flex items-center justify-center h-64 text-[#8EB69B] text-sm flex-col gap-2">
      <BarChart2 className="w-8 h-8" />
      <p>No variance data. Run the ETL pipeline with sales data first.</p>
    </div>
  );

  const positive = data.filter(d => d.variance_pct > 0).length;
  const negative = data.filter(d => d.variance_pct < 0).length;
  const avgVariancePct = data.length ? data.reduce((s, d) => s + Math.abs(d.variance_pct || 0), 0) / data.length : 0;
  const maxPositive = [...data].filter(d => d.variance_pct > 0).sort((a, b) => b.variance_pct - a.variance_pct)[0];
  const maxNegative = [...data].filter(d => d.variance_pct < 0).sort((a, b) => a.variance_pct - b.variance_pct)[0];

  return (
    <div className="space-y-6">
      {/* Concept Banner */}
      <div className="fintech-card p-4 bg-[#DAF1DE] dark:bg-[#163832] border-l-4 border-[#235347]">
        <p className="text-xs font-bold text-[#235347] dark:text-[#8EB69B] mb-1">What is Sales Variance?</p>
        <p className="text-[11px] text-[#235347] dark:text-[#8EB69B]">
          Variance = Actual Revenue − Expected Revenue (7-day moving average baseline per product).
          This is <strong>different from anomaly detection</strong>, which flags statistically unusual individual transactions.
          Variance shows how much a product's daily revenue deviates from its own rolling historical average.
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          ['Products Analysed', data.length],
          ['Over-performing', positive, 'text-[#8EB69B]'],
          ['Under-performing', negative, 'text-rose-600'],
          ['Avg Abs Variance %', `${avgVariancePct.toFixed(1)}%`],
        ].map(([k, v, cls]) => (
          <div key={k} className="fintech-card p-4">
            <p className="text-xs text-[#235347] dark:text-[#8EB69B]">{k}</p>
            <p className={`text-xl font-bold mt-1 ${cls || 'text-[#051F20] dark:text-[#DAF1DE]'}`}>{v}</p>
          </div>
        ))}
      </div>

      {/* Variance Chart */}
      <div className="fintech-card p-5">
        <h3 className="text-sm font-bold text-[#051F20] dark:text-[#DAF1DE] mb-4 flex items-center gap-2">
          <BarChart2 className="w-4 h-4 text-[#235347] dark:text-[#8EB69B]" /> Actual vs Expected Revenue — Variance %
        </h3>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={data.slice(0, 20)} margin={{ top: 5, right: 20, left: 10, bottom: 30 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#8EB69B" opacity={0.3} />
            <XAxis dataKey="product_name" tick={{ fontSize: 9 }} angle={-30} textAnchor="end" />
            <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `${v.toFixed(0)}%`} />
            <Tooltip
              formatter={(v, name) => [name === 'variance_pct' ? `${Number(v).toFixed(1)}%` : fmt(v), name === 'variance_pct' ? 'Variance %' : name === 'actual_rev' ? 'Actual Revenue' : 'Expected Revenue']}
            />
            <ReferenceLine y={0} stroke="#235347" strokeWidth={1.5} />
            <Bar dataKey="variance_pct" name="variance_pct" radius={[3, 3, 0, 0]}>
              {data.slice(0, 20).map((entry, i) => (
                <Cell key={i} fill={entry.variance_pct >= 0 ? '#8EB69B' : '#dc2626'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div className="flex gap-4 mt-3 text-[11px]">
          <span className="flex items-center gap-1 text-[#8EB69B]"><span className="w-3 h-3 bg-[#8EB69B] rounded inline-block" /> Above expected (positive variance)</span>
          <span className="flex items-center gap-1 text-rose-600"><span className="w-3 h-3 bg-rose-500 rounded inline-block" /> Below expected (negative variance)</span>
        </div>
      </div>

      {/* Highlights */}
      {(maxPositive || maxNegative) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {maxPositive && (
            <div className="fintech-card p-4 border-l-4 border-[#8EB69B] bg-[#DAF1DE] dark:bg-[#163832]">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-[#8EB69B]" />
                <span className="text-xs font-bold text-[#235347] dark:text-[#8EB69B]">Biggest Over-performer</span>
              </div>
              <p className="text-sm font-bold text-[#051F20] dark:text-[#DAF1DE]">{maxPositive.product_name}</p>
              <p className="text-xs text-[#235347] dark:text-[#8EB69B] mt-1">
                Actual: {fmt(maxPositive.actual_rev)} | Expected: {fmt(maxPositive.expected_rev)}
              </p>
              <p className="text-lg font-bold text-[#8EB69B] mt-1">+{Number(maxPositive.variance_pct).toFixed(1)}%</p>
            </div>
          )}
          {maxNegative && (
            <div className="fintech-card p-4 border-l-4 border-rose-500 bg-rose-50 dark:bg-rose-950/20">
              <div className="flex items-center gap-2 mb-2">
                <TrendingDown className="w-4 h-4 text-rose-600" />
                <span className="text-xs font-bold text-rose-700 dark:text-rose-300">Biggest Under-performer</span>
              </div>
              <p className="text-sm font-bold text-[#051F20] dark:text-[#DAF1DE]">{maxNegative.product_name}</p>
              <p className="text-xs text-[#235347] dark:text-[#8EB69B] mt-1">
                Actual: {fmt(maxNegative.actual_rev)} | Expected: {fmt(maxNegative.expected_rev)}
              </p>
              <p className="text-lg font-bold text-rose-600 mt-1">{Number(maxNegative.variance_pct).toFixed(1)}%</p>
            </div>
          )}
        </div>
      )}

      {/* Full Table */}
      <div className="fintech-card overflow-hidden">
        <div className="p-4 border-b border-[#DAF1DE] dark:border-[#235347]">
          <h3 className="text-sm font-bold text-[#051F20] dark:text-[#DAF1DE]">Full Variance Report — Actual vs Expected</h3>
          <p className="text-[11px] text-[#8EB69B] mt-0.5">Baseline: 7-day moving average per product. Data from PostgreSQL fact_sales.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-[#163832]">
              <tr>
                {['Product','Expected Revenue','Actual Revenue','Variance (₹)','Variance %','Status'].map(h => (
                  <th key={h} className="px-4 py-2.5 text-left font-semibold text-[#DAF1DE] whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((row, i) => {
                const isPos = (row.variance_pct || 0) >= 0;
                return (
                  <tr key={i} className="border-t border-[#DAF1DE] dark:border-[#235347] hover:bg-[#EDF8EF] dark:hover:bg-[#163832]">
                    <td className="px-4 py-2.5 font-medium text-[#051F20] dark:text-[#DAF1DE]">{row.product_name}</td>
                    <td className="px-4 py-2.5 text-[#235347] dark:text-[#8EB69B]">{fmt(row.expected_rev)}</td>
                    <td className="px-4 py-2.5 font-semibold">{fmt(row.actual_rev)}</td>
                    <td className={`px-4 py-2.5 font-medium ${isPos ? 'text-[#8EB69B]' : 'text-rose-600'}`}>
                      {isPos ? '+' : ''}{fmt(row.variance_amt)}
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${isPos ? 'bg-[#DAF1DE] text-[#235347] dark:bg-[#163832] dark:text-[#8EB69B]' : 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300'}`}>
                        {isPos ? '+' : ''}{Number(row.variance_pct || 0).toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      {isPos
                        ? <span className="flex items-center gap-1 text-[#8EB69B]"><TrendingUp className="w-3.5 h-3.5" />Above Expected</span>
                        : <span className="flex items-center gap-1 text-rose-600"><TrendingDown className="w-3.5 h-3.5" />Below Expected</span>
                      }
                    </td>
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

export default VariancePage;
