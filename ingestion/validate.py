import pandas as pd
import logging
from pathlib import Path
from typing import Dict, Tuple
from datetime import datetime

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class ValidationResult:
    """Structured validation result with accepted/rejected rows and reasons."""
    
    def __init__(self):
        self.rows_accepted = 0
        self.rows_rejected = 0
        self.rejection_reasons = []
        self.accepted_df = None
        self.rejected_df = None
    
    def to_dict(self) -> Dict:
        """Convert to dictionary for API responses."""
        return {
            'rows_accepted': self.rows_accepted,
            'rows_rejected': self.rows_rejected,
            'rejection_reasons': self.rejection_reasons[:5]  # Top 5 reasons
        }


def validate_sales_data(df: pd.DataFrame, source: str = 'unknown') -> ValidationResult:
    """
    Validate sales data DataFrame.
    
    Validation rules:
    - No nulls in key columns (date, product_id, customer_id, quantity, revenue/total_amount)
    - Quantity and revenue must be non-negative
    - Dates must be parseable
    
    Args:
        df: Input DataFrame with sales data
        source: Source identifier for logging
    
    Returns:
        ValidationResult with accepted/rejected DataFrames and summary
    """
    result = ValidationResult()
    
    if df.empty:
        logger.warning(f"Empty DataFrame received from {source}")
        return result
    
    logger.info(f"Validating {len(df)} rows from {source}")
    
    # Make a copy to avoid modifying original
    df_valid = df.copy()
    
    # Add a validation_error column to track issues
    df_valid['validation_error'] = None
    
    # Standardize column names for validation
    column_map = {
        'sale_date': 'sale_date',
        'date': 'sale_date',
        'total_amount': 'total_amount',
        'revenue': 'total_amount'
    }
    df_valid = df_valid.rename(columns={k: v for k, v in column_map.items() if k in df_valid.columns})
    
    # Check 1: Null values in key columns
    key_columns = ['sale_date', 'product_id', 'customer_id', 'quantity', 'total_amount']
    for col in key_columns:
        if col in df_valid.columns:
            null_mask = df_valid[col].isna()
            if null_mask.any():
                df_valid.loc[null_mask, 'validation_error'] = (
                    df_valid.loc[null_mask, 'validation_error']
                    .fillna(f"Null value in {col}")
                )
    
    # Check 2: Quantity must be non-negative
    if 'quantity' in df_valid.columns:
        df_valid['quantity'] = pd.to_numeric(df_valid['quantity'], errors='coerce')
        neg_qty_mask = (df_valid['quantity'] < 0) & (df_valid['quantity'].notna())
        if neg_qty_mask.any():
            df_valid.loc[neg_qty_mask, 'validation_error'] = (
                df_valid.loc[neg_qty_mask, 'validation_error']
                .fillna("Negative quantity")
            )
    
    # Check 3: Revenue/total_amount must be non-negative
    if 'total_amount' in df_valid.columns:
        df_valid['total_amount'] = pd.to_numeric(df_valid['total_amount'], errors='coerce')
        neg_rev_mask = (df_valid['total_amount'] < 0) & (df_valid['total_amount'].notna())
        if neg_rev_mask.any():
            df_valid.loc[neg_rev_mask, 'validation_error'] = (
                df_valid.loc[neg_rev_mask, 'validation_error']
                .fillna("Negative revenue")
            )
    
    # Check 4: Dates must be parseable
    if 'sale_date' in df_valid.columns:
        try:
            parsed_dates = pd.to_datetime(df_valid['sale_date'], errors='coerce')
            invalid_date_mask = parsed_dates.isna() & df_valid['sale_date'].notna()
            if invalid_date_mask.any():
                df_valid.loc[invalid_date_mask, 'validation_error'] = (
                    df_valid.loc[invalid_date_mask, 'validation_error']
                    .fillna("Invalid date format")
                )
        except Exception as e:
            logger.error(f"Error parsing dates: {e}")
    
    # Split into accepted and rejected
    rejected_mask = df_valid['validation_error'].notna()
    
    result.rejected_df = df_valid[rejected_mask].copy()
    result.accepted_df = df_valid[~rejected_mask].copy()
    
    # Remove validation_error column from accepted data
    if 'validation_error' in result.accepted_df.columns:
        result.accepted_df = result.accepted_df.drop(columns=['validation_error'])
    
    result.rows_accepted = len(result.accepted_df)
    result.rows_rejected = len(result.rejected_df)
    
    # Collect rejection reasons
    if not result.rejected_df.empty:
        reason_counts = result.rejected_df['validation_error'].value_counts()
        result.rejection_reasons = [
            f"{reason}: {count}" for reason, count in reason_counts.items()
        ]
    
    logger.info(f"Validation complete: {result.rows_accepted} accepted, {result.rows_rejected} rejected")
    
    # Log rejected rows to file
    if result.rows_rejected > 0:
        log_rejected_rows(result.rejected_df, source)
    
    return result


def log_rejected_rows(df: pd.DataFrame, source: str):
    """
    Log rejected rows to /data/rejected/ directory.
    
    Args:
        df: DataFrame with rejected rows (must have validation_error column)
        source: Source identifier for filename
    """
    try:
        rejected_dir = Path("data/rejected")
        rejected_dir.mkdir(parents=True, exist_ok=True)
        
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"rejected_{source}_{timestamp}.csv"
        filepath = rejected_dir / filename
        
        df.to_csv(filepath, index=False)
        logger.info(f"Logged {len(df)} rejected rows to {filepath}")
    
    except Exception as e:
        logger.error(f"Failed to log rejected rows: {e}")


if __name__ == "__main__":
    # Test validation
    from extract_csv import extract_sales_csv
    
    sample_path = "data/sample/sales_data.csv"
    df = extract_sales_csv(sample_path)
    
    # Introduce some invalid data for testing
    df.loc[0, 'quantity'] = -1
    df.loc[1, 'total_amount'] = -100
    df.loc[2, 'sale_date'] = 'invalid_date'
    df.loc[3, 'product_id'] = None
    
    result = validate_sales_data(df, source='test')
    
    print(f"Accepted: {result.rows_accepted}")
    print(f"Rejected: {result.rows_rejected}")
    print(f"Reasons: {result.rejection_reasons}")
    print("\nRejected rows:")
    print(result.rejected_df[['transaction_id', 'validation_error']].head())
