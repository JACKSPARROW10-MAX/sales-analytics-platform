// src/components/CsvUpload.jsx
import React, { useCallback, useRef, useState } from 'react';
import {
  UploadCloud, FileText, CheckCircle2, XCircle, RefreshCw, X,
} from 'lucide-react';
import { uploadSalesCSV } from '../services/api';
import { Badge } from './ui';

const REQUIRED_COLUMNS = [
  'transaction_id', 'sale_date', 'product_id', 'customer_id',
  'quantity', 'unit_price', 'discount', 'total_amount',
];
const MAX_BYTES = 20 * 1024 * 1024;

const humanSize = (b) => {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1024 / 1024).toFixed(2)} MB`;
};

// Lightweight client-side pre-check (the backend re-validates authoritatively).
const inspectCsv = (text) => {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length);
  if (!lines.length) return { ok: false, reason: 'File is empty.', rows: 0, missing: [] };
  const header = lines[0].split(',').map((h) => h.trim().toLowerCase());
  const missing = REQUIRED_COLUMNS.filter((c) => !header.includes(c));
  return {
    ok: missing.length === 0,
    reason: missing.length ? `Missing required column(s): ${missing.join(', ')}` : '',
    rows: Math.max(0, lines.length - 1),
    missing,
  };
};

const CsvUpload = ({ onUploaded }) => {
  const inputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);
  const [file, setFile] = useState(null);
  const [precheck, setPrecheck] = useState(null);
  const [phase, setPhase] = useState('idle'); // idle | uploading | success | error
  const [result, setResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  const reset = () => {
    setFile(null); setPrecheck(null); setPhase('idle'); setResult(null); setErrorMsg('');
    if (inputRef.current) inputRef.current.value = '';
  };

  const pickFile = useCallback((f) => {
    if (!f) return;
    setResult(null); setErrorMsg(''); setPhase('idle');
    if (!f.name.toLowerCase().endsWith('.csv')) {
      setFile(f); setPrecheck({ ok: false, reason: 'Only .csv files are accepted.', rows: 0, missing: [] });
      return;
    }
    if (f.size === 0) {
      setFile(f); setPrecheck({ ok: false, reason: 'File is empty (0 bytes).', rows: 0, missing: [] });
      return;
    }
    if (f.size > MAX_BYTES) {
      setFile(f); setPrecheck({ ok: false, reason: 'File exceeds the 20 MB limit.', rows: 0, missing: [] });
      return;
    }
    setFile(f);
    const reader = new FileReader();
    reader.onload = () => setPrecheck(inspectCsv(String(reader.result || '')));
    reader.onerror = () => setPrecheck({ ok: false, reason: 'Could not read file.', rows: 0, missing: [] });
    reader.readAsText(f.slice(0, 512 * 1024)); // header + first rows are enough
  }, []);

  const onDrop = (e) => {
    e.preventDefault(); setDragOver(false);
    pickFile(e.dataTransfer.files?.[0]);
  };

  const doUpload = async () => {
    if (!file) return;
    setPhase('uploading'); setErrorMsg('');
    try {
      const res = await uploadSalesCSV(file);
      setResult(res);
      setPhase('success');
      onUploaded?.(res); // parent invalidates + refetches all dashboard data
    } catch (err) {
      setPhase('error');
      setErrorMsg(err.response?.data?.detail || 'Upload failed. Please check the file and try again.');
    }
  };

  return (
    <div className="fintech-card p-6 space-y-5">
      <div>
        <h3 className="text-sm font-semibold text-[#0F172A] dark:text-[#E2E8F0] flex items-center gap-2">
          <UploadCloud className="w-4 h-4 text-[#2563EB]" /> Upload sales CSV
        </h3>
        <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-1">
          Parsed &amp; validated, loaded to staging, transformed into the star schema, then
          analytics / anomalies / forecast / AI recommendations recompute automatically.
        </p>
      </div>

      {/* Dropzone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && inputRef.current?.click()}
        role="button"
        tabIndex={0}
        aria-label="Choose a CSV file or drop one here"
        className={`rounded-xl border-2 border-dashed p-8 text-center cursor-pointer transition-colors
          ${dragOver
            ? 'border-[#2563EB] bg-[#EFF6FF] dark:bg-[#1E293B]'
            : 'border-[#CBD5E1] dark:border-[#334155] hover:border-[#2563EB] hover:bg-[#F8FAFC] dark:hover:bg-[#1E293B]'}`}
      >
        <UploadCloud className="w-9 h-9 text-[#94A3B8] mx-auto mb-2" />
        <p className="text-sm font-medium text-[#0F172A] dark:text-[#E2E8F0]">
          <span className="text-[#2563EB]">Click to browse</span> or drag &amp; drop
        </p>
        <p className="text-[11px] text-[#64748B] dark:text-[#94A3B8] mt-1">
          CSV up to 20 MB · columns: {REQUIRED_COLUMNS.join(', ')}
        </p>
        <input
          ref={inputRef}
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={(e) => pickFile(e.target.files?.[0])}
        />
      </div>

      {/* Selected file + pre-check */}
      {file && (
        <div className="rounded-lg border border-[#E2E8F0] dark:border-[#1E293B] p-4 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <FileText className="w-5 h-5 text-[#2563EB] shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-medium text-[#0F172A] dark:text-[#E2E8F0] truncate">{file.name}</p>
                <p className="text-[11px] text-[#64748B] dark:text-[#94A3B8]">
                  {humanSize(file.size)}
                  {precheck && precheck.rows > 0 && ` · ~${precheck.rows.toLocaleString()} data rows`}
                </p>
              </div>
            </div>
            {phase !== 'uploading' && (
              <button onClick={reset} className="p-1 text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-[#E2E8F0] cursor-pointer" aria-label="Remove file">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {precheck && (
            <div className="flex items-center gap-2">
              {precheck.ok
                ? <Badge tone="success"><CheckCircle2 className="w-3 h-3" /> Validation passed</Badge>
                : <Badge tone="danger"><XCircle className="w-3 h-3" /> {precheck.reason}</Badge>}
            </div>
          )}

          {phase !== 'success' && (
            <button
              onClick={doUpload}
              disabled={phase === 'uploading' || (precheck && !precheck.ok)}
              className="inline-flex items-center gap-2 bg-[#2563EB] hover:bg-[#1D4ED8] disabled:opacity-50 text-white text-xs font-semibold px-4 py-2 rounded-lg cursor-pointer"
            >
              {phase === 'uploading'
                ? <><RefreshCw className="w-4 h-4 animate-spin" /> Uploading &amp; processing…</>
                : <><UploadCloud className="w-4 h-4" /> Upload to database</>}
            </button>
          )}
        </div>
      )}

      {/* Error */}
      {phase === 'error' && (
        <div className="rounded-lg border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/30 p-4 text-xs text-[#DC2626] dark:text-red-300 flex items-start gap-2">
          <XCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Success */}
      {phase === 'success' && result && (
        <div className="rounded-lg border border-green-200 dark:border-green-900/60 bg-green-50 dark:bg-green-950/30 p-4 space-y-3">
          <p className="text-sm font-semibold text-[#16A34A] dark:text-green-400 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" /> Upload successful
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            {[
              ['Rows processed', result.rows_received],
              ['Rows inserted', result.rows_accepted],
              ['Rows rejected', result.rows_rejected],
              ['fact_sales total', result.database_total_after],
            ].map(([k, v]) => (
              <div key={k}>
                <p className="text-[#64748B] dark:text-[#94A3B8]">{k}</p>
                <p className="text-base font-bold text-[#0F172A] dark:text-[#E2E8F0] tabular-nums">
                  {Number(v ?? 0).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
          {result.rejection_reasons?.length > 0 && (
            <p className="text-[11px] text-[#64748B] dark:text-[#94A3B8]">
              Sample rejections: {result.rejection_reasons.slice(0, 3).join('; ')}
            </p>
          )}
          <p className="text-[11px] text-[#64748B] dark:text-[#94A3B8]">
            Dashboard, analytics, anomalies, forecast, AI recommendations and reports now reflect this data.
          </p>
          <button onClick={reset} className="text-xs font-semibold text-[#2563EB] hover:text-[#1D4ED8] cursor-pointer">
            Upload another file
          </button>
        </div>
      )}
    </div>
  );
};

export default CsvUpload;
