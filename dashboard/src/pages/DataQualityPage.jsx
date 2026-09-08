// src/pages/DataQualityPage.jsx
import React, { useState, useEffect } from 'react';
import { ShieldCheck, AlertTriangle, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { getDataQuality } from '../services/api';

const DataQualityPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    getDataQuality().then(d => { setData(d); setLoading(false); });
  };

  useEffect(() => { 
    load(); 
    window.addEventListener('dashboard-refresh', load);
    return () => window.removeEventListener('dashboard-refresh', load);
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64 text-[#64748B] text-sm">Checking data quality…</div>;
  if (!data || !Object.keys(data).length) return <div className="flex items-center justify-center h-64 text-[#64748B] text-sm">Could not fetch data quality metrics.</div>;

  const score = data.data_quality_score || 0;
  const scoreColor = score >= 95 ? 'text-[#64748B]' : score >= 80 ? 'text-amber-600' : 'text-rose-600';
  const scoreBg = score >= 95 ? 'bg-[#EFF6FF] dark:bg-[#334155] border-[#64748B] dark:border-[#2563EB]' : score >= 80 ? 'bg-amber-50 dark:bg-amber-950/20 border-amber-300' : 'bg-rose-50 dark:bg-rose-950/20 border-rose-300';
  const StatusIcon = score >= 95 ? CheckCircle : AlertTriangle;

  const checks = [
    { label: 'Null Revenue Values', value: data.null_revenue, isGood: !data.null_revenue },
    { label: 'Null Quantity Values', value: data.null_quantity, isGood: !data.null_quantity },
    { label: 'Negative Revenue', value: data.negative_revenue, isGood: !data.negative_revenue },
    { label: 'Invalid Quantity (≤0)', value: data.invalid_quantity, isGood: !data.invalid_quantity },
    { label: 'Invalid Discount (out of range)', value: data.invalid_discount, isGood: !data.invalid_discount },
    { label: 'Duplicate Sale IDs', value: data.duplicate_sale_ids, isGood: !data.duplicate_sale_ids },
  ];

  return (
    <div className="space-y-6">
      {/* Score Banner */}
      <div className={`fintech-card p-5 border-l-4 ${scoreBg}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <StatusIcon className={`w-8 h-8 ${scoreColor}`} />
            <div>
              <p className="text-xs font-semibold text-[#2563EB] dark:text-[#64748B]">Data Quality Score</p>
              <p className={`text-4xl font-black ${scoreColor}`}>{score.toFixed(1)}%</p>
              <p className="text-xs text-[#2563EB] capitalize mt-0.5">Status: <strong className={scoreColor}>{data.status}</strong></p>
            </div>
          </div>
          <button onClick={load} className="flex items-center gap-1.5 text-xs bg-[#2563EB] hover:bg-[#334155] text-[#EFF6FF] px-3 py-1.5 rounded-lg cursor-pointer">
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
        </div>
      </div>

      {/* Record Counts */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          ['Staging Records', data.staging_rows],
          ['Fact Sales Records', data.fact_rows],
          ['Products', data.dim_product_count],
          ['Customers', data.dim_customer_count],
        ].map(([k, v]) => (
          <div key={k} className="fintech-card p-4">
            <p className="text-xs text-[#2563EB] dark:text-[#64748B]">{k}</p>
            <p className="text-2xl font-bold text-[#0F172A] dark:text-[#EFF6FF] mt-1">{Number(v || 0).toLocaleString()}</p>
          </div>
        ))}
      </div>

      {/* Quality Checks */}
      <div className="fintech-card overflow-hidden">
        <div className="p-4 border-b border-[#EFF6FF] dark:border-[#2563EB]">
          <h3 className="text-sm font-bold text-[#0F172A] dark:text-[#EFF6FF] flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#2563EB] dark:text-[#64748B]" /> Data Integrity Checks — fact_sales table
          </h3>
          <p className="text-[11px] text-[#64748B] mt-0.5">All checks run directly against PostgreSQL at query time</p>
        </div>
        <div className="divide-y divide-[#EFF6FF] dark:divide-[#2563EB]">
          {checks.map(({ label, value, isGood }) => (
            <div key={label} className="px-5 py-3 flex items-center justify-between hover:bg-[#F8FAFC] dark:hover:bg-[#334155]">
              <div className="flex items-center gap-3">
                {isGood
                  ? <CheckCircle className="w-4 h-4 text-[#64748B] shrink-0" />
                  : <XCircle className="w-4 h-4 text-rose-500 shrink-0" />}
                <span className="text-xs font-medium text-[#0F172A] dark:text-[#EFF6FF]">{label}</span>
              </div>
              <span className={`text-xs font-bold px-2 py-0.5 rounded ${isGood ? 'bg-[#EFF6FF] text-[#2563EB] dark:bg-[#334155] dark:text-[#64748B]' : 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300'}`}>
                {Number(value || 0).toLocaleString()} {isGood ? '✓' : 'issues'}
              </span>
            </div>
          ))}
        </div>
        <div className="px-5 py-3 border-t border-[#E2E8F0] dark:border-[#2563EB] bg-[#F8FAFC] dark:bg-[#1E293B] flex items-center justify-between">
          <span className="text-xs font-semibold text-[#2563EB] dark:text-[#64748B]">Total Issues Found</span>
          <span className={`text-sm font-bold ${!data.total_issues ? 'text-[#64748B]' : 'text-rose-600'}`}>{data.total_issues || 0}</span>
        </div>
      </div>

      {/* Last Ingestion */}
      {data.last_ingestion && (
        <div className="fintech-card p-4">
          <p className="text-xs text-[#2563EB] dark:text-[#64748B]">Last Data Ingestion (staging_sales)</p>
          <p className="text-sm font-bold text-[#0F172A] dark:text-[#EFF6FF] mt-1">
            {new Date(data.last_ingestion).toLocaleString()}
          </p>
        </div>
      )}
    </div>
  );
};

export default DataQualityPage;
