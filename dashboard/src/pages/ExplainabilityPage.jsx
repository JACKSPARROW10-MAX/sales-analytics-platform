// src/pages/ExplainabilityPage.jsx
// Feature Attribution / Explainable AI Page
// Note: Current implementation uses statistical correlation-based attribution (not true SHAP library).
// Values are computed from actual data patterns in the ML pipeline, not hardcoded.

import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Microscope, AlertCircle } from 'lucide-react';
import { getAnomalies, getExplainability } from '../services/api';

const ExplainabilityPage = () => {
  const [anomalies, setAnomalies] = useState([]);
  const [featureImportance, setFeatureImportance] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [anomData, expData] = await Promise.all([
        getAnomalies('all'),
        getExplainability()
      ]);
      setAnomalies(anomData.slice(0, 20));
      if (anomData.length > 0) setSelected(anomData[0]);
      if (expData && expData.length > 0) {
        setFeatureImportance(expData);
      }
    } catch (err) {
      console.error('Failed to load explainability data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    window.addEventListener('dashboard-refresh', loadData);
    return () => window.removeEventListener('dashboard-refresh', loadData);
  }, []);

  const chartData = featureImportance.map(f => ({
    ...f,
    abs_value: Math.abs(f.shap_value || 0),
    color: f.direction === 'positive' ? '#8EB69B' : '#dc2626',
  }));

  return (
    <div className="space-y-6">
      {/* Disclaimer Banner */}
      <div className="fintech-card p-4 bg-amber-50 dark:bg-amber-950/30 border-l-4 border-amber-500">
        <div className="flex gap-2">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-bold text-amber-700 dark:text-amber-300">About this Analysis</p>
            <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-0.5">
              Feature attribution is computed using <strong>statistical correlation analysis</strong> from the ML pipeline
              (IsolationForest + feature correlation on actual data). True SHAP library integration requires the{' '}
              <code>shap</code> Python package (not currently installed). Per-anomaly explanations are generated from
              the root-cause logic in the anomaly detection model using real transaction data.
            </p>
          </div>
        </div>
      </div>

      {/* Global Feature Attribution */}
      <div className="fintech-card p-5">
        <h3 className="text-sm font-bold text-[#051F20] dark:text-[#DAF1DE] mb-1 flex items-center gap-2">
          <Microscope className="w-4 h-4 text-[#235347] dark:text-[#8EB69B]" /> Global Feature Attribution (Revenue Drivers)
        </h3>
        <p className="text-[11px] text-[#8EB69B] mb-4">
          Based on IsolationForest anomaly detection model trained on {'{fact_sales}'} — showing relative feature weights driving revenue outcomes.
        </p>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 30, left: 160, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#8EB69B" opacity={0.3} />
            <XAxis type="number" domain={[-0.2, 0.5]} tick={{ fontSize: 10 }} tickFormatter={v => v.toFixed(2)} />
            <YAxis type="category" dataKey="feature" tick={{ fontSize: 10 }} width={155} />
            <Tooltip formatter={(v, name) => [v.toFixed(3), 'Attribution Score']} />
            <Bar dataKey="shap_value" radius={[0, 3, 3, 0]}>
              {chartData.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div className="flex gap-4 mt-3 text-[11px]">
          <span className="flex items-center gap-1 text-[#8EB69B]"><span className="w-3 h-3 bg-[#8EB69B] rounded inline-block" /> Positive driver (increases revenue)</span>
          <span className="flex items-center gap-1 text-rose-600"><span className="w-3 h-3 bg-rose-500 rounded inline-block" /> Negative driver (reduces revenue)</span>
        </div>
      </div>

      {/* Feature Details Table */}
      <div className="fintech-card overflow-hidden">
        <div className="p-4 border-b border-[#DAF1DE] dark:border-[#235347]">
          <h3 className="text-sm font-bold text-[#051F20] dark:text-[#DAF1DE]">Feature Attribution Detail</h3>
        </div>
        <table className="w-full text-xs">
          <thead className="bg-[#163832]">
            <tr>
              {['Feature','Attribution Score','Contribution %','Direction','Business Impact'].map(h => (
                <th key={h} className="px-4 py-2.5 text-left font-semibold text-[#DAF1DE]">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {featureImportance.map((f, i) => (
              <tr key={i} className="border-t border-[#DAF1DE] dark:border-[#235347] hover:bg-[#EDF8EF] dark:hover:bg-[#163832]">
                <td className="px-4 py-2.5 font-medium text-[#051F20] dark:text-[#DAF1DE]">{f.feature}</td>
                <td className="px-4 py-2.5 font-mono font-bold">
                  <span className={f.direction === 'positive' ? 'text-[#8EB69B]' : 'text-rose-600'}>
                    {f.shap_value > 0 ? '+' : ''}{f.shap_value.toFixed(3)}
                  </span>
                </td>
                <td className="px-4 py-2.5">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${f.direction === 'positive' ? 'bg-[#DAF1DE] text-[#235347] dark:bg-[#163832] dark:text-[#8EB69B]' : 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300'}`}>
                    {f.contribution}
                  </span>
                </td>
                <td className="px-4 py-2.5 capitalize text-[#235347] dark:text-[#8EB69B]">{f.direction}</td>
                <td className="px-4 py-2.5 text-[#235347] dark:text-[#8EB69B]">{f.impact}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Per-Anomaly Explanations */}
      <div className="fintech-card overflow-hidden">
        <div className="p-4 border-b border-[#DAF1DE] dark:border-[#235347] flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-[#051F20] dark:text-[#DAF1DE]">Per-Anomaly Root Cause Explanation</h3>
            <p className="text-[11px] text-[#8EB69B] mt-0.5">Select an anomaly to view its root cause analysis</p>
          </div>
        </div>
        {loading ? (
          <div className="p-8 text-center text-[#8EB69B] text-xs">Loading anomaly explanations…</div>
        ) : !anomalies.length ? (
          <div className="p-8 text-center text-[#8EB69B] text-xs">No anomalies found. Run the ML pipeline first.</div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2">
            {/* Anomaly List */}
            <div className="border-r border-[#DAF1DE] dark:border-[#235347] max-h-96 overflow-y-auto">
              {anomalies.map(a => (
                <button key={a.id} onClick={() => setSelected(a)}
                  className={`w-full text-left px-4 py-3 border-b border-[#DAF1DE] dark:border-[#235347] text-xs transition-colors cursor-pointer
                    ${selected?.id === a.id ? 'bg-[#DAF1DE] dark:bg-[#163832]' : 'hover:bg-[#EDF8EF] dark:hover:bg-[#0B2B26]'}`}>
                  <p className="font-semibold text-[#051F20] dark:text-[#DAF1DE]">{a.transaction_id || a.id}</p>
                  <p className="text-[#235347] dark:text-[#8EB69B] mt-0.5">{a.product} • {a.date}</p>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded mt-1 inline-block
                    ${a.severity === 'Critical' ? 'bg-rose-100 text-rose-700' : a.severity === 'Warning' ? 'bg-amber-100 text-amber-700' : 'bg-[#DAF1DE] text-[#235347] dark:bg-[#163832] dark:text-[#8EB69B]'}`}>
                    {a.severity}
                  </span>
                </button>
              ))}
            </div>
            {/* Explanation Panel */}
            <div className="p-5">
              {selected ? (
                <div className="space-y-4">
                  <div>
                    <p className="text-xs text-[#235347] dark:text-[#8EB69B]">Transaction ID</p>
                    <p className="font-bold text-[#051F20] dark:text-[#DAF1DE]">{selected.transaction_id || selected.id}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div><p className="text-[#8EB69B]">Actual Revenue</p><p className="font-bold text-[#051F20] dark:text-[#DAF1DE]">₹{Number(selected.actual_value||0).toLocaleString()}</p></div>
                    <div><p className="text-[#8EB69B]">Expected (Mean)</p><p className="font-bold text-[#051F20] dark:text-[#DAF1DE]">₹{Number(selected.expected_value||0).toLocaleString()}</p></div>
                    <div><p className="text-[#8EB69B]">Anomaly Score</p><p className="font-bold text-amber-600">{selected.anomaly_score}</p></div>
                    <div><p className="text-[#8EB69B]">Variance</p><p className={`font-bold ${Number(selected.variance_pct) > 0 ? 'text-[#8EB69B]' : 'text-rose-600'}`}>{selected.variance}</p></div>
                  </div>
                  <div className="bg-[#EDF8EF] dark:bg-[#0B2B26] rounded-lg p-3 border border-[#c4dfc8] dark:border-[#235347]">
                    <p className="text-[11px] font-bold text-[#235347] dark:text-[#8EB69B] mb-1">Primary Root Cause</p>
                    <p className="text-xs font-semibold text-[#051F20] dark:text-[#DAF1DE]">{selected.root_cause?.primary_factor}</p>
                    <p className="text-[11px] text-[#235347] dark:text-[#8EB69B] mt-1">{selected.root_cause?.details}</p>
                  </div>
                  <div className="bg-[#DAF1DE] dark:bg-[#163832] rounded-lg p-3 border border-[#8EB69B] dark:border-[#235347]">
                    <p className="text-[11px] font-bold text-[#235347] dark:text-[#8EB69B] mb-1">ML Explanation</p>
                    <p className="text-[11px] text-[#051F20] dark:text-[#DAF1DE]">{selected.shap_explanation}</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-[#8EB69B] text-xs">
                  Select an anomaly to view its explanation
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExplainabilityPage;
