"""
FastAPI Backend Services for Sales Analytics Platform
Serves ingestion, ETL triggers, live analytics, ML forecasts, anomalies, recommendations, and PDF report downloads.
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

import re
from fastapi import FastAPI, UploadFile, File, HTTPException, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel
from sqlalchemy import text
# pyrefly: ignore [missing-import]
from slowapi import Limiter, _rate_limit_exceeded_handler
# pyrefly: ignore [missing-import]
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
# pyrefly: ignore [missing-import]
from slowapi.middleware import SlowAPIMiddleware

from api.routers import (
    variance, trend, anomaly_explain,
    data_quality, pipeline_health,
    analytics, products_analytics, customers_analytics,
    categories, regions, pricing
)

from api.utils.sql_helpers import get_kpi_metrics, get_trend_data
from ingestion.extract_csv import parse_sales_csv
from ingestion.validate import validate_sales_data
from db.connection import check_database_connection
from etl.load_staging import load_all_staging, get_db_connection
from etl.transform import run_transform
from ml.train import run_ml_pipeline
from reports.generate_pdf_report import generate_sales_report_pdf

logging.basicConfig(
    level=os.getenv("LOG_LEVEL", "INFO").upper(),
    format="%(asctime)s %(levelname)s %(name)s %(message)s",
)
logger = logging.getLogger(__name__)

# Rate limiter must be constructed before the app so it can be attached below.
limiter = Limiter(key_func=get_remote_address, default_limits=["100/minute"])

app = FastAPI(
    title="Sales Analytics Platform API",
    description="Enterprise FastAPI Backend for Sales Analytics, Forecasting, Anomaly Detection & Reports",
    version="1.0.0",
)

# Security Headers Middleware
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Permissions-Policy"] = "geolocation=(), camera=(), microphone=()"
    return response

# Enable CORS for the React frontend.
# Production: set CORS_ORIGINS to the deployed dashboard URL(s), comma-separated.
# Default covers the common local Vite / CRA dev hosts.
_DEV_ORIGINS = (
    "http://localhost:5173,http://127.0.0.1:5173,"
    "http://localhost:3000,http://127.0.0.1:3000,"
    "http://localhost:4173,http://127.0.0.1:4173"
)
cors_origins_env = os.getenv("CORS_ORIGINS", _DEV_ORIGINS)
if cors_origins_env == "*":
    allow_origins = ["*"]
    allow_credentials = False  # Browser security rejects allow_credentials=True with allow_origins=["*"]
else:
    allow_origins = [o.strip() for o in cors_origins_env.split(",") if o.strip()]
    allow_credentials = True

app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins,
    allow_credentials=allow_credentials,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)

# Routers
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
    database_total_before: Optional[int] = 0
    database_total_after: Optional[int] = 0


def get_cached_ml_data() -> Dict[str, Any]:
    """Helper to read from ml_results.json or run pipeline on-demand."""
    json_path = PROJECT_ROOT / "data" / "ml_results.json"
    if json_path.exists():
        try:
            with open(json_path, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as e:
            logger.error(f"Error reading ml_results.json: {e}")

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
            "analytics_sales": "/api/v1/analytics/sales",
            "analytics_products": "/api/v1/analytics/products",
            "analytics_customers": "/api/v1/analytics/customers",
            "analytics_categories": "/api/v1/analytics/categories",
            "analytics_regions": "/api/v1/analytics/regions",
            "analytics_pricing": "/api/v1/analytics/pricing",
            "docs": "/docs"
        }
    }


@app.get("/health")
@app.get("/api/v1/health")
def health_check():
    """Deployment health check verifying API and Database liveness safely without leaking credentials."""
    db_connected, _ = check_database_connection()
    return {
        "status": "healthy" if db_connected else "degraded",
        "database": "connected" if db_connected else "disconnected",
        "service": "Sales Analytics Platform API",
        "version": "1.0.0",
        "database_status": "Connection verified" if db_connected else "Connection unavailable (check server logs)"
    }


@app.get("/api/v1/kpis")
@app.get("/kpis")
def get_kpis():
    """Fetch live top-level KPI metrics computed dynamically from PostgreSQL fact_sales."""
    try:
        live_kpis = get_kpi_metrics()
        ml_data = get_cached_ml_data()
        
        # Merge anomaly count and recommendations count if present
        anomalies = ml_data.get("anomalies", [])
        recommendations = ml_data.get("recommendations", [])
        
        critical = len([a for a in anomalies if a.get("severity") == "Critical"])
        live_kpis["anomaliesDetected"] = {
            "value": len(anomalies),
            "formatted": f"{len(anomalies)} Flagged",
            "change": f"{critical} High Urgency",
            "subtext": "Unusual sales spikes / drops",
            "isPositive": False,
        }
        # Only sum impact values that the model actually produced (no fabricated default).
        impact_total = sum(
            float(r.get("impact_value") or 0) for r in recommendations if r.get("impact_value")
        )
        live_kpis["activeRecommendations"] = {
            "value": len(recommendations),
            "formatted": f"{len(recommendations)} Actionable",
            "change": (f"+₹{impact_total:,.0f}" if impact_total else "AI-generated"),
            "subtext": "Prescriptive growth actions",
            "isPositive": True,
        }

        forecast = ml_data.get("forecast", {}) or {}
        acc = forecast.get("accuracy")
        mape = forecast.get("mape")
        model_name = forecast.get("model") or "Ridge Regression (scikit-learn)"
        if acc is not None:
            live_kpis["forecastAccuracy"] = {
                "value": acc,
                "formatted": f"{acc}%",
                "mape": (f"{mape}% mean abs. % error" if mape is not None else None),
                "model": model_name,
                "horizon_days": forecast.get("days_forecasted", 30),
                "projected_30d_revenue": forecast.get("projected_30d_revenue"),
                "subtext": f"{model_name} fit vs. actuals",
                "isPositive": True,
            }
        else:
            live_kpis["forecastAccuracy"] = {
                "value": None, "formatted": "—", "model": model_name,
                "subtext": "Not enough history to score the model", "isPositive": True,
            }
        return live_kpis
    except Exception as e:
        logger.error(f"Error computing live KPIs: {e}")
        data = get_cached_ml_data()
        return data.get("kpis", {})


@app.get("/api/v1/forecast")
@app.get("/forecast")
def get_forecast(product_id: Optional[str] = Query('all')):
    """Fetch historical sales & forecasted data for a product or overall."""
    data = get_cached_ml_data()
    if product_id and product_id != 'all':
        prod_forecasts = data.get("product_forecasts", {})
        if product_id in prod_forecasts:
            return prod_forecasts[product_id]
        
    return data.get("forecast", {}).get("data", [])


@app.get("/api/v1/anomalies")
@app.get("/anomalies")
def get_anomalies(severity: Optional[str] = Query('all')):
    """Fetch detected sales anomalies with root cause breakdown."""
    data = get_cached_ml_data()
    anomalies = data.get("anomalies", [])
    
    if severity and severity != 'all':
        anomalies = [a for a in anomalies if a.get('severity', '').lower() == severity.lower()]
        
    return anomalies


@app.get("/api/v1/recommendations")
@app.get("/recommendations")
def get_recommendations():
    """Fetch dynamic prescriptive recommendations."""
    data = get_cached_ml_data()
    return data.get("recommendations", [])


@app.get("/api/v1/products")
@app.get("/products")
def get_products():
    """Fetch list of products for dropdown filtering."""
    data = get_cached_ml_data()
    return data.get("products", ["all"])


# ─── Standardized /analytics/* Alias Endpoints ────────────────────────────────
@app.get("/api/v1/analytics/sales")
@app.get("/analytics/sales")
def get_analytics_sales(
    metric: str = Query("revenue", description="revenue | quantity | transactions"),
    period: str = Query("daily", description="daily | weekly | monthly"),
    moving_average: int = Query(0, ge=0)
):
    return analytics.get_analytics_summary(metric=metric, period=period, moving_average=moving_average)


@app.get("/api/v1/analytics/products")
@app.get("/analytics/products")
def get_analytics_products():
    return products_analytics.get_product_analytics()


@app.get("/api/v1/analytics/customers")
@app.get("/analytics/customers")
def get_analytics_customers():
    return customers_analytics.get_customer_analytics()


@app.get("/api/v1/analytics/categories")
@app.get("/analytics/categories")
def get_analytics_categories():
    return categories.get_category_analytics()


@app.get("/api/v1/analytics/regions")
@app.get("/analytics/regions")
def get_analytics_regions():
    return regions.get_region_analytics()


@app.get("/api/v1/analytics/pricing")
@app.get("/analytics/pricing")
def get_analytics_pricing():
    return pricing.get_pricing_analytics()


@app.post("/api/v1/ingest/upload", response_model=UploadResponse)
@app.post("/ingest/upload", response_model=UploadResponse)
async def upload_sales_csv(file: UploadFile = File(...)):
    """
    Secure CSV sales ingestion endpoint:
    - Sanitizes filenames against path traversal.
    - Rejects empty files and files exceeding 20MB.
    - Sanitizes CSV text cells against formula injection (DDE attacks).
    - Ensures safe generic error messages without leaking internal tracebacks.
    """
    # 1. Filename sanitization
    raw_filename = file.filename or ""
    safe_filename = re.sub(r'[^a-zA-Z0-9_.\-]', '_', os.path.basename(raw_filename))
    if not safe_filename.lower().endswith('.csv'):
        raise HTTPException(status_code=400, detail="Only valid CSV files (.csv) are permitted")

    # 2. File size & empty file check
    content = await file.read()
    if len(content) == 0:
        raise HTTPException(status_code=400, detail="Uploaded file is empty (0 bytes)")
    if len(content) > 20 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File size exceeds the 20MB security limit")

    try:
        await file.seek(0)
        df = parse_sales_csv(file.file)
        if df.empty:
            raise HTTPException(status_code=400, detail="Uploaded CSV contains no readable rows")

        # 3. Neutralize CSV formula injection (DDE attacks in Excel/Calc)
        for col in df.select_dtypes(include=['object']).columns:
            df[col] = df[col].astype(str).apply(
                lambda x: f"'{x}" if x and x[0] in ('=', '+', '-', '@', '\t', '\r') else x
            )

        rows_received = len(df)
        validation_result = validate_sales_data(df, source='upload')

        engine = get_db_connection()
        db_before = 0
        db_after = 0

        # Query before count
        try:
            with engine.connect() as conn:
                res = conn.execute(text("SELECT COUNT(*) FROM fact_sales")).first()
                db_before = int(res[0]) if res else 0
        except Exception as ex:
            logger.warning(f"Could not fetch initial count from fact_sales: {ex}")

        if validation_result.rows_accepted > 0:
            load_all_staging(sales_df=validation_result.accepted_df, erp_df=None, engine=engine)
            run_transform(engine)
            run_ml_pipeline()

        # Query after count
        try:
            with engine.connect() as conn:
                res = conn.execute(text("SELECT COUNT(*) FROM fact_sales")).first()
                db_after = int(res[0]) if res else 0
        except Exception as ex:
            logger.warning(f"Could not fetch updated count from fact_sales: {ex}")

        return UploadResponse(
            rows_received=rows_received,
            rows_accepted=validation_result.rows_accepted,
            rows_rejected=validation_result.rows_rejected,
            rejection_reasons=validation_result.rejection_reasons[:5],
            success=True,
            message=f"Successfully processed {validation_result.rows_accepted} sales records into PostgreSQL fact_sales.",
            database_total_before=db_before,
            database_total_after=db_after
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error processing upload: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="An error occurred while validating or loading the sales data. Please check server logs."
        )


@app.post("/api/v1/pipeline/run")
@app.post("/pipeline/run")
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
        logger.error(f"Pipeline run error: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="The ETL/ML pipeline run failed. Please check server logs.",
        )


@app.get("/api/v1/reports/summary")
@app.get("/reports/summary")
def report_summary():
    """Reporting-page metadata: live period + KPIs, email-automation status, last PDF.

    Never returns credentials — only booleans indicating whether env vars are set.
    """
    try:
        kpis = get_kpi_metrics()
    except Exception as e:
        logger.error(f"report_summary KPI error: {e}")
        kpis = {}

    period = {"start": None, "end": None}
    try:
        engine = get_db_connection()
        with engine.connect() as conn:
            row = conn.execute(text(
                "SELECT MIN(dd.full_date), MAX(dd.full_date) "
                "FROM fact_sales fs JOIN dim_date dd ON fs.date_id = dd.date_id"
            )).first()
            if row and row[0]:
                period = {"start": row[0].isoformat(), "end": row[1].isoformat()}
    except Exception as e:
        logger.warning(f"report_summary period error: {e}")

    latest_pdf = None
    for name in ("weekly_sales_report.pdf", "sales_executive_report.pdf"):
        p = PROJECT_ROOT / "reports" / name
        if p.exists():
            latest_pdf = {
                "filename": name,
                "size_bytes": p.stat().st_size,
                "generated_at": __import__("datetime").datetime.fromtimestamp(p.stat().st_mtime).isoformat(),
            }
            break

    email_ready = all(bool(os.getenv(k)) for k in ("EMAIL_USERNAME", "EMAIL_PASSWORD", "REPORT_RECIPIENT"))
    return {
        "period": period,
        "kpis": {
            "total_revenue": kpis.get("total_revenue"),
            "total_orders": kpis.get("total_orders"),
            "total_quantity": kpis.get("total_quantity"),
            "average_order_value": kpis.get("average_order_value"),
            "revenue_growth_pct": kpis.get("growth_pct"),
        },
        "latest_pdf": latest_pdf,
        "email_automation": {
            "configured": email_ready,
            "schedule": "Every Monday 09:00 IST (via GitHub Actions)",
            "note": "Email dispatch runs in CI only; this app does not send email.",
        },
    }


@app.get("/api/v1/reports/download")
@app.get("/reports/download")
def download_pdf_report():
    """Download PDF executive summary report generated fresh from current database facts."""
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
    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", "8000"))
    reload = os.getenv("ENVIRONMENT", "development").lower() == "development"
    uvicorn.run("api.main:app", host=host, port=port, reload=reload)
