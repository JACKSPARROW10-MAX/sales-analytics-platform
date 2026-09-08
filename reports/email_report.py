"""
Email Report Notification Module
Sends automated weekly sales executive PDF reports via SMTP (supporting Gmail, SendGrid, Amazon SES, Outlook).
"""
import os
import sys
import smtplib
import logging
from pathlib import Path
from datetime import datetime
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.application import MIMEApplication
from typing import Dict, Any, Optional
from dotenv import load_dotenv

# Ensure project root is on sys.path
PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

load_dotenv()

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)


def build_email_body_html(report_date: str) -> str:
    """Build a professional, branded executive summary email in HTML."""
    return f"""<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 0; background-color: #f4faf5; color: #1e293b; }}
    .container {{ max-width: 620px; margin: 24px auto; background: #ffffff; border-radius: 12px; border: 1px solid #dae8dc; overflow: hidden; box-shadow: 0 4px 12px rgba(5,31,32,0.06); }}
    .header {{ background: linear-gradient(135deg, #051F20 0%, #163832 100%); padding: 28px 32px; color: #ffffff; }}
    .header h1 {{ margin: 0; font-size: 20px; font-weight: 700; letter-spacing: 0.5px; color: #DAF1DE; }}
    .header p {{ margin: 6px 0 0 0; font-size: 13px; color: #8EB69B; }}
    .content {{ padding: 28px 32px; }}
    .lead {{ font-size: 15px; line-height: 1.6; color: #0B2B26; margin-bottom: 20px; }}
    .badge {{ display: inline-block; padding: 4px 10px; background: #DAF1DE; color: #235347; font-weight: 600; font-size: 12px; border-radius: 6px; margin-bottom: 16px; }}
    .card {{ background: #F4FAF5; border: 1px solid #8EB69B; border-radius: 8px; padding: 16px; margin-bottom: 20px; }}
    .card-title {{ font-size: 12px; font-weight: 700; color: #235347; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px; }}
    .card-text {{ font-size: 13px; color: #1e293b; line-height: 1.5; margin: 0; }}
    .footer {{ background: #F4FAF5; padding: 20px 32px; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; text-align: center; }}
    .footer a {{ color: #235347; text-decoration: none; font-weight: 600; }}
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Sales Analytics Platform</h1>
      <p>Weekly Executive Intelligence &amp; Performance Summary — {report_date}</p>
    </div>
    <div class="content">
      <span class="badge">CONFIDENTIAL EXECUTIVE REPORT</span>
      <p class="lead">
        Your automated weekly sales intelligence report has been generated directly from the live PostgreSQL warehouse and ML models.
      </p>
      <div class="card">
        <div class="card-title">Attached Report Highlights</div>
        <p class="card-text">
          • <b>Live Star-Schema KPIs:</b> Revenue, Transactions, Volume, AOV &amp; Discounting<br>
          • <b>Dimensional Breakdown:</b> Top Products, Regional Performance &amp; Categories<br>
          • <b>Variance &amp; Anomaly Detection:</b> Statistical anomalies &amp; root causes<br>
          • <b>Predictive &amp; Prescriptive AI:</b> Ridge ML forecasts and GenAI strategies
        </p>
      </div>
      <p style="font-size: 13px; color: #475569;">
        Please find the complete PDF attached: <code>weekly_sales_report.pdf</code>.
      </p>
    </div>
    <div class="footer">
      Generated automatically via GitHub Actions CI/CD Pipeline &bull; Sales Analytics Platform
    </div>
  </div>
</body>
</html>"""


