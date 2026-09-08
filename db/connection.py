"""
Database Connection Utility for Sales Analytics Platform
Supports both Cloud PostgreSQL (via DATABASE_URL) and Local Docker PostgreSQL.
"""
import os
import logging
from urllib.parse import urlparse
from sqlalchemy import create_engine, text
from sqlalchemy.engine import Engine
from dotenv import load_dotenv

load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def get_database_url() -> str:
    """
    Retrieve and normalize the PostgreSQL connection URL.
    Prioritizes DATABASE_URL environment variable (for Cloud deployments).
    Falls back to individual POSTGRES_* environment variables (for Local development).
    
    Ensures compatibility with SQLAlchemy 2.0+ by converting postgres:// to postgresql://.
    """
    db_url = os.getenv("DATABASE_URL")
    if db_url and db_url.strip():
        db_url = db_url.strip()
        # SQLAlchemy 2.0+ deprecated postgres:// in favor of postgresql://
        if db_url.startswith("postgres://"):
            db_url = db_url.replace("postgres://", "postgresql://", 1)
        return db_url

    # Fallback to local Docker Compose environment variables
    user = os.getenv("POSTGRES_USER", "postgres")
    password = os.getenv("POSTGRES_PASSWORD", "postgres")
    host = os.getenv("POSTGRES_HOST", "localhost")
    port = os.getenv("POSTGRES_PORT", "5432")
    db_name = os.getenv("POSTGRES_DB", "sales_platform")

    return f"postgresql://{user}:{password}@{host}:{port}/{db_name}"


def get_db_connection() -> Engine:
    """
    Create and return an enterprise SQLAlchemy Engine configured for both
    cloud (connection pooling, pre-ping) and local usage.
    """
    url = get_database_url()
    
    # Hide password in debug logs
    try:
        parsed = urlparse(url)
        safe_host = parsed.hostname or "unknown"
        safe_db = parsed.path.lstrip("/") or "default"
        logger.debug(f"Connecting to database '{safe_db}' on host '{safe_host}'")
    except Exception:
        pass

    # Cloud-friendly pooling configurations:
    # pool_pre_ping=True checks liveness before issuing queries, mitigating stale connections
    # pool_recycle=300 recycles connections every 5 minutes to play nicely with serverless cloud DBs
    return create_engine(
        url,
        pool_pre_ping=True,
        pool_recycle=300
    )


def check_database_connection():
    """
    Verify database connectivity by executing SELECT 1.
    
    Returns:
        (is_connected: bool, message_or_error: str)
    """
    try:
        engine = get_db_connection()
        with engine.connect() as conn:
            conn.execute(text("SELECT 1;"))
        return True, "Database connection successful"
    except Exception as e:
        return False, str(e)
