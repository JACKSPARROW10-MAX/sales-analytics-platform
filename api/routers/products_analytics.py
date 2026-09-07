import logging
from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any
from sqlalchemy import text
from etl.load_staging import get_db_connection

router = APIRouter()
logger = logging.getLogger(__name__)


@router.get("/products/analytics", response_model=List[Dict[str, Any]])
def get_product_analytics():
    """Return per-product analytics: revenue, quantity, orders, contribution %, avg price.

    Sourced from fact_sales JOIN dim_product in the PostgreSQL star schema.
    """
    engine = get_db_connection()
    query = """
        WITH totals AS (
            SELECT SUM(revenue) AS grand_revenue, SUM(quantity) AS grand_qty, COUNT(*) AS grand_orders
            FROM fact_sales
        )
        SELECT
            p.product_id,
            p.product_name,
            p.category,
            p.subcategory,
            p.unit_price,
            SUM(f.revenue)                                      AS total_revenue,
            SUM(f.quantity)                                     AS total_quantity,
            COUNT(*)                                            AS total_orders,
            AVG(f.revenue)                                      AS avg_order_value,
            AVG(f.discount)                                     AS avg_discount,
            ROUND(SUM(f.revenue) / NULLIF(t.grand_revenue, 0) * 100, 2) AS revenue_contribution_pct,
            MIN(f.revenue)                                      AS min_order_revenue,
            MAX(f.revenue)                                      AS max_order_revenue
        FROM fact_sales f
        JOIN dim_product p ON f.product_id = p.product_id
        CROSS JOIN totals t
        GROUP BY p.product_id, p.product_name, p.category, p.subcategory, p.unit_price,
                 t.grand_revenue, t.grand_qty, t.grand_orders
        ORDER BY total_revenue DESC;
    """
    try:
        with engine.begin() as conn:
            rows = [dict(r._mapping) for r in conn.execute(text(query))]
        # Serialise Decimal to float
        for row in rows:
            for k, v in row.items():
                if hasattr(v, "__float__"):
                    row[k] = float(v)
        return rows
    except Exception as e:
        logger.error(f"Error fetching product analytics: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch product analytics")
