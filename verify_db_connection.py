"""
Safe database connection verification for the Sales Analytics Platform.

Reads DATABASE_URL from the environment (.env locally, or an injected secret in
CI/production) and reports connection health WITHOUT ever printing the password
or the full connection string.

Usage:
    python verify_db_connection.py
Exit code 0 = healthy, 1 = a required check failed.
"""
import sys
from urllib.parse import urlparse

from dotenv import load_dotenv
from sqlalchemy import inspect, text

load_dotenv()

from db.connection import get_database_url, get_db_connection  # noqa: E402

REQUIRED_TABLES = [
    "fact_sales",
    "dim_date",
    "dim_product",
    "dim_customer",
    "staging_sales",
    "staging_products",
    "staging_customers",
    "staging_erp",
]

CORE_FACT_TABLES = ["fact_sales", "dim_date", "dim_product", "dim_customer"]


def _safe_target() -> str:
    """Return 'host:port/database' with no credentials, for logging."""
    parsed = urlparse(get_database_url())
    host = parsed.hostname or "unknown"
    port = parsed.port or 5432
    database = (parsed.path or "").lstrip("/") or "default"
    return f"{host}:{port}/{database}"


def main() -> int:
    parsed = urlparse(get_database_url())
    is_supabase = "supabase" in (parsed.hostname or "").lower()

    print("=" * 60)
    print("SUPABASE / POSTGRES CONNECTION VERIFICATION")
    print("=" * 60)
    print(f"Target            : {_safe_target()}")
    print(f"Looks like Supabase: {is_supabase}")

    try:
        engine = get_db_connection()
        with engine.connect() as conn:
            db = conn.execute(text("SELECT current_database()")).scalar()
            schema = conn.execute(text("SELECT current_schema()")).scalar()
            version = conn.execute(text("SHOW server_version")).scalar()
            # libpq reports the real client<->server(or pooler) transport encryption.
            try:
                ssl_used = conn.connection.driver_connection.info.ssl_in_use  # type: ignore[union-attr]
            except Exception:  # noqa: BLE001
                ssl_used = "unknown"
    except Exception as exc:  # noqa: BLE001
        # str(exc) from psycopg2 does not contain the password, but scrub the URL just in case.
        msg = str(exc).replace(get_database_url(), "[DATABASE_URL]")
        print(f"\nCONNECTION FAILED: {msg}")
        return 1

    print("\n-- Connection established --")
    print(f"current_database(): {db}")
    print(f"current_schema()  : {schema}")
    print(f"server_version    : {version}")
    print(f"TLS on client link: {ssl_used}")

    inspector = inspect(engine)
    existing = set(inspector.get_table_names(schema="public"))
    print("\n-- Required tables --")
    missing = []
    for table in REQUIRED_TABLES:
        present = table in existing
        print(f"  {'OK  ' if present else 'MISS'}  {table}")
        if not present:
            missing.append(table)

    if missing:
        print(f"\nMissing tables: {missing}")
        print("Run:  python init_db.py")
        return 1

    print("\n-- Row counts --")
    empty_core = []
    with engine.connect() as conn:
        for table in CORE_FACT_TABLES:
            count = conn.execute(text(f"SELECT COUNT(*) FROM {table}")).scalar()  # nosec B608 - table is from the constant CORE_FACT_TABLES list
            print(f"  {table:<16} {count:>10,}")
            if table in CORE_FACT_TABLES and count == 0:
                empty_core.append(table)

    if empty_core:
        print(f"\nCore tables with no data: {empty_core}")
        print("Run:  python run_pipeline.py")
        return 1

    print("\nAll checks passed.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
