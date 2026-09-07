"""
FastAPI Backend Services for Sales Analytics Platform
Serves ingestion, ETL triggers, ML forecasts, anomalies, recommendations, and PDF report downloads.
"""
import json
import logging
import os
import sys
from pathlib import Path
from typing import Dict, List, Optional, Any

# Add project root to path for imports
PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from fastapi import FastAPI, UploadFile, File, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel
from api.routers import (
    variance, trend, anomaly_explain, recommendations_enhanced,
    data_quality, pipeline_health,
    analytics, products_analytics, customers_analytics,
    categories, regions, pricing
)

from ingestion.extract_csv import parse_sales_csv
from ingestion.validate import validate_sales_data
from etl.load_staging import load_all_staging, get_db_connection
from etl.transform import run_transform
from ml.train import run_ml_pipeline
from reports.generate_pdf_report import generate_sales_report_pdf

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Sales Analytics Platform API",
    description="Enterprise FastAPI Backend for Sales Analytics, Forecasting, Anomaly Detection & Reports",
    version="1.0.0"
)

# Enable CORS for React frontend (ports 3000, 5173, 8000)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(variance.router, prefix="/api/v1")
app.include_router(trend.router, prefix="/api/v1")
app.include_router(anomaly_explain.router, prefix="/api/v1")
app.include_router(data_quality.router, prefix="/api/v1")
app.include_router(pipeline_health.router, prefix="/api/v1")
app.include_router(analytics.router, prefix="/api/v1")
app.include_router(products_analytics.router, prefix="/api/v1")
app.include_router(customers_analytics.router, prefix="/api/v1")
app.include_router(categories.router, prefix="/api/v1")
app.include_router(regions.router, prefix="/api/v1")
app.include_router(pricing.router, prefix="/api/v1")


class UploadResponse(BaseModel):
    """Response model for upload endpoint."""
    rows_received: int
    rows_accepted: int
    rows_rejected: int
    rejection_reasons: List[str]
    success: bool
    message: str


def get_cached_ml_data() -> Dict[str, Any]:
    """Helper to read from cached ml_results.json or generate on-the-fly."""
    json_path = PROJECT_ROOT / "data" / "ml_results.json"
    if json_path.exists():
        try:
            with open(json_path, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as e:
            logger.error(f"Error reading ml_results.json: {e}")

    # Fallback to running ML pipeline
    logger.info("Executing ML pipeline to populate cache...")
    return run_ml_pipeline()


@app.get("/")
def root():
    return {
        "message": "Sales Analytics Platform API",
        "version": "1.0.0",
        "endpoints": {
            "kpis": "/api/v1/kpis",
            "forecast": "/api/v1/forecast",
            "anomalies": "/api/v1/anomalies",
            "recommendations": "/api/v1/recommendations",
            "products": "/api/v1/products",
            "upload": "/api/v1/ingest/upload",
            "run_pipeline": "/api/v1/pipeline/run",
            "download_report": "/api/v1/reports/download",
            "docs": "/docs"
        }
    }


@app.get("/health")
@app.get("/api/v1/health")
def health_check():
    return {"status": "healthy", "service": "Sales Analytics API", "version": "1.0.0"}


@app.get("/api/v1/kpis")
def get_kpis():
    """Fetch top-level KPI metrics."""
    data = get_cached_ml_data()
    return data.get("kpis", {})


@app.get("/api/v1/forecast")
def get_forecast(product_id: Optional[str] = Query('all')):
    """Fetch historical sales & forecasted data for a product or overall."""
    data = get_cached_ml_data()
    
    if product_id and product_id != 'all':
        prod_forecasts = data.get("product_forecasts", {})
        if product_id in prod_forecasts:
            return prod_forecasts[product_id]
        
    return data.get("forecast", {}).get("data", [])


@app.get("/api/v1/anomalies")
def get_anomalies(severity: Optional[str] = Query('all')):
    """Fetch detected sales anomalies with root cause breakdown."""
    data = get_cached_ml_data()
    anomalies = data.get("anomalies", [])
    
    if severity and severity != 'all':
        anomalies = [a for a in anomalies if a.get('severity', '').lower() == severity.lower()]
        
    return anomalies


@app.get("/api/v1/recommendations")
def get_recommendations():
    """Fetch prescriptive recommendations."""
    data = get_cached_ml_data()
    return data.get("recommendations", [])


@app.get("/api/v1/products")
def get_products():
    """Fetch list of products for dropdown filtering."""
    data = get_cached_ml_data()
    return data.get("products", ["all"])


@app.post("/api/v1/ingest/upload", response_model=UploadResponse)
@app.post("/ingest/upload", response_model=UploadResponse)
async def upload_sales_csv(file: UploadFile = File(...)):
    """Upload CSV sales file, validate, load to staging, transform, and refresh ML cache."""
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Only CSV files are allowed")
    
    content = await file.read()
    if len(content) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File size exceeds 10MB limit")
    
    try:
        await file.seek(0)
        df = parse_sales_csv(file.file)
        rows_received = len(df)
        
        validation_result = validate_sales_data(df, source='upload')
        
        if validation_result.rows_accepted > 0:
            engine = get_db_connection()
            load_all_staging(sales_df=validation_result.accepted_df, erp_df=None, engine=engine)
            run_transform(engine)
            run_ml_pipeline()

        return UploadResponse(
            rows_received=rows_received,
            rows_accepted=validation_result.rows_accepted,
            rows_rejected=validation_result.rows_rejected,
            rejection_reasons=validation_result.rejection_reasons[:5],
            success=True,
            message=f"Successfully processed {validation_result.rows_accepted} sales records"
        )
    except Exception as e:
        logger.error(f"Error processing upload: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Error processing file: {str(e)}")


@app.post("/api/v1/pipeline/run")
def trigger_pipeline():
    """Trigger full ETL + ML pipeline refresh on demand."""
    try:
        engine = get_db_connection()
        transform_res = run_transform(engine)
        ml_res = run_ml_pipeline()
        return {
            "status": "success",
            "message": "ETL and ML pipelines successfully executed",
            "records_transformed": transform_res,
            "anomalies_detected": len(ml_res.get("anomalies", []))
        }
    except Exception as e:
        logger.error(f"Pipeline run error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/v1/reports/download")
def download_pdf_report():
    """Download PDF executive summary report."""
    # Generate fresh PDF each request
    pdf_path = generate_sales_report_pdf()
    if os.path.exists(pdf_path):
        return FileResponse(
            path=pdf_path,
            filename="Sales_Executive_Analytics_Report.pdf",
            media_type="application/pdf",
            headers={
                "Cache-Control": "no-store, no-cache, must-revalidate",
                "Pragma": "no-cache",
                "Expires": "0",
            },
        )
    raise HTTPException(status_code=500, detail="Could not generate PDF report")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
