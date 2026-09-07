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
            SUM(f.quantity * f.unit_price * (1 - f.discount)) AS revenue
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
    )
    SELECT
        p.product_name,
        expected_rev,
        revenue AS actual_rev,
        (revenue - expected_rev) AS variance_amt,
        CASE WHEN expected_rev = 0 THEN 0
             ELSE (revenue - expected_rev) / expected_rev * 100 END AS variance_pct
    FROM mov_avg m
    JOIN dim_product p ON m.product_id = p.product_id
    WHERE revenue <> expected_rev
    ORDER BY ABS(variance_pct) DESC
    LIMIT :limit;
    """
    try:
        with engine.begin() as conn:
            result = conn.execute(text(query), {"limit": limit})
            rows = [dict(r) for r in result]
        return rows
    except Exception as e:
        logger.error(f"Error computing variance records: {e}")
        raise


def get_kpi_metrics() -> Dict[str, Any]:
    """Compute executive KPI metrics from the star schema.

    Returns a dictionary with keys:
        total_revenue, total_orders, total_quantity,
        average_order_value, average_discount, growth_pct,
        anomaly_count, forecast_next_period_revenue
    """
    engine = get_db_connection()
    # Basic aggregates
    revenue_query = """
        SELECT SUM(f.quantity * f.unit_price * (1 - f.discount)) AS total_revenue,
               COUNT(*) AS total_orders,
               SUM(f.quantity) AS total_quantity,
               AVG(f.discount) AS average_discount
        FROM fact_sales f;
    """
    anomaly_query = "SELECT COUNT(*) AS anomaly_count FROM fact_anomalies;"  # assuming such table
    try:
        with engine.begin() as conn:
            rev = conn.execute(text(revenue_query)).first()
            anom = conn.execute(text(anomaly_query)).first()
        total_revenue = rev.total_revenue or 0
        total_orders = rev.total_orders or 0
        total_quantity = rev.total_quantity or 0
        average_discount = rev.average_discount or 0
        average_order_value = total_revenue / total_orders if total_orders else 0
        # Simple growth % using previous period (placeholder)
        growth_pct = 0.0
        # Placeholder forecast next period revenue
        forecast_next_period_revenue = 0.0
        return {
            "total_revenue": total_revenue,
            "total_orders": total_orders,
            "total_quantity": total_quantity,
            "average_order_value": average_order_value,
            "average_discount": average_discount,
            "growth_pct": growth_pct,
            "anomaly_count": anom.anomaly_count if anom else 0,
            "forecast_next_period_revenue": forecast_next_period_revenue,
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
        "revenue": "SUM(f.quantity * f.unit_price * (1 - f.discount))",
        "quantity": "SUM(f.quantity)",
        "transactions": "COUNT(*)",
    }.get(metric, "SUM(f.quantity * f.unit_price * (1 - f.discount))")

    # Determine date truncation based on period
    date_trunc = {
        "daily": "day",
        "weekly": "week",
        "monthly": "month",
    }.get(period, "day")

    base_query = f"""
        SELECT date_trunc('{date_trunc}', d.date) AS period_start,
               {metric_expr} AS value
        FROM fact_sales f
        JOIN dim_date d ON f.date_id = d.date_id
        GROUP BY period_start
        ORDER BY period_start;
    """
    try:
        with engine.begin() as conn:
            rows = [dict(r) for r in conn.execute(text(base_query))]
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
