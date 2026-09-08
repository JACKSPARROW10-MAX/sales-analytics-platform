"""
Comprehensive end-to-end verification script for Tests 1 through 10.
Tests:
- Local & Cloud DB connection abstraction
- /health endpoint
- CSV ingestion & validation
- Staging -> Fact table ETL
- ML retraining (forecasts, anomalies, recommendations)
- Manual PDF report generation
- Dry-run email notification
"""
import os
import sys
import json
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from db.connection import check_database_connection, get_db_connection
from api.main import health_check
from ingestion.extract_csv import extract_sales_csv
from ingestion.validate import validate_sales_data
from etl.load_staging import load_all_staging
from etl.transform import run_transform
from ml.train import run_ml_pipeline
from reports.generate_pdf_report import generate_sales_report_pdf
from reports.email_report import send_executive_email_report
from sqlalchemy import text


def run_verification():
    print("=" * 60)
    print("SALES ANALYTICS PLATFORM - FULL SYSTEM VERIFICATION")
    print("=" * 60)

    # 1. Database Connection Test
    print("\n[TEST 1 & 2] Checking Database Connection & /health endpoint...")
    ok, msg = check_database_connection()
    assert ok, f"Database check failed: {msg}"
    print(f"  -> Database connection OK: {msg}")

    health = health_check()
    assert health["status"] == "healthy", f"Health check status: {health}"
    assert health["database"] == "connected", f"Database status: {health}"
    print(f"  -> Health check response: {health}")

    # 2. Fact Sales Count Before
    engine = get_db_connection()
    with engine.connect() as conn:
        before_count = conn.execute(text("SELECT COUNT(*) FROM fact_sales")).scalar() or 0
    print(f"\n[TEST 5 (Baseline)] Current fact_sales rows: {before_count}")

    # 3. CSV Ingestion & Validation
    sample_csv = PROJECT_ROOT / "data" / "sample" / "sales_data.csv"
    print(f"\n[TEST 4] Validating & Ingesting CSV: {sample_csv}...")
    df = extract_sales_csv(str(sample_csv))
    val = validate_sales_data(df, source="sample")
    print(f"  -> Received {len(df)} rows, accepted: {val.rows_accepted}, rejected: {val.rows_rejected}")
    assert val.rows_accepted > 0, "No rows accepted from sample CSV!"

    # 4. Load Staging & Run Transform
    print("\n[TEST 5] Loading to staging and transforming to star schema...")
    load_all_staging(sales_df=val.accepted_df, engine=engine)
    transform_summary = run_transform(engine)
    print(f"  -> Transform summary: {transform_summary}")

    with engine.connect() as conn:
        after_count = conn.execute(text("SELECT COUNT(*) FROM fact_sales")).scalar() or 0
    print(f"  -> fact_sales rows after transform: {after_count}")
    assert after_count >= before_count, "fact_sales count decreased!"

    # 5. ML Pipeline Retraining (Forecast, Anomalies, Recommendations)
    print("\n[TEST 6, 7, 8, 9] Retraining ML pipeline on current data...")
    ml_res = run_ml_pipeline()
    anomalies = ml_res.get("anomalies", [])
    forecast = ml_res.get("forecast", {})
    recs = ml_res.get("recommendations", [])
    print(f"  -> Anomalies detected: {len(anomalies)}")
    print(f"  -> Forecast horizon data points: {len(forecast.get('data', []))}")
    print(f"  -> Actionable recommendations: {len(recs)}")
    assert len(recs) > 0, "No recommendations generated!"

    # 6. Manual PDF Report Generation
    out_pdf = PROJECT_ROOT / "reports" / "weekly_sales_report.pdf"
    print(f"\n[TEST 10 & 12] Generating PDF report manually to {out_pdf}...")
    pdf_path = generate_sales_report_pdf(str(out_pdf))
    assert os.path.exists(pdf_path), f"PDF file does not exist at {pdf_path}"
    pdf_size = os.path.getsize(pdf_path)
    assert pdf_size > 0, "PDF file is empty!"
    print(f"  -> Generated PDF report: {pdf_path} ({pdf_size} bytes)")

    # 7. Email Notification Validation (Dry Run)
    print(f"\n[TEST 13 (Dry Run)] Validating email dispatch logic with attached PDF...")
    email_res = send_executive_email_report(
        recipient_email="executive@company.com",
        report_pdf_path=pdf_path,
        dry_run=True
    )
    assert email_res["status"] == "success", f"Email check failed: {email_res}"
    print(f"  -> Email validation OK: {email_res['message']}")
    print(f"  -> Attached: {email_res['attachment']} ({email_res['attachment_size_bytes']} bytes)")

    print("\n" + "=" * 60)
    print("ALL 10 VERIFICATION TESTS COMPLETED SUCCESSFULLY!")
    print("=" * 60)


if __name__ == "__main__":
    run_verification()
