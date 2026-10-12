from fastapi.testclient import TestClient

import api.main as main

client = TestClient(main.app)


def test_health_reports_connected_without_leaking_credentials(monkeypatch):
    monkeypatch.setattr(main, "check_database_connection", lambda: (True, "ok"))
    body = client.get("/health").json()
    assert body["status"] == "healthy"
    assert body["database"] == "connected"
    text = str(body).lower()
    for secret_word in ("password", "postgresql", "database_url", "supabase"):
        assert secret_word not in text


def test_health_degrades_when_database_is_down(monkeypatch):
    monkeypatch.setattr(
        main, "check_database_connection", lambda: (False, "FATAL: password authentication failed")
    )
    res = client.get("/health")
    assert res.status_code == 200
    body = res.json()
    assert body["status"] == "degraded"
    assert body["database"] == "disconnected"
    assert "password" not in str(body).lower()  # the raw driver error must not be echoed


def test_upload_rejects_non_csv():
    res = client.post("/api/v1/ingest/upload", files={"file": ("data.txt", b"a,b\n1,2\n", "text/plain")})
    assert res.status_code == 400


def test_upload_rejects_empty_file():
    res = client.post("/api/v1/ingest/upload", files={"file": ("empty.csv", b"", "text/csv")})
    assert res.status_code == 400
    assert "empty" in res.json()["detail"].lower()


def test_cors_header_present_for_dev_origin():
    # Default dev origins (or "*" if CORS_ORIGINS is set that way in a local .env).
    res = client.get("/health", headers={"Origin": "http://localhost:5173"})
    assert res.headers.get("access-control-allow-origin") in ("http://localhost:5173", "*")
