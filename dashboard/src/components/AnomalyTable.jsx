// src/components/AnomalyTable.jsx
import React, { useMemo, useState } from 'react';
import { AlertTriangle, Search, ArrowUpRight, ArrowDownRight, X } from 'lucide-react';
import { Skeleton, StateView, Badge } from './ui';

// Map the model's severity → the three business risk levels.
const RISK = {
  Critical: { label: 'High Risk', tone: 'danger' },
  Warning: { label: 'Warning', tone: 'warning' },
  Info: { label: 'Normal', tone: 'neutral' },
};

const inr = (v) => `₹${Number(v || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;

const AnomalyTable = ({ anomalies = [], isLoading = false, compact = false }) => {
  const [q, setQ] = useState('');
  const [sev, setSev] = useState('all');
  const [selected, setSelected] = useState(null);

  const rows = useMemo(() => {
    return anomalies.filter((a) => {
      const hay = `${a.transaction_id || a.id || ''} ${a.product || ''} ${a.customer || ''}`.toLowerCase();
      const matchesQ = hay.includes(q.toLowerCase());
      const matchesSev = sev === 'all' || (a.severity || '') === sev;
      return matchesQ && matchesSev;
    });
  }, [anomalies, q, sev]);

  if (isLoading) {
    return (
      <div className="fintech-card p-6 space-y-4">
        <Skeleton className="h-5 w-52" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!anomalies.length) {
    return (
      <div className="fintech-card">
        <StateView
          status="empty"
          icon={AlertTriangle}
          title="No significant anomalies detected"
          message="The Isolation Forest + Z-score model found no transactions that deviate meaningfully from normal patterns in the current data."
        />
      </div>
    );
  }

  return (
    <div className="fintech-card">
      {!compact && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 border-b border-[#E2E8F0] dark:border-[#1E293B]">
          <div>
            <h3 className="text-sm font-semibold text-[#0F172A] dark:text-[#E2E8F0] flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-[#DC2626]" /> Flagged transactions
              <Badge tone="danger">{rows.length}</Badge>
            </h3>
            <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-0.5">
              Statistically unusual revenue, volume or discount vs. the dataset baseline.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[#94A3B8] absolute left-2.5 top-2.5" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search…"
                aria-label="Search anomalies"
                className="pl-8 pr-3 py-1.5 bg-[#F8FAFC] dark:bg-[#111827] border border-[#E2E8F0] dark:border-[#1E293B] rounded-md text-xs w-40 focus:outline-none"
              />
            </div>
            <select
              value={sev}
              onChange={(e) => setSev(e.target.value)}
              aria-label="Filter by risk level"
              className="bg-[#F8FAFC] dark:bg-[#111827] border border-[#E2E8F0] dark:border-[#1E293B] rounded-md px-2.5 py-1.5 text-xs font-semibold cursor-pointer focus:outline-none"
            >
              <option value="all">All levels</option>
              <option value="Critical">High Risk</option>
              <option value="Warning">Warning</option>
              <option value="Info">Normal</option>
            </select>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="fintech-table">
          <thead>
            <tr>
              <th>Transaction</th>
              <th>Date</th>
              <th>Product / Customer</th>
              <th>Expected</th>
              <th>Actual</th>
              <th>Variance</th>
              <th>Risk level</th>
              {!compact && <th>Reason</th>}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={compact ? 7 : 8} className="text-center py-8 text-[#64748B] text-xs">
                  No anomalies match the current filters.
                </td>
              </tr>
            ) : (
              rows.map((a) => {
                const risk = RISK[a.severity] || RISK.Info;
                const positive = String(a.variance || '').startsWith('+');
                const reason = typeof a.root_cause === 'object' ? a.root_cause.primary_factor : a.root_cause;
                return (
                  <tr
                    key={a.id || a.transaction_id}
                    className="cursor-pointer"
                    onClick={() => setSelected(a)}
                  >
                    <td className="font-mono text-xs text-[#0F172A] dark:text-[#E2E8F0]">
                      {String(a.transaction_id || a.id || '').slice(0, 16)}
                    </td>
                    <td className="text-xs text-[#64748B] dark:text-[#94A3B8]">{a.date}</td>
                    <td>
                      <div className="text-xs font-medium text-[#0F172A] dark:text-[#E2E8F0]">{a.product}</div>
                      <div className="text-[11px] text-[#64748B] dark:text-[#94A3B8]">{a.customer}{a.region ? ` · ${a.region}` : ''}</div>
                    </td>
                    <td className="text-xs tabular-nums text-[#64748B] dark:text-[#94A3B8]">{inr(a.expected_value)}</td>
                    <td className="text-xs tabular-nums font-semibold text-[#0F172A] dark:text-[#E2E8F0]">{inr(a.actual_value)}</td>
                    <td>
                      <span className={`inline-flex items-center text-xs font-semibold ${positive ? 'text-[#16A34A]' : 'text-[#DC2626]'}`}>
                        {positive ? <ArrowUpRight className="w-3 h-3 mr-0.5" /> : <ArrowDownRight className="w-3 h-3 mr-0.5" />}
                        {a.variance}
                      </span>
                    </td>
                    <td><Badge tone={risk.tone}>{risk.label}</Badge></td>
                    {!compact && (
                      <td className="text-xs text-[#64748B] dark:text-[#94A3B8] max-w-[220px] truncate">{reason || '—'}</td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setSelected(null)}>
          <div
            className="fintech-card max-w-lg w-full p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#E2E8F0] dark:border-[#1E293B] pb-3">
              <h4 className="text-sm font-semibold text-[#0F172A] dark:text-[#E2E8F0] flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-[#DC2626]" /> Anomaly detail
              </h4>
              <button onClick={() => setSelected(null)} className="p-1 text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-[#E2E8F0] cursor-pointer" aria-label="Close">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div><p className="text-[#64748B]">Transaction</p><p className="font-mono font-semibold text-[#0F172A] dark:text-[#E2E8F0]">{selected.transaction_id || selected.id}</p></div>
              <div><p className="text-[#64748B]">Date</p><p className="font-semibold text-[#0F172A] dark:text-[#E2E8F0]">{selected.date}</p></div>
              <div><p className="text-[#64748B]">Actual revenue</p><p className="font-semibold text-[#0F172A] dark:text-[#E2E8F0] tabular-nums">{inr(selected.actual_value)}</p></div>
              <div><p className="text-[#64748B]">Expected (baseline)</p><p className="font-semibold text-[#0F172A] dark:text-[#E2E8F0] tabular-nums">{inr(selected.expected_value)}</p></div>
            </div>
            <div className="rounded-lg bg-[#F8FAFC] dark:bg-[#111827] border border-[#E2E8F0] dark:border-[#1E293B] p-3">
              <p className="text-[11px] font-semibold text-[#64748B] dark:text-[#94A3B8] mb-1">Primary root cause</p>
              <p className="text-xs font-semibold text-[#0F172A] dark:text-[#E2E8F0]">
                {typeof selected.root_cause === 'object' ? selected.root_cause.primary_factor : selected.root_cause}
              </p>
              {typeof selected.root_cause === 'object' && selected.root_cause.details && (
                <p className="text-[11px] text-[#64748B] dark:text-[#94A3B8] mt-1">{selected.root_cause.details}</p>
              )}
            </div>
            {selected.shap_explanation && (
              <p className="text-[11px] text-[#64748B] dark:text-[#94A3B8]">{selected.shap_explanation}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AnomalyTable;
