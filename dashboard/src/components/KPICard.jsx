// src/components/KPICard.jsx
import React from 'react';
import { ArrowUpRight, ArrowDownRight, Activity } from 'lucide-react';
import { Skeleton } from './ui';

/**
 * Executive KPI tile. Every value is supplied by the caller from the API —
 * this component renders, it never invents numbers.
 */
const KPICard = ({
  title,
  value,
  change,
  changeTone,          // 'up' | 'down' | undefined -> auto from isPositive
  isPositive = true,
  subtext,
  icon: Icon = Activity,
  isLoading = false,
}) => {
  if (isLoading) {
    return (
      <div className="fintech-card p-5">
        <div className="flex items-center justify-between mb-4">
          <Skeleton className="h-3.5 w-24" />
          <Skeleton className="h-8 w-8 rounded-lg" />
        </div>
        <Skeleton className="h-7 w-28 mb-2" />
        <Skeleton className="h-3 w-32" />
      </div>
    );
  }

  const up = changeTone ? changeTone === 'up' : isPositive;
  const hasChange = change !== undefined && change !== null && change !== '';

  return (
    <div className="fintech-card p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wide text-[#64748B] dark:text-[#94A3B8]">
          {title}
        </span>
        <span className="p-2 rounded-lg bg-[#EFF6FF] text-[#2563EB] dark:bg-[#1E293B] dark:text-[#60A5FA]">
          <Icon className="w-4 h-4" />
        </span>
      </div>

      <div className="text-2xl font-bold tracking-tight text-[#0F172A] dark:text-[#E2E8F0] tabular-nums">
        {value ?? '—'}
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {hasChange && (
          <span
            className={`inline-flex items-center text-xs font-semibold px-1.5 py-0.5 rounded-md ${
              up
                ? 'bg-green-50 text-[#16A34A] dark:bg-green-950/40 dark:text-green-400'
                : 'bg-red-50 text-[#DC2626] dark:bg-red-950/40 dark:text-red-400'
            }`}
          >
            {up ? <ArrowUpRight className="w-3 h-3 mr-0.5" /> : <ArrowDownRight className="w-3 h-3 mr-0.5" />}
            {change}
          </span>
        )}
        {subtext && (
          <span className="text-xs text-[#64748B] dark:text-[#94A3B8] truncate">{subtext}</span>
        )}
      </div>
    </div>
  );
};

export default KPICard;
