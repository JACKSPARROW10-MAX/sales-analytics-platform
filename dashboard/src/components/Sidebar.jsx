// src/components/Sidebar.jsx
import React, { useState } from 'react';
import { 
  TrendingUp, 
  AlertTriangle, 
  Lightbulb, 
  Database, 
  ChevronLeft, 
  ChevronRight,
  BrainCircuit,
  FileSpreadsheet
} from 'lucide-react';

const Sidebar = ({ activeTab, setActiveTab, anomalyCount = 6, recommendationCount = 5 }) => {
  const [collapsed, setCollapsed] = useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Overview', icon: TrendingUp },
    { id: 'forecasts', label: 'ML Forecasts', icon: BrainCircuit, badge: 'Prophet' },
    { id: 'anomalies', label: 'Anomalies', icon: AlertTriangle, badge: anomalyCount, badgeColor: 'bg-rose-100 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300' },
    { id: 'recommendations', label: 'GenAI Insights', icon: Lightbulb, badge: recommendationCount, badgeColor: 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300' },
    { id: 'etl', label: 'ETL & Ingestion', icon: Database, badge: 'FastAPI' },
    { id: 'reports', label: 'Executive Reports', icon: FileSpreadsheet }
  ];

  return (
    <aside className={`relative flex flex-col bg-white dark:bg-[#0f172a] border-r border-slate-200 dark:border-slate-800 transition-all duration-200 ${collapsed ? 'w-16' : 'w-60'} min-h-[calc(100vh-3.75rem)] p-3 select-none shrink-0`}>
      
      {/* Collapse Toggle Button */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-900 dark:hover:text-white p-1 rounded-full shadow-sm z-40 transition-colors cursor-pointer"
        title={collapsed ? "Expand Navigation" : "Collapse Navigation"}
      >
        {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
      </button>

      {/* Navigation Header Label */}
      <div className={`text-[10px] font-bold tracking-wider uppercase text-slate-400 dark:text-slate-500 px-3 my-2 ${collapsed ? 'text-center' : ''}`}>
        {collapsed ? '• • •' : 'Navigation'}
      </div>

      {/* Links */}
      <div className="space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                isActive 
                  ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 border border-blue-200/80 dark:border-blue-800/80' 
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60'
              }`}
              title={collapsed ? item.label : undefined}
            >
              <div className="flex items-center gap-2.5">
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500'}`} />
                {!collapsed && <span>{item.label}</span>}
              </div>

              {!collapsed && item.badge && (
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                  item.badgeColor || (isActive ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400')
                }`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* System Status Footer */}
      {!collapsed && (
        <div className="mt-auto pt-4 border-t border-slate-100 dark:border-slate-800">
          <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60 text-xs space-y-1.5">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
              <span className="text-[11px] font-semibold">Engine Status</span>
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            </div>
            <div className="text-[11px] text-slate-800 dark:text-slate-200 font-mono font-medium">
              FastAPI + ML Ready
            </div>
            <div className="text-[10px] text-slate-400 dark:text-slate-500">
              Accuracy Score: 96.4%
            </div>
          </div>
        </div>
      )}

    </aside>
  );
};

export default Sidebar;
