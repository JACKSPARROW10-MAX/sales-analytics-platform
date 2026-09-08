// src/components/CompactChart.jsx
import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';

/**
 * Compact chart for showcasing a single data series or a simple comparison.
 * Props:
 *   data: array of objects with at least a `date` field.
 *   series: array of objects { key: string, name: string, color: string, type: 'line'|'area' }
 *   title: optional title displayed above the chart.
 */
const CompactChart = ({ data = [], series = [], title = '' }) => {
  const formatCurrency = (val) => {
    if (val == null) return 'N/A';
    return `₹${Number(val).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };

  return (
    <div className="fintech-card p-4 h-[260px] flex flex-col">
      {title && (
        <h3 className="text-sm font-medium mb-2 text-[#051F20] dark:text-[#DAF1DE]">{title}</h3>
      )}
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#8EB69B" opacity={0.3} />
          <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#235347' }} />
          <YAxis
            tick={{ fontSize: 10, fill: '#235347' }}
            tickFormatter={(val) => `₹${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
          />
          <Tooltip
            formatter={(value) => formatCurrency(value)}
            labelFormatter={(label) => `Date: ${label}`}
            contentStyle={{
              backgroundColor: '#051F20',
              borderColor: '#235347',
              borderRadius: '8px',
              color: '#DAF1DE',
              fontSize: '12px',
            }}
          />
          <Legend wrapperStyle={{ fontSize: '11px' }} />
          {series.map((s) =>
            s.type === 'area' ? (
              <Area
                key={s.key}
                type="monotone"
                dataKey={s.key}
                name={s.name}
                stroke="none"
                fill={s.color}
                fillOpacity={0.2}
              />
            ) : (
              <Line
                key={s.key}
                type="monotone"
                dataKey={s.key}
                name={s.name}
                stroke={s.color}
                strokeWidth={2.5}
                dot={{ r: 2 }}
                activeDot={{ r: 5 }}
              />
            )
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default CompactChart;
