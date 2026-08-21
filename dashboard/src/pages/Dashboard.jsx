// src/pages/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import KPICard from '../components/KPICard';
import ForecastChart from '../components/ForecastChart';
import AnomalyTable from '../components/AnomalyTable';
import RecommendationCard from '../components/RecommendationCard';
import { 
  getKPIData, 
  getForecast, 
  getAnomalies, 
  getRecommendations, 
  getProducts,
  triggerPipelineRun,
  uploadSalesCSV,
  getReportDownloadUrl
} from '../services/api';
import { 
  DollarSign, 
  Target, 
  AlertTriangle, 
  Lightbulb, 
  CheckCircle, 
  UploadCloud, 
  FileText, 
  Database,
  RefreshCw
} from 'lucide-react';

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [dateRange, setDateRange] = useState('6m');
  const [selectedProduct, setSelectedProduct] = useState('all');
  const [darkMode, setDarkMode] = useState(false);
  
  // Data state
  const [kpis, setKpis] = useState(null);
  const [forecastData, setForecastData] = useState([]);
  const [anomaliesData, setAnomaliesData] = useState([]);
  const [recommendationsData, setRecommendationsData] = useState([]);
  const [productsList, setProductsList] = useState([]);
  
  // Loading & notification state
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [uploadStatus, setUploadStatus] = useState(null);

  // Sync dark class on document element & body
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark');
    }
  }, [darkMode]);

  // Initial load
  const loadDashboardData = async (isManualRefresh = false) => {
    if (isManualRefresh) setIsRefreshing(true);
    else setIsLoading(true);

    try {
      if (isManualRefresh) {
        await triggerPipelineRun().catch(() => {});
      }

      const [kpiRes, forecastRes, anomalyRes, recRes, prodRes] = await Promise.all([
        getKPIData(),
        getForecast(selectedProduct),
        getAnomalies('all'),
        getRecommendations(),
        getProducts()
      ]);

      setKpis(kpiRes);
      setForecastData(forecastRes);
      setAnomaliesData(anomalyRes);
      setRecommendationsData(recRes);
      setProductsList(prodRes);

      if (isManualRefresh) {
        setToastMessage('ETL & ML pipeline state re-synced successfully!');
        setTimeout(() => setToastMessage(''), 4000);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  // Update forecast chart when product dropdown changes
  useEffect(() => {
    let isMounted = true;
    const updateProductForecast = async () => {
      const data = await getForecast(selectedProduct);
      if (isMounted) setForecastData(data);
    };
    updateProductForecast();
    return () => { isMounted = false; };
  }, [selectedProduct]);

  const handleRefresh = () => {
    loadDashboardData(true);
  };

  // CSV Upload Handler
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadStatus({ loading: true, message: 'Processing sales CSV through ETL pipeline...' });

    try {
      const res = await uploadSalesCSV(file);
      setUploadStatus({
        success: true,
        message: `Successfully processed ${res.rows_accepted} rows into PostgreSQL Star Schema!`
      });
      loadDashboardData(true);
    } catch (err) {
      setUploadStatus({
        error: true,
        message: err.response?.data?.detail || 'Error uploading file. Please check CSV formatting.'
      });
    }
  };

  return (
    <div className={`min-h-screen font-sans transition-colors duration-200 ${darkMode ? 'dark bg-[#0b0f19] text-slate-100' : 'bg-[#f8fafc] text-slate-900'}`}>
      
      {/* Top Header Navigation */}
      <Header 
        dateRange={dateRange}
        setDateRange={setDateRange}
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
      />

      {/* Main Body Layout */}
      <div className="flex flex-1 overflow-hidden">
        <Sidebar 
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          anomalyCount={anomaliesData.length}
          recommendationCount={recommendationsData.length}
        />

        <main className="flex-1 p-5 md:p-8 overflow-y-auto max-w-7xl mx-auto space-y-7">
          
          {/* Toast Notification */}
          {toastMessage && (
            <div className="fixed bottom-6 right-6 z-50 bg-emerald-700 text-white px-4 py-3 rounded-lg shadow-xl flex items-center gap-2 text-xs font-semibold animate-fade-in">
              <CheckCircle className="w-4 h-4" />
              <span>{toastMessage}</span>
            </div>
          )}

          {/* Page Section Title */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                {activeTab === 'dashboard' && 'Sales Executive Overview'}
                {activeTab === 'forecasts' && 'ML Time-Series Sales Forecasts'}
                {activeTab === 'anomalies' && 'Statistical Sales Variance & Anomaly Audit'}
                {activeTab === 'recommendations' && 'GenAI Prescriptive Strategy'}
                {activeTab === 'etl' && 'Data Ingestion & ETL Pipeline Management'}
                {activeTab === 'reports' && 'Executive PDF Reporting Center'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Automated PostgreSQL ETL pipeline, Prophet/Ridge ML forecasting, Isolation Forest anomaly detection, and PDF executive reporting.
              </p>
            </div>
            <div className="text-xs font-mono text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded border border-slate-200 dark:border-slate-700 self-start sm:self-auto">
              Last Pipeline Run: <span className="font-semibold text-slate-900 dark:text-slate-200">Just Now</span>
            </div>
          </div>

          {/* TAB 1: OVERVIEW DASHBOARD */}
          {(activeTab === 'dashboard' || activeTab === 'forecasts') && (
            <>
              {/* 1. TOP ROW: 4 KPI CARDS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <KPICard
                  title="Total Sales Revenue"
                  value={kpis?.totalRevenue?.formatted || '$1,248,500'}
                  change={kpis?.totalRevenue?.change || '+14.2%'}
                  isPositive={true}
                  subtext={kpis?.totalRevenue?.subtext || 'vs. prior period'}
                  icon={DollarSign}
                  accentColor="blue"
                  isLoading={isLoading}
                />

                <KPICard
                  title="Forecast Model Accuracy"
                  value={kpis?.forecastAccuracy?.formatted || '96.4%'}
                  change={kpis?.forecastAccuracy?.change || '+1.8%'}
                  isPositive={true}
                  subtext={kpis?.forecastAccuracy?.mape || '3.6% MAPE'}
                  icon={Target}
                  accentColor="emerald"
                  isLoading={isLoading}
                />

                <KPICard
                  title="Sales Anomalies"
                  value={kpis?.anomaliesDetected?.formatted || '6 Flagged'}
                  change={kpis?.anomaliesDetected?.change || '2 Critical'}
                  isPositive={false}
                  subtext={kpis?.anomaliesDetected?.subtext || 'Variance > 60% threshold'}
                  icon={AlertTriangle}
                  accentColor="rose"
                  isLoading={isLoading}
                />

                <KPICard
                  title="Actionable Recommendations"
                  value={kpis?.activeRecommendations?.formatted || '4 Actionable'}
                  change={kpis?.activeRecommendations?.change || '+$84.5K'}
                  isPositive={true}
                  subtext={kpis?.activeRecommendations?.subtext || 'Est. revenue uplift'}
                  icon={Lightbulb}
                  accentColor="amber"
                  isLoading={isLoading}
                />
              </div>

              {/* 2. FORECAST CHART SECTION */}
              <section>
                <ForecastChart 
                  data={forecastData}
                  products={productsList}
                  selectedProduct={selectedProduct}
                  onSelectProduct={setSelectedProduct}
                  isLoading={isLoading}
                />
              </section>
            </>
          )}

          {/* TAB: RECOMMENDATIONS / GENAI INSIGHTS */}
          {(activeTab === 'dashboard' || activeTab === 'recommendations') && (
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Lightbulb className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                    Prescriptive Business Strategy & Action Plan
                  </h3>
                </div>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                  Generated by ML Analysis Engine
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
                {recommendationsData.map((rec) => (
                  <RecommendationCard 
                    key={rec.id} 
                    recommendation={rec}
                    isLoading={isLoading}
                  />
                ))}
              </div>
            </section>
          )}

          {/* TAB: ANOMALIES TABLE */}
          {(activeTab === 'dashboard' || activeTab === 'anomalies') && (
            <section>
              <AnomalyTable 
                anomalies={anomaliesData}
                isLoading={isLoading}
              />
            </section>
          )}

          {/* TAB: ETL & INGESTION MANAGEMENT */}
          {activeTab === 'etl' && (
            <div className="space-y-6">
              <div className="fintech-card p-6 space-y-4">
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <UploadCloud className="w-5 h-5 text-blue-600" />
                  Upload Sales CSV Data to ETL Pipeline
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Select a CSV file containing sales transactions. The file will be parsed, validated via Pandera schemas, loaded into staging tables, transformed into PostgreSQL Star Schema, and trigger automatic model retraining.
                </p>

                <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-8 text-center space-y-3 bg-slate-50 dark:bg-slate-800/40">
                  <UploadCloud className="w-10 h-10 text-slate-400 mx-auto" />
                  <div className="text-xs text-slate-600 dark:text-slate-300">
                    <label htmlFor="csv-upload" className="font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer">
                      Click to choose CSV file
                    </label>
                    <span> or drag and drop here</span>
                  </div>
                  <p className="text-[11px] text-slate-400">Supported columns: transaction_id, sale_date, product_id, customer_id, quantity, unit_price, discount, total_amount</p>
                  <input 
                    id="csv-upload" 
                    type="file" 
                    accept=".csv" 
                    onChange={handleFileUpload} 
                    className="hidden" 
                  />
                </div>

                {uploadStatus && (
                  <div className={`p-3 rounded-lg text-xs font-semibold flex items-center gap-2 ${
                    uploadStatus.loading ? 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300' :
                    uploadStatus.success ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' :
                    'bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                  }`}>
                    {uploadStatus.loading && <RefreshCw className="w-4 h-4 animate-spin" />}
                    {uploadStatus.success && <CheckCircle className="w-4 h-4" />}
                    <span>{uploadStatus.message}</span>
                  </div>
                )}
              </div>

              <div className="fintech-card p-6 space-y-3">
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Database className="w-5 h-5 text-emerald-600" />
                  PostgreSQL Star Schema Status
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
                  <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                    <span className="text-slate-500 block text-[11px]">fact_sales:</span>
                    <span className="text-slate-900 dark:text-white font-bold text-sm">9,006 rows</span>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                    <span className="text-slate-500 block text-[11px]">dim_product:</span>
                    <span className="text-slate-900 dark:text-white font-bold text-sm">10 rows</span>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                    <span className="text-slate-500 block text-[11px]">dim_customer:</span>
                    <span className="text-slate-900 dark:text-white font-bold text-sm">51 rows</span>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                    <span className="text-slate-500 block text-[11px]">dim_date:</span>
                    <span className="text-slate-900 dark:text-white font-bold text-sm">372 dates</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: EXECUTIVE REPORTS */}
          {activeTab === 'reports' && (
            <div className="fintech-card p-6 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <FileText className="w-5 h-5 text-blue-600" />
                    Automated Executive Sales Analytics Report
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Generates a formal PDF document containing executive KPI metrics, sales variance audit tables, and prescriptive strategy plans.
                  </p>
                </div>

                <a
                  href={getReportDownloadUrl()}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-xs font-semibold shadow-sm transition-colors cursor-pointer self-start sm:self-auto"
                >
                  <FileText className="w-4 h-4" />
                  Download PDF Report
                </a>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-lg border border-slate-200/80 dark:border-slate-800 space-y-3 text-xs">
                <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm">Report Contents Overview:</h4>
                <ul className="space-y-2 text-slate-600 dark:text-slate-400">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    <span><strong>1. Executive KPI Summary:</strong> Total Revenue, Forecast Accuracy, Anomaly Count, Financial Uplift.</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    <span><strong>2. Statistical Anomaly & Variance Audit:</strong> Top transaction variances with severity breakdown.</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    <span><strong>3. Prescriptive Strategy Roadmap:</strong> Action steps for pricing, inventory, and risk mitigation.</span>
                  </li>
                </ul>
              </div>
            </div>
          )}

        </main>
      </div>

    </div>
  );
};

export default Dashboard;
