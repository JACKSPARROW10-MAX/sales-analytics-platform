import pandas as pd
import logging
from typing import Union
from pathlib import Path

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def parse_sales_csv(file_or_path: Union[str, Path, object]) -> pd.DataFrame:
    """
    Parse sales CSV data from either a file path or an in-memory uploaded file.
    Standardizes column names and maps common enterprise CRM/ERP variations.
    
    Args:
        file_or_path: Either a file path (str/Path) or a file-like object (e.g., UploadFile)
    
    Returns:
        Cleaned pandas DataFrame with standardized column names
    """
    try:
        if hasattr(file_or_path, 'read'):
            df = pd.read_csv(file_or_path)
        else:
            df = pd.read_csv(file_or_path)
        
        logger.info(f"Loaded {len(df)} rows from CSV")
        
        # Standardize column names (lowercase, strip spaces, convert spaces/dashes to underscores)
        df.columns = df.columns.astype(str).str.strip().str.lower().str.replace(' ', '_').str.replace('-', '_')
        
        # Comprehensive alias mapping dictionary covering common ERP, CRM, and E-commerce CSV formats
        column_mapping = {
            # Transaction ID aliases
            'transaction_id': 'transaction_id',
            'trans_id': 'transaction_id',
            'tx_id': 'transaction_id',
            'order_id': 'transaction_id',
            'order_number': 'transaction_id',
            'order_ref': 'transaction_id',
            'erp_order_ref': 'transaction_id',
            'invoice_id': 'transaction_id',
            'id': 'transaction_id',

            # Sale Date aliases
            'sale_date': 'sale_date',
            'saledate': 'sale_date',
            'date': 'sale_date',
            'trans_dt': 'sale_date',
            'transaction_date': 'sale_date',
            'order_date': 'sale_date',
            'created_at': 'sale_date',
            'timestamp': 'sale_date',

            # Product Identifier / Name aliases
            'product_id': 'product_id',
            'prod_id': 'product_id',
            'prod_code': 'product_id',
            'sku': 'product_id',
            'item_id': 'product_id',
            'product_name': 'product_name',
            'product': 'product_name',
            'item_name': 'product_name',
            'item': 'product_name',

            # Customer Identifier / Name aliases
            'customer_id': 'customer_id',
            'cust_id': 'customer_id',
            'client_id': 'customer_id',
            'user_id': 'customer_id',
            'customer_name': 'customer_name',
            'customer': 'customer_name',
            'client_name': 'customer_name',
            'client': 'customer_name',

            # Region / Geography aliases
            'region': 'region',
            'location': 'region',
            'country': 'region',
            'territory': 'region',
            'market': 'region',

            # Quantity aliases
            'quantity': 'quantity',
            'qty': 'quantity',
            'qty_sold': 'quantity',
            'units': 'quantity',
            'units_sold': 'quantity',

            # Unit Price aliases
            'unit_price': 'unit_price',
            'price': 'unit_price',
            'unit_val': 'unit_price',
            'unit_cost': 'unit_price',
            'rate': 'unit_price',

            # Discount aliases
            'discount': 'discount',
            'disc': 'discount',
            'disc_pct': 'discount',
            'discount_percent': 'discount',
            'discount_rate': 'discount',

            # Revenue / Total Amount aliases
            'total_amount': 'total_amount',
            'amount': 'total_amount',
            'revenue': 'total_amount',
            'total_val': 'total_amount',
            'total_revenue': 'total_amount',
            'sales': 'total_amount',
            'net_amount': 'total_amount'
        }
        
        # Rename columns based on mapping
        df = df.rename(columns={col: column_mapping.get(col, col) for col in df.columns})
        
        # Calculate total_amount if missing but quantity and unit_price are available
        if 'total_amount' not in df.columns and 'quantity' in df.columns and 'unit_price' in df.columns:
            df['total_amount'] = df['quantity'] * df['unit_price']
            logger.info("Computed 'total_amount' from quantity * unit_price")

        # Auto-fill transaction_id if missing
        if 'transaction_id' not in df.columns:
            df['transaction_id'] = [f"TXN-{idx+10001}" for idx in range(len(df))]

        # Auto-fill default product_id if missing
        if 'product_id' not in df.columns:
            df['product_id'] = df.get('product_name', 'PROD-GENERAL')

        # Auto-fill default customer_id if missing
        if 'customer_id' not in df.columns:
            df['customer_id'] = df.get('customer_name', 'CUST-GENERAL')

        # Auto-fill default quantity if missing
        if 'quantity' not in df.columns:
            df['quantity'] = 1

        # Auto-fill default discount if missing
        if 'discount' not in df.columns:
            df['discount'] = 0.0

        logger.info(f"Columns after standardization: {list(df.columns)}")
        return df
    
    except Exception as e:
        logger.error(f"Error parsing CSV: {e}")
        raise


def extract_sales_csv(file_path: str) -> pd.DataFrame:
    """Extract sales data from CSV file at given path."""
    logger.info(f"Extracting sales data from: {file_path}")
    df = parse_sales_csv(file_path)
    return df