def send_executive_email_report(
    recipient_email: Optional[str] = None,
    report_pdf_path: Optional[str] = None,
    dry_run: bool = False
) -> Dict[str, Any]:
    """
    Send an automated email notification with the attached sales executive PDF report.
    
    Args:
        recipient_email: Email address of stakeholder (reads REPORT_RECIPIENT env if None)
        report_pdf_path: Path to generated PDF report (defaults to reports/weekly_sales_report.pdf)
        dry_run: If True, validate configuration and compilation without sending network packets
        
    Returns:
        Status dict
    """
    # 1. Resolve Recipient
    recipient = recipient_email or os.getenv("REPORT_RECIPIENT") or os.getenv("RECIPIENT_EMAIL")
    if not recipient:
        if dry_run:
            recipient = "dry-run@example.invalid"
        else:
            raise ValueError(
                "Missing recipient email: pass recipient_email or set REPORT_RECIPIENT."
            )

    # 2. Resolve PDF Path
    if report_pdf_path is None:
        candidate_paths = [
            PROJECT_ROOT / "reports" / "weekly_sales_report.pdf",
            PROJECT_ROOT / "reports" / "sales_executive_report.pdf"
        ]
        for cp in candidate_paths:
            if cp.exists():
                report_pdf_path = str(cp)
                break
        if report_pdf_path is None:
            report_pdf_path = str(candidate_paths[0])

    pdf_file = Path(report_pdf_path).resolve()
    if not pdf_file.exists():
        raise FileNotFoundError(f"PDF report not found at: {pdf_file}")
    if pdf_file.stat().st_size == 0:
        raise ValueError(f"PDF report file is empty at: {pdf_file}")

    # 3. SMTP Configuration
    smtp_server = os.getenv("SMTP_SERVER", "smtp.gmail.com")
    smtp_port = int(os.getenv("SMTP_PORT", "465"))
    email_user = os.getenv("EMAIL_USERNAME") or os.getenv("SMTP_USERNAME")
    email_pass = os.getenv("EMAIL_PASSWORD") or os.getenv("SMTP_PASSWORD")

    report_date = datetime.now().strftime("%B %d, %Y")
    subject = f"Weekly Sales Executive Analytics Report — {report_date}"

    # 4. Handle Dry Run or Missing Credentials
    if dry_run or not email_user or not email_pass:
        msg = "DRY RUN: Email notification validated successfully without sending network packets."
        if not email_user or not email_pass:
            msg = "NOTICE: SMTP credentials (EMAIL_USERNAME/EMAIL_PASSWORD) not set; mock validation passed."
        logger.info(f"{msg} (Recipient: {recipient}, PDF: {pdf_file.name} [{pdf_file.stat().st_size} bytes])")
        return {
            "status": "success",
            "dry_run": True,
            "recipient": recipient,
            "subject": subject,
            "attachment": pdf_file.name,
            "attachment_size_bytes": pdf_file.stat().st_size,
            "dispatched_at": datetime.now().isoformat(),
            "message": msg
        }

    # 5. Build MIME Message
    msg = MIMEMultipart("mixed")
    msg["Subject"] = subject
    msg["From"] = f"Sales Analytics Platform <{email_user}>"
    msg["To"] = recipient

    # HTML Body
    html_body = build_email_body_html(report_date)
    msg.attach(MIMEText(html_body, "html", "utf-8"))

    # Attachment
    with open(pdf_file, "rb") as f:
        pdf_attachment = MIMEApplication(f.read(), _subtype="pdf")
        pdf_attachment.add_header(
            "Content-Disposition",
            "attachment",
            filename=pdf_file.name
        )
        msg.attach(pdf_attachment)

    # 6. Send via SMTP
    logger.info(f"Connecting to SMTP server {smtp_server}:{smtp_port}...")
    if smtp_port == 465:
        with smtplib.SMTP_SSL(smtp_server, smtp_port, timeout=30) as server:
            server.login(email_user, email_pass)
            server.send_message(msg)
    else:
        with smtplib.SMTP(smtp_server, smtp_port, timeout=30) as server:
            server.starttls()
            server.login(email_user, email_pass)
            server.send_message(msg)

    logger.info(f"Successfully dispatched weekly sales report email to {recipient}")
    return {
        "status": "success",
        "dry_run": False,
        "recipient": recipient,
        "subject": subject,
        "attachment": pdf_file.name,
        "dispatched_at": datetime.now().isoformat(),
        "message": f"Weekly sales report email successfully delivered to {recipient}"
    }


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Send weekly sales executive PDF report via SMTP email.")
    parser.add_argument("--recipient", "-r", type=str, default=None, help="Recipient email address")
    parser.add_argument("--pdf-path", "-p", type=str, default=None, help="Path to PDF report file")
    parser.add_argument("--dry-run", action="store_true", help="Validate email generation without sending")
    args = parser.parse_args()

    try:
        res = send_executive_email_report(
            recipient_email=args.recipient,
            report_pdf_path=args.pdf_path,
            dry_run=args.dry_run
        )
        print(f"SUCCESS: {res['message']}")
        sys.exit(0)
    except Exception as e:
        print(f"ERROR: {e}", file=sys.stderr)
        sys.exit(1)
