"""
FastAPI Upload Endpoint for Sales Data
Minimal API for uploading CSV sales data through the ETL pipeline
"""
import logging
import sys
from pathlib import Path
from typing import Dict

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# Add project root to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from ingestion.extract_csv import parse_sales_csv
from ingestion.validate import validate_sales_data
from etl.load_staging import load_all_staging, get_db_connection
from etl.transform import run_transform

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Sales Analytics Platform - Ingestion API",
    description="Upload sales data CSV files to be processed through the ETL pipeline",
    version="1.0.0"
)

# Enable CORS for localhost
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173", "http://127.0.0.1:3000", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class UploadResponse(BaseModel):
    """Response model for upload endpoint."""
    rows_received: int
    rows_accepted: int
    rows_rejected: int
    rejection_reasons: list[str]
    success: bool
    message: str


@app.get("/")
def root():
    """Root endpoint with API information."""
    return {
        "message": "Sales Analytics Platform Ingestion API",
        "version": "1.0.0",
        "endpoints": {
            "upload": "/ingest/upload",
            "docs": "/docs"
        }
    }


@app.get("/health")
def health_check():
    """Health check endpoint."""
    return {"status": "healthy"}


@app.post("/ingest/upload", response_model=UploadResponse)
async def upload_sales_csv(file: UploadFile = File(...)):
    """
    Upload a CSV file with sales data to be processed through the ETL pipeline.
    
    The file will be:
    1. Parsed and validated
    2. Loaded to staging tables
    3. Transformed to curated star schema
    
    Args:
        file: CSV file upload
    
    Returns:
        UploadResponse with validation summary
    """
    # Validate file type
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Only CSV files are allowed")
    
    # Validate file size (max 10MB)
    MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File size exceeds 10MB limit")
    
    logger.info(f"Received file upload: {file.filename} ({len(content)} bytes)")
    
    try:
        # Step 1: Parse CSV using the reusable function
        logger.info("Parsing CSV file")
        # Reset file pointer to beginning for reading
        await file.seek(0)
        df = parse_sales_csv(file.file)
        rows_received = len(df)
        logger.info(f"Parsed {rows_received} rows from CSV")
        
        # Step 2: Validate data
        logger.info("Validating sales data")
        validation_result = validate_sales_data(df, source='upload')
        logger.info(f"Validation: {validation_result.rows_accepted} accepted, {validation_result.rows_rejected} rejected")
        
        # Step 3: Load to staging
        if validation_result.rows_accepted > 0:
            logger.info("Loading to staging tables")
            engine = get_db_connection()
            load_result = load_all_staging(
                sales_df=validation_result.accepted_df,
                erp_df=None,
                engine=engine
            )
            logger.info(f"Staging load complete: {load_result}")
            
            # Step 4: Transform to curated
            logger.info("Running transformation")
            transform_result = run_transform(engine)
            logger.info(f"Transformation complete: {transform_result}")
        else:
            logger.warning("No valid rows to load")
            transform_result = {}
        
        # Build response
        response = UploadResponse(
            rows_received=rows_received,
            rows_accepted=validation_result.rows_accepted,
            rows_rejected=validation_result.rows_rejected,
            rejection_reasons=validation_result.rejection_reasons[:5],
            success=True,
            message=f"Successfully processed {validation_result.rows_accepted} rows"
        )
        
        logger.info(f"Upload complete: {response}")
        return response
    
    except Exception as e:
        logger.error(f"Error processing upload: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Error processing file: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
