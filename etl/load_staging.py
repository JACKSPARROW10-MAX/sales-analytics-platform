import pandas as pd
import logging
from sqlalchemy import create_engine, text
from sqlalchemy.exc import SQLAlchemyError
from dotenv import load_dotenv
import os

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

load_dotenv()

from db.connection import get_db_connection, get_database_url

def load_to_staging_sales(df: pd.DataFrame, engine) -> int:
    """
    Load validated sales data to staging_sales table.
    Ensures dates are normalized to YYYY-MM-DD so PostgreSQL ::date casting never fails.
    """
    if df.empty:
        logger.warning("Empty DataFrame provided to load_to_staging_sales")
        return 0
    
    logger.info(f"Loading {len(df)} rows to staging_sales")
    
    # Select only columns that exist in staging_sales
    staging_columns = ['transaction_id', 'sale_date', 'product_id', 'customer_id', 
                      'region', 'quantity', 'unit_price', 'discount', 'total_amount']
    available_columns = [col for col in staging_columns if col in df.columns]
    df_to_load = df[available_columns].copy()
    
    # Normalize sale_date to standard YYYY-MM-DD
    if 'sale_date' in df_to_load.columns:
        parsed_dates = pd.to_datetime(df_to_load['sale_date'], errors='coerce')
        # If any failed to parse directly, try common DD/MM/YYYY
        if parsed_dates.isna().any():
            fallback_dates = pd.to_datetime(df_to_load['sale_date'], format='%d/%m/%Y', errors='coerce')
            parsed_dates = parsed_dates.combine_first(fallback_dates)
        # Fallback for still unparsed: today's date
        parsed_dates = parsed_dates.fillna(pd.Timestamp.now())
        df_to_load['sale_date'] = parsed_dates.dt.strftime('%Y-%m-%d')
    
    # Ensure IDs are strings and not empty
    if 'product_id' in df_to_load.columns:
        df_to_load['product_id'] = df_to_load['product_id'].fillna('PRD-UNKNOWN').astype(str)
    if 'customer_id' in df_to_load.columns:
        df_to_load['customer_id'] = df_to_load['customer_id'].fillna('CUST-UNKNOWN').astype(str)
        
    try:
        df_to_load.to_sql(
            'staging_sales',
            engine,
            if_exists='append',
            index=False,
            chunksize=1000
        )
        logger.info(f"Successfully loaded {len(df_to_load)} rows to staging_sales")
        return len(df_to_load)
    
    except SQLAlchemyError as e:
        logger.error(f"Error loading to staging_sales: {e}")
        raise


def load_to_staging_products(df: pd.DataFrame, engine) -> int:
    """
    Load product data to staging_products table.
    Ensures product_id, product_name, category, and unit_price are always populated.
    """
    if df.empty:
        logger.warning("Empty DataFrame provided to load_to_staging_products")
        return 0
    
    logger.info(f"Loading unique products to staging_products")
    
    df_copy = df.copy()
    if 'product_id' not in df_copy.columns:
        df_copy['product_id'] = 'PRD-001'
    
    df_copy['product_id'] = df_copy['product_id'].fillna('PRD-UNKNOWN').astype(str)
    
    if 'product_name' not in df_copy.columns:
        df_copy['product_name'] = df_copy['product_id']
    else:
        df_copy['product_name'] = df_copy['product_name'].fillna(df_copy['product_id']).astype(str)
        
    if 'category' not in df_copy.columns:
        df_copy['category'] = 'General'
    else:
        df_copy['category'] = df_copy['category'].fillna('General').astype(str)
        
    if 'subcategory' not in df_copy.columns:
        df_copy['subcategory'] = 'Standard'
    else:
        df_copy['subcategory'] = df_copy['subcategory'].fillna('Standard').astype(str)
        
    if 'unit_price' not in df_copy.columns:
        if 'total_amount' in df_copy.columns and 'quantity' in df_copy.columns:
            qty = pd.to_numeric(df_copy['quantity'], errors='coerce').fillna(1).replace(0, 1)
            tot = pd.to_numeric(df_copy['total_amount'], errors='coerce').fillna(100.0)
            df_copy['unit_price'] = (tot / qty).round(2)
        else:
            df_copy['unit_price'] = 100.0
    else:
        df_copy['unit_price'] = pd.to_numeric(df_copy['unit_price'], errors='coerce').fillna(100.0)

    product_cols = ['product_id', 'product_name', 'category', 'subcategory', 'unit_price']
    df_products = df_copy[product_cols].drop_duplicates(subset=['product_id'])
    
    # Always include unknown product fallback
    unknown_prod = pd.DataFrame([{
        'product_id': 'PRD-UNKNOWN',
        'product_name': 'Unknown Product',
        'category': 'General',
        'subcategory': 'Standard',
        'unit_price': 100.0
    }])
    df_products = pd.concat([df_products, unknown_prod]).drop_duplicates(subset=['product_id'])
    
    try:
        df_products.to_sql(
            'staging_products',
            engine,
            if_exists='append',
            index=False,
            chunksize=1000
        )
        logger.info(f"Successfully loaded {len(df_products)} rows to staging_products")
        return len(df_products)
    
    except SQLAlchemyError as e:
        logger.error(f"Error loading to staging_products: {e}")
        raise


