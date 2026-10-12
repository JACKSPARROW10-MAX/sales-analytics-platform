"""
Initialize the database schema.
Deployment-safe and idempotent for both Cloud PostgreSQL (via DATABASE_URL)
and Local Docker PostgreSQL.
"""
import logging
import os
import sys
from pathlib import Path
from urllib.parse import quote_plus
from sqlalchemy import create_engine, inspect, text
from dotenv import load_dotenv

# Ensure project root is in sys.path
PROJECT_ROOT = Path(__file__).resolve().parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from db.connection import get_db_connection, with_driver

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

load_dotenv()


def ensure_local_database_exists():
    """
    For local Docker development only:
    If DATABASE_URL is not set, connect to default 'postgres' database
    to ensure the target database exists before connecting to it.
    """
    if os.getenv("DATABASE_URL"):
        return  # Cloud PostgreSQL databases are pre-provisioned; do not run CREATE DATABASE

    db_user = os.getenv('POSTGRES_USER', 'postgres')
    db_password = os.getenv('POSTGRES_PASSWORD', 'postgres')
    db_host = os.getenv('POSTGRES_HOST', 'localhost')
    db_port = os.getenv('POSTGRES_PORT', '5432')
    db_name = os.getenv('POSTGRES_DB', 'sales_platform')

    try:
        admin_url = with_driver(
            f"postgresql://{quote_plus(db_user)}:{quote_plus(db_password)}@{db_host}:{db_port}/postgres"
        )
        admin_engine = create_engine(admin_url, isolation_level="AUTOCOMMIT")
        with admin_engine.connect() as conn:
            result = conn.execute(
                text("SELECT 1 FROM pg_database WHERE datname = :db_name"),
                {'db_name': db_name}
            )
            if not result.fetchone():
                conn.execute(text(f'CREATE DATABASE "{db_name}"'))
                logger.info(f"Created local database: {db_name}")
            else:
                logger.info(f"Local database '{db_name}' already exists")
    except Exception as e:
        logger.warning(f"Could not check/create local database '{db_name}' via admin connection: {e}")


def init_database():
    """
    Initialize database schema safely.
    Creates tables if they do not already exist, preserving all existing production data.
    """
    # 1. For local docker, ensure database exists
    ensure_local_database_exists()

    # 2. Connect to the target database (Cloud or Local)
    engine = get_db_connection()

    schema_file = PROJECT_ROOT / "db" / "schema.sql"
    if not schema_file.exists():
        raise FileNotFoundError(f"Schema file not found at {schema_file}")

    with open(schema_file, "r", encoding="utf-8") as f:
        schema_sql = f.read()

    logger.info("Applying deployment-safe schema DDL statements...")

    try:
        # Some cloud databases restrict CREATE EXTENSION to superusers.
        # Run statements and handle extension gracefully if restricted.
        with engine.begin() as conn:
            for statement in schema_sql.split(";"):
                stmt = statement.strip()
                if not stmt:
                    continue
                try:
                    conn.execute(text(stmt))
                except Exception as stmt_err:
                    if "pgcrypto" in stmt.lower():
                        logger.warning(f"Note: pgcrypto extension creation skipped ({stmt_err}). Continuing...")
                    else:
                        raise stmt_err

        logger.info("Database schema initialized successfully (no data overwritten).")

        # Verify created/existing tables
        inspector = inspect(engine)
        tables = inspector.get_table_names()
        logger.info(f"Verified {len(tables)} tables in database: {tables}")

        required_tables = {"staging_sales", "dim_date", "dim_product", "dim_customer", "fact_sales"}
        missing = required_tables - set(tables)
        if missing:
            logger.error(f"Missing required tables after initialization: {missing}")
            return False

        return True

    except Exception as e:
        logger.error(f"Database initialization failed: {e}")
        raise


if __name__ == "__main__":
    success = init_database()
    if success:
        print("Database initialization complete and verified!")
        sys.exit(0)
    else:
        print("Database initialization completed with warnings/missing tables.")
        sys.exit(1)
