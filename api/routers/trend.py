import logging
from fastapi import APIRouter, HTTPException, Query
from typing import List, Dict, Any
from api.utils.sql_helpers import get_trend_data

router = APIRouter()
logger = logging.getLogger(__name__)

@router.get("/trend", response_model=List[Dict[str, Any]])
def get_trend(
    metric: str = Query('revenue', description='Metric: revenue, quantity, or transactions'),
    period: str = Query('daily', description='Period granularity: daily, weekly, monthly'),
    moving_average: int = Query(0, ge=0, description='Moving average window size (0 disables)')
):
    """Return time‑series trend data for the selected metric and period.
    
    The data is sourced from the star schema via ``get_trend_data``.
    """
    try:
        data = get_trend_data(metric=metric, period=period, moving_average=moving_average)
        return data
    except Exception as e:
        logger.error(f"Error fetching trend data: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch trend data")
