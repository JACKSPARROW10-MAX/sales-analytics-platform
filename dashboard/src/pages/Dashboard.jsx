// src/pages/Dashboard.jsx
import React, { useState, useEffect, lazy, Suspense } from 'react';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import KPICard from '../components/KPICard';
import CompactChart from '../components/CompactChart';
import AnomalyTable from '../components/AnomalyTable';
import RecommendationCard from '../components/RecommendationCard';
import ForecastChart from '../components/ForecastChart';
import {
  getKPIData, getForecast, getAnomalies, getRecommendations, getProducts,
  triggerPipelineRun, uploadSalesCSV, getReportDownloadUrl,
} from '../services/api';
import {
  IndianRupee, Target, AlertTriangle, Lightbulb, CheckCircle,
  UploadCloud, FileText, Database, RefreshCw, TrendingUp, ShoppingCart,
  Users, BarChart2,
} from 'lucide-react';

// Lazy-load new page components
import SalesAnalyticsPage from './SalesAnalyticsPage';
import ProductAnalysisPage from './ProductAnalysisPage';
import CustomerAnalysisPage from './CustomerAnalysisPage';
import CategoryAnalysisPage from './CategoryAnalysisPage';
import RegionalAnalysisPage from './RegionalAnalysisPage';
import PricingPage from './PricingPage';
import VariancePage from './VariancePage';
import ExplainabilityPage from './ExplainabilityPage';
import DataQualityPage from './DataQualityPage';
import PipelineHealthPage from './PipelineHealthPage';

const PAGE_TITLES = {
  dashboard:     { title: 'Sales Intelligence Overview', sub: 'Real-time KPIs, forecasts, anomalies and AI recommendations' },
  sales:         { title: 'Sales Analytics', sub: 'Revenue trends, transaction volume, moving averages and growth analysis' },
  products:      { title: 'Product Analysis', sub: 'Top products by revenue, quantity, contribution % and average order value' },
  customers:     { title: 'Customer Analysis', sub: 'Customer revenue, segment breakdown, AOV and repeat purchase patterns' },
  categories:    { title: 'Category & Subcategory Analysis', sub: 'Revenue contribution, growth and product mix by category' },
  regions:       { title: 'Regional Analysis', sub: 'Revenue, orders and AOV by region and customer segment' },
  pricing:       { title: 'Pricing & Discount Analysis', sub: 'Discount rates, revenue impact and category-level pricing effectiveness' },
  forecast:      { title: 'Sales Forecast', sub: '30-day AI forecast with confidence intervals, MAE and MAPE' },
  anomalies:     { title: 'Anomaly Detection', sub: 'Transactions flagged as statistically unusual using IsolationForest + Z-score' },
  variance:      { title: 'Sales Variance Analysis', sub: 'Actual vs expected revenue using 7-day moving average baseline per product' },
  explainability:{ title: 'Explainable AI — Feature Attribution', sub: 'Feature importance and per-anomaly root cause explanations from the ML model' },
  strategy:      { title: 'AI Recommendations', sub: 'GenAI-generated business strategy powered by Groq LLM with real metrics' },
  upload:        { title: 'Upload CSV — Data Ingestion', sub: 'Upload sales CSV to ETL pipeline → Staging → Star Schema → ML retraining' },
  quality:       { title: 'Data Quality Dashboard', sub: 'Null rates, duplicates, invalid values and overall data quality score' },
  pipeline:      { title: 'Pipeline Health Monitor', sub: 'PostgreSQL, ETL and ML pipeline status with table row counts' },
  reports:       { title: 'Executive PDF Report', sub: 'Download a formal PDF report with KPIs, forecasts, anomalies and AI recommendations' },
};

