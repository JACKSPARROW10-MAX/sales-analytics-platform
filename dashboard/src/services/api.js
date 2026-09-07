// src/services/api.js
// API Layer for Sales Analytics Platform
// Connects directly to FastAPI backend (http://localhost:8000/api/v1) with smooth fallback.

import axios from 'axios';
import { KPI_DATA, TIME_SERIES_DATA, ANOMALIES_DATA, RECOMMENDATIONS_DATA, PRODUCTS } from '../data/mockData';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 90000
});

/**
 * Fetch top-level platform KPIs
 */
export const getKPIData = async () => {
  try {
    const response = await apiClient.get('/kpis');
    if (response.data && response.data.totalRevenue) {
      return response.data;
    }
  } catch (error) {
    console.warn('FastAPI backend fallback to mock KPI data:', error.message);
  }
  return KPI_DATA;
};

/**
 * Fetch historical sales and forecasted data for a given product
 */
export const getForecast = async (productId = 'all') => {
  try {
    const response = await apiClient.get('/forecast', { params: { product_id: productId } });
    if (Array.isArray(response.data) && response.data.length > 0) {
      return response.data;
    }
  } catch (error) {
    console.warn('FastAPI backend fallback to mock forecast data:', error.message);
  }
  return TIME_SERIES_DATA[productId] || TIME_SERIES_DATA['all'] || [];
};

/**
 * Fetch detected anomalies with ML root cause analysis
 */
export const getAnomalies = async (severityFilter = 'all') => {
  try {
    const response = await apiClient.get('/anomalies', { params: { severity: severityFilter } });
    if (Array.isArray(response.data)) {
      return response.data;
    }
  } catch (error) {
    console.warn('FastAPI backend fallback to mock anomalies data:', error.message);
  }
  if (severityFilter && severityFilter !== 'all') {
    return ANOMALIES_DATA.filter(a => a.severity.toLowerCase() === severityFilter.toLowerCase());
  }
  return ANOMALIES_DATA;
};

/**
 * Fetch GenAI prescriptive recommendations
 */
export const getRecommendations = async () => {
  try {
    const response = await apiClient.get('/recommendations');
    if (Array.isArray(response.data) && response.data.length > 0) {
      return response.data;
    }
  } catch (error) {
    console.warn('FastAPI backend fallback to mock recommendations data:', error.message);
  }
  return RECOMMENDATIONS_DATA;
};

/**
 * Fetch product catalog list
 */
export const getProducts = async () => {
  try {
    const response = await apiClient.get('/products');
    if (Array.isArray(response.data) && response.data.length > 0) {
      return response.data;
    }
  } catch (error) {
    console.warn('FastAPI backend fallback to mock products data:', error.message);
  }
  return PRODUCTS;
};

/**
 * Trigger full ETL + ML pipeline refresh
 */
export const triggerPipelineRun = async () => {
  try {
    const response = await apiClient.post('/pipeline/run');
    return response.data;
  } catch (error) {
    console.error('Error triggering pipeline run:', error);
    throw error;
  }
};

/**
 * Upload sales CSV file
 */
export const uploadSalesCSV = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await axios.post(`${BASE_URL}/ingest/upload`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 90000
  });
  return response.data;
};

/**
 * Get PDF report download URL
 */
export const getReportDownloadUrl = () => {
  return `${BASE_URL}/reports/download`;
};

export default {
  getKPIData,
  getForecast,
  getAnomalies,
  getRecommendations,
  getProducts,
  triggerPipelineRun,
  uploadSalesCSV,
  getReportDownloadUrl
};
