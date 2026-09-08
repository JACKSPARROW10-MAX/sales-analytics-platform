// src/components/Header.jsx
import React from 'react';
import { Calendar, RefreshCw, FileText, Sun, Moon, Database, ShieldCheck } from 'lucide-react';
import { getReportDownloadUrl } from '../services/api';

const Header = ({ 
  dateRange, 
  setDateRange, 
  onRefresh, 
  isRefreshing, 
  darkMode, 
  setDarkMode 
}) => {
  const handleDownloadPdf = () => {
    window.open(getReportDownloadUrl(), '_blank');
  };

  return (
    <header className="sticky top-0 z-30 w-full bg-[#051F20] border-b border-[#235347] px-6 py-3.5 shadow-md">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        
        {/* Left: Platform Branding */}
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-[#235347] text-[#DAF1DE] shadow-sm">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold tracking-tight text-[#DAF1DE] flex items-center gap-2">
                Sales Analytics Platform
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-[#0B2B26] text-[#8EB69B] border border-[#235347] flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-[#8EB69B]" /> Enterprise BI
                </span>
              </h1>
            </div>
            <p className="text-xs text-[#8EB69B] font-medium">
              PostgreSQL Star Schema • FastAPI Backend • ML Forecast Engine
            </p>
          </div>
        </div>

        {/* Right: Action Controls & Theme Toggle */}
        <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
          
          {/* Theme Toggle Button */}
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="p-2 rounded-lg bg-[#0B2B26] text-[#8EB69B] hover:text-[#DAF1DE] border border-[#235347] transition-colors cursor-pointer"
            title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-[#8EB69B]" />}
          </button>

          {/* Date Range Selector */}
          <div className="flex items-center gap-2 bg-[#0B2B26] border border-[#235347] rounded-lg px-2.5 py-1.5 text-xs text-[#DAF1DE] cursor-pointer">
            <Calendar className="w-3.5 h-3.5 text-[#8EB69B]" />
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="bg-transparent text-[#DAF1DE] focus:outline-none cursor-pointer text-xs font-medium"
            >
              <option value="6m" className="bg-[#0B2B26] text-[#DAF1DE]">Last 6 Months + 30D Forecast</option>
              <option value="3m" className="bg-[#0B2B26] text-[#DAF1DE]">Last 3 Months</option>
              <option value="ytd" className="bg-[#0B2B26] text-[#DAF1DE]">Year to Date (YTD)</option>
            </select>
          </div>

          {/* Download PDF Report Button */}
          <button
            onClick={handleDownloadPdf}
            className="flex items-center gap-1.5 bg-[#0B2B26] hover:bg-[#163832] border border-[#235347] text-[#DAF1DE] px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer"
            title="Download PDF Executive Summary"
          >
            <FileText className="w-3.5 h-3.5 text-[#8EB69B]" />
            <span className="hidden sm:inline">PDF Report</span>
          </button>

          {/* Sync Data Button */}
          <button
            onClick={() => {
              if (onRefresh) onRefresh();
              window.dispatchEvent(new Event('dashboard-refresh'));
            }}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 bg-[#235347] hover:bg-[#163832] active:bg-[#0B2B26] text-[#DAF1DE] px-3.5 py-1.5 rounded-lg text-xs font-semibold shadow-sm transition-colors disabled:opacity-50 cursor-pointer"
            title="Trigger ETL & ML Pipeline Sync"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>{isRefreshing ? 'Syncing...' : 'Sync Pipeline'}</span>
          </button>

        </div>

      </div>
    </header>
  );
};

export default Header;
