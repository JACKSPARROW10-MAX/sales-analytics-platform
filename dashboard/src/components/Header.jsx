// src/components/Header.jsx
import React from 'react';
import { RefreshCw, FileText, Sun, Moon, BarChart3, Menu } from 'lucide-react';
import { getReportDownloadUrl } from '../services/api';

const Header = ({ onRefresh, isRefreshing, darkMode, setDarkMode, onToggleSidebar, dbOnline }) => (
  <header className="sticky top-0 z-40 w-full bg-white/95 dark:bg-[#0F172A]/95 backdrop-blur border-b border-[#E2E8F0] dark:border-[#1E293B]">
    <div className="flex items-center justify-between gap-4 px-4 sm:px-6 h-14">
      {/* Brand */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-2 -ml-2 rounded-lg text-[#64748B] hover:bg-[#F1F5F9] dark:hover:bg-[#1E293B] cursor-pointer"
          aria-label="Toggle navigation"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#2563EB] text-white shrink-0">
          <BarChart3 className="w-4 h-4" />
        </div>
        <div className="min-w-0">
          <h1 className="text-sm font-semibold text-[#0F172A] dark:text-[#E2E8F0] leading-tight truncate">
            Sales Analytics Platform
          </h1>
          <p className="text-[11px] text-[#64748B] dark:text-[#94A3B8] leading-tight hidden sm:block">
            Executive Business Intelligence
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        <span
          className="hidden sm:flex items-center gap-1.5 text-[11px] font-medium text-[#64748B] dark:text-[#94A3B8] px-2.5 py-1 rounded-md bg-[#F1F5F9] dark:bg-[#1E293B]"
          title={dbOnline ? 'API and database reachable' : 'API or database unreachable'}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${dbOnline ? 'bg-[#16A34A]' : 'bg-[#DC2626]'}`} />
          {dbOnline ? 'Live' : 'Offline'}
        </span>

        <button
          onClick={() => setDarkMode(!darkMode)}
          className="p-2 rounded-lg text-[#64748B] hover:bg-[#F1F5F9] dark:hover:bg-[#1E293B] cursor-pointer"
          aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        <a
          href={getReportDownloadUrl()}
          target="_blank"
          rel="noreferrer"
          className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold text-[#0F172A] dark:text-[#E2E8F0] border border-[#E2E8F0] dark:border-[#1E293B] hover:bg-[#F1F5F9] dark:hover:bg-[#1E293B] px-3 py-1.5 rounded-lg cursor-pointer"
        >
          <FileText className="w-3.5 h-3.5" /> PDF
        </a>

        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          className="inline-flex items-center gap-1.5 bg-[#2563EB] hover:bg-[#1D4ED8] disabled:opacity-55 text-white text-xs font-semibold px-3 py-1.5 rounded-lg cursor-pointer"
          title="Re-run ETL + ML and refresh all data"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">{isRefreshing ? 'Syncing…' : 'Sync'}</span>
        </button>
      </div>
    </div>
  </header>
);

export default Header;
