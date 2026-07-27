// src/components/Header.jsx
import React from 'react';
import { Calendar, RefreshCw, Sparkles, Activity, Layers } from 'lucide-react';

const Header = ({ dateRange, setDateRange, onRefresh, isRefreshing }) => {
  return (
    <header className="sticky top-0 z-30 w-full bg-slate-900/80 backdrop-blur-md border-b border-slate-800/80 px-6 py-4 transition-all">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        
        {/* Left: Branding & Subtitle */}
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/25">
            <Activity className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                SalesPulse AI
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Predictive Analytics
                </span>
              </h1>
            </div>
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              Sales Analytics & ML Forecasting Platform — <span className="text-emerald-400 font-mono">Mock API Mode</span>
            </p>
          </div>
        </div>

        {/* Right: Controls & Actions */}
        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          {/* Status Badge */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/60 border border-slate-700/50 text-xs text-slate-300">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="font-mono text-slate-400">Model: Prophet + XGBoost</span>
          </div>

          {/* Date Range Selector */}
          <div className="relative">
            <div className="flex items-center gap-2 bg-slate-800/90 border border-slate-700/80 hover:border-slate-600 rounded-xl px-3 py-2 text-xs text-slate-200 cursor-pointer transition-colors shadow-sm">
              <Calendar className="w-4 h-4 text-indigo-400" />
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="bg-transparent text-slate-200 focus:outline-none cursor-pointer pr-1 text-xs font-medium"
              >
                <option value="6m" className="bg-slate-900 text-slate-200">Last 6 Months + 30D Forecast</option>
                <option value="3m" className="bg-slate-900 text-slate-200">Last 3 Months</option>
                <option value="ytd" className="bg-slate-900 text-slate-200">Year to Date (YTD)</option>
              </select>
            </div>
          </div>

          {/* Refresh Button */}
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2 bg-indigo-600/90 hover:bg-indigo-600 active:bg-indigo-700 text-white px-3.5 py-2 rounded-xl text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all hover:scale-[1.02] disabled:opacity-50 cursor-pointer"
            title="Refresh Pipeline Data"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">{isRefreshing ? 'Syncing...' : 'Sync Data'}</span>
          </button>
        </div>

      </div>
    </header>
  );
};

export default Header;
