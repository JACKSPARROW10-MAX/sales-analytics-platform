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
        <div className="h-6 w-48 bg-[#DAF1DE] dark:bg-[#163832] rounded"></div>
        <div className="h-48 bg-[#EDF8EF] dark:bg-[#0B2B26] rounded"></div>
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#DAF1DE] dark:border-[#235347] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-[#051F20] dark:text-[#DAF1DE] flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
              Unusual Sales Spikes & Drop Audit
            </h3>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
              {filteredAnomalies.length} Flagged
            </span>
          </div>
          <p className="text-xs text-[#235347] dark:text-[#8EB69B] mt-1">
            Transactions that stand out significantly from normal sales patterns, such as unapproved discounts or volume spikes.
          </p>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-[#8EB69B] absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Search ID, product, client..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-3 py-1.5 bg-[#EDF8EF] dark:bg-[#0B2B26] border border-[#8EB69B] dark:border-[#235347] rounded-md text-xs text-[#051F20] dark:text-[#DAF1DE] focus:outline-none focus:ring-1 focus:ring-[#235347] w-44 sm:w-52"
            />
          </div>

          {/* Severity Dropdown */}
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="bg-[#EDF8EF] dark:bg-[#0B2B26] border border-[#8EB69B] dark:border-[#235347] rounded-md px-2.5 py-1.5 text-xs font-semibold text-[#051F20] dark:text-[#DAF1DE] focus:outline-none focus:ring-1 focus:ring-[#235347] cursor-pointer"
          >
            <option value="all">All Urgency Levels</option>
            <option value="critical">High Urgency Only</option>
            <option value="warning">Medium Urgency Only</option>
            <option value="info">Low Urgency Only</option>
          </select>
        </div>
      </div>

      {/* Table Data */}
      <div className="overflow-x-auto rounded-lg border border-[#c4dfc8] dark:border-[#235347]">
        <table className="fintech-table">
          <thead>
            <tr>
              <th>Transaction ID</th>
              <th>Date</th>
              <th>Product / Customer</th>
              <th>Actual Sales</th>
              <th>Expected Sales</th>
              <th>Difference</th>
              <th>Urgency Level</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredAnomalies.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-8 text-[#8EB69B] text-xs font-medium">
                  No unusual sales transactions matching current filters.
                </td>
              </tr>
            ) : (
              filteredAnomalies.map((item) => {
                const isCritical = (item.severity || '').toLowerCase() === 'critical';
                const isPositiveVar = (item.variance || '').startsWith('+');

                return (
                  <tr key={item.id || item.transaction_id}>
                    <td className="font-mono font-semibold text-[#051F20] dark:text-[#DAF1DE] text-xs">
                      {item.transaction_id || item.id}
                    </td>
                    <td className="text-[#235347] dark:text-[#8EB69B] text-xs">
                      {item.date}
                    </td>
                    <td>
                      <div className="font-semibold text-[#051F20] dark:text-[#DAF1DE] text-xs">
                        {item.product}
                      </div>
                      <div className="text-[11px] text-[#235347] dark:text-[#8EB69B]">
                        {item.customer} • {item.region || 'Enterprise'}
                      </div>
                    </td>
                    <td className="font-mono font-bold text-[#051F20] dark:text-[#DAF1DE] text-xs tabular-nums">
                      ₹{Number(item.actual_value || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="font-mono text-[#235347] dark:text-[#8EB69B] text-xs tabular-nums">
                      ₹{Number(item.expected_value || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td>
                      <span className={`inline-flex items-center text-xs font-bold px-2 py-0.5 rounded ${
                        isPositiveVar 
                          ? 'bg-[#DAF1DE] text-[#235347] dark:bg-[#163832] dark:text-[#8EB69B] border border-[#8EB69B] dark:border-[#235347]' 
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
                        className="text-xs font-semibold text-[#235347] dark:text-[#8EB69B] hover:text-[#163832] dark:hover:text-[#DAF1DE] flex items-center gap-0.5 cursor-pointer"
                      >
                        View Details <ChevronRight className="w-3.5 h-3.5" />
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
          <div className="bg-white dark:bg-[#0B2B26] border border-[#c4dfc8] dark:border-[#235347] rounded-xl max-w-lg w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-[#DAF1DE] dark:border-[#235347] pb-3">
              <h4 className="text-base font-bold text-[#051F20] dark:text-[#DAF1DE] flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                Unusual Sale Breakdown & Details
              </h4>
              <button 
                onClick={() => setSelectedAnomaly(null)}
                className="p-1 text-[#8EB69B] hover:text-[#051F20] dark:hover:text-[#DAF1DE] rounded cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2 bg-[#EDF8EF] dark:bg-[#163832] p-3 rounded-lg border border-[#c4dfc8] dark:border-[#235347] font-mono">
                <div>
                  <span className="text-[#235347] dark:text-[#8EB69B] block text-[10px]">Transaction ID:</span>
                  <span className="font-bold text-[#051F20] dark:text-[#DAF1DE]">{selectedAnomaly.transaction_id}</span>
                </div>
                <div>
                  <span className="text-[#235347] dark:text-[#8EB69B] block text-[10px]">Actual Sales Value:</span>
                  <span className="font-bold text-[#051F20] dark:text-[#DAF1DE]">₹{selectedAnomaly.actual_value}</span>
                </div>
              </div>

              <div>
                <span className="font-semibold text-[#051F20] dark:text-[#DAF1DE] block mb-1">Key Cause Factor:</span>
                <p className="text-[#235347] dark:text-[#8EB69B] bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 p-2.5 rounded text-xs">
                  {typeof selectedAnomaly.root_cause === 'object' 
                    ? `${selectedAnomaly.root_cause.primary_factor}: ${selectedAnomaly.root_cause.details}`
                    : (selectedAnomaly.root_cause || selectedAnomaly.shap_explanation)}
                </p>
              </div>

              <div>
                <span className="font-semibold text-[#051F20] dark:text-[#DAF1DE] block mb-1">Explanation:</span>
                <p className="text-[#235347] dark:text-[#8EB69B] leading-relaxed">
                  {selectedAnomaly.shap_explanation || `Variance of ${selectedAnomaly.variance} driven by unapproved discount parameters.`}
                </p>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedAnomaly(null)}
                className="px-4 py-2 bg-[#235347] dark:bg-[#163832] text-[#DAF1DE] rounded-lg text-xs font-semibold hover:bg-[#163832] cursor-pointer"
              >
                Close Window
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AnomalyTable;
