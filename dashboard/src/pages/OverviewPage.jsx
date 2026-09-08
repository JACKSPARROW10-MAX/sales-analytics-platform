// src/pages/OverviewPage.jsx
import React, { useEffect, useState } from 'react';
import {
  BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from 'recharts';
import {
  IndianRupee, ShoppingCart, Package, Receipt, TrendingUp,
  Target, AlertTriangle, Lightbulb, ArrowRight,
} from 'lucide-react';
import KPICard from '../components/KPICard';
import AnomalyTable from '../components/AnomalyTable';
import RecommendationCard from '../components/RecommendationCard';
import { Panel, StateView, Skeleton } from '../components/ui';
import {
  getAnalyticsSummary, getCategoryAnalytics, getRegionAnalytics,
} from '../services/api';

const inr = (v) => {
  if (v == null) return '—';
  if (Math.abs(v) >= 1_000_000) return `₹${(v / 1_000_000).toFixed(2)}M`;
  if (Math.abs(v) >= 1_000) return `₹${(v / 1_000).toFixed(1)}K`;
  return `₹${Number(v).toFixed(0)}`;
};

const CAT_COLORS = ['#2563EB', '#3B82F6', '#60A5FA', '#93C5FD', '#1D4ED8', '#1E3A8A'];

const OverviewPage = ({ kpis, anomalies = [], recommendations = [], isLoading, goTo }) => {
  const [trend, setTrend] = useState([]);
  const [categories, setCategories] = useState([]);
  const [regions, setRegions] = useState([]);
  const [secLoading, setSecLoading] = useState(true);

  const loadSecondary = () => {
    setSecLoading(true);
    Promise.all([
      getAnalyticsSummary('revenue', 'monthly', 0),
      getCategoryAnalytics(),
      getRegionAnalytics(),
    ])
      .then(([t, c, r]) => { setTrend(t || []); setCategories(c || []); setRegions(r || []); })
      .finally(() => setSecLoading(false));
  };

  useEffect(() => {
    loadSecondary();
    window.addEventListener('dashboard-refresh', loadSecondary);
    return () => window.removeEventListener('dashboard-refresh', loadSecondary);
  }, []);

  const k = kpis || {};
  const fa = k.forecastAccuracy || {};
  const an = k.anomaliesDetected || {};
  const rec = k.activeRecommendations || {};

  return (
    <div className="space-y-6">
      {/* Primary business KPIs — all from /kpis (fact_sales) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
        <KPICard title="Total Revenue" icon={IndianRupee} isLoading={isLoading}
          value={k.totalRevenue?.formatted}
          change={k.totalRevenue?.change} isPositive={k.totalRevenue?.isPositive}
          subtext={k.totalRevenue?.subtext} />
        <KPICard title="Total Orders" icon={ShoppingCart} isLoading={isLoading}
          value={k.totalOrders?.formatted} subtext={k.totalOrders?.subtext} />
        <KPICard title="Total Quantity" icon={Package} isLoading={isLoading}
          value={k.totalQuantity?.formatted} subtext={k.totalQuantity?.subtext} />
        <KPICard title="Avg Order Value" icon={Receipt} isLoading={isLoading}
          value={k.averageOrderValue?.formatted} subtext={k.averageOrderValue?.subtext} />
        <KPICard title="Revenue Growth" icon={TrendingUp} isLoading={isLoading}
          value={k.revenueGrowth?.formatted}
          change={k.revenueGrowth?.formatted} isPositive={k.revenueGrowth?.isPositive}
          subtext={k.revenueGrowth?.subtext} />
      </div>

      {/* Secondary intelligence strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { icon: Target, label: 'Forecast fit', value: fa.formatted || '—', sub: fa.subtext, to: 'forecast' },
          { icon: AlertTriangle, label: 'Anomalies flagged', value: an.formatted || '—', sub: an.change, to: 'anomalies' },
          { icon: Lightbulb, label: 'AI recommendations', value: rec.formatted || '—', sub: rec.subtext, to: 'strategy' },
        ].map(({ icon: Icon, label, value, sub, to }) => (
          <button key={label} onClick={() => goTo(to)}
            className="fintech-card p-4 text-left flex items-center gap-3 hover:border-[#2563EB] cursor-pointer group">
            <span className="p-2 rounded-lg bg-[#EFF6FF] text-[#2563EB] dark:bg-[#1E293B] dark:text-[#60A5FA]">
              <Icon className="w-4 h-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] uppercase tracking-wide font-semibold text-[#64748B] dark:text-[#94A3B8]">{label}</p>
              {isLoading ? <Skeleton className="h-5 w-20 mt-1" />
                : <p className="text-lg font-bold text-[#0F172A] dark:text-[#E2E8F0] tabular-nums">{value}</p>}
              {sub && <p className="text-[11px] text-[#64748B] dark:text-[#94A3B8] truncate">{sub}</p>}
            </div>
            <ArrowRight className="w-4 h-4 text-[#94A3B8] group-hover:text-[#2563EB]" />
          </button>
        ))}
      </div>

      {/* Revenue trend */}
      <Panel title="Revenue trend" subtitle="Monthly revenue from fact_sales" icon={TrendingUp}>
        <div className="p-5">
          {secLoading ? <Skeleton className="h-64 w-full" />
            : trend.length === 0 ? <StateView status="empty" message="No sales in the database yet — upload a CSV to get started." />
            : (
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={trend} margin={{ top: 5, right: 16, left: 4, bottom: 0 }}>
                  <defs>
                    <linearGradient id="ovRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#2563EB" stopOpacity={0.20} />
                      <stop offset="100%" stopColor="#2563EB" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="period_start" tick={{ fontSize: 11 }} tickFormatter={(v) => v?.slice(0, 7)} minTickGap={20} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={inr} width={56} />
                  <Tooltip formatter={(v) => [inr(v), 'Revenue']} labelFormatter={(l) => `Period: ${String(l).slice(0, 10)}`} />
                  <Area type="monotone" dataKey="value" name="Revenue" stroke="#2563EB" strokeWidth={2} fill="url(#ovRev)" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            )}
        </div>
      </Panel>

      {/* Category + Region */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Panel title="Revenue by category" icon={Package}>
          <div className="p-5">
            {secLoading ? <Skeleton className="h-56 w-full" />
              : categories.length === 0 ? <StateView status="empty" message="No category data." />
              : (
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={categories.slice(0, 8)} layout="vertical" margin={{ left: 96, right: 16 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                    <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={inr} />
                    <YAxis type="category" dataKey="category" tick={{ fontSize: 11 }} width={90} />
                    <Tooltip formatter={(v) => [inr(v), 'Revenue']} />
                    <Bar dataKey="total_revenue" radius={[0, 4, 4, 0]}>
                      {categories.slice(0, 8).map((_, i) => <Cell key={i} fill={CAT_COLORS[i % CAT_COLORS.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
          </div>
        </Panel>

        <Panel title="Revenue by region" icon={TrendingUp}>
          <div className="p-5">
            {secLoading ? <Skeleton className="h-56 w-full" />
              : regions.length === 0 ? <StateView status="empty" message="No regional data." />
              : (
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={regions.slice(0, 8)} layout="vertical" margin={{ left: 96, right: 16 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                    <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={inr} />
                    <YAxis type="category" dataKey="region" tick={{ fontSize: 11 }} width={90} />
                    <Tooltip formatter={(v) => [inr(v), 'Revenue']} />
                    <Bar dataKey="total_revenue" radius={[0, 4, 4, 0]}>
                      {regions.slice(0, 8).map((_, i) => <Cell key={i} fill={CAT_COLORS[i % CAT_COLORS.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
          </div>
        </Panel>
      </div>

      {/* Recent anomalies */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-[#0F172A] dark:text-[#E2E8F0] flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-[#DC2626]" /> Recent anomalies
          </h3>
          <button onClick={() => goTo('anomalies')} className="text-xs font-semibold text-[#2563EB] hover:text-[#1D4ED8] cursor-pointer">
            View all →
          </button>
        </div>
        <AnomalyTable anomalies={anomalies.slice(0, 5)} isLoading={isLoading} compact />
      </div>

      {/* Top recommendations */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-[#0F172A] dark:text-[#E2E8F0] flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-[#F59E0B]" /> AI recommendations
          </h3>
          <button onClick={() => goTo('strategy')} className="text-xs font-semibold text-[#2563EB] hover:text-[#1D4ED8] cursor-pointer">
            View all →
          </button>
        </div>
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Skeleton className="h-40" /><Skeleton className="h-40" />
          </div>
        ) : recommendations.length === 0 ? (
          <div className="fintech-card"><StateView status="empty" message="No recommendations yet. Run the pipeline (Sync) to generate them." /></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recommendations.slice(0, 2).map((r, i) => (
              <RecommendationCard key={r.id || i} recommendation={r} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default OverviewPage;
