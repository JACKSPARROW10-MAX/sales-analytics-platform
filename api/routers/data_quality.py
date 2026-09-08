import logging
from fastapi import APIRouter, HTTPException
from typing import Dict, Any
from sqlalchemy import text
from etl.load_staging import get_db_connection

router = APIRouter()
logger = logging.getLogger(__name__)


@router.get("/data_quality", response_model=Dict[str, Any])
def get_data_quality():
    """Return real data quality metrics by inspecting staging and curated tables.

    Checks: row counts, null rates, duplicate detection, invalid date/qty/price counts.
    """
    engine = get_db_connection()

    queries = {
        "staging_rows": "SELECT COUNT(*) AS cnt FROM staging_sales;",
        "fact_rows": "SELECT COUNT(*) AS cnt FROM fact_sales;",
        "null_revenue": "SELECT COUNT(*) AS cnt FROM fact_sales WHERE revenue IS NULL;",
        "null_quantity": "SELECT COUNT(*) AS cnt FROM fact_sales WHERE quantity IS NULL;",
        "negative_revenue": "SELECT COUNT(*) AS cnt FROM fact_sales WHERE revenue < 0;",
        "negative_quantity": "SELECT COUNT(*) AS cnt FROM fact_sales WHERE quantity <= 0;",
        "invalid_discount": "SELECT COUNT(*) AS cnt FROM fact_sales WHERE discount < 0 OR discount > 1;",
        "duplicate_sale_ids": """
            SELECT COUNT(*) AS cnt FROM (
                SELECT sale_id FROM fact_sales GROUP BY sale_id HAVING COUNT(*) > 1
            ) AS dupes;
        """,
        "last_ingestion": "SELECT MAX(ingested_at) AS latest FROM staging_sales;",
        "dim_product_count": "SELECT COUNT(*) AS cnt FROM dim_product;",
        "dim_customer_count": "SELECT COUNT(*) AS cnt FROM dim_customer;",
    }

    results: Dict[str, Any] = {}
    try:
        with engine.begin() as conn:
            for key, sql in queries.items():
                row = conn.execute(text(sql)).first()
                if row is None:
                    results[key] = None
                else:
                    val = list(row)[0]
                    results[key] = val.isoformat() if hasattr(val, "isoformat") else int(val) if val is not None else 0

        fact_rows = results.get("fact_rows", 0) or 1  # avoid div by zero
        null_rev = results.get("null_revenue", 0) or 0
        null_qty = results.get("null_quantity", 0) or 0
        neg_rev = results.get("negative_revenue", 0) or 0
        neg_qty = results.get("negative_quantity", 0) or 0
        inv_disc = results.get("invalid_discount", 0) or 0
        dupes = results.get("duplicate_sale_ids", 0) or 0

        total_issues = null_rev + null_qty + neg_rev + neg_qty + inv_disc + dupes
        quality_score = round(max(0, 100 - (total_issues / fact_rows) * 100), 1)

        return {
            "staging_rows": results.get("staging_rows", 0),
            "fact_rows": results.get("fact_rows", 0),
            "dim_product_count": results.get("dim_product_count", 0),
            "dim_customer_count": results.get("dim_customer_count", 0),
            "null_revenue": null_rev,
            "null_quantity": null_qty,
            "negative_revenue": neg_rev,
            "invalid_quantity": neg_qty,
            "invalid_discount": inv_disc,
            "duplicate_sale_ids": dupes,
            "total_issues": total_issues,
            "data_quality_score": quality_score,
            "last_ingestion": results.get("last_ingestion"),
            "status": "good" if quality_score >= 95 else "warning" if quality_score >= 80 else "critical",
        }
    except Exception as e:
        logger.error(f"Data quality check failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Data quality check failed. Please check server logs.")