const LoadingSpinner = () => (
  <div className="flex items-center justify-center h-64 text-[#8EB69B] text-sm gap-2">
    <RefreshCw className="w-4 h-4 animate-spin" /> Loading…
  </div>
);

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedProduct, setSelectedProduct] = useState('all');
  const [darkMode, setDarkMode] = useState(false);

  // Core data
  const [kpis, setKpis] = useState(null);
  const [forecastData, setForecastData] = useState([]);
  const [anomaliesData, setAnomaliesData] = useState([]);
  const [recommendationsData, setRecommendationsData] = useState([]);
  const [productsList, setProductsList] = useState([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [uploadStatus, setUploadStatus] = useState(null);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    document.body.classList.toggle('dark', darkMode);
  }, [darkMode]);

  const loadDashboardData = async (isManualRefresh = false) => {
    if (isManualRefresh) setIsRefreshing(true);
    else setIsLoading(true);
    try {
      if (isManualRefresh) await triggerPipelineRun().catch(() => {});
      const [kpiRes, forecastRes, anomalyRes, recRes, prodRes] = await Promise.all([
        getKPIData(), getForecast(selectedProduct), getAnomalies('all'),
        getRecommendations(), getProducts(),
      ]);
      setKpis(kpiRes);
      setForecastData(forecastRes);
      setAnomaliesData(anomalyRes);
      setRecommendationsData(recRes);
      setProductsList(prodRes);
      if (isManualRefresh) {
        setToastMessage('Pipeline refreshed successfully!');
        setTimeout(() => setToastMessage(''), 4000);
      }
    } catch (err) {
      console.error('Dashboard load error:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
    const handleRefresh = () => loadDashboardData(false);
    window.addEventListener('dashboard-refresh', handleRefresh);
    return () => window.removeEventListener('dashboard-refresh', handleRefresh);
  }, []);

  useEffect(() => {
    let mounted = true;
    getForecast(selectedProduct).then(d => { if (mounted) setForecastData(d); });
    return () => { mounted = false; };
  }, [selectedProduct]);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadStatus({
      loading: true,
      stage: 'Uploading & Validating',
      message: 'Processing CSV through validation, staging, star schema transform & ML retraining…'
    });
    try {
      const res = await uploadSalesCSV(file);
      setUploadStatus({
        success: true,
        data: res,
        message: `Upload Successful! Processed ${res.rows_received} rows (${res.rows_accepted} inserted, ${res.rows_rejected} rejected).`
      });
      setToastMessage(`CSV upload complete! ${res.rows_accepted} rows added to fact_sales.`);
      setTimeout(() => setToastMessage(''), 5000);
      window.dispatchEvent(new Event('dashboard-refresh'));
      await loadDashboardData(false);
    } catch (err) {
      setUploadStatus({ error: true, message: err.response?.data?.detail || 'Upload failed.' });
    }
  };

  const pageInfo = PAGE_TITLES[activeTab] || PAGE_TITLES.dashboard;

  return (
    <div className={`min-h-screen font-sans transition-colors duration-200 ${darkMode ? 'dark bg-[#051F20] text-[#DAF1DE]' : 'bg-[#EDF8EF] text-[#051F20]'}`}>
      <Header
        onRefresh={() => loadDashboardData(true)}
        isRefreshing={isRefreshing}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
      />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          anomalyCount={anomaliesData.length}
        />

        <main className="flex-1 p-5 md:p-7 overflow-y-auto">
          <div className="max-w-7xl mx-auto space-y-6">

            {/* Toast */}
            {toastMessage && (
              <div className="fixed bottom-6 right-6 z-50 bg-[#235347] text-[#DAF1DE] px-4 py-3 rounded-lg shadow-xl flex items-center gap-2 text-xs font-semibold">
                <CheckCircle className="w-4 h-4" />{toastMessage}
              </div>
            )}

            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#c4dfc8] dark:border-[#235347] pb-4">
              <div>
                <h2 className="text-xl font-bold text-[#051F20] dark:text-[#DAF1DE] tracking-tight">{pageInfo.title}</h2>
                <p className="text-xs text-[#235347] dark:text-[#8EB69B] mt-0.5">{pageInfo.sub}</p>
              </div>
              <div className="text-xs font-mono text-[#235347] dark:text-[#8EB69B] bg-[#DAF1DE] dark:bg-[#0B2B26] px-3 py-1.5 rounded border border-[#c4dfc8] dark:border-[#235347] self-start sm:self-auto">
                Source: <span className="font-semibold text-[#8EB69B] dark:text-[#8EB69B]">PostgreSQL → FastAPI</span>
              </div>
            </div>

            {/* ── OVERVIEW ─────────────────────────────────────── */}
            {activeTab === 'dashboard' && (
              <>
                {/* KPI Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <KPICard title="Total Revenue" value={kpis?.totalRevenue?.formatted || '—'} change={kpis?.totalRevenue?.change} isPositive subtext={kpis?.totalRevenue?.subtext} icon={IndianRupee} accentColor="green" isLoading={isLoading} />
                  <KPICard title="Forecast Accuracy" value={kpis?.forecastAccuracy?.formatted || '—'} change={kpis?.forecastAccuracy?.change} isPositive subtext={kpis?.forecastAccuracy?.mape} icon={Target} accentColor="emerald" isLoading={isLoading} />
                  <KPICard title="Anomalies Detected" value={kpis?.anomaliesDetected?.formatted || '—'} change={kpis?.anomaliesDetected?.change} isPositive={false} subtext={kpis?.anomaliesDetected?.subtext} icon={AlertTriangle} accentColor="rose" isLoading={isLoading} />
                  <KPICard title="AI Recommendations" value={kpis?.activeRecommendations?.formatted || '—'} change={kpis?.activeRecommendations?.change} isPositive subtext={kpis?.activeRecommendations?.subtext} icon={Lightbulb} accentColor="amber" isLoading={isLoading} />
                </div>

                {/* Compact Charts */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <CompactChart data={forecastData} series={[{ key: 'actual', name: 'Actual', color: '#235347', type: 'line' }, { key: 'forecast', name: 'Forecast', color: '#8EB69B', type: 'line' }]} title="Actual vs Forecast" />
                  <CompactChart data={forecastData} series={[{ key: 'lower', name: 'Lower', color: '#8EB69B', type: 'area' }, { key: 'upper', name: 'Upper', color: '#8EB69B', type: 'area' }]} title="Confidence Interval" />
                  <CompactChart data={forecastData} series={[{ key: 'forecast', name: 'Forecast Trend', color: '#235347', type: 'line' }]} title="Forecast Trend" />
                </div>

                {/* Recent Anomalies (top 5) */}
                <section>
                  <h3 className="text-sm font-bold text-[#051F20] dark:text-[#DAF1DE] mb-3 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-500" /> Recent Anomalies
                    <button onClick={() => setActiveTab('anomalies')} className="ml-auto text-[11px] text-[#235347] dark:text-[#8EB69B] hover:underline cursor-pointer">View all →</button>
                  </h3>
                  <AnomalyTable anomalies={anomaliesData.slice(0, 5)} isLoading={isLoading} compact />
                </section>

                {/* Top Recommendations (top 2) */}
                <section>
                  <h3 className="text-sm font-bold text-[#051F20] dark:text-[#DAF1DE] mb-3 flex items-center gap-2">
                    <Lightbulb className="w-4 h-4 text-amber-500" /> AI Recommendations
                    <button onClick={() => setActiveTab('strategy')} className="ml-auto text-[11px] text-[#235347] dark:text-[#8EB69B] hover:underline cursor-pointer">View all →</button>
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {recommendationsData.slice(0, 2).map(rec => (
                      <RecommendationCard key={rec.id || rec.recommendation} recommendation={rec} isLoading={isLoading} />
                    ))}
                  </div>
                </section>
              </>
            )}

            {/* ── SALES ANALYTICS ──────────────────────────────── */}
            {activeTab === 'sales' && <SalesAnalyticsPage />}

            {/* ── PRODUCT ANALYSIS ─────────────────────────────── */}
            {activeTab === 'products' && <ProductAnalysisPage />}

            {/* ── CUSTOMER ANALYSIS ────────────────────────────── */}
            {activeTab === 'customers' && <CustomerAnalysisPage />}

            {/* ── CATEGORY ANALYSIS ────────────────────────────── */}
            {activeTab === 'categories' && <CategoryAnalysisPage />}

            {/* ── REGIONAL ANALYSIS ────────────────────────────── */}
            {activeTab === 'regions' && <RegionalAnalysisPage />}

            {/* ── PRICING & DISCOUNTS ──────────────────────────── */}
            {activeTab === 'pricing' && <PricingPage />}

            {/* ── SALES FORECAST ───────────────────────────────── */}
            {activeTab === 'forecast' && (
              <div className="space-y-5">
                <div className="fintech-card p-4">
                  <label className="text-xs font-semibold text-[#235347] dark:text-[#8EB69B] mr-3">Filter by Product:</label>
                  <select value={selectedProduct} onChange={e => setSelectedProduct(e.target.value)}
                    className="bg-white dark:bg-[#0B2B26] border border-[#c4dfc8] dark:border-[#235347] rounded-lg px-3 py-1.5 text-xs">
                    {productsList.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div className="fintech-card p-5">
                  <ForecastChart data={forecastData} isLoading={isLoading} />
                </div>
                {/* Forecast metrics */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {[
                    ['Model', 'Linear Regression'],
                    ['Horizon', '30 days'],
                    ['MAE', kpis?.forecastAccuracy?.mape ? kpis.forecastAccuracy.mape.split('%')[0] + '%' : '—'],
                    ['Accuracy', kpis?.forecastAccuracy?.formatted || '—'],
                  ].map(([k, v]) => (
                    <div key={k} className="fintech-card p-4">
                      <p className="text-xs text-[#235347] dark:text-[#8EB69B]">{k}</p>
                      <p className="text-sm font-bold text-[#051F20] dark:text-[#DAF1DE] mt-1">{v}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── ANOMALY DETECTION ────────────────────────────── */}
            {activeTab === 'anomalies' && (
              <div className="space-y-5">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {[
                    ['Total Anomalies', anomaliesData.length, 'text-[#051F20] dark:text-[#DAF1DE]'],
                    ['Critical', anomaliesData.filter(a => a.severity === 'Critical').length, 'text-rose-600'],
                    ['Warning', anomaliesData.filter(a => a.severity === 'Warning').length, 'text-amber-600'],
                    ['Info', anomaliesData.filter(a => a.severity === 'Info').length, 'text-[#235347]'],
                  ].map(([k, v, cls]) => (
                    <div key={k} className="fintech-card p-4">
                      <p className="text-xs text-[#235347] dark:text-[#8EB69B]">{k}</p>
                      <p className={`text-2xl font-bold mt-1 ${cls}`}>{v}</p>
                    </div>
                  ))}
                </div>
                <AnomalyTable anomalies={anomaliesData} isLoading={isLoading} />
              </div>
            )}

            {/* ── SALES VARIANCE ───────────────────────────────── */}
            {activeTab === 'variance' && <VariancePage />}

            {/* ── EXPLAINABLE AI ───────────────────────────────── */}
            {activeTab === 'explainability' && <ExplainabilityPage />}

            {/* ── AI STRATEGY / RECOMMENDATIONS ───────────────── */}
            {activeTab === 'strategy' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {recommendationsData.map((rec, i) => (
                    <RecommendationCard key={rec.id || i} recommendation={rec} isLoading={isLoading} />
                  ))}
                </div>
                {!isLoading && !recommendationsData.length && (
                  <div className="fintech-card p-8 text-center text-[#8EB69B] text-sm">
                    No recommendations yet. Ensure the Groq API key is set and run the ML pipeline.
                  </div>
                )}
              </div>
            )}

            {/* ── CSV UPLOAD ───────────────────────────────────── */}
            {activeTab === 'upload' && (
              <div className="space-y-6">
                <div className="fintech-card p-6 space-y-4">
                  <h3 className="text-base font-bold text-[#051F20] dark:text-[#DAF1DE] flex items-center gap-2">
                    <UploadCloud className="w-5 h-5 text-[#235347]" /> Upload Sales CSV to ETL Pipeline
                  </h3>
                  <p className="text-xs text-[#235347] dark:text-[#8EB69B]">
                    Upload a CSV file of sales transactions. It will be parsed, validated via Pandera schemas,
                    loaded into staging tables, transformed into the PostgreSQL Star Schema, and trigger ML retraining.
                  </p>
                  <div className="border-2 border-dashed border-[#235347] dark:border-[#235347] rounded-xl p-8 text-center space-y-3 bg-[#EDF8EF] dark:bg-[#0B2B26]">
                    <UploadCloud className="w-10 h-10 text-[#8EB69B] mx-auto" />
                    <div className="text-xs text-[#235347] dark:text-[#DAF1DE]">
                      <label htmlFor="csv-upload" className="font-bold text-[#235347] dark:text-[#8EB69B] hover:underline cursor-pointer">Click to choose CSV</label>
                      <span> or drag and drop</span>
                    </div>
                    <p className="text-[11px] text-[#8EB69B]">Columns: transaction_id, sale_date, product_id, customer_id, quantity, unit_price, discount, total_amount</p>
                    <input id="csv-upload" type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />
                  </div>
                  {uploadStatus && (
                    <div className="space-y-4 pt-2">
                      <div className={`p-4 rounded-xl text-xs font-semibold space-y-2 border ${uploadStatus.loading ? 'bg-[#DAF1DE]/70 border-[#8EB69B] text-[#235347] dark:bg-[#163832] dark:border-[#235347] dark:text-[#8EB69B]' : uploadStatus.success ? 'bg-[#DAF1DE]/70 border-[#8EB69B] text-[#235347] dark:bg-[#163832] dark:border-[#235347] dark:text-[#8EB69B]' : 'bg-rose-50/70 border-rose-200 text-rose-800 dark:bg-rose-950/40 dark:border-rose-900 dark:text-rose-300'}`}>
                        <div className="flex items-center gap-2 text-sm font-bold">
                          {uploadStatus.loading && <RefreshCw className="w-4 h-4 animate-spin text-[#235347]" />}
                          {uploadStatus.success && <CheckCircle className="w-4 h-4 text-[#8EB69B]" />}
                          <span>{uploadStatus.success ? 'CSV Upload & Data Pipeline Completed' : uploadStatus.loading ? 'Executing Data Pipeline…' : 'Upload Error'}</span>
                        </div>
                        <p>{uploadStatus.message}</p>
                      </div>

                      {/* Stage Progress Stepper */}
                      <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 text-center text-[11px] font-medium">
                        {[
                          ['Upload', uploadStatus.success || uploadStatus.loading],
                          ['Validation', uploadStatus.success || uploadStatus.loading],
                          ['Staging', uploadStatus.success || uploadStatus.loading],
                          ['Transform', uploadStatus.success],
                          ['Fact Star Schema', uploadStatus.success],
                          ['Dashboard Sync', uploadStatus.success],
                        ].map(([stageName, isDone], idx) => (
                          <div key={stageName} className={`p-2 rounded-lg border transition-all ${isDone ? 'bg-[#DAF1DE] dark:bg-[#163832] border-[#8EB69B] text-[#235347] dark:text-[#8EB69B] font-bold' : 'bg-[#EDF8EF] dark:bg-[#0B2B26] border-[#c4dfc8] dark:border-[#235347] text-[#8EB69B]'}`}>
                            <span>{isDone ? '✓' : `${idx + 1}.`} {stageName}</span>
                          </div>
                        ))}
                      </div>

                      {/* Database Count Breakdown */}
                      {uploadStatus.data && (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#EDF8EF] dark:bg-[#0B2B26] p-4 rounded-xl border border-[#c4dfc8] dark:border-[#235347] text-xs">
                          <div>
                            <span className="text-[#235347] dark:text-[#8EB69B] block">Rows Received</span>
                            <span className="text-sm font-bold text-[#051F20] dark:text-[#DAF1DE]">{uploadStatus.data.rows_received?.toLocaleString()}</span>
                          </div>
                          <div>
                            <span className="text-[#235347] dark:text-[#8EB69B] block">Rows Inserted</span>
                            <span className="text-sm font-bold text-[#8EB69B]">{uploadStatus.data.rows_accepted?.toLocaleString()}</span>
                          </div>
                          <div>
                            <span className="text-[#235347] dark:text-[#8EB69B] block">Database Before</span>
                            <span className="text-sm font-bold text-[#051F20] dark:text-[#DAF1DE]">{uploadStatus.data.database_total_before?.toLocaleString()} sales</span>
                          </div>
                          <div>
                            <span className="text-[#235347] dark:text-[#8EB69B] block">Database Total</span>
                            <span className="text-sm font-bold text-[#235347]">{uploadStatus.data.database_total_after?.toLocaleString()} sales</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── DATA QUALITY ─────────────────────────────────── */}
            {activeTab === 'quality' && <DataQualityPage />}

            {/* ── PIPELINE HEALTH ──────────────────────────────── */}
            {activeTab === 'pipeline' && <PipelineHealthPage />}

            {/* ── EXECUTIVE REPORTS ────────────────────────────── */}
            {activeTab === 'reports' && (
              <div className="fintech-card p-6 space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#DAF1DE] dark:border-[#235347] pb-4">
                  <div>
                    <h3 className="text-base font-bold text-[#051F20] dark:text-[#DAF1DE] flex items-center gap-2">
                      <FileText className="w-5 h-5 text-[#235347]" /> Automated Executive Analytics Report
                    </h3>
                    <p className="text-xs text-[#235347] dark:text-[#8EB69B] mt-1">
                      Generates a PDF with KPIs, sales trends, anomaly audit, variance analysis and AI recommendations — all from live database data.
                    </p>
                  </div>
                  <a href={getReportDownloadUrl()} target="_blank" rel="noreferrer"
                    className="flex items-center gap-2 bg-[#235347] hover:bg-[#163832] text-[#DAF1DE] px-4 py-2 rounded-lg text-xs font-semibold shadow-sm transition-colors cursor-pointer self-start sm:self-auto">
                    <FileText className="w-4 h-4" /> Download PDF Report
                  </a>
                </div>
                <div className="bg-[#EDF8EF] dark:bg-[#0B2B26] p-5 rounded-lg border border-[#c4dfc8] dark:border-[#235347] space-y-2 text-xs">
                  <h4 className="font-bold text-[#051F20] dark:text-[#DAF1DE] text-sm">Report Contents:</h4>
                  {[
                    'Executive KPI Summary (Total Revenue, Forecast Accuracy, Anomaly Count)',
                    'Statistical Anomaly & Variance Audit Table',
                    'Product & Category Performance Summary',
                    'Prescriptive Strategy Roadmap from AI Recommendations',
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-2 text-[#235347] dark:text-[#8EB69B]">
                      <CheckCircle className="w-4 h-4 text-[#8EB69B] shrink-0" />
                      <span><strong>{i+1}.</strong> {item}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
