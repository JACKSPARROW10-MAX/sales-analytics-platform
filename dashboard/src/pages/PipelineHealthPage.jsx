// src/pages/PipelineHealthPage.jsx
import React, { useState, useEffect } from 'react';
import { Activity, CheckCircle, AlertTriangle, XCircle, RefreshCw, Database } from 'lucide-react';
import { getPipelineHealth, triggerPipelineRun } from '../services/api';

const StatusBadge = ({ status }) => {
  if (status === 'healthy') return <span className="flex items-center gap-1 text-[#8EB69B] font-semibold text-xs"><CheckCircle className="w-3.5 h-3.5 text-emerald-400" />Healthy</span>;
  if (status === 'warning' || status === 'no_data') return <span className="flex items-center gap-1 text-amber-400 font-semibold text-xs"><AlertTriangle className="w-3.5 h-3.5" />Warning</span>;
  return <span className="flex items-center gap-1 text-rose-400 font-semibold text-xs"><XCircle className="w-3.5 h-3.5" />Error</span>;
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

  useEffect(() => { 
    load(); 
    window.addEventListener('dashboard-refresh', load);
    return () => window.removeEventListener('dashboard-refresh', load);
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64 text-[#8EB69B] text-sm">Checking pipeline health…</div>;
  if (!data) return <div className="flex items-center justify-center h-64 text-[#8EB69B] text-sm">Could not fetch pipeline status.</div>;

  const overallOk = data.overall_status === 'healthy';

  return (
    <div className="space-y-6">
      {/* Overall Status */}
      <div className={`p-5 rounded-xl border-l-4 backdrop-blur-sm transition-all ${
        overallOk 
          ? 'border-emerald-500 bg-[#0B2B26]/80 border-t border-r border-b border-[#235347]/40 shadow-lg shadow-[#051F20]/30' 
          : 'border-amber-500 bg-[#163832]/90 border-t border-r border-b border-amber-500/40 shadow-lg shadow-[#051F20]/30'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Activity className={`w-7 h-7 ${overallOk ? 'text-emerald-400' : 'text-amber-400'}`} />
            <div>
              <p className="text-xs font-semibold text-[#8EB69B]">Overall Pipeline Status</p>
              <p className={`text-lg font-black capitalize ${overallOk ? 'text-[#DAF1DE]' : 'text-amber-300'}`}>
                {data.overall_status || 'unknown'}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={load} 
              className="flex items-center gap-1.5 text-xs border border-[#235347] text-[#8EB69B] bg-[#0B2B26]/60 hover:bg-[#163832] px-3 py-1.5 rounded-lg cursor-pointer transition-colors duration-200"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Refresh
            </button>
            <button 
              onClick={runPipeline} 
              disabled={running}
              className="flex items-center gap-1.5 text-xs bg-[#235347] hover:bg-[#235347]/80 text-[#DAF1DE] font-semibold px-3 py-1.5 rounded-lg cursor-pointer disabled:opacity-60 transition-colors duration-200 shadow-md shadow-[#051F20]/40"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${running ? 'animate-spin' : ''}`} />
              {running ? 'Running…' : 'Run Full Pipeline'}
            </button>
          </div>
        </div>
      </div>

      {runResult && (
        <div className={`p-3.5 rounded-xl border text-xs font-semibold flex items-center gap-2.5 ${
          runResult.success 
            ? 'bg-[#0B2B26] border-emerald-500/40 text-emerald-300' 
            : 'bg-[#163832] border-rose-500/40 text-rose-300'
        }`}>
          {runResult.success ? <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" /> : <XCircle className="w-4 h-4 text-rose-400 shrink-0" />}
          {runResult.message}
        </div>
      )}

      {/* Service Status */}
      <div className="bg-[#163832]/80 border border-[#235347]/40 rounded-xl overflow-hidden shadow-lg shadow-[#051F20]/20">
        <div className="p-4 border-b border-[#235347]/30 bg-[#0B2B26]/50">
          <h3 className="text-sm font-bold text-[#DAF1DE]">Service Status</h3>
        </div>
        <div className="divide-y divide-[#235347]/30">
          {[
            ['PostgreSQL Database', data.postgres_status],
            ['ETL Pipeline', data.etl_status],
            ['ML Model / Results Cache', data.ml_status],
          ].map(([label, status]) => (
            <div key={label} className="px-5 py-3 flex items-center justify-between hover:bg-[#0B2B26]/40 transition-colors">
              <span className="text-xs font-medium text-[#DAF1DE]/90">{label}</span>
              <StatusBadge status={status} />
            </div>
          ))}
        </div>
      </div>

      {/* Database Row Counts */}
      <div className="bg-[#163832]/80 border border-[#235347]/40 rounded-xl overflow-hidden shadow-lg shadow-[#051F20]/20">
        <div className="p-4 border-b border-[#235347]/30 bg-[#0B2B26]/50 flex items-center gap-2">
          <Database className="w-4 h-4 text-[#8EB69B]" />
          <h3 className="text-sm font-bold text-[#DAF1DE]">Database Table Row Counts</h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-px bg-[#235347]/30">
          {Object.entries(data.table_row_counts || {}).map(([table, count]) => (
            <div key={table} className="bg-[#0B2B26]/80 p-4 hover:bg-[#0B2B26] transition-colors">
              <p className="text-[11px] font-mono text-[#8EB69B]">{table}</p>
              <p className="text-xl font-bold text-[#DAF1DE] mt-1">
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
          <div key={k} className="bg-[#163832]/80 border border-[#235347]/40 rounded-xl p-4 shadow-lg shadow-[#051F20]/20">
            <p className="text-xs text-[#8EB69B]">{k}</p>
            <p className="text-xs font-bold text-[#DAF1DE] mt-1">
              {v ? new Date(v).toLocaleString() : <span className="text-[#8EB69B]/60 italic">Never</span>}
            </p>
          </div>
        ))}
      </div>

      {/* Issues */}
      {data.issues?.length > 0 && (
        <div className="p-4 rounded-xl border-l-4 border-amber-500 bg-[#163832]/90 border-t border-r border-b border-amber-500/30">
          <h4 className="text-xs font-bold text-amber-300 mb-2 flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4" /> Issues Detected
          </h4>
          <ul className="space-y-1.5">
            {data.issues.map((issue, i) => (
              <li key={i} className="text-[11px] text-amber-200/90 flex items-start gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1 shrink-0" />
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
