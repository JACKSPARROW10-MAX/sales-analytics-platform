import pandas as pd
import logging
from sqlalchemy import create_engine, text
from sqlalchemy.exc import SQLAlchemyError
from dotenv import load_dotenv
import os

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

load_dotenv()


def get_db_connection():
    """
    Create SQLAlchemy engine using environment variables.
    
    Returns:
        SQLAlchemy engine
    """
    db_user = os.getenv('POSTGRES_USER', 'postgres')
    db_password = os.getenv('POSTGRES_PASSWORD', 'postgres')
    db_host = os.getenv('POSTGRES_HOST', 'localhost')
    db_port = os.getenv('POSTGRES_PORT', '5432')
    db_name = os.getenv('POSTGRES_DB', 'sales_platform')
    
    connection_string = f"postgresql://{db_user}:{db_password}@{db_host}:{db_port}/{db_name}"
    engine = create_engine(connection_string)
    
    return engine


def load_to_staging_sales(df: pd.DataFrame, engine) -> int:
    """
    Load validated sales data to staging_sales table.
    
    Args:
        df: DataFrame with validated sales data
        engine: SQLAlchemy engine
    
    Returns:
        Number of rows loaded
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
    
    try:
        # Load in chunks for better performance
        rows_loaded = df_to_load.to_sql(
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
    
    Args:
        df: DataFrame with product data
        engine: SQLAlchemy engine
    
    Returns:
        Number of rows loaded
    """
    if df.empty:
        logger.warning("Empty DataFrame provided to load_to_staging_products")
        return 0
    
    logger.info(f"Loading {len(df)} rows to staging_products")
    
    # Extract unique products from sales data
    product_columns = ['product_id', 'product_name', 'category', 'subcategory', 'unit_price']
    available_columns = [col for col in product_columns if col in df.columns]
    
    if available_columns:
        df_products = df[available_columns].drop_duplicates(subset=['product_id']) if 'product_id' in df.columns else df[available_columns]
    else:
        logger.warning("No product columns found in DataFrame")
        return 0
    
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
    
    Args:
        df: DataFrame with customer data
        engine: SQLAlchemy engine
    
    Returns:
        Number of rows loaded
    """
    if df.empty:
        logger.warning("Empty DataFrame provided to load_to_staging_customers")
        return 0
    
    logger.info(f"Loading {len(df)} rows to staging_customers")
    
    # Extract unique customers from sales data
    customer_columns = ['customer_id', 'customer_name', 'region', 'segment']
    available_columns = [col for col in customer_columns if col in df.columns]
    
    if available_columns:
        df_customers = df[available_columns].drop_duplicates(subset=['customer_id']) if 'customer_id' in df.columns else df[available_columns]
    else:
        logger.warning("No customer columns found in DataFrame")
        return 0
    
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
