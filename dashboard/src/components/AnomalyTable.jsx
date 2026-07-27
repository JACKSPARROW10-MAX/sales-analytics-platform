// src/components/AnomalyTable.jsx
import React, { useState } from 'react';
import { AlertTriangle, ArrowUpDown, Search, Filter, ShieldAlert, CheckCircle2, Clock } from 'lucide-react';

const AnomalyTable = ({ anomalies = [], isLoading = false }) => {
  const [severityFilter, setSeverityFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('date');
  const [sortDirection, setSortDirection] = useState('desc');

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const filteredAnomalies = anomalies
    .filter(a => {
      const matchesSeverity = severityFilter === 'all' || a.severity === severityFilter;
      const matchesSearch = 
        a.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.id.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesSeverity && matchesSearch;
    })
    .sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];
      if (typeof aVal === 'string') {
        return sortDirection === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
    });

  const getSeverityBadge = (severity) => {
    switch (severity) {
      case 'high':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping"></span>
            High Severity
          </span>
        );
      case 'medium':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
            Medium
          </span>
        );
      case 'low':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            Low
          </span>
        );
    }
  };

  if (isLoading) {
    return (
      <div className="glass-card rounded-2xl p-6 border border-slate-800 animate-pulse space-y-4">
        <div className="h-6 w-44 bg-slate-800 rounded"></div>
        <div className="space-y-3">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-12 bg-slate-800/40 rounded-xl w-full"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card rounded-2xl p-6 border border-slate-800/80 shadow-xl">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-rose-400" />
            <h2 className="text-lg font-bold text-white tracking-tight">
              Detected Sales Anomalies
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Isolated revenue deviations identified by Isolation Forest & Z-Score anomaly detectors
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Search Input */}
          <div className="relative flex items-center bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-1.5 text-xs w-full sm:w-48">
            <Search className="w-3.5 h-3.5 text-slate-400 mr-2 shrink-0" />
            <input
              type="text"
              placeholder="Search anomalies..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-transparent text-slate-200 focus:outline-none placeholder-slate-500 w-full"
            />
          </div>

          {/* Severity Dropdown Filter */}
          <div className="relative flex items-center bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-1.5 text-xs">
            <Filter className="w-3.5 h-3.5 text-rose-400 mr-2" />
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="bg-transparent text-slate-200 focus:outline-none cursor-pointer font-medium"
            >
              <option value="all" className="bg-slate-900">All Severities</option>
              <option value="high" className="bg-slate-900">High Only</option>
              <option value="medium" className="bg-slate-900">Medium Only</option>
              <option value="low" className="bg-slate-900">Low Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto rounded-xl border border-slate-800">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-900/80 border-b border-slate-800 text-slate-400 font-semibold select-none">
              <th className="py-3.5 px-4 cursor-pointer hover:text-slate-200" onClick={() => handleSort('date')}>
                <div className="flex items-center gap-1">
                  <span>Date</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="py-3.5 px-4 cursor-pointer hover:text-slate-200" onClick={() => handleSort('productName')}>
                <div className="flex items-center gap-1">
                  <span>Product</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="py-3.5 px-4">Expected vs Actual</th>
              <th className="py-3.5 px-4 cursor-pointer hover:text-slate-200" onClick={() => handleSort('variance')}>
                <div className="flex items-center gap-1">
                  <span>Variance</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="py-3.5 px-4">Severity</th>
              <th className="py-3.5 px-4 min-w-[220px]">Root Cause Reason</th>
              <th className="py-3.5 px-4 text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-sans">
            {filteredAnomalies.length > 0 ? (
              filteredAnomalies.map((item) => {
                const isNegative = item.variance.startsWith('-');
                return (
                  <tr key={item.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-medium text-slate-300">
                      {item.date}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-200">
                      {item.productName}
                    </td>
                    <td className="py-3.5 px-4 font-mono">
                      <span className="text-slate-400">{item.expectedValue}</span>
                      <span className="text-slate-500 mx-1.5 font-sans">→</span>
                      <span className="text-white font-bold">{item.actualValue}</span>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold">
                      <span className={isNegative ? 'text-rose-400' : 'text-emerald-400'}>
                        {item.variance}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      {getSeverityBadge(item.severity)}
                    </td>
                    <td className="py-3.5 px-4 text-slate-300 leading-snug">
                      {item.reason}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-slate-800 text-slate-400 border border-slate-700">
                        <Clock className="w-3 h-3" />
                        {item.status}
                      </span>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-500">
                  No anomalies match the selected filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AnomalyTable;
