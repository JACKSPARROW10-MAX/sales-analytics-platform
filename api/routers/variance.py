import logging
from fastapi import APIRouter, HTTPException
from typing import List, Dict
from api.utils.sql_helpers import get_variance_records

router = APIRouter()
logger = logging.getLogger(__name__)

@router.get("/variance", response_model=List[Dict])
def get_variance(limit: int = 20):
    """Return top sales variance records.
    Uses the configured baseline (previous period by default).
    """
    try:
        records = get_variance_records(limit=limit)
        return records
    except Exception as e:
        logger.error(f"Error fetching variance: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch variance data")
