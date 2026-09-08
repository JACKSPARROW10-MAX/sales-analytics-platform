// src/components/ForecastChart.jsx
import React from 'react';
import {
  ResponsiveContainer, ComposedChart, Line, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ReferenceLine,
} from 'recharts';
import { TrendingUp } from 'lucide-react';
import { Skeleton, StateView, Badge } from './ui';

const inr = (val) => {
  if (val === null || val === undefined) return 'N/A';
  return `₹${Number(val).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
};

// Daily revenue is very spiky (bulk-order days), which makes a 60-day daily line
// unreadable. Roll the real values up into weekly buckets for the chart — the
// metric tiles below still show the raw model output.
const toWeekly = (rows) => {
  const buckets = new Map();
  for (const r of rows) {
    if (!r.date) continue;
    const d = new Date(r.date);
    const day = d.getUTCDay();
    const monday = new Date(d);
    monday.setUTCDate(d.getUTCDate() - ((day + 6) % 7));
    const key = monday.toISOString().slice(0, 10);
    const b = buckets.get(key) || { date: key, actual: 0, forecast: 0, lower: 0, upper: 0, hasActual: false, hasFc: false };
    if (r.actual != null) { b.actual += r.actual; b.hasActual = true; }
    if (r.forecast != null) { b.forecast += r.forecast; b.hasFc = true; }
    if (r.lower != null) b.lower += r.lower;
    if (r.upper != null) b.upper += r.upper;
    buckets.set(key, b);
  }
  return [...buckets.values()]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((b) => ({
      date: b.date,
      actual: b.hasActual ? Math.round(b.actual) : null,
      forecast: b.hasFc ? Math.round(b.forecast) : null,
      lower: b.hasFc ? Math.round(b.lower) : null,
      upper: b.hasFc ? Math.round(b.upper) : null,
      isForecast: !b.hasActual && b.hasFc,
    }));
};

/**
 * data: [{ date, actual, forecast, upper, lower, isForecast }]  (from /forecast)
 * meta: { model, value (accuracy %), mape, horizon_days, projected_30d_revenue }
 *       (from /kpis -> forecastAccuracy) — every value comes from the API.
 */
const ForecastChart = ({ data = [], meta = {}, isLoading = false }) => {
  if (isLoading) {
    return (
      <div className="fintech-card p-6 space-y-4">
        <Skeleton className="h-5 w-56" />
        <Skeleton className="h-72 w-full" />
      </div>
    );
  }

  if (!data.length) {
    return (
      <div className="fintech-card">
        <StateView
          status="empty"
          title="No forecast available"
          message="Upload sales data and run the pipeline — the model needs at least a few days of history."
        />
      </div>
    );
  }

  const weekly = toWeekly(data);
  const firstForecastIdx = weekly.findIndex((d) => d.isForecast);
  const boundary = firstForecastIdx > 0 ? weekly[firstForecastIdx - 1]?.date : null;
  const projected = meta.projected_30d_revenue;
  const accuracy = meta.value;

  return (
    <div className="fintech-card p-5 sm:p-6 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E2E8F0] dark:border-[#1E293B] pb-4">
        <div>
          <h3 className="text-sm font-semibold text-[#0F172A] dark:text-[#E2E8F0] flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[#2563EB]" />
            Revenue — actual vs {meta.horizon_days || 30}-day forecast
          </h3>
          <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-1">
            Daily revenue with the model's forward projection and confidence band.
          </p>
        </div>
        <Badge tone="info">Model: {meta.model || 'Ridge Regression (scikit-learn)'}</Badge>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
        <div className="rounded-lg bg-[#F8FAFC] dark:bg-[#111827] border border-[#E2E8F0] dark:border-[#1E293B] p-3">
          <p className="text-[#64748B] dark:text-[#94A3B8]">Projected next {meta.horizon_days || 30} days</p>
          <p className="text-sm font-bold text-[#0F172A] dark:text-[#E2E8F0] tabular-nums">
            {projected ? inr(projected) : '—'}
          </p>
        </div>
        <div className="rounded-lg bg-[#F8FAFC] dark:bg-[#111827] border border-[#E2E8F0] dark:border-[#1E293B] p-3">
          <p className="text-[#64748B] dark:text-[#94A3B8]">Fit accuracy (100 − MAPE)</p>
          <p className="text-sm font-bold text-[#0F172A] dark:text-[#E2E8F0] tabular-nums">
            {accuracy != null ? `${accuracy}%` : '—'}
          </p>
        </div>
        <div className="rounded-lg bg-[#F8FAFC] dark:bg-[#111827] border border-[#E2E8F0] dark:border-[#1E293B] p-3 col-span-2 sm:col-span-1">
          <p className="text-[#64748B] dark:text-[#94A3B8]">Mean abs. % error</p>
          <p className="text-sm font-bold text-[#0F172A] dark:text-[#E2E8F0] tabular-nums">
            {meta.mape || '—'}
          </p>
        </div>
      </div>

      <p className="text-[11px] text-[#64748B] dark:text-[#94A3B8]">Weekly revenue (daily values rolled up for readability).</p>
      <div className="h-[320px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={weekly} margin={{ top: 8, right: 12, left: 4, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11 }}
              tickFormatter={(s) => (s ? s.slice(5) : '')}
              minTickGap={24}
            />
            <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => (v >= 1000 ? `₹${(v / 1000).toFixed(0)}k` : `₹${v}`)} width={52} />
            <Tooltip
              formatter={(v, n) => [inr(v), n]}
              labelFormatter={(l) => `Date: ${l}`}
              contentStyle={{ fontSize: 12 }}
            />
            <Legend wrapperStyle={{ fontSize: 12, paddingTop: 6 }} />
            {boundary && <ReferenceLine x={boundary} stroke="#94A3B8" strokeDasharray="4 4" label={{ value: 'today', fontSize: 10, fill: '#64748B' }} />}
            <Area type="monotone" dataKey="upper" name="Confidence band" stroke="none" fill="#2563EB" fillOpacity={0.10} />
            <Area type="monotone" dataKey="lower" name=" " stroke="none" fill="#FFFFFF" fillOpacity={0} legendType="none" />
            <Line type="monotone" dataKey="actual" name="Actual revenue" stroke="#0F172A" strokeWidth={2} dot={false} connectNulls />
            <Line type="monotone" dataKey="forecast" name="Forecast" stroke="#2563EB" strokeWidth={2} strokeDasharray="5 4" dot={false} connectNulls />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default ForecastChart;
