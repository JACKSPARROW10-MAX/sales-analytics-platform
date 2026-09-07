import logging
from fastapi import APIRouter, HTTPException
from typing import Dict, Any
from api.utils.sql_helpers import get_kpi_metrics

router = APIRouter()
logger = logging.getLogger(__name__)

@router.get("/kpis", response_model=Dict[str, Any])
def get_kpis():
    """Return executive KPI metrics.
    
    Uses get_kpi_metrics defined in sql_helpers.
    """
    try:
        metrics = get_kpi_metrics()
        return metrics
    except Exception as e:
        logger.error(f"Error fetching KPI metrics: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch KPI data")
