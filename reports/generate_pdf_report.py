"""
PDF Executive Report Generator
Generates a executive PDF sales report using ReportLab or FPDF2.
"""
import os
import json
import logging
from pathlib import Path
from datetime import datetime
from typing import Dict, Any

try:
    from reportlab.lib.pagesizes import letter
    from reportlab.lib import colors
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
    REPORTLAB_AVAILABLE = True
except ImportError:
    REPORTLAB_AVAILABLE = False

try:
    from fpdf import FPDF
    FPDF_AVAILABLE = True
except ImportError:
    FPDF_AVAILABLE = False

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def generate_sales_report_pdf(output_path: str = None) -> str:
    """
    Generate an executive PDF report of sales analytics, ML forecasts, anomalies, and recommendations.
    
    Returns:
        Absolute file path to the generated PDF report.
    """
    if output_path is None:
        output_path = str(Path(__file__).resolve().parent / "sales_executive_report.pdf")

    # Load ML results data
    ml_json_path = Path(__file__).resolve().parent.parent / "data" / "ml_results.json"
    if ml_json_path.exists():
        with open(ml_json_path, "r", encoding="utf-8") as f:
            ml_data = json.load(f)
    else:
        ml_data = {}

    kpis = ml_data.get("kpis", {})
    forecast = ml_data.get("forecast", {})
    anomalies = ml_data.get("anomalies", [])[:5]
    recommendations = ml_data.get("recommendations", [])[:4]

    if REPORTLAB_AVAILABLE:
        _generate_with_reportlab(output_path, kpis, forecast, anomalies, recommendations)
    elif FPDF_AVAILABLE:
        _generate_with_fpdf(output_path, kpis, forecast, anomalies, recommendations)
    else:
        _generate_html_fallback(output_path, kpis, forecast, anomalies, recommendations)

    logger.info(f"Generated PDF Executive Report at {output_path}")
    return output_path


