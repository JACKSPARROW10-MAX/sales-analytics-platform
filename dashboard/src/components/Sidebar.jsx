// src/components/Sidebar.jsx
import React from 'react';
import {
  LayoutDashboard, TrendingUp, Package, Users, Tag, MapPin, Percent,
  BrainCircuit, AlertTriangle, BarChart2, Microscope, Lightbulb,
  UploadCloud, ShieldCheck, Activity, FileText, Settings, X,
} from 'lucide-react';

const NAV_SECTIONS = [
  { label: 'Overview', items: [{ id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard }] },
  {
    label: 'Analytics',
    items: [
      { id: 'sales', label: 'Sales Analytics', icon: TrendingUp },
      { id: 'products', label: 'Products', icon: Package },
      { id: 'customers', label: 'Customers', icon: Users },
      { id: 'categories', label: 'Categories', icon: Tag },
      { id: 'regions', label: 'Regions', icon: MapPin },
      { id: 'pricing', label: 'Pricing & Discounts', icon: Percent },
    ],
  },
  {
    label: 'Intelligence',
    items: [
      { id: 'forecast', label: 'Forecast', icon: BrainCircuit, badge: 'ML' },
      { id: 'anomalies', label: 'Anomalies', icon: AlertTriangle },
      { id: 'variance', label: 'Variance', icon: BarChart2 },
      { id: 'explainability', label: 'Explainability', icon: Microscope },
      { id: 'strategy', label: 'AI Insights', icon: Lightbulb, badge: 'AI' },
    ],
  },
  {
    label: 'Data & Ops',
    items: [
      { id: 'upload', label: 'Data Upload', icon: UploadCloud },
      { id: 'quality', label: 'Data Quality', icon: ShieldCheck },
      { id: 'pipeline', label: 'Pipeline Health', icon: Activity },
      { id: 'reports', label: 'Reports', icon: FileText },
      { id: 'settings', label: 'Settings', icon: Settings },
    ],
  },
];

const NavList = ({ activeTab, onPick, anomalyCount }) => (
  <nav className="py-3">
    {NAV_SECTIONS.map((section) => (
      <div key={section.label} className="px-3 mb-3">
        <p className="px-2 pb-1 text-[10px] font-bold tracking-widest uppercase text-[#94A3B8]">
          {section.label}
        </p>
        <div className="space-y-0.5">
          {section.items.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            const badge = item.id === 'anomalies' && anomalyCount > 0 ? anomalyCount : item.badge;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onPick(item.id)}
                aria-current={isActive ? 'page' : undefined}
                className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] font-medium
                  transition-colors cursor-pointer
                  ${isActive
                    ? 'bg-[#EFF6FF] text-[#2563EB] dark:bg-[#1E293B] dark:text-[#60A5FA]'
                    : 'text-[#475569] dark:text-[#94A3B8] hover:bg-[#F1F5F9] dark:hover:bg-[#1E293B] hover:text-[#0F172A] dark:hover:text-[#E2E8F0]'}`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#2563EB] dark:text-[#60A5FA]' : 'text-[#94A3B8]'}`} />
                <span className="truncate flex-1 text-left">{item.label}</span>
                {badge && (
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0
                      ${item.id === 'anomalies'
                        ? 'bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300'
                        : 'bg-[#F1F5F9] text-[#475569] dark:bg-[#334155] dark:text-[#94A3B8]'}`}
                  >
                    {badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    ))}
  </nav>
);

const Sidebar = ({ activeTab, setActiveTab, anomalyCount = 0, open = false, onClose }) => {
  const pick = (id) => { setActiveTab(id); onClose?.(); };

  return (
    <>
      {/* Desktop: docked, in normal flow */}
      <aside className="hidden lg:block w-64 shrink-0 border-r border-[#E2E8F0] dark:border-[#1E293B] bg-white dark:bg-[#0F172A] self-stretch">
        <div className="sticky top-14 max-h-[calc(100vh-3.5rem)] overflow-y-auto">
          <NavList activeTab={activeTab} onPick={pick} anomalyCount={anomalyCount} />
        </div>
      </aside>

      {/* Mobile: slide-over drawer, only mounted when open */}
      {open && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden="true" />
          <div className="relative w-64 max-w-[80%] h-full bg-white dark:bg-[#0F172A] border-r border-[#E2E8F0] dark:border-[#1E293B] overflow-y-auto shadow-xl">
            <div className="flex items-center justify-between h-14 px-4 border-b border-[#E2E8F0] dark:border-[#1E293B]">
              <span className="text-sm font-semibold text-[#0F172A] dark:text-[#E2E8F0]">Menu</span>
              <button onClick={onClose} className="p-2 text-[#64748B] cursor-pointer" aria-label="Close menu">
                <X className="w-5 h-5" />
              </button>
            </div>
            <NavList activeTab={activeTab} onPick={pick} anomalyCount={anomalyCount} />
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;
