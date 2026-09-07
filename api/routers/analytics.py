import logging
from fastapi import APIRouter, HTTPException, Query
from typing import List, Dict, Any
from api.utils.sql_helpers import get_trend_data

router = APIRouter()
logger = logging.getLogger(__name__)


@router.get("/analytics/summary", response_model=List[Dict[str, Any]])
def get_analytics_summary(
    metric: str = Query("revenue", description="revenue | quantity | transactions"),
    period: str = Query("daily", description="daily | weekly | monthly"),
    moving_average: int = Query(0, ge=0, description="Moving average window (0 = disabled)"),
):
    """Return time-series sales data for the chosen metric and granularity.

    Sourced directly from the star schema (fact_sales + dim_date).
    """
    try:
        rows = get_trend_data(metric=metric, period=period, moving_average=moving_average)
        # Serialise datetime/date objects to ISO strings
        for row in rows:
            if "period_start" in row and row["period_start"] is not None:
                row["period_start"] = str(row["period_start"])
            if "value" in row and row["value"] is not None:
                row["value"] = float(row["value"])
        return rows
    except Exception as e:
        logger.error(f"Error fetching analytics summary: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch analytics summary")
