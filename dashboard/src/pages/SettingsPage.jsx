// src/pages/SettingsPage.jsx
import React, { useEffect, useState } from 'react';
import { Server, Database, Palette, Info, CheckCircle2, XCircle } from 'lucide-react';
import { API_BASE_URL, getHealth } from '../services/api';
import { Panel, Badge, Skeleton } from '../components/ui';

const Row = ({ label, children }) => (
  <div className="flex items-center justify-between gap-4 px-5 py-3 border-b border-[#E2E8F0] dark:border-[#1E293B] last:border-0">
    <span className="text-xs font-medium text-[#64748B] dark:text-[#94A3B8]">{label}</span>
    <span className="text-xs font-semibold text-[#0F172A] dark:text-[#E2E8F0] text-right break-all">{children}</span>
  </div>
);

const SettingsPage = ({ darkMode, setDarkMode }) => {
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    getHealth().then((h) => { if (alive) { setHealth(h); setLoading(false); } });
    return () => { alive = false; };
  }, []);

  const connected = health?.database === 'connected';

  return (
    <div className="space-y-6 max-w-3xl">
      <Panel title="API connection" icon={Server}>
        <Row label="API base URL">{API_BASE_URL}</Row>
        <Row label="Configured via">
          <code className="text-[11px]">VITE_API_URL</code> (build-time env)
        </Row>
        <Row label="Service health">
          {loading ? <Skeleton className="h-4 w-16" />
            : <Badge tone={health?.status === 'healthy' ? 'success' : 'danger'}>
                {health?.status === 'healthy' ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                {health?.status || 'unknown'}
              </Badge>}
        </Row>
        <Row label="API version">{loading ? '…' : health?.version || '—'}</Row>
      </Panel>

      <Panel title="Database" icon={Database}>
        <Row label="Status">
          {loading ? <Skeleton className="h-4 w-16" />
            : <Badge tone={connected ? 'success' : 'danger'}>
                {connected ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                {health?.database || 'unknown'}
              </Badge>}
        </Row>
        <Row label="Backend">PostgreSQL (local Docker or Supabase — set by DATABASE_URL on the server)</Row>
        <div className="px-5 py-3 text-[11px] text-[#64748B] dark:text-[#94A3B8] flex items-start gap-2">
          <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          Connection credentials live only on the backend and are never exposed to the browser.
        </div>
      </Panel>

      <Panel title="Appearance" icon={Palette}>
        <div className="flex items-center justify-between px-5 py-4">
          <div>
            <p className="text-sm font-medium text-[#0F172A] dark:text-[#E2E8F0]">Theme</p>
            <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">Switch between light and dark.</p>
          </div>
          <button
            onClick={() => setDarkMode(!darkMode)}
            role="switch"
            aria-checked={darkMode}
            className={`relative w-11 h-6 rounded-full transition-colors cursor-pointer ${darkMode ? 'bg-[#2563EB]' : 'bg-[#CBD5E1]'}`}
          >
            <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${darkMode ? 'translate-x-5' : ''}`} />
          </button>
        </div>
      </Panel>
    </div>
  );
};

export default SettingsPage;
