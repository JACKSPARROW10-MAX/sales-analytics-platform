import pandas as pd
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def extract_erp_data(file_path: str) -> pd.DataFrame:
    """
    Extract and normalize ERP data from CSV file.
    
    ERP data has different column names and date format that need to be normalized
    to match the standard sales schema.
    
    Args:
        file_path: Path to the ERP CSV file
    
    Returns:
        Normalized pandas DataFrame with standard column names
    """
    logger.info(f"Extracting ERP data from: {file_path}")
    
    try:
        df = pd.read_csv(file_path)
        logger.info(f"Loaded {len(df)} rows from ERP CSV")
        
        # Column mapping from ERP format to standard format
        column_mapping = {
            'ERP_ORDER_REF': 'transaction_id',
            'TRANS_DT': 'sale_date',
            'PROD_CODE': 'product_id',
            'CUST_ID': 'customer_id',
            'QUANTITY_SOLD': 'quantity',
            'UNIT_VAL': 'unit_price',
            'GROSS_VAL': 'total_amount',
            'DISC_PCT': 'discount'
        }
        
        # Rename columns
        df = df.rename(columns=column_mapping)
        
        # Normalize date format from DD/MM/YYYY to YYYY-MM-DD
        if 'sale_date' in df.columns:
            df['sale_date'] = pd.to_datetime(df['sale_date'], format='%d/%m/%Y', errors='coerce')
            df['sale_date'] = df['sale_date'].dt.strftime('%Y-%m-%d')
        
        # Normalize discount: remove % sign and convert to decimal
        if 'discount' in df.columns:
            df['discount'] = df['discount'].astype(str).str.replace('%', '').str.strip()
            df['discount'] = pd.to_numeric(df['discount'], errors='coerce') / 100
        
        # Add source system flag
        df['source_system'] = 'ERP'
        
        # Select only relevant columns
        standard_columns = [
            'transaction_id', 'sale_date', 'product_id', 'customer_id',
            'quantity', 'unit_price', 'discount', 'total_amount', 'source_system'
        ]
        df = df[[col for col in standard_columns if col in df.columns]]
        
        logger.info(f"Normalized ERP data: {len(df)} rows")
        logger.info(f"Columns: {list(df.columns)}")
        
        return df
    
    except Exception as e:
        logger.error(f"Error extracting ERP data: {e}")
        raise


if __name__ == "__main__":
    # Test extraction
    sample_path = "data/sample/erp_sales_data.csv"
    df = extract_erp_data(sample_path)
    print(f"Shape: {df.shape}")
    print(f"Columns: {list(df.columns)}")
    print(df.head())
