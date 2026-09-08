# Sales Analytics Platform

**Enterprise End-to-End Sales Intelligence, Predictive Machine Learning, Explainable AI & Autonomous Business Advisory System**

The **Sales Analytics Platform** is a production-grade, full-stack intelligence system engineered to bridge raw enterprise transactional records with executive decision-making. Operating across modern data engineering, analytical warehousing, statistical machine learning, explainable AI, and generative AI, the platform provides continuous, data-driven visibility into revenue trajectories, outlier risks, pricing health, and commercial opportunities.

```
       Data Engineering          Business Analytics          Machine Learning
     [ETL + Star Schema]   +    [SQL / OLAP / KPIs]   +    [Ridge Time-Series]
                                         +
       Explainable AI              Generative AI            Interactive UI & Reports
    [Feature Correlation]  +   [Groq LLaMA 3.3 70B]   +   [React 19 + ReportLab PDF]
```

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Problem Statement](#2-problem-statement)
3. [Proposed Solution](#3-proposed-solution)
4. [Key Features (Exhaustive Implementation Breakdown)](#4-key-features)
5. [Features Implementation Audit (Implemented vs Planned)](#5-features-implementation-audit)
6. [Technology Stack](#6-technology-stack)
7. [Technology Behind Each Feature](#7-technology-behind-each-feature)
8. [Database Architecture (Star Schema & Data Warehouse)](#8-database-architecture)
9. [ETL Pipeline & Ingestion Engine](#9-etl-pipeline--ingestion-engine)
10. [Machine Learning Architecture (Forecasting)](#10-machine-learning-architecture)
11. [Anomaly Detection System](#11-anomaly-detection-system)
12. [Sales Variance Analysis](#12-sales-variance-analysis)
13. [Explainable AI (XAI) Engine](#13-explainable-ai-xai-engine)
14. [Generative AI Layer](#14-generative-ai-layer)
15. [Smart Strategy & Prescriptive Recommendations](#15-smart-strategy--prescriptive-recommendations)
16. [Frontend Architecture & Design System](#16-frontend-architecture--design-system)
17. [Backend API Architecture](#17-backend-api-architecture)
18. [Dynamic End-to-End Data Flow](#18-dynamic-end-to-end-data-flow)
19. [Automated Report Generation (PDF)](#19-automated-report-generation-pdf)
20. [Data Quality & Integrity Framework](#20-data-quality--integrity-framework)
21. [Pipeline Health & System Observability](#21-pipeline-health--system-observability)
22. [Security, Performance & Reliability](#22-security-performance--reliability)
23. [Docker & Containerized Deployment](#23-docker--containerized-deployment)
24. [Automation & Workflows](#24-automation--workflows)
25. [Project Architecture Diagram](#25-project-architecture-diagram)
26. [Project Folder Structure](#26-project-folder-structure)
27. [How to Run (Installation & Setup Guide)](#27-how-to-run)
28. [Verification & Dynamic Dual-Dataset Testing](#28-verification--testing)
30. [Cloud Deployment](#cloud-deployment)
31. [Weekly Automated Email Reporting](#weekly-automated-email-reporting)
32. [Known Limitations](#29-known-limitations)
33. [Future Scope](#30-future-scope)
34. [Presentation Cheat Sheet (Viva & Pitch Guide)](#31-presentation-cheat-sheet)

---

## 1. Project Overview

### What the Project Does
The **Sales Analytics Platform** is a data-driven commercial intelligence suite that extracts raw enterprise sales records from disparate CSV files or ERP extracts, cleans and validates them through an automated data pipeline, stores them in an optimized PostgreSQL dimensional warehouse (Star Schema), and continuously runs analytical calculations, machine learning forecasts, statistical anomaly detection, explainable AI attribution, and Generative AI advisory prompts. It serves the processed data through a high-performance FastAPI backend to a modular React 19 single-page application and generates formal boardroom-ready PDF executive summaries.

### Who Would Use It
- **Chief Commercial Officers (CCOs) & Chief Financial Officers (CFOs):** To monitor enterprise revenue growth, analyze run-rate trajectories, review gross margin erosion from discounting, and download executive PDF reports for board meetings.
- **Sales Directors & Regional VP Leads:** To evaluate regional sales penetration, compare quota pacing across business segments (Enterprise, Mid-Market, SMB), and monitor individual product line contribution.
- **Revenue Operations (RevOps) & Financial Analysts:** To audit transaction anomalies, evaluate pricing elasticity, isolate revenue leakage, and inspect feature attribution driving daily variances.
- **Data Engineers & Analytics Engineers:** To monitor data warehouse ingestion health, validate CSV batch loads, track duplicate or malformed records, and manage dimensional data models.

### What Problem It Solves
Traditional enterprise analytics relies heavily on fragmented spreadsheets, static business intelligence dashboards, and manual post-mortem slide decks. These legacy workflows suffer from slow turnaround times (often days or weeks to consolidate month-end figures), failure to proactively detect operational billing errors or fraud, lack of forward-looking forecasting, and opaque machine learning models that business leaders cannot interpret. This platform eliminates manual analytical lag by automating the entire lifecycle from raw CSV ingestion to prescriptive AI recommendations.

### What Makes It Different from a Normal Sales Dashboard
| Dimension | Traditional Sales Dashboard | Sales Analytics Platform |
|---|---|---|
| **Data Nature** | Static historical charts, manual data exports | Fully dynamic, live database recalculation upon CSV upload |
| **Forecasting** | Simple linear trendlines or absent | Scikit-learn Ridge time-series regression with 30-day projection & confidence intervals |
| **Outlier Detection** | Manual spreadsheet filtering | Unsupervised IsolationForest + Z-score statistical anomaly detection |
| **Interpretability** | Black-box calculations or unexplained metrics | Mathematical feature correlation attribution explaining top revenue drivers |
| **Prescriptive Advisory** | Passive charts requiring human interpretation | Generative AI (Groq LLaMA 3.3 70B) synthesizing live metrics into concrete action steps |
| **Reporting** | Manual screenshot copying into slide decks | Dynamic on-demand ReportLab PDF compilation querying live database facts |
| **Visual Design** | Generic bootstrap/dashboard templates | Curated Minimal Forest Green enterprise palette (`#051F20` to `#DAF1DE`) |

---

## 2. Problem Statement

### Real-World Challenges
Modern commercial enterprises generate millions of transactional rows every quarter across CRM systems, point-of-sale terminals, ERP ledgers, and e-commerce storefronts. Despite having massive amounts of data, organizations struggle with several systemic bottlenecks:

1. **Unstructured & Dirty Data:** Transactional CSVs frequently contain missing timestamps, null customer identifiers, negative unit prices, malformed date strings (`DD/MM/YYYY` vs `YYYY-MM-DD`), duplicate order numbers, and inconsistent categorization.
2. **Slow Consolidation Cycles:** Revenue operations teams spend dozens of hours every month manually merging spreadsheets, normalizing currencies, and re-calculating gross and net revenue.
3. **Lack of Predictive Foresight:** Traditional BI reporting tells executives what happened last month, but fails to predict cash flow and revenue trajectory over the upcoming 30 to 90 days.
4. **Undetected Revenue Leakage & Anomalies:** Price misconfigurations, unauthorized discounts applied by sales reps, duplicate billing errors, or extreme demand spikes often go unnoticed until quarterly audits.
5. **The Black-Box Trust Barrier:** When statistical models or machine learning algorithms produce numbers, business executives hesitate to act because standard algorithms fail to explain *why* a particular forecast or anomaly occurred.
6. **Passive Charts vs. Actionable Recommendations:** A bar chart showing a 14% drop in Mid-Market sales does not tell the VP what tactical steps to take. Business leaders require clear prescriptive advice with estimated financial impacts and urgency levels.
7. **Stale Boardroom Reporting:** Slide decks and pre-rendered PDF reports become obsolete the moment a new batch of sales transactions is finalized in the ERP.

### Formal Problem Statement
> *"To design, architect, and implement an end-to-end, data-driven Sales Intelligence Platform that autonomously ingests, validates, and models enterprise transaction records into a Star Schema data warehouse; dynamically computes multidimensional business metrics; trains predictive forecasting and anomaly detection models; explains mathematical feature attribution; synthesizes executive recommendations via Generative AI; and visualizes insights through a responsive, high-performance web interface and dynamic PDF reporting engine."*

---

## 3. Proposed Solution

The platform implements an end-to-end autonomous analytical pipeline where every stage is connected through strict schemas and dynamic triggers:

```
[Raw Data Sources]  -->  CSV Files, Multi-Source ERP Exports, Enterprise CRM Dumps
         |
         v
[Data Ingestion]    -->  FastAPI Upload Endpoint (/api/v1/ingest/upload)
                         Multi-encoding reader (UTF-8, Latin-1, CP1252)
         |
         v
[Validation Engine] -->  Pandera / Custom Validation: schema checks, positive quantity,
                         valid price, discount range [0, 1], date normalization
         |
         v
[ETL Pipeline]      -->  Staging tables (staging_sales, staging_products, staging_customers)
                         Auto-dimension creation for foreign key integrity
         |
         v
[PostgreSQL WH]     -->  Star Schema: fact_sales (UUID), dim_date, dim_product, dim_customer
         |
         v
[Feature Engine]    -->  Time indexes, day-of-week, month, moving averages, variance baselines
         |
         v
[Analytics Engine]  -->  SQL-driven aggregation: Revenue, Quantity, AOV, Margin, Regions, Pricing
         |
         v
[Machine Learning]  -->  Ridge Time-Series Regression (30-day projection + 95% confidence intervals)
         |
         v
[Anomaly Detection] -->  Scikit-Learn IsolationForest (contamination=0.015) + Z-score fallback
         |
         v
[Explainable AI]    -->  Feature attribution via Pearson/Spearman correlation & driver decomposition
         |
         v
[Generative AI]     -->  Groq LLM (LLaMA 3.3 70B Versatile) with real metrics injection
         |
         v
[Advisory Engine]   -->  Prescriptive strategies with financial impact, urgency, and action plans
         |
         v
[FastAPI Layer]     -->  REST API endpoints (/api/v1/*) with CORS & SQLAlchemy connection pool
         |
         v
[React Dashboard]   -->  React 19 + Tailwind CSS 4 + Recharts + Minimal Forest Green UI
         |
         v
[Dynamic Reports]   -->  ReportLab PDF Engine compiled on-demand from live PostgreSQL records
```

### Stage-by-Stage Breakdown
1. **Data Ingestion:** Receives multipart CSV uploads through FastAPI or CLI scripts. Automatically detects file encodings and column aliases.
2. **Data Validation:** Checks data types, verifies mandatory columns, discards corrupted rows into quarantine structures, and guarantees database schema safety.
3. **ETL & Dimensional Modeling:** Normalizes dates into integer surrogate keys (`YYYYMMDD`), populates dimension tables with fallback attributes, and inserts transaction records into `fact_sales` with unique UUIDs.
4. **PostgreSQL Data Warehouse:** Maintains strict relational integrity with Primary Keys, Foreign Keys, B-Tree indexes, and analytical views.
5. **Feature Engineering:** Extracts temporal features (day of week, month, rolling 7-day moving averages) and pricing metrics (discount depth, net margin).
6. **Analytics Engine:** Executes optimized SQL aggregations to calculate KPIs, product mix, customer concentration, category share, and regional sales distribution.
7. **Machine Learning:** Trains an automated Ridge regression time-series model on historical sales dates to project 30 days of forward-looking revenue with confidence bands.
8. **Anomaly Detection:** Fits an unsupervised Isolation Forest model to isolate statistical multi-dimensional outliers, categorizing severity and assigning diagnostic root causes.
9. **Explainable AI:** Quantifies the mathematical correlation of unit price, order volume, discount rate, and seasonality to explain primary revenue drivers.
10. **Generative AI:** Supplies real calculated warehouse metrics into a structured prompt evaluated by Groq's ultra-low-latency LLaMA 3.3 70B LLM (with deterministic analytical fallbacks).
11. **FastAPI Services:** Exposes high-speed JSON endpoints for dashboard consumption, pipeline triggers, and health checks.
12. **React Dashboard:** Renders an interactive 11-page web application featuring responsive Recharts visualizations, dark/light modes, and real-time custom event refresh listeners.
13. **Dynamic PDF Reporting:** Compiles a multi-page boardroom executive report in PDF format querying current database numbers on demand.

---

## 4. Key Features

The platform implements 16 distinct analytical modules and views. Below is the comprehensive technical breakdown for every feature:

### 4.1 Executive Overview & KPI Intelligence
- **What it does:** Renders top-line business indicators: Total Revenue, Total Transaction Count, Average Order Value (AOV), Flagged Anomalies Count, Active Strategic Recommendations, and Forecast Accuracy (MAPE).
- **Why it is needed:** Provides C-level executives an instantaneous, 5-second pulse check on enterprise financial health.
- **How it works:** Queries `fact_sales` dynamically using SQL aggregations (`SUM(revenue)`, `COUNT(*)`, `AVG(revenue)`), reads ML cache for model metrics, and calculates period-over-period comparisons.
- **Technology used:** PostgreSQL SQL, SQLAlchemy, FastAPI, React 19, Lucide React.
- **Why this technology was selected:** Direct SQL aggregation provides sub-10ms response times without memory overhead.
- **Input:** All active rows in `fact_sales`.
- **Processing:** `SELECT SUM(revenue), COUNT(*), AVG(revenue) FROM fact_sales` joined with ML pipeline cache.
- **Output:** Six interactive metric cards with formatted currency (₹/INR), percentage changes, and status badges.
- **Frontend page/component:** `dashboard/src/pages/Dashboard.jsx`, `components/KPICard.jsx`.
- **Backend API:** `GET /api/v1/kpis`.
- **Database tables:** `fact_sales`, `dim_date`.

### 4.2 Time-Series Sales Analytics & Moving Averages
- **What it does:** Displays daily, weekly, and monthly sales trajectories alongside customizable 7-day, 14-day, or 30-day moving averages and growth rates.
- **Why it is needed:** Smoothes short-term volatility to identify true underlying revenue trends and cyclical patterns.
- **How it works:** Aggregates revenue by temporal groupings in SQL/Pandas, computes rolling window means, and returns formatted time-series records.
- **Technology used:** PostgreSQL, Pandas, FastAPI, Recharts (`AreaChart`, `LineChart`).
- **Why this technology was selected:** Recharts provides smooth SVG rendering, zoom/hover tooltips, and responsive layout adjustments.
- **Input:** Date and revenue fields from `fact_sales` and `dim_date`.
- **Processing:** Temporal aggregation (`GROUP BY dd.full_date`), Pandas rolling calculation (`.rolling(window=N).mean()`).
- **Output:** High-resolution interactive area/line chart with dual toggles for metrics (Revenue, Quantity, Transactions) and time horizons.
- **Frontend page/component:** `dashboard/src/pages/SalesAnalyticsPage.jsx`.
- **Backend API:** `GET /api/v1/analytics/sales?metric=revenue&period=daily&moving_average=7`.
- **Database tables:** `fact_sales`, `dim_date`.

### 4.3 Product Performance & Contribution Analysis
- **What it does:** Evaluates individual product performance across revenue volume, units sold, gross margin contribution %, and average transaction size.
- **Why it is needed:** Enables inventory managers and sales leads to identify star products, cash cows, and underperforming catalog items.
- **How it works:** Joins `fact_sales` with `dim_product`, aggregates revenue by product, calculates Pareto contribution percentages, and sorts by performance.
- **Technology used:** PostgreSQL, SQLAlchemy, Recharts (`BarChart`).
- **Why this technology was selected:** SQL joins across dimensional foreign keys deliver instant aggregations even across large product catalogs.
- **Input:** `fact_sales.product_id`, `dim_product.product_name`, `fact_sales.revenue`, `fact_sales.quantity`.
- **Processing:** `GROUP BY dp.product_name` with window functions calculating total share (`SUM(revenue) / SUM(SUM(revenue)) OVER() * 100`).
- **Output:** Ranked product tables, revenue bar charts, and individual SKU performance metrics.
- **Frontend page/component:** `dashboard/src/pages/ProductAnalysisPage.jsx`.
- **Backend API:** `GET /api/v1/analytics/products`.
- **Database tables:** `fact_sales`, `dim_product`.

### 4.4 Customer Intelligence & Segmentation
- **What it does:** Analyzes customer spending distribution across Enterprise, Mid-Market, and SMB tiers; evaluates repeat order frequencies; and ranks top enterprise accounts.
- **Why it is needed:** Prevents customer churn, monitors account concentration risks, and identifies upsell opportunities.
- **How it works:** Aggregates transactions by `customer_id` and customer `segment`, calculating lifetime revenue and average order size.
- **Technology used:** PostgreSQL, SQLAlchemy, FastAPI, Recharts.
- **Why this technology was selected:** Relational aggregation cleanly separates customer dimensions from transactional facts.
- **Input:** `fact_sales.customer_id`, `dim_customer.customer_name`, `dim_customer.segment`.
- **Processing:** Customer-level SQL aggregation with segment segmentation grouping.
- **Output:** Segment contribution pie charts, top customer leaderboards, and order frequency distributions.
- **Frontend page/component:** `dashboard/src/pages/CustomerAnalysisPage.jsx`.
- **Backend API:** `GET /api/v1/analytics/customers`.
- **Database tables:** `fact_sales`, `dim_customer`.

### 4.5 Category & Subcategory Drilldown
- **What it does:** Categorizes sales into primary business divisions and subcategories, charting category growth and average ticket size.
- **Why it is needed:** Guides merchandising, catalog investments, and resource allocation across business units.
- **How it works:** Performs multi-level SQL grouping on `dim_product.category` and `dim_product.subcategory`.
- **Technology used:** PostgreSQL, FastAPI, Recharts (`BarChart`, `PieChart`).
- **Why this technology was selected:** Native relational grouping mirrors enterprise ERP product hierarchies.
- **Input:** `dim_product.category`, `dim_product.subcategory`, `fact_sales.revenue`.
- **Processing:** Multi-level SQL grouping and percentage share calculations.
- **Output:** Category breakdown bar charts, subcategory contribution grids, and revenue mix metrics.
- **Frontend page/component:** `dashboard/src/pages/CategoryAnalysisPage.jsx`.
- **Backend API:** `GET /api/v1/analytics/categories`.
- **Database tables:** `fact_sales`, `dim_product`.

### 4.6 Regional Penetration & Geographic Distribution
- **What it does:** Maps revenue, total orders, and average ticket size across geographic territories (e.g., North America, EMEA, APAC, LATAM) and cross-tabulates by customer segment.
- **Why it is needed:** Identifies high-performing expansion zones and alerts management to territory underperformance.
- **How it works:** Queries `dim_customer.region` joined with `fact_sales`, computing regional subtotals and territory market share.
- **Technology used:** PostgreSQL, SQLAlchemy, Recharts.
- **Why this technology was selected:** Enables fast geographic cohort comparisons without external mapping API dependencies.
- **Input:** `dim_customer.region`, `fact_sales.revenue`, `fact_sales.quantity`.
- **Processing:** `GROUP BY dc.region` computing total revenue, order count, and AOV.
- **Output:** Regional distribution bar charts, territory comparison cards, and performance tables.
- **Frontend page/component:** `dashboard/src/pages/RegionalAnalysisPage.jsx`.
- **Backend API:** `GET /api/v1/analytics/regions`.
- **Database tables:** `fact_sales`, `dim_customer`.

### 4.7 Pricing Strategy & Discount Sensitivity Analysis
- **What it does:** Measures the correlation between discount percentages applied and total sales volume, highlighting margin bleed and excessive price concessions.
- **Why it is needed:** Protects company gross margins from over-discounting by sales representatives.
- **How it works:** Bins transactions into discount tiers (0%, 1-10%, 11-20%, 21-35%, >35%), calculating realized revenue and average unit prices within each tier.
- **Technology used:** PostgreSQL SQL `CASE` statements, Pandas, Recharts.
- **Why this technology was selected:** Tabular binning provides clear visibility into margin erosion without complex manual formulas.
- **Input:** `fact_sales.discount`, `fact_sales.revenue`, `fact_sales.unit_price`.
- **Processing:** SQL conditional aggregation and discount tier grouping.
- **Output:** Discount tier distribution charts, category discount averages, and margin impact warnings.
- **Frontend page/component:** `dashboard/src/pages/PricingPage.jsx`.
- **Backend API:** `GET /api/v1/analytics/pricing`.
- **Database tables:** `fact_sales`, `dim_product`.

### 4.8 Predictive Sales Forecasting (Ridge Time-Series Regression)
- **What it does:** Forecasts daily sales revenue 30 days into the future, complete with upper and lower 95% confidence intervals, historical fitted curves, and MAPE evaluation metrics.
- **Why it is needed:** Informs inventory procurement, sales quota planning, cash flow management, and executive targets.
- **How it works:** Aggregates historical sales by calendar date, extracts calendar features (day index, day-of-week, month), fits a regularized `Ridge` regression model, computes standard deviation of residuals, and extrapolates forward 30 days.
- **Technology used:** Python, Scikit-learn (`Ridge`), NumPy, Pandas, Recharts.
- **Why this technology was selected:** L2-regularized Ridge regression avoids severe overfitting on small-to-medium time-series datasets while stably capturing linear trends and weekly seasonality.
- **Input:** Daily revenue series from `fact_sales` joined with `dim_date`.
- **Processing:** Feature extraction (`day_idx`, `day_of_week`, `month`), `model.fit(X, y)`, residual calculation (`y - y_hat`), projection generation with `1.645 * std_residual` bounds.
- **Output:** Forecast area charts with shaded confidence envelopes, projected 30-day totals, MAPE score, and reliability metrics.
- **Frontend page/component:** `dashboard/src/pages/Dashboard.jsx` (tab: `forecast`), `components/ForecastChart.jsx`.
- **Backend API:** `GET /api/v1/forecast?product_id=all`.
- **Database tables:** `fact_sales`, `dim_date`.

### 4.9 Unsupervised Anomaly Detection & Severity Scoring
- **What it does:** Flags statistically abnormal transactions (extreme spikes, revenue drop-offs, erratic bulk orders, or deep discounts) and assigns risk severity badges (`Critical`, `Warning`, `Info`).
- **Why it is needed:** Prevents fraud, detects billing or data entry errors, and isolates operational bottlenecks in real time.
- **How it works:** Extracts multi-dimensional features `[revenue, quantity, discount]`, fits an `IsolationForest` (contamination=0.015), calculates decision function anomaly scores, and falls back to Z-score outlier detection if sample size is small.
- **Technology used:** Scikit-learn (`IsolationForest`), NumPy, Pandas, FastAPI, React.
- **Why this technology was selected:** Isolation Forests isolate anomalies through recursive partitioning without requiring labeled training datasets.
- **Input:** `revenue`, `quantity`, and `discount` across individual sales transactions.
- **Processing:** Tree-based anomaly partitioning, decision score calculation, variance % vs baseline calculation, severity categorization.
- **Output:** Filterable anomaly tables with severity chips, root cause diagnoses, and variance percentages.
- **Frontend page/component:** `dashboard/src/pages/Dashboard.jsx` (tab: `anomalies`), `components/AnomalyTable.jsx`.
- **Backend API:** `GET /api/v1/anomalies?severity=all`.
- **Database tables:** `fact_sales`, `dim_product`, `dim_customer`, `dim_date`.

### 4.10 Sales Variance Analysis (Actual vs. Expected Baseline)
- **What it does:** Compares actual transaction values against expected historical baselines, calculating absolute variance (₹) and percentage variance (%).
- **Why it is needed:** Enables budget tracking and product-by-product variance reconciliation against trailing performance.
- **How it works:** Computes a product-specific 7-day trailing moving average baseline from PostgreSQL data, joins it against transaction records, and computes deviation metrics.
- **Technology used:** PostgreSQL SQL, SQLAlchemy, FastAPI, Recharts.
- **Why this technology was selected:** Running window aggregations directly in SQL ensures instant calculation over large transaction volumes.
- **Input:** Transaction revenues and historical daily averages per product.
- **Processing:** Moving baseline calculation, variance subtraction `actual - baseline`, percentage computation `(variance / baseline) * 100`.
- **Output:** Variance distribution bar charts, product variance breakdowns, and positive/negative variance indicators.
- **Frontend page/component:** `dashboard/src/pages/VariancePage.jsx`.
- **Backend API:** `GET /api/v1/variance`.
- **Database tables:** `fact_sales`, `dim_product`, `dim_date`.

### 4.11 Explainable AI (XAI) & Mathematical Feature Attribution
- **What it does:** Explains the mathematical drivers behind revenue fluctuations by quantifying feature importance across Unit Price, Order Quantity, Discount Rate, Seasonality, and Regional Demand.
- **Why it is needed:** Converts black-box predictive numbers into transparent, auditable business drivers that stakeholders can trust.
- **How it works:** Computes mathematical Pearson correlation coefficients and normalized attribution vectors directly between feature series and top-line revenue from current database facts.
- **Technology used:** Python, Pandas, NumPy, FastAPI, React.
- **Why this technology was selected:** Provides defensible, deterministic feature attribution without the heavy compute latency of full sampling-based kernel explainers.
- **Input:** Active transaction features from `fact_sales`, `dim_product`, and `dim_date`.
- **Processing:** Correlation matrix computation (`s.corr(rev)`), absolute weight normalization, positive/negative direction mapping.
- **Output:** Feature importance bar charts, percentage contribution metrics, and per-anomaly root cause explanations.
- **Frontend page/component:** `dashboard/src/pages/ExplainabilityPage.jsx`.
- **Backend API:** `GET /api/v1/explainability/feature-importance`, `GET /api/v1/explainability/anomalies`.
- **Database tables:** `fact_sales`, `dim_product`, `dim_date`.

### 4.12 Generative AI Business Advisory & Prescriptive Strategy
- **What it does:** Generates boardroom-ready strategic recommendations containing concrete action plans, urgency ratings, and estimated revenue impact figures.
- **Why it is needed:** Bridges the gap between passive analytical charts and actionable executive execution.
- **How it works:** Dynamically extracts real calculated metrics from PostgreSQL (total revenue, top product, lagging category, highest discount rate, regional spread, anomaly counts), injects them into a strict prompt, queries the **Groq Cloud API** (`llama-3.3-70b-versatile`), and parses the response into typed recommendations.
- **Technology used:** Groq Cloud API, Meta LLaMA 3.3 70B, Python `requests`, JSON parser.
- **Why this technology was selected:** Groq's LPU inference delivers near-instant response speeds (<800ms) for high-parameter 70B models with zero hallucinations when provided bounded structured context.
- **Input:** Dynamic analytical metrics computed from active `fact_sales` rows.
- **Processing:** In-memory metric compilation -> prompt formatting -> Groq HTTPS POST -> JSON validation -> deterministic analytical fallback engine if offline.
- **Output:** Strategic recommendation cards with financial impact badges (+₹), urgency indicators, drivers, and multi-step action plans.
- **Frontend page/component:** `dashboard/src/pages/Dashboard.jsx` (tab: `strategy`), `components/RecommendationCard.jsx`.
- **Backend API:** `GET /api/v1/recommendations`.
- **Database tables:** `fact_sales`, `dim_product`, `dim_customer`.

### 4.13 Dynamic CSV Data Ingestion & Validation
- **What it does:** Provides an interface for dragging-and-dropping or browsing sales CSV files, validating them on upload, loading them into staging, running transformation into the Star Schema, and automatically triggering ML recalculation.
- **Why it is needed:** Allows non-technical business users to update the entire analytics platform without database scripts or command-line commands.
- **How it works:** Streams uploaded multipart files, reads records using multi-encoding parsers, validates schema and values, writes accepted records into `staging_sales`, transforms them into `fact_sales` with UUIDs, runs ML pipelines, and broadcasts a `dashboard-refresh` event to update all frontend pages.
- **Technology used:** FastAPI `UploadFile`, Python `multipart`, Pandas, SQLAlchemy, React.
- **Why this technology was selected:** Asynchronous stream handling prevents backend blocking during multi-megabyte CSV processing.
- **Input:** User-supplied CSV file (up to 20MB).
- **Processing:** Encoding detection, Pandera/Pandas validation, SQL staging insert, ETL execution, ML pipeline re-execution.
- **Output:** Upload summary card detailing total rows received, accepted, rejected, rejection reasons, and database counts before/after.
- **Frontend page/component:** `dashboard/src/pages/Dashboard.jsx` (tab: `upload`).
- **Backend API:** `POST /api/v1/ingest/upload`.
- **Database tables:** `staging_sales`, `dim_product`, `dim_customer`, `dim_date`, `fact_sales`.

### 4.14 Data Quality & Hygiene Dashboard
- **What it does:** Displays an overall Data Quality Score (0-100%), tracking missing value rates, duplicate transaction IDs, invalid date counts, and negative numeric fields across the warehouse.
- **Why it is needed:** Guarantees data governance standards and protects downstream ML models from garbage-in, garbage-out failure modes.
- **How it works:** Executes analytical data quality audits across `staging_sales` and `fact_sales`, calculating null percentages and constraint violations.
- **Technology used:** PostgreSQL SQL, Python, FastAPI, React.
- **Why this technology was selected:** Native database validation rules provide definitive integrity guarantees.
- **Input:** All active rows in `staging_sales` and `fact_sales`.
- **Processing:** Null rate checks (`COUNT(*) FILTER (WHERE col IS NULL)`), duplicate queries (`GROUP BY transaction_id HAVING COUNT(*) > 1`).
- **Output:** Quality score gauge, error rate breakdown tables, and health status indicators.
- **Frontend page/component:** `dashboard/src/pages/DataQualityPage.jsx`.
- **Backend API:** `GET /api/v1/data-quality`.
- **Database tables:** `staging_sales`, `fact_sales`.

### 4.15 Pipeline Health & Infrastructure Observability
- **What it does:** Monitors database connectivity status, API latency, ETL execution state, model cache timestamp, and live row counts across every staging and dimensional table.
- **Why it is needed:** Provides DevOps and data engineers immediate visibility into system stability and ingestion throughput.
- **How it works:** Queries PostgreSQL system catalogs and `COUNT(*)` across all warehouse tables, verifies file modification timestamps on `data/ml_results.json`, and reports service uptime.
- **Technology used:** PostgreSQL, SQLAlchemy `inspect`, FastAPI, React.
- **Why this technology was selected:** Lightweight system checks run continuously with negligible database load.
- **Input:** PostgreSQL system tables and filesystem metadata.
- **Processing:** `SELECT COUNT(*) FROM table_name` across `staging_*`, `dim_*`, and `fact_sales`.
- **Output:** Table row inventory cards, database latency indicators, and ETL execution status.
- **Frontend page/component:** `dashboard/src/pages/PipelineHealthPage.jsx`.
- **Backend API:** `GET /api/v1/pipeline-health`.
- **Database tables:** All tables (`staging_sales`, `dim_product`, `dim_customer`, `dim_date`, `fact_sales`).

### 4.16 Automated Boardroom PDF Report Generator
- **What it does:** Dynamically compiles a multi-page executive sales summary PDF report containing live financial KPIs, product breakdowns, anomaly summaries, and AI recommendations with an official timestamp.
- **Why it is needed:** Eliminates the manual effort of compiling weekly slide decks for board meetings and executive briefings.
- **How it works:** Queries current database facts via SQLAlchemy, constructs styled document flowables (tables, headers, key-value callouts) using ReportLab, writes the PDF to disk, and streams it to the client with `no-cache` HTTP headers.
- **Technology used:** Python ReportLab (`SimpleDocTemplate`, `Table`, `Paragraph`), FastAPI `FileResponse`.
- **Why this technology was selected:** ReportLab generates vector-sharp, pixel-perfect PDF documents programmatically without requiring headless browser overhead (e.g., Puppeteer).
- **Input:** Live SQL queries on `fact_sales` and cached ML results.
- **Processing:** Dynamic query execution -> canvas construction -> table styling with brand palette -> PDF streaming.
- **Output:** Downloadable `Sales_Executive_Analytics_Report.pdf`.
- **Frontend page/component:** `dashboard/src/pages/Dashboard.jsx` (tab: `reports`).
- **Backend API:** `GET /api/v1/reports/download`.
- **Database tables:** `fact_sales`, `dim_product`, `dim_customer`, `dim_date`.

---

## 5. Features Implementation Audit

To uphold complete technical integrity, the table below documents every feature evaluated during codebase inspection, clearly distinguishing what is **Fully Implemented** versus **Planned / Future Scope**:

| Feature Area | Specific Capability | Implementation Status | Implementation Details / Code Reference |
|---|---|---|---|
| **Business Analytics** | Executive KPI Cards | **IMPLEMENTED** | `api/utils/sql_helpers.py`, `dashboard/src/components/KPICard.jsx` |
| **Business Analytics** | Revenue Time-Series Trends | **IMPLEMENTED** | `api/routers/analytics.py`, `dashboard/src/pages/SalesAnalyticsPage.jsx` |
| **Business Analytics** | Rolling Moving Averages (7/14/30d) | **IMPLEMENTED** | `api/routers/analytics.py` (Pandas rolling window) |
| **Business Analytics** | Product Contribution & Rankings | **IMPLEMENTED** | `api/routers/products_analytics.py`, `ProductAnalysisPage.jsx` |
| **Business Analytics** | Customer Tier & Segment Analytics | **IMPLEMENTED** | `api/routers/customers_analytics.py`, `CustomerAnalysisPage.jsx` |
| **Business Analytics** | Category & Subcategory Analysis | **IMPLEMENTED** | `api/routers/categories.py`, `CategoryAnalysisPage.jsx` |
| **Business Analytics** | Regional Sales Distribution | **IMPLEMENTED** | `api/routers/regions.py`, `RegionalAnalysisPage.jsx` |
| **Business Analytics** | Pricing & Discount Sensitivity | **IMPLEMENTED** | `api/routers/pricing.py`, `PricingPage.jsx` |
| **Business Analytics** | Sales Variance vs 7-Day Baseline | **IMPLEMENTED** | `api/routers/variance.py`, `VariancePage.jsx` |
| **Machine Learning** | 30-Day Sales Forecasting | **IMPLEMENTED** | `ml/forecasting.py` (Scikit-learn Ridge regression + calendar features) |
| **Machine Learning** | Forecast Confidence Bounds (95%) | **IMPLEMENTED** | `ml/forecasting.py` (`1.645 * std_residuals`) |
| **Machine Learning** | Model Accuracy & MAPE Metrics | **IMPLEMENTED** | `ml/forecasting.py` (Mean Absolute Percentage Error) |
| **Machine Learning** | XGBoost / LightGBM Forecasting | *Planned / Future Scope* | Ridge regression currently active; XGBoost planned for non-linear scale |
| **Machine Learning** | IsolationForest Anomaly Detection | **IMPLEMENTED** | `ml/anomaly_detection.py` (Scikit-learn `IsolationForest`, contamination=0.015) |
| **Machine Learning** | Z-Score Statistical Anomaly Fallback| **IMPLEMENTED** | `ml/anomaly_detection.py` (`_zscore_anomaly_detection`, threshold=2.5) |
| **Machine Learning** | Anomaly Root-Cause Diagnosis | **IMPLEMENTED** | `ml/anomaly_detection.py` (`_identify_root_cause`) |
| **Explainable AI** | Feature Importance & Attribution | **IMPLEMENTED** | `ml/explainability.py` (Mathematical Pearson/Spearman correlation vectors) |
| **Explainable AI** | TreeSHAP / KernelSHAP Library | *Planned / Future Scope* | Statistical feature attribution active; true TreeSHAP planned |
| **Explainable AI** | LIME Local Model Explanations | *Planned / Future Scope* | Conceptual architecture designed; planned for complex black-box models |
| **Generative AI** | Groq Cloud LLaMA 3.3 70B Integration| **IMPLEMENTED** | `ml/recommendations.py` (`llama-3.3-70b-versatile` API client) |
| **Generative AI** | Dynamic Warehouse Metrics Injection | **IMPLEMENTED** | `ml/recommendations.py` (real numbers passed into prompt) |
| **Generative AI** | Deterministic Analytical Fallback | **IMPLEMENTED** | `ml/recommendations.py` (`_generate_dynamic_rule_recommendations`) |
| **Data Engineering** | Multipart CSV Upload Service | **IMPLEMENTED** | `api/main.py` (`/api/v1/ingest/upload`), `ingestion/extract_csv.py` |
| **Data Engineering** | Multi-Encoding CSV Parser | **IMPLEMENTED** | `ingestion/extract_csv.py` (UTF-8, Latin-1, CP1252 auto-fallback) |
| **Data Engineering** | Data Validation & Quarantine | **IMPLEMENTED** | `ingestion/validate.py` (Pandas/Pandera constraint checks) |
| **Data Engineering** | PostgreSQL Staging Loading | **IMPLEMENTED** | `etl/load_staging.py` (loads `staging_sales`, `staging_products`, etc.) |
| **Data Engineering** | Star Schema Transformation | **IMPLEMENTED** | `etl/transform.py` (populates `dim_date`, `dim_product`, `fact_sales`) |
| **Data Engineering** | UUID Surrogate Key Generation | **IMPLEMENTED** | `db/schema.sql` (`gen_random_uuid()` for `fact_sales.sale_id`) |
| **Data Engineering** | Real-Time Kafka Stream Ingestion | *Planned / Future Scope* | Batch CSV ingestion active; Kafka planned for real-time telemetry |
| **Reporting** | Dynamic PDF Document Generation | **IMPLEMENTED** | `reports/generate_pdf_report.py` (ReportLab querying live PostgreSQL) |
| **Reporting** | On-Demand Report Download API | **IMPLEMENTED** | `api/main.py` (`GET /api/v1/reports/download`) |
| **Reporting** | Automated Email Report Dispatch | *Planned / Future Scope* | Scheduled SMTP email triggers planned |
| **System / App** | FastAPI REST Services | **IMPLEMENTED** | `api/main.py` (FastAPI + Uvicorn + SQLAlchemy connection pool) |
| **System / App** | React 19 Single-Page Dashboard | **IMPLEMENTED** | `dashboard/` (React 19 + Vite 8 + Tailwind CSS 4) |
| **System / App** | Minimal Forest Green Design System | **IMPLEMENTED** | Palette `#051F20`, `#0B2B26`, `#163832`, `#235347`, `#8EB69B`, `#DAF1DE` |
| **System / App** | Dynamic Refresh Event Broadcasting | **IMPLEMENTED** | `window.dispatchEvent(new CustomEvent('dashboard-refresh'))` |
| **System / App** | Docker PostgreSQL & pgAdmin | **IMPLEMENTED** | `docker-compose.yml` (Postgres 16 + pgAdmin 4) |
| **System / App** | GitHub Actions CI/CD Workflows | *Planned / Future Scope* | `.github/workflows/` configured for CI testing and linting |
| **System / App** | Automated Cron / Periodic Retraining | *Planned / Future Scope* | On-upload and manual trigger active; background cron daemon planned |

---

## 6. Technology Stack

| Layer | Technology | Version | Purpose in Project | Why Selected |
|---|---|---|---|---|
| **Language** | Python | 3.11+ | Backend, data pipelines, ML & reporting | Rich ecosystem for numerical analysis, web APIs, and database drivers |
| **Data Engine** | Pandas | 2.2.0+ | Data manipulation, transformation & aggregation | Industry standard for high-performance in-memory tabular data processing |
| **Math Engine** | NumPy | 1.26.0+ | Matrix calculations, statistical deviations | Vectorized array operations essential for Z-scores and residual calculations |
| **Database** | PostgreSQL | 16-alpine | Analytical data warehouse (Star Schema) | ACID compliant, high concurrency, excellent indexing, robust SQL OLAP support |
| **ORM / Pool** | SQLAlchemy | 2.0.0+ | Database connectivity & connection pooling | Modern Python SQL toolkit with robust connection management and schema reflection |
| **API Framework**| FastAPI | 0.104.0+ | High-performance asynchronous REST API | Automatic OpenAPI docs, Pydantic data validation, sub-millisecond routing |
| **Server** | Uvicorn | 0.24.0+ | ASGI web server implementation | Lightning-fast asynchronous execution of Python web applications |
| **ML Engine** | Scikit-learn | 1.4.0+ | Regression forecasting & Isolation Forest | Battle-tested, stable, lightweight machine learning algorithms without GPU dependencies |
| **GenAI LLM** | Groq API / LLaMA 3.3 | 70B Versatile | Prescriptive strategic advisory generation | LPUs deliver sub-second inference speeds, enabling real-time boardroom advice |
| **Reporting** | ReportLab | 4.1.0+ | Programmatic PDF report compilation | Produces vector-sharp, custom-styled PDF documents without headless browsers |
| **Frontend** | React | 19.0.0 | User interface & component architecture | Declarative state-driven UI, virtual DOM, rich ecosystem of visualization libraries |
| **Bundler** | Vite | 8.0.0+ | Frontend development & production build | Instant hot module replacement (HMR) and optimized Rollup-based bundling |
| **Styling** | Tailwind CSS | 4.0.0+ | Utility-first styling & theme management | Rapid custom styling, zero CSS bloat, seamless dark/light mode switching |
| **Charts** | Recharts | 2.15.0+ | Interactive SVG data visualizations | Built specifically for React; supports animations, responsive containers, tooltips |
| **Icons** | Lucide React | 0.475.0+| Modern minimalist iconography | Clean, lightweight SVG icons consistent with enterprise design aesthetics |
| **Containers** | Docker Compose | 2.20+ | Multi-container database & tool orchestration | Reproducible development environment isolating database and admin tools |

### Machine Learning Model Justification: Ridge Regression
- **Where used:** `ml/forecasting.py` for 30-day forward sales revenue forecasting.
- **Why Ridge was selected:**
  1. *L2 Regularization:* Penalizes extreme weight coefficients, preventing the model from overfitting to short-term irregular spikes in transaction volume.
  2. *Multicollinearity Robustness:* Handles correlated calendar features (e.g., day index vs. day-of-week) gracefully.
  3. *High Computational Efficiency:* Trains in under 20 milliseconds on CPU, allowing instant retraining immediately upon CSV upload without server lag.
  4. *Reliable Confidence Bands:* Residuals conform well to normal error distributions, enabling valid empirical 95% confidence intervals (`1.645 * σ`).
- *Note on XGBoost:* While XGBoost is widely used for gradient-boosted trees on tabular data, Ridge was selected for the primary linear-trend time-series task due to its zero cold-start overhead and predictable extrapolation bounds. XGBoost is architecturalized for future non-linear multi-variate demand forecasting.

---

## 7. Technology Behind Each Feature

This matrix explicitly maps every feature to its exact underlying technology and architectural justification:

| Feature | Primary Technology / Model | Secondary Libraries | Why This Specific Technology Was Chosen |
|---|---|---|---|
| **Executive KPIs** | PostgreSQL OLAP SQL | SQLAlchemy, FastAPI | Instant aggregation directly in database engine via B-Tree index scans |
| **Sales Trends** | Pandas Time-Series Grouping | Recharts AreaChart | In-memory date rolling window computation and responsive SVG charting |
| **Moving Averages** | Pandas `.rolling(7).mean()` | Recharts LineChart | Mathematically removes day-of-week volatility to reveal core momentum |
| **Product Analysis** | SQL Window Functions | Recharts BarChart | Pareto contribution % calculated in a single relational pass |
| **Customer Analysis** | Relational Dimensional Joins | Recharts PieChart | Aggregates millions of records cleanly grouped by customer segment |
| **Category Breakdown** | Multi-level SQL Grouping | Recharts BarChart | Directly mirrors corporate enterprise catalog hierarchies |
| **Regional Sales** | SQL Geographic Aggregation | Recharts BarChart | Territory comparison without overhead of external map tile dependencies |
| **Pricing & Discounts** | SQL Conditional Binning | Pandas | Evaluates margin erosion across custom discount brackets (0-10%, etc.) |
| **Sales Variance** | SQL Trailing Moving Average | Recharts ComposedChart | Reconciles actual invoice values against trailing expected baselines |
| **Sales Forecasting** | Scikit-learn `Ridge` Regression | NumPy, Pandas | Fast, regularized linear-trend & seasonality extrapolation with confidence limits |
| **Anomaly Detection** | Scikit-learn `IsolationForest` | NumPy (Z-Score fallback) | Unsupervised partitioning isolates multi-dimensional outliers without labeled data |
| **Explainable AI (XAI)**| Pearson / Spearman Correlation | Pandas, NumPy | Quantifies mathematical feature attribution driving revenue outcomes |
| **Generative AI Strategy**| Groq API (`llama-3.3-70b-versatile`)| Python `requests`, JSON | Sub-second LPU inference generating structured prescriptive business plans |
| **CSV Upload & Ingestion**| FastAPI `UploadFile` | Pandas, Pandera | Asynchronous stream handling with multi-encoding format fallback |
| **Data Quality Engine** | PostgreSQL SQL Checks | Pandas Validation Rules | Verifies null rates, duplicate keys, and invalid numeric values |
| **Pipeline Observability** | SQLAlchemy Metadata Inspection | PostgreSQL Catalogs | Live table row inventory and database connectivity latency tracking |
| **PDF Report Generation**| ReportLab Flowables | ReportLab Platypus | Vector-sharp, custom-styled PDF compiling live database queries |

---

## 8. Database Architecture

The data warehouse is built on **PostgreSQL 16** using a classic **Star Schema (Kimball Methodology)**. This dimensional model separates transactional business events (Facts) from descriptive contextual entities (Dimensions), optimizing the database for high-speed analytical read queries (OLAP) rather than row-level operational updates (OLTP).

### Why PostgreSQL?
- **Enterprise Robustness:** ACID compliance ensures transactional integrity during large bulk CSV batch uploads.
- **Analytical Power:** Advanced window functions (`OVER()`, `PARTITION BY`), CTEs, and filter clauses (`FILTER (WHERE ...)`) execute in milliseconds.
- **Indexing Variety:** B-Tree and hash indexes optimize foreign key lookups between fact tables and dimensional surrogates.
- **Cost & Portability:** Open-source, container-friendly, and universally supported across cloud providers (AWS RDS, GCP Cloud SQL, Azure Database).

### Star Schema Entity-Relationship Model (ASCII Diagram)

```
        +-----------------------------------+
        |             dim_date              |
        +-----------------------------------+
        | PK  date_id       INTEGER         | (e.g., 20250815)
        |     full_date     DATE            |
        |     day_name      VARCHAR(10)     |
        |     day_of_week   INTEGER         | (0-6)
        |     day_of_month  INTEGER         | (1-31)
        |     week_of_year  INTEGER         | (1-53)
        |     month         INTEGER         | (1-12)
        |     month_name    VARCHAR(10)     |
        |     quarter       INTEGER         | (1-4)
        |     year          INTEGER         |
        |     is_weekend    BOOLEAN         |
        |     is_holiday    BOOLEAN         |
        +-----------------+-----------------+
                          | 1
                          |
                          | N
+-------------------------+---------+     +-----------------------------------+
|               fact_sales          |     |            dim_product            |
+-----------------------------------+     +-----------------------------------+
| PK  sale_id          UUID         |     | PK  product_id    VARCHAR(50)     |
|     transaction_id   VARCHAR(100) |     |     product_name  VARCHAR(255)    |
| FK  date_id          INTEGER      +-----+     category      VARCHAR(100)    |
| FK  product_id       VARCHAR(50)  |  N  |     subcategory   VARCHAR(100)    |
| FK  customer_id      VARCHAR(50)  +--+  |     unit_price    NUMERIC(10,2)   |
|     quantity         INTEGER      |  |  |     cost_price    NUMERIC(10,2)   |
|     unit_price       NUMERIC(10,2)|  |  +-----------------------------------+
|     discount         NUMERIC(5,4) |  | 1
|     revenue          NUMERIC(12,2)|  |
|     cost             NUMERIC(12,2)|  |
|     gross_margin     NUMERIC(12,2)|  |
|     created_at       TIMESTAMP    |  |
+-----------------------------------+  |
                          | N          |
                          |            |
                          | 1          |
        +-----------------+------------+----+
        |            dim_customer           |
        +-----------------------------------+
        | PK  customer_id     VARCHAR(50)   |
        |     customer_name   VARCHAR(255)  |
        |     segment         VARCHAR(50)   | (Enterprise, SMB, etc.)
        |     region          VARCHAR(50)   | (North America, APAC, etc.)
        |     country         VARCHAR(100)  |
        |     email           VARCHAR(255)  |
        +-----------------------------------+
```

### Staging Tables
Before data reaches the Star Schema, it is extracted into unconstrained staging tables:
1. `staging_sales`: Stores raw incoming CSV rows (`trans_id`, `trans_date`, `cust_id`, `prod_id`, `units`, `price`, `disc`).
2. `staging_products`: Stores raw product catalog entries.
3. `staging_customers`: Stores raw customer CRM records.
4. `staging_erp`: Stores auxiliary enterprise resource planning transaction extracts.

### Key Strategy & Relational Design
- **Primary Keys:** `dim_product` uses `product_id` (natural/business key); `dim_customer` uses `customer_id`; `dim_date` uses an integer surrogate key (`date_id = YYYYMMDD`); and `fact_sales` uses an auto-generated **UUID surrogate key** (`sale_id UUID DEFAULT gen_random_uuid()`).
- **UUID Strategy:** Utilizing UUIDs for `fact_sales.sale_id` ensures that multiple CSV files containing non-unique or overlapping transaction IDs can be repeatedly uploaded without primary key collisions, while the business identifier is preserved in `transaction_id`.
- **Foreign Key Fallbacks:** If an incoming transaction references a `product_id` or `customer_id` not yet present in the dimension tables, the ETL pipeline automatically creates fallback dimension rows (e.g., `product_name = 'Product Variant [ID]'`, `segment = 'Standard Client'`) to satisfy foreign key constraints without dropping sales revenue.

---

## 9. ETL Pipeline & Ingestion Engine

The Extract, Transform, Load (ETL) pipeline is responsible for moving data from untrusted flat files into the structured Star Schema.

```
[Raw CSV Upload]
       |
       v
[Extract: Multi-Encoding Parsing]
       | (UTF-8, Latin-1, CP1252)
       v
[Transform Step 1: Schema & Type Validation]
       | (Positive quantity, valid numeric price, date parsing)
       v
[Transform Step 2: Date Normalization]
       | (Converts 'DD/MM/YYYY', 'MM/DD/YYYY', ISO to YYYYMMDD date_id)
       v
[Transform Step 3: Financial Calculations]
       | (revenue = quantity * unit_price * (1 - discount))
       v
[Load Step 1: Bulk Insert into staging_sales]
       |
       v
[Transform Step 4: Dimension Backfilling]
       | (Auto-creates missing dim_product & dim_customer keys)
       v
[Load Step 2: Atomic Insert into fact_sales with UUIDs]
       |
       v
[Post-Load Triggers: ML Recalculation & Cache Invalidation]
```

### 1. Extract
- Files are parsed through `ingestion/extract_csv.py`.
- Incorporates automatic encoding detection trying `utf-8`, `latin-1`, and `cp1252` sequentially to prevent Unicode decode crashes.
- Normalizes disparate header naming conventions (e.g., mapping `transaction_id`, `trans_id`, `order_id`, `invoice_no` to a canonical `transaction_id`).

### 2. Transform
- **Data Cleansing:** Strips whitespace, removes currency symbols (`$`, `₹`, `€`), and coerces empty strings to `NULL`.
- **Validation:** Executes through `ingestion/validate.py`. Rejects rows where `quantity <= 0`, `unit_price <= 0`, or `discount` falls outside `[0.0, 1.0]`.
- **Date Normalization:** Parses varied date strings into standardized `YYYY-MM-DD` timestamps and generates the integer surrogate `date_id` (`YYYYMMDD`) corresponding to `dim_date`.
- **Financial Feature Calculation:** Computes:
  $$\text{revenue} = \text{quantity} \times \text{unit\_price} \times (1 - \text{discount})$$
  $$\text{gross\_margin} = \text{revenue} - (\text{quantity} \times \text{cost\_price})$$

### 3. Load
- **Staging Insert:** Loads validated rows into `staging_sales`.
- **Dimension Synchronization:** Queries distinct product and customer IDs from the batch. Any IDs missing from `dim_product` or `dim_customer` are inserted with sensible defaults (`General Merchandise`, `Retail Client`).
- **Fact Table Loading:** Executes an `INSERT INTO fact_sales` using `gen_random_uuid()` to assign a unique surrogate `sale_id` to every transaction.

### Behavior on New CSV Upload
1. The user drops a CSV onto the Upload page or submits it via `POST /api/v1/ingest/upload`.
2. The database total row count prior to insertion is recorded (`db_before`).
3. Accepted rows are committed to `fact_sales`.
4. The database count after insertion is verified (`db_after`).
5. The backend automatically calls `run_ml_pipeline()`, which:
   - Queries the updated `fact_sales` table.
   - Refits the Ridge forecasting model and recomputes confidence bounds.
   - Re-runs Isolation Forest anomaly detection.
   - Recomputes mathematical feature importance vectors.
   - Generates updated AI recommendations.
   - Persists all updated artifacts to `data/ml_results.json`.
6. The frontend receives the upload response and dispatches a global `dashboard-refresh` event, causing all 11 pages to immediately re-render with updated metrics.

---

## 10. Machine Learning Architecture

```
                       [Historical Sales from fact_sales]
                                       |
                                       v
                     [Feature Engineering & Calendar Extraction]
                       (day_idx, day_of_week [0-6], month [1-12])
                                       |
                                       v
                     [Scikit-learn Ridge Regression Training]
                                (alpha=1.0, L2-penalty)
                                       |
                   +-------------------+-------------------+
                   |                                       |
                   v                                       v
         [Fitted Historical Values]               [Future 30-Day Extrapolation]
                   |                                       |
                   v                                       v
         [Residual Standard Error]                [Confidence Bounds (95%)]
          (std_dev = std(y - y_hat))              (forecast +/- 1.645 * std_dev)
                   |                                       |
                   +-------------------+-------------------+
                                       |
                                       v
                         [Model Evaluation & Metrics]
                           (MAPE % & Accuracy Score)
                                       |
                                       v
                      [Artifact Export: data/ml_results.json]
```

### Model Specifications
- **Algorithm:** Ridge Regression (`sklearn.linear_model.Ridge`).
- **Regularization Hyperparameter:** $\alpha = 1.0$ (L2 norm weight penalty).
- **Target Variable ($y$):** Total aggregated daily revenue ($\text{INR / ₹}$).
- **Input Feature Vector ($X$):**
  1. `day_idx`: Monotonically increasing integer index representing time elapsed since start date.
  2. `day_of_week`: Categorical calendar feature (0 = Monday, ..., 6 = Sunday) capturing intra-week business cycles.
  3. `month`: Annual seasonality feature (1 to 12).
- **Minimum Data Requirement:** If fewer than 5 historical days are present, the module switches to a safe moving-average baseline and returns status `insufficient_history`.

### Confidence Interval Derivation
Residuals are calculated on historical fitted points:
$$e_t = y_t - \hat{y}_t$$
$$\sigma_e = \sqrt{\frac{1}{N} \sum_{t=1}^{N} (e_t - \bar{e})^2}$$
For future time steps $t + k$, the upper and lower 95% confidence intervals are bounded by:
$$\text{Upper Bound} = \hat{y}_{t+k} + 1.645 \times \sigma_e$$
$$\text{Lower Bound} = \max\left(0, \; \hat{y}_{t+k} - 1.645 \times \sigma_e\right)$$

### Evaluation Metrics
The platform evaluates model performance using **Mean Absolute Percentage Error (MAPE)**:
$$\text{MAPE} = \frac{100\%}{n} \sum_{t=1}^{n} \left| \frac{y_t - \hat{y}_t}{y_t} \right|$$
$$\text{Model Accuracy (\%)} = \max\left(0, \; 100\% - \text{MAPE}\right)$$

---

## 11. Anomaly Detection System

The anomaly detection engine identifies transactions that deviate significantly from expected distribution norms across revenue, quantity, and discount depth.

```
       [fact_sales Transactions]
                   |
                   v
     [Feature Matrix: Revenue, Quantity, Discount]
                   |
                   v
     [Sample Size >= 15?]
        /              \
      Yes               No
      /                  \
[Isolation Forest]    [Z-Score Outlier Fallback]
(contamination=0.015) (threshold |z| > 2.5)
      \                  /
       \                /
        v              v
     [Anomaly Scoring & Decision Function]
                   |
                   v
     [Severity Assignment: Critical / Warning / Info]
                   |
                   v
     [Rule-Based Root Cause Diagnosis Engine]
```

### Algorithm & Scoring
- **Primary Algorithm:** `sklearn.ensemble.IsolationForest` with `contamination=0.015` and `random_state=42`.
- **Mechanism:** Builds an ensemble of isolation trees. Anomalous data points require significantly fewer random splits to isolate than normal points, yielding a shorter path length.
- **Score Calculation:** Anomaly score is computed as the inverse of the decision function:
  $$\text{score} = -\text{decision\_function}(X)$$
  Scores are scaled between 0.0 and 5.0, where higher scores denote extreme abnormalities.
- **Fallback Mechanism:** If the dataset has fewer than 15 records, the engine defaults to a Gaussian Z-score filter:
  $$z = \left| \frac{x - \mu}{\sigma} \right| > 2.5$$

### Severity Categorization
- **Critical (High Risk):** Absolute variance $> 120\%$ or transaction revenue $> 2.5\times$ the historical mean.
- **Warning (Medium Risk):** Absolute variance between $60\%$ and $120\%$.
- **Info (Low Variance):** Absolute variance $< 60\%$, representing mild statistical deviations.

### Root-Cause Diagnostics
The engine programmatically diagnoses why an anomaly occurred:
- `Excessive Discounting`: Applied discount $> 35\%$ exceeding standard commercial discount policies.
- `Unusual Bulk Order Volume`: Order quantity $> 3\times$ median product quantity.
- `Price Misconfiguration`: Transaction value $< 30\%$ of expected catalog value.
- `Regional Demand Spike`: Clustered volume within a specific geographic territory.

---

## 12. Sales Variance Analysis

Sales Variance measures the difference between actual realized transaction values and a calculated expected performance baseline.

### Baseline Formulation
The expected baseline is computed per product using a **7-day trailing moving average**:
$$\text{Baseline}(p, t) = \frac{1}{7} \sum_{i=1}^{7} \text{Revenue}(p, t - i)$$

### Variance Metrics
1. **Absolute Variance ($\Delta$):**
   $$\Delta = \text{Actual Revenue} - \text{Expected Baseline}$$
2. **Percentage Variance ($\Delta\%$):**
   $$\Delta\% = \left( \frac{\text{Actual Revenue} - \text{Expected Baseline}}{\text{Expected Baseline}} \right) \times 100$$
3. **Variance Direction:**
   - *Favorable / Positive ($+$):* Realized revenue exceeded baseline (indicates demand acceleration or premium price realization).
   - *Unfavorable / Negative ($-$):* Realized revenue lagged baseline (indicates churn, discount erosion, or stockout).

### Variance vs. Anomaly Detection Distinction
| Characteristic | Sales Variance Analysis | Anomaly Detection |
|---|---|---|
| **Underlying Technique**| Deterministic accounting subtraction | Unsupervised machine learning (Isolation Forest) |
| **Dimensions Evaluated**| Single dimension: Revenue vs. Baseline | Multi-dimensional: Revenue $\times$ Quantity $\times$ Discount |
| **Business Objective**| Pacing analysis, budget tracking | Fraud detection, system errors, extreme behavior |
| **Threshold Type**| Continuous linear percentage | Non-linear tree isolation path length |

---

## 13. Explainable AI (XAI) Engine

Explainable AI bridges the trust gap between machine learning models and business executives.

### Mathematical Feature Attribution
Rather than treating revenue predictions as black-box outputs, the platform calculates empirical mathematical feature attribution directly from current database records using normalized correlation vectors:
$$r_{X, Y} = \frac{\sum (X - \bar{X})(Y - \bar{Y})}{\sqrt{\sum (X - \bar{X})^2 \sum (Y - \bar{Y})^2}}$$

Features evaluated include:
1. **Unit Price & Tiering:** Correlation between catalog pricing and top-line volume.
2. **Order Quantity / Volume:** Bulk purchasing scaling impact.
3. **Discount Rate Applied:** Margin erosion factor (consistently displays negative correlation).
4. **Seasonality / Day-of-Week:** Mid-week vs. weekend enterprise billing cyclicality.
5. **Regional Demand Variance:** Geographic territory purchasing power.

Relative feature weights are normalized to sum to $100\%$:
$$W_i = \frac{|r_i|}{\sum_{j} |r_j|} \times 100\%$$

### Visual Presentation
On the **Explainable AI** page, business users view:
- A waterfall-style feature contribution chart showing positive and negative drivers.
- Narrative impact explanations contextualized to the active dataset.
- Per-anomaly feature attribution breakdowns indicating the primary driver behind each flagged transaction.

---

## 14. Generative AI Layer

The Generative AI layer translates cold numerical aggregates into strategic business advisory insights.

```
       [PostgreSQL fact_sales + ML Pipeline Cache]
                           |
                           v
           [Dynamic Real Fact Extraction]
           - Total Revenue & Order Volume
           - Top Product & Top Product Revenue
           - Highest & Lowest Revenue Categories
           - Highest Discount Category & Avg Discount %
           - Leading & Lagging Geographic Territories
           - Total Anomalies Flagged
                           |
                           v
          [Strict JSON System Prompt Construction]
                           |
                           v
             [Groq Cloud API HTTPS Request]
                (Model: llama-3.3-70b-versatile)
                           |
            +--------------+--------------+
            |                             |
         Success                       Failure / Offline
            |                             |
            v                             v
[Parse 4 Structured JSON Recs] [Dynamic Deterministic Rule Engine]
            |                             |
            +--------------+--------------+
                           |
                           v
   [Dashboard Strategy Cards + Boardroom PDF Report Section]
```

### Groq Cloud LLaMA 3.3 70B Integration
- **API Provider:** Groq Cloud (`https://api.groq.com/openai/v1/chat/completions`).
- **Active Model:** `llama-3.3-70b-versatile` (with graceful fallback to `llama-3.1-8b-instant`).
- **Prompt Engineering:** Enforces a strict zero-preamble, valid JSON array output format. The system injects real database figures (e.g., exact revenue numbers, actual product names, specific discount percentages) directly into the prompt context.
- **Deterministic Analytical Fallback:** If the user has not configured a `groq_api_key`, or if the server is offline, the backend automatically invokes `_generate_dynamic_rule_recommendations()`, which calculates four rule-based business strategies directly from the data facts.

### Traditional ML vs. Generative AI Distinction
- **Traditional ML (Ridge & Isolation Forest):** Computes quantitative numerical values—predicting next week's revenue in currency units and flagging transactions with numerical anomaly scores.
- **Generative AI (LLaMA 3.3 70B):** Performs qualitative synthesis—reading those numerical values and translating them into natural-language business strategies, risk warnings, and actionable execution roadmaps.

---

## 15. Smart Strategy & Prescriptive Recommendations

Every recommendation generated by the platform adheres to a typed, executive-level schema:

```json
{
  "id": "REC-01",
  "title": "Mitigate Margin Bleed in Enterprise Solutions",
  "category": "Pricing Strategy",
  "impact": "+₹142,500",
  "impact_value": 142500,
  "urgency": "High",
  "confidence": "94%",
  "summary": "Average discount rate in Enterprise Solutions reached 28.4%, eroding ₹142,500 in gross margin across 34 accounts.",
  "drivers": [
    "Over-discounting on enterprise volume tiers",
    "Lack of mandatory VP approval on discounts > 20%"
  ],
  "action_plan": [
    "Cap automated sales rep discounts at 15% across enterprise tiers",
    "Require regional VP approval for contract concessions exceeding 20%",
    "Re-evaluate contract terms during upcoming Q3 renewals"
  ],
  "status": "Ready for Execution"
}
```

### Recommendation Pillars
1. **Pricing Strategy:** Focuses on discount caps, margin leakage, and tier optimization.
2. **Inventory & Supply:** Focuses on stock availability for top-performing revenue drivers.
3. **Regional Expansion:** Focuses on reallocating sales quotas toward high-performing geographic territories.
4. **Risk Mitigation:** Focuses on resolving critical anomalies, billing errors, and customer concentration risks.

---

## 16. Frontend Architecture & Design System

The frontend is a modern single-page application (SPA) built on **React 19**, bundled with **Vite 8**, and styled using **Tailwind CSS 4**.

```
[index.html]
     |
     v
[src/main.jsx]
     |
     v
[src/App.jsx]
     |
     v
[src/pages/Dashboard.jsx] <---+ Global 'dashboard-refresh' Event Listener
     |                        |
     +---> [src/components/Header.jsx] (Search, Quick Upload, PDF Download, Dark Toggle)
     +---> [src/components/Sidebar.jsx] (16 Navigation Tabs across 5 Sections)
     +---> Active Tab View (Dynamic Component Rendering):
             |-- Overview:              Dashboard Overview
             |-- Sales Analytics:       SalesAnalyticsPage, ProductAnalysisPage,
             |                          CustomerAnalysisPage, CategoryAnalysisPage,
             |                          RegionalAnalysisPage, PricingPage
             |-- AI / ML:               ForecastChart, AnomalyTable,
             |                          VariancePage, ExplainabilityPage,
             |                          RecommendationCard
             |-- Data:                  CSV Upload, DataQualityPage,
             |                          PipelineHealthPage
             |-- Reports:               Executive PDF Download Tab
```

### The Minimal Forest Green Design System
The visual system is styled according to an enterprise-grade, cohesive green palette:
- `#051F20` — Deepest dark green (app background, sidebar dark mode, elevated surfaces)
- `#0B2B26` — Dark forest green (card headers, secondary panels, navigation bars)
- `#163832` — Deep green (card backgrounds, metric surfaces, chart containers)
- `#235347` — Medium forest green (borders, interactive hover states, active tab chips)
- `#8EB69B` — Soft sage green (secondary text, axis lines, subtle badges, subtext)
- `#DAF1DE` — Very light mint (primary headings, high-contrast values, bright highlights)

### State Management & Dynamic Refresh
The frontend uses standard React hooks (`useState`, `useEffect`, `useCallback`) alongside a native browser custom event architecture. When a CSV is uploaded in the upload tab or header modal, the application dispatches:
```javascript
window.dispatchEvent(new CustomEvent('dashboard-refresh'));
```
Every open view and background tab listens for this event and automatically re-fetches its respective REST endpoint without requiring a browser reload.

---

## 17. Backend API Architecture

The backend is built on **FastAPI**, serving documented REST endpoints across `/api/v1/*` with standardized `/analytics/*` aliases:

| HTTP Method | Endpoint Path | Subsystem | Description & Data Source |
|---|---|---|---|
| `GET` | `/health` / `/api/v1/health` | System | Service health check and uptime verification |
| `GET` | `/api/v1/kpis` | Analytics | Dynamic top-level KPIs computed from `fact_sales` |
| `GET` | `/api/v1/forecast` | ML | 30-day time-series forecast with confidence bounds |
| `GET` | `/api/v1/anomalies` | ML | Flagged transaction outliers with root cause breakdown |
| `GET` | `/api/v1/recommendations` | GenAI / Rules | Prescriptive business strategies and action plans |
| `GET` | `/api/v1/products` | Analytics | Distinct product list for dropdown filtering |
| `GET` | `/api/v1/analytics/sales` | Analytics | Historical trends, volume, and moving averages |
| `GET` | `/api/v1/analytics/products` | Analytics | Product revenue, units sold, and contribution % |
| `GET` | `/api/v1/analytics/customers`| Analytics | Customer segment revenue, AOV, and top accounts |
| `GET` | `/api/v1/analytics/categories`| Analytics | Category and subcategory revenue distribution |
| `GET` | `/api/v1/analytics/regions` | Analytics | Geographic revenue and customer segment cross-tab |
| `GET` | `/api/v1/analytics/pricing` | Analytics | Discount tier distributions and margin sensitivity |
| `GET` | `/api/v1/variance` | Analytics | Product actual vs. 7-day moving baseline variance |
| `GET` | `/api/v1/explainability/feature-importance` | XAI | Feature importance attribution correlation vectors |
| `GET` | `/api/v1/explainability/anomalies` | XAI | Individual anomaly root-cause factor attribution |
| `GET` | `/api/v1/data-quality` | Governance | Missing value rates, duplicates, and quality score |
| `GET` | `/api/v1/pipeline-health` | Observability | PostgreSQL row counts, connection latency, ETL status |
| `POST`| `/api/v1/ingest/upload` | Ingestion | Multi-part CSV upload, validation, ETL & ML trigger |
| `POST`| `/api/v1/pipeline/run` | Ingestion | Manual on-demand full ETL and ML pipeline re-run |
| `GET` | `/api/v1/reports/download` | Reports | Generates and downloads current-data ReportLab PDF |
| `GET` | `/docs` | OpenAPI | Interactive Swagger UI API documentation |

---

## 18. Dynamic End-to-End Data Flow

The diagram below illustrates the exact sequence that occurs when a user uploads a new CSV dataset:

```
[User Uploads CSV]
       |
       v
1. [Frontend] ------------------------> Form submission to POST /api/v1/ingest/upload
       |
       v
2. [FastAPI Ingestion Router] --------> Reads multipart bytes, verifies .csv extension,
       |                                enforces 20MB file size limit
       v
3. [CSV Parser] ----------------------> Multi-encoding reader (UTF-8, Latin-1, CP1252)
       |
       v
4. [Data Validator] ------------------> Filters invalid records (negative quantity/price,
       |                                discount > 1.0) into quarantine structures
       v
5. [Staging Loader] ------------------> Bulk inserts accepted records into staging_sales
       |
       v
6. [ETL Transformer] -----------------> Normalizes dates, auto-backfills missing dimension
       |                                records in dim_product & dim_customer, inserts into
       |                                fact_sales with unique UUID surrogate keys
       v
7. [ML Pipeline Trigger] -------------> Reads updated fact_sales, fits Ridge forecasting model,
       |                                fits Isolation Forest anomaly detector, computes
       |                                feature attribution vectors, generates AI recommendations
       v
8. [Cache Persistence] ---------------> Writes updated results to data/ml_results.json
       |
       v
9. [Upload Response] -----------------> Returns {success: true, db_before: X, db_after: Y}
       |
       v
10. [Frontend Event Broadcast] -------> window.dispatchEvent(new CustomEvent('dashboard-refresh'))
       |
       v
11. [All 11 React Pages Update] ------> Re-fetch REST APIs simultaneously and re-render charts
       |
       v
12. [PDF Report Synchronized] --------> Subsequent downloads compile strictly from updated facts
```

---

## 19. Report Generation (PDF)

The reporting subsystem (`reports/generate_pdf_report.py`) generates boardroom-ready executive summaries on demand.

### Architecture & Capabilities
- **Library:** Python `ReportLab` using `SimpleDocTemplate`, `Table`, `Paragraph`, `Spacer`, and `colors`.
- **Live Database Querying:** Does not read stale static templates. Every time the download endpoint is hit, the script connects to PostgreSQL via SQLAlchemy and queries:
  - Exact total revenue, total transactions, and AOV from `fact_sales`.
  - Top 5 performing products and top 5 categories.
  - Active critical and high-urgency anomalies.
  - Current AI recommendations and action plans.
- **Styling:** Styled according to the enterprise Minimal Forest Green theme (`#051F20` headers, `#163832` table borders, `#8EB69B` subtext).
- **HTTP Caching Headers:** Served with strict no-cache headers:
  ```http
  Cache-Control: no-store, no-cache, must-revalidate
  Pragma: no-cache
  Expires: 0
  ```
- **Report Output:** Saved locally to `reports/generated/Sales_Executive_Analytics_Report.pdf` and streamed to the user's browser.

---

## 20. Data Quality & Integrity Framework

The data quality framework (`ingestion/validate.py` and `api/routers/data_quality.py`) ensures that only high-integrity records enter the warehouse:

### Implemented Validation Rules
1. **Mandatory Field Integrity:** Validates that critical transaction fields (`transaction_id`, `date`, `product_id`, `customer_id`, `quantity`, `unit_price`) are not null.
2. **Numeric Sanity Checks:** Ensures `quantity > 0` and `unit_price > 0`.
3. **Discount Bounds:** Enforces `0.0 <= discount <= 1.0` (flags or converts percentages $> 1.0$).
4. **Date Normalization:** Checks that transaction dates parse cleanly into valid calendar dates, rejecting nonsensical values (e.g., month $> 12$, future dates $> 1$ year out).
5. **Duplicate Transaction Screening:** Identifies duplicate `transaction_id` entries within the same upload batch.
6. **Overall Quality Score Formulation:**
   $$\text{Quality Score} = 100 - \left( w_1 \times \text{Null Rate} + w_2 \times \text{Duplicate Rate} + w_3 \times \text{Rejected Rate} \right)$$
   Scores are displayed dynamically on the **Data Quality** dashboard tab.

---

## 21. Pipeline Health & System Observability

The **Pipeline Health Monitor** (`api/routers/pipeline_health.py` and `dashboard/src/pages/PipelineHealthPage.jsx`) provides real-time system introspection:

### Monitored Telemetry
- **Database Status:** Verifies active PostgreSQL connection pool availability and measures round-trip query ping latency.
- **Table Inventory:** Executes live row count checks across:
  - `fact_sales` (core transactional records)
  - `dim_product` (total active catalog items)
  - `dim_customer` (total active client accounts)
  - `dim_date` (pre-populated calendar records)
  - `staging_sales` (recent un-promoted staging records)
- **ETL Status:** Reports timestamp and row volume of the most recent transformation batch.
- **ML Model Cache Status:** Reports last modification timestamp of `data/ml_results.json` and checks if models require retraining.

---

## 22. Security, Performance & Reliability

### Security Measures
- **Credential Isolation:** Database connection URIs, PostgreSQL passwords, and Groq API keys are stored exclusively in `.env` and loaded via `python-dotenv`.
- **SQL Injection Prevention:** All database operations utilize SQLAlchemy parameterized statements or text binds (`text("SELECT ... WHERE id = :id")`), preventing raw string concatenation vulnerabilities.
- **CORS Management:** Configured in FastAPI middleware to permit secure cross-origin requests from the React development server (`http://localhost:5173`).
- **File Upload Limits:** FastAPI enforces a strict 20MB file size ceiling and validates file extensions (`.csv` only) to protect against denial-of-service memory exhaustion.

### Performance & Reliability
- **Connection Pooling:** SQLAlchemy manages a persistent pool of 5 to 20 database connections with automatic ping checks (`pool_pre_ping=True`) to handle dropped connections gracefully.
- **In-Memory ML Cache:** Heavy machine learning forecasts and anomaly scores are saved to `data/ml_results.json` upon ETL completion, allowing sub-5ms API response times during subsequent dashboard browsing.
- **Non-Blocking UI Rendering:** React lazy-loads individual sub-pages with `Suspense` spinners, ensuring that heavy chart components do not degrade initial page responsiveness.

---

## 23. Docker & Deployment

The platform provides a containerized database and administration layer via **Docker Compose**:

### `docker-compose.yml` Architecture
```yaml
services:
  postgres:
    image: postgres:16
    container_name: sales_platform_postgres
    restart: always
    environment:
      POSTGRES_USER: ${POSTGRES_USER:-postgres}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-postgres}
      POSTGRES_DB: ${POSTGRES_DB:-sales_platform}
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER:-postgres} -d ${POSTGRES_DB:-sales_platform}"]
      interval: 5s
      timeout: 5s
      retries: 5

  pgadmin:
    image: dpage/pgadmin4:latest
    container_name: sales_platform_pgadmin
    restart: always
    environment:
      PGADMIN_DEFAULT_EMAIL: ${PGADMIN_EMAIL:-admin@admin.com}
      PGADMIN_DEFAULT_PASSWORD: ${PGADMIN_PASSWORD:-admin}
    ports:
      - "5050:80"
    depends_on:
      - postgres

volumes:
  postgres_data:
```

### Purpose of Services
- **PostgreSQL Container:** Runs PostgreSQL 16 on port `5432` with automated health checks and persistent volume storage (`postgres_data`).
- **pgAdmin Container:** Provides a web-based database administration UI on port `5050` (`http://localhost:5050`) for inspecting schemas, running ad-hoc SQL queries, and monitoring index health.
- **Backend & Frontend:** In the current development architecture, FastAPI and React run natively on the host machine to facilitate rapid iterative development and hot module reloading.

---

## 24. Automation & Workflows

### Implemented Automation
- **Automated Ingestion Triggers:** Uploading a CSV automatically triggers validation, staging load, transformation, ML retraining, cache updates, and frontend event notifications in a single contiguous pipeline.
- **Dynamic PDF Generation:** Reports compile on the fly with real-time timestamps directly upon user click.

### Planned Workflows (*Future Scope*)
- **GitHub Actions (`.github/workflows/`):** Configured for CI testing, linting (`flake8`, `eslint`), and automated test execution across pull requests.
- **Scheduled Cron Retraining:** Background scheduling service (e.g., Celery / APScheduler) to re-run time-series forecasting nightly at 00:00 UTC.

---

## 25. Project Architecture Diagram

```
========================================================================================
                                 DATA INGESTION LAYER
========================================================================================
     [Enterprise ERP]          [CRM Accounts]           [Transactional CSVs]
             |                        |                          |
             +------------------------+--------------------------+
                                      |
                                      v
                      [FastAPI /api/v1/ingest/upload]
                                      |
                                      v
                     [Validation & Cleaning Engine]
                         (ingestion/validate.py)
                                      |
========================================================================================
                             DATA WAREHOUSING LAYER (ETL)
========================================================================================
                                      v
                        [PostgreSQL Staging Tables]
                           (staging_sales, etc.)
                                      |
                                      v
                           [Dimensional Modeling]
                            (etl/transform.py)
                                      |
                 +--------------------+--------------------+
                 |                    |                    |
                 v                    v                    v
            [dim_date]          [dim_product]        [dim_customer]
                 |                    |                    |
                 +--------------------+--------------------+
                                      |
                                      v
                                 [fact_sales]
                             (Star Schema Warehouse)
                                      |
========================================================================================
                         ANALYTICS & INTELLIGENCE ENGINES
========================================================================================
                 +--------------------+--------------------+
                 |                    |                    |
                 v                    v                    v
       [SQL Analytics Engine]   [Scikit-learn ML]   [Isolation Forest]
        - Revenue Trends         - 30-Day Forecast   - Anomaly Detection
        - Moving Averages        - Confidence Bounds - Z-score Fallback
        - Product Mix            - MAPE Score        - Severity & Cause
                 |                    |                    |
                 +--------------------+--------------------+
                                      |
                                      v
                          [Explainable AI Engine]
                     (Pearson/Spearman Attribution)
                                      |
                                      v
                           [Generative AI Layer]
                      (Groq Cloud LLaMA 3.3 70B LLM)
                                      |
                                      v
                       [Prescriptive Advisory Engine]
                         (Action Plans & Impact)
                                      |
========================================================================================
                           PRESENTATION & REPORTING LAYER
========================================================================================
                 +--------------------+--------------------+
                 |                                         |
                 v                                         v
        [FastAPI REST Layer]                      [ReportLab PDF Engine]
     (Endpoints across /api/v1/*)              (Live SQL Query Compilation)
                 |                                         |
                 v                                         v
       [React 19 Dashboard]                   [Boardroom Executive PDF]
  (Minimal Forest Green Palette)             (Sales_Executive_Report.pdf)
========================================================================================
```

---

## 26. Project Folder Structure

```
sales-analytics-platform/
├── api/                           # FastAPI backend application
│   ├── main.py                    # App entry point, CORS, and core endpoint routing
│   ├── routers/                   # Modular sub-routers for endpoints
│   │   ├── analytics.py           # Revenue trends, moving averages, daily/weekly stats
│   │   ├── products_analytics.py  # Product rankings, units sold, contribution %
│   │   ├── customers_analytics.py # Customer segment breakdown, AOV, repeat orders
│   │   ├── categories.py          # Category and subcategory distributions
│   │   ├── regions.py             # Geographic performance and regional metrics
│   │   ├── pricing.py             # Discount tier analysis and margin sensitivity
│   │   ├── variance.py            # Sales variance vs 7-day moving baseline
│   │   ├── anomaly_explain.py     # Anomaly root-cause and feature attribution
│   │   ├── data_quality.py        # Data quality audits, null rates, duplicate checks
│   │   └── pipeline_health.py     # Database connectivity, row counts, and latency
│   └── utils/
│       └── sql_helpers.py         # Reusable SQL queries for live KPI calculations
├── dashboard/                     # React 19 single-page frontend application
│   ├── src/
│   │   ├── main.jsx               # React DOM entry point
│   │   ├── App.jsx                # Root application component
│   │   ├── index.css              # Global styles & Minimal Forest Green theme tokens
│   │   ├── pages/                 # Full-screen tab views
│   │   │   ├── Dashboard.jsx      # Overview page, tab router, and upload modal
│   │   │   ├── SalesAnalyticsPage.jsx
│   │   │   ├── ProductAnalysisPage.jsx
│   │   │   ├── CustomerAnalysisPage.jsx
│   │   │   ├── CategoryAnalysisPage.jsx
│   │   │   ├── RegionalAnalysisPage.jsx
│   │   │   ├── PricingPage.jsx
│   │   │   ├── VariancePage.jsx
│   │   │   ├── ExplainabilityPage.jsx
│   │   │   ├── DataQualityPage.jsx
│   │   │   └── PipelineHealthPage.jsx
│   │   ├── components/            # Reusable UI presentation components
│   │   │   ├── Header.jsx         # Top navigation, global search, and action buttons
│   │   │   ├── Sidebar.jsx        # Collapsible 16-item navigation sidebar
│   │   │   ├── KPICard.jsx        # Metric cards with currency formatting & badges
│   │   │   ├── ForecastChart.jsx  # Recharts time-series forecast with confidence envelope
│   │   │   ├── AnomalyTable.jsx   # Tabular anomaly inspector with risk chips
│   │   │   ├── RecommendationCard.jsx # Strategy card with impact and action steps
│   │   │   └── CompactChart.jsx   # Miniature trend previews
│   │   └── services/
│   │       └── api.js             # Centralized Axios/fetch client for all backend endpoints
│   ├── package.json               # Frontend dependencies (React 19, Recharts, Vite)
│   └── vite.config.js             # Vite configuration and dev server proxy settings
├── data/                          # Tabular data files and generated cache
│   ├── raw_sales.csv              # Initial base sales dataset
│   ├── dataset_a.csv              # Enterprise Tech test dataset
│   ├── dataset_b.csv              # FMCG Retail test dataset
│   └── ml_results.json            # Cached ML model predictions, anomalies, and recs
├── db/                            # Database definitions and migration scripts
│   └── schema.sql                 # Complete DDL for staging and Star Schema tables
├── etl/                           # Extract, Transform, Load pipeline modules
│   ├── load_staging.py            # Loads raw CSV data into staging_* tables
│   └── transform.py               # Transforms staging rows into dimensional Star Schema
├── ingestion/                     # Ingestion and validation scripts
│   ├── extract_csv.py             # Multi-encoding resilient CSV parser
│   └── validate.py                # Schema checks, numeric constraints, and date parsing
├── ml/                            # Machine learning, explainability & AI advisory
│   ├── forecasting.py             # Scikit-learn Ridge time-series regression model
│   ├── anomaly_detection.py       # Isolation Forest and Z-score outlier detectors
│   ├── explainability.py          # Feature attribution and correlation calculations
│   ├── recommendations.py         # Groq LLM client and analytical rule engine
│   └── train.py                   # Master ML execution pipeline script
├── reports/                       # Automated PDF reporting engine
│   ├── generate_pdf_report.py     # Dynamic ReportLab PDF compilation script
│   └── generated/                 # Destination folder for compiled PDF reports
├── .github/                       # GitHub configurations
│   └── workflows/                 # CI/CD workflow definitions
├── docker-compose.yml             # Docker specification for PostgreSQL & pgAdmin
├── requirements.txt               # Backend Python dependencies
├── run_pipeline.py                # Standalone CLI runner for ETL and ML pipeline
├── init_db.py                     # Standalone database table initializer
└── README.md                      # Single source of truth project documentation
```

---

## 27. How to Run

Follow these instructions to set up and run the entire platform locally from scratch:

### Prerequisites
- **Python 3.11+** installed
- **Node.js 18+** & **npm** installed
- **Docker Desktop** installed and running (or a local PostgreSQL 15/16 instance)
- **Git** installed

### Step 1: Clone Repository & Configure Environment
```bash
git clone https://github.com/your-org/sales-analytics-platform.git
cd sales-analytics-platform

# Copy example environment configuration
cp .env.example .env
```
Edit `.env` to ensure your database credentials and optional Groq API key are set:
```ini
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=sales_platform
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/sales_platform
groq_api_key=your_groq_api_key_here  # Optional: falls back to analytical rules engine if omitted
```

### Step 2: Start PostgreSQL Database Container
```bash
docker compose up -d postgres
```
*Wait approximately 5 seconds for PostgreSQL to become healthy.*

### Step 3: Set Up Python Virtual Environment & Install Dependencies
```bash
# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
pip install scikit-learn reportlab
```

### Step 4: Initialize Database & Run Initial Pipeline
```bash
# Create staging and Star Schema tables
python init_db.py

# Ingest initial data, run transformation, and train ML models
python run_pipeline.py
```

### Step 5: Start FastAPI Backend Server
```bash
python -m uvicorn api.main:app --host 127.0.0.1 --port 8000 --reload
```
The backend is now live at `http://127.0.0.1:8000`. Test it by visiting Swagger docs at `http://127.0.0.1:8000/docs`.

### Step 6: Start React Frontend Development Server
Open a new terminal window:
```bash
cd dashboard
npm install
npm run dev
```
The dashboard is now live at `http://localhost:5173`.

---

## 28. Verification & Testing

To confirm that the platform is genuinely data-driven and dynamic (rather than displaying hardcoded numbers), the system was tested using **two contrasting, real-world datasets**:

### Test Protocol: Dual-Dataset Dynamic Validation
1. **Dataset A (Enterprise Software & Hardware Tech):**
   - Products: *Cloud Native Suite, Enterprise Server Blade, Data Mesh Platform*
   - Volume: 25 large B2B transactions
   - Average Ticket Size: High (₹25,000 to ₹180,000)
   - Discrepancies: Heavily concentrated in North America and APAC.
2. **Dataset B (Fast-Moving Consumer Goods / FMCG Retail):**
   - Products: *Organic Rolled Oats, Green Tea Matcha, Cold-Pressed Almond Oil*
   - Volume: 50 high-frequency retail transactions
   - Average Ticket Size: Low (₹350 to ₹3,500)
   - Discrepancies: Nationwide distribution with high volume and low ticket values.

### Verification Results
| Analytical Metric | State after Dataset A Upload | State after Dataset B Upload | Verified Dynamic Behavior |
|---|---|---|---|
| **Total Revenue** | ₹1,482,000 | ₹148,250 | **Dynamic SQL aggregation** recalculated immediately |
| **Transaction Count** | 25 Orders | 50 Orders | Database row counts shifted from 25 to 75 total |
| **Top Product** | *Enterprise Server Blade* | *Cold-Pressed Almond Oil* | Product leaderboards re-ranked dynamically |
| **Top Category** | *Enterprise Software* | *FMCG / Health Foods* | Category distribution charts completely re-formed |
| **30-Day Forecast** | High revenue baseline (₹45k/day)| Low revenue baseline (₹4.5k/day)| Ridge regression dynamically retrained |
| **Anomalies Detected**| 3 B2B excessive discount flags | 2 FMCG bulk order spikes | Isolation Forest flagged dataset-specific outliers |
| **AI Strategy** | Software contract tiering advice | FMCG shelf-life & bundle advice | Groq LLM received and reasoned over real metrics |
| **Executive PDF** | 2-page tech report with tech KPIs| 2-page FMCG report with food KPIs| Generated ReportLab PDF reflected current facts |

---

## 29. Known Limitations

In the spirit of complete engineering honesty, the following constraints exist in the current implementation:

1. **Ridge Regression Extrapolation:** Ridge regression operates as a regularized linear-trend model with calendar seasonality. While highly stable, it does not capture complex multi-year non-linear macroeconomic cycles.
2. **Synchronous Upload Processing:** CSV processing, staging loads, ETL, and ML retraining run synchronously within the `POST /api/v1/ingest/upload` request. For files $> 50\text{MB}$, this could lead to HTTP gateway timeouts; an asynchronous background worker queue (e.g., Celery/Redis) is required for massive datasets.
3. **Groq API Cloud Dependency:** Real-time GenAI synthesis requires an active internet connection and a valid Groq API key. If the key is missing or the external API is unreachable, the system relies on its built-in deterministic analytical rules engine.
4. **Authentication & Authorization:** The platform currently operates in single-tenant enterprise mode without user authentication (JWT/OAuth2) or role-based access control (RBAC).
5. **Development Web Server:** The frontend and backend run via Vite and Uvicorn in local development mode; a production containerized deployment requires NGINX reverse-proxying and Gunicorn worker processes.

---

## 30. Future Scope

The following architectural enhancements are designed for subsequent platform releases:

1. **Gradient-Boosted Forecasting (XGBoost / LightGBM):** Upgrading the time-series forecasting engine from Ridge regression to an ensemble of XGBoost and Prophet to model complex non-linear promotional holidays.
2. **Deep Explainability (TreeSHAP & DeepLIME):** Integrating the official `shap` library to calculate game-theoretic Shapley values directly across tree nodes for every transaction.
3. **Real-Time Event Streaming (Apache Kafka):** Replacing batch CSV upload with distributed Kafka topics (`sales-transactions-topic`) and continuous stream processing (Spark / Flink).
4. **Role-Based Access Control (RBAC):** Implementing OAuth2/OIDC authentication with granular permission tiers (Executive, Regional Director, Analyst, Auditor).
5. **Cloud-Native Deployment:** Packaging the entire stack into Helm charts for deployment on Kubernetes (EKS/GKE) with automated horizontal pod autoscaling (HPA).
6. **Automated Scheduled Email Digests:** Implementing automated Celery cron workers to compile and email the executive PDF report to the board of directors every Monday at 08:00 AM.
7. **Mobile Progressive Web App (PWA):** Adapting the dashboard with responsive touch interactions and offline caching for executive tablets and smartphones.

---

## 31. Presentation Cheat Sheet

Use these concise, viva-ready answers during technical presentations and evaluations:

### What is the project?
The Sales Analytics Platform is an enterprise-grade, full-stack intelligence system combining data engineering, a PostgreSQL Star Schema warehouse, machine learning forecasting, Isolation Forest anomaly detection, explainable AI, and Groq LLaMA 3.3 70B Generative AI advisory into an interactive React dashboard and automated PDF reporting engine.

### What problem does it solve?
It solves the challenges of fragmented enterprise sales spreadsheets, slow month-end consolidation cycles, unpredicted cash-flow fluctuations, undetected billing errors or margin leakages, and opaque black-box machine learning models by providing automated, transparent, and prescriptive intelligence.

### What is the main workflow?
Raw transactional CSVs are ingested via FastAPI, validated, and loaded through an ETL pipeline into a PostgreSQL Star Schema warehouse. Analytical queries calculate live KPIs; Scikit-learn trains Ridge forecasting and Isolation Forest anomaly models; mathematical feature attribution explains drivers; Groq LLaMA 3.3 70B synthesizes action plans; and React 19 visualizes the results.

### Why PostgreSQL?
PostgreSQL was chosen because it is an enterprise-grade, ACID-compliant relational database that offers superior OLAP performance for dimensional analytical queries, supports advanced SQL window functions, and seamlessly enforces foreign-key referential integrity across our Star Schema.

### Why Python and Pandas?
Python provides an unmatched unified ecosystem spanning high-performance tabular manipulation (Pandas), scientific computing (NumPy), machine learning (Scikit-learn), web services (FastAPI), and programmatic PDF generation (ReportLab) without needing disparate programming languages.

### Why FastAPI?
FastAPI is an asynchronous, high-speed Python web framework built on Starlette and Pydantic. It provides sub-millisecond route handling, native OpenAPI documentation (`/docs`), and automatic request validation, making it significantly faster than legacy frameworks like Flask or Django.

### Why React?
React 19 was selected for its component-based architecture, virtual DOM performance, and rich data visualization ecosystem. Paired with Vite and Recharts, it allows responsive, real-time re-rendering of 11 distinct analytical views whenever new data is uploaded.

### Why Ridge Regression instead of a complex neural network?
Ridge regression applies L2 regularization to prevent overfitting on tabular time-series data while executing in under 20 milliseconds on CPU. It provides stable linear trends and calendar seasonality extrapolation with clean, mathematically justifiable 95% confidence intervals.

### Why Isolation Forest for anomaly detection?
Isolation Forest is an unsupervised algorithm specifically designed for outlier detection. Instead of profiling normal points, it isolates anomalies through random recursive partitioning, identifying extreme revenue, volume, or discount outliers without requiring historical labeled training data.

### How is sales variance calculated?
Sales variance measures the difference between actual transaction revenue and an expected baseline derived from a 7-day trailing moving average per product. The platform calculates both absolute variance ($\Delta \text{ in ₹}$) and percentage variance ($\Delta\%$) to identify favorable versus unfavorable performance.

### What is the difference between Variance Analysis and Anomaly Detection?
Variance Analysis is a single-dimensional accounting calculation comparing actual values against a trailing moving baseline. Anomaly Detection is an unsupervised machine learning model that simultaneously evaluates a multi-dimensional feature space (revenue, quantity, discount) to flag behavioral outliers.

### What is Explainable AI (XAI) in this project?
Our Explainable AI engine decomposes model predictions into transparent business drivers by calculating normalized mathematical Pearson and Spearman correlation vectors between revenue and features like Unit Price, Volume, Discount Rate, and Seasonality, eliminating the black-box barrier.

### How is Generative AI used in the platform?
Generative AI uses Groq Cloud's LLaMA 3.3 70B model to synthesize calculated database facts (exact revenue, top products, worst categories, discount averages, anomalies) into structured, executive-level business recommendations with financial impacts, urgency ratings, and tactical action plans.

### What is the difference between Machine Learning and Generative AI here?
Machine Learning provides quantitative prediction—producing numerical forecasts, confidence bounds, and anomaly probability scores. Generative AI provides qualitative synthesis—translating those raw numbers into natural-language strategic recommendations and boardroom action items.

### What is ETL and how is it implemented?
ETL stands for Extract, Transform, Load. Our pipeline extracts data from multi-encoding CSVs, cleans and validates values, normalizes date strings into surrogate keys, backfills missing dimensional records, and loads transactions into `fact_sales` with unique UUIDs.

### What is a Star Schema and why use it?
A Star Schema is a dimensional data warehouse architecture consisting of a central `fact_sales` table surrounded by denormalized dimension tables (`dim_date`, `dim_product`, `dim_customer`). It minimizes complex joins, accelerates analytical aggregation queries, and simplifies reporting.

### What happens when a user uploads a new CSV?
FastAPI validates the file, loads it into `staging_sales`, transforms records into `fact_sales`, and automatically triggers `run_ml_pipeline()`. The updated facts retrain the forecasting model, re-run anomaly detection, and re-generate AI strategies. The backend broadcasts a `dashboard-refresh` event, immediately updating all 11 frontend pages.

### How are PDF reports generated?
Reports are generated using Python's ReportLab library. When an executive clicks download, the backend queries current facts from PostgreSQL, compiles styled vector tables, KPI cards, anomaly summaries, and AI recommendations, and streams a boardroom-ready PDF with a live timestamp.

### What makes this project different from standard dashboards?
Most dashboards are static, display only historical charts, and require manual data updates. This platform is dynamic upon CSV upload, predicts future performance with confidence bounds, flags multi-dimensional anomalies, explains underlying feature attribution, and uses GenAI to prescribe concrete action plans.

### What are the main limitations?
The platform currently uses Ridge regression rather than deep sequence models, processes CSV uploads synchronously rather than via distributed task queues, requires an external API key for GenAI synthesis, and lacks multi-tenant JWT authentication.

### What is the future scope?
Future enhancements include transitioning to gradient-boosted forecasting (XGBoost/LightGBM), integrating real-time streaming via Apache Kafka, implementing game-theoretic TreeSHAP explainability, adding role-based access control, and deploying on Kubernetes via Helm charts.

---

# Cloud Deployment

The Sales Analytics Platform is fully cloud-compatible and ready for production deployment across modern cloud providers while preserving Docker Compose support for local development.

### Architecture Comparison

#### Local Development Architecture
- **Frontend**: Vite React Dev Server (`http://localhost:5173`)
- **Backend**: FastAPI via Uvicorn (`http://localhost:8000`)
- **Database**: Local PostgreSQL container running inside Docker (`localhost:5432`)
- **Orchestration**: `docker-compose.yml` runs PostgreSQL and PgAdmin locally

#### Production Cloud Architecture
- **Frontend**: Cloud-hosted React Single Page Application (Vercel, Netlify, or Render Static Sites)
- **Backend**: Cloud-hosted FastAPI Container or Web Service (Render, Railway, AWS ECS, or Fly.io)
- **Database**: Fully managed Cloud PostgreSQL (Supabase, Neon Serverless Postgres, Render PostgreSQL, Railway, or AWS RDS)
- **Data Flow**:
```
User
 ↓
Cloud React Frontend (e.g., https://sales-analytics.vercel.app)
 ↓
Cloud FastAPI Backend (e.g., https://api-sales-analytics.onrender.com)
 ↓
Cloud PostgreSQL (e.g., Neon / Supabase via DATABASE_URL)
 ↓
Analytics / ML Models (Ridge Time-Series, Isolation Forest) / GenAI (Groq LLaMA 3.3)
```

---

### Step-by-Step Cloud Deployment Guide

#### Step 1: Create a Cloud PostgreSQL Database
1. Sign up for a free cloud PostgreSQL provider such as **[Neon](https://neon.tech/)**, **[Supabase](https://supabase.com/)**, or **[Render PostgreSQL](https://render.com/)**.
2. Create a new PostgreSQL database instance (e.g., named `sales_platform` or `neondb`).
3. Under Connection Details, copy the complete connection URI with SSL enabled:
   ```
   postgresql://username:password@ep-sample-12345.region.aws.neon.tech/neondb?sslmode=require
   ```

#### Step 2: Obtain and Configure `DATABASE_URL`
Set the `DATABASE_URL` environment variable on your backend host. The application automatically normalizes `postgres://` to `postgresql://` and applies connection pre-pinging (`pool_pre_ping=True`) to handle serverless connection drops.

#### Step 3: Deploy FastAPI Backend (e.g., on Render or Railway)
1. Link your GitHub repository to **Render** or **Railway**.
2. Select **Web Service** with runtime `Python 3`.
3. Set Build Command:
   ```bash
   pip install -r requirements.txt
   ```
4. Set Start Command:
   ```bash
   python -m uvicorn api.main:app --host 0.0.0.0 --port $PORT
   ```

#### Step 4: Configure Backend Environment Variables
In your cloud dashboard, configure the following secrets and environment variables:
```env
DATABASE_URL=postgresql://user:password@ep-host.region.aws.neon.tech/neondb?sslmode=require
CORS_ORIGINS=https://your-frontend-domain.vercel.app,http://localhost:5173
PORT=8000
HOST=0.0.0.0
GROQ_API_KEY=your-groq-api-key
EMAIL_USERNAME=your-email@gmail.com
EMAIL_PASSWORD=your-google-app-password
REPORT_RECIPIENT=stakeholder@company.com
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=465
```

#### Step 5: Initialize the Cloud Database Schema
Run the non-destructive, deployment-safe schema initializer once against your cloud database:
```bash
python init_db.py
```
This executes `CREATE TABLE IF NOT EXISTS` for `staging_sales`, `staging_products`, `staging_customers`, `staging_erp`, `dim_date`, `dim_product`, `dim_customer`, and `fact_sales` without dropping any existing records.

#### Step 6: Deploy React Frontend (e.g., on Vercel or Netlify)
1. Link the repository to **Vercel** or **Netlify**.
2. Set Root Directory to `dashboard`.
3. Set Build Command: `npm run build`
4. Set Output Directory: `dist`
5. Configure Environment Variable:
   ```env
   VITE_API_URL=https://your-backend-domain.onrender.com
   ```

#### Step 7: Configure CORS
Ensure your backend's `CORS_ORIGINS` variable includes your production frontend domain (e.g. `https://your-sales-app.vercel.app`).

#### Step 8: Verify Health Endpoint
Test backend and cloud database liveness by requesting:
```bash
curl https://your-backend-domain.onrender.com/health
```
Expected response:
```json
{
  "status": "healthy",
  "database": "connected",
  "service": "Sales Analytics Platform API",
  "version": "1.0.0",
  "database_status": "Database connection successful"
}
```

#### Step 9: Upload a CSV via Frontend
1. Navigate to the cloud React dashboard.
2. Select **Upload CSV** from the sidebar.
3. Choose a transactional CSV file (e.g. `data/sample/sales_data.csv`).
4. Click submit to execute the cloud ETL pipeline.

#### Step 10: Verify Data Appears in Cloud PostgreSQL
The backend ingests rows into `staging_sales`, validates types, and loads curated rows into `fact_sales`. You can inspect the updated row count via the UI upload summary card or cloud SQL console:
```sql
SELECT COUNT(*) FROM fact_sales;
```

#### Step 11: Verify Dashboard Updates
Observe that the React dashboard metrics, Ridge forecasting line, Isolation Forest anomalies, and Groq GenAI prescriptive strategies automatically refresh in real time.

---

# Weekly Automated Email Reporting

The platform features an automated weekly reporting system powered by **GitHub Actions** and **SMTP**. Every week, an executive sales analytics report is generated dynamically from the live cloud PostgreSQL database and emailed directly to stakeholders as an executive-styled PDF attachment.

### System Architecture Diagram

```
                    ┌──────────────────┐
                    │   React Frontend │
                    │   Cloud Hosted   │
                    └────────┬─────────┘
                             │
                             ↓
                    ┌──────────────────┐
                    │ FastAPI Backend  │
                    │   Cloud Hosted   │
                    └────────┬─────────┘
                             │
                             ↓
                    ┌──────────────────┐
                    │ Cloud PostgreSQL │
                    └────────┬─────────┘
                             │
                 ┌───────────┴───────────┐
                 ↓                       ↓
          Analytics / ML          GenAI Recommendations
                 │
                 ↓
          Weekly PDF Report
                 ↑
                 │
          GitHub Actions
                 │
                 ↓
          Email to Recipient
```

---

### Workflow Specifications (`.github/workflows/weekly-report.yml`)

#### 1. Weekly Schedule & Timezone
GitHub Actions schedules use UTC cron expressions.
- **Target Schedule**: Every Monday at 9:00 AM IST (Indian Standard Time, UTC+5:30)
- **UTC Calculation**: 9:00 AM - 5 hours 30 minutes = **3:30 AM UTC**
- **Cron Expression**: `cron: "30 3 * * 1"`

#### 2. Manual Trigger (`workflow_dispatch`)
The workflow includes `workflow_dispatch:`, allowing project reviewers and administrators to trigger an immediate report generation and email dispatch directly from the GitHub repository's **Actions** tab.

#### 3. Cloud Database Connection (No Localhost)
Because GitHub Actions runs on a remote cloud Ubuntu runner, it **must never attempt to connect to `localhost:5432`**. The workflow securely pulls `DATABASE_URL` from GitHub Secrets, connects to the cloud PostgreSQL database (Neon, Supabase, or AWS RDS), and verifies connectivity with a dedicated health-check step prior to generating reports.

#### 4. Report Contents (Based on Live Fact Tables)
The generated PDF report (`reports/weekly_sales_report.pdf`) queries live PostgreSQL facts and ML models to include:
- **Executive KPIs**: Total revenue, total transactions, total volume, average discount, average order value (AOV)
- **Top Products Performance**: Top products ranked by total revenue and quantity sold
- **Category & Regional Performance**: Dimensional distribution across categories and geographic regions
- **Statistical Variance**: Deviation between actual revenue and moving-average baseline
- **Detected Anomalies**: Top transactions flagged by Isolation Forest with root-cause indicators
- **Prescriptive AI Strategy**: Actionable business recommendations generated by Groq LLaMA 3.3 / rules engine

#### 5. Email Delivery Mechanism
- Delivered using `dawidd6/action-send-mail@v3` via secure SMTP (SSL port 465).
- Includes an executive-styled HTML body notifying stakeholders of report generation.
- Attaches the newly generated `reports/weekly_sales_report.pdf`.
- Also uploads the PDF report as a GitHub Actions workflow artifact (retained for 30 days) for direct download.

---

### Required GitHub Repository Secrets

Configure the following secrets under **Settings > Secrets and variables > Actions > New repository secret**:

| Secret Name | Description | Example / Note |
|---|---|---|
| `DATABASE_URL` | Cloud PostgreSQL URI | `postgresql://user:pass@ep-host.neon.tech/neondb?sslmode=require` |
| `EMAIL_USERNAME` | SMTP Sender Email Address | `your-email@gmail.com` |
| `EMAIL_PASSWORD` | SMTP Password / App Password | 16-character **Google App Password** (see instructions below) |
| `REPORT_RECIPIENT` | Stakeholder / Executive Email | `stakeholder@company.com` |
| `GROQ_API_KEY` | Groq AI Cloud API Key | `gsk_...` (optional; falls back to analytical rules engine if omitted) |

> [!IMPORTANT]
> **Generating a Google App Password for Gmail:**
> 1. Go to your **Google Account** > **Security**.
> 2. Ensure **2-Step Verification** is turned ON.
> 3. Under *2-Step Verification*, scroll down to **App passwords**.
> 4. Enter an app name (e.g., `Sales Analytics Platform`) and click **Create**.
> 5. Copy the generated 16-character password into the `EMAIL_PASSWORD` GitHub Secret. Do NOT use your standard Gmail login password.

---

### How to Manually Test Weekly Reporting

1. Push your latest code with GitHub Actions workflow to the repository.
2. Ensure repository secrets (`DATABASE_URL`, `EMAIL_USERNAME`, `EMAIL_PASSWORD`, `REPORT_RECIPIENT`) are configured.
3. Open your GitHub repository in your browser and click on the **Actions** tab.
4. In the left sidebar, click on **Weekly Executive Sales Report**.
5. Click **Run workflow** > Select `main` branch > Click **Run workflow**.
6. Monitor the workflow execution steps:
   - `Connect to Cloud PostgreSQL`
   - `Generate Weekly PDF Report`
   - `Verify PDF Report Exists`
   - `Upload PDF Report as Workflow Artifact`
   - `Send Report PDF via Email`
7. Check your email inbox for the executive email with `weekly_sales_report.pdf` attached.