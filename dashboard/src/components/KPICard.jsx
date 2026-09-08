// src/components/KPICard.jsx
import React from 'react';
import { ArrowUpRight, ArrowDownRight, Activity } from 'lucide-react';

const KPICard = ({ 
  title, 
  value, 
  change, 
  isPositive = true, 
  subtext, 
  icon: Icon = Activity, 
  isLoading = false,
  accentColor = "green"
}) => {
  const colorStyles = {
    green: {
      iconBg: "bg-[#DAF1DE] text-[#235347] dark:bg-[#163832] dark:text-[#8EB69B] dark:border-[#235347]",
      badgePositive: "bg-[#DAF1DE] text-[#235347] border-[#8EB69B] dark:bg-[#163832] dark:text-[#8EB69B] dark:border-[#235347]",
      badgeNegative: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/50 dark:text-rose-400 dark:border-rose-800/60"
    },
    emerald: {
      iconBg: "bg-[#DAF1DE] text-[#8EB69B] dark:bg-[#163832] dark:text-[#8EB69B] dark:border-[#235347]",
      badgePositive: "bg-[#DAF1DE] text-[#235347] border-[#8EB69B] dark:bg-[#163832] dark:text-[#8EB69B] dark:border-[#235347]",
      badgeNegative: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/50 dark:text-rose-400 dark:border-rose-800/60"
    },
    rose: {
      iconBg: "bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400 dark:border-rose-800/60",
      badgePositive: "bg-[#DAF1DE] text-[#235347] border-[#8EB69B] dark:bg-[#163832] dark:text-[#8EB69B] dark:border-[#235347]",
      badgeNegative: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/50 dark:text-rose-400 dark:border-rose-800/60"
    },
    amber: {
      iconBg: "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 dark:border-amber-800/60",
      badgePositive: "bg-[#DAF1DE] text-[#235347] border-[#8EB69B] dark:bg-[#163832] dark:text-[#8EB69B] dark:border-[#235347]",
      badgeNegative: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/50 dark:text-rose-400 dark:border-rose-800/60"
    },
    // Map old "blue" calls to "green"
    blue: {
      iconBg: "bg-[#DAF1DE] text-[#235347] dark:bg-[#163832] dark:text-[#8EB69B] dark:border-[#235347]",
      badgePositive: "bg-[#DAF1DE] text-[#235347] border-[#8EB69B] dark:bg-[#163832] dark:text-[#8EB69B] dark:border-[#235347]",
      badgeNegative: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/50 dark:text-rose-400 dark:border-rose-800/60"
    }
  };

  const style = colorStyles[accentColor] || colorStyles.green;

  if (isLoading) {
    return (
      <div className="fintech-card p-5 animate-pulse">
        <div className="flex items-center justify-between mb-3">
          <div className="h-3.5 w-24 bg-[#DAF1DE] dark:bg-[#163832] rounded"></div>
          <div className="h-8 w-8 bg-[#DAF1DE] dark:bg-[#163832] rounded-lg"></div>
        </div>
        <div className="h-7 w-32 bg-[#DAF1DE] dark:bg-[#163832] rounded mb-2"></div>
        <div className="h-3 w-20 bg-[#DAF1DE] dark:bg-[#163832] rounded"></div>
      </div>
    );
  }

  return (
    <div className="fintech-card p-5 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold uppercase tracking-wider text-[#235347] dark:text-[#8EB69B]">
            {title}
          </span>
          <div className={`p-2 rounded-lg border border-[#c4dfc8]/60 ${style.iconBg}`}>
            <Icon className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#051F20] dark:text-[#DAF1DE] tabular-nums font-mono">
          {value}
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-[#DAF1DE] dark:border-[#235347] flex items-center justify-between">
        <span className={`inline-flex items-center text-xs font-bold px-2 py-0.5 rounded border ${
          isPositive ? style.badgePositive : style.badgeNegative
        }`}>
          {isPositive ? (
            <ArrowUpRight className="w-3 h-3 mr-0.5 inline" />
          ) : (
            <ArrowDownRight className="w-3 h-3 mr-0.5 inline" />
          )}
          {change}
        </span>
        <span className="text-xs text-[#235347] dark:text-[#8EB69B] font-medium truncate max-w-[140px]">
          {subtext}
        </span>
      </div>
    </div>
  );
};

export default KPICard;
