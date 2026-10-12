import pytest

from db import connection
from db.connection import _is_local_host, get_database_url, with_driver


@pytest.mark.parametrize(
    "raw",
    [
        "postgresql://u:p@host:5432/db",
        "postgres://u:p@host:5432/db",
    ],
)
def test_bare_urls_get_explicit_psycopg2_driver(raw):
    # Regression: SQLAlchemy 2.1 defaults bare postgresql:// to psycopg (v3),
    # which is not installed -> "No module named 'psycopg'".
    assert with_driver(raw) == "postgresql+psycopg2://u:p@host:5432/db"


def test_explicit_driver_is_left_alone():
    url = "postgresql+psycopg://u:p@host/db"
    assert with_driver(url) == url


def test_database_url_env_wins_and_is_normalized(monkeypatch):
    monkeypatch.setenv("DATABASE_URL", "  postgres://u:p@h:5432/d  ")
    assert get_database_url() == "postgresql+psycopg2://u:p@h:5432/d"


def test_fallback_url_when_database_url_unset(monkeypatch):
    monkeypatch.delenv("DATABASE_URL", raising=False)
    for k in ("POSTGRES_USER", "POSTGRES_PASSWORD", "POSTGRES_HOST", "POSTGRES_PORT", "POSTGRES_DB"):
        monkeypatch.delenv(k, raising=False)
    assert get_database_url() == "postgresql+psycopg2://postgres:postgres@localhost:5432/sales_platform"


def test_blank_env_values_fall_back_to_defaults(monkeypatch):
    # .env.example ships blank POSTGRES_* values; copying it must not break the URL.
    monkeypatch.delenv("DATABASE_URL", raising=False)
    for k in ("POSTGRES_USER", "POSTGRES_PASSWORD", "POSTGRES_HOST", "POSTGRES_PORT", "POSTGRES_DB"):
        monkeypatch.setenv(k, "")
    assert get_database_url().endswith("@localhost:5432/sales_platform")


def test_fallback_password_with_special_characters_is_encoded(monkeypatch):
    monkeypatch.delenv("DATABASE_URL", raising=False)
    monkeypatch.setenv("POSTGRES_PASSWORD", "p@ss:w/rd")
    url = get_database_url()
    assert "p%40ss%3Aw%2Frd" in url
    assert "p@ss" not in url


def test_local_vs_remote_hosts():
    assert _is_local_host("localhost") and _is_local_host("postgres")
    assert not _is_local_host("aws-0-ap-southeast-1.pooler.supabase.com")


def _capture_engine_kwargs(monkeypatch, url):
    seen = {}

    def fake_create_engine(u, **kwargs):
        seen.update(kwargs)
        return object()

    monkeypatch.setattr(connection, "create_engine", fake_create_engine)
    connection._build_engine(url)
    return seen


def test_remote_host_enforces_tls(monkeypatch):
    kwargs = _capture_engine_kwargs(monkeypatch, "postgresql+psycopg2://u:p@db.example.com:5432/d")
    assert kwargs["connect_args"]["sslmode"] == "require"
    assert kwargs["pool_pre_ping"] is True


def test_local_host_does_not_force_tls(monkeypatch):
    kwargs = _capture_engine_kwargs(monkeypatch, "postgresql+psycopg2://u:p@localhost:5432/d")
    assert "sslmode" not in kwargs["connect_args"]


def test_explicit_sslmode_in_url_is_respected(monkeypatch):
    kwargs = _capture_engine_kwargs(
        monkeypatch, "postgresql+psycopg2://u:p@db.example.com/d?sslmode=verify-full"
    )
    assert "sslmode" not in kwargs["connect_args"]


def test_pool_size_is_configurable(monkeypatch):
    monkeypatch.setenv("DB_POOL_SIZE", "7")
    monkeypatch.setenv("DB_MAX_OVERFLOW", "1")
    kwargs = _capture_engine_kwargs(monkeypatch, "postgresql+psycopg2://u:p@localhost/d")
    assert (kwargs["pool_size"], kwargs["max_overflow"]) == (7, 1)


def test_engine_is_cached_per_url(monkeypatch):
    monkeypatch.setenv("DATABASE_URL", "postgresql://u:p@localhost:5432/cache_test")
    connection.dispose_engines()
    assert connection.get_db_connection() is connection.get_db_connection()
    connection.dispose_engines()
