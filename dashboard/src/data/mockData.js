// src/data/mockData.js
// Mock Data layer for Sales Analytics Platform

export const PRODUCTS = [
  { id: 'all', name: 'All Products Aggregated', category: 'Portfolio' },
  { id: 'prod-saas', name: 'Enterprise SaaS Suite', category: 'Software' },
  { id: 'prod-ai', name: 'AI Analytics Add-On', category: 'AI Services' },
  { id: 'prod-cloud', name: 'Cloud Data Storage', category: 'Infrastructure' },
  { id: 'prod-api', name: 'API Gateway Service', category: 'Developer Tools' }
];

export const KPI_DATA = {
  totalRevenue: {
    value: 1248500,
    formatted: "$1,248,500",
    change: "+14.2%",
    isPositive: true,
    subtext: "vs. previous 6 months"
  },
  forecastAccuracy: {
    value: 96.4,
    formatted: "96.4%",
    mape: "3.6% MAPE",
    change: "+1.8%",
    isPositive: true,
    subtext: "ML Model: Prophet + XGBoost"
  },
  anomaliesDetected: {
    value: 6,
    formatted: "6 Detected",
    change: "2 Critical",
    isPositive: false,
    subtext: "3 resolved this week"
  },
  activeRecommendations: {
    value: 5,
    formatted: "5 Actionable",
    change: "$84.5K",
    isPositive: true,
    subtext: "Estimated revenue uplift"
  }
};

// Generate realistic 6 months of past daily data + 30 days forecast
const generateProductTimeSeries = (baseVal, volatility, trendFactor) => {
  const data = [];
  const today = new Date('2026-07-27');
  
  // 180 days past (historical)
  for (let i = 180; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    
    // Add weekly seasonality + random noise + slight trend
    const dayOfWeek = d.getDay();
    const weekendFactor = (dayOfWeek === 0 || dayOfWeek === 6) ? 0.75 : 1.1;
    const seasonality = Math.sin(i / 15) * 0.15;
    const trend = ((180 - i) / 180) * trendFactor;
    const noise = (Math.sin(i * 999) * volatility) - (volatility / 2);
    
    const value = Math.round(baseVal * (1 + seasonality + trend + noise) * weekendFactor);
    
    data.push({
      date: dateStr,
      historical: value,
      forecast: null,
      lowerBound: null,
      upperBound: null,
      isForecast: false
    });
  }

  // Last historical point overlaps with forecast start
  const lastHist = data[data.length - 1].historical;
  data[data.length - 1].forecast = lastHist;
  data[data.length - 1].lowerBound = lastHist;
  data[data.length - 1].upperBound = lastHist;

  // 30 days future (forecast)
  for (let i = 1; i <= 30; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    const dateStr = d.toISOString().split('T')[0];

    const dayOfWeek = d.getDay();
    const weekendFactor = (dayOfWeek === 0 || dayOfWeek === 6) ? 0.78 : 1.08;
    const seasonality = Math.sin((180 + i) / 15) * 0.15;
    const trend = ((180 + i) / 180) * trendFactor;
    
    const forecastVal = Math.round(baseVal * (1 + seasonality + trend) * weekendFactor);
    // Confidence interval expands over time
    const intervalWidth = forecastVal * (0.05 + (i * 0.0035));
    
    data.push({
      date: dateStr,
      historical: null,
      forecast: forecastVal,
      lowerBound: Math.round(forecastVal - intervalWidth),
      upperBound: Math.round(forecastVal + intervalWidth),
      isForecast: true
    });
  }

  return data;
};

export const TIME_SERIES_DATA = {
  'all': generateProductTimeSeries(28000, 0.08, 0.25),
  'prod-saas': generateProductTimeSeries(12000, 0.05, 0.30),
  'prod-ai': generateProductTimeSeries(7500, 0.12, 0.45),
  'prod-cloud': generateProductTimeSeries(5200, 0.06, 0.10),
  'prod-api': generateProductTimeSeries(3300, 0.09, 0.15)
};

