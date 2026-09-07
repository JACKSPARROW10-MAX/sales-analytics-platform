# Sales Analytics Platform — Day 1 Foundation

Welcome to the **Sales Analytics Platform**. This project is an end-to-end sales analysis platform featuring an automated pipeline:
External Data Sources (PostgreSQL / CSV / APIs / ERP) → ETL (Python + Pandas + SQLAlchemy) → PostgreSQL DB → Feature Engineering → ML (forecasting + anomaly detection) → SHAP / LIME explainability → GenAI recommendation engine → FastAPI backend → React + Power BI dashboards → GitHub Actions weekly retraining → Email reports.

### 🔧 Recent Updates
- **CSV uploads now always insert new rows** (unique UUID `sale_id`), ensuring dashboards reflect every new record.
- **PDF report endpoint** now disables caching and generates a fresh report on each request.
- **Dashboard UI**: Replaced the large forecast chart with three compact visualizations using a new `CompactChart` component for clearer, at‑glance insights.
- Added `CompactChart.jsx` component for reusable small charts.
- Updated imports and layout in `Dashboard.jsx` accordingly.
- Refactored code to use `gen_random_uuid()` and enabled the `pgcrypto` extension for UUID generation.


---

## 📁 Project Structure

```text
sales-analytics-platform/
│
├── .github/
│   └── workflows/          # GitHub Actions automated retraining & deployment workflows
├── api/                    # FastAPI backend services
├── dashboard/              # React & Power BI frontend dashboards
├── data/
│   ├── raw/                # Raw ingested data landing zone
│   └── sample/             # Generated synthetic & mock datasets
│       ├── sales_data.csv        # ~2000 synthetic transactions w/ 1.5% anomalies
│       ├── erp_sales_data.csv    # Synthetic legacy ERP dataset (DD/MM/YYYY dates)
│       └── external_feature.csv  # Macroeconomic / weather external features
├── db/                     # Database schema definition & initialization scripts
│   ├── schema.sql          # PostgreSQL DDL for staging & star schema tables
│   └── init_db.py          # SQLAlchemy database setup & verification script
├── etl/                    # Extraction, Transformation, and Loading pipelines
├── ingestion/              # Data ingestion scripts & mock data generators
│   ├── generate_sample_sales.py  # Primary sales sample dataset generator
│   ├── mock_erp_generator.py     # Legacy ERP mock dataset generator
│   └── mock_api_source.py        # Public weather/currency API feature puller
├── ml/                     # Forecasting & anomaly detection models
├── reports/                # Automated PDF / Email report templates
├── .env.example            # Environment variables template
├── docker-compose.yml      # Docker configuration for PostgreSQL & pgAdmin4
├── requirements.txt        # Python dependencies
└── README.md               # Project documentation
```

---

## 🚀 Quickstart Guide

### 1. Environment Setup
Copy `.env.example` to create your local `.env` configuration:
```bash
cp .env.example .env
```

Install Python dependencies:
```bash
pip install -r requirements.txt
```

### 2. Start PostgreSQL & pgAdmin Containers
Spin up the PostgreSQL 16 database and pgAdmin 4 services in detached mode:
```bash
docker-compose up -d
```
- **PostgreSQL Database**: `localhost:5432` (`sales_platform`)
- **pgAdmin 4 Dashboard**: [http://localhost:5050](http://localhost:5050) (Login: `admin@admin.com` / `admin`)

### 3. Initialize Database Schema
Run the initialization script to execute `db/schema.sql` and verify table creation:
```bash
python db/init_db.py
```

---

## 📊 Database Schema Overview

The database uses a clean **Star Schema** alongside staging tables for raw data landing:

### Staging Tables (Minimally typed landing zone):
- `staging_sales`
- `staging_products`
- `staging_customers`
- `staging_erp`

### Curated Star Schema Tables:
- `dim_date` (date_id PK, full_date, day, month, quarter, year, is_weekend)
- `dim_product` (product_id PK, product_name, category, subcategory, unit_price)
- `dim_customer` (customer_id PK, customer_name, region, segment)
- `fact_sales` (sale_id PK, date_id FK, product_id FK, customer_id FK, quantity, revenue, discount, source_system)