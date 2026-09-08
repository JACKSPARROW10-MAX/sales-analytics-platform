"""
Database Connection Utility for Sales Analytics Platform
Supports both Cloud PostgreSQL (via DATABASE_URL) and Local Docker PostgreSQL.

The connection string is ALWAYS read from the environment (DATABASE_URL, or the
POSTGRES_* fallbacks). It is never hard-coded here. Provide it via the .env file
for local runs, or via a secret / injected env var in CI and production.
"""
import os
import logging
from urllib.parse import urlparse, parse_qs
from sqlalchemy import create_engine, text
from sqlalchemy.engine import Engine
from dotenv import load_dotenv

load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Hosts that are treated as local development targets (plain TCP, no SSL required).
_LOCAL_HOSTS = {"localhost", "127.0.0.1", "::1", "postgres", "db", ""}


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


def _is_local_host(host: str) -> bool:
    """Return True when the target host is a local development database."""
    return (host or "").lower() in _LOCAL_HOSTS


def get_db_connection() -> Engine:
    """
    Create and return an enterprise SQLAlchemy Engine configured for both
    cloud (connection pooling, pre-ping, enforced TLS) and local usage.

    - Local Docker PostgreSQL: plain TCP connection.
    - Cloud PostgreSQL (Supabase, Neon, RDS, ...): TLS is enforced with
      sslmode=require unless the DATABASE_URL already specifies an sslmode.
    """
    url = get_database_url()

    parsed = urlparse(url)
    safe_host = parsed.hostname or "unknown"
    safe_db = (parsed.path or "").lstrip("/") or "default"
    # Never log the full URL / password - host + database name only.
    logger.debug(f"Connecting to database '{safe_db}' on host '{safe_host}'")

    connect_args = {}
    is_local = _is_local_host(parsed.hostname)
    existing_qs = parse_qs(parsed.query or "")
    if not is_local and "sslmode" not in existing_qs:
        # Remote databases must use TLS. psycopg2 reads sslmode from connect_args.
        connect_args["sslmode"] = "require"

    # Cloud-friendly pooling configurations:
    # pool_pre_ping=True checks liveness before issuing queries, mitigating stale connections
    # pool_recycle=300 recycles connections every 5 minutes to play nicely with serverless cloud DBs
    return create_engine(
        url,
        pool_pre_ping=True,
        pool_recycle=300,
        connect_args=connect_args,
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
