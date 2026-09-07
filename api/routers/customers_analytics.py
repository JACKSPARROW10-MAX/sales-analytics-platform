import logging
from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any
from sqlalchemy import text
from etl.load_staging import get_db_connection

router = APIRouter()
logger = logging.getLogger(__name__)


@router.get("/customers/analytics", response_model=List[Dict[str, Any]])
def get_customer_analytics():
    """Return per-customer analytics: revenue, orders, AOV, contribution %, segment.

    Sourced from fact_sales JOIN dim_customer in the PostgreSQL star schema.
    """
    engine = get_db_connection()
    query = """
        WITH totals AS (
            SELECT SUM(revenue) AS grand_revenue, COUNT(*) AS grand_orders
            FROM fact_sales
        )
        SELECT
            c.customer_id,
            c.customer_name,
            c.region,
            c.segment,
            SUM(f.revenue)                                          AS total_revenue,
            COUNT(*)                                                AS total_orders,
            AVG(f.revenue)                                          AS avg_order_value,
            SUM(f.quantity)                                         AS total_quantity,
            AVG(f.discount)                                         AS avg_discount,
            ROUND(SUM(f.revenue) / NULLIF(t.grand_revenue, 0) * 100, 2) AS revenue_contribution_pct,
            MIN(dd.full_date)                                       AS first_purchase_date,
            MAX(dd.full_date)                                       AS last_purchase_date
        FROM fact_sales f
        JOIN dim_customer c ON f.customer_id = c.customer_id
        JOIN dim_date dd    ON f.date_id = dd.date_id
        CROSS JOIN totals t
        GROUP BY c.customer_id, c.customer_name, c.region, c.segment,
                 t.grand_revenue, t.grand_orders
        ORDER BY total_revenue DESC;
    """
    try:
        with engine.begin() as conn:
            rows = [dict(r._mapping) for r in conn.execute(text(query))]
        for row in rows:
            for k, v in row.items():
                if hasattr(v, "__float__"):
                    row[k] = float(v)
                elif hasattr(v, "isoformat"):          # date objects
                    row[k] = v.isoformat()
        return rows
    except Exception as e:
        logger.error(f"Error fetching customer analytics: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch customer analytics")
