// src/services/api.js
// API Layer for Sales Analytics Platform
// Currently serving mock data with simulated asynchronous latency.
// Replace mock returns with `await apiClient.get('/endpoint')` once FastAPI backend is ready.

import axios from 'axios';
import { KPI_DATA, TIME_SERIES_DATA, ANOMALIES_DATA, RECOMMENDATIONS_DATA, PRODUCTS } from '../data/mockData';

// Base Axios instance configured for future FastAPI integration
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1',
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 10000
});

// Helper for simulated delay in demo mode
const simulateLatency = (ms = 400) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Fetch top-level platform KPIs
 * @returns {Promise<Object>} KPI metrics object
 */
export const getKPIData = async () => {
  await simulateLatency(350);
  // Real API call:
  // const response = await apiClient.get('/kpis');
  // return response.data;
  return KPI_DATA;
};

/**
 * Fetch historical sales and forecasted data for a given product
 * @param {string} productId - Product identifier or 'all'
 * @returns {Promise<Array>} Array of daily time series records
 */
export const getForecast = async (productId = 'all') => {
  await simulateLatency(450);
  // Real API call:
  // const response = await apiClient.get('/forecasts', { params: { product_id: productId } });
  // return response.data;
  return TIME_SERIES_DATA[productId] || TIME_SERIES_DATA['all'];
};

/**
 * Fetch detected anomalies with ML root cause analysis
 * @param {string} [severityFilter] - Optional filter ('high', 'medium', 'low', 'all')
 * @returns {Promise<Array>} List of anomaly records
 */
export const getAnomalies = async (severityFilter = 'all') => {
  await simulateLatency(300);
  // Real API call:
  // const response = await apiClient.get('/anomalies', { params: { severity: severityFilter } });
  // return response.data;
  if (severityFilter && severityFilter !== 'all') {
    return ANOMALIES_DATA.filter(a => a.severity === severityFilter);
  }
  return ANOMALIES_DATA;
};

/**
 * Fetch GenAI recommendations with SHAP feature importance drivers
 * @returns {Promise<Array>} List of recommendation cards with SHAP explanations
 */
export const getRecommendations = async () => {
  await simulateLatency(400);
  // Real API call:
  // const response = await apiClient.get('/recommendations');
  // return response.data;
  return RECOMMENDATIONS_DATA;
};

/**
 * Fetch product catalog list
 * @returns {Promise<Array>} List of products
 */
export const getProducts = async () => {
  await simulateLatency(150);
  // Real API call:
  // const response = await apiClient.get('/products');
  // return response.data;
  return PRODUCTS;
};

export default {
  getKPIData,
  getForecast,
  getAnomalies,
  getRecommendations,
  getProducts
};
