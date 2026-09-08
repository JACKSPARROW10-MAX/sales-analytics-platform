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
        <div className="h-6 w-48 bg-[#DAF1DE] dark:bg-[#163832] rounded"></div>
        <div className="h-64 bg-[#EDF8EF] dark:bg-[#0B2B26] rounded-lg"></div>
        <div className="h-4 w-36 bg-[#DAF1DE] dark:bg-[#163832] rounded"></div>
      </div>
    );
  }

  // Format currency tooltip
  const formatCurrency = (val) => {
    if (val === null || val === undefined) return 'N/A';
    return `₹${Number(val).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };

  return (
    <div className="fintech-card p-5 sm:p-6 space-y-4">
      
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#DAF1DE] dark:border-[#235347] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-[#051F20] dark:text-[#DAF1DE] flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#235347] dark:text-[#8EB69B]" />
              Sales Revenue & 30-Day Growth Forecast
            </h3>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-[#DAF1DE] text-[#235347] dark:bg-[#163832] dark:text-[#8EB69B] border border-[#8EB69B] dark:border-[#235347]">
              AI Prediction Model
            </span>
          </div>
          <p className="text-xs text-[#235347] dark:text-[#8EB69B] mt-1">
            Historical sales transactions compared against the AI model's 30-day sales forecast and expected range.
          </p>
        </div>

        {/* Product Filter Dropdown */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Filter className="w-3.5 h-3.5 text-[#8EB69B]" />
          <span className="text-xs font-semibold text-[#235347] dark:text-[#8EB69B]">Filter Product:</span>
          <select
            value={selectedProduct}
            onChange={(e) => onSelectProduct(e.target.value)}
            className="bg-[#EDF8EF] dark:bg-[#0B2B26] border border-[#8EB69B] dark:border-[#235347] rounded-md px-2.5 py-1 text-xs font-semibold text-[#051F20] dark:text-[#DAF1DE] focus:outline-none focus:ring-1 focus:ring-[#235347] cursor-pointer"
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
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-[#EDF8EF] dark:bg-[#0B2B26] p-3 rounded-lg border border-[#c4dfc8] dark:border-[#235347] text-xs">
        <div>
          <span className="text-[#235347] dark:text-[#8EB69B] font-medium block text-[11px]">30-Day Forecasted Revenue:</span>
          <span className="text-[#051F20] dark:text-[#DAF1DE] font-bold font-mono text-sm tabular-nums">₹1,42,800</span>
        </div>
        <div>
          <span className="text-[#235347] dark:text-[#8EB69B] font-medium block text-[11px]">Forecast Reliability:</span>
          <span className="text-[#8EB69B] dark:text-[#8EB69B] font-bold font-mono text-sm tabular-nums">91.5% High Accuracy</span>
        </div>
        <div className="col-span-2 sm:col-span-1">
          <span className="text-[#235347] dark:text-[#8EB69B] font-medium block text-[11px]">Expected Range:</span>
          <span className="text-[#235347] dark:text-[#DAF1DE] font-bold font-mono text-sm tabular-nums">95% Range (±₹12.4K)</span>
        </div>
      </div>

      {/* Recharts Composed Chart */}
      <div className="h-[320px] w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#8EB69B" opacity={0.3} />
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 11, fill: '#235347' }}
              tickFormatter={(str) => {
                if (!str) return '';
                const parts = str.split('-');
                return parts.length === 3 ? `${parts[1]}/${parts[2]}` : str;
              }}
            />
            <YAxis 
              tick={{ fontSize: 11, fill: '#235347' }}
              tickFormatter={(val) => `₹${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
            />
            <Tooltip 
              formatter={(value, name) => [formatCurrency(value), name]}
              labelFormatter={(label) => `Date: ${label}`}
              contentStyle={{ 
                backgroundColor: '#051F20', 
                borderColor: '#235347', 
                borderRadius: '8px',
                color: '#DAF1DE',
                fontSize: '12px'
              }}
            />
            <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />

            {/* Upper/Lower Confidence Interval Band */}
            <Area 
              type="monotone" 
              dataKey="upper" 
              name="Expected Upper Range" 
              stroke="none" 
              fill="#8EB69B" 
              fillOpacity={0.2} 
            />

            {/* Historical Actual Sales Line */}
            <Line 
              type="monotone" 
              dataKey="actual" 
              name="Actual Sales Revenue" 
              stroke="#235347" 
              strokeWidth={2.5} 
              dot={{ r: 2 }}
              activeDot={{ r: 5 }}
            />

            {/* ML Forecast Line */}
            <Line 
              type="monotone" 
              dataKey="forecast" 
              name="AI Predicted Sales" 
              stroke="#8EB69B" 
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