def load_to_staging_customers(df: pd.DataFrame, engine) -> int:
    """
    Load customer data to staging_customers table.
    Ensures customer_id, customer_name, region, and segment are always populated.
    """
    if df.empty:
        logger.warning("Empty DataFrame provided to load_to_staging_customers")
        return 0
    
    logger.info(f"Loading unique customers to staging_customers")
    
    df_copy = df.copy()
    if 'customer_id' not in df_copy.columns:
        df_copy['customer_id'] = 'CUST-001'
        
    df_copy['customer_id'] = df_copy['customer_id'].fillna('CUST-UNKNOWN').astype(str)
    
    if 'customer_name' not in df_copy.columns:
        df_copy['customer_name'] = df_copy['customer_id']
    else:
        df_copy['customer_name'] = df_copy['customer_name'].fillna(df_copy['customer_id']).astype(str)
        
    if 'region' not in df_copy.columns:
        df_copy['region'] = 'Global'
    else:
        df_copy['region'] = df_copy['region'].fillna('Global').astype(str)
        
    if 'segment' not in df_copy.columns:
        df_copy['segment'] = 'Corporate'
    else:
        df_copy['segment'] = df_copy['segment'].fillna('Corporate').astype(str)

    cust_cols = ['customer_id', 'customer_name', 'region', 'segment']
    df_customers = df_copy[cust_cols].drop_duplicates(subset=['customer_id'])
    
    # Always include unknown customer fallback
    unknown_cust = pd.DataFrame([{
        'customer_id': 'CUST-UNKNOWN',
        'customer_name': 'Standard Customer',
        'region': 'Global',
        'segment': 'Corporate'
    }])
    df_customers = pd.concat([df_customers, unknown_cust]).drop_duplicates(subset=['customer_id'])
    
    try:
        df_customers.to_sql(
            'staging_customers',
            engine,
            if_exists='append',
            index=False,
            chunksize=1000
        )
        logger.info(f"Successfully loaded {len(df_customers)} rows to staging_customers")
        return len(df_customers)
    
    except SQLAlchemyError as e:
        logger.error(f"Error loading to staging_customers: {e}")
        raise


def load_to_staging_erp(df: pd.DataFrame, engine) -> int:
    """
    Load ERP data to staging_erp table.
    
    Args:
        df: DataFrame with ERP data
        engine: SQLAlchemy engine
    
    Returns:
        Number of rows loaded
    """
    if df.empty:
        logger.warning("Empty DataFrame provided to load_to_staging_erp")
        return 0
    
    logger.info(f"Loading {len(df)} rows to staging_erp")
    
    # Select only columns that exist in staging_erp
    staging_columns = ['erp_order_ref', 'trans_dt', 'prod_code', 'cust_id', 
                      'qty_sold', 'unit_val', 'total_val', 'disc_pct', 'sys_flag']
    
    # Map standard column names to staging column names
    column_mapping = {
        'transaction_id': 'erp_order_ref',
        'sale_date': 'trans_dt',
        'product_id': 'prod_code',
        'customer_id': 'cust_id',
        'quantity': 'qty_sold',
        'unit_price': 'unit_val',
        'total_amount': 'total_val',
        'discount': 'disc_pct',
        'source_system': 'sys_flag'
    }
    
    df_to_load = df.copy()
    df_to_load = df_to_load.rename(columns=column_mapping)
    
    available_columns = [col for col in staging_columns if col in df_to_load.columns]
    df_to_load = df_to_load[available_columns]
    
    try:
        df_to_load.to_sql(
            'staging_erp',
            engine,
            if_exists='append',
            index=False,
            chunksize=1000
        )
        logger.info(f"Successfully loaded {len(df_to_load)} rows to staging_erp")
        return len(df_to_load)
    
    except SQLAlchemyError as e:
        logger.error(f"Error loading to staging_erp: {e}")
        raise


def load_all_staging(sales_df: pd.DataFrame, erp_df: pd.DataFrame = None, engine = None) -> dict:
    """
    Load all data to staging tables.
    
    Args:
        sales_df: DataFrame with sales data
        erp_df: Optional DataFrame with ERP data
        engine: SQLAlchemy engine (if None, creates new connection)
    
    Returns:
        Dictionary with row counts for each table
    """
    if engine is None:
        engine = get_db_connection()
    
    results = {}
    
    # Load sales data
    if sales_df is not None and not sales_df.empty:
        try:
            with engine.connect() as conn:
                conn.execute(text("TRUNCATE TABLE staging_sales, staging_products, staging_customers;"))
                conn.commit()
                logger.info("Truncated staging tables prior to new batch load")
        except Exception as e:
            logger.warning(f"Could not truncate staging tables: {e}")

        results['staging_sales'] = load_to_staging_sales(sales_df, engine)
        results['staging_products'] = load_to_staging_products(sales_df, engine)
        results['staging_customers'] = load_to_staging_customers(sales_df, engine)
    
    # Load ERP data if provided
    if erp_df is not None and not erp_df.empty:
        results['staging_erp'] = load_to_staging_erp(erp_df, engine)
    
    logger.info(f"Staging load complete: {results}")
    return results


if __name__ == "__main__":
    # Test loading
    from ingestion.extract_csv import extract_sales_csv
    from ingestion.extract_erp import extract_erp_data
    
    engine = get_db_connection()
    
    # Load sales data
    sales_df = extract_sales_csv("data/sample/sales_data.csv")
    sales_result = load_to_staging_sales(sales_df, engine)
    print(f"Loaded {sales_result} rows to staging_sales")
    
    # Load ERP data
    erp_df = extract_erp_data("data/sample/erp_sales_data.csv")
    erp_result = load_to_staging_erp(erp_df, engine)
    print(f"Loaded {erp_result} rows to staging_erp")
