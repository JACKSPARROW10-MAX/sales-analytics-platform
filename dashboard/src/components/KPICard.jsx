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
  accentColor = "indigo"
}) => {
  const colorMap = {
    indigo: {
      bg: "bg-indigo-500/10",
      border: "border-indigo-500/20",
      text: "text-indigo-400",
      glow: "hover:border-indigo-500/40"
    },
    emerald: {
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/20",
      text: "text-emerald-400",
      glow: "hover:border-emerald-500/40"
    },
    rose: {
      bg: "bg-rose-500/10",
      border: "border-rose-500/20",
      text: "text-rose-400",
      glow: "hover:border-rose-500/40"
    },
    amber: {
      bg: "bg-amber-500/10",
      border: "border-amber-500/20",
      text: "text-amber-400",
      glow: "hover:border-amber-500/40"
    }
  };

  const theme = colorMap[accentColor] || colorMap.indigo;

  if (isLoading) {
    return (
      <div className="glass-card rounded-2xl p-5 border border-slate-800 animate-pulse">
        <div className="flex items-center justify-between mb-4">
          <div className="h-4 w-28 bg-slate-800 rounded-md"></div>
          <div className="h-10 w-10 bg-slate-800 rounded-xl"></div>
        </div>
        <div className="h-8 w-36 bg-slate-800 rounded-lg mb-3"></div>
        <div className="h-3 w-24 bg-slate-800 rounded-md"></div>
      </div>
    );
  }

  return (
    <div className={`glass-card rounded-2xl p-5 border border-slate-800/80 hover:border-slate-700 transition-all duration-300 transform hover:-translate-y-0.5 group ${theme.glow}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
            {title}
          </p>
          <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white font-mono">
            {value}
          </h3>
        </div>
        <div className={`p-3 rounded-xl ${theme.bg} ${theme.border} border ${theme.text} transition-transform group-hover:scale-110 duration-200`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between pt-3 border-t border-slate-800/60">
        <div className="flex items-center gap-1">
          <span className={`inline-flex items-center text-xs font-bold px-2 py-0.5 rounded-md ${
            isPositive 
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
              : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
          }`}>
            {isPositive ? (
              <ArrowUpRight className="w-3 h-3 mr-0.5 inline" />
            ) : (
              <ArrowDownRight className="w-3 h-3 mr-0.5 inline" />
            )}
            {change}
          </span>
        </div>
        <span className="text-[11px] text-slate-400 font-medium truncate max-w-[140px]">
          {subtext}
        </span>
      </div>
    </div>
  );
};

export default KPICard;
