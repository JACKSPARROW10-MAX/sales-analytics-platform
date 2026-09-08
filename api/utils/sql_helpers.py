import logging
from typing import List, Dict, Any
from sqlalchemy import text
from etl.load_staging import get_db_connection

logger = logging.getLogger(__name__)

def get_variance_records(limit: int = 20, window_days: int = 7) -> List[Dict[str, Any]]:
    """Fetch top sales variance records using a moving‑average baseline.

    Args:
        limit: Maximum number of records to return.
        window_days: Number of days for the moving average baseline (e.g., 7).
    Returns:
        A list of dictionaries with product name, expected revenue, actual revenue,
        variance amount and percentage.
    """
    engine = get_db_connection()
    query = f"""
    WITH rev AS (
        SELECT
            f.product_id,
            d.full_date AS date,
            SUM(f.revenue) AS revenue
        FROM fact_sales f
        JOIN dim_date d ON f.date_id = d.date_id
        GROUP BY f.product_id, d.full_date
    ), mov_avg AS (
        SELECT
            product_id,
            date,
            revenue,
            AVG(revenue) OVER (
                PARTITION BY product_id
                ORDER BY date
                ROWS BETWEEN {window_days - 1} PRECEDING AND CURRENT ROW
            ) AS expected_rev
        FROM rev
    ), calc AS (
        SELECT
            p.product_name,
            m.expected_rev,
            m.revenue AS actual_rev,
            (m.revenue - m.expected_rev) AS variance_amt,
            CASE WHEN m.expected_rev = 0 THEN 0
                 ELSE (m.revenue - m.expected_rev) / m.expected_rev * 100 END AS variance_pct
        FROM mov_avg m
        JOIN dim_product p ON m.product_id = p.product_id
        WHERE m.revenue <> m.expected_rev
    )
    SELECT product_name, expected_rev, actual_rev, variance_amt, variance_pct
    FROM calc
    ORDER BY ABS(variance_pct) DESC
    LIMIT :limit;
    """
    try:
        with engine.begin() as conn:
            result = conn.execute(text(query), {"limit": limit})
            rows = [dict(r._mapping) for r in result]
        return rows
    except Exception as e:
        logger.error(f"Error computing variance records: {e}")
        raise


def get_kpi_metrics() -> Dict[str, Any]:
    """Compute executive KPI metrics dynamically from the star schema.

    All metrics are computed live from PostgreSQL fact_sales and dim_date.
    No hardcoded numbers or assumptions.
    """
    engine = get_db_connection()
    revenue_query = """
        SELECT SUM(f.revenue) AS total_revenue,
               COUNT(*) AS total_orders,
               SUM(f.quantity) AS total_quantity,
               AVG(f.discount) AS average_discount
        FROM fact_sales f;
    """
    growth_query = """
        WITH dates AS (
            SELECT MIN(dd.full_date) as min_d, MAX(dd.full_date) as max_d
            FROM fact_sales f JOIN dim_date dd ON f.date_id = dd.date_id
        ), split AS (
            SELECT min_d + (max_d - min_d)/2 as mid_d FROM dates
        )
        SELECT 
            COALESCE(SUM(CASE WHEN dd.full_date <= s.mid_d THEN f.revenue ELSE 0 END), 0) as rev_p1,
            COALESCE(SUM(CASE WHEN dd.full_date > s.mid_d THEN f.revenue ELSE 0 END), 0) as rev_p2
        FROM fact_sales f 
        JOIN dim_date dd ON f.date_id = dd.date_id
        CROSS JOIN split s;
    """
    try:
        with engine.begin() as conn:
            rev = conn.execute(text(revenue_query)).first()
            growth_row = conn.execute(text(growth_query)).first()

        total_revenue = float(rev.total_revenue or 0)
        total_orders = int(rev.total_orders or 0)
        total_quantity = int(rev.total_quantity or 0)
        average_discount = float(rev.average_discount or 0)
        average_order_value = round(total_revenue / total_orders, 2) if total_orders else 0.0

        rev_p1 = float(growth_row.rev_p1 or 0) if growth_row else 0
        rev_p2 = float(growth_row.rev_p2 or 0) if growth_row else 0
        if rev_p1 > 0:
            growth_pct = round(((rev_p2 - rev_p1) / rev_p1) * 100, 1)
        elif rev_p2 > 0:
            growth_pct = 100.0
        else:
            growth_pct = 0.0

        is_positive = growth_pct >= 0
        growth_str = f"{'+' if is_positive else ''}{growth_pct}%"

        total_transactions = total_orders

        return {
            "total_revenue": total_revenue,
            "total_orders": total_orders,
            "total_quantity": total_quantity,
            "total_transactions": total_transactions,
            "average_order_value": average_order_value,
            "average_discount": average_discount,
            "growth_pct": growth_pct,
            # Dual-format dictionary matching the React KPICard component.
            # Every value below is computed from fact_sales — no hardcoded numbers.
            "totalRevenue": {
                "value": total_revenue,
                "formatted": f"₹{total_revenue:,.0f}",
                "change": growth_str,
                "isPositive": is_positive,
                "subtext": f"Across {total_orders:,} sales records",
            },
            "totalOrders": {
                "value": total_orders,
                "formatted": f"{total_orders:,}",
                "subtext": "Completed sales transactions",
            },
            "totalQuantity": {
                "value": total_quantity,
                "formatted": f"{total_quantity:,}",
                "subtext": "Units sold across all orders",
            },
            "averageOrderValue": {
                "value": average_order_value,
                "formatted": f"₹{average_order_value:,.0f}",
                "subtext": "Revenue per transaction",
            },
            "revenueGrowth": {
                "value": growth_pct,
                "formatted": growth_str,
                "isPositive": is_positive,
                "subtext": "First half vs. second half of period",
            },
        }
    except Exception as e:
        logger.error(f"Error computing KPI metrics: {e}")
        raise


def get_trend_data(metric: str = "revenue", period: str = "daily", moving_average: int = 0) -> List[Dict[str, Any]]:
    """Retrieve time‑series data for the specified metric and period.

    Args:
        metric: One of "revenue", "quantity", "transactions".
        period: Granularity – "daily", "weekly", or "monthly".
        moving_average: Window size for simple moving average (0 disables).
    Returns:
        List of dicts with keys ``date`` (or period start) and ``value``.
    """
    engine = get_db_connection()
    # Map metric to SQL expression
    metric_expr = {
        "revenue": "SUM(f.revenue)",
        "quantity": "SUM(f.quantity)",
        "transactions": "COUNT(*)",
    }.get(metric, "SUM(f.revenue)")

    # Determine date truncation based on period
    date_trunc = {
        "daily": "day",
        "weekly": "week",
        "monthly": "month",
    }.get(period, "day")

    base_query = f"""
        SELECT date_trunc('{date_trunc}', d.full_date) AS period_start,
               {metric_expr} AS value
        FROM fact_sales f
        JOIN dim_date d ON f.date_id = d.date_id
        GROUP BY period_start
        ORDER BY period_start;
    """
    try:
        with engine.begin() as conn:
            rows = [dict(r._mapping) for r in conn.execute(text(base_query))]
        if moving_average > 0:
            values = [row["value"] for row in rows]
            ma_vals = []
            for i in range(len(values)):
                window = values[max(0, i - moving_average + 1): i + 1]
                ma_vals.append(sum(window) / len(window))
            for i, row in enumerate(rows):
                row["value"] = ma_vals[i]
        return rows
    except Exception as e:
        logger.error(f"Error fetching trend data: {e}")
        raise