export const ANOMALIES_DATA = [
  {
    id: 'ANM-101',
    date: '2026-07-25',
    productId: 'prod-saas',
    productName: 'Enterprise SaaS Suite',
    expectedValue: '$14,200',
    actualValue: '$8,100',
    variance: '-42.9%',
    severity: 'high',
    reason: 'Sudden payment gateway failure causing delayed renewal processing in North America.',
    status: 'Investigating',
    category: 'Billing Failure'
  },
  {
    id: 'ANM-102',
    date: '2026-07-23',
    productId: 'prod-ai',
    productName: 'AI Analytics Add-On',
    expectedValue: '$8,400',
    actualValue: '$14,900',
    variance: '+77.4%',
    severity: 'high',
    reason: 'Viral tech blog feature drove unexpected tier upgrades across enterprise accounts.',
    status: 'Verified Spike',
    category: 'Demand Surge'
  },
  {
    id: 'ANM-103',
    date: '2026-07-20',
    productId: 'prod-cloud',
    productName: 'Cloud Data Storage',
    expectedValue: '$5,800',
    actualValue: '$4,200',
    variance: '-27.6%',
    severity: 'medium',
    reason: 'Planned EU region maintenance resulted in temporary usage throttling.',
    status: 'Resolved',
    category: 'Infrastructure'
  },
  {
    id: 'ANM-104',
    date: '2026-07-18',
    productId: 'prod-api',
    productName: 'API Gateway Service',
    expectedValue: '$3,400',
    actualValue: '$2,500',
    variance: '-26.5%',
    severity: 'medium',
    reason: 'Key enterprise account migrated 30% traffic to private endpoint.',
    status: 'Under Review',
    category: 'Account Churn Risk'
  },
  {
    id: 'ANM-105',
    date: '2026-07-14',
    productId: 'prod-saas',
    productName: 'Enterprise SaaS Suite',
    expectedValue: '$13,100',
    actualValue: '$16,800',
    variance: '+28.2%',
    severity: 'low',
    reason: 'Mid-quarter co-marketing webinar conversion spike in EMEA region.',
    status: 'Closed',
    category: 'Marketing Boost'
  },
  {
    id: 'ANM-106',
    date: '2026-07-10',
    productId: 'prod-ai',
    productName: 'AI Analytics Add-On',
    expectedValue: '$7,200',
    actualValue: '$5,400',
    variance: '-25.0%',
    severity: 'low',
    reason: 'API rate limit bug temporarily blocked automated batch inference jobs.',
    status: 'Resolved',
    category: 'Technical Glitch'
  }
];

export const RECOMMENDATIONS_DATA = [
  {
    id: 'REC-01',
    title: 'Adjust Cloud Storage Pricing Tier',
    explanation: 'Reduce entry inventory cost for Product C — demand forecasted to drop 18% next month due to seasonal enterprise budget freezes.',
    impactTag: 'High Savings ($24K)',
    impactType: 'warning',
    confidence: '94% Confidence',
    category: 'Inventory & Pricing',
    productName: 'Cloud Data Storage',
    shapDrivers: [
      { name: 'Historical Seasonality', contribution: '-14%', direction: 'negative' },
      { name: 'Enterprise Fiscal Year End', contribution: '-8%', direction: 'negative' },
      { name: 'Competitor Price Cut', contribution: '-3%', direction: 'negative' },
      { name: 'Recent Cross-sell Campaign', contribution: '+7%', direction: 'positive' }
    ]
  },
  {
    id: 'REC-02',
    title: 'Capitalize on AI Analytics Momentum',
    explanation: 'Increase sales engineering allocation for AI Analytics Add-On. Forecasted demand trajectory is 45% above initial baseline.',
    impactTag: 'High Growth (+$48K)',
    impactType: 'positive',
    confidence: '91% Confidence',
    category: 'Growth Opportunity',
    productName: 'AI Analytics Add-On',
    shapDrivers: [
      { name: 'PR & Tech Media Coverage', contribution: '+22%', direction: 'positive' },
      { name: 'Product Update Adoption', contribution: '+15%', direction: 'positive' },
      { name: 'Inbound Trial Velocity', contribution: '+11%', direction: 'positive' },
      { name: 'Support Response Lag', contribution: '-3%', direction: 'negative' }
    ]
  },
  {
    id: 'REC-03',
    title: 'Mitigate Renewal Churn for SaaS Suite',
    explanation: 'Trigger automated customer success outreach for 14 accounts in North America experiencing payment retry failures.',
    impactTag: 'Revenue Protection ($35K)',
    impactType: 'critical',
    confidence: '97% Confidence',
    category: 'Churn Prevention',
    productName: 'Enterprise SaaS Suite',
    shapDrivers: [
      { name: 'Payment Retry Anomaly', contribution: '-32%', direction: 'negative' },
      { name: 'Account Usage Score', contribution: '+12%', direction: 'positive' },
      { name: 'NPS Feedback Rating', contribution: '+8%', direction: 'positive' }
    ]
  },
  {
    id: 'REC-04',
    title: 'Optimize API Gateway Bandwidth Quota',
    explanation: 'Offer custom usage tier to top 5 developers. Traffic forecasting suggests 24% quota overhang on standard plans.',
    impactTag: 'Expansion Revenue (+$12K)',
    impactType: 'info',
    confidence: '88% Confidence',
    category: 'Upsell Strategy',
    productName: 'API Gateway Service',
    shapDrivers: [
      { name: 'API Call Volume Trend', contribution: '+18%', direction: 'positive' },
      { name: 'Developer Sign-up Rate', contribution: '+9%', direction: 'positive' },
      { name: 'Documentation Visit Spike', contribution: '+5%', direction: 'positive' }
    ]
  },
  {
    id: 'REC-05',
    title: 'Launch EMEA Promotional Campaign',
    explanation: 'Deploy targeted 10% discount for annual SaaS commits in Europe before Q3 closes to lock in baseline forecast.',
    impactTag: 'Forecast Stabilization',
    impactType: 'positive',
    confidence: '89% Confidence',
    category: 'Marketing Action',
    productName: 'Enterprise SaaS Suite',
    shapDrivers: [
      { name: 'EMEA Conversion Lag', contribution: '-10%', direction: 'negative' },
      { name: 'Price Elasticity Model', contribution: '+16%', direction: 'positive' },
      { name: 'Competitor Renewal Cycle', contribution: '+5%', direction: 'positive' }
    ]
  }
];
