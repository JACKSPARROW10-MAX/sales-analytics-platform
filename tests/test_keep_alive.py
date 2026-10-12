import psycopg2
import pytest

from scripts import keep_alive


@pytest.mark.parametrize(
    "raw, expected",
    [
        ("postgresql://u:p@h:5432/d", "postgresql://u:p@h:5432/d"),
        ("postgres://u:p@h:5432/d", "postgresql://u:p@h:5432/d"),
        # libpq rejects SQLAlchemy's driver suffix, so it must be stripped
        ("postgresql+psycopg2://u:p@h:5432/d", "postgresql://u:p@h:5432/d"),
        ("  postgresql://u:p@h/d  ", "postgresql://u:p@h/d"),
    ],
)
def test_to_dsn_normalizes_scheme(raw, expected):
    assert keep_alive.to_dsn(raw) == expected


def test_missing_database_url_fails_cleanly(monkeypatch, capsys):
    monkeypatch.delenv("DATABASE_URL", raising=False)
    assert keep_alive.main() == 1
    assert "DATABASE_URL is not set" in capsys.readouterr().out


def test_success_path_returns_zero_and_never_prints_the_url(monkeypatch, capsys):
    secret_url = "postgresql://someuser:s3cr3tpw@db.example.com:5432/postgres"
    monkeypatch.setenv("DATABASE_URL", secret_url)
    monkeypatch.delenv("API_URL", raising=False)
    monkeypatch.setattr(keep_alive, "probe_database", lambda dsn: 1000)
    assert keep_alive.main() == 0
    out = capsys.readouterr().out
    assert "1,000" in out
    for leaked in ("s3cr3tpw", "someuser", "db.example.com"):
        assert leaked not in out


def test_retries_then_fails_without_leaking_error_text(monkeypatch, capsys):
    monkeypatch.setenv("DATABASE_URL", "postgresql://someuser:s3cr3tpw@db.example.com:5432/postgres")
    monkeypatch.setattr(keep_alive.time, "sleep", lambda s: None)  # don't actually wait
    calls = {"n": 0}

    def boom(dsn):
        calls["n"] += 1
        raise psycopg2.OperationalError("FATAL: password authentication failed for user someuser")

    monkeypatch.setattr(keep_alive, "probe_database", boom)
    assert keep_alive.main() == 1
    assert calls["n"] == keep_alive.ATTEMPTS
    out = capsys.readouterr().out
    assert "OperationalError" in out
    assert "someuser" not in out and "s3cr3tpw" not in out


def test_recovers_if_a_later_attempt_succeeds(monkeypatch):
    monkeypatch.setenv("DATABASE_URL", "postgresql://u:p@h:5432/d")
    monkeypatch.delenv("API_URL", raising=False)
    monkeypatch.setattr(keep_alive.time, "sleep", lambda s: None)
    seq = iter([psycopg2.OperationalError("waking up"), 42])

    def flaky(dsn):
        v = next(seq)
        if isinstance(v, Exception):
            raise v
        return v

    monkeypatch.setattr(keep_alive, "probe_database", flaky)
    assert keep_alive.main() == 0


def test_api_failure_never_fails_the_run(monkeypatch):
    monkeypatch.setenv("DATABASE_URL", "postgresql://u:p@h:5432/d")
    monkeypatch.setenv("API_URL", "https://api.example.invalid")
    monkeypatch.setattr(keep_alive, "probe_database", lambda dsn: None)
    monkeypatch.setattr(keep_alive, "probe_api", lambda url: False)
    assert keep_alive.main() == 0


def test_probe_api_rejects_non_http_schemes():
    assert keep_alive.probe_api("file:///etc/passwd") is False
