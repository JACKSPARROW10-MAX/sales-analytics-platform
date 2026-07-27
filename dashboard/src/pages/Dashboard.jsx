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
  getProducts 
} from '../services/api';
import { DollarSign, Target, AlertTriangle, Lightbulb, RefreshCw, CheckCircle } from 'lucide-react';

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [dateRange, setDateRange] = useState('6m');
  const [selectedProduct, setSelectedProduct] = useState('all');
  
  // Data state
  const [kpis, setKpis] = useState(null);
  const [forecastData, setForecastData] = useState([]);
  const [anomaliesData, setAnomaliesData] = useState([]);
  const [recommendationsData, setRecommendationsData] = useState([]);
  const [productsList, setProductsList] = useState([]);
  
  // Loading & refresh state
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Initial load
  const loadDashboardData = async (isManualRefresh = false) => {
    if (isManualRefresh) setIsRefreshing(true);
    else setIsLoading(true);

    try {
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
        setToastMessage('Pipeline state re-synced successfully!');
        setTimeout(() => setToastMessage(''), 3000);
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

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      
      {/* Top Navigation Header */}
      <Header 
        dateRange={dateRange}
        setDateRange={setDateRange}
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
      />

      {/* Main Body Layout with Sidebar */}
      <div className="flex flex-1 overflow-hidden">
        <Sidebar 
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          anomalyCount={anomaliesData.length}
          recommendationCount={recommendationsData.length}
        />

        <main className="flex-1 p-6 md:p-8 overflow-y-auto max-w-7xl mx-auto space-y-8">
          
          {/* Toast Notification */}
          {toastMessage && (
            <div className="fixed bottom-6 right-6 z-50 bg-emerald-600 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 text-xs font-semibold animate-bounce">
              <CheckCircle className="w-4 h-4" />
              <span>{toastMessage}</span>
            </div>
          )}

          {/* Section Title */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-2xl font-extrabold text-white tracking-tight">
                {activeTab === 'dashboard' ? 'Sales Executive Overview' : `${activeTab.toUpperCase()} View`}
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Real-time ML forecasting, automated variance detection, and GenAI prescriptive recommendations.
              </p>
            </div>
            <div className="text-xs font-mono text-slate-500 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800 self-start sm:self-auto">
              Pipeline Refreshed: <span className="text-slate-300">Just now</span>
            </div>
          </div>

          {/* 1. TOP ROW: 4 KPI CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <KPICard
              title="Total Revenue"
              value={kpis?.totalRevenue?.formatted || '$1,248,500'}
              change={kpis?.totalRevenue?.change || '+14.2%'}
              isPositive={true}
              subtext={kpis?.totalRevenue?.subtext || 'vs. previous period'}
              icon={DollarSign}
              accentColor="emerald"
              isLoading={isLoading}
            />

            <KPICard
              title="Forecast Accuracy"
              value={kpis?.forecastAccuracy?.formatted || '96.4%'}
              change={kpis?.forecastAccuracy?.change || '+1.8%'}
              isPositive={true}
              subtext={kpis?.forecastAccuracy?.mape || '3.6% MAPE'}
              icon={Target}
              accentColor="indigo"
              isLoading={isLoading}
            />

            <KPICard
              title="Anomalies Detected"
              value={kpis?.anomaliesDetected?.formatted || '6 Detected'}
              change={kpis?.anomaliesDetected?.change || '2 Critical'}
              isPositive={false}
              subtext={kpis?.anomaliesDetected?.subtext || '3 resolved this week'}
              icon={AlertTriangle}
              accentColor="rose"
              isLoading={isLoading}
            />

            <KPICard
              title="Active Recommendations"
              value={kpis?.activeRecommendations?.formatted || '5 Actionable'}
              change={kpis?.activeRecommendations?.change || '+$84.5K'}
              isPositive={true}
              subtext={kpis?.activeRecommendations?.subtext || 'Est. revenue uplift'}
              icon={Lightbulb}
              accentColor="amber"
              isLoading={isLoading}
            />
          </div>

          {/* 2. MAIN FORECAST CHART */}
          <section>
            <ForecastChart 
              data={forecastData}
              products={productsList}
              selectedProduct={selectedProduct}
              onSelectProduct={setSelectedProduct}
              isLoading={isLoading}
            />
          </section>

          {/* 3. RECOMMENDATIONS PANEL GRID */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-amber-400" />
                <h3 className="text-lg font-bold text-white tracking-tight">
                  GenAI Prescriptive Recommendations
                </h3>
              </div>
              <span className="text-xs text-slate-400 font-mono">
                Powered by Llama-3 / Claude Analysis Engine
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {recommendationsData.map((rec) => (
                <RecommendationCard 
                  key={rec.id} 
                  recommendation={rec}
                  isLoading={isLoading}
                />
              ))}
            </div>
          </section>

          {/* 4. ANOMALIES TABLE */}
          <section>
            <AnomalyTable 
              anomalies={anomaliesData}
              isLoading={isLoading}
            />
          </section>

        </main>
      </div>

    </div>
  );
};

export default Dashboard;
