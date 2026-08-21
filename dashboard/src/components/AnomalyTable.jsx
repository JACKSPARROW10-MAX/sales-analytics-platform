// src/components/AnomalyTable.jsx
import React, { useState } from 'react';
import { AlertTriangle, Search, Filter, ArrowUpRight, ArrowDownRight, ChevronRight, X } from 'lucide-react';

const AnomalyTable = ({ anomalies = [], isLoading = false }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [selectedAnomaly, setSelectedAnomaly] = useState(null);

  if (isLoading) {
    return (
      <div className="fintech-card p-6 space-y-4 animate-pulse">
        <div className="h-6 w-48 bg-slate-200 dark:bg-slate-700 rounded"></div>
        <div className="h-48 bg-slate-100 dark:bg-slate-800 rounded"></div>
      </div>
    );
  }

  // Filter anomalies based on search and severity
  const filteredAnomalies = anomalies.filter(item => {
    const matchesSearch = 
      (item.transaction_id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.product || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.customer || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesSeverity = severityFilter === 'all' || (item.severity || '').toLowerCase() === severityFilter.toLowerCase();
    
    return matchesSearch && matchesSeverity;
  });

  return (
    <div className="fintech-card p-5 sm:p-6 space-y-4">
      
      {/* Table Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
              Statistical Sales Variance & Anomaly Audit
            </h3>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
              {filteredAnomalies.length} Flagged
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Isolation Forest & Z-score models detecting anomalous sales values, unapproved discounts, and volume spikes.
          </p>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Search ID, product, client..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 w-44 sm:w-52"
            />
          </div>

          {/* Severity Dropdown */}
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md px-2.5 py-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
          >
            <option value="all">All Severities</option>
            <option value="critical">Critical Only</option>
            <option value="warning">Warning Only</option>
            <option value="info">Info Only</option>
          </select>
        </div>
      </div>

      {/* Table Data */}
      <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
        <table className="fintech-table">
          <thead>
            <tr>
              <th>Transaction ID</th>
              <th>Date</th>
              <th>Product / Customer</th>
              <th>Actual Amount</th>
              <th>Baseline Expected</th>
              <th>Variance %</th>
              <th>Severity</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredAnomalies.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-8 text-slate-400 text-xs font-medium">
                  No transaction anomalies matching current filters.
                </td>
              </tr>
            ) : (
              filteredAnomalies.map((item) => {
                const isCritical = (item.severity || '').toLowerCase() === 'critical';
                const isPositiveVar = (item.variance || '').startsWith('+');

                return (
                  <tr key={item.id || item.transaction_id}>
                    <td className="font-mono font-semibold text-slate-900 dark:text-white text-xs">
                      {item.transaction_id || item.id}
                    </td>
                    <td className="text-slate-500 dark:text-slate-400 text-xs">
                      {item.date}
                    </td>
                    <td>
                      <div className="font-semibold text-slate-900 dark:text-slate-200 text-xs">
                        {item.product}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">
                        {item.customer} • {item.region || 'Enterprise'}
                      </div>
                    </td>
                    <td className="font-mono font-bold text-slate-900 dark:text-white text-xs tabular-nums">
                      ${Number(item.actual_value || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="font-mono text-slate-500 dark:text-slate-400 text-xs tabular-nums">
                      ${Number(item.expected_value || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td>
                      <span className={`inline-flex items-center text-xs font-bold px-2 py-0.5 rounded ${
                        isPositiveVar 
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800' 
                          : 'bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-400 border border-rose-200 dark:border-rose-800'
                      }`}>
                        {isPositiveVar ? <ArrowUpRight className="w-3 h-3 mr-0.5" /> : <ArrowDownRight className="w-3 h-3 mr-0.5" />}
                        {item.variance}
                      </span>
                    </td>
                    <td>
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded uppercase ${
                        isCritical
                          ? 'bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-200 border border-rose-300 dark:border-rose-800'
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200 border border-amber-300 dark:border-amber-800'
                      }`}>
                        {item.severity}
                      </span>
                    </td>
                    <td>
                      <button
                        onClick={() => setSelectedAnomaly(item)}
                        className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 flex items-center gap-0.5 cursor-pointer"
                      >
                        Inspect <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* SHAP Inspection Modal */}
      {selectedAnomaly && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl max-w-lg w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h4 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                Anomaly SHAP Driver Inspection
              </h4>
              <button 
                onClick={() => setSelectedAnomaly(null)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-lg border border-slate-200/80 dark:border-slate-800 font-mono">
                <div>
                  <span className="text-slate-500 block text-[10px]">Transaction ID:</span>
                  <span className="font-bold text-slate-900 dark:text-white">{selectedAnomaly.transaction_id}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Actual Value:</span>
                  <span className="font-bold text-slate-900 dark:text-white">${selectedAnomaly.actual_value}</span>
                </div>
              </div>

              <div>
                <span className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Root Cause Factor:</span>
                <p className="text-slate-600 dark:text-slate-400 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 p-2.5 rounded text-xs">
                  {typeof selectedAnomaly.root_cause === 'object' 
                    ? `${selectedAnomaly.root_cause.primary_factor}: ${selectedAnomaly.root_cause.details}`
                    : (selectedAnomaly.root_cause || selectedAnomaly.shap_explanation)}
                </p>
              </div>

              <div>
                <span className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Attribution Summary:</span>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                  {selectedAnomaly.shap_explanation || `Variance of ${selectedAnomaly.variance} driven by unapproved discount parameters.`}
                </p>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedAnomaly(null)}
                className="px-4 py-2 bg-slate-900 dark:bg-slate-800 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 cursor-pointer"
              >
                Close Audit
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AnomalyTable;
