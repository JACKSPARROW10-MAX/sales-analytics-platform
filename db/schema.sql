-- PostgreSQL Database Schema for Sales Analytics Platform

-- Clean up existing tables if re-initializing
DROP TABLE IF EXISTS fact_sales CASCADE;
DROP TABLE IF EXISTS dim_customer CASCADE;
DROP TABLE IF EXISTS dim_product CASCADE;
DROP TABLE IF EXISTS dim_date CASCADE;
DROP TABLE IF EXISTS staging_sales CASCADE;
DROP TABLE IF EXISTS staging_products CASCADE;
DROP TABLE IF EXISTS staging_customers CASCADE;
DROP TABLE IF EXISTS staging_erp CASCADE;

-- ============================================================================
-- STAGING TABLES (Raw, minimally typed)
-- ============================================================================

CREATE TABLE staging_sales (
    raw_id SERIAL PRIMARY KEY,
    transaction_id VARCHAR(100),
    sale_date VARCHAR(50),
    product_id VARCHAR(50),
    customer_id VARCHAR(50),
    region VARCHAR(50),
    quantity VARCHAR(50),
    unit_price VARCHAR(50),
    discount VARCHAR(50),
    total_amount VARCHAR(50),
    ingested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE staging_products (
    raw_id SERIAL PRIMARY KEY,
    product_id VARCHAR(50),
    product_name VARCHAR(255),
    category VARCHAR(100),
    subcategory VARCHAR(100),
    unit_price VARCHAR(50),
    ingested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE staging_customers (
    raw_id SERIAL PRIMARY KEY,
    customer_id VARCHAR(50),
    customer_name VARCHAR(255),
    region VARCHAR(100),
    segment VARCHAR(100),
    ingested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE staging_erp (
    raw_id SERIAL PRIMARY KEY,
    erp_order_ref VARCHAR(100),
    trans_dt VARCHAR(50),
    prod_code VARCHAR(50),
    cust_id VARCHAR(50),
    qty_sold VARCHAR(50),
    unit_val VARCHAR(50),
    total_val VARCHAR(50),
    disc_pct VARCHAR(50),
    sys_flag VARCHAR(50),
    ingested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- CURATED STAR-SCHEMA TABLES
-- ============================================================================

CREATE TABLE dim_date (
    date_id INT PRIMARY KEY,              -- Format: YYYYMMDD
    full_date DATE UNIQUE NOT NULL,
    day INT NOT NULL,
    month INT NOT NULL,
    quarter INT NOT NULL,
    year INT NOT NULL,
    is_weekend BOOLEAN NOT NULL
);

CREATE TABLE dim_product (
    product_id VARCHAR(50) PRIMARY KEY,
    product_name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    subcategory VARCHAR(100),
    unit_price NUMERIC(10, 2) NOT NULL
);

CREATE TABLE dim_customer (
    customer_id VARCHAR(50) PRIMARY KEY,
    customer_name VARCHAR(255) NOT NULL,
    region VARCHAR(100) NOT NULL,
    segment VARCHAR(100) NOT NULL
);

CREATE TABLE fact_sales (
    sale_id VARCHAR(100) PRIMARY KEY,
    date_id INT NOT NULL REFERENCES dim_date(date_id),
    product_id VARCHAR(50) NOT NULL REFERENCES dim_product(product_id),
    customer_id VARCHAR(50) NOT NULL REFERENCES dim_customer(customer_id),
    quantity INT NOT NULL,
    revenue NUMERIC(12, 2) NOT NULL,
    discount NUMERIC(5, 2) DEFAULT 0.00,
    source_system VARCHAR(50) DEFAULT 'POS'
);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX idx_fact_sales_date_product ON fact_sales (date_id, product_id);
CREATE INDEX idx_fact_sales_customer ON fact_sales (customer_id);
CREATE INDEX idx_fact_sales_date ON fact_sales (date_id);
CREATE INDEX idx_fact_sales_product ON fact_sales (product_id);
