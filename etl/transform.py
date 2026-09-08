import pandas as pd
import logging
from sqlalchemy import create_engine, text
from sqlalchemy.exc import SQLAlchemyError
from dotenv import load_dotenv
import os
from datetime import datetime, timedelta

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

load_dotenv()

from db.connection import get_db_connection, get_database_url

def build_dim_date(engine, min_date: str = None, max_date: str = None) -> int:
    """
    Build dim_date table with full calendar range covering the data.
    
    Args:
        engine: SQLAlchemy engine
        min_date: Optional minimum date (if None, reads from staging_sales)
        max_date: Optional maximum date (if None, reads from staging_sales)
    
    Returns:
        Number of rows inserted
    """
    logger.info("Building dim_date dimension")
    
    # Get date range from staging if not provided
    if min_date is None or max_date is None:
        try:
            with engine.connect() as conn:
                result = conn.execute(text("""
                    SELECT 
                        MIN(sale_date::date) as min_date,
                        MAX(sale_date::date) as max_date
                    FROM staging_sales
                    WHERE sale_date IS NOT NULL
                """))
                row = result.fetchone()
                if row and row[0] and row[1]:
                    min_date = row[0]
                    max_date = row[1]
                else:
                    logger.warning("No dates found in staging_sales, using default range")
                    min_date = '2025-01-01'
                    max_date = '2025-12-31'
        except SQLAlchemyError as e:
            logger.error(f"Error reading date range from staging: {e}")
            min_date = '2025-01-01'
            max_date = '2025-12-31'
    
    # Generate date range
    start_date = pd.to_datetime(min_date)
    end_date = pd.to_datetime(max_date)
    
    # Add buffer to ensure full coverage
    start_date = start_date - timedelta(days=7)
    end_date = end_date + timedelta(days=7)
    
    date_range = pd.date_range(start=start_date, end=end_date, freq='D')
    
    # Build dimension DataFrame
    dim_date_df = pd.DataFrame({
        'full_date': date_range,
        'date_id': date_range.strftime('%Y%m%d').astype(int),
        'day': date_range.day,
        'month': date_range.month,
        'quarter': date_range.quarter,
        'year': date_range.year,
        'is_weekend': date_range.dayofweek >= 5
    })
    
    logger.info(f"Generated {len(dim_date_df)} dates from {min_date} to {max_date}")
    
    # Insert using ON CONFLICT DO NOTHING for idempotency
    try:
        with engine.connect() as conn:
            rows_inserted = 0
            for _, row in dim_date_df.iterrows():
                result = conn.execute(text("""
                    INSERT INTO dim_date (date_id, full_date, day, month, quarter, year, is_weekend)
                    VALUES (:date_id, :full_date, :day, :month, :quarter, :year, :is_weekend)
                    ON CONFLICT (date_id) DO NOTHING
                """), {
                    'date_id': row['date_id'],
                    'full_date': row['full_date'],
                    'day': row['day'],
                    'month': row['month'],
                    'quarter': row['quarter'],
                    'year': row['year'],
                    'is_weekend': row['is_weekend']
                })
                if result.rowcount > 0:
                    rows_inserted += 1
            
            conn.commit()
            
        logger.info(f"Successfully loaded {rows_inserted} rows to dim_date")
        return rows_inserted
    
    except SQLAlchemyError as e:
        logger.error(f"Error building dim_date: {e}")
        raise


def build_dim_product(engine) -> int:
    """
    Build dim_product dimension from staging_products.
    Uses upsert on natural key (product_id).
    """
    logger.info("Building dim_product dimension")
    
    try:
        with engine.connect() as conn:
            # First ensure default unknown product exists
            conn.execute(text("""
                INSERT INTO dim_product (product_id, product_name, category, subcategory, unit_price)
                VALUES ('PRD-UNKNOWN', 'Unknown Product', 'General', 'Standard', 100.0)
                ON CONFLICT (product_id) DO NOTHING;
            """))
            conn.commit()

            # Read from staging_products
            staging_products = pd.read_sql(
                "SELECT DISTINCT product_id, product_name, category, subcategory, unit_price FROM staging_products",
                conn
            )
            
            if staging_products.empty:
                logger.warning("No data in staging_products")
                return 1
            
            # Clean and convert unit_price
            staging_products['unit_price'] = pd.to_numeric(staging_products['unit_price'], errors='coerce').fillna(100.0)
            staging_products['product_name'] = staging_products['product_name'].fillna(staging_products['product_id'])
            staging_products['category'] = staging_products['category'].fillna('General')
            staging_products['subcategory'] = staging_products['subcategory'].fillna('Standard')
            
            # Upsert using ON CONFLICT DO UPDATE
            for _, row in staging_products.iterrows():
                conn.execute(text("""
                    INSERT INTO dim_product (product_id, product_name, category, subcategory, unit_price)
                    VALUES (:product_id, :product_name, :category, :subcategory, :unit_price)
                    ON CONFLICT (product_id) 
                    DO UPDATE SET 
                        product_name = EXCLUDED.product_name,
                        category = EXCLUDED.category,
                        subcategory = EXCLUDED.subcategory,
                        unit_price = EXCLUDED.unit_price
                """), {
                    'product_id': str(row['product_id']),
                    'product_name': str(row['product_name']),
                    'category': str(row['category']),
                    'subcategory': str(row['subcategory']),
                    'unit_price': float(row['unit_price'])
                })
            
            conn.commit()
            logger.info(f"Successfully upserted {len(staging_products)} rows to dim_product")
            return len(staging_products)
    
    except SQLAlchemyError as e:
        logger.error(f"Error building dim_product: {e}")
        raise


