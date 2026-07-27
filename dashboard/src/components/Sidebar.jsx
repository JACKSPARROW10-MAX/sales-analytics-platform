// src/components/Sidebar.jsx
import React, { useState } from 'react';
import { 
  TrendingUp, 
  AlertTriangle, 
  Lightbulb, 
  FileText, 
  Database, 
  Settings, 
  ChevronLeft, 
  ChevronRight,
  PieChart,
  BrainCircuit,
  SlidersHorizontal
} from 'lucide-react';

const Sidebar = ({ activeTab, setActiveTab, anomalyCount = 6, recommendationCount = 5 }) => {
  const [collapsed, setCollapsed] = useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Overview', icon: TrendingUp, badge: null },
    { id: 'forecasts', label: 'ML Forecasts', icon: BrainCircuit, badge: 'Prophet' },
    { id: 'anomalies', label: 'Anomalies', icon: AlertTriangle, badge: anomalyCount, badgeColor: 'bg-rose-500/20 text-rose-400 border-rose-500/30' },
    { id: 'recommendations', label: 'GenAI Insights', icon: Lightbulb, badge: recommendationCount, badgeColor: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
    { id: 'reports', label: 'ETL Pipeline', icon: Database, badge: 'FastAPI' },
    { id: 'settings', label: 'Model Settings', icon: SlidersHorizontal, badge: null }
  ];

  return (
    <aside className={`relative flex flex-col bg-slate-900/90 border-r border-slate-800/80 transition-all duration-300 ${collapsed ? 'w-20' : 'w-64'} min-h-[calc(100vh-4rem)] p-4 select-none shrink-0`}>
      
      {/* Collapse Toggle Button */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-6 bg-slate-800 border border-slate-700 text-slate-400 hover:text-white p-1 rounded-full shadow-md z-40 transition-colors cursor-pointer"
        title={collapsed ? "Expand Sidebar" : "Collapse Sidebar"}
      >
        {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </button>

      {/* Navigation Links */}
      <div className="space-y-1.5 mt-2">
        <div className={`text-[10px] font-bold tracking-wider uppercase text-slate-500 px-3 mb-2 ${collapsed ? 'text-center' : ''}`}>
          {collapsed ? '• • •' : 'Navigation'}
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-medium transition-all duration-200 cursor-pointer ${
                isActive 
                  ? 'bg-gradient-to-r from-indigo-600/90 to-purple-600/90 text-white font-semibold shadow-lg shadow-indigo-600/20 border border-indigo-500/30' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
              title={collapsed ? item.label : undefined}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                {!collapsed && <span>{item.label}</span>}
              </div>

              {!collapsed && item.badge && (
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  item.badgeColor || (isActive ? 'bg-white/20 text-white border-white/20' : 'bg-slate-800 text-slate-400 border-slate-700')
                }`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Bottom Info Box */}
      {!collapsed && (
        <div className="mt-auto pt-6">
          <div className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-800/90 text-xs space-y-2">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[11px] font-medium">Pipeline Status</span>
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            </div>
            <div className="text-[11px] text-slate-300 font-mono">
              FastAPI Endpoint Ready
            </div>
            <div className="w-full bg-slate-700/50 rounded-full h-1.5 overflow-hidden">
              <div className="bg-emerald-500 h-full w-[94%]" />
            </div>
            <p className="text-[10px] text-slate-500">Accuracy Score: 96.4%</p>
          </div>
        </div>
      )}

    </aside>
  );
};

export default Sidebar;
