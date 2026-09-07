import logging
from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any
from sqlalchemy import text
from etl.load_staging import get_db_connection

router = APIRouter()
logger = logging.getLogger(__name__)


@router.get("/regions/analytics", response_model=List[Dict[str, Any]])
def get_region_analytics():
    """Return region-level analytics: revenue, orders, AOV, contribution %.

    Sourced from fact_sales JOIN dim_customer grouped by region.
    """
    engine = get_db_connection()
    query = """
        WITH totals AS (
            SELECT SUM(revenue) AS grand_revenue
            FROM fact_sales
        )
        SELECT
            c.region,
            SUM(f.revenue)                                           AS total_revenue,
            COUNT(*)                                                 AS total_orders,
            AVG(f.revenue)                                           AS avg_order_value,
            SUM(f.quantity)                                          AS total_quantity,
            AVG(f.discount)                                          AS avg_discount,
            ROUND(SUM(f.revenue) / NULLIF(t.grand_revenue, 0) * 100, 2) AS revenue_contribution_pct,
            COUNT(DISTINCT f.customer_id)                            AS unique_customers
        FROM fact_sales f
        JOIN dim_customer c ON f.customer_id = c.customer_id
        CROSS JOIN totals t
        GROUP BY c.region, t.grand_revenue
        ORDER BY total_revenue DESC;
    """
    try:
        with engine.begin() as conn:
            rows = [dict(r) for r in conn.execute(text(query))]
        for row in rows:
            for k, v in row.items():
                if hasattr(v, "__float__"):
                    row[k] = float(v)
        return rows
    except Exception as e:
        logger.error(f"Error fetching region analytics: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch region analytics")


@router.get("/regions/segment", response_model=List[Dict[str, Any]])
def get_segment_analytics():
    """Return customer segment analytics: revenue, orders, AOV, contribution %."""
    engine = get_db_connection()
    query = """
        WITH totals AS (
            SELECT SUM(revenue) AS grand_revenue
            FROM fact_sales
        )
        SELECT
            c.segment,
            SUM(f.revenue)                                           AS total_revenue,
            COUNT(*)                                                 AS total_orders,
            AVG(f.revenue)                                           AS avg_order_value,
            SUM(f.quantity)                                          AS total_quantity,
            ROUND(SUM(f.revenue) / NULLIF(t.grand_revenue, 0) * 100, 2) AS revenue_contribution_pct,
            COUNT(DISTINCT f.customer_id)                            AS unique_customers
        FROM fact_sales f
        JOIN dim_customer c ON f.customer_id = c.customer_id
        CROSS JOIN totals t
        GROUP BY c.segment, t.grand_revenue
        ORDER BY total_revenue DESC;
    """
    try:
        with engine.begin() as conn:
            rows = [dict(r) for r in conn.execute(text(query))]
        for row in rows:
            for k, v in row.items():
                if hasattr(v, "__float__"):
                    row[k] = float(v)
        return rows
    except Exception as e:
        logger.error(f"Error fetching segment analytics: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch segment analytics")
