import pandas as pd
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def extract_external_features(file_path: str) -> pd.DataFrame:
    """
    Extract external feature data from CSV file.
    
    This data comes from external APIs (e.g., weather data) and contains
    features that can be joined with sales data for analysis.
    
    Args:
        file_path: Path to the external feature CSV file
    
    Returns:
        pandas DataFrame with external features
    """
    logger.info(f"Extracting external features from: {file_path}")
    
    try:
        df = pd.read_csv(file_path)
        logger.info(f"Loaded {len(df)} rows from external feature CSV")
        
        # Standardize column names
        df.columns = df.columns.str.strip().str.lower()
        
        logger.info(f"Columns: {list(df.columns)}")
        logger.info(f"Extracted {len(df)} rows of external features")
        
        return df
    
    except Exception as e:
        logger.error(f"Error extracting external features: {e}")
        raise


if __name__ == "__main__":
    # Test extraction
    sample_path = "data/sample/external_feature.csv"
    df = extract_external_features(sample_path)
    print(f"Shape: {df.shape}")
    print(f"Columns: {list(df.columns)}")
    print(df.head())