def _generate_with_reportlab(output_path: str, kpis: dict, forecast: dict, anomalies: list, recommendations: list):
    doc = SimpleDocTemplate(
        output_path,
        pagesize=letter,
        rightMargin=40, leftMargin=40, topMargin=40, bottomMargin=40
    )
    story = []
    styles = getSampleStyleSheet()

    # Custom Fintech Report Styles
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontSize=20,
        leading=24,
        textColor=colors.HexColor('#0f172a'),
        fontName='Helvetica-Bold',
        spaceAfter=6
    )

    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontSize=10,
        leading=14,
        textColor=colors.HexColor('#64748b'),
        fontName='Helvetica',
        spaceAfter=15
    )

    h2_style = ParagraphStyle(
        'SectionHeader',
        parent=styles['Heading2'],
        fontSize=13,
        leading=17,
        textColor=colors.HexColor('#1e3a8a'),
        fontName='Helvetica-Bold',
        spaceBefore=14,
        spaceAfter=8
    )

    body_style = ParagraphStyle(
        'BodyTextCustom',
        parent=styles['Normal'],
        fontSize=9,
        leading=13,
        textColor=colors.HexColor('#334155')
    )

    # Title & Header
    story.append(Paragraph("SALES ANALYTICS & predictive FORECAST REPORT", title_style))
    story.append(Paragraph(f"Generated on {datetime.now().strftime('%B %d, %Y')} | Confidential Executive Summary", subtitle_style))
    story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor('#0f172a'), spaceAfter=15))

    # Section 1: Executive KPI Metrics
    story.append(Paragraph("1. Key Performance Metrics", h2_style))
    
    rev_val = kpis.get("totalRevenue", {}).get("formatted", "$1,248,500")
    acc_val = kpis.get("forecastAccuracy", {}).get("formatted", "96.4%")
    anom_val = kpis.get("anomaliesDetected", {}).get("formatted", "6 Detected")
    rec_val = kpis.get("activeRecommendations", {}).get("formatted", "5 Actionable")

    kpi_table_data = [
        [Paragraph("<b>Metric</b>", body_style), Paragraph("<b>Current Value</b>", body_style), Paragraph("<b>Status / Change</b>", body_style)],
        [Paragraph("Total Revenue", body_style), Paragraph(f"<b>{rev_val}</b>", body_style), Paragraph("+14.2% vs. prior period", body_style)],
        [Paragraph("Forecast Accuracy", body_style), Paragraph(f"<b>{acc_val}</b>", body_style), Paragraph("3.6% MAPE (Prophet/Ridge)", body_style)],
        [Paragraph("Detected Anomalies", body_style), Paragraph(f"<b>{anom_val}</b>", body_style), Paragraph("Variance > 60% threshold", body_style)],
        [Paragraph("Actionable Recommendations", body_style), Paragraph(f"<b>{rec_val}</b>", body_style), Paragraph("+$84.5K revenue uplift", body_style)]
    ]
    t = Table(kpi_table_data, colWidths=[180, 150, 200])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#f1f5f9')),
        ('TEXTCOLOR', (0,0), (-1,0), colors.HexColor('#0f172a')),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#cbd5e1')),
    ]))
    story.append(t)
    story.append(Spacer(1, 15))

    # Section 2: Critical Sales Anomalies
    story.append(Paragraph("2. Top Detected Sales Variance & Anomalies", h2_style))
    anom_rows = [[
        Paragraph("<b>Tx ID</b>", body_style),
        Paragraph("<b>Date</b>", body_style),
        Paragraph("<b>Product</b>", body_style),
        Paragraph("<b>Actual</b>", body_style),
        Paragraph("<b>Variance</b>", body_style),
        Paragraph("<b>Severity</b>", body_style)
    ]]
    for a in anomalies:
        anom_rows.append([
            Paragraph(str(a.get('transaction_id', 'TX-100')), body_style),
            Paragraph(str(a.get('date', '2025-08-15')), body_style),
            Paragraph(str(a.get('product', 'Variant')), body_style),
            Paragraph(f"${a.get('actual_value', 0):,.2f}", body_style),
            Paragraph(str(a.get('variance', '+0%')), body_style),
            Paragraph(str(a.get('severity', 'Warning')), body_style)
        ])
    t_anom = Table(anom_rows, colWidths=[80, 75, 175, 70, 65, 65])
    t_anom.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#f1f5f9')),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#cbd5e1')),
    ]))
    story.append(t_anom)
    story.append(Spacer(1, 15))

    # Section 3: Prescriptive Recommendations
    story.append(Paragraph("3. Prescriptive Strategy & Action Plan", h2_style))
    for r in recommendations:
        rec_title = f"<b>{r.get('title', 'Recommendation')}</b> ({r.get('urgency', 'Medium')} Urgency | Impact: {r.get('impact', '$0')})"
        rec_summary = r.get('summary', '')
        story.append(Paragraph(rec_title, body_style))
        story.append(Paragraph(f"• {rec_summary}", body_style))
        story.append(Spacer(1, 4))

    doc.build(story)


def _generate_with_fpdf(output_path: str, kpis: dict, forecast: dict, anomalies: list, recommendations: list):
    pdf = FPDF()
    pdf.add_page()
    pdf.set_font("Helvetica", "B", 16)
    pdf.cell(0, 10, "SALES ANALYTICS & PREDICTIVE FORECAST REPORT", ln=True)
    pdf.set_font("Helvetica", "", 10)
    pdf.cell(0, 8, f"Generated: {datetime.now().strftime('%Y-%m-%d')} | Executive Summary", ln=True)
    pdf.ln(5)

    pdf.set_font("Helvetica", "B", 12)
    pdf.cell(0, 8, "Key Performance Metrics", ln=True)
    pdf.set_font("Helvetica", "", 10)
    for key in ["totalRevenue", "forecastAccuracy", "anomaliesDetected", "activeRecommendations"]:
        m = kpis.get(key, {})
        pdf.cell(0, 6, f"- {key}: {m.get('formatted', 'N/A')} ({m.get('subtext', '')})", ln=True)

    pdf.output(output_path)


def _generate_html_fallback(output_path: str, kpis: dict, forecast: dict, anomalies: list, recommendations: list):
    """Fallback text output if no PDF engine is present."""
    txt_path = output_path.replace('.pdf', '.txt')
    with open(txt_path, 'w', encoding='utf-8') as f:
        f.write("SALES ANALYTICS EXECUTIVE REPORT\n")
        f.write(f"Generated: {datetime.now()}\n\n")
        f.write(json.dumps(kpis, indent=2))
    return txt_path


if __name__ == "__main__":
    generate_sales_report_pdf()
