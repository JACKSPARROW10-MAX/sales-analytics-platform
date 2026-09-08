// src/pages/Dashboard.jsx — application shell + routing
import React, { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import ForecastChart from '../components/ForecastChart';
import AnomalyTable from '../components/AnomalyTable';
import RecommendationCard from '../components/RecommendationCard';
import CsvUpload from '../components/CsvUpload';
import OverviewPage from './OverviewPage';
import { Spinner, StateView, ErrorBoundary } from '../components/ui';
import {
  getKPIData, getForecast, getAnomalies, getRecommendations, getHealth,
  triggerPipelineRun,
} from '../services/api';

const SalesAnalyticsPage = lazy(() => import('./SalesAnalyticsPage'));
const ProductAnalysisPage = lazy(() => import('./ProductAnalysisPage'));
const CustomerAnalysisPage = lazy(() => import('./CustomerAnalysisPage'));
const CategoryAnalysisPage = lazy(() => import('./CategoryAnalysisPage'));
const RegionalAnalysisPage = lazy(() => import('./RegionalAnalysisPage'));
const PricingPage = lazy(() => import('./PricingPage'));
const VariancePage = lazy(() => import('./VariancePage'));
const ExplainabilityPage = lazy(() => import('./ExplainabilityPage'));
const DataQualityPage = lazy(() => import('./DataQualityPage'));
const PipelineHealthPage = lazy(() => import('./PipelineHealthPage'));
const ReportsPage = lazy(() => import('./ReportsPage'));
const SettingsPage = lazy(() => import('./SettingsPage'));

const PAGE_META = {
  dashboard: ['Dashboard', 'Executive KPIs, trends, anomalies and AI recommendations from live data'],
  sales: ['Sales Analytics', 'Revenue, volume and transaction trends with moving averages'],
  products: ['Products', 'Revenue, quantity, contribution and AOV by product'],
  customers: ['Customers', 'Customer revenue, segments and purchase history'],
  categories: ['Categories', 'Revenue mix and contribution by category and subcategory'],
  regions: ['Regions', 'Revenue, orders and AOV by region and segment'],
  pricing: ['Pricing & Discounts', 'Discount rates and revenue impact by product and category'],
  forecast: ['Forecast', '30-day revenue forecast — Ridge regression on daily fact_sales'],
  anomalies: ['Anomalies', 'Transactions flagged by Isolation Forest + Z-score'],
  variance: ['Variance', 'Actual vs. expected revenue against a 7-day moving-average baseline'],
  explainability: ['Explainability', 'Feature attribution and per-anomaly root cause'],
  strategy: ['AI Insights', 'AI-generated recommendations grouped by theme, from current metrics'],
  upload: ['Data Upload', 'Upload a sales CSV — validated, staged, transformed, and re-analysed'],
  quality: ['Data Quality', 'Null rates, duplicates, invalid values and an overall score'],
  pipeline: ['Pipeline Health', 'PostgreSQL, ETL and ML status with table row counts'],
  reports: ['Reports', 'Executive PDF report and weekly email automation status'],
  settings: ['Settings', 'API connection, database status and appearance'],
};

const REC_GROUPS = ['Revenue', 'Products', 'Customers', 'Inventory', 'Anomalies', 'Growth Opportunities'];

const groupRecommendation = (rec) => {
  const s = `${rec.category || ''} ${rec.title || ''}`.toLowerCase();
  if (/anomal|risk|fraud|audit/.test(s)) return 'Anomalies';
  if (/invent|supply|stock|fulfil/.test(s)) return 'Inventory';
  if (/customer|churn|segment|retention/.test(s)) return 'Customers';
  if (/product|catalog|sku/.test(s)) return 'Products';
  if (/expansion|growth|region|market|upsell|opportunit/.test(s)) return 'Growth Opportunities';
  return 'Revenue';
};

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    try { return localStorage.getItem('sap-theme') === 'dark'; } catch { return false; }
  });

  const [kpis, setKpis] = useState(null);
  const [forecastData, setForecastData] = useState([]);
  const [anomalies, setAnomalies] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [dbOnline, setDbOnline] = useState(true);

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [toast, setToast] = useState('');

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    document.body.classList.toggle('dark', darkMode);
    try { localStorage.setItem('sap-theme', darkMode ? 'dark' : 'light'); } catch { /* ignore */ }
  }, [darkMode]);

  useEffect(() => {
    const [title] = PAGE_META[activeTab] || ['Dashboard'];
    document.title = `${title} · Sales Analytics Platform`;
  }, [activeTab]);

  const loadCore = useCallback(async () => {
    setLoading(true);
    setLoadError(false);
    try {
      const [k, f, a, r, h] = await Promise.all([
        getKPIData(), getForecast('all'), getAnomalies('all'), getRecommendations(), getHealth(),
      ]);
      setKpis(k);
      setForecastData(Array.isArray(f) ? f : []);
      setAnomalies(Array.isArray(a) ? a : []);
      setRecommendations(Array.isArray(r) ? r : []);
      setDbOnline(h?.database === 'connected');
      if (!k) setLoadError(true);
    } catch {
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCore();
    const onRefresh = () => loadCore();
    window.addEventListener('dashboard-refresh', onRefresh);
    return () => window.removeEventListener('dashboard-refresh', onRefresh);
  }, [loadCore]);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 4500);
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      await triggerPipelineRun();
      window.dispatchEvent(new Event('dashboard-refresh'));
      showToast('Pipeline re-run complete — all views refreshed.');
    } catch {
      showToast('Pipeline sync failed. Check that the API is running.');
    } finally {
      setSyncing(false);
    }
  };

  // After a CSV upload: refetch everything so no stale value remains on screen.
  const handleUploaded = (res) => {
    window.dispatchEvent(new Event('dashboard-refresh'));
    showToast(`${Number(res?.rows_accepted ?? 0).toLocaleString()} rows added — dashboard updated.`);
  };

  const goTo = (id) => { setActiveTab(id); setSidebarOpen(false); };
  const [title, subtitle] = PAGE_META[activeTab] || PAGE_META.dashboard;

  const lazyFallback = <div className="py-20"><Spinner label="Loading view…" /></div>;

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B1120] text-[#0F172A] dark:text-[#E2E8F0]">
        <Header
          onRefresh={handleSync}
          isRefreshing={syncing}
          darkMode={darkMode}
          setDarkMode={setDarkMode}
          onToggleSidebar={() => setSidebarOpen((v) => !v)}
          dbOnline={dbOnline}
        />

        <div className="flex">
          <Sidebar
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            anomalyCount={anomalies.length}
            open={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
          />

          <main className="flex-1 min-w-0 px-4 sm:px-6 lg:px-8 py-6">
            <div className="max-w-[1400px] mx-auto space-y-6">
              <div className="border-b border-[#E2E8F0] dark:border-[#1E293B] pb-4">
                <h2 className="text-xl font-bold tracking-tight text-[#0F172A] dark:text-[#E2E8F0]">{title}</h2>
                <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-1">{subtitle}</p>
              </div>

              {loadError && activeTab === 'dashboard' ? (
                <div className="fintech-card">
                  <StateView
                    status="error"
                    title="Cannot reach the API"
                    message="The dashboard could not load data from the backend. Confirm the API is running and VITE_API_URL is correct."
                    onRetry={loadCore}
                  />
                </div>
              ) : (
                <Suspense fallback={lazyFallback}>
                  {activeTab === 'dashboard' && (
                    <OverviewPage
                      kpis={kpis}
                      anomalies={anomalies}
                      recommendations={recommendations}
                      isLoading={loading}
                      goTo={goTo}
                    />
                  )}

                  {activeTab === 'sales' && <SalesAnalyticsPage />}
                  {activeTab === 'products' && <ProductAnalysisPage />}
                  {activeTab === 'customers' && <CustomerAnalysisPage />}
                  {activeTab === 'categories' && <CategoryAnalysisPage />}
                  {activeTab === 'regions' && <RegionalAnalysisPage />}
                  {activeTab === 'pricing' && <PricingPage />}

                  {activeTab === 'forecast' && (
                    <ForecastChart
                      data={forecastData}
                      meta={kpis?.forecastAccuracy || {}}
                      isLoading={loading}
                    />
                  )}

                  {activeTab === 'anomalies' && (
                    <div className="space-y-5">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        {[
                          ['Flagged', anomalies.length, 'text-[#0F172A] dark:text-[#E2E8F0]'],
                          ['High risk', anomalies.filter((a) => a.severity === 'Critical').length, 'text-[#DC2626]'],
                          ['Warning', anomalies.filter((a) => a.severity === 'Warning').length, 'text-[#B45309]'],
                          ['Info', anomalies.filter((a) => a.severity === 'Info').length, 'text-[#2563EB]'],
                        ].map(([k, v, cls]) => (
                          <div key={k} className="fintech-card p-4">
                            <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">{k}</p>
                            <p className={`text-2xl font-bold mt-1 tabular-nums ${cls}`}>{v}</p>
                          </div>
                        ))}
                      </div>
                      <AnomalyTable anomalies={anomalies} isLoading={loading} />
                    </div>
                  )}

                  {activeTab === 'variance' && <VariancePage />}
                  {activeTab === 'explainability' && <ExplainabilityPage />}

                  {activeTab === 'strategy' && (
                    <div className="space-y-6">
                      {loading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="skeleton h-48" /><div className="skeleton h-48" />
                        </div>
                      ) : recommendations.length === 0 ? (
                        <div className="fintech-card">
                          <StateView
                            status="empty"
                            title="No AI recommendations yet"
                            message="Run the pipeline (Sync). Recommendations are generated from current analytics — with the Groq LLM when GROQ_API_KEY is set, or a deterministic rules engine otherwise."
                          />
                        </div>
                      ) : (
                        <>
                          <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">
                            <span className="font-semibold text-[#2563EB]">AI-generated</span> from current database metrics.
                            Grouped by theme.
                          </p>
                          {REC_GROUPS.map((group) => {
                            const items = recommendations.filter((r) => groupRecommendation(r) === group);
                            if (!items.length) return null;
                            return (
                              <div key={group}>
                                <h3 className="text-sm font-semibold text-[#0F172A] dark:text-[#E2E8F0] mb-3">{group}</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  {items.map((r, i) => <RecommendationCard key={r.id || `${group}-${i}`} recommendation={r} />)}
                                </div>
                              </div>
                            );
                          })}
                        </>
                      )}
                    </div>
                  )}

                  {activeTab === 'upload' && <CsvUpload onUploaded={handleUploaded} />}
                  {activeTab === 'quality' && <DataQualityPage />}
                  {activeTab === 'pipeline' && <PipelineHealthPage />}
                  {activeTab === 'reports' && <ReportsPage />}
                  {activeTab === 'settings' && <SettingsPage darkMode={darkMode} setDarkMode={setDarkMode} />}
                </Suspense>
              )}
            </div>
          </main>
        </div>

        {toast && (
          <div
            role="status"
            className="fixed bottom-5 right-5 z-50 bg-[#0F172A] text-white text-xs font-semibold px-4 py-3 rounded-lg shadow-lg max-w-xs"
          >
            {toast}
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
};

export default Dashboard;
