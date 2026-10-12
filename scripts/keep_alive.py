"""
Keep-alive / uptime probe for the cloud database (and, optionally, the API).

Run by .github/workflows/keep-alive.yml on a schedule. Free-tier hosted Postgres
(e.g. Supabase) pauses a project after a period of inactivity; a regular real
query keeps it awake, and a failure here makes the scheduled run go red so
GitHub notifies you *before* the dashboard or the weekly report breaks.

Deliberately depends only on psycopg2 so the job installs in seconds.
Never prints the connection string, host, user or password.

Exit codes: 0 = database reachable, 1 = could not connect after retries.
"""
import os
import sys
import time
import urllib.error
import urllib.request
from typing import Any, Dict, Optional

import psycopg2

ATTEMPTS = 4
BACKOFF_SECONDS = 10  # the pooler can take a moment to wake a paused project


def to_dsn(url: str) -> str:
    """libpq understands postgresql:// but not SQLAlchemy's postgresql+psycopg2://."""
    url = url.strip()
    if url.startswith("postgres://"):
        url = "postgresql://" + url[len("postgres://"):]
    if url.startswith("postgresql+psycopg2://"):
        url = "postgresql://" + url[len("postgresql+psycopg2://"):]
    return url


def _is_local(dsn: str) -> bool:
    return any(h in dsn for h in ("@localhost", "@127.0.0.1", "@postgres:", "@db:"))


def probe_database(dsn: str) -> Optional[int]:
    """Open a real connection and run real queries. Returns fact_sales row count if it exists."""
    kwargs: Dict[str, Any] = {"connect_timeout": 15}
    if not _is_local(dsn) and "sslmode=" not in dsn:
        kwargs["sslmode"] = "require"
    conn = psycopg2.connect(dsn, **kwargs)
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT 1")
            cur.fetchone()
            try:
                cur.execute("SELECT COUNT(*) FROM fact_sales")
                row = cur.fetchone()
                return int(row[0]) if row else None
            except psycopg2.Error:
                conn.rollback()
                return None  # connected fine; the schema just isn't there (yet)
    finally:
        conn.close()


def probe_api(url: str) -> bool:
    """GET <url>/health. Informational only: never fails the run."""
    target = url.rstrip("/") + "/health"
    if not target.startswith(("https://", "http://")):
        print("API check skipped: API_URL must start with http:// or https://")
        return False
    try:
        req = urllib.request.Request(target, headers={"User-Agent": "keep-alive-probe"})
        with urllib.request.urlopen(req, timeout=60) as resp:  # nosec B310 - scheme validated above
            print(f"API /health -> HTTP {resp.status}")
            return 200 <= resp.status < 300
    except (urllib.error.URLError, TimeoutError, OSError) as exc:
        print(f"API /health unreachable ({type(exc).__name__}); a sleeping free-tier host can take ~1 min to wake")
        return False


def main() -> int:
    raw = os.environ.get("DATABASE_URL", "").strip()
    if not raw:
        print("ERROR: DATABASE_URL is not set (add it as a repository secret).")
        return 1
    dsn = to_dsn(raw)

    for attempt in range(1, ATTEMPTS + 1):
        try:
            count = probe_database(dsn)
            suffix = f", fact_sales rows: {count:,}" if count is not None else ", fact_sales not found"
            print(f"Database reachable (attempt {attempt}/{ATTEMPTS}){suffix}")
            break
        except psycopg2.Error as exc:
            # Print only the error class + the first line; str(exc) can contain the user/host.
            print(f"Attempt {attempt}/{ATTEMPTS} failed: {type(exc).__name__}")
            if attempt == ATTEMPTS:
                print(
                    "ERROR: the database did not respond. If this is Supabase, open the dashboard and "
                    "click 'Restore project' (free projects pause after ~1 week idle)."
                )
                return 1
            time.sleep(BACKOFF_SECONDS * attempt)

    api_url = os.environ.get("API_URL", "").strip()
    if api_url:
        probe_api(api_url)
    return 0


if __name__ == "__main__":
    sys.exit(main())