def build_dim_customer(engine) -> int:
    """
    Build dim_customer dimension from staging_customers.
    Uses upsert on natural key (customer_id).
    """
    logger.info("Building dim_customer dimension")
    
    try:
        with engine.connect() as conn:
            # First ensure default unknown customer exists
            conn.execute(text("""
                INSERT INTO dim_customer (customer_id, customer_name, region, segment)
                VALUES ('CUST-UNKNOWN', 'Standard Customer', 'Global', 'Corporate')
                ON CONFLICT (customer_id) DO NOTHING;
            """))
            conn.commit()

            # Read from staging_customers
            staging_customers = pd.read_sql(
                "SELECT DISTINCT customer_id, customer_name, region, segment FROM staging_customers",
                conn
            )
            
            if staging_customers.empty:
                logger.warning("No data in staging_customers")
                return 1
            
            staging_customers['customer_name'] = staging_customers['customer_name'].fillna(staging_customers['customer_id'])
            staging_customers['region'] = staging_customers['region'].fillna('Global')
            staging_customers['segment'] = staging_customers['segment'].fillna('Corporate')

            # Upsert using ON CONFLICT DO UPDATE
            for _, row in staging_customers.iterrows():
                conn.execute(text("""
                    INSERT INTO dim_customer (customer_id, customer_name, region, segment)
                    VALUES (:customer_id, :customer_name, :region, :segment)
                    ON CONFLICT (customer_id) 
                    DO UPDATE SET 
                        customer_name = EXCLUDED.customer_name,
                        region = EXCLUDED.region,
                        segment = EXCLUDED.segment
                """), {
                    'customer_id': str(row['customer_id']),
                    'customer_name': str(row['customer_name']),
                    'region': str(row['region']),
                    'segment': str(row['segment'])
                })
            
            conn.commit()
            logger.info(f"Successfully upserted {len(staging_customers)} rows to dim_customer")
            return len(staging_customers)
    
    except SQLAlchemyError as e:
        logger.error(f"Error building dim_customer: {e}")
        raise


def build_fact_sales(engine) -> int:
    """
    Build fact_sales from staging_sales, joining with dimension tables.
    Inserts fresh records with unique sale_id.
    """
    logger.info("Building fact_sales fact table")
    
    try:
        with engine.connect() as conn:
            # Also auto-insert any missing product_ids or customer_ids from staging_sales into dimensions
            conn.execute(text("""
                INSERT INTO dim_product (product_id, product_name, category, subcategory, unit_price)
                SELECT DISTINCT s.product_id, s.product_id, 'General', 'Standard', 100.0
                FROM staging_sales s
                WHERE s.product_id IS NOT NULL
                  AND NOT EXISTS (SELECT 1 FROM dim_product dp WHERE dp.product_id = s.product_id)
                ON CONFLICT (product_id) DO NOTHING;
            """))
            conn.execute(text("""
                INSERT INTO dim_customer (customer_id, customer_name, region, segment)
                SELECT DISTINCT s.customer_id, s.customer_id, COALESCE(s.region, 'Global'), 'Corporate'
                FROM staging_sales s
                WHERE s.customer_id IS NOT NULL
                  AND NOT EXISTS (SELECT 1 FROM dim_customer dc WHERE dc.customer_id = s.customer_id)
                ON CONFLICT (customer_id) DO NOTHING;
            """))
            conn.commit()

            insert_sql = text("""
                INSERT INTO fact_sales (sale_id, date_id, product_id, customer_id, quantity, revenue, discount, source_system)
                SELECT 
                    gen_random_uuid(),
                    dd.date_id,
                    COALESCE(dp.product_id, 'PRD-UNKNOWN'),
                    COALESCE(dc.customer_id, 'CUST-UNKNOWN'),
                    CAST(s.quantity AS INTEGER),
                    CAST(s.total_amount AS NUMERIC(12,2)),
                    COALESCE(CAST(s.discount AS NUMERIC(5,2)), 0.00),
                    'POS'
                FROM staging_sales s
                JOIN dim_date dd ON dd.full_date = s.sale_date::date
                LEFT JOIN dim_product dp ON s.product_id = dp.product_id
                LEFT JOIN dim_customer dc ON s.customer_id = dc.customer_id
                WHERE s.sale_date IS NOT NULL
                  AND s.quantity IS NOT NULL
                  AND s.total_amount IS NOT NULL
                  AND CAST(s.quantity AS NUMERIC) >= 0
                  AND CAST(s.total_amount AS NUMERIC) >= 0;
            """)
            res = conn.execute(insert_sql)
            conn.commit()
            rows_inserted = res.rowcount if res.rowcount >= 0 else 0
            logger.info(f"Successfully inserted {rows_inserted} rows to fact_sales")
            return rows_inserted
    
    except SQLAlchemyError as e:
        logger.error(f"Error building fact_sales: {e}")
        raise


def run_transform(engine = None) -> dict:
    """
    Run complete transformation from staging to curated layers.
    
    Args:
        engine: SQLAlchemy engine (if None, creates new connection)
    
    Returns:
        Dictionary with row counts for each table
    """
    if engine is None:
        engine = get_db_connection()
    
    results = {}
    
    try:
        # Build dimensions
        results['dim_date'] = build_dim_date(engine)
        results['dim_product'] = build_dim_product(engine)
        results['dim_customer'] = build_dim_customer(engine)
        
        # Build fact table
        results['fact_sales'] = build_fact_sales(engine)
        
        logger.info(f"Transformation complete: {results}")
        return results
    
    except Exception as e:
        logger.error(f"Error during transformation: {e}")
        raise


if __name__ == "__main__":
    # Test transformation
    engine = get_db_connection()
    results = run_transform(engine)
    print(f"Transform results: {results}")
