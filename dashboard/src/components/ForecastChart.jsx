// src/components/ForecastChart.jsx
import React, { useState } from 'react';
import { 
  ResponsiveContainer, 
  ComposedChart, 
  Line, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  Legend 
} from 'recharts';
import { TrendingUp, Filter, Eye, Layers, HelpCircle } from 'lucide-react';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-slate-900/95 border border-slate-700/80 p-3.5 rounded-xl shadow-2xl backdrop-blur-md font-sans text-xs min-w-[200px]">
        <p className="font-semibold text-slate-300 mb-2 border-b border-slate-800 pb-1 flex items-center justify-between">
          <span>Date: {label}</span>
          <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${data.isForecast ? 'bg-indigo-500/20 text-indigo-400' : 'bg-slate-800 text-slate-400'}`}>
            {data.isForecast ? 'ML Forecast' : 'Historical'}
          </span>
        </p>
        
        {data.historical !== null && (
          <div className="flex items-center justify-between text-emerald-400 py-1">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block"></span>
              Historical Sales:
            </span>
            <span className="font-mono font-bold">${data.historical.toLocaleString()}</span>
          </div>
        )}

        {data.forecast !== null && (
          <div className="flex items-center justify-between text-indigo-400 py-1">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-400 inline-block"></span>
              Forecast Value:
            </span>
            <span className="font-mono font-bold">${data.forecast.toLocaleString()}</span>
          </div>
        )}

        {data.lowerBound !== null && data.upperBound !== null && (
          <div className="mt-2 pt-2 border-t border-slate-800 text-[11px] text-slate-400 space-y-1">
            <div className="flex justify-between">
              <span>95% Upper Bound:</span>
              <span className="font-mono text-indigo-300">${data.upperBound.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>95% Lower Bound:</span>
              <span className="font-mono text-indigo-300">${data.lowerBound.toLocaleString()}</span>
            </div>
          </div>
        )}
      </div>
    );
  }
  return null;
};

const ForecastChart = ({ 
  data = [], 
  products = [], 
  selectedProduct = 'all', 
  onSelectProduct,
  isLoading = false 
}) => {
  const [showConfidenceInterval, setShowConfidenceInterval] = useState(true);

  // Transform data for Recharts interval rendering: [lowerBound, upperBound] range
  const chartData = data.map(item => ({
    ...item,
    confidenceRange: item.isForecast ? [item.lowerBound, item.upperBound] : [null, null]
  }));

  if (isLoading) {
    return (
      <div className="glass-card rounded-2xl p-6 border border-slate-800 animate-pulse h-[420px] flex flex-col justify-between">
        <div className="flex justify-between items-center">
          <div className="h-6 w-48 bg-slate-800 rounded"></div>
          <div className="h-9 w-40 bg-slate-800 rounded-xl"></div>
        </div>
        <div className="h-[280px] bg-slate-800/50 rounded-xl w-full"></div>
      </div>
    );
  }

  return (
    <div className="glass-card rounded-2xl p-6 border border-slate-800/80 shadow-xl">
      {/* Chart Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-indigo-400" />
            <h2 className="text-lg font-bold text-white tracking-tight">
              Sales Horizon & Prophet Forecast
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Historical daily revenue paired with 30-day Prophet ML prediction model with 95% confidence intervals
          </p>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          {/* CI Toggle */}
          <button
            onClick={() => setShowConfidenceInterval(!showConfidenceInterval)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
              showConfidenceInterval 
                ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40' 
                : 'bg-slate-800/80 text-slate-400 border-slate-700 hover:text-slate-200'
            }`}
            title="Toggle 95% Confidence Interval Area"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>95% CI Area</span>
          </button>

          {/* Product Selector Dropdown */}
          <div className="relative flex items-center bg-slate-900 border border-slate-700/80 hover:border-slate-600 rounded-xl px-3 py-1.5 text-xs">
            <Filter className="w-3.5 h-3.5 text-indigo-400 mr-2" />
            <select
              value={selectedProduct}
              onChange={(e) => onSelectProduct(e.target.value)}
              className="bg-transparent text-slate-200 focus:outline-none cursor-pointer pr-2 font-medium"
            >
              {products.map(p => (
                <option key={p.id} value={p.id} className="bg-slate-900 text-slate-200">
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Chart */}
      <div className="h-[340px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
            <defs>
              {/* Gradient for Historical Area */}
              <linearGradient id="histGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.25}/>
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.0}/>
              </linearGradient>
              {/* Gradient for Forecast Area */}
              <linearGradient id="forecastGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.35}/>
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0.05}/>
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
            
            <XAxis 
              dataKey="date" 
              stroke="#64748b" 
              fontSize={11} 
              tickLine={false}
              axisLine={{ stroke: '#334155' }}
              minTickGap={25}
            />
            
            <YAxis 
              stroke="#64748b" 
              fontSize={11} 
              tickLine={false}
              axisLine={{ stroke: '#334155' }}
              tickFormatter={(val) => `$${(val / 1000).toFixed(0)}k`}
            />

            <Tooltip content={<CustomTooltip />} />

            {/* Shaded Confidence Interval Range */}
            {showConfidenceInterval && (
              <Area
                type="monotone"
                dataKey="confidenceRange"
                stroke="none"
                fill="url(#forecastGradient)"
                name="95% Confidence Interval"
              />
            )}

            {/* Historical Sales Line */}
            <Line
              type="monotone"
              dataKey="historical"
              stroke="#10b981"
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 5, fill: '#10b981', stroke: '#0f172a', strokeWidth: 2 }}
              name="Historical Revenue"
            />

            {/* Forecast Sales Line (Dashed) */}
            <Line
              type="monotone"
              dataKey="forecast"
              stroke="#818cf8"
              strokeWidth={2.5}
              strokeDasharray="4 4"
              dot={false}
              activeDot={{ r: 5, fill: '#818cf8', stroke: '#0f172a', strokeWidth: 2 }}
              name="Forecasted Revenue"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Legend / Status Footer */}
      <div className="mt-4 pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between text-xs text-slate-400 gap-3">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="w-3 h-0.5 bg-emerald-400 rounded"></span>
            <span>Historical Actuals</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-0.5 bg-indigo-400 border-b border-dashed border-indigo-400"></span>
            <span>ML Predicted (30 Days)</span>
          </div>
          {showConfidenceInterval && (
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-indigo-500/20 border border-indigo-500/40 rounded"></span>
              <span>95% Confidence Interval Bounds</span>
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-1.5 text-slate-500">
          <HelpCircle className="w-3.5 h-3.5" />
          <span>Trained on 180 days daily volume</span>
        </div>
      </div>
    </div>
  );
};

export default ForecastChart;
