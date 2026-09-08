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


# Module-level engine cache. One pooled Engine per process, keyed by URL, so
# the whole app shares a single small connection pool. This is essential for
# hosted poolers such as Supabase's session pooler, which caps total client
# connections (e.g. 15) — creating a new Engine per request quickly exhausts it.
_ENGINE_CACHE: dict = {}


def _build_engine(url: str) -> Engine:
    parsed = urlparse(url)
    safe_host = parsed.hostname or "unknown"
    safe_db = (parsed.path or "").lstrip("/") or "default"
    logger.info(f"Initialising database engine for '{safe_db}' on host '{safe_host}'")

    connect_args = {"connect_timeout": 10}
    is_local = _is_local_host(parsed.hostname)
    existing_qs = parse_qs(parsed.query or "")
    if not is_local and "sslmode" not in existing_qs:
        # Remote databases must use TLS. psycopg2 reads sslmode from connect_args.
        connect_args["sslmode"] = "require"

    # Pool sizing: conservative by default so N app processes stay under a
    # hosted pooler's client cap (Supabase's free session pooler allows ~15).
    # With the default (3 + 2) two gunicorn workers use at most 10 connections.
    # Raise DB_POOL_SIZE / DB_MAX_OVERFLOW for a bigger database or a pooler
    # with a higher limit (e.g. Supabase transaction pooler on port 6543).
    pool_size = int(os.getenv("DB_POOL_SIZE", "3"))
    max_overflow = int(os.getenv("DB_MAX_OVERFLOW", "2"))

    return create_engine(
        url,
        pool_pre_ping=True,     # drop stale connections before use
        pool_recycle=1800,      # recycle every 30 min
        pool_size=pool_size,
        max_overflow=max_overflow,
        pool_timeout=30,
        connect_args=connect_args,
    )


def get_db_connection() -> Engine:
    """
    Return a process-wide, pooled SQLAlchemy Engine for the configured database.

    - Reads DATABASE_URL (or POSTGRES_* fallback) from the environment.
    - Local Docker PostgreSQL: plain TCP.
    - Cloud PostgreSQL (Supabase, Neon, RDS, ...): TLS enforced (sslmode=require)
      unless the URL already sets sslmode.
    - The Engine is cached per URL so every caller shares one connection pool.
    """
    url = get_database_url()
    engine = _ENGINE_CACHE.get(url)
    if engine is None:
        engine = _build_engine(url)
        _ENGINE_CACHE[url] = engine
    return engine


def dispose_engines() -> None:
    """Dispose all cached engines (useful for tests / graceful shutdown)."""
    for eng in _ENGINE_CACHE.values():
        eng.dispose()
    _ENGINE_CACHE.clear()


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
