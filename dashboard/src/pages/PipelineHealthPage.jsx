// src/pages/PipelineHealthPage.jsx
import React, { useState, useEffect } from 'react';
import { Activity, CheckCircle, AlertTriangle, XCircle, RefreshCw, Database } from 'lucide-react';
import { getPipelineHealth, triggerPipelineRun } from '../services/api';

const StatusBadge = ({ status }) => {
  if (status === 'healthy') return <span className="flex items-center gap-1 text-emerald-600 font-semibold text-xs"><CheckCircle className="w-3.5 h-3.5" />Healthy</span>;
  if (status === 'warning' || status === 'no_data') return <span className="flex items-center gap-1 text-amber-600 font-semibold text-xs"><AlertTriangle className="w-3.5 h-3.5" />Warning</span>;
  return <span className="flex items-center gap-1 text-rose-600 font-semibold text-xs"><XCircle className="w-3.5 h-3.5" />Error</span>;
};

const PipelineHealthPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [runResult, setRunResult] = useState(null);

  const load = () => {
    setLoading(true);
    getPipelineHealth().then(d => { setData(d); setLoading(false); });
  };

  const runPipeline = async () => {
    setRunning(true);
    try {
      const res = await triggerPipelineRun();
      setRunResult({ success: true, message: `Pipeline complete: ${res.anomalies_detected ?? '?'} anomalies detected` });
      load();
    } catch (e) {
      setRunResult({ success: false, message: e.response?.data?.detail || 'Pipeline run failed' });
    }
    setRunning(false);
  };

  useEffect(() => { load(); }, []);

  if (loading) return <div className="flex items-center justify-center h-64 text-slate-400 text-sm">Checking pipeline health…</div>;
  if (!data) return <div className="flex items-center justify-center h-64 text-slate-400 text-sm">Could not fetch pipeline status.</div>;

  const overallOk = data.overall_status === 'healthy';

  return (
    <div className="space-y-6">
      {/* Overall Status */}
      <div className={`fintech-card p-5 border-l-4 ${overallOk ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20' : 'border-amber-500 bg-amber-50 dark:bg-amber-950/20'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Activity className={`w-7 h-7 ${overallOk ? 'text-emerald-600' : 'text-amber-600'}`} />
            <div>
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">Overall Pipeline Status</p>
              <p className={`text-lg font-black capitalize ${overallOk ? 'text-emerald-700' : 'text-amber-700'}`}>{data.overall_status || 'unknown'}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={load} className="flex items-center gap-1.5 text-xs border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-400 px-3 py-1.5 rounded-lg cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800">
              <RefreshCw className="w-3.5 h-3.5" /> Refresh
            </button>
            <button onClick={runPipeline} disabled={running}
              className="flex items-center gap-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg cursor-pointer disabled:opacity-60">
              <RefreshCw className={`w-3.5 h-3.5 ${running ? 'animate-spin' : ''}`} />
              {running ? 'Running…' : 'Run Full Pipeline'}
            </button>
          </div>
        </div>
      </div>

      {runResult && (
        <div className={`fintech-card p-3 text-xs font-semibold flex items-center gap-2 ${runResult.success ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300' : 'bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-300'}`}>
          {runResult.success ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
          {runResult.message}
        </div>
      )}

      {/* Service Status */}
      <div className="fintech-card overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">Service Status</h3>
        </div>
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {[
            ['PostgreSQL Database', data.postgres_status],
            ['ETL Pipeline', data.etl_status],
            ['ML Model / Results Cache', data.ml_status],
          ].map(([label, status]) => (
            <div key={label} className="px-5 py-3 flex items-center justify-between">
              <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{label}</span>
              <StatusBadge status={status} />
            </div>
          ))}
        </div>
      </div>

      {/* Database Row Counts */}
      <div className="fintech-card overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
          <Database className="w-4 h-4 text-blue-600" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">Database Table Row Counts</h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-px bg-slate-100 dark:bg-slate-800">
          {Object.entries(data.table_row_counts || {}).map(([table, count]) => (
            <div key={table} className="bg-white dark:bg-[#0f172a] p-4">
              <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400">{table}</p>
              <p className="text-xl font-bold text-slate-900 dark:text-white mt-1">
                {typeof count === 'number' ? count.toLocaleString() : count}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Timestamps */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          ['Last CSV Ingestion', data.last_csv_ingestion],
          ['Last ERP Ingestion', data.last_erp_ingestion],
          ['Last ML Run', data.ml_last_run],
        ].map(([k, v]) => (
          <div key={k} className="fintech-card p-4">
            <p className="text-xs text-slate-500 dark:text-slate-400">{k}</p>
            <p className="text-xs font-bold text-slate-900 dark:text-white mt-1">
              {v ? new Date(v).toLocaleString() : <span className="text-slate-400 italic">Never</span>}
            </p>
          </div>
        ))}
      </div>

      {/* Issues */}
      {data.issues?.length > 0 && (
        <div className="fintech-card p-4 border-l-4 border-amber-500 bg-amber-50 dark:bg-amber-950/20">
          <h4 className="text-xs font-bold text-amber-700 dark:text-amber-300 mb-2">Issues Detected</h4>
          <ul className="space-y-1">
            {data.issues.map((issue, i) => (
              <li key={i} className="text-[11px] text-amber-600 dark:text-amber-400 flex items-start gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                {issue}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default PipelineHealthPage;
