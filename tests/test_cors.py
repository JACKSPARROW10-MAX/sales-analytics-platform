import pytest
from fastapi.testclient import TestClient

import api.main as main
from api.main import parse_cors_origins

VERCEL = "https://sales-analytics.vercel.app"


def test_blank_value_from_env_example_falls_back_to_dev_origins():
    # .env.example ships `CORS_ORIGINS=` (blank). That must not mean "allow nothing".
    for raw in (None, "", "   "):
        origins, creds = parse_cors_origins(raw)
        assert "http://localhost:5173" in origins and creds is True


def test_production_origin_is_exact():
    assert parse_cors_origins(VERCEL) == ([VERCEL], True)


@pytest.mark.parametrize("raw", [VERCEL + "/", f" {VERCEL}/ ", VERCEL + "//"])
def test_trailing_slash_is_tolerated(raw):
    assert parse_cors_origins(raw)[0] == [VERCEL]


def test_multiple_origins_and_wildcard():
    assert parse_cors_origins(f"{VERCEL}/, http://localhost:5173")[0] == [VERCEL, "http://localhost:5173"]
    assert parse_cors_origins("*") == (["*"], False)


def test_preflight_end_to_end_allows_only_the_configured_origin():
    """Build a throwaway app with the same middleware config for a production origin."""
    from fastapi import FastAPI
    from fastapi.middleware.cors import CORSMiddleware

    origins, creds = parse_cors_origins(VERCEL + "/")  # pasted with a slash on purpose
    app = FastAPI()
    app.add_middleware(CORSMiddleware, allow_origins=origins, allow_credentials=creds,
                       allow_methods=["GET", "POST"], allow_headers=["*"])

    @app.get("/ping")
    def ping():
        return {"ok": True}

    c = TestClient(app)
    ok = c.options("/ping", headers={"Origin": VERCEL, "Access-Control-Request-Method": "GET"})
    assert ok.headers.get("access-control-allow-origin") == VERCEL
    bad = c.options("/ping", headers={"Origin": "https://evil.example", "Access-Control-Request-Method": "GET"})
    assert "access-control-allow-origin" not in bad.headers
    assert main.app is not None
