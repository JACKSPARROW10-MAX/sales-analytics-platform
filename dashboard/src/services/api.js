// src/services/api.js
// API Layer for Sales Analytics Platform
// Connects to FastAPI backend (http://localhost:5000/api/v1) with mock fallback.

import axios from 'axios';
import { KPI_DATA, TIME_SERIES_DATA, ANOMALIES_DATA, RECOMMENDATIONS_DATA, PRODUCTS } from '../data/mockData';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 90000,
});

// ─── Core Endpoints (existing) ────────────────────────────────────────────────

export const getKPIData = async () => {
  try {
    const res = await apiClient.get('/kpis');
    if (res.data && res.data.totalRevenue) return res.data;
  } catch (e) { console.warn('KPI fallback:', e.message); }
  return KPI_DATA;
};

export const getForecast = async (productId = 'all') => {
  try {
    const res = await apiClient.get('/forecast', { params: { product_id: productId } });
    if (Array.isArray(res.data) && res.data.length > 0) return res.data;
  } catch (e) { console.warn('Forecast fallback:', e.message); }
  return TIME_SERIES_DATA[productId] || TIME_SERIES_DATA['all'] || [];
};

export const getAnomalies = async (severityFilter = 'all') => {
  try {
    const res = await apiClient.get('/anomalies', { params: { severity: severityFilter } });
    if (Array.isArray(res.data)) return res.data;
  } catch (e) { console.warn('Anomalies fallback:', e.message); }
  if (severityFilter && severityFilter !== 'all')
    return ANOMALIES_DATA.filter(a => a.severity.toLowerCase() === severityFilter.toLowerCase());
  return ANOMALIES_DATA;
};

export const getRecommendations = async () => {
  try {
    const res = await apiClient.get('/recommendations');
    if (Array.isArray(res.data) && res.data.length > 0) return res.data;
  } catch (e) { console.warn('Recommendations fallback:', e.message); }
  return RECOMMENDATIONS_DATA;
};

export const getProducts = async () => {
  try {
    const res = await apiClient.get('/products');
    if (Array.isArray(res.data) && res.data.length > 0) return res.data;
  } catch (e) { console.warn('Products fallback:', e.message); }
  return PRODUCTS;
};

export const triggerPipelineRun = async () => {
  const res = await apiClient.post('/pipeline/run');
  return res.data;
};

export const uploadSalesCSV = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  const res = await axios.post(`${BASE_URL}/ingest/upload`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 90000,
  });
  return res.data;
};

export const getReportDownloadUrl = () => `${BASE_URL}/reports/download`;

// ─── New Analytics Endpoints ──────────────────────────────────────────────────

export const getAnalyticsSummary = async (metric = 'revenue', period = 'monthly', movingAverage = 0) => {
  try {
    const res = await apiClient.get('/analytics/summary', {
      params: { metric, period, moving_average: movingAverage },
    });
    if (Array.isArray(res.data)) return res.data;
  } catch (e) { console.warn('Analytics summary error:', e.message); }
  return [];
};

export const getProductAnalytics = async () => {
  try {
    const res = await apiClient.get('/products/analytics');
    if (Array.isArray(res.data)) return res.data;
  } catch (e) { console.warn('Product analytics error:', e.message); }
  return [];
};

export const getCustomerAnalytics = async () => {
  try {
    const res = await apiClient.get('/customers/analytics');
    if (Array.isArray(res.data)) return res.data;
  } catch (e) { console.warn('Customer analytics error:', e.message); }
  return [];
};

export const getCategoryAnalytics = async () => {
  try {
    const res = await apiClient.get('/categories/analytics');
    if (Array.isArray(res.data)) return res.data;
  } catch (e) { console.warn('Category analytics error:', e.message); }
  return [];
};

export const getSubcategoryAnalytics = async () => {
  try {
    const res = await apiClient.get('/categories/subcategory');
    if (Array.isArray(res.data)) return res.data;
  } catch (e) { console.warn('Subcategory analytics error:', e.message); }
  return [];
};

export const getRegionAnalytics = async () => {
  try {
    const res = await apiClient.get('/regions/analytics');
    if (Array.isArray(res.data)) return res.data;
  } catch (e) { console.warn('Region analytics error:', e.message); }
  return [];
};

export const getSegmentAnalytics = async () => {
  try {
    const res = await apiClient.get('/regions/segment');
    if (Array.isArray(res.data)) return res.data;
  } catch (e) { console.warn('Segment analytics error:', e.message); }
  return [];
};

export const getPricingAnalytics = async () => {
  try {
    const res = await apiClient.get('/pricing/analytics');
    if (res.data && res.data.summary) return res.data;
  } catch (e) { console.warn('Pricing analytics error:', e.message); }
  return { summary: {}, by_product: [], by_category: [], discount_vs_quantity: [] };
};

export const getVarianceData = async (limit = 30) => {
  try {
    const res = await apiClient.get('/variance', { params: { limit } });
    if (Array.isArray(res.data)) return res.data;
  } catch (e) { console.warn('Variance error:', e.message); }
  return [];
};

export const getDataQuality = async () => {
  try {
    const res = await apiClient.get('/data_quality');
    if (res.data && typeof res.data === 'object') return res.data;
  } catch (e) { console.warn('Data quality error:', e.message); }
  return {};
};

export const getPipelineHealth = async () => {
  try {
    const res = await apiClient.get('/pipeline_health');
    if (res.data && typeof res.data === 'object') return res.data;
  } catch (e) { console.warn('Pipeline health error:', e.message); }
  return {};
};

export const getExplainability = async () => {
  try {
    const res = await apiClient.get('/explainability');
    if (Array.isArray(res.data)) return res.data;
  } catch (e) { console.warn('Explainability error:', e.message); }
  return [];
};

export default {
  getKPIData, getForecast, getAnomalies, getRecommendations, getProducts,
  triggerPipelineRun, uploadSalesCSV, getReportDownloadUrl,
  getAnalyticsSummary, getProductAnalytics, getCustomerAnalytics,
  getCategoryAnalytics, getSubcategoryAnalytics, getRegionAnalytics,
  getSegmentAnalytics, getPricingAnalytics, getVarianceData,
  getDataQuality, getPipelineHealth, getExplainability,
};
