"""
ETL Pipeline Orchestration Script
Runs the complete ETL pipeline: extract -> validate -> load_staging -> transform
"""
import logging
import sys
from pathlib import Path

# Add project root to path for imports
sys.path.insert(0, str(Path(__file__).parent))

from ingestion.extract_csv import extract_sales_csv
from ingestion.extract_erp import extract_erp_data
from ingestion.extract_api import extract_external_features
from ingestion.validate import validate_sales_data
from etl.load_staging import load_all_staging, get_db_connection
from etl.transform import run_transform

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


def run_pipeline():
    """
    Run the complete ETL pipeline on sample data.
    
    Pipeline steps:
    1. Extract data from CSV, ERP, and external API sources
    2. Validate sales data
    3. Load validated data to staging tables
    4. Transform staging data to curated star schema
    
    Returns:
        Dictionary with pipeline execution summary
    """
    logger.info("=" * 60)
    logger.info("STARTING ETL PIPELINE")
    logger.info("=" * 60)
    
    summary = {
        'extract': {},
        'validate': {},
        'load_staging': {},
        'transform': {}
    }
    
    try:
        # ========================================================================
        # STEP 1: EXTRACT
        # ========================================================================
        logger.info("\n" + "=" * 60)
        logger.info("STEP 1: EXTRACTION")
        logger.info("=" * 60)
        
        # Extract sales data
        sales_path = "data/sample/sales_data.csv"
        logger.info(f"Extracting sales data from {sales_path}")
        sales_df = extract_sales_csv(sales_path)
        summary['extract']['sales_rows'] = len(sales_df)
        logger.info(f"Extracted {len(sales_df)} rows from sales CSV")
        
        # Extract ERP data
        erp_path = "data/sample/erp_sales_data.csv"
        logger.info(f"Extracting ERP data from {erp_path}")
        erp_df = extract_erp_data(erp_path)
        summary['extract']['erp_rows'] = len(erp_df)
        logger.info(f"Extracted {len(erp_df)} rows from ERP CSV")
        
        # Extract external features
        features_path = "data/sample/external_feature.csv"
        logger.info(f"Extracting external features from {features_path}")
        features_df = extract_external_features(features_path)
        summary['extract']['features_rows'] = len(features_df)
        logger.info(f"Extracted {len(features_df)} rows from external features CSV")
        
        # ========================================================================
        # STEP 2: VALIDATE
        # ========================================================================
        logger.info("\n" + "=" * 60)
        logger.info("STEP 2: VALIDATION")
        logger.info("=" * 60)
        
        # Validate sales data
        logger.info("Validating sales data")
        validation_result = validate_sales_data(sales_df, source='sales_csv')
        summary['validate']['rows_accepted'] = validation_result.rows_accepted
        summary['validate']['rows_rejected'] = validation_result.rows_rejected
        summary['validate']['rejection_reasons'] = validation_result.rejection_reasons
        
        logger.info(f"Validation complete: {validation_result.rows_accepted} accepted, {validation_result.rows_rejected} rejected")
        if validation_result.rejection_reasons:
            logger.info(f"Rejection reasons: {validation_result.rejection_reasons[:5]}")
        
        # Validate ERP data
        logger.info("Validating ERP data")
        erp_validation_result = validate_sales_data(erp_df, source='erp_csv')
        summary['validate']['erp_accepted'] = erp_validation_result.rows_accepted
        summary['validate']['erp_rejected'] = erp_validation_result.rows_rejected
        
        logger.info(f"ERP validation complete: {erp_validation_result.rows_accepted} accepted, {erp_validation_result.rows_rejected} rejected")
        
        # ========================================================================
        # STEP 3: LOAD TO STAGING
        # ========================================================================
        logger.info("\n" + "=" * 60)
        logger.info("STEP 3: LOAD TO STAGING")
        logger.info("=" * 60)
        
        engine = get_db_connection()
        
        # Load validated sales data
        logger.info("Loading validated sales data to staging")
        load_result = load_all_staging(
            sales_df=validation_result.accepted_df,
            erp_df=erp_validation_result.accepted_df,
            engine=engine
        )
        summary['load_staging'] = load_result
        logger.info(f"Staging load complete: {load_result}")
        
        # ========================================================================
        # STEP 4: TRANSFORM TO CURATED
        # ========================================================================
        logger.info("\n" + "=" * 60)
        logger.info("STEP 4: TRANSFORM TO CURATED")
        logger.info("=" * 60)
        
        logger.info("Running transformation from staging to curated")
        transform_result = run_transform(engine)
        summary['transform'] = transform_result
        logger.info(f"Transformation complete: {transform_result}")
        
        # ========================================================================
        # FINAL SUMMARY
        # ========================================================================
        logger.info("\n" + "=" * 60)
        logger.info("PIPELINE EXECUTION SUMMARY")
        logger.info("=" * 60)
        logger.info(f"EXTRACT: {summary['extract']['sales_rows']} sales rows, {summary['extract']['erp_rows']} ERP rows, {summary['extract']['features_rows']} feature rows")
        logger.info(f"VALIDATE: {summary['validate']['rows_accepted']} sales accepted, {summary['validate']['rows_rejected']} sales rejected")
        logger.info(f"LOAD STAGING: {summary['load_staging']}")
        logger.info(f"TRANSFORM: {summary['transform']}")
        logger.info("=" * 60)
        logger.info("PIPELINE COMPLETED SUCCESSFULLY")
        logger.info("=" * 60)
        
        return summary
    
    except Exception as e:
        logger.error(f"Pipeline failed: {e}", exc_info=True)
        raise


if __name__ == "__main__":
    try:
        summary = run_pipeline()
        print("\n" + "=" * 60)
        print("FINAL SUMMARY")
        print("=" * 60)
        print(f"Rows rejected: {summary['validate']['rows_rejected']}")
        print(f"Rows loaded to fact_sales: {summary['transform']['fact_sales']}")
        print("=" * 60)
    except Exception as e:
        print(f"\nPipeline failed: {e}")
        sys.exit(1)
