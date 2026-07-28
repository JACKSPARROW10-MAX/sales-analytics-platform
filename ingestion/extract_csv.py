import pandas as pd
import logging
from typing import Union
from pathlib import Path

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def parse_sales_csv(file_or_path: Union[str, Path, object]) -> pd.DataFrame:
    """
    Parse sales CSV data from either a file path or an in-memory uploaded file.
    
    Args:
        file_or_path: Either a file path (str/Path) or a file-like object (e.g., UploadFile)
    
    Returns:
        Cleaned pandas DataFrame with standardized column names
    """
    try:
        # Handle both file paths and file-like objects
        if hasattr(file_or_path, 'read'):
            # File-like object (e.g., UploadFile)
            df = pd.read_csv(file_or_path)
        else:
            # File path
            df = pd.read_csv(file_or_path)
        
        logger.info(f"Loaded {len(df)} rows from CSV")
        
        # Standardize column names (lowercase, strip spaces)
        df.columns = df.columns.str.strip().str.lower()
        
        # Map common column name variations to standard names
        column_mapping = {
            'transaction_id': 'transaction_id',
            'sale_date': 'sale_date',
            'date': 'sale_date',
            'product_id': 'product_id',
            'customer_id': 'customer_id',
            'region': 'region',
            'quantity': 'quantity',
            'unit_price': 'unit_price',
            'discount': 'discount',
            'total_amount': 'total_amount',
            'revenue': 'total_amount'
        }
        
        # Rename columns based on mapping
        df = df.rename(columns={col: column_mapping.get(col, col) for col in df.columns})
        
        logger.info(f"Columns after standardization: {list(df.columns)}")
        
        return df
    
    except Exception as e:
        logger.error(f"Error parsing CSV: {e}")
        raise


def extract_sales_csv(file_path: str) -> pd.DataFrame:
    """
    Extract sales data from CSV file at given path.
    
    Args:
        file_path: Path to the CSV file
    
    Returns:
        Cleaned pandas DataFrame
    """
    logger.info(f"Extracting sales data from: {file_path}")
    df = parse_sales_csv(file_path)
    logger.info(f"Extracted {len(df)} rows from sales CSV")
    return df


if __name__ == "__main__":
    # Test extraction
    sample_path = "data/sample/sales_data.csv"
    df = extract_sales_csv(sample_path)
    print(f"Shape: {df.shape}")
    print(f"Columns: {list(df.columns)}")
    print(df.head())
