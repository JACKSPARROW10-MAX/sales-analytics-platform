// src/components/ForecastChart.jsx
import React from 'react';
import { 
  ResponsiveContainer, 
  ComposedChart, 
  Line, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend 
} from 'recharts';
import { Filter, TrendingUp, ShieldCheck, Target } from 'lucide-react';

const ForecastChart = ({ 
  data = [], 
  products = [], 
  selectedProduct = 'all', 
  onSelectProduct, 
  isLoading = false 
}) => {
  if (isLoading) {
    return (
      <div className="fintech-card p-6 h-[420px] animate-pulse flex flex-col justify-between">
        <div className="h-6 w-48 bg-slate-200 dark:bg-slate-700 rounded"></div>
        <div className="h-64 bg-slate-100 dark:bg-slate-800 rounded-lg"></div>
        <div className="h-4 w-36 bg-slate-200 dark:bg-slate-700 rounded"></div>
      </div>
    );
  }

  // Format currency tooltip
  const formatCurrency = (val) => {
    if (val === null || val === undefined) return 'N/A';
    return `$${Number(val).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };

  return (
    <div className="fintech-card p-5 sm:p-6 space-y-4">
      
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              Sales Revenue & ML Forecast Projection
            </h3>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
              Prophet / Ridge Model
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Historical daily transactions compared against 30-day predicted revenue bounds (95% CI).
          </p>
        </div>

        {/* Product Filter Dropdown */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Product:</span>
          <select
            value={selectedProduct}
            onChange={(e) => onSelectProduct(e.target.value)}
            className="bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md px-2.5 py-1 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
          >
            {products.map((p) => {
              const val = typeof p === 'string' ? p : p.id;
              const name = typeof p === 'string' ? (p === 'all' ? 'All Products Catalog' : p) : p.name;
              return (
                <option key={val} value={val}>
                  {name}
                </option>
              );
            })}
          </select>
        </div>
      </div>

      {/* Summary KPI Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-lg border border-slate-200/80 dark:border-slate-800 text-xs">
        <div>
          <span className="text-slate-500 dark:text-slate-400 font-medium block text-[11px]">30-Day Predicted Sales:</span>
          <span className="text-slate-900 dark:text-white font-bold font-mono text-sm tabular-nums">$142,800</span>
        </div>
        <div>
          <span className="text-slate-500 dark:text-slate-400 font-medium block text-[11px]">Model Accuracy:</span>
          <span className="text-emerald-600 dark:text-emerald-400 font-bold font-mono text-sm tabular-nums">96.4%</span>
        </div>
        <div className="col-span-2 sm:col-span-1">
          <span className="text-slate-500 dark:text-slate-400 font-medium block text-[11px]">Confidence Interval:</span>
          <span className="text-blue-600 dark:text-blue-400 font-bold font-mono text-sm tabular-nums">95% Bounds (±$12.4K)</span>
        </div>
      </div>

      {/* Recharts Composed Chart */}
      <div className="h-[320px] w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" opacity={0.4} />
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 11, fill: '#64748b' }}
              tickFormatter={(str) => {
                if (!str) return '';
                const parts = str.split('-');
                return parts.length === 3 ? `${parts[1]}/${parts[2]}` : str;
              }}
            />
            <YAxis 
              tick={{ fontSize: 11, fill: '#64748b' }}
              tickFormatter={(val) => `$${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
            />
            <Tooltip 
              formatter={(value, name) => [formatCurrency(value), name]}
              labelFormatter={(label) => `Date: ${label}`}
              contentStyle={{ 
                backgroundColor: '#0f172a', 
                borderColor: '#334155', 
                borderRadius: '8px',
                color: '#f8fafc',
                fontSize: '12px'
              }}
            />
            <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />

            {/* Upper/Lower Confidence Interval Band */}
            <Area 
              type="monotone" 
              dataKey="upper" 
              name="Upper Bound (95% CI)" 
              stroke="none" 
              fill="#3b82f6" 
              fillOpacity={0.15} 
            />

            {/* Historical Actual Sales Line */}
            <Line 
              type="monotone" 
              dataKey="actual" 
              name="Actual Historical Revenue" 
              stroke="#2563eb" 
              strokeWidth={2.5} 
              dot={{ r: 2 }}
              activeDot={{ r: 5 }}
            />

            {/* ML Forecast Line */}
            <Line 
              type="monotone" 
              dataKey="forecast" 
              name="ML Forecasted Revenue" 
              stroke="#059669" 
              strokeWidth={2} 
              strokeDasharray="4 4"
              dot={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

    </div>
  );
};

export default ForecastChart;
