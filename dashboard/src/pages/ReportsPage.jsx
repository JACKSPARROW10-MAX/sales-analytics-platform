// src/pages/ReportsPage.jsx
import React, { useEffect, useState } from 'react';
import { FileText, Download, Mail, CalendarClock, CheckCircle2, AlertCircle } from 'lucide-react';
import { getReportSummary, getReportDownloadUrl } from '../services/api';
import { Panel, StateView, Skeleton, Badge } from '../components/ui';

const inr = (v) => (v == null ? '—' : `₹${Number(v).toLocaleString(undefined, { maximumFractionDigits: 0 })}`);
const fmtDate = (s) => (s ? new Date(s).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : '—');

const ReportsPage = () => {
  const [data, setData] = useState(null);
  const [status, setStatus] = useState('loading');

  const load = () => {
    setStatus('loading');
    getReportSummary().then((d) => {
      setData(d);
      setStatus(d ? 'ready' : 'error');
    });
  };

  useEffect(() => {
    load();
    window.addEventListener('dashboard-refresh', load);
    return () => window.removeEventListener('dashboard-refresh', load);
  }, []);

  if (status === 'loading') {
    return <div className="space-y-4"><Skeleton className="h-40 w-full" /><Skeleton className="h-32 w-full" /></div>;
  }
  if (status === 'error') {
    return <div className="fintech-card"><StateView status="error" message="Could not load report data from the API." onRetry={load} /></div>;
  }

  const { period, kpis = {}, latest_pdf, email_automation } = data;

  return (
    <div className="space-y-6">
      <Panel
        title="Executive PDF report"
        subtitle="Generated on demand from the live database — KPIs, trends, anomalies, variance and AI strategy."
        icon={FileText}
        action={
          <a href={getReportDownloadUrl()} target="_blank" rel="noreferrer"
            className="inline-flex items-center gap-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold px-4 py-2 rounded-lg cursor-pointer">
            <Download className="w-4 h-4" /> Generate &amp; download
          </a>
        }
      >
        <div className="p-5 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-lg bg-[#F8FAFC] dark:bg-[#111827] border border-[#E2E8F0] dark:border-[#1E293B] p-4">
            <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">Reporting period</p>
            <p className="text-sm font-bold text-[#0F172A] dark:text-[#E2E8F0] mt-1">
              {fmtDate(period?.start)} — {fmtDate(period?.end)}
            </p>
          </div>
          <div className="rounded-lg bg-[#F8FAFC] dark:bg-[#111827] border border-[#E2E8F0] dark:border-[#1E293B] p-4">
            <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">Total revenue</p>
            <p className="text-sm font-bold text-[#0F172A] dark:text-[#E2E8F0] mt-1 tabular-nums">{inr(kpis.total_revenue)}</p>
          </div>
          <div className="rounded-lg bg-[#F8FAFC] dark:bg-[#111827] border border-[#E2E8F0] dark:border-[#1E293B] p-4">
            <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">Orders · Avg order value</p>
            <p className="text-sm font-bold text-[#0F172A] dark:text-[#E2E8F0] mt-1 tabular-nums">
              {Number(kpis.total_orders ?? 0).toLocaleString()} · {inr(kpis.average_order_value)}
            </p>
          </div>
        </div>
        {latest_pdf && (
          <div className="px-5 pb-5 -mt-1">
            <p className="text-[11px] text-[#64748B] dark:text-[#94A3B8]">
              Last generated file: <span className="font-mono">{latest_pdf.filename}</span> ·{' '}
              {(latest_pdf.size_bytes / 1024).toFixed(0)} KB · {new Date(latest_pdf.generated_at).toLocaleString()}
            </p>
          </div>
        )}
      </Panel>

      <Panel title="Weekly email automation" icon={Mail}>
        <div className="p-5 space-y-3 text-sm">
          <div className="flex items-center gap-2">
            {email_automation?.configured
              ? <Badge tone="success"><CheckCircle2 className="w-3 h-3" /> Secrets configured</Badge>
              : <Badge tone="warning"><AlertCircle className="w-3 h-3" /> Not configured in this environment</Badge>}
          </div>
          <p className="flex items-center gap-2 text-xs text-[#64748B] dark:text-[#94A3B8]">
            <CalendarClock className="w-4 h-4" /> {email_automation?.schedule}
          </p>
          <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">
            {email_automation?.note} A fresh PDF is generated from the database on every run and attached to the email.
          </p>
        </div>
      </Panel>
    </div>
  );
};

export default ReportsPage;
