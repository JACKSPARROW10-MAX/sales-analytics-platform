import logging
from fastapi import APIRouter, HTTPException
from typing import Dict, Any
from sqlalchemy import text
from etl.load_staging import get_db_connection

router = APIRouter()
logger = logging.getLogger(__name__)


@router.get("/pricing/analytics", response_model=Dict[str, Any])
def get_pricing_analytics():
    """Return pricing & discount analytics from the star schema.

    All values are computed directly from fact_sales + dim_product.
    No hardcoded numbers.
    """
    engine = get_db_connection()

    summary_query = """
        SELECT
            AVG(f.discount)                                      AS avg_discount,
            SUM(f.quantity * p.unit_price)                       AS revenue_before_discount,
            SUM(f.revenue)                                       AS revenue_after_discount,
            SUM(f.quantity * p.unit_price) - SUM(f.revenue)     AS total_discount_amount,
            ROUND(
                (SUM(f.quantity * p.unit_price) - SUM(f.revenue))
                / NULLIF(SUM(f.quantity * p.unit_price), 0) * 100, 2
            )                                                    AS effective_discount_pct
        FROM fact_sales f
        JOIN dim_product p ON f.product_id = p.product_id;
    """

    by_product_query = """
        SELECT
            p.product_name,
            p.category,
            AVG(f.discount)                      AS avg_discount,
            SUM(f.quantity * p.unit_price)        AS revenue_before_discount,
            SUM(f.revenue)                        AS revenue_after_discount,
            SUM(f.quantity)                       AS total_quantity
        FROM fact_sales f
        JOIN dim_product p ON f.product_id = p.product_id
        GROUP BY p.product_name, p.category
        ORDER BY avg_discount DESC
        LIMIT 20;
    """

    by_category_query = """
        SELECT
            p.category,
            AVG(f.discount)                      AS avg_discount,
            SUM(f.quantity * p.unit_price)        AS revenue_before_discount,
            SUM(f.revenue)                        AS revenue_after_discount,
            SUM(f.quantity)                       AS total_quantity,
            COUNT(*)                              AS total_orders
        FROM fact_sales f
        JOIN dim_product p ON f.product_id = p.product_id
        GROUP BY p.category
        ORDER BY avg_discount DESC;
    """

    discount_vs_qty_query = """
        SELECT
            ROUND(f.discount::numeric, 2)   AS discount_bucket,
            AVG(f.quantity)                 AS avg_quantity,
            AVG(f.revenue)                  AS avg_revenue,
            COUNT(*)                        AS order_count
        FROM fact_sales f
        GROUP BY discount_bucket
        ORDER BY discount_bucket;
    """

    def to_float(val):
        if val is None:
            return 0.0
        try:
            return float(val)
        except Exception:
            return val

    try:
        with engine.begin() as conn:
            summary_row = dict(conn.execute(text(summary_query)).first() or {})
            product_rows = [dict(r) for r in conn.execute(text(by_product_query))]
            category_rows = [dict(r) for r in conn.execute(text(by_category_query))]
            discount_qty_rows = [dict(r) for r in conn.execute(text(discount_vs_qty_query))]

        # Serialise
        for k, v in summary_row.items():
            summary_row[k] = to_float(v)
        for rows in [product_rows, category_rows, discount_qty_rows]:
            for row in rows:
                for k, v in row.items():
                    row[k] = to_float(v)

        return {
            "summary": summary_row,
            "by_product": product_rows,
            "by_category": category_rows,
            "discount_vs_quantity": discount_qty_rows,
        }
    except Exception as e:
        logger.error(f"Error fetching pricing analytics: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch pricing analytics")
