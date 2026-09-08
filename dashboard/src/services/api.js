// src/services/api.js
// Live API Service for Sales Analytics Platform
// Connects strictly to FastAPI backend querying live PostgreSQL star schema
import axios from 'axios';

const rawApiUrl = (import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000').replace(/\/+$/, '');
const BASE_URL = rawApiUrl.endsWith('/api/v1') ? rawApiUrl : `${rawApiUrl}/api/v1`;

const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 90000,
});

export const API_BASE_URL = BASE_URL;

// Root origin (without /api/v1) for /health.
const ORIGIN = BASE_URL.replace(/\/api\/v1$/, '');

export const getHealth = async () => {
  try {
    const res = await axios.get(`${ORIGIN}/health`, { timeout: 8000 });
    return res.data || null;
  } catch {
    return { status: 'degraded', database: 'disconnected' };
  }
};

export const getReportSummary = async () => {
  try {
    const res = await apiClient.get('/reports/summary');
    return res.data || null;
  } catch (e) {
    console.error('Report summary error:', e.message);
    return null;
  }
};

// ─── Core Dynamic Endpoints ──────────────────────────────────────────────────

export const getKPIData = async () => {
  // Returns the raw KPI object from the backend. Every field is computed from
  // fact_sales / the ML pipeline server-side; the UI must not substitute
  // placeholder numbers when a field is missing.
  try {
    const res = await apiClient.get('/kpis');
    return res.data || null;
  } catch (e) {
    console.error('Failed to fetch live KPIs from backend:', e.message);
    return null;
  }
};

export const getForecast = async (productId = 'all') => {
  try {
    const res = await apiClient.get('/forecast', { params: { product_id: productId } });
    if (Array.isArray(res.data)) return res.data;
  } catch (e) {
    console.error('Failed to fetch live forecast:', e.message);
  }
  return [];
};

export const getAnomalies = async (severityFilter = 'all') => {
  try {
    const res = await apiClient.get('/anomalies', { params: { severity: severityFilter } });
    if (Array.isArray(res.data)) return res.data;
  } catch (e) {
    console.error('Failed to fetch live anomalies:', e.message);
  }
  return [];
};

export const getRecommendations = async () => {
  try {
    const res = await apiClient.get('/recommendations');
    if (Array.isArray(res.data)) return res.data;
  } catch (e) {
    console.error('Failed to fetch live recommendations:', e.message);
  }
  return [];
};

export const getProducts = async () => {
  try {
    const res = await apiClient.get('/products');
    if (Array.isArray(res.data)) return res.data;
  } catch (e) {
    console.error('Failed to fetch products list:', e.message);
  }
  return ['all'];
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
    timeout: 120000,
  });
  return res.data;
};

export const getReportDownloadUrl = () => `${BASE_URL}/reports/download`;

// ─── Analytics Endpoints (Live PostgreSQL Star Schema) ───────────────────────

export const getAnalyticsSummary = async (metric = 'revenue', period = 'monthly', movingAverage = 0) => {
  try {
    const res = await apiClient.get('/analytics/sales', {
      params: { metric, period, moving_average: movingAverage },
    });
    if (Array.isArray(res.data)) return res.data;
  } catch (e) {
    console.error('Analytics summary error:', e.message);
  }
  return [];
};

export const getProductAnalytics = async () => {
  try {
    const res = await apiClient.get('/analytics/products');
    if (Array.isArray(res.data)) return res.data;
  } catch (e) {
    console.error('Product analytics error:', e.message);
  }
  return [];
};

export const getCustomerAnalytics = async () => {
  try {
    const res = await apiClient.get('/analytics/customers');
    if (Array.isArray(res.data)) return res.data;
  } catch (e) {
    console.error('Customer analytics error:', e.message);
  }
  return [];
};

export const getCategoryAnalytics = async () => {
  try {
    const res = await apiClient.get('/analytics/categories');
    if (Array.isArray(res.data)) return res.data;
  } catch (e) {
    console.error('Category analytics error:', e.message);
  }
  return [];
};

export const getSubcategoryAnalytics = async () => {
  try {
    const res = await apiClient.get('/categories/subcategory');
    if (Array.isArray(res.data)) return res.data;
  } catch (e) {
    console.error('Subcategory analytics error:', e.message);
  }
  return [];
};

export const getRegionAnalytics = async () => {
  try {
    const res = await apiClient.get('/analytics/regions');
    if (Array.isArray(res.data)) return res.data;
  } catch (e) {
    console.error('Region analytics error:', e.message);
  }
  return [];
};

export const getSegmentAnalytics = async () => {
  try {
    const res = await apiClient.get('/regions/segment');
    if (Array.isArray(res.data)) return res.data;
  } catch (e) {
    console.error('Segment analytics error:', e.message);
  }
  return [];
};

export const getPricingAnalytics = async () => {
  try {
    const res = await apiClient.get('/analytics/pricing');
    if (res.data && res.data.summary) return res.data;
  } catch (e) {
    console.error('Pricing analytics error:', e.message);
  }
  return { summary: {}, by_product: [], by_category: [], discount_vs_quantity: [] };
};

export const getVarianceData = async (limit = 30) => {
  try {
    const res = await apiClient.get('/variance', { params: { limit } });
    if (Array.isArray(res.data)) return res.data;
  } catch (e) {
    console.error('Variance error:', e.message);
  }
  return [];
};

export const getDataQuality = async () => {
  try {
    const res = await apiClient.get('/data_quality');
    if (res.data && typeof res.data === 'object') return res.data;
  } catch (e) {
    console.error('Data quality error:', e.message);
  }
  return {};
};

export const getPipelineHealth = async () => {
  try {
    const res = await apiClient.get('/pipeline_health');
    if (res.data && typeof res.data === 'object') return res.data;
  } catch (e) {
    console.error('Pipeline health error:', e.message);
  }
  return {};
};

export const getExplainability = async () => {
  try {
    const res = await apiClient.get('/explainability');
    if (Array.isArray(res.data)) return res.data;
  } catch (e) {
    console.error('Explainability error:', e.message);
  }
  return [];
};

export default {
  getKPIData, getForecast, getAnomalies, getRecommendations, getProducts,
  triggerPipelineRun, uploadSalesCSV, getReportDownloadUrl, getReportSummary,
  getHealth, getAnalyticsSummary, getProductAnalytics, getCustomerAnalytics,
  getCategoryAnalytics, getSubcategoryAnalytics, getRegionAnalytics,
  getSegmentAnalytics, getPricingAnalytics, getVarianceData,
  getDataQuality, getPipelineHealth, getExplainability,
};
