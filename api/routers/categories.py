import logging
from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any
from sqlalchemy import text
from etl.load_staging import get_db_connection

router = APIRouter()
logger = logging.getLogger(__name__)


@router.get("/categories/analytics", response_model=List[Dict[str, Any]])
def get_category_analytics():
    """Return category-level analytics: revenue, quantity, orders, contribution %.

    Sourced from fact_sales JOIN dim_product grouped by category.
    """
    engine = get_db_connection()
    query = """
        WITH totals AS (
            SELECT SUM(revenue) AS grand_revenue
            FROM fact_sales
        )
        SELECT
            p.category,
            SUM(f.revenue)                                           AS total_revenue,
            SUM(f.quantity)                                          AS total_quantity,
            COUNT(*)                                                 AS total_orders,
            AVG(f.revenue)                                           AS avg_order_value,
            AVG(f.discount)                                          AS avg_discount,
            ROUND(SUM(f.revenue) / NULLIF(t.grand_revenue, 0) * 100, 2) AS revenue_contribution_pct,
            COUNT(DISTINCT p.product_id)                             AS product_count
        FROM fact_sales f
        JOIN dim_product p ON f.product_id = p.product_id
        CROSS JOIN totals t
        GROUP BY p.category, t.grand_revenue
        ORDER BY total_revenue DESC;
    """
    try:
        with engine.begin() as conn:
            rows = [dict(r._mapping) for r in conn.execute(text(query))]
        for row in rows:
            for k, v in row.items():
                if hasattr(v, "__float__"):
                    row[k] = float(v)
        return rows
    except Exception as e:
        logger.error(f"Error fetching category analytics: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch category analytics")


@router.get("/categories/subcategory", response_model=List[Dict[str, Any]])
def get_subcategory_analytics():
    """Return subcategory-level analytics.

    Sourced from fact_sales JOIN dim_product grouped by subcategory.
    """
    engine = get_db_connection()
    query = """
        WITH totals AS (
            SELECT SUM(revenue) AS grand_revenue
            FROM fact_sales
        )
        SELECT
            p.category,
            COALESCE(p.subcategory, 'Uncategorised') AS subcategory,
            SUM(f.revenue)                                           AS total_revenue,
            SUM(f.quantity)                                          AS total_quantity,
            COUNT(*)                                                 AS total_orders,
            AVG(f.revenue)                                           AS avg_order_value,
            ROUND(SUM(f.revenue) / NULLIF(t.grand_revenue, 0) * 100, 2) AS revenue_contribution_pct,
            COUNT(DISTINCT p.product_id)                             AS product_count
        FROM fact_sales f
        JOIN dim_product p ON f.product_id = p.product_id
        CROSS JOIN totals t
        GROUP BY p.category, p.subcategory, t.grand_revenue
        ORDER BY total_revenue DESC;
    """
    try:
        with engine.begin() as conn:
            rows = [dict(r._mapping) for r in conn.execute(text(query))]
        for row in rows:
            for k, v in row.items():
                if hasattr(v, "__float__"):
                    row[k] = float(v)
        return rows
    except Exception as e:
        logger.error(f"Error fetching subcategory analytics: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch subcategory analytics")
