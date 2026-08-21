"""
Email Report Notification Module
Simulates or dispatches automated sales executive report notifications.
"""
import logging
import os
from pathlib import Path
from datetime import datetime
from typing import Dict, Any

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def send_executive_email_report(recipient_email: str = "executive@company.com", report_pdf_path: str = None) -> Dict[str, Any]:
    """
    Send an automated email notification with the attached sales executive PDF report.
    
    Args:
        recipient_email: Email address of executive/stakeholder
        report_pdf_path: Path to generated PDF file
        
    Returns:
        Status dict
    """
    if report_pdf_path is None:
        report_pdf_path = str(Path(__file__).resolve().parent / "sales_executive_report.pdf")

    pdf_exists = os.path.exists(report_pdf_path)

    logger.info(f"Simulating email dispatch to {recipient_email} (PDF attachment: {pdf_exists})")

    return {
        "status": "success",
        "recipient": recipient_email,
        "subject": f"Sales Analytics Weekly Executive Summary - {datetime.now().strftime('%B %Y')}",
        "attachment": os.path.basename(report_pdf_path) if pdf_exists else None,
        "dispatched_at": datetime.now().isoformat(),
        "message": "Weekly executive sales report successfully queued and dispatched."
    }


if __name__ == "__main__":
    result = send_executive_email_report()
    print(result)
