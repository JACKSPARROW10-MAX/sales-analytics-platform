import logging
from fastapi import APIRouter, HTTPException
from typing import Dict, Any
from sqlalchemy import text
from etl.load_staging import get_db_connection

router = APIRouter()
logger = logging.getLogger(__name__)


@router.get("/pipeline_health", response_model=Dict[str, Any])
def get_pipeline_health():
    """Return real pipeline health status by querying PostgreSQL.

    Checks table row counts and last ingestion timestamps from staging tables.
    """
    engine = get_db_connection()

    table_counts = {
        "fact_sales": "SELECT COUNT(*) AS cnt FROM fact_sales;",
        "staging_sales": "SELECT COUNT(*) AS cnt FROM staging_sales;",
        "staging_erp": "SELECT COUNT(*) AS cnt FROM staging_erp;",
        "dim_product": "SELECT COUNT(*) AS cnt FROM dim_product;",
        "dim_customer": "SELECT COUNT(*) AS cnt FROM dim_customer;",
        "dim_date": "SELECT COUNT(*) AS cnt FROM dim_date;",
    }

    ingestion_times = {
        "last_csv_ingestion": "SELECT MAX(ingested_at) AS ts FROM staging_sales;",
        "last_erp_ingestion": "SELECT MAX(ingested_at) AS ts FROM staging_erp;",
    }

    results: Dict[str, Any] = {
        "postgres_status": "unknown",
        "etl_status": "unknown",
        "ml_status": "unknown",
        "table_row_counts": {},
        "last_csv_ingestion": None,
        "last_erp_ingestion": None,
        "issues": [],
    }

    try:
        with engine.begin() as conn:
            # Table row counts
            for table, sql in table_counts.items():
                try:
                    row = conn.execute(text(sql)).first()
                    results["table_row_counts"][table] = int(row[0]) if row else 0
                except Exception:
                    results["table_row_counts"][table] = "error"

            # Ingestion timestamps
            for key, sql in ingestion_times.items():
                try:
                    row = conn.execute(text(sql)).first()
                    val = row[0] if row else None
                    results[key] = val.isoformat() if val and hasattr(val, "isoformat") else str(val) if val else None
                except Exception:
                    results[key] = None

        results["postgres_status"] = "healthy"

        # ETL health: staging_sales should have rows
        staging_count = results["table_row_counts"].get("staging_sales", 0)
        if isinstance(staging_count, int) and staging_count > 0:
            results["etl_status"] = "healthy"
        else:
            results["etl_status"] = "no_data"
            results["issues"].append("No records found in staging_sales — ETL may not have run")

        # ML health: check if ml_results.json exists
        from pathlib import Path
        ml_path = Path(__file__).resolve().parent.parent.parent / "data" / "ml_results.json"
        if ml_path.is_file():
            import os
            import datetime
            mtime = os.path.getmtime(ml_path)
            last_ml = datetime.datetime.fromtimestamp(mtime).isoformat()
            results["ml_status"] = "healthy"
            results["ml_last_run"] = last_ml
        else:
            results["ml_status"] = "not_run"
            results["issues"].append("ml_results.json not found — run the ML pipeline first")

        results["overall_status"] = "healthy" if not results["issues"] else "warning"
        return results

    except Exception as e:
        logger.error(f"Pipeline health check failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Pipeline health check failed. Please check server logs.")
