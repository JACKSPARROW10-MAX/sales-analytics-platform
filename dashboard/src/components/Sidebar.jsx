// src/components/Sidebar.jsx
import React, { useState } from 'react';
import {
  LayoutDashboard, TrendingUp, Package, Users, Tag, MapPin, Percent,
  BrainCircuit, AlertTriangle, BarChart2, Lightbulb, Microscope,
  UploadCloud, ShieldCheck, Activity,
  FileText, ChevronLeft, ChevronRight,
} from 'lucide-react';

const SECTIONS = [
  {
    label: 'Overview',
    items: [
      { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
    ],
  },
  {
    label: 'Sales Analytics',
    items: [
      { id: 'sales',      label: 'Sales Analytics',        icon: TrendingUp },
      { id: 'products',   label: 'Product Analysis',       icon: Package },
      { id: 'customers',  label: 'Customer Analysis',      icon: Users },
      { id: 'categories', label: 'Category & Subcategory', icon: Tag },
      { id: 'regions',    label: 'Regional Analysis',      icon: MapPin },
      { id: 'pricing',    label: 'Pricing & Discounts',    icon: Percent },
    ],
  },
  {
    label: 'AI / ML',
    items: [
      { id: 'forecast',       label: 'Sales Forecast',         icon: BrainCircuit,  badge: 'AI' },
      { id: 'anomalies',      label: 'Anomaly Detection',      icon: AlertTriangle },
      { id: 'variance',       label: 'Sales Variance',         icon: BarChart2 },
      { id: 'explainability', label: 'Explainable AI',         icon: Microscope },
      { id: 'strategy',       label: 'AI Recommendations',     icon: Lightbulb,     badge: 'AI' },
    ],
  },
  {
    label: 'Data',
    items: [
      { id: 'upload',   label: 'Upload CSV',      icon: UploadCloud },
      { id: 'quality',  label: 'Data Quality',    icon: ShieldCheck },
      { id: 'pipeline', label: 'Pipeline Health', icon: Activity },
    ],
  },
  {
    label: 'Reports',
    items: [
      { id: 'reports', label: 'Executive Reports', icon: FileText },
    ],
  },
];

const Sidebar = ({ activeTab, setActiveTab, anomalyCount = 0 }) => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={`relative flex flex-col bg-white dark:bg-[#0f172a] border-r border-slate-200
        dark:border-slate-800 transition-all duration-200 min-h-[calc(100vh-3.75rem)]
        shrink-0 select-none ${collapsed ? 'w-16' : 'w-64'}`}
    >
      {/* Collapse Toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-5 bg-white dark:bg-slate-800 border border-slate-200
          dark:border-slate-700 text-slate-500 hover:text-slate-900 dark:hover:text-white
          p-1 rounded-full shadow-sm z-40 transition-colors cursor-pointer"
        title={collapsed ? 'Expand' : 'Collapse'}
      >
        {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
      </button>

      <div className="flex-1 overflow-y-auto py-3 space-y-1">
        {SECTIONS.map((section) => (
          <div key={section.label} className="mb-1">
            {/* Section Header */}
            {!collapsed && (
              <div className="px-4 pt-3 pb-1 text-[10px] font-bold tracking-widest uppercase
                text-slate-400 dark:text-slate-500">
                {section.label}
              </div>
            )}
            {collapsed && <div className="border-t border-slate-100 dark:border-slate-800 mx-2 my-2" />}

            {/* Nav Items */}
            {section.items.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              const badgeLabel = item.id === 'anomalies' && anomalyCount > 0
                ? anomalyCount
                : item.badge || null;

              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  title={collapsed ? item.label : undefined}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg mx-1
                    text-xs font-semibold transition-all duration-150 cursor-pointer
                    ${isActive
                      ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 border border-blue-200/70 dark:border-blue-800/70'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                    }`}
                  style={{ width: collapsed ? 'calc(100% - 8px)' : 'calc(100% - 8px)' }}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500'}`} />
                    {!collapsed && <span className="truncate">{item.label}</span>}
                  </div>
                  {!collapsed && badgeLabel && (
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0 ml-1
                      ${item.id === 'anomalies'
                        ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300'
                        : 'bg-blue-100 text-blue-700 dark:bg-blue-950/80 dark:text-blue-300'}`}
                    >
                      {badgeLabel}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* Footer Status */}
      {!collapsed && (
        <div className="p-3 border-t border-slate-100 dark:border-slate-800">
          <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border
            border-slate-200/70 dark:border-slate-700/60 text-xs space-y-1">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
              <span className="text-[11px] font-semibold">Engine Status</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse inline-block" />
            </div>
            <div className="text-[11px] text-slate-800 dark:text-slate-200 font-mono font-medium">
              FastAPI + ML Active
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;
