import numpy as np
import pandas as pd

from ingestion.validate import validate_sales_data
from ml.anomaly_detection import detect_anomalies
from ml.forecasting import generate_forecast


def _sales_frame(n=40, seed=0):
    rng = np.random.default_rng(seed)
    dates = pd.date_range("2025-01-01", periods=n, freq="D")
    return pd.DataFrame(
        {
            "sale_date": dates,
            "revenue": rng.normal(1000, 50, n).round(2),
            "quantity": rng.integers(1, 5, n),
            "discount": rng.choice([0.0, 0.05, 0.1], n),
            "product_name": "Widget",
            "customer_name": "Acme",
            "region": "North",
        }
    )


# ─── validation ──────────────────────────────────────────────────────────────
def test_validation_accepts_good_rows_and_rejects_bad_ones():
    df = pd.DataFrame(
        {
            "transaction_id": ["T1", "T2", "T3"],
            "sale_date": ["2025-03-01", "not-a-date", "2025-03-03"],
            "product_id": ["P1", "P1", "P1"],
            "customer_id": ["C1", "C1", "C1"],
            "quantity": [2, 1, -5],
            "unit_price": [10.0, 10.0, 10.0],
            "discount": [0.0, 0.0, 0.0],
            "total_amount": [20.0, 10.0, 10.0],
        }
    )
    result = validate_sales_data(df, source="unit_test")
    assert result.rows_accepted == 1
    assert result.rows_rejected == 2
    assert list(result.accepted_df["transaction_id"]) == ["T1"]


# ─── forecasting ─────────────────────────────────────────────────────────────
def test_forecast_reports_real_model_and_30_future_days():
    out = generate_forecast(_sales_frame(40), days_ahead=30)
    assert out["model"] == "Ridge Regression (scikit-learn)"
    future = [r for r in out["data"] if r["isForecast"]]
    assert len(future) == 30
    assert 0 < out["accuracy"] <= 100
    assert out["projected_30d_revenue"] > 0


def test_forecast_handles_too_little_history_without_inventing_data():
    out = generate_forecast(_sales_frame(3), days_ahead=30)
    assert out["status"] == "insufficient_history"
    assert out["accuracy"] is None
    assert not any(r["isForecast"] for r in out["data"])


def test_forecast_empty_frame():
    out = generate_forecast(pd.DataFrame(columns=["sale_date", "revenue"]), days_ahead=30)
    assert out["data"] == [] and out["status"] == "no_data"


# ─── anomaly detection ───────────────────────────────────────────────────────
def test_detects_an_obvious_outlier():
    df = _sales_frame(60)
    df.loc[10, "revenue"] = 250_000.0  # ~250x normal
    found = detect_anomalies(df, contamination=0.03)
    assert found, "expected the injected outlier to be flagged"
    assert found[0]["actual_value"] == 250_000.0
    assert found[0]["severity"] == "Critical"


def test_no_anomalies_in_flat_data():
    df = _sales_frame(40)
    df["revenue"] = 1000.0
    df["quantity"] = 2
    df["discount"] = 0.0
    assert detect_anomalies(df) == []
